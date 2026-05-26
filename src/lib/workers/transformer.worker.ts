/// <reference lib="webworker" />

/**
 * JaminView 数据池 JS Transformer 沙箱。
 *
 * 安全约束：
 * - 进 worker 后立刻剥离 fetch / XMLHttpRequest / importScripts 这些可发起请求或加载外部代码的全局
 * - 用户代码通过 `new Function("payload","context", code)` 解析，运行在 worker 全局
 *   worker 全局自然没有 window / document / localStorage / sessionStorage / cookie
 * - 一次性 worker：调用方建一次 worker，发完 message 等响应/超时，立即 terminate
 *   不复用 worker 实例，避免上一次执行的状态污染下一次
 */

const ctx = self as unknown as DedicatedWorkerGlobalScope;

// 剥离可发起请求或加载外部代码的能力
type Mutable = Record<string, unknown>;
const sealable = ctx as unknown as Mutable;

for (const key of [
  "fetch",
  "XMLHttpRequest",
  "WebSocket",
  "importScripts",
  "EventSource",
  "Request",
  "Response",
  "Headers",
] as const) {
  try {
    sealable[key] = undefined;
  } catch {
    // 某些环境字段不可写，忽略；外层 250ms 超时仍是兜底
  }
}

type TransformerRequest = {
  code: string;
  payload: unknown;
  context: unknown;
};

type TransformerResponse =
  | {ok: true; result: unknown}
  | {ok: false; error: string};

ctx.addEventListener("message", (event: MessageEvent<TransformerRequest>) => {
  const {code, payload, context} = event.data;
  let response: TransformerResponse;

  try {
    const executor = new Function(
      "payload",
      "context",
      `"use strict";\n${code}`,
    ) as (payload: unknown, context: unknown) => unknown;
    const result = executor(payload, context);
    response = {ok: true, result: result === undefined ? payload : result};
  } catch (error) {
    response = {
      ok: false,
      error: error instanceof Error ? error.message : "JS Transformer 执行失败",
    };
  }

  ctx.postMessage(response);
});
