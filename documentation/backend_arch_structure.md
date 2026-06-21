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
   - **API Routes:** `/api/v1/sandbox`, `/api/v1/warden`, etc., exposing internal Hermes adapters to the frontend.

## Implemented Features
- **Embedded PTY Terminal:** A WebSocket endpoint (`/api/pty`) implemented using Python's `pty` and `subprocess` modules that spawns `hermes --tui` behind a POSIX pseudo-terminal for `@xterm/xterm` integration in the frontend.

## Universal Single-Port Deployment
- The FastAPI application utilizes `StaticFiles` to serve the built React frontend (`/dist`) directly from the root `/` path. This entirely bypasses tunnel mapping and CORS issues when deployed behind Cloudflare Tunnels or other proxies.
2. **Adapters (`backend/app/services/hermes/`)**
   - `HermesStateAdapter`: Reads the `hermes_state.db` SQLite file for token counts, session history, and cost metrics.
   - `HermesConfigAdapter`: Reads/writes `~/.hermes/config.yaml` and `~/.hermes/.env` using the real Hermes file format.
   - `HermesSkillsAdapter`: Reads/manages installed skills in `~/.hermes/skills/`.
3. **Database Access**
   - Direct access to local SQLite databases rather than relying on a centralized PostgreSQL server, adhering to the single-host simplicity.

## Real Agent Integration
- **Direct Sub-Agent Invocation**: The backend interacts with Hermes components directly or via standard task delegation (`delegate_task` and kanban queues), rather than a fictional `company_loop.sh`.
- **System Metrics**: Read directly using system libraries (`psutil`, `/proc`) to monitor host limits (e.g., Oracle Free Tier CPU/RAM limits) without needing simulated proxies.
- **Token Tracking**: Token usage and costs are pulled directly from `hermes_state.db` rather than using an external LiteLLM proxy.
