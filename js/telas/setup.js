// Painel da corda (toque na cabeça), detalhes de um setup do histórico e formulário de troca/edição.

import { h, hoje, fmtData, fmtNum, fmtLbs, diasEntre, fmtDias, lerNumero } from '../util.js';
import {
  obterRaquete, obterSetup, estadoCorda, setupAtivo, ultimoSetup, cordaH, nomeRaquete,
  instalarSetup, atualizarSetup, encerrarSetup, excluirSetup, anteriorRestauravel,
  TIPOS_CORDA, STATUS_CORDA,
} from '../dados.js';
import { carregarCatalogo, marcas, agrupar } from '../catalogo.js';
import { desenharRaquete } from '../raquete-svg.js';
import { nomeCorda, detalheCorda, resumoSetup } from '../resumo.js';
import { ir, voltar, recarregar } from '../nav.js';
import { icone, cabecalho, campo, bloco, amostra, aviso, confirmar, pedirDataMotivo, naoEncontrado } from '../ui.js';
import { seletorCor, campoTensao, segmentado, interruptor, seletorMarcaModelo, PALETA_CORDA } from '../campos.js';

const MOTIVOS_TROCA = ['Perdeu tensão', 'Corda morta', 'Testar outra corda', 'Mais conforto', 'Mais controle', 'Mais spin'];

// ---------- Painéis ----------

export async function folhaCorda(raqueteId) {
  const r = await obterRaquete(raqueteId);
  if (!r) return naoEncontrado('Raquete não encontrada.');
  const { estado, setup } = await estadoCorda(raqueteId);
  if (estado === 'ativa') return conteudoSetup(setup, r);

  return h('div', null,
    h('p', { class: 'sobretitulo' }, nomeRaquete(r)),
    h('h2', { class: 'titulo-grande' }, estado === 'estourada' ? 'A corda estourou' : 'Sem corda instalada'),
    h('p', { class: 'dica', style: 'margin-top:10px' },
      !setup ? 'Registre a corda que está na raquete para acompanhar o setup e comparar as próximas trocas.'
        : estado === 'estourada' ? `Estourou em ${fmtData(setup.dataRemocao)}. Registre a corda nova quando encordoar.`
          : `O último setup foi removido em ${fmtData(setup.dataRemocao)}.`),
    setup
      ? h('button', { class: 'linha-link', type: 'button', onclick: () => ir(`/setup/${setup.id}`) },
        amostra(setup.verticais?.cor),
        h('span', null, h('small', null, 'Último setup'), resumoSetup(setup)),
        icone('direita'))
      : null,
    h('div', { class: 'acoes' },
      h('button', { class: 'btn', type: 'button', onclick: () => ir(`/raquete/${raqueteId}/trocar`) }, icone('mais'), 'Registrar corda')));
}

export async function folhaSetup(setupId) {
  const s = await obterSetup(setupId);
  if (!s) return naoEncontrado('Este setup não existe mais.');
  const r = await obterRaquete(s.raqueteId);
  return conteudoSetup(s, r);
}

function linhaCorda(rotulo, c) {
  return h('div', { class: 'corda-linha' },
    amostra(c?.cor, c?.corNome),
    h('div', { class: 'corda-info' },
      rotulo ? h('small', null, rotulo) : null,
      rotulo ? h('strong', null, nomeCorda(c)) : null,
      h('span', null, detalheCorda(c) || 'Detalhes não informados')));
}

function conteudoSetup(s, r) {
  const ativo = s.status === 'ativa';
  const hz = cordaH(s);
  const tensoesDiferentes = (s.tensaoH ?? s.tensaoV) !== s.tensaoV;
  const dias = diasEntre(s.dataInstalacao, s.dataRemocao || hoje());

  const specs = [
    ['Instalação', fmtData(s.dataInstalacao)],
    s.dataRemocao ? [s.status === 'estourada' ? 'Estourou em' : 'Removida em', fmtData(s.dataRemocao)] : null,
    ativo && dias === 0 ? ['Em uso', 'desde hoje'] : [ativo ? 'Em uso há' : 'Tempo de uso', fmtDias(dias)],
  ].filter(Boolean);

  const acoes = ativo
    ? [
      h('button', { class: 'btn', type: 'button', onclick: () => ir(`/raquete/${s.raqueteId}/trocar`) }, icone('trocar'), 'Trocar setup'),
      h('div', { class: s.anteriorId ? 'acoes-par' : 'acoes-linha' },
        h('button', { class: 'btn btn-sec', type: 'button', onclick: () => ir(`/setup/${s.id}/editar`) }, icone('editar'), 'Editar'),
        s.anteriorId ? h('button', { class: 'btn btn-sec', type: 'button', onclick: () => ir(`/setup/${s.id}/comparar`) }, icone('comparar'), 'Comparar') : null),
      h('div', { class: 'acoes-par' },
        h('button', { class: 'btn btn-txt', type: 'button', onclick: () => estourou(s) }, icone('raio'), 'Corda estourou'),
        h('button', { class: 'btn btn-txt', type: 'button', onclick: () => remover(s) }, icone('remover'), 'Remover corda')),
      h('button', { class: 'btn btn-perigo', type: 'button', onclick: () => excluir(s) }, icone('lixo'), 'Excluir registro feito por engano'),
    ]
    : [
      s.anteriorId ? h('button', { class: 'btn btn-sec', type: 'button', onclick: () => ir(`/setup/${s.id}/comparar`) }, icone('comparar'), 'Comparar com o anterior') : null,
      h('button', { class: 'btn btn-sec', type: 'button', onclick: () => ir(`/setup/${s.id}/editar`) }, icone('editar'), 'Editar registro'),
      h('button', { class: 'btn btn-perigo', type: 'button', onclick: () => excluir(s) }, icone('lixo'), 'Excluir registro'),
    ];

  return h('div', null,
    h('p', { class: 'sobretitulo' }, nomeRaquete(r)),
    h('h2', { class: 'titulo-grande' }, s.horizontais ? 'Setup híbrido' : nomeCorda(s.verticais)),
    h('div', { class: 'linha-status' },
      h('span', { class: `status status-${s.status}` }, ativo ? 'Instalada' : STATUS_CORDA[s.status] || s.status)),
    h('div', { class: 'cordas' },
      s.horizontais ? [linhaCorda('Verticais', s.verticais), linhaCorda('Horizontais', hz)] : linhaCorda(null, s.verticais)),
    h('div', { class: 'tensao-grande' },
      h('strong', null, tensoesDiferentes ? `${fmtLbs(s.tensaoV)}/${fmtLbs(s.tensaoH)}` : fmtLbs(s.tensaoV)),
      h('span', null, tensoesDiferentes ? 'lbs · verticais / horizontais' : 'lbs')),
    h('dl', { class: 'specs' }, specs.map(([k, v]) => h('div', null, h('dt', null, k), h('dd', null, v)))),
    bloco('Motivo da troca', s.motivoTroca),
    bloco('Observações', s.observacoes),
    h('div', { class: 'acoes' }, acoes));
}

async function estourou(s) {
  const res = await pedirDataMotivo({
    titulo: 'A corda estourou?',
    texto: 'O setup continua salvo no histórico, marcado como estourado.',
    ok: 'Registrar',
    sugestoes: ['Desgaste', 'Jogando', 'Batida na moldura'],
    perigo: true,
  });
  if (!res) return;
  if (res.data < s.dataInstalacao) return aviso('A data não pode ser anterior à instalação.');
  await encerrarSetup(s.id, 'estourada', res);
  aviso('Registrado no histórico');
  recarregar();
}

async function remover(s) {
  const res = await pedirDataMotivo({
    titulo: 'Remover a corda?',
    texto: 'A raquete fica sem corda até você registrar outra. O setup continua no histórico.',
    ok: 'Remover',
    sugestoes: ['Perdeu tensão', 'Corda morta', 'Vou testar outra'],
  });
  if (!res) return;
  if (res.data < s.dataInstalacao) return aviso('A data não pode ser anterior à instalação.');
  await encerrarSetup(s.id, 'removida', res);
  aviso('Corda removida');
  recarregar();
}

async function excluir(s) {
  const restaura = await anteriorRestauravel(s);
  const ok = await confirmar({
    titulo: 'Excluir este registro?',
    texto: restaura
      ? 'Use só para corrigir um registro feito por engano. O setup anterior volta a ser o atual.'
      : 'Use só para corrigir um registro feito por engano. Ele sai do histórico.',
    ok: 'Excluir',
    perigo: true,
  });
  if (!ok) return;
  await excluirSetup(s.id);
  aviso('Registro excluído');
  voltar('/historico');
}

// ---------- Formulário ----------

function calibrePadrao(lista) {
  return lista.reduce((melhor, v) => (Math.abs(v - 1.25) < Math.abs(melhor - 1.25) ? v : melhor), lista[0]);
}

const ROTULO_TIPO_PLURAL = {
  poliester: 'Poliéster', multifilamento: 'Multifilamento', natural_gut: 'Natural gut', sintetica: 'Sintética', outro: 'Outras',
};

function blocoCorda(inicial, cordas, aoMudar) {
  const c = inicial || {};
  let escolhida = cordas.find((x) => x.id === c.catalogoId) || null;
  const lojas = h('p', { class: 'dica' });
  const catalogo = seletorMarcaModelo({
    marcas: [...marcas(cordas)].sort((a, b) => a.localeCompare(b)),
    marcaInicial: escolhida?.marca || '',
    valorInicial: escolhida?.id || '',
    opcoesDaMarca: (m) => agrupar(cordas.filter((it) => it.marca === m), 'tipo')
      .map(([tipo, itens]) => [ROTULO_TIPO_PLURAL[tipo] || tipo, itens.map((it) => ({ valor: it.id, rotulo: it.modelo }))]),
    aoEscolher: (valor) => {
      escolhida = cordas.find((x) => x.id === valor) || null;
      if (escolhida) aplicar(escolhida);
      mostrarLojas();
      sugestoes();
      aoMudar();
    },
  });

  function mostrarLojas() {
    lojas.textContent = !escolhida
      ? 'Escolha no catálogo ou preencha manualmente abaixo.'
      : escolhida.lojasRJ?.length
        ? `Vista à venda no Rio: ${escolhida.lojasRJ.join(', ')}.`
        : 'Não vista nas lojas do Rio consultadas (Barra Tennis e Pró-Tênis Barra).';
  }

  const marca = h('input', { class: 'campo-input', value: c.marca || '', maxlength: '60', autocomplete: 'off' });
  const modelo = h('input', { class: 'campo-input', value: c.modelo || '', maxlength: '80', autocomplete: 'off' });
  const tipo = h('select', { class: 'campo-input' }, Object.entries(TIPOS_CORDA).map(([v, rotulo]) => h('option', { value: v }, rotulo)));
  tipo.value = c.tipo in TIPOS_CORDA ? c.tipo : 'poliester';
  const calibre = h('input', {
    class: 'campo-input', type: 'text', inputmode: 'decimal', autocomplete: 'off',
    value: c.calibre ? fmtNum(c.calibre, 2) : '', placeholder: 'ex.: 1,25',
  });
  const chipsCalibre = h('div', { class: 'chips' });
  const cor = seletorCor({ valor: c.cor || PALETA_CORDA[0].hex, nome: c.corNome, paleta: PALETA_CORDA, aoMudar });

  const item = () => escolhida;

  function sugestoes() {
    const it = item();
    const atual = lerNumero(calibre.value);
    const lista = it?.calibres || [];
    chipsCalibre.replaceChildren(...lista.map((v) => h('button', {
      type: 'button',
      class: 'chip' + (atual != null && Math.abs(v - atual) < 0.001 ? ' ativo' : ''),
      onclick: () => { calibre.value = fmtNum(v, 2); sugestoes(); aoMudar(); },
    }, `${fmtNum(v, 2)} mm`)));
    chipsCalibre.hidden = !lista.length;
  }

  function aplicar(it) {
    marca.value = it.marca ?? '';
    modelo.value = it.modelo ?? '';
    tipo.value = it.tipo in TIPOS_CORDA ? it.tipo : 'outro';
    const atual = lerNumero(calibre.value);
    if (it.calibres?.length && !it.calibres.some((v) => Math.abs(v - atual) < 0.001)) {
      calibre.value = fmtNum(calibrePadrao(it.calibres), 2);
    }
    cor.definirSugestoes(it.cores || []);
    if (it.cores?.length) cor.definir(it.cores[0].hex, it.cores[0].nome, true);
  }

  calibre.addEventListener('input', sugestoes);
  cor.definirSugestoes(item()?.cores || []);
  sugestoes();
  mostrarLojas();

  const el = h('div', { class: 'form' },
    h('div', { class: 'subtitulo-form' }, 'Do catálogo'),
    catalogo.el,
    lojas,
    h('div', { class: 'subtitulo-form' }, 'Dados da corda'),
    h('div', { class: 'grade-2' }, campo('Marca', marca), campo('Modelo', modelo)),
    h('div', { class: 'grade-2' }, campo('Tipo', tipo), campo('Calibre (mm)', calibre)),
    chipsCalibre,
    campo('Cor', cor.el));

  return {
    el,
    get cor() { return cor.valor; },
    coletar() {
      const it = item();
      const m = marca.value.trim();
      const mo = modelo.value.trim();
      return {
        catalogoId: it && it.marca === m && it.modelo === mo ? it.id : null,
        marca: m,
        modelo: mo,
        tipo: tipo.value,
        calibre: lerNumero(calibre.value),
        cor: cor.valor,
        corNome: cor.nome,
      };
    },
  };
}

export async function formSetup({ raqueteId, setupId }) {
  const edicao = Boolean(setupId);
  const original = edicao ? await obterSetup(setupId) : null;
  if (edicao && !original) return h('div', null, cabecalho('Setup', '/'), naoEncontrado('Setup não encontrado.'));
  const rid = edicao ? original.raqueteId : raqueteId;
  const r = await obterRaquete(rid);
  if (!r) return h('div', null, cabecalho('Setup', '/'), naoEncontrado('Raquete não encontrada.'));

  const ativo = edicao ? null : await setupAtivo(rid);
  const ultimo = edicao ? null : await ultimoSetup(rid);
  const base = original ?? ativo ?? ultimo;
  const cat = await carregarCatalogo();
  const voltarPara = edicao ? `/setup/${setupId}` : `/raquete/${rid}/corda`;

  const previa = h('div', { class: 'previa', 'aria-hidden': 'true' });
  const tituloV = h('h2', null, 'Corda');
  const blocoV = blocoCorda(base?.verticais, cat.cordas, atualizar);
  const blocoH = blocoCorda(base?.horizontais ?? base?.verticais, cat.cordas, atualizar);
  const secaoH = h('section', { class: 'secao-form' }, h('h2', null, 'Horizontais'), blocoH.el);
  const hibrido = interruptor('Híbrido', 'Outra corda nas horizontais', Boolean(base?.horizontais), atualizar);

  let vinculadas = (base?.tensaoH ?? base?.tensaoV) === base?.tensaoV;
  const tV = campoTensao('Verticais', base?.tensaoV ?? null, () => {
    if (vinculadas) tH.definir(tV.valor);
  });
  const tH = campoTensao('Horizontais', base?.tensaoH ?? base?.tensaoV ?? null, () => {
    vinculadas = tH.valor === tV.valor;
  });

  const data = h('input', { type: 'date', class: 'campo-input', value: edicao ? original.dataInstalacao : hoje(), max: hoje() });
  const obs = h('textarea', { class: 'campo-input', maxlength: '1000', placeholder: 'Ex.: onde encordoou, primeiras impressões…' });
  obs.value = edicao ? original.observacoes || '' : '';

  // O que aconteceu com a corda anterior (só numa troca)
  const destino = !edicao && ativo ? segmentado([['removida', 'Foi removida'], ['estourada', 'Estourou']], 'removida') : null;
  const motivo = !edicao && (ativo || ultimo)
    ? h('input', { type: 'text', class: 'campo-input', maxlength: '160', placeholder: 'Opcional' })
    : null;
  const chipsMotivo = motivo
    ? h('div', { class: 'chips' }, MOTIVOS_TROCA.map((m) => h('button', { type: 'button', class: 'chip', onclick: () => { motivo.value = m; } }, m)))
    : null;

  function atualizar() {
    const hib = hibrido.marcado;
    secaoH.hidden = !hib;
    tituloV.textContent = hib ? 'Verticais' : 'Corda';
    previa.innerHTML = desenharRaquete(r, { estado: 'ativa', corV: blocoV.cor, corH: hib ? blocoH.cor : blocoV.cor });
  }

  async function salvar(ev) {
    const botao = ev.currentTarget;
    const v = blocoV.coletar();
    const hib = hibrido.marcado;
    const hz = hib ? blocoH.coletar() : null;
    if (!v.marca && !v.modelo) return aviso(hib ? 'Informe a corda das verticais.' : 'Informe a marca ou o modelo da corda.');
    if (hib && !hz.marca && !hz.modelo) return aviso('Informe a corda das horizontais.');
    const tv = tV.valor;
    const th = tH.valor ?? tv;
    if (tv == null || tv < 20 || tv > 90) {
      tV.input.focus();
      return aviso('Informe a tensão das verticais (entre 20 e 90 lbs).');
    }
    if (th < 20 || th > 90) {
      tH.input.focus();
      return aviso('A tensão das horizontais deve ficar entre 20 e 90 lbs.');
    }
    const dataInstalacao = data.value || hoje();
    if (ativo && dataInstalacao < ativo.dataInstalacao) return aviso('A data é anterior à instalação do setup atual.');
    if (edicao && original.dataRemocao && dataInstalacao > original.dataRemocao) return aviso('A data é posterior à remoção deste setup.');

    const dados = { verticais: v, horizontais: hz, tensaoV: tv, tensaoH: th, dataInstalacao, observacoes: obs.value.trim() };
    botao.disabled = true;
    try {
      if (edicao) {
        await atualizarSetup({ ...original, ...dados });
        aviso('Setup atualizado');
        voltar(voltarPara);
        return;
      }
      const novo = await instalarSetup(rid, dados, { destinoAnterior: destino?.valor ?? 'removida', motivo: motivo?.value.trim() ?? '' });
      aviso('Setup salvo');
      if (novo.anteriorId) ir(`/setup/${novo.id}/comparar`, { substituir: true });
      else voltar(voltarPara);
    } catch (erro) {
      console.error(erro);
      aviso('Não foi possível salvar.');
      botao.disabled = false;
    }
  }

  const secaoAnterior = !edicao && (ativo || ultimo)
    ? h('section', { class: 'secao-form' },
      h('h2', null, ativo ? 'Corda anterior' : 'Motivo'),
      ativo ? h('p', { class: 'dica' }, `Atual: ${resumoSetup(ativo)}. Ela continua salva no histórico.`) : null,
      destino ? destino.el : null,
      campo('Motivo da troca', motivo, chipsMotivo))
    : null;

  const titulo = edicao ? 'Editar setup' : ativo ? 'Trocar setup' : 'Registrar corda';
  const textoSalvar = edicao ? 'Salvar alterações' : ultimo ? 'Salvar e comparar' : 'Salvar';

  const form = h('div', { class: 'form' },
    previa,
    h('p', { class: 'sobretitulo', style: 'text-align:center;margin:-4px 0 4px' }, nomeRaquete(r)),
    h('section', { class: 'secao-form' }, tituloV, blocoV.el, hibrido.el),
    secaoH,
    h('section', { class: 'secao-form' },
      h('h2', null, 'Tensão'),
      h('div', { class: 'grade-2' }, tV.el, tH.el),
      h('p', { class: 'dica' }, 'As horizontais acompanham as verticais até você mudá-las.')),
    h('section', { class: 'secao-form' },
      h('h2', null, 'Instalação'),
      campo('Data', data),
      campo('Observações', obs)),
    secaoAnterior,
    h('div', { class: 'barra-salvar' }, h('button', { class: 'btn', type: 'button', onclick: salvar }, textoSalvar)));

  atualizar();
  return h('div', null, cabecalho(titulo, voltarPara), form);
}
