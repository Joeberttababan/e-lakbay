#!/bin/bash
# Quick Setup Script for E-Lakbay Real-Time Analytics
# Run this script to get analytics running quickly

set -e

echo "🚀 E-Lakbay Real-Time Analytics Setup"
echo "======================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Check Supabase CLI
echo "${YELLOW}Step 1: Checking Supabase CLI...${NC}"
if ! command -v supabase &> /dev/null; then
    echo "${RED}❌ Supabase CLI not found. Install it from https://github.com/supabase/cli${NC}"
    exit 1
fi
echo "${GREEN}✓ Supabase CLI found${NC}"
echo ""

# Step 2: Run database migrations
echo "${YELLOW}Step 2: Running database migrations...${NC}"
echo "Read migrations from: src/DB_TableReference/analytics_migrations.sql"
echo ""
echo "To execute migrations in Supabase Dashboard:"
echo "  1. Go to Supabase Dashboard > SQL Editor"
echo "  2. Create new query"
echo "  3. Copy and paste content from: src/DB_TableReference/analytics_migrations.sql"
echo "  4. Run the query"
echo ""
read -p "✓ Have you run the migrations? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "${RED}❌ Please run migrations first${NC}"
    exit 1
fi
echo "${GREEN}✓ Migrations completed${NC}"
echo ""

# Step 3: Deploy edge function
echo "${YELLOW}Step 3: Deploying edge function...${NC}"
echo "Command: supabase functions deploy capture-analytics"
echo ""
read -p "Run this command now? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    supabase functions deploy capture-analytics
    echo "${GREEN}✓ Edge function deployed${NC}"
else
    echo "${YELLOW}⚠ Skipped edge function deployment${NC}"
fi
echo ""

# Step 4: Environment setup
echo "${YELLOW}Step 4: Environment setup${NC}"
echo ""
echo "Environment variables needed:"
echo "  - SUPABASE_PROJECT_ID"
echo "  - SUPABASE_API_KEY"
echo "  - SUPABASE_SERVICE_ROLE_KEY"
echo ""
echo "Copy from: .env.analytics.example"
echo "Update .env.local with your actual values"
echo ""

# Step 5: Vite configuration
echo "${YELLOW}Step 5: Vite proxy configuration${NC}"
echo ""
echo "Add this to your vite.config.js:"
echo "  - Copy proxy config from: vite.config.analytics.example.js"
echo "  - Paste into your vite.config.js server section"
echo ""

# Step 6: Add useAnalytics hook
echo "${YELLOW}Step 6: Add useAnalytics to App.tsx${NC}"
echo ""
echo "In your App.tsx or root component, add:"
echo ""
echo "  import { useAnalytics } from './lib/useAnalytics';"
echo ""
echo "  function App() {"
echo "    const user = useYourAuthHook();"
echo "    useAnalytics({ uid: user?.id });"
echo "    return (/* your app */);"
echo "  }"
echo ""

# Step 7: Test
echo "${YELLOW}Step 7: Test the setup${NC}"
echo ""
echo "Testing checklist:"
echo "  1. Start dev server: npm run dev"
echo "  2. Visit http://localhost:5173"
echo "  3. Open DevTools > Network tab"
echo "  4. Look for POST /api/analytics requests"
echo "  5. Check response status (should be 200)"
echo "  6. Navigate pages - should see new requests"
echo "  7. Check Supabase tables for new data"
echo ""

echo "${GREEN}✓ Setup instructions complete!${NC}"
echo ""
echo "📚 Documentation:"
echo "  - ANALYTICS_README.md - Overview of the system"
echo "  - ANALYTICS_SETUP_GUIDE.md - Detailed setup guide"
echo "  - ANALYTICS_INTEGRATION_GUIDE.md - Code integration"
echo "  - ANALYTICS_CHECKLIST.md - Quick reference"
echo ""
echo "Next: Follow the documentation to complete setup"
