"""add admin accounts table

Revision ID: 20250208_02
Revises: 20241025_01
Create Date: 2025-02-08 12:00:00.000000
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa


revision = "20250208_02"
down_revision = "20241025_01"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "admin_accounts",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("email", sa.String(length=255), nullable=False, unique=True),
        sa.Column("hashed_password", sa.String(length=255), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("last_login_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_admin_accounts_email", "admin_accounts", ["email"], unique=True)


def downgrade() -> None:
    op.drop_index("ix_admin_accounts_email", table_name="admin_accounts")
    op.drop_table("admin_accounts")
