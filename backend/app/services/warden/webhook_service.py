import os
import requests
import logging
from app.models.warden import WardenEvent

logger = logging.getLogger(__name__)

def fire_webhook(event: WardenEvent):
    webhook_url = os.environ.get("WEBHOOK_URL")
    if not webhook_url:
        return

    payload = {
        "content": f"🚨 **Hermes Warden Alert** 🚨\n**Type**: `{event.event_type}`\n**Severity**: `{event.severity}`\n**Details**: {event.reasoning}"
    }
    
    try:
        requests.post(webhook_url, json=payload, timeout=5)
        logger.info(f"Webhook fired for Warden Event: {event.event_type}")
    except Exception as e:
        logger.error(f"Failed to fire webhook: {str(e)}")
