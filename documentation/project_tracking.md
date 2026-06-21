# Project Tracking & Kanban Integration

## Overview
This file tracks the overarching progress of the Hermes Mission Control project and details the mechanisms used to ensure work is managed, scheduled, and recorded accurately.

## Current Folder Structure (from Graphify)
The project is currently organized as follows:
- **`backend/`**: FastAPI implementation, SQLite adapters (`services/hermes/`, `services/warden/`), PTY websocket (`pty.py`), and static file mounting for the frontend.
- **`frontend/`**: React + Vite SPA containing the dashboard widgets, `@xterm/xterm` terminal, and dynamic API endpoints.
- **`docker-compose.yml`**: Unified single-port setup combining backend, frontend, and automated Cloudflare Tunnel deployment.
- **`documentation/`**: You are here. Modular markdown documentation outlining the architecture and domains of the project.
- **`graphify-out/`**: Code graph analytics and extraction reports detailing cross-module dependencies.

## Kanban Tracking Integration
Hermes handles its own internal work tracking using a local `kanban.db` (SQLite). 
The Mission Control dashboard integrates with this tracking system to show the current phase and health of the overarching project.
- **Data Source**: `~/.hermes/kanban.db`
- **Visualization**: The React frontend polls `kanban.db` (via the backend) and renders active agents, their delegated tasks, and status (Todo / In-Progress / Done) dynamically.

## Project Phases & Status
As detailed in the `project_version_1.md` roadmap, the project has successfully completed its core architecture:
- **Phase 1 (Core)**: *Completed*. The PTY terminal (`@xterm/xterm`), single-port backend architecture, Reverse Proxy, FTS5 Sessions view, Kanban boards, Profile Manager, and Monaco Config Editors have been fully implemented.
- **Phase 2 (Important)**: *Completed*. MCP Servers and Skills management hubs are fully functional, wiring into `~/.hermes/config.yaml` and `.env` pools.
- **Phase 3 (Polish)**: *Completed*. Analytics queries token metrics, dynamic Themes parse from `~/.hermes/dashboard-themes/`, and Webhooks logic handles HMAC generation.
- **Production Pre-Flight & Docker Resilience**: *Completed*. System-level dependencies (`procps`) are integrated into the Dockerfile for graceful process management. SQLite concurrency uses `sqlite+aiosqlite` with appropriate threading flags to prevent locking, and SQLModel tables are explicitly bound (e.g., `model_usage`, `pairing_requests`) matching authentic Hermes schemas exactly.
- **Sprint 10 (Power-User Expansion)**: *Completed*. The final 4 advanced gaps are closed. Integrated OS-Agnostic Checkpoint Management (`~/.hermes/rollback/`), Advanced Shell Hooks config, Skill Curator polling daemon controls, and the `PluginLoader` SDK for dynamic third-party bundle injection.
- **Final Security & DevOps Hardening**: *Completed*. Patched PID namespace isolation (`pid: host`), path traversal vulnerabilities in Checkpoints API, FastAPI static mounts boot crashing, and JS MIME type strictness for Windows Docker.

*(To view active real-time status of agent tasks, see the Active Agents widget in the frontend dashboard).*
