/**
 * Roteiro (A2 e C): conteúdo de cada tela com limites de caracteres por modelo, mais legenda,
 * itens para aprovação médica e lista de CONFIRMAR. Validado antes de qualquer imagem ser gerada (A3, item 3).
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { z } from "zod";
import { PASTAS } from "./infra/caminhos.js";

/** Texto visível: a marcação *destaque* e _itálico_ não conta no limite. */
export const visivel = (s: string) => s.replace(/[*_]/g, "").replace(/\\n|\n/g, " ");
const t = (max: number) => z.string().trim().min(1, "obrigatório").refine((s) => visivel(s).length <= max, `máximo de ${max} caracteres`);
const destaques = (s: string) => (s.match(/\*[^*]+\*/g) ?? []).map((d) => d.replace(/\*/g, "").trim().split(/\s+/).length);
const comDestaque = (max: number) => t(max).refine((s) => destaques(s).every((n) => n <= 3), "destaque com no máximo 3 palavras");

export const Legenda = z.object({
  gancho: t(120),
  corpo: z.string().trim().min(1).max(2000),
  cta: t(160),
  hashtags: z.array(z.string().regex(/^#[\p{L}\p{N}_]+$/u)).min(4).max(8),
});
const base = { legenda: Legenda, aprovacaoMedica: z.array(z.string()).default([]), confirmar: z.array(z.string()).default([]) };

export const ROTEIROS = {
  1: z.object({ ...base, fraseApoio: t(45), palavra: t(10).refine((s) => !/\s/.test(s.trim()), "uma palavra só"), etiqueta: t(30).optional() }),
  2: z.object({ ...base, selo: t(28), pergunta: comDestaque(50), chamada: t(24) }),
  3: z.object({ ...base, linha1: t(22), linha2: t(22), linha3: t(18) }),
  4: z.object({ ...base, mes: t(12), nomeCor: t(9), corCampanha: z.string().regex(/^#[0-9a-fA-F]{6}$/), temaCampanha: t(48), fraseCuidado: comDestaque(70) }),
  5: z.object({
    ...base,
    selo: t(24),
    titulo: comDestaque(40),
    subtitulo: t(90),
    informacoes: z.array(z.object({ icone: z.enum(["calendario", "local", "whatsapp"]), texto: t(40) })).min(1).max(3),
    /** Variação D: procedimentos ou itens curtos listados sobre a foto. */
    lista: z.array(t(32)).min(2).max(6).optional(),
    botao: t(26),
  }),
  6: z.object({ ...base, palavra: t(12), complemento: comDestaque(50), selo: t(24).optional() }),
  7: z.object({
    ...base,
    capa: z.object({ selo: t(28), titulo: comDestaque(40), subtitulo: t(60) }),
    oQueE: t(230),
    porQue: t(230),
    sinais: z.array(t(45)).min(3).max(5),
    tratamento: t(200),
    alerta: comDestaque(90),
    palavraFundo: t(14),
    /** títulos das telas internas (padrão: O que é, Por que acontece, Sinais, Tratamento) */
    titulos: z.object({ oQueE: comDestaque(40), porQue: comDestaque(40), sinais: comDestaque(40), tratamento: comDestaque(40) }).partial().default({}),
  }),
  8: z.object({
    ...base,
    capaTitulo: t(30).default("Mitos e *Verdades*"),
    capaSubtitulo: t(40),
    itens: z.array(z.object({ afirmacao: t(70), veredito: z.enum(["MITO", "VERDADE"]), explicacao: t(180) })).min(3).max(5),
    fechamento: t(90),
  }),
  9: z.object({
    ...base,
    capa: z.object({ palavra: t(10), titulo: comDestaque(80) }),
    itens: z.array(z.object({ titulo: t(45), texto: comDestaque(170) })).min(3).max(5),
    conclusao: comDestaque(110),
  }),
  10: z.object({
    ...base,
    capa: z.object({ titulo: comDestaque(55) }),
    estudo: z.object({ texto: t(230), fonte: t(80) }),
    mecanismo: z.object({ passos: z.array(t(70)).length(3) }),
    aplicacao: z.object({ texto: t(230) }),
    ressalva: t(110),
  }),
  11: z.object({
    ...base,
    capa: z.object({ titulo: comDestaque(40), subtitulo: t(60) }),
    consulta: z.object({ titulo: t(30), texto: t(150) }),
    avaliacao: z.object({ titulo: t(30), texto: t(150) }),
    equipe: z.object({ titulo: t(30), texto: t(150) }),
    valor: comDestaque(50),
    cta: t(60),
  }),
  12: z.object({
    ...base,
    capa: z.object({ procedimento: t(24) }),
    comoFunciona: t(230),
    antes: z.array(t(60)).min(3).max(4),
    noDia: z.array(t(60)).min(3).max(4),
    depois: z.array(t(60)).min(3).max(4),
    seguranca: comDestaque(110),
  }),
} as const;
export type ModeloId = keyof typeof ROTEIROS;
export type Roteiro<M extends ModeloId = ModeloId> = z.infer<(typeof ROTEIROS)[M]>;

export type Achado = { nivel: "erro" | "aviso"; caminho: string; mensagem: string };

let cfmCache: { proibidos: string[] } | null = null;
async function cfm() {
  cfmCache ??= JSON.parse(await fs.readFile(path.join(PASTAS.biblioteca, "cfm.json"), "utf8"));
  return cfmCache!;
}

/** Todos os textos do roteiro com o caminho de cada um. */
export function textos(r: unknown, prefixo = "roteiro"): Array<[string, string]> {
  const out: Array<[string, string]> = [];
  const andar = (v: unknown, p: string) => {
    if (typeof v === "string") {
      if (!/(corCampanha|veredito|icone)$/.test(p)) out.push([p, v]);
    } else if (Array.isArray(v)) v.forEach((x, i) => andar(x, `${p}.${i}`));
    else if (v && typeof v === "object") for (const [k, x] of Object.entries(v)) if (k !== "aprovacaoMedica" && k !== "confirmar") andar(x, `${p}.${k}`);
  };
  andar(r, prefixo);
  return out;
}

/** Valida limites (Zod), CFM, hífen e CONFIRMAR. Erros bloqueiam a geração de imagem e o render. */
export async function validarRoteiro(modelo: number, roteiro: unknown): Promise<{ roteiro: Roteiro | null; achados: Achado[] }> {
  const esquema = ROTEIROS[modelo as ModeloId];
  if (!esquema) return { roteiro: null, achados: [{ nivel: "erro", caminho: "modelo", mensagem: `Modelo ${modelo} não existe` }] };
  const p = esquema.safeParse(roteiro);
  if (!p.success) return { roteiro: null, achados: p.error.issues.map((i) => ({ nivel: "erro", caminho: `roteiro.${i.path.join(".")}`, mensagem: i.message })) };
  const achados: Achado[] = [];
  const { proibidos } = await cfm();
  for (const [c, v] of textos(p.data)) {
    const baixo = v.toLowerCase();
    for (const termo of proibidos) if (baixo.includes(termo.toLowerCase())) achados.push({ nivel: "erro", caminho: c, mensagem: `Termo proibido pelo CFM: "${termo}"` });
    if (/[-‐-―]/.test(v.replace(/https?:\S+/g, ""))) achados.push({ nivel: "erro", caminho: c, mensagem: "Hífen ou travessão (reescreva a frase)" });
    if (/CONFIRMAR/.test(v)) achados.push({ nivel: "aviso", caminho: c, mensagem: "Dado marcado CONFIRMAR: a entrega não pode ficar pronta" });
  }
  if (modelo === 8) {
    const v = (p.data as Roteiro<8>).itens.map((i) => i.veredito);
    if (v[0] !== "MITO") achados.push({ nivel: "erro", caminho: "roteiro.itens.0.veredito", mensagem: "Modelo 8: comece por um MITO" });
    if (v.some((x, i) => i > 0 && x === v[i - 1])) achados.push({ nivel: "erro", caminho: "roteiro.itens", mensagem: "Modelo 8: alterne MITO e VERDADE" });
  }
  if (modelo === 10 && !(p.data as Roteiro<10>).aprovacaoMedica.length) {
    achados.push({ nivel: "aviso", caminho: "roteiro.aprovacaoMedica", mensagem: "Modelo 10: só com estudo enviado ou aprovado pelo médico; liste o que precisa de aprovação" });
  }
  for (const c of p.data.confirmar) achados.push({ nivel: "aviso", caminho: "roteiro.confirmar", mensagem: `CONFIRMAR: ${c}` });
  return { roteiro: p.data, achados };
}
