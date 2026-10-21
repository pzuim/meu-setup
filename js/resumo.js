// Textos curtos para descrever cordas e setups em listas e painéis.

import { TIPOS_CORDA, cordaH } from './dados.js';
import { fmtCalibre, fmtLbs, fmtNum } from './util.js';

export const nomeCorda = (c) => `${c?.marca || ''} ${c?.modelo || ''}`.trim() || 'Corda sem nome';

export const detalheCorda = (c) =>
  [TIPOS_CORDA[c?.tipo], c?.calibre ? fmtCalibre(c.calibre) : null, c?.corNome].filter(Boolean).join(' · ');

export function tensoesCurtas(s) {
  if (s?.tensaoV == null) return '—';
  const hz = s.tensaoH ?? s.tensaoV;
  return hz === s.tensaoV ? fmtLbs(s.tensaoV) : `${fmtLbs(s.tensaoV)}/${fmtLbs(hz)}`;
}

export function resumoSetup(s) {
  if (!s) return 'Sem corda';
  const v = s.verticais;
  const hz = cordaH(s);
  const cal = (c) => (c?.calibre ? ' ' + fmtNum(c.calibre, 2) : '');
  const cordas = s.horizontais ? `${nomeCorda(v)}${cal(v)} / ${nomeCorda(hz)}${cal(hz)}` : `${nomeCorda(v)}${cal(v)}`;
  return `${cordas} · ${tensoesCurtas(s)} lbs`;
}
