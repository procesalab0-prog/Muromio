const TEXT = "Interiorismo · Residencial · Render 3D · Mobiliario · Consultoría · Interiorismo · Comercial · Render 3D · Mobiliario · Consultoría · ";

export function Marquee() {
  return (
    <div style={{ overflow: "hidden", background: "#9E4B3D", padding: "22px 0" }}>
      <div style={{ display: "flex", gap: 56, width: "max-content", animation: "marquee 30s linear infinite" }}>
        <span style={{ fontFamily: "var(--font-cormorant)", fontStyle: "italic", fontSize: "clamp(30px,3vw,48px)", color: "#EFE7DC", whiteSpace: "nowrap" }}>
          {TEXT}
        </span>
        <span
          aria-hidden="true"
          style={{ fontFamily: "var(--font-cormorant)", fontStyle: "italic", fontSize: "clamp(30px,3vw,48px)", color: "#EFE7DC", whiteSpace: "nowrap" }}
        >
          {TEXT}
        </span>
      </div>
    </div>
  );
}
