import { ImageResponse } from "next/og";

export function renderAppIcon(pixelSize: number) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#262220",
          color: "#EFE7DC",
          fontSize: Math.round(pixelSize * 0.52),
          fontWeight: 600,
        }}
      >
        M
      </div>
    ),
    { width: pixelSize, height: pixelSize },
  );
}
