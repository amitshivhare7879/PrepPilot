import os
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    # App General
    APP_NAME: str = "PrepPilot AI"
    DEBUG: bool = os.getenv("DEBUG", "False").lower() == "true"
    
    # Secrets & API Keys
    DATABASE_URL: str = os.getenv("DATABASE_URL")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY")
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY")
    
    # Security Configurations
    PASSWORD_SALT: str = os.getenv("PASSWORD_SALT", "preppilot_security_salt")

settings = Settings()
