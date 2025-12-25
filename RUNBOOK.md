
# 🦁 SHER AI - Production Deployment Runbook

## 1. Environment Preparation
- Provision AWS/GCP instance with 4 vCPU, 8GB RAM minimum.
- Database: RDS PostgreSQL (Engine 15.x).
- Cache: ElastiCache Redis for WebSocket Pub/Sub.

## 2. Secrets Inventory
Set the following in your Secret Manager:
```bash
# Core
API_KEY=your_gemini_pro_key
NEXTAUTH_SECRET=generate_strong_secret

# Execution Bridge
ANGEL_ONE_CLIENT_ID=...
ANGEL_ONE_API_KEY=...
RAZORPAY_KEY_ID=...
RAZORPAY_WEBHOOK_SECRET=...
```

## 3. Deployment Steps
1. **Containerize**: `docker build -t sher-ai-prod .`
2. **Migrate DB**: `npx prisma db push --accept-data-loss`
3. **Initialize Admin**: Create user with `role: ADMIN` in SQL.
4. **Boot**: `docker run -p 3000:3000 --env-file .env.prod sher-ai-prod`

## 4. Post-Boot Checklist
- [ ] Verify `wss://` handshake for terminal charts.
- [ ] Test Razorpay webhook with `razorpay-cli`.
- [ ] Check Admin Governance to ensure "Automated Execution" is toggled OFF initially.
- [ ] Verify Gemini 3 Pro model availability via `/api/agent/analyze-symbol`.

---
*Status: Ready for Global Node Propagation.*
