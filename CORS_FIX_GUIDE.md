# CORS Error Fix Guide

## Problem Identified

Your frontend is getting CORS errors when trying to connect to the backend. This is because:

1. ✅ **FIXED:** `VITE_API_URL` was missing `/api` at the end
2. ⚠️ **NEEDS VERIFICATION:** Environment variables in Vercel might not be updated

## Quick Fix Steps

### Step 1: Update Vercel Environment Variable

1. Go to https://vercel.com/dashboard
2. Click on your project (`full-ecom-web-frontend`)
3. Go to **Settings** → **Environment Variables**
4. Find `VITE_API_URL` and update it to:
   ```
   https://full-ecom-web-156s.onrender.com/api
   ```
   (Note the `/api` at the end!)
5. Click **Save**

### Step 2: Redeploy Frontend

After updating the environment variable:

**Option A: Trigger Redeploy from Vercel**
1. Go to **Deployments** tab
2. Click the three dots (...) on the latest deployment
3. Click **Redeploy**

**Option B: Push a Small Change**
```bash
git commit --allow-empty -m "Trigger redeploy with updated env vars"
git push origin main
```

### Step 3: Verify Backend is Running

Check if your backend is accessible:

```bash
# Test health endpoint
curl https://full-ecom-web-156s.onrender.com/health

# Test products endpoint
curl https://full-ecom-web-156s.onrender.com/api/products
```

**Expected Response:**
- Health: `{"status":"healthy","database":"connected"}`
- Products: JSON array of products

### Step 4: Check Backend CORS Configuration

Your backend currently allows these origins:
- `http://localhost:3000`
- `http://localhost:3001`
- `https://full-ecom-web-frontend.vercel.app`

**Verify your Vercel URL matches exactly!**

To check your actual Vercel URL:
1. Go to Vercel Dashboard → Your project
2. Look at the **Domains** section
3. Copy the exact URL (e.g., `https://full-ecom-web-frontend.vercel.app`)

If your URL is different, update `backend/server.js`:

```javascript
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "https://your-actual-vercel-url.vercel.app"  // Update this!
];
```

Then redeploy backend on Render.

## Common Issues

### Issue 1: "No 'Access-Control-Allow-Origin' header"

**Cause:** Backend CORS doesn't allow your frontend URL

**Fix:**
1. Check your exact Vercel URL
2. Update `allowedOrigins` in `backend/server.js`
3. Redeploy backend on Render

### Issue 2: "net::ERR_FAILED"

**Cause:** Backend is not running or URL is wrong

**Fix:**
1. Check backend is running: `curl https://full-ecom-web-156s.onrender.com/health`
2. Verify URL in Vercel environment variables
3. Check Render logs for errors

### Issue 3: Environment Variables Not Updating

**Cause:** Vercel caches environment variables

**Fix:**
1. Update environment variable in Vercel
2. **Important:** Redeploy after changing env vars
3. Clear browser cache
4. Try in incognito/private window

## Verification Checklist

After making changes, verify:

- [ ] Backend health endpoint responds: `https://full-ecom-web-156s.onrender.com/health`
- [ ] Backend products endpoint responds: `https://full-ecom-web-156s.onrender.com/api/products`
- [ ] Vercel environment variable has `/api` at the end
- [ ] Frontend redeployed after env var change
- [ ] Backend CORS allows your Vercel URL
- [ ] Can access frontend without CORS errors
- [ ] Can login to frontend
- [ ] Products load on homepage

## Quick Test

Open browser console on your Vercel site and run:

```javascript
// Check what API URL the frontend is using
console.log(import.meta.env.VITE_API_URL);

// Test API connection
fetch('https://full-ecom-web-156s.onrender.com/api/products')
  .then(res => res.json())
  .then(data => console.log('Products:', data))
  .catch(err => console.error('Error:', err));
```

## Still Having Issues?

1. **Check Render Backend Logs:**
   - Go to Render Dashboard → Your backend service
   - Click "Logs" tab
   - Look for CORS errors or connection issues

2. **Check Vercel Deployment Logs:**
   - Go to Vercel Dashboard → Your project
   - Click "Deployments" tab
   - Click on latest deployment
   - Check build logs for environment variable issues

3. **Verify Environment Variables:**
   ```bash
   # In Vercel deployment logs, you should see:
   # VITE_API_URL=https://full-ecom-web-156s.onrender.com/api
   ```

## Summary of Changes Made

✅ **Fixed in `frontend/.env.production`:**
- Changed: `VITE_API_URL=https://full-ecom-web-156s.onrender.com`
- To: `VITE_API_URL=https://full-ecom-web-156s.onrender.com/api`

⏳ **You need to do:**
1. Update environment variable in Vercel
2. Redeploy frontend
3. Verify backend CORS allows your Vercel URL
4. Test the application

---

**Need more help?** Check the browser console for specific error messages and share them.
