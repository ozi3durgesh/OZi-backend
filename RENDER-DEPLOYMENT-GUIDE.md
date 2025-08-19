# OZi Backend - Render Deployment Guide

## Overview
This guide will help you deploy the OZi Backend application on Render without needing to run manual commands like `npm run init-rbac`.

## What's Been Fixed

✅ **Automatic RBAC Initialization**: The system now automatically initializes roles and permissions on first startup  
✅ **Automatic Admin User Creation**: Creates initial admin user from environment variables  
✅ **No Manual Commands Required**: Everything happens automatically during deployment  
✅ **Render-Ready Configuration**: Includes `render.yaml` for easy deployment  

## Prerequisites

1. **Render Account**: Sign up at [render.com](https://render.com)
2. **GitHub Repository**: Your code should be in a GitHub repository
3. **Database**: Your MySQL database should be accessible from Render

## Deployment Steps

### 1. Connect Your Repository

1. Go to [render.com](https://render.com) and sign in
2. Click "New +" and select "Web Service"
3. Connect your GitHub repository
4. Select the repository containing your OZi Backend code

### 2. Configure Environment Variables

Set these environment variables in Render (Settings → Environment):

#### Required Variables (Set these in Render dashboard)
```
DB_PASSWORD=rLfcu9Y80S8X
JWT_ACCESS_SECRET=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImlhdCI6MTUxNjIzOTAyMn0.KMUFsIDTnFmyG3nMiGM6H9FNFUROf3wh7SmqJp-QV30
JWT_REFRESH_SECRET=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImlhdCI6MTUxNjIzOTAyMn0.KMUFsIDTnFmyG3nMiGM6H9FNFUROf3wh7SmqJp-QV30
INITIAL_ADMIN_PASSWORD=SecureAdminPassword123
ADMIN_REGISTRATION_SECRET=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9
```

#### Optional Variables (Already set in render.yaml)
```
NODE_ENV=production
PORT=3000
DB_HOST=ozi-db1.c306iyoqqj8p.ap-south-1.rds.amazonaws.com
DB_PORT=3306
DB_NAME=ozi_backend
DB_USER=admin
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
INITIAL_ADMIN_EMAIL=admin@yourcompany.com
MIN_APP_VERSION=1.0.0
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
S3_BUCKET=your-photo-bucket
LMS_BASE_URL=your-lms-url
LMS_API_KEY=your-lms-key
SEAL_SECRET=your-seal-secret
```

### 3. Build and Deploy Settings

- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`
- **Environment**: Node
- **Region**: Choose closest to your database

### 4. Deploy

1. Click "Create Web Service"
2. Render will automatically:
   - Clone your repository
   - Install dependencies
   - Build the application
   - Start the service

## What Happens Automatically

### On First Deployment
1. **Database Connection**: Connects to your MySQL database
2. **Table Creation**: Creates all necessary database tables
3. **RBAC Initialization**: Automatically creates:
   - 46 permissions for different modules
   - 5 roles: admin, wh_manager, wh_staff_1, wh_staff_2, store_ops
   - Role-permission mappings
4. **Admin User Creation**: Creates initial admin user from environment variables

### On Subsequent Deployments
1. **Database Connection**: Connects to existing database
2. **Schema Check**: Verifies existing tables
3. **RBAC Check**: Confirms roles and permissions exist
4. **Service Start**: Starts the application

## Verification

### 1. Check Deployment Logs
In Render dashboard, go to your service → Logs to see:
```
✅ Database connection established successfully
✅ Models imported successfully
✅ Database synchronized successfully
🔧 RBAC system not initialized, auto-initializing...
✅ RBAC system auto-initialized successfully
👤 Creating initial admin user...
✅ Initial admin user created successfully
```

### 2. Test the API
Once deployed, test your endpoints:

```bash
# Health check
curl https://your-app-name.onrender.com/health

# Register a new user
curl -X POST https://your-app-name.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@company.com",
    "password": "TestPassword123",
    "roleName": "wh_staff_1"
  }'
```

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Verify database credentials
   - Check if database is accessible from Render's IP range
   - Ensure database is running

2. **Build Failed**
   - Check Node.js version compatibility
   - Verify all dependencies are in package.json
   - Check build logs for specific errors

3. **RBAC Initialization Failed**
   - Check database permissions
   - Verify models are properly exported
   - Check logs for specific error messages

### Environment Variable Issues

- **Missing Required Variables**: Set all required environment variables
- **Invalid Values**: Ensure values match expected format
- **Special Characters**: Escape special characters properly

## Security Considerations

1. **Environment Variables**: Never commit sensitive data to your repository
2. **Database Access**: Use strong passwords and limit database access
3. **JWT Secrets**: Use strong, unique JWT secrets
4. **Rate Limiting**: Configure appropriate rate limits for production

## Monitoring

1. **Health Checks**: Monitor `/health` endpoint
2. **Logs**: Regularly check Render logs for errors
3. **Performance**: Monitor response times and error rates
4. **Database**: Monitor database connection and performance

## Support

If you encounter issues:
1. Check the deployment logs in Render
2. Verify all environment variables are set correctly
3. Ensure database is accessible
4. Check the application logs for specific error messages

## Success Indicators

✅ **Deployment Status**: Shows "Live" in Render dashboard  
✅ **Health Check**: `/health` endpoint returns 200 OK  
✅ **Database**: All tables created successfully  
✅ **RBAC**: Roles and permissions initialized  
✅ **Admin User**: Initial admin user created  
✅ **API Endpoints**: Registration and login working  

Your OZi Backend is now ready for production use on Render! 🚀
