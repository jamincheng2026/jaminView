"use client";

import * as React from "react";

import {cn} from "@/lib/utils";

type SwitchProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
};

export function Switch({
  checked = false,
  onCheckedChange,
  className,
  disabled = false,
  type = "button",
  onClick,
  ...props
}: SwitchProps) {
  return (
    <button
      type={type}
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented && !disabled) {
          onCheckedChange?.(!checked);
        }
      }}
      className={cn(
        "relative inline-flex h-6 w-11 items-center rounded-full border transition-colors",
        checked
          ? "border-brand bg-brand/95"
          : "border-line bg-panel-strong",
        disabled && "cursor-not-allowed opacity-50",
        className,
      )}
      {...props}
    >
      <span
        className={cn(
          "inline-block h-4.5 w-4.5 rounded-full bg-white shadow-sm transition-transform",
          checked ? "translate-x-[22px]" : "translate-x-1",
        )}
      />
    </button>
  );
}
