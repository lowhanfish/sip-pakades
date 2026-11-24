/** Flat, multi-colour SVG icons for administrative areas. */
export function AreaIcon({ type, className = "" }: { type: "desa" | "kelurahan" | string; className?: string }) {
  if (type === "kelurahan") {
    return (
      <svg viewBox="0 0 48 48" className={className} fill="none" aria-hidden="true">
        <ellipse cx="24" cy="43" rx="18" ry="2.6" fill="#bae6fd" opacity="0.7" />
        {/* flag */}
        <rect x="23.4" y="1.5" width="1.4" height="8" rx="0.7" fill="#64748b" />
        <path d="M24.8 2 L32 4.2 L24.8 6.4 Z" fill="#f97316" />
        {/* pediment + body */}
        <path d="M6 18.5 L24 8 L42 18.5 Z" fill="#0ea5e9" />
        <path d="M6 18.5 L24 8 L42 18.5 L42 20 L6 20 Z" fill="#0284c7" opacity="0.35" />
        <rect x="9" y="20" width="30" height="19" rx="1.5" fill="#e0f2fe" />
        {/* columns */}
        <rect x="12" y="21" width="3.4" height="18" rx="1" fill="#ffffff" />
        <rect x="20" y="21" width="3.4" height="18" rx="1" fill="#ffffff" />
        <rect x="28" y="21" width="3.4" height="18" rx="1" fill="#ffffff" />
        <rect x="35" y="21" width="2.4" height="18" rx="1" fill="#ffffff" />
        {/* door */}
        <path d="M21.2 39 V31 a2.8 2.8 0 0 1 5.6 0 V39 Z" fill="#fb923c" />
        {/* steps */}
        <rect x="6" y="39" width="36" height="2.4" rx="1.2" fill="#94a3b8" />
        <rect x="8.5" y="41.4" width="31" height="1.8" rx="0.9" fill="#cbd5e1" />
        {/* round window */}
        <circle cx="24" cy="15.2" r="1.7" fill="#fff" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 48 48" className={className} fill="none" aria-hidden="true">
      <ellipse cx="24" cy="43" rx="19" ry="2.6" fill="#bbf7d0" opacity="0.8" />
      {/* tree */}
      <rect x="35.2" y="29" width="2.6" height="13" rx="1.2" fill="#a16207" />
      <circle cx="36.5" cy="24" r="7.4" fill="#22c55e" />
      <circle cx="32.8" cy="27.6" r="4.6" fill="#16a34a" />
      <circle cx="39.8" cy="27" r="3.8" fill="#4ade80" />
      {/* house */}
      <rect x="6.5" y="23" width="23" height="19" rx="2" fill="#fff7ed" />
      <path d="M3.5 24.5 L18 10.5 L32.5 24.5 Z" fill="#f97316" />
      <path d="M3.5 24.5 L18 10.5 L32.5 24.5 L30.8 24.5 L18 12.8 L5.2 24.5 Z" fill="#ea580c" opacity="0.5" />
      <rect x="14.2" y="30" width="7.6" height="12" rx="1.6" fill="#0ea5e9" />
      <circle cx="20" cy="36.2" r="0.8" fill="#e0f2fe" />
      <rect x="8.6" y="27.4" width="4" height="4" rx="0.9" fill="#7dd3fc" />
      <rect x="23.4" y="27.4" width="4" height="4" rx="0.9" fill="#7dd3fc" />
    </svg>
  );
}
