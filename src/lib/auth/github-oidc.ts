import { createRemoteJWKSet, jwtVerify } from "jose";

const GITHUB_ISSUER = "https://token.actions.githubusercontent.com";
const JWKS = createRemoteJWKSet(new URL(`${GITHUB_ISSUER}/.well-known/jwks`));

const ALLOWED_REPOS = new Set([
  "tumainih/-kingdom-mentor",
  "tumainih/kingdom-mentor",
]);

function expectedAudience(): string {
  return (
    process.env.GITHUB_OIDC_AUDIENCE?.trim() ||
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    "https://temporary-instant-onyx-uuarmez.vercel.app"
  );
}

export async function verifyGithubActionsCronToken(
  bearerToken: string | null | undefined,
): Promise<boolean> {
  if (!bearerToken) return false;

  try {
    const { payload } = await jwtVerify(bearerToken, JWKS, {
      issuer: GITHUB_ISSUER,
      audience: expectedAudience(),
    });

    const repo = typeof payload.repository === "string" ? payload.repository : "";
    if (!ALLOWED_REPOS.has(repo)) return false;

    const ref = typeof payload.ref === "string" ? payload.ref : "";
    if (ref && ref !== "refs/heads/main") return false;

    return true;
  } catch {
    return false;
  }
}
