import os
import yaml
from pathlib import Path
from typing import Dict, Any, List
from ruamel.yaml import YAML

class HermesConfigAdapter:
    def __init__(self, hermes_dir: str = "~/.hermes"):
        self.hermes_dir = Path(os.path.expanduser(hermes_dir))
        self.config_path = self.hermes_dir / "config.yaml"
        self.profiles_dir = self.hermes_dir / "profiles"

    def read_config(self) -> Dict[str, Any]:
        if not self.config_path.exists():
            return {}
        try:
            with open(self.config_path, "r", encoding="utf-8") as f:
                return yaml.safe_load(f) or {}
        except Exception:
            return {}

    def get_raw_config(self) -> str:
        if not self.config_path.exists():
            return ""
        try:
            with open(self.config_path, "r", encoding="utf-8") as f:
                return f.read()
        except Exception:
            return ""

    def update_raw_config(self, content: str) -> bool:
        try:
            # Validate YAML syntax using ruamel
            ryaml = YAML()
            ryaml.load(content)
            
            with open(self.config_path, "w", encoding="utf-8") as f:
                f.write(content)
            return True
        except Exception as e:
            return False

    def get_raw_env(self) -> str:
        env_path = self.hermes_dir / ".env"
        if not env_path.exists():
            return ""
        try:
            with open(env_path, "r", encoding="utf-8") as f:
                return f.read()
        except Exception:
            return ""

    def update_raw_env(self, content: str) -> bool:
        env_path = self.hermes_dir / ".env"
        try:
            with open(env_path, "w", encoding="utf-8") as f:
                f.write(content)
            return True
        except Exception:
            return False

    def get_profiles(self) -> List[Dict[str, Any]]:
        profiles = []
        if not self.profiles_dir.exists():
            return profiles
            
        for agent_dir in self.profiles_dir.iterdir():
            if not agent_dir.is_dir():
                continue
                
            agent_name = agent_dir.name
            soul_path = agent_dir / "soul.md"
            taste_path = agent_dir / "taste.md"
            
            soul_content = ""
            taste_content = ""
            
            if soul_path.exists():
                try:
                    with open(soul_path, "r", encoding="utf-8") as f:
                        soul_content = f.read()
                except Exception:
                    pass
                    
            if taste_path.exists():
                try:
                    with open(taste_path, "r", encoding="utf-8") as f:
                        taste_content = f.read()
                except Exception:
                    pass
                    
            if soul_content or taste_content:
                profiles.append({
                    "agent_name": agent_name,
                    "soul_content": soul_content,
                    "taste_content": taste_content
                })
        return profiles

    def update_soul(self, agent_name: str, content: str) -> bool:
        try:
            agent_dir = self.profiles_dir / agent_name
            agent_dir.mkdir(parents=True, exist_ok=True)
            with open(agent_dir / "soul.md", "w", encoding="utf-8") as f:
                f.write(content)
            return True
        except Exception as e:
            return False

    def update_taste(self, agent_name: str, content: str) -> bool:
        try:
            agent_dir = self.profiles_dir / agent_name
            agent_dir.mkdir(parents=True, exist_ok=True)
            with open(agent_dir / "taste.md", "w", encoding="utf-8") as f:
                f.write(content)
            return True
        except Exception as e:
            return False
