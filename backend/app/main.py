import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.db.database import init_db
from app.websocket_manager import manager
from app.api.v1.telemetry import router as telemetry_router
from app.api.v1.dashboard import router as dashboard_router
from app.api.v1.auth import router as auth_router
from app.api.v1.agents import router as agents_router
from app.api.v1.sessions import router as sessions_router
from app.api.v1.skills import router as skills_router
from app.api.v1.memory import router as memory_router
from app.api.v1.profiles import router as profiles_router
from app.api.v1.warden import router as warden_router
from app.api.v1.control import router as control_router
from app.api.v1.sandbox import router as sandbox_router
from app.api.v1.tunnels import router as tunnels_router
from app.api.v1.pty import router as pty_router
from app.api.v1.proxy import router as proxy_router
from app.api.v1.kanban import router as kanban_router
from app.api.v1.config import router as config_router
from app.api.v1.ops import router as ops_router
from app.api.v1.analytics import router as analytics_router
from app.api.v1.mcp import router as mcp_router
from app.api.v1.vault import router as vault_router
from app.api.v1.messaging import router as messaging_router
from app.api.v1.checkpoints import router as checkpoints_router
from app.api.v1.hooks import router as hooks_router
from app.api.v1.curator import router as curator_router
from app.api.v1.plugins import router as plugins_router
import mimetypes
from jose import jwt, JWTError
from app.services.warden.scheduler import start_scheduler, stop_scheduler
from app.api.deps import get_current_user

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB (if needed)
    await init_db()
    # Start Warden Scheduler
    start_scheduler()
    yield
    # Shutdown Warden Scheduler
    stop_scheduler()

app = FastAPI(title=settings.PROJECT_NAME, version="1.0.0", lifespan=lifespan)

# CORS configurations - tightening for production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"], # Update with actual frontend origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(auth_router, prefix="/api/v1/auth", tags=["auth"])

auth_deps = [Depends(get_current_user)]
app.include_router(telemetry_router, prefix="/api/v1/telemetry", tags=["telemetry"], dependencies=auth_deps)
app.include_router(dashboard_router, prefix="/api/v1/dashboard", tags=["dashboard"], dependencies=auth_deps)
app.include_router(agents_router, prefix="/api/v1/agents", tags=["agents"], dependencies=auth_deps)
app.include_router(sessions_router, prefix="/api/v1/sessions", tags=["sessions"], dependencies=auth_deps)
app.include_router(skills_router, prefix="/api/v1/skills", tags=["skills"], dependencies=auth_deps)
app.include_router(memory_router, prefix="/api/v1/memory", tags=["memory"], dependencies=auth_deps)
app.include_router(profiles_router, prefix="/api/v1/profiles", tags=["profiles"], dependencies=auth_deps)
app.include_router(warden_router, prefix="/api/v1/warden", tags=["warden"], dependencies=auth_deps)
app.include_router(control_router, prefix="/api/v1/control", tags=["control"], dependencies=auth_deps)
app.include_router(sandbox_router, prefix="/api/v1/sandbox", tags=["sandbox"], dependencies=auth_deps)
app.include_router(tunnels_router, prefix="/api/v1/tunnels", tags=["tunnels"], dependencies=auth_deps)
app.include_router(kanban_router, prefix="/api/v1/kanban", tags=["kanban"], dependencies=auth_deps)
app.include_router(config_router, prefix="/api/v1/config", tags=["config"], dependencies=auth_deps)
app.include_router(ops_router, prefix="/api/v1/ops", tags=["ops"], dependencies=auth_deps)
app.include_router(analytics_router, prefix="/api/v1/analytics", tags=["analytics"], dependencies=auth_deps)
app.include_router(mcp_router, prefix="/api/v1/mcp", tags=["mcp"], dependencies=auth_deps)
app.include_router(vault_router, prefix="/api/v1/vault", tags=["vault"], dependencies=auth_deps)
app.include_router(messaging_router, prefix="/api/v1/messaging", tags=["messaging"], dependencies=auth_deps)
app.include_router(checkpoints_router, prefix="/api/v1/ops/checkpoints", tags=["checkpoints"], dependencies=auth_deps)
app.include_router(hooks_router, prefix="/api/v1/ops/hooks", tags=["hooks"], dependencies=auth_deps)
app.include_router(curator_router, prefix="/api/v1/skills/curator", tags=["curator"], dependencies=auth_deps)
app.include_router(plugins_router, prefix="/api/v1/plugins", tags=["plugins"], dependencies=auth_deps)
app.include_router(pty_router, prefix="/api/pty", tags=["pty"])
app.include_router(proxy_router, prefix="/api/proxy/hermes-dashboard", tags=["proxy"])

# WebSocket Endpoint
@app.websocket("/ws/telemetry")
async def websocket_endpoint(websocket: WebSocket, token: str):
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            await websocket.close(code=1008)
            return
    except JWTError:
        await websocket.close(code=1008)
        return

    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

import os

# Initialize mimetypes for JS
mimetypes.add_type('application/javascript', '.js')

# Mount Plugin static files
# CRITICAL: Prevents boot crashes on fresh deployments
plugin_dir = os.path.expanduser("~/.hermes/plugins")
rollback_dir = os.path.expanduser("~/.hermes/rollback")
os.makedirs(plugin_dir, exist_ok=True)
os.makedirs(rollback_dir, exist_ok=True)

# NOW it is safe to mount and scan
app.mount("/api/plugins-static", StaticFiles(directory=plugin_dir), name="plugins")

# Frontend static mount fallback (for local development without Docker/NGINX)
frontend_dist = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "dist"))
if os.path.isdir(frontend_dist):
    app.mount("/", StaticFiles(directory=frontend_dist, html=True), name="frontend")
