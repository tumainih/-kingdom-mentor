"use client";

import Link from "next/link";
import { Shield } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { useLocale } from "@/context/locale-context";

export function PrivacyPolicyView() {
  const { t } = useLocale();

  return (
    <div className="canvas-gradient flex h-dvh min-h-0 flex-col overflow-hidden supports-[height:100dvh]:h-dvh">
      <AppHeader showNav compactNav hideStatusOnMobile />

      <main className="mx-auto min-h-0 w-full max-w-lg flex-1 overflow-y-auto overscroll-contain px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2">
        <div className="text-center">
          <Shield className="mx-auto h-8 w-8 text-brand" />
          <h1 className="mt-2 font-heading text-xl font-semibold">{t("privacyTitle")}</h1>
          <p className="mt-1 text-xs text-muted-foreground">{t("privacyUpdated")}</p>
        </div>

        <article className="prose prose-sm mt-6 max-w-none text-left text-sm leading-relaxed text-muted-foreground [&_h2]:mt-6 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-foreground [&_p]:mt-2">
          <h2>{t("privacySection1Title")}</h2>
          <p>{t("privacySection1Body")}</p>

          <h2>{t("privacySection2Title")}</h2>
          <p>{t("privacySection2Body")}</p>

          <h2>{t("privacySection3Title")}</h2>
          <p>{t("privacySection3Body")}</p>

          <h2>{t("privacySection4Title")}</h2>
          <p>{t("privacySection4Body")}</p>

          <h2>{t("privacySection5Title")}</h2>
          <p>{t("privacySection5Body")}</p>
        </article>

        <div className="mt-8 flex justify-center pb-4">
          <Link
            href="/home"
            className="inline-flex h-9 items-center rounded-lg border border-brand/30 px-4 text-sm font-medium"
          >
            {t("navHome")}
          </Link>
        </div>
      </main>
    </div>
  );
}
