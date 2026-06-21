# SQLite Database Schema

## Overview
Hermes uses **SQLite** for all of its data persistence to maintain simplicity and single-host reliability. The dashboard directly accesses these local database files (typically found in `~/.hermes/` or configured paths) rather than connecting to an external PostgreSQL server.

## Key Databases

### 1. `hermes_state.db`
This database tracks session history, logs, token usage, and overall agent status.

**Tables:**
- **`sessions`**: Stores the chat and run sessions for the terminal and agents.
- **`messages`**: Full message history (used for the Sessions Detail View). Includes color-coded roles, tool calls, and text content.
- **`model_usage`**: Tracks LLM invocations, token counts (prompt & completion), and derived cost metrics.
- **`agent_logs`**: Internal system logs and event streams (for the FTS5 search capabilities).

### 2. `kanban.db`
This database handles multi-agent work queues and the "delegate_task" workflow.

**Tables:**
- **`tasks`**: Individual work items, holding status (todo, in-progress, done), assignees, and payload data.
- **`workflows`**: Larger multi-step job trackers.

## Why SQLite?
The initial documentation referenced PostgreSQL. However, Hermes uses SQLite for everything (`state.db`, `kanban.db`). PostgreSQL adds operational complexity (container management, connection pooling) with zero gain for a single-host agent deployment. The dashboard connects to these files locally via SQLModel/SQLAlchemy.
