# 🚀 GCP Sovereign Deployment Guide (v4.5)

Institutional protocol for deploying the Sher AI Trading Backend with WAF protection.

## 🔹 1. Interactive Orchestration
Run the automated script to execute the 10-step plan:
```bash
chmod +x deploy.sh
./deploy.sh
```

## 🔹 2. Production Hardening (Cloud Armor & WAF)
Standard institutional protection via External Load Balancer.

1. **NEG Creation**: `gcloud compute network-endpoint-groups create sher-run-neg --region=asia-south1 --network-endpoint-type=serverless --cloud-run-service=sher-api`
2. **Backend Service**: `gcloud compute backend-services create sher-backend --global --load-balancing-scheme=EXTERNAL --protocol=HTTP`
3. **Attach NEG**: `gcloud compute backend-services add-backend sher-backend --global --network-endpoint-group=sher-run-neg --network-endpoint-group-region=asia-south1`
4. **Cloud Armor Policy**: `gcloud compute security-policies create sher-waf-policy --description="WAF for Sher AI"`
5. **OWASP Protection**: 
   - `gcloud compute security-policies rules create 1000 --security-policy sher-waf-policy --expression "evaluatePreconfiguredExpr('xss-stable')" --action deny-403`
   - `gcloud compute security-policies rules create 1001 --security-policy sher-waf-policy --expression "evaluatePreconfiguredExpr('sqli-stable')" --action deny-403`
6. **Rate Limiting**: `gcloud compute security-policies rules create 2000 --security-policy sher-waf-policy --expression "true" --action throttle --rate-limit-threshold-count 100 --rate-limit-threshold-interval-sec 60 --conform-action allow --exceed-action deny-429`

## 🔹 3. Monitoring & SRE
Enable Cloud Operations suite to track node health:
1. **Enable API**: `gcloud services enable monitoring.googleapis.com`
2. **Apply Policies**: Import `MONITORING_ALERT_RULES.json` via the Cloud Console.
3. **Uptime Check**: `gcloud monitoring uptime-checks create http sher-api-uptime --display-name="Sher API Uptime" --resource-type=uptime-url --uri=https://yourdomain.com/health`

---
*Audit Status: INSTITUTIONAL HARDENED*