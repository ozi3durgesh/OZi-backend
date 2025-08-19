#!/bin/bash

# Render Deployment Script for OZi Backend
# This script helps deploy the application to Render with proper database handling

echo "🚀 Starting Render deployment for OZi Backend..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

# Build the project
echo "📦 Building the project..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed. Please fix the build errors before deploying."
    exit 1
fi

echo "✅ Build completed successfully!"

# Check if we have the necessary environment variables
echo "🔍 Checking environment configuration..."

if [ -z "$DATABASE_URL" ] && [ -z "$DB_HOST" ]; then
    echo "⚠️  Warning: No database configuration found in environment variables."
    echo "   Make sure to set DATABASE_URL or individual DB_* variables in Render dashboard."
fi

echo ""
echo "📋 Deployment Summary:"
echo "   - Project built successfully"
echo "   - Database will be automatically configured on first run"
echo "   - Foreign key constraints will be cleaned up automatically"
echo ""
echo "🚀 Ready to deploy to Render!"
echo ""
echo "Next steps:"
echo "1. Push your code to GitHub"
echo "2. Deploy from Render dashboard or use Render CLI"
echo "3. Set environment variables in Render dashboard:"
echo "   - DATABASE_URL (or individual DB_* variables)"
echo "   - FORCE_DB_RESET=true (optional, for fresh database)"
echo "   - JWT_SECRET"
echo "   - Other required environment variables"
echo ""
echo "💡 Tip: If you encounter database constraint errors, set FORCE_DB_RESET=true"
echo "   in your Render environment variables to start with a fresh database."
