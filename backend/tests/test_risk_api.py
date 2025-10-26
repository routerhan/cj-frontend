"""Integration tests for the risk assessment API endpoint."""

from fastapi.testclient import TestClient
from sqlalchemy import select

from app.models import Assessment, AssessmentFactor


def test_api_returns_medium_level_when_two_risk_factors(client: TestClient, db_session):
    payload = {
        "age": 60,
        "gender": "male",
        "is_male": True,
        "has_hypertension": True,
        "family_history_early_chd": True,
        "hdl_c": 55,
        "is_smoker": False,
        "metabolic_syndrome_factors": 2,
        "has_diabetes": False,
        "has_ckd": False,
        "ldl_c": 120,
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
        "waist_cm": 88,
        "systolic": 128,
        "diastolic": 82,
        "fasting_glucose": 95,
        "triglyceride": 120,
        "hypertension_medication": False,
        "diabetes_medication": False,
        "lipid_medication": False,
        "egfr": 98,
    }

    response = client.post("/api/risk-assessment", json=payload)

    assert response.status_code == 200
    data = response.json()
    assert data["levelCode"] == "medium"
    assert data["riskFactorCount"] >= 2
    assert data["metabolicSyndrome"]["components"]["elevatedBloodPressure"] is False
    assert data["matchedRules"][0]["code"] == "risk_factor_count"

    stmt = select(Assessment).order_by(Assessment.id.desc())
    persisted = db_session.execute(stmt).scalars().first()
    assert persisted is not None
    assert persisted.level_code == "medium"
    assert persisted.risk_factor_count == data["riskFactorCount"]
    factors = db_session.execute(
        select(AssessmentFactor).where(AssessmentFactor.assessment_id == persisted.id)
    ).scalars().all()
    assert len(factors) == len(data["riskFactors"])


def test_api_validation_error_for_invalid_age(client: TestClient):
    payload = {
        "age": -5,
        "gender": "male",
        "is_male": True,
        "has_hypertension": False,
        "family_history_early_chd": False,
        "hdl_c": 55,
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
        "diastolic": 80,
        "fasting_glucose": 90,
        "triglyceride": 120,
        "hypertension_medication": False,
        "diabetes_medication": False,
        "lipid_medication": False,
        "egfr": 100,
    }

    response = client.post("/api/risk-assessment", json=payload)

    assert response.status_code == 422
    detail = response.json()["detail"]
    assert any(item["loc"][-1] == "age" for item in detail)


def test_admin_dashboard_lists_recent_assessments(client: TestClient):
    """確保儀表板 API 可回傳統計與評估紀錄。"""

    base_payload = {
        "age": 60,
        "gender": "male",
        "is_male": True,
        "has_hypertension": True,
        "family_history_early_chd": True,
        "hdl_c": 45,
        "is_smoker": False,
        "metabolic_syndrome_factors": 2,
        "has_diabetes": False,
        "has_ckd": False,
        "ldl_c": 150,
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
        "waist_cm": 88,
        "systolic": 135,
        "diastolic": 86,
        "fasting_glucose": 105,
        "triglyceride": 150,
        "hypertension_medication": True,
        "diabetes_medication": False,
        "lipid_medication": True,
        "egfr": 95,
    }

    client.post("/api/risk-assessment", json=base_payload)
    second_payload = {**base_payload, "ldl_c": 190, "has_diabetes": True}
    client.post("/api/risk-assessment", json=second_payload)

    response = client.get("/api/admin/assessments?limit=5")
    assert response.status_code == 200

    data = response.json()
    assert data["stats"]["totalAssessments"] >= 2
    assert data["stats"]["byLevel"]["high"] >= 1
    assert len(data["assessments"]) >= 2

    first_record = data["assessments"][0]
    assert "payload" in first_record
    assert first_record["riskFactors"]
    assert first_record["matchedRules"]
