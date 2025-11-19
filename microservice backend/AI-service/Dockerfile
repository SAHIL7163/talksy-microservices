FROM python:3.11-slim

# Set workdir
WORKDIR /app

# Install system dependencies for building and Kafka integration
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    python3-dev \
    gcc \
    g++ \
    librdkafka-dev \
    libssl-dev \
    libgomp1 \
    libsndfile1 \
    ca-certificates \
    git \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Upgrade pip/wheel/setuptools first
RUN pip install --no-cache-dir --upgrade pip setuptools wheel

# Install CPU-only PyTorch first
RUN pip install --no-cache-dir torch==2.9.0+cpu --index-url https://download.pytorch.org/whl/cpu

# Copy requirements.txt
COPY requirements.txt .

# Install the rest of the Python dependencies (without torch)
RUN pip install --no-cache-dir -r requirements.txt

# Copy project source
COPY . .

# Expose FastAPI port
EXPOSE 8003

# Start FastAPI app
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8003"]
