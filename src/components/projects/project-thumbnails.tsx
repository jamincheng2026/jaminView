import { cn } from "@/lib/utils";

type ProjectThumbnailProps = {
  tone: "teal" | "dark" | "network" | "silver";
};

export function ProjectThumbnail({ tone }: ProjectThumbnailProps) {
  return (
    <div
      className={cn(
        "template-thumb thumbnail-grid relative h-36 overflow-hidden rounded-2xl border border-white/10",
        tone === "silver" && "bg-[linear-gradient(180deg,#8a8d8f,#4b4c50)]",
        tone === "teal" && "bg-[linear-gradient(180deg,#17302d,#101717)]",
        tone === "network" && "bg-[linear-gradient(180deg,#173030,#10171a)]",
      )}
    >
      {tone === "teal" && (
        <div className="absolute inset-4 flex flex-col gap-3">
          <div className="h-2 w-24 rounded-full bg-emerald-200/60" />
          <div className="mt-4 h-16 rounded-xl border border-white/10 bg-white/4" />
          <div className="grid grid-cols-3 gap-2">
            <div className="h-9 rounded-lg bg-emerald-200/15" />
            <div className="h-9 rounded-lg bg-white/8" />
            <div className="h-9 rounded-lg bg-white/8" />
          </div>
        </div>
      )}
      {tone === "dark" && (
        <div className="absolute inset-4">
          <div className="mb-4 h-2 w-20 rounded-full bg-white/40" />
          <div className="grid grid-cols-2 gap-2">
            <div className="h-14 rounded-xl bg-white/6" />
            <div className="h-14 rounded-xl bg-white/6" />
            <div className="col-span-2 h-12 rounded-xl bg-emerald-300/10" />
          </div>
        </div>
      )}
      {tone === "network" && (
        <div className="absolute inset-0">
          <div className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-300/15" />
          <div className="absolute left-10 top-12 h-2 w-2 rounded-full bg-cyan-200/80" />
          <div className="absolute left-20 top-20 h-2 w-2 rounded-full bg-cyan-200/80" />
          <div className="absolute right-12 top-16 h-2 w-2 rounded-full bg-cyan-200/80" />
          <div className="absolute bottom-10 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-cyan-200/80" />
        </div>
      )}
      {tone === "silver" && (
        <div className="absolute inset-0 flex items-center justify-center text-[44px] font-semibold tracking-[0.2em] text-white/30">
          Q
        </div>
      )}
    </div>
  );
}
