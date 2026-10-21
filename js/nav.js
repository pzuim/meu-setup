// Navegação por hash (#/rota). Cada tela aberta entra no histórico do navegador,
// então o botão "voltar" do Android fecha painéis e telas na ordem certa.

let destinoPendente = null;

export function rotaAtual() {
  const bruto = location.hash.replace(/^#/, '') || '/';
  const [caminho, qs] = bruto.split('?');
  return { caminho: caminho || '/', query: new URLSearchParams(qs || ''), bruto };
}

const profundidade = () => history.state?.prof ?? 0;

export function ir(rota, { substituir = false } = {}) {
  const prof = profundidade();
  if (substituir) history.replaceState({ prof }, '', '#' + rota);
  else history.pushState({ prof: prof + 1 }, '', '#' + rota);
  window.dispatchEvent(new Event('rota'));
}

export function voltar(alternativa = '/') {
  if (profundidade() > 0) history.back();
  else ir(alternativa, { substituir: true });
}

export function irParaInicio() {
  const prof = profundidade();
  if (prof > 0) {
    destinoPendente = '/';
    history.go(-prof);
  } else {
    ir('/', { substituir: true });
  }
}

// Chamado pelo roteador depois de um "voltar" múltiplo: garante que paramos na rota pedida.
export function conferirPendente() {
  const destino = destinoPendente;
  destinoPendente = null;
  if (destino && rotaAtual().bruto !== destino) {
    ir(destino, { substituir: true });
    return true;
  }
  return false;
}

export const recarregar = () => window.dispatchEvent(new Event('rota'));
