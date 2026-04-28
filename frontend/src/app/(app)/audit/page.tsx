"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, AlertTriangle, AlertCircle, CheckCircle, Sparkles, Copy, MessageSquare } from "lucide-react";
import { mockApi } from "@/lib/mock-api";

interface FairnessMetric {
  demographic_parity: number;
  disparate_impact: number;
  severity: 'green' | 'amber' | 'red';
  group_scores: Record<string, number>;
}

interface AuditResult {
  id: string;
  projectId: string;
  metrics: Record<string, FairnessMetric>;
  summary: {
    overall_score: number;
    critical_violations: number;
    warnings: number;
    passing: number;
  };
  createdAt: string;
}

function AuditContent() {
  const searchParams = useSearchParams();
  const auditId = searchParams.get('id') || 'demo_audit';
  
  const [audit, setAudit] = useState<AuditResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState<string | null>(null);
  const [generatingInsights, setGeneratingInsights] = useState(false);
  const [chatQuestion, setChatQuestion] = useState('');
  const [chatAnswer, setChatAnswer] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'metrics' | 'insights'>('overview');

  useEffect(() => {
    loadAudit();
  }, [auditId]);

  async function loadAudit() {
    setLoading(true);
    try {
      const stored = localStorage.getItem('fairlens_data');
      if (stored) {
        const data = JSON.parse(stored);
        const found = data.audits?.find((a: AuditResult) => a.id === auditId);
        if (found) {
          setAudit(found);
          setLoading(false);
          return;
        }
      }
      const demoAudit = mockApi.getDemoAudit();
      setAudit({ ...demoAudit, id: auditId });
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  async function generateInsights() {
    if (!audit) return;
    setGeneratingInsights(true);
    try {
      const result = await mockApi.generateInsights(audit);
      setInsights(result.insights);
    } catch (e) {
      console.error(e);
    }
    setGeneratingInsights(false);
  }

  async function handleChat(e: React.FormEvent) {
    e.preventDefault();
    if (!chatQuestion.trim()) return;
    try {
      const result = await mockApi.whatIfChat(chatQuestion);
      setChatAnswer(result.answer);
    } catch (e) {
      setChatAnswer('I can help with fairness questions!');
    }
  }

  async function copyReport() {
    if (!audit) return;
    try {
      const result = await mockApi.generateReport(audit);
      await navigator.clipboard.writeText(result.report);
      alert('Report copied!');
    } catch (e) {
      alert('Failed to copy');
    }
  }

  function getSeverityIcon(severity: string) {
    switch (severity) {
      case 'red': return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'amber': return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      default: return <CheckCircle className="w-5 h-5 text-green-500" />;
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!audit) {
    return (
      <div className="text-center py-16">
        <p>No audit found. <Link href="/projects" className="text-primary">Go back</Link></p>
      </div>
    );
  }

  const scoreColor = audit.summary.overall_score >= 0.8 ? 'text-green-500' : audit.summary.overall_score >= 0.6 ? 'text-amber-500' : 'text-red-500';

  return (
    <div className="space-y-6">
      <div className="bg-card rounded-xl p-6 border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-muted-foreground text-sm">Overall Fairness Score</p>
            <p className={`text-5xl font-bold ${scoreColor}`}>
              {Math.round(audit.summary.overall_score * 100)}%
            </p>
          </div>
          <div className="flex gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-red-500">{audit.summary.critical_violations}</p>
              <p className="text-sm text-muted-foreground">Critical</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-amber-500">{audit.summary.warnings}</p>
              <p className="text-sm text-muted-foreground">Warnings</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-500">{audit.summary.passing}</p>
              <p className="text-sm text-muted-foreground">Passing</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-2 border-b">
        {(['overview', 'metrics', 'insights'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-medium capitalize ${activeTab === tab ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-4">
          {Object.entries(audit.metrics).map(([attr, metric]) => (
            <div key={attr} className="bg-card rounded-xl p-4 border">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold capitalize">{attr}</h3>
                {getSeverityIcon(metric.severity)}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Disparate Impact</p>
                  <p className="text-xl font-medium">{(metric.disparate_impact * 100).toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Demographic Parity</p>
                  <p className="text-xl font-medium">{(metric.demographic_parity * 100).toFixed(1)}%</p>
                </div>
              </div>
              <div className="mt-4">
                <p className="text-sm text-muted-foreground mb-2">Group Scores</p>
                <div className="flex gap-2">
                  {Object.entries(metric.group_scores).map(([group, score]) => (
                    <span key={group} className="px-3 py-1 bg-muted rounded-lg text-sm">
                      {group}: {(score * 100).toFixed(0)}%
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'metrics' && (
        <div className="bg-card rounded-xl p-6 border">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Attribute</th>
                  <th className="text-right py-2">Disparate Impact</th>
                  <th className="text-right py-2">Demo Parity</th>
                  <th className="text-right py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(audit.metrics).map(([attr, metric]) => (
                  <tr key={attr} className="border-b">
                    <td className="py-2 capitalize">{attr}</td>
                    <td className="text-right py-2">{(metric.disparate_impact * 100).toFixed(1)}%</td>
                    <td className="text-right py-2">{(metric.demographic_parity * 100).toFixed(1)}%</td>
                    <td className="text-right py-2">{getSeverityIcon(metric.severity)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'insights' && (
        <div className="space-y-4">
          <div className="bg-card rounded-xl p-6 border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                AI Insights
              </h3>
              <button
                onClick={generateInsights}
                disabled={generatingInsights}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50"
              >
                {generatingInsights ? 'Generating...' : insights ? 'Regenerate' : 'Generate'}
              </button>
            </div>
            {insights ? (
              <pre className="whitespace-pre-wrap text-sm">{insights}</pre>
            ) : (
              <p className="text-muted-foreground">Click Generate to get AI-powered insights.</p>
            )}
          </div>

          <div className="bg-card rounded-xl p-6 border">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Ask Questions
            </h3>
            <form onSubmit={handleChat} className="flex gap-2">
              <input
                type="text"
                value={chatQuestion}
                onChange={e => setChatQuestion(e.target.value)}
                placeholder="Ask about fairness..."
                className="flex-1 px-4 py-2 border rounded-lg bg-background"
              />
              <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded-lg">
                Ask
              </button>
            </form>
            {chatAnswer && (
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <p className="text-sm whitespace-pre-wrap">{chatAnswer}</p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="mt-6 flex gap-3">
        <button
          onClick={copyReport}
          className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:opacity-90 flex items-center gap-2"
        >
          <Copy className="w-4 h-4" />
          Copy Report
        </button>
        <Link
          href="/projects"
          className="px-4 py-2 border rounded-lg hover:bg-muted flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>
      </div>
    </div>
  );
}

export default function AuditPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/projects" className="p-2 hover:bg-muted rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Audit Results</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <Suspense fallback={
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        }>
          <AuditContent />
        </Suspense>
      </main>
    </div>
  );
}