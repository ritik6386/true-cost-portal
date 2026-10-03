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
  Globe,
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

    setLoading(true);
    setAnalysis(null);
    setError(null);
    setFileName(file.name);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to analyze document.");
      }

      const data = await response.json();
      setAnalysis(data);

      // Auto-switch currency if detected from PDF
      if (data.currency) {
        const found = SUPPORTED_CURRENCIES.find(
          (c) => c.code.toUpperCase() === String(data.currency).toUpperCase()
        );
        if (found) {
          handleCurrencyChange(found.code);
        }
      }
    } catch (err: unknown) {
      console.error("Analysis failed:", err);
      const message =
        err instanceof Error
          ? err.message
          : "Analysis failed. Please check your PDF and try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSample = () => {
    setLoading(true);
    setError(null);
    setFileName("Sample-Auto-Loan-Agreement.pdf");

    setTimeout(() => {
      setAnalysis(SAMPLE_CONTRACT);
      setSelectedCurrency("INR");
      setLoading(false);
    }, 600);
  };

  const handleReset = () => {
    setAnalysis(null);
    setError(null);
    setFileName(null);
    setLoading(false);
  };

  const isDark = theme === "dark";

  return (
    <div className="relative min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 font-sans selection:bg-blue-500/20 dark:selection:bg-cyan-500/30 selection:text-blue-900 dark:selection:text-cyan-200 transition-colors duration-300 overflow-x-hidden">
      {/* Ambient Glow & Grid Accents */}
      <div
        className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
        aria-hidden="true"
      >
        {isDark ? (
          <>
            {/* Night-Mode Neon Purple Glow Top-Left */}
            <div className="absolute -top-32 left-1/4 w-[600px] h-[400px] bg-purple-600/12 rounded-full blur-[140px]" />
            {/* Night-Mode Neon Cyan Glow Top-Right */}
            <div className="absolute top-20 right-1/4 w-[550px] h-[380px] bg-cyan-500/10 rounded-full blur-[130px]" />
            {/* Deep Violet Center Ambient */}
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[700px] h-[450px] bg-purple-900/10 rounded-full blur-[160px]" />
            {/* Dark Mode Blueprint Grid */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#27272a12_1px,transparent_1px),linear-gradient(to_bottom,#27272a12_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_60%_at_50%_15%,#000_60%,transparent_100%)]" />
          </>
        ) : (
          <>
            {/* Daylight Subtle Blue Radial Aura */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(37,99,235,0.08),rgba(255,255,255,0))]" />
            {/* Daylight Soft Ambient Accent */}
            <div className="absolute top-10 right-1/3 w-[500px] h-[300px] bg-blue-100/50 rounded-full blur-[120px]" />
          </>
        )}
      </div>

      {/* Top Navigation Header */}
      <header className="w-full border-b border-slate-200/80 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-950/70 backdrop-blur-xl sticky top-0 z-50 transition-colors duration-300">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3">
            <div
              className={`size-9 rounded-xl flex items-center justify-center transition-all duration-300 ${
                isDark
                  ? "bg-gradient-to-br from-purple-500/20 via-zinc-900 to-cyan-500/20 border border-purple-500/40 text-cyan-400 shadow-[0_0_15px_rgba(168,85,247,0.25)]"
                  : "bg-blue-600 text-white shadow-sm shadow-blue-500/20"
              }`}
            >
              <TrendingDown size={18} strokeWidth={2.2} />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight text-slate-900 dark:text-white">
                True Cost Portal
              </span>
              <span
                className={`text-[11px] font-mono px-2 py-0.5 rounded-full border transition-colors ${
                  isDark
                    ? "bg-cyan-950/60 border-cyan-800/60 text-cyan-300"
                    : "bg-blue-50 border-blue-200/70 text-blue-700"
                }`}
              >
                v1.2
              </span>
            </div>
          </div>

          {/* Privacy Indicator, Global Currency Selector, Theme Toggle, & GitHub */}
          <div className="flex items-center gap-2.5 sm:gap-3.5">
            <div
              className={`hidden lg:inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono border transition-colors ${
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

            {/* Global Currency Selector Dropdown */}
            {isMounted && (
              <div
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-medium transition-all ${
                  isDark
                    ? "bg-zinc-900 border-zinc-800 text-zinc-200 hover:border-zinc-700"
                    : "bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200/70"
                }`}
              >
                <Globe
                  size={14}
                  className={isDark ? "text-cyan-400" : "text-blue-600"}
                />
                <select
                  id="currency-selector"
                  aria-label="Select Currency Format"
                  value={selectedCurrency}
                  onChange={(e) => handleCurrencyChange(e.target.value)}
                  className="bg-transparent text-xs font-mono font-semibold outline-none cursor-pointer pr-1"
                >
                  {SUPPORTED_CURRENCIES.map((curr) => (
                    <option
                      key={curr.code}
                      value={curr.code}
                      className={
                        isDark ? "bg-zinc-900 text-zinc-100" : "bg-white text-slate-900"
                      }
                    >
                      {curr.code} ({curr.symbol})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Theme Toggle Button (Light / Dark Mode Option) */}
            {isMounted && (
              <button
                id="theme-toggle-btn"
                onClick={toggleTheme}
                aria-label="Toggle Light/Dark Theme"
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all duration-200 cursor-pointer ${
                  isDark
                    ? "bg-zinc-900 hover:bg-zinc-800 text-amber-300 border-zinc-800 shadow-[0_0_12px_rgba(251,191,36,0.15)]"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"
                }`}
              >
                {isDark ? (
                  <>
                    <Sun size={14} className="text-amber-400" />
                    <span className="hidden sm:inline">Light</span>
                  </>
                ) : (
                  <>
                    <Moon size={14} className="text-indigo-600" />
                    <span className="hidden sm:inline">Dark</span>
                  </>
                )}
              </button>
            )}

            {/* Open Source GitHub Badge */}
            <a
              href="https://github.com/ritik6386/true-cost-portal"
              target="_blank"
              rel="noreferrer"
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all duration-200 ${
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
              <ExternalLink size={11} className="text-slate-400 ml-0.5" />
            </a>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="max-w-5xl mx-auto px-6 pt-14 pb-24 flex flex-col items-center">
        {/* Hero Section */}
        <section className="text-center max-w-3xl mb-12" id="hero-section">
          {/* Pill Badge */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium mb-6 border transition-all ${
              isDark
                ? "bg-zinc-900/90 text-purple-300 border-purple-500/30 font-mono shadow-[0_0_20px_rgba(168,85,247,0.15)]"
                : "bg-blue-50 text-blue-700 border-blue-200/80 shadow-sm"
            }`}
          >
            <Sparkles
              size={13}
              className={isDark ? "text-cyan-400" : "text-blue-600"}
            />
            <span>
              {isDark
                ? "ZERO-KNOWLEDGE FORENSIC LOAN AUDIT"
                : "AI-Powered Forensic Financial Audit"}
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.12] mb-5 font-sans"
          >
            Expose the{" "}
            {isDark ? (
              <span className="bg-gradient-to-r from-purple-400 via-purple-300 to-cyan-400 bg-clip-text text-transparent drop-shadow-[0_0_35px_rgba(168,85,247,0.3)]">
                True Cost of Loans.
              </span>
            ) : (
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                True Cost of Loans.
              </span>
            )}
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-base sm:text-lg text-slate-600 dark:text-zinc-400 leading-relaxed font-normal max-w-2xl mx-auto"
          >
            Upload any credit agreement or loan PDF. We strip away legal jargon
            and reverse-engineer predatory APR compounding to show you the real
            math banks hide in fine print.
          </motion.p>
        </section>

        {/* Center: Large Interactive Upload Area with Dashed Neon / Clean Border */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="w-full max-w-2xl mb-12"
          id="dropzone-container"
        >
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
            className={`group relative rounded-3xl border-2 border-dashed p-10 sm:p-14 text-center transition-all duration-300 overflow-hidden cursor-pointer ${
              isDark
                ? isDragging
                  ? "border-cyan-400 bg-cyan-950/20 shadow-[0_0_60px_rgba(6,182,212,0.35),inset_0_0_30px_rgba(168,85,247,0.15)] scale-[1.01]"
                  : "border-zinc-800/90 bg-zinc-900/40 hover:border-cyan-400/80 hover:bg-zinc-900/60 hover:shadow-[0_0_35px_rgba(6,182,212,0.2),inset_0_0_20px_rgba(168,85,247,0.08)] backdrop-blur-xl"
                : isDragging
                ? "border-blue-600 bg-blue-50/60 shadow-blue-500/10 shadow-lg scale-[1.01]"
                : "border-slate-300 bg-white hover:border-blue-500 hover:shadow-lg shadow-sm"
            }`}
            onClick={() => document.getElementById("file-upload")?.click()}
          >
            {/* Subtle High-Tech Corner Markers in Dark Mode */}
            {isDark && (
              <>
                <div className="absolute top-3 left-3 size-2.5 border-t-2 border-l-2 border-purple-500/40 group-hover:border-cyan-400/80 transition-colors pointer-events-none" />
                <div className="absolute top-3 right-3 size-2.5 border-t-2 border-r-2 border-purple-500/40 group-hover:border-cyan-400/80 transition-colors pointer-events-none" />
                <div className="absolute bottom-3 left-3 size-2.5 border-b-2 border-l-2 border-purple-500/40 group-hover:border-cyan-400/80 transition-colors pointer-events-none" />
                <div className="absolute bottom-3 right-3 size-2.5 border-b-2 border-r-2 border-purple-500/40 group-hover:border-cyan-400/80 transition-colors pointer-events-none" />
              </>
            )}

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

            <div className="flex flex-col items-center justify-center space-y-5">
              {/* Glowing Icon Container */}
              <div
                className={`size-16 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                  isDark
                    ? isDragging
                      ? "bg-gradient-to-br from-purple-600 to-cyan-500 text-white scale-110 shadow-[0_0_30px_rgba(6,182,212,0.5)] border-transparent"
                      : "bg-zinc-950/80 border border-purple-500/30 text-cyan-400 shadow-[0_0_20px_rgba(168,85,247,0.2)] group-hover:border-cyan-400/60 group-hover:shadow-[0_0_30px_rgba(6,182,212,0.35)] group-hover:scale-105"
                    : isDragging
                    ? "bg-blue-600 text-white scale-110 shadow-lg shadow-blue-500/30"
                    : "bg-blue-50 text-blue-600 group-hover:bg-blue-100/80 group-hover:scale-105 shadow-sm"
                }`}
              >
                <UploadCloud size={30} strokeWidth={1.8} />
              </div>

              {/* Title & Micro Reassurance */}
              <div className="space-y-1.5">
                <p className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                  Click or drag PDF to analyze
                </p>
                <p className="text-sm text-slate-500 dark:text-zinc-400 font-normal">
                  All contracts evaluated in volatile RAM. Never stored on disk.
                </p>
              </div>

              {/* Active Selected File Indicator */}
              {fileName && !loading && (
                <div
                  className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono border ${
                    isDark
                      ? "bg-zinc-900 border-purple-500/40 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.15)]"
                      : "bg-slate-100 border-slate-200 text-slate-800"
                  }`}
                >
                  <FileText
                    size={14}
                    className={isDark ? "text-cyan-400" : "text-blue-600"}
                  />
                  <span>{fileName}</span>
                </div>
              )}

              {/* Inside Buttons */}
              <div
                className="pt-2 flex flex-col sm:flex-row items-center gap-3.5 z-10"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Primary Button: Select Document */}
                <button
                  id="select-document-btn"
                  className={`px-7 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 active:scale-95 disabled:opacity-50 ${
                    isDark
                      ? "bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-400 text-white shadow-[0_0_25px_rgba(168,85,247,0.35)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)]"
                      : "bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-600/20 hover:shadow-md"
                  }`}
                  onClick={() =>
                    document.getElementById("file-upload")?.click()
                  }
                  disabled={loading}
                >
                  <FileText size={16} />
                  <span>Select Document</span>
                </button>

                {/* Secondary Button: Try Sample */}
                {!analysis && !loading && (
                  <button
                    id="sample-demo-btn"
                    className={`px-5 py-3 rounded-xl text-sm font-medium transition-all cursor-pointer flex items-center gap-2 active:scale-95 ${
                      isDark
                        ? "border border-zinc-800 hover:border-zinc-700 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white"
                        : "border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 shadow-sm"
                    }`}
                    onClick={handleSample}
                  >
                    <span>Try Sample Agreement</span>
                    <ArrowRight
                      size={14}
                      className={isDark ? "text-cyan-400" : "text-slate-500"}
                    />
                  </button>
                )}
              </div>

              {/* Micro Tags */}
              <div className="pt-2 flex items-center gap-4 text-[11px] font-mono text-slate-400 dark:text-zinc-500">
                <span>[WASM_PARSER]</span>
                <span>•</span>
                <span>[ZERO_PERSISTENCE]</span>
                <span>•</span>
                <span>[DETERMINISTIC_MATH]</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Loading Indicator Banner */}
        <AnimatePresence>
          {loading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`w-full max-w-2xl mb-12 p-6 rounded-2xl flex items-center justify-center gap-4 text-center border backdrop-blur-md shadow-sm ${
                isDark
                  ? "bg-zinc-900/80 border-purple-500/30 text-white shadow-[0_0_30px_rgba(168,85,247,0.15)]"
                  : "bg-white border-blue-100 text-slate-900"
              }`}
            >
              <div
                className={`size-6 border-2 border-t-transparent rounded-full animate-spin ${
                  isDark ? "border-cyan-400" : "border-blue-600"
                }`}
              />
              <div className="text-left">
                <p className="font-semibold text-sm">
                  Decompiling contract terms & computing amortization schedule...
                </p>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  Auditing hidden clauses, APR compounding, and penalty fees.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error Alert */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="w-full max-w-2xl mb-12 p-4 rounded-2xl bg-red-500/10 border border-red-500/40 text-red-700 dark:text-red-300 flex items-start gap-3 text-sm backdrop-blur-md shadow-sm"
              role="alert"
            >
              <AlertTriangle className="size-5 text-red-500 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold">Analysis Error</p>
                <p className="text-xs mt-0.5 opacity-90">{error}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Analysis Results Display */}
        <AnimatePresence>
          {analysis && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="w-full max-w-4xl space-y-6 mb-16"
              id="analysis-results"
            >
              {/* Header Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-200 dark:border-zinc-800">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2
                    size={18}
                    className={isDark ? "text-cyan-400" : "text-blue-600"}
                  />
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                    True Cost Audit Report
                  </h2>
                </div>

                <div className="flex items-center gap-3">
                  {/* Inline Currency Badge in Report */}
                  <span
                    className={`text-xs font-mono px-2.5 py-1 rounded-lg border ${
                      isDark
                        ? "bg-zinc-900 border-zinc-800 text-cyan-300"
                        : "bg-blue-50 border-blue-200 text-blue-700"
                    }`}
                  >
                    Currency: {selectedCurrency}
                  </span>

                  <button
                    onClick={handleReset}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer border ${
                      isDark
                        ? "text-zinc-400 hover:text-white bg-zinc-900 border-zinc-800 hover:border-zinc-700"
                        : "text-slate-600 hover:text-slate-900 bg-white border-slate-200 hover:bg-slate-50 shadow-sm"
                    }`}
                  >
                    <RotateCcw size={13} />
                    <span>Audit Another</span>
                  </button>
                </div>
              </div>

              {/* Grid: Gotchas & The Final Bill */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Gotchas Card */}
                <div
                  className={`rounded-2xl p-6 border flex flex-col justify-between transition-all ${
                    isDark
                      ? "bg-zinc-900/70 border-purple-500/30 shadow-[0_0_30px_rgba(168,85,247,0.1)] backdrop-blur-md"
                      : "bg-white border-red-200/80 shadow-sm"
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle
                        size={18}
                        className={isDark ? "text-purple-400" : "text-red-600"}
                      />
                      <h3
                        className={`font-bold text-base ${
                          isDark ? "text-white" : "text-red-800"
                        }`}
                      >
                        Hidden Traps & Predatory Terms
                      </h3>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-zinc-400 mb-5">
                      Clauses identified in the fine print that increase costs or waive rights
                    </p>

                    <ul className="space-y-3">
                      {(analysis.gotchas ?? []).map((gotcha, index) => (
                        <li
                          key={index}
                          className="flex items-start gap-3 text-sm text-slate-700 dark:text-zinc-300 leading-snug"
                        >
                          <span
                            className={`size-5 rounded-md font-mono text-xs flex items-center justify-center shrink-0 mt-0.5 ${
                              isDark
                                ? "bg-purple-500/20 text-purple-300 border border-purple-500/40"
                                : "bg-red-100 text-red-700 font-bold"
                            }`}
                          >
                            0{index + 1}
                          </span>
                          <span>{gotcha}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* The Final Bill Card */}
                <div
                  className={`rounded-2xl p-6 border flex flex-col justify-between transition-all ${
                    isDark
                      ? "bg-zinc-900/90 border-cyan-500/30 shadow-[0_0_35px_rgba(6,182,212,0.12)] backdrop-blur-md"
                      : "bg-slate-900 text-white border-slate-800 shadow-md"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                      <span className="text-sm font-semibold text-slate-200">
                        The Final Bill
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold border ${
                          isDark
                            ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-[0_0_10px_rgba(6,182,212,0.2)]"
                            : "bg-blue-500/20 text-blue-400 border-blue-500/30"
                        }`}
                      >
                        {analysis.apr}% APR
                      </span>
                    </div>

                    <div className="my-5">
                      <span className="text-[11px] uppercase tracking-wider text-slate-400 font-mono">
                        Total Amount You Pay Back
                      </span>
                      <p
                        className={`text-4xl font-extrabold mt-1 font-mono tracking-tight ${
                          isDark
                            ? "text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-100 to-cyan-400"
                            : "text-white"
                        }`}
                      >
                        {formatCurrency(analysis.totalPayback, selectedCurrency)}
                      </p>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed mb-4">
                      {adaptSummaryCurrency(analysis.plainEnglishSummary, selectedCurrency)}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-800 text-xs font-mono">
                    <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/50">
                      <span className="text-slate-400 block text-[11px]">
                        Principal
                      </span>
                      <span className="font-semibold text-slate-100 text-sm">
                        {typeof analysis.principal === "number"
                          ? formatCurrency(analysis.principal, selectedCurrency)
                          : "N/A"}
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/50">
                      <span className="text-slate-400 block text-[11px]">
                        Loan Term
                      </span>
                      <span className="font-semibold text-slate-100 text-sm">
                        {analysis.termMonths} Months
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Timeline Amortization Chart */}
              {analysis.schedule && analysis.schedule.length > 0 && (
                <div
                  className={`rounded-2xl p-6 border transition-all ${
                    isDark
                      ? "bg-zinc-900/60 border-zinc-800/80 backdrop-blur-md"
                      : "bg-white border-slate-200/80 shadow-sm"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-200 dark:border-zinc-800 mb-6">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        Where Your Money Goes Over Time
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-zinc-400">
                        Visualizing cumulative interest fees vs. actual principal paid off ({selectedCurrency})
                      </p>
                    </div>

                    <div className="flex items-center gap-5 text-xs font-mono">
                      <div className="flex items-center gap-2">
                        <span
                          className={`size-2.5 rounded-full ${
                            isDark
                              ? "bg-cyan-400 shadow-[0_0_6px_#22d3ee]"
                              : "bg-blue-600"
                          }`}
                        />
                        <span className="text-slate-600 dark:text-zinc-300">
                          Principal Repaid
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`size-2.5 rounded-full ${
                            isDark
                              ? "bg-purple-500 shadow-[0_0_6px_#a855f7]"
                              : "bg-red-500"
                          }`}
                        />
                        <span className="text-slate-600 dark:text-zinc-300">
                          Interest Fees
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="w-full h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={analysis.schedule}
                        margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient
                            id="chartPrincipal"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
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
                          <linearGradient
                            id="chartInterest"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
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
                          fontSize={11}
                          fontFamily="monospace"
                          tickLine={false}
                          axisLine={{ stroke: isDark ? "#27272a" : "#e2e8f0" }}
                        />
                        <YAxis
                          stroke={isDark ? "#71717a" : "#94a3b8"}
                          fontSize={11}
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
                            borderRadius: "12px",
                            color: "#fff",
                            fontSize: "12px",
                            fontFamily: "monospace",
                            padding: "8px 12px",
                            boxShadow: "0 10px 15px -3px rgba(0,0,0,0.3)",
                          }}
                          itemStyle={{ color: "#fff" }}
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
                </div>
              )}

              {/* Legal & Financial Advisory Warning Disclaimer */}
              <div
                className={`p-4 rounded-2xl border text-xs flex items-start gap-3 transition-colors ${
                  isDark
                    ? "bg-zinc-900/50 border-zinc-800/80 text-zinc-400"
                    : "bg-amber-50/80 border-amber-200/90 text-amber-950"
                }`}
              >
                <AlertTriangle
                  size={16}
                  className={`shrink-0 mt-0.5 ${
                    isDark ? "text-amber-400" : "text-amber-600"
                  }`}
                />
                <div>
                  <span className="font-semibold block mb-0.5">
                    User Notice: Not Legal or Financial Advice
                  </span>
                  <p className="leading-relaxed opacity-90">
                    True Cost Portal provides automated algorithmic evaluations for informational purposes only. It does not constitute formal legal, financial, tax, or credit advisory services. Financial contracts are legally binding instruments; always consult a certified financial advisor or legal counsel before signing.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Three Minimalist Feature Highlights with Small Inline Icons */}
        <section
          className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-5 mt-2"
          id="features-section"
        >
          {/* Feature 1 */}
          <div
            className={`rounded-2xl p-5 border transition-all duration-300 group ${
              isDark
                ? "bg-zinc-900/40 border-zinc-800/80 hover:border-purple-500/40 hover:bg-zinc-900/60 backdrop-blur-sm"
                : "bg-white border-slate-200/80 hover:border-slate-300 hover:shadow-md shadow-sm"
            }`}
          >
            <div className="flex items-center gap-2.5 mb-2.5">
              <div
                className={`size-7 rounded-lg flex items-center justify-center transition-transform group-hover:scale-105 ${
                  isDark
                    ? "bg-cyan-950/70 border border-cyan-800/60 text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.25)]"
                    : "bg-emerald-50 text-emerald-600"
                }`}
              >
                <ShieldCheck size={16} />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100 tracking-tight">
                Ephemeral In-Memory Enclave
              </h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed font-normal">
              PDFs are parsed strictly in volatile memory. No server logs, zero disk
              persistence, and no third-party data tracking.
            </p>
            <div
              className={`mt-3 text-[10px] font-mono ${
                isDark ? "text-cyan-400/80" : "text-emerald-600 font-semibold"
              }`}
            >
              01 // ZERO_RETENTION
            </div>
          </div>

          {/* Feature 2 */}
          <div
            className={`rounded-2xl p-5 border transition-all duration-300 group ${
              isDark
                ? "bg-zinc-900/40 border-zinc-800/80 hover:border-purple-500/40 hover:bg-zinc-900/60 backdrop-blur-sm"
                : "bg-white border-slate-200/80 hover:border-slate-300 hover:shadow-md shadow-sm"
            }`}
          >
            <div className="flex items-center gap-2.5 mb-2.5">
              <div
                className={`size-7 rounded-lg flex items-center justify-center transition-transform group-hover:scale-105 ${
                  isDark
                    ? "bg-purple-950/70 border border-purple-800/60 text-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.25)]"
                    : "bg-blue-50 text-blue-600"
                }`}
              >
                <Calculator size={16} />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100 tracking-tight">
                Deterministic Amortization
              </h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed font-normal">
              LLMs extract clause parameters, while independent deterministic math
              verifies true APR compounding and hidden balloon fees.
            </p>
            <div
              className={`mt-3 text-[10px] font-mono ${
                isDark ? "text-purple-400/80" : "text-blue-600 font-semibold"
              }`}
            >
              02 // DETERMINISTIC_MATH
            </div>
          </div>

          {/* Feature 3 */}
          <div
            className={`rounded-2xl p-5 border transition-all duration-300 group ${
              isDark
                ? "bg-zinc-900/40 border-zinc-800/80 hover:border-cyan-500/40 hover:bg-zinc-900/60 backdrop-blur-sm"
                : "bg-white border-slate-200/80 hover:border-slate-300 hover:shadow-md shadow-sm"
            }`}
          >
            <div className="flex items-center gap-2.5 mb-2.5">
              <div
                className={`size-7 rounded-lg flex items-center justify-center transition-transform group-hover:scale-105 ${
                  isDark
                    ? "bg-cyan-950/70 border border-cyan-800/60 text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.25)]"
                    : "bg-indigo-50 text-indigo-600"
                }`}
              >
                <Lock size={16} />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100 tracking-tight">
                Open Source & Verifiable
              </h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed font-normal">
              Fully transparent architecture. Review prompts, parsing routines, and
              amortization algorithms or self-host via GitHub.
            </p>
            <div
              className={`mt-3 text-[10px] font-mono ${
                isDark ? "text-cyan-400/80" : "text-indigo-600 font-semibold"
              }`}
            >
              03 // AUDIT_READY
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-200/80 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-950/80 py-8 text-xs text-slate-500 dark:text-zinc-500 backdrop-blur-md transition-colors duration-300">
        <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <span className="size-2 rounded-full bg-emerald-500 shadow-sm" />
            <span className="font-mono text-slate-700 dark:text-zinc-400 font-medium">
              True Cost Portal v1.2
            </span>
          </div>
          <div className="flex items-center gap-6 text-slate-500 dark:text-zinc-500 font-mono text-[11px]">
            <span>100% In-Memory</span>
            <span>•</span>
            <span>Zero Third-Party Storage</span>
            <span>•</span>
            <a
              href="https://github.com/ritik6386/true-cost-portal"
              target="_blank"
              rel="noreferrer"
              className="hover:text-blue-600 dark:hover:text-cyan-400 transition-colors underline-offset-4 hover:underline"
            >
              ritik.2vedi
            </a>
          </div>
        </div>

        {/* Legal Disclaimer Footnote */}
        <div className="max-w-5xl mx-auto px-6 mt-4 pt-4 border-t border-slate-200/60 dark:border-zinc-900 text-center text-[11px] text-slate-400 dark:text-zinc-600">
          Disclaimer: True Cost Portal is an automated analysis tool for informational purposes only and does not constitute certified legal, financial, or tax advice. Consult a licensed professional before executing any credit agreement.
        </div>
      </footer>
    </div>
  );
}