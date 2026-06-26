# ___________________________________________________________________________________________________________________________________________________________________________________________
# ReAct Agent -> Reasoning + Acting
# Agent will have a tool called `Knowledge_Base_Tool` linked to Qdrant. 
# When a user asks a question:
#       1) Reasoning: The agent will analyze the question and think to itself, 
#           Ex: "The user is asking about something within the book; I need to use the Knowledge Base tool."
#
#       2) Acting: It will retrieve the tool, perform a Similarity Search in Qdrant, and find the relevant text snippets.

# **Reflection**: It will read the retrieved text and formulate a smart and accurate answer, citing sources. If needed, it will re-question itself.
# **Memory**    : The system will retain the last messages in the session so that if the user asks, "Explain the first point further," it can understand what the user is talking about.
#___________________________________________________________________________________________________________________________________________________________________________________________

# Configuration Setup
from app.config import settings

# Prompt for ReAct
from app.services.agent_prompt import react_template

# Core LLM and Embedding Model
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings

# Vector Store Wrapper
from langchain_community.vectorstores import SupabaseVectorStore
from supabase.client import create_client

# Tool Decorator
from langchain.tools import tool

# Create Agent and Execution Loop
from langchain_classic.agents import create_react_agent, AgentExecutor

# Session Memory
from langchain_classic.memory import ConversationBufferWindowMemory

# For ReAct Prompt Template
from langchain_core.prompts import PromptTemplate


class AgentCore:
    '''
    Core AI Agent Engine that wraps Gemini 2.5 Flash with ReAct framework,
    custom vector store retrieval tools, and multi-turn conversation memory.
    '''
    def __init__(self, model: str = 'gemini-2.5-flash', temperature: float = 0.2):
        '''Initialize Gemini 2.5 Flash as our core reasoning LLM'''
        self.llm = ChatGoogleGenerativeAI(
            model = model,
            google_api_key = settings.GEMINI_API_KEY,
            temperature = temperature
        )
        
        self.embedding_model = GoogleGenerativeAIEmbeddings(
            model="gemini-embedding-2-preview",
            google_api_key=settings.GEMINI_API_KEY
        )
        
        self.prompt = PromptTemplate.from_template(react_template)
        self.qdrant_client = None
    
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
        '''Builds the tools, binds them to the agent, and returns the runnable executor.'''
        vectorstore = self._get_vector_store()
        retriever = vectorstore.as_retriever(search_kwargs={
            'k': 4
        })
        
        @tool
        def query_knowledge_base(query: str) -> str:
            '''Useful when you need to answer questions about the uploaded PDF documents or research papers.'''
            docs = retriever.invoke(query)
            return "\n\n".join([f"[Source: Page {d.metadata.get('page', 'Unknown')}]: {d.page_content}" for d in docs])
        
        tools = [query_knowledge_base]
        
        # 🧠 Build explicit multi-turn memory setup matching standard hub placeholders
        memory = ConversationBufferWindowMemory(
            memory_key="chat_history",
            k=5, 
            return_messages=True
        )
        
        # Create the Agent with Custom Prompt
        agent = create_react_agent(
            llm = self.llm,
            tools = tools,
            prompt = self.prompt
        )
        
        executor = AgentExecutor(
            agent = agent,
            tools = tools,
            memory = memory,
            verbose = True, # Display Reasoning Steps of ReAct in Terminal
            handle_parsing_errors=True
        )
        return executor
