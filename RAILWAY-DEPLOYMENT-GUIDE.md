# Deploying OZi Backend to Railway - Complete Guide

## 🚀 Why Railway is Better for Node.js APIs

Railway is **highly recommended** for Node.js backend APIs because:
- ✅ **Native Node.js support** - No serverless limitations
- ✅ **Built-in database hosting** - MySQL, PostgreSQL, MongoDB
- ✅ **Automatic deployments** - Git-based deployments
- ✅ **Better performance** - No cold starts
- ✅ **More generous free tier** - $5 credit monthly
- ✅ **Simpler setup** - Less configuration needed

---

## Prerequisites

1. **GitHub Account** - Your code must be in a GitHub repository
2. **Railway Account** - Sign up at [railway.app](https://railway.app)
3. **Credit Card** - Required for Railway account (free tier available)

---

## Step 1: Prepare Your Project

### 1.1 Update package.json
Ensure your `package.json` has the correct start script:

```json
{
  "scripts": {
    "start": "node dist/server.js",
    "build": "tsc",
    "dev": "nodemon",
    "init-rbac": "ts-node src/script/initializeRBAC.ts",
    "test-rbac": "ts-node src/script/testRBAC.ts"
  }
}
```

### 1.2 Create railway.json (Optional)
Create a `railway.json` file for custom configuration:

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm start",
    "healthcheckPath": "/api/auth/system-status",
    "healthcheckTimeout": 100,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

---

## Step 2: Deploy to Railway

### Method 1: Deploy via Railway Dashboard (Recommended)

1. **Go to Railway Dashboard:**
   - Visit [railway.app](https://railway.app)
   - Sign in with your GitHub account

2. **Create New Project:**
   - Click "New Project"
   - Choose "Deploy from GitHub repo"
   - Select your repository

3. **Configure Your Service:**
   - Railway will automatically detect it's a Node.js project
   - Set the **Root Directory** if needed (usually `/`)
   - Set the **Build Command:** `npm run build`
   - Set the **Start Command:** `npm start`

4. **Add Database:**
   - Click "New" → "Database" → "MySQL"
   - Railway will create a MySQL database
   - Note the connection details

5. **Set Environment Variables:**
   - Go to your service → Variables tab
   - Add the following variables:

```env
# Database Configuration (Railway will provide these)
DB_HOST=${{MySQL.HOST}}
DB_PORT=${{MySQL.PORT}}
DB_NAME=${{MySQL.DATABASE}}
DB_USER=${{MySQL.USERNAME}}
DB_PASSWORD=${{MySQL.PASSWORD}}

# JWT Configuration
JWT_ACCESS_SECRET=your_super_secret_access_key_here_change_this_in_production
JWT_REFRESH_SECRET=your_super_secret_refresh_key_here_change_this_in_production
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Admin Registration Security
ADMIN_REGISTRATION_SECRET=your_super_secure_admin_secret_key_change_this_in_production

# App Version Control
MIN_APP_VERSION=1.0.0

# CORS Configuration
ALLOWED_ORIGINS=https://your-frontend-domain.com,https://your-mobile-app.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Node Environment
NODE_ENV=production
PORT=3000
```

6. **Deploy:**
   - Railway will automatically deploy when you push to your main branch
   - Or click "Deploy" to trigger a manual deployment

### Method 2: Deploy via Railway CLI

1. **Install Railway CLI:**
```bash
npm install -g @railway/cli
```

2. **Login to Railway:**
```bash
railway login
```

3. **Initialize Railway:**
```bash
railway init
```

4. **Link to your project:**
```bash
railway link
```

5. **Deploy:**
```bash
railway up
```

---

## Step 3: Initialize Your Database

After deployment, initialize your RBAC system:

1. **Get your Railway URL:**
   - Go to your service → Settings → Domains
   - Copy the generated URL

2. **Initialize RBAC:**
```bash
# Replace with your actual Railway URL
curl -X POST https://your-app.railway.app/api/init-rbac \
  -H "Content-Type: application/json"
```

**Alternative: Run locally and sync data:**
```bash
# Set your Railway database URL locally
export DATABASE_URL="mysql://user:password@host:port/database"

# Run RBAC initialization locally
npm run init-rbac
```

---

## Step 4: Test Your Deployment

1. **Check the health endpoint:**
```bash
curl -X GET https://your-app.railway.app/api/auth/system-status \
  -H "Content-Type: application/json"
```

2. **Test user registration:**
```bash
curl -X POST https://your-app.railway.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@company.com",
    "password": "SecurePassword123",
    "roleName": "admin"
  }'
```

3. **Test user login:**
```bash
curl -X POST https://your-app.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@company.com",
    "password": "SecurePassword123"
  }'
```

---

## Step 5: Configure Custom Domain (Optional)

1. **Go to Domains:**
   - In your Railway service, go to Settings → Domains
   - Click "Generate Domain" or "Custom Domain"

2. **Add Custom Domain:**
   - Click "Custom Domain"
   - Enter your domain name
   - Configure DNS records as instructed

3. **SSL Certificate:**
   - Railway automatically provides SSL certificates
   - Your API will be available at `https://your-domain.com/api/*`

---

## Step 6: Update Your Frontend Configuration

Update your frontend application to use the new API URL:

```javascript
// Replace with your actual Railway URL
const API_BASE_URL = 'https://your-app.railway.app/api';

// Example API call
fetch(`${API_BASE_URL}/auth/login`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'source': 'mobile',
    'app-version': '1.0.0'
  },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'Password123'
  })
});
```

---

## Step 7: Monitor and Scale

### Railway Dashboard Features:
1. **Logs** - Real-time application logs
2. **Metrics** - CPU, memory, and network usage
3. **Deployments** - Deployment history and rollbacks
4. **Variables** - Environment variable management
5. **Domains** - Custom domain management

### Scaling Options:
- **Auto-scaling** - Railway can automatically scale based on traffic
- **Manual scaling** - Adjust CPU and memory allocation
- **Multiple instances** - Run multiple instances for high availability

---

## Troubleshooting

### Common Issues:

1. **Build Failures:**
   - Check the build logs in Railway dashboard
   - Ensure all dependencies are in `package.json`
   - Verify TypeScript compilation

2. **Database Connection Issues:**
   - Verify environment variables are set correctly
   - Check if the database service is running
   - Ensure the database is accessible from your app

3. **Port Issues:**
   - Railway automatically sets the `PORT` environment variable
   - Your app should use `process.env.PORT || 3000`

4. **Memory Issues:**
   - Increase memory allocation in Railway dashboard
   - Optimize your application code

### Debug Commands:

```bash
# View logs
railway logs

# Check status
railway status

# Connect to your service
railway connect

# View variables
railway variables
```

---

## Performance Optimization

### Railway Advantages:
- **No cold starts** - Your app runs continuously
- **Better performance** - Dedicated resources
- **Auto-scaling** - Handles traffic spikes automatically
- **Built-in monitoring** - Real-time metrics

### Optimization Tips:
1. **Use connection pooling** for database connections
2. **Implement caching** for frequently accessed data
3. **Optimize database queries**
4. **Use compression** for API responses

---

## Cost Considerations

### Railway Pricing:
- **Free Tier:** $5 credit monthly
- **Pay-as-you-go:** $0.000463 per GB-hour
- **Database:** $0.000463 per GB-hour
- **Bandwidth:** $0.10 per GB

### Cost Optimization:
1. **Use the free tier** for development and testing
2. **Monitor usage** in Railway dashboard
3. **Optimize resource allocation**
4. **Use auto-scaling** to save costs

---

## Security Best Practices

1. **Environment Variables:**
   - Never commit secrets to Git
   - Use Railway's variable management
   - Rotate secrets regularly

2. **Database Security:**
   - Railway provides secure database connections
   - Use SSL connections
   - Regular backups (automatic with Railway)

3. **API Security:**
   - Implement rate limiting
   - Validate all inputs
   - Use HTTPS only (automatic with Railway)

---

## Alternative Railway Features

### Railway Plugins:
- **Redis** - For caching
- **PostgreSQL** - Alternative database
- **MongoDB** - NoSQL database
- **Cron** - Scheduled tasks

### Railway Integrations:
- **GitHub** - Automatic deployments
- **Slack** - Deployment notifications
- **Discord** - Team notifications
- **Email** - Alert notifications

---

## Migration from Other Platforms

### From Netlify:
1. Export your environment variables
2. Update your deployment configuration
3. Migrate your database
4. Update your frontend API URLs

### From Heroku:
1. Railway supports most Heroku configurations
2. Update your `Procfile` to use `npm start`
3. Migrate your database
4. Update environment variables

---

## Final Notes

1. **Railway is production-ready** - Used by many companies
2. **Automatic deployments** - Push to main branch to deploy
3. **Built-in monitoring** - Real-time logs and metrics
4. **Excellent support** - Documentation and community

Your OZi Backend API should now be successfully deployed on Railway! 🚀

**Railway is the recommended choice for Node.js backend APIs.**
