import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI, Query, HTTPException, WebSocket
import logging
from fastapi.middleware.cors import CORSMiddleware 
from consumer import start_consumer
from pydantic import BaseModel
from ai_task import generate_ai_response
from ai_ws import ai_websocket  

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

@asynccontextmanager
async def lifespan(app: FastAPI):
    task = asyncio.create_task(asyncio.to_thread(start_consumer))
    logger.info("🚀 Kafka consumer started in background thread")

    try:
        yield  # Let FastAPI run
    finally:
        task.cancel()
        logger.info("🛑 Kafka consumer stopped")

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# @app.get("/")
# async def root():
#     return {"message": "FastAPI + async-compatible Kafka consumer running!"}

class AIRequest(BaseModel):
    query: str 
    userId: str
    channelId: str


@app.post("/")
async def ai_endpoint(req: AIRequest):
    try:
        # Send task to Celery (async)
        task = generate_ai_response.delay(req.query, req.userId, req.channelId)
        return {"task_id": task.id, "status": "processing"}
    except Exception as e:
        import traceback
        print("AI Endpoint Error:", traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))


@app.websocket("/ws/{channel_id}")
async def ai_ws(channel_id: str, websocket: WebSocket, authId: str = Query(...)):
    print(f"WebSocket connection request for channel {channel_id} with authId {authId}")
    await ai_websocket(websocket, channel_id, authId)