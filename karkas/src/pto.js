/* Вкладка «ПТО» карточки объекта: состав проекта, чек-лист, карточка
   объекта и кабельный журнал.

   Отдел ПТО делает это по каждому объекту руками: листает проект на
   двести листов, выписывает кабели со схем, считает квартиры, заполняет
   карточку. Платформа разбирает PDF проекта сама (deploy/parse_project.py)
   и раскладывает найденное по тем же формам, которыми отдел уже работает.
   Инженер поправляет — и поправленное повторный разбор не трогает.

   Вкладка живёт внутри карточки объекта: SITES перерисовывает карточку
   целиком и каждый раз заново отдаёт место под вкладку через mount().
   Данные при этом не теряются — они здесь, в модуле, до смены объекта. */
"use strict";

const PTO = (() => {
  const $p = (s, r) => (r || document).querySelector(s);
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const enc = encodeURIComponent;
  const plural = (n, one, few, many) => {
    const a = Math.abs(n) % 100, b = a % 10;
    if (a > 10 && a < 20) return many;
    if (b > 1 && b < 5) return few;
    return b === 1 ? one : many;
  };
  /* ── число из клетки ──
     Площади ПТО собирает руками — проект их почти никогда не даёт — и
     складывает на калькуляторе: «двенадцать квартир по 38,5». Пусть
     складывает платформа: в клетке площади можно написать «12*38,5» или
     «12*38,5+3*41». Считаем разбором, а не eval: в клетке то, что
     напечатал человек, и запускать её как код нельзя.

     Эти правила слово в слово повторяет сервер (deploy/pto_book.py, _num
     и _calc): что посчитал экран, то же должно уйти в книгу Excel.
     tests/test_pto_checklist.py берёт код отсюда до метки «конец разбора
     числа» и сверяет обе стороны на одних и тех же клетках. */
  const numOf = (v) => {
    if (v === null || v === undefined) return null;
    const s = String(v).replace(/ /g, " ").trim();
    if (!s) return null;
    const plain = s.replace(/\s/g, "").replace(/,/g, ".");
    if (/^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/.test(plain)) {
      const n = Number(plain);
      return isFinite(n) ? n : null;
    }
    return calcOf(plain);
  };

  /* Выражение из клетки: числа, + − × ÷ и скобки. Всё прочее — не число. */
  const calcOf = (s) => {
    /* В клетке пишут «12*38,5», а не программу: длинное не считаем. */
    if (s.length > 200 || !/^[\d.+\-*/()]+$/.test(s)) return null;
    const toks = s.match(/\d+(?:\.\d+)?|[()+\-*/]/g) || [];
    if (toks.join("") !== s) return null;   /* хвосты вроде «1..2» — не число */
    let i = 0, bad = false;
    const atom = () => {
      if (i >= toks.length) { bad = true; return 0; }
      const t = toks[i];
      if (t === "+" || t === "-") { i++; const v = atom(); return t === "-" ? -v : v; }
      if (t === "(") {
        i++;
        const v = sum();
        if (toks[i] !== ")") { bad = true; return v; }
        i++;
        return v;
      }
      if (t === "*" || t === "/" || t === ")") { bad = true; return 0; }
      i++;
      return Number(t);
    };
    const mul = () => {
      let v = atom();
      while (!bad && (toks[i] === "*" || toks[i] === "/")) {
        const op = toks[i++], r = atom();
        if (op === "/" && r === 0) { bad = true; return v; }
        v = op === "*" ? v * r : v / r;
      }
      return v;
    };
    const sum = () => {
      let v = mul();
      while (!bad && (toks[i] === "+" || toks[i] === "-")) {
        const op = toks[i++], r = mul();
        v = op === "+" ? v + r : v - r;
      }
      return v;
    };
    const v = sum();
    if (bad || i !== toks.length || !isFinite(v)) return null;
    return Math.round(v * 1e6) / 1e6;   /* 12*38,5 — а не 462,00000000000006 */
  };
  /* ── конец разбора числа ── */
  const fmt = (n, d = 2) => (n === null || n === undefined || n === "") ? ""
    : Number(n).toLocaleString("ru-RU", { maximumFractionDigits: d });
  const hhmm = (iso) => {
    const d = new Date(iso);
    return isNaN(d) ? "" : d.toLocaleString("ru-RU", { day: "2-digit", month: "2-digit",
      hour: "2-digit", minute: "2-digit" });
  };

  const ICO = {
    up: `<svg viewBox="0 0 24 24" aria-hidden="true"><path
      d="M12 16V4M7 9l5-5 5 5M4 17v2a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-2"/></svg>`,
    down: `<svg viewBox="0 0 24 24" aria-hidden="true"><path
      d="M12 4v11M7.5 10.5 12 15l4.5-4.5M4.5 20h15"/></svg>`,
    find: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11"
      r="6.5"/><path d="M20.5 20.5 16 16"/></svg>`,
    again: `<svg viewBox="0 0 24 24" aria-hidden="true"><path
      d="M4 12a8 8 0 0 1 13.7-5.6"/><path d="M18.5 3v4h-4"/><path
      d="M20 12a8 8 0 0 1-13.7 5.6"/><path d="M5.5 21v-4h4"/></svg>`,
    open: `<svg viewBox="0 0 24 24" aria-hidden="true"><path
      d="M14 4h6v6M20 4l-8.5 8.5M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/></svg>`,
    fill: `<svg viewBox="0 0 24 24" aria-hidden="true"><path
      d="M12 3l2.2 5.3L20 9l-4.4 3.8L17 18.5 12 15.6 7 18.5l1.4-5.7L4 9l5.8-.7z"/></svg>`,
    chev: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>`,
    note: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 3.5h6v3H9z"/><path
      d="M8 5H6.5A1.5 1.5 0 0 0 5 6.5v13A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5v-13A1.5 1.5 0 0 0 17.5 5H16"/><path
      d="M8.5 11h7M8.5 14.5h7M8.5 18h4"/></svg>`,
    book: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5.5A1.5 1.5 0 0 1 6.5 4H19v14H6.5A1.5 1.5 0 0 0 5 19.5z"/><path
      d="M5 19.5A1.5 1.5 0 0 0 6.5 21H19v-3M9 8h6M9 11.5h4"/></svg>`,
  };

  /* «Спецификация» (заказчик, 08.10.2026) — те же строки, что разбирает
     «Тендер» из того же проекта, и расчётный объём ПТО по каждой. */
  /* «Высота этажей» (заказчик, 21.10.2026) — уровень каждого этажа. */
  const VIEWS = [["sheets", "Состав проекта"], ["spec", "Спецификация"], ["checklist", "Чек-лист"],
                 ["card", "Карточка объекта"], ["journal", "Кабельный журнал"], ["levels", "Высота этажей"],
                 ["letters", "Бланки писем"], ["repl", "Замены"]];
  const VIEW_KEY = "karkas.pto.view.v1";
  let view = (() => {
    try { return localStorage.getItem(VIEW_KEY) || "sheets"; } catch (e) { return "sheets"; }
  })();
  if (!VIEWS.some(([k]) => k === view)) view = "sheets";

  let S = null;      // данные открытого объекта
  let host = null;
  let ctx = null;
  const F = { q: "", open: { general: true, scheme: true }, spOpen: {} };
  /* Что смотрим (06.10.2026): «» — весь объект, «s:8» — секция 8 из всех
     томов, «d:<id>» — один том. Проект большого квартала — 17 PDF,
     и ПТО обязан видеть их одним объектом, но и по отдельности. */
  let SCOPE = "";
  const J = { mode: "sheets", sheet: "", q: "", flagged: false, diff: false, reserve: 0 };
  let cardTab = "general";

  /* Что показываем: в «Тендере» модуль открыт ради одного чек-листа
     (ctx.only) — тот же самый, что в ПТО (заказчик, 08.10.2026). */
  const curView = () => (ctx && ctx.only) || view;

  /* ── вход ────────────────────────────────────────────────── */
  function mount(el, context) {
    host = el;
    ctx = context;
    if (!S || S.siteId !== ctx.siteId) {
      S = { siteId: ctx.siteId, data: null, cables: null, sig: "", doc: "",
            pending: {}, timer: {}, saving: {}, again: {}, busy: false, spec: null, specQ: "",
            specDoc: "", mine: null, mineExtra: [] };
      paint();
      load(false);
    } else {
      // Спецификацию — свежую: её могли разобрать заново в «Тендере».
      S.spec = null;
      paint();
      load(true);
    }
  }

  async function load(quiet) {
    const siteId = S.siteId;
    try {
      const d = await AUTH.api("GET", "/sites/" + enc(siteId) + "/pto");
      if (!S || S.siteId !== siteId) return;
      const sig = JSON.stringify([d.docs, d.sheets, d.cables, d.forms.checklist.at,
                                  d.forms.card.at, (d.forms.levels || {}).at]);
      if (quiet && sig === S.sig) return;
      // Форму, которую человек сейчас правит, свежим ответом не затираем.
      if (S.data) {
        for (const k of ["checklist", "card", "levels"]) {
          if ((S.pending[k] || S.saving[k]) && S.data.forms[k]) d.forms[k] = S.data.forms[k];
        }
      }
      const typing = host && host.contains(document.activeElement)
        && /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName);
      S.sig = sig;
      S.data = d;
      S.error = "";
      if (!S.doc || !d.docs.some((x) => x.id === S.doc)) {
        const parsed = d.docs.find((x) => x.parsed);
        S.doc = (parsed || d.docs[0] || {}).id || "";
      }
      if (quiet && S.cables) S.cables = null;
      if (typing && quiet) return;
      paint();
    } catch (e) {
      if (!S || S.siteId !== siteId) return;
      S.error = e.message;
      paint();
    }
  }

  async function loadCables() {
    const siteId = S.siteId;
    try {
      const r = await AUTH.api("GET", "/sites/" + enc(siteId) + "/pto/cables");
      if (!S || S.siteId !== siteId) return;
      setCables(r);
    } catch (e) {
      S.cables = [];
      note("Журнал не загрузился: " + e.message, true);
    }
    if (view === "journal") paintView();
  }

  /* ── каркас ──────────────────────────────────────────────── */
  const multi = () => !!(S && S.data && S.data.docs.length > 1);
  /* Секции объекта: из томов и из листов, по возрастанию. */
  function objSections() {
    const d = S.data;
    const set = new Set(d.docs.map((x) => x.section).filter(Boolean));
    for (const sh of d.sheets) for (const x of expandSections(sh.section)) set.add(x);
    return [...set].sort((a, b) => SEC_ORDER(a) - SEC_ORDER(b) || a.localeCompare(b, "ru"));
  }
  const docPart = (id) => ((S.data.docs.find((x) => x.id === id) || {}).part || "");
  const sectionLabel = (s) => s === "Пристрой" ? s : "Секция " + s;
  /* Выбор «весь объект / секция / том» — один на состав проекта и журнал. */
  function scopeHtml(id) {
    const d = S.data;
    const secs = objSections();
    if (!secs.length && !multi()) return "";
    const opt = (v, t) => `<option value="${esc(v)}"${SCOPE === v ? " selected" : ""}>${esc(t)}</option>`;
    return `<select class="role-sel pto-scope" id="${id}" title="Весь объект, одна секция из всех томов или один том">
      ${opt("", multi() ? "Весь объект" : "Все секции")}
      ${secs.length ? `<optgroup label="Секции">${secs.map((x) => opt("s:" + x, sectionLabel(x))).join("")}</optgroup>` : ""}
      ${multi() ? `<optgroup label="Тома проекта">${d.docs.map((x) => opt("d:" + x.id, (x.part || x.filename)
        + (x.section ? " · " + sectionLabel(x.section).toLowerCase() : " · общий"))).join("")}</optgroup>` : ""}
    </select>`;
  }
  /* Лист в выбранном? Секция — с разворотом «1-6» и «1, 2». */
  function inScope(sheet) {
    if (!SCOPE) return true;
    if (SCOPE.startsWith("d:")) return sheet.doc_id === SCOPE.slice(2);
    const want = SCOPE.slice(2);
    return expandSections(sheet.section).includes(want);
  }
  /* Отбор кабелей журнала. Секция кабеля — по листу схемы, с которого он
     снят: том бывает и на несколько секций. У вписанного руками листа нет —
     тогда по секции тома. null — отбора нет. */
  function cableScope() {
    if (!SCOPE) return null;
    const want = SCOPE.slice(2);
    if (SCOPE.startsWith("d:")) return (r) => r.doc_id === want;
    const sec = new Map(S.data.sheets.map((s) => [s.doc_id + "|" + s.page, s.section]));
    const docSec = new Map(S.data.docs.map((x) => [x.id, x.section || ""]));
    return (r) => expandSections(sec.get(r.doc_id + "|" + r.page) ?? docSec.get(r.doc_id) ?? "")
      .includes(want);
  }

  function paint() {
    if (!host || !host.isConnected) return;
    const d = S && S.data;
    if (!d) {
      host.innerHTML = `<div class="pto"><div class="pg-empty">${S && S.error
        ? `<b>Не загрузилось</b>${esc(S.error)}` : "<b>Загружаю ПТО…</b>"}</div></div>`;
      return;
    }
    if (SCOPE && !(SCOPE.startsWith("d:") ? d.docs.some((x) => "d:" + x.id === SCOPE)
      : objSections().includes(SCOPE.slice(2)))) SCOPE = "";
    const doc = d.docs.find((x) => x.id === S.doc);
    const parsed = doc && doc.parsed;
    const done = d.docs.filter((x) => x.parsed).length;
    host.innerHTML = `
      <div class="pto">
        <div class="pto-bar">
          ${ctx.only ? "" : `<div class="seg pto-views">${VIEWS.map(([k, t]) => `<button type="button"
            class="seg-b${view === k ? " on" : ""}" data-view="${k}">${t}</button>`).join("")}</div>`}
          <div class="pto-src">
            ${multi() ? `
              <button type="button" class="btn-ghost sm${S.docsOpen ? " on" : ""}" id="ptoDocs"
                aria-expanded="${!!S.docsOpen}" title="Тома проекта: секция каждого и разбор">${ICO.chev}Документы проекта · ${d.docs.length}</button>
              <span class="sit-hint">${S.all ? esc(S.all) : `разобрано ${done} из ${d.docs.length}`
                + (objSections().length ? ` · ${objSections().length} ${plural(objSections().length, "секция",
                  "секции", "секций")}` : "")}</span>
              ${ctx.can ? `<button type="button" class="${done ? "btn-ghost" : "btn-brand"} sm" id="ptoParseAll"${
                S.busy ? " disabled" : ""} title="Разобрать все тома по очереди. Поправленное руками разбор не трогает">${
                done ? ICO.again : ICO.fill}${S.busy ? "Разбираю…" : "Разобрать все"}</button>` : ""}`
            : d.docs.length ? `
              <span class="pto-file" title="${esc(doc.filename)}">${esc(doc.filename)}</span>
              <span class="sit-hint">${parsed
                ? `разобран ${esc(hhmm(parsed.at))} · ${parsed.sheets} ${plural(parsed.sheets,
                  "лист", "листа", "листов")}, ${parsed.cables} ${plural(parsed.cables, "кабель",
                  "кабеля", "кабелей")}` : "проект ещё не разобран"}</span>
              ${ctx.can ? `<button type="button" class="${parsed ? "btn-ghost" : "btn-brand"} sm"
                id="ptoParse"${S.busy ? " disabled" : ""}>${parsed ? ICO.again : ICO.fill}${
                S.busy ? "Разбираю…" : parsed ? "Разобрать заново" : "Разобрать проект"}</button>` : ""}`
              : `<span class="sit-hint">PDF проекта не загружен</span>
                 ${ctx.can ? `<button type="button" class="btn-brand sm" id="ptoUp">${ICO.up}Загрузить проект</button>` : ""}`}
          </div>
        </div>
        ${multi() && S.docsOpen ? docsHtml() : ""}
        <div class="pg-note" id="ptoNote" hidden></div>
        <div class="pto-view" id="ptoView"></div>
      </div>`;
    host.querySelectorAll("[data-view]").forEach((b) => b.addEventListener("click", () => {
      if (view === b.dataset.view) return;
      view = b.dataset.view;
      try { localStorage.setItem(VIEW_KEY, view); } catch (e) { /* без памяти */ }
      host.querySelectorAll("[data-view]").forEach((x) => x.classList.toggle("on", x === b));
      paintView();
    }));
    const pb = $p("#ptoParse", host);
    if (pb) pb.addEventListener("click", parseProject);
    const dk = $p("#ptoDocs", host);
    if (dk) dk.addEventListener("click", () => { S.docsOpen = !S.docsOpen; paint(); });
    const pa = $p("#ptoParseAll", host);
    if (pa) pa.addEventListener("click", () => parseAll());
    if (S.docsOpen) wireDocs();
    const up = $p("#ptoUp", host);
    if (up) up.addEventListener("click", () => ctx.upload && ctx.upload());
    if (S.lastNote) note(S.lastNote[0], S.lastNote[1]);
    paintView();
  }

  /* Тома проекта: секция каждого — найденная разбором или вписанная
     руками, — и разобран ли он. Пустая секция — общий том (автостоянка,
     наружные сети): его листы идут в каждую секцию как общие. */
  function docsHtml() {
    const d = S.data;
    const ed = ctx.can;
    return `<div class="pto-docs" id="ptoDocsBox">
      <table class="tbl pto-docs-t" style="--tbl-min:900px">
        <colgroup><col><col style="width:110px"><col style="width:150px"><col style="width:230px">
          <col style="width:150px"></colgroup>
        <thead><tr><th>Том</th><th>Шифр</th><th>Секция</th><th>Разбор</th><th></th></tr></thead>
        <tbody>${d.docs.map((x) => {
          const p = x.parsed;
          const auto = x.section_auto ? "найдена: " + x.section_auto : "не найдена";
          return `<tr data-did="${esc(x.id)}">
            <td><span class="t-name" title="${esc(x.filename)}">${esc(x.filename)}</span></td>
            <td class="pto-part" title="${esc(x.part)}">${esc(x.part)}</td>
            <td>${ed ? `<input class="pos-in pto-dsec${x.section_manual ? " pto-edited-in" : ""}" data-dsec
              value="${esc(x.section)}" placeholder="общий" title="Секция тома (${esc(auto)}). Пусто — общий том"
              inputmode="numeric">` : esc(x.section || "общий")}${x.section_manual && ed ? `<button type="button"
              class="lnk pto-dsec-auto" data-dauto title="Вернуть то, что нашёл разбор (${esc(auto)})">↺</button>` : ""}</td>
            <td class="dim">${p ? `${esc(hhmm(p.at))} · ${p.sheets} ${plural(p.sheets, "лист", "листа", "листов")}${
              p.rooms && p.rooms.sections && Object.keys(p.rooms.sections).length ? " · квартиры" : ""}`
              : "не разобран"}</td>
            <td>${ed ? `<button type="button" class="lnk" data-dparse${S.busy ? " disabled" : ""}>${p
              ? "Разобрать заново" : "Разобрать"}</button>` : ""}</td>
          </tr>`;
        }).join("")}</tbody>
      </table>
      <div class="pto-hint">Секцию тома Трейс находит сам — по надписи «Секция 3.1.8» на листах
        или по имени файла («ЭОМ8»). Пустая секция — общий том: автостоянка, наружные сети.</div>
    </div>`;
  }

  function wireDocs() {
    const box = $p("#ptoDocsBox", host);
    if (!box) return;
    box.querySelectorAll("[data-dsec]").forEach((el) => {
      el.dataset.last = el.value;
      el.addEventListener("keydown", (e) => { if (e.key === "Enter") el.blur(); });
      el.addEventListener("change", () => setDocSection(el.closest("tr").dataset.did, el.value.trim(), el));
    });
    box.querySelectorAll("[data-dauto]").forEach((b) => b.addEventListener("click", () =>
      setDocSection(b.closest("tr").dataset.did, null, b)));
    box.querySelectorAll("[data-dparse]").forEach((b) => b.addEventListener("click", () =>
      parseAll([b.closest("tr").dataset.did])));
  }

  async function setDocSection(id, section, el) {
    try {
      S.data = await AUTH.api("PATCH", "/sites/" + enc(S.siteId) + "/pto/docs/" + enc(id), { section });
      S.sig = "";
      S.cables = null;
      paint();
    } catch (e) {
      if (el) { el.classList && el.classList.add("bad"); el.title = e.message; }
      note("Секция не сохранилась: " + e.message, true);
    }
  }

  /* Разобрать тома по очереди — каждый своим запросом: семнадцать томов
     одним запросом — это минута тишины, а так видно, какой идёт. */
  async function parseAll(ids) {
    if (S.busy) return;
    const list = ids || S.data.docs.map((x) => x.id);
    S.busy = true;
    FRESH.hold();
    let ok = 0;
    const bad = [];
    const tr = TRACE.start({ kind: "project" });
    try {
      for (let i = 0; i < list.length; i++) {
        const doc = S.data.docs.find((x) => x.id === list[i]) || {};
        S.all = list.length > 1 ? `разбираю ${i + 1} из ${list.length}: ${doc.part || doc.filename}…`
          : `разбираю ${doc.part || doc.filename}…`;
        paint();
        tr.progress(i, list.length, doc.part || doc.filename);
        try {
          S.data = await AUTH.api("POST", "/sites/" + enc(S.siteId) + "/pto/parse", { doc_id: list[i] });
          ok++;
        } catch (e) {
          bad.push((doc.part || doc.filename) + ": " + e.message);
        }
      }
    } finally {
      S.busy = false;
      S.all = "";
      S.cables = null;
      S.sig = "";
      FRESH.release();
    }
    const secs = objSections().length;
    if (ok) tr.done(`Разобрано томов: ${ok}` + (bad.length ? `, не разобрались: ${bad.length}` : ""));
    else tr.fail("Не разобрался ни один том");
    note(`Разобрано томов: ${ok}${secs ? `, секций в объекте: ${secs}` : ""}.` + (bad.length
      ? " Не разобрались: " + bad.join("; ") : " Квартиры по секциям — в «Чек-листе», кнопка «Заполнить из проекта»."),
      bad.length > 0);
    paint();
  }

  function note(text, bad) {
    S.lastNote = text ? [text, bad] : null;
    const box = host && $p("#ptoNote", host);
    if (!box) return;
    box.textContent = text || "";
    box.classList.toggle("bad", !!bad);
    box.hidden = !text;
  }

  async function parseProject() {
    if (!S.doc || S.busy) return;
    S.busy = true;
    note("Разбираю проект: читаю листы, схемы и этажные щиты. На проект в двести листов — "
      + "до минуты, страницу не закрывайте.");
    paint();
    FRESH.hold();
    const tr = TRACE.start({ kind: "project",
      file: (((S.data && S.data.docs) || []).find((x) => x.id === S.doc) || {}).filename || "" });
    try {
      const d = await AUTH.api("POST", "/sites/" + enc(S.siteId) + "/pto/parse", { doc_id: S.doc });
      S.data = d;
      S.cables = null;
      S.sig = "";
      const p = (d.docs.find((x) => x.id === S.doc) || {}).parsed || {};
      const parts = [`${p.sheets} ${plural(p.sheets, "лист", "листа", "листов")}`,
        `${p.schemes} ${plural(p.schemes, "принципиальная схема", "принципиальные схемы",
          "принципиальных схем")}`,
        `${p.cables} ${plural(p.cables, "кабель", "кабеля", "кабелей")} в журнал`];
      const secs = Object.keys(p.sections || {}).length;
      if (secs) parts.push(`квартиры по этажам — в ${secs} ${plural(secs, "секции", "секциях", "секциях")}`);
      let text = "Разобрано: " + parts.join(", ") + ".";
      if (p.journal) text += ` В проекте есть свой кабельный журнал — сверили с ним ${p.matched} ${plural(p.matched, "линию", "линии", "линий")}, расхождения помечены.`;
      if (p.textless && p.textless === p.pages) {
        text = "В этом PDF нет текста: надписи на листах нарисованы линиями — так бывает, "
          + "когда проект печатают в PDF как картинку. Прочитать такой файл Трейс не может. "
          + "Попросите у проектировщика PDF, выгруженный из САПР с текстом, — или ведите журнал "
          + "руками кнопкой «+ Строка».";
      } else if (p.blind && p.blind.length) {
        text += ` На ${p.blind.length} ${plural(p.blind.length, "листе", "листах", "листах")} схем нет текста (надписи нарисованы линиями) — кабели по ним впишите руками.`;
      }
      if (p.textless && p.textless === p.pages) tr.fail("В PDF нет текста — прочитать нечего");
      else tr.done("Разобрано: " + parts.join(", "));
      note(text);
    } catch (e) {
      tr.fail("Не получилось: " + e.message);
      note("Не разобрался: " + e.message, true);
    } finally {
      S.busy = false;
      FRESH.release();
      paint();
    }
  }

  function paintView() {
    const box = host && $p("#ptoView", host);
    if (!box) return;
    const v = curView();
    if (v === "sheets") sheetsView(box);
    else if (v === "spec") specView(box);
    else if (v === "checklist") checklistView(box);
    else if (v === "card") cardView(box);
    else if (v === "levels") levelsView(box);
    else if (v === "letters") lettersView(box);
    else if (v === "repl") replView(box);
    else journalView(box);
  }

  /* ── согласование замен (правка № 32, 23.10.2026) ────────────────
     Снабжение выбрало у поставщика аналог и нажало «Согласовать в ПТО» —
     заявка приходит сюда. Ведущий инженер по каждой замене: «Да» или «Нет»
     с причиной (её увидит снабженец, строка вернётся к нему). Когда все
     замены проработки согласованы — «Письмо заказчику»: Word на бланке
     компании объекта со списком «в проекте → замена». */
  const RX = {};                 // решения, набранные до отправки: id строки → {decision, comment}
  async function replView(box, cached) {
    const siteId = S.siteId;
    let d = cached && S.repl;
    if (!d) {
      box.innerHTML = `<div class="pto-main"><div class="pg-empty"><b>Загружаю заявки…</b></div></div>`;
      try {
        d = S.repl = await AUTH.api("GET", "/sites/" + enc(siteId) + "/pto/approvals");
      } catch (e) {
        box.innerHTML = `<div class="pto-main"><div class="pg-empty"><b>Не загрузилось</b>${esc(e.message)}</div></div>`;
        return;
      }
    }
    if (!S || S.siteId !== siteId || curView() !== "repl") return;
    const rows = d.rows || [];
    const dmy = (at) => String(at || "").slice(0, 10).split("-").reverse().join(".");
    const st = (a) => a.status === "open" ? `<em class="pto-rx-st open">на согласовании</em>`
      : `<em class="pto-rx-st done">решено · ${a.counts.ok} да${a.counts.no ? ", " + a.counts.no + " нет" : ""}</em>`;
    const dec = (a, r) => {
      if (!a.can_decide) {
        return r.decision ? `<span class="pto-rx-d ${esc(r.decision)}">${r.decision === "ok" ? "Согласовано" : "Не согласовано"}${
          r.comment ? `<i>${esc(r.comment)}</i>` : ""}</span>` : `<span class="pto-rx-d">ждёт решения</span>`;
      }
      const x = RX[r.id] || { decision: r.decision, comment: r.comment };
      return `<span class="seg pto-rx-seg"><button type="button" class="seg-b${x.decision === "ok" ? " on ok" : ""}" data-rx="${esc(r.id)}"
        data-v="ok">Да</button><button type="button" class="seg-b${x.decision === "no" ? " on no" : ""}" data-rx="${esc(r.id)}"
        data-v="no">Нет</button></span>${x.decision === "no" ? `<input class="pos-in pto-rx-c" data-rc="${esc(r.id)}"
        placeholder="почему — увидит снабжение" value="${esc(x.comment || "")}">` : ""}`;
    };
    box.innerHTML = `<div class="pto-main">
      <div class="pto-hint">Замены материалов, которые выбрало снабжение: что в проекте и что предлагают вместо него.
        По каждой — «Да» или «Нет» с причиной; несогласованные вернутся снабженцу. Когда согласованы все замены
        проработки — «Письмо заказчику».</div>
      ${rows.length ? rows.map((a) => `<section class="pto-rx" data-ap="${esc(a.id)}">
        <div class="pto-rx-h"><b>${esc(a.supply || "Проработка")}</b>${st(a)}
          <i>от ${esc(a.author)} · ${esc(dmy(a.at))}${a.to_name ? " · кому: " + esc(a.to_name) : ""}${a.note ? " · " + esc(a.note) : ""}</i>
          <span class="grow"></span>
          ${a.can_decide ? `<button type="button" class="btn-ghost sm" data-all="${esc(a.id)}">Согласовать все</button>
            <button type="button" class="btn-brand sm" data-send="${esc(a.id)}">Отправить решение</button>` : ""}
          ${a.status === "done" && a.counts.ok ? `<button type="button" class="btn-ghost sm" data-letter="${esc(a.id)}"
            title="Word на бланке компании объекта: все согласованные замены проработки">Письмо заказчику</button>` : ""}
        </div>
        <div class="pto-rx-t">${a.rows.map((r, i) => `<div class="pto-rx-r">
          <span class="pto-rx-n">${i + 1}</span>
          <span class="pto-rx-a"><i>в проекте${r.pos_no ? " · № " + esc(r.pos_no) : ""}</i><b>${esc(r.name)}</b>${r.brand ? `<small>${esc(r.brand)}</small>` : ""}</span>
          <span class="pto-rx-q">${r.qty != null ? esc(String(r.qty).replace(".", ",")) + " " + esc(r.unit || "") : ""}</span>
          <span class="pto-rx-a"><i>замена · ${esc(r.supplier)}</i><b>${esc(r.alt_name || "—")}</b>${r.alt_brand || r.alt_code
            ? `<small>${esc([r.alt_brand, r.alt_code && "арт. " + r.alt_code].filter(Boolean).join(" · "))}</small>` : ""}</span>
          <span class="pto-rx-dc">${dec(a, r)}</span></div>`).join("")}</div>
      </section>`).join("") : `<div class="pg-empty"><b>Заявок нет</b>Снабжение присылает замены кнопкой «Согласовать в ПТО»
        в проработке объекта.</div>`}
    </div>`;
    const ap = (id) => rows.find((x) => x.id === id);
    box.querySelectorAll("[data-rx]").forEach((b) => b.addEventListener("click", () => {
      const cur = RX[b.dataset.rx] || {};
      RX[b.dataset.rx] = { decision: cur.decision === b.dataset.v ? "" : b.dataset.v, comment: cur.comment || "" };
      replView(box, true);
    }));
    box.querySelectorAll("[data-rc]").forEach((el) => el.addEventListener("input", () => {
      RX[el.dataset.rc] = Object.assign(RX[el.dataset.rc] || { decision: "no" }, { comment: el.value });
    }));
    box.querySelectorAll("[data-all]").forEach((b) => b.addEventListener("click", () => {
      ap(b.dataset.all).rows.forEach((r) => { RX[r.id] = { decision: "ok", comment: "" }; });
      replView(box, true);
    }));
    box.querySelectorAll("[data-send]").forEach((b) => b.addEventListener("click", async () => {
      const a = ap(b.dataset.send);
      const send = a.rows.filter((r) => RX[r.id] && RX[r.id].decision).map((r) => ({ id: r.id, ...RX[r.id] }));
      if (!send.length) { note("Отметьте «Да» или «Нет» хотя бы у одной замены", true); return; }
      try {
        b.disabled = true;
        const out = await AUTH.api("POST", "/pto-approvals/" + enc(a.id) + "/decide", { rows: send });
        send.forEach((x) => { delete RX[x.id]; });
        note(out.status === "done" ? (out.counts.no ? `Решение отправлено: несогласованные (${out.counts.no}) вернулись снабженцу.`
          : "Все замены заявки согласованы — снабжению ушло сообщение.") : "Решение сохранено — остальные замены ждут.");
        replView(box);
      } catch (e) {
        b.disabled = false;
        note("Не вышло: " + e.message, true);
      }
    }));
    box.querySelectorAll("[data-letter]").forEach((b) => b.addEventListener("click", async (e) => {
      const site = ((typeof SITES === "object" && SITES.current && SITES.current()) || {}).name || "";
      try {
        await DL.save("/api/pto-approvals/" + enc(b.dataset.letter) + "/letter", {
          btn: e.currentTarget, body: {}, name: `Письмо о замене материалов — ${site || "объект"}.docx`,
          error: "Письмо не собралось" });
      } catch (err) {
        note(err.message, true);
      }
    }));
  }

  /* ── бланки писем (правка № 9, 21.10.2026) ─────────────────────
     ПТО: «бланк письма — автоматически заказчик, к кому направляем, название
     проекта, исполнитель; формирует бланк и даёт скачать — останется вписать
     замечания и сводную таблицу; бланк Электро или Электромонтаж — сам». Что
     подставить, говорит сервер (pto_letter): компания объекта, заказчик и его
     контакты, проект, тот, кто открыл. Всё правится до скачивания; набранное
     держится, пока ходят по вкладкам ПТО. Word собирает letter_docx.py. */
  async function lettersView(box) {
    const siteId = S.siteId;
    if (!S.letter) {
      box.innerHTML = `<div class="pto-main"><div class="pg-empty"><b>Готовлю бланк…</b></div></div>`;
      try {
        S.letter = { d: await AUTH.api("GET", "/sites/" + enc(siteId) + "/pto/letter") };
      } catch (e) {
        box.innerHTML = `<div class="pto-main"><div class="pg-empty"><b>Не загрузилось</b>${esc(e.message)}</div></div>`;
        return;
      }
      if (!S || S.siteId !== siteId || curView() !== "letters") return;
    }
    const d = S.letter.d;
    const f = S.letter.form || (S.letter.form = {
      org_id: d.org_id, to_org: d.customer.name, to_post: "", to_name: (d.customer.contacts[0] || {}).name || "",
      subject: d.subject, project: d.project, number: "", date: d.date, executor: Object.assign({}, d.executor) });
    const inp = (k, label, ph = "", attrs = "") => `<label class="fld"><span>${label}</span><input data-lf="${k}"
      value="${esc(f[k])}" placeholder="${esc(ph)}" autocomplete="off"${attrs}></label>`;
    const exi = (k, label, ph = "", attrs = "") => `<label class="fld"><span>${label}</span><input data-le="${k}"
      value="${esc(f.executor[k])}" placeholder="${esc(ph)}" autocomplete="off"${attrs}></label>`;
    box.innerHTML = `
      <div class="pto-main">
        <div class="pto-hint">Бланк письма в Word на бланке компании объекта: шапка с логотипом и реквизитами,
          исходящий номер, адресат, тема, текст с местом под замечания, сводная таблица и подпись руководителя.
          Останется вписать замечания и заполнить таблицу.</div>
        <div class="pto-letter">
          <section class="pto-lt wide">
            <h4>Бланк</h4>
            <div class="seg pto-lt-orgs" role="radiogroup" aria-label="Бланк компании">${d.orgs.map((o) => `<button type="button"
              class="seg-b${o.id === f.org_id ? " on" : ""}" data-org="${esc(o.id)}" role="radio" aria-checked="${o.id === f.org_id}">${
              esc(o.name)}${o.id === d.org_id ? " · компания объекта" : ""}</button>`).join("")}</div>
            ${d.orgs.some((o) => o.id === f.org_id && !o.logo) ? `<p class="sit-hint">У этой компании нет логотипа — в шапке будут
              только реквизиты. Логотип загружают в «Справочниках» → «Наши компании».</p>` : ""}
          </section>
          <section class="pto-lt">
            <h4>Кому</h4>
            ${inp("to_org", "Организация", "Заказчик")}
            ${inp("to_post", "Должность адресата", "например, Главному инженеру проекта")}
            ${inp("to_name", "ФИО адресата", "Фамилия Имя Отчество", ' list="ptoLtWho"')}
            <datalist id="ptoLtWho">${d.customer.contacts.map((c) => `<option value="${esc(c.name)}">${
              esc([c.phone, c.email].filter(Boolean).join(", "))}</option>`).join("")}</datalist>
            ${d.customer.contacts.length ? "" : `<p class="sit-hint">Контактов заказчика нет — их заводят в карточке
              заказчика («Справочники» → «Контрагенты»).</p>`}
          </section>
          <section class="pto-lt">
            <h4>Письмо</h4>
            <div class="pto-lt-2">${inp("number", "Исходящий №", "впишете при регистрации")}
              ${inp("date", "Дата", "", ' type="date"')}</div>
            ${inp("subject", "Тема")}
            ${inp("project", "Объект и проект", "", ' list="ptoLtDocs"')}
            <datalist id="ptoLtDocs">${d.docs.map((x) => `<option value="${esc(x)}"></option>`).join("")}</datalist>
          </section>
          <section class="pto-lt wide">
            <h4>Исполнитель</h4>
            <div class="pto-lt-4">${exi("name", "ФИО")}${exi("post", "Должность")}
              ${exi("phone", "Телефон", "", ' inputmode="tel"')}${exi("email", "Почта", "", ' inputmode="email"')}</div>
          </section>
          <div class="pto-lt-foot">
            <button type="button" class="btn-brand" id="ptoLtGo">${ICO.down}Скачать бланк (Word)</button>
            <button type="button" class="btn-ghost sm" id="ptoLtReset" title="Вернуть то, что подставилось само">Как было</button>
          </div>
        </div>
      </div>`;
    box.querySelectorAll("[data-lf]").forEach((el) => el.addEventListener("input", () => { f[el.dataset.lf] = el.value; }));
    box.querySelectorAll("[data-le]").forEach((el) => el.addEventListener("input", () => { f.executor[el.dataset.le] = el.value; }));
    box.querySelectorAll("[data-org]").forEach((b) => b.addEventListener("click", () => {
      f.org_id = b.dataset.org;
      lettersView(box);
    }));
    $p("#ptoLtReset", box).addEventListener("click", () => { S.letter.form = null; lettersView(box); });
    $p("#ptoLtGo", box).addEventListener("click", async (e) => {
      const site = ((typeof SITES === "object" && SITES.current && SITES.current()) || {}).name || "";
      try {
        await DL.save("/api/sites/" + enc(siteId) + "/pto/letter", {
          btn: e.currentTarget, body: f, name: `Письмо — ${site || "объект"}.docx`,
          error: "Бланк не собрался" });
      } catch (err) {
        note("Не вышло: " + err.message, true);
      }
    });
  }

  /* ── спецификация ─────────────────────────────────────────────
     Строки — те же, что разбирает «Тендер» из того же проекта: правка и
     повторный разбор видны в обоих местах. Своё у ПТО — «Расчёт ПТО»:
     объём, посчитанный инженером. В бюджет («Финансы») идёт меньший из
     двух — по договору и расчётный. */
  async function specLoad() {
    const siteId = S.siteId;
    try {
      const r = await AUTH.api("GET", "/sites/" + enc(siteId) + "/pto/spec");
      if (!S || S.siteId !== siteId) return;
      S.spec = r;
    } catch (e) {
      if (!S || S.siteId !== siteId) return;
      S.spec = { error: e.message, docs: [], rows: [] };
    }
    if (curView() === "spec") paintView();
  }

  const specNum = (v) => (v === null || v === undefined || v === "" ? ""
    : Number(v).toLocaleString("ru-RU", { maximumFractionDigits: 3 }));

  /* Группы по проектам (заказчик, 21.10.2026: «добавить группировку по
     проектам»). У ЖК «Лесный» три тома ЭОМ, и их спецификации шли подряд
     под одинаковой подписью «ЭОМ»: теперь у проекта своё имя («01.2-ЭОМ»),
     строка-заголовок сворачивает его позиции, вверху — выбор проекта. */
  function specRowsHtml() {
    const sp = S.spec;
    const q = S.specQ.trim().toLowerCase().split(/\s+/).filter(Boolean);
    const hit = (r) => !q.length || q.every((w) => [r.pos_no, r.name, r.brand, r.code].join(" ")
      .toLowerCase().includes(w));
    const ed = ctx.can;
    const many = sp.docs.length > 1;
    if (S.specDoc && !sp.docs.some((d) => d.id === S.specDoc)) S.specDoc = "";
    const docs = S.specDoc ? sp.docs.filter((d) => d.id === S.specDoc) : sp.docs;
    return docs.map((d) => {
      const rows = sp.rows.filter((r) => r.doc_id === d.id && (q.length ? r.kind !== "section" && hit(r) : true));
      if (q.length && !rows.length) return "";
      const open = q.length || !many ? true : F.spOpen[d.id] !== false;
      const done = sp.rows.filter((r) => r.doc_id === d.id && r.kind !== "section"
        && r.pto !== null && r.pto !== undefined).length;
      const name = many ? `<button type="button" class="pto-sp-tog" data-sptog="${esc(d.id)}" aria-expanded="${open}"
          title="${open ? "Свернуть позиции проекта" : "Показать позиции проекта"}">${ICO.chev}<b>${esc(d.part || d.title)}</b></button>`
        : `<b>${esc(d.part || d.title)}</b>`;
      const head = many || !d.positions ? `<tr class="pto-sp-doc${open ? " open" : ""}" data-spdoc="${esc(d.id)}"><td colspan="8">
        ${name}<i>${esc(d.filename)}${d.positions ? ` · ${d.positions} ${plural(d.positions,
          "позиция", "позиции", "позиций")} · расчёт ПТО у ${done}` : ""}</i>${!d.positions ? `<span class="pto-sp-none">спецификация не
          извлечена</span>${ed && ctx.parse && d.parsable ? `<button type="button" class="btn-brand sm" data-spparse="${esc(d.id)}"
          title="Найти в проекте таблицу спецификации и вынуть позиции — так же, как в «Тендере»">${ICO.fill}Извлечь спецификацию</button>` : ""}` : ""}</td></tr>` : "";
      if (!open) return head;
      return head + rows.map((r) => {
        if (r.kind === "section") return `<tr class="pto-sp-sec"><td colspan="8">${esc(r.name)}</td></tr>`;
        const diff = r.pto !== null && r.pto !== undefined && r.qty !== null ? r.pto - r.qty : null;
        return `<tr data-spid="${esc(r.id)}"${r.skip ? ' class="pto-sp-skip" title="«Не учитывать» в расчёте"' : ""}>
          <td class="t-id pto-sp-no" title="${esc(r.pos_no)}">${esc(r.pos_no)}</td>
          <td><span class="pto-sp-nm" title="${esc(r.name)}">${esc(r.name)}</span>${r.origin === "hand"
            ? '<i class="pto-sub">добавлено в расчёте</i>' : ""}</td>
          <td class="pto-sp-tx" title="${esc(r.brand)}">${esc(r.brand)}</td>
          <td class="pto-sp-tx" title="${esc(r.code)}">${esc(r.code)}</td>
          <td>${esc(r.unit)}</td>
          <td class="num">${specNum(r.qty)}</td>
          <td class="num pto-sp-in">${ed ? `<input class="pos-in num" data-spq inputmode="decimal" value="${
            esc(r.pto === null || r.pto === undefined ? "" : String(r.pto).replace(".", ","))}" placeholder="—">`
            : specNum(r.pto)}</td>
          <td class="num pto-sp-d${diff === null ? "" : diff < 0 ? " less" : diff > 0 ? " more" : ""}">${
            diff === null ? "" : (diff > 0 ? "+" : "") + specNum(diff)}</td>
        </tr>`;
      }).join("");
    }).join("") || `<tr><td colspan="8" class="pto-sp-empty">Ничего не нашлось</td></tr>`;
  }

  const foldName = () => (S.spec.docs.some((d) => F.spOpen[d.id] !== false) ? "Свернуть все" : "Развернуть все");

  function specView(box) {
    if (!S.spec) {
      box.innerHTML = `<div class="pg-empty"><b>Загружаю спецификацию…</b></div>`;
      specLoad();
      return;
    }
    const sp = S.spec;
    if (sp.error) {
      box.innerHTML = `<div class="pg-empty"><b>Не загрузилась</b>${esc(sp.error)}</div>`;
      return;
    }
    if (!sp.docs.length) {
      box.innerHTML = `<div class="pg-empty"><b>Проекта пока нет</b>Спецификацию берём из проекта объекта —
        загрузите его, и она извлекается так же, как в «Тендере».</div>`;
      return;
    }
    const n = sp.rows.filter((r) => r.kind !== "section").length;
    const done = sp.rows.filter((r) => r.kind !== "section" && r.pto !== null && r.pto !== undefined).length;
    box.innerHTML = `
      <div class="pto-tools">
        <label class="pg-find">${ICO.find}<input id="spQ" type="search" placeholder="Позиция, марка, код"
          value="${esc(S.specQ)}" autocomplete="off"></label>
        ${sp.docs.length > 1 ? `<select class="role-sel pto-scope" id="spDoc" title="Все проекты объекта или один">
          <option value="">Все проекты · ${sp.docs.length}</option>${sp.docs.map((d) => `<option value="${esc(d.id)}"${
            S.specDoc === d.id ? " selected" : ""}>${esc(d.part || d.title)} · ${d.positions}</option>`).join("")}
        </select>
        <button type="button" class="btn-ghost sm" id="spFold">${foldName()}</button>` : ""}
        <span class="sit-hint">${n} ${plural(n, "позиция", "позиции", "позиций")} · расчёт ПТО у ${done}</span>
        ${(sp.calcs || []).length ? `<span class="sit-hint pto-calc-by" title="${esc(sp.calcs.map((x) =>
          `${String(x.at).slice(0, 10).split("-").reverse().join(".")} · ${x.author} · ${x.basis}${x.filename ? " · " + x.filename : ""}`).join("\n"))}"
          >расчёт по: <b>${esc(sp.calcs[0].basis)}</b> · ${esc(sp.calcs[0].author)}, ${
          esc(String(sp.calcs[0].at).slice(0, 10).split("-").reverse().join("."))}</span>` : ""}
        <span class="sit-hint pto-saved" id="spSaved"></span>
        <span class="grow"></span>
        ${n ? `<button type="button" class="btn-ghost sm" id="spTpl"
          title="Спецификация книгой Excel: впишите «Расчёт ПТО» и загрузите обратно">${ICO.down}Шаблон Excel</button>` : ""}
        ${n && ctx.can ? `<label class="btn-brand sm pto-sp-up" for="spFile"
          title="Книга с колонкой «Расчёт ПТО» — наш шаблон или своя: позиции узнаём по номеру, названию, марке и коду">${
          ICO.up}Загрузить расчёт</label>
          <input type="file" id="spFile" accept=".xlsx,.xlsm" hidden>` : ""}
      </div>
      <div class="pto-main">
        <div class="pto-hint">Те же позиции, что в «Тендере», — из того же проекта: правка и новый разбор видны
          в обоих местах. «Расчёт ПТО» — объём, который посчитал инженер: вписывают в таблице или загружают
          книгой Excel. В бюджет идёт меньший из двух: по спецификации договора или расчётный.</div>
        <table class="tbl pto-sp" style="--tbl-min:980px">
          <colgroup><col style="width:96px"><col><col style="width:200px"><col style="width:110px">
            <col style="width:56px"><col style="width:96px"><col style="width:112px"><col style="width:86px"></colgroup>
          <thead><tr><th>№</th><th>Наименование</th><th>Тип, марка</th><th>Код</th><th>Ед.</th>
            <th class="num" title="Количество по спецификации проекта">По проекту</th>
            <th class="num" title="Объём, посчитанный инженером ПТО. Пусто — не считали: в бюджет идёт объём по договору">Расчёт ПТО</th>
            <th class="num" title="Расчёт ПТО минус проект">Разница</th></tr></thead>
          <tbody id="spBody">${specRowsHtml()}</tbody>
        </table>
      </div>`;
    const q = $p("#spQ", box);
    q.addEventListener("input", () => {
      S.specQ = q.value;
      $p("#spBody", box).innerHTML = specRowsHtml();
    });
    const sd = $p("#spDoc", box);
    if (sd) sd.addEventListener("change", () => {
      S.specDoc = sd.value;
      $p("#spBody", box).innerHTML = specRowsHtml();
    });
    const fold = $p("#spFold", box);
    if (fold) fold.addEventListener("click", () => {
      const any = S.spec.docs.some((d) => F.spOpen[d.id] !== false);
      for (const d of S.spec.docs) F.spOpen[d.id] = !any;
      $p("#spBody", box).innerHTML = specRowsHtml();
      fold.textContent = foldName();
    });
    const tpl = $p("#spTpl", box);
    if (tpl) tpl.addEventListener("click", async () => {
      try {
        await DL.save("/api/sites/" + enc(S.siteId) + "/pto/spec/xlsx",
                      { btn: tpl, fallback: "Расчёт ПТО.xlsx", error: "Не удалось собрать книгу" });
      } catch (e) { note(e.message, true); }
    });
    const file = $p("#spFile", box);
    if (file) file.addEventListener("change", () => {
      const f = file.files && file.files[0];
      file.value = "";
      if (f) specImport(f);
    });
    const body = $p("#spBody", box);
    body.addEventListener("click", (e) => {
      const t = e.target.closest("[data-sptog]");
      if (t) {
        F.spOpen[t.dataset.sptog] = F.spOpen[t.dataset.sptog] === false;
        body.innerHTML = specRowsHtml();
        if (fold) fold.textContent = foldName();
        return;
      }
      const b = e.target.closest("[data-spparse]");
      if (b && ctx.parse) ctx.parse(b.dataset.spparse);
    });
    body.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && e.target.matches("[data-spq]")) { e.preventDefault(); e.target.blur(); }
    });
    body.addEventListener("change", async (e) => {
      const inp = e.target.closest("[data-spq]");
      if (!inp) return;
      const tr = inp.closest("tr");
      const id = tr.dataset.spid;
      const saved = $p("#spSaved", box);
      try {
        const r = await AUTH.api("POST", "/positions/" + enc(id) + "/pto", { qty: inp.value.trim() });
        const row = S.spec.rows.find((x) => x.id === id);
        if (row) row.pto = r.pto;
        inp.classList.remove("bad");
        const tmp = document.createElement("tbody");
        tmp.innerHTML = specRowsHtml();
        const fresh = tmp.querySelector(`tr[data-spid="${CSS.escape(id)}"] .pto-sp-d`);
        if (fresh) tr.querySelector(".pto-sp-d").replaceWith(fresh);
        if (saved) saved.textContent = "сохранено";
      } catch (err) {
        inp.classList.add("bad");
        inp.title = err.message;
        if (saved) saved.textContent = "не сохранилось: " + err.message;
      }
    });
  }

  /* ── расчёт ПТО из Excel (заказчик, 09.10.2026) ───────────────
     Книга уходит на сервер, тот возвращает предпросмотр: что изменится и
     чего в спецификации не нашлось. Записываем только после «Записать» —
     ровно то, что человек видел. Пустая клетка ничего не стирает. */
  function specImport(f) {
    const siteId = S.siteId;
    const saved = host && $p("#spSaved", host);
    if (saved) saved.textContent = "читаю книгу…";
    const tr = TRACE.start({ kind: "ptobook", file: f.name });
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/sites/" + enc(siteId) + "/pto/spec/import");
    xhr.setRequestHeader("Authorization", "Bearer " + AUTH.token());
    xhr.setRequestHeader("Content-Type", "application/octet-stream");
    xhr.setRequestHeader("X-File-Name", encodeURIComponent(f.name));
    xhr.addEventListener("load", () => {
      if (!S || S.siteId !== siteId) { tr.close(); return; }
      if (saved) saved.textContent = "";
      let res = null;
      try { res = JSON.parse(xhr.responseText); } catch (e) { /* ниже — как ошибка */ }
      if (xhr.status < 200 || xhr.status >= 300 || !res) {
        tr.fail("Не получилось: " + ((res && res.error) || "книга не загрузилась"));
        note((res && res.error) || "Книга не загрузилась", true);
        return;
      }
      const ch = (res.changes || []).length;
      tr.done(`Прочитал: ${ch} ${plural(ch, "изменение", "изменения", "изменений")} — проверьте`);
      impPreview(res, f.name);
    });
    xhr.addEventListener("error", () => {
      tr.fail("Сеть оборвалась — книга не загрузилась");
      note("Сеть оборвалась — книга не загрузилась", true);
    });
    xhr.send(f);
  }

  function impPreview(res, fname) {
    const ch = res.changes || [];
    const lost = res.lost || [], twice = res.twice || [], bad = res.bad || [];
    const box = document.createElement("div");
    box.className = "pf-modal";
    const was = (v) => (v === null || v === undefined ? "—" : specNum(v));
    box.innerHTML = `
      <div class="pf-crop pto-imp" role="dialog" aria-label="Расчёт ПТО из книги">
        <h3>Расчёт ПТО из книги</h3>
        <p class="pto-imp-src">${esc(fname)} · лист «${esc(res.sheet)}» · колонка «${esc(res.column)}»</p>
        ${res.fallback ? `<p class="pto-imp-warn">Колонки «Расчёт ПТО» в книге нет — объём взят из
          «${esc(res.column)}». Если это количество по проекту, а не расчёт, — отмените.</p>` : ""}
        <div class="pto-imp-sum">
          <span class="${ch.length ? "on" : ""}"><b>${ch.length}</b>изменится</span>
          <span><b>${res.same || 0}</b>уже так же</span>
          <span class="${lost.length ? "warn" : ""}"><b>${lost.length}</b>не нашлось в спецификации</span>
          ${twice.length + bad.length ? `<span class="warn"><b>${twice.length + bad.length}</b>пропущено</span>` : ""}
        </div>
        ${ch.length ? `<div class="pto-imp-list"><table class="tbl pto-imp-tbl">
          <thead><tr><th>№</th><th>Наименование</th><th>Ед.</th><th class="num">Было</th><th class="num">Станет</th></tr></thead>
          <tbody>${ch.map((x) => `<tr><td class="t-id">${esc(x.pos_no)}</td><td><span class="pto-sp-nm"
            title="${esc(x.name)}">${esc(x.name)}</span></td><td>${esc(x.unit)}</td>
            <td class="num dim">${was(x.was)}</td><td class="num"><b>${specNum(x.new)}</b></td></tr>`).join("")}</tbody>
        </table></div>` : `<p class="pto-imp-none">Записывать нечего: ${res.total
          ? "все объёмы из книги уже стоят в спецификации или не нашлись." : "в книге нет строк с расчётом."}</p>`}
        ${ch.length ? `<label class="fld pto-imp-basis"><span>Расчёт выполнен по <em>обязательно</em></span>
          <input id="impBasis" list="impBasisList" maxlength="300" autocomplete="off"
            placeholder="проект, изменение, дата — например: 3.1-ЭИПР-ЕК-ЭОМ1 изм. 4 от 10.10.2026">
          <datalist id="impBasisList">${((S.spec && S.spec.docs) || []).map((d) => `<option value="${esc(d.title)}">`).join("")}${
            ((S.spec && S.spec.calcs) || []).map((x) => `<option value="${esc(x.basis)}">`).join("")}</datalist></label>` : ""}
        ${lost.length || twice.length || bad.length ? `<details class="pto-imp-more">
          <summary>Что не встало — строки книги</summary>
          <ul>${lost.map((x) => `<li><b>стр. ${x.row}</b> ${esc([x.pos_no, x.name].filter(Boolean).join(" "))
            } — нет такой позиции</li>`).join("")}${twice.map((x) => `<li><b>стр. ${x.row}</b> ${esc(x.name)
            } — позиция уже была выше, взята первая</li>`).join("")}${bad.map((x) => `<li><b>стр. ${x.row}</b> ${
            esc(x.name)} — «${esc(x.raw)}» не число</li>`).join("")}</ul></details>` : ""}
        <div class="pf-modal-foot">
          <button type="button" class="btn ghost" data-imp="no">Отмена</button>
          ${ch.length ? `<button type="button" class="btn" data-imp="yes">Записать ${ch.length}</button>` : ""}
        </div>
      </div>`;
    document.body.appendChild(box);
    const onKey = (e) => { if (e.key === "Escape") close(); };
    const close = () => { document.removeEventListener("keydown", onKey); box.remove(); };
    document.addEventListener("keydown", onKey);
    box.addEventListener("click", (e) => { if (e.target === box) close(); });
    $p('[data-imp="no"]', box).addEventListener("click", close);
    const yes = $p('[data-imp="yes"]', box);
    if (yes) yes.addEventListener("click", async () => {
      // По чему посчитан расчёт (правка № 42, 23.10.2026) — без этого не пишем.
      const basis = $p("#impBasis", box).value.trim();
      if (basis.length < 3) {
        const inp = $p("#impBasis", box);
        inp.classList.add("bad");
        inp.focus();
        return;
      }
      yes.disabled = true;
      try {
        const r = await AUTH.api("POST", "/sites/" + enc(S.siteId) + "/pto/spec/apply",
                                 { rows: ch.map((x) => ({ id: x.id, qty: x.new })), basis, filename: fname });
        close();
        S.spec = null;
        await specLoad();
        note(`Расчёт ПТО записан: ${r.written} ${plural(r.written, "позиция", "позиции", "позиций")}`
          + (lost.length ? `, не нашлось в спецификации — ${lost.length}` : ""));
      } catch (e) {
        yes.disabled = false;
        note("Не записалось: " + e.message, true);
        close();
      }
    });
  }

  /* Лист проекта — отдельным PDF в новой вкладке. Окно открываем сразу, по
     щелчку: открытое позже, после ответа сервера, браузер счёл бы
     всплывающим и заблокировал. */
  async function openPage(docId, page, btn) {
    try {
      await DL.open("/api/documents/" + enc(docId) + "/page/" + page,
                    { btn, error: "лист не открылся" });
    } catch (e) {
      note("Не открылся лист " + page + ": " + e.message, true);
    }
  }

  async function download(what, btn) {
    for (const k of ["checklist", "card", "levels"]) if (S.pending[k]) await flush(k);
    try {
      await DL.save("/api/sites/" + enc(S.siteId) + "/pto/xlsx/" + what, {
        btn, body: { reserve: J.reserve, scope: SCOPE }, fallback: what + ".xlsx",
        error: "Не удалось собрать книгу" });
    } catch (e) {
      note(e.message, true);
    }
  }

  /* Книга PDF: листы секции по этажам или весь проект подряд. Собранное
     грузят в AutoCAD и считают длины кабелей, поэтому это именно файл, а
     не ссылка на просмотр: файл открывают чем угодно и шлют мастерам.

     Сервер собирает книгу за доли секунды, а едет она долго: секция весит
     10–20 МБ, весь проект — под 60, и почти всё это векторный чертёж,
     который без потерь не ужать. Поэтому файл читаем кусками и рядом с
     кнопкой показываем, сколько уже приехало, — иначе кажется, что
     платформа зависла. Ту же книгу второй раз можно не везти: сервер
     отвечает «не изменилась» (ETag), и браузер, сохранивший её у себя,
     отдаёт свою. */
  async function downloadPdf(what) {
    if (pdfBusy()) return;
    const st = S;
    const P = st.pdf = { what, got: 0, total: 0, done: false };
    paintPdf();
    // Обновление платформы посреди скачивания оборвало бы файл на полпути.
    FRESH.hold();
    try {
      // Книга — из всех томов объекта: секция 8 — это ЭОМ8 и ЭГ8 вместе.
      const r = await fetch("/api/sites/" + enc(st.siteId) + "/pto/pdf/all/" + enc(what),
        { headers: { Authorization: "Bearer " + AUTH.token() } });
      if (!r.ok) {
        let msg = "Не удалось собрать PDF";
        try { msg = (await r.json()).error || msg; } catch (e) { /* не json */ }
        throw new Error(msg);
      }
      P.total = Number(r.headers.get("Content-Length")) || 0;
      paintPdf();
      const parts = [];
      const reader = r.body && r.body.getReader ? r.body.getReader() : null;
      if (reader) {
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          parts.push(value);
          P.got += value.length;
          tickPdf();
        }
      } else {
        parts.push(await r.blob());
      }
      const blob = new Blob(parts, { type: "application/pdf" });
      P.got = blob.size;
      const cd = r.headers.get("Content-Disposition") || "";
      const m = cd.match(/filename\*=UTF-8''([^;]+)/i);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = m ? decodeURIComponent(m[1]) : "проект.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
      P.done = true;
      paintPdf();
      setTimeout(() => {
        if (st.pdf !== P) return;
        st.pdf = null;
        paintPdf();
      }, 5000);
    } catch (e) {
      if (st.pdf === P) st.pdf = null;
      paintPdf();
      // Оборванная связь приходит от браузера по-английски.
      if (S === st) {
        note(e instanceof TypeError ? "Связь оборвалась, PDF не скачался — попробуйте ещё раз."
          : e.message, true);
      }
    } finally {
      // Файл уже у браузера, но обновление страницы следом за щелчком
      // могло бы оборвать его сохранение — отпускаем с запасом.
      setTimeout(() => FRESH.release(), 1500);
    }
  }

  /* Полоса скачивания живёт в S.pdf, а не в разметке: вид может
     перерисоваться посреди скачивания — раскрыли раздел, поправили лист, —
     и полоса обязана это пережить. Шаблоны рисуют её сами (pdfProgHtml),
     а пока файл едет, paintPdf() правит готовую на месте. */
  const MB = (n) => (n / 1048576).toFixed(1).replace(".", ",");
  const pdfBusy = () => !!(S && S.pdf && !S.pdf.done);

  function pdfLook(P) {
    const pct = P.done ? 100 : P.total ? Math.min(100, Math.floor(P.got / P.total * 100)) : 0;
    const wait = !P.done && !P.total;
    const text = P.done ? "✓ " + MB(P.got) + " МБ"
      : wait ? (P.got ? MB(P.got) + " МБ" : "собираю")
      : P.what === "all" ? `${pct}% · ${MB(P.got)} из ${MB(P.total)} МБ` : pct + "%";
    const tip = P.done ? "Скачано — файл в «Загрузках»"
      : wait ? (P.got ? `Скачано ${MB(P.got)} МБ` : "Сервер собирает PDF")
      : `Скачано ${MB(P.got)} из ${MB(P.total)} МБ`;
    return { pct, wait, text, tip };
  }

  function pdfProgHtml(what) {
    const P = S && S.pdf;
    if (!P || P.what !== what) return "";
    const L = pdfLook(P);
    return `<span class="pto-pdf-prog${P.done ? " done" : ""}${L.wait ? " wait" : ""}"
      data-prog="${esc(what)}" role="progressbar" aria-valuemin="0" aria-valuemax="100"
      aria-valuenow="${L.pct}" title="${esc(L.tip)}"><span class="pto-pdf-bar"><i
      style="width:${L.pct}%"></i></span><b>${esc(L.text)}</b></span>`;
  }

  function paintPdf() {
    if (!host) return;
    const P = S && S.pdf;
    host.querySelectorAll("[data-pdf]").forEach((b) => { b.disabled = pdfBusy(); });
    host.querySelectorAll("[data-prog]").forEach((el) => {
      if (!P || el.dataset.prog !== P.what) el.remove();
    });
    if (!P) return;
    const el = [...host.querySelectorAll("[data-prog]")].find((x) => x.dataset.prog === P.what);
    if (!el) {
      // Полосы ещё нет — встаёт у своей кнопки: у книги всего проекта
      // слева, чтобы не толкать соседнюю «В Excel», у секции — справа.
      const btn = [...host.querySelectorAll("[data-pdf]")].find((b) => b.dataset.pdf === P.what);
      if (btn) btn.insertAdjacentHTML(P.what === "all" ? "beforebegin" : "afterend", pdfProgHtml(P.what));
      return;
    }
    const L = pdfLook(P);
    el.classList.toggle("done", P.done);
    el.classList.toggle("wait", L.wait);
    el.title = L.tip;
    el.setAttribute("aria-valuenow", L.pct);
    el.querySelector("i").style.width = L.pct + "%";
    el.querySelector("b").textContent = L.text;
  }

  /* Кусков у файла сотни, а перерисовать полосу есть смысл раз в кадр. */
  let pdfFrame = 0;
  function tickPdf() {
    if (pdfFrame) return;
    pdfFrame = requestAnimationFrame(() => {
      pdfFrame = 0;
      paintPdf();
    });
  }

  function wirePdf(box) {
    box.querySelectorAll("[data-pdf]").forEach((b) => b.addEventListener("click", (e) => {
      e.preventDefault();
      // Кнопка секции стоит в шапке сетки: щелчок по ней — только книга.
      e.stopPropagation();
      downloadPdf(b.dataset.pdf);
    }));
  }

  /* Прокрутка вида живёт в S, а не в разметке. Вид перерисовывается
     целиком — раскрыли раздел, поправили лист, добавили строку, — и
     #ptoMain каждый раз рождается заново, с прокруткой в самом верху:
     раскрыл «Принципиальные схемы» внизу списка — и тебя бросило к началу.
     Запоминаем, где человек был, и возвращаем его туда же. */
  function holdScroll(box, key) {
    const main = $p("#ptoMain", box);
    if (!main) return;
    const was = S.scroll && S.scroll[key];
    if (was) {
      main.scrollTop = was[0];
      main.scrollLeft = was[1];
    }
    main.addEventListener("scroll", () => {
      (S.scroll = S.scroll || {})[key] = [main.scrollTop, main.scrollLeft];
    }, { passive: true });
  }

  function noProject(what) {
    const d = S.data;
    if (!d.docs.length) {
      return `<div class="pg-empty"><b>Нужен PDF проекта</b>Загрузите проект — Трейс
        разберёт его: разложит листы по разделам, выпишет кабели с принципиальных схем в
        журнал и посчитает квартиры по этажным щитам. ${esc(what)}</div>`;
    }
    if (multi()) {
      return `<div class="pg-empty"><b>Проект ещё не разобран</b>Нажмите «Разобрать все»
        вверху: Трейс разберёт все ${d.docs.length} ${plural(d.docs.length, "том", "тома", "томов")}
        и сведёт их в один проект по секциям. ${esc(what)}</div>`;
    }
    return `<div class="pg-empty"><b>Проект ещё не разобран</b>Нажмите «Разобрать проект»
      вверху справа. ${esc(what)}</div>`;
  }

  /* ── 0. состав проекта ───────────────────────────────────── */
  const SEC_ORDER = (s) => {
    const m = String(s || "").match(/-?\d+/);
    return m ? Number(m[0]) : 999;
  };
  /* Ровно то же, что floor_key в deploy/pto_pdf.py. Технический этаж на
     отметке («тех. отм. -2.160», ЖК «Лесный») — по отметке, между −1 и 1;
     техпространство этажа («-1 тех.») — сразу за своим этажом. */
  const FLOOR_ORDER = (f) => {
    f = String(f || "");
    if (/техподполье|подвал/.test(f)) return -5;
    const e = f.match(/отм\.?\s*([+-]?\d+(?:[.,]\d+)?)/);
    if (e) return Number(e[1].replace(",", ".")) / 3;
    const n = f.match(/^-?\d+/);
    if (n) return Number(n[0]) + (/тех/.test(f) ? 0.5 : 0);
    if (/тех/.test(f)) return 500;
    if (/выход на кровлю/.test(f)) return 590;
    if (/кровл/.test(f)) return 600;
    if (/фасад/.test(f)) return 700;
    const m = f.match(/-?\d+/);
    return m ? Number(m[0]) : 800;
  };

  function sheetsView(box) {
    const d = S.data;
    // Все тома объекта разом (06.10.2026), отбор — «весь объект / секция /
    // том». У объекта из одного тома это просто его листы.
    const every = d.sheets;
    if (!every.length) {
      box.innerHTML = noProject("Здесь будет состав проекта: где какие схемы и планы.");
      return;
    }
    const all = every.filter(inScope);
    const q = F.q.trim().toLowerCase();
    const pass = (s) => !q || (s.title + " " + s.no + " " + s.section + " " + s.floor + " "
      + ((d.docs.find((x) => x.id === s.doc_id) || {}).filename || "")).toLowerCase().includes(q);
    const rows = all.filter(pass);
    const files = d.docs.filter((doc) => !SCOPE || !SCOPE.startsWith("d:") || SCOPE === "d:" + doc.id)
      .map((doc) => [doc, rows.filter((s) => s.doc_id === doc.id)])
      .filter(([, list]) => list.length || (!q && !SCOPE));
    const openByDefault = (key) => key.startsWith("doc:") && key.split(":").length === 2 ? !multi()
      : key.endsWith(":general") || key.endsWith(":scheme");
    box.innerHTML = `
      <div class="pto-tools">
        <label class="pg-find">${ICO.find}<input id="ptoSheetQ" placeholder="Лист, щит, этаж"
          value="${esc(F.q)}"></label>
        ${scopeHtml("ptoSheetSec")}
        <span class="sit-hint">${rows.length === every.length ? `${every.length} ${plural(every.length,
          "лист", "листа", "листов")}` : `${rows.length} из ${every.length}`}</span>
        <span class="grow"></span>
        ${pdfProgHtml("all")}<button type="button" class="btn-ghost sm" data-pdf="all"${pdfBusy() ? " disabled" : ""}
          title="${multi() ? "Все тома одной книгой: общие тома, потом секция 1, 2, … — файл для мастеров"
            : "Все листы по порядку: общие данные, схемы, секция 1, 2, … — файл для мастеров"}"
          >${ICO.down}Весь проект PDF</button>
        <button type="button" class="btn-ghost sm" data-xlsx="sheets">${ICO.down}В Excel</button>
      </div>
      <div class="pto-main" id="ptoMain">
        ${files.map(([doc, sheets]) => {
          const fileKey = "doc:" + doc.id;
          const fileOpen = q || SCOPE ? true : (F.open[fileKey] ?? openByDefault(fileKey));
          const groups = d.groups.map((g) => [g, sheets.filter((s) => s.group === g.id)])
            .filter(([, list]) => list.length);
          return `<section class="pto-grp pto-file-group${fileOpen ? " open" : ""}" data-grp="${esc(fileKey)}">
            <button type="button" class="pto-grp-h pto-file-h" data-toggle="${esc(fileKey)}"
              aria-expanded="${!!fileOpen}">${ICO.chev}<b title="${esc(doc.filename)}">${esc(doc.filename)}</b>
              <i>${sheets.length} ${plural(sheets.length, "лист", "листа", "листов")}</i></button>
            ${fileOpen ? (groups.map(([g, list]) => {
              const key = fileKey + ":" + g.id;
              const open = q || SCOPE ? true : (F.open[key] ?? openByDefault(key));
              return `<section class="pto-grp pto-file-inner${open ? " open" : ""}" data-grp="${esc(key)}">
                <button type="button" class="pto-grp-h" data-toggle="${esc(key)}"
                  aria-expanded="${!!open}">${ICO.chev}<b>${esc(g.name)}</b><i>${list.length}</i></button>
                ${open ? `<table class="tbl pto-sheets" style="--tbl-min:920px">
                  <colgroup><col style="width:84px"><col><col style="width:99px">
                    <col style="width:99px"><col style="width:225px"><col style="width:63px">
                    <col style="width:83px"></colgroup>
                  <thead><tr><th>Лист</th><th>Наименование</th><th>Секция</th><th>Этаж</th>
                    <th>Раздел</th><th class="num">Стр.</th><th></th></tr></thead>
                  <tbody>${list.map((s) => sheetRow(s, d.groups)).join("")}</tbody>
                </table>` : ""}</section>`;
            }).join("") || `<div class="pto-hint">Файл ещё не разобран</div>`) : ""}</section>`;
        }).join("") || `<div class="pg-empty"><b>Ничего не нашлось</b>Снимите отбор или
          поищите другим словом.</div>`}
        ${plansMatrix(all)}
      </div>`;
    holdScroll(box, "sheets:" + SCOPE);
    const qi = $p("#ptoSheetQ", box);
    qi.addEventListener("input", () => {
      F.q = qi.value;
      const pos = qi.selectionStart;
      sheetsView(box);
      const again = $p("#ptoSheetQ", box);
      again.focus();
      again.setSelectionRange(pos, pos);
    });
    const sc = $p("#ptoSheetSec", box);
    if (sc) sc.addEventListener("change", (e) => { SCOPE = e.target.value; sheetsView(box); });
    box.querySelectorAll("[data-toggle]").forEach((b) => b.addEventListener("click", () => {
      const k = b.dataset.toggle;
      const was = k === "matrix" ? F.open.matrix !== false : (F.open[k] ?? openByDefault(k));
      F.open[k] = !was;
      sheetsView(box);
      if (!was) reveal(box, k);
    }));
    box.querySelectorAll("[data-page]").forEach((b) => b.addEventListener("click", (e) => {
      e.preventDefault();
      openPage(b.dataset.doc || S.doc, b.dataset.page, b);
    }));
    box.querySelector("[data-xlsx]").addEventListener("click", (e) =>
      download("sheets", e.currentTarget));
    wirePdf(box);
    if (ctx.can) wireSheetEdits(box);
  }

  /* Раскрытый внизу экрана раздел поднимаем, чтобы список было видно:
     ровно настолько, насколько он не влез, и не выше собственного
     заголовка — тот остаётся перед глазами, на него только что нажали. */
  function reveal(box, key) {
    const main = $p("#ptoMain", box);
    const sec = main && [...main.querySelectorAll("[data-grp]")].find((x) => x.dataset.grp === key);
    if (!sec) return;
    const m = main.getBoundingClientRect();
    const r = sec.getBoundingClientRect();
    const need = Math.min(r.bottom - m.bottom, r.top - m.top);
    if (need <= 0) return;
    const calm = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    main.scrollBy({ top: need, behavior: calm ? "auto" : "smooth" });
  }

  function sheetRow(s, groups) {
    const ed = ctx.can;
    const inp = (k, v, ph) => ed ? `<input class="pos-in" data-sf="${k}" value="${esc(v)}"
      placeholder="${ph || ""}">` : esc(v);
    return `<tr data-sid="${esc(s.id)}"${s.edited ? ' class="pto-edited"' : ""}>
      <td class="pto-no" title="${esc(s.no)}">${esc(s.no) || "—"}</td>
      <td>${ed ? `<input class="pos-in" data-sf="title" value="${esc(s.title)}">`
        : `<span class="t-name">${esc(s.title)}</span>`}${s.text ? "" : `<i class="pto-blind"
        title="В листе нет текстового слоя: надписи нарисованы линиями, прочитать их нельзя">без текста</i>`}</td>
      <td>${inp("section", s.section)}</td>
      <td>${inp("floor", s.floor)}</td>
      <td>${ed ? `<select class="pto-sel" data-sf="group">${groups.map((g) => `<option value="${
        g.id}"${g.id === s.group ? " selected" : ""}>${esc(g.name)}</option>`).join("")}</select>`
        : esc((groups.find((g) => g.id === s.group) || {}).name)}</td>
      <td class="num">${s.page}</td>
      <td><button type="button" class="lnk pto-open" data-page="${s.page}" data-doc="${esc(s.doc_id)}"
        title="Открыть лист в новой вкладке">${ICO.open}Открыть</button></td>
    </tr>`;
  }

  function wireSheetEdits(box) {
    box.querySelectorAll("[data-sf]").forEach((el) => {
      el.dataset.last = el.value;
      el.addEventListener("change", async () => {
        if (el.value === el.dataset.last) return;
        const tr = el.closest("tr");
        const key = el.dataset.sf;
        try {
          const upd = await AUTH.api("PATCH", "/pto/sheets/" + tr.dataset.sid, { [key]: el.value });
          el.dataset.last = el.value;
          const i = S.data.sheets.findIndex((x) => x.id === upd.id);
          if (i >= 0) S.data.sheets[i] = upd;
          tr.classList.add("pto-edited");
          el.classList.remove("bad");
          if (key === "group" || key === "section" || key === "floor") sheetsView(box);
        } catch (e) {
          el.classList.add("bad");
          el.title = e.message;
        }
      });
      if (el.tagName === "INPUT") {
        el.addEventListener("keydown", (e) => { if (e.key === "Enter") el.blur(); });
      }
    });
  }

  /* Планы — сеткой «этаж × секция»: так их и ищут («что на 4-м этаже
     второй секции»), а не листая сотню строк подряд. */
  function plansMatrix(all) {
    const plans = all.filter((s) => /^plan_/.test(s.group) && s.floor);
    if (plans.length < 6) return "";
    const secs = new Set();
    const cells = {};
    for (const s of plans) {
      const list = expandSections(s.section);
      for (const sec of list.length ? list : ["—"]) {
        secs.add(sec);
        const key = s.floor + "|" + sec;
        (cells[key] = cells[key] || []).push(s);
      }
    }
    const secList = [...secs].sort((a, b) => SEC_ORDER(a) - SEC_ORDER(b));
    const floors = [...new Set(plans.map((s) => s.floor))]
      .sort((a, b) => FLOOR_ORDER(a) - FLOOR_ORDER(b) || a.localeCompare(b, "ru", { numeric: true }));
    const chip = (s) => {
      const t = s.title.toLowerCase();
      // У МОП бывают и розетки, и свет на разных листах (большой квартал):
      // одинаковые «МОП МОП» не различить, поэтому вид — рядом.
      const power = /розет|силов|электрооборуд/.test(t);
      const light = /освещ/.test(t);
      const label = /мop|моп/.test(t) ? "МОП" + (power && !light ? " розетки" : light && !power ? " свет" : "")
        : /розет/.test(t) ? "Розетки"
        : /освещ/.test(t) ? "Свет" : /силов/.test(t) ? "Силовые"
        : /кабельн/.test(t) ? "Лотки" : "План";
      const vol = multi() && docPart(s.doc_id) ? docPart(s.doc_id) + ", лист" : "Лист";
      return `<button type="button" class="pto-chip pto-chip-${s.group}" data-page="${s.page}"
        data-doc="${esc(s.doc_id)}" title="${esc(vol)} ${esc(s.no)}: ${esc(s.title)} — стр. ${s.page}">${label}</button>`;
    };
    // Шапка столбца: «Секция 3» и кнопка книги по этой секции. Секцию
    // печатают целиком — розетки, свет и МОП всех этажей подряд, — и
    // собирают её именно отсюда, из столбца, который перед глазами.
    // Книга всего проекта одна — на панели сверху, рядом с «В Excel».
    const secHead = (s) => s === "—" ? "Без секции"
      : `${esc(sectionLabel(s))} <button type="button" class="pto-sec-pdf" data-pdf="${esc(s)}"${
        pdfBusy() ? " disabled" : ""}
        title="Собрать листы секции ${esc(s)} по этажам: розетки, свет, МОП">PDF</button>${pdfProgHtml(s)}`;
    const open = F.open.matrix !== false;
    return `
      <section class="pto-grp${open ? " open" : ""}" data-grp="matrix">
        <button type="button" class="pto-grp-h" data-toggle="matrix">${ICO.chev}
          <b>Планы по этажам и секциям</b><i>${plans.length}</i></button>
        ${open ? `<div class="pto-matrix-wrap"><table class="pto-matrix">
          <thead><tr><th>Этаж</th>${secList.map((s) => `<th>${secHead(s)}</th>`).join("")}</tr></thead>
          <tbody>${floors.map((f) => `<tr><th>${esc(f)}</th>${secList.map((s) =>
            `<td>${(cells[f + "|" + s] || []).map(chip).join("")}</td>`).join("")}</tr>`).join("")}</tbody>
        </table></div>` : ""}
      </section>`;
  }

  function expandSections(sec) {
    const s = String(sec || "");
    const m = s.match(/^(\d+)-(\d+)$/);
    if (m) {
      const out = [];
      for (let i = Number(m[1]); i <= Number(m[2]); i++) out.push(String(i));
      return out;
    }
    return s.split(/,\s*/).filter(Boolean);
  }

  /* ── формы: сохранение ───────────────────────────────────── */
  function saved(kind) {
    const f = S.data.forms[kind];
    const el = host && $p("#ptoSaved", host);
    if (!el) return;
    if (S.pending[kind] || S.saving[kind]) {
      el.textContent = "Сохраняю…";
      el.classList.remove("bad");
    } else if (S.saveError && S.saveError[kind]) {
      el.textContent = S.saveError[kind];
      el.classList.add("bad");
    } else {
      el.textContent = f.at ? `Сохранено ${hhmm(f.at)}${f.author ? ", " + f.author : ""}` : "";
      el.classList.remove("bad");
    }
    const meta = kind === "card" && host && $p("#cardMeta", host);
    if (meta) meta.innerHTML = cardMeta();
  }

  function touch(kind) {
    S.pending[kind] = true;
    saved(kind);
    clearTimeout(S.timer[kind]);
    S.timer[kind] = setTimeout(() => flush(kind), 600);
  }

  async function flush(kind) {
    clearTimeout(S.timer[kind]);
    if (S.saving[kind]) {
      S.again[kind] = true;
      return S.saving[kind];
    }
    const siteId = S.siteId;
    const f = S.data.forms[kind];
    S.pending[kind] = false;
    S.saveError = S.saveError || {};
    S.saving[kind] = (async () => {
      try {
        const r = await AUTH.api("PUT", "/sites/" + enc(siteId) + "/pto/forms/" + kind,
          { data: f.data, at: f.at });
        f.at = r.at;
        f.author = r.author;
        S.saveError[kind] = "";
      } catch (e) {
        S.saveError[kind] = "Не сохранилось: " + e.message;
      }
    })();
    await S.saving[kind];
    S.saving[kind] = null;
    if (S.siteId !== siteId) return;
    if (S.again[kind]) {
      S.again[kind] = false;
      return flush(kind);
    }
    saved(kind);
  }

  /* ── 1. чек-лист объекта ─────────────────────────────────── */
  function clData() {
    const d = S.data.forms.checklist.data;
    if (!Array.isArray(d.sections)) {
      // Секции — те, что нашлись в проекте (у демо ЖК 3.1 это 1, 6, 8), а
      // не «1…N» по их числу: иначе лишние «Секция 2, 3» в чек-листе и карточке.
      const keys = Object.keys(S.data.facts.sections || {}).sort((a, b) => SEC_ORDER(a) - SEC_ORDER(b));
      d.sections = keys.length ? keys : ["1"];
    }
    d.rows = d.rows || {};
    d.parking = d.parking || {};
    d.auto = d.auto || {};
    return d;
  }

  /* Итоги считаем теми же правилами, что и сервер (deploy/pto_book.py,
     checklist_totals): экран и книга не должны расходиться. */
  const CL_AREA_PARTS = ["area_flats", "area_rooms", "area_stores"];
  const round2 = (n) => Math.round(n * 100) / 100;
  const clRow = (key) => S.data.schema.checklist.find((r) => r.key === key) || {};

  /* Вычисляемая строка считается, когда вписано хоть одно слагаемое:
     пока площадей по типам нет, «Общая площадь квартир» остаётся
     вписанной руками — у старых объектов там уже стоит число. */
  const clCalcOn = (d, key, s) => (clRow(key).calc || [])
    .some((p) => numOf((d.rows[p] || {})[s]) !== null);

  function clCell(d, key, s) {
    if (clCalcOn(d, key, s)) {
      return round2(clRow(key).calc.reduce((a, p) => a + (numOf((d.rows[p] || {})[s]) || 0), 0));
    }
    return numOf((d.rows[key] || {})[s]);
  }

  function clArea(d, s) {
    const parts = CL_AREA_PARTS.map((k) => clCell(d, k, s));
    if (parts.every((v) => v === null)) return null;
    return round2(parts.reduce((a, v) => a + (v || 0), 0));
  }

  function clTotals(d) {
    const schema = S.data.schema.checklist;
    const keys = schema.filter((r) => r.type !== "text").map((r) => [r.key, r.type])
      .concat(schema.filter((r) => r.area).map((r) => [r.area, "num"]));
    const out = {};
    for (const [key, type] of keys) {
      const per = {};
      for (const s of d.sections) {
        const v = type === "sum" ? clArea(d, s) : clCell(d, key, s);
        if (v !== null) per[s] = v;
      }
      const vals = Object.values(per);
      out[key] = { per, total: vals.length ? round2(vals.reduce((a, x) => a + x, 0)) : null };
    }
    return out;
  }

  /* Поле клетки. Ключ в data-cl: и количество, и площадь по типу правит
     один обработчик, и автозаполнение однажды ляжет в те же клетки. */
  function clInput(d, key, s, kind, ph) {
    const v = (d.rows[key] || {})[s] ?? "";
    return `<input class="pos-in${kind === "text" ? "" : " num"}" data-cl="${key}"
      data-sec="${esc(s)}" value="${esc(v)}"${kind === "text" ? "" : ' inputmode="decimal"'}${
      ph ? ` placeholder="${ph}"` : ""}>`;
  }

  /* Клетка вычисляемой строки: сумма — когда есть из чего складывать,
     поле — пока не из чего. */
  function clCalcInner(d, r, s, ed, t) {
    if (clCalcOn(d, r.key, s)) {
      const v = ((t[r.key] || {}).per || {})[s];
      return v === undefined ? "" : fmt(v);
    }
    return ed ? clInput(d, r.key, s, r.type) : esc((d.rows[r.key] || {})[s] ?? "");
  }
  const CL_CALC_TIP = "Сумма площадей по типам квартир — впишете их, и она встанет сюда сама."
    + " Пока по типам пусто, общую площадь вписывают руками";

  /* Площадь паркинга — у итога: в «Итого общую площадь» она не входит (у
     заказчика паркинг отдельным блоком), но спрашивают её вместе со
     всеми площадями, а блок паркинга — в конце страницы. */
  function clParkLine(d) {
    const v = numOf(d.parking.area);
    return v === null ? ""
      : `Площадь паркинга: ${fmt(v)} м² — отдельно, в «Итого общую площадь» не входит`;
  }

  /* Кладовые нашлись на планах, но на весь дом: по секциям их не
     разложить, и вписать их надо руками — говорим об этом прямо. */
  function clStoresText() {
    const st = S.data.facts.stores || {};
    if (!st.total || Object.keys(st.by_section || {}).length) return "";
    return `По планам −1 этажа кладовых: ${st.total} (на весь дом, по секциям на плане`
      + " не разложены — впишите руками)";
  }

  function checklistView(box) {
    const d = clData();
    const schema = S.data.schema.checklist;
    const facts = S.data.facts.sections || {};
    const hasFacts = Object.keys(facts).length > 0;
    // Кладовые по секциям — тоже повод показать «Заполнить из проекта»:
    // планы −1 этажа разбираются и без схемы ВРУ.
    const canFill = hasFacts
      || Object.keys((S.data.facts.stores || {}).by_section || {}).length > 0;
    const t = clTotals(d);
    const ed = ctx.can;
    const cell = (r, s) => {
      if (r.type === "sum") {
        const v = t[r.key].per[s];
        return `<td class="num pto-calc" data-per="${r.key}:${esc(s)}">${v === undefined ? "" : fmt(v)}</td>`;
      }
      if ((r.calc || []).length) {
        const on = clCalcOn(d, r.key, s);
        return `<td class="num${on ? " pto-calc" : ""}" data-calc="${r.key}:${esc(s)}"
          data-mode="${on ? "calc" : "in"}" title="${CL_CALC_TIP}">${clCalcInner(d, r, s, ed, t)}</td>`;
      }
      const v = (d.rows[r.key] || {})[s] ?? "";
      const auto = d.auto[r.key + ":" + s] || (r.area && d.auto[r.area + ":" + s]);
      const tip = !auto ? "" : ` title="Из проекта: ${r.key === "stores"
        ? "подписи «Кладовая» на планах −1 этажа" : "этажные щиты на схеме ВРУ"}. Поправьте, если не так"`;
      const cls = `${r.type === "text" ? "" : "num"}${auto ? " pto-auto" : ""}`;
      // Тип квартир — два поля в клетке: у студии и у трёшки площади
      // разные, а спрашивают их вместе с количеством.
      if (r.area) {
        const area = (d.rows[r.area] || {})[s] ?? "";
        return `<td class="${cls}"${tip}><span class="pto-two">${ed
          ? clInput(d, r.key, s, "int", "шт") + clInput(d, r.area, s, "num", "м²")
          : `<span>${esc(v)}</span><span class="pto-sub">${esc(area)}</span>`}</span></td>`;
      }
      if (!ed) return `<td class="${cls}"${tip}>${esc(v)}</td>`;
      return r.key === "comment"
        ? `<td class="${auto ? "pto-auto" : ""}"${tip}><textarea class="pos-in pto-ta" rows="${Math.max(1,
            String(v).split("\n").length)}" data-cl="${r.key}" data-sec="${esc(s)}">${esc(v)}</textarea></td>`
        : `<td class="${cls}"${tip}>${clInput(d, r.key, s, r.type)}</td>`;
    };
    const total = (r) => {
      if (r.type === "text") return "<td></td>";
      const one = (k, cls) => `<span${cls ? ` class="${cls}"` : ""} data-tot="${k}">${
        fmt((t[k] || {}).total)}</span>`;
      return `<td class="num pto-calc">${r.area
        ? `<span class="pto-two">${one(r.key)}${one(r.area, "pto-sub")}</span>` : one(r.key)}</td>`;
    };
    box.innerHTML = `
      <div class="pto-tools">
        ${ed && canFill ? `<button type="button" class="btn-brand sm" id="clFill"
          title="Этажи, квартиры и их типы — по экспликациям помещений на планах или по этажным щитам на схемах, кладовые — по подписям на планах −1 этажа. Вписанное руками не трогаем">${
          ICO.fill}Заполнить из проекта</button>` : ""}
        ${ed ? `<button type="button" class="btn-ghost sm" id="clAdd">+ Секция</button>
          ${d.sections.length > 1 ? `<button type="button" class="btn-ghost sm" id="clDel"
            title="Убрать последнюю секцию вместе с её числами">− Секция</button>` : ""}` : ""}
        <span class="sit-hint pto-saved" id="ptoSaved"></span>
        <span class="grow"></span>
        <button type="button" class="btn-ghost sm" data-xlsx="checklist">${ICO.down}В Excel</button>
      </div>
      <div class="pto-main" id="ptoMain">
        <div class="pto-hint">${!hasFacts ? `Квартиры и этажи можно заполнить из проекта: разберите
          PDF — Трейс посчитает этажные щиты на схеме ВРУ или квартиры по экспликациям помещений
          на планах. ` : ""}${Object.values(facts).some((f) => f.k1 || f.k2 || f.studio || f.k3)
          ? "Типы квартир и площади — по экспликациям помещений: тип по числу жилых комнат, кухня-ниша —"
            + " студия. Проверьте. "
          : "Типы квартир и площади в ЭОМ обычно не указаны — их вписывают руками: с сайта застройщика или"
            + " из архитектурного раздела. "}В клетке площади можно писать выражением: «12*38,5» — двенадцать
          квартир по 38,5 м², «12*38,5+3*41» — и ещё три по 41.</div>
        <table class="tbl pto-cl" style="--tbl-min:${340 + d.sections.length * 110}px">
          <colgroup><col style="width:288px">${d.sections.map(() => '<col style="width:106px">').join("")}
            <col style="width:106px"></colgroup>
          <thead><tr><th>Жилой дом / Секция / №</th>${d.sections.map((s) => `<th class="num">Секция ${esc(s)}</th>`).join("")}
            <th class="num">Итого</th></tr></thead>
          <tbody>${schema.map((r) => `<tr class="${r.hl ? "pto-hl" : ""}">
            <td class="pto-lbl">${esc(r.label)}${r.area ? ' <i class="pto-sub">шт / м²</i>' : ""}</td>
            ${d.sections.map((s) => cell(r, s)).join("")}
            ${total(r)}
          </tr>`).join("")}</tbody>
        </table>
        <div class="pto-parea" id="clParea">${esc(clParkLine(d))}</div>
        ${clStoresText() ? `<div class="pto-hint">${esc(clStoresText())}.</div>` : ""}
        <div id="clWarn">${clWarnings(d)}</div>
        <h4 class="pto-h4">Паркинг</h4>
        <table class="tbl pto-cl pto-park">
          <colgroup><col style="width:288px"><col style="width:144px"></colgroup>
          <tbody>${S.data.schema.parking.map((r) => `<tr><td class="pto-lbl">${esc(r.label)}</td>
            <td>${ed ? `<input class="pos-in num" data-park="${r.key}" value="${esc(d.parking[r.key] ?? "")}">`
              : esc(d.parking[r.key] ?? "")}</td></tr>`).join("")}</tbody>
        </table>
      </div>`;
    holdScroll(box, "checklist");
    saved("checklist");
    box.querySelector("[data-xlsx]").addEventListener("click", (e) =>
      download("checklist", e.currentTarget));
    if (!ed) return;
    box.querySelectorAll("textarea[data-cl]").forEach(autosize);
    // Правку слушаем на всей таблице, а не на каждом поле: клетку «Общая
    // площадь квартир» пересчёт перерисовывает — вписали площади по типам,
    // и поле в ней сменилось суммой, — а делегированию новое поле само
    // достанется. Слушаем #ptoMain: он рождается заново при каждой
    // перерисовке, и слушатели не копятся.
    $p("#ptoMain", box).addEventListener("input", (e) => {
      const el = e.target.closest("[data-cl], [data-park]");
      if (!el) return;
      if (el.dataset.park !== undefined) {
        d.parking[el.dataset.park] = el.value;
        const line = $p("#clParea", box);
        if (line) line.textContent = clParkLine(d);
        touch("checklist");
        return;
      }
      if (el.tagName === "TEXTAREA") autosize(el);
      const k = el.dataset.cl, s = el.dataset.sec;
      (d.rows[k] = d.rows[k] || {})[s] = el.value;
      delete d.auto[k + ":" + s];
      // В клетке типа квартир два поля: подсветку «из проекта» снимаем,
      // только когда руками поправили оба.
      const td = el.closest("td");
      if (![...td.querySelectorAll("[data-cl]")].some((x) => d.auto[x.dataset.cl + ":" + s])) {
        td.classList.remove("pto-auto");
      }
      touch("checklist");
      clRefreshTotals(box);
    });
    const fill = $p("#clFill", box);
    if (fill) fill.addEventListener("click", () => fillChecklist(box));
    $p("#clAdd", box).addEventListener("click", () => {
      const next = Math.max(0, ...d.sections.map(Number).filter((x) => !isNaN(x))) + 1;
      d.sections.push(String(next));
      touch("checklist");
      checklistView(box);
    });
    const del = $p("#clDel", box);
    if (del) {
      del.addEventListener("click", async () => {
        const s = d.sections[d.sections.length - 1];
        const has = Object.values(d.rows).some((r) => r && r[s] !== undefined && r[s] !== "");
        if (has && !(await ASK.confirm(`Убрать секцию ${s}? Её числа в чек-листе пропадут.`))) return;
        d.sections.pop();
        for (const r of Object.values(d.rows)) if (r) delete r[s];
        touch("checklist");
        checklistView(box);
      });
    }
  }

  /* Сверка чек-листа: квартир в секции столько же, сколько по типам;
     столько же, сколько этажных щитов насчитал проект; и общая площадь
     квартир, вписанная руками, сходится с площадями по типам. */
  function clWarnings(d) {
    const facts = S.data.facts.sections || {};
    const types = S.data.schema.checklist.filter((r) => r.area);
    const warn = [];
    for (const s of d.sections) {
      const flats = numOf((d.rows.flats || {})[s]);
      const counts = types.map((r) => numOf((d.rows[r.key] || {})[s])).filter((x) => x !== null);
      if (flats !== null && counts.length) {
        const sum = counts.reduce((a, x) => a + x, 0);
        if (sum !== flats) warn.push(`Секция ${esc(s)}: квартир ${fmt(flats)}, а по типам ${fmt(sum)}`);
      }
      const f = facts[s];
      if (f && flats !== null && f.flats !== flats) {
        warn.push(`Секция ${esc(s)}: по этажным щитам проекта квартир ${f.flats} (${esc(f.comment)})`);
      }
      // Площадь квартир вписана руками, а потом появились площади по
      // типам: в чек-лист пойдёт сумма по типам — скажем, чем они
      // разошлись, чтобы человек решил, где ошибка.
      const byHand = numOf((d.rows.area_flats || {})[s]);
      const byType = clCalcOn(d, "area_flats", s) ? clCell(d, "area_flats", s) : null;
      if (byHand !== null && byType !== null && Math.abs(byHand - byType) > 0.01) {
        warn.push(`Секция ${esc(s)}: площадь квартир вписана руками ${fmt(byHand)}, `
          + `а по типам ${fmt(byType)} — в чек-лист идёт сумма по типам`);
      }
    }
    return warn.length ? `<div class="pto-warn">${warn.map((w) => `<div>${w}</div>`).join("")}</div>` : "";
  }

  /* Итого пересчитываются на месте, без перерисовки таблицы: курсор
     остаётся в поле, где печатают. Клетки ищем по меткам, а не по номеру
     строки: строк у типов квартир теперь по два поля, и счёт по порядку
     разъехался бы при первой же новой строке. */
  function clRefreshTotals(box) {
    const d = clData();
    const w = $p("#clWarn", box);
    if (w) w.innerHTML = clWarnings(d);
    const t = clTotals(d);
    const ed = ctx.can;
    const cut = (v) => [v.slice(0, v.indexOf(":")), v.slice(v.indexOf(":") + 1)];
    box.querySelectorAll("[data-tot]").forEach((el) => {
      el.textContent = fmt((t[el.dataset.tot] || {}).total);
    });
    box.querySelectorAll("[data-per]").forEach((el) => {
      const [k, s] = cut(el.dataset.per);
      const v = ((t[k] || {}).per || {})[s];
      el.textContent = v === undefined ? "" : fmt(v);
    });
    box.querySelectorAll("[data-calc]").forEach((td) => {
      const [k, s] = cut(td.dataset.calc);
      const r = clRow(k);
      const mode = clCalcOn(d, k, s) ? "calc" : "in";
      if (td.dataset.mode === mode) {
        // Поле руками пересобирать нельзя: в нём печатают.
        if (mode === "calc") td.innerHTML = clCalcInner(d, r, s, ed, t);
        return;
      }
      td.dataset.mode = mode;
      td.classList.toggle("pto-calc", mode === "calc");
      td.innerHTML = clCalcInner(d, r, s, ed, t);
    });
  }

  function fillChecklist(box) {
    const d = clData();
    const facts = S.data.facts.sections || {};
    const stores = S.data.facts.stores || {};
    const bySec = stores.by_section || {};
    // Что проект знает про секцию. Кладовые — по подписям «Кладовая» на
    // планах −1 этажа, остальное — по этажным щитам на схеме ВРУ.
    const vals = {};
    // Из экспликаций (06.10.2026) — ещё типы квартир с площадями и
    // встроенные помещения: всё, что там есть, ложится в свои строки.
    const KEYS = ["floors", "living", "flats", "per_floor", "comment", "studio", "k1", "k2", "k3", "k4",
      "d2", "d3", "d4", "area_studio", "area_k1", "area_k2", "area_k3", "area_k4", "area_d2", "area_d3",
      "area_d4", "rooms", "area_rooms", "stores", "area_stores"];
    for (const [s, f] of Object.entries(facts)) {
      vals[s] = {};
      for (const k of KEYS) if (f[k] !== undefined && f[k] !== null && f[k] !== "") vals[s][k] = f[k];
    }
    // Кладовые по подписям на планах — там, где экспликация их не назвала.
    for (const [s, n] of Object.entries(bySec)) {
      vals[s] = vals[s] || {};
      if (vals[s].stores === undefined) vals[s].stores = n;
    }
    const nums = Object.keys(vals).map(Number).filter((x) => !isNaN(x)).sort((a, b) => a - b);
    const max = Math.max(nums.length ? nums[nums.length - 1] : 0, d.sections.length);
    for (let i = 1; i <= max; i++) if (!d.sections.includes(String(i))) d.sections.push(String(i));
    for (const s of Object.keys(vals)) if (!d.sections.includes(s)) d.sections.push(s);
    d.sections.sort((a, b) => SEC_ORDER(a) - SEC_ORDER(b));
    // Дробное — с запятой, как пишут руками («38,5»): иначе «1384.63»
    // стояло бы рядом с итогом «8 185,61».
    const text = (v) => (typeof v === "number" && !Number.isInteger(v) ? String(v).replace(".", ",") : String(v));
    let filled = 0, kept = 0;
    for (const [s, part] of Object.entries(vals)) {
      for (const [k, v] of Object.entries(part)) {
        const row = d.rows[k] = d.rows[k] || {};
        const cur = row[s];
        if (cur === undefined || cur === "" || d.auto[k + ":" + s]) {
          if (String(cur ?? "") !== text(v)) filled++;
          row[s] = text(v);
          d.auto[k + ":" + s] = 1;
        } else if (String(cur) !== text(v)) {
          kept++;
        }
      }
    }
    // Площадь автостоянки — из экспликации общего тома.
    const park = (S.data.facts.parking || {}).area;
    if (park && (d.parking.area === undefined || d.parking.area === "" || d.auto["parking:area"])) {
      if (String(d.parking.area ?? "") !== text(park)) filled++;
      d.parking.area = text(park);
      d.auto["parking:area"] = 1;
    }
    touch("checklist");
    checklistView(box);
    const loose = clStoresText();
    note(`Из проекта заполнено клеток: ${filled}.` + (kept ? ` Ещё ${kept} ${plural(kept, "клетка",
      "клетки", "клеток")} уже вписаны руками и отличаются от проекта — оставил как есть.` : "")
      + (loose ? ` ${loose}.` : "")
      + (Object.values(facts).some((f) => f.k1 || f.k2 || f.studio || f.k3) ? ""
        : " Типы квартир и площади в ЭОМ не указаны — их впишите из архитектурного раздела."));
  }

  /* ── 2. карточка объекта ─────────────────────────────────── */
  function cardData() {
    const d = S.data.forms.card.data;
    d.general = d.general || {};
    d.sections = d.sections || {};
    d.auto = d.auto || {};
    return d;
  }

  /* Секции карточки — из чек-листа, из самой карточки и из проекта: у
     объекта, чей чек-лист ещё пуст (там по умолчанию одна секция), секции
     всё равно видны — большой квартал показывал «Секция 1» из восьми. */
  function cardSections() {
    const cl = clData().sections;
    const have = Object.keys(cardData().sections);
    return [...new Set([...cl, ...have, ...objSections(), ...Object.keys(S.data.facts.sections || {})])]
      .sort((a, b) => SEC_ORDER(a) - SEC_ORDER(b));
  }

  /* Шифр проекта по листам: один том — его шифр, много томов — общая
     часть и тома: «3.1/ЭИПР-ЕК (ЭОМ1–ЭОМ8, ЭОМ.А, ЭГ1–ЭГ8)». */
  function codeSummary() {
    const codes = [...new Set(S.data.sheets.map((x) => String(x.code || "").replace(/\.С$/, ""))
      .filter(Boolean))];
    if (codes.length <= 1) return codes[0] || "";
    const head = (c) => c.slice(0, c.lastIndexOf("-"));
    const pre = head(codes[0]);
    if (!pre || !codes.every((c) => head(c) === pre)) return codes.join(", ");
    const by = new Map();
    for (const c of codes) {
      const t = c.slice(pre.length + 1);
      const m = t.match(/^(.*?)(\d+)$/);
      const k = m ? m[1] : t;
      if (!by.has(k)) by.set(k, []);
      if (m) by.get(k).push(Number(m[2]));
    }
    const parts = [...by].map(([k, ns]) => {
      if (!ns.length) return k;
      ns.sort((a, b) => a - b);
      const run = ns.every((n, i) => !i || n === ns[i - 1] + 1);
      return run && ns.length > 2 ? `${k}${ns[0]}–${k}${ns[ns.length - 1]}` : ns.map((n) => k + n).join(", ");
    });
    return `${pre} (${parts.join(", ")})`;
  }
  const floorTxt = (f) => (/^-?\d/.test(f) ? `${f} этаж` : f);

  function cardView(box) {
    const d = cardData();
    // Данные объекта — сразу, без «Заполнить»: заводят их один раз, в объекте.
    // Видят все; сохраняет тот, кому можно править.
    const auto = cardSetter(d);
    siteIntoCard(d, auto);
    if (auto.n && ctx.can) touch("card");
    const secs = cardSections();
    if (cardTab !== "general" && !secs.includes(cardTab)) cardTab = "general";
    const scope = cardTab === "general" ? d.general : (d.sections[cardTab] = d.sections[cardTab] || {});
    const blocks = cardTab === "general" ? S.data.schema.card : S.data.schema.card_section;
    const f = S.data.forms.card;
    box.innerHTML = `
      <div class="pto-tools">
        <div class="seg">${[["general", "Общая"], ...secs.map((s) => [s, "Секция " + s])].map(([k, t]) =>
          `<button type="button" class="seg-b${cardTab === k ? " on" : ""}" data-ctab="${esc(k)}">${esc(t)}</button>`).join("")}</div>
        ${ctx.can ? `<button type="button" class="btn-brand sm" id="cardFill"
          title="Из объекта, чек-листа и разобранного проекта. Вписанное руками не трогаем">${ICO.fill}Заполнить</button>` : ""}
        <span class="sit-hint pto-saved" id="ptoSaved"></span>
        <span class="grow"></span>
        <button type="button" class="btn-ghost sm" data-xlsx="card">${ICO.down}В Excel</button>
      </div>
      <div class="pto-main pto-card" id="ptoMain">
        <div class="pto-card-head">
          <b>Карточка объекта · ${esc(S.data.site.name)} · ${cardTab === "general" ? "общая" : "секция " + esc(cardTab)}</b>
          <span id="cardMeta">${cardMeta()}</span>
          <p>Корректно и качественно изученный и просчитанный проект позволяет увидеть и
            предотвратить нехватку материалов и неточности расчётов.</p>
        </div>
        ${blocks.map((b) => blockHtml(b, scope, cardTab)).join("")}
      </div>`;
    holdScroll(box, "card:" + cardTab);
    saved("card");
    box.querySelectorAll("[data-ctab]").forEach((b) => b.addEventListener("click", () => {
      cardTab = b.dataset.ctab;
      cardView(box);
    }));
    box.querySelector("[data-xlsx]").addEventListener("click", (e) =>
      download("card", e.currentTarget));
    if (!ctx.can) return;
    $p("#cardFill", box).addEventListener("click", () => fillCard(box));
    box.querySelectorAll("[data-cf]").forEach((el) => {
      if (el.tagName === "TEXTAREA") autosize(el);
      el.addEventListener("input", () => {
        const [blk, key] = el.dataset.cf.split("|");
        (scope[blk] = scope[blk] && !Array.isArray(scope[blk]) ? scope[blk] : {})[key] = el.value;
        delete d.auto[cardTab + "|" + blk + "|" + key];
        el.closest(".pto-f").classList.remove("pto-auto");
        if (el.tagName === "TEXTAREA") autosize(el);
        touch("card");
      });
    });
    box.querySelectorAll("[data-ct]").forEach((el) => {
      if (el.tagName === "TEXTAREA") autosize(el);
      el.addEventListener("input", () => {
        const [blk, i, key] = el.dataset.ct.split("|");
        const list = tableRows(blocks.find((b) => b.id === blk), scope);
        list[Number(i)][key] = el.value;
        delete d.auto[cardTab + "|" + blk];
        if (el.tagName === "TEXTAREA") autosize(el);
        touch("card");
      });
    });
    box.querySelectorAll("[data-addrow]").forEach((b) => b.addEventListener("click", () => {
      const blk = blocks.find((x) => x.id === b.dataset.addrow);
      tableRows(blk, scope).push({});
      touch("card");
      cardView(box);
    }));
    box.querySelectorAll("[data-delrow]").forEach((b) => b.addEventListener("click", () => {
      const [blk, i] = b.dataset.delrow.split("|");
      tableRows(blocks.find((x) => x.id === blk), scope).splice(Number(i), 1);
      touch("card");
      cardView(box);
    }));
  }

  function cardMeta() {
    const f = S.data.forms.card;
    return f.at ? `Составлена ${esc(hhmm(f.at))}${f.author ? ", " + esc(f.author) : ""}` : "Ещё не заполнялась";
  }

  function autosize(el) {
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight + 2, 320) + "px";
  }

  /* Строки таблицы блока. У таблицы с заранее известными строками
     («Щиты ЭЛ», «Щиты СС») первая колонка — название строки, и порядок
     строк держим как в форме, даже если сохранённые данные старые. */
  function tableRows(b, scope) {
    let list = Array.isArray(scope[b.id]) ? scope[b.id] : [];
    if (b.rows && b.rows.length) {
      const first = b.cols[0].key;
      const by = {};
      for (const r of list) if (r && r[first]) by[r[first]] = r;
      const extra = list.filter((r) => r && !b.rows.includes(r[first]));
      list = b.rows.map((name) => Object.assign(by[name] || {}, { [first]: name })).concat(extra);
    }
    scope[b.id] = list;
    return list;
  }

  function blockHtml(b, scope, tabKey) {
    const d = cardData();
    const ed = ctx.can;
    if (b.fields) {
      const part = scope[b.id] && !Array.isArray(scope[b.id]) ? scope[b.id] : {};
      return `<section class="pto-blk"><h4>${esc(b.title)}</h4>
        ${b.fields.map((f) => {
          const v = part[f.key] ?? "";
          const auto = d.auto[tabKey + "|" + b.id + "|" + f.key];
          return `<label class="pto-f${auto ? " pto-auto" : ""}"${auto ? ' title="Заполнено из проекта или чек-листа — проверьте"' : ""}>
            <span>${esc(f.label)}</span>
            ${!ed ? `<div class="pto-ro">${esc(v) || "—"}</div>` : f.area
              ? `<textarea class="pos-in pto-ta" rows="2" data-cf="${b.id}|${f.key}">${esc(v)}</textarea>`
              : `<input class="pos-in" data-cf="${b.id}|${f.key}" value="${esc(v)}">`}
          </label>`;
        }).join("")}</section>`;
    }
    const rows = tableRows(b, scope);
    const fixed = b.rows && b.rows.length;
    const auto = d.auto[tabKey + "|" + b.id];
    return `<section class="pto-blk${auto ? " pto-auto-blk" : ""}"><h4>${esc(b.title)}${auto
        ? ' <i class="pto-tag">из проекта — проверьте</i>' : ""}</h4>
      <div class="pto-ctbl-wrap"><table class="pto-ctbl">
        <thead><tr>${b.cols.map((c) => `<th>${esc(c.label)}</th>`).join("")}${ed && !fixed ? "<th></th>" : ""}</tr></thead>
        <tbody>${rows.map((r, i) => `<tr>${b.cols.map((c, j) => {
          const v = r[c.key] ?? "";
          if (fixed && j === 0) return `<td class="pto-lbl">${esc(v)}</td>`;
          return `<td>${ed ? `<textarea class="pos-in pto-ta" rows="1" data-ct="${b.id}|${i}|${c.key}">${esc(v)}</textarea>`
            : esc(v)}</td>`;
        }).join("")}${ed && !fixed ? `<td class="pto-x"><button type="button" class="lnk warn"
          data-delrow="${b.id}|${i}" title="Убрать строку">×</button></td>` : ""}</tr>`).join("")
          || `<tr><td colspan="${b.cols.length + 1}" class="dim pto-empty-row">Пока пусто</td></tr>`}</tbody>
      </table></div>
      ${ed && !fixed ? `<button type="button" class="lnk pto-addrow" data-addrow="${b.id}">+ строка</button>` : ""}
    </section>`;
  }

  /* Поле карточки, вписанное платформой: пустое или вписанное ею же
     раньше (флаг в d.auto) — переписываем, вписанное руками — нет.
     Возвращает функцию и счётчик изменённых полей. */
  function cardSetter(d) {
    const st = { n: 0 };
    st.set = (tab, scope, blk, key, value) => {
      if (value === undefined || value === null || String(value).trim() === "") return;
      const part = scope[blk] = scope[blk] && !Array.isArray(scope[blk]) ? scope[blk] : {};
      const flag = tab + "|" + blk + "|" + key;
      if (part[key] && !d.auto[flag]) return;
      if (part[key] !== String(value)) st.n++;
      part[key] = String(value);
      d.auto[flag] = 1;
    };
    // Строка таблицы «Контакты» по «Кто»: ФИО, телефон, компания.
    st.contact = (who, vals) => {
      const g = d.general;
      g.contacts = Array.isArray(g.contacts) ? g.contacts : [];
      let row = g.contacts.find((r) => String((r || {}).who || "").trim() === who);
      if (!row) {
        if (!Object.values(vals).some(Boolean)) return;
        row = { who };
        g.contacts.push(row);
      }
      for (const [k, v] of Object.entries(vals)) {
        if (!v) continue;
        const flag = `general|contacts|${who}|${k}`;
        if (row[k] && !d.auto[flag]) continue;
        if (row[k] !== v) st.n++;
        row[k] = v;
        d.auto[flag] = 1;
      }
    };
    return st;
  }

  /* Что заведено в карточке объекта — в карточку ПТО само, при каждом
     открытии (пользователь, 07.10.2026: «при заведении объекта я все данные
     завела… зачем несколько раз заводить»): объект, застройщик и
     генподрядчик, шифр, адрес, начальник участка и мастер с телефонами.
     Поменяли в объекте — поменяется и тут; вписанное руками не трогаем. */
  function siteIntoCard(d, st) {
    const site = S.data.site;
    const g = d.general;
    const place = S.data.facts.place || {};
    st.set("general", g, "general", "object", site.name);
    // Техзаказчик — специализированный застройщик («АО СЗ РСГ-…» у ЖК 3.1):
    // он застройщик, а заказчик объекта — тогда генподрядчик.
    const sz = /(^|[\s«"])СЗ([\s»"]|$)|застройщ/i.test(site.tech_customer || "");
    st.set("general", g, "general", "developer", sz ? site.tech_customer : site.customer);
    if (sz) st.set("general", g, "general", "contractor", site.customer);
    const gp = ((S.data.contract && S.data.contract.parties) || []).find((x) => /генподряд/i.test(x.role || ""));
    if (gp) st.set("general", g, "general", "contractor", gp.name);
    st.set("general", g, "general", "code", site.project_code || codeSummary());
    st.set("general", g, "place", "city", site.address
      || [place.city ? "г. " + place.city : "", place.district].filter(Boolean).join(", "));
    st.contact("Руководитель объекта", { name: site.foreman, phone: site.foreman_phone,
      company: site.foreman ? site.org : "" });
    st.contact("Производитель работ", { name: site.master, phone: site.master_phone,
      company: site.master ? site.org : "" });
  }

  function fillCard(box) {
    const d = cardData();
    const site = S.data.site;
    const facts = S.data.facts;
    const cl = clData();
    const st = cardSetter(d);
    const setField = st.set;
    let filled = 0;          // строк таблиц; поля считает st.n
    const setTable = (tab, scope, blk, rows) => {
      if (!rows.length) return;
      const cur = Array.isArray(scope[blk]) ? scope[blk] : [];
      const flag = tab + "|" + blk;
      if (cur.some((r) => Object.values(r || {}).some((v) => String(v || "").trim())) && !d.auto[flag]) return;
      scope[blk] = rows;
      d.auto[flag] = 1;
      filled += rows.length;
    };
    const g = d.general;
    const fs = facts.sections || {};
    const terms = (S.data.contract && S.data.contract.fields) || {};
    const place = facts.place || {};
    siteIntoCard(d, st);
    setField("general", g, "general", "terms", terms.terms);
    setField("general", g, "contract", "dates", terms.terms);
    setField("general", g, "contract", "ks", terms.package);
    setField("general", g, "contract", "id_docs", terms.id_docs);
    setField("general", g, "place", "streets", (place.streets || "").replace(/^улицам/, "улицы").replace(/^улице/, "улица"));
    // Секции и квартиры: из чек-листа, а чего там нет — из проекта
    // (экспликации, этажные щиты). Чек-лист у объекта бывает ещё пустым.
    const filledCl = cl.sections.filter((s) => Object.values(cl.rows).some((r) => String((r || {})[s] ?? "").trim()));
    const secs = [...new Set([...filledCl, ...Object.keys(fs)])].sort((a, b) => SEC_ORDER(a) - SEC_ORDER(b));
    const rowVal = (k, s) => {
      const v = (cl.rows[k] || {})[s];
      return v !== undefined && String(v).trim() !== "" ? v : (fs[s] || {})[k];
    };
    if (secs.length) {
      const rows = {};
      for (const k of ["flats", "studio", "k1", "k2", "k3", "k4", "d2", "d3", "d4"]) {
        rows[k] = {};
        for (const s of secs) if (rowVal(k, s) !== undefined) rows[k][s] = String(rowVal(k, s));
      }
      const tot = clTotals({ sections: secs, rows, parking: {}, auto: {} });
      setField("general", g, "volumes", "entrances", `${secs.length} ${plural(secs.length, "секция", "секции", "секций")}`);
      const storeys = secs.map((s) => rowVal("floors", s) ? `${s}-я секция — ${rowVal("floors", s)} эт.` : "")
        .filter(Boolean).join("\n");
      setField("general", g, "volumes", "storeys", storeys);
      setField("general", g, "volumes", "flats", tot.flats && tot.flats.total);
      const types = [["studio", "студий"], ["k1", "1-к"], ["k2", "2-к"], ["k3", "3-к"], ["k4", "4-к"],
                     ["d2", "2-ур."], ["d3", "3-ур."], ["d4", "4-ур."]]
        .filter(([k]) => tot[k] && tot[k].total).map(([k, t]) => `${t}: ${fmt(tot[k].total)}`).join(", ");
      setField("general", g, "volumes", "flat_types", types);
    }
    const notes = facts.notes || {};
    setField("general", g, "laying_more", "project_notes", (notes.laying || []).join("\n"));
    setField("general", g, "gzsh", "strip", (notes.ground || []).filter((t) => /полос/i.test(t)).join("\n"));
    // Что есть в проекте, видно и по названиям листов: ЭГ с молниезащитой,
    // наружные сети 0,4 кВ, контур заземления.
    const titles = S.data.sheets.map((x) => x.title).join("\n");
    const ours = "есть по проекту — уточнить, наши ли работы";
    if ((notes.lightning || []).length || /молниезащит/i.test(titles)) setField("general", g, "volumes", "lightning", ours);
    if (/наружн\S*\s+(электро)?(сет|снабж)|0[,.]4\s*кВ/i.test(titles)) setField("general", g, "volumes", "net04", ours);
    if (/контур\S*\s+заземл/i.test(titles)) setField("general", g, "volumes", "ground_loop", ours);
    if ((facts.parking || {}).area) {
      setField("general", g, "outdoor", "parking", `Подземная автостоянка — ${fmt(facts.parking.area)} м² по экспликации`);
    }
    if ((facts.panels || []).length) {
      setTable("general", g, "rooms", [{ name: "По проекту — разнесите по щитовым",
        panels: `${facts.panels.length} ${plural(facts.panels.length, "щит", "щита", "щитов")}: ${facts.panels.join(", ")}` }]);
    } else {
      // Щитов на схемах не прочитать (надписи линиями) — электрощитовые
      // хотя бы по экспликациям: где ВРУ каждой секции.
      const el = [];
      for (const s of Object.keys(fs).sort((a, b) => SEC_ORDER(a) - SEC_ORDER(b))) {
        for (const t of fs[s].tech || []) {
          if (/ВРУ|ГРЩ|электрощитов/i.test(t.name)) el.push({ name: `${t.name} — секция ${s}, ${floorTxt(t.floor)}` });
        }
      }
      setTable("general", g, "rooms", el);
    }
    for (const s of secs) {
      const sc = d.sections[s] = d.sections[s] || {};
      for (const [k, key] of [["floors", "floors"], ["flats", "flats"], ["studio", "studio"],
                              ["k1", "k1"], ["k2", "k2"], ["k3", "k3"], ["k4", "k4"]]) {
        setField(s, sc, "char", key, rowVal(k, s));
      }
      const lifts = (facts.lifts || []).filter((x) => x.section === s);
      if (lifts.length) {
        setField(s, sc, "char", "lifts", lifts.length);
        setField(s, sc, "lifts", "count", lifts.length);
        setField(s, sc, "lifts", "cables", lifts.map((x) => `${x.dst}: ${x.brand} ${x.cores}`).join("\n"));
      }
      const offices = (facts.offices || []).filter((x) => x.section === s);
      if (offices.length) {
        setTable(s, sc, "offices", offices.map((x) => ({ name: x.dst, panels: "1",
          cable: `${x.brand} ${x.cores}`.trim() })));
      } else {
        // Щитов офисов на схемах нет — офисы по экспликации.
        setTable(s, sc, "offices", ((fs[s] || {}).office_list || []).map((o) => ({
          name: `Офис №${o.no} — ${o.floor} эт., ${fmt(o.area)} м²` })));
      }
      const f = fs[s] || {};
      setField(s, sc, "devices_more", "std_floors", f.std_floors);
      const tech = f.tech || [];
      setField(s, sc, "basement", "rooms", [...new Set(tech.filter((t) => /^-\d|подвал/.test(t.floor))
        .map((t) => t.name))].join(", "));
      setTable(s, sc, "tech", tech.map((t) => ({ name: `${t.name} (${floorTxt(t.floor)})` })));
    }
    touch("card");
    cardView(box);
    filled += st.n;
    note(filled ? `Заполнено полей: ${filled} — из карточки объекта, чек-листа и разобранного проекта. `
      + "Такие поля подсвечены: проверьте их. Вписанное руками не трогал."
      : "Заполнять нечего: всё, что Трейс знает из проекта и чек-листа, уже вписано.");
  }

  /* ── 3. кабельный журнал ─────────────────────────────────── */
  /* «Проектные данные для расчёта» (заказчик, 21.10.2026): есть ли на
     планах всё, чтобы посчитать длину линии. Всё, кроме «есть», уходит в
     замечания проектировщику; «другое» — с комментарием инженера. */
  const DATA_ST = [["", "—"], ["ok", "Есть"], ["equip", "Нет оборудования", "Отсутствует оборудование"],
    ["partial", "Неполная линия", "Не полная кабельная линия"], ["other", "Другое"]];
  const isGap = (r) => r.data_st === "equip" || r.data_st === "partial" || r.data_st === "other";
  /* Длина, что идёт в расчёт: по расчётам, а нет её — со схемы. Длину со
     схемы не правят (заказчик, 21.10.2026): она — как прочитана. */
  const has = (v) => v !== null && v !== undefined && v !== "";
  const lenUsed = (r) => (has(r.len_calc) ? r.len_calc : r.length);
  const CABW = typeof GRID === "object" ? GRID.widths("karkas.pto.cab.colw.v2", () => [
    ["line", 102], ["src", 92], ["dst", 0], ["brand", 120], ["kind", 56], ["cores", 66],
    ["length", 70], ["len_calc", 80], ["data", 150], ...(S && S.mine ? [["mine", 84]] : []),
    ["checks", 130], ["acts", 48]]) : null;
  const ncols = () => 11 + (S.mine ? 1 : 0);
  /* Щит строки: «откуда», а не вписано — из обозначения линии «3ВРУ1.1-4». */
  const panelOf = (r) => String(r.src || "").trim() || String(r.line || "").replace(/[-.]?\d+$/, "").trim();

  /* Свой журнал (21.10.2026): что разошлось со строкой — как
     pto_refjournal.diffs на сервере, чтобы правка длины сразу меняла
     отметку, без перезагрузки журнала. */
  const LAT = { A: "А", B: "В", C: "С", E: "Е", H: "Н", K: "К", M: "М", O: "О", P: "Р", T: "Т", X: "Х", Y: "У" };
  const nrm = (v) => String(v ?? "").toUpperCase().replace(/[ABCEHKMOPTXY]/g, (ch) => LAT[ch])
    .replace(/Ё/g, "Е").replace(/[–—]/g, "-").replace(/[\s_]/g, "");
  function mineDiffs(r) {
    const m = r.mine;
    if (!m || m.none) return [];
    const out = [];
    const ours = lenUsed(r);
    if (has(m.length) && has(ours) && Math.abs(Number(m.length) - Number(ours)) > 0.01) out.push("length");
    const core = (v) => nrm(v).replace(/[()]/g, "").replace(/Х/g, "X");
    if (core(m.cores) && core(r.cores) && core(m.cores) !== core(r.cores)) out.push("cores");
    const mark = (v) => nrm(v).replace(/[()]/g, "").replace(/НГА/g, "НГ");
    const a = mark(m.brand), b = mark(r.brand);
    if (a && b && !(a.startsWith(b) || b.startsWith(a))) out.push("brand");
    return out;
  }
  const MINE_WHAT = { length: "длина", cores: "сечение", brand: "марка" };

  function setCables(x) {
    S.cables = x.rows;
    S.mine = x.mine || null;
    S.mineExtra = x.mine_extra || [];
  }

  function journalRows() {
    const q = J.q.trim().toLowerCase();
    const mine = cableScope();
    return (S.cables || []).filter((r) => {
      if (mine && !mine(r)) return false;
      if (J.sheet && sheetKey(r) !== J.sheet) return false;
      if (J.flagged && !r.checks.length) return false;
      if (J.diff && S.mine && !mineDiffs(r).length) return false;
      if (!q) return true;
      return [r.line, r.src, r.dst, r.brand, r.cores, r.label, r.note, r.data_note].join(" ").toLowerCase().includes(q);
    });
  }
  const sheetKey = (r) => r.doc_id + "|" + r.page;

  function journalView(box) {
    if (S.cables === null) {
      box.innerHTML = `<div class="pg-empty"><b>Загружаю журнал…</b></div>`;
      loadCables();
      return;
    }
    const all = S.cables;
    if (!all.length && !S.data.docs.some((x) => x.parsed)) {
      box.innerHTML = noProject("Журнал соберётся с принципиальных схем: линия, откуда, куда, марка, сечение, длина.");
      return;
    }
    // Схемы в списке и счёт — только выбранной секции или тома.
    const mine = cableScope();
    const pool = mine ? all.filter(mine) : all;
    const sheets = [];
    const seen = {};
    for (const r of pool) {
      const k = sheetKey(r);
      if (!seen[k]) {
        seen[k] = { key: k, title: r.sheet || "Дописано руками", page: r.page, doc: r.doc_id, n: 0 };
        sheets.push(seen[k]);
      }
      seen[k].n++;
    }
    if (J.sheet && !seen[J.sheet]) J.sheet = "";
    if (!S.mine) J.diff = false;
    const rows = journalRows();
    const mode = (k, t, tip) => `<button type="button" class="seg-b${J.mode === k ? " on" : ""}" data-jmode="${k}"
      title="${tip}">${t}</button>`;
    box.innerHTML = `
      <div class="pto-tools">
        <div class="seg">${mode("sheets", "По схемам", "Строки по листам принципиальных схем")}${
          mode("panels", "По щитам", "Строки по щитам, откуда идут линии")}${
          mode("summary", "Сводный", "Одна строка на марку и сечение")}</div>
        ${multi() ? scopeHtml("jScope") : ""}
        <select class="role-sel pto-jsheet" id="jSheet">
          <option value="">Все схемы · ${pool.length}</option>
          ${sheets.map((s) => `<option value="${esc(s.key)}"${J.sheet === s.key ? " selected" : ""}>${
            esc(shortSheet(s.title))} · ${s.n}</option>`).join("")}
        </select>
        <label class="pg-find">${ICO.find}<input id="jQ" placeholder="Линия, щит, марка" value="${esc(J.q)}"></label>
        ${J.mode !== "summary" ? `<label class="pto-check"><input type="checkbox" id="jFlag"${J.flagged ? " checked" : ""}>
          С пометками <i data-n="flag"></i></label>${S.mine ? `<label class="pto-check" title="Строки, где свой журнал
          расходится с платформой: длина, сечение или марка"><input type="checkbox" id="jDiff"${J.diff ? " checked" : ""}>
          Расходится со своим <i data-n="diff"></i></label>` : ""}`
          : `<label class="pto-reserve">Запас <input class="pos-in num" id="jRes" value="${esc(J.reserve || "")}"
            inputmode="decimal" placeholder="0">%</label>`}
        <span class="grow"></span>
        ${mineBtnHtml()}
        <button type="button" class="btn-ghost sm" id="jRemarks" title="Список замечаний проектировщику — по строкам, где в
          «Данных для расчёта» стоит «Отсутствует оборудование», «Не полная кабельная линия» или «Другое»">${
          ICO.note}Замечания <i data-n="gaps"></i></button>
        ${ctx.can && J.mode === "sheets" ? `<button type="button" class="btn-ghost sm" id="jAdd">+ Строка</button>` : ""}
        <button type="button" class="btn-ghost sm" data-xlsx="journal">${ICO.down}В Excel</button>
      </div>
      <div class="pto-main" id="ptoMain">${J.mode === "summary" ? summaryHtml(rows)
        : journalTable(rows, seen) + mineExtraHtml()}</div>`;
    paintCounts(box);
    holdScroll(box, "journal:" + J.mode);
    box.querySelectorAll("[data-jmode]").forEach((b) => b.addEventListener("click", () => {
      J.mode = b.dataset.jmode;
      journalView(box);
    }));
    $p("#jSheet", box).addEventListener("change", (e) => { J.sheet = e.target.value; journalView(box); });
    const js = $p("#jScope", box);
    if (js) js.addEventListener("change", (e) => { SCOPE = e.target.value; J.sheet = ""; journalView(box); });
    const qi = $p("#jQ", box);
    qi.addEventListener("input", () => {
      J.q = qi.value;
      const pos = qi.selectionStart;
      journalView(box);
      const again = $p("#jQ", box);
      again.focus();
      again.setSelectionRange(pos, pos);
    });
    const fl = $p("#jFlag", box);
    if (fl) fl.addEventListener("change", () => { J.flagged = fl.checked; journalView(box); });
    const df = $p("#jDiff", box);
    if (df) df.addEventListener("change", () => { J.diff = df.checked; journalView(box); });
    const res = $p("#jRes", box);
    if (res) {
      res.addEventListener("change", () => {
        J.reserve = Math.max(0, Math.min(100, numOf(res.value) || 0));
        journalView(box);
      });
    }
    const add = $p("#jAdd", box);
    if (add) add.addEventListener("click", () => addCable(box, null));
    $p("#jRemarks", box).addEventListener("click", () => remarksDialog());
    const mf = $p("#jMineFile", box);
    if (mf) mf.addEventListener("change", () => {
      const f = mf.files && mf.files[0];
      mf.value = "";
      if (f) mineUpload(f, box);
    });
    const md = $p("#jMineDel", box);
    if (md) md.addEventListener("click", () => mineDelete(box));
    box.querySelector("[data-xlsx]").addEventListener("click", (e) =>
      download("journal", e.currentTarget));
    box.querySelectorAll("[data-page]").forEach((b) => b.addEventListener("click", () =>
      openPage(b.dataset.doc, b.dataset.page, b)));
    const main = $p("#ptoMain", box);
    if (typeof GRID === "object") GRID.pan(main);
    if (J.mode !== "summary") {
      const t = $p("table.pto-jt", box);
      if (CABW && t) CABW.wire(t, t.tHead.rows[0], () => journalView(box));
      if (ctx.can) wireJournal(box);
    }
  }

  /* Счётчики на панели — без перерисовки журнала: поправили строку, и
     «с пометками», «расходится» и «замечания» пересчитались сами. */
  function paintCounts(box) {
    const mine = cableScope();
    const pool = (S.cables || []).filter((r) => !mine || mine(r));
    const set = (k, n) => { const i = box.querySelector(`[data-n="${k}"]`); if (i) i.textContent = n || ""; };
    set("flag", pool.filter((r) => r.checks.length).length || "0");
    set("diff", pool.filter((r) => mineDiffs(r).length).length || "0");
    const gaps = (S.cables || []).filter(isGap).length;
    set("gaps", gaps ? "· " + gaps : "");
    const b = box.querySelector("#jRemarks");
    if (b) b.disabled = !gaps;
  }

  const shortSheet = (t) => String(t || "").replace(/\.\s*Схема электрическая принципиальная$/i, "")
    .replace(/\.\s*Схема распределительной сети$/i, "").slice(0, 70);

  function journalTable(rows, sheets) {
    // Проект разобран, а кабелей ноль: схемы нарисованы линиями, и марок в
    // тексте PDF нет (тома большого квартала). «Ничего не нашлось» тут
    // звучало бы как сбитый отбор.
    if (!(S.cables || []).length) {
      return `<div class="pg-empty"><b>Кабелей в схемах не нашлось</b>Надписи на схемах этих томов
        нарисованы линиями, а не текстом, — марки и длины прочитать нечем. Строки можно вписать руками:
        «+ Строка» вверху.</div>`;
    }
    if (!rows.length) {
      return `<div class="pg-empty"><b>Ничего не нашлось</b>Снимите отбор или поищите другим словом.</div>`;
    }
    const ed = ctx.can;
    const grip = CABW ? CABW.grip() : "";
    const n = ncols();
    let body = "";
    if (J.mode === "panels") {
      // По щитам (заказчик, 21.10.2026): линии одного щита вместе, с их
      // числом и длиной, — так журнал сверяют со щитовой.
      const groups = new Map();
      for (const r of rows) {
        const k = panelOf(r);
        if (!groups.has(k)) groups.set(k, []);
        groups.get(k).push(r);
      }
      const keys = [...groups.keys()].sort((a, b) => (!a ? 1 : !b ? -1 : a.localeCompare(b, "ru", { numeric: true })));
      body = keys.map((k) => {
        const list = groups.get(k).sort((a, b) =>
          String(a.line || "").localeCompare(String(b.line || ""), "ru", { numeric: true }));
        const len = list.reduce((s, r) => s + (Number(lenUsed(r)) || 0), 0);
        const pages = [...new Set(list.filter((r) => r.doc_id && r.page).map((r) => r.doc_id + "|" + r.page))];
        return `<tr class="pto-jh pto-jh-panel"><td colspan="${n}"><b>${esc(k || "Щит не указан")}</b>
          <span>${list.length} ${plural(list.length, "линия", "линии", "линий")} · ${fmt(len, 1)} м</span>
          ${pages.slice(0, 3).map((p) => {
            const [doc, page] = p.split("|");
            return `<button type="button" class="lnk pto-open" data-page="${esc(page)}" data-doc="${esc(doc)}">${
              ICO.open}${multi() && docPart(doc) ? esc(docPart(doc)) + ", " : ""}стр. ${esc(page)}</button>`;
          }).join("")}</td></tr>` + list.map((r) => cableRow(r, ed)).join("");
      }).join("");
    } else {
      let prev = null;
      body = rows.map((r) => {
        let head = "";
        if (sheetKey(r) !== prev) {
          prev = sheetKey(r);
          const s = sheets[prev] || {};
          head = `<tr class="pto-jh"><td colspan="${n}"><b>${esc(s.title || "Дописано руками")}</b>
            <span>${s.n} ${plural(s.n || 0, "линия", "линии", "линий")}</span>
            ${r.doc_id && r.page ? `<button type="button" class="lnk pto-open" data-page="${r.page}"
              data-doc="${esc(r.doc_id)}">${ICO.open}Лист, стр. ${r.page}</button>` : ""}</td></tr>`;
        }
        return head + cableRow(r, ed);
      }).join("");
    }
    return `<table class="tbl pto-jt" style="${CABW ? CABW.style(S.mine ? 1138 : 1054) : "--tbl-min:1138px"}">
      <colgroup>${CABW ? CABW.colgroup() : ""}</colgroup>
      <thead><tr><th>Линия${grip}</th><th>Откуда${grip}</th><th>Куда${grip}</th><th>Марка${grip}</th>
        <th>Исп.${grip}</th><th>Сечение${grip}</th>
        <th class="num" title="Длина из принципиальной схемы — как прочитана, не правится">Схема, м${grip}</th>
        <th class="num" title="Длина по расчётам — посчитана по планам этажей. Вписана — она идёт в сводный журнал вместо длины со схемы"
          >Расчёт, м${grip}</th>
        <th title="Хватает ли на планах данных, чтобы посчитать линию. Всё, кроме «Есть», — в замечания проектировщику"
          >Данные для расчёта${grip}</th>
        ${S.mine ? `<th class="num" title="Длина из своего журнала. Красным — расходится с платформой">Свой, м${grip}</th>` : ""}
        <th>Проверить${grip}</th><th></th></tr></thead>
      <tbody>${body}</tbody></table>`;
  }

  function cableRow(r, ed) {
    const val = (k) => (k === "len_calc" ? (has(r.len_calc) ? String(r.len_calc).replace(".", ",") : "") : r[k] || "");
    const inp = (k, cls, extra) => ed
      ? `<input class="pos-in${cls ? " " + cls : ""}" data-c="${k}" data-last="${esc(val(k))}" value="${esc(val(k))}"${
        extra || ""}>`
      : esc(k === "len_calc" ? fmt(r.len_calc) : r[k]);
    const tip = r.label ? ` title="На схеме: ${esc(r.label)}"` : "";
    const st = DATA_ST.find(([k]) => k === (r.data_st || "")) || ["", ""];
    const name = st[1];
    const fullName = st[2] || (r.data_st ? st[1] : "Данные для расчёта не отмечены");
    const data = ed ? `<div class="pto-data${r.data_st ? " st-" + esc(r.data_st) : ""}">
        <select class="pos-in pto-data-sel" data-c="data_st" data-last="${esc(r.data_st || "")}"
          aria-label="Данные для расчёта" title="${esc(fullName)}">${DATA_ST.map(([k, t, full]) =>
          `<option value="${k}"${(r.data_st || "") === k ? " selected" : ""}${full ? ` title="${full}"` : ""}>${t}</option>`).join("")}</select>
        <input class="pos-in pto-data-note" data-c="data_note" data-last="${esc(r.data_note || "")}"
          value="${esc(r.data_note || "")}" placeholder="Чего нет на планах"${r.data_st === "other" ? "" : " hidden"}>
      </div>`
      : `<span class="pto-data-ro${r.data_st ? " st-" + esc(r.data_st) : ""}">${r.data_st ? esc(name) : ""}${
        r.data_note ? ": " + esc(r.data_note) : ""}</span>`;
    return `<tr data-cid="${esc(r.id)}" class="${r.checks.length ? "pto-flag" : ""}${r.edited || r.manual ? " pto-edited" : ""}${
      isGap(r) ? " pto-gap" : ""}">
      <td${tip}>${inp("line")}</td>
      <td>${inp("src")}</td>
      <td>${inp("dst")}</td>
      <td>${inp("brand")}</td>
      <td>${inp("kind")}</td>
      <td>${inp("cores")}</td>
      <td class="num pto-len-ro" title="Со схемы — не правится">${has(r.length) ? fmt(r.length) : "—"}</td>
      <td class="num">${inp("len_calc", "num", ' inputmode="decimal" placeholder="—"')}</td>
      <td class="pto-data-td">${data}</td>
      ${S.mine ? `<td class="num pto-mine-td">${mineCell(r)}</td>` : ""}
      <td class="pto-checks">${checksHtml(r)}</td>
      <td class="acts pto-acts">${ed ? `<button type="button" class="lnk" data-cadd title="Добавить строку ниже">+</button><button
        type="button" class="lnk warn" data-cdel title="Убрать строку">×</button>` : ""}</td>
    </tr>`;
  }

  function mineCell(r) {
    const m = r.mine;
    if (!m) return "";
    if (m.none) return `<span class="pto-mine-none" title="В своём журнале этой линии не нашлось">нет</span>`;
    const d = mineDiffs(r);
    const what = [m.line, [m.src, m.dst].filter(Boolean).join(" → "), m.brand, m.cores,
      has(m.length) ? fmt(m.length) + " м" : ""].filter(Boolean).join(" · ");
    const tip = `Свой журнал, строка ${m.row}: ${what}` + (d.length
      ? `\nРасходится с платформой: ${d.map((k) => MINE_WHAT[k]).join(", ")}` : "\nСовпадает с платформой");
    return `<span class="pto-mine${d.length ? " bad" : " ok"}" title="${esc(tip)}">${has(m.length) ? fmt(m.length) : "—"}${
      d.filter((k) => k !== "length").map((k) => `<i>${MINE_WHAT[k]}</i>`).join("")}</span>`;
  }

  function checksHtml(r) {
    return r.checks.map((c) => `<span class="pto-chk${/журнале проекта/.test(c) ? " pto-chk-ref" : ""}">${esc(c)}</span>`).join("");
  }

  /* Правка строки — по событию на всей таблице: строки перерисовываются
     частями (пометки, свой журнал), и обработчики у каждой не держим. */
  function wireJournal(box) {
    const t = $p("table.pto-jt", box);
    if (!t) return;
    t.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && e.target.matches("input[data-c]")) e.target.blur();
    });
    t.addEventListener("change", async (e) => {
      const el = e.target.closest("[data-c]");
      if (!el || el.value === el.dataset.last) return;
      const tr = el.closest("tr");
      const key = el.dataset.c;
      if (key === "data_st") {
        // «Другое» — сразу поле комментария, не дожидаясь сервера.
        const note = tr.querySelector('[data-c="data_note"]');
        if (note) {
          note.hidden = el.value !== "other";
          if (el.value === "other") setTimeout(() => note.focus(), 0);
        }
      }
      try {
        const upd = await AUTH.api("PATCH", "/pto/cables/" + tr.dataset.cid, { [key]: el.value });
        el.dataset.last = el.value;
        el.classList.remove("bad");
        el.removeAttribute("title");
        const i = S.cables.findIndex((x) => x.id === upd.id);
        if (i >= 0) {
          upd.mine = S.cables[i].mine;
          S.cables[i] = upd;
        }
        tr.classList.toggle("pto-flag", upd.checks.length > 0);
        tr.classList.add("pto-edited");
        tr.classList.toggle("pto-gap", isGap(upd));
        tr.querySelector(".pto-checks").innerHTML = checksHtml(upd);
        const dbox = tr.querySelector(".pto-data");
        if (dbox) dbox.className = "pto-data" + (upd.data_st ? " st-" + upd.data_st : "");
        const mc = tr.querySelector(".pto-mine-td");
        if (mc) mc.innerHTML = mineCell(upd);
        for (const k of ["kind", "cores"]) {
          const x = tr.querySelector(`[data-c="${k}"]`);
          if (x && document.activeElement !== x) x.value = x.dataset.last = upd[k];
        }
        paintCounts(box);
      } catch (err) {
        el.classList.add("bad");
        el.title = err.message;
      }
    });
    t.addEventListener("click", async (e) => {
      const add = e.target.closest("[data-cadd]");
      if (add) {
        addCable(box, add.closest("tr").dataset.cid);
        return;
      }
      const del = e.target.closest("[data-cdel]");
      if (!del) return;
      const tr = del.closest("tr");
      const r = S.cables.find((x) => x.id === tr.dataset.cid) || {};
      if (!(await ASK.confirm(`Убрать строку ${r.line || r.label || ""} из журнала?`))) return;
      try {
        await AUTH.api("DELETE", "/pto/cables/" + tr.dataset.cid);
        S.cables = S.cables.filter((x) => x.id !== tr.dataset.cid);
        journalView(box);
      } catch (err) {
        note("Не убралась: " + err.message, true);
      }
    });
  }

  async function addCable(box, afterId) {
    try {
      const row = await AUTH.api("POST", "/sites/" + enc(S.siteId) + "/pto/cables",
        afterId ? { after: afterId } : {});
      if (S.mine) row.mine = { none: true };
      const i = afterId ? S.cables.findIndex((x) => x.id === afterId) : -1;
      if (i >= 0) S.cables.splice(i + 1, 0, row); else S.cables.push(row);
      J.flagged = false;
      J.diff = false;
      J.q = "";
      journalView(box);
      const tr = box.querySelector(`tr[data-cid="${row.id}"]`);
      if (tr) {
        tr.scrollIntoView({ block: "center" });
        const inp = tr.querySelector('[data-c="line"]');
        if (inp) inp.focus();
      }
    } catch (e) {
      note("Строка не добавилась: " + e.message, true);
    }
  }

  /* ── свой журнал для сравнения (21.10.2026) ── */
  function mineBtnHtml() {
    const file = ctx.can ? '<input type="file" id="jMineFile" accept=".xlsx,.xlsm" hidden>' : "";
    if (!S.mine) {
      return ctx.can ? `<label class="btn-ghost sm" for="jMineFile" title="Свой кабельный журнал книгой Excel — сравним
        со строками платформы: длины, сечения, марки">${ICO.up}Свой журнал</label>${file}` : "";
    }
    const m = S.mine;
    const got = (S.cables || []).filter((r) => r.mine && !r.mine.none).length;
    return `<span class="pto-mine-chip" title="${esc(`Свой журнал: «${m.filename}», лист «${m.sheet}», строк ${m.rows}.`
      + ` Загружен ${hhmm(m.at)}${m.author ? ", " + m.author : ""}`)}">${ICO.book}<b>${esc(m.filename)}</b>
      <i>сверено ${got} из ${m.rows}</i>${ctx.can ? `<label class="lnk" for="jMineFile" title="Загрузить другую книгу">заменить</label>
      <button type="button" class="lnk warn" id="jMineDel" title="Убрать свой журнал">×</button>` : ""}</span>${file}`;
  }

  function mineExtraHtml() {
    const x = S.mineExtra || [];
    if (!S.mine || !x.length) return "";
    return `<section class="pto-mine-extra">
      <h4 class="pto-h4">Есть только в своём журнале · ${x.length}</h4>
      <table class="tbl pto-mine-t" style="--tbl-min:760px">
        <colgroup><col style="width:120px"><col style="width:120px"><col><col style="width:160px">
          <col style="width:90px"><col style="width:90px"><col style="width:80px"></colgroup>
        <thead><tr><th>Линия</th><th>Откуда</th><th>Куда</th><th>Марка</th><th>Сечение</th>
          <th class="num">Длина, м</th><th class="num">Строка</th></tr></thead>
        <tbody>${x.map((r) => `<tr><td>${esc(r.line)}</td><td>${esc(r.src)}</td><td>${esc(r.dst)}</td>
          <td>${esc(r.brand)}</td><td>${esc(r.cores)}</td><td class="num">${fmt(r.length)}</td>
          <td class="num dim">${esc(r.row)}</td></tr>`).join("")}</tbody>
      </table></section>`;
  }

  async function mineUpload(f, box) {
    if (!/\.(xlsx|xlsm)$/i.test(f.name)) {
      note("Свой журнал — книгой Excel (.xlsx)", true);
      return;
    }
    const siteId = S.siteId;
    const tr = typeof TRACE === "object" ? TRACE.start({ kind: "book", file: f.name, title: "сверяет свой журнал" }) : null;
    try {
      const r = await fetch("/api/sites/" + enc(siteId) + "/pto/refjournal", {
        method: "POST",
        headers: { Authorization: "Bearer " + AUTH.token(), "X-File-Name": encodeURIComponent(f.name),
                   "Content-Type": f.type || "application/octet-stream" },
        body: f,
      });
      let x = null;
      try { x = await r.json(); } catch (e) { /* ответил не сервер приложения */ }
      if (!r.ok) {
        throw new Error((x && x.error) || (r.status === 413 ? "Файл больше, чем принимает сервер"
          : "Не удалось загрузить, ответ сервера " + r.status));
      }
      if (!S || S.siteId !== siteId) return;
      setCables(x);
      const got = x.rows.filter((c) => c.mine && !c.mine.none).length;
      if (tr) tr.done(`Сверил ${got} из ${x.mine.rows} строк`
        + (x.mine_extra.length ? `, нет у платформы — ${x.mine_extra.length}` : ""));
      J.diff = false;
      if (curView() === "journal") journalView(box);
    } catch (e) {
      if (tr) tr.fail("Не получилось: " + e.message);
      note(e.message, true);
    }
  }

  async function mineDelete(box) {
    if (!(await ASK.confirm(`Убрать свой журнал «${S.mine.filename}»? Строки платформы останутся как есть.`))) return;
    try {
      setCables(await AUTH.api("DELETE", "/sites/" + enc(S.siteId) + "/pto/refjournal"));
      J.diff = false;
      journalView(box);
    } catch (e) {
      note("Не убрался: " + e.message, true);
    }
  }

  /* ── замечания проектировщику (21.10.2026) ──
     По образцу заказчика: «в принципиальной схеме № листа группа №, на
     планах этажей отсутствует «причина». Просим Вас отобразить «причина»».
     Текст собирает сервер; здесь его можно поправить перед отправкой,
     скопировать или забрать книгой Excel. */
  async function remarksDialog() {
    let rows;
    try {
      rows = (await AUTH.api("GET", "/sites/" + enc(S.siteId) + "/pto/remarks")).rows;
    } catch (e) {
      note("Замечания не собрались: " + e.message, true);
      return;
    }
    const text = rows.map((r, i) => `${i + 1}. ${r.text}`).join("\n");
    const box = document.createElement("div");
    box.className = "pf-modal";
    box.innerHTML = `
      <div class="pf-crop pto-rem" role="dialog" aria-modal="true" aria-label="Замечания к проекту">
        <h3>Замечания к проекту <i>${rows.length}</i></h3>
        <p class="pto-rem-sub">Строки журнала, где для расчёта не хватает данных на планах. Текст можно поправить
          перед отправкой проектировщику.</p>
        <textarea class="pos-in pto-rem-text" id="remText" spellcheck="true">${esc(text)}</textarea>
        <div class="pf-modal-foot">
          <span class="sit-hint" id="remDone"></span><span class="grow"></span>
          <button type="button" class="btn ghost" id="remXlsx">В Excel</button>
          <button type="button" class="btn ghost" id="remClose">Закрыть</button>
          <button type="button" class="btn" id="remCopy">Скопировать</button>
        </div>
      </div>`;
    const onKey = (e) => { if (e.key === "Escape") close(); };
    const close = () => { document.removeEventListener("keydown", onKey); box.remove(); };
    document.addEventListener("keydown", onKey);
    box.addEventListener("click", (e) => { if (e.target === box) close(); });
    document.body.appendChild(box);
    const ta = $p("#remText", box);
    $p("#remClose", box).addEventListener("click", close);
    $p("#remXlsx", box).addEventListener("click", (e) => download("remarks", e.currentTarget));
    $p("#remCopy", box).addEventListener("click", async () => {
      const done = $p("#remDone", box);
      try {
        await navigator.clipboard.writeText(ta.value);
      } catch (e) {
        ta.select();
        document.execCommand("copy");
      }
      done.textContent = "Скопировано";
    });
    ta.focus();
  }

  function summaryHtml(rows) {
    const acc = new Map();
    const pending = rows.filter((r) => !r.src || !r.dst).length;
    for (const r of rows) {
      if (!r.src || !r.dst) continue;
      if (!r.brand && !r.cores) continue;
      const key = (r.brand || "").replace(/\s+/g, "").toUpperCase() + "|" + (r.cores || "");
      const a = acc.get(key) || { brand: r.brand, cores: r.cores, kind: r.kind, lines: 0, length: 0, none: 0, calc: 0 };
      a.lines++;
      const n = lenUsed(r);
      if (!has(n)) a.none++; else a.length += Number(n);
      if (has(r.len_calc)) a.calc++;
      acc.set(key, a);
    }
    const coresN = (c) => (String(c || "").match(/\d+(?:[.,]\d+)?/g) || ["0"]).map((x) => Number(x.replace(",", ".")));
    const list = [...acc.values()].sort((a, b) => (a.brand || "").localeCompare(b.brand || "", "ru")
      || coresN(a.cores)[0] - coresN(b.cores)[0] || coresN(a.cores).slice(-1)[0] - coresN(b.cores).slice(-1)[0]);
    const k = 1 + (J.reserve || 0) / 100;
    const total = list.reduce((s, a) => s + a.length, 0);
    const none = list.reduce((s, a) => s + a.none, 0);
    if (!list.length) return `<div class="pg-empty"><b>Нечего сводить</b>Нет линий с указанными началом и концом.${
      pending ? ` Требуют проверки: ${pending}.` : ""}</div>`;
    return `${pending ? `<p class="pto-sum-note">${pending} ${plural(pending, "строка требует", "строки требуют", "строк требуют")}
      проверки направления и не включены в сводную длину.</p>` : ""}<table class="tbl pto-sum">
      <colgroup><col><col style="width:99px"><col style="width:81px"><col style="width:72px">
        <col style="width:150px"><col style="width:135px"><col style="width:117px"></colgroup>
      <thead><tr><th>Марка</th><th>Сечение</th><th>Исп.</th><th class="num">Линий</th>
        <th class="num" title="По расчётам, где длина посчитана, иначе по схеме">Длина, м</th>
        <th class="num">С запасом ${fmt(J.reserve || 0)}%, м</th>
        <th class="num">Без длины</th></tr></thead>
      <tbody>${list.map((a) => `<tr><td><span class="t-name">${esc(a.brand) || "—"}</span></td>
        <td>${esc(a.cores)}</td><td>${esc(a.kind)}</td><td class="num">${a.lines}</td>
        <td class="num" title="${a.calc ? `По расчётам — ${a.calc} из ${a.lines}` : "Все длины — со схем"}">${fmt(a.length)}${
          a.calc ? ` <i class="pto-calc-n">расч. ${a.calc}</i>` : ""}</td>
        <td class="num"><b>${fmt(a.length * k, 1)}</b></td>
        <td class="num${a.none ? " pto-warn-t" : ""}">${a.none || ""}</td></tr>`).join("")}
      <tr class="pto-total"><td colspan="3">Итого, ${list.length} ${plural(list.length, "позиция", "позиции", "позиций")}</td>
        <td class="num">${rows.length}</td><td class="num">${fmt(total)}</td>
        <td class="num">${fmt(total * k, 1)}</td><td class="num">${none || ""}</td></tr>
      </tbody></table>`;
  }

  /* ── 4. высота этажей ──────────────────────────────────────────
     Новая вкладка (заказчик, 21.10.2026): «уровень каждого этажа». Этажи —
     из планов проекта, все подряд от нижнего до верхнего (типовые «6-10» —
     по одному), к ним свои строки. Отметку вписывают или заполняют от
     отметки 1-го этажа и типовой высоты. Высота этажа — разница отметок с
     этажом выше, если своя не вписана. Хранится формой ПТО «levels». */
  function lvData() {
    const d = S.data.forms.levels.data;
    if (!Array.isArray(d.rows)) d.rows = [];
    return d;
  }

  function projectFloors() {
    const out = new Set();
    const nums = [];
    for (const s of S.data.sheets) {
      const f = String(s.floor || "");
      if (!/^plan_/.test(s.group) || !f || /фасад/.test(f)) continue;
      const m = f.match(/^(-?\d+)(?:-(-?\d+))?$/);
      if (m) {
        nums.push(Number(m[1]));
        if (m[2]) nums.push(Number(m[2]));
      } else out.add(f);
    }
    if (nums.length) {
      const lo = Math.min(...nums), hi = Math.max(...nums);
      if (hi - lo < 120) for (let i = lo; i <= hi; i++) if (i) out.add(String(i));
    }
    return [...out];
  }

  const floorName = (f) => {
    f = String(f || "");
    if (/^-?\d+$/.test(f)) return `${f} этаж`;
    let m = f.match(/^(-?\d+) тех\.$/);
    if (m) return `${m[1]} этаж, техпространство`;
    m = f.match(/^тех\.?\s*отм\.?\s*(.+)$/);
    if (m) return `Технический этаж, отм. ${m[1]}`;
    m = f.match(/^тех\.?\s*(\d+)?$/);
    if (m) return "Технический этаж" + (m[1] ? " " + m[1] : "");
    return f.charAt(0).toUpperCase() + f.slice(1);
  };
  const lv3 = (n) => (n === null || n === undefined ? "" : Number(n).toLocaleString("ru-RU",
    { minimumFractionDigits: 3, maximumFractionDigits: 3 }));

  function lvRows() {
    const d = lvData();
    const have = new Map(d.rows.map((r) => [String(r.floor), r]));
    const all = new Set([...projectFloors(), ...have.keys()]);
    return [...all].sort((a, b) => FLOOR_ORDER(a) - FLOOR_ORDER(b) || a.localeCompare(b, "ru", { numeric: true }))
      .map((f) => have.get(f) || { floor: f });
  }

  /* Высота этажа по отметкам: до ближайшего выше этажа с отметкой. */
  function lvAutoHeights(rows) {
    const lv = rows.map((r) => numOf(r.level));
    return rows.map((r, i) => {
      if (lv[i] === null) return null;
      for (let j = i + 1; j < rows.length; j++) {
        if (lv[j] !== null) return Math.round((lv[j] - lv[i]) * 1000) / 1000;
      }
      return null;
    });
  }

  function levelsView(box) {
    const d = lvData();
    const rows = lvRows();
    const ed = ctx.can;
    const auto = lvAutoHeights(rows);
    box.innerHTML = `
      <div class="pto-tools">
        ${ed ? `<span class="pto-lv-fill">Отметка 1-го этажа <input class="pos-in num" id="lvL1" value="${
          esc(d.l1 ?? "0,000")}" inputmode="decimal"> м, типовая высота <input class="pos-in num" id="lvH" value="${
          esc(d.h ?? "")}" placeholder="3,000" inputmode="decimal"> м
          <button type="button" class="btn-ghost sm" id="lvFill" title="Вписать отметки этажам, где их ещё нет: 1-й этаж —
            отметка слева, каждый следующий — плюс типовая высота, подземные — минус">Заполнить пустые</button></span>` : ""}
        <span class="sit-hint pto-saved" id="ptoSaved"></span>
        <span class="grow"></span>
        ${ed ? `<button type="button" class="btn-ghost sm" id="lvAdd">+ Этаж</button>` : ""}
        <button type="button" class="btn-ghost sm" data-xlsx="levels">${ICO.down}В Excel</button>
      </div>
      <div class="pto-main" id="ptoMain">
        <div class="pto-hint">Этажи — из планов проекта, от нижнего до верхнего. Отметка — уровень чистого пола этажа,
          м; высота этажа — до этажа выше: посчитана по отметкам (серым), пока своя не вписана.</div>
        ${rows.length ? `<table class="tbl pto-lv" style="--tbl-min:700px">
          <colgroup><col style="width:230px"><col style="width:160px"><col style="width:160px"><col><col style="width:44px"></colgroup>
          <thead><tr><th>Этаж</th><th class="num">Отметка уровня, м</th><th class="num">Высота этажа, м</th>
            <th>Примечание</th><th></th></tr></thead>
          <tbody>${rows.map((r, i) => `<tr data-fl="${esc(r.floor)}">
            <th>${esc(floorName(r.floor))}</th>
            <td class="num">${ed ? `<input class="pos-in num" data-lv="level" value="${esc(r.level || "")}"
              placeholder="—" inputmode="decimal">` : esc(r.level || "")}</td>
            <td class="num">${ed ? `<input class="pos-in num" data-lv="height" value="${esc(r.height || "")}"
              placeholder="${auto[i] !== null ? esc(lv3(auto[i])) : "—"}" inputmode="decimal">`
              : esc(r.height || (auto[i] !== null ? lv3(auto[i]) : ""))}</td>
            <td>${ed ? `<input class="pos-in" data-lv="note" value="${esc(r.note || "")}">` : esc(r.note || "")}</td>
            <td class="acts">${ed && r.manual ? `<button type="button" class="lnk warn" data-lvdel title="Убрать этаж">×</button>` : ""}</td>
          </tr>`).join("")}</tbody>
        </table>` : `<div class="pg-empty"><b>Этажей пока нет</b>Они появятся из планов, когда проект разобран.
          Свой этаж — «+ Этаж».</div>`}
      </div>`;
    saved("levels");
    holdScroll(box, "levels");
    box.querySelectorAll("[data-xlsx]").forEach((b) => b.addEventListener("click", (e) =>
      download(b.dataset.xlsx, e.currentTarget)));
    if (!ed) return;
    const put = (fl, k, v) => {
      let row = d.rows.find((x) => String(x.floor) === fl);
      if (!row) {
        row = { floor: fl };
        d.rows.push(row);
      }
      row[k] = v;
      // Пустая строка этажа из проекта не хранится: этаж и так придёт из планов.
      if (!row.manual && !row.level && !row.height && !row.note) d.rows = d.rows.filter((x) => x !== row);
      touch("levels");
    };
    const tb = box.querySelector(".pto-lv tbody");
    if (tb) {
      tb.addEventListener("keydown", (e) => { if (e.key === "Enter" && e.target.matches("input")) e.target.blur(); });
      tb.addEventListener("change", (e) => {
        const el = e.target.closest("[data-lv]");
        if (!el) return;
        const k = el.dataset.lv;
        const v = el.value.trim();
        if (k !== "note" && v && numOf(v) === null) {
          el.classList.add("bad");
          el.title = "Не число: «" + v + "»";
          return;
        }
        el.classList.remove("bad");
        el.removeAttribute("title");
        put(el.closest("tr").dataset.fl, k, v);
        // Серые высоты по отметкам — пересчитать на месте, фокус не трогая.
        const fresh = lvRows();
        const a = lvAutoHeights(fresh);
        fresh.forEach((r, i) => {
          const h = tb.querySelector(`tr[data-fl="${CSS.escape(r.floor)}"] [data-lv="height"]`);
          if (h) h.placeholder = a[i] !== null ? lv3(a[i]) : "—";
        });
      });
      tb.addEventListener("click", (e) => {
        const del = e.target.closest("[data-lvdel]");
        if (!del) return;
        const fl = del.closest("tr").dataset.fl;
        d.rows = d.rows.filter((x) => String(x.floor) !== fl);
        touch("levels");
        levelsView(box);
      });
    }
    $p("#lvFill", box).addEventListener("click", () => {
      const l1 = numOf($p("#lvL1", box).value);
      const h = numOf($p("#lvH", box).value);
      if (l1 === null || h === null || h <= 0) {
        note("Впишите отметку 1-го этажа и типовую высоту этажа — числами, в метрах", true);
        return;
      }
      d.l1 = $p("#lvL1", box).value.trim();
      d.h = $p("#lvH", box).value.trim();
      let n = 0;
      for (const r of lvRows()) {
        if (r.level) continue;
        const f = String(r.floor);
        let v = null;
        const e = f.match(/отм\.?\s*([+-]?\d+(?:[.,]\d+)?)/);
        if (e) v = Number(e[1].replace(",", "."));
        else if (/^-?\d+$/.test(f)) {
          const k = Number(f);
          v = l1 + (k > 0 ? k - 1 : k) * h;
        }
        if (v === null) continue;
        put(f, "level", lv3(Math.round(v * 1000) / 1000).replace(/\s/g, ""));
        n++;
      }
      touch("levels");
      levelsView(box);
      note(n ? `Отметки вписаны ${n} ${plural(n, "этажу", "этажам", "этажам")}. Проверьте подземные и технические.`
        : "Пустых отметок у этажей с номером нет — вписывать нечего.");
    });
    $p("#lvAdd", box).addEventListener("click", async () => {
      const name = ((await ASK.prompt("Какой этаж добавить? Например: «мансарда», «тех. этаж», «0»", "")) || "").trim();
      if (!name) return;
      if (lvRows().some((r) => String(r.floor).toLowerCase() === name.toLowerCase())) {
        note(`Этаж «${name}» уже есть`, true);
        return;
      }
      d.rows.push({ floor: name, manual: true });
      touch("levels");
      levelsView(box);
    });
  }

  return { mount };
})();
