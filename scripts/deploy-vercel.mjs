#!/usr/bin/env node
/**
 * Deploy / redeploy Kingdom AI on Vercel.
 *
 * **Same URL for installed PWAs** requires a claimed Vercel project + token:
 *   1. Claim: https://vercel.com/claim-deployment (or import GitHub repo on Vercel)
 *   2. Create token: https://vercel.com/account/tokens
 *   3. Run:
 *      VERCEL_TOKEN=xxx VERCEL_PROJECT_ID=prj_xxx npm run deploy:vercel
 *
 * Anonymous `--temporary` deploys get a NEW URL each time (not suitable for installed apps).
 */

import { execSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const vercelJson = path.join(root, "vercel.json");
const vercelBackup = path.join(root, "vercel.json.deploy-bak");

function run(cmd) {
  console.log(`> ${cmd.replace(/(token|VERCEL_TOKEN=)\S+/gi, "$1***")}`);
  return execSync(cmd, { encoding: "utf8", cwd: root });
}

const token = process.env.VERCEL_TOKEN?.trim();
const projectId = process.env.VERCEL_PROJECT_ID?.trim();

if (!token) {
  console.error(`
To redeploy to the SAME link (so your installed app updates), you need a Vercel account token.

1. Open https://vercel.com and sign in
2. Claim your deployment OR import GitHub repo: tumainih/-kingdom-mentor
3. Create token: https://vercel.com/account/tokens
4. Project ID: Vercel → Project → Settings → General → Project ID
5. Add env vars on Vercel: GEMINI_API_KEY, NEXT_PUBLIC_SITE_URL, etc.
6. Run:
   VERCEL_TOKEN=your_token VERCEL_PROJECT_ID=prj_xxx npm run deploy:vercel

Anonymous temporary deploys cannot reuse the same URL after the session ends.
`);
  process.exit(1);
}

let vercelConfigStripped = false;
if (existsSync(vercelJson)) {
  const raw = readFileSync(vercelJson, "utf8");
  // Hobby allows daily crons only — block sub-daily expressions like `0 * * * *`
  if (/"\s*0\s+\*\s+\*\s+\*\s+\*"/.test(raw)) {
    writeFileSync(vercelBackup, raw);
    writeFileSync(vercelJson, "{}");
    vercelConfigStripped = true;
    console.warn("Stripped sub-daily vercel.json crons (Hobby plan). Use 24 daily UTC crons instead.");
  }
}

try {
  let cmd = `npx vercel deploy --prod --yes --force --token "${token}"`;
  if (projectId) cmd += ` --project "${projectId}"`;

  const out = run(cmd);
  const urlMatch = out.match(/https:\/\/[^\s]+\.vercel\.app/);
  if (urlMatch) {
    console.log(`\nLive: ${urlMatch[0]}`);
    console.log(`Install: ${urlMatch[0]}/install`);
    console.log("\nInstalled PWAs on this domain will pick up the new service worker on next open.");
  }
} finally {
  if (vercelConfigStripped && existsSync(vercelBackup)) {
    writeFileSync(vercelJson, readFileSync(vercelBackup, "utf8"));
    execSync(`rm -f "${vercelBackup}"`, { cwd: root });
  }
}
