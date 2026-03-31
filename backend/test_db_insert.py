import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)

def test_insert():
    with engine.connect() as conn:
        print("Testing a dry-run insert to verify user_id column accessibility...")
        try:
            # We don't need to actually insert, just a SELECT targeting that column is enough
            res = conn.execute(text("SELECT user_id FROM interview_sessions LIMIT 1;"))
            print("Successfully selected user_id column!")
            
            # Now let's try a real insert (but rollback)
            trans = conn.begin()
            conn.execute(text("INSERT INTO interview_sessions (user_id, role, difficulty, evaluation_metadata) VALUES (NULL, 'Test', 'Test', '{}');"))
            print("Successfully inserted into user_id column!")
            trans.rollback()
            print("Rollback successful.")
        except Exception as e:
            print(f"FAILED: {e}")

if __name__ == "__main__":
    test_insert()
