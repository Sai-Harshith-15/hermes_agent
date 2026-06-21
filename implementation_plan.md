# 🚀 Hermes Mission Control (HMC) - Master Implementation Plan

## 1. Executive Summary & Architecture Pivot
This document outlines the robust implementation plan for the Hermes Mission Control Dashboard. We are officially pivoting away from fictional configurations to strictly interface with the **actual Hermes Agent architecture**:

- **Storage Pivot:** Dropped PostgreSQL entirely. HMC will exclusively use the native **SQLite** databases (`hermes_state.db`, `kanban.db`).
- **Logic Pivot:** Dropped fictional scripts (`company_loop.sh`, `litellm_hook.py`). Telemetry and metrics will be pulled directly from the host OS (`psutil`/`/proc`) and `state.db`.
- **The Core Missing Link:** The dashboard will feature a real-time Embedded PTY Terminal (`xterm.js` + WebSockets) to provide native interaction with the Hermes TUI directly from the browser.
- **Universal Deployment:** Fully Dockerized to ensure it runs identically on an Oracle Ubuntu Server or a Windows laptop, with an automated Cloudflare Tunnel sidecar for secure, instant public access.

---

## 2. Universal Deployment & Tunnel Strategy (Run Anywhere)

To fulfill the requirement of running on **any OS** and providing an instant **Tunnel URL** out of the box, we will deploy HMC using a unified Docker Compose architecture. 

### 2.1 The "Single-Port" Serving Strategy
To fix the **Tunnel Mapping Issue** (where the frontend breaks over a tunnel because it tries to call `localhost`), **FastAPI will serve the built React frontend as static files**.
1. React (Vite) is built into static files (`/dist`).
2. FastAPI serves these files on `/` and handles APIs on `/api` and `/ws`.
3. The frontend dynamically resolves the tunnel URL using `window.location.host` instead of hardcoded local addresses.

### 2.2 Automated Setup (`docker-compose.yml`)
This setup mounts your real Hermes brain into the dashboard container and automatically spins up a Cloudflare Quick Tunnel. You can run this alongside your existing Hermes container.

```yaml
version: '3.8'

services:
  # 1. The Hermes Mission Control Dashboard (Backend + Frontend)
  hermes-mission-control:
    build: .
    container_name: hermes_mission_control
    restart: unless-stopped
    ports:
      - "8000:8000"
    volumes:
      # CRITICAL: Maps the host's actual Hermes data into the dashboard
      - ~/.hermes:/root/.hermes 
    environment:
      - HOST=0.0.0.0
      - PORT=8000

  # 2. Automated Cloudflare Tunnel
  cloudflare-tunnel:
    image: cloudflare/cloudflared:latest
    container_name: hermes_tunnel
    restart: unless-stopped
    # Automatically routes public traffic to the Mission Control container
    command: tunnel --url http://hermes-mission-control:8000
    depends_on:
      - hermes-mission-control
```

**How to Access:**
When you run `docker-compose up -d`, simply run `docker logs hermes_tunnel`. It will print a live `https://<random-words>.trycloudflare.com` URL. Click it, and you are instantly in your dashboard.

---

## 3. Phased Execution Roadmap

### Phase 1 — Core Architecture (Highest Priority)
- **Embedded PTY Terminal (The Biggest Gap)**
  - **Backend:** Create `/api/pty` WebSocket endpoint in FastAPI. Use Python's built-in `pty` and `subprocess` to spawn `hermes --tui`. Stream ANSI standard out/in. (Because Docker standardizes the environment to Linux, this completely bypasses Windows winpty crashes).
  - **Frontend:** Integrate `xterm.js` with WebGL addon. This allows full use of the Hermes TUI inside the browser.
- **Sessions Detail View**
  - **Backend:** Implement `HermesStateAdapter` to query `~/.hermes/state.db` (SQLite).
  - **Frontend:** Chat history view with color-coded user/agent roles, tool call expansion, and FTS5 search capabilities.
- **Real Config Read/Write**
  - **Backend:** Safely parse, edit, and serialize `~/.hermes/config.yaml` and `~/.hermes/.env` using `ruamel.yaml` to preserve comments.
  - **Frontend:** Implement a Monaco-powered Web Editor for safe YAML/ENV editing.
- **Hermes Dashboard Integration**
  - **Frontend UI:** Ensure the HMC UI includes a dedicated **"Hermes Dashboard"** section in the main navigation. This section will serve as the primary centralized hub to access the embedded terminal and agent telemetry.

### Phase 2 — Crucial Capabilities
- **MCP Server Management**
  - CRUD UI reading the `mcp_servers:` block in `config.yaml`. Test connections and enable/disable standard I/O and SSE servers.
- **Skills Management**
  - Read `~/.hermes/skills/`, list installed skills, and implement a hub search/install interface with live logs streaming via WebSockets.
- **Messaging Channels & Pairing UI**
  - Forms for Telegram, Discord, etc., writing directly to `.env`.
  - A pairing table to view pending external messaging users and approve/revoke their access.
- **Credential Pool UI**
  - Interface to manage dynamic, rotating API key pools per provider (OpenRouter, Anthropic, OpenAI) instead of fixed keys.

### Phase 3 — Polish & Analytics
- **Analytics Dashboard**
  - Recharts-powered graphs pulling token usage and cost breakdowns directly from the `model_usage` table in `state.db`.
- **System Operations**
  - UI buttons for System Doctor, Security Audit, and Checkpoint/Rollback management.
- **Theme System**
  - Dynamic frontend theming loading CSS variables from `~/.hermes/dashboard-themes/`.
- **Webhook Management**
  - Create and manage inbound/outbound event routes.

---

## 4. Technical Architecture by Domain

### A. Frontend Architecture
- **Stack:** React 18, Vite, TypeScript, Tailwind CSS v4, Recharts, xterm.js, Lucide React.
- **Tunnel Mapping Fix (Crucial for Cloudflare):**
```javascript
// Dynamic URL mapping ensures the app never breaks when accessed via a Tunnel
export const WS_BASE_URL = (window.location.protocol === 'https:' ? 'wss://' : 'ws://') + window.location.host + '/api/pty';
export const API_BASE_URL = window.location.origin + '/api/v1';
```

### B. Backend Architecture
- **Stack:** FastAPI (Python 3.11+), Uvicorn, SQLModel/SQLAlchemy.
- **FastAPI Static Mount (Crucial for Single-Port):**
```python
from fastapi.staticfiles import StaticFiles
# Serve React build on the root to share the origin with APIs
app.mount("/", StaticFiles(directory="frontend/dist", html=True), name="static")
```
- **Adapters (`/services/hermes/`):**
  - `HermesStateAdapter`: Connects directly to local SQLite databases.
  - `HermesConfigAdapter`: Reads/writes `.env` and `config.yaml`.
  - `HermesSkillsAdapter`: Reads/manages installed custom tools.

### C. SQLite Database Schema Mapping
- **`hermes_state.db`:**
  - `sessions`: Terminal and agent run histories.
  - `messages`: Full conversation text, roles, and tool calls.
  - `model_usage`: LLM invocations, token counts, and derived costs.
  - `agent_logs`: Internal system logs (FTS5 indexed).
- **`kanban.db`:**
  - `tasks`: Agent work items, statuses (todo, in-progress, done), and assignees.
  - `workflows`: Multi-step job trackers.

---

## 5. Security & Access Consideration

> [!WARNING]
> Because the Cloudflare Tunnel exposes the dashboard (and thereby your underlying Agent's terminal and config files) to the public internet, Phase 1 must include a lightweight Authentication layer.
>
> - **Backend:** Wrap FastAPI endpoints with a JWT or HTTP Basic Auth dependency.
> - **Frontend:** Present a simple Login screen upon loading the tunnel URL. Require an Admin password (set via Docker environment variables) before granting access to the PTY terminal or configuration menus.
