import * as React from "react";

import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
};

const styles: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary:
    "bg-brand text-white shadow-[0_14px_28px_rgba(30,75,49,0.16)] hover:bg-brand-strong",
  secondary:
    "border border-line bg-white/75 text-foreground hover:bg-panel",
  ghost: "text-muted-foreground hover:bg-white/60",
};

export function Button({
  className,
  variant = "primary",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex h-10 items-center justify-center rounded-xl px-4 text-sm font-medium transition",
        styles[variant],
        className,
      )}
      {...props}
    />
  );
}
