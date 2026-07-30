import Link from "next/link";
import { WorkspaceHeader, WorkspaceShell } from "@/components/workspace-shell";
import { money, relationOne, requireWorkspace, shortDate } from "@/lib/workspace";

export default async function PanelPage() {
  const { supabase, profile } = await requireWorkspace();

  const [
    { data: projects },
    { data: clients },
    { data: tasks },
    { data: budgets },
    { data: approvals },
    { data: activity },
  ] = await Promise.all([
    supabase
      .from("projects")
      .select("id,name,status,stage,due_date,target_budget,client:clients(name),renders(id,status)")
      .neq("status", "archived")
      .order("updated_at", { ascending: false })
      .limit(100),
    supabase.from("clients").select("id,status", { count: "exact" }).neq("status", "archived"),
    supabase
      .from("tasks")
      .select("id,title,status,priority,due_at,project:projects(id,name)")
      .neq("status", "done")
      .order("due_at", { ascending: true, nullsFirst: false })
      .limit(100),
    supabase.from("budgets").select("id,total,status,project:projects(name)").order("created_at", { ascending: false }),
    supabase
      .from("approvals")
      .select("id,status,requested_at,project:projects(id,name)")
      .eq("status", "pending")
      .order("requested_at", { ascending: false })
      .limit(5),
    supabase
      .from("activity_events")
      .select("id,summary,created_at,project:projects(name)")
      .order("created_at", { ascending: false })
      .limit(7),
  ]);

  const activeProjects = (projects ?? []).filter((project) => project.status !== "completed").length;
  const pendingTasks = (tasks ?? []).length;
  const pendingApprovals = (approvals ?? []).length;
  const pipeline = (budgets ?? [])
    .filter((budget) => ["draft", "sent"].includes(budget.status))
    .reduce((total, budget) => total + Number(budget.total ?? 0), 0);
  const firstName = (profile.full_name || "Muromío").split(" ")[0];
  const today = new Intl.DateTimeFormat("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());
  const stageCounts = ["brief", "concept", "design", "development", "procurement", "construction", "delivery"]
    .map((stage) => ({ stage, count: (projects ?? []).filter((project) => project.stage === stage).length }))
    .filter((item) => item.count > 0);
  const maxStageCount = Math.max(1, ...stageCounts.map((item) => item.count));
  const workload = [
    { label: "Urgentes", count: (tasks ?? []).filter((task) => task.priority === "urgent").length, tone: "urgent" },
    { label: "Alta prioridad", count: (tasks ?? []).filter((task) => task.priority === "high").length, tone: "high" },
    { label: "Programadas", count: (tasks ?? []).filter((task) => !["urgent", "high"].includes(task.priority)).length, tone: "normal" },
  ];
  const maxWorkload = Math.max(1, ...workload.map((item) => item.count));

  return (
    <WorkspaceShell
      section="/panel"
      userName={profile.full_name || profile.email || "Muromío"}
      role={profile.role}
      credits={profile.unlimited_credits ? null : profile.credit_balance}
    >
      <WorkspaceHeader
        eyebrow={today}
        title={`Buenos días, ${firstName}.`}
        description={`Hoy hay ${pendingApprovals} aprobaciones esperando respuesta y ${pendingTasks} tareas abiertas en el despacho.`}
        actions={
          <>
            {profile.role === "admin" ? <Link href="/panel/solicitudes" className="button-secondary">Accesos</Link> : null}
            {profile.role !== "client" ? <Link href="/panel/proyectos?nuevo=1" className="button-primary">Nuevo proyecto</Link> : null}
          </>
        }
      />

      <section className="workspace-metrics">
        <article><span>Proyectos activos</span><strong>{activeProjects}</strong><small>en el estudio</small></article>
        <article><span>Decisiones pendientes</span><strong>{pendingApprovals}</strong><small>por aprobar</small></article>
        <article><span>Trabajo abierto</span><strong>{pendingTasks}</strong><small>tareas próximas</small></article>
        <article className="is-accent"><span>Pipeline cotizado</span><strong>{money(pipeline)}</strong><small>por cerrar</small></article>
      </section>

      <section className="workspace-grid workspace-grid-main">
        <article className="workspace-card workspace-card-wide">
          <div className="workspace-card-head">
            <div><small>Portafolio activo</small><h2>Proyectos en movimiento</h2></div>
            <Link href="/panel/proyectos">Ver todos ↗</Link>
          </div>
          <div className="project-list">
            {(projects ?? []).length ? (projects ?? []).slice(0, 6).map((project) => (
              <Link href={`/panel/proyectos/${project.id}`} key={project.id} className="project-row">
                <span className={`project-status status-${project.status}`} />
                <div>
                  <strong>{project.name}</strong>
                  <small>{relationOne(project.client)?.name || "Proyecto interno"}</small>
                </div>
                <span className="project-stage">{stageLabel(project.stage)}</span>
                <span>{project.due_date ? shortDate(project.due_date) : "Sin entrega"}</span>
                <b>↗</b>
              </Link>
            )) : (
              <div className="workspace-empty">
                <span>Tu próximo gran proyecto empieza aquí.</span>
                <Link href="/panel/proyectos?nuevo=1">Crear proyecto</Link>
              </div>
            )}
          </div>
        </article>

        <article className="workspace-card">
          <div className="workspace-card-head">
            <div><small>Próximos pasos</small><h2>Agenda crítica</h2></div>
          </div>
          <div className="task-list">
            {(tasks ?? []).length ? (tasks ?? []).slice(0, 6).map((task) => (
              <div className="task-row" key={task.id}>
                <span className={`priority-${task.priority}`} />
                <div><strong>{task.title}</strong><small>{relationOne(task.project)?.name || "Estudio"}</small></div>
                <time>{task.due_at ? shortDate(task.due_at) : "Abierta"}</time>
              </div>
            )) : <p className="muted">No hay tareas pendientes.</p>}
          </div>
        </article>
      </section>

      <section className="workspace-grid workspace-grid-main os-insight-grid">
        <article className="workspace-card">
          <div className="workspace-card-head"><div><small>Distribución real</small><h2>Proyectos por etapa</h2></div><span>{activeProjects}</span></div>
          <div className="os-bar-chart">
            {stageCounts.length ? stageCounts.map((item) => (
              <div key={item.stage}>
                <span>{stageLabel(item.stage)}</span>
                <i><b style={{ width: `${(item.count / maxStageCount) * 100}%` }} /></i>
                <strong>{item.count}</strong>
              </div>
            )) : <p className="muted">Crea proyectos para visualizar la carga por etapa.</p>}
          </div>
        </article>
        <article className="workspace-card">
          <div className="workspace-card-head"><div><small>Atención operativa</small><h2>Carga de trabajo</h2></div><span>{pendingTasks}</span></div>
          <div className="os-bar-chart">
            {workload.map((item) => (
              <div key={item.label}>
                <span>{item.label}</span>
                <i><b className={`tone-${item.tone}`} style={{ width: `${(item.count / maxWorkload) * 100}%` }} /></i>
                <strong>{item.count}</strong>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="workspace-grid workspace-grid-thirds">
        <article className="workspace-card">
          <div className="workspace-card-head"><div><small>Clientes</small><h2>Relaciones activas</h2></div></div>
          <strong className="large-number">{clients?.length ?? 0}</strong>
          <p className="muted">Expedientes con información, preferencias y proyectos relacionados.</p>
          <Link href="/panel/clientes" className="text-link">Abrir directorio →</Link>
        </article>
        <article className="workspace-card workspace-card-dark">
          <div className="workspace-card-head"><div><small>Render Lab</small><h2>Inteligencia visual</h2></div></div>
          <strong className="large-number">{profile.unlimited_credits ? "∞" : profile.credit_balance ?? 0}</strong>
          <p className="muted">Créditos disponibles para generación y edición bajo marca Muromío.</p>
          <Link href="/panel/nuevo-render" className="text-link">Crear propuesta →</Link>
        </article>
        <article className="workspace-card">
          <div className="workspace-card-head"><div><small>Actividad</small><h2>Lo último</h2></div></div>
          {(activity ?? []).slice(0, 3).map((event) => (
            <p key={event.id} className="activity-brief">{event.summary}<small>{shortDate(event.created_at)}</small></p>
          ))}
          {!(activity ?? []).length ? <p className="muted">La actividad del despacho aparecerá aquí.</p> : null}
        </article>
      </section>
    </WorkspaceShell>
  );
}

function stageLabel(stage: string) {
  return ({
    brief: "Brief",
    concept: "Concepto",
    design: "Diseño",
    development: "Desarrollo",
    procurement: "Compras",
    construction: "Obra",
    delivery: "Entrega",
  } as Record<string, string>)[stage] || stage;
}
