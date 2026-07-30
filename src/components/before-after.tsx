"use client";

import { useState } from "react";

export function BeforeAfter({
  before,
  after,
  beforeLabel = "Antes",
  afterLabel = "Después",
}: {
  before: string;
  after: string;
  beforeLabel?: string;
  afterLabel?: string;
}) {
  const [position, setPosition] = useState(50);
  return (
    <div className="before-after">
      {/* Signed URLs are dynamic and should not pass through Next Image optimization. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={before} alt={beforeLabel} />
      <div className="before-after-top" style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={after} alt={afterLabel} />
      </div>
      <span className="before-after-line" style={{ left: `${position}%` }} />
      <label><span>{beforeLabel}</span><span>{afterLabel}</span><input aria-label="Comparar antes y después" type="range" min="0" max="100" value={position} onChange={(event) => setPosition(Number(event.target.value))} /></label>
    </div>
  );
}
