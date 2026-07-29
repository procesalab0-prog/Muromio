import { Container } from "./container";

const STEPS = [
  {
    number: "01",
    title: "Sube tu proyecto",
    description: "Planos, bocetos, modelos 3D o incluso una descripción del espacio.",
  },
  {
    number: "02",
    title: "Define el estilo",
    description: "Elige referencias, materiales, iluminación y atmósfera para el render.",
  },
  {
    number: "03",
    title: "La IA genera variaciones",
    description: "Nuestro motor produce varias propuestas fotorrealistas del mismo espacio.",
  },
  {
    number: "04",
    title: "Refina y descarga",
    description: "Ajusta el resultado con el equipo de Muromío y descarga en alta resolución.",
  },
];

export function Process() {
  return (
    <section id="proceso" className="border-t border-ink/10 bg-ink py-20 text-background sm:py-28">
      <Container>
        <div className="max-w-2xl">
          <h2 className="font-display text-3xl tracking-tight sm:text-4xl">Cómo funciona</h2>
          <p className="mt-4 text-background/70">
            De la idea al render, sin perder el control creativo en el camino.
          </p>
        </div>

        <div className="mt-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step) => (
            <div key={step.number}>
              <span className="font-display text-sm text-clay">{step.number}</span>
              <h3 className="mt-3 font-display text-lg">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-background/65">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
