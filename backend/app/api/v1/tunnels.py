from fastapi import APIRouter
from app.services.hermes.tunnel_service import HermesTunnelService

router = APIRouter()
tunnel_service = HermesTunnelService()

@router.get("/url")
def get_tunnel_url():
    url = tunnel_service.get_active_tunnel_url()
    if url:
        return {"status": "success", "url": url}
    else:
        return {"status": "pending", "url": None, "message": "Tunnel is starting or not available."}
