from sqlalchemy import Column, Integer, String, JSON, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    
    sessions = relationship("InterviewSession", back_populates="owner")

class InterviewSession(Base):
    """
    This table stores the 'Metadata' for every interview attempt.
    It links the User's Role/Difficulty to the AI's Evaluation JSON.
    """
    __tablename__ = "interview_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    role = Column(String, index=True)      # e.g., 'Data Scientist'
    difficulty = Column(String)            # e.g., 'Hard'
    evaluation_metadata = Column(JSON)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

    owner = relationship("User", back_populates="sessions")