"use client";

import { useState } from "react";
import { Container } from "./container";

const NAV_LINKS = [
  { href: "#servicios", label: "Servicios" },
  { href: "#proceso", label: "Proceso" },
  { href: "#portafolio", label: "Portafolio" },
  { href: "#nosotros", label: "Nosotros" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-ink/10 bg-background/85 backdrop-blur">
      <Container className="flex h-16 items-center justify-between sm:h-20">
        <a href="#top" className="font-display text-xl tracking-tight sm:text-2xl">
          Muromío
        </a>

        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-ink-soft transition-colors hover:text-ink"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden md:block">
          <a
            href="#contacto"
            className="rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-background transition-colors hover:bg-clay"
          >
            Solicita acceso anticipado
          </a>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label="Abrir menú"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-ink/15 md:hidden"
        >
          <span className="sr-only">Menú</span>
          <div className="flex flex-col gap-1.5">
            <span className={`h-px w-4 bg-ink transition-transform ${open ? "translate-y-[3px] rotate-45" : ""}`} />
            <span className={`h-px w-4 bg-ink transition-opacity ${open ? "opacity-0" : ""}`} />
            <span className={`h-px w-4 bg-ink transition-transform ${open ? "-translate-y-[3px] -rotate-45" : ""}`} />
          </div>
        </button>
      </Container>

      {open && (
        <div className="border-t border-ink/10 bg-background md:hidden">
          <Container className="flex flex-col gap-1 py-4">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-2 py-2.5 text-sm text-ink-soft hover:bg-ink/5 hover:text-ink"
              >
                {link.label}
              </a>
            ))}
            <a
              href="#contacto"
              onClick={() => setOpen(false)}
              className="mt-2 rounded-full bg-ink px-5 py-2.5 text-center text-sm font-medium text-background"
            >
              Solicita acceso anticipado
            </a>
          </Container>
        </div>
      )}
    </header>
  );
}
