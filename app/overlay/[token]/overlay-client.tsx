"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { createClient } from "@/lib/supabase/client";
import { AlertCard } from "@/components/alert-card";
import type { OverlayAlertPayload } from "@/lib/supabase/types";

type OverlayDefaults = {
  accentColor: string;
  textColor: string;
  imageUrl: string | null;
  soundUrl: string | null;
  durationMs: number;
  ttsEnabled: boolean;
  ttsVoice: string | null;
  watermark: boolean;
};

function speak(text: string, lang: string) {
  try {
    if (!("speechSynthesis" in window)) return;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang || "th-TH";
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  } catch {
    // no-op
  }
}

export function OverlayClient({
  token,
  defaults,
}: {
  token: string;
  defaults: OverlayDefaults;
}) {
  const [current, setCurrent] = useState<OverlayAlertPayload | null>(null);
  const queueRef = useRef<OverlayAlertPayload[]>([]);
  const showingRef = useRef(false);
  const playNextRef = useRef<() => void>(() => {});

  const playNext = useCallback(() => {
    if (showingRef.current) return;
    const next = queueRef.current.shift();
    if (!next) return;

    showingRef.current = true;
    setCurrent(next);

    const duration = next.durationMs ?? defaults.durationMs;

    if (defaults.soundUrl) {
      const audio = new Audio(defaults.soundUrl);
      audio.play().catch(() => {});
    }

    const ttsOn = next.ttsEnabled ?? defaults.ttsEnabled;
    if (ttsOn && next.message) {
      speak(next.message, next.ttsVoice ?? defaults.ttsVoice ?? "th-TH");
    }

    window.setTimeout(() => {
      setCurrent(null);
      showingRef.current = false;
      window.setTimeout(() => playNextRef.current(), 450);
    }, duration);
  }, [defaults]);

  useEffect(() => {
    playNextRef.current = playNext;
  }, [playNext]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`overlay:${token}`, {
        config: { broadcast: { self: false } },
      })
      .on("broadcast", { event: "donation" }, ({ payload }) => {
        queueRef.current.push(payload as OverlayAlertPayload);
        playNext();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [token, playNext]);

  return (
    <div className="fixed inset-0 overflow-hidden">
      <div className="absolute top-16 left-1/2 -translate-x-1/2">
        <AnimatePresence mode="wait">
          {current && (
            <motion.div
              key={current.id}
              initial={{ opacity: 0, y: -36, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.97 }}
              transition={{ type: "spring", stiffness: 260, damping: 22 }}
            >
              <AlertCard
                donorName={current.donorName}
                amount={current.amount}
                message={current.message}
                accentColor={current.accentColor ?? defaults.accentColor}
                textColor={current.textColor ?? defaults.textColor}
                imageUrl={current.imageUrl ?? defaults.imageUrl}
                watermark={defaults.watermark}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
