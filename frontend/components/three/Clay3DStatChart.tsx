"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const ClayStatChartCanvas = dynamic(() => import("./ClayStatChartCanvas"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-48 rounded-2xl bg-sky-100/60 animate-pulse flex items-center justify-center text-xs text-sky-700">
      Memuat grafik 3D interaktif...
    </div>
  ),
});

interface StatItem {
  label: string;
  value: number;
  color: string;
  unit?: string;
}

interface Clay3DStatChartProps {
  stats?: StatItem[];
  className?: string;
}

export function Clay3DStatChart({ stats, className = "" }: Clay3DStatChartProps) {
  const [allowWebGL, setAllowWebGL] = useState(true);

  useEffect(() => {
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    if (reduced) {
      setAllowWebGL(false);
      return;
    }
    try {
      const canvas = document.createElement("canvas");
      const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
      if (!gl) setAllowWebGL(false);
    } catch {
      setAllowWebGL(false);
    }
  }, []);

  const defaultStats: StatItem[] = [
    { label: "Pertanian", value: 85, color: "#22c55e", unit: "Ton" },
    { label: "Perikanan", value: 92, color: "#0ea5e9", unit: "Ton" },
    { label: "Perkebunan", value: 68, color: "#eab308", unit: "Ton" },
    { label: "UMKM", value: 74, color: "#a855f7", unit: "Unit" },
  ];

  const data = stats && stats.length > 0 ? stats : defaultStats;

  if (!allowWebGL) {
    return (
      <div className={`p-4 rounded-2xl bg-white/70 border border-sky-200 ${className}`}>
        <div className="grid grid-cols-4 gap-2 text-center">
          {data.map((d) => (
            <div key={d.label} className="p-2 rounded-xl bg-sky-50">
              <div className="text-[10px] text-slate-500">{d.label}</div>
              <div className="text-base font-extrabold text-sky-700">{d.value}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`relative h-56 w-full ${className}`}>
      <ClayStatChartCanvas data={data} />
    </div>
  );
}
