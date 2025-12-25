
# 🦁 SHER AI - Production Go-Live Runbook

This guide outlines the critical path for deploying the Sher AI Trading Infrastructure to a production environment.

## 1. Environment Identity Checklist
Ensure the following variables are provisioned in your production Secret Manager:

### 🧠 Neural Core (Gemini)
- `API_KEY`: Your Google Gemini API Key. Ensure it has "Gemini 3 Pro/Flash" models enabled.

### 🔌 Execution Bridge (Angel One SmartAPI)
- `RAZORPAY_KEY_ID`: Live key for Indian payment settlement.
- `RAZORPAY_KEY_SECRET`: Private webhook secret.
- `ANGEL_ONE_CLIENT_ID`: Institutional client ID.
- `ANGEL_ONE_API_KEY`: Production SmartAPI private key.

### 🔐 Auth & Security
- `NEXTAUTH_SECRET`: RS256/HS256 compliant random string.
- `NEXTAUTH_URL`: Canonical production URL (HTTPS).
- `JWT_SECRET`: Separate key for sharding and 2FA tokens.
- `DATABASE_URL`: Production PostgreSQL URI (AWS RDS / GCP CloudSQL recommended).

---

## 2. Infrastructure Hardening

### 🛡️ Database Migration
Run the following command to synchronize the Neural core with your production SQL node:
```bash
npx prisma db push
```

### 🕸️ Webhook Verification
Configure Razorpay/Stripe webhooks to point to:
`https://your-domain.com/api/payment/[gateway]/webhook`
Ensure only TLS 1.2+ traffic is accepted.

### 🧊 Kill Switch Configuration
Navigate to **Admin Panel > Governance** and verify that "Automated Execution" is `DISABLED` by default for the first 24 hours of go-live.

---

## 3. Deployment Protocol

### 📦 Docker Deployment
Sher AI is fully containerized. Deploy the stack using:
```bash
docker-compose -f docker-compose.prod.yml up -d --build
```

### 🩺 Post-Deployment Health Checks
1. **Neural Link**: Login as `admin@sher-ai.com` and verify the "Master Brain Telemetry" log on the dashboard.
2. **Broker Heartbeat**: Open the **Vault** and perform a "Connection Handshake" test.
3. **Analytics Sync**: Verify the **Admin Analytics** charts are populating via the consolidated metrics API.

---

## 4. Operational Guardrails (Rule 101)
- **Daily Audit**: Review `Admin > Audit Log` for any `CRITICAL` sharding failures or risk breaches.
- **Quota Monitoring**: Monitor the `UsageTracker` logs to ensure ELITE users are not hitting rate-limiters unnecessarily.
- **Ethics Shield**: Ensure the `EthicsGuard` is active in the `TechnicalEngine` to prevent overfitted trades in high-volatility regimes.

---
*Institutional-grade deployment verified. Master Node Ready.*
