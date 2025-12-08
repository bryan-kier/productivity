# Deploy to Vercel with Supabase

## Current Status
✅ Project configured for Vercel
✅ Supabase database created
✅ Database tables created
✅ Code ready for deployment

## Deployment Steps

### Step 1: Add Environment Variable to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your **Task-Flow** project
3. Go to **Settings** → **Environment Variables**
4. Click **Add New**
5. Enter:
   - **Key**: `DATABASE_URL`
   - **Value**: `postgresql://postgres:ciILTQzAQ6QrULkG@db.ixambmcultsvvqlayura.supabase.co:5432/postgres`
   - **Environments**: Select all (Production, Preview, Development)
6. Click **Save**

### Step 2: Verify Deployment

After adding the environment variable, Vercel will automatically redeploy.

1. Go to **Deployments** tab
2. Wait for deployment to complete (green checkmark)
3. Click on the deployment to view details
4. **Check build logs** - Make sure build completed successfully

### Step 3: Test Your Deployment

1. **Health Check**: `https://your-app.vercel.app/health`
   - Should return: `{"status":"ok",...}`

2. **API Test**: `https://your-app.vercel.app/api/categories`
   - Should return: `[]` (empty array)

3. **Frontend**: `https://your-app.vercel.app`
   - Should load your React app (not download a file)

## Troubleshooting

### Issue: Site Downloads a File Instead of Loading

**This means static files aren't being served correctly. Fix:**

1. **Check Build Logs**
   - Go to Vercel Dashboard → Your Project → Deployments
   - Click on the latest deployment
   - Check if build completed successfully
   - Look for errors in the build output

2. **Verify Build Output**
   - The build should create files in `dist/public/`
   - Should include `index.html` and bundled JS/CSS files
   - Check build logs to confirm `npm run vercel-build` ran successfully

3. **Check Vercel Configuration**
   - Ensure `outputDirectory` in `vercel.json` is `dist/public`
   - Ensure `buildCommand` is `npm run vercel-build`

4. **Redeploy**
   - After fixing, commit and push changes
   - Or manually trigger redeploy in Vercel dashboard

**Common Causes:**
- Build didn't complete (check logs)
- `dist/public` directory doesn't exist or is empty
- Vite build failed silently
- Missing dependencies in `package.json`

**API returns errors?**
- Check Vercel function logs: Dashboard → Functions
- Verify `DATABASE_URL` is set correctly
- Ensure database tables exist (they should, you created them)

**Build fails?**
- Check build logs in Vercel dashboard
- Ensure all dependencies are in `package.json`
- Try building locally: `npm run build:client` to test

**Database connection errors?**
- Verify `DATABASE_URL` connection string is correct
- Check Supabase dashboard to ensure database is active

