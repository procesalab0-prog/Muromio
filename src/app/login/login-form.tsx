"use client";

import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";

export function LoginForm() {
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage("");

    const formData = new FormData(event.currentTarget);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: String(formData.get("email") ?? "").trim(),
      password: String(formData.get("password") ?? ""),
    });

    if (error) {
      setMessage("No pudimos iniciar sesión. Revisa tu correo y contraseña.");
      setPending(false);
      return;
    }

    window.location.assign("/panel");
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        width: "100%",
        maxWidth: 430,
        padding: "clamp(28px,5vw,52px)",
        background: "var(--cream)",
        border: "1px solid rgba(38,34,32,.12)",
      }}
    >
      <p
        style={{
          margin: "0 0 12px",
          color: "var(--rust)",
          fontSize: 11,
          letterSpacing: ".2em",
          textTransform: "uppercase",
        }}
      >
        Espacio de trabajo
      </p>
      <h1
        style={{
          margin: "0 0 10px",
          fontFamily: "var(--font-lora)",
          fontSize: "clamp(34px,5vw,48px)",
          fontWeight: 500,
          lineHeight: 1.05,
        }}
      >
        Bienvenido a Muromío
      </h1>
      <p style={{ margin: "0 0 34px", color: "#655d58", lineHeight: 1.6 }}>
        Accede a tus proyectos, referencias y renders.
      </p>

      <label style={{ display: "grid", gap: 8, marginBottom: 18, fontSize: 13 }}>
        Correo electrónico
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          style={{
            minHeight: 48,
            padding: "0 14px",
            border: "1px solid rgba(38,34,32,.25)",
            background: "#fffdf8",
            color: "var(--ink)",
            font: "inherit",
          }}
        />
      </label>
      <label style={{ display: "grid", gap: 8, marginBottom: 24, fontSize: 13 }}>
        Contraseña
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          style={{
            minHeight: 48,
            padding: "0 14px",
            border: "1px solid rgba(38,34,32,.25)",
            background: "#fffdf8",
            color: "var(--ink)",
            font: "inherit",
          }}
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        style={{
          width: "100%",
          minHeight: 50,
          border: 0,
          background: "var(--rust)",
          color: "var(--cream)",
          cursor: pending ? "wait" : "pointer",
          font: "inherit",
          fontSize: 12,
          letterSpacing: ".16em",
          textTransform: "uppercase",
          opacity: pending ? 0.7 : 1,
        }}
      >
        {pending ? "Iniciando…" : "Iniciar sesión"}
      </button>
      {message ? (
        <p role="alert" style={{ margin: "18px 0 0", color: "var(--rust-dark)", fontSize: 13 }}>
          {message}
        </p>
      ) : null}
    </form>
  );
}
