"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { WorkspaceTour } from "./workspace-tour";

const navigation = [
  {
    label: "General",
    items: [
      { href: "/panel", label: "Vista general", icon: "home" },
      { href: "/panel/actividad", label: "Actividad", icon: "activity" },
    ],
  },
  {
    label: "Trabajo",
    items: [
      { href: "/panel/proyectos", label: "Proyectos", icon: "projects" },
    ],
  },
  {
    label: "Inteligencia",
    items: [
      { href: "/panel/nuevo-render", label: "Render Lab", icon: "sparkles", accent: true },
      { href: "/panel/estilos", label: "Estilos", icon: "styles" },
      { href: "", label: "Videos", icon: "video", soon: true },
    ],
  },
  {
    label: "Negocio",
    items: [
      { href: "/panel/finanzas", label: "Presupuestos", icon: "money" },
      { href: "/panel/clientes", label: "Clientes", icon: "users" },
    ],
  },
];

const sectionTitles: Record<string, [string, string]> = {
  "/panel": ["Muromío Studio OS", "Vista general"],
  "/panel/actividad": ["General", "Actividad"],
  "/panel/proyectos": ["Trabajo", "Proyectos"],
  "/panel/nuevo-render": ["Inteligencia", "Render Lab"],
  "/panel/estilos": ["Inteligencia", "Biblioteca de estilos"],
  "/panel/finanzas": ["Negocio", "Presupuestos y cobranza"],
  "/panel/clientes": ["Negocio", "Clientes"],
  "/panel/solicitudes": ["Sistema", "Administración"],
};

export function WorkspaceChrome({
  children,
  section,
  userName,
  role,
  credits,
}: {
  children: ReactNode;
  section: string;
  userName: string;
  role: string;
  credits?: number | null;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [crumb, title] = sectionTitles[section] ?? ["Muromío Studio OS", "Proyecto"];
  const roleNavigation = role === "client"
    ? navigation
        .filter((group) => ["General", "Trabajo"].includes(group.label))
        .map((group) => ({ ...group, items: group.items.filter((item) => item.href !== "/panel/actividad") }))
    : navigation;
  const groups = role === "admin"
    ? [...roleNavigation, { label: "Sistema", items: [{ href: "/panel/solicitudes", label: "Administración", icon: "settings" }] }]
    : roleNavigation;

  return (
    <div className={`workspace workspace-os ${collapsed ? "is-collapsed" : ""}`}>
      <aside className={`workspace-sidebar os-sidebar ${mobileOpen ? "is-open" : ""}`}>
        <div className="os-brand-row">
          <Link href="/" className="workspace-brand os-brand">
            <span className="os-brand-full">Muromío <small>OS</small></span>
            <span className="os-brand-mark" aria-hidden="true">M</span>
          </Link>
          <button className="os-collapse" onClick={() => setCollapsed((value) => !value)} aria-label={collapsed ? "Expandir menú" : "Colapsar menú"} aria-expanded={!collapsed}>
            {collapsed ? "›" : "‹"}
          </button>
          <button className="os-mobile-close" onClick={() => setMobileOpen(false)} aria-label="Cerrar menú">×</button>
        </div>
        <nav className="workspace-nav os-nav" aria-label="Navegación del despacho" data-tour="navigation">
          {groups.map((group) => (
            <div className="os-nav-group" key={group.label}>
              <small className="os-nav-label">{group.label}</small>
              {group.items.map((item) => item.soon ? (
                <span className="os-nav-item is-disabled" key={item.label}>
                  <i><NavIcon name={item.icon} /></i><b>{item.label}</b><em>Pronto</em>
                </span>
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`os-nav-item ${section === item.href ? "is-active" : ""} ${item.accent ? "is-accent" : ""}`}
                  onClick={() => setMobileOpen(false)}
                  data-tour={item.href === "/panel/nuevo-render" ? "render-lab" : item.href === "/panel/proyectos" ? "projects" : item.href === "/panel/finanzas" ? "finances" : undefined}
                  title={collapsed ? item.label : undefined}
                >
                  <i><NavIcon name={item.icon} /></i><b>{item.label}</b>
                </Link>
              ))}
            </div>
          ))}
        </nav>
        <div className="workspace-sidebar-footer os-profile">
          <span className="workspace-avatar">{userName.slice(0, 1).toUpperCase()}</span>
          <div>
            <strong>{userName}</strong>
            <small>{role === "admin" ? "Administrador" : role === "client" ? "Cliente" : "Staff Muromío"}</small>
          </div>
          <form action="/auth/signout" method="post">
            <button type="submit" aria-label="Cerrar sesión">↗</button>
          </form>
          <button type="button" className="os-tour-launch" aria-label="Ver tutorial" title="Ver tutorial" onClick={() => window.dispatchEvent(new Event("muromio:tour"))}>?</button>
        </div>
      </aside>
      <button className={`os-scrim ${mobileOpen ? "is-visible" : ""}`} aria-label="Cerrar menú" onClick={() => setMobileOpen(false)} />
      <div className="os-stage">
        <header className="os-topbar">
          <button className="os-menu" onClick={() => setMobileOpen(true)} aria-label="Abrir menú" aria-expanded={mobileOpen}>☰</button>
          <div className="os-title">
            <small>{crumb}</small>
            <strong>{title}</strong>
          </div>
          <form className="os-search" action="/panel/proyectos" data-tour="search">
            <span>⌕</span>
            <input name="q" placeholder="Buscar proyectos…" aria-label="Buscar proyectos" />
          </form>
          <div className="os-top-actions">
            {credits !== undefined ? <span className="os-credits" data-tour="credits"><i>✦</i>{credits === null ? "∞" : Number(credits).toLocaleString("es-MX")} <small>créditos</small></span> : null}
            {role !== "client" ? <Link href="/panel/nuevo-render" className="os-new-render">+ Nuevo render</Link> : null}
          </div>
        </header>
        <main className="workspace-main os-content">{children}</main>
      </div>
      <WorkspaceTour />
    </div>
  );
}

function NavIcon({ name }: { name: string }) {
  const common = { fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const paths: Record<string, ReactNode> = {
    home: <><path d="M3 10.5 12 3l9 7.5" /><path d="M5.5 9v11h13V9M9 20v-6h6v6" /></>,
    activity: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3.5 2" /></>,
    projects: <><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 9h18M8 4v5" /></>,
    sparkles: <><path d="m12 2 1.2 4.1L17 8l-3.8 1.9L12 14l-1.2-4.1L7 8l3.8-1.9L12 2Z" /><path d="m5 14 .8 2.2L8 17l-2.2.8L5 20l-.8-2.2L2 17l2.2-.8L5 14Zm14-2 .7 1.8 1.8.7-1.8.7L19 17l-.7-1.8-1.8-.7 1.8-.7L19 12Z" /></>,
    styles: <><circle cx="12" cy="12" r="9" /><circle cx="9" cy="9" r="1" /><circle cx="15" cy="8" r="1" /><circle cx="16" cy="14" r="1" /><path d="M12 21c-1.5-2 .3-3.6 2-3.4" /></>,
    video: <><rect x="3" y="6" width="13" height="12" rx="2" /><path d="m16 10 5-3v10l-5-3" /></>,
    money: <><circle cx="12" cy="12" r="9" /><path d="M15.5 8.5c-.8-.8-2-1.2-3.5-1.2-1.9 0-3.2.9-3.2 2.3 0 3.5 6.4 1.5 6.4 4.9 0 1.4-1.3 2.3-3.3 2.3-1.5 0-2.9-.5-3.8-1.4M12 5.5v13" /></>,
    users: <><circle cx="9" cy="9" r="3" /><path d="M3.5 20c.5-3.2 2.4-5 5.5-5s5 1.8 5.5 5M16 7.2a3 3 0 0 1 0 5.6M17 15c2.1.4 3.3 2 3.5 4.5" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="M19 13.5v-3l-2-.7a7.7 7.7 0 0 0-.7-1.7l.9-1.9-2.1-2.1-1.9.9a7.7 7.7 0 0 0-1.7-.7L10.5 2h-3l-.7 2a7.7 7.7 0 0 0-1.7.7l-1.9-.9-2.1 2.1.9 1.9a7.7 7.7 0 0 0-.7 1.7L0 10.5v3l2 .7c.2.6.4 1.2.7 1.7l-.9 1.9 2.1 2.1 1.9-.9c.5.3 1.1.5 1.7.7l.7 2h3l.7-2c.6-.2 1.2-.4 1.7-.7l1.9.9 2.1-2.1-.9-1.9c.3-.5.5-1.1.7-1.7l2-.7Z" transform="translate(2.5 .5) scale(.8)" /></>,
  };
  return <svg viewBox="0 0 24 24" aria-hidden="true" {...common}>{paths[name]}</svg>;
}
