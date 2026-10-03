# The True Cost Portal 

> **Most loan contracts are designed to confuse you. We built this to fix that.**

Drop in any loan agreement, mortgage contract, or auto financing PDF. We scan the fine print, call out the hidden gotchas in plain English, and calculate the exact dollar amount you'll end up paying back.

---

## Why we built this

Ever tried reading a 30-page loan agreement? Banks and lenders bury the details people care about most in dense legal jargon — things like:
- Prepayment penalties (charging you a fee just for paying off your loan early).
- Sneaky balloon payments and sudden rate jumps.
- Mandatory arbitration clauses that strip your legal rights.
- Deceptively "low" rates that add up to massive interest bills over time.

**The True Cost** cuts through the noise. It extracts the raw terms and runs the real amortization math so you know what you're getting into before you sign.

---

## How it works (and why we don't let AI do the math)

Large language models are great at reading dense legal text, but notoriously bad at doing math without hallucinating.

We use a hybrid approach:
1. **AI for Reading:** Google Gemini parses the contract to extract the loan principal, APR, term length, and fine-print traps.
2. **TypeScript for Math:** Our deterministic math engine computes the amortization schedule, monthly payment, and total interest paid using standard financial formulas.
3. **Interactive Visuals:** You get a clean timeline chart showing exactly how much of your monthly payments go toward interest vs. the actual principal.

---

## Features

- **No AI math hallucinations:** Clean separation between text parsing (Gemini) and calculations (TypeScript).
- **Plain-English summaries:** Translates legal disclaimers into 2-sentence takeaways anyone can understand.
- **Hidden gotcha alerts:** Flags penalty fees, variable rate triggers, and clauses that cost you money.
- **Visual payback timeline:** Interactive chart showing how your balance and interest accumulate over time.
- **In-memory & private:** Your PDF is processed in memory during the request and never saved to a database or stored on disk.
- **Serverless & lightweight:** Uses WebAssembly-based PDF parsing (`unpdf`), meaning zero native binary issues on deployment platforms like Vercel.


## Under the Hood

- **Frontend:** Next.js 16 (App Router), React 19, Tailwind CSS v4, Framer Motion
- **Visuals:** Recharts for amortization area charts, Lucide for icons
- **AI Model:** Google Gemini 2.0 Flash via `@google/generative-ai`
- **PDF Extraction:** `unpdf` (pure WebAssembly PDF text parser)

---

## Contributing & Feedback

Have ideas for better clause detection, caught an edge case in a contract format, or want to add support for different amortization types? Pull requests and issues are welcome!

---

## License
@LIET// ritik.2vedi



