"use client";

import type { Widget } from "@/packages/types";

/**
 * 安全跳转白名单：仅允许 https?:// 绝对 URL 或站内 `/path` 相对绝对路径。
 * 拒绝 javascript:、data:、vbscript:、file:、blob:、协议相对（`//host`）。
 */
const SAFE_HREF_PATTERN = /^(https?:\/\/|\/(?!\/))/i;

export function sanitizeRuntimeHref(rawHref: string) {
  return SAFE_HREF_PATTERN.test(rawHref) ? rawHref : "";
}

export function hasEditorV2RuntimeAction(widget: Widget) {
  return Boolean(widget.events.action && widget.events.action !== "none");
}

export function resolveEditorV2FocusTargets(widget: Widget) {
  return widget.events.action === "focusWidget" && widget.events.targetWidgetId
    ? [widget.events.targetWidgetId]
    : [];
}

export function resolveEditorV2RuntimeHref(
  widget: Widget,
  locale: string,
  projectId: string,
) {
  if (widget.events.action === "openPreview") {
    return `/${locale}/preview/${encodeURIComponent(projectId)}`;
  }

  if (widget.events.action === "openLink") {
    const raw = widget.events.url?.trim() ?? "";
    return sanitizeRuntimeHref(raw);
  }

  return "";
}

export function isExternalEditorV2Href(href: string) {
  return /^https?:\/\//i.test(href);
}
