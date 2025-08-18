#!/bin/bash

echo "🚀 OZi Backend - Netlify Deployment Script"
echo "=========================================="

# Check if Netlify CLI is installed
if ! command -v netlify &> /dev/null; then
    echo "❌ Netlify CLI is not installed. Installing..."
    npm install -g netlify-cli
fi

# Build the project
echo "📦 Building project..."
npm run build:netlify

# Check if build was successful
if [ $? -ne 0 ]; then
    echo "❌ Build failed. Please check the errors above."
    exit 1
fi

echo "✅ Build completed successfully!"

# Check if user is logged in to Netlify
if ! netlify status &> /dev/null; then
    echo "🔐 Please login to Netlify..."
    netlify login
fi

# Deploy to Netlify
echo "🚀 Deploying to Netlify..."
netlify deploy --prod

echo "✅ Deployment completed!"
echo ""
echo "📋 Next steps:"
echo "1. Set up your database (PlanetScale, Railway, etc.)"
echo "2. Configure environment variables in Netlify dashboard"
echo "3. Initialize RBAC system"
echo "4. Test your API endpoints"
echo ""
echo "📖 For detailed instructions, see: NETLIFY-DEPLOYMENT-GUIDE.md"
