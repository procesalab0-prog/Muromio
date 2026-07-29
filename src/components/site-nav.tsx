import { makeTranslate, type Lang } from "@/lib/lang";
import { NAV_LINKS } from "./nav-data";

export function SiteNav({ lang, onToggleLang }: { lang: Lang; onToggleLang: () => void }) {
  const t = makeTranslate(lang);
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
        style={{ display: "flex", alignItems: "baseline", textDecoration: "none", fontSize: 27, lineHeight: 1, letterSpacing: "-.02em" }}
      >
        <span style={{ fontFamily: "var(--font-lora)", fontWeight: 600, color: "#262220" }}>muro</span>
        <span style={{ fontFamily: "var(--font-jost)", fontWeight: 300, color: "#262220" }}>mío</span>
      </a>

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
      </div>
    </nav>
  );
}
