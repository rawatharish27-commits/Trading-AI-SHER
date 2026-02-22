# 🐍 Trading AI SHER - Python Backend

Enterprise-Grade AI-Powered Trading System

## 🚀 Quick Start

```bash
# Install dependencies
pip install -r requirements.txt

# Copy environment file
cp .env.example .env

# Run the server
python run.py
```

## 📁 Project Structure

```
backend/
├── app/
│   ├── api/
│   │   └── v1/
│   │       └── endpoints/     # API endpoints
│   │           ├── auth.py    # Authentication
│   │           ├── signals.py # AI signals
│   │           ├── orders.py  # Order management
│   │           ├── portfolio.py
│   │           └── market.py
│   ├── core/                  # Core configuration
│   │   ├── config.py
│   │   ├── database.py
│   │   └── security.py
│   ├── engines/               # Trading engines
│   │   ├── probability_engine.py
│   │   ├── risk_engine.py
│   │   └── strategy_ensemble.py
│   ├── brokers/               # Broker integrations
│   │   └── angel_one.py
│   ├── models/                # SQLAlchemy models
│   ├── schemas/               # Pydantic schemas
│   ├── services/              # Business services
│   └── utils/                 # Utilities
├── alembic/                   # Database migrations
├── tests/                     # Test suite
└── requirements.txt
```

## 🔧 Configuration

Edit `.env` file:

```env
# Database
DATABASE_URL=sqlite+aiosqlite:///./sher.db

# Security
SECRET_KEY=your-secret-key

# Angel One Broker
ANGEL_ONE_API_KEY=your_key
ANGEL_ONE_CLIENT_ID=your_id
ANGEL_ONE_PASSWORD=your_password
ANGEL_ONE_TOTP_SECRET=your_totp
```

## 📚 API Documentation

- Swagger UI: http://localhost:8000/api/docs
- ReDoc: http://localhost:8000/api/redoc

## 🏗️ Architecture

### Trading Engines

1. **Probability Engine V3**
   - Calibrated probability calculation
   - Multi-factor analysis
   - Regime-adjusted penalties

2. **Risk Management System (5 Layers)**
   - Position Sizing
   - Stop Loss
   - Correlation
   - Firm Risk
   - Survival Guard

3. **Strategy Ensemble**
   - VWAP Trend
   - RSI Extreme
   - Momentum
   - Weighted voting

### Broker Integration

- Angel One SmartAPI
- WebSocket streaming
- Order management
- Market data

## 🧪 Testing

```bash
# Run tests
pytest

# With coverage
pytest --cov=app
```

## 📝 License

MIT License
