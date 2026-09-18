"""add reading sessions table

Revision ID: 0003_add_reading_sessions
Revises: 0002_add_bibliographic_metadata
Create Date: 2026-09-18 12:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision: str = '0003_add_reading_sessions'
down_revision: Union[str, None] = '0002_add_bibliographic_metadata'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'reading_sessions',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('book_id', UUID(as_uuid=True), sa.ForeignKey('books.id', ondelete='CASCADE'), nullable=False),
        sa.Column('duration_seconds', sa.Integer(), nullable=False, default=60),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now())
    )
    op.create_index(op.f('ix_reading_sessions_user_id'), 'reading_sessions', ['user_id'], unique=False)
    op.create_index(op.f('ix_reading_sessions_book_id'), 'reading_sessions', ['book_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_reading_sessions_book_id'), table_name='reading_sessions')
    op.drop_index(op.f('ix_reading_sessions_user_id'), table_name='reading_sessions')
    op.drop_table('reading_sessions')
