// Tela inicial: mostruário. Só as raquetes, quase sem texto.
// Tocar na cabeça abre a corda instalada; tocar no cabo abre a ficha da raquete.

import { h } from '../util.js';
import { listarRaquetes, estadoCorda, cordaH, nomeRaquete } from '../dados.js';
import { desenharRaquete } from '../raquete-svg.js';
import { ir } from '../nav.js';
import { icone } from '../ui.js';

const CHAVE_DICA = 'ar.dicaVista';

function dicaVista() {
  try { return localStorage.getItem(CHAVE_DICA) === '1'; } catch { return true; }
}

function marcarDicaVista() {
  try { localStorage.setItem(CHAVE_DICA, '1'); } catch { /* sem armazenamento: dica volta a aparecer */ }
  document.querySelector('.vitrine-dica')?.remove();
}

export async function telaInicio() {
  const raquetes = (await listarRaquetes()).filter((r) => r.ativa);
  if (!raquetes.length) return vitrineVazia();

  const secoes = [];
  for (const r of raquetes) {
    const { estado, setup } = await estadoCorda(r.id);
    const figura = h('div', { class: 'vitrine-raquete' });
    figura.innerHTML = desenharRaquete(r, {
      estado,
      corV: setup?.verticais?.cor,
      corH: cordaH(setup)?.cor,
      interativo: true,
    });
    ligarZonas(figura, r.id);
    secoes.push(h('section', { class: 'vitrine-item', 'aria-label': nomeRaquete(r) }, figura));
  }

  // Depois da última raquete, um espaço discreto para cadastrar outra.
  secoes.push(secaoNovaRaquete());

  secoes.forEach((sec, i) => {
    const proxima = secoes[i + 1];
    if (proxima) {
      sec.append(h('button', {
        class: 'vitrine-seguinte', type: 'button',
        'aria-label': i === secoes.length - 2 ? 'Adicionar outra raquete' : 'Próxima raquete',
        onclick: () => proxima.scrollIntoView({ behavior: 'smooth' }),
      }, icone('baixo')));
    }
  });
  if (!dicaVista()) {
    secoes[0].append(h('p', { class: 'vitrine-dica' }, 'Toque na cabeça para ver a corda e no cabo para ver a raquete'));
  }
  return h('div', { class: 'vitrine' }, secoes);
}

function ligarZonas(figura, id) {
  const svg = figura.querySelector('svg');
  const abrir = (zona) => {
    marcarDicaVista();
    ir(zona === 'cabeca' ? `/raquete/${id}/corda` : `/raquete/${id}`);
  };
  figura.addEventListener('click', (ev) => {
    const z = ev.target.closest('[data-zona]');
    if (z) abrir(z.dataset.zona);
  });
  figura.addEventListener('keydown', (ev) => {
    const z = ev.target.closest?.('[data-zona]');
    if (z && (ev.key === 'Enter' || ev.key === ' ')) {
      ev.preventDefault();
      abrir(z.dataset.zona);
    }
  });
  let tempo;
  figura.addEventListener('pointerdown', (ev) => {
    const z = ev.target.closest('[data-zona]');
    if (!z) return;
    clearTimeout(tempo);
    svg.classList.add('toque-' + z.dataset.zona);
  });
  const limpar = () => {
    clearTimeout(tempo);
    tempo = setTimeout(() => svg.classList.remove('toque-cabeca', 'toque-cabo'), 180);
  };
  for (const t of ['pointerup', 'pointercancel', 'pointerleave']) figura.addEventListener(t, limpar);
}

function secaoNovaRaquete() {
  const fantasma = h('div', { class: 'vitrine-raquete fantasma' });
  fantasma.innerHTML = desenharRaquete({ corPrincipal: '#8a8a8a', corSecundaria: '#8a8a8a', corGrip: '#8a8a8a', logotipo: false });
  return h('section', { class: 'vitrine-item vitrine-nova', 'aria-label': 'Adicionar raquete' },
    fantasma,
    h('div', { class: 'vitrine-vazia' },
      h('button', { class: 'btn btn-sec', type: 'button', onclick: () => ir('/raquete/nova') }, icone('mais'), 'Adicionar raquete')));
}

function vitrineVazia() {
  const fantasma = h('div', { class: 'vitrine-raquete fantasma' });
  fantasma.innerHTML = desenharRaquete({ corPrincipal: '#8a8a8a', corSecundaria: '#8a8a8a', corGrip: '#8a8a8a', logotipo: false });
  return h('div', { class: 'vitrine' },
    h('section', { class: 'vitrine-item' },
      fantasma,
      h('div', { class: 'vitrine-vazia' },
        h('p', null, 'Nenhuma raquete ativa'),
        h('button', { class: 'btn', type: 'button', onclick: () => ir('/raquete/nova') }, icone('mais'), 'Adicionar raquete'))));
}
