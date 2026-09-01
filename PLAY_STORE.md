# Publish Kingdom AI on Google Play (Trusted Web Activity)

Kingdom AI is a Progressive Web App. The Play Store listing wraps it in a **Trusted Web Activity (TWA)** so users get a native install, notifications, and offline Scripture without a separate native codebase.

## Prerequisites

1. **Production HTTPS URL** — e.g. `https://temporary-instant-onyx-uuarmez.vercel.app`
2. **Background push configured** on Vercel:
   - `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`
   - `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
   - `CRON_SECRET` (for external cron if Vercel Hobby strips crons)
3. **Privacy policy** — live at `/privacy` (required by Play Console)
4. **Digital Asset Links** — served at `/.well-known/assetlinks.json`

## 1. Generate signing key

```bash
keytool -genkey -v -keystore android.keystore -alias kingdomai -keyalg RSA -keysize 2048 -validity 10000
```

Store the keystore and passwords securely (Play App Signing can manage the upload key).

## 2. Get SHA-256 fingerprint

```bash
keytool -list -v -keystore android.keystore -alias kingdomai | grep SHA256
```

Set on Vercel (and redeploy):

```env
ANDROID_PACKAGE_NAME=com.kingdomai.app
ANDROID_SHA256_FINGERPRINT=AB:CD:EF:...
```

Verify: open `https://YOUR_DOMAIN/.well-known/assetlinks.json` — it must list your package and fingerprint.

## 3. Build the Android App Bundle (AAB)

Install [Bubblewrap](https://github.com/GoogleChromeLabs/bubblewrap):

```bash
npm i -g @bubblewrap/cli
cd twa
bubblewrap init --manifest=https://YOUR_DOMAIN/manifest.webmanifest
# Or merge with twa/twa-manifest.json and run:
bubblewrap build
```

Upload `app-release-bundle.aab` to [Google Play Console](https://play.google.com/console).

## 4. Play Console checklist

| Item | Value |
|------|--------|
| App name | Kingdom AI |
| Category | Books & Reference / Lifestyle |
| Privacy policy URL | `https://YOUR_DOMAIN/privacy` |
| Content rating | Complete questionnaire (religious content) |
| Target audience | 13+ (adjust per your policy) |
| Data safety | On-device Bible + optional push endpoint; see `/privacy` |

### Store listing assets

- **Icon:** 512×512 PNG (`public/icon-512.png`)
- **Feature graphic:** 1024×500
- **Phone screenshots:** Home, Chat, Notifications, Reports (at least 2)

## 5. Reliable notifications on Android

After install from Play or Chrome:

1. Open **Notifications** in the app and turn alerts **on** (grant permission).
2. Confirm `/api/health` shows `backgroundPushReady: true`.
3. On the device: **Settings → Apps → Kingdom AI → Notifications** — allow all categories and sound.
4. Disable battery optimization for Kingdom AI (varies by OEM: “Unrestricted”, “Don’t optimize”).
5. After app updates, turn alerts **off then on** once to refresh the push subscription.

Hourly delivery uses **Web Push** from the server (GitHub Actions cron or Vercel cron). Local service-worker timers are disabled when push is active to avoid duplicate alerts.

## 6. Hourly cron (if Vercel Hobby limits crons)

Copy the workflow to your repo (requires `workflow` scope on push):

```bash
mkdir -p .github/workflows
cp scripts/github-workflows/hourly-verse-push.yml .github/workflows/
```

Or call every hour with [cron-job.org](https://cron-job.org):

```
GET https://YOUR_DOMAIN/api/cron/hourly-verse?secret=YOUR_CRON_SECRET
```

## 7. Update host in TWA manifest

Before each Play release, set `host`, `iconUrl`, and `webManifestUrl` in `twa/twa-manifest.json` to your production domain, bump `appVersionCode`, then rebuild the AAB.
