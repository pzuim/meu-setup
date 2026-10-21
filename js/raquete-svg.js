// Ilustração estilizada da raquete em SVG.
// A pintura vem da ficha da raquete: estilo, formato da cabeça, listras e cinco cores
// (principal, secundária, detalhe, grip e haste). A corda vem do setup (verticais/horizontais).
// A densidade do leito segue o padrão de encordoamento e o tamanho do aro acompanha a área da cabeça.

import { corSegura, misturar, luminancia } from './util.js';

export const ESTILOS = {
  solido: 'Cor única com detalhes',
  lados: 'Dois lados (esquerda e direita)',
  painel: 'Painel no lado direito',
  lateral: 'Faixas nas laterais',
  topo: 'Topo colorido',
  base: 'Topo e base em cores diferentes',
  degrade: 'Degradê de cima para baixo',
};

export const FORMATOS = {
  oval: 'Oval',
  isometrica: 'Isométrica (mais quadrada no topo)',
  quadrada: 'Quadrada',
};

// Expoente da superelipse no topo e na base do aro (2 = elipse).
const EXPOENTES = { oval: [2, 2], isometrica: [2.7, 2.2], quadrada: [3.4, 2.5] };

export function padraoCordas(txt) {
  const m = /(\d{1,2})\s*[x×/]\s*(\d{1,2})/i.exec(txt || '');
  if (m) {
    const a = Number(m[1]);
    const b = Number(m[2]);
    if (a >= 12 && a <= 22 && b >= 12 && b <= 24) return [a, b];
  }
  return [16, 19];
}

const f = (n) => Math.round(n * 10) / 10;

/**
 * @param r raquete (cabeca, padrao, estilo, formato, listras, corPrincipal, corSecundaria, corDetalhe, corGrip, corHaste)
 * @param opcoes.estado 'ativa' | 'estourada' | 'vazia'
 * @param opcoes.corV / corH cor das verticais / horizontais
 * @param opcoes.interativo cria as áreas de toque (cabeça e cabo)
 */
export function desenharRaquete(r, { estado = 'vazia', corV, corH, interativo = false } = {}) {
  const u = 'r' + Math.random().toString(36).slice(2, 8);
  const estilo = ESTILOS[r.estilo] ? r.estilo : 'solido';
  const formato = FORMATOS[r.formato] ? r.formato : 'oval';
  const A = corSegura(r.corPrincipal, '#ebebe6');
  const B = corSegura(r.corSecundaria, '#1c1c1c');
  const D = corSegura(r.corDetalhe, B);
  const G = corSegura(r.corGrip, '#2a2a2a');
  const H = corSegura(r.corHaste, estilo === 'degrade' ? B : A);
  const listras = Boolean(r.listras);

  const area = Number(r.cabeca) >= 85 && Number(r.cabeca) <= 125 ? Number(r.cabeca) : 100;
  const s = Math.sqrt(area / 100);
  const cx = 160;
  const fw = 15; // espessura do aro
  const rx = 118 * s;
  const ry = 155 * s;
  const cy = 400 - ry;
  const topo = f(cy - ry - fw / 2 - 16);
  const fundo = 826;
  const [M, C] = padraoCordas(r.padrao);
  const [nTopo, nBase] = EXPOENTES[formato];

  // Ponto do aro no ângulo t (graus; 0 = 3h, 90 = 6h, 180 = 9h, 270 = 12h).
  const ponto = (t, a = rx, b = ry) => {
    const rad = (t * Math.PI) / 180;
    const c = Math.cos(rad);
    const sn = Math.sin(rad);
    const e = 2 / (sn < 0 ? nTopo : nBase);
    return [cx + a * Math.sign(c) * Math.abs(c) ** e, cy + b * Math.sign(sn) * Math.abs(sn) ** e];
  };
  const arco = (de, ate, a, b) => {
    const pts = [];
    for (let t = de; t < ate; t += 2) pts.push(ponto(t, a, b));
    pts.push(ponto(ate, a, b));
    return 'M' + pts.map(([x, y]) => `${f(x)},${f(y)}`).join('L');
  };
  const aro = arco(0, 360) + 'Z';
  const bx = rx - fw / 2 + 0.5;
  const by = ry - fw / 2 + 0.5;
  const interno = arco(0, 360, bx, by) + 'Z';

  // Braços da garganta: saem tangentes ao aro e convergem na haste.
  const [ax, ay] = ponto(145);
  const [px, py] = ponto(144);
  let tx = px - ax;
  let ty = py - ay;
  const n = Math.hypot(tx, ty) || 1;
  tx /= n;
  ty /= n;
  const braco = (lado) => {
    const x = (v) => f(lado < 0 ? v : 2 * cx - v);
    return `M${x(ax)},${f(ay)} C${x(ax + 60 * tx)},${f(ay + 60 * ty)} ${x(cx - 24)},500 ${x(cx - 8)},556`;
  };
  const bracoE = braco(-1);
  const bracoD = braco(1);
  const bracos = bracoE + ' ' + bracoD;
  const corBracoE = estilo === 'degrade' || estilo === 'base' ? B : A;
  const corBracoD = estilo === 'degrade' || estilo === 'base' || estilo === 'lados' ? B : A;

  // Pintura do aro: cor base (ou degradê vertical) + segmentos da cor secundária.
  const vertical = estilo === 'degrade' || estilo === 'base';
  const corAro = vertical ? `url(#${u}-vert)` : A;
  const segmentos = {
    solido: [[200, 230], [310, 340]],
    lados: [[285, 450]],
    painel: [[300, 395]],
    lateral: [[340, 385], [155, 200]],
    topo: [[205, 335]],
  }[estilo] || [];
  const larguraSeg = estilo === 'solido' ? fw - 5 : fw;
  const corTopo = estilo === 'topo' ? B : A;
  const bumper = misturar(corTopo, '#000000', luminancia(corTopo) > 0.5 ? 0.25 : 0.4);
  const listraGrip = luminancia(G) < 0.08 ? misturar(G, '#ffffff', 0.14) : misturar(G, '#000000', 0.28);

  // Leito de cordas
  let leito = '';
  if (estado !== 'vazia') {
    const cv = corSegura(corV, '#e9dfc6');
    const ch = corSegura(corH, cv);
    const dx = (2 * bx * 0.9) / M;
    const dy = (2 * by * 0.93) / C;
    let horiz = '';
    let vert = '';
    let pontas = '';
    for (let j = 0; j < C; j++) {
      const y = f(cy + (j - (C - 1) / 2) * dy);
      horiz += `M${f(cx - bx)},${y}H${f(cx + bx)}`;
    }
    const q = Math.floor(M / 2) - 1;
    const yq = cy - by * 0.12;
    for (let i = 0; i < M; i++) {
      const x = f(cx + (i - (M - 1) / 2) * dx);
      if (estado === 'estourada' && (i === q || i === q + 1)) {
        const dir = i === q ? -1 : 1;
        vert += `M${x},${f(cy - by)}V${f(yq - 16)}M${x},${f(yq + 18)}V${f(cy + by)}`;
        pontas += `M${x},${f(yq - 16)}q0,8 ${dir * 9},13M${x},${f(yq + 18)}q0,-7 ${-dir * 8},-12`;
      } else {
        vert += `M${x},${f(cy - by)}V${f(cy + by)}`;
      }
    }
    const sombra = 'rgba(0,0,0,.38)';
    leito = `
      <g clip-path="url(#${u}-leito)" class="${estado === 'estourada' ? 'r-cordas r-estourada' : 'r-cordas'}" fill="none" stroke-linecap="round">
        <path d="${horiz}" stroke="${sombra}" stroke-width="2.9"/>
        <path d="${horiz}" stroke="${ch}" stroke-width="1.75"/>
        <path d="${vert}" stroke="${sombra}" stroke-width="3"/>
        <path d="${vert}" stroke="${cv}" stroke-width="1.85"/>
        ${pontas ? `<path d="${pontas}" stroke="${cv}" stroke-width="1.85"/>` : ''}
      </g>`;
  }

  const listraBracos = listras
    ? `<path d="${bracos}" stroke="${D}" stroke-width="11" stroke-linecap="butt" stroke-dasharray="2.4 6"/>`
    : estilo === 'base' || estilo === 'degrade' || estilo === 'lados'
      ? ''
      : `<path d="${bracos}" stroke="${D}" stroke-width="2.4" opacity=".9"/>`;
  const listraAro = listras
    ? `<path d="${arco(25, 155)}" stroke="${D}" stroke-width="${fw - 2}" stroke-linecap="butt" stroke-dasharray="2.4 7"/>`
    : '';

  const zonas = interativo
    ? `
      <path class="zona zona-cabo" data-zona="cabo" role="button" tabindex="0" aria-label="Ver detalhes da raquete"
        d="M56,${f(ay + 8)} L264,${f(ay + 8)} L198,566 L200,${fundo} L120,${fundo} L122,566 Z"/>
      <ellipse class="zona zona-cabeca" data-zona="cabeca" role="button" tabindex="0" aria-label="Ver corda instalada"
        cx="${cx}" cy="${f(cy)}" rx="${f(rx + fw / 2 + 4)}" ry="${f(ry + fw / 2 + 4)}"/>
      <path class="realce realce-cabeca" d="${arco(0, 360, rx + fw / 2 + 7, ry + fw / 2 + 7)}Z"/>
      <rect class="realce realce-cabo" x="${cx - 26}" y="584" width="52" height="234" rx="16"/>`
    : '';

  return `
<svg class="raquete" viewBox="0 ${topo} 320 ${f(fundo - topo)}" xmlns="http://www.w3.org/2000/svg" ${interativo ? 'role="group"' : 'aria-hidden="true"'}>
  <defs>
    <linearGradient id="${u}-vert" gradientUnits="userSpaceOnUse" x1="0" y1="${f(cy - ry - fw)}" x2="0" y2="${f(cy + ry + fw)}">
      ${estilo === 'base'
        ? `<stop offset="0" stop-color="${A}"/><stop offset=".47" stop-color="${A}"/><stop offset=".6" stop-color="${B}"/><stop offset="1" stop-color="${B}"/>`
        : `<stop offset="0" stop-color="${A}"/><stop offset=".3" stop-color="${A}"/><stop offset=".85" stop-color="${B}"/><stop offset="1" stop-color="${B}"/>`}
    </linearGradient>
    <linearGradient id="${u}-brilho" gradientUnits="userSpaceOnUse" x1="${f(cx - rx - fw)}" y1="0" x2="${f(cx + rx + fw)}" y2="0">
      <stop offset="0" stop-color="#000" stop-opacity=".3"/><stop offset=".22" stop-color="#000" stop-opacity="0"/>
      <stop offset=".5" stop-color="#fff" stop-opacity=".2"/><stop offset=".78" stop-color="#000" stop-opacity="0"/>
      <stop offset="1" stop-color="#000" stop-opacity=".34"/>
    </linearGradient>
    <linearGradient id="${u}-cil" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#000" stop-opacity=".38"/><stop offset=".32" stop-color="#fff" stop-opacity=".14"/>
      <stop offset=".55" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".42"/>
    </linearGradient>
    <pattern id="${u}-grip" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(-30)">
      <rect width="7" height="7" fill="${G}"/><rect width="7" height="1.3" fill="${listraGrip}"/>
    </pattern>
    <clipPath id="${u}-leito"><path d="${interno}"/></clipPath>
  </defs>

  <path class="r-leito${estado === 'vazia' ? ' r-leito-vazio' : ''}" d="${interno}"/>
  ${leito}

  <g fill="none" stroke-linecap="round">
    <path class="r-cont" d="${bracos}" stroke-width="16.5"/>
    <path class="r-cont" d="${aro}" stroke-width="${fw + 3}"/>
    <path d="${bracoE}" stroke="${corBracoE}" stroke-width="13"/>
    <path d="${bracoD}" stroke="${corBracoD}" stroke-width="13"/>
    <path d="${bracos}" stroke="url(#${u}-brilho)" stroke-width="13"/>
    ${listraBracos}
    <path d="${aro}" stroke="${corAro}" stroke-width="${fw}"/>
    ${segmentos.map(([de, ate]) => `<path d="${arco(de, ate)}" stroke="${B}" stroke-width="${larguraSeg}" stroke-linecap="butt"/>`).join('')}
    ${listraAro}
    <path d="${arco(258, 282)}" stroke="${bumper}" stroke-width="${fw + 1.5}" stroke-linecap="butt"/>
    <path d="${aro}" stroke="url(#${u}-brilho)" stroke-width="${fw}"/>
    <path d="${arco(0, 360, rx - fw / 2 + 1.6, ry - fw / 2 + 1.6)}Z" stroke="${D}" stroke-width="1.4" opacity=".85"/>
    <path d="${arco(0, 360, rx + fw / 2 - 2.5, ry + fw / 2 - 2.5)}Z" stroke="#fff" stroke-width="1.4" opacity=".16"/>
  </g>

  <path class="r-borda" d="M${cx - 13},548 L${cx + 13},548 L${cx + 16},598 L${cx - 16},598 Z" fill="${H}"/>
  <path d="M${cx - 13},548 L${cx + 13},548 L${cx + 16},598 L${cx - 16},598 Z" fill="url(#${u}-cil)"/>
  <rect x="${cx - 4.5}" y="558" width="9" height="28" rx="3" fill="${D}"/>
  <rect class="r-borda" x="${cx - 18}" y="592" width="36" height="9" rx="2" fill="${B}"/>
  <rect class="r-borda" x="${cx - 17}" y="600" width="34" height="191" rx="4" fill="url(#${u}-grip)"/>
  <rect x="${cx - 17}" y="600" width="34" height="191" rx="4" fill="url(#${u}-cil)"/>
  <rect class="r-borda" x="${cx - 20}" y="789" width="40" height="18" rx="6" fill="${B}"/>
  <rect x="${cx - 20}" y="789" width="40" height="18" rx="6" fill="url(#${u}-cil)"/>
  ${zonas}
</svg>`;
}
