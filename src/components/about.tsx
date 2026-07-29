import { Container } from "./container";

export function About() {
  return (
    <section id="nosotros" className="border-t border-ink/10 py-20 sm:py-28">
      <Container className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
        <h2 className="font-display text-3xl tracking-tight sm:text-4xl">Nosotros</h2>
        <div className="space-y-5 text-ink-soft">
          <p>
            Muromío nace de juntar dos oficios: el diseño arquitectónico y de
            interiores, y la ingeniería detrás de los modelos de IA generativa.
            Creemos que la inteligencia artificial no reemplaza el criterio de
            diseño — lo acelera.
          </p>
          <p>
            Nuestro equipo revisa cada render antes de entregarlo, cuidando
            proporciones, materiales y luz como lo haría un estudio tradicional,
            pero en una fracción del tiempo.
          </p>
          <p>
            Próximamente lanzaremos la plataforma donde arquitectos, interioristas
            e inmobiliarias podrán generar sus propios renders con IA de forma
            directa, con las mismas herramientas que usamos internamente.
          </p>
        </div>
      </Container>
    </section>
  );
}
