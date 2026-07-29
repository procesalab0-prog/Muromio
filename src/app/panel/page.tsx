import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

type RenderItem = {
  id: string;
  status: string;
  output_path: string | null;
  created_at: string;
  signedUrl?: string;
};

export default async function PanelPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role,access_status,credit_balance,unlimited_credits,credits_spent,estimated_usd")
    .eq("id", user.id)
    .single();

  if (profile?.access_status !== "approved") {
    redirect("/solicitud-pendiente");
  }

  const { data: projects } = await supabase
    .from("projects")
    .select("id,name,description,created_at,renders(id,status,output_path,created_at)")
    .order("created_at", { ascending: false })
    .limit(12);

  const projectsWithUrls = await Promise.all(
    (projects ?? []).map(async (project) => {
      const renders = ((project.renders ?? []) as RenderItem[]).sort(
        (a, b) => Date.parse(b.created_at) - Date.parse(a.created_at),
      );
      const rendersWithUrls = await Promise.all(
        renders.map(async (render) => {
          if (render.status !== "completed" || !render.output_path) return render;
          const { data } = await supabase.storage
            .from("render-assets")
            .createSignedUrl(render.output_path, 60 * 60);
          return { ...render, signedUrl: data?.signedUrl };
        }),
      );
      return { ...project, renders: rendersWithUrls };
    }),
  );

  return (
    <main style={{ minHeight: "100svh", padding: "clamp(28px,5vw,72px)", background: "var(--sand)" }}>
      <header style={{ display: "flex", justifyContent: "space-between", gap: 24, alignItems: "start" }}>
        <div>
          <p style={{ margin: "0 0 10px", color: "var(--rust)", fontSize: 11, letterSpacing: ".2em", textTransform: "uppercase" }}>
            Muromío / espacio de trabajo
          </p>
          <h1 style={{ margin: 0, fontFamily: "var(--font-lora)", fontSize: "clamp(36px,6vw,64px)", fontWeight: 500 }}>
            Tus proyectos
          </h1>
          <p style={{ color: "#655d58" }}>{user.email}</p>
          <p style={{ margin: "8px 0 0", color: "var(--rust)", fontSize: 13 }}>
            {profile.unlimited_credits ? "Créditos sin límite" : `${profile.credit_balance ?? 0} créditos disponibles`}
            {profile.role === "admin" ? ` · ${profile.credits_spent ?? 0} usados · $${Number(profile.estimated_usd ?? 0).toFixed(2)} USD` : ""}
          </p>
        </div>
        <form action="/auth/signout" method="post">
          <button
            type="submit"
            style={{
              padding: "10px 16px",
              border: "1px solid rgba(38,34,32,.3)",
              background: "transparent",
              color: "var(--ink)",
              cursor: "pointer",
              font: "inherit",
              fontSize: 12,
            }}
          >
            Cerrar sesión
          </button>
        </form>
      </header>

      <section style={{ marginTop: 64 }}>
        {profile.role === "admin" ? (
          <Link
            href="/panel/solicitudes"
            target="_blank"
            rel="noreferrer"
            style={{
              display: "inline-flex",
              marginRight: 12,
              marginBottom: 28,
              padding: "13px 21px",
              border: "1px solid var(--rust)",
              color: "var(--rust)",
              textDecoration: "none",
            }}
          >
            Solicitudes de acceso
          </Link>
        ) : null}
        <Link
          href="/panel/nuevo-render"
          style={{
            display: "inline-flex",
            marginBottom: 28,
            padding: "14px 22px",
            background: "var(--rust)",
            color: "var(--cream)",
            textDecoration: "none",
          }}
        >
          Crear nuevo render
        </Link>
        {projectsWithUrls.length ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 18 }}>
            {projectsWithUrls.map((project) => (
              <article key={project.id} style={{ overflow: "hidden", background: "var(--cream)", border: "1px solid rgba(38,34,32,.1)" }}>
                {project.renders[0]?.signedUrl ? (
                  // Signed Supabase URLs are generated dynamically and cannot use Next Image optimization safely.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={project.renders[0].signedUrl}
                    alt={`Render de ${project.name}`}
                    style={{ width: "100%", aspectRatio: "4 / 3", objectFit: "cover", display: "block" }}
                  />
                ) : null}
                <div style={{ padding: 24 }}>
                <h2 style={{ margin: "0 0 8px", fontFamily: "var(--font-lora)", fontWeight: 500 }}>{project.name}</h2>
                <p style={{ margin: 0, color: "#655d58", lineHeight: 1.6 }}>
                  {project.description || "Proyecto de visualización"}
                </p>
                <p style={{ color: "#817770", fontSize: 12 }}>
                  {project.renders.length} {project.renders.length === 1 ? "render" : "renders"}
                </p>
                {project.renders[0]?.signedUrl ? (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 16 }}>
                    <a href={project.renders[0].signedUrl} download style={projectActionStyle}>
                      Descargar
                    </a>
                    <Link href={`/panel/nuevo-render?sourceRenderId=${project.renders[0].id}`} style={projectActionStyle}>
                      Crear variación
                    </Link>
                    <Link href={`/panel/render/${project.renders[0].id}/editar`} style={projectActionStyle}>
                      Editar zona
                    </Link>
                  </div>
                ) : (
                  <p style={{ margin: "16px 0 0", color: "#817770", fontSize: 12 }}>
                    {project.renders[0]?.status === "failed" ? "La generación falló" : "Preparando render…"}
                  </p>
                )}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div style={{ maxWidth: 620, padding: "clamp(28px,5vw,48px)", background: "var(--cream)", border: "1px solid rgba(38,34,32,.1)" }}>
            <h2 style={{ margin: "0 0 12px", fontFamily: "var(--font-lora)", fontSize: 30, fontWeight: 500 }}>
              Tu espacio está listo
            </h2>
            <p style={{ margin: 0, color: "#655d58", lineHeight: 1.7 }}>
              Aquí aparecerán tus proyectos, planos, moodboards y versiones de render. La creación de proyectos será el siguiente módulo.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}

const projectActionStyle = {
  display: "inline-flex",
  padding: "9px 12px",
  border: "1px solid rgba(38,34,32,.2)",
  color: "var(--ink)",
  textDecoration: "none",
  fontSize: 12,
} as const;
