import { ImageResponse } from "next/og";

/**
 * Favicons: the compass mark on the ink-teal field, generated from the same
 * geometry. Google only shows a site's icon in search results when it is
 * square and a multiple of 48px, so these are 48/96/192 (favicon.ico carries
 * the same mark at 16/32/48 for old browsers; regenerate it if this changes).
 */
const SIZES = [48, 96, 192];

export function generateImageMetadata() {
  return SIZES.map((px) => ({
    id: String(px),
    size: { width: px, height: px },
    contentType: "image/png",
  }));
}

export function CompassTile({ px }: { px: number }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0e3b46",
        borderRadius: Math.round(px * 0.19),
      }}
    >
      <svg viewBox="0 0 32 32" width={Math.round(px * 0.8)} height={Math.round(px * 0.8)} fill="none">
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
          fill="#ff6f59"
          stroke="#ff6f59"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

export default async function Icon({ id }: { id: Promise<string | number> }) {
  const px = Number(await id);
  return new ImageResponse(<CompassTile px={px} />, { width: px, height: px });
}
