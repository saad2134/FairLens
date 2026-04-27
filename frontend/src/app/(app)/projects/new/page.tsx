"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, FileText, Check, ArrowRight, ArrowLeft, AlertCircle } from "lucide-react";
import { API_URL } from "@/lib/utils";

export default function NewProjectPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [dataset, setDataset] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState(1);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    setUploading(true);
    setError("");
    
    try {
      const createRes = await fetch(`${API_URL}/api/projects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description })
      });
      
      if (!createRes.ok) throw new Error("Failed to create project");
      const project = await createRes.json();

      if (dataset) {
        const formData = new FormData();
        formData.append("file", dataset);
        
        const uploadRes = await fetch(`${API_URL}/api/projects/${project.id}/upload`, {
          method: "POST",
          body: formData
        });
        
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          
          const auditRes = await fetch(
            `${API_URL}/api/projects/${project.id}/audit?dataset_id=${uploadData.dataset_id}`,
            { method: "POST" }
          );
          
          const auditData = await auditRes.json();
          
          if (auditData.audit_run_id) {
            router.push(`/audit/${auditData.audit_run_id}`);
            return;
          }
        }
      }
      
      router.push(`/projects/${project.id}`);
    } catch (err) {
      console.error(err);
      setError("Failed to create project. Please check the backend is running.");
    } finally {
      setUploading(false);
    }
  };

  const steps = [
    { num: 1, label: "Project Details" },
    { num: 2, label: "Upload Dataset" },
    { num: 3, label: "Run Audit" }
  ];

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">New Audit</h1>
      <p className="text-muted-foreground mb-6">Upload a dataset and run a fairness audit</p>

      <div className="flex items-center gap-2 mb-8">
        {steps.map((s, i) => (
          <div key={s.num} className="flex items-center flex-1">
            <div className={`flex items-center gap-2 ${step >= s.num ? "text-primary" : "text-muted-foreground"}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step > s.num ? "bg-primary text-primary-foreground" : 
                step === s.num ? "bg-primary text-primary-foreground" : "bg-muted"
              }`}>
                {step > s.num ? <Check className="w-4 h-4" /> : s.num}
              </div>
            </div>
            {i < steps.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 rounded ${step > s.num ? "bg-primary" : "bg-muted"}`} />
            )}
          </div>
        ))}
      </div>

      <form onSubmit={handleCreateProject} className="card">
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="label">Project Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input"
                placeholder="e.g., Loan Approval Model Audit"
                required
              />
            </div>
            
            <div>
              <label className="label">Description (optional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="textarea"
                placeholder="Describe what you're auditing..."
                rows={3}
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
                <AlertCircle className="w-4 h-4" />
                <p>{error}</p>
              </div>
            )}

            <button 
              type="button" 
              onClick={() => name.trim() && setStep(2)} 
              className="btn-primary w-full"
              disabled={!name.trim()}
            >
              Continue
              <ArrowRight className="w-4 h-4 ml-2" />
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div>
              <label className="label">Upload Dataset</label>
              <p className="text-sm text-muted-foreground mb-3">Upload a CSV or Parquet file</p>
              
              <div
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer ${
                  dataset ? "border-primary bg-primary/5" : "border-input hover:border-primary"
                }`}
                onClick={() => document.getElementById("dataset-input")?.click()}
              >
                <input
                  id="dataset-input"
                  type="file"
                  accept=".csv,.parquet"
                  className="hidden"
                  onChange={(e) => setDataset(e.target.files?.[0] || null)}
                />
                {dataset ? (
                  <div className="flex items-center justify-center gap-3">
                    <FileText className="w-8 h-8 text-primary" />
                    <div>
                      <p className="font-medium">{dataset.name}</p>
                      <p className="text-sm text-muted-foreground">{(dataset.size / 1024).toFixed(1)} KB</p>
                    </div>
                  </div>
                ) : (
                  <div>
                    <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground">Click to upload</p>
                    <p className="text-sm text-muted-foreground">CSV or Parquet files</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <button type="button" onClick={() => setStep(1)} className="btn-secondary flex-1">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </button>
              <button type="button" onClick={() => setStep(3)} className="btn-primary flex-1" disabled={!dataset}>
                Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Ready to run the audit. Click "Run Audit" to start the fairness analysis.
            </p>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
                <AlertCircle className="w-4 h-4" />
                <p>{error}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button type="button" onClick={() => setStep(2)} className="btn-secondary flex-1">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </button>
              <button type="submit" className="btn-primary flex-1" disabled={uploading}>
                {uploading ? "Running..." : "Run Audit"}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}