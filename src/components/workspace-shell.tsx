import type { ReactNode } from "react";
import { WorkspaceChrome } from "@/components/workspace-chrome";

export function WorkspaceShell({
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
  return (
    <WorkspaceChrome section={section} userName={userName} role={role} credits={credits}>{children}</WorkspaceChrome>
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
