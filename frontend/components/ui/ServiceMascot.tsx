"use client";

import { motion, useReducedMotion } from "framer-motion";

/**
 * Maskot "Si Berkas": lembar surat ramah bergaya 3D tanah liat (clay) yang membawa kaca pembesar.
 * Dibuat sebagai SVG murni (tanpa berkas gambar) sehingga ringan, tajam di layar apa pun,
 * dan warnanya mengikuti palet situs (biru langit & kuning).
 */
export function ServiceMascot({ className = "" }: { className?: string }) {
  const reduce = useReducedMotion();
  const float = (dy: number, dur: number, delay = 0) =>
    reduce
      ? {}
      : { animate: { y: [0, -dy, 0] }, transition: { duration: dur, repeat: Infinity, ease: "easeInOut" as const, delay } };

  return (
    <svg
      viewBox="0 0 560 470"
      className={className}
      aria-hidden="true"
      focusable="false"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="mc-paper" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.65" stopColor="#eaf2ff" />
          <stop offset="1" stopColor="#c9dcff" />
        </linearGradient>
        <linearGradient id="mc-side" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#1e3a8a" stopOpacity="0" />
          <stop offset="0.7" stopColor="#1e3a8a" stopOpacity="0" />
          <stop offset="1" stopColor="#1e3a8a" stopOpacity="0.16" />
        </linearGradient>
        <linearGradient id="mc-fold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff3b0" />
          <stop offset="1" stopColor="#f6b73c" />
        </linearGradient>
        <linearGradient id="mc-yellow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffe27a" />
          <stop offset="1" stopColor="#f59e0b" />
        </linearGradient>
        <linearGradient id="mc-blue" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#60a5fa" />
          <stop offset="1" stopColor="#1d4ed8" />
        </linearGradient>
        <linearGradient id="mc-green" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#6ee7b7" />
          <stop offset="1" stopColor="#059669" />
        </linearGradient>
        <radialGradient id="mc-disc" cx="0.5" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#bfdbfe" />
          <stop offset="1" stopColor="#3b82f6" />
        </radialGradient>
        <radialGradient id="mc-glass" cx="0.35" cy="0.3" r="0.9">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.85" />
          <stop offset="1" stopColor="#bfdbfe" stopOpacity="0.25" />
        </radialGradient>
        <filter id="mc-drop" x="-30%" y="-30%" width="160%" height="170%">
          <feDropShadow dx="0" dy="10" stdDeviation="9" floodColor="#1e3a8a" floodOpacity="0.28" />
        </filter>
        <filter id="mc-drop-s" x="-30%" y="-30%" width="160%" height="170%">
          <feDropShadow dx="0" dy="5" stdDeviation="5" floodColor="#1e3a8a" floodOpacity="0.25" />
        </filter>
        <filter id="mc-blur" x="-20%" y="-50%" width="140%" height="200%">
          <feGaussianBlur stdDeviation="9" />
        </filter>
      </defs>

      {/* awan latar */}
      <g fill="#ffffff" opacity="0.85">
        <ellipse cx="120" cy="86" rx="62" ry="24" />
        <ellipse cx="160" cy="70" rx="44" ry="26" />
        <ellipse cx="470" cy="392" rx="58" ry="20" />
        <ellipse cx="505" cy="378" rx="38" ry="20" />
      </g>

      {/* bayangan & cakram pijakan */}
      <ellipse cx="280" cy="428" rx="170" ry="20" fill="#1e3a8a" opacity="0.28" filter="url(#mc-blur)" />
      <ellipse cx="280" cy="410" rx="178" ry="34" fill="url(#mc-disc)" />
      <ellipse cx="280" cy="403" rx="150" ry="22" fill="#ffffff" opacity="0.28" />

      {/* amplop melayang (kiri bawah) */}
      <motion.g {...float(8, 3.4, 0.6)}>
        <g transform="rotate(-10 92 318)" filter="url(#mc-drop-s)">
          <rect x="52" y="288" width="86" height="60" rx="12" fill="url(#mc-yellow)" />
          <path d="M56 296 L95 326 L134 296" fill="none" stroke="#fff7d1" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="52" y="288" width="86" height="14" rx="7" fill="#fff" opacity="0.25" />
        </g>
      </motion.g>

      {/* lencana centang (kiri atas) */}
      <motion.g {...float(10, 3.8)}>
        <g filter="url(#mc-drop)">
          <circle cx="106" cy="150" r="40" fill="url(#mc-green)" />
          <circle cx="106" cy="150" r="40" fill="none" stroke="#ffffff" strokeOpacity="0.55" strokeWidth="4" />
          <path d="M88 151 L102 166 L127 135" fill="none" stroke="#ffffff" strokeWidth="11" strokeLinecap="round" strokeLinejoin="round" />
          <ellipse cx="92" cy="128" rx="16" ry="8" fill="#ffffff" opacity="0.4" transform="rotate(-30 92 128)" />
        </g>
      </motion.g>

      {/* ubin QR (kanan atas) */}
      <motion.g {...float(9, 4.2, 0.3)}>
        <g transform="rotate(9 468 100)" filter="url(#mc-drop)">
          <rect x="424" y="56" width="88" height="88" rx="18" fill="#ffffff" />
          <rect x="424" y="56" width="88" height="88" rx="18" fill="url(#mc-side)" />
          <g fill="#1d4ed8">
            <rect x="438" y="70" width="22" height="22" rx="5" />
            <rect x="476" y="70" width="22" height="22" rx="5" />
            <rect x="438" y="108" width="22" height="22" rx="5" />
            <rect x="470" y="104" width="10" height="10" rx="2.5" />
            <rect x="486" y="112" width="12" height="12" rx="3" />
            <rect x="470" y="120" width="10" height="10" rx="2.5" />
          </g>
          <g fill="#ffffff">
            <rect x="445" y="77" width="8" height="8" rx="2" />
            <rect x="483" y="77" width="8" height="8" rx="2" />
            <rect x="445" y="115" width="8" height="8" rx="2" />
          </g>
        </g>
      </motion.g>

      {/* tokoh utama */}
      <motion.g {...float(12, 3.2, 0.1)}>
        {/* kaki */}
        <g filter="url(#mc-drop-s)">
          <rect x="224" y="336" width="34" height="58" rx="17" fill="url(#mc-yellow)" />
          <rect x="302" y="336" width="34" height="58" rx="17" fill="url(#mc-yellow)" />
          <ellipse cx="238" cy="396" rx="30" ry="15" fill="url(#mc-blue)" />
          <ellipse cx="322" cy="396" rx="30" ry="15" fill="url(#mc-blue)" />
          <ellipse cx="230" cy="391" rx="14" ry="5" fill="#fff" opacity="0.4" />
          <ellipse cx="314" cy="391" rx="14" ry="5" fill="#fff" opacity="0.4" />
        </g>

        {/* lengan kiri: melambai */}
        <motion.g
          style={{ transformOrigin: "196px 238px" }}
          animate={reduce ? undefined : { rotate: [0, -14, 4, -14, 0] }}
          transition={reduce ? undefined : { duration: 2.8, repeat: Infinity, ease: "easeInOut", repeatDelay: 1.2 }}
        >
          <path d="M196 238 C160 236 140 214 136 178" fill="none" stroke="url(#mc-yellow)" strokeWidth="26" strokeLinecap="round" />
          <circle cx="135" cy="168" r="23" fill="url(#mc-yellow)" filter="url(#mc-drop-s)" />
          <ellipse cx="128" cy="160" rx="9" ry="6" fill="#fff" opacity="0.5" />
        </motion.g>

        {/* badan: lembar surat */}
        <g filter="url(#mc-drop)">
          <rect x="190" y="104" width="180" height="248" rx="42" fill="url(#mc-paper)" />
          <rect x="190" y="104" width="180" height="248" rx="42" fill="url(#mc-side)" />
          <path d="M318 104 H328 C351 104 370 123 370 146 V156 Z" fill="url(#mc-fold)" />
          <path d="M318 104 L370 156 H340 C327 156 318 147 318 134 Z" fill="#ffffff" opacity="0.35" />
          <ellipse cx="226" cy="130" rx="26" ry="11" fill="#ffffff" opacity="0.85" transform="rotate(-24 226 130)" />
        </g>

        {/* wajah */}
        <g>
          <ellipse cx="246" cy="196" rx="12" ry="16" fill="#172554" />
          <ellipse cx="314" cy="196" rx="12" ry="16" fill="#172554" />
          <circle cx="250" cy="190" r="4.6" fill="#ffffff" />
          <circle cx="318" cy="190" r="4.6" fill="#ffffff" />
          <ellipse cx="224" cy="224" rx="14" ry="8" fill="#fb923c" opacity="0.4" />
          <ellipse cx="336" cy="224" rx="14" ry="8" fill="#fb923c" opacity="0.4" />
          <path d="M262 218 Q280 242 298 218" fill="none" stroke="#172554" strokeWidth="6" strokeLinecap="round" />
        </g>

        {/* garis teks pada lembar */}
        <g fill="#b9cffa">
          <rect x="226" y="268" width="108" height="11" rx="5.5" />
          <rect x="226" y="290" width="84" height="11" rx="5.5" />
          <rect x="226" y="312" width="96" height="11" rx="5.5" />
        </g>

        {/* lengan kanan + kaca pembesar */}
        <motion.g
          style={{ transformOrigin: "366px 252px" }}
          animate={reduce ? undefined : { rotate: [0, 5, 0, -3, 0] }}
          transition={reduce ? undefined : { duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <path d="M366 252 C392 258 408 270 414 290" fill="none" stroke="url(#mc-yellow)" strokeWidth="26" strokeLinecap="round" />
          <g filter="url(#mc-drop-s)">
            <line x1="420" y1="286" x2="452" y2="246" stroke="#d97706" strokeWidth="16" strokeLinecap="round" />
            <line x1="424" y1="282" x2="450" y2="250" stroke="#fbbf24" strokeWidth="6" strokeLinecap="round" />
            <circle cx="486" cy="206" r="50" fill="url(#mc-glass)" />
            <circle cx="486" cy="206" r="50" fill="none" stroke="url(#mc-blue)" strokeWidth="14" />
            <path d="M458 188 A34 34 0 0 1 482 170" fill="none" stroke="#ffffff" strokeWidth="7" strokeLinecap="round" opacity="0.9" />
          </g>
          <circle cx="414" cy="290" r="22" fill="url(#mc-yellow)" filter="url(#mc-drop-s)" />
          <ellipse cx="408" cy="282" rx="8" ry="5.5" fill="#fff" opacity="0.5" />
        </motion.g>
      </motion.g>

      {/* kilau */}
      {[
        { x: 62, y: 226, s: 1, d: 0 },
        { x: 512, y: 300, s: 0.8, d: 0.9 },
        { x: 400, y: 36, s: 0.9, d: 0.4 },
        { x: 168, y: 40, s: 0.7, d: 1.3 },
      ].map((p, i) => (
        <g key={i} transform={`translate(${p.x} ${p.y}) scale(${p.s})`}>
          <motion.path
            d="M0 -14 C2 -4 4 -2 14 0 C4 2 2 4 0 14 C-2 4 -4 2 -14 0 C-4 -2 -2 -4 0 -14 Z"
            fill={i % 2 ? "#ffffff" : "#fde047"}
            animate={reduce ? undefined : { opacity: [0.25, 1, 0.25], scale: [0.85, 1.15, 0.85] }}
            transition={reduce ? undefined : { duration: 2.6, repeat: Infinity, delay: p.d, ease: "easeInOut" }}
            style={{ transformBox: "fill-box", transformOrigin: "center" }}
          />
        </g>
      ))}
    </svg>
  );
}
