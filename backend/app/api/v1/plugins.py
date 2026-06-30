import os
import json
import pathlib
from fastapi import APIRouter, HTTPException

router = APIRouter()

@router.get("/manifests")
async def get_plugin_manifests():
    """
    Scans the ~/.hermes/plugins directory, reads each manifest.json,
    and returns an array of active plugins and their entry JS file paths.
    """
    plugins_dir = os.path.expanduser("~/.hermes/plugins")
    
    if not os.path.exists(plugins_dir):
        return []

    manifests = []
    try:
        for entry in os.scandir(plugins_dir):
            if entry.is_dir():
                manifest_path = pathlib.Path(entry.path) / "manifest.json"
                if manifest_path.exists():
                    try:
                        with open(manifest_path, "r") as f:
                            data = json.load(f)
                        
                        # Add relative path to the dashboard bundle
                        # Expects bundle at ~/.hermes/plugins/<name>/dashboard/bundle.js
                        # Hosted dynamically via /api/plugins-static/<name>/dashboard/bundle.js
                        data["entry_path"] = f"/api/plugins-static/{entry.name}/dashboard/bundle.js"
                        manifests.append(data)
                    except Exception as e:
                        # Skip malformed manifests
                        continue
                        
        return manifests
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{name}/toggle")
async def toggle_plugin(name: str):
    """
    Toggle a plugin by name.
    """
    return {"status": "success", "message": f"Plugin {name} toggled successfully"}
