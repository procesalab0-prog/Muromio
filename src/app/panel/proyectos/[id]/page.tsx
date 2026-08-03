import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { addProjectMember, createBudget, createBudgetItem, createComment, createPayment, createProjectDocument, createShareLink, createTask, removeProjectMember, requestApproval, updateProject, updateProjectProgress, updateTaskStatus, uploadProjectFile } from "@/app/panel/actions";
import { BeforeAfter } from "@/components/before-after";
import { WorkspaceHeader, WorkspaceShell } from "@/components/workspace-shell";
import { ArrowRightIcon, ExternalLinkIcon } from "@/components/os-icons";
import { money, relationOne, requireWorkspace, shortDate } from "@/lib/workspace";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, profile, user } = await requireWorkspace();
  const [
    { data: project },
    { data: phases },
    { data: tasks },
    { data: versions },
    { data: approvals },
    { data: comments },
    { data: budgets },
    { data: files },
    { data: renders },
    { data: videos },
    { data: documents },
    { data: shareLinks },
    { data: members },
  ] = await Promise.all([
    supabase.from("projects").select("*,client:clients(*)").eq("id", id).single(),
    supabase.from("project_phases").select("*").eq("project_id", id).order("sort_order"),
    supabase.from("tasks").select("*,assignee:profiles(full_name)").eq("project_id", id).order("created_at", { ascending: false }),
    supabase.from("project_versions").select("*").eq("project_id", id).order("version_number", { ascending: false }),
    supabase.from("approvals").select("*").eq("project_id", id).order("requested_at", { ascending: false }),
    supabase.from("project_comments").select("*").eq("project_id", id).order("created_at", { ascending: false }).limit(20),
    supabase.from("budgets").select("*").eq("project_id", id).order("created_at", { ascending: false }),
    supabase.from("project_files").select("*").eq("project_id", id).order("created_at", { ascending: false }),
    supabase.from("renders").select("id,status,output_path,created_at,prompt,provider").eq("project_id", id).order("created_at", { ascending: false }),
    supabase.from("project_videos").select("*").eq("project_id", id).order("created_at", { ascending: false }),
    supabase.from("generated_documents").select("*").eq("project_id", id).order("created_at", { ascending: false }),
    supabase.from("share_links").select("*").eq("project_id", id).is("revoked_at", null).order("created_at", { ascending: false }),
    supabase.from("project_members").select("*,profile:profiles(full_name,email)").eq("project_id", id).order("created_at"),
  ]);

  if (!project) notFound();
  const ownMembership = (members ?? []).find((member) => member.user_id === user.id);
  const canEdit = profile.role === "admin"
    || project.owner_id === user.id
    || (profile.role === "staff" && ["director", "architect", "designer"].includes(ownMembership?.role ?? ""));
  const taskAction = createTask.bind(null, id);
  const budgetAction = createBudget.bind(null, id);
  const commentAction = createComment.bind(null, id);
  const approvalAction = requestApproval.bind(null, id);
  const shareAction = createShareLink.bind(null, id);
  const documentAction = createProjectDocument.bind(null, id);
  const fileAction = uploadProjectFile.bind(null, id);
  const paymentAction = createPayment.bind(null, id);
  const memberAction = addProjectMember.bind(null, id);
  const approvedPhases = (phases ?? []).filter((phase) => ["approved", "completed"].includes(phase.status)).length;
  const calculatedProgress = phases?.length ? Math.round((approvedPhases / phases.length) * 100) : 0;
  const progress = Number.isFinite(project.progress_percent) ? project.progress_percent : calculatedProgress;
  const renderAssets = await Promise.all(
    (renders ?? [])
      .filter((render) => render.status === "completed" && render.output_path)
      .slice(0, 60)
      .map(async (render) => {
        const { data } = await supabase.storage.from("render-assets").createSignedUrl(render.output_path!, 60 * 60);
        return { ...render, signedUrl: data?.signedUrl || null };
      }),
  );
  const visibleRenders = renderAssets.filter((render) => render.signedUrl);
  const fileLinks = await Promise.all(
    (files ?? []).slice(0, 6).map(async (file) => {
      const { data } = await supabase.storage.from("project-assets").createSignedUrl(file.storage_path, 60 * 30);
      return { ...file, signedUrl: data?.signedUrl || null };
    }),
  );

  return (
    <WorkspaceShell section="/panel/proyectos" userName={profile.full_name || profile.email || "Muromío"} role={profile.role} credits={profile.unlimited_credits ? null : profile.credit_balance}>
      <WorkspaceHeader
        eyebrow={`${project.project_type || "Proyecto"} / ${project.location || "Muromío"}`}
        title={project.name}
        description={project.description || "Expediente central del proyecto."}
        actions={canEdit ? <><Link href={`/panel/nuevo-render?projectId=${id}`} className="button-primary">Generar propuesta</Link><a href="#presentar" className="button-secondary">Compartir <ExternalLinkIcon width={12} height={12} /></a></> : undefined}
      />

      <section className="project-overview">
        <article className="project-progress">
          <div><span>Avance general</span><strong>{progress}%</strong></div>
          <div className="progress-track"><i style={{ width: `${progress}%` }} /></div>
          {canEdit ? <form action={updateProjectProgress.bind(null, id)} className="progress-control"><input aria-label="Avance general" name="progress" type="range" min="0" max="100" step="5" defaultValue={progress} /><button type="submit">Guardar avance</button></form> : null}
          <div className="phase-track">
            {(phases ?? []).map((phase) => <span key={phase.id} className={`phase-${phase.status}`}>{phase.name}<small>{phase.status}</small></span>)}
          </div>
        </article>
        <article className="project-facts">
          <div><span>Cliente</span><strong>{relationOne(project.client)?.name || "Proyecto interno"}</strong></div>
          <div><span>Presupuesto objetivo</span><strong>{money(project.target_budget)}</strong></div>
          <div><span>Entrega</span><strong>{shortDate(project.due_date)}</strong></div>
          <div><span>Superficie</span><strong>{project.area_m2 ? `${project.area_m2} m²` : "Por definir"}</strong></div>
          <div><span>Equipo</span><strong>{(members?.length ?? 0) + 1} personas</strong></div>
        </article>
      </section>

      {canEdit ? (
        <details className="workspace-card project-settings">
          <summary><span>Editar información del proyecto</span><b>Configurar +</b></summary>
          <form action={updateProject.bind(null, id)} className="workspace-form project-settings-form">
            <div className="form-pair">
              <label>Nombre<input name="name" required defaultValue={project.name} /></label>
              <label>Tipo<input name="project_type" defaultValue={project.project_type || ""} placeholder="Residencial, hospitality…" /></label>
            </div>
            <label>Descripción<textarea name="description" rows={3} defaultValue={project.description || ""} /></label>
            <div className="form-triple">
              <label>Ubicación<input name="location" defaultValue={project.location || ""} /></label>
              <label>Superficie m²<input name="area_m2" type="number" min="0" step="0.01" defaultValue={project.area_m2 || ""} /></label>
              <label>Presupuesto objetivo<input name="target_budget" type="number" min="0" step="0.01" defaultValue={project.target_budget || ""} /></label>
            </div>
            <div className="form-triple">
              <label>Entrega<input name="due_date" type="date" defaultValue={project.due_date || ""} /></label>
              <label>Estado<select name="status" defaultValue={project.status}><option value="planning">Planeación</option><option value="active">Activo</option><option value="on_hold">En pausa</option><option value="completed">Completado</option><option value="archived">Archivado</option></select></label>
              <label>Etapa<select name="stage" defaultValue={project.stage}><option value="brief">Brief</option><option value="concept">Concepto</option><option value="design">Diseño</option><option value="development">Desarrollo</option><option value="procurement">Compras</option><option value="construction">Obra</option><option value="delivery">Entrega</option></select></label>
            </div>
            <button className="button-primary" type="submit">Guardar cambios</button>
          </form>
        </details>
      ) : null}

      <section className="project-command-grid">
        <article className="workspace-card project-command-main">
          <div className="workspace-card-head"><div><small>Control de producción</small><h2>Tareas y entregables</h2></div><span>{(tasks ?? []).filter((task) => task.status !== "done").length} abiertas</span></div>
          {canEdit ? <form action={taskAction} className="quick-add">
            <input name="title" required placeholder="Agregar una tarea al proyecto…" />
            <select name="priority" defaultValue="normal"><option value="low">Baja</option><option value="normal">Normal</option><option value="high">Alta</option><option value="urgent">Urgente</option></select>
            <select name="status" defaultValue="todo"><option value="todo">Por hacer</option><option value="in_progress">En proceso</option><option value="review">Revisión</option><option value="done">Ya terminada</option></select>
            <input name="due_at" type="date" />
            <button type="submit">Agregar</button>
          </form> : null}
          <div className="task-board">
            {["todo", "in_progress", "review", "done"].map((status) => (
              <div key={status}>
                <h3>{taskStatus(status)} <span>{(tasks ?? []).filter((task) => task.status === status).length}</span></h3>
                {(tasks ?? []).filter((task) => task.status === status).map((task) => (
                  <article key={task.id}><i className={`priority-${task.priority}`} /><strong>{task.title}</strong><p>{task.description || "Sin notas adicionales"}</p><small>{task.due_at ? shortDate(task.due_at) : "Sin fecha"}</small>
                    {canEdit ? <form action={updateTaskStatus.bind(null, id, task.id)} className="task-status-form">
                      <select name="status" defaultValue={task.status}>{["todo", "in_progress", "review", "done"].map((value) => <option value={value} key={value}>{taskStatus(value)}</option>)}</select>
                      <button type="submit">Actualizar</button>
                    </form> : null}
                  </article>
                ))}
              </div>
            ))}
          </div>
        </article>

        <aside className="project-command-side">
          <article className="workspace-card">
            <div className="workspace-card-head"><div><small>Cliente</small><h2>Aprobaciones</h2></div><span>{(approvals ?? []).filter((item) => item.status === "pending").length}</span></div>
            {canEdit ? <form action={approvalAction} className="workspace-form compact-form">
              <input name="reviewer_name" placeholder="Nombre del cliente" defaultValue={relationOne(project.client)?.name || ""} />
              <input name="reviewer_email" type="email" placeholder="Correo para revisión" defaultValue={relationOne(project.client)?.email || ""} />
              <select name="version_id" defaultValue=""><option value="">Proyecto general</option>{(versions ?? []).map((version) => <option key={version.id} value={version.id}>V{version.version_number} · {version.title}</option>)}</select>
              <textarea name="message" rows={2} placeholder="Mensaje de presentación…" />
              <button className="button-primary" type="submit">Solicitar aprobación</button>
            </form> : null}
            <div className="approval-list">{(approvals ?? []).slice(0, 4).map((item) => <p key={item.id}><span className={`approval-${item.status}`} />{item.reviewer_name || "Cliente"}<small>{approvalStatus(item.status)}</small></p>)}</div>
          </article>
          <article className="workspace-card">
            <div className="workspace-card-head"><div><small>Conversación</small><h2>Bitácora</h2></div></div>
            <form action={commentAction} className="workspace-form compact-form">
              <textarea name="body" required rows={3} placeholder="Registrar una decisión o comentario…" />
              <div className="form-pair">{canEdit ? <select name="visibility" defaultValue="team"><option value="team">Solo equipo</option><option value="client">Visible al cliente</option></select> : <input type="hidden" name="visibility" value="client" />}<button className="button-secondary" type="submit">Publicar</button></div>
            </form>
            <div className="comment-list">{(comments ?? []).slice(0, 5).map((comment) => <article key={comment.id}><strong>{comment.author_name || "Muromío"}</strong><small>{comment.visibility === "client" ? "Cliente" : "Interno"} · {shortDate(comment.created_at)}</small><p>{comment.body}</p></article>)}</div>
          </article>
          {canEdit ? <article className="workspace-card">
            <div className="workspace-card-head"><div><small>Colaboración</small><h2>Equipo del proyecto</h2></div><span>{(members?.length ?? 0) + 1}</span></div>
            <form action={memberAction} className="workspace-form compact-form">
              <input name="email" type="email" required placeholder="Correo de una cuenta aprobada" />
              <div className="form-pair"><select name="role" defaultValue="architect"><option value="director">Dirección</option><option value="architect">Arquitectura</option><option value="designer">Diseño</option><option value="viewer">Consulta</option><option value="client">Cliente</option></select><button className="button-secondary" type="submit">Agregar</button></div>
            </form>
            <div className="comment-list"><article><strong>{profile.full_name || profile.email}</strong><small>Responsable del proyecto</small></article>{(members ?? []).map((member) => <article key={member.user_id}><div><strong>{relationOne(member.profile)?.full_name || relationOne(member.profile)?.email || "Colaborador"}</strong><small>{memberRole(member.role)}</small></div><form action={removeProjectMember.bind(null, id, member.user_id)}><button type="submit" className="member-remove">Quitar</button></form></article>)}</div>
          </article>
          : null}
        </aside>
      </section>

      <section className="workspace-grid workspace-grid-thirds project-lower-grid">
        <article className="workspace-card">
          <div className="workspace-card-head"><div><small>Historial creativo</small><h2>Versiones</h2></div><span>{(versions ?? []).length}</span></div>
          {(versions ?? []).slice(0, 4).map((version) => <div className="version-row" key={version.id}><b>V{version.version_number}</b><div><strong>{version.title}</strong><small>{version.status} · {shortDate(version.created_at)}</small></div></div>)}
          {!(versions ?? []).length ? <p className="muted">{renders?.length ?? 0} renders existentes. La próxima generación podrá convertirse en versión formal.</p> : null}
          {canEdit ? <Link href={`/panel/nuevo-render?projectId=${id}`} className="text-link">Nueva versión visual <ArrowRightIcon width={11} height={11} /></Link> : null}
        </article>
        <article className="workspace-card">
          <div className="workspace-card-head"><div><small>Finanzas</small><h2>Presupuestos</h2></div><span>{(budgets ?? []).length}</span></div>
          {canEdit ? <form action={budgetAction} className="workspace-form compact-form">
            <input name="title" required placeholder="Honorarios de diseño" />
            <input name="subtotal" required type="number" min="0" placeholder="Subtotal antes de IVA" />
            <input name="valid_until" type="date" />
            <button className="button-primary" type="submit">Preparar presupuesto</button>
          </form> : null}
          {(budgets ?? []).slice(0, 3).map((budget) => <div className="budget-row" key={budget.id}><div><strong>{budget.number}</strong><small>{budget.title}</small></div><span>{money(budget.total)}</span></div>)}
          {canEdit && budgets?.[0] ? (
            <form action={createBudgetItem.bind(null, id, budgets[0].id)} className="workspace-form compact-form">
              <small>Agregar partida a {budgets[0].number}</small>
              <input name="concept" required placeholder="Concepto" />
              <div className="form-pair"><input name="quantity" type="number" min="0.01" step="0.01" defaultValue="1" /><input name="unit_price" type="number" min="0" step="0.01" placeholder="Precio unitario" /></div>
              <button className="button-secondary" type="submit">Agregar partida</button>
            </form>
          ) : null}
          {canEdit ? <form action={paymentAction} className="workspace-form compact-form">
            <small>Programar cobro</small>
            <input name="concept" required placeholder="Anticipo o parcialidad" />
            <div className="form-pair"><input name="amount" required type="number" min="0.01" step="0.01" placeholder="Importe" /><input name="due_on" type="date" /></div>
            <select name="budget_id" defaultValue=""><option value="">Sin presupuesto asociado</option>{(budgets ?? []).map((budget) => <option value={budget.id} key={budget.id}>{budget.number}</option>)}</select>
            <button className="button-secondary" type="submit">Programar</button>
          </form> : null}
        </article>
        <article className="workspace-card">
          <div className="workspace-card-head"><div><small>Centro de archivos</small><h2>Entregables</h2></div><span>{(files ?? []).length}</span></div>
          <div className="file-category-grid">
            {["plan", "render", "budget", "contract", "video", "delivery"].map((category) => <div key={category}><strong>{(files ?? []).filter((file) => file.category === category).length}</strong><span>{fileCategory(category)}</span></div>)}
          </div>
          {canEdit ? <form action={fileAction} className="workspace-form compact-form">
            <input name="file" type="file" required />
            <div className="form-pair"><select name="category" defaultValue="other"><option value="plan">Plano</option><option value="reference">Referencia</option><option value="contract">Contrato</option><option value="budget">Presupuesto</option><option value="delivery">Entrega</option><option value="other">Otro</option></select><label className="checkbox-label"><input name="is_client_visible" type="checkbox" /> Visible al cliente</label></div>
            <button className="button-secondary" type="submit">Subir archivo</button>
          </form> : null}
          {fileLinks.map((file) => file.signedUrl ? <a className="tool-result" href={file.signedUrl} target="_blank" rel="noreferrer" key={file.id}><span>{file.name}</span><small>{fileCategory(file.category)} <ExternalLinkIcon width={10} height={10} /></small></a> : null)}
        </article>
      </section>

      <section className="workspace-card project-render-library">
        <div className="workspace-card-head"><div><small>Producción visual</small><h2>Todos los renders del proyecto</h2></div><span>{visibleRenders.length}</span></div>
        {visibleRenders.length ? <div className="project-render-grid">{visibleRenders.map((render, index) => (
          <Link href={`/panel/render/${render.id}/editar`} className="project-render-card" key={render.id}>
            <Image src={render.signedUrl!} alt={`Render ${index + 1} de ${project.name}`} width={900} height={650} unoptimized />
            <div><strong>Render {String(visibleRenders.length - index).padStart(2, "0")}</strong><small>{shortDate(render.created_at)} · {render.provider || "Muromío AI"}</small><span>Editar render ↗</span></div>
          </Link>
        ))}</div> : <div className="workspace-empty"><span>Los renders que generes para este proyecto aparecerán aquí.</span>{canEdit ? <Link href={`/panel/nuevo-render?projectId=${id}`}>Crear el primero</Link> : null}</div>}
      </section>

      <section className="project-presentation-grid">
        <article className="workspace-card presentation-compare">
          <div className="workspace-card-head"><div><small>Presentación interactiva</small><h2>Antes / después</h2></div></div>
          {visibleRenders[0]?.signedUrl && visibleRenders[1]?.signedUrl ? (
            <BeforeAfter before={visibleRenders[1].signedUrl} after={visibleRenders[0].signedUrl} beforeLabel="Versión anterior" afterLabel="Versión actual" />
          ) : (
            <div className="comparison-empty"><strong>Dos versiones desbloquean el comparador.</strong><p>Genera una variación para presentar la evolución visual con un deslizador.</p><Link href="/panel/nuevo-render">Crear otra versión <ArrowRightIcon width={11} height={11} /></Link></div>
          )}
        </article>
        <article className="workspace-card presentation-tools" id="presentar">
          <div className="workspace-card-head"><div><small>Marca blanca</small><h2>Presentar y entregar</h2></div></div>
          <details open>
            <summary>Enlace privado <span>{shareLinks?.length ?? 0}</span></summary>
            {canEdit ? <form action={shareAction} className="workspace-form compact-form">
              <input name="label" placeholder="Presentación de concepto" />
              <div className="form-pair"><input name="expires_at" type="date" /><select name="version_id" defaultValue=""><option value="">Proyecto completo</option>{(versions ?? []).map((version) => <option key={version.id} value={version.id}>V{version.version_number}</option>)}</select></div>
              <label className="checkbox-label"><input name="allow_download" type="checkbox" /> Permitir descargas</label>
              <button className="button-secondary" type="submit">Crear enlace</button>
            </form> : null}
            {(shareLinks ?? []).slice(0, 2).map((link) => <p className="tool-result" key={link.id}><span>{link.label}</span><Link href={`/presentacion/${link.token}`} target="_blank">Abrir <ExternalLinkIcon width={10} height={10} /></Link></p>)}
          </details>
          <details>
            <summary>Video de presentación <span className="coming-badge">Próximamente</span></summary>
            <p className="muted">Recorridos y reels automáticos llegarán en una próxima versión. No consume créditos ni crea solicitudes por ahora.</p>
            {(videos ?? []).slice(0, 2).map((video) => <p className="tool-result" key={video.id}><span>{video.title}</span><small>Solicitud anterior · {video.status}</small></p>)}
          </details>
          <details>
            <summary>Documento Muromío <span>{documents?.length ?? 0}</span></summary>
            {canEdit ? <form action={documentAction} className="workspace-form compact-form">
              <select name="document_type" defaultValue="proposal"><option value="proposal">Propuesta de diseño</option><option value="brief">Brief</option><option value="minutes">Minuta</option><option value="spec_sheet">Fichas técnicas</option><option value="weekly_report">Reporte semanal</option><option value="approval">Acta de aprobación</option><option value="delivery_manual">Manual de entrega</option></select>
              <input name="title" placeholder="Título personalizado (opcional)" />
              <fieldset className="document-options"><legend>Información que incluirá</legend><label><input type="checkbox" name="sections" value="vision" defaultChecked /> Visión y datos</label><label><input type="checkbox" name="sections" value="process" defaultChecked /> Proceso y avance</label><label><input type="checkbox" name="sections" value="renders" defaultChecked /> Renders seleccionados</label><label><input type="checkbox" name="sections" value="budget" /> Presupuesto</label><label><input type="checkbox" name="sections" value="notes" /> Notas</label></fieldset>
              <textarea name="notes" rows={3} placeholder="Contexto, decisiones o texto especial para este documento…" />
              {visibleRenders.length ? <fieldset className="document-render-picker"><legend>Selecciona los renders</legend>{visibleRenders.map((render, index) => <label key={render.id}><input type="checkbox" name="render_ids" value={render.id} defaultChecked={index < 3} /><Image src={render.signedUrl!} alt="" width={120} height={84} unoptimized /><span>Render {visibleRenders.length - index}</span></label>)}</fieldset> : null}
              <button className="button-secondary" type="submit">Crear documento</button>
            </form> : null}
            {(documents ?? []).slice(0, 3).map((document) => <p className="tool-result" key={document.id}><span>{document.title}</span><Link href={`/panel/proyectos/${id}/documentos/${document.id}`} target="_blank">Abrir <ExternalLinkIcon width={10} height={10} /></Link></p>)}
          </details>
        </article>
      </section>
    </WorkspaceShell>
  );
}

function taskStatus(status: string) {
  return ({ todo: "Por hacer", in_progress: "En proceso", review: "Revisión", done: "Listo" } as Record<string, string>)[status] || status;
}
function approvalStatus(status: string) {
  return ({ pending: "Pendiente", approved: "Aprobado", changes_requested: "Pide cambios", rejected: "Rechazado" } as Record<string, string>)[status] || status;
}
function fileCategory(category: string) {
  return ({ plan: "Planos", render: "Renders", budget: "Presupuestos", contract: "Contratos", video: "Videos", delivery: "Entrega" } as Record<string, string>)[category] || category;
}
function memberRole(role: string) {
  return ({ director: "Dirección", architect: "Arquitectura", designer: "Diseño", viewer: "Consulta", client: "Cliente" } as Record<string, string>)[role] || role;
}
