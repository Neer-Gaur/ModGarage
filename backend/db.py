"""SQL database client instance supporting SQLite locally and Postgres in production."""
import os
import json
import re

_db = None

class Database:
    def __init__(self, dsn: str):
        self.dsn = dsn
        self.is_sqlite = dsn.startswith("sqlite")
        self._pool = None  # asyncpg pool
        self._conn = None  # aiosqlite connection

    async def connect(self):
        if self.is_sqlite:
            import aiosqlite
            db_path = self.dsn.replace("sqlite:///", "")
            if not os.path.isabs(db_path):
                from pathlib import Path
                db_path = str(Path(__file__).parent / db_path)
            self._conn = await aiosqlite.connect(db_path)
            self._conn.row_factory = aiosqlite.Row
        else:
            import asyncpg
            self._pool = await asyncpg.create_pool(self.dsn)

    async def close(self):
        if self.is_sqlite and self._conn:
            await self._conn.close()
            self._conn = None
        elif self._pool:
            await self._pool.close()
            self._pool = None

    def _convert_query(self, sql: str) -> str:
        """Converts Postgres style $1, $2 and ILIKE queries to SQLite style if needed."""
        if self.is_sqlite:
            # Replace $1, $2 with ?
            sql = re.sub(r'\$\d+', '?', sql)
            sql = sql.replace("ILIKE", "LIKE")
        return sql

    def _process_args(self, args: tuple) -> list:
        processed = []
        for arg in args:
            if self.is_sqlite and isinstance(arg, (list, dict)):
                processed.append(json.dumps(arg))
            else:
                processed.append(arg)
        return processed

    def _process_row(self, row: dict | None) -> dict | None:
        if not row:
            return row
        row = dict(row)
        if self.is_sqlite:
            json_cols = {"images", "specs", "fitment", "tags", "product_ids", "products_snapshot"}
            for col in json_cols:
                if col in row and isinstance(row[col], str):
                    try:
                        row[col] = json.loads(row[col])
                    except Exception:
                        pass
        # Ensure booleans are typed correctly
        for col in ["onboarded", "in_stock", "exclude_install"]:
            if col in row and row[col] is not None:
                row[col] = bool(row[col])
        return row

    async def execute(self, query: str, *args):
        processed_query = self._convert_query(query)
        processed_args = self._process_args(args)
        if self.is_sqlite:
            async with self._conn.execute(processed_query, processed_args) as cursor:
                await self._conn.commit()
                return cursor.rowcount
        else:
            async with self._pool.acquire() as conn:
                return await conn.execute(query, *args)

    async def fetch(self, query: str, *args) -> list[dict]:
        processed_query = self._convert_query(query)
        processed_args = self._process_args(args)
        if self.is_sqlite:
            async with self._conn.execute(processed_query, processed_args) as cursor:
                rows = await cursor.fetchall()
                return [self._process_row(r) for r in rows]
        else:
            async with self._pool.acquire() as conn:
                rows = await conn.fetch(query, *args)
                return [self._process_row(r) for r in rows]

    async def fetchrow(self, query: str, *args) -> dict | None:
        processed_query = self._convert_query(query)
        processed_args = self._process_args(args)
        if self.is_sqlite:
            async with self._conn.execute(processed_query, processed_args) as cursor:
                row = await cursor.fetchone()
                return self._process_row(row)
        else:
            async with self._pool.acquire() as conn:
                row = await conn.fetchrow(query, *args)
                return self._process_row(row)


def init_db() -> None:
    pass


def get_db():
    global _db
    if _db is None:
        dsn = os.environ.get("DATABASE_URL", "sqlite:///mod_syndicate.db")
        _db = Database(dsn)
    return _db


async def close_db() -> None:
    global _db
    if _db is not None:
        await _db.close()
        _db = None
