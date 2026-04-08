"use client";

import React from "react";

export function EditorWorkbench() {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#fafaf5] text-[#1a1c19]">
      {/* 顶部工具栏 (Header) */}
      <header className="flex h-14 items-center justify-between border-b border-[#d7d8d1] bg-[#fafaf5] px-6 shadow-sm z-20">
        <div className="flex items-center gap-4">
          <div className="font-black tracking-wider text-[#23422a]">JAMINVIEW</div>
          <span className="rounded bg-[#23422a]/10 px-2 py-0.5 text-xs font-bold text-[#23422a]">V2</span>
        </div>
        <div className="flex items-center gap-2">
          {/* 这里后续放 预览/保存/发布 按钮 */}
        </div>
      </header>

      {/* 编辑器主体三段式布局 */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* 左侧区域：Rail + 组件池抽屉 (Left Sidebar) */}
        <aside className="z-10 flex w-72 flex-col border-r border-[#d7d8d1] bg-[#fafaf5] shadow-[2px_0_12px_rgba(26,28,25,0.02)]">
          <div className="p-4 border-b border-[#d7d8d1]/50">
            <h2 className="text-sm font-bold text-[#1a1c19]">页面结构组</h2>
          </div>
          <div className="flex-1 p-4 flex items-center justify-center">
            <span className="text-xs text-[#727971]">左侧组件池区域待重构</span>
          </div>
        </aside>

        {/* 中间画布区域 (Canvas Workspace) */}
        <main className="relative flex-1 overflow-hidden bg-[#eef2ea]">
          {/* 标尺占位 */}
          <div className="absolute top-0 left-0 right-0 h-6 bg-[#fafaf5] border-b border-[#d7d8d1] z-10" />
          <div className="absolute top-0 left-0 bottom-0 w-6 bg-[#fafaf5] border-r border-[#d7d8d1] z-10" />
          
          {/* 缩放中心区 */}
          <div className="absolute inset-0 flex items-center justify-center overflow-auto pt-6 pl-6">
            <div 
              className="relative bg-white shadow-xl ring-1 ring-[#c2c8bf]/30"
              style={{ width: 1920, height: 1080, transform: "scale(0.35)", transformOrigin: "center" }}
            >
              {/* 画布网格背景（可选） */}
              <div className="absolute inset-0 bg-[radial-gradient(#c2c8bf_1px,transparent_1px)] [background-size:20px_20px] opacity-30" />
              <div className="flex h-full w-full items-center justify-center font-bold text-[#727971]/30 text-4xl tracking-widest">
                V2 画布准备就绪
              </div>
            </div>
          </div>
        </main>

        {/* 右侧属性配置区域 (Right Configuration Panel) */}
        <aside className="z-10 flex w-[320px] flex-col border-l border-[#d7d8d1] bg-[#fafaf5] shadow-[-2px_0_12px_rgba(26,28,25,0.02)]">
          {/* 四大 Tab Header */}
          <div className="flex h-12 border-b border-[#d7d8d1]">
            {["定制", "动画", "数据", "事件"].map((tab, idx) => (
              <button 
                key={tab} 
                className={`flex-1 text-sm font-medium transition-colors ${idx === 0 ? "border-b-2 border-[#23422a] text-[#23422a]" : "text-[#727971] hover:text-[#1a1c19]"}`}
              >
                {tab}
              </button>
            ))}
          </div>
          
          {/* 右侧面板主体内容 */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col items-center justify-center">
             <span className="text-xs text-[#727971]">请点击选中画布中的组件</span>
          </div>
        </aside>

      </div>
    </div>
  );
}
