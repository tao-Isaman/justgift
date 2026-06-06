import type { TargetAndTransition, Transition } from "motion/react";
import type { AlertAnimation, AlertPosition } from "@/lib/supabase/types";

export type AnimConfig = {
  initial: TargetAndTransition;
  animate: TargetAndTransition;
  exit: TargetAndTransition;
  transition: Transition;
};

/** Entrance/exit animation per alert style. */
export const ALERT_VARIANTS: Record<AlertAnimation, AnimConfig> = {
  slide: {
    initial: { opacity: 0, y: -44, scale: 0.95 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: -24, scale: 0.97 },
    transition: { type: "spring", stiffness: 260, damping: 22 },
  },
  zoom: {
    initial: { opacity: 0, scale: 0.45 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.7 },
    transition: { type: "spring", stiffness: 320, damping: 18 },
  },
  flip: {
    initial: { opacity: 0, rotateX: 90 },
    animate: { opacity: 1, rotateX: 0 },
    exit: { opacity: 0, rotateX: -70 },
    transition: { duration: 0.55, ease: "easeOut" },
  },
  glitch: {
    initial: { opacity: 0, x: -16, skewX: 10 },
    animate: { opacity: 1, x: [16, -10, 6, 0], skewX: [-8, 5, -2, 0] },
    exit: { opacity: 0, x: 14, skewX: -8 },
    transition: { duration: 0.5 },
  },
};

export function positionClass(position: AlertPosition): string {
  switch (position) {
    case "top-left":
      return "top-10 left-10";
    case "top-right":
      return "top-10 right-10";
    case "center":
      return "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2";
    case "top-center":
    default:
      return "top-16 left-1/2 -translate-x-1/2";
  }
}

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

/**
 * Play the configured sound (URL) or a synthesized chime fallback so every
 * plan gets audio. Browser-only.
 */
export function playAlertSound(
  soundUrl: string | null | undefined,
  volume: number,
  big: boolean
) {
  const vol = clamp01(volume);
  if (vol <= 0) return;
  try {
    if (soundUrl) {
      const audio = new Audio(soundUrl);
      audio.volume = vol;
      audio.play().catch(() => {});
      return;
    }
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const now = ctx.currentTime;
    const notes = big ? [523.25, 659.25, 783.99, 1046.5] : [659.25, 987.77];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.value = freq;
      const t = now + i * 0.11;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(vol * 0.3, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.4);
    });
    window.setTimeout(() => {
      ctx.close().catch(() => {});
    }, big ? 1400 : 900);
  } catch {
    // ignore — autoplay may be blocked outside OBS
  }
}

export function buildTtsText(
  name: string,
  amount: number,
  message?: string | null
) {
  const base = `${name} โดเนท ${Math.round(amount)} บาท`;
  return message ? `${base} ${message}` : base;
}

const clampRate = (r: number) => Math.min(2, Math.max(0.5, r || 1));

/** Split text into <=180-char chunks (TTS endpoints cap length). Cuts at a
 *  space when possible, else hard-cuts (Thai has no inter-word spaces). */
function chunkText(text: string, max = 180): string[] {
  const out: string[] = [];
  let rest = text.trim();
  while (rest.length > max) {
    let cut = rest.lastIndexOf(" ", max);
    if (cut <= 0) cut = max;
    out.push(rest.slice(0, cut).trim());
    rest = rest.slice(cut).trim();
  }
  if (rest) out.push(rest);
  return out;
}

function ttsUrl(text: string, lang: string): string {
  const tl = (lang || "th").slice(0, 2);
  // Same-origin proxy (see app/api/tts) — reliable inside OBS + browsers.
  return `/api/tts?lang=${tl}&text=${encodeURIComponent(text)}`;
}

function playOnce(url: string, vol: number, rate: number): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const a = new Audio(url);
      a.volume = vol;
      a.playbackRate = clampRate(rate);
      a.onended = () => resolve();
      a.onerror = () => reject(new Error("tts audio error"));
      a.play().catch(reject);
    } catch (e) {
      reject(e);
    }
  });
}

/** Last-resort browser TTS (works in normal browsers, not in OBS/CEF). */
function speakWebSpeech(text: string, lang: string, rate: number, vol: number) {
  try {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang || "th-TH";
    u.rate = clampRate(rate);
    u.volume = vol;
    const voices = window.speechSynthesis.getVoices();
    const match = voices.find((v) =>
      v.lang?.toLowerCase().startsWith((lang || "th").slice(0, 2))
    );
    if (match) u.voice = match;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  } catch {
    // ignore
  }
}

/**
 * Speak a donation. Uses audio-based TTS first because it plays through a real
 * <audio> element, which works inside OBS's browser source (CEF ships no Web
 * Speech voices). Falls back to the Web Speech API if the audio fails.
 */
export async function speakDonation(
  text: string,
  lang: string,
  rate: number,
  volume: number
) {
  const vol = clamp01(volume);
  if (vol <= 0 || !text || typeof window === "undefined") return;
  try {
    for (const chunk of chunkText(text)) {
      await playOnce(ttsUrl(chunk, lang), vol, rate);
    }
  } catch {
    speakWebSpeech(text, lang, rate, vol);
  }
}

export type ConfettiPiece = {
  id: number;
  left: number;
  delay: number;
  duration: number;
  rotate: number;
  drift: number;
  size: number;
  color: string;
};

export function confettiPieces(colors: string[], count = 64): ConfettiPiece[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 0.25,
    duration: 1.6 + Math.random() * 1.3,
    rotate: Math.random() * 360,
    drift: (Math.random() - 0.5) * 320,
    size: 6 + Math.random() * 8,
    color: colors[i % colors.length],
  }));
}
