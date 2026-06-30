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
            
    def list_files(self, path: str = ".") -> list:
        target = self.workspace_dir / path
        if not target.exists() or not target.is_dir():
            return []
        files = []
        for item in target.iterdir():
            files.append({
                "name": item.name,
                "is_dir": item.is_dir(),
                "size": item.stat().st_size if item.is_file() else 0,
                "path": str(item.relative_to(self.workspace_dir)).replace("\\", "/")
            })
        return files

    def read_file(self, path: str) -> str:
        target = self.workspace_dir / path
        if not target.exists() or not target.is_file():
            raise FileNotFoundError(f"File {path} not found")
        return target.read_text(encoding="utf-8")

    def write_file(self, path: str, content: str) -> bool:
        target = self.workspace_dir / path
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(content, encoding="utf-8")
        return True

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
