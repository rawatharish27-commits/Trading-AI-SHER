"""Add SMC fields to signals table

Revision ID: 002
Revises: 001
Create Date: 2025-01-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '002'
down_revision = '001'
branch_labels = None
depends_on = None


def upgrade():
    # Add SMC-specific columns to signals table
    op.add_column('signals', sa.Column('market_structure', sa.String(length=50), nullable=True))
    op.add_column('signals', sa.Column('liquidity_sweep', sa.JSON(), nullable=True))
    op.add_column('signals', sa.Column('order_block', sa.JSON(), nullable=True))
    op.add_column('signals', sa.Column('fair_value_gap', sa.JSON(), nullable=True))
    op.add_column('signals', sa.Column('mtf_confirmation', sa.Boolean(), nullable=True))


def downgrade():
    # Remove SMC-specific columns from signals table
    op.drop_column('signals', 'mtf_confirmation')
    op.drop_column('signals', 'fair_value_gap')
    op.drop_column('signals', 'order_block')
    op.drop_column('signals', 'liquidity_sweep')
    op.drop_column('signals', 'market_structure')
