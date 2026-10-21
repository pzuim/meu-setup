// Componentes visuais compartilhados: ícones, cabeçalho, avisos, diálogos e campos.

import { h, hoje } from './util.js';
import { voltar } from './nav.js';

const ICONES = {
  voltar: '<path d="M15 5l-7 7 7 7"/>',
  fechar: '<path d="M6 6l12 12M18 6L6 18"/>',
  mais: '<path d="M12 5v14M5 12h14"/>',
  baixo: '<path d="M6 9l6 6 6-6"/>',
  direita: '<path d="M9 6l6 6-6 6"/>',
  sobe: '<path d="M12 19V5M6 11l6-6 6 6"/>',
  desce: '<path d="M12 5v14M6 13l6 6 6-6"/>',
  igual: '<path d="M6 10h12M6 14h12"/>',
  raquete: '<g transform="rotate(40 12 12)"><ellipse cx="12" cy="8" rx="5.4" ry="6.6"/><path d="M12 14.6V23"/><path d="M9.6 2.6v10.8M14.4 2.6v10.8M6.8 6h10.4M6.8 10h10.4" stroke-width="1" opacity=".75"/></g>',
  historico: '<path d="M3.5 12a8.5 8.5 0 1 0 2.6-6.1"/><path d="M3 4.5V9h4.5"/><path d="M12 7.5V12l3 2"/>',
  entenda: '<path d="M9.5 18h5M10.5 21h3"/><path d="M12 3a6 6 0 0 0-3.6 10.8c.7.5 1.1 1.3 1.1 2.1V16h5v-.1c0-.8.4-1.6 1.1-2.1A6 6 0 0 0 12 3z"/>',
  ajustes: '<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>',
  editar: '<path d="M4 20h4L19 9l-4-4L4 16v4z"/><path d="M14 6l4 4"/>',
  trocar: '<path d="M4 8h14l-3-3M20 16H6l3 3"/>',
  lixo: '<path d="M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13"/>',
  baixar: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
  enviar: '<path d="M12 20V9M7 14l5-5 5 5M5 4h14"/>',
  compartilhar: '<circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M8.2 10.8l7.6-3.6M8.2 13.2l7.6 3.6"/>',
  raio: '<path d="M13 3L5 14h6l-1 7 8-11h-6l1-7z"/>',
  comparar: '<path d="M7 4v16M17 4v16M3 8l4-4 4 4M13 16l4 4 4-4"/>',
  remover: '<circle cx="12" cy="12" r="8.5"/><path d="M8 12h8"/>',
  cima: '<path d="M6 15l6-6 6 6"/>',
  tensao: '<path d="M4 17a8 8 0 1 1 16 0"/><path d="M12 17l4-5"/>',
  tipos: '<path d="M12 4l8 4-8 4-8-4 8-4z"/><path d="M4 12l8 4 8-4M4 16l8 4 8-4"/>',
  calibre: '<circle cx="12" cy="12" r="5.5"/><path d="M2.5 12h4M17.5 12h4"/>',
  peso: '<path d="M8.5 8a3.5 3.5 0 1 1 7 0"/><path d="M5.5 8h13l2 12h-17l2-12z"/>',
  cabeca: '<ellipse cx="12" cy="9.5" rx="6.5" ry="7.5"/><path d="M12 17v4.5"/><path d="M8.5 6.5l7 6M8.5 12.5l7-6" opacity=".5"/>',
  padrao: '<ellipse cx="12" cy="12" rx="7.5" ry="9"/><path d="M9.5 3.6v16.8M14.5 3.6v16.8M4.6 9h14.8M4.6 15h14.8"/>',
  rigidez: '<path d="M3 12c3-6 6 6 9 0s6 6 9 0"/>',
  balanco: '<path d="M12 4v16M6 20h12M3.5 10l3-5.5 3 5.5a3 3 0 0 1-6 0zM14.5 10l3-5.5 3 5.5a3 3 0 0 1-6 0zM6.5 4.5h11"/>',
};

export function icone(nome, classe = '') {
  const s = document.createElement('span');
  s.className = ('ic ' + classe).trim();
  s.setAttribute('aria-hidden', 'true');
  s.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICONES[nome] || ''}</svg>`;
  return s;
}

export function cabecalho(titulo, voltarPara = '/', extra = null) {
  return h('header', { class: 'pg-cab' },
    h('button', { class: 'btn-icone', type: 'button', 'aria-label': 'Voltar', onclick: () => voltar(voltarPara) }, icone('voltar')),
    h('h1', null, titulo),
    extra || h('span', { class: 'pg-cab-vazio' }));
}

export function amostra(hex, titulo = '') {
  return h('span', { class: 'amostra', style: `--c:${hex || '#888888'}`, title: titulo || null });
}

export function aviso(msg) {
  const caixa = document.getElementById('avisos');
  const el = h('div', { class: 'aviso' }, msg);
  caixa.append(el);
  setTimeout(() => el.classList.add('sai'), 2400);
  setTimeout(() => el.remove(), 2800);
}

export function campo(rotulo, controle, ...extras) {
  const simples = extras.length === 0 && ['INPUT', 'SELECT', 'TEXTAREA'].includes(controle.tagName);
  return h(simples ? 'label' : 'div', { class: 'campo' }, h('span', { class: 'campo-rot' }, rotulo), controle, ...extras);
}

export function bloco(titulo, texto) {
  if (!texto) return null;
  return h('div', { class: 'bloco' }, h('h3', null, titulo), h('p', null, texto));
}

export const naoEncontrado = (msg) => h('p', { class: 'vazio' }, msg);

// ---------- Tema ----------

export function temaAtual() {
  return document.documentElement.dataset.theme || 'escuro';
}

export function aplicarTema(tema, salvar = true) {
  document.documentElement.dataset.theme = tema;
  if (salvar) {
    try { localStorage.setItem('ar.tema', tema); } catch { /* sem armazenamento: vale só nesta sessão */ }
  }
  const bg = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim();
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', bg || '#0e1012');
}

// ---------- Diálogos ----------

function abrirDialogo(montar) {
  return new Promise((resolve) => {
    let raiz;
    const fechar = (valor) => {
      raiz.classList.remove('aberto');
      setTimeout(() => raiz.remove(), 220);
      resolve(valor);
    };
    raiz = h('div', { class: 'dialogo' },
      h('div', { class: 'dialogo-fundo', onclick: () => fechar(null) }),
      h('div', { class: 'dialogo-caixa', role: 'alertdialog', 'aria-modal': 'true', tabindex: '-1' }, montar(fechar)));
    document.body.append(raiz);
    void raiz.offsetWidth; // força o layout inicial para a transição de entrada acontecer
    raiz.classList.add('aberto');
    raiz.querySelector('.dialogo-caixa').focus({ preventScroll: true });
  });
}

export async function confirmar({ titulo, texto, ok = 'Confirmar', cancelar = 'Cancelar', perigo = false }) {
  const r = await abrirDialogo((fechar) => [
    h('h2', null, titulo),
    texto ? h('p', null, texto) : null,
    h('div', { class: 'dialogo-acoes' },
      h('button', { class: 'btn btn-sec', type: 'button', onclick: () => fechar(false) }, cancelar),
      h('button', { class: perigo ? 'btn btn-perigo-cheio' : 'btn', type: 'button', onclick: () => fechar(true) }, ok)),
  ]);
  return r === true;
}

// Pede data e motivo (corda estourou, corda removida).
export function pedirDataMotivo({ titulo, texto, ok = 'Registrar', sugestoes = [], perigo = false }) {
  return abrirDialogo((fechar) => {
    const data = h('input', { type: 'date', class: 'campo-input', value: hoje(), max: hoje() });
    const motivo = h('input', { type: 'text', class: 'campo-input', placeholder: 'Opcional', maxlength: '160' });
    const chips = sugestoes.length
      ? h('div', { class: 'chips' }, sugestoes.map((s) => h('button', { type: 'button', class: 'chip', onclick: () => { motivo.value = s; } }, s)))
      : null;
    return [
      h('h2', null, titulo),
      texto ? h('p', null, texto) : null,
      campo('Data', data),
      chips ? campo('Motivo', motivo, chips) : campo('Motivo', motivo),
      h('div', { class: 'dialogo-acoes' },
        h('button', { class: 'btn btn-sec', type: 'button', onclick: () => fechar(null) }, 'Cancelar'),
        h('button', {
          class: perigo ? 'btn btn-perigo-cheio' : 'btn',
          type: 'button',
          onclick: () => fechar({ data: data.value || hoje(), motivo: motivo.value.trim() }),
        }, ok)),
    ];
  });
}
