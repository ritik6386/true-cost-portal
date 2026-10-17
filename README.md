# True Cost Portal

> **Forensic AI Loan Document Parser & Deterministic Amortization Engine**

**True Cost Portal** is an open-source, privacy-first financial audit tool designed to cut through dense lending agreements. It pairs generative AI for semantic clause deconstruction with an independent deterministic TypeScript calculation engine to expose hidden fees, predatory terms, and true payback liabilities.

---

### Architecture: Decoupled Python FastAPI + Next.js

Large language models excel at comprehending complex legal contracts, but are prone to compounding hallucinations when calculating financial amortization schedules. 

True Cost Portal enforces a strict separation of concerns across a decoupled Client-API architecture:
```
┌─────────────────────────────────┐        ┌────────────────────────────────────────────────────────┐
│     Next.js 16 Presentation     │  ───►  │             Python FastAPI Asynchronous Backend        │
│   (Dropzone, UI, Theme, Charts) │  ◄───  │             (Port 8000 / Proxy rewrite on /api/*)      │
└─────────────────────────────────┘        └────────────────────────────────────────────────────────┘
                                                                        │
                                           ┌────────────────────────────┼───────────────────────────┐
                                           │                            │                           │
                                           ▼                            ▼                           ▼
                             ┌───────────────────────────┐┌───────────────────────────┐┌───────────────────────────┐
                             │    Document Extractor     ││  Gemini 3.8 Flash Client  ││   Amortization Engine     │
                             │   (100% In-Memory PyMuPDF)││ (Structured Pydantic JSON)││   (Pure Python Math)      │
                             └───────────────────────────┘└───────────────────────────┘└───────────────────────────┘
```

1. **In-Memory Text Extraction:** PyMuPDF parses uploaded loan PDF bytes entirely in volatile memory with zero temporary disk writes, maintaining a strict Zero-Knowledge privacy model.
2. **Forensic Semantic Parsing:** Google Gemini (via the `google-genai` SDK) analyzes contract clauses using strict Pydantic v2 structured output enforcement (`response_schema`), extracting Principal, APR, Term length, Currency, and fine-print "Gotchas".
3. **Deterministic Math Calculation:** An isolated Python `AmortizationEngine` computes monthly EMIs, total interest accrual, remaining balances, and periodic milestone schedules.
4. **Interactive Audit Dashboard:** Next.js proxies `/api/*` to the FastAPI backend and visualizes the audited liabilities via Recharts and Framer Motion.

---

## Key Features & Capabilities

### 1. High-Performance Asynchronous Python FastAPI Backend
- **Dedicated Microservice:** Fully decoupled backend running on Uvicorn (`http://127.0.0.1:8000`) with auto-generated OpenAPI documentation at `/docs` and `/redoc`.
- **Zero-Disk In-Memory Processing:** True Zero-Knowledge memory processing without writing any uploaded contracts to disk.
- **Strict Pydantic v2 Schema Validation:** Automatic schema enforcement guarantees exact output typing without brittle regex sanitization.

### 2. Dual-Theme Engine (Daylight & Night Mode)
- **Primary Daylight Aesthetic:** Clean, daylight-optimized theme using subtle slate surfaces, royal blue accents, and high-contrast typography.
- **Sophisticated Night Mode:** Dark aesthetic (`bg-zinc-950`) featuring neon purple and cyan ambient glow fields, glowing dashed dropzone borders, and glassmorphic cards.

### 3. Global Multi-Currency System (INR Default)
- **Primary Indian Rupee (`INR` / `₹`) Calculation:** Standardized default calculation and localized formatting (`en-IN`) for Indian loans and EMIs.
- **Autonomous Currency Detection:** The AI forensic parser inspects uploaded contracts to detect native currency units (`USD`, `EUR`, `GBP`, `JPY`, `CAD`, `AUD`, `CHF`, `BRL`, `SGD`, `AED`, `CNY`) and automatically recalculates all charts and metrics in that currency.

### 4. Upgraded Gemini 3.8 Flash Integration
- **Next-Gen Model Pipeline:** Upgraded model execution pipeline targeting GA `gemini-3.8-flash` with multi-tier resilient fallback (`gemini-3.7-flash`, `gemini-3.5-flash`).
- **Resilient Retry Policy:** Configured exponential backoff via `tenacity` for transient network spikes.
- **Scanned PDF Fallback:** Seamless multimodal vision OCR fallback for non-digital or scanned contracts.

---

## Project Directory Structure

```
true-cost-portal/
├── backend/                             # Python FastAPI Asynchronous Backend
│   ├── app/
│   │   ├── api/
│   │   │   └── v1/
│   │   │       ├── endpoints/
│   │   │       │   ├── analyze.py       # POST /api/v1/analyze & /api/analyze
│   │   │       │   └── health.py        # GET /api/v1/health & /api/health
│   │   │       └── router.py            # API V1 router aggregation
│   │   ├── core/
│   │   │   └── config.py                # Pydantic BaseSettings & env loader
│   │   ├── schemas/
│   │   │   └── analysis.py              # Pydantic v2 domain models
│   │   ├── services/
│   │   │   ├── amortization.py          # Deterministic financial math engine
│   │   │   ├── document_extractor.py    # In-memory PyMuPDF extractor
│   │   │   ├── gemini_service.py        # Google GenAI SDK structured client
│   │   │   └── audit_service.py         # Forensic pipeline coordinator
│   │   └── main.py                      # FastAPI application & middleware
│   ├── tests/
│   │   └── test_backend.py              # Pytest test suite
│   └── requirements.txt                 # Backend Python dependencies
│
├── app/                                 # Next.js 16 Presentation Layer
│   ├── favicon.ico
│   ├── globals.css                      # Design tokens, Tailwind CSS v4 setup
│   ├── layout.tsx                       # Root layout & theme provider
│   └── page.tsx                         # Core UI: Dropzone, Currency, Charts
├── components/                          # Reusable UI primitives
├── lib/
│   └── utils.ts                         # Class merger utilities (clsx + tailwind-merge)
├── next.config.ts                       # Proxies /api/* requests to FastAPI backend
├── package.json                         # Scripts & unified runners
└── README.md                            # Documentation
```

---

## Getting Started

### 1. Setup Backend (Python FastAPI)
```bash
# Navigate to backend
cd backend

# Install dependencies
pip install -r requirements.txt

# Run test suite
python -m pytest tests -v

# Start FastAPI dev server on port 8000
python -m uvicorn app.main:app --reload --port 8000
```

### 2. Setup Frontend (Next.js)
```bash
# In the project root
npm install

# Run dev server on port 3000
npm run dev
```

### 3. Unified Runner (Both Services)
```bash
# Runs Next.js frontend (3000) and FastAPI backend (8000) concurrently
npm run dev:all
```

---

## Tech Stack

- **Backend Framework:** [FastAPI](https://fastapi.tiangolo.com/) (ASGI, Python 3.10+)
- **Server:** [Uvicorn](https://www.uvicorn.org/)
- **Data Validation:** [Pydantic v2](https://docs.pydantic.dev/)
- **PDF Extraction:** [PyMuPDF](https://pymupdf.readthedocs.io/) (100% In-Memory RAM execution)
- **AI Engine:** [Google Gemini 3.8 Flash](https://ai.google.dev/) via official `google-genai` SDK
- **Frontend Framework:** [Next.js 16](https://nextjs.org/) (App Router, Turbopack)
- **Language:** [TypeScript 5](https://www.typescriptlang.org/) & [Python 3.10+](https://python.org/)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
- **Motion & Transitions:** [Framer Motion](https://www.framer.com/motion/)
- **Visualizations:** [Recharts](https://recharts.org/)
- **Iconography:** [Lucide React](https://lucide.dev/)

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
