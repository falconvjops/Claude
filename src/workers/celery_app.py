"""Celery application configuration."""
from celery import Celery
from src.config.settings import settings

celery_app = Celery(
    "servicenow_llm",
    broker=settings.redis_url,
    backend=settings.redis_url,
    include=["src.workers.ingest_tasks"],
)

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
)
