"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Copy, Home, MessageSquare } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/context/locale-context";
import type { ContentAreaId } from "@/lib/bible/content-areas";
import type { RetrievedPassage } from "@/lib/bible/types";
import {
  fetchPoolIndex,
  resolveAreaPoolVerses,
} from "@/lib/bible/resolve-hourly-verse.client";
import { cn } from "@/lib/utils";

interface AreaRow {
  id: ContentAreaId;
  count: number;
  labelEn: string;
  labelSw: string;
  kind: string;
}

function AreaButton({
  area,
  label,
  verseLabel,
  onSelect,
}: {
  area: AreaRow;
  label: string;
  verseLabel: string;
  onSelect: (area: AreaRow) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(area)}
      className={cn(
        "flex min-h-[44px] w-full flex-col items-start justify-center rounded-xl border border-border/50 bg-card/60 px-3 py-2.5 text-left transition-colors",
        "hover:border-brand/40 hover:bg-brand/5 active:scale-[0.98]",
      )}
    >
      <span className="text-sm font-semibold text-foreground">{label}</span>
      <span className="mt-0.5 text-[10px] text-muted-foreground">{verseLabel}</span>
    </button>
  );
}

function PoolVerseCard({
  passage,
  copied,
  onCopy,
  copyLabel,
  copiedLabel,
}: {
  passage: RetrievedPassage;
  copied: boolean;
  onCopy: () => void;
  copyLabel: string;
  copiedLabel: string;
}) {
  return (
    <div className="knowledge-card rounded-xl px-3.5 py-3 text-left sm:px-4 sm:py-3.5">
      <div className="flex items-start justify-between gap-2">
        <p className="font-heading text-sm font-semibold leading-snug text-brand-light sm:text-base">
          {passage.ref}
          {passage.refEn && passage.refEn !== passage.ref ? (
            <span className="ml-1 block text-[10px] font-normal text-muted-foreground sm:inline sm:text-xs">
              ({passage.refEn})
            </span>
          ) : null}
        </p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onCopy}
          className="h-7 shrink-0 gap-1 px-1.5 text-[10px] text-muted-foreground"
        >
          {copied ? (
            <Check className="h-3 w-3 text-brand" />
          ) : (
            <Copy className="h-3 w-3" />
          )}
          {copied ? copiedLabel : copyLabel}
        </Button>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-foreground/95">{passage.text}</p>
    </div>
  );
}

export function AreasView() {
  const { locale, t } = useLocale();
  const [areas, setAreas] = useState<AreaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<AreaRow | null>(null);
  const [verses, setVerses] = useState<RetrievedPassage[]>([]);
  const [versesLoading, setVersesLoading] = useState(false);
  const [copiedRef, setCopiedRef] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      try {
        const data = await fetchPoolIndex();
        if (!cancelled) setAreas(data as AreaRow[]);
      } catch {
        if (!cancelled) setAreas([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selected) {
      setVerses([]);
      return;
    }

    let cancelled = false;
    void (async () => {
      setVersesLoading(true);
      try {
        const res = await fetch(
          `/api/area-verses?area=${encodeURIComponent(selected.id)}&locale=${locale}`,
          { cache: "no-store" },
        );
        if (res.ok) {
          const payload = (await res.json()) as { verses?: RetrievedPassage[] };
          if (!cancelled && payload.verses?.length) {
            setVerses(payload.verses);
            return;
          }
        }

        const data = await resolveAreaPoolVerses(selected.id, locale);
        if (!cancelled) setVerses(data);
      } catch {
        if (!cancelled) setVerses([]);
      } finally {
        if (!cancelled) setVersesLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selected, locale]);

  const themes = useMemo(
    () => areas.filter((a) => a.kind === "theme"),
    [areas],
  );
  const topics = useMemo(
    () => areas.filter((a) => a.kind === "topic"),
    [areas],
  );
  const totalVerses = useMemo(
    () => areas.reduce((sum, a) => sum + a.count, 0),
    [areas],
  );

  const label = useCallback(
    (area: AreaRow) => (locale === "sw" ? area.labelSw : area.labelEn),
    [locale],
  );

  const copyVerse = useCallback(async (passage: RetrievedPassage) => {
    const refLabel =
      passage.refEn && passage.refEn !== passage.ref
        ? `${passage.ref} (${passage.refEn})`
        : passage.ref;
    try {
      await navigator.clipboard.writeText(`${refLabel}\n${passage.text}`);
      setCopiedRef(passage.ref);
      window.setTimeout(() => setCopiedRef(null), 2000);
    } catch {
      /* clipboard unavailable */
    }
  }, []);

  const copyAll = useCallback(async () => {
    if (verses.length === 0 || !selected) return;
    const title = label(selected);
    const body = verses
      .map((p) => {
        const refLabel =
          p.refEn && p.refEn !== p.ref ? `${p.ref} (${p.refEn})` : p.ref;
        return `${refLabel}\n${p.text}`;
      })
      .join("\n\n---\n\n");
    try {
      await navigator.clipboard.writeText(`${title}\n\n${body}`);
      setCopiedAll(true);
      window.setTimeout(() => setCopiedAll(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  }, [verses, selected, label]);


  return (
    <div className="canvas-gradient flex h-dvh min-h-0 flex-col overflow-hidden supports-[height:100dvh]:h-dvh">
      <AppHeader aiReady showNav compactNav hideStatusOnMobile />

      <main className="mx-auto flex min-h-0 w-full max-w-3xl flex-1 flex-col px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 sm:px-4">
        <div className="shrink-0 text-center">
          {selected ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="inline-flex h-8 shrink-0 items-center gap-1 rounded-lg border border-border/50 px-2 text-xs font-medium text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                {t("areasBack")}
              </button>
              <h1 className="min-w-0 flex-1 truncate font-heading text-lg font-semibold sm:text-xl">
                {label(selected)}
              </h1>
            </div>
          ) : (
            <h1 className="font-heading text-lg font-semibold sm:text-xl">
              {t("areasTitle")}
            </h1>
          )}
          <p className="mt-0.5 text-[10px] leading-snug text-muted-foreground sm:text-xs">
            {selected ? t("areasShowing", { count: verses.length }) : t("areasSubtitle")}
          </p>
          {!loading && !selected && areas.length > 0 ? (
            <>
              <p className="mt-1 text-[10px] font-medium text-brand-light sm:text-xs">
                {t("areasTotal", {
                  areas: areas.length,
                  verses: totalVerses.toLocaleString(),
                })}
              </p>
              <p className="mt-0.5 text-[10px] text-muted-foreground">
                {t("areasBrowseHint")}
              </p>
            </>
          ) : null}
        </div>

        <div className="mt-3 min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {loading ? (
            <p className="text-center text-xs text-muted-foreground">
              {t("homeLoading")}
            </p>
          ) : selected ? (
            <div className="space-y-3 pb-2">
              {versesLoading ? (
                <p className="text-center text-xs text-muted-foreground">
                  {t("homeLoading")}
                </p>
              ) : verses.length === 0 ? (
                <p className="text-center text-xs text-muted-foreground">
                  {t("homeVerseUnavailable")}
                </p>
              ) : (
                <>
                  <div className="flex justify-center">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => void copyAll()}
                      className="h-8 gap-1 text-xs text-muted-foreground"
                    >
                      {copiedAll ? (
                        <Check className="h-3.5 w-3.5 text-brand" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                      {copiedAll ? t("historyCopiedAll") : t("historyCopyAll")}
                    </Button>
                  </div>
                  {verses.map((passage, index) => (
                    <PoolVerseCard
                      key={`${passage.ref}-${index}`}
                      passage={passage}
                      copied={copiedRef === passage.ref}
                      onCopy={() => void copyVerse(passage)}
                      copyLabel={t("copy")}
                      copiedLabel={t("copied")}
                    />
                  ))}
                </>
              )}
            </div>
          ) : (
            <div className="space-y-4 pb-2">
              <section>
                <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {t("areasThemes")} ({themes.length})
                </h2>
                <ul className="grid gap-2 sm:grid-cols-2">
                  {themes.map((area) => (
                    <li key={area.id}>
                      <AreaButton
                        area={area}
                        label={label(area)}
                        verseLabel={t("areasVerses", { count: area.count })}
                        onSelect={setSelected}
                      />
                    </li>
                  ))}
                </ul>
              </section>

              <section>
                <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {t("areasTopics")} ({topics.length})
                </h2>
                <ul className="grid gap-2 sm:grid-cols-2">
                  {topics.map((area) => (
                    <li key={area.id}>
                      <AreaButton
                        area={area}
                        label={label(area)}
                        verseLabel={t("areasVerses", { count: area.count })}
                        onSelect={setSelected}
                      />
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          )}
        </div>

        {!selected && (
          <div className="mt-2 shrink-0 flex justify-center gap-2 pt-1">
            <Link
              href="/home"
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-brand/30 px-3 text-xs font-medium"
            >
              <Home className="h-3.5 w-3.5" />
              {t("navHome")}
            </Link>
            <Link
              href="/"
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border/50 px-3 text-xs font-medium text-muted-foreground"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              {t("navChat")}
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
