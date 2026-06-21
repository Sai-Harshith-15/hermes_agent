# Project Version 1: Hermes Mission Control Dashboard

## The Vision
A central Mission Control dashboard for your Hermes Agent. Built as a sleek React application backed by FastAPI, it gives you full oversight, configuration ability, and terminal-level access to the agent without dropping to the command line.

## Current State
- ✅ **Frontend:** React + Vite + Tailwind v4 real-time dashboard base.
- ✅ **Backend:** FastAPI with WebSocket broadcasting.
- ✅ **Database Support:** Setup for SQLite (`hermes_state.db`, `kanban.db`).
- ✅ **Telemetry:** Real-time logging and host metrics monitoring.

## Priority Roadmap

To achieve a true 1:1 parity with the actual Hermes systems, the following roadmap is being executed:

### Phase 1 — Core (Highest Priority)
1. **Embedded Chat / PTY Terminal:** The most critical gap. Implementing `xterm.js` in the frontend coupled with a PTY WebSocket in the backend to spawn `hermes --tui`. This enables direct agent interaction.
2. **Sessions Detail View:** Full message history with color-coded roles, tool call expansion, and FTS5 search capabilities against the SQLite database.
3. **Real Config Read/Write:** Direct `.env` and `config.yaml` management aligned with Hermes's native file structures.

### Phase 2 — Important Features
4. **MCP Server Management:** Add, test, enable, and disable MCP servers directly to `config.yaml` (`mcp_servers:` block).
5. **Skills Management:** List installed skills from `~/.hermes/skills/`, enable/disable toggles, and hub search/install logic.
6. **Messaging Channels UI:** Per-platform setup forms (Telegram, Discord, etc.) that write to `.env` and `config.yaml`.
7. **Credential Pool UI:** Dynamic routing and rotating key pools per-provider, removing fixed configurations.
8. **System Operations:** Interface for doctor checks, backup/restore features, and security auditing.

### Phase 3 — Polish
9. **Analytics:** Token usage charts (stacked daily bars) and cost breakdown logic derived from `state.db`.
10. **Theme System:** A theme picker bridging the frontend to `~/.hermes/dashboard-themes/` configurations.
11. **Webhook Management:** Interfaces to create, enable, and disable webhook routes.
12. **Pairing Management:** Approve/revoke external messaging users directly from the browser.
