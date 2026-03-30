import * as React from "react";

import { cn } from "@/lib/utils";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={cn(
        "h-10 w-full rounded-xl border border-line bg-white/70 px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-brand",
        className,
      )}
      {...props}
    />
  );
});

Input.displayName = "Input";
