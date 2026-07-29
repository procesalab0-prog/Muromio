import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function PendingAccessPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name,access_status")
    .eq("id", user.id)
    .single();
  if (profile?.access_status === "approved") redirect("/panel");

  const rejected = profile?.access_status === "rejected";
  return (
    <main style={{ minHeight: "100svh", display: "grid", placeItems: "center", padding: 24, background: "var(--sand)" }}>
      <section style={{ width: "100%", maxWidth: 560, padding: "clamp(30px,6vw,60px)", background: "var(--cream)", border: "1px solid rgba(38,34,32,.12)", textAlign: "center" }}>
        <p style={{ color: "var(--rust)", fontSize: 11, letterSpacing: ".18em", textTransform: "uppercase" }}>
          Solicitud de acceso
        </p>
        <h1 style={{ fontFamily: "var(--font-lora)", fontSize: "clamp(34px,6vw,52px)", fontWeight: 500 }}>
          {rejected ? "Acceso no habilitado" : "Tu solicitud está pendiente"}
        </h1>
        <p style={{ color: "#655d58", lineHeight: 1.7 }}>
          {rejected
            ? "Por el momento no podemos habilitar esta cuenta. Puedes contactar al equipo de Muromío si necesitas una revisión."
            : `${profile?.full_name ? `${profile.full_name}, ` : ""}te avisaremos cuando un administrador apruebe tu acceso a la prueba.`}
        </p>
        <form action="/auth/signout" method="post">
          <button type="submit" style={{ marginTop: 18, padding: "11px 18px", border: "1px solid rgba(38,34,32,.25)", background: "transparent", cursor: "pointer", font: "inherit" }}>
            Cerrar sesión
          </button>
        </form>
      </section>
    </main>
  );
}
