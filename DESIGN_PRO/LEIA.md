# DESIGN PRO

Motor de design da Progress Capilar: posts e carrosséis de Instagram para médicos, com a identidade visual de cada um, foto real recortada, checagens do CFM e de contraste, PNG, PDF em alta e legenda.

Como usar: abra o Claude Code e peça, por exemplo, "Faça um carrossel para a Dra. Fulana sobre queda de cabelo; a identidade visual e as fotos estão nesta pasta: ...". A skill progressdesign faz o resto e mostra a prancha para você aprovar.

Pastas:

1. `marcas/<medico>`: ficha, logos e fotos de cada médico (`exemplo_marca_a`, `b` e `c` são fictícias, para teste).
2. `pedidos`: o roteiro de cada post.
3. `saida/<medico>`: as artes prontas (PNG, JPG, PDF, legenda e relatório).
4. `motor`: o código. `catalogo.json`, `receitas_ia`, `cenas` e `biblioteca`: os dados de direção de arte.
5. `.env`: chaves de IA de imagem, se um dia forem usadas. Nunca envie esse arquivo para ninguém.

Para mandar o DESIGN PRO para outra pessoa ou outra conta: rode `bash ~/DESIGN_PRO/empacotar/empacotar.sh` e envie o ZIP que ele gera em `~/DESIGN_PRO/pacotes`.
