import asyncpg
from pgvector.asyncpg import register_vector
from fastapi import Request


async def create_pool(database_url: str) -> asyncpg.Pool:
    """Create the asyncpg connection pool and register the pgvector codec."""
    async def init(conn: asyncpg.Connection):
        await register_vector(conn)

    pool = await asyncpg.create_pool(
        database_url,
        min_size=2,
        max_size=10,
        init=init,
    )
    return pool


async def get_db(request: Request) -> asyncpg.Connection:
    """FastAPI dependency: yields one connection from the pool per request."""
    async with request.app.state.pool.acquire() as conn:
        yield conn
