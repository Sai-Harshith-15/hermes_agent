import os
from pathlib import Path
from typing import List, Dict, Any

class HermesSkillsAdapter:
    def __init__(self, hermes_dir: str = "~/.hermes"):
        self.hermes_dir = Path(os.path.expanduser(hermes_dir))
        self.skills_dir = self.hermes_dir / "skills"

    def get_skills(self) -> List[Dict[str, Any]]:
        skills = []
        if not self.skills_dir.exists():
            return skills
        
        for sf in self.skills_dir.glob("*.md"):
            try:
                with open(sf, "r", encoding="utf-8") as f:
                    content = f.read()
                skills.append({
                    "name": sf.stem,
                    "content": content
                })
            except Exception:
                pass
        return skills
