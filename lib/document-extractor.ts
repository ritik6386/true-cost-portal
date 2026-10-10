import { extractText } from "unpdf";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";

const execFileAsync = promisify(execFile);

export interface ExtractionResult {
  text: string;
  source: "digital" | "ocr_python" | "scanned_needs_multimodal";
  charCount: number;
}

/**
 * Safely extracts JSON object from process stdout even if logging prefixes exist.
 */
interface ExtractorOutput {
  success?: boolean;
  text?: string;
  error?: string;
}

function parseJsonOutput(raw: string): ExtractorOutput | null {
  if (!raw || !raw.trim()) return null;
  try {
    return JSON.parse(raw.trim());
  } catch {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch {
        return null;
      }
    }
    return null;
  }
}

/**
 * Attempts digital text extraction using unpdf (WebAssembly PDF parser).
 */
export async function extractDigitalText(buffer: ArrayBuffer): Promise<string> {
  try {
    const { text: pages } = await extractText(new Uint8Array(buffer), {
      mergePages: true,
    });
    return Array.isArray(pages) ? pages.join("\n") : String(pages || "");
  } catch (err) {
    console.warn("Digital text extraction failed:", err);
    return "";
  }
}

/**
 * Attempts OCR extraction by invoking services/document_extractor.py
 */
export async function extractViaPythonOCR(buffer: ArrayBuffer): Promise<string | null> {
  const scriptPath = path.join(process.cwd(), "services", "document_extractor.py");

  // Verify extractor script exists
  try {
    await fs.access(scriptPath);
  } catch {
    return null;
  }

  const tempFile = path.join(os.tmpdir(), `ocr_${Date.now()}_${Math.random().toString(36).substring(7)}.pdf`);

  try {
    await fs.writeFile(tempFile, Buffer.from(buffer));

    let stdoutText = "";
    try {
      const { stdout } = await execFileAsync("python", [scriptPath, tempFile, "--json"], {
        timeout: 45000,
      });
      stdoutText = stdout;
    } catch (procErr: unknown) {
      // If Python process returned non-zero, check if stdout contains valid JSON report
      const err = procErr as { stdout?: string };
      if (err && typeof err.stdout === "string" && err.stdout.trim()) {
        stdoutText = err.stdout;
      } else {
        throw procErr;
      }
    }

    const parsed = parseJsonOutput(stdoutText);
    if (parsed && parsed.success && parsed.text && parsed.text.trim().length > 0) {
      return parsed.text.trim();
    }
    return null;
  } catch (err) {
    console.warn("Python OCR bridge note:", err instanceof Error ? err.message : String(err));
    return null;
  } finally {
    try {
      await fs.unlink(tempFile);
    } catch {
      // ignore cleanup errors
    }
  }
}

/**
 * Hybrid PDF Pipeline:
 * 1. Digital extraction first (fast path - 0.05s)
 * 2. If text >= 30 characters, use digital text directly (no OCR needed)
 * 3. If scanned (< 30 characters), fallback to Python OCR extractor
 * 4. If Python OCR is not configured/available, flag for multimodal vision fallback
 */
export async function extractPdfContent(buffer: ArrayBuffer): Promise<ExtractionResult> {
  // Step 1: Digital text extraction
  const digitalText = await extractDigitalText(buffer);
  const cleanDigital = digitalText.trim();

  if (cleanDigital.length >= 30) {
    return {
      text: cleanDigital,
      source: "digital",
      charCount: cleanDigital.length,
    };
  }

  // Step 2: Fallback to Python OCR for scanned PDFs
  const ocrText = await extractViaPythonOCR(buffer);
  if (ocrText && ocrText.trim().length >= 20) {
    return {
      text: ocrText.trim(),
      source: "ocr_python",
      charCount: ocrText.trim().length,
    };
  }

  // Step 3: Flag as scanned PDF needing direct multimodal vision OCR
  return {
    text: cleanDigital, // may be short or empty
    source: "scanned_needs_multimodal",
    charCount: cleanDigital.length,
  };
}
