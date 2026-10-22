# RECEITA 01 | AUTORIDADE COM TÍTULO GIGANTE (estático)

Receita de direção de arte deste modelo. Use junto com `skill/progressdesign/referencias/B_direcao_de_arte.md` (efeitos e anti padrões) e `cenas/cenas.json` (prompts de imagem).

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
