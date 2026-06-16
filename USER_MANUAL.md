# Hermes Mission Control — User Manual & 24/7 Connection Guide

> How to connect this web app (**Hermes Mission Control**, "HMC") to your **Hermes agent**
> running on the Oracle Cloud Free Tier server, set it up correctly, and keep the whole
> factory running **24/7**.
>
> Read top-to-bottom the first time. After that, **§9 Daily Ops** and **§10 Troubleshooting**
> are your day-to-day references.

---

## 1. What this app is (and what it talks to)

HMC is the **cockpit + security gate** that sits *beside* Hermes on the same Oracle host.
It does **not** replace Hermes — it observes and controls it through four "connection planes":

| Plane | Direction | Where it connects | Used for |
|-------|-----------|-------------------|----------|
| **Config** | read + write | `~/.hermes/config.yaml`, `~/.hermes/profiles/<agent>/soul.md` & `taste.md` | View/edit agent identity & your "taste" |
| **State** | read-only | `~/.hermes/hermes_state.db` (SQLite) | Sessions, tasks, memory search |
| **Telemetry** | push → HMC | `company_loop.sh`, `litellm_hook.py`, `hermes_log_shim.py` | Live metrics, logs, key usage |
| **Control** | write → Hermes | `~/.hermes/control/inbox/*.json` | Inject task / steer / pause agents |

```
You (browser)
   │  HTTPS via Cloudflare Tunnel (the ONLY public entry point)
   ▼
[ Nginx ] → [ HMC FastAPI :8000 ]  ──reads──►  ~/.hermes/{config.yaml, profiles, hermes_state.db}
   │              │   ▲                          ~/.hermes/control/inbox/  ◄──writes── (control)
   │              │   └── telemetry POSTs ◄── company_loop.sh / litellm_hook.py / log_shim
   ▼              ▼
[ React UI ]  [ Postgres ]      Hermes agents (Layer 1-3) + Ollama + LiteLLM :4000
```

**Golden rule:** Only HMC (behind Nginx + the tunnel) is ever exposed. Ollama, LiteLLM,
Postgres, and raw Hermes ports stay private on the host.

---

## 2. Prerequisites (install once on the Oracle host)

On your **Oracle ARM Ubuntu** server:

- [ ] **Hermes agent** installed and able to run (`~/.hermes/` exists with `config.yaml`/`.env`).
- [ ] **Ollama** running locally with your supervisor model, e.g. `ollama pull gemma2` (Layer-2 supervisors + Warden judge run here — free).
- [ ] **LiteLLM proxy** running on `:4000` with your key pools (5× OpenCode, 3× OpenRouter).
- [ ] **Docker + Docker Compose** (recommended deploy path) **or** Python 3.11+ & Node 20+ (manual path).
- [ ] **`cloudflared`** (bundled in the Docker path; otherwise install the binary).
- [ ] Ports free on the host: `8000` (API), `8080` (Nginx local test), `5432` (Postgres).

> If you only want to test on your **Windows dev machine** first, you can run the manual
> path (§5B) pointing at a local/empty `~/.hermes` — the UI works, but live Hermes data
> only appears once HMC runs on the same host as Hermes.

---

## 3. ⚠️ Preflight fixes (do these BEFORE first start — required for a clean setup)

The current code has a few known gaps (see the audit). Apply these so the app actually
boots and the security gate works. **None are optional for a real 24/7 deployment.**

1. **Add missing Python deps** to `backend/requirements.txt`:
   ```
   python-jose[cryptography]
   httpx
   python-multipart
   ```
   (Code imports `jose`, `httpx`, and uses OAuth2 form login which needs `python-multipart`.)

2. **Fix the `.env`** at `backend/.env` — for Docker, the DB host must be the compose
   service name, and secrets must be strong & private:
   ```
   DB_NAME=hermes
   DB_USER=postgres
   DB_PASSWORD=<long-random-password>
   DB_HOST=postgres          # 'postgres' for docker-compose; 'localhost' for manual run
   DB_PORT=5432
   SECRET_KEY=<run: openssl rand -hex 32>
   MASTER_KEY=<run: python -c "from cryptography.fernet import Fernet;print(Fernet.generate_key().decode())">
   HERMES_DIR=/root/.hermes  # path HMC reads; matches the docker mount in §5A
   ```
   Remove the hardcoded defaults from `app/core/config.py` so secrets come **only** from `.env`.
   Keep `.env` out of git (confirm it's git-ignored).

3. **Protect the API** — the control/profiles/sandbox/warden routes are currently
   unauthenticated. Before exposing via tunnel, add an auth dependency to those routers
   (router-level `dependencies=[Depends(get_current_user)]`). Until then, **do not open the
   tunnel** — run local-only.

4. **Frontend template strings** — confirm `frontend/src/lib/api/client.ts` and `App.tsx`
   use real backticks `` `${API_BASE_URL}${endpoint}` `` (no backslash before `${`). Fix if escaped.

5. **Warden** runs on a schedule but its background job must `await` its async tasks and the
   `warden_events` table must exist (add it to an Alembic migration). Until fixed, Warden
   logs nothing — the rest of the app still works.

> You can stand the app up first with steps 1–2 (so it boots), then harden with 3–5.

---

## 4. Prepare the Hermes side (the directory HMC reads/writes)

HMC expects this layout under your Hermes home (`~/.hermes` on the host):

```
~/.hermes/
├─ config.yaml                       # Hermes settings (HMC reads on the Profiles/Config screen)
├─ .env                              # Hermes secrets (HMC never echoes these)
├─ hermes_state.db                   # session/task archive (HMC reads, read-only)
├─ profiles/
│  ├─ swe_lead/
│  │  ├─ soul.md                     # identity/role  (editable from HMC → Profiles)
│  │  └─ taste.md                    # YOUR standards/do-don't (editable from HMC)
│  ├─ yt_lead/ { soul.md, taste.md }
│  └─ backend_expert/ { soul.md, taste.md }   # one folder per agent you want to steer
└─ control/
   ├─ inbox/                         # HMC drops intent .json files here (inject/steer/pause)
   └─ outbox/                        # (optional) agents write acks here
```

Create the scaffolding once:
```bash
mkdir -p ~/.hermes/profiles/swe_lead ~/.hermes/profiles/yt_lead ~/.hermes/control/inbox ~/.hermes/control/outbox
printf "# soul.md\nYou are the SWE Supervisor...\n" > ~/.hermes/profiles/swe_lead/soul.md
printf "# taste.md\nMy standards: tests required, no infinite loops...\n" > ~/.hermes/profiles/swe_lead/taste.md
```

**Make the agents act on control intents** (the missing half of the loop): add a small poll
step in `company_loop.sh`/your supervisor that reads `~/.hermes/control/inbox/*.json`, acts
(inject task / steer / pause), then moves the file to `outbox/`. This is what turns the
HMC buttons into real agent actions.

---

## 5. Deploy HMC

### 5A. Docker Compose (recommended for 24/7 on the Oracle host)

The repo already ships `docker-compose.yml` (tunnel + nginx + api + frontend + postgres) and
mounts `~/.hermes` into the API container at `/root/.hermes`.

```bash
cd /path/to/hermes_agent

# 1) Make sure backend/.env is set per §3 (DB_HOST=postgres, HERMES_DIR=/root/.hermes)
# 2) Build & start everything in the background
docker compose up -d --build

# 3) Apply DB migrations and create the admin user (inside the api container)
docker compose exec api alembic upgrade head
docker compose exec api python create_admin.py     # creates admin / admin123 (owner) — CHANGE THIS

# 4) Check it's alive
docker compose ps
docker compose logs -f api          # watch backend logs
```

- Local test URL: `http://<host>:8080`
- `restart: unless-stopped` is already set on tunnel/nginx/api/postgres → they auto-recover
  on crash or server reboot. That is your 24/7 baseline.

### 5B. Manual / dev run (Windows or a quick test)

**Backend:**
```bash
cd backend
python -m venv .venv && . .venv/Scripts/activate     # (Linux: source .venv/bin/activate)
pip install -r requirements.txt
# set DB_HOST=localhost in .env (or use a local Postgres / SQLite)
alembic upgrade head
python create_admin.py
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev          # dev server on http://localhost:5173 (CORS already allows this origin)
```

Open `http://localhost:5173`, log in with `admin` / `admin123`, then **change the password**.

---

## 6. First-run configuration (in the browser)

1. **Log in** (`admin` / `admin123`) → immediately change credentials / create your real owner user.
2. **API Vault** → add your real keys (OpenCode ×5, OpenRouter ×3). They are encrypted at rest
   with `MASTER_KEY`. The UI shows masked values; revealing requires owner + re-auth.
3. **Profiles** → confirm each agent's `soul.md` shows up; add your **taste.md** standards and
   **Push to Hermes** (writes back to `~/.hermes/profiles/<agent>/`).
4. **Settings** → set Warden autonomy (`observe` → `suggest` → `auto-heal`) and the CPU/heartbeat
   thresholds.
5. **Dashboard** → you should see host metrics + the live log feed once telemetry is wired (§7).

---

## 7. Wire the live data (telemetry + control)

Point the Hermes-side scripts at HMC and import the log shim. If HMC and Hermes are on the
same host, use `http://localhost:8000`.

1. **Host metrics + heartbeats** — run `integrations/company_loop.sh` (it already POSTs to
   `/api/v1/telemetry/*`). Confirm `API_URL` matches your HMC URL.

2. **API key usage / 429s** — register `integrations/litellm_hook.py` as a LiteLLM custom
   callback so every call's tokens/cost/latency and rate-limit events flow to HMC.

3. **Sub-agent logs** — in each Python sub-agent, add at startup:
   ```python
   from hermes_log_shim import setup_hermes_logging
   setup_hermes_logging(agent_name="backend_expert", hmc_url="http://localhost:8000")
   ```
   > Known mismatch to fix: the shim posts `level`/`agent_name`, but the telemetry endpoint's
   > model expects `source` and `log_level`. Align field names (shim or endpoint) or logs 422.

4. **Control round-trip** — the HMC **Kanban → Inject Task**, **Chat → Steer**, and
   **pause** buttons drop JSON into `~/.hermes/control/inbox/`. Your loop must consume them (§4).

**Quick verification:**
```bash
curl http://localhost:8000/docs                 # API is up (Swagger)
curl http://localhost:8000/api/v1/dashboard/state | head    # returns live state JSON
ls ~/.hermes/control/inbox/                      # a file appears after you click "Inject Task"
```

---

## 8. Remote access via Cloudflare Tunnel

**Only open the tunnel after §3 step 3 (auth on all routes) is done.**

- **Quick tunnel (testing):** the compose `tunnel` service runs
  `cloudflared tunnel --url http://nginx:80` and writes the public URL to
  `/shared/tunnel.log`. Get it with:
  ```bash
  docker compose logs tunnel | grep trycloudflare
  ```
- **Named tunnel + Cloudflare Access (production, recommended):**
  1. `cloudflared tunnel login` → `cloudflared tunnel create hermes`
  2. Route a hostname (`dashboard.yourdomain.com`) to the tunnel.
  3. In Cloudflare Zero Trust, add an **Access policy** (email OTP / SSO) in front of that
     hostname — now the URL is useless without passing Access **and** the HMC login.
  4. Put the tunnel token in HMC's Vault; the **Tunnels** screen shows status / rotate / stop.

You now have a private HTTPS URL to watch and steer the factory from anywhere.

---

## 9. Running 24/7 (keep-alive & self-healing)

**Layered durability — each layer restarts the one below it:**

1. **Containers** — `restart: unless-stopped` (already set) revives api/nginx/tunnel/postgres
   after crashes and host reboots. For manual (non-Docker) runs, use **systemd** units with
   `Restart=always` for `uvicorn` and `company_loop.sh`.

   Example systemd unit (`/etc/systemd/system/hmc-api.service`):
   ```ini
   [Unit]
   Description=Hermes Mission Control API
   After=network.target docker.service
   [Service]
   WorkingDirectory=/path/to/hermes_agent/backend
   ExecStart=/path/to/.venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000
   Restart=always
   RestartSec=5
   [Install]
   WantedBy=multi-user.target
   ```
   `sudo systemctl enable --now hmc-api` (repeat for a `company-loop.service`).

2. **The Hermes loop** — `company_loop.sh` is the heartbeat that wakes agents and reports
   metrics. Keep it under systemd (or `tmux`/`screen` for quick runs).

3. **Oracle reclamation guard** — Oracle reclaims idle Free-Tier instances. `company_loop.sh`
   already bursts CPU above the **>10%** floor; keep it running so the instance is never idle.

4. **The Warden (self-healing)** — HMC's scheduler probes keys and watches for stuck/looping
   agents every ~2 min, and runs the Janitor (disk cleanup) + Backup daily. Set its autonomy in
   Settings. When a key dies or an agent loops, it raises a Warden Event and (in auto modes)
   rotates the key / steers the agent. *(Finish the preflight §3.5 so Warden actually fires.)*

5. **Alerts** — configure a Discord/Telegram webhook (Webhooks screen) so you're paged on
   key-dead / agent-stuck / deploy events even when you're not watching.

**Reboot drill:** after `sudo reboot`, confirm `docker compose ps` shows all services `Up`,
`curl /api/v1/dashboard/state` returns data, and the tunnel URL resolves.

---

## 10. Verify the full chain is connected ✅

| Check | Command / Action | Expected |
|-------|------------------|----------|
| API up | `curl localhost:8000/docs` | Swagger loads |
| DB migrated | `docker compose exec api alembic current` | shows a revision |
| Login works | UI login `admin` | dashboard opens |
| Live metrics | run `company_loop.sh` | CPU/RAM tiles update |
| Key health | Vault screen | keys listed, status live |
| State read | Sessions screen | rows from `hermes_state.db` |
| Profiles | edit `taste.md` → Push | file changes in `~/.hermes/profiles/...` |
| Control | Kanban → Inject Task | JSON appears in `control/inbox/` |
| Tunnel | open public URL | dashboard via HTTPS (after Access) |

---

## 11. Troubleshooting & known issues

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| Backend won't start, `ModuleNotFoundError: jose/httpx` | missing deps | §3.1 add `python-jose[cryptography]`, `httpx`, `python-multipart` |
| `python-multipart` error on login | OAuth2 form dep missing | install `python-multipart` |
| API can't reach DB | `DB_HOST` wrong | `postgres` (docker) or `localhost` (manual) in `.env` |
| All API calls 404/CORS-fail from UI | escaped template strings | §3.4 fix backticks in `client.ts`/`App.tsx` |
| Anyone can hit control/profiles | routes unauthenticated | §3.3 add `Depends(get_current_user)` before exposing tunnel |
| Sub-agent logs 422 | shim/endpoint field mismatch | align `level↔log_level`, `agent_name↔source` |
| Warden does nothing | async job not awaited / no `warden_events` table | §3.5 fix scheduler + migration |
| Sandbox can write host files | runs on host FS, unauthed | scope to Docker backend + auth before remote use |
| Vault keys unreadable after restart | bad `MASTER_KEY` → ephemeral fallback | set a valid Fernet `MASTER_KEY` in `.env` |
| Sessions/Memory empty | wrong `HERMES_DIR` / no `hermes_state.db` | point `HERMES_DIR` at the real `~/.hermes` |

---

## 12. Daily operations cheat-sheet

```bash
docker compose ps                       # are all services up?
docker compose logs -f api              # live backend logs
docker compose logs tunnel | grep tryclo# get/refresh public URL (quick tunnel)
docker compose restart api              # bounce the backend after a config change
docker compose exec api alembic upgrade head   # apply new migrations after a pull
git pull && docker compose up -d --build       # deploy an update
```

- **Morning:** glance at Dashboard alerts + Warden events; clear any rate-limited keys.
- **When adding accounts:** drop new keys into the Vault; Warden redistributes load.
- **When an agent misbehaves:** open it in Sandbox/Chat, steer it, and pin the correction
  into its `taste.md` so the fix is permanent.
- **Weekly:** confirm Janitor freed disk, backups exist, and the tunnel/Access policy is intact.

---

## 13. Security reminders (because this is internet-exposed)

- Change `admin/admin123` immediately; create a real owner account.
- Keep `SECRET_KEY` and `MASTER_KEY` strong, in `.env`, never in git.
- Put **Cloudflare Access** in front of the named tunnel — defense in depth over HMC login.
- Never expose Ollama, LiteLLM, or Postgres ports publicly — only the tunnel → Nginx → HMC.
- Review the audit's HIGH items (auth on all routes, no host-FS sandbox, redaction) before
  trusting the tunnel with real keys.

---

**TL;DR setup order:** preflight fixes (§3) → scaffold `~/.hermes` (§4) → `docker compose up`
+ `alembic upgrade` + `create_admin` (§5A) → add keys & taste in the UI (§6) → wire
`company_loop.sh` / LiteLLM hook / log shim (§7) → secure the tunnel (§8) → run under
restart-always + Warden for 24/7 (§9) → verify the chain (§10).
```