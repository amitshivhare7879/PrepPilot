import os
from sqlalchemy import create_engine, text, inspect
from dotenv import load_dotenv

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")
print(f"Connecting to: {DATABASE_URL.split('@')[-1]}") # Log host only for safety
engine = create_engine(DATABASE_URL)

def debug_db():
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    print(f"Tables found: {tables}")
    
    if "interview_sessions" in tables:
        columns = [c['name'] for c in inspector.get_columns("interview_sessions")]
        print(f"Columns in interview_sessions: {columns}")
        
        if "user_id" not in columns:
            print("user_id MISSING! Attempting fix...")
            with engine.connect() as conn:
                conn.execute(text("ALTER TABLE interview_sessions ADD COLUMN user_id INTEGER;"))
                conn.execute(text("ALTER TABLE interview_sessions ADD CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users (id);"))
                conn.commit()
                print("Fix applied and committed.")
        else:
            print("user_id already exists.")
    else:
        print("interview_sessions table NOT FOUND.")

if __name__ == "__main__":
    debug_db()
