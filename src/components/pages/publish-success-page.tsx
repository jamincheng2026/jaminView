"use client";

import {useEffect, useMemo, useState} from "react";
import {useLocale, useTranslations} from "next-intl";
import {useRouter} from "next/navigation";
import {CheckCircle2, Copy, ExternalLink, Sparkles} from "lucide-react";

import {
  readEditorV2PublishedSnapshot,
  type EditorV2PublishedSnapshot,
} from "@/lib/editor-v2-storage";
import {buildEditorV2WorkspaceSummary} from "@/lib/editor-v2-workspace";
import {readPublishedSnapshot, type PublishedSnapshot} from "@/lib/editor-storage";

export function PublishSuccessPage({projectId}: {projectId: string}) {
  const t = useTranslations("PublishSuccess");
  const locale = useLocale();
  const router = useRouter();
  const [v2Snapshot, setV2Snapshot] = useState<EditorV2PublishedSnapshot | null>(null);
  const [snapshot, setSnapshot] = useState<PublishedSnapshot | null>(null);
  const [copyState, setCopyState] = useState<"idle" | "success" | "error">("idle");

  useEffect(() => {
    setV2Snapshot(readEditorV2PublishedSnapshot(projectId));
    setSnapshot(readPublishedSnapshot(projectId));
  }, [projectId]);

  useEffect(() => {
    if (copyState === "idle") {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => setCopyState("idle"), 2200);
    return () => window.clearTimeout(timeoutId);
  }, [copyState]);

  const shareLink = useMemo(() => {
    const sharePath = `/${locale}/screen/${projectId}`;
    if (typeof window === "undefined") return sharePath;
    return `${window.location.origin}${sharePath}`;
  }, [locale, projectId]);
  const v2Summary = useMemo(
    () =>
      v2Snapshot
        ? buildEditorV2WorkspaceSummary({
            canvas: v2Snapshot.canvas,
            dataPondSettings: v2Snapshot.dataPondSettings,
            dataPonds: v2Snapshot.dataPonds,
            projectId: v2Snapshot.projectId,
            projectTitle: v2Snapshot.projectTitle,
            widgets: v2Snapshot.widgets,
          })
        : null,
    [v2Snapshot],
  );

  const handleCopyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopyState("success");
    } catch {
      setCopyState("error");
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,rgba(35,66,42,0.12),transparent_30%),#fafaf5] px-6 py-16 text-[#1a1c19]">
      <div className="w-full max-w-3xl rounded-[28px] border border-[#d8dad3] bg-white/90 p-10 shadow-[0_40px_80px_rgba(26,28,25,0.08)]">
        <div className="mb-8 flex items-center justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#e8f4e8] text-[#23422a]">
            <CheckCircle2 className="h-8 w-8" />
          </div>
        </div>

        <div className="text-center">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-[#eef2ea] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-[#23422a]">
            <Sparkles className="h-3.5 w-3.5" />
            <span>{t("badge")}</span>
          </div>
          <h1 className="font-headline text-4xl font-extrabold tracking-tight text-[#1a1c19]">{t("title")}</h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[#60665f]">{t("description")}</p>
        </div>

        <div className="mt-10 rounded-2xl border border-[#e4e7df] bg-[#fafaf5] p-5">
          <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-[#727971]">{t("linkLabel")}</div>
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1 rounded-xl border border-[#d7d8d1] bg-white px-4 py-3 text-sm text-[#23422a]">
              {shareLink}
            </div>
            <button
              onClick={handleCopyShareLink}
              className="inline-flex h-12 items-center gap-2 rounded-xl border border-[#d7d8d1] bg-white px-4 text-sm font-semibold text-[#23422a] transition-colors hover:bg-[#f7f8f2]"
            >
              <Copy className="h-4 w-4" />
              <span>
                {copyState === "success" ? "已复制" : copyState === "error" ? "复制失败" : t("copy")}
              </span>
            </button>
          </div>
          <div className="mt-3 text-xs text-[#727971]">
            {(v2Snapshot?.publishedAt ?? snapshot?.publishedAt)
              ? `${t("publishedAt")} ${new Date(v2Snapshot?.publishedAt ?? snapshot?.publishedAt ?? "").toLocaleString(locale === "zh-CN" ? "zh-CN" : "en-US")}`
              : t("draftNotice")}
          </div>
        </div>

        {v2Summary ? (
          <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className="rounded-2xl border border-[#e4e7df] bg-[#fafaf5] px-4 py-4">
              <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#727971]">组件数</div>
              <div className="mt-2 text-lg font-bold text-[#1a1c19]">{v2Summary.widgetCount}</div>
            </div>
            <div className="rounded-2xl border border-[#e4e7df] bg-[#fafaf5] px-4 py-4">
              <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#727971]">数据池</div>
              <div className="mt-2 text-lg font-bold text-[#1a1c19]">{v2Summary.dataPondCount}</div>
            </div>
            <div className="rounded-2xl border border-[#e4e7df] bg-[#fafaf5] px-4 py-4">
              <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#727971]">画布</div>
              <div className="mt-2 text-lg font-bold text-[#1a1c19]">{v2Summary.canvasLabel}</div>
            </div>
            <div className="rounded-2xl border border-[#e4e7df] bg-[#fafaf5] px-4 py-4">
              <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#727971]">动态绑定</div>
              <div className="mt-2 text-lg font-bold text-[#1a1c19]">{v2Summary.dataBoundWidgetCount}</div>
            </div>
          </div>
        ) : (
          <div className="mt-6 rounded-2xl border border-dashed border-[#d7d8d1] bg-[#fafaf5] px-4 py-4 text-sm leading-6 text-[#727971]">
            当前还没有可读取的 V2 发布快照。你仍然可以回到编辑器继续完善，再重新发布生成新的展示链接。
          </div>
        )}

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => router.push(`/${locale}/screen/${projectId}`)}
            className="inline-flex h-12 items-center gap-2 rounded-xl bg-[#23422a] px-6 text-sm font-bold text-white shadow-lg shadow-[#23422a]/15 transition-all hover:-translate-y-0.5"
          >
            <ExternalLink className="h-4 w-4" />
            <span>{t("viewScreen")}</span>
          </button>
          <button
            onClick={() => router.push(`/${locale}/editor/${projectId}`)}
            className="inline-flex h-12 items-center rounded-xl border border-[#d7d8d1] bg-white px-6 text-sm font-semibold text-[#23422a] transition-colors hover:bg-[#f7f8f2]"
          >
            {t("backToEditor")}
          </button>
        </div>
      </div>
    </main>
  );
}
