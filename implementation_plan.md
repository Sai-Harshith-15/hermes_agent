# Sprint 9: The Final Polish

This sprint tackles the 5 final technical gaps necessary to achieve 100% parity with the authentic Hermes Mission Control dashboard. 

## User Review Required

Please review the proposed approach for executing system commands (such as the Gateway Restart) and confirm if `systemctl restart hermes-gateway` is the expected standard for the Hermes environment.

## Open Questions
- For the Gateway Restart, what is the exact command or systemd service name expected in the actual Hermes environment? I will default to `systemctl restart hermes-gateway` but can adjust.

## Proposed Changes

### 1. Analytics Engine Verification & Polish
- **Status:** The backend logic (`analytics.py`) currently exists, but needs to be firmly tied into the Recharts components and properly verified to ensure dynamic token tracking functions as expected.
- **Action:** Ensure `backend/app/api/v1/analytics.py` successfully returns `total_cost` and token metrics parsed natively from the `hermes_state.db` `api_key_usages` table. Verify `AnalyticsScreen.tsx` maps this data dynamically.

### 2. Remove the Pairing Mock
The pairing system currently returns a hardcoded dummy array.
- **Action:** 
  - Define `PairingRequest` in `backend/app/models/extra.py` (fields: `id`, `user_id`, `platform`, `username`, `status`, `requested_at`).
  - Update `backend/app/api/v1/messaging.py`:
    #### [MODIFY] backend/app/api/v1/messaging.py
    - Connect the `GET /pairing` route to the SQLite `AsyncSession`.
    - Connect the `POST /pairing/{user_id}/approve` route to perform an actual `UPDATE` statement changing status from `pending` to `approved`.

### 3. Complete the Vault Sync (Config Array)
The Vault is currently writing secrets to `.env` but failing to register the key into the rotation array.
- **Action:**
  #### [MODIFY] backend/app/api/v1/vault.py
  - Inside the `add_api_key` endpoint, after updating `.env`, instantiate `ruamel.yaml` to read `~/.hermes/config.yaml`.
  - Navigate to `llm.providers.<provider>.api_keys` and append the new environmental variable key ID (e.g., `$OPENROUTER_KEY_4`).
  - Write the `config.yaml` safely back to disk, preserving all formatting and comments.

### 4. Add the Messaging Gateway Restart Trigger
After configuring new messaging endpoints, the gateway must be restarted.
- **Action:**
  #### [MODIFY] backend/app/api/v1/messaging.py
  - Inside the `POST /` setup route, after writing the bot tokens to the `.env` Vault, trigger a non-blocking `subprocess.Popen(['systemctl', 'restart', 'hermes-gateway'])` call to automatically reboot the listeners.

### 5. Wire the Skill Toggle Logic
The toggle switch currently exists in the API but doesn't mutate the skill files.
- **Action:**
  #### [MODIFY] backend/app/api/v1/skills.py
  - Inside `POST /{skill_id}/toggle`, locate the skill's directory at `~/.hermes/skills/{skill_id}`.
  - Read `manifest.json`, flip the `enabled: bool` parameter, and save the JSON back to disk securely.

## Verification Plan
1. **Analytics:** Ensure the frontend Recharts graphs populate with non-mock data.
2. **Pairing:** Verify pairing requests fetch from SQLite and update correctly.
3. **Vault Sync:** Add a key and manually check `cat ~/.hermes/config.yaml` to verify the ID is pushed to the array.
4. **Gateway Restart:** Monitor the FastAPI output to confirm the `systemctl` subprocess executes without crashing the server.
5. **Skill Toggle:** Toggle a skill in the UI and verify `cat ~/.hermes/skills/{id}/manifest.json` reflects the boolean change.
