import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI, type Part } from "@google/generative-ai";
import { extractPdfContent } from "@/lib/document-extractor";

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

    // Hybrid Document Extractor:
    // 1. Digital PDF -> Direct fast text extraction (no OCR needed)
    // 2. Scanned PDF -> Fallback to PaddleOCR (services/document_extractor.py)
    // 3. Fallback safety net -> Multimodal Gemini document vision
    const arrayBuffer = await file.arrayBuffer();
    const extraction = await extractPdfContent(arrayBuffer);

    const hasExtractedText = extraction.text && extraction.text.trim().length > 0;

    const prompt = `
      You are a Forensic Financial Auditor. Analyze the contract ${hasExtractedText ? "text" : "document"}.
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

      ${hasExtractedText ? `Contract Text:\n${extraction.text.substring(0, 30000)}` : "Please review the attached scanned contract document, extract the text/terms via OCR, and return the structured financial data."}
    `;

    // Build payload: if scanned document without extracted text layer, pass PDF inline for multimodal OCR
    const contentPayload: (string | Part)[] = [prompt];
    if (!hasExtractedText) {
      contentPayload.push({
        inlineData: {
          data: Buffer.from(arrayBuffer).toString("base64"),
          mimeType: "application/pdf",
        },
      });
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    // Model fallback chain (prioritizing available high-speed multimodal models)
    const MODELS = [
      "gemini-2.0-flash",
      "gemini-1.5-flash",
      "gemini-2.5-flash",
      "gemini-3.8-flash",
      "gemini-3.7-flash",
      "gemini-3.5-flash",
    ];
    let result;
    let lastError: unknown;

    for (const modelName of MODELS) {
      // Allow up to 2 attempts for transient 503 / 429 high demand spikes
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const model = genAI.getGenerativeModel({ model: modelName });
          result = await model.generateContent(contentPayload);
          if (result?.response?.text()) {
            break; // success — got response
          }
        } catch (err: unknown) {
          lastError = err;
          const msg = err instanceof Error ? err.message : String(err);
          const isTransient =
            msg.includes("503") ||
            msg.includes("high demand") ||
            msg.includes("429") ||
            msg.includes("RESOURCE_EXHAUSTED");

          if (isTransient && attempt === 0) {
            console.warn(
              `Model ${modelName} reported high demand (503). Retrying in 1.2s...`
            );
            await new Promise((resolve) => setTimeout(resolve, 1200));
            continue;
          }

          console.warn(
            `Model ${modelName} failed (${msg}). Trying next fallback model...`
          );
          break; // move to next model
        }
      }
      if (result) break;
    }

    if (!result) {
      const errorMsg =
        lastError instanceof Error
          ? lastError.message
          : "Failed to communicate with AI model.";
      return NextResponse.json(
        {
          error:
            "Google AI servers are currently experiencing high demand. Please try uploading again in a few moments.",
          details: errorMsg,
        },
        { status: 503 }
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