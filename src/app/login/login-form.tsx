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
        setMessage("Tu cuenta fue creada. Inicia sesión para consultar el estado de tu solicitud.");
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
    <form onSubmit={handleSubmit} className="os-login-form">
      <p className="os-login-eyebrow">
        {mode === "login" ? "Bienvenida de vuelta" : "Acceso a Muromío OS"}
      </p>
      <h1>
        {mode === "login" ? "Iniciar sesión" : "Solicitar acceso"}
      </h1>
      <p className="os-login-intro">
        {mode === "login"
          ? "Accede al sistema del despacho."
          : "Crea tu cuenta. Dirección revisará tu solicitud."}
      </p>

      {mode === "register" ? <>
        <label>Nombre completo
          <input name="fullName" autoComplete="name" required maxLength={120} />
        </label>
        <label>Teléfono
          <input name="phone" type="tel" autoComplete="tel" required maxLength={30} placeholder="+52 477 000 0000" />
        </label>
      </> : null}
      <label>Correo
        <input name="email" type="email" autoComplete="email" required placeholder="nombre@correo.com" />
      </label>
      <label>Contraseña
        <input name="password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} required minLength={8} placeholder="••••••••" />
      </label>
      <button type="submit" disabled={pending} className="os-login-primary">
        {pending ? "Procesando…" : mode === "login" ? "Entrar a Muromío OS" : "Enviar solicitud"}
      </button>
      <div className="os-login-divider"><span>o</span></div>
      <button
        type="button"
        onClick={() => { setMode(mode === "login" ? "register" : "login"); setMessage(""); }}
        className="os-login-switch"
      >
        {mode === "login" ? "Solicitar acceso" : "Ya tengo una cuenta"}
      </button>
      {message ? <p role="alert" className="os-login-message">{message}</p> : null}
    </form>
  );
}
