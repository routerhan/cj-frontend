"""SQLAlchemy session and base configuration."""

from __future__ import annotations

import os
from contextlib import contextmanager
from pathlib import Path
from typing import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, declarative_base, sessionmaker

BACKEND_DIR = Path(__file__).resolve().parents[2]
PROJECT_ROOT = BACKEND_DIR.parent
DEFAULT_SQLITE_PATH = BACKEND_DIR / "app.db"


def _normalize_sqlite_url(url: str) -> str:
    """Convert relative SQLite URLs to absolute paths under the project root."""

    prefix = "sqlite:///"
    if not url.startswith(prefix):
        return url

    path_part = url[len(prefix) :]
    if path_part.startswith("./"):
        normalized_path = (PROJECT_ROOT / path_part[2:]).resolve()
        return f"{prefix}{normalized_path}"

    return url


DATABASE_URL = _normalize_sqlite_url(os.getenv("DATABASE_URL", f"sqlite:///{DEFAULT_SQLITE_PATH}"))

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True,
    future=True,
)

SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False, future=True)

Base = declarative_base()


def get_session() -> Generator[Session, None, None]:
    """FastAPI dependency that yields a database session."""

    session = SessionLocal()
    try:
        yield session
        session.commit()
    except Exception:  # pragma: no cover - rollback should always happen
        session.rollback()
        raise
    finally:
        session.close()


@contextmanager
def session_scope() -> Generator[Session, None, None]:
    """Provide a transactional scope for scripts or CLI usage."""

    session = SessionLocal()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()
