import Image from "next/image";
import { makeTranslate, type Lang } from "@/lib/lang";

const CAPTIONS = [
  {
    es: "Sala principal — neutros en capas, acentos en arcilla y luz de la mañana.",
    en: "Living room — layered neutrals, clay accents and morning light.",
  },
  {
    es: "Doble altura — el espacio leído desde arriba, abierto y en calma.",
    en: "Double height — the space read from above, open and calm.",
  },
  {
    es: "Muro de arte — piezas por encargo que enmarcan la estancia.",
    en: "Art wall — commissioned pieces framing the seating area.",
  },
  {
    es: "Rincón íntimo — textura, calidez y un lugar para pausar.",
    en: "Intimate corner — texture, warmth and a place to pause.",
  },
];

const LAYER_IMAGES = ["/images/IMG_5467.jpeg", "/images/IMG_5466.jpeg", "/images/IMG_5465.jpeg", "/images/IMG_5464.jpeg"];

export function ProyectoDestacado({ lang }: { lang: Lang }) {
  const t = makeTranslate(lang);
  return (
    <section id="proyectos" data-crossfade style={{ position: "relative", height: "360vh", background: "#EFE7DC" }}>
      <div data-stickyinner style={{ position: "sticky", top: 0, height: "100vh", overflow: "hidden" }}>
        <div data-sticky style={{ display: "grid", gridTemplateColumns: "1fr 1fr", height: "100%" }}>
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 clamp(24px,5vw,84px)" }}>
            <div style={{ fontSize: 12, letterSpacing: ".26em", textTransform: "uppercase", color: "#9E4B3D", marginBottom: 24 }}>
              {t("Proyecto destacado — 01", "Featured project — 01")}
            </div>
            <h2
              style={{
                margin: "0 0 10px",
                fontFamily: "var(--font-space-grotesk)",
                fontWeight: 500,
                fontSize: "clamp(40px,5.4vw,78px)",
                lineHeight: 1,
                letterSpacing: "-.035em",
                color: "#262220",
              }}
            >
              Casa Serena
            </h2>
            <div style={{ fontSize: 13, letterSpacing: ".14em", textTransform: "uppercase", color: "#8C7E71", marginBottom: 40 }}>
              {t("Interiorismo integral · León, Gto.", "Full-home interior · León, Gto.")}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 400 }}>
              {CAPTIONS.map((cap, i) => (
                <div
                  key={cap.es}
                  data-cap
                  style={{ display: "flex", gap: 16, transition: "opacity .5s ease", opacity: i === 0 ? 1 : 0.32 }}
                >
                  <span style={{ fontFamily: "var(--font-space-grotesk)", color: "#9E4B3D", fontSize: 20, minWidth: 34 }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span style={{ fontSize: 16, lineHeight: 1.5, color: "#3A332E" }}>{t(cap.es, cap.en)}</span>
                </div>
              ))}
            </div>
          </div>

          <div data-imgwrap style={{ position: "relative", overflow: "hidden", background: "#262220" }}>
            {LAYER_IMAGES.map((src, i) => (
              <div
                key={src}
                data-layer
                style={{ position: "absolute", inset: 0, opacity: i === 0 ? 1 : 0, transition: "opacity .7s ease" }}
              >
                <Image src={src} alt="" fill sizes="(max-width: 900px) 100vw, 50vw" style={{ objectFit: "cover" }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
