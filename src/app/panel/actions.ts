"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireWorkspace } from "@/lib/workspace";

function text(formData: FormData, key: string, max = 500) {
  return String(formData.get(key) ?? "").trim().slice(0, max);
}

function optionalText(formData: FormData, key: string, max = 500) {
  return text(formData, key, max) || null;
}

function numberValue(formData: FormData, key: string) {
  const value = Number(formData.get(key));
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

export async function createClient(formData: FormData) {
  const { supabase, user } = await requireWorkspace();
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
  const { supabase, user } = await requireWorkspace();
  const name = text(formData, "name", 120);
  if (!name) throw new Error("El nombre del proyecto es obligatorio.");

  const { data, error } = await supabase
    .from("projects")
    .insert({
      owner_id: user.id,
      client_id: optionalText(formData, "client_id", 80),
      name,
      description: optionalText(formData, "description", 1500),
      project_type: optionalText(formData, "project_type", 100),
      location: optionalText(formData, "location", 180),
      area_m2: numberValue(formData, "area_m2"),
      target_budget: numberValue(formData, "target_budget"),
      due_date: optionalText(formData, "due_date", 20),
      status: "planning",
      stage: "brief",
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  await supabase.from("project_phases").insert(
    ["Brief", "Concepto", "Diseño", "Desarrollo", "Compras", "Obra", "Entrega"].map((phase, index) => ({
      project_id: data.id,
      name: phase,
      status: index === 0 ? "active" : "pending",
      sort_order: index,
    })),
  );
  await recordActivity(data.id, "project.created", "project", data.id, `Se creó el proyecto ${name}.`);
  redirect(`/panel/proyectos/${data.id}`);
}

export async function createStyle(formData: FormData) {
  const { supabase, user } = await requireWorkspace();
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
  const { data, error } = await supabase
    .from("tasks")
    .insert({
      project_id: projectId,
      title,
      description: optionalText(formData, "description", 1000),
      priority: text(formData, "priority", 20) || "normal",
      due_at: optionalText(formData, "due_at", 40),
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
  const { supabase, user } = await requireWorkspace();
  const title = text(formData, "title", 160) || "Presentación Muromío";
  const { data, error } = await supabase
    .from("project_videos")
    .insert({
      project_id: projectId,
      title,
      format: text(formData, "format", 30) || "landscape",
      status: "queued",
      created_by: user.id,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  await recordActivity(projectId, "video.queued", "video", data.id, `Se preparó la solicitud de video ${title}.`);
  revalidatePath(`/panel/proyectos/${projectId}`);
}

export async function createProjectDocument(projectId: string, formData: FormData) {
  const { supabase, user } = await requireWorkspace();
  const documentType = text(formData, "document_type", 40) || "proposal";
  const title = text(formData, "title", 180) || documentLabel(documentType);
  const { data, error } = await supabase
    .from("generated_documents")
    .insert({
      project_id: projectId,
      document_type: documentType,
      title,
      created_by: user.id,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  await recordActivity(projectId, "document.created", "document", data.id, `Se inició el documento ${title}.`);
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
