"use client";

import * as React from "react";
import Link from "next/link";
import {
  Folder,
  Scale,
  AlertTriangle,
  Plus,
  TrendingUp,
  CheckCircle,
  XCircle,
  AlertCircle,
  Upload,
  BarChart3,
  Download,
  Share2,
  Bot,
  MessageSquare,
  RefreshCw,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const mockProjects = [
  {
    id: "1",
    name: "Loan Approval Model v2.3",
    status: "completed",
    score: 0.78,
    violations: 2,
    lastAudit: "2 hours ago",
    updated: "2 hours ago",
    type: "Classification",
  },
  {
    id: "2",
    name: "Credit Risk Assessment",
    status: "completed",
    score: 0.92,
    violations: 0,
    lastAudit: "1 day ago",
    updated: "1 day ago",
    type: "Regression",
  },
  {
    id: "3",
    name: "Insurance Premium Predictor",
    status: "in_progress",
    score: null,
    violations: null,
    lastAudit: "In progress...",
    updated: "Just now",
    type: "Classification",
  },
];

const mockMetrics = [
  { name: "Demographic Parity", value: 0.85, severity: "green", target: "≥80%" },
  { name: "Equal Opportunity", value: 0.72, severity: "amber", target: "≥80%" },
  { name: "Disparate Impact", value: 0.68, severity: "red", target: "≥80%" },
  { name: "Equalized Odds", value: 0.79, severity: "green", target: "≥80%" },
];

const mockHeatmapData = [
  { attribute: "gender", values: { male: 0.92, female: 0.78, other: 0.85 } },
  { attribute: "age", values: { "18-25": 0.65, "26-40": 0.88, "41-60": 0.91, "60+": 0.72 } },
  { attribute: "race", values: { white: 0.94, black: 0.71, asian: 0.83, hispanic: 0.76 } },
  { attribute: "region", values: { urban: 0.89, suburban: 0.85, rural: 0.68 } },
];

const mockInsights = [
  { type: "critical", message: "Disparate Impact below 0.8 for 'female' and 'black' groups" },
  { type: "warning", message: "Equal Opportunity shows 15% gap for age group 60+" },
  { type: "success", message: "No bias detected in 'white' and 'asian' demographic groups" },
];

function getSeverityColor(severity: string) {
  switch (severity) {
    case "red": return "text-destructive bg-destructive/10 border-destructive/30";
    case "amber": return "text-yellow-600 bg-yellow-50 border-yellow-300 dark:bg-yellow-900/30 dark:border-yellow-700";
    case "green": return "text-green-600 bg-green-50 border-green-300 dark:bg-green-900/30 dark:border-green-700";
    default: return "";
  }
}

function getHeatmapColor(value: number) {
  if (value >= 0.8) return "bg-green-500";
  if (value >= 0.7) return "bg-yellow-500";
  if (value >= 0.6) return "bg-orange-500";
  return "bg-red-500";
}

export default function DemoDashboardPage() {
  const [aiChatOpen, setAiChatOpen] = React.useState(false);
  const [showChart, setShowChart] = React.useState(false);
  const [chatLoading, setChatLoading] = React.useState(false);
  const [chatMessages, setChatMessages] = React.useState([
    { role: "assistant", content: "Hi! I'm your AI fairness assistant. Ask me anything about this audit." }
  ]);
  const [chatInput, setChatInput] = React.useState("");

  const chartData = [
    { month: "Jan", score: 65 },
    { month: "Feb", score: 68 },
    { month: "Mar", score: 72 },
    { month: "Apr", score: 70 },
    { month: "May", score: 75 },
    { month: "Jun", score: 78 },
  ];

  const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_AI_API_KEY;
  const hasApiKey = GEMINI_API_KEY && GEMINI_API_KEY !== "YOUR_GEMINI_API_KEY_HERE" && GEMINI_API_KEY.length > 20;

  const systemPrompt = `You are an AI assistant for FairLens, an AI fairness auditing platform. You help users 
understand fairness metrics, identify bias in machine learning models, and suggest mitigation strategies.

Current audit data context:
- Project: Loan Approval Model v2.3
- Overall Fairness Score: 78%
- Critical Issues: 2 (Disparate Impact for female/black groups, Equal Opportunity gap for age 60+)
- Fairness Metrics:
  * Demographic Parity: 85% (PASS)
  * Equal Opportunity: 72% (WARNING - 15% gap for older applicants)
  * Disparate Impact: 68% (FAIL - female 32% less likely to be approved)
  * Equalized Odds: 79% (PASS)
- Sensitive attributes: gender, race, age, region

Key insights:
- Model shows significant disparate impact against female applicants (0.68 vs target 0.8)
- Black applicants have 29% lower approval rates
- Age group 60+ shows 15% gap in true positive rates
- No bias detected in white and asian demographic groups

When asked about mitigation, recommend:
1. Re-weighting training data to achieve parity
2. Post-processing calibration to equalize approval rates
3. Fairness-aware training using techniques like reweighting or equalized odds post-processing
4. Consider removing or transforming highly correlated features

Always provide clear, actionable insights and cite specific metrics when available.`;

  const handleSendChat = async () => {
    if (!chatInput.trim() || chatLoading) return;
    
    const userMessage = chatInput;
    setChatMessages([...chatMessages, { role: "user", content: userMessage }]);
    setChatInput("");
    setChatLoading(true);

    try {
      if (hasApiKey) {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: `${systemPrompt}\n\nUser question: ${userMessage}` }]
            }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 500,
            }
          })
        });

        const data = await response.json();
        const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || 
          "I apologize, but I couldn't generate a response at this time.";
        setChatMessages(prev => [...prev, { role: "assistant", content: aiResponse }]);
      } else {
        await new Promise(r => setTimeout(r, 1000));
        const fallbackResponses = [
          "Based on the audit data, the model shows significant disparate impact against female applicants (0.68 vs target 0.8). I recommend re-weighting the training data to achieve parity.",
          "The Equal Opportunity metric shows a 15% gap for age group 60+. Consider implementing age-neutral credit scoring or applying post-processing calibration.",
          "For the disparate impact issue affecting female and black applicants, I suggest re-weighting your training data or using fairness-aware training techniques like those available in the Fairlearn library.",
          "The overall fairness score of 78% indicates moderate bias. Key issues are Disparate Impact (68%) and Equal Opportunity (72%). Implementing reweighting or calibration could improve these metrics to above 80%.",
        ];
        const randomResponse = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
        setChatMessages(prev => [...prev, { role: "assistant", content: randomResponse }]);
      }
    } catch (error) {
      setChatMessages(prev => [...prev, { role: "assistant", content: "I apologize, but I encountered an error. Please try again." }]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Folder className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Projects</p>
              <p className="text-2xl font-bold">3</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Scale className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Audits</p>
              <p className="text-2xl font-bold">7</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg Fairness</p>
              <p className="text-2xl font-bold">78%</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-destructive/30 bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Critical Issues</p>
              <p className="text-2xl font-bold">2</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Projects */}
      <div className="rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border p-4">
          <h2 className="text-lg font-semibold">Recent Projects</h2>
          <Link href="/demo/projects/new">
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              New Audit
            </Button>
          </Link>
        </div>
        <div className="divide-y divide-border">
          {mockProjects.map((project) => (
            <Link 
              key={project.id} 
              href={`/demo/projects/${project.id}`}
              className="flex items-center justify-between p-4 hover:bg-muted/50"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  {project.status === "completed" ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <RefreshCw className="w-5 h-5 text-primary animate-spin" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{project.name}</p>
                  <p className="text-sm text-muted-foreground">Updated {project.updated}</p>
                </div>
                {project.violations !== null && project.violations > 0 && (
                  <Badge variant="destructive">{project.violations} Issues</Badge>
                )}
                <Button variant="ghost" size="icon">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Metrics & Heatmap Grid */}
      <div className="grid grid-cols-1 gap-6">
        {/* Fairness Metrics */}
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Fairness Metrics</h2>
            <Badge variant="outline">Latest Audit</Badge>
          </div>
          <div className="space-y-3">
            {mockMetrics.map((metric) => (
              <div key={metric.name} className={`flex items-center justify-between rounded-lg border p-3 ${getSeverityColor(metric.severity)}`}>
                <div className="flex items-center gap-3">
                  {metric.severity === "green" && <CheckCircle className="w-5 h-5 text-green-600" />}
                  {metric.severity === "amber" && <AlertCircle className="w-5 h-5 text-yellow-600" />}
                  {metric.severity === "red" && <XCircle className="w-5 h-5 text-destructive" />}
                  <span className="font-medium">{metric.name}</span>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold">{Math.round(metric.value * 100)}%</p>
                  <p className="text-xs text-muted-foreground">Target: {metric.target}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full bg-primary" style={{ width: "78%" }} />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">Overall Fairness Score: 78%</p>
          </div>
        </div>

        {/* Bias Heatmap / Chart Toggle */}
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Bias Heatmap</h2>
            <Button variant="ghost" size="sm" onClick={() => setShowChart(!showChart)}>
              <BarChart3 className="mr-2 h-4 w-4" />
              {showChart ? "View Heatmap" : "View Chart"}
            </Button>
          </div>
          
          {showChart ? (
            <div className="space-y-4">
              <div className="h-48 relative">
                <svg className="w-full h-full" viewBox="0 0 400 180" preserveAspectRatio="none">
                  <polyline
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    points="0,140 66,128 133,116 200,120 266,100 333,69"
                    className="text-primary"
                  />
                  <circle cx="0" cy="140" r="4" className="fill-primary" />
                  <circle cx="66" cy="128" r="4" className="fill-primary" />
                  <circle cx="133" cy="116" r="4" className="fill-primary" />
                  <circle cx="200" cy="120" r="4" className="fill-primary" />
                  <circle cx="266" cy="100" r="4" className="fill-primary" />
                  <circle cx="333" cy="69" r="4" className="fill-primary" />
                  <line x1="0" y1="180" x2="400" y2="180" stroke="currentColor" strokeWidth="1" className="text-border" />
                  <line x1="0" y1="0" x2="0" y2="180" stroke="currentColor" strokeWidth="1" className="text-border" />
                </svg>
              </div>
              <div className="flex justify-around text-xs text-muted-foreground">
                {chartData.map((d) => (
                  <span key={d.month}>{d.month}</span>
                ))}
              </div>
              <div className="flex items-center gap-2 mt-4">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="text-sm text-muted-foreground">Improved by 13% over 6 months</span>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {mockHeatmapData.map((row) => (
                <div key={row.attribute} className="flex items-center gap-2">
                  <span className="w-20 text-sm font-medium capitalize">{row.attribute}</span>
                  <div className="flex flex-1 gap-1">
                    {Object.entries(row.values).map(([key, value]) => (
                      <div
                        key={key}
                        className={`flex-1 rounded px-2 py-3 text-center text-xs font-medium text-white ${getHeatmapColor(value)}`}
                        title={`${key}: ${Math.round(value * 100)}%`}
                      >
                        {Math.round(value * 100)}%
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {!showChart && (
            <div className="mt-4 flex items-center justify-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <div className="h-3 w-3 rounded bg-red-500" />
                <span>&lt;60%</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="h-3 w-3 rounded bg-orange-500" />
                <span>60-70%</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="h-3 w-3 rounded bg-yellow-500" />
                <span>70-80%</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="h-3 w-3 rounded bg-green-500" />
                <span>≥80%</span>
              </div>
            </div>
          )}
        </div>

        {/* AI Insights */}
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">AI Insights</h2>
            </div>
            <Badge variant="secondary">Powered by Gemini</Badge>
          </div>
          <div className="space-y-3">
            {mockInsights.map((insight, i) => (
              <div
                key={i}
                className={`flex items-start gap-3 rounded-lg border p-3 ${
                  insight.type === "critical" ? "border-destructive/30 bg-destructive/5" :
                  insight.type === "warning" ? "border-yellow-300 bg-yellow-50 dark:border-yellow-700 dark:bg-yellow-900/20" :
                  "border-green-300 bg-green-50 dark:border-green-700 dark:bg-green-900/20"
                }`}
              >
                {insight.type === "critical" && <XCircle className="h-5 w-5 shrink-0 text-destructive" />}
                {insight.type === "warning" && <AlertCircle className="h-5 w-5 shrink-0 text-yellow-600" />}
                {insight.type === "success" && <CheckCircle className="h-5 w-5 shrink-0 text-green-600" />}
                <p className="text-sm">{insight.message}</p>
              </div>
            ))}
          </div>
          <Button
            className="mt-4 w-full gap-2"
            variant="outline"
            onClick={() => setAiChatOpen(!aiChatOpen)}
          >
            <MessageSquare className="h-4 w-4" />
            Ask AI Assistant
          </Button>
          
          {aiChatOpen && (
            <div className="mt-4 rounded-lg border border-border">
              <div className="max-h-60 space-y-4 overflow-y-auto p-4">
                {chatMessages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
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
                  placeholder={hasApiKey ? "Ask about the audit..." : "Ask about the audit... (demo mode)"}
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
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <Button variant="outline" className="gap-2">
          <Upload className="h-4 w-4" />
          Upload New Dataset
        </Button>
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Export Report
        </Button>
        <Button variant="outline" className="gap-2">
          <Share2 className="h-4 w-4" />
          Share Results
        </Button>
      </div>
    </div>
  );
}