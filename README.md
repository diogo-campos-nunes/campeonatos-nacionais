# Séries — II Divisão Nacional

Site estático que calcula as séries no browser: ordena as equipas de **Norte → Sul**
(pela latitude) e divide em **4 séries de 12**. Mostra a latitude de cada equipa para
qualquer pessoa poder **verificar** a distribuição.

## Ver localmente

Os dados são lidos por `fetch`, por isso **não funciona com duplo-clique** (file://).
Abre um servidor local — já tens Python:

```bash
cd site
python3 -m http.server 8000
```

Depois abre **http://localhost:8000** no browser.

## Editar (só com passe)

1. Clica em **🔒 Modo edição** e escreve a passe (definida em `config.js`).
2. Edita/adiciona/remove equipas — as séries recalculam sozinhas.
   As edições ficam guardadas no teu browser (não se perdem ao recarregar).
3. Clica em **⬇ Guardar ficheiro** — descarrega um `.json` (ex. `2a-sub15.json`).
4. Substitui esse ficheiro em `site/data/` para tornar a alteração permanente para todos.

> A passe é uma proteção simples do lado do browser (impede edições por engano).
> Não é segurança a sério — quem souber ler o código vê-a. Para o teu caso chega.

## Competições (Divisão × Escalão)

O site tem dois seletores: **Divisão** (1ª / 2ª) e **Escalão** (Sub-15/17/19).
Cada combinação é uma "competição" definida em `config.js` → `competicoes`, com:

- `ficheiro` — o JSON das equipas (`data/<id>.json`)
- `formato.tipo`:
  - `"geografico"` → ordena por latitude (Norte→Sul) e divide em `numSeries × tamanhoSerie`
    - **II Divisão**: 48 equipas → 4 séries de 12 (A, B, C, D)
    - **I Divisão**: 20 equipas → 2 séries de 10 (Norte, Sul) via `nomesSeries`
  - `"indefinido"` → mostra só a lista ordenada (sem dividir em séries)
- `formato.nomesSeries` (opcional) → nomes das séries (ex.: `["Norte","Sul"]`); por omissão A, B, C, D…

> Ambas as divisões usam o mesmo critério geográfico — só muda `numSeries` × `tamanhoSerie`.
> Para mudar o formato de uma competição, edita o respetivo `formato` em `config.js`.

## Pôr online (Vercel)

É um site estático, sem build. Na Vercel: novo projeto a partir desta pasta,
**Framework Preset: Other**, **Output/Root: `site`**. Fica online tal como está localmente.

## Ficheiros

- `index.html`, `styles.css`, `app.js` — o site
- `config.js` — passe, escalões e formato (4×12)
- `data/*.json` — as equipas de cada escalão
