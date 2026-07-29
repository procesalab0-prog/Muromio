"use client";

import { useState, type FormEvent } from "react";
import { Container } from "./container";

export function ContactCta() {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }

  return (
    <section id="contacto" className="border-t border-ink/10 py-20 sm:py-28">
      <Container className="grid gap-12 lg:grid-cols-2 lg:gap-20">
        <div>
          <h2 className="font-display text-3xl tracking-tight sm:text-4xl">
            ¿Listo para ver tu proyecto renderizado?
          </h2>
          <p className="mt-4 max-w-md text-ink-soft">
            Cuéntanos sobre tu estudio o proyecto y te avisaremos en cuanto abramos
            acceso a la plataforma de renders con IA.
          </p>
          <p className="mt-6 text-sm text-ink-soft">
            También puedes escribirnos directamente a{" "}
            <a href="mailto:hola@muromio.com" className="text-ink underline underline-offset-4">
              hola@muromio.com
            </a>
          </p>
        </div>

        {submitted ? (
          <div className="flex items-center rounded-2xl bg-ink/5 p-8">
            <p className="font-display text-xl">
              Gracias — recibimos tu solicitud y te contactaremos pronto.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="text-sm font-medium">
                Nombre
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className="mt-2 w-full rounded-lg border border-ink/15 bg-background px-4 py-3 text-sm outline-none focus:border-clay"
                placeholder="Tu nombre"
              />
            </div>
            <div>
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="mt-2 w-full rounded-lg border border-ink/15 bg-background px-4 py-3 text-sm outline-none focus:border-clay"
                placeholder="tu@email.com"
              />
            </div>
            <div>
              <label htmlFor="message" className="text-sm font-medium">
                Cuéntanos sobre tu proyecto
              </label>
              <textarea
                id="message"
                name="message"
                rows={3}
                className="mt-2 w-full resize-none rounded-lg border border-ink/15 bg-background px-4 py-3 text-sm outline-none focus:border-clay"
                placeholder="Tipo de proyecto, estilo, plazos…"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-full bg-ink px-6 py-3.5 text-sm font-medium text-background transition-colors hover:bg-clay"
            >
              Solicitar acceso anticipado
            </button>
          </form>
        )}
      </Container>
    </section>
  );
}
