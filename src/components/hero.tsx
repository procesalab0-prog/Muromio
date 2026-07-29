import Image from "next/image";
import { makeTranslate, type Lang } from "@/lib/lang";

export function Hero({ lang }: { lang: Lang }) {
  const t = makeTranslate(lang);
  return (
    <header
      id="top"
      data-hero
      style={{
        position: "relative",
        minHeight: "100vh",
        display: "grid",
        gridTemplateColumns: "1.04fr .96fr",
        background: "#EFE7DC",
        overflow: "hidden",
      }}
    >
      <div
        data-herotext
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "120px clamp(24px,5vw,80px) 80px",
          position: "relative",
          zIndex: 2,
        }}
      >
        <div
          style={{
            fontSize: 12,
            letterSpacing: ".26em",
            textTransform: "uppercase",
            color: "#9E4B3D",
            marginBottom: 30,
            animation: "heroRise 1s .05s both",
          }}
        >
          {t("Interior Studio — León, Gto. México", "Interior Studio — León, Gto. México")}
        </div>
        <h1
          style={{
            margin: 0,
            fontFamily: "var(--font-space-grotesk)",
            fontWeight: 500,
            fontSize: "clamp(46px,7vw,108px)",
            lineHeight: 0.94,
            letterSpacing: "-.045em",
            color: "#262220",
          }}
        >
          <span style={{ display: "block", animation: "heroRise 1.05s .16s both" }}>
            {t("Espacios que", "Spaces made")}
          </span>
          <span style={{ display: "block", color: "#9E4B3D", animation: "heroRise 1.05s .28s both" }}>
            {t("se habitan", "to be lived")}
          </span>
          <span style={{ display: "block", animation: "heroRise 1.05s .4s both" }}>
            {t("con calma.", "slowly.")}
          </span>
        </h1>
        <p
          style={{
            maxWidth: 452,
            margin: "34px 0 0",
            fontSize: 17,
            lineHeight: 1.62,
            color: "#5A5049",
            animation: "heroRise 1.05s .54s both",
          }}
        >
          {t(
            "Estudio de interiorismo en León, Guanajuato. Damos forma a espacios cálidos, atemporales y profundamente habitables — del primer trazo al último detalle.",
            "Interior design studio in León, Guanajuato. We shape warm, timeless and deeply livable spaces — from the first sketch to the last detail.",
          )}
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 14, marginTop: 42, animation: "heroRise 1.05s .66s both" }}>
          <a
            href="#proyectos"
            style={{
              background: "#9E4B3D",
              color: "#F6F1E9",
              padding: "15px 30px",
              borderRadius: 2,
              fontSize: 12,
              letterSpacing: ".16em",
              textTransform: "uppercase",
            }}
          >
            {t("Ver proyectos", "View projects")}
          </a>
          <a
            href="/login?mode=register"
            style={{
              color: "#262220",
              padding: "15px 4px",
              fontSize: 12,
              letterSpacing: ".16em",
              textTransform: "uppercase",
              borderBottom: "1px solid rgba(38,34,32,.4)",
            }}
          >
            {t("Render Lab →", "Render Lab →")}
          </a>
        </div>
      </div>

      <div data-heroimg style={{ position: "relative", overflow: "hidden" }}>
        <div data-parallax="0.07" style={{ position: "absolute", inset: "-9% 0" }}>
          <Image
            src="/images/IMG_5467.jpeg"
            alt="Casa Serena — sala principal"
            fill
            priority
            sizes="(max-width: 900px) 100vw, 48vw"
            style={{ objectFit: "cover" }}
          />
        </div>
        <div
          style={{
            position: "absolute",
            left: 24,
            bottom: 24,
            color: "#F6F1E9",
            fontSize: 11,
            letterSpacing: ".2em",
            textTransform: "uppercase",
            mixBlendMode: "difference",
          }}
        >
          {t("Casa Serena · Residencia", "Casa Serena · Residence")}
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: "clamp(24px,5vw,80px)",
          bottom: 28,
          display: "flex",
          alignItems: "center",
          gap: 12,
          zIndex: 3,
          animation: "floatY 2.6s ease-in-out infinite",
        }}
      >
        <span style={{ width: 1, height: 34, background: "#9E4B3D" }} />
        <span style={{ fontSize: 11, letterSpacing: ".24em", textTransform: "uppercase", color: "#7E382D" }}>
          {t("Desliza", "Scroll")}
        </span>
      </div>
    </header>
  );
}
