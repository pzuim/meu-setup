// Utilidades gerais: criação de elementos, formatação e cores.

export function h(tag, props, ...filhos) {
  const el = document.createElement(tag);
  anexar(el, filhos);
  if (props) {
    for (const [k, v] of Object.entries(props)) {
      if (v == null || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k === 'value') el.value = v;
      else if (k === 'checked') el.checked = !!v;
      else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? '' : v);
    }
  }
  return el;
}

function anexar(el, filhos) {
  for (const f of filhos.flat(Infinity)) {
    if (f == null || f === false || f === '') continue;
    el.append(f instanceof Node ? f : String(f));
  }
}

export function uid() {
  if (globalThis.crypto?.randomUUID) return crypto.randomUUID();
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}

// ---------- Datas (sempre 'AAAA-MM-DD', no fuso local) ----------

const p2 = (n) => String(n).padStart(2, '0');
const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

export function hoje() {
  const d = new Date();
  return `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`;
}

export const dataValida = (iso) => typeof iso === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(iso);

export function fmtData(iso) {
  if (!dataValida(iso)) return '—';
  const [a, m, d] = iso.split('-');
  return `${d}/${m}/${a}`;
}

export function fmtDataLonga(iso) {
  if (!dataValida(iso)) return '—';
  const [a, m, d] = iso.split('-');
  return `${Number(d)} ${MESES[Number(m) - 1]} ${a}`;
}

export function diasEntre(de, ate) {
  if (!dataValida(de) || !dataValida(ate)) return null;
  const utc = (iso) => { const [a, m, d] = iso.split('-').map(Number); return Date.UTC(a, m - 1, d); };
  return Math.round((utc(ate) - utc(de)) / 86400000);
}

export function fmtDias(n) {
  if (n == null) return '—';
  if (n <= 0) return 'menos de 1 dia';
  return n === 1 ? '1 dia' : `${n} dias`;
}

// ---------- Números (vírgula decimal) ----------

export function fmtNum(n, casas = 0) {
  if (n == null || !Number.isFinite(Number(n))) return '';
  return Number(n).toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas });
}

export function lerNumero(txt) {
  if (txt == null) return null;
  const s = String(txt).trim().replace(',', '.');
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

export const fmtCalibre = (c) => (c ? `${fmtNum(c, 2)} mm` : '—');
export const fmtLbs = (t) => (t == null ? '—' : Number.isInteger(t) ? String(t) : fmtNum(t, 1));

// ---------- Cores ----------

export function corSegura(c, padrao) {
  return typeof c === 'string' && /^#[0-9a-f]{6}$/i.test(c) ? c.toLowerCase() : padrao;
}

const hexRgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const rgbHex = (rgb) => '#' + rgb.map((v) => p2(Math.max(0, Math.min(255, v)).toString(16))).join('');

export function misturar(a, b, t) {
  const pa = hexRgb(a);
  const pb = hexRgb(b);
  return rgbHex(pa.map((v, i) => Math.round(v + (pb[i] - v) * t)));
}

export function luminancia(hex) {
  const [r, g, b] = hexRgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
