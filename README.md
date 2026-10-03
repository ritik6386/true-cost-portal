# True Cost Portal

> **Forensic AI Loan Document Parser & Deterministic Amortization Engine**

**True Cost Portal** is an open-source, privacy-first financial audit tool designed to cut through dense lending agreements. It pairs generative AI for semantic clause deconstruction with an independent deterministic TypeScript calculation engine to expose hidden fees, predatory terms, and true payback liabilities.

---

## Architecture: Hybrid LLM + Deterministic Math

Large language models excel at comprehending complex legal contracts, but are prone to compounding hallucinations when calculating financial amortization schedules. 

True Cost Portal enforces a strict separation of concerns:
```
┌─────────────────────────┐       ┌──────────────────────────────┐       ┌─────────────────────────┐
│   Contract PDF Upload   │  ──►  │    Gemini 3.8 Flash Model    │  ──►  │   Deterministic Engine  │
│  (In-Memory WASM Parse) │       │ (Extract Terms, APR, Traps)  │       │ (Pure TypeScript Math)  │
└─────────────────────────┘       └──────────────────────────────┘       └─────────────────────────┘
                                                                                      │
                                                                                      ▼
                                                                         ┌─────────────────────────┐
                                                                         │ Interactive Audit Report│
                                                                         │  & Amortization Visuals │
                                                                         └─────────────────────────┘
```

1. **Semantic Extraction:** Google Gemini reads the contract text to extract key parameters: Principal, APR, Term length, Currency, and fine-print "Gotchas" (prepayment penalties, surge default rates, arbitration mandates).
2. **Deterministic Calculation:** A pure TypeScript mathematical engine computes exact monthly EMIs, total interest accrual, remaining balances, and periodic amortization schedules.
3. **Zero-Knowledge Memory:** PDFs are processed in volatile RAM via WebAssembly (`unpdf`) and immediately garbage-collected. No database, zero disk persistence, and no third-party tracking.

---

## Key Features & Recent Enhancements

### 1. Dual-Theme Engine (Daylight & Night Mode)
- **Primary Daylight Aesthetic:** Clean, daylight-optimized theme using subtle slate surfaces, royal blue accents, and high-contrast typography.
- **Sophisticated Night Mode:** Dark aesthetic (`bg-zinc-950`) featuring neon purple and cyan ambient glow fields, glowing dashed dropzone borders, and glassmorphic cards.
- **Interactive Switcher:** Instant theme toggling via header button, automatically persisting user preferences in `localStorage`.

### 2. Global Multi-Currency System (INR Default)
- **Primary Indian Rupee (`INR` / `₹`) Calculation:** Standardized default calculation and localized formatting (`en-IN`) for Indian loans and EMIs.
- **Autonomous Currency Detection:** The AI forensic parser inspects uploaded contracts to detect native currency units (`USD`, `EUR`, `GBP`, `JPY`, `CAD`, `AUD`, `CHF`, `BRL`, `SGD`, `AED`, `CNY`) and automatically recalculates all charts and metrics in that currency.
- **Manual Currency Selector:** Interactive header dropdown allowing instant conversion across 12 global currencies.

### 3. Upgraded Gemini 3.8 Flash Integration
- **Next-Gen Model Pipeline:** Upgraded model execution pipeline targeting GA `gemini-3.8-flash` with multi-tier resilient fallback (`gemini-3.7-flash`, `gemini-3.5-flash`).
- **Comprehensive Diagnostics:** Real-time validation for missing environment variables, detailed API exception handling, and guardrails for scanned/non-OCR PDFs.

### 4. Cross-Platform Build Determinism
- **Consistent Compiler Flags:** Configured `forceConsistentCasingInFileNames: true` in `tsconfig.json` ensuring seamless compilation parity between Windows, macOS, and Linux CI/CD environments.

---

## Project Directory Structure

```
true-cost-portal/
├── app/
│   ├── api/
│   │   └── analyze/
│   │       └── route.ts         # PDF text extraction & Gemini 3.8 Flash audit pipeline
│   ├── favicon.ico              # Application favicon
│   ├── globals.css              # Design tokens, Tailwind CSS v4 setup & theme variables
│   ├── layout.tsx               # Root application shell with dynamic theme provider
│   └── page.tsx                 # Core UI: Dropzone, Currency Selector, Theme Engine & Charts
├── components/
│   └── ui/                      # Reusable UI primitives (Cards, Buttons)
├── lib/
│   └── utils.ts                 # Class merger utilities (clsx + tailwind-merge)
├── .env.example                 # Template for required environment variables
├── .env.local                   # Local secret configuration (git-ignored)
├── .gitignore                   # Version control ignore rules
├── components.json              # Shadcn component configuration
├── eslint.config.mjs            # ESLint 9 configuration
├── next.config.ts               # Next.js configuration
├── package.json                 # Project dependencies & scripts
├── postcss.config.mjs           # PostCSS configuration for Tailwind CSS v4
├── tsconfig.json                # TypeScript compiler settings (strict mode & casing rules)
└── README.md                    # Project documentation
```

---

## Tech Stack

- **Framework:** [Next.js 16](https://nextjs.org/) (App Router, Turbopack)
- **Language:** [TypeScript 5](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
- **Motion & Transitions:** [Framer Motion](https://www.framer.com/motion/)
- **Visualizations:** [Recharts](https://recharts.org/)
- **Iconography:** [Lucide React](https://lucide.dev/)
- **PDF Extraction:** [unpdf](https://github.com/unjs/unpdf) (WebAssembly text parser)
- **AI Engine:** [Google Gemini 3.8 Flash](https://ai.google.dev/) via `@google/generative-ai`

---

## Legal & Financial Advisory Warning

> [!WARNING]
> **NOT FINANCIAL OR LEGAL ADVICE**
> 
> True Cost Portal is an experimental, automated analysis tool built strictly for educational and informational purposes. 
> - **No Advisory Relationship:** Use of this application does not create a financial advisory, legal, fiduciary, or attorney-client relationship.
> - **Automated Estimates:** Calculations, clause extractions, and plain-English summaries are generated using algorithmic and artificial intelligence models that may not account for every jurisdiction-specific lending statute or unlisted fee.
> - **Consult Licensed Counsel:** Consumer credit agreements, promissory notes, and mortgages are legally binding instruments with significant long-term obligations. Always review your contracts with an independent certified financial advisor or legal counsel before signing.

---

## Repository & Attribution

- **Maintainer:** [ritik.2vedi](https://github.com/ritik6386/true-cost-portal)
- **License:** Copyright © 2026 [ritik.2vedi](https://github.com/ritik6386/true-cost-portal). All rights reserved.
