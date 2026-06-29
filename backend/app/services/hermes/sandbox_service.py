import os
import subprocess
import asyncio
from pathlib import Path

class SandboxService:
    def __init__(self, workspace_dir: str = "~/workspace"):
        self.workspace_dir = Path(os.path.expanduser(workspace_dir))
        
    def get_git_diff(self) -> str:
        if not self.workspace_dir.exists():
            return "Workspace directory does not exist."
            
        try:
            result = subprocess.run(
                ["git", "diff"],
                cwd=str(self.workspace_dir),
                capture_output=True,
                text=True,
                check=True
            )
            return result.stdout
        except subprocess.CalledProcessError as e:
            return f"Git diff failed: {e.stderr}"
        except Exception as e:
            return f"Error running git diff: {str(e)}"
            
    async def get_pty_bridge(self, container_id: str):
        """
        Creates a bridge to a docker container's PTY.
        In a real implementation, this would connect via docker exec -it.
        """
        process = await asyncio.create_subprocess_shell(
            f"docker exec -it {container_id} /bin/bash",
            stdin=asyncio.subprocess.PIPE,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        return process
