"use client";

import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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

interface AnalysisResult {
  principal: number;
  apr: number;
  termMonths: number;
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
  principal: 25000,
  apr: 14.5,
  termMonths: 60,
  gotchas: [
    "Prepayment Penalty: 2.5% penalty fee if paid in full before month 24.",
    "Variable Default Rate: APR surges to 24.99% immediately upon any 30-day late payment.",
    "Mandatory Arbitration: Strips class-action rights and requires private arbitration.",
  ],
  plainEnglishSummary:
    "This is a 5-year loan of $25,000 at a 14.5% APR. Over 60 months, you will pay $10,323 in interest alone, bringing your total payback to $35,323 with a monthly payment of $588.72.",
  totalPayback: 35323,
  schedule: [
    { name: "Year 1", Interest: 3410, Principal: 3654, Remaining: 21346 },
    { name: "Year 2", Interest: 6185, Principal: 7879, Remaining: 17121 },
    { name: "Year 3", Interest: 8254, Principal: 12810, Remaining: 12190 },
    { name: "Year 4", Interest: 9662, Principal: 18402, Remaining: 6598 },
    { name: "Year 5", Interest: 10323, Principal: 25000, Remaining: 0 },
  ],
};

export default function Home() {
  const [isDragging, setIsDragging] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

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
      setLoading(false);
    }, 600);
  };

  const handleReset = () => {
    setAnalysis(null);
    setError(null);
    setFileName(null);
    setLoading(false);
  };

  return (
    <div className="relative min-h-screen bg-slate-50 text-slate-900 antialiased overflow-x-hidden">
      {/* Background Subtle Gradient & Glow */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(37,99,235,0.08),rgba(255,255,255,0))]"
        aria-hidden="true"
      />

      {/* Navigation Header */}
      <header className="w-full border-b border-slate-200/80 bg-white/70 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold shadow-sm shadow-blue-500/20">
              <TrendingDown size={18} />
            </div>
            <span className="font-bold text-lg tracking-tight text-slate-900">
              True Cost Portal
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200/60">
              <span className="size-1.5 rounded-full bg-blue-600 animate-pulse" />
              100% In-Memory Analysis
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 pt-12 pb-24 flex flex-col items-center">
        {/* Hero Section */}
        <section className="text-center max-w-3xl mb-12" id="hero-section">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200/80 text-xs font-medium mb-6"
          >
            <Sparkles size={14} className="text-blue-600" />
            AI-Powered Forensic Financial Audit
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.1] mb-5 font-sans"
          >
            Expose the{" "}
            <span className="bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
              True Cost
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal"
          >
            Upload any credit agreement or loan PDF. We strip away the jargon to
            show you the actual math banks hide in the fine print.
          </motion.p>
        </section>

        {/* Dropzone Section */}
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
            className={`group relative rounded-2xl border-2 border-dashed p-10 sm:p-12 text-center transition-all duration-200 bg-white shadow-sm ${
              isDragging
                ? "border-blue-600 bg-blue-50/50 shadow-blue-500/10 shadow-lg scale-[1.01]"
                : "border-slate-200 hover:border-slate-300 hover:shadow-md"
            }`}
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

            <div className="flex flex-col items-center justify-center space-y-4">
              {/* Upload Icon with soft glow ring */}
              <div
                className={`p-4 rounded-2xl transition-all duration-300 ${
                  isDragging
                    ? "bg-blue-600 text-white scale-110 shadow-lg shadow-blue-500/30"
                    : "bg-blue-50 text-blue-600 group-hover:bg-blue-100/80 group-hover:scale-105"
                }`}
              >
                <UploadCloud size={40} strokeWidth={1.75} />
              </div>

              <div className="space-y-1">
                <p className="text-xl font-bold text-slate-900 tracking-tight">
                  Click or drag PDF to analyze
                </p>
                <p className="text-sm text-slate-500 font-normal">
                  Your data is processed locally. We never store your contracts.
                </p>
              </div>

              {fileName && !loading && (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-800 text-xs font-medium border border-slate-200">
                  <FileText size={14} className="text-blue-600" />
                  <span>{fileName}</span>
                </div>
              )}

              {/* Primary CTA Button */}
              <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                <Button
                  id="select-document-btn"
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-7 py-2.5 rounded-xl font-semibold shadow-sm shadow-blue-600/20 transition-all hover:shadow-md cursor-pointer"
                  onClick={() =>
                    document.getElementById("file-upload")?.click()
                  }
                  disabled={loading}
                >
                  <FileText size={16} className="mr-2" />
                  Select Document
                </Button>

                {!analysis && !loading && (
                  <Button
                    id="sample-demo-btn"
                    variant="outline"
                    size="lg"
                    className="border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900 rounded-xl font-medium cursor-pointer"
                    onClick={handleSample}
                  >
                    Try Sample Agreement
                    <ArrowRight size={14} className="ml-1.5" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Loading Indicator */}
        <AnimatePresence>
          {loading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="w-full max-w-2xl mb-12 p-6 rounded-2xl bg-white border border-blue-100 shadow-sm flex items-center justify-center gap-4 text-center"
            >
              <div className="size-6 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <div className="text-left">
                <p className="font-semibold text-slate-900 text-sm">
                  Analyzing fine print & computing amortization schedule...
                </p>
                <p className="text-xs text-slate-500">
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
              className="w-full max-w-2xl mb-12 p-4 rounded-xl bg-red-50/80 border border-red-200 text-red-800 flex items-start gap-3 text-sm"
              role="alert"
            >
              <AlertTriangle className="size-5 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-red-900">Analysis Error</p>
                <p className="text-red-700 mt-0.5">{error}</p>
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
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={20} className="text-blue-600" />
                  <h2 className="text-xl font-bold text-slate-900">
                    Contract Audit Report
                  </h2>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleReset}
                  className="text-slate-600 hover:text-slate-900 gap-1.5"
                >
                  <RotateCcw size={14} />
                  Analyze Another
                </Button>
              </div>

              {/* Cards Grid: Gotchas & The Final Bill */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Hidden Gotchas Card */}
                <Card className="bg-white border-red-200/80 shadow-sm rounded-2xl overflow-hidden">
                  <CardHeader className="bg-red-50/60 border-b border-red-100 pb-4">
                    <CardTitle className="text-red-700 flex items-center gap-2 text-base font-bold">
                      <AlertTriangle size={18} className="text-red-600" />
                      Hidden Gotchas & Traps
                    </CardTitle>
                    <CardDescription className="text-red-950/70 text-xs">
                      Predatory terms flagged in the fine print
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-5">
                    <ul className="space-y-3">
                      {(analysis.gotchas ?? []).map((gotcha, index) => (
                        <li
                          key={index}
                          className="flex items-start gap-2.5 text-sm text-slate-700 leading-snug"
                        >
                          <span className="size-5 rounded-full bg-red-100 text-red-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                            {index + 1}
                          </span>
                          <span>{gotcha}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                {/* The Final Bill Card */}
                <Card className="bg-slate-900 text-white border-slate-800 shadow-md rounded-2xl overflow-hidden flex flex-col justify-between">
                  <CardHeader className="bg-slate-950/60 border-b border-slate-800 pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-slate-200 text-base font-semibold">
                        The Final Bill
                      </CardTitle>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                        {analysis.apr}% APR
                      </span>
                    </div>
                    <div className="mt-2">
                      <span className="text-xs uppercase tracking-wider text-slate-400 font-medium">
                        Total Amount You Pay Back
                      </span>
                      <p className="text-3xl sm:text-4xl font-extrabold text-white mt-1">
                        ${typeof analysis.totalPayback === "number"
                          ? analysis.totalPayback.toLocaleString()
                          : analysis.totalPayback}
                      </p>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-5 space-y-4">
                    <p className="text-sm text-slate-300 leading-relaxed">
                      {analysis.plainEnglishSummary}
                    </p>

                    <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-800 text-xs">
                      <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50">
                        <span className="text-slate-400 block">Principal</span>
                        <span className="font-semibold text-slate-100 text-sm">
                          ${analysis.principal?.toLocaleString() || "N/A"}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50">
                        <span className="text-slate-400 block">Loan Term</span>
                        <span className="font-semibold text-slate-100 text-sm">
                          {analysis.termMonths} Months
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Timeline Amortization Chart */}
              {analysis.schedule && analysis.schedule.length > 0 && (
                <Card className="shadow-sm border-slate-200/80 bg-white rounded-2xl overflow-hidden">
                  <CardHeader className="border-b border-slate-100 pb-4">
                    <CardTitle className="text-slate-900 text-base font-bold">
                      Where Your Money Goes Over Time
                    </CardTitle>
                    <CardDescription className="text-slate-500 text-xs">
                      Visualizing cumulative interest fees vs. actual principal paid off
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="pt-6">
                    <div className="flex items-center gap-6 justify-end text-xs mb-4">
                      <div className="flex items-center gap-2">
                        <span className="size-3 rounded-full bg-blue-600" />
                        <span className="text-slate-600 font-medium">Principal Repaid</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="size-3 rounded-full bg-red-500" />
                        <span className="text-slate-600 font-medium">Interest Paid</span>
                      </div>
                    </div>

                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart
                        data={analysis.schedule}
                        margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="colorInterest" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.7} />
                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0.05} />
                          </linearGradient>
                          <linearGradient id="colorPrincipal" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#2563eb" stopOpacity={0.7} />
                            <stop offset="95%" stopColor="#2563eb" stopOpacity={0.05} />
                          </linearGradient>
                        </defs>
                        <XAxis
                          dataKey="name"
                          stroke="#94a3b8"
                          fontSize={12}
                          tickLine={false}
                          axisLine={{ stroke: "#e2e8f0" }}
                        />
                        <YAxis
                          stroke="#94a3b8"
                          fontSize={12}
                          tickLine={false}
                          axisLine={{ stroke: "#e2e8f0" }}
                          tickFormatter={(val) => `$${val.toLocaleString()}`}
                        />
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <Tooltip
                          formatter={(value) => [
                            `$${Number(value || 0).toLocaleString()}`,
                          ]}
                          contentStyle={{
                            backgroundColor: "#0f172a",
                            border: "none",
                            borderRadius: "12px",
                            color: "#fff",
                            fontSize: "12px",
                            padding: "8px 12px",
                            boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
                          }}
                          itemStyle={{ color: "#fff" }}
                        />
                        <Area
                          type="monotone"
                          dataKey="Interest"
                          stroke="#ef4444"
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#colorInterest)"
                          stackId="1"
                        />
                        <Area
                          type="monotone"
                          dataKey="Principal"
                          stroke="#2563eb"
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#colorPrincipal)"
                          stackId="1"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Three-Column Feature Grid using Card components with soft shadows */}
        <section
          className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-6 mt-4"
          id="features-section"
        >
          {/* Feature 1 */}
          <Card className="bg-white border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-300 rounded-2xl group">
            <CardHeader className="pb-3 text-center flex flex-col items-center">
              <div className="size-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform duration-200">
                <ShieldCheck size={24} strokeWidth={2} />
              </div>
              <CardTitle className="text-base font-bold text-slate-900 tracking-tight">
                Jargon Extraction
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center pt-0">
              <CardDescription className="text-sm text-slate-600 leading-relaxed font-normal">
                Identifies predatory clauses and hidden penalty fees instantly.
              </CardDescription>
            </CardContent>
          </Card>

          {/* Feature 2 */}
          <Card className="bg-white border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-300 rounded-2xl group">
            <CardHeader className="pb-3 text-center flex flex-col items-center">
              <div className="size-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform duration-200">
                <Calculator size={24} strokeWidth={2} />
              </div>
              <CardTitle className="text-base font-bold text-slate-900 tracking-tight">
                Pure Math Engine
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center pt-0">
              <CardDescription className="text-sm text-slate-600 leading-relaxed font-normal">
                LLMs explain the text; our deterministic engine handles the amortization.
              </CardDescription>
            </CardContent>
          </Card>

          {/* Feature 3 */}
          <Card className="bg-white border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-300 rounded-2xl group">
            <CardHeader className="pb-3 text-center flex flex-col items-center">
              <div className="size-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform duration-200">
                <Lock size={24} strokeWidth={2} />
              </div>
              <CardTitle className="text-base font-bold text-slate-900 tracking-tight">
                Privacy First
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center pt-0">
              <CardDescription className="text-sm text-slate-600 leading-relaxed font-normal">
                Open-source architecture ensures your financial data stays yours.
              </CardDescription>
            </CardContent>
          </Card>
        </section>
      </main>

      {/* Sleek Minimalist Footer */}
      <footer className="w-full border-t border-slate-200/80 bg-white py-8 text-center text-xs text-slate-500">
        <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} True Cost Portal. All rights reserved.</p>
          <div className="flex items-center gap-6 text-slate-500">
            <span>In-memory WASM extraction</span>
            <span>•</span>
            <span>No data storage</span>
            <span>•</span>
            <span>Open Source</span>
          </div>
        </div>
      </footer>
    </div>
  );
}