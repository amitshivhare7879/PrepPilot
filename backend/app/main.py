import os
import sys
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
from contextlib import asynccontextmanager

# 1. THE PATH FIX
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.append(current_dir)

try:
    from data import models as db_models, database
    from models.schemas import InterviewRequest, EvaluationResponse, UserCreate, UserLogin
    from services.ai_service import get_ai_evaluation, generate_ai_question
    from services.nlp_utils import analyze_speech_metrics
except ImportError:
    from .data import models as db_models, database
    from .models.schemas import InterviewRequest, EvaluationResponse, UserCreate, UserLogin
    from .services.ai_service import get_ai_evaluation, generate_ai_question
    from .services.nlp_utils import analyze_speech_metrics

# 2. STARTUP LOGIC: Heavy lifting happens only once here
@asynccontextmanager
async def lifespan(app: FastAPI):
    # This creates the tables only at server start
    db_models.Base.metadata.create_all(bind=database.engine)
    yield

app = FastAPI(title="PrepPilot AI - Elite Speed Edition", lifespan=lifespan)

# 3. CORS: Full local unblocking
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def health_check():
    return {"status": "online", "model": os.getenv("AI_PROVIDER", "groq")}

@app.post("/api/signup")
async def signup(user: UserCreate, db: Session = Depends(database.get_db)):
    try:
        existing_user = db.query(db_models.User).filter(db_models.User.email == user.email).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered")
        
        new_user = db_models.User(
            email=user.email,
            username=user.email.split('@')[0],
            hashed_password=user.password 
        )
        db.add(new_user)
        db.commit()
        return {"message": "User created successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/login")
async def login(user: UserLogin, db: Session = Depends(database.get_db)):
    db_user = db.query(db_models.User).filter(db_models.User.email == user.email).first()
    if not db_user or db_user.hashed_password != user.password:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return {"status": "success", "user_id": db_user.id}

@app.post("/api/evaluate", response_model=EvaluationResponse)
async def evaluate_interview_step(data: InterviewRequest, db: Session = Depends(database.get_db)):
    try:
        speech_data = analyze_speech_metrics(data.user_answer)
        evaluation_data = await get_ai_evaluation(data.question, data.user_answer, data.role, data.difficulty)
        
        evaluation = EvaluationResponse(**evaluation_data)
        evaluation.speech_metrics = speech_data
        
        return evaluation
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/history")
def get_interview_history(user_id: int, db: Session = Depends(database.get_db)):
    return db.query(db_models.InterviewSession).filter(db_models.InterviewSession.user_id == user_id).order_by(db_models.InterviewSession.timestamp.desc()).all()

@app.post("/api/generate-question")
async def get_next_question(role: str, difficulty: str, history: List[str] = []):
    return await generate_ai_question(role, difficulty, history)