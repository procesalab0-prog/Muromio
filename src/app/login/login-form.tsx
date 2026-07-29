"use client";

import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";

export function LoginForm({ initialMode = "login" }: { initialMode?: "login" | "register" }) {
  const [mode, setMode] = useState<"login" | "register">(initialMode);
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage("");
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const supabase = createClient();

    if (mode === "register") {
      const fullName = String(formData.get("fullName") ?? "").trim();
      const phone = String(formData.get("phone") ?? "").trim();
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName, phone },
          emailRedirectTo: `${window.location.origin}/solicitud-pendiente`,
        },
      });
      if (error) {
        setMessage(error.message.includes("already")
          ? "Este correo ya está registrado."
          : "No pudimos crear la solicitud. Revisa los datos.");
        setPending(false);
        return;
      }
      if (!data.session) {
        setMessage("Revisa tu correo para confirmar la cuenta. Después podrás consultar el estado de tu solicitud.");
        setPending(false);
        return;
      }
      window.location.assign("/solicitud-pendiente");
      return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) {
      setMessage("No pudimos iniciar sesión. Revisa tu correo y contraseña.");
      setPending(false);
      return;
    }
    const { data: profile } = await supabase
      .from("profiles")
      .select("access_status")
      .eq("id", data.user.id)
      .single();
    window.location.assign(profile?.access_status === "approved" ? "/panel" : "/solicitud-pendiente");
  }

  return (
    <form onSubmit={handleSubmit} style={formStyle}>
      <p style={{ margin: "0 0 12px", color: "var(--rust)", fontSize: 11, letterSpacing: ".2em", textTransform: "uppercase" }}>
        {mode === "login" ? "Espacio de trabajo" : "Solicitud de acceso"}
      </p>
      <h1 style={{ margin: "0 0 10px", fontFamily: "var(--font-lora)", fontSize: "clamp(34px,5vw,48px)", fontWeight: 500, lineHeight: 1.05 }}>
        {mode === "login" ? "Bienvenido a Muromío" : "Crear una cuenta"}
      </h1>
      <p style={{ margin: "0 0 28px", color: "#655d58", lineHeight: 1.6 }}>
        {mode === "login"
          ? "Accede a tus proyectos, referencias y renders."
          : "Déjanos tus datos. Revisaremos tu solicitud antes de habilitar la prueba."}
      </p>

      {mode === "register" ? <>
        <label style={labelStyle}>Nombre completo
          <input name="fullName" autoComplete="name" required maxLength={120} style={fieldStyle} />
        </label>
        <label style={labelStyle}>Número de teléfono
          <input name="phone" type="tel" autoComplete="tel" required maxLength={30} style={fieldStyle} placeholder="+52 477 000 0000" />
        </label>
      </> : null}
      <label style={labelStyle}>Correo electrónico
        <input name="email" type="email" autoComplete="email" required style={fieldStyle} />
      </label>
      <label style={labelStyle}>Contraseña
        <input name="password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} required minLength={8} style={fieldStyle} />
      </label>
      <button type="submit" disabled={pending} style={{ ...primaryButtonStyle, opacity: pending ? .7 : 1 }}>
        {pending ? "Procesando…" : mode === "login" ? "Iniciar sesión" : "Enviar solicitud"}
      </button>
      <button
        type="button"
        onClick={() => { setMode(mode === "login" ? "register" : "login"); setMessage(""); }}
        style={switchButtonStyle}
      >
        {mode === "login" ? "¿No tienes cuenta? Solicitar acceso" : "Ya tengo cuenta"}
      </button>
      {message ? <p role="alert" style={{ margin: "18px 0 0", color: "var(--rust-dark)", fontSize: 13, lineHeight: 1.5 }}>{message}</p> : null}
    </form>
  );
}

const formStyle = { width: "100%", maxWidth: 470, padding: "clamp(28px,5vw,52px)", background: "var(--cream)", border: "1px solid rgba(38,34,32,.12)" } as const;
const labelStyle = { display: "grid", gap: 8, marginBottom: 16, fontSize: 13 } as const;
const fieldStyle = { minHeight: 48, padding: "0 14px", border: "1px solid rgba(38,34,32,.25)", background: "#fffdf8", color: "var(--ink)", font: "inherit" } as const;
const primaryButtonStyle = { width: "100%", minHeight: 50, border: 0, background: "var(--rust)", color: "var(--cream)", cursor: "pointer", font: "inherit", fontSize: 12, letterSpacing: ".16em", textTransform: "uppercase" } as const;
const switchButtonStyle = { width: "100%", marginTop: 12, padding: 10, border: 0, background: "transparent", color: "var(--rust)", cursor: "pointer", font: "inherit", fontSize: 13 } as const;
