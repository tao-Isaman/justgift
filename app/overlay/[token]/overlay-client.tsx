"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { createClient } from "@/lib/supabase/client";
import { parseYouTubeId } from "@/lib/media";
import { AlertCard } from "@/components/alert-card";
import { Confetti } from "@/components/confetti";
import { YouTubeMedia } from "@/components/youtube-media";
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
  const mediaActiveRef = useRef(false);
  const mediaTimerRef = useRef<number | null>(null);
  const playNextRef = useRef<() => void>(() => {});
  const endRef = useRef<() => void>(() => {});

  const end = useCallback(() => {
    if (mediaTimerRef.current) {
      window.clearTimeout(mediaTimerRef.current);
      mediaTimerRef.current = null;
    }
    mediaActiveRef.current = false;
    setMedia(null);
    showingRef.current = false;
    window.setTimeout(() => playNextRef.current(), 500);
  }, []);

  const playNext = useCallback(() => {
    if (showingRef.current) return;
    const next = queueRef.current.shift();
    if (!next) return;

    showingRef.current = true;
    setMedia(null);
    setCurrent(next);

    const big = next.amount >= defaults.bigThreshold && defaults.bigEffect;
    const duration = Math.round(
      (next.durationMs ?? defaults.durationMs) * (big ? 1.5 : 1)
    );

    playAlertSound(next.soundUrl ?? defaults.soundUrl, defaults.soundVolume, big);

    const ttsOn = next.ttsEnabled ?? defaults.ttsEnabled;
    if (ttsOn) {
      speakDonation(
        buildTtsText(next.donorName, next.amount, next.message),
        next.ttsVoice ?? defaults.ttsVoice ?? "th-TH",
        defaults.ttsRate,
        defaults.ttsVolume
      );
    }

    window.setTimeout(() => {
      setCurrent(null);
      if (next.mediaUrl) {
        const secs = Math.min(120, Math.max(5, Number(next.mediaSeconds ?? 30)));
        mediaActiveRef.current = true;
        setMedia({ url: next.mediaUrl, key: next.id });
        mediaTimerRef.current = window.setTimeout(
          () => endRef.current(),
          secs * 1000
        );
      } else {
        endRef.current();
      }
    }, duration);
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
        if (mediaActiveRef.current) endRef.current();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [token, playNext]);

  const big =
    !!current && current.amount >= defaults.bigThreshold && defaults.bigEffect;
  const mediaId = media ? parseYouTubeId(media.url) : null;
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
                fontFamily={defaults.fontFamily}
                className={big ? "scale-105 animate-pulse-glow" : undefined}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Media share (YouTube) phase */}
      {media ? (
        <div className="fixed inset-0 grid place-items-center">
          <motion.div
            key={media.key}
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="aspect-video w-[70vw] max-w-4xl overflow-hidden rounded-xl shadow-2xl"
            style={{ boxShadow: `0 0 40px ${accent}66` }}
          >
            {mediaId ? (
              <YouTubeMedia videoId={mediaId} />
            ) : (
              <iframe
                src={media.url}
                title="donation media"
                className="h-full w-full"
                allow="autoplay; encrypted-media"
                referrerPolicy="strict-origin-when-cross-origin"
              />
            )}
          </motion.div>
        </div>
      ) : null}
    </div>
  );
}
