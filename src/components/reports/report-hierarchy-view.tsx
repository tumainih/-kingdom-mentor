"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/context/locale-context";
import {
  buildDayDrillBlocks,
  buildMonthCells,
  buildYearCells,
  firstWeekdayOffset,
  trackingYears,
  type ScaleCell,
} from "@/lib/reading/report-hierarchy";
import type { DevelopmentReport, ReadEvent } from "@/lib/reading/types";
import { slotStartMs } from "@/lib/reading/slots";
import { ScaleBox, ScaleBoxRow } from "@/components/reports/scale-box";
import { cn } from "@/lib/utils";

type DrillLevel = "12h" | "6h" | "3h" | "1h";

interface DrillFrame {
  level: DrillLevel;
  start: number;
  end: number;
}

type NavState =
  | { view: "year"; year: number }
  | { view: "month"; year: number; month: number }
  | { view: "day"; day: string; year: number; month: number; drillStack: DrillFrame[] };

interface ReportHierarchyViewProps {
  events: ReadEvent[];
  reports: DevelopmentReport[];
  startedAt: number | null;
  timezone: string;
  onSelectCell: (cell: ScaleCell, report?: DevelopmentReport) => void;
}

export function cellToReport(
  reports: DevelopmentReport[],
  cell: ScaleCell,
): DevelopmentReport | undefined {
  return reports.find(
    (r) =>
      Math.abs(r.periodStart - cell.start) < 120_000 &&
      Math.abs(r.periodEnd - cell.end) < 120_000 &&
      (cell.reportUnit ? r.unit === cell.reportUnit : r.unit === cell.unit || r.unit === cell.reportUnit),
  );
}

function dayEndMs(day: string, timezone: string): number {
  const probe = slotStartMs(day, 12, timezone) + 36 * 3_600_000;
  const nextDay = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(probe));
  return slotStartMs(nextDay, 0, timezone);
}

export function ReportHierarchyView({
  events,
  reports,
  startedAt,
  timezone,
  onSelectCell,
}: ReportHierarchyViewProps) {
  const { locale, t } = useLocale();
  const now = Date.now();

  const years = useMemo(
    () => (startedAt ? trackingYears(startedAt, timezone, now) : [new Date().getFullYear()]),
    [startedAt, timezone, now],
  );

  const [nav, setNav] = useState<NavState>({
    view: "year",
    year: years[0] ?? new Date().getFullYear(),
  });

  const yearData = useMemo(() => {
    if (nav.view !== "year") return null;
    return buildYearCells(nav.year, events, timezone, now, locale);
  }, [nav, events, timezone, now, locale]);

  const monthData = useMemo(() => {
    if (nav.view === "year") return null;
    const year = nav.year;
    const month = nav.month;
    return buildMonthCells(year, month, events, timezone, now, locale);
  }, [nav, events, timezone, now, locale]);

  const dayCell = useMemo(() => {
    if (nav.view !== "day" || !monthData) return null;
    return monthData.days.find((d) => d.id === `day:${nav.day}`) ?? null;
  }, [nav, monthData]);

  const activeDrill = nav.view === "day" ? nav.drillStack.at(-1) : undefined;

  const drillCells = useMemo(() => {
    if (nav.view !== "day" || !activeDrill) return [];
    return buildDayDrillBlocks(
      slotStartMs(nav.day, 0, timezone),
      dayEndMs(nav.day, timezone),
      events,
      timezone,
      now,
      activeDrill.level,
      activeDrill.start,
      activeDrill.end,
    );
  }, [nav, activeDrill, events, timezone, now]);

  const openCell = (cell: ScaleCell) => {
    onSelectCell(cell, cellToReport(reports, cell));
  };

  const goBack = () => {
    if (nav.view === "day") {
      if (nav.drillStack.length > 0) {
        setNav({ ...nav, drillStack: nav.drillStack.slice(0, -1) });
        return;
      }
      setNav({ view: "month", year: nav.year, month: nav.month });
      return;
    }
    if (nav.view === "month") {
      setNav({ view: "year", year: nav.year });
    }
  };

  const breadcrumb = () => {
    if (nav.view === "year") return String(nav.year);
    if (nav.view === "month") {
      return new Intl.DateTimeFormat(locale === "sw" ? "sw-KE" : "en-US", {
        month: "long",
        year: "numeric",
      }).format(new Date(nav.year, nav.month - 1, 1));
    }
    const parts = [nav.day];
    for (const frame of nav.drillStack) parts.push(frame.level);
    return parts.join(" › ");
  };

  const expandDay = () => {
    if (nav.view !== "day" || !dayCell) return;
    setNav({
      ...nav,
      drillStack: [{ level: "12h", start: dayCell.start, end: dayCell.end }],
    });
  };

  const drillInto = (cell: ScaleCell) => {
    if (nav.view !== "day" || !activeDrill) return;
    const next: DrillLevel | null =
      activeDrill.level === "12h" ? "6h" : activeDrill.level === "6h" ? "3h" : activeDrill.level === "3h" ? "1h" : null;
    if (!next) {
      openCell(cell);
      return;
    }
    setNav({
      ...nav,
      drillStack: [...nav.drillStack, { level: next, start: cell.start, end: cell.end }],
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {nav.view !== "year" ? (
          <Button type="button" variant="ghost" size="sm" className="h-7 gap-1 px-2 text-xs" onClick={goBack}>
            <ArrowLeft className="h-3.5 w-3.5" />
            {t("reportBack")}
          </Button>
        ) : null}
        {years.length > 1 && nav.view === "year" ? (
          <div className="flex flex-wrap gap-1">
            {years.map((y) => (
              <button
                key={y}
                type="button"
                onClick={() => setNav({ view: "year", year: y })}
                className={cn(
                  "rounded-md px-2 py-0.5 text-[10px] font-semibold",
                  nav.year === y ? "bg-brand text-primary-foreground" : "bg-muted/50 text-muted-foreground",
                )}
              >
                {y}
              </button>
            ))}
          </div>
        ) : null}
        <p className="flex min-w-0 flex-1 items-center gap-1 truncate text-[10px] text-muted-foreground">
          <ChevronRight className="h-3 w-3 shrink-0 opacity-50" />
          {breadcrumb()}
        </p>
      </div>

      {nav.view === "year" && yearData ? (
        <>
          <section className="rounded-xl border border-border/50 bg-card/40 p-3">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              {t("reportYear")}
            </p>
            <ScaleBox cell={yearData.year} className="min-h-[3rem] w-full text-sm" onClick={() => openCell(yearData.year)} />
          </section>

          <section className="rounded-xl border border-border/50 bg-card/40 p-3">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              {t("reportHalfYear")}
            </p>
            <ScaleBoxRow cells={yearData.halves} columns={2} onSelect={openCell} />
          </section>

          <section className="rounded-xl border border-border/50 bg-card/40 p-3">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              {t("reportQuarter")}
            </p>
            <ScaleBoxRow cells={yearData.quarters} columns={4} onSelect={openCell} />
          </section>

          <section className="rounded-xl border border-border/50 bg-card/40 p-3">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              {t("reportMonthsGrid")}
            </p>
            <div className="grid grid-cols-4 gap-1.5">
              {yearData.months.map((cell) => (
                <ScaleBox
                  key={cell.id}
                  cell={cell}
                  onClick={() => {
                    const month = Number(cell.id.split("-")[1]);
                    setNav({ view: "month", year: nav.year, month });
                  }}
                />
              ))}
            </div>
          </section>
        </>
      ) : null}

      {nav.view === "month" && monthData ? (
        <>
          <section className="rounded-xl border border-border/50 bg-card/40 p-3">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              {t("reportMonth")}
            </p>
            <ScaleBox cell={monthData.month} className="min-h-[3rem] w-full" onClick={() => openCell(monthData.month)} />
          </section>

          {monthData.weeks.length > 0 ? (
            <section className="rounded-xl border border-border/50 bg-card/40 p-3">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                {t("reportWeek")}
              </p>
              <ScaleBoxRow
                cells={monthData.weeks}
                columns={Math.min(4, monthData.weeks.length)}
                compact
                onSelect={openCell}
              />
            </section>
          ) : null}

          <section className="rounded-xl border border-border/50 bg-card/40 p-3">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              {t("reportDays")}
            </p>
            <div className="mb-1 grid grid-cols-7 gap-0.5 text-center text-[8px] text-muted-foreground">
              {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                <span key={`${d}-${i}`}>{d}</span>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: firstWeekdayOffset(nav.year, nav.month, timezone) }).map((_, i) => (
                <div key={`pad-${i}`} />
              ))}
              {monthData.days.map((cell) => (
                <ScaleBox
                  key={cell.id}
                  cell={cell}
                  compact
                  onClick={() => {
                    const day = cell.id.replace("day:", "");
                    setNav({
                      view: "day",
                      day,
                      year: nav.year,
                      month: nav.month,
                      drillStack: [],
                    });
                  }}
                />
              ))}
            </div>
          </section>
        </>
      ) : null}

      {nav.view === "day" && dayCell ? (
        <>
          <section className="rounded-xl border border-border/50 bg-card/40 p-3">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              {t("reportDay")} · {nav.day}
            </p>
            <ScaleBox
              cell={dayCell}
              className="min-h-[3rem] w-full"
              selected={nav.drillStack.length === 0}
              onClick={() => {
                if (nav.drillStack.length === 0) expandDay();
                else openCell(dayCell);
              }}
            />
            <p className="mt-2 text-[10px] text-muted-foreground">
              {nav.drillStack.length === 0 ? t("reportDrillHint") : t("reportComposition")}
            </p>
          </section>

          {activeDrill ? (
            <section className="rounded-xl border border-border/50 bg-card/40 p-3">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                {activeDrill.level} · {t("reportComposition")}
              </p>
              <ScaleBoxRow
                cells={drillCells}
                columns={activeDrill.level === "1h" ? 3 : activeDrill.level === "3h" ? 2 : 2}
                onSelect={drillInto}
              />
            </section>
          ) : null}
        </>
      ) : null}

      <p className="text-center text-[9px] leading-snug text-muted-foreground">{t("reportTapExpand")}</p>
    </div>
  );
}
