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
    from models.schemas import InterviewRequest, EvaluationResponse, UserCreate, UserLogin
    from services.ai_service import get_ai_evaluation, generate_ai_question
    from services.nlp_utils import analyze_speech_metrics
except ImportError:
    from .data import models, database
    from .models.schemas import InterviewRequest, EvaluationResponse, UserCreate, UserLogin
    from .services.ai_service import get_ai_evaluation, generate_ai_question
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

@app.post("/api/signup")
async def signup(user: UserCreate, db: Session = Depends(database.get_db)):
    # Check if user exists
    existing_user = db.query(models.User).filter(models.User.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # In a real app, hash password here: pwd_context.hash(user.password)
    new_user = models.User(
        email=user.email,
        username=user.email.split('@')[0],
        hashed_password=user.password # Mock hashing for demo
    )
    db.add(new_user)
    db.commit()
    return {"message": "User created successfully"}

@app.post("/api/login")
async def login(user: UserLogin, db: Session = Depends(database.get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if not db_user or db_user.hashed_password != user.password:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    return {"status": "success", "user_id": db_user.id}

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
            user_id=data.user_id,
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
def get_interview_history(user_id: int, db: Session = Depends(database.get_db)):
    """Retrieves past evaluations for the User Dashboard"""
    return db.query(models.InterviewSession).filter(models.InterviewSession.user_id == user_id).order_by(models.InterviewSession.timestamp.desc()).all()

@app.post("/api/generate-question")
async def get_next_question(role: str, difficulty: str, history: List[str] = []):
    """Bridge to AI Service to get a fresh question"""
    return await generate_ai_question(role, difficulty, history)