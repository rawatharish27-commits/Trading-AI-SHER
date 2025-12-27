#!/bin/bash
# Production Startup Script
# Trading AI SHER - Local Deployment

echo "🚀 Starting Trading AI SHER - Production Mode"
echo "========================================"

# Kill any existing processes
echo "🛑 Stopping existing processes..."
pkill -f "next dev"
pkill -f "next start"

# Wait for processes to stop
sleep 2

# ===========================================
# CHECK ENVIRONMENT
# ===========================================
echo "📋 Checking environment..."

if [ ! -f .env.local ]; then
    echo "❌ .env.local file not found!"
    echo "📝 Creating .env.local from template..."
    cp .env.prod.template .env.local
fi

# Load environment
export $(cat .env.local | grep -v '^#' | xargs)

echo "✅ Environment loaded"
echo "   NODE_ENV: $NODE_ENV"
echo "   PORT: $PORT"

# ===========================================
# INSTALL DEPENDENCIES
# ===========================================
echo "📦 Checking dependencies..."

if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    bun install
else
    echo "✅ Dependencies already installed"
fi

# ===========================================
# SETUP DATABASE
# ===========================================
echo "🗄️  Setting up database..."

# Run migrations
bun run db:push

echo "✅ Database ready"

# ===========================================
# START DEVELOPMENT SERVER
# ===========================================
echo "========================================"
echo "🚀 Starting Trading AI SHER"
echo "========================================"
echo "📊 Application URL: http://localhost:$PORT"
echo "🏥 Health Check: http://localhost:$PORT/api/health"
echo "📝 Logs: ./logs/"
echo "📁 Data: ./db/"
echo "========================================"

bun run dev
