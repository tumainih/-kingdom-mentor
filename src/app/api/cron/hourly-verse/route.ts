import { NextResponse } from "next/server";
import { verifyGithubActionsCronToken } from "@/lib/auth/github-oidc";
import { backfillAllDevices } from "@/lib/reading/backfill";
import { generateAllDueReports } from "@/lib/reading/reports";
import { sendHourlyVersePush } from "@/lib/push/send-hourly";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  const querySecret = new URL(request.url).searchParams.get("secret");
  const bearer = auth?.startsWith("Bearer ") ? auth.slice(7) : null;

  const authorizedBySecret =
    Boolean(secret) && (auth === `Bearer ${secret}` || querySecret === secret);
  const authorizedByGithub = await verifyGithubActionsCronToken(bearer);

  if (!authorizedBySecret && !authorizedByGithub) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const push = await sendHourlyVersePush();
  const backfilled = await backfillAllDevices();
  const reportsGenerated = await generateAllDueReports();
  return NextResponse.json({ ok: true, ...push, backfilled, reportsGenerated });
}
