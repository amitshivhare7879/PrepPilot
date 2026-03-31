from pydantic import BaseModel, Field
from typing import List, Optional

# --- DS METRICS ---
class DSMetrics(BaseModel):
    total_fillers: int
    wpm: int
    pace_status: str

# --- INPUT SCHEMA ---
class InterviewRequest(BaseModel):
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
    # This matches the name used in main.py
    speech_metrics: Optional[DSMetrics] = None