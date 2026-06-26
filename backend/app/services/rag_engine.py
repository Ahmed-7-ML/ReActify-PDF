# For any API Key
from app.config import settings

# 1. Read the PDF File
from langchain_community.document_loaders import PyPDFLoader

# 2. Convert it into Chunks
from langchain_text_splitters import RecursiveCharacterTextSplitter

# 3. Turn each chunk into embedding
from langchain_google_genai import GoogleGenerativeAIEmbeddings

# 4. Store all Embeddings of Chunks into Supabase Vector Store
from langchain_community.vectorstores import SupabaseVectorStore
from supabase.client import create_client

class Rag_Engine:
    '''
    Handles the entire document ingestion pipeline:
        - Parses a PDF File
        - Splits it into semantic chunks
        - Generate Embeddings
        - Indexes them into Qdrant
    '''
    
    def __init__(self, file_path: str, chunk_size: int = 1000, chunk_overlap: int = 200):
        '''

        '''
        self.loader = PyPDFLoader(file_path)
        self.splitter = RecursiveCharacterTextSplitter(
            chunk_size = chunk_size,
            chunk_overlap = chunk_overlap,
            length_function = len
        )
        # Initialize Google's Embedding Model
        self.embedding_model = GoogleGenerativeAIEmbeddings(
            model = 'gemini-embedding-2-preview',
            google_api_key = settings.GEMINI_API_KEY
        )
    
    # -----------------------------------------
    # Private Helpers
    # -----------------------------------------
    def _load_document(self):
        ''' Load the PDF Document securely '''
        return self.loader.load()
    
    def _split_into_chunks(self, documents):
        '''Applies character-recursive splitting to preserve contextual integrity'''
        return self.splitter.split_documents( documents )
    
    def _store_in_vectorstore(self, chunks):
        """Initializes connection to Supabase and upserts document vectors."""
        # 1. Clean up any existing documents to avoid mixing context of different PDFs
        client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)

        try:
            # Delete all documents to mimic fresh start (similar to deleting Qdrant collection)
            client.table("documents").delete().neq("id", 0).execute()
            print("[CLEANUP] Cleaned up existing documents in Supabase.")
        except Exception as e:
            print(f"Info: Could not clean up existing documents: {e}")

        # 2. Build and Upsert the Vector Store using LangChain wrapper
        try:
            vectorstore = SupabaseVectorStore(
                client=client,
                embedding=self.embedding_model,
                table_name="documents",
                query_name="match_documents"
            )
            vectorstore.add_documents(chunks)
            print(f"[INGEST] Successfully indexed {len(chunks)} chunks into Supabase.")
        except Exception as e:
            print(f"[ERROR] Failed to add documents to Supabase: {e}")
            raise e

    def execute_engine(self) -> bool:
        '''
            Orchestrates the entire ingestion cycle. 
            Main interface to be called by FastAPI routers.
        '''
        try:
            print("[INGEST] Step 1: Loading PDF Document...")
            docs = self._load_document()
            
            print(f"[INGEST] Step 2: Splitting into chunks (Total Pages: {len(docs)})...")
            chunks = self._split_into_chunks(docs)
            
            print(f"[INGEST] Step 3: Generating Embeddings & Ingesting into Qdrant ({len(chunks)} chunks)...")
            self._store_in_vectorstore(chunks)
            
            print("[SUCCESS] Ingestion Pipeline Finished Successfully!")
            return True
            
        except Exception as e:
            print(f"[ERROR] Pipeline Execution Failed: {str(e)}")
            raise e
