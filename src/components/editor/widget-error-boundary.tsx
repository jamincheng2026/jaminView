"use client";

import * as React from "react";

type WidgetErrorBoundaryProps = {
  widgetId: string;
  widgetTitle?: string;
  children: React.ReactNode;
};

type WidgetErrorBoundaryState = {
  error: Error | null;
  showDetails: boolean;
};

const DEFAULT_TITLE = "组件渲染失败";
const DEFAULT_DESCRIPTION = "该组件的渲染遇到错误，已暂停以避免影响其他组件。";
const DEFAULT_RETRY = "重试";
const DEFAULT_DETAILS_LABEL = "查看错误详情";

/**
 * 包裹画布上每个 widget 的渲染，单点崩溃不连累整个工作台。
 * 用 class component 是因为 React 18+ 仍无 Hook 版本的错误边界。
 *
 * 文案默认中文（与 AGENTS.md 中文优先一致），M5 i18n 阶段统一替换为 useTranslations。
 */
export class WidgetErrorBoundary extends React.Component<
  WidgetErrorBoundaryProps,
  WidgetErrorBoundaryState
> {
  state: WidgetErrorBoundaryState = {
    error: null,
    showDetails: false,
  };

  static getDerivedStateFromError(error: Error): WidgetErrorBoundaryState {
    return { error, showDetails: false };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    if (typeof window !== "undefined") {
      // 占位上报点：M6 接 Sentry / 自研日志时在此推送。
      console.error(
        `[WidgetErrorBoundary] widget ${this.props.widgetId} render failed`,
        error,
        info.componentStack,
      );
    }
  }

  componentDidUpdate(prevProps: WidgetErrorBoundaryProps) {
    if (prevProps.widgetId !== this.props.widgetId && this.state.error) {
      this.setState({ error: null, showDetails: false });
    }
  }

  private handleRetry = () => {
    this.setState({ error: null, showDetails: false });
  };

  private handleToggleDetails = () => {
    this.setState((current) => ({ showDetails: !current.showDetails }));
  };

  render() {
    if (!this.state.error) {
      return this.props.children;
    }

    return (
      <div className="flex h-full w-full flex-col items-center justify-center rounded-[18px] border border-dashed border-[#d7d8d1] bg-[#fafaf5] px-6 py-6 text-center">
        <div className="text-[11px] font-black uppercase tracking-[0.22em] text-[#23422a]">
          Widget Error
        </div>
        <div className="mt-2 text-sm font-bold text-[#1a1c19]">
          {this.props.widgetTitle ?? DEFAULT_TITLE}
        </div>
        <p className="mt-2 max-w-xs text-xs leading-5 text-[#727971]">
          {DEFAULT_DESCRIPTION}
        </p>
        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            onClick={this.handleRetry}
            className="rounded-full border border-[#23422a] bg-[#23422a] px-3 py-1 text-xs font-semibold text-white transition-colors hover:bg-[#31583b]"
          >
            {DEFAULT_RETRY}
          </button>
          <button
            type="button"
            onClick={this.handleToggleDetails}
            className="rounded-full border border-[#d7d8d1] bg-white px-3 py-1 text-xs font-semibold text-[#727971] transition-colors hover:border-[#23422a] hover:text-[#23422a]"
          >
            {DEFAULT_DETAILS_LABEL}
          </button>
        </div>
        {this.state.showDetails ? (
          <pre className="mt-3 max-h-24 w-full overflow-auto rounded-md bg-white px-3 py-2 text-left text-[11px] leading-4 text-[#727971]">
            {this.state.error.message}
          </pre>
        ) : null}
      </div>
    );
  }
}
