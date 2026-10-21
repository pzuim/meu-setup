// Regras de negócio dos dados pessoais: raquetes, setups (encordoamentos) e eventos do histórico.
// Um setup nunca é apagado numa troca: o anterior muda de status e continua no histórico.

import * as db from './db.js';
import { uid, hoje } from './util.js';

let versao = 0;
let seq = 0;
export const versaoDados = () => versao;

const agora = () => new Date().toISOString();

export const TIPOS_CORDA = {
  poliester: 'Poliéster',
  multifilamento: 'Multifilamento',
  natural_gut: 'Natural gut',
  sintetica: 'Sintética (nylon)',
  outro: 'Outro',
};

export const STATUS_CORDA = { ativa: 'Ativa', removida: 'Removida', estourada: 'Estourada' };

export const TIPOS_EVENTO = {
  instalou_corda: 'Instalou corda',
  alterou_tensao: 'Alterou tensão',
  corda_estourou: 'Corda estourou',
  removeu_setup: 'Removeu setup',
  raquete_cadastrada: 'Raquete cadastrada',
  raquete_aposentada: 'Raquete aposentada',
  raquete_reativada: 'Raquete reativada',
};

function novoEvento(tipo, raqueteId, setupId, data, extra = {}) {
  return { id: uid(), tipo, raqueteId, setupId, data, motivo: '', criadoEm: agora(), seq: Date.now() * 100 + (seq++ % 100), ...extra };
}

// ---------- Inicialização ----------

export async function iniciarDados() {
  await db.abrir();
  const semeado = await db.obter('meta', 'semeado');
  if (semeado) return;
  const r = {
    id: uid(),
    marca: 'Head',
    modelo: 'Speed MP 315',
    ano: null, peso: null, cabeca: null, padrao: '', comprimento: null, balanco: null, rigidez: null,
    material: '',
    estilo: 'solido', formato: 'oval', listras: false,
    corPrincipal: '#f1f1ec', corSecundaria: '#1b1b1b', corDetalhe: '#1b1b1b', corGrip: '#2a2a2a', corHaste: null,
    observacoes: 'Modelo antigo, com mais de 15 anos. Não assumir que seja uma versão atual da linha Speed.',
    catalogoId: null, ativa: true, ordem: 1, criadoEm: agora(),
  };
  await db.lote([
    { colecao: 'raquetes', put: r },
    { colecao: 'eventos', put: novoEvento('raquete_cadastrada', r.id, null, hoje()) },
    { colecao: 'meta', put: { chave: 'semeado', valor: true } },
  ]);
  versao++;
}

export async function lerMeta(chave) {
  return (await db.obter('meta', chave))?.valor ?? null;
}

export async function gravarMeta(chave, valor) {
  await db.lote([{ colecao: 'meta', put: { chave, valor } }]);
}

// ---------- Raquetes ----------

const porOrdem = (a, b) => (a.ordem ?? 0) - (b.ordem ?? 0) || String(a.criadoEm).localeCompare(String(b.criadoEm));

export async function listarRaquetes() {
  return (await db.todos('raquetes')).sort(porOrdem);
}

export const obterRaquete = (id) => db.obter('raquetes', id);

export const nomeRaquete = (r) => (r ? `${r.marca || ''} ${r.modelo || ''}`.trim() || 'Raquete sem nome' : 'Raquete removida');

export async function salvarRaquete(dados) {
  const ops = [];
  let r;
  if (dados.id) {
    r = { ...(await obterRaquete(dados.id)), ...dados };
  } else {
    const todas = await listarRaquetes();
    r = { ...dados, id: uid(), ativa: true, ordem: Math.max(0, ...todas.map((x) => x.ordem ?? 0)) + 1, criadoEm: agora() };
    ops.push({ colecao: 'eventos', put: novoEvento('raquete_cadastrada', r.id, null, hoje()) });
  }
  ops.push({ colecao: 'raquetes', put: r });
  await db.lote(ops);
  versao++;
  return r;
}

export async function definirAtiva(id, ativa) {
  const r = await obterRaquete(id);
  await db.lote([
    { colecao: 'raquetes', put: { ...r, ativa } },
    { colecao: 'eventos', put: novoEvento(ativa ? 'raquete_reativada' : 'raquete_aposentada', id, null, hoje()) },
  ]);
  versao++;
}

export async function moverRaquete(id, delta) {
  const lista = await listarRaquetes();
  const i = lista.findIndex((r) => r.id === id);
  const j = i + delta;
  if (i < 0 || j < 0 || j >= lista.length) return;
  [lista[i], lista[j]] = [lista[j], lista[i]];
  await db.lote(lista.map((r, k) => ({ colecao: 'raquetes', put: { ...r, ordem: k + 1 } })));
  versao++;
}

export async function excluirRaquete(id) {
  const [setups, eventos] = await Promise.all([db.todos('setups'), db.todos('eventos')]);
  await db.lote([
    { colecao: 'raquetes', del: id },
    ...setups.filter((s) => s.raqueteId === id).map((s) => ({ colecao: 'setups', del: s.id })),
    ...eventos.filter((e) => e.raqueteId === id).map((e) => ({ colecao: 'eventos', del: e.id })),
  ]);
  versao++;
}

// ---------- Setups (encordoamentos) ----------

const porInstalacao = (a, b) =>
  String(a.dataInstalacao).localeCompare(String(b.dataInstalacao)) || String(a.criadoEm).localeCompare(String(b.criadoEm));

export const todosSetups = () => db.todos('setups');

export async function setupsDaRaquete(raqueteId) {
  return (await db.todos('setups')).filter((s) => s.raqueteId === raqueteId).sort(porInstalacao);
}

export const obterSetup = (id) => db.obter('setups', id);

export async function setupAtivo(raqueteId) {
  return (await setupsDaRaquete(raqueteId)).filter((s) => s.status === 'ativa').pop() ?? null;
}

export async function ultimoSetup(raqueteId) {
  return (await setupsDaRaquete(raqueteId)).pop() ?? null;
}

// Estado usado para desenhar a raquete: corda ativa, corda estourada (sem substituta) ou sem corda.
export async function estadoCorda(raqueteId) {
  const lista = await setupsDaRaquete(raqueteId);
  const ativo = lista.filter((s) => s.status === 'ativa').pop();
  if (ativo) return { estado: 'ativa', setup: ativo };
  const ultimo = lista[lista.length - 1];
  if (ultimo?.status === 'estourada') return { estado: 'estourada', setup: ultimo };
  return { estado: 'vazia', setup: ultimo ?? null };
}

export const cordaH = (s) => (s ? s.horizontais || s.verticais : null);

const chaveCorda = (c) => [c?.marca, c?.modelo, c?.calibre].map((x) => String(x ?? '').trim().toLowerCase()).join('|');

export function mesmasCordas(a, b) {
  return chaveCorda(a.verticais) === chaveCorda(b.verticais) && chaveCorda(cordaH(a)) === chaveCorda(cordaH(b));
}

// Instala um novo setup. O ativo (se houver) passa a "removida" ou "estourada" e fica no histórico.
export async function instalarSetup(raqueteId, novo, { destinoAnterior = 'removida', motivo = '' } = {}) {
  const lista = await setupsDaRaquete(raqueteId);
  const ativo = lista.filter((s) => s.status === 'ativa').pop() ?? null;
  const ultimo = lista[lista.length - 1] ?? null;
  const s = {
    ...novo,
    id: uid(),
    raqueteId,
    status: 'ativa',
    dataRemocao: null,
    motivoTroca: '',
    anteriorId: ultimo?.id ?? null,
    criadoEm: agora(),
  };
  const ops = [];
  if (ativo) {
    ops.push({ colecao: 'setups', put: { ...ativo, status: destinoAnterior, dataRemocao: s.dataInstalacao, motivoTroca: motivo, encerradoPor: s.id } });
    if (destinoAnterior === 'estourada') {
      ops.push({ colecao: 'eventos', put: novoEvento('corda_estourou', raqueteId, ativo.id, s.dataInstalacao, { motivo, trocaId: s.id }) });
    }
  }
  const soTensao = ultimo && mesmasCordas(ultimo, s) && (ultimo.tensaoV !== s.tensaoV || ultimo.tensaoH !== s.tensaoH);
  ops.push({ colecao: 'setups', put: s });
  ops.push({ colecao: 'eventos', put: novoEvento(soTensao ? 'alterou_tensao' : 'instalou_corda', raqueteId, s.id, s.dataInstalacao, { motivo, trocaId: s.id }) });
  await db.lote(ops);
  versao++;
  return s;
}

// Corrige dados de um setup sem gerar evento no histórico.
export async function atualizarSetup(s) {
  await db.lote([{ colecao: 'setups', put: s }]);
  versao++;
}

// Encerra o setup ativo sem instalar outro (corda estourou ou foi removida).
export async function encerrarSetup(setupId, status, { data, motivo }) {
  const s = await obterSetup(setupId);
  await db.lote([
    { colecao: 'setups', put: { ...s, status, dataRemocao: data, motivoTroca: motivo } },
    { colecao: 'eventos', put: novoEvento(status === 'estourada' ? 'corda_estourou' : 'removeu_setup', s.raqueteId, s.id, data, { motivo }) },
  ]);
  versao++;
}

// Informa se excluir este setup devolve o anterior à condição de ativo.
export async function anteriorRestauravel(setup) {
  if (setup.status !== 'ativa' || !setup.anteriorId) return null;
  const ant = await obterSetup(setup.anteriorId);
  return ant && ant.status !== 'ativa' && ant.encerradoPor === setup.id ? ant : null;
}

// Exclusão de um registro feito por engano.
export async function excluirSetup(id) {
  const s = await obterSetup(id);
  if (!s) return;
  const [setups, eventos] = await Promise.all([setupsDaRaquete(s.raqueteId), db.todos('eventos')]);
  const restaurar = await anteriorRestauravel(s);
  const ops = [{ colecao: 'setups', del: id }];
  for (const e of eventos) if (e.setupId === id || e.trocaId === id) ops.push({ colecao: 'eventos', del: e.id });
  for (const o of setups) if (o.anteriorId === id) ops.push({ colecao: 'setups', put: { ...o, anteriorId: s.anteriorId } });
  if (restaurar) {
    const { encerradoPor, ...resto } = restaurar;
    ops.push({ colecao: 'setups', put: { ...resto, status: 'ativa', dataRemocao: null, motivoTroca: '' } });
  }
  await db.lote(ops);
  versao++;
}

// ---------- Eventos ----------

export async function listarEventos(raqueteId = null) {
  const lista = await db.todos('eventos');
  return lista
    .filter((e) => !raqueteId || e.raqueteId === raqueteId)
    .sort((a, b) => String(b.data).localeCompare(String(a.data)) || (b.seq ?? 0) - (a.seq ?? 0));
}

// ---------- Backup ----------

const FORMATO = 'aplicativo_raquete.backup';

export async function exportarBackup() {
  const [raquetes, setups, eventos] = await Promise.all(db.COLECOES.map((c) => db.todos(c)));
  return { formato: FORMATO, versao: 1, exportadoEm: agora(), dados: { raquetes, setups, eventos } };
}

export function validarBackup(obj) {
  if (!obj || obj.formato !== FORMATO) return 'Este arquivo não é um backup deste aplicativo.';
  const d = obj.dados;
  if (!d || !Array.isArray(d.raquetes) || !Array.isArray(d.setups) || !Array.isArray(d.eventos)) return 'O backup está incompleto.';
  const comId = (lista) => lista.every((x) => x && typeof x.id === 'string');
  if (!comId(d.raquetes) || !comId(d.setups) || !comId(d.eventos)) return 'O backup tem registros sem identificador.';
  return null;
}

export async function importarBackup(obj) {
  const { raquetes, setups, eventos } = obj.dados;
  await db.lote([
    ...db.COLECOES.map((colecao) => ({ colecao, limpar: true })),
    ...raquetes.map((put) => ({ colecao: 'raquetes', put })),
    ...setups.map((put) => ({ colecao: 'setups', put })),
    ...eventos.map((put) => ({ colecao: 'eventos', put })),
    { colecao: 'meta', put: { chave: 'semeado', valor: true } },
  ]);
  versao++;
}
