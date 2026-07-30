"use client";

import { useCallback, useEffect, useState } from "react";

const steps = [
  {
    target: "navigation",
    title: "Tu espacio de trabajo",
    body: "Todo el despacho vive aquí, agrupado por áreas. Cambia de sección con un clic.",
  },
  {
    target: "render-lab",
    title: "Render Lab",
    body: "Genera visualizaciones con IA desde un boceto, plano o imagen.",
  },
  {
    target: "credits",
    title: "Tus créditos",
    body: "Cada render consume créditos. Aquí ves cuántos te quedan.",
  },
  {
    target: "projects",
    title: "Proyectos",
    body: "Reúne avances, versiones, archivos y decisiones de cada proyecto.",
  },
  {
    target: "finances",
    title: "Presupuestos",
    body: "Cotiza, programa anticipos y sigue lo cobrado y por cobrar.",
  },
  {
    target: "search",
    title: "Encuentra todo",
    body: "Busca proyectos al instante. Muromío OS está listo para trabajar.",
  },
];

const storageKey = "muromio-os-tour-v1";

export function WorkspaceTour() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);

  const position = useCallback(() => {
    const target = document.querySelector<HTMLElement>(`[data-tour="${steps[step].target}"]`);
    setRect(target && window.innerWidth > 760 ? target.getBoundingClientRect() : null);
  }, [step]);

  useEffect(() => {
    const launch = () => {
      setStep(0);
      setOpen(true);
    };
    window.addEventListener("muromio:tour", launch);
    const timer = window.setTimeout(() => {
      if (!window.localStorage.getItem(storageKey)) launch();
    }, 650);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("muromio:tour", launch);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const frame = window.requestAnimationFrame(position);
    window.addEventListener("resize", position);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", position);
    };
  }, [open, position]);

  function close() {
    window.localStorage.setItem(storageKey, "done");
    setOpen(false);
  }

  if (!open) return null;

  const current = steps[step];
  const cardStyle = rect
    ? {
        top: Math.min(window.innerHeight - 300, Math.max(20, rect.top)),
        left: Math.min(window.innerWidth - 390, rect.right + 22),
      }
    : undefined;

  return (
    <div className="os-tour-layer" role="dialog" aria-modal="true" aria-label="Tutorial de Muromío OS">
      {rect ? (
        <div
          className="os-tour-spotlight"
          style={{ top: rect.top - 7, left: rect.left - 7, width: rect.width + 14, height: rect.height + 14 }}
        />
      ) : <div className="os-tour-backdrop" />}
      <section className="os-tour-card" style={cardStyle}>
        <header>
          <span>Paso {step + 1} de {steps.length}</span>
          <button type="button" onClick={close}>Omitir</button>
        </header>
        <h2>{current.title}</h2>
        <p>{current.body}</p>
        <footer>
          <div aria-hidden="true">
            {steps.map((item, index) => <i className={index === step ? "is-active" : ""} key={item.title} />)}
          </div>
          <nav>
            {step > 0 ? <button type="button" onClick={() => setStep(step - 1)}>Atrás</button> : null}
            <button type="button" className="is-primary" onClick={() => step === steps.length - 1 ? close() : setStep(step + 1)}>
              {step === steps.length - 1 ? "Empezar" : "Siguiente"}
            </button>
          </nav>
        </footer>
      </section>
    </div>
  );
}
