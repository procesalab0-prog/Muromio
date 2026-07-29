import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateRender, transferRenderStyle, type RenderMode } from "@/lib/renders/stability";

export const maxDuration = 60;

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

  const formData = await request.formData();
  const uploadedImage = formData.get("image");
  const uploadedStyleImage = formData.get("styleImage");
  const sourceRenderId = String(formData.get("sourceRenderId") ?? "").trim();
  const projectName = String(formData.get("projectName") ?? "").trim().slice(0, 120);
  const details = String(formData.get("details") ?? "").trim().slice(0, 1200);
  const style = String(formData.get("style") ?? "minimalismo cálido").trim().slice(0, 80);
  const requestedMode = String(formData.get("mode") ?? "sketch");
  const isStyleTransfer = requestedMode === "style-transfer";
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

  const { error: profileError } = await supabase
    .from("profiles")
    .upsert({ id: user.id }, { onConflict: "id", ignoreDuplicates: true });

  if (profileError) {
    console.error("Could not ensure user profile", profileError);
    return NextResponse.json(
      { error: "No pudimos preparar tu perfil. Intenta cerrar sesión y entrar de nuevo." },
      { status: 500 },
    );
  }

  let projectId = existingProjectId;
  if (!projectId) {
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .insert({ owner_id: user.id, name: projectName })
      .select("id")
      .single();

    if (projectError || !project) {
      console.error("Could not create project", projectError);
      return NextResponse.json({ error: "No pudimos crear el proyecto." }, { status: 500 });
    }
    projectId = project.id;
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
      projectId,
      image: `data:image/webp;base64,${base64}`,
    });
  } catch (error) {
    console.error(error);
    await supabase
      .from("renders")
      .update({
        status: "failed",
        error_message: "El proveedor no pudo completar la generación.",
      })
      .eq("id", render.id);

    return NextResponse.json(
      { error: "No fue posible generar el render. Intenta nuevamente." },
      { status: 502 },
    );
  }
}
