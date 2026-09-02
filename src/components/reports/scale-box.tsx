"use client";

import { cn } from "@/lib/utils";
import type { ScaleCell } from "@/lib/reading/report-hierarchy";

interface ScaleBoxProps {
  cell: ScaleCell;
  onClick?: () => void;
  selected?: boolean;
  compact?: boolean;
  className?: string;
  showRate?: boolean;
}

export function ScaleBox({
  cell,
  onClick,
  selected,
  compact,
  className,
  showRate = true,
}: ScaleBoxProps) {
  const interactive = Boolean(onClick) && cell.finished;

  return (
    <button
      type="button"
      disabled={!interactive}
      onClick={onClick}
      title={
        cell.finished
          ? `${cell.label} · ${cell.eventCount} · ${cell.avgRate}`
          : cell.label
      }
      className={cn(
        "relative flex flex-col items-center justify-center rounded-md border text-center transition-transform",
        compact ? "min-h-[2rem] px-1 py-0.5 text-[9px]" : "min-h-[2.75rem] px-1.5 py-1 text-[10px]",
        cell.finished ? "border-border/40 font-semibold text-foreground/90" : "border-border/20 text-muted-foreground/50",
        interactive && "cursor-pointer hover:scale-[1.03] active:scale-[0.98]",
        !interactive && "cursor-default",
        selected && "ring-2 ring-brand ring-offset-1 ring-offset-background",
        className,
      )}
      style={{
        backgroundColor: cell.finished ? cell.color : undefined,
        opacity: cell.finished ? 1 : 0.35,
      }}
    >
      <span className="leading-tight">{cell.label}</span>
      {showRate && cell.finished && cell.eventCount > 0 ? (
        <span className="mt-0.5 text-[8px] font-bold opacity-80">{cell.avgRate}</span>
      ) : null}
    </button>
  );
}

interface ScaleBoxRowProps {
  cells: ScaleCell[];
  onSelect?: (cell: ScaleCell) => void;
  selectedId?: string;
  compact?: boolean;
  columns?: number;
}

export function ScaleBoxRow({
  cells,
  onSelect,
  selectedId,
  compact,
  columns,
}: ScaleBoxRowProps) {
  return (
    <div
      className="grid gap-1.5"
      style={{ gridTemplateColumns: `repeat(${columns ?? cells.length}, minmax(0, 1fr))` }}
    >
      {cells.map((cell) => (
        <ScaleBox
          key={cell.id}
          cell={cell}
          compact={compact}
          selected={selectedId === cell.id}
          onClick={onSelect && cell.finished ? () => onSelect(cell) : undefined}
        />
      ))}
    </div>
  );
}
