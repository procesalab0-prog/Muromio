import { makeTranslate, type Lang } from "@/lib/lang";

export function Estudio({ lang }: { lang: Lang }) {
  const t = makeTranslate(lang);
  return (
    <section
      id="estudio"
      style={{ padding: "clamp(96px,15vh,190px) clamp(24px,6vw,120px)", background: "#F6F1E9" }}
    >
      <div
        data-reveal
        style={{ fontSize: 12, letterSpacing: ".26em", textTransform: "uppercase", color: "#9E4B3D", marginBottom: 46 }}
      >
        {t("(01) — El estudio", "(01) — The studio")}
      </div>

      <p
        data-statement
        data-es="Un espacio bien diseñado no se mira. Se habita, se respira, y se recuerda."
        data-en="A well-designed space is not looked at. It is lived, it is breathed, and it is remembered."
        style={{
          maxWidth: 1040,
          margin: 0,
          fontFamily: "var(--font-space-grotesk)",
          fontWeight: 500,
          fontSize: "clamp(30px,4.6vw,66px)",
          lineHeight: 1.16,
          letterSpacing: "-.035em",
          color: "#262220",
        }}
      />

      <div
        data-two
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "clamp(30px,5vw,90px)",
          marginTop: "clamp(60px,9vh,120px)",
          alignItems: "start",
        }}
      >
        <p data-reveal style={{ margin: 0, fontSize: 17, lineHeight: 1.7, color: "#4A423C" }}>
          {t(
            "Muromío es un estudio de interiorismo con base en León, Guanajuato. Trabajamos espacios residenciales, corporativos y de hospitalidad, guiados por materiales nobles, luz cálida y un lenguaje sereno y atemporal.",
            "Muromío is an interior design studio based in León, Guanajuato. We work on residential, corporate and hospitality spaces, guided by natural materials, warm light and a quiet, timeless language.",
          )}
        </p>
        <p data-reveal data-delay="120" style={{ margin: 0, fontSize: 17, lineHeight: 1.7, color: "#4A423C" }}>
          {t(
            "Cada proyecto empieza como una conversación y termina siendo un lugar. Acompañamos a cada cliente desde el concepto y la visualización hasta el espacio construido — y todo lo que hay en medio.",
            "Every project begins as a conversation and becomes a place. We accompany each client from concept and visualization to the built space — and everything in between.",
          )}
        </p>
      </div>
    </section>
  );
}
