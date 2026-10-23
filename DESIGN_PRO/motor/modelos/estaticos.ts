/**
 * Modelos estáticos 1 a 6 (C), cada um com as variações A, B e C. Coordenadas em 1080 × 1350 (Modelo 6: 1080 × 1920).
 */
import type { FichaCarregada } from "../ficha.js";
import type { Camada } from "../plano.js";
import type { Roteiro } from "../roteiro.js";
import { UserError } from "../infra/errors.js";
import { assinaturaTexto, atmosfera, col, cx, efeito, forma, icone, imagem, logo, M, medico, rodape, span, T, tela, veu, vidro, W, type Gerador } from "./comum.js";

const escuroPreferido = (f: FichaCarregada) => f.ficha.estilo.preferenciaFundo !== "claro";

/** Pílula de vidro com rótulo (etiqueta, selo). */
function pilula(texto: string, x: number, y: number, w: number, sobre: "claro" | "escuro", z = 55, alinhar: "esquerda" | "centro" | "direita" = "centro"): Camada[] {
  return [vidro(cx(x, y, w, 52, z), sobre), T.rotulo(texto, cx(x + 22, y + 13, w - 44, 28, z + 1), { tamanho: 20, alinhar, vertical: "meio" })];
}

/** Botão cheio na principal com texto de contraste calculado (aceite do Modelo 5). */
function botao(texto: string, x: number, y: number, w: number, z = 55): Camada[] {
  return [
    efeito("desfoqueProfundidade", cx(x + 20, y + 10, w - 40, 60, z - 1), { desfoque: 22, opacidade: 0.45 }),
    forma("linha", cx(x, y, w, 76, z), "principal", 1),
    T.corpo(texto, cx(x + 24, y + 18, w - 48, 40, z + 1), { tamanho: 28, peso: "forte", cor: "textoSobrePrincipal", alinhar: "centro", vertical: "meio", ajuste: "largura" }),
  ];
}

/* ---------- MODELO 1 · Autoridade com título gigante ---------- */
export const m01: Gerador<Roteiro<1>> = (r, f, v, luz) => {
  const etiqueta = r.etiqueta ?? f.ficha.medico.especialidade;
  const topo: Camada[] = [logo(), ...pilula(etiqueta, W - M - 380, M + 6, 380, v === "C" ? "claro" : "escuro"), T.subtitulo(r.fraseApoio, cx(M, 200, span(12), 80, 55), { alinhar: "centro", tamanho: 46, ajuste: "largura" })];
  if (v === "A") {
    return {
      modelo: 1, variacao: "A", formato: "4x5",
      telas: [tela("escuro", "capa", [
        atmosfera("noturno", [0.5, 0.42], 0.4),
        efeito("fiosDeLuz", cx(0, 260, W, 760, 5), { opacidade: 0.6, semente: 3 }),
        efeito("particulas", cx(0, 120, W, 1000, 6), { semente: 9 }),
        T.gigante(r.palavra.toUpperCase(), cx(M, 330, span(12), 380, 20), { tamanho: 330, efeitos: ["degrade", "eco"], alinhar: "centro", vertical: "meio" }),
        medico(cx(240, 340, 600, 1010, 30), luz, "retrato", "frente"),
        imagem("ELEMENTO_ESFERA", cx(780, 600, 130, 130, 32), { transparente: true, proporcao: "1:1", desfoque: 2 }),
        veu(990, 360, "fundoEscuro", 0.94, 40),
        ...topo,
        ...rodape(f),
      ])],
    };
  }
  if (v === "B") {
    return {
      modelo: 1, variacao: "B", formato: "4x5",
      telas: [tela("imagem", "capa", [
        imagem("CENA_CONSULTORIO", cx(0, 0, W, 1350, 1), { desfoque: 6, tingimento: 0.3 }),
        veu(0, 1350, "fundoEscuro", 0.55, 3),
        T.gigante(r.palavra.toUpperCase(), cx(M, 330, span(12), 380, 20), { tamanho: 330, efeitos: ["vazado"], alinhar: "centro", vertical: "meio", sombra: true }),
        medico(cx(240, 340, 600, 1010, 30), luz, "retrato", "frente"),
        veu(990, 360, "fundoEscuro", 0.94, 40),
        ...topo,
        ...rodape(f),
      ])],
    };
  }
  return {
    modelo: 1, variacao: "C", formato: "4x5",
    telas: [tela("claro", "capa", [
      atmosfera("editorial", [0.6, 0.3], 0.1),
      forma("arco", cx(270, 420, 540, 930, 15), "principal", 0.9, true),
      T.gigante(r.palavra.toUpperCase(), cx(M, 330, span(12), 380, 20), { tamanho: 330, cor: "fundoEscuro", alinhar: "centro", vertical: "meio" }),
      medico(cx(240, 340, 600, 1010, 30), luz, "retrato", "frente"),
      veu(1040, 310, "fundoClaro", 0.95, 40),
      ...topo,
      ...rodape(f),
    ])],
  };
};

/* ---------- MODELO 2 · Pergunta provocativa ---------- */
export const m02: Gerador<Roteiro<2>> = (r, f, v, luz) => {
  if (v !== "D" && !r.selo) throw new UserError(`Modelo 2 variação ${v} precisa de "selo" no roteiro`);
  const selo = r.selo ?? "";
  if (v === "D") {
    // Tipográfica, sem foto nem IA: afirmação (selo) em serifa, pergunta grande, apoio e botão; anéis e eixo como grafismo.
    const escuro = escuroPreferido(f);
    return {
      modelo: 2, variacao: "D", formato: "4x5",
      telas: [tela(escuro ? "escuro" : "claro", "capa", [
        escuro ? atmosfera("noturno", [0.75, 0.25], 0.1) : atmosfera("editorial", [0.75, 0.25], 0.06),
        forma("anel", cx(560, -260, 860, 860, 4), "apoio", 0.35),
        forma("anel", cx(700, -120, 580, 580, 4), "apoio", 0.22),
        forma("linha", cx(990, 0, 1.5, 620, 5), "principal", 0.35),
        logo(M, M - 10, 86, 76),
        // Com selo: selo, filete e pergunta de cima para baixo. Sem selo: pergunta assentada sobre o filete, perto do apoio.
        ...(r.selo
          ? [
              T.subtitulo(r.selo, cx(M, 300, span(10), 70, 50), { tamanho: 52, italico: false, peso: "normal" }),
              forma("linha", cx(M, 392, 72, 2, 50), "principal", 0.9),
              T.titulo(r.pergunta, cx(M, 424, span(11), 460, 50), { tamanho: 94, entrelinha: 1.12 }),
            ]
          : [
              T.titulo(r.pergunta, cx(M, 260, span(11), 560, 50), { tamanho: 94, entrelinha: 1.12, vertical: "base" }),
              forma("linha", cx(M, 852, 72, 2, 50), "principal", 0.9),
            ]),
        ...(r.apoio ? [T.corpo(r.apoio, cx(M, r.selo ? 900 : 884, span(10), 110, 50), { tamanho: 30, entrelinha: 1.45 })] : []),
        ...botao(r.chamada, M, 1062, 560),
        ...rodape(f),
      ])],
    };
  }
  if (v === "A") {
    const escuro = escuroPreferido(f);
    return {
      modelo: 2, variacao: "A", formato: "4x5",
      telas: [tela(escuro ? "escuro" : "claro", "capa", [
        escuro ? atmosfera("noturno", [0.72, 0.4], 0.3) : atmosfera("editorial", [0.7, 0.3], 0.1),
        T.gigante("?", cx(560, 120, 440, 760, 4), { tamanho: 720, efeitos: ["contorno"], alinhar: "direita", ajuste: "nenhum", cor: "destaqueAuto" }),
        efeito("aneis", cx(560, 420, 520, 620, 6), { opacidade: 0.35, rotacao: -16 }),
        forma("arco", cx(600, 520, 400, 830, 12), "principal", 0.95, true),
        medico(cx(530, 420, 540, 930, 30), luz, "retrato", "frente"),
        logo(),
        ...pilula(selo, M, 250, 400, escuro ? "escuro" : "claro", 55, "esquerda"),
        T.titulo(r.pergunta, cx(M, 340, span(6), 520, 50), { tamanho: 104 }),
        ...pilula(r.chamada, M, 1100, 340, escuro ? "escuro" : "claro"),
        ...rodape(f),
      ])],
      notas: ['interrogação gigante em contorno com opacidade reduzida via efeito "contorno"'],
    };
  }
  if (v === "B") {
    return {
      modelo: 2, variacao: "B", formato: "4x5",
      telas: [tela("escuro", "capa", [
        atmosfera("noturno", [0.5, 0.55], 0.42),
        efeito("particulas", cx(0, 300, W, 800, 6), { semente: 4 }),
        imagem("ELEMENTO_FOLICULO", cx(290, 470, 500, 600, 20), { transparente: true, proporcao: "4:5" }),
        efeito("sombraContato", cx(360, 1040, 360, 80, 19), { opacidade: 0.35 }),
        logo(),
        ...pilula(selo, (W - 420) / 2, 190, 420, "escuro"),
        T.titulo(r.pergunta, cx(M, 270, span(12), 220, 50), { tamanho: 96, alinhar: "centro" }),
        ...pilula(r.chamada, (W - 360) / 2, 1110, 360, "escuro"),
        ...rodape(f),
      ])],
    };
  }
  return {
    modelo: 2, variacao: "C", formato: "4x5",
    telas: [tela("imagem", "capa", [
      imagem("CENA_TEMA", cx(0, 0, W, 1350, 1), { tingimento: 0.3, assunto: "hands holding fallen hair strands" }),
      veu(520, 830, "fundoEscuro", 0.95, 10),
      logo(),
      ...pilula(selo, M, 640, 400, "escuro", 55, "esquerda"),
      T.titulo(r.pergunta, cx(M, 720, span(12), 330, 50), { tamanho: 118, sombra: true }),
      ...pilula(r.chamada, M, 1090, 340, "escuro"),
      ...rodape(f),
    ])],
  };
};

/* ---------- MODELO 3 · Frase manifesto editorial ---------- */
export const m03: Gerador<Roteiro<3>> = (r, f, v, luz) => {
  const assinaturaTopo = T.rotulo(assinaturaTexto(f), cx(M, M + 4, span(12), 28, 60), { tamanho: 20, alinhar: "centro", tracking: 0.08, caixaAlta: false });
  const frase = (x: number, w: number, alinhar: "centro" | "esquerda", y0: number, cor: "textoAuto" | "fundoClaro" = "textoAuto"): Camada[] => [
    T.titulo(r.linha1, cx(x, y0, w, 110, 50), { peso: "leve", tamanho: 84, alinhar, cor }),
    T.titulo(r.linha2, cx(x, y0 + 120, w, 110, 50), { peso: "leve", italico: true, tamanho: 84, alinhar, cor: "destaqueAuto" }),
    T.titulo(r.linha3, cx(x, y0 + 250, w, 170, 50), { tamanho: 136, caixaAlta: true, alinhar, ajuste: "largura", cor }),
  ];
  if (v === "A") {
    return {
      modelo: 3, variacao: "A", formato: "4x5",
      telas: [tela("claro", "manifesto", [
        atmosfera("editorial", [0.3, 0.2], 0.1),
        efeito("molduraEditorial", undefined, { distancia: 40, opacidade: 0.25 }),
        icone("aspas", cx(390, 240, 300, 240, 5), "nenhum", "destaqueAuto"),
        assinaturaTopo,
        ...frase(M, span(12), "centro", 470),
        logo((W - 170) / 2, 1180),
      ])],
      notas: ["aspas gigantes na principal: opacidade aplicada pelo ícone em destaque, conferir 14% na revisão"],
    };
  }
  if (v === "B") {
    return {
      modelo: 3, variacao: "B", formato: "4x5",
      telas: [tela("imagem", "manifesto", [
        imagem("TEXTURA_FIOS", cx(0, 0, W, 1350, 1), { duotom: true }),
        veu(0, 1350, "fundoEscuro", 0.55, 3),
        assinaturaTopo,
        ...frase(M, span(12), "centro", 420, "fundoClaro"),
        logo((W - 170) / 2, 1180),
      ])],
    };
  }
  return {
    modelo: 3, variacao: "C", formato: "4x5",
    telas: [tela(escuroPreferido(f) ? "escuro" : "claro", "manifesto", [
      atmosfera(escuroPreferido(f) ? "noturno" : "editorial", [0.75, 0.35], 0.2),
      { tipo: "foto", foto: "retrato", caixa: cx(0, 0, col(5) - 12, 1350, 10), tratamento: { gradacao: true, tingimento: 0, duotom: false, pb: true, desfoque: 0, opacidade: 1, ajuste: "cobrir", foco: [0.5, 0.25] } },
      assinaturaTopo,
      ...frase(col(5) + 12, span(7) - 12, "esquerda", 430),
    ])],
  };
};

/* ---------- MODELO 4 · Data de conscientização ---------- */
export const m04: Gerador<Roteiro<4>> = (r, f, v, luz) => {
  const base = (camadas: Camada[]) => ({ modelo: 4, variacao: v, formato: "4x5" as const, corCampanha: r.corCampanha, telas: [tela(escuroPreferido(f) ? "escuro" : "claro", "campanha", camadas)] });
  const fundo = escuroPreferido(f) ? atmosfera("noturno", [0.5, 0.45], 0.25) : atmosfera("editorial", [0.5, 0.3], 0.1);
  const sobre = escuroPreferido(f) ? "escuro" : "claro";
  if (v === "A") {
    return base([
      fundo,
      imagem("CENA_LACO", cx(330, 520, 700, 760, 10), { proporcao: "4:5", tingimento: 0, mascara: "arco" }),
      logo(),
      T.subtitulo(r.mes, cx(M, 190, span(7), 80, 50), { tamanho: 60 }),
      T.gigante(r.nomeCor.toUpperCase(), cx(M, 270, span(12), 230, 50), { tamanho: 230, cor: "campanha", ajuste: "largura" }),
      vidro(cx(M, 640, 470, 210, 50), sobre),
      T.rotulo(r.temaCampanha, cx(M + 30, 670, 410, 150, 51), { tamanho: 22, ajuste: "caixa" }),
      T.corpo(r.fraseCuidado, cx(M, 900, 420, 260, 50), { tamanho: 40 }),
      ...rodape(f),
    ]);
  }
  if (v === "B") {
    return base([
      fundo,
      medico(cx(440, 360, 640, 990, 30), luz),
      imagem("CENA_LACO", cx(660, 760, 120, 160, 32), { transparente: true, proporcao: "3:4", tingimento: 0 }),
      logo(),
      T.subtitulo(r.mes, cx(M, 220, span(6), 70, 50), { tamanho: 54 }),
      T.titulo(r.nomeCor, cx(M, 290, span(6), 160, 50), { tamanho: 150, cor: "campanha", ajuste: "largura" }),
      T.rotulo(r.temaCampanha, cx(M, 480, span(6), 90, 50), { tamanho: 22 }),
      T.corpo(r.fraseCuidado, cx(M, 620, span(6), 300, 50), { tamanho: 40 }),
      veu(1060, 290, escuroPreferido(f) ? "fundoEscuro" : "fundoClaro", 0.92, 40),
      ...rodape(f),
    ]);
  }
  return base([
    fundo,
    imagem("CENA_LACO", cx(0, 0, 1, 1, 0), { proporcao: "4:5", tingimento: 0, opacidade: 0 }),
    logo(),
    T.subtitulo(r.mes, cx(M, 250, span(12), 80, 50), { tamanho: 60, alinhar: "centro" }),
    T.gigante(r.nomeCor.toUpperCase(), cx(M, 360, span(12), 380, 50), { tamanho: 360, efeitos: ["vazado"], alinhar: "centro", ajuste: "largura" }),
    forma("linha", cx(M, 790, span(12), 2, 50), "campanha", 0.8),
    T.rotulo(r.temaCampanha, cx(M, 830, span(12), 40, 50), { tamanho: 22, alinhar: "centro" }),
    T.corpo(r.fraseCuidado, cx(col(1), 910, span(10), 200, 50), { tamanho: 42, alinhar: "centro" }),
    ...rodape(f),
  ]);
};

/* ---------- MODELO 5 · Convite para avaliação ---------- */
export const m05: Gerador<Roteiro<5>> = (r, f, v, luz) => {
  const info = (x: number, y0: number, w: number, passo: number, sobre: "claro" | "escuro"): Camada[] =>
    r.informacoes.flatMap((it, i) => [icone(it.icone, cx(x, y0 + i * passo, 60, 60, 52), "cheio"), T.corpo(it.texto, cx(x + 80, y0 + i * passo + 8, w - 80, 48, 52), { tamanho: 28, peso: "forte", vertical: "meio" })]).concat([]) as Camada[];
  if (v === "A") {
    const escuro = escuroPreferido(f);
    return {
      modelo: 5, variacao: "A", formato: "4x5",
      telas: [tela(escuro ? "escuro" : "claro", "convite", [
        escuro ? atmosfera("noturno", [0.75, 0.4], 0.3) : atmosfera("clinico"),
        forma("arco", cx(600, 430, 420, 920, 12), "principal", 0.95, true),
        medico(cx(560, 380, 520, 970, 30), luz, "retrato", "frente"),
        logo(),
        ...pilula(r.selo, M, 220, 360, escuro ? "escuro" : "claro", 55, "esquerda"),
        T.titulo(r.titulo, cx(M, 300, span(7), 240, 50), { tamanho: 92 }),
        T.corpo(r.subtitulo, cx(M, 560, span(6), 150, 50), { tamanho: 32 }),
        vidro(cx(M, 740, 520, 70 + r.informacoes.length * 84, 50), escuro ? "escuro" : "claro"),
        ...info(M + 30, 770, 470, 84, escuro ? "escuro" : "claro"),
        ...botao(r.botao, M, 1040, 440),
        ...rodape(f),
      ])],
    };
  }
  if (v === "B") {
    return {
      modelo: 5, variacao: "B", formato: "4x5",
      telas: [tela("imagem", "convite", [
        imagem("CENA_CONSULTORIO", cx(0, 0, W, 1350, 1), { desfoque: 8, tingimento: 0.3 }),
        veu(0, 700, "fundoEscuro", 0.75, 3, 1350, "cima"),
        medico(cx(300, 330, 640, 1020, 30), luz, "retrato", "frente"),
        logo(),
        ...pilula(r.selo, M, 200, 360, "escuro", 55, "esquerda"),
        T.titulo(r.titulo, cx(M, 280, span(8), 200, 50), { tamanho: 86, sombra: true }),
        vidro(cx(M, 880, span(12), 250, 50), "escuro"),
        ...r.informacoes.flatMap((it, i) => [icone(it.icone, cx(M + 30 + i * 300, 912, 52, 52, 52), "cheio"), T.corpo(it.texto, cx(M + 30 + i * 300, 976, 270, 80, 52), { tamanho: 24, peso: "forte" })] as Camada[]),
        ...botao(r.botao, M + 30, 1050 - 0, 400),
        ...rodape(f),
      ])],
    };
  }
  if (v === "D") {
    // Foto sangrada da médica (sem recorte), véu escuro na base e lista de itens em duas colunas.
    if (!r.lista) throw new UserError("Modelo 5 variação D precisa de \"lista\" no roteiro (2 a 6 itens)");
    const linhas = Math.ceil(r.lista.length / 2);
    const yLista = 1080 - linhas * 58;
    const yTitulo = yLista - 350;
    const local = r.informacoes[0]!;
    return {
      modelo: 5, variacao: "D", formato: "4x5",
      telas: [tela("imagem", "convite", [
        { tipo: "foto", foto: "retrato", caixa: cx(0, -140, W, 1490, 1), tratamento: { gradacao: true, tingimento: 0, duotom: false, pb: false, desfoque: 0, opacidade: 1, ajuste: "cobrir", foco: [0.5, 0] } },
        veu(yTitulo - 300, 1350 - yTitulo + 300, "fundoEscuro", 0.97, 10),
        veu(0, 260, "fundoEscuro", 0.55, 11, 1350, "cima"),
        logo(),
        ...pilula(r.selo, M, yTitulo - 70, 360, "escuro", 55, "esquerda"),
        T.titulo(r.titulo, cx(M, yTitulo, span(11), 200, 50), { tamanho: 88, sombra: true }),
        T.corpo(r.subtitulo, cx(M, yTitulo + 210, span(11), 90, 50), { tamanho: 28 }),
        forma("linha", cx(M, yLista - 26, span(12), 1.5, 50), "principal", 0.5),
        ...r.lista.flatMap((item, i) => {
          const x = i % 2 === 0 ? M : col(6), y = yLista + Math.floor(i / 2) * 58;
          return [icone("check", cx(x, y + 4, 36, 36, 52), "nenhum"), T.corpo(item, cx(x + 52, y, span(6) - 60, 44, 52), { tamanho: 30, peso: "forte", vertical: "meio", ajuste: "largura" })] as Camada[];
        }),
        ...botao(r.botao, M, 1100, 520),
        icone(local.icone, cx(M + 560, 1114, 44, 44, 55), "nenhum"),
        T.corpo(local.texto, cx(M + 614, 1110, span(12) - 614, 52, 55), { tamanho: 24, vertical: "meio", ajuste: "largura" }),
        ...rodape(f),
      ])],
      notas: ["variação D: foto profissional inteira, sem recorte; funciona fora do Mac"],
    };
  }
  return {
    modelo: 5, variacao: "C", formato: "4x5",
    telas: [tela("claro", "convite", [
      atmosfera("clinico"),
      imagem("ELEMENTO_CALENDARIO", cx(470, 300, 560, 560, 20), { transparente: true, proporcao: "1:1" }),
      medico(cx(-40, 760, 380, 590, 30), luz),
      logo(),
      ...pilula(r.selo, M, 200, 360, "claro", 55, "esquerda"),
      T.titulo(r.titulo, cx(M, 280, span(6), 300, 50), { tamanho: 84 }),
      ...info(col(6), 900, span(6), 76, "claro"),
      ...botao(r.botao, col(6), 1130 - 20, span(6)),
      ...rodape(f),
    ])],
  };
};

/* ---------- MODELO 6 · Capa de Reels (9:16) ---------- */
export const m06: Gerador<Roteiro<6>> = (r, f, v, luz) => {
  const H = 1920;
  const textos: Camada[] = [
    ...(r.selo ? pilula(r.selo, M, 1180, 340, "escuro") : []),
    T.gigante(r.palavra.toUpperCase(), cx(M, 1250, span(12), 200, 50), { tamanho: 190, ajuste: "largura", sombra: true }),
    T.subtitulo(r.complemento, cx(M, 1460, span(12), 110, 50), { tamanho: 44, sombra: true }),
    T.rotulo(assinaturaTexto(f), cx(M, 1590, span(12), 30, 60), { tamanho: 20, caixaAlta: false, tracking: 0.04 }),
  ];
  const topo = logo(M, 300, 170, 64);
  if (v === "A") {
    return { modelo: 6, variacao: "A", formato: "9x16", telas: [tela("imagem", "capa", [imagem("CENA_TEMA", cx(0, 0, W, H, 1), { proporcao: "9:16", tingimento: 0.3 }), veu(900, 1020, "fundoEscuro", 0.95, 10, H), topo, ...textos])] };
  }
  if (v === "B") {
    return {
      modelo: 6, variacao: "B", formato: "9x16",
      telas: [tela("escuro", "capa", [
        atmosfera("noturno", [0.5, 0.3], 0.4),
        efeito("fiosDeLuz", cx(0, 360, W, 900, 5), { opacidade: 0.65, semente: 21 }),
        medico(cx(90, 320, 900, 1300, 30), luz, "retrato", "meio"),
        veu(1060, 860, "fundoEscuro", 0.95, 40, H),
        topo,
        ...textos,
      ])],
    };
  }
  return {
    modelo: 6, variacao: "C", formato: "9x16",
    telas: [tela("escuro", "capa", [
      atmosfera("noturno", [0.5, 0.36], 0.42),
      efeito("particulas", cx(0, 320, W, 900, 6), { semente: 2 }),
      imagem("ELEMENTO_ESFERA", cx(190, 420, 700, 700, 20), { transparente: true, proporcao: "1:1" }),
      topo,
      ...textos,
    ])],
  };
};
