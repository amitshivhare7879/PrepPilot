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
    prompt = f"""
    You are an expert technical interviewer for a {role} position.
    Ask ONE unique {difficulty} level interview question.
    
    GUIDELINES:
    - If difficulty is "Entry Level", focus more on core definitions, fundamental concepts, and common use cases.
    - If difficulty is "Mid Level" or "Senior", focus on practical scenarios, edge cases, and high-level architectural trade-offs.
    - Keep it conversational and professional (not like a rigid exam).
    - Ensure it can be answered clearly in 1-2 minutes via voice or text.
    - Avoid these questions which were already asked: {', '.join(history)}
    
    Return JSON only: {{"question": "The question text"}}
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
    except Exception:
        # Emergency Fallback
        return {"question": f"Based on your interest in {role}, describe a complex technical challenge you solved recently."}

async def get_ai_evaluation(question: str, answer: str, role: str, difficulty: str):
    prompt = f"""
    Evaluate this {role} interview response.
    Question: {question}
    Answer: {answer}
    Level: {difficulty}
    
    SCORING RUBRIC (0-100):
    - technical: Core domain knowledge, precision, and accuracy. Award high marks for specific examples/details. (0 if nonsense/empty, 100 if expert).
    - relevance: How directly they answered every part of the question.
    - communication: Professional tone, clarity, and concise delivery.
    - star_method: Logical structure (Situation, Task, Action, Result).
    
    Return JSON only with these EXACT keys:
    {{
      "relevance": int, 
      "technical": int, 
      "communication": int, 
      "star_method": int,
      "feedback": "Conversational yet rigorous technical feedback (one concise paragraph). Be fair—don't give 0 if they mentioned correct concepts.", 
      "suggestions": ["3 actionable technical improvement points"], 
      "ideal_answer": "A technical, role-specific benchmark answer",
      "learning_topics": ["2-3 focused topics for deep-dive study"]
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