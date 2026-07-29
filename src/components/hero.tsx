import Image from "next/image";
import { makeTranslate, type Lang } from "@/lib/lang";

export function Hero({ lang }: { lang: Lang }) {
  const t = makeTranslate(lang);
  return (
    <header id="top" data-hero style={{ position: "relative", minHeight: "100vh", overflow: "hidden", background: "#211C19" }}>
      <div data-heroimg style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
        <Image
          src="/images/IMG_5479.jpg"
          alt="Interior diseñado por Muromío"
          fill
          priority
          sizes="100vw"
          style={{ objectFit: "cover", animation: "kenLoop 20s ease-in-out infinite alternate" }}
        />
      </div>
      <div style={{ position: "absolute", inset: 0, zIndex: 1, background: "linear-gradient(180deg,rgba(20,16,14,.62) 0%,rgba(20,16,14,.14) 30%,rgba(20,16,14,.14) 55%,rgba(20,16,14,.66) 100%)" }} />
      <div data-hero-inner style={{ position: "relative", zIndex: 3, minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 clamp(24px,5vw,80px)" }}>
        <div style={{ marginBottom: 22, color: "#E7C4B8", fontSize: 12, letterSpacing: ".28em", textTransform: "uppercase", animation: "heroRise 1s .1s both" }}>
          {t("Estudio de interiorismo — León, Gto.", "Interior design studio — León, Gto.")}
        </div>
        <h1 data-hero-name style={{ margin: 0, color: "#F4ECE0", fontFamily: "var(--font-cormorant)", fontWeight: 600, fontSize: "clamp(74px,15vw,250px)", lineHeight: .86, letterSpacing: "-.02em", animation: "nameUp 1.3s .2s cubic-bezier(.16,.84,.24,1) both" }}>
          Muromío
        </h1>
      </div>
      <div data-hero-tr style={{ position: "absolute", right: "clamp(24px,5vw,80px)", bottom: "clamp(40px,9vh,90px)", zIndex: 3, maxWidth: 340, textAlign: "right", animation: "heroRise 1.1s .5s both" }}>
        <p style={{ margin: "0 0 20px", color: "#EFE3D8", fontSize: 16, lineHeight: 1.6 }}>
          {t(
            "Interiorismo con intención — espacios cálidos y atemporales que se sienten en calma, funcionales y profundamente tuyos.",
            "A thoughtful approach to interior design — warm, timeless spaces that feel calm, functional and uniquely yours.",
          )}
        </p>
        <a href="#contacto" style={{ display: "inline-block", padding: "15px 28px", borderRadius: 40, background: "#F4ECE0", color: "#262220", fontSize: 11.5, letterSpacing: ".16em", textTransform: "uppercase" }}>
          {t("Diseñemos juntos →", "Let's design together →")}
        </a>
      </div>
      <div style={{ position: "absolute", left: "clamp(24px,5vw,80px)", bottom: 30, zIndex: 3, display: "flex", alignItems: "center", gap: 12, animation: "floatY 2.6s ease-in-out infinite" }}>
        <span style={{ width: 1, height: 34, background: "#E7C4B8" }} />
        <span style={{ color: "#E7C4B8", fontSize: 11, letterSpacing: ".24em", textTransform: "uppercase" }}>{t("Desliza", "Scroll")}</span>
      </div>
    </header>
  );
}
