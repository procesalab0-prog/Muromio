import { createClient } from "@/app/panel/actions";
import { WorkspaceHeader, WorkspaceShell } from "@/components/workspace-shell";
import { requireTeamWorkspace, shortDate } from "@/lib/workspace";

export default async function ClientsPage() {
  const { supabase, profile } = await requireTeamWorkspace();
  const { data: clients } = await supabase
    .from("clients")
    .select("id,name,email,phone,company,status,created_at,projects(id,name,status)")
    .order("created_at", { ascending: false });

  return (
    <WorkspaceShell section="/panel/clientes" userName={profile.full_name || profile.email || "Muromío"} role={profile.role} credits={profile.unlimited_credits ? null : profile.credit_balance}>
      <WorkspaceHeader
        eyebrow="Relaciones"
        title="Clientes con memoria."
        description="Cada conversación, preferencia y proyecto permanece conectada."
      />
      <section className="workspace-grid workspace-grid-form">
        <article className="workspace-card">
          <div className="workspace-card-head"><div><small>Nuevo expediente</small><h2>Agregar cliente</h2></div></div>
          <form action={createClient} className="workspace-form">
            <label>Nombre completo<input name="name" required placeholder="Mariana y Carlos" /></label>
            <div className="form-pair">
              <label>Correo<input name="email" type="email" placeholder="cliente@correo.com" /></label>
              <label>Teléfono<input name="phone" type="tel" placeholder="+52 477…" /></label>
            </div>
            <label>Empresa o familia<input name="company" placeholder="Casa Roble / Grupo…" /></label>
            <label>Etapa<select name="status" defaultValue="active"><option value="lead">Prospecto</option><option value="active">Activo</option><option value="paused">En pausa</option><option value="completed">Concluido</option></select></label>
            <label>Notas<textarea name="notes" rows={4} placeholder="Preferencias, contexto y acuerdos iniciales…" /></label>
            <button className="button-primary" type="submit">Guardar cliente</button>
          </form>
        </article>
        <article className="workspace-card workspace-card-wide">
          <div className="workspace-card-head"><div><small>Directorio privado</small><h2>{clients?.length ?? 0} relaciones</h2></div></div>
          <div className="client-grid">
            {(clients ?? []).map((client) => (
              <article className="client-card" key={client.id}>
                <div className="client-monogram">{client.name.slice(0, 2).toUpperCase()}</div>
                <span className={`client-state state-${client.status}`}>{clientStatus(client.status)}</span>
                <h3>{client.name}</h3>
                <p>{client.company || client.email || "Cliente particular"}</p>
                <div><span>{client.projects?.length ?? 0} proyectos</span><span>desde {shortDate(client.created_at)}</span></div>
              </article>
            ))}
            {!(clients ?? []).length ? <div className="workspace-empty"><span>Aún no hay clientes registrados.</span></div> : null}
          </div>
        </article>
      </section>
    </WorkspaceShell>
  );
}

function clientStatus(status: string) {
  return ({ lead: "Prospecto", active: "Activo", paused: "En pausa", completed: "Concluido", archived: "Archivado" } as Record<string, string>)[status] || status;
}
