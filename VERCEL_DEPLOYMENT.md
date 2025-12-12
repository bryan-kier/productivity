# Step-by-Step Vercel Deployment Guide

Follow these steps to deploy your Task-Flow application to Vercel.

## Prerequisites

- ✅ Your code is in a Git repository (GitHub, GitLab, or Bitbucket)
- ✅ You have a Vercel account (create one at [vercel.com](https://vercel.com) if you don't)
- ✅ Your Supabase database is set up and working locally

---

## Step 1: Prepare Your Repository

Make sure your code is committed and pushed to your Git repository:

```bash
# Check git status
git status

# If you have uncommitted changes, commit them
git add .
git commit -m "Prepare for Vercel deployment"

# Push to your remote repository
git push origin main
```

---

## Step 2: Sign Up / Log In to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click **"Sign Up"** (or **"Log In"** if you already have an account)
3. Choose to sign up with:
   - GitHub (recommended - easiest integration)
   - GitLab
   - Bitbucket
   - Email

---

## Step 3: Import Your Project

### Option A: Via Vercel Dashboard (Recommended)

1. Once logged in, click **"Add New..."** → **"Project"**
2. If you connected via GitHub/GitLab/Bitbucket, you'll see your repositories
3. Find your **Task-Flow** repository and click **"Import"**
4. Vercel will automatically detect your project settings

### Option B: Via Vercel CLI

1. Install Vercel CLI globally:
   ```bash
   npm install -g vercel
   ```

2. In your project directory, run:
   ```bash
   vercel
   ```

3. Follow the prompts:
   - **Set up and deploy?** → Yes
   - **Which scope?** → Select your account
   - **Link to existing project?** → No
   - **What's your project's name?** → `task-flow` (or your preferred name)
   - **In which directory is your code located?** → `./` (current directory)
   - **Want to override settings?** → No

---

## Step 4: Configure Project Settings

Vercel should auto-detect your settings from `vercel.json`, but verify:

1. Go to your project settings: **Settings** → **General**
2. Verify these settings:
   - **Framework Preset**: None (or auto-detected)
   - **Root Directory**: `./` (root)
   - **Build Command**: `npm run vercel-build`
   - **Output Directory**: `dist/public`
   - **Install Command**: `npm install`

These should match your `vercel.json` file.

---

## Step 5: Add Environment Variables

**This is crucial for your database connection!**

1. In your Vercel project, go to **Settings** → **Environment Variables**
2. Click **"Add New"**
3. Add your Supabase connection string:
   - **Key**: `DATABASE_URL`
   - **Value**: Your Supabase connection string:
     ```
     postgresql://postgres.uymjfupiwzljthqnozvb:ciILTQzAQ6QrULkG@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true
     ```
   - **Environment**: Select all three:
     - ☑️ Production
     - ☑️ Preview
     - ☑️ Development
4. Click **"Save"**

> **Note**: If you want to add an optional `CRON_SECRET` for protecting cron endpoints, you can add it here with a secure random string.

---

## Step 6: Deploy

### If using Dashboard:
- After adding environment variables, Vercel will automatically trigger a new deployment
- Go to the **Deployments** tab to watch the build progress

### If using CLI:
```bash
vercel --prod
```

This will deploy to production. You can also use `vercel` (without `--prod`) for a preview deployment.

---

## Step 7: Verify Deployment

### 7.1 Check Build Status

1. Go to **Deployments** tab in Vercel
2. Find your latest deployment
3. Wait for it to show **✅ Ready** (green checkmark)
4. If it fails, click on it to see build logs

### 7.2 Test Health Endpoint

1. Click on your deployment to get the URL (e.g., `https://task-flow.vercel.app`)
2. Test the health check:
   ```
   https://your-app-name.vercel.app/health
   ```
   Should return:
   ```json
   {
     "status": "ok",
     "timestamp": "...",
     "uptime": ...,
     "database": {
       "connected": true,
       "status": "healthy"
     }
   }
   ```

### 7.3 Test API Endpoints

1. Test categories endpoint:
   ```
   https://your-app-name.vercel.app/api/categories
   ```
   Should return: `[]` (empty array - that's correct if you have no categories yet)

2. Test tasks endpoint:
   ```
   https://your-app-name.vercel.app/api/tasks
   ```
   Should return: `[]`

### 7.4 Test Frontend

1. Visit your main URL:
   ```
   https://your-app-name.vercel.app
   ```
   - Should load your React application (not download a file)
   - Should show your Task-Flow interface

---

## Step 8: Set Up Custom Domain (Optional)

1. Go to **Settings** → **Domains**
2. Add your custom domain (e.g., `taskflow.com`)
3. Follow Vercel's instructions to update your DNS records
4. Wait for DNS propagation (can take a few minutes to 48 hours)

---

## Troubleshooting

### ❌ Build Fails

**Check build logs:**
1. Go to **Deployments** → Click on failed deployment → **Build Logs**
2. Look for error messages
3. Common issues:
   - Missing dependencies: Ensure all packages are in `package.json`
   - TypeScript errors: Run `npm run check` locally first
   - Build command errors: Test locally with `npm run build:client`

**Fix:**
- Fix errors locally
- Commit and push changes
- Vercel will automatically redeploy

---

### ❌ Site Downloads a File Instead of Loading

**This means static files aren't being served correctly.**

**Check:**
1. Build logs - did build complete successfully?
2. Verify `dist/public` directory exists after build
3. Check `vercel.json` - `outputDirectory` should be `dist/public`

**Fix:**
1. Test build locally: `npm run build:client`
2. Verify `dist/public/index.html` exists
3. Commit and push, then redeploy

---

### ❌ Database Connection Errors

**Check:**
1. Environment variables - is `DATABASE_URL` set correctly?
2. Did you select all environments (Production, Preview, Development)?
3. Is your Supabase database active?

**Fix:**
1. Go to **Settings** → **Environment Variables**
2. Verify `DATABASE_URL` is correct
3. Ensure it's added to Production environment
4. Redeploy after changing environment variables

**Check Function Logs:**
1. Go to **Functions** tab in Vercel
2. Click on a function (e.g., `/api/categories`)
3. Check **Logs** for database errors

---

### ❌ API Returns 500 Errors

**Check:**
1. Go to **Functions** tab
2. Click on the failing function
3. Check **Logs** for error details

**Common causes:**
- Missing `DATABASE_URL` environment variable
- Database connection timeout
- Missing database tables (run `npm run db:push` if needed)

---

### ❌ Cron Jobs Not Running

**Verify:**
1. Check `vercel.json` has cron configuration
2. Cron jobs require a paid Vercel plan (Hobby or higher)
3. On free plan, cron jobs won't run automatically

**Alternative:**
- Use external cron service (e.g., cron-job.org) to call your cron endpoints
- Or upgrade to Vercel Pro plan

---

## Continuous Deployment

Once connected, Vercel will automatically deploy whenever you push to your main branch:

1. Make changes locally
2. Commit: `git commit -m "Your changes"`
3. Push: `git push origin main`
4. Vercel automatically builds and deploys
5. Get notified when deployment is ready

---

## Useful Vercel Commands (CLI)

```bash
# Deploy to preview
vercel

# Deploy to production
vercel --prod

# View deployments
vercel ls

# View project info
vercel inspect

# View logs
vercel logs

# Remove deployment
vercel remove
```

---

## Next Steps

✅ Your app is now deployed and accessible worldwide!

**What to do next:**
1. Share your app URL with others
2. Monitor usage in Vercel dashboard
3. Set up custom domain (optional)
4. Configure analytics (optional)
5. Set up preview deployments for pull requests (automatic if connected via Git)

---

## Quick Reference

- **Dashboard**: [vercel.com/dashboard](https://vercel.com/dashboard)
- **Project Settings**: Settings → General
- **Environment Variables**: Settings → Environment Variables
- **Deployments**: Deployments tab
- **Functions/Logs**: Functions tab
- **Domains**: Settings → Domains







