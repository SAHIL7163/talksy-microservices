import json
from celery_worker import celery
from chat import answer_with_ai
from redis_client import redis_client

@celery.task(name="ai.generate_response")
def generate_ai_response(query, user_id, channel_id):
    response = answer_with_ai(query, user_id, channel_id)

    message = json.dumps({
        "user_id": user_id,
        "channel_id": channel_id,
        "response": response
    })
    redis_client.publish(f"ai_response_{channel_id}_{user_id}", message)
