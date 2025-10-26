"""Database model for system users."""

from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, Integer, String
from sqlalchemy.orm import relationship

from app.db.session import Base


class User(Base):
    """Represents an application user who submits risk assessments."""

    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    external_id = Column(String(255), nullable=True, unique=True)
    full_name = Column(String(255), nullable=True)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    assessments = relationship(
        "Assessment",
        back_populates="user",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
