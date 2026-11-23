"use client";

import { motion } from "framer-motion";
import React from "react";

interface Subtle3DCardProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

export function Subtle3DCard({
  children,
  className = "",
  delay = 0,
}: Subtle3DCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.45, delay, ease: "easeOut" }}
      whileHover={{
        y: -5,
        scale: 1.01,
        transition: { type: "spring", stiffness: 320, damping: 22 },
      }}
      className={`glass-panel rounded-3xl transition-shadow hover:shadow-xl hover:shadow-sky-400/20 ${className}`}
    >
      {children}
    </motion.div>
  );
}
