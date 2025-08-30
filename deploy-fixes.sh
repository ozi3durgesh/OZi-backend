#!/bin/bash

echo "🚀 Deploying EcomLog Database Fixes..."
echo "======================================"

# Navigate to the backend directory
cd /home/ubuntu/OZi-backend

# Stop the current PM2 process
echo "🛑 Stopping current PM2 process..."
pm2 stop next-app

# Fix 1: Run database fix script
echo "🔧 Fixing database table..."
npx tsx fix-database.ts

# Fix 2: Build the project
echo "🔨 Building the project..."
npm run build

# Fix 3: Start the server again
echo "🚀 Starting the server..."
pm2 start next-app

# Check the logs
echo "📊 Checking server logs..."
pm2 logs next-app --lines 10

echo ""
echo "✅ Deployment completed!"
echo ""
echo "🔍 To test the fixes:"
echo "1. Test health check: curl http://localhost:3000/health"
echo "2. Test EcomLog: curl -X POST http://localhost:3000/api/ecommerce/test-ecomlog"
echo "3. Test direct logging: curl -X POST http://localhost:3000/api/ecommerce/log-order -H 'Content-Type: application/json' -d '{\"order\":{\"id\":12345}}'"
echo ""
echo "📊 Check PM2 logs: pm2 logs next-app"
