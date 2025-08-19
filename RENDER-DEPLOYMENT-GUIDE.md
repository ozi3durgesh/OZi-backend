# Render Deployment Guide for OZi Backend

## Overview
This guide will help you deploy the OZi Backend to Render, addressing the common foreign key constraint conflicts that can occur during deployment.

## Prerequisites
- GitHub repository with your OZi Backend code
- Render account
- MySQL database (AWS RDS, PlanetScale, or Render's MySQL service)

## Deployment Steps

### 1. Prepare Your Code
Make sure your code is committed and pushed to GitHub:
```bash
git add .
git commit -m "Prepare for Render deployment"
git push origin main
```

### 2. Create a New Web Service on Render
1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click "New +" and select "Web Service"
3. Connect your GitHub repository
4. Select the `ozi-backend-oms` repository

### 3. Configure the Web Service

#### Basic Settings:
- **Name**: `ozi-backend` (or your preferred name)
- **Environment**: `Node`
- **Region**: Choose closest to your users
- **Branch**: `main`
- **Build Command**: `npm install && npm run build`
- **Start Command**: `node dist/server.js`

#### Environment Variables:
Set these in the Render dashboard:

**Required:**
```
DATABASE_URL=mysql://username:password@host:port/database_name
JWT_SECRET=your_jwt_secret_here
NODE_ENV=production
```

**Optional (if not using DATABASE_URL):**
```
DB_HOST=your_db_host
DB_NAME=your_db_name
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_PORT=3306
```

**For Database Issues:**
```
FORCE_DB_RESET=true
```
⚠️ **Warning**: This will drop all existing tables and recreate them. Only use this if you're okay with losing data.

### 4. Advanced Configuration

#### Auto-Deploy Settings:
- **Auto-Deploy**: Enable if you want automatic deployments on push
- **Health Check Path**: `/health` (if you have a health check endpoint)

#### Resource Allocation:
- **Instance Type**: Start with "Free" for testing, upgrade to "Starter" or higher for production
- **Memory**: Minimum 512MB recommended

### 5. Deploy

Click "Create Web Service" and wait for the deployment to complete.

## Troubleshooting Common Issues

### Foreign Key Constraint Error
If you see this error:
```
Duplicate foreign key constraint name 'Users_ibfk_1'
```

**Solution 1: Use FORCE_DB_RESET (Recommended for first deployment)**
1. Set `FORCE_DB_RESET=true` in your environment variables
2. Redeploy the service
3. After successful deployment, remove this variable

**Solution 2: Manual Database Cleanup**
If you can't use FORCE_DB_RESET, the application will automatically:
1. Detect existing tables
2. Clean up foreign key constraints
3. Sync the database schema

### Database Connection Issues
- Verify your `DATABASE_URL` format: `mysql://user:pass@host:port/db`
- Ensure your database is accessible from Render's IP addresses
- Check that your database user has proper permissions

### Build Failures
- Ensure all dependencies are in `package.json`
- Check that the build script runs successfully locally
- Verify Node.js version compatibility (the app uses Node 22)

## Post-Deployment

### 1. Verify Deployment
- Check the service logs for any errors
- Test your API endpoints
- Verify database tables were created correctly

### 2. Monitor Performance
- Use Render's built-in monitoring
- Set up logging and error tracking
- Monitor database performance

### 3. Scale if Needed
- Upgrade instance type for better performance
- Add more instances for load balancing
- Consider using Render's managed MySQL service

## Environment Variables Reference

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `DATABASE_URL` | Yes* | Full database connection string | `mysql://user:pass@host:port/db` |
| `DB_HOST` | Yes* | Database host | `your-db.amazonaws.com` |
| `DB_NAME` | Yes* | Database name | `ozi_backend` |
| `DB_USER` | Yes* | Database username | `admin` |
| `DB_PASSWORD` | Yes* | Database password | `your_password` |
| `DB_PORT` | No | Database port | `3306` |
| `JWT_SECRET` | Yes | Secret for JWT tokens | `your_secret_key` |
| `NODE_ENV` | No | Environment | `production` |
| `FORCE_DB_RESET` | No | Force database reset | `true` |

*Use either `DATABASE_URL` or the individual `DB_*` variables.

## Security Considerations

1. **Environment Variables**: Never commit sensitive information to your repository
2. **Database Access**: Use least-privilege database users
3. **HTTPS**: Render automatically provides HTTPS
4. **Secrets Management**: Consider using Render's secret management for sensitive data

## Support

If you encounter issues:
1. Check the Render service logs
2. Verify your environment variables
3. Test database connectivity locally
4. Check the [Render documentation](https://render.com/docs)
5. Review the application logs for specific error messages

## Quick Fix Commands

### Local Testing
```bash
# Test build
npm run build

# Test database connection
npm run setup-db

# Run locally
npm run dev
```

### Render Deployment
```bash
# Use the deployment script
./deploy-render.sh

# Or deploy manually
git push origin main
```

Remember: The first deployment might take longer as it sets up the database schema. Subsequent deployments will be faster.
