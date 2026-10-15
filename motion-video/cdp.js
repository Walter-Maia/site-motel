// CDP mínimo para Node 14 (ws@7), Edge headless com perfil temporário
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');
const WebSocket = require('ws');

const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const sleep = ms => new Promise(r => setTimeout(r, ms));

function getJSON(url) {
  return new Promise((res, rej) => {
    const req = http.get(url, r => { let d = ''; r.on('data', c => d += c); r.on('end', () => { try { res(JSON.parse(d)); } catch (e) { rej(e); } }); });
    req.on('error', rej);
    req.setTimeout(2000, () => { req.destroy(new Error('timeout')); });
  });
}

async function launch(port, extra = [], tentativa = 1) {
  try { return await abre(port, extra); }
  catch (e) { if (tentativa >= 4) throw e; await sleep(1000); return launch(null, extra, tentativa + 1); }
}

async function abre(port, extra) {
  port = port || (12000 + Math.floor(Math.random() * 8000));
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'mb-motion-edge-'));
  const proc = spawn(EDGE, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`,
    '--no-first-run', '--no-default-browser-check', '--disable-extensions', '--hide-scrollbars', '--mute-audio',
    '--allow-file-access-from-files', '--disk-cache-size=1', '--media-cache-size=1', '--disable-component-update', '--disable-breakpad', '--no-pings', '--autoplay-policy=no-user-gesture-required', '--force-color-profile=srgb', ...extra, 'about:blank'], { stdio: 'ignore' });
  let page = null;
  for (let i = 0; i < 80 && !page; i++) {
    try { const list = await getJSON(`http://127.0.0.1:${port}/json/list`); page = list.find(t => t.type === 'page'); } catch (e) {}
    if (!page) await sleep(250);
  }
  if (!page) { proc.kill(); throw new Error('Edge não respondeu na porta ' + port); }
  const ws = new WebSocket(page.webSocketDebuggerUrl, { perMessageDeflate: false, maxPayload: 512 * 1024 * 1024 });
  await new Promise((res, rej) => { ws.on('open', res); ws.on('error', rej); });
  let id = 0; const pending = new Map(); const listeners = [];
  ws.on('message', data => {
    const msg = JSON.parse(data);
    if (msg.id && pending.has(msg.id)) { const p = pending.get(msg.id); pending.delete(msg.id); msg.error ? p.rej(new Error(JSON.stringify(msg.error))) : p.res(msg.result); }
    else if (msg.method) listeners.forEach(l => l(msg));
  });
  const send = (method, params = {}) => new Promise((res, rej) => {
    const i = ++id;
    const t = setTimeout(() => { if (pending.has(i)) { pending.delete(i); rej(new Error('sem resposta: ' + method)); } }, 120000);
    pending.set(i, { res: v => { clearTimeout(t); res(v); }, rej: e => { clearTimeout(t); rej(e); } });
    ws.send(JSON.stringify({ id: i, method, params }));
  });
  const evaluate = async expr => {
    const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
    if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails).slice(0, 800));
    return r.result.value;
  };
  const close = () => new Promise(res => {
    try { ws.close(); } catch (e) {}
    const apaga = () => { for (let i = 0; i < 10; i++) { try { fs.rmSync(profile, { recursive: true, force: true }); break; } catch (e) { require('child_process').execSync('ping -n 2 127.0.0.1 >NUL'); } } res(); };
    proc.once('exit', () => setTimeout(apaga, 300));
    proc.kill();
  });
  return { send, evaluate, close, on: fn => listeners.push(fn), port };
}

async function shot(send, file, opts = {}) {
  const r = await send('Page.captureScreenshot', Object.assign({ format: 'png' }, opts));
  fs.writeFileSync(file, Buffer.from(r.data, 'base64'));
}

module.exports = { launch, shot, sleep };
