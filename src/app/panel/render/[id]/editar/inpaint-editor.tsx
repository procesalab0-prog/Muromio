"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type PointerEvent } from "react";

export function InpaintEditor({
  sourceRenderId,
  imageUrl,
}: {
  sourceRenderId: string;
  imageUrl: string;
}) {
  const displayRef = useRef<HTMLCanvasElement>(null);
  const maskRef = useRef<HTMLCanvasElement>(null);
  const sourceRef = useRef<HTMLImageElement | null>(null);
  const drawingRef = useRef(false);
  const [brushSize, setBrushSize] = useState(54);
  const [hasSelection, setHasSelection] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("Cargando render…");
  const [result, setResult] = useState("");

  useEffect(() => {
    let objectUrl = "";
    async function loadImage() {
      try {
        const response = await fetch(imageUrl);
        if (!response.ok) throw new Error("Image download failed");
        objectUrl = URL.createObjectURL(await response.blob());
        const image = new Image();
        image.onload = () => {
          const display = displayRef.current;
          const mask = maskRef.current;
          if (!display || !mask) return;
          display.width = mask.width = image.naturalWidth;
          display.height = mask.height = image.naturalHeight;
          sourceRef.current = image;
          display.getContext("2d")?.drawImage(image, 0, 0);
          const maskContext = mask.getContext("2d");
          if (maskContext) {
            maskContext.fillStyle = "#000";
            maskContext.fillRect(0, 0, mask.width, mask.height);
          }
          setMessage("Pinta la zona que quieres modificar.");
        };
        image.src = objectUrl;
      } catch {
        setMessage("No pudimos cargar el render.");
      }
    }
    loadImage();
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [imageUrl]);

  function point(event: PointerEvent<HTMLCanvasElement>) {
    const canvas = displayRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * (canvas.width / rect.width),
      y: (event.clientY - rect.top) * (canvas.height / rect.height),
      scale: canvas.width / rect.width,
    };
  }

  function draw(event: PointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current) return;
    const display = displayRef.current;
    const mask = maskRef.current;
    if (!display || !mask) return;
    const { x, y, scale } = point(event);
    const radius = (brushSize * scale) / 2;

    const displayContext = display.getContext("2d");
    if (displayContext) {
      displayContext.fillStyle = "rgba(180, 72, 48, .55)";
      displayContext.beginPath();
      displayContext.arc(x, y, radius, 0, Math.PI * 2);
      displayContext.fill();
    }
    const maskContext = mask.getContext("2d");
    if (maskContext) {
      maskContext.fillStyle = "#fff";
      maskContext.beginPath();
      maskContext.arc(x, y, radius, 0, Math.PI * 2);
      maskContext.fill();
    }
    setHasSelection(true);
  }

  function clearSelection() {
    const display = displayRef.current;
    const mask = maskRef.current;
    const source = sourceRef.current;
    if (display && source) display.getContext("2d")?.drawImage(source, 0, 0);
    if (mask) {
      const context = mask.getContext("2d");
      if (context) {
        context.fillStyle = "#000";
        context.fillRect(0, 0, mask.width, mask.height);
      }
    }
    setHasSelection(false);
  }

  async function applyChange() {
    const mask = maskRef.current;
    if (!mask || !hasSelection || !prompt.trim()) {
      setMessage("Marca una zona y describe el cambio.");
      return;
    }
    setPending(true);
    setResult("");
    setMessage("Aplicando el cambio… puede tardar hasta un minuto.");

    const maskBlob = await new Promise<Blob | null>((resolve) => mask.toBlob(resolve, "image/png"));
    if (!maskBlob) {
      setPending(false);
      setMessage("No pudimos preparar la selección.");
      return;
    }

    const body = new FormData();
    body.set("sourceRenderId", sourceRenderId);
    body.set("prompt", prompt.trim());
    body.set("mask", maskBlob, "mask.png");
    const response = await fetch("/api/renders/inpaint", { method: "POST", body });
    const data = await response.json();
    setPending(false);
    if (!response.ok) {
      setMessage(data.error || "No pudimos editar el render.");
      return;
    }
    setResult(data.image);
    setMessage("Cambio aplicado y guardado en tu historial.");
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,360px),1fr))", gap: 24, alignItems: "start" }}>
      <div style={{ background: "#d8cec1", border: "1px solid rgba(38,34,32,.12)", overflow: "hidden" }}>
        {result ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={result} alt="Render editado" style={{ display: "block", width: "100%", height: "auto" }} />
        ) : (
          <canvas
            ref={displayRef}
            onPointerDown={(event) => {
              drawingRef.current = true;
              event.currentTarget.setPointerCapture(event.pointerId);
              draw(event);
            }}
            onPointerMove={draw}
            onPointerUp={() => { drawingRef.current = false; }}
            onPointerCancel={() => { drawingRef.current = false; }}
            style={{ display: "block", width: "100%", height: "auto", cursor: "crosshair", touchAction: "none" }}
          />
        )}
        <canvas ref={maskRef} hidden />
      </div>

      <aside style={{ padding: 24, background: "var(--cream)", border: "1px solid rgba(38,34,32,.1)" }}>
        {!result ? (
          <>
            <label style={labelStyle}>
              Tamaño del pincel
              <input
                type="range"
                min={16}
                max={140}
                value={brushSize}
                onChange={(event) => setBrushSize(Number(event.target.value))}
              />
            </label>
            <button type="button" onClick={clearSelection} style={secondaryButtonStyle}>
              Limpiar selección
            </button>
            <label style={labelStyle}>
              ¿Qué quieres cambiar?
              <textarea
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                maxLength={1200}
                rows={6}
                placeholder="Cambiar esta pared por travertino beige, conservando la iluminación y el resto del espacio."
                style={{ width: "100%", padding: 12, resize: "vertical", border: "1px solid rgba(38,34,32,.24)", background: "#fffdf8", font: "inherit" }}
              />
            </label>
            <button
              type="button"
              onClick={applyChange}
              disabled={pending}
              style={{ ...primaryButtonStyle, opacity: pending ? 0.65 : 1, cursor: pending ? "wait" : "pointer" }}
            >
              {pending ? "Aplicando…" : "Aplicar cambio"}
            </button>
          </>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            <a href={result} download="muromio-edicion.webp" style={primaryButtonStyle}>Descargar edición</a>
            <Link href="/panel" style={secondaryButtonStyle}>Ver historial</Link>
          </div>
        )}
        <p role="status" style={{ margin: "18px 0 0", color: "#655d58", fontSize: 13, lineHeight: 1.6 }}>
          {message}
        </p>
      </aside>
    </div>
  );
}

const labelStyle = { display: "grid", gap: 9, marginBottom: 18, fontSize: 13 } as const;
const primaryButtonStyle = {
  display: "inline-flex",
  justifyContent: "center",
  width: "100%",
  padding: "13px 16px",
  border: 0,
  background: "var(--rust)",
  color: "var(--cream)",
  textDecoration: "none",
  font: "inherit",
} as const;
const secondaryButtonStyle = {
  display: "inline-flex",
  justifyContent: "center",
  width: "100%",
  marginBottom: 18,
  padding: "10px 14px",
  border: "1px solid rgba(38,34,32,.22)",
  background: "transparent",
  color: "var(--ink)",
  textDecoration: "none",
  font: "inherit",
  cursor: "pointer",
} as const;
