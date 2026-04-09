"use client";

import * as React from "react";

import {
  ChartFrame,
  type EditorDataPond,
  type EditorDataPondSettings,
  type Widget,
  type WidgetRequestConfig,
} from "@/packages/types";

export type DataPondRuntimeStatus = "idle" | "loading" | "ready" | "error";

export type DataPondRuntimeRecord = {
  data: unknown;
  error: string | null;
  mappedData: unknown;
  rawData: unknown;
  status: DataPondRuntimeStatus;
  updatedAt: string | null;
};

export type DataPondRuntimeMap = Record<string, DataPondRuntimeRecord>;

const defaultRuntimeRecord: DataPondRuntimeRecord = {
  data: null,
  error: null,
  mappedData: null,
  rawData: null,
  status: "idle",
  updatedAt: null,
};

function cloneValue<T>(value: T): T {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }

  return JSON.parse(JSON.stringify(value)) as T;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function tryParseJson(value: string | undefined) {
  if (!value || !value.trim()) {
    return null;
  }

  try {
    return JSON.parse(value) as unknown;
  } catch {
    return null;
  }
}

function splitPath(path: string) {
  return path
    .split(".")
    .flatMap((segment) => segment.split(/\[|\]/).filter(Boolean))
    .filter(Boolean);
}

function resolveValueByPath(source: unknown, path: string | undefined) {
  if (!path || !path.trim()) {
    return source;
  }

  const segments = splitPath(path.trim());
  let current: unknown = source;

  for (const segment of segments) {
    if (Array.isArray(current)) {
      const index = Number(segment);
      if (!Number.isInteger(index)) {
        return undefined;
      }
      current = current[index];
      continue;
    }

    if (!isRecord(current)) {
      return undefined;
    }

    current = current[segment];
  }

  return current;
}

function normalizeResponsePayload(payload: unknown, responseMap: string | undefined) {
  const mapped = resolveValueByPath(payload, responseMap);
  return mapped === undefined ? payload : mapped;
}

function resolveRequestContentMode(request: WidgetRequestConfig) {
  return request.contentMode ?? "default";
}

type RequestTransformerContext = {
  dataPondId: string;
  request: WidgetRequestConfig;
};

function applyRequestTransformer(
  payload: unknown,
  request: WidgetRequestConfig,
  context: RequestTransformerContext,
) {
  const transformer = request.transformer?.trim();
  if (!transformer) {
    return payload;
  }

  try {
    const clonedPayload = cloneValue(payload);
    const executeTransformer = new Function(
      "payload",
      "context",
      `"use strict";\n${transformer}`,
    ) as (payload: unknown, context: RequestTransformerContext) => unknown;
    const result = executeTransformer(clonedPayload, context);
    return result === undefined ? clonedPayload : result;
  } catch (error) {
    throw new Error(
      error instanceof Error
        ? `JS Transformer 执行失败：${error.message}`
        : "JS Transformer 执行失败",
    );
  }
}

function buildRequestUrl(url: string, method: WidgetRequestConfig["method"], params: unknown) {
  if (method !== "GET" || !isRecord(params)) {
    return url;
  }

  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      searchParams.set(key, String(value));
    }
  });

  if (!searchParams.size) {
    return url;
  }

  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}${searchParams.toString()}`;
}

async function fetchDataPondResponse(dataPond: EditorDataPond) {
  const requestMode = resolveRequestContentMode(dataPond.request);
  const parsedParams = tryParseJson(dataPond.request.params);
  const requestMethod = dataPond.request.method;
  const requestUrl =
    requestMode === "sql"
      ? dataPond.request.url
      : buildRequestUrl(dataPond.request.url, requestMethod, parsedParams);

  const init: RequestInit = {
    method: requestMethod,
  };

  if (requestMode === "sql") {
    const sql = dataPond.request.sql?.trim() ?? "";
    if (!sql) {
      throw new Error("SQL 模式需要填写 SQL 语句");
    }

    if (requestMethod === "GET") {
      throw new Error("SQL 模式不支持 GET，请改用 POST");
    }

    init.headers = {
      "Content-Type": "application/json",
    };
    init.body = JSON.stringify({ sql });
  } else if (requestMethod !== "GET" && dataPond.request.params?.trim()) {
    init.headers = {
      "Content-Type": "application/json",
    };
    init.body =
      parsedParams !== null ? JSON.stringify(parsedParams) : dataPond.request.params;
  }

  const response = await fetch(requestUrl, init);
  if (!response.ok) {
    throw new Error(`请求失败：${response.status}`);
  }

  const rawText = await response.text();
  let payload: unknown = rawText;

  try {
    payload = rawText ? (JSON.parse(rawText) as unknown) : null;
  } catch {
    payload = rawText;
  }

  const mappedData = normalizeResponsePayload(payload, dataPond.request.responseMap);
  const data = applyRequestTransformer(mappedData, dataPond.request, {
    dataPondId: dataPond.id,
    request: dataPond.request,
  });

  return {
    data,
    mappedData,
    rawData: payload,
  };
}

function extractRowsFromPayload(payload: unknown) {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (!isRecord(payload)) {
    return null;
  }

  if (Array.isArray(payload.rows)) {
    return payload.rows;
  }

  if (Array.isArray(payload.data)) {
    return payload.data;
  }

  if (Array.isArray(payload.list)) {
    return payload.list;
  }

  return null;
}

function hydrateVChartWidget(widget: Widget, payload: unknown): Widget {
  if (widget.chartFrame !== ChartFrame.VCHART) {
    return widget;
  }

  const rows = extractRowsFromPayload(payload);
  if (!rows) {
    return widget;
  }

  const nextWidget = cloneValue(widget);
  if (!Array.isArray(nextWidget.spec.data)) {
    return nextWidget;
  }

  const dataset = nextWidget.spec.data[0];
  if (isRecord(dataset)) {
    dataset.values = rows;
  }

  return nextWidget;
}

function hydrateCustomWidget(widget: Widget, payload: unknown): Widget {
  if (widget.chartFrame === ChartFrame.VCHART) {
    return widget;
  }

  const nextWidget = cloneValue(widget);
  const nextConfig = nextWidget.config;

  switch (widget.registrationKey) {
    case "decorate-flipper-number": {
      if (isRecord(payload) && "value" in payload) {
        nextConfig.dataset = payload.value;
      } else if (
        typeof payload === "string" ||
        typeof payload === "number"
      ) {
        nextConfig.dataset = payload;
      }
      return nextWidget;
    }
    case "table-scroll-board": {
      if (
        isRecord(payload) &&
        Array.isArray(payload.header) &&
        Array.isArray(payload.rows)
      ) {
        nextConfig.dataset = {
          header: payload.header,
          rows: payload.rows,
        };
      }
      return nextWidget;
    }
    case "media-image-frame": {
      if (isRecord(payload)) {
        if (typeof payload.imageUrl === "string") {
          nextConfig.imageUrl = payload.imageUrl;
        }
        if (typeof payload.caption === "string") {
          nextConfig.caption = payload.caption;
        }
        if (typeof payload.meta === "string") {
          nextConfig.meta = payload.meta;
        }
      } else if (typeof payload === "string") {
        nextConfig.imageUrl = payload;
      }
      return nextWidget;
    }
    default: {
      if ("dataset" in nextConfig) {
        nextConfig.dataset = payload;
      }
      return nextWidget;
    }
  }
}

export function applyDataPondToWidget(widget: Widget, runtimeMap: DataPondRuntimeMap) {
  if (widget.dataSource.mode !== "request" || !widget.dataSource.dataPondId) {
    return widget;
  }

  const runtimeRecord = runtimeMap[widget.dataSource.dataPondId];
  if (!runtimeRecord || runtimeRecord.status !== "ready") {
    return widget;
  }

  return widget.chartFrame === ChartFrame.VCHART
    ? hydrateVChartWidget(widget, runtimeRecord.data)
    : hydrateCustomWidget(widget, runtimeRecord.data);
}

export function useEditorDataPondRuntime(
  dataPonds: EditorDataPond[],
  settings: EditorDataPondSettings,
) {
  const [runtimeMap, setRuntimeMap] = React.useState<DataPondRuntimeMap>({});

  React.useEffect(() => {
    const activeDataPonds = dataPonds.filter(
      (item) => item.enabled && item.request.url.trim().length > 0,
    );

    setRuntimeMap((current) =>
      Object.fromEntries(
        activeDataPonds.map((item) => [item.id, current[item.id] ?? defaultRuntimeRecord]),
      ),
    );

    if (activeDataPonds.length === 0) {
      return undefined;
    }

    const intervalIds: number[] = [];
    let cancelled = false;

    activeDataPonds.forEach((dataPond) => {
      const runFetch = async () => {
        if (cancelled) {
          return;
        }

        setRuntimeMap((current) => ({
          ...current,
          [dataPond.id]: {
            ...(current[dataPond.id] ?? defaultRuntimeRecord),
            error: null,
            status: "loading",
          },
        }));

        try {
          const result = await fetchDataPondResponse(dataPond);
          if (cancelled) {
            return;
          }

          setRuntimeMap((current) => ({
            ...current,
            [dataPond.id]: {
              data: result.data,
              error: null,
              mappedData: result.mappedData,
              rawData: result.rawData,
              status: "ready",
              updatedAt: new Date().toISOString(),
            },
          }));
        } catch (error) {
          if (cancelled) {
            return;
          }

          setRuntimeMap((current) => ({
            ...current,
            [dataPond.id]: {
              ...(current[dataPond.id] ?? defaultRuntimeRecord),
              error: error instanceof Error ? error.message : "请求失败",
              status: "error",
            },
          }));
        }
      };

      void runFetch();

      const intervalSeconds =
        (dataPond.request.refreshInterval ?? 0) > 0
          ? (dataPond.request.refreshInterval ?? 0)
          : settings.pollingInterval;

      if (intervalSeconds > 0) {
        intervalIds.push(window.setInterval(() => void runFetch(), intervalSeconds * 1000));
      }
    });

    return () => {
      cancelled = true;
      intervalIds.forEach((intervalId) => window.clearInterval(intervalId));
    };
  }, [dataPonds, settings.pollingInterval]);

  return runtimeMap;
}
