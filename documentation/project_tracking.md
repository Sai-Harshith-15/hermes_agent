# Project Tracking & Kanban Integration

## Overview
This file tracks the overarching progress of the Hermes Mission Control project and details the mechanisms used to ensure work is managed, scheduled, and recorded accurately.

## Current Folder Structure (from Graphify)
The project is currently organized as follows:
- **`backend/`**: FastAPI implementation, SQLite adapters (`services/hermes/`, `services/warden/`), routing, and data models.
- **`frontend/`**: React + Vite SPA containing the dashboard widgets, `xterm.js` terminal, and Recharts visuals.
- **`documentation/`**: You are here. Modular markdown documentation outlining the architecture and domains of the project.
- **`graphify-out/`**: Code graph analytics and extraction reports detailing cross-module dependencies.

## Kanban Tracking Integration
Hermes handles its own internal work tracking using a local `kanban.db` (SQLite). 
The Mission Control dashboard integrates with this tracking system to show the current phase and health of the overarching project.
- **Data Source**: `~/.hermes/kanban.db`
- **Visualization**: The React frontend polls `kanban.db` (via the backend) and renders active agents, their delegated tasks, and status (Todo / In-Progress / Done) dynamically.

## Project Phases & Status
As detailed in the `project_version_1.md` roadmap, the project is tracking towards Phase 1 completion:
- **Phase 1 (Core)**: *In Progress*. Embedding the PTY terminal and sessions views.
- **Phase 2 (Important)**: *Pending*. MCP Servers, Skills, Credentials.
- **Phase 3 (Polish)**: *Pending*. Analytics, Themes, Webhooks.

*(To view active real-time status of agent tasks, see the Active Agents widget in the frontend dashboard).*
