// Histórico: linha do tempo de eventos por raquete, com filtro.

import { h, fmtDataLonga } from '../util.js';
import { listarRaquetes, listarEventos, todosSetups, nomeRaquete, TIPOS_EVENTO } from '../dados.js';
import { resumoSetup } from '../resumo.js';
import { ir } from '../nav.js';

const COR_EVENTO = {
  instalou_corda: 'var(--accent-text)',
  alterou_tensao: 'var(--cool)',
  corda_estourou: 'var(--danger)',
  removeu_setup: 'var(--text-3)',
  raquete_cadastrada: 'var(--text-2)',
  raquete_aposentada: 'var(--text-3)',
  raquete_reativada: 'var(--text-2)',
};

function itemEvento(e, s, r, mostrarRaquete) {
  const destino = s ? `/setup/${s.id}` : r ? `/raquete/${r.id}` : null;
  return h('li', { class: 'evento', style: `--c:${COR_EVENTO[e.tipo] || 'var(--text-3)'}` },
    h('button', { type: 'button', disabled: !destino, onclick: () => destino && ir(destino) },
      h('div', { class: 'ev-topo' },
        h('span', null, fmtDataLonga(e.data)),
        mostrarRaquete && r ? h('span', null, nomeRaquete(r)) : null),
      h('div', { class: 'ev-titulo' }, TIPOS_EVENTO[e.tipo] || 'Evento'),
      s ? h('div', { class: 'ev-resumo' }, h('span', { class: 'amostra peq', style: `--c:${s.verticais?.cor || '#888888'}` }), resumoSetup(s)) : null,
      e.motivo ? h('div', { class: 'ev-motivo' }, `Motivo: ${e.motivo}`) : null));
}

export async function telaHistorico({ query }) {
  const filtro = query.get('r') || '';
  const [raquetes, eventos, setups] = await Promise.all([listarRaquetes(), listarEventos(filtro || null), todosSetups()]);
  const mapaSetups = new Map(setups.map((s) => [s.id, s]));
  const mapaRaquetes = new Map(raquetes.map((r) => [r.id, r]));

  const opcoes = [['', 'Todas'], ...raquetes.map((r) => [r.id, nomeRaquete(r)])];
  const chips = h('div', { class: 'chips chips-rolagem', role: 'group', 'aria-label': 'Filtrar por raquete' },
    opcoes.map(([id, rotulo]) => h('button', {
      type: 'button',
      class: 'chip' + (id === filtro ? ' ativo' : ''),
      'aria-pressed': String(id === filtro),
      onclick: () => ir(id ? `/historico?r=${encodeURIComponent(id)}` : '/historico', { substituir: true }),
    }, rotulo)));

  const lista = h('ol', { class: 'linha-tempo' });
  let anoAtual = null;
  for (const e of eventos) {
    const ano = String(e.data).slice(0, 4);
    if (ano !== anoAtual) {
      anoAtual = ano;
      lista.append(h('li', { class: 'ano-sep', 'aria-hidden': 'true' }, ano));
    }
    lista.append(itemEvento(e, mapaSetups.get(e.setupId), mapaRaquetes.get(e.raqueteId), !filtro && raquetes.length > 1));
  }

  return h('div', { class: 'base' },
    h('h1', { class: 'base-titulo' }, 'Histórico'),
    h('p', { class: 'base-sub' }, 'Trocas de corda, tensões e mudanças de setup.'),
    chips,
    eventos.length ? lista : h('p', { class: 'vazio' }, 'Nada registrado ainda.'));
}
