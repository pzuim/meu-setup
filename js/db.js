// Camada fina sobre o IndexedDB. Todos os dados pessoais ficam aqui, no aparelho.

const NOME = 'aplicativo_raquete';
const VERSAO = 1;
export const COLECOES = ['raquetes', 'setups', 'eventos'];

let conexao;

export function abrir() {
  conexao ??= new Promise((resolve, reject) => {
    const req = indexedDB.open(NOME, VERSAO);
    req.onupgradeneeded = () => {
      const db = req.result;
      for (const nome of COLECOES) {
        if (!db.objectStoreNames.contains(nome)) db.createObjectStore(nome, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('meta')) db.createObjectStore('meta', { keyPath: 'chave' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
    req.onblocked = () => reject(new Error('O banco local está bloqueado por outra aba do aplicativo.'));
  });
  return conexao;
}

function pedido(req) {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function todos(colecao) {
  const db = await abrir();
  return pedido(db.transaction(colecao).objectStore(colecao).getAll());
}

export async function obter(colecao, id) {
  const db = await abrir();
  return pedido(db.transaction(colecao).objectStore(colecao).get(id));
}

// Grava várias operações numa única transação (tudo ou nada).
// ops: [{ colecao, put: objeto } | { colecao, del: id } | { colecao, limpar: true }]
export async function lote(ops) {
  const db = await abrir();
  const nomes = [...new Set(ops.map((o) => o.colecao))];
  return new Promise((resolve, reject) => {
    const tx = db.transaction(nomes, 'readwrite');
    for (const o of ops) {
      const store = tx.objectStore(o.colecao);
      if (o.limpar) store.clear();
      else if (o.del !== undefined) store.delete(o.del);
      else store.put(o.put);
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error || new Error('A gravação foi cancelada.'));
  });
}
