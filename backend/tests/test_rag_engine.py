import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.rag_engine import Rag_Engine

rag_engine = Rag_Engine(
    file_path = './pdfs/Transformers.pdf',
    chunk_size = 1000,
    chunk_overlap = 200
    )

rag_engine.execute_engine()
