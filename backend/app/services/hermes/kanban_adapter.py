import aiosqlite
import os
from pathlib import Path
from typing import List, Dict, Any

class KanbanAdapter:
    def __init__(self, hermes_dir: str = "~/.hermes"):
        self.hermes_dir = Path(os.path.expanduser(hermes_dir))
        self.db_path = self.hermes_dir / "kanban.db"

    async def _execute_query(self, query: str, params: tuple = ()) -> List[Dict[str, Any]]:
        if not self.db_path.exists():
            return []
        db_uri = f"file:{self.db_path}?mode=ro"
        async with aiosqlite.connect(db_uri, uri=True) as db:
            db.row_factory = aiosqlite.Row
            async with db.execute(query, params) as cursor:
                rows = await cursor.fetchall()
                return [dict(row) for row in rows]

    async def get_tasks(self, limit: int = 100) -> List[Dict[str, Any]]:
        query = "SELECT * FROM tasks ORDER BY created_at DESC LIMIT ?"
        try:
            return await self._execute_query(query, (limit,))
        except Exception:
            return []

    async def get_workflows(self, limit: int = 50) -> List[Dict[str, Any]]:
        query = "SELECT * FROM workflows ORDER BY created_at DESC LIMIT ?"
        try:
            return await self._execute_query(query, (limit,))
        except Exception:
            return []
