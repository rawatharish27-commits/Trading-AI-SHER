# Trading AI SHER - Maintenance & Support Guide

## System Architecture

### Overview
Trading AI SHER is a microservices-based trading system with the following components:

- **API Gateway**: FastAPI application handling requests
- **Database**: PostgreSQL with TimescaleDB extension
- **Cache**: Redis for session and data caching
- **Message Queue**: Background task processing
- **Monitoring**: Prometheus + Grafana stack
- **Load Balancer**: Nginx reverse proxy

### Technology Stack
- **Backend**: Python 3.11, FastAPI, SQLAlchemy
- **Database**: PostgreSQL 15, TimescaleDB
- **Cache**: Redis 7
- **Monitoring**: Prometheus, Grafana
- **Container**: Docker, Docker Compose
- **CI/CD**: GitHub Actions

## Deployment

### Production Deployment
```bash
# Clone repository
git clone https://github.com/your-org/trading-ai-sher.git
cd trading-ai-sher

# Set environment variables
cp backend/.env.example backend/.env
# Edit .env with production values

# Deploy with Docker Compose
cd backend
docker-compose -f docker-compose.yml up -d

# Run database migrations
docker-compose exec api alembic upgrade head

# Check health
curl http://localhost/health
```

### Environment Variables
```bash
# Database
DATABASE_URL=postgresql+asyncpg://user:pass@postgres:5432/sher
REDIS_URL=redis://redis:6379/0

# Security
SECRET_KEY=your-production-secret-key
API_ENCRYPTION_KEY=your-encryption-key

# External APIs
ANGEL_ONE_API_KEY=your-angel-one-key
GEMINI_API_KEY=your-gemini-key

# Monitoring
PROMETHEUS_URL=http://prometheus:9090
GRAFANA_URL=http://grafana:3000
```

## Monitoring

### Health Checks
- **Application**: `GET /health` - Basic health check
- **Detailed**: `GET /health/detailed` - Full dependency check
- **Database**: `GET /health/database` - Database connectivity
- **Readiness**: `GET /health/ready` - Kubernetes readiness
- **Liveness**: `GET /health/live` - Kubernetes liveness

### Metrics
- **Prometheus**: `GET /metrics` - Prometheus-compatible metrics
- **System**: CPU, memory, disk usage
- **Application**: Request rate, error rate, response time
- **Business**: Signal generation rate, user activity

### Alerts
Configure alerts for:
- High error rates (>5%)
- Slow response times (>2s)
- Database connection issues
- High memory/CPU usage
- Low disk space

## Database Management

### Backup Strategy
```bash
# Daily automated backups
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump -h postgres -U sher -d sher > backup_$DATE.sql

# Upload to cloud storage
aws s3 cp backup_$DATE.sql s3://sher-backups/

# Keep last 30 days
find /backups -name "backup_*.sql" -mtime +30 -delete
```

### Migration Management
```bash
# Create new migration
alembic revision -m "Add new feature"

# Run migrations
alembic upgrade head

# Rollback
alembic downgrade -1

# Check current revision
alembic current
```

### Performance Optimization
```sql
-- Create indexes for performance
CREATE INDEX CONCURRENTLY idx_signals_user_created
ON signals(user_id, created_at DESC);

CREATE INDEX CONCURRENTLY idx_signals_symbol_status
ON signals(symbol, status);

-- Partition large tables by time
CREATE TABLE signals_y2024m01 PARTITION OF signals
FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
```

## Cache Management

### Redis Configuration
```redis.conf
# Memory management
maxmemory 512mb
maxmemory-policy allkeys-lru

# Persistence
save 900 1
save 300 10
save 60 10000

# Security
requirepass your-redis-password
bind 127.0.0.1

# Performance
tcp-keepalive 300
timeout 300
```

### Cache Invalidation
```python
# Clear user-specific cache
redis.delete(f"user:{user_id}:signals")

# Clear symbol cache
redis.delete(f"symbol:{symbol}:data")

# Clear all cache (emergency)
redis.flushall()
```

## Security

### API Key Management
```python
from app.core.security import api_key_manager

# Create new key
key_id, api_key = await api_key_manager.create_api_key(
    user_id=123,
    name="Trading Bot",
    permissions=["read", "trade"]
)

# Rotate key
new_key_id, new_api_key = await api_key_manager.rotate_api_key(
    user_id=123,
    old_key_id=key_id
)

# Revoke key
await api_key_manager.revoke_api_key(key_id)
```

### Security Audits
```bash
# Run security scan
docker run --rm -v $(pwd):/app owasp/zap2docker-stable zap-baseline.py \
  -t http://your-app-url \
  -r security_report.html

# Check for vulnerabilities
safety check --full-report

# Code security analysis
bandit -r backend/app/
```

### SSL/TLS Configuration
```nginx
server {
    listen 443 ssl http2;
    server_name api.sher.ai;

    ssl_certificate /etc/nginx/certs/sher.crt;
    ssl_certificate_key /etc/nginx/certs/sher.key;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;

    # HSTS
    add_header Strict-Transport-Security "max-age=63072000" always;
}
```

## Performance Optimization

### Application Performance
```python
# Database connection pooling
engine = create_async_engine(
    DATABASE_URL,
    pool_size=10,
    max_overflow=20,
    pool_timeout=30,
    pool_recycle=3600
)

# Query optimization
async def get_signals_optimized(user_id: int):
    async with get_db_session() as session:
        result = await session.execute(
            select(Signal)
            .where(Signal.user_id == user_id)
            .options(selectinload(Signal.user))
            .order_by(desc(Signal.created_at))
            .limit(100)
        )
        return result.scalars().all()
```

### Load Testing
```bash
# Run load tests
python backend/load_test.py

# Simulate concurrent users
ab -n 1000 -c 10 http://localhost:8000/api/v1/signals/generate

# Memory profiling
import memory_profiler
mprof run backend/run.py
mprof plot
```

### Scaling
```yaml
# Docker Compose scaling
services:
  api:
    deploy:
      replicas: 3
      resources:
        limits:
          cpus: '1.0'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
```

## Troubleshooting

### Common Issues

#### High Memory Usage
```bash
# Check memory usage
docker stats

# Restart service
docker-compose restart api

# Check for memory leaks
import tracemalloc
tracemalloc.start()
# Run operations
snapshot = tracemalloc.take_snapshot()
top_stats = snapshot.statistics('lineno')
for stat in top_stats[:10]:
    print(stat)
```

#### Slow Database Queries
```sql
-- Find slow queries
SELECT query, total_time, calls, mean_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;

-- Analyze query plan
EXPLAIN ANALYZE SELECT * FROM signals WHERE user_id = 123;
```

#### WebSocket Connection Issues
```python
# Check WebSocket connections
active_connections = len(connection_manager.active_connections)
logger.info(f"Active WebSocket connections: {active_connections}")

# Restart WebSocket manager
await signal_manager.disconnect_all()
await signal_manager.start()
```

### Log Analysis
```bash
# Search for errors
grep "ERROR" logs/app.log | tail -20

# Check API response times
grep "Request:" logs/app.log | awk '{print $8}' | sort -n

# Monitor error rates
grep "ERROR\|WARNING" logs/app.log | wc -l
```

## Backup and Recovery

### Automated Backups
```bash
#!/bin/bash
# Daily backup script

# Database backup
docker exec postgres pg_dump -U sher sher > /backups/db_$(date +%Y%m%d).sql

# Application data backup
tar -czf /backups/app_$(date +%Y%m%d).tar.gz /app/data/

# Upload to S3
aws s3 sync /backups/ s3://sher-backups/

# Cleanup old backups
find /backups -name "*.sql" -mtime +30 -delete
find /backups -name "*.tar.gz" -mtime +30 -delete
```

### Disaster Recovery
```bash
# Restore from backup
docker-compose down
docker volume rm sher_postgres-data

# Restore database
docker-compose up -p postgres
docker exec -i postgres psql -U sher -d sher < backup.sql

# Restore application
docker-compose up -d
```

## Support Procedures

### Incident Response
1. **Detection**: Monitor alerts and logs
2. **Assessment**: Determine impact and scope
3. **Communication**: Notify stakeholders
4. **Resolution**: Implement fix
5. **Post-mortem**: Document and improve

### Support Tiers
- **Tier 1**: Basic monitoring and alerts
- **Tier 2**: Database and application issues
- **Tier 3**: Infrastructure and security issues

### Escalation Matrix
- **P0**: System down, immediate response
- **P1**: Major feature broken, 1 hour response
- **P2**: Minor issues, 4 hour response
- **P3**: Enhancement requests, 24 hour response

## Compliance

### Data Retention
- **Trading data**: 7 years (regulatory requirement)
- **User data**: 3 years or until account deletion
- **Logs**: 90 days rolling

### Audit Logging
```python
# Log all trading activities
await security_audit.log_security_event(
    "trade_executed",
    user_id,
    {
        "symbol": "RELIANCE",
        "action": "BUY",
        "quantity": 10,
        "price": 2450.50
    }
)
```

### Privacy Compliance
- GDPR compliant data handling
- Right to erasure implementation
- Data minimization practices
- Consent management

## Updates and Maintenance

### Rolling Updates
```bash
# Zero-downtime deployment
docker-compose up -d --scale api=2
docker-compose up -d --scale api=1
docker-compose up -d --scale api=3
```

### Maintenance Windows
- **Scheduled**: Every Sunday 2-4 AM IST
- **Emergency**: As needed with notification
- **Duration**: Maximum 2 hours

### Version Management
```bash
# Tag releases
git tag -a v1.2.3 -m "Release v1.2.3"
git push origin v1.2.3

# Rollback procedure
git checkout v1.2.2
docker-compose build
docker-compose up -d
```

This maintenance guide ensures the reliability, security, and performance of the Trading AI SHER system. Regular review and updates are essential for maintaining production stability.
