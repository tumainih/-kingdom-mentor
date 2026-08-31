export function formatOpenAIError(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err);

  if (raw.includes("429") || raw.includes("no credits") || raw.includes("insufficient_quota")) {
    return "Your OpenAI account has no credits left. Add billing at platform.openai.com/settings/organization/billing";
  }
  if (raw.includes("401") || raw.includes("invalid_api_key")) {
    return "Invalid OpenAI API key. Check OPENAI_API_KEY in .env.local";
  }
  if (raw.includes("rate_limit")) {
    return "OpenAI rate limit reached. Please wait a moment and try again.";
  }

  return raw.length > 200 ? `${raw.slice(0, 200)}…` : raw;
}
