# 🤖 Trading AI SHER - Single Admin System

## ✅ Single User Mode - Simplified!

Ab system sirf **ADMIN** ke liye hai. Koi authentication nahi, koi multi-user complexity nahi!

---

## 📱 Quick Start API Endpoints

### Dashboard (Sab kuch ek jagah)
```
GET /admin/dashboard
```

### Auto Trading Control
```
GET  /admin/auto/status      → Current status
POST /admin/auto/enable      → Start auto trading
POST /admin/auto/disable     → Stop auto trading
```

### Capital Management
```
GET  /admin/capital          → Current capital
POST /admin/capital          → Update capital
```

### Trades
```
GET  /admin/trades/active    → Active trades
GET  /admin/trades/history   → Trade history
POST /admin/trades/manual    → Manual trade
POST /admin/trades/{id}/exit → Exit trade
```

### Signals
```
GET /admin/signals/{symbol}  → Get signal for symbol
```

### Symbols
```
GET    /admin/symbols           → Tracked symbols
POST   /admin/symbols           → Update symbols
POST   /admin/symbols/{symbol}  → Add symbol
DELETE /admin/symbols/{symbol}  → Remove symbol
```

### Risk Management
```
GET  /admin/risk                        → Risk status
POST /admin/risk/kill-switch/activate   → Stop all trading
POST /admin/risk/kill-switch/deactivate → Resume trading
```

### Configuration
```
GET  /admin/config   → Current config
POST /admin/config   → Update config
```

---

## ⚙️ Admin Configuration (.env)

```bash
# Capital
TOTAL_CAPITAL=100000
MAX_RISK_PER_TRADE=0.02     # 2%
MAX_DAILY_LOSS=0.02         # 2%
MAX_DRAWDOWN=0.10           # 10%

# Auto Trading
AUTO_TRADE_ENABLED=true
AUTO_TRADE_CONFIDENCE_THRESHOLD=0.75
AUTO_TRADE_MAX_POSITIONS=5
AUTO_TRADE_CAPITAL_PER_TRADE=0.05

# Symbols to Track
TRACKED_SYMBOLS=RELIANCE,TCS,HDFC,INFY,ICICI,SBIN

# Notifications
TELEGRAM_BOT_TOKEN=your_token
TELEGRAM_CHAT_ID=your_chat_id
```

---

## 🚀 Deploy Commands

```bash
# Start
docker-compose up -d

# Check status
curl http://localhost:8000/health

# Admin Dashboard
curl http://localhost:8000/admin/dashboard

# Enable Auto Trading
curl -X POST http://localhost:8000/admin/auto/enable
```

---

## 📊 In-Memory State

Sab kuch memory mein track hota hai:

- `total_capital` - Total trading capital
- `daily_pnl` - Today's P&L
- `weekly_pnl` - Weekly P&L
- `open_positions` - Current positions
- `current_drawdown` - Drawdown percentage
- `kill_switch_active` - Trading enabled/disabled

---

## 🔥 No Authentication Required

Direct access:
- No login needed
- No JWT tokens
- No user management
- Single admin user only

Just open the API and use it!

---

## 🎯 Example Usage

### Get Signal for RELIANCE
```bash
curl http://localhost:8000/admin/signals/RELIANCE
```

### Execute Manual Trade
```bash
curl -X POST http://localhost:8000/admin/trades/manual \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "RELIANCE",
    "side": "LONG",
    "quantity": 50,
    "entry_price": 2450,
    "stop_loss": 2400,
    "target_1": 2500
  }'
```

### Check Active Trades
```bash
curl http://localhost:8000/admin/trades/active
```

---

**Single User. Single Admin. Full Control.** 🚀
