from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Anthropic
    anthropic_api_key: str = ""
    anthropic_model_complex: str = "claude-sonnet-4-6"
    anthropic_model_simple: str = "claude-haiku-4-5-20251001"

    # Voyage embeddings
    voyage_api_key: str = ""
    voyage_model: str = "voyage-3"
    embedding_batch_size: int = 128

    # PostgreSQL
    database_url: str = "postgresql+asyncpg://itsm:itsm@localhost:5432/itsm"

    # Redis
    redis_url: str = "redis://localhost:6379/0"
    cache_ttl_seconds: int = 3600

    # ChromaDB (Phase 1 vector store)
    chroma_persist_dir: str = "./data/chroma"
    chroma_collection_name: str = "itsm_records"

    # Retrieval
    retrieval_top_k: int = 20
    context_top_k: int = 10

    # App
    app_env: str = "development"
    log_level: str = "INFO"


settings = Settings()
