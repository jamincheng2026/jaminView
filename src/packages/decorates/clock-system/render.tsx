"use client";

import * as React from "react";

import { ChartFrame, type Widget } from "@/packages/types";

import { createDefaultClockSystemConfig, type ClockSystemConfig } from "./config";

type ClockSystemRenderProps = {
  widget: Widget;
  width: number;
  height: number;
};

type ClockParts = {
  dateLabel: string;
  hour: number;
  minute: number;
  second: number;
  timeLabel: string;
  valid: boolean;
};

function getConfig(widget: Widget): ClockSystemConfig {
  if (widget.chartFrame === ChartFrame.VCHART) {
    return createDefaultClockSystemConfig();
  }

  return widget.config as ClockSystemConfig;
}

function getClockParts(timeZone: string, showSeconds: boolean, now: Date): ClockParts {
  try {
    const dateFormatter = new Intl.DateTimeFormat("zh-CN", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      weekday: "short",
    });
    const timeFormatter = new Intl.DateTimeFormat("zh-CN", {
      timeZone,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
    const parts = timeFormatter.formatToParts(now);
    const hour = Number(parts.find((part) => part.type === "hour")?.value ?? "0");
    const minute = Number(parts.find((part) => part.type === "minute")?.value ?? "0");
    const second = Number(parts.find((part) => part.type === "second")?.value ?? "0");
    const baseTimeLabel = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:${String(second).padStart(2, "0")}`;

    return {
      dateLabel: dateFormatter.format(now).replace(/\//g, "-"),
      hour,
      minute,
      second,
      timeLabel: showSeconds ? baseTimeLabel : baseTimeLabel.slice(0, 5),
      valid: true,
    };
  } catch {
    return {
      dateLabel: new Intl.DateTimeFormat("zh-CN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        weekday: "short",
      })
        .format(now)
        .replace(/\//g, "-"),
      hour: now.getHours(),
      minute: now.getMinutes(),
      second: now.getSeconds(),
      timeLabel: showSeconds
        ? now.toLocaleTimeString("zh-CN", { hour12: false })
        : now.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", hour12: false }),
      valid: false,
    };
  }
}

export function ClockSystemRender({ widget, width, height }: ClockSystemRenderProps) {
  const config = getConfig(widget);
  const [now, setNow] = React.useState<Date>(() => new Date());

  React.useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  const parts = React.useMemo(
    () => getClockParts(config.timeZone, config.showSeconds, now),
    [config.showSeconds, config.timeZone, now],
  );
  const hourAngle = ((parts.hour % 12) + parts.minute / 60) * 30;
  const minuteAngle = (parts.minute + parts.second / 60) * 6;
  const secondAngle = parts.second * 6;
  const showDual = config.showAnalog && config.showDigital;
  const clockSize = Math.min(height - 40, showDual ? width * 0.32 : Math.min(width - 48, height - 40));

  return (
    <div
      className="h-full w-full rounded-[24px] border shadow-[0_14px_30px_rgba(26,28,25,0.08)]"
      style={{
        borderColor: config.panelBorderColor,
        background: `linear-gradient(180deg, ${config.panelColor} 0%, #f4f6f0 100%)`,
        padding: "22px 24px",
      }}
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="text-[11px] font-black uppercase tracking-[0.24em]" style={{ color: config.accentColor }}>
          {config.label}
        </div>
        {!parts.valid ? (
          <div className="rounded-full border border-[#d7d8d1] bg-white/92 px-3 py-1 text-[10px] font-semibold tracking-[0.08em] text-[#727971]">
            已回退本地时区
          </div>
        ) : null}
      </div>

      <div
        className="grid h-[calc(100%-32px)] gap-5"
        style={{
          gridTemplateColumns:
            config.showAnalog && config.showDigital
              ? "minmax(0, 200px) minmax(0, 1fr)"
              : "minmax(0, 1fr)",
          alignItems: "center",
        }}
      >
        {config.showAnalog ? (
          <div className="flex items-center justify-center">
            <svg
              viewBox="0 0 200 200"
              width={clockSize}
              height={clockSize}
              className="drop-shadow-[0_14px_28px_rgba(35,66,42,0.12)]"
            >
              <circle cx="100" cy="100" r="82" fill={config.faceColor} stroke={config.faceBorderColor} strokeWidth="6" />
              {Array.from({ length: 12 }).map((_, index) => {
                const angle = ((index + 1) * 360) / 12;
                return (
                  <line
                    key={angle}
                    x1="100"
                    y1="28"
                    x2="100"
                    y2="40"
                    stroke={config.tickColor}
                    strokeWidth={index % 3 === 0 ? 4 : 2}
                    transform={`rotate(${angle} 100 100)`}
                  />
                );
              })}
              <line
                x1="100"
                y1="100"
                x2="100"
                y2="58"
                stroke={config.handColor}
                strokeWidth="5"
                strokeLinecap="round"
                transform={`rotate(${hourAngle} 100 100)`}
              />
              <line
                x1="100"
                y1="100"
                x2="100"
                y2="44"
                stroke={config.handColor}
                strokeWidth="4"
                strokeLinecap="round"
                transform={`rotate(${minuteAngle} 100 100)`}
              />
              {config.showSeconds ? (
                <line
                  x1="100"
                  y1="100"
                  x2="100"
                  y2="34"
                  stroke={config.secondHandColor}
                  strokeWidth="2"
                  strokeLinecap="round"
                  transform={`rotate(${secondAngle} 100 100)`}
                />
              ) : null}
              <circle cx="100" cy="100" r="6" fill={config.accentColor} />
            </svg>
          </div>
        ) : null}

        {config.showDigital ? (
          <div className="flex min-w-0 flex-col justify-center rounded-[24px] border bg-white/72 px-6 py-5" style={{ borderColor: config.panelBorderColor }}>
            <div className="text-[11px] font-black uppercase tracking-[0.22em]" style={{ color: config.accentColor }}>
              Clock System
            </div>
            <div
              className="mt-3 truncate text-[40px] font-black tracking-[0.08em]"
              style={{ color: config.textColor, lineHeight: 1.05 }}
            >
              {parts.timeLabel}
            </div>
            {config.showDate ? (
              <div className="mt-3 text-sm font-semibold" style={{ color: config.textColor }}>
                {parts.dateLabel}
              </div>
            ) : null}
            <div className="mt-2 text-xs leading-6 text-[#727971]">
              当前大屏会持续按秒刷新，适合作为运营总览、调度中心和监控大屏头部时间区。
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
