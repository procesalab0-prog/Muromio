import { Container } from "./container";

const TILES = [
  { label: "Fachada", classes: "from-clay to-clay-dark" },
  { label: "Interior", classes: "from-stone-300 to-stone-500" },
  { label: "Nocturno", classes: "from-ink to-ink-soft" },
  { label: "Paisaje", classes: "from-stone-200 to-clay/70" },
];

export function Hero() {
  return (
    <section id="top" className="pt-16 sm:pt-24">
      <Container className="grid items-center gap-14 pb-20 lg:grid-cols-[1.1fr_0.9fr] lg:gap-10 lg:pb-28">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-clay">
            Estudio de diseño + inteligencia artificial
          </p>
          <h1 className="mt-5 font-display text-4xl leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
            Renders de arquitectura e interiorismo, hechos con IA.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-soft">
            Muromío convierte planos, bocetos y referencias en renders fotorrealistas
            en minutos, con el criterio de diseño de un estudio profesional detrás de
            cada imagen.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <a
              href="#contacto"
              className="rounded-full bg-ink px-6 py-3.5 text-center text-sm font-medium text-background transition-colors hover:bg-clay"
            >
              Solicita acceso anticipado
            </a>
            <a
              href="#proceso"
              className="rounded-full border border-ink/15 px-6 py-3.5 text-center text-sm font-medium text-ink transition-colors hover:border-ink/40"
            >
              Cómo funciona
            </a>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {TILES.map((tile, i) => (
            <div
              key={tile.label}
              className={`flex aspect-[4/5] items-end rounded-2xl bg-gradient-to-br p-4 ${tile.classes} ${
                i % 2 === 1 ? "translate-y-6" : ""
              }`}
            >
              <span className="rounded-full bg-background/90 px-3 py-1 text-xs font-medium text-ink">
                {tile.label}
              </span>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
