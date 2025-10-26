"""Data access helpers for risk assessments."""

from __future__ import annotations

from typing import Iterable

from sqlalchemy.orm import Session

from app.models import Assessment, AssessmentFactor
from app.schemas import RiskAssessmentRequest, RiskAssessmentResponse


class AssessmentRepository:
    """Encapsulates CRUD operations for assessments and related entities."""

    def __init__(self, session: Session):
        self.session = session

    def create_assessment(
        self,
        payload: RiskAssessmentRequest,
        response: RiskAssessmentResponse,
    ) -> Assessment:
        """Persist the payload, result, and factor breakdown."""

        assessment = Assessment(
            user_id=None,
            level_code=response.levelCode.value,
            level_label=response.level,
            risk_factor_count=response.riskFactorCount,
            payload=payload.model_dump(mode="json"),
            result=response.model_dump(mode="json"),
        )
        try:
            self.session.add(assessment)
            self.session.flush()

            factors = [
                AssessmentFactor(
                    assessment_id=assessment.id,
                    code=item.code,
                    label=item.label,
                    present=item.present,
                )
                for item in response.riskFactors
            ]
            if factors:
                self.session.add_all(factors)

            self.session.commit()
            self.session.refresh(assessment)
            return assessment
        except Exception:
            self.session.rollback()
            raise

    def list_factors(self, assessment: Assessment) -> Iterable[AssessmentFactor]:
        """Return all factors associated with an assessment."""

        return assessment.factors
