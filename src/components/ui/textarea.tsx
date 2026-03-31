import * as React from "react";

import {cn} from "@/lib/utils";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({className, ...props}, ref) => {
  return (
    <textarea
      ref={ref}
      className={cn(
        "min-h-24 w-full rounded-xl border border-line bg-white/70 px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-brand",
        className,
      )}
      {...props}
    />
  );
});

Textarea.displayName = "Textarea";
