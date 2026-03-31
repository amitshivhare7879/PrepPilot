import os
import json
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

# Initialize Groq Client
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

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
    "suggestions": ["list"]
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