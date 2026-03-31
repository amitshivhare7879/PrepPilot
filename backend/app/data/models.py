from sqlalchemy import Column, Integer, String, JSON, DateTime
from sqlalchemy.sql import func
from .database import Base  # This pulls 'Base' from database.py in the same folder

class InterviewSession(Base):
    """
    This table stores the 'Metadata' for every interview attempt.
    It links the User's Role/Difficulty to the AI's Evaluation JSON.
    """
    __tablename__ = "interview_sessions"

    # 1. Primary Key
    id = Column(Integer, primary_key=True, index=True)

    # 2. Interview Context
    role = Column(String, index=True)      # e.g., 'Data Scientist'
    difficulty = Column(String)            # e.g., 'Hard'

    # 3. The "AI Goldmine" (JSON Data)
    # This stores scores, feedback, suggestions, and DS speech metrics
    evaluation_metadata = Column(JSON)

    # 4. Automation
    timestamp = Column(DateTime(timezone=True), server_default=func.now())