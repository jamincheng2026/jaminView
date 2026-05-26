"use client";

import * as React from "react";

/**
 * global-error.tsx 在 [locale]/layout 之外渲染，无法访问 NextIntlClientProvider。
 * 兜底文案使用中文（与 root layout 默认 lang 一致），M5 i18n 阶段再分流。
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & {digest?: string};
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error("[global-error]", error);
  }, [error]);

  return (
    <html lang="zh-CN">
      <body
        style={{
          alignItems: "center",
          backgroundColor: "#fafaf5",
          color: "#1a1c19",
          display: "flex",
          fontFamily: "system-ui, sans-serif",
          justifyContent: "center",
          margin: 0,
          minHeight: "100vh",
        }}
      >
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #d7d8d1",
            borderRadius: 24,
            maxWidth: 440,
            padding: "32px 36px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              color: "#23422a",
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: "0.28em",
              textTransform: "uppercase",
            }}
          >
            JaminView
          </div>
          <h1 style={{fontSize: 24, fontWeight: 700, margin: "16px 0 8px"}}>
            应用遇到严重错误
          </h1>
          <p
            style={{
              color: "#727971",
              fontSize: 14,
              lineHeight: 1.6,
              margin: "0 0 24px",
            }}
          >
            请刷新页面重试。如果问题持续，请联系支持团队。
          </p>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              background: "#23422a",
              border: "none",
              borderRadius: 10,
              color: "#ffffff",
              cursor: "pointer",
              fontSize: 14,
              fontWeight: 600,
              padding: "10px 18px",
            }}
          >
            刷新页面
          </button>
        </div>
      </body>
    </html>
  );
}
