# Trading AI SHER - User Guide

## Overview

Trading AI SHER is an enterprise-grade AI-powered trading system that generates Smart Money Concept (SMC) based trading signals. This guide will help you understand how to use the system effectively for profitable trading.

## What is SMC Trading?

Smart Money Concept (SMC) is a price action trading methodology that identifies institutional order flow and market maker activity. Unlike traditional technical analysis, SMC focuses on:

- **Market Structure**: Identifying trend direction through swing highs/lows
- **Liquidity**: Finding areas where large orders are placed
- **Order Blocks**: Zones where institutional orders were executed
- **Fair Value Gaps**: Price imbalances that need to be filled

## Getting Started

### Account Setup
1. Register for an account at https://sher.ai
2. Complete KYC verification (required for live trading)
3. Choose your subscription plan:
   - **Free**: 100 signals/month, basic analytics
   - **Basic**: 1,000 signals/month, advanced analytics
   - **Premium**: 10,000 signals/month, real-time alerts
   - **Enterprise**: Unlimited signals, custom integrations

### API Access
```bash
# Get your API key from the dashboard
curl -X POST "https://api.sher.ai/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"your@email.com","password":"yourpassword"}'
```

## Understanding SMC Signals

### Signal Components

Each SMC signal contains:

```json
{
  "direction": "BUY",
  "entry_price": 2450.50,
  "stop_loss": 2420.00,
  "target_price": 2500.00,
  "quality_score": 0.85,
  "confidence": "HIGH",
  "market_structure": "BULLISH",
  "liquidity_sweep": true,
  "order_block": true,
  "fair_value_gap": true,
  "mtf_confirmation": true
}
```

### Quality Score Interpretation

- **0.8-1.0 (Excellent)**: High-probability setup, strong confluence
- **0.6-0.8 (Good)**: Solid setup with good confluence
- **0.4-0.6 (Moderate)**: Acceptable setup, monitor closely
- **0.0-0.4 (Poor)**: Weak setup, avoid trading

### Confidence Levels

- **HIGH**: All SMC components aligned, strong setup
- **MEDIUM**: Most components aligned, good setup
- **LOW**: Some components missing, higher risk

## Trading Strategies

### Conservative Strategy (Recommended for Beginners)
- Only trade signals with quality_score > 0.7
- Risk no more than 1% of capital per trade
- Use provided stop loss levels
- Target minimum 1:2 risk-reward ratio

### Aggressive Strategy (Advanced Traders)
- Trade signals with quality_score > 0.6
- Risk up to 2% of capital per trade
- Scale into positions
- Use trailing stops

### Scalping Strategy
- Focus on 5-minute and 15-minute timeframes
- Trade signals with quality_score > 0.8
- Quick entries and exits (5-15 minute holds)
- Strict 1:1.5 risk-reward minimum

## Risk Management

### Position Sizing
```python
def calculate_position_size(capital, risk_percent, entry_price, stop_loss):
    risk_amount = capital * (risk_percent / 100)
    stop_distance = abs(entry_price - stop_loss)
    position_size = risk_amount / stop_distance
    return position_size
```

### Portfolio Risk Limits
- **Maximum capital per trade**: 2%
- **Maximum daily loss**: 5%
- **Maximum weekly loss**: 10%
- **Maximum open positions**: 5

### Stop Loss Placement
- **Always use the provided stop loss**
- **Never move stops against the trade**
- **Consider trailing stops after 1:1 reward**

## Market Conditions

### Best Trading Times
- **Pre-market**: 9:00 AM - 9:15 AM IST
- **Main session**: 9:15 AM - 3:30 PM IST
- **Avoid**: First 15 minutes after open, last 30 minutes

### Market Regimes
- **Trending**: Best for SMC signals (50-65% win rate)
- **Sideways**: Reduced accuracy, avoid large positions
- **Panic**: High volatility, use smaller position sizes

### Symbol Selection
- **Large Cap**: RELIANCE, TCS, HDFC, INFY (high liquidity)
- **Mid Cap**: Avoid during volatile periods
- **Avoid**: Low volume stocks, penny stocks

## Real-Time Features

### WebSocket Streaming
```javascript
const ws = new WebSocket('wss://api.sher.ai/ws/signals');

ws.onmessage = (event) => {
  const signal = JSON.parse(event.data);
  if (signal.quality_score > 0.8) {
    executeTrade(signal);
  }
};
```

### Market Data Streaming
```javascript
const marketWs = new WebSocket('wss://api.sher.ai/ws/market');

marketWs.onmessage = (event) => {
  const data = JSON.parse(event.data);
  updatePriceChart(data);
};
```

## Performance Analytics

### Win Rate by Setup Type
- **Bullish Break of Structure**: 55-60%
- **Bearish Break of Structure**: 55-60%
- **Order Block Rejections**: 50-55%
- **Liquidity Sweeps**: 60-65%

### Average Holding Time
- **Scalping**: 5-15 minutes
- **Day Trading**: 1-4 hours
- **Swing Trading**: 1-3 days

### Risk-Reward Ratios
- **Conservative**: 1:1.5 minimum
- **Moderate**: 1:2 average
- **Aggressive**: 1:3+ possible

## Common Mistakes to Avoid

### 1. Overtrading
- Don't trade every signal
- Quality over quantity
- Respect your risk limits

### 2. Ignoring Stop Losses
- Always use stops
- Never remove stops to "let winners run"
- Accept losses as part of trading

### 3. Revenge Trading
- After a loss, wait for high-quality setups
- Don't increase position sizes to recover losses
- Stick to your trading plan

### 4. Trading Without a Plan
- Have predefined entry/exit criteria
- Know your risk parameters before entering
- Document your trades and review regularly

## Advanced Features

### Custom Alerts
Set up alerts for specific conditions:
```json
{
  "symbol": "RELIANCE",
  "min_quality": 0.8,
  "direction": "BUY",
  "max_price": 2500.00
}
```

### Portfolio Integration
Connect your broker account for automated execution:
- Zerodha, Upstox, Angel One integration
- One-click execution from signals
- Automatic position sizing

### Backtesting
Test strategies on historical data:
```python
from sher_client import SherClient

client = SherClient(api_key="your_key")
results = client.backtest("RELIANCE", "2024-01-01", "2024-03-31")
print(f"Win Rate: {results['win_rate']:.1%}")
```

## Troubleshooting

### Signal Quality Issues
- **Low quality scores**: Market conditions may not be favorable
- **No signals**: Check market hours and symbol liquidity
- **Delayed signals**: Network latency or high server load

### API Issues
- **Rate limiting**: Upgrade plan or reduce request frequency
- **Authentication errors**: Check API key validity
- **Connection issues**: Use WebSocket reconnection logic

### Trading Performance
- **Losing streaks**: Review recent trades, reduce position sizes
- **Poor win rate**: Focus on higher quality signals only
- **Emotional trading**: Take breaks, stick to the plan

## Support and Resources

### Getting Help
- **Documentation**: https://docs.sher.ai
- **API Reference**: https://api.sher.ai/docs
- **Community Forum**: https://community.sher.ai
- **Email Support**: support@sher.ai

### Educational Resources
- **SMC Basics Course**: Learn SMC fundamentals
- **Strategy Guides**: Detailed trading strategies
- **Video Tutorials**: Step-by-step tutorials
- **Webinars**: Live trading sessions

### Performance Dashboard
Monitor your trading performance:
- Win rate by strategy
- Risk-adjusted returns
- Drawdown analysis
- Trade timing analysis

## Compliance and Legal

### Regulatory Compliance
- SEBI registered investment advisor
- All signals for educational purposes only
- No guaranteed returns
- Past performance not indicative of future results

### Risk Disclosure
Trading involves substantial risk of loss. Only trade with money you can afford to lose. Always do your own research and consult with financial advisors.

### Terms of Service
- Read and understand terms before trading
- API usage subject to fair use policy
- Account suspension for policy violations

## Conclusion

Trading AI SHER provides institutional-grade SMC analysis to retail traders. Success depends on:

1. **Discipline**: Follow the rules consistently
2. **Risk Management**: Never risk more than you can lose
3. **Continuous Learning**: Study market behavior and adapt
4. **Patience**: Wait for high-quality setups

Remember: Trading is a marathon, not a sprint. Focus on consistent, profitable trading over time rather than quick riches.

---

*This guide is for educational purposes only and does not constitute financial advice. Trading involves risk and you may lose money.*
