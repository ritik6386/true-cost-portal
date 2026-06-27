import { NextRequest, NextResponse } from "next/server";
import { extractText } from "unpdf";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

    // Validate MIME type before processing
    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "Invalid file type. Please upload a PDF." }, { status: 400 });
    }

    // unpdf: pure WebAssembly PDF parser — works in all environments including Vercel serverless
    const arrayBuffer = await file.arrayBuffer();
    const { text: pages } = await extractText(new Uint8Array(arrayBuffer), { mergePages: true });
    const pdfText = Array.isArray(pages) ? pages.join("\n") : String(pages);

    const prompt = `
      You are a Forensic Financial Auditor. Analyze the contract text.
      1. Extract the exact Principal Amount (as a number), APR/Interest Rate (as a number, e.g., 15.5), and Loan Term in months (as a number).
      2. Identify 3 "Hidden Gotchas".
      3. Write a 2-sentence Plain English summary of the loan.
      
      Format your response as a CLEAN JSON object ONLY. Do not include markdown formatting or backticks:
      {
        "principal": number,
        "apr": number,
        "termMonths": number,
        "gotchas": ["string", "string", "string"],
        "plainEnglishSummary": "string"
      }

      Contract Text: ${pdfText.substring(0, 10000)} 
    `;

    // Model fallback chain — tries each in order if one is overloaded (503)
    const MODELS = ["gemini-2.5-flash", "gemini-2.0-flash-001", "gemini-2.0-flash-lite"];
    let result;
    let lastError: unknown;
    for (const modelName of MODELS) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        result = await model.generateContent(prompt);
        break; // success — stop trying
      } catch (err: unknown) {
        lastError = err;
        const msg = err instanceof Error ? err.message : String(err);
        const isRetryable = msg.includes("503") || msg.includes("overloaded") ||
                            msg.includes("Service Unavailable") || msg.includes("404") ||
                            msg.includes("not found");
        if (isRetryable) {
          console.warn(`Model ${modelName} unavailable, trying next...`);
          continue;
        }
        throw err;
      }
    }
    if (!result) throw lastError;

    // Strip out markdown formatting if the LLM stubbornly includes it
    const responseText = result.response.text().replace(/```json/g, "").replace(/```/g, "").trim();

    // Safely guard against malformed JSON from the LLM
    let analysis;
    try {
      analysis = JSON.parse(responseText);
    } catch {
      return NextResponse.json({ error: "AI returned invalid JSON. Please try again." }, { status: 502 });
    }

    // --- DETERMINISTIC MATH ENGINE ---
    let finalPayback = 0;
    const schedule: { name: string; Interest: number; Principal: number; Remaining: number }[] = [];

    const P = analysis.principal;
    const apr = analysis.apr;
    const n = analysis.termMonths;

    if (P && n) {
      if (apr === 0 || !apr) {
        finalPayback = P;
      } else {
        const r = (apr / 100) / 12;
        const M = P * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
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

    analysis.totalPayback = finalPayback > 0 ? finalPayback : "Error";
    analysis.schedule = schedule;

    return NextResponse.json(analysis);

  } catch (error) {
    console.error("Analysis Error:", error);
    return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
  }
}