"""Service layer interfaces and placeholder implementations."""

from .risk_assessment import (
    DummyRiskAssessmentService,
    RiskAssessmentServiceProtocol,
    get_risk_assessment_service,
)

__all__ = [
    "DummyRiskAssessmentService",
    "RiskAssessmentServiceProtocol",
    "get_risk_assessment_service",
]

