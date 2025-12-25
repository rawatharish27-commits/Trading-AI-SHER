
# 🏛️ Technical & Risk Disclosure Statement
**System Identity**: SHER.AI Neural Node v4.5 (Sovereign)

## 1. Product Classification
This platform is a **Decision-Support Infrastructure**. It functions as an alert-generating neural engine and does not exercise discretionary authority over user capital. 

## 2. AI Decision Pipeline
1. **Ingestion**: Raw market ticks are sharded into feature vectors.
2. **Probability**: Multi-model ensemble calculates directional conviction.
3. **Gating**: 5 Institutional Priorities (Regime, Horizon, Freshness, Liquidity, Survival) audit the signal.
4. **Audit**: Decision is logged with SHA-256 hash chaining before user notification.

## 3. Risk Controls
- **Hard Stop**: 1% maximum capital risk per trade node.
- **Nuclear Halt**: Hardware-level kill switch for manual or automated system-wide termination.
- **Sector Caps**: Maximum 25% exposure to any single sector shard.

## 4. Governance & Data Protection
- **AES-256 Encryption**: Client-side encryption for all broker credentials.
- **RLS Security**: Database-level isolation between tenant nodes.
- **Model Registry**: Canonical version tracking to prevent unauthorized logic injection.

---
*Authorized for Regulator Submission: compliance@sher.ai*
