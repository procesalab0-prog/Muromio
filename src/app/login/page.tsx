import Link from "next/link";
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
    <main
      style={{
        minHeight: "100svh",
        display: "grid",
        placeItems: "center",
        padding: 24,
        background: "var(--sand)",
      }}
    >
      <Link
        href="/"
        aria-label="Volver a Muromío"
        style={{
          position: "absolute",
          top: 24,
          left: "clamp(20px,5vw,64px)",
          color: "var(--ink)",
          textDecoration: "none",
          fontFamily: "var(--font-lora)",
          fontSize: 24,
        }}
      >
        muromío
      </Link>
      <LoginForm initialMode={mode === "register" ? "register" : "login"} />
    </main>
  );
}
