/* ============================================================
   MOTEL MONTBLACK — CONTEÚDO DO SITE
   Este arquivo concentra tudo que é "conteúdo": dados do negócio,
   categorias, suítes, cardápio, comodidades e dúvidas frequentes.
   A lógica do site fica em site.js e não precisa ser alterada
   para atualizar textos, preços ou fotos.
============================================================ */
window.MB = window.MB || {};

/* ------------------------------------------------------------
   IMAGENS ILUSTRATIVAS (temporárias)
   As fotos abaixo são do Unsplash e servem APENAS para visualizar
   o layout — não são fotos do Montblack. Para usar fotos reais,
   troque cada ID por um caminho local (ex.: "img/arabe-1.jpg")
   ou uma URL completa; a função MB.img entende os dois formatos.
------------------------------------------------------------ */
MB.img = function(src, w){
  if(!src) return null;
  if(src.includes("/") || src.includes(".")) return src; /* caminho local ou URL completa */
  return "https://images.unsplash.com/photo-" + src + "?auto=format&fit=crop&w=" + (w || 1200) + "&q=70";
};

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
    image: "1631049307264-da0ec9d70304",
    tagline: "Treze cenários temáticos com hidromassagem, boate e teto móvel — a porta de entrada para a experiência Montblack.",
    amenities: ["Ar-condicionado", 'TV LCD 52"', 'TV LCD 32"', "Hidromassagem", "Frigobar", "Boate", "Teto móvel"],
    prices: { oneHour: 93, twoHours: 113, overnight: 180 },
    tones: ["#33161a", "#601313", "#8a3a2a"]
  },
  master: {
    id: "master", label: "Master", title: "Suítes Master", count: 6,
    image: "1587985064135-0366536eab42",
    tagline: "Ambientes amplos com spa com hidromassagem, duas TVs LED e o dobro de conforto para quem quer ir além.",
    amenities: ["Ar-condicionado", '2 TVs LED de 47"', "Spa com hidromassagem", "2 frigobares", "Boate", "Teto móvel"],
    prices: { oneHour: null, twoHours: 120, overnight: 190 },
    tones: ["#1c1114", "#4a0f14", "#7a2a3a"]
  },
  duplex: {
    id: "duplex", label: "Master Duplex", title: "Master Duplex", count: 2,
    image: "1602872030219-ad2b9a54315c",
    tagline: "Dois andares, spa com hidromassagem e a mais completa estrutura da casa — a experiência Montblack em sua forma máxima.",
    amenities: ["2 andares", "Ar-condicionado", '2 TVs LED de 47"', "Spa com hidromassagem", "2 frigobares", "Boate", "Teto móvel"],
    prices: { oneHour: null, twoHours: 125, overnight: 200 },
    tones: ["#14100f", "#3d1a10", "#8a5a2a"]
  }
};

/* ------------------------------------------------------------
   SUÍTES — 21 (13 VIP, 6 MASTER, 2 MASTER DUPLEX)
   images: adicione URLs de fotos reais aqui (ex.: ["img/arabe-1.jpg", ...]).
   Enquanto vazio, o site usa composições visuais de placeholder.
------------------------------------------------------------ */
function mbSuite(id, name, category, description, tones, views, images){
  const cat = MB.categories[category];
  return {
    id, name, category,
    categoryLabel: cat.label,
    description,
    amenities: cat.amenities,
    prices: cat.prices,
    tones: tones || cat.tones,
    images: images || [],
    views: views || ["Ambiente principal", "Hidromassagem", "Detalhes da suíte"]
  };
}

MB.suites = [
  mbSuite("bangalo","Bangalô","vip","Atmosfera de refúgio tropical: madeira, texturas naturais e a sensação de estar longe de tudo — a poucos minutos do centro de Ipatinga.",["#1e1a12","#4a3a1a","#8a6a2a"],null,["1611892440504-42a792e24d32","1571003123894-1f0594d2b5d9","1540555700478-4be289fbecef"]),
  mbSuite("high-tech","High Tech","vip","Linhas futuristas, iluminação cênica e tecnologia em cada detalhe para quem gosta de encontros com clima contemporâneo.",["#101418","#1e3a4a","#3a6a8a"],null,["1566665797739-1674de7a421a","1600566752355-35792bedcfea","1518005020951-eccb494ad742"]),
  mbSuite("titanic","Titanic","vip","Romantismo clássico inspirado na elegância dos grandes transatlânticos — um convite a uma noite memorável.",["#101620","#1a2a4a","#4a6a9a"],null,["1631049307264-da0ec9d70304","1552321554-5fefe8c9ef14","1582719508461-905c673771fd"]),
  mbSuite("mexicana","Mexicana","vip","Cores quentes e personalidade vibrante: a energia do México traduzida em um cenário intimista.",["#2a1208","#7a2a10","#c2652a"],null,["1540518614846-7eded433c457","1584622650111-993a426fbf0a","1551024709-8f23befc6f87"]),
  mbSuite("texana","Texana","vip","O espírito livre do velho oeste em um ambiente rústico e acolhedor, feito para encontros sem pressa.",["#241610","#5a3018","#9a6a3a"],null,["1578683010236-d716f9a3f461","1595846519845-68e298c2edd8","1523567830207-96731740fa71"]),
  mbSuite("japonesa","Japonesa","vip","Minimalismo oriental, equilíbrio e serenidade — um cenário zen para desacelerar a dois.",["#181414","#5a1a1a","#a83a3a"],null,["1616594039964-ae9021a400a0","1507652313519-d4e9174996dd","1608501078713-8e445a709b39"]),
  mbSuite("indiana","Indiana","vip","Texturas ricas e tons profundos inspirados na Índia, para uma experiência sensorial envolvente.",["#1c1020","#4a1a4a","#8a3a7a"],null,["1444201983204-c43cbd584d93","1544161515-4ab6ce6db874","1536935338788-846bb9981813"]),
  mbSuite("egipcia","Egípcia","vip","O mistério do Egito antigo em dourados e sombras — majestade e intimidade no mesmo ambiente.",["#1a1408","#5a4210","#b8922a"],null,["1505693416388-ac5ce068fe85","1519823551278-64ac92734fb1","1514362545857-3bc16c4c7d1b"]),
  mbSuite("havaiana","Havaiana","vip","Clima de ilha, leveza e descontração: um pedaço do paraíso para chamar de seu por algumas horas.",["#0f1a16","#1a5a4a","#3a9a7a"],null,["1596394516093-501ba68a0ba6","1571896349842-33c89424de2d","1520250497591-112f2f40a3f4"]),
  mbSuite("executiva","Executiva","vip","Sobriedade e conforto em estado puro — a escolha certeira para quem valoriza discrição e elegância.",["#141414","#2a2a2e","#5a5a64"],null,["1522771739844-6a9f6d5f14af","1604709177225-055f99402ea3","1598300042247-d088f8ab3a91"]),
  mbSuite("inglesa","Inglesa","vip","Charme britânico clássico: atmosfera de clube privado com o aconchego que só o Montblack entrega.",["#101410","#1a3a2a","#3a6a4a"],null,["1615874694520-474822394e73","1620626011761-996317b8d101","1600210492486-724fe5c67fb0"]),
  mbSuite("marroquina","Marroquina","vip","Arabescos, tons terrosos e uma iluminação que transforma o ambiente em um riad particular.",["#20120c","#6a2a14","#b05a2a"],null,["1505577058444-a3dab90d4253","1544161515-4ab6ce6db874","1445019980597-93fa8acb246c"]),
  mbSuite("paulista","Paulista","vip","Urbana e cosmopolita, com a energia da metrópole traduzida em design e conforto.",["#121214","#2a2a3a","#4a4a6a"],null,["1568495248636-6432b97bd949","1595515106969-1ce29566ff1c","1541971875076-8f970d573be6"]),
  mbSuite("espanhola","Espanhola","master","Paixão em forma de ambiente: tons intensos, spa com hidromassagem e espaço de sobra para viver o momento.",["#240c0c","#6a1414","#a82a2a"],null,["1587985064135-0366536eab42","1584622650111-993a426fbf0a","1519643381401-22c77e60520e"]),
  mbSuite("francesa","Francesa","master","Romance parisiense com sofisticação Master — duas TVs, spa e um cenário digno de cinema.",["#181018","#4a1a3a","#8a3a6a"],null,["1512918728675-ed5a9ecdebfd","1507652313519-d4e9174996dd","1598928506311-c55ded91a20c"]),
  mbSuite("las-vegas","Las Vegas","master","O brilho da cidade que nunca dorme em uma suíte feita para noites tão intensas quanto inesquecíveis.",["#100c18","#2a1a5a","#5a3aa8"],null,["1595576508898-0ad5c879a061","1571896349842-33c89424de2d","1517840901100-8179e982acb7"]),
  mbSuite("romana","Romana","master","Colunas, drapeados e a grandiosidade do império romano a serviço do seu prazer e do seu descanso.",["#161410","#4a3a1a","#8a7a3a"],null,["1590490360182-c33d57733427","1620626011761-996317b8d101","1509024644558-2f56ce76c490"]),
  mbSuite("harley-davidson","Harley Davidson","master","Atitude sobre duas rodas: um cenário com personalidade forte para casais que aceleram juntos.",["#121110","#3a2410","#7a4a1a"],null,["1615873968403-89e068629265","1595515106969-1ce29566ff1c","1470337458703-46ad1756a187"]),
  mbSuite("country","Country","master","O aconchego do campo com estrutura Master completa — rusticidade elegante e spa com hidromassagem.",["#181208","#4a3210","#8a6a3a"],null,["1595526114035-0d45ed16cfbf","1540555700478-4be289fbecef","1560184897-ae75f418493e"]),
  mbSuite("baiana","Baiana","duplex","Dois andares de axé e aconchego: a alegria da Bahia em uma das suítes mais completas da casa.",["#20100a","#6a3a10","#c28a2a"],["Ambiente principal","Spa com hidromassagem","Segundo andar","Detalhes da suíte"],["1594563703937-fdc640497dcd","1520250497591-112f2f40a3f4","1502005229762-cf1b2da7c5d6","1490750967868-88aa4486c946"]),
  mbSuite("arabe","Árabe","duplex","Uma noite das mil e uma noites em duplex: tendas, tons profundos, spa e privacidade absoluta em dois andares.",["#180c14","#4a1430","#8a2a5a"],["Ambiente principal","Spa com hidromassagem","Segundo andar","Detalhes da suíte"],["1618773928121-c32242e63f39","1600566752355-35792bedcfea","1602872030219-ad2b9a54315c","1445019980597-93fa8acb246c"])
];

/* Suítes exibidas em destaque na Home (uma por categoria) */
MB.featured = ["arabe", "francesa", "high-tech"];

/* ------------------------------------------------------------
   CARDÁPIO — valores: consultar na recepção (price: null → "Consulte")
------------------------------------------------------------ */
MB.menu = [
  { id:"cervejas", title:"Cervejas", items:[
    {name:"Brahma",price:null},{name:"Stella Artois",price:null},{name:"Heineken",price:null},{name:"Baden Baden",price:null}
  ]},
  { id:"aguas", title:"Águas e Bebidas", items:[
    {name:"Água mineral com gás",price:null},{name:"Água mineral sem gás",price:null},{name:"H2OH!",price:null},{name:"Água Tônica",price:null}
  ]},
  { id:"refrigerantes", title:"Refrigerantes e Outras Bebidas", items:[
    {name:"Refrigerantes",price:null},{name:"Gatorade",price:null},{name:"Suco Mais",price:null},{name:"Suco natural de laranja",price:null},
    {name:"Skol GT Beats",price:null},{name:"Skol Beats",price:null},{name:"Smirnoff",price:null},{name:"Energético",price:null}
  ]},
  { id:"vinhos", title:"Vinhos Tintos", items:[
    {name:"Bartolo Suave",price:null},{name:"Concha y Toro Reservado Cabernet",price:null},{name:"Latitud 33 Malbec",price:null},{name:"Terrazas Altos del Plata Malbec",price:null}
  ]},
  { id:"espumantes", title:"Espumantes", items:[
    {name:"Garibaldi Brut",price:null},{name:"Garibaldi Vero Demi-Sec Rosé",price:null},{name:"Garibaldi Moscatel Rosé",price:null},{name:"Chandon",price:null}
  ]},
  { id:"drinks", title:"Doses e Drinks", items:[
    {name:"Cachaça 51",price:null},{name:"Caipirinha",price:null},{name:"Martini",price:null},{name:"Dreher",price:null},{name:"Campari",price:null},
    {name:"Bacardi",price:null},{name:"Vodka Smirnoff",price:null},{name:"Aperol",price:null},{name:"Amarula",price:null},{name:"Vodka Absolut",price:null},
    {name:"Caip Vodka Smirnoff",price:null},{name:"Gin com Monin de Morango",price:null},{name:"Gin com Monin de Limão Siciliano",price:null}
  ]},
  { id:"whisky", title:"Whisky", items:[
    {name:"White Horse",price:null},{name:"Johnnie Walker Red Label",price:null},{name:"Johnnie Walker Black Label",price:null}
  ]},
  { id:"porcoes", title:"Porções", items:[
    {name:"Mandioca frita",price:null},
    {name:"Batata frita",price:null},
    {name:"Coxinha da asa empanada",price:null,note:"com batata frita ou mandioca"},
    {name:"Costelinha de porco acebolada",price:null,note:"com batata frita ou mandioca"},
    {name:"Isca de frango empanado",price:null,note:"recheado com muçarela e alho-poró, com batata frita ou mandioca"},
    {name:"Tilápia empanada",price:null,note:"recheada de provolone, com batata frita ou mandioca"},
    {name:"Filé",price:null,note:"com batata frita ou mandioca"},
    {name:"Picanha gorda",price:null,note:"com batata frita ou mandioca"}
  ]}
];

/* ------------------------------------------------------------
   COMODIDADES (PÁGINA EXPERIÊNCIA)
------------------------------------------------------------ */
MB.experiences = [
  {t:"Hidromassagem", d:"Água quente, luz baixa e tempo só de vocês. Presente em todas as suítes.", image:"1507652313519-d4e9174996dd"},
  {t:"Spa", d:"Nas suítes Master e Master Duplex, o spa com hidromassagem eleva a experiência.", image:"1620626011761-996317b8d101"},
  {t:"Teto móvel", d:"Abra o teto e deixe o céu de Ipatinga entrar no quarto.", image:"1596394516093-501ba68a0ba6"},
  {t:"Boate privativa", d:"Sua pista de dança particular, com clima de balada só para dois.", image:"1541971875076-8f970d573be6"},
  {t:"Ar-condicionado", d:"Clima perfeito em qualquer estação, do jeito que vocês preferirem.", image:"1522771739844-6a9f6d5f14af"},
  {t:"TV em todas as suítes", d:'Telas LCD e LED de até 52" para trilhas sonoras e maratonas a dois.', image:"1587985064135-0366536eab42"},
  {t:"Frigobar", d:"Bebidas geladas ao alcance da mão — sem precisar sair do quarto.", image:"1523567830207-96731740fa71"},
  {t:"Privacidade", d:"Entrada discreta e atendimento que respeita o seu momento.", image:"1517840901100-8179e982acb7"},
  {t:"Ambientes temáticos", d:"21 cenários diferentes para nunca repetir a mesma história.", image:"1444201983204-c43cbd584d93"}
];

/* ------------------------------------------------------------
   DÚVIDAS FREQUENTES — apenas informações confirmadas do negócio.
   `home: true` marca as perguntas que aparecem resumidas na Home.
------------------------------------------------------------ */
MB.faq = [
  { id:"horario", home:true, q:"Qual é o horário de funcionamento?",
    a:"O Montblack funciona 24 horas por dia, todos os dias da semana. Você pode chegar a qualquer hora do dia ou da noite." },
  { id:"valores", home:true, q:"Quanto custa uma suíte?",
    a:"Suítes VIP: 1 hora R$ 93,00 · 2 horas R$ 113,00 · pernoite R$ 180,00. Suítes Master: 2 horas R$ 120,00 · pernoite R$ 190,00. Master Duplex: 2 horas R$ 125,00 · pernoite R$ 200,00. Hora adicional após 2 horas: R$ 30,00 em todas as suítes. Preços sujeitos a alteração sem aviso prévio.",
    link:{label:"Ver tabela completa", href:"#/suites?to=valores"} },
  { id:"pernoite", home:true, q:"Como funciona o pernoite?",
    a:"O pernoite é válido de domingo à sexta-feira, com entrada a partir das 18:00 e saída até as 14:00 do dia seguinte." },
  { id:"categorias", q:"Qual é a diferença entre VIP, Master e Master Duplex?",
    a:"As 13 suítes VIP têm hidromassagem, boate privativa, teto móvel, frigobar, ar-condicionado e TVs LCD de 52\" e 32\". As 6 suítes Master ampliam o espaço e trazem spa com hidromassagem, duas TVs LED de 47\" e dois frigobares. As 2 suítes Master Duplex têm toda a estrutura Master distribuída em dois andares.",
    link:{label:"Comparar categorias", href:"#/suites"} },
  { id:"reserva", home:true, q:"Como consultar disponibilidade ou reservar?",
    a:"Pelo site você monta a sua experiência — categoria, suíte e período — e a confirmação é feita diretamente com o Montblack. O canal de contato para reservas está em atualização; enquanto isso, fale conosco pelo Instagram ou venha nos visitar, estamos abertos 24 horas.",
    link:{label:"Consultar disponibilidade", action:"availability"} },
  { id:"idade", q:"Existe idade mínima para entrar?",
    a:"Sim. A entrada é permitida somente para maiores de 18 anos." },
  { id:"cardapio", q:"É possível pedir bebidas e comida na suíte?",
    a:"Sim. O cardápio tem cervejas, águas, refrigerantes, vinhos, espumantes, doses, drinks, whisky e porções, servidos diretamente na suíte. Os valores dos itens podem ser consultados na recepção ou pela própria suíte.",
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
  { n:"01", t:"Conhecer as 21 suítes", d:"Do Bangalô à Árabe, em três categorias de conforto.", href:"#/suites", tones:["#180c14","#4a1430","#8a2a5a"], label:"Suítes", image:"1618773928121-c32242e63f39" },
  { n:"02", t:"Ver valores e períodos", d:"1 hora, 2 horas ou pernoite — tabela completa por categoria.", href:"#/suites?to=valores", tones:["#33161a","#601313","#8a3a2a"], label:"Valores", image:"1505693416388-ac5ce068fe85" },
  { n:"03", t:"O que tem em cada suíte", d:"Hidromassagem, spa, teto móvel, boate privativa e mais.", href:"#/experiencia", tones:["#0f1a16","#1a5a4a","#3a9a7a"], label:"Experiência", image:"1620626011761-996317b8d101" },
  { n:"04", t:"Folhear o cardápio", d:"Bebidas, espumantes, drinks e porções servidos na suíte.", href:"#/cardapio", tones:["#1a1408","#5a4210","#b8922a"], label:"Cardápio", image:"1551024709-8f23befc6f87" },
  { n:"05", t:"Onde fica e como chegar", d:"Jardim Panorama, Ipatinga — Google Maps e Waze.", href:"#/contato", tones:["#101620","#1a2a4a","#4a6a9a"], label:"Localização", image:"1517840901100-8179e982acb7" },
  { n:"06", t:"Tirar dúvidas", d:"Horários, pernoite, idade mínima e como reservar.", href:"#/sobre?to=duvidas", tones:["#141414","#2a2a2e","#5a5a64"], label:"Dúvidas", image:"1524758631624-e2822e304c36" }
];
