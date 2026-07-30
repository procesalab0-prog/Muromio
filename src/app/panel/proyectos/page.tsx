import Link from "next/link";
import { createProject } from "@/app/panel/actions";
import { WorkspaceHeader, WorkspaceShell } from "@/components/workspace-shell";
import { money, requireWorkspace, shortDate } from "@/lib/workspace";

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ nuevo?: string; error?: string; q?: string }>;
}) {
  const { nuevo, error, q } = await searchParams;
  const { supabase, profile } = await requireWorkspace();
  let projectsQuery = supabase
    .from("projects")
    .select("id,name,description,status,stage,location,project_type,target_budget,due_date,client:clients(name),tasks(id,status),approvals(id,status),renders(id,status)")
    .order("updated_at", { ascending: false });
  if (q?.trim()) projectsQuery = projectsQuery.ilike("name", `%${q.trim().slice(0, 80)}%`);
  const [{ data: projects }, { data: clients }] = await Promise.all([
    projectsQuery,
    supabase.from("clients").select("id,name").in("status", ["lead", "active"]).order("name"),
  ]);

  return (
    <WorkspaceShell section="/panel/proyectos" userName={profile.full_name || profile.email || "Muromío"} role={profile.role} credits={profile.unlimited_credits ? null : profile.credit_balance}>
      <WorkspaceHeader
        eyebrow={q ? "Resultados de búsqueda" : "Portafolio operativo"}
        title={q ? `Proyectos para “${q}”` : "Proyectos con contexto."}
        description="Del brief a la entrega, cada versión y decisión queda conectada."
        actions={<Link href="/panel/proyectos?nuevo=1" className="button-primary">Nuevo proyecto</Link>}
      />
      {nuevo ? (
        <section className="workspace-card project-create">
          <div className="workspace-card-head"><div><small>Alta de proyecto</small><h2>Crear un nuevo espacio</h2></div><Link href="/panel/proyectos">Cerrar ×</Link></div>
          <form action={createProject} className="workspace-form">
            {error ? <p className="form-error" role="alert">{error}</p> : null}
            <div className="form-pair">
              <label>Nombre del proyecto<input name="name" required placeholder="Casa Encino" /></label>
              <label>Cliente<select name="client_id" defaultValue=""><option value="">Proyecto interno</option>{(clients ?? []).map((client) => <option value={client.id} key={client.id}>{client.name}</option>)}</select></label>
            </div>
            <div className="form-triple">
              <label>Tipo<input name="project_type" placeholder="Residencial" /></label>
              <label>Ubicación<input name="location" placeholder="León, Guanajuato" /></label>
              <label>Área m²<input name="area_m2" type="number" min="0" step="0.1" /></label>
            </div>
            <div className="form-pair">
              <label>Presupuesto objetivo<input name="target_budget" type="number" min="0" placeholder="1500000" /></label>
              <label>Entrega prevista<input name="due_date" type="date" /></label>
            </div>
            <label>Visión inicial<textarea name="description" rows={4} placeholder="Objetivo, atmósfera, alcance y necesidades principales…" /></label>
            <button type="submit" className="button-primary">Crear expediente completo</button>
          </form>
        </section>
      ) : null}
      <section className="portfolio-grid">
        {(projects ?? []).map((project, index) => {
          const pending = (project.tasks ?? []).filter((task) => task.status !== "done").length;
          const decisions = (project.approvals ?? []).filter((approval) => approval.status === "pending").length;
          return (
            <Link className={`portfolio-card tone-${index % 4}`} href={`/panel/proyectos/${project.id}`} key={project.id}>
              <div className="portfolio-card-top">
                <span>{String(index + 1).padStart(2, "0")}</span>
                <span className={`client-state state-${project.status}`}>{project.status}</span>
              </div>
              <div>
                <small>{project.project_type || "Interiorismo"} · {project.location || "Muromío"}</small>
                <h2>{project.name}</h2>
                <p>{project.description || "Expediente creativo y operativo del proyecto."}</p>
              </div>
              <dl>
                <div><dt>Etapa</dt><dd>{project.stage}</dd></div>
                <div><dt>Pendientes</dt><dd>{pending}</dd></div>
                <div><dt>Aprobaciones</dt><dd>{decisions}</dd></div>
                <div><dt>Entrega</dt><dd>{project.due_date ? shortDate(project.due_date) : "Abierta"}</dd></div>
              </dl>
              <footer><span>{money(project.target_budget)}</span><b>Abrir proyecto ↗</b></footer>
            </Link>
          );
        })}
        {!(projects ?? []).length ? <div className="workspace-empty"><span>El portafolio operativo está listo para su primer proyecto.</span><Link href="/panel/proyectos?nuevo=1">Crear proyecto</Link></div> : null}
      </section>
    </WorkspaceShell>
  );
}
