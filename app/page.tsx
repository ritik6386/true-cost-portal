"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, ShieldCheck, Calculator, FileSearch } from "lucide-react";
import { motion } from "framer-motion";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Home() {
  const [isDragging, setIsDragging] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleFile = async (file: File) => {
    setLoading(true);
    setAnalysis(null);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/analyze", { method: "POST", body: formData });
      if (!response.ok) throw new Error("Server returned an error");
      const data = await response.json();

      setAnalysis(data);
    } catch (error) {
      console.error("Analysis failed:", error);
      alert("Analysis failed. Please check your PDF and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 p-8 flex flex-col items-center justify-center">
      {/* Header Section */}
      <div className="max-w-4xl w-full text-center mb-12">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-6xl mb-4"
        >
          Expose the <span className="text-blue-600">True Cost</span>
        </motion.h1>
        <p className="text-lg text-slate-600">
          Upload any credit agreement or loan PDF. We strip away the jargon to show you the actual math banks hide in the fine print.
        </p>
      </div>

      {/* Main Dropzone Card */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="w-full max-w-2xl"
      >
        <Card className={`border-2 border-dashed transition-colors ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-slate-200'}`}>
          <CardContent 
            className="p-12 flex flex-col items-center justify-center text-center space-y-4"
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => { e.preventDefault(); setIsDragging(false); const droppedFile = e.dataTransfer.files[0]; if (droppedFile) handleFile(droppedFile); }}
          >
            <div className="p-4 bg-blue-100 rounded-full text-blue-600">
              <Upload size={48} />
            </div>
            <div>
              <p className="text-xl font-semibold">Click or drag PDF to analyze</p>
              <p className="text-sm text-slate-500">Your data is processed locally. We never store your contracts.</p>
            </div>
            <input 
              type="file" 
              id="file-upload" 
              className="hidden" 
              onChange={(e) => {
                const selectedFile = e.target.files?.[0];
                if (selectedFile) handleFile(selectedFile);
              }}
            />
            <Button 
              className="mt-4 bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => document.getElementById('file-upload')?.click()}
            >
              Select Document
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {loading && <p className="mt-8 text-blue-600 animate-pulse text-lg">Analyzing fine print... Calculating total cost...</p>}

      {analysis && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-12 w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-white border-red-100 shadow-xl">
            <CardHeader>
              <CardTitle className="text-red-600">⚠️ Hidden Gotchas</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc pl-5 space-y-2">
                {(analysis.gotchas ?? []).map((g: string, i: number) => <li key={i} className="text-slate-700">{g}</li>)}
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-blue-900 text-white">
            <CardHeader>
              <CardTitle>The Final Bill</CardTitle>
              <CardDescription className="text-blue-200 text-2xl font-bold">
                Total Payback: ${analysis.totalPayback}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm opacity-90">{analysis.plainEnglishSummary}</p>
              <div className="mt-4 pt-4 border-t border-blue-800 text-xs">
                Calculated at {analysis.apr}% APR over {analysis.termMonths} months.
              </div>
            </CardContent>
          </Card>

          {/* The Timeline Chart */}
          {analysis.schedule && analysis.schedule.length > 0 && (
            <Card className="md:col-span-2 mt-6 shadow-lg border-slate-200">
              <CardHeader>
                <CardTitle>Where Your Money Goes Over Time</CardTitle>
                <CardDescription>Visualizing the true cost of interest</CardDescription>
              </CardHeader>
              <CardContent className="w-full">
                <ResponsiveContainer width="100%" height={320}>
                  <AreaChart data={analysis.schedule} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorInterest" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorPrincipal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <Tooltip formatter={(value) => `$${value}`} />
                    <Area type="monotone" dataKey="Interest" stroke="#ef4444" fillOpacity={1} fill="url(#colorInterest)" stackId="1" />
                    <Area type="monotone" dataKey="Principal" stroke="#3b82f6" fillOpacity={1} fill="url(#colorPrincipal)" stackId="1" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </motion.div>
      )}

      {/* Trust/Feature Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16 max-w-5xl">
        <FeatureCard 
          icon={<ShieldCheck className="text-green-600" />} 
          title="Jargon Extraction" 
          desc="Identifies predatory clauses and hidden penalty fees instantly." 
        />
        <FeatureCard 
          icon={<Calculator className="text-blue-600" />} 
          title="Pure Math Engine" 
          desc="LLMs explain the text; our Python engine handles the amortization." 
        />
        <FeatureCard 
          icon={<FileSearch className="text-purple-600" />} 
          title="Privacy First" 
          desc="Open-source architecture ensures your financial data stays yours." 
        />
      </div>
    </main>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="flex flex-col items-center text-center space-y-2 p-4">
      <div className="mb-2">{icon}</div>
      <h3 className="font-bold text-slate-800">{title}</h3>
      <p className="text-sm text-slate-500">{desc}</p>
    </div>
  );
}