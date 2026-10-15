// Folha de contato: node folha.js <pasta> <colunas> <largura-miniatura> <saida.png> [filtro-de-nome]
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const [dir, cols = 8, w = 270, out, filtro = ''] = process.argv.slice(2);
const files = fs.readdirSync(dir).filter(f => /\.(png|jpg)$/.test(f) && f.includes(filtro)).sort();
const c = +cols, rows = Math.ceil(files.length / c);
const args = ['-v', 'error', '-y'];
files.forEach(f => args.push('-i', path.join(dir, f)));
const parts = files.map((_, i) => `[${i}]scale=${w}:-1[v${i}]`);
const h = Math.round(w * 1920 / 1080);
const layout = files.map((_, i) => `${(i % c) * w}_${Math.floor(i / c) * h}`).join('|');
const fc = parts.join(';') + ';' + files.map((_, i) => `[v${i}]`).join('') + (files.length > 1 ? `xstack=inputs=${files.length}:layout=${layout}:fill=black` : 'null');
args.push('-filter_complex', fc, '-frames:v', '1', out);
execFileSync('ffmpeg', args, { stdio: 'inherit' });
console.log(out, files.length, 'quadros', rows, 'linhas');
