import { Container } from "./container";

const SERVICES = [
  {
    title: "Renders exteriores",
    description:
      "Fachadas y volumetrías arquitectónicas fotorrealistas a partir de planos, bocetos o modelos 3D.",
  },
  {
    title: "Interiorismo con IA",
    description:
      "Ambientaciones, materiales e iluminación explorados en múltiples variaciones antes de construir nada.",
  },
  {
    title: "Iteración exprés",
    description:
      "Cambios de estilo, paleta o clima en minutos, no en días. Prueba direcciones distintas sin rehacer el render.",
  },
  {
    title: "Piezas para marketing",
    description:
      "Imágenes listas para fichas comerciales, redes sociales y presentaciones a cliente.",
  },
];

export function Services() {
  return (
    <section id="servicios" className="border-t border-ink/10 py-20 sm:py-28">
      <Container>
        <div className="max-w-2xl">
          <h2 className="font-display text-3xl tracking-tight sm:text-4xl">Servicios</h2>
          <p className="mt-4 text-ink-soft">
            Un estudio de diseño con motor de IA propio, pensado para arquitectos,
            interioristas, constructoras e inmobiliarias.
          </p>
        </div>

        <div className="mt-14 grid gap-px overflow-hidden rounded-2xl bg-ink/10 sm:grid-cols-2">
          {SERVICES.map((service) => (
            <div key={service.title} className="bg-background p-8">
              <h3 className="font-display text-xl">{service.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-ink-soft">
                {service.description}
              </p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
