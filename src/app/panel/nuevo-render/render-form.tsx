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
    setMessage(mode === "style-transfer" ? "Preparando imágenes…" : "Generando propuesta…");
    setResult("");

    try {
      const body = new FormData(event.currentTarget);
      if (mode === "style-transfer") {
        const image = body.get("image");
        const styleImage = body.get("styleImage");
        const optimizedImage = image instanceof File && image.size
          ? await optimizeImage(image, 1400, 0.82)
          : null;
        let optimizedStyle = styleImage instanceof File && styleImage.size
          ? await optimizeImage(styleImage, 1400, 0.82)
          : null;

        if (optimizedImage) body.set("image", optimizedImage);
        if (optimizedStyle) body.set("styleImage", optimizedStyle);

        const totalSize = (optimizedImage?.size ?? 0) + (optimizedStyle?.size ?? 0);
        if (totalSize > 3.8 * 1024 * 1024) {
          if (image instanceof File && image.size) {
            body.set("image", await optimizeImage(image, 1100, 0.7));
          }
          if (styleImage instanceof File && styleImage.size) {
            optimizedStyle = await optimizeImage(styleImage, 1100, 0.7);
            body.set("styleImage", optimizedStyle);
          }
        }
        setMessage("Transfiriendo el estilo… puede tardar varios minutos.");
      }

      const response = await fetch("/api/renders/generate", {
        method: "POST",
        body,
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setMessage(data.error || "La generación tardó demasiado o fue interrumpida.");
        return;
      }

      setResult(data.image);
      setMessage("Render completado.");
    } catch {
      setMessage("La conexión se interrumpió. Revisa el panel antes de intentarlo otra vez.");
    } finally {
      setPending(false);
    }
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
            <small>PNG, JPG o WEBP · optimizamos el archivo automáticamente</small>
          </label>
        )}
        {mode === "style-transfer" ? (
          <label style={labelStyle}>
            Referencia de estilo Muromío
            <input name="styleImage" type="file" required accept="image/png,image/jpeg,image/webp" style={fieldStyle} />
            <small>Usaremos sus materiales, color e iluminación; optimizaremos ambas imágenes antes de enviarlas.</small>
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

async function optimizeImage(file: File, maxDimension: number, quality: number) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(64, Math.round(bitmap.width * scale));
  canvas.height = Math.max(64, Math.round(bitmap.height * scale));
  const context = canvas.getContext("2d");
  if (!context) {
    bitmap.close();
    throw new Error("Canvas is not available");
  }
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/webp", quality);
  });
  if (!blob) throw new Error("Could not optimize image");
  return new File([blob], `${file.name.replace(/\.[^.]+$/, "")}.webp`, {
    type: "image/webp",
  });
}
