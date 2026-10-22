# G. FICHA DE MARCA DO MÉDICO

A ficha é o que faz cada médico ter a própria cara. Sem ficha aprovada, nenhum post é produzido.

## G1. Material que o time envia (pasta `marcas/<medico>/entrada/`)

1. Logo em PNG, versões para fundo claro e para fundo escuro. Se só houver uma, crie a outra trocando a cor e peça aprovação.
2. Manual de marca, se existir.
3. De 9 a 12 prints do feed atual e, se houver, dos stories e destaques.
4. Fotos do médico:
   1. no mínimo 3 retratos (rosto, busto e cintura), com luz da esquerda e da direita;
   2. de 2 a 4 fotos de atendimento;
   3. fotos de detalhe;
   4. fotos da equipe e da clínica.
   Resolução mínima de 2000 px no maior lado.
5. Preferências do médico: o que gosta, o que não quer e perfis que admira.

## G2. Extração automática

1. **Paleta:** agrupe as cores dos prints (k médias com 8 grupos, ignorando pele e fotos). Proponha principal, apoio, fundo claro, fundo escuro e texto. Mostre a amostra das cores ao lado dos prints.
2. **Fontes:** identifique visualmente as fontes dos prints. Se não tiver certeza, proponha as 2 fontes mais parecidas do Google Fonts, marque como "equivalente" e mostre a comparação lado a lado. Baixe os arquivos e guarde em `marcas/<medico>/fontes/`.
3. **Estilo:** descreva clima, luz, temperatura, raio dos cantos, textura e elementos recorrentes olhando os prints.
4. **Fotos:** classifique cada foto (enquadramento, olhar, lado da luz, fundo) e gere os recortes.

## G3. Aprovação

1. Gere uma prancha da ficha com paleta, fontes, recortes e 3 capas de teste (Modelos 1, 3 e 7) usando a ficha proposta.
2. Mostre ao time e só marque a ficha como aprovada depois do sim.
3. Toda mudança de identidade do médico gera uma nova versão da ficha. Mantenha o histórico.

## G4. Fichas de teste

Mantenha 3 fichas fictícias em `testes/marcas/` para regressão visual. Elas usam nomes como "Dr Nome Exemplo", CRM 00000 e retratos fictícios gerados de pessoas que não existem, marcados como fictícios.

1. **Marca A, premium escura:** fundo #12201E, principal #C9A46B, apoio #2F5D57, Playfair Display e Inter, luz dramática, temperatura quente.
2. **Marca B, editorial nude:** fundo claro #F6EFE8, escuro #3B2A21, principal #8A5A3C, apoio #C7A487, Cormorant Garamond e Montserrat, luz suave.
3. **Marca C, clínica moderna:** fundo claro #F4F7F7, escuro #0B2F35, principal #0F7C83, apoio #F2B34B, Oswald e Poppins, luz clínica, temperatura fria.
