export interface CurrencyConfig {
  code: string;
  symbol: string;
  name: string;
  locale: string;
}

export const SUPPORTED_CURRENCIES: CurrencyConfig[] = [
  { code: "INR", symbol: "₹", name: "INR (₹) - Indian Rupee", locale: "en-IN" },
  { code: "USD", symbol: "$", name: "USD ($) - US Dollar", locale: "en-US" },
  { code: "EUR", symbol: "€", name: "EUR (€) - Euro", locale: "de-DE" },
  { code: "GBP", symbol: "£", name: "GBP (£) - British Pound", locale: "en-GB" },
  { code: "JPY", symbol: "¥", name: "JPY (¥) - Japanese Yen", locale: "ja-JP" },
  { code: "CAD", symbol: "C$", name: "CAD (C$) - Canadian Dollar", locale: "en-CA" },
  { code: "AUD", symbol: "A$", name: "AUD (A$) - Australian Dollar", locale: "en-AU" },
  { code: "CHF", symbol: "CHF", name: "CHF (Fr) - Swiss Franc", locale: "de-CH" },
  { code: "BRL", symbol: "R$", name: "BRL (R$) - Brazilian Real", locale: "pt-BR" },
  { code: "SGD", symbol: "S$", name: "SGD (S$) - Singapore Dollar", locale: "en-SG" },
  { code: "AED", symbol: "AED", name: "AED (د.إ) - UAE Dirham", locale: "ar-AE" },
  { code: "CNY", symbol: "¥", name: "CNY (¥) - Chinese Yuan", locale: "zh-CN" },
];

export const formatCurrency = (
  val: number | "Error",
  currencyCode: string = "INR"
): string => {
  if (typeof val !== "number") return String(val);
  const config =
    SUPPORTED_CURRENCIES.find((c) => c.code === currencyCode) ||
    SUPPORTED_CURRENCIES[0];

  try {
    return new Intl.NumberFormat(config.locale, {
      style: "currency",
      currency: config.code,
      maximumFractionDigits: 0,
    }).format(val);
  } catch {
    return `${config.symbol}${val.toLocaleString()}`;
  }
};

export const formatCompactCurrency = (
  val: number,
  currencyCode: string = "INR"
): string => {
  const config =
    SUPPORTED_CURRENCIES.find((c) => c.code === currencyCode) ||
    SUPPORTED_CURRENCIES[0];

  try {
    return new Intl.NumberFormat(config.locale, {
      style: "currency",
      currency: config.code,
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(val);
  } catch {
    return `${config.symbol}${val}`;
  }
};

export const adaptSummaryCurrency = (
  text: string,
  currencyCode: string
): string => {
  const config =
    SUPPORTED_CURRENCIES.find((c) => c.code === currencyCode) ||
    SUPPORTED_CURRENCIES[0];
  // Replace $ or ₹ followed by numbers with the active currency symbol
  return text.replace(/[$₹]([0-9,.]+)/g, `${config.symbol}$1`);
};
