// Motor de comparação entre dois setups da mesma raquete.
// Cada fator (tensão, calibre, tipo) soma pontos em cada indicador; o saldo vira uma tendência.
// São estimativas gerais, não medições.

import { cordaH, mesmasCordas, TIPOS_CORDA } from './dados.js';
import { fmtLbs, fmtNum } from './util.js';

export const AVISO_ESTIMATIVA =
  'Estimativa baseada principalmente na diferença de tensão, tipo e espessura da corda. A sensação real também varia conforme a raquete, o jogador e o estado da corda.';

// Num híbrido, as verticais pesam mais na resposta do leito.
const PESO_V = 0.6;
const PESO_H = 0.4;

// Tensão: efeito por +3 lbs (média de verticais e horizontais). Abaixo de 2 lbs, ignorado.
const UNIDADE_TENSAO = 3;
const LIMIAR_TENSAO = 2;
const EFEITO_TENSAO = { controle: 1, firmeza: 1, potencia: -1, conforto: -1 };

// Calibre: efeito por 0,05 mm mais fina. Abaixo de 0,03 mm, ignorado.
const UNIDADE_CALIBRE = 0.05;
const LIMIAR_CALIBRE = 0.03;
const EFEITO_MAIS_FINA = { potencia: 0.6, spin: 0.6, durabilidade: -1, firmeza: -0.6 };

// Tipo: perfil relativo de cada material (sintética = referência neutra).
const PESO_TIPO = 0.6;
const PERFIS = {
  poliester: { controle: 2, potencia: -1, conforto: -2, firmeza: 2, durabilidade: 2, spin: 2 },
  multifilamento: { controle: -1, potencia: 1, conforto: 2, firmeza: -1, durabilidade: -1, spin: -1 },
  natural_gut: { controle: -1, potencia: 2, conforto: 2, firmeza: -2, durabilidade: -2, spin: 0 },
  sintetica: { controle: 0, potencia: 0, conforto: 0, firmeza: 0, durabilidade: 0, spin: 0 },
};

const FRASE_TIPO = {
  poliester: 'O poliéster costuma dar mais controle, spin e durabilidade, com menos conforto.',
  multifilamento: 'O multifilamento costuma dar mais conforto, potência e sensação, com menor durabilidade e controle relativo.',
  natural_gut: 'O natural gut costuma ser referência em conforto, potência e sensação, mas dura menos.',
  sintetica: 'A sintética (nylon) costuma ficar no meio-termo entre conforto, controle e durabilidade.',
};

const INDICADORES = [
  { chave: 'controle', sobe: 'Mais controle', desce: 'Menos controle', igual: 'Controle semelhante' },
  { chave: 'potencia', sobe: 'Mais potência', desce: 'Menos potência', igual: 'Potência semelhante' },
  { chave: 'conforto', sobe: 'Mais conforto', desce: 'Menos conforto', igual: 'Conforto semelhante' },
  { chave: 'firmeza', sobe: 'Sensação mais firme', desce: 'Sensação mais macia', igual: 'Firmeza semelhante' },
  { chave: 'durabilidade', sobe: 'Mais durabilidade', desce: 'Menos durabilidade', igual: 'Durabilidade semelhante', soQuandoMuda: true },
  { chave: 'spin', sobe: 'Mais potencial de spin', desce: 'Menos potencial de spin', igual: 'Spin semelhante' },
];

const LIMIAR_TENDENCIA = 0.5;
const LIMIAR_CLARA = 1.5;

function tensaoMedia(s) {
  if (s.tensaoV == null) return null;
  return (s.tensaoV + (s.tensaoH ?? s.tensaoV)) / 2;
}

function textoTensao(s) {
  const hz = s.tensaoH ?? s.tensaoV;
  return hz === s.tensaoV ? fmtLbs(s.tensaoV) : `${fmtLbs(s.tensaoV)}/${fmtLbs(hz)}`;
}

function calibreMedio(s) {
  const v = s.verticais?.calibre;
  const hz = cordaH(s)?.calibre;
  if (!v || !hz) return null;
  return v * PESO_V + hz * PESO_H;
}

function perfil(s) {
  const pv = PERFIS[s.verticais?.tipo];
  const ph = PERFIS[cordaH(s)?.tipo];
  if (!pv || !ph) return null;
  return Object.fromEntries(Object.keys(pv).map((k) => [k, pv[k] * PESO_V + ph[k] * PESO_H]));
}

function descricaoTipo(s) {
  const nome = (t) => (TIPOS_CORDA[t] || 'tipo não informado').toLowerCase();
  const tv = s.verticais?.tipo;
  const th = cordaH(s)?.tipo;
  return tv === th ? nome(tv) : `${nome(tv)} nas verticais e ${nome(th)} nas horizontais`;
}

// Explica o material que entrou em cada posição que mudou (verticais e/ou horizontais).
function textoTipo(ant, novo, da, db) {
  const minuscula = (t) => t.charAt(0).toLowerCase() + t.slice(1);
  const tvA = ant.verticais?.tipo;
  const thA = cordaH(ant)?.tipo;
  const tvB = novo.verticais?.tipo;
  const thB = cordaH(novo)?.tipo;
  const partes = [`O material mudou: antes ${da}; agora ${db}.`];
  if (tvB === thB) {
    if (FRASE_TIPO[tvB]) partes.push(FRASE_TIPO[tvB]);
  } else {
    if (tvA !== tvB && FRASE_TIPO[tvB]) partes.push(`Nas verticais, ${minuscula(FRASE_TIPO[tvB])}`);
    if (thA !== thB && FRASE_TIPO[thB]) partes.push(`Nas horizontais, ${minuscula(FRASE_TIPO[thB])}`);
    partes.push('Num híbrido, as verticais costumam pesar mais na sensação, no spin e na durabilidade.');
  }
  return partes.join(' ');
}

const multiplicar = (efeitos, fator) => Object.fromEntries(Object.entries(efeitos).map(([k, v]) => [k, v * fator]));

function levantarFatores(ant, novo, notas) {
  const fatores = [];

  const ta = tensaoMedia(ant);
  const tb = tensaoMedia(novo);
  if (ta != null && tb != null && Math.abs(tb - ta) >= LIMIAR_TENSAO) {
    const de = textoTensao(ant);
    const para = textoTensao(novo);
    fatores.push({
      efeitos: multiplicar(EFEITO_TENSAO, (tb - ta) / UNIDADE_TENSAO),
      texto: tb > ta
        ? `Você aumentou a tensão de ${de} para ${para} lbs. Em geral, uma tensão maior deixa o leito de cordas mais firme e tende a aumentar a sensação de controle, com menos potência e conforto percebidos.`
        : `Você reduziu a tensão de ${de} para ${para} lbs. Em geral, uma tensão menor deixa o leito mais elástico, com mais conforto e potência, e pode reduzir a sensação de controle.`,
    });
  }

  const ga = calibreMedio(ant);
  const gb = calibreMedio(novo);
  if (ga && gb && Math.abs(gb - ga) >= LIMIAR_CALIBRE) {
    const de = fmtNum(ga, 2);
    const para = fmtNum(gb, 2);
    fatores.push({
      efeitos: multiplicar(EFEITO_MAIS_FINA, (ga - gb) / UNIDADE_CALIBRE),
      texto: gb < ga
        ? `A corda ficou mais fina (${de} → ${para} mm). Cordas mais finas costumam dar mais sensação, spin e potência, mas duram menos.`
        : `A corda ficou mais grossa (${de} → ${para} mm). Cordas mais grossas costumam durar mais e dar uma resposta mais firme, com um pouco menos de sensação e potência.`,
    });
  }

  const pa = perfil(ant);
  const pb = perfil(novo);
  const da = descricaoTipo(ant);
  const db = descricaoTipo(novo);
  if (da !== db) {
    if (pa && pb) {
      const efeitos = Object.fromEntries(Object.keys(pb).map((k) => [k, (pb[k] - pa[k]) * PESO_TIPO]));
      fatores.push({ efeitos, texto: textoTipo(ant, novo, da, db) });
    } else {
      notas.push('Uma das cordas está com tipo "Outro" ou não informado, então a diferença de material não entrou na estimativa.');
    }
  }
  return fatores;
}

/**
 * Compara o setup novo com o anterior.
 * Retorna { indicadores: [{ chave, rotulo, sub, direcao: 'sobe'|'desce'|'igual', explicacao: [] }], notas: [] }
 */
export function compararSetups(ant, novo) {
  const notas = [];
  const fatores = levantarFatores(ant, novo, notas);

  if (!fatores.length) {
    if (mesmasCordas(ant, novo)) {
      notas.push('Mesmo setup do anterior: mesma corda e mesma tensão. Uma corda nova costuma parecer mais firme e viva do que a anterior, que já tinha perdido tensão com o uso.');
    } else {
      notas.push('As cordas são diferentes, mas o tipo, o calibre e a tensão são praticamente iguais. As diferenças tendem a ser sutis e dependem de cada modelo.');
    }
  }

  const indicadores = [];
  for (const ind of INDICADORES) {
    let saldo = 0;
    const contribuicoes = [];
    for (const f of fatores) {
      const v = f.efeitos[ind.chave] ?? 0;
      if (Math.abs(v) >= 0.05) {
        saldo += v;
        contribuicoes.push({ texto: f.texto, v });
      }
    }
    const direcao = saldo >= LIMIAR_TENDENCIA ? 'sobe' : saldo <= -LIMIAR_TENDENCIA ? 'desce' : 'igual';
    if (ind.soQuandoMuda && direcao === 'igual') continue;
    const conflito = contribuicoes.some((c) => c.v > 0) && contribuicoes.some((c) => c.v < 0);

    const explicacao = contribuicoes.map((c) => c.texto);
    if (!contribuicoes.length) explicacao.push('Nada no novo setup muda de forma relevante este aspecto.');
    if (conflito) {
      explicacao.push(direcao === 'igual'
        ? 'Os fatores puxam para lados opostos e tendem a se compensar.'
        : 'Alguns fatores puxam para lados opostos; o indicador mostra o saldo estimado.');
    }

    let sub;
    if (direcao === 'igual') sub = conflito ? 'fatores se compensam' : 'sem mudança relevante';
    else sub = Math.abs(saldo) >= LIMIAR_CLARA ? 'tendência clara' : 'tendência leve';

    indicadores.push({ chave: ind.chave, rotulo: ind[direcao], sub, direcao, explicacao });
  }
  return { indicadores, notas };
}
