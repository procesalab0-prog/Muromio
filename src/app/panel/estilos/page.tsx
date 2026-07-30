import { createStyle } from "@/app/panel/actions";
import { WorkspaceHeader, WorkspaceShell } from "@/components/workspace-shell";
import { requireWorkspace } from "@/lib/workspace";

export default async function StylesPage() {
  const { supabase, profile } = await requireWorkspace();
  const { data: styles } = await supabase.from("style_library").select("*").eq("is_active", true).order("is_signature", { ascending: false });
  return (
    <WorkspaceShell section="/panel/estilos" userName={profile.full_name || profile.email || "Muromío"} role={profile.role} credits={profile.unlimited_credits ? null : profile.credit_balance}>
      <WorkspaceHeader eyebrow="Inteligencia propia" title="El ADN visual de Muromío." description="Materiales, atmósferas y reglas que hacen reconocible cada propuesta." />
      <section className="style-library">
        {(styles ?? []).map((style, index) => (
          <article className={`style-card style-tone-${index % 3}`} key={style.id}>
            <div className="style-palette">{(style.palette ?? []).map((color: string) => <i key={color} style={{ background: color }} title={color} />)}</div>
            <span>{style.is_signature ? "Firma Muromío" : "Biblioteca"}</span>
            <h2>{style.name}</h2>
            <p>{style.description}</p>
            <div className="material-list">{(style.materials ?? []).map((material: string) => <small key={material}>{material}</small>)}</div>
            <details><summary>Dirección de IA</summary><p>{style.prompt_template || "Sin instrucciones privadas todavía."}</p></details>
          </article>
        ))}
      </section>
      <section className="workspace-card style-create">
        <div className="workspace-card-head"><div><small>Lenguaje privado</small><h2>Crear un estilo propio</h2></div></div>
        <form action={createStyle} className="workspace-form">
          <div className="form-pair"><label>Nombre<input name="name" required placeholder="Casa de luz suave" /></label><label>Paleta HEX<input name="palette" placeholder="#E9DFD2, #9B7A61, #302A27" /></label></div>
          <label>Descripción<textarea name="description" rows={3} placeholder="Qué emoción produce y en qué proyectos funciona…" /></label>
          <label>Materiales separados por comas<input name="materials" placeholder="travertino, encino, lino, latón" /></label>
          <label>Instrucción privada para el motor<textarea name="prompt_template" rows={4} placeholder="Reglas visuales que nunca verá el cliente…" /></label>
          <label className="checkbox-label"><input name="is_signature" type="checkbox" /> Marcar como firma oficial de Muromío</label>
          <button className="button-primary" type="submit">Guardar lenguaje visual</button>
        </form>
      </section>
    </WorkspaceShell>
  );
}
