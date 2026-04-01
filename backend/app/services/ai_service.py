import os
import json
from typing import List
from groq import Groq
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

# Initialize Clients
groq_client = Groq(
    api_key=os.getenv("GROQ_API_KEY"),
    timeout=20.0  # Increased timeout for stability
)

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
gemini_model = genai.GenerativeModel('gemini-1.5-flash')

GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.1-8b-instant")
AI_PROVIDER = os.getenv("AI_PROVIDER", "groq")

async def generate_ai_question(role: str, difficulty: str, history: List[str] = []):
    prompt = f"As an interviewer, ask ONE unique {difficulty} technical question for a {role}. Avoid these already asked: {', '.join(history)}. Return JSON: {{\"question\": \"...\"}}"
    
    try:
        if AI_PROVIDER == "groq":
            completion = groq_client.chat.completions.create(
                model=GROQ_MODEL,
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"}
            )
            return json.loads(completion.choices[0].message.content)
        else:
            response = gemini_model.generate_content(prompt, generation_config={"response_mime_type": "application/json"})
            return json.loads(response.text)
    except Exception:
        # Emergency Fallback
        return {"question": f"Based on your interest in {role}, describe a complex technical challenge you solved recently."}

async def get_ai_evaluation(question: str, answer: str, role: str, difficulty: str):
    prompt = f"""
    Evaluate this interview response.
    Question: {question}
    Answer: {answer}
    Role: {role} ({difficulty})
    
    Return JSON ONLY with these EXACT keys:
    {{
      "relevance": 0-100, 
      "technical": 0-100, 
      "communication": 0-100, 
      "star_method": 0-100,
      "feedback": "string", 
      "suggestions": ["list"], 
      "ideal_answer": "string",
      "learning_topics": ["list"]
    }}
    """
    try:
        if AI_PROVIDER == "groq":
            completion = groq_client.chat.completions.create(
                model=GROQ_MODEL,
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"}
            )
            return json.loads(completion.choices[0].message.content)
        else:
            response = gemini_model.generate_content(prompt, generation_config={"response_mime_type": "application/json"})
            return json.loads(response.text)
    except Exception as e:
        print(f"AI ERROR: {str(e)}")
        # VALID SAFETY RESPONSE: Must match EvaluationResponse schema exactly
        return {
            "relevance": 50,
            "technical": 50,
            "communication": 50,
            "star_method": 50,
            "feedback": "The AI is currently experiencing high latency, but your response has been saved. Try focusing on the STAR method for your next answer.",
            "suggestions": ["Try again in a moment", "Check your API quota"],
            "ideal_answer": "Refer to official documentation for the best benchmark on this specific topic.",
            "learning_topics": ["General Interview Prep", "Role-specific Fundamentals"]
        }