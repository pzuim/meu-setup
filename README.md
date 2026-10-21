# Meu Setup — raquetes e cordas

App pessoal (PWA) para consultar o setup atual, registrar trocas de corda e manter o histórico de cada raquete.
Funciona offline depois de instalado, sem login, sem servidor e sem banco remoto. Os dados ficam no próprio aparelho (IndexedDB).

## Executar no computador

O app precisa ser servido por HTTP (abrir o `index.html` direto com duplo clique não carrega o catálogo nem instala).
Na pasta `aplicativo_raquete`:

```bash
python -m http.server 8765
```

Abra `http://localhost:8765` no Chrome ou Edge. Para instalar no computador, use o ícone de instalar na barra de endereço.

## Instalar no celular Android

O Chrome só instala e ativa o modo offline em endereços **HTTPS** (um endereço de rede local como `http://192.168...` não serve).
O jeito mais simples é publicar esta pasta num hospedeiro estático gratuito. Só os arquivos do app ficam online; seus dados nunca saem do celular.

**GitHub Pages (sugerido)**
1. Crie um repositório e envie o conteúdo desta pasta (o `index.html` na raiz do repositório).
2. Em *Settings → Pages*, escolha a branch `main` e a pasta `/ (root)`.
3. Abra o endereço gerado (`https://<usuario>.github.io/<repositorio>/`) no Chrome do Android.
4. Menu ⋮ → **Instalar app** (ou "Adicionar à tela inicial").

**Alternativas:** Netlify Drop ou Cloudflare Pages (arraste a pasta). Também dá para testar pelo cabo USB com `adb reverse tcp:8765 tcp:8765` e abrir `http://localhost:8765` no celular.

Depois de instalado, o app abre sem internet.

## Backup e troca de aparelho

Cada aparelho guarda os próprios dados. Em **Configurações → Backup**:
- **Exportar backup** gera um arquivo `.json` com raquetes, setups e histórico.
- **Compartilhar backup** (Android) envia o arquivo direto para Drive, e-mail etc.
- **Importar backup** substitui os dados do aparelho pelos do arquivo.

Use o mesmo arquivo para levar os dados do computador para o celular.

## Editar o catálogo

O catálogo fica separado dos dados pessoais, em dois arquivos JSON. No app, a escolha é feita em duas etapas: primeiro a marca, depois o modelo (agrupado por linha nas raquetes e por tipo nas cordas).

### Raquetes (`catalogo/raquetes.json`)

Só raquetes **avançadas**, com dados dos sites oficiais (consulta em 20/10/2026):
- **Head:** entram as raquetes cujo público declarado pela marca chega a "tournament players".
- **Wilson, Babolat, Yonex e Volkl:** linha de performance, peso sem corda a partir de 295 g e cabeça de até 100 pol².

Cada item de `raquetes` tem `id`, `marca`, `linha`, `modelo`, `peso` (g, sem corda), `cabeca` (pol²), `padrao` (ex.: `"16x19"`), `comprimento` (cm), `balanco` (mm), `rigidez` (RA), `material`, `publico` (opcional), `fonte` (página oficial) e `pintura`.

`pintura` aponta para um item de `pinturas` — ou para uma lista, quando o modelo existe em mais de uma cor. Cada pintura define o desenho da raquete:
- `estilo`: `solido`, `lados`, `painel`, `lateral`, `topo`, `base` ou `degrade`;
- `formato`: `oval`, `isometrica` (Yonex) ou `quadrada`;
- `listras`: `true` para as faixas tipo zebra (Volkl);
- cores em `#rrggbb`: `principal`, `secundaria`, `detalhe`, `grip` e `haste` (opcional).

### Cordas (`catalogo/cordas.json`)

Cordas vistas à venda no Rio (Barra Tennis e Pró-Tênis Barra) mais as principais linhas das marcas, com os calibres dos sites oficiais. Campos: `id`, `marca`, `modelo`, `tipo` (`poliester`, `multifilamento`, `natural_gut`, `sintetica` ou `outro`), `calibres` (lista em mm), `cores` (lista de `{ "nome", "hex" }`; a primeira é a sugerida) e `lojasRJ` (opcional; aparece no app como "Vista à venda no Rio").

### Regras gerais

Cada item precisa de um `id` único. Use `null` quando não souber um valor; cores marcadas "a confirmar" não foram informadas pela marca.
O catálogo só preenche o formulário: tudo continua editável no app, e também dá para cadastrar qualquer item manualmente.

Depois de publicar o catálogo editado, o app instalado busca a nova versão sozinho: ela aparece a partir da segunda abertura.

## Atualizar o app

Ao alterar código, CSS ou ícones, aumente `VERSAO` em `sw.js` (ex.: `'v1'` → `'v2'`) e publique de novo. O celular baixa a nova versão em segundo plano e passa a usá-la na abertura seguinte.

## Estrutura

```
index.html, manifest.webmanifest, sw.js   PWA (página, instalação e modo offline)
css/app.css                               visual (tema escuro e claro)
catalogo/                                 catálogo editável (JSON)
icons/                                    ícones do app
js/app.js                                 navegação entre telas e painéis
js/db.js, js/dados.js                     IndexedDB e regras de raquete, setup e histórico
js/comparacao.js                          regras de comparação entre setups
js/raquete-svg.js                         ilustração da raquete
js/telas/                                 telas: início, raquete, setup, comparação, histórico, entenda, configurações
```

## Regras de comparação (resumo)

A comparação usa a tensão média, o calibre médio e o tipo de corda (num híbrido, verticais pesam 60% e horizontais 40%).
Diferenças de tensão abaixo de 2 lbs e de calibre abaixo de 0,03 mm são ignoradas. Os pesos ficam no topo de `js/comparacao.js`.
O resultado é sempre uma tendência, nunca uma medição.
