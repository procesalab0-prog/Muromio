import { redirect } from "next/navigation";
import { WorkspaceShell } from "@/components/workspace-shell";
import { createClient } from "@/lib/supabase/server";
import { RenderForm } from "./render-form";

export default async function NewRenderPage({
  searchParams,
}: {
  searchParams: Promise<{ sourceRenderId?: string }>;
}) {
  const { sourceRenderId } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name,email,role,access_status,credit_balance,unlimited_credits")
    .eq("id", user.id)
    .single();

  if (profile?.access_status !== "approved") {
    redirect("/solicitud-pendiente");
  }

  return (
    <WorkspaceShell section="/panel/nuevo-render" userName={profile.full_name || profile.email || "Muromío"} role={profile.role} credits={profile.unlimited_credits ? null : profile.credit_balance}>
      <section className="render-os-head">
        <div><span>Motor activo · Stability</span><b>Gemini <em>Próximamente</em></b></div>
        <h1>{sourceRenderId ? "Nueva variación" : "Render Lab"}</h1>
        <p>{sourceRenderId
          ? "Explora otra dirección material sin perder la composición de la versión anterior."
          : "Convierte un plano, boceto o imagen base en una propuesta visual bajo la dirección de Muromío."}</p>
      </section>
      <RenderForm sourceRenderId={sourceRenderId} initialCredits={profile.credit_balance ?? 0} unlimitedCredits={profile.unlimited_credits ?? false} />
    </WorkspaceShell>
  );
}
