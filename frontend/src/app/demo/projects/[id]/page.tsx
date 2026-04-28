"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  AlertTriangle,
  Brain,
  BarChart3,
  Download,
  Share2,
  Loader2,
  TrendingUp,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const projectDetails: Record<string, any> = {
  "1": {
    name: "Loan Approval Model v2.3",
    description: "Analyzing loan approval fairness for credit applications",
    type: "Classification",
    status: "completed",
    score: 0.78,
    dataset: "loan_data_2024.csv",
    rows: 12500,
    columns: 24,
    metrics: {
      demographic_parity: { value: 0.85, status: "pass" },
      equal_opportunity: { value: 0.72, status: "warning" },
      disparate_impact: { value: 0.68, status: "fail" },
      equalized_odds: { value: 0.79, status: "warning" },
    },
    heatmap: [
      { attribute: "gender", values: { male: 0.92, female: 0.78, other: 0.85 } },
      { attribute: "age", values: { "18-25": 0.65, "26-40": 0.88, "41-60": 0.91, "60+": 0.72 } },
      { attribute: "race", values: { white: 0.94, black: 0.71, asian: 0.83, hispanic: 0.76 } },
      { attribute: "region", values: { urban: 0.89, suburban: 0.85, rural: 0.68 } },
    ],
    violations: [
      { type: "Disparate Impact", groups: ["female", "black"], severity: "critical" },
      { type: "Equal Opportunity", groups: ["age_60+"], severity: "warning" },
    ],
  },
  "2": {
    name: "Credit Risk Assessment",
    description: "Fairness audit for credit scoring model",
    type: "Regression",
    status: "completed",
    score: 0.92,
    dataset: "credit_scores.parquet",
    rows: 25000,
    columns: 18,
    metrics: {
      demographic_parity: { value: 0.92, status: "pass" },
      equal_opportunity: { value: 0.90, status: "pass" },
      disparate_impact: { value: 0.88, status: "pass" },
      equalized_odds: { value: 0.91, status: "pass" },
    },
    heatmap: [
      { attribute: "gender", values: { male: 0.94, female: 0.91, other: 0.92 } },
      { attribute: "age", values: { "18-25": 0.85, "26-40": 0.93, "41-60": 0.95, "60+": 0.90 } },
      { attribute: "region", values: { urban: 0.92, suburban: 0.91, rural: 0.89 } },
    ],
  },
  "3": {
    name: "Insurance Premium Predictor",
    description: "Insurance pricing model bias analysis",
    type: "Classification",
    status: "in_progress",
    score: null,
    dataset: "insurance_premiums.csv",
    rows: 8000,
    columns: 15,
    metrics: {},
    heatmap: [],
  },
  "4": {
    name: "Employee Screening AI",
    description: "Resume screening model fairness",
    type: "Classification",
    status: "completed",
    score: 0.65,
    dataset: "hiring_data.csv",
    rows: 5000,
    columns: 32,
    metrics: {
      demographic_parity: { value: 0.62, status: "fail" },
      equal_opportunity: { value: 0.58, status: "fail" },
      disparate_impact: { value: 0.55, status: "fail" },
      equalized_odds: { value: 0.60, status: "fail" },
    },
    heatmap: [
      { attribute: "gender", values: { male: 0.88, female: 0.52, other: 0.65 } },
      { attribute: "age", values: { "18-25": 0.45, "26-40": 0.75, "41-60": 0.82, "60+": 0.48 } },
      { attribute: "race", values: { white: 0.90, black: 0.42, asian: 0.75, hispanic: 0.55 } },
    ],
  },
  "5": {
    name: "Housing Approval Model",
    description: "Public housing allocation fairness",
    type: "Classification",
    status: "completed",
    score: 0.84,
    dataset: "housing_approvals.csv",
    rows: 15000,
    columns: 20,
    metrics: {
      demographic_parity: { value: 0.86, status: "pass" },
      equal_opportunity: { value: 0.82, status: "pass" },
      disparate_impact: { value: 0.76, status: "warning" },
      equalized_odds: { value: 0.84, status: "pass" },
    },
    heatmap: [
      { attribute: "gender", values: { male: 0.88, female: 0.86, other: 0.85 } },
      { attribute: "income", values: { low: 0.72, medium: 0.88, high: 0.94 } },
      { attribute: "region", values: { urban: 0.90, suburban: 0.85, rural: 0.78 } },
    ],
  },
};

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = params.id as string;
  const project = projectDetails[projectId];
  
  const [showChart, setShowChart] = React.useState(false);
  const [aiChatOpen, setAiChatOpen] = React.useState(false);
  const [chatLoading, setChatLoading] = React.useState(false);
  const [chatMessages, setChatMessages] = React.useState([
    { role: "assistant", content: "Hi! I'm your AI fairness assistant. Ask me anything about this project." }
  ]);
  const [chatInput, setChatInput] = React.useState("");

  const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_AI_API_KEY;
  const hasApiKey = GEMINI_API_KEY && GEMINI_API_KEY !== "YOUR_GEMINI_API_KEY_HERE" && GEMINI_API_KEY.length > 20;

  if (!project) {
    return (
      <div className="space-y-6">
        <div className="rounded-xl border border-border bg-card p-6 text-center">
          <p className="text-lg font-medium">Project not found</p>
          <Link href="/demo/projects">
            <Button className="mt-4">Back to Projects</Button>
          </Link>
        </div>
      </div>
    );
  }

  const getHeatmapColor = (value: number) => {
    if (value >= 0.8) return "bg-green-500";
    if (value >= 0.7) return "bg-yellow-500";
    if (value >= 0.6) return "bg-orange-500";
    return "bg-red-500";
  };

  const handleSendChat = async () => {
    if (!chatInput.trim() || chatLoading) return;
    
    const userMessage = chatInput;
    setChatMessages([...chatMessages, { role: "user", content: userMessage }]);
    setChatInput("");
    setChatLoading(true);

    try {
      if (hasApiKey) {
        const systemPrompt = `You are an AI assistant for FairLens, an AI fairness auditing platform. Current audit project: ${project.name}. Score: ${project.score ? Math.round(project.score * 100) + '%' : 'N/A'}.`;
        
        const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: `${systemPrompt}\n\nUser question: ${userMessage}` }] }],
            generationConfig: { temperature: 0.7, maxOutputTokens: 500 }
          })
        });

        const data = await response.json();
        const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "I couldn't generate a response.";
        setChatMessages(prev => [...prev, { role: "assistant", content: aiResponse }]);
      } else {
        await new Promise(r => setTimeout(r, 1000));
        const fallbackResponses = [
          "Based on the audit data, I recommend reviewing the disparate impact metrics.",
          "The model shows fairness issues in certain demographic groups. Consider re-weighting the training data.",
          "Mitigation strategies include post-processing calibration and fairness-aware training.",
        ];
        const randomResponse = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
        setChatMessages(prev => [...prev, { role: "assistant", content: randomResponse }]);
      }
    } catch {
      setChatMessages(prev => [...prev, { role: "assistant", content: "I encountered an error. Please try again." }]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/demo/projects">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{project.name}</h1>
              <Badge variant="outline">{project.type}</Badge>
              {project.status === "completed" ? (
                <Badge variant={project.score >= 0.8 ? "default" : "destructive"}>
                  {Math.round(project.score * 100)}% Fair
                </Badge>
              ) : (
                <Badge variant="secondary">In Progress</Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{project.description}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => {
            const report = `# ${project.name}\n\nScore: ${Math.round((project.score || 0) * 100)}%\nViolations: ${project.violations?.length || 0}\n\n${JSON.stringify(project.metrics, null, 2)}`;
            const blob = new Blob([report], { type: 'text/markdown' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${project.name.toLowerCase().replace(/\s+/g, '-')}-report.md`;
            a.click();
            URL.revokeObjectURL(url);
          }}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button variant="outline" onClick={() => {
            const shareData = {
              title: `FairLens Audit: ${project.name}`,
              text: `Check out my AI fairness audit results for ${project.name}. Fairness Score: ${Math.round((project.score || 0) * 100)}%`,
              url: typeof window !== 'undefined' ? window.location.href : ''
            };
            
            if (navigator.share) {
              navigator.share(shareData);
            } else {
              const text = `FairLens Audit: ${project.name}\n\nFairness Score: ${Math.round((project.score || 0) * 100)}%\n\nCheck it out!`;
              const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
              const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareData.url)}`;
              const emailUrl = `mailto:?subject=${encodeURIComponent(shareData.title)}&body=${encodeURIComponent(shareData.text)}`;
              
              const shareWindow = window.open('', '_blank', 'width=600,height=500');
              if (shareWindow) {
                shareWindow.document.write(`
                  <html>
                    <head><title>Share</title></head>
                    <body style="font-family: system-ui; padding: 20px;">
                      <h3>Share this audit</h3>
                      <div style="display: flex; flex-direction: column; gap: 10px; max-width: 300px;">
                        <a href="${twitterUrl}" target="_blank" style="padding: 12px; background: #1DA1F2; color: white; text-decoration: none; border-radius: 8px; text-align: center;">Share on X (Twitter)</a>
                        <a href="${linkedinUrl}" target="_blank" style="padding: 12px; background: #0A66C2; color: white; text-decoration: none; border-radius: 8px; text-align: center;">Share on LinkedIn</a>
                        <a href="${emailUrl}" style="padding: 12px; background: #EA4335; color: white; text-decoration: none; border-radius: 8px; text-align: center;">Share via Email</a>
                        <button onclick="navigator.clipboard.writeText('${text}'); alert('Copied to clipboard!');" style="padding: 12px; background: #666; color: white; border: none; border-radius: 8px; cursor: pointer;">Copy to Clipboard</button>
                      </div>
                    </body>
                  </html>
                `);
              }
            }
          }}>
            <Share2 className="mr-2 h-4 w-4" />
            Share
          </Button>
        </div>
      </div>

      {project.status === "in_progress" ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <h2 className="text-xl font-semibold">Audit in Progress</h2>
          <p className="text-muted-foreground">The fairness audit is still running. Check back soon.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-sm text-muted-foreground">Dataset</p>
              <p className="text-xl font-bold">{project.dataset}</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-sm text-muted-foreground">Rows</p>
              <p className="text-xl font-bold">{project.rows.toLocaleString()}</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-sm text-muted-foreground">Columns</p>
              <p className="text-xl font-bold">{project.columns}</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-sm text-muted-foreground">Violations</p>
              <p className="text-xl font-bold">{project.violations?.length || 0}</p>
            </div>
          </div>

          {project.violations?.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="text-lg font-semibold mb-4">Fairness Violations</h2>
              <div className="space-y-3">
                {project.violations.map((v: any, i: number) => (
                  <div key={i} className={`flex items-center gap-3 rounded-lg border p-3 ${
                    v.severity === "critical" ? "border-destructive/30 bg-destructive/5 dark:bg-destructive/10" : "border-yellow-300 bg-yellow-50 dark:bg-yellow-900/30"
                  }`}>
                    <AlertTriangle className={`h-5 w-5 ${v.severity === "critical" ? "text-destructive" : "text-yellow-600"}`} />
                    <span className="font-medium">{v.type}</span>
                    <span className="text-sm text-muted-foreground">for {v.groups.join(", ")}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="text-lg font-semibold mb-4">Fairness Metrics</h2>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(project.metrics).map(([key, m]: [string, any]) => (
                <div key={key} className={`flex items-center justify-between rounded-lg border p-4 ${
                  m.status === "pass" ? "border-green-300 bg-green-50 dark:bg-green-900/20" :
                  m.status === "fail" ? "border-destructive/30 bg-destructive/5" :
                  "border-yellow-300 bg-yellow-50 dark:bg-yellow-900/30"
                }`}>
                  <span className="font-medium capitalize">{key.replace("_", " ")}</span>
                  <span className={`font-bold ${
                    m.status === "pass" ? "text-green-600" :
                    m.status === "fail" ? "text-destructive" : "text-yellow-600"
                  }`}>{Math.round(m.value * 100)}%</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Bias Heatmap</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowChart(!showChart)}>
                <BarChart3 className="mr-2 h-4 w-4" />
                {showChart ? "View Heatmap" : "View Chart"}
              </Button>
            </div>
            
            {showChart ? (
              <div className="space-y-4">
                <div className="h-48 flex items-end justify-around gap-2 border-b border-border pb-4">
                  {[65, 68, 72, 70, 75, 78].map((score, i) => (
                    <div key={i} className="flex flex-col items-center gap-2">
                      <div className="w-8 bg-primary rounded-t" style={{ height: `${score}%` }} />
                      <span className="text-xs text-muted-foreground">{Math.round(score)}%</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-around text-xs text-muted-foreground">
                  <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span>
                </div>
                <div className="flex items-center gap-2 mt-4">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-muted-foreground">Improved by 13% over 6 months</span>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {project.heatmap.map((row: any) => (
                  <div key={row.attribute} className="flex items-center gap-2">
                    <span className="w-20 text-sm font-medium capitalize">{row.attribute}</span>
                    <div className="flex flex-1 gap-1">
                      {Object.entries(row.values).map(([key, value]: [string, any]) => (
                        <div key={key} className={`flex-1 rounded px-2 py-3 text-center text-xs font-medium text-white ${getHeatmapColor(value)}`}>
                          {Math.round(value * 100)}%
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-border bg-card p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">AI Insights</h2>
              </div>
              <Badge variant="secondary">Gemini</Badge>
            </div>
            
            <Button className="w-full gap-2" variant="outline" onClick={() => setAiChatOpen(!aiChatOpen)}>
              <MessageSquare className="h-4 w-4" />
              Ask AI Assistant
            </Button>
            
            {aiChatOpen && (
              <div className="mt-4 rounded-lg border border-border">
                <div className="max-h-60 space-y-4 overflow-y-auto p-4">
                  {chatMessages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                        msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                      }`}>
                        {msg.content}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 border-t border-border p-3">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendChat()}
                    placeholder={hasApiKey ? "Ask about the audit..." : "Ask... (demo)"}
                    disabled={chatLoading}
                    className="flex-1 rounded-lg border border-border px-3 py-2 text-sm"
                  />
                  <Button size="sm" onClick={handleSendChat} disabled={chatLoading}>
                    {chatLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}