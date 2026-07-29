import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  eraseRender,
  inpaintRender,
  smartEditRender,
  StabilityApiError,
  type SmartEditMode,
} from "@/lib/renders/stability";

export const maxDuration = 60;

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Debes iniciar sesión." }, { status: 401 });
  }

  const formData = await request.formData();
  const sourceRenderId = String(formData.get("sourceRenderId") ?? "").trim();
  const requestedChange = String(formData.get("prompt") ?? "").trim().slice(0, 1200);
  const objectPrompt = String(formData.get("objectPrompt") ?? "").trim().slice(0, 300);
  const action = String(formData.get("action") ?? "inpaint");
  const mask = formData.get("mask");
  const needsMask = action === "inpaint" || action === "erase";
  const needsObject = action === "recolor" || action === "replace";

  if (!sourceRenderId || (action !== "erase" && !requestedChange)) {
    return NextResponse.json({ error: "Describe el cambio que quieres realizar." }, { status: 400 });
  }
  if (needsObject && !objectPrompt) {
    return NextResponse.json({ error: "Describe brevemente el objeto que quieres localizar." }, { status: 400 });
  }
  if (needsMask && (!(mask instanceof File) || mask.type !== "image/png" || mask.size > 10 * 1024 * 1024)) {
    return NextResponse.json({ error: "La máscara no es válida." }, { status: 400 });
  }

  const { data: sourceRender } = await supabase
    .from("renders")
    .select("project_id,output_path")
    .eq("id", sourceRenderId)
    .single();

  if (!sourceRender?.output_path) {
    return NextResponse.json({ error: "No encontramos el render que quieres editar." }, { status: 404 });
  }

  const { data: sourceBlob, error: downloadError } = await supabase.storage
    .from("render-assets")
    .download(sourceRender.output_path);

  if (downloadError || !sourceBlob) {
    return NextResponse.json({ error: "No pudimos recuperar el render original." }, { status: 500 });
  }

  const prompt = action === "erase"
    ? `Remove ${objectPrompt || "the masked object"} and reconstruct the background naturally.`
    : [
        "Photorealistic architectural interior visualization.",
        action === "inpaint"
          ? `Apply this change only inside the masked area: ${requestedChange}.`
          : `Apply this change to ${objectPrompt}: ${requestedChange}.`,
        "Preserve the architecture, camera perspective, lighting direction, object scale, and everything not requested.",
        "Realistic material transitions, clean edges, correct scale, no text, no watermark.",
      ].join(" ");

  const { data: render, error: renderError } = await supabase
    .from("renders")
    .insert({
      project_id: sourceRender.project_id,
      status: "processing",
      prompt,
      provider: `stability-${action}`,
    })
    .select("id")
    .single();

  if (renderError || !render) {
    return NextResponse.json({ error: "No pudimos registrar la edición." }, { status: 500 });
  }

  try {
    const image = new File([sourceBlob], "render-original.webp", {
      type: sourceBlob.type || "image/webp",
    });
    let base64: string;
    if (action === "erase") {
      base64 = await eraseRender({ image, mask: mask as File });
    } else if (action === "recolor" || action === "replace") {
      base64 = await smartEditRender({
        image,
        prompt,
        selectPrompt: objectPrompt,
        mode: action as SmartEditMode,
      });
    } else {
      base64 = await inpaintRender({ image, mask: mask as File, prompt });
    }
    const outputPath = `${user.id}/${sourceRender.project_id}/outputs/${render.id}.webp`;
    const { error: uploadError } = await supabase.storage
      .from("render-assets")
      .upload(outputPath, Buffer.from(base64, "base64"), {
        contentType: "image/webp",
        upsert: true,
      });

    if (uploadError) throw new Error(uploadError.message);

    await supabase
      .from("renders")
      .update({
        status: "completed",
        output_path: outputPath,
        completed_at: new Date().toISOString(),
      })
      .eq("id", render.id);

    return NextResponse.json({
      renderId: render.id,
      image: `data:image/webp;base64,${base64}`,
    });
  } catch (error) {
    console.error(error);
    const publicError = getPublicEditError(error);
    await supabase
      .from("renders")
      .update({
        status: "failed",
        error_message: publicError,
      })
      .eq("id", render.id);
    return NextResponse.json(
      { error: publicError },
      { status: 502 },
    );
  }
}

function getPublicEditError(error: unknown) {
  if (error instanceof StabilityApiError) {
    const messages: Record<number, string> = {
      400: "Stability rechazó algún parámetro de la edición (código 400).",
      402: "La cuenta de Stability no tiene créditos suficientes (código 402).",
      403: "Stability bloqueó la edición por permisos o moderación (código 403).",
      413: "La imagen supera el límite de Stability (código 413).",
      422: "Stability no pudo localizar o procesar el objeto indicado (código 422).",
      429: "Stability recibió demasiadas solicitudes. Espera un minuto (código 429).",
      500: "Stability tuvo un error interno (código 500).",
    };
    return messages[error.status] ?? `Stability respondió con el código ${error.status}.`;
  }
  if (error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError")) {
    return "Stability tardó demasiado en completar la edición.";
  }
  return "No fue posible aplicar el cambio. Ajusta la selección o la descripción.";
}
