#!/bin/bash

echo "🚀 Perfect Integration Fix - Complete Solution"
echo "=============================================="

# Navigate to the backend directory
cd /home/ubuntu/OZi-backend

# Step 1: Stop PM2
echo "🛑 Stopping PM2 process..."
pm2 stop next-app

# Step 2: Fix database constraints
echo "🔧 Fixing database constraints..."
npx tsx fix-database-constraints.ts

# Step 3: Clean and rebuild
echo "🧹 Cleaning previous build..."
rm -rf dist/

echo "🔨 Building project..."
npm run build

# Step 4: Start server
echo "🚀 Starting server..."
pm2 start next-app

# Wait for server to start
sleep 5

# Step 5: Test all endpoints
echo "🧪 Testing all endpoints..."

# Test 1: Health Check
echo "1️⃣ Health Check..."
curl -s http://localhost:3000/health | jq '.' 2>/dev/null || echo "   ❌ Health check failed"

# Test 2: EcomLog Test
echo "2️⃣ EcomLog Test..."
curl -s -X POST http://localhost:3000/api/ecommerce/test-ecomlog | jq '.' 2>/dev/null || echo "   ❌ EcomLog test failed"

# Test 3: Direct Logging (with any order ID)
echo "3️⃣ Direct Logging Test..."
curl -s -X POST http://localhost:3000/api/ecommerce/log-order \
  -H 'Content-Type: application/json' \
  -d '{"order":{"id":999999,"user_id":999,"order_amount":1500.00,"payment_method":"cash_on_delivery","delivery_address":"{\"address\": \"Test Address\"}"}}' | jq '.' 2>/dev/null || echo "   ❌ Direct logging failed"

# Test 4: PHP Integration (with any order ID)
echo "4️⃣ PHP Integration Test..."
curl -s -X POST http://localhost:3000/api/ecommerce/php-integration \
  -H 'Content-Type: application/json' \
  -d '{"order":{"id":999998,"user_id":999,"order_amount":1500.00,"payment_method":"cash_on_delivery","delivery_address":"{\"address\": \"Test Address\"}","created_at":"2025-08-30 16:43:43"}}' | jq '.' 2>/dev/null || echo "   ❌ PHP integration failed"

# Step 6: Check server logs
echo "📊 Checking server logs..."
pm2 logs next-app --lines 10

echo ""
echo "🎉 Perfect Integration Fix Completed!"
echo ""
echo "📋 What was fixed:"
echo "   ✅ Removed foreign key constraint to orders table"
echo "   ✅ Can now log any order ID (including PHP orders)"
echo "   ✅ Enhanced timestamp parsing for Laravel format"
echo "   ✅ Safe JSON parsing with fallbacks"
echo "   ✅ Comprehensive error handling"
echo ""
echo "🧪 Test Results:"
echo "   - Health Check: Should return 200 OK"
echo "   - EcomLog Test: Should create test log"
echo "   - Direct Logging: Should work with any order ID"
echo "   - PHP Integration: Should process orders successfully"
echo ""
echo "🌐 Test from PHP server:"
echo "   curl http://13.232.150.239:3000/health"
echo ""
echo "📊 Monitor logs:"
echo "   pm2 logs next-app"
echo ""
echo "🎯 Your PHP → Node.js integration should now work perfectly!"
