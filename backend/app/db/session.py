"""SQLAlchemy session and base configuration."""

from __future__ import annotations

import os
from contextlib import contextmanager
from typing import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, declarative_base, sessionmaker

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./app.db")

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
