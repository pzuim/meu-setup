// Entenda seu setup: consultas rápidas em cartões.

import { h } from '../util.js';
import { ir } from '../nav.js';
import { icone, naoEncontrado } from '../ui.js';

const NOTA_GERAL = 'São tendências gerais. O resultado real depende também da corda, da raquete e da sua preferência.';

const TOPICOS = [
  {
    id: 'tensao', icone: 'tensao', titulo: 'Tensão maior ou menor', resumo: 'Firmeza, controle e conforto',
    itens: [
      ['48 lbs:', 'em geral mais conforto e potência; a bola sai com mais facilidade.'],
      ['54 lbs:', 'em geral mais firmeza e controle; menos potência e conforto.'],
      ['Faixa comum:', 'entre 45 e 60 lbs, conforme a corda e a raquete.'],
      ['Poliéster:', 'costuma ser encordoado alguns libras abaixo de multifilamento ou sintética, por ser mais rígido.'],
      ['Com o tempo:', 'toda corda perde tensão; o poliéster perde mais rápido nos primeiros dias.'],
    ],
  },
  {
    id: 'tipos', icone: 'tipos', titulo: 'Tipos de corda', resumo: 'Poliéster, multi, gut, sintética',
    itens: [
      ['Poliéster:', 'controle, spin e durabilidade. Mais rígido e menos confortável; perde tensão mais rápido.'],
      ['Multifilamento:', 'muitas fibras finas. Conforto, potência e sensação de bola; desgasta mais rápido.'],
      ['Natural gut:', 'tripa natural. Referência em conforto, potência e manutenção de tensão; cara e sensível à umidade.'],
      ['Sintética (nylon):', 'equilibrada e barata. Boa para começar ou para testar tensões.'],
      ['Híbrido:', 'uma corda nas verticais e outra nas horizontais, para combinar características (por exemplo, poliéster com multifilamento). As verticais pesam mais na sensação e no spin.'],
    ],
  },
  {
    id: 'calibre', icone: 'calibre', titulo: 'Calibre / espessura', resumo: 'Corda fina ou grossa',
    itens: [
      ['Medida:', 'espessura em milímetros, geralmente de 1,15 a 1,35 mm.'],
      ['Mais fina:', 'mais sensação, spin e potência; dura menos.'],
      ['Mais grossa:', 'mais durabilidade e resposta mais firme; menos sensação.'],
      ['Estoura muito?', 'subir o calibre costuma ajudar.'],
    ],
  },
  {
    id: 'peso', icone: 'peso', titulo: 'Peso da raquete', resumo: 'Estabilidade × manobrabilidade',
    itens: [
      ['Como é medido:', 'normalmente sem corda, em gramas. A corda soma cerca de 15 a 20 g.'],
      ['Faixa comum:', 'entre 280 e 320 g para adultos.'],
      ['Mais pesada:', 'mais estabilidade e peso de bola, menos vibração; cansa mais e é menos manobrável.'],
      ['Mais leve:', 'mais fácil de acelerar e manobrar; menos estável contra bolas fortes.'],
    ],
  },
  {
    id: 'cabeca', icone: 'cabeca', titulo: 'Tamanho da cabeça', resumo: 'Área útil e tolerância',
    itens: [
      ['Medida:', 'área em polegadas quadradas (pol²). 100 pol² ≈ 645 cm².'],
      ['Maior (100 ou mais):', 'área útil maior, mais potência e mais tolerância a erros.'],
      ['Menor (95 a 98):', 'mais precisão e controle; exige mais acerto no centro.'],
    ],
  },
  {
    id: 'padrao', icone: 'padrao', titulo: 'Padrão de encordoamento', resumo: 'Aberto ou fechado',
    itens: [
      ['O que é:', 'número de cordas verticais × horizontais, como 16x19.'],
      ['Aberto (16x19, 16x18):', 'mais spin e potência; a corda costuma durar menos.'],
      ['Fechado (18x20):', 'mais controle e trajetória mais reta; a corda costuma durar mais.'],
    ],
  },
  {
    id: 'rigidez', icone: 'rigidez', titulo: 'Rigidez', resumo: 'Potência × conforto no braço',
    itens: [
      ['Medida:', 'índice RA, geralmente entre 55 e 72.'],
      ['Mais rígida (65 ou mais):', 'mais potência e resposta; passa mais vibração para o braço.'],
      ['Mais flexível (abaixo de 62):', 'mais conforto e sensação de bola na corda; menos potência.'],
      ['Braço sensível?', 'raquete mais flexível, tensão menor e corda macia costumam ajudar.'],
    ],
  },
  {
    id: 'balanco', icone: 'balanco', titulo: 'Balanço', resumo: 'Cabeça leve ou pesada',
    itens: [
      ['O que é:', 'ponto de equilíbrio, medido em mm a partir da ponta do cabo.'],
      ['Referência:', 'numa raquete de 68,5 cm, o equilíbrio neutro fica perto de 343 mm.'],
      ['Abaixo disso (cabeça leve):', 'mais manobrável; comum em raquetes mais pesadas.'],
      ['Acima disso (cabeça pesada):', 'mais potência e estabilidade; menos manobrável.'],
    ],
  },
];

export async function telaEntenda() {
  return h('div', { class: 'base' },
    h('h1', { class: 'base-titulo' }, 'Entenda seu setup'),
    h('p', { class: 'base-sub' }, 'Consultas rápidas. Toque em um tema.'),
    h('div', { class: 'cartoes' }, TOPICOS.map((t) =>
      h('button', { class: 'cartao', type: 'button', onclick: () => ir(`/entenda/${t.id}`) },
        icone(t.icone), h('strong', null, t.titulo), h('span', null, t.resumo)))));
}

export async function folhaEntenda(id) {
  const t = TOPICOS.find((x) => x.id === id);
  if (!t) return naoEncontrado('Tema não encontrado.');
  return h('div', null,
    h('p', { class: 'sobretitulo' }, 'Entenda seu setup'),
    h('h2', { class: 'titulo-grande' }, t.titulo),
    h('ul', { class: 'lista-entenda' }, t.itens.map(([forte, texto]) => h('li', null, h('strong', null, forte), ' ', texto))),
    h('p', { class: 'estimativa' }, NOTA_GERAL));
}
