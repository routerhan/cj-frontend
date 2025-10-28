"""Pydantic models for administrator authentication."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator


class AdminProfile(BaseModel):
    """代表管理者基本資訊。"""

    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

    id: int
    email: str
    lastLoginAt: Optional[datetime] = Field(
        default=None,
        alias="lastLoginAt",
        serialization_alias="lastLoginAt",
        validation_alias="last_login_at",
    )
    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        value = value.strip()
        if "@" not in value:
            raise ValueError("電子郵件格式不正確")
        return value.lower()


class AdminLoginRequest(BaseModel):
    """登入表單資料。"""

    email: str = Field(description="管理者登入信箱")
    password: str = Field(min_length=8, max_length=128, description="登入密碼")
    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        value = value.strip()
        if "@" not in value:
            raise ValueError("電子郵件格式不正確")
        return value.lower()


class AdminLoginResponse(BaseModel):
    """登入成功後回傳的 token 與管理者資訊。"""

    accessToken: str = Field(description="JWT access token")
    tokenType: str = Field(default="Bearer", description="授權標頭的 token 類型")
    expiresIn: int = Field(description="token 有效時間（秒）")
    admin: AdminProfile
