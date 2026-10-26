# Institucional, Dr. Cristovão Carvalho

Vídeo vertical (1080x1920, 30 fps, 42 s) na identidade do manual da marca.

## Estado atual
Esta versão mostra os motions e a trilha sobre as fotos do banco dele (sessão Formação 360). O vídeo bruto principal (IMG_6581.MOV, 58 MB) ainda não entrou, porque o conector do Drive só baixa arquivos de até 10 MB.

## Estrutura
| Cena | Compassos | Conteúdo |
|---|---|---|
| Abertura | 2 | Anel dourado desenhado, CC entrelaçado, nome e área, brilho |
| Apresentação | 3 | Retrato com aproximação lenta e nome na tela em painel de vidro marinho |
| Valores | 3 | PRECISÃO, CONFIANÇA, EXCELÊNCIA (valores do manual) subindo em dourado |
| Planejamento | 2,5 | Vista de cima da cabeça, linha frontal desenhada, unidades distribuídas |
| Cidade | 2,5 | Câmera mergulha no mapa, pino cai com ondas, nome da cidade letra a letra |
| Final | 2 | "Segurança e naturalidade em cada etapa" |
| Encerramento | 2,5 | Monograma, nome, área e aviso |

Trilha original em `trilha.py` (100 BPM, dó maior), sem direito autoral de terceiros. Os cortes caem no tempo da música.

## Identidade
Do manual "IDENTIDADE VISUAL, Dr. Cristovão Carvalho": marinho #000B3D, grafite #343434, dourado #D1A456 e Montserrat. O monograma CC foi refeito em Cormorant Garamond a partir das peças publicadas. Ele deve ser trocado pelo PNG oficial assim que chegar.

## Pendências
- Vídeo bruto em `brutos/` e o minuto em que ele cita cada cidade
- Fotos das cidades: no `roteiro.json`, campo `foto_fundo` da cena de cidade
- CRM/UF e RQE no campo `medico.crm` (CFM exige em todas as telas)
- Logo oficial em PNG

## Como gerar
`python3 editar.py --previa` gera os quadros de conferência. `python3 editar.py` exporta `saida/institucional_cristovao.mp4`.
