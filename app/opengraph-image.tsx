import { ImageResponse } from "next/og";

export const alt =
  "Jafar Dabbagh — JD-1184, essays, field notes, and the Sanctum";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OG() {
  const stars = [
    [86, 72, 2, 0.64],
    [178, 146, 3, 0.78],
    [328, 96, 2, 0.58],
    [462, 172, 2, 0.54],
    [582, 78, 3, 0.72],
    [690, 226, 2, 0.52],
    [848, 88, 2, 0.7],
    [1018, 156, 3, 0.62],
    [1102, 58, 2, 0.5],
    [1038, 398, 2, 0.58],
    [908, 512, 3, 0.74],
    [732, 552, 2, 0.48],
    [536, 482, 2, 0.5],
    [238, 524, 3, 0.66],
    [128, 416, 2, 0.5],
  ] as const;

  return new ImageResponse(
    (
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          display: "flex",
          overflow: "hidden",
          background: "#06070b",
          color: "#e8e6e1",
          fontFamily: "Georgia, serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            background:
              "linear-gradient(115deg, #030408 0%, #070a12 44%, #101115 100%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            background:
              "radial-gradient(circle at 74% 43%, rgba(212,184,134,0.26) 0, rgba(212,184,134,0.11) 16%, transparent 42%), radial-gradient(circle at 18% 74%, rgba(159,216,232,0.13) 0, transparent 34%), radial-gradient(circle at 88% 82%, rgba(159,206,143,0.12) 0, transparent 30%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 64,
            top: 58,
            width: 1072,
            height: 514,
            border: "1px solid rgba(232,230,225,0.1)",
            display: "flex",
          }}
        />
        {stars.map(([left, top, width, opacity]) => (
          <div
            key={`${left}-${top}`}
            style={{
              position: "absolute",
              left,
              top,
              width,
              height: width,
              borderRadius: width,
              background: "#e8e6e1",
              opacity,
              display: "flex",
            }}
          />
        ))}
        <div
          style={{
            position: "absolute",
            left: 706,
            top: 82,
            width: 500,
            height: 500,
            border: "1px solid rgba(212,184,134,0.24)",
            borderRadius: "50%",
            transform: "rotate(-17deg)",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 754,
            top: 145,
            width: 398,
            height: 398,
            border: "1px solid rgba(159,216,232,0.12)",
            borderRadius: "50%",
            transform: "rotate(11deg)",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 884,
            top: 242,
            width: 106,
            height: 106,
            borderRadius: 106,
            background: "#f4d39a",
            boxShadow:
              "0 0 96px 38px rgba(244,211,154,0.32), 0 0 180px 72px rgba(212,184,134,0.16)",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 1086,
            top: 202,
            width: 34,
            height: 34,
            borderRadius: 34,
            background: "#9fce8f",
            boxShadow: "0 0 40px 12px rgba(159,206,143,0.2)",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 768,
            top: 396,
            width: 52,
            height: 52,
            borderRadius: 52,
            background: "#9fd8e8",
            boxShadow: "0 0 48px 14px rgba(159,216,232,0.2)",
            display: "flex",
          }}
        />

        <div
          style={{
            position: "absolute",
            left: 86,
            top: 82,
            display: "flex",
            alignItems: "center",
            gap: 14,
            color: "#d4b886",
            fontSize: 21,
            letterSpacing: 0,
            fontFamily:
              "Menlo, Consolas, Monaco, 'Courier New', monospace",
            textTransform: "uppercase",
          }}
        >
          <span>JD-1184</span>
          <span style={{ color: "rgba(232,230,225,0.28)" }}>System</span>
        </div>

        <div
          style={{
            position: "absolute",
            left: 86,
            top: 154,
            width: 660,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 92,
              lineHeight: 0.9,
              letterSpacing: 0,
              color: "#f3efe6",
            }}
          >
            Jafar
          </div>
          <div
            style={{
              marginTop: -2,
              display: "flex",
              fontSize: 92,
              lineHeight: 0.9,
              letterSpacing: 0,
              color: "#f3efe6",
            }}
          >
            Dabbagh
          </div>
          <div
            style={{
              marginTop: 30,
              display: "flex",
              width: 576,
              fontSize: 30,
              lineHeight: 1.34,
              color: "rgba(232,230,225,0.82)",
            }}
          >
            Essays, field notes, and a living Sanctum on study, faith,
            medicine, and the work of becoming useful.
          </div>
        </div>

        <div
          style={{
            position: "absolute",
            left: 86,
            bottom: 78,
            display: "flex",
            gap: 12,
          }}
        >
          {["Essays", "Field Notes", "The Sanctum"].map((label) => (
            <div
              key={label}
              style={{
                display: "flex",
                alignItems: "center",
                height: 42,
                padding: "0 18px",
                border: "1px solid rgba(232,230,225,0.14)",
                background: "rgba(232,230,225,0.045)",
                color: "#d4b886",
                fontSize: 18,
                letterSpacing: 0,
                fontFamily:
                  "Menlo, Consolas, Monaco, 'Courier New', monospace",
                textTransform: "uppercase",
              }}
            >
              {label}
            </div>
          ))}
        </div>

        <div
          style={{
            position: "absolute",
            right: 86,
            bottom: 79,
            display: "flex",
            alignItems: "center",
            gap: 12,
            fontSize: 18,
            letterSpacing: 0,
            color: "rgba(232,230,225,0.58)",
            fontFamily: "Menlo, Consolas, Monaco, 'Courier New', monospace",
            textTransform: "uppercase",
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: 8,
              background: "#9fce8f",
              boxShadow: "0 0 24px 8px rgba(159,206,143,0.28)",
              display: "flex",
            }}
          />
          <span>jafardabbagh.com</span>
        </div>

        <div
          style={{
            position: "absolute",
            right: 118,
            top: 92,
            width: 76,
            height: 76,
            border: "1px solid rgba(232,230,225,0.18)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#e8e6e1",
            fontSize: 22,
            letterSpacing: 0,
            fontFamily: "Menlo, Consolas, Monaco, 'Courier New', monospace",
          }}
        >
          JD
        </div>

        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: 7,
            display: "flex",
            background:
              "linear-gradient(90deg, #d4b886 0%, #9fd8e8 48%, #9fce8f 100%)",
          }}
        />
      </div>
    ),
    size
  );
}
