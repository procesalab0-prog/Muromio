import { useState } from "react";
import { makeTranslate, type Lang } from "@/lib/lang";
import { NAV_LINKS } from "./nav-data";

export function SiteNav({
  lang,
  version,
  onToggleLang,
}: {
  lang: Lang;
  version: string;
  onToggleLang: () => void;
}) {
  const t = makeTranslate(lang);
  const [, setLogoTouches] = useState(0);
  const [showEasterEgg, setShowEasterEgg] = useState(false);

  function handleLogoTouch() {
    setLogoTouches((touches) => {
      const next = touches + 1;
      if (next >= 6) {
        setShowEasterEgg(true);
        return 0;
      }
      return next;
    });
  }

  return (
    <nav
      data-nav
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 60,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "20px clamp(20px,5vw,64px)",
        borderBottom: "1px solid transparent",
        transition: "background .5s ease,border-color .5s ease,padding .5s ease,backdrop-filter .5s ease",
      }}
    >
      <a
        href="#top"
        aria-label="Muromío"
        onClick={handleLogoTouch}
        style={{ display: "flex", alignItems: "baseline", textDecoration: "none", fontSize: 27, lineHeight: 1, letterSpacing: "-.02em" }}
      >
        <span style={{ fontFamily: "var(--font-lora)", fontWeight: 600, color: "#262220" }}>muro</span>
        <span style={{ fontFamily: "var(--font-jost)", fontWeight: 300, color: "#262220" }}>mío</span>
      </a>

      {showEasterEgg ? (
        <aside
          role="status"
          style={{
            position: "absolute",
            top: "calc(100% + 10px)",
            left: "clamp(20px,5vw,64px)",
            width: "min(290px,calc(100vw - 40px))",
            padding: "18px 44px 18px 20px",
            background: "#262220",
            color: "#EFE7DC",
            border: "1px solid rgba(239,231,220,.16)",
            boxShadow: "0 18px 50px rgba(38,34,32,.2)",
          }}
        >
          <button
            type="button"
            aria-label="Cerrar"
            onClick={() => setShowEasterEgg(false)}
            style={{ position: "absolute", top: 8, right: 10, border: 0, background: "transparent", color: "#EFE7DC", cursor: "pointer", fontSize: 20 }}
          >
            ×
          </button>
          <p style={{ margin: "0 0 6px", color: "#C98E7F", fontSize: 10, letterSpacing: ".18em", textTransform: "uppercase" }}>
            Versión {version}
          </p>
          <p style={{ margin: 0, fontSize: 14 }}>
            Creado por{" "}
            <a
              href="https://procesalab0-prog.github.io/ProcesaLabWeb/#top"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#EFE7DC", textDecoration: "underline", textUnderlineOffset: 4 }}
            >
              ProcesaLab
            </a>
          </p>
        </aside>
      ) : null}

      <div data-navlinks style={{ display: "flex", alignItems: "center", gap: "clamp(18px,2.6vw,40px)" }}>
        {NAV_LINKS.map((link) => (
          <a
            key={link.href}
            href={link.href}
            style={{
              fontSize: 12,
              letterSpacing: ".2em",
              textTransform: "uppercase",
              color: link.accent ? "#9E4B3D" : "#3A332E",
            }}
          >
            {t(link.es, link.en)}
          </a>
        ))}
        <button
          type="button"
          data-langtoggle
          onClick={onToggleLang}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            background: "none",
            border: "1px solid rgba(38,34,32,.22)",
            borderRadius: 40,
            padding: "6px 12px",
            cursor: "pointer",
            fontFamily: "inherit",
            fontSize: 11,
            letterSpacing: ".14em",
            color: "#3A332E",
          }}
        >
          <span style={{ opacity: lang === "es" ? 1 : 0.4 }}>ES</span>
          <span style={{ opacity: 0.4 }}>/</span>
          <span style={{ opacity: lang === "en" ? 1 : 0.4 }}>EN</span>
        </button>
        <a
          href="/login"
          data-login
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: 34,
            padding: "6px 14px",
            border: "1px solid rgba(38,34,32,.35)",
            borderRadius: 40,
            fontSize: 11,
            letterSpacing: ".14em",
            textTransform: "uppercase",
            color: "#262220",
            textDecoration: "none",
          }}
        >
          {t("Iniciar sesión", "Sign in")}
        </a>
      </div>
    </nav>
  );
}
