#!/usr/bin/env node
/**
 * Sync required env vars to a claimed Vercel project.
 *
 *   VERCEL_TOKEN=xxx VERCEL_PROJECT_ID=prj_xxx node scripts/sync-vercel-env.mjs
 *
 * Generates VAPID keys if missing. Reads GEMINI_API_KEY from .env.local when present.
 */

import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const token = process.env.VERCEL_TOKEN?.trim();
const projectId = process.env.VERCEL_PROJECT_ID?.trim();
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
  "https://temporary-instant-onyx-uuarmez.vercel.app";

if (!token || !projectId) {
  console.error("Set VERCEL_TOKEN and VERCEL_PROJECT_ID.");
  process.exit(1);
}

function run(cmd) {
  return execSync(cmd, { encoding: "utf8", cwd: process.cwd() });
}

function readEnvLocal(key) {
  const file = path.join(process.cwd(), ".env.local");
  if (!existsSync(file)) return "";
  const match = readFileSync(file, "utf8").match(new RegExp(`^${key}=(.+)$`, "m"));
  return match?.[1]?.trim() ?? "";
}

function generateVapid() {
  const out = run("npx web-push generate-vapid-keys");
  const pub = out.match(/Public Key:\s*\n(.+)/)?.[1]?.trim();
  const priv = out.match(/Private Key:\s*\n(.+)/)?.[1]?.trim();
  if (!pub || !priv) throw new Error("Failed to generate VAPID keys");
  return { pub, priv };
}

async function upsertEnv(key, value, type = "encrypted") {
  const listRes = await fetch(
    `https://api.vercel.com/v9/projects/${projectId}/env`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!listRes.ok) throw new Error(`List env failed: ${listRes.status}`);
  const list = await listRes.json();
  const existing = list.envs?.find((e) => e.key === key && e.target?.includes("production"));

  if (existing) {
    const res = await fetch(
      `https://api.vercel.com/v9/projects/${projectId}/env/${existing.id}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ value, target: ["production", "preview", "development"] }),
      },
    );
    if (!res.ok) throw new Error(`Update ${key} failed: ${res.status}`);
    console.log(`Updated ${key}`);
    return;
  }

  const res = await fetch(`https://api.vercel.com/v10/projects/${projectId}/env`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      key,
      value,
      type,
      target: ["production", "preview", "development"],
    }),
  });
  if (!res.ok) throw new Error(`Create ${key} failed: ${res.status}`);
  console.log(`Created ${key}`);
}

const vapid =
  process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY
    ? {
        pub: process.env.VAPID_PUBLIC_KEY,
        priv: process.env.VAPID_PRIVATE_KEY,
      }
    : generateVapid();

const cronSecret =
  process.env.CRON_SECRET?.trim() ||
  readEnvLocal("CRON_SECRET") ||
  run("openssl rand -hex 24").trim();

const geminiKey = readEnvLocal("GEMINI_API_KEY");

const vars = {
  VAPID_PUBLIC_KEY: vapid.pub,
  VAPID_PRIVATE_KEY: vapid.priv,
  VAPID_SUBJECT: process.env.VAPID_SUBJECT || "mailto:notifications@kingdom-ai.app",
  NEXT_PUBLIC_SITE_URL: siteUrl,
  CRON_SECRET: cronSecret,
  GEMINI_MODEL: readEnvLocal("GEMINI_MODEL") || "gemini-3.6-flash",
};

if (geminiKey) vars.GEMINI_API_KEY = geminiKey;

for (const [key, value] of Object.entries(vars)) {
  if (!value) continue;
  await upsertEnv(key, value, key.startsWith("NEXT_PUBLIC_") ? "plain" : "encrypted");
}

console.log("\nDone. Redeploy for changes to take effect:");
console.log(`  VERCEL_TOKEN=... VERCEL_PROJECT_ID=${projectId} npm run deploy:vercel`);
