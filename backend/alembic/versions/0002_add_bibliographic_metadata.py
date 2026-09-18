"""add bibliographic and rights metadata

Revision ID: 0002_add_bibliographic_metadata
Revises: 0001_initial_schema
Create Date: 2026-09-18 10:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '0002_add_bibliographic_metadata'
down_revision: Union[str, None] = '0001_initial_schema'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('books', sa.Column('isbn', sa.String(length=20), nullable=True))
    op.add_column('books', sa.Column('original_publisher', sa.String(length=200), nullable=True))
    op.add_column('books', sa.Column('rights_statement', sa.String(length=300), nullable=True))
    op.add_column('books', sa.Column('page_count', sa.Integer(), nullable=True))
    op.create_index(op.f('ix_books_isbn'), 'books', ['isbn'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_books_isbn'), table_name='books')
    op.drop_column('books', 'page_count')
    op.drop_column('books', 'rights_statement')
    op.drop_column('books', 'original_publisher')
    op.drop_column('books', 'isbn')
