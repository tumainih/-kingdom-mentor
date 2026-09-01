import { NextResponse } from "next/server";
import { isPushConfigured } from "@/lib/push/vapid";
import { listPushSubscriptions } from "@/lib/push/store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const pushConfigured = isPushConfigured();
  const redisConfigured = Boolean(
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN,
  );
  let pushSubscriptions = 0;
  if (pushConfigured && redisConfigured) {
    try {
      pushSubscriptions = (await listPushSubscriptions()).length;
    } catch {
      /* redis unreachable */
    }
  }

  return NextResponse.json(
    {
      ok: true,
      service: "kingdom-mentor",
      ts: Date.now(),
      pushConfigured,
      redisConfigured,
      pushSubscriptions,
      backgroundPushReady: pushConfigured && redisConfigured,
    },
    { status: 200 },
  );
}
