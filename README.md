# ✈️ PrepPilot AI | Pro Interview Suite

An AI-powered mock interview platform designed specifically for Data Scientists, ML Engineers, and Data Analysts. PrepPilot uses Groq's Llama-3 architecture to provide real-time performance metrics, storytelling analysis, and career progress tracking.

## 🚀 Quick Start (Local Setup)

### 1. Backend Setup (FastAPI)
Navigate to the `backend` directory and install the dependencies:
```bash
cd backend
pip install -r requirements.txt
```

Set up your `.env` file in the `backend` folder:
```env
DATABASE_URL=postgresql://your_supabase_url
GROQ_API_KEY=your_groq_api_key
```

Run the server:
```bash
python -m uvicorn app.main:app --reload --port 8001
```

### 2. Frontend Setup
Simply open `frontend/index.html` in your browser. (The app communicates with the backend on port 8001).

## 🌟 Key Features
- **Dynamic AI Interviewer**: Generates unique questions every session based on role & level.
- **Storytelling Analysis**: Evaluates your answer structure (formerly STAR method) in plain English.
- **Career Dashboard**: Tracks historical scores and assigns a "Pilot Ranking" (Expert, Steady, New).
- **Session Transcripts**: Download a full PDF/Text report of your interview, including ideal AI benchmark answers.
- **Voice-Enabled**: Real-time speech-to-text transcript generation.

## 🛠️ Tech Stack
- **Frontend**: Glassmorphism UI (Vanilla HTML/JS/CSS + Tailwind + Chart.js)
- **Backend**: FastAPI (Python) + SQLAlchemy ORM
- **AI Core**: Groq Cloud (Llama-3.3-70b-versatile)
- **Database**: Supabase (PostgreSQL)

---
*Calibrate your career with PrepPilot.*
