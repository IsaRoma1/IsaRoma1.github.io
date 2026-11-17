/* Условия договора — страница во вкладке «Договор» карточки объекта.

   Заказчик, 24.09.2026: загрузили договор — из него должно вытаскиваться
   всё, что нужно на объекте: объект и заказчик, сроки, виды работ,
   материалы, генподряд, аванс, сроки плана, приёмки, ИД и документов,
   оплата, итоговый акт и штрафы. Разбирает сервер (parse_contract.py) по
   тексту договора, без модели, — поэтому у каждого условия рядом
   пункт-источник со страницей: по нему проверяют, а неверное правят
   карандашом. Правка подписана и повторным разбором не затирается.

   Модуль рисует страницу в место, которое даёт sites.js, и зовёт onBack,
   когда человек возвращается в объект. */
"use strict";

const CONTRACT = (() => {
  const $c = (s, r) => (r || document).querySelector(s);
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const svg = (d) => `<svg viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
  const ICO = {
    back: svg(`<path d="M15 18l-6-6 6-6"/>`),
    again: svg(`<path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 5v6h-6"/>`),
    file: svg(`<path d="M7 3.5h6.5l4 4V20a.5.5 0 0 1-.5.5H7a.5.5 0 0 1-.5-.5V4a.5.5 0 0 1 .5-.5z"/><path d="M13.5 3.5V7.5h4"/>`),
    edit: svg(`<path d="M4.5 19.5h4l10-10a2.1 2.1 0 0 0-3-3l-10 10z"/>`),
    quote: svg(`<path d="M6 17h4l2-5V6H6v6h3zM14 17h4l2-5V6h-6v6h3z"/>`),
    down: svg(`<path d="M6 9l6 6 6-6"/>`),
  };

  /* Порядок и группы. Заказчик дал список из 14 пунктов; добавлены
     гарантийное удержание и гарантийный срок — без них непонятно, сколько
     денег и на сколько лет остаётся «под залогом». */
  const GROUPS = [
    ["Объект и стороны", ["object", "customer", "works", "materials"]],
    ["Деньги", ["genpod", "advance", "retention", "payment"]],
    ["Сроки и документы", ["terms", "plan", "site_accept", "id_docs", "package", "final_act"]],
    ["Гарантия", ["warranty"]],
  ];

  let S = null;            // {docId, can, onBack, host}
  let DATA = null;
  let OPEN = new Set();    // раскрытые источники условий
  let EDIT = "";           // ключ условия в правке
  let FINES = "us";        // штрафы: us — с нас, them — нам, all — все
  let busy = false;

  const when = (iso) => {
    const d = new Date(iso);
    if (!iso || isNaN(d)) return "";
    const p = (n) => String(n).padStart(2, "0");
    return `${p(d.getDate())}.${p(d.getMonth() + 1)}.${d.getFullYear()}`;
  };
  const plural = (n, a, b, c) => {
    const x = Math.abs(n) % 100, y = x % 10;
    return x > 10 && x < 20 ? c : y > 1 && y < 5 ? b : y === 1 ? a : c;
  };

  async function open(host, opts) {
    S = Object.assign({ host }, opts);
    DATA = null; OPEN = new Set(); EDIT = ""; FINES = "us";
    paint();
    try {
      DATA = await AUTH.api("GET", "/documents/" + encodeURIComponent(S.docId) + "/terms");
      if (!DATA.parsed && DATA.parsable && S.can) return parse();
    } catch (e) {
      DATA = { error: e.message };
    }
    paint();
  }

  async function parse() {
    if (busy) return;
    busy = true;
    const was = DATA && DATA.parsed;
    const file = DATA && DATA.doc ? DATA.doc.filename : "";
    DATA = Object.assign({}, DATA || {}, { busy: true });
    paint();
    const tr = TRACE.start({ kind: "contract", file });
    try {
      DATA = await AUTH.api("POST", "/documents/" + encodeURIComponent(S.docId) + "/terms");
      const fl = DATA.fields || [];
      tr.done(`Нашёл ${fl.filter((f) => f.value).length} из ${fl.length} условий`);
      if (was) note("Разобрано заново. Ваши правки сохранены.");
    } catch (e) {
      tr.fail("Не получилось: " + e.message);
      DATA = Object.assign({}, DATA, { busy: false, parseError: e.message });
    } finally {
      busy = false;
    }
    paint();
  }

  function note(text, bad) {
    const n = $c("#ctNote", S.host);
    if (!n) return;
    n.textContent = text;
    n.classList.toggle("bad", !!bad);
    n.hidden = false;
  }

  /* ── отрисовка ─────────────────────────────────────────────── */
  function paint() {
    if (!S || !S.host) return;
    const d = DATA;
    const title = d && d.doc ? (d.doc.title || d.doc.filename) : "Договор";
    S.host.innerHTML = `
      <div class="pg ct-page">
        <div class="pg-head strip ct-head">
          <button type="button" class="pg-back" id="ctBack" title="К объекту"
            aria-label="К объекту">${ICO.back}</button>
          <div class="pg-h1 ct-h1">
            ${d && d.site && d.site.name ? `<span class="ct-crumb">${esc(d.site.name)}</span>` : ""}
            <h2 title="${esc(title)}">Условия договора${d && d.number ? ` № ${esc(d.number)}` : ""}${
              d && d.date ? ` от ${esc(d.date)}` : ""}</h2>
          </div>
          <div class="ct-acts">
            ${d && d.doc ? `<button type="button" class="btn-ghost sm" id="ctFile"
              title="Открыть файл: ${esc(title)}">${ICO.file}<span>Договор</span></button>` : ""}
            ${d && d.parsed && S.can ? `<button type="button" class="btn-ghost sm" id="ctAgain"
              title="Разобрать заново — ваши правки останутся">${ICO.again}<span>Разобрать заново</span></button>` : ""}
          </div>
        </div>
        <div class="pg-body ct-body">${bodyHtml()}</div>
        <div class="pg-note" id="ctNote" hidden></div>
      </div>`;
    wire();
  }

  function bodyHtml() {
    const d = DATA;
    if (!d || d.busy) {
      return `<div class="pg-empty"><b>${d && d.busy ? "Читаем договор…" : "Загружаем…"}</b>${
        d && d.busy ? "Разбираем пункты и ищем условия — это несколько секунд." : ""}</div>`;
    }
    if (d.error) return `<div class="pg-empty"><b>Не открылось</b>${esc(d.error)}</div>`;
    if (!d.parsed) {
      return `<div class="pg-empty"><b>${d.parseError ? "Договор не разобрался" : "Условия ещё не разобраны"}</b>${
        esc(d.parseError || (d.parsable ? "Нажмите «Разобрать» — условия вытащатся из текста договора."
          : "Условия читаются из PDF и DOCX. Загрузите договор в одном из этих форматов."))}
        ${d.parsable && S.can && !d.parseError ? `<br><br><button type="button" class="btn-brand"
          id="ctParse">Разобрать договор</button>` : ""}</div>`;
    }
    const fields = Object.fromEntries((d.fields || []).map((f) => [f.key, f]));
    const found = (d.fields || []).filter((f) => f.value).length;
    return `
      <div class="ct-intro">
        <b>${found} из ${(d.fields || []).length}</b> условий найдено в тексте · ${
          d.doc ? `<span class="ct-file">${esc(d.doc.filename)}</span>, ` : ""}${d.pages} ${
          plural(d.pages, "страница", "страницы", "страниц")}, ${d.clauses} ${
          plural(d.clauses, "пункт", "пункта", "пунктов")}.
        Проверяйте по пунктам договора под каждым условием, неверное правьте карандашом.
        <span class="dim">Разобрано ${esc(when(d.parsed_at))}${d.parsed_by ? ", " + esc(d.parsed_by) : ""}.</span>
      </div>
      ${GROUPS.map(([name, keys]) => `
        <section class="ct-group">
          <h3>${esc(name)}</h3>
          <div class="ct-list">${keys.map((k) => fields[k] ? fieldHtml(fields[k]) : "").join("")}</div>
        </section>`).join("")}
      ${finesHtml(fields.fines)}`;
  }

  function srcBtn(f) {
    if (!f.src || !f.src.length) return "";
    const openNow = OPEN.has(f.key);
    return `<button type="button" class="ct-src-b${openNow ? " on" : ""}" data-src="${esc(f.key)}">
      ${ICO.quote}${f.src.length === 1 ? "п. " + esc(f.src[0].n) : f.src.length + " " + plural(f.src.length,
        "пункт", "пункта", "пунктов")}${ICO.down}</button>`;
  }

  function fieldHtml(f) {
    const editing = EDIT === f.key;
    const empty = !f.value;
    return `
      <div class="ct-row${empty ? " empty" : ""}${f.edited ? " edited" : ""}" data-key="${esc(f.key)}">
        <div class="ct-label">${esc(f.label)}</div>
        <div class="ct-main">
          ${editing ? `
            <textarea class="ct-edit" id="ctEdit" rows="3">${esc(f.value)}</textarea>
            <div class="ct-edit-acts">
              <button type="button" class="btn-brand sm" data-save>Сохранить</button>
              <button type="button" class="btn-ghost sm" data-cancel>Отмена</button>
              ${f.edited ? `<button type="button" class="lnk" data-reset
                title="Убрать правку и показать то, что нашёл разбор">Вернуть найденное</button>` : ""}
            </div>`
          : `<div class="ct-val">${empty ? `<span class="ct-none">Не найдено в договоре</span>`
              : esc(f.value)}</div>
            ${f.note ? `<div class="ct-note">${esc(f.note)}</div>` : ""}
            ${f.edited ? `<div class="ct-edited">Исправлено: ${esc(f.edited_by)}, ${esc(when(f.edited_at))}${
              f.auto && f.auto !== f.value ? ` · разбор нашёл: «${esc(f.auto)}»` : ""}</div>` : ""}`}
          ${OPEN.has(f.key) && f.src && f.src.length ? `<div class="ct-src">${f.src.map((s) => `
            <blockquote><b>п. ${esc(s.n)}${s.page ? `, стр. ${esc(s.page)}` : ""}</b>${esc(s.text)}</blockquote>`)
            .join("")}</div>` : ""}
        </div>
        <div class="ct-side">
          ${srcBtn(f)}
          ${S.can && !editing ? `<button type="button" class="ico ct-pen" data-edit
            title="${empty ? "Вписать" : "Поправить"}">${ICO.edit}</button>` : ""}
        </div>
      </div>`;
  }

  function finesHtml(f) {
    const rows = (DATA.fines || []);
    const us = rows.filter((r) => r.payer === "us"), them = rows.filter((r) => r.payer === "them");
    const list = FINES === "us" ? us : FINES === "them" ? them : rows;
    return `
      <section class="ct-group ct-fines">
        <h3>Штрафы и пени</h3>
        ${f && f.note ? `<div class="ct-note ct-fines-note">${esc(f.note)}</div>` : ""}
        ${rows.length ? `
          <div class="seg ct-seg" role="tablist">
            <button type="button" class="seg-b${FINES === "us" ? " on" : ""}" data-fines="us">С нас<i>${us.length}</i></button>
            <button type="button" class="seg-b${FINES === "them" ? " on" : ""}" data-fines="them">Нам<i>${them.length}</i></button>
            <button type="button" class="seg-b${FINES === "all" ? " on" : ""}" data-fines="all">Все<i>${rows.length}</i></button>
          </div>
          <div class="ct-fine-list">${list.length ? list.map((r, i) => `
            <details class="ct-fine ${r.payer}">
              <summary>
                <span class="ct-fine-n">п. ${esc(r.n)}</span>
                <span class="ct-fine-what">${esc(r.what)}</span>
                <span class="ct-fine-amt">${esc(r.amount)}</span>
              </summary>
              <blockquote><b>п. ${esc(r.n)}${r.page ? `, стр. ${esc(r.page)}` : ""}</b>${esc(r.text)}</blockquote>
            </details>`).join("") : `<div class="ct-none ct-pad">Таких пунктов нет.</div>`}</div>`
          : `<div class="ct-none ct-pad">Пунктов со штрафами и пенями в тексте договора не нашлось.</div>`}
      </section>`;
  }

  /* ── действия ──────────────────────────────────────────────── */
  function wire() {
    const h = S.host;
    const on = (sel, fn) => { const el = $c(sel, h); if (el) el.addEventListener("click", fn); };
    on("#ctBack", () => S.onBack && S.onBack());
    on("#ctParse", parse);
    on("#ctAgain", async () => {
      if (await ASK.confirm("Разобрать договор заново? Ваши правки останутся, остальное обновится.")) parse();
    });
    on("#ctFile", async (e) => {
      const d = DATA.doc;
      const url = "/api/documents/" + encodeURIComponent(d.id) + "/file";
      try {
        if (/\.pdf$/i.test(d.filename)) await DL.open(url, { btn: e.currentTarget });
        else await DL.save(url, { btn: e.currentTarget, name: d.filename });
      } catch (err) { note("Не открылось: " + err.message, true); }
    });
    h.querySelectorAll("[data-src]").forEach((b) => b.addEventListener("click", () => {
      const k = b.dataset.src;
      if (OPEN.has(k)) OPEN.delete(k); else OPEN.add(k);
      paintKeep();
    }));
    h.querySelectorAll("[data-fines]").forEach((b) => b.addEventListener("click", () => {
      FINES = b.dataset.fines; paintKeep();
    }));
    h.querySelectorAll("[data-edit]").forEach((b) => b.addEventListener("click", () => {
      EDIT = b.closest("[data-key]").dataset.key;
      paintKeep();
      const t = $c("#ctEdit", h);
      if (t) { t.focus(); t.setSelectionRange(t.value.length, t.value.length); }
    }));
    on("[data-cancel]", () => { EDIT = ""; paintKeep(); });
    on("[data-save]", () => save($c("#ctEdit", h).value));
    on("[data-reset]", () => save(""));
    const t = $c("#ctEdit", h);
    if (t) t.addEventListener("keydown", (e) => {
      if (e.key === "Escape") { EDIT = ""; paintKeep(); }
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) save(t.value);
    });
  }

  /* Перерисовка без прыжка к началу: раскрыли источник посреди страницы —
     остаёмся там же. */
  function paintKeep() {
    const b = $c(".ct-body", S.host);
    const top = b ? b.scrollTop : 0;
    paint();
    const n = $c(".ct-body", S.host);
    if (n) n.scrollTop = top;
  }

  async function save(value) {
    const key = EDIT;
    try {
      DATA = await AUTH.api("PATCH", "/documents/" + encodeURIComponent(S.docId) + "/terms",
                            { key, value: value.trim() });
      EDIT = "";
      paintKeep();
    } catch (e) {
      note("Не сохранилось: " + e.message, true);
    }
  }

  return { open };
})();
