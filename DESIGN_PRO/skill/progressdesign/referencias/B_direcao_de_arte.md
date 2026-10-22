# B. DIREÇÃO DE ARTE

Este documento é o olho do diretor de arte. Use ele para montar cada plano e para julgar cada render.

## B1. O que separa arte premium de arte básica

| Arte básica (reprovar) | Arte premium (o alvo) |
| --- | --- |
| Fundo de cor chapada ou degradê linear simples | Atmosfera com luz direcional, profundidade, grão e vinheta |
| Foto colada sobre o fundo | Médico recortado, com cor casada, luz de recorte e sombra de contato |
| Ícones e formas genéricas | Elementos 3D realistas, fotografia de produto ou objeto, texturas reais |
| Título em um único tamanho e peso | Escala dramática, mistura de serifada e sem serifa, itálico no destaque, texto atrás e na frente do sujeito |
| Tudo centralizado e simétrico | Assimetria intencional, linhas de força, espaço negativo generoso |
| Cada tela de carrossel isolada | Elementos que atravessam as telas, ritmo de fundos alternados, numeração editorial |
| Texto em caixa sem respiro | Cartões de vidro, margens largas, alinhamento a uma grade |
| Mesma luz e cor em todas as imagens | Gradação de cor única por post, coerente com a ficha |

## B2. Os 12 princípios

1. **Imagem protagonista.** Toda tela tem uma imagem forte: médico, cena, objeto 3D ou textura fotográfica. Tela só de texto é exceção (Modelo 3 e telas de leitura) e mesmo assim leva atmosfera e textura.
2. **Profundidade em 5 planos:**
   1. atmosfera (luz e cor de fundo);
   2. cena ou textura fotográfica;
   3. tipografia gigante ou forma grande;
   4. sujeito (médico ou objeto);
   5. primeiro plano (partículas, elemento desfocado, título sobre o sujeito, assinatura).
3. **Luz com direção.** Defina de onde vem a luz em cada tela (esquerda alta, por exemplo). A cena, a luz de recorte do médico, os brilhos e as sombras obedecem a essa direção.
4. **Uma cor de destaque.** A cor principal da ficha aparece em no máximo 3 pontos por tela (uma palavra, um elemento, um detalhe). O resto são neutros da ficha.
5. **Escala dramática.** Proporção mínima de 3 para 1 entre o maior e o menor texto relevante. Capas chegam a 8 para 1.
6. **Contraste de tipo.** Título na fonte de título. A palavra de destaque em itálico da fonte de título ou na fonte de destaque da ficha, sempre na cor principal ou em degradê dela.
7. **Texto interagindo com imagem.** Em capas, pelo menos um destes recursos:
   1. palavra gigante atrás do médico;
   2. título sobrepondo a borda da foto;
   3. texto vazado com imagem dentro;
   4. eco do título em contorno.
8. **Espaço negativo.** Pelo menos 30% da tela de capa sem elemento. Margem mínima de 80 px.
9. **Grade de 12 colunas** com 80 px de margem e 24 px de calha. Todo elemento alinha a uma coluna.
10. **Ritmo de carrossel.** Alterne fundo escuro, claro e em cor. Nunca 3 telas iguais seguidas. Capa e fechamento com mais impacto, miolo com leitura confortável.
11. **Continuidade.** Todo carrossel tem pelo menos um elemento que atravessa telas: fio de luz, anel, objeto 3D cortado na borda, linha da grade ou palavra gigante.
12. **Acabamento fotográfico.** Grão sutil, vinheta, gradação de cor única e nitidez final. É o que dá cara de peça finalizada no Photoshop.

## B3. Sistema tipográfico

Escala base para 1080 x 1350 (ajuste automático pode reduzir até 70% do valor):

1. Gigante (palavra de fundo, número): de 260 a 420 px, peso forte, entrelinha de 0,8 a 0,9.
2. Título de capa: de 110 a 150 px, entrelinha de 0,95 a 1,0, tracking levemente negativo.
3. Título de tela: de 80 a 104 px.
4. Subtítulo ou frase de apoio: de 44 a 60 px, itálico da fonte de título ou fonte de texto leve.
5. Corpo: de 38 a 46 px, entrelinha de 1,38 a 1,45, até 40 palavras por tela.
6. Rótulo (etiqueta, seção): de 18 a 24 px, caixa alta, tracking de 0,16 a 0,24 em.
7. Assinatura (nome, CRM, RQE): de 20 a 24 px, peso forte da fonte de texto.

Regras:

1. Quebra balanceada. Nada de uma palavra sozinha na linha final de título.
2. Algarismos alinhados em números de lista. Confira se a fonte escolhida não confunde zero com a letra O. Se confundir, use a fonte de texto para os números.
3. Destaque com no máximo 3 palavras.
4. Fonte condensada em caixa alta: tracking mais 0,01 em. Serifada de alto contraste: nunca abaixo de 34 px.

## B4. Gradação de cor por post

1. Escolha a temperatura da ficha (quente, neutra ou fria) e aplique a mesma gradação em todas as imagens do post: curva de contraste suave, sombras puxadas para o tom escuro da ficha, realces puxados para o tom claro da ficha.
2. Imagens geradas recebem tingimento por modo cor com a cor de fundo da tela (de 15% a 40%), para conversarem com a marca.
3. O médico recebe casamento de cor com a cena (seção A3, item 7), nunca tingimento pesado. A pele precisa continuar natural.

## B5. Biblioteca de efeitos (implemente todos)

Cada efeito é parametrizado e usa somente tokens da ficha.

1. **Atmosfera noturna:** fundo escuro com foco de luz radial na cor principal (de 25% a 45%), feixe diagonal desfocado, vinheta interna forte.
2. **Atmosfera editorial:** fundo claro com degradê quente, sombra difusa de janela ou folhagem (opacidade de 8% a 12%, desfoque de 25 a 35 px), foco de luz suave.
3. **Atmosfera clínica:** fundo claro com dois focos de cor (principal e apoio) nos cantos opostos e malha de pontos com máscara de desvanecimento.
4. **Atmosfera em cor:** fundo na cor principal com foco claro e vinheta escura da própria cor.
5. **Grão:** ruído monocromático de 3% a 6% sobre a arte inteira, em modo sobreposição.
6. **Vinheta:** sombra interna nas bordas, de 10% a 25%.
7. **Luz de recorte no médico:** contorno desfocado de 20 a 40 px na cor principal, do lado da luz.
8. **Sombra de contato:** elipse escura desfocada na base do recorte, de 20% a 35%.
9. **Vidro:** cartão com fundo branco translúcido (de 8% a 14% sobre escuro, de 55% a 75% sobre claro), desfoque do fundo de 20 a 30 px, borda de 1,5 px clara e sombra longa suave.
10. **Texto em degradê:** preenchimento do texto com degradê da cor principal (do tom claro ao tom escuro).
11. **Eco em contorno:** cópia do título só em contorno, deslocada de 16 a 30 px, com 40% a 60% de opacidade.
12. **Texto vazado com imagem:** a imagem aparece só dentro das letras do título gigante.
13. **Arco:** forma de arco (topo em semicírculo) como moldura de foto ou fundo atrás do médico, com contorno duplo deslocado.
14. **Anéis orbitais:** elipses finas concêntricas rotacionadas, na cor principal, de 20% a 50%.
15. **Fios de luz:** curvas finas paralelas com degradê da cor principal, sugerindo fios de cabelo. Assinatura visual do nicho capilar.
16. **Partículas:** pontos de luz desfocados, de 2 a 10 px, em profundidade.
17. **Desfoque de profundidade:** elemento de primeiro plano grande e desfocado (de 8 a 20 px) cortado na borda.
18. **Moldura editorial:** linha fina interna a 40 px da borda, com 25% de opacidade.
19. **Carimbo:** selo circular rotacionado de 8 a 14 graus, com anel duplo (para Mitos e Verdades).
20. **Duotom:** foto convertida em duas cores da ficha (escuro e principal), para fundos de tela de leitura.

## B6. Padrões de composição (use pelo menos um por tela)

1. **Sujeito na frente do título:** palavra gigante no terço médio, médico do quadril para cima na frente, cortando a parte de baixo das letras.
2. **Divisão assimétrica 60 e 40:** texto em 7 colunas, imagem em 5, com a imagem sangrando pela borda.
3. **Arco e sujeito:** arco na cor principal atrás do médico, contorno duplo, médico saindo do topo do arco.
4. **Objeto herói:** um objeto 3D grande no centro (folículo, frasco, gota, instrumento), título em cima, chamada embaixo.
5. **Editorial de revista:** moldura fina, aspas gigantes, frase em 3 níveis e assinatura no topo.
6. **Foto sangrada com véu:** foto ocupando a tela toda, véu degradê do fundo da ficha na metade de baixo, título por cima.
7. **Número gigante:** número ocupando 40% da altura, em degradê com eco em contorno, título e cartão de vidro embaixo.

## B7. Anti padrões (reprovação automática na revisão)

1. Silhueta, placeholder ou caixa cinza em entrega.
2. Mais de 3 cores visíveis além dos neutros.
3. Ícone de estilo diferente na mesma arte.
4. Texto sobre área movimentada da imagem sem véu ou vidro.
5. Assinatura sobre o jaleco branco ou sobre foto sem contraste (precisa de véu ou de faixa).
6. Elemento encostando a menos de 80 px da borda sem intenção de sangrar.
7. Emoji, clip art ou banco de imagem com cara de banco.
8. Médico com cor de pele alterada, borda serrilhada ou halo branco do fundo original.
9. Duas telas seguidas com o mesmo layout e o mesmo fundo.
10. Texto gerado pela IA de imagem dentro da cena.
