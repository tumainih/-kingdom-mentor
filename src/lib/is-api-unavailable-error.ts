/** True when Gemini cannot be used — return an unavailable excuse instead of faking a reply. */
export function isApiUnavailableError(err: unknown): boolean {
  const raw = err instanceof Error ? err.message : String(err);
  const lower = raw.toLowerCase();

  return (
    lower.includes("api key") ||
    lower.includes("not configured") ||
    lower.includes("quota") ||
    lower.includes("resource_exhausted") ||
    lower.includes("429") ||
    lower.includes("402") ||
    lower.includes("billing") ||
    lower.includes("payment") ||
    lower.includes("credit") ||
    lower.includes("invalid") && lower.includes("key") ||
    lower.includes("401") ||
    lower.includes("403") ||
    lower.includes("failed to initialize") ||
    lower.includes("empty response")
  );
}
