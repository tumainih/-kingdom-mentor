"use client";

export function ChatHeader() {
  return (
    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center justify-center border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-foreground text-background">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="h-3.5 w-3.5"
            aria-hidden="true"
          >
            <path
              d="M12 2L14.5 9.5H22L16 14L18.5 21.5L12 17L5.5 21.5L8 14L2 9.5H9.5L12 2Z"
              fill="currentColor"
            />
          </svg>
        </div>
        <h1 className="text-[17px] font-semibold tracking-tight text-foreground">
          Kingdom AI
        </h1>
      </div>
    </header>
  );
}
