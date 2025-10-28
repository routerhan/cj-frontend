"""Common FastAPI dependencies for the API layer."""

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.models import AdminAccount
from app.services import AdminAuthService, get_admin_auth_service


bearer_scheme = HTTPBearer(auto_error=False)


def get_current_admin(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    auth_service: AdminAuthService = Depends(get_admin_auth_service),
) -> AdminAccount:
    """Decode Authorization header and return the current admin."""

    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header is required.",
        )

    token = credentials.credentials
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header is required.",
        )

    return auth_service.get_admin_from_token(token)
