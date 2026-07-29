import { makeTranslate, type Lang } from "@/lib/lang";
import { HoverLink } from "./hover-link";

export function Contacto({ lang }: { lang: Lang }) {
  const t = makeTranslate(lang);
  return (
    <section id="contacto" style={{ background: "#9E4B3D", color: "#F6F1E9", padding: "clamp(100px,16vh,200px) clamp(24px,6vw,120px)", textAlign: "center" }}>
      <div data-reveal style={{ fontSize: 12, letterSpacing: ".26em", textTransform: "uppercase", color: "#F0CFC5", marginBottom: 30 }}>
        {t("(04) — Conversemos", "(04) — Let's talk")}
      </div>
      <h2
        data-reveal
        data-delay="80"
        style={{
          margin: "0 auto",
          maxWidth: 900,
          fontFamily: "var(--font-cormorant)",
          fontWeight: 600,
          fontSize: "clamp(44px,7vw,112px)",
          lineHeight: 1,
          letterSpacing: "-.015em",
          color: "#F6F1E9",
        }}
      >
        {t("Diseñemos tu espacio.", "Let's design your space.")}
      </h2>
      <p data-reveal data-delay="150" style={{ maxWidth: 520, margin: "32px auto 46px", fontSize: 17, lineHeight: 1.6, color: "#F2DAD3" }}>
        {t(
          "Cuéntanos sobre tu proyecto — casa, oficina o un lugar para reunirse. Respondemos en menos de 48 horas.",
          "Tell us about your project — home, office or a place to gather. We reply within 48 hours.",
        )}
      </p>
      <div data-reveal data-delay="210" style={{ display: "flex", flexWrap: "wrap", gap: 16, justifyContent: "center" }}>
        <HoverLink
          href="mailto:hola@muromio.mx"
          base={{ background: "#F6F1E9", color: "#262220", padding: "17px 36px", borderRadius: 40, fontSize: 13, letterSpacing: ".14em", textTransform: "uppercase" }}
          hover={{ background: "#262220", color: "#F6F1E9" }}
        >
          hola@muromio.mx
        </HoverLink>
        <HoverLink
          href="https://instagram.com/bymuromio"
          target="_blank"
          rel="noopener"
          base={{ color: "#F6F1E9", padding: "17px 8px", fontSize: 13, letterSpacing: ".14em", textTransform: "uppercase", borderBottom: "1px solid rgba(246,241,233,.5)" }}
          hover={{ borderBottom: "1px solid #F6F1E9" }}
        >
          @bymuromio →
        </HoverLink>
      </div>
    </section>
  );
}
