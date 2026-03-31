from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List

# UPDATED: Pointing to your 'data' folder instead of 'db'
from .data import models, database
from .models.schemas import InterviewRequest, EvaluationResponse
from .services.ai_service import get_ai_evaluation
from .services.nlp_utils import analyze_speech_metrics

# 1. Initialize the FastAPI app
app = FastAPI(title="PrepPilot AI Backend")

# 2. Configure CORS (Crucial for Frontend to connect)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. Create Supabase Tables on startup
# This handshake ensures your 'data' folder logic connects to the cloud
models.Base.metadata.create_all(bind=database.engine)

@app.get("/")
def health_check():
    return {"status": "online", "message": "PrepPilot Backend is Live"}

@app.post("/api/evaluate", response_model=EvaluationResponse)
async def evaluate_interview_step(data: InterviewRequest, db: Session = Depends(database.get_db)):
    """
    Main Logic: NLP Analysis -> Gemini AI Evaluation -> Supabase Storage
    """
    try:
        # Step A: DS Logic (NLP Utils) - Heuristic Analysis (Fillers/WPM)
        speech_data = analyze_speech_metrics(data.user_answer)
        
        # Step B: ML Layer (Gemini Service) - Cognitive Analysis
        evaluation = await get_ai_evaluation(
            question=data.question, 
            answer=data.user_answer, 
            role=data.role, 
            difficulty=data.difficulty
        )
        
        # Step C: Attach the DS Metrics to the final Response
        evaluation.speech_metrics = speech_data
        
        # Step D: Metadata Layer (Supabase Persistence)
        new_session = models.InterviewSession(
            role=data.role,
            difficulty=data.difficulty,
            # Use .dict() or .model_dump() based on Pydantic version
            evaluation_metadata=evaluation.dict() 
        )
        db.add(new_session)
        db.commit()
        db.refresh(new_session)
        
        return evaluation

    except Exception as e:
        db.rollback()
        print(f"Error: {str(e)}")
        raise HTTPException(status_code=500, detail="Error processing interview data")

@app.get("/api/history")
def get_history(db: Session = Depends(database.get_db)):
    """ Fetches all past sessions for the Dashboard """
    return db.query(models.InterviewSession).all()

