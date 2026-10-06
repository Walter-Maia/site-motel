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
  No `data.js`, o último argumento de `mbSuite` são as legendas das fotos, na ordem dos arquivos:
  ```js
  mbSuite("romana","Romana","master","…", ["#161410","#4a3a1a","#8a7a3a"],
    ["Cama e afresco","Arcos","Ambiente principal"])   // 01.webp, 02.webp, 03.webp
  ```
  Suíte ainda sem material leva `null` no lugar das legendas e aparece no site com o nome e a
  legenda **"Aguardando material"** (hoje: Titanic, Country, Baiana e Árabe). Quando as fotos chegarem,
  crie a pasta, exporte os arquivos nesse padrão e troque o `null` pelas legendas. Sem vídeo, acrescente
  `false` ao final: `mbSuite(…, [legendas], false)`.
- **Originais** — `assets/Suites/` guarda os arquivos brutos da câmera (HEIC, DNG e vídeos HDR, ~1,2 GB).
  O site não usa essa pasta: não precisa ir para a hospedagem.
- **Fotos de categorias, Experiência e Home** — `image` em `MB.categories`, `MB.experiences` e `MB.intents`
  aponta para fotos das suítes com `MB.shot("id", número)`. Vazio = "Aguardando material".
- **Suítes em destaque na Home** — `MB.featured` (ids de três suítes; a primeira ocupa o quadro maior).
- **Cardápio** — `MB.menu` (use `price: 25` para mostrar valor, ou `null` para "Consulte").
- **Dúvidas frequentes** — `MB.faq` (`home: true` faz a pergunta aparecer também na Home).

## Tipografia

Títulos e nomes em **Newsreader** (serifada editorial), textos e rótulos em **Hanken Grotesk**; a Archivo
ExtraBold fica só no logotipo. As três vêm do Google Fonts (`<head>` do `index.html`) e os papéis estão nas
variáveis `--font-head`, `--font-body`/`--font-display` e `--font-brand` do `site.css`.
