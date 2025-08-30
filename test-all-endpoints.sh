#!/bin/bash

echo "🧪 Testing ALL Node.js Endpoints..."
echo "=================================="

BASE_URL="http://localhost:3000"
NODE_IP="13.232.150.239"

echo "🌐 Testing endpoints on: $BASE_URL"
echo "🌐 External IP: $NODE_IP"
echo ""

# Test 1: Health Check
echo "1️⃣ Testing Health Check..."
echo "   Local: curl $BASE_URL/health"
curl -s "$BASE_URL/health" | jq '.' 2>/dev/null || echo "   ❌ Local health check failed"
echo "   External: curl $NODE_IP:3000/health"
curl -s "$NODE_IP:3000/health" | jq '.' 2>/dev/null || echo "   ❌ External health check failed"
echo ""

# Test 2: EcomLog Test
echo "2️⃣ Testing EcomLog Test Endpoint..."
echo "   Local: curl -X POST $BASE_URL/api/ecommerce/test-ecomlog"
curl -s -X POST "$BASE_URL/api/ecommerce/test-ecomlog" | jq '.' 2>/dev/null || echo "   ❌ Local EcomLog test failed"
echo "   External: curl -X POST $NODE_IP:3000/api/ecommerce/test-ecomlog"
curl -s -X POST "$NODE_IP:3000/api/ecommerce/test-ecomlog" | jq '.' 2>/dev/null || echo "   ❌ External EcomLog test failed"
echo ""

# Test 3: Direct Logging
echo "3️⃣ Testing Direct Logging Endpoint..."
echo "   Local: curl -X POST $BASE_URL/api/ecommerce/log-order"
curl -s -X POST "$BASE_URL/api/ecommerce/log-order" \
  -H 'Content-Type: application/json' \
  -d '{"order":{"id":12345,"user_id":999,"order_amount":1500.00,"payment_method":"cash_on_delivery","delivery_address":"Test Address"}}' | jq '.' 2>/dev/null || echo "   ❌ Local direct logging failed"
echo "   External: curl -X POST $NODE_IP:3000/api/ecommerce/log-order"
curl -s -X POST "$NODE_IP:3000/api/ecommerce/log-order" \
  -H 'Content-Type: application/json' \
  -d '{"order":{"id":12345,"user_id":999,"order_amount":1500.00,"payment_method":"cash_on_delivery","delivery_address":"Test Address"}}' | jq '.' 2>/dev/null || echo "   ❌ External direct logging failed"
echo ""

# Test 4: PHP Integration
echo "4️⃣ Testing PHP Integration Endpoint..."
echo "   Local: curl -X POST $BASE_URL/api/ecommerce/php-integration"
curl -s -X POST "$BASE_URL/api/ecommerce/php-integration" \
  -H 'Content-Type: application/json' \
  -d '{"order":{"id":12346,"user_id":999,"order_amount":1500.00,"payment_method":"cash_on_delivery","delivery_address":"Test Address","created_at":1756128212}}' | jq '.' 2>/dev/null || echo "   ❌ Local PHP integration failed"
echo "   External: curl -X POST $NODE_IP:3000/api/ecommerce/php-integration"
curl -s -X POST "$NODE_IP:3000/api/ecommerce/php-integration" \
  -H 'Content-Type: application/json' \
  -d '{"order":{"id":12346,"user_id":999,"order_amount":1500.00,"payment_method":"cash_on_delivery","delivery_address":"Test Address","created_at":1756128212}}' | jq '.' 2>/dev/null || echo "   ❌ External PHP integration failed"
echo ""

# Test 5: Database Connection
echo "5️⃣ Testing Database Connection..."
echo "   Checking if ecom_logs table exists and can be queried..."
curl -s -X POST "$BASE_URL/api/ecommerce/test-ecomlog" | jq '.total_logs' 2>/dev/null && echo "   ✅ Database connection working" || echo "   ❌ Database connection failed"
echo ""

echo "🎯 Test Summary:"
echo "   - Health Check: Should return 200 OK"
echo "   - EcomLog Test: Should create test log and return success"
echo "   - Direct Logging: Should create log entry for order 12345"
echo "   - PHP Integration: Should process order and return success"
echo "   - Database: Should show total_logs count"
echo ""
echo "📊 Check PM2 logs for any errors: pm2 logs next-app"
echo "🌐 Test from PHP server: curl $NODE_IP:3000/health"
