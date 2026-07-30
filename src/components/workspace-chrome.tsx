"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";

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
      { href: "/panel/estilos", label: "Biblioteca de estilos", icon: "❖" },
      { href: "", label: "Videos", icon: "▷", soon: true },
    ],
  },
  {
    label: "Negocio",
    items: [
      { href: "/panel/finanzas", label: "Presupuestos", icon: "₵" },
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
  const groups = role === "admin"
    ? [...navigation, { label: "Sistema", items: [{ href: "/panel/solicitudes", label: "Administración", icon: "⚙" }] }]
    : navigation;

  return (
    <div className={`workspace workspace-os ${collapsed ? "is-collapsed" : ""}`}>
      <aside className={`workspace-sidebar os-sidebar ${mobileOpen ? "is-open" : ""}`}>
        <div className="os-brand-row">
          <Link href="/" className="workspace-brand os-brand">
            <span>muro</span>mío
          </Link>
          <button className="os-collapse" onClick={() => setCollapsed((value) => !value)} aria-label="Colapsar menú">
            {collapsed ? "›" : "‹"}
          </button>
        </div>
        <nav className="workspace-nav os-nav" aria-label="Navegación del despacho">
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
            <small>{role === "admin" ? "Dirección" : "Equipo Muromío"}</small>
          </div>
          <form action="/auth/signout" method="post">
            <button type="submit" aria-label="Cerrar sesión">↗</button>
          </form>
        </div>
      </aside>
      <button className={`os-scrim ${mobileOpen ? "is-visible" : ""}`} aria-label="Cerrar menú" onClick={() => setMobileOpen(false)} />
      <div className="os-stage">
        <header className="os-topbar">
          <button className="os-menu" onClick={() => setMobileOpen(true)} aria-label="Abrir menú">☰</button>
          <div className="os-title">
            <small>{crumb}</small>
            <strong>{title}</strong>
          </div>
          <form className="os-search" action="/panel/proyectos">
            <span>⌕</span>
            <input name="q" placeholder="Buscar proyectos…" aria-label="Buscar proyectos" />
          </form>
          <div className="os-top-actions">
            {credits !== undefined ? <span className="os-credits"><i>✦</i>{credits === null ? "∞" : Number(credits).toLocaleString("es-MX")} <small>créditos</small></span> : null}
            <Link href="/panel/nuevo-render" className="os-new-render">+ Nuevo render</Link>
          </div>
        </header>
        <main className="workspace-main os-content">{children}</main>
      </div>
    </div>
  );
}
