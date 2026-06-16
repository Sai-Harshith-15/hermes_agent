import requests
import time
import random
from datetime import datetime, timezone

BASE_URL = "http://localhost:8000/api/v1/telemetry"

def send_telemetry(log_level, message, source, error_type=None):
    payload = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "agent_id": "chaos_monkey",
        "log_level": log_level,
        "message": message,
        "source": source,
        "metadata": {"error_type": error_type} if error_type else {}
    }
    try:
        response = requests.post(BASE_URL, json=payload)
        print(f"[{response.status_code}] Sent: {message}")
    except Exception as e:
        print(f"Failed to send: {e}")

def simulate_429_storm():
    print("--- Simulating 429 Storm (Rate Limit) ---")
    for _ in range(5):
        send_telemetry("ERROR", "Rate limit exceeded for provider", "llm_client", "rate_limit")
        time.sleep(0.5)

def simulate_dead_key():
    print("\n--- Simulating Dead Key (401/403) ---")
    for _ in range(3):
        send_telemetry("ERROR", "Authentication failed: invalid API key", "llm_client", "auth_error")
        time.sleep(0.5)

def simulate_stuck_loop():
    print("\n--- Simulating Stuck Loop ---")
    for _ in range(10):
        send_telemetry("WARNING", "Repeating action: read_file('same_file.txt')", "tool_execution", "repeated_action")
        time.sleep(0.5)

if __name__ == "__main__":
    print("Welcome to Chaos Engineering Simulator for Hermes Mission Control")
    time.sleep(1)
    simulate_429_storm()
    time.sleep(2)
    simulate_dead_key()
    time.sleep(2)
    simulate_stuck_loop()
    print("\nChaos injection complete. Check Warden dashboard for anomalies and webhooks!")
