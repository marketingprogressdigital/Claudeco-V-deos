/** Contraste WCAG 2.x. Aceita #rrggbb, rgb() e rgba() (alfa é composto sobre o fundo). */
export type RGB = { r: number; g: number; b: number; a: number };

export function parseColor(input: string): RGB {
  const s = input.trim();
  const h = /^#([0-9a-f]{6})$/i.exec(s);
  if (h) {
    const n = parseInt(h[1]!, 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255, a: 1 };
  }
  const m = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:\s*[,/]\s*([\d.]+%?))?\s*\)$/i.exec(s);
  if (m) {
    const alpha = m[4] === undefined ? 1 : m[4].endsWith("%") ? parseFloat(m[4]) / 100 : parseFloat(m[4]);
    return { r: +m[1]!, g: +m[2]!, b: +m[3]!, a: alpha };
  }
  throw new Error(`Cor não reconhecida: ${input}`);
}

export function composite(fg: RGB, bg: RGB): RGB {
  const a = fg.a;
  return { r: fg.r * a + bg.r * (1 - a), g: fg.g * a + bg.g * (1 - a), b: fg.b * a + bg.b * (1 - a), a: 1 };
}

function channel(c: number): number {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
}

export function luminance(c: RGB): number {
  return 0.2126 * channel(c.r) + 0.7152 * channel(c.g) + 0.0722 * channel(c.b);
}

export function contrastRatio(fg: string | RGB, bg: string | RGB): number {
  const b = typeof bg === "string" ? parseColor(bg) : bg;
  const f0 = typeof fg === "string" ? parseColor(fg) : fg;
  const f = f0.a < 1 ? composite(f0, b) : f0;
  const [l1, l2] = [luminance(f), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (l1 + 0.05) / (l2 + 0.05);
}

/** Texto grande pela WCAG: >= 24px, ou >= 18.66px em negrito (peso >= 700). */
export function isLargeText(fontSizePx: number, fontWeight: number): boolean {
  return fontSizePx >= 24 || (fontSizePx >= 18.66 && fontWeight >= 700);
}

export function requiredRatio(fontSizePx: number, fontWeight: number): number {
  return isLargeText(fontSizePx, fontWeight) ? 3 : 4.5;
}
