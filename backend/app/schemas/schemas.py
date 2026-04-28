from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum

class JobStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"

class OrganizationBase(BaseModel):
    name: str

class OrganizationCreate(OrganizationBase):
    pass

class Organization(OrganizationBase):
    id: int
    created_at: datetime
    
    model_config = {"protected_namespaces": ()}

class ProjectBase(BaseModel):
    name: str
    description: Optional[str] = None

class ProjectCreate(ProjectBase):
    organization_id: Optional[int] = None

class Project(ProjectBase):
    id: int
    organization_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    
    model_config = {"protected_namespaces": ()}

class DatasetBase(BaseModel):
    filename: str
    original_name: str

class Dataset(DatasetBase):
    id: int
    project_id: int
    file_path: str
    file_hash: str
    row_count: Optional[int] = None
    column_count: Optional[int] = None
    detected_sensitive_columns: Optional[str] = None
    created_at: datetime
    
    model_config = {"protected_namespaces": ()}

class ModelConfigBase(BaseModel):
    name: str
    model_type: str

class ModelConfigCreate(ModelConfigBase):
    project_id: int
    file_path: Optional[str] = None
    endpoint_url: Optional[str] = None
    api_token: Optional[str] = None

class ModelConfig(ModelConfigBase):
    id: int
    project_id: int
    file_path: Optional[str] = None
    endpoint_url: Optional[str] = None
    model_hash: Optional[str] = None
    created_at: datetime
    
    model_config = {"protected_namespaces": ()}

class MetricResultBase(BaseModel):
    metric_name: str
    protected_attribute: str
    value: float
    threshold: Optional[float] = None
    severity: Optional[str] = None
    privileged_group: Optional[str] = None
    unprivileged_group: Optional[str] = None
    confidence_interval_low: Optional[float] = None
    confidence_interval_high: Optional[float] = None
    details: Optional[str] = None

class MetricResult(MetricResultBase):
    id: int
    audit_run_id: int
    created_at: datetime
    
    model_config = {"protected_namespaces": ()}

class AuditRunBase(BaseModel):
    project_id: int
    model_config_id: Optional[int] = None
    dataset_id: Optional[int] = None

class AuditRunCreate(AuditRunBase):
    pass

class AuditRun(AuditRunBase):
    id: int
    status: str
    job_id: Optional[str] = None
    error_message: Optional[str] = None
    dataset_hash: Optional[str] = None
    model_hash: Optional[str] = None
    created_at: datetime
    completed_at: Optional[datetime] = None
    
    model_config = {"protected_namespaces": ()}

class AuditRunWithMetrics(AuditRun):
    metrics: List[MetricResult] = []

class UploadResponse(BaseModel):
    dataset_id: int
    filename: str
    row_count: int
    column_count: int
    sensitive_columns: List[str]

class ModelUploadResponse(BaseModel):
    model_config_id: int
    name: str
    model_type: str
    model_hash: str

class AuditTriggerResponse(BaseModel):
    job_id: str
    audit_run_id: int
    message: str

class JobStatusResponse(BaseModel):
    job_id: str
    status: JobStatus
    audit_run_id: Optional[int] = None
    progress: Optional[int] = None
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None

class SimulateRequest(BaseModel):
    project_id: int
    feature_values: Dict[str, Any]
    model_id: Optional[int] = None

class SimulateResponse(BaseModel):
    original_prediction: float
    modified_prediction: float
    probability: float
    shap_values: Dict[str, float]

class HeatmapCell(BaseModel):
    feature: str
    protected_attribute: str
    disparate_impact: float
    severity: str
    metric_value: float

class HeatmapData(BaseModel):
    cells: List[HeatmapCell]
    features: List[str]
    protected_attributes: List[str]

class DashboardSummary(BaseModel):
    total_projects: int
    total_audits: int
    avg_fairness_score: float
    critical_violations: int
    recent_audits: List[AuditRunWithMetrics] = []

# Google AI Schemas
class WhatIfChatRequest(BaseModel):
    question: str
    dataset_schema: Dict[str, str]
    model_info: Dict[str, Any]

class InsightsResponse(BaseModel):
    insights: str
    source: str  # "gemini" or "fallback"

class ComplianceReportRequest(BaseModel):
    format: str = "markdown"

class ComplianceReportResponse(BaseModel):
    report: str
    format: str

class ChatResponse(BaseModel):
    answer: str

# Firebase Schemas
class AuthRequest(BaseModel):
    id_token: str

class AuthResponse(BaseModel):
    uid: str
    email: str
    id_token: str
    source: str  # "firebase" or "fallback"

class FirebaseStatusResponse(BaseModel):
    configured: bool
    project_id: Optional[str] = None