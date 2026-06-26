import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.rag_engine import Rag_Engine
from app.services.agent_core import AgentCore

print("🚀 Phase 1: Ingesting Data...")
rag = Rag_Engine(file_path='./pdfs/Transformers.pdf', chunk_size=1000, chunk_overlap=200)
rag.execute_engine()

print("\n🧠 Phase 2: Deploying Agent & Chatting...")
agent_system = AgentCore()
executor = agent_system.execute_agent()

user_question = "What is the main advantage of the Transformer architecture mentioned in the paper?"
response = executor.invoke({"input": user_question})

print("\n✨ Agent Final Answer:")
print(response["output"])