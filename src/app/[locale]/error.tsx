"use client";

import * as React from "react";

import {useLocale, useTranslations} from "next-intl";
import Link from "next/link";

export default function LocaleError({
  error,
  reset,
}: {
  error: Error & {digest?: string};
  reset: () => void;
}) {
  const t = useTranslations("Error.runtime");
  const locale = useLocale();

  React.useEffect(() => {
    console.error("[locale-error]", error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#fafaf5] px-6 py-12">
      <div className="max-w-[480px] rounded-[24px] border border-[#d7d8d1] bg-white px-9 py-10 text-center shadow-[0_18px_40px_rgba(26,28,25,0.06)]">
        <div className="text-[11px] font-black uppercase tracking-[0.28em] text-[#23422a]">
          JaminView
        </div>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-[#1a1c19]">
          {t("title")}
        </h1>
        <p className="mt-4 text-sm leading-7 text-[#727971]">
          {t("description")}
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="rounded-xl border border-[#23422a] bg-[#23422a] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#31583b]"
          >
            {t("retry")}
          </button>
          <Link
            href={`/${locale}`}
            className="rounded-xl border border-[#d7d8d1] bg-white px-4 py-2 text-sm font-semibold text-[#23422a] transition-colors hover:bg-[#f7f8f2]"
          >
            {t("backHome")}
          </Link>
        </div>
      </div>
    </main>
  );
}
