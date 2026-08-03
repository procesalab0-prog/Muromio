import Image from "next/image";
import { notFound } from "next/navigation";
import { money, relationOne, requireWorkspace, shortDate } from "@/lib/workspace";

export default async function ProjectDocumentPage({
  params,
}: {
  params: Promise<{ id: string; documentId: string }>;
}) {
  const { id, documentId } = await params;
  const { supabase, profile } = await requireWorkspace();
  const [
    { data: project },
    { data: document },
    { data: budgets },
    { data: phases },
    { data: versions },
    { data: renders },
  ] = await Promise.all([
    supabase.from("projects").select("*,client:clients(*)").eq("id", id).single(),
    supabase.from("generated_documents").select("*").eq("id", documentId).eq("project_id", id).single(),
    supabase.from("budgets").select("*,items:budget_items(*)").eq("project_id", id).order("created_at", { ascending: false }),
    supabase.from("project_phases").select("*").eq("project_id", id).order("sort_order"),
    supabase.from("project_versions").select("*").eq("project_id", id).order("version_number", { ascending: false }),
    supabase.from("renders").select("id,output_path,created_at,prompt").eq("project_id", id).eq("status", "completed").order("created_at", { ascending: false }),
  ]);

  if (!project || !document) notFound();
  const client = relationOne(project.client);
  const budget = budgets?.[0];
  const sections = new Set<string>(document.included_sections?.length ? document.included_sections : ["vision", "process", "renders", "budget", "notes"]);
  const selectedIds = new Set<string>(document.render_ids ?? []);
  const selectedRenders = (renders ?? []).filter((render) => selectedIds.has(render.id));
  const renderImages = await Promise.all(selectedRenders.map(async (render) => {
    const { data } = await supabase.storage.from("render-assets").createSignedUrl(render.output_path, 60 * 60);
    return { ...render, signedUrl: data?.signedUrl || null };
  }));

  return (
    <main className="print-document">
      <header>
        <div className="print-brand"><b>muro</b>mío</div>
        <div><span>{documentLabel(document.document_type)}</span><small>{shortDate(document.created_at)}</small></div>
      </header>
      <section className="print-cover">
        <p>{project.project_type || "Proyecto de interiorismo"} · {project.location || "Muromío"}</p>
        <h1>{document.title}</h1>
        <h2>{project.name}</h2>
        <div><span>Preparado para</span><strong>{client?.name || "Proyecto interno"}</strong></div>
      </section>
      {sections.has("vision") ? <section className="print-section">
        <span>01 · Visión</span>
        <h2>Intención del proyecto</h2>
        <p>{project.description || "Un espacio cálido, funcional y profundamente conectado con las personas que lo habitan."}</p>
        <dl>
          <div><dt>Superficie</dt><dd>{project.area_m2 ? `${project.area_m2} m²` : "Por definir"}</dd></div>
          <div><dt>Entrega</dt><dd>{shortDate(project.due_date)}</dd></div>
          <div><dt>Etapa</dt><dd>{project.stage}</dd></div>
          <div><dt>Responsable</dt><dd>{profile.full_name || "Equipo Muromío"}</dd></div>
        </dl>
      </section> : null}
      {sections.has("process") ? <section className="print-section">
        <span>02 · Ruta</span>
        <h2>Proceso de trabajo</h2>
        <ol>{(phases ?? []).map((phase) => <li key={phase.id}><b>{phase.name}</b><small>{phase.status}</small></li>)}</ol>
        <div className="print-progress"><i style={{ width: `${project.progress_percent ?? 0}%` }} /><span>{project.progress_percent ?? 0}% de avance general</span></div>
      </section> : null}
      {sections.has("renders") ? <section className="print-section print-render-section">
        <span>03 · Entregables</span>
        <h2>Propuestas seleccionadas</h2>
        {renderImages.length ? <div className="print-render-grid">{renderImages.map((render, index) => render.signedUrl ? <figure key={render.id}><Image src={render.signedUrl} alt={`Propuesta ${index + 1}`} width={1500} height={1000} unoptimized /><figcaption>Propuesta {index + 1} · {shortDate(render.created_at)}</figcaption></figure> : null)}</div> : (versions ?? []).length ? (versions ?? []).slice(0, 8).map((version) => (
          <article key={version.id}><b>V{version.version_number}</b><div><strong>{version.title}</strong><p>{version.description || "Propuesta preparada por Muromío."}</p></div><small>{shortDate(version.created_at)}</small></article>
        )) : <p>Los entregables visuales se incorporarán conforme avance el proyecto.</p>}
      </section> : null}
      {sections.has("budget") && budget ? (
        <section className="print-section">
          <span>04 · Inversión</span>
          <h2>{budget.title}</h2>
          {(budget.items ?? []).map((item: { id: string; concept: string; quantity: number; unit: string; total: number }) => (
            <article key={item.id}><div><strong>{item.concept}</strong><p>{item.quantity} {item.unit}</p></div><b>{money(item.total, budget.currency)}</b></article>
          ))}
          <div className="print-total"><span>Total con IVA</span><strong>{money(budget.total, budget.currency)}</strong></div>
        </section>
      ) : null}
      {sections.has("notes") && document.notes ? <section className="print-section"><span>05 · Notas</span><h2>Contexto y decisiones</h2><p>{document.notes}</p></section> : null}
      <footer><span>Muromío · Interiorismo con intención</span><small>Documento generado desde Muromío Studio OS</small></footer>
    </main>
  );
}

function documentLabel(type: string) {
  return ({
    proposal: "Propuesta de diseño",
    contract: "Contrato de servicios",
    brief: "Brief de proyecto",
    minutes: "Minuta de reunión",
    budget: "Presupuesto",
    spec_sheet: "Fichas técnicas",
    weekly_report: "Reporte semanal",
    approval: "Acta de aprobación",
    delivery_manual: "Manual de entrega",
  } as Record<string, string>)[type] || "Documento Muromío";
}
