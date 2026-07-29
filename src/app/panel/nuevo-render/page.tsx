import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { RenderForm } from "./render-form";

export default async function NewRenderPage({
  searchParams,
}: {
  searchParams: Promise<{ sourceRenderId?: string }>;
}) {
  const { sourceRenderId } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main style={{ minHeight: "100svh", padding: "clamp(28px,5vw,72px)", background: "var(--sand)" }}>
      <Link href="/panel" style={{ color: "var(--rust)", textDecoration: "none", fontSize: 13 }}>
        ← Volver a proyectos
      </Link>
      <h1 style={{ margin: "24px 0 12px", fontFamily: "var(--font-lora)", fontSize: "clamp(38px,6vw,64px)", fontWeight: 500 }}>
        {sourceRenderId ? "Nueva variación" : "Nuevo render"}
      </h1>
      <p style={{ maxWidth: 640, margin: "0 0 42px", color: "#655d58", lineHeight: 1.7 }}>
        {sourceRenderId
          ? "Usaremos el render anterior como base para explorar otra dirección material sin perder su composición."
          : "Sube un plano, boceto o imagen base. Muromío conservará su estructura y aplicará la dirección material que elijas."}
      </p>
      <RenderForm sourceRenderId={sourceRenderId} />
    </main>
  );
}
