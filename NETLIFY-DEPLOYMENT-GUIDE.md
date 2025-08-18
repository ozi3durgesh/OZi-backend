# Deploying OZi Backend to Netlify - Complete Guide

## ⚠️ Important Note
**Netlify is primarily for static sites and frontend applications.** For a Node.js backend API, consider these alternatives:
- **Railway** (Recommended for Node.js APIs)
- **Render**
- **Heroku**
- **DigitalOcean App Platform**
- **Vercel** (with serverless functions)

However, this guide shows how to deploy using **Netlify Functions** if you specifically want to use Netlify.

---

## Prerequisites

1. **GitHub Account** - Your code must be in a GitHub repository
2. **Netlify Account** - Sign up at [netlify.com](https://netlify.com)
3. **Database** - You'll need a cloud database (PlanetScale, Railway, etc.)

---

## Step 1: Prepare Your Database

### Option A: Use PlanetScale (Recommended)
1. Go to [planetscale.com](https://planetscale.com)
2. Create a free account
3. Create a new database
4. Get your connection string

### Option B: Use Railway Database
1. Go to [railway.app](https://railway.app)
2. Create a new project
3. Add a MySQL database
4. Get your connection string

### Option C: Use Any Cloud MySQL Provider
- AWS RDS
- Google Cloud SQL
- DigitalOcean Managed Databases
- etc.

---

## Step 2: Set Up Your GitHub Repository

1. **Push your code to GitHub:**
```bash
git add .
git commit -m "Prepare for Netlify deployment"
git push origin main
```

2. **Ensure your repository structure looks like this:**
```
OZi-backend-3/
├── src/
├── netlify/
│   └── functions/
│       └── api.js
├── public/
│   └── index.html
├── netlify.toml
├── package.json
└── .env (local only)
```

---

## Step 3: Deploy to Netlify

### Method 1: Deploy via Netlify Dashboard (Recommended)

1. **Go to Netlify Dashboard:**
   - Visit [app.netlify.com](https://app.netlify.com)
   - Sign in with your GitHub account

2. **Create New Site:**
   - Click "New site from Git"
   - Choose "GitHub"
   - Select your repository

3. **Configure Build Settings:**
   - **Build command:** `npm run build:netlify`
   - **Publish directory:** `public`
   - **Functions directory:** `netlify/functions`

4. **Set Environment Variables:**
   - Go to Site settings → Environment variables
   - Add the following variables:

```env
# Database Configuration
DB_HOST=your-database-host
DB_PORT=3306
DB_NAME=your-database-name
DB_USER=your-database-user
DB_PASSWORD=your-database-password

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
```

5. **Deploy:**
   - Click "Deploy site"
   - Wait for the build to complete

### Method 2: Deploy via Netlify CLI

1. **Install Netlify CLI:**
```bash
npm install -g netlify-cli
```

2. **Login to Netlify:**
```bash
netlify login
```

3. **Initialize Netlify:**
```bash
netlify init
```

4. **Set Environment Variables:**
```bash
netlify env:set DB_HOST your-database-host
netlify env:set DB_NAME your-database-name
netlify env:set DB_USER your-database-user
netlify env:set DB_PASSWORD your-database-password
netlify env:set JWT_ACCESS_SECRET your_super_secret_access_key_here_change_this_in_production
netlify env:set JWT_REFRESH_SECRET your_super_secret_refresh_key_here_change_this_in_production
netlify env:set ADMIN_REGISTRATION_SECRET your_super_secure_admin_secret_key_change_this_in_production
netlify env:set ALLOWED_ORIGINS https://your-frontend-domain.com,https://your-mobile-app.com
```

5. **Deploy:**
```bash
netlify deploy --prod
```

---

## Step 4: Initialize Your Database

After deployment, you need to initialize your RBAC system:

1. **Get your Netlify function URL:**
   - Go to your Netlify dashboard
   - Navigate to Functions tab
   - Copy the function URL

2. **Initialize RBAC (One-time setup):**
```bash
# Replace with your actual Netlify function URL
curl -X POST https://your-site.netlify.app/.netlify/functions/api/init-rbac \
  -H "Content-Type: application/json"
```

**Note:** You may need to create a custom endpoint for RBAC initialization or run it locally and sync the data.

---

## Step 5: Test Your Deployment

1. **Check the landing page:**
   - Visit your Netlify site URL
   - You should see the API documentation page

2. **Test the system status endpoint:**
```bash
curl -X GET https://your-site.netlify.app/api/auth/system-status \
  -H "Content-Type: application/json"
```

3. **Test user registration:**
```bash
curl -X POST https://your-site.netlify.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@company.com",
    "password": "SecurePassword123",
    "roleName": "admin"
  }'
```

---

## Step 6: Configure Custom Domain (Optional)

1. **Go to Domain settings:**
   - In your Netlify dashboard, go to Domain settings
   - Click "Add custom domain"

2. **Configure DNS:**
   - Add a CNAME record pointing to your Netlify site
   - Or use Netlify's DNS if you transfer your domain

3. **Enable HTTPS:**
   - Netlify automatically provides SSL certificates
   - Your API will be available at `https://your-domain.com/api/*`

---

## Step 7: Update Your Frontend Configuration

Update your frontend application to use the new API URL:

```javascript
// Replace with your actual Netlify URL
const API_BASE_URL = 'https://your-site.netlify.app/api';

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

## Troubleshooting

### Common Issues:

1. **Build Failures:**
   - Check the build logs in Netlify dashboard
   - Ensure all dependencies are in `package.json`
   - Verify TypeScript compilation

2. **Database Connection Issues:**
   - Verify your database connection string
   - Check if your database allows external connections
   - Ensure environment variables are set correctly

3. **Function Timeouts:**
   - Netlify Functions have a 10-second timeout limit
   - Optimize your database queries
   - Consider using connection pooling

4. **CORS Issues:**
   - Update `ALLOWED_ORIGINS` environment variable
   - Include your frontend domain

### Debug Commands:

```bash
# Check function logs
netlify functions:list
netlify functions:invoke api

# View deployment logs
netlify deploy:list
```

---

## Performance Considerations

### Netlify Function Limitations:
- **Timeout:** 10 seconds (free tier)
- **Memory:** 1024 MB (free tier)
- **Concurrent executions:** 125 (free tier)

### Optimization Tips:
1. **Use connection pooling** for database connections
2. **Implement caching** for frequently accessed data
3. **Optimize database queries**
4. **Use CDN** for static assets

---

## Alternative Deployment Options

### Railway (Recommended for Node.js APIs)
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

### Render
1. Connect your GitHub repository
2. Choose "Web Service"
3. Set build command: `npm install && npm run build`
4. Set start command: `npm start`

### Heroku
```bash
# Install Heroku CLI
heroku create your-app-name
git push heroku main
```

---

## Monitoring and Maintenance

1. **Monitor Function Usage:**
   - Check Netlify dashboard for function invocations
   - Monitor error rates and response times

2. **Database Monitoring:**
   - Use your database provider's monitoring tools
   - Set up alerts for connection issues

3. **Logs:**
   - View function logs in Netlify dashboard
   - Set up external logging if needed

---

## Security Best Practices

1. **Environment Variables:**
   - Never commit secrets to Git
   - Use strong, unique secrets
   - Rotate secrets regularly

2. **Database Security:**
   - Use SSL connections
   - Restrict database access
   - Regular backups

3. **API Security:**
   - Implement rate limiting
   - Validate all inputs
   - Use HTTPS only

---

## Cost Considerations

### Netlify Free Tier Limits:
- **Function invocations:** 125,000 per month
- **Function execution time:** 10 seconds
- **Bandwidth:** 100 GB per month

### Paid Plans:
- **Pro:** $19/month - 1,000,000 function invocations
- **Business:** $99/month - 2,000,000 function invocations

---

## Final Notes

1. **Netlify Functions are serverless** - they spin up on demand
2. **Cold starts** may cause initial delays
3. **Database connections** should be optimized for serverless
4. **Consider the alternatives** for better Node.js API support

Your OZi Backend API should now be successfully deployed on Netlify! 🚀
