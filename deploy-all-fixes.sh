#!/bin/bash

echo "🚀 Deploying ALL EcomLog Database Fixes..."
echo "============================================"

# Navigate to the backend directory
cd /home/ubuntu/OZi-backend

# Stop the current PM2 process
echo "🛑 Stopping current PM2 process..."
pm2 stop next-app

# Fix 1: Run database fix script to create ecom_logs table
echo "🔧 Fixing database table..."
npx tsx fix-database.ts

# Fix 2: Build the project
echo "🔨 Building the project..."
npm run build

# Fix 3: Start the server again
echo "🚀 Starting the server..."
pm2 start next-app

# Wait a moment for server to start
sleep 3

# Fix 4: Test all endpoints
echo "🧪 Testing all endpoints..."

# Test health check
echo "1. Testing health check..."
curl -s http://localhost:3000/health | jq '.' || echo "Health check failed"

# Test EcomLog endpoint
echo "2. Testing EcomLog endpoint..."
curl -s -X POST http://localhost:3000/api/ecommerce/test-ecomlog | jq '.' || echo "EcomLog test failed"

# Test direct logging endpoint
echo "3. Testing direct logging endpoint..."
curl -s -X POST http://localhost:3000/api/ecommerce/log-order \
  -H 'Content-Type: application/json' \
  -d '{"order":{"id":12345,"user_id":999,"order_amount":1500.00,"payment_method":"cash_on_delivery","delivery_address":"Test Address"}}' | jq '.' || echo "Direct logging test failed"

# Test PHP integration endpoint
echo "4. Testing PHP integration endpoint..."
curl -s -X POST http://localhost:3000/api/ecommerce/php-integration \
  -H 'Content-Type: application/json' \
  -d '{"order":{"id":12346,"user_id":999,"order_amount":1500.00,"payment_method":"cash_on_delivery","delivery_address":"Test Address","created_at":1756128212}}' | jq '.' || echo "PHP integration test failed"

# Check the logs
echo "📊 Checking server logs..."
pm2 logs next-app --lines 10

echo ""
echo "✅ Deployment completed!"
echo ""
echo "🔍 Manual testing commands:"
echo "1. Health check: curl http://localhost:3000/health"
echo "2. EcomLog test: curl -X POST http://localhost:3000/api/ecommerce/test-ecomlog"
echo "3. Direct logging: curl -X POST http://localhost:3000/api/ecommerce/log-order -H 'Content-Type: application/json' -d '{\"order\":{\"id\":12345}}'"
echo "4. PHP integration: curl -X POST http://localhost:3000/api/ecommerce/php-integration -H 'Content-Type: application/json' -d '{\"order\":{\"id\":12346}}'"
echo ""
echo "📊 Check PM2 logs: pm2 logs next-app"
echo "🌐 Test from PHP server: curl http://13.232.150.239:3000/health"
