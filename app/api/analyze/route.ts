import { NextRequest, NextResponse } from "next/server";
import { PDFParse } from "pdf-parse";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const parser = new PDFParse({ data: buffer });
    const pdfResult = await parser.getText();
    const pdfText = pdfResult.text;
    
    // UPDATED PROMPT: We no longer ask the LLM to calculate the total.
    // We only ask it to extract the raw integers/decimals.
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
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

    const result = await model.generateContent(prompt);
    
    // Strip out markdown formatting if the LLM stubbornly includes it
    let responseText = result.response.text().replace(/```json/g, "").replace(/```/g, "").trim();
    const analysis = JSON.parse(responseText);

    // --- ARCHITECT-ZERO DETERMINISTIC MATH ENGINE ---
    let finalPayback = 0;
    let schedule = [];

    const P = analysis.principal;
    const apr = analysis.apr;
    const n = analysis.termMonths;

    if (P && n) {
      if (apr === 0 || !apr) {
        finalPayback = P;
      } else {
        const r = (apr / 100) / 12; // Monthly rate
        const M = P * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1); // Monthly payment
        finalPayback = parseFloat((M * n).toFixed(2));

        // Generate the month-by-month timeline for the chart
        let currentBalance = P;
        let cumulativeInterest = 0;
        let cumulativePrincipal = 0;

        for (let month = 1; month <= n; month++) {
          const interestPayment = currentBalance * r;
          const principalPayment = M - interestPayment;
          
          currentBalance -= principalPayment;
          cumulativeInterest += interestPayment;
          cumulativePrincipal += principalPayment;

          // We only save every 12th month (yearly) to keep the chart clean, 
          // plus the very last month.
          if (month % 12 === 0 || month === n) {
            schedule.push({
              name: `Month ${month}`,
              Interest: parseFloat(cumulativeInterest.toFixed(0)),
              Principal: parseFloat(cumulativePrincipal.toFixed(0)),
              Remaining: Math.max(0, parseFloat(currentBalance.toFixed(0)))
            });
          }
        }
      }
    }

    analysis.totalPayback = finalPayback > 0 ? finalPayback : "Error";
    analysis.schedule = schedule; // Attach the timeline to the response

    return NextResponse.json(analysis);

  } catch (error) {
    console.error("Analysis Error:", error);
    return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
  }
}