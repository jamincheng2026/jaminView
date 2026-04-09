"use client";

import * as React from "react";

import { ChartFrame, type Widget } from "@/packages/types";

import {
  createDefaultScrollBoardConfig,
  type ScrollBoardAlign,
  type ScrollBoardCell,
  type ScrollBoardConfig,
} from "./config";

type ScrollBoardRenderProps = {
  widget: Widget;
  width: number;
  height: number;
};

type ScrollBoardRow = {
  cells: ScrollBoardCell[];
  rowIndex: number;
};

function getConfig(widget: Widget): ScrollBoardConfig {
  if (widget.chartFrame === ChartFrame.VCHART) {
    return createDefaultScrollBoardConfig();
  }

  return widget.config as ScrollBoardConfig;
}

function getAlignedClassName(align: ScrollBoardAlign) {
  switch (align) {
    case "center":
      return "justify-center text-center";
    case "right":
      return "justify-end text-right";
    default:
      return "justify-start text-left";
  }
}

function getPreparedRows(config: ScrollBoardConfig): ScrollBoardRow[] {
  return config.dataset.rows.map((row, index) => ({
    rowIndex: index,
    cells: config.index ? [index + 1, ...row] : row,
  }));
}

function getVisibleRows(rows: ScrollBoardRow[], startIndex: number, rowNum: number) {
  if (rows.length === 0) {
    return [];
  }

  const visibleCount = Math.min(rowNum, rows.length);
  const result: ScrollBoardRow[] = [];
  for (let offset = 0; offset < visibleCount; offset += 1) {
    result.push(rows[(startIndex + offset) % rows.length]);
  }
  return result;
}

function getColumnWidths(config: ScrollBoardConfig, totalWidth: number, columnCount: number) {
  const provided = config.columnWidth.slice(0, columnCount);
  const usedWidth = provided.reduce((sum, value) => sum + value, 0);
  const autoColumnCount = Math.max(columnCount - provided.length, 1);
  const autoWidth = Math.max((totalWidth - usedWidth) / autoColumnCount, 72);
  const widths = new Array(columnCount).fill(autoWidth) as number[];

  provided.forEach((width, index) => {
    widths[index] = width;
  });

  return widths;
}

export function ScrollBoardRender({ widget, width, height }: ScrollBoardRenderProps) {
  const config = getConfig(widget);
  const preparedRows = React.useMemo(() => getPreparedRows(config), [config]);
  const [scrollIndex, setScrollIndex] = React.useState(0);

  React.useEffect(() => {
    setScrollIndex(0);
  }, [config.carousel, config.index, config.rowNum, config.dataset.rows, config.dataset.header]);

  React.useEffect(() => {
    if (preparedRows.length <= config.rowNum) {
      return;
    }

    const step = config.carousel === "page" ? config.rowNum : 1;
    const timer = window.setInterval(() => {
      setScrollIndex((current) => (current + step) % preparedRows.length);
    }, Math.max(config.waitTime, 1) * 1000);

    return () => window.clearInterval(timer);
  }, [config.carousel, config.rowNum, config.waitTime, preparedRows.length]);

  const header = React.useMemo(
    () => (config.index ? [config.indexHeader, ...config.dataset.header] : config.dataset.header),
    [config.dataset.header, config.index, config.indexHeader],
  );
  const visibleRows = React.useMemo(
    () => getVisibleRows(preparedRows, scrollIndex, config.rowNum),
    [config.rowNum, preparedRows, scrollIndex],
  );
  const columnCount = Math.max(
    header.length,
    visibleRows[0]?.cells.length ?? preparedRows[0]?.cells.length ?? 0,
  );
  const widths = React.useMemo(
    () => getColumnWidths(config, width - 12, Math.max(columnCount, 1)),
    [columnCount, config, width],
  );
  const aligns = React.useMemo(
    () =>
      new Array(Math.max(columnCount, 1))
        .fill("left")
        .map((_, index) => config.align[index] ?? "left"),
    [columnCount, config.align],
  );
  const bodyHeight = height - (header.length > 0 ? config.headerHeight : 0) - 20;
  const rowHeight = Math.max(bodyHeight / Math.max(config.rowNum, 1), 36);

  return (
    <div className="h-full w-full rounded-[24px] bg-white/88 p-3">
      <div className="h-full overflow-hidden rounded-[20px] border border-[#d7d8d1] bg-[#fafaf5]">
        {header.length > 0 ? (
          <div
            className="flex border-b border-white/10 text-xs font-black uppercase tracking-[0.18em]"
            style={{ height: `${config.headerHeight}px`, background: config.headerBgColor, color: config.headerTextColor }}
          >
            {header.map((item, index) => (
              <div
                key={`${item}-${index}`}
                className={`flex shrink-0 items-center px-3 ${getAlignedClassName(aligns[index] ?? "left")}`}
                style={{ width: `${widths[index] ?? 120}px` }}
              >
                {item}
              </div>
            ))}
          </div>
        ) : null}

        <div className="h-[calc(100%-1px)] overflow-hidden">
          {visibleRows.map((row, rowIndex) => (
            <div
              key={`${row.rowIndex}-${scrollIndex}-${rowIndex}`}
              className="flex border-b border-[#d7d8d1]/70 text-sm transition-colors"
              style={{
                height: `${rowHeight}px`,
                background: row.rowIndex % 2 === 0 ? config.evenRowBgColor : config.oddRowBgColor,
                color: config.textColor,
              }}
            >
              {row.cells.map((cell, cellIndex) => {
                const isIndexCell = config.index && cellIndex === 0;
                return (
                  <div
                    key={`${row.rowIndex}-${cellIndex}`}
                    className={`flex shrink-0 items-center px-3 ${getAlignedClassName(aligns[cellIndex] ?? "left")}`}
                    style={{ width: `${widths[cellIndex] ?? 120}px` }}
                  >
                    {isIndexCell ? (
                      <span
                        className="inline-flex min-w-8 items-center justify-center rounded-full px-2 py-1 text-xs font-black text-white"
                        style={{ background: config.accentColor }}
                      >
                        {cell}
                      </span>
                    ) : (
                      <span className="truncate">{cell}</span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}

          {visibleRows.length === 0 ? (
            <div className="flex h-full items-center justify-center px-6 text-sm text-[#727971]">
              当前没有可展示的数据行，请先在右侧面板补充表头与行数据。
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
