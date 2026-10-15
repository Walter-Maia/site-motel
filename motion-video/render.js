// Renderiza o palco (stage.html) quadro a quadro no Edge headless.
//   node render.js stills 0.5,3.2,8      → saida/stills/t<tempo>.png (conferência)
//   node render.js video [ini] [fim]     → saida/video-mudo.mp4 (30 fps, borrão de movimento com BLUR subquadros)
// Variáveis: BLUR=4 (subquadros por quadro; 1 desliga), SHUTTER=0.5 (fração do quadro com obturador aberto)
const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { launch } = require('./cdp');

const RAIZ = path.resolve(__dirname, '..');
const SAIDA = path.join(__dirname, 'saida');
const FPS = 30, FIM = 26.5;
const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.mp4': 'video/mp4', '.svg': 'image/svg+xml' };

function servidor() {
  return new Promise(res => {
    const s = http.createServer((req, rsp) => {
      const p = path.join(RAIZ, decodeURIComponent(req.url.split('?')[0]));
      if (!p.startsWith(RAIZ) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { rsp.writeHead(404); rsp.end(); return; }
      rsp.writeHead(200, { 'Content-Type': TIPOS[path.extname(p).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'max-age=3600' });
      fs.createReadStream(p).pipe(rsp);
    });
    s.listen(0, '127.0.0.1', () => res(s));
  });
}

async function abrePalco() {
  const srv = await servidor();
  const b = await launch(null, ['--disable-gpu-vsync', '--disable-background-timer-throttling', '--disable-renderer-backgrounding']);
  await b.send('Page.enable');
  await b.send('Emulation.setDeviceMetricsOverride', { width: 1080, height: 1920, deviceScaleFactor: 1, mobile: false });
  await b.send('Page.navigate', { url: `http://127.0.0.1:${srv.address().port}/motion-video/stage.html` });
  for (let i = 0; i < 100; i++) {
    const ok = await b.evaluate('typeof window.pronto !== "undefined"').catch(() => false);
    if (ok) break;
    await new Promise(r => setTimeout(r, 200));
  }
  await b.evaluate('window.pronto');
  return { b, srv };
}

async function quadro(b, t, fmt = 'jpeg') {
  await b.evaluate(`exportFrame(${t.toFixed(5)})`);
  const r = await b.send('Page.captureScreenshot', fmt === 'png' ? { format: 'png' } : { format: 'jpeg', quality: 96 });
  return Buffer.from(r.data, 'base64');
}

(async () => {
  const modo = process.argv[2] || 'stills';
  fs.mkdirSync(SAIDA, { recursive: true });
  const { b, srv } = await abrePalco();
  const t0 = Date.now();
  if (modo === 'stills') {
    const dir = path.join(SAIDA, 'stills');
    fs.mkdirSync(dir, { recursive: true });
    const tempos = (process.argv[3] || '1,3,5,9,13,17.5,21.5,25').split(',').map(Number);
    for (const t of tempos) {
      fs.writeFileSync(path.join(dir, `t${t.toFixed(2).padStart(5, '0')}.png`), await quadro(b, t, 'png'));
    }
    console.log(tempos.length, 'stills em', ((Date.now() - t0) / 1000).toFixed(1), 's');
  } else if (modo === 'video') {
    const ini = +(process.argv[3] || 0), fim = +(process.argv[4] || FIM);
    const S = +(process.env.BLUR || 4), SH = +(process.env.SHUTTER || .5);
    const nome = process.env.OUT || 'video-mudo.mp4';
    const filtro = S > 1 ? `tmix=frames=${S},select='eq(mod(n\\,${S})\\,${S - 1})',setpts=N/(${FPS}*TB)` : 'null';
    const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'image2pipe', '-framerate', String(FPS * S), '-c:v', 'mjpeg', '-i', '-',
      '-vf', `${filtro},format=yuv420p`, '-r', String(FPS), '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-maxrate', '18M', '-bufsize', '36M', '-profile:v', 'high',
      '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709', '-movflags', '+faststart', path.join(SAIDA, nome)], { stdio: ['pipe', 'inherit', 'inherit'] });
    const n0 = Math.round(ini * FPS), n1 = Math.round(fim * FPS);
    for (let f = n0; f < n1; f++) {
      for (let s = 0; s < S; s++) {
        const t = S > 1 ? Math.max(0, (f + ((s + .5) / S - .5) * SH) / FPS) : f / FPS;
        const buf = await quadro(b, t);
        if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
      }
      if (f % 30 === 0) process.stdout.write(`\r${(f / FPS).toFixed(1)} s  (${((Date.now() - t0) / 1000).toFixed(0)} s decorridos)   `);
    }
    ff.stdin.end();
    await new Promise(r => ff.on('close', r));
    console.log('\nvídeo pronto em', ((Date.now() - t0) / 1000).toFixed(0), 's');
  }
  await b.close(); srv.close();
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
