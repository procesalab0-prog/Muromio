"use client";

import Image from "next/image";
import { useState, type TouchEvent } from "react";
import { makeTranslate, type Lang } from "@/lib/lang";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/os-icons";

const projects = [
  { name: "Casa ER", esType: "Acabados y decoración · Residencial", enType: "Finishes & styling · Residential", es: "Intervención de acabados y decoración. Disfrutamos el desarrollo de este proyecto en compañía del cliente.", en: "A finishes and styling intervention developed closely alongside the client.", images: ["IMG_5478.jpg", "IMG_5479.jpg"] },
  { name: "Casa FJ", esType: "Luz, arte y materiales · Residencial", enType: "Light, art & materials · Residential", es: "Un hogar construido alrededor de la luz, el arte y los materiales nobles — cálido, en capas y sereno.", en: "A home built around light, art and honest materials — warm, layered and calm.", images: ["IMG_5481.jpeg", "IMG_5482.jpeg", "IMG_5483.jpeg", "IMG_5484.jpeg"] },
  { name: "Casa JF", esType: "Naturaleza y calidez · Residencial", enType: "Nature & warmth · Residential", es: "Espacios que se inspiran en la naturaleza y contagian calidez mediante sus materiales.", en: "Spaces inspired by nature that pass on warmth through their materials.", images: ["IMG_5486.jpeg", "IMG_5487.jpeg", "IMG_5488.jpeg", "IMG_5489.jpeg", "IMG_5490.jpeg"] },
  { name: "Casa AH", esType: "Contraste y carácter · Residencial", enType: "Contrast & character · Residential", es: "Contraste, calidez y carácter — madera, mármol y una iluminación en capas.", en: "Contrast, warmth and character — wood, marble and layered lighting.", images: ["IMG_5492.jpeg", "IMG_5493-28e4384c.jpeg", "IMG_5494-41a4b051.jpeg"] },
  { name: "Proyecto HF", esType: "Remodelación de villas · con @ivoarquitectos", enType: "Villa remodel · with @ivoarquitectos", es: "Remodelación de villas — acabados, mobiliario y decoración. Una colaboración con @ivoarquitectos.", en: "Villa remodel — finishes, furniture and styling. A collaboration with @ivoarquitectos.", images: ["IMG_5496.jpeg", "IMG_5497.jpeg", "IMG_5498.jpeg"] },
  { name: "Casa de Campo", esType: "Remodelación · Exterior", enType: "Country home remodel · Outdoor", es: "Calidez y carácter en cada detalle — una remodelación de casa de campo que se vive al aire libre.", en: "Warmth and character in every detail — a country-home remodel that lives outdoors.", images: ["IMG_5505.jpeg", "IMG_5506.jpeg", "IMG_5507.jpeg"] },
  { name: "Bar RR", esType: "Remodelación music bar · Comercial", enType: "Music bar remodel · Commercial", es: "Un music bar con carácter — madera cálida, piano de cola e iluminación en capas.", en: "A music bar with character — warm wood, a grand piano and layered light.", images: ["IMG_5501.jpeg", "IMG_5502.jpeg"] },
];

function ProjectCarousel({ project, index, lang }: { project: (typeof projects)[number]; index: number; lang: Lang }) {
  const [active, setActive] = useState(0);
  const [touchStart, setTouchStart] = useState<[number, number] | null>(null);
  const change = (direction: number) => setActive((current) => (current + direction + project.images.length) % project.images.length);
  const onTouchEnd = (event: TouchEvent) => {
    if (!touchStart) return;
    const dx = event.changedTouches[0].clientX - touchStart[0];
    const dy = event.changedTouches[0].clientY - touchStart[1];
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) change(dx < 0 ? 1 : -1);
    setTouchStart(null);
  };
  const image = (
    <div
      data-projimg
      data-img-reveal
      onTouchStart={(event) => setTouchStart([event.touches[0].clientX, event.touches[0].clientY])}
      onTouchEnd={onTouchEnd}
      style={{ position: "relative", overflow: "hidden", minHeight: "clamp(420px,72vh,760px)", background: "#211C19", touchAction: "pan-y", order: index % 2 ? 2 : 1 }}
    >
      {project.images.map((src, imageIndex) => (
        <Image
          key={src}
          src={`/images/${src}`}
          alt={`${project.name} — ${imageIndex + 1}`}
          fill
          sizes="(max-width:900px) 100vw,58vw"
          style={{ objectFit: "cover", opacity: imageIndex === active ? 1 : 0, transition: "opacity .7s ease", animation: imageIndex === active ? "kenburns 9s ease-out forwards" : "none" }}
        />
      ))}
      <button onClick={() => change(-1)} aria-label="Anterior" style={arrowStyle}><ChevronLeftIcon width={16} height={16} /></button>
      <button onClick={() => change(1)} aria-label="Siguiente" style={{ ...arrowStyle, left: 72 }}><ChevronRightIcon width={16} height={16} /></button>
      <div style={{ position: "absolute", right: 20, bottom: 28, color: "#F6F1E9", fontSize: 12, letterSpacing: ".18em" }}>
        {String(active + 1).padStart(2, "0")} / {String(project.images.length).padStart(2, "0")}
      </div>
    </div>
  );
  const info = (
    <div data-projinfo data-reveal style={{ display: "flex", flexDirection: "column", justifyContent: "center", padding: "clamp(36px,4vw,64px)", order: index % 2 ? 1 : 2 }}>
      <div style={{ marginBottom: 14, color: "#9E4B3D", fontFamily: "var(--font-cormorant)", fontStyle: "italic", fontSize: 22 }}>{String(index + 1).padStart(2, "0")}</div>
      <h3 style={{ margin: "0 0 10px", fontFamily: "var(--font-cormorant)", fontWeight: 600, fontSize: "clamp(34px,4vw,58px)", lineHeight: 1 }}>{project.name}</h3>
      <div style={{ marginBottom: 26, color: "#8C7E71", fontSize: 12, letterSpacing: ".16em", textTransform: "uppercase" }}>{lang === "es" ? project.esType : project.enType}</div>
      <p style={{ margin: 0, color: "#4A423C", fontSize: 16, lineHeight: 1.7 }}>{lang === "es" ? project.es : project.en}</p>
    </div>
  );
  return <article data-proj style={{ display: "grid", gridTemplateColumns: index % 2 ? "1fr 1.35fr" : "1.35fr 1fr", alignItems: "stretch", background: "#F6F1E9" }}>{image}{info}</article>;
}

export function SelectedProjects({ lang }: { lang: Lang }) {
  const t = makeTranslate(lang);
  return (
    <section id="proyectos" style={{ padding: "clamp(90px,14vh,170px) 0 clamp(50px,8vh,90px)", background: "#EFE7DC" }}>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between", gap: 24, marginBottom: "clamp(46px,7vh,80px)", padding: "0 clamp(24px,6vw,120px)" }}>
        <div>
          <div data-reveal style={{ marginBottom: 18, color: "#9E4B3D", fontSize: 12, letterSpacing: ".26em", textTransform: "uppercase" }}>{t("(02) — Proyectos seleccionados", "(02) — Selected projects")}</div>
          <h2 data-reveal data-delay="80" style={{ margin: 0, fontFamily: "var(--font-cormorant)", fontWeight: 600, fontSize: "clamp(38px,5.4vw,80px)", lineHeight: .98 }}>{t("Trabajo reciente", "Recent work")}</h2>
        </div>
        <p data-reveal data-delay="140" style={{ maxWidth: 330, margin: 0, color: "#5A5049", fontSize: 15, lineHeight: 1.6 }}>{t("Una selección de espacios residenciales y comerciales. Desliza cada proyecto para ver más.", "A selection of residential and commercial spaces. Swipe each project to see more.")}</p>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "clamp(56px,10vh,120px)" }}>
        {projects.map((project, index) => <ProjectCarousel key={project.name} project={project} index={index} lang={lang} />)}
      </div>
    </section>
  );
}

const arrowStyle = {
  position: "absolute", left: 18, bottom: 18, zIndex: 2, display: "flex", alignItems: "center", justifyContent: "center", width: 46, height: 46, borderRadius: "50%", border: "1px solid rgba(246,241,233,.5)", background: "rgba(33,28,25,.4)", color: "#F6F1E9", cursor: "pointer", backdropFilter: "blur(4px)",
} as const;
