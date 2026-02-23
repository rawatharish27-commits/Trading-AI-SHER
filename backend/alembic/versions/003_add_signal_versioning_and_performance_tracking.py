"""Add signal versioning and performance tracking

Revision ID: 003
Revises: 002
Create Date: 2025-01-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '003'
down_revision = '002'
branch_labels = None
depends_on = None


def upgrade():
    # Add signal versioning
    op.add_column('signals', sa.Column('setup_version', sa.String(length=20), nullable=True, default='1.0'))

    # Add performance tracking fields
    op.add_column('signals', sa.Column('exit_price', sa.Float(), nullable=True))
    op.add_column('signals', sa.Column('realized_pnl', sa.Float(), nullable=True))
    op.add_column('signals', sa.Column('pnl_percentage', sa.Float(), nullable=True))
    op.add_column('signals', sa.Column('holding_period_days', sa.Integer(), nullable=True))
    op.add_column('signals', sa.Column('max_favorable_excursion', sa.Float(), nullable=True))
    op.add_column('signals', sa.Column('max_adverse_excursion', sa.Float(), nullable=True))
    op.add_column('signals', sa.Column('performance_score', sa.Float(), nullable=True))


def downgrade():
    # Remove performance tracking fields
    op.drop_column('signals', 'performance_score')
    op.drop_column('signals', 'max_adverse_excursion')
    op.drop_column('signals', 'max_favorable_excursion')
    op.drop_column('signals', 'holding_period_days')
    op.drop_column('signals', 'pnl_percentage')
    op.drop_column('signals', 'realized_pnl')
    op.drop_column('signals', 'exit_price')

    # Remove signal versioning
    op.drop_column('signals', 'setup_version')
