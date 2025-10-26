"""Unit tests for the risk assessment service logic."""

from datetime import datetime

from app.schemas import RiskAssessmentRequest, RiskLevelCodeEnum
from app.services import RiskAssessmentService


def _build_request(**overrides) -> RiskAssessmentRequest:
    """Helper to construct request payload with sensible defaults."""

    base_payload = {
        "age": 55,
        "gender": "male",
        "is_male": True,
        "has_hypertension": False,
        "family_history_early_chd": False,
        "hdl_c": 50,
        "is_smoker": False,
        "metabolic_syndrome_factors": 0,
        "has_diabetes": False,
        "has_ckd": False,
        "ldl_c": 100,
        "cac_score": 0,
        "has_ascvd_history": False,
        "has_significant_plaque": False,
        "has_cad": False,
        "mi_within_1_year": False,
        "mi_history_count": 0,
        "has_multivessel_obstruction": False,
        "has_acs_with_diabetes": False,
        "has_pad": False,
        "has_carotid_stenosis": False,
        "has_stroke_with_atherosclerosis": False,
        "waist_cm": 80,
        "systolic": 120,
        "diastolic": 75,
        "fasting_glucose": 95,
        "triglyceride": 110,
        "hypertension_medication": False,
        "diabetes_medication": False,
        "lipid_medication": False,
        "egfr": 95,
    }
    base_payload.update(overrides)
    return RiskAssessmentRequest.model_validate(base_payload)


def test_extremely_high_risk_detects_priority_rules(risk_service: RiskAssessmentService):
    payload = _build_request(
        has_cad=True,
        mi_within_1_year=True,
        metabolic_syndrome_factors=4,
    )

    result = risk_service.evaluate(payload)

    assert result.levelCode is RiskLevelCodeEnum.EXTREMELY_HIGH
    assert any(rule.code == "cad_recent_mi" for rule in result.matchedRules)
    assert result.recommendations, "應提供極高風險建議清單"


def test_very_high_risk_when_ascvd_history(risk_service: RiskAssessmentService):
    payload = _build_request(
        has_ascvd_history=True,
        is_male=False,
        gender="female",
        age=60,
    )

    result = risk_service.evaluate(payload)

    assert result.levelCode is RiskLevelCodeEnum.VERY_HIGH
    assert [rule.code for rule in result.matchedRules] == ["ascvd_history"]
    assert result.level == "非常高"


def test_high_risk_for_diabetes_rule(risk_service: RiskAssessmentService):
    payload = _build_request(
        has_diabetes=True,
        fasting_glucose=160,
        diabetes_medication=True,
        metabolic_syndrome_factors=3,
    )

    result = risk_service.evaluate(payload)

    assert result.levelCode is RiskLevelCodeEnum.HIGH
    assert [rule.code for rule in result.matchedRules] == ["diabetes"]
    assert result.metabolicSyndrome.count >= 1
    assert result.metabolicSyndrome.components.elevatedGlucose is True
    assert result.riskFactorCount >= 1
    # 確保時間戳是 ISO 格式
    datetime.fromisoformat(result.evaluatedAt)
