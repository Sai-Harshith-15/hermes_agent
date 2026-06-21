# 🚀 Hermes Mission Control - Comprehensive Architecture & Implementation Plan

## 1. Executive Summary
Phase 1 successfully laid the foundation: we established the **Single-Port Architecture**, the **Cloudflare Tunnel Auto-Mapping**, and the **Embedded PTY Terminal (`@xterm/xterm`)**. 

This document outlines the master architectural blueprint for Phase 2 and Phase 3. It details how to expose *every single capability* of the Hermes Agent (Profiles, Missions, Memory, Sessions, MCPs, and Analytics) into a user-friendly UI. Crucially, it also introduces a **Reverse Proxy Strategy** to seamlessly embed the **default native Hermes dashboard** directly into your Mission Control environment, ensuring everything is accessible through your single secure tunnel URL.

---

## 2. Unified Dashboard Architecture (The Proxy Strategy)
**The Requirement:** Access the native, default Hermes Agent dashboard locally, but route it securely through your custom Mission Control Cloudflare Tunnel.

Since your Mission Control runs on port `8000` (and is exposed via the Tunnel), but the native Hermes Dashboard runs on a different local port (e.g., `8501`, `3000`, or `9000`), a standard `<iframe>` pointing to `localhost` will fail for remote users. 

**The Solution: FastAPI Reverse Proxy Middleware**
We will build a transparent Reverse Proxy into the FastAPI backend.
1. **Backend Route (`/api/proxy/hermes-dashboard/{path:path}`)**: We will add a wildcard proxy endpoint using Python's `httpx` async library. Any request sent to this endpoint will be fetched by the backend from `localhost:<NATIVE_PORT>` and piped back to the frontend.
2. **Frontend UI (`NativeDashboardScreen.tsx`)**: We will create a new sidebar tab that renders a full-screen `<iframe src="/api/proxy/hermes-dashboard/"></iframe>`.
*Result: Complete access to the native dashboard, completely bypassing CORS, port-mapping, and firewall issues.*

---

## 3. Backend Data Layer: The Core Adapters
To show *everything* the agent is doing, FastAPI needs specialized Python Adapters that read directly from the `~/.hermes/` directory without interfering with the agent's live processes. No dummy scripts will be used.

### A. The State & Memory Manager (`hermes_state.db`)
- **Sessions & Chat:** API endpoints (`/api/v1/sessions`) that query the `messages` table. Features pagination and role-separation (user, assistant, tool).
- **Global Memory:** Utilizes SQLite `FTS5` (Full Text Search) against `agent_logs` and vector tables to allow instant querying of past facts.
- **Analytics:** Aggregates the `model_usage` table to serve daily token counts and estimated costs.

### B. The Mission Control Manager (`kanban.db`)
- **Working Agents:** Connects to `kanban.db` to query `workflows` (broad missions) and `tasks` (active agent jobs).
- Returns active sub-agents, their assigned tasks, and real-time execution status (todo, in-progress, blocked, done).

### C. The Configuration & MCP Manager (`ruamel.yaml` & `.env`)
- **Safe Editing:** Uses the `ruamel.yaml` library with defensive `.setdefault()` null-safety mapping to read/write `~/.hermes/config.yaml`. This is critical because it preserves your `# comments` and formatting when adding MCP servers.
- **Environment:** Uses `python-dotenv` to safely manage API keys and Messaging Channel tokens (Telegram, Discord) in the `.env` file.

### D. Profiles & Skills Hub Manager (Filesystem)
- **Profiles:** Python's `pathlib` scans `~/.hermes/profiles/` to catalog distinct agent identities, reading their specific `config.yaml` and `memories/` directories.
- **Skills:** Scans `~/.hermes/skills/` to catalog installed python/JS extensions and reads their `manifest.json`.

### E. The Shell Executor & Container Resilience
- Secure endpoints using Python's `subprocess.Popen` to safely execute core Hermes commands (`hermes doctor`, `hermes backup`, skill installations). Output is piped back to the frontend via WebSockets (`/ws/ops`).
- **Docker-Safe Restarts:** Uses `pkill -f hermes-gateway` to signal graceful restarts to the Docker supervisor, completely avoiding `systemctl` failures.
- **Universal Paths:** `os.path.expanduser()` strictly applied across all Python adapters to guarantee `~/.hermes` resolves correctly in both Oracle Linux and Docker container mounts.

---

## 4. Frontend UI/UX Layer: The "God View"
To prevent information overload, the React UI (using Tailwind v4 and Lucide-React icons) will be structured into distinct visual domains.

### 📊 1. System Overview & Analytics
- **Graphs:** `Recharts` stacked bar charts showing daily token usage and provider costs.
- **Host Metrics:** Live CPU/RAM gauges.

### 💻 2. Live Terminals (The Control Hub)
- **Mission Control TUI:** The `@xterm/xterm` embedded terminal *(Completed)*.
- **Native Dashboard:** The embedded iframe proxying the default Hermes UI.

### 📋 3. Missions & Working Agents (Kanban)
- **UI:** A Trello-style visual Kanban board (`MissionsScreen.tsx`).
- **Features:** See exactly what your sub-agents are doing. Columns for Todo/In-Progress/Done. Cards show the assigned agent's name, the JSON payload of the task, and live execution badges.

### 💬 4. Sessions Detail View
- **UI:** A Discord/WhatsApp-style chat interface (`SessionsScreen.tsx`).
- **Features:**
  - User messages align right (blue); Agent responses align left (gray).
  - **Collapsible Tool Calls:** Raw JSON tool executions (e.g., `▶ 🛠️ Executed web_search`) are hidden inside clickable accordions to keep the chat clean.

### 👥 5. Profiles Manager (The Team Roster)
- **UI:** A Card Grid of your distinct agents (e.g., "Developer", "Researcher").
- **Features:** Click an agent card to open a side-drawer displaying their specific system prompt, equipped tools, and specific memory banks.

### 🔌 6. MCPs & Skills Hub (The App Store)
- **UI:** A modern marketplace grid (`MarketplaceScreen.tsx`).
- **Features:**
  - **Skills:** List installed tools. Toggle them on/off. Click "Install" to stream download logs.
  - **MCPs:** A UI table to add `stdio` (local) or `sse` (remote) MCP servers to the config, with a "Test Connection" button.

### ⚙️ 7. System Settings & Ops
- **UI:** Integrates `@monaco-editor/react` for a VS Code-like experience in the browser (`ConfigEditor.tsx`).
- **Features:** Safely edit `config.yaml` and `.env`. Includes large action buttons for **Run Doctor**, **Security Audit**, and **Backup Database** that stream live system logs into a modal overlay.

---

## 5. Next Steps for Execution (Implementation Order)

1. **Sprint 1: The Native Dashboard Proxy:** Add the `httpx` proxy route to FastAPI and the `NativeIframe.tsx` component to React. This is a massive quick-win that gets the native dashboard tunneled immediately.
2. **Sprint 2: Read-Only SQLite Dashboards:** Implement the `HermesStateAdapter` and `KanbanAdapter`. Build the Sessions UI (Chat Bubbles) and Missions Board (Kanban). *Since this is read-only data, it is 100% safe and won't disrupt the agent.*
3. **Sprint 3: The Profile Roster:** Scan the `profiles/` directory and build the visual agent grid.
4. **Sprint 4: Safe Config Editors:** Install `ruamel.yaml` (Backend) and `@monaco-editor/react` (Frontend) to build the MCP Manager, Credentials Vault, and System Settings.
