import os
from datetime import datetime, timedelta, timezone
from dotenv import load_dotenv
from openai import OpenAI
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_qdrant import QdrantVectorStore
from qdrant_client import QdrantClient
from typing import Optional, List
from pymongo import MongoClient
from bson import ObjectId
from prompt import get_system_prompt

load_dotenv()

_openai_client = OpenAI(
    base_url= os.getenv("OPENAI_BASE_URL"),
    api_key = os.getenv("OPENAI_API_KEY")
)

_embedding_model = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
_qdrant_client = QdrantClient(url=os.getenv("QDRANT_URL"))

_vector_store = QdrantVectorStore(
    client=_qdrant_client,
    collection_name=os.getenv("QDRANT_COLLECTION"),
    embedding=_embedding_model,
)

MONGO_URI = os.getenv("MONGO_URI")
_mongo_client = MongoClient(MONGO_URI)
db = _mongo_client["streamify_db"]
_messages_collection = db["messages"]


def extract_period(query: str) -> Optional[str]:
    q = query.lower().strip()
    summary_keywords = ["summarize", "summary", "recap", "overview", "highlights", "digest", "brief"]

    if not any(k in q for k in summary_keywords):
        return None

    if any(x in q for x in ["today", "this day"]): return "today"
    if any(x in q for x in ["yesterday", "last day"]): return "yesterday"
    if any(x in q for x in ["week", "7 days", "seven days", "last 7", "past week"]): return "last_7_days"
    if any(x in q for x in ["month", "30 days", "last 30", "past month"]): return "last_30_days"

    return "yesterday"


def get_time_range(period: str):
    now = datetime.now(timezone.utc)
    if period == "today":
        start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    elif period == "yesterday":
        start = now - timedelta(days=1)
    elif period == "last_7_days":
        start = now - timedelta(days=7)
    elif period == "last_30_days":
        start = now - timedelta(days=30)
    else:
        return None, None
    return start, now


def filter_docs_by_time(docs, start: datetime, end: datetime) -> List:
    filtered = []
    for doc in docs:
        ts_str = doc.metadata.get("createdAt")
        if not ts_str: continue
        try:
            ts = datetime.fromisoformat(ts_str.replace("Z", "+00:00"))
            if start <= ts <= end:
                filtered.append(doc)
        except:
            continue
    return filtered


def format_context(docs) -> str:
    lines = []
    for d in docs:
        meta = d.metadata
        sender = meta.get("sender", "Unknown")
        ts = meta.get("createdAt", "N/A")
        try:
            date = ts.split("T")[0]
            time = ts.split("T")[1][:5]
            timestamp = f"{date} {time}"
        except:
            timestamp = ts
        text = d.page_content.strip()
        lines.append(f"[{timestamp}] {sender}: {text}")
    return "\n".join(lines)


def answer_with_ai(query: str, user_id: str, channel_id: str) -> str:
    global _embedding_model, _qdrant_client, _vector_store, _mongo_client, _openai_client, _messages_collection

    if _embedding_model is None:
        _embedding_model = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
    if _qdrant_client is None:
        _qdrant_client = QdrantClient(url=os.getenv("QDRANT_URL"))
    if _vector_store is None:
        _vector_store = QdrantVectorStore(
            client=_qdrant_client,
            collection_name=os.getenv("QDRANT_COLLECTION"),
            embedding=_embedding_model,
        )
    if _openai_client is None:
        _openai_client = OpenAI(
            base_url=os.getenv("OPENAI_BASE_URL"),
            api_key=os.getenv("OPENAI_API_KEY")
        )
    if _mongo_client is None:
        _mongo_client = MongoClient(os.getenv("MONGO_URI"))
        db = _mongo_client["streamify_db"]
        _messages_collection = db["messages"]

    query = query.strip()
    if not query:
        return "Please ask a question or request a summary."

    period = extract_period(query)
    is_summary = period is not None

    try:
        print("Starting vector search...")  # Debug
        results = _vector_store.similarity_search(query)
        print(f"Vector search results count: {len(results)}")  # Debug
    except Exception as e:
        print(f"Vector search error: {e}")  # Debug
        return f"Vector search error: {e}"

    try:
        results = [doc for doc in results if doc.metadata.get("channelId") == channel_id]
        print(f"Results after channelId filter: {len(results)}")  # Debug
    except Exception as e:
        print(f"ChannelId filter error: {e}")  # Debug
        return f"ChannelId filter error: {e}"


    # Time filters
    if is_summary:
        start, end = get_time_range(period)
        print(f"Time range: {start} to {end}")  # Debug
        if not start:
            print("Invalid time period.")  # Debug
            return "Invalid time period."
        docs = filter_docs_by_time(results, start, end)
        print(f"Filtered docs count: {len(docs)}")  # Debug
        if not docs:
            print(f"No messages found for {period}")  # Debug
            return f"No messages found for **{period.replace('_', ' ')}**."
    else:
        docs = results

    context = format_context(docs)
    print(f"Context length: {len(context)}")  # Debug

    SYSTEM_PROMPT = get_system_prompt(is_summary)
    user_query = f"""
**User Question**: {query}
** User ID**: {user_id}
**Chat Context** (newest first):
{context}
"""

    try:
        response = _openai_client.chat.completions.create(
            model="tngtech/deepseek-r1t2-chimera:free",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user",   "content": user_query}
            ]
        )
        print("OpenAI response received.")  # Debug
    except Exception as e:
        print(f"OpenAI error: {str(e)}")  # Debug
        return f"AI error: {str(e)}"
    
    now = datetime.now(timezone.utc)

    query_doc ={
        "sender" :  ObjectId(user_id),
        "channelId": channel_id,
        "text": query,
        "createdAt": now,
        "isRead" :  True,
        "isAi" :  True,
        "user" : ObjectId(user_id)
    }
    print(f"Inserting query_doc: {query_doc}")  # Debug
    _messages_collection.insert_one(query_doc)

    ai_doc = {
        "sender" :  ObjectId("6908f424d1e6c64d8c83d2e5"),  # AI user ID
        "channelId": channel_id,
        "text": response.choices[0].message.content.strip(),
        "createdAt": now,
        "isRead" :  True,
        "isAi" :  True,
        "user" : ObjectId(user_id)
    }
    print(f"Inserting ai_doc: {ai_doc}") 
    _messages_collection.insert_one(ai_doc)

    print("Returning AI response.")  # Debug
    return response.choices[0].message.content.strip()
