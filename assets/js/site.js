/* ============================================================
   MOTEL MONTBLACK — LÓGICA DO SITE
   Router por hash (#/suites, #/suites/arabe, #/contato …),
   renderização das áreas a partir de data.js, overlays,
   flipbook 3D, galeria, disponibilidade e microinterações.
============================================================ */
(function(){
"use strict";

const { config: motelConfig, lodging: lodgingInfo, categories, suites, menu: menuPages, menuInfo, experiences, faq, intents, featured } = window.MB;

/* ------------------------------------------------------------
   HELPERS
------------------------------------------------------------ */
const $  = (s, ctx=document) => ctx.querySelector(s);
const $$ = (s, ctx=document) => [...ctx.querySelectorAll(s)];
const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)");
const finePointer    = window.matchMedia("(pointer: fine)");
const wideScreen     = window.matchMedia("(min-width: 1024px)");
const fmtBRL = v => v==null ? null : "R$ " + v.toFixed(2).replace(".",",");
const pad2   = n => String(n).padStart(2,"0");
const wait   = ms => new Promise(r => setTimeout(r, ms));
const fromPrice = p => p.oneHour ?? p.twoHours;
const fromLabel = p => p.oneHour ? "1 hora" : "2 horas";

const PENDING = "Aguardando material";
/* Quadro de mídia: fundo no tom da suíte. Sem fotografia, fica o nome com a legenda "Aguardando material" */
function makePH(name, tones, label, opts={}){
  const el = document.createElement("div");
  el.className = "ph" + (opts.quiet ? " quiet" : "");
  el.style.setProperty("--ph-bg", tones[1]);
  el.style.setProperty("--ph-deep", tones[0]);
  el.setAttribute("role","img");
  el.setAttribute("aria-label", `${name} — ${PENDING.toLowerCase()}`);
  el.innerHTML = `<span class="ph-name" aria-hidden="true">${name}</span><span class="ph-wait" aria-hidden="true">${PENDING}</span>`;
  return el;
}
/* Imagem com fade-in; se falhar, some e o quadro volta a mostrar "Aguardando material" */
function makeImg(src, alt, w, eager){
  const img = document.createElement("img");
  img.src = MB.img(src, w); img.alt = alt;
  if(!eager) img.loading = "lazy";
  img.decoding = "async";
  const ready = () => img.classList.add("loaded");
  img.onload = ready;
  img.onerror = () => { img.parentElement?.classList.remove("has-img"); img.remove(); };
  if(img.complete && img.naturalWidth) ready();
  return img;
}
/* Fotografias: quando `src` existir, a <img> cobre o quadro (que serve de fundo enquanto ela carrega) */
function media(container, src, name, tones, label, opts={}){
  container.innerHTML = "";
  const ph = makePH(name, tones, label, opts);
  if(src){
    ph.removeAttribute("role"); ph.removeAttribute("aria-label");
    ph.appendChild(makeImg(src, `${name} — ${label || "ambiente"}`, opts.w, opts.eager));
    ph.classList.add("has-img");
  }
  container.appendChild(ph);
  return ph;
}
function lockScroll(lock){ document.body.classList.toggle("no-scroll", lock); }
function suiteById(id){ return suites.find(s => s.id === id); }

/* ------------------------------------------------------------
   ROUTER
------------------------------------------------------------ */
const PAGE_TITLES = {
  home: "Motel Montblack — Suítes temáticas e experiências privadas em Ipatinga",
  suites: "Suítes — Motel Montblack, Ipatinga",
  suite: "{name} — Suíte {cat} · Motel Montblack",
  experiencia: "Experiência — Motel Montblack, Ipatinga",
  cardapio: "Cardápio — Motel Montblack, Ipatinga",
  sobre: "Sobre — Motel Montblack, Ipatinga",
  contato: "Contato e localização — Motel Montblack, Ipatinga"
};
/* âncoras antigas da landing page continuam funcionando */
const LEGACY = { inicio:"/", suites:"/suites", cardapio:"/cardapio", experiencia:"/experiencia", localizacao:"/contato", sobre:"/sobre", contato:"/contato" };
const pageEls = {};
let currentPage = null, navSeq = 0;

function parseRoute(){
  let h = location.hash.replace(/^#/, "");
  try{ h = decodeURIComponent(h); }catch(e){ h = "/"; }
  if(!h.startsWith("/")) h = LEGACY[h] ?? "/";
  const [path, qs] = h.split("?");
  const seg = path.split("/").filter(Boolean);
  const query = Object.fromEntries(new URLSearchParams(qs || ""));
  let page = seg[0] || "home", param = seg[1] || null;
  if(page === "suites" && param){ page = "suite"; }
  if(!pageEls[page]) { page = "home"; param = null; }
  if(page === "suite" && !suiteById(param)) { page = "suites"; param = null; }
  return { page, param, query };
}

async function showPage(name, afterShow){
  const next = pageEls[name];
  const my = ++navSeq;
  if(currentPage === next){ afterShow?.(); return; }
  document.body.classList.add("routing");
  if(currentPage){
    currentPage.classList.add("is-leaving");
    await wait(prefersReduced.matches ? 0 : 230);
    if(my !== navSeq) return;
    currentPage.classList.remove("is-active","is-leaving");
  }
  window.scrollTo({ top:0, behavior:"auto" });
  next.classList.add("is-active");
  currentPage = next;
  document.body.dataset.page = name;
  /* acessibilidade: leva o foco ao título da nova página, sem rolar */
  const heading = next.querySelector("h1");
  if(heading){ heading.tabIndex = -1; heading.focus({ preventScroll:true }); }
  afterShow?.();
  requestAnimationFrame(() => document.body.classList.remove("routing"));
}

function scrollToTarget(id){
  const el = document.getElementById(id);
  if(!el) return;
  requestAnimationFrame(() => {
    const top = el.getBoundingClientRect().top + window.scrollY - 76;
    window.scrollTo({ top, behavior: prefersReduced.matches ? "auto" : "smooth" });
  });
}

function setActiveNav(page){
  const key = page === "suite" ? "suites" : page;
  $$("[data-nav]").forEach(a => a.classList.toggle("active", a.dataset.nav === key));
}

function handleRoute(){
  const { page, param, query } = parseRoute();
  setActiveNav(page);
  const header = $("#siteHeader");
  header.classList.remove("hidden");

  if(page === "suite"){
    const s = suiteById(param);
    document.title = PAGE_TITLES.suite.replace("{name}", s.name).replace("{cat}", s.categoryLabel);
    showPage("suite", () => paintSuite(s));
    return;
  }
  document.title = PAGE_TITLES[page];
  showPage(page, () => {
    if(page === "suites"){
      setFilter(query.cat && categories[query.cat] ? query.cat : "all");
      if(query.cat) scrollToTarget("suiteIndexSection");
    }
    if(page === "cardapio") requestAnimationFrame(fitBookPages);   /* só dá para medir as páginas com a área visível */
    if(query.to) scrollToTarget(query.to);
    if(query.open === "availability") openAvailability();
  });
}

/* ------------------------------------------------------------
   HEADER / MENU MOBILE
------------------------------------------------------------ */
function initNavigation(){
  const header = $("#siteHeader");
  let lastY = window.scrollY;
  const onScroll = () => {
    const y = window.scrollY;
    header.classList.toggle("scrolled", y > 40);
    const goingDown = y > lastY + 4, goingUp = y < lastY - 4;
    if(goingDown && y > 320) header.classList.add("hidden");
    else if(goingUp || y < 120) header.classList.remove("hidden");
    lastY = y;
  };
  window.addEventListener("scroll", onScroll, { passive:true });
  onScroll();

  const menu = $("#mobileMenu"), toggle = $("#menuToggle"), close = $("#menuClose");
  let lastFocus = null;
  const openMenu = () => {
    lastFocus = document.activeElement;
    menu.classList.add("open"); menu.setAttribute("aria-hidden","false");
    toggle.setAttribute("aria-expanded","true"); lockScroll(true);
    $("#bottomBar").classList.remove("visible");
    close.focus();
  };
  const closeMenu = () => {
    if(!menu.classList.contains("open")) return;
    menu.classList.remove("open"); menu.setAttribute("aria-hidden","true");
    toggle.setAttribute("aria-expanded","false");
    if(overlayStack.length === 0) lockScroll(false);
    window.dispatchEvent(new Event("scroll"));
    if(lastFocus && overlayStack.length === 0) lastFocus.focus();
  };
  toggle.addEventListener("click", openMenu);
  close.addEventListener("click", closeMenu);
  $$(".mm-links a, .mm-bottom [data-open-availability]", menu).forEach(a => a.addEventListener("click", closeMenu));
  document.addEventListener("keydown", e => { if(e.key === "Escape" && menu.classList.contains("open")) closeMenu(); });
  window.addEventListener("hashchange", closeMenu);
}

/* ------------------------------------------------------------
   HOME — HERO 3D (baralho de suítes que se embaralha sozinho)
   Quatro cartas: três à vista em profundidade e uma escondida no fundo.
   A cada rodada a carta da frente sai pela lateral, passa por trás das
   outras e volta ao fundo do baralho já com outra suíte; as demais avançam.
   Clique (ou toque) numa carta de trás: ela sai pela esquerda, passa por
   cima das outras e assume a frente; as da frente recuam uma casa. Clique
   na carta da frente abre a suíte.
   Pausa com o cursor ou o foco no baralho, com a aba em segundo plano,
   fora da tela e por alguns segundos depois de uma escolha. Com "reduzir
   movimento", o baralho não se embaralha sozinho e a troca é imediata.
------------------------------------------------------------ */
const DECK_SIZE = 4, DECK_EVERY = 3600, DECK_HOLD = 6500;
function paintPlate(a, s){
  const from = `${fromLabel(s.prices)} a partir de ${fmtBRL(fromPrice(s.prices))}`;
  a.href = `#/suites/${s.id}`;
  a.setAttribute("aria-label", `Suíte ${s.number}, ${s.name} (${s.categoryLabel}): ${from}`);
  media(a.querySelector(".plate-media"), s.images[0], s.name, s.tones, s.views[0], { quiet:true, w:900, eager:true });
  a.querySelector(".plate-meta").innerHTML = `
    <small>Suíte ${s.number} · ${s.categoryLabel}</small>
    <b>${s.name}</b>
    <i>${from}</i>
    <span class="arrow" aria-hidden="true">→</span>`;
}
function renderHeroStack(){
  const stack = $("#heroStack");
  /* só suítes com fotografia, numa ordem nova a cada visita */
  const pool = suites.filter(s => s.images.length);
  for(let i = pool.length - 1; i > 0; i--){ const j = Math.floor(Math.random() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
  let drawn = 0;
  const draw = () => pool[drawn++ % pool.length];
  const deck = [];
  for(let k = 0; k < DECK_SIZE; k++){
    const a = document.createElement("a");
    a.className = "plate";
    a.innerHTML = `<span class="plate-media"></span><span class="plate-meta"></span>`;
    paintPlate(a, draw());
    stack.appendChild(a);
    deck.push(a);
  }
  /* slot 0 = carta da frente (a única no foco do teclado e no leitor de tela) */
  const place = () => deck.forEach((a, slot) => {
    a.dataset.slot = slot;
    a.dataset.cursor = slot === 0 ? "Ver suíte" : "Trazer à frente";
    a.tabIndex = slot === 0 ? 0 : -1;
    a.setAttribute("aria-hidden", String(slot !== 0));
  });
  place();

  let busy = false, queued = null, holdUntil = 0;
  const settle = () => { busy = false; if(queued){ const q = queued; queued = null; if(q.dataset.slot !== "0") pull(q); } };
  /* a carta escolhida sai pela esquerda, sobe por cima das outras e assenta na frente */
  const pull = a => {
    holdUntil = Date.now() + DECK_HOLD;
    const from = getComputedStyle(a).transform;
    deck.splice(deck.indexOf(a), 1);
    deck.unshift(a);
    if(prefersReduced.matches){ place(); return; }
    busy = true;
    a.classList.add("is-pulling");
    place();
    const to = getComputedStyle(a).transform;
    const anim = a.animate([
      { transform: from },
      { transform: `translate3d(${getComputedStyle(stack).getPropertyValue("--pull-x").trim() || "-66%"}, 3%, 70px) rotate(-7deg)`, offset: .45 },
      { transform: to }
    ], { duration: 1050, easing: "cubic-bezier(.55,.05,.25,1)" });
    anim.onfinish = anim.oncancel = () => { a.classList.remove("is-pulling"); settle(); };
  };
  stack.addEventListener("click", e => {
    const a = e.target.closest(".plate");
    if(!a || a.dataset.slot === "0") return;   /* a da frente segue o link */
    e.preventDefault();
    if(busy) queued = a; else pull(a);
  });

  const hero = $("#heroHome");
  if(!prefersReduced.matches){
    let hovered = false, focused = false, inView = true;
    const shuffle = () => {
      busy = true;
      const out = deck.shift();
      deck.push(out);
      out.classList.add("is-leaving");
      place();
      out.addEventListener("animationend", () => {
        out.classList.remove("is-leaving");
        paintPlate(out, draw());   /* já está escondida no fundo: troca de suíte sem ninguém ver */
        settle();
      }, { once:true });
    };
    const tick = () => {
      setTimeout(tick, DECK_EVERY);
      if(busy || hovered || focused || !inView || document.hidden || Date.now() < holdUntil || currentPage !== pageEls.home) return;
      shuffle();
    };
    setTimeout(tick, DECK_EVERY);
    /* só o mouse pausa: no toque, o "hover" emulado ficaria preso depois de tocar numa carta */
    stack.addEventListener("pointerenter", e => { if(e.pointerType === "mouse") hovered = true; });
    stack.addEventListener("pointerleave", e => { if(e.pointerType === "mouse") hovered = false; });
    stack.addEventListener("focusin", () => { focused = true; });
    stack.addEventListener("focusout", () => { focused = false; });
    new IntersectionObserver(([e]) => { inView = e.isIntersecting; }).observe(stack);
  }

  if(prefersReduced.matches || !finePointer.matches) return;
  let raf = null;
  hero.addEventListener("mousemove", e => {
    if(raf) return;
    raf = requestAnimationFrame(() => {
      raf = null;
      const r = hero.getBoundingClientRect();
      const x = (e.clientX - r.left)/r.width - .5, y = (e.clientY - r.top)/r.height - .5;
      stack.style.setProperty("--ry", (x*10).toFixed(2) + "deg");
      stack.style.setProperty("--rx", (-y*6).toFixed(2) + "deg");
    });
  });
  hero.addEventListener("mouseleave", () => {
    stack.style.setProperty("--ry","0deg"); stack.style.setProperty("--rx","0deg");
  });
}

/* ------------------------------------------------------------
   PREVIEW FLUTUANTE — no índice de suítes, o filme da suíte acompanha
   o cursor (apenas desktop/pointer fino). Um único <video> é reaproveitado;
   a capa do filme aparece na hora e o vídeo entra assim que começa a tocar.
------------------------------------------------------------ */
const hoverPreview = { el:null, raf:null, x:0, y:0, video:null, suite:null };
function initHoverPreview(){
  hoverPreview.el = $("#hoverPreview");
  if(!finePointer.matches || prefersReduced.matches) return;
  window.addEventListener("hashchange", hideFilmPreview);   /* o clique leva à suíte sem disparar mouseleave */
  document.addEventListener("mousemove", e => {
    hoverPreview.x = e.clientX; hoverPreview.y = e.clientY;
    if(hoverPreview.raf) return;
    hoverPreview.raf = requestAnimationFrame(() => {
      hoverPreview.raf = null;
      /* perto da borda direita, o quadro passa para o outro lado do cursor */
      const dx = hoverPreview.x + 270 > window.innerWidth ? -150 : 150;
      const half = hoverPreview.el.offsetHeight / 2 + 12, y = Math.min(Math.max(hoverPreview.y, half), window.innerHeight - half);
      hoverPreview.el.style.transform = `translate(${hoverPreview.x + dx}px, ${y}px) translate(-50%,-50%)`;
    });
  }, { passive:true });
}
function showFilmPreview(s){
  const pv = hoverPreview;
  /* o <video> fica sempre no DOM: tirá-lo de lá faz o navegador pausá-lo */
  if(!pv.video){
    pv.el.innerHTML = `<span class="hp-media"></span><video muted loop playsinline preload="auto"></video><span class="hp-cap"></span>`;
    pv.video = pv.el.querySelector("video");
    pv.video.muted = true;
    pv.video.addEventListener("playing", () => pv.el.classList.add("is-playing"));
  }
  if(pv.suite !== s){
    pv.suite = s;
    pv.el.classList.remove("is-playing");
    media(pv.el.querySelector(".hp-media"), s.film.poster, s.name, s.tones, "Filme da suíte", { quiet:true, eager:true });
    pv.el.querySelector(".hp-cap").innerHTML = `<small>Suíte ${s.number}</small>${s.name}`;
    pv.video.src = s.film.src;
  }
  pv.video.play().catch(() => {});
  pv.el.classList.add("visible");
}
function hideFilmPreview(){
  hoverPreview.el?.classList.remove("visible");
  hoverPreview.video?.pause();
}
function bindFilmPreview(el, s){
  if(!s.film || !finePointer.matches || prefersReduced.matches) return;
  el.addEventListener("mouseenter", () => { if(wideScreen.matches) showFilmPreview(s); });
  el.addEventListener("mouseleave", hideFilmPreview);
}

/* ------------------------------------------------------------
   HOME — O QUE VOCÊ PROCURA? / DESTAQUES / FAQ
------------------------------------------------------------ */
function renderIntents(){
  $("#intentList").innerHTML = intents.map(it => `
    <li><a class="intent" href="${it.href}">
      <span class="i-num">${it.n}</span>
      <span class="i-text"><b>${it.t}</b><small>${it.d}</small></span>
      <span class="i-arrow" aria-hidden="true">→</span>
    </a></li>`).join("");
}
/* Destaques: os três quadros trocam de suíte, um de cada vez, percorrendo todas as
   suítes com foto. A nova foto é descoberta como cortina de baixo para cima e assenta
   de um leve zoom; a antiga afunda e apaga; nome e preço trocam junto. Para com o
   cursor em cima, fora da tela, com a aba oculta e com "reduzir movimento". */
const FEAT_EVERY = 4500;
function paintTileCaption(a, s){
  a.href = `#/suites/${s.id}`;
  a.setAttribute("aria-label", `Suíte ${s.number}, ${s.name}`);
  a.querySelector(".tile-caption").innerHTML = `
    <h3>${s.name}</h3>
    <span>${s.categoryLabel}<b>${fmtBRL(fromPrice(s.prices))} · ${fromLabel(s.prices)}</b></span>`;
}
function renderFeatured(){
  const grid = $("#featuredGrid");
  const shown = featured.map(suiteById).filter(Boolean);
  const tiles = shown.map((s, i) => {
    const a = document.createElement("a");
    a.className = "tile " + (i === 0 ? "big" : "small") + " reveal-d" + Math.min(i+1,3);
    a.dataset.mask = "";
    a.dataset.cursor = "Ver suíte";
    a.innerHTML = `<div class="tile-media"></div><div class="tile-caption"></div>`;
    paintTileCaption(a, s);
    media(a.querySelector(".tile-media"), s.images[0], s.name, s.tones, s.views[0], { quiet:true, w:1200 });
    a._suite = s;
    grid.appendChild(a);
    return a;
  });
  if(prefersReduced.matches || !tiles.length) return;

  const queue = suites.filter(s => s.images.length && !shown.includes(s));
  for(let i = queue.length - 1; i > 0; i--){ const j = Math.floor(Math.random() * (i + 1)); [queue[i], queue[j]] = [queue[j], queue[i]]; }
  let turn = 0, hovered = false, inView = false;
  const swap = () => {
    const a = tiles[turn++ % tiles.length];
    if(a.classList.contains("armada") || a.classList.contains("tocando") || a._busy) return;   /* a entrada do scroll vem primeiro */
    const next = queue.shift();
    queue.push(a._suite);
    a._suite = next;
    a._busy = true;
    const box = a.querySelector(".tile-media"), tmp = document.createElement("div");
    const ph = media(tmp, next.images[0], next.name, next.tones, next.views[0], { quiet:true, w:1200, eager:true });
    const img = ph.querySelector("img");
    const ready = img && img.decode ? Promise.race([img.decode().catch(() => {}), wait(700)]) : Promise.resolve();
    ready.then(() => {
      box.appendChild(ph);
      const old = [...box.children].filter(c => c !== ph);
      const ease = "cubic-bezier(.77,0,.18,1)";
      ph.animate([{ clipPath:"inset(100% 0 0 0)" }, { clipPath:"inset(0 0 0 0)" }], { duration:1200, easing:ease }).onfinish = () => { old.forEach(o => o.remove()); a._busy = false; };
      img?.animate([{ transform:"scale(1.16)" }, { transform:"scale(1)" }], { duration:1600, easing:"cubic-bezier(.16,1,.3,1)" });
      old.forEach(o => o.animate([{ transform:"translateY(0)", opacity:1 }, { transform:"translateY(-6%)", opacity:.35 }], { duration:1200, easing:ease, fill:"forwards" }));
      const cap = a.querySelector(".tile-caption");
      cap.animate([{ opacity:1, transform:"none" }, { opacity:0, transform:"translateY(-8px)" }], { duration:320, easing:"ease-in" }).onfinish = () => {
        paintTileCaption(a, next);
        cap.animate([{ opacity:0, transform:"translateY(10px)" }, { opacity:1, transform:"none" }], { duration:700, easing:"cubic-bezier(.16,1,.3,1)" });
      };
    });
  };
  setInterval(() => { if(!hovered && inView && !document.hidden && currentPage === pageEls.home) swap(); }, FEAT_EVERY);
  grid.addEventListener("pointerenter", e => { if(e.pointerType === "mouse") hovered = true; });
  grid.addEventListener("pointerleave", e => { if(e.pointerType === "mouse") hovered = false; });
  new IntersectionObserver(([e]) => { inView = e.isIntersecting; }, { threshold:.25 }).observe(grid);
}
function faqItemHTML(f){
  let link = "";
  if(f.link?.action === "availability") link = `<button class="link-arrow" data-open-availability>${f.link.label} <span class="arrow">→</span></button>`;
  else if(f.link?.href) link = `<a class="link-arrow" href="${f.link.href}">${f.link.label} <span class="arrow">→</span></a>`;
  return `<details class="faq-item" id="faq-${f.id}">
    <summary>${f.q}<i aria-hidden="true">+</i></summary>
    <div class="faq-body"><p>${f.a}</p>${link}</div>
  </details>`;
}
function renderFAQ(){
  $("#faqHome").innerHTML = faq.filter(f => f.home).map(faqItemHTML).join("");
  $("#faqFull").innerHTML = faq.map(faqItemHTML).join("");
  $("#rulesList").innerHTML = lodgingInfo.rules.map(r => `<li>${r}</li>`).join("");
  /* regras na página da suíte: cada linha entra pela própria máscara quando o bloco abre (só CSS) */
  $("#detailRules").innerHTML = lodgingInfo.rules.map((r, i) => `<li class="rule-line" style="--i:${i}"><span>${r}</span></li>`).join("");
}

/* ------------------------------------------------------------
   SUÍTES — CATEGORIAS / ÍNDICE / VALORES
------------------------------------------------------------ */
/* Categorias: três cartões com a mesma estrutura — o nome é a peça principal,
   o número de suítes aparece grande e vazado ao fundo, e a luz muda de tom
   conforme a categoria sobe (data-tier 1 a 3). O cartão inteiro é o link. */
const TIER_MARK = ["I", "II", "III"];
function renderCategoryColumns(){
  const price = v => v == null ? `<b class="na">—</b>` : `<b><i>R$</i>${v.toFixed(2).replace(".", ",")}</b>`;
  $("#catColumns").innerHTML = Object.values(categories).map((cat, i) => {
    const p = cat.prices;
    return `
    <a class="cat-card" data-tier="${i + 1}" href="#/suites?cat=${cat.id}" data-cursor="Ver suítes">
      <span class="cat-card-num" aria-hidden="true">${pad2(cat.count)}</span>
      <span class="cat-card-top"><span>Categoria ${TIER_MARK[i]}</span><span>${pad2(cat.count)} suítes</span></span>
      <span class="cat-card-tier" aria-hidden="true">${"✦".repeat(i + 1)}</span>
      <h3 class="cat-card-name">${cat.label}</h3>
      <span class="cat-card-tag">${cat.tagline}</span>
      <ul class="cat-card-amen">${cat.amenities.map(a => `<li>${a}</li>`).join("")}</ul>
      <span class="cat-card-prices">
        <span><small>1 hora</small>${price(p.oneHour)}</span>
        <span><small>2 horas</small>${price(p.twoHours)}</span>
        <span><small>Pernoite</small>${price(p.overnight)}</span>
      </span>
      <span class="cat-card-cta">Ver as suítes ${cat.label} <span class="arrow">→</span></span>
    </a>`;
  }).join("");
}
let currentFilter = "all";
function renderSuiteIndex(){
  const list = $("#suiteIndex");
  suites.forEach(s => {
    const li = document.createElement("li");
    li.className = "sx-row";
    li.dataset.category = s.category;
    li.innerHTML = `
      <a href="#/suites/${s.id}" data-cursor="Ver suíte" aria-label="Suíte ${s.number}, ${s.name}, ${s.categoryLabel}${s.images.length ? "" : ", " + PENDING.toLowerCase()}">
        <span class="sx-num">${s.number}</span>
        <span class="sx-thumb"></span>
        <span class="sx-name">${s.name}<small>${s.categoryLabel}${s.images.length ? "" : `<i>${PENDING}</i>`}</small></span>
        <span class="sx-desc">${s.description}</span>
        <span class="sx-price"><span>${fromLabel(s.prices)}</span><b>${fmtBRL(fromPrice(s.prices))}</b></span>
        <span class="sx-arrow" aria-hidden="true">→</span>
      </a>`;
    media(li.querySelector(".sx-thumb"), s.images[0], s.name, s.tones, s.views[0], { quiet:true, w:320 });
    bindFilmPreview(li.firstElementChild, s);
    list.appendChild(li);
  });
  $$(".filter-btn").forEach(b => b.addEventListener("click", () => {
    setFilter(b.dataset.filter);
    const url = b.dataset.filter === "all" ? "#/suites" : `#/suites?cat=${b.dataset.filter}`;
    history.replaceState(null, "", url);
  }));
}
function setFilter(f){
  currentFilter = f;
  $$(".filter-btn").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.filter === f)));
  let shown = 0;
  $$(".sx-row").forEach(row => {
    const show = f === "all" || row.dataset.category === f;
    row.classList.toggle("filter-out", !show);
    if(show) shown++;
  });
  $("#indexEmpty").hidden = shown > 0;
}
function renderPriceTable(){
  const cats = Object.values(categories);
  const rows = [
    ["1 hora", c => c.prices.oneHour, ""],
    ["2 horas", c => c.prices.twoHours, ""],
    ["Pernoite", c => c.prices.overnight, `${lodgingInfo.overnight.days}, ${lodgingInfo.overnight.period}`],
    ["Hora adicional", () => lodgingInfo.extraHour, "após 2 horas, em todas as suítes"]
  ];
  $("#priceTable").innerHTML = `
    <thead><tr><th scope="col">Período</th>${cats.map(c => `<th scope="col" class="cat-th"><b>${c.label}</b>${pad2(c.count)} suítes</th>`).join("")}</tr></thead>
    <tbody>${rows.map(([label, get, note]) => `
      <tr><td>${label}${note ? `<small>${note}</small>` : ""}</td>${cats.map(c => {
        const v = get(c);
        return `<td>${v == null ? `<span class="na">—</span>` : `<span class="pt-cur">R$</span>${v.toFixed(2).replace(".", ",")}`}</td>`;
      }).join("")}</tr>`).join("")}
    </tbody>`;
}

/* ------------------------------------------------------------
   SUÍTE — PÁGINA DE DETALHE + GALERIA + LIGHTBOX
------------------------------------------------------------ */
/* galleryItems = filme (quando houver) + fotos, na ordem em que aparecem no trilho */
let detailSuite = null, galleryItems = [], galleryIndex = 0;
function paintSuite(s){
  detailSuite = s;
  $("#detailHero").style.setProperty("--tone", s.tones[0]);
  media($("#detailCover"), s.images[0], s.name, s.tones, s.views[0], { w:1200, eager:true });
  $("#detailCat").textContent = `Suíte ${s.number} · ${s.categoryLabel}`;
  $("#detailName").textContent = s.name;
  $("#detailDesc").textContent = s.description;
  $("#detailFrom").innerHTML = `${fromLabel(s.prices)} a partir de <b>${fmtBRL(fromPrice(s.prices))}</b>`;
  $("#detailAmenities").innerHTML = s.amenities.map(a => `<li>${a}</li>`).join("");

  const rows = [];
  if(s.prices.oneHour != null) rows.push(["1 hora", s.prices.oneHour]);
  rows.push(["2 horas", s.prices.twoHours]);
  rows.push(["Pernoite (dom. à sex., 18h–14h)", s.prices.overnight]);
  rows.push(["Hora adicional (após 2h)", lodgingInfo.extraHour]);
  $("#detailPrices").innerHTML = rows.map(([l,v]) => `<div class="price-row"><span>${l}</span><b>${fmtBRL(v)}</b></div>`).join("");

  const i = suites.indexOf(s);
  const prev = suites[(i-1+suites.length)%suites.length], next = suites[(i+1)%suites.length];
  $("#detailPrevName").textContent = prev.name;
  $("#detailNextName").textContent = next.name;
  $("#detailPrevLink").href = `#/suites/${prev.id}`;
  $("#detailNextLink").href = `#/suites/${next.id}`;
  $("#detailAvailBtn").onclick = () => openAvailability(s);
  paintGallery();
}
/* ------------------------------------------------------------
   GALERIA IMERSIVA (skills hero-imersiva-miniaturas + imagem revelada com máscara)
   Foto grande em retrato com moldura dourada; ao fundo, a própria foto
   desfocada vira a luz ambiente da seção. Ao lado: número grande, legenda
   e miniaturas numeradas. A próxima foto se abre como cortina, do lado
   para onde se vai, assentando com um leve zoom; a atual fica respirando
   devagar. O filme toca mudo no quadro. Um só índice comanda miniaturas,
   setas, teclado e arraste no celular; clique na foto amplia.
------------------------------------------------------------ */
const gal = { i:-1, token:0 };
function paintGallery(){
  const s = detailSuite;
  galleryItems = [];
  if(s.film) galleryItems.push({ type:"film", src:s.film.src, thumb:s.film.poster, label:"Filme da suíte" });
  s.images.forEach((src, i) => galleryItems.push({ type:"photo", src, thumb:src, label:s.views[i] }));
  const has = galleryItems.length > 0, n = s.images.length;
  $("#gal").hidden = !has;
  $("#galAmbient").hidden = !has;
  $("#galleryArrows").hidden = galleryItems.length < 2;
  $("#galleryPending").hidden = has;
  $("#galleryCount").textContent = has ? `${n} ${n === 1 ? "foto" : "fotos"}${s.film ? " · 1 filme" : ""}` : "";
  $("#galLayers").innerHTML = "";
  $("#galAmbient").innerHTML = "";
  $("#galCap").innerHTML = "";
  if(!has) return;
  $("#galEyebrow").textContent = `Suíte ${s.number} · ${s.name}`;
  $("#galTotal").textContent = `/ ${pad2(galleryItems.length)}`;
  $("#galProgress").innerHTML = galleryItems.map(() => "<i></i>").join("");
  $("#galThumbs").innerHTML = "";
  galleryItems.forEach((it, i) => {
    const film = it.type === "film";
    const b = document.createElement("button");
    b.type = "button";
    b.className = "gal-thumb" + (film ? " is-film" : "");
    b.setAttribute("aria-label", film ? `Filme da suíte ${s.name}` : `Foto ${i + 1}: ${it.label}`);
    b.innerHTML = `<span class="gal-thumb-media"></span><small>${pad2(i + 1)}</small>`;
    media(b.firstElementChild, it.thumb, s.name, s.tones, it.label, { quiet:true, w: film ? 0 : 320 });
    if(film) b.insertAdjacentHTML("beforeend", `<span class="gal-play" aria-hidden="true"></span>`);
    b.addEventListener("click", () => galShow(i));
    $("#galThumbs").appendChild(b);
  });
  gal.i = -1;
  galShow(0, 0);
}
function galShow(i, dir){
  const n = galleryItems.length;
  if(!n) return;
  i = (i + n) % n;
  if(i === gal.i) return;
  if(dir === undefined) dir = gal.i < 0 ? 0 : (i > gal.i ? 1 : -1);
  const s = detailSuite, it = galleryItems[i], film = it.type === "film", my = ++gal.token;
  gal.i = i;

  /* painel: número, legenda que sobe de dentro da máscara, progresso e miniatura ativa */
  $("#galNum").textContent = pad2(i + 1);
  const cap = $("#galCap");
  cap.querySelectorAll(".gal-cap-in").forEach(o => { o.classList.add("out"); setTimeout(() => o.remove(), 500); });
  cap.insertAdjacentHTML("beforeend", `<span class="gal-cap-in${dir ? " in" : ""}">${it.label}</span>`);
  $$("#galProgress i").forEach((seg, k) => seg.classList.toggle("on", k <= i));
  $$("#galThumbs .gal-thumb").forEach((t, k) => t.setAttribute("aria-pressed", String(k === i)));
  /* no celular as miniaturas rolam de lado: centraliza a ativa sem mexer na rolagem da página */
  const box = $("#galThumbs"), on = box.children[i];
  if(on && box.scrollWidth > box.clientWidth + 2) box.scrollTo({ left: on.offsetLeft - (box.clientWidth - on.offsetWidth) / 2, behavior: prefersReduced.matches ? "auto" : "smooth" });
  $("#galStage").setAttribute("aria-label", film ? `Assistir ao filme da suíte ${s.name}` : `Ampliar foto: ${it.label}`);
  $("#galStage").dataset.cursor = film ? "Assistir" : "Ampliar";

  /* nova camada por cima; só entra depois de a imagem decodificar (a atual fica até lá) */
  const layers = $("#galLayers"), layer = document.createElement("span");
  layer.className = "gal-layer";
  const ph = media(layer, it.thumb, s.name, s.tones, it.label, { quiet:true, w: film ? 0 : 1200, eager:true });
  if(film) ph.insertAdjacentHTML("beforeend", `<video muted loop playsinline autoplay preload="auto" src="${it.src}" aria-hidden="true"></video>`);
  const img = layer.querySelector("img");
  const ready = img && img.decode ? Promise.race([img.decode().catch(() => {}), wait(450)]) : Promise.resolve();
  ready.then(() => {
    if(my !== gal.token) return;   /* já pediram outra foto */
    layers.appendChild(layer);
    layer.querySelector("video")?.play().catch(() => {});
    const old = [...layers.children].filter(l => l !== layer);
    old.forEach(l => l.querySelectorAll("video").forEach(v => v.pause()));
    const clean = () => old.forEach(l => l.remove());
    if(!dir || prefersReduced.matches){ clean(); return; }
    /* cortina do lado para onde se vai, com a foto assentando de um leve zoom */
    const fromClip = dir > 0 ? "inset(0 0 0 100%)" : "inset(0 100% 0 0)";
    const a = layer.animate([{ clipPath: fromClip }, { clipPath: "inset(0 0 0 0)" }], { duration: 1100, easing: "cubic-bezier(.77,0,.18,1)" });
    ph.animate([{ transform: "scale(1.16)" }, { transform: "scale(1)" }], { duration: 1500, easing: "cubic-bezier(.16,1,.3,1)" });
    old.forEach(l => l.animate([{ transform: "translateX(0)", opacity: 1 }, { transform: `translateX(${-dir * 6}%)`, opacity: .35 }], { duration: 1100, easing: "cubic-bezier(.77,0,.18,1)", fill: "forwards" }));
    a.onfinish = a.oncancel = clean;
  });

  /* luz ambiente: a própria foto, desfocada, cruza com a anterior */
  const amb = $("#galAmbient"), glow = document.createElement("img");
  glow.alt = ""; glow.decoding = "async";
  glow.src = film ? it.thumb : MB.img(it.thumb, 320);
  glow.onload = () => {
    if(my !== gal.token) return;
    amb.appendChild(glow);
    const prev = [...amb.children].filter(g => g !== glow);
    if(prefersReduced.matches){ prev.forEach(g => g.remove()); return; }
    glow.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 1200, easing: "ease" }).onfinish = () => prev.forEach(g => g.remove());
  };

  /* pré-carrega a próxima e a anterior */
  [i + 1, i - 1].forEach(k => { const nx = galleryItems[(k + n) % n]; if(nx.type === "photo") new Image().src = nx.src; });
}
function galGo(dir){ galShow(gal.i + dir, dir); }
function lightboxGo(dir){
  const n = galleryItems.length;
  if(n < 2) return;
  galleryIndex = (galleryIndex + dir + n) % n;
  paintLightbox();
}
function initGallery(){
  $("#galleryPrev").addEventListener("click", () => galGo(-1));
  $("#galleryNext").addEventListener("click", () => galGo(1));
  $("#galStage").addEventListener("click", () => { if(!galSwiped) openLightbox(gal.i); });
  $("#gal").addEventListener("keydown", e => {
    if(e.key === "ArrowRight"){ e.preventDefault(); galGo(1); }
    if(e.key === "ArrowLeft"){ e.preventDefault(); galGo(-1); }
  });
  /* celular: arrastar a foto para o lado troca; o toque simples amplia */
  let galSwiped = false;
  swipe($("#galStage"), dir => { galSwiped = true; setTimeout(() => { galSwiped = false; }, 350); galGo(dir); });

  const lb = $("#lightbox");
  $("#lightboxClose").addEventListener("click", () => closeOverlay(lb));
  $("#lightboxPrev").addEventListener("click", () => lightboxGo(-1));
  $("#lightboxNext").addEventListener("click", () => lightboxGo(1));
  lb.addEventListener("click", e => { if(e.target === e.currentTarget || e.target.id === "lightboxStage") closeOverlay(lb); });
  document.addEventListener("keydown", e => {
    if(!lb.classList.contains("open")) return;
    if(e.key === "ArrowRight") lightboxGo(1);
    if(e.key === "ArrowLeft") lightboxGo(-1);
  });
  swipe(lb, dir => lightboxGo(dir));
}
function openLightbox(i){ galleryIndex = i; paintLightbox(); openOverlay($("#lightbox"), $("#lightboxClose")); }
function paintLightbox(){
  const s = detailSuite, it = galleryItems[galleryIndex], stage = $("#lightboxStage");
  stage.innerHTML = "";
  if(it.type === "film"){
    const v = document.createElement("video");
    v.src = it.src; v.poster = it.thumb;
    v.controls = true; v.autoplay = true; v.muted = true; v.loop = true; v.playsInline = true;
    v.setAttribute("aria-label", `Filme da suíte ${s.name}`);
    stage.appendChild(v);
  } else {
    stage.appendChild(makeImg(it.src, `${s.name} — ${it.label}`, 1200, true));
  }
  $("#lightboxCounter").textContent = `${galleryIndex+1} / ${galleryItems.length}`;
  $("#lightboxCaption").textContent = `${s.name} · ${it.label}`;
}
function swipe(el, cb, threshold=44){
  let sx = null;
  el.addEventListener("touchstart", e => { sx = e.touches[0].clientX; }, { passive:true });
  el.addEventListener("touchend", e => {
    if(sx == null) return;
    const dx = e.changedTouches[0].clientX - sx;
    if(Math.abs(dx) > threshold) cb(dx < 0 ? 1 : -1);
    sx = null;
  }, { passive:true });
}

/* ------------------------------------------------------------
   EXPERIÊNCIA — LISTA + DIORAMA (parallax por cursor)
------------------------------------------------------------ */
/* Ícones de linha das comodidades: traço fino em vermelho, desenhado quando o
   cartão vem para a frente (.d, com atraso em --d) e com um movimento contínuo
   e discreto (.lp-*, atraso em --l). Grade de 120 × 120. */
const icPath = (d, delay = 0, cls = "") => `<path class="d${cls ? " " + cls : ""}" d="${d}" pathLength="1" style="--d:${delay}s"/>`;
const icCircle = (cx, cy, r) => `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`;
const icEllipse = (cx, cy, rx, ry) => `M${cx - rx} ${cy}a${rx} ${ry} 0 1 0 ${2 * rx} 0a${rx} ${ry} 0 1 0 ${-2 * rx} 0`;
const icSpark = (x, y, s) => `M${x} ${y - s}Q${x} ${y} ${x + s} ${y}Q${x} ${y} ${x} ${y + s}Q${x} ${y} ${x - s} ${y}Q${x} ${y} ${x} ${y - s}Z`;
const icWave = (y, from = 0, to = 144) => { let d = `M${from} ${y}q6 -4 12 0`; for(let x = from + 12; x < to; x += 12) d += "t12 0"; return d; };
const icLoop = (cls, inner, l = 0) => `<g class="lp ${cls}" style="--l:${l}s">${inner}</g>`;
/* floco de neve: três hastes e um galho em "v" em cada ponta */
const icFlake = (x, y, r) => {
  let d = "";
  for(let k = 0; k < 6; k++){
    const a = k * Math.PI / 3, c = Math.cos(a), s = Math.sin(a), f = n => n.toFixed(1);
    if(k < 3) d += `M${f(x - c * r)} ${f(y - s * r)}L${f(x + c * r)} ${f(y + s * r)}`;
    const m = r * .5, w = r * .22, t = r * .78;   /* "v" aberto para fora, como um galho */
    d += `M${f(x + c * t - s * w)} ${f(y + s * t + c * w)}L${f(x + c * m)} ${f(y + s * m)}L${f(x + c * t + s * w)} ${f(y + s * t - c * w)}`;
  }
  return d;
};
const EXP_ICONS = {
  /* banheira: a água ondula e as bolhas sobem */
  hidro: () => `
    <defs><clipPath id="ic-hidro-w"><path d="M21 63H99V72Q99 88 80 88H40Q21 88 21 72Z"/></clipPath></defs>
    ${icPath("M12 62H108")}
    ${icPath("M20 62V72Q20 90 40 90H80Q100 90 100 72V62", .15)}
    ${icPath("M36 90L32 99M84 90L88 99", .45)}
    ${icPath("M94 62V34Q94 26 86 26H80V31", .3)}
    <g clip-path="url(#ic-hidro-w)">${icLoop("lp-wave", icPath(icWave(72), .6, "soft"))}</g>
    ${icLoop("lp-rise", icPath(icCircle(44, 56, 2.2), .8, "soft"), 0)}
    ${icLoop("lp-rise", icPath(icCircle(58, 58, 3), .85, "soft"), .7)}
    ${icLoop("lp-rise", icPath(icCircle(70, 55, 1.8), .9, "soft"), 1.4)}
    ${icLoop("lp-rise", icPath(icCircle(82, 57, 2.6), .95, "soft"), 2.1)}`,
  /* o teto se abre para a lua e as estrelas */
  teto: () => `
    ${icLoop("lp-twinkle", icPath(icSpark(32, 16, 3.2), .9, "soft"), 0)}
    ${icLoop("lp-twinkle", icPath(icSpark(88, 10, 2.6), 1, "soft"), .8)}
    ${icLoop("lp-twinkle", icPath(icSpark(76, 26, 2), 1.05, "soft"), 1.6)}
    ${icPath("M64 9.9A9 9 0 1 0 64 26.1A10 10 0 0 1 64 9.9Z", .7)}
    ${icPath("M8 36H112M8 48H112")}
    ${icLoop("lp-slide-l", icPath("M24 37.5H58V46.5H24Z", .3))}
    ${icLoop("lp-slide-r", icPath("M62 37.5H96V46.5H62Z", .35))}
    ${icPath("M16 48V104M104 48V104M8 104H112", .2)}
    ${icPath("M32 104V88H88V104M32 93H88", .5)}
    ${icPath("M38 88V83H55V88M65 88V83H82V88", .6, "soft")}
    ${icLoop("lp-glow", `<path class="soft dash" d="M60 50L44 82M60 50L76 82M60 50V82"/>`)}`,
  /* globo espelhado girando, luzes piscando em volta */
  boate: () => {
    const rays = [0, 1, 2, 3, 4, 5, 6, 7].map(k => {
      const a = (k * 45 + 22.5) * Math.PI / 180, c = Math.cos(a), s = Math.sin(a);
      return icLoop("lp-pulse", icPath(`M${(60 + c * 27).toFixed(1)} ${(50 + s * 27).toFixed(1)}L${(60 + c * 35).toFixed(1)} ${(50 + s * 35).toFixed(1)}`, .6 + k * .05, "soft"), k * .2);
    }).join("");
    let lines = "";
    for(let x = 24; x <= 104; x += 8) lines += `M${x} 28V72`;
    return `
    <defs><clipPath id="ic-boate-b"><path d="${icCircle(60, 50, 20)}"/></clipPath></defs>
    ${icPath("M60 6V30")}
    ${icPath(icCircle(60, 50, 20), .15)}
    <g clip-path="url(#ic-boate-b)">
      ${icPath("M40 41H80M40 50H80M40 59H80", .45, "soft")}
      ${icLoop("lp-scroll", `<path class="soft" d="${lines}"/>`)}
    </g>
    ${rays}
    ${icLoop("lp-twinkle", icPath(icSpark(22, 22, 3), .9, "soft"), .3)}
    ${icLoop("lp-twinkle", icPath(icSpark(100, 28, 2.4), .95, "soft"), 1.1)}
    ${icLoop("lp-twinkle", icPath(icSpark(96, 92, 3), 1, "soft"), 1.8)}
    ${icLoop("lp-twinkle", icPath(icSpark(24, 86, 2.2), 1.05, "soft"), .7)}
    ${icPath("M30 104H90", .5, "soft")}`;
  },
  /* aparelho split soprando ar frio */
  ar: () => `
    ${icPath("M16 22H104Q110 22 110 28V42Q110 48 104 48H16Q10 48 10 42V28Q10 22 16 22Z")}
    ${icPath("M18 42H102", .3, "soft")}
    ${icPath("M88 30H98", .4)}
    ${icPath(icCircle(82, 30, 1.4), .45)}
    ${icLoop("lp-flow", `<path class="soft flow" d="M34 56q-7 9 0 18t0 18"/>`)}
    ${icLoop("lp-flow", `<path class="soft flow" d="M52 56q-7 9 0 18t0 18t0 12"/>`, .3)}
    ${icLoop("lp-flow", `<path class="soft flow" d="M70 56q-7 9 0 18t0 18"/>`, .6)}
    ${icLoop("lp-spin", icPath(icFlake(92, 86, 11), .7))}`,
  /* tela com o "play" pulsando e uma onda correndo */
  tv: () => `
    <defs><clipPath id="ic-tv-s"><path d="M17 27H103V81H17Z"/></clipPath></defs>
    ${icPath("M18 24H102Q106 24 106 28V80Q106 84 102 84H18Q14 84 14 80V28Q14 24 18 24Z")}
    ${icPath("M52 84L46 96M68 84L74 96M34 96H86", .3)}
    ${icLoop("lp-play", icPath("M53 40L71 51L53 62Z", .5))}
    <g clip-path="url(#ic-tv-s)">${icLoop("lp-wave", icPath(icWave(74), .7, "soft"))}</g>
    ${icLoop("lp-twinkle", icPath(icSpark(96, 34, 2.2), .9, "soft"), .5)}`,
  /* frigobar gelando: floco girando e friozinho saindo */
  frigobar: () => `
    ${icPath("M42 24H78Q82 24 82 28V94Q82 98 78 98H42Q38 98 38 94V28Q38 24 42 24Z")}
    ${icPath("M38 46H82", .25)}
    ${icPath("M75 31V40M75 54V68", .4)}
    ${icPath("M45 98V103M75 98V103", .5)}
    ${icLoop("lp-spin", icPath(icFlake(56, 35, 6.5), .6, "soft"))}
    ${icLoop("lp-mist", icPath("M90 66q4 4 0 8t0 8", .8, "soft"), 0)}
    ${icLoop("lp-mist", icPath("M97 58q4 4 0 8t0 8", .85, "soft"), 1.2)}
    ${icLoop("lp-twinkle", icPath(icSpark(94, 24, 2.4), .9, "soft"), .4)}`,
  /* porta fechada com o aviso de "não perturbe" balançando na maçaneta */
  privacidade: () => `
    ${icPath("M34 108V14H86V108")}
    ${icPath("M22 108H98", .1)}
    ${icPath("M40 22H72V54H40ZM40 62H72V100H40Z", .3, "soft")}
    ${icPath(icCircle(79, 60, 2.4), .5)}
    <g class="lp lp-swing">
      ${icPath("M79 62.5L72 72M79 62.5L86 72", .6)}
      ${icPath("M68 72H90V98Q90 100 88 100H70Q68 100 68 98Z", .7)}
      ${icPath("M81 81.4A5 5 0 1 0 81 90.6A5.6 5.6 0 0 1 81 81.4Z", .9, "soft")}
    </g>`,
  /* globo girando com um alfinete marcando o destino */
  temas: () => `
    ${icPath(icCircle(60, 56, 32))}
    ${icPath(icEllipse(60, 56, 32, 8), .3, "soft")}
    ${icPath("M32.3 40H87.7M32.3 72H87.7", .4, "soft")}
    ${icPath("M60 24V88", .35, "soft")}
    ${icLoop("lp-meridian", icPath(icEllipse(60, 56, 32, 32), .5, "soft"), 0)}
    ${icLoop("lp-meridian", icPath(icEllipse(60, 56, 32, 32), .55, "soft"), -3)}
    ${icPath("M24 56A36 36 0 0 0 81.2 85.1", .6)}
    ${icPath("M60 92V102M46 104H74", .7)}
    ${icLoop("lp-bounce", icPath("M86 18a6 6 0 0 1 12 0c0 6 -6 12 -6 12s-6 -6 -6 -12Z", .8) + icPath(icCircle(92, 18, 1.8), .9))}`
};

/* Cena 3D: um "baralho" de cartões em perspectiva, cada um com o ícone da
   comodidade — o da comodidade ativa vem para a frente e se desenha; os
   próximos recuam em profundidade. */
const expState = { active: 0, hoverLock: 0 };
function renderExperience(){
  const list = $("#expList"), deck = $("#expDeck"), stage = $("#expStage");
  list.innerHTML = experiences.map((x, i) => `
    <li data-index="${i}"><span>${pad2(i+1)}</span><div><h3>${x.t}</h3><p>${x.d}</p></div></li>`).join("");
  experiences.forEach((x, i) => {
    const card = document.createElement("div");
    card.className = "exp-card";
    card.dataset.index = i;
    card.innerHTML = `
      <span class="exp-card-art"><svg class="exp-icon" viewBox="0 0 120 120" aria-hidden="true" focusable="false">${EXP_ICONS[x.icon]?.() || ""}</svg></span>
      <span class="exp-card-meta"><small>${pad2(i+1)}</small><b>${x.t}</b></span>`;
    deck.appendChild(card);
  });
  setExpActive(0);

  /* hover / foco na lista (desktop) */
  const items = $$("#expList li");
  items.forEach(li => {
    li.addEventListener("mouseenter", () => { expState.hoverLock = Date.now(); setExpActive(+li.dataset.index); });
    li.addEventListener("click", () => setExpActive(+li.dataset.index));
  });
  /* scroll-spy: o item mais próximo do centro da tela define a cena (mobile e teclado) */
  const spy = new IntersectionObserver(entries => {
    if(Date.now() - expState.hoverLock < 800) return;
    const hit = entries.filter(e => e.isIntersecting).sort((a,b) => b.intersectionRatio - a.intersectionRatio)[0];
    if(hit) setExpActive(+hit.target.dataset.index);
  }, { rootMargin: "-42% 0px -42% 0px", threshold: [0, .5, 1] });
  items.forEach(li => spy.observe(li));

  /* leve inclinação seguindo o cursor (apenas pointer fino) */
  if(prefersReduced.matches || !finePointer.matches) return;
  let raf = null;
  stage.addEventListener("mousemove", e => {
    if(raf) return;
    raf = requestAnimationFrame(() => {
      raf = null;
      const r = stage.getBoundingClientRect();
      const x = (e.clientX - r.left)/r.width - .5, y = (e.clientY - r.top)/r.height - .5;
      deck.style.setProperty("--ry", (x*8).toFixed(2) + "deg");
      deck.style.setProperty("--rx", (-y*5).toFixed(2) + "deg");
    });
  });
  stage.addEventListener("mouseleave", () => { deck.style.setProperty("--ry","0deg"); deck.style.setProperty("--rx","0deg"); });
}
function setExpActive(i){
  if(i === expState.active && $("#expDeck .exp-card.is-active")) return;
  expState.active = i;
  const n = experiences.length;
  $$("#expDeck .exp-card").forEach(card => {
    const k = +card.dataset.index;
    const off = (k - i + n) % n;           /* 0 = ativa, 1..2 = atrás, resto = fora */
    card.classList.toggle("is-active", off === 0);
    card.dataset.off = off <= 2 ? off : "x";
    card.style.zIndex = off === 0 ? 10 : (off <= 2 ? 10 - off : 0);
  });
  $$("#expList li").forEach(li => li.classList.toggle("is-active", +li.dataset.index === i));
  $("#expCount").textContent = `${pad2(i+1)} / ${pad2(n)}`;
}
function initParallax(){
  if(prefersReduced.matches || !finePointer.matches) return;
  $$("[data-parallax]").forEach(stage => {
    const layers = $$("[data-depth]", stage);
    let raf = null;
    stage.addEventListener("mousemove", e => {
      if(raf) return;
      raf = requestAnimationFrame(() => {
        raf = null;
        const r = stage.getBoundingClientRect();
        const x = (e.clientX - r.left)/r.width - .5, y = (e.clientY - r.top)/r.height - .5;
        layers.forEach(l => {
          const d = parseFloat(l.dataset.depth || 0) * 100;
          l.style.transform = `translate3d(${(-x*d).toFixed(1)}px, ${(-y*d*.7).toFixed(1)}px, 0)`;
        });
      });
    });
    stage.addEventListener("mouseleave", () => layers.forEach(l => l.style.transform = ""));
  });
}

/* ------------------------------------------------------------
   CARDÁPIO — LIVRO 3D
   Páginas: capa, "Bem-servidos", sumário, as páginas de data.js (MB.menu)
   e a contracapa. Desktop: folhas de duas faces giram sobre a lombada — a
   folha levanta, gira e assenta, e a luz acompanha o giro. Fechado, o livro
   fica centrado; aberto, mostra de cada lado a espessura das páginas que
   restam. O canto da página se ergue sob o cursor. Celular: uma página por
   vez, com a mesma virada em 3D. A tipografia das páginas é proporcional ao
   tamanho da página (unidades cqi), como um impresso em escala.
------------------------------------------------------------ */
const bookPages = [];
const tocEntries = [];   /* { chapter, title, page } — sumário, atalhos e capítulos */
const FLIP_MS = 900, Z_STEP = .7;
const isSinglePage = () => window.matchMedia("(max-width: 768px)").matches;

/* título de uma página no sumário: as seções dela; numa página que só divide
   o capítulo em grupos ("Frigobar", "Diversos"), vale o nome dos grupos */
function pageTitle(p){
  const first = p.sections[0];
  if(p.sections.length === 1 && first.title === p.chapter && first.groups && !first.items) return first.groups.map(g => g.title).join(" · ");
  return p.sections.map(sec => sec.title).join(" · ");
}
function buildBookPages(){
  bookPages.push({ type:"cover" }, { type:"intro" }, { type:"toc" });
  menuPages.forEach(p => {
    const prev = bookPages[bookPages.length - 1];
    const cont = prev.type === "menu" && prev.sections[prev.sections.length - 1].title === p.sections[0].title;
    bookPages.push({ type:"menu", ...p, cont });
    const title = pageTitle(p), last = tocEntries[tocEntries.length - 1];
    if(!last || last.title !== title) tocEntries.push({ chapter: p.chapter, title, page: bookPages.length - 1 });
  });
  if(bookPages.length % 2 === 0) bookPages.push({ type:"blank" });   /* a contracapa cai sempre no verso da última folha */
  bookPages.push({ type:"back" });
}

const menuPrice = v => v == null ? "Consulte" : `<small>R$</small> ${v.toFixed(2).replace(".", ",")}`;
function menuItemHTML(it){
  return `<li class="mi">
    <span class="mi-row"><span class="mi-name">${it.name}${it.origin ? ` <em class="mi-origin">${it.origin}</em>` : ""}</span><span class="mi-dots" aria-hidden="true"></span><span class="mi-price">${menuPrice(it.price)}</span></span>${it.desc ? `
    <span class="mi-desc">${it.desc}</span>` : ""}${it.side ? `
    <span class="mi-side">${it.side}</span>` : ""}
  </li>`;
}
function sectionBodyHTML(sec){
  let html = "";
  if(sec.items) html += `<ul class="mi-list">${sec.items.map(menuItemHTML).join("")}</ul>`;
  (sec.groups || []).forEach(g => {
    html += `<div class="pg-group">${g.title ? `<h4>${g.title}</h4>` : ""}<ul class="mi-list${g.cols ? " cols-" + g.cols : ""}">${g.items.map(menuItemHTML).join("")}</ul></div>`;
  });
  if(sec.channels) html += `<ul class="ch-list">${sec.channels.map(([n, name, adult]) =>
    `<li${adult ? ' class="is-adult"' : ""}><b>${n}</b><span>${name}${adult ? " <i>+18</i>" : ""}</span></li>`).join("")}</ul>`;
  if(sec.note) html += `<p class="pg-note">${sec.note}</p>`;
  return html;
}
const ORNAMENT = `<span class="pg-orn" aria-hidden="true"><i>✦</i></span>`;
function pageHead(kicker, title, sub){
  return `<header class="pg-head">${kicker ? `<span class="pg-kicker">${kicker}</span>` : ""}${title ? `<h3 class="pg-title">${title}</h3>` : ""}${ORNAMENT}${sub ? `<p class="pg-sub">${sub}</p>` : ""}</header>`;
}
const pageFoot = num => `<footer class="pg-foot" aria-hidden="true"><span>Montblack</span><span>${pad2(num)}</span></footer>`;
function pageHTML(p, num){
  if(p.type === "cover") return `
    <div class="page-inner page-cover">
      <div class="cover-frame">
        <span class="cover-sub">Motel &bull; Ipatinga</span>
        <h3 class="cover-brand">MONT<b>BLACK</b></h3>
        <span class="cover-stars" aria-hidden="true">★ ★ ★ ★ ★</span>
        <span class="cover-title">Cardápio</span>
        <span class="cover-hint" aria-hidden="true">Abrir <span class="arrow">→</span></span>
      </div>
    </div>`;
  if(p.type === "back") return `
    <div class="page-inner page-cover page-back">
      <div class="cover-frame">
        <h3 class="cover-brand">MONT<b>BLACK</b></h3>
        <span class="cover-stars" aria-hidden="true">★ ★ ★ ★ ★</span>
        <p class="cover-addr">${motelConfig.addressLines[0]} · ${motelConfig.addressLines[1]}<br>${motelConfig.addressLines[2]}</p>
        <span class="cover-sub">Aberto 24 horas &bull; ${motelConfig.instagramHandle}</span>
      </div>
    </div>`;
  if(p.type === "blank") return `<div class="page-inner page-blank">${ORNAMENT}${pageFoot(num)}</div>`;
  if(p.type === "intro") return `
    <div class="page-inner" data-fit>
      ${pageHead("Cardápio Montblack", "Bem-servidos")}
      <p class="pg-lead">Pratos do chef, porções, lanches e bebidas geladas, preparados na hora e entregues com discrição, diretamente na sua suíte.</p>
      <div class="pg-group"><h4>Bom saber</h4><ul class="pg-info">${menuInfo.map(t => `<li>${t}</li>`).join("")}</ul></div>
      ${pageFoot(num)}
    </div>`;
  if(p.type === "toc"){
    const chapters = [...new Set(tocEntries.map(e => e.chapter))];
    /* atalhos só de mouse/toque: no teclado, os capítulos abaixo do livro fazem o mesmo */
    return `
    <div class="page-inner" data-fit>
      ${pageHead("Índice", "Sumário")}
      <div class="toc">${chapters.map(ch => `
        <div class="toc-ch"><h4>${ch}</h4><ul>${tocEntries.filter(e => e.chapter === ch).map(e => `
          <li><button type="button" class="toc-link" tabindex="-1" data-goto="${e.page}"><span>${e.title}</span><i aria-hidden="true"></i><b>${pad2(e.page)}</b></button></li>`).join("")}
        </ul></div>`).join("")}
      </div>
      ${pageFoot(num)}
    </div>`;
  }
  const [first, ...rest] = p.sections;
  const head = p.cont ? pageHead(`${first.title} · continuação`) : pageHead(p.chapter, first.title, first.sub);
  return `
    <div class="page-inner" data-fit>
      ${head}
      <section class="pg-sec">${sectionBodyHTML(first)}</section>${rest.map(sec => `
      <section class="pg-sec"><header class="pg-head is-sub"><h3 class="pg-title">${sec.title}</h3>${ORNAMENT}${sec.sub ? `<p class="pg-sub">${sec.sub}</p>` : ""}</header>${sectionBodyHTML(sec)}</section>`).join("")}
      ${pageFoot(num)}
    </div>`;
}

const isCoverPage = p => p.type === "cover" || p.type === "back";
const leafFace = (n, side) => `<div class="leaf-face ${side}${isCoverPage(bookPages[n]) ? " is-cover" : ""}">${pageHTML(bookPages[n], n)}<span class="leaf-shade" aria-hidden="true"></span></div>`;

/* página que não cabe (fonte grande do sistema, proporção diferente) encolhe até caber */
function fitBookPages(){
  $$("#book .page-inner[data-fit], .book-mobile .page-inner[data-fit]").forEach(inner => {
    if(!inner.clientHeight) return;
    let f = 1;
    inner.style.setProperty("--fit", "1");
    while(inner.scrollHeight > inner.clientHeight + 1 && f > .72){ f -= .03; inner.style.setProperty("--fit", f.toFixed(2)); }
  });
}

const bookState = { spread:0, page:0, leaves:[], mPages:[], leafCount:0 };
const poseCSS = (z, a) => `translateZ(${z.toFixed(2)}px) rotateY(${a}deg)`;
/* folhas viradas empilham à esquerda, as demais à direita; a de cima fica mais perto */
function leafPose(i, s){
  const L = bookState.leafCount, flipped = i < s;
  return { z: flipped ? (i + 1) * Z_STEP : (L - i) * Z_STEP, a: flipped ? -180 : 0, zi: flipped ? i + 1 : L - i };
}
/* espessura de cada lado: camadas de papel deslocadas para fora e para baixo */
function pageEdges(n, dir){
  if(!n) return "none";
  const layers = Math.max(2, Math.round(n / bookState.leafCount * 8)), out = [];
  for(let k = 1; k <= layers; k++) out.push(`${(dir * k * .5).toFixed(2)}px ${(k * .85).toFixed(2)}px 0 ${k === layers ? "#cfc2ad" : (k % 2 ? "#ebe2d3" : "#f9f4ea")}`);
  return out.join(",");
}
function layoutBook(animatedOnly){
  const book = $("#book"), s = bookState.spread, L = bookState.leafCount;
  book.dataset.state = s === 0 ? "closed" : (s === L ? "end" : "open");
  book.style.setProperty("--edge-l", pageEdges(s, -1));
  book.style.setProperty("--edge-r", pageEdges(L - s, 1));
  if(animatedOnly) return;
  bookState.leaves.forEach((leaf, i) => {
    const p = leafPose(i, s);
    leaf._anim?.cancel(); leaf._anim = null; leaf._peek = 0;
    leaf.classList.remove("is-peek");
    leaf.style.transform = poseCSS(p.z, p.a);
    leaf.style.zIndex = p.zi;
  });
}
function turnLeaf(i, forward, delay){
  const leaf = bookState.leaves[i], L = bookState.leafCount;
  leaf._anim?.finish();
  const from = leafPose(i, forward ? i : i + 1), to = leafPose(i, forward ? i + 1 : i);
  const a0 = from.a + (leaf._peek || 0);
  leaf._peek = 0;
  leaf.classList.remove("is-peek");
  leaf.style.transition = "none";            /* a transição do canto não pode disputar com a virada */
  leaf.style.transform = poseCSS(to.z, to.a);
  if(prefersReduced.matches){ leaf.style.zIndex = to.zi; leaf.style.transition = ""; return; }
  leaf.style.zIndex = L + 10;
  const lift = Math.max(from.z, to.z) + 26;
  leaf._anim = leaf.animate([
    { transform: poseCSS(from.z, a0) },
    { transform: poseCSS(lift, (a0 + to.a) / 2), offset: .5 },
    { transform: poseCSS(to.z, to.a) }
  ], { duration: FLIP_MS, delay, easing: "cubic-bezier(.45,.05,.2,1)", fill: "backwards" });
  /* luz: a face que se afasta escurece; a que chega sai da sombra */
  const [front, back] = leaf.querySelectorAll(".leaf-shade");
  (forward ? front : back).animate([{ opacity: 0 }, { opacity: .6 }], { duration: FLIP_MS / 2, delay, easing: "ease-in" });
  (forward ? back : front).animate([{ opacity: .6 }, { opacity: 0 }], { duration: FLIP_MS / 2, delay: delay + FLIP_MS / 2, easing: "ease-out", fill: "backwards" });
  const anim = leaf._anim;
  anim.onfinish = () => { if(leaf._anim !== anim) return; leaf.style.zIndex = to.zi; leaf.style.transition = ""; leaf._anim = null; };
}
/* o canto da página de cima se ergue do lado em que o cursor está */
function peekLeaf(side){
  if(pageDrag.on && pageDrag.moved) return;
  const s = bookState.spread, L = bookState.leafCount;
  const target = side === "next" && s < L ? s : (side === "prev" && s > 0 ? s - 1 : -1);
  bookState.leaves.forEach((leaf, i) => {
    if(leaf._anim) return;
    const want = i === target ? (side === "next" ? -14 : 14) : 0;
    if((leaf._peek || 0) === want) return;
    leaf._peek = want;
    const p = leafPose(i, s);
    leaf.style.transform = poseCSS(p.z + (want ? 3 : 0), p.a + want);
    leaf.classList.toggle("is-peek", want !== 0);
  });
}
function goSpread(target){
  const L = bookState.leafCount, s0 = bookState.spread;
  const s1 = Math.min(Math.max(target, 0), L);
  if(s1 === s0) return;
  const forward = s1 > s0, n = Math.abs(s1 - s0);
  const stagger = n > 1 ? Math.min(110, 700 / n) : 0;   /* saltos longos: as folhas caem em cascata */
  for(let k = 0; k < n; k++) turnLeaf(forward ? s0 + k : s0 - 1 - k, forward, k * stagger);
  bookState.spread = s1;
  layoutBook(true);
  updateBookStatus();
}
function goMobilePage(target){
  const pages = bookState.mPages, cur = bookState.page;
  const n = Math.min(Math.max(target, 0), pages.length - 1);
  if(n === cur) return;
  const forward = n > cur, from = pages[cur], to = pages[n];
  from.classList.remove("current");
  to.classList.add("current");
  bookState.page = n;
  updateBookStatus();
  if(prefersReduced.matches) return;
  /* avançando, a página atual gira e sai; voltando, a anterior gira e entra por cima */
  const turning = forward ? from : to, under = forward ? null : from;
  turning.classList.add("is-turning");
  under?.classList.add("is-under");
  const away = { transform: "rotateY(-100deg)", opacity: 0 }, flat = { transform: "rotateY(0deg)", opacity: 1 };
  const anim = turning.animate(forward ? [flat, away] : [away, flat], { duration: 720, easing: "cubic-bezier(.45,.05,.2,1)" });
  const done = () => { turning.classList.remove("is-turning"); under?.classList.remove("is-under"); };
  anim.onfinish = done; anim.oncancel = done;
}
function visibleBookPages(){
  if(isSinglePage()) return [bookState.page];
  const s = bookState.spread, L = bookState.leafCount;
  return s === 0 ? [0] : (s === L ? [bookPages.length - 1] : [s * 2 - 1, s * 2]);
}
function goBookPage(p){
  if(isSinglePage()) goMobilePage(p);
  else goSpread(Math.ceil(p / 2));
}
function turnBook(dir){
  if(isSinglePage()) goMobilePage(bookState.page + dir);
  else goSpread(bookState.spread + dir);
}
function updateBookStatus(){
  const total = bookPages.length, single = isSinglePage();
  const [a, b] = visibleBookPages();
  let text;
  if(a === 0) text = "Capa";
  else if(a === total - 1) text = "Contracapa";
  else text = b ? `Páginas ${a}–${b} de ${total - 2}` : `Página ${a} de ${total - 2}`;
  $("#bookStatus").textContent = text;
  $("#bookPrev").disabled = single ? bookState.page === 0 : bookState.spread === 0;
  $("#bookNext").disabled = single ? bookState.page === total - 1 : bookState.spread === bookState.leafCount;
  const here = visibleBookPages().map(p => bookPages[p].type === "toc" ? "Sumário" : bookPages[p].chapter);
  $$("#bookChapters .book-chip").forEach(c => c.setAttribute("aria-pressed", String(here.includes(c.dataset.chapter))));
  $("#bookProgress").style.setProperty("--p", (single ? bookState.page / (total - 1) : bookState.spread / bookState.leafCount).toFixed(3));
}

/* ------------------------------------------------------------
   ARRASTAR A PÁGINA — segurar a folha (mouse) ou a página (toque) e
   puxar para o lado. A borda da folha acompanha o ponteiro; ao soltar,
   passou da metade (ou foi um peteleco) → a página termina de virar;
   senão, volta para onde estava. Toque/clique sem arrastar continua
   virando pela metade clicada; rolagem vertical segue livre.
------------------------------------------------------------ */
const pageDrag = { on:false, moved:false, id:0, x0:0, y0:0, suppress:false };
const DRAG_START = 8;      /* px até o gesto virar arraste */
const FLING = .0022;       /* progresso por ms que conta como peteleco */
/* depois de um arraste, o clique que o navegador dispara não pode virar mais uma página */
function swallowClick(){ pageDrag.suppress = true; setTimeout(() => { pageDrag.suppress = false; }, 0); }
/* velocidade na hora de soltar: se o ponteiro ficou parado antes, não é peteleco */
const releaseSpeed = d => performance.now() - d.t > 90 ? 0 : d.v;
function trackProgress(d, p){
  const now = performance.now(), dt = Math.max(1, now - d.t);
  d.v = d.v * .6 + ((p - d.p) / dt) * .4;   /* velocidade suavizada, para o peteleco */
  d.p = p; d.t = now;
}

/* desktop: a folha gira sobre a lombada; a borda segue o ponteiro (cos φ = distância à lombada ÷ ponto agarrado) */
function grabLeafPose(d, x){
  const c = Math.max(-1, Math.min(1, d.dir * (x - d.spine) / d.g));
  const phi = Math.acos(c) * 180 / Math.PI;                 /* 0 = onde agarrou … 180 = virada */
  const leaf = bookState.leaves[d.leaf], base = leafPose(d.leaf, bookState.spread);
  d.a = d.dir === 1 ? -phi : -180 + phi;
  leaf.style.transform = poseCSS(base.z + Math.sin(phi * Math.PI / 180) * 26, d.a);
  const [front, back] = leaf.querySelectorAll(".leaf-shade"), turn = Math.abs(d.a);
  front.style.opacity = turn < 90 ? (turn / 90 * .55).toFixed(3) : 0;
  back.style.opacity = turn > 90 ? ((180 - turn) / 90 * .55).toFixed(3) : 0;
  trackProgress(d, phi / 180);
}
function releaseLeaf(d){
  const i = d.leaf, leaf = bookState.leaves[i], L = bookState.leafCount;
  const v = releaseSpeed(d), done = v > FLING || (v > -FLING && d.p > .5);
  const s0 = bookState.spread, s1 = done ? s0 + d.dir : s0;
  const to = leafPose(i, s1), from = d.a;
  const shades = leaf.querySelectorAll(".leaf-shade");
  const finish = () => {
    leaf.style.transform = poseCSS(to.z, to.a);
    leaf.style.zIndex = to.zi;
    leaf.style.transition = "";
    shades.forEach(sh => { sh.style.opacity = ""; });
    leaf._anim = null;
  };
  if(done){ bookState.spread = s1; layoutBook(true); updateBookStatus(); }
  leaf.style.zIndex = L + 10;
  const ms = prefersReduced.matches ? 0 : 140 + 520 * Math.abs(to.a - from) / 180;
  if(!ms){ finish(); return; }
  leaf.style.transform = poseCSS(to.z, to.a);
  leaf._anim = leaf.animate([{ transform: poseCSS(to.z + 14, from) }, { transform: poseCSS(to.z, to.a) }], { duration: ms, easing: "cubic-bezier(.2,.7,.2,1)" });
  shades.forEach(sh => sh.animate([{ opacity: getComputedStyle(sh).opacity }, { opacity: 0 }], { duration: ms, easing: "ease-out" }));
  shades.forEach(sh => { sh.style.opacity = ""; });
  leaf._anim.onfinish = finish;
}

/* celular: a página atual gira sobre a margem esquerda (avançar) ou a anterior volta por cima (voltar) */
function grabPagePose(d, x){
  if(d.dir === 1){
    const c = Math.max(-1, Math.min(1, (x - d.left) / Math.max(40, d.gx - d.left)));
    d.a = Math.max(-100, -Math.acos(c) * 180 / Math.PI);
    trackProgress(d, -d.a / 100);
  } else {
    const p = Math.max(0, Math.min(1, (x - d.gx) / (d.w * .75)));
    d.a = -100 * (1 - p);
    trackProgress(d, p);
  }
  d.turning.style.transform = `rotateY(${d.a.toFixed(2)}deg)`;
  d.turning.style.opacity = Math.max(0, Math.min(1, (100 + d.a) / 40)).toFixed(3);
}
function releasePage(d){
  const v = releaseSpeed(d), done = v > FLING || (v > -FLING && d.p > .4);
  const pages = bookState.mPages, cur = bookState.page;
  const flat = { transform: "rotateY(0deg)", opacity: 1 }, away = { transform: "rotateY(-100deg)", opacity: 0 };
  /* avançando, o fim é a folha ida; voltando, é a folha anterior assentada */
  const end = (d.dir === 1) === done ? away : flat;
  const from = { transform: d.turning.style.transform, opacity: +d.turning.style.opacity };
  const cleanup = () => {
    d.turning.style.transform = ""; d.turning.style.opacity = "";
    d.turning.classList.remove("is-turning");
    d.under.classList.remove("is-under");
  };
  if(done){
    const n = cur + d.dir;
    pages[cur].classList.remove("current");
    pages[n].classList.add("current");
    bookState.page = n;
    updateBookStatus();
  }
  if(prefersReduced.matches){ cleanup(); return; }
  const progress = done ? 1 - d.p : d.p;
  const anim = d.turning.animate([from, end], { duration: 140 + 420 * progress, easing: "cubic-bezier(.2,.7,.2,1)" });
  d.turning.style.transform = end.transform; d.turning.style.opacity = end.opacity;
  anim.onfinish = anim.oncancel = cleanup;
}

function initPageDrag(book, mobile){
  const down = el => e => {
    if(e.button !== 0 || e.target.closest("[data-goto]")) return;
    if((el === book) === isSinglePage()) return;
    Object.assign(pageDrag, { on:true, moved:false, id:e.pointerId, x0:e.clientX, y0:e.clientY, el });
  };
  const move = e => {
    const d = pageDrag;
    if(!d.on || d.id !== e.pointerId) return;
    if(!d.moved){
      const dx = e.clientX - d.x0, dy = e.clientY - d.y0;
      if(Math.abs(dx) < DRAG_START) return;
      if(Math.abs(dy) > Math.abs(dx)){ d.on = false; return; }   /* gesto vertical: é rolagem */
      if(!startDrag(d, dx)){ d.on = false; return; }
      d.moved = true;
      d.el.setPointerCapture(e.pointerId);
      d.el.classList.add("is-grabbing");
    }
    if(d.leaf != null) grabLeafPose(d, e.clientX);
    else grabPagePose(d, e.clientX);
  };
  const up = e => {
    const d = pageDrag;
    if(!d.on || d.id !== e.pointerId) return;
    d.on = false;
    if(!d.moved) return;   /* sem arraste: o clique vira pela metade */
    d.el.classList.remove("is-grabbing");
    swallowClick();
    if(d.leaf != null) releaseLeaf(d); else releasePage(d);
  };
  /* decide o que vai ser arrastado; false = não há página para esse lado */
  const startDrag = (d, dx) => {
    d.v = 0; d.p = 0; d.t = performance.now(); d.leaf = null;
    if(d.el === book){
      const r = book.getBoundingClientRect(), s = bookState.spread, L = bookState.leafCount;
      d.spine = r.left + r.width / 2;
      d.dir = d.x0 > d.spine ? 1 : -1;                        /* folha da direita avança; da esquerda volta */
      const i = d.dir === 1 ? s : s - 1;
      if(i < 0 || i >= L) return false;
      const leaf = bookState.leaves[i];
      leaf._anim?.cancel(); leaf._anim = null;
      leaf._peek = 0; leaf.classList.remove("is-peek");
      leaf.style.transition = "none";
      leaf.style.zIndex = L + 10;
      d.leaf = i;
      d.g = Math.max(r.width * .15, Math.abs(d.x0 - d.spine));
      return true;
    }
    const pages = bookState.mPages, cur = bookState.page, r = mobile.getBoundingClientRect();
    d.dir = dx < 0 ? 1 : -1;
    const n = cur + d.dir;
    if(n < 0 || n >= pages.length) return false;
    /* uma virada em andamento é encerrada na hora (sem o callback dela, que limparia as classes desta) */
    pages.forEach(p => {
      p.getAnimations().forEach(a => { a.onfinish = a.oncancel = null; a.cancel(); });
      p.classList.remove("is-turning", "is-under");
      p.style.transform = ""; p.style.opacity = "";
    });
    d.left = r.left; d.w = r.width; d.gx = d.x0;
    d.turning = d.dir === 1 ? pages[cur] : pages[n];
    d.under = d.dir === 1 ? pages[n] : pages[cur];
    d.turning.classList.add("is-turning");
    d.under.classList.add("is-under");
    return true;
  };
  [book, mobile].forEach(el => {
    el.addEventListener("pointerdown", down(el));
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
  });
}

function initFlipbook(){
  buildBookPages();
  const book = $("#book"), scene = book.parentElement;
  const total = bookPages.length, L = bookState.leafCount = total / 2;

  book.innerHTML = `
    <span class="book-board l" aria-hidden="true"></span><span class="book-board r" aria-hidden="true"></span>
    <span class="book-block l" aria-hidden="true"></span><span class="book-block r" aria-hidden="true"></span>`;
  for(let i = 0; i < L; i++){
    const leaf = document.createElement("div");
    leaf.className = "leaf";
    leaf.innerHTML = leafFace(i*2, "front") + leafFace(i*2+1, "back");
    book.appendChild(leaf);
    bookState.leaves.push(leaf);
  }
  layoutBook();

  const mobile = document.createElement("div");
  mobile.className = "book-mobile";
  mobile.dataset.cursor = "Virar";
  mobile.setAttribute("aria-label", "Cardápio — uma página por vez");
  bookPages.forEach((p, i) => {
    const pg = document.createElement("div");
    pg.className = "m-page" + (isCoverPage(p) ? " is-cover" : "") + (i === 0 ? " current" : "");
    pg.innerHTML = pageHTML(p, i);
    mobile.appendChild(pg);
    bookState.mPages.push(pg);
  });
  scene.after(mobile);

  /* capítulos: atalhos abaixo do livro */
  const chapters = [{ chapter:"Sumário", page:2 }, ...tocEntries.filter((e, i, all) => all.findIndex(x => x.chapter === e.chapter) === i)];
  $("#bookChapters").innerHTML = chapters.map(c =>
    `<button type="button" class="book-chip" data-chapter="${c.chapter}" data-goto="${c.page}" aria-pressed="false">${c.chapter}</button>`).join("");

  $("#bookPrev").addEventListener("click", () => turnBook(-1));
  $("#bookNext").addEventListener("click", () => turnBook(1));
  $("#bookChapters").addEventListener("click", e => { const c = e.target.closest("[data-goto]"); if(c) goBookPage(+c.dataset.goto); });
  const onBookClick = el => e => {
    if(pageDrag.suppress) return;   /* foi arraste, não clique */
    const go = e.target.closest("[data-goto]");
    if(go){ goBookPage(+go.dataset.goto); return; }
    const r = el.getBoundingClientRect();
    turnBook(e.clientX - r.left > r.width / 2 ? 1 : -1);
  };
  book.addEventListener("click", onBookClick(book));
  mobile.addEventListener("click", onBookClick(mobile));
  book.tabIndex = 0;
  book.setAttribute("role", "group");
  book.addEventListener("keydown", e => {
    if(e.key === "ArrowRight"){ e.preventDefault(); turnBook(1); }
    if(e.key === "ArrowLeft"){ e.preventDefault(); turnBook(-1); }
  });
  initPageDrag(book, mobile);   /* segurar e arrastar a página para o lado (substitui o swipe) */

  /* inclinação seguindo o cursor + canto da página (apenas pointer fino) */
  if(finePointer.matches && !prefersReduced.matches){
    let raf = null, ev = null;
    scene.addEventListener("mousemove", e => {
      ev = e;
      if(raf) return;
      raf = requestAnimationFrame(() => {
        raf = null;
        const r = scene.getBoundingClientRect(), b = book.getBoundingClientRect();
        const x = (ev.clientX - r.left) / r.width - .5, y = (ev.clientY - r.top) / r.height - .5;
        book.style.setProperty("--ry", (x * 7).toFixed(2) + "deg");
        book.style.setProperty("--rx", (-y * 4).toFixed(2) + "deg");
        const inside = ev.clientX > b.left && ev.clientX < b.right && ev.clientY > b.top && ev.clientY < b.bottom;
        peekLeaf(inside ? (ev.clientX - b.left > b.width / 2 ? "next" : "prev") : null);
      });
    });
    scene.addEventListener("mouseleave", () => {
      book.style.setProperty("--ry", "0deg"); book.style.setProperty("--rx", "0deg");
      peekLeaf(null);
    });
  }

  /* trocar de modo (girar o celular, redimensionar) mantém a página em que se estava */
  window.matchMedia("(max-width: 768px)").addEventListener("change", e => {
    if(e.matches){
      const s = bookState.spread;
      const p = s === 0 ? 0 : (s === L ? total - 1 : s * 2 - 1);
      bookState.mPages.forEach((pg, i) => pg.classList.toggle("current", i === p));
      bookState.page = p;
    } else {
      bookState.spread = Math.ceil(bookState.page / 2);
      layoutBook();
    }
    updateBookStatus();
  });
  let fitTimer = null;
  window.addEventListener("resize", () => { clearTimeout(fitTimer); fitTimer = setTimeout(fitBookPages, 160); }, { passive:true });
  document.fonts?.ready.then(fitBookPages);
  updateBookStatus();

  /* alternativa acessível em lista: as seções com o mesmo título se juntam */
  const blocks = [];
  menuPages.forEach(p => p.sections.forEach(sec => {
    const last = blocks[blocks.length - 1];
    if(last && last.title === sec.title) last.html += sectionBodyHTML(sec);
    else blocks.push({ title: sec.title, sub: sec.sub, html: sectionBodyHTML(sec) });
  }));
  const plain = $("#menuListPlain"), toggle = $("#menuListToggle");
  plain.innerHTML = blocks.map(b => `<h3>${b.title}</h3>${b.sub ? `<p class="pg-sub">${b.sub}</p>` : ""}${b.html}`).join("")
    + `<h3>Bom saber</h3><ul class="pg-info">${menuInfo.map(t => `<li>${t}</li>`).join("")}</ul>`;
  toggle.addEventListener("click", () => {
    const open = plain.classList.toggle("visible");
    toggle.setAttribute("aria-expanded", String(open));
    toggle.textContent = open ? "Ocultar lista do cardápio" : "Prefere ler como lista? Ver cardápio completo";
  });
}

/* ------------------------------------------------------------
   OVERLAYS — infraestrutura comum (lightbox + disponibilidade)
------------------------------------------------------------ */
const overlayStack = [];
function openOverlay(overlay, focusEl){
  overlay._lastFocus = overlay._lastFocus || document.activeElement;
  overlay.classList.add("open");
  overlay.setAttribute("aria-hidden","false");
  overlayStack.push(overlay);
  lockScroll(true);
  window.dispatchEvent(new Event("scroll"));
  (focusEl || overlay.querySelector(".overlay-close, .lightbox-close"))?.focus();
}
function closeOverlay(overlay){
  overlay.classList.remove("open");
  overlay.setAttribute("aria-hidden","true");
  $$("video", overlay).forEach(v => v.remove());
  const i = overlayStack.indexOf(overlay);
  if(i > -1) overlayStack.splice(i, 1);
  if(overlayStack.length === 0) lockScroll(false);
  window.dispatchEvent(new Event("scroll"));
  overlay._lastFocus?.focus?.();
  overlay._lastFocus = null;
}
function initOverlays(){
  document.addEventListener("keydown", e => {
    if(e.key === "Escape" && overlayStack.length){ closeOverlay(overlayStack[overlayStack.length-1]); }
    if(e.key === "Tab" && overlayStack.length){
      const top = overlayStack[overlayStack.length-1];
      const focusables = $$("button, [href], select, input, video[controls], [tabindex]:not([tabindex='-1'])", top).filter(el => !el.hidden && el.offsetParent !== null);
      if(!focusables.length) return;
      const first = focusables[0], last = focusables[focusables.length-1];
      if(e.shiftKey && document.activeElement === first){ e.preventDefault(); last.focus(); }
      else if(!e.shiftKey && document.activeElement === last){ e.preventDefault(); first.focus(); }
    }
  });
  $$(".overlay").forEach(ov => ov.addEventListener("click", e => { if(e.target.closest("[data-close-overlay]")) closeOverlay(ov); }));
  /* qualquer botão [data-open-availability], inclusive renderizado depois */
  document.addEventListener("click", e => {
    const b = e.target.closest("[data-open-availability]");
    if(b){ e.preventDefault(); openAvailability(); }
  });
}

/* ------------------------------------------------------------
   CONSULTA DE DISPONIBILIDADE
------------------------------------------------------------ */
const availState = { category:"vip", suiteId: suites[0].id, period:null };
function periodOptions(catId){
  const p = categories[catId].prices, opts = [];
  if(p.oneHour != null) opts.push({ id:"1h", label:"1 hora", price:p.oneHour });
  opts.push({ id:"2h", label:"2 horas", price:p.twoHours });
  opts.push({ id:"pernoite", label:"Pernoite", price:p.overnight });
  return opts;
}
function openAvailability(preSuite){
  if(preSuite){ availState.category = preSuite.category; availState.suiteId = preSuite.id; }
  availState.period = null;
  paintAvailability();
  openOverlay($("#availOverlay"));
}
function paintAvailability(){
  const catRow = $("#availCatRow");
  catRow.innerHTML = "";
  Object.values(categories).forEach(cat => {
    const b = document.createElement("button");
    b.className = "chip"; b.textContent = cat.label;
    b.setAttribute("aria-pressed", String(availState.category === cat.id));
    b.addEventListener("click", () => {
      availState.category = cat.id;
      availState.suiteId = suites.find(s => s.category === cat.id).id;
      availState.period = null;
      paintAvailability();
      $("#availCatRow [aria-pressed='true']")?.focus();
    });
    catRow.appendChild(b);
  });
  const sel = $("#availSuiteSelect");
  sel.innerHTML = suites.filter(s => s.category === availState.category)
    .map(s => `<option value="${s.id}" ${s.id === availState.suiteId ? "selected" : ""}>${s.number} · ${s.name}</option>`).join("");
  sel.onchange = () => { availState.suiteId = sel.value; paintSummary(); };

  const perRow = $("#availPeriodRow");
  perRow.innerHTML = "";
  periodOptions(availState.category).forEach(opt => {
    const b = document.createElement("button");
    b.className = "chip";
    b.textContent = `${opt.label} · ${fmtBRL(opt.price)}`;
    b.setAttribute("aria-pressed", String(availState.period === opt.id));
    b.addEventListener("click", () => {
      availState.period = availState.period === opt.id ? null : opt.id;
      paintAvailability();
      $$("#availPeriodRow .chip").find(c => c.textContent.startsWith(opt.label))?.focus();
    });
    perRow.appendChild(b);
  });
  paintSummary();
}
function paintSummary(){
  const s = suiteById(availState.suiteId);
  const per = periodOptions(availState.category).find(o => o.id === availState.period);
  let html = `Sua seleção: <b>Suíte ${s.number} · ${s.name}</b> (${s.categoryLabel})`;
  if(per){
    html += ` · <b>${per.label}</b> — ${fmtBRL(per.price)}`;
    if(per.id === "pernoite") html += `<br><small style="color:var(--muted)">Pernoite válido de ${lodgingInfo.overnight.days}, das ${lodgingInfo.overnight.period}.</small>`;
    else html += `<br><small style="color:var(--muted)">Hora adicional após 2 horas: ${fmtBRL(lodgingInfo.extraHour)}.</small>`;
  } else {
    html += `<br><small style="color:var(--muted)">Escolha um período para ver o valor correspondente.</small>`;
  }
  $("#availSummary").innerHTML = html;

  /* canal de contato: WhatsApp aparece assim que MB.config.whatsapp for preenchido */
  const hasWhats = Boolean(motelConfig.whatsapp && motelConfig.whatsapp.trim());
  $("#availOffline").hidden = hasWhats;
  const wBtn = $("#availWhatsBtn");
  wBtn.hidden = !hasWhats;
  if(hasWhats){
    let msg = `Olá! Gostaria de consultar a disponibilidade da Suíte ${s.number} (${s.name}).`;
    if(per) msg += ` Período desejado: ${per.label}.`;
    wBtn.href = `https://wa.me/${motelConfig.whatsapp.replace(/\D/g,"")}?text=${encodeURIComponent(msg)}`;
  }
}
function initContactStatus(){
  const hasWhats = Boolean(motelConfig.whatsapp && motelConfig.whatsapp.trim());
  const hasPhone = Boolean(motelConfig.phone && motelConfig.phone.trim());
  if(!hasWhats && !hasPhone) return;
  const parts = [];
  if(hasWhats) parts.push(`<a href="https://wa.me/${motelConfig.whatsapp.replace(/\D/g,"")}" target="_blank" rel="noopener noreferrer">WhatsApp</a>`);
  if(hasPhone) parts.push(`<a href="tel:${motelConfig.phone.replace(/\s/g,"")}">${motelConfig.phone}</a>`);
  $("#contactStatus").innerHTML = "Reservas e consultas: " + parts.join(" · ");
  $("#footerContactStatus").innerHTML = parts.join(" · ");
}

/* ------------------------------------------------------------
   LOCALIZAÇÃO
------------------------------------------------------------ */
function initLocation(){
  const q = encodeURIComponent(`${motelConfig.name}, ${motelConfig.address}`);
  $("#mapsLink").href = `https://www.google.com/maps/search/?api=1&query=${q}`;
  $("#wazeLink").href = `https://waze.com/ul?q=${q}&navigate=yes`;
  $("#mapIframe").src = `https://www.google.com/maps?q=${q}&output=embed`;
  const btn = $("#copyAddress"), fb = $("#copyFeedback");
  btn.addEventListener("click", async () => {
    const text = `${motelConfig.name} — ${motelConfig.address}`;
    try{
      await navigator.clipboard.writeText(text);
      fb.textContent = "Endereço copiado!";
    }catch(err){
      const ta = document.createElement("textarea");
      ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta); ta.select();
      try{ document.execCommand("copy"); fb.textContent = "Endereço copiado!"; }
      catch(e2){ fb.textContent = "Não foi possível copiar automaticamente."; }
      ta.remove();
    }
    setTimeout(() => { fb.textContent = ""; }, 2600);
  });
  $("#availLocLink").addEventListener("click", () => closeOverlay($("#availOverlay")));
}

/* ------------------------------------------------------------
   CTA FLUTUANTE / BARRA INFERIOR / VOLTAR AO TOPO
------------------------------------------------------------ */
function initFloating(){
  const float = $("#floatCta"), bar = $("#bottomBar"), top = $("#backTop");
  const onScroll = () => {
    const show = window.scrollY > window.innerHeight * .7;
    const modalOpen = overlayStack.length > 0 || $("#mobileMenu").classList.contains("open");
    float.classList.toggle("visible", show && !modalOpen);
    bar.classList.toggle("visible", show && !modalOpen);
    top.classList.toggle("visible", show && !modalOpen);
  };
  window.addEventListener("scroll", onScroll, { passive:true });
  onScroll();
  top.addEventListener("click", () => window.scrollTo({ top:0, behavior: prefersReduced.matches ? "auto" : "smooth" }));
}

/* ------------------------------------------------------------
   ENTRADAS NO SCROLL (o mesmo padrão do site da Liga ForDoctor)
   Cada bloco volta ao estado inicial quando sai inteiro da tela e toca de
   novo quando volta, rolando para baixo ou para cima. O que já está na tela
   no carregamento não é escondido; sem JS ou com "reduzir movimento", tudo
   fica no estado final. Estados: .armada (pronto para entrar) e .tocando.
     títulos (.h2 …)   cada linha sobe de dentro da própria máscara, 90 ms entre linhas
     [data-stagger]    os filhos sobem um após o outro, 70 ms entre eles (com teto)
     [data-mask]       a foto é descoberta de baixo para cima e assenta
     .reveal           sobe e aparece (reveal-d1…d3 atrasam)
     [data-stagger="each"]  listas longas: cada item entra sozinho ao chegar à tela
     #expStage         o desenho em destaque se traça de novo
------------------------------------------------------------ */
const REVEAL_STEPS = Array.from({ length: 21 }, (_, i) => i / 20);
const revealHandlers = new Map();
let revealIO = null, revealBatch = 0;
/* De baixo (rolando para baixo): entra quando uma parte razoável já está à vista.
   De cima (rolando para cima): entra no primeiro pixel e com o movimento invertido
   (desce em vez de subir; nas listas, o último item visível vem primeiro). */
function replay(el, op){
  if(!el || revealHandlers.has(el)) return;
  let state = "final", timer = 0;
  const arm = top => {
    clearTimeout(timer); state = "armed";
    el.classList.remove("tocando");
    el.classList.toggle("de-cima", top);   /* saiu por cima: vai voltar por cima */
    el.classList.add("armada");
  };
  const settle = () => { clearTimeout(timer); state = "final"; el.classList.remove("armada", "tocando", "de-cima"); };
  const play = top => {
    state = "playing";
    el.classList.toggle("de-cima", top);
    op.prep?.(el, top);
    el.classList.remove("armada");
    el.classList.add("tocando");
    timer = setTimeout(() => { if(state === "playing") settle(); }, op.ms);
  };
  revealHandlers.set(el, e => {
    const r = e.boundingClientRect;
    if(!e.isIntersecting){ if(state !== "armed") arm(r.bottom <= 0); return; }
    if(state !== "armed") return;
    if(r.top < 0){ play(true); return; }
    /* blocos altos não esperam uma fração deles: basta ~1/5 da tela ocupado */
    const need = Math.min(r.height * op.at, window.innerHeight * .2);
    if(e.intersectionRect.height >= need) play(false);
  });
  revealIO.observe(el);
}
/* títulos: o texto inteiro fica num trecho para leitores de tela; as linhas visuais
   (medidas na largura atual, com o <em> preservado) ficam ocultas para eles */
const escHTML = s => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
function splitTitle(el){
  if(!el._words){
    el._words = [];
    el.childNodes.forEach(n => {
      const em = n.nodeType === 1 && n.tagName === "EM";
      n.textContent.split(/\s+/).filter(Boolean).forEach(w => el._words.push({ w, em }));
    });
    el.innerHTML = `<span class="sr-only">${escHTML(el.textContent.replace(/\s+/g, " ").trim())}</span><span class="ttl-lines" aria-hidden="true"></span>`;
  }
  const box = el.querySelector(".ttl-lines");
  const word = x => x.em ? `<em>${escHTML(x.w)}</em>` : escHTML(x.w);
  box.innerHTML = el._words.map(x => `<span data-w>${word(x)}</span>`).join(" ");
  const lines = [];
  let top = null;
  box.querySelectorAll("[data-w]").forEach((s, i) => {
    const t = s.offsetTop;
    if(top === null || Math.abs(t - top) > 3){ lines.push([]); top = t; }
    lines[lines.length - 1].push(word(el._words[i]));
  });
  /* linhas seguidas em itálico viram um <em> só (sem o espaço reto entre palavras) */
  box.innerHTML = lines.map((l, i) => `<span class="ln-mask"><span class="ln" style="--i:${Math.min(i, 10)}">${l.join(" ").replace(/<\/em> <em>/g, " ")}</span></span>`).join("");
  box.style.setProperty("--n", Math.min(lines.length, 11));
  el._splitW = el.clientWidth;
  el.classList.add("is-split");
}
/* cascata entre os filhos à vista; os de fora entram já (vão estar prontos quando chegarem) */
function staggerPrep(box, top){
  const vh = window.innerHeight;
  const seen = [...box.children].filter(c => { const r = c.getBoundingClientRect(); return r.height && r.bottom > 0 && r.top < vh; });
  [...box.children].forEach(c => c.style.setProperty("--i", 0));
  (top ? seen.reverse() : seen).forEach((c, i) => c.style.setProperty("--i", Math.min(i, 8)));
}
function initScrollReveal(){
  if(prefersReduced.matches || !("IntersectionObserver" in window)) return;
  /* itens que entram juntos no mesmo quadro ganham atraso em cascata (listas longas, um item por vez) */
  revealIO = new IntersectionObserver(entries => {
    revealBatch = 0;
    entries.forEach(e => revealHandlers.get(e.target)?.(e));
  }, { threshold: REVEAL_STEPS });

  const titles = $$(".h2, .cta-band .h3, .ig-band .h3");
  titles.forEach(el => {
    el.classList.add("ttl");
    el.classList.remove("reveal");               /* o título tem a entrada própria, linha a linha */
    el.closest(".reveal")?.classList.add("has-ttl");   /* o bloco em volta só aparece, sem se mover */
  });
  const start = () => {
    titles.forEach(el => replay(el, { at:.5, ms:1900, prep: t => { if(t._splitW !== t.clientWidth) splitTitle(t); } }));
    $$("[data-stagger]:not([data-stagger='each'])").forEach(el => replay(el, { at:.15, ms:1900, prep: staggerPrep }));
    /* listas longas: cada item entra sozinho quando chega à tela */
    $$("[data-stagger='each'] > *").forEach(el => {
      el.classList.add("rv-item");
      replay(el, { at:.3, ms:1300, prep: it => { it.style.setProperty("--bd", `${Math.min(revealBatch++, 8) * 70}ms`); } });
    });
    $$("[data-mask]").forEach(el => replay(el, { at:.3, ms:1700 }));
    $$(".reveal:not([data-stagger])").forEach(el => replay(el, { at:.25, ms:1400 }));
    replay($("#expStage"), { at:.35, ms:2200 });
  };
  /* a quebra das linhas depende da fonte: começa quando ela carregou */
  if(document.fonts?.ready) document.fonts.ready.then(start, start); else start();

  /* largura mudou: refaz as linhas dos títulos à vista (as classes de estado continuam) */
  let w = window.innerWidth, t = 0;
  window.addEventListener("resize", () => {
    clearTimeout(t);
    t = setTimeout(() => {
      if(window.innerWidth === w) return;
      w = window.innerWidth;
      $$(".ttl.is-split").forEach(el => { if(el.getClientRects().length) splitTitle(el); });
    }, 200);
  }, { passive:true });
}

/* ------------------------------------------------------------
   CURSOR CUSTOMIZADO
------------------------------------------------------------ */
function initCursor(){
  if(!finePointer.matches || prefersReduced.matches) return;
  const cursor = $("#cursor"), label = $("#cursorLabel");
  let raf = null;
  document.addEventListener("mousemove", e => {
    if(raf) return;
    raf = requestAnimationFrame(() => {
      cursor.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
      const target = e.target.closest("[data-cursor]");
      if(target){ label.textContent = target.dataset.cursor; cursor.classList.add("labeled"); }
      else cursor.classList.remove("labeled");
      raf = null;
    });
  }, { passive:true });
}

/* ------------------------------------------------------------
   BOOT
------------------------------------------------------------ */
document.addEventListener("DOMContentLoaded", () => {
  $$(".page").forEach(p => { pageEls[p.dataset.page] = p; });
  $("#year").textContent = new Date().getFullYear();

  initNavigation();
  initHoverPreview();
  renderHeroStack();
  renderIntents();
  renderFeatured();
  renderFAQ();
  renderCategoryColumns();
  renderSuiteIndex();
  renderPriceTable();
  renderExperience();
  initGallery();
  initFlipbook();
  initOverlays();
  initParallax();
  initLocation();
  initContactStatus();
  initFloating();
  initScrollReveal();
  initCursor();

  window.addEventListener("hashchange", handleRoute);
  handleRoute();
});
})();
