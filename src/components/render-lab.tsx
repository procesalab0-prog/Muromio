import Image from "next/image";
import { makeTranslate, type Lang } from "@/lib/lang";
import { HoverLink } from "./hover-link";

export function RenderLab({ lang }: { lang: Lang }) {
  const t = makeTranslate(lang);
  return (
    <section id="render" style={{ position: "relative", background: "#262220", color: "#EFE7DC", overflow: "hidden" }}>
      <div data-two style={{ display: "grid", gridTemplateColumns: "1fr 1fr", alignItems: "stretch" }}>
        <div style={{ padding: "clamp(80px,12vh,150px) clamp(24px,5vw,84px)", display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div data-reveal style={{ fontSize: 12, letterSpacing: ".26em", textTransform: "uppercase", color: "#C98E7F", marginBottom: 26 }}>
            Muromío Render Lab
          </div>
          <h2
            data-reveal
            data-delay="80"
            style={{
              margin: "0 0 24px",
              fontFamily: "var(--font-cormorant)",
              fontWeight: 600,
              fontSize: "clamp(38px,5vw,72px)",
              lineHeight: 1.02,
              letterSpacing: "-.01em",
              color: "#F1E8DC",
            }}
          >
            {t("Del render a la realidad.", "From render to reality.")}
          </h2>
          <p data-reveal data-delay="150" style={{ maxWidth: 460, margin: "0 0 36px", fontSize: 17, lineHeight: 1.66, color: "#C6BAAD" }}>
            {t(
              "Nuestro laboratorio de visualización, potenciado por IA. Sube un espacio y genera renders fotorrealistas con el lenguaje material del estudio — un puente más rápido entre la idea y el espacio construido.",
              "Our visualization lab, powered by AI. Upload a space and generate photoreal renders in the studio's own material language — a faster bridge between the idea and the built room.",
            )}
          </p>
          <div data-reveal data-delay="210">
            <HoverLink
              href="/login?mode=register"
              base={{ display: "inline-block", background: "#EFE7DC", color: "#262220", padding: "16px 32px", borderRadius: 40, fontSize: 12, letterSpacing: ".16em", textTransform: "uppercase" }}
              hover={{ background: "#9E4B3D", color: "#F6F1E9" }}
            >
              {t("Solicitar acceso →", "Request access →")}
            </HoverLink>
          </div>
        </div>

        <div data-imgwrap style={{ position: "relative", overflow: "hidden", minHeight: "60vh" }}>
          <div data-parallax="0.05" style={{ position: "absolute", inset: "-8% 0" }}>
            <Image src="/images/IMG_5488.jpeg" alt="" fill sizes="(max-width: 900px) 100vw, 50vw" style={{ objectFit: "cover" }} />
          </div>
        </div>
      </div>
    </section>
  );
}
