"use client";

import {Badge} from "@/components/ui/badge";
import type {ScreenConfig} from "@/lib/editor-storage";

type ScreenHeaderProps = {
  screenConfig: ScreenConfig;
  canvasLabel: string;
  fallbackMetaLabel: string;
};

export function ScreenHeader({screenConfig, canvasLabel, fallbackMetaLabel}: ScreenHeaderProps) {
  const variant = screenConfig.headerVariant ?? "classic";
  const badgeLabel = screenConfig.statusBadgeLabel || canvasLabel;
  const metaLabel = screenConfig.statusMetaLabel || fallbackMetaLabel;

  if (variant === "broadcast") {
    return (
      <div className="mb-4 rounded-[22px] border border-[#c2c8bf]/45 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(247,245,239,0.78))] px-5 py-4 shadow-[0_18px_42px_rgba(26,28,25,0.08)] backdrop-blur">
        <div className="flex items-start justify-between gap-6">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              {screenConfig.showStatusBadge ? (
                <Badge className="rounded border-[#c7ecca] bg-[#eff6ec] px-2 py-1 tracking-[0.12em] text-[#23422a]">
                  {badgeLabel}
                </Badge>
              ) : null}
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#727971]">{metaLabel}</span>
            </div>
            <div className="mt-3 flex items-center gap-3">
              <div className="h-8 w-[3px] rounded-full bg-[linear-gradient(180deg,#4a8058_0%,#9dc7a4_100%)]" />
              <div className="min-w-0">
                <h1 className="font-headline text-[27px] font-extrabold leading-none tracking-tight text-[#23422a]">
                  {screenConfig.title}
                </h1>
                {screenConfig.subtitle ? (
                  <p className="mt-2 truncate text-[10px] font-medium uppercase tracking-[0.24em] text-[#727971]">
                    {screenConfig.subtitle}
                  </p>
                ) : null}
              </div>
            </div>
          </div>
          <div className="flex shrink-0 items-stretch gap-3">
            {screenConfig.showTimestamp ? (
              <div className="rounded-2xl border border-[#d8ddd4]/70 bg-white/82 px-4 py-3 text-right shadow-[0_10px_24px_rgba(26,28,25,0.04)]">
                <div className="text-[11px] font-bold font-mono text-[#1a1c19]">{screenConfig.timeText}</div>
                <div className="mt-1 text-[9px] uppercase tracking-[0.16em] text-[#727971]">{screenConfig.dateText}</div>
              </div>
            ) : null}
            <div className="rounded-2xl border border-[#d8ddd4]/70 bg-white/82 px-4 py-3 shadow-[0_10px_24px_rgba(26,28,25,0.04)]">
              <div className="text-[9px] uppercase tracking-[0.18em] text-[#727971]">{screenConfig.rightMetaSecondary}</div>
              <div className="mt-2 text-[13px] font-bold text-[#1a1c19]">{screenConfig.rightMetaPrimary}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (variant === "signal") {
    return (
      <div className="mb-4 rounded-[24px] border border-[#9bc8a6]/30 bg-[radial-gradient(circle_at_100%_0%,rgba(140,197,150,0.14),transparent_28%),linear-gradient(180deg,rgba(18,33,23,0.96),rgba(20,34,24,0.92))] px-5 py-4 text-white shadow-[0_22px_50px_rgba(9,15,11,0.24)]">
        <div className="flex items-start justify-between gap-6">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              {screenConfig.showStatusBadge ? (
                <Badge className="rounded border-[#8cc596]/35 bg-[#84d197]/10 px-2 py-1 tracking-[0.12em] text-[#dcf4df]">
                  {badgeLabel}
                </Badge>
              ) : null}
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/55">{metaLabel}</span>
            </div>
            <h1 className="mt-3 font-headline text-[26px] font-extrabold leading-none tracking-tight text-white">
              {screenConfig.title}
            </h1>
            {screenConfig.subtitle ? (
              <p className="mt-2 text-[10px] font-medium uppercase tracking-[0.24em] text-white/55">{screenConfig.subtitle}</p>
            ) : null}
          </div>
          <div className="flex shrink-0 items-center gap-4">
            {screenConfig.showTimestamp ? (
              <div className="text-right">
                <div className="text-[11px] font-bold font-mono text-white">{screenConfig.timeText}</div>
                <div className="mt-1 text-[9px] uppercase tracking-[0.16em] text-white/55">{screenConfig.dateText}</div>
              </div>
            ) : null}
            <div className="h-12 w-px bg-white/12" />
            <div className="text-right">
              <div className="text-[10px] uppercase tracking-[0.16em] text-white/45">{screenConfig.rightMetaSecondary}</div>
              <div className="mt-1 text-[13px] font-bold text-white">{screenConfig.rightMetaPrimary}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (variant === "minimal") {
    return (
      <div className="mb-3 flex items-center justify-between gap-6">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {screenConfig.showStatusBadge ? (
              <Badge className="rounded border-[#c7ecca] bg-[#eff6ec] px-2 py-1 tracking-[0.12em] text-[#23422a]">
                {badgeLabel}
              </Badge>
            ) : null}
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#727971]">
              {metaLabel}
            </span>
          </div>
          <h1 className="mt-2 font-headline text-[20px] font-extrabold leading-none tracking-tight text-[#23422a]">
            {screenConfig.title}
          </h1>
        </div>
        {screenConfig.showTimestamp ? (
          <div className="shrink-0 text-right">
            <div className="text-[11px] font-bold font-mono text-[#1a1c19]">{screenConfig.timeText}</div>
          </div>
        ) : null}
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <div className="mb-3 flex items-center justify-between gap-6 rounded-xl border border-[#c2c8bf]/35 bg-white/55 px-4 py-3 backdrop-blur-sm">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {screenConfig.showStatusBadge ? (
              <Badge className="rounded border-[#c7ecca] bg-[#eff6ec] px-2 py-1 tracking-[0.12em] text-[#23422a]">
                {badgeLabel}
              </Badge>
            ) : null}
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#727971]">
              {metaLabel}
            </span>
          </div>
          <div className="mt-2 flex items-end gap-3">
            <h1 className="font-headline text-[20px] font-extrabold leading-none tracking-tight text-[#23422a]">
              {screenConfig.title}
            </h1>
            {screenConfig.subtitle ? (
              <p className="truncate text-[9px] font-medium uppercase tracking-[0.22em] text-[#727971]">
                {screenConfig.subtitle}
              </p>
            ) : null}
          </div>
        </div>
        {screenConfig.showTimestamp ? (
          <div className="shrink-0 text-right">
            <div className="text-[11px] font-bold font-mono text-[#1a1c19]">{screenConfig.timeText}</div>
            <div className="mt-1 text-[9px] uppercase tracking-[0.16em] text-[#727971]">{screenConfig.dateText}</div>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="mb-4 flex items-start justify-between">
      <div>
        <div className="flex items-center gap-2">
          {screenConfig.showStatusBadge ? (
            <Badge className="rounded border-[#c7ecca] bg-[#eff6ec] px-2 py-1 tracking-[0.12em] text-[#23422a]">
              {badgeLabel}
            </Badge>
          ) : null}
          <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#727971]">
            {metaLabel}
          </span>
        </div>
        <h1 className="mt-3 font-headline text-[24px] font-extrabold leading-tight tracking-tight text-[#23422a]">
          {screenConfig.title}
        </h1>
        <p className="mt-1 text-[9px] font-medium uppercase tracking-[0.24em] text-[#727971]">
          {screenConfig.subtitle}
        </p>
      </div>
      {screenConfig.showTimestamp ? (
        <div className="flex items-center gap-5 text-right">
          <div>
            <div className="text-[11px] font-bold font-mono text-[#1a1c19]">{screenConfig.timeText}</div>
            <div className="text-[9px] uppercase tracking-[0.16em] text-[#727971]">{screenConfig.dateText}</div>
          </div>
          <div className="border-l border-[#c2c8bf]/40 pl-4">
            <div className="text-[11px] font-bold text-[#1a1c19]">{screenConfig.rightMetaPrimary}</div>
            <div className="mt-1 text-[9px] uppercase tracking-[0.16em] text-[#727971]">{screenConfig.rightMetaSecondary}</div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
