HERMES AGENT — FULL CODE AUDIT

    Repo: Sai-Harshith-15/hermes_agent (fresh clone)
    Scope: 25 backend routers (64 endpoints), 15 models, 15 services, 23 frontend screens, 18 API libs, 4 stores
    Status: 30 backend issues + 15 frontend issues found



    🔴 CRITICAL — Runtime Crashes & Missing Backend Endpoints

    #: 1
    Issue: 3 sandbox file endpoints don't exist — frontend calls GET /sandbox/files, GET
      /sandbox/file, PUT /sandbox/file but backend only has /sandbox/diff and WS
    Location: sandbox.py ↔ SandboxScreen.tsx
    Impact: File browser on SandboxScreen always 404s
    ────────────────────────────────────────
    #: 2
    Issue: key_probe.py crashes — accesses key.api_key_encrypted but model field is
      encrypted_secret
    Location: services/warden/key_probe.py:14
    Impact: Key health probes throw AttributeError
    ────────────────────────────────────────
    #: 3
    Issue: healer.py crashes — accesses key.is_active and key.notes which don't exist on
      ApiKeyPool model
    Location: services/warden/healer.py:22-23
    Impact: Warden auto-heal fails silently
    ────────────────────────────────────────
    #: 4
    Issue: state_adapter.py schema mismatch — queries start_time column on tasks table but
      model uses created_at
    Location: services/hermes/state_adapter.py
    Impact: Dashboard state loads no tasks
    ────────────────────────────────────────
    #: 5
    Issue: loop_detector.py wrong key — task.get("task_id") should be task.get("id")
    Location: services/warden/loop_detector.py:25
    Impact: Loop detection always misses

    🟠 HIGH — Placeholder/Fake Data

    #: 6
    Issue: DashboardScreen shows MOCK_ORACLE_STATS (fake CPU/RAM) until WebSocket connects
    Location: store/settingsStore.ts
    ────────────────────────────────────────
    #: 7
    Issue: TunnelsScreen always shows a fake floci_api tunnel
    Location: TunnelsScreen.tsx
    ────────────────────────────────────────
    #: 8
    Issue: ProfilesScreen shows fake swe_lead profile when API returns empty
    Location: ProfilesScreen.tsx
    ────────────────────────────────────────
    #: 9
    Issue: sessions.py — PUT/DELETE messages, POST rewind, WS stream are all stubs returning
      fake success
    Location: backend/api/v1/sessions.py
    ────────────────────────────────────────
    #: 10
    Issue: messaging.py /themes — returns hardcoded themes
    Location: messaging.py
    ────────────────────────────────────────
    #: 11
    Issue: vault.py /rotate — returns success with no rotation logic
    Location: vault.py

    🟡 MEDIUM — Security Gaps

    #: 12
    Issue: 2 WebSockets with ZERO auth — sandbox.py WS (Docker shell!) and sessions.py WS
      accept any connection
    ────────────────────────────────────────
    #: 13
    Issue: 6 routers missing role restrictions — config, hooks, curator, warden triggers,
      messaging, kanban — any token user can do admin ops
    ────────────────────────────────────────
    #: 14
    Issue: Hardcoded JWT secret — SECRET_KEY="default_secret_key_change_me_in_production"
    ────────────────────────────────────────
    #: 15
    Issue: Hardcoded Fernet master key — vault encryption key is base64 of
      "default_master_key_change_me_now"
    ────────────────────────────────────────
    #: 16
    Issue: MCP POST /test can spawn arbitrary subprocesses (command injection surface)
    ────────────────────────────────────────
    #: 17
    Issue: settingsStore WebSocket ops — calls /api/v1/ops/ws but no such endpoint exists
    ────────────────────────────────────────
    #: 18
    Issue: TerminalScreen uses localStorage.getItem('hermes_token') but everything else uses
      'token'

    🟡 MEDIUM — Code Quality

    #: 19
    Issue: 13 of 23 screens use raw useEffect+fetch instead of React Query (no caching)
    ────────────────────────────────────────
    #: 20
    Issue: 9 screens missing loading/error states
    ────────────────────────────────────────
    #: 21
    Issue: 3 API modules entirely unused — checkpoints_api.ts, themes_api.ts, ops_api.ts
      (screens bypass them)
    ────────────────────────────────────────
    #: 22
    Issue: 20+ dead imports in ModelsScreen.tsx, 9 dead imports in ChatScreen.tsx
    ────────────────────────────────────────
    #: 23
    Issue: Alembic migration is empty — upgrade() and downgrade() are both pass
    ────────────────────────────────────────
    #: 24
    Issue: Sync subprocess.run() in async handlers — ops.py, webhook_service.py block the
      event loop
    ────────────────────────────────────────
    #: 25
    Issue: Dashboard loads ALL records from 3 tables without pagination/limits

    🟢 LOW — Previous Audit Status

    | Previous Flag                 | Status                                   |
    |-------------------------------|------------------------------------------|
    | Curator path mismapping       | ✅ RESOLVED — paths correct              |
    | Config.py extra=ignore        | ✅ FIXED                                 |
    | Null-byte corruption          | ❓ Could not reproduce (file clean)      |
    | Obsidian Memory fake cards    | ✅ FIXED — now uses real API calls       |
    | CI/CD pipeline                | ❌ STILL missing — no .github/workflows/ |
    | PostgreSQL defaults confusing | ❌ STILL present                         |