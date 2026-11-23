"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const HeroCanvas = dynamic(() => import("./HeroCanvas"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center">
      <div className="w-40 h-40 rounded-full bg-gradient-to-tr from-sky-300/60 via-sky-200/50 to-yellow-200/70 blur-xl animate-pulse" />
    </div>
  ),
});

export function HeroScene() {
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

  if (!allowWebGL) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="w-52 h-52 rounded-full bg-gradient-to-tr from-sky-400/50 via-sky-200/60 to-yellow-300/60 border border-white/70 shadow-2xl backdrop-blur-md" />
      </div>
    );
  }

  return <HeroCanvas />;
}
