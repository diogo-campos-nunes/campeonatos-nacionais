// ============================================================
//  CONFIGURAÇÃO — edita só este ficheiro para ajustar o site
// ============================================================

window.CONFIG = {
  // Título mostrado no topo do site
  titulo: "Campeonatos Nacionais — Séries 2026/27",

  // Site só-leitura (público). A edição dos dados é feita no repositório
  // (alterar os ficheiros em data/ e fazer push) — não há edição no browser.

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

  // Tema visual único: Editorial (definido no <link> do index.html: temas/editorial.css).
  temaPorOmissao: "editorial"
};
