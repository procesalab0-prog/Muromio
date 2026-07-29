const STABILITY_API = "https://api.stability.ai/v2beta/stable-image/control";

export type RenderMode = "sketch" | "structure";

export async function generateRender({
  image,
  prompt,
  mode,
}: {
  image: File;
  prompt: string;
  mode: RenderMode;
}) {
  const apiKey = process.env.STABILITY_API_KEY;
  if (!apiKey) {
    throw new Error("STABILITY_API_KEY is not configured");
  }

  const body = new FormData();
  body.set("image", image, image.name);
  body.set("prompt", prompt);
  body.set("control_strength", mode === "sketch" ? "0.78" : "0.72");
  body.set(
    "negative_prompt",
    "distorted architecture, warped walls, crooked verticals, impossible geometry, people, text, watermark, low resolution",
  );
  body.set("output_format", "webp");

  const response = await fetch(`${STABILITY_API}/${mode}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: "image/*",
    },
    body,
    cache: "no-store",
  });

  if (!response.ok) {
    const providerMessage = await response.text();
    console.error("Stability generation failed", response.status, providerMessage);
    throw new Error(`Stability returned ${response.status}`);
  }

  return Buffer.from(await response.arrayBuffer()).toString("base64");
}
