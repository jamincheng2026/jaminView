"use client";

import { useMemo, useState } from "react";
import { Activity, ArrowUpRight, BarChart3, Database } from "lucide-react";

type HeroStageProps = {
  primaryImage: string;
};

export function HeroStage({ primaryImage }: HeroStageProps) {
  const [tilt, setTilt] = useState({ x: 0, y: 0, glowX: 50, glowY: 45 });

  const transform = useMemo(
    () =>
      `perspective(1800px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) translateZ(0)`,
    [tilt.x, tilt.y],
  );

  return (
    <div
      className="group relative mx-auto hidden h-[460px] w-full max-w-[620px] lg:block"
      onMouseMove={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        const px = (event.clientX - rect.left) / rect.width;
        const py = (event.clientY - rect.top) / rect.height;

        setTilt({
          x: (0.5 - py) * 14,
          y: (px - 0.5) * 18,
          glowX: px * 100,
          glowY: py * 100,
        });
      }}
      onMouseLeave={() => setTilt({ x: 0, y: 0, glowX: 50, glowY: 45 })}
    >
      <div className="absolute inset-0 rounded-[40px] bg-[radial-gradient(circle_at_center,rgba(94,163,104,0.22),transparent_55%)] blur-3xl" />
      <div className="absolute inset-x-10 bottom-5 h-16 rounded-full bg-black/45 blur-2xl" />

      <div
        className="absolute inset-0 transition-transform duration-300 ease-out"
        style={{ transform }}
      >
        <div
          className="absolute inset-0 rounded-[34px] border border-white/10 bg-[linear-gradient(145deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] shadow-[0_40px_120px_rgba(0,0,0,0.45)]"
          style={{
            backgroundImage: `radial-gradient(circle at ${tilt.glowX}% ${tilt.glowY}%, rgba(205,242,196,0.18), transparent 32%), linear-gradient(145deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))`,
          }}
        />

        <div className="absolute inset-5 overflow-hidden rounded-[28px] border border-white/8 bg-[#0e1613] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:30px_30px] opacity-20" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(120,214,139,0.16),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(74,118,86,0.28),transparent_35%)]" />

          <div className="absolute left-6 right-6 top-5 flex items-center justify-between text-[11px] tracking-[0.24em] text-[#d9ead4]/72">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#8cd396]" />
              JAMINVIEW STAGE
            </div>
            <div className="flex items-center gap-2">
              <Activity className="h-3.5 w-3.5" />
              LIVE
            </div>
          </div>

          <div className="absolute left-6 top-16 right-[210px] bottom-6 overflow-hidden rounded-[22px] border border-white/8 bg-[#111b16] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
            <img
              src={primaryImage}
              alt="JaminView interactive data screen"
              className="h-full w-full object-cover opacity-88 transition duration-300 ease-out group-hover:scale-[1.035]"
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,14,12,0.08),rgba(10,14,12,0.28))]" />
            <div className="absolute left-5 right-5 top-5 flex items-center justify-between rounded-full border border-white/10 bg-black/22 px-4 py-2 text-[11px] text-[#f6fbf2]/86 backdrop-blur-md">
              <span className="flex items-center gap-2">
                <BarChart3 className="h-3.5 w-3.5" />
                城市业务监控
              </span>
              <span className="flex items-center gap-2">
                <ArrowUpRight className="h-3.5 w-3.5" />
                L5 场景
              </span>
            </div>
          </div>

          <div
            className="absolute right-6 top-20 w-[190px] rounded-[20px] border border-white/10 bg-[linear-gradient(180deg,rgba(36,56,43,0.98),rgba(19,28,23,0.98))] p-4 text-[#f5faf1] shadow-[0_18px_40px_rgba(0,0,0,0.28)] transition duration-300 ease-out"
            style={{ transform: `translate3d(${tilt.y * 0.9}px, ${tilt.x * -0.8}px, 42px)` }}
          >
            <div className="mb-3 flex items-center justify-between text-[11px] uppercase tracking-[0.2em] text-[#bad8bc]">
              <span>Overview</span>
              <Database className="h-3.5 w-3.5" />
            </div>
            <div className="text-[34px] font-semibold leading-none">92.4%</div>
            <div className="mt-2 text-xs text-[#d2e4d2]">关键指标实时更新</div>
            <div className="mt-5 space-y-3">
              <div>
                <div className="mb-1 flex justify-between text-[11px] text-[#d2e4d2]">
                  <span>场馆接入</span>
                  <span>128</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/10">
                  <div className="h-full w-[78%] rounded-full bg-[#95d48e]" />
                </div>
              </div>
              <div>
                <div className="mb-1 flex justify-between text-[11px] text-[#d2e4d2]">
                  <span>模板就绪</span>
                  <span>74</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/10">
                  <div className="h-full w-[64%] rounded-full bg-[#d5efb7]" />
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
