"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { WorkspaceTour } from "./workspace-tour";

const navigation = [
  {
    label: "General",
    items: [
      { href: "/panel", label: "Vista general", icon: "◱" },
      { href: "/panel/actividad", label: "Actividad", icon: "◷" },
    ],
  },
  {
    label: "Trabajo",
    items: [
      { href: "/panel/proyectos", label: "Proyectos", icon: "▧" },
    ],
  },
  {
    label: "Inteligencia",
    items: [
      { href: "/panel/nuevo-render", label: "Render Lab", icon: "✦", accent: true },
      { href: "/panel/estilos", label: "Estilos", icon: "❖" },
      { href: "", label: "Videos", icon: "▷", soon: true },
    ],
  },
  {
    label: "Negocio",
    items: [
      { href: "/panel/finanzas", label: "Presupuestos", icon: "$" },
      { href: "/panel/clientes", label: "Clientes", icon: "◌" },
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
    ? [...roleNavigation, { label: "Sistema", items: [{ href: "/panel/solicitudes", label: "Administración", icon: "⚙" }] }]
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
                  <i>{item.icon}</i><b>{item.label}</b><em>Pronto</em>
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
                  <i>{item.icon}</i><b>{item.label}</b>
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
