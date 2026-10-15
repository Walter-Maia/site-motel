/* ============================================================
   MOTEL MONTBLACK — CONTEÚDO DO SITE
   Este arquivo concentra tudo que é "conteúdo": dados do negócio,
   categorias, suítes, cardápio, comodidades e dúvidas frequentes.
   A lógica do site fica em site.js e não precisa ser alterada
   para atualizar textos, preços ou fotos.
============================================================ */
window.MB = window.MB || {};

/* ------------------------------------------------------------
   FOTOGRAFIAS E FILMES
   Todo o material é do próprio Montblack e fica em assets/media/<id-da-suíte>/:
     01.webp, 02.webp …   fotos (1200 px de largura) — a 01 é a capa
     01-sm.webp …         as mesmas fotos em 600 px, para miniaturas
     filme.mp4            vídeo da suíte · filme.webp = capa do vídeo
   MB.img escolhe sozinha a versão menor quando a imagem aparece pequena.
   Suíte sem pasta de mídia aparece no site como "Aguardando material".
------------------------------------------------------------ */
/* Onde ficam as mídias. Abrindo o index.html direto: assets/media/<suíte>/01.webp.
   No WordPress, o plugin "Montblack — Site" define window.MB_MEDIA: { base, flat, map }.
   Com flat, os arquivos estão na Biblioteca de Mídia com nomes planos (<suíte>-01.webp,
   <suíte>-01-sm.webp, <suíte>-filme.mp4 …) e o map traz o endereço exato de cada um. */
const MB_MEDIA = window.MB_MEDIA || {};
MB.mediaPath = MB_MEDIA.base || ((window.MB_BASE || "") + "assets/media/");
MB.mediaFile = function(id, file){
  if(!MB_MEDIA.flat) return MB.mediaPath + id + "/" + file;
  const name = id + "-" + file;
  return (MB_MEDIA.map && MB_MEDIA.map[name]) || MB.mediaPath + name;
};
MB.img = function(src, w){
  if(!src) return null;
  if(w && w <= 640 && /\.webp$/.test(src) && !/-sm\.webp$/.test(src)){
    if(MB_MEDIA.map){ const sm = src.split("/").pop().replace(/\.webp$/, "-sm.webp"); return MB_MEDIA.map[sm] || src; }
    if(src.startsWith(MB.mediaPath)) return src.replace(/\.webp$/, "-sm.webp");
  }
  return src;
};
MB.shot = function(id, n){ return MB.mediaFile(id, String(n).padStart(2,"0") + ".webp"); };

/* ------------------------------------------------------------
   DADOS DO NEGÓCIO
   whatsapp / phone: preencher quando o canal de reservas estiver
   definido. Ex.: whatsapp: "5531999999999". Enquanto vazio, o site
   exibe "Contato para reservas em atualização".
------------------------------------------------------------ */
MB.config = {
  name: "Motel Montblack",
  city: "Ipatinga",
  address: "R. Serra Geral, 551 - Jardim Panorama, Ipatinga - MG, CEP 35164-236",
  addressLines: ["R. Serra Geral, 551", "Jardim Panorama", "Ipatinga - MG", "CEP 35164-236"],
  whatsapp: "",      /* [INSERIR WHATSAPP — somente números, com DDI e DDD] */
  phone: "",         /* [INSERIR TELEFONE] */
  instagram: "https://www.instagram.com/montblackipatinga/",
  instagramHandle: "@montblackipatinga",
  open24Hours: true,
  legacySite: "https://www.motelmontblackipatinga.com.br/"
};

MB.lodging = {
  overnight: { days: "domingo à sexta-feira", period: "18:00 até 14:00" },
  extraHour: 30,
  rules: [
    "Proibida a entrada de menores de 18 anos.",
    "O estabelecimento não se responsabiliza por objetos esquecidos.",
    "Preços sujeitos a alteração sem aviso prévio."
  ]
};

/* ------------------------------------------------------------
   CATEGORIAS
------------------------------------------------------------ */
MB.categories = {
  vip: {
    id: "vip", label: "VIP", title: "Suítes VIP", count: 13,
    tagline: "Treze cenários temáticos com hidromassagem, boate e teto móvel — a porta de entrada para a experiência Montblack.",
    amenities: ["Ar-condicionado", 'TV LCD 52"', 'TV LCD 32"', "Hidromassagem", "Frigobar", "Boate", "Teto móvel"],
    prices: { oneHour: 99, twoHours: 120, overnight: 200 },
    tones: ["#33161a", "#601313", "#8a3a2a"]
  },
  master: {
    id: "master", label: "Master", title: "Suítes Master", count: 6,
    tagline: "Ambientes amplos com hidromassagem, duas TVs LED e o dobro de conforto para quem quer ir além.",
    amenities: ["Ar-condicionado", '2 TVs LED de 47"', "Hidromassagem", "2 frigobares", "Boate", "Teto móvel"],
    prices: { oneHour: null, twoHours: 127, overnight: 220 },
    tones: ["#1c1114", "#4a0f14", "#7a2a3a"]
  },
  duplex: {
    id: "duplex", label: "Master Duplex", title: "Master Duplex", count: 2,
    tagline: "Dois andares, hidromassagem e a mais completa estrutura da casa — a experiência Montblack em sua forma máxima.",
    amenities: ["2 andares", "Ar-condicionado", '2 TVs LED de 47"', "Hidromassagem", "2 frigobares", "Boate", "Teto móvel"],
    prices: { oneHour: null, twoHours: 137, overnight: 240 },
    tones: ["#14100f", "#3d1a10", "#8a5a2a"]
  }
};

/* ------------------------------------------------------------
   SUÍTES — 21 (13 VIP, 6 MASTER, 2 MASTER DUPLEX), na ordem dos números
   Primeiro argumento = número da suíte (201 a 221).
   Último argumento = legendas das fotos, na ordem dos arquivos
   01.webp, 02.webp … da pasta assets/media/<id>/ (a 01 é a capa).
   Use null enquanto a suíte não tiver fotos: o site mostra
   "Aguardando material". Para a suíte sem vídeo, acrescente
   false ao final: mbSuite(…, [legendas], false).
------------------------------------------------------------ */
function mbSuite(number, id, name, category, description, tones, shots, film){
  const cat = MB.categories[category];
  const views = shots || [];
  return {
    number, id, name, category,
    categoryLabel: cat.label,
    description,
    amenities: cat.amenities,
    prices: cat.prices,
    tones: tones || cat.tones,
    views,
    images: views.map((_, i) => MB.shot(id, i + 1)),
    film: views.length && film !== false ? { src: MB.mediaFile(id, "filme.mp4"), poster: MB.mediaFile(id, "filme.webp") } : null
  };
}

MB.suites = [
  mbSuite(201,"mexicana","Mexicana","vip","Um sombrero gigante suspenso sobre a cama redonda, cactos e piso de pedra. Calorosa e bem-humorada, com hidromassagem sob o céu aberto.",["#2a1208","#7a2a10","#c2652a"],["Ambiente principal","Cama redonda","Vista da entrada","Teto móvel","Hidromassagem","Banheiro"]),
  mbSuite(202,"high-tech","High Tech","vip","Piso negro, luz azul e um mural de palco que ocupa a parede inteira. A suíte mais noturna da casa, com globo espelhado e hidromassagem sob o teto móvel.",["#101418","#1e3a4a","#3a6a8a"],["Ambiente principal","Cama e mural","Luz azul","Cama","Estar","Teto móvel"]),
  mbSuite(203,"naval","Naval","vip","Romantismo clássico inspirado na elegância dos grandes transatlânticos. Um convite a uma noite memorável.",["#101620","#1a2a4a","#4a6a9a"],null),
  mbSuite(204,"bangalo","Bangalô","vip","Cama sob um pergolado de madeira, luz âmbar e a hidromassagem banhada em verde do outro lado do vidro. Um refúgio de clima tropical, a poucos minutos do centro de Ipatinga.",["#1e1a12","#4a3a1a","#8a6a2a"],["Ambiente principal","Estar","Hidromassagem e cama","Vista pelo vidro","Hidromassagem"]),
  mbSuite(205,"texana","Texana","vip","Madeira escura, um entardecer de faroeste pintado na parede e a hidromassagem redonda sob o teto móvel. Feita para encontros sem pressa.",["#241610","#5a3018","#9a6a3a"],["Cama e mural","Ambiente principal","Hidromassagem","Teto móvel","Cama","Hidromassagem e cama","Estar","Banheiro"]),
  mbSuite(206,"japonesa","Japonesa","vip","Vermelho laqueado, painéis em treliça e cama baixa sobre um tablado de madeira. Linhas limpas, bambu e uma calma que desacelera a noite.",["#181414","#5a1a1a","#a83a3a"],["Cama e mural","Ambiente principal","Estar e cama","Teto móvel","Hidromassagem"]),
  mbSuite(207,"indiana","Indiana","vip","Um pavilhão de madeira entalhada abriga a cama redonda, diante do Taj Mahal ao entardecer. Piso em mosaico colorido e hidromassagem entre folhagens.",["#1c1020","#4a1a4a","#8a3a7a"],["Cama e pavilhão","Cama redonda","Hidromassagem","Detalhe da hidromassagem","Estar","Estar e pavilhão"]),
  mbSuite(208,"egipcia","Egípcia","vip","Hieróglifos em relevo percorrem a parede alta, acima da hidromassagem cercada de palmeiras. Dourados, sombras e um teto que se abre para o céu.",["#1a1408","#5a4210","#b8922a"],["Ambiente principal","Cama","Hidromassagem e teto móvel","Estar"]),
  mbSuite(209,"havaiana","Havaiana","vip","Cama redonda sob um pergolado de troncos, painel de coqueirais e luz verde-água. Clima de ilha, com a hidromassagem voltada para o céu.",["#0f1a16","#1a5a4a","#3a9a7a"],["Cama redonda","Pergolado","Ambiente principal","Teto móvel","Hidromassagem","Luzes da boate"]),
  mbSuite(210,"executiva","Executiva","vip","Tons claros, mármore e uma cama redonda no centro do ambiente. Sóbria e silenciosa, com mesa de trabalho e hidromassagem em jardim iluminado.",["#141414","#2a2a2e","#5a5a64"],["Cama redonda","Mesa e cama","Mesa de trabalho","Cama e mezanino","Estar","Hidromassagem","Cama"]),
  mbSuite(211,"inglesa","Inglesa","vip","Paredes vermelhas, piso de arabescos e uma cabeceira em forma de lábios como peça central. Teatral na medida certa, com hidromassagem sob o teto móvel.",["#1c0c0c","#5a1414","#a02a2a"],["Cama","Hidromassagem e cama","Hidromassagem","Cama e telas","Teto móvel","Frigobar","Banheiro"]),
  mbSuite(212,"marroquina","Marroquina","vip","Tecidos suspensos no teto, ladrilhos estampados e folhagens iluminadas. Um riad particular, de luz baixa e hidromassagem de canto.",["#20120c","#6a2a14","#b05a2a"],["Cama e tecidos","Ambiente principal","Estar","Hidromassagem","Ducha","Banheiro"]),
  mbSuite(213,"paulista","Paulista","vip","Uma fachada azul de sobrado, com portas de madeira e lampião de rua, emoldura a cama. A cidade em versão íntima, com hidromassagem sob o teto móvel.",["#121214","#1a2a4a","#3a5a8a"],["Cama e lampião","Cama","Fachada","Teto móvel","Hidromassagem","Vista da cama"]),
  mbSuite(214,"las-vegas","Las Vegas","master","Pastilhas douradas, piso negro e o horizonte da cidade iluminado na parede. Hidromassagem redonda e luzes de boate para noites que não têm hora.",["#100c18","#2a1a5a","#5a3aa8"],["Cama e tela","Ambiente principal","Hidromassagem","Painel da cidade","Estar","Cama","Detalhe da hidromassagem","Ducha"]),
  mbSuite(215,"country","Country","master","O aconchego do campo com a estrutura Master completa: rusticidade elegante e hidromassagem.",["#181208","#4a3210","#8a6a3a"],null),
  mbSuite(216,"harley-davidson","Harley Davidson","master","Piso negro espelhado, murais de estrada e uma moto suspensa na parede. Personalidade forte, com hidromassagem e teto móvel.",["#121110","#3a2410","#7a4a1a"],["Cama e mural","Cama","Hidromassagem e cama","Hidromassagem","Teto móvel","Ducha"]),
  mbSuite(217,"romana","Romana","master","A cama repousa sob arcos brancos, diante de um afresco da Fontana di Trevi. Granito, luz suave e a hidromassagem no alto de uma escadaria.",["#161410","#4a3a1a","#8a7a3a"],["Cama e afresco","Arcos","Ambiente principal","Estar e hidromassagem","Teto móvel","Hidromassagem","Luz da boate","Ducha"]),
  mbSuite(218,"espanhola","Espanhola","master","Cama redonda em capitonê vermelho e hidromassagem em formato de coração sobre um tablado de pedra. Espaço Master, luz cênica e um teto que se abre.",["#240c0c","#6a1414","#a82a2a"],["Cama redonda","Hidromassagem","Hidromassagem e cama","Detalhe da hidromassagem","Teto móvel","Banheiro"]),
  mbSuite(219,"francesa","Francesa","master","Lambris de madeira escura, lustres e espelhos em arco. Um salão parisiense em escala íntima, com hidromassagem ao fundo e a estrutura Master completa.",["#181018","#4a1a3a","#8a3a6a"],["Ambiente principal","Cama","Vista da cama","Hidromassagem","Banheiro"]),
  mbSuite(220,"arabe","Árabe","duplex","Uma noite das mil e uma noites em duplex: tendas, tons profundos, hidromassagem e privacidade absoluta em dois andares.",["#180c14","#4a1430","#8a2a5a"],null),
  mbSuite(221,"baiana","Baiana","duplex","Dois andares de axé e aconchego: a alegria da Bahia em uma das suítes mais completas da casa.",["#20100a","#6a3a10","#c28a2a"],null)
];

/* Suítes exibidas em destaque na Home (a primeira ocupa o quadro maior) */
MB.featured = ["romana", "japonesa", "mexicana"];

/* ------------------------------------------------------------
   CARDÁPIO — o livro, página por página (mesmo conteúdo do cardápio impresso das suítes)
   Cada página: { chapter, sections:[ … ] }. Cada seção:
     title, sub (linha fina sob o título), note (observação no pé),
     items:[…]  e/ou  groups:[{ title, cols:2, items:[…] }]  ou  channels:[[nº,"Nome"], …]
   Item: { name, desc, side, origin, price }
     desc   = descrição em itálico · side = acompanhamentos
     origin = país (vinhos)        · price = valor em reais (null → "Consulte")
   Capa, abertura, sumário e contracapa são montados pelo site.js. O sumário,
   os atalhos por capítulo e a lista corrida saem daqui automaticamente.
   Para uma seção de duas páginas ficar lado a lado no livro aberto, a primeira
   página dela deve ser ímpar (3, 5, 7…) — os comentários abaixo marcam os pares.
------------------------------------------------------------ */
const MB_PREP = "Tempo de preparo: 25 minutos";
const MB_SIDES = "Todas as porções acompanham batata frita ou mandioca frita.";
const MB_WITH = "Acompanha batata frita, farofa, salada e arroz.";
const MB_ICE = "Gelo nos sabores melancia, coco ou maçã verde.";

/* "Bom saber" — página de abertura do cardápio, logo depois da capa */
MB.menuInfo = [
  "Pratos preparados na hora: cerca de 25 minutos.",
  "Pagamento por PIX, cartão de crédito ou débito. Não aceitamos cheques.",
  "Tolerância de 5 minutos na saída, desde que nada esteja desarrumado.",
  "Havendo mais de 2 pessoas, é cobrado um adicional de 50% por pessoa.",
  "Não nos responsabilizamos por objetos esquecidos.",
  "Preços sujeitos a alteração sem aviso prévio."
];

MB.menu = [
  /* páginas 3–4 */
  { chapter:"Cozinha", sections:[{ title:"Sugestões do Chef", sub:MB_PREP, items:[
    {name:"Ancho suíno", desc:"Corte extremamente suculento e macio, também conhecido como sobrepaleta.", price:75},
    {name:"Costela Fogo de Chão", desc:"Costela bovina desfiada com queijo e um toque especial de lenha, sem ossos e sem gordura.", price:90},
    {name:"Costela Outback", desc:"Costela suína ao molho barbecue, desmanchando, com aquele sabor de churrasco.", price:90}
  ]}]},
  { chapter:"Cozinha", sections:[{ title:"Sugestões do Chef", sub:MB_PREP, note:MB_SIDES, items:[
    {name:"Carne chorizo", desc:"Retirada do centro do contrafilé, com uma capa de gordura lateral espessa que acentua o sabor tradicional do churrasco.", price:90},
    {name:"Filé", desc:"O corte bovino mais macio e um dos mais nobres.", price:95},
    {name:"Picanha", desc:"Famosa pelo formato triangular, pelo sabor marcante e pela suculência. Muito macia.", price:110}
  ], groups:[
    { title:"Acréscimos", cols:2, items:[ {name:"Arroz",price:20},{name:"Farofa",price:20},{name:"Vinagrete",price:10},{name:"Salada",price:15} ] }
  ]}]},
  /* páginas 5–6 */
  { chapter:"Cozinha", sections:[{ title:"Refeição para Dois", sub:MB_PREP, items:[
    {name:"Picanha", desc:"Famosa pelo formato triangular, pelo sabor marcante e pela suculência. Muito macia.", side:MB_WITH, price:150},
    {name:"Carne chorizo", desc:"Retirada do centro do contrafilé, com uma capa de gordura lateral espessa que acentua o sabor do churrasco.", side:MB_WITH, price:130},
    {name:"Costela Fogo de Chão", desc:"Costela bovina desfiada, com queijo e um toque especial de lenha. Sem ossos e sem gordura.", side:"Acompanha mandioca frita, arroz e farofa.", price:130}
  ]}]},
  { chapter:"Cozinha", sections:[{ title:"Refeição para Dois", sub:MB_PREP, items:[
    {name:"Filé", desc:"O corte bovino mais macio e um dos mais nobres.", side:MB_WITH, price:135},
    {name:"Filé à parmegiana", desc:"Filé empanado com presunto e muçarela, ao molho caseiro.", side:"Acompanha batata frita, salada e arroz.", price:140},
    {name:"Costela Outback", desc:"Costela suína ao molho barbecue, desmanchando, com aquele sabor de churrasco.", side:MB_WITH, price:130},
    {name:"Peixe", desc:"Salmão com batata sauté e arroz.", price:140}
  ]}]},
  /* páginas 7–8 */
  { chapter:"Cozinha", sections:[{ title:"Porções", sub:MB_PREP, note:MB_SIDES, items:[
    {name:"Mandioca frita", price:30},
    {name:"Batata frita", price:30},
    {name:"Coxinha da asa", desc:"Coxinha da asa empanada.", price:70},
    {name:"Picolé de costela", desc:"Em formato de picolé, com costelinha e queijo.", price:60},
    {name:"Costelinha de porco", desc:"Costelinha de porco acebolada.", price:70},
    {name:"Mix de medalhão", desc:"Medalhão, queijo com bacon, frango com bacon e goiabada com queijo e bacon.", price:75},
    {name:"Isca de frango", desc:"Empanada e recheada com muçarela e alho-poró.", price:70},
    {name:"Tilápia", desc:"Empanada e recheada com queijo provolone.", price:75}
  ]}]},
  { chapter:"Cozinha", sections:[{ title:"Hambúrgueres Artesanais", sub:MB_PREP, items:[
    {name:"Boi Blanc", desc:"Pão brioche, hambúrguer artesanal de boi, muçarela, alface, tomate e batata frita.", price:35},
    {name:"Costela Blanc", desc:"Pão brioche, hambúrguer artesanal de costela, muçarela, alface, tomate e batata frita.", price:35},
    {name:"Especial Blanc", desc:"Pão brioche, hambúrguer de 150 g, muçarela, leitoa desfiada, catupiry, tomate, maionese de barbecue e batata frita.", price:45},
    {name:"Costela Burguer", desc:"Pão brioche, costela bovina desfiada, cheddar, cebola caramelizada, ovo e batata frita.", price:45}
  ], groups:[
    { title:"Acréscimos", cols:2, items:[
      {name:"Bacon",price:7},{name:"Cebola caramelizada",price:6},{name:"Muçarela",price:6},{name:"Barbecue",price:5},
      {name:"Cheddar",price:5},{name:"Catupiry",price:5},{name:"Ovo",price:5}
    ]}
  ]}]},
  /* páginas 9–10 */
  { chapter:"Cozinha", sections:[
    { title:"Pizza do Rodrigo", sub:"30 cm · tempo de preparo: 25 minutos", items:[
      {name:"Calabresa", desc:"Muçarela e calabresa.", price:75},
      {name:"Bacon", desc:"Muçarela e bacon.", price:75},
      {name:"Frango", desc:"Muçarela, frango desfiado e requeijão cremoso.", price:75},
      {name:"Quatro queijos", desc:"Muçarela, provolone, parmesão e requeijão.", price:75}
    ]},
    { title:"Sobremesa", sub:"Prato individual", items:[
      {name:"Petit gâteau", desc:"Acompanhado de sorvete de creme.", price:30}
    ]}
  ]},
  { chapter:"Cozinha", sections:[
    { title:"Café da Manhã", sub:MB_PREP, items:[
      {name:"Completo", desc:"Café, leite, suco, pão de queijo, misto quente, ovos mexidos e fruta.", price:60},
      {name:"Misto quente", desc:"Pão de forma, presunto e muçarela.", price:10},
      {name:"Pão de queijo", price:14},
      {name:"Omelete", desc:"Recheada com presunto e muçarela.", price:12}
    ]},
    { title:"Fim de Noite", sub:"Prato individual", items:[
      {name:"Espaguete", desc:"Massa ao molho bolonhesa.", price:43},
      {name:"Lasanha", desc:"Massa caseira com molho bolonhesa, muçarela, molho branco e parmesão.", price:49}
    ]}
  ]},
  /* páginas 11–12 */
  { chapter:"Bebidas", sections:[{ title:"Bebidas", groups:[
    { title:"Cervejas", items:[
      {name:"Brahma",price:8},{name:"Corona",price:12},{name:"Heineken",price:12},{name:"Baden Baden",price:25}
    ]},
    { title:"Sem álcool", items:[
      {name:"Água mineral com ou sem gás",price:6},{name:"Água tônica",price:7},{name:"Limoneto",price:7},{name:"Refrigerante",price:7},
      {name:"Gatorade",price:9},{name:"Suco Mais",price:9},{name:"Suco natural de laranja",price:9}
    ]}
  ]}]},
  { chapter:"Bebidas", sections:[
    { title:"Prontos para beber", items:[
      {name:"Skol Beats",price:14},{name:"Skol GT Beats",price:14},{name:"Smirnoff Ice",price:14},{name:"Energético",price:17},{name:"Shot de limão",price:5}
    ]},
    { title:"Whisky", items:[
      {name:"White Horse",price:19},
      {name:"Johnnie Walker Red Label", desc:"8 anos", price:22},
      {name:"Johnnie Walker Black Label", desc:"12 anos", price:27}
    ]},
    { title:"Copão", items:[
      {name:"Vodka", desc:MB_ICE, price:35},
      {name:"Whisky", desc:MB_ICE, price:40}
    ]}
  ]},
  /* páginas 13–14 */
  { chapter:"Bebidas", sections:[{ title:"Doses", items:[
    {name:"Cachaça 51",price:7},{name:"Caipirinha",price:15},{name:"Martini",price:15},{name:"Dreher",price:15},
    {name:"Campari",price:15},{name:"Bacardi",price:15},{name:"Vodka Smirnoff",price:15},{name:"Tequila",price:15},
    {name:"Amarula",price:20},{name:"Vodka Absolut",price:20},{name:"Caipivodka Smirnoff",price:20},
    {name:"Gin", desc:"Com Monin de morango ou de limão-siciliano.", price:30}
  ]}]},
  { chapter:"Bebidas", sections:[
    { title:"Vinhos", items:[
      {name:"Bartolo Suave Tinto", origin:"Brasil", price:40},
      {name:"Concha y Toro Reservado Cabernet Tinto", origin:"Chile", price:68},
      {name:"Latitud 33° Branco Seco", origin:"Argentina", price:98},
      {name:"Latitud 33° Malbec Tinto", origin:"Argentina", price:118},
      {name:"Terrazas Altos del Plata Malbec Tinto", origin:"Argentina", price:128}
    ]},
    { title:"Espumantes", items:[
      {name:"Garibaldi Brut",price:60},{name:"Garibaldi Vero Demi-Sec Rosé",price:70},{name:"Garibaldi Moscatel Rosé",price:90},{name:"Chandon",price:140}
    ]}
  ]},
  /* páginas 15–16 */
  { chapter:"Frigobar", sections:[{ title:"Frigobar", sub:"Valor unitário", groups:[
    { title:"Bebidas geladas", items:[
      {name:"Água mineral",price:5},{name:"Refrigerante",price:7},{name:"Água H2OH!",price:7},{name:"Cerveja Brahma",price:8},
      {name:"Suco Mais",price:9},{name:"Gatorade",price:9},{name:"Cerveja Heineken",price:12},{name:"Cerveja Corona",price:12},
      {name:"Skol Beats",price:14},{name:"Skol GT Beats",price:14},{name:"Smirnoff Ice",price:14},{name:"Energético",price:17},
      {name:"Cerveja Baden Baden",price:25}
    ]}
  ]}]},
  { chapter:"Frigobar", sections:[{ title:"Frigobar", sub:"Valor unitário", groups:[
    { title:"Petiscos e doces", items:[
      {name:"Chiclete",price:5},{name:"Halls",price:5},{name:"Salgadinho de pimenta",price:6},{name:"Salamitos",price:7},
      {name:"Batata Elma Chips",price:8},{name:"Baconzitos",price:8},{name:"Snickers",price:9},{name:"M&M's",price:9},
      {name:"Amendoim",price:12},{name:"Castanha",price:16}
    ]}
  ]}]},
  /* páginas 17–18 */
  { chapter:"Diversos", sections:[{ title:"Diversos", sub:"Valor unitário", groups:[
    { title:"Íntimos", items:[
      {name:"Preservativo",price:12},{name:"Preservativo Jontex",price:12},{name:"Calcinha",price:18},
      {name:"Lubrificante Dreams",price:25},{name:"Prótese peniana",price:70},{name:"Vibrador",price:85}
    ]},
    { title:"Tabacaria", items:[
      {name:"Fósforo",price:3},{name:"Isqueiro",price:10},{name:"Cigarro Paiol",price:18},{name:"Cigarro Rothmans Red",price:18},
      {name:"Cigarro Dunhill",price:23},{name:"Cigarro Dunhill Red",price:23},{name:"Cigarro Lucky Strike Fresh",price:23}
    ]}
  ]}]},
  { chapter:"Diversos", sections:[{ title:"Diversos", sub:"Valor unitário", groups:[
    { title:"Higiene e cuidados", items:[
      {name:"Absorvente",price:3},{name:"Comprimidos",price:3},{name:"Pente",price:3},{name:"Touca de banho",price:3},
      {name:"Piranha de cabelo",price:4},{name:"Toalha avulsa",price:10},{name:"Kit escova de dentes",price:15},
      {name:"Kit Prestobarba",price:15},{name:"Kit banho",price:26},{name:"Chinelo",price:30}
    ]},
    { title:"Utilidades", items:[ {name:"Balde de gelo",price:10},{name:"Copo",price:15} ]}
  ]}]},
  /* páginas 19–20 — canais com true no fim são de conteúdo adulto */
  { chapter:"Canais", sections:[{ title:"Canais de TV", channels:[
    [3,"Globo"],[6,"Rede TV"],[7,"Bandeirantes"],[11,"SBT"],[13,"Record HD"],[14,"Record News"],[33,"Home and Health"],
    [34,"TLC"],[36,"Viva HD"],[37,"SporTV 3 HD"],[38,"SporTV 2 HD"],[39,"SporTV HD"],[40,"Globo News HD"],[42,"Multishow HD"],
    [43,"Universal Channel"],[44,"Warner HD"],[45,"Sony Channel HD"],[46,"Fox HD"],[47,"Mega Pix HD"],[48,"TNT HD"],[69,"AXN HD"],
    [70,"ID HD"],[71,"FX HD"],[72,"A&E HD"],[74,"Universal TV"],[79,"Fox 1"],[80,"Fox Action"],[90,"Discovery Channel"],
    [91,"Animal Planet"],[99,"H2"],[131,"Bis HD"],[132,"TruTV HD"],[134,"MTV"],[137,"Comedy Central"],[160,"ESPN Brasil"],
    [161,"ESPN HD"],[163,"Fox Sports HD"],[164,"OFF"],[166,"TNT Sports"],[167,"Discovery Turbo"],[170,"Fox Sports 2"],
    [370,"Sex Prime",true],[371,"Sex Hot",true],[372,"Playboy",true]
  ]}]},
  { chapter:"Canais", sections:[{ title:"Canais de Rádio", channels:[
    [900,"Anos 60"],[901,"Anos 70"],[902,"Anos 80"],[903,"Anos 90"],[904,"Rock Clássico"],[905,"New Rock"],[906,"Kids"],
    [907,"Música Clássica"],[908,"Bossa Nova"],[909,"MPB"],[910,"Samba de Raiz"],[911,"Blues"],[912,"Black"],[913,"Jazz"],
    [914,"Metal"],[915,"Rock Brasil"],[916,"Sertanejo"],[918,"Trilhas Sonoras"],[918,"Pop Hits"],[920,"Românticas"],
    [921,"Festa"],[922,"Disco"],[923,"Música Eletrônica"],[924,"Hip Hop"],[925,"Reggae"],[926,"Especial"],[927,"Pagode"],
    [928,"Anos 2000"],[929,"Forró"],[930,"Sertanejo"],[931,"Gospel"],[959,"Rádio Globo RJ"],[962,"Globo FM Bahia"],
    [963,"Bahia FM"],[964,"BH FM"],[969,"Rádio Jovem Pan"]
  ]}]}
];

/* ------------------------------------------------------------
   COMODIDADES (PÁGINA EXPERIÊNCIA) — icon: desenho de linha animado (EXP_ICONS no site.js):
   hidro, teto, boate, ar, tv, frigobar, privacidade, temas
------------------------------------------------------------ */
MB.experiences = [
  {t:"Hidromassagem", d:"Água quente, luz baixa e tempo só de vocês. Presente em todas as suítes.", icon:"hidro"},
  {t:"Teto móvel", d:"Abra o teto e deixe o céu de Ipatinga entrar no quarto.", icon:"teto"},
  {t:"Boate privativa", d:"Sua pista de dança particular, com clima de balada só para dois.", icon:"boate"},
  {t:"Ar-condicionado", d:"Clima perfeito em qualquer estação, do jeito que vocês preferirem.", icon:"ar"},
  {t:"TV em todas as suítes", d:'Telas LCD e LED de até 52" para trilhas sonoras e maratonas a dois.', icon:"tv"},
  {t:"Frigobar", d:"Bebidas geladas ao alcance da mão — sem precisar sair do quarto.", icon:"frigobar"},
  {t:"Privacidade", d:"Entrada discreta e atendimento que respeita o seu momento.", icon:"privacidade"},
  {t:"Ambientes temáticos", d:"21 cenários diferentes para nunca repetir a mesma história.", icon:"temas"}
];

/* ------------------------------------------------------------
   DÚVIDAS FREQUENTES — apenas informações confirmadas do negócio.
   `home: true` marca as perguntas que aparecem resumidas na Home.
------------------------------------------------------------ */
MB.faq = [
  { id:"horario", home:true, q:"Qual é o horário de funcionamento?",
    a:"O Montblack funciona 24 horas por dia, todos os dias da semana. Você pode chegar a qualquer hora do dia ou da noite." },
  { id:"valores", home:true, q:"Quanto custa uma suíte?",
    a:"Suítes VIP: 1 hora R$ 99,00 · 2 horas R$ 120,00 · pernoite R$ 200,00 (promoção: 1 hora por R$ 98,00 nas suítes VIP 201 a 213). Suítes Master: 2 horas R$ 127,00 · pernoite R$ 220,00. Master Duplex: 2 horas R$ 137,00 · pernoite R$ 240,00. Hora adicional após 2 horas: R$ 30,00 em todas as suítes. Preços sujeitos a alteração sem aviso prévio.",
    link:{label:"Ver tabela completa", href:"#/suites?to=valores"} },
  { id:"pernoite", home:true, q:"Como funciona o pernoite?",
    a:"O pernoite é válido de domingo à sexta-feira, com entrada a partir das 18:00 e saída até as 14:00 do dia seguinte." },
  { id:"categorias", q:"Qual é a diferença entre VIP, Master e Master Duplex?",
    a:"As 13 suítes VIP têm hidromassagem, boate privativa, teto móvel, frigobar, ar-condicionado e TVs LCD de 52\" e 32\". As 6 suítes Master ampliam o espaço e trazem duas TVs LED de 47\" e dois frigobares. As 2 suítes Master Duplex têm toda a estrutura Master distribuída em dois andares.",
    link:{label:"Comparar categorias", href:"#/suites"} },
  { id:"reserva", home:true, q:"Como consultar disponibilidade ou reservar?",
    a:"Pelo site você monta a sua experiência — categoria, suíte e período — e a confirmação é feita diretamente com o Montblack. O canal de contato para reservas está em atualização; enquanto isso, fale conosco pelo Instagram ou venha nos visitar, estamos abertos 24 horas.",
    link:{label:"Consultar disponibilidade", action:"availability"} },
  { id:"idade", q:"Existe idade mínima para entrar?",
    a:"Sim. A entrada é permitida somente para maiores de 18 anos." },
  { id:"cardapio", q:"É possível pedir bebidas e comida na suíte?",
    a:"Sim. O cardápio tem sugestões do chef, refeições para dois, porções, hambúrgueres artesanais, pizzas, café da manhã e sobremesa, além de cervejas, vinhos, espumantes, doses e whisky, tudo servido diretamente na suíte. Os preços estão no cardápio do site; o tempo de preparo dos pratos é de cerca de 25 minutos.",
    link:{label:"Folhear o cardápio", href:"#/cardapio"} },
  { id:"onde", q:"Onde fica o Montblack?",
    a:"Na R. Serra Geral, 551 — Jardim Panorama, Ipatinga - MG, CEP 35164-236. Fácil acesso e entrada reservada.",
    link:{label:"Ver no mapa", href:"#/contato"} },
  { id:"objetos", q:"E se eu esquecer algum objeto na suíte?",
    a:"O estabelecimento não se responsabiliza por objetos esquecidos. Recomendamos conferir seus pertences antes de deixar a suíte." }
];

/* ------------------------------------------------------------
   "O QUE VOCÊ PROCURA?" — índice de navegação da Home
------------------------------------------------------------ */
MB.intents = [
  { n:"01", t:"Conhecer as 21 suítes", d:"Da 201 à 221, em três categorias de conforto.", href:"#/suites" },
  { n:"02", t:"Ver valores e períodos", d:"1 hora, 2 horas ou pernoite — tabela completa por categoria.", href:"#/suites?to=valores" },
  { n:"03", t:"O que tem em cada suíte", d:"Hidromassagem, teto móvel, boate privativa e mais.", href:"#/experiencia" },
  { n:"04", t:"Folhear o cardápio", d:"Pratos do chef, refeições para dois, pizzas, drinks e frigobar, com preços.", href:"#/cardapio" },
  { n:"05", t:"Onde fica e como chegar", d:"Jardim Panorama, Ipatinga — Google Maps e Waze.", href:"#/contato" },
  { n:"06", t:"Tirar dúvidas", d:"Horários, pernoite, idade mínima e como reservar.", href:"#/sobre?to=duvidas" }
];
