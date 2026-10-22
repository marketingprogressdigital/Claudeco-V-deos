/**
 * Checagens automáticas (E1). Bloqueiam a entrega. O contraste é medido NO PNG (E1.3 e E1.4):
 * compara a tela com texto e a mesma tela sem texto, isola os pixels das letras e mede a cor real
 * delas contra o fundo real logo abaixo (10º percentil entre os pixels de núcleo das letras).
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { contrastRatio } from "./infra/contrast.js";
import { PASTAS } from "./infra/caminhos.js";
import type { TextoMedido } from "./render.js";

export type Problema = { nivel: "erro" | "aviso"; regra: string; tela: number | null; mensagem: string };
export type Medicao = { tela: number; papel: string; texto: string; contraste: number | null; minimo: number; pixels: number };

const lum = (r: number, g: number, b: number) => {
  const f = (v: number) => {
    const x = v / 255;
    return x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};
const razao = (a: number, b: number) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);

/** Contraste de um texto medido nos pixels: retorna null quando há menos de 20 pixels de letra visíveis. */
export async function contrasteNoPng(comTexto: Buffer, semTexto: Buffer, r: { x: number; y: number; w: number; h: number }): Promise<{ contraste: number | null; pixels: number }> {
  const meta = await sharp(comTexto).metadata();
  const x = Math.max(0, Math.floor(r.x)), y = Math.max(0, Math.floor(r.y));
  const w = Math.min(meta.width! - x, Math.ceil(r.w)), h = Math.min(meta.height! - y, Math.ceil(r.h));
  if (w < 2 || h < 2) return { contraste: null, pixels: 0 };
  const box = { left: x, top: y, width: w, height: h };
  const a = await sharp(comTexto).extract(box).removeAlpha().raw().toBuffer();
  const b = await sharp(semTexto).extract(box).removeAlpha().raw().toBuffer();
  const difs: Array<{ d: number; i: number }> = [];
  for (let i = 0; i < a.length; i += 3) {
    const d = Math.max(Math.abs(a[i]! - b[i]!), Math.abs(a[i + 1]! - b[i + 1]!), Math.abs(a[i + 2]! - b[i + 2]!));
    if (d > 40) difs.push({ d, i });
  }
  if (difs.length < 20) return { contraste: null, pixels: difs.length };
  // núcleo das letras: os 30% de pixels que mais mudaram (descarta a borda suavizada)
  difs.sort((p, q) => q.d - p.d);
  const nucleo = difs.slice(0, Math.max(20, Math.round(difs.length * 0.3)));
  const rs = nucleo.map(({ i }) => razao(lum(a[i]!, a[i + 1]!, a[i + 2]!), lum(b[i]!, b[i + 1]!, b[i + 2]!))).sort((p, q) => p - q);
  return { contraste: rs[Math.floor(rs.length * 0.1)]!, pixels: difs.length };
}

let cfm: string[] | null = null;
async function proibidos() {
  cfm ??= (JSON.parse(await fs.readFile(path.join(PASTAS.biblioteca, "cfm.json"), "utf8")) as { proibidos: string[] }).proibidos;
  return cfm!;
}

export type Contexto = {
  telas: Buffer[];
  telasSemTexto: Buffer[];
  textos: TextoMedido[];
  avisosAjuste: Array<{ regra: string; tela: number; texto: string }>;
  fontes: Array<{ familia: string; status: string }>;
  familiasDaFicha: string[];
  crm: string;
  /** false quando o pedido pediu assinatura sem registro: exige só o nome do médico em toda tela */
  exigirRegistro?: boolean;
  nome?: string;
  uf: string;
  largura: number;
  altura: number;
  formato: "4x5" | "9x16";
  legenda: string;
  /** marcas de rascunho: placeholder de foto, CONFIRMAR, imagem provisória */
  pendencias: string[];
  /** rostos detectados em coordenadas da tela (9:16) */
  rostos?: Array<{ tela: number; y: number; h: number }>;
};

export type Resultado = { problemas: Problema[]; medicoes: Medicao[]; status: "reprovado" | "rascunho" | "aguardando revisão visual" };

export async function checar(c: Contexto): Promise<Resultado> {
  const p: Problema[] = [];
  const add = (nivel: Problema["nivel"], regra: string, tela: number | null, mensagem: string) => p.push({ nivel, regra, tela, mensagem });
  const termos = await proibidos();
  const medicoes: Medicao[] = [];

  // E1.1 e E1.2: hífen, travessão e CFM no texto renderizado e na legenda
  for (const t of [...c.textos.map((x) => ({ tela: x.tela, texto: x.texto })), { tela: null as number | null, texto: c.legenda }]) {
    if (/[-‐-―]/.test(t.texto.replace(/https?:\S+/g, ""))) add("erro", "hifen", t.tela, `Hífen ou travessão: "${t.texto.slice(0, 50)}"`);
    for (const termo of termos) if (t.texto.toLowerCase().includes(termo.toLowerCase())) add("erro", "cfm", t.tela, `Termo proibido pelo CFM "${termo}"`);
  }

  // E1.3 e E1.4: contraste medido no PNG
  for (const t of c.textos) {
    if (t.opacidade < 0.2) continue;
    const minimo = t.tamanho > 60 ? 3 : 4.5;
    const r = await contrasteNoPng(c.telas[t.tela - 1]!, c.telasSemTexto[t.tela - 1]!, t.rect);
    medicoes.push({ tela: t.tela, papel: t.papel, texto: t.texto.slice(0, 50), contraste: r.contraste, minimo, pixels: r.pixels });
    if (r.contraste === null) add("aviso", "contraste-nao-medido", t.tela, `Poucos pixels de letra para medir: "${t.texto.slice(0, 40)}"`);
    else if (r.contraste < minimo) add("erro", "contraste", t.tela, `Contraste ${r.contraste.toFixed(2)}:1 no PNG, mínimo ${minimo}:1: "${t.texto.slice(0, 40)}"`);
  }
  const exigir = c.exigirRegistro !== false;
  const crm = exigir ? `CRM ${c.crm}/${c.uf}` : c.nome ?? "";
  if (!exigir) add("aviso", "registro-omitido", null, "Assinatura sem CRM/UF e RQE por decisão do cliente (a Resolução CFM 2.336/2023 pede esses dados em publicidade médica)");
  for (let i = 1; i <= c.telas.length; i++) {
    const ass = c.textos.find((t) => t.tela === i && t.texto.includes(crm));
    if (!ass) {
      add("erro", exigir ? "crm-ausente" : "nome-ausente", i, `Tela sem "${crm}" visível`);
      continue;
    }
    const m = medicoes.find((x) => x.tela === i && x.texto === ass.texto.slice(0, 50));
    if (!m?.contraste || m.contraste < 4.5) add("erro", "crm-contraste", i, `Assinatura com contraste ${m?.contraste?.toFixed(2) ?? "não medido"}:1 no PNG (mínimo 4,5)`);
  }

  // E1.5: texto cortado ou estourado
  for (const a of c.avisosAjuste) add("erro", "texto-nao-coube", a.tela, `Texto não coube nem com 70% do tamanho: "${a.texto}"`);

  // E1.6: área segura
  const M = 80;
  for (const t of c.textos) {
    const r = t.rect;
    if (r.x < M - 1 || r.y < M - 1 || r.x + r.w > c.largura - M + 1 || r.y + r.h > c.altura - M + 1) add("erro", "area-segura", t.tela, `Texto a menos de ${M} px da borda: "${t.texto.slice(0, 40)}"`);
    if (c.formato === "9x16" && (r.y < 285 || r.y + r.h > 1635)) add("erro", "area-segura-916", t.tela, `Texto fora de 285 a 1635 px: "${t.texto.slice(0, 40)}"`);
  }
  if (c.formato === "9x16") for (const r of c.rostos ?? []) if (r.y < 285 || r.y + r.h > 1635) add("erro", "rosto-916", r.tela, "Rosto fora da área segura de 285 a 1635 px");

  // E1.9: fontes da ficha carregadas (nenhuma substituta)
  for (const fam of c.familiasDaFicha) {
    const faces = c.fontes.filter((f) => f.familia === fam);
    if (!faces.length) add("erro", "fonte", null, `Fonte da ficha não declarada: ${fam}`);
    else if (!faces.some((f) => f.status === "loaded")) add("erro", "fonte", null, `Fonte da ficha não carregou: ${fam}`);
  }
  for (const f of c.fontes.filter((x) => x.status === "error")) add("erro", "fonte", null, `Arquivo de fonte com erro: ${f.familia}`);

  // E1.10: resolução
  for (const [i, b] of c.telas.entries()) {
    const m = await sharp(b).metadata();
    if (m.width !== c.largura || m.height !== c.altura) add("erro", "resolucao", i + 1, `PNG ${m.width}x${m.height}, esperado ${c.largura}x${c.altura}`);
  }

  // E1.7: placeholder, CONFIRMAR, RASCUNHO: nunca "pronto"
  for (const x of c.pendencias) add("aviso", "nao-pronto", null, x);
  if (c.textos.some((t) => /CONFIRMAR/.test(t.texto))) add("aviso", "nao-pronto", null, "Há CONFIRMAR em alguma tela");

  const erros = p.some((x) => x.nivel === "erro");
  const pend = p.some((x) => x.regra === "nao-pronto");
  return { problemas: p, medicoes, status: erros ? "reprovado" : pend ? "rascunho" : "aguardando revisão visual" };
}
