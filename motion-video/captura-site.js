// Fotografa o site real (celular 390x844 @2x) em cada posição de rolagem que o palco vai mostrar.
// Saída: material/site/<pagina>/s<rolagem>.jpg + material/site/medidas.json
// Uso: node captura-site.js
const { launch, sleep } = require('./cdp');
const CEL = require('./celular');
const fs = require('fs');
const path = require('path');

const BASE = 'file:///' + path.resolve(__dirname, '..', 'index.html').replace(/\\/g, '/');
const OUT = path.join(__dirname, 'material', 'site');

(async () => {
  const b = await launch();
  const { send, evaluate } = b;
  await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  const medidas = {};
  for (const pagina of ['home', 'suites', 'mexicana']) {
    const dir = path.join(OUT, pagina);
    fs.mkdirSync(dir, { recursive: true });
    await send('Page.navigate', { url: BASE + CEL[pagina].rota });
    await sleep(2800);
    // o balão do WhatsApp e a barra de baixo são do site: ficam. Só o link "pular para o conteúdo" some.
    await evaluate(`document.querySelector('.skip-link') && (document.querySelector('.skip-link').style.display='none'); 1`);
    const largura = await evaluate('[innerWidth, document.documentElement.scrollWidth, document.documentElement.clientWidth]');
    const pos = CEL.posicoes(pagina);
    for (const y of pos) {
      await evaluate(`window.scrollTo(0, ${y}); new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))`);
      await sleep(pagina === 'home' && y === pos[0] ? 600 : 140);
      const r = await send('Page.captureScreenshot', { format: 'jpeg', quality: 94 });
      fs.writeFileSync(path.join(dir, `s${y}.jpg`), Buffer.from(r.data, 'base64'));
    }
    // medidas úteis (em coordenadas da página)
    medidas[pagina] = await evaluate(`(() => {
      const out = { largura: ${JSON.stringify(largura)} };
      const img = [...document.querySelectorAll('main img, main video, main picture')].map(e => { const b = e.getBoundingClientRect(); return { tag: e.tagName, src: (e.currentSrc || e.src || '').split('/').slice(-2).join('/'), x: b.x, y: b.y + scrollY, w: b.width, h: b.height }; }).filter(o => o.w > 100).slice(0, 6);
      out.imagens = img;
      return out;
    })()`);
    console.log(pagina, pos.length, 'quadros', JSON.stringify(medidas[pagina]));
  }
  fs.writeFileSync(path.join(OUT, 'medidas.json'), JSON.stringify(medidas, null, 2));
  await b.close();
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
