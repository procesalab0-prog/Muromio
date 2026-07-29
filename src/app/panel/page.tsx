import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function PanelPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: projects } = await supabase
    .from("projects")
    .select("id,name,description,created_at")
    .order("created_at", { ascending: false })
    .limit(12);

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
        {projects?.length ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 18 }}>
            {projects.map((project) => (
              <article key={project.id} style={{ padding: 24, background: "var(--cream)", border: "1px solid rgba(38,34,32,.1)" }}>
                <h2 style={{ margin: "0 0 8px", fontFamily: "var(--font-lora)", fontWeight: 500 }}>{project.name}</h2>
                <p style={{ margin: 0, color: "#655d58", lineHeight: 1.6 }}>
                  {project.description || "Proyecto de visualización"}
                </p>
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
