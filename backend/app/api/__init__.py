"""FastAPI router definitions."""

from fastapi import APIRouter

from app.api.admin_auth import router as admin_auth_router
from app.api.risk_assessment import router as risk_assessment_router

api_router = APIRouter()
api_router.include_router(admin_auth_router)
api_router.include_router(risk_assessment_router)

__all__ = ["api_router"]
