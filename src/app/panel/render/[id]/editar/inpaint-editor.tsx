"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type PointerEvent } from "react";

type EditAction = "recolor" | "replace" | "erase" | "inpaint";
type Point = { x: number; y: number; scale: number };

const actions: Array<{ id: EditAction; title: string; description: string }> = [
  { id: "recolor", title: "Material o color", description: "Localiza el objeto automáticamente y conserva su forma." },
  { id: "replace", title: "Reemplazar objeto", description: "Sustituye un mueble u objeto completo." },
  { id: "erase", title: "Eliminar objeto", description: "Pinta el objeto para reconstruir el fondo." },
  { id: "inpaint", title: "Edición precisa", description: "Pinta manualmente la única zona editable." },
];

export function InpaintEditor({ sourceRenderId, imageUrl }: { sourceRenderId: string; imageUrl: string }) {
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const maskRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const lastPointRef = useRef<Point | null>(null);
  const historyRef = useRef<ImageData[]>([]);
  const [sourceUrl, setSourceUrl] = useState("");
  const [action, setAction] = useState<EditAction>("recolor");
  const [tool, setTool] = useState<"brush" | "eraser">("brush");
  const [brushSize, setBrushSize] = useState(48);
  const [zoom, setZoom] = useState(1);
  const [showMask, setShowMask] = useState(false);
  const [hasSelection, setHasSelection] = useState(false);
  const [objectPrompt, setObjectPrompt] = useState("");
  const [prompt, setPrompt] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("Cargando render…");
  const [result, setResult] = useState("");
  const needsMask = action === "erase" || action === "inpaint";

  useEffect(() => {
    let objectUrl = "";
    async function loadImage() {
      try {
        const response = await fetch(imageUrl);
        if (!response.ok) throw new Error();
        objectUrl = URL.createObjectURL(await response.blob());
        const image = new Image();
        image.onload = () => {
          const overlay = overlayRef.current;
          const mask = maskRef.current;
          if (!overlay || !mask) return;
          overlay.width = mask.width = image.naturalWidth;
          overlay.height = mask.height = image.naturalHeight;
          const maskContext = mask.getContext("2d");
          if (maskContext) {
            maskContext.fillStyle = "#000";
            maskContext.fillRect(0, 0, mask.width, mask.height);
          }
          setSourceUrl(objectUrl);
          setMessage("Elige el tipo de cambio.");
        };
        image.src = objectUrl;
      } catch {
        setMessage("No pudimos cargar el render.");
      }
    }
    loadImage();
    return () => { if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [imageUrl]);

  function point(event: PointerEvent<HTMLCanvasElement>): Point {
    const canvas = overlayRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * (canvas.width / rect.width),
      y: (event.clientY - rect.top) * (canvas.height / rect.height),
      scale: canvas.width / rect.width,
    };
  }

  function saveHistory() {
    const mask = maskRef.current;
    const context = mask?.getContext("2d");
    if (!mask || !context) return;
    historyRef.current = [...historyRef.current.slice(-14), context.getImageData(0, 0, mask.width, mask.height)];
  }

  function drawSegment(from: Point, to: Point) {
    const overlay = overlayRef.current;
    const mask = maskRef.current;
    if (!overlay || !mask) return;
    const width = brushSize * to.scale;
    const overlayContext = overlay.getContext("2d");
    const maskContext = mask.getContext("2d");
    for (const context of [overlayContext, maskContext]) {
      if (!context) continue;
      context.lineCap = "round";
      context.lineJoin = "round";
      context.lineWidth = width;
      context.beginPath();
      context.moveTo(from.x, from.y);
      context.lineTo(to.x, to.y);
      if (tool === "eraser") {
        if (context === overlayContext) {
          context.globalCompositeOperation = "destination-out";
          context.strokeStyle = "#000";
        } else {
          context.globalCompositeOperation = "source-over";
          context.strokeStyle = "#000";
        }
      } else {
        context.globalCompositeOperation = "source-over";
        context.strokeStyle = context === overlayContext
          ? showMask ? "#fff" : "rgba(180,72,48,.58)"
          : "#fff";
      }
      context.stroke();
      context.globalCompositeOperation = "source-over";
    }
    setHasSelection(true);
  }

  function beginDraw(event: PointerEvent<HTMLCanvasElement>) {
    saveHistory();
    drawingRef.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
    const current = point(event);
    lastPointRef.current = current;
    drawSegment(current, current);
  }

  function continueDraw(event: PointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current || !lastPointRef.current) return;
    const current = point(event);
    drawSegment(lastPointRef.current, current);
    lastPointRef.current = current;
  }

  function endDraw() {
    drawingRef.current = false;
    lastPointRef.current = null;
  }

  function rebuildOverlay(maskOnly = showMask) {
    const overlay = overlayRef.current;
    const mask = maskRef.current;
    const maskContext = mask?.getContext("2d");
    const overlayContext = overlay?.getContext("2d");
    if (!overlay || !mask || !maskContext || !overlayContext) return;
    const maskPixels = maskContext.getImageData(0, 0, mask.width, mask.height);
    const pixels = overlayContext.createImageData(overlay.width, overlay.height);
    for (let index = 0; index < maskPixels.data.length; index += 4) {
      if (maskPixels.data[index] < 128) continue;
      pixels.data[index] = maskOnly ? 255 : 180;
      pixels.data[index + 1] = maskOnly ? 255 : 72;
      pixels.data[index + 2] = maskOnly ? 255 : 48;
      pixels.data[index + 3] = maskOnly ? 255 : 148;
    }
    overlayContext.clearRect(0, 0, overlay.width, overlay.height);
    overlayContext.putImageData(pixels, 0, 0);
  }

  function clearSelection() {
    saveHistory();
    const mask = maskRef.current;
    const context = mask?.getContext("2d");
    if (mask && context) {
      context.fillStyle = "#000";
      context.fillRect(0, 0, mask.width, mask.height);
    }
    overlayRef.current?.getContext("2d")?.clearRect(0, 0, overlayRef.current.width, overlayRef.current.height);
    setHasSelection(false);
  }

  function undo() {
    const previous = historyRef.current.pop();
    const maskContext = maskRef.current?.getContext("2d");
    if (!previous || !maskContext) return;
    maskContext.putImageData(previous, 0, 0);
    setHasSelection(previous.data.some((value, index) => index % 4 === 0 && value > 128));
    rebuildOverlay();
  }

  function toggleMask() {
    const next = !showMask;
    setShowMask(next);
    requestAnimationFrame(() => rebuildOverlay(next));
  }

  async function applyChange() {
    const mask = maskRef.current;
    if (needsMask && (!mask || !hasSelection)) {
      setMessage("Pinta la zona u objeto que quieres modificar.");
      return;
    }
    if ((action === "recolor" || action === "replace") && !objectPrompt.trim()) {
      setMessage("Describe el objeto que Stability debe localizar.");
      return;
    }
    if (action !== "erase" && !prompt.trim()) {
      setMessage("Describe el resultado que quieres obtener.");
      return;
    }
    setPending(true);
    setResult("");
    setMessage("Aplicando el cambio…");

    const body = new FormData();
    body.set("sourceRenderId", sourceRenderId);
    body.set("action", action);
    body.set("objectPrompt", objectPrompt.trim());
    body.set("prompt", prompt.trim());
    if (needsMask && mask) {
      const maskBlob = await new Promise<Blob | null>((resolve) => mask.toBlob(resolve, "image/png"));
      if (maskBlob) body.set("mask", maskBlob, "mask.png");
    }

    try {
      const response = await fetch("/api/renders/inpaint", { method: "POST", body });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMessage(data.error || "No pudimos editar el render.");
        return;
      }
      setResult(data.image);
      setMessage("Cambio aplicado y guardado como una versión nueva.");
    } catch {
      setMessage("La conexión se interrumpió. Revisa el historial antes de repetir.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,380px),1fr))", gap: 24, alignItems: "start" }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
          <label style={compactControl}>Zoom
            <input type="range" min={0.75} max={2} step={0.05} value={zoom} onChange={(event) => setZoom(Number(event.target.value))} />
          </label>
          {needsMask ? <>
            <button type="button" onClick={() => setTool("brush")} style={tool === "brush" ? activeToolStyle : toolStyle}>Pincel</button>
            <button type="button" onClick={() => setTool("eraser")} style={tool === "eraser" ? activeToolStyle : toolStyle}>Borrador</button>
            <button type="button" onClick={undo} style={toolStyle}>Deshacer</button>
            <button type="button" onClick={toggleMask} style={toolStyle}>{showMask ? "Ver imagen" : "Ver máscara"}</button>
          </> : null}
        </div>
        <div style={{ overflow: "auto", maxHeight: "75svh", background: "#d8cec1", border: "1px solid rgba(38,34,32,.12)" }}>
          {result ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={result} alt="Render editado" style={{ width: "100%", height: "auto" }} />
          ) : (
            <div style={{ position: "relative", width: `${zoom * 100}%`, lineHeight: 0 }}>
              {sourceUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={sourceUrl} alt="Render original" style={{ width: "100%", height: "auto", opacity: showMask ? 0.12 : 1 }} />
              ) : null}
              <canvas
                ref={overlayRef}
                onPointerDown={needsMask ? beginDraw : undefined}
                onPointerMove={needsMask ? continueDraw : undefined}
                onPointerUp={endDraw}
                onPointerCancel={endDraw}
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", cursor: needsMask ? "crosshair" : "default", touchAction: "none" }}
              />
            </div>
          )}
          <canvas ref={maskRef} hidden />
        </div>
      </div>

      <aside style={{ padding: 24, background: "var(--cream)", border: "1px solid rgba(38,34,32,.1)" }}>
        {!result ? <>
          <p style={{ marginTop: 0, fontSize: 13 }}>Tipo de cambio</p>
          <div style={{ display: "grid", gap: 8, marginBottom: 20 }}>
            {actions.map((item) => (
              <button key={item.id} type="button" onClick={() => { setAction(item.id); setMessage(item.description); }} style={action === item.id ? activeActionStyle : actionStyle}>
                <strong>{item.title}</strong><small>{item.description}</small>
              </button>
            ))}
          </div>
          {needsMask ? (
            <label style={labelStyle}>Tamaño del pincel
              <input type="range" min={8} max={120} value={brushSize} onChange={(event) => setBrushSize(Number(event.target.value))} />
            </label>
          ) : (
            <label style={labelStyle}>Objeto que quieres localizar
              <input value={objectPrompt} onChange={(event) => setObjectPrompt(event.target.value)} maxLength={300} placeholder="El sillón individual de la derecha" style={fieldStyle} />
            </label>
          )}
          {action === "erase" ? (
            <label style={labelStyle}>Objeto (opcional)
              <input value={objectPrompt} onChange={(event) => setObjectPrompt(event.target.value)} maxLength={300} placeholder="Sillón" style={fieldStyle} />
            </label>
          ) : (
            <label style={labelStyle}>Resultado deseado
              <textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} maxLength={1200} rows={5} placeholder={action === "recolor" ? "El mismo sillón tapizado en bouclé verde olivo" : "Describe el cambio con precisión"} style={{ ...fieldStyle, padding: 12, resize: "vertical" }} />
            </label>
          )}
          {needsMask ? <button type="button" onClick={clearSelection} style={secondaryButtonStyle}>Limpiar selección</button> : null}
          <button type="button" onClick={applyChange} disabled={pending} style={{ ...primaryButtonStyle, opacity: pending ? .65 : 1 }}>
            {pending ? "Aplicando…" : "Aplicar cambio · 5 créditos"}
          </button>
        </> : (
          <div style={{ display: "grid", gap: 10 }}>
            <a href={result} download="muromio-edicion.webp" style={primaryButtonStyle}>Descargar edición</a>
            <Link href="/panel" style={secondaryButtonStyle}>Ver historial</Link>
          </div>
        )}
        <p role="status" style={{ margin: "18px 0 0", color: "#655d58", fontSize: 13, lineHeight: 1.6 }}>{message}</p>
      </aside>
    </div>
  );
}

const labelStyle = { display: "grid", gap: 9, marginBottom: 18, fontSize: 13 } as const;
const compactControl = { display: "inline-flex", alignItems: "center", gap: 8, fontSize: 12 } as const;
const fieldStyle = { width: "100%", minHeight: 44, paddingInline: 10, border: "1px solid rgba(38,34,32,.24)", background: "#fffdf8", font: "inherit" } as const;
const toolStyle = { padding: "8px 10px", border: "1px solid rgba(38,34,32,.2)", background: "var(--cream)", color: "var(--ink)", cursor: "pointer" } as const;
const activeToolStyle = { ...toolStyle, background: "var(--rust)", color: "var(--cream)" } as const;
const actionStyle = { display: "grid", gap: 3, padding: 12, textAlign: "left", border: "1px solid rgba(38,34,32,.14)", background: "#fffdf8", color: "var(--ink)", cursor: "pointer" } as const;
const activeActionStyle = { ...actionStyle, borderColor: "var(--rust)", boxShadow: "inset 3px 0 var(--rust)" } as const;
const primaryButtonStyle = { display: "inline-flex", justifyContent: "center", width: "100%", padding: "13px 16px", border: 0, background: "var(--rust)", color: "var(--cream)", textDecoration: "none", font: "inherit", cursor: "pointer" } as const;
const secondaryButtonStyle = { display: "inline-flex", justifyContent: "center", width: "100%", marginBottom: 12, padding: "10px 14px", border: "1px solid rgba(38,34,32,.22)", background: "transparent", color: "var(--ink)", textDecoration: "none", font: "inherit", cursor: "pointer" } as const;
