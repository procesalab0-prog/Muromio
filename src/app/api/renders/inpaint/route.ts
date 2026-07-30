import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  eraseRender,
  inpaintRender,
  smartEditRender,
  StabilityApiError,
  type SmartEditMode,
} from "@/lib/renders/stability";
import { editRenderWithGemini, GeminiApiError } from "@/lib/renders/gemini";

export const maxDuration = 180;

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Debes iniciar sesión." }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("access_status")
    .eq("id", user.id)
    .single();

  if (profile?.access_status !== "approved") {
    return NextResponse.json(
      { error: "Tu acceso a la prueba todavía no ha sido aprobado." },
      { status: 403 },
    );
  }

  const formData = await request.formData();
  const sourceRenderId = String(formData.get("sourceRenderId") ?? "").trim();
  const requestedChange = String(formData.get("prompt") ?? "").trim().slice(0, 1200);
  const objectPrompt = String(formData.get("objectPrompt") ?? "").trim().slice(0, 300);
  const action = String(formData.get("action") ?? "inpaint");
  const provider = String(formData.get("provider") ?? "gemini");
  const mask = formData.get("mask");
  const needsMask = action === "inpaint" || action === "erase";
  const needsObject = action === "recolor" || action === "replace";

  if (provider === "gemini") {
    return NextResponse.json(
      { error: "Gemini estará disponible próximamente. Por ahora usa Stability." },
      { status: 409 },
    );
  }

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
      provider: provider === "gemini" ? "gemini-3.1-flash-image" : `stability-${action}`,
    })
    .select("id")
    .single();

  if (renderError || !render) {
    return NextResponse.json({ error: "No pudimos registrar la edición." }, { status: 500 });
  }

  const creditCost = 5;
  const { data: creditResult, error: creditError } = await supabase
    .rpc("spend_render_credits", {
      p_amount: creditCost,
      p_operation: `Edición Stability: ${action}`,
    })
    .single();

  if (creditError) {
    await supabase.from("renders").update({ status: "failed", error_message: "Créditos insuficientes." }).eq("id", render.id);
    return NextResponse.json(
      { error: creditError.message.includes("insufficient") ? "No tienes créditos suficientes para esta edición." : "No pudimos comprobar tu saldo de créditos." },
      { status: 402 },
    );
  }

  try {
    const image = new File([sourceBlob], "render-original.webp", {
      type: sourceBlob.type || "image/webp",
    });
    let base64: string;
    let outputType = "image/webp";
    if (provider === "gemini") {
      const geminiPrompt = [
        prompt,
        mask instanceof File
          ? "The second image is a black-and-white mask: white marks the only editable area and black must remain unchanged."
          : "",
        "Return only the finished edited architectural image. Keep all unrequested pixels, geometry, furnishings, camera position, lighting, and shadows visually identical.",
      ].filter(Boolean).join(" ");
      const geminiResult = await editRenderWithGemini({
        image,
        mask: needsMask ? mask as File : undefined,
        prompt: geminiPrompt,
      });
      base64 = geminiResult.base64;
      outputType = geminiResult.mimeType;
    } else if (action === "erase") {
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
    const outputExtension = outputType.includes("png") ? "png" : outputType.includes("jpeg") ? "jpg" : "webp";
    const outputPath = `${user.id}/${sourceRender.project_id}/outputs/${render.id}.${outputExtension}`;
    const { error: uploadError } = await supabase.storage
      .from("render-assets")
      .upload(outputPath, Buffer.from(base64, "base64"), {
        contentType: outputType,
        upsert: true,
      });

    if (uploadError) throw new Error(uploadError.message);

    const { error: completionError } = await supabase
      .from("renders")
      .update({
        status: "completed",
        output_path: outputPath,
        completed_at: new Date().toISOString(),
      })
      .eq("id", render.id);
    if (completionError) throw new Error(completionError.message);

    const { error: versionError } = await supabase.rpc("register_render_version", {
      p_render_id: render.id,
      p_title: "Edición de render",
    });
    if (versionError) console.error("Could not register edited version", versionError);

    return NextResponse.json({
      renderId: render.id,
      image: `data:${outputType};base64,${base64}`,
      credits: creditResult,
    });
  } catch (error) {
    console.error(error);
    await supabase.rpc("refund_render_credits", {
      p_amount: creditCost,
      p_operation: `Edición fallida: ${action}`,
    });
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
  if (error instanceof GeminiApiError) {
    if (error.status === 503 && error.providerMessage.includes("GEMINI_API_KEY")) {
      return "Gemini todavía no está configurado en Vercel.";
    }
    const messages: Record<number, string> = {
      400: "Gemini rechazó la imagen o la instrucción (código 400).",
      403: "La clave de Gemini no tiene permiso para usar el modelo (código 403).",
      429: "Gemini alcanzó el límite de solicitudes o presupuesto (código 429).",
      500: "Gemini tuvo un error interno (código 500).",
      502: "Gemini no devolvió una imagen.",
      503: "Gemini no está disponible temporalmente.",
    };
    return messages[error.status] ?? `Gemini respondió con el código ${error.status}.`;
  }
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
