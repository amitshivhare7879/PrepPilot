from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.models.schemas import InterviewRequest

app = FastAPI()

# CRITICAL: Allow the frontend to talk to the backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/evaluate")
async def evaluate(data: InterviewRequest):
    # This is "Mock Data" so the team can keep moving
    return {
        "relevance": 8,
        "technical": 7,
        "communication": 9,
        "star_method": 6,
        "feedback": "This is a placeholder response. Your API connection is working!",
        "suggestions": ["Add more technical detail", "Maintain eye contact"]
    }