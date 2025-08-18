#!/bin/bash

echo "🚀 Starting Netlify deployment process..."

# Check if Netlify CLI is installed
if ! command -v netlify &> /dev/null; then
    echo "❌ Netlify CLI is not installed. Installing now..."
    npm install -g netlify-cli
fi

# Build the project
echo "📦 Building the project..."
npm run netlify:build

if [ $? -ne 0 ]; then
    echo "❌ Build failed. Please check the errors above."
    exit 1
fi

echo "✅ Build completed successfully!"

# Deploy to Netlify
echo "🌐 Deploying to Netlify..."
netlify deploy --prod --dir=dist

if [ $? -eq 0 ]; then
    echo "🎉 Deployment completed successfully!"
    echo "🔗 Your app is now live on Netlify!"
else
    echo "❌ Deployment failed. Please check the errors above."
    exit 1
fi
