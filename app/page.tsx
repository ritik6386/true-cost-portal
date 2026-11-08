"use client";

import React, { useState, useEffect } from "react";
import {
  UploadCloud,
  ShieldCheck,
  Calculator,
  Lock,
  AlertTriangle,
  ArrowRight,
  RotateCcw,
  Sparkles,
  FileText,
  CheckCircle2,
  TrendingDown,
  Code2,
  Sun,
  Moon,
  Coins,
  ExternalLink,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  CurrencyConfig,
  SUPPORTED_CURRENCIES,
  formatCurrency,
  formatCompactCurrency,
  adaptSummaryCurrency,
} from "@/lib/currencies";

export type { CurrencyConfig };
export {
  SUPPORTED_CURRENCIES,
  formatCurrency,
  formatCompactCurrency,
  adaptSummaryCurrency,
};

interface AnalysisResult {
  principal: number;
  apr: number;
  termMonths: number;
  currency?: string;
  currencySymbol?: string;
  gotchas: string[];
  plainEnglishSummary: string;
  totalPayback: number | "Error";
  schedule: {
    name: string;
    Interest: number;
    Principal: number;
    Remaining: number;
  }[];
}

/**
 * High-performance, lag-free Typewriter component.
 * Displays character-by-character reveals with a retro cyan/purple cursor.
 */
function TypewriterText({
  text,
  speed = 14,
  delay = 0,
  className = "",
  cursor = true,
}: {
  text: string;
  speed?: number;
  delay?: number;
  className?: string;
  cursor?: boolean;
}) {
  const [charCount, setCharCount] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    let current = 0;

    const startTimer = setTimeout(() => {
      timer = setInterval(() => {
        if (current < text.length) {
          current += 1;
          setCharCount(current);
        } else if (timer) {
          clearInterval(timer);
        }
      }, speed);
    }, delay);

    return () => {
      clearTimeout(startTimer);
      if (timer) clearInterval(timer);
    };
  }, [text, speed, delay]);

  const displayed = text.slice(0, charCount);
  const isDone = charCount >= text.length;

  return (
    <span className={className}>
      {displayed}
      {cursor && !isDone && (
        <span className="inline-block w-1.5 h-3.5 bg-cyan-400 dark:bg-cyan-300 animate-pulse ml-0.5 align-middle shadow-[0_0_8px_#22d3ee]" />
      )}
    </span>
  );
}

const SAMPLE_CONTRACT: AnalysisResult = {
  principal: 500000,
  apr: 14.5,
  termMonths: 60,
  currency: "INR",
  currencySymbol: "₹",
  gotchas: [
    "Foreclosure / Prepayment Penalty: 2.5% fee if settled in full before month 24.",
    "Surge Default Rate: APR surges to 24.00% p.a. immediately upon any 30-day late EMI.",
    "Mandatory Arbitration: Strips consumer court forum rights and requires private arbitration.",
  ],
  plainEnglishSummary:
    "This is a 5-year loan of ₹5,00,000 at a 14.5% APR. Over 60 months, you will pay ₹2,06,455 in interest alone, bringing your total payback to ₹7,06,455 with a monthly payment of ₹11,774.",
  totalPayback: 706455,
  schedule: [
    { name: "Year 1", Interest: 68195, Principal: 73096, Remaining: 426904 },
    { name: "Year 2", Interest: 123694, Principal: 157597, Remaining: 342403 },
    { name: "Year 3", Interest: 165084, Principal: 256207, Remaining: 243793 },
    { name: "Year 4", Interest: 193240, Principal: 368051, Remaining: 131949 },
    { name: "Year 5", Interest: 206455, Principal: 500000, Remaining: 0 },
  ],
};

export default function Home() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [selectedCurrency, setSelectedCurrency] = useState<string>("INR");
  const [isMounted, setIsMounted] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isCurrencyInfoOpen, setIsCurrencyInfoOpen] = useState(false);
  const [streamStatus, setStreamStatus] = useState<string>("Initializing forensic audit...");
  const [streamBuffer, setStreamBuffer] = useState<string>("");

  // Synchronize theme with localStorage and root DOM (Primary: Light Mode, Primary Currency: INR)
  useEffect(() => {
    setIsMounted(true);
    const saved = localStorage.getItem("truecost_theme") as "light" | "dark" | null;
    const initialTheme = saved || "light"; // Primary mode is Light (Daylight)

    setTheme(initialTheme);
    if (initialTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    const savedCurr = localStorage.getItem("truecost_currency");
    if (savedCurr && SUPPORTED_CURRENCIES.some((c) => c.code === savedCurr)) {
      setSelectedCurrency(savedCurr);
    } else {
      setSelectedCurrency("INR"); // Primary calculation currency is INR
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem("truecost_theme", nextTheme);
    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const handleCurrencyChange = (newCode: string) => {
    setSelectedCurrency(newCode);
    localStorage.setItem("truecost_currency", newCode);
  };

  const handleFile = async (file: File) => {
    if (!file) return;

    if (file.type !== "application/pdf" && !file.name.endsWith(".pdf")) {
      setError("Please upload a valid PDF document.");
      return;
    }

    // Immediately trigger fullscreen loading stage
    setLoading(true);
    setAnalysis(null);
    setError(null);
    setFileName(file.name);
    setStreamBuffer("");
    setStreamStatus("Scanning loan agreement & decompiling repayment schedule in volatile RAM...");

    try {
      const formData = new FormData();
      formData.append("file", file);

      // Connect to the Server-Sent Events (SSE) streaming endpoint
      const response = await fetch("/api/analyze/stream", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.detail || "Failed to analyze document.");
      }

      if (!response.body) {
        throw new Error("Streaming readable body not supported in this browser.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let pendingChunk = "";
      let completedResult: AnalysisResult | null = null;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        pendingChunk += decoder.decode(value, { stream: true });
        const lines = pendingChunk.split("\n\n");
        pendingChunk = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data:")) continue;

          const jsonPayload = trimmed.replace(/^data:\s*/, "");
          try {
            const event = JSON.parse(jsonPayload);
            if (event.type === "status") {
              setStreamStatus(event.message);
            } else if (event.type === "token") {
              setStreamBuffer((prev) => prev + event.chunk);
            } else if (event.type === "complete") {
              completedResult = event.data as AnalysisResult;
              setAnalysis(completedResult);
              if (completedResult.currency) {
                const found = SUPPORTED_CURRENCIES.find(
                  (c) => c.code.toUpperCase() === String(completedResult?.currency).toUpperCase()
                );
                if (found) {
                  handleCurrencyChange(found.code);
                }
              }
            } else if (event.type === "error") {
              throw new Error(event.message || "Streaming analysis failed.");
            }
          } catch (e: unknown) {
            if (e instanceof Error && e.message.includes("Streaming analysis failed")) {
              throw e;
            }
          }
        }
      }

      if (!completedResult) {
        // Fallback: If streaming didn't emit complete event, try traditional endpoint
        const fallbackRes = await fetch("/api/analyze", {
          method: "POST",
          body: formData,
        });
        if (fallbackRes.ok) {
          const fallbackData = await fallbackRes.json();
          setAnalysis(fallbackData);
        }
      }
    } catch (err: unknown) {
      console.error("Analysis failed:", err);
      const message =
        err instanceof Error
          ? err.message
          : "Analysis failed. Please check your PDF and try again.";
      setError(message);
      setAnalysis(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSample = () => {
    setLoading(true);
    setError(null);
    setFileName("Sample-Auto-Loan-Agreement.pdf");
    setStreamBuffer("");
    setStreamStatus("Scanning loan agreement & decompiling repayment schedule in volatile RAM...");

    setTimeout(() => {
      setAnalysis(SAMPLE_CONTRACT);
      setSelectedCurrency("INR");
      setLoading(false);
    }, 1400);
  };

  const handleReset = () => {
    setAnalysis(null);
    setError(null);
    setFileName(null);
    setLoading(false);
  };

  const isDark = theme === "dark";

  return (
    <div className="relative min-h-screen xl:h-screen xl:overflow-hidden bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 font-sans selection:bg-blue-500/20 dark:selection:bg-cyan-500/30 selection:text-blue-900 dark:selection:text-cyan-200 transition-colors duration-300 flex flex-col justify-between">
      {/* Ambient Glow & Grid Accents */}
      <div
        className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
        aria-hidden="true"
      >
        {isDark ? (
          <>
            <div className="absolute -top-32 left-1/4 w-[500px] h-[350px] bg-purple-600/12 rounded-full blur-[140px]" />
            <div className="absolute top-20 right-1/4 w-[450px] h-[300px] bg-cyan-500/10 rounded-full blur-[130px]" />
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-purple-900/10 rounded-full blur-[160px]" />
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#27272a12_1px,transparent_1px),linear-gradient(to_bottom,#27272a12_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_60%_at_50%_15%,#000_60%,transparent_100%)]" />
          </>
        ) : (
          <>
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(37,99,235,0.08),rgba(255,255,255,0))]" />
            <div className="absolute top-10 right-1/3 w-[450px] h-[250px] bg-blue-100/50 rounded-full blur-[120px]" />
          </>
        )}
      </div>

      {/* Top Navigation Header (Exact h-14 box model) */}
      <header className="w-full shrink-0 border-b border-slate-200/80 dark:border-zinc-800/80 bg-white/85 dark:bg-zinc-950/80 backdrop-blur-xl z-50 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-5 h-14 flex items-center justify-between">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-2.5">
            <div
              className={`size-8 rounded-xl flex items-center justify-center transition-all duration-300 ${
                isDark
                  ? "bg-gradient-to-br from-purple-500/20 via-zinc-900 to-cyan-500/20 border border-purple-500/40 text-cyan-400 shadow-[0_0_12px_rgba(168,85,247,0.25)]"
                  : "bg-blue-600 text-white shadow-sm shadow-blue-500/20"
              }`}
            >
              <TrendingDown size={16} strokeWidth={2.2} />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base tracking-tight text-slate-900 dark:text-white">
                True Cost Portal
              </span>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded-full border transition-colors ${
                  isDark
                    ? "bg-cyan-950/60 border-cyan-800/60 text-cyan-300"
                    : "bg-blue-50 border-blue-200/70 text-blue-700"
                }`}
              >
                v1.2
              </span>
            </div>
          </div>

          {/* Privacy Indicator, Multi-Currency Info, Theme Toggle, & GitHub */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div
              className={`hidden md:inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-[11px] font-mono border transition-colors ${
                isDark
                  ? "bg-zinc-900/80 border-zinc-800 text-zinc-400"
                  : "bg-slate-100 border-slate-200 text-slate-600"
              }`}
            >
              <span
                className={`size-2 rounded-full ${
                  isDark
                    ? "bg-cyan-400 shadow-[0_0_8px_#22d3ee] animate-pulse"
                    : "bg-emerald-500"
                }`}
              />
              <span>100% IN-MEMORY AUDIT</span>
            </div>

            {/* Multi-Currency Interactive Info Pill & Modal / Popover */}
            {isMounted && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsCurrencyInfoOpen((prev) => !prev)}
                  title="Multi-Currency Support & Automatic Detection"
                  aria-label="Multi-Currency Support Information"
                  className={`size-8 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-200 cursor-pointer border shadow-sm ${
                    isDark
                      ? isCurrencyInfoOpen
                        ? "bg-cyan-500/20 text-cyan-300 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.4)]"
                        : "bg-zinc-900 hover:bg-zinc-800 text-cyan-400 border-zinc-800 hover:border-cyan-500/50 hover:shadow-[0_0_12px_rgba(6,182,212,0.25)]"
                      : isCurrencyInfoOpen
                      ? "bg-blue-100 text-blue-700 border-blue-400 shadow-blue-500/20 shadow-md"
                      : "bg-slate-100 hover:bg-slate-200/90 text-blue-600 border-slate-200 hover:border-blue-300"
                  }`}
                >
                  <span className="font-serif italic font-black text-sm select-none leading-none">
                    i
                  </span>
                </button>

                <AnimatePresence>
                  {isCurrencyInfoOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsCurrencyInfoOpen(false)}
                      />

                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -6 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -6 }}
                        transition={{ duration: 0.18, ease: "easeOut" }}
                        className={`absolute right-0 top-11 z-50 w-72 sm:w-80 p-4 rounded-2xl border shadow-xl backdrop-blur-xl ${
                          isDark
                            ? "bg-zinc-900/95 border-zinc-800 text-zinc-200 shadow-[0_10px_35px_rgba(0,0,0,0.6),0_0_20px_rgba(6,182,212,0.15)]"
                            : "bg-white/95 border-slate-200/90 text-slate-800 shadow-xl shadow-slate-300/40"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`size-8 rounded-xl flex items-center justify-center shrink-0 ${
                              isDark
                                ? "bg-cyan-500/15 text-cyan-300 border border-cyan-500/30"
                                : "bg-blue-50 text-blue-600 border border-blue-200/70"
                            }`}
                          >
                            <Coins size={16} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                                Multi-Currency Support
                              </h4>
                              <span
                                className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full border ${
                                  isDark
                                    ? "bg-emerald-950/60 text-emerald-400 border-emerald-800/60"
                                    : "bg-emerald-50 text-emerald-700 border-emerald-200"
                                }`}
                              >
                                Auto-Detect
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 leading-relaxed">
                              This portal automatically detects and standardizes contract currencies (e.g. ₹ INR, $ USD, € EUR, £ GBP, ¥ JPY) directly from your uploaded loan document.
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Theme Toggle Button */}
            {isMounted && (
              <button
                id="theme-toggle-btn"
                onClick={toggleTheme}
                aria-label="Toggle Light/Dark Theme"
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-medium border transition-all duration-200 cursor-pointer ${
                  isDark
                    ? "bg-zinc-900 hover:bg-zinc-800 text-amber-300 border-zinc-800 shadow-[0_0_12px_rgba(251,191,36,0.15)]"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"
                }`}
              >
                {isDark ? (
                  <>
                    <Sun size={13} className="text-amber-400" />
                    <span className="hidden sm:inline">Light</span>
                  </>
                ) : (
                  <>
                    <Moon size={13} className="text-indigo-600" />
                    <span className="hidden sm:inline">Dark</span>
                  </>
                )}
              </button>
            )}

            {/* GitHub Link */}
            <a
              href="https://github.com/ritik6386/true-cost-portal"
              target="_blank"
              rel="noreferrer"
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-medium border transition-all duration-200 ${
                isDark
                  ? "text-zinc-300 bg-zinc-900/90 hover:bg-zinc-800 hover:text-white border-zinc-800/90"
                  : "text-slate-700 bg-white hover:bg-slate-100 border-slate-200 shadow-sm"
              }`}
            >
              <Code2
                size={13}
                className={isDark ? "text-purple-400" : "text-blue-600"}
              />
              <span className="hidden sm:inline">GitHub</span>
              <ExternalLink size={10} className="text-slate-400 ml-0.5" />
            </a>
          </div>
        </div>
      </header>

      {/* Main Single-Viewport Geometric Layout Container */}
      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-2 sm:py-3 flex-1 flex flex-col justify-center min-h-0">
        {loading ? (
          /* ==========================================================
             VIEW C: Full-Window Forensic Decompilation Loading Screen
             Replaces the dropzone immediately on upload with live typewriter log
             ========================================================== */
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.25 }}
            className="w-full max-w-3xl mx-auto p-6 sm:p-8 rounded-3xl border shadow-2xl backdrop-blur-xl flex flex-col justify-between my-auto transition-all"
            style={{
              backgroundColor: isDark ? "rgba(9, 9, 11, 0.85)" : "rgba(255, 255, 255, 0.95)",
              borderColor: isDark ? "rgba(168, 85, 247, 0.3)" : "rgba(219, 234, 254, 1)",
              boxShadow: isDark ? "0 0 50px rgba(168,85,247,0.15)" : "0 20px 40px rgba(37,99,235,0.08)",
            }}
          >
            {/* Top Status Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-zinc-800">
              <div className="flex items-center gap-3">
                <div
                  className={`size-9 rounded-xl flex items-center justify-center ${
                    isDark
                      ? "bg-purple-500/20 text-cyan-400 border border-purple-500/40"
                      : "bg-blue-50 text-blue-600 border border-blue-200"
                  }`}
                >
                  <FileText size={18} />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                    Volatile Memory Decompilation
                  </h3>
                  <p className="text-[11px] font-mono text-slate-500 dark:text-zinc-400">
                    Target: {fileName || "Uploaded Contract.pdf"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-cyan-400 animate-ping" />
                <span className="text-[11px] font-mono uppercase tracking-wider text-cyan-600 dark:text-cyan-400 font-bold">
                  Enclave Active
                </span>
              </div>
            </div>

            {/* Typewriter Forensic Progress Log */}
            <div className="my-6 space-y-4">
              <div
                className={`p-4 rounded-2xl border ${
                  isDark
                    ? "bg-zinc-950/80 border-zinc-800 text-zinc-200"
                    : "bg-slate-50 border-slate-200/80 text-slate-800"
                }`}
              >
                <div className="flex items-center gap-2 mb-2 text-xs font-mono font-semibold text-blue-600 dark:text-cyan-400">
                  <div className="size-2 rounded-full bg-blue-600 dark:bg-cyan-400 animate-pulse" />
                  <span>PHASE 01 // LOAN_DECOMPILATION</span>
                </div>
                <p className="text-xs sm:text-sm leading-relaxed font-sans min-h-[38px]">
                  <TypewriterText
                    text="Scanning loan agreement & decompiling repayment schedule in volatile RAM..."
                    speed={14}
                    delay={100}
                  />
                </p>
              </div>

              <div
                className={`p-4 rounded-2xl border ${
                  isDark
                    ? "bg-zinc-950/80 border-purple-500/25 text-zinc-200"
                    : "bg-purple-50/50 border-purple-200/70 text-slate-800"
                }`}
              >
                <div className="flex items-center gap-2 mb-2 text-xs font-mono font-semibold text-purple-600 dark:text-purple-400">
                  <div className="size-2 rounded-full bg-purple-600 dark:bg-purple-400 animate-pulse" />
                  <span>PHASE 02 // PREDATORY_CLAUSE_AUDIT</span>
                </div>
                <p className="text-xs sm:text-sm leading-relaxed font-sans min-h-[38px]">
                  <TypewriterText
                    text="Analyzing fine print clauses for prepayment penalties, surge default rates, and mandatory binding arbitration..."
                    speed={12}
                    delay={800}
                  />
                </p>
              </div>
            </div>

            {/* Stream token chunk ticker (if tokens arriving) */}
            {streamBuffer && (
              <div className="mb-4 p-2.5 rounded-xl bg-slate-950 text-cyan-300 font-mono text-[10px] max-h-20 overflow-y-auto leading-relaxed border border-slate-800">
                <span className="text-slate-500 block mb-1">{"// INCOMING_STREAM_CHUNK"}</span>
                <span className="whitespace-pre-wrap break-all">{streamBuffer.slice(-160)}</span>
              </div>
            )}

            {/* Bottom Enclave Safeguard Bar */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-zinc-800 text-[11px] font-mono text-slate-500 dark:text-zinc-500">
              <span className="flex items-center gap-1.5">
                <ShieldCheck size={13} className="text-emerald-500" />
                Zero Disk Persistence Enforced
              </span>
              <span>COMPUTING_DETERMINISTIC_MATH...</span>
            </div>
          </motion.div>
        ) : !analysis ? (
          /* ==========================================================
             VIEW A: Pre-Analysis Compact Viewport (Hero + Uploader + Feature Grid)
             Fits 100% within 1080p and 900p displays with 0 scroll needed
             ========================================================== */
          <div className="flex flex-col items-center justify-between gap-3 sm:gap-4 my-auto">
            {/* Compressed Hero Headline Box */}
            <div className="text-center max-w-2xl">
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium mb-2 border transition-all ${
                  isDark
                    ? "bg-zinc-900/90 text-purple-300 border-purple-500/30 font-mono shadow-[0_0_15px_rgba(168,85,247,0.15)]"
                    : "bg-blue-50 text-blue-700 border-blue-200/80 shadow-sm"
                }`}
              >
                <Sparkles
                  size={12}
                  className={isDark ? "text-cyan-400" : "text-blue-600"}
                />
                <span>
                  {isDark
                    ? "ZERO-KNOWLEDGE LOAN AUDIT"
                    : "AI-Powered Financial Audit"}
                </span>
              </motion.div>

              <h1 className="text-2xl sm:text-4xl lg:text-[42px] font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
                Expose the{" "}
                {isDark ? (
                  <span className="bg-gradient-to-r from-purple-400 via-purple-300 to-cyan-400 bg-clip-text text-transparent drop-shadow-[0_0_25px_rgba(168,85,247,0.3)]">
                    True Cost of Loans.
                  </span>
                ) : (
                  <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    True Cost of Loans.
                  </span>
                )}
              </h1>

              <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 mt-1.5 max-w-lg mx-auto leading-normal">
                Upload any credit agreement or loan PDF to reverse-engineer predatory APR compounding and reveal hidden costs.
              </p>
            </div>

            {/* Geometric Compact Dropzone Box */}
            <div className="w-full max-w-xl">
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  const dropped = e.dataTransfer.files[0];
                  if (dropped) handleFile(dropped);
                }}
                className={`group relative rounded-2xl border-2 border-dashed p-6 sm:p-8 text-center transition-all duration-200 overflow-hidden cursor-pointer ${
                  isDark
                    ? isDragging
                      ? "border-cyan-400 bg-cyan-950/25 shadow-[0_0_40px_rgba(6,182,212,0.35)] scale-[1.01]"
                      : "border-zinc-850 bg-zinc-900/50 hover:border-cyan-400/80 hover:bg-zinc-900/70 hover:shadow-[0_0_25px_rgba(6,182,212,0.2)] backdrop-blur-xl"
                    : isDragging
                    ? "border-blue-600 bg-blue-50/70 shadow-md scale-[1.01]"
                    : "border-slate-300 bg-white hover:border-blue-500 hover:shadow-md shadow-sm"
                }`}
                onClick={() => document.getElementById("file-upload")?.click()}
              >
                <input
                  type="file"
                  id="file-upload"
                  accept=".pdf,application/pdf"
                  className="hidden"
                  onChange={(e) => {
                    const selected = e.target.files?.[0];
                    if (selected) handleFile(selected);
                  }}
                />

                <div className="flex flex-col items-center justify-center space-y-3">
                  <div
                    className={`size-12 rounded-xl flex items-center justify-center transition-all duration-200 ${
                      isDark
                        ? isDragging
                          ? "bg-gradient-to-br from-purple-600 to-cyan-500 text-white scale-105 shadow-[0_0_20px_rgba(6,182,212,0.5)]"
                          : "bg-zinc-950/90 border border-purple-500/30 text-cyan-400 shadow-[0_0_15px_rgba(168,85,247,0.2)] group-hover:border-cyan-400/60"
                        : isDragging
                        ? "bg-blue-600 text-white scale-105 shadow-md shadow-blue-500/20"
                        : "bg-blue-50 text-blue-600 group-hover:bg-blue-100 shadow-sm"
                    }`}
                  >
                    <UploadCloud size={24} strokeWidth={1.9} />
                  </div>

                  <div>
                    <p className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                      Click or drag PDF to analyze
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                      Evaluated 100% in volatile RAM. Never stored on disk.
                    </p>
                    {fileName && (
                      <div className="mt-1 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono border bg-slate-100 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300">
                        <FileText size={11} className={isDark ? "text-cyan-400" : "text-blue-600"} />
                        <span className="truncate max-w-[200px]">{fileName}</span>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div
                    className="pt-1 flex flex-row items-center justify-center gap-3 z-10"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      id="select-document-btn"
                      className={`px-5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 disabled:opacity-50 ${
                        isDark
                          ? "bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-400 text-white shadow-[0_0_20px_rgba(168,85,247,0.3)]"
                          : "bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-600/20"
                      }`}
                      onClick={() =>
                        document.getElementById("file-upload")?.click()
                      }
                      disabled={loading}
                    >
                      <FileText size={14} />
                      <span>Select PDF</span>
                    </button>

                    {!analysis && !loading && (
                      <button
                        id="sample-demo-btn"
                        className={`px-4 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 ${
                          isDark
                            ? "border border-zinc-800 hover:border-zinc-700 bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300"
                            : "border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-100 text-slate-700 shadow-sm"
                        }`}
                        onClick={handleSample}
                      >
                        <span>Try Sample</span>
                        <ArrowRight size={13} className={isDark ? "text-cyan-400" : "text-slate-500"} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Typewriter Stream Output & Loading Notification Inline */}
            {loading && (
              <div
                className={`w-full max-w-xl p-3 rounded-xl border backdrop-blur-md shadow-sm transition-all ${
                  isDark
                    ? "bg-zinc-900/90 border-purple-500/30 text-white shadow-[0_0_25px_rgba(168,85,247,0.15)]"
                    : "bg-white border-blue-100 text-slate-900 shadow-xs"
                }`}
              >
                <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100 dark:border-zinc-800">
                  <div
                    className={`size-3.5 border-2 border-t-transparent rounded-full animate-spin shrink-0 ${
                      isDark ? "border-cyan-400" : "border-blue-600"
                    }`}
                  />
                  <span className="font-semibold text-xs text-slate-800 dark:text-zinc-200">
                    {streamStatus}
                  </span>
                  <span
                    className={`ml-auto text-[10px] font-mono px-1.5 py-0.5 rounded ${
                      isDark ? "bg-cyan-950/80 text-cyan-300" : "bg-blue-50 text-blue-700"
                    }`}
                  >
                    SSE_STREAMING
                  </span>
                </div>

                {/* Real-time Token Typewriter Output Window */}
                {streamBuffer && (
                  <div className="mt-2 p-2 rounded-lg bg-slate-900 text-cyan-300 font-mono text-[11px] max-h-24 overflow-y-auto leading-relaxed border border-slate-800 scrollbar-thin">
                    <pre className="whitespace-pre-wrap break-all font-mono">
                      {streamBuffer}
                      <span className="inline-block w-1.5 h-3.5 bg-cyan-400 animate-pulse ml-0.5 align-middle" />
                    </pre>
                  </div>
                )}
              </div>
            )}

            {error && (
              <div
                className="w-full max-w-xl p-3 rounded-xl bg-red-500/10 border border-red-500/40 text-red-700 dark:text-red-300 flex items-center gap-2.5 text-xs"
                role="alert"
              >
                <AlertTriangle className="size-4 text-red-500 shrink-0" />
                <span className="font-medium">{error}</span>
              </div>
            )}

            {/* Compact 3-Column Geometric Feature Shelf */}
            <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-3">
              <div
                className={`rounded-xl p-3.5 border transition-all ${
                  isDark
                    ? "bg-zinc-900/40 border-zinc-800/80"
                    : "bg-white border-slate-200/80 shadow-xs"
                }`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <div
                    className={`size-6 rounded-md flex items-center justify-center ${
                      isDark
                        ? "bg-cyan-950/70 text-cyan-400"
                        : "bg-emerald-50 text-emerald-600"
                    }`}
                  >
                    <ShieldCheck size={14} />
                  </div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-zinc-100">
                    In-Memory Enclave
                  </h3>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-zinc-400 leading-snug">
                  Processed in volatile RAM. No server logs, zero disk persistence.
                </p>
              </div>

              <div
                className={`rounded-xl p-3.5 border transition-all ${
                  isDark
                    ? "bg-zinc-900/40 border-zinc-800/80"
                    : "bg-white border-slate-200/80 shadow-xs"
                }`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <div
                    className={`size-6 rounded-md flex items-center justify-center ${
                      isDark
                        ? "bg-purple-950/70 text-purple-400"
                        : "bg-blue-50 text-blue-600"
                    }`}
                  >
                    <Calculator size={14} />
                  </div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-zinc-100">
                    Deterministic Math
                  </h3>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-zinc-400 leading-snug">
                  Zero AI hallucination on numbers; exact amortization formulas verify real APR.
                </p>
              </div>

              <div
                className={`rounded-xl p-3.5 border transition-all ${
                  isDark
                    ? "bg-zinc-900/40 border-zinc-800/80"
                    : "bg-white border-slate-200/80 shadow-xs"
                }`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <div
                    className={`size-6 rounded-md flex items-center justify-center ${
                      isDark
                        ? "bg-cyan-950/70 text-cyan-400"
                        : "bg-indigo-50 text-indigo-600"
                    }`}
                  >
                    <Lock size={14} />
                  </div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-zinc-100">
                    Open Source & Verifiable
                  </h3>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-zinc-400 leading-snug">
                  Transparent architecture. Review parsing routines or self-host on GitHub.
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* ==========================================================
             VIEW B: Post-Analysis Unified Geometric Dashboard
             Two-column split view fitting completely within 1 viewport height
             ========================================================== */
          <div className="w-full flex flex-col justify-between h-full gap-2.5 my-auto">
            {/* Top Toolbar Strip (Height: 38px) */}
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                {loading ? (
                  <div
                    className={`size-3.5 border-2 border-t-transparent rounded-full animate-spin shrink-0 ${
                      isDark ? "border-cyan-400" : "border-blue-600"
                    }`}
                  />
                ) : (
                  <CheckCircle2
                    size={16}
                    className={isDark ? "text-cyan-400" : "text-blue-600"}
                  />
                )}
                <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight">
                  {loading ? "Streaming Live Contract Audit..." : "Contract Audit Overview"}
                </h2>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-md border ${
                    isDark
                      ? "bg-zinc-900 border-zinc-800 text-cyan-300"
                      : "bg-blue-50 border-blue-200 text-blue-700"
                  }`}
                >
                  {loading ? streamStatus : `Detected: ${selectedCurrency}`}
                </span>
              </div>

              <button
                onClick={handleReset}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono transition-all cursor-pointer border ${
                  isDark
                    ? "text-zinc-300 hover:text-white bg-zinc-900 border-zinc-800 hover:border-zinc-700"
                    : "text-slate-700 hover:text-slate-900 bg-white border-slate-200 hover:bg-slate-50 shadow-xs"
                }`}
              >
                <RotateCcw size={12} />
                <span>Audit Another</span>
              </button>
            </div>

            {/* Split Screen 2-Column Geometric Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 flex-1 min-h-0 items-stretch">
              {/* LEFT COLUMN: Metric Cards & Predatory Clauses (5 cols) */}
              <div className="lg:col-span-5 flex flex-col gap-3 justify-between">
                {/* The Final Bill Hero Metric Card */}
                <div
                  className={`rounded-2xl p-4 sm:p-5 border flex flex-col justify-between transition-all ${
                    isDark
                      ? "bg-zinc-900/90 border-cyan-500/30 shadow-[0_0_25px_rgba(6,182,212,0.12)] backdrop-blur-md"
                      : "bg-slate-900 text-white border-slate-800 shadow-md"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                      <span className="text-xs font-semibold text-slate-300">
                        The Final Bill
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-semibold border ${
                          isDark
                            ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
                            : "bg-blue-500/20 text-blue-400 border-blue-500/30"
                        }`}
                      >
                        {analysis.apr}% APR
                      </span>
                    </div>

                    <div className="my-3">
                      <span className="text-[10px] uppercase tracking-wider text-slate-400 font-mono">
                        Total Amount You Pay Back
                      </span>
                      <p
                        className={`text-2xl sm:text-3xl font-extrabold mt-0.5 font-mono tracking-tight ${
                          isDark
                            ? "text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-100 to-cyan-400"
                            : "text-white"
                        }`}
                      >
                        {formatCurrency(analysis.totalPayback, selectedCurrency)}
                      </p>
                    </div>

                    <p className="text-[11px] text-slate-300 leading-relaxed min-h-[34px]">
                      <TypewriterText
                        text={adaptSummaryCurrency(analysis.plainEnglishSummary, selectedCurrency)}
                        speed={12}
                        delay={100}
                      />
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-3 pt-2.5 border-t border-slate-800/80 text-xs font-mono">
                    <div className="p-2 rounded-lg bg-slate-800/60 border border-slate-700/50">
                      <span className="text-slate-400 block text-[10px]">Principal</span>
                      <span className="font-semibold text-slate-100 text-xs sm:text-sm">
                        {typeof analysis.principal === "number"
                          ? formatCurrency(analysis.principal, selectedCurrency)
                          : "N/A"}
                      </span>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-800/60 border border-slate-700/50">
                      <span className="text-slate-400 block text-[10px]">Loan Term</span>
                      <span className="font-semibold text-slate-100 text-xs sm:text-sm">
                        {analysis.termMonths} Months
                      </span>
                    </div>
                  </div>
                </div>

                {/* Predatory Gotchas Card */}
                <div
                  className={`rounded-2xl p-4 sm:p-5 border flex-1 flex flex-col justify-between transition-all ${
                    isDark
                      ? "bg-zinc-900/70 border-purple-500/30 shadow-[0_0_20px_rgba(168,85,247,0.1)] backdrop-blur-md"
                      : "bg-white border-red-200/80 shadow-xs"
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <AlertTriangle
                        size={15}
                        className={isDark ? "text-purple-400" : "text-red-600"}
                      />
                      <h3
                        className={`font-bold text-xs sm:text-sm ${
                          isDark ? "text-white" : "text-red-800"
                        }`}
                      >
                        Hidden Traps & Predatory Terms
                      </h3>
                    </div>

                    <ul className="space-y-2 mt-2">
                      {(analysis.gotchas ?? []).slice(0, 3).map((gotcha, index) => (
                        <li
                          key={index}
                          className="flex items-start gap-2 text-xs text-slate-700 dark:text-zinc-300 leading-snug"
                        >
                          <span
                            className={`size-4 rounded-md font-mono text-[10px] flex items-center justify-center shrink-0 mt-0.5 ${
                              isDark
                                ? "bg-purple-500/20 text-purple-300 border border-purple-500/40"
                                : "bg-red-100 text-red-700 font-bold"
                            }`}
                          >
                            0{index + 1}
                          </span>
                          <span className="line-clamp-2">
                            <TypewriterText
                              text={gotcha}
                              speed={10}
                              delay={350 + index * 400}
                            />
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="text-[10px] font-mono text-slate-400 dark:text-zinc-500 pt-2 border-t border-slate-100 dark:border-zinc-800 mt-2">
                    FORENSIC_FLAG: 3_HIGH_RISK_CONDITIONS
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: Amortization Timeline AreaChart (7 cols) */}
              <div
                className={`lg:col-span-7 rounded-2xl p-4 sm:p-5 border flex flex-col justify-between transition-all ${
                  isDark
                    ? "bg-zinc-900/60 border-zinc-800/80 backdrop-blur-md"
                    : "bg-white border-slate-200/80 shadow-xs"
                }`}
              >
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-200 dark:border-zinc-800 mb-2">
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                      Where Your Money Goes Over Time
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                      Principal Repaid vs. Interest Accrual ({selectedCurrency})
                    </p>
                  </div>

                  <div className="flex items-center gap-4 text-[11px] font-mono">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`size-2 rounded-full ${
                          isDark ? "bg-cyan-400 shadow-[0_0_6px_#22d3ee]" : "bg-blue-600"
                        }`}
                      />
                      <span className="text-slate-600 dark:text-zinc-300">Principal</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`size-2 rounded-full ${
                          isDark ? "bg-purple-500 shadow-[0_0_6px_#a855f7]" : "bg-red-500"
                        }`}
                      />
                      <span className="text-slate-600 dark:text-zinc-300">Interest</span>
                    </div>
                  </div>
                </div>

                {/* Geometric Chart Canvas - Pixel calibrated for zero overflow */}
                <div className="w-full h-[220px] sm:h-[260px] lg:h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={analysis.schedule}
                      margin={{ top: 8, right: 8, left: -14, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="chartPrincipal" x1="0" y1="0" x2="0" y2="1">
                          <stop
                            offset="5%"
                            stopColor={isDark ? "#06b6d4" : "#2563eb"}
                            stopOpacity={isDark ? 0.4 : 0.7}
                          />
                          <stop
                            offset="95%"
                            stopColor={isDark ? "#06b6d4" : "#2563eb"}
                            stopOpacity={0.05}
                          />
                        </linearGradient>
                        <linearGradient id="chartInterest" x1="0" y1="0" x2="0" y2="1">
                          <stop
                            offset="5%"
                            stopColor={isDark ? "#a855f7" : "#ef4444"}
                            stopOpacity={isDark ? 0.4 : 0.7}
                          />
                          <stop
                            offset="95%"
                            stopColor={isDark ? "#a855f7" : "#ef4444"}
                            stopOpacity={0.05}
                          />
                        </linearGradient>
                      </defs>
                      <XAxis
                        dataKey="name"
                        stroke={isDark ? "#71717a" : "#94a3b8"}
                        fontSize={10}
                        fontFamily="monospace"
                        tickLine={false}
                        axisLine={{ stroke: isDark ? "#27272a" : "#e2e8f0" }}
                      />
                      <YAxis
                        stroke={isDark ? "#71717a" : "#94a3b8"}
                        fontSize={10}
                        fontFamily="monospace"
                        tickLine={false}
                        axisLine={{ stroke: isDark ? "#27272a" : "#e2e8f0" }}
                        tickFormatter={(val) =>
                          formatCompactCurrency(val, selectedCurrency)
                        }
                      />
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke={isDark ? "#27272a" : "#f1f5f9"}
                      />
                      <Tooltip
                        formatter={(value) => [
                          formatCurrency(Number(value || 0), selectedCurrency),
                        ]}
                        contentStyle={{
                          backgroundColor: isDark ? "#09090b" : "#0f172a",
                          borderColor: isDark ? "#3f3f46" : "#1e293b",
                          borderRadius: "10px",
                          color: "#fff",
                          fontSize: "11px",
                          fontFamily: "monospace",
                          padding: "6px 10px",
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="Principal"
                        stroke={isDark ? "#22d3ee" : "#2563eb"}
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#chartPrincipal)"
                        stackId="1"
                      />
                      <Area
                        type="monotone"
                        dataKey="Interest"
                        stroke={isDark ? "#c084fc" : "#ef4444"}
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#chartInterest)"
                        stackId="1"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Compact Disclaimer Bar at Bottom of Card */}
                <div className="text-[10px] text-slate-400 dark:text-zinc-500 pt-2 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between">
                  <span>Informational algorithmic estimate only. Not certified financial advice.</span>
                  <span className="font-mono">STATUS: 100% DETERMINISTIC</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Geometric Compact Footer (Height: 36px) */}
      <footer className="w-full shrink-0 border-t border-slate-200/80 dark:border-zinc-850 bg-white/80 dark:bg-zinc-950/80 py-2 text-xs text-slate-500 dark:text-zinc-500 backdrop-blur-md transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-5 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-emerald-500 shadow-sm" />
            <span className="font-mono text-slate-700 dark:text-zinc-400 font-medium text-[11px]">
              True Cost Portal v1.2
            </span>
          </div>
          <div className="flex items-center gap-4 text-slate-500 dark:text-zinc-500 font-mono text-[10px]">
            <span>100% In-Memory</span>
            <span>•</span>
            <span>Zero Third-Party Storage</span>
            <span>•</span>
            <a
              href="https://github.com/ritik6386/true-cost-portal"
              target="_blank"
              rel="noreferrer"
              className="hover:text-blue-600 dark:hover:text-cyan-400 transition-colors underline-offset-2 hover:underline"
            >
              ritik.2vedi
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}