import React from 'react';

export function ToggleSwitch({ 
  label, 
  checked, 
  onChange 
}: { 
  label: string; 
  checked: boolean; 
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between cursor-pointer py-2">
      <span className="text-xs font-medium text-[#1a1c19]">{label}</span>
      <div className="relative">
        <input 
          type="checkbox" 
          className="sr-only" 
          checked={checked} 
          onChange={(e) => onChange(e.target.checked)} 
        />
        {/* 拨动槽底色跟随品牌色 #23422a */}
        <div className={`block w-8 h-5 rounded-full transition-colors duration-200 ease-in-out ${checked ? 'bg-[#23422a]' : 'bg-[#d7d8d1]'}`}></div>
        {/* 白色圆球滑块 */}
        <div className={`dot absolute left-1 top-1 bg-white w-3 h-3 rounded-full transition-transform duration-200 ease-in-out ${checked ? 'transform translate-x-3' : ''}`}></div>
      </div>
    </label>
  );
}
