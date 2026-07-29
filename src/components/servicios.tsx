import { makeTranslate, type Lang } from "@/lib/lang";

const SERVICES = [
  {
    es: { title: "Interiorismo residencial", body: "Del concepto al último detalle: distribución, materiales, mobiliario y luz." },
    en: { title: "Residential interiors", body: "From concept to the last detail: layout, materials, furniture and light." },
  },
  {
    es: { title: "Interiorismo comercial", body: "Oficinas, hospitalidad y retail que se ven impecables y funcionan mejor." },
    en: { title: "Commercial interiors", body: "Offices, hospitality and retail that look impeccable and work better." },
  },
  {
    es: { title: "Visualización 3D", body: "Renders fotorrealistas para ver y sentir el espacio antes de construirlo." },
    en: { title: "3D visualization", body: "Photoreal renders to see and feel the space before it is built." },
  },
  {
    es: { title: "Mobiliario a medida", body: "Piezas diseñadas para el espacio, hechas con artesanos locales." },
    en: { title: "Custom furniture", body: "Pieces designed for the space, made with local craftspeople." },
  },
];

export function Servicios({ lang }: { lang: Lang }) {
  const t = makeTranslate(lang);
  return (
    <section id="servicios" style={{ padding: "clamp(96px,15vh,190px) clamp(24px,6vw,120px)", background: "#EFE7DC" }}>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between", gap: 24, marginBottom: "clamp(50px,8vh,90px)" }}>
        <div>
          <div data-reveal style={{ fontSize: 12, letterSpacing: ".26em", textTransform: "uppercase", color: "#9E4B3D", marginBottom: 18 }}>
            {t("(03) — Servicios", "(03) — Services")}
          </div>
          <h2
            data-reveal
            data-delay="80"
            style={{
              margin: 0,
              fontFamily: "var(--font-space-grotesk)",
              fontWeight: 500,
              fontSize: "clamp(36px,5vw,72px)",
              lineHeight: 1,
              letterSpacing: "-.035em",
              color: "#262220",
            }}
          >
            {t("Lo que hacemos", "What we do")}
          </h2>
        </div>
        <p data-reveal data-delay="140" style={{ maxWidth: 340, margin: 0, fontSize: 16, lineHeight: 1.6, color: "#5A5049" }}>
          {t(
            "Una práctica integral — un mismo equipo desde la idea hasta el espacio terminado y habitable.",
            "An integrated practice — one team from the idea to the finished, livable space.",
          )}
        </p>
      </div>

      <div data-svcgrid style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, background: "rgba(38,34,32,.1)", border: "1px solid rgba(38,34,32,.1)" }}>
        {SERVICES.map((service, i) => (
          <div
            key={service.es.title}
            data-reveal
            data-delay={i % 2 === 1 ? "90" : undefined}
            style={{ background: "#F6F1E9", padding: "clamp(34px,4vw,56px)", minHeight: 230, display: "flex", flexDirection: "column", justifyContent: "space-between" }}
          >
            <span style={{ fontFamily: "var(--font-space-grotesk)", color: "#9E4B3D", fontSize: 26 }}>
              {String(i + 1).padStart(2, "0")}
            </span>
            <div>
              <h3
                style={{
                  margin: "0 0 12px",
                  fontFamily: "var(--font-space-grotesk)",
                  fontWeight: 500,
                  fontSize: "clamp(24px,2.6vw,34px)",
                  color: "#262220",
                }}
              >
                {t(service.es.title, service.en.title)}
              </h3>
              <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6, color: "#5A5049" }}>{t(service.es.body, service.en.body)}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
