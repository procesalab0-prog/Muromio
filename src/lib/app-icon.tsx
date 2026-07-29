import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

async function loadWordmarkFonts() {
  const [lora, jost] = await Promise.all([
    readFile(join(process.cwd(), "assets/fonts/Lora-SemiBold.ttf")),
    readFile(join(process.cwd(), "assets/fonts/Jost-Light.ttf")),
  ]);
  return [
    { name: "Lora", data: lora, weight: 600 as const, style: "normal" as const },
    { name: "Jost", data: jost, weight: 300 as const, style: "normal" as const },
  ];
}

export function renderMonogramIcon(pixelSize: number) {
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

export async function renderWordmarkIcon(pixelSize: number) {
  const fonts = await loadWordmarkFonts();
  const fontSize = Math.round(pixelSize * 0.185);

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
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", fontSize, color: "#EFE7DC" }}>
          <span style={{ fontFamily: "Lora", fontWeight: 600 }}>muro</span>
          <span style={{ fontFamily: "Jost", fontWeight: 300 }}>mío</span>
        </div>
      </div>
    ),
    { width: pixelSize, height: pixelSize, fonts },
  );
}
