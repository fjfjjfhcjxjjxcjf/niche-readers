"""initial schema

Revision ID: 0001_initial_schema
Revises: 
Create Date: 2026-09-16 20:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = '0001_initial_schema'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Create Users Table
    op.create_table(
        'users',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('hashed_password', sa.String(length=255), nullable=False),
        sa.Column('role', sa.Enum('READER', 'AUTHOR', 'ADMIN', name='userrole'), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)
    op.create_index(op.f('ix_users_id'), 'users', ['id'], unique=False)

    # 2. Create Author Profiles Table
    op.create_table(
        'author_profiles',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('display_name', sa.String(length=120), nullable=False),
        sa.Column('bio', sa.Text(), nullable=True),
        sa.Column('avatar_url', sa.String(length=500), nullable=True),
        sa.Column('website_url', sa.String(length=500), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id')
    )
    op.create_index(op.f('ix_author_profiles_id'), 'author_profiles', ['id'], unique=False)

    # 3. Create Books Table
    op.create_table(
        'books',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('title', sa.String(length=300), nullable=False),
        sa.Column('author_name', sa.String(length=200), nullable=False),
        sa.Column('author_profile_id', sa.UUID(), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('genre', sa.String(length=100), nullable=True),
        sa.Column('language', sa.String(length=10), nullable=False),
        sa.Column('publication_year', sa.Integer(), nullable=True),
        sa.Column('cover_image_url', sa.String(length=500), nullable=True),
        sa.Column('availability_type', sa.Enum('PUBLIC_DOMAIN', 'EXTERNAL_LEGAL', 'MARKETPLACE', name='availabilitytype'), nullable=False),
        sa.Column('status', sa.Enum('DRAFT', 'PENDING_REVIEW', 'PUBLISHED', 'REJECTED', 'ARCHIVED', name='bookstatus'), nullable=False),
        sa.Column('price', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('file_path', sa.String(length=500), nullable=True),
        sa.Column('file_format', sa.String(length=10), nullable=True),
        sa.Column('external_url', sa.String(length=500), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['author_profile_id'], ['author_profiles.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_books_author_name'), 'books', ['author_name'], unique=False)
    op.create_index(op.f('ix_books_genre'), 'books', ['genre'], unique=False)
    op.create_index(op.f('ix_books_id'), 'books', ['id'], unique=False)
    op.create_index(op.f('ix_books_title'), 'books', ['title'], unique=False)

    # 4. Create Shelf Items Table
    op.create_table(
        'shelf_items',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('book_id', sa.UUID(), nullable=False),
        sa.Column('shelf_type', sa.Enum('WANT_TO_READ', 'READING', 'FINISHED', 'FAVORITES', 'PURCHASED', name='shelftype'), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['book_id'], ['books.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'book_id', 'shelf_type', name='uq_user_book_shelf')
    )
    op.create_index(op.f('ix_shelf_items_book_id'), 'shelf_items', ['book_id'], unique=False)
    op.create_index(op.f('ix_shelf_items_id'), 'shelf_items', ['id'], unique=False)
    op.create_index(op.f('ix_shelf_items_user_id'), 'shelf_items', ['user_id'], unique=False)

    # 5. Create Annotations Table
    op.create_table(
        'annotations',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('book_id', sa.UUID(), nullable=False),
        sa.Column('cfi_range', sa.String(length=500), nullable=False),
        sa.Column('highlighted_text', sa.Text(), nullable=False),
        sa.Column('note', sa.Text(), nullable=True),
        sa.Column('color', sa.String(length=20), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['book_id'], ['books.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_annotations_book_id'), 'annotations', ['book_id'], unique=False)
    op.create_index(op.f('ix_annotations_id'), 'annotations', ['id'], unique=False)
    op.create_index(op.f('ix_annotations_user_id'), 'annotations', ['user_id'], unique=False)


def downgrade() -> None:
    op.drop_table('annotations')
    op.drop_table('shelf_items')
    op.drop_table('books')
    op.drop_table('author_profiles')
    op.drop_table('users')
    
    # Drop Enums
    sa.Enum(name='shelftype').drop(op.get_bind(), checkfirst=True)
    sa.Enum(name='bookstatus').drop(op.get_bind(), checkfirst=True)
    sa.Enum(name='availabilitytype').drop(op.get_bind(), checkfirst=True)
    sa.Enum(name='userrole').drop(op.get_bind(), checkfirst=True)