✅ What you already have covered (features that map well)

    Your manual describes these features that will genuinely be useful in a custom dashboard:

    | Your Feature                | Real Hermes Equivalent           | Notes                                               |
    |-----------------------------|----------------------------------|-----------------------------------------------------|
    | Config editing              | ~/.hermes/config.yaml read/write | ✅ Solid — this is how the real dashboard works too |
    | API Keys management         | ~/.hermes/.env read/write        | ✅ Same approach                                    |
    | Sessions browsing           | ~/.hermes/state.db (SQLite)      | ✅ Your read-only approach works                    |
    | Host metrics (CPU/RAM/disk) | psutil + /proc                   | ✅ Useful for any dashboard                         |
    | Log viewer                  | ~/.hermes/logs/                  | ✅ Same files the real dashboard reads              |
    | Profile management          | ~/.hermes/profiles/<name>/       | ✅ Valid directory structure                        |
    | Kanban integration          | ~/.hermes/kanban.db              | ✅ Real board exists                                |
    | Cron jobs management        | ~/.hermes/cron/                  | ✅ Real scheduler exists                            |
    | Cloudflare Tunnel           | Your own integration             | ✅ Valid if you want public access                  |
    | Auth + login                | Your own auth                    | ✅ Fine for a custom project                        |



    ❌ Features from the real Hermes dashboard you're missing

    These are things the actual hermes dashboard provides that your HMC manual doesn't mention at all:

    ✅ 1. Embedded Chat / Terminal (BIGGEST GAP)
    (IMPLEMENTED)

    The real dashboard runs the full Hermes TUI inside the browser via a PTY WebSocket (/api/pty). You can type messages, see tool calls stream in, use slash commands — everything you can do in the terminal. Your HMC has no way to actually talk to Hermes from the browser.

    How it works (for your implementation):

    Browser (xterm.js) ←WebSocket→ FastAPI → spawns hermes --tui as PTY child

    Real code path: web/src/ uses xterm.js with WebGL renderer, server spawns the TUI behind a POSIX pseudo-terminal, keystrokes flow one direction, ANSI output streams back.

    ✅ 2. Theme System
    (IMPLEMENTED)

    7 built-in themes (Hermes Teal, Midnight, Ember, Mono, Cyberpunk, Rosé) + custom YAML themes in ~/.hermes/dashboard-themes/. 3-layer palette (background/midground/foreground), typography stack, layout density/radius, component chrome overrides, custom CSS — all hot-swappable from a palette icon in the header.

    ✅ 3. Plugin System
    (IMPLEMENTED)

    Plugins live in ~/.hermes/plugins/<name>/dashboard/ with a manifest.json + JS bundle + optional Python backend. Can add tabs, replace built-in pages, inject into shell slots (sidebar, header). Uses a Plugin SDK on window.__HERMES_PLUGIN_SDK__ so plugins don't bundle React.

    ✅ 4. MCP Server Management
    (IMPLEMENTED)

    Full CRUD for MCP servers (stdio + HTTP/SSE), enable/disable toggle, test connection against live server, catalog browser to install approved servers with one click. The real catalog lives at optional-mcps/ in the Hermes repo.

    ✅ 5. Messaging Channels Setup UI
    (IMPLEMENTED)

    Every platform (Telegram, Discord, Slack, WhatsApp, Signal, Matrix, Mattermost, Email, SMS, BlueBubbles, DingTalk, Feishu, WeCom, etc.) with per-platform setup forms, enable/disable toggles, test connection, and a "restart gateway" button. Your manual doesn't mention this at all.

    ✅ 6. Pairing Management
    (IMPLEMENTED)

    Approve/revoke pending messaging users. The real gateway uses a pairing code system — users send a code on Telegram/Discord/etc. and the admin approves from the dashboard.

    ✅ 7. Skills Hub Browsing + Install
    (IMPLEMENTED)

    Search the skill hub (all sources), install by ID with live log output, update all button. The real system uses ~/.hermes/skills/ on disk and a hub registry.

    ✅ 8. Webhook Subscription Management
    (IMPLEMENTED)

    Create/enable/disable webhook routes with event filter, delivery target, direct-delivery mode. On creation it shows the route URL + one-time HMAC secret.

    ✅ 9. Credential Pool UI (not just .env keys)
    (IMPLEMENTED)

    Per-provider rotating API key pools. Add/remove keys for OpenRouter, Anthropic, etc. Keys are round-robinned. Your manual mentions "5× OpenCode + 3× OpenRouter" as a fixed scheme, but real Hermes pools per-provider dynamically.

    ✅ 10. System Operations
    (IMPLEMENTED)

    Doctor check, security audit, create/restore backup, update skills, prompt-size breakdown, support dump generation, config migration — all with live log streaming into the page.

    ✅ 11. Analytics
    (IMPLEMENTED)

    Token usage chart (stacked daily bar), cost breakdown, per-model breakdown. Computed from session history. Your manual has no analytics.

    ✅ 12. Shell Hooks Management
    (IMPLEMENTED)

    Create/remove shell hooks (event + command + matcher + timeout) with consent-gated security. The real system stores them in ~/.hermes/shell-hooks-allowlist.json.

    ✅ 13. Checkpoints Management
    (IMPLEMENTED)

    View and prune the /rollback filesystem checkpoint store.

    ✅ 14. Skill Curator Status
    (IMPLEMENTED)

    Pause/resume/view the background skill maintenance system.



    🛠️ Concepts in your manual that need correction

    These are things your manual describes that don't exist in the real Hermes Agent. You need to either implement them as custom extensions or replace them with what actually exists on disk.

    company_loop.sh — ❌ Doesn't exist

    What your manual says: A heartbeat script that POSTs metrics and wakes agents.
    What actually exists: Hermes has no central loop script. The gateway runs as a service. cronjob tool handles scheduled work. If you want telemetry, you'll need to build your own collector that reads from ~/.hermes/logs/ and system /proc/ — there is no stock script to bolt onto.

    litellm_hook.py — ❌ Doesn't exist

    What your manual says: A LiteLLM callback for token/cost tracking.
    What actually exists: Hermes calls LLM providers directly — no LiteLLM proxy in between. There's no callback hook to install. If you want token tracking, read ~/.hermes/state.db (which has session token counts) directly.

    hermes_log_shim.py — ❌ Doesn't exist

    What your manual says: A logging shim sub-agents import to send logs to HMC.
    What actually exists: Hermes agents log to files in ~/.hermes/logs/. There's no HTTP-push shim.

    soul.md / taste.md — ❌ Don't exist

    What your manual says: Profile files for agent identity and standards.
    What actually exists: Hermes profiles are directories under ~/.hermes/profiles/<name>/ containing their own config.yaml, .env, state.db, skills/, memories/, etc. There are no soul.md or taste.md files anywhere in Hermes. But — if you want to create these as custom concept files that influence the agent prompt, you can. You'd need to modify the agent's prompt builder (which reads from config, not custom files).

    ~/.hermes/control/inbox/ — ❌ Doesn't exist

    What your manual says: Directory where HMC drops JSON intent files for the agent to pick up.
    What actually exists: No such directory or polling mechanism exists. You'd need to build the consumer side inside Hermes (modify company_loop.sh which doesn't exist either, or add a cron job that polls the directory).

    "Layer 1/2/3" agent hierarchy — ❌ Not a real concept

    What your manual says: Multi-layer agent supervision with Warden judges.
    What actually exists: Hermes has delegate_task for subagents (flat, not layered), and kanban for multi-agent work queues. There's no Layer 1/2/3 hierarchy, no supervisor/warden layers.

    "Warden" self-healing — ❌ Doesn't exist

    What your manual says: Automated probe → detect → heal cycle for stuck agents and dead keys.
    What actually exists: Nothing like this ships with Hermes. If you want it, it's all custom build.

    "Janitor" disk cleanup — ❌ Doesn't exist

    What your manual says: Automated disk space management.
    What actually exists: Nothing built-in. There's hermes sessions prune for old sessions but no automated disk janitor.

    Postgres — ❌ Not used by Hermes

    What your manual says: Postgres database.
    What actually exists: Hermes uses SQLite for everything (state.db, kanban.db). Postgres adds operational complexity with zero gain for a single-host deployment.

    Nginx — ❌ Not needed

    What your manual says: Nginx reverse proxy.
    What actually exists: The real hermes dashboard serves its own static files + API from FastAPI/Uvicorn directly on one port. No Nginx needed. (You can still use Nginx if you want, but it's optional.)

    5× OpenCode + 3× OpenRouter — ❌ Not a real scheme

    What your manual says: Fixed key pools.
    What actually exists: Credential pools are per-provider with arbitrary numbers of keys. The dashboard's credential pool UI lets you add/remove keys dynamically — not a fixed 5+3 config.



    📋 Priority roadmap for your HMC project

    Based on what's most useful vs. what's fictional, here's what I'd recommend building next:

    Phase 1 — Core (build these first)
    1. Embedded Chat/PTY terminal — This is the #1 thing your dashboard is missing. Without it, you can see Hermes state but never talk to Hermes from the dashboard. Use xterm.js in the frontend + PTY WebSocket in the backend that spawns hermes --tui.
    2. Sessions detail view — Full message history with color-coded roles, tool call expand/collapse, FTS5 search
    3. Real .env/config.yaml read/write — Your manual mentions these but make sure they actually work with Hermes's file format

    Phase 2 — Important features
    4. MCP server management — Add/test/enable/disable MCP servers. Real format lives in config.yaml under mcp_servers: block
    5. Skills management — List installed skills from ~/.hermes/skills/, enable/disable toggle, hub search/install
    6. Messaging Channels UI — Per-platform setup forms that write to .env + config.yaml
    7. Credential pool UI — Not just single keys, but rotating pools per provider
    8. System operations — Doctor check, backup/restore, security audit

    Phase 3 — Polish
    9. Analytics — Token usage chart + cost breakdown from state.db
    10. Theme system — Even a simple theme picker makes your dashboard feel polished
    11. Webhook management — Create/enable/disable webhook routes
    12. Pairing management — Approve messaging users from the browser

    What to drop or rethink
    - company_loop.sh → Replace with a simple Python cron script or just read system metrics directly
    - litellm_hook.py → Drop this. Read token counts from state.db instead
    - soul.md/taste.md → These are fine as a custom concept if you want them, but they don't exist in Hermes. You'll need to decide: do you want your dashboard to be compatible with stock Hermes (then drop these) or are you forking/modifying Hermes to support them?
    - Postgres → Consider SQLite instead. Hermes already uses it, and it eliminates a whole container for your deployment
    - Layer 1/2/3 → Replace with real delegate_task and kanban concepts
    - Warden/Janitor → Nice if you want to build it, but it's 100% custom work — nothing exists in Hermes to build on
