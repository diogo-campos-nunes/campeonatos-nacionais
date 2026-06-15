// ============================================================
//  CONFIGURAÇÃO — edita só este ficheiro para ajustar o site
// ============================================================

window.CONFIG = {
  // Título mostrado no topo do site
  titulo: "Campeonatos Nacionais — Séries 2026/27",

  // Passe do modo edição.
  // NOTA: isto é uma proteção simples (do lado do browser), não é segurança a sério.
  // Serve para impedir que visitantes alterem por engano. MUDA o valor abaixo.
  passe: "muda-esta-passe",

  // Competições = Divisão × Escalão. Cada uma tem o seu ficheiro de dados e o seu formato.
  //
  //  formato.tipo:
  //    "geografico" -> ordena por latitude (Norte→Sul) e divide em numSeries × tamanhoSerie
  //                    II Divisão: 48 -> 4 séries de 12 | I Divisão: 20 -> 2 séries de 10
  //    "indefinido" -> mostra só a lista ordenada (sem dividir em séries)
  //  formato.nomesSeries (opcional) -> nomes das séries (ex.: ["Norte","Sul"]).
  //                                    Por omissão usa A, B, C, D...
  //
  competicoes: [
    // ---- 2ª Divisão (regra geográfica 4×12) ----
    { id: "2a-sub15", divisao: "2ª Divisão", escalao: "Sub-15", ficheiro: "data/2a-sub15.json",
      formato: { tipo: "geografico", numSeries: 4, tamanhoSerie: 12 } },
    { id: "2a-sub17", divisao: "2ª Divisão", escalao: "Sub-17", ficheiro: "data/2a-sub17.json",
      formato: { tipo: "geografico", numSeries: 4, tamanhoSerie: 12 } },
    { id: "2a-sub19", divisao: "2ª Divisão", escalao: "Sub-19", ficheiro: "data/2a-sub19.json",
      formato: { tipo: "geografico", numSeries: 4, tamanhoSerie: 12 } },

    // ---- 1ª Divisão (regra geográfica: 20 clubes -> 2 séries Norte/Sul de 10) ----
    { id: "1a-sub15", divisao: "1ª Divisão", escalao: "Sub-15", ficheiro: "data/1a-sub15.json",
      formato: { tipo: "geografico", numSeries: 2, tamanhoSerie: 10, nomesSeries: ["Norte", "Sul"] } },
    { id: "1a-sub17", divisao: "1ª Divisão", escalao: "Sub-17", ficheiro: "data/1a-sub17.json",
      formato: { tipo: "geografico", numSeries: 2, tamanhoSerie: 10, nomesSeries: ["Norte", "Sul"] } },
    { id: "1a-sub19", divisao: "1ª Divisão", escalao: "Sub-19", ficheiro: "data/1a-sub19.json",
      formato: { tipo: "geografico", numSeries: 2, tamanhoSerie: 10, nomesSeries: ["Norte", "Sul"] } }
  ],

  // Temas visuais — o utilizador escolhe no site (troca fácil). Para mudar o que aparece
  // por omissão, altera "temaPorOmissao" para um dos id abaixo.
  temaPorOmissao: "desportivo",
  temas: [
    { id: "desportivo", nome: "Desportivo", ficheiro: "temas/desportivo.css" },
    { id: "editorial", nome: "Editorial", ficheiro: "temas/editorial.css" },
    { id: "vivo", nome: "Vivo", ficheiro: "temas/vivo.css" }
  ]
};
