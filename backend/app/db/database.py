import os
from sqlmodel import SQLModel, create_engine, Session

# Environment variable check for PostgreSQL URL, fallback to SQLite
DATABASE_URL = os.environ.get(
    "DATABASE_URL", 
    "sqlite:///./hermes_monitor.db"
)

# SQLite specific config
connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(DATABASE_URL, connect_args=connect_args)

def init_db():
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session
