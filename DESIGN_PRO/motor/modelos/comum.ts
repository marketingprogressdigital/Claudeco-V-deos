/**
 * Primitivas de composição dos 12 modelos (B2, B3, B6). Grade de 12 colunas, margem 80, calha 24.
 * Tudo referencia tokens da ficha; nenhum HEX nem nome de fonte aqui.
 */
import type { FichaCarregada } from "../ficha.js";
import type { Camada, Caixa, EstiloTexto, Plano, Tela } from "../plano.js";

export const W = 1080;
export const M = 80;
export const CALHA = 24;
export const COL = (W - 2 * M - 11 * CALHA) / 12;
/** x da coluna i (0 a 11) e largura de n colunas */
export const col = (i: number) => M + i * (COL + CALHA);
export const span = (n: number) => n * COL + (n - 1) * CALHA;

export const cx = (x: number, y: number, w: number, h: number, z = 10, rotacao?: number): Caixa => ({ x, y, w, h, z, ...(rotacao ? { rotacao } : {}) });

type E = Partial<EstiloTexto> & { tamanho: number };
const est = (e: E): EstiloTexto => ({
  fonte: "texto", peso: "normal", italico: false, tracking: 0, caixaAlta: false, cor: "textoAuto", corDestaque: "destaqueAuto", alinhar: "esquerda", vertical: "topo",
  ajuste: "caixa", efeitos: [], numeros: "padrao", sombra: false, ...e,
});

export const T = {
  gigante: (conteudo: string, c: Caixa, e: Partial<E> = {}): Camada => ({ tipo: "texto", papel: "gigante", conteudo, caixa: c, estilo: est({ fonte: "titulo", peso: "forte", tamanho: 340, ajuste: "largura", ...e }) }),
  titulo: (conteudo: string, c: Caixa, e: Partial<E> = {}): Camada => ({ tipo: "texto", papel: "titulo", conteudo, caixa: c, estilo: est({ fonte: "titulo", peso: "forte", tamanho: 96, ...e }) }),
  subtitulo: (conteudo: string, c: Caixa, e: Partial<E> = {}): Camada => ({ tipo: "texto", papel: "subtitulo", conteudo, caixa: c, estilo: est({ fonte: "titulo", peso: "leve", italico: true, tamanho: 50, ...e }) }),
  corpo: (conteudo: string, c: Caixa, e: Partial<E> = {}): Camada => ({ tipo: "texto", papel: "corpo", conteudo, caixa: c, estilo: est({ tamanho: 42, ...e }) }),
  rotulo: (conteudo: string, c: Caixa, e: Partial<E> = {}): Camada => ({ tipo: "texto", papel: "rotulo", conteudo, caixa: c, estilo: est({ peso: "forte", tamanho: 22, tracking: 0.2, ajuste: "largura", ...e }) }),
  numero: (conteudo: string, c: Caixa, e: Partial<E> = {}): Camada => ({ tipo: "texto", papel: "numero", conteudo, caixa: c, estilo: est({ fonte: "titulo", peso: "forte", tamanho: 360, numeros: "alinhados", efeitos: ["degrade", "eco"], ajuste: "largura", ...e }) }),
};

/** Nome, CRM/UF e RQE (obrigatórios em toda tela, CFM). */
export function assinaturaTexto(f: FichaCarregada): string {
  const m = f.ficha.medico;
  if (f.semRegistro) return `${m.tratamento} ${m.nome} | ${m.especialidade}`;
  return `${m.tratamento} ${m.nome} | CRM ${m.crm}/${m.uf}${m.rqe ? ` | RQE ${m.rqe}` : ""}`;
}

/** Linha fina e assinatura na base (y de 1222 a 1270, dentro da área segura). */
export function rodape(f: FichaCarregada, H = 1350, opts: { linha?: boolean; seta?: boolean } = {}): Camada[] {
  const y = H - M - 44;
  const out: Camada[] = [];
  if (opts.linha !== false) out.push({ tipo: "forma", forma: "linha", caixa: cx(M, y - 26, span(12), 1.5, 60), cor: "textoAuto", opacidade: 0.28, contornoDuplo: false, preenchida: true });
  out.push({ tipo: "texto", papel: "assinatura", conteudo: assinaturaTexto(f), caixa: cx(M, y, span(10), 40, 61), estilo: est({ peso: "forte", tamanho: 22, ajuste: "largura", vertical: "meio" }) });
  if (opts.seta) out.push({ tipo: "icone", nome: "seta", caixa: cx(W - M - 44, y, 44, 40, 61), cor: "textoAuto", circulo: "nenhum" });
  return out;
}

/** Numeração editorial no topo direito (ex.: 02/07). */
export const numeracao = (i: number, total: number, tamanho = 22): Camada => ({
  tipo: "texto", papel: "rotulo", conteudo: `${String(i).padStart(2, "0")}/${String(total).padStart(2, "0")}`, caixa: cx(W - M - 160, M, 160, 30, 60), estilo: est({ peso: "forte", tamanho, tracking: 0.16, alinhar: "direita", ajuste: "nenhum", numeros: "alinhados" }),
});

export const logo = (x = M, y = M, w = 170, h = 64): Camada => ({ tipo: "logo", caixa: cx(x, y, w, h, 60) });

export const atmosfera = (estilo: "noturno" | "editorial" | "clinico" | "cor", focoLuz: [number, number] = [0.5, 0.4], intensidade = 0.35): Camada => ({ tipo: "atmosfera", estilo, focoLuz, intensidade });

export const efeito = (efeito: Extract<Camada, { tipo: "efeito" }>["efeito"], c: Caixa | undefined, parametros: Record<string, number | string | boolean> = {}): Camada => ({ tipo: "efeito", efeito, ...(c ? { caixa: c } : {}), parametros });

export const vidro = (c: Caixa, sobre: "claro" | "escuro"): Camada => ({ tipo: "vidro", caixa: c, sobre });

export const veu = (y: number, h: number, cor: "fundoEscuro" | "fundoClaro" | "principal" = "fundoEscuro", ate = 0.92, z = 40, H = 1350, direcao: "baixo" | "cima" = "baixo"): Camada => ({ tipo: "veu", caixa: cx(0, y, W, Math.min(h, H - y), z), cor, de: 0, ate, direcao });

export const imagem = (cena: string, c: Caixa, o: { transparente?: boolean; proporcao?: "1:1" | "4:5" | "9:16" | "3:4" | "16:9"; mascara?: "arco" | "circulo"; desfoque?: number; opacidade?: number; tingimento?: number; duotom?: boolean; pb?: boolean; assunto?: string; composicao?: string; ajuste?: "cobrir" | "conter"; semente?: number } = {}): Camada => ({
  tipo: "imagemGerada",
  pedidoImagem: { cena, proporcao: o.proporcao ?? "4:5", fundoTransparente: o.transparente ?? false, variacoes: 3, ...(o.assunto ? { assunto: o.assunto } : {}), ...(o.composicao ? { composicao: o.composicao } : {}), ...(o.semente ? { semente: o.semente } : {}) },
  caixa: c,
  tratamento: { gradacao: true, tingimento: o.tingimento ?? (o.transparente ? 0 : 0.25), duotom: o.duotom ?? false, pb: o.pb ?? false, desfoque: o.desfoque ?? 0, opacidade: o.opacidade ?? 1, ajuste: o.ajuste ?? (o.transparente ? "conter" : "cobrir") },
  ...(o.mascara ? { mascara: { forma: o.mascara } } : {}),
});

/** Médico com integração completa (casamento de cor, luz de recorte do lado da luz do post, sombra, oclusão). */
export const medico = (c: Caixa, luz: "esquerda" | "direita" | "frontal", foto = "retrato", plano: "atras" | "meio" | "frente" = "meio"): Camada => ({
  tipo: "fotoMedico",
  foto,
  caixa: c,
  plano,
  integracao: { casamentoCor: 0.45, luzRecorte: { lado: luz === "direita" ? "direita" : "esquerda", largura: 30, opacidade: 0.5 }, sombraContato: 0.28, oclusao: 0.18 },
});

export const icone = (nome: string, c: Caixa, circulo: "nenhum" | "vidro" | "cheio" = "nenhum", cor: "destaqueAuto" | "textoAuto" = "destaqueAuto"): Camada => ({ tipo: "icone", nome, caixa: c, cor, circulo });

export const forma = (f: "arco" | "circulo" | "faixa" | "moldura" | "linha" | "anel", c: Caixa, cor: "principal" | "apoio" | "textoAuto" | "destaqueAuto" | "fundoClaro" | "fundoEscuro" | "campanha" | "principalEscura" | "principalClara" = "principal", opacidade = 1, contornoDuplo = false, preenchida = true): Camada => ({ tipo: "forma", forma: f, caixa: c, cor, opacidade, contornoDuplo, preenchida });

export const tela = (fundo: Tela["fundo"], papel: string, camadas: Camada[]): Tela => ({ fundo, papel, camadas });

/** Fechamento padrão com 4 pílulas de ação em vidro (Modelos 7 e 9). */
export function fechamentoAcoes(f: FichaCarregada, total: number, titulo = "Gostou do *conteúdo?*", comMedico = true, luz: "esquerda" | "direita" = "esquerda", foto = "retrato"): Tela {
  const acoes: Array<[string, string]> = [["curtir", "Curte"], ["comentar", "Comenta"], ["enviar", "Envia para alguém"], ["salvar", "Salva para não esquecer"]];
  const cam: Camada[] = [atmosfera("noturno", [0.75, 0.45], 0.3)];
  if (comMedico) cam.push(medico(cx(520, 330, 640, 1020, 30), luz, foto));
  cam.push(veu(1020, 330, "fundoEscuro", 0.9, 45));
  cam.push(T.titulo(titulo, cx(M, 200, span(7), 260, 50), { tamanho: 104 }));
  acoes.forEach(([ic, tx], i) => {
    const y = 530 + i * 104;
    cam.push(vidro(cx(M, y, 440, 80, 50), "escuro"));
    cam.push(icone(ic, cx(M + 22, y + 18, 44, 44, 51), "nenhum"));
    cam.push(T.corpo(tx, cx(M + 84, y + 18, 340, 44, 51), { tamanho: 26, peso: "forte", vertical: "meio", ajuste: "largura" }));
  });
  cam.push(numeracao(total, total), ...rodape(f, 1350, { seta: false }));
  return tela("escuro", "fechamento", cam);
}

export type Gerador<R> = (r: R, f: FichaCarregada, variacao: "A" | "B" | "C" | "D", luz: "esquerda" | "direita") => Omit<Plano, "luz" | "notas" | "continuidade"> & { notas?: string[]; continuidade?: Plano["continuidade"] };
