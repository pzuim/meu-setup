// Service worker: guarda todos os arquivos do app para funcionar offline.
// Ao alterar código, CSS ou ícones, aumente VERSAO para os aparelhos baixarem a nova versão.
// O catálogo (catalogo/*.json) se atualiza sozinho: usa a cópia guardada e busca a nova em segundo plano.

const VERSAO = 'v3';
const CACHE = `meu-setup-${VERSAO}`;

const ARQUIVOS = [
  './',
  'index.html',
  'manifest.webmanifest',
  'css/app.css',
  'js/app.js',
  'js/campos.js',
  'js/catalogo.js',
  'js/comparacao.js',
  'js/dados.js',
  'js/db.js',
  'js/nav.js',
  'js/raquete-svg.js',
  'js/resumo.js',
  'js/ui.js',
  'js/util.js',
  'js/telas/ajustes.js',
  'js/telas/comparar.js',
  'js/telas/entenda.js',
  'js/telas/historico.js',
  'js/telas/inicio.js',
  'js/telas/raquete.js',
  'js/telas/setup.js',
  'catalogo/raquetes.json',
  'catalogo/cordas.json',
  'icons/icon.svg',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon-maskable-512.png',
];

self.addEventListener('install', (ev) => {
  ev.waitUntil(caches.open(CACHE).then((c) => c.addAll(ARQUIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (ev) => {
  ev.waitUntil(
    caches.keys()
      .then((nomes) => Promise.all(nomes.filter((n) => n.startsWith('meu-setup-') && n !== CACHE).map((n) => caches.delete(n))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (ev) => {
  const req = ev.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Abrir o app (qualquer navegação) sempre entrega o index.html guardado.
  if (req.mode === 'navigate') {
    ev.respondWith(caches.match('index.html').then((r) => r || fetch(req)));
    return;
  }

  // Catálogo: responde com a cópia guardada e atualiza em segundo plano.
  if (url.pathname.includes('/catalogo/')) {
    ev.respondWith(caches.open(CACHE).then(async (cache) => {
      const guardado = await cache.match(req);
      const rede = fetch(req).then((resp) => {
        if (resp.ok) cache.put(req, resp.clone());
        return resp;
      }).catch(() => guardado);
      return guardado || rede;
    }));
    return;
  }

  // Demais arquivos: cache primeiro, rede como reserva.
  ev.respondWith(caches.match(req).then((r) => r || fetch(req)));
});
