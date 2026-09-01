# Deploy Kingdom AI (free options — no Vercel Pro required)

Latest code: **https://github.com/tumainih/-kingdom-mentor** (`main`)

---

## Option 1: Render (recommended — free tier)

1. Sign up at [render.com](https://render.com) (GitHub login works).
2. **New → Blueprint** (or **Web Service → Connect repository**).
3. Select **`tumainih/-kingdom-mentor`** and branch **`main`**.
4. Render reads `render.yaml` automatically, or set manually:
   - **Build command:** `npm install && npm run build`
   - **Start command:** `npm start`
   - **Plan:** Free
5. Add **Environment** variables (Dashboard → your service → Environment):

| Variable | Required | Notes |
|----------|----------|--------|
| `GEMINI_API_KEY` | For AI chat | Free Bible/Areas/Home still work without it |
| `VAPID_PUBLIC_KEY` | For push alerts | `npx web-push generate-vapid-keys` |
| `VAPID_PRIVATE_KEY` | For push alerts | |
| `VAPID_SUBJECT` | For push alerts | e.g. `mailto:you@example.com` |
| `CRON_SECRET` | For hourly cron | Any long random string |
| `UPSTASH_REDIS_REST_URL` | Optional | Push subscription storage |
| `UPSTASH_REDIS_REST_TOKEN` | Optional | |

6. Click **Deploy**. Your URL will look like `https://kingdom-mentor.onrender.com`.

**Note:** Free Render apps sleep after ~15 minutes idle; first visit may take 30–60 seconds to wake.

### Hourly notifications on Render

Render free tier has no built-in cron. Use a free external scheduler:

1. Sign up at [cron-job.org](https://cron-job.org) (free).
2. Create a job every hour: `0 * * * *`
3. URL: `https://YOUR-APP.onrender.com/api/cron/hourly-verse?secret=YOUR_CRON_SECRET`

---

## Option 2: Netlify (free tier)

1. Sign up at [netlify.com](https://netlify.com) → **Add new site → Import from Git**.
2. Connect **`tumainih/-kingdom-mentor`**.
3. Netlify uses `netlify.toml` (Next.js plugin runs automatically on install).
4. Add the same environment variables as above in **Site settings → Environment variables**.
5. Deploy. URL like `https://something.netlify.app`.

For hourly cron on Netlify, use the same [cron-job.org](https://cron-job.org) URL as Render.

---

## Option 3: Docker (Railway, Fly.io, any VPS)

```bash
docker build -t kingdom-mentor .
docker run -p 3000:3000 -e GEMINI_API_KEY=... kingdom-mentor
```

Or push the repo to **Railway** ([railway.app](https://railway.app)) → New Project → Deploy from GitHub → uses `Dockerfile`.

---

## After deploy

- **Install page:** `https://YOUR-DOMAIN/install`
- **Home / History / Areas / Chat** — work offline after first visit (PWA)
- Set env vars and redeploy if you add keys later

---

## Vercel (optional)

Only if you have Vercel Pro or a plan that supports your usage. Otherwise use Render or Netlify above.

```bash
npx vercel deploy --prod
```
