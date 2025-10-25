"""`POST /api/risk-assessment` 路由定義。"""

from fastapi import APIRouter, Depends, status

from ..schemas import RiskAssessmentRequest, RiskAssessmentResponse
from ..services import RiskAssessmentServiceProtocol, get_risk_assessment_service

router = APIRouter(prefix="/api", tags=["risk-assessment"])


@router.post(
    "/risk-assessment",
    response_model=RiskAssessmentResponse,
    status_code=status.HTTP_200_OK,
)
async def create_risk_assessment(
    payload: RiskAssessmentRequest,
    service: RiskAssessmentServiceProtocol = Depends(get_risk_assessment_service),
) -> RiskAssessmentResponse:
    """
    接收前端送出的心血管風險評估資料，回傳符合契約的評估結果。

    目前透過暫時性的服務回傳假資料，後續會由實際商業邏輯替換。
    """

    return service.evaluate(payload)

