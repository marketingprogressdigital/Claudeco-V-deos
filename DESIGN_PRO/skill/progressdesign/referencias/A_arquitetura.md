# A. ARQUITETURA TÉCNICA

## A1. Princípios

1. O plano de arte (`plano.json`) é a fonte da verdade. Todo PNG precisa ser reproduzível a partir do plano, da ficha e dos assets em cache.
2. Separação total entre conteúdo (roteiro), direção de arte (plano), identidade (ficha) e motor (código).
3. Nenhum valor visual fixo nos modelos. Os modelos produzem planos que referenciam tokens da ficha (`cor.principal`, `fonte.titulo`), nunca valores HEX ou nomes de fonte.
4. Tudo que custa dinheiro ou tempo (IA de imagem, remoção de fundo) fica em cache por hash do conteúdo de entrada.

## A2. Esquemas de dados (TypeScript)

### Ficha do médico (`marcas/<medico>/ficha.json`)

```ts
interface Ficha {
  medico: { tratamento: 'Dr' | 'Dra'; nome: string; crm: string; uf: string; rqe?: string; especialidade: string; instagram: string; cidade: string };
  cores: { principal: string; apoio: string; fundoClaro: string; fundoEscuro: string; textoSobreClaro: string; textoSobreEscuro: string; acento?: string };
  fontes: {
    titulo: { familia: string; arquivos: string[]; pesoForte: number; pesoLeve: number; temItalico: boolean; caixaAlta: boolean; tracking: number };
    texto: { familia: string; arquivos: string[]; pesoNormal: number; pesoForte: number };
    destaque?: { familia: string; arquivos: string[] };   // opcional: script ou serifada itálica para palavras de destaque
  };
  estilo: {
    clima: string;                 // ex.: "premium sóbrio masculino", "editorial acolhedor feminino"
    luz: 'dramatica' | 'suave' | 'natural' | 'clinica';
    temperatura: 'quente' | 'neutra' | 'fria';
    raio: number;                  // cantos em px
    textura: 'nenhuma' | 'grao' | 'papel';
    elementos: string[];           // ex.: ["linhas finas", "arcos", "monograma"]
    preferenciaFundo: 'escuro' | 'claro' | 'alternado';
    evitar: string[];
  };
  logo: { paraFundoClaro?: string; paraFundoEscuro?: string; monograma?: string };
  fotos: {
    retratos: Foto[];              // fotos do médico em estúdio ou consultório
    atendimento: Foto[]; detalhe: Foto[]; equipe: Foto[]; clinica: Foto[];
  };
  referenciasVisuais: string[];    // prints do feed atual do médico
}
interface Foto { arquivo: string; recorte?: string; enquadramento: 'rosto' | 'busto' | 'cintura' | 'corpo'; olhar: 'camera' | 'lado'; luz: 'esquerda' | 'direita' | 'frontal'; fundoOriginal: string; aprovada: boolean }
```

### Pedido (`pedidos/<arquivo>.json`)

```ts
interface Pedido { medico: string; modelo?: number; variacao?: 'A' | 'B' | 'C'; tema: string; objetivo?: string; observacoes?: string; dados?: Record<string, string> }
```

### Roteiro

Cada modelo define o próprio esquema de roteiro, com limite de caracteres por campo (`referencias/C_modelos.md`). O roteiro sempre inclui `legenda: { gancho, corpo, cta, hashtags }`, `aprovacaoMedica: string[]` (itens técnicos para o médico aprovar) e `confirmar: string[]`.

### Plano de arte

```ts
interface Plano { modelo: number; variacao: string; formato: '4x5' | '9x16'; telas: Tela[]; continuidade?: ElementoContinuo[] }
interface Tela { fundo: 'escuro' | 'claro' | 'principal' | 'imagem'; camadas: Camada[] }
type Camada =
  | { tipo: 'atmosfera'; estilo: 'noturno' | 'editorial' | 'clinico' | 'cor'; focoLuz: [number, number]; intensidade: number }
  | { tipo: 'imagemGerada'; pedidoImagem: PedidoImagem; caixa: Caixa; tratamento: Tratamento; mascara?: Mascara }
  | { tipo: 'fotoMedico'; foto: string; caixa: Caixa; integracao: Integracao; plano: 'atras' | 'meio' | 'frente' }
  | { tipo: 'foto'; foto: string; caixa: Caixa; mascara?: Mascara; tratamento: Tratamento }
  | { tipo: 'texto'; papel: 'gigante' | 'titulo' | 'subtitulo' | 'corpo' | 'rotulo' | 'numero' | 'assinatura'; conteudo: string; caixa: Caixa; estilo: EstiloTexto }
  | { tipo: 'forma'; forma: 'arco' | 'circulo' | 'faixa' | 'moldura' | 'linha' | 'anel'; caixa: Caixa; cor: TokenCor; opacidade: number }
  | { tipo: 'vidro'; caixa: Caixa; sobre: 'claro' | 'escuro' }
  | { tipo: 'efeito'; efeito: NomeEfeito; parametros: Record<string, number | string> };
interface Caixa { x: number; y: number; w: number; h: number; rotacao?: number; z: number }
type TokenCor = 'principal' | 'apoio' | 'fundoClaro' | 'fundoEscuro' | 'textoSobreClaro' | 'textoSobreEscuro' | 'acento';
```

## A3. Módulos

1. **pedido.ts:** interpreta o pedido. Se o modelo não veio, escolhe pela tabela de objetivos de `C_modelos.md` e registra o motivo.
2. **ficha.ts:** valida a ficha e calcula as derivações de cor: tons 10%, 25%, 50% e 85% de cada cor; versão clara e escura da principal; cor de texto ideal sobre cada fundo por contraste WCAG. Recusa a ficha se o texto principal tiver contraste menor que 4,5.
3. **roteiro.ts:** valida limites, CFM e hífen antes de qualquer imagem ser gerada.
4. **plano.ts:** cada modelo exporta `gerarPlano(roteiro, ficha, variacao)`. Você pode e deve ajustar o plano caso a caso, mas o gerador padrão já precisa entregar nota 8,5.
5. **imagem/provedor.ts:** interface `gerar(pedido: PedidoImagem): Promise<ImagemGerada>` com os campos `prompt`, `referencias` (imagens), `proporcao`, `fundoTransparente`, `variacoes`, `semente`. Implementações para Gemini e OpenAI. Cache em `cache/imagens/<hash>.png` com o JSON do pedido ao lado.
6. **medico/recorte.ts:** remoção de fundo local (biblioteca de matting em Node ou rembg em Python). Gera PNG com alfa e uma máscara de borda suavizada de 2 px. Guarda em `marcas/<medico>/recortes/`.
7. **medico/integracao.ts:** casamento de cor (ajusta média e desvio de luminância e de cada canal do recorte para a região da cena onde ele entra, com força de 30% a 60%), luz de recorte (contorno desfocado na cor principal, do lado da luz da cena), sombra de contato (elipse desfocada na base) e oclusão (escurecimento sutil nas bordas inferiores).
8. **composicao/camadas.ts:** transforma o plano em HTML com posicionamento absoluto e variáveis CSS vindas da ficha.
9. **composicao/efeitos.ts:** implementa cada efeito de `B_direcao_de_arte.md` seção B5 como função pura que recebe parâmetros e devolve HTML e CSS.
10. **composicao/tipografia.ts:**
    1. escala tipográfica;
    2. ajuste automático do tamanho até caber;
    3. quebra de linha balanceada, sem palavra sozinha na última linha;
    4. algarismos alinhados e proporcionais conforme o papel do texto;
    5. ajuste óptico de entrelinha para títulos grandes (de 0,9 a 1,0) e corpo (de 1,35 a 1,45).
11. **render.ts:** Playwright com fator de escala 2 e redução final para 1080 px de largura, para bordas mais nítidas. Carrossel renderizado como uma faixa única de largura 1080 vezes o número de telas e recortado tela a tela. Isso garante a continuidade perfeita entre telas.
12. **posproducao.ts:** com sharp, aplica grão monocromático (de 3% a 6%), vinheta suave, nitidez leve e exportação em PNG e JPG de qualidade 92.
13. **checagem.ts:** checagens automáticas de `E_revisao_visual.md`.
14. **prancha.ts:** prancha da entrega (todas as telas lado a lado, com notas) e prancha de grade (simulação de 3 x 3 do perfil).

## A4. Testes

1. Três marcas fictícias em `testes/marcas/` com identidades opostas: premium escura e dourada, editorial nude com serifada, e clínica moderna em azul petróleo com fonte condensada.
2. Para testes sem foto real, gere com a IA de imagem um retrato de pessoa fictícia anônima de jaleco, marcada como `ficticia: true`. Nunca use a foto de pessoa real como teste.
3. Teste de regressão visual: compare cada PNG com a referência aprovada e alerte se a diferença passar de 2%.
4. Teste de esquema para cada modelo, com roteiros de borda (texto no limite máximo, campo opcional vazio, palavra longa).
