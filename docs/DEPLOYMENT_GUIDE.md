# 🚀 DEPLOYMENT GUIDE - Trading AI SHER

## 📊 Hardware Requirements

### Minimum Requirements (Development/Testing)
| Component | Specification |
|-----------|--------------|
| **CPU** | 2 vCPUs |
| **RAM** | 4 GB |
| **Storage** | 20 GB SSD |
| **Network** | 1 Gbps |
| **Cost (India)** | ₹2,000-3,000/month |

### Recommended Requirements (Production)
| Component | Specification |
|-----------|--------------|
| **CPU** | 4-8 vCPUs |
| **RAM** | 8-16 GB |
| **Storage** | 100 GB SSD |
| **Network** | 1-10 Gbps |
| **Cost (India)** | ₹5,000-10,000/month |

### High-Performance Requirements (Enterprise)
| Component | Specification |
|-----------|--------------|
| **CPU** | 16+ vCPUs |
| **RAM** | 32-64 GB |
| **Storage** | 500 GB NVMe SSD |
| **Network** | 10 Gbps |
| **Cost (India)** | ₹25,000-50,000/month |

---

## ☁️ Cloud Provider Comparison

### 🇮🇳 Best for Indian Trading: AWS Mumbai (ap-south-1)

| Provider | Region | Latency to NSE | Cost/Month | Recommendation |
|----------|--------|----------------|------------|----------------|
| **AWS** | Mumbai | 5-10ms | ₹5,000-15,000 | ⭐⭐⭐⭐⭐ BEST |
| **Google Cloud** | Mumbai | 10-15ms | ₹6,000-18,000 | ⭐⭐⭐⭐ Good |
| **Azure** | Central India | 15-20ms | ₹5,500-16,000 | ⭐⭐⭐⭐ Good |
| **DigitalOcean** | Bangalore | 10-15ms | ₹4,000-12,000 | ⭐⭐⭐⭐ Budget |
| **Hostinger VPS** | India | 15-25ms | ₹1,500-5,000 | ⭐⭐⭐ Start |

### 🏆 Recommended: AWS Mumbai

**Why AWS Mumbai?**
1. ✅ Lowest latency to NSE (5-10ms)
2. ✅ Angel One API hosted on AWS
3. ✅ Best reliability (99.99% SLA)
4. ✅ Easy scaling
5. ✅ Indian data compliance

---

## 🛠️ AWS Instance Recommendations

### For Small Account (₹1-5 Lakhs)
```
Instance: t3.medium
vCPUs: 2
RAM: 4 GB
Storage: 30 GB gp3
Cost: ~₹2,500/month

Can handle:
- 15 symbols tracking
- 5 concurrent positions
- Real-time monitoring
```

### For Medium Account (₹5-20 Lakhs)
```
Instance: t3.large or c5.large
vCPUs: 2-4
RAM: 8 GB
Storage: 100 GB gp3
Cost: ~₹6,000/month

Can handle:
- 50 symbols tracking
- 10 concurrent positions
- ML model training
```

### For Large Account (₹20+ Lakhs)
```
Instance: c5.2xlarge
vCPUs: 8
RAM: 16 GB
Storage: 200 GB gp3
Cost: ~₹15,000/month

Can handle:
- 200+ symbols tracking
- 20 concurrent positions
- Full ML pipeline
- Backtesting
```

---

## 🚀 Quick Deployment

### Option 1: Docker Compose (Easiest)

```bash
# 1. Clone repository
git clone https://github.com/your-repo/trading-ai-sher.git
cd trading-ai-sher

# 2. Create .env file
cat > .env << EOF
SECRET_KEY=your-secret-key-here
TELEGRAM_BOT_TOKEN=your-bot-token
TELEGRAM_CHAT_ID=your-chat-id
ANGEL_ONE_API_KEY=your-api-key
ANGEL_ONE_CLIENT_ID=your-client-id
ANGEL_ONE_PASSWORD=your-password
AUTO_TRADE_ENABLED=true
EOF

# 3. Start services
docker-compose up -d

# 4. Check status
docker-compose ps
```

### Option 2: Kubernetes (Production)

```bash
# 1. Create namespace
kubectl apply -f k8s/deployment.yml

# 2. Create secrets
kubectl create secret generic sher-secrets \
  --from-literal=SECRET_KEY=your-secret-key \
  --from-literal=TELEGRAM_BOT_TOKEN=your-token \
  -n trading-ai-sher

# 3. Deploy
kubectl apply -f k8s/deployment.yml

# 4. Check status
kubectl get pods -n trading-ai-sher
```

### Option 3: AWS EC2 (Recommended)

```bash
# 1. Launch EC2 Instance
# - Region: ap-south-1 (Mumbai)
# - Instance: t3.medium or t3.large
# - OS: Ubuntu 22.04 LTS
# - Storage: 50 GB gp3
# - Security Group: Allow 80, 443, 22

# 2. SSH into instance
ssh -i your-key.pem ubuntu@your-ec2-ip

# 3. Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker ubuntu

# 4. Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 5. Deploy
git clone https://github.com/your-repo/trading-ai-sher.git
cd trading-ai-sher
docker-compose up -d
```

---

## 📱 Telegram Bot Setup

### Step 1: Create Bot
1. Open Telegram
2. Search `@BotFather`
3. Send `/newbot`
4. Follow instructions
5. Save the **Bot Token**

### Step 2: Get Chat ID
1. Search `@userinfobot`
2. Start the bot
3. It will show your **Chat ID**

### Step 3: Configure
```bash
# Add to .env
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrSTUvwxYZ
TELEGRAM_CHAT_ID=123456789
```

---

## 🔐 Security Configuration

### 1. Generate Secret Key
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

### 2. Setup SSL (Let's Encrypt)
```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d sher.yourdomain.com

# Auto-renewal
sudo certbot renew --dry-run
```

### 3. Firewall Setup
```bash
# Allow only necessary ports
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw enable
```

---

## 📊 Monitoring Setup

### Access Dashboards
- **API**: http://your-ip:8000/api/docs
- **Grafana**: http://your-ip:3001
- **Prometheus**: http://your-ip:9090

### Key Metrics to Monitor
- CPU Usage < 70%
- Memory Usage < 80%
- API Response Time < 100ms
- WebSocket Latency < 50ms
- Daily P&L

---

## 🔄 Backup Strategy

### Database Backup
```bash
# Daily backup script
#!/bin/bash
DATE=$(date +%Y%m%d)
BACKUP_DIR="/backup"
DB_FILE="/app/data/sher.db"

# Create backup
sqlite3 $DB_FILE ".backup $BACKUP_DIR/sher_$DATE.db"

# Upload to S3
aws s3 cp $BACKUP_DIR/sher_$DATE.db s3://your-bucket/backups/

# Keep only last 30 days
find $BACKUP_DIR -name "sher_*.db" -mtime +30 -delete
```

### Cron Job
```bash
# Add to crontab
crontab -e

# Daily backup at 5 AM
0 5 * * * /home/ubuntu/backup.sh
```

---

## 📈 Scaling Guide

### When to Scale Up?
- CPU consistently > 70%
- Memory consistently > 80%
- API latency > 100ms
- Adding more tracked symbols

### How to Scale?

**Horizontal (More Instances):**
```bash
# Kubernetes
kubectl scale deployment sher-backend --replicas=5 -n trading-ai-sher

# Docker Compose
docker-compose up -d --scale backend=3
```

**Vertical (Bigger Instance):**
```bash
# AWS: Change instance type
# t3.medium → t3.large → c5.large
```

---

## 🚨 Troubleshooting

### Backend Not Starting
```bash
# Check logs
docker-compose logs backend

# Common issues:
# 1. Database locked - Restart container
# 2. Port in use - Change port
# 3. Missing env vars - Check .env file
```

### Telegram Notifications Not Working
```bash
# Test bot
curl "https://api.telegram.org/bot<YOUR_TOKEN>/sendMessage?chat_id=<CHAT_ID>&text=Test"
```

### Memory Issues
```bash
# Check memory usage
docker stats

# Increase memory limit in docker-compose.yml
deploy:
  resources:
    limits:
      memory: 2G
```

---

## 💰 Cost Optimization

### Tips to Reduce Cost

1. **Use Spot Instances** (70% cheaper)
   ```bash
   # AWS Spot for non-critical workloads
   aws ec2 request-spot-instances --instance-type t3.medium
   ```

2. **Schedule Auto-Shutdown**
   ```bash
   # Stop after market hours (weekends)
   # Scheduler still runs on weekdays
   ```

3. **Use Reserved Instances** (40% cheaper)
   - 1-year commitment
   - Good for production

4. **Optimize Resources**
   ```yaml
   # In docker-compose.yml
   deploy:
     resources:
       limits:
         cpus: '0.5'
         memory: 512M
   ```

---

## 📋 Deployment Checklist

- [ ] Server provisioned (AWS Mumbai recommended)
- [ ] Docker & Docker Compose installed
- [ ] Environment variables configured
- [ ] Telegram bot created and configured
- [ ] SSL certificate installed
- [ ] Firewall configured
- [ ] Backup script setup
- [ ] Monitoring enabled
- [ ] Health checks passing
- [ ] Paper trading tested
- [ ] Go-live approved

---

## 🎯 Go-Live Steps

1. **Paper Trade First** (1-2 weeks)
   - Test all features
   - Verify notifications
   - Monitor performance

2. **Small Capital Start** (₹10,000-50,000)
   - Test real execution
   - Verify broker API
   - Monitor slippage

3. **Scale Gradually**
   - Increase capital
   - Add more symbols
   - Monitor risk

---

**Need Help?**
- Documentation: `/docs`
- API Docs: `/api/docs`
- Support: support@sher-trading.com
