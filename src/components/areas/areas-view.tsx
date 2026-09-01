"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Home, MessageSquare } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { useLocale } from "@/context/locale-context";
import { fetchPoolIndex } from "@/lib/bible/resolve-hourly-verse.client";

interface AreaRow {
  id: string;
  count: number;
  labelEn: string;
  labelSw: string;
  kind: string;
}

export function AreasView() {
  const { locale, t } = useLocale();
  const [areas, setAreas] = useState<AreaRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      const data = await fetchPoolIndex();
      if (!cancelled) {
        setAreas(data);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

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

  const label = (area: AreaRow) =>
    locale === "sw" ? area.labelSw : area.labelEn;

  return (
    <div className="canvas-gradient flex h-dvh min-h-0 flex-col overflow-hidden supports-[height:100dvh]:h-dvh">
      <AppHeader aiReady showNav compactNav hideStatusOnMobile />

      <main className="mx-auto flex min-h-0 w-full max-w-3xl flex-1 flex-col px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 sm:px-4">
        <div className="shrink-0 text-center">
          <h1 className="font-heading text-lg font-semibold sm:text-xl">
            {t("areasTitle")}
          </h1>
          <p className="mt-0.5 text-[10px] leading-snug text-muted-foreground sm:text-xs">
            {t("areasSubtitle")}
          </p>
          {!loading && areas.length > 0 ? (
            <p className="mt-1 text-[10px] font-medium text-brand-light sm:text-xs">
              {t("areasTotal", {
                areas: areas.length,
                verses: totalVerses.toLocaleString(),
              })}
            </p>
          ) : null}
        </div>

        <div className="mt-3 min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {loading ? (
            <p className="text-center text-xs text-muted-foreground">
              {t("homeLoading")}
            </p>
          ) : (
            <div className="space-y-4 pb-2">
              <section>
                <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {t("areasThemes")} ({themes.length})
                </h2>
                <ul className="grid gap-1.5 sm:grid-cols-2">
                  {themes.map((area) => (
                    <li
                      key={area.id}
                      className="flex items-center justify-between rounded-lg border border-border/50 bg-card/60 px-3 py-2"
                    >
                      <span className="text-sm font-medium">{label(area)}</span>
                      <span className="text-[11px] text-muted-foreground">
                        {t("areasVerses", { count: area.count })}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>

              <section>
                <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {t("areasTopics")} ({topics.length})
                </h2>
                <ul className="grid gap-1.5 sm:grid-cols-2">
                  {topics.map((area) => (
                    <li
                      key={area.id}
                      className="flex items-center justify-between rounded-lg border border-border/50 bg-card/60 px-3 py-2"
                    >
                      <span className="text-sm font-medium">{label(area)}</span>
                      <span className="text-[11px] text-muted-foreground">
                        {t("areasVerses", { count: area.count })}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          )}
        </div>

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
      </main>
    </div>
  );
}
