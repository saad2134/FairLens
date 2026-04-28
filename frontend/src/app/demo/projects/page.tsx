"use client";

import * as React from "react";
import Link from "next/link";
import {
  Folder,
  Plus,
  Search,
  CheckCircle,
  Clock,
  AlertTriangle,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const mockProjects = [
  { id: "1", name: "Loan Approval Model v2.3", description: "Analyzing loan approval fairness for credit applications", status: "completed", score: 0.78, violations: 2, lastAudit: "2 hours ago", type: "Classification", dataset: "loan_data_2024.csv" },
  { id: "2", name: "Credit Risk Assessment", description: "Fairness audit for credit scoring model", status: "completed", score: 0.92, violations: 0, lastAudit: "1 day ago", type: "Regression", dataset: "credit_scores.parquet" },
  { id: "3", name: "Insurance Premium Predictor", description: "Insurance pricing model bias analysis", status: "in_progress", score: null, violations: null, lastAudit: "In progress...", type: "Classification", dataset: "insurance_premiums.csv" },
  { id: "4", name: "Employee Screening AI", description: "Resume screening model fairness", status: "completed", score: 0.65, violations: 3, lastAudit: "3 days ago", type: "Classification", dataset: "hiring_data.csv" },
  { id: "5", name: "Housing Approval Model", description: "Public housing allocation fairness", status: "completed", score: 0.84, violations: 1, lastAudit: "1 week ago", type: "Classification", dataset: "housing_approvals.csv" },
];

export default function ProjectsPage() {
  const [search, setSearch] = React.useState("");
  const [filter, setFilter] = React.useState("all");

  const filteredProjects = mockProjects.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "all" || (filter === "completed" && p.status === "completed") || (filter === "in_progress" && p.status === "in_progress");
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Projects</h1>
          <p className="text-muted-foreground">Manage your fairness audit projects</p>
        </div>
        <Link href="/demo/projects/new">
          <Button className="gap-2"><Plus className="h-4 w-4" />New Audit</Button>
        </Link>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input type="text" placeholder="Search projects..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full rounded-lg border border-border py-2 pl-10 pr-4 text-sm" />
        </div>
        <div className="flex gap-2">
          <Button variant={filter === "all" ? "secondary" : "outline"} size="sm" onClick={() => setFilter("all")}>All</Button>
          <Button variant={filter === "completed" ? "secondary" : "outline"} size="sm" onClick={() => setFilter("completed")}>Completed</Button>
          <Button variant={filter === "in_progress" ? "secondary" : "outline"} size="sm" onClick={() => setFilter("in_progress")}>In Progress</Button>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card">
        <div className="divide-y divide-border">
          {filteredProjects.length === 0 ? (
            <div className="p-12 text-center">
              <Folder className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-lg font-medium">No projects found</p>
              <p className="text-sm text-muted-foreground">Create a new project to get started</p>
            </div>
          ) : (
            filteredProjects.map((project) => (
              <Link key={project.id} href={`/demo/projects/${project.id}`} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    {project.status === "completed" ? <CheckCircle className="h-6 w-6 text-green-600" /> : <Clock className="h-6 w-6 text-primary animate-pulse" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{project.name}</p>
                      <Badge variant="outline">{project.type}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-1">{project.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">{project.dataset} • {project.lastAudit}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {project.score !== null && (
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                      project.score >= 0.8 ? "bg-green-500/10 text-green-600" : project.score >= 0.7 ? "bg-yellow-500/10 text-yellow-600" : "bg-destructive/10 text-destructive"
                    }`}>{Math.round(project.score * 100)}% Fair</div>
                  )}
                  {project.violations !== null && project.violations > 0 && <Badge variant="destructive"><AlertTriangle className="mr-1 h-3 w-3" />{project.violations}</Badge>}
                  <Button variant="ghost" size="icon"><ChevronRight className="h-4 w-4" /></Button>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}