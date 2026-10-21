// Catálogo local (somente leitura), separado dos dados pessoais: catalogo/*.json

let cache;

async function lerJson(caminho) {
  try {
    const resp = await fetch(caminho);
    if (!resp.ok) return null;
    return await resp.json();
  } catch {
    return null;
  }
}

export async function carregarCatalogo() {
  if (cache) return cache;
  const [rq, cd] = await Promise.all([lerJson('catalogo/raquetes.json'), lerJson('catalogo/cordas.json')]);
  cache = {
    raquetes: Array.isArray(rq?.raquetes) ? rq.raquetes : [],
    pinturas: rq?.pinturas && typeof rq.pinturas === 'object' ? rq.pinturas : {},
    cordas: Array.isArray(cd?.cordas) ? cd.cordas : [],
  };
  return cache;
}

// Marcas na ordem em que aparecem no arquivo.
export function marcas(itens) {
  return [...new Set(itens.map((it) => it.marca).filter(Boolean))];
}

// Agrupa itens por um campo (ex.: linha), na ordem do arquivo.
export function agrupar(itens, campo) {
  const grupos = new Map();
  for (const it of itens) {
    const chave = it[campo] || 'Outros';
    if (!grupos.has(chave)) grupos.set(chave, []);
    grupos.get(chave).push(it);
  }
  return [...grupos.entries()];
}

// Uma raquete pode ter várias pinturas (cores alternativas): cada uma vira uma opção "id#n".
export function opcoesRaquete(cat, item) {
  const ids = Array.isArray(item.pintura) ? item.pintura : item.pintura ? [item.pintura] : [];
  if (ids.length <= 1) return [{ valor: `${item.id}#0`, rotulo: item.modelo }];
  return ids.map((id, n) => ({ valor: `${item.id}#${n}`, rotulo: `${item.modelo} · ${cat.pinturas[id]?.nome || 'Pintura ' + (n + 1)}` }));
}

export function resolverOpcao(cat, valor) {
  const [id, n] = String(valor || '').split('#');
  const item = cat.raquetes.find((r) => r.id === id);
  if (!item) return null;
  const ids = Array.isArray(item.pintura) ? item.pintura : item.pintura ? [item.pintura] : [];
  const pinturaId = ids[Number(n) || 0];
  return { item, pinturaId, pintura: cat.pinturas[pinturaId] || null };
}

// Converte uma pintura do catálogo nos campos visuais da raquete.
export function camposDaPintura(p) {
  if (!p) return {};
  return {
    estilo: p.estilo || 'solido',
    formato: p.formato || 'oval',
    listras: Boolean(p.listras),
    corPrincipal: p.principal,
    corSecundaria: p.secundaria,
    corDetalhe: p.detalhe || p.secundaria,
    corGrip: p.grip,
    corHaste: p.haste || null,
  };
}
