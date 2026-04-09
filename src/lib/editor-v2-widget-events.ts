"use client";

import type { Widget } from "@/packages/types";

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
    return widget.events.url?.trim() ?? "";
  }

  return "";
}

export function isExternalEditorV2Href(href: string) {
  return /^https?:\/\//i.test(href);
}
