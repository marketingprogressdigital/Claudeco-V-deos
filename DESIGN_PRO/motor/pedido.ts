/**
 * Pedido (A2): o que o time quer. O modelo é escolhido pela tabela de objetivos quando não vem no pedido (A3, item 1).
 * O roteiro (texto das telas) é escrito pelo diretor de arte (a IA na conversa) e fica no próprio pedido, em "roteiro".
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { z } from "zod";
import { PASTAS } from "./infra/caminhos.js";
import { UserError } from "./infra/errors.js";

export const Pedido = z.object({
  medico: z.string().regex(/^[a-z0-9_-]+$/),
  modelo: z.number().int().min(1).max(12).optional(),
  variacao: z.enum(["A", "B", "C", "D"]).optional(),
  tema: z.string().min(3),
  objetivo: z.string().optional(),
  observacoes: z.string().optional(),
  dados: z.record(z.string(), z.string()).optional(),
  /** Conteúdo das telas e legenda; validado por roteiro.ts conforme o modelo. */
  roteiro: z.unknown().optional(),
  /** Fotos da ficha a usar, por papel (ex.: { retrato: "entrada/retrato_01.png" }). */
  fotos: z.record(z.string(), z.string()).optional(),
  /**
   * "completa" (padrão): nome, CRM/UF e RQE em toda tela (CFM 2.336/2023).
   * "semRegistro": só nome e especialidade, por decisão explícita do cliente; a checagem registra a omissão
   * no relatório como aviso "registro-omitido" em vez de bloquear.
   */
  assinatura: z.enum(["completa", "semRegistro"]).default("completa"),
  /** Sufixo da pasta de saída (ex.: "final"), para não sobrescrever um rascunho anterior. */
  versao: z.string().regex(/^[a-z0-9_]+$/).optional(),
});
export type Pedido = z.infer<typeof Pedido>;

type Catalogo = { escolha_por_objetivo: Record<string, number[]>; modelos: Array<{ id: number; nome: string; tipo: string; formato: "4x5" | "9x16"; variacoes?: Record<string, string>; precisa_foto_medico: boolean | string; cenas: string[]; area_segura_y?: [number, number]; exige?: string }> };
let catalogoCache: Catalogo | null = null;
export async function catalogo(): Promise<Catalogo> {
  catalogoCache ??= JSON.parse(await fs.readFile(PASTAS.catalogo, "utf8"));
  return catalogoCache!;
}

/** Escolhe o modelo pelo objetivo (tabela do catálogo) quando o pedido não indica; registra o motivo. */
export async function resolverModelo(p: Pedido): Promise<{ modelo: number; variacao: "A" | "B" | "C" | "D"; motivo: string }> {
  if (p.modelo) return { modelo: p.modelo, variacao: p.variacao ?? "A", motivo: "indicado no pedido" };
  const cat = await catalogo();
  const obj = (p.objetivo ?? "").toLowerCase();
  for (const [k, ids] of Object.entries(cat.escolha_por_objetivo)) {
    if (obj && (obj.includes(k) || k.includes(obj))) return { modelo: ids[0]!, variacao: p.variacao ?? "A", motivo: `objetivo "${k}" → modelo ${ids[0]}` };
  }
  return { modelo: 7, variacao: p.variacao ?? "A", motivo: "sem modelo nem objetivo reconhecido: carrossel educativo (7) por padrão" };
}

export async function lerPedido(arquivo: string): Promise<Pedido> {
  let json: unknown;
  try {
    json = JSON.parse(await fs.readFile(arquivo, "utf8"));
  } catch {
    throw new UserError(`Pedido não encontrado ou inválido: ${path.relative(process.cwd(), arquivo)}`);
  }
  const p = Pedido.safeParse(json);
  if (!p.success) throw new UserError("Pedido inválido", p.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`));
  return p.data;
}

export const caminhoPedido = (nome: string) => path.join(PASTAS.pedidos, nome);
