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
        "cac_ge_400": None,
        "has_ascvd_history": False,
        "has_significant_plaque": False,
        "has_cad": False,
        "mi_within_1_year": False,
        "mi_history_count": 0,
        "has_multivessel_obstruction": False,
        "has_pad": False,
        "has_carotid_stenosis": False,
        "waist_cm": 80,
        "systolic": 120,
        "diastolic": 75,
        "fasting_glucose": 95,
        "triglyceride": 110,
        "hypertension_medication": False,
        "diabetes_medication": False,
        "lipid_medication": False,
        "egfr": 95,
        "uacr": 10,
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


def test_extremely_high_for_pad_with_carotid(risk_service: RiskAssessmentService):
    payload = _build_request(
        has_pad=True,
        has_carotid_stenosis=True,
    )

    result = risk_service.evaluate(payload)

    assert result.levelCode is RiskLevelCodeEnum.EXTREMELY_HIGH
    assert [rule.code for rule in result.matchedRules] == ["pad_with_carotid"]


def test_high_risk_for_ckd_rule(risk_service: RiskAssessmentService):
    payload = _build_request(
        has_ckd=True,
        egfr=45,
        uacr=220,
    )

    result = risk_service.evaluate(payload)

    assert result.levelCode is RiskLevelCodeEnum.HIGH
    assert [rule.code for rule in result.matchedRules] == ["ckd"]


def test_high_risk_for_cac_score_rule(risk_service: RiskAssessmentService):
    payload = _build_request(
        age=42,
        cac_ge_400=True,
        has_hypertension=False,
        metabolic_syndrome_factors=0,
    )

    result = risk_service.evaluate(payload)

    assert result.levelCode is RiskLevelCodeEnum.HIGH
    assert [rule.code for rule in result.matchedRules] == ["cac_400"]


def test_medium_risk_when_two_risk_factors(risk_service: RiskAssessmentService):
    payload = _build_request(
        age=40,
        systolic=135,
        diastolic=82,
        has_hypertension=True,
        is_smoker=True,
        waist_cm=78,
        hdl_c=55,
        metabolic_syndrome_factors=0,
    )

    result = risk_service.evaluate(payload)

    assert result.levelCode is RiskLevelCodeEnum.MEDIUM
    assert [rule.code for rule in result.matchedRules] == ["risk_factor_count"]
    assert result.riskFactorCount == 2


def test_low_risk_when_single_factor(risk_service: RiskAssessmentService):
    payload = _build_request(
        age=40,
        is_smoker=True,
        has_hypertension=False,
        systolic=120,
        diastolic=75,
        metabolic_syndrome_factors=0,
    )

    result = risk_service.evaluate(payload)

    assert result.levelCode is RiskLevelCodeEnum.LOW
    assert [rule.code for rule in result.matchedRules] == ["single_risk_factor"]
    assert result.riskFactorCount == 1


def test_undefined_when_no_risk_factors(risk_service: RiskAssessmentService):
    payload = _build_request(
        age=30,
        is_male=False,
        gender="female",
        has_hypertension=False,
        systolic=110,
        diastolic=70,
        hdl_c=60,
        ldl_c=90,
        waist_cm=70,
        fasting_glucose=85,
        triglyceride=90,
        metabolic_syndrome_factors=0,
        is_smoker=False,
    )

    result = risk_service.evaluate(payload)

    assert result.levelCode is RiskLevelCodeEnum.UNDEFINED
    assert result.matchedRules == []
    assert result.riskFactorCount == 0


def test_recalculate_metabolic_syndrome_from_measurements(risk_service: RiskAssessmentService):
    payload = _build_request(
        age=38,
        waist_cm=95,
        hdl_c=35,
        triglyceride=220,
        systolic=125,
        diastolic=80,
        metabolic_syndrome_factors=None,
    )

    result = risk_service.evaluate(payload)

    assert result.metabolicSyndrome.count == 3
    assert result.metabolicSyndrome.components.abdominalObesity is True
    assert result.metabolicSyndrome.components.elevatedTriglyceride is True
    assert result.metabolicSyndrome.components.lowHdl is True


def test_risk_factors_list_only_core_items(risk_service: RiskAssessmentService):
    payload = _build_request(
        age=60,
        is_male=False,
        gender="female",
        has_hypertension=True,
        family_history_early_chd=True,
        hdl_c=35,
        is_smoker=True,
        metabolic_syndrome_factors=4,
        systolic=135,
        triglyceride=220,
    )

    result = risk_service.evaluate(payload)

    expected_codes = {
        "hypertension",
        "age",
        "family_history",
        "low_hdl",
        "smoking",
        "metabolic_syndrome",
    }
    assert {factor.code for factor in result.riskFactors} == expected_codes
    metabolic_factor = next(f for f in result.riskFactors if f.code == "metabolic_syndrome")
    assert metabolic_factor.present is True
