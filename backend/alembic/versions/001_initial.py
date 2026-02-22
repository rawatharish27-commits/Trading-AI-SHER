"""Initial migration

Revision ID: 001
Revises: 
Create Date: 2025-01-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import sqlite

# revision identifiers, used by Alembic.
revision = '001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # Users table
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('mobile', sa.String(length=20), nullable=False),
        sa.Column('hashed_password', sa.String(length=255), nullable=False),
        sa.Column('first_name', sa.String(length=100), nullable=True),
        sa.Column('last_name', sa.String(length=100), nullable=True),
        sa.Column('city', sa.String(length=100), nullable=True),
        sa.Column('state', sa.String(length=100), nullable=True),
        sa.Column('role', sa.String(length=50), nullable=True),
        sa.Column('plan', sa.String(length=50), nullable=True),
        sa.Column('tenant_id', sa.Integer(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.Column('is_verified', sa.Boolean(), nullable=True),
        sa.Column('onboarding_completed', sa.Boolean(), nullable=True),
        sa.Column('mfa_enabled', sa.Boolean(), nullable=True),
        sa.Column('mfa_secret', sa.String(length=255), nullable=True),
        sa.Column('last_login', sa.DateTime(timezone=True), nullable=True),
        sa.Column('plan_expiry', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)
    op.create_index(op.f('ix_users_mobile'), 'users', ['mobile'], unique=True)

    # Signals table
    op.create_table(
        'signals',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('trace_id', sa.String(length=100), nullable=False),
        sa.Column('symbol', sa.String(length=50), nullable=False),
        sa.Column('exchange', sa.String(length=20), nullable=True),
        sa.Column('token', sa.String(length=50), nullable=True),
        sa.Column('action', sa.String(length=20), nullable=False),
        sa.Column('direction', sa.String(length=20), nullable=True),
        sa.Column('status', sa.String(length=20), nullable=True),
        sa.Column('probability', sa.Float(), nullable=False),
        sa.Column('confidence', sa.Float(), nullable=True),
        sa.Column('confidence_level', sa.String(length=20), nullable=True),
        sa.Column('risk_level', sa.String(length=20), nullable=True),
        sa.Column('risk_warning', sa.Text(), nullable=True),
        sa.Column('entry_price', sa.Float(), nullable=False),
        sa.Column('stop_loss', sa.Float(), nullable=False),
        sa.Column('target_1', sa.Float(), nullable=False),
        sa.Column('target_2', sa.Float(), nullable=False),
        sa.Column('target_3', sa.Float(), nullable=True),
        sa.Column('market_regime', sa.String(length=50), nullable=True),
        sa.Column('strategy', sa.String(length=100), nullable=True),
        sa.Column('evidence_count', sa.Integer(), nullable=True),
        sa.Column('reasoning', sa.Text(), nullable=True),
        sa.Column('signal_time', sa.DateTime(timezone=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_signals_symbol'), 'signals', ['symbol'], unique=False)
    op.create_index(op.f('ix_signals_trace_id'), 'signals', ['trace_id'], unique=True)

    # Orders table
    op.create_table(
        'orders',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('signal_id', sa.Integer(), nullable=True),
        sa.Column('order_id', sa.String(length=100), nullable=True),
        sa.Column('symbol', sa.String(length=50), nullable=False),
        sa.Column('exchange', sa.String(length=20), nullable=True),
        sa.Column('side', sa.String(length=10), nullable=False),
        sa.Column('order_type', sa.String(length=30), nullable=True),
        sa.Column('product_type', sa.String(length=30), nullable=True),
        sa.Column('quantity', sa.Integer(), nullable=False),
        sa.Column('filled_quantity', sa.Integer(), nullable=True),
        sa.Column('price', sa.Float(), nullable=True),
        sa.Column('average_price', sa.Float(), nullable=True),
        sa.Column('stop_loss', sa.Float(), nullable=True),
        sa.Column('status', sa.String(length=30), nullable=True),
        sa.Column('broker', sa.String(length=50), nullable=True),
        sa.Column('broker_order_id', sa.String(length=100), nullable=True),
        sa.Column('order_time', sa.DateTime(timezone=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_orders_symbol'), 'orders', ['symbol'], unique=False)

    # Positions table
    op.create_table(
        'positions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('symbol', sa.String(length=50), nullable=False),
        sa.Column('exchange', sa.String(length=20), nullable=True),
        sa.Column('side', sa.String(length=10), nullable=False),
        sa.Column('status', sa.String(length=20), nullable=True),
        sa.Column('quantity', sa.Integer(), nullable=False),
        sa.Column('open_quantity', sa.Integer(), nullable=False),
        sa.Column('entry_price', sa.Float(), nullable=False),
        sa.Column('current_price', sa.Float(), nullable=True),
        sa.Column('stop_loss', sa.Float(), nullable=True),
        sa.Column('realized_pnl', sa.Float(), nullable=True),
        sa.Column('unrealized_pnl', sa.Float(), nullable=True),
        sa.Column('sector', sa.String(length=50), nullable=True),
        sa.Column('strategy', sa.String(length=100), nullable=True),
        sa.Column('broker', sa.String(length=50), nullable=True),
        sa.Column('entry_time', sa.DateTime(timezone=True), nullable=False),
        sa.Column('exit_time', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    # Risk States table
    op.create_table(
        'risk_states',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('daily_pnl', sa.Float(), nullable=True),
        sa.Column('weekly_pnl', sa.Float(), nullable=True),
        sa.Column('daily_trades', sa.Integer(), nullable=True),
        sa.Column('open_positions', sa.Integer(), nullable=True),
        sa.Column('used_margin', sa.Float(), nullable=True),
        sa.Column('available_margin', sa.Float(), nullable=True),
        sa.Column('max_drawdown', sa.Float(), nullable=True),
        sa.Column('current_drawdown', sa.Float(), nullable=True),
        sa.Column('kill_switch_active', sa.Boolean(), nullable=True),
        sa.Column('kill_switch_reason', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )


def downgrade():
    op.drop_table('risk_states')
    op.drop_table('positions')
    op.drop_table('orders')
    op.drop_table('signals')
    op.drop_table('users')
