# API Testing Guide

## Test Your APIs

After deploying, test these endpoints:

### 1. Health Check
```bash
curl https://your-app.vercel.app/health
```
Expected: `{"status":"ok","timestamp":"...","uptime":...}`

### 2. Get Categories
```bash
curl https://your-app.vercel.app/api/categories
```
Expected: `[]` (empty array) or array of categories

### 3. Get Tasks
```bash
curl https://your-app.vercel.app/api/tasks
```
Expected: `[]` (empty array) or array of tasks

### 4. Get Notes
```bash
curl https://your-app.vercel.app/api/notes
```
Expected: `[]` (empty array) or array of notes

### 5. Create a Category
```bash
curl -X POST https://your-app.vercel.app/api/categories \
  -H "Content-Type: application/json" \
  -d '{"name":"Work"}'
```

## Common Issues

### CORS Errors
- Fixed: Added CORS headers to API handler
- If still seeing CORS errors, check browser console

### Database Connection Errors
- Check Vercel function logs
- Verify `DATABASE_URL` is set correctly
- Ensure database tables exist

### 500 Internal Server Error
- Check Vercel function logs: Dashboard → Functions → api → Logs
- Look for error messages
- Common causes:
  - Database connection failed
  - Missing environment variables
  - Database tables don't exist

## Check Vercel Logs

1. Go to Vercel Dashboard → Your Project
2. Click **Functions** tab
3. Click on **api** function
4. View **Logs** to see errors

## Browser Console Errors

Common errors you might see:
- `Failed to fetch` - Network/CORS issue
- `500: Internal Server Error` - Backend error (check Vercel logs)
- `404: Not Found` - Route doesn't exist
- `CORS policy` - CORS issue (should be fixed now)

