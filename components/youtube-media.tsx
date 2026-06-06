"use client";

import { useEffect, useRef } from "react";

// Minimal typings for the YouTube IFrame Player API (avoids `any`).
type YTPlayer = {
  playVideo: () => void;
  mute: () => void;
  unMute: () => void;
  setVolume: (v: number) => void;
  getPlayerState: () => number;
  getIframe: () => HTMLIFrameElement;
  destroy: () => void;
};
type YTPlayerEvent = { target: YTPlayer };
type YTNamespace = {
  Player: new (
    el: HTMLElement,
    opts: {
      width?: string;
      height?: string;
      videoId: string;
      playerVars?: Record<string, number>;
      events?: { onReady?: (e: YTPlayerEvent) => void };
    }
  ) => YTPlayer;
};

declare global {
  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let apiPromise: Promise<void> | null = null;

/** Load the IFrame API script once and resolve when YT.Player is ready. */
function loadYouTubeApi(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.YT?.Player) return Promise.resolve();
  if (apiPromise) return apiPromise;
  apiPromise = new Promise((resolve) => {
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve();
    };
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);
  });
  return apiPromise;
}

/**
 * Autoplaying YouTube player for the overlay. Tries to play unmuted (works in
 * OBS, where autoplay-with-sound is allowed); if the browser blocks it, retries
 * muted so the clip always plays during preview.
 */
export function YouTubeMedia({ videoId }: { videoId: string }) {
  const holderRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);

  useEffect(() => {
    let destroyed = false;
    loadYouTubeApi().then(() => {
      if (destroyed || !holderRef.current || !window.YT) return;
      playerRef.current = new window.YT.Player(holderRef.current, {
        width: "100%",
        height: "100%",
        videoId,
        playerVars: {
          autoplay: 1,
          controls: 0,
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
          fs: 0,
          disablekb: 1,
        },
        events: {
          onReady: (e) => {
            const p = e.target;
            try {
              const f = p.getIframe();
              f.style.width = "100%";
              f.style.height = "100%";
            } catch {
              // ignore
            }
            try {
              p.unMute();
              p.setVolume(100);
            } catch {
              // ignore
            }
            p.playVideo();
            // Browser autoplay-with-sound may be blocked — retry muted.
            window.setTimeout(() => {
              try {
                if (p.getPlayerState() !== 1 /* PLAYING */) {
                  p.mute();
                  p.playVideo();
                }
              } catch {
                // ignore
              }
            }, 700);
          },
        },
      });
    });
    return () => {
      destroyed = true;
      try {
        playerRef.current?.destroy();
      } catch {
        // ignore
      }
      playerRef.current = null;
    };
  }, [videoId]);

  return <div ref={holderRef} className="h-full w-full" />;
}
