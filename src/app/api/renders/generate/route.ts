import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateRender, type RenderMode } from "@/lib/renders/stability";

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
  const image = formData.get("image");
  const projectName = String(formData.get("projectName") ?? "").trim().slice(0, 120);
  const details = String(formData.get("details") ?? "").trim().slice(0, 1200);
  const style = String(formData.get("style") ?? "minimalismo cálido").trim().slice(0, 80);
  const requestedMode = String(formData.get("mode") ?? "sketch");
  const mode: RenderMode = requestedMode === "structure" ? "structure" : "sketch";

  if (!(image instanceof File) || !allowedTypes.has(image.type)) {
    return NextResponse.json({ error: "Sube una imagen PNG, JPG o WEBP." }, { status: 400 });
  }
  if (image.size > maxFileSize) {
    return NextResponse.json({ error: "La imagen no puede superar 10 MB." }, { status: 400 });
  }
  if (!projectName) {
    return NextResponse.json({ error: "Escribe un nombre para el proyecto." }, { status: 400 });
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

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .insert({ owner_id: user.id, name: projectName })
    .select("id")
    .single();

  if (projectError || !project) {
    console.error("Could not create project", projectError);
    return NextResponse.json({ error: "No pudimos crear el proyecto." }, { status: 500 });
  }

  const { data: render, error: renderError } = await supabase
    .from("renders")
    .insert({
      project_id: project.id,
      status: "processing",
      prompt,
      provider: "stability",
    })
    .select("id")
    .single();

  if (renderError || !render) {
    console.error("Could not create render record", renderError);
    return NextResponse.json({ error: "No pudimos registrar el render." }, { status: 500 });
  }

  try {
    const base64 = await generateRender({ image, prompt, mode });
    await supabase
      .from("renders")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("id", render.id);

    return NextResponse.json({
      renderId: render.id,
      projectId: project.id,
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
