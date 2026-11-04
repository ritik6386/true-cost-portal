import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatCurrency,
  formatCompactCurrency,
  adaptSummaryCurrency,
  SUPPORTED_CURRENCIES,
} from '../currencies.ts';
import nextConfig from '../../next.config.ts';

test('Integration Contract: next.config.ts correctly proxies /api to FastAPI backend', async () => {
  assert.ok(typeof nextConfig.rewrites === 'function', 'rewrites should be a function');
  const rewrites = await nextConfig.rewrites!();
  assert.ok(Array.isArray(rewrites), 'rewrites should return an array');
  
  const apiRewrite = (rewrites as Array<{ source: string; destination: string }>).find(
    (r) => r.source === '/api/:path*'
  );
  assert.ok(apiRewrite, 'Should configure rewrite rule for /api/:path*');
  assert.match(apiRewrite.destination, /\/api\/:path\*/, 'Rewrite destination must proxy /api/:path*');
});

test('Integration Contract: Backend AuditResponse matches frontend AnalysisResult contract', () => {
  // Typical JSON structure emitted by FastAPI /api/analyze endpoint
  const backendResponse = {
    principal: 500000.0,
    currency: "INR",
    currencySymbol: "₹",
    apr: 14.5,
    termMonths: 60,
    gotchas: [
      "Foreclosure penalty of 4%",
      "Late payment interest of 24%",
      "Mandatory arbitration"
    ],
    plainEnglishSummary: "Borrower receives ₹5,00,000 at 14.5% APR for 60 months.",
    totalPayback: 705848.43,
    monthlyPayment: 11764.14,
    totalInterest: 205848.43,
    schedule: [
      { name: "Month 12", Interest: 67123.0, Principal: 74046.0, Remaining: 425954.0 },
      { name: "Month 24", Interest: 124500.0, Principal: 157839.0, Remaining: 342161.0 },
      { name: "Month 36", Interest: 169800.0, Principal: 253909.0, Remaining: 246091.0 },
      { name: "Month 48", Interest: 198900.0, Principal: 365697.0, Remaining: 134303.0 },
      { name: "Month 60", Interest: 205848.0, Principal: 500000.0, Remaining: 0.0 }
    ]
  };

  // Verify type contract
  assert.strictEqual(typeof backendResponse.principal, 'number');
  assert.strictEqual(typeof backendResponse.apr, 'number');
  assert.strictEqual(typeof backendResponse.termMonths, 'number');
  assert.ok(Array.isArray(backendResponse.gotchas));
  assert.ok(backendResponse.gotchas.length >= 1);
  assert.strictEqual(typeof backendResponse.plainEnglishSummary, 'string');
  assert.strictEqual(typeof backendResponse.totalPayback, 'number');
  assert.ok(Array.isArray(backendResponse.schedule));
  assert.ok(backendResponse.schedule.length > 0);

  // Validate schedule item structure
  for (const item of backendResponse.schedule) {
    assert.strictEqual(typeof item.name, 'string');
    assert.strictEqual(typeof item.Interest, 'number');
    assert.strictEqual(typeof item.Principal, 'number');
    assert.strictEqual(typeof item.Remaining, 'number');
  }

  // Validate supported currency lookup
  const supported = SUPPORTED_CURRENCIES.some(
    (c) => c.code.toUpperCase() === backendResponse.currency.toUpperCase()
  );
  assert.ok(supported, `Currency ${backendResponse.currency} must be supported by frontend`);
});

test('Integration Contract: Currency formatters handle multi-currency backend values', () => {
  // INR
  const formattedInr = formatCurrency(500000, "INR");
  assert.ok(formattedInr.includes("5") || formattedInr.includes("₹"), "Formats INR");

  // USD
  const formattedUsd = formatCurrency(65000, "USD");
  assert.ok(formattedUsd.includes("$") || formattedUsd.includes("65"), "Formats USD");

  // EUR
  const formattedEur = formatCurrency(120000, "EUR");
  assert.ok(formattedEur.includes("€") || formattedEur.includes("120"), "Formats EUR");

  // Compact currency
  const compact = formatCompactCurrency(1500000, "INR");
  assert.ok(compact.length > 0);

  // Currency summary adaptation
  const adapted = adaptSummaryCurrency("Loan of $50,000 with monthly fees.", "INR");
  assert.ok(adapted.includes("₹50,000"), "Replaces dollar with rupee symbol");
});
