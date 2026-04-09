"use client";

import * as React from "react";

import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

type ToggleSwitchProps = {
  label: string;
  description?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
};

export function ToggleSwitch({
  label,
  description,
  checked,
  onCheckedChange,
  disabled = false,
  className,
}: ToggleSwitchProps) {
  const labelId = React.useId();
  const descriptionId = React.useId();

  return (
    <div
      className={cn(
        "flex items-start justify-between gap-4 rounded-2xl border border-[#d7d8d1] bg-white/78 px-3.5 py-3",
        disabled && "opacity-55",
        className,
      )}
    >
      <div className="min-w-0 flex-1">
        <label
          id={labelId}
          className={cn(
            "block text-sm font-semibold text-[#1a1c19]",
            disabled ? "cursor-not-allowed" : "cursor-pointer",
          )}
        >
          {label}
        </label>
        {description ? (
          <p id={descriptionId} className="mt-1 text-xs leading-5 text-[#727971]">
            {description}
          </p>
        ) : null}
      </div>
      <Switch
        checked={checked}
        disabled={disabled}
        onCheckedChange={onCheckedChange}
        className={cn(
          "mt-0.5 shrink-0",
          checked
            ? "border-[#23422a] bg-[#23422a]"
            : "border-[#d7d8d1] bg-[#d7d8d1]",
        )}
        aria-labelledby={labelId}
        aria-describedby={description ? descriptionId : undefined}
      />
    </div>
  );
}
