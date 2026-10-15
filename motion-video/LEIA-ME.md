# Motion do site Montblack (9:16, 26,5 s)

Vídeo vertical 1080×1920 a 30 fps, feito a partir do site real e dos filmes das suítes.
O estilo segue a referência `../motion.mp4`: faixas arredondadas como transição, títulos que sobem
palavra por palavra com destaque, telas flutuando com toques e curvas de nível no fundo.
A identidade é a do Montblack: vinho, noite, marfim e dourado, com Hanken Grotesk, Newsreader e Archivo.

Arquivo final: `../motion-montblack.mp4`.

## Roteiro

| Tempo | Cena |
|---|---|
| 0–3,5 s | Fenda de luz e portão (a abertura do site). "Um endereço para noites *fora do comum.*" |
| 3,5–7,5 s | Faixas vinho. "21 cenários. *Um só destino.*" e um baralho de suítes lançado no ritmo |
| 7,5–12 s | Ripas de "teto móvel". "O Montblack *a um toque.*" O site real no celular: arrasta a Home, toca em "Conhecer as 21 suítes", toca na Mexicana |
| 12–16 s | A foto da Mexicana sai do celular e vira o filme da suíte. "Assista antes *de escolher.*" Mexicana, High Tech, Espanhola, Japonesa |
| 16–20 s | "Valores por categoria." Tabela com VIP, Master e Master Duplex (preços de `assets/js/data.js`) |
| 20–23 s | "O cenário está pronto. *Só falta você.*" |
| 23–26,5 s | O portão fecha com MONT e BLACK, botão "Consultar disponibilidade" e endereço |

## Como gerar de novo

Requer Node 14+, o Edge do Windows e o ffmpeg no PATH. As fontes vêm do Google Fonts, então é preciso internet.

```bash
npm install                        # só o pacote ws
bash prepara-filmes.sh             # trechos dos filmes originais (HDR → SDR) em material/filmes/
node captura-site.js               # fotos do site real em cada posição de rolagem, em material/site/
node render.js stills 3,9,13,18    # quadros de conferência em saida/stills/
node trilha.js                     # trilha em saida/trilha.wav
BLUR=4 node render.js video        # vídeo sem som em saida/video-mudo.mp4 (cerca de 25 min)
ffmpeg -i saida/video-mudo.mp4 -i saida/trilha.wav -c:v copy -c:a aac -b:a 256k -shortest -movflags +faststart ../motion-montblack.mp4
```

- `stage.html` é o palco. Cada quadro é função pura do tempo: `exportFrame(t)` posiciona tudo e espera as imagens.
  Os tempos ficam no objeto `T` e em cada cena do `render(t)`.
- `celular.js` tem o roteiro de rolagem e toques do celular. A captura e o palco usam o mesmo arquivo.
  Se mudar um tempo ali, rode `captura-site.js` de novo.
- `BLUR` é o número de subquadros por quadro do borrão de movimento (1 desliga e fica 4× mais rápido).

## Trilha

A trilha é original, sintetizada por `trilha.js`: deep house lento a 120 BPM em Ré menor, com bumbo, palmas,
chimbal, baixo, piano elétrico e pad, mais efeitos nos cortes (varreduras, toques, números, impacto no logotipo).
Para usar uma música licenciada, troque `saida/trilha.wav` no comando final. O ritmo do vídeo está em 120 BPM
e os cortes caem nos tempos 3,5, 7,5, 12, 16, 20 e 23 s.
