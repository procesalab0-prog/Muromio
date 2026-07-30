"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { SparkleIcon } from "@/components/os-icons";

const styles = [
  "Minimalismo cálido",
  "Japandi",
  "Contemporáneo mexicano",
  "Mediterráneo",
  "Industrial suave",
];

export function RenderForm({
  sourceRenderId,
  initialCredits,
  unlimitedCredits,
}: {
  sourceRenderId?: string;
  initialCredits: number;
  unlimitedCredits: boolean;
}) {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [result, setResult] = useState("");
  const [mode, setMode] = useState("sketch");
  const [credits, setCredits] = useState(initialCredits);

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
      if (data.credits && !data.credits.unlimited_credits) {
        setCredits(data.credits.credit_balance);
      }
      setMessage("Render completado.");
    } catch {
      setMessage("La conexión se interrumpió. Revisa el panel antes de intentarlo otra vez.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="render-os-grid">
      <form onSubmit={handleSubmit} className="render-os-controls">
        <div className="render-os-balance">
          <strong>Saldo</strong>
          <span style={{ color: "var(--rust)" }}>{unlimitedCredits ? "Sin límite" : `${credits} créditos`}</span>
        </div>
        {sourceRenderId ? <input type="hidden" name="sourceRenderId" value={sourceRenderId} /> : null}
        <label>
          Nombre del proyecto
          <input
            name="projectName"
            required
            maxLength={120}
            placeholder="Casa Roble"
            defaultValue={sourceRenderId ? "Nueva variación" : ""}
          />
        </label>
        <label>
          Tipo de imagen
          <select name="mode" value={mode} onChange={(event) => setMode(event.target.value)}>
            <option value="sketch">Plano o boceto</option>
            <option value="structure">Fotografía o render base</option>
            <option value="style-transfer">Transferir estilo de una referencia</option>
          </select>
        </label>
        {sourceRenderId ? (
          <div className="render-os-selected">
            <strong>Render base seleccionado</strong>
            <small>La nueva versión conservará la composición del render anterior.</small>
          </div>
        ) : (
          <label>
            Imagen base
            <input name="image" type="file" required accept="image/png,image/jpeg,image/webp" />
            <small>PNG, JPG o WEBP · optimizamos el archivo automáticamente</small>
          </label>
        )}
        {mode === "style-transfer" ? (
          <label>
            Referencia de estilo Muromío
            <input name="styleImage" type="file" required accept="image/png,image/jpeg,image/webp" />
            <small>Usaremos sus materiales, color e iluminación; optimizaremos ambas imágenes antes de enviarlas.</small>
          </label>
        ) : null}
        <label>
          Estilo
          <select name="style">
            {styles.map((style) => <option key={style}>{style}</option>)}
          </select>
        </label>
        <label>
          Materiales y detalles
          <textarea
            name="details"
            maxLength={1200}
            rows={5}
            placeholder="Travertino, madera clara, luz de tarde, vegetación interior…"
          />
        </label>
        <button
          type="submit"
          disabled={pending}
          className="render-os-submit"
        >
          {pending ? "Generando…" : `Generar render · ${mode === "style-transfer" ? 8 : 6} créditos`}
        </button>
        {message ? <p role="status" className="render-os-message">{message}</p> : null}
      </form>

      <div className={`render-os-canvas ${pending ? "is-loading" : ""}`}>
        {result ? (
          <>
            <Image src={result} alt="Render generado" width={1400} height={1050} unoptimized />
            <div className="render-os-result-actions">
              <a href={result} download="muromio-render.webp" style={actionStyle}>
                Descargar
              </a>
              <Link href="/panel" style={actionStyle}>
                Ver historial
              </Link>
            </div>
          </>
        ) : (
          <div className="render-os-empty"><span><SparkleIcon width={26} height={26} /></span><strong>{pending ? "Construyendo propuesta…" : "Lienzo de trabajo"}</strong><p>{pending ? message : "Tu render aparecerá aquí al terminar la generación."}</p></div>
        )}
      </div>
    </div>
  );
}

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
