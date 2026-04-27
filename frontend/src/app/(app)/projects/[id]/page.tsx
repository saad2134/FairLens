import { use } from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Folder, Upload, Play, FileText, AlertCircle, Clock } from "lucide-react";
import { API_URL } from "@/lib/utils";

interface Project {
  id: number;
  name: string;
  description?: string;
  created_at: string;
}

interface Dataset {
  id: number;
  filename: string;
  row_count: number;
  column_count: number;
  detected_sensitive_columns: string[];
}

interface AuditRun {
  id: number;
  status: string;
  created_at: string;
  completed_at?: string;
}

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [audits, setAudits] = useState<AuditRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [uploadingDataset, setUploadingDataset] = useState(false);
  const [runningAudit, setRunningAudit] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const projRes = await fetch(`${API_URL}/api/projects/${id}`);
        if (!projRes.ok) throw new Error("Project not found");
        const projData = await projRes.json();
        setProject(projData);

        const historyRes = await fetch(`${API_URL}/api/projects/${id}/history`);
        if (historyRes.ok) {
          const historyData = await historyRes.json();
          setAudits(historyData);
        }
      } catch (e) {
        setError("Failed to load project");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  const handleUploadDataset = async (file: File) => {
    setUploadingDataset(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      
      const res = await fetch(`${API_URL}/api/projects/${id}/upload`, {
        method: "POST",
        body: formData
      });
      
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      
      setDatasets(prev => [{
        id: data.dataset_id,
        filename: data.filename,
        row_count: data.row_count,
        column_count: data.column_count,
        detected_sensitive_columns: data.sensitive_columns || []
      }, ...prev]);
    } catch (e) {
      console.error(e);
      setError("Failed to upload dataset");
    } finally {
      setUploadingDataset(false);
    }
  };

  const handleRunAudit = async (datasetId: number) => {
    setRunningAudit(true);
    try {
      const res = await fetch(`${API_URL}/api/projects/${id}/audit?dataset_id=${datasetId}`, { method: "POST" });
      
      if (!res.ok) throw new Error("Audit failed");
      const data = await res.json();
      
      if (data.audit_run_id) {
        router.push(`/audit/${data.audit_run_id}`);
      }
    } catch (e) {
      console.error(e);
      setError("Failed to run audit");
    } finally {
      setRunningAudit(false);
    }
  };

  if (loading) {
    return <div className="p-6"><div className="skeleton h-32 w-full" /></div>;
  }

  if (error && !project) {
    return (
      <div className="p-6">
        <Link href="/projects" className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
        <div className="card text-center py-12">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <Link href="/projects" className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to Projects
      </Link>

      <div className="mb-6 flex items-center gap-3">
        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
          <Folder className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">{project?.name}</h1>
          <p className="text-muted-foreground">{project?.description || "No description"}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Datasets</h2>
            <label className="btn btn-sm btn-secondary cursor-pointer">
              <Upload className="w-3.5 h-3.5" />
              Upload
              <input
                type="file"
                accept=".csv,.parquet"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleUploadDataset(e.target.files[0])}
                disabled={uploadingDataset}
              />
            </label>
          </div>
          
          {datasets.length > 0 ? (
            <div className="space-y-3">
              {datasets.map((ds) => (
                <div key={ds.id} className="p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" />
                    <span className="font-medium text-sm">{ds.filename}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {ds.row_count} rows × {ds.column_count} columns
                  </p>
                  {audits.length === 0 && (
                    <button 
                      onClick={() => handleRunAudit(ds.id)}
                      disabled={runningAudit}
                      className="btn btn-sm btn-primary mt-3"
                    >
                      <Play className="w-3.5 h-3.5" />
                      Run Audit
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-sm text-muted-foreground">
              No datasets uploaded yet
            </div>
          )}
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Audit History</h2>
          
          {audits.length > 0 ? (
            <div className="space-y-3">
              {audits.map((audit) => (
                <div key={audit.id} className="p-3 bg-muted rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="font-mono text-sm">#{audit.id}</span>
                    <span className={`badge ${
                      audit.status === "completed" ? "badge-green" :
                      audit.status === "failed" ? "badge-red" : "badge-amber"
                    }`}>
                      {audit.status}
                    </span>
                  </div>
                  {audit.status === "completed" && (
                    <Link href={`/audit/${audit.id}`} className="text-sm text-primary hover:underline">
                      View
                    </Link>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-sm text-muted-foreground">
              No audits run yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
}