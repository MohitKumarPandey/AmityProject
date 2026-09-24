import asyncio
import os
import sys

from alembic import context
from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config

# Add backend directory to Python path
sys.path.append(
    os.path.abspath(
        os.path.join(os.path.dirname(__file__), "..")
    )
)

from app.db import Base
from app.models.observation import ObservationORM

config = context.config

# Logging disabled because current alembic.ini
# does not contain standard logging sections.

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    url = os.getenv("DATABASE_URL") or config.get_main_option("sqlalchemy.url")

    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
    )


    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection) -> None:
    context.configure(
        connection=connection,
        target_metadata=target_metadata,
        compare_type=True,
    )

    with context.begin_transaction():
        context.run_migrations()


async def run_migrations_online() -> None:
    db_url = os.getenv("DATABASE_URL") or config.get_main_option("sqlalchemy.url")
    section = config.get_section(config.config_ini_section) or {}
    section["sqlalchemy.url"] = db_url

    try:
        connectable = async_engine_from_config(
            section,
            prefix="sqlalchemy.",
            poolclass=pool.NullPool,
        )
        async with connectable.connect() as connection:
            await connection.run_sync(do_run_migrations)
        await connectable.dispose()
    except Exception as e:
        print(f"PostgreSQL migration connection failed ({e}). Falling back to SQLite for local execution...")
        section["sqlalchemy.url"] = "sqlite+aiosqlite:///./citypulse.db"
        connectable = async_engine_from_config(
            section,
            prefix="sqlalchemy.",
            poolclass=pool.NullPool,
        )
        async with connectable.connect() as connection:
            await connection.run_sync(do_run_migrations)
        await connectable.dispose()




if context.is_offline_mode():
    run_migrations_offline()
else:
    asyncio.run(run_migrations_online())