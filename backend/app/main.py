import os
import sys
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List

# 1. THE PATH FIX: Forces Python to see the 'app' folder for imports
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.append(current_dir)

# 2. THE IMPORTS: Points to your 'data', 'models', and 'services' folders
try:
    from data import models, database
    from models.schemas import InterviewRequest, EvaluationResponse
    from services.ai_service import get_ai_evaluation
    from services.nlp_utils import analyze_speech_metrics
except ImportError:
    from .data import models, database
    from .models.schemas import InterviewRequest, EvaluationResponse
    from .services.ai_service import get_ai_evaluation
    from .services.nlp_utils import analyze_speech_metrics

# 3. Initialize the FastAPI app
app = FastAPI(title="PrepPilot AI Backend - Groq Edition")

# 4. Configure CORS: Allows your Frontend to talk to this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 5. Create Supabase Tables on startup
# This builds the 'interview_sessions' table in your Supabase project
database.Base.metadata.create_all(bind=database.engine)

@app.get("/")
def health_check():
    """Confirms the server is alive"""
    return {
        "status": "online", 
        "message": "PrepPilot Backend is 100% Live!",
        "documentation": "/docs"
    }

@app.post("/api/evaluate", response_model=EvaluationResponse)
async def evaluate_interview_step(data: InterviewRequest, db: Session = Depends(database.get_db)):
    """
    Main Logic: 
    1. Heuristic NLP (Filler words/WPM)
    2. Groq Llama-3 Analysis (Technical accuracy/Feedback)
    3. Supabase Metadata storage
    """
    try:
        # Step A: NLP Utils (DS Differentiator)
        speech_data = analyze_speech_metrics(data.user_answer)
        
        # Step B: AI Service (Groq ML Layer)
        # Now returns a dictionary compatible with EvaluationResponse
        evaluation_data = await get_ai_evaluation(
            question=data.question, 
            answer=data.user_answer, 
            role=data.role, 
            difficulty=data.difficulty
        )
        
        # Build the final Response and attach the speech metrics
        evaluation = EvaluationResponse(**evaluation_data)
        evaluation.speech_metrics = speech_data
        
        # Step C: Metadata Layer (Supabase)
        # Store as JSON for maximum flexibility
        new_session = models.InterviewSession(
            role=data.role,
            difficulty=data.difficulty,
            evaluation_metadata=evaluation.dict() 
        )
        db.add(new_session)
        db.commit()
        db.refresh(new_session)
        
        return evaluation

    except Exception as e:
        db.rollback()
        print(f"Backend Crash Log: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/history")
def get_interview_history(db: Session = Depends(database.get_db)):
    """Retrieves past evaluations for the User Dashboard"""
    return db.query(models.InterviewSession).order_by(models.InterviewSession.timestamp.desc()).all()