from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import shutil
import gc

from app.config import settings
from app.services.rag_engine import Rag_Engine
from app.services.agent_core import AgentCore
#_____________________________________________________________

app = FastAPI(
    title='Chat with PDF',
    description="High-performance FastAPI Backend for Document Ingestion and Agentic Querying",
    version="1.0.0"
)

# Protect Communication Channels with FrontEnd
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

agent_executer = None
active_qdrant_client = None

class ChatRequest(BaseModel):
    message: str

@app.get("/")
def root():
    '''Health Check'''
    return {
        'status': 'online',
        'project': settings.LANGSMITH_PROJECT,
        'agent_ready': agent_executer is not None,
        'engineer': 'Ahmed Akram Amer',
        'qdrant_url': settings.QDRANT_URL,
        'qdrant_collection': settings.QDRANT_COLLECTION_NAME
    }

@app.post("/api/upload")
async def upload_document(file: UploadFile = File(...)):
    '''
        Endpoint to receive PDF, trigger chunking, and spin up the Agent Executor.
    '''
    global agent_executer, active_qdrant_client
    
    if active_qdrant_client is not None:
        try:
            print("Closing previous agent's Qdrant client to release database lock...")
            active_qdrant_client.close()
        except Exception as e:
            print(f"Error closing previous Qdrant client: {e}")
        active_qdrant_client = None
    agent_executer = None
    
    # Force garbage collection to release any lingering sqlite file locks immediately
    gc.collect()
    
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Invalid file type. Only PDF documents are allowed.")
    
    os.makedirs("./pdfs", exist_ok=True)
    file_path = f"./pdfs/{file.filename}"
    
    try:
        # Save the file temporarily to the hard disk so that the PyPDFLoader can read it.
        with open(file_path, 'wb') as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        print(f"[INGEST] File saved to {file_path}. Starting RAG Engine...")
        
        # 1. Ingestion
        rag_engine = Rag_Engine(file_path=file_path, chunk_size=1000, chunk_overlap=200)
        rag_engine.execute_engine()
        
        # 2. Run the Agent
        agent_system = AgentCore()
        agent_executer = agent_system.execute_agent()
        active_qdrant_client = agent_system.qdrant_client
        
        return {
            "message": f"Successfully ingested '{file.filename}'",
            "status": "Agent Core is now fully armed and ready for chat!"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ingestion failed: {str(e)}")

@app.post("/api/chat")
async def chat_with_agent(request: ChatRequest):
    '''
        Endpoint to converse with the armed ReAct Agent.
    '''
    # Ensure the user uploads a file first before chatting
    if agent_executer is None:
        raise HTTPException(
            status_code=400, 
            detail="No document has been ingested yet. Please upload a PDF file first."
    )
    
    try:
        response = agent_executer.invoke({
            'input': request.message
        })
        
        return {
            'answer': response['output']
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Agent Error: {str(e)}")
