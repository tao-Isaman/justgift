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
  speakDonation,
} from "@/lib/overlay-fx";
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
  ttsRead: string;
  animation: AlertAnimation;
  position: AlertPosition;
  soundVolume: number;
  ttsRate: number;
  ttsVolume: number;
  bigThreshold: number;
  bigEffect: boolean;
  fontFamily: string;
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
  const [media, setMedia] = useState<{ url: string; key: string } | null>(null);

  const queueRef = useRef<OverlayAlertPayload[]>([]);
  const showingRef = useRef(false);
  const timerRef = useRef<number | null>(null);
  const playNextRef = useRef<() => void>(() => {});
  const endRef = useRef<() => void>(() => {});

  const end = useCallback(() => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setCurrent(null);
    setMedia(null);
    showingRef.current = false;
    window.setTimeout(() => playNextRef.current(), 500);
  }, []);

  const playNext = useCallback(() => {
    if (showingRef.current) return;
    const next = queueRef.current.shift();
    if (!next) return;

    showingRef.current = true;
    // Show the alert and the donor GIF at the same time.
    setCurrent(next);
    setMedia(next.mediaUrl ? { url: next.mediaUrl, key: next.id } : null);

    const big = next.amount >= defaults.bigThreshold && defaults.bigEffect;
    const duration = Math.round(
      (next.durationMs ?? defaults.durationMs) * (big ? 1.5 : 1)
    );

    playAlertSound(next.soundUrl ?? defaults.soundUrl, defaults.soundVolume, big);

    const ttsOn = next.ttsEnabled ?? defaults.ttsEnabled;
    if (ttsOn) {
      const readMode = next.ttsRead ?? defaults.ttsRead;
      const text =
        readMode === "message"
          ? (next.message ?? "").trim()
          : buildTtsText(next.donorName, next.amount, next.message);
      if (text) {
        speakDonation(
          text,
          next.ttsVoice ?? defaults.ttsVoice ?? "th-TH",
          defaults.ttsRate,
          defaults.ttsVolume
        );
      }
    }

    timerRef.current = window.setTimeout(() => endRef.current(), duration);
  }, [defaults]);

  useEffect(() => {
    endRef.current = end;
  }, [end]);
  useEffect(() => {
    playNextRef.current = playNext;
  }, [playNext]);

  useEffect(() => {
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
      .on("broadcast", { event: "skip" }, () => {
        if (showingRef.current) endRef.current();
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
    <div className="fixed inset-0 flex items-center justify-center overflow-hidden">
      {current && big ? (
        <Confetti key={current.id} colors={[accent, "#ffffff", "#fbbf24"]} />
      ) : null}

      <div style={{ perspective: 1000 }}>
        <div className="flex flex-col items-center gap-4">
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
                  size="lg"
                  donorName={current.donorName}
                  amount={current.amount}
                  message={current.message}
                  accentColor={accent}
                  textColor={current.textColor ?? defaults.textColor}
                  imageUrl={current.imageUrl ?? defaults.imageUrl}
                  watermark={defaults.watermark}
                  fontFamily={defaults.fontFamily}
                  className={big ? "scale-105 animate-pulse-glow" : undefined}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Donor GIF — smaller, directly below the alert (doesn't block it). */}
          {media ? (
            <motion.img
              key={media.key}
              src={media.url}
              alt=""
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="max-h-72 w-auto max-w-md rounded-xl object-contain"
              style={{ filter: `drop-shadow(0 0 24px ${accent}aa)` }}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
