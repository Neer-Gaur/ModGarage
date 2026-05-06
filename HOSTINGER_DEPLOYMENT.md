# ModGarage — Local Dev Fix + Hostinger Deployment Guide

## 1. The error you saw — why it happened

```
Error: Unknown keyword formatMinimum
  at /node_modules/ajv-keywords/dist/index.js:25
  at /node_modules/fork-ts-checker-webpack-plugin/node_modules/schema-utils/dist/validate.js:56
```

Root cause:
- `fork-ts-checker-webpack-plugin@6.5.3` ships its OWN nested copy of `schema-utils@2`, which calls `ajv-keywords` with the keyword `formatMinimum`.
- `npm` (which you used on Windows) honored the `"overrides": { "ajv": "^8", "ajv-keywords": "^5" }` from `package.json`, replacing the keywords library with v5 — but `formatMinimum` was REMOVED in v5 (moved to `ajv-formats`).
- Result: nested schema-utils tries to use a keyword that no longer exists → crash.

## 2. The fix that's now in `package.json`

We replaced the broken global `ajv` / `ajv-keywords` overrides with a **surgical override that bumps `schema-utils` itself to v4** (which natively uses ajv@8 + ajv-keywords@5):

```json
"overrides": {
  "fork-ts-checker-webpack-plugin": {
    "schema-utils": "^4.2.0"
  }
},
"resolutions": {
  "fork-ts-checker-webpack-plugin/**/schema-utils": "^4.2.0"
}
```

`overrides` works for **npm**, `resolutions` works for **yarn** — both are now covered.

## 3. What YOU need to do on your Windows machine

```powershell
cd D:\ModGarage\frontend

# 1) Use Node 20 LTS (Node 24 is too new for react-scripts 5)
#    Install nvm-windows from https://github.com/coreybutler/nvm-windows
#    Then:
nvm install 20.18.0
nvm use 20.18.0

# 2) Pull the updated package.json (already fixed in this repo)

# 3) Wipe stale installs
rmdir /s /q node_modules
del package-lock.json
del yarn.lock

# 4) Install fresh
npm install --legacy-peer-deps

# 5) Run
npm start
```

If you prefer yarn (recommended — yarn.lock is also committed):
```powershell
npm install -g yarn
yarn install
yarn start
```

## 4. About Hostinger — IMPORTANT

This project is **NOT a pure React app**. It has:
- React frontend (the `/frontend` folder)
- **FastAPI Python backend** (the `/backend` folder)
- **MongoDB database**

| Hostinger plan | Can it run ModGarage? |
|---|---|
| Shared / Premium / Business | ❌ Only the React build (frontend). Python backend will NOT run. |
| Cloud Hosting | ⚠️ Same as shared — no Python. |
| **VPS** (KVM 1+) | ✅ Full stack works (install Python, MongoDB, nginx). |

### Option A — VPS (recommended for full app)

On Hostinger VPS (Ubuntu 22.04):
```bash
# Backend
sudo apt update && sudo apt install -y python3-pip nginx
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor
echo "deb [signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt update && sudo apt install -y mongodb-org
sudo systemctl enable --now mongod

# Clone repo
git clone <your-repo> /var/www/modgarage
cd /var/www/modgarage/backend
pip3 install -r requirements.txt
# Create .env with MONGO_URL=mongodb://localhost:27017 and DB_NAME=modgarage

# Run backend with systemd or pm2
pip3 install gunicorn uvicorn
gunicorn server:app -k uvicorn.workers.UvicornWorker -b 0.0.0.0:8001 --daemon

# Frontend build
cd ../frontend
# Set REACT_APP_BACKEND_URL=https://yourdomain.com in .env.production
npm install --legacy-peer-deps
npm run build

# Nginx config (serve build/ + proxy /api → 8001)
sudo cp build/* /var/www/html/
# Add an nginx server block that:
#   - serves /var/www/html for /
#   - proxies /api/* to http://127.0.0.1:8001
```

### Option B — Frontend on Hostinger Shared, Backend elsewhere

If you only have shared hosting:
1. Deploy the **backend** to a free/cheap Python host:
   - [Render.com](https://render.com) (free tier)
   - [Railway.app](https://railway.app)
   - [Fly.io](https://fly.io)
   - Plus a managed MongoDB on [MongoDB Atlas](https://www.mongodb.com/atlas) (free tier)
2. In `frontend/.env.production`, set:
   ```
   REACT_APP_BACKEND_URL=https://your-backend.onrender.com
   ```
3. Run `npm run build` on your machine
4. Upload everything inside `frontend/build/` to Hostinger's `public_html/` folder via File Manager or FTP
5. Add a `.htaccess` in `public_html/` for React Router:
   ```apache
   <IfModule mod_rewrite.c>
     RewriteEngine On
     RewriteBase /
     RewriteRule ^index\.html$ - [L]
     RewriteCond %{REQUEST_FILENAME} !-f
     RewriteCond %{REQUEST_FILENAME} !-d
     RewriteRule . /index.html [L]
   </IfModule>
   ```

## 5. Quick local sanity check

After the fix:
```powershell
cd D:\ModGarage\frontend
npm start
# should compile and open http://localhost:3000
```

If it still fails, tell me:
- exact Node version (`node -v`)
- exact npm version (`npm -v`)
- the FULL error log
