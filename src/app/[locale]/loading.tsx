import {useTranslations} from "next-intl";

export default function Loading() {
  const t = useTranslations("Loading");

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#fafaf5] px-6 py-12">
      <div className="flex items-center gap-3 rounded-full border border-[#d7d8d1] bg-white px-5 py-2 text-sm font-semibold text-[#23422a] shadow-[0_8px_18px_rgba(26,28,25,0.04)]">
        <span
          aria-hidden
          className="h-3 w-3 animate-pulse rounded-full bg-[#23422a]"
        />
        <span>{t("default")}</span>
      </div>
    </main>
  );
}
