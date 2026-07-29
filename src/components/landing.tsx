"use client";

import { useEffect, useRef, useState } from "react";
import type { Lang } from "@/lib/lang";
import { SiteNav } from "./site-nav";
import { Hero } from "./hero";
import { Estudio } from "./estudio";
import { ProyectoDestacado } from "./proyecto-destacado";
import { Galeria } from "./galeria";
import { Servicios } from "./servicios";
import { Marquee } from "./marquee";
import { RenderLab } from "./render-lab";
import { Contacto } from "./contacto";
import { SiteFooter } from "./site-footer";

export function Landing() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [lang, setLang] = useState<Lang>("es");

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const reveals = Array.from(root.querySelectorAll<HTMLElement>("[data-reveal]"));
    let io: IntersectionObserver | undefined;
    if (!reduce) {
      reveals.forEach((el) => {
        const d = el.getAttribute("data-reveal");
        el.style.opacity = "0";
        el.style.transform = d === "left" ? "translateX(-44px)" : d === "right" ? "translateX(44px)" : "translateY(52px)";
        el.style.transition = "opacity 1s cubic-bezier(.16,.84,.24,1), transform 1.15s cubic-bezier(.16,.84,.24,1)";
        el.style.transitionDelay = `${el.getAttribute("data-delay") || "0"}ms`;
        el.style.willChange = "opacity, transform";
      });
      io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const target = entry.target as HTMLElement;
              target.style.opacity = "1";
              target.style.transform = "none";
              io?.unobserve(target);
            }
          });
        },
        { threshold: 0.12, rootMargin: "0px 0px -6% 0px" },
      );
      reveals.forEach((el) => io!.observe(el));
    }

    const nav = root.querySelector<HTMLElement>("[data-nav]");
    const parallax = Array.from(root.querySelectorAll<HTMLElement>("[data-parallax]"));
    const hWrap = root.querySelector<HTMLElement>("[data-hscroll]");
    const hTrack = root.querySelector<HTMLElement>("[data-htrack]");
    const cf = root.querySelector<HTMLElement>("[data-crossfade]");
    const layers = cf ? Array.from(cf.querySelectorAll<HTMLElement>("[data-layer]")) : [];
    const caps = cf ? Array.from(cf.querySelectorAll<HTMLElement>("[data-cap]")) : [];

    let ticking = false;
    const onScroll = () => {
      ticking = false;
      const y = window.scrollY || window.pageYOffset;
      const vh = window.innerHeight;
      const vw = window.innerWidth;

      if (nav) {
        const scrolled = y > 60;
        nav.style.background = scrolled ? "rgba(239,231,220,0.82)" : "transparent";
        nav.style.setProperty("backdrop-filter", scrolled ? "blur(16px)" : "none");
        nav.style.setProperty("-webkit-backdrop-filter", scrolled ? "blur(16px)" : "none");
        nav.style.borderBottomColor = scrolled ? "rgba(38,34,32,0.08)" : "transparent";
        nav.style.paddingTop = scrolled ? "13px" : "20px";
        nav.style.paddingBottom = scrolled ? "13px" : "20px";
      }

      if (!reduce) {
        parallax.forEach((el) => {
          const r = el.getBoundingClientRect();
          const c = r.top + r.height / 2 - vh / 2;
          const sp = parseFloat(el.getAttribute("data-parallax") || "0.08");
          el.style.transform = `translate3d(0,${(-c * sp).toFixed(1)}px,0)`;
        });
      }

      if (hWrap && hTrack) {
        const r = hWrap.getBoundingClientRect();
        const total = hWrap.offsetHeight - vh;
        let p = total > 0 ? -r.top / total : 0;
        p = Math.max(0, Math.min(1, p));
        const max = Math.max(0, hTrack.scrollWidth - vw);
        hTrack.style.transform = `translate3d(${(-(p * max)).toFixed(1)}px,0,0)`;
      }

      if (cf && layers.length) {
        const r = cf.getBoundingClientRect();
        const total = cf.offsetHeight - vh;
        let p = total > 0 ? -r.top / total : 0;
        p = Math.max(0, Math.min(0.9999, p));
        const idx = Math.min(layers.length - 1, Math.floor(p * layers.length));
        layers.forEach((l, i) => (l.style.opacity = i === idx ? "1" : "0"));
        caps.forEach((c, i) => (c.style.opacity = i === idx ? "1" : "0.32"));
      }
    };

    const requestTick = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(onScroll);
      }
    };
    window.addEventListener("scroll", requestTick, { passive: true });
    window.addEventListener("resize", requestTick);
    onScroll();

    return () => {
      window.removeEventListener("scroll", requestTick);
      window.removeEventListener("resize", requestTick);
      io?.disconnect();
    };
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const stmtEl = root.querySelector<HTMLElement>("[data-statement]");
    if (!stmtEl) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const txt = stmtEl.getAttribute(`data-${lang}`) || stmtEl.getAttribute("data-es") || "";
    stmtEl.textContent = "";
    const words = txt
      .split(/\s+/)
      .filter(Boolean)
      .map((word) => {
        const span = document.createElement("span");
        span.textContent = `${word} `;
        span.style.transition = "opacity .45s ease";
        span.style.opacity = reduce ? "1" : "0.16";
        stmtEl.appendChild(span);
        return span;
      });

    if (reduce || !words.length) return;

    let ticking = false;
    const onScroll = () => {
      ticking = false;
      const r = stmtEl.getBoundingClientRect();
      const vh = window.innerHeight;
      let p = (vh * 0.82 - r.top) / (vh * 0.5);
      p = Math.max(0, Math.min(1, p));
      const n = Math.ceil(p * words.length);
      words.forEach((w, i) => (w.style.opacity = i < n ? "1" : "0.16"));
    };
    const requestTick = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(onScroll);
      }
    };
    window.addEventListener("scroll", requestTick, { passive: true });
    window.addEventListener("resize", requestTick);
    onScroll();

    return () => {
      window.removeEventListener("scroll", requestTick);
      window.removeEventListener("resize", requestTick);
    };
  }, [lang]);

  return (
    <div ref={rootRef} style={{ position: "relative" }}>
      <SiteNav lang={lang} onToggleLang={() => setLang((l) => (l === "es" ? "en" : "es"))} />
      <Hero lang={lang} />
      <Estudio lang={lang} />
      <ProyectoDestacado lang={lang} />
      <Galeria lang={lang} />
      <Servicios lang={lang} />
      <Marquee />
      <RenderLab lang={lang} />
      <Contacto lang={lang} />
      <SiteFooter lang={lang} />
    </div>
  );
}
