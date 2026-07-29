import { Container } from "./container";

const LINKS = [
  { href: "#servicios", label: "Servicios" },
  { href: "#proceso", label: "Proceso" },
  { href: "#portafolio", label: "Portafolio" },
  { href: "#nosotros", label: "Nosotros" },
  { href: "#contacto", label: "Contacto" },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-ink/10 bg-ink text-background">
      <Container className="flex flex-col gap-8 py-14 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <span className="font-display text-xl">Muromío</span>
          <p className="mt-3 max-w-xs text-sm text-background/65">
            Diseño e inteligencia artificial para arquitectura e interiorismo.
          </p>
        </div>

        <nav className="flex flex-wrap gap-x-8 gap-y-3">
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-background/70 transition-colors hover:text-background"
            >
              {link.label}
            </a>
          ))}
        </nav>
      </Container>

      <Container className="flex flex-col gap-2 border-t border-background/10 py-6 text-xs text-background/50 sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} Muromío. Todos los derechos reservados.</p>
        <p>hola@muromio.com</p>
      </Container>
    </footer>
  );
}
