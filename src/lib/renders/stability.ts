const STABILITY_API = "https://api.stability.ai/v2beta/stable-image/control";
const STABILITY_STYLE_TRANSFER_API = `${STABILITY_API}/style-transfer`;
const STABILITY_INPAINT_API = "https://api.stability.ai/v2beta/stable-image/edit/inpaint";
const STABILITY_EDIT_API = "https://api.stability.ai/v2beta/stable-image/edit";

export type RenderMode = "sketch" | "structure";

export class StabilityApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly providerMessage: string,
  ) {
    super(`Stability returned ${status}`);
    this.name = "StabilityApiError";
  }
}

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
    throw new StabilityApiError(response.status, providerMessage);
  }

  return Buffer.from(await response.arrayBuffer()).toString("base64");
}

export async function transferRenderStyle({
  image,
  styleImage,
  prompt,
}: {
  image: File;
  styleImage: File;
  prompt: string;
}) {
  const apiKey = process.env.STABILITY_API_KEY;
  if (!apiKey) {
    throw new Error("STABILITY_API_KEY is not configured");
  }

  const body = new FormData();
  body.set("init_image", image, image.name);
  body.set("style_image", styleImage, styleImage.name);
  body.set("prompt", prompt);
  body.set(
    "negative_prompt",
    "distorted architecture, warped walls, crooked verticals, impossible geometry, people, text, watermark, low resolution",
  );
  body.set("output_format", "webp");

  const response = await fetch(STABILITY_STYLE_TRANSFER_API, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: "image/*",
    },
    body,
    cache: "no-store",
    signal: AbortSignal.timeout(280_000),
  });

  if (!response.ok) {
    const providerMessage = await response.text();
    console.error("Stability style transfer failed", response.status, providerMessage);
    throw new StabilityApiError(response.status, providerMessage);
  }

  return Buffer.from(await response.arrayBuffer()).toString("base64");
}

export async function inpaintRender({
  image,
  mask,
  prompt,
}: {
  image: File;
  mask: File;
  prompt: string;
}) {
  const apiKey = process.env.STABILITY_API_KEY;
  if (!apiKey) {
    throw new Error("STABILITY_API_KEY is not configured");
  }

  const body = new FormData();
  body.set("image", image, image.name);
  body.set("mask", mask, mask.name);
  body.set("prompt", prompt);
  body.set(
    "negative_prompt",
    "distorted architecture, warped walls, crooked verticals, impossible geometry, people, text, watermark, low resolution",
  );
  body.set("output_format", "webp");

  const response = await fetch(STABILITY_INPAINT_API, {
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
    console.error("Stability inpaint failed", response.status, providerMessage);
    throw new StabilityApiError(response.status, providerMessage);
  }

  return Buffer.from(await response.arrayBuffer()).toString("base64");
}

export type SmartEditMode = "recolor" | "replace";

export async function smartEditRender({
  image,
  prompt,
  selectPrompt,
  mode,
}: {
  image: File;
  prompt: string;
  selectPrompt: string;
  mode: SmartEditMode;
}) {
  const apiKey = process.env.STABILITY_API_KEY;
  if (!apiKey) throw new Error("STABILITY_API_KEY is not configured");

  const body = new FormData();
  body.set("image", image, image.name);
  body.set("prompt", prompt);
  body.set(mode === "recolor" ? "select_prompt" : "search_prompt", selectPrompt);
  body.set("grow_mask", "3");
  body.set("negative_prompt", "warped geometry, duplicate objects, text, watermark, low resolution");
  body.set("output_format", "webp");

  return callStabilityEdit(`${STABILITY_EDIT_API}/search-and-${mode}`, body, `search-and-${mode}`);
}

export async function eraseRender({ image, mask }: { image: File; mask: File }) {
  const apiKey = process.env.STABILITY_API_KEY;
  if (!apiKey) throw new Error("STABILITY_API_KEY is not configured");

  const body = new FormData();
  body.set("image", image, image.name);
  body.set("mask", mask, mask.name);
  body.set("grow_mask", "3");
  body.set("output_format", "webp");

  return callStabilityEdit(`${STABILITY_EDIT_API}/erase`, body, "erase");
}

async function callStabilityEdit(url: string, body: FormData, operation: string) {
  const apiKey = process.env.STABILITY_API_KEY!;
  const response = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, Accept: "image/*" },
    body,
    cache: "no-store",
    signal: AbortSignal.timeout(110_000),
  });
  if (!response.ok) {
    const providerMessage = await response.text();
    console.error(`Stability ${operation} failed`, response.status, providerMessage);
    throw new StabilityApiError(response.status, providerMessage);
  }
  return Buffer.from(await response.arrayBuffer()).toString("base64");
}
