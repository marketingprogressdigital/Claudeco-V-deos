/**
 * Produção de imagem (A3, item 5; D6, D7, D8): interface comum, cache em disco por hash do pedido,
 * repetição com espera progressiva para falha transitória, OCR que descarta imagem com letras,
 * ampliação até o tamanho de uso e registro de custo. Nenhuma chamada sai sem chave E sem "habilitado".
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { MOTOR, PASTAS, RAIZ } from "../infra/caminhos.js";
import { UserError } from "../infra/errors.js";
import { sha256 } from "../infra/fs.js";
import { ocr } from "../medico/recorte.js";

export type PedidoResolvido = {
  cena: string;
  prompt: string;
  proporcao: "1:1" | "4:5" | "9:16" | "3:4" | "16:9";
  fundoTransparente: boolean;
  variacoes: number;
  semente?: number;
  /** imagens de referência (ex.: estilo), nunca o rosto do médico para edição */
  referencias?: string[];
};
export type ImagemGerada = { png: Buffer; provedor: string; modelo: string; custoEstimadoUSD: number | null; marcaDagua?: string };

export interface Provedor {
  readonly nome: string;
  readonly modelo: string;
  /** true quando a imagem é provisória (modo rascunho, sem IA): a entrega nunca fica pronta */
  readonly provisorio: boolean;
  gerar(p: PedidoResolvido): Promise<ImagemGerada[]>;
}

/** Erro que vale tentar de novo (rede, 429, 5xx). Erros de validação ou de chave não se repetem. */
export class ErroTransitorio extends Error {}

export type ConfigImagem = {
  /** Trava de segurança: sem true, nenhuma API é chamada mesmo com chave no .env. */
  habilitado: boolean;
  provedor: "gemini" | "openai";
  modelos: { gemini: string; openai: string };
  /** de onde veio o nome do modelo e quando foi conferido (regra da skill: não confiar na memória) */
  conferidoEm: Record<string, { url: string; data: string; observacao: string }>;
  imageSize: "1K" | "2K" | "4K";
  custoPorImagemUSD: Record<string, number | null>;
};

export const CONFIG_PADRAO: ConfigImagem = {
  habilitado: false,
  provedor: "gemini",
  modelos: { gemini: "gemini-nano-banana-2.1", openai: "gpt-image-2" },
  conferidoEm: {
    gemini: { url: "https://ai.google.dev/gemini-api/docs/image-generation", data: "2026-10-20", observacao: "Interactions API (POST /v1beta/interactions, cabeçalho x-goog-api-key); Nano Banana 2.1 recomendado para projetos novos; toda imagem leva marca d'água SynthID" },
    openai: { url: "https://developers.openai.com/api/reference/cli/resources/images/methods/generate", data: "2026-10-20", observacao: "gpt-image-2 não aceita fundo transparente (usar gpt-image-1 para elementos isolados); resposta sempre em base64" },
  },
  imageSize: "2K",
  custoPorImagemUSD: { gemini: null, openai: null },
};

export async function lerConfig(): Promise<ConfigImagem> {
  const f = path.join(MOTOR, "imagem.json");
  const txt = await fs.readFile(f, "utf8").catch(() => null);
  if (!txt) {
    await fs.writeFile(f, JSON.stringify(CONFIG_PADRAO, null, 2) + "\n");
    return CONFIG_PADRAO;
  }
  return { ...CONFIG_PADRAO, ...JSON.parse(txt) };
}

/** Lê uma chave do DESIGN_PRO/.env sem nunca registrar o valor. */
export async function lerChave(nome: "GEMINI_API_KEY" | "OPENAI_API_KEY", arquivo = path.join(RAIZ, ".env")): Promise<string | null> {
  const txt = await fs.readFile(arquivo, "utf8").catch(() => "");
  for (const linha of txt.split(/\r?\n/)) {
    const m = /^\s*([A-Z_]+)\s*=\s*(.*)\s*$/.exec(linha);
    if (m && m[1] === nome) {
      const v = m[2]!.replace(/^["']|["']$/g, "").trim();
      return v ? v : null;
    }
  }
  return null;
}

export type Registro = { cena: string; hash: string; arquivo: string; provedor: string; modelo: string; cache: boolean; descartadas: Array<{ motivo: string }>; custoEstimadoUSD: number | null; provisorio: boolean };

const espera = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Gera (ou reaproveita do cache) as variações e escolhe a primeira sem texto (OCR local).
 * O arquivo escolhido é ampliado até `larguraUso` × 1,5, no mínimo (E1.10).
 */
export async function gerarComCache(prov: Provedor, p: PedidoResolvido, larguraUso: number, opts: { tentativas?: number; esperaMs?: number; ocrAtivo?: boolean } = {}): Promise<Registro> {
  const chave = sha256(JSON.stringify({ prov: prov.nome, modelo: prov.modelo, ...p, v: 1 }));
  const dir = PASTAS.cacheImagens;
  await fs.mkdir(dir, { recursive: true });
  const final = path.join(dir, `${chave}.png`);
  const meta = path.join(dir, `${chave}.json`);
  if (await fs.stat(final).catch(() => null)) {
    const m = JSON.parse(await fs.readFile(meta, "utf8").catch(() => "{}"));
    return { cena: p.cena, hash: chave, arquivo: final, provedor: prov.nome, modelo: prov.modelo, cache: true, descartadas: m.descartadas ?? [], custoEstimadoUSD: 0, provisorio: prov.provisorio };
  }
  const tentativas = opts.tentativas ?? 3;
  let imagens: ImagemGerada[] = [];
  for (let t = 1; ; t++) {
    try {
      imagens = await prov.gerar(p);
      break;
    } catch (e) {
      if (!(e instanceof ErroTransitorio) || t >= tentativas) throw e;
      await espera((opts.esperaMs ?? 1500) * 2 ** (t - 1));
    }
  }
  const descartadas: Array<{ motivo: string }> = [];
  let escolhida: Buffer | null = null;
  for (const [i, img] of imagens.entries()) {
    await fs.writeFile(path.join(dir, `${chave}.var${i + 1}.png`), img.png);
    if (opts.ocrAtivo !== false && !prov.provisorio && process.platform === "darwin") {
      const r = await ocr(path.join(dir, `${chave}.var${i + 1}.png`));
      const letras = r.textos.filter((x) => x.confianca >= 0.5 && /[A-Za-z0-9]{2,}/.test(x.texto));
      if (letras.length) {
        descartadas.push({ motivo: `variação ${i + 1}: texto na imagem (${letras.map((x) => x.texto).join(", ").slice(0, 60)})` });
        continue;
      }
    }
    escolhida ??= img.png;
  }
  if (!escolhida) throw new UserError(`Nenhuma variação de ${p.cena} serviu`, descartadas.map((d) => d.motivo));
  const m = await sharp(escolhida).metadata();
  const alvo = Math.round(larguraUso * 1.5);
  const ampliada = m.width! < alvo ? await sharp(escolhida).resize({ width: alvo, kernel: "lanczos3" }).png().toBuffer() : escolhida;
  await fs.writeFile(final, ampliada);
  const custo = imagens.reduce<number | null>((s, x) => (s === null || x.custoEstimadoUSD === null ? null : s + x.custoEstimadoUSD), 0);
  await fs.writeFile(meta, JSON.stringify({ pedido: p, provedor: prov.nome, modelo: prov.modelo, variacoes: imagens.length, descartadas, custoEstimadoUSD: custo, geradoEm: new Date().toISOString() }, null, 2));
  return { cena: p.cena, hash: chave, arquivo: final, provedor: prov.nome, modelo: prov.modelo, cache: false, descartadas, custoEstimadoUSD: custo, provisorio: prov.provisorio };
}
