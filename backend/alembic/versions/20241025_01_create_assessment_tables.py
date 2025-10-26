"""create assessment tables

Revision ID: 20241025_01
Revises: 
Create Date: 2025-10-25 17:50:00.000000
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa


revision = "20241025_01"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("external_id", sa.String(length=255), nullable=True, unique=True),
        sa.Column("full_name", sa.String(length=255), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        "assessments",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), nullable=True),
        sa.Column("level_code", sa.String(length=64), nullable=False),
        sa.Column("level_label", sa.String(length=64), nullable=False),
        sa.Column("risk_factor_count", sa.Integer(), nullable=False),
        sa.Column("payload", sa.JSON(), nullable=False),
        sa.Column("result", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="SET NULL"),
    )
    op.create_index("ix_assessments_id", "assessments", ["id"], unique=False)

    op.create_table(
        "assessment_factors",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("assessment_id", sa.Integer(), nullable=False),
        sa.Column("code", sa.String(length=128), nullable=False),
        sa.Column("label", sa.String(length=255), nullable=False),
        sa.Column("present", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.ForeignKeyConstraint(["assessment_id"], ["assessments.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_assessment_factors_assessment_id", "assessment_factors", ["assessment_id"])


def downgrade() -> None:
    op.drop_index("ix_assessment_factors_assessment_id", table_name="assessment_factors")
    op.drop_table("assessment_factors")
    op.drop_index("ix_assessments_id", table_name="assessments")
    op.drop_table("assessments")
    op.drop_table("users")

