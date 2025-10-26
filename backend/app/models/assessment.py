"""Database models for risk assessments and related factors."""

from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import (
    JSON,
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class Assessment(Base):
    """Persists each risk assessment payload and computed result."""

    __tablename__ = "assessments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[Optional[int]] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    level_code: Mapped[str] = mapped_column(String(64), nullable=False)
    level_label: Mapped[str] = mapped_column(String(64), nullable=False)
    risk_factor_count: Mapped[int] = mapped_column(Integer, nullable=False)
    payload: Mapped[dict] = mapped_column(JSON, nullable=False)
    result: Mapped[dict] = mapped_column(JSON, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    user = relationship("User", back_populates="assessments")
    factors = relationship(
        "AssessmentFactor",
        back_populates="assessment",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )


class AssessmentFactor(Base):
    """Stores each risk factor outcome for a given assessment."""

    __tablename__ = "assessment_factors"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    assessment_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("assessments.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    code: Mapped[str] = mapped_column(String(128), nullable=False)
    label: Mapped[str] = mapped_column(String(255), nullable=False)
    present: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    assessment = relationship("Assessment", back_populates="factors")
