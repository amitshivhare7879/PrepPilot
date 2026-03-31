from pydantic import BaseModel
from typing import List

class EvaluationResponse(BaseModel):
    relevance: int
    technical: int
    communication: int
    star_method: int
    feedback: str
    suggestions: List[str]

class InterviewRequest(BaseModel):
    role: str
    difficulty: str
    question: str
    user_answer: str