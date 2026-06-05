/** Fixed, subtle film-grain overlay to break digital flatness.
 *  Place on marketing/entry surfaces (not the transparent OBS overlay). */
export function GrainOverlay() {
  return (
    <div
      aria-hidden
      className="bg-noise pointer-events-none fixed inset-0 z-[60] opacity-[0.04] mix-blend-soft-light"
    />
  );
}
