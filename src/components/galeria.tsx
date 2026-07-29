import Image from "next/image";
import { makeTranslate, type Lang } from "@/lib/lang";

const FIGURES = [
  { src: "/images/IMG_5461.jpeg", width: 1320, height: 1209, es: "Terraza · estar", en: "Terrace lounge" },
  { src: "/images/IMG_5459.jpeg", width: 1320, height: 1199, es: "Cocina exterior", en: "Outdoor kitchen" },
  { src: "/images/IMG_5460.jpeg", width: 1320, height: 1164, es: "Comedor al aire libre", en: "Outdoor dining" },
  { src: "/images/IMG_5463.jpeg", width: 1320, height: 743, es: "Sala de juntas", en: "Meeting room" },
  { src: "/images/IMG_5462.jpeg", width: 1320, height: 770, es: "Sala de consejo", en: "Boardroom" },
  { src: "/images/IMG_5458.jpeg", width: 1320, height: 727, es: "Lounge & bar", en: "Lounge & bar" },
];

const TRIO = [
  { src: "/images/exterior-lounge.jpeg", width: 1320, height: 939 },
  { src: "/images/exterior-comedor.jpeg", width: 1320, height: 956 },
  { src: "/images/exterior-cocina.jpeg", width: 1320, height: 1074 },
];

export function Galeria({ lang }: { lang: Lang }) {
  const t = makeTranslate(lang);
  return (
    <section data-hscroll style={{ position: "relative", height: "320vh", background: "#262220" }}>
      <div style={{ position: "sticky", top: 0, height: "100vh", overflow: "hidden", display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <div style={{ padding: "0 clamp(24px,5vw,80px) 34px", display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 20 }}>
          <div>
            <div style={{ fontSize: 12, letterSpacing: ".26em", textTransform: "uppercase", color: "#C98E7F", marginBottom: 14 }}>
              {t("Trabajo seleccionado — 02", "Selected work — 02")}
            </div>
            <h2
              style={{
                margin: 0,
                fontFamily: "var(--font-space-grotesk)",
                fontWeight: 500,
                fontSize: "clamp(34px,4.6vw,64px)",
                lineHeight: 1,
                color: "#F1E8DC",
              }}
            >
              {t("Exterior & corporativo", "Exterior & corporate")}
            </h2>
          </div>
          <div style={{ fontSize: 12, letterSpacing: ".16em", textTransform: "uppercase", color: "#8E8278", whiteSpace: "nowrap" }}>
            {t("Desliza →", "Scroll →")}
          </div>
        </div>

        <div data-htrack style={{ display: "flex", gap: 22, padding: "0 clamp(24px,5vw,80px)", width: "max-content", willChange: "transform" }}>
          {FIGURES.map((fig) => (
            <figure key={fig.src} style={{ position: "relative", height: "62vh", flex: "0 0 auto", margin: 0, overflow: "hidden" }}>
              <Image
                src={fig.src}
                alt=""
                width={fig.width}
                height={fig.height}
                style={{ height: "100%", width: "auto", objectFit: "cover", borderRadius: 2 }}
              />
              <figcaption
                style={{ position: "absolute", left: 16, bottom: 14, color: "#F1E8DC", fontSize: 11, letterSpacing: ".18em", textTransform: "uppercase" }}
              >
                {t(fig.es, fig.en)}
              </figcaption>
            </figure>
          ))}

          <figure
            style={{ position: "relative", height: "62vh", flex: "0 0 auto", margin: 0, overflow: "hidden", display: "flex", borderRadius: 2 }}
          >
            {TRIO.map((img) => (
              <Image
                key={img.src}
                src={img.src}
                alt=""
                width={img.width}
                height={img.height}
                style={{ height: "100%", width: "auto", objectFit: "cover", display: "block" }}
              />
            ))}
            <figcaption
              style={{ position: "absolute", left: 16, bottom: 14, color: "#F1E8DC", fontSize: 11, letterSpacing: ".18em", textTransform: "uppercase" }}
            >
              {t("Casa privada · interior", "Private residence · interior")}
            </figcaption>
          </figure>
        </div>
      </div>
    </section>
  );
}
