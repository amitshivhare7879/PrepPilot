from pydantic import BaseModel
from typing import List

class DSMetrics(BaseModel):
    total_fillers: int
    wpm: int
    pace_status: str

class EvaluationResponse(BaseModel):
    relevance: int
    technical: int
    communication: int
    star_method: int
    feedback: str
    suggestions: List[str]
    # Add the DS Differentiator here!
    speech_metrics: Optional[DSMetrics] = None