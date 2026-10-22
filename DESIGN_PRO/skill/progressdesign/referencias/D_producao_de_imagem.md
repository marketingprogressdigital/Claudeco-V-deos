# D. PRODUÇÃO DE IMAGEM

## D1. Divisão de trabalho

1. **A IA de imagem produz:**
   1. cenas e fundos fotográficos;
   2. objetos e elementos 3D isolados;
   3. texturas;
   4. pessoas genéricas anônimas, só quando o modelo permite, nunca no lugar do médico.
2. **O código produz:**
   1. todo texto;
   2. a composição;
   3. as formas da marca;
   4. os efeitos;
   5. a integração do médico real.
3. **Nunca:**
   1. pedir texto, letras, números ou logos à IA de imagem;
   2. gerar ou editar o rosto do médico;
   3. gerar paciente que pareça real em contexto de resultado.

## D2. Estrutura do prompt mestre (em inglês)

Monte todo prompt com estes 9 blocos, nesta ordem:

1. **Tipo de imagem:** "Ultra realistic editorial photograph" ou "Photorealistic 3D render" ou "Macro photograph".
2. **Assunto:** o que aparece, com detalhes físicos.
3. **Composição:** onde o assunto fica no quadro e onde fica o espaço vazio para texto (ex.: "subject on the right third, large clean negative space on the left half and top third for typography").
4. **Luz:** direção, qualidade e cor (ex.: "soft key light from upper left, warm golden rim light, deep shadows").
5. **Cor:** paleta da ficha em HEX e temperatura (ex.: "color palette strictly limited to #12201E, #C9A46B and warm neutrals").
6. **Lente e câmera:** ex.: "shot on 85mm lens, f/2, shallow depth of field".
7. **Clima:** o clima da ficha em inglês (ex.: "luxurious, calm, scientific, high end skincare campaign aesthetic").
8. **Acabamento:** "fine film grain, subtle haze, high dynamic range, 8k detail".
9. **Restrições:** "no text, no letters, no numbers, no logos, no watermark, no people" (remova "no people" quando o modelo permitir pessoa anônima).

Proporção: peça a mesma do quadro final (4:5 ou 9:16). Elemento isolado: peça fundo transparente, ou fundo liso de uma cor fácil de remover.

## D3. Injeção da marca

O motor monta automaticamente a partir da ficha:

1. `PALETA`: "color palette strictly limited to {fundoEscuro}, {principal}, {apoio} and {temperatura} neutrals".
2. `CLIMA`: tradução de `estilo.clima` para inglês.
3. `LUZ`: de `estilo.luz`:
   1. dramatica: "dramatic chiaroscuro lighting, strong rim light";
   2. suave: "soft diffused window light";
   3. natural: "natural daylight";
   4. clinica: "bright clean clinical lighting".

## D4. Biblioteca de cenas e elementos

Use estes prompts como base e substitua {PALETA}, {CLIMA}, {LUZ} e {COMPOSICAO}.

1. **CENA_CONSULTORIO:** "Ultra realistic editorial photograph of an empty modern premium medical consultation room, minimalist furniture, a desk with a small plant and a closed notebook, large window, {LUZ}, {PALETA}, strongly blurred background bokeh, {COMPOSICAO}, {CLIMA}, 50mm lens f/1.8, fine film grain, no text, no letters, no logos, no people."
2. **ELEMENTO_FOLICULO:** "Photorealistic 3D render of a single human hair follicle with its root bulb and translucent glass like skin layers, isolated, floating, {LUZ}, {PALETA}, subtle subsurface scattering, scientific yet luxurious, clean background, centered, no text, no labels, no letters."
3. **TEXTURA_FIOS:** "Macro photograph of healthy dark hair strands flowing in soft waves, extreme detail of individual strands, shallow depth of field, {LUZ}, {PALETA}, abstract and elegant, no faces, no text."
4. **CENA_MACRO_TEMA (couro cabeludo):** "Macro dermatology photograph of a healthy scalp with hair emerging from follicles, clinical but beautiful, soft light, {PALETA}, shallow depth of field, no text, no faces."
5. **ELEMENTO_ESFERA:** "Photorealistic 3D render of a glossy translucent glass sphere with soft internal glow, {PALETA}, studio lighting, isolated on transparent background, no text."
6. **ELEMENTO_GOTA:** "Photorealistic 3D render of a single elegant serum drop, glossy, refractive, {PALETA}, studio light, isolated on transparent background, no text."
7. **ELEMENTO_CIENCIA:** "Photorealistic 3D render of a DNA double helix made of glossy glass and light, diagonal composition, {PALETA}, dark background, bokeh particles, no text, no letters."
8. **ELEMENTO_TABLET:** "Photorealistic 3D render of a modern tablet with a blank white screen, slightly rotated, on a dark surface, {LUZ}, {PALETA}, premium product photography, no text on the screen, no logos."
9. **CENA_LACO:** "Ultra realistic studio photograph of two hands gently holding an awareness ribbon in {CORCAMPANHA}, soft {LUZ}, background in {PALETA}, shallow depth of field, elegant and hopeful mood, no text, no faces."
10. **ELEMENTO_CALENDARIO:** "Photorealistic 3D render of an elegant minimal desk calendar with blank pages, {PALETA}, premium product photography, no text, no numbers."
11. **ELEMENTO_MECANISMO:** "Photorealistic 3D scientific illustration of a cross section of skin showing hair follicles at different growth stages, glass and light materials, {PALETA}, clean, no labels, no text."
12. **CENA_TEMA:** monte a partir do tema do post seguindo D2. Exemplos:
    1. "hands holding fallen hair strands";
    2. "a hairbrush with a few hairs on a marble sink";
    3. "a man looking at his hairline in a softly lit mirror, face not visible, seen from behind".

## D5. Integração do médico (o passo que mais pesa na qualidade)

1. **Recorte local** da melhor foto para o enquadramento pedido. Confira borda de cabelo e de jaleco. Se houver halo, refaça com outro modelo de matting ou peça outra foto ao time.
2. **Escolha da foto:** a luz da foto precisa vir do mesmo lado da luz da cena. Se não houver, espelhe a cena, nunca o médico (espelhar o rosto altera a aparência).
3. **Casamento de cor:** de 30% a 60% de transferência de média e desvio por canal, medidos na região da cena atrás do médico. A pele deve continuar natural. Compare antes e depois.
4. **Luz de recorte:** contorno de 20 a 40 px na cor principal, do lado da luz, de 35% a 60% de opacidade.
5. **Sombra de contato e oclusão:** elipse desfocada na base e escurecimento leve nas bordas inferiores do recorte.
6. **Proibido:**
   1. alterar o rosto, o corpo, a idade ou o tom de pele;
   2. gerar roupa nova;
   3. usar edição por IA no corpo do médico.
   Se a roupa da foto não combinar, escolha outra foto.

## D6. Geração com escolha

1. Gere de 3 a 4 variações por cena.
2. Avalie cada uma olhando a imagem:
   1. coerência com a paleta;
   2. espaço negativo onde o texto vai;
   3. ausência de texto e de artefatos;
   4. qualidade fotográfica.
3. Escolha a melhor, registre o motivo no plano e guarde as outras no cache.
4. Se nenhuma servir, reescreva o prompt (mais específico na composição e na luz) e gere de novo. No máximo 2 rodadas antes de cair numa cena alternativa da biblioteca.

## D7. Pós produção da imagem gerada

1. Upscale até 2 vezes o tamanho de uso.
2. Gradação de cor do post (B4).
3. Tingimento por modo cor com o fundo da tela, de 15% a 40%.
4. Remoção de fundo para elementos isolados, quando o provedor não entregar transparência.

## D8. Custo e registro

1. Registre no relatório de entrega o número de imagens geradas e o custo estimado.
2. Reaproveite cenas por médico: uma biblioteca em `marcas/<medico>/cenas/` com as cenas aprovadas. Antes de gerar, verifique se existe cena aprovada que sirva.
