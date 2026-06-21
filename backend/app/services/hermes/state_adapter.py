import aiosqlite
import os
from pathlib import Path
from typing import List, Dict, Any

class HermesStateAdapter:
    def __init__(self, hermes_dir: str = "~/.hermes"):
        self.hermes_dir = Path(os.path.expanduser(hermes_dir))
        self.db_path = self.hermes_dir / "hermes_state.db"

    async def _execute_query(self, query: str, params: tuple = ()) -> List[Dict[str, Any]]:
        if not self.db_path.exists():
            return []
        db_uri = f"file:{self.db_path}?mode=ro"
        async with aiosqlite.connect(db_uri, uri=True) as db:
            db.row_factory = aiosqlite.Row
            async with db.execute(query, params) as cursor:
                rows = await cursor.fetchall()
                return [dict(row) for row in rows]

    async def get_recent_sessions(self, limit: int = 50) -> List[Dict[str, Any]]:
        query = "SELECT * FROM sessions ORDER BY created_at DESC LIMIT ?"
        try:
            return await self._execute_query(query, (limit,))
        except Exception:
            return []

    async def get_recent_tasks(self, limit: int = 50) -> List[Dict[str, Any]]:
        query = "SELECT * FROM tasks ORDER BY updated_at DESC LIMIT ?"
        try:
            return await self._execute_query(query, (limit,))
        except Exception:
            return []

    async def get_messages(self, session_id: str, limit: int = 100) -> List[Dict[str, Any]]:
        query = "SELECT * FROM messages WHERE session_id = ? ORDER BY created_at ASC LIMIT ?"
        try:
            return await self._execute_query(query, (session_id, limit))
        except Exception:
            return []

    async def get_analytics(self) -> Dict[str, Any]:
        query = "SELECT SUM(prompt_tokens) as prompt_tokens, SUM(completion_tokens) as completion_tokens, SUM(total_cost) as total_cost FROM model_usage"
        try:
            res = await self._execute_query(query)
            if res and len(res) > 0:
                return res[0]
            return {"prompt_tokens": 0, "completion_tokens": 0, "total_cost": 0.0}
        except Exception:
            return {"prompt_tokens": 0, "completion_tokens": 0, "total_cost": 0.0}

    async def search_memory(self, query: str) -> List[Dict[str, Any]]:
        sql = "SELECT * FROM memory_fts WHERE memory_fts MATCH ? ORDER BY rank LIMIT 20"
        try:
            return await self._execute_query(sql, (query,))
        except Exception:
            return []
