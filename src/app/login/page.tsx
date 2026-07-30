import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { LoginForm } from "./login-form";
import { createClient } from "@/lib/supabase/server";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  const { mode } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("access_status")
      .eq("id", user.id)
      .single();
    redirect(profile?.access_status === "approved" ? "/panel" : "/solicitud-pendiente");
  }

  return (
    <main className="os-login">
      <section className="os-login-visual">
        <Image src="/images/IMG_5479.jpg" alt="" fill priority sizes="58vw" />
        <div className="os-login-shade" />
        <Link href="/" aria-label="Volver a Muromío" className="os-login-brand">
          Muromío <small>OS</small>
        </Link>
        <div className="os-login-statement">
          <span>Studio OS</span>
          <h2>El despacho,<br />en un solo lugar.</h2>
          <p>Proyectos · clientes · renders · negocio</p>
        </div>
      </section>
      <section className="os-login-panel">
        <Link href="/" aria-label="Volver a Muromío" className="os-login-mobile-brand">
          Muromío <small>OS</small>
        </Link>
        <LoginForm initialMode={mode === "register" ? "register" : "login"} />
        <p className="os-login-footer">Muromío · León, Gto. — acceso privado</p>
      </section>
    </main>
  );
}
