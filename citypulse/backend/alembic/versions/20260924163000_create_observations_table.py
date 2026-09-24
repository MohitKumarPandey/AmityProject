"""create observations table

Revision ID: 20260924163000
Revises: 
Create Date: 2026-09-24 15:36:00.000000
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "20260924163000"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Create the ``observations`` table according to the ORM model."""
    op.create_table(
        "observations",
        sa.Column("id", sa.Integer, primary_key=True, index=True),
        sa.Column("city", sa.String, nullable=False),
        sa.Column("latitude", sa.Float, nullable=False),
        sa.Column("longitude", sa.Float, nullable=False),
        sa.Column("timestamp", sa.DateTime, nullable=False, index=True),
        sa.Column("temperature_c", sa.Float, nullable=True),
        sa.Column("humidity_percent", sa.Float, nullable=True),
        sa.Column("aqi", sa.Integer, nullable=True),
        sa.Column("source", sa.String, nullable=False),
        sa.Column("raw", sa.JSON, nullable=True),
    )


def downgrade() -> None:
    """Drop the ``observations`` table."""
    op.drop_table("observations")

