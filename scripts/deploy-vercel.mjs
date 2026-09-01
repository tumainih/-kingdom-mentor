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

const GITHUB_REPO_ID = 1352573169;
const GITHUB_ORG = "tumainih";
const GITHUB_REPO = "-kingdom-mentor";
const PRODUCTION_ALIAS = "temporary-instant-onyx-uuarmez.vercel.app";

async function triggerGithubProductionDeploy(token, projectId, orgId) {
  const res = await fetch(
    `https://api.vercel.com/v13/deployments?teamId=${encodeURIComponent(orgId)}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "temporary-instant-onyx-uuarmez",
        project: projectId,
        target: "production",
        gitSource: {
          type: "github",
          org: GITHUB_ORG,
          repo: GITHUB_REPO,
          ref: "main",
          repoId: GITHUB_REPO_ID,
        },
      }),
    },
  );

  const body = await res.json();
  if (!res.ok) {
    throw new Error(body.error?.message || `Vercel API deploy failed (${res.status})`);
  }

  const deploymentId = body.id;
  const deadline = Date.now() + 10 * 60 * 1000;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 10_000));
    const statusRes = await fetch(
      `https://api.vercel.com/v13/deployments/${deploymentId}?teamId=${encodeURIComponent(orgId)}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    const status = await statusRes.json();
    if (status.readyState === "READY") {
      return `https://${PRODUCTION_ALIAS}`;
    }
    if (status.readyState === "ERROR" || status.readyState === "CANCELED") {
      throw new Error(`Deployment ${deploymentId} ended with ${status.readyState}`);
    }
    console.log(`… ${status.readyState} (${status.url || deploymentId})`);
  }

  throw new Error(`Timed out waiting for deployment ${deploymentId}`);
}

function run(cmd) {
  console.log(`> ${cmd.replace(/(token|VERCEL_TOKEN=)\S+/gi, "$1***")}`);
  return execSync(cmd, { encoding: "utf8", cwd: root });
}

const token = process.env.VERCEL_TOKEN?.trim();
let projectId = process.env.VERCEL_PROJECT_ID?.trim() || process.env.VERCEL_PROJECT?.trim();
let orgId = process.env.VERCEL_ORG_ID?.trim();

const linkedProject = path.join(root, ".vercel", "project.json");
if (existsSync(linkedProject)) {
  try {
    const linked = JSON.parse(readFileSync(linkedProject, "utf8"));
    projectId = projectId || linked.projectId;
    orgId = orgId || linked.orgId;
  } catch {
    /* ignore */
  }
}

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
  const env = { ...process.env };
  if (projectId) env.VERCEL_PROJECT_ID = projectId;
  if (orgId) env.VERCEL_ORG_ID = orgId;

  let out = "";
  let cmd = `npx vercel deploy --prod --yes --force --token "${token}"`;
  console.log(`> ${cmd.replace(/(token|VERCEL_TOKEN=)\S+/gi, "$1***")}`);
  try {
    out = execSync(cmd, { encoding: "utf8", cwd: root, env });
  } catch (cliErr) {
    if (!projectId || !orgId) throw cliErr;
    console.warn("Vercel CLI deploy failed — triggering GitHub production deploy via API…");
    out = await triggerGithubProductionDeploy(token, projectId, orgId);
  }

  const urlMatch = out.match(/https:\/\/[^\s]+\.vercel\.app/) ||
    out.match(/temporary-instant-onyx-uuarmez[^\s]*/);
  if (urlMatch) {
    const url = urlMatch[0].startsWith("http") ? urlMatch[0] : `https://${urlMatch[0]}`;
    console.log(`\nLive: ${url.includes("vercel.app") ? "https://temporary-instant-onyx-uuarmez.vercel.app" : url}`);
    console.log(`Install: https://temporary-instant-onyx-uuarmez.vercel.app/install`);
    console.log("\nInstalled PWAs on this domain will pick up the new service worker on next open.");
  }
} finally {
  if (vercelConfigStripped && existsSync(vercelBackup)) {
    writeFileSync(vercelJson, readFileSync(vercelBackup, "utf8"));
    execSync(`rm -f "${vercelBackup}"`, { cwd: root });
  }
}
