"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

type CollapseSectionProps = {
  title: string;
  description?: string;
  badge?: string;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
};

export function CollapseSection({
  title,
  description,
  badge,
  defaultOpen = true,
  open,
  onOpenChange,
  action,
  children,
  className,
  contentClassName,
}: CollapseSectionProps) {
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen);
  const contentId = React.useId();
  const resolvedOpen = open ?? internalOpen;

  const handleToggle = () => {
    const nextOpen = !resolvedOpen;
    if (open === undefined) {
      setInternalOpen(nextOpen);
    }
    onOpenChange?.(nextOpen);
  };

  return (
    <section
      className={cn(
        "overflow-hidden rounded-[20px] border border-[#d7d8d1] bg-[#fafaf5] shadow-[0_12px_24px_rgba(26,28,25,0.04)]",
        className,
      )}
    >
      <button
        type="button"
        aria-expanded={resolvedOpen}
        aria-controls={contentId}
        onClick={handleToggle}
        className="flex w-full items-start justify-between gap-4 px-4 py-3.5 text-left transition-colors hover:bg-[#f3f4ed] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#23422a]/20"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-black uppercase tracking-[0.22em] text-[#1a1c19]">
              {title}
            </span>
            {badge ? (
              <span className="rounded-full border border-[#d7d8d1] bg-white px-2 py-0.5 text-[10px] font-semibold tracking-[0.08em] text-[#727971]">
                {badge}
              </span>
            ) : null}
          </div>
          {description ? (
            <p className="mt-1 text-xs leading-5 text-[#727971]">{description}</p>
          ) : null}
        </div>
        <div className="flex items-center gap-3 pl-2">
          {action ? <div onClick={(event) => event.stopPropagation()}>{action}</div> : null}
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 text-[#727971] transition-transform duration-200",
              resolvedOpen ? "rotate-180" : "rotate-0",
            )}
            strokeWidth={2.3}
          />
        </div>
      </button>
      <div
        id={contentId}
        className={cn(
          "grid transition-[grid-template-rows,opacity] duration-200 ease-out",
          resolvedOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        )}
      >
        <div className="min-h-0 overflow-hidden">
          <div
            className={cn(
              "border-t border-[#d7d8d1] bg-[linear-gradient(180deg,rgba(255,255,255,0.72),rgba(250,250,245,0.98))] px-4 py-4",
              contentClassName,
            )}
          >
            {children}
          </div>
        </div>
      </div>
    </section>
  );
}
