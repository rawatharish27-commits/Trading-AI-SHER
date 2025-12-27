#!/bin/bash
# Production Startup Script
# Trading AI SHER - Local Deployment

echo "🚀 Starting Trading AI SHER - Production Mode"
echo "========================================"

# ===========================================
# CHECK ENVIRONMENT VARIABLES
# ===========================================
echo "📋 Checking environment variables..."

if [ -z "$NODE_ENV" ]; then
    echo "⚠️  NODE_ENV not set, defaulting to production"
    export NODE_ENV=production
fi

if [ -z "$PORT" ]; then
    echo "⚠️  PORT not set, defaulting to 8080"
    export PORT=8080
fi

if [ -z "$DATABASE_URL" ]; then
    echo "⚠️  DATABASE_URL not set, using SQLite"
    export DATABASE_URL="file:./data/dev.db"
fi

if [ -z "$NEXT_PUBLIC_MARKET_MODE" ]; then
    echo "⚠️  MARKET_MODE not set, defaulting to PAPER"
    export NEXT_PUBLIC_MARKET_MODE="PAPER"
fi

echo "✅ Environment variables set"
echo "   NODE_ENV: $NODE_ENV"
echo "   PORT: $PORT"
echo "   DATABASE_URL: ${DATABASE_URL:0:30}..."
echo "   MARKET_MODE: $NEXT_PUBLIC_MARKET_MODE"

# ===========================================
# CREATE NECESSARY DIRECTORIES
# ===========================================
echo "📁 Creating necessary directories..."

mkdir -p data logs db prisma
chmod 755 data logs db prisma

echo "✅ Directories created"

# ===========================================
# INSTALL DEPENDENCIES IF NOT INSTALLED
# ===========================================
echo "📦 Checking dependencies..."

if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    bun install
else
    echo "✅ Dependencies already installed"
fi

# ===========================================
# RUN DATABASE MIGRATIONS
# ===========================================
echo "🗄️  Running database migrations..."

bun run db:push

echo "✅ Database migrations completed"

# ===========================================
# CHECK DEPENDENT SERVICES
# ===========================================
echo "🔍 Checking dependent services..."

if [ "$REDIS_URL" ]; then
    echo "🔗 Redis configured: $REDIS_URL"
else
    echo "⚠️  Redis URL not set, using in-memory rate limiting"
fi

if [ "$DATABASE_URL" != "file:./data/dev.db" ]; then
    echo "🗄️  PostgreSQL configured: ${DATABASE_URL:0:50}..."
else
    echo "🗄️  SQLite configured"
fi

# ===========================================
# BUILD APPLICATION
# ===========================================
echo "🔨 Building application..."

bun run build

echo "✅ Build completed"

# ===========================================
# START APPLICATION
# ===========================================
echo "========================================"
echo "🚀 Starting Trading AI SHER"
echo "========================================"
echo "📊 Application URL: http://localhost:$PORT"
echo "🏥 Health Check: http://localhost:$PORT/api/health"
echo "📝 Logs: ./logs/"
echo "📁 Data: ./data/"
echo "========================================"

bun run start
