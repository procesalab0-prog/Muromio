import { Container } from "./container";

const PIECES = [
  { label: "Residencial contemporáneo", classes: "from-stone-300 to-stone-500" },
  { label: "Interiorismo cálido", classes: "from-clay/80 to-clay-dark" },
  { label: "Fachada minimalista", classes: "from-stone-200 to-stone-400" },
  { label: "Espacios comerciales", classes: "from-ink-soft to-ink" },
  { label: "Renders nocturnos", classes: "from-ink to-clay-dark" },
  { label: "Paisajismo", classes: "from-stone-300 to-clay/60" },
];

export function Portfolio() {
  return (
    <section id="portafolio" className="border-t border-ink/10 py-20 sm:py-28">
      <Container>
        <div className="max-w-2xl">
          <h2 className="font-display text-3xl tracking-tight sm:text-4xl">Portafolio</h2>
          <p className="mt-4 text-ink-soft">
            Una muestra de los estilos que exploramos con nuestros clientes. Cada
            proyecto real se adapta a la identidad del estudio que lo encarga.
          </p>
        </div>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PIECES.map((piece) => (
            <div
              key={piece.label}
              className={`relative flex aspect-[4/3] items-end overflow-hidden rounded-2xl bg-gradient-to-br p-5 ${piece.classes}`}
            >
              <span className="rounded-full bg-background/90 px-3 py-1 text-xs font-medium text-ink">
                {piece.label}
              </span>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
