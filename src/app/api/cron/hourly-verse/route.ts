import { NextResponse } from "next/server";
import { sendHourlyVersePush } from "@/lib/push/send-hourly";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  const querySecret = new URL(request.url).searchParams.get("secret");

  if (secret && auth !== `Bearer ${secret}` && querySecret !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await sendHourlyVersePush();
  return NextResponse.json({ ok: true, ...result });
}
