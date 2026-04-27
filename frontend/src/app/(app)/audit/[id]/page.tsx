"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft, Scale, AlertTriangle, CheckCircle, Clock, FileText, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { API_URL } from "@/lib/utils";

interface MetricData {
  value: number;
  severity: string;
  threshold?: number;
}

interface AuditReport {
  audit_run_id: number;
  status: string;
  created_at: string;
  metrics: Record<string, Record<string, MetricData>>;
  summary: {
    critical_violations: number;
    warnings: number;
    passing: number;
    fairness_score: number;
  };
}

export default function AuditReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [report, setReport] = useState<AuditReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function fetchReport() {
      try {
        const res = await fetch(`${API_URL}/api/audit-runs/${id}/report`, { cache: 'no-store' });
        if (!res.ok) throw new Error('Not found');
        const data = await res.json();
        setReport(data);
      } catch (e) {
        console.error('Failed to fetch report:', e);
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    fetchReport();
  }, [id]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="skeleton h-8 w-64 mb-4" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-24" />)}
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="p-6">
        <Link href="/projects" className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
        <div className="card text-center py-12">
          <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <p className="text-muted-foreground">Report not found</p>
        </div>
      </div>
    );
  }

  const metricNames: Record<string, string> = {
    demographic_parity: "Demographic Parity",
    equal_opportunity: "Equal Opportunity",
    disparate_impact: "Disparate Impact",
    equalized_odds: "Equalized Odds"
  };

  const heatmapData = Object.entries(report.metrics || {}).map(([attr, metrics]) => ({
    attribute: attr,
    disparate_impact: metrics.disparate_impact?.value ?? 1,
    severity: metrics.disparate_impact?.severity || "green"
  }));

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "red": return { bg: "#FEE2E2", text: "#DC2626" };
      case "amber": return { bg: "#FEF3C7", text: "#D97706" };
      default: return { bg: "#DCFCE7", text: "#16A34A" };
    }
  };

  return (
    <div className="p-6">
      <Link href="/projects" className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to Projects
      </Link>

      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Fairness Audit Report</h1>
          <p className="text-muted-foreground flex items-center gap-2">
            <Clock className="w-4 h-4" />
            {new Date(report.created_at).toLocaleString()}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Overall Score</p>
          <p className="text-4xl font-bold text-primary">
            {Math.round((report.summary?.fairness_score || 0) * 100)}%
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <div className={`card ${report.summary?.critical_violations > 0 ? 'border-l-destructive' : ''}`}>
          <div className="flex items-center gap-3">
            <AlertTriangle className={`w-5 h-5 ${report.summary?.critical_violations > 0 ? 'text-destructive' : 'text-muted-foreground'}`} />
            <div>
              <p className="text-sm text-muted-foreground">Critical</p>
              <p className="text-xl font-bold">{report.summary?.critical_violations || 0}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <Scale className="w-5 h-5 text-amber-500" />
            <div>
              <p className="text-sm text-muted-foreground">Warnings</p>
              <p className="text-xl font-bold">{report.summary?.warnings || 0}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <div>
              <p className="text-sm text-muted-foreground">Passing</p>
              <p className="text-xl font-bold">{report.summary?.passing || 0}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <p className="text-xl font-bold capitalize">{report.status}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="card mb-6">
        <h2 className="text-lg font-semibold mb-4">Bias Heatmap</h2>
        <p className="text-sm text-muted-foreground mb-4">Disparate impact ratio. Below 0.8 indicates bias.</p>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {heatmapData.map((cell) => {
            const colors = getSeverityColor(cell.severity);
            return (
              <div key={cell.attribute} className="p-4 rounded-lg text-center" style={{ backgroundColor: colors.bg }}>
                <p className="text-sm font-medium capitalize mb-1">{cell.attribute}</p>
                <p className="text-2xl font-bold" style={{ color: colors.text }}>{cell.disparate_impact.toFixed(2)}</p>
                <span className={`badge mt-2 ${
                  cell.severity === "red" ? "badge-red" : cell.severity === "amber" ? "badge-amber" : "badge-green"
                }`}>{cell.severity}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Detailed Metrics</h2>
        
        {report.metrics && Object.entries(report.metrics).length > 0 ? (
          <div className="space-y-6">
            {Object.entries(report.metrics).map(([attr, metrics]) => (
              <div key={attr}>
                <h3 className="text-base font-medium capitalize mb-3 pb-2 border-b">{attr} Attribute</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {Object.entries(metrics).map(([metricName, data]) => (
                    <div key={metricName} className="p-4 bg-muted rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{metricNames[metricName] || metricName}</span>
                        <span className={`badge ${
                          data.severity === "green" ? "badge-green" : data.severity === "amber" ? "badge-amber" : "badge-red"
                        }`}>{data.severity}</span>
                      </div>
                      <p className={`text-xl font-bold ${
                        data.severity === "red" ? "text-red-600" : data.severity === "amber" ? "text-amber-600" : "text-green-600"
                      }`}>{typeof data.value === "number" ? data.value.toFixed(4) : data.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-8">No metrics available</p>
        )}
      </div>

      {report.status === "completed" && (
        <div className="mt-6 text-center">
          <Link href="/projects/new" className="btn-secondary inline-block">
            <RefreshCw className="w-4 h-4 mr-2" />
            Run New Audit
          </Link>
        </div>
      )}
    </div>
  );
}