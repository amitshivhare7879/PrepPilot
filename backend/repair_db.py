import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)

def repair_db():
    with engine.connect() as conn:
        print("Checking for user_id column...")
        try:
            conn.execute(text("ALTER TABLE interview_sessions ADD COLUMN user_id INTEGER;"))
            conn.commit()
            print("Column added.")
        except Exception as e:
            print(f"Adding column failed (may already exist?): {e}")
        
        print("Adding foreign key...")
        try:
            conn.execute(text("ALTER TABLE interview_sessions ADD CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users (id);"))
            conn.commit()
            print("Constraint added.")
        except Exception as e:
            print(f"Adding constraint failed: {e}")

if __name__ == "__main__":
    repair_db()
