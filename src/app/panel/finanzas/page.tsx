import { WorkspaceHeader, WorkspaceShell } from "@/components/workspace-shell";
import { updatePaymentStatus } from "@/app/panel/actions";
import { money, relationOne, requireTeamWorkspace, shortDate } from "@/lib/workspace";

export default async function FinancePage() {
  const { supabase, profile } = await requireTeamWorkspace();
  const [{ data: budgets }, { data: payments }, { data: projects }] = await Promise.all([
    supabase.from("budgets").select("*,project:projects(name),items:budget_items(*)").order("created_at", { ascending: false }),
    supabase.from("payments").select("*,project:projects(name)").order("due_on", { ascending: true }),
    supabase.from("projects").select("id,name,target_budget,status").neq("status", "archived"),
  ]);
  const quoted = (budgets ?? []).reduce((sum, item) => sum + Number(item.total ?? 0), 0);
  const approved = (budgets ?? []).filter((item) => item.status === "approved").reduce((sum, item) => sum + Number(item.total ?? 0), 0);
  const collected = (payments ?? []).filter((item) => item.status === "paid").reduce((sum, item) => sum + Number(item.amount ?? 0), 0);
  const pending = (payments ?? []).filter((item) => ["pending", "overdue"].includes(item.status)).reduce((sum, item) => sum + Number(item.amount ?? 0), 0);
  const now = new Date();
  const monthlyIncome = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
    const amount = (payments ?? [])
      .filter((payment) => {
        if (payment.status !== "paid" || !payment.paid_at) return false;
        const paidAt = new Date(payment.paid_at);
        return paidAt.getFullYear() === date.getFullYear() && paidAt.getMonth() === date.getMonth();
      })
      .reduce((sum, payment) => sum + Number(payment.amount ?? 0), 0);
    return { label: new Intl.DateTimeFormat("es-MX", { month: "short" }).format(date), amount };
  });
  const maxMonthlyIncome = Math.max(1, ...monthlyIncome.map((item) => item.amount));
  return (
    <WorkspaceShell section="/panel/finanzas" userName={profile.full_name || profile.email || "Muromío"} role={profile.role} credits={profile.unlimited_credits ? null : profile.credit_balance}>
      <WorkspaceHeader eyebrow="Administración creativa" title="Diseñar también es medir." description="Honorarios, presupuestos y cobranza conectados con cada proyecto." />
      <section className="workspace-metrics">
        <article><span>Total cotizado</span><strong>{money(quoted)}</strong><small>histórico</small></article>
        <article><span>Aprobado</span><strong>{money(approved)}</strong><small>trabajo contratado</small></article>
        <article><span>Cobrado</span><strong>{money(collected)}</strong><small>ingreso realizado</small></article>
        <article className="is-accent"><span>Por cobrar</span><strong>{money(pending)}</strong><small>próximos pagos</small></article>
      </section>
      <section className="workspace-card finance-chart-card">
        <div className="workspace-card-head"><div><small>Ingreso realizado</small><h2>Cobranza de los últimos 6 meses</h2></div><strong>{money(collected)}</strong></div>
        <div className="os-column-chart">
          {monthlyIncome.map((item) => (
            <div key={item.label}>
              <strong>{item.amount ? money(item.amount) : "—"}</strong>
              <i><b style={{ height: `${Math.max(item.amount ? 8 : 2, (item.amount / maxMonthlyIncome) * 100)}%` }} /></i>
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </section>
      <section className="workspace-grid workspace-grid-main">
        <article className="workspace-card workspace-card-wide">
          <div className="workspace-card-head"><div><small>Documentos comerciales</small><h2>Presupuestos</h2></div><span>{budgets?.length ?? 0}</span></div>
          <div className="finance-table">
            <div className="finance-table-head"><span>Folio</span><span>Proyecto</span><span>Estado</span><span>Vigencia</span><span>Total</span></div>
            {(budgets ?? []).map((budget) => <div key={budget.id}><strong>{budget.number}</strong><span>{relationOne(budget.project)?.name || "Proyecto"}</span><span className={`finance-status status-${budget.status}`}>{budget.status}</span><span>{shortDate(budget.valid_until)}</span><b>{money(budget.total, budget.currency)}</b></div>)}
          </div>
          {!(budgets ?? []).length ? <p className="muted">Los presupuestos creados dentro de cada proyecto aparecerán aquí.</p> : null}
        </article>
        <article className="workspace-card">
          <div className="workspace-card-head"><div><small>Cobranza</small><h2>Calendario</h2></div></div>
          <div className="payment-list">{(payments ?? []).map((payment) => <article key={payment.id}><span className={`payment-${payment.status}`} /><div><strong>{payment.concept}</strong><small>{relationOne(payment.project)?.name || "Muromío"} · {shortDate(payment.due_on)}</small></div><b>{money(payment.amount, payment.currency)}</b><form action={updatePaymentStatus.bind(null, payment.id)}><select name="status" defaultValue={payment.status}><option value="pending">Pendiente</option><option value="paid">Pagado</option><option value="overdue">Vencido</option><option value="cancelled">Cancelado</option></select><button type="submit">Guardar</button></form></article>)}</div>
          {!(payments ?? []).length ? <p className="muted">Aún no hay parcialidades programadas.</p> : null}
        </article>
      </section>
      <section className="workspace-card">
        <div className="workspace-card-head"><div><small>Capacidad comercial</small><h2>Valor por proyecto</h2></div></div>
        <div className="project-value-grid">{(projects ?? []).map((project) => <article key={project.id}><span>{project.name}</span><strong>{money(project.target_budget)}</strong><div><i style={{ width: `${Math.min(100, Number(project.target_budget ?? 0) / Math.max(...(projects ?? []).map((item) => Number(item.target_budget ?? 1))) * 100)}%` }} /></div></article>)}</div>
      </section>
    </WorkspaceShell>
  );
}
