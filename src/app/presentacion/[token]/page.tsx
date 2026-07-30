import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { shortDate } from "@/lib/workspace";

type SharedPresentation = {
  share: { label: string | null; allow_download: boolean; expires_at: string | null };
  project: {
    id: string;
    name: string;
    description: string | null;
    location: string | null;
    project_type: string | null;
    stage: string;
    client_name: string | null;
  };
  versions: Array<{
    id: string;
    version_number: number;
    title: string;
    description: string | null;
    asset_type: string;
    asset_path: string | null;
    status: string;
    created_at: string;
  }>;
};

export default async function SharedPresentationPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = await createClient();
  const { data } = await supabase.rpc("get_shared_presentation", { p_token: token });
  const presentation = data as SharedPresentation | null;
  if (!presentation) notFound();
  const versions = await Promise.all(presentation.versions.map(async (version) => {
    if (!version.asset_path) return { ...version, imageUrl: null };
    const { data: signed } = await supabase.storage.from("render-assets").createSignedUrl(version.asset_path, 60 * 30);
    return { ...version, imageUrl: signed?.signedUrl || null };
  }));

  async function respond(formData: FormData) {
    "use server";
    const server = await createClient();
    await server.rpc("respond_to_shared_presentation", {
      p_token: token,
      p_name: String(formData.get("name") ?? ""),
      p_email: String(formData.get("email") ?? ""),
      p_status: String(formData.get("status") ?? ""),
      p_message: String(formData.get("message") ?? ""),
    });
  }

  return (
    <main className="client-presentation">
      <header>
        <Link href="/" className="client-presentation-brand"><b>muro</b>mío</Link>
        <span>Presentación privada · {presentation.share.label || "Proyecto"}</span>
      </header>
      <section className="client-presentation-hero">
        <p>{presentation.project.project_type || "Interiorismo"} · {presentation.project.location || "Muromío"}</p>
        <h1>{presentation.project.name}</h1>
        <div><span>Preparado para</span><strong>{presentation.project.client_name || "Nuestro cliente"}</strong></div>
      </section>
      <section className="client-presentation-statement">
        <span>La intención</span>
        <p>{presentation.project.description || "Una propuesta construida para sentirse cálida, funcional y profundamente propia."}</p>
      </section>
      <section className="client-version-list">
        <div className="client-section-title"><span>Propuestas</span><h2>Historia de decisiones</h2></div>
        {versions.length ? versions.map((version) => (
          <article key={version.id}>
            <b>V{version.version_number}</b>
            <div>{version.imageUrl ? <Image src={version.imageUrl} alt={version.title} width={1600} height={1000} unoptimized /> : null}<h3>{version.title}</h3><p>{version.description || "Propuesta preparada por el equipo Muromío."}</p></div>
            <span>{version.asset_type}<small>{shortDate(version.created_at)}</small></span>
          </article>
        )) : <p className="client-empty">El equipo está preparando los entregables visibles para esta presentación.</p>}
      </section>
      <section className="client-decision">
        <div><span>Tu decisión</span><h2>Avancemos juntos.</h2><p>Tu respuesta quedará registrada en el historial del proyecto para que todo el equipo trabaje sobre la misma dirección.</p></div>
        <form action={respond}>
          <div><input name="name" required placeholder="Tu nombre" /><input name="email" type="email" required placeholder="Tu correo" /></div>
          <textarea name="message" rows={4} placeholder="Comentarios o ajustes importantes…" />
          <div><button name="status" value="changes_requested" className="button-secondary">Solicitar cambios</button><button name="status" value="approved" className="button-primary">Aprobar propuesta</button></div>
        </form>
      </section>
      <footer><span>Muromío · Interiorismo con intención</span><small>Experiencia privada bajo marca Muromío</small></footer>
    </main>
  );
}
