# OZi Backend Deployment Options - Complete Guide

## 🎯 Quick Decision Guide

### For Node.js Backend APIs (Recommended Order):

1. **🚀 Railway** - Best overall for Node.js APIs
   - Native Node.js support
   - Built-in database hosting
   - Automatic deployments
   - $5 free credit monthly

2. **🌐 Render** - Great alternative
   - Free tier available
   - Easy setup
   - Good performance

3. **⚡ Vercel** - Good for serverless
   - Excellent for frontend + API
   - Serverless functions
   - Great developer experience

4. **🔧 Heroku** - Traditional choice
   - Well-established
   - Good documentation
   - Paid plans only

5. **📦 Netlify** - Limited for Node.js
   - Serverless functions only
   - 10-second timeout limit
   - Better for static sites

---

## 📋 Deployment Checklist

### Before Deploying:
- [ ] Code is in a GitHub repository
- [ ] All dependencies are in `package.json`
- [ ] Environment variables are documented
- [ ] Database is set up (cloud provider)
- [ ] Build scripts are working locally

### After Deploying:
- [ ] Environment variables are configured
- [ ] Database is connected and working
- [ ] RBAC system is initialized
- [ ] API endpoints are tested
- [ ] Frontend is updated with new API URL
- [ ] Custom domain is configured (optional)
- [ ] SSL certificate is working
- [ ] Monitoring is set up

---

## 🚀 Railway Deployment (Recommended)

### Why Railway?
- ✅ **Best for Node.js APIs**
- ✅ **Built-in database hosting**
- ✅ **Automatic deployments**
- ✅ **No cold starts**
- ✅ **Better performance**
- ✅ **$5 free credit monthly**

### Quick Start:
```bash
# 1. Install Railway CLI
npm install -g @railway/cli

# 2. Login and deploy
railway login
railway init
railway up
```

### Full Guide: [RAILWAY-DEPLOYMENT-GUIDE.md](./RAILWAY-DEPLOYMENT-GUIDE.md)

---

## 🌐 Render Deployment

### Why Render?
- ✅ **Free tier available**
- ✅ **Easy setup**
- ✅ **Good performance**
- ✅ **Automatic deployments**

### Quick Start:
1. Connect GitHub repository
2. Choose "Web Service"
3. Set build command: `npm install && npm run build`
4. Set start command: `npm start`
5. Add environment variables

### Environment Variables:
```env
DB_HOST=your-database-host
DB_PORT=3306
DB_NAME=your-database-name
DB_USER=your-database-user
DB_PASSWORD=your-database-password
JWT_ACCESS_SECRET=your_secret_key
JWT_REFRESH_SECRET=your_refresh_secret
ADMIN_REGISTRATION_SECRET=your_admin_secret
NODE_ENV=production
PORT=3000
```

---

## ⚡ Vercel Deployment

### Why Vercel?
- ✅ **Excellent for frontend + API**
- ✅ **Serverless functions**
- ✅ **Great developer experience**
- ✅ **Automatic deployments**

### Quick Start:
```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Deploy
vercel
```

### Configuration:
Create `vercel.json`:
```json
{
  "version": 2,
  "builds": [
    {
      "src": "dist/server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "dist/server.js"
    }
  ]
}
```

---

## 🔧 Heroku Deployment

### Why Heroku?
- ✅ **Well-established platform**
- ✅ **Good documentation**
- ✅ **Reliable service**
- ❌ **Paid plans only**

### Quick Start:
```bash
# 1. Install Heroku CLI
# 2. Create app
heroku create your-app-name

# 3. Add database
heroku addons:create jawsdb:kitefin

# 4. Deploy
git push heroku main
```

### Environment Variables:
```bash
heroku config:set DB_HOST=your-host
heroku config:set DB_NAME=your-database
heroku config:set JWT_ACCESS_SECRET=your_secret
# ... add all other variables
```

---

## 📦 Netlify Deployment

### Why Netlify?
- ✅ **Good for static sites**
- ✅ **Serverless functions**
- ❌ **Limited for Node.js APIs**
- ❌ **10-second timeout limit**

### Quick Start:
```bash
# 1. Install Netlify CLI
npm install -g netlify-cli

# 2. Deploy
./deploy-netlify.sh
```

### Full Guide: [NETLIFY-DEPLOYMENT-GUIDE.md](./NETLIFY-DEPLOYMENT-GUIDE.md)

---

## 🗄️ Database Options

### Cloud Database Providers:

1. **PlanetScale** (Recommended)
   - Free tier available
   - MySQL compatible
   - Great performance

2. **Railway Database**
   - Built into Railway platform
   - Easy setup
   - Automatic backups

3. **AWS RDS**
   - Enterprise-grade
   - Highly reliable
   - More complex setup

4. **Google Cloud SQL**
   - Good performance
   - Integration with Google services
   - Competitive pricing

5. **DigitalOcean Managed Databases**
   - Simple pricing
   - Good performance
   - Easy to use

---

## 🔐 Environment Variables

### Required Variables:
```env
# Database
DB_HOST=your-database-host
DB_PORT=3306
DB_NAME=your-database-name
DB_USER=your-database-user
DB_PASSWORD=your-database-password

# JWT
JWT_ACCESS_SECRET=your_super_secret_access_key_here_change_this_in_production
JWT_REFRESH_SECRET=your_super_secret_refresh_key_here_change_this_in_production
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Admin Security
ADMIN_REGISTRATION_SECRET=your_super_secure_admin_secret_key_change_this_in_production

# App Configuration
MIN_APP_VERSION=1.0.0
NODE_ENV=production
PORT=3000

# CORS
ALLOWED_ORIGINS=https://your-frontend-domain.com,https://your-mobile-app.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

---

## 🧪 Testing Your Deployment

### Health Check:
```bash
curl -X GET https://your-app-domain.com/api/auth/system-status \
  -H "Content-Type: application/json"
```

### User Registration:
```bash
curl -X POST https://your-app-domain.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@company.com",
    "password": "SecurePassword123",
    "roleName": "admin"
  }'
```

### User Login:
```bash
curl -X POST https://your-app-domain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@company.com",
    "password": "SecurePassword123"
  }'
```

---

## 🔄 Database Initialization

### After Deployment:
1. **Initialize RBAC system:**
```bash
# Option 1: Via API endpoint (if available)
curl -X POST https://your-app-domain.com/api/init-rbac

# Option 2: Run locally with production database
export DATABASE_URL="mysql://user:password@host:port/database"
npm run init-rbac
```

2. **Test RBAC setup:**
```bash
npm run test-rbac
```

---

## 📱 Frontend Integration

### Update API Base URL:
```javascript
// Replace with your deployed API URL
const API_BASE_URL = 'https://your-app-domain.com/api';

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

## 🔍 Monitoring and Maintenance

### What to Monitor:
1. **Application logs** - Error rates and performance
2. **Database performance** - Query times and connections
3. **API response times** - User experience
4. **Resource usage** - CPU, memory, bandwidth
5. **Error rates** - 4xx and 5xx responses

### Maintenance Tasks:
1. **Regular backups** - Database and application data
2. **Security updates** - Dependencies and platform updates
3. **Performance optimization** - Code and database queries
4. **Monitoring alerts** - Set up notifications for issues

---

## 💰 Cost Comparison

### Free Tiers:
- **Railway:** $5 credit monthly
- **Render:** Free tier available
- **Vercel:** Free tier available
- **Netlify:** Free tier available
- **Heroku:** No free tier

### Paid Plans (Approximate):
- **Railway:** Pay-as-you-go ($0.000463/GB-hour)
- **Render:** $7/month (starter)
- **Vercel:** $20/month (pro)
- **Netlify:** $19/month (pro)
- **Heroku:** $7/month (basic)

---

## 🎯 Final Recommendation

### For Production Use:
**🚀 Railway** is the best choice for OZi Backend because:
- Native Node.js support
- Built-in database hosting
- Automatic deployments
- Better performance
- Cost-effective pricing
- Excellent developer experience

### For Development/Testing:
**🌐 Render** is a good alternative with a generous free tier.

### For Learning/Prototyping:
**⚡ Vercel** or **📦 Netlify** are fine for small projects.

---

## 📚 Additional Resources

- [Railway Documentation](https://docs.railway.app/)
- [Render Documentation](https://render.com/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [Heroku Documentation](https://devcenter.heroku.com/)
- [Netlify Documentation](https://docs.netlify.com/)

---

## 🆘 Support

If you encounter issues:
1. Check the platform's documentation
2. Review the deployment logs
3. Verify environment variables
4. Test database connectivity
5. Check the troubleshooting sections in the detailed guides

**Happy Deploying! 🚀**
