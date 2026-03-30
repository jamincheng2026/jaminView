import { MapPinned } from "lucide-react";

import { starterTemplates } from "@/lib/mock-projects";

export function StarterTemplateCards() {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      {starterTemplates.map((template) => (
        <div
          key={template.id}
          className="surface-card rounded-[20px] p-3"
        >
          <div
            className={`relative h-28 overflow-hidden rounded-2xl border border-white/10 ${
              template.tone === "neutral"
                ? "bg-[linear-gradient(180deg,#f3f0ea,#e4ddd3)]"
                : template.tone === "map"
                  ? "bg-[linear-gradient(180deg,#315340,#1d2d23)]"
                  : "bg-[linear-gradient(180deg,#203028,#121916)]"
            }`}
          >
            {template.tone === "map" ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="rounded-2xl bg-white/12 p-3 text-white">
                  <MapPinned className="h-7 w-7" />
                </div>
              </div>
            ) : null}
          </div>
          <div className="mt-3 text-sm font-medium text-foreground">{template.name}</div>
          <div className="mt-1 text-xs leading-5 text-muted-foreground">{template.subtitle}</div>
        </div>
      ))}
    </div>
  );
}
