import Link from "next/link";
import type { ReactNode } from "react";

const navigation = [
  { href: "/panel", label: "Vista general", mark: "01" },
  { href: "/panel/proyectos", label: "Proyectos", mark: "02" },
  { href: "/panel/clientes", label: "Clientes", mark: "03" },
  { href: "/panel/estilos", label: "Estilos Muromío", mark: "04" },
  { href: "/panel/finanzas", label: "Presupuestos", mark: "05" },
  { href: "/panel/actividad", label: "Actividad", mark: "06" },
];

export function WorkspaceShell({
  children,
  section,
  userName,
  role,
}: {
  children: ReactNode;
  section: string;
  userName: string;
  role: string;
}) {
  return (
    <div className="workspace">
      <aside className="workspace-sidebar">
        <Link href="/" className="workspace-brand">
          <span>muro</span>mío
        </Link>
        <div className="workspace-suite">
          <span>Studio OS</span>
          <small>El despacho, en un solo lugar.</small>
        </div>
        <nav className="workspace-nav" aria-label="Navegación del despacho">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={section === item.href ? "is-active" : ""}
            >
              <small>{item.mark}</small>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="workspace-sidebar-footer">
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
      <main className="workspace-main">{children}</main>
    </div>
  );
}

export function WorkspaceHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="workspace-header">
      <div>
        <p>{eyebrow}</p>
        <h1>{title}</h1>
        {description ? <span>{description}</span> : null}
      </div>
      {actions ? <div className="workspace-header-actions">{actions}</div> : null}
    </header>
  );
}
