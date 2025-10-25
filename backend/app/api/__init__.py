"""FastAPI router definitions."""

from fastapi import APIRouter

from .risk_assessment import router as risk_assessment_router

api_router = APIRouter()
api_router.include_router(risk_assessment_router)

__all__ = ["api_router"]

