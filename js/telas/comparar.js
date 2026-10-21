// Comparação entre um setup e o anterior da mesma raquete.

import { h } from '../util.js';
import { obterSetup, obterRaquete, cordaH, nomeRaquete } from '../dados.js';
import { compararSetups, AVISO_ESTIMATIVA } from '../comparacao.js';
import { nomeCorda, detalheCorda, tensoesCurtas } from '../resumo.js';
import { irParaInicio } from '../nav.js';
import { icone, cabecalho, naoEncontrado } from '../ui.js';

const amostraPeq = (hex) => h('span', { class: 'amostra peq', style: `--c:${hex || '#888888'}` });

function corda(c) {
  const modelo = c?.modelo || nomeCorda(c);
  return h('div', { class: 'comp-corda' },
    amostraPeq(c?.cor),
    h('span', null, c?.modelo && c?.marca ? h('small', null, c.marca) : null, modelo));
}

function lado(rotulo, s, agora) {
  return h('div', { class: 'comp-lado' + (agora ? ' agora' : '') },
    h('small', null, rotulo),
    corda(s.verticais),
    s.horizontais ? corda(cordaH(s)) : null,
    h('span', { class: 'comp-sub' }, s.horizontais ? 'Híbrido' : detalheCorda(s.verticais) || '—'),
    h('span', { class: 'comp-tensao' }, tensoesCurtas(s), h('span', null, ' lbs')));
}

const ICONE_DIRECAO = { sobe: 'sobe', desce: 'desce', igual: 'igual' };

function itemIndicador(ind) {
  const explicacao = h('div', { class: 'ind-exp', hidden: true }, ind.explicacao.map((p) => h('p', null, p)));
  const li = h('li', { class: `ind ind-${ind.direcao}` });
  const botao = h('button', { type: 'button', 'aria-expanded': 'false' },
    h('span', { class: 'ind-icone' }, icone(ICONE_DIRECAO[ind.direcao])),
    h('span', { class: 'ind-texto' }, h('strong', null, ind.rotulo), h('span', null, ind.sub)),
    icone('direita'));
  botao.addEventListener('click', () => {
    const abrir = explicacao.hidden;
    explicacao.hidden = !abrir;
    li.classList.toggle('aberto', abrir);
    botao.setAttribute('aria-expanded', String(abrir));
  });
  li.append(botao, explicacao);
  return li;
}

export async function paginaComparacao(id) {
  const novo = await obterSetup(id);
  const cab = cabecalho('Comparação', `/setup/${id}`);
  if (!novo) return h('div', null, cab, naoEncontrado('Setup não encontrado.'));
  const ant = novo.anteriorId ? await obterSetup(novo.anteriorId) : null;
  const r = await obterRaquete(novo.raqueteId);
  if (!ant) return h('div', null, cab, naoEncontrado('Este é o primeiro setup registrado nesta raquete, então ainda não há com o que comparar.'));

  const { indicadores, notas } = compararSetups(ant, novo);
  return h('div', null,
    cab,
    h('p', { class: 'sobretitulo' }, nomeRaquete(r)),
    h('h2', { class: 'titulo-grande' }, 'O que tende a mudar'),
    h('div', { class: 'comp-lados' },
      lado('Antes', ant, false),
      h('span', { class: 'comp-seta' }, icone('direita')),
      lado('Agora', novo, true)),
    notas.map((n) => h('p', { class: 'nota' }, n)),
    h('p', { class: 'dica', style: 'margin:0 0 10px' }, 'Toque em um indicador para ver a explicação.'),
    h('ul', { class: 'indicadores' }, indicadores.map(itemIndicador)),
    h('p', { class: 'estimativa' }, AVISO_ESTIMATIVA),
    h('div', { class: 'acoes' }, h('button', { class: 'btn', type: 'button', onclick: irParaInicio }, 'Concluir')));
}
