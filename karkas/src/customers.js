/* «Справочники» → «Заказчики» (заказчик, 13.10.2026).

   «У заказчиков своя карточка: как мы закрываем объёмы работ — по этапам
   или по нашим фронтам работ; специализированные инструкции — как ведём,
   как выполняем договорные отношения; особые прайсы работ; поставщики, у
   которых заказчик велит брать, и по каким ценам; сроки оплаты, сроки
   предоставления документов и заявок — целая карточка под каждого
   заказчика».

   Слева — заказчики (контрагенты вида «заказчик» и «оба») и что о них уже
   записано, справа — карточка в четырёх вкладках. Поля сохраняются сами,
   по мере ввода: кнопки «Сохранить» нет, и закрытая вкладка браузера
   ничего не теряет. Реквизиты остаются в «Контрагентах», здесь — как с
   заказчиком работаем. Документ договорной цены из карточки подсказывает
   загрузка ВДЦ во вкладке «Договор». Сервер — cus_* в api.py. */
"use strict";

const CUS = (() => {
  const $c = (s, r) => (r || document).querySelector(s);
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const tip = (t) => (typeof TIPS === "object" ? TIPS.icon(t) : "");
  const plural = (n, one, few, many) => {
    const a = Math.abs(n) % 100, b = a % 10;
    if (a > 10 && a < 20) return many;
    if (b > 1 && b < 5) return few;
    return b === 1 ? one : many;
  };
  const svg = (d) => `<svg viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
  const ICO = {
    find: svg('<circle cx="11" cy="11" r="6.5"/><path d="M20.5 20.5 16 16"/>'),
    plus: svg('<path d="M12 5v14M5 12h14"/>'),
    up: svg('<path d="M12 16V4M7 9l5-5 5 5M4 17v2a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-2"/>'),
    trash: svg('<path d="M4.5 6.5h15M9.5 6.5V4.8A1.3 1.3 0 0 1 10.8 3.5h2.4a1.3 1.3 0 0 1 1.3 1.3v1.7M6.5 6.5l.9 12.2A1.5 1.5 0 0 0 8.9 20h6.2a1.5 1.5 0 0 0 1.5-1.3l.9-12.2"/>'),
    x: svg('<path d="M7 7l10 10M17 7 7 17"/>'),
    file: svg('<path d="M14 3.5H7.5A1.5 1.5 0 0 0 6 5v14a1.5 1.5 0 0 0 1.5 1.5h9A1.5 1.5 0 0 0 18 19V7.5z"/><path d="M14 3.5v4h4"/>'),
    back: svg('<path d="M15 5l-7 7 7 7"/>'),
    link: svg('<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>'),
  };

  const DOC_KINDS = [["", "Не задан"], ["vdc", "ВДЦ"], ["rdc", "РДЦ"], ["klk", "КЛК"]];
  const DOC_NAME = { vdc: "ВДЦ", rdc: "РДЦ", klk: "КЛК" };
  const PANES = [["terms", "Условия"], ["work", "Как работаем"], ["sup", "Поставщики заказчика"],
    ["files", "Прайсы и документы"]];
  const FILE_KINDS = [["works", "Особый прайс работ"], ["doc", "Инструкция, документ"]];
  const VIEW = /\.(pdf|png|jpe?g)$/i;
  const SEL_KEY = "karkas.cus.sel.v1";
  const PANE_KEY = "karkas.cus.pane.v1";
  const mem = (k, v) => {
    try {
      if (v === undefined) return localStorage.getItem(k) || "";
      localStorage.setItem(k, v);
    } catch (e) { /* без памяти */ }
    return "";
  };

  let host = null;
  let L = null;            // список: {rows, suppliers, edit, closing, parts}
  let C = null;            // карточка открытого заказчика
  let Q = "";
  let sel = mem(SEL_KEY);
  let pane = mem(PANE_KEY) || "terms";
  let upKind = "works";
  let loadingCard = "";
  let chain = Promise.resolve();
  let pending = 0;
  const timers = {};

  /* ── загрузка ────────────────────────────────────────────── */
  async function load() {
    host = document.getElementById("sec-cus");
    if (!host) return;
    if (!L) host.innerHTML = `<div class="pg"><div class="pg-body"><div class="pg-empty"><b>Загружаю заказчиков…</b></div></div></div>`;
    try {
      L = await AUTH.api("GET", "/customers");
    } catch (e) {
      host.innerHTML = `<div class="pg"><div class="pg-note bad">${esc(e.message)}</div></div>`;
      return;
    }
    if (sel && !L.rows.some((r) => r.id === sel)) sel = "";
    // На телефоне список и карточка не помещаются рядом: без выбора — список.
    if (!sel && L.rows.length && !narrow()) sel = L.rows[0].id;
    render();
    if (sel) openCard(sel);
  }

  const narrow = () => window.matchMedia("(max-width: 760px)").matches;

  async function openCard(id) {
    flush();
    sel = id;
    mem(SEL_KEY, id);
    loadingCard = id;
    paintList();
    host.querySelector(".cus-pg").classList.toggle("has-sel", !!id);
    if (!C || C.customer.id !== id) $c("#cusMain", host).innerHTML = `<div class="pg-empty"><b>Открываю карточку…</b></div>`;
    try {
      const got = await AUTH.api("GET", "/customers/" + encodeURIComponent(id));
      if (loadingCard !== id) return;
      C = got;
      paintCard();
    } catch (e) {
      if (loadingCard === id) $c("#cusMain", host).innerHTML = `<div class="pg-note bad">${esc(e.message)}</div>`;
    }
  }

  /* ── список ──────────────────────────────────────────────── */
  function shown() {
    const q = Q.trim().toLowerCase();
    if (!q) return L.rows;
    return L.rows.filter((r) => [r.name, r.inn, ...r.sites].some((x) => String(x || "").toLowerCase().includes(q)));
  }

  function meta(r) {
    const out = [r.sites.length ? `${r.sites.length} ${plural(r.sites.length, "объект", "объекта", "объектов")}` : "без объектов"];
    if (r.doc_kind) out.push(DOC_NAME[r.doc_kind]);
    if (r.pay_days !== null && r.pay_days !== undefined) out.push(`оплата ${r.pay_days} дн.`);
    if (r.suppliers) out.push(`${r.suppliers} ${plural(r.suppliers, "поставщик", "поставщика", "поставщиков")}`);
    return out.join(" · ");
  }

  function render() {
    host.innerHTML = `
      <div class="pg cus-pg${sel ? " has-sel" : ""}">
        <div class="pg-head cus-head">
          <label class="pg-find">${ICO.find}<input id="cusQ" type="search"
            placeholder="Заказчик, ИНН, объект" value="${esc(Q)}" autocomplete="off"></label>
          <span class="pg-count" id="cusCnt"></span>
          <span class="grow"></span>
          ${L.edit ? `<button type="button" class="btn-brand sm" id="cusNew">${ICO.plus}Заказчик</button>` : ""}
          ${tip("Карточка заказчика — как с ним работаем: документ договорной цены, оплата и удержания, "
            + "сроки документов и заявок, как закрываем объёмы, инструкции, поставщики, у которых он велит брать, "
            + "особые прайсы. Реквизиты — в «Контрагентах». Поля сохраняются сами.")}
        </div>
        <div class="pg-body cus-body">
          <nav class="cus-list" id="cusList" aria-label="Заказчики"></nav>
          <div class="cus-main" id="cusMain"></div>
        </div>
      </div>`;
    paintList();
    if (C && C.customer.id === sel) paintCard();
    else if (!sel) $c("#cusMain", host).innerHTML = emptyMain();
    const q = $c("#cusQ", host);
    q.addEventListener("input", () => { Q = q.value; paintList(); });
    if ($c("#cusNew", host)) $c("#cusNew", host).addEventListener("click", create);
  }

  function emptyMain() {
    return L.rows.length
      ? `<div class="pg-empty"><b>Выберите заказчика слева</b>Карточка откроется здесь.</div>`
      : `<div class="pg-empty"><b>Заказчиков пока нет</b>Заказчик — это контрагент с видом «заказчик» или «оба». ${
        L.edit ? "Заведите его кнопкой «Заказчик» вверху" : "Их заводят в «Контрагентах»"}.</div>`;
  }

  function paintList() {
    const list = $c("#cusList", host);
    if (!list) return;
    const rows = shown();
    $c("#cusCnt", host).innerHTML = `<b>${rows.length}</b> ${plural(rows.length, "заказчик", "заказчика", "заказчиков")}`;
    list.innerHTML = rows.length ? rows.map((r) => {
      const pct = Math.round((r.filled || 0) / (L.parts || 10) * 100);
      return `<button type="button" class="cus-li${r.id === sel ? " on" : ""}" data-id="${esc(r.id)}">
        <span class="cus-li-n" title="${esc(r.name)}">${esc(r.name)}</span>
        <span class="cus-li-m">${esc(meta(r))}</span>
        <span class="cus-li-bar" title="Заполнено разделов карточки: ${r.filled} из ${L.parts}"><i style="width:${pct}%"></i></span>
      </button>`;
    }).join("") : `<div class="cus-li-empty">${L.rows.length ? "Никто не подошёл под поиск" : "Заказчиков пока нет"}</div>`;
    list.querySelectorAll(".cus-li").forEach((b) => b.addEventListener("click", () => {
      if (b.dataset.id !== sel || !C || C.customer.id !== sel) openCard(b.dataset.id);
      else host.querySelector(".cus-pg").classList.add("has-sel");
    }));
  }

  async function create() {
    const name = await ASK.prompt("Новый заказчик — название, как в договоре", "");
    if (!name || !name.trim()) return;
    try {
      const made = await AUTH.api("POST", "/customers", { name: name.trim() });
      sel = made.id;
      C = null;
      await load();
    } catch (e) {
      ASK.alert(e.message, { title: "Не вышло" });
    }
  }

  /* ── карточка ────────────────────────────────────────────── */
  const val = (v) => (v === null || v === undefined ? "" : typeof v === "number" ? String(v).replace(".", ",") : v);
  const ro = () => (C.edit ? "" : " readonly");
  const allFiles = () => C.files.concat(...C.suppliers.map((s) => s.files.map((f) => Object.assign({ sup: s.name }, f))));

  function count(id) {
    if (id === "sup" && C.suppliers.length) return `<i>${C.suppliers.length}</i>`;
    if (id === "files") {
      const n = allFiles().length;
      return n ? `<i>${n}</i>` : "";
    }
    return "";
  }

  function paintCard() {
    const main = $c("#cusMain", host);
    if (!main || !C) return;
    const c = C.customer;
    const who = [c.contact, c.phone, c.email].filter(Boolean).join(" · ");
    const pct = Math.round(C.filled / C.parts * 100);
    main.innerHTML = `
      <div class="cus-card">
        <div class="cus-ch">
          <button type="button" class="pg-back cus-back" id="cusBack" title="К списку заказчиков">${ICO.back}</button>
          <div class="cus-ch-b">
            <div class="cus-ch-t">
              <h3 title="${esc(c.full_name || c.name)}">${esc(c.name)}</h3>
              ${c.inn ? `<span class="cus-inn">ИНН ${esc(c.inn)}</span>` : ""}
              <span class="cus-save" id="cusSave" aria-live="polite"></span>
            </div>
            <div class="cus-ch-m">
              ${C.sites.length ? `<span class="cus-sites">${C.sites.map((s) => `<span class="cus-site${s.tender !== "won" ? " tnd" : ""}"
                title="${s.tender !== "won" ? "Объект в тендере" : "Объект"}">${esc(s.name)}</span>`).join("")}</span>`
                : `<span class="cus-none">объектов с этим заказчиком пока нет</span>`}
              ${who ? `<span class="cus-who" title="${esc(who)}">${esc(who)}</span>` : ""}
            </div>
          </div>
        </div>
        <div class="cus-tabs">
          ${PANES.map(([id, name]) => `<button type="button" class="pg-tab${pane === id ? " on" : ""}" data-pane="${id}">${name}${count(id)}</button>`).join("")}
          <span class="cus-fill" id="cusFill" title="Сколько разделов карточки заполнено">Заполнено ${C.filled} из ${C.parts}<i><b style="width:${pct}%"></b></i></span>
        </div>
        <div class="cus-pane" id="cusPane">${paneHtml()}</div>
      </div>`;
    main.querySelectorAll("[data-pane]").forEach((b) => b.addEventListener("click", () => {
      pane = b.dataset.pane;
      mem(PANE_KEY, pane);
      paintCard();
    }));
    $c("#cusBack", main).addEventListener("click", () => host.querySelector(".cus-pg").classList.remove("has-sel"));
    wirePane();
    status();
  }

  function paneHtml() {
    if (pane === "work") return workHtml();
    if (pane === "sup") return supHtml();
    if (pane === "files") return filesHtml();
    return termsHtml();
  }

  function seg(k, opts, cur) {
    return `<div class="seg cus-seg" data-seg="${k}" role="group">${opts.map(([v, n]) => `<button type="button"
      class="seg-b${cur === v ? " on" : ""}" data-v="${esc(v)}"${C.edit ? "" : " disabled"}>${esc(n)}</button>`).join("")}</div>`;
  }

  const fld = (k, label, extra) => `<label class="fld"><span>${label}</span><input data-k="${k}"
    value="${esc(val(C.card[k]))}" title="${esc(val(C.card[k]))}" autocomplete="off"${extra || ""}${ro()}></label>`;

  function pairs(k, ph) {
    const list = C.card[k].length ? C.card[k] : (C.edit ? [{ n: "", v: "" }] : []);
    return `<div class="cus-pairs" data-pairs="${k}">${list.map((p) => pairRow(p, ph)).join("")
      || `<span class="cus-none">Не записано</span>`}</div>
      ${C.edit ? `<button type="button" class="lnk cus-add" data-add="${k}">${ICO.plus}Срок</button>` : ""}`;
  }

  const pairRow = (p, ph) => `<div class="cus-pair">
      <input data-pn value="${esc(p.n)}" title="${esc(p.n)}" placeholder="${esc(ph[0])}" autocomplete="off"${ro()}>
      <input data-pv value="${esc(p.v)}" title="${esc(p.v)}" placeholder="${esc(ph[1])}" autocomplete="off"${ro()}>
      ${C.edit ? `<button type="button" class="ico warn" data-unpair title="Убрать срок">${ICO.x}</button>` : ""}
    </div>`;

  const PH = {
    docs_terms: ["Что — КС-2, КС-3, исполнительная", "Когда — до 25 числа месяца"],
    requests_terms: ["Что — заявка на давальческий материал", "Когда — за 14 дней"],
  };

  function termsHtml() {
    const k = C.card;
    const why = { vdc: "Ведомость договорной цены — форма большинства заказчиков.",
      rdc: "Расчёт договорной цены.", klk: "Калькуляция заказчика (КЛК) — PDF из ЭДО, с материалами работ." };
    return `<div class="cus-grid">
      <section class="cus-tile t3">
        <h4>Документ договорной цены${tip("Что заказчик присылает к договору. Загрузка во вкладке «Договор» объекта сразу ждёт этот вид документа.")}</h4>
        ${seg("doc_kind", DOC_KINDS, k.doc_kind)}
        <p class="cus-hint">${esc(why[k.doc_kind] || "Без выбора загрузка ждёт ВДЦ; если заказчик присылает калькуляцию — КЛК.")}</p>
      </section>
      <section class="cus-tile t3">
        <h4>Оплата</h4>
        <div class="cus-2">${fld("advance_pct", "Аванс, %", ' inputmode="decimal"')}
          ${fld("pay_days", "Оплата через, дней", ' inputmode="numeric"')}</div>
        ${fld("pay_terms", "После чего и как", ' placeholder="например, после подписания КС-2, КС-3"')}
      </section>
      <section class="cus-tile t3">
        <h4>Гарантийное удержание</h4>
        <div class="cus-2">${fld("retention_pct", "Удерживают, %", ' inputmode="decimal"')}<span></span></div>
        ${fld("retention_terms", "Когда и как возвращают", ' placeholder="например, через 12 месяцев после ввода"')}
      </section>
      <section class="cus-tile t2">
        <h4>Сроки сдачи документов</h4>
        ${pairs("docs_terms", PH.docs_terms)}
      </section>
      <section class="cus-tile t2">
        <h4>Сроки подачи заявок</h4>
        ${pairs("requests_terms", PH.requests_terms)}
      </section>
    </div>`;
  }

  function workHtml() {
    const k = C.card;
    const closing = Object.entries(L.closing || {});
    return `<div class="cus-work">
      <div class="cus-col">
        <section class="cus-tile">
          <h4>Как закрываем объёмы${tip("По этапам, которые задал заказчик, или по нашим фронтам работ — и что сдаём в каждом акте.")}</h4>
          ${seg("closing", closing, k.closing)}
          <textarea data-k="closing_note" rows="4" placeholder="Как делим объёмы, что входит в акт, кто принимает"${ro()}>${esc(k.closing_note)}</textarea>
        </section>
        <section class="cus-tile grow">
          <h4>Особенности работы</h4>
          <textarea data-k="features" placeholder="Что важно знать о заказчике: технадзор, допуски и пропуска, ЭДО, кто подписывает"${ro()}>${esc(k.features)}</textarea>
        </section>
      </div>
      <section class="cus-tile cus-instr">
        <h4>Как ведём договор — инструкции${tip("По шагам: от подписания договора до закрытия объекта. Длинную инструкцию можно приложить файлом во «Прайсах и документах».")}</h4>
        <textarea data-k="instructions" placeholder="1. После подписания договора…&#10;2. Каждый месяц до 20 числа…"${ro()}>${esc(k.instructions)}</textarea>
      </section>
    </div>`;
  }

  function supHtml() {
    const opts = `<datalist id="cusSupOpts">${(L.suppliers || []).map((s) => `<option value="${esc(s.name)}"></option>`).join("")}</datalist>`;
    const rows = C.suppliers.map((s) => `<tr data-sid="${esc(s.id)}">
        <td><div class="cus-sname">
          <input data-sf="name" value="${esc(s.name)}" title="${esc(s.name)}" list="cusSupOpts" autocomplete="off"${ro()}>
          <span class="cus-dir${s.supplier_id ? " on" : ""}" title="${s.supplier_id ? "Поставщик из «Контрагентов»" : "Записан словами — в «Контрагентах» такого нет"}">${ICO.link}</span>
        </div></td>
        <td><textarea data-sf="what" rows="1" placeholder="Кабель, щиты…"${ro()}>${esc(s.what)}</textarea></td>
        <td><textarea data-sf="terms" rows="1" placeholder="По прайсу заказчика, скидка…"${ro()}>${esc(s.terms)}</textarea></td>
        <td><div class="cus-sfiles">${s.files.map((f) => `<button type="button" class="cus-fchip" data-open="${esc(f.id)}"
            title="${esc(f.filename)}">${ICO.file}<span>${esc(f.filename)}</span></button>`).join("")}
          ${C.edit ? `<label class="ico cus-upl" title="Приложить прайс поставщика">${ICO.up}<input type="file" data-ref="${esc(s.id)}" hidden></label>` : ""}
        </div></td>
        <td>${C.edit ? `<button type="button" class="ico warn" data-sdel="${esc(s.id)}" title="Убрать поставщика из карточки">${ICO.trash}</button>` : ""}</td>
      </tr>`).join("");
    return `${opts}<div class="cus-sup">
      <p class="cus-lead">Поставщики, у которых заказчик велит брать материалы, — и по каким ценам.</p>
      <table class="cus-t">
        <colgroup><col style="width:27%"><col style="width:27%"><col><col style="width:170px"><col style="width:40px"></colgroup>
        <thead><tr><th>Поставщик</th><th>Что берём у него</th><th>Цены и условия</th><th>Прайс</th><th></th></tr></thead>
        <tbody>${rows}${C.edit ? `<tr class="cus-new"><td colspan="5"><div class="cus-sname">
          <input id="cusSupNew" list="cusSupOpts" placeholder="Добавить поставщика — из «Контрагентов» или словами, Enter" autocomplete="off">
          </div></td></tr>` : ""}</tbody>
      </table>
      ${!C.suppliers.length && !C.edit ? `<div class="cus-none">Не записано</div>` : ""}
    </div>`;
  }

  const size = (n) => (n >= 1048576 ? (n / 1048576).toFixed(1).replace(".", ",") + " МБ"
    : Math.max(1, Math.round(n / 1024)) + " КБ");
  const day = (at) => (at ? at.slice(8, 10) + "." + at.slice(5, 7) + "." + at.slice(0, 4) : "");

  function filesHtml() {
    const files = allFiles();
    return `<div class="cus-files">
      ${C.edit ? `<div class="cus-fbar">
        ${seg("up", FILE_KINDS, upKind)}
        <label class="btn-ghost sm cus-fup">${ICO.up}Загрузить файл<input type="file" id="cusFile" multiple hidden></label>
        <span class="cus-hint">Особый прайс работ, инструкция, договор-образец. Прайс поставщика — в строке поставщика.</span>
      </div>` : ""}
      ${files.length ? `<table class="cus-t">
        <colgroup><col><col style="width:200px"><col style="width:30%"><col style="width:130px"><col style="width:40px"></colgroup>
        <thead><tr><th>Файл</th><th>Что это</th><th>Пометка</th><th>Загрузил</th><th></th></tr></thead>
        <tbody>${files.map((f) => `<tr data-fid="${esc(f.id)}">
          <td><button type="button" class="cus-fname" data-open="${esc(f.id)}" title="${VIEW.test(f.filename) ? "Открыть" : "Скачать"}">${ICO.file}<span>${esc(f.filename)}</span></button>
            <i class="cus-fsize">${size(f.size)}</i></td>
          <td><span class="cus-kind k-${esc(f.kind)}">${esc(f.kind_name)}${f.sup ? ` · ${esc(f.sup)}` : ""}</span></td>
          <td><input data-fnote="${esc(f.id)}" value="${esc(f.note)}" placeholder="${C.edit ? "Пометка — к чему, с какого числа" : ""}" autocomplete="off"${ro()}></td>
          <td><span class="cus-by">${esc(f.author)}<i>${day(f.at)}</i></span></td>
          <td>${C.edit ? `<button type="button" class="ico warn" data-fdel="${esc(f.id)}" title="Убрать файл">${ICO.trash}</button>` : ""}</td>
        </tr>`).join("")}</tbody></table>`
        : `<div class="pg-empty"><b>Файлов нет</b>${C.edit ? "Особые прайсы работ, инструкции и договоры-образцы заказчика — кнопкой «Загрузить файл»." : ""}</div>`}
    </div>`;
  }

  /* ── правка ──────────────────────────────────────────────── */
  function status(text, bad) {
    const el = $c("#cusSave", host);
    if (!el) return;
    if (text === undefined) text = pending ? "Сохраняю…" : "";
    el.textContent = text;
    el.classList.toggle("bad", !!bad);
  }

  // Ответ сервера — вся карточка: обновляем данные, а не перерисовываем
  // поля, в которые сейчас пишут. Перерисовка — только когда сменилось
  // устройство (строки, файлы).
  function took(id, got, repaint) {
    const row = L.rows.find((r) => r.id === id);
    if (row) {
      Object.assign(row, { doc_kind: got.card.doc_kind, pay_days: got.card.pay_days, filled: got.filled,
        suppliers: got.suppliers.length, files: got.files.length });
    }
    paintList();
    if (!C || C.customer.id !== id) return;
    C = got;
    if (repaint) { paintCard(); return; }
    const f = $c("#cusFill", host);
    if (f) {
      f.innerHTML = `Заполнено ${C.filled} из ${C.parts}<i><b style="width:${Math.round(C.filled / C.parts * 100)}%"></b></i>`;
    }
  }

  // Набранное и ещё не отправленное (длинный текст ждёт паузы) — отправить
  // сейчас: перед сменой заказчика и перерисовкой карточки.
  function flush() {
    Object.keys(timers).forEach((k) => {
      clearTimeout(timers[k].t);
      const fn = timers[k].fn;
      delete timers[k];
      fn();
    });
  }

  function send(method, url, body, repaint, cid) {
    const id = cid || C.customer.id;
    pending++;
    status();
    chain = chain.then(async () => {
      try {
        const got = await AUTH.api(method, "/customers/" + encodeURIComponent(id) + url, body);
        pending--;
        took(id, got, repaint);
        status(pending ? undefined : "Сохранено");
      } catch (e) {
        pending--;
        status("Не сохранилось: " + e.message, true);
      }
    });
    return chain;
  }

  function wirePane() {
    const p = $c("#cusPane", host);
    if (!p || !C.edit) {
      if (p) wireOpen(p);
      return;
    }
    // Чей это заказчик — запоминаем здесь: поле, сохраняемое по паузе,
    // может уйти уже после того, как открыли другого.
    const cid = C.customer.id, card = C.card;
    const patch = (body, repaint) => send("PATCH", "", body, repaint, cid);
    // Поле карточки: сохраняем при уходе с него, длинный текст — и по ходу.
    p.querySelectorAll("[data-k]").forEach((el) => {
      const k = el.dataset.k;
      const fire = () => {
        if (timers[k]) { clearTimeout(timers[k].t); delete timers[k]; }
        const v = el.value.trim();
        const was = card[k] === null || card[k] === undefined ? "" : String(card[k]);
        if (v === was || v.replace(",", ".") === was) return;
        card[k] = v;
        patch({ [k]: v });
      };
      el.addEventListener("change", fire);
      if (el.tagName === "TEXTAREA") {
        el.addEventListener("input", () => {
          if (timers[k]) clearTimeout(timers[k].t);
          timers[k] = { t: setTimeout(fire, 1200), fn: fire };
        });
      }
    });
    p.querySelectorAll("[data-seg]").forEach((g) => g.querySelectorAll("[data-v]").forEach((b) => b.addEventListener("click", () => {
      const k = g.dataset.seg;
      if (k === "up") {
        upKind = b.dataset.v;
        g.querySelectorAll("[data-v]").forEach((x) => x.classList.toggle("on", x === b));
        return;
      }
      // Щелчок по выбранному у «Как закрываем» снимает выбор.
      const v = k === "closing" && card[k] === b.dataset.v ? "" : b.dataset.v;
      card[k] = v;
      g.querySelectorAll("[data-v]").forEach((x) => x.classList.toggle("on", x.dataset.v === v));
      patch({ [k]: v }, k === "doc_kind");
    })));
    // Сроки — пары «что — когда»: уходят списком целиком.
    p.querySelectorAll("[data-pairs]").forEach((box) => {
      const k = box.dataset.pairs;
      const gather = () => [...box.querySelectorAll(".cus-pair")].map((r) => ({
        n: $c("[data-pn]", r).value.trim(), v: $c("[data-pv]", r).value.trim() })).filter((x) => x.n || x.v);
      const fire = () => {
        const list = gather();
        if (JSON.stringify(list) === JSON.stringify(card[k])) return;
        card[k] = list;
        patch({ [k]: list });
      };
      const wireRow = (r) => {
        r.querySelectorAll("input").forEach((i) => i.addEventListener("change", fire));
        const del = $c("[data-unpair]", r);
        if (del) del.addEventListener("click", () => { r.remove(); fire(); });
      };
      box.querySelectorAll(".cus-pair").forEach(wireRow);
      const add = $c(`[data-add="${k}"]`, p);
      if (add) {
        add.addEventListener("click", () => {
          const none = $c(".cus-none", box);
          if (none) none.remove();
          box.insertAdjacentHTML("beforeend", pairRow({ n: "", v: "" }, PH[k]));
          const r = box.lastElementChild;
          wireRow(r);
          $c("[data-pn]", r).focus();
        });
      }
    });
    // Поставщики заказчика.
    p.querySelectorAll("tr[data-sid]").forEach((tr) => {
      const sid = tr.dataset.sid;
      tr.querySelectorAll("[data-sf]").forEach((el) => {
        el.addEventListener("change", () => {
          const f = el.dataset.sf, v = el.value.trim();
          const cur = C.suppliers.find((s) => s.id === sid);
          if (!cur || v === cur[f]) return;
          if (f === "name") {
            if (!v) { el.value = cur.name; return; }
            const hit = supByName(v);
            const mark = $c(".cus-dir", tr);
            if (mark) mark.classList.toggle("on", !!hit);
            cur.name = hit ? hit.name : v;
            send("PATCH", "/suppliers/" + encodeURIComponent(sid), hit ? { supplier_id: hit.id } : { supplier_id: "", name: v },
              false, cid);
          } else {
            cur[f] = v;
            send("PATCH", "/suppliers/" + encodeURIComponent(sid), { [f]: v }, false, cid);
          }
        });
      });
    });
    const add = $c("#cusSupNew", p);
    if (add) {
      const go = () => {
        const v = add.value.trim();
        if (!v) return;
        add.value = "";
        const hit = supByName(v);
        send("POST", "/suppliers", hit ? { supplier_id: hit.id } : { name: v }, true, cid).then(() => {
          const last = [...host.querySelectorAll("tr[data-sid]")].pop();
          const w = last && $c('[data-sf="what"]', last);
          if (w) w.focus();
        });
      };
      add.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); go(); } });
      add.addEventListener("change", () => { if (supByName(add.value.trim())) go(); });
    }
    p.querySelectorAll("[data-sdel]").forEach((b) => b.addEventListener("click", async () => {
      const s = C.suppliers.find((x) => x.id === b.dataset.sdel);
      if (!(await ASK.confirm(`Убрать «${s.name}» из поставщиков заказчика?${s.files.length
        ? " Его прайсы останутся во «Прайсах и документах»." : ""}`))) return;
      send("DELETE", "/suppliers/" + encodeURIComponent(s.id), undefined, true, cid);
    }));
    p.querySelectorAll("input[type=file]").forEach((inp) => inp.addEventListener("change", () => {
      const files = [...inp.files];
      inp.value = "";
      if (files.length) upload(files, inp.dataset.ref || "");
    }));
    p.querySelectorAll("[data-fnote]").forEach((el) => el.addEventListener("change", () => {
      send("PATCH", "/files/" + encodeURIComponent(el.dataset.fnote), { note: el.value.trim() }, false, cid);
    }));
    p.querySelectorAll("[data-fdel]").forEach((b) => b.addEventListener("click", async () => {
      const f = allFiles().find((x) => x.id === b.dataset.fdel);
      if (!(await ASK.confirm(`Убрать файл «${f.filename}» из карточки?`))) return;
      send("DELETE", "/files/" + encodeURIComponent(f.id), undefined, true, cid);
    }));
    wireOpen(p);
  }

  function wireOpen(p) {
    p.querySelectorAll("[data-open]").forEach((b) => b.addEventListener("click", () => {
      const f = allFiles().find((x) => x.id === b.dataset.open);
      if (!f) return;
      const url = "/api/customers/" + encodeURIComponent(C.customer.id) + "/files/" + encodeURIComponent(f.id);
      (VIEW.test(f.filename) ? DL.open(url, { btn: b }) : DL.save(url, { btn: b, name: f.filename }))
        .catch((e) => ASK.alert(e.message, { title: "Файл не открылся" }));
    }));
    p.querySelectorAll("textarea[data-sf]").forEach(autoGrow);
  }

  function autoGrow(el) {
    const fit = () => { el.style.height = "auto"; el.style.height = Math.min(el.scrollHeight + 2, 140) + "px"; };
    el.addEventListener("input", fit);
    requestAnimationFrame(fit);
  }

  function supByName(v) {
    const k = v.trim().toLowerCase();
    return (L.suppliers || []).find((s) => s.name.trim().toLowerCase() === k) || null;
  }

  async function upload(files, ref) {
    const id = C.customer.id;
    for (const f of files) {
      pending++;
      status("Загружаю «" + f.name + "»…");
      try {
        const r = await fetch("/api/customers/" + encodeURIComponent(id) + "/files", {
          method: "POST",
          headers: { Authorization: "Bearer " + AUTH.token(), "X-File-Name": encodeURIComponent(f.name),
                     "X-Cus-Kind": ref ? "supplier" : upKind, "X-Cus-Ref": encodeURIComponent(ref),
                     "Content-Type": f.type || "application/octet-stream" },
          body: f,
        });
        let x = null;
        try { x = await r.json(); } catch (e) { /* ответил не сервер приложения */ }
        pending--;
        if (!r.ok) {
          throw new Error((x && x.error) || (r.status === 413 ? "Файл больше, чем принимает сервер"
            : "Не удалось загрузить, ответ сервера " + r.status));
        }
        took(id, x, true);
        status("Загружено");
      } catch (e) {
        if (pending > 0 && e instanceof TypeError) pending--;
        status("«" + f.name + "» не загрузился: " + e.message, true);
        return;
      }
    }
  }

  /* Открыть карточку заказчика из другого места. */
  function open(id) {
    if (id) { sel = id; mem(SEL_KEY, id); C = null; }
    if (typeof REFS === "object") REFS.open("cus");
  }

  return { load, open };
})();
