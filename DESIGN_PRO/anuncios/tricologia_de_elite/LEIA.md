# Tricologia de Elite, criativos de tráfego (Meta, feed 4:5)

10 criativos com as copys do João (03/11/2026), na identidade do Manual de Marca v1.1 (verde oliva, dourado, Fraunces, Manrope e IBM Plex Mono, logo oficial extraído do PDF do manual).

## Como gerar

```bash
cd DESIGN_PRO/anuncios/tricologia_de_elite && node render.mjs
```

Para um só: `node render.mjs 06`. As artes saem em `DESIGN_PRO/saida/tricologia_de_elite/trafego/`.

## Imagem de fundo (gancho)

Coloque a imagem em `fundos/NN.jpg` (NN = número do criativo, mínimo 1080 px de largura) e rode de novo.

1. `fundos/NN.jpg`: imagem final, arte sai limpa.
2. `fundos/NN_baixa.jpg`: provisória em baixa resolução, arte sai com a faixa RASCUNHO.
3. Sem arquivo: arte sai com o reflexo do verde e a faixa FUNDO PENDENTE.

A cena de cada fundo está descrita em `criativos.json` (campo `fundo`). Os fundos 01, 02 e 04 já foram gerados no Canva (ids no campo `canva`); faltam baixar em alta. Os demais ainda não foram gerados.

## Regras do manual aplicadas

1. Verde com reflexo radial, nunca chapado. Dourado só sobre o verde: ELITE, destaque do título e linha de corte.
2. Linha de corte uma vez por peça, reta, 2 px.
3. Sem "Dra." e sem promessa de resultado nas artes (o manual pede "Ana Lara, esteticista e terapeuta capilar").
