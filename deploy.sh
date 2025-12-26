#!/bin/bash

# 🚀 SHER.AI Google Cloud Run Deployment Script v4.5
# Automated deployment script for sovereign trading infrastructure

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ID=${GOOGLE_CLOUD_PROJECT:-"your-project-id"}
REGION=${REGION:-"asia-south1"}
SERVICE_NAME="sher-ai-trading"
IMAGE_NAME="sher-ai"
REGISTRY="gcr.io/${PROJECT_ID}"

echo -e "${BLUE}=== SHER.AI Cloud Run Deployment ===${NC}"
echo ""

# Step 1: Check prerequisites
echo -e "${YELLOW}[1/8] Checking prerequisites...${NC}"
command -v gcloud >/dev/null 2>&1 || { echo -e "${RED}gcloud not found. Install Google Cloud SDK first.${NC}" >&2; exit 1; }
command -v docker >/dev/null 2>&1 || { echo -e "${RED}docker not found. Install Docker first.${NC}" >&2; exit 1; }
echo -e "${GREEN}✓ Prerequisites OK${NC}"
echo ""

# Step 2: Set Google Cloud project
echo -e "${YELLOW}[2/8] Setting Google Cloud project...${NC}"
gcloud config set project $PROJECT_ID
echo -e "${GREEN}✓ Project set to: $PROJECT_ID${NC}"
echo ""

# Step 3: Enable required APIs
echo -e "${YELLOW}[3/8] Enabling required APIs...${NC}"
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable sqladmin.googleapis.com
echo -e "${GREEN}✓ APIs enabled${NC}"
echo ""

# Step 4: Build Docker image
echo -e "${YELLOW}[4/8] Building Docker image...${NC}"
docker build -t $REGISTRY/$IMAGE_NAME:latest .
echo -e "${GREEN}✓ Docker image built${NC}"
echo ""

# Step 5: Push to Google Container Registry
echo -e "${YELLOW}[5/8] Pushing to Google Container Registry...${NC}"
docker push $REGISTRY/$IMAGE_NAME:latest
echo -e "${GREEN}✓ Image pushed to registry${NC}"
echo ""

# Step 6: Deploy to Cloud Run
echo -e "${YELLOW}[6/8] Deploying to Cloud Run...${NC}"
gcloud run deploy $SERVICE_NAME \
  --image=$REGISTRY/$IMAGE_NAME:latest \
  --platform=managed \
  --region=$REGION \
  --allow-unauthenticated \
  --port=8080 \
  --memory=2Gi \
  --cpu=2 \
  --min-instances=0 \
  --max-instances=10 \
  --timeout=300s \
  --set-env-vars="NODE_ENV=production,MARKET_MODE=PAPER" \
  --add-cloudsql-instances="${CLOUDSQL_CONNECTION}" \
  --ingress=all
echo -e "${GREEN}✓ Deployment complete${NC}"
echo ""

# Step 7: Get service URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region=$REGION --format='value(status.url)')
echo -e "${GREEN}[7/8] Service URL: $SERVICE_URL${NC}"
echo ""

# Step 8: Display next steps
echo -e "${YELLOW}[8/8] Next Steps:${NC}"
echo "1. Set environment variables in Cloud Run console:"
echo "   - API_KEY (Google Gemini)"
echo "   - ANGEL_ONE_API_KEY"
echo "   - ANGEL_ONE_CLIENT_ID"
echo "   - ANGEL_ONE_PASSWORD"
echo "   - ANGEL_ONE_TOTP_SECRET"
echo "   - DATABASE_URL (Cloud SQL connection string)"
echo ""
echo "2. Configure Cloud SQL database:"
echo "   gcloud sql instances create sher-db --tier=db-f1-micro --region=$REGION"
echo ""
echo "3. Run database migrations:"
echo "   gcloud run jobs execute db-migrate --region=$REGION"
echo ""

echo -e "${GREEN}=== Deployment Complete! ===${NC}"
