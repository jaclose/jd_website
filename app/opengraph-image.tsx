import { ImageResponse } from "next/og";

export const alt = "Jafar Dabbagh — the JD-1184 system";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OG() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#06070b",
          color: "#e8e6e1",
          fontFamily: "serif",
        }}
      >
        {/* the sun and one orbit */}
        <div
          style={{
            position: "absolute",
            width: 340,
            height: 120,
            border: "1px solid rgba(154,164,184,0.35)",
            borderRadius: "50%",
            transform: "rotate(-16deg)",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            width: 64,
            height: 64,
            borderRadius: 64,
            background: "#ffe3ad",
            boxShadow: "0 0 120px 40px rgba(244,200,124,0.45)",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 188,
            left: 760,
            width: 22,
            height: 22,
            borderRadius: 22,
            background: "#b88d5c",
            display: "flex",
          }}
        />
        <div
          style={{
            marginTop: 270,
            fontSize: 76,
            letterSpacing: "0.02em",
            display: "flex",
          }}
        >
          Jafar Dabbagh
        </div>
        <div
          style={{
            marginTop: 18,
            fontSize: 21,
            letterSpacing: "0.42em",
            color: "#8a8f98",
            display: "flex",
          }}
        >
          JD-1184 · ESSAYS · FIELD NOTES · THE GARDEN
        </div>
      </div>
    ),
    size
  );
}
