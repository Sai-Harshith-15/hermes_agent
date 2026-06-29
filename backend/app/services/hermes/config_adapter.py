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
            config_path = agent_dir / "config.yaml"
            memories_dir = agent_dir / "memories"
            
            system_prompt = ""
            if config_path.exists():
                try:
                    with open(config_path, "r", encoding="utf-8") as f:
                        config_data = yaml.safe_load(f) or {}
                        system_prompt = config_data.get("system_prompt", "")
                except Exception:
                    pass
            
            profiles.append({
                "agent_name": agent_name,
                "system_prompt": system_prompt,
                "has_memories": memories_dir.exists()
            })
        return profiles

    def update_profile_config(self, agent_name: str, content: str) -> bool:
        try:
            agent_dir = self.profiles_dir / agent_name
            agent_dir.mkdir(parents=True, exist_ok=True)
            with open(agent_dir / "config.yaml", "w", encoding="utf-8") as f:
                f.write(content)
            return True
        except Exception as e:
            return False
