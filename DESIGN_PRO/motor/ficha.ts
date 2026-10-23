/**
 * Ficha do médico (referência A2) e derivações de cor (A3, item 2).
 * A identidade é do médico: nenhum modelo usa cor ou fonte fixa, só os tokens calculados aqui.
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { z } from "zod";
import { contrastRatio, parseColor } from "./infra/contrast.js";
import { UserError } from "./infra/errors.js";
import { PASTAS, RAIZ } from "./infra/caminhos.js";

const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/, "cor HEX de 6 dígitos");
const caminho = z.string().refine((s) => !s.split(/[\\/]/).includes("..") && !path.isAbsolute(s), "caminho relativo, sem '..'");

export const Foto = z.object({
  arquivo: caminho,
  recorte: caminho.optional(),
  enquadramento: z.enum(["rosto", "busto", "cintura", "corpo"]).default("cintura"),
  olhar: z.enum(["camera", "lado"]).default("camera"),
  luz: z.enum(["esquerda", "direita", "frontal"]).default("frontal"),
  fundoOriginal: z.string().default(""),
  aprovada: z.boolean().default(false),
  /** Só para testes: retrato de pessoa fictícia (nunca no lugar de médico real). */
  ficticia: z.boolean().default(false),
});
export type Foto = z.infer<typeof Foto>;

export const Ficha = z.object({
  _sobre: z.string().optional(),
  ficticia: z.boolean().default(false),
  aprovada: z.boolean().default(false),
  medico: z.object({
    /** "" para instituição (escola, clínica): a assinatura usa só o nome. */
    tratamento: z.enum(["Dr", "Dra", ""]),
    nome: z.string().trim().min(1),
    crm: z.string().trim().min(1),
    uf: z.string().regex(/^([A-Z]{2}|CONFIRMAR)$/),
    rqe: z.string().optional(),
    especialidade: z.string().trim().min(1),
    instagram: z.string().regex(/^@?[A-Za-z0-9._]{1,30}$|^@?CONFIRMAR$/),
    cidade: z.string().trim().min(1),
  }),
  cores: z.object({
    principal: hex,
    apoio: hex,
    fundoClaro: hex,
    fundoEscuro: hex,
    textoSobreClaro: hex,
    textoSobreEscuro: hex,
    acento: hex.optional(),
  }),
  fontes: z.object({
    titulo: z.object({
      familia: z.string().min(1),
      arquivos: z.array(caminho).min(1),
      pesoForte: z.number().int().default(700),
      pesoLeve: z.number().int().default(400),
      temItalico: z.boolean().default(true),
      caixaAlta: z.boolean().default(false),
      tracking: z.number().default(0),
    }),
    texto: z.object({ familia: z.string().min(1), arquivos: z.array(caminho).min(1), pesoNormal: z.number().int().default(400), pesoForte: z.number().int().default(600) }),
    destaque: z.object({ familia: z.string().min(1), arquivos: z.array(caminho).min(1) }).optional(),
  }),
  estilo: z.object({
    clima: z.string().default(""),
    luz: z.enum(["dramatica", "suave", "natural", "clinica"]).default("suave"),
    temperatura: z.enum(["quente", "neutra", "fria"]).default("neutra"),
    raio: z.number().min(0).max(60).default(18),
    textura: z.enum(["nenhuma", "grao", "papel"]).default("grao"),
    elementos: z.array(z.string()).default([]),
    preferenciaFundo: z.enum(["escuro", "claro", "alternado"]).default("alternado"),
    evitar: z.array(z.string()).default([]),
    /** destaque em fundo onde a principal não chega a 3:1: "tom" (principal escurecida) ou "marcaTexto" (faixa da principal sob as palavras, texto na cor do texto) */
    destaqueFraco: z.enum(["tom", "marcaTexto"]).default("tom"),
  }),
  logo: z.object({ paraFundoClaro: caminho.optional(), paraFundoEscuro: caminho.optional(), paraFundoPrincipal: caminho.optional(), monograma: z.string().optional() }).default({}),
  fotos: z
    .object({
      retratos: z.array(Foto).default([]),
      atendimento: z.array(Foto).default([]),
      detalhe: z.array(Foto).default([]),
      equipe: z.array(Foto).default([]),
      clinica: z.array(Foto).default([]),
    })
    .default({ retratos: [], atendimento: [], detalhe: [], equipe: [], clinica: [] }),
  referenciasVisuais: z.array(z.string()).default([]),
});
export type Ficha = z.infer<typeof Ficha>;
export type TokenCor = keyof Ficha["cores"];

/* ---------- cor ---------- */

const toHex = (r: number, g: number, b: number) => "#" + [r, g, b].map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0")).join("").toUpperCase();
export function misturar(a: string, b: string, t: number): string {
  const x = parseColor(a), y = parseColor(b);
  return toHex(x.r + (y.r - x.r) * t, x.g + (y.g - x.g) * t, x.b + (y.b - x.b) * t);
}
export function rgba(c: string, a: number): string {
  const x = parseColor(c);
  return `rgba(${x.r}, ${x.g}, ${x.b}, ${a})`;
}
/** Entre as cores candidatas, a de maior contraste com o fundo. */
export function melhorTexto(fundo: string, ...candidatas: string[]): string {
  return candidatas.reduce((m, c) => (contrastRatio(c, fundo) > contrastRatio(m, fundo) ? c : m));
}

export type Derivadas = {
  cores: Ficha["cores"] & { acento: string };
  /** Tons de cada cor: misturas de 10%, 25%, 50% e 85% da cor sobre o fundo escuro e sobre o claro. */
  tons: Record<string, string>;
  principalClara: string;
  principalEscura: string;
  /** Melhor cor de texto sobre cada fundo (WCAG). */
  textoSobre: { claro: string; escuro: string; principal: string; apoio: string };
};

export function derivar(f: Ficha): Derivadas {
  const c = { ...f.cores, acento: f.cores.acento ?? f.cores.principal };
  const tons: Record<string, string> = {};
  for (const [k, v] of Object.entries(c)) {
    for (const p of [10, 25, 50, 85]) {
      tons[`${k}${p}Escuro`] = misturar(c.fundoEscuro, v, p / 100);
      tons[`${k}${p}Claro`] = misturar(c.fundoClaro, v, p / 100);
    }
  }
  return {
    cores: c,
    tons,
    principalClara: misturar(c.principal, "#FFFFFF", 0.35),
    principalEscura: misturar(c.principal, "#000000", 0.35),
    textoSobre: {
      claro: melhorTexto(c.fundoClaro, c.textoSobreClaro, c.textoSobreEscuro),
      escuro: melhorTexto(c.fundoEscuro, c.textoSobreEscuro, c.textoSobreClaro),
      principal: melhorTexto(c.principal, c.textoSobreClaro, c.textoSobreEscuro),
      apoio: melhorTexto(c.apoio, c.textoSobreClaro, c.textoSobreEscuro),
    },
  };
}

/* ---------- carregamento ---------- */

export type FichaCarregada = {
  id: string;
  dir: string;
  ficha: Ficha;
  derivadas: Derivadas;
  /** Arquivos de fonte resolvidos (woff2/ttf) por papel. */
  fontes: { titulo: string[]; texto: string[]; destaque: string[] };
  avisos: string[];
  /** Definido pelo pedido: assinatura sem CRM/UF e RQE (decisão do cliente). */
  semRegistro?: boolean;
};

async function arquivosDeFonte(rels: string[], marcaDir: string): Promise<string[]> {
  const out: string[] = [];
  for (const r of rels) {
    const candidatos = [path.join(marcaDir, r), path.join(RAIZ, r)];
    let achou = false;
    for (const c of candidatos) {
      const st = await fs.stat(c).catch(() => null);
      if (!st) continue;
      achou = true;
      if (st.isDirectory()) for (const f of (await fs.readdir(c)).sort()) if (/\.(woff2?|ttf|otf)$/.test(f)) out.push(path.join(c, f));
      if (st.isFile()) out.push(c);
      break;
    }
    if (!achou) throw new UserError(`Fonte não encontrada: ${r}`);
  }
  return out;
}

export async function carregarFicha(id: string, marcasDir = PASTAS.marcas): Promise<FichaCarregada> {
  if (!/^[a-z0-9_-]+$/.test(id)) throw new UserError(`Id de médico inválido: ${id}`);
  const dir = path.join(marcasDir, id);
  let json: unknown;
  try {
    json = JSON.parse(await fs.readFile(path.join(dir, "ficha.json"), "utf8"));
  } catch {
    throw new UserError(`Ficha não encontrada ou inválida: marcas/${id}/ficha.json`);
  }
  const p = Ficha.safeParse(json);
  if (!p.success) throw new UserError(`Ficha inválida: marcas/${id}/ficha.json`, p.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`));
  const f = p.data;
  const c = f.cores;
  const erros: string[] = [];
  if (contrastRatio(c.textoSobreClaro, c.fundoClaro) < 4.5) erros.push(`textoSobreClaro x fundoClaro: ${contrastRatio(c.textoSobreClaro, c.fundoClaro).toFixed(2)}:1`);
  if (contrastRatio(c.textoSobreEscuro, c.fundoEscuro) < 4.5) erros.push(`textoSobreEscuro x fundoEscuro: ${contrastRatio(c.textoSobreEscuro, c.fundoEscuro).toFixed(2)}:1`);
  if (erros.length) throw new UserError(`Ficha recusada: texto principal com contraste abaixo de 4,5`, erros);
  const avisos: string[] = [];
  for (const [nome, fundo] of [["fundoClaro", c.fundoClaro], ["fundoEscuro", c.fundoEscuro]] as const) {
    const r = contrastRatio(c.principal, fundo);
    if (r < 3) avisos.push(`principal sobre ${nome}: ${r.toFixed(2)}:1 (destaque abaixo de 3:1 nesse fundo; os modelos usam o tom ajustado)`);
  }
  if (!f.aprovada) avisos.push("Ficha ainda não aprovada pelo time (G3)");
  if (f.ficticia) avisos.push("Marca fictícia de teste");
  const fontes = {
    titulo: await arquivosDeFonte(f.fontes.titulo.arquivos, dir),
    texto: await arquivosDeFonte(f.fontes.texto.arquivos, dir),
    destaque: f.fontes.destaque ? await arquivosDeFonte(f.fontes.destaque.arquivos, dir) : [],
  };
  for (const [papel, lista] of Object.entries(fontes)) {
    for (const d of new Set(lista.map((x) => path.dirname(x)))) {
      const lic = await fs.readdir(d).then((x) => x.some((n) => /^(LICENSE|OFL)/i.test(n)), () => false);
      if (!lic) avisos.push(`Fonte de ${papel} sem arquivo de licença em ${path.relative(RAIZ, d)}`);
    }
  }
  return { id, dir, ficha: f, derivadas: derivar(f), fontes, avisos };
}
