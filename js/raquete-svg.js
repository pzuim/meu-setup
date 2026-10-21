// Ilustração da raquete em SVG, com proporções de uma raquete real:
// cabeça em formato de ovo (mais larga no terço superior), aro que continua nos braços
// da garganta, ponte curva na base do encordoado, cabo longo com overgrip e tampa.
// A pintura vem da ficha da raquete (estilo, formato, listras, cores e logotipo);
// a corda vem do setup (cor das verticais e horizontais).

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

// Expoentes da superelipse no topo e na base do aro (2 = elipse; maior = mais quadrado).
const EXPOENTES = { oval: [2.15, 2], isometrica: [2.7, 2.1], quadrada: [3.3, 2.4] };

// Proporções medidas numa raquete real de 100 pol² (unidades ≈ mm).
const CX = 160;
const LARGURA = 121; // meia-largura máxima da linha central do aro
const ALTURA = 312; // do topo do aro até a ponte
const PONTE = 372; // altura (y) da ponte
const FIM_BRACOS = 516; // onde os braços encontram o cabo
const POS_LARGA = 0.39; // parte mais larga, em fração da altura a partir do topo
const RAZAO_PONTE = 0.48; // largura na ponte / largura máxima
const CORTE_BASE = 0.68; // estilo "base": onde termina a cor do topo (0 = topo, 1 = ponte)
const FUNDO = 832;

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
const contraste = (cor) => (luminancia(cor) > 0.45 ? '#1d1d1f' : '#f4f4f2');
const escapar = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

// Nome curto da linha para imprimir no aro: "Speed Pro" → SPEED, "Pure Aero Gen9" → PURE AERO.
function nomeDaLinha(modelo) {
  const p = String(modelo || '').trim().split(/\s+/).filter(Boolean);
  if (!p.length) return '';
  const tem = (w) => /\d/.test(w) || /^(mp|pro|tour|team|lite|gen|plus|\+|l|ul|xl|s)$/i.test(w);
  if (p[0].length <= 4 && p[1] && !tem(p[1])) return `${p[0]} ${p[1]}`.toUpperCase();
  return p[0].toUpperCase();
}

/**
 * @param r raquete (cabeca, padrao, marca, modelo, estilo, formato, listras, logotipo,
 *          corPrincipal, corSecundaria, corDetalhe, corGrip, corHaste)
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
  const embaixo = estilo === 'base' || estilo === 'degrade';
  const H = corSegura(r.corHaste, embaixo ? B : A);
  const listras = Boolean(r.listras);
  const logotipo = r.logotipo !== false;

  // ---------- Geometria ----------
  const area = Number(r.cabeca) >= 85 && Number(r.cabeca) <= 125 ? Number(r.cabeca) : 100;
  const s = Math.sqrt(area / 100);
  const a = LARGURA * s;
  const L = ALTURA * s;
  const Y = PONTE;
  const T = Y - L;
  const fw = 13; // aro
  const fb = 16; // braços
  const fp = 11; // ponte
  // Cabeça = dois arcos de superelipse: topo curto (até a parte mais larga) e base longa (até a ponte).
  const [nT, nB] = EXPOENTES[formato];
  const yLarga = T + POS_LARGA * L;
  const bTopo = yLarga - T;
  const bBase = (Y - yLarga) / Math.sqrt(1 - RAZAO_PONTE ** 2);
  const phiPonte = Math.PI - Math.acos(Math.pow((Y - yLarga) / bBase, nB / 2));
  // Ponto do aro no ângulo phi (0 = topo, pi/2 = parte mais larga, phiPonte = ponte).
  const ptAng = (ld, phi) => {
    const sn = Math.abs(Math.sin(phi));
    const cs = Math.cos(phi);
    if (phi <= Math.PI / 2) return [CX + ld * a * sn ** (2 / nT), yLarga - bTopo * Math.abs(cs) ** (2 / nT)];
    return [CX + ld * a * sn ** (2 / nB), yLarga + bBase * Math.abs(cs) ** (2 / nB)];
  };
  const pt = (ld, sx) => ptAng(ld, sx * phiPonte); // sx: 0 = topo, 1 = ponte
  const meiaEm = (y) => (y <= yLarga
    ? a * Math.max(0, 1 - ((yLarga - y) / bTopo) ** nT) ** (1 / nT)
    : a * Math.max(0, 1 - ((y - yLarga) / bBase) ** nB) ** (1 / nB));
  const wY = pt(1, 1)[0] - CX;
  const topo = f(T - fw / 2 - 14);

  // Lateral do aro, de s0 a s1 (0 = topo, 1 = ponte), no lado ld (-1 esquerda, 1 direita).
  const lado = (ld, s0, s1, n = 36) => {
    let d = '';
    for (let i = 0; i <= n; i++) {
      const [x, y] = pt(ld, s0 + ((s1 - s0) * i) / n);
      d += (i ? 'L' : 'M') + f(x) + ',' + f(y);
    }
    return d;
  };
  const continua = (d) => d.replace(/^M/, 'L');

  // Braços: continuação do aro, convergindo até o cabo.
  const [x0, y0] = pt(1, 1);
  const [x1, y1] = pt(1, 0.995);
  const nt = Math.hypot(x0 - x1, y0 - y1) || 1;
  const tx = (x0 - x1) / nt;
  const ty = (y0 - y1) / nt;
  const pontosBraco = (ld) => [
    [CX + ld * wY, Y],
    [CX + ld * (wY + tx * 46), Y + ty * 46],
    [CX + ld * 17, FIM_BRACOS - 46],
    [CX + ld * 11, FIM_BRACOS],
  ].map(([x, y]) => `${f(x)},${f(y)}`);
  const [e0, e1, e2, e3] = pontosBraco(-1);
  const [d0, d1, d2, d3] = pontosBraco(1);
  const bracoE = `M${e0} C${e1} ${e2} ${e3}`;
  const bracoD = `M${d0} C${d1} ${d2} ${d3}`;
  const bracoDSubindo = `M${d3} C${d2} ${d1} ${d0}`;
  const quadro = `M${e3} C${e2} ${e1} ${e0}` + continua(lado(-1, 1, 0)) + continua(lado(1, 0, 1)) + ` C${d1} ${d2} ${d3}`;
  const ponte = `M${f(CX + wY)},${Y} Q${CX},${Y + 20} ${f(CX - wY)},${Y}`;
  const leitoPath = lado(1, 0, 1) + ` Q${CX},${Y + 20} ${f(CX - wY)},${Y}` + continua(lado(-1, 1, 0)) + 'Z';

  // ---------- Pintura ----------
  const corEm = (ld, sx) => {
    switch (estilo) {
      case 'lados': return ld > 0 && sx > 0.04 ? B : A;
      case 'painel': return ld > 0 && sx >= 0.2 && sx <= 0.62 ? B : A;
      case 'lateral': return sx >= 0.48 && sx <= 0.75 ? B : A;
      case 'topo': return sx <= 0.32 ? B : A;
      case 'base': return sx < CORTE_BASE ? A : B;
      case 'degrade': return sx < 0.45 ? A : B;
      default: return A;
    }
  };
  const segmentos = {
    solido: [[-1, 0.17, 0.29], [1, 0.17, 0.29]],
    lados: [[1, 0.04, 1]],
    painel: [[1, 0.2, 0.62]],
    lateral: [[-1, 0.48, 0.75], [1, 0.48, 0.75]],
    topo: [[-1, 0, 0.32], [1, 0, 0.32]],
  }[estilo] || [];
  const larguraSeg = estilo === 'solido' ? fw - 5 : fw;
  const corAro = embaixo ? `url(#${u}-vert)` : A;
  const corBracoE = embaixo ? B : A;
  const corBracoD = embaixo || estilo === 'lados' ? B : A;
  const corPonte = embaixo ? B : A;
  const bumper = misturar(corEm(1, 0), '#000000', luminancia(corEm(1, 0)) > 0.5 ? 0.1 : 0.4);
  const fracBase = (pt(1, estilo === 'base' ? CORTE_BASE : 0.45)[1] - T) / (FIM_BRACOS - T);
  const paradas = estilo === 'base'
    ? [[0, A], [fracBase - 0.025, A], [fracBase + 0.025, B], [1, B]]
    : [[0, A], [fracBase * 0.55, A], [Math.min(0.95, fracBase * 1.35), B], [1, B]];
  const listraGrip = luminancia(G) < 0.08 ? misturar(G, '#ffffff', 0.14) : misturar(G, '#000000', 0.22);

  // ---------- Cordas e ilhoses ----------
  const [M, C] = padraoCordas(r.padrao);
  const dx = (2 * a * 0.86) / (M - 1);
  const dy = (0.93 * L) / (C - 1);
  const xs = Array.from({ length: M }, (_, i) => CX + (i - (M - 1) / 2) * dx);
  const ys = Array.from({ length: C }, (_, j) => T + 0.045 * L + j * dy);

  // Ilhoses: onde cada corda entra no aro.
  const ilhoses = [];
  for (const x of xs) {
    const k = Math.min(1, Math.abs(x - CX) / a);
    ilhoses.push([x, yLarga - bTopo * (1 - k ** nT) ** (1 / nT)]);
    if (Math.abs(x - CX) <= wY) {
      const t = (1 - (x - CX) / wY) / 2;
      ilhoses.push([x, Y + 40 * t * (1 - t)]);
    } else {
      ilhoses.push([x, yLarga + bBase * (1 - k ** nB) ** (1 / nB)]);
    }
  }
  for (const y of ys) {
    const w = meiaEm(y);
    ilhoses.push([CX - w, y], [CX + w, y]);
  }

  let leito = '';
  if (estado !== 'vazia') {
    const cv = corSegura(corV, '#e9dfc6');
    const ch = corSegura(corH, cv);
    const horiz = ys.map((y) => `M${f(CX - a - 10)},${f(y)}H${f(CX + a + 10)}`).join('');
    const yq = T + 0.42 * L;
    const q = Math.floor(M / 2) - 1;
    let vert = '';
    let pontas = '';
    xs.forEach((x, i) => {
      if (estado === 'estourada' && (i === q || i === q + 1)) {
        const dir = i === q ? -1 : 1;
        vert += `M${f(x)},${f(T - 6)}V${f(yq - 16)}M${f(x)},${f(yq + 18)}V${Y + 26}`;
        pontas += `M${f(x)},${f(yq - 16)}q0,8 ${dir * 9},13M${f(x)},${f(yq + 18)}q0,-7 ${-dir * 8},-12`;
      } else {
        vert += `M${f(x)},${f(T - 6)}V${Y + 26}`;
      }
    });
    const sombra = 'rgba(0,0,0,.4)';
    leito = `
      <g clip-path="url(#${u}-leito)" class="${estado === 'estourada' ? 'r-cordas r-estourada' : 'r-cordas'}" fill="none" stroke-linecap="round">
        <path d="${horiz}" stroke="${sombra}" stroke-width="2.9"/>
        <path d="${horiz}" stroke="${ch}" stroke-width="1.7"/>
        <path d="${vert}" stroke="${sombra}" stroke-width="3"/>
        <path d="${vert}" stroke="${cv}" stroke-width="1.8"/>
        ${pontas ? `<path d="${pontas}" stroke="${cv}" stroke-width="1.8"/>` : ''}
      </g>`;
  }

  // ---------- Detalhes ----------
  const listraBracos = listras
    ? `<path d="${bracoE} ${bracoD}" stroke="${D}" stroke-width="${fb - 4}" stroke-linecap="butt" stroke-dasharray="2.4 6"/>`
    : embaixo || estilo === 'lados'
      ? ''
      : `<path d="${bracoE} ${bracoD}" stroke="${D}" stroke-width="2.2" opacity=".85"/>`;
  const listraAro = listras
    ? `<path d="${lado(-1, 0.55, 1)} ${lado(1, 0.55, 1)}" stroke="${D}" stroke-width="${fw - 2}" stroke-linecap="butt" stroke-dasharray="2.4 7"/>`
    : '';
  const cantosPonte = listras || !(estilo === 'base' || estilo === 'solido')
    ? ''
    : `<path d="${lado(-1, 0.94, 1)} ${lado(1, 0.94, 1)}" stroke="${D}" stroke-width="${fw - 4}" stroke-linecap="butt"/>`;

  const marca = logotipo ? escapar(String(r.marca || '').trim().toUpperCase()) : '';
  const linha = logotipo ? escapar(nomeDaLinha(r.modelo)) : '';
  const logos = `
    ${marca ? `<path id="${u}-pbraco" d="${bracoDSubindo}" fill="none"/>
    <text class="r-logo" font-size="12.5" font-weight="800" letter-spacing="1.6" fill="${contraste(corBracoD)}" dominant-baseline="central" text-anchor="middle">
      <textPath href="#${u}-pbraco" startOffset="52%">${marca}</textPath></text>` : ''}
    ${linha ? `<path id="${u}-plado" d="${lado(-1, 0.8, 0.34)}" fill="none"/>
    <text class="r-logo" font-size="9.5" font-weight="700" letter-spacing="2.6" fill="${contraste(corEm(-1, 0.57))}" dominant-baseline="central" text-anchor="middle">
      <textPath href="#${u}-plado" startOffset="50%">${linha}</textPath></text>` : ''}`;

  const zonas = interativo
    ? `
      <path class="zona zona-cabo" data-zona="cabo" role="button" tabindex="0" aria-label="Ver detalhes da raquete"
        d="M${f(CX - wY - 14)},${Y - 4} L${f(CX + wY + 14)},${Y - 4} L${CX + 34},${FIM_BRACOS} L${CX + 34},${FUNDO} L${CX - 34},${FUNDO} L${CX - 34},${FIM_BRACOS} Z"/>
      <path class="zona zona-cabeca" data-zona="cabeca" role="button" tabindex="0" aria-label="Ver corda instalada"
        d="${leitoPath}" stroke-width="${fw + 12}"/>
      <path class="realce realce-cabeca" d="${leitoPath}" transform="translate(${CX} ${f(T + L / 2)}) scale(1.075) translate(${-CX} ${f(-(T + L / 2))})"/>
      <rect class="realce realce-cabo" x="${CX - 27}" y="${FIM_BRACOS + 10}" width="54" height="${FUNDO - FIM_BRACOS - 6}" rx="16"/>`
    : '';

  return `
<svg class="raquete" viewBox="0 ${topo} 320 ${f(FUNDO + 6 - topo)}" xmlns="http://www.w3.org/2000/svg" ${interativo ? 'role="group"' : 'aria-hidden="true"'}>
  <defs>
    <linearGradient id="${u}-vert" gradientUnits="userSpaceOnUse" x1="0" y1="${f(T)}" x2="0" y2="${FIM_BRACOS}">
      ${paradas.map(([o, c]) => `<stop offset="${f(Math.max(0, Math.min(1, o)) * 100) / 100}" stop-color="${c}"/>`).join('')}
    </linearGradient>
    <linearGradient id="${u}-brilho" gradientUnits="userSpaceOnUse" x1="${f(CX - a - fw)}" y1="0" x2="${f(CX + a + fw)}" y2="0">
      <stop offset="0" stop-color="#000" stop-opacity=".14"/><stop offset=".14" stop-color="#000" stop-opacity="0"/>
      <stop offset=".86" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".18"/>
    </linearGradient>
    <linearGradient id="${u}-cil" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#000" stop-opacity=".4"/><stop offset=".3" stop-color="#fff" stop-opacity=".16"/>
      <stop offset=".55" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".45"/>
    </linearGradient>
    <pattern id="${u}-grip" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(-32)">
      <rect width="8" height="8" fill="${G}"/><rect width="8" height="1.2" fill="${listraGrip}"/>
    </pattern>
    <clipPath id="${u}-leito"><path d="${leitoPath}"/></clipPath>
  </defs>

  <path class="r-leito${estado === 'vazia' ? ' r-leito-vazio' : ''}" d="${leitoPath}"/>
  ${leito}

  <g fill="none" stroke-linecap="round" stroke-linejoin="round">
    <path class="r-cont" d="${quadro}" stroke-width="${fw + 3}"/>
    <path class="r-cont" d="${bracoE} ${bracoD}" stroke-width="${fb + 3}"/>
    <path class="r-cont" d="${ponte}" stroke-width="${fp + 3}"/>
    <path d="${ponte}" stroke="${corPonte}" stroke-width="${fp}"/>
    <path d="${quadro}" stroke="${corAro}" stroke-width="${fw}"/>
    <path d="${bracoE}" stroke="${corBracoE}" stroke-width="${fb}"/>
    <path d="${bracoD}" stroke="${corBracoD}" stroke-width="${fb}"/>
    ${segmentos.map(([ld, a0, a1]) => `<path d="${lado(ld, a0, a1)}" stroke="${B}" stroke-width="${larguraSeg}" stroke-linecap="butt"/>`).join('')}
    ${listraAro}
    ${cantosPonte}
    ${listraBracos}
    <path d="${lado(-1, 0.09, 0)} ${lado(1, 0, 0.09)}" stroke="${bumper}" stroke-width="${fw + 1.5}" stroke-linecap="butt"/>
    <path d="${quadro} ${ponte}" stroke="url(#${u}-brilho)" stroke-width="${fw}"/>
    <path d="${quadro}" stroke="#fff" stroke-width="2.6" opacity=".16"/>
  </g>
  <g fill="rgba(0,0,0,.42)">${ilhoses.map(([x, y]) => `<circle cx="${f(x)}" cy="${f(y)}" r="1.5"/>`).join('')}</g>
  ${logos}

  <path class="r-borda" d="M${CX - 13},${FIM_BRACOS - 10} L${CX + 13},${FIM_BRACOS - 10} L${CX + 16},${FIM_BRACOS + 20} L${CX - 16},${FIM_BRACOS + 20} Z" fill="${H}"/>
  <path d="M${CX - 13},${FIM_BRACOS - 10} L${CX + 13},${FIM_BRACOS - 10} L${CX + 16},${FIM_BRACOS + 20} L${CX - 16},${FIM_BRACOS + 20} Z" fill="url(#${u}-cil)"/>
  <rect class="r-borda" x="${CX - 18}" y="${FIM_BRACOS + 15}" width="36" height="9" rx="2" fill="${B}"/>
  <path class="r-borda" d="M${CX - 17},${FIM_BRACOS + 23} L${CX + 17},${FIM_BRACOS + 23} L${CX + 17.5},${FUNDO - 34} Q${CX + 18},${FUNDO - 22} ${CX + 20},${FUNDO - 18} L${CX - 20},${FUNDO - 18} Q${CX - 18},${FUNDO - 22} ${CX - 17.5},${FUNDO - 34} Z" fill="url(#${u}-grip)"/>
  <path d="M${CX - 17},${FIM_BRACOS + 23} L${CX + 17},${FIM_BRACOS + 23} L${CX + 17.5},${FUNDO - 34} Q${CX + 18},${FUNDO - 22} ${CX + 20},${FUNDO - 18} L${CX - 20},${FUNDO - 18} Q${CX - 18},${FUNDO - 22} ${CX - 17.5},${FUNDO - 34} Z" fill="url(#${u}-cil)"/>
  <rect x="${CX - 17}" y="${FIM_BRACOS + 23}" width="34" height="8" fill="#1e1e1e" opacity=".85"/>
  <rect class="r-borda" x="${CX - 21}" y="${FUNDO - 19}" width="42" height="17" rx="6" fill="${B}"/>
  <rect x="${CX - 21}" y="${FUNDO - 19}" width="42" height="17" rx="6" fill="url(#${u}-cil)"/>
  ${zonas}
</svg>`;
}
