"""add civic platform tables

Revision ID: 20260924190000
Revises: 20260924163000
Create Date: 2026-09-24 19:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

revision = "20260924190000"
down_revision = "20260924163000"
branch_labels = None
depends_on = None

def upgrade() -> None:
    # Upgrade observations table columns
    op.add_column("observations", sa.Column("data_type", sa.String, nullable=True, server_default="environmental"))
    op.add_column("observations", sa.Column("zone", sa.String, nullable=True, server_default="Central"))
    op.add_column("observations", sa.Column("severity", sa.String, nullable=True, server_default="normal"))
    op.add_column("observations", sa.Column("metric", sa.String, nullable=True))
    op.add_column("observations", sa.Column("value", sa.Float, nullable=True))
    op.add_column("observations", sa.Column("unit", sa.String, nullable=True))
    op.add_column("observations", sa.Column("status", sa.String, nullable=True, server_default="active"))
    op.add_column("observations", sa.Column("metadata_info", sa.JSON, nullable=True))
    op.add_column("observations", sa.Column("is_simulated", sa.Boolean, nullable=True, server_default="false"))
    op.add_column("observations", sa.Column("created_at", sa.DateTime, nullable=True))

    # Users table
    op.create_table(
        "users",
        sa.Column("id", sa.Integer, primary_key=True, index=True),
        sa.Column("email", sa.String, unique=True, index=True, nullable=False),
        sa.Column("password_hash", sa.String, nullable=False),
        sa.Column("full_name", sa.String, nullable=False),
        sa.Column("is_active", sa.Boolean, default=True),
        sa.Column("is_admin", sa.Boolean, default=False),
        sa.Column("is_verified", sa.Boolean, default=False),
        sa.Column("created_at", sa.DateTime, nullable=True),
        sa.Column("updated_at", sa.DateTime, nullable=True),
        sa.Column("last_login_at", sa.DateTime, nullable=True),
    )

    # User preferences table
    op.create_table(
        "user_preferences",
        sa.Column("id", sa.Integer, primary_key=True, index=True),
        sa.Column("user_id", sa.Integer, sa.ForeignKey("users.id"), unique=True, nullable=False),
        sa.Column("home_city", sa.String, default="Jaipur"),
        sa.Column("home_zone", sa.String, default="Central"),
        sa.Column("latitude", sa.Float, nullable=True),
        sa.Column("longitude", sa.Float, nullable=True),
        sa.Column("location_precision", sa.String, default="approximate"),
        sa.Column("alert_radius_km", sa.Float, default=50.0),
        sa.Column("alert_preferences", sa.JSON, nullable=True),
        sa.Column("created_at", sa.DateTime, nullable=True),
        sa.Column("updated_at", sa.DateTime, nullable=True),
    )

    # Anomalies table
    op.create_table(
        "anomalies",
        sa.Column("id", sa.Integer, primary_key=True, index=True),
        sa.Column("observation_id", sa.Integer, sa.ForeignKey("observations.id"), nullable=True),
        sa.Column("city", sa.String, nullable=False, index=True),
        sa.Column("zone", sa.String, default="Central"),
        sa.Column("data_type", sa.String, nullable=False),
        sa.Column("detected_at", sa.DateTime, nullable=True, index=True),
        sa.Column("algorithm", sa.String, default="Rolling Z-Score"),
        sa.Column("score", sa.Float, nullable=False),
        sa.Column("severity", sa.String, default="moderate"),
        sa.Column("expected_value", sa.Float, nullable=True),
        sa.Column("actual_value", sa.Float, nullable=True),
        sa.Column("deviation", sa.String, nullable=True),
        sa.Column("is_confirmed", sa.Boolean, default=False),
        sa.Column("model_version", sa.String, default="v1.0-baseline"),
        sa.Column("metadata_info", sa.JSON, nullable=True),
    )

    # Correlations table
    op.create_table(
        "correlations",
        sa.Column("id", sa.Integer, primary_key=True, index=True),
        sa.Column("city", sa.String, nullable=False, index=True),
        sa.Column("zone", sa.String, default="Central"),
        sa.Column("feature_a", sa.String, nullable=False),
        sa.Column("feature_b", sa.String, nullable=False),
        sa.Column("time_window", sa.String, default="6h"),
        sa.Column("correlation_coefficient", sa.Float, nullable=False),
        sa.Column("sample_size", sa.Integer, nullable=False),
        sa.Column("p_value_if_available", sa.Float, nullable=True),
        sa.Column("confidence", sa.Float, default=0.85),
        sa.Column("detected_at", sa.DateTime, nullable=True, index=True),
        sa.Column("interpretation", sa.String, nullable=False),
        sa.Column("model_version", sa.String, default="v1.0-pearson"),
    )

    # Civic Events / Disasters table
    op.create_table(
        "civic_events",
        sa.Column("id", sa.Integer, primary_key=True, index=True),
        sa.Column("event_type", sa.String, nullable=False, index=True),
        sa.Column("title", sa.String, nullable=False),
        sa.Column("description", sa.String, nullable=False),
        sa.Column("city", sa.String, nullable=False, index=True),
        sa.Column("zone", sa.String, default="Central"),
        sa.Column("latitude", sa.Float, nullable=False),
        sa.Column("longitude", sa.Float, nullable=False),
        sa.Column("severity", sa.String, default="MEDIUM"),
        sa.Column("source", sa.String, default="Civic Monitoring Feed"),
        sa.Column("source_event_id", sa.String, nullable=True),
        sa.Column("started_at", sa.DateTime, nullable=True, index=True),
        sa.Column("updated_at", sa.DateTime, nullable=True),
        sa.Column("ended_at", sa.DateTime, nullable=True),
        sa.Column("status", sa.String, default="ACTIVE"),
        sa.Column("radius_km", sa.Float, default=30.0),
        sa.Column("is_simulated", sa.Boolean, default=False, index=True),
        sa.Column("metadata_info", sa.JSON, nullable=True),
    )

    # Alerts table
    op.create_table(
        "alerts",
        sa.Column("id", sa.Integer, primary_key=True, index=True),
        sa.Column("user_id", sa.Integer, sa.ForeignKey("users.id"), nullable=True, index=True),
        sa.Column("event_id", sa.Integer, sa.ForeignKey("civic_events.id"), nullable=True),
        sa.Column("anomaly_id", sa.Integer, sa.ForeignKey("anomalies.id"), nullable=True),
        sa.Column("alert_type", sa.String, nullable=False),
        sa.Column("title", sa.String, nullable=False),
        sa.Column("message", sa.String, nullable=False),
        sa.Column("severity", sa.String, default="MEDIUM"),
        sa.Column("source_city", sa.String, nullable=False),
        sa.Column("target_city", sa.String, nullable=False),
        sa.Column("distance_km", sa.Float, nullable=False),
        sa.Column("created_at", sa.DateTime, nullable=True, index=True),
        sa.Column("expires_at", sa.DateTime, nullable=True),
        sa.Column("is_read", sa.Boolean, default=False),
        sa.Column("delivery_status", sa.String, default="DELIVERED"),
        sa.Column("metadata_info", sa.JSON, nullable=True),
    )

    # Feedback table
    op.create_table(
        "feedback",
        sa.Column("id", sa.Integer, primary_key=True, index=True),
        sa.Column("user_id", sa.Integer, sa.ForeignKey("users.id"), nullable=True, index=True),
        sa.Column("observation_id", sa.Integer, sa.ForeignKey("observations.id"), nullable=True),
        sa.Column("anomaly_id", sa.Integer, sa.ForeignKey("anomalies.id"), nullable=True),
        sa.Column("alert_id", sa.Integer, sa.ForeignKey("alerts.id"), nullable=True),
        sa.Column("feedback_type", sa.String, default="alert_usefulness"),
        sa.Column("predicted_label", sa.String, nullable=True),
        sa.Column("actual_label", sa.String, nullable=True),
        sa.Column("predicted_severity", sa.String, nullable=True),
        sa.Column("actual_severity", sa.String, nullable=True),
        sa.Column("model_version", sa.String, default="v1.0-baseline"),
        sa.Column("prediction_score", sa.Float, nullable=True),
        sa.Column("observed_features", sa.JSON, nullable=True),
        sa.Column("user_comment", sa.String, nullable=True),
        sa.Column("is_validated", sa.Boolean, default=False),
        sa.Column("validation_status", sa.String, default="PENDING"),
        sa.Column("created_at", sa.DateTime, nullable=True, index=True),
    )

    # Model versions table
    op.create_table(
        "model_versions",
        sa.Column("id", sa.Integer, primary_key=True, index=True),
        sa.Column("model_name", sa.String, nullable=False),
        sa.Column("version", sa.String, nullable=False, unique=True),
        sa.Column("algorithm", sa.String, nullable=False),
        sa.Column("training_data_version", sa.String, default="v1.0"),
        sa.Column("training_samples", sa.Integer, default=0),
        sa.Column("validation_samples", sa.Integer, default=0),
        sa.Column("precision", sa.Float, nullable=True),
        sa.Column("recall", sa.Float, nullable=True),
        sa.Column("f1_score", sa.Float, nullable=True),
        sa.Column("false_positive_rate", sa.Float, nullable=True),
        sa.Column("created_at", sa.DateTime, nullable=True),
        sa.Column("is_active", sa.Boolean, default=True),
    )

def downgrade() -> None:
    op.drop_table("model_versions")
    op.drop_table("feedback")
    op.drop_table("alerts")
    op.drop_table("civic_events")
    op.drop_table("correlations")
    op.drop_table("anomalies")
    op.drop_table("user_preferences")
    op.drop_table("users")
