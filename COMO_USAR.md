# DESIGN PRO, como usar

Motor de posts estáticos, capas de Reels e carrosséis da Progress Capilar.

## Começar

1. Abra este repositório no Claude Code (claude.ai/code ou no app).
2. Peça a arte em português, por exemplo:
   > Faça um carrossel para a Dra. Laila sobre sinais de queda de cabelo.
3. A skill `progressdesign` é carregada sozinha e o motor é preparado no início da sessão.

Marcas já cadastradas: `dra_jucelia`, `dra_laila` (e 3 marcas de exemplo).
Para um médico novo, anexe ou indique a identidade visual (logos PNG, cores, manual) e as fotos reais.

## Bom saber

- As artes saem em `DESIGN_PRO/saida/` e não ficam salvas no repositório. Baixe as telas ao final.
- Artes **com foto do médico** só funcionam no Mac (Claude Code no computador, abrindo este repositório). Na nuvem (claude.ai/code) saem apenas artes sem foto.
- Dados que faltarem (CRM, RQE etc.) aparecem como CONFIRMAR e a arte sai como rascunho.
- IA de imagem está desligada. Ligar exige chave em `DESIGN_PRO/.env` (nunca no chat e nunca no repositório) e autorização do Juan.
