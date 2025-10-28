"""Security helpers for password hashing and JWT handling."""

from __future__ import annotations

import base64
import hashlib
import hmac
import json
import os
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional


JWT_ALGORITHM = "HS256"
_DEFAULT_HASH_ITERATIONS = 120_000
_HASH_DELIMITER = "$"


def _b64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("utf-8")


def _b64url_decode(data: str) -> bytes:
    padding = "=" * (-len(data) % 4)
    return base64.urlsafe_b64decode(f"{data}{padding}")


def get_password_hash(password: str) -> str:
    """Generate a secure salted hash for the given password."""

    if not password:
        raise ValueError("Password cannot be empty.")

    salt = os.urandom(16)
    iterations = _DEFAULT_HASH_ITERATIONS
    derived_key = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt,
        iterations,
        dklen=32,
    )
    return _HASH_DELIMITER.join(
        [
            "pbkdf2_sha256",
            str(iterations),
            salt.hex(),
            derived_key.hex(),
        ]
    )


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify the provided password matches the stored hash."""

    try:
        algorithm, iteration_str, salt_hex, hash_hex = hashed_password.split(_HASH_DELIMITER)
        if algorithm != "pbkdf2_sha256":
            return False
        iterations = int(iteration_str)
        salt = bytes.fromhex(salt_hex)
        expected_hash = bytes.fromhex(hash_hex)
    except (ValueError, TypeError):
        return False

    derived_key = hashlib.pbkdf2_hmac(
        "sha256",
        plain_password.encode("utf-8"),
        salt,
        iterations,
        dklen=len(expected_hash),
    )
    return hmac.compare_digest(derived_key, expected_hash)


def create_access_token(
    *,
    subject: str,
    secret: str,
    expires_delta: Optional[timedelta] = None,
    additional_claims: Optional[Dict[str, Any]] = None,
) -> str:
    """Create a JWT for the given subject using HS256."""

    if expires_delta is None:
        expires_delta = timedelta(minutes=60)

    expire = datetime.now(timezone.utc) + expires_delta

    payload: Dict[str, Any] = {
        "exp": int(expire.timestamp()),
        "sub": subject,
    }
    if additional_claims:
        payload.update(additional_claims)

    header = {"alg": JWT_ALGORITHM, "typ": "JWT"}
    header_segment = _b64url_encode(json.dumps(header, separators=(",", ":"), ensure_ascii=False).encode("utf-8"))
    payload_segment = _b64url_encode(json.dumps(payload, separators=(",", ":"), ensure_ascii=False).encode("utf-8"))
    signing_input = f"{header_segment}.{payload_segment}".encode("utf-8")
    signature = hmac.new(secret.encode("utf-8"), signing_input, hashlib.sha256).digest()
    signature_segment = _b64url_encode(signature)

    return f"{header_segment}.{payload_segment}.{signature_segment}"


def decode_access_token(*, token: str, secret: str) -> Dict[str, Any]:
    """Decode and validate an HS256 JWT."""

    parts = token.split(".")
    if len(parts) != 3:
        raise ValueError("Token format is invalid.")

    header_segment, payload_segment, signature_segment = parts
    try:
        header = json.loads(_b64url_decode(header_segment))
        payload = json.loads(_b64url_decode(payload_segment))
    except (json.JSONDecodeError, ValueError) as exc:
        raise ValueError("Token payload is invalid.") from exc

    if header.get("alg") != JWT_ALGORITHM:
        raise ValueError("Unsupported token algorithm.")

    expected_signature = hmac.new(
        secret.encode("utf-8"),
        f"{header_segment}.{payload_segment}".encode("utf-8"),
        hashlib.sha256,
    ).digest()

    actual_signature = _b64url_decode(signature_segment)
    if not hmac.compare_digest(expected_signature, actual_signature):
        raise ValueError("Token signature mismatch.")

    exp = payload.get("exp")
    if exp is not None:
        expires_at = datetime.fromtimestamp(exp, tz=timezone.utc)
        if datetime.now(timezone.utc) >= expires_at:
            raise ValueError("Token has expired.")

    return payload
