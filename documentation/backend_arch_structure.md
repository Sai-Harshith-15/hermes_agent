# Backend Architecture Structure

## Overview
The backend acts as the Mission Control Gateway for the Hermes Agent. Built with **FastAPI** and **Python**, it reads actual configuration and state from the local disk (`~/.hermes/`), and bridges the React frontend to the underlying agent systems in real-time. It handles data persistence exclusively using **SQLite** (`hermes_state.db`, `kanban.db`), matching the core agent's actual data model.

## Tech Stack
- **Framework:** FastAPI
- **Language:** Python 3.11+
- **Database:** SQLite (Local Hermes instances)
- **Server:** Uvicorn

## Core Components
1. **Telemetry & API Router**
   - **WebSocket Endpoints:** 
     - `/ws/telemetry` for frontend clients to receive live telemetry updates.
   - **API Routes:** `/api/v1/sandbox`, `/api/v1/warden`, `/api/v1/mcp`, `/api/v1/vault`, `/api/v1/skills`, `/api/v1/messaging`, exposing internal Hermes adapters to the frontend.

## Implemented Features
- **Embedded PTY Terminal:** A WebSocket endpoint (`/api/pty`) implemented using Python's `pty` and `subprocess` modules that spawns `hermes --tui` behind a POSIX pseudo-terminal for `@xterm/xterm` integration in the frontend.

## Universal Single-Port Deployment
- The FastAPI application utilizes `StaticFiles` to serve the built React frontend (`/dist`) directly from the root `/` path. This entirely bypasses tunnel mapping and CORS issues when deployed behind Cloudflare Tunnels or other proxies.
2. **Adapters (`backend/app/services/hermes/`)**
   - `HermesStateAdapter`: Reads the `hermes_state.db` SQLite file for token counts, session history, and cost metrics.
   - `KanbanAdapter`: Reads the `kanban.db` SQLite file for workflows and agent execution queues.
   - `HermesConfigAdapter`: Safely reads/writes `~/.hermes/config.yaml` using `ruamel.yaml` to preserve validation and comments, and securely handles `.env` configurations.
   - `HermesSkillsAdapter`: Reads/manages installed skills in `~/.hermes/skills/`.
3. **Shell Ops & Proxying**
   - **`proxy.py`**: Utilizes `httpx.AsyncClient` as a wildcard reverse proxy forwarding to local Streamlit ports seamlessly (e.g. `8501`), avoiding Cloudflare port mappings.
   - **`ops.py`**: Employs Python's `subprocess` to trigger critical system commands like `hermes doctor` and `hermes audit` securely.
3. **Database Access**
   - Direct access to local SQLite databases rather than relying on a centralized PostgreSQL server, adhering to the single-host simplicity.

## Real Agent Integration
- **Direct Sub-Agent Invocation**: The backend interacts with Hermes components directly or via standard task delegation (`delegate_task` and kanban queues), rather than a fictional `company_loop.sh`.
- **System Metrics**: Read directly using system libraries (`psutil`, `/proc`) to monitor host limits (e.g., Oracle Free Tier CPU/RAM limits) without needing simulated proxies.
- **Token Tracking**: Token usage and costs are pulled directly from the `model_usage` table in `hermes_state.db` rather than using an external LiteLLM proxy.

## Docker Compatibility & Execution Safety
- **Gateway Restarting:** Securely reboots listeners within a containerized Docker architecture by executing `pkill -f hermes-gateway` instead of relying on `systemctl` (which is unavailable in standard Docker containers).
- **YAML Null-Safety:** The backend `ruamel.yaml` Vault config parser implements aggressive `.setdefault()` checks, ensuring no `KeyError` crashes occur when adding the very first provider or API key dynamically.
- **Dynamic Path Expansion:** Native file operations (`config.yaml`, `skills/`, `.env`) properly expand `~` using `os.path.expanduser()` to prevent `FileNotFoundError` across both Docker volumes and native Linux/Windows filesystems.
