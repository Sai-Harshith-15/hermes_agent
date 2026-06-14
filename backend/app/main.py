import asyncio
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, select

from app.db.database import init_db, get_session
from app.api.telemetry_router import router as telemetry_router
from app.websocket_manager import manager
from app.models import HostMetrics, ApiKeyPool, AgentRuns, Tasks, AgentLogs

app = FastAPI(title="Hermes Agent Pulse Monitor API", version="1.0.0")

# CORS configurations
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Router
app.include_router(telemetry_router, prefix="/api/v1")

# WebSocket Endpoint
@app.websocket("/ws/telemetry")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        # Keep connection open
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

@app.on_event("startup")
def on_startup():
    init_db()
    seed_mock_data()

def seed_mock_data():
    session = next(get_session())
    
    # Check if we already have keys seeded
    if session.exec(select(ApiKeyPool)).first():
        return
        
    # 1. Seed Host Metrics
    host_stat = HostMetrics(
        cpu_usage=18.0,
        ram_used=14.2,
        ram_total=24.0,
        storage_used=45.0,
        storage_total=200.0,
        daemon_status="Active (stress-ng nice -n 19)"
    )
    session.add(host_stat)
    
    # 2. Seed API Keys
    key1 = ApiKeyPool(provider="OpenCode Zen", model_name="opencode/big-pickle", api_key_masked="sk-zen-...f8a2", rpm_limit=60, current_usage_pct=45.0, status="Active")
    key2 = ApiKeyPool(provider="DeepSeek", model_name="deepseek-chat", api_key_masked="sk-dps-...91x", rpm_limit=100, current_usage_pct=80.0, status="Rate-Limited")
    key3 = ApiKeyPool(provider="OpenRouter", model_name="google/gemini-pro", api_key_masked="sk-opr-...zz1", rpm_limit=20, current_usage_pct=5.0, status="Fallback Ready")
    session.add(key1)
    session.add(key2)
    session.add(key3)
    session.commit() # Commit to generate key IDs
    
    # 3. Seed Agent Runs (sessions)
    run1 = AgentRuns(id="sess_9a8b7", profile_name="swe_lead", role="Local SWE Supervisor", model_route="Ollama: gemma-4-12b", status="Active")
    run2 = AgentRuns(id="sess_3f2e1", profile_name="yt_writer", role="Content Writer", model_route="LiteLLM: deepseek-chat", status="Idle")
    session.add(run1)
    session.add(run2)
    
    # 4. Seed Tasks
    t1 = Tasks(id="T-1", run_id="sess_3f2e1", title="Scrape trending YouTube niches", agent_name="yt_writer", status="Backlog")
    t2 = Tasks(id="T-2", run_id="sess_9a8b7", title="Implement JWT Auth in FastAPI", agent_name="backend_expert", status="Coding")
    t3 = Tasks(id="T-3", run_id="sess_9a8b7", title="Run Floci AWS DynamoDB emulation", agent_name="qa_lead", status="Testing")
    t4 = Tasks(id="T-4", run_id="sess_9a8b7", title="Review SSE Streaming logic", agent_name="swe_lead", status="Review")
    t5 = Tasks(id="T-5", run_id=None, title="Deploy React App to Cloudflare Tunnel", agent_name=None, status="Production")
    t6 = Tasks(id="T-6", run_id="sess_9a8b7", title="Fix Infinite Loop in Edge-TTS integration", agent_name="backend_expert", status="Error")
    
    session.add(t1)
    session.add(t2)
    session.add(t3)
    session.add(t4)
    session.add(t5)
    session.add(t6)
    
    # 5. Seed Logs
    logs = [
        AgentLogs(run_id="sess_9a8b7", task_id="T-2", source="[backend_expert]", message="Generating FastAPI route for /users...", log_level="INFO"),
        AgentLogs(run_id="sess_9a8b7", task_id="T-2", source="[backend_expert]", message="Writing to file: routes/users.py", log_level="INFO"),
        AgentLogs(run_id="sess_9a8b7", task_id="T-3", source="[system]", message="executing tool: execute_code", log_level="INFO"),
        AgentLogs(run_id="sess_9a8b7", task_id="T-3", source="[stdout]", message="Running pytest tests/test_users.py...", log_level="INFO"),
        AgentLogs(run_id="sess_9a8b7", task_id="T-3", source="[stdout]", message="collected 1 item", log_level="INFO"),
        AgentLogs(run_id="sess_9a8b7", task_id="T-3", source="[stdout]", message="tests/test_users.py F [100%]", log_level="WARNING"),
        AgentLogs(run_id="sess_9a8b7", task_id="T-3", source="[stdout]", message="AssertionError: Expected 200, got 401", log_level="ERROR"),
        AgentLogs(run_id="sess_9a8b7", task_id="T-6", source="[backend_expert]", message="Detected 401 error. Analyzing Auth middleware injection...", log_level="INFO"),
        AgentLogs(run_id="sess_9a8b7", task_id="T-6", source="[system]", message="Sending context to LiteLLM (opencode/big-pickle)...", log_level="INFO")
    ]
    for log in logs:
        session.add(log)
        
    session.commit()
