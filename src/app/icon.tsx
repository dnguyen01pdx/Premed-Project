import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

/** Favicon: the compass mark on navy, generated from the same geometry. */
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a1c3d",
          borderRadius: 6,
        }}
      >
        <svg viewBox="0 0 32 32" width="26" height="26" fill="none">
          <circle cx="16" cy="16" r="13.5" stroke="#fff" strokeWidth="2.25" opacity="0.4" />
          <path
            d="M16 27 L20.6 14.4 L16 17.2 L11.4 14.4 Z"
            stroke="#fff"
            strokeWidth="1.6"
            strokeLinejoin="round"
            opacity="0.5"
          />
          <path
            d="M16 5 L20.6 17.6 L16 14.8 L11.4 17.6 Z"
            fill="#fff"
            stroke="#fff"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    ),
    size,
  );
}
