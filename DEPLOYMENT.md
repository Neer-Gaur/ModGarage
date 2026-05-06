# ModSyndicate — Production Deployment Guide
## Backend on Render • Frontend on Hostinger Business • DB on Supabase

This guide assumes:
- ✅ Supabase project created (`zafmdeuolblehjrwseuu`)
- ✅ `supabase_setup.sql` has been executed
- ✅ Google OAuth configured in Google Cloud + Supabase
- ✅ Domain: `modsyndicate.in` (Hostinger Business plan)

---

## 1️⃣ Deploy Backend on Render (~10 min, FREE)

### A. Push code to GitHub
```bash
cd /path/to/ModGarage
git add .
git commit -m "Migrate to Supabase + Render deploy config"
git push
```

### B. Create Render service
1. Go to https://dashboard.render.com → "New" → **Web Service**
2. Connect your GitHub repo → choose this project
3. Render will auto-detect `render.yaml` — confirm:
   - **Name**: `modsyndicate-api`
   - **Region**: Singapore (closest to India)
   - **Root Directory**: `backend`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn server:app --host 0.0.0.0 --port $PORT --workers 1`
4. Click **"Advanced"** → **Add Environment Variables**:

| Key | Value |
|---|---|
| `DATABASE_URL` | *(your Transaction Pooler URI from Supabase, port 6543)* |
| `SUPABASE_URL` | `https://zafmdeuolblehjrwseuu.supabase.co` |
| `SUPABASE_SERVICE_KEY` | *(your service_role key)* |
| `SUPABASE_JWT_SECRET` | *(your JWT secret)* |
| `CORS_ORIGINS` | `https://modsyndicate.in,https://www.modsyndicate.in` |
| `PYTHON_VERSION` | `3.11.10` |

5. Click **"Create Web Service"** → wait ~3 min for first deploy
6. Copy the URL Render gives you (e.g. `https://modsyndicate-api.onrender.com`)
7. Test: open `https://modsyndicate-api.onrender.com/api/health` → should return `{"status":"ok","db":true}`

> ⚠️ **Render free tier note**: backend sleeps after 15 min of inactivity → 30s cold start on first request. Acceptable for MVP. Upgrade to **Starter ($7/mo)** for always-on.

---

## 2️⃣ Build Frontend for Production

### A. Update production env vars
Create `/frontend/.env.production`:
```
REACT_APP_BACKEND_URL=https://modsyndicate-api.onrender.com
REACT_APP_SUPABASE_URL=https://zafmdeuolblehjrwseuu.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGc...your_anon_key...
```

### B. Build the static bundle
On your local Windows machine (with Node 20 LTS):
```powershell
cd D:\ModGarage\frontend
npm install --legacy-peer-deps
npm run build
```

This creates `frontend/build/` with `index.html`, JS, CSS, assets — ready to upload.

---

## 3️⃣ Deploy Frontend on Hostinger Business

### A. Upload files
1. Log in to Hostinger → **hPanel** → **File Manager**
2. Navigate to `public_html/` (delete any default files: `default.php`, etc.)
3. Drag & drop **all contents inside** `frontend/build/` (NOT the build folder itself):
   - `index.html`
   - `static/` folder
   - `asset-manifest.json`
   - any other files (logo.png, etc.)

### B. Add `.htaccess` for React Router
Create `public_html/.htaccess` with this exact content:
```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /

  # Don't rewrite real files/dirs
  RewriteCond %{REQUEST_FILENAME} -f [OR]
  RewriteCond %{REQUEST_FILENAME} -d
  RewriteRule ^ - [L]

  # Force HTTPS
  RewriteCond %{HTTPS} !=on
  RewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

  # SPA fallback
  RewriteRule . /index.html [L]
</IfModule>

<IfModule mod_headers.c>
  Header set X-Content-Type-Options "nosniff"
  Header set X-Frame-Options "SAMEORIGIN"
</IfModule>

# Cache static assets aggressively
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType text/css "access plus 1 year"
  ExpiresByType application/javascript "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/webp "access plus 1 year"
  ExpiresByType image/svg+xml "access plus 1 year"
</IfModule>
```

### C. Connect domain
1. Hostinger → Domains → `modsyndicate.in` → DNS Zone:
   - Make sure A record points to your Hostinger hosting IP (auto-set when you assign the hosting)
2. Hostinger → Hosting → Auto-install SSL (Let's Encrypt) — enable HTTPS
3. Visit https://modsyndicate.in → should load the React app

---

## 4️⃣ Final Supabase Configuration

In **Supabase Dashboard**:

### A. Authentication → URL Configuration
- **Site URL**: `https://modsyndicate.in`
- **Redirect URLs**: add ALL:
  ```
  https://modsyndicate.in/auth/callback
  https://www.modsyndicate.in/auth/callback
  http://localhost:3000/auth/callback
  ```

### B. Authentication → Providers → Google
- Enable Google provider
- **Client ID**: from Google Cloud Console
- **Client Secret**: from Google Cloud Console
- Authorized redirect URI shown by Supabase = `https://zafmdeuolblehjrwseuu.supabase.co/auth/v1/callback` — **add this to Google Cloud OAuth Client's "Authorized redirect URIs"**

### C. Authentication → Email Templates (optional)
- Customize confirmation email (subject/body) to mention "ModSyndicate"

---

## 5️⃣ Testing the Full Flow

1. Open https://modsyndicate.in in incognito
2. Click **Sign In** → Google OAuth popup → choose account
3. After OAuth, you should land on `/onboarding` (first time) or `/dashboard`
4. Add a car → see `cars` row appear in Supabase Table Editor
5. Browse Marketplace → 15 products visible
6. Add to garage → row appears in `garage_items`
7. Create a community post with image upload → image appears in Storage `post-media` bucket

---

## 🔧 Troubleshooting

### Backend returns 500 on `/api/products`
- Check Render logs: Dashboard → modsyndicate-api → Logs
- Most common: `DATABASE_URL` wrong → ensure it's the **Transaction Pooler URI** (port 6543), not direct connection
- The password section must NOT contain unencoded `@` or `:` characters — URL-encode special characters

### Google OAuth shows "redirect_uri_mismatch"
- The exact URI Google expects is shown on the error page; copy it into both:
  - Google Cloud Console → OAuth Client → Authorized redirect URIs
  - Supabase Dashboard → Authentication → URL Configuration → Redirect URLs

### CORS error in browser console
- Backend env `CORS_ORIGINS` must include your domain WITHOUT trailing slash
- Restart Render service after changing env vars

### Sign in works but `/api/auth/me` returns 401
- Check that the Supabase `JWT_SECRET` you put in Render matches **Project Settings → API → JWT Settings → JWT Secret** (not the anon/service key)

### "Tenant not found" / asyncpg connection error
- You're using the wrong Supabase connection string. Use **Transaction Pooler** (port 6543), NOT Direct connection (port 5432)
- The asyncpg driver requires `statement_cache_size: 0` for the pooler — already configured in `database.py`

### Render free tier cold start is too slow
- Upgrade to Render Starter ($7/mo) for always-on
- OR switch to Railway / Fly.io / Hostinger VPS

---

## 📝 First-time Admin Setup

After signing up your first user, make them admin via Supabase SQL Editor:
```sql
UPDATE profiles SET role = 'admin' WHERE email = 'youremail@example.com';
```

Or via API after first login (works once):
```bash
curl -X POST https://modsyndicate-api.onrender.com/api/admin/init \
  -H "Authorization: Bearer YOUR_SUPABASE_ACCESS_TOKEN"
```
