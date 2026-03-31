"use client";

import * as React from "react";

import {cn} from "@/lib/utils";

type TabsProps = {
  value: string;
  onValueChange?: (value: string) => void;
  options: Array<{label: string; value: string}>;
  className?: string;
};

export function Tabs({value, onValueChange, options, className}: TabsProps) {
  return (
    <div className={cn("inline-flex rounded-xl bg-panel p-1", className)}>
      {options.map((option) => {
        const active = option.value === value;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onValueChange?.(option.value)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
              active
                ? "bg-white text-brand shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
