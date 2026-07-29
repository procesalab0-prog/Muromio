"use client";

import { useState, type AnchorHTMLAttributes, type CSSProperties } from "react";

export function HoverLink({
  base,
  hover,
  style,
  ...rest
}: AnchorHTMLAttributes<HTMLAnchorElement> & { base: CSSProperties; hover: CSSProperties }) {
  const [hovered, setHovered] = useState(false);
  return (
    <a
      {...rest}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ ...base, ...(hovered ? hover : null), ...style }}
    />
  );
}
