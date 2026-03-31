from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
from .db import models, database
from .models import schemas
from .services.ai_service import get_ai_evaluation
from .services.nlp_utils import analyze_speech_metrics

# Create Supabase Tables
models.Base.metadata.create_all(bind=database.engine)

# backend/app/main.py
from app.services.nlp_utils import analyze_speech_metrics

@app.post("/api/evaluate", response_model=EvaluationResponse)
async def evaluate_interview_step(data: InterviewRequest, db: Session = Depends(database.get_db)):
    # 1. DS Logic (NLP Utils)
    # Note: Duration can be sent from frontend or defaulted to 60s
    speech_data = analyze_speech_metrics(data.user_answer)
    
    # 2. AI Logic (ML Layer)
    evaluation = await get_ai_evaluation(data.question, data.user_answer, data.role, data.difficulty)
    
    # 3. Attach DS Metrics to the final response
    evaluation.speech_metrics = speech_data
    
    # 4. Save to Metadata Table (Supabase)
    new_session = models.InterviewSession(
        role=data.role,
        difficulty=data.difficulty,
        evaluation_metadata=evaluation.dict()
    )
    db.add(new_session)
    db.commit()
    
    return evaluation

