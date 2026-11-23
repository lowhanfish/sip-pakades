import React from "react";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
}

export function GlassCard({ children, className = "" }: GlassCardProps) {
  return (
    <div className={`admin-glass rounded-2xl p-5 ${className}`}>{children}</div>
  );
}
