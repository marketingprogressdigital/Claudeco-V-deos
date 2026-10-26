# Bastidores, Dr. Marcel Giolo

Vídeo institucional vertical (1080x1920, 30 fps, cerca de 52 s) com os bastidores do transplante capilar.

## Estrutura
| Cena | Compassos | Conteúdo |
|---|---|---|
| Abertura | 1,5 | Logo desenhado: símbolo em varredura circular, letras do GIOLO uma a uma, brilho |
| 01 A marcação | 4 | Título "Os bastidores", palavras PLANEJAMENTO e PRECISÃO |
| Motion folicular | 1 | Unidades foliculares de 1, 2 e 3 fios sobre a cirurgia desfocada |
| 02 A cirurgia | 4 | Palavras TÉCNICA e EXPERIÊNCIA, batida de coração na trilha |
| 03 O primeiro olhar | 3 | Clímax da trilha, palavras CUIDADO e CONFIANÇA |
| Encerramento | 2 | Logo, "Tecnologia e cuidado para valorizar CADA FIO.", @, CRM e aviso |

Assinatura com CRM aparece em todas as telas. Trilha original sintetizada em `trilha.py` (72 BPM), sem direito autoral de terceiros. Os cortes caem no tempo da música.

## Identidade
Extraída do voucher e do panfleto oficiais da marca, no Drive: fundo café #1C100E, creme #E3D8C4, Italiana nos títulos e Questrial nos textos. Logo em `marca/`.

## Como gerar
1. Coloque os brutos em `brutos/` com os nomes `marcacao.mov`, `cirurgia.mov` e `pos_imediato.mov` (essa pasta não vai para o repositório, as imagens são de paciente).
2. Ajuste em `roteiro.json` o `inicio` de cada trecho, e se preciso `foco` e `zoom`.
3. `python3 editar.py --previa` gera quadros de conferência em `saida/previa/`.
4. `python3 editar.py` exporta `saida/bastidores_marcel_giolo.mp4`.

`python3 editar.py --motions` gera só a camada de motion e trilha, sem os brutos.

Dependências: ffmpeg, numpy, scipy, opencv-python-headless, pillow.
