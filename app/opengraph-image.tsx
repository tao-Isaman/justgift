import { ImageResponse } from "next/og";

export const alt =
  "JustGift — ระบบโดเนทสำหรับสตรีมเมอร์ รับโดเนทพร้อมเพย์";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Latin-only artwork (the OG renderer's default font has no Thai glyphs);
// the Thai keywords live in `alt` + page metadata.
export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          background: "#0a0a0b",
          backgroundImage:
            "radial-gradient(55% 60% at 50% 0%, rgba(220,38,38,0.30), transparent 70%)",
          padding: 80,
          color: "#ffffff",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          <div
            style={{
              display: "flex",
              width: 112,
              height: 112,
              borderRadius: 26,
              background: "#dc2626",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 66,
              fontWeight: 800,
            }}
          >
            G
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 88,
              fontWeight: 800,
              letterSpacing: -2,
            }}
          >
            JUSTGIFT
          </div>
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 40,
            fontSize: 46,
            fontWeight: 700,
          }}
        >
          Donation alerts for streamers
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 18,
            fontSize: 30,
            color: "#a1a1aa",
          }}
        >
          PromptPay donations · auto slip verification · instant OBS alerts
        </div>
      </div>
    ),
    { ...size }
  );
}
