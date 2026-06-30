= Codebase Audit Report

    What was added in this update (e13fe90)

    Area: Git hygiene
    Change: Added *.db, sqlite.db, *.stackdump to .gitignore. Deleted crash dumps.
    Status: ✅
    ────────────────────────────────────────
    Area: .env.example
    Change: Created for backend (full template) + frontend (VITE vars)
    Status: ✅
    ────────────────────────────────────────
    Area: Alembic skeleton
    Change: env.py, script.py.mako, initial migration (empty), versions/.gitkeep
    Status: ✅
    ────────────────────────────────────────
    Area: Rate limiting
    Change: Login endpoint: @limiter.limit("5/minute")
    Status: ✅
    ────────────────────────────────────────
    Area: Admin setup UI
    Change: LoginScreen: "First time? Setup Admin" toggle → calls /auth/setup
    Status: ✅
    ────────────────────────────────────────
    Area: RBAC
    Change: Checkpoints DELETE + all control routes → admin/owner only
    Status: ✅
    ────────────────────────────────────────
    Area: Typed API client
    Change: fetchApi<T>, typed interfaces for DashboardState, ConfigContent, etc.
    Status: ✅
    ────────────────────────────────────────
    Area: ErrorBoundary
    Change: New React error boundary wrapping all routes
    Status: ✅
    ────────────────────────────────────────
    Area: PluginsScreen rewrite
    Change: Proper name "Hermes Plugins", uses pluginsApi, empty state, WS install logs, icons
    Status: ✅
    ────────────────────────────────────────
    Area: Terminal auto-reconnect
    Change: 3s delay + auth token on WebSocket reconnect
    Status: ✅
    ────────────────────────────────────────
    Area: sendAdminIntervention
    Change: Now targets /control/inject-task (was dead /admin/intervene)
    Status: ✅
    ────────────────────────────────────────
    Area: Themes API rewrite
    Change: 4 built-in themes, CSS variable injection, localStorage persistence
    Status: ✅
    ────────────────────────────────────────
    Area: psutil
    Change: Added to requirements.txt
    Status: ✅
    ────────────────────────────────────────
    Area: WebSocket URL
    Change: Uses env var (WS_BASE_URL) instead of hardcoded ws://localhost:8000
    Status: ✅
    ────────────────────────────────────────
    Area: Phases test
    Change: Updated mock from hermesApi to profilesApi
    Status: ✅



    Issues Found

    P0 — Real Bugs (frontend calls them, backend is broken)

    1. Curator trailing-slash bug REVERTED
    backend/app/api/v1/curator.py:17 — @router.get("/") was restored. This creates the route at /api/v1/skills/curator/ (with trailing slash). Frontend calls /api/v1/skills/curator (without). Returns 404.
    Fix: Change back to @router.get("").

    2. Config.py crashes if .env has extra vars
    backend/app/core/config.py — The Settings.Config class lacks extra="ignore". If anyone puts HERMES_DIR=~/.hermes in .env (which the .env.example template shows), pydantic-settings throws ValidationError because HERMES_DIR isn't a Settings field. The app won't boot.
    Fix: Add model_config = SettingsConfigDict(env_file=".env", extra="ignore") to the Config class.

    3. WebSocket JWT token in query string
    URL format: ws://host/ws/telemetry?token=<JWT>. Tokens in query strings are logged by proxies, stored in browser history, and leaked via Referer headers. This is a security issue.
    Fix: Send the token as the first WebSocket message (auth frame) instead.

    4. Obsidian Memory Layer doesn't show real memory data
    This is the big one you asked about. The /obsidian screen:
    - Calls hermesApi.searchMemory() → /api/v1/memory/search → FTS5 query on memory_fts table (which may not exist — it's not created by SQLModel)
    - Never calls /api/v1/memory/file to read actual MEMORY.md
    - Falls back to store logs filtered for "memory/skill/file" keywords — not memory at all
    - Shows hardcoded placeholder cards ("FastAPI SSE implementation decisions", "Resolved execute_code RCE vulnerability") when empty
    - Has no Obsidian vault integration despite being called "Obsidian Memory Layer"

    The memory layer is a facade. The search endpoint queries a table that may not exist, the file endpoints are never called by the frontend, and the UI is 90% demo data + filtered logs.

    P1 — Path / Method Mismatches

    5. requirements.txt has null-byte corruption
    The slowapi line at line 21 reads: s\u0000l\u0000o\u0000w\u0000a\u0000p\u0000i... — embedded null bytes from a UTF-16 save. Pip will choke on this.
    Fix: Rewrite requirements.txt cleanly.

    6. CI pipeline is 100% commented out
    .github/workflows/ci.yml — every line from name: onward is prefixed with #. Does nothing. Can't be enabled by uncommenting because the workflow file is syntactically invalid as-is.

    7. Alembic initial migration is empty
    3aadf7ae1912_initial_schema.py — just pass. Running alembic upgrade head creates zero tables.

    P2 — Dead Code / Cleanup

    8. sendAdminIntervention() is never imported
    client.ts exports it, sendAdminIntervention is not called by any frontend screen. It was fixed from /admin/intervene to /control/inject-task, but nobody uses it.

    9. "MCP Snitch Security" label
    Nav label at App.tsx:176 says "MCP Snitch Security" — that's a fictional concept from the original blueprint. The screen actually lists MCP servers. Should be "MCP Servers".

    10. NativeDashboardScreen is empty iframe
    19 lines, just renders an empty <iframe> with no src. Placeholder.

    P3 — Polish / Missing Features

    11. No MEMORY.md/USER.md viewer
    Backend has /api/v1/memory/file to read/write MEMORY.md, but the frontend has no UI tab for it. The Obsidian screen should have a tab showing the actual file content.

    12. Config.py has PostgreSQL defaults for SQLite
    DB_NAME: str = "sample-db", DB_USER: str = "postgres", DB_HOST: str = "127.0.0.1", DB_PORT: str = "5432" — these are never used (actual connection is SQLite), but confusing for anyone reading the code.

    13. pid: "host" in docker-compose
    Security concern for production — gives the container full access to host process list.

    14. Screen Quality Classification

    | Screen           | Route             | Lines | API Calls | Classification                 |
    |------------------|-------------------|-------|-----------|--------------------------------|
    | Dashboard        | /dashboard        | 156   | 0         | Static — reads store, no fetch |
    | Analytics        | /analytics        | 112   | 2         | Partially — real API?          |
    | Native Dashboard | /native-dashboard | 19    | 0         | Placeholder — empty iframe     |
    | Terminal         | /terminal         | 127   | 0         | Fully — PTY WebSocket          |
    | Kanban           | /kanban           | 146   | 2         | Partially — uses kanbanApi     |
    | Sandbox          | /sandbox          | 271   | 5         | Partially — complex UI         |
    | Warden           | /warden           | 117   | 7         | Partially — real API           |
    | Vault            | /vault            | 205   | 3         | Partially — real API           |
    | Profiles         | /profiles         | 142   | 4         | Fully — react-query            |
    | Obsidian Memory  | /obsidian         | 89    | 3         | Static/Placeholder — fake data |
    | Sessions         | /sessions         | 314   | 3         | Partially — real API           |
    | Chat             | /chat             | 94    | 4         | Partially                      |
    | Skills           | /skills           | 140   | 3         | Partially                      |
    | Plugins          | /plugins          | 185   | 3         | Partially — was just rewritten |
    | Models           | /models           | 58    | 3         | Partially                      |
    | MCP              | /mcps             | 120   | 4         | Partially                      |
    | Webhooks         | /webhooks         | 121   | 4         | Partially                      |
    | Themes           | /themes           | 52    | 3         | Fully (client-side)            |
    | Settings         | /settings         | 223   | 7         | Partially                      |
    | Checkpoints      | /checkpoints      | 108   | 3         | Partially                      |
    | Shell Hooks      | /hooks            | 147   | 0         | Partially — uses hooksApi      |
    | Tunnels          | /tunnels          | 57    | 0         | Partially — uses tunnelsApi    |
    | Channels         | /channels         | 125   | 3         | Partially                      |
    | Login            | /login            | 73    | 0         | Fully                          |



    Recommendations (Priority Order)

    1. Fix the curator trailing slash — curator.py:17 → @router.get("") (5-second fix, immediately fixes a 404)
    2. Add extra="ignore" to Settings.Config — prevents ValidationError on boot with standard .env file
    3. Fix requirements.txt null bytes — rewrite the file cleanly or pip install will fail on slowapi
    4. Rewrite the Obsidian Memory screen — Either make it actually read MEMORY.md/USER.md via /api/v1/memory/file, or rename it to "Session Search" and remove the fake placeholder cards. Right now it's misleading — claims to show "Obsidian Memory Layer" but shows demo data and store logs.
    5. WebSocket auth: move token out of query string — Use a first-message auth frame
    6. Uncomment or remove CI pipeline — As-is it's dead weight
    7. Fix the MCP nav label — "MCP Snitch Security" → "MCP Servers"
    8. Remove PostgreSQL defaults from config.py or add a comment explaining they're unused