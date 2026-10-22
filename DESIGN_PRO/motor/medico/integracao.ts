/**
 * Integração do médico à cena (A3, item 7; D5): casamento de cor, luz de recorte e oclusão,
 * calculados por pixel com Sharp. A sombra de contato é composta na cena (composicao/camadas.ts).
 * Nunca altera rosto, corpo, idade ou tom de pele além da transferência limitada de cor (30 a 60%).
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { parseColor } from "../infra/contrast.js";
import { PASTAS } from "../infra/caminhos.js";
import { sha256 } from "../infra/fs.js";
import type { Integracao } from "../plano.js";

export type EstatCanal = { media: [number, number, number]; desvio: [number, number, number] };

/** Média e desvio por canal RGB dos pixels opacos (alfa > 50%) de uma imagem com alfa. */
export async function estatisticasOpacas(arquivo: string): Promise<EstatCanal> {
  const { data, info } = await sharp(arquivo).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const s: number[] = [0, 0, 0], q: number[] = [0, 0, 0];
  let n = 0;
  for (let i = 0; i < data.length; i += info.channels) {
    if (data[i + 3]! < 128) continue;
    n++;
    for (let k = 0; k < 3; k++) {
      s[k] = s[k]! + data[i + k]!;
      q[k] = q[k]! + data[i + k]! ** 2;
    }
  }
  const media = s.map((v) => v / Math.max(1, n)) as [number, number, number];
  const desvio = q.map((v, k) => Math.sqrt(Math.max(0, v / Math.max(1, n) - media[k]! ** 2))) as [number, number, number];
  return { media, desvio };
}

/** Estatísticas de uma região (a cena atrás do médico), em pixels do PNG renderizado. */
export async function estatisticasRegiao(png: Buffer | string, r: { x: number; y: number; w: number; h: number }): Promise<EstatCanal> {
  const meta = await sharp(png).metadata();
  const x = Math.max(0, Math.round(r.x)), y = Math.max(0, Math.round(r.y));
  const w = Math.min(meta.width! - x, Math.round(r.w)), h = Math.min(meta.height! - y, Math.round(r.h));
  const { data, info } = await sharp(png).extract({ left: x, top: y, width: w, height: h }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const s: number[] = [0, 0, 0], q: number[] = [0, 0, 0];
  const n = info.width * info.height;
  for (let i = 0; i < data.length; i += 3) for (let k = 0; k < 3; k++) {
    s[k] = s[k]! + data[i + k]!;
    q[k] = q[k]! + data[i + k]! ** 2;
  }
  const media = s.map((v) => v / n) as [number, number, number];
  return { media, desvio: q.map((v, k) => Math.sqrt(Math.max(0, v / n - media[k]! ** 2))) as [number, number, number] };
}

export type ResultadoIntegracao = { arquivo: string; antes: EstatCanal; depois: EstatCanal; parametros: Record<string, unknown> };

/**
 * Aplica a integração ao recorte e grava em cache/recortes/<hash>.integrado.png.
 * - casamento de cor: só o tom da cena (temperatura), com força `casamentoCor` e no máximo 18 níveis por canal; a luminância e a pele continuam naturais;
 * - luz de recorte: borda do alfa do lado da luz, desfocada (20 a 40 px), na cor principal, em modo tela;
 * - oclusão: escurecimento suave dos 22% inferiores do recorte.
 */
export async function integrar(recorte: string, cena: EstatCanal, principal: string, op: Integracao): Promise<ResultadoIntegracao> {
  const chave = sha256(JSON.stringify({ r: await fs.readFile(recorte).then((b) => sha256(b)), cena, principal, op, v: 2 }));
  const destino = path.join(PASTAS.cacheRecortes, `${chave}.integrado.png`);
  const antes = await estatisticasOpacas(recorte);
  const { data, info } = await sharp(recorte).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height, C = info.channels;
  const out = Buffer.from(data);
  const forca = Math.min(0.6, Math.max(0, op.casamentoCor));

  // 1. casamento de cor: transfere só o tom (desvio de cada canal em relação à luminância média), não a luminância;
  //    a luminância anda no máximo 10 níveis. Sobre fundo liso, transferir média e desvio inteiros lavaria a foto.
  const lumR = (antes.media[0] + antes.media[1] + antes.media[2]) / 3;
  const lumC = (cena.media[0] + cena.media[1] + cena.media[2]) / 3;
  const dLum = Math.max(-10, Math.min(10, (lumC - lumR) * 0.08));
  const delta = [0, 1, 2].map((k) => Math.max(-18, Math.min(18, forca * 0.6 * (cena.media[k]! - lumC - (antes.media[k]! - lumR)) + dLum)));
  for (let i = 0; i < out.length; i += C) {
    if (out[i + 3]! === 0) continue;
    for (let k = 0; k < 3; k++) out[i + k] = Math.max(0, Math.min(255, Math.round(out[i + k]! + delta[k]!)));
  }

  // 2. oclusão nas bordas inferiores
  const inicio = Math.round(H * 0.78);
  for (let y = inicio; y < H; y++) {
    const f = 1 - op.oclusao * ((y - inicio) / (H - inicio));
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * C;
      for (let k = 0; k < 3; k++) out[i + k] = Math.round(out[i + k]! * f);
    }
  }
  let img = sharp(out, { raw: { width: W, height: H, channels: C } }).png();

  // 3. luz de recorte: alfa menos o alfa deslocado para longe da luz = borda do lado da luz
  if (op.luzRecorte && op.luzRecorte.opacidade > 0) {
    const larg = Math.max(4, op.luzRecorte.largura);
    const desloc = Math.round(larg * 0.5) * (op.luzRecorte.lado === "esquerda" ? 1 : -1);
    const alfa = await sharp(recorte).ensureAlpha().extractChannel(3).raw().toBuffer();
    const borda = Buffer.alloc(W * H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const xs = x + desloc;
      const viz = xs >= 0 && xs < W ? alfa[y * W + xs]! : 0;
      borda[y * W + x] = Math.max(0, alfa[y * W + x]! - viz);
    }
    const bordaDesfocada = await sharp(borda, { raw: { width: W, height: H, channels: 1 } }).blur(larg / 3).raw().toBuffer();
    // mantém a luz só dentro do sujeito (não cria halo fora da silhueta)
    const p = parseColor(principal);
    const luz = Buffer.alloc(W * H * 4);
    for (let j = 0; j < W * H; j++) {
      const a = Math.min(255, Math.round(bordaDesfocada[j]! * op.luzRecorte.opacidade * (alfa[j]! / 255) * 1.6));
      luz[j * 4] = p.r;
      luz[j * 4 + 1] = p.g;
      luz[j * 4 + 2] = p.b;
      luz[j * 4 + 3] = a;
    }
    const base = await img.toBuffer();
    img = sharp(base).composite([{ input: await sharp(luz, { raw: { width: W, height: H, channels: 4 } }).png().toBuffer(), blend: "screen" }]).png();
  }
  await fs.mkdir(path.dirname(destino), { recursive: true });
  await img.toFile(destino);
  const depois = await estatisticasOpacas(destino);
  return { arquivo: destino, antes, depois, parametros: { ...op, forcaAplicada: forca, cena } };
}
