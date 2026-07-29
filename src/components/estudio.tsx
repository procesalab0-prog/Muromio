import Image from "next/image";
import { makeTranslate, type Lang } from "@/lib/lang";

export function Estudio({ lang }: { lang: Lang }) {
  const t = makeTranslate(lang);
  const stats = [
    ["40+", t("proyectos de interiorismo entregados.", "delivered interior projects.")],
    ["10", t("años dando forma a espacios cálidos y habitables.", "years shaping warm, livable spaces.")],
    ["100%", t("a medida de cada cliente y cada sitio.", "tailored to each client and site.")],
  ];
  return (
    <section id="estudio" style={{ padding: "clamp(90px,15vh,180px) clamp(24px,6vw,120px)", background: "#F6F1E9" }}>
      <div data-reveal style={{ marginBottom: 44, color: "#9E4B3D", fontSize: 12, letterSpacing: ".26em", textTransform: "uppercase" }}>
        {t("(01) — El estudio", "(01) — The studio")}
      </div>
      <p
        data-statement
        data-es="Un espacio bien diseñado no se mira. Se habita, se respira, y se recuerda."
        data-en="A well-designed space is not looked at. It is lived, it is breathed, and it is remembered."
        style={{ maxWidth: 1060, margin: 0, fontFamily: "var(--font-cormorant)", fontWeight: 600, fontSize: "clamp(30px,4.8vw,68px)", lineHeight: 1.12, letterSpacing: "-.01em" }}
      >
        {t("Un espacio bien diseñado no se mira. Se habita, se respira, y se recuerda.", "A well-designed space is not looked at. It is lived, it is breathed, and it is remembered.")}
      </p>
      <div data-two style={{ display: "grid", gridTemplateColumns: ".9fr 1.1fr", gap: "clamp(30px,5vw,80px)", marginTop: "clamp(56px,9vh,110px)", alignItems: "center" }}>
        <div data-projimg data-img-reveal style={{ position: "relative", overflow: "hidden", height: "clamp(360px,52vh,560px)" }}>
          <Image src="/images/IMG_5498.jpeg" alt="Detalle de interior Muromío" fill sizes="(max-width:900px) 100vw,45vw" style={{ objectFit: "cover" }} />
        </div>
        <div>
          <h2 data-reveal style={{ margin: "0 0 22px", fontFamily: "var(--font-cormorant)", fontWeight: 600, fontSize: "clamp(30px,3.4vw,50px)", lineHeight: 1.02 }}>
            {t("Muromío, de León a tu espacio.", "Muromío, from León to your space.")}
          </h2>
          <p data-reveal data-delay="90" style={{ margin: "0 0 22px", color: "#4A423C", fontSize: 17, lineHeight: 1.7 }}>
            {t("Somos un estudio de interiorismo con base en León, Guanajuato. Trabajamos espacios residenciales y comerciales, guiados por materiales nobles, luz cálida y un lenguaje sereno y atemporal.", "We are an interior design studio based in León, Guanajuato. We work on residential and commercial spaces, guided by natural materials, warm light and a quiet, timeless language.")}
          </p>
          <div data-statsgrid style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, marginTop: 34, border: "1px solid rgba(38,34,32,.12)", background: "rgba(38,34,32,.12)" }}>
            {stats.map(([number, text]) => (
              <div key={number} data-reveal style={{ padding: "26px 24px", background: "#F6F1E9" }}>
                <div style={{ color: "#9E4B3D", fontFamily: "var(--font-cormorant)", fontWeight: 600, fontSize: "clamp(40px,4vw,58px)", lineHeight: 1 }}>{number}</div>
                <div style={{ marginTop: 8, color: "#5A5049", fontSize: 14, lineHeight: 1.45 }}>{text}</div>
              </div>
            ))}
            <div data-reveal style={{ display: "flex", alignItems: "center", padding: "26px 24px", background: "#262220", color: "#E7DED2", fontSize: 15, lineHeight: 1.5 }}>
              {t("El diseño no es solo lo que ves — es cómo se siente el espacio cada día.", "Design isn't just what you see — it's how a space feels every day.")}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
