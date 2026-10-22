/**
 * Pós-produção (A3, item 12): grão monocromático (3 a 6%, semente fixa), vinheta suave, nitidez leve,
 * exportação em PNG e JPG qualidade 92. Determinística: a mesma tela gera sempre os mesmos bytes.
 */
import sharp, { type OverlayOptions } from "sharp";
import { aleatorio } from "./composicao/efeitos.js";

const ruidoCache = new Map<string, Buffer>();
async function ruido(w: number, h: number, semente: number): Promise<Buffer> {
  const k = `${w}x${h}:${semente}`;
  const c = ruidoCache.get(k);
  if (c) return c;
  const r = aleatorio(semente);
  const px = Buffer.alloc(w * h);
  for (let i = 0; i < px.length; i++) px[i] = Math.round(128 + (r() + r() + r() - 1.5) * 90);
  const png = await sharp(px, { raw: { width: w, height: h, channels: 1 } }).blur(0.4).png().toBuffer();
  ruidoCache.set(k, png);
  return png;
}

export type OpcoesPos = { grao: number; vinheta: number; nitidez: boolean; semente: number };

export async function posProduzir(png: Buffer, o: OpcoesPos): Promise<{ png: Buffer; jpg: Buffer }> {
  const { width: w, height: h } = await sharp(png).metadata();
  const camadas: OverlayOptions[] = [];
  if (o.vinheta > 0) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><defs><radialGradient id="v" cx="50%" cy="46%" r="75%"><stop offset="55%" stop-color="#000" stop-opacity="0"/><stop offset="100%" stop-color="#000" stop-opacity="${o.vinheta}"/></radialGradient></defs><rect width="100%" height="100%" fill="url(#v)"/></svg>`;
    camadas.push({ input: Buffer.from(svg), blend: "over" });
  }
  if (o.grao > 0) {
    const n = await ruido(w!, h!, o.semente);
    // grão em sobreposição: ruído cinza centrado em 50%, com opacidade o.grao
    const comAlfa = await sharp(n).ensureAlpha(o.grao).png().toBuffer();
    camadas.push({ input: comAlfa, blend: "overlay" });
  }
  let img = sharp(png).composite(camadas);
  if (o.nitidez) img = sharp(await img.png().toBuffer()).sharpen({ sigma: 0.6, m1: 0.6, m2: 1.2 });
  const final = await img.toColourspace("srgb").png({ compressionLevel: 9 }).toBuffer();
  const jpg = await sharp(final).jpeg({ quality: 92, mozjpeg: true, chromaSubsampling: "4:4:4" }).toBuffer();
  return { png: final, jpg };
}
