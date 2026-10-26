# Institucional, Dr. Cristovão Carvalho

Vídeo vertical (1080x1920, 30 fps) editado sobre a fala do Dr. Cristovão (IMG_6581.MOV), com a voz original.

## Regras desta edição
- A base é a fala dele do começo ao fim.
- Logo (monograma CC) só no encerramento. Nada de abertura com logo.
- Imagem de apoio só de cirurgia (ele operando). Fotos posadas dele não entram.
- Quando ele cita uma cidade: efeito de cidade (mapa estilizado, pino caindo, o mapa se abre num círculo e revela a foto da cidade, nome letra a letra).

## Elementos
| Elemento | Quando |
|---|---|
| Nome na tela (painel marinho, dourado) | início da fala |
| Efeito de cidade | no segundo em que ele fala cada cidade |
| Apoio de cirurgia | trechos escolhidos dos vídeos de cirurgia |
| Motion de planejamento | se ele falar de planejamento ou desenho da linha frontal |
| Encerramento com monograma, nome, área e aviso | final |

Trilha original (`trilha.py`, 100 BPM, dó maior), por baixo da voz: abaixa sozinha quando ele fala (cerca de 10 dB abaixo da voz) e sobe nas pausas e no encerramento. Mix final em -14 LUFS.

## Identidade
Manual "IDENTIDADE VISUAL, Dr. Cristovão Carvalho": marinho #000B3D, grafite #343434, dourado #D1A456 e Montserrat. Monograma CC refeito em Cormorant Garamond até chegar o PNG oficial.

## Como gerar
1. Vídeo da fala em `brutos/fala.mov`, vídeos de cirurgia em `brutos/`, fotos das cidades em `cidades/` (brutos não vão para o repositório).
2. Em `roteiro.json`: `trechos` (cortes da fala, ou null para usar inteira) e `inserts` (veja `_exemplos_de_inserts`), com os tempos em segundos do vídeo já cortado.
3. `python3 editar.py --previa` gera quadros de conferência; `python3 editar.py` exporta `saida/institucional_cristovao.mp4`.

## Pendências
- Vídeo da fala com menos de 10 MB por arquivo (limite do conector do Drive)
- Cidades citadas e fotos de cada uma
- Vídeos dele operando para o apoio
- CRM/UF e RQE (`medico.crm`), exigidos pelo CFM em todas as telas
- Logo oficial em PNG
