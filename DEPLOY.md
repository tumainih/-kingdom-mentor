# Deploy Kingdom AI (free — no Vercel Pro, no Netlify)

Latest code: **https://github.com/tumainih/-kingdom-mentor** (`main`)

All options below run the same **Node.js** app (`npm run build` → `npm start`). Bible, Home, History, and Areas work without paid APIs. Add env vars for AI chat and push alerts.

---

## Environment variables (all platforms)

| Variable | Required | Notes |
|----------|----------|--------|
| `GEMINI_API_KEY` | For AI chat | Free Bible/Areas/Home still work without it |
| `VAPID_PUBLIC_KEY` | For push alerts | `npx web-push generate-vapid-keys` |
| `VAPID_PRIVATE_KEY` | For push alerts | |
| `VAPID_SUBJECT` | For push alerts | e.g. `mailto:you@example.com` |
| `CRON_SECRET` | For hourly cron | Any long random string |
| `UPSTASH_REDIS_REST_URL` | Optional | Push subscription storage |
| `UPSTASH_REDIS_REST_TOKEN` | Optional | |

Copy from `.env.example`. After deploy, set hourly cron (all platforms):

1. [cron-job.org](https://cron-job.org) (free) → schedule `0 * * * *`
2. URL: `https://YOUR-DOMAIN/api/cron/hourly-verse?secret=YOUR_CRON_SECRET`

---

## Option 1: Render (easiest — free tier)

1. Sign up at [render.com](https://render.com) (GitHub login).
2. **New → Blueprint** (or **Web Service → Connect repository**).
3. Select **`tumainih/-kingdom-mentor`**, branch **`main`**.
4. Render reads `render.yaml`, or set manually:
   - **Build:** `npm install && npm run build`
   - **Start:** `npm start`
   - **Plan:** Free
5. Add environment variables (table above).
6. Deploy → Render gives you a **`.onrender.com`** URL, for example:

   `https://kingdom-mentor.onrender.com`

   That `.com` address is your live app. Use these links:

   | Page | URL |
   |------|-----|
   | **Install (share this)** | `https://YOUR-APP.onrender.com/install` |
   | Home | `https://YOUR-APP.onrender.com/home` |
   | Hourly cron (cron-job.org) | `https://YOUR-APP.onrender.com/api/cron/hourly-verse?secret=YOUR_CRON_SECRET` |

   Replace `YOUR-APP` with the name Render assigned (shown at the top of your service dashboard).

**Note:** Free tier sleeps after ~15 min idle; first visit may take 30–60 s to wake. HTTPS is included — required for **Add to Home Screen** and offline mode.

### Change or set your link before sharing

Nothing in the app is locked to one URL — but you can pin your link in Render so **Copy link** on `/install` always shows the right address:

1. Render → your service → **Environment**
2. Add: `NEXT_PUBLIC_SITE_URL` = `https://YOUR-APP.onrender.com` (no trailing slash)
3. **Save** → **Manual Deploy** (redeploy required — Next.js bakes this in at build time)

**Rename the Render subdomain:** Settings → change the service **name** → Render assigns a new `https://new-name.onrender.com` (old URL stops working).

**Your own domain (optional):** Settings → **Custom Domains** → add e.g. `kingdom.example.com` → point DNS as Render shows → set `NEXT_PUBLIC_SITE_URL` to that domain and redeploy.

### Deploy from terminal (or Cursor agent)

Every push to **`main`** auto-deploys when Render is connected to GitHub.

Manual trigger:

```bash
export RENDER_DEPLOY_HOOK_URL="https://api.render.com/deploy/srv-...?key=..."
npm run deploy
```

Or: `RENDER_API_KEY` + `RENDER_SERVICE_ID` from Render → Account → API Keys.

---

## Option 2: Fly.io (free allowance, always-on capable)

Uses the repo `Dockerfile` and `fly.toml`.

1. Install [flyctl](https://fly.io/docs/hands-on/install-flyctl/) and sign up at [fly.io](https://fly.io).
2. From the project folder:

```bash
fly auth login
fly launch --no-deploy   # pick a unique app name if kingdom-mentor is taken
fly secrets set GEMINI_API_KEY=... VAPID_PUBLIC_KEY=... VAPID_PRIVATE_KEY=... VAPID_SUBJECT=mailto:you@example.com CRON_SECRET=...
fly deploy
```

3. Open `https://YOUR-APP.fly.dev/install`.

Machines can auto-stop when idle (`min_machines_running = 0` in `fly.toml`) to stay within free limits. Increase memory in `fly.toml` if the build or runtime OOMs.

---

## Option 3: Railway (free monthly credit)

1. [railway.app](https://railway.app) → **New Project → Deploy from GitHub**.
2. Select **`tumainih/-kingdom-mentor`**.
3. Railway detects **`Dockerfile`** automatically.
4. **Variables** tab → add env vars from the table above.
5. **Settings → Networking → Generate domain**.

Credit-based free tier; good for low-traffic personal use.

---

## Option 4: Koyeb (free tier, Git + Docker)

1. [koyeb.com](https://www.koyeb.com) → **Create App → GitHub**.
2. Repo: **`tumainih/-kingdom-mentor`**, branch **`main`**.
3. **Builder:** Dockerfile (path `/Dockerfile`).
4. **Port:** `3000`, **Instance type:** Free (Nano).
5. Add environment variables → Deploy.

URL like `https://your-app.koyeb.app`.

---

## Option 5: Google Cloud Run (generous free tier)

Pay-per-request; often $0 for small apps. Requires a Google Cloud account.

```bash
gcloud auth login
gcloud config set project YOUR_PROJECT_ID

gcloud run deploy kingdom-mentor \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --port 3000 \
  --set-env-vars "GEMINI_API_KEY=...,CRON_SECRET=..."
```

Add remaining secrets via Cloud Console → Cloud Run → your service → Variables.

---

## Option 6: Any VPS (Oracle Always Free, Hetzner, etc.)

Truly free forever on [Oracle Cloud Always Free](https://www.oracle.com/cloud/free/) (ARM VM) or any cheap VPS.

```bash
# On the server (Docker installed)
git clone https://github.com/tumainih/-kingdom-mentor.git
cd -kingdom-mentor
cp .env.example .env.local   # edit with your keys
docker compose up -d --build
```

Put **Caddy** or **nginx** in front for HTTPS, or expose port 3000 for testing.

`docker-compose.yml` is included in the repo.

---

## After deploy

- **Install page:** `https://YOUR-DOMAIN/install` — share this link; it prepares offline data automatically
- **Add to home screen** from `/install` (iPhone Safari or Android Chrome)
- **Home / History / Areas / Chat** — work offline after one online visit (PWA + service worker)
- Redeploy after changing env vars

### Offline checklist

1. Deploy to HTTPS (Render, Fly.io, etc.)
2. Open `/install` once while online — wait for “Ready for offline”
3. Add to home screen
4. Turn on airplane mode and open the app from your home screen

---

## Local production test

```bash
npm run build
npm start
```

Open [http://localhost:3000](http://localhost:3000).

---

## Not recommended for this project

- **Vercel** — may require Pro for your usage; use Render or Fly.io instead.
- **Netlify** — supported via `netlify.toml` if you already use it, but Render/Fly/Railway are simpler for this Node server + cron setup.
