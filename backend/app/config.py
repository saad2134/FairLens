from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    app_name: str = "FairLens"
    debug: bool = True
    secret_key: str = "dev-secret-key-change-in-production"
    database_url: str = "sqlite:///./fairlens.db"
    uploads_dir: str = "./uploads"
    cors_origins: list = ["http://localhost:5173", "http://localhost:3000"]
    
    class Config:
        env_file = ".env"

@lru_cache
def get_settings():
    return Settings()

settings = get_settings()