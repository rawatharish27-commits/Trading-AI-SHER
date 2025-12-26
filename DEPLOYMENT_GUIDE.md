# 🚀 Google Cloud Run Deployment Guide - SHER.AI Trading Platform

## 📋 Prerequisites

1. **Google Cloud Account** with billing enabled
2. **Google Cloud SDK (gcloud CLI)** installed
3. **Docker** installed
4. **Angel One Trading Account** (for live trading)
5. **Google Gemini API Key** (for AI features)

## 🔧 Step 1: Setup Google Cloud SDK

```bash
# Install Google Cloud SDK
# For Linux/Mac:
curl https://sdk.cloud.google.com | bash
exec -l $SHELL

# Initialize gcloud
gcloud init

# Login to Google Cloud
gcloud auth login
```

## 🔧 Step 2: Enable Required APIs

```bash
# Set your project
gcloud config set project YOUR_PROJECT_ID

# Enable required APIs
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable sqladmin.googleapis.com
gcloud services enable cloudbuild.googleapis.com
```

## 🔧 Step 3: Create Google Cloud Secrets (for security)

```bash
# Create secret for AI API key
echo "your_gemini_api_key" | gcloud secrets create api-key-secret --data-file=-

# Create secret for broker credentials
cat > broker-creds.json << EOF
{
  "API_KEY": "your_angel_one_api_key",
  "CLIENT_ID": "your_client_id",
  "PASSWORD": "your_password",
  "TOTP_SECRET": "your_totp_secret"
}
EOF

gcloud secrets create broker-credentials --data-file=broker-creds.json

# Create database URL secret
echo "postgresql://user:pass@host:5432/db" | gcloud secrets create database-url --data-file=-
```

## 🔧 Step 4: Setup Database (Optional - Cloud SQL)

### Option A: Cloud SQL PostgreSQL (Recommended for Production)
```bash
# Create Cloud SQL instance
gcloud sql instances create sher-db \
  --tier=db-f1-micro \
  --region=asia-south1 \
  --database-version=POSTGRES_14

# Create database
gcloud sql databases create sher_ai --instance=sher-db

# Get connection string
gcloud sql instances describe sher-db --format='value(connectionName)'
```

### Option B: SQLite (Simple, for testing)
```bash
# Use SQLite file storage (configured in .env)
# No additional setup needed
```

## 🔧 Step 5: Make Deploy Script Executable

```bash
cd /path/to/Trading-AI-SHER
chmod +x deploy.sh
```

## 🔧 Step 6: Update Configuration

### Edit `.env.production`:
```bash
cp .env.production.example .env.production
nano .env.production
```

Fill in:
- API_KEY (Google Gemini)
- ANGEL_ONE_* credentials (for live trading)
- DATABASE_URL (Cloud SQL connection string)

## 🚀 Step 7: Deploy to Cloud Run

### Option A: Automated Deployment Script
```bash
# Set your project ID
export GOOGLE_CLOUD_PROJECT=your-project-id
export REGION=asia-south1
export CLOUDSQL_CONNECTION=project:region:instance

# Run deployment script
./deploy.sh
```

### Option B: Manual Deployment

#### 7.1 Build Docker Image
```bash
docker build -t gcr.io/YOUR_PROJECT_ID/sher-ai:latest .
```

#### 7.2 Push to Container Registry
```bash
gcloud auth configure-docker
docker push gcr.io/YOUR_PROJECT_ID/sher-ai:latest
```

#### 7.3 Deploy to Cloud Run
```bash
gcloud run deploy sher-ai-trading \
  --image=gcr.io/YOUR_PROJECT_ID/sher-ai:latest \
  --platform=managed \
  --region=asia-south1 \
  --allow-unauthenticated \
  --port=8080 \
  --memory=2Gi \
  --cpu=2 \
  --min-instances=0 \
  --max-instances=10 \
  --timeout=300s \
  --set-env-vars="NODE_ENV=production,MARKET_MODE=PAPER" \
  --add-cloudsql-instances="PROJECT:REGION:INSTANCE"
```

### Option C: CI/CD with Cloud Build

```bash
# Connect GitHub repository to Cloud Build
gcloud builds submit --config cloudbuild.yaml

# Or setup automatic triggers
gcloud builds triggers create github \
  --name=sher-ai-trigger \
  --repo-url=https://github.com/USERNAME/Trading-AI-SHER \
  --branch-pattern=main \
  --build-config=cloudbuild.yaml
```

## 🔧 Step 8: Configure Environment Variables in Cloud Run

### Using Google Cloud Console:
1. Go to: https://console.cloud.google.com/run
2. Click on your service "sher-ai-trading"
3. Go to "Variables and Secrets" tab
4. Add environment variables:
   ```
   NODE_ENV=production
   MARKET_MODE=PAPER
   PORT=8080
   ```
5. Add secret references:
   - API_KEY -> Secret: api-key-secret
   - ANGEL_ONE_API_KEY -> Secret: broker-credentials
   - DATABASE_URL -> Secret: database-url

### Or using gcloud CLI:
```bash
gcloud run services update sher-ai-trading \
  --region=asia-south1 \
  --update-secrets="API_KEY=api-key-secret:latest,ANGEL_ONE_API_KEY=broker-credentials:latest,DATABASE_URL=database-url:latest"
```

## 🧪 Step 9: Test Deployment

```bash
# Get service URL
SERVICE_URL=$(gcloud run services describe sher-ai-trading --region=asia-south1 --format='value(status.url)')
echo "Service URL: $SERVICE_URL"

# Test the service
curl $SERVICE_URL
curl $SERVICE_URL/api/health
```

## 📊 Step 10: Monitoring & Logging

```bash
# View logs
gcloud logging tails "projects/YOUR_PROJECT_ID/logs/run.googleapis.com%2Fstdout" --limit=50

# Enable monitoring
gcloud monitoring dashboards create --config-from-file=dashboard.json

# Set up uptime checks
gcloud monitoring uptime-checks create http \
  --display-name="SHER.AI Health Check" \
  --uri=$SERVICE_URL/api/health \
  --check-interval=60s
```

## 🔒 Security Hardening (Optional but Recommended)

### Add Cloud Armor & WAF:
```bash
# Create NEG (Network Endpoint Group)
gcloud compute network-endpoint-groups create sher-neg \
  --region=asia-south1 \
  --network-endpoint-type=serverless \
  --cloud-run-service=sher-ai-trading

# Create backend service
gcloud compute backend-services create sher-backend \
  --global \
  --load-balancing-scheme=EXTERNAL

# Add NEG to backend
gcloud compute backend-services add-backend sher-backend \
  --global \
  --network-endpoint-group=sher-neg \
  --network-endpoint-group-region=asia-south1

# Create Cloud Armor policy
gcloud compute security-policies create sher-waf \
  --description="WAF for SHER.AI"

# Add WAF rules
gcloud compute security-policies rules create 1000 \
  --security-policy=sher-waf \
  --expression="evaluatePreconfiguredExpr('xss-stable')" \
  --action deny-403

gcloud compute security-policies rules create 1001 \
  --security-policy=sher-waf \
  --expression="evaluatePreconfiguredExpr('sqli-stable')" \
  --action deny-403

# Attach policy to backend
gcloud compute backend-services update sher-backend \
  --global \
  --security-policy=sher-waf
```

## 📝 Troubleshooting

### Build Issues:
```bash
# Clear cache and rebuild
docker system prune -a
rm -rf .next
docker build --no-cache -t sher-ai .
```

### Runtime Issues:
```bash
# Check logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=sher-ai-trading" --limit=50

# Check instance status
gcloud run revisions list --service=sher-ai-trading --region=asia-south1
```

### Database Connection Issues:
```bash
# Check Cloud SQL connectivity
gcloud sql connect sher-db --user=postgres

# Verify connection string
echo $DATABASE_URL
```

## 🔄 Continuous Deployment (CI/CD)

### Automatic Deployments on Git Push:
1. Go to Cloud Build triggers in Google Cloud Console
2. Click "Create Trigger"
3. Select GitHub repository
4. Choose branch (main/master)
5. Select cloudbuild.yaml configuration
6. Save trigger

Now every push to main branch will automatically deploy to Cloud Run!

## 💰 Cost Optimization

```bash
# Scale to zero when not in use
gcloud run services update sher-ai-trading \
  --region=asia-south1 \
  --min-instances=0 \
  --max-instances=10

# Use smaller instance for testing
--memory=512Mi --cpu=1
```

## 📚 Additional Resources

- Cloud Run Documentation: https://cloud.google.com/run/docs
- Cloud SQL Documentation: https://cloud.google.com/sql/docs
- Cloud Build Documentation: https://cloud.google.com/build/docs
- Cloud Armor Documentation: https://cloud.google.com/armor/docs

---

**Deployment Status:** ✅ Ready for Production
**Support:** For issues, check Google Cloud Console logs and health endpoints.
