# 📚 TRADING AI SHER - COMPREHENSIVE DEPLOYMENT GUIDE

## 📋 TABLE OF CONTENTS

1. [PREREQUISITES](#prerequisites)
2. [LOCAL DEPLOYMENT](#local-deployment)
3. [CLOUD DEPLOYMENT (GCP)](#cloud-deployment)
4. [PRODUCTION CHECKLIST](#production-checklist)
5. [TROUBLESHOOTING](#troubleshooting)
6. [MONITORING](#monitoring)
7. [ROLLBACK PROCEDURES](#rollback-procedures)

---

## 📋 PREREQUISITES

### **System Requirements**

#### **Minimum Requirements:**
- CPU: 2 cores
- RAM: 4 GB
- Storage: 20 GB
- OS: Ubuntu 20.04+, macOS 12+, Windows 10+ (WSL2)

#### **Recommended Requirements:**
- CPU: 4+ cores
- RAM: 8+ GB
- Storage: 50+ GB SSD
- OS: Ubuntu 22.04 LTS

### **Software Requirements**

#### **Mandatory:**
- [ ] Node.js 20.x
- [ ] Bun 1.x
- [ ] Docker 24.x
- [ ] Docker Compose 3.x
- [ ] Git 2.x

#### **For Cloud Deployment:**
- [ ] Google Cloud SDK (gcloud)
- [ ] GCP Project with billing enabled
- [ ] Domain name (optional but recommended)

### **Service Accounts Required**

#### **GCP Service Accounts:**
- [ ] Cloud Build Service Account
- [ ] Cloud Run Service Account
- [ ] Cloud Scheduler Service Account
- [ ] Secret Manager Service Account
- [ ] IAM Permissions configured

#### **External Services:**
- [ ] Gemini API Key
- [ ] Angel One Broker Credentials (for live trading)
- [ ] Stripe Account (for monetization)
- [ ] Google OAuth Client ID (for authentication)
- [ ] Redis (or compatible) for rate limiting

---

## 🚀 LOCAL DEPLOYMENT

### **PHASE 1: ENVIRONMENT SETUP**

#### **Step 1: Clone Repository**

```bash
# Clone the repository
git clone https://github.com/rawatharish27-commits/Trading-AI-SHER.git
cd Trading-AI-SHER

# Verify files
ls -la
```

#### **Step 2: Create Environment File**

```bash
# Copy environment template
cp .env.prod.template .env

# Edit environment file with your values
nano .env
```

**Required Variables:**
```bash
# Server Configuration
NODE_ENV=production
PORT=8080

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/sher_db

# AI Service
GEMINI_API_KEY=your-gemini-api-key-here

# Broker (Optional - for live trading)
ANGEL_ONE_API_KEY=your-angel-one-api-key
ANGEL_ONE_CLIENT_ID=your-client-id
ANGEL_ONE_PASSWORD=your-password
ANGEL_ONE_TOTP_SECRET=your-totp-secret

# Market Mode
NEXT_PUBLIC_MARKET_MODE=PAPER  # PAPER for demo, LIVE for real trading

# Authentication
NEXTAUTH_SECRET=generate-strong-secret-min-32-chars
NEXTAUTH_URL=http://localhost:8080

# JWT
JWT_SECRET=another-strong-secret-min-32-chars

# Rate Limiting
REDIS_URL=redis://localhost:6379

# Stripe (Optional - for monetization)
STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key
STRIPE_SECRET_KEY=your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret
```

#### **Step 3: Install Dependencies**

```bash
# Using Bun (Recommended)
bun install

# Or using npm
npm install
```

### **PHASE 2: DATABASE SETUP**

#### **Option A: PostgreSQL (Recommended)**

```bash
# Start PostgreSQL using Docker
docker run --name trading-ai-sher-postgres \
  -e POSTGRES_USER=sher_user \
  -e POSTGRES_PASSWORD=sher_password \
  -e POSTGRES_DB=sher_db \
  -p 5432:5432 \
  -v postgres-data:/var/lib/postgresql/data \
  -d postgres:15-alpine

# Verify PostgreSQL is running
docker ps | grep postgres

# Wait for PostgreSQL to be ready (10-20 seconds)
sleep 15

# Test connection
docker exec -it trading-ai-sher-postgres psql -U sher_user -d sher_db -c "SELECT 1;"

# Run database migrations
bun run db:push
```

#### **Option B: SQLite (Development)**

```bash
# Create data directory
mkdir -p data

# Run database migrations
bun run db:push

# Verify database created
ls -lh data/
```

### **PHASE 3: BUILD APPLICATION**

```bash
# Build for production
bun run build

# Verify build output
ls -lh .next/static
ls -lh .next/server
```

### **PHASE 4: START DEPENDENT SERVICES**

#### **Option A: Using Docker Compose (Recommended)**

```bash
# Create data directories
mkdir -p data logs db

# Start all services
docker-compose -f docker-compose.prod.yml up -d

# Verify services are running
docker-compose -f docker-compose.prod.yml ps

# Check logs
docker-compose -f docker-compose.prod.yml logs -f app
```

#### **Option B: Manual Service Start**

```bash
# Start Redis
docker run --name trading-ai-sher-redis \
  -p 6379:6379 \
  -v redis-data:/data \
  -d redis:7-alpine

# Verify Redis is running
docker ps | grep redis

# Test Redis connection
docker exec -it trading-ai-sher-redis redis-cli ping
```

### **PHASE 5: START APPLICATION**

#### **Option A: Using Docker Compose**

```bash
# Application is already started with docker-compose up -d

# Check logs
docker-compose -f docker-compose.prod.yml logs -f app

# Verify health check
curl http://localhost:8080/api/health
```

#### **Option B: Manual Start**

```bash
# Make startup script executable
chmod +x scripts/start-prod.sh

# Start application
./scripts/start-prod.sh

# Or start directly
NODE_ENV=production bun run start
```

### **PHASE 6: VERIFY DEPLOYMENT**

```bash
# Test health endpoint
curl http://localhost:8080/api/health

# Expected response:
# {
#   "status": "OK",
#   "timestamp": "2025-01-15T10:00:00.000Z",
#   "uptime": 60.0,
#   "diagnostics": {
#     "database": "OK",
#     "ai": "OK",
#     "broker": "OK"
#   }
# }

# Test AI analysis endpoint
curl -X POST http://localhost:8080/api/ai/analyze \
  -H "Content-Type: application/json" \
  -d '{"symbol":"RELIANCE","capital":1000000}'

# Test admin dashboard
curl http://localhost:8080/admin

# Open browser
open http://localhost:8080
```

---

## ☁️ CLOUD DEPLOYMENT (GCP)

### **PHASE 1: GCP PROJECT SETUP**

#### **Step 1: Create GCP Project**

```bash
# Authenticate with gcloud
gcloud auth login

# Create new project
gcloud projects create trading-ai-sher-prod \
  --name="Trading AI SHER Production" \
  --organization=YOUR_ORG_ID

# Set default project
gcloud config set project trading-ai-sher-prod

# Verify project
gcloud projects list
```

#### **Step 2: Enable Required APIs**

```bash
# Enable Cloud Build API
gcloud services enable cloudbuild.googleapis.com

# Enable Cloud Run API
gcloud services enable run.googleapis.com

# Enable Cloud Scheduler API
gcloud services enable cloudscheduler.googleapis.com

# Enable Cloud Secret Manager API
gcloud services enable secretmanager.googleapis.com

# Enable Cloud Functions API
gcloud services enable cloudfunctions.googleapis.com

# Enable Container Registry API
gcloud services enable containerregistry.googleapis.com

# Verify APIs
gcloud services list
```

### **PHASE 2: SERVICE ACCOUNT SETUP**

#### **Step 1: Create Service Account**

```bash
# Create service account for Cloud Build
gcloud iam service-accounts create cloudbuild-sa \
  --display-name="Cloud Build Service Account" \
  --project=trading-ai-sher-prod

# Create service account for Cloud Run
gcloud iam service-accounts create cloudrun-sa \
  --display-name="Cloud Run Service Account" \
  --project=trading-ai-sher-prod

# Create service account for Cloud Scheduler
gcloud iam service-accounts create scheduler-sa \
  --display-name="Cloud Scheduler Service Account" \
  --project=trading-ai-sher-prod
```

#### **Step 2: Grant IAM Permissions**

```bash
# Grant Cloud Build Service Account roles
# roles/cloudbuild.builds.builder
# roles/cloudbuild.serviceAgent
# roles/secretmanager.secretAccessor
# roles/logging.logWriter
# roles/storage.objectAdmin

# Grant Cloud Run Service Account roles
# roles/run.invoker
# roles/secretmanager.secretAccessor
# roles/logging.logWriter

# Grant Cloud Scheduler Service Account roles
# roles/cloudscheduler.admin
# roles/run.invoker
```

#### **Step 3: Create and Download Service Account Keys**

```bash
# Create key for Cloud Build Service Account
gcloud iam service-accounts keys create cloudbuild-sa \
  --iam-account=cloudbuild-sa@trading-ai-sher-prod.iam.gserviceaccount.com \
  --key-file-type=json \
  --project=trading-ai-sher-prod

# Save JSON key securely (DO NOT COMMIT TO GIT)
mv *.json ~/.config/gcloud/cloudbuild-key.json
chmod 600 ~/.config/gcloud/cloudbuild-key.json
```

### **PHASE 3: SECRET MANAGER SETUP**

#### **Step 1: Create Secrets**

```bash
# Create Gemini API Key secret
echo "your-gemini-api-key-here" | \
  gcloud secrets versions create gemini-api-key \
  --data-file=- \
  --project=trading-ai-sher-prod

# Create Angel One secrets
echo "your-angel-one-api-key-here" | \
  gcloud secrets versions create angel-one-api-key \
  --data-file=- \
  --project=trading-ai-sher-prod

echo "your-angel-one-client-id-here" | \
  gcloud secrets versions create angel-one-client-id \
  --data-file=- \
  --project=trading-ai-sher-prod

echo "your-angel-one-password-here" | \
  gcloud secrets versions create angel-one-password \
  --data-file=- \
  --project=trading-ai-sher-prod

echo "your-angel-one-totp-secret-here" | \
  gcloud secrets versions create angel-one-totp-secret \
  --data-file=- \
  --project=trading-ai-sher-prod

# Create NextAuth secret
echo "your-nextauth-secret-here" | \
  gcloud secrets versions create nextauth-secret \
  --data-file=- \
  --project=trading-ai-sher-prod

# Create JWT secret
echo "your-jwt-secret-here" | \
  gcloud secrets versions create jwt-secret \
  --data-file=- \
  --project=trading-ai-sher-prod

# Create Stripe secrets
echo "your-stripe-secret-key-here" | \
  gcloud secrets versions create stripe-secret-key \
  --data-file=- \
  --project=trading-ai-sher-prod

# Create Redis URL secret
echo "redis://your-redis-host:6379" | \
  gcloud secrets versions create redis-url \
  --data-file=- \
  --project=trading-ai-sher-prod

# Create database URL secret
echo "postgresql://user:password@host:port/db" | \
  gcloud secrets versions create database-url \
  --data-file=- \
  --project=trading-ai-sher-prod

# Verify secrets
gcloud secrets list --project=trading-ai-sher-prod
```

#### **Step 2: Grant Secret Access Permissions**

```bash
# Grant Cloud Build Service Account access to secrets
gcloud secrets add-iam-policy-binding gemini-api-key \
  --member="serviceAccount:cloudbuild-sa@trading-ai-sher-prod.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor" \
  --project=trading-ai-sher-prod

# Grant Cloud Run Service Account access to secrets
for secret in gemini-api-key angel-one-api-key angel-one-client-id angel-one-password angel-one-totp-secret nextauth-secret jwt-secret stripe-secret-key redis-url database-url; do
  gcloud secrets add-iam-policy-binding $secret \
    --member="serviceAccount:cloudrun-sa@trading-ai-sher-prod.iam.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor" \
    --project=trading-ai-sher-prod
done
```

### **PHASE 4: BUILD AND DEPLOY**

#### **Step 1: Configure Cloud Build**

```bash
# Upload service account key to Cloud Build
gcloud kms keys encrypt \
  --location=global \
  --keyring=cloudbuild-keyring \
  --keyfile=~/.config/gcloud/cloudbuild-key.json \
  --ciphertext-file=encrypted-key.txt \
  --project=trading-ai-sher-prod

# Set encrypted key as environment variable for Cloud Build
export _JSON_KEY=$(cat encrypted-key.txt | base64 -w 0)
```

#### **Step 2: Submit Cloud Build**

```bash
# Submit build to Cloud Build
gcloud builds submit \
  --config cloudbuild.prod.yaml \
  --substitutions=PROJECT_ID=trading-ai-sher-prod,SHORT_SHA=$(git rev-parse --short HEAD) \
  --project=trading-ai-sher-prod

# Monitor build progress
gcloud builds log $(gcloud builds list --limit=1 --format='value(id)' --project=trading-ai-sher-prod) \
  --project=trading-ai-sher-prod
```

#### **Step 3: Deploy to Cloud Run**

```bash
# Wait for build to complete, then deploy
gcloud run deploy trading-ai-sher \
  --image=gcr.io/trading-ai-sher-prod/trading-ai-sher:latest \
  --platform=managed \
  --region=us-central1 \
  --allow-unauthenticated \
  --set-env-vars=NODE_ENV=production \
  --set-secrets=GEMINI_API_KEY=gemini-api-key:latest \
  --set-secrets=ANGEL_ONE_API_KEY=angel-one-api-key:latest \
  --set-secrets=ANGEL_ONE_CLIENT_ID=angel-one-client-id:latest \
  --set-secrets=ANGEL_ONE_PASSWORD=angel-one-password:latest \
  --set-secrets=ANGEL_ONE_TOTP_SECRET=angel-one-totp-secret:latest \
  --set-secrets=NEXTAUTH_SECRET=nextauth-secret:latest \
  --set-secrets=JWT_SECRET=jwt-secret:latest \
  --set-secrets=STRIPE_SECRET_KEY=stripe-secret-key:latest \
  --set-secrets=REDIS_URL=redis-url:latest \
  --set-secrets=DATABASE_URL=database-url:latest \
  --project=trading-ai-sher-prod

# Verify deployment
gcloud run services describe trading-ai-sher \
  --region=us-central1 \
  --project=trading-ai-sher-prod
```

### **PHASE 5: DOMAIN CONFIGURATION**

#### **Step 1: Set Custom Domain**

```bash
# Map custom domain to Cloud Run service
gcloud run domain-mappings create \
  --service=trading-ai-sher \
  --domain=app.trading-ai-sher.com \
  --region=us-central1 \
  --project=trading-ai-sher-prod

# Verify domain mapping
gcloud run domain-mappings list \
  --service=trading-ai-sher \
  --region=us-central1 \
  --project=trading-ai-sher-prod
```

#### **Step 2: Update DNS**

```bash
# Get DNS verification details
gcloud run domain-mappings describe app.trading-ai-sher.com \
  --region=us-central1 \
  --project=trading-ai-sher-prod

# Add DNS records to your domain registrar
# 1. Create A record
#    Type: A
#    Name: app
#    Value: (Cloud Run load balancer IP)
#    TTL: 300
#
# 2. Create TXT record (for verification)
#    Type: TXT
#    Name: app
#    Value: (Cloud Run verification string)
#    TTL: 300
```

### **PHASE 6: AUTOMATED ML RETRAINING SETUP**

#### **Step 1: Build ML Training Image**

```bash
# Build ML training Docker image
docker build -t gcr.io/trading-ai-sher-prod/ml-retrainer:latest \
  -f ml-training/Dockerfile \
  ml-training/

# Push to GCR
docker push gcr.io/trading-ai-sher-prod/ml-retrainer:latest
```

#### **Step 2: Deploy ML Training Service**

```bash
# Deploy ML training service to Cloud Run
gcloud run deploy ml-retrainer \
  --image=gcr.io/trading-ai-sher-prod/ml-retrainer:latest \
  --platform=managed \
  --region=us-central1 \
  --no-allow-unauthenticated \
  --set-env-vars=TRAINING_INTERVAL=weekly \
  --project=trading-ai-sher-prod

# Verify deployment
gcloud run services describe ml-retrainer \
  --region=us-central1 \
  --project=trading-ai-sher-prod
```

#### **Step 3: Create Cloud Scheduler Job**

```bash
# Create weekly ML retraining job
gcloud scheduler jobs create ml-retrain-job \
  --schedule="0 2 * * 0" \
  --time-zone="Asia/Kolkata" \
  --uri="https://ml-retrainer-YOUR_SERVICE_HASH-uc.a.run.app/train" \
  --http-method=POST \
  --oauth-service-account-email=trading-ai-sher-prod-compute@developer.gserviceaccount.com \
  --description="Weekly ML model retraining" \
  --project=trading-ai-sher-prod

# Verify scheduler job
gcloud scheduler jobs describe ml-retrain-job \
  --project=trading-ai-sher-prod
```

### **PHASE 7: MONITORING SETUP**

#### **Step 1: Enable Cloud Logging**

```bash
# Enable Cloud Logging API
gcloud services enable logging.googleapis.com

# Create log sink for application logs
gcloud logging sinks create trading-ai-sher-sink \
  --log-filter='resource.type="cloud_run_revision"' \
  --destination=bigquery \
  --project=trading-ai-sher-prod

# Create log sink for error logs
gcloud logging sinks create trading-ai-sher-error-sink \
  --log-filter='resource.type="cloud_run_revision" AND severity>=ERROR' \
  --destination=pubsub \
  --project=trading-ai-sher-prod
```

#### **Step 2: Create Alert Policies**

```bash
# Create alert for HTTP 5xx errors
gcloud alpha monitoring policies create http-5xx-errors \
  --display-name="HTTP 5xx Errors" \
  --description="Alert when HTTP 5xx errors exceed 5%" \
  --conditions='metric.type="loadbalancing.googleapis.com/request_count" AND metric.labels.response_code_class="5" AND resource.label.region="us-central1"' \
  --threshold=5 \
  --duration=300s \
  --notification-channels=email \
  --project=trading-ai-sher-prod

# Create alert for application downtime
gcloud alpha monitoring policies create app-downtime \
  --display-name="Application Downtime" \
  --description="Alert when application health check fails" \
  --conditions='metric.type="appengine.googleapis.com/health_check/response_code" AND metric.labels.health_check="readiness"' \
  --threshold=0 \
  --duration=60s \
  --notification-channels=email \
  --project=trading-ai-sher-prod
```

---

## ✅ PRODUCTION CHECKLIST

### **PRE-DEPLOYMENT CHECKLIST**

#### **Configuration:**
- [ ] All environment variables set and tested
- [ ] Database connection verified
- [ ] Redis connection verified
- [ ] External API keys valid (Gemini, Angel One, Stripe)
- [ ] Domain DNS configured (if using custom domain)
- [ ] SSL/TLS certificates configured

#### **Security:**
- [ ] All secrets stored in Secret Manager
- [ ] No secrets in code or environment files
- [ ] Strong passwords (32+ characters)
- [ ] JWT and NextAuth secrets unique
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] Input validation implemented
- [ ] SQL injection protection enabled
- [ ] XSS protection enabled
- [ ] CSRF protection enabled

#### **Performance:**
- [ ] Database connection pooling configured
- [ ] Redis caching enabled
- [ ] CDN configured (for static assets)
- [ ] Compression enabled (gzip/brotli)
- [ ] Image optimization enabled
- [ ] Code splitting implemented
- [ ] Lazy loading implemented
- [ ] Service Worker configured

#### **Monitoring:**
- [ ] Health check endpoint accessible
- [ ] Logging configured and working
- [ ] Error tracking configured (Sentry)
- [ ] Metrics collection enabled
- [ ] Uptime monitoring enabled
- [ ] Performance monitoring enabled
- [ ] Alert notifications configured

### **POST-DEPLOYMENT CHECKLIST**

#### **Functionality:**
- [ ] Application loads without errors
- [ ] Health check returns "OK"
- [ ] All API endpoints responding
- [ ] AI analysis working
- [ ] Broker integration working
- [ ] Authentication working
- [ ] Authorization working
- [ ] Rate limiting working
- [ ] Caching working
- [ ] Database operations working
- [ ] Real-time features working
- [ ] Admin dashboard working
- [ ] User registration/login working
- [ ] Payment processing working (if enabled)

#### **Performance:**
- [ ] Page load time < 3 seconds
- [ ] API response time < 500ms
- [ ] Database query time < 100ms
- [ ] Memory usage < 80%
- [ ] CPU usage < 70%
- [ ] Zero errors in logs
- [ ] Zero warnings in logs

#### **Security:**
- [ ] No exposed secrets
- [ ] HTTPS enforced
- [ ] Security headers configured
- [ ] Content-Security-Policy configured
- [ ] X-Frame-Options configured
- [ ] X-XSS-Protection configured
- [ ] Strict-Transport-Security configured

---

## 🐛 TROUBLESHOOTING

### **Common Issues & Solutions**

#### **Issue 1: Application Won't Start**

**Symptoms:**
- Docker container exits immediately
- Application crashes on startup
- Logs show "Cannot start"

**Solutions:**
```bash
# Check logs
docker logs trading-ai-sher

# Check environment variables
docker exec -it trading-ai-sher env | grep -E "NODE_ENV|PORT|DATABASE_URL"

# Check if ports are available
netstat -an | grep 8080

# Restart container
docker-compose -f docker-compose.prod.yml restart app
```

#### **Issue 2: Database Connection Failed**

**Symptoms:**
- Error: "ECONNREFUSED"
- Error: "Connection timed out"
- Error: "Authentication failed"

**Solutions:**
```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Test PostgreSQL connection
docker exec -it trading-ai-sher-postgres psql -U sher_user -d sher_db

# Check environment variables
echo $DATABASE_URL

# Restart PostgreSQL
docker restart trading-ai-sher-postgres

# Rebuild database
docker-compose -f docker-compose.prod.yml down -v
docker-compose -f docker-compose.prod.yml up -d postgres
```

#### **Issue 3: Redis Connection Failed**

**Symptoms:**
- Error: "Redis connection refused"
- Error: "Connection timed out"
- Rate limiting not working

**Solutions:**
```bash
# Check if Redis is running
docker ps | grep redis

# Test Redis connection
docker exec -it trading-ai-sher-redis redis-cli ping

# Check Redis URL
echo $REDIS_URL

# Restart Redis
docker restart trading-ai-sher-redis
```

#### **Issue 4: API Key Errors**

**Symptoms:**
- Error: "Invalid API key"
- Error: "Quota exceeded"
- Error: "Authentication failed"

**Solutions:**
```bash
# Verify API keys
echo $GEMINI_API_KEY
echo $ANGEL_ONE_API_KEY
echo $STRIPE_SECRET_KEY

# Test API keys manually
# For Gemini:
curl -H "Authorization: Bearer $GEMINI_API_KEY" \
  https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent

# For Angel One:
curl -H "Authorization: Bearer $ANGEL_ONE_API_KEY" \
  https://apiconnect.angelone.in/rest/secure/angelbroking/api/v1/feed

# For Stripe:
curl https://api.stripe.com/v1/charges \
  -u $STRIPE_SECRET_KEY:
```

#### **Issue 5: Build Failed**

**Symptoms:**
- Cloud Build failed
- Docker build failed
- Compilation errors

**Solutions:**
```bash
# Check build logs
gcloud builds log $(gcloud builds list --limit=1 --format='value(id)')

# Test build locally
docker build -t test -f Dockerfile.prod .

# Check for syntax errors
bun run lint

# Check for missing dependencies
bun install --frozen-lockfile
```

---

## 📊 MONITORING

### **Health Check Endpoint**

```bash
# Health check
curl http://localhost:8080/api/health

# Expected response:
{
  "status": "OK",
  "timestamp": "2025-01-15T10:00:00.000Z",
  "uptime": 3600.0,
  "diagnostics": {
    "database": "OK",
    "ai": "OK",
    "broker": "OK"
  }
}
```

### **Metrics to Monitor**

#### **Application Metrics:**
- Request rate
- Response time
- Error rate
- Uptime percentage
- Concurrent users

#### **Business Metrics:**
- AI calls per day
- Active subscriptions
- Revenue per month
- User churn rate
- Signal accuracy

#### **Infrastructure Metrics:**
- CPU utilization
- Memory utilization
- Disk I/O
- Network I/O
- Container restarts

### **Monitoring Tools**

#### **Built-in Tools:**
- Google Cloud Monitoring
- Google Cloud Logging
- Google Cloud Error Reporting
- Google Cloud Trace

#### **Third-party Tools:**
- Sentry (error tracking)
- Datadog (APM)
- New Relic (APM)
- PagerDuty (alerting)
- Slack (notifications)

---

## 🔄 ROLLBACK PROCEDURES

### **Automated Rollback (Cloud Run)**

```bash
# List all revisions
gcloud run revisions list \
  --service=trading-ai-sher \
  --region=us-central1 \
  --project=trading-ai-sher-prod

# Rollback to previous version
gcloud run services update-traffic trading-ai-sher \
  --to-revisions=PREVIOUS_REVISION_ID \
  --region=us-central1 \
  --project=trading-ai-sher-prod
```

### **Manual Rollback (Docker)**

```bash
# Tag previous version
docker tag gcr.io/trading-ai-sher-prod/trading-ai-sher:previous \
  gcr.io/trading-ai-sher-prod/trading-ai-sher:latest

# Push tagged image
docker push gcr.io/trading-ai-sher-prod/trading-ai-sher:latest

# Redeploy
gcloud run deploy trading-ai-sher \
  --image=gcr.io/trading-ai-sher-prod/trading-ai-sher:latest \
  --region=us-central1 \
  --project=trading-ai-sher-prod
```

### **Local Rollback**

```bash
# Reset to previous commit
git reset --hard PREVIOUS_COMMIT_HASH

# Rebuild
bun run build

# Restart
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d
```

---

## 📝 NOTES

### **Security Notes:**
1. Never commit secrets to git
2. Always use Secret Manager for production
3. Rotate secrets regularly (every 90 days)
4. Use strong passwords (32+ characters)
5. Enable MFA for all accounts

### **Performance Notes:**
1. Use CDN for static assets
2. Enable compression (gzip/brotli)
3. Implement caching strategies
4. Optimize images
5. Use code splitting

### **Monitoring Notes:**
1. Set up alerting for critical issues
2. Monitor uptime 24/7
3. Review logs daily
4. Analyze metrics weekly
5. Update alerts monthly

---

## 🚀 QUICK START COMMANDS

### **Local Deployment:**
```bash
# Start all services
docker-compose -f docker-compose.prod.yml up -d

# Check status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f app

# Stop all services
docker-compose -f docker-compose.prod.yml down
```

### **Cloud Deployment:**
```bash
# Build and deploy
gcloud builds submit \
  --config cloudbuild.prod.yaml \
  --substitutions=PROJECT_ID=trading-ai-sher-prod,SHORT_SHA=$(git rev-parse --short HEAD) \
  --project=trading-ai-sher-prod

# Check deployment status
gcloud run services describe trading-ai-sher \
  --region=us-central1 \
  --project=trading-ai-sher-prod
```

---

## 📞 SUPPORT

### **Documentation:**
- GitHub Issues: https://github.com/rawatharish27-commits/Trading-AI-SHER/issues
- Wiki: https://github.com/rawatharish27-commits/Trading-AI-SHER/wiki

### **Community:**
- Discord: [Link to Discord server]
- Slack: [Link to Slack workspace]
- Email: support@trading-ai-sher.com

---

## 🎉 CONCLUSION

This deployment guide provides comprehensive instructions for deploying Trading AI SHER both locally and on Google Cloud Platform. Follow the steps in order, and verify each step before proceeding to the next.

**Key Points:**
- Always use environment variables for secrets
- Test thoroughly before deploying to production
- Monitor system performance and logs
- Have rollback procedures ready
- Keep documentation up to date

**Good luck with your deployment!** 🚀🦁
