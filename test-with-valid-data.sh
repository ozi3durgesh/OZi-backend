#!/bin/bash

echo "🧪 Testing with Valid JSON Data..."
echo "=================================="

BASE_URL="http://localhost:3000"

# Test 1: Health Check
echo "1️⃣ Testing Health Check..."
curl -s "$BASE_URL/health" | jq '.' 2>/dev/null || echo "   ❌ Health check failed"
echo ""

# Test 2: EcomLog Test
echo "2️⃣ Testing EcomLog Test Endpoint..."
curl -s -X POST "$BASE_URL/api/ecommerce/test-ecomlog" | jq '.' 2>/dev/null || echo "   ❌ EcomLog test failed"
echo ""

# Test 3: Direct Logging with Valid Data
echo "3️⃣ Testing Direct Logging Endpoint..."
curl -s -X POST "$BASE_URL/api/ecommerce/log-order" \
  -H 'Content-Type: application/json' \
  -d '{
    "order": {
      "id": 12345,
      "user_id": 999,
      "order_amount": 1500.00,
      "payment_method": "cash_on_delivery",
      "delivery_address": "{\"address\": \"Test Address\", \"city\": \"Test City\", \"state\": \"Test State\"}"
    }
  }' | jq '.' 2>/dev/null || echo "   ❌ Direct logging failed"
echo ""

# Test 4: PHP Integration with Valid JSON
echo "4️⃣ Testing PHP Integration Endpoint..."
curl -s -X POST "$BASE_URL/api/ecommerce/php-integration" \
  -H 'Content-Type: application/json' \
  -d '{
    "order": {
      "id": 12346,
      "user_id": 999,
      "order_amount": 1500.00,
      "payment_method": "cash_on_delivery",
      "delivery_address": "{\"address\": \"Test Address\", \"city\": \"Test City\", \"state\": \"Test State\"}",
      "created_at": 1756128212
    }
  }' | jq '.' 2>/dev/null || echo "   ❌ PHP integration failed"
echo ""

echo "🎯 Test Summary:"
echo "   - Health Check: Should return 200 OK"
echo "   - EcomLog Test: Should create test log and return success"
echo "   - Direct Logging: Should create log entry for order 12345"
echo "   - PHP Integration: Should process order and return success"
echo ""
echo "📊 Check PM2 logs: pm2 logs next-app"
