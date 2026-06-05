"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { createClient } from "@/lib/supabase/client";
import { AlertCard } from "@/components/alert-card";
import { Confetti } from "@/components/confetti";
import {
  ALERT_VARIANTS,
  buildTtsText,
  playAlertSound,
  positionClass,
  speakDonation,
} from "@/lib/overlay-fx";
import { cn } from "@/lib/utils";
import type {
  AlertAnimation,
  AlertPosition,
  OverlayAlertPayload,
} from "@/lib/supabase/types";

export type OverlayDefaults = {
  accentColor: string;
  textColor: string;
  imageUrl: string | null;
  soundUrl: string | null;
  durationMs: number;
  ttsEnabled: boolean;
  ttsVoice: string | null;
  animation: AlertAnimation;
  position: AlertPosition;
  soundVolume: number;
  ttsRate: number;
  ttsVolume: number;
  bigThreshold: number;
  bigEffect: boolean;
  watermark: boolean;
};

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

    const big = next.amount >= defaults.bigThreshold && defaults.bigEffect;
    const duration = Math.round(
      (next.durationMs ?? defaults.durationMs) * (big ? 1.5 : 1)
    );

    playAlertSound(defaults.soundUrl, defaults.soundVolume, big);

    const ttsOn = next.ttsEnabled ?? defaults.ttsEnabled;
    if (ttsOn && next.message) {
      speakDonation(
        buildTtsText(next.donorName, next.amount, next.message),
        next.ttsVoice ?? defaults.ttsVoice ?? "th-TH",
        defaults.ttsRate,
        defaults.ttsVolume
      );
    }

    window.setTimeout(() => {
      setCurrent(null);
      showingRef.current = false;
      window.setTimeout(() => playNextRef.current(), 500);
    }, duration);
  }, [defaults]);

  useEffect(() => {
    playNextRef.current = playNext;
  }, [playNext]);

  useEffect(() => {
    // Warm up TTS voices (some browsers populate them lazily).
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.getVoices();
    }

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

  const big =
    !!current && current.amount >= defaults.bigThreshold && defaults.bigEffect;
  const animation: AlertAnimation = current?.animation ?? defaults.animation;
  const variant = ALERT_VARIANTS[animation];
  const accent = current?.accentColor ?? defaults.accentColor;

  return (
    <div className="fixed inset-0 overflow-hidden">
      {current && big ? (
        <Confetti key={current.id} colors={[accent, "#ffffff", "#fbbf24"]} />
      ) : null}
      <div
        className={cn("absolute", positionClass(defaults.position))}
        style={{ perspective: 1000 }}
      >
        <AnimatePresence mode="wait">
          {current && (
            <motion.div
              key={current.id}
              initial={variant.initial}
              animate={variant.animate}
              exit={variant.exit}
              transition={variant.transition}
            >
              <AlertCard
                donorName={current.donorName}
                amount={current.amount}
                message={current.message}
                accentColor={accent}
                textColor={current.textColor ?? defaults.textColor}
                imageUrl={current.imageUrl ?? defaults.imageUrl}
                watermark={defaults.watermark}
                className={big ? "scale-105 animate-pulse-glow" : undefined}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
