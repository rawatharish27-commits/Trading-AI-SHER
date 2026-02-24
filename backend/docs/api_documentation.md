# Trading AI SHER - API Documentation

## Overview

Trading AI SHER is a production-grade AI-powered trading system that generates SMC (Smart Money Concept) based trading signals using real market data from Angel One API.

## API Versioning

The Trading AI SHER API uses semantic versioning with the following format:

- **Current Version**: v1 (stable)
- **Version Header**: `X-API-Version: v1`
- **Deprecation Notice**: Headers included for deprecated versions

### Version Headers

All API responses include version information:

```
X-API-Version: v1
X-API-Current-Version: 4.5.0
```

### Deprecation Warnings

When using deprecated API versions, additional headers are included:

```
X-API-Deprecated: true
X-API-Deprecation-Message: API version v0 is deprecated. Please migrate to v1.
X-API-Deprecation-Date: 2024-12-31
X-API-Sunset: 2025-06-30
```

### Migration Guide

#### From v0 to v1
- Update endpoint paths from `/api/signals/` to `/api/v1/signals/`
- Authentication now requires version-specific headers
- Response format includes additional metadata fields

## Authentication

All API endpoints require authentication using JWT tokens or API keys.

### JWT Authentication
```bash
Authorization: Bearer <jwt_token>
```

### API Key Authentication
```bash
X-API-Key: <api_key>
```

## Core Endpoints

### Signal Generation

#### Generate SMC Signal
Generate a new SMC-based trading signal.

**Endpoint:** `POST /api/v1/signals/generate`

**Request Body:**
```json
{
  "symbol": "RELIANCE",
  "exchange": "NSE",
  "ltf_timeframe": "15m",
  "htf_timeframe": "1h"
}
```

**Response:**
```json
{
  "id": 123,
  "trace_id": "smc_20241201_123456",
  "symbol": "RELIANCE",
  "action": "BUY",
  "direction": "LONG",
  "probability": 0.85,
  "confidence": 0.82,
  "entry_price": 2450.50,
  "stop_loss": 2420.00,
  "target_1": 2500.00,
  "strategy": "SMC",
  "market_structure": "BULLISH",
  "liquidity_sweep": true,
  "order_block": true,
  "fair_value_gap": true,
  "mtf_confirmation": true,
  "reasoning": "Bullish market structure with liquidity sweep and order block formation",
  "signal_time": "2024-12-01T10:30:00Z"
}
```

**Parameters:**
- `symbol` (string, required): Trading symbol (e.g., "RELIANCE", "TCS")
- `exchange` (string, optional): Exchange (default: "NSE")
- `ltf_timeframe` (string, optional): Lower timeframe (default: "15m")
- `htf_timeframe` (string, optional): Higher timeframe (default: "1h")

### Signal Management

#### List Signals
Get paginated list of user's signals.

**Endpoint:** `GET /api/v1/signals/`

**Query Parameters:**
- `page` (integer, optional): Page number (default: 1)
- `page_size` (integer, optional): Items per page (default: 20, max: 100)
- `symbol` (string, optional): Filter by symbol
- `action` (string, optional): Filter by action ("BUY", "SELL")
- `status` (string, optional): Filter by status

**Response:**
```json
{
  "signals": [...],
  "total": 150,
  "page": 1,
  "page_size": 20
}
```

#### Get Signal Details
Get detailed information about a specific signal.

**Endpoint:** `GET /api/v1/signals/{signal_id}`

**Response:** Signal object (same as generate response)

#### Cancel Signal
Cancel an active signal.

**Endpoint:** `POST /api/v1/signals/{signal_id}/cancel`

**Response:**
```json
{
  "message": "Signal cancelled",
  "signal_id": 123
}
```

### WebSocket Streaming

#### Market Data Stream
Real-time market data streaming.

**Endpoint:** `ws://localhost:8000/ws/market`

**Protocol:**
1. Connect and receive acknowledgment
2. Send subscription message:
```json
{
  "action": "subscribe",
  "symbols": ["RELIANCE", "TCS"],
  "mode": "LTP"
}
```

3. Receive real-time updates:
```json
{
  "type": "market_data",
  "symbol": "RELIANCE",
  "data": {
    "ltp": 2450.50,
    "change": 15.25,
    "change_percent": 0.63,
    "volume": 1250000
  },
  "timestamp": "2024-12-01T10:30:00Z"
}
```

#### Signal Stream
Real-time SMC signal streaming.

**Endpoint:** `ws://localhost:8000/ws/signals`

**Protocol:**
1. Connect and receive acknowledgment
2. Send subscription message:
```json
{
  "action": "subscribe",
  "symbols": ["RELIANCE", "TCS"],
  "strategies": ["SMC"],
  "min_quality": 0.7
}
```

3. Receive signal updates:
```json
{
  "type": "signal",
  "data": {
    "id": 123,
    "symbol": "RELIANCE",
    "action": "BUY",
    "quality_score": 0.85,
    "entry_price": 2450.50,
    "strategy": "SMC"
  },
  "timestamp": "2024-12-01T10:30:00Z"
}
```

### Health & Monitoring

#### Health Check
Basic health check endpoint.

**Endpoint:** `GET /health`

**Response:**
```json
{
  "status": "healthy",
  "service": "Trading AI SHER",
  "version": "4.5.0",
  "environment": "production"
}
```

#### Detailed Health Check
Comprehensive health check with all dependencies.

**Endpoint:** `GET /health/detailed`

**Response:**
```json
{
  "status": "healthy",
  "service": "Trading AI SHER",
  "version": "4.5.0",
  "environment": "production",
  "latency_ms": 45.2,
  "dependencies": {
    "database": {
      "status": "healthy",
      "connection_pool": 5
    },
    "redis": {
      "status": "healthy"
    }
  },
  "system": {
    "platform": "Linux",
    "python_version": "3.11.0"
  }
}
```

#### Metrics
Prometheus-compatible metrics endpoint.

**Endpoint:** `GET /metrics`

Returns Prometheus-formatted metrics for monitoring.

## SMC Components

### Market Structure Detection
- **BULLISH**: Higher highs, higher lows
- **BEARISH**: Lower highs, lower lows
- **SIDEWAYS**: Ranging market

### Liquidity Analysis
- **Liquidity Sweeps**: Institutional orders breaking key levels
- **Order Blocks**: Areas where large orders were placed
- **Fair Value Gaps**: Imbalances between price action

### Multi-Timeframe Confirmation
- **LTF**: Lower timeframe for precise entry
- **HTF**: Higher timeframe for trend bias
- **Confluence**: Agreement between timeframes

## Error Handling

All endpoints return standardized error responses:

```json
{
  "detail": "Error message",
  "error_code": "ERROR_TYPE",
  "timestamp": "2024-12-01T10:30:00Z"
}
```

### Common Error Codes
- `INVALID_SYMBOL`: Invalid trading symbol
- `MARKET_CLOSED`: Market is currently closed
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `INSUFFICIENT_PERMISSIONS`: Authentication required
- `SERVICE_UNAVAILABLE`: External service failure

## Rate Limiting

API requests are rate limited based on user tier:

- **Free**: 100 requests/hour
- **Basic**: 1,000 requests/hour
- **Premium**: 10,000 requests/hour
- **Enterprise**: 100,000 requests/hour

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## Data Formats

### Signal Quality Scores
- **0.0-0.3**: Poor setup (avoid)
- **0.3-0.6**: Moderate setup (caution)
- **0.6-0.8**: Good setup (acceptable)
- **0.8-1.0**: Excellent setup (optimal)

### Risk Levels
- **LOW**: Conservative risk parameters
- **MEDIUM**: Standard risk management
- **HIGH**: Aggressive risk parameters
- **EXTREME**: High-risk setup

## Best Practices

1. **Quality Filtering**: Only trade signals with quality_score > 0.7
2. **Risk Management**: Never risk more than 1% per trade
3. **Position Sizing**: Use proper position sizing based on stop loss distance
4. **Market Hours**: Only trade during market hours (9:15 AM - 3:30 PM IST)
5. **Monitoring**: Monitor open positions and adjust stops as needed

## SDKs and Libraries

### Python Client
```python
from sher_client import SherClient

client = SherClient(api_key="your_api_key")
signal = client.generate_signal("RELIANCE", "NSE")
```

### JavaScript Client
```javascript
import { SherClient } from 'sher-trading-api';

const client = new SherClient({ apiKey: 'your_api_key' });
const signal = await client.generateSignal('RELIANCE', 'NSE');
```

## Changelog

### v4.5.0 (Current)
- Complete SMC engine implementation
- Real-time WebSocket streaming
- Enhanced risk management
- Production-grade monitoring

### v4.0.0
- Initial SMC integration
- Multi-timeframe analysis
- Performance tracking

## Support

For API support and questions:
- **Documentation**: https://docs.sher.ai
- **API Status**: https://status.sher.ai
- **Support**: support@sher.ai

## Security

- All data is encrypted in transit and at rest
- JWT tokens expire after 24 hours
- API keys can be rotated regularly
- Comprehensive audit logging
- Rate limiting and DDoS protection
