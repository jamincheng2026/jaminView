"use client";

import * as React from "react";
import {Check, ChevronDown} from "lucide-react";

import {cn} from "@/lib/utils";

type SelectOption = {
  label: string;
  value: string;
};

type SelectChangeEvent = {
  target: {
    value: string;
  };
};

type SelectProps = {
  className?: string;
  disabled?: boolean;
  name?: string;
  options: SelectOption[];
  onBlur?: React.FocusEventHandler<HTMLButtonElement>;
  onChange?: (event: SelectChangeEvent) => void;
  placeholder?: string;
  value?: string;
};

export const Select = React.forwardRef<HTMLButtonElement, SelectProps>(
  ({className, disabled, name, onBlur, onChange, options, placeholder, value = "", ...props}, ref) => {
    const [open, setOpen] = React.useState(false);
    const rootRef = React.useRef<HTMLDivElement | null>(null);
    const selectedOption = options.find((option) => option.value === value);

    React.useEffect(() => {
      if (!open) return;

      const handlePointerDown = (event: MouseEvent) => {
        if (!rootRef.current?.contains(event.target as Node)) {
          setOpen(false);
        }
      };

      const handleEscape = (event: KeyboardEvent) => {
        if (event.key === "Escape") {
          setOpen(false);
        }
      };

      window.addEventListener("mousedown", handlePointerDown);
      window.addEventListener("keydown", handleEscape);
      return () => {
        window.removeEventListener("mousedown", handlePointerDown);
        window.removeEventListener("keydown", handleEscape);
      };
    }, [open]);

    const commitValue = (nextValue: string) => {
      onChange?.({target: {value: nextValue}});
      setOpen(false);
    };

    return (
      <div ref={rootRef} className="relative" {...props}>
        {name ? <input type="hidden" name={name} value={value} /> : null}
        <button
          ref={ref}
          type="button"
          disabled={disabled}
          onBlur={onBlur}
          onClick={() => {
            if (!disabled) setOpen((current) => !current);
          }}
          className={cn(
            "flex h-10 w-full items-center justify-between gap-3 rounded-xl border border-line bg-white/70 px-3 text-left text-sm text-foreground outline-none transition-colors focus:border-brand disabled:cursor-not-allowed disabled:opacity-60",
            open ? "border-brand" : "",
            className,
          )}
          aria-haspopup="listbox"
          aria-expanded={open}
        >
          <span className={cn("truncate", selectedOption ? "text-foreground" : "text-muted-foreground")}>
            {selectedOption?.label ?? placeholder ?? options[0]?.label ?? ""}
          </span>
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
              open ? "rotate-180" : "",
            )}
          />
        </button>
        {open ? (
          <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 overflow-hidden rounded-xl border border-line bg-[#fcfcf8] p-1.5 shadow-[0_18px_40px_rgba(26,28,25,0.14)]">
            <div className="max-h-64 overflow-y-auto">
              {options.map((option) => {
                const active = option.value === value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => commitValue(option.value)}
                    className={cn(
                      "flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-[13px] transition-colors",
                      active
                        ? "bg-[#eef5ec] text-[#23422a]"
                        : "text-[#1a1c19] hover:bg-[#f2f4ee]",
                    )}
                    role="option"
                    aria-selected={active}
                  >
                    <span className="truncate">{option.label}</span>
                    {active ? <Check className="h-4 w-4 shrink-0" /> : null}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>
    );
  },
);

Select.displayName = "Select";
