import React, { useState } from "react";

export function CollapseSection({ 
  title, 
  defaultOpen = true, 
  children 
}: { 
  title: string; 
  defaultOpen?: boolean; 
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-[#d7d8d1]">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between py-3 px-4 bg-[#fafaf5] hover:bg-[#eef2ea] transition-colors focus:outline-none"
      >
        <span className="text-sm font-bold text-[#1a1c19]">{title}</span>
        {/* 指示箭头 */}
        <svg 
          className={`w-4 h-4 text-[#727971] transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} 
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div 
        className={`overflow-hidden transition-all duration-300 ${isOpen ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"}`}
      >
        <div className="p-4 bg-[#fafaf5] pt-1">
          {children}
        </div>
      </div>
    </div>
  );
}
