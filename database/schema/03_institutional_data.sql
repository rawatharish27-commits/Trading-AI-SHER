-- database/schema/03_institutional_data.sql
-- ============================================
-- INSTITUTIONAL FLOW DATA
-- ============================================

-- FII/DII Data
CREATE TABLE fii_dii_data (
    date DATE PRIMARY KEY,
    fii_buy_crore DECIMAL(15,2),
    fii_sell_crore DECIMAL(15,2),
    fii_net_crore DECIMAL(15,2),
    dii_buy_crore DECIMAL(15,2),
    dii_sell_crore DECIMAL(15,2),
    dii_net_crore DECIMAL(15,2),
    total_net_crore DECIMAL(15,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Options Chain Data
CREATE TABLE options_chain (
    chain_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    symbol_id UUID REFERENCES symbols(symbol_id),
    expiry_date DATE NOT NULL,
    strike_price DECIMAL(10,2) NOT NULL,
    option_type VARCHAR(2) CHECK (option_type IN ('CE', 'PE')),
    open_interest INTEGER,
    oi_change_percent DECIMAL(10,2),
    volume INTEGER,
    iv DECIMAL(10,2),
    ltp DECIMAL(10,2),
    change_percent DECIMAL(10,2),
    timestamp TIMESTAMPTZ NOT NULL,
    UNIQUE(symbol_id, expiry_date, strike_price, option_type, timestamp)
);

SELECT create_hypertable('options_chain', 'timestamp');
CREATE INDEX idx_options_symbol_time ON options_chain (symbol_id, timestamp DESC);

-- Delivery Data
CREATE TABLE delivery_data (
    date DATE NOT NULL,
    symbol_id UUID REFERENCES symbols(symbol_id),
    delivery_percent DECIMAL(5,2),
    delivery_quantity BIGINT,
    total_volume BIGINT,
    avg_delivery_20d DECIMAL(5,2),
    delivery_spike DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(date, symbol_id)
);

-- Bulk/Block Deals
CREATE TABLE bulk_deals (
    deal_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    symbol_id UUID REFERENCES symbols(symbol_id),
    deal_date DATE NOT NULL,
    deal_type VARCHAR(20) CHECK (deal_type IN ('BULK', 'BLOCK')),
    buyer_name VARCHAR(255),
    seller_name VARCHAR(255),
    quantity INTEGER,
    price DECIMAL(10,2),
    value_crore DECIMAL(15,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
