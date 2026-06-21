# 🚀 Hermes Mission Control - Phase 2 & 3 Deep Logic Blueprint

## 1. Executive Summary & Current State
**Phase 1 is Complete.** The dashboard securely connects to the real `hermes_state.db`, provides a real-time native `@xterm/xterm` PTY terminal, proxies the native dashboard via `httpx`, and safely edits `config.yaml` using Monaco and `ruamel.yaml`. Fictional concepts have been eradicated.

**The Goal:** Transform the remaining Phase 2 and Phase 3 visual placeholders (MCP Snitch, Plugins Grid, Vault, Analytics, Pairing) into fully functional systems by writing the deep Python logic that directly manipulates the Hermes Agent's local directories, `.env` files, and SQLite databases.

---

## 2. Deep Logic Implementation: Domain by Domain

### 🔌 Domain 1: MCP Server Manager (Bridging Gap #4)
**Goal:** Convert the static `MCPScreen` into a live CRUD interface that directly modifies the `mcp_servers` block in `~/.hermes/config.yaml` and verifies connections.

*   **Backend (`backend/app/api/v1/mcp.py`)**
    *   `GET /api/v1/mcp`: Uses `HermesConfigAdapter` to read the `mcp_servers` dict from `config.yaml` and returns it as a JSON list.
    *   `POST /api/v1/mcp`: Accepts a JSON payload (name, type [stdio/sse], command/url). Uses `ruamel.yaml` to safely append this to the `mcp_servers` block **without destroying user comments**.
    *   `DELETE /api/v1/mcp/{server_name}`: Pops the server from the YAML dictionary and saves.
    *   `POST /api/v1/mcp/test`: 
        *   *If SSE:* Executes an async `httpx.get()` to the SSE endpoint to verify a 200 OK status.
        *   *If stdio:* Spawns a temporary `subprocess.Popen` running the defined command to verify the executable exists and doesn't instantly crash, returning the exit code.
*   **Frontend (`MCPScreen.tsx`)**
    *   Bind the "Add Server" modal to `POST /api/v1/mcp`.
    *   Add dynamic "Ping" buttons next to each row that call the `/test` endpoint and render a live Green/Red connection badge.

### 🛠️ Domain 2: Skills Hub Engine (Bridging Gap #7)
**Goal:** Replace the static `PluginsScreen` with a dynamic file scanner that manages actual tools in `~/.hermes/skills/` and streams installation logs.

*   **Backend (`backend/app/api/v1/skills.py`)**
    *   `GET /api/v1/skills/local`: Uses Python `pathlib` to iterate through `~/.hermes/skills/`. For each subdirectory, it parses `manifest.json` (extracting name, version, description, and status).
    *   `POST /api/v1/skills/toggle`: Modifies the `enabled: true/false` flag in a specific skill's manifest.
    *   `POST /api/v1/skills/install`: Triggers a `subprocess.Popen(['hermes', 'skill', 'install', '<skill_id>'])`. 
    *   *WebSocket Binding:* Popen's `stdout` is piped directly to your existing `/ws/ops` endpoint so the user sees real-time NPM/PIP installation logs inside the browser.
*   **Frontend (`MarketplaceScreen.tsx`)**
    *   Map the UI cards to the `GET /local` response.
    *   On clicking "Install", open a Modal containing an `xterm.js` window that subscribes to `/ws/ops` to show the live installation progress.

### 🔐 Domain 3: Credential Vault & Rotation (Bridging Gap #9)
**Goal:** Upgrade the `VaultScreen` from a simple static UI into a rotating credential manager across multiple LLM providers.

*   **Backend (`backend/app/api/v1/vault.py`)**
    *   `GET /api/v1/vault`: Parses `~/.hermes/config.yaml` under `llm.providers`. It maps providers (e.g., `openai`, `openrouter`) and returns masked keys (e.g., `sk-or-v1-****abcd`).
    *   `POST /api/v1/vault/add`: Accepts `{provider: "openrouter", key: "sk-..."}`. 
        *   Appends the new key ID to the `api_keys` rotation array in `config.yaml`.
        *   Writes the actual raw string to `~/.hermes/.env` using the `python-dotenv` library's `set_key()` function (e.g., `OPENROUTER_KEY_3=sk-...`) to ensure existing variables aren't overwritten.
*   **Frontend (`VaultScreen.tsx`)**
    *   Build "Provider Cards" (OpenRouter, Anthropic, OpenAI).
    *   Inside each card, display the pool size (e.g., "3 Active Keys").
    *   Include logic to add keys, automatically injecting them into the backend rotation pool.

### 📈 Domain 4: Analytics Engine (Bridging Gap #11)
**Goal:** Query real token usage and cost data from SQLite and render it visually, replacing fictional monitoring scripts.

*   **Backend (`backend/app/api/v1/analytics.py`)**
    *   `GET /api/v1/analytics/daily`: Executes an aggregation SQL query against `hermes_state.db`:
        ```sql
        SELECT DATE(timestamp) as day, model_id, 
               SUM(prompt_tokens) as input, 
               SUM(completion_tokens) as output, 
               SUM(cost) as total_cost 
        FROM model_usage 
        WHERE timestamp >= date('now', '-30 days')
        GROUP BY DATE(timestamp), model_id;
        ```
    *   Formats the SQLite rows into a JSON array optimized for Recharts.
*   **Frontend (`AnalyticsScreen.tsx`)**
    *   Implement `<BarChart stacked={true}>` from Recharts. X-Axis: `day`. Y-Axis: `input` vs `output` tokens split by model color. 
    *   Implement `<PieChart>` for total cost breakdown per provider.

### 📱 Domain 5: Messaging & Pairing Management (Bridging Gaps #5 & #6)
**Goal:** Safely setup Telegram/Discord and manage external user pairing requests.

*   **Backend (`backend/app/api/v1/messaging.py`)**
    *   `POST /api/v1/messaging/setup`: Receives bot tokens and writes them to `.env` using `python-dotenv`. Automatically triggers `subprocess.run(['systemctl', 'restart', 'hermes-gateway'])` (or the Docker equivalent) to apply changes.
    *   `GET /api/v1/messaging/pairing`: Queries the `pairing_requests` or `messaging_users` table in `hermes_state.db` to fetch pending 6-digit access codes.
    *   `POST /api/v1/messaging/pairing/{user_id}/approve`: Executes an `UPDATE` SQL statement marking the user as authorized in the DB, instantly allowing the external user to chat with Hermes.
*   **Frontend (`ChannelsScreen.tsx` & `PairingModal.tsx`)**
    *   Forms for Bot Tokens.
    *   A live data table showing "Pending Requests" with "Approve" / "Ban" buttons.

### 🎨 Domain 6: Theming, Webhooks & Shell Hooks (Bridging Gaps #2, #8, #12)
**Goal:** Implement the final polish layer for themes, webhooks, and secure shell execution.

*   **Themes:** 
    *   `GET /api/v1/themes`: Scans `~/.hermes/dashboard-themes/*.yaml`.
    *   Frontend extracts CSS variables (`--bg-color`, `--accent`) from the YAML and applies them to `document.documentElement.style.setProperty()`, allowing instant UI color swaps without refreshing.
*   **Webhooks & Shell Hooks:**
    *   CRUD interfaces mapping to `~/.hermes/shell-hooks-allowlist.json`. 
    *   *Security:* Ensure a one-time HMAC secret generation via Python's `secrets.token_hex(32)` is displayed to the user on creation for payload verification.

---

## 3. Recommended Sprint Execution Order

To rapidly close these gaps without causing regressions, execute in this exact order:

1.  **Sprint 5: Analytics & SQLite Aggregation** *(Read-Only, zero risk)*. Build the SQL queries, test them, and wire up `Recharts` on the frontend.
2.  **Sprint 6: Vault & MCP Management** *(YAML/Env Mutations)*. Implement the `ruamel.yaml` logic for the MCPs and `python-dotenv` logic for the Vault. Test carefully to ensure no config comments are deleted.
3.  **Sprint 7: Skills Hub & Subprocess Streaming** *(Filesystem & Sockets)*. Build the file scanner for `manifest.json` and map the `Popen` stdout to the existing `/ws/ops` websocket.
4.  **Sprint 8: Messaging, Pairing & Polish** *(Database Writes)*. Build the Pairing DB approval queries, dynamic theme loader, and Webhook secret generator.

## User Review Required

> [!IMPORTANT]
> Please review the plan above. If this blueprint looks correct and complete, I will proceed with Sprint 5 (Analytics & SQLite Aggregation) first, as recommended. Let me know if you approve this plan to begin execution!
