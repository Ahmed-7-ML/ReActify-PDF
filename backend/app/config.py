from pydantic_settings import BaseSettings, SettingsConfigDict

# import os
# from dotenv import load_dotenv
# We don't need this -> load_dotenv()
# As BaseSettings Automatically read the .env file

# LangSmith -> https://smith.langchain.com/o/fd8dcbd1-3e3a-43e6-a6dd-1257bd823afc/projects/p/204de8e3-1af4-40a8-94f7-8a129ecdda47?onboarding=Chat+with+PDF&timeModel=%7B%22duration%22%3A%221d%22%7D
# Qdrant    -> https://qdrant.tech/
# Google AI Studio -> https://aistudio.google.com/app/api-keys?project=gen-lang-client-0371068851


class Settings(BaseSettings):
    # Pydantic will automatically look for these variables in uppercase
    GEMINI_API_KEY: str
    QDRANT_URL: str
    QDRANT_COLLECTION_NAME: str
    LANGSMITH_API_KEY: str
    LANGSMITH_PROJECT: str
    LANGSMITH_TRACING: bool
    
    # Tell Pydantic to look for a .env file located in the backend root directory
    model_config = SettingsConfigDict(
        env_file = '.env',
        env_file_encoding = 'utf-8',
        extra='ignore'   # If any more environment variables
    )


# Instantiate a singleton configuration object to share across the package
settings = Settings()
