import sys
import os
from sqlalchemy import create_all

# Add current dir to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from data.database import engine, Base
from data.models import InterviewSession, User

def reset_db():
    print("Dropping tables...")
    # This will drop existing tables so they can be recreated with the new schema (user_id column)
    Base.metadata.drop_all(bind=engine)
    print("Creating tables...")
    Base.metadata.create_all(bind=engine)
    print("Database reset successfully with new schema!")

if __name__ == "__main__":
    reset_db()
