/**
 * Prompt mestre (D2) com injeção da marca (D3) a partir de cenas/cenas.json e da ficha.
 * Prompts em inglês; nunca pedem texto, letras, números ou logos.
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { PASTAS } from "../infra/caminhos.js";
import type { Ficha } from "../ficha.js";
import type { PedidoImagem } from "../plano.js";

type Biblioteca = { cenas: Record<string, { prompt: string }>; variaveis: { LUZ: Record<string, string> } };
let cache: Biblioteca | null = null;
export async function biblioteca(): Promise<Biblioteca> {
  cache ??= JSON.parse(await fs.readFile(path.join(PASTAS.cenas, "cenas.json"), "utf8"));
  return cache!;
}

const CLIMA: Record<string, string> = {
  premium: "premium", sóbrio: "sober", sobrio: "sober", masculino: "masculine", feminino: "feminine", editorial: "editorial", acolhedor: "welcoming",
  clínica: "clinical", clinica: "clinical", moderna: "modern", moderno: "modern", luxuoso: "luxurious", calmo: "calm", científico: "scientific", cientifico: "scientific", sofisticado: "sophisticated", elegante: "elegant", nude: "nude tones",
};
export const climaEmIngles = (s: string) => s.toLowerCase().split(/[\s,]+/).filter(Boolean).map((w) => CLIMA[w] ?? w).join(", ") + ", high end healthcare campaign aesthetic";

export const RESTRICOES = "no text, no letters, no numbers, no logos, no watermark";

export async function montarPrompt(pi: PedidoImagem, f: Ficha, extras: { corCampanha?: string; ladoLuz?: string } = {}): Promise<string> {
  const b = await biblioteca();
  const base = b.cenas[pi.cena]?.prompt ?? b.cenas.CENA_TEMA!.prompt;
  const c = f.cores;
  const paleta = `color palette strictly limited to ${c.fundoEscuro}, ${c.principal}, ${c.apoio} and ${f.estilo.temperatura === "quente" ? "warm" : f.estilo.temperatura === "fria" ? "cool" : "neutral"} neutrals`;
  const luz = (b.variaveis.LUZ[f.estilo.luz] ?? b.variaveis.LUZ.suave!) + (extras.ladoLuz ? `, key light from the ${extras.ladoLuz === "esquerda" ? "upper left" : extras.ladoLuz === "direita" ? "upper right" : "front"}` : "");
  let p = base
    .replaceAll("{PALETA}", paleta)
    .replaceAll("{LUZ}", luz)
    .replaceAll("{CLIMA}", climaEmIngles(f.estilo.clima || "premium"))
    .replaceAll("{COMPOSICAO}", pi.composicao ?? "subject on the right third, large clean negative space on the left half and top third for typography")
    .replaceAll("{ASSUNTO}", pi.assunto ?? "an elegant still life related to hair health")
    .replaceAll("{CORCAMPANHA}", extras.corCampanha ?? c.principal);
  if (!/no text/i.test(p)) p += `, ${RESTRICOES}`;
  p += `, fine film grain, subtle haze, high dynamic range, aspect ratio ${pi.proporcao}`;
  if (pi.fundoTransparente) p += ", isolated on a transparent background";
  return p;
}
