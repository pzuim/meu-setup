// Controles de formulário: seletor de cor, tensão com +/−, segmentado, interruptor e números.

import { h, corSegura, fmtLbs, lerNumero } from './util.js';

export const PALETA_RAQUETE = [
  { nome: 'Branco', hex: '#f1f1ec' }, { nome: 'Preto', hex: '#1b1b1b' }, { nome: 'Grafite', hex: '#3b3f45' },
  { nome: 'Cinza', hex: '#8d9299' }, { nome: 'Vermelho', hex: '#c8102e' }, { nome: 'Vinho', hex: '#7a1a2a' },
  { nome: 'Laranja', hex: '#ef7a1a' }, { nome: 'Amarelo', hex: '#f3d31a' }, { nome: 'Verde-limão', hex: '#b5d334' },
  { nome: 'Verde', hex: '#2f8f4e' }, { nome: 'Verde-escuro', hex: '#2f5546' }, { nome: 'Azul-claro', hex: '#3fa7d6' },
  { nome: 'Azul', hex: '#1f5fcf' }, { nome: 'Azul-marinho', hex: '#14254f' }, { nome: 'Roxo', hex: '#6a3fb5' },
  { nome: 'Rosa', hex: '#e45b9b' },
];

export const PALETA_GRIP = [
  { nome: 'Preto', hex: '#2a2a2a' }, { nome: 'Branco', hex: '#efefea' }, { nome: 'Cinza', hex: '#8d9299' },
  { nome: 'Azul', hex: '#2f6fd6' }, { nome: 'Vermelho', hex: '#c8102e' }, { nome: 'Amarelo', hex: '#f2d64b' },
  { nome: 'Verde', hex: '#3dbf4c' }, { nome: 'Rosa', hex: '#ec6fa8' }, { nome: 'Marrom', hex: '#6b4a32' },
];

export const PALETA_CORDA = [
  { nome: 'Natural', hex: '#e9dfc6' }, { nome: 'Branco', hex: '#f4f4f0' }, { nome: 'Preto', hex: '#202020' },
  { nome: 'Cinza', hex: '#9aa0a6' }, { nome: 'Prata', hex: '#c3c7cc' }, { nome: 'Amarelo', hex: '#f2d64b' },
  { nome: 'Verde', hex: '#3dbf4c' }, { nome: 'Azul', hex: '#2f6fd6' }, { nome: 'Vermelho', hex: '#d43a3a' },
  { nome: 'Laranja', hex: '#f08a24' }, { nome: 'Roxo', hex: '#8a5cd6' }, { nome: 'Rosa', hex: '#ec6fa8' },
];

export function seletorCor({ valor, nome = '', sugestoes = [], paleta = PALETA_CORDA, aoMudar }) {
  let atual = corSegura(valor, paleta[0].hex);
  let nomeAtual = nome;
  const botoes = h('div', { class: 'cores-lista', style: 'display:contents' });
  const personal = h('input', { type: 'color', value: atual, 'aria-label': 'Escolher outra cor' });
  const mais = h('label', { class: 'cor cor-mais', title: 'Outra cor' }, personal);
  const legenda = h('span', { class: 'nome-cor' });

  const lista = () => {
    const vistas = new Set();
    return [...sugestoes, ...paleta].filter((c) => {
      const hex = corSegura(c?.hex, '');
      if (!hex || vistas.has(hex)) return false;
      vistas.add(hex);
      return true;
    });
  };

  function desenhar() {
    const cores = lista();
    const naLista = cores.find((c) => c.hex.toLowerCase() === atual);
    botoes.replaceChildren(...cores.map((c) => {
      const sel = c.hex.toLowerCase() === atual;
      return h('button', {
        type: 'button', class: 'cor' + (sel ? ' sel' : ''), style: `--c:${c.hex}`,
        title: c.nome, 'aria-label': c.nome, 'aria-pressed': String(sel),
        onclick: () => definir(c.hex, c.nome),
      });
    }));
    mais.classList.toggle('sel', !naLista);
    mais.style.setProperty('--c', atual);
    legenda.textContent = nomeAtual || naLista?.nome || 'Personalizada';
  }

  function definir(hex, n = '', silencioso = false) {
    atual = corSegura(hex, atual);
    nomeAtual = n;
    personal.value = atual;
    desenhar();
    if (!silencioso) aoMudar?.();
  }

  personal.addEventListener('input', () => definir(personal.value, 'Personalizada'));
  desenhar();

  return {
    el: h('div', { class: 'campo' }, h('div', { class: 'cores' }, botoes, mais), legenda),
    get valor() { return atual; },
    get nome() { return legenda.textContent; },
    definir,
    definirSugestoes(s) { sugestoes = s || []; desenhar(); },
  };
}

export function campoTensao(rotulo, valor, aoMudar) {
  const input = h('input', {
    type: 'text', inputmode: 'decimal', autocomplete: 'off',
    value: valor != null ? fmtLbs(valor) : '', placeholder: '—', 'aria-label': `${rotulo} (lbs)`,
  });
  const passo = (d) => {
    const v = lerNumero(input.value) ?? 50;
    input.value = fmtLbs(Math.round((v + d) * 2) / 2);
    aoMudar?.();
  };
  input.addEventListener('input', () => aoMudar?.());
  const el = h('div', { class: 'campo' },
    h('span', { class: 'campo-rot' }, rotulo),
    h('div', { class: 'tensao-ctrl' },
      h('button', { type: 'button', class: 'btn-passo', 'aria-label': `Diminuir ${rotulo.toLowerCase()}`, onclick: () => passo(-1) }, '−'),
      input,
      h('span', { class: 'tensao-un' }, 'lbs'),
      h('button', { type: 'button', class: 'btn-passo', 'aria-label': `Aumentar ${rotulo.toLowerCase()}`, onclick: () => passo(1) }, '+')));
  return {
    el,
    input,
    get valor() { return lerNumero(input.value); },
    definir(v) { input.value = v == null ? '' : fmtLbs(v); },
  };
}

export function segmentado(opcoes, valor, aoMudar) {
  let atual = valor;
  const botoes = opcoes.map(([v, rotulo]) => h('button', {
    type: 'button', 'data-v': v, 'aria-pressed': String(v === atual),
    onclick: () => {
      atual = v;
      for (const b of botoes) b.setAttribute('aria-pressed', String(b.dataset.v === v));
      aoMudar?.(v);
    },
  }, rotulo));
  return { el: h('div', { class: 'segmentado', role: 'group' }, botoes), get valor() { return atual; } };
}

export function interruptor(rotulo, detalhe, marcado, aoMudar) {
  const input = h('input', { type: 'checkbox', role: 'switch', checked: marcado });
  input.addEventListener('change', () => aoMudar?.(input.checked));
  return {
    el: h('label', { class: 'interruptor' }, h('span', null, rotulo, detalhe ? h('small', null, detalhe) : null), input),
    get marcado() { return input.checked; },
    set marcado(v) { input.checked = Boolean(v); },
  };
}

// Seleção em duas etapas: primeiro a marca, depois o modelo daquela marca.
// opcoesDaMarca(marca) devolve [[grupo, [{ valor, rotulo }]]]; grupo vazio = sem optgroup.
export function seletorMarcaModelo({ marcas, opcoesDaMarca, marcaInicial = '', valorInicial = '', aoEscolher, textoModelo = 'Escolha o modelo' }) {
  const selMarca = h('select', { class: 'campo-input' },
    h('option', { value: '' }, 'Escolha a marca'),
    marcas.map((m) => h('option', { value: m }, m)));
  const selModelo = h('select', { class: 'campo-input' });

  function preencher(valor = '') {
    const m = selMarca.value;
    const grupos = m ? opcoesDaMarca(m) : [];
    const opcao = (o) => h('option', { value: o.valor }, o.rotulo);
    selModelo.replaceChildren(
      h('option', { value: '' }, m ? textoModelo : 'Escolha a marca primeiro'),
      ...grupos.flatMap(([grupo, ops]) => (grupo ? [h('optgroup', { label: grupo }, ops.map(opcao))] : ops.map(opcao))));
    selModelo.disabled = !m;
    selModelo.value = valor;
    if (selModelo.value !== valor) selModelo.value = '';
  }

  selMarca.value = marcas.includes(marcaInicial) ? marcaInicial : '';
  preencher(valorInicial);
  selMarca.addEventListener('change', () => {
    preencher();
    aoEscolher?.(null);
  });
  selModelo.addEventListener('change', () => aoEscolher?.(selModelo.value || null));

  return {
    el: h('div', { class: 'grade-2' }, h('label', { class: 'campo' }, h('span', { class: 'campo-rot' }, 'Marca'), selMarca),
      h('label', { class: 'campo' }, h('span', { class: 'campo-rot' }, 'Modelo'), selModelo)),
    get valor() { return selModelo.value; },
  };
}

const fmtLivre = (n) => (n == null || !Number.isFinite(Number(n)) ? '' : Number(n).toLocaleString('pt-BR', { maximumFractionDigits: 2, useGrouping: false }));

export function entradaNumero(valor, placeholder = '') {
  return h('input', { class: 'campo-input', type: 'text', inputmode: 'decimal', autocomplete: 'off', value: fmtLivre(valor), placeholder });
}

export const definirNumero = (input, valor) => { input.value = fmtLivre(valor); };
export const numeroDe = (input) => lerNumero(input.value);
