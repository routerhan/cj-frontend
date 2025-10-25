"""風險評估服務層介面與暫時性的 placeholder 實作。"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Protocol

from ..schemas import (
    MetabolicSyndromeResult,
    RiskAssessmentRequest,
    RiskAssessmentResponse,
    RiskLevelCodeEnum,
)


class RiskAssessmentServiceProtocol(Protocol):
    """定義風險評估服務所需實作的介面，供路由層依賴注入。"""

    def evaluate(self, payload: RiskAssessmentRequest) -> RiskAssessmentResponse:
        """依據輸入資料回傳風險評估結果。"""


class DummyRiskAssessmentService(RiskAssessmentServiceProtocol):
    """尚未導入實際商業邏輯前的暫時性實作。"""

    def evaluate(self, payload: RiskAssessmentRequest) -> RiskAssessmentResponse:
        # TODO: 後續票券會以真實 evaluateRiskAssessment 邏輯取代。
        return RiskAssessmentResponse(
            level="未定義",
            levelCode=RiskLevelCodeEnum.UNDEFINED,
            matchedRules=[],
            riskFactorCount=0,
            riskFactors=[],
            metabolicSyndrome=MetabolicSyndromeResult(),
            recommendations=[],
            evaluatedAt=datetime.now(timezone.utc).isoformat(),
        )


def get_risk_assessment_service() -> RiskAssessmentServiceProtocol:
    """FastAPI 依賴注入入口，目前回傳暫時性服務實例。"""

    return DummyRiskAssessmentService()

