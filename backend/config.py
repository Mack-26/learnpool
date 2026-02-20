from pathlib import Path

from dotenv import load_dotenv
from pydantic_settings import BaseSettings, SettingsConfigDict

# Load .env first and override any existing env vars (so .env wins over system/shell)
_env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(_env_path, override=True)


class Settings(BaseSettings):
    database_url: str
    jwt_secret: str
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 480
    openai_api_key: str
    oci_namespace: str = ""
    oci_bucket: str = "learnpool-documents"

    model_config = SettingsConfigDict(env_file=_env_path, env_file_encoding="utf-8")


settings = Settings()
