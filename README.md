# ReActify PDF - Agentic RAG Core 🚀

An enterprise-grade, agentic PDF chatting application utilizing a **ReAct (Reasoning and Acting) Agent** framework. It ingests PDF documents into a **Supabase Vector Database** (PostgreSQL with `pgvector`), calculates embeddings using the Gemini API, and allows users to query documents dynamically with high fidelity in both English and Arabic.

---

## 🏛️ System Architecture

The following diagram illustrates the workflow of the ingestion and chat systems:

![System Architecture](docs/images/system_architecture.png)

---

## 🛠️ Tech Stack
* **Frontend**: React, Vite, CSS (Glassmorphic Dark Palette)
* **Backend**: FastAPI, Python, Poetry (Dependency Management)
* **Vector DB**: Supabase (PostgreSQL with `pgvector` extension)
* **AI Model**: Google Gemini API (`gemini-1.5-pro` for Agent, `gemini-embedding-2-preview` for Embeddings)
* **Agent Framework**: LangChain (ReAct Agent Core with custom tool retrieval)
* **Tunnelling**: ngrok (exposing local backend to frontend securely)

---

## ⚡ Key Features
* **Supabase Integration**: Bypasses local file-locking issues by using a scalable, cloud-based PostgreSQL vector database.
* **Dynamic Context Purging**: Clears older document vectors in Supabase on new PDF uploads to ensure context freshness.
* **ReAct Agent Loop**: The model automatically reasons whether it needs to fetch context from the PDF database or if the query can be answered directly.
* **High Performance**: Streaming, chunking, and indexing completed in seconds.

---

## 🚀 Setup & Execution

### 1. Prerequisites
Ensure you have the following installed:
* Python 3.11+
* Node.js & npm
* Poetry (Python Package Manager)

### 2. Supabase Setup
Before running the backend, set up your Supabase database:
1. Go to your **Supabase Dashboard** -> **SQL Editor** and execute the following SQL script to initialize the tables and search RPC:
   ```sql
   -- 1. Enable the pgvector extension
   create extension if not exists vector;

   -- 2. Create the documents table
   create table documents (
     id bigserial primary key,
     content text,
     metadata jsonb,
     embedding vector(3072) -- 3072 matches gemini-embedding-2-preview dimensions
   );

   -- 3. Create the similarity search function
   create or replace function match_documents (
     query_embedding vector(3072),
     match_count int default null,
     filter jsonb default '{}'
   )
   returns table (
     id bigint,
     content text,
     metadata jsonb,
     similarity float
   )
   language plpgsql
   as $$
   begin
     return query
     select
       documents.id,
       documents.content,
       documents.metadata,
       1 - (documents.embedding <=> query_embedding) as similarity
     from documents
     where documents.metadata @> filter
     order by documents.embedding <=> query_embedding
     limit match_count;
   end;
   $$;

   -- 4. Disable Row Level Security (RLS) for simple backend-only access
   alter table documents disable row level security;
   ```

### 3. Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install Python dependencies using Poetry:
   ```bash
   poetry install
   ```
3. Create a `.env` file in the `backend/` folder and populate it (see `backend/.env.example` as a template):
   ```env
   GEMINI_API_KEY="your_gemini_api_key_here"
   SUPABASE_URL="https://your-project-id.supabase.co"
   SUPABASE_KEY="your-supabase-service-role-key"
   LANGSMITH_PROJECT="Chat with PDF"
   LANGSMITH_TRACING=true
   LANGSMITH_ENDPOINT="https://api.smith.langchain.com"
   LANGSMITH_API_KEY="your_langsmith_api_key_here"
   ```
4. Run the FastAPI development server:
   ```bash
   poetry run uvicorn app.main:app --host 127.0.0.1 --port 8000
   ```

### 4. ngrok Configuration
Expose the backend port `8000` to the internet to allow the frontend to access it:
```bash
ngrok http 8000
```
Note the ngrok URL (e.g., `https://unsavingly-valvar-jami.ngrok-free.dev`).

### 5. Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install Node dependencies:
   ```bash
   npm install
   ```
3. Run the frontend development server:
   ```bash
   npm run dev
   ```
4. Open the frontend URL in your browser (default: `http://localhost:5173/`).
5. Set your Backend configuration URL to the ngrok URL generated in step 4.

---

## 📖 System Walkthrough
1. **Connect**: Open the frontend web app. The connection status should display **Online** (Green).
2. **Ingest**: Drag and drop a PDF file. The ingestion process deletes the existing vector database collection, splits the document into chunks, generates embeddings, and saves them to your Supabase PostgreSQL database.
3. **Chat**: Once the status changes to **READY**, send messages. The ReAct agent executor will run a thinking process, call `query_knowledge_base`, and provide an accurate response citing source page numbers.
