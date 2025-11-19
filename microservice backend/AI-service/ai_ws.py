import json
from fastapi import WebSocket
from redis_client import get_pubsub
import asyncio
from redis_client import redis_client 
from fastapi import WebSocketDisconnect  

async def ai_websocket(websocket: WebSocket, channel_id: str, authId: str):
    await websocket.accept()
    pubsub = get_pubsub()
    pubsub.subscribe(f"ai_response_{channel_id}_{authId}")

    try:
        while True:
            message = pubsub.get_message()  
            if message:
                data = json.loads(message["data"])
                await websocket.send_json(data)
            await asyncio.sleep(0.01)
    except WebSocketDisconnect:
        print(f"Client disconnected from channel {channel_id}")
    finally:
        pubsub.close()
