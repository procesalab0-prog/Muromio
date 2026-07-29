const GEMINI_MODEL = "gemini-3.1-flash-image";
const GEMINI_API = `https://generativelanguage.googleapis.com/v1/models/${GEMINI_MODEL}:generateContent`;

type GeminiPart = {
  inlineData?: { data?: string; mimeType?: string };
  inline_data?: { data?: string; mime_type?: string };
};

type GeminiResponse = {
  candidates?: Array<{ content?: { parts?: GeminiPart[] } }>;
  error?: { code?: number; message?: string; status?: string };
};

export class GeminiApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly providerMessage: string,
  ) {
    super(`Gemini returned ${status}`);
    this.name = "GeminiApiError";
  }
}

export async function editRenderWithGemini({
  image,
  mask,
  prompt,
}: {
  image: File;
  mask?: File;
  prompt: string;
}) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new GeminiApiError(503, "GEMINI_API_KEY is not configured");

  const parts: Array<Record<string, unknown>> = [
    {
      inline_data: {
        mime_type: image.type || "image/webp",
        data: Buffer.from(await image.arrayBuffer()).toString("base64"),
      },
    },
  ];
  if (mask) {
    parts.push({
      inline_data: {
        mime_type: "image/png",
        data: Buffer.from(await mask.arrayBuffer()).toString("base64"),
      },
    });
  }
  parts.push({ text: prompt });

  const response = await fetch(GEMINI_API, {
    method: "POST",
    headers: {
      "x-goog-api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [{ parts }],
      generationConfig: {
        responseModalities: ["IMAGE"],
        thinkingConfig: { thinkingLevel: "high" },
      },
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(170_000),
  });

  const payload = (await response.json().catch(() => ({}))) as GeminiResponse;
  if (!response.ok) {
    console.error("Gemini image edit failed", response.status, payload.error);
    throw new GeminiApiError(response.status, payload.error?.message || "Unknown Gemini error");
  }

  const outputPart = payload.candidates
    ?.flatMap((candidate) => candidate.content?.parts ?? [])
    .find((part) => part.inlineData?.data || part.inline_data?.data);
  const data = outputPart?.inlineData?.data || outputPart?.inline_data?.data;
  const mimeType = outputPart?.inlineData?.mimeType || outputPart?.inline_data?.mime_type || "image/png";
  if (!data) throw new GeminiApiError(502, "Gemini returned no image");

  return { base64: data, mimeType };
}
