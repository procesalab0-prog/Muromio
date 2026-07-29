"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type FormEvent } from "react";

const styles = [
  "Minimalismo cálido",
  "Japandi",
  "Contemporáneo mexicano",
  "Mediterráneo",
  "Industrial suave",
];

export function RenderForm({ sourceRenderId }: { sourceRenderId?: string }) {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [result, setResult] = useState("");
  const [mode, setMode] = useState("sketch");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage("Generando propuesta… puede tardar hasta un minuto.");
    setResult("");

    const response = await fetch("/api/renders/generate", {
      method: "POST",
      body: new FormData(event.currentTarget),
    });
    const data = await response.json();

    if (!response.ok) {
      setMessage(data.error || "No fue posible generar el render.");
      setPending(false);
      return;
    }

    setResult(data.image);
    setMessage("Render completado.");
    setPending(false);
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 28 }}>
      <form onSubmit={handleSubmit} style={{ padding: "clamp(24px,4vw,42px)", background: "var(--cream)", border: "1px solid rgba(38,34,32,.1)" }}>
        {sourceRenderId ? <input type="hidden" name="sourceRenderId" value={sourceRenderId} /> : null}
        <label style={labelStyle}>
          Nombre del proyecto
          <input
            name="projectName"
            required
            maxLength={120}
            style={fieldStyle}
            placeholder="Casa Roble"
            defaultValue={sourceRenderId ? "Nueva variación" : ""}
          />
        </label>
        <label style={labelStyle}>
          Tipo de imagen
          <select name="mode" style={fieldStyle} value={mode} onChange={(event) => setMode(event.target.value)}>
            <option value="sketch">Plano o boceto</option>
            <option value="structure">Fotografía o render base</option>
            <option value="style-transfer">Transferir estilo de una referencia</option>
          </select>
        </label>
        {sourceRenderId ? (
          <div style={{ ...labelStyle, padding: 14, background: "#fffdf8", border: "1px solid rgba(38,34,32,.14)" }}>
            <strong>Render base seleccionado</strong>
            <small>La nueva versión conservará la composición del render anterior.</small>
          </div>
        ) : (
          <label style={labelStyle}>
            Imagen base
            <input name="image" type="file" required accept="image/png,image/jpeg,image/webp" style={fieldStyle} />
            <small>PNG, JPG o WEBP · máximo 10 MB</small>
          </label>
        )}
        {mode === "style-transfer" ? (
          <label style={labelStyle}>
            Referencia de estilo Muromío
            <input name="styleImage" type="file" required accept="image/png,image/jpeg,image/webp" style={fieldStyle} />
            <small>Usaremos sus materiales, color e iluminación; la imagen base conservará su composición.</small>
          </label>
        ) : null}
        <label style={labelStyle}>
          Estilo
          <select name="style" style={fieldStyle}>
            {styles.map((style) => <option key={style}>{style}</option>)}
          </select>
        </label>
        <label style={labelStyle}>
          Materiales y detalles
          <textarea
            name="details"
            maxLength={1200}
            rows={5}
            style={{ ...fieldStyle, paddingBlock: 12, resize: "vertical" }}
            placeholder="Travertino, madera clara, luz de tarde, vegetación interior…"
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
            opacity: pending ? 0.65 : 1,
          }}
        >
          {pending ? "Generando…" : "Generar render"}
        </button>
        {message ? <p role="status" style={{ color: "#655d58", lineHeight: 1.5 }}>{message}</p> : null}
      </form>

      <div style={{ minHeight: 420, display: "grid", placeItems: "center", alignContent: "center", gap: 16, background: "#d8cec1", border: "1px solid rgba(38,34,32,.1)", overflow: "hidden" }}>
        {result ? (
          <>
            <Image src={result} alt="Render generado" width={1400} height={1050} unoptimized style={{ width: "100%", height: "auto" }} />
            <div style={{ display: "flex", gap: 10, padding: "0 16px 16px", flexWrap: "wrap", justifyContent: "center" }}>
              <a href={result} download="muromio-render.webp" style={actionStyle}>
                Descargar
              </a>
              <Link href="/panel" style={actionStyle}>
                Ver historial
              </Link>
            </div>
          </>
        ) : (
          <p style={{ maxWidth: 280, padding: 24, textAlign: "center", color: "#655d58", lineHeight: 1.6 }}>
            Tu render aparecerá aquí cuando termine la generación.
          </p>
        )}
      </div>
    </div>
  );
}

const labelStyle = {
  display: "grid",
  gap: 8,
  marginBottom: 18,
  fontSize: 13,
} as const;

const fieldStyle = {
  width: "100%",
  minHeight: 46,
  paddingInline: 12,
  border: "1px solid rgba(38,34,32,.24)",
  background: "#fffdf8",
  color: "var(--ink)",
  font: "inherit",
} as const;

const actionStyle = {
  display: "inline-flex",
  padding: "10px 16px",
  background: "var(--cream)",
  color: "var(--ink)",
  border: "1px solid rgba(38,34,32,.2)",
  textDecoration: "none",
  fontSize: 13,
} as const;
