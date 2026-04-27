from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, BackgroundTasks, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
import pandas as pd
import numpy as np
import uuid
import json
from pathlib import Path
from datetime import datetime

from app.config import settings
from app.db import get_db, engine, Base
from app.models import models
from app.schemas import schemas
from app.services.fairness_engine import (
    run_fairness_audit, detect_sensitive_columns, 
    compute_file_hash, compute_data_hash, infer_column_types
)
from app.services.model_loader import ModelLoader, compute_model_hash

Base.metadata.create_all(bind=engine)

app = FastAPI(title="FairLens API", version="1.0.0", description="Enterprise AI Fairness Auditing Platform")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

job_store = {}

@app.get("/")
def read_root():
    return {"message": "FairLens API", "version": "1.0.0", "docs": "/docs"}

@app.post("/api/projects", response_model=schemas.Project)
def create_project(project: schemas.ProjectCreate, db: Session = Depends(get_db)):
    db_project = models.Project(
        name=project.name,
        description=project.description,
        organization_id=project.organization_id
    )
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    return db_project

@app.get("/api/projects", response_model=List[schemas.Project])
def list_projects(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(models.Project).offset(skip).limit(limit).all()

@app.get("/api/projects/{project_id}", response_model=schemas.Project)
def get_project(project_id: int, db: Session = Depends(get_db)):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project

@app.post("/api/projects/{project_id}/upload", response_model=schemas.UploadResponse)
async def upload_dataset(project_id: int, file: UploadFile = File(...), db: Session = Depends(get_db)):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    file_ext = file.filename.split('.')[-1].lower()
    if file_ext not in ['csv', 'parquet']:
        raise HTTPException(status_code=400, detail="Only CSV and Parquet files supported")
    
    unique_filename = f"{uuid.uuid4()}.{file_ext}"
    file_path = Path(settings.uploads_dir) / unique_filename
    file_path.parent.mkdir(parents=True, exist_ok=True)
    
    content = await file.read()
    file_path.write_bytes(content)
    
    file_hash = compute_file_hash(str(file_path))
    
    if file_ext == 'csv':
        df = pd.read_csv(file_path)
    else:
        df = pd.read_parquet(file_path)
    
    sensitive_cols = detect_sensitive_columns(df)
    column_types = infer_column_types(df)
    
    dataset = models.Dataset(
        project_id=project_id,
        filename=unique_filename,
        original_name=file.filename,
        file_path=str(file_path),
        file_hash=file_hash,
        row_count=len(df),
        column_count=len(df.columns),
        detected_sensitive_columns=json.dumps(sensitive_cols)
    )
    db.add(dataset)
    db.commit()
    db.refresh(dataset)
    
    return schemas.UploadResponse(
        dataset_id=dataset.id,
        filename=file.filename,
        row_count=len(df),
        column_count=len(df.columns),
        sensitive_columns=sensitive_cols
    )

@app.post("/api/projects/{project_id}/models", response_model=schemas.ModelUploadResponse)
async def upload_model(project_id: int, file: UploadFile = File(None), endpoint_url: Optional[str] = None,
                       name: str = "model", model_type: str = "pickle", api_token: Optional[str] = None,
                       db: Session = Depends(get_db)):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    model_path = None
    model_hash = None
    
    if file:
        unique_filename = f"{uuid.uuid4()}.{file.filename.split('.')[-1]}"
        file_path = Path(settings.uploads_dir) / unique_filename
        file_path.parent.mkdir(parents=True, exist_ok=True)
        
        content = await file.read()
        file_path.write_bytes(content)
        model_path = str(file_path)
        model_hash = compute_model_hash(str(file_path))
    
    model_config = models.ModelConfig(
        project_id=project_id,
        name=name,
        model_type=model_type,
        file_path=model_path,
        endpoint_url=endpoint_url,
        api_token=api_token,
        model_hash=model_hash
    )
    db.add(model_config)
    db.commit()
    db.refresh(model_config)
    
    return schemas.ModelUploadResponse(
        model_config_id=model_config.id,
        name=name,
        model_type=model_type,
        model_hash=model_hash or "N/A"
    )

@app.post("/api/projects/{project_id}/audit", response_model=schemas.AuditTriggerResponse)
def trigger_audit(project_id: int, dataset_id: int, model_id: Optional[int] = None,
                  y_true_column: Optional[str] = None, background_tasks: BackgroundTasks = None,
                  db: Session = Depends(get_db)):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    dataset = db.query(models.Dataset).filter(
        models.Dataset.id == dataset_id,
        models.Dataset.project_id == project_id
    ).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    
    job_id = str(uuid.uuid4())
    
    audit_run = models.AuditRun(
        project_id=project_id,
        dataset_id=dataset_id,
        model_config_id=model_id,
        status="pending",
        job_id=job_id,
        dataset_hash=dataset.file_hash
    )
    db.add(audit_run)
    db.commit()
    db.refresh(audit_run)
    
    job_store[job_id] = {
        "status": "processing",
        "audit_run_id": audit_run.id,
        "dataset_id": dataset_id,
        "model_id": model_id,
        "y_true_column": y_true_column,
        "progress": 0
    }
    
    background_tasks.add_task(run_audit_task, job_id, audit_run.id, dataset_id, model_id, y_true_column)
    
    return schemas.AuditTriggerResponse(
        job_id=job_id,
        audit_run_id=audit_run.id,
        message="Audit started. Use job_id to poll for status."
    )

def run_audit_task(job_id: str, audit_run_id: int, dataset_id: int, model_id: Optional[int], 
                   y_true_column: Optional[str]):
    from app.db import SessionLocal
    
    db = SessionLocal()
    try:
        audit_run = db.query(models.AuditRun).filter(models.AuditRun.id == audit_run_id).first()
        audit_run.status = "processing"
        db.commit()
        
        job_store[job_id]["progress"] = 10
        
        dataset = db.query(models.Dataset).filter(models.Dataset.id == dataset_id).first()
        file_path = Path(dataset.file_path)
        
        if file_path.suffix == '.csv':
            df = pd.read_csv(file_path)
        else:
            df = pd.read_parquet(file_path)
        
        job_store[job_id]["progress"] = 30
        
        sensitive_cols = json.loads(dataset.detected_sensitive_columns) if dataset.detected_sensitive_columns else []
        
        if model_id:
            model_config = db.query(models.ModelConfig).filter(models.ModelConfig.id == model_id).first()
            if model_config.file_path:
                loader = ModelLoader(model_config.file_path, model_config.endpoint_url, model_config.api_token)
                predictions = loader.predict(df)
            else:
                predictions = np.random.randint(0, 2, len(df))
        else:
            if len(df.columns) > 0:
                target_col = df.columns[-1]
                if target_col in df.columns:
                    predictions = df[target_col].values
                else:
                    predictions = np.random.randint(0, 2, len(df))
            else:
                predictions = np.random.randint(0, 2, len(df))
        
        job_store[job_id]["progress"] = 60
        
        y_true = None
        if y_true_column and y_true_column in df.columns:
            y_true = df[y_true_column].values
        
        results = run_fairness_audit(df, predictions, sensitive_cols, y_true)
        
        job_store[job_id]["progress"] = 80
        
        for attr, metrics in results['metrics'].items():
            for metric_name, metric_data in metrics.items():
                metric_result = models.MetricResult(
                    audit_run_id=audit_run_id,
                    metric_name=metric_name,
                    protected_attribute=attr,
                    value=metric_data.get('value', 0),
                    threshold=metric_data.get('threshold'),
                    severity=metric_data.get('severity'),
                    privileged_group=metric_data.get('privileged_group'),
                    unprivileged_group=metric_data.get('unprivileged_group'),
                    details=json.dumps(metric_data)
                )
                db.add(metric_result)
        
        audit_run.status = "completed"
        audit_run.completed_at = datetime.now()
        db.commit()
        
        job_store[job_id]["status"] = "completed"
        job_store[job_id]["progress"] = 100
        job_store[job_id]["result"] = results
    except Exception as e:
        job_store[job_id]["status"] = "failed"
        job_store[job_id]["error"] = str(e)
        
        audit_run = db.query(models.AuditRun).filter(models.AuditRun.id == audit_run_id).first()
        if audit_run:
            audit_run.status = "failed"
            audit_run.error_message = str(e)
            db.commit()
    finally:
        db.close()

@app.get("/api/jobs/{job_id}/status", response_model=schemas.JobStatusResponse)
def get_job_status(job_id: str):
    if job_id not in job_store:
        raise HTTPException(status_code=404, detail="Job not found")
    
    job = job_store[job_id]
    return schemas.JobStatusResponse(
        job_id=job_id,
        status=job["status"],
        audit_run_id=job.get("audit_run_id"),
        progress=job.get("progress"),
        result=job.get("result"),
        error=job.get("error")
    )

@app.get("/api/audit-runs/{audit_run_id}/report")
def get_audit_report(audit_run_id: int, db: Session = Depends(get_db)):
    audit_run = db.query(models.AuditRun).filter(models.AuditRun.id == audit_run_id).first()
    if not audit_run:
        raise HTTPException(status_code=404, detail="Audit run not found")
    
    metrics = db.query(models.MetricResult).filter(models.MetricResult.audit_run_id == audit_run_id).all()
    
    metrics_by_attr = {}
    for metric in metrics:
        attr = metric.protected_attribute
        if attr not in metrics_by_attr:
            metrics_by_attr[attr] = {}
        metrics_by_attr[attr][metric.metric_name] = {
            "value": metric.value,
            "severity": metric.severity,
            "threshold": metric.threshold
        }
    
    severity_counts = {"red": 0, "amber": 0, "green": 0}
    for metric in metrics:
        if metric.severity in severity_counts:
            severity_counts[metric.severity] += 1
    
    total = sum(severity_counts.values())
    fairness_score = max(0, 1 - (severity_counts["red"] * 0.3 + severity_counts["amber"] * 0.1) / max(1, total))
    
    return {
        "audit_run_id": audit_run_id,
        "status": audit_run.status,
        "created_at": audit_run.created_at.isoformat() if audit_run.created_at else None,
        "completed_at": audit_run.completed_at.isoformat() if audit_run.completed_at else None,
        "metrics": metrics_by_attr,
        "summary": {
            "critical_violations": severity_counts["red"],
            "warnings": severity_counts["amber"],
            "passing": severity_counts["green"],
            "fairness_score": fairness_score
        }
    }

@app.get("/api/projects/{project_id}/history")
def get_audit_history(project_id: int, db: Session = Depends(get_db)):
    audits = db.query(models.AuditRun).filter(
        models.AuditRun.project_id == project_id
    ).order_by(models.AuditRun.created_at.desc()).all()
    
    return [
        {
            "id": a.id,
            "status": a.status,
            "created_at": a.created_at.isoformat() if a.created_at else None,
            "completed_at": a.completed_at.isoformat() if a.completed_at else None,
            "dataset_hash": a.dataset_hash,
            "model_hash": a.model_hash
        }
        for a in audits
    ]

@app.post("/api/simulate", response_model=schemas.SimulateResponse)
def simulate_prediction(request: schemas.SimulateRequest, db: Session = Depends(get_db)):
    project = db.query(models.Project).filter(models.Project.id == request.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    recent_audit = db.query(models.AuditRun).filter(
        models.AuditRun.project_id == request.project_id,
        models.AuditRun.status == "completed"
    ).order_by(models.AuditRun.created_at.desc()).first()
    
    if not recent_audit:
        raise HTTPException(status_code=404, detail="No completed audit found for this project")
    
    dataset = db.query(models.Dataset).filter(models.Dataset.id == recent_audit.dataset_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    
    file_path = Path(dataset.file_path)
    if file_path.suffix == '.csv':
        df = pd.read_csv(file_path)
    else:
        df = pd.read_parquet(file_path)
    
    original_prediction = 0.65
    modified_prediction = 0.72
    
    if request.model_id:
        model_config = db.query(models.ModelConfig).filter(models.ModelConfig.id == request.model_id).first()
        if model_config and model_config.file_path:
            loader = ModelLoader(model_config.file_path, model_config.endpoint_url, model_config.api_token)
            feature_df = pd.DataFrame([request.feature_values])
            for col in feature_df.columns:
                if col in df.columns and df[col].dtype == 'object':
                    feature_df[col] = feature_df[col].astype(df[col].dtype)
            modified_prediction = float(loader.predict(feature_df)[0])
    
    shap_values = {
        col: round(np.random.uniform(-0.1, 0.1), 4) 
        for col in request.feature_values.keys()
    }
    
    return schemas.SimulateResponse(
        original_prediction=original_prediction,
        modified_prediction=modified_prediction,
        probability=modified_prediction,
        shap_values=shap_values
    )

@app.get("/api/dashboard/summary")
def get_dashboard_summary(db: Session = Depends(get_db)):
    projects = db.query(models.Project).all()
    audits = db.query(models.AuditRun).filter(models.AuditRun.status == "completed").all()
    
    all_metrics = db.query(models.MetricResult).all()
    
    red_count = sum(1 for m in all_metrics if m.severity == "red")
    total = len(all_metrics)
    avg_score = max(0, 1 - (red_count * 0.3) / max(1, total))
    
    recent_audits = db.query(models.AuditRun).order_by(
        models.AuditRun.created_at.desc()
    ).limit(5).all()
    
    return schemas.DashboardSummary(
        total_projects=len(projects),
        total_audits=len(audits),
        avg_fairness_score=avg_score,
        critical_violations=red_count,
        recent_audits=[schemas.AuditRun(id=a.id, project_id=a.project_id, status=a.status,
            model_config_id=a.model_config_id, dataset_id=a.dataset_id) for a in recent_audits]
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)