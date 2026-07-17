# Chat with PDF - FastAPI Backend 🚀

This is the high-performance backend for the **Chat with PDF** application. It handles document ingestion, local vector embeddings generation, and agentic query processing with context retrieval.

## ⚡ Main Services & Architecture

* **FastAPI Routers (`app/main.py`)**: Defines endpoints for server health verification, document uploading, and chatting.
* **RAG Ingestion Pipeline (`app/services/rag_engine.py`)**: 
  - Loads PDFs using `PyPDFLoader`.
  - Splits text recursively using `RecursiveCharacterTextSplitter`.
  - Computes vector embeddings using Hugging Face's `all-MiniLM-L6-v2`.
  - Cleans up older content and indexes chunks in Supabase (`pgvector`).
* **AI Core Executor (`app/services/agent_core.py`)**: 
  - Connects to Supabase to retrieve matching context.
  - Keeps track of conversation history (multi-turn memory).
  - Orchestrates calls to the Groq API utilizing the `qwen/qwen3-32b` model.

## 🚀 Setup & Run

### 1. Installation
Install all dependencies using Poetry:
```bash
poetry install
```

### 2. Environment Configuration
Create a `.env` file in this directory with the following variables:
```env
GROQ_API_KEY="your_groq_api_key"
SUPABASE_URL="https://your-project-id.supabase.co"
SUPABASE_KEY="your-supabase-service-role-key"
LANGSMITH_PROJECT="Chat with PDF"
LANGSMITH_TRACING=true
LANGSMITH_ENDPOINT="https://api.smith.langchain.com"
LANGSMITH_API_KEY="your_langsmith_api_key"
```

### 3. Execution
Start the FastAPI server:
```bash
poetry run uvicorn app.main:app --host 127.0.0.1 --port 8000
```
