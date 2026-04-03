import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          padding: "56px",
          color: "#f3efe7",
          background:
            "linear-gradient(135deg, #131313 0%, #20262b 54%, #0c5b5c 100%)",
          fontFamily: "sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: "auto -120px -120px auto",
            width: "480px",
            height: "480px",
            borderRadius: "999px",
            background: "rgba(0, 214, 207, 0.18)",
            filter: "blur(8px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: "32px",
            borderRadius: "28px",
            border: "1px solid rgba(255, 255, 255, 0.14)",
          }}
        />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: "100%",
            height: "100%",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "14px",
              color: "#9fe6e1",
              fontSize: "26px",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            <div
              style={{
                width: "12px",
                height: "12px",
                borderRadius: "999px",
                background: "#00d6cf",
              }}
            />
            kk-about.me
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "20px",
              maxWidth: "780px",
            }}
          >
            <div
              style={{
                fontSize: "78px",
                lineHeight: 1,
                fontWeight: 700,
                letterSpacing: "-0.05em",
              }}
            >
              Константин
              <br />
              Кузниченко
            </div>
            <div
              style={{
                fontSize: "34px",
                lineHeight: 1.25,
                color: "rgba(243, 239, 231, 0.84)",
                maxWidth: "720px",
              }}
            >
              UX-дизайнер. Банковские продукты, сложные сценарии и дизайн-системы.
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: "18px",
              fontSize: "24px",
              color: "#d5d0c5",
            }}
          >
            <div
              style={{
                display: "flex",
                padding: "14px 20px",
                borderRadius: "999px",
                background: "rgba(255, 255, 255, 0.08)",
              }}
            >
              Portfolio
            </div>
            <div
              style={{
                display: "flex",
                padding: "14px 20px",
                borderRadius: "999px",
                background: "rgba(255, 255, 255, 0.08)",
              }}
            >
              Case Studies
            </div>
            <div
              style={{
                display: "flex",
                padding: "14px 20px",
                borderRadius: "999px",
                background: "rgba(255, 255, 255, 0.08)",
              }}
            >
              Design Systems
            </div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
