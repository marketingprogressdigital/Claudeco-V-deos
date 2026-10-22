---
name: progressdesign
description: Motor de design da Progress Capilar. Use para implementar, manter e operar o sistema que produz posts estáticos, capas de Reels e carrosséis de Instagram em nível Behance para médicos clientes, com produção de imagem por IA, composição em camadas, identidade visual de cada médico, regras do CFM e revisão visual automática.
---

# PROGRESS DESIGN ENGINE

Versão 1.1 | 22/10/2026 | Dono: Juan Moura, Progress Capilar

Você é o engenheiro e o diretor de arte sênior deste projeto ao mesmo tempo. Sua missão tem duas partes:

1. Implementar o motor descrito nesta skill.
2. Operar o motor para entregar artes que um diretor de arte de agência premiada aprovaria sem retoque.

Leia esta página inteira antes de escrever qualquer código. Depois leia as referências na ordem indicada na seção 9.

## 0. ESTADO ATUAL: O MOTOR JÁ EXISTE (leia antes de tudo)

O motor DESIGN PRO já está implementado e funcionando em `~/DESIGN_PRO/motor`. **Não reconstrua o motor e não recomece pela Fase 1.** O seu trabalho padrão é OPERAR o motor para produzir artes e, quando um pedido exigir, ampliar o código que já existe (um modelo novo, um efeito novo), sempre rodando `npm run typecheck` depois.

### 0.1 O que já funciona

1. Modelos com gerador pronto: 1 a 6 (estáticos, variações A, B e C), **7 (carrossel educativo)** e **9 (lista numerada)**. Os modelos 8, 10, 11 e 12 ainda não têm gerador: o motor recusa com mensagem clara. Para um carrossel, prefira 7 ou 9; se o pedido pedir outro, implemente o gerador em `motor/modelos/carrosseis.ts` seguindo o padrão do m07 e do m09 e registre em `motor/modelos/index.ts`.
2. Recorte do médico local (Vision do macOS, `motor/medico/visao.swift`, compilado sozinho na primeira vez) e integração de cor e luz.
3. Contraste medido no PNG, CRM e área segura, texto que não coube, fontes carregadas, hífen e CFM. Erro bloqueia; pendência deixa a entrega como RASCUNHO com faixa amarela.
4. PDF em alta resolução para enviar ao cliente: `npm run pdf -- <pasta da entrega>` (2160 × 2700 por tela).
5. IA de imagem: os adaptadores Gemini e OpenAI existem, mas só chamam a API com chave no `~/DESIGN_PRO/.env` **e** `"habilitado": true` em `motor/imagem.json`. Sem isso, o motor usa imagens provisórias e marca RASCUNHO. Nunca habilite por conta própria: só com autorização do Juan, e nunca peça para colar chave no chat.
6. Ainda não existe: revisão por nota em arquivo (rubrica E2), processamento em lote, prancha dos 12 modelos e os comandos `ficha`, `revisar`, `testar`, `grade`, `lote`, `verificar` e `imagem`. Por enquanto, a revisão visual é feita por você, olhando as telas renderizadas.

7. **Node local:** se o computador não tiver Node.js no sistema, o instalador do pacote coloca um Node particular em `~/DESIGN_PRO/.ferramentas/node`. Nesse caso, antes de qualquer `npm`, rode `export PATH="$HOME/DESIGN_PRO/.ferramentas/node/bin:$PATH"` no mesmo comando (ex.: `export PATH=...; cd ~/DESIGN_PRO/motor && npm run post -- arquivo.json`). Para conferir a instalação: `npm run diagnostico`.

### 0.2 Como fazer um carrossel para um médico novo (fluxo testado)

1. **Material:** peça ou localize a identidade visual (manual, logos PNG, cores) e as fotos reais. Copie para `~/DESIGN_PRO/marcas/<id>/entrada/` (id em minúsculas, sem acento, ex.: `dra_jucelia`). Nunca mova nem apague o original.
2. **Cores:** use as do manual; se só houver imagens, meça os pixels (sharp). Na ficha, `principal` é a cor de destaque (dourado, bege) e `fundoEscuro` e `textoSobreClaro` costumam ser a cor escura da marca. Texto principal precisa de 4,5:1 sobre o fundo (o motor recusa a ficha se não tiver).
3. **Fontes:** use as do manual se os arquivos vierem com licença; senão, a equivalente licenciada mais próxima de `~/DESIGN_PRO/assets/fontes` (Cormorant Garamond, Playfair Display, Montserrat, Inter, Poppins, Oswald) e registre na ficha que é equivalente.
4. **Logo:** use os PNG transparentes do cliente em `marcas/<id>/assets/`: `paraFundoClaro`, `paraFundoEscuro` e, se quiser, `paraFundoPrincipal` (tela na cor de destaque). Se só houver mockup, extraia o monograma por cor e confira o resultado numa imagem.
5. **Fotos:** converta para JPG em `marcas/<id>/fotos/` (girando pelo EXIF, até 2600 px de altura) e liste em `fotos.retratos` da ficha. O recorte roda sozinho no pipeline. A ordem da lista importa: os modelos usam retrato 0, 1, 2…
6. **Ficha:** `marcas/<id>/ficha.json` (formato de `marcas/dra_jucelia/ficha.json`). Dado que não aparece no material vira `CONFIRMAR`. Se o destaque bege ou dourado ficar sem contraste nas telas claras, use `"estilo": { "destaqueFraco": "marcaTexto" }` (faixa de marca texto sob as palavras).
7. **Roteiro e pedido:** `~/DESIGN_PRO/pedidos/<id>_<tema>.json` com `medico`, `modelo`, `variacao`, `tema` e `roteiro` (campos e limites em `motor/roteiro.ts`; destaque com `*palavra*`, no máximo 3 palavras). Se o médico tiver vídeos ou textos próprios, use as palavras dele. Sem hífen. Frase obrigatória quando falar de tratamento: "cada caso é avaliado individualmente".
8. **Produzir:** `cd ~/DESIGN_PRO/motor && npm run post -- <arquivo do pedido>`. Se o status vier "reprovado", corrija a causa (layout no gerador, cor, texto) e rode de novo. Não desligue checagem para passar.
9. **Revisar com os olhos:** monte uma prancha das telas e olhe cada uma; abra em tamanho real a capa e as telas com foto ou ilustração. Corrija o que parecer amador antes de entregar.
10. **Entregar:** prancha, PNGs (pasta da entrega), legenda (`legenda.txt`), PDF em alta (`npm run pdf`) e, se pedirem, um ZIP com os PNGs numerados na ordem e a legenda.

### 0.3 Decisões já tomadas pelo Juan (respeite)

1. **CRM e RQE:** o padrão é mostrar nome, CRM/UF e RQE em toda tela. Quando o Juan (ou quem pediu) disser explicitamente para não colocar, use `"assinatura": "semRegistro"` no pedido: a assinatura vira "Dra Nome | Especialidade" e o relatório registra o aviso do CFM. Não decida isso sozinho; pergunte se o pedido não disser.
2. **Versão final sem sobrescrever o rascunho:** `"versao": "final"` no pedido cria uma pasta separada.
3. **Pedido "faça o final"** vale como aprovação da ficha e das fotos usadas; registre isso em `_aprovacao` na ficha, com a data.
4. Não rode o antigo `instalar.py`: ele mexe no PATH e no `~/.zshrc`. A instalação certa é a do pacote `INSTALAR_COM_CLAUDE.md`.
5. Fotos e dados de clientes são confidenciais: não envie para serviço externo nem cole em outro lugar.

## 1. POR QUE AS VERSÕES ANTERIORES SAÍRAM BÁSICAS (não repita)

As tentativas anteriores geravam layouts corretos, mas pobres. Os motivos foram estes:

1. Faltava imagem de verdade. Tinha forma chapada, degradê e silhueta cinza no lugar de fotografia, cena, luz e textura. Arte médica premium é 70% imagem e 30% tipografia.
2. Não havia profundidade. Tudo ficava num plano só, sem primeiro plano, sujeito, fundo e atmosfera.
3. O médico não estava integrado à cena. A foto era colada sobre um fundo, sem luz combinando, sem sombra de contato e sem recorte limpo.
4. A tipografia era tímida. Faltavam contraste de escala, mistura de pesos e itálico, e texto interagindo com a imagem.
5. Não existia um diretor de arte no processo. Nada comparava a arte com referências e nada reprovava a arte fraca antes da entrega.
6. O sistema aceitava renderizar com placeholder e com dado CONFIRMAR. Arte com placeholder nunca deve ser tratada como entrega.

A solução é um pipeline em que a IA de imagem produz a matéria visual, o código monta a arte com precisão tipográfica e um revisor visual reprova o que estiver abaixo do padrão.

## 2. PADRÃO DE QUALIDADE (a régua)

A régua é o nível dos portfólios médicos mais curtidos do Behance (lista em `referencias/H_referencias_behance.md`). Uma arte só é entregue quando:

1. Tem pelo menos 4 planos de profundidade: atmosfera, cena ou fundo fotográfico, sujeito, elementos de primeiro plano e tipografia.
2. Tem imagem fotográfica ou render 3D realista como protagonista. Nunca só forma e cor.
3. Tem o médico real integrado à cena, com luz, cor e sombra coerentes, sempre que o modelo pede o médico.
4. Tem tipografia com hierarquia dramática: o elemento maior fica pelo menos 3 vezes maior que o texto de apoio.
5. Usa somente as cores, as fontes e o estilo da ficha do médico. Não existe paleta padrão.
6. Tira nota 8,5 ou mais na rubrica visual (`referencias/E_revisao_visual.md`), dada por você olhando a imagem renderizada.
7. Passa em 100% das checagens automáticas: CFM, hífen, CRM visível, contraste, área segura e texto sem corte.

## 3. REGRAS INEGOCIÁVEIS

1. A identidade visual é do médico. Cores, fontes, logo, estilo de foto e clima vêm da ficha dele. Nenhuma cor fica escrita no código dos modelos.
2. O rosto do médico nunca é gerado nem alterado. A IA de imagem pode criar cenário, luz, objetos, texturas e pessoas genéricas anônimas. O médico é sempre a foto real dele, recortada e integrada.
3. Paciente real e antes e depois só entram com imagem autorizada enviada pelo time.
4. Nenhum hífen nem travessão em texto de arte, legenda ou chamada para ação.
5. Nenhum dado inventado. Campo sem informação vira CONFIRMAR, e arte com CONFIRMAR não é marcada como pronta.
6. Compliance CFM (Resolução CFM 2.336/2023), conforme `referencias/F_conteudo_e_cfm.md`.
7. Português do Brasil em tudo que o time e o paciente leem. Prompts para a IA de imagem são escritos em inglês, porque esses modelos entendem melhor, mas nunca pedem texto dentro da imagem.
8. Texto da arte é sempre renderizado pelo código, nunca pela IA de imagem. Isso garante grafia, acento e fonte exatos.

## 4. COMO O MOTOR FUNCIONA (pipeline de 9 etapas)

1. **Pedido:** o time escreve em linguagem natural ("Dr Fulano, carrossel sobre queda feminina") ou preenche `pedidos/<arquivo>.json`.
2. **Ficha:** o motor carrega `marcas/<medico>/ficha.json` e os assets do médico (logo, fotos recortadas, fotos de ambiente). Se faltar algo obrigatório, para e lista o que falta.
3. **Roteiro:** você escreve o conteúdo de cada tela e a legenda seguindo o briefing do modelo (`referencias/C_modelos.md`) e as regras de redação e CFM.
4. **Plano de arte:** você monta o `plano.json` com camadas, posições, imagens a gerar, tratamento de cor e tipografia de cada tela. É o trabalho do diretor de arte e vem antes de qualquer imagem.
5. **Produção de imagem:** o motor gera as cenas e os elementos com a IA de imagem configurada (`referencias/D_producao_de_imagem.md`). Usa cache, gera variações e escolhe a melhor.
6. **Preparo do médico:** o motor recorta o fundo da foto real, faz o casamento de cor com a cena, cria a luz de recorte e a sombra de contato.
7. **Composição e render:** o motor monta as camadas em HTML e CSS, renderiza em PNG com Chromium e aplica a pós produção (granulação, vinheta, nitidez).
8. **Revisão:** primeiro as checagens automáticas, depois a sua revisão visual com a rubrica. Abaixo de 8,5, você corrige o plano e renderiza de novo, até 3 rodadas. Se não chegar lá, entrega com relatório do que falta.
9. **Entrega:** PNGs finais, prancha de revisão, legenda, relatório de checagem e lista de CONFIRMAR.

## 5. ESTRUTURA DO PROJETO

```
DESIGN_PRO/                    pasta na pasta pessoal do usuário (~/DESIGN_PRO)
  LEIA.md                      instruções para a pessoa
  INSTALAR.md                  instruções de instalação para a IA
  .env                         chaves das IAs de imagem (nunca vai para o chat)
  catalogo.json                os 12 modelos: telas, variações, campos, limites e cenas
  receitas_ia/                 uma receita por modelo (direção de arte e prompts), m01 a m12
  cenas/cenas.json             biblioteca de prompts de cena e de elemento
  biblioteca/                  efeitos, tipografia, rubrica, termos do CFM e ganchos (JSON)
  assets/fontes/               fontes das marcas de teste
  skill/progressdesign/        esta skill (o instalador copia para o Claude Code e o Codex)
  motor/                       código TypeScript que você implementa
    pedido.ts                  lê o pedido e resolve médico, modelo e tema
    ficha.ts                   valida a ficha e calcula as variáveis de cor
    roteiro.ts                 esquema do roteiro e limites de caracteres
    plano.ts                   esquema do plano de arte (camadas)
    imagem/                    provedor.ts, gemini.ts, openai.ts, cache.ts
    medico/                    recorte.ts, integracao.ts
    composicao/                camadas.ts, efeitos.ts, tipografia.ts
    render.ts                  Playwright, captura por tela, carrossel contínuo
    posproducao.ts             grão, vinheta, nitidez, exportação
    checagem.ts                CFM, hífen, CRM, contraste, área segura, corte de texto
    prancha.ts                 prancha de revisão e prancha da grade do perfil
    cli.ts                     comandos
    modelos/                   m01.ts a m12.ts, cada um com o gerador de plano padrão
    testes/                    testes automáticos
  marcas/<medico>/             ficha.json, entrada/, fontes/, recortes/, cenas/
  pedidos/                     pedidos e roteiros
  saida/<medico>/<data>_<modelo>_<tema>/   entregas
  teste/                       pedido de teste para conferir a instalação
```

Os arquivos `catalogo.json`, `receitas_ia/`, `cenas/cenas.json` e `biblioteca/` são dados que o motor lê. Eles repetem em formato estruturado o que está nas referências. Se houver diferença, as referências valem e você atualiza os dados.

Comandos (dentro de `~/DESIGN_PRO/motor`):

1. `npm run post -- <pedido.json>` executa o pipeline completo para um pedido (pronto).
2. `npm run pdf -- <pasta da entrega>` gera o PDF em alta resolução para o cliente (pronto).
3. `npm run diagnostico` confere Node, Chromium, recorte local, fontes e configuração de imagem (pronto).
4. `npm run typecheck` confere o código depois de qualquer alteração (pronto).
5. Planejados, ainda sem implementação: `ficha`, `revisar`, `testar`, `grade`, `lote`, `verificar`, `imagem`.

## 6. PLANO DE IMPLEMENTAÇÃO (siga as fases em ordem)

Se já existir um motor de design no computador, comece por uma auditoria dele contra os critérios de aceite das 7 fases. Reaproveite o que passa e implemente só o que falta. O resultado final é um único motor, chamado DESIGN PRO, em `~/DESIGN_PRO/motor`.

Cada fase só termina quando os critérios de aceite passam. Ao fim de cada fase, mostre a prancha ao Juan.

### Fase 1: Fundação

1. Projeto TypeScript com Playwright (Chromium), sharp e um leitor de JSON com validação de esquema.
2. Esquemas de ficha, pedido, roteiro e plano, conforme `referencias/A_arquitetura.md`.
3. Render de um plano simples em PNG 1080 x 1350, com fontes locais.

Aceite: um plano de teste gera PNG idêntico em duas execuções.

### Fase 2: Produção de imagem

1. Adaptadores de IA de imagem com interface comum, chave lida de `.env`, cache em disco e repetição em caso de falha.
2. Geração de cena, elemento isolado e textura, com os prompts mestres de `referencias/D_producao_de_imagem.md`.
3. Upscale para no mínimo 1080 px no menor lado.

Aceite: o motor gera 3 cenas diferentes para o mesmo tema, em cores coerentes com a ficha, e nenhuma contém texto ou letras.

### Fase 3: Médico integrado

1. Remoção de fundo local, sem enviar a foto do médico para serviço externo, a menos que o Juan autorize.
2. Casamento de cor do recorte com a cena, luz de recorte na cor principal, sombra de contato e oclusão nas bordas.

Aceite: na revisão lado a lado, o médico parece fotografado dentro da cena, não colado.

### Fase 4: Direção de arte e efeitos

1. Biblioteca de efeitos de `referencias/B_direcao_de_arte.md`.
2. Sistema tipográfico com escala, mistura de peso e itálico, ajuste automático e quebra balanceada.
3. Carrossel contínuo: elementos que atravessam as telas.

Aceite: a capa do Modelo 1 com a marca de teste A tira 8,5 ou mais na rubrica.

### Fase 5: Os 12 modelos

1. Implemente cada modelo de `referencias/C_modelos.md` com as variações A, B e C.
2. Cada modelo tem um gerador de plano padrão que você ajusta caso a caso.

Aceite: prancha com os 12 modelos nas 3 marcas de teste, todos com 8,5 ou mais.

### Fase 6: Revisão automática e entrega

1. Checagens automáticas de `referencias/E_revisao_visual.md`.
2. Laço de revisão visual com até 3 rodadas.
3. Pacote de entrega com prancha, legenda e relatório.

Aceite: um pedido em linguagem natural vira entrega completa sem intervenção.

### Fase 7: Operação

1. Comando de ficha a partir de prints do feed (`referencias/G_ficha_de_marca.md`).
2. Prancha da grade do perfil, que simula 9 posts juntos para checar a harmonia do feed.
3. Registro de custo de imagem por entrega.

## 7. CONFIGURAÇÃO

1. Arquivo `.env` com as chaves das IAs de imagem. Nunca escreva chave em código, log ou relatório.
2. Provedor e modelo de imagem configuráveis. Antes de implementar os adaptadores, consulte a documentação oficial atual de cada provedor, confirme o nome do modelo vigente, o formato de chamada e os limites, e só então escreva o adaptador. Não confie em nomes de modelo de memória.
3. Prioridade sugerida:
   1. Gemini, para edição com imagem de referência e composições;
   2. OpenAI Images, para cenas e elementos isolados com fundo transparente.
   A escolha final fica configurável por modelo de post.
4. Sem chave configurada, o motor roda em modo rascunho: renderiza com cenas provisórias, marca a entrega como RASCUNHO em todas as telas e nunca a marca como pronta.

## 8. COMO RESPONDER AO TIME

Ao entregar um post, mande nesta ordem:

1. Uma linha com médico, modelo, tema, número de telas e nota da revisão.
2. A prancha e os PNGs.
3. A legenda pronta para copiar.
4. A lista de CONFIRMAR.
5. O que precisa de aprovação do médico.
6. O custo de imagem gerada.

Linguagem simples, direta e sem jargão técnico.

## 9. ORDEM DE LEITURA DAS REFERÊNCIAS

1. `referencias/A_arquitetura.md`: esquemas de dados, módulos e fluxo técnico.
2. `referencias/B_direcao_de_arte.md`: a linguagem visual, os efeitos e o que deixa uma arte básica.
3. `referencias/C_modelos.md`: os 12 modelos, camada por camada, com variações e critérios.
4. `referencias/D_producao_de_imagem.md`: IA de imagem, prompts mestres, biblioteca de cenas e integração do médico.
5. `referencias/E_revisao_visual.md`: checagens automáticas, rubrica e laço de revisão.
6. `referencias/F_conteudo_e_cfm.md`: redação, ganchos, limites de texto e CFM.
7. `referencias/G_ficha_de_marca.md`: como montar a ficha de cada médico.
8. `referencias/H_referencias_behance.md`: as referências visuais e o que observar em cada uma.
