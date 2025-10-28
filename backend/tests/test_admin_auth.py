"""Tests for admin authentication endpoints."""

from fastapi.testclient import TestClient


def test_admin_can_login(client: TestClient, admin_account, admin_credentials):
    response = client.post("/api/admin/login", json=admin_credentials)

    assert response.status_code == 200
    payload = response.json()
    assert payload["admin"]["email"] == admin_credentials["email"]
    assert payload["accessToken"]
    assert payload["tokenType"].lower() == "bearer"


def test_login_rejects_invalid_password(client: TestClient, admin_account, admin_credentials):
    response = client.post(
        "/api/admin/login",
        json={"email": admin_credentials["email"], "password": "WrongPass999"},
    )

    assert response.status_code == 401
    assert "detail" in response.json()


def test_protected_routes_require_authorization(
    client: TestClient,
    admin_account,
    admin_credentials,
):
    unauthorized = client.get("/api/admin/assessments")
    assert unauthorized.status_code == 401

    login = client.post("/api/admin/login", json=admin_credentials)
    token = login.json()["accessToken"]

    authorized = client.get(
        "/api/admin/assessments",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert authorized.status_code == 200


def test_fetch_current_admin_profile(
    client: TestClient,
    admin_account,
    admin_credentials,
):
    login = client.post("/api/admin/login", json=admin_credentials)
    token = login.json()["accessToken"]

    profile = client.get(
        "/api/admin/me",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert profile.status_code == 200
    assert profile.json()["email"] == admin_credentials["email"]
