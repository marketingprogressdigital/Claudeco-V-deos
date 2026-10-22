# C. OS 12 MODELOS

Cada modelo traz:

1. o objetivo;
2. os campos do roteiro com limites;
3. as variações;
4. a anatomia em camadas (do fundo para a frente);
5. as imagens a gerar;
6. os critérios de aceite.

Os prompts completos de imagem ficam em `D_producao_de_imagem.md`, e cada cena aqui aponta para o código dela (ex.: CENA_FOLICULO).

Coordenadas em px no quadro de 1080 x 1350. Margem de 80 px. A palavra "principal" se refere ao token de cor da ficha.

## Como escolher o modelo

1. Parar a rolagem e ganhar seguidor: modelos 1, 2 e 6.
2. Posicionar a opinião do médico: modelos 3 e 11.
3. Ensinar e gerar salvamento: modelos 7, 9, 10 e 12.
4. Quebrar objeção: modelos 8 e 2.
5. Campanha de saúde: modelo 4.
6. Gerar agendamento: modelos 5 e 11.

Semana padrão: 2 carrosséis, 2 estáticos e 1 capa por Reels. Nunca repita o mesmo modelo e a mesma variação em sequência no feed.

## MODELO 1 | AUTORIDADE COM TÍTULO GIGANTE (estático)

Objetivo: autoridade imediata, efeito capa de revista.

Roteiro:

1. `fraseApoio`: até 45 caracteres.
2. `palavra`: 1 palavra, até 10 letras.
3. `etiqueta`: até 30 caracteres. O padrão é a especialidade.

Variações:

1. **A, noturna:** atmosfera noturna, palavra em degradê da principal com eco em contorno, médico na frente das letras.
2. **B, cena:** fundo com cena gerada do consultório desfocado (CENA_CONSULTORIO), palavra vazada mostrando a cena, médico na frente.
3. **C, clara editorial:** atmosfera editorial, palavra no escuro da ficha, médico com luz suave, arco atrás.

Camadas da variação A:

1. Atmosfera noturna com foco de luz em (0,5; 0,42).
2. Fios de luz diagonais (efeito 15), 60% de opacidade.
3. Partículas (efeito 16).
4. Eco em contorno da palavra, a 26 px acima da palavra principal.
5. Palavra gigante: caixa de 30 a 1050 em x e de 330 a 710 em y, ajuste só por largura, degradê da principal.
6. Médico: recorte da cintura para cima, 1010 px de altura, centralizado e apoiado na base, com luz de recorte e casamento de cor. Ele cobre a metade de baixo das letras.
7. Elemento herói pequeno: esfera ou folículo 3D gerado (ELEMENTO_ESFERA), de 100 a 140 px, perto do ombro, com desfoque leve.
8. Véu do fundo escuro na base, 360 px.
9. Topo: logo à esquerda e etiqueta em pílula de vidro à direita. Frase de apoio centralizada em itálico, a y 210.
10. Base: linha fina e assinatura com CRM e RQE, sobre o véu.

Aceite:

1. A palavra continua legível mesmo com o médico na frente (pelo menos 60% de cada letra visível).
2. O médico parece iluminado pela mesma luz do fundo.

## MODELO 2 | PERGUNTA PROVOCATIVA (estático ou capa)

Roteiro:

1. `selo`: até 28 caracteres.
2. `pergunta`: até 50 caracteres, com 1 destaque.
3. `chamada`: "Arraste e descubra" ou "Leia a legenda".

Variações:

1. **A, médico e arco:** pergunta à esquerda em 7 colunas, médico à direita saindo de um arco na cor principal com contorno duplo, anéis orbitais atrás, ponto de interrogação gigante em contorno com 20% de opacidade.
2. **B, objeto herói:** pergunta no topo centralizada, objeto 3D do tema no centro (ELEMENTO_TEMA), pílula de chamada embaixo.
3. **C, foto sangrada:** foto de cena do tema (CENA_TEMA) em tela cheia com véu, pergunta enorme na metade de baixo.

Aceite:

1. A palavra de destaque é o elemento de maior contraste da arte.
2. Nenhum elemento decorativo encosta no texto.

## MODELO 3 | FRASE MANIFESTO EDITORIAL (estático)

Roteiro:

1. `linha1`: até 22 caracteres.
2. `linha2`: até 22 caracteres, sai em itálico e na cor principal.
3. `linha3`: até 18 caracteres, sai em caixa alta.

Variações:

1. **A, papel:** atmosfera editorial, moldura fina, aspas gigantes na principal com 14% de opacidade, frase em 3 níveis centralizada.
2. **B, textura fotográfica:** macro de fios de cabelo ou de textura do tema gerada (TEXTURA_FIOS), em duotom com as cores da ficha, frase em claro por cima.
3. **C, retrato editorial:** médico em preto e branco em 5 colunas à esquerda, frase à direita alinhada à esquerda.

Aceite:

1. Linha 3 pelo menos 1,5 vez maior que as linhas 1 e 2.
2. Leitura em menos de 3 segundos.

## MODELO 4 | DATA DE CONSCIENTIZAÇÃO (estático)

Roteiro:

1. `mes`.
2. `nomeCor`: até 9 letras.
3. `corCampanha`: HEX oficial da campanha.
4. `temaCampanha`: até 48 caracteres.
5. `fraseCuidado`: até 70 caracteres.

Variações:

1. **A, laço herói:** mãos segurando o laço da campanha geradas em estúdio (CENA_LACO), com a cor oficial, sobre a atmosfera da ficha. Nome da cor gigante em degradê da cor da campanha e tema em cartão de vidro.
2. **B, médico com laço:** médico real com laço digital aplicado no jaleco (elemento gerado e composto) e título lateral.
3. **C, tipográfica:** nome da cor gigante com textura de tecido do laço dentro das letras (texto vazado).

Regra: a cor da campanha aparece só no laço e no nome da cor. Todo o resto segue a ficha.

## MODELO 5 | CONVITE PARA AVALIAÇÃO (estático)

Roteiro:

1. `selo`.
2. `titulo`: até 40 caracteres.
3. `subtitulo`: até 90 caracteres.
4. `informacoes`: até 3 itens (calendário, local, contato), sempre com dado confirmado.
5. `botao`.

Variações:

1. **A, arco:** médico saindo de arco na cor principal à direita, cartão de vidro à esquerda com as informações e ícones em círculo, botão com brilho.
2. **B, consultório:** foto real da clínica ou cena gerada do consultório desfocada (CENA_CONSULTORIO), médico na frente, faixa inferior de vidro com as informações em linha.
3. **C, agenda:** calendário 3D elegante gerado (ELEMENTO_CALENDARIO) com as datas compostas pelo código, médico menor.

Aceite: botão com contraste de pelo menos 4,5 e nenhum preço ou urgência.

## MODELO 6 | CAPA DE REELS (9:16)

Roteiro:

1. `palavra`: até 12 caracteres.
2. `complemento`: até 50 caracteres.
3. `frame`: imagem do vídeo, opcional.

Variações:

1. **A, frame:** frame do vídeo com gradação da ficha, véu inferior, título no terço inferior da área segura.
2. **B, retrato:** médico recortado sobre atmosfera noturna com fios de luz.
3. **C, objeto:** objeto herói do tema e título.

Regras:

1. Área segura: todo texto e o rosto entre 285 e 1635 px de altura.
2. Todas as capas de um mesmo médico usam a mesma variação.

## MODELO 7 | CARROSSEL EDUCATIVO (7 telas)

Roteiro:

1. `capa`: selo, título até 40 caracteres, subtítulo até 60.
2. `oQueE`: até 230 caracteres.
3. `porQue`: até 230 caracteres.
4. `sinais`: de 3 a 5 itens de até 45 caracteres.
5. `tratamento`: até 200 caracteres.
6. `alerta`: até 90 caracteres.
7. `palavraFundo`: palavra do tema.

Telas:

1. **Capa, escura:** folículo 3D gerado grande (ELEMENTO_FOLICULO) à esquerda, com luz da principal; médico à direita com luz de recorte; véu; selo, título em 2 linhas e subtítulo em itálico.
2. **O que é, clara:** número de seção "01" grande e rótulo, título da tela, cartão de vidro com o texto, macro do tema em arco no canto (CENA_MACRO_TEMA).
3. **Por que acontece, clara:** layout espelhado da tela 2, com ilustração 3D do mecanismo (ELEMENTO_MECANISMO).
4. **Sinais, clara:** título e lista em cartões de vidro numerados.
5. **Tratamento, clara:** texto em 7 colunas e foto de atendimento real em arco com contorno duplo em 5 colunas.
6. **Alerta, em cor:** aspas gigantes e frase grande em itálico, com esfera 3D cortada na borda.
7. **Fechamento, escura:** título, 4 pílulas de ação em vidro (curtir, comentar, enviar, salvar) e médico com luz de recorte.

Continuidade:

1. Fios de luz atravessando as telas 1 a 3.
2. Anel orbital atravessando as telas 4 e 5.
3. Folículo da capa reaparece cortado na borda direita da tela 2.

## MODELO 8 | MITOS E VERDADES (de 5 a 7 telas)

Roteiro:

1. `capaTitulo`.
2. `capaSubtitulo`: até 40 caracteres.
3. `itens`: de 3 a 5, cada um com `afirmacao` (até 70 caracteres), `veredito` (MITO ou VERDADE), `explicacao` (até 180 caracteres) e `imagem` opcional.
4. `fechamento`.

Telas:

1. **Capa, escura:** ponto de interrogação gigante em contorno, médico com luz de recorte, título "Mitos e Verdades" com o "e" em itálico, subtítulo e etiqueta "teste o que você sabe".
2. **Itens, claras alternando com suaves:** número de seção, afirmação entre aspas em serifada grande, carimbo circular rotacionado (MITO no escuro da ficha, VERDADE na principal) e cartão de vidro com a explicação. Imagem do tema em miniatura opcional (CENA_TEMA).
3. **Fechamento, em cor:** esfera clara gigante com a frase de salvar e compartilhar, e a logo.

Regras:

1. Começar por um mito e alternar.
2. Carimbo sempre no mesmo lugar e tamanho.

Continuidade: anéis orbitais atravessando as telas de itens.

## MODELO 9 | LISTA NUMERADA (de 5 a 8 telas)

Roteiro:

1. `capa.palavra`: até 10 caracteres.
2. `capa.titulo`: até 80 caracteres.
3. `itens`: de 3 a 5, cada um com `titulo` (até 45 caracteres) e `texto` (até 170 caracteres).
4. `conclusao`: até 110 caracteres.

Telas:

1. **Capa, clara:** médico saindo de arco à esquerda, palavra da capa gigante em degradê à direita e título em itálico.
2. **Itens, alternando escura e clara:** número gigante em degradê com eco em contorno (de 340 a 420 px), linha de acento, título do item e cartão de vidro com o texto.
3. **Conclusão, em cor:** ícone de check grande, "Lembre se:" e a conclusão.
4. **Fechamento, escura:** chamadas de ação com ícones em círculos de vidro.

Continuidade: fios de luz atravessando todas as telas de itens.

## MODELO 10 | CIÊNCIA E ESTUDO (6 telas)

Roteiro:

1. `capa.titulo`: até 55 caracteres.
2. `estudo.texto`: até 230 caracteres.
3. `estudo.fonte`.
4. `mecanismo.passos`: 3 passos de até 70 caracteres.
5. `aplicacao.texto`: até 230 caracteres.
6. `ressalva`: até 110 caracteres.

Regra absoluta: só com estudo enviado ou aprovado pelo médico.

Telas:

1. **Capa, escura:** hélice de DNA ou estrutura molecular 3D gerada (ELEMENTO_CIENCIA) em diagonal, tablet realista gerado em perspectiva (ELEMENTO_TABLET) com a tela vazia, onde o código compõe uma página de artigo genérica. Selo "Vale a pena ler" e título.
2. **Estudo, clínica:** etiqueta, cartão de vidro com o resumo em serifada grande e a fonte em rodapé com linha.
3. **Mecanismo, clínica:** linha do tempo vertical com 3 nós numerados na principal, ligados por linha em degradê, e cartões de vidro.
4. **Aplicação, clínica:** cartão de vidro com o texto e imagem do tema em arco.
5. **Ressalva, em cor:** cartão de vidro grande sobre atmosfera em cor.
6. **Fechamento, escura:** médico e chamada.

Continuidade: hélice atravessando as telas 2 a 4 em 20% de opacidade.

## MODELO 11 | BASTIDORES E MÉTODO (6 telas)

Roteiro:

1. `capa.titulo`: até 40 caracteres.
2. `capa.subtitulo`: até 60 caracteres.
3. `consulta`, `avaliacao` e `equipe`, cada um com `titulo` (até 30 caracteres) e `texto` (até 150 caracteres).
4. `valor`: até 50 caracteres.
5. `cta`.

Exige fotos reais: retrato em close, atendimento, detalhe e equipe. Sem elas, o motor para e pede. Nunca gere pessoas no lugar do médico ou da equipe.

Telas:

1. **Capa:** retrato real em close sangrado, gradação da ficha, véu inferior, etiqueta "Bastidores" e título grande.
2. **Etapas (consulta e avaliação):** foto real em arco com contorno duplo, alternando o lado; número gigante em degradê do lado oposto; rótulo e cartão de vidro com o texto.
3. **Valor, em cor:** aspas gigantes e frase centralizada.
4. **Equipe:** mesma estrutura das etapas.
5. **Chamada, escura:** anéis orbitais, logo, chamada grande e pílula com o Instagram.

## MODELO 12 | LEIA ANTES DE FAZER (7 telas)

Roteiro:

1. `capa.procedimento`: até 24 caracteres.
2. `comoFunciona`: até 230 caracteres.
3. `antes`, `noDia` e `depois`: de 3 a 4 itens de até 60 caracteres cada.
4. `seguranca`: até 110 caracteres.

Telas:

1. **Capa, editorial:** "NÃO FAÇA NENHUM" em rótulo espaçado, procedimento gigante em degradê em 2 linhas, "antes de ler esse post!" em itálico; gota e esferas 3D geradas (ELEMENTO_GOTA) flutuando com sombra; sombra de janela.
2. **Como funciona:** número de seção e cartão de vidro grande.
3. **Antes, no dia e depois:** título gigante, itens em cartões de vidro com ícone de check em círculo cheio da principal. Fundo alternando claro e suave.
4. **Segurança, em cor:** frase grande centralizada.
5. **Fechamento, escura:** pergunta e duas pílulas (comentar, salvar).

Continuidade: fios de luz da capa até a tela de "depois".
