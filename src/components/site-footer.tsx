import { makeTranslate, type Lang } from "@/lib/lang";

const FOOTER_NAV = [
  { href: "#estudio", es: "Estudio", en: "Studio" },
  { href: "#proyectos", es: "Proyectos", en: "Projects" },
  { href: "#servicios", es: "Servicios", en: "Services" },
  { href: "/login?mode=register", label: "Render Lab" },
];

export function SiteFooter({ lang }: { lang: Lang }) {
  const t = makeTranslate(lang);
  return (
    <footer style={{ background: "#221E1B", color: "#B3A79B", padding: "clamp(60px,8vh,90px) clamp(24px,6vw,120px) 40px" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.4fr 1fr 1fr",
          gap: 40,
          alignItems: "start",
          paddingBottom: 56,
          borderBottom: "1px solid rgba(179,167,155,.16)",
        }}
      >
        <div>
          <a href="#top" aria-label="Muromío" style={{ display: "inline-flex", alignItems: "baseline", textDecoration: "none", fontSize: 32, lineHeight: 1, letterSpacing: "-.02em", marginBottom: 20 }}>
            <span style={{ fontFamily: "var(--font-lora)", fontWeight: 600, color: "#EFE7DC" }}>muro</span>
            <span style={{ fontFamily: "var(--font-jost)", fontWeight: 300, color: "#EFE7DC" }}>mío</span>
          </a>
          <p style={{ margin: 0, maxWidth: 300, fontSize: 15, lineHeight: 1.6, color: "#8E837A" }}>
            {t("Estudio de interiorismo. León, Guanajuato — México.", "Interior design studio. León, Guanajuato — México.")}
          </p>
        </div>

        <div>
          <div style={{ fontSize: 11, letterSpacing: ".2em", textTransform: "uppercase", color: "#6E645C", marginBottom: 18 }}>
            {t("Navegar", "Navigate")}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {FOOTER_NAV.map((link) => (
              <a key={link.href} href={link.href} style={{ color: "#B3A79B", fontSize: 15 }}>
                {"label" in link ? link.label : t(link.es, link.en)}
              </a>
            ))}
          </div>
        </div>

        <div>
          <div style={{ fontSize: 11, letterSpacing: ".2em", textTransform: "uppercase", color: "#6E645C", marginBottom: 18 }}>
            {t("Contacto", "Contact")}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <a href="mailto:hola@muromio.mx" style={{ color: "#B3A79B", fontSize: 15 }}>
              hola@muromio.mx
            </a>
            <a href="https://www.instagram.com/bymuromio?igsh=azU5ejNqeTd6Z2sx" target="_blank" rel="noopener" style={{ color: "#B3A79B", fontSize: 15 }}>
              @bymuromio
            </a>
            <span style={{ color: "#8E837A", fontSize: 15 }}>León, Gto. · MX</span>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "space-between", paddingTop: 26, fontSize: 12, letterSpacing: ".08em", color: "#6E645C" }}>
        <span>© 2026 Muromío — Interior Studio.</span>
        <span>{t("Diseñado en León, Guanajuato.", "Designed in León, Guanajuato.")}</span>
      </div>
    </footer>
  );
}
