-- database/schema/05_trades_portfolio.sql
-- ============================================
-- TRADES & PORTFOLIO MANAGEMENT
-- ============================================

-- Trades executed
CREATE TABLE trades (
    trade_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(user_id),
    symbol_id UUID REFERENCES symbols(symbol_id),
    signal_id UUID REFERENCES trading_signals(signal_id),

    -- Trade details
    direction VARCHAR(10) CHECK (direction IN ('BUY', 'SELL')),
    quantity INTEGER NOT NULL,
    entry_price DECIMAL(10,2) NOT NULL,
    exit_price DECIMAL(10,2),
    entry_time TIMESTAMPTZ NOT NULL,
    exit_time TIMESTAMPTZ,

    -- Risk management
    stop_loss DECIMAL(10,2),
    target1 DECIMAL(10,2),
    target2 DECIMAL(10,2),

    -- P&L
    gross_pnl DECIMAL(10,2),
    net_pnl DECIMAL(10,2),
    brokerage DECIMAL(10,2),
    taxes DECIMAL(10,2),

    -- Status
    status VARCHAR(20) DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'CLOSED', 'CANCELLED')),
    exit_reason VARCHAR(50),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

SELECT create_hypertable('trades', 'entry_time');
CREATE INDEX idx_trades_user_status ON trades(user_id, status);
CREATE INDEX idx_trades_symbol_time ON trades(symbol_id, entry_time DESC);

-- Portfolio snapshot
CREATE TABLE portfolio_snapshots (
    snapshot_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(user_id),
    snapshot_date DATE NOT NULL,
    total_capital DECIMAL(15,2),
    invested_amount DECIMAL(15,2),
    cash_balance DECIMAL(15,2),
    daily_pnl DECIMAL(10,2),
    daily_pnl_percent DECIMAL(5,2),
    total_pnl DECIMAL(15,2),
    total_pnl_percent DECIMAL(10,2),
    win_rate DECIMAL(5,2),
    max_drawdown DECIMAL(5,2),
    sharpe_ratio DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, snapshot_date)
);

-- Trade journal
CREATE TABLE trade_journal (
    journal_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trade_id UUID REFERENCES trades(trade_id),
    user_id UUID REFERENCES users(user_id),
    entry_notes TEXT,
    exit_notes TEXT,
    emotions VARCHAR(50),
    mistakes TEXT, -- JSON array as text
    lessons TEXT,
    screenshot_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
