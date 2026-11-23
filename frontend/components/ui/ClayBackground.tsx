export function ClayBackground() {
  return (
    <div className="clay-ambient-bg" aria-hidden="true">
      {/* 3 Large Soft Floating Clay Blobs */}
      <div className="clay-blob-1" />
      <div className="clay-blob-2" />
      <div className="clay-blob-3" />

      {/* Topographic organic curves SVG overlay */}
      <svg
        className="absolute inset-0 w-full h-full opacity-35 mix-blend-overlay"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 1440 900"
        preserveAspectRatio="none"
      >
        <path
          d="M0,160 C320,300 420,-40 720,120 C1020,280 1120,40 1440,200 L1440,900 L0,900 Z"
          fill="none"
          stroke="rgba(56, 189, 248, 0.28)"
          strokeWidth="1.5"
          strokeDasharray="6 8"
        />
        <path
          d="M0,280 C260,180 520,360 840,220 C1160,80 1260,260 1440,160 L1440,900 L0,900 Z"
          fill="none"
          stroke="rgba(96, 165, 250, 0.22)"
          strokeWidth="1.5"
        />
        <path
          d="M0,420 C360,320 600,520 960,380 C1200,280 1340,440 1440,360 L1440,900 L0,900 Z"
          fill="none"
          stroke="rgba(14, 165, 233, 0.18)"
          strokeWidth="1.5"
          strokeDasharray="4 6"
        />
        <path
          d="M0,580 C280,680 540,480 820,620 C1100,760 1280,560 1440,640 L1440,900 L0,900 Z"
          fill="none"
          stroke="rgba(147, 197, 253, 0.25)"
          strokeWidth="1.2"
        />
      </svg>
    </div>
  );
}
