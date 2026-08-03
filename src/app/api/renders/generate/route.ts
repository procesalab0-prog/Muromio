import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  generateRender,
  StabilityApiError,
  transferRenderStyle,
  type RenderMode,
} from "@/lib/renders/stability";

export const maxDuration = 300;

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const maxFileSize = 10 * 1024 * 1024;

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
    .select("access_status,role")
    .eq("id", user.id)
    .single();

  if (profile?.access_status !== "approved" || profile.role === "client") {
    return NextResponse.json(
      { error: "Tu acceso a la prueba todavía no ha sido aprobado." },
      { status: 403 },
    );
  }

  const formData = await request.formData();
  const uploadedImage = formData.get("image");
  const uploadedStyleImage = formData.get("styleImage");
  const sourceRenderId = String(formData.get("sourceRenderId") ?? "").trim();
  const requestedProjectId = String(formData.get("projectId") ?? "").trim();
  const projectName = String(formData.get("projectName") ?? "").trim().slice(0, 120);
  const details = String(formData.get("details") ?? "").trim().slice(0, 1200);
  const style = String(formData.get("style") ?? "minimalismo cálido").trim().slice(0, 80);
  const requestedMode = String(formData.get("mode") ?? "sketch");
  const isStyleTransfer = requestedMode === "style-transfer";
  const creditCost = isStyleTransfer ? 8 : 6;
  const mode: RenderMode = requestedMode === "structure" ? "structure" : "sketch";

  if (!projectName) {
    return NextResponse.json({ error: "Escribe un nombre para el proyecto." }, { status: 400 });
  }

  let image: File;
  let styleImage: File | null = null;
  let existingProjectId: string | null = null;

  if (isStyleTransfer) {
    if (!(uploadedStyleImage instanceof File) || !allowedTypes.has(uploadedStyleImage.type)) {
      return NextResponse.json(
        { error: "Sube una referencia de estilo PNG, JPG o WEBP." },
        { status: 400 },
      );
    }
    if (uploadedStyleImage.size > maxFileSize) {
      return NextResponse.json({ error: "La referencia no puede superar 10 MB." }, { status: 400 });
    }
    styleImage = uploadedStyleImage;
  }

  if (sourceRenderId) {
    const { data: sourceRender } = await supabase
      .from("renders")
      .select("project_id,output_path")
      .eq("id", sourceRenderId)
      .single();

    if (!sourceRender?.output_path) {
      return NextResponse.json({ error: "No encontramos el render de origen." }, { status: 404 });
    }

    const { data: sourceData, error: sourceError } = await supabase.storage
      .from("render-assets")
      .download(sourceRender.output_path);

    if (sourceError || !sourceData) {
      return NextResponse.json({ error: "No pudimos recuperar el render de origen." }, { status: 500 });
    }

    image = new File([sourceData], "render-base.webp", { type: sourceData.type || "image/webp" });
    existingProjectId = sourceRender.project_id;
  } else {
    if (!(uploadedImage instanceof File) || !allowedTypes.has(uploadedImage.type)) {
      return NextResponse.json({ error: "Sube una imagen PNG, JPG o WEBP." }, { status: 400 });
    }
    if (uploadedImage.size > maxFileSize) {
      return NextResponse.json({ error: "La imagen no puede superar 10 MB." }, { status: 400 });
    }
    image = uploadedImage;
  }

  const prompt = [
    "Photorealistic architectural interior visualization.",
    "Preserve the source layout, openings, wall placement, camera perspective, and major proportions.",
    `Interior design direction: ${style}.`,
    details ? `Client requirements: ${details}.` : "",
    "Premium natural materials, realistic scale, warm natural light, straight verticals, editorial architectural photography.",
  ]
    .filter(Boolean)
    .join(" ");

  let projectId = existingProjectId;
  if (!projectId && requestedProjectId) {
    const { data: canEdit } = await supabase.rpc("can_edit_project", { target_project_id: requestedProjectId });
    if (!canEdit) return NextResponse.json({ error: "No tienes permiso para agregar renders a este proyecto." }, { status: 403 });
    projectId = requestedProjectId;
  }
  if (!projectId) {
    const { data: project, error: projectError } = await supabase.rpc(
      "create_workspace_project",
      { p_name: projectName },
    );

    if (projectError || !project) {
      console.error("Could not create project", projectError);
      return NextResponse.json({ error: "No pudimos crear el proyecto." }, { status: 500 });
    }
    projectId = project;
  }

  const { data: render, error: renderError } = await supabase
    .from("renders")
    .insert({
      project_id: projectId,
      status: "processing",
      prompt,
      provider: isStyleTransfer ? "stability-style-transfer" : "stability",
    })
    .select("id")
    .single();

  if (renderError || !render) {
    console.error("Could not create render record", renderError);
    return NextResponse.json({ error: "No pudimos registrar el render." }, { status: 500 });
  }

  const { data: creditResult, error: creditError } = await supabase
    .rpc("spend_render_credits", {
      p_amount: creditCost,
      p_operation: isStyleTransfer ? "Transferencia de estilo" : "Generación de render",
    })
    .single();

  if (creditError) {
    await supabase.from("renders").update({ status: "failed", error_message: "Créditos insuficientes." }).eq("id", render.id);
    return NextResponse.json(
      { error: creditError.message.includes("insufficient") ? "No tienes créditos suficientes para esta generación." : "No pudimos comprobar tu saldo de créditos." },
      { status: 402 },
    );
  }

  try {
    if (!sourceRenderId) {
      const extension = image.type === "image/png" ? "png" : image.type === "image/webp" ? "webp" : "jpg";
      const sourcePath = `${user.id}/${projectId}/sources/${crypto.randomUUID()}.${extension}`;
      const { error: sourceUploadError } = await supabase.storage
        .from("render-assets")
        .upload(sourcePath, image, { contentType: image.type, upsert: false });

      if (sourceUploadError) {
        throw new Error(`Could not store source: ${sourceUploadError.message}`);
      }

      const { error: referenceError } = await supabase.from("references").insert({
        project_id: projectId,
        storage_path: sourcePath,
        kind: mode === "sketch" ? "sketch" : "reference",
      });
      if (referenceError) {
        throw new Error(`Could not register source: ${referenceError.message}`);
      }
    }

    if (styleImage) {
      const extension = styleImage.type === "image/png" ? "png" : styleImage.type === "image/webp" ? "webp" : "jpg";
      const stylePath = `${user.id}/${projectId}/references/${crypto.randomUUID()}.${extension}`;
      const { error: styleUploadError } = await supabase.storage
        .from("render-assets")
        .upload(stylePath, styleImage, { contentType: styleImage.type, upsert: false });
      if (styleUploadError) {
        throw new Error(`Could not store style reference: ${styleUploadError.message}`);
      }
      const { error: styleReferenceError } = await supabase.from("references").insert({
        project_id: projectId,
        storage_path: stylePath,
        kind: "moodboard",
      });
      if (styleReferenceError) {
        throw new Error(`Could not register style reference: ${styleReferenceError.message}`);
      }
    }

    const base64 = styleImage
      ? await transferRenderStyle({ image, styleImage, prompt })
      : await generateRender({ image, prompt, mode });
    const outputBuffer = Buffer.from(base64, "base64");
    const outputPath = `${user.id}/${projectId}/outputs/${render.id}.webp`;
    const { error: outputUploadError } = await supabase.storage
      .from("render-assets")
      .upload(outputPath, outputBuffer, { contentType: "image/webp", upsert: true });

    if (outputUploadError) {
      throw new Error(`Could not store output: ${outputUploadError.message}`);
    }

    const { error: completionError } = await supabase
      .from("renders")
      .update({
        status: "completed",
        output_path: outputPath,
        completed_at: new Date().toISOString(),
      })
      .eq("id", render.id);
    if (completionError) throw new Error(`Could not complete render: ${completionError.message}`);

    const { error: versionError } = await supabase.rpc("register_render_version", {
      p_render_id: render.id,
      p_title: projectName || "Propuesta visual",
    });
    if (versionError) console.error("Could not register render version", versionError);

    return NextResponse.json({
      renderId: render.id,
      projectId,
      image: `data:image/webp;base64,${base64}`,
      credits: creditResult,
    });
  } catch (error) {
    console.error(error);
    await supabase.rpc("refund_render_credits", {
      p_amount: creditCost,
      p_operation: isStyleTransfer ? "Transferencia de estilo fallida" : "Generación fallida",
    });
    const publicError = getPublicGenerationError(error);
    await supabase
      .from("renders")
      .update({
        status: "failed",
        error_message: publicError,
      })
      .eq("id", render.id);

    return NextResponse.json(
      { error: publicError, diagnosticId: render.id },
      { status: 502 },
    );
  }
}

function getPublicGenerationError(error: unknown) {
  if (error instanceof StabilityApiError) {
    const messages: Record<number, string> = {
      400: "Stability rechazó algún parámetro de la solicitud (código 400).",
      402: "La cuenta de Stability no tiene créditos suficientes (código 402).",
      403: "Stability bloqueó la solicitud por permisos o moderación (código 403).",
      413: "Las imágenes juntas superan el límite de 10 MB de Stability (código 413).",
      422: "Stability rechazó el formato o las dimensiones de una imagen (código 422).",
      429: "Stability recibió demasiadas solicitudes. Espera un minuto (código 429).",
      500: "Stability tuvo un error interno (código 500).",
    };
    return messages[error.status] ?? `Stability respondió con el código ${error.status}.`;
  }
  if (error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError")) {
    return "Stability no respondió dentro de 4 minutos y 40 segundos.";
  }
  return "No fue posible generar el render. La referencia quedó guardada para diagnóstico.";
}
