"""add facial recognition

Revision ID: add_facial_recognition
Revises: 
Create Date: 2024-03-21 10:00:00.000000

"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "add_facial_recognition"
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # Add has_faceid column to users table
    op.add_column("users", sa.Column("has_faceid", sa.Boolean(), nullable=False, server_default="false"))

    # Create face_encodings table
    op.create_table(
        "face_encodings",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("encoding", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"],
        ),
        sa.PrimaryKeyConstraint("id"),
    )

    # Create index on user_id for faster lookups
    op.create_index(op.f("ix_face_encodings_user_id"), "face_encodings", ["user_id"], unique=True)


def downgrade():
    # Drop face_encodings table
    op.drop_index(op.f("ix_face_encodings_user_id"), table_name="face_encodings")
    op.drop_table("face_encodings")

    # Drop has_faceid column from users table
    op.drop_column("users", "has_faceid")
