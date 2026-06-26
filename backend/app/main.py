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

agent_executor = None

class ChatRequest(BaseModel):
    message: str

@app.get("/")
def root():
    '''Health Check'''
    return {
        'status': 'online',
        'project': settings.LANGSMITH_PROJECT,
        'agent_ready': agent_executor is not None,
        'engineer': 'Ahmed Akram Amer',
        'supabase_url': settings.SUPABASE_URL
    }


@app.post("/api/upload")
async def upload_document(file: UploadFile = File(...)):
    global agent_executor
    
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Invalid file type.")
    
    os.makedirs("./pdfs", exist_ok=True)
    file_path = f"./pdfs/{file.filename}"
    
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # 1. Ingestion (clears Supabase and indexes new document)
        rag_engine = Rag_Engine(file_path=file_path, chunk_size=1000, chunk_overlap=200)
        rag_engine.execute_engine()
        
        # 2. Reset the executor and memory
        agent_executor = None
        
        agent_system = AgentCore()
        agent_executor = agent_system.execute_agent()
        
        return {
            "message": f"Successfully ingested '{file.filename}'",
            "status": "Agent Core handles completely fresh document context now!"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ingestion failed: {str(e)}")


@app.post("/api/chat")
async def chat_with_agent(request: ChatRequest):
    '''
        Endpoint to converse with the armed ReAct Agent.
    '''
    global agent_executor
    # Ensure the user uploads a file first before chatting
    if agent_executor is None:
        raise HTTPException(
            status_code=400, 
            detail="No document has been ingested yet. Please upload a PDF file first."
    )
    
    try:
        response = agent_executor.invoke({
            'input': request.message
        })
        
        return {
            'answer': response['output']
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Agent Error: {str(e)}")
