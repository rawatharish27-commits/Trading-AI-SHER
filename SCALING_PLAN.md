
# 📈 SHER AI - Infrastructure Scaling Plan

## 1. Load Testing Targets (k6 Results)
- **Concurrent Users**: 10,000 (Targeting 500ms p95).
- **WS Connections**: 1,000 active tickers per Node.
- **Database Reads**: 500/sec (Scaled via Read Replicas).

## 2. Horizontal Scaling Protocol
- **Web Tier**: Auto-scale based on CPU > 60%. (Cloud Run max 50 instances).
- **Socket Tier**: Dedicated Nginx WebSocket Load Balancer. Use Redis Pub/Sub for cross-node tick broadcast.
- **Worker Tier**: Separate Node.js process for Heavy AI Inference (Gemini) to prevent UI block.

## 3. Auto-Scaling Triggers
| Metric | Threshold | Action |
| --- | --- | --- |
| CPU Usage | > 65% | Spin up new Node |
| Memory Usage | > 80% | Scale Up Instance Size |
| WS Error Rate | > 2% | Reset Gateway Shards |
| API Latency | > 800ms | Scale DB Write Node |

---
*Optimized for Institutional Grade Throughput.*
