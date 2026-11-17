/* Раздел «Финансы» (08.10.2026), вкладка «Бюджет».

   Заказчик: «бюджет собирается из калькуляции, которая перешла в
   проработку объекта. К позициям по материалу — объём, наименьший из двух:
   по спецификации договора и расчётный, который инженер ПТО вносит руками.
   Цена — выбранная по лучшей приведённой стоимости в проработке; рядом —
   фактически закупленная».

   Здесь ничего не вписывают: объём ПТО правят в «Объекты → ПТО →
   Спецификация», факт закупки — в «Снабжение → Проработка объекта».
   Бюджет — одна проработка: список, потом таблица.

   Вкладка «Параметры для расчёта» (09.10.2026) — % ВКЛ, ставка
   возобновляемой кредитной линии: по ней «Снабжение» выбирает поставщика.
   Рисует её модуль настроек (SETTINGS, вид "fin") — тот же, что наценку и
   НДС в «Тендере». */
"use strict";

const FIN = (() => {
  const $f = (s, r) => (r || document).querySelector(s);
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const tip = (t) => (typeof TIPS === "object" ? TIPS.icon(t) : "");
  const money = (n) => (n === null || n === undefined || n === "") ? ""
    : Number(n).toLocaleString("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const qtyTxt = (n) => (n === null || n === undefined || n === "") ? ""
    : Number(n).toLocaleString("ru-RU", { maximumFractionDigits: 3 });
  const dmy = (s) => String(s || "").slice(0, 10).split("-").reverse().join(".");
  const svg = (d) => `<svg viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
  const ICO = {
    back: svg('<path d="M15 6l-6 6 6 6"/>'),
    go: svg('<path d="M9 6l6 6-6 6"/>'),
    find: svg('<circle cx="11" cy="11" r="6.5"/><path d="M20.5 20.5 16 16"/>'),
    lock: svg('<rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/>'),
    cols: svg('<rect x="3.5" y="4.5" width="17" height="15" rx="2"/><path d="M9.5 4.5v15M14.5 4.5v15"/>'),
  };

  const QTY_TIP = "В бюджет идёт меньший из двух объёмов: по спецификации договора и расчётный, который "
    + "инженер вписал в «Объекты → ПТО → Спецификация». Расчёта нет — объём по договору.";
  const PRICE_TIP = "Цена поставщика, выбранного в «Снабжение → Проработка объекта» по лучшей приведённой "
    + "стоимости (с учётом отсрочки и срока).";
  const FACT_TIP = "Цена, по которой фактически купили, — вписывают в проработке, колонка «Цена закупки». "
    + "Сумма факта — на объём бюджета.";
  const CUT_TIP = "Насколько объём ПТО меньше договорного — в деньгах по цене выбора.";

  /* Открытая вкладка — в браузере: обновление страницы не уводит с неё. */
  const TAB_KEY = "karkas.fin.tab.v1";
  let tab = (() => {
    try { return localStorage.getItem(TAB_KEY) === "par" ? "par" : "bud"; } catch (e) { return "bud"; }
  })();
  const TABS = [["bud", "Бюджет"], ["par", "Параметры для расчёта"]];
  let LIST = null;
  let LQ = "";
  let openId = null;
  let CUR = null;
  let RQ = "";
  let RF = "";

  const main = () => $f("#finMain");

  function paintTabs() {
    const bar = $f("#finTabs");
    if (!bar) return;
    // Открытый бюджет — во весь экран, со своей стрелкой «назад».
    bar.hidden = tab === "bud" && !!openId;
    bar.innerHTML = TABS.map(([k, t]) => `<button type="button" class="pg-tab${
      tab === k ? " on" : ""}" data-ft="${k}">${t}</button>`).join("");
    bar.querySelectorAll("[data-ft]").forEach((b) => b.addEventListener("click", () => {
      if (b.dataset.ft !== tab) setTab(b.dataset.ft);
    }));
  }

  function setTab(t) {
    tab = t;
    try { localStorage.setItem(TAB_KEY, tab); } catch (e) { /* без памяти */ }
    show();
  }

  async function show() {
    if (!main()) return;
    paintTabs();
    if (tab === "par") {
      main().innerHTML = `<div id="finSet" class="fin-set"></div>`;
      if (typeof SETTINGS === "object") SETTINGS.load("fin");
      return;
    }
    await load();
  }

  /* Открыть «Финансы» сразу на вкладке: «% ВКЛ» в проработке ведёт сюда. */
  function open(t) {
    if (TABS.some(([k]) => k === t)) {
      tab = t;
      try { localStorage.setItem(TAB_KEY, tab); } catch (e) { /* без памяти */ }
    }
    if (typeof openSection === "function") openSection("fin");
  }

  async function load() {
    try {
      if (openId) CUR = await AUTH.api("GET", "/budget/" + encodeURIComponent(openId));
      else LIST = await AUTH.api("GET", "/budget");
    } catch (e) {
      if (openId && /не найден/i.test(e.message)) { openId = null; CUR = null; return load(); }
      if (tab !== "bud") return;
      main().innerHTML = `<div class="pg"><div class="pg-note bad">${esc(e.message)}</div></div>`;
      return;
    }
    render();
  }

  function render() {
    paintTabs();
    const host = main();
    if (!host || tab !== "bud") return;
    if (openId && CUR) {
      host.innerHTML = budHtml();
      wireBud(host);
    } else {
      host.innerHTML = listHtml();
      wireList(host);
    }
  }

  /* ── список бюджетов ─────────────────────────────────────── */
  function listHtml() {
    const all = LIST ? LIST.rows : [];
    const q = LQ.trim().toLowerCase();
    const rows = all.filter((r) => !q || [r.site, r.title].some((x) => String(x || "").toLowerCase().includes(q)));
    return `
      <div class="pg sx snb-list fin-list">
        <div class="pg-head sx-head">
          <label class="pg-find sx-q">${ICO.find}<input id="finQ" type="search" placeholder="Объект, калькуляция"
            value="${esc(LQ)}" autocomplete="off"></label>
          <span class="grow"></span>
          ${tip("Бюджет объекта — из калькуляции, переданной в «Снабжение»: объём — меньший из договорного и "
            + "расчёта ПТО, цена — выбор по приведённой стоимости, рядом факт закупки. Здесь ничего не вписывают.")}
        </div>
        <div class="pg-body">${rows.length ? `
          <table class="tbl sx-tbl snb-ltbl" style="--tbl-min:980px">
            <colgroup><col class="c-obj"><col class="c-calc"><col class="c-sum"><col class="c-sum"><col class="c-sum">
              <col class="c-cov"><col class="c-go"></colgroup>
            <thead><tr><th>Объект</th><th>Калькуляция</th>
              <th class="num">По договору${tip("Вся калькуляция по договору: материалы и работы.")}</th>
              <th class="num">Бюджет закупки${tip(QTY_TIP)}</th>
              <th class="num">Факт закупки${tip(FACT_TIP)}</th>
              <th>Объём ПТО${tip("У скольких позиций, которые покупаем, есть расчётный объём ПТО.")}</th><th></th></tr></thead>
            <tbody>${rows.map((r) => {
              const t = r.totals || {};
              return `<tr class="go" data-id="${esc(r.id)}">
                <td><span class="t-name">${esc(r.site)}</span></td>
                <td><span class="snb-calc">${esc(r.title)}</span>${r.version ? `<i class="t-sub">${ICO.lock}${
                  esc(r.version.name)} от ${esc(dmy(r.version.at))}</i>` : ""}${r.versions_n ? `<i class="t-sub fin-vn">${
                  r.versions_n} ${plural(r.versions_n, "версия", "версии", "версий")} бюджета</i>` : ""}</td>
                <td class="num">${money(t.contract)}</td>
                <td class="num"><b class="tnd-sum">${money(t.budget)}</b>${t.cut ? `<i class="t-sub snb-d good">объём ПТО −${money(t.cut)}</i>` : ""}</td>
                <td class="num">${t.fact_n ? `${money(t.fact)}<i class="t-sub">${t.fact_n} поз.</i>` : `<span class="sx-none">—</span>`}</td>
                <td><span class="snb-cov"><b>${t.pto_n || 0}</b> из ${t.count || 0}</span></td>
                <td class="go-c"><button type="button" class="t-go" title="Открыть бюджет">${ICO.go}</button></td>
              </tr>`;
            }).join("")}</tbody>
          </table>` : `<div class="pg-empty"><b>${all.length ? "Ничего не нашлось" : "Бюджетов пока нет"}</b>${all.length
            ? "Очистите поиск." : `Бюджет появляется, когда калькуляцию объекта передают в «Снабжение»: в расчёте
              «Тендера» — кнопка «Передать на проработку».`}</div>`}
        </div>
      </div>`;
  }

  function wireList(host) {
    const q = $f("#finQ", host);
    if (q) q.addEventListener("input", () => {
      LQ = q.value;
      const tmp = document.createElement("div");
      tmp.innerHTML = listHtml();
      $f(".pg-body", host).replaceWith($f(".pg-body", tmp));
      wireRows(host);
    });
    wireRows(host);
  }

  function wireRows(host) {
    host.querySelectorAll("tr.go[data-id]").forEach((tr) => tr.addEventListener("click", () => {
      openId = tr.dataset.id;
      CUR = null;
      VER = null;
      colsOpen = false;
      RQ = "";
      RF = "";
      load();
    }));
  }

  /* ── бюджет проработки ───────────────────────────────────── */
  /* Колонки (заказчик, 09.10.2026: «для удобства — скрывать колонки»). g —
     группа в шапке; lock — не прячутся: номер и наименование держат строку;
     ver — только у зафиксированной версии: «Сейчас» сверяет её с живым
     бюджетом. Что спрятано — помнит браузер. */
  const GROUPS = {
    spec: { t: "Спецификация" },
    qty: { t: "Объём", cls: "fin-gq", tip: () => QTY_TIP },
    fix: { t: "По договору", cls: "snb-gfix", lock: true },
    bud: { t: "Бюджет закупки", cls: "snb-gbest", tip: () => PRICE_TIP },
    fact: { t: "Факт", cls: "fin-gf", tip: () => FACT_TIP },
    now: { t: "Сейчас", cls: "fin-gnow", tip: () => NOW_TIP },
  };
  const COLS = [
    { k: "no", g: "spec", t: "№", w: 72, lock: true },
    { k: "name", g: "spec", t: "Наименование", w: 300, lock: true },
    { k: "brand", g: "spec", t: "Тип, марка", w: 150 },
    { k: "unit", g: "spec", t: "Ед.", w: 54 },
    { k: "qty", g: "qty", t: "По договору", w: 86, num: true },
    { k: "pto", g: "qty", t: "Расчёт ПТО", w: 86, num: true, title: "Расчётный объём ПТО" },
    { k: "qb", g: "qty", t: "В бюджет", w: 86, num: true, title: QTY_TIP },
    { k: "con", g: "fix", t: "Мат. за ед.", w: 96, num: true, title: "Материал за единицу по договору — с наценкой" },
    { k: "csum", g: "fix", t: "Материалы", w: 112, num: true },
    { k: "work", g: "fix", t: "Работы", w: 112, num: true },
    { k: "price", g: "bud", t: "Цена", w: 98, num: true },
    { k: "who", g: "bud", t: "Поставщик", w: 160 },
    { k: "bsum", g: "bud", t: "Сумма", w: 112, num: true },
    { k: "fprice", g: "fact", t: "Цена", w: 98, num: true },
    { k: "fsum", g: "fact", t: "Сумма", w: 112, num: true },
    { k: "fdelta", g: "fact", t: "Разница", w: 112, num: true, title: "Факт минус бюджет" },
    { k: "nsum", g: "now", t: "Бюджет сейчас", w: 118, num: true, ver: true },
    { k: "ndelta", g: "now", t: "Изменение", w: 112, num: true, ver: true,
      title: "Сколько позиция стоит в бюджете сейчас минус сколько стоила в версии" },
  ];
  const NOW_TIP = "Тот же бюджет сегодня: проработка живая, и цены, поставщики, объёмы ПТО с момента "
    + "фиксации могли поменяться. «Изменение» — сейчас минус версия.";
  const HIDE_KEY = "karkas.fin.cols.v1";
  const HIDE = (() => {
    try { return new Set(JSON.parse(localStorage.getItem(HIDE_KEY) || "[]")); } catch (e) { return new Set(); }
  })();
  const saveHide = () => { try { localStorage.setItem(HIDE_KEY, JSON.stringify([...HIDE])); } catch (e) { /* без памяти */ } };
  let VER = null;          // открытая версия: {version, rows}; null — живой бюджет
  let colsOpen = false;

  const shown = () => COLS.filter((c) => (!c.ver || VER) && (c.lock || !HIDE.has(c.k)));
  const viewRows = () => (VER ? VER.rows : CUR.rows);
  const has = (v) => v !== null && v !== undefined;
  const signed = (v) => (v > 0 ? "+" : "") + money(v);
  /* Строка живого бюджета для строки версии: по id, а если проработку
     передали заново и id сменились — по номеру и наименованию. */
  const nowOf = (() => {
    let src = null, byId = null, byKey = null;
    return (r) => {
      if (src !== CUR.rows) {
        src = CUR.rows;
        byId = new Map(src.map((x) => [x.id, x]));
        byKey = new Map(src.map((x) => [`${x.pos_no}|${x.name}`, x]));
      }
      return byId.get(r.id) || byKey.get(`${r.pos_no}|${r.name}`) || null;
    };
  })();

  function rowFilter(r) {
    if (r.kind === "section") return !RQ.trim() && !RF;
    if (RF === "pto" && !has(r.pto)) return false;
    if (RF === "fact" && !has(r.fact)) return false;
    if (RF === "none" && !(r.need && !has(r.price))) return false;
    if (RF === "chg" && !(VER && changed(r))) return false;
    const q = RQ.trim().toLowerCase();
    if (!q) return true;
    return q.split(/\s+/).every((w) => [r.pos_no, r.name, r.brand, r.code].join(" ").toLowerCase().includes(w));
  }

  function changed(r) {
    if (!r.need) return false;
    const n = nowOf(r);
    return !n || Math.abs((n.sum_bud || 0) - (r.sum_bud || 0)) > 0.005 || (n.who || "") !== (r.who || "");
  }

  /* В версии рядом с её числом — сегодняшнее и разница. */
  const nowPart = (v, now) => (VER && now !== undefined && Math.abs((now || 0) - (v || 0)) > 0.005
    ? ` <i class="fin-now" title="Сейчас ${money(now)}">${signed((now || 0) - (v || 0))}</i>` : "");

  function factsHtml() {
    const t = VER ? VER.version.totals : CUR.totals;
    const n = VER ? CUR.totals : {};
    return `<dl class="pg-facts">
      <div><dt>По договору</dt><dd title="Материалы ${money(t.contract_mat)}, работы ${money(t.contract_work)}">${money(t.contract)}</dd></div>
      <div><dt>Материалы по договору</dt><dd>${money(t.contract_mat)}</dd></div>
      <div><dt>Бюджет закупки${tip(QTY_TIP)}</dt><dd><b>${money(t.budget)}</b>${nowPart(t.budget, n.budget)}</dd></div>
      <div><dt>Объём ПТО${tip(CUT_TIP)}</dt><dd>${t.pto_n} из ${t.count}${t.cut ? ` <i class="snb-d good">−${money(t.cut)}</i>` : ""}</dd></div>
      <div><dt>Факт закупки${tip(FACT_TIP)}</dt><dd>${t.fact_n ? `${money(t.fact)} <i class="fin-n">${t.fact_n} поз.</i>` : "—"}${
        nowPart(t.fact, n.fact)}</dd></div>
      <div><dt>Факт против бюджета</dt><dd class="snb-d ${t.delta < 0 ? "good" : t.delta > 0 ? "bad" : ""}"
        title="По позициям, где есть факт: минус — купили дешевле бюджета">${t.fact_n ? signed(t.delta) : "—"}</dd></div>
    </dl>`;
  }

  /* Следующее имя — как на сервере: «Базовый», потом «Изм. 1», «Изм. 2»… */
  function nextName() {
    const vs = CUR.versions || [];
    if (!vs.length) return "Базовый";
    const nums = vs.map((v) => /^изм\.?\s*(\d+)$/i.exec(v.name.trim())).filter(Boolean).map((m) => +m[1]);
    return `Изм. ${Math.max(0, ...nums) + 1}`;
  }

  function verBarHtml() {
    const vs = CUR.versions || [];
    return `
      <label class="fin-ver" title="Зафиксированные версии бюджета — что было на дату фиксации">
        ${ICO.lock}<select id="finVer" class="role-sel" aria-label="Версия бюджета">
          <option value="">Текущий бюджет</option>
          ${vs.map((v) => `<option value="${esc(v.id)}"${VER && VER.version.id === v.id ? " selected" : ""}>${
            esc(v.name)} — ${esc(dmy(v.at))}</option>`).join("")}
        </select></label>
      ${VER ? "" : `<button type="button" class="btn-ghost sm" id="finFreeze"
        title="Сохранить бюджет как сейчас — строки, цены, поставщиков, объёмы, факт. Дальше он меняется, а версия — нет"
        >${ICO.lock}Зафиксировать</button>`}`;
  }

  function colsHtml() {
    const hid = COLS.filter((c) => !c.lock && HIDE.has(c.k) && (!c.ver || VER)).length;
    const groups = Object.keys(GROUPS).filter((g) => COLS.some((c) => c.g === g && !c.lock && (!c.ver || VER)));
    return `
      <span class="fin-cols-w">
        <button type="button" class="btn-ghost sm${hid ? " on" : ""}" id="finCols" aria-expanded="${colsOpen}"
          title="Какие колонки показывать">${ICO.cols}Колонки${hid ? `<i class="fin-cols-n">−${hid}</i>` : ""}</button>
        ${colsOpen ? `<div class="fin-cols-pop" id="finColsPop">
          ${groups.map((g) => `<div class="fin-cols-g"><b>${esc(GROUPS[g].t)}</b>${COLS.filter((c) => c.g === g && !c.lock
            && (!c.ver || VER)).map((c) => `<label><input type="checkbox" data-col="${c.k}"${HIDE.has(c.k) ? "" : " checked"}>${
            esc(c.t)}</label>`).join("")}</div>`).join("")}
          <div class="fin-cols-foot"><button type="button" class="lnk" id="finColsAll"${hid ? "" : " disabled"}>Показать все</button></div>
        </div>` : ""}
      </span>`;
  }

  function budHtml() {
    const s = CUR.supply;
    const items = viewRows().filter((r) => r.kind !== "section" && r.need);
    const n = (f) => items.filter(f).length;
    const v = VER && VER.version;
    return `
      <div class="pg snb-proc fin-bud${VER ? " fin-isver" : ""}">
        <div class="pg-head strip calc-head two">
          <button type="button" class="pg-back" id="finBack" title="Все бюджеты" aria-label="Все бюджеты">${ICO.back}</button>
          <div class="pg-h1">
            <button type="button" class="calc-obj" id="finObj" title="Все бюджеты">${esc(s.site)}</button>
            <h2 title="${esc(s.title)}">Бюджет · ${esc(s.title)}</h2>
          </div>
          ${s.version ? `<span class="snb-ver" title="Цены по договору — версия калькуляции, переданная в «Снабжение»">${
            ICO.lock}${esc(s.version.name)} от ${esc(dmy(s.version.at))}</span>` : ""}
          ${factsHtml()}
        </div>
        ${v ? `<div class="fin-verbar">
          ${ICO.lock}<span><b>Версия «${esc(v.name)}»</b> — зафиксирована ${esc(stamp(v.at))}${v.author ? `, ${esc(v.author)}` : ""}${
            v.note ? ` · ${esc(v.note)}` : ""}. Цифры — как были на тот момент; «Сейчас» — тот же бюджет сегодня.</span>
          <span class="grow"></span>
          <button type="button" class="lnk warn" id="finVerDel">Удалить версию</button>
          <button type="button" class="btn-ghost sm" id="finVerOff">К текущему бюджету</button>
        </div>` : ""}
        <div class="snb-bar">
          <label class="pg-find">${ICO.find}<input id="finRq" type="search" placeholder="Позиция, марка, код"
            value="${esc(RQ)}" autocomplete="off"></label>
          <span class="seg" role="group" aria-label="Какие позиции показать">
            <button type="button" class="seg-b${RF ? "" : " on"}" data-rf="">Все</button>
            <button type="button" class="seg-b${RF === "pto" ? " on" : ""}" data-rf="pto">С расчётом ПТО<i>${n((r) => has(r.pto))}</i></button>
            <button type="button" class="seg-b${RF === "fact" ? " on" : ""}" data-rf="fact">С фактом<i>${n((r) => has(r.fact))}</i></button>
            <button type="button" class="seg-b${RF === "none" ? " on" : ""}" data-rf="none">Без цены<i>${n((r) => !has(r.price))}</i></button>
            ${VER ? `<button type="button" class="seg-b${RF === "chg" ? " on" : ""}" data-rf="chg"
              title="Позиции, у которых с фиксации поменялась сумма или поставщик">Изменились<i>${n(changed)}</i></button>` : ""}
          </span>
          <span class="grow"></span>
          ${verBarHtml()}
          ${colsHtml()}
          ${tip("Объём ПТО вписывают в «Объекты → ПТО → Спецификация», факт закупки — в «Снабжение → Проработка объекта». "
            + "Здесь только смотрят и фиксируют версии.")}
        </div>
        <div class="pg-body snb-body">${tableHtml()}</div>
      </div>`;
  }

  function tableHtml() {
    const cols = shown();
    const rows = viewRows().filter(rowFilter);
    const width = cols.reduce((a, c) => a + c.w, 0);
    // Шапка групп: «Спецификация» липнет над номером и наименованием, марка
    // и единица — под пустой ячейкой той же группы.
    const heads = [];
    for (const c of cols) {
      const last = heads[heads.length - 1];
      const key = c.g === "spec" ? (c.lock ? "spec" : "spec2") : c.g;
      if (last && last.key === key) last.n++;
      else heads.push({ key, g: c.g, n: 1 });
    }
    const grpTh = (h) => {
      if (h.key === "spec") return `<th colspan="${h.n}" class="grp spec s-froze">Спецификация</th>`;
      if (h.key === "spec2") return `<th colspan="${h.n}" class="grp spec"></th>`;
      const G = GROUPS[h.g];
      return `<th colspan="${h.n}" class="grp ${G.cls}">${G.lock ? ICO.lock + " " : ""}${esc(G.t)}${G.tip ? tip(G.tip()) : ""}</th>`;
    };
    const colTh = (c) => `<th class="${c.k === "no" ? "s-no" : c.k === "name" ? "s-name" : c.num ? "num" : ""}"${
      c.title ? ` title="${esc(c.title)}"` : ""}>${esc(c.t)}</th>`;
    return `
      <table class="tbl pos-tbl calc-tbl snb-tbl fin-tbl" style="--tbl-min:${width}px">
        <colgroup>${cols.map((c) => `<col${c.k === "no" ? ' class="s-no"' : c.k === "name" ? ' class="s-name"' : ""
          } style="width:${c.w}px">`).join("")}</colgroup>
        <thead><tr>${heads.map(grpTh).join("")}</tr><tr>${cols.map(colTh).join("")}</tr></thead>
        <tbody>${rows.length ? rows.map((r) => rowHtml(r, cols)).join("")
          : `<tr><td colspan="${cols.length}" class="snb-none">Ничего не нашлось</td></tr>`}</tbody>
      </table>`;
  }

  function cellHtml(k, r) {
    const less = has(r.pto) && r.qty !== null && r.pto < r.qty;
    switch (k) {
      case "no": return `<td class="s-no" title="${esc(r.pos_no)}">${esc(r.pos_no)}</td>`;
      case "name": return `<td class="s-name"><span class="nm" title="${esc(r.name)}">${esc(r.name)}</span>${r.in_set
        ? `<i class="snb-sub">в составе ${esc(r.in_set)} — цена у щита</i>` : r.skip ? '<i class="snb-sub"><b class="snb-nc">не в договоре</b></i>' : ""}</td>`;
      case "brand": return `<td class="snb-tx" title="${esc(r.brand)}">${esc(r.brand)}</td>`;
      case "unit": return `<td>${esc(r.unit)}</td>`;
      case "qty": return `<td class="num">${qtyTxt(r.qty)}</td>`;
      case "pto": return `<td class="num fin-pto${has(r.pto) ? " has" : ""}">${qtyTxt(r.pto)}</td>`;
      case "qb": return `<td class="num fin-qb${less ? " less" : ""}" title="${esc(less ? `Расчёт ПТО меньше договорного на ${qtyTxt(r.qty - r.pto)}` : "")}">${r.need ? qtyTxt(r.qty_bud) : ""}</td>`;
      case "con": return `<td class="num snb-fix">${r.contract ? money(r.contract) : ""}</td>`;
      case "csum": return `<td class="num snb-fix">${money(r.contract_sum)}</td>`;
      case "work": return `<td class="num snb-fix">${money(r.work_sum)}</td>`;
      case "price": return `<td class="num snb-best${has(r.price) ? "" : r.need ? " none" : ""}">${has(r.price)
        ? money(r.price) : r.need ? "—" : ""}</td>`;
      case "who": return `<td class="snb-who${r.who ? " has" : ""}" title="${esc(r.who)}">${esc(r.who)}</td>`;
      case "bsum": return `<td class="num snb-bsum${has(r.sum_bud) ? " has" : ""}">${money(r.sum_bud)}</td>`;
      case "fprice": return `<td class="num fin-fact${has(r.fact) ? " has" : ""}">${money(r.fact)}</td>`;
      case "fsum": return `<td class="num fin-fact${has(r.sum_fact) ? " has" : ""}">${money(r.sum_fact)}</td>`;
      case "fdelta": return `<td class="num snb-d ${r.delta < 0 ? "good" : r.delta > 0 ? "bad" : ""}">${has(r.delta) ? signed(r.delta) : ""}</td>`;
      case "nsum": {
        if (!r.need) return `<td class="num fin-nowc"></td>`;
        const n = nowOf(r);
        if (!n) return `<td class="num fin-nowc"><span class="dim" title="Позиции больше нет в проработке">нет</span></td>`;
        return `<td class="num fin-nowc" title="${esc(n.who ? `Поставщик сейчас: ${n.who}` : "")}">${money(n.sum_bud)}</td>`;
      }
      case "ndelta": {
        const n = r.need ? nowOf(r) : null;
        if (!n) return `<td class="num fin-nowc"></td>`;
        const d = (n.sum_bud || 0) - (r.sum_bud || 0);
        return `<td class="num fin-nowc snb-d ${d < -0.005 ? "good" : d > 0.005 ? "bad" : ""}">${
          Math.abs(d) > 0.005 ? signed(d) : ""}</td>`;
      }
      default: return "<td></td>";
    }
  }

  function rowHtml(r, cols) {
    if (r.kind === "section") {
      return `<tr class="sec"><td colspan="${cols.length}" class="sec-name"><span class="sec-in">${esc(r.name)}</span></td></tr>`;
    }
    return `<tr class="${r.need ? "" : "snb-off"}">${cols.map((c) => cellHtml(c.k, r)).join("")}</tr>`;
  }

  const stamp = (iso) => {
    const d = new Date(iso);
    return isNaN(d) ? dmy(iso) : d.toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric",
                                                             hour: "2-digit", minute: "2-digit" });
  };

  function repaintTable(host) {
    const body = $f(".snb-body", host);
    if (body) body.innerHTML = tableHtml();
  }

  function wireBud(host) {
    const back = () => { openId = null; CUR = null; VER = null; colsOpen = false; load(); };
    $f("#finBack", host).addEventListener("click", back);
    $f("#finObj", host).addEventListener("click", back);
    if (typeof GRID === "object" && GRID.pan) GRID.pan($f(".snb-body", host));
    const rq = $f("#finRq", host);
    rq.addEventListener("input", () => { RQ = rq.value; repaintTable(host); });
    host.querySelectorAll("[data-rf]").forEach((b) => b.addEventListener("click", () => {
      RF = b.dataset.rf;
      render();
    }));

    const ver = $f("#finVer", host);
    if (ver) ver.addEventListener("change", async () => {
      const id = ver.value;
      if (!id) { VER = null; if (RF === "chg") RF = ""; render(); return; }
      try {
        // «Сейчас» сверяем со свежим бюджетом: страница могла простоять час.
        const [res, cur] = await Promise.all([
          AUTH.api("GET", "/budget/versions/" + encodeURIComponent(id)),
          AUTH.api("GET", "/budget/" + encodeURIComponent(openId))]);
        CUR = cur;
        VER = { version: res.version, rows: res.rows };
        render();
      } catch (e) { ASK.alert("Версия не открылась: " + e.message); ver.value = ""; }
    });
    const freeze = $f("#finFreeze", host);
    if (freeze) freeze.addEventListener("click", async () => {
      const name = await ASK.prompt("Зафиксировать бюджет как сейчас — строки, цены, поставщиков, объёмы ПТО и факт. "
        + "Название версии:", nextName());
      if (name === null || name === undefined) return;
      freeze.disabled = true;
      try {
        const res = await AUTH.api("POST", "/budget/" + encodeURIComponent(openId) + "/versions", { name });
        CUR.versions = res.versions;
        render();
        flash(`Зафиксировано: «${res.version.name}». Открыть её можно в списке версий`);
      } catch (e) { freeze.disabled = false; ASK.alert("Не зафиксировалось: " + e.message); }
    });
    const off = $f("#finVerOff", host);
    if (off) off.addEventListener("click", () => { VER = null; if (RF === "chg") RF = ""; render(); });
    const del = $f("#finVerDel", host);
    if (del) del.addEventListener("click", async () => {
      if (!(await ASK.confirm(`Удалить версию «${VER.version.name}»? Сам бюджет не изменится.`))) return;
      try {
        const res = await AUTH.api("DELETE", "/budget/versions/" + encodeURIComponent(VER.version.id));
        CUR.versions = res.versions;
        VER = null;
        if (RF === "chg") RF = "";
        render();
      } catch (e) { ASK.alert("Не удалилась: " + e.message); }
    });

    // «Колонки»: щелчок по галочке прячет или показывает колонку сразу.
    wireCols(host);
  }

  function wireCols(host) {
    // Обёртка «Колонок» перерисовывается целиком — у новой кнопки один слушатель.
    const btn = $f("#finCols", host);
    if (btn) btn.addEventListener("click", (e) => {
      e.stopPropagation();
      colsOpen = !colsOpen;
      $f(".fin-cols-w", host).outerHTML = colsHtml();
      wireCols(host);
    });
    const pop = $f("#finColsPop", host);
    if (!pop) return;
    pop.addEventListener("click", (e) => e.stopPropagation());
    pop.querySelectorAll("[data-col]").forEach((x) => x.addEventListener("change", () => {
      if (x.checked) HIDE.delete(x.dataset.col); else HIDE.add(x.dataset.col);
      saveHide();
      repaintTable(host);
      const all = $f("#finColsAll", host);
      const hid = COLS.filter((c) => !c.lock && HIDE.has(c.k) && (!c.ver || VER)).length;
      if (all) all.disabled = !hid;
      const n = $f("#finCols", host);
      n.classList.toggle("on", !!hid);
      n.innerHTML = `${ICO.cols}Колонки${hid ? `<i class="fin-cols-n">−${hid}</i>` : ""}`;
    }));
    const all = $f("#finColsAll", host);
    if (all) all.addEventListener("click", () => {
      for (const c of COLS) if (!c.ver || VER) HIDE.delete(c.k);
      saveHide();
      repaintTable(host);
      $f(".fin-cols-w", host).outerHTML = colsHtml();
      wireCols(host);
    });
    // Щелчок мимо и Escape закрывают список.
    const shut = (e) => {
      if (e.type === "keydown" && e.key !== "Escape") return;
      document.removeEventListener("click", shut);
      document.removeEventListener("keydown", shut);
      if (!colsOpen) return;
      colsOpen = false;
      const w = $f(".fin-cols-w", host);
      if (w) { w.outerHTML = colsHtml(); wireCols(host); }
    };
    setTimeout(() => {
      document.addEventListener("click", shut);
      document.addEventListener("keydown", shut);
    });
  }

  /* Короткое сообщение над таблицей — «зафиксировано». */
  function flash(text) {
    const bar = $f(".snb-bar", main());
    if (!bar) return;
    let el = $f(".fin-flash", bar);
    if (!el) {
      el = document.createElement("span");
      el.className = "sit-hint fin-flash";
      bar.insertBefore(el, $f(".grow", bar));
    }
    el.textContent = text;
    setTimeout(() => { if (el.isConnected) el.remove(); }, 6000);
  }

  return { show, open };
})();
