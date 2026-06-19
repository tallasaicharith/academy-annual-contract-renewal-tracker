# Deployment Guide: Oxygen Sports Contract Tracker

This guide details how to deploy the **Oxygen Sports Academy Contract Renewal Tracker** application to production.

---

## ⚠️ Important Architecture Notice

Before deploying, it is critical to understand the database architecture:
* The backend uses a local **SQLite database file** (`tracker.db`) to store user accounts, contracts, and audit logs.
* **Vercel** is a serverless platform. Vercel Serverless Functions are **stateless and ephemeral**; the filesystem is read-only (except `/tmp` which wipes out between requests).
* If you deploy the Express server as-is to Vercel, any new contract additions or status updates **will be lost** as soon as the serverless function restarts.

### Recommended Production Approaches:

1. **Hybrid Deployment (Highly Recommended):**
   * **Frontend:** Deploy on **Vercel** (fast, global CDN, perfect for static Vite React apps).
   * **Backend:** Deploy on **Railway** or **Render** (supports persistent server processes and SSD disk volumes to keep your SQLite database persistent).

2. **Serverless Database Migration:**
   * Keep the backend on Vercel serverless functions, but modify the code to connect to a cloud database (like **Turso** for SQLite, or **Neon** / **Supabase** for PostgreSQL) instead of a local file.

---

## Option 1: Hybrid Deployment (Vercel Frontend + Render/Railway Backend)

### Step 1: Deploy Backend to Railway or Render

#### Option A: Deploying on Railway (Easiest with SQLite)
Railway supports persistent disks, which is perfect for SQLite.

1. Create a [Railway account](https://railway.app/).
2. Click **New Project** -> **Deploy from GitHub repo** and select `academy-annual-contract-renewal-tracker`.
3. In the project settings, set the root directory to `backend`.
4. Add the following **Environment Variables**:
   * `PORT`: `5000`
   * `JWT_SECRET`: A secure random string (e.g. `oxygen_sports_prod_secret_2026`)
5. To make the database persistent, add a **Railway Volume** and mount it to `/app` (or configure your database path to point to the mounted persistent volume directory).
6. Click **Deploy**. Copy your backend URL (e.g., `https://backend-production.up.railway.app`).

#### Option B: Deploying on Render (Free Web Service)
Render has a free tier for web services.

1. Go to [Render](https://render.com/) and log in with GitHub.
2. Click **New +** -> **Web Service**.
3. Connect your repository `academy-annual-contract-renewal-tracker`.
4. Configure the Web Service:
   * **Name:** `oxygen-sports-backend`
   * **Root Directory:** `backend`
   * **Runtime:** `Node`
   * **Build Command:** `npm install`
   * **Start Command:** `node server.js`
   * **Instance Type:** `Free`
5. Go to **Environment** tab and add:
   * `JWT_SECRET`: `your_secure_secret_key`
6. Click **Create Web Service**. Once deployed, copy your service URL.
   > [!NOTE]
   > On Render's Free tier, the filesystem restarts every time the service spins down (after 15 minutes of inactivity). To prevent data resets on Render, you must add a Disk ($1/month) or connect to an external SQL database.

---

### Step 2: Configure Frontend for Production

Before deploying the frontend, update the API client to point to your new production backend URL instead of localhost.

1. Open [`frontend/src/utils/api.js`](file:///e:/TERM - 4/NEW PROJECT/frontend/src/utils/api.js).
2. Change the `API_BASE` definition to detect the environment:
   ```javascript
   const API_BASE = import.meta.env.PROD 
     ? 'https://your-backend-service-url.render.com/api' // Replace with your production backend URL
     : '/api'; // Stays /api locally for Vite proxy
   ```

---

### Step 3: Deploy Frontend to Vercel

1. Create a [Vercel Account](https://vercel.com/) and connect your GitHub.
2. Click **Add New** -> **Project**.
3. Select your repository `academy-annual-contract-renewal-tracker`.
4. Configure the Project:
   * **Framework Preset:** `Vite`
   * **Root Directory:** `frontend`
5. Click **Deploy**. Vercel will build the React bundle and serve it on a global CDN.

---

## Option 2: Deploying Both Frontend and Backend on Render

You can host both in a single dashboard on Render by deploying them as two separate services in the same repo.

1. **Deploy Backend:** Follow the Render backend steps above.
2. **Deploy Frontend:**
   * Create a **Static Site** on Render.
   * Root directory: `frontend`
   * Build Command: `npm run build`
   * Publish Directory: `dist`
   * Route Rewrite Rule: Rewrite all paths (`/*`) to `index.html` (important for React Router browser routing).
