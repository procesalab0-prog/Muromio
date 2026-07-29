import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function AccessRequestsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: admin } = await supabase
    .from("profiles")
    .select("role,access_status")
    .eq("id", user.id)
    .single();
  if (admin?.role !== "admin" || admin.access_status !== "approved") redirect("/panel");

  const { data: requests } = await supabase
    .from("profiles")
    .select("id,full_name,email,phone,access_status,requested_at,credit_balance,unlimited_credits,credits_spent,estimated_usd")
    .neq("role", "admin")
    .order("requested_at", { ascending: false });

  async function reviewAccess(formData: FormData) {
    "use server";
    const profileId = String(formData.get("profileId") ?? "");
    const status = String(formData.get("status") ?? "");
    if (!profileId || !["approved", "rejected", "unlimited", "limited"].includes(status)) return;

    const actionClient = await createClient();
    const { data: { user: reviewer } } = await actionClient.auth.getUser();
    if (!reviewer) return;
    const { data: reviewerProfile } = await actionClient
      .from("profiles")
      .select("role,access_status")
      .eq("id", reviewer.id)
      .single();
    if (reviewerProfile?.role !== "admin" || reviewerProfile.access_status !== "approved") return;

    const update = status === "unlimited" || status === "limited"
      ? { unlimited_credits: status === "unlimited" }
      : {
          access_status: status,
          reviewed_at: new Date().toISOString(),
          reviewed_by: reviewer.id,
        };

    await actionClient
      .from("profiles")
      .update(update)
      .eq("id", profileId)
      .neq("role", "admin");
    revalidatePath("/panel/solicitudes");
  }

  return (
    <main style={{ minHeight: "100svh", padding: "clamp(28px,5vw,72px)", background: "var(--sand)" }}>
      <Link href="/panel" style={{ color: "var(--rust)", textDecoration: "none", fontSize: 13 }}>← Volver al panel</Link>
      <h1 style={{ margin: "24px 0 10px", fontFamily: "var(--font-lora)", fontSize: "clamp(38px,6vw,62px)", fontWeight: 500 }}>
        Solicitudes de acceso
      </h1>
      <p style={{ color: "#655d58", marginBottom: 36 }}>Aprueba quién puede entrar a la prueba de Muromío.</p>
      <div style={{ display: "grid", gap: 12, maxWidth: 900 }}>
        {requests?.length ? requests.map((request) => (
          <article className="access-request-card" key={request.id} style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) auto", gap: 20, alignItems: "center", padding: 22, background: "var(--cream)", border: "1px solid rgba(38,34,32,.1)" }}>
            <div>
              <h2 style={{ margin: "0 0 6px", fontFamily: "var(--font-lora)", fontWeight: 500 }}>{request.full_name || "Sin nombre"}</h2>
              <p style={{ margin: 0, color: "#655d58" }}>{request.email}</p>
              <p style={{ margin: "4px 0 0", color: "#655d58" }}>{request.phone || "Sin teléfono"}</p>
              <small style={{ color: request.access_status === "approved" ? "#47704b" : request.access_status === "rejected" ? "var(--rust)" : "#817770" }}>
                {request.access_status === "approved" ? "Aprobado" : request.access_status === "rejected" ? "Rechazado" : "Pendiente"}
              </small>
              <p style={{ margin: "10px 0 0", fontSize: 13, color: "#655d58" }}>
                {request.unlimited_credits ? "Sin límite" : `${request.credit_balance ?? 0} créditos restantes`}
                {" · "}{request.credits_spent ?? 0} usados
                {" · "}${Number(request.estimated_usd ?? 0).toFixed(2)} USD cobrados
              </p>
            </div>
            <div className="access-request-actions" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <form action={reviewAccess}>
                <input type="hidden" name="profileId" value={request.id} />
                <input type="hidden" name="status" value="approved" />
                <button type="submit" style={approveStyle}>Aprobar</button>
              </form>
              <form action={reviewAccess}>
                <input type="hidden" name="profileId" value={request.id} />
                <input type="hidden" name="status" value={request.unlimited_credits ? "limited" : "unlimited"} />
                <button type="submit" style={request.unlimited_credits ? rejectStyle : approveStyle}>
                  {request.unlimited_credits ? "Quitar acceso ilimitado" : "Dar acceso ilimitado"}
                </button>
              </form>
              <form action={reviewAccess}>
                <input type="hidden" name="profileId" value={request.id} />
                <input type="hidden" name="status" value="rejected" />
                <button type="submit" style={rejectStyle}>Rechazar</button>
              </form>
            </div>
          </article>
        )) : <p>No hay solicitudes todavía.</p>}
      </div>
    </main>
  );
}

const approveStyle = { padding: "10px 14px", border: 0, background: "var(--rust)", color: "var(--cream)", cursor: "pointer", font: "inherit" } as const;
const rejectStyle = { padding: "9px 13px", border: "1px solid rgba(38,34,32,.25)", background: "transparent", color: "var(--ink)", cursor: "pointer", font: "inherit" } as const;
