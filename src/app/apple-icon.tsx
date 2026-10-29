import { ImageResponse } from "next/og";
import { CompassTile } from "./icon";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** Home-screen icon for iPhones; iOS rounds the corners itself. */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#0e3b46" }}>
        <CompassTile px={180} />
      </div>
    ),
    size,
  );
}
