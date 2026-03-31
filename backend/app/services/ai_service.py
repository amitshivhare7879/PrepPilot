import os
import json
from typing import List
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

# Initialize Groq Client
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

async def generate_ai_question(role: str, difficulty: str, history: List[str] = []):
    """Generates a unique, high-quality interview question based on role, level and history"""
    history_str = ", ".join(history)
    
    # Golden Rules for dynamic interviewers
    rules = """
    1. VOICE FRIENDLY: Questions must be answerable clearly through speech. Avoid asking the user to write code, provide long algorithms, or describe complex mathematical notations.
    2. LEVEL APPROPRIATE: 
       - Entry Level/Fresher: Stick to basic definitions, 'How it works' and core concepts. Do NOT ask complex scenario-based or 'Design-and-implement' questions for Freshers.
       - Mid/Senior Level: Ask about trade-offs, architecture, and real-world scenario handling (e.g., handling 5% minority class imbalance).
    3. FIT: Ensure the question is highly relevant to the candidate's target role.
    4. NO REPETITION: Do not ask anything similar to: """ + history_str

    prompt = f"""
    Generate ONE unique and challenging interview question for a {role} at the {difficulty} level.
    Follow these rules:
    {rules}
    
    Return ONLY a JSON object:
    "question": "The string of the question"
    """
    try:
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": "You are a lead technical interviewer for a top firm. Output raw JSON only."},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"}
        )
        return json.loads(completion.choices[0].message.content)
    except Exception as e:
        print(f"QUESTION GENERATION ERROR: {e}")
        return {"question": "Describe a challenging technical project you've worked on."}

async def get_ai_evaluation(question: str, answer: str, role: str, difficulty: str):
    prompt = f"""
    Evaluate this {role} interview response.
    Question: {question}
    Answer: {answer}
    Difficulty: {difficulty}

    Return ONLY a JSON object with these keys:
    "relevance": (0-100),
    "technical": (0-100),
    "communication": (0-100),
    "star_method": (0-100),
    "feedback": "string",
    "suggestions": ["list"],
    "ideal_answer": "Provide a 2-3 paragraph benchmark response for this question"
    """

    try:
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": "You are a technical recruiter. Output raw JSON only."},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"} # Groq forces JSON output!
        )
        
        return json.loads(completion.choices[0].message.content)

    except Exception as e:
        print(f"GROQ ERROR: {e}")
        # Fallback to satisfy Pydantic schemas
        return {
            "relevance": 0, "technical": 0, "communication": 0, "star_method": 0,
            "feedback": f"Groq Error: {str(e)}",
            "suggestions": ["Check Groq API Key", "Check Quota Limits"]
        }