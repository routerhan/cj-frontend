"""Authentication service for administrator accounts."""

from __future__ import annotations

import os
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_session
from app.models import AdminAccount

from app.services.security import (
    create_access_token,
    decode_access_token,
    verify_password,
)


class AdminAuthService:
    """Encapsulates admin authentication and token issuance."""

    def __init__(
        self,
        session: Session,
        secret: str,
        token_ttl_minutes: int,
    ) -> None:
        if not secret:
            raise RuntimeError("ADMIN_JWT_SECRET is not configured.")

        self.session = session
        self.secret = secret
        self.token_ttl = timedelta(minutes=token_ttl_minutes)

    @property
    def token_ttl_seconds(self) -> int:
        """Return token TTL in seconds."""

        return int(self.token_ttl.total_seconds())

    def authenticate(self, email: str, password: str) -> AdminAccount:
        """Validate credentials and return the admin account."""

        normalized_email = email.strip().lower()
        stmt = select(AdminAccount).where(AdminAccount.email == normalized_email)
        admin = self.session.execute(stmt).scalar_one_or_none()

        if admin is None or not verify_password(password, admin.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password.",
            )

        if not admin.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Administrator account is disabled.",
            )

        admin.last_login_at = datetime.now(timezone.utc)
        self.session.add(admin)
        # commit will be handled by FastAPI dependency, but flush ensures value persists for response
        self.session.flush()
        return admin

    def issue_token(self, admin: AdminAccount) -> str:
        """Create an access token for the authenticated admin."""

        return create_access_token(
            subject=str(admin.id),
            secret=self.secret,
            expires_delta=self.token_ttl,
            additional_claims={"email": admin.email},
        )

    def get_admin_from_token(self, token: str) -> AdminAccount:
        """Decode token and fetch corresponding admin."""

        try:
            payload = decode_access_token(token=token, secret=self.secret)
        except ValueError as exc:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired token.",
            ) from exc

        subject = payload.get("sub")
        if subject is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token subject.",
            )

        try:
            admin_id = int(subject)
        except ValueError as exc:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token subject.",
            ) from exc

        admin: Optional[AdminAccount] = self.session.get(AdminAccount, admin_id)
        if admin is None or not admin.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Administrator not found or inactive.",
            )

        return admin


def _get_secret() -> str:
    return os.getenv("ADMIN_JWT_SECRET", "")


def _get_token_ttl_minutes() -> int:
    raw_value = os.getenv("ADMIN_TOKEN_TTL_MINUTES", "60")
    try:
        minutes = int(raw_value)
    except ValueError as exc:
        raise RuntimeError("ADMIN_TOKEN_TTL_MINUTES must be an integer.") from exc
    return max(minutes, 1)


def get_admin_auth_service(
    session: Session = Depends(get_session),
) -> AdminAuthService:
    """FastAPI dependency for auth service."""

    return AdminAuthService(
        session=session,
        secret=_get_secret(),
        token_ttl_minutes=_get_token_ttl_minutes(),
    )
