"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, FileText, Check, ArrowRight, ArrowLeft } from 'lucide-react';

export default function NewProject() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [dataset, setDataset] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    setUploading(true);
    setError('');
    
    try {
      // Create project
      const createRes = await fetch('http://localhost:8000/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description })
      });
      const project = await createRes.json();

      // Upload dataset if provided
      if (dataset) {
        const formData = new FormData();
        formData.append('file', dataset);
        
        const uploadRes = await fetch(`http://localhost:8000/api/projects/${project.id}/upload`, {
          method: 'POST',
          body: formData
        });
        
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          
          // Trigger audit
          const auditRes = await fetch(
            `http://localhost:8000/api/projects/${project.id}/audit?dataset_id=${uploadData.dataset_id}`,
            { method: 'POST' }
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
      setError('Failed to create project. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="pt-20 min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="font-serif text-3xl font-bold text-gray-900">Create New Audit</h1>
          <p className="text-gray-500 mt-1">Upload a dataset and run a fairness audit</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center gap-4 mb-8">
          {[1, 2, 3].map((s, i) => (
            <div key={s} className="flex items-center flex-1">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                step >= s ? 'bg-primary text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                {step > s ? <Check className="w-5 h-5" /> : s}
              </div>
              {i < 2 && (
                <div className={`flex-1 h-1 mx-2 rounded ${step > s ? 'bg-primary' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>

        <form onSubmit={handleCreateProject} className="card">
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Project Name</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Description (optional)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="input min-h-[100px] resize-none"
                  placeholder="Describe what you're auditing..."
                />
              </div>

              <button 
                type="button" 
                onClick={() => name.trim() && setStep(2)} 
                className="btn-primary w-full flex items-center justify-center gap-2"
                disabled={!name.trim()}
              >
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Upload Dataset</label>
                <p className="text-sm text-gray-500 mb-4">Upload a CSV or Parquet file containing your model data</p>
                
                <div
                  className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                    dataset ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-primary'
                  }`}
                  onClick={() => document.getElementById('dataset-input')?.click()}
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
                      <div className="text-left">
                        <p className="font-medium text-gray-900">{dataset.name}</p>
                        <p className="text-sm text-gray-500">{(dataset.size / 1024).toFixed(1)} KB</p>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <Upload className="w-10 h-10 mx-auto text-gray-400 mb-3" />
                      <p className="text-gray-600">Click to upload or drag and drop</p>
                      <p className="text-sm text-gray-400 mt-1">CSV or Parquet files</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setStep(1)} 
                  className="btn-outline flex-1 flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button 
                  type="button" 
                  onClick={() => setStep(3)} 
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                  disabled={!dataset}
                >
                  Continue <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Model (Optional)</label>
                <p className="text-sm text-gray-500 mb-4">Upload a trained model file, or skip to use baseline predictions</p>
                
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
                  <p className="text-gray-500">Model upload is optional - you can skip this step</p>
                  <p className="text-sm text-gray-400 mt-1">.pkl, .joblib, or .onnx</p>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setStep(2)} 
                  className="btn-outline flex-1 flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button 
                  type="submit" 
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                  disabled={uploading}
                >
                  {uploading ? 'Running Audit...' : 'Run Audit'}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}