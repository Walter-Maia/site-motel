# Motel Montblack — site

Site estático, sem build e sem dependências. Basta abrir `index.html` no navegador
ou enviar a pasta inteira para qualquer hospedagem (Hostinger, Netlify, Vercel, cPanel…).

## Estrutura

```
index.html              → todas as páginas (Home, Suítes, Suíte, Experiência, Cardápio, Sobre, Contato)
assets/css/site.css     → sistema visual
assets/js/data.js       → CONTEÚDO editável (dados do motel, suítes, preços, cardápio, FAQ)
assets/js/site.js       → lógica (navegação, overlays, flipbook, galeria) — não precisa mexer
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

## O que editar em `assets/js/data.js`

- **WhatsApp / telefone** — `MB.config.whatsapp` (somente números, ex.: `"5531999999999"`).
  Assim que preenchido, o botão "Enviar pelo WhatsApp" aparece na consulta de disponibilidade
  e o contato aparece na página Contato e no rodapé. Enquanto vazio, o site mostra
  "Contato para reservas em atualização".
- **Preços e períodos** — `MB.categories` (`prices`) e `MB.lodging` (pernoite, hora adicional, regras).
- **Fotos das suítes** — ⚠️ as fotos atuais são **ilustrativas** (Unsplash), apenas para
  visualizar o layout; não são do Montblack. Cada suíte tem um array `images` (último argumento
  de `mbSuite`), na mesma ordem de `views`. Troque os IDs por caminhos locais ou URLs completas:
  ```js
  mbSuite("arabe","Árabe","duplex","…", ["#180c14","#4a1430","#8a2a5a"],
    ["Ambiente principal","Spa com hidromassagem","Segundo andar","Detalhes da suíte"],
    ["img/arabe-1.jpg","img/arabe-2.jpg","img/arabe-3.jpg","img/arabe-4.jpg"])
  ```
  O mesmo vale para `image` em `MB.categories` (hero e página Suítes) e em `MB.intents`
  (preview da Home). Deixe `[]`/vazio para voltar ao placeholder em gradiente.
- **Suítes em destaque na Home** — `MB.featured` (ids de três suítes).
- **Cardápio** — `MB.menu` (use `price: 25` para mostrar valor, ou `null` para "Consulte").
- **Dúvidas frequentes** — `MB.faq` (`home: true` faz a pergunta aparecer também na Home).
