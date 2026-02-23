-- database/schema/04_signals_analysis.sql
-- ============================================
-- TRADING SIGNALS & ANALYSIS
-- ============================================

-- Market Structure Analysis
CREATE TABLE market_structure (
    structure_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    symbol_id UUID REFERENCES symbols(symbol_id),
    timestamp TIMESTAMPTZ NOT NULL,
    structure_type VARCHAR(50), -- ORDER_BLOCK, FVG, MSS
    direction VARCHAR(10) CHECK (direction IN ('BULLISH', 'BEARISH', 'NEUTRAL')),
    price_level DECIMAL(10,2),
    top_range DECIMAL(10,2),
    bottom_range DECIMAL(10,2),
    strength VARCHAR(20), -- HIGH, MEDIUM, LOW
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

SELECT create_hypertable('market_structure', 'timestamp');

-- Trading Signals (Final Decisions)
CREATE TABLE trading_signals (
    signal_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    symbol_id UUID REFERENCES symbols(symbol_id),
    signal_type VARCHAR(20) CHECK (signal_type IN ('BUY', 'SELL', 'HOLD')),
    confidence DECIMAL(5,2), -- 0-100%
    strength VARCHAR(20), -- LOW, MEDIUM, HIGH, EXTREME

    -- Entry/Exit Levels
    entry_min DECIMAL(10,2),
    entry_max DECIMAL(10,2),
    stop_loss DECIMAL(10,2),
    target1 DECIMAL(10,2),
    target2 DECIMAL(10,2),

    -- Analysis Components
    market_structure_score DECIMAL(5,2),
    institutional_score DECIMAL(5,2),
    liquidity_score DECIMAL(5,2),
    momentum_score DECIMAL(5,2),
    mtf_score DECIMAL(5,2),

    -- Metadata
    predicted_move_percent DECIMAL(5,2),
    risk_reward_ratio DECIMAL(5,2),
    time_horizon VARCHAR(50),
    reasons JSONB, -- Array of reasons

    -- Status
    is_active BOOLEAN DEFAULT true,
    is_executed BOOLEAN DEFAULT false,
    expired_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Indexes for fast queries
    INDEX idx_signals_symbol_created (symbol_id, created_at DESC),
    INDEX idx_signals_confidence (confidence DESC)
);

-- Signal Performance Tracking
CREATE TABLE signal_performance (
    performance_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    signal_id UUID REFERENCES trading_signals(signal_id),
    entry_price DECIMAL(10,2),
    exit_price DECIMAL(10,2),
    exit_time TIMESTAMPTZ,
    profit_loss DECIMAL(10,2),
    profit_loss_percent DECIMAL(5,2),
    exit_reason VARCHAR(50), -- TARGET1, TARGET2, STOP_LOSS, TIME_EXIT
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
