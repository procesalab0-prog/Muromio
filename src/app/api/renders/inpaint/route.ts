import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { inpaintRender } from "@/lib/renders/stability";

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
  const mask = formData.get("mask");

  if (!sourceRenderId || !requestedChange) {
    return NextResponse.json({ error: "Marca una zona y describe el cambio." }, { status: 400 });
  }
  if (!(mask instanceof File) || mask.type !== "image/png" || mask.size > 10 * 1024 * 1024) {
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

  const prompt = [
    "Photorealistic architectural interior visualization.",
    `Apply this change only inside the masked area: ${requestedChange}.`,
    "Preserve every unmasked pixel, the architecture, camera perspective, lighting direction, and surrounding materials.",
    "Realistic material transitions, clean edges, correct scale, no text, no watermark.",
  ].join(" ");

  const { data: render, error: renderError } = await supabase
    .from("renders")
    .insert({
      project_id: sourceRender.project_id,
      status: "processing",
      prompt,
      provider: "stability-inpaint",
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
    const base64 = await inpaintRender({ image, mask, prompt });
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
    await supabase
      .from("renders")
      .update({
        status: "failed",
        error_message: "El proveedor no pudo completar la edición.",
      })
      .eq("id", render.id);
    return NextResponse.json(
      { error: "No fue posible aplicar el cambio. Intenta ampliar un poco la zona marcada." },
      { status: 502 },
    );
  }
}
