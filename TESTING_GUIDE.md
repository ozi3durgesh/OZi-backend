# Packing and Handover Module - Testing Guide

## 🚀 **Quick Start Testing (No External Services Required)**

### **1. Setup Environment**
```bash
# Install dependencies
npm install

# Setup database tables
npm run setup-packing

# Generate mock data (requires existing users/roles)
npm run generate-mock-data
```

### **2. Environment Variables for Testing**
```bash
# Create .env file with minimal configuration
DB_NAME=ozi_backend
DB_USER=root
DB_PASSWORD=your_password
DB_HOST=127.0.0.1
DB_PORT=3306

# Optional for testing
JWT_SECRET=your_test_jwt_secret
TESTING=true
```

### **3. Test the Complete Workflow**

#### **Step 1: Get JWT Token**
```bash
# Login to get JWT token
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "manager@ozi.com",
    "password": "password123"
  }'

# Store the token
export JWT_TOKEN="your_jwt_token_here"
```

#### **Step 2: Start Packing Job**
```bash
# Start packing job from completed picking wave
curl -X POST http://localhost:3000/api/packing/start \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{
    "waveId": 1,
    "packerId": 2,
    "priority": "HIGH",
    "workflowType": "DEDICATED_PACKER",
    "specialInstructions": "Handle with care - fragile items"
  }'
```

#### **Step 3: Verify Items**
```bash
# Verify items during packing
curl -X POST http://localhost:3000/api/packing/verify \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{
    "jobId": 1,
    "orderId": 1,
    "sku": "SKU-1-1-1",
    "packedQuantity": 3,
    "verificationNotes": "All items verified and packed"
  }'
```

#### **Step 4: Complete Packing**
```bash
# Complete packing with photos and seals
curl -X POST http://localhost:3000/api/packing/complete \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{
    "jobId": 1,
    "photos": [
      {
        "photoType": "POST_PACK",
        "photoUrl": "https://mock-s3.com/test-photo.jpg",
        "metadata": {
          "location": "Packing Station A",
          "device": "Mobile App"
        }
      }
    ],
    "seals": [
      {
        "sealNumber": "TEST-SEAL-123",
        "sealType": "PLASTIC",
        "orderId": 1
      }
    ]
  }'
```

#### **Step 5: Assign Rider**
```bash
# Assign rider for delivery
curl -X POST http://localhost:3000/api/handover/assign-rider \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{
    "jobId": 1,
    "riderId": 1,
    "specialInstructions": "Deliver before 6 PM"
  }'
```

#### **Step 6: Confirm Handover**
```bash
# Confirm handover to rider
curl -X POST http://localhost:3000/api/handover/confirm \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{
    "handoverId": 1,
    "riderId": 1
  }'
```

## 📱 **Mobile App Testing Commands**

### **Packing Operations (Mobile)**
```bash
# Get job status
curl -X GET http://localhost:3000/api/packing/status/1 \
  -H "Authorization: Bearer $JWT_TOKEN"

# Verify another item
curl -X POST http://localhost:3000/api/packing/verify \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{
    "jobId": 1,
    "orderId": 2,
    "sku": "SKU-1-2-1",
    "packedQuantity": 2
  }'
```

### **Handover Operations (Mobile)**
```bash
# Update handover status
curl -X PUT http://localhost:3000/api/handover/1/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{
    "status": "IN_TRANSIT",
    "additionalData": {
      "location": "40.7128,-74.0060",
      "estimatedDelivery": "2024-01-15T19:00:00Z"
    }
  }'

# Update rider location
curl -X POST http://localhost:3000/api/handover/riders/1/location \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{
    "location": {
      "lat": 40.7128,
      "lng": -74.0060
    }
  }'
```

## 💻 **Web Dashboard Testing Commands**

### **Monitoring & Analytics**
```bash
# Get all jobs awaiting handover
curl -X GET http://localhost:3000/api/packing/awaiting-handover \
  -H "Authorization: Bearer $JWT_TOKEN"

# Get SLA status
curl -X GET http://localhost:3000/api/packing/sla-status \
  -H "Authorization: Bearer $JWT_TOKEN"

# Get available riders
curl -X GET http://localhost:3000/api/handover/riders/available \
  -H "Authorization: Bearer $JWT_TOKEN"

# Get LMS sync status
curl -X GET http://localhost:3000/api/handover/lms/sync-status \
  -H "Authorization: Bearer $JWT_TOKEN"
```

### **Management Operations**
```bash
# Reassign packing job
curl -X POST http://localhost:3000/api/packing/reassign/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{
    "newPackerId": 3,
    "reason": "Original packer unavailable"
  }'

# Retry LMS sync
curl -X POST http://localhost:3000/api/handover/1/resync-lms \
  -H "Authorization: Bearer $JWT_TOKEN"
```

## 🧪 **Testing Scenarios**

### **Scenario 1: Complete Packing Workflow**
1. Start packing job from completed picking wave
2. Verify all items one by one
3. Complete packing with photos and seals
4. Assign rider for handover
5. Confirm handover
6. Update delivery status

### **Scenario 2: Error Handling**
1. Try to start packing from non-completed wave
2. Try to verify more items than picked
3. Try to complete packing with incomplete items
4. Try to assign unavailable rider
5. Try to confirm handover with wrong rider ID

### **Scenario 3: SLA Testing**
1. Create jobs with different priorities
2. Monitor SLA status
3. Check SLA breaches
4. Test SLA calculations

### **Scenario 4: Rider Management**
1. Create new riders
2. Update rider availability
3. Track rider performance
4. Test rider assignment logic

## 🔍 **Testing Checklist**

### **Functional Testing**
- [ ] Packing job creation
- [ ] Item verification workflow
- [ ] Photo evidence capture
- [ ] Seal management
- [ ] Rider assignment
- [ ] Handover confirmation
- [ ] Status updates
- [ ] SLA tracking

### **Permission Testing**
- [ ] Packer can only access packing operations
- [ ] Rider can only access handover operations
- [ ] Manager can access all operations
- [ ] Admin has full access
- [ ] Unauthorized access is blocked

### **Data Validation Testing**
- [ ] Required field validation
- [ ] Data type validation
- [ ] Business rule validation
- [ ] Constraint validation

### **Error Handling Testing**
- [ ] Invalid input handling
- [ ] Database error handling
- [ ] External service error handling
- [ ] Graceful degradation

## 🐛 **Troubleshooting**

### **Common Issues**

#### **1. Database Connection Error**
```bash
# Check MySQL service
sudo systemctl status mysql

# Check database credentials
mysql -u root -p -h 127.0.0.1
```

#### **2. Table Creation Error**
```bash
# Drop existing tables manually if needed
mysql -u root -p -h 127.0.0.1 ozi_backend
DROP TABLE IF EXISTS packing_jobs, packing_items, photo_evidence, seals, riders, handovers, lms_shipments, packing_events;
```

#### **3. Permission Error**
```bash
# Check user roles and permissions
npm run debug-permissions
```

#### **4. JWT Token Error**
```bash
# Check JWT secret in environment
echo $JWT_SECRET

# Regenerate token
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "manager@ozi.com", "password": "password123"}'
```

## 📊 **Performance Testing**

### **Load Testing**
```bash
# Test with multiple concurrent requests
for i in {1..10}; do
  curl -X POST http://localhost:3000/api/packing/start \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $JWT_TOKEN" \
    -d "{\"waveId\": $i, \"packerId\": 2}" &
done
wait
```

### **Database Performance**
```bash
# Check query performance
mysql -u root -p -h 127.0.0.1 ozi_backend -e "SHOW INDEXES FROM packing_jobs;"
mysql -u root -p -h 127.0.0.1 ozi_backend -e "EXPLAIN SELECT * FROM packing_jobs WHERE status = 'PENDING';"
```

## 🎯 **Success Criteria**

### **Functional Success**
- ✅ All API endpoints respond correctly
- ✅ Data is stored and retrieved properly
- ✅ Business logic works as expected
- ✅ Error handling is robust

### **Performance Success**
- ✅ API response time < 500ms
- ✅ Database queries are optimized
- ✅ No memory leaks
- ✅ Handles concurrent requests

### **Security Success**
- ✅ Authentication works correctly
- ✅ Authorization is enforced
- ✅ Data is properly validated
- ✅ No SQL injection vulnerabilities

## 🚀 **Next Steps After Testing**

1. **Integration Testing**: Test with real external services
2. **User Acceptance Testing**: Test with actual warehouse staff
3. **Performance Optimization**: Optimize based on test results
4. **Production Deployment**: Deploy to production environment
5. **Monitoring Setup**: Configure production monitoring

---

## 📞 **Support**

If you encounter issues during testing:

1. Check the troubleshooting section above
2. Review the console logs for error messages
3. Verify database connectivity and permissions
4. Ensure all environment variables are set correctly
5. Check that all dependencies are installed

For additional support, refer to the main documentation or contact the development team.
