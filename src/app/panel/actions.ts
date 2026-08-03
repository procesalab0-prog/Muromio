"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireTeamWorkspace, requireWorkspace } from "@/lib/workspace";

function text(formData: FormData, key: string, max = 500) {
  return String(formData.get(key) ?? "").trim().slice(0, max);
}

function optionalText(formData: FormData, key: string, max = 500) {
  return text(formData, key, max) || null;
}

function numberValue(formData: FormData, key: string) {
  const raw = String(formData.get(key) ?? "").trim();
  if (!raw) return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

async function recordActivity(
  projectId: string | null,
  eventType: string,
  entityType: string,
  entityId: string,
  summary: string,
) {
  const { supabase, user } = await requireWorkspace();
  await supabase.from("activity_events").insert({
    project_id: projectId,
    actor_id: user.id,
    event_type: eventType,
    entity_type: entityType,
    entity_id: entityId,
    summary,
  });
}

async function requireProjectEditor(projectId: string) {
  const workspace = await requireWorkspace();
  const { data: allowed, error } = await workspace.supabase.rpc("can_edit_project", {
    target_project_id: projectId,
  });
  if (error || !allowed) throw new Error("No tienes permiso para editar este proyecto.");
  return workspace;
}

export async function updateProject(projectId: string, formData: FormData) {
  const { supabase } = await requireProjectEditor(projectId);
  const name = text(formData, "name", 120);
  if (!name) throw new Error("El nombre del proyecto es obligatorio.");
  const { error } = await supabase.from("projects").update({
    name,
    description: optionalText(formData, "description", 1500),
    project_type: optionalText(formData, "project_type", 100),
    location: optionalText(formData, "location", 180),
    area_m2: numberValue(formData, "area_m2"),
    target_budget: numberValue(formData, "target_budget"),
    due_date: optionalText(formData, "due_date", 20),
    status: text(formData, "status", 30) || "planning",
    stage: text(formData, "stage", 30) || "brief",
    updated_at: new Date().toISOString(),
  }).eq("id", projectId);
  if (error) throw new Error(error.message);
  await recordActivity(projectId, "project.updated", "project", projectId, `Se actualizó el proyecto ${name}.`);
  revalidatePath("/panel");
  revalidatePath("/panel/proyectos");
  revalidatePath(`/panel/proyectos/${projectId}`);
}

export async function createClient(formData: FormData) {
  const { supabase, user } = await requireTeamWorkspace();
  const name = text(formData, "name", 140);
  if (!name) throw new Error("El nombre del cliente es obligatorio.");

  const { data, error } = await supabase
    .from("clients")
    .insert({
      owner_id: user.id,
      name,
      email: optionalText(formData, "email", 180),
      phone: optionalText(formData, "phone", 40),
      company: optionalText(formData, "company", 140),
      notes: optionalText(formData, "notes", 1200),
      status: text(formData, "status", 30) || "active",
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  await recordActivity(null, "client.created", "client", data.id, `Se agregó a ${name} como cliente.`);
  revalidatePath("/panel");
  revalidatePath("/panel/clientes");
}

export async function createProject(formData: FormData) {
  const { supabase } = await requireTeamWorkspace();
  const name = text(formData, "name", 120);
  if (!name) throw new Error("El nombre del proyecto es obligatorio.");

  const clientId = optionalText(formData, "client_id", 80);
  const { data, error } = await supabase.rpc("create_workspace_project", {
    p_name: name,
    p_client_id: clientId,
    p_description: optionalText(formData, "description", 1500),
    p_project_type: optionalText(formData, "project_type", 100),
    p_location: optionalText(formData, "location", 180),
    p_area_m2: numberValue(formData, "area_m2"),
    p_target_budget: numberValue(formData, "target_budget"),
    p_due_date: optionalText(formData, "due_date", 20),
  });

  if (error || !data) {
    redirect(`/panel/proyectos?nuevo=1&error=${encodeURIComponent("No pudimos crear el proyecto. Intenta nuevamente.")}`);
  }
  redirect(`/panel/proyectos/${data}`);
}

export async function createStyle(formData: FormData) {
  const { supabase, user } = await requireTeamWorkspace();
  const name = text(formData, "name", 120);
  if (!name) throw new Error("El nombre del estilo es obligatorio.");
  const slug = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  const materials = text(formData, "materials", 1000)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const palette = text(formData, "palette", 500)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  const { data, error } = await supabase
    .from("style_library")
    .insert({
      owner_id: user.id,
      name,
      slug: `${slug}-${Date.now().toString().slice(-5)}`,
      description: optionalText(formData, "description", 1200),
      materials,
      palette,
      prompt_template: optionalText(formData, "prompt_template", 3000),
      is_signature: formData.get("is_signature") === "on",
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  await recordActivity(null, "style.created", "style", data.id, `Se creó el lenguaje visual ${name}.`);
  revalidatePath("/panel/estilos");
}

export async function createTask(projectId: string, formData: FormData) {
  const { supabase, user } = await requireWorkspace();
  const title = text(formData, "title", 220);
  if (!title) return;
  const status = text(formData, "status", 30) || "todo";
  const safeStatus = ["todo", "in_progress", "review", "done"].includes(status) ? status : "todo";
  const { data, error } = await supabase
    .from("tasks")
    .insert({
      project_id: projectId,
      title,
      description: optionalText(formData, "description", 1000),
      priority: text(formData, "priority", 20) || "normal",
      due_at: optionalText(formData, "due_at", 40),
      status: safeStatus,
      completed_at: safeStatus === "done" ? new Date().toISOString() : null,
      created_by: user.id,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  await recordActivity(projectId, "task.created", "task", data.id, `Nueva tarea: ${title}.`);
  revalidatePath(`/panel/proyectos/${projectId}`);
}

export async function createBudget(projectId: string, formData: FormData) {
  const { supabase, user } = await requireWorkspace();
  const title = text(formData, "title", 180);
  if (!title) return;
  const subtotal = numberValue(formData, "subtotal") ?? 0;
  const tax = Math.round(subtotal * 0.16 * 100) / 100;
  const { data, error } = await supabase
    .from("budgets")
    .insert({
      project_id: projectId,
      number: `MUR-${new Date().getFullYear()}-${Date.now().toString().slice(-5)}`,
      title,
      subtotal,
      tax,
      total: subtotal + tax,
      valid_until: optionalText(formData, "valid_until", 20),
      notes: optionalText(formData, "notes", 1200),
      created_by: user.id,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  await recordActivity(projectId, "budget.created", "budget", data.id, `Se preparó el presupuesto ${title}.`);
  revalidatePath("/panel/finanzas");
  revalidatePath(`/panel/proyectos/${projectId}`);
}

export async function createComment(projectId: string, formData: FormData) {
  const { supabase, user, profile } = await requireWorkspace();
  const body = text(formData, "body", 2000);
  if (!body) return;
  const { data, error } = await supabase
    .from("project_comments")
    .insert({
      project_id: projectId,
      author_id: user.id,
      author_name: profile.full_name || profile.email || "Equipo Muromío",
      body,
      visibility: text(formData, "visibility", 20) || "team",
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  await recordActivity(projectId, "comment.created", "comment", data.id, "Se agregó un comentario al proyecto.");
  revalidatePath(`/panel/proyectos/${projectId}`);
}

export async function requestApproval(projectId: string, formData: FormData) {
  const { supabase, user } = await requireWorkspace();
  const { data, error } = await supabase
    .from("approvals")
    .insert({
      project_id: projectId,
      version_id: optionalText(formData, "version_id", 80),
      requested_by: user.id,
      reviewer_name: optionalText(formData, "reviewer_name", 140),
      reviewer_email: optionalText(formData, "reviewer_email", 180),
      message: optionalText(formData, "message", 1200),
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  await recordActivity(projectId, "approval.requested", "approval", data.id, "Se solicitó una aprobación al cliente.");
  revalidatePath(`/panel/proyectos/${projectId}`);
}

export async function createShareLink(projectId: string, formData: FormData) {
  const { supabase, user } = await requireWorkspace();
  const { data, error } = await supabase
    .from("share_links")
    .insert({
      project_id: projectId,
      version_id: optionalText(formData, "version_id", 80),
      label: optionalText(formData, "label", 140) || "Presentación para cliente",
      allow_download: formData.get("allow_download") === "on",
      expires_at: optionalText(formData, "expires_at", 40),
      created_by: user.id,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  await recordActivity(projectId, "share.created", "share_link", data.id, "Se creó un enlace privado para presentar el proyecto.");
  revalidatePath(`/panel/proyectos/${projectId}`);
}

export async function queueProjectVideo(projectId: string, formData: FormData) {
  void projectId;
  void formData;
  throw new Error("La generación de video estará disponible próximamente.");
}

export async function createProjectDocument(projectId: string, formData: FormData) {
  const { supabase, user } = await requireProjectEditor(projectId);
  const documentType = text(formData, "document_type", 40) || "proposal";
  const title = text(formData, "title", 180) || documentLabel(documentType);
  const requestedRenderIds = formData.getAll("render_ids").map(String).filter(Boolean).slice(0, 20);
  const requestedSections = formData.getAll("sections").map(String);
  const allowedSections = ["vision", "process", "renders", "budget", "notes"];
  const includedSections = requestedSections.filter((section) => allowedSections.includes(section));
  const { data: allowedRenders } = requestedRenderIds.length
    ? await supabase.from("renders").select("id").eq("project_id", projectId).eq("status", "completed").in("id", requestedRenderIds)
    : { data: [] };
  const { data, error } = await supabase
    .from("generated_documents")
    .insert({
      project_id: projectId,
      document_type: documentType,
      title,
      status: "ready",
      included_sections: includedSections.length ? includedSections : defaultDocumentSections(documentType),
      render_ids: (allowedRenders ?? []).map((render) => render.id),
      notes: optionalText(formData, "notes", 2500),
      created_by: user.id,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  await recordActivity(projectId, "document.created", "document", data.id, `Se inició el documento ${title}.`);
  revalidatePath(`/panel/proyectos/${projectId}`);
}

export async function updateProjectProgress(projectId: string, formData: FormData) {
  const { supabase } = await requireProjectEditor(projectId);
  const progress = Math.max(0, Math.min(100, Math.round(numberValue(formData, "progress") ?? 0)));
  const { error } = await supabase.from("projects").update({
    progress_percent: progress,
    updated_at: new Date().toISOString(),
  }).eq("id", projectId);
  if (error) throw new Error(error.message);
  await recordActivity(projectId, "project.progress", "project", projectId, `El avance general cambió a ${progress}%.`);
  revalidatePath("/panel");
  revalidatePath(`/panel/proyectos/${projectId}`);
}

export async function updateTaskStatus(projectId: string, taskId: string, formData: FormData) {
  const { supabase } = await requireWorkspace();
  const status = text(formData, "status", 30);
  if (!["todo", "in_progress", "review", "done"].includes(status)) return;
  const { error } = await supabase.from("tasks").update({
    status,
    completed_at: status === "done" ? new Date().toISOString() : null,
  }).eq("id", taskId).eq("project_id", projectId);
  if (error) throw new Error(error.message);
  revalidatePath(`/panel/proyectos/${projectId}`);
}

export async function uploadProjectFile(projectId: string, formData: FormData) {
  const { supabase, user } = await requireWorkspace();
  const file = formData.get("file");
  if (!(file instanceof File) || !file.size) throw new Error("Selecciona un archivo.");
  if (file.size > 50 * 1024 * 1024) throw new Error("El archivo no puede superar 50 MB.");
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, "-").slice(-140);
  const storagePath = `${user.id}/${projectId}/${crypto.randomUUID()}-${safeName}`;
  const { error: uploadError } = await supabase.storage
    .from("project-assets")
    .upload(storagePath, file, { contentType: file.type || "application/octet-stream" });
  if (uploadError) throw new Error(uploadError.message);

  const { data, error } = await supabase.from("project_files").insert({
    project_id: projectId,
    uploaded_by: user.id,
    name: file.name.slice(0, 220),
    storage_path: storagePath,
    mime_type: file.type || null,
    size_bytes: file.size,
    category: text(formData, "category", 30) || "other",
    is_client_visible: formData.get("is_client_visible") === "on",
  }).select("id").single();
  if (error) {
    await supabase.storage.from("project-assets").remove([storagePath]);
    throw new Error(error.message);
  }
  await recordActivity(projectId, "file.uploaded", "project_file", data.id, `Se agregó el archivo ${file.name}.`);
  revalidatePath(`/panel/proyectos/${projectId}`);
}

export async function createBudgetItem(projectId: string, budgetId: string, formData: FormData) {
  const { supabase } = await requireWorkspace();
  const concept = text(formData, "concept", 180);
  if (!concept) return;
  const { error } = await supabase.from("budget_items").insert({
    budget_id: budgetId,
    concept,
    description: optionalText(formData, "description", 600),
    quantity: numberValue(formData, "quantity") ?? 1,
    unit: text(formData, "unit", 40) || "servicio",
    unit_price: numberValue(formData, "unit_price") ?? 0,
  });
  if (error) throw new Error(error.message);
  const { error: totalError } = await supabase.rpc("recalculate_budget", { target_budget_id: budgetId });
  if (totalError) throw new Error(totalError.message);
  revalidatePath("/panel/finanzas");
  revalidatePath(`/panel/proyectos/${projectId}`);
}

export async function createPayment(projectId: string, formData: FormData) {
  const { supabase } = await requireWorkspace();
  const concept = text(formData, "concept", 180);
  const amount = numberValue(formData, "amount");
  if (!concept || amount === null || amount <= 0) return;
  const { error } = await supabase.from("payments").insert({
    project_id: projectId,
    budget_id: optionalText(formData, "budget_id", 80),
    concept,
    amount,
    due_on: optionalText(formData, "due_on", 20),
  });
  if (error) throw new Error(error.message);
  revalidatePath("/panel/finanzas");
  revalidatePath(`/panel/proyectos/${projectId}`);
}

export async function updatePaymentStatus(paymentId: string, formData: FormData) {
  const { supabase } = await requireWorkspace();
  const status = text(formData, "status", 20);
  if (!["pending", "paid", "overdue", "cancelled"].includes(status)) return;
  const { error } = await supabase.from("payments").update({
    status,
    paid_at: status === "paid" ? new Date().toISOString() : null,
  }).eq("id", paymentId);
  if (error) throw new Error(error.message);
  revalidatePath("/panel/finanzas");
}

export async function addProjectMember(projectId: string, formData: FormData) {
  const { supabase } = await requireProjectEditor(projectId);
  const email = text(formData, "email", 180);
  const role = text(formData, "role", 30) || "architect";
  if (!email) return;
  const { error } = await supabase.rpc("add_project_member_by_email", {
    p_project_id: projectId,
    p_email: email,
    p_role: role,
  });
  if (error) throw new Error(error.message.includes("approved_user_not_found")
    ? "No encontramos una cuenta aprobada con ese correo."
    : error.message);
  revalidatePath(`/panel/proyectos/${projectId}`);
}

export async function removeProjectMember(projectId: string, userId: string) {
  const { supabase } = await requireProjectEditor(projectId);
  const { error } = await supabase
    .from("project_members")
    .delete()
    .eq("project_id", projectId)
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
  await recordActivity(projectId, "member.removed", "profile", userId, "Se retiró un acceso del proyecto.");
  revalidatePath(`/panel/proyectos/${projectId}`);
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

function defaultDocumentSections(type: string) {
  if (type === "budget") return ["vision", "budget"];
  if (type === "brief") return ["vision", "process", "notes"];
  if (type === "minutes" || type === "weekly_report") return ["process", "renders", "notes"];
  if (type === "spec_sheet") return ["renders", "notes"];
  return ["vision", "process", "renders", "budget", "notes"];
}
