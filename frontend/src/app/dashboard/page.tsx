import Link from 'next/link';
import { FolderOpen, Search, Scale, AlertTriangle } from 'lucide-react';

interface DashboardSummary {
  total_projects: number;
  total_audits: number;
  avg_fairness_score: number;
  critical_violations: number;
  recent_audits: any[];
}

async function getDashboardSummary(): Promise<DashboardSummary> {
  try {
    const res = await fetch('http://localhost:8000/api/dashboard/summary', { 
      cache: 'no-store' 
    });
    if (!res.ok) throw new Error('Failed to fetch');
    return res.json();
  } catch {
    return {
      total_projects: 0,
      total_audits: 0,
      avg_fairness_score: 1,
      critical_violations: 0,
      recent_audits: []
    };
  }
}

export default async function Dashboard() {
  const summary = await getDashboardSummary();

  return (
    <div className="pt-20 min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="font-serif text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Overview of your fairness audit metrics</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard 
            title="Total Projects" 
            value={summary.total_projects} 
            icon={<FolderOpen className="w-6 h-6" />} 
          />
          <StatCard 
            title="Total Audits" 
            value={summary.total_audits} 
            icon={<Search className="w-6 h-6" />} 
          />
          <StatCard 
            title="Fairness Score" 
            value={`${Math.round(summary.avg_fairness_score * 100)}%`} 
            icon={<Scale className="w-6 h-6" />} 
          />
          <StatCard 
            title="Critical Issues" 
            value={summary.critical_violations} 
            icon={<AlertTriangle className="w-6 h-6" />}
            highlight={summary.critical_violations > 0}
          />
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Recent Audits</h2>
            <Link href="/projects" className="text-sm text-primary hover:underline">
              View All Projects
            </Link>
          </div>

          {summary.recent_audits && summary.recent_audits.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Project ID</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Date</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.recent_audits.map((audit: any) => (
                    <tr key={audit.id} className="border-b border-gray-100">
                      <td className="py-3 px-4 text-sm font-mono">#{audit.project_id}</td>
                      <td className="py-3 px-4">
                        <span className={`badge ${
                          audit.status === 'completed' ? 'badge-green' : 
                          audit.status === 'failed' ? 'badge-red' : 'badge-amber'
                        }`}>
                          {audit.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {audit.created_at ? new Date(audit.created_at).toLocaleDateString() : '-'}
                      </td>
                      <td className="py-3 px-4">
                        <Link href={`/audit/${audit.id}`} className="text-primary hover:underline text-sm">
                          View Report
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Scale className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No audits yet</h3>
              <p className="text-gray-500 mb-4">Create your first project to start auditing for fairness</p>
              <Link href="/projects/new" className="btn-primary inline-block">
                Create Project
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, highlight }: { 
  title: string; 
  value: string | number; 
  icon: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div className={`card ${highlight ? 'border-red-300 bg-red-50' : ''}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className={`text-2xl font-bold mt-1 ${highlight ? 'text-red-600' : 'text-gray-900'}`}>{value}</p>
        </div>
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${highlight ? 'bg-red-100 text-red-600' : 'bg-primary/10 text-primary'}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}