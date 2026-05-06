"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

export default function PageLoader() {
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    // Start fade-out after 1.8s
    const fadeTimer = setTimeout(() => setFading(true), 1800);
    // Remove from DOM after fade completes (300ms transition)
    const hideTimer = setTimeout(() => setVisible(false), 2100);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      style={{ opacity: fading ? 0 : 1, transition: "opacity 0.3s ease" }}
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#0f1117]"
    >
      {/* Logo */}
      <div className="mb-8 flex items-center gap-3">
        <Image src="/favi.svg" alt="Alvarado" width={44} height={44} priority />
        <span className="text-xl font-semibold tracking-wide text-white">
          Alvarado Associate Partners
        </span>
      </div>

      {/* Spinner */}
      <div className="mb-6 h-10 w-10 animate-spin rounded-full border-4 border-white/20 border-t-white" />

      {/* Progress bar */}
      <div className="w-64 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-1 rounded-full bg-white"
          style={{ animation: "cfProgress 1.8s ease-out forwards" }}
        />
      </div>

      <p className="mt-5 text-sm text-white/50 tracking-wider">
        Verifying your connection...
      </p>

      <style>{`
        @keyframes cfProgress {
          from { width: 0%; }
          to   { width: 100%; }
        }
      `}</style>
    </div>
  );
}
