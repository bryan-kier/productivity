#!/bin/bash

# API Testing Script
# Replace YOUR_APP_URL with your actual Vercel URL

APP_URL="${1:-https://productivity-9n98r59sl-bkleotech-gmailcoms-projects.vercel.app}"

echo "Testing APIs for: $APP_URL"
echo "================================"
echo ""

# Test Health Endpoint
echo "1. Testing Health Endpoint..."
curl -s "$APP_URL/health" | jq '.' || curl -s "$APP_URL/health"
echo ""
echo ""

# Test Categories
echo "2. Testing GET /api/categories..."
curl -s "$APP_URL/api/categories" | jq '.' || curl -s "$APP_URL/api/categories"
echo ""
echo ""

# Test Tasks
echo "3. Testing GET /api/tasks..."
curl -s "$APP_URL/api/tasks" | jq '.' || curl -s "$APP_URL/api/tasks"
echo ""
echo ""

# Test Notes
echo "4. Testing GET /api/notes..."
curl -s "$APP_URL/api/notes" | jq '.' || curl -s "$APP_URL/api/notes"
echo ""
echo ""

# Test Create Category
echo "5. Testing POST /api/categories..."
curl -s -X POST "$APP_URL/api/categories" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Category"}' | jq '.' || curl -s -X POST "$APP_URL/api/categories" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Category"}'
echo ""
echo ""

echo "================================"
echo "Tests complete!"
echo ""
echo "If you see errors, check:"
echo "1. Vercel function logs"
echo "2. DATABASE_URL is set correctly"
echo "3. Database tables exist"

