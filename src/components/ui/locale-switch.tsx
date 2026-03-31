"use client";

import {useEffect, useMemo, useRef, useState, useTransition} from "react";
import {useLocale} from "next-intl";
import {Check, ChevronDown, Languages} from "lucide-react";
import {usePathname as useBrowserPathname} from "next/navigation";

import {useRouter} from "@/i18n/navigation";
import {routing} from "@/i18n/routing";

type LocaleSwitchProps = {
  variant?: "light" | "dark";
};

const LOCALE_LABELS: Record<string, {short: string; long: string}> = {
  "zh-CN": {short: "中", long: "简体中文"},
  en: {short: "EN", long: "English"},
};

export function LocaleSwitch({variant = "light"}: LocaleSwitchProps) {
  const locale = useLocale();
  const pathname = useBrowserPathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const styles = useMemo(() => {
    if (variant === "dark") {
      return {
        trigger:
          "border border-white/12 bg-white/6 text-white/88 backdrop-blur-md hover:bg-white/10",
        icon: "text-white/70",
        menu: "border border-white/12 bg-[#102016]/96 shadow-[0_20px_60px_rgba(0,0,0,0.35)]",
        item: "text-white/78 hover:bg-white/8 hover:text-white",
        active: "bg-white/10 text-white",
        subtext: "text-white/48",
      };
    }

    return {
      trigger:
        "border border-[#c2c8bf]/40 bg-[#f4f4ef] text-[#23422a] hover:bg-[#eeeee9]",
      icon: "text-[#727971]",
      menu:
        "border border-[#c2c8bf]/40 bg-[#fafaf5] shadow-[0_18px_48px_rgba(26,28,25,0.12)]",
      item: "text-[#424842] hover:bg-[#f4f4ef] hover:text-[#23422a]",
      active: "bg-white text-[#23422a]",
      subtext: "text-[#727971]",
    };
  }, [variant]);

  const currentLabel = LOCALE_LABELS[locale] ?? {short: locale, long: locale};
  const internalPathname = stripLocalePrefix(pathname);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={isPending}
        onClick={() => setOpen((value) => !value)}
        className={`inline-flex h-10 w-[108px] items-center gap-2 rounded-full px-3 transition-all ${styles.trigger} ${
          isPending ? "opacity-70" : ""
        }`}
      >
        <Languages className={`h-4 w-4 shrink-0 ${styles.icon}`} strokeWidth={1.9} />
        <span className="text-[11px] font-bold uppercase tracking-[0.18em]">
          {currentLabel.short}
        </span>
        <ChevronDown
          className={`ml-auto h-4 w-4 shrink-0 transition-transform ${styles.icon} ${
            open ? "rotate-180" : ""
          }`}
          strokeWidth={1.9}
        />
      </button>

      {open ? (
        <div
          role="listbox"
          className={`absolute right-0 top-[calc(100%+0.5rem)] z-50 w-[108px] rounded-2xl p-1.5 ${styles.menu}`}
        >
          {routing.locales.map((nextLocale) => {
            const active = locale === nextLocale;
            const labels = LOCALE_LABELS[nextLocale] ?? {short: nextLocale, long: nextLocale};

            return (
              <button
                key={nextLocale}
                type="button"
                role="option"
                aria-selected={active}
                disabled={isPending}
                onClick={() => {
                  if (active) {
                    setOpen(false);
                    return;
                  }

                  startTransition(() => {
                    setOpen(false);
                    router.replace(internalPathname, {locale: nextLocale});
                  });
                }}
                className={`flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left transition-all ${
                  active ? styles.active : styles.item
                }`}
              >
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="text-[11px] font-bold uppercase tracking-[0.18em]">
                    {labels.short}
                  </span>
                  <span className={`text-[10px] ${styles.subtext}`}>{labels.long}</span>
                </div>
                {active ? <Check className="h-4 w-4 shrink-0" strokeWidth={2.2} /> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function stripLocalePrefix(pathname: string | null) {
  if (!pathname) {
    return "/";
  }

  for (const locale of routing.locales) {
    if (pathname === `/${locale}`) {
      return "/";
    }

    if (pathname.startsWith(`/${locale}/`)) {
      return pathname.slice(locale.length + 1) || "/";
    }
  }

  return pathname;
}
