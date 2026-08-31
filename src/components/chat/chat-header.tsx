"use client";

import { BrandLogo, BrandTitle } from "./brand";

export function ChatHeader() {
  return (
    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center justify-center border-b border-border/70 bg-background/85 backdrop-blur-md">
      <div className="flex items-center gap-2.5">
        <BrandLogo size="sm" />
        <BrandTitle size="md" />
        <span className="ml-1 hidden rounded-full border border-brand/20 bg-brand/5 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-brand sm:inline">
          Scripture AI
        </span>
      </div>
    </header>
  );
}
