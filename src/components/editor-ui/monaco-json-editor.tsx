"use client";

import dynamic from "next/dynamic";

import { cn } from "@/lib/utils";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-[220px] items-center justify-center rounded-2xl border border-[#d7d8d1] bg-[#f7f8f2] text-sm text-[#727971]">
      Monaco 编辑器加载中...
    </div>
  ),
});

type MonacoJsonEditorProps = {
  className?: string;
  height?: number;
  language?: "json" | "javascript" | "sql" | "typescript";
  onValueChange?: (value: string) => void;
  readOnly?: boolean;
  value: string;
};

export function MonacoJsonEditor({
  className,
  height = 260,
  language = "json",
  onValueChange,
  readOnly = false,
  value,
}: MonacoJsonEditorProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-[#d7d8d1] bg-[#fbfcf8] shadow-[0_10px_24px_rgba(26,28,25,0.04)]",
        className,
      )}
    >
      <MonacoEditor
        height={height}
        defaultLanguage={language}
        language={language}
        value={value}
        theme="vs"
        onChange={(nextValue) => onValueChange?.(nextValue ?? "")}
        options={{
          automaticLayout: true,
          contextmenu: false,
          fontSize: 13,
          glyphMargin: false,
          lineNumbers: "on",
          minimap: { enabled: false },
          padding: { top: 16, bottom: 12 },
          readOnly,
          renderLineHighlight: "line",
          roundedSelection: true,
          scrollBeyondLastLine: false,
          scrollbar: {
            alwaysConsumeMouseWheel: false,
            horizontalScrollbarSize: 10,
            verticalScrollbarSize: 10,
          },
          tabSize: 2,
          wordWrap: "on",
        }}
      />
    </div>
  );
}
