"use client";

import Link from "next/link";
import { Folder, Scale, AlertTriangle, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { API_URL } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface DashboardSummary {
  total_projects: number;
  total_audits: number;
  avg_fairness_score: number;
  critical_violations: number;
  recent_audits: Array<{
    id: number;
    project_id: number;
    status: string;
    created_at: string;
  }>;
}

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSummary() {
      try {
        const res = await fetch(`${API_URL}/api/dashboard/summary`, { 
          cache: 'no-store' 
        });
        if (res.ok) {
          const data = await res.json();
          setSummary(data);
        }
      } catch (e) {
        console.error('Failed to fetch dashboard:', e);
      } finally {
        setLoading(false);
      }
    }
    fetchSummary();
  }, []);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your fairness audit metrics</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card">
              <div className="skeleton h-4 w-24 mb-2" />
              <div className="skeleton h-8 w-16" />
            </div>
          ))}
        </div>
      ) : summary ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="card">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Folder className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Projects</p>
                  <p className="text-xl font-bold">{summary.total_projects}</p>
                </div>
              </div>
            </div>
            <div className="card">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Scale className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Audits</p>
                  <p className="text-xl font-bold">{summary.total_audits}</p>
                </div>
              </div>
            </div>
            <div className="card">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Scale className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Fairness Score</p>
                  <p className="text-xl font-bold">{Math.round(summary.avg_fairness_score * 100)}%</p>
                </div>
              </div>
            </div>
            <div className={`card ${summary.critical_violations > 0 ? 'border-destructive' : ''}`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 ${summary.critical_violations > 0 ? 'bg-destructive/10' : 'bg-primary/10'} rounded-lg flex items-center justify-center`}>
                  <AlertTriangle className={`w-5 h-5 ${summary.critical_violations > 0 ? 'text-destructive' : 'text-primary'}`} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Critical Issues</p>
                  <p className="text-xl font-bold">{summary.critical_violations}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Recent Audits</h2>
              <Link href="/projects" className="text-sm text-primary hover:underline">
                View All
              </Link>
            </div>

            {summary.recent_audits && summary.recent_audits.length > 0 ? (
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Project</th>
                      <th>Status</th>
                      <th>Date</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.recent_audits.map((audit) => (
                      <tr key={audit.id}>
                        <td className="font-mono">#{audit.project_id}</td>
                        <td>
                          <Badge variant={audit.status === 'completed' ? 'default' : audit.status === 'failed' ? 'destructive' : 'secondary'}>
                            {audit.status}
                          </Badge>
                        </td>
                        <td className="text-muted-foreground">
                          {audit.created_at ? new Date(audit.created_at).toLocaleDateString() : '-'}
                        </td>
                        <td>
                          <Link href={`/audit/${audit.id}`} className="text-sm text-primary hover:underline">
                            View Report
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No audits yet</p>
                <Link href="/projects/new">
                  <Button className="mt-4 gap-2">
                    <Plus className="w-4 h-4" />
                    Create First Audit
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="card text-center py-8">
          <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <p className="text-muted-foreground">Could not connect to the API</p>
        </div>
      )}
    </div>
  );
}