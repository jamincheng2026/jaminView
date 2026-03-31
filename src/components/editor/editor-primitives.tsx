import * as React from "react";

import {cn} from "@/lib/utils";

export function EditorPanel({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-line/70 bg-card/88 shadow-[0_18px_40px_rgba(26,28,25,0.06)] backdrop-blur-sm",
        className,
      )}
      {...props}
    />
  );
}

export function EditorSection({
  title,
  subtitle,
  action,
  className,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={cn("space-y-3", className)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-headline text-[11px] font-extrabold uppercase tracking-[0.2em] text-muted-foreground">
            {title}
          </h3>
          {subtitle ? (
            <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
          ) : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function EditorField({
  label,
  hint,
  className,
  children,
}: {
  label: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center justify-between gap-2">
        <label className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
          {label}
        </label>
        {hint ? <span className="text-[10px] text-muted-foreground">{hint}</span> : null}
      </div>
      {children}
    </div>
  );
}

export function EditorMetric({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "positive" | "alert";
}) {
  return (
    <div className="rounded-xl border border-line/60 bg-panel px-3 py-2.5">
      <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </div>
      <div
        className={cn(
          "mt-1 font-headline text-lg font-extrabold",
          tone === "positive" && "text-brand",
          tone === "alert" && "text-[#ba1a1a]",
          tone === "default" && "text-foreground",
        )}
      >
        {value}
      </div>
    </div>
  );
}
