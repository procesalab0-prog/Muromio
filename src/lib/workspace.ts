import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function requireWorkspace() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id,full_name,email,role,access_status,credit_balance,unlimited_credits,credits_spent,estimated_usd,job_title")
    .eq("id", user.id)
    .single();

  if (profile?.access_status !== "approved") redirect("/solicitud-pendiente");

  return { supabase, user, profile };
}

export function money(value: number | string | null | undefined, currency = "MXN") {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(Number(value ?? 0));
}

export function shortDate(value: string | null | undefined) {
  if (!value) return "Sin fecha";
  return new Intl.DateTimeFormat("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function relationOne<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}
