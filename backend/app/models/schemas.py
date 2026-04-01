from pydantic import BaseModel, Field
from typing import List, Optional

# --- DS METRICS ---
class DSMetrics(BaseModel):
    total_fillers: int
    wpm: int
    pace_status: str

# --- INPUT SCHEMA ---
class InterviewRequest(BaseModel):
    user_id: Optional[int] = None
    role: str
    difficulty: str
    question: str
    user_answer: str

# --- OUTPUT SCHEMA ---
class EvaluationResponse(BaseModel):
    relevance: int
    technical: int
    communication: int
    star_method: int
    feedback: str
    suggestions: List[str]
    ideal_answer: str
    # This matches the name used in main.py
    speech_metrics: Optional[DSMetrics] = None

# --- AUTH SCHEMAS ---
class UserBase(BaseModel):
    email: str

class UserCreate(UserBase):
    password: str

class UserLogin(UserBase):
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class SessionCreate(BaseModel):
    user_id: int
    role: str
    difficulty: str
    evaluation_metadata: dict