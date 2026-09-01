#!/usr/bin/env node
/**
 * Background push (app closed): Upstash Redis + GitHub hourly cron + Vercel env.
 *
 *   VERCEL_TOKEN=xxx VERCEL_PROJECT_ID=prj_xxx node scripts/setup-background-push.mjs
 */

import { execSync, spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const token = process.env.VERCEL_TOKEN?.trim();
const projectId = process.env.VERCEL_PROJECT_ID?.trim();
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
  "https://temporary-instant-onyx-uuarmez.vercel.app";
const githubRepo = process.env.GITHUB_REPO?.trim() || "tumainih/-kingdom-mentor";

if (!token || !projectId) {
  console.error("Set VERCEL_TOKEN and VERCEL_PROJECT_ID.");
  process.exit(1);
}

function run(cmd, opts = {}) {
  return execSync(cmd, { encoding: "utf8", cwd: process.cwd(), ...opts }).trim();
}

function readEnvLocal(key) {
  const file = path.join(process.cwd(), ".env.local");
  if (!existsSync(file)) return "";
  const match = readFileSync(file, "utf8").match(new RegExp(`^${key}=(.+)$`, "m"));
  return match?.[1]?.trim() ?? "";
}

async function upsertEnv(key, value, type = "encrypted") {
  const listRes = await fetch(`https://api.vercel.com/v9/projects/${projectId}/env`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!listRes.ok) throw new Error(`List env failed: ${listRes.status}`);
  const list = await listRes.json();
  const existing = list.envs?.find((e) => e.key === key && e.target?.includes("production"));

  const body = { value, target: ["production", "preview", "development"] };
  if (existing) {
    const res = await fetch(
      `https://api.vercel.com/v9/projects/${projectId}/env/${existing.id}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
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
    body: JSON.stringify({ key, value, type, ...body }),
  });
  if (!res.ok) throw new Error(`Create ${key} failed: ${res.status}`);
  console.log(`Created ${key}`);
}

async function ensureUpstash() {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (url && redisToken) return { url, token: redisToken };

  console.log("Creating temporary Upstash Redis (claim within 72h for permanent)…");
  const res = await fetch("https://upstash.com/start-redis", {
    method: "POST",
    headers: {
      "User-Agent": "cursor-cloud-agent",
      "Content-Type": "application/json",
    },
    body: "{}",
  });
  const text = await res.text();
  const endpoint = text.match(/\*\*Endpoint:\*\* (https:\/\/[^\s]+)/)?.[1];
  const redisTok = text.match(/\*\*Token:\*\* (\S+)/)?.[1];
  const consoleUrl = text.match(/(https:\/\/upstash\.com\/start-redis\/console\/[^\s)]+)/)?.[1];
  if (!endpoint || !redisTok) throw new Error("Failed to create Upstash Redis");
  if (consoleUrl) console.log(`Claim database: ${consoleUrl}`);
  return { url: endpoint, token: redisTok };
}

const cronSecret =
  process.env.CRON_SECRET?.trim() ||
  readEnvLocal("CRON_SECRET") ||
  run("openssl rand -hex 24");

const upstash = await ensureUpstash();

await upsertEnv("UPSTASH_REDIS_REST_URL", upstash.url, "plain");
await upsertEnv("UPSTASH_REDIS_REST_TOKEN", upstash.token);
await upsertEnv("CRON_SECRET", cronSecret);

try {
  const result = spawnSync("gh", ["secret", "set", "CRON_SECRET", "-R", githubRepo], {
    input: cronSecret,
    encoding: "utf8",
  });
  if (result.status !== 0) throw new Error(result.stderr || "gh secret set failed");
  console.log("Set GitHub secret CRON_SECRET");
} catch (err) {
  console.warn("Could not set GitHub secret (set CRON_SECRET manually in repo secrets)");
  console.warn(String(err.message || err));
}

console.log("\nBackground push configured.");
console.log(`Site: ${siteUrl}`);
console.log("Next: npm run deploy:vercel");
console.log("Then on phone: open app → Notifications → turn alerts OFF then ON again.");
