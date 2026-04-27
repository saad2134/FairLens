import Link from 'next/link';
import { ArrowLeft, Scale, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

interface MetricData {
  value: number;
  severity: string;
  threshold?: number;
}

interface AuditReport {
  audit_run_id: number;
  status: string;
  created_at: string;
  completed_at?: string;
  metrics: Record<string, Record<string, MetricData>>;
  summary: {
    critical_violations: number;
    warnings: number;
    passing: number;
    fairness_score: number;
  };
}

async function getAuditReport(id: string): Promise<AuditReport | null> {
  try {
    const res = await fetch(`http://localhost:8000/api/audit-runs/${id}/report`, { 
      cache: 'no-store' 
    });
    if (!res.ok) throw new Error('Failed to fetch');
    return res.json();
  } catch {
    return null;
  }
}

export default async function AuditReport({ params }: { params: { id: string } }) {
  const report = await getAuditReport(params.id);

  if (!report) {
    return (
      <div className="pt-20 min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="card text-center py-16">
            <XCircle className="w-12 h-12 mx-auto text-red-500 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Report not found</h2>
            <Link href="/projects" className="text-primary hover:underline">Back to projects</Link>
          </div>
        </div>
      </div>
    );
  }

  const metricNames: Record<string, string> = {
    demographic_parity: 'Demographic Parity',
    equal_opportunity: 'Equal Opportunity',
    disparate_impact: 'Disparate Impact',
    equalized_odds: 'Equalized Odds'
  };

  const heatmapData = Object.entries(report.metrics || {}).map(([attr, metrics]) => ({
    attribute: attr,
    disparate_impact: metrics.disparate_impact?.value ?? 1,
    severity: metrics.disparate_impact?.severity || 'green'
  }));

  return (
    <div className="pt-20 min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Link href="/projects" className="text-sm text-gray-500 hover:text-primary mb-2 inline-flex items-center gap-1">
            ← Back to Projects
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-serif text-3xl font-bold text-gray-900">Fairness Audit Report</h1>
              <p className="text-gray-500 mt-1">
                Run on {new Date(report.created_at).toLocaleString()}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Overall Fairness Score</p>
              <p className="text-4xl font-bold text-primary">{Math.round((report.summary?.fairness_score || 0) * 100)}%</p>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="card border-l-4 border-l-red-500">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-red-500" />
              <div>
                <p className="text-sm text-gray-500">Critical Violations</p>
                <p className="text-2xl font-bold text-red-600">{report.summary?.critical_violations || 0}</p>
              </div>
            </div>
          </div>
          <div className="card border-l-4 border-l-amber-500">
            <div className="flex items-center gap-3">
              <Scale className="w-6 h-6 text-amber-500" />
              <div>
                <p className="text-sm text-gray-500">Warnings</p>
                <p className="text-2xl font-bold text-amber-600">{report.summary?.warnings || 0}</p>
              </div>
            </div>
          </div>
          <div className="card border-l-4 border-l-green-500">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-green-500" />
              <div>
                <p className="text-sm text-gray-500">Passing</p>
                <p className="text-2xl font-bold text-green-600">{report.summary?.passing || 0}</p>
              </div>
            </div>
          </div>
          <div className="card border-l-4 border-l-primary">
            <div className="flex items-center gap-3">
              <Scale className="w-6 h-6 text-primary" />
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <p className="text-2xl font-bold text-primary capitalize">{report.status}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bias Heatmap */}
        <div className="card mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Bias Heatmap</h2>
          <p className="text-sm text-gray-500 mb-4">Disparate impact ratio by protected attribute (values below 0.8 are concerning)</p>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {heatmapData.map((cell) => (
              <div 
                key={cell.attribute} 
                className="p-4 rounded-xl text-center"
                style={{ 
                  backgroundColor: cell.severity === 'red' ? '#FEE2E2' : 
                                   cell.severity === 'amber' ? '#FEF3C7' : '#DCFCE7'
                }}
              >
                <p className="text-sm font-medium text-gray-700 capitalize">{cell.attribute}</p>
                <p className="text-2xl font-bold" style={{ 
                  color: cell.severity === 'red' ? '#DC2626' : 
                         cell.severity === 'amber' ? '#D97706' : '#16A34A'
                }}>
                  {cell.disparate_impact.toFixed(2)}
                </p>
                <p className="text-xs text-gray-500 capitalize">{cell.severity}</p>
              </div>
            ))}
            {heatmapData.length === 0 && (
              <p className="text-gray-500 col-span-full text-center py-8">No heatmap data available</p>
            )}
          </div>
        </div>

        {/* Detailed Metrics */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Detailed Metrics</h2>
          {report.metrics && Object.entries(report.metrics).map(([attr, metrics]) => (
            <div key={attr} className="mb-6 last:mb-0">
              <h3 className="text-md font-medium text-gray-800 capitalize mb-3 border-b border-gray-100 pb-2">
                {attr} Attribute
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(metrics).map(([metricName, data]) => (
                  <div key={metricName} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-700">
                        {metricNames[metricName] || metricName}
                      </span>
                      <span className={`badge ${
                        data.severity === 'green' ? 'badge-green' : 
                        data.severity === 'amber' ? 'badge-amber' : 'badge-red'
                      }`}>
                        {data.severity}
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">
                      {typeof data.value === 'number' ? data.value.toFixed(4) : data.value}
                    </p>
                    {data.threshold && (
                      <p className="text-sm text-gray-500 mt-1">Threshold: {data.threshold}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
          {(!report.metrics || Object.keys(report.metrics).length === 0) && (
            <p className="text-gray-500 text-center py-8">No detailed metrics available</p>
          )}
        </div>
      </div>
    </div>
  );
}