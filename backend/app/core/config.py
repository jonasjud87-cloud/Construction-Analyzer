from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    # Anthropic
    anthropic_api_key: str

    # Supabase
    supabase_url: str
    supabase_service_key: str

    # Redis / Celery
    redis_url: str = "redis://localhost:6379/0"

    # App
    app_env: str = "development"
    cors_origins: list[str] = ["http://localhost:3000"]


settings = Settings()
