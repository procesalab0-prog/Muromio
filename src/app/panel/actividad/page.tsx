import { WorkspaceHeader, WorkspaceShell } from "@/components/workspace-shell";
import { relationOne, requireWorkspace, shortDate } from "@/lib/workspace";

export default async function ActivityPage() {
  const { supabase, profile } = await requireWorkspace();
  const [{ data: events }, { data: transactions }] = await Promise.all([
    supabase.from("activity_events").select("*,actor:profiles(full_name,email),project:projects(name)").order("created_at", { ascending: false }).limit(80),
    supabase.from("credit_transactions").select("id,amount,estimated_usd,operation,created_at,user:profiles(full_name,email)").order("created_at", { ascending: false }).limit(30),
  ]);
  return (
    <WorkspaceShell section="/panel/actividad" userName={profile.full_name || profile.email || "Muromío"} role={profile.role} credits={profile.unlimited_credits ? null : profile.credit_balance}>
      <WorkspaceHeader eyebrow="Trazabilidad" title="Nada se pierde." description="Decisiones, cambios y consumo del despacho con contexto y autor." />
      <section className="workspace-grid workspace-grid-main">
        <article className="workspace-card workspace-card-wide">
          <div className="workspace-card-head"><div><small>Bitácora del despacho</small><h2>Actividad reciente</h2></div></div>
          <div className="timeline">
            {(events ?? []).map((event) => (
              <article key={event.id}>
                <i />
                <time>{shortDate(event.created_at)}</time>
                <div><strong>{event.summary}</strong><p>{relationOne(event.project)?.name || "Operación del estudio"} · {relationOne(event.actor)?.full_name || relationOne(event.actor)?.email || "Muromío"}</p></div>
                <span>{event.event_type}</span>
              </article>
            ))}
            {!(events ?? []).length ? <p className="muted">La nueva actividad comenzará a registrarse automáticamente.</p> : null}
          </div>
        </article>
        <article className="workspace-card">
          <div className="workspace-card-head"><div><small>Inteligencia artificial</small><h2>Consumo</h2></div></div>
          <div className="usage-list">
            {(transactions ?? []).map((transaction) => <article key={transaction.id}><div><strong>{transaction.operation}</strong><small>{shortDate(transaction.created_at)}</small></div><span>{transaction.amount} cr.</span><b>${Math.abs(Number(transaction.estimated_usd)).toFixed(2)}</b></article>)}
          </div>
        </article>
      </section>
    </WorkspaceShell>
  );
}
