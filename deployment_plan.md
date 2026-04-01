# PrepPilot Deployment Roadmap

Prepare the application for production! Follow these steps to take your platform live.

## 📦 1. Production Backend Prep (FastAPI)

Update your `requirements.txt` to include production-ready dependencies.

### Update `requirements.txt`
```text
fastapi
uvicorn
gunicorn
sqlalchemy
python-multipart
passlib[bcrypt]
python-jose[cryptography]
groq
google-generativeai
python-dotenv
psycopg2-binary
pydantic
pydantic-settings
requests
httpx
```

### Create `Procfile` (For Render/RailWay)
Create this file in the `backend/` directory:
```text
web: gunicorn -w 4 -k uvicorn.workers.UvicornWorker main:app
```

## 🌐 2. Frontend Prep (Vanilla JS)

Update the `API_URL` in `frontend/assets/js/api.js` once you have your backend's production URL.

```javascript
/* frontend/assets/js/api.js */
const API_URL = 'https://preppilot-backend.onrender.com/api'; // Replace with yours
```

## 🚀 3. Deployment Steps

### Step A: Push to GitHub
1. Create a **Private** or **Public** repository on GitHub.
2. Initialize and push your project:
   ```bash
   git init
   git add .
   git commit -m "Initialize PrepPilot Pro"
   git branch -M main
   git remote add origin YOUR_REPO_URL
   git push -u origin main
   ```

### Step B: Database (Supabase)
Your current `DATABASE_URL` is already from Supabase, so no changes are needed! Just ensure the environment variables are set.

### Step C: Hosting (e.g., Render)
1. **Connect your GitHub** account to Render.
2. **New > Web Service**: Point to the `backend` folder.
   - **Environment Variables**:
     - `DATABASE_URL`: Your Supabase URI.
     - `GROQ_API_KEY`: Your Groq API Key.
     - `GEMINI_API_KEY`: Your Gemini API Key. (if used)
     - `AI_PROVIDER`: "groq" or "gemini".
3. **New > Static Site**: Point to the `frontend` folder.

## 🔐 4. Final Security Checklist
> [!IMPORTANT]
> Ensure your `.env` file is in your `.gitignore` so your keys aren't exposed!
