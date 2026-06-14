# Project Version 1: Autonomous Digital Factory

## The Vision
A Zero-Cost, 24/7 Autonomous Digital Factory running on Oracle Cloud Free Tier. It utilizes local LLMs (Ollama) as managers and remote APIs (OpenRouter) for heavy lifting, orchestrated by bash scripts and monitored via a sleek React dashboard.

## The Metaphor
- **The Free Office Building:** Oracle Cloud Server.
- **The Master Clock:** `company_loop.sh` script.
- **The Managers:** Local Ollama Models (Work for free, review tasks).
- **The Freelance Workers:** Hermes Sub-Agents (Code, Video, Social Media).
- **The Key Master:** LiteLLM Proxy (Manages API keys and tracks costs).
- **Security Cameras:** The React/FastAPI Dashboard.

## Current State
- ✅ **Frontend:** React + Vite + Tailwind v4 real-time dashboard.
- ✅ **Backend:** FastAPI with WebSocket broadcasting.
- ✅ **Database:** SQLModel setup for PostgreSQL/SQLite.
- ✅ **Telemetry:** Real-time logging and metrics simulator functioning.

## The "6 Critical Gaps" (Pending Implementation)
To achieve true autonomy and stability, the following must be integrated:
1. **Global Cooldown:** Webhook-based pausing if LiteLLM hits rate limits.
2. **Oracle CPU Management:** Transition from `stress-ng` dummy load to real background work (e.g., summarizing) to maintain >10% CPU usage.
3. **Data Pump:** Background script to sync local SQLite databases from Hermes agents to the central PostgreSQL dashboard DB.
4. **Shared Workspace Locks:** Implement file-locking mechanisms to prevent agents from overwriting each other's files.
5. **Storage Janitor:** A cron job for weekly Docker pruning and log/media cleanup to prevent disk exhaustion.
6. **Dashboard Security:** Implementation of Cloudflare Tunnels for secure, public access without exposing ports directly.
