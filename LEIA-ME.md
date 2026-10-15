# Motel Montblack — site

Site estático, sem build e sem dependências. Basta abrir `index.html` no navegador
ou enviar a pasta inteira para qualquer hospedagem (Hostinger, Netlify, Vercel, cPanel…).

## Estrutura

```
index.html              → abertura (intro) + todas as páginas (Home, Suítes, Suíte, Experiência, Cardápio, Sobre, Contato)
assets/css/site.css     → sistema visual (inclui o roteiro da abertura)
assets/js/data.js       → CONTEÚDO editável (dados do motel, suítes, preços, cardápio, FAQ)
assets/js/site.js       → lógica (navegação, overlays, flipbook, galeria) — não precisa mexer
assets/media/           → fotos (WebP) e filmes (MP4) das suítes, prontos para web
assets/Suites/          → originais da câmera (não são usados pelo site)
_legacy/                → backup da landing page original
```

## Publicação no WordPress.com

O site está publicado em **motelmontblack.wpcomstaging.com** (e em **motelmontblack.com.br** quando o registro
do domínio terminar), pelo plugin **Montblack — Site**, que serve o site como página inicial — o tema do
WordPress fica instalado, mas não aparece. As fotos e os filmes ficam na **Biblioteca de Mídia** com nomes
planos (`mexicana-01.webp`, `mexicana-01-sm.webp`, `mexicana-filme.mp4` …); o plugin encontra cada um pelo nome.

Para atualizar depois de mudar o site:

1. `python wordpress/gerar-plugin.py` — gera em `dist/` o `montblack-site.zip` (leve), o
   `montblack-site-completo.zip` (com as mídias) e a pasta `midia-wordpress/` (mídias com nome plano).
2. Textos, preços, CSS ou JS mudaram: em WP Admin › Plugins › Adicionar novo › Enviar plugin, envie o
   `montblack-site.zip` e escolha **Substituir o atual pelo enviado**.
3. Foto ou filme novo: envie só os arquivos novos de `dist/midia-wordpress/` em Mídia › Adicionar nova.
   Foto trocada com o mesmo nome: apague a antiga na Biblioteca antes de enviar (senão o WordPress renomeia
   a nova para `…-1.webp` e o site continua usando a antiga).

A visibilidade do WordPress.com vale também para o site: em "Em breve" ou privado, só quem é do site o vê.

## Navegação

O site usa rotas por hash, que funcionam em qualquer hospedagem e também abrindo o arquivo local:

| Área        | Endereço                          |
|-------------|-----------------------------------|
| Home        | `index.html#/`                    |
| Suítes      | `index.html#/suites`              |
| Suítes VIP  | `index.html#/suites?cat=vip`      |
| Uma suíte   | `index.html#/suites/arabe`        |
| Experiência | `index.html#/experiencia`         |
| Cardápio    | `index.html#/cardapio`            |
| Sobre       | `index.html#/sobre`               |
| Dúvidas     | `index.html#/sobre?to=duvidas`    |
| Contato     | `index.html#/contato`             |

Os links antigos da landing page (`#suites`, `#cardapio`, `#localizacao`…) continuam funcionando.

## Abertura (intro)

A cada carregamento do site a tela nasce preta, uma fresta de luz corta o centro, o logotipo
acende a partir dela e o "portão" se abre no vão entre MONT e BLACK, revelando a página.
Dura cerca de 3 s. Esc, Enter, Tab, rolagem, toque ou clique pulam na hora. Não roda com
"reduzir movimento" ligado no sistema nem em aba aberta em segundo plano.

- **Onde fica** — o bloco `<!-- ABERTURA -->` no começo do `<body>` do `index.html` (desenho e controle),
  a linha de decisão no `<head>` e a seção `ABERTURA (INTRO)` do `assets/css/site.css` (roteiro e tempos).
- **Tempos** — ao mudar a duração no CSS, ajuste `TOTAL` no script do bloco: é quando o portão abre.
- **Tocar só uma vez por sessão** — troque o conteúdo do `<script>` de decisão do `<head>` por:
  ```js
  (function(){try{if(sessionStorage.getItem("mb-intro")||document.hidden||matchMedia("(prefers-reduced-motion: reduce)").matches)return;sessionStorage.setItem("mb-intro","1");document.documentElement.classList.add("intro-active")}catch(e){}})();
  ```
- **Desligar** — apague o `<script>` de decisão do `<head>` (marcado com o comentário "Abertura").
- **Logotipo** — as letras são os contornos da Archivo ExtraBold, a fonte da marca no site, com o
  mesmo espaçamento do cabeçalho; por isso a abertura não depende de a fonte ter carregado.
  Mudar o texto da assinatura ("MOTEL ★★★★★ IPATINGA") exige gerar os contornos de novo.

## O que editar em `assets/js/data.js`

- **WhatsApp / telefone** — `MB.config.whatsapp` (somente números, ex.: `"5531999999999"`).
  Assim que preenchido, o botão "Enviar pelo WhatsApp" aparece na consulta de disponibilidade
  e o contato aparece na página Contato e no rodapé. Enquanto vazio, o site mostra
  "Contato para reservas em atualização".
- **Preços e períodos** — `MB.categories` (`prices`) e `MB.lodging` (pernoite, hora adicional, regras).
- **Fotos e filmes das suítes** — o material é do próprio Montblack e fica em `assets/media/<id-da-suíte>/`:
  `01.webp`, `02.webp`… (1200 px de largura; a `01` é a capa), `01-sm.webp`… (as mesmas em 600 px, para
  miniaturas), `filme.mp4` (vídeo vertical 720×1280, H.264, sem áudio) e `filme.webp` (capa do vídeo).
  No `data.js`, o primeiro argumento de `mbSuite` é o número da suíte (201 a 221, que o site mostra no
  índice, na página da suíte e no baralho da Home) e o último são as legendas das fotos, na ordem dos arquivos:
  ```js
  mbSuite(217,"romana","Romana","master","…", ["#161410","#4a3a1a","#8a7a3a"],
    ["Cama e afresco","Arcos","Ambiente principal"])   // 01.webp, 02.webp, 03.webp
  ```
  As suítes ficam na ordem dos números; "anterior" e "próxima" na página da suíte seguem essa ordem.
  No índice de suítes (desktop), passar o mouse sobre uma suíte toca o `filme.mp4` dela num quadro que
  acompanha o cursor.
  Suíte ainda sem material leva `null` no lugar das legendas e aparece no site com o nome e a
  legenda **"Aguardando material"** (hoje: Naval, Country, Árabe e Baiana). Quando as fotos chegarem,
  crie a pasta, exporte os arquivos nesse padrão e troque o `null` pelas legendas. Sem vídeo, acrescente
  `false` ao final: `mbSuite(…, [legendas], false)`.
- **Originais** — `assets/Suites/` guarda os arquivos brutos da câmera (HEIC, DNG e vídeos HDR, ~1,2 GB).
  O site não usa essa pasta: não precisa ir para a hospedagem.
- **Categorias (página Suítes)** — três cartões com o nome (VIP, MASTER, MASTER DUPLEX), o número de suítes,
  o texto `tagline`, as comodidades e os preços de `MB.categories`. Não usam foto: ficam iguais entre si
  mesmo enquanto o Master Duplex não tem material.
- **Experiência** — cada comodidade de `MB.experiences` mostra um desenho de linha animado, em vermelho,
  escolhido por `icon` (`hidro`, `teto`, `boate`, `ar`, `tv`, `frigobar`, `privacidade`, `temas`).
  Os desenhos ficam em `EXP_ICONS`, no `site.js`.
- **Cores escuras** — as áreas escuras usam o preto da marca (`--night`, preto com fundo de vinho) com uma luz
  vermelha; o vermelho (`--wine`) fica para chamadas e destaques. Não há preto neutro de fundo.
- **Baralho da Home** — as cartas do topo da Home se embaralham sozinhas a cada ~3,6 s, mostrando as suítes
  que têm fotografia (a capa `01.webp` de cada uma), numa ordem nova a cada visita. Clicar ou tocar numa carta
  de trás a traz para a frente; clicar na da frente abre a suíte. Para quando o cursor ou o foco do teclado
  está nele e por alguns segundos depois de uma escolha; com "reduzir movimento", não se embaralha sozinho.
  O intervalo é `DECK_EVERY` no `site.js`.
- **Suítes em destaque na Home** — `MB.featured` (ids das três suítes com que a seção começa; a primeira ocupa o
  quadro maior). Depois, os quadros trocam de suíte um de cada vez (a cada ~4,5 s, `FEAT_EVERY` no `site.js`),
  percorrendo todas as suítes com foto; param com o cursor em cima ou fora da tela.
- **Cardápio** — o livro 3D é montado a partir de `MB.menu`, **página por página**, com o mesmo conteúdo do
  cardápio impresso das suítes. Cada página tem um `chapter` (Cozinha, Bebidas, Frigobar, Diversos, Canais)
  e uma ou mais seções com `title`, `sub`, `note` e `items` (ou `groups` com subtítulos, ou `channels`).
  Item: `{ name, desc, side, origin, price }` — `price: 25` mostra R$ 25,00; `null` mostra "Consulte".
  Capa, "Bem-servidos" (com os avisos de `MB.menuInfo`), sumário, atalhos por capítulo e a lista corrida
  são gerados sozinhos. Página que ficar cheia demais encolhe a letra até caber; se encolher muito,
  divida-a em duas — para uma seção de duas páginas ficar lado a lado, ela deve começar numa página ímpar.
  Para virar: clicar/tocar na metade da página, as setas, o teclado ou **segurar a folha e arrastar para o lado**
  (a borda acompanha o ponteiro; passou da metade ou foi um peteleco, a página termina de virar; senão, volta).
  No celular, arrastar para a esquerda avança e para a direita volta; o gesto vertical continua rolando a página.
- **Galeria da suíte** — galeria imersiva (skills `hero-imersiva-miniaturas` + imagem revelada com máscara): a foto
  grande com moldura dourada e, ao fundo, a própria foto desfocada como luz ambiente da sala escura; ao lado, número,
  legenda e miniaturas numeradas. A próxima foto se abre como cortina, do lado para onde se vai; o filme toca mudo no
  quadro. Miniaturas, setas, teclado e arraste no celular trocam; clicar na foto amplia.
- **Entradas no scroll** — mesmo padrão da Liga ForDoctor (`ENTRADAS NO SCROLL` no `site.js`): cada bloco volta ao
  início quando sai inteiro da tela e toca de novo na volta. Títulos `.h2` sobem linha a linha; listas com
  `data-stagger` entram item a item; fotos com `data-mask` são descobertas de baixo para cima; `.reveal` sobe e
  aparece (`reveal-d1…d3` atrasam); listas longas com `data-stagger="each"` entram item a item. Rolando para cima,
  tudo entra no primeiro pixel e com o movimento invertido (vem de cima). O que está na tela no carregamento não é
  escondido; sem JS ou com "reduzir movimento", tudo fica no estado final.
- **Dúvidas frequentes** — `MB.faq` (`home: true` faz a pergunta aparecer também na Home).

## Tipografia

Títulos e nomes em **Newsreader** (serifada editorial), textos e rótulos em **Hanken Grotesk**; a Archivo
ExtraBold fica só no logotipo. As três vêm do Google Fonts (`<head>` do `index.html`) e os papéis estão nas
variáveis `--font-head`, `--font-body`/`--font-display` e `--font-brand` do `site.css`.
