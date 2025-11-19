# celery_worker.py
from celery import Celery
import os

redis_url = os.getenv("REDIS_URL", "redis://redis:6379/0")

celery = Celery(
    "ai_tasks",
    broker=redis_url,     
    backend=redis_url  
)

import ai_task  