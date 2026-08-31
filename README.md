# Kingdom AI

Kingdom AI is a Christian wisdom mentor that helps you think, respond, decide, and live according to the **Kingdom of God**. Every response is grounded in **retrieved King James Version (KJV) Scripture** — the app does not rely on the model's memory for Bible content.

Kingdom AI is an AI assistant, **not** God, Jesus, the Holy Spirit, a prophet, or a replacement for a pastor, church, or qualified professional.

**Repository:** [https://cursor.com/codebase/hoseatumaini4/kingdom-mentor](https://cursor.com/codebase/hoseatumaini4/kingdom-mentor)

## Features

- Scripture-grounded chat using a bundled local KJV corpus
- Full Kingdom AI master system prompt (wisdom, correction, decision guidance, prayer, daily reflection)
- Streaming responses with visible Scripture references used for each reply
- Prompt-only mode detection (Decision, Correction, Reflection, Prayer inferred from your words)

## Prerequisites

- Node.js 18+
- A [Google Gemini API key](https://aistudio.google.com/apikey)

## Setup

```bash
npm install
cp .env.example .env.local
# Add your GEMINI_API_KEY to .env.local
npm run dev
```

Open [http://localhost:43123](http://localhost:43123).

### Talk with Kingdom AI

- **Type** your message and press Enter, or tap the **send** button
- **Speak** by tapping the **microphone** icon in the input bar (Chrome/Edge recommended)
- **Listen** — enable "AI reads replies aloud" or tap the speaker icon on any reply
- **Continue the conversation** — Kingdom AI remembers the full thread and stays focused on your issue

You need a valid `GEMINI_API_KEY` in `.env.local` for AI responses to work.

### Rebuild the Bible index (optional)

The KJV search index is included at `data/kjv-index.json`. To regenerate it from source:

```bash
npm run prepare-bible
```

## Get the repository (Windows)

Origin CLI runs on macOS, Linux, and **WSL only** — not in PowerShell. Use a WSL terminal:

```bash
# Run in WSL (Origin CLI is not available in PowerShell)
# Install the Origin CLI
curl -fsSL https://downloads.cursor.com/origin/install.sh | sh

# Sign in (also sets up git credentials)
origin auth login

# Clone the repository
origin repo clone hoseatumaini4/kingdom-mentor
```

If `origin` is not found after install:

```bash
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

**Origin CLI docs:** [https://cursor.com/docs/origin/cli](https://cursor.com/docs/origin/cli)

## How Scripture grounding works

1. Your message is searched against a local KJV index (~31,000 verses).
2. The most relevant passages are injected into the AI context.
3. The model is instructed to derive **100% of biblical guidance** from those passages only.
4. Retrieved references are shown above each response.

## Important boundaries

- Never treats AI output as divine revelation
- Encourages qualified human help for abuse, danger, medical, mental health, legal, and financial matters
- Does not invent Bible verses — if retrieval is insufficient, the assistant says so honestly

## Tech stack

- Next.js 16, TypeScript, Tailwind CSS, shadcn/ui
- Google Gemini API (streaming)
- Fuse.js full-text search over bundled KJV JSON

## License

Bible text (KJV) is public domain. Application code is provided as-is for the kingdom-mentor project.
