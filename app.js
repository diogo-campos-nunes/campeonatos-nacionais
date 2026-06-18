(function () {
  "use strict";

  const C = window.CONFIG;
  const $ = (sel, el = document) => el.querySelector(sel);
  const SERIES = ["A", "B", "C", "D", "E", "F", "G", "H"];
  // Paleta terrosa a condizer com o tema Editorial (terracota, ardósia, azeitona, ferrugem…)
  const PALETA = ["#b4532a", "#4d6470", "#8a7a35", "#9c5236", "#5e5566", "#46685e", "#a0692c", "#5a5040"];

  const state = {
    compId: C.competicoes[0].id,
    dados: {},        // compId -> { escalao, epoca, equipas: [] }
  };

  const comp = (id = state.compId) => C.competicoes.find((c) => c.id === id);
  const unico = (arr) => arr.filter((v, i) => arr.indexOf(v) === i);

  // ---------------------------------------------------------
  // Carregamento de dados (ficheiro JSON)
  // ---------------------------------------------------------
  async function carregar(id) {
    const resp = await fetch(comp(id).ficheiro + "?v=" + new Date().getTime());
    if (!resp.ok) throw new Error("Não foi possível ler " + comp(id).ficheiro);
    const json = await resp.json();
    state.dados[id] = json;
    return json;
  }

  // ---------------------------------------------------------
  // Cálculo das séries (regra geográfica: Norte → Sul, N séries de T)
  // ---------------------------------------------------------
  function ordenar(equipas) {
    return [...equipas].sort((a, b) => b.latitude - a.latitude);
  }

  // Move uma equipa B da série `de` para a série `para` (adjacente), trocando-a
  // por uma equipa não-B. Escolhe sempre a B mais próxima da fronteira entre as
  // duas séries, para que o ajuste seja geograficamente mínimo. Devolve true se
  // a troca foi feita.
  function moverB(bandas, de, para, reord) {
    let bi, ni;
    if (para > de) {
      // empurrar para Sul: a B mais a sul de `de` <-> a não-B mais a norte de `para`
      bi = -1; for (let k = bandas[de].length - 1; k >= 0; k--) if (bandas[de][k].equipaB) { bi = k; break; }
      ni = bandas[para].findIndex((e) => !e.equipaB);
    } else {
      // puxar para Norte: a B mais a norte de `de` <-> a não-B mais a sul de `para`
      bi = bandas[de].findIndex((e) => e.equipaB);
      ni = -1; for (let k = bandas[para].length - 1; k >= 0; k--) if (!bandas[para][k].equipaB) { ni = k; break; }
    }
    if (bi < 0 || ni < 0) return false;
    const tmp = bandas[de][bi]; bandas[de][bi] = bandas[para][ni]; bandas[para][ni] = tmp;
    reord(bandas[de]); reord(bandas[para]);
    return true;
  }

  function calcularSeries(equipas, formato) {
    const ordenadas = ordenar(equipas);
    const nS = formato.numSeries, t = formato.tamanhoSerie;
    const nomes = formato.nomesSeries || SERIES.slice(0, nS);

    // Corte geográfico puro (latitude N->S). É o comportamento base de todas as
    // competições: as equipas B ficam onde a geografia as coloca.
    const bandas = nomes.map((_, i) => ordenadas.slice(i * t, (i + 1) * t).slice());
    const extra = ordenadas.slice(nS * t);

    const reord = (b) => b.sort((a, c) => c.latitude - a.latitude);
    const cnt = () => bandas.map((b) => b.filter((e) => e.equipaB).length);

    // Reajuste das equipas B (só nas competições com regra, ex.: 2ª Div Sub-15 e
    // Sub-17 -> { min: 1, max: 3 }). O regulamento manda distribuí-las pela
    // ordem norte-sul e reajustar para garantir um mínimo e um máximo por série.
    if (formato.regraB && (formato.regraB.min != null || formato.regraB.max != null)) {
      const minB = formato.regraB.min != null ? formato.regraB.min : 0;
      const maxB = formato.regraB.max != null ? formato.regraB.max : Infinity;
      let guard = 0;
      while (guard++ < 1000) {
        let changed = false;
        // 1) Excessos: série acima do máximo empurra a B excedente para o
        //    vizinho com menos B (desempate para Sul).
        cnt().forEach((v, i) => {
          if (v <= maxB) return;
          const dest = [i + 1, i - 1]
            .filter((j) => j >= 0 && j < nS && cnt()[j] < maxB)
            .sort((a, b) => cnt()[a] - cnt()[b] || a - b)[0];
          if (dest != null && moverB(bandas, i, dest, reord)) changed = true;
        });
        // 2) Défices: série abaixo do mínimo puxa uma B do vizinho com mais B
        //    (best-effort — pode ser impossível se não houver B suficientes).
        cnt().forEach((v, i) => {
          if (v >= minB) return;
          const orig = [i + 1, i - 1]
            .filter((j) => j >= 0 && j < nS && cnt()[j] > minB)
            .sort((a, b) => cnt()[b] - cnt()[a] || a - b)[0];
          if (orig != null && moverB(bandas, orig, i, reord)) changed = true;
        });
        if (!changed) break;
      }
    }

    const out = {};
    nomes.forEach((n, i) => { out[n] = reord(bandas[i]); });
    return { out, extra, nomes };
  }

  function cabecalhoSerie(nome, idx) {
    const titulo = nome.length <= 2 ? `SÉRIE ${nome}` : nome;
    return `<h2 style="background:${PALETA[idx % PALETA.length]}">${titulo}</h2>`;
  }

  // ---------------------------------------------------------
  // Render — vista pública
  // ---------------------------------------------------------
  function renderVista() {
    const c = comp();
    const d = state.dados[state.compId];
    const vista = $("#vista");
    const avisos = $("#avisos");
    avisos.innerHTML = "";
    vista.innerHTML = "";

    const exp = $("#explicacao");
    if (c.formato.tipo === "geografico") {
      const f = c.formato;
      exp.innerHTML = `As equipas são ordenadas de <strong>Norte para Sul</strong> pela latitude e divididas em
        <strong>${f.numSeries} séries de ${f.tamanhoSerie}</strong>. A latitude de cada equipa é mostrada para qualquer pessoa poder verificar a ordenação.`;
    } else {
      exp.innerHTML = `Lista de equipas ordenada de <strong>Norte para Sul</strong> pela latitude.`;
    }

    if (d.equipas.length === 0) {
      avisos.innerHTML = `<div class="aviso info">Ainda não há equipas para <strong>${c.divisao} · ${c.escalao}</strong>.</div>`;
      return;
    }

    if (c.formato.tipo !== "geografico") {
      avisos.innerHTML = `<div class="aviso alerta">Formato da <strong>${c.divisao}</strong> ainda por definir. Mostro a lista ordenada de Norte → Sul.</div>`;
      const sec = document.createElement("section");
      sec.className = "serie";
      sec.innerHTML = `<h2 style="background:${PALETA[0]}">${c.divisao} · ${c.escalao} — ${d.equipas.length} equipas</h2>` +
        ordenar(d.equipas).map((e) => linhaHTML(e)).join("");
      vista.appendChild(sec);
      return;
    }

    const esperado = c.formato.numSeries * c.formato.tamanhoSerie;
    if (d.equipas.length !== esperado) {
      avisos.innerHTML = `<div class="aviso alerta">Atenção: ${d.equipas.length} equipas, mas o formato é <strong>${esperado}</strong> (${c.formato.numSeries}×${c.formato.tamanhoSerie}). As séries podem ficar desequilibradas.</div>`;
    }

    const { out, extra, nomes } = calcularSeries(d.equipas, c.formato);

    nomes.forEach((n, idx) => {
      const equipas = out[n];
      if (!equipas || !equipas.length) return;
      const sec = document.createElement("section");
      sec.className = "serie";
      sec.innerHTML = cabecalhoSerie(n, idx) +
        equipas.map((e) => linhaHTML(e)).join("");
      vista.appendChild(sec);
    });

    if (extra.length) {
      const sec = document.createElement("section");
      sec.className = "serie";
      sec.innerHTML = `<h2 style="background:#616161">Fora de série (excedente)</h2>` +
        extra.map((e) => linhaHTML(e)).join("");
      vista.appendChild(sec);
    }
  }

  function linhaHTML(e) {
    const cls = e.equipaB ? "linha eqB" : e.ilhas ? "linha eqIlha" : "linha";
    const nomeMostrar = e.equipaB ? e.nome.replace(/\s+B$/, "") : e.nome;
    const tag = e.equipaB ? `<small>[B]</small>` : e.ilhas ? `<small>•</small>` : "";
    return `<div class="${cls}">
      ${crestHTML(e)}
      <span class="nome">${escapar(nomeMostrar)} ${tag}</span>
      <span class="meta">${escapar(e.localizacao)} &nbsp;·&nbsp; <span class="lat">${Number(e.latitude).toFixed(4)}</span></span>
    </div>`;
  }

  function escapar(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  }

  // slug do nome do clube -> nome de ficheiro do logótipo (logos/<slug>.png)
  function slug(s) {
    return String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  }

  // iniciais para o monograma (fallback quando não há logótipo)
  function iniciais(nome) {
    const palavras = String(nome).split(/[\s-]+/).filter((w) => /[A-Za-zÀ-ÿ0-9]/.test(w));
    if (palavras.length >= 2) return (palavras[0][0] + palavras[1][0]).toUpperCase();
    return String(nome).replace(/[^A-Za-zÀ-ÿ0-9]/g, "").slice(0, 3).toUpperCase();
  }

  function crestHTML(e) {
    const src = e.logo || ("logos/" + slug(e.nome) + ".png");
    return `<span class="crest"><span class="crest-mono">${escapar(iniciais(e.nome))}</span>` +
      `<img src="${escapar(src)}" alt="" loading="lazy" onerror="this.remove()"></span>`;
  }

  function atualizarContador() {
    const c = comp();
    const d = state.dados[state.compId];
    $("#contador").textContent = `${c.divisao} · ${c.escalao} ${d.epoca || ""} · ${d.equipas.length} equipas`;
  }

  // ---------------------------------------------------------
  // Navegação por tabs — Escalão / Divisão (dimensões independentes)
  // ---------------------------------------------------------
  function montarTabs(container, valores, ativo, aoEscolher) {
    container.innerHTML = "";
    valores.forEach((v) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "tab";
      b.textContent = v;
      b.setAttribute("role", "tab");
      b.setAttribute("aria-selected", v === ativo ? "true" : "false");
      b.addEventListener("click", () => aoEscolher(v));
      container.appendChild(b);
    });
  }

  // ---------------------------------------------------------
  // Arranque
  // ---------------------------------------------------------
  async function mudar() {
    try {
      await carregar(state.compId);
    } catch (err) {
      $("#avisos").innerHTML = `<div class="aviso alerta">Erro ao carregar os dados.<br>
        Se abriste o ficheiro com duplo-clique, usa antes um servidor local:
        <code>python3 -m http.server</code> dentro da pasta <code>site/</code> e abre <code>http://localhost:8000</code>.</div>`;
      $("#vista").innerHTML = "";
      return;
    }
    renderVista();
    atualizarContador();
  }

  function init() {
    $("#titulo").textContent = C.titulo;

    const inicial = comp();
    state.escalao = inicial.escalao;
    state.divisao = inicial.divisao;
    const escaloes = unico(C.competicoes.map((c) => c.escalao));
    const divisoes = unico(C.competicoes.map((c) => c.divisao));

    function aplicar() {
      const achada = C.competicoes.find((c) => c.escalao === state.escalao && c.divisao === state.divisao);
      if (achada) state.compId = achada.id;
      desenharTabs();
      mudar();
    }
    function desenharTabs() {
      montarTabs($("#tabsEscalao"), escaloes, state.escalao, (v) => { state.escalao = v; aplicar(); });
      montarTabs($("#tabsDivisao"), divisoes, state.divisao, (v) => { state.divisao = v; aplicar(); });
    }

    desenharTabs();
    mudar();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
