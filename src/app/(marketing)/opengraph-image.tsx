import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "ClientSpace — Simple Client Portal for Freelancers";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#f8fafc",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          fontFamily: "system-ui, sans-serif",
          position: "relative",
        }}
      >
        {/* Top accent bar */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 8,
            background: "#6366f1",
          }}
        />

        {/* Logo */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 40,
          }}
        >
          <div
            style={{
              background: "#6366f1",
              borderRadius: 10,
              width: 52,
              height: 52,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: 28,
              fontWeight: 800,
            }}
          >
            C
          </div>
          <span style={{ fontSize: 32, fontWeight: 800, color: "#0f172a" }}>
            Client<span style={{ color: "#6366f1" }}>Space</span>
          </span>
        </div>

        {/* Headline */}
        <div
          style={{
            fontSize: 72,
            fontWeight: 800,
            color: "#0f172a",
            lineHeight: 1.1,
            marginBottom: 24,
          }}
        >
          The client portal{" "}
          <span style={{ color: "#6366f1" }}>freelancers deserve</span>
        </div>

        {/* Subtext */}
        <div style={{ fontSize: 30, color: "#64748b", marginBottom: 40 }}>
          Share files · Track progress · Get paid
        </div>

        {/* CTA badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
        >
          <div
            style={{
              background: "#6366f1",
              color: "white",
              borderRadius: 50,
              padding: "14px 32px",
              fontSize: 24,
              fontWeight: 600,
            }}
          >
            Get Started Free
          </div>
          <div style={{ fontSize: 20, color: "#94a3b8" }}>
            Free forever for up to 2 clients
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
