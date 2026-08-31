export function formatAIError(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err);

  if (raw.includes("429") || raw.includes("RESOURCE_EXHAUSTED") || raw.includes("quota")) {
    return "Gemini API quota exceeded. Check your Google AI billing or try again later.";
  }
  if (raw.includes("401") || raw.includes("403") || raw.includes("API key not valid")) {
    return "Invalid Gemini API key. Check GEMINI_API_KEY in .env.local";
  }
  if (raw.includes("404") || raw.includes("not found")) {
    return "Gemini model not found. Try GEMINI_MODEL=gemini-3.6-flash in .env.local";
  }
  if (raw.includes("Failed to parse stream") || raw.includes("parse stream")) {
    return "Connection interrupted while Kingdom AI was responding. Tap the mic and try again.";
  }

  return raw.length > 220 ? `${raw.slice(0, 220)}…` : raw;
}
