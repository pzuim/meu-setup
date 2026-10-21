// Configurações: raquetes, backup, aparência e informações.

import { h, hoje, fmtData, corSegura } from '../util.js';
import {
  listarRaquetes, moverRaquete, nomeRaquete, exportarBackup, validarBackup, importarBackup, lerMeta, gravarMeta,
} from '../dados.js';
import { carregarCatalogo } from '../catalogo.js';
import { ir, recarregar } from '../nav.js';
import { icone, aviso, confirmar, temaAtual, aplicarTema } from '../ui.js';
import { segmentado } from '../campos.js';

const VERSAO_APP = '1.2.0';

const plural = (n, um, varios) => `${n} ${n === 1 ? um : varios}`;

async function gerarArquivo() {
  const dados = await exportarBackup();
  const nome = `meu-setup-backup-${hoje()}.json`;
  const blob = new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' });
  return { nome, blob };
}

function podeCompartilharArquivo() {
  try {
    return Boolean(navigator.canShare?.({ files: [new File(['{}'], 'teste.json', { type: 'application/json' })] }));
  } catch {
    return false;
  }
}

export async function telaAjustes() {
  const [raquetes, ultimoBackup, cat] = await Promise.all([listarRaquetes(), lerMeta('ultimoBackup'), carregarCatalogo()]);
  let persistente = null;
  try { persistente = await navigator.storage?.persisted?.(); } catch { /* indisponível */ }

  // ----- Raquetes -----
  const itensRaquete = raquetes.map((r, i) => h('div', { class: 'lista-item' },
    h('button', { class: 'lista-item-principal', type: 'button', onclick: () => ir(`/raquete/${r.id}`) },
      h('span', { class: 'mini-cores', style: `--c1:${corSegura(r.corPrincipal, '#cccccc')};--c2:${corSegura(r.corSecundaria, '#333333')}` }),
      h('span', null,
        h('strong', null, nomeRaquete(r)),
        h('small', null, !r.ativa ? 'Aposentada' : i === raquetes.findIndex((x) => x.ativa) ? 'Ativa · primeira na tela inicial' : 'Ativa'))),
    h('button', { class: 'btn-icone', type: 'button', 'aria-label': 'Mover para cima', disabled: i === 0, onclick: () => mover(r.id, -1) }, icone('cima')),
    h('button', { class: 'btn-icone', type: 'button', 'aria-label': 'Mover para baixo', disabled: i === raquetes.length - 1, onclick: () => mover(r.id, 1) }, icone('baixo'))));

  async function mover(id, delta) {
    await moverRaquete(id, delta);
    recarregar();
  }

  // ----- Backup -----
  const textoUltimo = h('p', { class: 'dica', style: 'margin:-4px 0 12px' },
    ultimoBackup ? `Último backup: ${fmtData(ultimoBackup)}` : 'Nenhum backup exportado ainda.');

  async function registrarBackup() {
    await gravarMeta('ultimoBackup', hoje());
    textoUltimo.textContent = `Último backup: ${fmtData(hoje())}`;
  }

  async function exportar() {
    const { nome, blob } = await gerarArquivo();
    const url = URL.createObjectURL(blob);
    const a = h('a', { href: url, download: nome, hidden: true });
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    await registrarBackup();
    aviso('Backup exportado');
  }

  async function compartilhar() {
    const { nome, blob } = await gerarArquivo();
    try {
      await navigator.share({ files: [new File([blob], nome, { type: 'application/json' })], title: 'Backup Meu Setup' });
      await registrarBackup();
    } catch (erro) {
      if (erro?.name !== 'AbortError') aviso('Não foi possível compartilhar. Use “Exportar backup”.');
    }
  }

  const arquivo = h('input', { type: 'file', accept: 'application/json,.json', hidden: true });
  arquivo.addEventListener('change', async () => {
    const f = arquivo.files?.[0];
    arquivo.value = '';
    if (!f) return;
    let obj;
    try {
      obj = JSON.parse(await f.text());
    } catch {
      aviso('Arquivo inválido: não é um JSON.');
      return;
    }
    const erro = validarBackup(obj);
    if (erro) {
      aviso(erro);
      return;
    }
    const d = obj.dados;
    const quando = typeof obj.exportadoEm === 'string' ? ` de ${fmtData(obj.exportadoEm.slice(0, 10))}` : '';
    const ok = await confirmar({
      titulo: 'Importar backup?',
      texto: `Os dados atuais deste aparelho serão substituídos pelo backup${quando}: ${plural(d.raquetes.length, 'raquete', 'raquetes')}, ${plural(d.setups.length, 'setup', 'setups')} e ${plural(d.eventos.length, 'evento', 'eventos')}.`,
      ok: 'Substituir',
      perigo: true,
    });
    if (!ok) return;
    try {
      await importarBackup(obj);
      aviso('Backup importado');
      recarregar();
    } catch (e) {
      console.error(e);
      aviso('Não foi possível importar o backup.');
    }
  });

  // ----- Aparência -----
  const tema = segmentado([['escuro', 'Escuro'], ['claro', 'Claro'], ['sistema', 'Sistema']], temaAtual(), (v) => aplicarTema(v));

  return h('div', { class: 'base' },
    h('h1', { class: 'base-titulo' }, 'Configurações'),

    h('section', { class: 'secao' },
      h('h2', null, 'Minhas raquetes'),
      raquetes.length ? h('div', { class: 'lista' }, itensRaquete) : h('p', { class: 'vazio' }, 'Nenhuma raquete cadastrada.'),
      h('div', { class: 'botoes-col', style: 'margin-top:10px' },
        h('button', { class: 'btn btn-sec', type: 'button', onclick: () => ir('/raquete/nova') }, icone('mais'), 'Adicionar raquete'))),

    h('section', { class: 'secao' },
      h('h2', null, 'Backup'),
      h('p', { class: 'texto-secao' }, 'Seus dados ficam só neste aparelho. Exporte um backup de vez em quando e guarde em local seguro. O mesmo arquivo serve para levar os dados do computador para o celular.'),
      textoUltimo,
      h('div', { class: 'botoes-col' },
        h('button', { class: 'btn', type: 'button', onclick: exportar }, icone('baixar'), 'Exportar backup'),
        podeCompartilharArquivo() ? h('button', { class: 'btn btn-sec', type: 'button', onclick: compartilhar }, icone('compartilhar'), 'Compartilhar backup') : null,
        h('button', { class: 'btn btn-sec', type: 'button', onclick: () => arquivo.click() }, icone('enviar'), 'Importar backup'),
        arquivo)),

    h('section', { class: 'secao' },
      h('h2', null, 'Aparência'),
      tema.el),

    h('section', { class: 'secao' },
      h('h2', null, 'Catálogo'),
      h('p', { class: 'texto-secao' },
        `${plural(cat.raquetes.length, 'raquete', 'raquetes')} e ${plural(cat.cordas.length, 'corda', 'cordas')} no catálogo local. `,
        'Para incluir ou corrigir itens, edite os arquivos catalogo/raquetes.json e catalogo/cordas.json (veja o README).')),

    h('section', { class: 'secao' },
      h('h2', null, 'Sobre'),
      h('p', { class: 'texto-secao' },
        `Meu Setup ${VERSAO_APP}. Funciona offline depois de instalado; sem login e sem servidor. `,
        persistente === true
          ? 'O armazenamento deste aparelho está protegido contra limpeza automática.'
          : 'O navegador pode limpar dados de sites se faltar espaço — mantenha um backup recente.')));
}
