# 🚀 AWS Server Deployment Instructions

## **🔍 Issue Identified:**

You're trying to run `fix-database.ts` from your **local machine**, but it needs to connect to your **AWS RDS database**. This won't work because:

1. **Network Access**: Your local machine can't directly access AWS RDS
2. **Security Groups**: RDS is configured to only allow connections from AWS instances
3. **Credentials**: The database is only accessible from within AWS network

## **✅ Solution: Deploy on AWS Server**

### **Step 1: SSH to Your AWS Server**
```bash
ssh ubuntu@13.232.150.239
```

### **Step 2: Navigate to Backend Directory**
```bash
cd /home/ubuntu/OZi-backend
```

### **Step 3: Check Current Status**
```bash
# Check if PM2 is running
pm2 status

# Check current logs
pm2 logs next-app --lines 10

# Check if ecom_logs table exists
mysql -h ozi-db1.c306iyoqqj8p.ap-south-1.rds.amazonaws.com -u admin -p ozi_backend -e "SHOW TABLES LIKE 'ecom_logs';"
```

### **Step 4: Run the Complete Fix Script**
```bash
# Make sure the script is executable
chmod +x deploy-all-fixes.sh

# Run the comprehensive fix
./deploy-all-fixes.sh
```

## **🔧 What the Script Will Do:**

1. **Stop PM2 Process** - Safely stop the current Node.js server
2. **Fix Database** - Create the missing `ecom_logs` table
3. **Build Project** - Compile TypeScript to JavaScript
4. **Start Server** - Restart PM2 with updated code
5. **Test Endpoints** - Verify all endpoints are working
6. **Show Logs** - Display recent server logs

## **🧪 Manual Testing (if needed):**

### **Test Database Connection:**
```bash
# Test if you can connect to the database
mysql -h ozi-db1.c306iyoqqj8p.ap-south-1.rds.amazonaws.com -u admin -p ozi_backend -e "SELECT 1;"
```

### **Test Node.js Endpoints:**
```bash
# Health check
curl http://localhost:3000/health

# Test EcomLog
curl -X POST http://localhost:3000/api/ecommerce/test-ecomlog

# Test PHP integration
curl -X POST http://localhost:3000/api/ecommerce/php-integration \
  -H 'Content-Type: application/json' \
  -d '{"order":{"id":12345,"user_id":999,"order_amount":1500.00}}'
```

## **🚨 Common Issues and Solutions:**

### **Issue 1: Permission Denied**
```bash
# Fix script permissions
chmod +x deploy-all-fixes.sh
chmod +x test-all-endpoints.sh
```

### **Issue 2: PM2 Not Found**
```bash
# Install PM2 globally
npm install -g pm2
```

### **Issue 3: Database Connection Failed**
```bash
# Check if RDS is accessible
ping ozi-db1.c306iyoqqj8p.ap-south-1.rds.amazonaws.com

# Check security group allows your AWS instance
# The instance should be in the same VPC as RDS
```

### **Issue 4: Port 3000 Already in Use**
```bash
# Check what's using port 3000
sudo netstat -tlnp | grep :3000

# Kill the process if needed
sudo kill -9 [PID]
```

## **📊 Expected Results After Deployment:**

### **Database:**
- ✅ `ecom_logs` table created successfully
- ✅ Test entry inserted and verified

### **Node.js Server:**
- ✅ PM2 process running with status "online"
- ✅ All endpoints responding correctly
- ✅ No more timestamp or database errors

### **Integration:**
- ✅ PHP can successfully call Node.js
- ✅ Orders are logged to `ecom_logs` table
- ✅ No more 404 or 500 errors

## **🔍 Verification Commands:**

### **Check Database:**
```bash
mysql -h ozi-db1.c306iyoqqj8p.ap-south-1.rds.amazonaws.com -u admin -p ozi_backend -e "
  SHOW TABLES LIKE 'ecom_logs';
  SELECT COUNT(*) as total_logs FROM ecom_logs;
  SELECT * FROM ecom_logs ORDER BY created_at DESC LIMIT 3;
"
```

### **Check Node.js:**
```bash
# Check PM2 status
pm2 status

# Check logs
pm2 logs next-app --lines 20

# Check if server is responding
curl -s http://localhost:3000/health | jq '.'
```

### **Check PHP Integration:**
```bash
# From your PHP server, test connectivity
curl http://13.232.150.239:3000/health
```

## **🎯 Final Result:**

After running `./deploy-all-fixes.sh` on your AWS server:

- ✅ **Database table created**
- ✅ **Node.js server updated and running**
- ✅ **All endpoints working**
- ✅ **PHP integration fixed**
- ✅ **No more errors in logs**

**The key is to run the fix script ON your AWS server, not from your local machine!** 🚀
