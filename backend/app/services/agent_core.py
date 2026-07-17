from app.config import settings
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import SupabaseVectorStore
from supabase.client import create_client
from groq import Groq

class SimpleLLMExecutor:
    '''
    Simple LLM Executor that interfaces with the Groq API and performs RAG retrieval.
    '''
    def __init__(self, groq_client: Groq, retriever):
        self.groq_client = groq_client
        self.retriever = retriever
        self.chat_history = []
        
    def invoke(self, inputs: dict) -> dict:
        user_message = inputs.get('input', '')
        
        # 1. Retrieve context
        docs = self.retriever.invoke(user_message)
        context = "\n\n".join([f"[Source: Page {d.metadata.get('page', 'Unknown')}]: {d.page_content}" for d in docs])
        
        # 2. Construct messages
        system_instruction = (
            "You are a helpful assistant. Use the following context extracted from the PDF to answer the user's question.\n"
            "If the answer cannot be found in the context, do not make it up; state that the answer is not in the document.\n\n"
            f"Context:\n{context}"
        )
        
        messages = [{"role": "system", "content": system_instruction}]
        
        # Include conversation history (memory)
        for msg in self.chat_history[-10:]:
            messages.append(msg)
            
        messages.append({"role": "user", "content": user_message})
        
        # 3. Call Groq
        completion = self.groq_client.chat.completions.create(
            model="qwen/qwen3-32b",
            messages=messages,
            temperature=0.6,
            max_completion_tokens=4096,
            top_p=0.95,
            reasoning_effort="default",
            stream=True,
            stop=None
        )
        
        # 4. Stream to console
        full_content = ""
        for chunk in completion:
            content = chunk.choices[0].delta.content or ""
            print(content, end="")
            full_content += content
        print()
        
        # 5. Update history
        self.chat_history.append({"role": "user", "content": user_message})
        self.chat_history.append({"role": "assistant", "content": full_content})
        
        return {"output": full_content}


class AgentCore:
    '''
    Core AI Engine that wraps Qwen-3-32B via Groq with RAG context,
    custom vector store retrieval, and multi-turn conversation memory.
    '''
    def __init__(self, model: str = 'qwen/qwen3-32b', temperature: float = 0.6):
        self.model = model
        self.temperature = temperature
        
        self.embedding_model = HuggingFaceEmbeddings(
            model_name="sentence-transformers/all-MiniLM-L6-v2"
        )
        
        self.groq_client = Groq(api_key=settings.GROQ_API_KEY)
    
    def _get_vector_store(self):
        '''Connects to the existing Supabase vector store.'''
        client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
        self.supabase_client = client
        return SupabaseVectorStore(
            client=client,
            embedding=self.embedding_model,
            table_name="documents",
            query_name="match_documents"
        )
    
    def execute_agent(self):
        '''Builds the retriever and returns the simple LLM executor.'''
        vectorstore = self._get_vector_store()
        retriever = vectorstore.as_retriever(search_kwargs={
            'k': 4
        })
        
        return SimpleLLMExecutor(
            groq_client=self.groq_client,
            retriever=retriever
        )
