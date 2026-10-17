from typing import List
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

# Locate root directory to find .env.local or .env
ROOT_DIR = Path(__file__).resolve().parent.parent.parent.parent

class Settings(BaseSettings):
    PROJECT_NAME: str = "True Cost Portal - Forensic AI Backend"
    API_V1_STR: str = "/api/v1"
    GEMINI_API_KEY: str = ""
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "*"
    ]
    # Upgraded model execution pipeline targeting GA gemini-3.8-flash with fallback
    GEMINI_MODELS: List[str] = [
        "gemini-3.8-flash",
        "gemini-3.7-flash",
        "gemini-3.5-flash",
    ]

    model_config = SettingsConfigDict(
        env_file=(str(ROOT_DIR / ".env.local"), str(ROOT_DIR / ".env"), ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
