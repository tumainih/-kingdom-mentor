import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function normalizeFingerprint(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.includes(":")) return trimmed.toUpperCase();
  return trimmed
    .replace(/[^a-fA-F0-9]/g, "")
    .match(/.{1,2}/g)
    ?.join(":")
    .toUpperCase() ?? trimmed.toUpperCase();
}

export async function GET() {
  const packageName = process.env.ANDROID_PACKAGE_NAME || "com.kingdomai.app";
  const fingerprint = process.env.ANDROID_SHA256_FINGERPRINT?.trim();

  if (!fingerprint) {
    return NextResponse.json([], {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=300",
      },
    });
  }

  return NextResponse.json(
    [
      {
        relation: ["delegate_permission/common.handle_all_urls"],
        target: {
          namespace: "android_app",
          package_name: packageName,
          sha256_cert_fingerprints: [normalizeFingerprint(fingerprint)],
        },
      },
    ],
    {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=300",
      },
    },
  );
}
