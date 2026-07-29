import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { InpaintEditor } from "./inpaint-editor";

export default async function EditRenderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("access_status")
    .eq("id", user.id)
    .single();

  if (profile?.access_status !== "approved") {
    redirect("/solicitud-pendiente");
  }

  const { data: render } = await supabase
    .from("renders")
    .select("id,output_path,projects(name)")
    .eq("id", id)
    .single();

  if (!render?.output_path) notFound();

  const { data: signed } = await supabase.storage
    .from("render-assets")
    .createSignedUrl(render.output_path, 60 * 60);

  if (!signed?.signedUrl) notFound();

  const project = Array.isArray(render.projects) ? render.projects[0] : render.projects;

  return (
    <main style={{ minHeight: "100svh", padding: "clamp(24px,4vw,64px)", background: "var(--sand)" }}>
      <Link href="/panel" style={{ color: "var(--rust)", textDecoration: "none", fontSize: 13 }}>
        ← Volver a proyectos
      </Link>
      <h1 style={{ margin: "22px 0 8px", fontFamily: "var(--font-lora)", fontSize: "clamp(36px,6vw,60px)", fontWeight: 500 }}>
        Editar render
      </h1>
      <p style={{ maxWidth: 680, margin: "0 0 30px", color: "#655d58", lineHeight: 1.7 }}>
        {project?.name ? `${project.name} · ` : ""}
        Pinta sobre la zona que quieres cambiar y describe el nuevo material, color u objeto.
      </p>
      <InpaintEditor sourceRenderId={render.id} imageUrl={signed.signedUrl} />
    </main>
  );
}
