/* ============================================================
   MOTEL MONTBLACK — LÓGICA DO SITE
   Router por hash (#/suites, #/suites/arabe, #/contato …),
   renderização das áreas a partir de data.js, overlays,
   flipbook 3D, galeria, disponibilidade e microinterações.
============================================================ */
(function(){
"use strict";

const { config: motelConfig, lodging: lodgingInfo, categories, suites, menu: menuCategories, experiences, faq, intents, featured } = window.MB;

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

function makePH(name, tones, label, opts={}){
  const el = document.createElement("div");
  el.className = "ph" + (opts.quiet ? " quiet" : "");
  el.style.setProperty("--ph-bg", tones[1]);
  el.setAttribute("role","img");
  el.setAttribute("aria-label", `${name} — ${label || "ambiente"} do Motel Montblack em Ipatinga (imagem ilustrativa)`);
  el.innerHTML = `<span class="ph-arc" aria-hidden="true"></span><span class="ph-mono" aria-hidden="true">Montblack</span><span class="ph-name">${name}${label?`<small>${label}</small>`:""}</span>`;
  return el;
}
/* Imagem com fade-in; se falhar, some e deixa o placeholder aparecer */
function makeImg(src, alt, w, eager){
  const img = document.createElement("img");
  img.src = MB.img(src, w); img.alt = alt;
  if(!eager) img.loading = "lazy";
  img.decoding = "async";
  const ready = () => img.classList.add("loaded");
  img.onload = ready;
  img.onerror = () => { img.parentElement?.classList.remove("has-img","quiet"); img.remove(); };
  if(img.complete && img.naturalWidth) ready();
  return img;
}
/* Fotografias: quando `src` existir, usa <img> sobre o placeholder (que serve de fundo enquanto carrega) */
function media(container, src, name, tones, label, opts={}){
  container.innerHTML = "";
  const ph = makePH(name, tones, label, opts);
  if(src){
    ph.appendChild(makeImg(src, `${name} — ${label||"ambiente"} (imagem ilustrativa)`, opts.w, opts.eager));
    ph.classList.add("quiet","has-img");
  }
  container.appendChild(ph);
  return ph;
}
function lockScroll(lock){ document.body.classList.toggle("no-scroll", lock); }
function suiteById(id){ return suites.find(s => s.id === id); }

/* ------------------------------------------------------------
   LOADER
------------------------------------------------------------ */
function initLoader(){
  const loader = $("#loader");
  const done = () => loader.classList.add("done");
  if(document.readyState === "complete") setTimeout(done, 250);
  else window.addEventListener("load", () => setTimeout(done, 250));
  setTimeout(done, 2400); /* nunca prender o usuário */
}

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
   HOME — HERO 3D (pilha de categorias)
------------------------------------------------------------ */
function renderHeroStack(){
  const stack = $("#heroStack");
  Object.values(categories).forEach((cat, i) => {
    const a = document.createElement("a");
    a.className = "plate p" + (i+1);
    a.href = `#/suites?cat=${cat.id}`;
    a.setAttribute("aria-label", `${cat.title}: ${cat.count} suítes, ${fromLabel(cat.prices)} a partir de ${fmtBRL(fromPrice(cat.prices))}`);
    const m = document.createElement("span"); m.className = "plate-media";
    media(m, cat.image, cat.title, cat.tones, "Categoria", { quiet:true, w:900, eager:true });
    a.appendChild(m);
    a.insertAdjacentHTML("beforeend", `
      <span class="plate-meta">
        <small>${pad2(cat.count)} suítes</small>
        <b>${cat.label}</b>
        <i>${fromLabel(cat.prices)} a partir de ${fmtBRL(fromPrice(cat.prices))}</i>
        <span class="arrow" aria-hidden="true">→</span>
      </span>`);
    stack.appendChild(a);
  });
  if(prefersReduced.matches || !finePointer.matches) return;
  const hero = $("#heroHome");
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
   PREVIEW FLUTUANTE (hover em listas — apenas desktop/pointer fino)
------------------------------------------------------------ */
const hoverPreview = { el:null, raf:null, x:0, y:0 };
function initHoverPreview(){
  hoverPreview.el = $("#hoverPreview");
  if(!finePointer.matches || prefersReduced.matches) return;
  document.addEventListener("mousemove", e => {
    hoverPreview.x = e.clientX; hoverPreview.y = e.clientY;
    if(hoverPreview.raf) return;
    hoverPreview.raf = requestAnimationFrame(() => {
      hoverPreview.raf = null;
      hoverPreview.el.style.transform = `translate(${hoverPreview.x + 150}px, ${hoverPreview.y}px) translate(-50%,-50%)`;
    });
  }, { passive:true });
}
function bindPreview(el, getData){
  if(!finePointer.matches || prefersReduced.matches) return;
  el.addEventListener("mouseenter", () => {
    if(!wideScreen.matches) return;
    const d = getData();
    media(hoverPreview.el, d.image, d.name, d.tones, d.label, { w:700, eager:true });
    hoverPreview.el.classList.add("visible");
  });
  el.addEventListener("mouseleave", () => hoverPreview.el.classList.remove("visible"));
}

/* ------------------------------------------------------------
   HOME — O QUE VOCÊ PROCURA? / DESTAQUES / FAQ
------------------------------------------------------------ */
function renderIntents(){
  const list = $("#intentList");
  intents.forEach(it => {
    const li = document.createElement("li");
    li.innerHTML = `
      <a class="intent" href="${it.href}">
        <span class="i-num">${it.n}</span>
        <span class="i-text"><b>${it.t}</b><small>${it.d}</small></span>
        <span class="i-arrow" aria-hidden="true">→</span>
      </a>`;
    bindPreview(li.firstElementChild, () => ({ image: it.image, name: it.label, tones: it.tones, label: "Montblack" }));
    list.appendChild(li);
  });
}
function renderFeatured(){
  const grid = $("#featuredGrid");
  featured.map(suiteById).filter(Boolean).forEach((s, i) => {
    const a = document.createElement("a");
    a.className = "tile " + (i === 0 ? "big" : "small") + " reveal reveal-d" + Math.min(i+1,3);
    a.href = `#/suites/${s.id}`;
    a.dataset.cursor = "Ver suíte";
    a.innerHTML = `
      <div class="tile-media"></div>
      <div class="tile-caption">
        <h3>${s.name}</h3>
        <span>${s.categoryLabel}<b>${fmtBRL(fromPrice(s.prices))} · ${fromLabel(s.prices)}</b></span>
      </div>`;
    media(a.querySelector(".tile-media"), s.images[0], s.name, s.tones, s.views[0], { w: i === 0 ? 1400 : 900 });
    grid.appendChild(a);
  });
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
}

/* ------------------------------------------------------------
   SUÍTES — CATEGORIAS / ÍNDICE / VALORES
------------------------------------------------------------ */
function renderCategoryColumns(){
  const wrap = $("#catColumns");
  Object.values(categories).forEach((cat, i) => {
    const col = document.createElement("article");
    col.className = "cat-col";
    const p = cat.prices;
    col.innerHTML = `
      <div class="cat-col-media"></div>
      <div class="cat-col-head"><h3>${cat.title}</h3><span>${pad2(cat.count)} suítes</span></div>
      <p>${cat.tagline}</p>
      <ul class="cat-col-amen">${cat.amenities.map(a => `<li>${a}</li>`).join("")}</ul>
      <div class="cat-col-prices">
        ${p.oneHour != null ? `<div><span>1 hora</span><b>${fmtBRL(p.oneHour)}</b></div>` : ""}
        <div><span>2 horas</span><b>${fmtBRL(p.twoHours)}</b></div>
        <div><span>Pernoite</span><b>${fmtBRL(p.overnight)}</b></div>
      </div>
      <a class="link-arrow" href="#/suites?cat=${cat.id}">Ver suítes ${cat.label} <span class="arrow">→</span></a>`;
    media(col.querySelector(".cat-col-media"), cat.image, cat.title, cat.tones, "Categoria", { w:900 });
    wrap.appendChild(col);
  });
}
let currentFilter = "all";
function renderSuiteIndex(){
  const list = $("#suiteIndex");
  suites.forEach((s, i) => {
    const li = document.createElement("li");
    li.className = "sx-row";
    li.dataset.category = s.category;
    li.innerHTML = `
      <a href="#/suites/${s.id}" data-cursor="Ver suíte" aria-label="Suíte ${s.name}, ${s.categoryLabel}">
        <span class="sx-num">${pad2(i+1)}</span>
        <span class="sx-thumb"></span>
        <span class="sx-name">${s.name}<small>${s.categoryLabel}</small></span>
        <span class="sx-desc">${s.description}</span>
        <span class="sx-price"><span>${fromLabel(s.prices)}</span><b>${fmtBRL(fromPrice(s.prices))}</b></span>
        <span class="sx-arrow" aria-hidden="true">→</span>
      </a>`;
    media(li.querySelector(".sx-thumb"), s.images[0], s.name, s.tones, s.views[0], { quiet:true, w:320 });
    bindPreview(li.firstElementChild, () => ({ image: s.images[0], name: s.name, tones: s.tones, label: s.views[0] }));
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
        return `<td>${v == null ? `<span class="na">—</span>` : fmtBRL(v)}</td>`;
      }).join("")}</tr>`).join("")}
    </tbody>`;
}

/* ------------------------------------------------------------
   SUÍTE — PÁGINA DE DETALHE + GALERIA + LIGHTBOX
------------------------------------------------------------ */
let detailSuite = null, galleryIndex = 0;
function paintSuite(s){
  detailSuite = s; galleryIndex = 0;
  const hero = $("#detailHero");
  hero.querySelector(".ph")?.remove();
  const heroPh = makePH(s.name, s.tones, s.views[0], { quiet:true });
  if(s.images[0]){ heroPh.appendChild(makeImg(s.images[0], "", 1800, true)); heroPh.classList.add("has-img"); }
  hero.insertBefore(heroPh, hero.firstChild);
  $("#detailCat").textContent = "Suíte " + s.categoryLabel;
  $("#detailName").textContent = s.name;
  $("#detailDesc").textContent = s.description;
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
function paintGallery(){
  const s = detailSuite;
  const main = $("#galleryMain");
  main.querySelector(".ph")?.remove();
  const ph = makePH(s.name, s.tones, s.views[galleryIndex]);
  if(s.images[galleryIndex]){
    ph.appendChild(makeImg(s.images[galleryIndex], `${s.name} — ${s.views[galleryIndex]} (imagem ilustrativa)`, 1400, true));
    ph.classList.add("quiet","has-img");
  }
  main.insertBefore(ph, main.firstChild);
  $("#galleryCounter").textContent = `${galleryIndex+1} / ${s.views.length}`;
  const thumbs = $("#galleryThumbs");
  thumbs.innerHTML = "";
  s.views.forEach((v, i) => {
    const t = document.createElement("button");
    t.className = "gallery-thumb";
    t.setAttribute("role","tab");
    t.setAttribute("aria-current", String(i === galleryIndex));
    t.setAttribute("aria-label", `Ver imagem: ${v}`);
    media(t, s.images[i], s.name, s.tones, v, { w:400 });
    t.addEventListener("click", () => { galleryIndex = i; paintGallery(); });
    thumbs.appendChild(t);
  });
}
function galleryGo(dir){
  const n = detailSuite.views.length;
  galleryIndex = (galleryIndex + dir + n) % n;
  paintGallery();
  if($("#lightbox").classList.contains("open")) paintLightbox();
}
function initGallery(){
  $("#galleryPrev").addEventListener("click", e => { e.stopPropagation(); galleryGo(-1); });
  $("#galleryNext").addEventListener("click", e => { e.stopPropagation(); galleryGo(1); });
  const main = $("#galleryMain");
  main.addEventListener("click", e => { if(e.target.closest(".gallery-nav")) return; openLightbox(); });
  main.addEventListener("keydown", e => {
    if(e.key === "Enter" || e.key === " "){ e.preventDefault(); openLightbox(); }
    if(e.key === "ArrowRight") galleryGo(1);
    if(e.key === "ArrowLeft") galleryGo(-1);
  });
  swipe(main, dir => galleryGo(dir));

  const lb = $("#lightbox");
  $("#lightboxClose").addEventListener("click", () => closeOverlay(lb));
  $("#lightboxPrev").addEventListener("click", () => galleryGo(-1));
  $("#lightboxNext").addEventListener("click", () => galleryGo(1));
  lb.addEventListener("click", e => { if(e.target === e.currentTarget) closeOverlay(lb); });
  document.addEventListener("keydown", e => {
    if(!lb.classList.contains("open")) return;
    if(e.key === "ArrowRight") galleryGo(1);
    if(e.key === "ArrowLeft") galleryGo(-1);
  });
  swipe(lb, dir => galleryGo(dir));
}
function openLightbox(){ paintLightbox(); openOverlay($("#lightbox"), $("#lightboxClose")); }
function paintLightbox(){
  const s = detailSuite, stage = $("#lightboxStage");
  media(stage, s.images[galleryIndex], s.name, s.tones, s.views[galleryIndex], { w:1800, eager:true });
  $("#lightboxCounter").textContent = `${galleryIndex+1} / ${s.views.length}`;
  $("#lightboxCaption").textContent = `${s.name} — ${s.views[galleryIndex]}`;
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
/* Cena 3D: um "baralho" de placas fotográficas em perspectiva — a placa da
   comodidade ativa vem para a frente; as próximas recuam em profundidade. */
const expState = { active: 0, hoverLock: 0 };
function renderExperience(){
  const list = $("#expList"), deck = $("#expDeck"), stage = $("#expStage");
  list.innerHTML = experiences.map((x, i) => `
    <li data-index="${i}"><span>${pad2(i+1)}</span><div><h3>${x.t}</h3><p>${x.d}</p></div></li>`).join("");
  experiences.forEach((x, i) => {
    const card = document.createElement("div");
    card.className = "exp-card";
    card.dataset.index = i;
    const m = document.createElement("div"); m.className = "exp-card-media";
    media(m, x.image, x.t, ["#2a1214","#3a1518","#5a2a2a"], "Montblack", { quiet:true, w:900, eager: i < 3 });
    card.appendChild(m);
    card.insertAdjacentHTML("beforeend", `<span class="exp-card-meta"><small>${pad2(i+1)}</small><b>${x.t}</b></span>`);
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
   CARDÁPIO — FLIPBOOK 3D
------------------------------------------------------------ */
const bookPages = [];
function buildBookPages(){
  bookPages.push({ type:"cover" });
  bookPages.push({ type:"intro" });
  menuCategories.forEach(cat => bookPages.push({ type:"menu", cat }));
  bookPages.push({ type:"closing" });
  bookPages.push({ type:"back" });
}
function menuItemsHTML(items){
  return `<ul class="menu-items">${items.map(it => `
    <li class="menu-item">
      <span class="mi-name">${it.name}${it.note ? `<span class="mi-note">${it.note}</span>` : ""}</span>
      <span class="mi-dots" aria-hidden="true"></span>
      <span class="mi-price">${it.price != null ? fmtBRL(it.price) : "Consulte"}</span>
    </li>`).join("")}</ul>`;
}
function pageHTML(p, num){
  if(p.type === "cover" || p.type === "back"){
    return `<div class="page-inner page-cover">
      <div class="cover-frame">
        <span class="cover-sub">Motel &bull; Ipatinga</span>
        <h3>MONTBLACK</h3>
        <span class="cover-orn"></span>
        <span class="cover-sub">${p.type === "cover" ? "Cardápio" : "Bon appétit"}</span>
      </div></div>`;
  }
  if(p.type === "intro"){
    return `<div class="page-inner">
      <h3 class="page-title">Bem-servidos</h3>
      <p class="page-intro-copy">Uma seleção de bebidas geladas, rótulos escolhidos e porções preparadas na hora — entregues com discrição, diretamente na sua suíte.</p>
      <p class="page-intro-copy" style="margin-top:12px">Valores: consulte na recepção ou pela suíte.</p>
      <div class="page-art" aria-hidden="true"></div>
      <span class="page-num">${num}</span></div>`;
  }
  if(p.type === "closing"){
    return `<div class="page-inner">
      <h3 class="page-title">Até a próxima</h3>
      <p class="page-intro-copy">Motel Montblack — R. Serra Geral, 551, Jardim Panorama, Ipatinga - MG. Aberto 24 horas.</p>
      <div class="page-art" aria-hidden="true"></div>
      <span class="page-num">${num}</span></div>`;
  }
  return `<div class="page-inner">
    <h3 class="page-title">${p.cat.title}</h3>
    ${menuItemsHTML(p.cat.items)}
    <span class="page-num">${num}</span></div>`;
}
const bookState = { spread:0, mobilePage:0, leaves:[], mobilePages:[] };
function initFlipbook(){
  buildBookPages();
  const book = $("#book"), status = $("#bookStatus");
  const total = bookPages.length, leafCount = total/2;
  for(let i=0; i<leafCount; i++){
    const leaf = document.createElement("div");
    leaf.className = "leaf";
    leaf.style.zIndex = leafCount - i;
    leaf.innerHTML = `
      <div class="leaf-face front">${pageHTML(bookPages[i*2], i*2)}</div>
      <div class="leaf-face back">${pageHTML(bookPages[i*2+1], i*2+1)}</div>`;
    book.appendChild(leaf);
    bookState.leaves.push(leaf);
  }
  const mobile = document.createElement("div");
  mobile.className = "book-mobile";
  mobile.setAttribute("aria-label","Cardápio — modo página única");
  bookPages.forEach((p, i) => {
    const pg = document.createElement("div");
    pg.className = "m-page" + (i === 0 ? " current" : "");
    pg.innerHTML = pageHTML(p, i);
    mobile.appendChild(pg);
    bookState.mobilePages.push(pg);
  });
  book.parentElement.appendChild(mobile);

  const isMobile = () => window.matchMedia("(max-width: 768px)").matches;
  function updateStatus(){
    if(isMobile()){
      const n = bookState.mobilePage;
      status.textContent = n === 0 ? "Capa" : (n === total-1 ? "Contracapa" : `Página ${n} de ${total-2}`);
    } else {
      const s = bookState.spread;
      status.textContent = s === 0 ? "Capa" : (s === leafCount ? "Contracapa" : `Páginas ${s*2-1}–${s*2} de ${total-2}`);
    }
    $("#bookPrev").disabled = isMobile() ? bookState.mobilePage === 0 : bookState.spread === 0;
    $("#bookNext").disabled = isMobile() ? bookState.mobilePage === total-1 : bookState.spread === leafCount;
  }
  function flip(dir){
    if(isMobile()){
      const n = Math.min(Math.max(bookState.mobilePage + dir, 0), total-1);
      if(n === bookState.mobilePage) return;
      bookState.mobilePages[bookState.mobilePage].classList.remove("current");
      bookState.mobilePage = n;
      bookState.mobilePages[n].classList.add("current");
    } else {
      const s = Math.min(Math.max(bookState.spread + dir, 0), leafCount);
      if(s === bookState.spread) return;
      bookState.spread = s;
      bookState.leaves.forEach((leaf, i) => {
        const flipped = i < s;
        leaf.classList.toggle("flipped", flipped);
        leaf.style.zIndex = flipped ? i + 1 : leafCount - i;
      });
    }
    updateStatus();
  }
  $("#bookPrev").addEventListener("click", () => flip(-1));
  $("#bookNext").addEventListener("click", () => flip(1));
  book.addEventListener("click", e => { const r = book.getBoundingClientRect(); flip(e.clientX - r.left > r.width/2 ? 1 : -1); });
  book.tabIndex = 0;
  book.setAttribute("role","group");
  book.addEventListener("keydown", e => {
    if(e.key === "ArrowRight"){ e.preventDefault(); flip(1); }
    if(e.key === "ArrowLeft"){ e.preventDefault(); flip(-1); }
  });
  mobile.addEventListener("click", e => { const r = mobile.getBoundingClientRect(); flip(e.clientX - r.left > r.width/2 ? 1 : -1); });
  swipe(mobile, dir => flip(dir));
  window.addEventListener("resize", updateStatus, { passive:true });
  updateStatus();

  /* alternativa acessível em lista */
  const plain = $("#menuListPlain"), toggle = $("#menuListToggle");
  plain.innerHTML = menuCategories.map(cat => `<h3>${cat.title}</h3>${menuItemsHTML(cat.items)}`).join("");
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
      const focusables = $$("button, [href], select, input, [tabindex]:not([tabindex='-1'])", top).filter(el => !el.hidden && el.offsetParent !== null);
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
    .map(s => `<option value="${s.id}" ${s.id === availState.suiteId ? "selected" : ""}>${s.name}</option>`).join("");
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
  let html = `Sua seleção: <b>Suíte ${s.name}</b> (${s.categoryLabel})`;
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
    let msg = `Olá! Gostaria de consultar a disponibilidade da Suíte ${s.name}.`;
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
   SCROLL REVEAL
------------------------------------------------------------ */
function initScrollReveal(){
  if(prefersReduced.matches){ $$(".reveal").forEach(el => el.classList.add("is-visible")); return; }
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => { if(e.isIntersecting){ e.target.classList.add("is-visible"); io.unobserve(e.target); } });
  }, { threshold:.1, rootMargin:"0px 0px -6% 0px" });
  $$(".reveal").forEach(el => io.observe(el));
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

  initLoader();
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
