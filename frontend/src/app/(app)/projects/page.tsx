"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Plus, Folder, Trash2, ArrowRight, ArrowLeft, Upload, Play, FileText } from "lucide-react";
import { mockApi } from "@/lib/mock-api";

interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: string;
}

interface Dataset {
  id: string;
  filename: string;
  columns: string[];
  sensitiveColumns: string[];
  rowCount: number;
}

function ProjectList() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');

  useEffect(() => {
    loadProjects();
  }, []);

  async function loadProjects() {
    setLoading(true);
    try {
      const data = await mockApi.getProjects();
      setProjects(data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    
    setCreating(true);
    try {
      const project = await mockApi.createProject(newName, newDesc);
      setProjects(prev => [project, ...prev]);
      setNewName('');
      setNewDesc('');
      setShowCreate(false);
    } catch (e) {
      alert('Failed to create project');
    }
    setCreating(false);
  }

  function deleteProject(id: string, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setProjects(prev => prev.filter(p => p.id !== id));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Projects</h1>
            <p className="text-muted-foreground text-sm">Manage your fairness audits</p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Project
          </button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {showCreate && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-card rounded-xl p-6 w-full max-w-md border">
              <h2 className="text-xl font-bold mb-4">Create New Project</h2>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Project Name</label>
                  <input
                    type="text"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    placeholder="e.g., Hiring Model Audit"
                    className="w-full px-4 py-2 border rounded-lg bg-background"
                    required
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    value={newDesc}
                    onChange={e => setNewDesc(e.target.value)}
                    placeholder="Brief description..."
                    className="w-full px-4 py-2 border rounded-lg bg-background"
                    rows={3}
                  />
                </div>
                <div className="flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={() => setShowCreate(false)}
                    className="px-4 py-2 border rounded-lg hover:bg-muted"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50"
                  >
                    {creating ? 'Creating...' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {projects.length === 0 ? (
          <div className="text-center py-16">
            <Folder className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">No projects yet</h2>
            <p className="text-muted-foreground mb-4">Create your first project to start auditing fairness</p>
            <button
              onClick={() => setShowCreate(true)}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create Project
            </button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {projects.map(project => (
              <Link
                key={project.id}
                href={`/projects?id=${project.id}`}
                className="bg-card rounded-xl p-6 border hover:border-primary transition-colors group"
              >
                <div className="flex items-start justify-between mb-3">
                  <Folder className="w-6 h-6 text-muted-foreground" />
                  <button
                    onClick={e => deleteProject(project.id, e)}
                    className="p-1 hover:bg-red-100 dark:hover:bg-red-900 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
                <h3 className="text-lg font-semibold mb-1">{project.name}</h3>
                <p className="text-sm text-muted-foreground mb-3">{project.description || 'No description'}</p>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{new Date(project.createdAt).toLocaleDateString()}</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function ProjectDetail({ projectId }: { projectId: string }) {
  const [project, setProject] = useState<Project | null>(null);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    loadProject();
  }, [projectId]);

  async function loadProject() {
    setLoading(true);
    try {
      const projects = await mockApi.getProjects();
      const proj = projects.find(p => p.id === projectId) || projects[0];
      if (proj) {
        setProject(proj);
      } else {
        setProject({ id: projectId, name: 'Demo Project', description: 'Sample project', createdAt: new Date().toISOString() });
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  async function handleUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setUploading(true);
    
    const form = e.currentTarget;
    const file = (form.elements.namedItem('file') as HTMLInputElement).files?.[0];
    if (!file) {
      setUploading(false);
      return;
    }

    try {
      const result = await mockApi.uploadDataset(projectId, file);
      setDatasets(prev => [...prev, {
        id: result.uploadId,
        filename: file.name,
        columns: result.columns,
        sensitiveColumns: result.sensitiveColumns,
        rowCount: result.rowCount
      }]);
      
      alert(`Uploaded ${file.name}! ${result.rowCount} rows, ${result.sensitiveColumns.length} sensitive columns found.`);
    } catch (err) {
      alert('Upload failed');
    }
    
    setUploading(false);
  }

  function runDemo() {
    setRunning(true);
    const demoData = [
      { gender: 'male', age: 'young', score: 0.85 },
      { gender: 'female', age: 'young', score: 0.72 },
      { gender: 'male', age: 'old', score: 0.78 },
      { gender: 'female', age: 'old', score: 0.65 },
      { gender: 'male', age: 'young', score: 0.82 },
      { gender: 'female', age: 'old', score: 0.68 },
    ];
    mockApi.runAudit(projectId, demoData).then(audit => {
      window.location.href = `/audit?id=${audit.id}`;
    }).catch(() => {
      setRunning(false);
      alert('Demo failed');
    });
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/projects" className="p-2 hover:bg-muted rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{project?.name || 'Project'}</h1>
            <p className="text-muted-foreground text-sm">{project?.description}</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6">
          <section className="bg-card rounded-xl p-6 border">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Upload Dataset
            </h2>
            
            <form onSubmit={handleUpload} className="flex gap-4 items-end">
              <div className="flex-1">
                <input
                  type="file"
                  name="file"
                  accept=".csv"
                  className="w-full p-2 border rounded-lg bg-background"
                />
              </div>
              <button
                type="submit"
                disabled={uploading}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50"
              >
                {uploading ? 'Uploading...' : 'Upload CSV'}
              </button>
            </form>
          </section>

          <section className="bg-card rounded-xl p-6 border">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Folder className="w-5 h-5" />
              Datasets
            </h2>
            
            {datasets.length === 0 ? (
              <p className="text-muted-foreground text-sm">No datasets uploaded yet.</p>
            ) : (
              <div className="space-y-3">
                {datasets.map(ds => (
                  <div key={ds.id} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{ds.filename}</p>
                        <p className="text-sm text-muted-foreground">
                          {ds.rowCount} rows • {ds.columns.length} columns • {ds.sensitiveColumns.length} sensitive
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        const data = [];
                        for (let i = 0; i < Math.min(ds.rowCount, 100); i++) {
                          const row: Record<string, any> = {};
                          for (const col of ds.columns) {
                            if (ds.sensitiveColumns.includes(col)) {
                              row[col] = col === 'gender' ? (Math.random() > 0.5 ? 'male' : 'female') : 'group_a';
                            } else {
                              row[col] = `value_${i}`;
                            }
                          }
                          row.score = Math.random() * 0.4 + 0.5;
                          data.push(row);
                        }
                        setRunning(true);
                        mockApi.runAudit(projectId, data).then(audit => {
                          window.location.href = `/audit?id=${audit.id}`;
                        });
                      }}
                      className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 flex items-center gap-2"
                    >
                      <Play className="w-4 h-4" />
                      Run Audit
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="bg-card rounded-xl p-6 border">
            <h2 className="text-lg font-semibold mb-4">Quick Demo</h2>
            <button
              onClick={runDemo}
              disabled={running}
              className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:opacity-90 disabled:opacity-50"
            >
              {running ? 'Running...' : 'Run Demo Audit'}
            </button>
          </section>
        </div>
      </main>
    </div>
  );
}

function ProjectsContent() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get('id');
  
  if (projectId) {
    return <ProjectDetail projectId={projectId} />;
  }
  
  return <ProjectList />;
}

export default function ProjectsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    }>
      <ProjectsContent />
    </Suspense>
  );
}