import React from 'react';

export function NumberStepper({ 
  label, 
  value, 
  onChange, 
  min, 
  max, 
  step = 1 
}: { 
  label: string; 
  value: number; 
  onChange: (v: number) => void; 
  min?: number; 
  max?: number; 
  step?: number;
}) {
  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    if (!isNaN(val)) onChange(val);
  }

  const clamp = (val: number) => {
    if (min !== undefined && val < min) return min;
    if (max !== undefined && val > max) return max;
    return val;
  }

  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-xs font-medium text-[#727971]">{label}</span>
      <div className="flex items-center">
        <button 
          onClick={() => onChange(clamp(value - step))} 
          className="w-6 h-6 flex items-center justify-center rounded-l border border-[#d7d8d1] bg-[#fafaf5] text-[#1a1c19] hover:bg-[#eef2ea] transition-colors focus:outline-none"
        >
          -
        </button>
        <input 
          type="number" 
          value={value} 
          onChange={handleInput}
          min={min}
          max={max}
          className="w-12 h-6 px-1 text-center text-xs border-y border-x-0 border-[#d7d8d1] bg-white text-[#1a1c19] focus:outline-none focus:ring-1 focus:ring-[#23422a] focus:z-10 appearance-none"
          style={{ WebkitAppearance: 'none', margin: 0 }}
        />
        <button 
          onClick={() => onChange(clamp(value + step))} 
          className="w-6 h-6 flex items-center justify-center rounded-r border border-[#d7d8d1] bg-[#fafaf5] text-[#1a1c19] hover:bg-[#eef2ea] transition-colors focus:outline-none"
        >
          +
        </button>
      </div>
    </div>
  );
}
