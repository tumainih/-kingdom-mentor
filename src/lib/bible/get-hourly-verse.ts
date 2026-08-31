import type { BibleLocale } from "./locale";
import { getSlotForHour, themeLabel, type HourlyThemeId } from "./hourly-themes";
import { lookupVerseReference } from "./verse-lookup";
import type { RetrievedPassage } from "./types";

export interface HourlyVerseResult {
  hour: number;
  theme: HourlyThemeId;
  themeLabel: string;
  scheduledRef: string;
  passage: RetrievedPassage | null;
}

export async function getHourlyVerse(
  locale: BibleLocale,
  hour?: number,
): Promise<HourlyVerseResult> {
  const resolvedHour =
    hour ?? new Date().getHours();
  const slot = getSlotForHour(resolvedHour);
  const { passages } = await lookupVerseReference(slot.ref, locale);

  return {
    hour: slot.hour,
    theme: slot.theme,
    themeLabel: themeLabel(slot.theme, locale),
    scheduledRef: slot.ref,
    passage: passages[0] ?? null,
  };
}
