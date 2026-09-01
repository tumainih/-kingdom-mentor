#!/usr/bin/env node
/**
 * Trigger a Render deploy from this machine.
 *
 * Option A — Deploy hook (easiest):
 *   RENDER_DEPLOY_HOOK_URL=https://api.render.com/deploy/srv-...?key=... node scripts/deploy-render.mjs
 *
 * Option B — Render API:
 *   RENDER_API_KEY=rnd_... RENDER_SERVICE_ID=srv-... node scripts/deploy-render.mjs
 */

const hook = process.env.RENDER_DEPLOY_HOOK_URL?.trim();
const apiKey = process.env.RENDER_API_KEY?.trim();
const serviceId = process.env.RENDER_SERVICE_ID?.trim();

async function deployViaHook() {
  const res = await fetch(hook);
  const text = await res.text();
  if (!res.ok) {
    console.error(`Deploy hook failed (${res.status}): ${text}`);
    process.exit(1);
  }
  console.log("Render deploy triggered via hook.");
  if (text) console.log(text);
}

async function deployViaApi() {
  const res = await fetch(`https://api.render.com/v1/services/${serviceId}/deploys`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ clearCache: "do_not_clear" }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error(`Render API deploy failed (${res.status}):`, data);
    process.exit(1);
  }
  console.log("Render deploy queued:", data.id ?? data);
}

async function main() {
  if (hook) {
    await deployViaHook();
    return;
  }
  if (apiKey && serviceId) {
    await deployViaApi();
    return;
  }

  console.error(`
No Render credentials found. Set one of:

  RENDER_DEPLOY_HOOK_URL   (from Render → Service → Settings → Deploy Hook)

  or

  RENDER_API_KEY + RENDER_SERVICE_ID   (from Render → Account → API Keys)

Then run:  node scripts/deploy-render.mjs

Or push to main on GitHub — Render autoDeploy handles it when the repo is connected.
`);
  process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
