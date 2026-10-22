# E. REVISÃO VISUAL

Nenhuma arte sai sem passar pelas duas camadas: checagem automática e revisão do diretor de arte (você, olhando o PNG).

## E1. Checagens automáticas (bloqueiam a entrega)

1. **Hífen e travessão** em qualquer texto da arte ou da legenda.
2. **Termos proibidos do CFM** (lista em `F_conteudo_e_cfm.md`).
3. **CRM/UF visível** em todas as telas, com contraste de pelo menos 4,5 contra os pixels reais de fundo. Meça no PNG, não no CSS, porque a assinatura sobre o jaleco branco já passou despercebida antes.
4. **Contraste de todo texto** medido no PNG: corpo pelo menos 4,5, títulos acima de 60 px pelo menos 3.
5. **Texto cortado ou estourado:** compare a caixa do texto com o conteúdo renderizado.
6. **Área segura:** nada essencial a menos de 80 px da borda; no 9:16, texto e rosto entre 285 e 1635 px.
7. **Placeholder, CONFIRMAR ou RASCUNHO** em qualquer tela: a entrega não pode ser marcada como pronta.
8. **Texto na imagem gerada:** rode OCR na imagem gerada antes de compor. Se encontrar letras, descarte a imagem.
9. **Fontes:** confirme que as fontes da ficha carregaram (nenhuma fonte substituta).
10. **Resolução:** 1080 px de largura, sem pixelização nas imagens geradas, que precisam ter pelo menos 1,5 vez o tamanho de uso.

## E2. Rubrica do diretor de arte (nota de 0 a 10 por critério)

Abra cada tela em tamanho real e também a prancha. Dê a nota com justificativa de uma linha.

| Critério | Peso | O que é nota 10 |
| --- | --- | --- |
| 1. Impacto da capa | 15% | Para a rolagem em 1 segundo, com um ponto focal claro |
| 2. Profundidade | 12% | 4 ou 5 planos visíveis, atmosfera com luz direcional |
| 3. Integração do médico | 12% | Parece fotografado na cena, sem halo nem borda, luz coerente |
| 4. Tipografia | 15% | Escala dramática, destaque elegante, quebras balanceadas |
| 5. Fidelidade à marca | 12% | Reconhecível como do médico, sem cor fora da ficha |
| 6. Composição | 10% | Grade respeitada, assimetria intencional, espaço negativo |
| 7. Legibilidade no celular | 10% | Lê tudo com a prancha reduzida a 30% |
| 8. Acabamento | 7% | Grão, vinheta, gradação, nenhum artefato |
| 9. Ritmo do carrossel | 7% | Alternância de fundos, continuidade entre telas, capa e fechamento fortes |

Nota final = média ponderada. Estáticos usam o peso do critério 9 redistribuído para o critério 1.

Faixas:

1. **De 9 a 10:** nível portfólio. Entregar.
2. **De 8,5 a 8,9:** entregar e anotar as melhorias.
3. **De 7 a 8,4:** corrigir o plano e renderizar de novo.
4. **Abaixo de 7:** trocar a variação ou a cena e recomeçar o plano.

## E3. Laço de revisão

1. Renderize e gere a prancha.
2. Rode as checagens automáticas e corrija tudo que bloqueia.
3. Dê a nota da rubrica e liste as 3 maiores fraquezas, cada uma com a correção concreta (ex.: "assinatura sobre o jaleco: aplicar véu inferior de 380 px").
4. Aplique as correções no plano, nunca direto no PNG.
5. Repita até 3 rodadas. Registre as notas de cada rodada no relatório.
6. Se depois de 3 rodadas a nota ficar abaixo de 8,5, entregue como "em revisão" com o diagnóstico e o que precisa (ex.: "foto do médico com luz frontal dura, pedir foto com luz lateral").

## E4. Exemplos de diagnóstico

1. "Capa com o médico chapado sobre o degradê": faltam casamento de cor e luz de recorte, e a cena está vazia. Gerar CENA_CONSULTORIO desfocada e aplicar a integração completa.
2. "Tela de leitura sem vida": texto direto sobre o fundo liso. Aplicar a atmosfera editorial, um cartão de vidro e a macro do tema em arco.
3. "Número da lista parece letra": trocar a fonte do número para a fonte de texto ou ativar algarismos alinhados.
4. "Carrossel desconectado": incluir fios de luz atravessando as telas e alternar os fundos.
