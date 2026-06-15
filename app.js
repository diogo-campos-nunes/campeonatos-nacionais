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

  function calcularSeries(equipas, formato) {
    const ordenadas = ordenar(equipas);
    const nS = formato.numSeries, t = formato.tamanhoSerie;
    const nomes = formato.nomesSeries || SERIES.slice(0, nS);

    // Bandas geográficas iniciais (corte por latitude N->S)
    const bandas = nomes.map((_, i) => ordenadas.slice(i * t, (i + 1) * t).slice());
    const extra = ordenadas.slice(nS * t);

    // Regra das equipas B: distribuídas proporcionalmente pelas séries.
    // Quando o nº não é divisível, as séries mais a NORTE ficam com mais (regulamento).
    const nb = bandas.reduce((s, b) => s + b.filter((e) => e.equipaB).length, 0);
    const base = Math.floor(nb / nS), rem = nb % nS;
    const desired = nomes.map((_, i) => base + (i < rem ? 1 : 0));
    const reord = (b) => b.sort((a, c) => c.latitude - a.latitude);
    const cnt = () => bandas.map((b) => b.filter((e) => e.equipaB).length);

    let guard = 0;
    while (guard++ < 1000) {
      const c = cnt();
      if (nomes.every((_, i) => c[i] === desired[i])) break;
      let changed = false;
      // empurrar excedente de B para sul
      for (let i = 0; i < nS - 1; i++) {
        const cc = cnt();
        if (cc[i] > desired[i] && cc.slice(i + 1).some((v, k) => v < desired[i + 1 + k])) {
          let bi = -1; for (let k = bandas[i].length - 1; k >= 0; k--) if (bandas[i][k].equipaB) { bi = k; break; }
          let ni = bandas[i + 1].findIndex((e) => !e.equipaB);
          if (bi >= 0 && ni >= 0) {
            const tmp = bandas[i][bi]; bandas[i][bi] = bandas[i + 1][ni]; bandas[i + 1][ni] = tmp;
            reord(bandas[i]); reord(bandas[i + 1]); changed = true;
          }
        }
      }
      // puxar excedente de B para norte
      for (let i = nS - 2; i >= 0; i--) {
        const cc = cnt();
        if (cc[i + 1] > desired[i + 1] && cc.slice(0, i + 1).some((v, k) => v < desired[k])) {
          let bi = bandas[i + 1].findIndex((e) => e.equipaB);
          let ni = -1; for (let k = bandas[i].length - 1; k >= 0; k--) if (!bandas[i][k].equipaB) { ni = k; break; }
          if (bi >= 0 && ni >= 0) {
            const tmp = bandas[i + 1][bi]; bandas[i + 1][bi] = bandas[i][ni]; bandas[i][ni] = tmp;
            reord(bandas[i]); reord(bandas[i + 1]); changed = true;
          }
        }
      }
      if (!changed) break;
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
