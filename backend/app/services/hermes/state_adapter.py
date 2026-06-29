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
        db_uri = f"file:{self.db_path}"
        async with aiosqlite.connect(db_uri, uri=True) as db:
            await db.execute("PRAGMA journal_mode=WAL;")
            db.row_factory = aiosqlite.Row
            async with db.execute(query, params) as cursor:
                rows = await cursor.fetchall()
                return [dict(row) for row in rows]

    async def get_recent_sessions(self, limit: int = 50) -> List[Dict[str, Any]]:
        query = "SELECT * FROM agent_runs ORDER BY start_time DESC LIMIT ?"
        try:
            return await self._execute_query(query, (limit,))
        except Exception:
            return []

    async def get_session_detail(self, run_id: str) -> Dict[str, Any]:
        query = "SELECT * FROM agent_runs WHERE id = ?"
        try:
            res = await self._execute_query(query, (run_id,))
            return res[0] if res else {}
        except Exception:
            return {}

    async def search_sessions(self, search_query: str, limit: int = 50) -> List[Dict[str, Any]]:
        query = """
        SELECT DISTINCT ar.*
        FROM agent_runs ar
        LEFT JOIN agent_logs al ON ar.id = al.run_id
        LEFT JOIN tasks t ON ar.id = t.run_id
        LEFT JOIN agent_messages am ON t.id = am.task_id
        WHERE am.content LIKE ? OR al.message LIKE ?
        ORDER BY ar.start_time DESC LIMIT ?
        """
        try:
            like_q = f"%{search_query}%"
            return await self._execute_query(query, (like_q, like_q, limit))
        except Exception:
            return []

    async def get_messages(self, run_id: str, limit: int = 100) -> List[Dict[str, Any]]:
        query = """
        SELECT timestamp, role, content, tool_name, token_cost FROM (
            SELECT
                am.ts as timestamp,
                CASE WHEN am.from_agent = 'user' THEN 'user' ELSE 'assistant' END as role,
                am.content,
                NULL as tool_name,
                NULL as token_cost
            FROM agent_messages am
            JOIN tasks t ON am.task_id = t.id
            WHERE t.run_id = ?
            
            UNION ALL
            
            SELECT
                timestamp,
                'tool' as role,
                message as content,
                tool_name,
                token_cost
            FROM agent_logs
            WHERE run_id = ? AND tool_name IS NOT NULL
        )
        ORDER BY timestamp ASC LIMIT ?
        """
        try:
            return await self._execute_query(query, (run_id, run_id, limit))
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
