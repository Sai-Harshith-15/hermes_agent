# Hermes Mission Control — Robust Implementation Plan

> A single source of truth for turning the current prototype ("trash code") into a
> production-grade **observability + control + security plane** for the Hermes 24/7
> autonomous agent factory (SWE + YouTube domains) running on Oracle Cloud Free Tier.
>
> **This document is a PLAN ONLY. No code.** It defines architecture, screens,
> functionality, data contracts, the Hermes integration model, the local "Warden"
> overseer agent, the in-browser code sandbox, the security/tunnel layer, and a
> phased roadmap.

---

## 0. Naming

The product (this React + FastAPI app) is referred to throughout as **Hermes Mission
Control** (HMC) — internally also "Hermes Pulse" as the current UI calls it. It is
*not* the Hermes agent itself; it is the **glass cockpit + security gate + supervisor's
remote** that sits beside the Hermes orchestration on the Oracle server.

---

## 1. Vision & Goals (What we are actually building)

You run a 24/7 autonomous "digital factory" (`hermes_system_orch`):

- **Layer 1** — `company_loop.sh`: the heartbeat that wakes agents.
- **Layer 2** — Domain Supervisors (`swe_lead`, `yt_lead`) on **local Ollama/Gemma** (free).
- **Layer 3** — Specialized Workers (Product Manager, Backend Expert, QA, Video Editor,
  Voice Agent, Content Writer, etc.) on **free API keys via LiteLLM proxy** (:4000).
- **Layer 4** — Engine room: Oracle 24GB ARM (must stay >10% CPU), Ollama local brain,
  LiteLLM traffic cop with key pools (5× OpenCode, 3× OpenRouter).

Hermes Mission Control must deliver **seven capabilities**:

1. **Observe** — See every agent: which session, what task, what it's saying, what
   tools/MCP it calls, which skills it learned, how supervisors and workers communicate.
2. **Connect & Guide** — Open a live channel to any agent/supervisor, inject planning,
   steering, and corrections "my way" (human-in-the-loop supervision).
3. **Soul & Taste** — Each agent carries a `soul.md` (identity/role) plus *your* working
   taste (standards, do/don't, style). Editable from the UI, versioned, pushed to Hermes.
4. **Self-Healing Key/Loop Warden** — A **local model** that continuously checks: are all
   API keys valid & under rate limits? Is any agent stuck in a loop / erroring / burning
   tokens? When a key dies, it rotates/redistributes; when an agent loops, it intervenes.
5. **Security Gate** — Because exposing the raw Hermes dashboard via a tunnel leaks keys
   and agent internals, HMC is the **authenticated front door**: real auth, secret
   redaction, RBAC, and an encrypted vault. The tunnel only ever points at HMC.
6. **Remote Access via Tunnel** — Hermes itself can be instructed to take this project,
   run it, and publish a **secured tunnel URL** so you can reach the dashboard from
   anywhere and watch the factory.
7. **Code Sandbox** — An in-browser editor/terminal to watch coding agents work in real
   time, inspect their file tree, read diffs, and review/intervene on their code.

**North star:** zero-cost operation, 24/7 uptime, and a cockpit where one human can
supervise dozens of autonomous agents safely.

---

## 2. Current State Assessment (the honest "trash" audit)

### 2.1 What already works (keep & refactor)
- **Backend skeleton** (`backend/app/`): FastAPI app, SQLModel models, SQLite fallback,
  WebSocket broadcaster, and 7 telemetry endpoints
  (`/metrics/host`, `/telemetry/log`, `/telemetry/key`, `/telemetry/key-usage`,
  `/telemetry/agent-run`, `/telemetry/task`, `/dashboard/state`).
- **Integration hooks**: `company_loop.sh` (curl telemetry + CPU-floor stressor) and
  `litellm_hook.py` (CustomLogger posting token/cost/latency + 429 → Rate-Limited).
- **Frontend shell**: React 19 + Vite + Tailwind v4 + lucide-react, a sidebar/nav, a
  WebSocket client with auto-reconnect, and 16 screens already sketched visually.
- **Data model**: 6 tables (`host_metrics`, `api_key_pool`, `api_key_usages`,
  `agent_runs`, `tasks`, `agent_logs`).

### 2.2 What is broken / fake / missing (must fix)
| Area | Problem | Impact |
|------|---------|--------|
| **Frontend structure** | One 1,331-line `App.tsx` holding all 16 screens + components + mock data | Unmaintainable; no routing, no API layer, no state store |
| **Mock everywhere** | Most screens render hardcoded arrays; backend `seed_mock_data()` fakes keys/tasks/logs | Nothing reflects the real Hermes instance |
| **Auth is fake** | Login is a button that flips `isAuthenticated`; CORS = `*`; "JWT" is decorative | Tunneling this **exposes everything** — the opposite of the goal |
| **No Hermes connection** | No reader for `~/.hermes/` config, `hermes_state.db`, skills, sessions, MCP | Can't actually observe agents |
| **No Warden** | Key "health" is a random `+5%`; no validity probing, no loop detection, no auto-fix | Core self-healing capability absent |
| **No code sandbox** | "Sandbox" screen is just a log tail; no editor, file tree, diffs, or terminal | Can't watch/inspect coding agents |
| **No tunnel control** | Tunnels screen is a static table | Can't provision/secure remote access |
| **Secrets in DB as plaintext-ish** | Keys stored "masked" but no encryption-at-rest, no vault | Security risk |
| **No tests, no migrations, no config mgmt** | `create_all` only; `@app.on_event` deprecated; no Alembic; no settings module | Fragile, not production-ready |
| **WS is fire-and-forget** | No auth on `/ws`, no topic/room model, no backpressure | Anyone on the tunnel can read the live feed |

### 2.3 Verdict
The prototype is a **valid scaffold for the telemetry path** but is a **UI mockup** for
everything else. The plan below keeps the telemetry spine, **decomposes the frontend**,
**adds the real Hermes adapters, the Warden, the sandbox, and the security/tunnel layer**,
and replaces all mock data with live sources.

---

## 3. Target System Architecture

### 3.1 Where HMC sits relative to Hermes

```
┌────────────────────────── Oracle ARM Free Tier (Ubuntu) ──────────────────────────┐
│                                                                                    │
│  LAYER 0 (NEW): HERMES MISSION CONTROL                                             │
│  ┌──────────────────────────────────────────────────────────────────────────┐    │
│  │  FastAPI (HMC backend)  ── REST + WebSocket + SSE                          │    │
│  │   ├─ Auth & RBAC gate (JWT + sessions)         ← the ONLY thing tunneled   │    │
│  │   ├─ Hermes Adapters (read ~/.hermes, state.db, skills, sessions, MCP)     │    │
│  │   ├─ Telemetry ingest (from company_loop.sh, litellm_hook, sub-agents)     │    │
│  │   ├─ Warden service (local-model overseer: key health + loop/anomaly heal) │    │
│  │   ├─ Control bus (inject task / steer agent / pause-resume / edit soul.md) │    │
│  │   ├─ Secret Vault (encrypted-at-rest key store + redaction)                │    │
│  │   └─ Sandbox bridge (file tree, diffs, PTY stream for coding agents)       │    │
│  └──────────────────────────────────────────────────────────────────────────┘    │
│        ▲ reads/controls                              ▲ telemetry webhooks          │
│        │                                             │                             │
│  LAYER 1   company_loop.sh  ──spawns──►  LAYER 2 Supervisors (Ollama/Gemma)        │
│                                              swe_lead | yt_lead                     │
│                                                 │ spawn/guide                       │
│  LAYER 3   Specialized Workers ──API calls──►  LiteLLM Proxy :4000 ──► free keys    │
│                                                                                    │
│  ENGINE: Ollama (local brain) · hermes_state.db (SQLite FTS5) · ~/.hermes config   │
└────────────────────────────────────────────────────────────────────────────────────┘
                                   │ Cloudflare Tunnel (HTTPS, auth-gated)
                                   ▼
                         You (browser, anywhere)
```

**Key architectural rule:** The Hermes-native dashboards, LiteLLM admin, Ollama, and
raw ports are **never exposed**. The Cloudflare Tunnel terminates **only at HMC's
authenticated reverse proxy**. HMC brokers every read and every control action.

### 3.2 Component responsibilities
- **HMC Backend (FastAPI)** — auth, aggregation, control, Warden, vault, sandbox bridge.
- **HMC Frontend (React)** — the cockpit (observe + guide + edit).
- **Hermes Adapters** — read-only + control adapters that translate Hermes' native state
  (config.yaml, .env, `hermes_state.db`, `~/.hermes/skills/`, session DB, MCP registry)
  into HMC's API contracts.
- **Warden** — autonomous local-model service that watches and heals.
- **Telemetry collectors** — `company_loop.sh`, `litellm_hook.py`, and a thin Python
  sub-agent logging shim.

---

## 4. The Hermes Connection Model (how HMC actually talks to Hermes)

This is the part the prototype completely lacks. We define **four connection planes**.

### 4.1 Filesystem / Config plane (read + controlled write)
Hermes stores everything under `~/.hermes/`:
- `config.yaml` — non-secret settings (models, limits, toolsets, backends).
- `.env` — secrets (API keys/tokens). **HMC reads metadata, never echoes raw secrets.**
- `skills/` — learned skill Markdown files (agentskills.io format).
- `MEMORY.md`, `USER.md` — sticky-note memory layers.
- profiles / `soul.md` per agent — identity + role + your "taste".

**Adapter:** `HermesConfigAdapter` — parse + watch these files (inotify/polling),
surface them in the UI, and write back **safely** (atomic writes, backups, schema
validation, secret redaction). Edits to `soul.md`, `config.yaml`, skills, and memory
flow through here.

### 4.2 State / Session plane (read)
- `hermes_state.db` — SQLite, WAL mode, FTS5-searchable archive of all sessions/tasks.
- **Adapter:** `HermesStateAdapter` — open read-only (separate connection, `PRAGMA
  query_only`), expose sessions, tasks, tool calls, token usage, and full-text search.
- This powers the **Sessions**, **Obsidian Memory**, and **agent communication** views
  with *real* data instead of mock arrays.

### 4.3 Telemetry plane (push, real-time)
- `company_loop.sh` → host metrics + heartbeats + task transitions (already present).
- `litellm_hook.py` → per-call tokens/cost/latency + 429 rate-limit events (present).
- **NEW** `hermes_log_shim.py` — a small Python logging handler that sub-agents import so
  every stdout line / tool call / MCP call streams to HMC `/telemetry/*` with `run_id`,
  `task_id`, `agent_name`, `tool_name`, `mcp_resource`.
- All land in HMC DB and broadcast over WebSocket.

### 4.4 Control plane (write / command)
How you *act* on agents from the UI. Options, in order of safety/effort:
- **A. Command-file dropbox (simplest, safest):** HMC writes a JSON "intent" file to a
  watched directory (e.g. `~/.hermes/control/inbox/`); `company_loop.sh` and supervisors
  poll it and act (inject task, pause, steer, reload soul). HMC reads `outbox/` for acks.
- **B. Local control socket / tiny RPC:** A lightweight HMC-owned daemon exposes a Unix
  socket the loop/supervisors call; lower latency than files.
- **C. Hermes-native API/CLI (preferred long-term):** If/when the Hermes CLI exposes a
  programmatic interface (run task, attach session, edit profile), HMC calls it directly.
- **Decision needed (see §16):** start with **A (dropbox)** because it needs no changes
  to Hermes internals and is trivially auditable, then graduate to C.

### 4.5 Backend execution plane (for the sandbox)
Hermes supports `local | docker | ssh | modal | daytona | singularity` backends. For the
**code sandbox**, HMC attaches to the **docker** backend (persistent `hermes-task-id`
labeled containers): list files, read/write, stream a PTY, and watch the working tree.
See §11.

---

## 5. The Warden — Local-Model Overseer (the self-healing agent you described)

> "a local model which observes the api config… all the api keys are working or not, any
> agents are running on loop / errors, so this agent will involve and fix the keys."

The Warden is a **Layer-0 supervisor-of-supervisors**, running on **local Ollama
(Gemma)** so it costs nothing and never depends on the keys it is protecting.

### 5.1 Responsibilities
1. **Key Health Probing**
   - Periodically validate every key in the pool with a cheap, real probe (1-token ping
     to each provider) — distinguishing: Valid, Invalid/Revoked, Rate-Limited (429),
     Quota-Exhausted, Timeout.
   - Track per-key RPM/TPM/daily budgets and predicted exhaustion time.
2. **Key Rotation & Redistribution** (your exact scenario)
   - Detect when N agents are colliding on the same key; **redistribute idle keys** so
     each worker gets headroom.
   - On 429/timeout-after-retries, **evict the dead key** from LiteLLM routing and
     promote a fallback; write the new routing to LiteLLM config and reload.
   - Enforce a **global cooldown** when the whole pool is saturated (pause spawns).
3. **Loop / Anomaly Detection**
   - Watch agent logs for: repeated identical tool calls, no-progress loops, error
     storms, hallucination signatures, token burn without task transition, heartbeat
     timeouts (>60s = mark dead).
   - The local model classifies "stuck vs. working" from the recent log window.
4. **Intervention / Healing**
   - Auto-actions (configurable): rotate key, restart agent session, inject a
     "you appear stuck — re-plan" steer, pause the offending task, or escalate to you.
   - Every action is logged as a **Warden Event** with reasoning, and surfaced as an
     alert you can approve/deny (Smart-Approval style).
5. **Resource Guard**
   - Keep Oracle CPU >10% (replace dummy `stress-ng` with useful background work) and
     <80%; watch RAM (Ollama footprint), disk (Storage Janitor trigger).

### 5.2 Design
- A FastAPI background service (`warden/`) with a scheduler (APScheduler/async loop).
- **Decision policy** = rules first (fast, deterministic for clear cases) + **local LLM
  judgment** for ambiguous cases ("is this agent actually stuck?").
- Writes actions via the **Control plane** (§4.4). Reads via Telemetry + State planes.
- Fully **auditable**: every probe result and every intervention persisted and shown in a
  **Warden** screen with a timeline.
- **Autonomy levels** (user-set): `observe-only` → `suggest` → `auto-heal low-risk` →
  `full-auto`. Mirrors Hermes' Smart Approvals philosophy.

---

## 6. Security & Auth Layer (the real reason this app exists)

> "when I route the hermes dashboard through tunnel it exposes all my keys and agents, so
> I am using this app for security auth."

### 6.1 Threats to neutralize
- Public tunnel URL discovered → unauthorized dashboard access.
- API keys / `.env` secrets leaking into UI, logs, or WebSocket frames.
- Agent control endpoints (inject/steer/pause) abused → factory hijack.
- Sandbox terminal = remote code execution surface.

### 6.2 Controls
1. **Authentication**
   - Real login: username + password (Argon2/bcrypt) → short-lived **JWT access** +
     rotating **refresh token** (httpOnly cookie). Replace the fake button entirely.
   - **TOTP 2FA** (authenticator app) for the admin account.
   - Optional **WebAuthn/passkey** as the strong second factor for the tunnel.
2. **Authorization (RBAC)**
   - Roles: `owner` (you — full control + secrets), `operator` (steer/inject, no secret
     reveal), `viewer` (read-only observe). Every control endpoint checks role.
3. **Secret Vault**
   - API keys encrypted at rest (Fernet/AES-GCM; master key from env/OS keyring, **never
     in the DB**). UI shows masked values; reveal requires re-auth + owner role + audit log.
   - Centralized **redaction filter** on every outbound payload (REST/WS/logs) so raw
     `sk-...` never crosses the wire.
4. **Transport & Edge**
   - Tunnel terminates at HMC only. Add **Cloudflare Access** (email/OTP/SSO) in front of
     the tunnel as a second independent gate, plus IP allow-list option.
   - Strict CORS (no `*`), security headers (HSTS, CSP, X-Frame-Options), HTTPS-only cookies.
5. **WebSocket hardening**
   - WS handshake requires a valid short-lived ticket (issued post-auth); rooms/topics so
     a `viewer` can't subscribe to secret channels; server-side filtering.
6. **Audit & Rate-limiting**
   - Append-only **audit log** of every login, secret reveal, and control action (who,
     what, when, result). Per-IP and per-account rate limits; lockout on brute force.
7. **Sandbox isolation**
   - Terminal commands run **only** inside the agent's Docker backend container, never on
     the host; command allow/deny policy; session recording; owner/operator only.

---

## 7. Tunnel & Remote Access (Hermes provisions the secured URL)

> "make the hermes agent take the project and give me the tunnel based URL so I can access
> this dashboard and check the agent activities."

### 7.1 Flow
1. A Hermes DevOps skill (or a setup script) **deploys HMC** on the Oracle host
   (backend + built frontend served by the backend or a local static server).
2. It starts a **Cloudflare Tunnel** (`cloudflared`) bound to HMC's local port (e.g.
   `:8000`), producing an HTTPS URL.
3. **Cloudflare Access policy** is attached (email OTP / SSO) → the URL is useless without
   passing both Access *and* HMC login.
4. HMC's **Tunnels** screen shows: tunnel name, public URL, target port, health, and the
   Access policy status; supports **rotate URL**, **stop**, **restart**, copy link.
5. The named tunnel + token are stored in the **Vault**; the URL is delivered to you (UI,
   and optionally a Telegram/Discord webhook).

### 7.2 Options
- **Named Cloudflare Tunnel** (stable hostname, recommended) vs. quick `trycloudflare`
  (ephemeral, good for testing). Plan supports both; default to **named + Access**.
- Health-check loop so a dropped tunnel auto-restarts (Warden can own this).

---

## 8. Backend Architecture (FastAPI) — robust folder structure

Replace the flat `backend/app/` with a layered, testable structure:

```
backend/
├─ pyproject.toml / requirements.txt        # pinned deps (+ alembic, passlib, pyjwt,
│                                            #  cryptography, apscheduler, httpx, pytest)
├─ alembic/                                  # DB migrations (replace create_all)
│  └─ versions/
├─ app/
│  ├─ main.py                               # app factory, router mounting, lifespan
│  ├─ core/
│  │  ├─ config.py                          # pydantic-settings (env-driven, no secrets in code)
│  │  ├─ security.py                        # JWT, password hashing, TOTP, deps (get_current_user)
│  │  ├─ vault.py                           # encrypt/decrypt secrets, redaction filter
│  │  ├─ rbac.py                            # role checks / permission deps
│  │  ├─ logging.py                         # structured logging + secret scrubbing
│  │  └─ events.py                          # internal pub/sub for WS fan-out
│  ├─ db/
│  │  ├─ database.py                        # async engine, session, PG + SQLite
│  │  └─ base.py
│  ├─ models/                               # SQLModel tables (split by domain)
│  │  ├─ host.py  keys.py  agents.py  tasks.py  logs.py
│  │  ├─ users.py  audit.py  warden.py  tunnels.py  sessions.py
│  ├─ schemas/                              # Pydantic request/response DTOs (redacted)
│  ├─ api/
│  │  ├─ deps.py
│  │  └─ v1/
│  │     ├─ auth.py        # login, refresh, 2FA, me
│  │     ├─ telemetry.py   # host metrics, logs, key-usage, task/agent-run ingest
│  │     ├─ dashboard.py   # aggregated state
│  │     ├─ agents.py      # list/inspect agents, sessions, communication graph
│  │     ├─ control.py     # inject task, steer, pause/resume, restart (RBAC-gated)
│  │     ├─ profiles.py    # soul.md / taste / config.yaml read+write
│  │     ├─ keys.py        # vault CRUD, reveal (audited), rotation
│  │     ├─ warden.py      # warden events, autonomy level, manual heal
│  │     ├─ skills.py      # learned skills browse/inspect
│  │     ├─ memory.py      # MEMORY.md / hermes_state.db FTS search
│  │     ├─ mcp.py         # MCP registry, whitelist, blocked calls
│  │     ├─ sandbox.py     # file tree, read/write, diff, PTY ws bridge
│  │     ├─ tunnels.py     # provision/stop/rotate tunnel + access policy
│  │     ├─ channels.py    # YouTube/X output channel status
│  │     └─ ws.py          # authenticated WebSocket (ticketed, room-based)
│  ├─ services/
│  │  ├─ hermes/                            # the Adapters from §4
│  │  │  ├─ config_adapter.py  state_adapter.py  control_adapter.py  skills_adapter.py
│  │  ├─ warden/                            # §5 overseer
│  │  │  ├─ scheduler.py  key_probe.py  loop_detector.py  healer.py  policy.py
│  │  ├─ telemetry_service.py  vault_service.py  tunnel_service.py  sandbox_service.py
│  └─ tests/                                # pytest: auth, redaction, warden, adapters
└─ integrations/                            # (was agent_integrations/)
   ├─ company_loop.sh                       # hardened: heartbeats, real metrics, control poll
   ├─ litellm_hook.py                       # real cost/usage + 429 events → vault-aware
   └─ hermes_log_shim.py                    # NEW: sub-agent stdout/tool/MCP → telemetry
```

### 8.1 Backend principles
- **Async everywhere** (async SQLAlchemy, httpx) for the always-on workload.
- **Settings via pydantic-settings**; secrets only from env/keyring.
- **Alembic migrations** (kill `create_all`); seed data behind a `--seed` dev flag only.
- **Lifespan handlers** (replace deprecated `@app.on_event`).
- **Every response passes the redaction filter.** Every control route passes RBAC.
- **Dual DB**: SQLite for the local agents' own state (read), PostgreSQL for HMC's
  aggregated store (the "Data Pump" syncs local→central per the 6 Critical Gaps).

### 8.2 Database schema (evolved from the current 6 tables)
Keep & extend: `host_metrics`, `api_key_pool` (+ `encrypted_secret`, `provider_type`,
`tpm_limit`, `daily_budget`, `predicted_exhaustion`, `last_probe_status`,
`assigned_agents`), `api_key_usages`, `agent_runs` (+ `supervisor_id`, `backend_type`,
`layer`), `tasks` (+ `parent_task_id`, `priority`, `error_count`, `loop_score`),
`agent_logs` (+ `tool_name`, `mcp_resource`, `token_cost`).

Add new tables:
- `users` (auth, role, totp_secret, password_hash)
- `audit_log` (actor, action, target, ip, result, ts)
- `warden_events` (type, severity, agent/key ref, model_reasoning, action_taken, approved_by)
- `agent_profiles` (agent_name, role, soul_md, taste_md, model_route, enabled_tools, version)
- `skills` (name, source_tier, owner_agent, description, file_ref, usage_count)
- `sessions_index` (mirror/cache of hermes_state.db sessions for fast UI + FTS)
- `mcp_registry` (resource, constraint, verdict, hit_count)
- `tunnels` (name, url, target, access_policy, status, token_ref→vault)
- `output_channels` (platform, account, quota_used, quota_limit, next_run, status)
- `agent_messages` (from_agent, to_agent, task_id, content, ts) — the **communication graph**

---

## 9. Frontend Architecture (React) — robust folder structure

Decompose the monolithic `App.tsx` (1,331 lines, 16 inline screens) into a routed,
typed, store-backed app.

```
frontend/
├─ index.html
├─ vite.config.ts  tailwind.config.js  tsconfig*.json
├─ src/
│  ├─ main.tsx                              # providers (router, query, auth, theme)
│  ├─ App.tsx                               # thin: layout + <Routes> only
│  ├─ routes.tsx                            # route table + lazy imports + guards
│  ├─ app/
│  │  ├─ providers/   (AuthProvider, WSProvider, QueryProvider, ThemeProvider)
│  │  └─ guards/      (RequireAuth, RequireRole)
│  ├─ lib/
│  │  ├─ api/                               # typed REST clients (one file per domain)
│  │  │  ├─ client.ts  auth.ts  telemetry.ts  agents.ts  control.ts  keys.ts
│  │  │  ├─ warden.ts  profiles.ts  skills.ts  memory.ts  sandbox.ts  tunnels.ts
│  │  ├─ ws/          (socket.ts — authenticated, room-based, typed events)
│  │  ├─ types/       (shared TS types mirroring backend DTOs)
│  │  └─ utils/       (formatters, ansi, time, redaction-safe display)
│  ├─ store/                                # Zustand (or Redux Toolkit) slices
│  │  ├─ authStore.ts  telemetryStore.ts  agentsStore.ts  wardenStore.ts  uiStore.ts
│  ├─ components/                           # reusable UI (design system)
│  │  ├─ layout/   (Sidebar, TopBar, NavItem, PageHeader)
│  │  ├─ ui/       (StatCard, Badge, Table, Modal, Drawer, Toast, Tabs, ProgressBar)
│  │  ├─ charts/   (LineChart, Gauge, Sparkline)   # Recharts
│  │  ├─ terminal/ (LogConsole — ANSI, virtualized; XtermTerminal — PTY)
│  │  └─ editor/   (MonacoEditor, FileTree, DiffView)
│  ├─ features/                             # one folder per screen/domain
│  │  ├─ dashboard/  agents/  kanban/  sandbox/  chat/  profiles/  vault/
│  │  ├─ warden/  sessions/  memory/  skills/  plugins/  models/  mcp/
│  │  ├─ tunnels/  channels/  webhooks/  settings/  auth/
│  └─ styles/      (index.css, tokens.css — design tokens)
```

### 9.1 Frontend principles
- **React Router** with lazy-loaded feature routes (replaces the `currentScreen` switch).
- **TanStack Query** for server state (caching, polling, retries) + **Zustand** for
  client/real-time state (WS feed, UI).
- **One typed API module per backend domain**; **one typed WS event union**.
- **Design system**: extract the repeated Tailwind patterns (cards, badges, tables,
  scrollbars) into `components/ui/` so screens are declarative. Keep the existing
  dark/emerald premium aesthetic.
- **No mock data in components** — mocks live behind a single `lib/api` dev-mock flag so
  the UI degrades gracefully when the backend is offline, but real data is default.
- **Virtualized log/terminal** for the 24/7 high-volume streams.

---

## 10. Screen-by-Screen Specification

For each screen: **purpose · live data source · what's editable · actions**. (★ = new or
substantially rebuilt vs. the prototype.)

### 10.1 Auth / Login ★
- **Purpose:** the security gate.
- **Data:** auth API.
- **Editable:** credentials, 2FA code.
- **Actions:** login, refresh, TOTP enroll, logout. (Replaces fake JWT button.)

### 10.2 Dashboard (Overview)
- **Purpose:** factory-at-a-glance.
- **Data:** `/dashboard/state` + WS — host CPU/RAM/disk, active keys, active agents,
  tokens today, Warden status, pipeline pulse, alerts.
- **Editable:** none (read).
- **Actions:** drill into any tile → its screen; acknowledge alerts.

### 10.3 Agents & Communication Graph ★
- **Purpose:** see all agents across the 4 layers and **how they communicate**.
- **Data:** `agent_runs`, `agent_messages`, supervisor→worker edges.
- **Editable:** none here.
- **Actions:** click an agent → open Agent Detail (live logs, current task, tools/MCP
  used, token spend) → **Connect** (chat/steer) or **Open in Sandbox**. Interactive
  tree/graph (supervisor → workers), live status pulse.

### 10.4 SWE Kanban
- **Purpose:** the code→test→review→deploy→error loop.
- **Data:** `tasks` (real, from state DB + telemetry), grouped by status.
- **Editable:** task priority, assignment (operator+).
- **Actions:** **Inject Task** (→ Control plane, replaces the `prompt()` hack),
  drag between columns (writes status intent), open task → logs/diff.

### 10.5 Agent Sandbox / Code Editor ★ (see §11 for depth)
- **Purpose:** watch coding agents work; inspect & review code live.
- **Data:** sandbox bridge — file tree, file contents, live diffs, PTY stream.
- **Editable:** files (operator+), with "propose vs. apply" modes.
- **Actions:** open file, view diff, run command in container terminal, comment/steer,
  approve/reject a change.

### 10.6 Supervisor Chat / Guide ★
- **Purpose:** the "connect and guide my way" channel.
- **Data:** control plane round-trip to a supervisor (local Ollama → free).
- **Editable:** message input; quick-steer presets ("re-plan", "stop & focus on X").
- **Actions:** send guidance, attach a plan, pin standing instructions into the agent's
  taste file.

### 10.7 Agent Profiles — soul.md & Taste ★
- **Purpose:** give each agent identity + *your* working taste.
- **Data:** `agent_profiles` + `~/.hermes/.../soul.md`.
- **Editable:** **soul.md**, **taste.md** (your standards/do-don't/style), model route,
  enabled tools — all real, versioned, validated.
- **Actions:** edit → preview → **Push to Hermes** (writes via Config adapter, backup +
  version), rollback to a previous version, diff versions. (Replaces the read-only mock.)

### 10.8 Warden ★
- **Purpose:** the self-healing cockpit.
- **Data:** `warden_events`, key probe results, loop scores, interventions.
- **Editable:** autonomy level (observe→suggest→auto-heal→full-auto), per-rule toggles,
  thresholds (retry count, heartbeat timeout, loop score).
- **Actions:** approve/deny a suggested heal, manually rotate a key, restart an agent,
  trigger a probe, view reasoning timeline.

### 10.9 API Vault (Keys & LiteLLM Routing) ★
- **Purpose:** manage the free-key pools securely + see routing.
- **Data:** `api_key_pool` (encrypted), `api_key_usages`, LiteLLM config, probe status.
- **Editable:** add/edit/disable keys, assign to pools/agents, set budgets/limits.
- **Actions:** **add key** (encrypted at rest), reveal (owner + re-auth + audited),
  rotate, test/probe now, view per-key usage chart and predicted exhaustion. (Replaces
  the plaintext-masked mock with a real vault + live health.)

### 10.10 Active Sessions
- **Purpose:** live `hermes-cli` / API task loops.
- **Data:** `hermes_state.db` sessions (real) + live runs.
- **Actions:** open session detail, **Connect Sandbox**, end/restart session.

### 10.11 Obsidian Memory ★
- **Purpose:** searchable long-term memory.
- **Data:** `MEMORY.md`, `USER.md`, `hermes_state.db` FTS5 search (real).
- **Editable:** MEMORY.md / USER.md (owner).
- **Actions:** full-text/trigram search sessions, open a memory, edit sticky notes.

### 10.12 Learned Skills
- **Purpose:** browse skills Hermes auto-generated.
- **Data:** `~/.hermes/skills/` (real), trust tier, usage count.
- **Editable:** enable/disable, edit a skill's Markdown (owner).
- **Actions:** inspect skill body, see which agent created it, promote/demote tier.

### 10.13 Models (Ollama / LiteLLM)
- **Purpose:** local GGUF vs proxy routes.
- **Data:** Ollama model list + RAM residency; LiteLLM model map.
- **Editable:** default routes, fallbacks.
- **Actions:** pull/remove local model, set supervisor/worker routing, set global fallback.

### 10.14 MCP Security ★
- **Purpose:** Model-Context-Protocol whitelisting + blocked-call firewall.
- **Data:** `mcp_registry`, blocked attempts, judge model.
- **Editable:** whitelist/blacklist resources & paths, judge model selection.
- **Actions:** approve/block a resource, view hit counts and verdicts.

### 10.15 Tunnels & Deploy ★
- **Purpose:** provision/secure the remote URL (§7).
- **Data:** `tunnels`, Cloudflare Access policy status, health.
- **Editable:** tunnel name, target port, Access policy, IP allow-list.
- **Actions:** **create/rotate/stop tunnel**, copy URL, attach Access policy, auto-restart.

### 10.16 Output Channels (YouTube / X)
- **Purpose:** monitor publishing quotas/crons.
- **Data:** `output_channels` (YouTube API v3, X API) — quota, next cron, status.
- **Editable:** connect/disconnect channel, schedule.
- **Actions:** connect channel, trigger/cancel an upload, view quota.

### 10.17 Webhooks & Alerts
- **Purpose:** outbound notifications (Discord/Telegram).
- **Editable:** webhook URLs, event subscriptions.
- **Actions:** create webhook, test, choose events (deploy, key-dead, agent-stuck).

### 10.18 Plugins
- **Purpose:** Hermes memory/tool plugins (Mem0, Floci AWS emu, video automator…).
- **Editable:** enable/disable, configure.

### 10.19 System Config / Settings
- **Purpose:** global knobs.
- **Editable:** context-compression threshold, NeverIdle/CPU-floor daemon, Edge-TTS,
  Storage Janitor schedule, global cooldown policy, autonomy defaults.

---

## 11. Code Sandbox / In-Browser Editor (deep dive) ★

> "for coding agents I need the sandbox like code editor — I can see how they are working
> and I can check the code as well."

### 11.1 What it must do
- **File tree** of the agent's working dir (from the Docker backend container).
- **Monaco editor** (VS Code engine) to read any file with syntax highlighting.
- **Live diff** view: what the agent changed this session (working tree vs. last commit /
  vs. session start) — so you literally watch code appear.
- **Terminal**: an xterm.js panel attached over WebSocket to a PTY **inside the agent's
  container** (never the host) to run `git diff`, `pytest`, `ls`, etc.
- **Live activity overlay**: highlight the file the agent is currently editing, stream its
  tool calls (`write_file routes/users.py`, `execute_code …`) beside the editor.
- **Intervene**: comment on a change, edit a file yourself (operator+), or send a steer
  ("revert that, use the existing util") to the agent — propose vs. apply modes.

### 11.2 Backend support (`services/sandbox_service.py` + `api/v1/sandbox.py`)
- List/read/write files in the target container (Docker exec / file sync).
- Compute diffs (git-based when the agent's repo is git-tracked).
- PTY bridge: spawn a shell in the container, stream stdin/stdout over an authenticated
  WebSocket room; record the session for audit.
- File-watcher → push "file changed" events so the editor live-refreshes.

### 11.3 Security
- Sandbox is **owner/operator only**, fully audited, command allow/deny policy, and
  strictly **container-scoped** (drop host access). Tie into MCP Snitch verdicts.

---

## 12. Agent "Soul" & "Taste" System ★

> "each agent needs to have the soul.md and the taste of my work."

- **soul.md** = identity/role/constraints for an agent (already hinted in the prototype's
  Profiles screen, but read-only and fake).
- **taste.md** (new) = *your* working standards layered on top: code style, do/don't,
  review bar, tone, definition-of-done, examples of "my way."
- **Mechanism:**
  - Stored in `agent_profiles` + written to the agent's `~/.hermes/` profile via the
    Config adapter (atomic, backed-up, versioned).
  - Composed into the agent's instruction layer at spawn (the supervisor reads soul +
    taste before delegating).
  - **Versioned & diffable** in the UI; rollback supported; "push to all agents in domain"
    bulk action.
  - Standing guidance you type in Supervisor Chat can be **pinned** into taste.md so it
    persists across sessions (turning ephemeral steering into durable policy).

---

## 13. Real-Time Telemetry & Data Pump

- **Ingest** (push): `company_loop.sh`, `litellm_hook.py`, `hermes_log_shim.py` →
  `/telemetry/*` → DB + WS broadcast (typed events, room-scoped).
- **Pull** (poll/watch): Hermes adapters read `config.yaml`, `hermes_state.db`, skills,
  MCP registry on an interval / file-watch.
- **Data Pump** (one of the 6 Critical Gaps): a background sync that copies each local
  agent's SQLite state into the central PostgreSQL store so the dashboard is fast and
  durable, and survives agent restarts.
- **Backpressure**: virtualized UI + server-side log sampling for error storms; WS
  heartbeats; reconnect with replay-from-cursor.

---

## 14. Phased Roadmap (trash → working)

> Each phase ends with something demonstrable. Earlier phases unblock the rest.

**Phase 0 — Foundation & Refactor (make it real, not fake)**
- Restructure backend into the layered tree (§8); add settings, Alembic, async DB,
  lifespan; remove `seed_mock_data` from prod path.
- Decompose `App.tsx` into router + features + `lib/api` + store (§9); wire real
  `/dashboard/state` + WS; keep mocks only behind a dev flag.
- **Exit:** clean architecture; dashboard shows live telemetry from the existing loop.

**Phase 1 — Security Gate (so it's safe to tunnel)**
- Real auth (JWT + refresh + TOTP), RBAC, Secret Vault (encrypt keys at rest), redaction
  filter, authenticated WebSocket, strict CORS + headers, audit log.
- **Exit:** no secret crosses the wire; only authenticated owners reach control routes.

**Phase 2 — Hermes Adapters (observe real agents)**
- Config, State, Skills adapters; live Sessions, Memory (FTS), Skills, Agents +
  communication graph fed from `hermes_state.db` and `~/.hermes/`.
- `hermes_log_shim.py` for rich sub-agent/tool/MCP telemetry.
- **Exit:** screens show **real** agents, sessions, skills, memory — zero mock arrays.

**Phase 3 — Warden (self-healing keys + loops)**
- Key probing, rotation/redistribution, LiteLLM reload, loop/anomaly detection, healing
  policy, autonomy levels, Warden screen + events.
- **Exit:** kill a key → Warden detects, rotates, and the UI reflects it live; a stuck
  agent triggers an intervention.

**Phase 4 — Control Plane & Guidance (connect & steer)**
- Command dropbox (§4.4-A), Inject Task, Supervisor Chat steering, soul.md/taste.md
  editor with versioning + push-to-Hermes.
- **Exit:** you can guide any agent "your way" from the browser; taste persists.

**Phase 5 — Code Sandbox (watch & review coding agents)**
- File tree, Monaco, live diffs, container PTY terminal, intervene/approve.
- **Exit:** open a coding agent → watch files change in real time, run tests, review code.

**Phase 6 — Tunnel & Remote Access**
- Cloudflare named tunnel + Access provisioning, Tunnels screen, auto-restart, deliver URL.
- **Exit:** Hermes deploys HMC and hands you a secured URL reachable from anywhere.

**Phase 7 — Hardening & 24/7 Ops**
- Data Pump, Storage Janitor, global cooldown, CPU-floor with useful work, channels +
  webhooks, load/chaos tests (simulate 429 storms, dead keys, stuck loops), backups.
- **Exit:** survives a week unattended; alerts fire; resources stay in the 10–80% band.

---

## 15. Cross-Cutting Concerns

- **Testing:** pytest for auth/redaction/Warden/adapters; Vitest + Playwright for the UI;
  a telemetry simulator (evolve `simulate_telemetry.py`) for load/chaos.
- **Observability of HMC itself:** structured logs (secret-scrubbed), health endpoints,
  self-metrics (so HMC doesn't become an unmonitored single point of failure).
- **Config & secrets:** everything env-driven; master encryption key in OS keyring/env;
  `.env` never committed; `.gitignore` covers `*.db`, `__pycache__`, build output, secrets.
- **Cost discipline:** Warden + supervisors on local Ollama; HMC adds **zero** paid API
  usage; all heavy lifting stays on free keys behind LiteLLM.
- **Resilience:** WS auto-reconnect with replay, idempotent telemetry ingest, atomic
  config writes with backups, graceful degradation when a sub-system is down.
- **Accessibility/UX:** keep the premium dark/emerald theme; add keyboard nav, virtualized
  lists for high-volume feeds, and clear "live vs. stale" indicators.

---

## 16. Open Decisions (need your call before/within each phase)

1. **Control plane mechanism (§4.4):** start with the **command-file dropbox** (no Hermes
   changes), or invest early in a Hermes CLI/API integration? *(Recommend: dropbox first.)*
2. **Sandbox backend:** standardize coding agents on the **Docker backend** so the sandbox
   has a stable container to attach to? *(Recommend: yes.)*
3. **Central DB:** PostgreSQL on the Oracle host (durable, matches the gaps doc) vs. stay
   SQLite-only for simplicity at first? *(Recommend: SQLite dev → Postgres by Phase 7.)*
4. **Warden autonomy default:** ship in `suggest` (you approve heals) or `auto-heal
   low-risk`? *(Recommend: suggest → graduate.)*
5. **Tunnel:** named Cloudflare Tunnel + Access (stable, secure) vs. quick tunnel for
   testing? *(Recommend: named + Access for real use.)*
6. **Auth model:** single owner + optional operators/viewers now, or multi-user from day
   one? *(Recommend: owner-first, RBAC scaffolding in place.)*
7. **State store:** Zustand (light) vs. Redux Toolkit (heavier, more structure) for the
   frontend? *(Recommend: Zustand + TanStack Query.)*

---

## 17. Summary

The current code is a **telemetry scaffold wrapped in a UI mockup**. This plan keeps the
working spine (FastAPI telemetry + WebSocket + the loop/LiteLLM hooks), then adds the four
things that make it the system you actually described:

1. **Real Hermes adapters** so you *observe* live agents, sessions, skills, memory, and
   their communication — not mock arrays.
2. **The Warden**, a free local-model overseer that *heals* keys and loops automatically.
3. **A real security gate + vault + secured tunnel** so remote access never leaks keys or
   agents.
4. **A control plane + soul/taste editor + code sandbox** so you can *guide every agent
   your way* and *watch coding agents build* in real time.

Executed in the 8 phases above, the "trash" becomes a robust, safe, zero-cost cockpit for
a 24/7 autonomous agent factory.
```