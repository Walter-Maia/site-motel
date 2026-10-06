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
MB.mediaPath = "assets/media/";
MB.img = function(src, w){
  if(!src) return null;
  if(w && w <= 640 && src.startsWith(MB.mediaPath)) return src.replace(/\.webp$/, "-sm.webp");
  return src;
};
MB.shot = function(id, n){ return MB.mediaPath + id + "/" + String(n).padStart(2,"0") + ".webp"; };

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
    image: MB.shot("japonesa", 1),
    tagline: "Treze cenários temáticos com hidromassagem, boate e teto móvel — a porta de entrada para a experiência Montblack.",
    amenities: ["Ar-condicionado", 'TV LCD 52"', 'TV LCD 32"', "Hidromassagem", "Frigobar", "Boate", "Teto móvel"],
    prices: { oneHour: 93, twoHours: 113, overnight: 180 },
    tones: ["#33161a", "#601313", "#8a3a2a"]
  },
  master: {
    id: "master", label: "Master", title: "Suítes Master", count: 6,
    image: MB.shot("romana", 1),
    tagline: "Ambientes amplos com spa com hidromassagem, duas TVs LED e o dobro de conforto para quem quer ir além.",
    amenities: ["Ar-condicionado", '2 TVs LED de 47"', "Spa com hidromassagem", "2 frigobares", "Boate", "Teto móvel"],
    prices: { oneHour: null, twoHours: 120, overnight: 190 },
    tones: ["#1c1114", "#4a0f14", "#7a2a3a"]
  },
  duplex: {
    id: "duplex", label: "Master Duplex", title: "Master Duplex", count: 2,
    image: "",   /* Baiana e Árabe ainda sem fotos */
    tagline: "Dois andares, spa com hidromassagem e a mais completa estrutura da casa — a experiência Montblack em sua forma máxima.",
    amenities: ["2 andares", "Ar-condicionado", '2 TVs LED de 47"', "Spa com hidromassagem", "2 frigobares", "Boate", "Teto móvel"],
    prices: { oneHour: null, twoHours: 125, overnight: 200 },
    tones: ["#14100f", "#3d1a10", "#8a5a2a"]
  }
};

/* ------------------------------------------------------------
   SUÍTES — 21 (13 VIP, 6 MASTER, 2 MASTER DUPLEX)
   Último argumento = legendas das fotos, na ordem dos arquivos
   01.webp, 02.webp … da pasta assets/media/<id>/ (a 01 é a capa).
   Use null enquanto a suíte não tiver fotos: o site mostra
   "Aguardando material". Para a suíte sem vídeo, acrescente
   false ao final: mbSuite(…, [legendas], false).
------------------------------------------------------------ */
function mbSuite(id, name, category, description, tones, shots, film){
  const cat = MB.categories[category];
  const views = shots || [];
  return {
    id, name, category,
    categoryLabel: cat.label,
    description,
    amenities: cat.amenities,
    prices: cat.prices,
    tones: tones || cat.tones,
    views,
    images: views.map((_, i) => MB.shot(id, i + 1)),
    film: views.length && film !== false ? { src: MB.mediaPath + id + "/filme.mp4", poster: MB.mediaPath + id + "/filme.webp" } : null
  };
}

MB.suites = [
  mbSuite("bangalo","Bangalô","vip","Cama sob um pergolado de madeira, luz âmbar e a hidromassagem banhada em verde do outro lado do vidro. Um refúgio de clima tropical, a poucos minutos do centro de Ipatinga.",["#1e1a12","#4a3a1a","#8a6a2a"],["Ambiente principal","Estar","Hidromassagem e cama","Vista pelo vidro","Hidromassagem"]),
  mbSuite("high-tech","High Tech","vip","Piso negro, luz azul e um mural de palco que ocupa a parede inteira. A suíte mais noturna da casa, com globo espelhado e hidromassagem sob o teto móvel.",["#101418","#1e3a4a","#3a6a8a"],["Ambiente principal","Cama e mural","Luz azul","Cama","Estar","Teto móvel"]),
  mbSuite("titanic","Titanic","vip","Romantismo clássico inspirado na elegância dos grandes transatlânticos. Um convite a uma noite memorável.",["#101620","#1a2a4a","#4a6a9a"],null),
  mbSuite("mexicana","Mexicana","vip","Um sombrero gigante suspenso sobre a cama redonda, cactos e piso de pedra. Calorosa e bem-humorada, com hidromassagem sob o céu aberto.",["#2a1208","#7a2a10","#c2652a"],["Ambiente principal","Cama redonda","Vista da entrada","Teto móvel","Hidromassagem","Banheiro"]),
  mbSuite("texana","Texana","vip","Madeira escura, um entardecer de faroeste pintado na parede e a hidromassagem redonda sob o teto móvel. Feita para encontros sem pressa.",["#241610","#5a3018","#9a6a3a"],["Cama e mural","Ambiente principal","Hidromassagem","Teto móvel","Cama","Hidromassagem e cama","Estar","Banheiro"], false), /* filme ainda não convertido: tirar o false quando assets/media/texana/filme.mp4 existir */
  mbSuite("japonesa","Japonesa","vip","Vermelho laqueado, painéis em treliça e cama baixa sobre um tablado de madeira. Linhas limpas, bambu e uma calma que desacelera a noite.",["#181414","#5a1a1a","#a83a3a"],["Cama e mural","Ambiente principal","Estar e cama","Teto móvel","Hidromassagem"]),
  mbSuite("indiana","Indiana","vip","Um pavilhão de madeira entalhada abriga a cama redonda, diante do Taj Mahal ao entardecer. Piso em mosaico colorido e hidromassagem entre folhagens.",["#1c1020","#4a1a4a","#8a3a7a"],["Cama e pavilhão","Cama redonda","Hidromassagem","Detalhe da hidromassagem","Estar","Estar e pavilhão"]),
  mbSuite("egipcia","Egípcia","vip","Hieróglifos em relevo percorrem a parede alta, acima da hidromassagem cercada de palmeiras. Dourados, sombras e um teto que se abre para o céu.",["#1a1408","#5a4210","#b8922a"],["Ambiente principal","Cama","Hidromassagem e teto móvel","Estar"]),
  mbSuite("havaiana","Havaiana","vip","Cama redonda sob um pergolado de troncos, painel de coqueirais e luz verde-água. Clima de ilha, com a hidromassagem voltada para o céu.",["#0f1a16","#1a5a4a","#3a9a7a"],["Cama redonda","Pergolado","Ambiente principal","Teto móvel","Hidromassagem","Luzes da boate"]),
  mbSuite("executiva","Executiva","vip","Tons claros, mármore e uma cama redonda no centro do ambiente. Sóbria e silenciosa, com mesa de trabalho e hidromassagem em jardim iluminado.",["#141414","#2a2a2e","#5a5a64"],["Cama redonda","Mesa e cama","Mesa de trabalho","Cama e mezanino","Estar","Hidromassagem","Cama"]),
  mbSuite("inglesa","Inglesa","vip","Paredes vermelhas, piso de arabescos e uma cabeceira em forma de lábios como peça central. Teatral na medida certa, com hidromassagem sob o teto móvel.",["#1c0c0c","#5a1414","#a02a2a"],["Cama","Hidromassagem e cama","Hidromassagem","Cama e telas","Teto móvel","Frigobar","Banheiro"]),
  mbSuite("marroquina","Marroquina","vip","Tecidos suspensos no teto, ladrilhos estampados e folhagens iluminadas. Um riad particular, de luz baixa e hidromassagem de canto.",["#20120c","#6a2a14","#b05a2a"],["Cama e tecidos","Ambiente principal","Estar","Hidromassagem","Ducha","Banheiro"]),
  mbSuite("paulista","Paulista","vip","Uma fachada azul de sobrado, com portas de madeira e lampião de rua, emoldura a cama. A cidade em versão íntima, com hidromassagem sob o teto móvel.",["#121214","#1a2a4a","#3a5a8a"],["Cama e lampião","Cama","Fachada","Teto móvel","Hidromassagem","Vista da cama"], false), /* filme ainda não convertido: tirar o false quando assets/media/paulista/filme.mp4 existir */
  mbSuite("espanhola","Espanhola","master","Cama redonda em capitonê vermelho e hidromassagem em formato de coração sobre um tablado de pedra. Espaço Master, luz cênica e um teto que se abre.",["#240c0c","#6a1414","#a82a2a"],["Cama redonda","Spa com hidromassagem","Spa e cama","Detalhe do spa","Teto móvel","Banheiro"]),
  mbSuite("francesa","Francesa","master","Lambris de madeira escura, lustres e espelhos em arco. Um salão parisiense em escala íntima, com spa ao fundo e a estrutura Master completa.",["#181018","#4a1a3a","#8a3a6a"],["Ambiente principal","Cama","Vista da cama","Spa com hidromassagem","Banheiro"]),
  mbSuite("las-vegas","Las Vegas","master","Pastilhas douradas, piso negro e o horizonte da cidade iluminado na parede. Spa redondo e luzes de boate para noites que não têm hora.",["#100c18","#2a1a5a","#5a3aa8"],["Cama e tela","Ambiente principal","Spa com hidromassagem","Painel da cidade","Estar","Cama","Spa","Ducha"]),
  mbSuite("romana","Romana","master","A cama repousa sob arcos brancos, diante de um afresco da Fontana di Trevi. Granito, luz suave e o spa no alto de uma escadaria.",["#161410","#4a3a1a","#8a7a3a"],["Cama e afresco","Arcos","Ambiente principal","Estar e spa","Teto móvel","Spa com hidromassagem","Luz da boate","Ducha"], false), /* filme ainda não convertido: tirar o false quando assets/media/romana/filme.mp4 existir */
  mbSuite("harley-davidson","Harley Davidson","master","Piso negro espelhado, murais de estrada e uma moto suspensa na parede. Personalidade forte, com spa e teto móvel.",["#121110","#3a2410","#7a4a1a"],["Cama e mural","Cama","Spa e cama","Spa com hidromassagem","Teto móvel","Ducha"]),
  mbSuite("country","Country","master","O aconchego do campo com a estrutura Master completa: rusticidade elegante e spa com hidromassagem.",["#181208","#4a3210","#8a6a3a"],null),
  mbSuite("baiana","Baiana","duplex","Dois andares de axé e aconchego: a alegria da Bahia em uma das suítes mais completas da casa.",["#20100a","#6a3a10","#c28a2a"],null),
  mbSuite("arabe","Árabe","duplex","Uma noite das mil e uma noites em duplex: tendas, tons profundos, spa e privacidade absoluta em dois andares.",["#180c14","#4a1430","#8a2a5a"],null)
];

/* Suítes exibidas em destaque na Home (a primeira ocupa o quadro maior) */
MB.featured = ["romana", "japonesa", "mexicana"];

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
  {t:"Hidromassagem", d:"Água quente, luz baixa e tempo só de vocês. Presente em todas as suítes.", image:MB.shot("havaiana", 5)},
  {t:"Spa", d:"Nas suítes Master e Master Duplex, o spa com hidromassagem eleva a experiência.", image:MB.shot("romana", 6)},
  {t:"Teto móvel", d:"Abra o teto e deixe o céu de Ipatinga entrar no quarto.", image:MB.shot("japonesa", 4)},
  {t:"Boate privativa", d:"Sua pista de dança particular, com clima de balada só para dois.", image:MB.shot("las-vegas", 2)},
  {t:"Ar-condicionado", d:"Clima perfeito em qualquer estação, do jeito que vocês preferirem.", image:MB.shot("executiva", 4)},
  {t:"TV em todas as suítes", d:'Telas LCD e LED de até 52" para trilhas sonoras e maratonas a dois.', image:MB.shot("las-vegas", 4)},
  {t:"Frigobar", d:"Bebidas geladas ao alcance da mão — sem precisar sair do quarto.", image:MB.shot("inglesa", 6)},
  {t:"Privacidade", d:"Entrada discreta e atendimento que respeita o seu momento.", image:MB.shot("marroquina", 3)},
  {t:"Ambientes temáticos", d:"21 cenários diferentes para nunca repetir a mesma história.", image:MB.shot("indiana", 1)}
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
  { n:"01", t:"Conhecer as 21 suítes", d:"Do Bangalô à Árabe, em três categorias de conforto.", href:"#/suites", tones:["#180c14","#4a1430","#8a2a5a"], label:"Suítes", image:MB.shot("las-vegas", 1) },
  { n:"02", t:"Ver valores e períodos", d:"1 hora, 2 horas ou pernoite — tabela completa por categoria.", href:"#/suites?to=valores", tones:["#33161a","#601313","#8a3a2a"], label:"Valores", image:MB.shot("espanhola", 1) },
  { n:"03", t:"O que tem em cada suíte", d:"Hidromassagem, spa, teto móvel, boate privativa e mais.", href:"#/experiencia", tones:["#0f1a16","#1a5a4a","#3a9a7a"], label:"Experiência", image:MB.shot("havaiana", 4) },
  { n:"04", t:"Folhear o cardápio", d:"Bebidas, espumantes, drinks e porções servidos na suíte.", href:"#/cardapio", tones:["#1a1408","#5a4210","#b8922a"], label:"Cardápio", image:MB.shot("inglesa", 6) },
  { n:"05", t:"Onde fica e como chegar", d:"Jardim Panorama, Ipatinga — Google Maps e Waze.", href:"#/contato", tones:["#101620","#1a2a4a","#4a6a9a"], label:"Localização", image:"" },
  { n:"06", t:"Tirar dúvidas", d:"Horários, pernoite, idade mínima e como reservar.", href:"#/sobre?to=duvidas", tones:["#141414","#2a2a2e","#5a5a64"], label:"Dúvidas", image:"" }
];
