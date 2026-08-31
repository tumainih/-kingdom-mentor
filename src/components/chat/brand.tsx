"use client";

import { BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

interface BrandLogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizes = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-12 w-12 sm:h-14 sm:w-14",
};

const iconSizes = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-6 w-6 sm:h-7 sm:w-7",
};

export function BrandLogo({ size = "md", className }: BrandLogoProps) {
  return (
    <div
      className={cn(
        "brand-gradient flex shrink-0 items-center justify-center rounded-xl text-white shadow-md shadow-brand/20",
        sizes[size],
        className,
      )}
    >
      <BookOpen className={iconSizes[size]} strokeWidth={2.2} />
    </div>
  );
}

interface BrandTitleProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function BrandTitle({ size = "md", className }: BrandTitleProps) {
  const textSizes = {
    sm: "text-base",
    md: "text-lg",
    lg: "text-3xl sm:text-4xl",
  };

  const badgeSizes = {
    sm: "text-[10px] px-1.5 py-0.5",
    md: "text-[11px] px-2 py-0.5",
    lg: "text-xs sm:text-sm px-2.5 py-1",
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span
        className={cn(
          "font-heading font-semibold tracking-tight text-foreground",
          textSizes[size],
        )}
      >
        Kingdom
      </span>
      <span
        className={cn(
          "gold-accent-gradient rounded-md font-bold uppercase tracking-wider text-white shadow-sm",
          badgeSizes[size],
        )}
      >
        AI
      </span>
    </div>
  );
}
