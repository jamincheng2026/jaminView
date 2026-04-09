"use client";

import * as React from "react";
import { Minus, Plus } from "lucide-react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type NumberStepperProps = {
  label: string;
  description?: string;
  value: number;
  onValueChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  unit?: string;
  className?: string;
};

function clampNumber(value: number, min?: number, max?: number) {
  if (min !== undefined && value < min) {
    return min;
  }
  if (max !== undefined && value > max) {
    return max;
  }
  return value;
}

export function NumberStepper({
  label,
  description,
  value,
  onValueChange,
  min,
  max,
  step = 1,
  disabled = false,
  unit,
  className,
}: NumberStepperProps) {
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = event.target.value.trim();
    if (rawValue === "") {
      return;
    }

    const nextValue = Number(rawValue);
    if (!Number.isFinite(nextValue)) {
      return;
    }

    onValueChange(clampNumber(nextValue, min, max));
  };

  const handleStep = (direction: -1 | 1) => {
    onValueChange(clampNumber(value + direction * step, min, max));
  };

  return (
    <div
      className={cn(
        "rounded-2xl border border-[#d7d8d1] bg-white/78 px-3.5 py-3",
        disabled && "opacity-55",
        className,
      )}
    >
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-[#1a1c19]">{label}</div>
          {description ? (
            <p className="mt-1 text-xs leading-5 text-[#727971]">{description}</p>
          ) : null}
        </div>
        {unit ? (
          <span className="shrink-0 rounded-full border border-[#d7d8d1] bg-[#fafaf5] px-2 py-0.5 text-[11px] font-medium text-[#727971]">
            {unit}
          </span>
        ) : null}
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={disabled}
          onClick={() => handleStep(-1)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#d7d8d1] bg-[#fafaf5] text-[#1a1c19] transition-colors hover:bg-[#f0f1ea] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Minus className="h-4 w-4" strokeWidth={2.4} />
        </button>
        <Input
          type="number"
          inputMode="decimal"
          min={min}
          max={max}
          step={step}
          value={value}
          disabled={disabled}
          onChange={handleInputChange}
          className="h-10 flex-1 rounded-xl border-[#d7d8d1] bg-white text-center text-sm font-semibold text-[#1a1c19] focus:border-[#23422a]"
        />
        <button
          type="button"
          disabled={disabled}
          onClick={() => handleStep(1)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#d7d8d1] bg-[#fafaf5] text-[#1a1c19] transition-colors hover:bg-[#f0f1ea] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus className="h-4 w-4" strokeWidth={2.4} />
        </button>
      </div>
    </div>
  );
}
