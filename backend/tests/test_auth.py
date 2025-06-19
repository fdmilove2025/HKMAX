import pytest
from app.models import User
import pyotp


def test_register(client):
    response = client.post(
        "/api/auth/register",
        json={"username": "newuser", "email": "newuser@example.com", "password": "password123", "age": 25},
    )
    assert response.status_code == 201  # Registration returns 201
    data = response.get_json()
    assert "access_token" in data
    assert "user" in data
    assert data["user"]["username"] == "newuser"
    assert data["user"]["email"] == "newuser@example.com"


def test_login(client, test_user):
    response = client.post("/api/auth/login", json={"email": "test@example.com", "password": "password123"})
    assert response.status_code == 200
    data = response.get_json()
    assert "access_token" in data
    assert "user" in data
    assert data["user"]["username"] == "testuser"


def test_login_wrong_password(client, test_user):
    response = client.post("/api/auth/login", json={"email": "test@example.com", "password": "wrongpassword"})
    assert response.status_code == 401
    data = response.get_json()
    assert "error" in data


def test_get_user(client, auth_headers, test_user):
    response = client.get("/api/auth/user", headers=auth_headers)
    assert response.status_code == 200
    data = response.get_json()
    assert "user" in data
    assert data["user"]["username"] == "testuser"
    assert data["user"]["email"] == "test@example.com"


def test_get_user_unauthorized(client):
    response = client.get("/api/auth/user")
    assert response.status_code == 401


def test_enable_2fa(client, auth_headers, test_user):
    # First, generate 2FA
    response = client.post("/api/auth/generate-2fa", headers=auth_headers)
    assert response.status_code == 200
    data = response.get_json()
    assert "qr_code" in data
    assert "secret" in data

    # Generate a valid token using the secret
    secret = data["secret"]
    totp = pyotp.TOTP(secret)
    valid_token = totp.now()

    # Then verify and enable 2FA with the valid token
    response = client.post("/api/auth/verify-2fa", headers=auth_headers, json={"token": valid_token})
    assert response.status_code == 200
    data = response.get_json()
    assert "access_token" in data
    assert "user" in data
    assert data["user"]["is_two_factor_enabled"] is True


def test_disable_2fa(client, auth_headers_with_2fa, test_user_with_2fa):
    response = client.post("/api/auth/disable-2fa", headers=auth_headers_with_2fa, json={"password": "password123"})
    assert response.status_code == 200
    data = response.get_json()
    assert "message" in data
    assert "Two-factor authentication disabled successfully" in data["message"]


def test_disable_2fa_wrong_password(client, auth_headers_with_2fa):
    response = client.post("/api/auth/disable-2fa", headers=auth_headers_with_2fa, json={"password": "wrongpassword"})
    assert response.status_code == 401
    data = response.get_json()
    assert "error" in data


def test_update_profile(client, auth_headers, test_user):
    response = client.put(
        "/api/auth/profile/update",
        headers=auth_headers,
        json={
            "username": "updateduser",
            "email": "updated@example.com",
            "current_password": "password123",
            "new_password": "newpassword123",
        },
    )
    assert response.status_code == 200
    data = response.get_json()
    assert "user" in data
    assert data["user"]["username"] == "updateduser"
    assert data["user"]["email"] == "updated@example.com"


def test_update_profile_wrong_password(client, auth_headers):
    response = client.put(
        "/api/auth/profile/update",
        headers=auth_headers,
        json={
            "username": "updateduser",
            "email": "updated@example.com",
            "current_password": "wrongpassword",
            "new_password": "newpassword123",
        },
    )
    assert response.status_code == 401
    data = response.get_json()
    assert "error" in data
