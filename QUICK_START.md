# 🚀 QUICK START - PRODUCTION DEPLOYMENT

## 📋 LOCAL DEPLOYMENT (QUICK START)

### **Step 1: Clone Repository**

```bash
git clone https://github.com/rawatharish27-commits/Trading-AI-SHER.git
cd Trading-AI-SHER
```

### **Step 2: Install Dependencies**

```bash
bun install
```

### **Step 3: Start Local Server**

```bash
# Start with all services
docker-compose -f docker-compose.prod.yml up -d

# Access application
open http://localhost:3000

# Check health
curl http://localhost:3000/api/health
```

### **Step 4: Stop Services**

```bash
docker-compose -f docker-compose.prod.yml down
```

---

## 🚀 CLOUD DEPLOYMENT (QUICK START)

### **Step 1: Setup GCP Project**

```bash
# Authenticate with GCP
gcloud auth login

# Set project
gcloud config set project YOUR_PROJECT_ID

# Enable APIs
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable secretmanager.googleapis.com
```

### **Step 2: Configure Secrets**

```bash
# Create secrets in Secret Manager
gcloud secrets create gemini-api-key --data-file="key.txt"
gcloud secrets create nextauth-secret --data-file="secret.txt"
gcloud secrets create jwt-secret --data-file="jwt.txt"
```

### **Step 3: Build and Deploy**

```bash
# Build Docker image
docker build -t gcr.io/YOUR_PROJECT_ID/trading-ai-sher:latest -f Dockerfile.prod .

# Push to GCR
docker push gcr.io/YOUR_PROJECT_ID/trading-ai-sher:latest

# Deploy to Cloud Run
gcloud run deploy trading-ai-sher \
  --image=gcr.io/YOUR_PROJECT_ID/trading-ai-sher:latest \
  --region=us-central1 \
  --platform=managed \
  --allow-unauthenticated
```

### **Step 4: Access Application**

```bash
# Get service URL
gcloud run services describe trading-ai-sher \
  --region=us-central1 \
  --format='value(status.url)'

# Open in browser
open https://trading-ai-sher-YOUR_PROJECT_ID.an.a.run.app

# Check health
curl https://trading-ai-sher-YOUR_PROJECT_ID.an.a.run.app/api/health
```

---

## ✅ VERIFICATION CHECKLIST

### **Local Deployment:**
- [ ] Docker containers running
- [ ] Application accessible at http://localhost:3000
- [ ] Health check returns "OK"
- [ ] Database connected
- [ ] Admin dashboard accessible

### **Cloud Deployment:**
- [ ] Cloud Build successful
- [ ] Cloud Run service deployed
- [ ] Application accessible at Cloud Run URL
- [ ] Health check returns "OK"
- [ ] Secrets properly injected
- [ ] Auto-scaling configured
- [ ] Monitoring enabled

---

## 📞 SUPPORT

For detailed deployment instructions, see:
- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - Comprehensive deployment guide
- [README.md](./README.md) - Complete documentation

---

## 🎉 DEPLOYED!

Your Trading AI SHER platform is now deployed and operational!

**Access:** [Local](http://localhost:3000) | [Cloud](https://trading-ai-sher-YOUR_PROJECT_ID.an.a.run.app)

**Status:** ✅ Fully Operational  
**Mode:** Paper Trading (Safe)  
**Enterprise-Grade:** Yes

**Happy Trading!** 🚀🦁
