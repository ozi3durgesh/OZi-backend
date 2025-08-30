# 🚀 EcomLog Database Fix - Deployment Instructions

## **Current Issues Identified:**

1. **Missing Database Table**: `ecom_logs` table doesn't exist
2. **Route Not Found**: `/api/ecommerce/log-order` returns 404
3. **Timestamp Error**: Invalid time value in Helpers.ts
4. **Code Not Deployed**: Updated code is not running on AWS

## **🔧 Step-by-Step Fix Process:**

### **Step 1: Fix Database Table (Run First)**

```bash
# On your AWS server, navigate to the backend directory
cd /home/ubuntu/OZi-backend

# Run the database fix script (TypeScript version)
npx tsx fix-database.ts
```

**Expected Output:**
```
🔧 Connecting to database...
✅ Database connected successfully
📋 Checking for ecom_logs table...
📋 Creating ecom_logs table...
✅ ecom_logs table created successfully
🧪 Testing EcomLog insertion...
✅ Test record inserted successfully
📊 Recent logs: [...]
🎉 Database fix completed successfully!
```

### **Step 2: Update Critical Files**

#### **2.1 Fix Helpers.ts (Critical - Fixes timestamp error)**

```bash
# Edit the file
nano src/utils/Helpers.ts
```

**Replace the problematic timestamp code with:**

```typescript
// Fix timestamp conversion - handle both string and number formats
let orderDate: Date;
if (typeof order.created_at === 'string') {
  orderDate = new Date(order.created_at);
} else if (typeof order.created_at === 'number') {
  // If it's a Unix timestamp, convert to milliseconds
  orderDate = new Date(order.created_at * 1000);
} else {
  // Default to current date if invalid
  orderDate = new Date();
}

const utcDatetime = new Date(orderDate.toISOString());
```

#### **2.2 Add Missing Controller Method**

```bash
# Edit the controller
nano src/controllers/EasyEcomWebhookController.ts
```

**Add this method before the closing brace:**

```typescript
/**
 * Direct logging endpoint for PHP - creates EcomLog entry immediately
 */
public static async logOrderDirectly(req: Request, res: Response): Promise<void> {
  try {
    const { order } = req.body;
    
    if (!order) {
      ResponseHandler.error(res, 'Order data is required', 400);
      return;
    }

    console.log('📝 Direct logging called for order:', order.id);
    
    // Create EcomLog entry immediately
    const ecomLog = await EcomLog.create({
      order_id: order.id,
      action: 'order_received_from_php',
      payload: JSON.stringify({
        order_id: order.id,
        user_id: order.user_id,
        order_amount: order.order_amount,
        payment_method: order.payment_method,
        delivery_address: order.delivery_address,
        timestamp: new Date().toISOString()
      }),
      response: JSON.stringify({
        status: 'logged_successfully',
        node_service: 'ozi-backend',
        timestamp: new Date().toISOString()
      }),
      status: 'success'
    });
    
    const logData = ecomLog.get({ plain: true }) as any;
    console.log('✅ EcomLog created successfully:', logData);
    
    ResponseHandler.success(res, {
      message: 'Order logged successfully in Node.js database',
      order_id: order.id,
      log_id: logData.id,
      log_entry: logData
    });
    
  } catch (error: any) {
    console.error('❌ Direct logging error:', error);
    ResponseHandler.error(res, `Direct logging failed: ${error.message}`, 500);
  }
}
```

#### **2.3 Add Route**

```bash
# Edit the routes file
nano src/routes/easyEcomWebhookRoutes.ts
```

**Add this line after the php-integration route:**

```typescript
// Direct logging endpoint for PHP
router.post('/log-order', 
  EasyEcomWebhookController.logOrderDirectly
);
```

### **Step 3: Rebuild and Restart**

```bash
# Build the project
npm run build

# Stop the current PM2 process
pm2 stop next-app

# Start the server again
pm2 start next-app

# Check the logs
pm2 logs next-app
```

### **Step 4: Test the Fixes**

#### **4.1 Test Health Check**
```bash
curl http://13.232.150.239:3000/health
```

#### **4.2 Test EcomLog Endpoint**
```bash
curl -X POST http://13.232.150.239:3000/api/ecommerce/log-order \
  -H "Content-Type: application/json" \
  -d '{
    "order": {
      "id": 12345,
      "user_id": 999,
      "order_amount": 1500.00,
      "payment_method": "cash_on_delivery",
      "delivery_address": "Test Address"
    }
  }'
```

#### **4.3 Test PHP Integration**
```bash
curl -X POST http://13.232.150.239:3000/api/ecommerce/php-integration \
  -H "Content-Type: application/json" \
  -d '{
    "order": {
      "id": 12346,
      "user_id": 999,
      "order_amount": 1500.00,
      "payment_method": "cash_on_delivery",
      "delivery_address": "Test Address",
      "created_at": 1756128212
    }
  }'
```

## **🔍 Verification Steps:**

### **1. Check Database Table**
```sql
-- Connect to your MySQL database
mysql -h ozi-db1.c306iyoqqj8p.ap-south-1.rds.amazonaws.com -u admin -p ozi_backend

-- Check if table exists
SHOW TABLES LIKE 'ecom_logs';

-- Check table structure
DESCRIBE ecom_logs;

-- Check for recent entries
SELECT * FROM ecom_logs ORDER BY created_at DESC LIMIT 5;
```

### **2. Check PM2 Logs**
```bash
pm2 logs next-app --lines 50
```

**Look for:**
- ✅ ecom_logs table created successfully
- 📝 Direct logging called for order: [order_id]
- ✅ EcomLog created successfully

### **3. Check PHP Logs**
```bash
tail -f /var/www/html/oziadminpanel/storage/logs/laravel.log
```

**Look for:**
- Order logged successfully in Node.js database
- Order processed via Node.js service

## **🚨 Troubleshooting:**

### **If Database Fix Fails:**
1. Check database credentials in `.env`
2. Verify network connectivity to RDS
3. Check if user has CREATE TABLE permissions

### **If Routes Still Return 404:**
1. Verify the route is added to `easyEcomWebhookRoutes.ts`
2. Check if `easyEcomWebhookRoutes` is imported in `app.ts`
3. Ensure the route is mounted at `/api/ecommerce`

### **If EcomLog.create Still Fails:**
1. Check if the table was created successfully
2. Verify the EcomLog model is properly imported
3. Check for any TypeScript compilation errors

## **📊 Expected Results After Fix:**

1. **Database**: `ecom_logs` table exists with proper structure
2. **Endpoints**: All `/api/ecommerce/*` endpoints are accessible
3. **Logging**: Every PHP order creates an EcomLog entry
4. **Integration**: PHP → Node.js → Database flow works end-to-end

## **🎯 Success Indicators:**

- ✅ `ecom_logs` table exists in database
- ✅ `/api/ecommerce/log-order` returns 200
- ✅ `/api/ecommerce/php-integration` returns 200
- ✅ PHP logs show successful Node.js integration
- ✅ Node.js logs show successful EcomLog creation
- ✅ Database contains EcomLog entries for orders

Run these fixes in order and the EcomLog database insertion should work properly!
