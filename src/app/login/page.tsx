import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "./login-form";
import { createClient } from "@/lib/supabase/server";

export default async function LoginPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/panel");
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
      <LoginForm />
    </main>
  );
}
