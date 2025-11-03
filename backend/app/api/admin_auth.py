"""Admin authentication endpoints."""

from fastapi import APIRouter, Depends, status

from app.models import AdminAccount
from app.schemas import AdminLoginRequest, AdminLoginResponse, AdminProfile
from app.services import AdminAuthService, get_admin_auth_service
from app.api.dependencies import get_current_admin


router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.post(
    "/login",
    response_model=AdminLoginResponse,
    status_code=status.HTTP_200_OK,
)
def login_admin(
    payload: AdminLoginRequest,
    auth_service: AdminAuthService = Depends(get_admin_auth_service),
) -> AdminLoginResponse:
    """Authenticate administrator and issue JWT token."""

    admin = auth_service.authenticate(payload.email, payload.password)
    token = auth_service.issue_token(admin)

    return AdminLoginResponse(
        accessToken=token,
        tokenType="Bearer",
        expiresIn=auth_service.token_ttl_seconds,
        admin=AdminProfile.model_validate(admin),
    )


@router.get(
    "/me",
    response_model=AdminProfile,
    status_code=status.HTTP_200_OK,
)
def get_profile(
    current_admin: AdminAccount = Depends(get_current_admin),
) -> AdminProfile:
    """Return the current authenticated administrator profile."""

    return AdminProfile.model_validate(current_admin)
