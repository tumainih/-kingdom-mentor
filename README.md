# Kingdom AI

Kingdom AI is a Christian wisdom mentor that helps you think, respond, decide, and live according to the **Kingdom of God**. Every response is grounded in **retrieved Scripture** from a bundled local Bible — the app does not rely on the model's memory for Bible content.

Kingdom AI is an AI assistant, **not** God, Jesus, the Holy Spirit, a prophet, or a replacement for a pastor, church, or qualified professional.

**Repository:** [https://cursor.com/codebase/hoseatumaini4/kingdom-mentor](https://cursor.com/codebase/hoseatumaini4/kingdom-mentor)

## Features

- **Full Bible** — 66 books, 31,102 verses in English (KJV) and Swahili (SUV)
- **Language switcher** — toggle **EN / SW** in the header; UI, Scripture, and voice follow your choice
- **Bible stories** — ask e.g. *"tell me the story of Moses"* or *"simulia hadithi ya Musa"*
- Scripture-grounded chat using local search over the bundled corpus
- **Chat** (text) and **Talk** (voice in/out) modes
- Free guidance mode — works without an API key or payment
- Optional Google Gemini for richer replies when `GEMINI_API_KEY` is set
- Streaming responses with visible Scripture references
- **Offline PWA** — install on iPhone or Android from one link; hourly Scripture, verse lookup, and Bible guidance work without internet after the first online visit

## Install on your phone (one link)

Open **`/install`** on your deployed site (e.g. `https://your-app.vercel.app/install`). Same URL for iPhone and Android:

- **iPhone / iPad** — open in Safari → Share → Add to Home Screen
- **Android** — open in Chrome → Install app (or menu → Add to Home screen)

After one visit online, the app caches the full Bible locally and works offline for hourly verses, reference lookup (e.g. John 3:16), and Scripture-based guidance.

## Prerequisites

- Node.js 18+
- Optional: [Google Gemini API key](https://aistudio.google.com/apikey)

## Setup

```bash
npm install
cp .env.example .env.local
# Optional: add GEMINI_API_KEY to .env.local
npm run dev
```

Open [http://localhost:43123](http://localhost:43123).

## Language & Bible

| Language | Translation | Index file |
|----------|-------------|------------|
| English  | KJV         | `data/kjv-index.json` |
| Swahili  | SUV         | `data/swahili-index.json` |

Use the **EN / SW** toggle in the header. Your choice is saved in the browser and applies to Chat, Talk, Scripture retrieval, and speech (Swahili uses `sw-KE` for mic/TTS where supported).

### Bible story questions

Examples:

- English: *Tell me the story of Moses*, *Who was David?*, *Story of Noah*
- Swahili: *Simulia hadithi ya Musa*, *Hadithi ya Daudi*, *Eleza kuhusu Nuhu*

Stories pull chapter ranges and key verses across the full 66-book canon.

## Chat vs Talk

- **Chat** — type messages; replies stream as text only (no speech)
- **Talk** — tap the mic to speak; Kingdom AI listens and **reads replies aloud**

## Deploy (free — no Vercel Pro needed)

**Full guide:** [DEPLOY.md](./DEPLOY.md)

### Render (recommended)

1. [render.com](https://render.com) → **New Blueprint** or **Web Service**
2. Connect **https://github.com/tumainih/-kingdom-mentor**
3. Uses `render.yaml` — build: `npm install && npm run build`, start: `npm start`
4. Add env vars from `.env.example` in the Render dashboard

### Netlify

1. [netlify.com](https://netlify.com) → Import from Git → same repo
2. Uses `netlify.toml` automatically

### Local production test

```bash
npm run build
npm start
```

Open [http://localhost:3000](http://localhost:3000).

Optional environment variables:

- `GEMINI_API_KEY` — enables Gemini when quota allows; otherwise free mode
- `GEMINI_MODEL` — optional (default: `gemini-3.6-flash`)
- `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` — Web Push
- `CRON_SECRET` — protects `/api/cron/hourly-verse` (use [cron-job.org](https://cron-job.org) on Render/Netlify)

## Rebuild Bible indexes (optional)

Indexes are included in `data/`. To regenerate:

```bash
npm run prepare-bible    # English KJV
npm run prepare-swahili  # Swahili SUV
```

Swahili source: [shemmjunior/swahili-bible-edition](https://github.com/shemmjunior/swahili-bible-edition) (MIT).

## How Scripture grounding works

1. Your message is searched against the local Bible index for the active language (~31,000 verses).
2. Story requests match named narratives (Moses, David, Jesus, etc.) and pull relevant chapters.
3. The most relevant passages are injected into the AI context (or used directly in free mode).
4. Retrieved references are shown above each Chat reply.

## Important boundaries

- Never treats AI output as divine revelation
- Encourages qualified human help for abuse, danger, medical, mental health, legal, and financial matters
- Does not invent Bible verses — if retrieval is insufficient, the assistant says so honestly

## Tech stack

- Next.js 16, TypeScript, Tailwind CSS, shadcn/ui
- Google Gemini API (optional, streaming)
- Fuse.js full-text search over bundled KJV + SUV JSON

## License

KJV and SUV Bible text used under their respective public/open licenses. Application code is provided as-is for the kingdom-mentor project.
