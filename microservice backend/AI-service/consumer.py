import os
import json
import logging
from confluent_kafka import Consumer, KafkaException
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_qdrant import QdrantVectorStore
from langchain_core.documents import Document


BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CA_PATH = os.path.join(BASE_DIR, "ca.pem")

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)


logger.info("Initializing embedding model and Qdrant vector store...")

try:
    embedding_model = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
    logger.info("✅ HuggingFace embedding model loaded successfully.")
except Exception as e:
    logger.exception("❌ Failed to load embedding model: %s", e)
    raise

QDRANT_URL = os.getenv("QDRANT_URL")
QDRANT_COLLECTION = os.getenv("QDRANT_COLLECTION")
text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=300)


def start_consumer():
    """Starts a blocking Kafka consumer to process chat messages."""
    kafka_broker = os.getenv("KAFKA_BROKER")
    kafka_username = os.getenv("KAFKA_USERNAME")
    kafka_password = os.getenv("KAFKA_PASSWORD")

    if not all([kafka_broker, kafka_username, kafka_password]):
        raise ValueError("Missing Kafka configuration (check env vars).")

    conf = {
        "bootstrap.servers": kafka_broker,
        "group.id": "ai-service-consumer",
        "auto.offset.reset": "earliest",
        "security.protocol": "SASL_SSL",
        "sasl.mechanisms": "SCRAM-SHA-256",
        "sasl.username": kafka_username,
        "sasl.password": kafka_password,
        "ssl.ca.location": CA_PATH,
        "session.timeout.ms": 45000,
        "socket.timeout.ms": 30000,
        "reconnect.backoff.max.ms": 5000,
    }

    logger.info("🧩 Connecting to Kafka broker: %s", kafka_broker)
    consumer = Consumer(conf)
    consumer.subscribe(["chat-messages"])

    logger.info("✅ Kafka consumer started and subscribed to 'chat-messages'.")

    try:
        while True:
            msg = consumer.poll(1.0)
            if msg is None:
                continue

            if msg.error():
                logger.error("❌ Kafka Error: %s", msg.error())
                continue

            try:
                payload = json.loads(msg.value().decode("utf-8"))
                message_obj = payload.get("payload", payload)

                message_text = message_obj.get("text", "")
                
                logger.info("📩 New message: %s", message_text[:80])
            except json.JSONDecodeError:
                message_text = msg.value().decode("utf-8")
                message_obj = {}

            # Extract actual channelId, sender, createdAt from message_obj
            channel_id = message_obj.get("channelId")
            sender = message_obj.get("sender")
            created_at = message_obj.get("createdAt")
            parent_message = message_obj.get("parentMessage")


            meta = {
                "channelId": channel_id,
                "sender": sender,
                "createdAt": created_at,
                "parentMessage": parent_message,
            }
            chunks = text_splitter.split_text(message_text)
            docs = [Document(page_content=chunk, metadata=meta) for chunk in chunks]

            try:
                QdrantVectorStore.from_documents(
                    documents=docs,
                    embedding=embedding_model,
                    url=QDRANT_URL,
                    collection_name=QDRANT_COLLECTION,
                )
                logger.info("✅ Stored %d chunk(s) in Qdrant", len(chunks))
            except Exception as e:
                logger.exception("❌ Failed to store document in Qdrant: %s", e)

    except KeyboardInterrupt:
        logger.info("🛑 Kafka consumer manually stopped.")
    except KafkaException as e:
        logger.exception("Kafka exception: %s", e)
    finally:
        consumer.close()
        logger.info("🔚 Kafka consumer closed.")
