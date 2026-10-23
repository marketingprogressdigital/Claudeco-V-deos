/**
 * Modelos de carrossel (C). Coordenadas por tela em 1080 × 1350; elementos contínuos em coordenadas da faixa
 * (x de 0 a 1080 × número de telas), desenhados recortados em cada tela.
 */
import { UserError } from "../infra/errors.js";
import type { Camada, Plano, Tela } from "../plano.js";
import type { Roteiro } from "../roteiro.js";
import { atmosfera, col, cx, efeito, fechamentoAcoes, forma, icone, logo, M, medico, numeracao, rodape, span, T, tela, veu, vidro, W, type Gerador } from "./comum.js";

/** Foto da ficha por índice (retratos), ou o retrato padrão. */
const retrato = (fotos: string[], i: number) => fotos[i % Math.max(1, fotos.length)] ?? "retrato";

/* ---------- MODELO 9 · Lista numerada (5 a 8 telas) ---------- */
export const m09: Gerador<Roteiro<9>> = (r, f, v, luz) => {
  if (v === "D") return m09D(r, f);
  if (!r.conclusao) throw new UserError(`Modelo 9 variação ${v} precisa de "conclusao" no roteiro`);
  const conclusaoTexto = r.conclusao;
  const total = r.itens.length + 3;
  const fotos = f.ficha.fotos.retratos.map((x) => x.arquivo);
  const capaEscura = v === "B";
  const fundoCapa = capaEscura ? "escuro" : "claro";

  // Capa: médico saindo do arco, palavra gigante atrás da cabeça (profundidade), título em itálico à direita.
  const arcoX = luz === "esquerda" ? 80 : W - 80 - 500;
  const capa = tela(fundoCapa, "capa", [
    atmosfera(capaEscura ? "noturno" : "editorial", [0.3, 0.35], 0.3),
    T.gigante(r.capa.palavra, cx(M, 150, span(12), 300, 22), { tamanho: 330, efeitos: ["degrade"], alinhar: "centro", vertical: "meio", peso: "leve" }),
    forma("arco", cx(arcoX, 470, 500, 880, 24), "apoio", 1, true),
    medico(cx(arcoX - 100, 250, 700, 1100, 30), luz, retrato(fotos, 0), "frente"),
    veu(1060, 290, capaEscura ? "fundoEscuro" : "fundoClaro", 0.97, 45),
    T.rotulo(f.ficha.medico.especialidade.toUpperCase(), cx(620, 560, 380, 30, 50), { tamanho: 19, tracking: 0.22 }),
    forma("linha", cx(620, 604, 64, 2, 50), "destaqueAuto"),
    T.subtitulo(r.capa.titulo, cx(620, 636, 380, 330, 50), { tamanho: 52, italico: false, peso: "normal", entrelinha: 1.06 }),
    icone("seta", cx(620, 1000, 46, 46, 50), "cheio"),
    T.rotulo("ARRASTE PARA O LADO", cx(684, 1010, 300, 28, 50), { tamanho: 17, tracking: 0.2, vertical: "meio" }),
    logo(M, M, 64, 64),
    numeracao(1, total),
    ...rodape(f),
  ]);

  // Itens: número gigante em degradê com eco, linha de acento, título e cartão de vidro com o texto.
  const itens: Tela[] = r.itens.map((it, i) => {
    const escura = v === "C" ? false : i % 2 === 0;
    const n = String(i + 1).padStart(2, "0");
    const cam: Camada[] = [
      atmosfera(escura ? "noturno" : "editorial", [0.8, 0.25], 0.32),
      forma("anel", cx(560, 70, 640, 640, 6), "principal", escura ? 0.22 : 0.3),
      forma("anel", cx(640, 150, 480, 480, 6), "principal", escura ? 0.12 : 0.18),
      T.numero(n, cx(M, 196, 600, 380, 20), { tamanho: 440 }),
      forma("linha", cx(M, 560, 96, 3, 30), "destaqueAuto"),
      T.titulo(it.titulo, cx(M, 590, span(11), 190, 30), { tamanho: 76, entrelinha: 1.0 }),
      vidro(cx(M, 820, span(12), 320, 25), escura ? "escuro" : "claro"),
      T.corpo(it.texto, cx(M + 48, 852, span(12) - 96, 256, 30), { tamanho: 35, vertical: "meio", entrelinha: 1.42 }),
      logo(M, M, 52, 52),
      numeracao(i + 2, total),
      ...rodape(f),
    ];
    return tela(escura ? "escuro" : "claro", `item ${i + 1}`, cam);
  });

  // Conclusão em cor: check, "Importante" e a conclusão, com a médica à direita.
  const ladoMedico = luz === "esquerda" ? 520 : -40;
  const conclusao = tela("principal", "conclusao", [
    atmosfera("cor", [0.25, 0.3], 0.18),
    forma("arco", cx(ladoMedico + 70, 520, 470, 830, 20), "fundoEscuro", 0.16, true),
    medico(cx(ladoMedico, 360, 600, 990, 30), luz, retrato(fotos, 5)),
    veu(1110, 240, "principal", 0.96, 45),
    icone("check", cx(M, 230, 110, 110, 50), "cheio", "textoAuto"),
    T.rotulo("IMPORTANTE", cx(M, 400, 400, 30, 50), { tamanho: 20, tracking: 0.24 }),
    T.titulo(conclusaoTexto, cx(M, 450, span(8) - 10, 560, 50), { tamanho: 64, entrelinha: 1.08, corDestaque: "textoAuto" }),
    logo(M, M, 52, 52),
    numeracao(total - 1, total, 25), // fundo de meio tom: corpo maior para manter 4,5:1 medido no PNG
    ...rodape(f),
  ]);

  const fechamento = fechamentoAcoes(f, total, "Esse conteúdo *te ajudou?*", true, luz, retrato(fotos, 4));
  fechamento.camadas.push(logo(M, M, 52, 52));

  return {
    modelo: 9,
    variacao: v,
    formato: "4x5",
    telas: [capa, ...itens, conclusao, fechamento],
    continuidade: [
      // fios de luz atravessando todas as telas de itens (B2, princípio 11)
      { efeito: "fiosDeLuz", telas: [2, r.itens.length + 1], caixa: cx(W, 420, W * r.itens.length, 520, 8), parametros: { opacidade: 0.55, semente: 21, quantidade: 6, amplitude: 0.3 } },
    ],
    notas: [`Ritmo: ${fundoCapa}, itens ${v === "C" ? "claros" : "alternando escuro e claro"}, conclusão na principal, fechamento escuro`],
  };
};

/**
 * Modelo 9, variação D: capa e conclusão com foto inteira (sem recorte, funciona fora do Mac), itens só tipográficos
 * e centralizados em fundos alternados, sem tela extra de ações: capa + itens + conclusão. "capa.palavra" não é usada.
 * Fotos: retrato 0 na capa; retrato 1 na conclusão, se existir (senão a conclusão é tipográfica com o monograma).
 */
function m09D(r: Roteiro<9>, f: Parameters<Gerador<Roteiro<9>>>[1]): ReturnType<Gerador<Roteiro<9>>> {
  const semConclusao = !r.conclusao;
  if (semConclusao && r.comparativo) throw new UserError('Modelo 9 variação D: "comparativo" precisa de "conclusao"');
  const total = r.itens.length + (semConclusao ? 1 : 2);
  const fotos = f.ficha.fotos.retratos;
  // Marcas de fundo escuro (ex.: escolas): itens alternam fundo escuro e cor de apoio, detalhes na cor principal.
  const marcaEscura = f.ficha.estilo.preferenciaFundo === "escuro";
  const foto = (arquivo: string, foco: [number, number]): Camada => ({ tipo: "foto", foto: arquivo, caixa: cx(0, 0, W, 1350, 1), tratamento: { gradacao: true, tingimento: 0, duotom: false, pb: false, desfoque: 0, opacidade: 1, ajuste: "cobrir", foco } });
  // Fontes de texto com ascendente alto (ex.: Manrope) passam da margem de 80 px no topo: desce 4 px nessas marcas.
  const pagina = (i: number): Camada => (marcaEscura ? { ...numeracao(i, total, 20), caixa: cx(W - M - 160, M + 4, 160, 30, 60) } as Camada : numeracao(i, total, 20));
  const marcaTopo = (i: number): Camada[] => [marcaEscura ? logo(M, M - 10, 86, 76) : logo(M, M, 66, 44), pagina(i)];

  // Capa com foto: foto limpa no alto; título claro, itálico e encorpado na base, sobre véu escuro.
  // Capa sem foto: tipográfica, assinatura da marca no alto (fotos.detalhe "assets/..."), palavra gigante e grafismos de eixo.
  const assinaturaMarca = f.ficha.fotos.detalhe.find((x) => x.arquivo.startsWith("assets/"))?.arquivo;
  const capa = fotos[0]
    ? tela("escuro", "capa", [
        foto(fotos[0].arquivo, [0.5, 0.75]),
        veu(0, 220, "fundoEscuro", 0.7, 10, 1350, "cima"),
        veu(600, 750, "fundoEscuro", 0.96, 11),
        ...marcaTopo(1),
        T.titulo(r.capa.titulo, cx(M, 892, span(9), 300, 50), { tamanho: 64, peso: "forte", italico: true, entrelinha: 1.16, sombra: true, vertical: "topo" }),
        ...(r.capa.subtitulo ? [T.corpo(r.capa.subtitulo, cx(M, 1150, span(9), 40, 50), { tamanho: 26 })] : []),
        ...rodape(f),
      ])
    : tela("escuro", "capa", [
        atmosfera("noturno", [0.5, 0.42], 0.1),
        forma("anel", cx(190, 330, 700, 700, 4), "apoio", 0.35),
        forma("anel", cx(300, 440, 480, 480, 4), "apoio", 0.22),
        forma("linha", cx(0, 680, W, 1.5, 5), "principal", 0.3),
        forma("linha", cx(539, 300, 1.5, 760, 5), "principal", 0.18),
        ...(assinaturaMarca
          ? [{ tipo: "foto", foto: assinaturaMarca, caixa: cx((W - 190) / 2, 96, 190, 212, 60), tratamento: { gradacao: false, tingimento: 0, duotom: false, pb: false, desfoque: 0, opacidade: 1, ajuste: "conter" } } as Camada]
          : [logo((W - 150) / 2, 110, 150, 100)]),
        pagina(1),
        T.gigante(r.capa.palavra, cx(M, 420, span(12), 250, 50), { tamanho: 230, peso: "forte", alinhar: "centro", vertical: "meio", efeitos: [] }),
        forma("linha", cx((W - 72) / 2, 708, 72, 2, 50), "principal", 0.9),
        T.titulo(r.capa.titulo, cx(M, 740, span(12), 170, 50), { tamanho: 66, peso: "forte", alinhar: "centro", entrelinha: 1.16 }),
        ...(r.capa.subtitulo ? [T.corpo(r.capa.subtitulo, cx(col(1), 930, span(10), 110, 50), { tamanho: 30, alinhar: "centro", entrelinha: 1.4 })] : []),
        ...rodape(f),
      ]);

  // Com comparativo a conclusão é escura, então o último item não pode ser escuro.
  const ciclo = marcaEscura
    ? (["escuro", "apoio"] as const)
    : r.comparativo
      ? (["escuro", "claro", "principal", "claro", "escuro"] as const)
      : (["escuro", "claro", "principal", "escuro", "claro"] as const);
  const itens: Tela[] = r.itens.map((it, i) => {
    const n = String(i + 1).padStart(2, "0");
    const fundo = ciclo[i % ciclo.length]!;
    const ultimo = i === r.itens.length - 1;
    const fecho = ultimo && semConclusao && r.rodapeFinal ? r.rodapeFinal : undefined;
    const sobe = fecho ? 110 : 0;
    const atm: Camada[] = fundo === "apoio" ? [] : [atmosfera(fundo === "escuro" ? "noturno" : fundo === "principal" ? "cor" : "editorial", [0.5, 0.35], 0.06)];
    return tela(fundo, `item ${i + 1}`, [
      ...atm,
      ...marcaTopo(i + 2),
      T.rotulo(it.rotulo ?? n, cx(M, 330 - sobe, span(12), 30, 50), { tamanho: 22, tracking: it.rotulo ? 0.22 : 0.3, alinhar: "centro", ajuste: it.rotulo ? "largura" : "nenhum" }),
      forma("linha", cx((W - 56) / 2, 378 - sobe, 56, 2, 50), marcaEscura ? "principal" : "textoAuto", marcaEscura ? 0.9 : 0.5),
      T.titulo(it.titulo, cx(M, 410 - sobe, span(12), 360, 50), { tamanho: 92, peso: "leve", alinhar: "centro", vertical: "base", entrelinha: 1.16 }),
      T.corpo(it.texto, cx(col(1), 820 - sobe, span(10), 300, 50), { tamanho: 34, alinhar: "centro", entrelinha: 1.45 }),
      ...(fecho
        ? [forma("linha", cx((W - 56) / 2, 1004, 56, 2, 50), marcaEscura ? "principal" : "textoAuto", 0.9), T.corpo(fecho, cx(col(1), 1030, span(10), 120, 50), { tamanho: 27, peso: "forte", alinhar: "centro", entrelinha: 1.4 })]
        : []),
      ...rodape(f),
    ]);
  });

  const polaroide = (arquivo: string, legenda: string, x: number, y: number, giro: number): Camada[] => [
    efeito("desfoqueProfundidade", cx(x + 30, y + 40, 400, 520, 20, giro), { desfoque: 30, opacidade: 0.55 }),
    forma("faixa", cx(x, y, 420, 540, 21, giro), "fundoClaro"),
    { tipo: "foto", foto: arquivo, caixa: cx(x + 22, y + 22, 376, 420, 22, giro), tratamento: { gradacao: true, tingimento: 0, duotom: false, pb: false, desfoque: 0, opacidade: 1, ajuste: "cobrir", foco: [0.5, 0.35] } },
    T.subtitulo(legenda, cx(x + 22, y + 456, 376, 64, 23, giro), { tamanho: 44, cor: "fundoEscuro", alinhar: "centro", vertical: "meio", ajuste: "nenhum" }),
  ];
  const conclusaoTexto = r.conclusao ?? "";
  const fotoFinal = fotos[1]?.arquivo;
  const conclusao = semConclusao
    ? undefined
    : r.comparativo
    ? tela("escuro", "conclusao", [
        atmosfera("noturno", [0.5, 0.55], 0.08),
        ...marcaTopo(total),
        T.titulo(conclusaoTexto, cx(M, 170, span(12), 230, 50), { tamanho: 64, peso: "leve", alinhar: "centro", vertical: "meio", entrelinha: 1.16 }),
        ...polaroide(r.comparativo.antes, "antes", 90, 470, -4),
        ...polaroide(r.comparativo.depois, "depois", 570, 450, 3),
        T.corpo("Cada caso é avaliado individualmente.", cx(M, 1056, span(12), 40, 50), { tamanho: 24, alinhar: "centro", vertical: "meio" }),
        ...rodape(f),
      ])
    : fotoFinal
    ? tela("imagem", "conclusao", [
        foto(fotoFinal, [0.5, 0.15]),
        veu(560, 790, "fundoEscuro", 0.95, 10),
        ...marcaTopo(total),
        T.titulo(conclusaoTexto, cx(M, 860, span(12), 300, 50), { tamanho: 76, peso: "leve", entrelinha: 1.16 }),
        ...rodape(f),
      ])
    : tela("claro", "conclusao", [
        atmosfera("editorial", [0.5, 0.3], 0.06),
        numeracao(total, total, 20),
        logo((W - 150) / 2, 300, 150, 100),
        T.titulo(conclusaoTexto, cx(M, 470, span(12), 420, 50), { tamanho: 92, peso: "leve", alinhar: "centro", vertical: "meio", entrelinha: 1.16 }),
        forma("linha", cx((W - 56) / 2, 930, 56, 2, 50), "textoAuto", 0.5),
        ...rodape(f),
      ]);

  return { modelo: 9, variacao: "D", formato: "4x5", telas: [capa, ...itens, ...(conclusao ? [conclusao] : [])], notas: ["variação D: fotos inteiras sem recorte; itens tipográficos alternando fundos da marca"] };
}

/* ---------- MODELO 7 · Carrossel educativo (7 telas) ---------- */
export const m07: Gerador<Roteiro<7>> = (r, f, v, luz) => {
  const total = 7;
  const fotos = f.ficha.fotos.retratos.map((x) => x.arquivo);
  const tit = { oQueE: "O que *é*", porQue: "Por que *acontece*", sinais: "Sinais de *atenção*", tratamento: "Como *tratar*", ...r.titulos };
  const rotulo = (n: number, txt: string, z = 50) => T.rotulo(`${String(n).padStart(2, "0")}  ${txt}`, cx(M, 200, 600, 28, z), { tamanho: 19, tracking: 0.24 });
  const base = (i: number) => [logo(M, M, 60, 60), numeracao(i, total), ...rodape(f)];

  // 1. Capa escura: médica grande à direita sobre arco, título à esquerda
  const capa = tela("escuro", "capa", [
    atmosfera("noturno", [0.72, 0.32], 0.4),
    forma("arco", cx(560, 330, 450, 1020, 20), "principal", 0.13, true),
    medico(cx(137, -20, 1267, 1900, 30), luz, retrato(fotos, 0), "frente"),
    veu(1010, 340, "fundoEscuro", 0.97, 45),
    vidro(cx(M, 300, 330, 52, 49), "escuro"),
    T.rotulo(r.capa.selo, cx(M + 22, 313, 286, 28, 50), { tamanho: 18, alinhar: "centro", vertical: "meio" }),
    T.titulo(r.capa.titulo, cx(M, 390, 520, 400, 50), { tamanho: 88, entrelinha: 1.02, vertical: "topo" }),
    forma("linha", cx(M, 820, 72, 3, 50), "destaqueAuto"),
    T.corpo(r.capa.subtitulo, cx(M, 850, 460, 150, 50), { tamanho: 32, peso: "normal", entrelinha: 1.35 }),
    icone("seta", cx(M, 1040, 46, 46, 50), "cheio"),
    T.rotulo("ARRASTE PARA O LADO", cx(M + 64, 1050, 320, 28, 50), { tamanho: 17, tracking: 0.2, vertical: "meio" }),
    ...base(1),
  ]);

  // 2. O que é: texto à esquerda, ilustração à direita
  const oQueE = tela("claro", "o que e", [
    atmosfera("editorial", [0.8, 0.3], 0.25),
    rotulo(1, "ENTENDA"),
    T.titulo(tit.oQueE, cx(M, 250, span(12), 210, 30), { tamanho: 78, entrelinha: 1.02 }),
    forma("circulo", cx(560, 520, 460, 460, 8), "principal", 0.16),
    icone("il_doadora", cx(590, 540, 400, 400, 20), "nenhum", "textoAuto"),
    T.rotulo("ÁREA DOADORA", cx(600, 1000, 220, 26, 30), { tamanho: 16, tracking: 0.18 }),
    T.rotulo("ÁREA QUE RECEBE", cx(740, 500, 260, 26, 30), { tamanho: 16, tracking: 0.18, alinhar: "direita" }),
    T.corpo(r.oQueE, cx(M, 520, 450, 560, 30), { tamanho: 34, entrelinha: 1.45 }),
    ...base(2),
  ]);

  // 3. Por que: frase grande com aspas (tela tipográfica)
  const porQue = tela("claro", "por que", [
    atmosfera("editorial", [0.2, 0.7], 0.25),
    rotulo(2, "O PONTO CENTRAL"),
    T.titulo(tit.porQue, cx(M, 250, span(12), 210, 30), { tamanho: 78, entrelinha: 1.02 }),
    icone("aspas", cx(M, 520, 90, 90, 30), "nenhum"),
    T.subtitulo(r.porQue, cx(M, 640, span(12), 470, 30), { tamanho: 46, peso: "leve", italico: false, entrelinha: 1.3 }),
    ...base(3),
  ]);

  // 4. Sinais (lista com checks)
  const linhas: Camada[] = r.sinais.flatMap((s, i) => {
    const y = 540 + i * 140;
    return [
      icone("check", cx(M, y, 64, 64, 30), "cheio", "textoAuto"),
      T.corpo(s, cx(M + 96, y + 2, span(12) - 96, 64, 30), { tamanho: 36, peso: "forte", vertical: "meio", entrelinha: 1.2 }),
      forma("linha", cx(M + 96, y + 104, span(12) - 96, 1.2, 25), "textoAuto", 0.18),
    ];
  });
  const sinais = tela("claro", "sinais", [
    atmosfera("editorial", [0.85, 0.2], 0.25),
    rotulo(3, "PARA AVALIAR"),
    T.titulo(tit.sinais, cx(M, 250, span(12), 210, 30), { tamanho: 78, entrelinha: 1.02 }),
    ...linhas,
    ...base(4),
  ]);

  // 5. Tratamento: foto real em arco à direita, texto à esquerda
  const tratamento = tela("suave", "tratamento", [
    atmosfera("editorial", [0.7, 0.4], 0.25),
    rotulo(4, "ATENÇÃO"),
    T.titulo(tit.tratamento, cx(M, 250, 520, 300, 30), { tamanho: 74, entrelinha: 1.02 }),
    forma("arco", cx(600, 330, 400, 760, 18), "principal", 0.35, true, false),
    { tipo: "foto", foto: retrato(fotos, 2), caixa: cx(620, 350, 360, 720, 20), mascara: { forma: "arco" }, tratamento: { gradacao: true, tingimento: 0, duotom: false, pb: false, desfoque: 0, opacidade: 1, ajuste: "cobrir", foco: [0.45, 0.25] } },
    T.corpo(r.tratamento, cx(M, 600, 470, 500, 30), { tamanho: 34, entrelinha: 1.45 }),
    ...base(5),
  ]);

  // 6. Alerta na cor de destaque, com a médica
  const alerta = tela("principal", "alerta", [
    atmosfera("cor", [0.25, 0.3], 0.16),
    medico(cx(470, 120, 900, 1350, 30), luz, retrato(fotos, 1)),
    veu(1080, 270, "principal", 0.97, 45),
    icone("check", cx(M, 230, 100, 100, 50), "cheio", "textoAuto"),
    T.rotulo("IMPORTANTE", cx(M, 380, 400, 30, 50), { tamanho: 20, tracking: 0.24 }),
    T.titulo(r.alerta, cx(M, 430, 560, 560, 50), { tamanho: 62, entrelinha: 1.08, corDestaque: "textoAuto" }),
    logo(M, M, 60, 60),
    numeracao(6, total, 25),
    ...rodape(f),
  ]);

  const fechamento = fechamentoAcoes(f, total, "Seu caso *fecha essa conta?*", true, luz, retrato(fotos, 2));
  fechamento.camadas.push(logo(M, M, 60, 60));

  return {
    modelo: 7,
    variacao: v,
    formato: "4x5",
    telas: [capa, oQueE, porQue, sinais, tratamento, alerta, fechamento],
    continuidade: <Plano["continuidade"]>[
      { efeito: "fiosDeLuz", telas: [1, 2], caixa: cx(300, 980, 1500, 300, 8), parametros: { opacidade: 0.5, semente: 7, quantidade: 5, amplitude: 0.35 } },
      { efeito: "palavra", telas: [2, 5], caixa: cx(W + 40, 1060, W * 4, 300, 4), parametros: { texto: r.palavraFundo, tamanho: 300, opacidade: 0.04 } },
      { efeito: "aneis", telas: [4, 5], caixa: cx(W * 3 + 760, 120, 640, 640, 6), parametros: { opacidade: 0.35 } },
    ],
    notas: ["Ritmo: escuro, claro, claro, claro, suave, principal, escuro"],
  };
};
