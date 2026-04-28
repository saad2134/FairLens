"use client";

import * as React from "react";
import {
  Upload,
  FileSpreadsheet,
  ArrowRight,
  Check,
  AlertTriangle,
  Sparkles,
  Scale,
  Eye,
  Brain,
  FileText,
  Loader2,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const mockSensitiveColumns = [
  { name: "gender", type: "categorical", confidence: 0.95, suggested: true },
  { name: "age", type: "numeric", confidence: 0.88, suggested: true },
  { name: "race", type: "categorical", confidence: 0.92, suggested: true },
  { name: "region", type: "categorical", confidence: 0.72, suggested: false },
];

const mockAnalysisResult = {
  datasetStats: { rows: 12500, columns: 24, missing: 234 },
  fairnessScore: 0.72,
  violations: [
    { type: "Disparate Impact", groups: ["female", "black"], severity: "critical" },
    { type: "Equal Opportunity", groups: ["age_60+"], severity: "warning" },
  ],
  metrics: {
    demographic_parity: { value: 0.82, status: "pass" },
    equal_opportunity: { value: 0.74, status: "warning" },
    disparate_impact: { value: 0.68, status: "fail" },
    equalized_odds: { value: 0.76, status: "warning" },
  },
};

export default function NewAuditPage() {
  const [step, setStep] = React.useState<"upload" | "configure" | "analyze" | "results">("upload");
  const [file, setFile] = React.useState<File | null>(null);
  const [showAIGen, setShowAIGen] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setTimeout(() => setStep("configure"), 500);
    }
  };

  const handleSelectFile = () => {
    fileInputRef.current?.click();
  };

  const startAnalysis = async () => {
    setStep("analyze");
    await new Promise(r => setTimeout(r, 3000));
    setStep("results");
  };

  const generateAIInsights = async () => {
    setShowAIGen(true);
    await new Promise(r => setTimeout(r, 2000));
  };

  const downloadSampleCSV = () => {
    const csvContent = `id,age,gender,race,region,education,income,employment_status,credit_score,loan_approved
1,25,female,white,urban,college,45000,employed,620,no
2,34,male,black,suburban,bachelors,52000,employed,680,yes
3,45,female,hispanic,rural,high_school,38000,employed,590,no
4,28,male,asian,urban,bachelors,55000,employed,710,yes
5,52,female,white,suburban,masters,72000,employed,750,yes
6,38,male,black,urban,college,48000,employed,640,no
7,29,female,hispanic,rural,some_college,41000,employed,600,no
8,44,male,white,suburban,bachelors,65000,employed,730,yes
9,31,female,asian,urban,bachelors,58000,employed,690,yes
10,55,male,black,rural,high_school,35000,unemployed,520,no`;
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_loan_data.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <input ref={fileInputRef} type="file" accept=".csv,.parquet" onChange={handleFileChange} className="hidden" />
      
      <div className="rounded-xl border border-border bg-card p-6">
        <h1 className="mb-2 text-2xl font-bold">New Fairness Audit</h1>
        <p className="text-muted-foreground">Upload your dataset and model to analyze for bias</p>
      </div>

      <div className="flex items-center justify-center gap-2">
        {["upload", "configure", "analyze", "results"].map((s, i) => (
          <React.Fragment key={s}>
            <div className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm ${
              step === s ? "bg-primary text-primary-foreground" :
              ["upload", "configure", "analyze", "results"].indexOf(step) > i ? "bg-green-500 text-white" :
              "bg-muted text-muted-foreground"
            }`}>
              {["upload", "configure", "analyze", "results"].indexOf(step) > i ? (
                <Check className="h-4 w-4" />
              ) : i + 1}
              <span className="capitalize">{s}</span>
            </div>
            {i < 3 && <div className="h-px w-8 bg-muted" />}
          </React.Fragment>
        ))}
      </div>

      {step === "upload" && (
        <div className="space-y-4">
          <div className="rounded-xl border-2 border-dashed border-border p-12 text-center transition-colors hover:border-primary/50">
            <div className="cursor-pointer" onClick={handleSelectFile}>
              <div className="mb-4 flex justify-center">
                <div className="rounded-full bg-primary/10 p-4">
                  <Upload className="h-8 w-8 text-primary" />
                </div>
              </div>
              <p className="mb-2 text-lg font-medium">Drop your dataset here</p>
              <p className="text-sm text-muted-foreground">Supports CSV and Parquet files up to 100MB</p>
              <Button className="mt-4" type="button">Select File</Button>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="mb-2 text-lg font-semibold">Don't have a dataset?</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Download our sample loan approval dataset to test the fairness audit features.
            </p>
            <Button variant="outline" onClick={downloadSampleCSV} className="gap-2">
              <Download className="h-4 w-4" />
              Download Sample CSV
            </Button>
          </div>
        </div>
      )}

      {step === "configure" && (
        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="mb-4 text-lg font-semibold">Dataset Preview</h2>
            {file && (
              <div className="mb-4 flex items-center gap-3 rounded-lg bg-muted/50 p-3">
                <FileSpreadsheet className="h-5 w-5 text-primary" />
                <span className="font-medium">{file.name}</span>
                <Badge variant="secondary">12,500 rows</Badge>
              </div>
            )}
            
            <h3 className="mb-3 font-semibold">Auto-Detected Sensitive Attributes</h3>
            <div className="space-y-2">
              {mockSensitiveColumns.map((col) => (
                <div key={col.name} className={`flex items-center justify-between rounded-lg border p-3 ${
                  col.suggested ? "border-primary/30 bg-primary/5" : "border-border"
                }`}>
                  <div className="flex items-center gap-3">
                    <input type="checkbox" defaultChecked={col.suggested} className="h-4 w-4" />
                    <span className="font-medium">{col.name}</span>
                    <Badge variant="outline">{col.type}</Badge>
                  </div>
                  <span className="text-sm text-muted-foreground">{Math.round(col.confidence * 100)}% confidence</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="mb-3 font-semibold">Model Configuration (Optional)</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <input type="radio" name="model" defaultChecked className="h-4 w-4" />
                <span>Classification (Default)</span>
              </div>
              <div className="flex items-center gap-3">
                <input type="radio" name="model" className="h-4 w-4" />
                <span>Regression</span>
              </div>
              <div className="flex items-center gap-3">
                <input type="radio" name="model" className="h-4 w-4" />
                <span>External API</span>
              </div>
            </div>
          </div>

          <Button onClick={startAnalysis} className="w-full gap-2" size="lg">
            <Scale className="h-5 w-5" />
            Start Fairness Analysis
            <ArrowRight className="h-5 w-5" />
          </Button>
        </div>
      )}

      {step === "analyze" && (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <div className="mb-6 flex justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
          <h2 className="mb-2 text-xl font-semibold">Analyzing Fairness...</h2>
          <p className="text-muted-foreground">This may take a few moments</p>
          
          <div className="mt-8 space-y-3 text-left">
            <div className="flex items-center gap-3 text-sm">
              <Check className="h-4 w-4 text-green-500" />
              Loading dataset
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Check className="h-4 w-4 text-green-500" />
              Detecting sensitive attributes
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              Computing fairness metrics
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              Generating heatmap
            </div>
          </div>
        </div>
      )}

      {step === "results" && (
        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">Audit Results</h2>
              <Badge variant={mockAnalysisResult.fairnessScore >= 0.8 ? "default" : "destructive"}>
                Score: {Math.round(mockAnalysisResult.fairnessScore * 100)}%
              </Badge>
            </div>
            
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="rounded-lg bg-muted/50 p-4 text-center">
                <p className="text-2xl font-bold">12,500</p>
                <p className="text-sm text-muted-foreground">Rows</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-4 text-center">
                <p className="text-2xl font-bold">24</p>
                <p className="text-sm text-muted-foreground">Columns</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-4 text-center">
                <p className="text-2xl font-bold">234</p>
                <p className="text-sm text-muted-foreground">Missing Values</p>
              </div>
            </div>

            <div className="space-y-3">
              {mockAnalysisResult.violations.map((v, i) => (
                <div key={i} className={`flex items-center gap-3 rounded-lg border p-3 ${
                  v.severity === "critical" ? "border-destructive/30 bg-destructive/5 dark:bg-destructive/10" : "border-yellow-300 bg-yellow-50 dark:bg-yellow-900/30"
                }`}>
                  <AlertTriangle className={`h-5 w-5 ${
                    v.severity === "critical" ? "text-destructive" : "text-yellow-600 dark:text-yellow-400"
                  }`} />
                  <span className="font-medium">{v.type}</span>
                  <span className="text-sm text-muted-foreground">for {v.groups.join(", ")}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="mb-4 text-lg font-semibold">Fairness Metrics</h3>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(mockAnalysisResult.metrics).map(([key, m]) => (
                <div key={key} className={`flex items-center justify-between rounded-lg border p-4 ${
                  m.status === "pass" ? "border-green-300 bg-green-50 dark:border-green-700 dark:bg-green-900/20" :
                  m.status === "fail" ? "border-destructive/30 bg-destructive/5" :
                  "border-yellow-300 bg-yellow-50 dark:border-yellow-700 dark:bg-yellow-900/20"
                }`}>
                  <span className="font-medium capitalize">{key.replace("_", " ")}</span>
                  <span className={`font-bold ${
                    m.status === "pass" ? "text-green-600" :
                    m.status === "fail" ? "text-destructive" :
                    "text-yellow-600"
                  }`}>{Math.round(m.value * 100)}%</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">AI Insights</h3>
              </div>
              <Badge variant="secondary">Gemini</Badge>
            </div>
            
            {!showAIGen ? (
              <Button onClick={generateAIInsights} className="w-full gap-2" variant="outline">
                <Sparkles className="h-4 w-4" />
                Generate AI Insights
              </Button>
            ) : (
              <div className="space-y-3">
                <div className="rounded-lg border border-border bg-muted/50 p-4">
                  <p className="text-sm">
                    <strong>Key Finding:</strong> The model shows significant disparate impact against female applicants (0.68 vs target 0.8). 
                    This indicates the model is 32% less likely to approve female applicants compared to male applicants with similar qualifications.
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-muted/50 p-4">
                  <p className="text-sm">
                    <strong>Recommendation:</strong> Consider re-weighting the training data to achieve parity, or apply post-processing calibration 
                    to equalize approval rates across gender groups.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <Button className="flex-1 gap-2" onClick={() => window.open('/demo/reports', '_blank')}>
              <Eye className="h-4 w-4" />
              View Full Report
            </Button>
            <Button variant="outline" className="flex-1 gap-2" onClick={() => {
              const reportContent = `# FairLens AI Fairness Audit Report

## Executive Summary
This report presents the findings of a fairness audit conducted on the loan approval model. The analysis revealed significant disparate impact in approval rates across demographic groups.

## Dataset Overview
- Total Records: 12,500
- Features: 24
- Missing Values: 234
- Target Variable: loan_approved

## Fairness Metrics

### Demographic Parity
- Score: 82%
- Status: PASS
- Analysis: The positive prediction rate is relatively balanced across groups.

### Equal Opportunity  
- Score: 74%
- Status: WARNING
- Analysis: True positive rates show a 15% gap for older applicants (age 60+).

### Disparate Impact
- Score: 68%
- Status: FAIL
- Analysis: Female applicants are 32% less likely to be approved compared to male applicants.

### Equalized Odds
- Score: 76%
- Status: WARNING
- Analysis: Combined TPR and FPR show moderate disparity.

## Critical Findings

1. **Disparate Impact (Critical)**
   - Groups affected: female, black
   - Recommendation: Review and adjust approval criteria

2. **Equal Opportunity (Warning)**
   - Groups affected: age_60+
   - Recommendation: Implement age-neutral credit scoring

## AI Insights (Generated by Gemini)

The model shows significant disparate impact against female applicants (0.68 vs target 0.8). This indicates the model is 32% less likely to approve female applicants compared to male applicants with similar qualifications.

### Recommendation
Consider re-weighting the training data to achieve parity, or apply post-processing calibration to equalize approval rates across gender groups.

---
Generated by FairLens AI Fairness Auditing Platform
Date: ${new Date().toLocaleDateString()}`;

              const blob = new Blob([reportContent], { type: 'text/markdown' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'fairness-audit-report.md';
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
            }}>
              <FileText className="h-4 w-4" />
              Export PDF
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}