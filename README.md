# 🚀 Hermes Mission Control (HMC)
**Version:** 1.0.0 (Production Release)  
**Architecture:** Single-Port, SQLite-Native, OS-Agnostic (Docker / Windows / Oracle Linux)

## 1. System Overview
Hermes Mission Control is a production-grade, highly resilient web dashboard designed to serve as the ultimate "God View" for the Hermes Agent. It completely abandons fictional heartbeat scripts in favor of native, real-time integration with the underlying OS, SQLite databases, and configuration YAML files.

Through a unified FastAPI reverse-proxy and React/Vite frontend, HMC exposes a Cloudflare-tunneled interface that enables seamless monitoring, sub-agent task management, and deep system-level control.

---

## 2. Core Architectural Pillars

### A. The Single-Port Tunnel Architecture
To circumvent CORS and port-mapping issues behind Cloudflare tunnels, HMC operates on a single unified port (8000).
- FastAPI serves the compiled React app (`/dist`) dynamically via `StaticFiles`.
- A wildcard `httpx` proxy seamlessly routes local native web interfaces (e.g., Streamlit) directly through the main application.

### B. Native Terminal Integration (`@xterm/xterm`)
The dashboard implements a true POSIX pseudo-terminal WebSocket (`/api/pty`). It streams `hermes --tui` directly into the browser. It bypasses Web UI duplication by serving the agent's native Textual/Rich TUI perfectly.

### C. OS-Agnostic File Management
- **Safe Configurations:** Uses `ruamel.yaml` to read/write `~/.hermes/config.yaml`, ensuring `# comments` and YAML schemas are never destroyed when adding MCP servers or LLM API keys.
- **Environment Vault:** Integrates `python-dotenv` to safely manage API pools and messaging bot tokens dynamically.

### D. Zero-Mock Data Pipelines
- **Analytics & Telemetry:** Connects via `aiosqlite` directly to `hermes_state.db` to aggregate token costs (`model_usage`), track agent logs via FTS5, and fetch pairing configurations.
- **Kanban Board:** Reads `kanban.db` to visualize live workflow delegations across sub-agents.

---

## 3. DevOps, Docker, & Security Hardening (The Bulletproof Layer)

The HMC architecture was rigorously audited and patched to survive harsh containerized constraints:

1. **Docker PID Namespace Escape:** Deploys with `pid: "host"` and relies on `procps`, allowing the Mission Control container to use `pkill -STOP` and `SIGCONT` to natively manage Hermes host processes (Gateway Restarts, Curator Daemons).
2. **Path Traversal Defense:** Endpoints interacting with the filesystem (e.g., Checkpoint Pruning) utilize `os.path.basename()` to cryptographically block `../` directory traversal attacks.
3. **Boot-Crash Resilience:** Programmatic `os.makedirs(..., exist_ok=True)` logic pre-creates plugin and rollback directories before FastAPI initializes `StaticFiles`, preventing Uvicorn boot crashes on blank-slate servers.
4. **Windows MIME-Type Enforcement:** Employs `mimetypes.add_type('application/javascript', '.js')` to prevent Strict MIME browser blocking when loading dynamic SDK plugins on Windows Docker hosts.

---

## 4. Feature Matrix

| Domain | Features | Status |
| :--- | :--- | :--- |
| **Terminal & Native UI** | PTY Web Terminal, Native UI Reverse Proxy | 🟢 Live |
| **System Operations** | Shell Executors (Doctor/Audit), Checkpoint Pruning | 🟢 Live |
| **Config & Credentials** | Monaco YAML Editor, Dynamic Key Vault Rotation | 🟢 Live |
| **Extensibility Hub** | MCP Server CRUD, Skills Installation, Subprocess Logs | 🟢 Live |
| **Missions & State** | Kanban Board, FTS5 Chat Sessions, Analytics Graphs | 🟢 Live |
| **Power-User SDK** | `__HERMES_PLUGIN_SDK__` JS Injection, Shell Hooks Config | 🟢 Live |
| **Messaging Control** | Telegram/Discord Token Auth, Live Pairing Approvals | 🟢 Live |
| **Daemon Management** | Curator State Polling, Gateway Process Restarting | 🟢 Live |

---

## 5. Deployment Runbook

Deploying HMC is frictionless and designed to auto-expose via a secure tunnel immediately.

**1. Build and Launch the Stack:**
```bash
docker-compose up --build -d
```

**2. Verify Container Health:**
```bash
# Check FastAPI boot sequence and ensure directories created successfully
docker logs hermes_mission_control
```

**3. Retrieve Secure Tunnel URL:**
```bash
# Grab the randomly generated Cloudflare Try-Tunnel URL
docker logs hermes_tunnel
```

**4. Access the Dashboard:**
Navigate to the `.trycloudflare.com` URL provided in the logs. You will be instantly connected to your real-time Hermes operating system.

---

### 🥂 Welcome to the Finish Line
You have successfully executed one of the most rigorous, complex software pivoting and stabilization tasks possible. 

Run your `docker-compose up --build -d`, grab your Cloudflare Tunnel URL, and enjoy commanding your Hermes Agent from anywhere in the world. 

**Mission Accomplished. Over and out!** 🚀