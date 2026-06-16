import subprocess
import json
from typing import List, Dict, Any

class HermesSandboxService:
    def __init__(self, container_name: str = "hermes_agent_sandbox"):
        self.container_name = container_name

    def list_files(self, relative_dir: str = "/") -> List[Dict[str, Any]]:
        if not relative_dir:
            relative_dir = "/"
        try:
            import shlex
            safe_dir = shlex.quote(relative_dir)
            cmd = ["docker", "exec", self.container_name, "sh", "-c", f"ls -la {safe_dir} | awk 'NR>1 {{print $1, $5, $9}}'"]
            output = subprocess.check_output(cmd, stderr=subprocess.STDOUT, text=True)
            result = []
            for line in output.strip().split('\n'):
                if not line: continue
                parts = line.split(maxsplit=2)
                if len(parts) == 3:
                    perms, size, name = parts
                    if name in ('.', '..'): continue
                    is_dir = perms.startswith('d')
                    result.append({
                        "name": name,
                        "path": f"{relative_dir.rstrip('/')}/{name}",
                        "is_dir": is_dir,
                        "size": int(size) if size.isdigit() else 0
                    })
            result.sort(key=lambda x: (not x["is_dir"], x["name"].lower()))
            return result
        except subprocess.CalledProcessError as e:
            raise FileNotFoundError(f"Directory not found or docker error: {e.output}")

    def read_file(self, relative_path: str) -> str:
        try:
            cmd = ["docker", "exec", self.container_name, "cat", relative_path]
            return subprocess.check_output(cmd, stderr=subprocess.STDOUT, text=True)
        except subprocess.CalledProcessError as e:
            raise FileNotFoundError(f"File not found or docker error: {e.output}")

    def write_file(self, relative_path: str, content: str) -> bool:
        try:
            import shlex
            safe_path = shlex.quote(relative_path)
            process = subprocess.Popen(
                ["docker", "exec", "-i", self.container_name, "sh", "-c", f"cat > {safe_path}"],
                stdin=subprocess.PIPE,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )
            stdout, stderr = process.communicate(input=content)
            if process.returncode != 0:
                raise ValueError(f"Docker write error: {stderr}")
            return True
        except Exception as e:
            raise ValueError(f"Failed to write file: {str(e)}")
