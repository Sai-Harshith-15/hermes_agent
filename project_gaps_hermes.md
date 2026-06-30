Full audit done on fresh clone (commit a790c7f). Full report at /opt/data/hermes_agent_v2/AUDIT_RESULTS.md.

    The Good: You already applied ~25 fixes from last audit. Key ones:

    - RBAC on 6 routers (config, curator, hooks, kanban, messaging, warden) — endpoints now require RequireRole(["owner","admin"])
    - Sessions edit/delete — no longer 501, now real SQL via state_adapter
    - WebSocket auth on sandbox + sessions WS (JWT validation added)
    - Dead code removed — responses.py, themes_api.ts, ops_api.ts, checkpoints_api.ts all deleted
    - Warden services fixed — key_probe uses encrypted_secret, healer uses status/last_probe_status, loop_detector uses id
    - MOCK_ORACLE_STATS removed from settingsStore
    - state_adapter fixed start_time → created_at

    The 14 Remaining Issues:

    Priority: 🔴 Stub
    Issue: Sessions /rewind returns True, doesn't rewind
    Where: state_adapter.py:129
    ────────────────────────────────────────
    Priority: 🔴 Stub
    Issue: Vault /rotate renames display string only, doesn't re-encrypt
    Where: vault.py:114-120
    ────────────────────────────────────────
    Priority: 🔴 Stub
    Issue: TunnelsScreen hardcodes primary_tunnel metadata
    Where: TunnelsScreen.tsx:14
    ────────────────────────────────────────
    Priority: 🔴 Stub
    Issue: vaultStore never called by VaultScreen — Dashboard shows 0 keys
    Where: vaultStore.ts → VaultScreen.tsx
    ────────────────────────────────────────
    Priority: 🟡 Security
    Issue: Hardcoded JWT secret
    Where: config.py:8
    ────────────────────────────────────────
    Priority: 🟡 Security
    Issue: Hardcoded Fernet key
    Where: config.py:13
    ────────────────────────────────────────
    Priority: 🟢 Quality
    Issue: Alembic migration empty
    Where: migrations/
    ────────────────────────────────────────
    Priority: 🟢 Quality
    Issue: No CI/CD
    Where: .github/workflows/
    ────────────────────────────────────────
    Priority: 🟢 Quality
    Issue: Dashboard loads all records (no pagination)
    Where: dashboard.py
    ────────────────────────────────────────
    Priority: 🟢 Quality
    Issue: Sync subprocess in async handlers
    Where: ops.py, webhook_service.py
    ────────────────────────────────────────
    Priority: 🟢 Quality
    Issue: Stray import Palette in ModelsScreen.tsx:47
    Where: after return
    ────────────────────────────────────────
    Priority: 🟢 Quality
    Issue: SandboxScreen WS hardcodes :8000
    Where: SandboxScreen.tsx
    ────────────────────────────────────────
    Priority: 🟢 Quality
    Issue: ThemesScreen uses raw fetch() no auth
    Where: ThemesScreen.tsx
    ────────────────────────────────────────
    Priority: 🟢 Quality
    Issue: ChannelsScreen 12 unused imports
    Where: ChannelsScreen.tsx

    What's 100% dynamic — 20 of 23 screens work with real API ↔ real backend and live data. All 60+ frontend API calls match existing backend routes — no 404s. Warden crash bugs are all fixed (0 runtime crashes).