"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { offlineNavigate } from "@/lib/pwa/offline-nav";

type AppLinkProps = ComponentProps<typeof Link>;

/** Internal link that falls back to a full page load when offline (SW precache). */
export function AppLink({ href, onClick, ...props }: AppLinkProps) {
  const path =
    typeof href === "string"
      ? href
      : typeof href.pathname === "string"
        ? href.pathname
        : "/";

  return (
    <Link
      href={href}
      onClick={(event) => {
        offlineNavigate(path, event);
        onClick?.(event);
      }}
      {...props}
    />
  );
}
