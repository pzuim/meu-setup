// Ponto de entrada: inicializa os dados, desenha a tela base e as camadas (painéis e páginas).

import { h } from './util.js';
import { iniciarDados, versaoDados } from './dados.js';
import { rotaAtual, conferirPendente, ir, irParaInicio, voltar } from './nav.js';
import { icone, aviso, aplicarTema, temaAtual } from './ui.js';
import { telaInicio } from './telas/inicio.js';
import { folhaRaquete, formRaquete } from './telas/raquete.js';
import { folhaCorda, folhaSetup, formSetup } from './telas/setup.js';
import { paginaComparacao } from './telas/comparar.js';
import { telaHistorico } from './telas/historico.js';
import { telaEntenda, folhaEntenda } from './telas/entenda.js';
import { telaAjustes } from './telas/ajustes.js';

const tela = document.getElementById('tela');
const camada = document.getElementById('camada');
const nav = document.getElementById('nav');

// Telas base (ficam atrás dos painéis)
const BASES = {
  '/': ['inicio', telaInicio],
  '/historico': ['historico', telaHistorico],
  '/entenda': ['entenda', telaEntenda],
  '/ajustes': ['ajustes', telaAjustes],
};

// Camadas: 'folha' = painel que sobe de baixo; 'pagina' = tela cheia
const CAMADAS = [
  [/^\/raquete\/nova$/, 'pagina', () => formRaquete(null)],
  [/^\/raquete\/([^/]+)$/, 'folha', (id) => folhaRaquete(id)],
  [/^\/raquete\/([^/]+)\/corda$/, 'folha', (id) => folhaCorda(id)],
  [/^\/raquete\/([^/]+)\/editar$/, 'pagina', (id) => formRaquete(id)],
  [/^\/raquete\/([^/]+)\/trocar$/, 'pagina', (id) => formSetup({ raqueteId: id })],
  [/^\/setup\/([^/]+)$/, 'folha', (id) => folhaSetup(id)],
  [/^\/setup\/([^/]+)\/editar$/, 'pagina', (id) => formSetup({ setupId: id })],
  [/^\/setup\/([^/]+)\/comparar$/, 'pagina', (id) => paginaComparacao(id)],
  [/^\/entenda\/([^/]+)$/, 'folha', (id) => folhaEntenda(id), '/entenda'],
];

const estado = { baseRota: null, baseVersao: -1, camadaRota: null };
let bilhete = 0;

async function renderizar() {
  if (conferirPendente()) return;
  const meu = ++bilhete;
  const { caminho, bruto } = rotaAtual();

  let rotaBase = BASES[caminho] ? bruto : null;
  let sobre = null;
  if (!rotaBase) {
    for (const [re, tipo, fabrica, baseSugerida] of CAMADAS) {
      const m = re.exec(caminho);
      if (m) {
        sobre = { tipo, fabrica, args: m.slice(1).map(decodeURIComponent) };
        rotaBase = estado.baseRota ?? baseSugerida ?? '/';
        break;
      }
    }
    if (!sobre) {
      ir('/', { substituir: true });
      return;
    }
  }

  try {
    if (rotaBase !== estado.baseRota || estado.baseVersao !== versaoDados()) {
      const [c, q] = rotaBase.split('?');
      const [nome, fabricar] = BASES[c] ?? BASES['/'];
      const rolagem = rotaBase === estado.baseRota ? tela.scrollTop : 0;
      const versao = versaoDados();
      const el = await fabricar({ query: new URLSearchParams(q || '') });
      if (meu !== bilhete) return;
      tela.replaceChildren(el);
      tela.dataset.tela = nome;
      tela.scrollTop = rolagem;
      estado.baseRota = rotaBase;
      estado.baseVersao = versao;
      marcarNav(c);
    }
    if (sobre) {
      const el = await sobre.fabrica(...sobre.args);
      if (meu !== bilhete) return;
      mostrarCamada(sobre.tipo, el, bruto);
    } else {
      fecharCamada();
    }
  } catch (erro) {
    console.error(erro);
    aviso('Algo deu errado ao abrir esta tela.');
  }
}

function fecharPorGesto() {
  voltar(estado.baseRota || '/');
}

function mostrarCamada(tipo, conteudo, rota) {
  const aberta = camada.classList.contains('aberta') && camada.dataset.tipo === tipo;
  if (aberta) {
    const rolavel = camada.querySelector('.folha, .pagina');
    camada.querySelector('.camada-conteudo').replaceChildren(conteudo);
    if (estado.camadaRota !== rota) rolavel.scrollTop = 0;
    estado.camadaRota = rota;
    return;
  }
  camada.classList.remove('aberta');
  camada.dataset.tipo = tipo;
  estado.camadaRota = rota;
  if (tipo === 'folha') {
    camada.replaceChildren(
      h('div', { class: 'camada-fundo', onclick: fecharPorGesto }),
      h('section', { class: 'folha', role: 'dialog', 'aria-modal': 'true' },
        h('div', { class: 'folha-topo' },
          h('span', { class: 'folha-alca' }),
          h('button', { class: 'btn-icone folha-fechar', type: 'button', 'aria-label': 'Fechar', onclick: fecharPorGesto }, icone('fechar'))),
        h('div', { class: 'camada-conteudo' }, conteudo)));
  } else {
    camada.replaceChildren(
      h('section', { class: 'pagina', role: 'dialog', 'aria-modal': 'true' }, h('div', { class: 'camada-conteudo' }, conteudo)));
  }
  camada.hidden = false;
  document.body.classList.add('com-camada');
  void camada.offsetWidth; // força o layout inicial para a transição de entrada acontecer
  camada.classList.add('aberta');
}

function fecharCamada() {
  estado.camadaRota = null;
  if (camada.hidden) return;
  camada.classList.remove('aberta');
  document.body.classList.remove('com-camada');
  setTimeout(() => {
    if (!camada.classList.contains('aberta')) {
      camada.replaceChildren();
      camada.hidden = true;
    }
  }, 340);
}

function marcarNav(caminho) {
  for (const b of nav.querySelectorAll('[data-rota]')) {
    const ativo = b.dataset.rota === caminho;
    b.classList.toggle('ativo', ativo);
    if (ativo) b.setAttribute('aria-current', 'page');
    else b.removeAttribute('aria-current');
  }
}

function montarNav() {
  const itens = [
    ['/', 'raquete', 'Setup'],
    ['/historico', 'historico', 'Histórico'],
    ['/entenda', 'entenda', 'Entenda'],
    ['/ajustes', 'ajustes', 'Configurações'],
  ];
  nav.replaceChildren(...itens.map(([rota, ic, rotulo]) =>
    h('button', { class: 'nav-item', type: 'button', 'data-rota': rota }, icone(ic), h('span', null, rotulo))));
  nav.addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-rota]');
    if (!b) return;
    const destino = b.dataset.rota;
    const { caminho } = rotaAtual();
    if (destino === caminho) {
      tela.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (destino === '/') irParaInicio();
    else ir(destino, { substituir: caminho !== '/' && Boolean(BASES[caminho]) });
  });
}

function registrarServiceWorker() {
  if (!('serviceWorker' in navigator) || location.protocol === 'file:') return;
  navigator.serviceWorker.register('sw.js').catch((e) => console.warn('Service worker não registrado:', e));
}

async function iniciar() {
  if (!history.state) history.replaceState({ prof: 0 }, '', location.href);
  aplicarTema(temaAtual(), false);
  matchMedia('(prefers-color-scheme: light)').addEventListener?.('change', () => aplicarTema(temaAtual(), false));
  montarNav();
  try {
    await iniciarDados();
  } catch (erro) {
    console.error(erro);
    tela.replaceChildren(h('div', { class: 'base' },
      h('h1', { class: 'base-titulo' }, 'Não foi possível abrir os dados'),
      h('p', { class: 'dica' }, 'O navegador bloqueou o armazenamento local (IndexedDB). Verifique se não está em uma aba anônima e tente de novo.')));
    return;
  }
  try { navigator.storage?.persist?.(); } catch { /* opcional */ }
  window.addEventListener('popstate', renderizar);
  window.addEventListener('rota', renderizar);
  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape' && !camada.hidden && !document.querySelector('.dialogo')) fecharPorGesto();
  });
  await renderizar();
  registrarServiceWorker();
}

iniciar();
