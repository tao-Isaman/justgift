// YouTube-only media share. Restricting the source is the moderation baseline;
// the streamer adds an amount gate + max duration on top. Pure (server+client).

export function parseYouTubeId(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const u = new URL(url.trim());
    const host = u.hostname.replace(/^www\./, "").replace(/^m\./, "");
    if (host === "youtu.be") return validId(u.pathname.slice(1));
    if (host === "youtube.com") {
      if (u.pathname === "/watch") return validId(u.searchParams.get("v"));
      if (u.pathname.startsWith("/shorts/"))
        return validId(u.pathname.split("/")[2]);
      if (u.pathname.startsWith("/embed/"))
        return validId(u.pathname.split("/")[2]);
      if (u.pathname.startsWith("/live/"))
        return validId(u.pathname.split("/")[2]);
    }
    return null;
  } catch {
    return null;
  }
}

function validId(id: string | null | undefined): string | null {
  if (!id) return null;
  return /^[a-zA-Z0-9_-]{6,20}$/.test(id) ? id : null;
}

export function youTubeEmbedUrl(id: string): string {
  return `https://www.youtube.com/embed/${id}?autoplay=1&rel=0&modestbranding=1&playsinline=1`;
}

/**
 * Validate a donor-supplied GIF link. Must be an https URL pointing at an actual
 * .gif (so it renders as an <img> on the overlay). Returns the cleaned URL or
 * null. Works with Giphy/Tenor direct links (…/giphy.gif, …/tenor.gif).
 */
export function parseGifUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const u = new URL(url.trim());
    if (u.protocol !== "https:") return null;
    if (!u.pathname.toLowerCase().endsWith(".gif")) return null;
    return u.toString();
  } catch {
    return null;
  }
}
