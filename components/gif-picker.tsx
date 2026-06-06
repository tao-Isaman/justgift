"use client";

import { useEffect, useState } from "react";
import { Loader2, Search, Shuffle, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { parseGifUrl } from "@/lib/media";
import { cn } from "@/lib/utils";

type GifItem = { id: string; url: string; preview: string };
type GiphyImage = { url?: string };
type GiphyItem = { id: string; images?: Record<string, GiphyImage> };

function giphyKey() {
  return process.env.NEXT_PUBLIC_GIPHY_API_KEY || "dc6zaTOxFJmzC";
}

async function fetchGifs(query: string, offset: number): Promise<GifItem[]> {
  const q = query.trim();
  const key = giphyKey();
  const url = q
    ? `https://api.giphy.com/v1/gifs/search?api_key=${key}&q=${encodeURIComponent(
        q
      )}&limit=6&offset=${offset}&rating=pg-13&lang=th`
    : `https://api.giphy.com/v1/gifs/trending?api_key=${key}&limit=6&offset=${offset}&rating=pg-13`;
  const res = await fetch(url);
  const json = await res.json();
  const data = (json?.data ?? []) as GiphyItem[];
  return data
    .map((g) => {
      const pick = (k: string) => (g.images?.[k]?.url ?? "").split("?")[0];
      const full = pick("downsized_medium") || pick("original");
      const preview = pick("fixed_width_small") || pick("fixed_width") || full;
      return { id: g.id, url: full, preview };
    })
    .filter((x) => x.url.toLowerCase().endsWith(".gif") && x.preview);
}

/** Giphy-backed GIF picker: search by keyword, shuffle for more, click to pick.
 *  The chosen direct .gif URL is emitted via onChange. */
export function GifPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (url: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<GifItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [nonce, setNonce] = useState(0); // shuffle / refetch trigger

  useEffect(() => {
    let active = true;
    const offset = (nonce * 6) % 90; // shuffle steps through pages
    const t = setTimeout(() => {
      setLoading(true);
      fetchGifs(query, offset)
        .then((list) => {
          if (active) setItems(list);
        })
        .catch(() => {
          if (active) setItems([]);
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }, 300);
    return () => {
      active = false;
      clearTimeout(t);
    };
  }, [query, nonce]);

  const selected = parseGifUrl(value);

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-8"
            placeholder="ค้นหา GIF มีม… (เช่น โอน, ขอบคุณ, แมว)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => setNonce((n) => n + 1)}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Shuffle className="size-4" />
          )}
          สุ่ม
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {items.map((g) => (
          <button
            type="button"
            key={g.id}
            onClick={() => onChange(g.url)}
            className={cn(
              "aspect-square overflow-hidden rounded-md border-2 transition-colors",
              value === g.url
                ? "border-primary"
                : "border-transparent hover:border-border"
            )}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={g.preview}
              alt=""
              loading="lazy"
              className="size-full object-cover"
            />
          </button>
        ))}
        {loading && items.length === 0 ? (
          <p className="col-span-full py-6 text-center text-sm text-muted-foreground">
            กำลังโหลด GIF…
          </p>
        ) : null}
        {!loading && items.length === 0 ? (
          <p className="col-span-full py-6 text-center text-sm text-muted-foreground">
            ไม่พบ GIF — ลองคำอื่น
          </p>
        ) : null}
      </div>

      {selected ? (
        <div className="flex items-center gap-3 rounded-lg border border-border/60 p-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={selected}
            alt="GIF ที่เลือก"
            className="h-16 w-16 rounded-md object-cover"
          />
          <span className="flex-1 text-sm text-muted-foreground">
            เลือก GIF นี้แล้ว
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onChange("")}
            aria-label="ลบ GIF"
          >
            <X className="size-4" />
          </Button>
        </div>
      ) : null}

      <Input
        placeholder="หรือวางลิงก์ .gif เอง"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
