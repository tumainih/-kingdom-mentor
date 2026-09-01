import type { BibleLocale } from "./locale";
import { getSlotForHour, themeLabel, type HourlyThemeId } from "./hourly-themes";
import { localDateString } from "./pool-seed";
import type { RetrievedPassage } from "./types";
import {
  getPoolCount,
  pickHourlyRef,
  resolvePoolRef,
} from "./verse-pools.server";

export interface HourlyVerseResult {
  hour: number;
  theme: HourlyThemeId;
  themeLabel: string;
  scheduledRef: string;
  date: string;
  poolSize: number;
  passage: RetrievedPassage | null;
}

export async function getHourlyVerse(
  locale: BibleLocale,
  hour?: number,
  date?: string,
): Promise<HourlyVerseResult> {
  const resolvedHour = hour ?? new Date().getHours();
  const resolvedDate = date ?? localDateString();
  const slot = getSlotForHour(resolvedHour);
  const scheduledRef =
    pickHourlyRef(slot.theme, resolvedDate, slot.hour) ?? slot.ref;
  const passage = await resolvePoolRef(scheduledRef, locale);

  return {
    hour: slot.hour,
    theme: slot.theme,
    themeLabel: themeLabel(slot.theme, locale),
    scheduledRef,
    date: resolvedDate,
    poolSize: getPoolCount(slot.theme),
    passage,
  };
}
