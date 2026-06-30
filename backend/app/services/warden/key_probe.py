import httpx
import logging
from app.db.database import async_session_maker
from app.models.keys import ApiKeyPool
from app.models.warden import WardenEvent
from sqlmodel import select
from app.services.warden.webhook_service import fire_webhook

logger = logging.getLogger(__name__)

async def probe_key(key: ApiKeyPool) -> dict:
    try:
        from app.core.vault import decrypt_secret
        real_key = decrypt_secret(key.encrypted_secret)
        
        async with httpx.AsyncClient(timeout=5.0) as client:
            if key.provider.lower() == "openai":
                res = await client.get("https://api.openai.com/v1/models", headers={"Authorization": f"Bearer {real_key}"})
            elif key.provider.lower() == "anthropic":
                res = await client.get("https://api.anthropic.com/v1/models", headers={"x-api-key": real_key, "anthropic-version": "2023-06-01"})
            elif key.provider.lower() == "openrouter":
                res = await client.get("https://openrouter.ai/api/v1/models", headers={"Authorization": f"Bearer {real_key}"})
            elif key.provider.lower() == "groq":
                res = await client.get("https://api.groq.com/openai/v1/models", headers={"Authorization": f"Bearer {real_key}"})
            elif key.provider.lower() == "google":
                res = await client.get(f"https://generativelanguage.googleapis.com/v1beta/models?key={real_key}")
            else:
                return {"status": "ok", "severity": "INFO", "reasoning": "Unsupported provider probe"}
                
            if res.status_code == 401 or res.status_code == 403:
                return {"status": "error", "severity": "CRITICAL", "reasoning": f"{res.status_code} Unauthorized - Key revoked or invalid"}
            elif res.status_code == 429:
                return {"status": "rate-limited", "severity": "WARNING", "reasoning": "429 Too Many Requests - Rate limited"}
            
            # Check rate limits if headers exist
            rl_rem = res.headers.get("x-ratelimit-remaining-requests") or res.headers.get("x-ratelimit-remaining")
            if rl_rem and rl_rem.isdigit() and int(rl_rem) < 10:
                 return {"status": "warning", "severity": "WARNING", "reasoning": f"Low RPM remaining: {rl_rem}"}

            return {"status": "ok", "severity": "INFO", "reasoning": "200 OK - Probe successful"}
    except httpx.RequestError as e:
        return {"status": "error", "severity": "CRITICAL", "reasoning": f"Connection error: {str(e)}"}

async def probe_all_keys():
    async with async_session_maker() as session:
        result = await session.execute(select(ApiKeyPool))
        keys = result.scalars().all()
        for key in keys:
            result = await probe_key(key)
            if result["status"] != "ok":
                # Log Warden event if there's an issue
                event = WardenEvent(
                    event_type="KEY_PROBE",
                    severity=result["severity"],
                    key_ref=key.id,
                    reasoning=f"Provider {key.provider}: {result['reasoning']}",
                    action_taken="Suggested Key Rotation" # We are defaulting to suggest mode
                )
                session.add(event)
                fire_webhook(event)
        await session.commit()
    logger.info("Warden completed key probe cycle.")
