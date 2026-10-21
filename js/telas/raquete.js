// Painel da raquete (toque no cabo) e formulário de cadastro/edição.

import { h, fmtNum } from '../util.js';
import { obterRaquete, salvarRaquete, estadoCorda, cordaH, definirAtiva, excluirRaquete } from '../dados.js';
import { carregarCatalogo, marcas, agrupar, opcoesRaquete, resolverOpcao, camposDaPintura, listaPinturas } from '../catalogo.js';
import { desenharRaquete, ESTILOS, FORMATOS } from '../raquete-svg.js';
import { resumoSetup } from '../resumo.js';
import { ir, voltar, irParaInicio } from '../nav.js';
import { icone, cabecalho, campo, bloco, amostra, aviso, confirmar, naoEncontrado } from '../ui.js';
import {
  seletorCor, entradaNumero, definirNumero, numeroDe, interruptor, seletorMarcaModelo, PALETA_RAQUETE, PALETA_GRIP,
} from '../campos.js';

export async function folhaRaquete(id) {
  const r = await obterRaquete(id);
  if (!r) return naoEncontrado('Raquete não encontrada.');
  const { estado, setup } = await estadoCorda(id);

  const specs = [
    ['Peso sem corda', r.peso != null ? `${fmtNum(r.peso)} g` : null],
    ['Cabeça', r.cabeca != null ? `${fmtNum(r.cabeca)} pol²` : null],
    ['Padrão', r.padrao || null],
    ['Comprimento', r.comprimento != null ? `${fmtNum(r.comprimento, r.comprimento % 1 ? 1 : 0)} cm` : null],
    ['Balanço', r.balanco != null ? `${fmtNum(r.balanco)} mm` : null],
    ['Rigidez', r.rigidez != null ? `${fmtNum(r.rigidez)} RA` : null],
    ['Ano', r.ano != null ? String(r.ano) : null],
  ].filter(([, v]) => v);

  const textoCorda = estado === 'ativa' ? resumoSetup(setup) : estado === 'estourada' ? 'Corda estourada' : 'Sem corda instalada';

  return h('div', null,
    h('p', { class: 'sobretitulo' }, r.marca || 'Raquete'),
    h('h2', { class: 'titulo-grande' }, r.modelo || 'Sem modelo'),
    !r.ativa ? h('div', { class: 'linha-status' }, h('span', { class: 'status status-aposentada' }, 'Aposentada')) : null,
    specs.length
      ? h('dl', { class: 'specs' }, specs.map(([k, v]) => h('div', null, h('dt', null, k), h('dd', null, v))))
      : h('p', { class: 'vazio' }, 'Ficha técnica ainda não preenchida. Toque em “Editar raquete” para completar.'),
    bloco('Material e tecnologias', r.material),
    bloco('Observações', r.observacoes),
    h('button', { class: 'linha-link', type: 'button', onclick: () => ir(`/raquete/${id}/corda`) },
      amostra(estado === 'ativa' ? setup.verticais?.cor : 'transparent'),
      h('span', null, h('small', null, 'Corda'), textoCorda),
      icone('direita')),
    h('div', { class: 'acoes' },
      h('div', { class: 'acoes-par' },
        h('button', { class: 'btn btn-sec', type: 'button', onclick: () => ir(`/raquete/${id}/editar`) }, icone('editar'), 'Editar raquete'),
        h('button', { class: 'btn', type: 'button', onclick: () => ir(`/raquete/${id}/trocar`) },
          icone(estado === 'ativa' ? 'trocar' : 'mais'), estado === 'ativa' ? 'Trocar setup' : 'Registrar corda')),
      h('button', { class: 'btn btn-txt', type: 'button', onclick: () => ir(`/historico?r=${id}`, { substituir: true }) },
        icone('historico'), 'Histórico desta raquete')));
}

export async function formRaquete(id) {
  const original = id ? await obterRaquete(id) : null;
  if (id && !original) return h('div', null, cabecalho('Raquete', '/'), naoEncontrado('Raquete não encontrada.'));
  const r = original ?? { marca: '', modelo: '', corPrincipal: '#f1f1ec', corSecundaria: '#1b1b1b', corGrip: '#2a2a2a', ativa: true };
  const cat = await carregarCatalogo();
  const { estado, setup } = id ? await estadoCorda(id) : { estado: 'vazia', setup: null };

  const previa = h('div', { class: 'previa', 'aria-hidden': 'true' });
  const atualizarPrevia = () => {
    previa.innerHTML = desenharRaquete(coletar(), { estado, corV: setup?.verticais?.cor, corH: cordaH(setup)?.cor });
  };

  // Catálogo em duas etapas: marca e depois modelo (agrupado por linha).
  let opcaoCatalogo = resolverOpcao(cat, r.catalogoId) ? r.catalogoId : null;
  const infoCatalogo = h('p', { class: 'dica' });
  const catalogo = seletorMarcaModelo({
    marcas: marcas(cat.raquetes),
    marcaInicial: resolverOpcao(cat, opcaoCatalogo)?.item.marca || '',
    valorInicial: opcaoCatalogo || '',
    opcoesDaMarca: (m) => agrupar(cat.raquetes.filter((it) => it.marca === m), 'linha')
      .map(([linha, itens]) => [linha, itens.flatMap((it) => opcoesRaquete(cat, it))]),
    aoEscolher: (valor) => {
      opcaoCatalogo = valor;
      if (valor) aplicarCatalogo(resolverOpcao(cat, valor));
      mostrarInfoCatalogo();
    },
  });

  function mostrarInfoCatalogo() {
    const res = resolverOpcao(cat, opcaoCatalogo);
    const partes = [];
    if (res?.item.publico) partes.push(`Indicada pela marca para: ${res.item.publico}.`);
    if (res?.item.fonte) partes.push(h('a', { href: res.item.fonte, target: '_blank', rel: 'noopener' }, 'Ficha oficial'));
    infoCatalogo.replaceChildren(...(partes.length ? partes.flatMap((p, i) => (i ? [' ', p] : [p]))
      : ['Só raquetes avançadas, com dados dos sites oficiais. Para outra raquete, preencha os campos abaixo.']));
  }

  const marca = h('input', { class: 'campo-input', value: r.marca || '', maxlength: '60', autocomplete: 'off' });
  const modelo = h('input', { class: 'campo-input', value: r.modelo || '', maxlength: '80', autocomplete: 'off' });
  const ano = entradaNumero(r.ano, 'Opcional');
  const peso = entradaNumero(r.peso, 'ex.: 300');
  const cabeca = entradaNumero(r.cabeca, 'ex.: 100');
  const padrao = h('input', { class: 'campo-input', value: r.padrao || '', maxlength: '7', placeholder: 'ex.: 16x19', autocomplete: 'off' });
  const comprimento = entradaNumero(r.comprimento, 'Opcional');
  const balanco = entradaNumero(r.balanco, 'Opcional');
  const rigidez = entradaNumero(r.rigidez, 'Opcional');
  const material = h('input', { class: 'campo-input', value: r.material || '', maxlength: '140', placeholder: 'ex.: grafite, tecnologia do quadro' });
  const obs = h('textarea', { class: 'campo-input', maxlength: '1000' });
  obs.value = r.observacoes || '';

  const chipsPadrao = h('div', { class: 'chips' }, ['16x19', '18x20', '16x20', '18x19', '16x18'].map((p) =>
    h('button', { type: 'button', class: 'chip', onclick: () => { padrao.value = p; atualizarPrevia(); } }, p)));

  // Pintura da ilustração
  const selEstilo = h('select', { class: 'campo-input' }, Object.entries(ESTILOS).map(([v, rotulo]) => h('option', { value: v }, rotulo)));
  selEstilo.value = ESTILOS[r.estilo] ? r.estilo : 'solido';
  const selFormato = h('select', { class: 'campo-input' }, Object.entries(FORMATOS).map(([v, rotulo]) => h('option', { value: v }, rotulo)));
  selFormato.value = FORMATOS[r.formato] ? r.formato : 'oval';
  const listras = interruptor('Listras tipo zebra', 'Faixas na garganta e na base do aro, como nas Volkl', Boolean(r.listras), atualizarPrevia);
  const corPrincipal = seletorCor({ valor: r.corPrincipal, paleta: PALETA_RAQUETE, aoMudar: atualizarPrevia });
  const corSecundaria = seletorCor({ valor: r.corSecundaria, paleta: PALETA_RAQUETE, aoMudar: atualizarPrevia });
  const corDetalhe = seletorCor({ valor: r.corDetalhe || r.corSecundaria, paleta: PALETA_RAQUETE, aoMudar: atualizarPrevia });
  const corGrip = seletorCor({ valor: r.corGrip, paleta: PALETA_GRIP, aoMudar: atualizarPrevia });
  // A haste acompanha a cor principal até ser escolhida de propósito.
  let hasteFixa = r.corHaste || null;
  const corHaste = seletorCor({
    valor: r.corHaste || r.corPrincipal,
    paleta: PALETA_RAQUETE,
    aoMudar: () => { hasteFixa = corHaste.valor; atualizarPrevia(); },
  });

  const logotipo = interruptor('Marca e linha impressas', 'Escreve a marca no braço e a linha na lateral do aro', r.logotipo !== false, atualizarPrevia);

  // Copiar só a pintura de um modelo do catálogo, sem mexer na ficha técnica.
  const pinturas = listaPinturas(cat);
  const copiarPintura = seletorMarcaModelo({
    marcas: marcas(pinturas),
    opcoesDaMarca: (m) => [['', pinturas.filter((p) => p.marca === m).map((p) => ({ valor: p.id, rotulo: p.rotulo }))]],
    textoModelo: 'Escolha a pintura',
    aoEscolher: (id) => {
      const p = cat.pinturas[id];
      if (p) aplicarPintura(camposDaPintura(p));
    },
  });

  for (const el of [padrao, cabeca, marca, modelo]) el.addEventListener('input', atualizarPrevia);
  for (const el of [selEstilo, selFormato]) el.addEventListener('change', atualizarPrevia);

  function aplicarPintura(v) {
    selEstilo.value = v.estilo;
    selFormato.value = v.formato;
    listras.marcado = v.listras;
    const nome = 'Cor do catálogo';
    corPrincipal.definir(v.corPrincipal, nome, true);
    corSecundaria.definir(v.corSecundaria, nome, true);
    corDetalhe.definir(v.corDetalhe, nome, true);
    corGrip.definir(v.corGrip, nome, true);
    hasteFixa = v.corHaste;
    corHaste.definir(v.corHaste || v.corPrincipal, nome, true);
    atualizarPrevia();
  }

  function aplicarCatalogo(res) {
    if (!res) return;
    const { item: it, pintura } = res;
    marca.value = it.marca ?? '';
    modelo.value = it.modelo ?? '';
    definirNumero(ano, it.ano);
    definirNumero(peso, it.peso);
    definirNumero(cabeca, it.cabeca);
    padrao.value = it.padrao ?? '';
    definirNumero(comprimento, it.comprimento);
    definirNumero(balanco, it.balanco);
    definirNumero(rigidez, it.rigidez);
    material.value = it.material ?? '';
    if (pintura) aplicarPintura(camposDaPintura(pintura));
    else atualizarPrevia();
  }

  function coletar() {
    const m = marca.value.trim();
    const mo = modelo.value.trim();
    const res = resolverOpcao(cat, opcaoCatalogo);
    return {
      ...r,
      marca: m,
      modelo: mo,
      ano: numeroDe(ano),
      peso: numeroDe(peso),
      cabeca: numeroDe(cabeca),
      padrao: padrao.value.trim().replace(/\s*[×X]\s*/g, 'x'),
      comprimento: numeroDe(comprimento),
      balanco: numeroDe(balanco),
      rigidez: numeroDe(rigidez),
      material: material.value.trim(),
      estilo: selEstilo.value,
      formato: selFormato.value,
      listras: listras.marcado,
      logotipo: logotipo.marcado,
      corPrincipal: corPrincipal.valor,
      corSecundaria: corSecundaria.valor,
      corDetalhe: corDetalhe.valor,
      corGrip: corGrip.valor,
      corHaste: hasteFixa,
      observacoes: obs.value.trim(),
      catalogoId: res && res.item.marca === m && res.item.modelo === mo ? opcaoCatalogo : null,
    };
  }

  async function salvar(ev) {
    const dados = coletar();
    if (!dados.marca && !dados.modelo) {
      aviso('Informe ao menos a marca ou o modelo.');
      marca.focus();
      return;
    }
    ev.currentTarget.disabled = true;
    await salvarRaquete(dados);
    aviso('Raquete salva');
    voltar(id ? `/raquete/${id}` : '/ajustes');
  }

  async function alternarAtiva() {
    await definirAtiva(id, !r.ativa);
    aviso(r.ativa ? 'Raquete aposentada' : 'Raquete reativada');
    voltar(`/raquete/${id}`);
  }

  async function excluir() {
    const ok = await confirmar({
      titulo: 'Excluir raquete?',
      texto: 'A raquete, todos os setups e o histórico dela serão apagados deste aparelho. Se quiser só tirá-la da tela inicial, use “Aposentar”.',
      ok: 'Excluir',
      perigo: true,
    });
    if (!ok) return;
    await excluirRaquete(id);
    aviso('Raquete excluída');
    irParaInicio();
  }

  const form = h('div', { class: 'form' },
    previa,
    h('section', { class: 'secao-form' },
      h('h2', null, 'Preencher pelo catálogo'),
      catalogo.el,
      infoCatalogo),
    h('section', { class: 'secao-form' },
      h('h2', null, 'Raquete'),
      h('div', { class: 'grade-2' }, campo('Marca', marca), campo('Modelo', modelo)),
      campo('Ano', ano)),
    h('section', { class: 'secao-form' },
      h('h2', null, 'Ficha técnica'),
      h('div', { class: 'grade-2' }, campo('Peso sem corda (g)', peso), campo('Cabeça (pol²)', cabeca)),
      campo('Padrão de encordoamento', padrao, chipsPadrao),
      h('div', { class: 'grade-3' }, campo('Compr. (cm)', comprimento), campo('Balanço (mm)', balanco), campo('Rigidez (RA)', rigidez)),
      campo('Material e tecnologias', material)),
    h('section', { class: 'secao-form' },
      h('h2', null, 'Ilustração'),
      h('div', { class: 'subtitulo-form' }, 'Copiar pintura de um modelo'),
      copiarPintura.el,
      h('p', { class: 'dica' }, 'Aplica só as cores e o desenho; a ficha técnica não muda.'),
      h('div', { class: 'grade-2' }, campo('Pintura', selEstilo), campo('Formato da cabeça', selFormato)),
      listras.el,
      logotipo.el,
      campo('Cor principal', corPrincipal.el),
      campo('Cor secundária', corSecundaria.el),
      campo('Grip', corGrip.el),
      h('details', { class: 'mais-cores' },
        h('summary', null, 'Mais cores'),
        h('div', { class: 'form' },
          campo('Detalhes (filetes, logotipo, listras)', corDetalhe.el),
          campo('Haste (garganta)', corHaste.el)))),
    h('section', { class: 'secao-form' },
      h('h2', null, 'Observações'),
      obs),
    id
      ? h('section', { class: 'secao-form' },
        h('h2', null, 'Situação'),
        h('p', { class: 'dica' }, r.ativa
          ? 'Raquetes aposentadas saem da tela inicial, mas continuam no histórico.'
          : 'Esta raquete está aposentada e não aparece na tela inicial.'),
        h('div', { class: 'zona-perigo' },
          h('button', { class: 'btn btn-sec', type: 'button', onclick: alternarAtiva }, r.ativa ? 'Aposentar raquete' : 'Reativar raquete'),
          h('button', { class: 'btn btn-perigo', type: 'button', onclick: excluir }, icone('lixo'), 'Excluir raquete e histórico')))
      : null,
    h('div', { class: 'barra-salvar' }, h('button', { class: 'btn', type: 'button', onclick: salvar }, 'Salvar raquete')));

  mostrarInfoCatalogo();
  atualizarPrevia();
  return h('div', null, cabecalho(id ? 'Editar raquete' : 'Nova raquete', id ? `/raquete/${id}` : '/ajustes'), form);
}
