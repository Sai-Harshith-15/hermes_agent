 Good — repo is at commit 3f70b09. Here's the audit laid out screen-by-screen showing what's dynamic (real API ↔ real backend) vs placeholder (fake data or stubs).



    PER-FEATURE AUDIT: Dynamic vs Placeholder

    ✅ Fully Dynamic (real API, real data)
    These screens work end-to-end with proper backend ↔ frontend wiring:

    Screen: LoginScreen
    Status: ✅ Dynamic
    Notes: POST /auth/login, /auth/setup, /auth/me all real
    ────────────────────────────────────────
    Screen: AnalyticsScreen
    Status: ✅ Dynamic
    Notes: GET /analytics/daily — real DB query
    ────────────────────────────────────────
    Screen: WardenScreen
    Status: ✅ Dynamic
    Notes: Events, probes, loop detection, heal — all real endpoints
    ────────────────────────────────────────
    Screen: SessionsScreen
    Status: ✅ Dynamic
    Notes: List/search/messages — real SQLite queries
    ────────────────────────────────────────
    Screen: SkillsScreen
    Status: ✅ Dynamic
    Notes: Skills CRUD, curator toggle — all real
    ────────────────────────────────────────
    Screen: PluginsScreen
    Status: ✅ Dynamic
    Notes: Plugin manifests, toggle, install — all real
    ────────────────────────────────────────
    Screen: MCPScreen
    Status: ✅ Dynamic
    Notes: MCP CRUD + test — all real
    ────────────────────────────────────────
    Screen: WebhooksScreen
    Status: ✅ Dynamic
    Notes: Webhooks CRUD — real
    ────────────────────────────────────────
    Screen: ShellHooksScreen
    Status: ✅ Dynamic
    Notes: Shell hooks CRUD — real
    ────────────────────────────────────────
    Screen: ObsidianScreen
    Status: ✅ Dynamic
    Notes: Memory search + file read/write — all real API calls (no fake cards)
    ────────────────────────────────────────
    Screen: ChannelsScreen
    Status: ✅ Dynamic
    Notes: Messaging setup, pairing, approve — all real
    ────────────────────────────────────────
    Screen: Login/Auth
    Status: ✅ Dynamic
    Notes: JWT, bcrypt, OAuth2 form
    ────────────────────────────────────────
    Screen: VaultScreen (list + add + reveal)
    Status: ✅ Dynamic
    Notes: Fernet encrypted, proper role check on reveal
    ────────────────────────────────────────
    Screen: SettingsScreen
    Status: ✅ Dynamic
    Notes: Config/env YAML read/write — real

    ⚠️ Partially Dynamic (has fake data mixed in)

    Screen: DashboardScreen
    Real Parts: Kanban tasks from API
    Fake Parts: hostMetrics defaults to MOCK_ORACLE_STATS (fake CPU/RAM "Active (stress-ng
      nice -n 19)") until WebSocket connects
    ────────────────────────────────────────
    Screen: TunnelsScreen
    Real Parts: GET /tunnels/url works
    Fake Parts: Always shows a hardcoded floci_api tunnel even when API returns nothing
    ────────────────────────────────────────
    Screen: ProfilesScreen
    Real Parts: GET/PUT profiles works
    Fake Parts: When API returns empty, shows a fake swe_lead profile
    ────────────────────────────────────────
    Screen: ChatScreen
    Real Parts: Session messages + steer-agent works
    Fake Parts: Hardcoded system message: "You are securely connected to the Local SWE
      Supervisor"
    ────────────────────────────────────────
    Screen: VaultScreen
    Real Parts: List, add, reveal all real
    Fake Parts: Stats cards show hardcoded "simple-shuffle" and "Ollama (Gemma-4-12b)"
      labels

    ❌ Placeholder / Broken (not dynamic)

    Screen/Endpoint: SandboxScreen
    Problem: 3 file endpoints called by frontend (GET /files, GET /file, PUT /file) don't
      exist in backend — always 404
    ────────────────────────────────────────
    Screen/Endpoint: Sessions → edit message
    Problem: PUT /sessions/{id}/messages/{mid} — returns {"status":"success"} but does
      nothing
    ────────────────────────────────────────
    Screen/Endpoint: Sessions → delete message
    Problem: DELETE same — stub, no DB operation
    ────────────────────────────────────────
    Screen/Endpoint: Sessions → rewind
    Problem: POST rewind — stub, returns hardcoded response
    ────────────────────────────────────────
    Screen/Endpoint: Sessions → WS stream
    Problem: Sends "Streaming dummy token" — fake
    ────────────────────────────────────────
    Screen/Endpoint: Messaging → themes
    Problem: GET /messaging/themes returns hardcoded "cyberpunk"/"dracula" objects
    ────────────────────────────────────────
    Screen/Endpoint: Vault → rotate
    Problem: POST /vault/rotate — returns success, never rotates anything
    ────────────────────────────────────────
    Screen/Endpoint: Settings → Ops WebSocket
    Problem: Frontend calls /api/v1/ops/ws but no such endpoint exists in backend



    🛑 Runtime Crash Bugs (will throw AttributeError)

    File: warden/key_probe.py
    Line: 14
    Broken Code: key.api_key_encrypted
    Should Be: key.encrypted_secret
    ────────────────────────────────────────
    File: warden/healer.py
    Line: 22-23
    Broken Code: key.is_active, key.notes
    Should Be: Neither field exists on ApiKeyPool model
    ────────────────────────────────────────
    File: warden/loop_detector.py
    Line: 25
    Broken Code: task.get("task_id")
    Should Be: task.get("id")
    ────────────────────────────────────────
    File: hermes/state_adapter.py
    Line: —
    Broken Code: Queries start_time column
    Should Be: Model field is created_at
    ────────────────────────────────────────
    File: hermes/state_adapter.py
    Line: —
    Broken Code: Queries FTS5 memory_fts table
    Should Be: Never created by init_db()



    🔐 Security Gaps

    Endpoint: sandbox WS
    Issue: Zero auth — anyone who reaches the server gets a Docker shell
    ────────────────────────────────────────
    Endpoint: sessions WS
    Issue: Zero auth — accepts immediately
    ────────────────────────────────────────
    Endpoint: config/, hooks/, curator/toggle, warden/trigger, messaging/, kanban/*
    Issue: No role restriction — any token user can do admin operations
    ────────────────────────────────────────
    Endpoint: JWT secret
    Issue: "default_secret_key_change_me_in_production" — hardcoded
    ────────────────────────────────────────
    Endpoint: Vault Fernet key
    Issue: "ZGVmYXVsdF9tYXN0ZXJfa2V5X2NoYW5nZV9tZV9ub3c=" — base64 of
      "default_master_key_change_me_now"



    🧹 Unused / Dead Code

    Item: checkpoints_api.ts
    Detail: Entire module unused (screen uses fetchApi directly)
    ────────────────────────────────────────
    Item: themes_api.ts
    Detail: Entire module unused (screen uses raw fetch)
    ────────────────────────────────────────
    Item: ops_api.ts
    Detail: Entire module unused (screen uses WS directly)
    ────────────────────────────────────────
    Item: schemas/responses.py
    Detail: Secret redaction code, not called by any endpoint
    ────────────────────────────────────────
    Item: control_adapter.py:17
    Detail: if True else False dead code
    ────────────────────────────────────────
    Item: skills_adapter.py
    Detail: Scans .md files but router scans manifest.json — likely unused
    ────────────────────────────────────────
    Item: ModelsScreen.tsx
    Detail: 20+ unused imports (lucide icons, react-query, API clients)
    ────────────────────────────────────────
    Item: ChatScreen.tsx
    Detail: 9 unused imports
