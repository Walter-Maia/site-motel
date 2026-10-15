/* Roteiro do celular (cena "o site"): rolagens e toques em coordenadas do site (CSS px, viewport 390x844).
   Usado pelo palco (stage.html) e pela captura (captura-site.js): os dois calculam a mesma rolagem
   para o mesmo instante, então cada quadro do celular é uma foto real do site naquela posição. */
(function (root) {
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const easeOutCubic = p => 1 - Math.pow(1 - p, 3);
  const easeInOutCubic = p => p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;

  // tempos locais da cena (s), contados do início da cena do celular
  const CEL = {
    fps: 30,
    duracao: 4.7,
    // Home: arraste com o dedo (acompanha 1:1) e depois inércia; toque em "Conhecer as 21 suítes"
    home: { rota: '#/', de: 0, arraste: 330, ate: 1110, t0: 1.15, t1: 1.42, t2: 2.05,
            dedo: { x: 195, y: 700, surge: .95 }, toque: { t: 2.1, x: 195, y: 297 } },
    // Suítes: entra já no índice, sobe um pouco e toca na Mexicana
    suites: { rota: '#/suites', de: 2380, ate: 2470, t0: 2.55, t1: 2.95,
              dedo: { x: 205, y: 640, surge: 2.4 }, toque: { t: 3.2, x: 195, y: 206 } },
    // Suíte Mexicana: parada no topo
    mexicana: { rota: '#/suites/mexicana', de: 0, ate: 0, t0: 3.7, t1: 3.71 },
    trocaSuites: [2.22, 2.52],   // empurra a Home para a esquerda e entra Suítes
    trocaMexicana: [3.3, 3.58]
  };

  CEL.rolagemHome = function (t) {
    const h = CEL.home;
    if (t <= h.t0) return h.de;
    if (t <= h.t1) return h.de + h.arraste * ((t - h.t0) / (h.t1 - h.t0));
    const p = clamp((t - h.t1) / (h.t2 - h.t1));
    return h.de + h.arraste + (h.ate - h.de - h.arraste) * easeOutCubic(p);
  };
  CEL.rolagemSuites = function (t) {
    const s = CEL.suites;
    return s.de + (s.ate - s.de) * easeInOutCubic(clamp((t - s.t0) / (s.t1 - s.t0)));
  };
  CEL.rolagem = function (pagina, t) {
    if (pagina === 'home') return Math.round(CEL.rolagemHome(t));
    if (pagina === 'suites') return Math.round(CEL.rolagemSuites(t));
    return 0;
  };
  // todas as posições que o palco vai pedir (inclui subquadros do borrão de movimento), para a captura fotografar
  CEL.posicoes = function (pagina) {
    const set = new Set();
    const passo = 1 / (CEL.fps * 8);
    for (let t = 0; t <= CEL.duracao + 1e-6; t += passo) set.add(CEL.rolagem(pagina, t));
    return Array.from(set).sort((a, b) => a - b);
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = CEL;
  else root.CEL = CEL;
})(this);
