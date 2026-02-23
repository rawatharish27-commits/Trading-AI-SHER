-- database/schema/02_market_data.sql
-- ============================================
-- MARKET DATA TABLES
-- ============================================

-- Symbols master table
CREATE TABLE symbols (
    symbol_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    symbol VARCHAR(20) UNIQUE NOT NULL,
    company_name VARCHAR(255),
    exchange VARCHAR(10) NOT NULL, -- NSE, BSE, NFO
    instrument_type VARCHAR(20), -- EQ, FUT, OPT
    lot_size INTEGER,
    tick_size DECIMAL(10,2),
    is_active BOOLEAN DEFAULT true,
    sector VARCHAR(100),
    industry VARCHAR(100),
    listing_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for fast symbol lookup
CREATE INDEX idx_symbols_symbol ON symbols(symbol);
CREATE INDEX idx_symbols_exchange ON symbols(exchange);

-- OHLCV Data (TimescaleDB hypertable)
CREATE TABLE ohlcv_data (
    time TIMESTAMPTZ NOT NULL,
    symbol_id UUID REFERENCES symbols(symbol_id),
    "open" DECIMAL(10,2) NOT NULL,
    high DECIMAL(10,2) NOT NULL,
    low DECIMAL(10,2) NOT NULL,
    "close" DECIMAL(10,2) NOT NULL,
    volume BIGINT NOT NULL,
    open_interest BIGINT,
    interval VARCHAR(10) NOT NULL -- 1m, 5m, 15m, 1h, 1d
);

-- Convert to hypertable for time-series optimization
SELECT create_hypertable('ohlcv_data', 'time');

-- Create indexes
CREATE INDEX idx_ohlcv_symbol_time ON ohlcv_data (symbol_id, time DESC);
CREATE INDEX idx_ohlcv_interval ON ohlcv_data (interval);

-- Tick data (for backtesting)
CREATE TABLE tick_data (
    time TIMESTAMPTZ NOT NULL,
    symbol_id UUID REFERENCES symbols(symbol_id),
    price DECIMAL(10,2) NOT NULL,
    quantity INTEGER NOT NULL,
    trade_type VARCHAR(10) -- BUY, SELL
);

SELECT create_hypertable('tick_data', 'time');
CREATE INDEX idx_tick_symbol_time ON tick_data (symbol_id, time DESC);
