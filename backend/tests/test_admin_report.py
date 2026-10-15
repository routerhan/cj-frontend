"""Tests for the admin statistics report endpoints."""

from datetime import datetime, timezone

from fastapi.testclient import TestClient

from app.models import Assessment


def _login_and_get_token(client: TestClient, credentials: dict[str, str]) -> str:
    response = client.post("/api/admin/login", json=credentials)
    assert response.status_code == 200
    return response.json()["accessToken"]


def _add_assessment(db_session, level_code: str, created_at: datetime) -> None:
    db_session.add(
        Assessment(
            user_id=None,
            level_code=level_code,
            level_label=level_code,
            risk_factor_count=0,
            payload={},
            result={},
            created_at=created_at,
        )
    )


def test_report_counts_levels_and_fills_empty_months(
    client: TestClient,
    db_session,
    admin_account,
    admin_credentials,
):
    """報告需回傳總數、各層級次數，以及連續月份（含 0 筆月份）。"""

    _add_assessment(db_session, "high", datetime(2026, 1, 10, tzinfo=timezone.utc))
    _add_assessment(db_session, "low", datetime(2026, 1, 20, tzinfo=timezone.utc))
    _add_assessment(db_session, "undefined", datetime(2026, 3, 5, tzinfo=timezone.utc))
    db_session.commit()

    token = _login_and_get_token(client, admin_credentials)
    response = client.get(
        "/api/admin/report", headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200

    data = response.json()
    assert data["totalAssessments"] == 3
    assert data["byLevel"]["high"] == 1
    assert data["byLevel"]["low"] == 1
    assert data["byLevel"]["undefined"] == 1
    assert data["byLevel"]["medium"] == 0
    assert data["monthly"] == [
        {"month": "2026-01", "count": 2},
        {"month": "2026-02", "count": 0},
        {"month": "2026-03", "count": 1},
    ]
    assert data["firstAssessmentAt"].startswith("2026-01-10T00:00:00")
    assert data["firstAssessmentAt"].endswith(("Z", "+00:00"))


def test_report_buckets_months_in_taiwan_time(
    client: TestClient,
    db_session,
    admin_account,
    admin_credentials,
):
    """UTC 1/31 20:00 在台灣已是 2/1，應計入 2 月。"""

    _add_assessment(db_session, "low", datetime(2026, 1, 31, 20, 0, tzinfo=timezone.utc))
    db_session.commit()

    token = _login_and_get_token(client, admin_credentials)
    data = client.get(
        "/api/admin/report", headers={"Authorization": f"Bearer {token}"}
    ).json()

    assert data["monthly"] == [{"month": "2026-02", "count": 1}]


def test_report_with_no_data_returns_empty_months(
    client: TestClient,
    admin_account,
    admin_credentials,
):
    token = _login_and_get_token(client, admin_credentials)
    data = client.get(
        "/api/admin/report", headers={"Authorization": f"Bearer {token}"}
    ).json()

    assert data["totalAssessments"] == 0
    assert data["monthly"] == []
    assert data["firstAssessmentAt"] is None


def test_report_requires_admin_token(client: TestClient):
    response = client.get("/api/admin/report")
    assert response.status_code == 401


def test_report_page_is_served(client: TestClient):
    response = client.get("/api/admin/report-view")
    assert response.status_code == 200
    assert "統計報告" in response.text


def test_export_csv_contains_all_records_with_bom(
    client: TestClient,
    db_session,
    admin_account,
    admin_credentials,
):
    """CSV 匯出需含 BOM、表頭與每一筆紀錄，且時間轉為台灣時間。"""

    db_session.add(
        Assessment(
            user_id=None,
            level_code="high",
            level_label="高",
            risk_factor_count=1,
            payload={"age": 60, "is_smoker": True, "is_male": True},
            result={
                "riskFactors": [{"code": "smoker", "label": "吸菸", "present": True}],
                "matchedRules": [],
                "metabolicSyndrome": {"count": 1, "components": {"lowHdl": True}},
            },
            created_at=datetime(2026, 1, 10, 20, 0, tzinfo=timezone.utc),
        )
    )
    _add_assessment(db_session, "low", datetime(2026, 1, 20, tzinfo=timezone.utc))
    db_session.commit()

    token = _login_and_get_token(client, admin_credentials)
    response = client.get(
        "/api/admin/assessments/export.csv",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/csv")
    assert "attachment" in response.headers["content-disposition"]

    text = response.content.decode("utf-8")
    assert text.startswith("﻿")
    lines = text.lstrip("﻿").strip().splitlines()
    assert len(lines) == 3
    assert lines[0].startswith("編號,填寫時間（台灣）,風險層級")
    assert "2026-01-11 04:00" in lines[2]
    assert "吸菸" in lines[2] and "HDL-C 偏低" in lines[2] and ",是," in lines[2]


def test_export_csv_requires_auth(client: TestClient):
    response = client.get("/api/admin/assessments/export.csv")
    assert response.status_code == 401
