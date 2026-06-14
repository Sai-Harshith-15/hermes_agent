import time
import requests
import random
from datetime import datetime

API_URL = "http://localhost:8000/api/v1"
RUN_ID = "sess_simulated_9x"

print("Starting Hermes Telemetry Simulator...")

# 1. Register Run Session
requests.post(f"{API_URL}/telemetry/agent-run", json={
    "id": RUN_ID,
    "profile_name": "swe_lead",
    "role": "Local SWE Supervisor (Simulated)",
    "model_route": "Ollama: gemma-4-12b",
    "status": "Active"
})

# 2. Add API Keys to Pool
keys = [
    {"id": 1, "provider": "OpenCode Zen", "model_name": "opencode/big-pickle", "api_key_masked": "sk-zen-...f8a2", "rpm_limit": 60, "current_usage_pct": 20, "status": "Active"},
    {"id": 2, "provider": "DeepSeek", "model_name": "deepseek-chat", "api_key_masked": "sk-dps-...91x", "rpm_limit": 100, "current_usage_pct": 45, "status": "Active"},
    {"id": 3, "provider": "OpenRouter", "model_name": "google/gemini-pro", "api_key_masked": "sk-opr-...zz1", "rpm_limit": 20, "current_usage_pct": 5, "status": "Fallback Ready"}
]

for key in keys:
    requests.post(f"{API_URL}/telemetry/key", json=key)

# 3. Simulate continuous loops
log_messages = [
    ("[backend_expert]", "Parsing project requirements for React UI.", "INFO"),
    ("[backend_expert]", "Writing new component: frontend/src/components/MetricWidget.tsx", "INFO"),
    ("[system]", "Executing file write... success.", "INFO"),
    ("[qa_lead]", "Running unit tests for backend API routes...", "INFO"),
    ("[stdout]", "test_metrics_post: PASSED", "INFO"),
    ("[stdout]", "test_db_handshake: PASSED", "INFO"),
    ("[stdout]", "test_litellm_proxy_handshake: FAILED", "ERROR"),
    ("[system]", "LiteLLM connection timeout. Retrying request (attempt 1/10)...", "WARNING"),
    ("[system]", "LiteLLM connection timeout. Retrying request (attempt 2/10)...", "WARNING"),
    ("[system]", "DeepSeek key hit RPM limit. Status changed to Rate-Limited.", "WARNING"),
    ("[system]", "Swapping to fallback key Pool B: OpenRouter...", "INFO")
]

task_ids = ["T-101", "T-102", "T-103"]
task_titles = [
    "Assemble faceless video assets",
    "Refactor FastAPI WebSocket middleware",
    "Verify LiteLLM budget constraints"
]

for i, tid in enumerate(task_ids):
    requests.post(f"{API_URL}/telemetry/task", json={
        "id": tid,
        "run_id": RUN_ID,
        "title": task_titles[i],
        "agent_name": "backend_expert",
        "status": "Coding"
    })

step = 0
try:
    while True:
        # Update Host Metrics
        cpu = round(random.uniform(12.0, 22.0), 2)
        ram = round(random.uniform(14.0, 15.5), 2)
        requests.post(f"{API_URL}/metrics/host", json={
            "cpu_usage": cpu,
            "ram_used": ram,
            "ram_total": 24.0,
            "storage_used": 46.5,
            "storage_total": 200.0,
            "daemon_status": "Active (monitoring cpu > 10%)"
        })
        
        # Emit logs
        log_source, log_msg, log_level = log_messages[step % len(log_messages)]
        requests.post(f"{API_URL}/telemetry/log", json={
            "run_id": RUN_ID,
            "source": log_source,
            "message": log_msg,
            "log_level": log_level
        })
        
        # Simulate task updates
        if step % 5 == 0:
            tid = random.choice(task_ids)
            status = random.choice(["Coding", "Testing", "Review", "Production", "Error"])
            requests.post(f"{API_URL}/telemetry/task", json={
                "id": tid,
                "run_id": RUN_ID,
                "title": task_titles[task_ids.index(tid)],
                "agent_name": "backend_expert",
                "status": status
            })
            
        # Simulate rate-limiting and swapping status
        if step == 8:
            requests.post(f"{API_URL}/telemetry/key", json={
                "provider": "DeepSeek", "model_name": "deepseek-chat", "api_key_masked": "sk-dps-...91x", "rpm_limit": 100, "current_usage_pct": 100, "status": "Rate-Limited"
            })
        elif step == 11:
            requests.post(f"{API_URL}/telemetry/key", json={
                "provider": "DeepSeek", "model_name": "deepseek-chat", "api_key_masked": "sk-dps-...91x", "rpm_limit": 100, "current_usage_pct": 0, "status": "Active"
            })
            
        step += 1
        time.sleep(2)
except KeyboardInterrupt:
    print("Simulator stopped.")
