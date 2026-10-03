import { NextRequest, NextResponse } from "next/server";
import { extractText } from "unpdf";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) {
      return NextResponse.json({ error: "No file was uploaded." }, { status: 400 });
    }

    // Validate MIME type before processing
    if (file.type !== "application/pdf" && !file.name.endsWith(".pdf")) {
      return NextResponse.json(
        { error: "Invalid file type. Please upload a valid PDF document." },
        { status: 400 }
      );
    }

    // Check API Key
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "Gemini API key is missing. Please add your GEMINI_API_KEY in .env.local and restart the server.",
        },
        { status: 500 }
      );
    }

    // unpdf: pure WebAssembly PDF parser — works in all environments including Vercel serverless
    const arrayBuffer = await file.arrayBuffer();
    let pdfText = "";
    try {
      const { text: pages } = await extractText(new Uint8Array(arrayBuffer), {
        mergePages: true,
      });
      pdfText = Array.isArray(pages) ? pages.join("\n") : String(pages || "");
    } catch (parseErr) {
      console.error("PDF Parsing Error:", parseErr);
      return NextResponse.json(
        {
          error:
            "Could not parse the PDF file. The file may be password protected or corrupted.",
        },
        { status: 422 }
      );
    }

    if (!pdfText || pdfText.trim().length < 20) {
      return NextResponse.json(
        {
          error:
            "No readable text found in this PDF. It appears to be an image-only scan without an OCR text layer. Please upload a PDF with selectable text.",
        },
        { status: 422 }
      );
    }

    const prompt = `
      You are a Forensic Financial Auditor. Analyze the contract text.
      1. Extract the exact Principal Amount (as a number), APR/Interest Rate (as a number, e.g., 15.5), and Loan Term in months (as a number).
      2. Identify the Currency of the loan document (ISO 3-letter code e.g. INR, USD, EUR, GBP, JPY, CAD, AUD, CHF, BRL, SGD, AED, CNY) and currency symbol. If not explicitly specified otherwise, default to "INR" with symbol "₹".
      3. Identify 3 "Hidden Gotchas" or predatory terms in the fine print.
      4. Write a 2-sentence Plain English summary of the loan.
      
      Format your response as a CLEAN JSON object ONLY. Do not include markdown formatting or backticks:
      {
        "principal": number,
        "currency": "INR",
        "currencySymbol": "₹",
        "apr": number,
        "termMonths": number,
        "gotchas": ["string", "string", "string"],
        "plainEnglishSummary": "string"
      }

      Contract Text: ${pdfText.substring(0, 15000)} 
    `;

    const genAI = new GoogleGenerativeAI(apiKey);

    // Model fallback chain — uses Gemini 3.8 Flash and stable fallbacks
    const MODELS = [
      "gemini-3.8-flash",
      "gemini-3.7-flash",
      "gemini-3.5-flash",
      "gemini-3.5-flash-lite",
    ];
    let result;
    let lastError: unknown;

    for (const modelName of MODELS) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        result = await model.generateContent(prompt);
        if (result?.response?.text()) {
          break; // success — stop trying
        }
      } catch (err: unknown) {
        lastError = err;
        const msg = err instanceof Error ? err.message : String(err);
        console.warn(`Model ${modelName} encountered issue: ${msg}. Attempting fallback...`);
      }
    }

    if (!result) {
      const errorMsg =
        lastError instanceof Error
          ? lastError.message
          : "Failed to communicate with AI model.";
      return NextResponse.json(
        { error: `AI Analysis Error: ${errorMsg}` },
        { status: 502 }
      );
    }

    // Strip out markdown formatting if the LLM includes it
    const rawText = result.response.text();
    const responseText = rawText.replace(/```json/g, "").replace(/```/g, "").trim();

    // Safely parse JSON from the LLM
    let analysis;
    try {
      analysis = JSON.parse(responseText);
    } catch {
      console.error("Malformed AI response text:", responseText);
      return NextResponse.json(
        { error: "AI returned invalid response format. Please try again." },
        { status: 502 }
      );
    }

    // --- DETERMINISTIC MATH ENGINE ---
    let finalPayback = 0;
    const schedule: { name: string; Interest: number; Principal: number; Remaining: number }[] = [];

    const P = Number(analysis.principal);
    const apr = Number(analysis.apr);
    const n = Number(analysis.termMonths);

    if (P && n && !isNaN(P) && !isNaN(n)) {
      if (apr === 0 || !apr || isNaN(apr)) {
        finalPayback = P;
      } else {
        const r = (apr / 100) / 12;
        const M = (P * (r * Math.pow(1 + r, n))) / (Math.pow(1 + r, n) - 1);
        finalPayback = parseFloat((M * n).toFixed(2));

        let currentBalance = P;
        let cumulativeInterest = 0;
        let cumulativePrincipal = 0;

        for (let month = 1; month <= n; month++) {
          const interestPayment = currentBalance * r;
          const principalPayment = M - interestPayment;

          currentBalance -= principalPayment;
          cumulativeInterest += interestPayment;
          cumulativePrincipal += principalPayment;

          if (month % 12 === 0 || month === n) {
            schedule.push({
              name: `Month ${month}`,
              Interest: parseFloat(cumulativeInterest.toFixed(0)),
              Principal: parseFloat(cumulativePrincipal.toFixed(0)),
              Remaining: Math.max(0, parseFloat(currentBalance.toFixed(0))),
            });
          }
        }
      }
    }

    analysis.principal = P || 0;
    analysis.apr = apr || 0;
    analysis.termMonths = n || 0;
    analysis.totalPayback = finalPayback > 0 ? finalPayback : P || 0;
    analysis.schedule = schedule;

    return NextResponse.json(analysis);
  } catch (error) {
    console.error("Analysis Error:", error);
    const errorMsg =
      error instanceof Error ? error.message : "Failed to analyze document.";
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}