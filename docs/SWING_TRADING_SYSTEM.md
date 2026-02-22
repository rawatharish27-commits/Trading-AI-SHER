# Swing Trading System - Complete Implementation

## 📊 Overview

मैंने आपके लिए एक complete Swing Trading System बनाया है जो:
- 3 महीने का historical data fetch और store करता है
- 2-3 days holding के लिए trades लेता है
- Multi-timeframe analysis करता है
- Trades को continuously monitor करता है
- Dynamic exit decisions लेता है

---

## 📁 Files Created

### 1. Database Models
**`/backend/app/models/swing_trade.py`**
- `SwingTrade` - Main trade model with all tracking fields
- `HistoricalAnalysis` - Analysis storage for backtesting
- Enums: `SwingTradeStatus`, `SwingTradeSignal`, `Timeframe`, `ExitReason`

### 2. Historical Data Service
**`/backend/app/services/historical_data_service.py`**
- 3 महीने का data fetch करता है
- Multiple timeframes support (1D, 1H, 15M, 5M, 1M)
- Database में store करता है
- Technical indicators calculate करता है

### 3. Swing Trading Engine
**`/backend/app/engines/swing_trading_engine.py`**
- Multi-timeframe analysis (Weekly, Daily, 4H, 1H)
- Trend detection (UPTREND, DOWNTREND, SIDEWAYS)
- Momentum calculation
- Support/Resistance detection
- Entry/Exit point calculation

### 4. Trade Monitor Service
**`/backend/app/services/trade_monitor_service.py`**
- Real-time trade monitoring
- Target achievement detection
- Stop loss monitoring
- Time-based exit (3 days max)
- Analysis-based exit (deteriorating conditions)
- Trailing stop management

### 5. API Endpoints
**`/backend/app/api/v1/endpoints/swing_trading.py`**
- `POST /api/v1/swing/generate-signal` - Generate trading signal
- `POST /api/v1/swing/execute-trade` - Execute a trade
- `GET /api/v1/swing/active-trades` - Get all active trades
- `POST /api/v1/swing/monitor/{trade_id}` - Monitor single trade
- `POST /api/v1/swing/monitor-all` - Monitor all trades
- `POST /api/v1/swing/exit-trade` - Exit a trade
- `POST /api/v1/swing/update-historical-data` - Update historical data
- `GET /api/v1/swing/statistics` - Get trading statistics

---

## 🚀 API Usage Examples

### 1. Generate Signal
```bash
POST /api/v1/swing/generate-signal
{
    "symbol": "RELIANCE",
    "exchange": "NSE",
    "capital_percent": 5.0,
    "max_risk_percent": 2.0
}

Response:
{
    "symbol": "RELIANCE",
    "signal": "BUY",
    "action": "BUY",
    "confidence": 0.78,
    "confluence_score": 75.5,
    "entry_price": 2450.00,
    "stop_loss": 2400.00,
    "target_1": 2500.00,
    "target_2": 2550.00,
    "target_3": 2600.00,
    "risk_reward_ratio": 1.67,
    "recommended_holding_days": 2,
    "risk_level": "MEDIUM",
    "pre_momentum_score": 68.5,
    "reasoning": "DAILY: UPTREND (BUY) | 4H: UPTREND (BUY) | Confluence: 75%"
}
```

### 2. Execute Trade
```bash
POST /api/v1/swing/execute-trade
{
    "symbol": "RELIANCE",
    "side": "LONG",
    "quantity": 50,
    "entry_price": 2450.00,
    "stop_loss": 2400.00,
    "target_1": 2500.00,
    "target_2": 2550.00,
    "target_3": 2600.00,
    "max_holding_days": 3
}
```

### 3. Monitor Trade
```bash
POST /api/v1/swing/monitor/{trade_id}

Response:
{
    "trade_id": 1,
    "symbol": "RELIANCE",
    "action": "HOLD",
    "current_price": 2475.00,
    "pnl": 1250.00,
    "pnl_percent": 1.02,
    "exit_recommended": false,
    "targets_achieved": [],
    "days_remaining": 2,
    "warnings": [],
    "reasoning": "Score: 72 (-3), Trend: NEUTRAL, Momentum: BULLISH"
}
```

---

## 📊 How It Works

### Signal Generation Flow:
```
1. Fetch 3 Months Historical Data
   └── Daily, 4H, 1H timeframes

2. Multi-Timeframe Analysis
   ├── Weekly: Macro trend direction
   ├── Daily: Primary signal
   ├── 4H: Entry timing
   └── 1H: Precise entry

3. Calculate Confluence Score
   └── How aligned are all timeframes?

4. Generate Entry Parameters
   ├── Entry Price
   ├── Stop Loss (ATR-based)
   ├── Target 1, 2, 3
   └── Risk/Reward Ratio

5. Return Signal with Confidence
```

### Trade Monitoring Flow:
```
Every 5 minutes:
1. Update P&L
2. Check Target Achievement
   └── If intraday target hit → BOOK PROFIT
3. Check Stop Loss
   └── If hit → EXIT_STOP_LOSS
4. Check Time Limit (3 days)
   └── If exceeded → EXIT_TIME_LIMIT
5. Analyze Conditions
   ├── Score change > -15? → EXIT_ANALYSIS
   ├── Momentum reversal? → EXIT_ANALYSIS
   └── Volume dry up? → WARNING
6. Update Trailing Stop
   └── If profit > 1.5% → Activate trailing
```

---

## 🎯 Exit Decision Logic

### Target Achievement:
- **Intraday**: Target hit → Immediate exit
- **Day 2-3**: Target hit → Book profit

### Analysis-Based Exit (The Key Feature):
```python
# Exit if analysis deteriorates
if current_score - entry_score < -15:
    exit_recommended = True
    exit_reason = "ANALYSIS_DETERIORATED"

# Exit if momentum reverses
if momentum < -30:
    exit_recommended = True
    exit_reason = "MOMENTUM_REVERSAL"

# Exit if signal reverses
if signal reversed to SELL (for LONG position):
    exit_recommended = True
    exit_reason = "TREND_REVERSAL"
```

---

## 📈 Performance Tracking

The system tracks:
- Entry/Exit prices
- P&L per trade
- Win rate
- Average holding period
- Exit reason breakdown
- Max profit/loss reached

---

## ⚙️ Configuration

Key parameters (can be adjusted):
```python
# Monitoring thresholds
ANALYSIS_EXIT_THRESHOLD = -15  # Score drop to trigger exit
MOMENTUM_REVERSAL_THRESHOLD = -30
TIME_EXIT_DAYS = 3

# Trailing stop
TRAILING_STOP_TRIGGER = 1.5  # % profit to activate
TRAILING_STOP_DISTANCE = 1.0  # % distance for trailing
```

---

## 🔧 Technical Details

### Multi-Timeframe Weights:
```python
TIMEFRAME_WEIGHTS = {
    "WEEKLY": 0.30,   # Macro trend
    "DAILY": 0.35,    # Primary signal
    "4H": 0.20,       # Entry timing
    "1H": 0.15,       # Precise entry
}
```

### Analysis Scoring:
- Trend contribution: -25 to +25 points
- Momentum contribution: -20 to +20 points
- RSI contribution: -15 to +15 points
- Volume contribution: -5 to +10 points

---

## 📋 Database Schema

### swing_trades table:
- Trade details (symbol, side, quantity, prices)
- Targets (target_1, target_2, target_3)
- Stop loss (static and trailing)
- Analysis scores (entry and current)
- Multi-timeframe scores
- Monitoring log (JSON)
- Status tracking

### ohlcv_data table:
- Historical candle data
- Multiple timeframes
- 3 months storage

---

## 🎉 Summary

आपके पास अब एक complete swing trading system है जो:
1. ✅ 3 महीने का data fetch और store करता है
2. ✅ Multi-timeframe analysis करता है
3. ✅ 2-3 days holding के लिए trades generate करता है
4. ✅ Trades को continuously monitor करता है
5. ✅ Target hit पर profit book करता है
6. ✅ Analysis deteriorate होने पर exit करता है
7. ✅ Trailing stop manage करता है
8. ✅ Time-based exit handle करता है

**API Base URL**: `http://localhost:8000/api/v1/swing/`
