from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Boolean, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db import Base
import enum

class JobStatus(str, enum.Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"

class Organization(Base):
    __tablename__ = "organizations"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    projects = relationship("Project", back_populates="organization")

class Project(Base):
    __tablename__ = "projects"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    organization = relationship("Organization", back_populates="projects")
    datasets = relationship("Dataset", back_populates="project")
    models = relationship("ModelConfig", back_populates="project")
    audit_runs = relationship("AuditRun", back_populates="project")

class Dataset(Base):
    __tablename__ = "datasets"
    
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"))
    filename = Column(String, nullable=False)
    original_name = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    file_hash = Column(String, nullable=False)
    row_count = Column(Integer, nullable=True)
    column_count = Column(Integer, nullable=True)
    detected_sensitive_columns = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    project = relationship("Project", back_populates="datasets")

class ModelConfig(Base):
    __tablename__ = "model_configs"
    
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"))
    name = Column(String, nullable=False)
    model_type = Column(String, nullable=False)
    file_path = Column(String, nullable=True)
    endpoint_url = Column(String, nullable=True)
    api_token = Column(String, nullable=True)
    model_hash = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    project = relationship("Project", back_populates="models")
    audit_runs = relationship("AuditRun", back_populates="model_config")

class AuditRun(Base):
    __tablename__ = "audit_runs"
    
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"))
    model_config_id = Column(Integer, ForeignKey("model_configs.id"), nullable=True)
    dataset_id = Column(Integer, ForeignKey("datasets.id"), nullable=True)
    status = Column(String, default=JobStatus.PENDING.value)
    job_id = Column(String, nullable=True)
    error_message = Column(Text, nullable=True)
    dataset_hash = Column(String, nullable=True)
    model_hash = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)
    
    project = relationship("Project", back_populates="audit_runs")
    model_config = relationship("ModelConfig", back_populates="audit_runs")
    metric_results = relationship("MetricResult", back_populates="audit_run")

class MetricResult(Base):
    __tablename__ = "metric_results"
    
    id = Column(Integer, primary_key=True, index=True)
    audit_run_id = Column(Integer, ForeignKey("audit_runs.id"))
    metric_name = Column(String, nullable=False)
    protected_attribute = Column(String, nullable=False)
    value = Column(Float, nullable=False)
    threshold = Column(Float, nullable=True)
    severity = Column(String, nullable=True)
    privileged_group = Column(String, nullable=True)
    unprivileged_group = Column(String, nullable=True)
    confidence_interval_low = Column(Float, nullable=True)
    confidence_interval_high = Column(Float, nullable=True)
    details = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    audit_run = relationship("AuditRun", back_populates="metric_results")