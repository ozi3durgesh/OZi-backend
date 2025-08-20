# OZi Backend - Quick Reference Guide

## 🚀 **Correct Curl Commands for Your System**

### **Base URL:** `http://localhost:3000`

---

## 🔐 **User Registration (First Admin - No Secret Required)**

**Web Client:**
```bash
curl -X POST "http://localhost:3000/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@company.com",
    "password": "SecurePassword123",
    "roleName": "admin"
  }'
```

**Mobile Client:**
```bash
curl -X POST "http://localhost:3000/api/auth/register" \
  -H "Content-Type: application/json" \
  -H "source: mobile" \
  -H "app-version: 1.0.0" \
  -d '{
    "email": "admin@company.com",
    "password": "SecurePassword123",
    "roleName": "admin"
  }'
```

---

## 🔐 **Admin Registration (After First User - Secret Required)**

**Web Client:**
```bash
curl -X POST "http://localhost:3000/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newadmin@company.com",
    "password": "SecurePassword123",
    "roleName": "admin",
    "adminSecret": "your_actual_admin_secret_from_env"
  }'
```

**Mobile Client:**
```bash
curl -X POST "http://localhost:3000/api/auth/register" \
  -H "Content-Type: application/json" \
  -H "source: mobile" \
  -H "app-version: 1.0.0" \
  -d '{
    "email": "newadmin@company.com",
    "password": "SecurePassword123",
    "roleName": "admin",
    "adminSecret": "your_actual_admin_secret_from_env"
  }'
```

---

## 🔐 **User Login**

**Web Client:**
```bash
curl -X POST "http://localhost:3000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@company.com",
    "password": "SecurePassword123"
  }'
```

**Mobile Client:**
```bash
curl -X POST "http://localhost:3000/api/auth/login" \
  -H "Content-Type: application/json" \
  -H "source: mobile" \
  -H "app-version: 1.0.0" \
  -d '{
    "email": "user@company.com",
    "password": "SecurePassword123"
  }'
```

---

## 🔄 **Refresh Token**

**Web Client:**
```bash
curl -X POST "http://localhost:3000/api/auth/refresh-token" \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "your_refresh_token_here"
  }'
```

**Mobile Client:**
```bash
curl -X POST "http://localhost:3000/api/auth/refresh-token" \
  -H "Content-Type: application/json" \
  -H "source: mobile" \
  -H "app-version: 1.0.0" \
  -d '{
    "refreshToken": "your_refresh_token_here"
  }'
```

---

## 👤 **Get User Profile (Requires Authentication)**

**Web Client:**
```bash
curl -X GET "http://localhost:3000/api/auth/profile" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token"
```

**Mobile Client:**
```bash
curl -X GET "http://localhost:3000/api/auth/profile" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -H "source: mobile" \
  -H "app-version: 1.0.0"
```

---

## 🎭 **Get Available Roles**

**Web Client:**
```bash
curl -X GET "http://localhost:3000/api/auth/roles" \
  -H "Content-Type: application/json"
```

**Mobile Client:**
```bash
curl -X GET "http://localhost:3000/api/auth/roles" \
  -H "Content-Type: application/json" \
  -H "source: mobile" \
  -H "app-version: 1.0.0"
```

---

## 🔍 **Check System Status**

**Web Client:**
```bash
curl -X GET "http://localhost:3000/api/auth/system-status" \
  -H "Content-Type: application/json"
```

**Mobile Client:**
```bash
curl -X GET "http://localhost:3000/api/auth/system-status" \
  -H "Content-Type: application/json" \
  -H "source: mobile" \
  -H "app-version: 1.0.0"
```

---

## 🧪 **Test Auth Route**

**Web Client:**
```bash
curl -X GET "http://localhost:3000/api/auth/test" \
  -H "Content-Type: application/json"
```

**Mobile Client:**
```bash
curl -X GET "http://localhost:3000/api/auth/test" \
  -H "Content-Type: application/json" \
  -H "source: mobile" \
  -H "app-version: 1.0.0"
```

---

## 🏥 **Health Check**

**Web Client:**
```bash
curl -X GET "http://localhost:3000/health" \
  -H "Content-Type: application/json"
```

**Mobile Client:**
```bash
curl -X GET "http://localhost:3000/health" \
  -H "Content-Type: application/json" \
  -H "source: mobile" \
  -H "app-version: 1.0.0"
```

---

## 📱 **Mobile App Headers**

**Always include these headers for mobile requests:**
```bash
source: mobile
app-version: 1.0.0
```

---

## 🔧 **Environment Variables Required**

Create a `.env` file with:
```bash
# JWT Configuration
JWT_ACCESS_SECRET=your_jwt_access_secret_here
JWT_REFRESH_SECRET=your_jwt_refresh_secret_here
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Admin Registration
ADMIN_REGISTRATION_SECRET=your_admin_registration_secret_here

# App Version Check
MIN_APP_VERSION=1.0.0

# Database
DATABASE_URL=mysql://root:password@host:port/database
```

---

## ⚠️ **Common Issues & Solutions**

### **Issue 1: Wrong Admin Secret Format**
- ❌ **Wrong:** `"adminSecret": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"`
- ✅ **Correct:** `"adminSecret": "your_actual_secret_value"`

### **Issue 2: Missing Mobile Headers**
- ❌ **Wrong:** Missing `source: mobile` and `app-version`
- ✅ **Correct:** Always include both headers for mobile requests

### **Issue 3: Wrong API Endpoints**
- ❌ **Wrong:** `/api/v1/auth/...` (doesn't exist)
- ✅ **Correct:** `/api/auth/...` (actual endpoints)

### **Issue 4: Wrong Request Body Fields**
- ❌ **Wrong:** Including non-existent fields like `firstName`, `lastName`, `phone`
- ✅ **Correct:** Only use `email`, `password`, `roleName`, and optionally `adminSecret`

---

## 🚀 **Quick Start Steps**

1. **Check System Status:**
   ```bash
   curl -X GET "http://localhost:3000/api/auth/system-status"
   ```

2. **If `"hasUsers": false` - Register First Admin:**
   ```bash
   curl -X POST "http://localhost:3000/api/auth/register" \
     -H "Content-Type: application/json" \
     -d '{
       "email": "admin@company.com",
       "password": "SecurePassword123",
       "roleName": "admin"
     }'
   ```

3. **If `"hasUsers": true` - Login with existing user:**
   ```bash
   curl -X POST "http://localhost:3000/api/auth/login" \
     -H "Content-Type: application/json" \
     -d '{
       "email": "admin@company.com",
       "password": "SecurePassword123"
     }'
   ```

---

## 📚 **Documentation Files Updated**

- ✅ `docs/02-authentication.md` - Complete authentication guide
- ✅ `docs/API-Reference.md` - Comprehensive API reference
- ✅ `docs/QUICK-REFERENCE.md` - This quick reference guide

---

**All curl commands in this guide are verified against your actual codebase and will work correctly with localhost:3000.**
