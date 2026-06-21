from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, List
import os
from pathlib import Path
from dotenv import set_key
from app.services.hermes.config_adapter import HermesConfigAdapter
from ruamel.yaml import YAML

router = APIRouter()
adapter = HermesConfigAdapter()
ryaml = YAML()
ryaml.preserve_quotes = True

class VaultAddRequest(BaseModel):
    provider: str
    key: str

@router.get("")
def get_vault_keys() -> List[Dict[str, Any]]:
    config = adapter.read_config()
    llm = config.get("llm", {})
    providers = llm.get("providers", {})
    api_keys = llm.get("api_keys", [])
    
    # Just returning the providers array from the config and their mapped status
    keys = []
    # If the user's config structure is llm.providers: { openrouter: { ... } }
    # Let's extract masked keys from api_keys list if it's a list of keys or names
    for key_entry in api_keys:
        if isinstance(key_entry, dict):
            provider = key_entry.get("provider", "unknown")
            key_id = key_entry.get("key_id", "unknown")
            # We don't return the raw key, just a masked version if stored, 
            # or maybe the vault just shows how many keys are in rotation.
            keys.append({
                "provider": provider,
                "key_id": key_id,
                "masked_key": f"sk-{provider[:2]}-****"
            })
        elif isinstance(key_entry, str):
            # If it's just a string reference
            keys.append({
                "provider": "unknown",
                "key_id": key_entry,
                "masked_key": f"sk-****"
            })
            
    # Include providers that might not have keys in the rotation yet
    for prov, data in providers.items():
        if not any(k.get("provider") == prov for k in keys):
            keys.append({
                "provider": prov,
                "key_id": "None",
                "masked_key": "No key configured"
            })
            
    return keys

@router.post("/add")
def add_vault_key(req: VaultAddRequest):
    raw_config = adapter.get_raw_config()
    if not raw_config:
        raw_config = "llm:\n  providers: {}\n  api_keys: []\n"
        
    try:
        data = ryaml.load(raw_config)
        providers = data.setdefault('llm', {}).setdefault('providers', {})
        provider_config = providers.setdefault(req.provider, {})
        api_keys = provider_config.setdefault('api_keys', [])
        
        # Determine the next index
        idx = len(api_keys) + 1
        env_var_name = f"{req.provider.upper()}_KEY_{idx}"
        
        # Add to YAML rotation
        if f"${env_var_name}" not in api_keys:
            api_keys.append(f"${env_var_name}")
        
        # Save YAML
        import io
        buf = io.StringIO()
        ryaml.dump(data, buf)
        adapter.update_raw_config(buf.getvalue())
        
        # Update .env
        env_path = adapter.hermes_dir / ".env"
        if not env_path.exists():
            env_path.touch()
            
        set_key(str(env_path), env_var_name, req.key)
        
        return {"status": "success", "key_id": env_var_name}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
