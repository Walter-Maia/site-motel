// Trilha original sintetizada (deep house lento, 120 BPM, Ré menor) + efeitos sincronizados ao palco.
// Saída: saida/trilha.wav (48 kHz, estéreo, 16 bits). Uso: node trilha.js
const fs = require('fs');
const path = require('path');

const SR = 48000, DUR = 26.5, N = Math.ceil(SR * DUR);
const BPM = 120, BEAT = 60 / BPM, BAR = BEAT * 4, S16 = BEAT / 4;
const L = new Float32Array(N), R = new Float32Array(N);          // seco
const RL = new Float32Array(N), RR = new Float32Array(N);        // envio para o reverb
const DUCK = new Float32Array(N).fill(1);                        // sidechain do bumbo

let seed = 20261015;
const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const idx = t => Math.round(t * SR);

function add(i, v, pan = 0, rev = 0) {
  if (i < 0 || i >= N) return;
  const gl = Math.cos((pan + 1) * Math.PI / 4), gr = Math.sin((pan + 1) * Math.PI / 4);
  L[i] += v * gl; R[i] += v * gr;
  if (rev) { RL[i] += v * gl * rev; RR[i] += v * gr * rev; }
}

// biquad RBJ (coeficientes recalculados quando a frequência muda)
function biquad(type) {
  let b0, b1, b2, a1, a2, x1 = 0, x2 = 0, y1 = 0, y2 = 0, lastF = -1, lastQ = -1;
  return function (x, f, q = .707) {
    if (f !== lastF || q !== lastQ) {
      lastF = f; lastQ = q;
      const w = 2 * Math.PI * clamp(f, 20, SR * .45) / SR, c = Math.cos(w), s = Math.sin(w), al = s / (2 * q);
      let n0, n1, n2;
      if (type === 'lp') { n0 = (1 - c) / 2; n1 = 1 - c; n2 = (1 - c) / 2; }
      else if (type === 'hp') { n0 = (1 + c) / 2; n1 = -(1 + c); n2 = (1 + c) / 2; }
      else { n0 = al; n1 = 0; n2 = -al; }
      const d0 = 1 + al;
      b0 = n0 / d0; b1 = n1 / d0; b2 = n2 / d0; a1 = -2 * c / d0; a2 = (1 - al) / d0;
    }
    const y = b0 * x + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2;
    x2 = x1; x1 = x; y2 = y1; y1 = y;
    return y;
  };
}

/* ---------------- arranjo ---------------- */
// acordes por compasso (2 s): Dm9, B♭maj7, Gm9, A7
const CH = [
  { bass: 38, v: [53, 57, 60, 64] },
  { bass: 46, v: [53, 57, 62, 65] },
  { bass: 43, v: [53, 57, 58, 62] },
  { bass: 45, v: [55, 61, 64, 67] }
];
const chordAt = t => CH[Math.floor(t / BAR) % 4];
// seções (s): o bumbo some na expansão (11.5–12) e na frase final (20–22.5)
const temBumbo = t => (t >= .5 && t < 11.5) || (t >= 12 && t < 20) || (t >= 23 && t < 25.5);
const temPalmas = t => (t >= 3.5 && t < 11.5) || (t >= 12 && t < 20) || (t >= 23 && t < 25.5);
const temChimbal = t => (t >= 1.5 && t < 11.75) || (t >= 12 && t < 20) || (t >= 23 && t < 25.5);
// filtro de abertura na bateria (0.5 → 3.5 s)
const corteBateria = t => t < 3.5 ? 300 * Math.pow(20000 / 300, clamp((t - .5) / 3, 0, 1)) : 20000;

/* ---------------- bateria ---------------- */
const bateria = new Float32Array(N), kick = new Float32Array(N);
function bumbo(t0, g = 1) {
  let ph = 0;
  for (let i = 0; i < SR * .38; i++) {
    const t = i / SR, f = 48 + 125 * Math.exp(-t * 36);
    ph += 2 * Math.PI * f / SR;
    let v = Math.sin(ph) * Math.exp(-t * 9) * .95 * (t > .3 ? (.38 - t) / .08 : 1);
    if (i < SR * .004) v += (rnd() * 2 - 1) * .25 * (1 - i / (SR * .004));
    const k = idx(t0) + i; if (k < N) kick[k] += Math.tanh(v * 1.4) * g;
  }
  // sidechain
  for (let i = 0; i < SR * .4; i++) { const k = idx(t0) + i; if (k < N) DUCK[k] = Math.min(DUCK[k], 1 - .62 * Math.exp(-i / SR / .09)); }
}
function palmas(t0, g = 1, pan = 0) {
  const bp = biquad('bp');
  for (let i = 0; i < SR * .35; i++) {
    const t = i / SR;
    let e = 0;
    [0, .011, .022].forEach(o => { if (t >= o) e = Math.max(e, Math.exp(-(t - o) * 140)); });
    e = Math.max(e, t >= .022 ? .55 * Math.exp(-(t - .022) * 16) : 0);
    const v = bp((rnd() * 2 - 1), 1500, 1.1) * e * 1.6 * g;
    add(idx(t0) + i, v * .55, pan, .35);
  }
}
const hpH = biquad('hp');
function chimbal(t0, dec, g, pan) {
  for (let i = 0; i < SR * dec * 5; i++) {
    const t = i / SR;
    const k = idx(t0) + i; if (k >= N) break;
    bateria[k] += (rnd() * 2 - 1) * Math.exp(-t / dec) * g * (pan ? 1 : 1);
  }
}
for (let b = 0; b * BEAT < DUR; b++) {
  const t = b * BEAT;
  if (temBumbo(t)) bumbo(t, t >= 23 ? .85 : 1);
  if (temPalmas(t) && b % 2 === 1) palmas(t, .9, -.08);
  if (temChimbal(t)) {
    chimbal(t + BEAT / 2 + .006, .055, .2 + rnd() * .04, 0);                       // aberto no contratempo
    [1, 3].forEach(s => chimbal(t + s * S16 + .012, .018, .07 + rnd() * .03, 0));    // fechados em semicolcheias
  }
}
// virada de palmas antes do fechamento (22.5 → 23)
for (let k = 0; k < 8; k++) palmas(22.5 + k * S16 / 1.0 * .5, .25 + k * .09, (k % 2 ? .3 : -.3));
// bateria passa pelo filtro de abertura e um passa-altas no chimbal
{
  const lp = biquad('lp'), lpK = biquad('lp');
  for (let i = 0; i < N; i++) {
    const t = i / SR, fc = corteBateria(t);
    const v = lp(hpH(bateria[i], 6000), fc, .9) + lpK(kick[i], Math.max(fc, 900), .8);
    add(i, v * .8, 0, .02);
  }
}

/* ---------------- baixo ---------------- */
{
  const lp = biquad('lp'), hpB = biquad('hp');
  let ph = 0;
  const notas = []; // [ini, dur, midi]
  for (let bar = 0; bar * BAR < DUR; bar++) {
    const t0 = bar * BAR, c = CH[bar % 4];
    [[0, 3, 0], [6, 2, 0], [10, 2, 7], [14, 2, 12]].forEach(([p, d, o]) => notas.push([t0 + p * S16, d * S16 * .9, c.bass + o]));
  }
  const ativo = t => t >= .5 && t < 25.8;
  const buf = new Float32Array(N);
  notas.forEach(([t0, d, m]) => {
    if (!ativo(t0)) return;
    const f = mtof(m), n = Math.floor((d + .06) * SR);
    let p = 0;
    for (let i = 0; i < n; i++) {
      const t = i / SR, e = Math.min(1, t / .006) * (t > d ? Math.exp(-(t - d) * 60) : 1);
      p += 2 * Math.PI * f / SR;
      const k = idx(t0) + i; if (k < N) buf[k] += (Math.sin(p) + .22 * Math.sin(2 * p) + .06 * Math.sin(3 * p)) * e;
    }
  });
  for (let i = 0; i < N; i++) {
    const t = i / SR;
    const brk = t >= 20 && t < 23 ? .6 : 1;
    add(i, hpB(Math.tanh(lp(buf[i], 700, .7) * 1.1), 38) * .24 * Math.pow(DUCK[i], 1.6) * brk, 0, 0);
  }
}

/* ---------------- piano elétrico (FM) ---------------- */
function rhodes(t0, m, dur, g, pan) {
  const f = mtof(m), n = Math.floor((dur + 1.2) * SR);
  let pc = 0, pm = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const idxFM = 1.6 * Math.exp(-t * 7) + .25;
    pm += 2 * Math.PI * f / SR; pc += 2 * Math.PI * f / SR;
    const env = Math.min(1, t / .003) * Math.exp(-t * 1.6) * (t > dur ? Math.exp(-(t - dur) * 9) : 1);
    const v = Math.sin(pc + idxFM * Math.sin(pm)) * env * g * (1 + .06 * Math.sin(2 * Math.PI * 4.5 * t));
    const k = idx(t0) + i; if (k < N) add(k, v * DUCK[k], pan, .5);
  }
}
for (let bar = 0; bar * BAR < DUR; bar++) {
  const t0 = bar * BAR, c = CH[bar % 4];
  const stabs = (t0 >= 20 && t0 < 23) ? [[0, 1.6]] : [[3, .32], [10, .32], [12, .5]];
  stabs.forEach(([p, d]) => {
    const t = t0 + p * S16;
    if (t < 1.0 || t > 25.6) return;
    const g = (t >= 20 && t < 23) ? .11 : .075;
    c.v.forEach((m, j) => rhodes(t + j * .006, m, d, g, (j - 1.5) * .25));
  });
}

/* ---------------- pad ---------------- */
{
  const lpL = biquad('lp'), lpR = biquad('lp'), hpL = biquad('hp'), hpR = biquad('hp');
  const phs = new Float64Array(24);
  for (let i = 0; i < N; i++) {
    const t = i / SR, c = chordAt(t);
    const tb = (t % BAR);
    const env = Math.min(1, tb / .35) * (tb > BAR - .15 ? (BAR - tb) / .15 : 1);
    let sl = 0, sr = 0;
    c.v.forEach((m, j) => {
      [-7, 0, 7].forEach((cents, d) => {
        const k = j * 3 + d;
        phs[k] += mtof(m + 12 * (j === 0 ? 0 : 0)) * Math.pow(2, cents / 1200) / SR;
        const saw = 2 * (phs[k] % 1) - 1;
        if (d === 0) { sl += saw * .5; sr += saw * .5; } else if (d === 1) sl += saw; else sr += saw;
      });
    });
    const abre = t < 3.5 ? 500 + 1300 * (t / 3.5) : (t >= 20 && t < 23 ? 2600 : 1600);
    const g = (t < .1 ? t / .1 : 1) * (t >= 20 && t < 23 ? .05 : .032) * (t > 25 ? Math.max(0, (26.5 - t) / 1.5) : 1);
    add(i, hpL(lpL(sl, abre, .6), 260) * g * (.4 + .6 * DUCK[i]), -.5, .45);
    add(i, hpR(lpR(sr, abre, .6), 260) * g * (.4 + .6 * DUCK[i]), .5, .45);
  }
}

/* ---------------- efeitos sincronizados ao palco ---------------- */
// varredura: ruído em passa-faixa cuja frequência sobe e desce; pan acompanha o sentido do movimento
function whoosh(t0, dur, f0, f1, f2, g, pan0 = 0, pan1 = 0) {
  const bp = biquad('bp'), n = Math.floor(dur * SR);
  for (let i = 0; i < n; i++) {
    const p = i / n;
    const f = p < .5 ? f0 * Math.pow(f1 / f0, p * 2) : f1 * Math.pow(f2 / f1, (p - .5) * 2);
    const e = Math.pow(Math.sin(Math.PI * Math.pow(p, .8)), 2);
    add(idx(t0) + i, bp(rnd() * 2 - 1, f, 1.3) * e * g, pan0 + (pan1 - pan0) * p, .25);
  }
}
function clique(t0, g = .18) {
  for (let i = 0; i < SR * .03; i++) { const t = i / SR; add(idx(t0) + i, (Math.sin(2 * Math.PI * 2300 * t) * .6 + (rnd() * 2 - 1) * .4) * Math.exp(-t * 260) * g, 0, .1); }
}
function tique(t0, g = .06) {
  for (let i = 0; i < SR * .012; i++) { const t = i / SR; add(idx(t0) + i, Math.sin(2 * Math.PI * 3200 * t) * Math.exp(-t * 500) * g, .2, .05); }
}
function pop(t0, g = .16) {
  let ph = 0;
  for (let i = 0; i < SR * .12; i++) { const t = i / SR; ph += 2 * Math.PI * (520 + 500 * Math.exp(-t * 40)) / SR; add(idx(t0) + i, Math.sin(ph) * Math.exp(-t * 32) * g, 0, .2); }
}
function impacto(t0, g = 1) {
  let ph = 0; const lp = biquad('lp');
  for (let i = 0; i < SR * 2.2; i++) {
    const t = i / SR;
    ph += 2 * Math.PI * (34 + 40 * Math.exp(-t * 9)) / SR;
    const boom = Math.sin(ph) * Math.exp(-t * 2.2) * .7;
    const ruido = lp(rnd() * 2 - 1, 900 * Math.exp(-t * 3) + 120, .7) * Math.exp(-t * 4) * .5;
    add(idx(t0) + i, Math.tanh((boom + ruido) * 1.5) * g * .7, 0, .3);
  }
  // brilho: sino FM em Ré/Lá
  [74, 81, 86].forEach((m, j) => {
    const f = mtof(m); let pc = 0;
    for (let i = 0; i < SR * 2.4; i++) {
      const t = i / SR; pc += 2 * Math.PI * f / SR;
      const v = Math.sin(pc + 2.2 * Math.exp(-t * 3) * Math.sin(pc * 3.5)) * Math.exp(-t * 1.6) * .045 * g;
      add(idx(t0 + j * .02) + i, v, (j - 1) * .5, .7);
    }
  });
}
function subida(t0, dur, g) { // riser
  const bp = biquad('bp'), n = Math.floor(dur * SR); let ph = 0;
  for (let i = 0; i < n; i++) {
    const p = i / n, f = 250 * Math.pow(7000 / 250, p);
    ph += 2 * Math.PI * (200 + 600 * p * p) / SR;
    const v = (bp(rnd() * 2 - 1, f, 2) * .8 + Math.sin(ph) * .15) * Math.pow(p, 2.2) * g;
    add(idx(t0) + i, v, 0, .4);
  }
}

// abertura: fenda de luz e portão
(function () { let ph = 0; for (let i = 0; i < SR * 1.2; i++) { const t = i / SR; ph += 2 * Math.PI * (1200 + 2400 * Math.min(1, t / .25)) / SR; add(i, Math.sin(ph) * Math.exp(-t * 4) * Math.min(1, t / .02) * .035, 0, .8); } })();
whoosh(.05, .8, 120, 600, 160, .55, 0, 0);
// faixas e ripas
whoosh(3.08, .75, 200, 2400, 500, .5, -.7, .7);
whoosh(7.08, .75, 160, 1800, 300, .45, .5, -.5);
whoosh(15.58, .75, 200, 2400, 500, .5, .7, -.7);
whoosh(19.58, .75, 140, 1600, 300, .5, -.7, .7);
// cartões lançados (alternam direita/esquerda)
[4.75, 5.25, 5.75, 6.25, 6.75].forEach((t, i) => whoosh(t + .02, .32, 900, 5200, 2200, .28, 0, i % 2 ? -.8 : .8));
// celular: entrada, arraste, toques e trocas de página (tempos locais + 7.4)
whoosh(7.5, .7, 120, 900, 200, .28, 0, 0);
whoosh(8.55, .6, 400, 1600, 600, .1, 0, 0);
clique(9.5); whoosh(9.62, .32, 800, 3200, 1200, .14, .6, -.6);
clique(10.6); whoosh(10.7, .32, 800, 3200, 1200, .14, .6, -.6);
// foto sai do celular → filmes
subida(11.1, .9, .35); impacto(12.0, .65);
// cortes dos filmes
[13.0, 14.0, 15.0].forEach(t => whoosh(t - .2, .45, 600, 4200, 1500, .22, -.3, .3));
pop(12.92, .08); pop(13.14, .07); pop(13.36, .07);   // chips
// valores: toques e números rolando
clique(18.0); clique(18.75);
for (let k = 0; k < 6; k++) { tique(18.06 + k * .045); tique(18.81 + k * .045); }
pop(19.12, .12);
// portão fecha com o logotipo
subida(22.1, .9, .5); impacto(23.0, 1);
pop(23.98, .12); clique(24.9, .2);

/* ---------------- reverb (Freeverb simplificado) ---------------- */
function reverb(inp, desloc) {
  const combs = [1557, 1617, 1491, 1422, 1277, 1356, 1188, 1116].map(d => ({ buf: new Float32Array(d + desloc), i: 0, f: 0 }));
  const aps = [556, 441, 341, 225].map(d => ({ buf: new Float32Array(d + desloc), i: 0 }));
  const out = new Float32Array(N), fb = .84, damp = .25;
  for (let n = 0; n < N; n++) {
    let s = 0; const x = inp[n] * .015;
    for (const c of combs) { const y = c.buf[c.i]; c.f = y * (1 - damp) + c.f * damp; c.buf[c.i] = x + c.f * fb; c.i = (c.i + 1) % c.buf.length; s += y; }
    for (const a of aps) { const b = a.buf[a.i]; const y = -s + b; a.buf[a.i] = s + b * .5; a.i = (a.i + 1) % a.buf.length; s = y; }
    out[n] = s;
  }
  return out;
}
const wl = reverb(RL, 0), wr = reverb(RR, 23);

/* ---------------- mixagem final ---------------- */
let pico = 0;
const OL = new Float32Array(N), OR = new Float32Array(N);
for (let i = 0; i < N; i++) {
  const t = i / SR;
  const fade = t > 25.6 ? Math.max(0, (26.5 - t) / .9) : 1;
  OL[i] = Math.tanh((L[i] + wl[i] * 1.0) * .9) * fade;
  OR[i] = Math.tanh((R[i] + wr[i] * 1.0) * .9) * fade;
  pico = Math.max(pico, Math.abs(OL[i]), Math.abs(OR[i]));
}
const ganho = .89 / pico;
const buf = Buffer.alloc(44 + N * 4);
buf.write('RIFF', 0); buf.writeUInt32LE(36 + N * 4, 4); buf.write('WAVE', 8); buf.write('fmt ', 12);
buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22); buf.writeUInt32LE(SR, 24);
buf.writeUInt32LE(SR * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34); buf.write('data', 36); buf.writeUInt32LE(N * 4, 40);
for (let i = 0; i < N; i++) {
  buf.writeInt16LE(Math.round(clamp(OL[i] * ganho, -1, 1) * 32767), 44 + i * 4);
  buf.writeInt16LE(Math.round(clamp(OR[i] * ganho, -1, 1) * 32767), 46 + i * 4);
}
fs.mkdirSync(path.join(__dirname, 'saida'), { recursive: true });
fs.writeFileSync(path.join(__dirname, 'saida', 'trilha.wav'), buf);
console.log('trilha.wav', DUR, 's, pico antes da normalização', pico.toFixed(3));
