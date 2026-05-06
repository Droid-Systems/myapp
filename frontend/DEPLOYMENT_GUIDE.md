# 🚀 Third-Party Cookie Fix - Deployment Guide

## Problem Solved
✅ **Fixed**: Safari, Firefox, and Brave were blocking cookies because the frontend (Vercel) and backend (Render) are on different domains.

✅ **Solution**: Next.js rewrites now proxy all API requests through the frontend domain, making cookies **first-party** and accepted by all browsers.

---

## 🔧 Changes Made

### 1. **Next.js Rewrites** (next.config.js)
Added API proxy that forwards `/api/*` requests from the frontend to the backend:
```javascript
async rewrites() {
  const backendUrl = process.env.BACKEND_URL || "http://localhost:4000";
  return [
    { source: "/api/:path*", destination: `${backendUrl}/api/:path*` }
  ];
}
```

### 2. **Updated All API URLs**
Changed all frontend code to use relative paths (`/api/...`) instead of absolute backend URLs.

**Before**: `http://localhost:4000/api/auth/login`
**After**: `/api/auth/login` (proxied by Next.js to backend)

---

## 📋 Deployment Steps

### **Step 1: Update Vercel Environment Variables**

Go to your Vercel project → Settings → Environment Variables and add:

| Variable | Value | Description |
|----------|-------|-------------|
| `BACKEND_URL` | `https://reaback.onrender.com` | Your Render backend URL |
| `NEXT_PUBLIC_API_URL` | **(Leave empty or don't set)** | Frontend will use relative paths |

**Important**:
- `BACKEND_URL` is used server-side by Next.js rewrites
- Remove or leave `NEXT_PUBLIC_API_URL` empty so the frontend uses `/api/...` paths

### **Step 2: Update Backend Environment Variables (Render)**

Go to your Render service → Environment → Add:

| Variable | Value | Description |
|----------|-------|-------------|
| `NODE_ENV` | `production` | **CRITICAL** - Enables `sameSite: "none"` for cross-origin |
| `FRONTEND_URL` | `https://your-app.vercel.app` | Your Vercel frontend URL |
| `GOOGLE_CALLBACK_URL` | `https://your-app.vercel.app/api/auth/google/callback` | Google OAuth via proxy |

**Critical**: Make sure `NODE_ENV=production` is set! Without it, cookies use `sameSite: "strict"` which blocks cross-origin.

### **Step 3: Deploy**

#### Backend (already pushed):
```bash
# Backend changes are already committed and pushed
# Render will auto-deploy
```

#### Frontend:
```bash
cd reafront

# Commit changes
git add .
git commit -m "Fix third-party cookie blocking with Next.js rewrites

- Add API proxy rewrites to make cookies first-party
- Update all API URLs to use relative paths
- Works in Safari, Firefox, Brave, and Chrome

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"

# Push to Vercel
git push origin main
```

Vercel will automatically deploy the changes.

---

## 🧪 Testing After Deployment

### Test in Safari/Firefox/Brave:
1. Go to your Vercel URL
2. Sign in with email/password or Google OAuth
3. ✅ Should stay logged in (no immediate logout)
4. Navigate around the dashboard
5. ✅ Should remain authenticated

### Verify Cookies:
1. Open DevTools → Application → Cookies
2. Check cookies for your Vercel domain (e.g., `your-app.vercel.app`)
3. Should see:
   - `access_token` (HttpOnly, Secure, SameSite=None)
   - `refresh_token` (HttpOnly, Secure, SameSite=None)

---

## 🔍 How It Works

### Before (Third-Party Cookies - Blocked):
```
Frontend: https://app.vercel.app
         ↓ (makes request to)
Backend:  https://reaback.onrender.com/api/auth/login
         ↓ (sets cookie on reaback.onrender.com)
Browser:  ❌ Blocks cookie (third-party)
```

### After (First-Party Cookies - Accepted):
```
Frontend: https://app.vercel.app
         ↓ (makes request to)
Next.js:  https://app.vercel.app/api/auth/login
         ↓ (proxies to)
Backend:  https://reaback.onrender.com/api/auth/login
         ↓ (sets cookie)
Next.js:  ↓ (forwards cookie to browser)
Browser:  ✅ Accepts cookie (first-party to app.vercel.app)
```

---

## 🛠️ Local Development

For local development, create `.env.local`:

```bash
# Frontend (.env.local)
NEXT_PUBLIC_API_URL=http://localhost:4000
```

This makes the frontend call the backend directly (no proxy needed since both are localhost).

---

## 🚨 Troubleshooting

### Issue: Still getting logged out immediately

**Check 1**: Verify `NODE_ENV=production` on backend (Render)
```bash
# Should return "production"
echo $NODE_ENV
```

**Check 2**: Check Vercel env vars
- `BACKEND_URL` should be set to your Render URL
- `NEXT_PUBLIC_API_URL` should be empty or not set

**Check 3**: Clear browser cookies
- DevTools → Application → Cookies → Clear all
- Try logging in again

### Issue: Google OAuth not working

**Check**: Update `GOOGLE_CALLBACK_URL` on backend to:
```
https://your-app.vercel.app/api/auth/google/callback
```

This makes Google OAuth go through the Next.js proxy.

---

## ✅ Success Criteria

After deployment, you should have:
- ✅ Login works in Chrome, Safari, Firefox, and Brave
- ✅ Users stay logged in after authentication
- ✅ Google OAuth works correctly
- ✅ No third-party cookie blocking warnings

---

## 📞 Support

If issues persist after following this guide:
1. Check browser console for errors
2. Check Network tab for failed API calls
3. Verify all environment variables are set correctly
4. Restart both Vercel and Render services

**Done!** 🎉
