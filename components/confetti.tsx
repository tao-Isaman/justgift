"use client";

import { useMemo } from "react";
import { confettiPieces } from "@/lib/overlay-fx";

export function Confetti({ colors }: { colors: string[] }) {
  const pieces = useMemo(() => confettiPieces(colors), [colors]);

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      {pieces.map((p) => {
        const style: React.CSSProperties = {
          left: `${p.left}%`,
          width: p.size,
          height: p.size * 0.6,
          background: p.color,
          animationDelay: `${p.delay}s`,
          animationDuration: `${p.duration}s`,
          transform: `rotate(${p.rotate}deg)`,
        };
        (style as Record<string, string>)["--drift"] = `${p.drift}px`;
        return <span key={p.id} className="confetti-piece" style={style} />;
      })}
    </div>
  );
}
