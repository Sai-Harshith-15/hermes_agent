import os
import pathlib
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()

class CheckpointItem(BaseModel):
    filename: str
    created_at: float
    size_bytes: int

@router.get("/", response_model=list[CheckpointItem])
async def list_checkpoints():
    """
    Scans the ~/.hermes/rollback/ directory and returns a list of checkpoints.
    """
    rollback_dir = os.path.expanduser("~/.hermes/rollback")
    
    checkpoints = []
    try:
        for entry in os.scandir(rollback_dir):
            if entry.is_file():
                stat = entry.stat()
                checkpoints.append(CheckpointItem(
                    filename=entry.name,
                    created_at=stat.st_ctime,
                    size_bytes=stat.st_size
                ))
    except FileNotFoundError:
        # If the directory doesn't exist yet, return empty list safely
        pass
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
        
    return sorted(checkpoints, key=lambda x: x.created_at, reverse=True)

@router.delete("/{filename}")
async def delete_checkpoint(filename: str):
    """
    Safely deletes a checkpoint file from the rollback directory.
    """
    # Prevent path traversal
    if "/" in filename or "\\" in filename or ".." in filename:
        raise HTTPException(status_code=400, detail="Invalid filename")

    file_path = pathlib.Path(os.path.expanduser("~/.hermes/rollback")) / filename
    
    try:
        file_path.unlink(missing_ok=True)
        return {"status": "success", "message": f"Deleted {filename}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete checkpoint: {str(e)}")
