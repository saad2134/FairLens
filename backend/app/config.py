from pydantic_settings import BaseSettings
from functools import lru_cache
import os
from pathlib import Path
import logging

class Settings(BaseSettings):
    app_name: str = "FairLens"
    debug: bool = True
    secret_key: str = "dev-secret-key-change-in-production"
    database_url: str = "sqlite:///./fairlens.db"
    uploads_dir: str = "./uploads"
    cors_origins: list = ["http://localhost:5173", "http://localhost:3000"]
    
    # Google AI Services
    gemini_api_key: str = ""
    google_cloud_project: str = ""
    google_cloud_location: str = "us-central1"
    vertex_ai_staging_bucket: str = ""
    
    # Firebase
    firebase_project_id: str = ""
    firebase_database_url: str = ""
    firebase_private_key: str = ""
    firebase_client_email: str = ""
    
    # Feature flags
    enable_gemini_insights: bool = True
    enable_firebase_auth: bool = True
    
    class Config:
        env_file = ".env"
        extra = "ignore"

def check_google_services():
    """Log Google AI services status on startup."""
    import sys
    
    # Configure handler - use ASCII-safe output for Windows
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(logging.Formatter("[FairLens] %(message)s"))
    
    root = logging.getLogger()
    root.addHandler(handler)
    root.setLevel(logging.INFO)
    
    s = Settings()
    
    # Check for .env file existence
    env_path = Path(".env")
    if not env_path.exists():
        logging.warning(".env file not found - Google AI services will use fallback mode")
        return
    
    # Check Gemini (use ASCII-safe logging)
    if s.gemini_api_key and s.gemini_api_key != "YOUR_GEMINI_API_KEY_HERE":
        logging.info("[OK] Gemini API configured")
    else:
        logging.info("[i] Gemini: Using fallback (add API key to enable)")
    
    # Check Vertex AI
    if s.google_cloud_project and s.google_cloud_project != "YOUR_PROJECT_ID_HERE":
        logging.info(f"[OK] Vertex AI configured for project: {s.google_cloud_project}")
    else:
        logging.info("[i] Vertex AI: Not configured (add project ID to enable)")
    
    # Check Vision AI
    if s.google_cloud_project and s.google_cloud_project != "YOUR_PROJECT_ID_HERE":
        logging.info("[OK] Vision AI configured")
    else:
        logging.info("[i] Vision AI: Not configured (add project ID to enable)")
    
    # Check Firebase
    if s.firebase_project_id and s.firebase_project_id != "YOUR_PROJECT_ID":
        logging.info(f"[OK] Firebase configured: {s.firebase_project_id}")
    else:
        logging.info("[i] Firebase: Not configured (add project ID to enable)")

@lru_cache
def get_settings():
    return Settings()

settings = get_settings()