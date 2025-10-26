"""Pytest fixtures for backend tests."""

from typing import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app import models  # noqa: F401  # ensure models are registered with metadata
from app.db import Base, get_session
from app.main import create_app
from app.services import RiskAssessmentService


@pytest.fixture
def db_engine():
    """Create an in-memory SQLite engine for tests."""

    engine = create_engine(
        "sqlite://",
        future=True,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    yield engine
    engine.dispose()


@pytest.fixture
def db_session(db_engine) -> Generator[Session, None, None]:
    """Yield a transactional session tied to the test engine."""

    TestingSessionLocal = sessionmaker(bind=db_engine, autoflush=False, autocommit=False, future=True)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def app(db_session):
    """Return a FastAPI app instance for testing with overridden DB session."""

    application = create_app()

    def override_get_session():
        try:
            yield db_session
        finally:
            db_session.rollback()

    application.dependency_overrides[get_session] = override_get_session
    return application


@pytest.fixture
def client(app) -> Generator[TestClient, None, None]:
    """Provide a TestClient with risk assessment service wired."""

    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def risk_service() -> RiskAssessmentService:
    """Provide a real risk assessment service instance without persistence."""

    return RiskAssessmentService()
