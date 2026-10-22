/**
 * Plano de arte (referência A2): a fonte da verdade de cada post.
 * Todo PNG é reproduzível a partir do plano, da ficha e dos assets em cache.
 * Os modelos produzem planos que referenciam tokens da ficha, nunca HEX nem nome de fonte.
 */
import { z } from "zod";

export const TOKENS_COR = ["principal", "apoio", "fundoClaro", "fundoEscuro", "textoSobreClaro", "textoSobreEscuro", "acento"] as const;
/** Tokens de cor e derivados permitidos nos planos (calculados da ficha em composicao/camadas.ts). */
export const TokenCor = z.enum([
  ...TOKENS_COR,
  "principalClara",
  "principalEscura",
  /** cor de texto ideal sobre o fundo da tela (calculada por contraste) */
  "textoAuto",
  /** cor de destaque ideal sobre o fundo da tela: principal, ou seu tom ajustado se o contraste não bastar */
  "destaqueAuto",
  /** melhor cor de texto sobre a principal (botões, pílulas cheias) */
  "textoSobrePrincipal",
  /** cor oficial da campanha (Modelo 4): só no laço e no nome da cor */
  "campanha",
]);
export type TokenCor = z.infer<typeof TokenCor>;

export const Caixa = z.object({ x: z.number(), y: z.number(), w: z.number().positive(), h: z.number().positive(), rotacao: z.number().optional(), z: z.number().int() });
export type Caixa = z.infer<typeof Caixa>;

export const Mascara = z.object({ forma: z.enum(["arco", "circulo", "retangulo", "elipse"]), raio: z.number().optional(), suavizar: z.number().optional() });
export const Tratamento = z.object({
  gradacao: z.boolean().default(true),
  tingimento: z.number().min(0).max(0.6).default(0.25),
  duotom: z.boolean().default(false),
  pb: z.boolean().default(false),
  desfoque: z.number().min(0).max(40).default(0),
  opacidade: z.number().min(0).max(1).default(1),
  ajuste: z.enum(["cobrir", "conter"]).default("cobrir"),
  foco: z.tuple([z.number(), z.number()]).optional(),
});
export type Tratamento = z.infer<typeof Tratamento>;

export const PedidoImagem = z.object({
  /** Código da cena na biblioteca (cenas/cenas.json), ex.: ELEMENTO_FOLICULO. */
  cena: z.string(),
  assunto: z.string().optional(),
  composicao: z.string().optional(),
  proporcao: z.enum(["1:1", "4:5", "9:16", "3:4", "16:9"]).default("4:5"),
  fundoTransparente: z.boolean().default(false),
  variacoes: z.number().int().min(1).max(4).default(3),
  semente: z.number().int().optional(),
});
export type PedidoImagem = z.infer<typeof PedidoImagem>;

export const Integracao = z.object({
  casamentoCor: z.number().min(0).max(0.6).default(0.45),
  luzRecorte: z.object({ lado: z.enum(["esquerda", "direita"]), largura: z.number().min(0).max(60).default(30), opacidade: z.number().min(0).max(1).default(0.5) }).optional(),
  sombraContato: z.number().min(0).max(0.6).default(0.28),
  oclusao: z.number().min(0).max(0.5).default(0.18),
});
export type Integracao = z.infer<typeof Integracao>;

export const EstiloTexto = z.object({
  fonte: z.enum(["titulo", "texto", "destaque"]).default("texto"),
  peso: z.enum(["forte", "leve", "normal"]).default("normal"),
  italico: z.boolean().default(false),
  tamanho: z.number().positive(),
  entrelinha: z.number().positive().optional(),
  tracking: z.number().default(0),
  caixaAlta: z.boolean().default(false),
  cor: TokenCor.default("textoAuto"),
  corDestaque: TokenCor.default("destaqueAuto"),
  alinhar: z.enum(["esquerda", "centro", "direita"]).default("esquerda"),
  vertical: z.enum(["topo", "meio", "base"]).default("topo"),
  /** caixa: reduz até caber na caixa (mínimo 70%); largura: só pela largura; nenhum */
  ajuste: z.enum(["caixa", "largura", "nenhum"]).default("caixa"),
  /** efeitos tipográficos (B5): degrade (10), eco (11), vazado (12) */
  efeitos: z.array(z.enum(["degrade", "eco", "vazado", "contorno"])).default([]),
  numeros: z.enum(["alinhados", "proporcionais", "padrao"]).default("padrao"),
  sombra: z.boolean().default(false),
});
export type EstiloTexto = z.infer<typeof EstiloTexto>;

export const NomeEfeito = z.enum([
  "atmosferaNoturna",
  "atmosferaEditorial",
  "atmosferaClinica",
  "atmosferaCor",
  "grao",
  "vinheta",
  "luzRecorte",
  "sombraContato",
  "vidro",
  "textoDegrade",
  "ecoContorno",
  "textoVazado",
  "arco",
  "aneis",
  "fiosDeLuz",
  "particulas",
  "desfoqueProfundidade",
  "molduraEditorial",
  "carimbo",
  "duotom",
]);
export type NomeEfeito = z.infer<typeof NomeEfeito>;

const Params = z.record(z.string(), z.union([z.number(), z.string(), z.boolean()])).default({});

export const Camada = z.discriminatedUnion("tipo", [
  z.object({ tipo: z.literal("atmosfera"), estilo: z.enum(["noturno", "editorial", "clinico", "cor"]), focoLuz: z.tuple([z.number(), z.number()]).default([0.5, 0.4]), intensidade: z.number().min(0).max(1).default(0.35) }),
  z.object({ tipo: z.literal("imagemGerada"), pedidoImagem: PedidoImagem, caixa: Caixa, tratamento: Tratamento.prefault({}), mascara: Mascara.optional() }),
  z.object({ tipo: z.literal("fotoMedico"), foto: z.string(), caixa: Caixa, integracao: Integracao.prefault({}), plano: z.enum(["atras", "meio", "frente"]).default("meio") }),
  z.object({ tipo: z.literal("foto"), foto: z.string(), caixa: Caixa, mascara: Mascara.optional(), tratamento: Tratamento.prefault({}) }),
  z.object({
    tipo: z.literal("texto"),
    papel: z.enum(["gigante", "titulo", "subtitulo", "corpo", "rotulo", "numero", "assinatura"]),
    conteudo: z.string(),
    caixa: Caixa,
    estilo: EstiloTexto,
  }),
  z.object({ tipo: z.literal("forma"), forma: z.enum(["arco", "circulo", "faixa", "moldura", "linha", "anel"]), caixa: Caixa, cor: TokenCor, opacidade: z.number().min(0).max(1).default(1), contornoDuplo: z.boolean().default(false), preenchida: z.boolean().default(true) }),
  z.object({ tipo: z.literal("vidro"), caixa: Caixa, sobre: z.enum(["claro", "escuro"]) }),
  z.object({ tipo: z.literal("efeito"), efeito: NomeEfeito, caixa: Caixa.optional(), parametros: Params }),
  /** extensão: ícone de linha da biblioteca do motor (check, curtir, comentar, enviar, salvar, calendario, local, whatsapp, seta) */
  z.object({ tipo: z.literal("icone"), nome: z.string(), caixa: Caixa, cor: TokenCor.default("destaqueAuto"), circulo: z.enum(["nenhum", "vidro", "cheio"]).default("nenhum") }),
  /** extensão: véu em degradê da cor de fundo (leitura sobre foto; B6 "foto sangrada com véu", B7 item 5) */
  z.object({ tipo: z.literal("veu"), caixa: Caixa, cor: TokenCor.default("fundoEscuro"), de: z.number().min(0).max(1).default(0), ate: z.number().min(0).max(1).default(0.92), direcao: z.enum(["baixo", "cima", "esquerda", "direita"]).default("baixo") }),
  /** extensão: logo da ficha (ou monograma, se não houver arquivo) */
  z.object({ tipo: z.literal("logo"), caixa: Caixa }),
]);
export type Camada = z.infer<typeof Camada>;

export const FUNDOS = ["escuro", "claro", "suave", "principal", "imagem"] as const;
export const Tela = z.object({ fundo: z.enum(FUNDOS), papel: z.string().default(""), camadas: z.array(Camada) });
export type Tela = z.infer<typeof Tela>;

/** Elemento que atravessa telas (B2, princípio 11). Coordenadas na faixa contínua: x vai de 0 a 1080 × número de telas. */
export const ElementoContinuo = z.object({
  efeito: z.enum(["fiosDeLuz", "aneis", "palavra", "imagem", "linha"]),
  telas: z.tuple([z.number().int().min(1), z.number().int().min(1)]),
  caixa: Caixa,
  parametros: Params,
});
export type ElementoContinuo = z.infer<typeof ElementoContinuo>;

export const Plano = z.object({
  modelo: z.number().int().min(1).max(12),
  variacao: z.enum(["A", "B", "C", "D"]),
  formato: z.enum(["4x5", "9x16"]),
  /** direção da luz do post (B2, princípio 3) */
  luz: z.enum(["esquerda", "direita", "frontal"]).default("esquerda"),
  telas: z.array(Tela).min(1).max(10),
  continuidade: z.array(ElementoContinuo).default([]),
  /** cor oficial da campanha de saúde (conteúdo do roteiro do Modelo 4, não da marca) */
  corCampanha: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  notas: z.array(z.string()).default([]),
});
export type Plano = z.infer<typeof Plano>;

export const DIMENSOES = { "4x5": { w: 1080, h: 1350 }, "9x16": { w: 1080, h: 1920 } } as const;

/** Atalho para caixas nos geradores de plano. */
export const cx = (x: number, y: number, w: number, h: number, z = 10, rotacao?: number): Caixa => ({ x, y, w, h, z, ...(rotacao ? { rotacao } : {}) });
