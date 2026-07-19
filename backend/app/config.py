from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List, Union
import json
import os

class Settings(BaseSettings):
    PORT: int = 8000
    HOST: str = "0.0.0.0"
    CORS_ORIGINS: Union[str, List[str]] = ["http://localhost:3000"]
    UPLOAD_DIR: str = "uploads"
    ENVIRONMENT: str = "development"

    # SettingsConfigDict specifies env file lookup starting from backend directory
    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

    def get_cors_origins(self) -> List[str]:
        """Parses CORS origins from environment variable list strings."""
        if isinstance(self.CORS_ORIGINS, str):
            try:
                parsed = json.loads(self.CORS_ORIGINS)
                if isinstance(parsed, list):
                    return parsed
            except Exception:
                # Handle comma separated string fallback
                if "," in self.CORS_ORIGINS:
                    return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]
                return [self.CORS_ORIGINS]
        return self.CORS_ORIGINS

settings = Settings()
