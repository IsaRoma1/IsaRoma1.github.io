/* Раздел «Снабжение» (заказчик, 07.10.2026).

   «Здесь будет развиваться проработка проектов, подача и учёт заявок по
   объектам, остатки по материалам, учёт всего материала. Первое —
   проработка объекта. Объект попадает сюда из тендера: когда сформировали
   калькуляцию, кнопка „Передать на проработку“. Калькуляция передаётся вся,
   как есть, цены в ней зафиксированы — по ним договорились и подписали
   договор. Дальше — блок минимальной цены, как в прайсе материалов, каталоги
   трёх поставщиков и счета или прайсы конкретных поставщиков колонками, у
   каждого — цена и срок поставки. Смысл проработки: по позициям договора
   звонят поставщикам и спрашивают актуальные цены на поставку».

   Проработка — копия строк калькуляции на сервере (supply_* в api.py):
   спецификация, договорная цена за единицу и сумма (не меняются), блок
   минимальной цены — цена, поставщик, срок, сумма закупки, — каталоги и
   поставщики. Цену и срок поставщика вписывают руками (щелчок по клетке)
   или загружают счётом/КП в PDF или Excel: строки сопоставляются с
   позициями, человек сверяет и записывает.

   Три вкладки (заказчик, 20.10.2026): «Тендер» — тендерная проработка,
   предложения под тендер, выделяется максимум, она сама по себе;
   «Проработка» — выбор поставщиков на выигранный договор; «Рабочая» — та
   же проработка, переданная в работу: закупка, поставки, средняя цена,
   куплено и остаток. Данные проработки и рабочей общие. */
"use strict";

const SNAB = (() => {
  const $n = (s, r) => (r || document).querySelector(s);
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  // У вкладок раздела свои галочки в «Доступе» (08.10.2026).
  const has = (p) => AUTH.can(AUTH.current(), p);
  const can = () => has("snb_proc");
  const tip = (t) => (typeof TIPS === "object" ? TIPS.icon(t) : "");
  const money = (n) => (n === null || n === undefined || n === "") ? ""
    : Number(n).toLocaleString("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const qtyTxt = (n) => (n === null || n === undefined || n === "") ? ""
    : Number(n).toLocaleString("ru-RU", { maximumFractionDigits: 3 });
  const dmy = (s) => String(s || "").slice(0, 10).split("-").reverse().join(".");
  const plural = (n, one, few, many) => {
    const a = Math.abs(n) % 100, b = a % 10;
    if (a > 10 && a < 20) return many;
    if (b > 1 && b < 5) return few;
    return b === 1 ? one : many;
  };
  const svg = (d) => `<svg viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
  const ICO = {
    back: svg('<path d="M15 6l-6 6 6 6"/>'),
    go: svg('<path d="M9 6l6 6-6 6"/>'),
    find: svg('<circle cx="11" cy="11" r="6.5"/><path d="M20.5 20.5 16 16"/>'),
    box: svg('<path d="M3.5 7.6 12 3.2l8.5 4.4v8.8L12 20.8l-8.5-4.4z"/><path d="M3.5 7.6 12 12l8.5-4.4M12 12v8.8"/>'),
    up: svg('<path d="M12 16V4M7 9l5-5 5 5M4 17v2a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-2"/>'),
    down: svg('<path d="M12 4v11M7.5 10.5 12 15l4.5-4.5M4.5 20h15"/>'),
    mail: svg('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3.5 6.5 12 13l8.5-6.5"/>'),
    trash: svg('<path d="M4.5 6.5h15M9.5 6.5V4.8A1.3 1.3 0 0 1 10.8 3.5h2.4a1.3 1.3 0 0 1 1.3 1.3v1.7M6.5 6.5l.9 12.2A1.5 1.5 0 0 0 8.9 20h6.2a1.5 1.5 0 0 0 1.5-1.3l.9-12.2"/>'),
    lock: svg('<rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/>'),
    file: svg('<path d="M13 3H6.5A1.5 1.5 0 0 0 5 4.5v15A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5V9z"/><path d="M13 3v6h6"/>'),
    plus: svg('<path d="M12 5v14M5 12h14"/>'),
    no: svg('<path d="M7 7l10 10M17 7 7 17"/>'),
    clock: svg('<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>'),
    fold: svg('<path d="M14 6l-6 6 6 6"/>'),
    unfold: svg('<path d="M10 6l6 6-6 6"/>'),
    cog: svg('<circle cx="12" cy="12" r="3"/><path d="M12 3.5v2.2M12 18.3v2.2M3.5 12h2.2M18.3 12h2.2M6 6l1.6 1.6M16.4 16.4 18 18M6 18l1.6-1.6M16.4 7.6 18 6"/>'),
    pin: svg('<path d="M9.5 3.5h5l-.8 5.2 3.3 3.1v1.7H7v-1.7l3.3-3.1z"/><path d="M12 13.5v7"/>'),
    trophy: svg('<path d="M8 4h8v5a4 4 0 0 1-8 0z"/><path d="M8 6H5a2.5 2.5 0 0 0 3 4M16 6h3a2.5 2.5 0 0 1-3 4M12 13v4M8.5 20h7M10 17h4"/>'),
    scale: svg('<path d="M12 4v16M6 20h12M5 8h14M5 8l-2.5 6a2.5 2.5 0 0 0 5 0zM19 8l-2.5 6a2.5 2.5 0 0 0 5 0z"/>'),
    truck: svg('<path d="M3 6.5h11v9H3zM14 9.5h4l3 3v3h-7z"/><circle cx="7" cy="17.5" r="1.8"/><circle cx="17.5" cy="17.5" r="1.8"/>'),
    arrow: svg('<path d="M5 12h13M13 7l5 5-5 5"/>'),
    link: svg('<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>'),
    caret: svg('<path d="M7 10l5 5 5-5"/>'),
    edit: svg('<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>'),
    user: svg('<circle cx="12" cy="8.5" r="3.5"/><path d="M5 20a7 7 0 0 1 14 0"/>'),
    copy: svg('<rect x="8.5" y="8.5" width="11" height="12" rx="2"/><path d="M15.5 8.5V5.8a2 2 0 0 0-2-2H6.3a2 2 0 0 0-2 2v8.4a2 2 0 0 0 2 2h2.2"/>'),
    up2: svg('<path d="M6 15l6-6 6 6"/>'),
    down2: svg('<path d="M6 9l6 6 6-6"/>'),
  };

  let tab = "proc";        // proc — проработка объекта; orders — заявки (скоро)
  let LIST = null;         // {rows, statuses}
  let LF = "";             // отбор списка по статусу
  let LQ = "";             // поиск в списке
  let openId = null;       // открытая проработка
  let CUR = null;          // {supply, cols, rows, totals, invoices, buys, deliveries, pull}
  let RQ = "";             // поиск по позициям проработки
  let RF = "";             // "" — все, "none" — без цены, "inv" — с ценой поставщика, "off" — не в договоре
  let SIG = "";
  let WATCH = "";          // подбор каталогов, за которым следим
  /* Вкладка списка: tender — тендерная проработка, proc — проработка, work —
     рабочая (20.10.2026). Открытая проработка показывается таблицей выбора
     (VIEW proc) или рабочей — закупкой и поставками (VIEW work). */
  const LT_KEY = "snb.lt.v1";
  let LT = (() => {
    try { const v = localStorage.getItem(LT_KEY); return ["tender", "proc", "work"].includes(v) ? v : "proc"; }
    catch (e) { return "proc"; }
  })();
  const saveLT = () => { try { localStorage.setItem(LT_KEY, LT); } catch (e) { /* без памяти */ } };
  let VIEW = "proc";
  let WQ = "";             // поиск в рабочей
  let WF = "";             // отбор рабочей: none — не закуплено, part, full, over

  const main = () => $n("#snbMain");
  const isSup = (k) => String(k || "").startsWith("inv:");

  /* ── рамка раздела ───────────────────────────────────────── */
  // «Поставщики и группы» (12.10.2026): кто какие группы материалов возит — src/suppliers.js.
  const TABS = [["proc", "Проработка объекта", "snb_proc"], ["sup", "Поставщики и группы", "snb_sup"],
    ["orders", "Заявки", "snb_req"]];

  function paintTabs() {
    const bar = $n("#snbTabs");
    if (!bar) return;
    // Закрытая вкладка не показывается; открыта одна — на ней и стоим.
    const open = TABS.filter((t) => has(t[2]));
    if (!open.some((t) => t[0] === tab) && open.length) tab = open[0][0];
    bar.hidden = tab === "proc" && !!openId;
    bar.innerHTML = open.map(([k, name]) => `
      <button type="button" class="pg-tab${tab === k ? " on" : ""}" data-st="${k}">${name}</button>`).join("");
    bar.querySelectorAll("[data-st]").forEach((b) => b.addEventListener("click", () => {
      if (tab === b.dataset.st) return;
      tab = b.dataset.st;
      show();
    }));
  }

  async function show() {
    if (!main()) return;
    paintTabs();
    if (tab === "sup") {
      SIG = "";
      if (typeof SUPS === "object") SUPS.show(main());
      return;
    }
    if (tab === "orders") {
      SIG = "";
      // Заявки на материалы (22.10.2026) — свой раздел меню; здесь — сколько
      // ждёт заказа и в пути, и переход туда (src/req.js).
      main().innerHTML = `<div class="pg"><div class="pg-body" id="snbReqHost"></div></div>`;
      if (typeof REQ === "object") REQ.snabTab($n("#snbReqHost"));
      return;
    }
    await load();
  }

  async function load() {
    try {
      if (openId) {
        CUR = await AUTH.api("GET", "/supply/" + encodeURIComponent(openId));
      } else {
        LIST = await AUTH.api("GET", "/supply");
      }
    } catch (e) {
      if (openId && /не найден/i.test(e.message)) {
        openId = null;
        CUR = null;
        return load();
      }
      main().innerHTML = `<div class="pg"><div class="pg-note bad">${esc(e.message)}</div></div>`;
      return;
    }
    const sig = JSON.stringify([openId, VIEW, openId ? CUR : LIST, LT, LF, LQ, RQ, RF, WQ, WF]);
    if (sig === SIG && main().firstElementChild) return;
    SIG = sig;
    render();
  }

  // Рабочая — у проработки, переданной в работу; иначе — таблица выбора.
  const isWork = () => VIEW === "work" && CUR && CUR.supply.mode !== "tender" && !!CUR.supply.work;

  function render() {
    closePop();
    paintTabs();
    const host = main();
    if (!host || tab !== "proc") return;
    if (openId && CUR) {
      const body = $n(".snb-body", host);
      const keep = body ? [body.scrollTop, body.scrollLeft, body.dataset.view] : null;
      const work = isWork();
      host.innerHTML = work ? workHtml() : procHtml();
      if (work) wireWork(host); else wireProc(host);
      const now = $n(".snb-body", host);
      if (keep && now && keep[2] === now.dataset.view) { now.scrollTop = keep[0]; now.scrollLeft = keep[1]; }
      // Шапка свёрнута, а таблица снова наверху — шапку показываем.
      if (HEAD_MINI && now && now.scrollTop <= 4) {
        HEAD_MINI = false;
        const page = $n(".snb-proc", host);
        if (page) page.classList.remove("snb-mini");
        const b = $n("#snbMini", host);
        if (b) { b.innerHTML = ICO.up2; b.setAttribute("aria-expanded", "true"); }
      }
      if (CUR.pull && !work) watchPull(CUR.pull.job, CUR.pull.step);
    } else {
      host.innerHTML = listHtml();
      wireList(host);
    }
  }

  /* Открыть проработку снаружи — из расчёта «Тендера» или из объекта. kind —
     вкладка: tender, proc или work (рабочая открывается закупкой). */
  function open(id, kind) {
    openId = id || null;
    if (["tender", "proc", "work"].includes(kind)) { LT = kind; saveLT(); }
    VIEW = kind === "work" ? "work" : "proc";
    tab = "proc";
    CUR = null;
    SIG = "";
    if (typeof openSection === "function") openSection("snb");
  }

  const kindOf = (r) => (r.mode === "tender" ? "tender" : r.work ? "work" : "proc");

  /* Проработки объекта: одна — сразу она, несколько — список с поиском
     по объекту. */
  async function openSite(siteId, siteName) {
    let rows = [];
    try {
      rows = (await AUTH.api("GET", "/supply?site=" + encodeURIComponent(siteId))).rows || [];
    } catch (e) { /* откроем общий список */ }
    if (rows.length === 1) return open(rows[0].id, kindOf(rows[0]));
    LQ = rows.length ? (rows[0].site || siteName || "") : "";
    LF = "";
    const first = rows.find((r) => r.mode !== "tender");
    open(null, first ? kindOf(first) : rows.length ? "tender" : LT);
  }

  /* ── список проработок ───────────────────────────────────── */
  const stChip = (r) => `<span class="st snb-st-${esc(r.status)}">${esc(r.status_name)}</span>`;

  function bar(a, b, what) {
    const pct = b ? Math.round((a * 100) / b) : 0;
    return `<span class="snb-cov" title="${esc(what || "С ценой поставщика")} ${a} из ${b}"><b>${a}</b> из ${b}
      <span class="kpi-bar"><b style="width:${pct}%"></b></span></span>`;
  }

  // «−12 345,00 (−8,4 %)»: закупка против договорной цены по тем же строкам.
  /* Разница с договором (правка № 34, 23.10.2026): закупка дешевле
     договора — без знака, дороже — с минусом: «−37 000» — переплатим. */
  function deltaTxt(t) {
    if (!t.delta_base) return "";
    const v = -t.delta || 0;
    const d = v / t.delta_base * 100 || 0;
    return `${money(v)} (${d.toFixed(1).replace(".", ",")} %)`;
  }

  /* Вкладки списка (заказчик, 20.10.2026). Рабочая — проработка, переданная
     в работу: она есть в обеих вкладках, данные общие. */
  const KINDS = [
    ["tender", "Тендер", "trophy", "Тендерная проработка: предложения поставщиков под тендер, выделяется максимальная цена. "
      + "Сама по себе — с проработкой и рабочей не связана"],
    ["proc", "Проработка", "scale", "Выбор поставщиков по позициям на выигранный договор — минимальная приведённая стоимость"],
    ["work", "Рабочая", "truck", "Закупка и поставка на объект: по каким ценам покупаем, кто, сколько и когда поставил, "
      + "средняя цена закупки, куплено и остаток"]];
  const inTab = (r, t) => (t === "tender" ? r.mode === "tender" : t === "proc" ? r.mode !== "tender"
    : r.mode !== "tender" && !!r.work);
  const TAB_ST = { tender: ["work", "done", "won"], proc: ["work", "done"], work: [] };

  /* Срок проработки: «до 27.10» и сколько осталось. Проработано или тендер
     выигран — срок больше не горит. */
  function dueInfo(s) {
    if (!s || !s.due) return null;
    const d = new Date(s.due + "T00:00:00");
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    const left = Math.round((d - t) / 86400000);
    const closed = s.status !== "work";
    return {
      left, full: dmy(s.due), short: dmy(s.due).slice(0, 5),
      cls: closed ? "done" : left < 0 ? "bad" : left <= 2 ? "warn" : "",
      txt: closed ? (s.status === "won" ? "тендер выигран" : "выполнено") : left < 0 ? `просрочено на ${-left} дн.`
        : left === 0 ? "срок сегодня" : `осталось ${left} дн.`,
    };
  }

  function listRows() {
    const q = LQ.trim().toLowerCase();
    return (LIST ? LIST.rows : []).filter((r) => inTab(r, LT) && (!LF || r.status === LF)
      && (!q || [r.site, r.title, (r.version || {}).name, (r.to || {}).name]
        .some((x) => String(x || "").toLowerCase().includes(q))));
  }

  function dueCell(r) {
    const d = dueInfo(r);
    const who = r.to ? `<span class="snb-who-l">${ICO.user}${esc(r.to.name)}</span>` : "";
    if (!d) return `<td><span class="sx-none">без срока</span>${who ? `<i class="t-sub">${who}</i>` : ""}</td>`;
    return `<td title="${esc(`Срок проработки — до ${d.full}: ${d.txt}${r.to ? `. Ответственный — ${r.to.name}` : ""}`)}">
      <span class="snb-due-l ${d.cls}">до ${esc(d.full)}</span><i class="t-sub"><span class="snb-due-t ${d.cls}">${esc(d.txt)}</span>${
      who ? " · " + who : ""}</i></td>`;
  }

  function procListHtml(rows) {
    const tender = LT === "tender";
    return `<table class="tbl sx-tbl snb-ltbl" style="--tbl-min:1120px">
      <colgroup><col class="c-obj"><col class="c-calc"><col class="c-due"><col class="c-at"><col class="c-cov">
        <col class="c-inv"><col class="c-sum"><col class="c-sum"><col class="c-st"><col class="c-go"></colgroup>
      <thead><tr>
        <th>Объект</th><th>Калькуляция</th>
        <th>Срок${tip("К какому числу выполнить проработку и кто за неё отвечает. Срок и ответственного задают при передаче из «Тендера», поменять — в самой проработке.")}</th>
        <th>Передана</th>
        <th>Проработка${tip("Процент проработки: на каждую позицию — три цены поставщиков в конкурентной проработке, тогда 100 %. Ниже — сколько позиций уже с выбранным поставщиком.")}</th>
        <th>Счета</th>
        <th class="num">Цена расчёта${tip("Цена калькуляции на момент передачи.")}</th>
        <th class="num">${tender ? "Оценка по максимуму" : "Закупка по выбору"}${tip(tender
          ? "Сумма по максимальным предложениям поставщиков." : "Сумма по выбранным поставщикам: минимальная приведённая или выбранные вручную.")}</th>
        <th>Статус</th><th></th>
      </tr></thead>
      <tbody>${rows.map((r) => {
        const t = r.totals || {};
        return `<tr class="go" data-id="${esc(r.id)}">
          <td><span class="t-name">${esc(r.site)}</span></td>
          <td><span class="snb-calc">${esc(r.title)}</span>${r.version ? `<i class="t-sub">${ICO.lock}${
            esc(r.version.name)} от ${esc(dmy(r.version.at))}</i>` : ""}</td>
          ${dueCell(r)}
          <td><span class="sx-last">${esc(dmy(r.at))}</span><i class="t-sub">${esc(r.author)}</i></td>
          <td><span class="snb-cov snb-lprog" title="${esc(`Собрано цен: ${t.prorab_have || 0} из ${t.prorab_need || 0} — по три на позицию`)}"><b>${
            t.prorab || 0} %</b><span class="kpi-bar"><b style="width:${t.prorab || 0}%"></b></span></span><i class="t-sub">с ценой ${
            t.priced || 0} из ${t.count || 0}</i></td>
          <td>${r.invoices ? `<b>${r.invoices}</b>` : `<span class="sx-none">—</span>`}</td>
          <td class="num">${money(t.contract)}</td>
          <td class="num">${t.buy ? `<b class="tnd-sum">${money(t.buy)}</b>${t.delta_base
            ? `<i class="t-sub snb-d ${t.delta < 0 ? "good" : t.delta > 0 ? "bad" : ""}">${deltaTxt(t)}</i>` : ""}`
            : `<span class="sx-none">—</span>`}</td>
          <td>${stChip(r)}${r.work ? ` <span class="st snb-st-inwork" title="Передана в работу: закупка — во вкладке «Рабочая»">в работе</span>` : ""}</td>
          <td class="go-c"><button type="button" class="t-go" title="Открыть проработку">${ICO.go}</button></td>
        </tr>`;
      }).join("")}</tbody>
    </table>`;
  }

  function workListHtml(rows) {
    return `<table class="tbl sx-tbl snb-ltbl snb-wltbl" style="--tbl-min:1080px">
      <colgroup><col class="c-obj"><col class="c-calc"><col class="c-at"><col class="c-cov"><col class="c-n">
        <col class="c-sum"><col class="c-sum"><col class="c-inv"><col class="c-go"></colgroup>
      <thead><tr>
        <th>Объект</th><th>Калькуляция</th><th>В работе с</th>
        <th>Закуплено${tip("Сколько позиций закуплено полностью — по поставкам рабочей.")}</th>
        <th>Поставок</th>
        <th class="num">Потрачено${tip("Сумма поставок с ценой, с НДС.")}</th>
        <th class="num">К выбору проработки${tip("Насколько поставки дороже (плюс) или дешевле (минус), чем то же количество по цене выбранного в проработке поставщика.")}</th>
        <th>Счета</th><th></th>
      </tr></thead>
      <tbody>${rows.map((r) => {
        const t = r.totals || {}, w = t.work || {};
        const d = (w.cmp_spent || 0) - (w.cmp_pick || 0);
        return `<tr class="go" data-id="${esc(r.id)}">
          <td><span class="t-name">${esc(r.site)}</span></td>
          <td><span class="snb-calc">${esc(r.title)}</span>${r.version ? `<i class="t-sub">${ICO.lock}${
            esc(r.version.name)} от ${esc(dmy(r.version.at))}</i>` : ""}</td>
          <td><span class="sx-last">${esc(dmy(r.work))}</span>${r.to ? `<i class="t-sub">${esc(r.to.name)}</i>` : ""}</td>
          <td>${bar(w.full || 0, t.count || 0, "Закуплено полностью")}${w.part ? `<i class="t-sub">частично — ${w.part}</i>` : ""}</td>
          <td>${w.deliv ? `<b>${w.deliv}</b>` : `<span class="sx-none">—</span>`}</td>
          <td class="num">${w.spent ? `<b class="tnd-sum">${money(w.spent)}</b>` : `<span class="sx-none">—</span>`}</td>
          <td class="num">${w.cmp_pick ? `<span class="snb-d ${d > 0.004 ? "bad" : d < -0.004 ? "good" : ""}">${d > 0 ? "+" : ""}${money(d)}</span>`
            : `<span class="sx-none">—</span>`}</td>
          <td>${r.buys ? `<b>${r.buys}</b>` : `<span class="sx-none">—</span>`}</td>
          <td class="go-c"><button type="button" class="t-go" title="Открыть рабочую">${ICO.go}</button></td>
        </tr>`;
      }).join("")}</tbody>
    </table>`;
  }

  function listHtml() {
    const all = LIST ? LIST.rows : [];
    const mine = all.filter((r) => inTab(r, LT));
    const sts = TAB_ST[LT];
    if (LF && !sts.includes(LF)) LF = "";
    const rows = listRows();
    const n = (st) => mine.filter((r) => !st || r.status === st).length;
    const names = Object.fromEntries(((LIST && LIST.statuses) || []).map((x) => [x.id, x.name]));
    const late = (k) => all.filter((r) => inTab(r, k) && r.status === "work" && ((dueInfo(r) || {}).left < 0)).length;
    const empty = {
      tender: `Калькуляцию передают сюда из «Тендера»: в расчёте объекта — «Передать на проработку» →
        «Тендерная проработка». Срок и ответственного ставят там же — ему уйдёт сообщение в мессенджер.`,
      proc: `Сюда попадает калькуляция выигранного объекта: из «Тендера» — «Передать на проработку» →
        «Проработка», или из тендерной — «Тендер выигран». Здесь выбирают поставщиков по позициям.`,
      work: `Рабочая — проработка, переданная в работу: кнопкой «Объект проработан — в работу» или сразу
        из «Тендера», если прорабатывать некогда. Здесь загружают счета на закупку и отмечают поставки.`,
    }[LT];
    return `
      <div class="pg sx snb-list">
        <div class="pg-head sx-head snb-lhead">
          <div class="snb-kinds" role="tablist" aria-label="Вкладки проработки">${KINDS.map(([k, name, ico, hint]) => {
            const cnt = all.filter((r) => inTab(r, k)).length, lt = late(k);
            return `<button type="button" role="tab" class="snb-kind${LT === k ? " on" : ""}" data-lt="${k}"
              aria-selected="${LT === k}" title="${esc(hint)}">${ICO[ico]}<b>${name}</b><i>${cnt}</i>${lt
              ? `<em title="Просрочен срок проработки: ${lt}">${lt}</em>` : ""}</button>`;
          }).join("")}</div>
          <label class="pg-find sx-q">${ICO.find}<input id="snbQ" type="search"
            placeholder="Объект, калькуляция, ответственный" value="${esc(LQ)}" autocomplete="off"></label>
          <span class="grow"></span>
          ${sts.length ? `<div class="seg sx-seg" role="group" aria-label="Статус проработки">
            <button type="button" class="seg-b${LF ? "" : " on"}" data-lf="">Все<i>${n("")}</i></button>
            ${sts.map((id) => `<button type="button" class="seg-b${LF === id ? " on" : ""}" data-lf="${esc(id)}"
              >${esc(names[id] || id)}<i>${n(id)}</i></button>`).join("")}
          </div>` : ""}
          ${tip(KINDS.find((k) => k[0] === LT)[3] + ".")}
        </div>
        <div class="pg-body">${rows.length ? (LT === "work" ? workListHtml(rows) : procListHtml(rows))
          : `<div class="pg-empty"><b>${mine.length ? "Под отбор ничего не подошло" : "Здесь пока пусто"}</b>${
            mine.length ? "Снимите отбор или очистите поиск." : empty}</div>`}
        </div>
      </div>`;
  }

  function wireList(host) {
    const q = $n("#snbQ", host);
    if (q) {
      q.addEventListener("input", () => {
        LQ = q.value;
        const body = $n(".pg-body", host);
        // Перерисовываем всё, кроме поля поиска: курсор в нём остаётся.
        const tmp = document.createElement("div");
        tmp.innerHTML = listHtml();
        body.replaceWith($n(".pg-body", tmp));
        wireRows(host);
      });
    }
    host.querySelectorAll("[data-lt]").forEach((b) => b.addEventListener("click", () => {
      if (LT === b.dataset.lt) return;
      LT = b.dataset.lt;
      saveLT();
      LF = "";
      render();
    }));
    host.querySelectorAll("[data-lf]").forEach((b) => b.addEventListener("click", () => {
      LF = b.dataset.lf;
      render();
    }));
    wireRows(host);
  }

  function wireRows(host) {
    host.querySelectorAll("tr.go[data-id]").forEach((tr) => tr.addEventListener("click", () => {
      openId = tr.dataset.id;
      HEAD_MINI = false;
      VIEW = LT === "work" ? "work" : "proc";
      CUR = null;
      SIG = "";
      RQ = "";
      RF = "";
      WQ = "";
      WF = "";
      load();
    }));
  }

  /* ── проработка ─────────────────────────────────────────── */
  const FIX_TIP = "Цены калькуляции на момент передачи — по ним подписан договор. Не меняются.";
  /* ВКЛ — возобновляемая кредитная линия, не вклад (заказчик, 09.10.2026);
     ставку задают в «Финансы → Параметры для расчёта». */
  const PV_TIP = "Приведённая стоимость — во что обходится цена с учётом отсрочки платежа: "
    + "цена − цена × % ВКЛ × дни отсрочки / 365. Чем дольше отсрочка, тем дешевле покупка: "
    + "до оплаты не нужно брать деньги в кредитной линии. % ВКЛ — ставка возобновляемой кредитной "
    + "линии, одна на все проработки; её задают в «Финансы → Параметры для расчёта».";
  const PICK_TIP = "Как выбирается поставщик. Срок позиции не ограничен — берём минимальную "
    + "приведённую стоимость среди всех. Позиция нужна за N дней — сначала отсекаем тех, чей срок "
    + "поставки больше N или не назван, из оставшихся — минимальная приведённая. При равной "
    + "приведённой — у кого отсрочка больше. Щелчок по цене выбора — разбор по каждому поставщику.";
  const DUE_TIP = "За сколько дней позиция нужна на объекте. Пусто — срок не ограничен. Со сроком "
    + "выбор идёт только среди поставщиков, кто успевает: остальные в колонках зачёркнуты.";
  const TERMS_TIP = "Условия поставщика: отсрочка платежа и срок поставки, если строка счёта их не "
    + "называет. Общие на все объекты — договор с поставщиком один.";

  /* Группы поставщиков (цена, срок, отсрочка) сворачиваются до цены
     (заказчик, 08.10.2026: «колонок больше — группы можно сворачивать»).
     Что свёрнуто — помнит браузер: ключи колонок одни на все проработки. */
  const FOLD_KEY = "snb.fold.v1";
  const FOLD = (() => {
    try { return new Set(JSON.parse(localStorage.getItem(FOLD_KEY) || "[]")); } catch (e) { return new Set(); }
  })();
  const folded = (c) => FOLD.has(c.id);
  const saveFold = () => { try { localStorage.setItem(FOLD_KEY, JSON.stringify([...FOLD])); } catch (e) { /* без памяти */ } };

  /* Справочные колонки — каталоги ЭТМ, Русского Света, ЭЛКОМ и «Счета и
     прайсы» прайса материалов (заказчик, 13.10.2026: «этот блок просили
     удалить — пусть сворачивается бесследно, а стрелочкой видно, что там
     что-то есть»). Свёрнуты по умолчанию в узкую полосу в конце таблицы.
     С 20.10.2026 — только справочно: в выбор поставщика, конкурентную
     проработку и карточку позиции они не идут. */
  const REF_KEY = "snb.ref.v1";
  let REF_OPEN = (() => { try { return localStorage.getItem(REF_KEY) === "1"; } catch (e) { return false; } })();
  const saveRef = () => { try { localStorage.setItem(REF_KEY, REF_OPEN ? "1" : "0"); } catch (e) { /* без памяти */ } };
  const mainCols = () => CUR.cols.filter((c) => !c.ref);
  const refCols = () => CUR.cols.filter((c) => c.ref);
  // Тендерная (правки № 56, 57, 26.10.2026): выбора поставщика и цены
  // калькуляции в ней нет, а справочные цены — раскрыты сразу за
  // спецификацией: по ним считают тендер.
  const isTender = () => !!(CUR && CUR.supply && CUR.supply.mode === "tender");
  const refShown = () => REF_OPEN || isTender();
  const shownCols = () => mainCols().concat(refShown() ? refCols() : []);
  let REFS = new Set();      // ключи справочных колонок — для метки в конкурентной проработке
  const REF_TIP = "Справочно: каталоги и «Счета и прайсы» прайса материалов — только для сверки. В выбор "
    + "поставщика, конкурентную проработку и карточку позиции они не идут. Развернуть — стрелкой.";

  /* Конкурентная проработка (заказчик, 13.10.2026): сразу за позицией —
     лучшая цена и лучшая приведённая, потом от трёх до пяти предложений
     «цена — поставщик», независимо от колонок поставщиков справа. */
  const SLOTS_MIN = 3, SLOTS_MAX = 5;
  const slots = () => Math.min(SLOTS_MAX, Math.max(SLOTS_MIN,
    ...CUR.rows.map((r) => ((r.compete || {}).offers || []).length)));
  const COMP_TIP = "Предложения поставщиков по позиции — счета, КП и цены, вписанные руками (каталоги — "
    + "справочно, не здесь): лучшая цена и лучшая приведённая стоимость среди тех, кто успевает к сроку, и до "
    + "пяти цен с поставщиком. Первая пара в рамке — выбранный поставщик, дальше — по возрастанию приведённой. "
    + "Булавка — выбран вручную, рамкой в клетке — кого взяло бы правило. Щелчок по цене — выбрать поставщика "
    + "вручную, по выбранному вручную — вернуть выбор по правилу.";
  // Спецификация 6, конкурентная проработка, «нужно за», договор 2, выбор 6,
  // факт — и группы поставщиков, полоса справочных и они сами, если раскрыты.
  /* Лучшая цена и лучшая приведённая (20.10.2026: «скрыть прямо до
     минимума, но чтобы было видно, что там что-то скрыто») — по умолчанию
     узкой полосой со стрелкой, как справочные колонки. */
  const BEST_KEY = "snb.best.v1";
  let BEST_OPEN = (() => { try { return localStorage.getItem(BEST_KEY) === "1"; } catch (e) { return false; } })();
  const saveBest = () => { try { localStorage.setItem(BEST_KEY, BEST_OPEN ? "1" : "0"); } catch (e) { /* без памяти */ } };

  /* Колонки таблицы проработки — одним списком: ключ, ширина по
     умолчанию, подпись, класс, подсказка. По нему строятся colgroup и
     вторая строка шапки, а ширины тянут мышью за правую границу подписи
     (20.10.2026: «чтобы менялась ширина колонок») — GRID.widths, как в
     расчёте; ширины помнит браузер. */
  function procCols() {
    const tender = isTender(), N = slots();
    const sup = (c) => (folded(c) ? [["sp:" + c.id, 96, "Цена", "num snb-sp"]]
      : [["sp:" + c.id, 96, "Цена", "num snb-sp"], ["st:" + c.id, 90, "Срок", "snb-st"],
        ["sd:" + c.id, 64, "Отср.", "num snb-sd", "Отсрочка платежа, дней"]]);
    const list = [["no", 72, "№", "s-no snb-mb"], ["name", 300, "Наименование", "s-name snb-mb"],
      ["brand", 150, "Тип, марка", "snb-mb", "Щелчок по марке — скопировать"],
      ["code", 96, "Код", "snb-mb", "Щелчок по коду — скопировать"], ["unit", 54, "Ед.", "snb-mb"],
      ["qty", 74, "Кол-во", "num snb-mb"]];
    if (tender) {
      refCols().forEach((c) => list.push(...sup(c)));
      list.push(["due", 70, "Нужно за", "num snb-due-h", DUE_TIP], ["fact", 96, "Цена закупки", "num snb-fact-h", FACT_TIP],
        ["comment", 160, "Комментарий", ""]);
      mainCols().forEach((c) => list.push(...sup(c)));
      return list;
    }
    list.push(["con", 96, "За ед.", "num snb-mb", "Цена материала за единицу в калькуляции"],
      ["cons", 110, "Всего", "num snb-mb snb-mbe", "Материалы всего в калькуляции"]);
    if (BEST_OPEN) {
      list.push(["lp", 92, tender ? "Макс. цена" : "Лучшая цена", "num snb-lph"],
        ["lv", 92, tender ? "Макс. привед." : "Лучшая привед.", "num snb-lvh"]);
    } else {
      list.push(["lpv", 24, "", "snb-bsh"]);
    }
    for (let i = 1; i <= N; i++) {
      list.push(i === 1 ? ["op1", 96, "Выбрано", "num snb-oph snb-o1", "Цена выбранного поставщика за единицу, с НДС"]
        : ["op" + i, 84, "Цена " + i, "num snb-oph"],
      i === 1 ? ["ow1", 168, "Поставщик", "snb-owh snb-w1", "Условие оплаты, поставщик (наведите — контакты) и счёт"]
        : ["ow" + i, 112, "Поставщик", "snb-owh"]);
    }
    list.push(["due", 70, "Нужно за", "num snb-due-h", DUE_TIP],
      ["best", 98, "Цена", "num", "Цена выбранного поставщика за единицу, с НДС. Щелчок — почему он"],
      ["pv", 98, "Привед.", "num", PV_TIP], ["who", 160, "Поставщик", ""], ["term", 96, "Срок", ""],
      ["def", 60, "Отср.", "num", "Отсрочка платежа, дней"], ["sum", 112, "Сумма", "num", "Цена выбора на всё количество"],
      ["fact", 96, "Цена закупки", "num snb-fact-h", FACT_TIP], ["comment", 160, "Комментарий", ""]);
    mainCols().forEach((c) => list.push(...sup(c)));
    if (refCols().length) list.push(["ref", 26, "", "snb-refh2"]);
    if (REF_OPEN) refCols().forEach((c) => list.push(...sup(c)));
    return list;
  }
  const WIDTH = typeof GRID === "object" ? GRID.widths("snb.w.v1", () => procCols().map(([k, w]) => [k, w])) : null;
  const span = () => procCols().length;
  const FACT_TIP = "Фактическая цена закупки за единицу, с НДС — средняя по поставкам «Рабочей» (20.10.2026). "
    + "Пока поставок нет, её можно вписать руками. Идёт в бюджет объекта («Финансы») рядом с ценой выбора.";
  const pct = (v) => `${String(+(v || 0)).replace(".", ",")} %`;
  const days = (n) => (n === null || n === undefined ? "" : `${n} дн.`);
  const pvMath = (x) => `${money(x.price)} − ${money(x.price)} × ${pct(CUR.rate)} × ${x.defer || 0} / 365 = ${money(x.pv)}`;
  const isLate = (r) => !!(r.need && !r.best && r.due !== null && r.due !== undefined && (r.pick || []).length);

  function rowFilter(r) {
    if (r.kind === "section") return !RQ.trim() && !RF;
    // «Не в договоре» счетов не просят — в «Без цены» их нет (правка № 48).
    if (RF === "none" && !(r.need && !r.best && !r.skip)) return false;
    if (RF === "hand" && !(r.best && r.best.manual)) return false;
    if (RF === "inv" && !Object.keys(r.prices || {}).some(isSup)) return false;
    if (RF === "off" && !r.skip) return false;
    if (RF === "late" && !isLate(r)) return false;
    const q = RQ.trim().toLowerCase();
    if (!q) return true;
    const hay = [r.pos_no, r.name, r.brand, r.code, r.maker].join(" ").toLowerCase();
    return q.split(/\s+/).every((w) => hay.includes(w));
  }

  /* Процент проработки (20.10.2026): «на каждую позицию — три цены в
     конкурентной проработке, тогда 100 %». Крупно — первым в шапке. */
  const PROG_TIP = "Процент проработки объекта: на каждую позицию нужно три цены поставщиков в конкурентной "
    + "проработке (цена 1, 2 и 3) — тогда 100 %. Предложений бывает до пяти, в счёт идут три.";
  const progBlock = (t) => `<div class="snb-prog" title="${esc(`Собрано цен: ${t.prorab_have || 0} из ${t.prorab_need || 0}`
    + " — по три на позицию")}"><dt>Проработка объекта${tip(PROG_TIP)}</dt><dd><b>${t.prorab || 0} %</b>
    <span class="snb-prog-bar"><i style="width:${t.prorab || 0}%"></i></span></dd></div>`;

  // Без цены — те, на что запрашиваем счета: без «не в договоре» (правка № 48).
  const nop = (t) => (t.nop !== undefined ? t.nop : t.count - t.priced);

  function factsHtml() {
    const t = CUR.totals;
    // Тендерная (правка № 56): выбора поставщика и цены калькуляции нет — и
    // их итогов тоже.
    if (isTender()) {
      return `<dl class="pg-facts">${progBlock(t)}
        <div><dt>Позиции тендера</dt><dd>${t.count}</dd></div>
        <div><dt>С ценой поставщика</dt><dd class="${nop(t) ? "warn" : ""}">${t.priced} из ${t.count}${
          nop(t) ? ` <i class="snb-nop-n">без цены — ${nop(t)}</i>` : ""}</dd></div>
      </dl>`;
    }
    return `<dl class="pg-facts">${progBlock(t)}
      <div><dt>${CUR.supply.mode === "tender" ? "Позиции тендера" : "Покупаем позиций"}</dt><dd title="${esc(t.off_contract ? `из них не в договоре — ${t.off_contract}` : "")}">${
        t.count}${t.off_contract ? ` <i class="snb-oc">${t.off_contract} не в дог.</i>` : ""}</dd></div>
      <div><dt>С выбранным поставщиком</dt><dd class="${nop(t) ? "warn" : ""}">${t.priced} из ${t.count}${
        nop(t) ? ` <i class="snb-nop-n" title="Без строк «не в договоре» — на них счета не запрашиваем">без цены — ${nop(t)}</i>` : ""}${
        t.hand ? ` <i class="snb-hand-n" title="Поставщик выбран вручную — щелчком в конкурентной проработке">вручную — ${t.hand}</i>` : ""}${
        t.late ? ` <i class="snb-late-n" title="Нужны к сроку, а поставщика к нему нет">к сроку нет — ${t.late}</i>` : ""}</dd></div>
      <div><dt>${CUR.supply.mode === "tender" ? "По калькуляции" : "По договору, материалы"}</dt><dd title="${esc(FIX_TIP)}">${money(t.contract)}</dd></div>
      <div><dt>${CUR.supply.mode === "tender" ? "Оценка по максимуму" : "Закупка по выбору"}</dt><dd title="${esc(`По ценам выбранных поставщиков. Приведённая стоимость той же закупки — ${
        money(t.buy_pv)}: на столько она обходится с учётом отсрочек.${t.fact_n ? ` Куплено по факту: ${t.fact_n} поз. на ${
        money(t.fact)}` : ""}`)}">${money(t.buy)}</dd></div>
      <div><dt>Разница с ${CUR.supply.mode === "tender" ? "калькуляцией" : "договором"}${t.delta_n ? `, ${t.delta_n} поз.` : ""}</dt><dd class="snb-d ${
        t.delta < 0 ? "good" : t.delta > 0 ? "bad" : ""}" title="Закупка по выбору против договорной цены — по позициям, где есть обе: ${
        t.delta_n || 0}. Без знака — экономия, минус — закупка дороже договора">${deltaTxt(t) || "—"}</dd></div>
      <div class="snb-ratef"><dt>% ВКЛ${tip(PV_TIP)}</dt><dd>${has("fin")
        ? `<button type="button" class="lnk snb-rate" id="snbRate" title="Ставка возобновляемой кредитной линии — открыть «Финансы → Параметры для расчёта»">${pct(CUR.rate)}</button>`
        : `<span title="Ставка возобновляемой кредитной линии — её задают в «Финансы → Параметры для расчёта»">${
          pct(CUR.rate)}</span>`}</dd></div>
    </dl>`;
  }

  // Шапка открытой проработки: объект, калькуляция, вид, версия цен.
  function headTitle(s) {
    return `<button type="button" class="pg-back" id="snbBack" title="Все проработки" aria-label="Все проработки">${ICO.back}</button>
      <div class="pg-h1">
        <button type="button" class="calc-obj" id="snbObj" title="Все проработки">${esc(s.site)}</button>
        <h2 title="${esc(s.title)}">${esc(s.title)}</h2>
        <small>${s.mode === "tender" ? "Тендерная проработка · максимум" : isWork()
          ? "Рабочая · закупка и поставка" : "Проработка · выбор поставщиков"}${s.version
          ? ` · <span class="snb-verl" title="${esc(FIX_TIP)}">${ICO.lock}${esc(s.version.name)} от ${esc(dmy(s.version.at))}</span>` : ""}</small>
      </div>`;
  }

  // «Иван Петров» → «Иван П.»: в шапке места мало, целиком — в подсказке.
  const shortName = (n) => {
    const p = String(n || "").trim().split(/\s+/);
    return p.length > 1 ? `${p[0]} ${p[1][0]}.` : p[0] || "";
  };

  /* Срок проработки и ответственный (заказчик, 20.10.2026: «должна быть
     дата, к какому числу выполнить проработку») — кнопкой в шапке: щелчок —
     поменять и, если нужно, написать ответственному. */
  function dueChip(s) {
    const d = dueInfo(s);
    if (!d && !s.to && s.work) return "";
    return `<button type="button" class="snb-duec ${d ? d.cls : "none"}" id="snbDueC"${can() ? "" : " disabled"}
      title="${esc((d ? `Срок проработки — до ${d.full}: ${d.txt}` : "Срок проработки не задан")
        + (s.to ? `. Ответственный — ${s.to.name}` : "") + (can() ? ". Щелчок — изменить" : ""))}">${ICO.clock}<span>${
      d ? `до ${esc(d.short)}` : "срок"}</span>${d && d.cls !== "done" ? `<em>${d.left < 0 ? `просрочено ${-d.left} дн.`
        : d.left === 0 ? "сегодня" : `${d.left} дн.`}</em>` : ""}${s.to ? `<i>${esc(shortName(s.to.name))}</i>` : ""}</button>`;
  }

  // Проработка и рабочая — одна проработка: переключатель в шапке.
  function viewSeg(s) {
    if (s.mode === "tender" || !s.work) return "";
    return `<span class="seg snb-view" role="group" aria-label="Проработка или рабочая">
      <button type="button" class="seg-b${isWork() ? "" : " on"}" data-view="proc">${ICO.scale}Проработка</button>
      <button type="button" class="seg-b${isWork() ? " on" : ""}" data-view="work">${ICO.truck}Рабочая</button></span>`;
  }

  /* Что дальше (заказчик, 20.10.2026): из тендерной — «тендер выигран,
     передать на проработку», из проработки — «объект проработан, передать
     в работу». */
  function nextBtn(s) {
    if (!can()) return "";
    const sib = (CUR.siblings || []).find((x) => x.mode !== "tender");
    if (s.mode === "tender") {
      if (s.status === "won" && sib) {
        return `<button type="button" class="btn-ghost sm" data-go-sib="${esc(sib.id)}" data-sib-kind="${sib.work ? "work" : "proc"}"
          title="Проработка этой калькуляции — выбор поставщиков на договор">${ICO.go}Открыть проработку</button>`;
      }
      return `<button type="button" class="btn-brand sm" id="snbWon" title="Тендер выигран: калькуляция уходит в
        проработку — выбирать поставщиков на договор. Счета и КП тендерной переедут с ней">${ICO.trophy}Тендер выигран → проработка</button>`;
    }
    if (!s.work) {
      return `<button type="button" class="btn-brand sm" id="snbToWork" title="Объект проработан: проработка встаёт и во
        вкладку «Рабочая» — закупка и поставки. Прорабатывать можно дальше, данные общие">${ICO.truck}Проработан → в работу</button>`;
    }
    return "";
  }

  function procHtml() {
    const s = CUR.supply;
    const rows = CUR.rows.filter(rowFilter);
    const need = CUR.rows.filter((r) => r.need);
    const nNone = need.filter((r) => !r.best && !r.skip).length;
    const nInv = CUR.rows.filter((r) => Object.keys(r.prices || {}).some(isSup)).length;
    const nOff = CUR.rows.filter((r) => r.kind !== "section" && r.skip).length;
    const nLate = need.filter(isLate).length;
    const nHand = need.filter((r) => r.best && r.best.manual).length;
    const cols = shownCols(), refs = refCols(), N = slots(), tender = isTender();
    // Счета, что открываются из шапок колонок, — над таблицей их нет.
    const inCols = new Set(mainCols().flatMap((c) => (c.invoices || []).map((x) => x.id)));
    REFS = new Set(refs.map((c) => c.id));
    const allFold = cols.length && cols.every(folded);
    return `
      <div class="pg snb-proc${HEAD_MINI ? " snb-mini" : ""}">
        <div class="pg-head strip calc-head two">
          ${headTitle(s)}
          ${dueChip(s)}
          ${viewSeg(s)}
          ${factsHtml()}
          ${s.status === "won" ? `<span class="st snb-st-won snb-stc" title="Тендер выигран: калькуляция передана в проработку">${
            ICO.trophy}Тендер выигран</span>`
            : `<span class="seg snb-seg" role="group" aria-label="Статус проработки">${["work", "done"].map((k) =>
            `<button type="button" class="seg-b${s.status === k ? " on" : ""}" data-pst="${k}"${can() ? "" : " disabled"}
              >${k === "work" ? "В проработке" : "Проработано"}</button>`).join("")}</span>`}
          ${can() ? `<div class="pg-act pg-acts">
            ${s.mode !== "tender" ? ptoBtn() : ""}
            <button type="button" class="btn-ghost sm" id="snbReq"
              title="Запрос поставщикам по группам материалов: позиции группы книгой Excel и поставщики, кто эту группу возит"
              >${ICO.mail}Запрос</button>
            <button type="button" class="ico" id="snbPull"${CUR.pull ? " disabled" : ""}
              title="${CUR.pull ? "Ищем цены каталогов…" : "Обновить справочные цены каталогов ЭТМ, Русского Света и ЭЛКОМ-ОНЛАЙН — в выбор они не идут. Цены и сроки поставщиков не трогаются"}"
              >${ICO.box}</button>
            <button type="button" class="ico" id="snbXls" title="Выгрузить: вся проработка книгой Excel">${ICO.down}</button>
            <button type="button" class="ico warn" id="snbDel" title="Убрать проработку">${ICO.trash}</button>
            ${nextBtn(s)}
          </div>` : ""}
        </div>
        <div class="snb-bar">
          ${miniBtn()}
          <span class="snb-bar-prog" title="${esc(PROG_TIP)}">${CUR.totals.prorab || 0} %</span>
          <label class="pg-find">${ICO.find}<input id="snbRq" type="search" placeholder="Позиция, марка, код"
            value="${esc(RQ)}" autocomplete="off"></label>
          <span class="seg" role="group" aria-label="Какие позиции показать">
            <button type="button" class="seg-b${RF ? "" : " on"}" data-rf="">Все</button>
            <button type="button" class="seg-b snb-rf-none${nNone ? " hot" : ""}${RF === "none" ? " on" : ""}" data-rf="none"
              title="Позиции, у которых ещё нет выбранного поставщика">Без цены<i>${nNone}</i></button>
            <button type="button" class="seg-b${RF === "inv" ? " on" : ""}" data-rf="inv"
              title="Позиции, у которых есть цена хотя бы одного поставщика">С ценой<i>${nInv}</i></button>
            ${nLate || RF === "late" ? `<button type="button" class="seg-b snb-rf-late${RF === "late" ? " on" : ""}" data-rf="late"
              title="Нужны к сроку, а поставщика к нему нет">Не успевают к сроку<i>${nLate}</i></button>` : ""}
            ${nHand || RF === "hand" ? `<button type="button" class="seg-b${RF === "hand" ? " on" : ""}" data-rf="hand"
              title="Поставщик выбран вручную, а не по приведённой стоимости">Выбраны вручную<i>${nHand}</i></button>` : ""}
            ${nOff ? `<button type="button" class="seg-b${RF === "off" ? " on" : ""}" data-rf="off">Не в договоре<i>${nOff}</i></button>` : ""}
          </span>
          ${can() ? `<button type="button" class="btn-ghost sm snb-tb" id="snbDue"
            title="Вписать общий срок всем позициям объекта; отдельные позиции можно изменить в карточке">${ICO.clock}Нужно за…</button>` : ""}
          ${cols.length ? `<button type="button" class="btn-ghost sm snb-tb" id="snbFoldAll"
            title="${allFold ? "Показать у всех поставщиков цену, срок и отсрочку" : "Оставить у всех поставщиков только цену"}"
            aria-label="${allFold ? "Развернуть колонки поставщиков" : "Свернуть колонки поставщиков"}"
            >${allFold ? ICO.unfold : ICO.fold}</button>` : ""}
          <!-- Счёт открывается из шапки своей колонки: номер — файл, значок —
               сверка (правка № 24, 22.10.2026). Над таблицей — только счета,
               у которых колонки нет: не записан или поставщик не назван. -->
          <div class="snb-invs">${CUR.invoices.filter((x) => !inCols.has(x.id)).map(invChip).join("")}</div>
          ${can() ? `<button type="button" class="btn-ghost sm snb-tb" id="snbColAdd"
            title="Добавить поставщика и вписывать его цены прямо в клетки таблицы">${ICO.plus}Поставщик вручную</button>` : ""}
          <!-- Загрузка — как в прайсе материалов (Андрей, 07.10.2026): выбрал
               счёт — он сам встал колонкой с ценами; сверка — щелчком по счёту. -->
          ${can() ? `<label class="btn-brand sm snb-upl" title="Счёт, КП или прайс поставщика — PDF или Excel. Строки сами найдут свои позиции и встанут колонкой поставщика с ценами, сроками и отсрочкой"
            >${ICO.up}Загрузить счета<input type="file" id="snbFile" accept=".pdf,.xlsx,.xlsm,.xls" multiple hidden></label>` : ""}
        </div>
        <div class="pg-body snb-body">
          <table class="tbl pos-tbl calc-tbl snb-tbl" style="${WIDTH.style(procCols().reduce((n, x) => n + x[1], 0))}">
            <colgroup>${WIDTH.colgroup()}</colgroup>
            <thead>
              <tr>
                <th colspan="2" class="grp spec s-froze snb-mb">Спецификация</th>
                <th colspan="4" class="grp spec snb-mb"></th>
                ${tender ? refs.map(grpHead).join("") : `<th colspan="2" class="grp snb-gfix snb-mb snb-mbe" title="${esc(FIX_TIP)}">${ICO.lock} Договорная цена</th>
                <th colspan="${(BEST_OPEN ? 2 : 1) + 2 * N}" class="grp snb-gcomp">Конкурентная проработка${tip(COMP_TIP)}</th>`}
                <th class="grp snb-gdue">Срок${tip(DUE_TIP)}</th>
                ${tender ? "" : `<th colspan="6" class="grp snb-gbest">Выбор поставщика${tip(PICK_TIP)}</th>`}
                <th class="grp snb-gfact">Факт${tip(FACT_TIP)}</th>
                <th class="grp">Комментарий</th>
                ${mainCols().map(grpHead).join("")}
                ${refs.length && !tender ? `<th class="snb-refh${REF_OPEN ? " open" : ""}" title="${esc(REF_OPEN
                  ? "Свернуть справочные колонки" : `${refs.map((c) => c.name).join(", ")} — справочно. Развернуть`)}">
                  <button type="button" class="snb-refb" id="snbRef" aria-expanded="${REF_OPEN}"
                    aria-label="${REF_OPEN ? "Свернуть справочные колонки" : "Развернуть справочные колонки"}">${
                    REF_OPEN ? ICO.fold : ICO.unfold}</button></th>` : ""}
                ${REF_OPEN && !tender ? refs.map(grpHead).join("") : ""}
              </tr>
              <tr>${procCols().map(([k, , label, cls, hint]) => k === "lpv"
                ? `<th class="snb-bsh" data-best-toggle title="${esc(s.mode === "tender" ? "Максимальная цена и максимальная приведённая"
                  : "Лучшая цена и лучшая приведённая")} — свёрнуты. Развернуть"><button type="button" class="snb-refb"
                  aria-label="Развернуть лучшие цены">${ICO.unfold}</button></th>`
                : k === "ref" ? `<th class="snb-refh2" title="${esc(REF_TIP)}"><span class="snb-refl">справочно</span></th>`
                : `<th class="${cls}"${hint ? ` title="${esc(hint)}"` : ""}>${label}${k === "lp"
                  ? `<button type="button" class="snb-gbtn snb-bfold" data-best-toggle title="Свернуть лучшие цены в узкую полосу"
                    aria-label="Свернуть лучшие цены">${ICO.fold}</button>` : ""}${WIDTH.grip()}</th>`).join("")}
              </tr>
            </thead>
            <tbody>${rowsHtml(rows)}</tbody>
          </table>
        </div>
        <div class="pg-note" id="snbNote" hidden></div>
      </div>`;
  }

  function rowsHtml(rows) {
    return rows.length ? rows.map(rowHtml).join("")
      : `<tr><td colspan="${span()}" class="snb-none">Ничего не нашлось — снимите отбор или поищите иначе</td></tr>`;
  }

  // Шапка группы поставщика: имя, откуда цены, условия; свернуть и условия.
  function grpHead(c) {
    const fold = folded(c);
    const invs = c.invoices || [];
    const sub = invs.length ? invs.map((x) => `№ ${x.number || "б/н"}${x.date ? " от " + dmy(x.date) : ""}`).join(", ")
      : c.kind === "catalog" ? "каталог" : c.kind === "obj" ? "указание заказчика" : c.kind === "pricelist" ? "прайс материалов"
      : c.manual ? "вписано руками" : "";
    const cond = [c.defer !== null && c.defer !== undefined ? `отсрочка ${c.defer} дн.` : "",
      c.term ? `срок ${c.term}` : ""].filter(Boolean).join(" · ");
    // Счёт открывается прямо из шапки своей колонки (снабжение, 16.10.2026:
    // «полоса счетов наверху на ноутбуке уезжает за край — счёт должен
    // кликаться в шапке столбца, где встают его цены»).
    const last = invs[invs.length - 1];
    // Номер — сам файл счёта; значок документа рядом с именем — сверка по
    // позициям (правка № 24, 22.10.2026).
    const invBtn = (x) => `<button type="button" class="snb-ginv" data-inv-file="${esc(x.id)}"
      title="Открыть файл счёта${x.filename ? " «" + esc(x.filename) + "»" : ""}">№ ${esc(x.number || "б/н")}${
      x.date ? " от " + esc(dmy(x.date)) : ""}</button>`;
    return `<th colspan="${fold ? 1 : 3}" class="grp snb-gsup${fold ? " fold" : ""}" title="${esc(
      [c.name, sub, cond ? "условия: " + cond : ""].filter(Boolean).join(" — "))}">
      <div class="snb-gh">
        <button type="button" class="snb-gbtn" data-fold="${esc(c.id)}" aria-label="${fold ? "Развернуть" : "Свернуть"}"
          title="${fold ? "Развернуть: цена, срок, отсрочка" : "Свернуть до цены"}">${fold ? ICO.unfold : ICO.fold}</button>
        <span class="snb-gsup-n">${esc(c.name)}</span>
        ${last ? `<button type="button" class="snb-gbtn snb-ginv-ico" data-inv-go="${esc(last.id)}" aria-label="Открыть сверку счёта"
          title="Сверка счёта № ${esc(last.number || "б/н")}: строки, позиции, цены">${ICO.file}</button>` : ""}
        ${can() && !fold && c.kind !== "obj" ? `<button type="button" class="snb-gbtn" data-terms="${esc(c.id)}" aria-label="Условия поставщика"
          title="${esc(TERMS_TIP)}">${ICO.cog}</button>` : ""}
        ${can() && !fold && invs.length ? `<button type="button" class="snb-gbtn warn" data-inv-delcol="${esc(c.id)}"
          aria-label="Удалить счёт" title="Удалить счёт${invs.length > 1 ? " — выбрать какой" : ""}: загружен по ошибке">${ICO.trash}</button>` : ""}
        ${can() && !fold && !invs.length && c.manual ? `<button type="button" class="snb-gbtn warn" data-colrm="${esc(c.id)}"
          title="Убрать колонку поставщика">${ICO.no}</button>` : ""}
      </div>
      ${fold ? "" : `<i class="snb-gsub">${invs.length ? invs.map(invBtn).join(", ") + " · " : ""}${
        esc([invs.length ? "" : sub, cond || (c.kind === "obj" ? "" : "условия не заданы")]
          .filter(Boolean).join(" · "))}</i>`}</th>`;
  }

  function why(r) {
    if (r.kind === "section") return "";
    if ((r.fixed || {}).in_set) return `в составе ${r.fixed.in_set} — цена у щита`;
    // Правка № 16: цену и поставщика назначил заказчик — запрашивать нечего.
    // Строка закрыта (правка № 28) — пометка оранжевым, см. ownTag.
    if (r.own) return "";
    // Работа — ПНР, бурение, штроба, коронки (правка № 48): услуга, не товар.
    if (!r.need && (r.work || (r.origin === "hand" && r.qty))) return "работа — не покупаем";
    if (!r.qty_buy) return "без количества";
    return "";
  }

  /* Замена (аналог) и что по ней сказало ПТО (правка № 32, 23.10.2026). */
  const PTO_ST = { new: ["замена — в ПТО не отправлена", "new"], wait: ["замена — на согласовании в ПТО", "wait"],
    ok: ["замена согласована ПТО", "ok"], no: ["ПТО не согласовало замену", "no"] };
  const ptoTag = (r) => {
    if (!r.pto) return "";
    const [t, k] = PTO_ST[r.pto.state] || PTO_ST.new;
    return `<b class="snb-ptol ${k}" title="${esc(t + (r.pto.comment ? ": " + r.pto.comment : "")
      + (r.pto.by ? ` (${r.pto.by})` : ""))}">${esc(t)}${r.pto.state === "no" && r.pto.comment ? ": " + esc(r.pto.comment) : ""}</b>`;
  };
  const ptoBtn = () => {
    const n = CUR.rows.filter((r) => r.pto && (r.pto.state === "new" || r.pto.state === "no")).length;
    const all = CUR.rows.filter((r) => r.pto).length;
    return all ? `<button type="button" class="btn-ghost sm snb-ptob" id="snbPto"
      title="Замены (аналоги), выбранные снабжением, — ведущему инженеру ПТО одной заявкой"
      >Согласовать в ПТО${n ? ` <i>${n}</i>` : ""}</button>` : "";
  };

  /* «Согласовать в ПТО»: замены строками — что в проекте и что вместо него;
     новые отмечены, не согласованные ПТО — по выбору; кому — ведущему
     инженеру ПТО (у кого «Объекты»). Ему — сообщение в мессенджер. */
  async function ptoSend() {
    let d;
    try {
      d = await AUTH.api("GET", "/supply/" + encodeURIComponent(openId) + "/pto");
    } catch (e) {
      note(e.message, true);
      return;
    }
    if (!d.rows.length) { note("Замен нет: аналог не выбран ни у одной позиции"); return; }
    let lastTo = "";
    try { lastTo = localStorage.getItem("snb.pto.to") || ""; } catch (e) { /* без памяти */ }
    const to0 = d.people.some((x) => x.id === lastTo) ? lastTo : ((d.people.find((x) => x.pto) || {}).id || "");
    const on = new Set(d.rows.filter((x) => x.state === "new").map((x) => x.position_id));
    const box = document.createElement("div");
    box.className = "pf-modal";
    box.innerHTML = `
      <div class="pf-crop snb-pto" role="dialog" aria-label="Согласовать замены в ПТО">
        <div class="snb-ho-h"><h3>Согласовать замены в ПТО</h3><span class="sit-hint">${esc(CUR.supply.site)} · ${esc(CUR.supply.title)}</span></div>
        <div class="snb-pto-list">${d.rows.map((x) => `<label class="snb-pto-r st-${esc(x.state)}">
          <input type="checkbox" data-pr="${esc(x.position_id)}"${on.has(x.position_id) ? " checked" : ""}${
            x.state === "wait" || x.state === "ok" ? " disabled" : ""}>
          <span class="snb-pto-a"><i>в проекте</i><b>${esc(x.name)}</b>${x.brand ? `<small>${esc(x.brand)}</small>` : ""}</span>
          <span class="snb-pto-arr">→</span>
          <span class="snb-pto-a"><i>замена · ${esc(x.supplier)}</i><b>${esc(x.alt_name || "—")}</b>${x.alt_brand
            ? `<small>${esc(x.alt_brand)}</small>` : ""}</span>
          <em class="snb-ptol ${esc(x.state)}" title="${esc(x.comment || "")}">${esc((PTO_ST[x.state] || PTO_ST.new)[0].replace("замена — ", ""))}${
            x.state === "no" && x.comment ? ": " + esc(x.comment) : ""}</em></label>`).join("")}</div>
        <div class="snb-ho-f snb-pto-f">
          <label class="fld"><span>Кому — ведущему инженеру ПТО</span><select id="ptoTo">${d.people.map((p) =>
            `<option value="${esc(p.id)}"${p.id === to0 ? " selected" : ""}>${esc(p.name)}${p.job ? " · " + esc(p.job) : ""}</option>`).join("")}</select></label>
          <label class="fld"><span>Комментарий</span><input id="ptoNote" maxlength="300" placeholder="например: аналоги по наличию у поставщика"></label>
        </div>
        <div class="pf-note bad" id="ptoErr" hidden></div>
        <div class="pf-modal-foot"><span class="grow"></span>
          <button type="button" class="btn ghost" id="ptoNo">Отмена</button>
          <button type="button" class="btn" id="ptoOk">Отправить в ПТО</button></div>
      </div>`;
    document.body.appendChild(box);
    const close = () => { document.removeEventListener("keydown", key); box.remove(); };
    const key = (e) => { if (e.key === "Escape") close(); };
    document.addEventListener("keydown", key);
    box.addEventListener("mousedown", (e) => { if (e.target === box) close(); });
    $n("#ptoNo", box).addEventListener("click", close);
    $n("#ptoOk", box).addEventListener("click", async () => {
      const rows = [...box.querySelectorAll("[data-pr]:checked")].map((x) => x.dataset.pr);
      const err = $n("#ptoErr", box);
      if (!rows.length) { err.textContent = "Отметьте замены, которые отправить"; err.hidden = false; return; }
      const to = $n("#ptoTo", box).value;
      try {
        const out = await AUTH.api("POST", "/supply/" + encodeURIComponent(openId) + "/pto",
          { rows, to, note: $n("#ptoNote", box).value });
        try { localStorage.setItem("snb.pto.to", to); } catch (e) { /* без памяти */ }
        close();
        await reload();
        note(`Замены в ПТО — ${out.rows.length}: ${out.to_name || "ведущему инженеру"}.`
          + (out.notified && out.notified.sent ? " Ему ушло сообщение в мессенджер." : ""));
      } catch (e) {
        err.textContent = e.message;
        err.hidden = false;
      }
    });
  }

  /* Цена объекта (правка № 28, 23.10.2026): «выделить оранжевым и
     заблокировать — не менять и не отправлять поставщикам». */
  const ownTag = () => `<b class="snb-ownl" title="Поставщика и цену выбрал заказчик: строка закрыта — другого поставщика не выбрать, цены других не вписать, в запрос поставщикам не идёт">${
    ICO.lock}цена объекта</b>`;

  /* «Д» — давальческий материал (правка № 46): его даёт заказчик, отметку
     ставят в ВДЦ или в расчёте тендера. */
  const davTag = (r) => `<b class="snb-dav" title="Давальческий материал — его даёт заказчик: снабжение его не покупает. Отметка из ВДЦ или расчёта тендера">Д · давальческий${
    r.need ? "" : " — не покупаем"}</b>`;

  function rowHtml(r) {
    if (r.kind === "section") {
      return `<tr class="sec"><td colspan="${span()}" class="sec-name"><span class="sec-in">${esc(r.name)}</span></td></tr>`;
    }
    const fx = r.fixed || {};
    const b = r.best;
    const w = why(r);
    const P = Object.fromEntries((r.pick || []).map((x) => [x.source, x]));
    // Дороже договорной — красным: на этой позиции закупка в убыток.
    const over = b && r.contract && b.price > r.contract;
    const late = isLate(r);
    const dueSet = r.due !== null && r.due !== undefined;
    // Выбран вручную, а у того поставщика цены больше нет — действует правило.
    const lost = !!(r.hand && !(b && b.manual));
    const tender = isTender();
    return `<tr class="${r.need ? "" : "snb-off"}${r.need && !b ? " snb-nop" : ""}${r.own ? " snb-own" : ""}" data-row="${esc(r.id)}">
      <td class="s-no snb-mb" title="${esc(r.pos_no)}">${esc(r.pos_no)}</td>
      <td class="s-name snb-mb"><button type="button" class="snb-position" data-position title="Открыть карточку позиции">${esc(r.name)}</button>${r.maker || w || r.skip || r.own || r.pto || r.dav
        ? `<i class="snb-sub">${r.skip ? '<b class="snb-nc">не в договоре</b>' : ""}${r.own ? ownTag() : ""}${r.dav ? davTag(r) : ""}${ptoTag(r)}${
          esc([r.maker, w].filter(Boolean).join(" · "))}</i>` : ""}${
        copyBtn(r.name)}</td>
      ${copyCell(r.brand)}
      ${copyCell(r.code)}
      <td class="snb-mb">${esc(r.unit)}</td>
      <td class="num snb-mb snb-qty">${qtyTxt(r.qty_buy)}</td>
      ${tender ? refCols().map((c) => grpCells(r, c, P[c.id])).join("")
        : r.skip ? `<td colspan="2" class="snb-fix snb-ncc snb-mb snb-mbe" title="Строка «Не учитывать» калькуляции: в договор не вошла">не в договоре</td>`
        : `<td class="num snb-fix snb-mb">${r.contract ? money(r.contract) : ""}</td>
      <td class="num snb-fix snb-mb snb-mbe">${!fx.in_set && fx.sum_buy ? money(fx.sum_buy) : ""}</td>`}
      ${tender ? "" : competeCells(r)}
      ${r.need ? `<td class="num snb-due${dueSet ? " has" : ""}${can() ? " ed" : ""}" data-due
        title="${esc(dueSet ? `Нужна за ${r.due} дн.: выбор — среди тех, кто успевает${can() ? ". Щелчок — изменить" : ""}`
          : `Срок не ограничен${can() ? " — щелчок, чтобы вписать" : ""}`)}">${dueSet ? days(r.due) : ""}</td>`
        : '<td class="snb-due"></td>'}
      ${tender ? "" : `<td class="num snb-best${b ? (b.maybe ? " maybe" : "") + (over ? " over" : "") + (b.late ? " dl" : "")
        + (b.manual ? " hand" : "") : late ? " late" : " none"}${lost ? " lost" : ""}${
        (r.pick || []).length ? " why" : ""}" data-why title="${esc(b
        ? [b.manual ? `Выбран вручную${handBy(r)}${b.auto && b.auto !== b.source ? `; по правилу — ${b.auto_who}, приведённая ${
            money(b.auto_pv)}` : ""}` : "",
          lost ? "Ручной выбор не действует: у выбранного поставщика больше нет цены — взят выбор по правилу" : "",
          over ? `Дороже договорной на ${money(b.price - r.contract)} за ед.` : "",
          b.maybe ? "Найдено неуверенно — сверьте товар" : "",
          b.late ? (b.manual ? `Выбран вручную, но к сроку ${r.due} дн. не успевает`
            : `Цена объекта — указание заказчика, но к сроку ${r.due} дн. не подтверждена`) : "",
          "Щелчок — почему этот поставщик"].filter(Boolean).join(". ")
        : late ? `Нужна за ${r.due} дн., а к сроку никто не успевает. Щелчок — разбор`
        : r.need && r.skip ? "Не в договоре — счета не запрашиваем"
        : r.need ? "Цены нет — запросите у поставщиков" : "")}">${b
        ? (b.manual ? ICO.pin : "") + money(b.price) + (b.maybe ? '<span class="q">?</span>' : "")
        : late ? "к сроку нет" : r.need ? "—" : ""}</td>
      <td class="num snb-pv${b ? " has" : ""}" title="${esc(b ? "Приведённая: " + pvMath(b) : "")}">${b ? money(b.pv) : ""}</td>
      <td class="snb-who${b ? " has" : ""}" title="${esc(b ? b.who + (b.manual ? " — выбран вручную" + handBy(r) : "") : "")}">${b
        ? esc(b.who) + (b.manual ? '<i class="snb-hand">вручную</i>' : b.own ? '<i class="snb-hand">заказчик</i>' : "") : ""}</td>
      <td class="snb-term${b && b.term ? " has" : ""}" title="${esc(b && b.term ? b.term + (b.days !== null ? ` — ${b.days} дн.` : "") : "")}">${
        b ? esc(b.term || "") : ""}</td>
      <td class="num snb-def${b ? " has" : ""}" title="${esc(b ? (b.defer ? `Отсрочка платежа ${b.defer} дн.` : "Без отсрочки") : "")}">${
        b ? (b.defer ? b.defer : "—") : ""}</td>
      <td class="num snb-bsum${b ? " has" : ""}" title="${esc(b ? `Приведённая на всё количество — ${money(r.sum_pv)}` : "")}">${
        r.sum ? money(r.sum) : ""}</td>`}
      ${factCell(r, b)}
      <td class="snb-comment" title="${esc(r.comment || "Открыть карточку позиции")}"><button type="button" data-position>${esc(r.comment || "＋")}</button></td>
      ${mainCols().map((c) => grpCells(r, c, P[c.id])).join("")}${refCols().length && !tender ? '<td class="snb-refc"></td>' : ""}${
        REF_OPEN && !tender ? refCols().map((c) => grpCells(r, c, P[c.id])).join("") : ""}
    </tr>`;
  }

  /* Копирование (20.10.2026): марка и код — щелчком по клетке, наименование
     — значком в углу (щелчок по названию открывает карточку позиции). */
  const copyCell = (v) => `<td class="snb-tx snb-mb${v ? " snb-cp" : ""}"${v ? ` data-copy="${esc(v)}"` : ""}
    title="${esc(v ? v + " — щелчок: скопировать" : "")}">${esc(v)}</td>`;
  const copyBtn = (v) => (v ? `<button type="button" class="snb-cpy" data-copy="${esc(v)}" title="Скопировать наименование"
    aria-label="Скопировать наименование">${ICO.copy}</button>` : "");
  async function copyText(text, el) {
    try {
      await navigator.clipboard.writeText(text);
    } catch (e) {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.cssText = "position:fixed;opacity:0;top:0;left:0";
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); } catch (er) { /* не вышло — ниже скажем */ }
      ta.remove();
    }
    const cell = el.closest("td") || el;
    cell.classList.add("snb-copied");
    setTimeout(() => cell.classList.remove("snb-copied"), 900);
    note(`Скопировано: ${text.length > 90 ? text.slice(0, 90) + "…" : text}`);
  }

  /* Шапка уходит вверх при прокрутке таблицы вниз и возвращается наверху
     (20.10.2026: «должна быть видна строка поиска и „Без цены“, остальное
     — скрываться»). Кнопка в полосе — свернуть и показать руками. */
  let HEAD_MINI = false;
  const miniBtn = () => `<button type="button" class="snb-mini-b" id="snbMini" aria-expanded="${!HEAD_MINI}"
    title="${HEAD_MINI ? "Показать шапку проработки" : "Свернуть шапку — больше строк на экране"}">${HEAD_MINI ? ICO.down2 : ICO.up2}</button>`;
  function wireMini(host) {
    const body = $n(".snb-body", host), page = $n(".snb-proc", host), btn = $n("#snbMini", host);
    if (!body || !page) return;
    const set = (on) => {
      if (HEAD_MINI === on && page.classList.contains("snb-mini") === on) return;
      HEAD_MINI = on;
      page.classList.toggle("snb-mini", on);
      if (btn) {
        btn.innerHTML = on ? ICO.down2 : ICO.up2;
        btn.setAttribute("aria-expanded", String(!on));
        btn.title = on ? "Показать шапку проработки" : "Свернуть шапку — больше строк на экране";
      }
    };
    let last = body.scrollTop;
    body.addEventListener("scroll", () => {
      const y = body.scrollTop;
      if (y > last + 2 && y > 60) set(true);
      else if (y <= 4) set(false);
      last = y;
    }, { passive: true });
    if (btn) btn.addEventListener("click", () => set(!HEAD_MINI));
  }

  /* Контакты менеджера поставщика — при наведении на его имя в выбранной
     паре (20.10.2026): ФИО, телефон, почта из справочника поставщиков. */
  let CARD = null;
  const dropCard = () => { if (CARD) { CARD.remove(); CARD = null; } };
  function peopleCard(el) {
    dropCard();
    const c = (CUR.cols || []).find((x) => x.id === el.dataset.people) || {};
    const ppl = c.people || [];
    CARD = document.createElement("div");
    CARD.className = "snb-hcard";
    CARD.innerHTML = `<b>${esc(c.name || el.textContent)}</b>${ppl.length ? ppl.map((x) => `<div>${esc(x.name || "Контакт")}${
      x.phone ? `<span>${esc(x.phone)}</span>` : ""}${x.email ? `<i>${esc(x.email)}</i>` : ""}</div>`).join("")
      : `<div class="none">Контактов нет — их заводят в «Снабжение → Поставщики и группы»</div>`}${
      c.defer !== null && c.defer !== undefined ? `<div class="cond">Условия поставщика: отсрочка ${esc(c.defer)} дн.</div>` : ""}`;
    document.body.appendChild(CARD);
    const r = el.getBoundingClientRect();
    const w = CARD.offsetWidth, h = CARD.offsetHeight;
    CARD.style.left = Math.max(8, Math.min(r.left, innerWidth - w - 8)) + "px";
    CARD.style.top = (r.bottom + 6 + h < innerHeight - 8 ? r.bottom + 6 : Math.max(8, r.top - h - 6)) + "px";
  }

  // «, Женя 13.10.2026» — кто и когда выбрал поставщика вручную.
  const handBy = (r) => (r.hand && r.hand.by ? `: ${r.hand.by}${r.hand.at ? " " + dmy(r.hand.at) : ""}` : "");

  /* Конкурентная проработка строки: лучшая цена, лучшая приведённая и
     предложения «цена — поставщик» по возрастанию приведённой. Выбранный —
     зелёным (вручную — с булавкой), кого взяло бы правило — рамкой,
     опоздавший к сроку — зачёркнут, справочный (каталог, прайс) — курсивом. */
  function competeCells(r) {
    const N = slots();
    const c = r.compete;
    if (!r.need || !c) return `<td class="snb-c0" colspan="${(BEST_OPEN ? 2 : 1) + 2 * N}"></td>`;
    const P = Object.fromEntries((r.pick || []).map((x) => [x.source, x]));
    const b = r.best;
    const dueSet = r.due !== null && r.due !== undefined;
    const inTime = dueSet ? ` среди успевающих за ${r.due} дн.` : "";
    const none = dueSet && c.offers.length && !c.low_price;
    let html = BEST_OPEN ? `<td class="num snb-lp${c.low_price ? " has" : ""}${none ? " late" : ""}" title="${esc(c.low_price
      ? `Лучшая цена${inTime} — ${c.low_price.who}` : none ? `К сроку ${r.due} дн. не успевает никто` : "")}">${
      c.low_price ? money(c.low_price.price) : none ? "к сроку нет" : ""}</td>
      <td class="num snb-lv${c.low_pv ? " has" : ""}" title="${esc(c.low_pv
        ? `Лучшая приведённая${inTime} — ${c.low_pv.who}: ${pvMath(c.low_pv)}` : "")}">${c.low_pv ? money(c.low_pv.pv) : ""}</td>`
      : `<td class="snb-bsc${c.low_price ? " has" : ""}${none ? " late" : ""}" data-best-toggle title="${esc((c.low_price
        ? `Лучшая цена${inTime}: ${money(c.low_price.price)} — ${c.low_price.who}` + (c.low_pv
          ? `; лучшая приведённая: ${money(c.low_pv.pv)} — ${c.low_pv.who}` : "")
        : none ? `К сроку ${r.due} дн. не успевает никто` : "Лучших цен нет") + ". Щелчок — развернуть")}"></td>`;
    // Первая пара — выбранный поставщик, в рамке (20.10.2026); выбора нет
    // (к сроку никто не успевает) — она пустая, предложения дальше.
    const list = c.offers.length && (P[c.offers[0]] || {}).ok ? c.offers : [""].concat(c.offers);
    const more = c.more + Math.max(0, list.length - N);
    for (let i = 0; i < N; i++) {
      const s = list[i];
      const x = s && P[s];
      const o1 = i === 0 ? " snb-o1" : "", w1 = i === 0 ? " snb-w1" : "";
      if (!x) {
        html += `<td class="num snb-op${o1}"></td><td class="snb-ow${w1}${i === 0 ? " snb-w1x" : ""}"${i === 0 && c.offers.length
          ? ' title="Выбора нет: к сроку никто не успевает"' : ""}></td>`;
        continue;
      }
      const hand = x.ok && b && b.manual;
      const cls = [x.ok ? "best" : "", hand ? "hand" : "", b && b.manual && b.auto === s && !x.ok ? "auto" : "",
        !x.ok && /срок/.test(x.why) ? "cut" : "", x.state === "maybe" ? "maybe" : "", REFS.has(s) ? "snb-refo" : "",
        can() && !r.own ? "ed" : ""].filter(Boolean).join(" ");
      // «Выбрано» дороже договорной цены — красным (правка № 34).
      const over1 = i === 0 && x.ok && r.contract && x.price > r.contract;
      const t = [`${x.who}: ${money(x.price)} за ед.`, x.defer ? `отсрочка ${x.defer} дн., приведённая ${pvMath(x)}` : "",
        x.term ? `срок ${x.term}${x.days !== null && x.days !== undefined ? ` (${x.days} дн.)` : ""}` : "",
        REFS.has(s) ? (s === "invoice" ? "из прайса материалов — справочно" : "каталог — справочно") : "",
        x.why + (hand ? handBy(r) : ""),
        over1 ? `дороже договорной (${money(r.contract)}) на ${money(x.price - r.contract)} за ед.` : "",
        r.own ? "цена объекта: поставщика выбрал заказчик, строка закрыта"
          : can() ? (hand ? "Щелчок — вернуть выбор по правилу" : "Щелчок — выбрать этого поставщика вручную") : ""]
        .filter(Boolean).join(" · ");
      const tail = i === N - 1 && more ? `<i class="snb-more">+${more}</i>` : "";
      // Выбранный (20.10.2026): сверху условие оплаты — отсрочка или
      // предоплата, посередине поставщик (наведите — контакты менеджера),
      // снизу счёт — щелчок открывает его файл.
      if (i === 0) {
        const o = (r.prices || {})[s] || {};
        const inv = o.origin ? (CUR.invoices || []).find((v) => v.id === o.origin) : null;
        const src = inv ? `<button type="button" class="snb-w1-inv" data-inv-file="${esc(inv.id)}"
            title="Открыть счёт № ${esc(inv.number || "б/н")}">Счёт № ${esc(inv.number || "б/н")}${inv.date ? " от " + esc(dmy(inv.date)) : ""}</button>`
          : s === "obj" ? "цена объекта" : isSup(s) && !o.origin ? "вписано руками" : "";
        html += `<td class="num snb-op ${cls}${o1}${over1 ? " over" : ""}" data-offer="${esc(s)}" title="${esc(t)}">${money(x.price)}${
          x.state === "maybe" ? '<span class="q">?</span>' : ""}</td><td class="snb-ow ${cls}${w1} snb-w1x" data-offer="${esc(s)}">
          <span class="snb-w1-c${x.defer ? " def" : ""}" title="${esc(x.defer ? `Отсрочка платежа ${x.defer} дн. — ${x.defer_own
            ? "по счёту" : "из условий поставщика"}` : "Отсрочки нет — предоплата")}">${x.defer ? `Отсрочка ${x.defer} дн.` : "Предоплата"}</span>
          <b class="snb-w1-n"${isSup(s) ? ` data-people="${esc(s)}"` : ""}>${hand ? ICO.pin : ""}${esc(x.who)}</b>
          <span class="snb-w1-i">${src}</span></td>`;
        continue;
      }
      html += `<td class="num snb-op ${cls}${o1}" data-offer="${esc(s)}" title="${esc(t)}">${money(x.price)}${
        x.state === "maybe" ? '<span class="q">?</span>' : ""}</td><td class="snb-ow ${cls}${w1}" data-offer="${esc(s)}"
        title="${esc(t + (more && i === N - 1 ? ` · ещё ${more} — в колонках поставщиков` : ""))}">${hand ? ICO.pin : ""}${tail}${esc(x.who)}</td>`;
    }
    return html;
  }

  // Факт. цена закупки: щелчок — вписать; дороже выбора — красным.
  // Средняя по поставкам «Рабочей» (20.10.2026) — щелчок открывает их
  // карточку; поставок нет — цену вписывают руками, как прежде.
  function factCell(r, b) {
    if (!r.need) return '<td class="snb-fact"></td>';
    const has = r.fact !== null && r.fact !== undefined;
    const auto = !!r.deliv_n;
    const over = has && b && r.fact > b.price;
    const vs = b ? `выбор — ${money(b.price)}${over ? `, дороже на ${money(r.fact - b.price)}` : ""}` : "";
    const tipT = auto ? [`Средняя закупки по поставкам «Рабочей» (${r.deliv_n}): куплено ${qtyTxt(r.bought)} из ${
      qtyTxt(r.qty_buy)} ${r.unit || ""}`, vs, "Щелчок — карточка поставок"].filter(Boolean).join(". ")
      : has ? [`Куплено по ${money(r.fact)} за ед. — вписано руками`, vs].filter(Boolean).join(", ")
      : can() ? "Щелчок — вписать цену, по которой купили" : "";
    return `<td class="num snb-fact${has ? " has" : ""}${auto ? " auto" : ""}${over ? " over" : ""}${can() || auto ? " ed" : ""}"
      data-fact title="${esc(tipT)}">${has ? money(r.fact) : ""}</td>`;
  }

  function offerTip(o) {
    const hand = o.name === "вписано руками";
    return [o.name && !hand ? o.name : "", o.code ? "код " + o.code : "",
      o.price != null ? `${money(o.price)} за ${o.unit || "ед."}` : "",
      o.term ? "срок: " + o.term : "", o.analog ? "аналог — не то, что в проекте" : "", o.at ? dmy(o.at) : "",
      o.clash ? "единицы не сошлись — в выбор не идёт" : "",
      o.state === "maybe" ? "найдено неуверенно" : "",
      hand ? "вписано руками" : ""].filter(Boolean).join(" · ");
  }

  /* Клетки группы поставщика: цена, срок, отсрочка. Своё у строки (из счёта,
     КП) — обычным, взятое из условий поставщика — бледным. Выбранный —
     зелёным; отсечённый по сроку — зачёркнут; в подсказке цены — его
     приведённая стоимость и чем кончился выбор. */
  function grpCells(r, c, x) {
    const o = (r.prices || {})[c.id] || {};
    const fold = folded(c);
    const v = o.price != null ? (o.per_unit != null ? o.per_unit : o.price) : null;
    const chosen = !!(x && x.ok);
    const cut = !!(x && !x.ok && /срок/.test(x.why));
    const q = !!(x && x.state === "maybe");
    const tipTxt = [offerTip(o), x && x.pv !== null ? "приведённая " + pvMath(x) : "",
      x && !x.ok ? x.why : chosen ? "выбран" : ""].filter(Boolean).join(" · ");
    const editable = can() && isSup(c.id) && r.need && !r.own;
    const value = v !== null ? money(v) + (q ? '<span class="q">?</span>' : "")
      + (o.analog ? '<span class="snb-an" title="Аналог — поставщик дал не то, что в проекте">А</span>' : "") : "";
    const pc = `<td class="num snb-p snb-sp${chosen ? " best" : ""}${cut ? " cut" : ""}${q ? " maybe" : ""}${o.clash ? " clash" : ""}"
      title="${esc([tipTxt, editable ? "Щелчок — изменить цену с НДС за единицу" : ""].filter(Boolean).join(" · "))}">${
        editable ? `<button type="button" class="snb-price-edit${v === null ? " empty" : ""}" data-price="${esc(c.id)}"
          aria-label="${esc(`${c.name}: ${r.name}. ${v !== null ? `Цена ${money(v)} руб. с НДС, изменить` : "Вписать цену с НДС"}`)}">${
          value || "＋"}</button>` : value}</td>`;
    if (fold) return pc;
    // Срок и отсрочку показываем там, где у поставщика есть цена или срок.
    const show = !!x || !!o.term;
    const term = x ? x.term : o.term || "";
    const termInh = !!(x && term && !x.term_own);
    const defer = x ? x.defer : o.defer;
    const deferInh = !!(x && defer !== null && defer !== undefined && !x.defer_own);
    const dTxt = defer === null || defer === undefined ? "" : defer;
    // Срок поставки по позиции вписывают так же, как цену (офис, 16.10.2026):
    // щелчок по клетке — поле; пусто — снова срок из условий поставщика.
    const termTip = show && term ? term + (x && x.days !== null ? ` — ${x.days} дн.` : "")
      + (termInh ? " · по условиям поставщика" : "") : "";
    return pc + `<td class="snb-st${chosen ? " best" : ""}${cut ? " cut" : ""}${termInh ? " inh" : ""}"
      title="${esc([termTip, editable ? "Щелчок — срок поставки по этой позиции" : ""].filter(Boolean).join(" · "))}">${
        editable ? `<button type="button" class="snb-term-edit${show && term ? "" : " empty"}" data-term="${esc(c.id)}"
          aria-label="${esc(`${c.name}: ${r.name}. ${show && term ? `Срок ${term}, изменить` : "Вписать срок поставки"}`)}">${
          show && term ? esc(term) : "＋"}</button>` : show ? esc(term) : ""}</td>
      <td class="num snb-sd${chosen ? " best" : ""}${deferInh ? " inh" : ""}"
        title="${esc(show && dTxt !== "" ? `отсрочка ${dTxt} дн.${deferInh ? " · по условиям поставщика" : ""}` : "")}">${
        show ? dTxt : ""}</td>`;
  }

  /* ── всплывающее окошко у клетки ─────────────────────────── */
  let POP = null;
  function closePop() {
    if (POP) { POP.remove(); POP = null; }
    document.removeEventListener("mousedown", popAway, true);
    document.removeEventListener("keydown", popKey);
  }
  function popAway(e) { if (POP && !POP.contains(e.target)) closePop(); }
  function popKey(e) { if (e.key === "Escape") closePop(); }
  function popAt(anchor, html, cls) {
    closePop();
    POP = document.createElement("div");
    POP.className = "snb-pop " + (cls || "");
    POP.innerHTML = html;
    document.body.appendChild(POP);
    const a = anchor.getBoundingClientRect();
    const w = POP.offsetWidth, h = POP.offsetHeight;
    const x = Math.max(8, Math.min(a.left, innerWidth - w - 8));
    const below = innerHeight - a.bottom >= h + 12 || a.top < h + 12;
    POP.style.left = x + "px";
    POP.style.top = Math.max(8, below ? a.bottom + 6 : a.top - h - 6) + "px";
    setTimeout(() => {
      document.addEventListener("mousedown", popAway, true);
      document.addEventListener("keydown", popKey);
    });
    return POP;
  }

  /* Разбор выбора по строке: правило, формула, каждый поставщик — цена,
     отсрочка, срок, приведённая и чем кончилось. «Почему принято такое
     решение» (заказчик, 08.10.2026). */
  function whyPop(td, r) {
    const b = r.best;
    const dueSet = r.due !== null && r.due !== undefined;
    const tender = CUR.supply.mode === "tender";
    const rule = dueSet
      ? `Нужна за ${r.due} дн.: отсекаем тех, чей срок больше или не назван; из оставшихся — ${tender ? "максимальная цена" : "минимальная приведённая"}.`
      : `Срок не ограничен: ${tender ? "максимальная цена" : "минимальная приведённая"} среди поставщиков.`;
    const rows = (r.pick || []).map((x) => `<tr class="${x.ok ? "ok" : /срок/.test(x.why) ? "cut" : ""}">
      <td>${esc(x.who)}</td><td class="num">${x.price !== null ? money(x.price) : "—"}</td>
      <td class="num${x.defer_own ? "" : " inh"}">${x.defer !== null && x.defer !== undefined ? x.defer : "—"}</td>
      <td class="${x.term_own ? "" : "inh"}">${esc(x.term || "—")}${x.days !== null && x.term ? ` <i>${x.days} дн.</i>` : ""}</td>
      <td class="num"><b>${x.pv !== null ? money(x.pv) : "—"}</b></td>
      <td class="snb-why-r">${x.ok ? "✓ выбран" : esc(x.why)}</td></tr>`).join("");
    const lost = !!(r.hand && !(b && b.manual));
    const pop = popAt(td, `
      <div class="snb-why-h"><b>${b ? `Выбор: ${esc(b.who)}${b.manual ? " — вручную" : ""}` : dueSet
        ? `К сроку ${r.due} дн. никто не успевает` : "Выбора нет"}</b>
        <i>${esc(r.name)}</i></div>
      ${b && b.manual ? `<div class="snb-why-hand">${ICO.pin}<span>Выбран вручную${esc(handBy(r))}.${b.auto && b.auto !== b.source
        ? ` По правилу был бы ${esc(b.auto_who)} — приведённая ${money(b.auto_pv)}.` : " По правилу — он же."}</span>${can()
        ? `<button type="button" class="lnk" data-unpick>Вернуть выбор по правилу</button>` : ""}</div>` : ""}
      ${lost ? `<div class="snb-why-hand lost"><span>Вручную выбранного поставщика нет среди цен позиции (счёт убран или
        цена пропала) — действует выбор по правилу.</span>${can() ? `<button type="button" class="lnk" data-unpick>Снять ручной выбор</button>` : ""}</div>` : ""}
      <div class="snb-why-rule">${esc(rule)}${b && b.tie ? " При равной приведённой — у кого отсрочка больше." : ""}
        ${b && b.own ? " Цена объекта — указание заказчика: она идёт первой." : ""}</div>
      <div class="snb-why-f">Приведённая = цена − цена × ${pct(CUR.rate)} ВКЛ × отсрочка / 365</div>
      <table class="snb-why-t"><thead><tr><th>Поставщик</th><th class="num">Цена</th><th class="num">Отср., дн.</th>
        <th>Срок</th><th class="num">Приведённая</th><th></th></tr></thead><tbody>${rows}</tbody></table>
      <div class="snb-why-n">Бледным — по условиям поставщика: строка счёта их не назвала.${can()
        ? " Выбрать вручную — щелчком по цене в конкурентной проработке." : ""}</div>`, "snb-why");
    const un = $n("[data-unpick]", pop);
    if (un) un.addEventListener("click", () => { closePop(); setPick(r, ""); });
  }

  /* Поставщик вручную — щелчок по цене в конкурентной проработке; по
     выбранному вручную — вернуть выбор по правилу (src = ""). */
  async function setPick(r, src) {
    const off = !src || (r.best && r.best.manual && r.best.source === src);
    try {
      const out = await AUTH.api("POST", "/supply/" + encodeURIComponent(openId) + "/pick",
        { row: r.id, source: off ? "" : src });
      CUR.rows = CUR.rows.map((x) => (x.id === r.id ? out.row : x));
      CUR.totals = out.totals;
      SIG = "";
      render();
      const nb = out.row.best;
      note(off ? `«${r.name}»: снова выбор по правилу${nb ? " — " + nb.who : ""}`
        : `«${r.name}»: выбран вручную ${nb ? nb.who : ""}. Щелчок по нему же — вернуть выбор по правилу`);
    } catch (e) {
      note("Не записалось: " + e.message, true);
    }
  }

  /* Условия поставщика — у его группы: отсрочка и срок по умолчанию. */
  function termsPop(btn, c) {
    const pop = popAt(btn, `
      <div class="snb-why-h"><b>${esc(c.name)}</b><i>условия поставщика — на все объекты</i></div>
      <label class="fld"><span>Отсрочка платежа, дней</span>
        <input class="pos-in" data-f="defer" inputmode="numeric" value="${esc(c.defer ?? "")}" placeholder="нет — предоплата"></label>
      <label class="fld"><span>Срок поставки, если строка его не называет</span>
        <input class="pos-in" data-f="term" maxlength="60" value="${esc(c.term || "")}" placeholder="в наличии, 5 дней, 2 недели"></label>
      <div class="pf-note bad" data-err hidden></div>
      <div class="snb-pop-foot"><button type="button" class="btn-ghost sm" data-no>Отмена</button>
        <button type="button" class="btn-brand sm" data-ok>Сохранить</button></div>`, "snb-terms");
    const inp = (f) => $n(`[data-f="${f}"]`, pop);
    inp("defer").focus();
    $n("[data-no]", pop).addEventListener("click", closePop);
    const save = async () => {
      try {
        CUR = await AUTH.api("POST", "/supply/" + encodeURIComponent(openId) + "/terms",
          { key: c.id, name: c.name, defer: inp("defer").value.trim(), term: inp("term").value.trim() });
        closePop();
        SIG = "";
        render();
        note(`Условия «${c.name}» сохранены — выбор пересчитан`);
      } catch (e) {
        const er = $n("[data-err]", pop);
        er.textContent = e.message;
        er.hidden = false;
      }
    };
    $n("[data-ok]", pop).addEventListener("click", save);
    pop.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); save(); } });
  }

  /* «Нужно за» в клетке: щелчок — поле; Enter или уход — записать, Esc —
     отменить; пусто — снять срок. */
  function editDue(td) {
    if (td.querySelector("input")) return;
    const rid = td.closest("tr").dataset.row;
    const r = CUR.rows.find((x) => x.id === rid);
    if (!r) return;
    const was = r.due === null || r.due === undefined ? "" : String(r.due);
    td.innerHTML = `<input class="pos-in num" inputmode="numeric" maxlength="3" value="${esc(was)}" placeholder="дн.">`;
    const inp = td.querySelector("input");
    inp.focus();
    inp.select();
    let done = false;
    const finish = async (save) => {
      if (done) return;
      done = true;
      const v = inp.value.trim();
      if (!save || v === was) { render(); return; }
      await setDue([rid], v);
    };
    inp.addEventListener("keydown", (e) => {
      if (e.key === "Enter") { e.preventDefault(); finish(true); }
      if (e.key === "Escape") { e.preventDefault(); finish(false); }
    });
    inp.addEventListener("blur", () => finish(true));
  }

  /* Факт. цена в клетке — как «нужно за»: Enter или уход — записать, Esc —
     отменить, пусто — снять. */
  function editFact(td) {
    if (td.querySelector("input")) return;
    const rid = td.closest("tr").dataset.row;
    const r = CUR.rows.find((x) => x.id === rid);
    if (!r) return;
    const was = r.fact === null || r.fact === undefined ? "" : String(r.fact).replace(".", ",");
    td.innerHTML = `<input class="pos-in num" inputmode="decimal" maxlength="16" value="${esc(was)}" placeholder="₽ за ед.">`;
    const inp = td.querySelector("input");
    inp.focus();
    inp.select();
    let done = false;
    const finish = async (save) => {
      if (done) return;
      done = true;
      const v = inp.value.trim();
      if (!save || v === was) { render(); return; }
      try {
        const out = await AUTH.api("POST", "/supply/" + encodeURIComponent(openId) + "/fact", { row: rid, price: v });
        CUR.rows = CUR.rows.map((x) => (x.id === rid ? out.row : x));
        CUR.totals = out.totals;
        SIG = "";
        render();
      } catch (e) {
        render();
        note("Не записалось: " + e.message, true);
      }
    };
    inp.addEventListener("keydown", (e) => {
      if (e.key === "Enter") { e.preventDefault(); finish(true); }
      if (e.key === "Escape") { e.preventDefault(); finish(false); }
    });
    inp.addEventListener("blur", () => finish(true));
  }

  /* Цена поставщика в правой группе таблицы: вводим видимую цену с НДС,
     сервер пересчитывает её в цену хранения и обновляет выбор по строке. */
  function editSupplierPrice(button) {
    const td = button.closest("td");
    if (!td || td.querySelector("input")) return;
    const rid = button.closest("tr").dataset.row;
    const key = button.dataset.price;
    const r = CUR.rows.find((x) => x.id === rid);
    if (!r) return;
    const offer = (r.prices || {})[key] || {};
    const price = offer.price != null ? (offer.per_unit != null ? offer.per_unit : offer.price) : null;
    const was = price === null ? "" : String(price).replace(".", ",");
    td.innerHTML = `<input class="pos-in num snb-price-in" inputmode="decimal" maxlength="18"
      aria-label="Цена поставщика с НДС за единицу" value="${esc(was)}" placeholder="с НДС">`;
    const inp = td.querySelector("input");
    inp.focus();
    inp.select();
    let done = false;
    const finish = async (save) => {
      if (done) return;
      done = true;
      const v = inp.value.trim();
      if (!save || v === was) { render(); return; }
      try {
        const out = await AUTH.api("POST", "/supply/" + encodeURIComponent(openId) + "/cell",
          { row: rid, key, price_gross: v });
        CUR.rows = CUR.rows.map((x) => (x.id === rid ? out.row : x));
        CUR.totals = out.totals;
        SIG = "";
        render();
      } catch (e) {
        render();
        note("Цена не записалась: " + e.message, true);
      }
    };
    inp.addEventListener("keydown", (e) => {
      if (e.key === "Enter") { e.preventDefault(); finish(true); }
      if (e.key === "Escape") { e.preventDefault(); finish(false); }
    });
    inp.addEventListener("blur", () => finish(true));
  }

  /* Срок поставки поставщика по позиции: «в наличии», «5 дней», «2 недели».
     Своё у строки перекрывает срок из условий поставщика; пусто — снять. */
  function editSupplierTerm(button) {
    const td = button.closest("td");
    if (!td || td.querySelector("input")) return;
    const rid = button.closest("tr").dataset.row;
    const key = button.dataset.term;
    const r = CUR.rows.find((x) => x.id === rid);
    if (!r) return;
    const was = ((r.prices || {})[key] || {}).term || "";
    td.innerHTML = `<input class="pos-in snb-term-in" maxlength="60" aria-label="Срок поставки"
      value="${esc(was)}" placeholder="5 дней">`;
    const inp = td.querySelector("input");
    inp.focus();
    inp.select();
    let done = false;
    const finish = async (save) => {
      if (done) return;
      done = true;
      const v = inp.value.trim();
      if (!save || v === was) { render(); return; }
      try {
        const out = await AUTH.api("POST", "/supply/" + encodeURIComponent(openId) + "/cell",
          { row: rid, key, term: v });
        CUR.rows = CUR.rows.map((x) => (x.id === rid ? out.row : x));
        CUR.totals = out.totals;
        SIG = "";
        render();
      } catch (e) {
        render();
        note("Срок не записался: " + e.message, true);
      }
    };
    inp.addEventListener("keydown", (e) => {
      if (e.key === "Enter") { e.preventDefault(); finish(true); }
      if (e.key === "Escape") { e.preventDefault(); finish(false); }
    });
    inp.addEventListener("blur", () => finish(true));
  }

  async function setDue(ids, v) {
    try {
      const out = await AUTH.api("POST", "/supply/" + encodeURIComponent(openId) + "/due", { rows: ids, days: v });
      const fresh = Object.fromEntries(out.rows.map((x) => [x.id, x]));
      CUR.rows = CUR.rows.map((x) => fresh[x.id] || x);
      CUR.totals = out.totals;
      SIG = "";
      render();
    } catch (e) {
      render();
      note("Не записалось: " + e.message, true);
    }
  }

  function positionCard(r) {
    const offers = ((r.compete || {}).offers || []).map((key) =>
      (r.pick || []).find((x) => x.source === key)).filter(Boolean);
    const box = document.createElement("div");
    box.className = "pf-modal";
    box.innerHTML = `<div class="pf-crop snb-position-card" role="dialog" aria-label="Позиция ${esc(r.name)}">
      <h3>${esc(r.name)}</h3>
      <p>${esc([r.brand, r.code && "код " + r.code, r.unit && qtyTxt(r.qty_buy) + " " + r.unit]
        .filter(Boolean).join(" · "))}</p>
      <div class="snb-pc-pics" id="spPics" hidden></div>
      <div class="snb-position-offers">
        <strong>${CUR.supply.mode === "tender" ? "Тендер: максимальная цена" : "Договор: минимальная приведённая стоимость"}</strong>
        ${offers.length ? offers.map((x) => {
          const inv = (CUR.invoices || []).find((i) => i.id === (r.prices[x.source] || {}).origin);
          return `<div class="snb-position-offer${r.best && r.best.source === x.source ? " picked" : ""}">
            <span><b>${esc(x.who)}</b><small>${esc([(r.prices[x.source] || {}).analog ? "аналог" : "", x.term,
              x.defer ? `отсрочка ${x.defer} дн.` : "без отсрочки"].filter(Boolean).join(" · "))}</small></span>
            <b>${money(x.price)}</b>
            ${inv ? `<button type="button" class="btn-ghost sm" data-invoice="${esc(inv.id)}">Открыть счёт</button>` : ""}
          </div>`;
        }).join("") : `<p>Цены поставщиков пока не загружены.</p>`}
      </div>
      <label class="fld"><span>Нужно на площадке за, дней</span><input id="spDue" type="number" min="0" max="999"
        value="${r.due ?? ""}"${can() ? "" : " readonly"}></label>
      <label class="fld"><span>Комментарий к позиции</span><textarea id="spComment" rows="4" maxlength="2000"${
        can() ? "" : " readonly"}>${esc(r.comment || "")}</textarea></label>
      <div class="pf-note bad" id="spErr" hidden></div>
      <div class="pf-modal-foot"><button type="button" class="btn ghost" id="spClose">Закрыть</button>
        ${can() ? `<button type="button" class="btn" id="spSave">Сохранить</button>` : ""}</div>
    </div>`;
    document.body.appendChild(box);
    const close = () => { document.removeEventListener("keydown", onKey); box.remove(); };
    const onKey = (e) => { if (e.key === "Escape") close(); };
    document.addEventListener("keydown", onKey);
    box.addEventListener("click", (e) => { if (e.target === box) close(); });
    $n("#spClose", box).addEventListener("click", close);
    showPics(r, $n("#spPics", box));
    box.querySelectorAll("[data-invoice]").forEach((b) => b.addEventListener("click", (e) =>
      DL.open("/api/supply-invoices/" + encodeURIComponent(b.dataset.invoice) + "/file", { btn: e.currentTarget })
        .catch((err) => { const el = $n("#spErr", box); el.textContent = err.message; el.hidden = false; })));
    const save = $n("#spSave", box);
    if (save) save.addEventListener("click", async () => {
      save.disabled = true;
      try {
        const comment = $n("#spComment", box).value.trim();
        const due = $n("#spDue", box).value.trim();
        if (comment !== (r.comment || "")) {
          await AUTH.api("POST", "/supply/" + encodeURIComponent(openId) + "/comment", { row: r.id, comment });
          r.comment = comment;
        }
        close();
        if (due !== (r.due == null ? "" : String(r.due))) await setDue([r.id], due);
        else render();
      } catch (e) {
        const el = $n("#spErr", box); el.textContent = e.message; el.hidden = false;
        save.disabled = false;
      }
    });
  }

  /* Фото товара (правка № 45, 26.10.2026): «при нажатии на позицию —
     изображение материала, как в каталоге ЭТМ или Русского Света». Фото —
     из каталога Элкома: по коду находки Элкома, ЭТМ или РС. Щелчок по фото
     открывает его крупно в новой вкладке. */
  async function showPics(r, host) {
    if (!host || r.kind === "section") return;
    let d;
    try {
      d = await AUTH.api("GET", "/positions/" + encodeURIComponent(r.id) + "/pictures");
    } catch (e) { return; }
    if (!host.isConnected) return;
    const pics = (d.pictures || []).slice(0, 3);
    if (!pics.length) {
      host.innerHTML = `<span class="snb-pc-none">${d.ready ? "Фото нет: товар не нашёлся в каталогах ЭТМ, Русского Света и Элкома"
        : "Фото появятся после обновления каталога Элкома — «Прайс материалов» → «Каталоги» → «обновить с портала»"}</span>`;
      host.hidden = false;
      return;
    }
    host.innerHTML = pics.map((p) => `<a class="snb-pc-pic" href="${esc(p.url)}" target="_blank" rel="noopener"
        title="Открыть крупно — фото из каталога ${esc(p.title)}, код ${esc(p.code)}"><img src="${esc(p.url)}" alt="${esc(r.name)}"
        loading="lazy"><i>${esc(p.title)} · ${esc(p.code)}</i></a>`).join("");
    host.querySelectorAll("img").forEach((img) => img.addEventListener("error", () => {
      const a = img.closest("a");
      if (a) a.remove();
      if (!host.querySelector("a")) host.hidden = true;
    }));
    host.hidden = false;
  }

  function invChip(x) {
    return `<span class="snb-inv${x.status === "applied" ? "" : " new"}" data-inv="${esc(x.id)}">
      <button type="button" class="snb-inv-t" data-inv-rv title="Сверка счёта: строки, позиции, цены и сроки">${ICO.file}<b>${
        esc(x.supplier || x.filename)}</b><i>№ ${esc(x.number || "б/н")}${x.date ? " от " + esc(dmy(x.date)) : ""}${
        x.status === "applied" ? ` · ${x.priced || 0} ${plural(x.priced || 0, "цена", "цены", "цен")}` : " · не записан"}</i></button>
      <button type="button" class="snb-inv-x" data-inv-open title="Открыть файл">${ICO.down}</button>
      ${can() ? `<button type="button" class="snb-inv-x warn" data-inv-del title="Убрать счёт и его цены">${ICO.no}</button>` : ""}
    </span>`;
  }

  function note(text, bad) {
    const box = $n("#snbNote");
    if (!box) return;
    box.textContent = text;
    box.classList.toggle("bad", !!bad);
    box.hidden = !text;
  }

  /* Шапка — общая у проработки и рабочей: назад, срок, вид, что дальше. */
  function wireHead(host) {
    const back = () => { openId = null; CUR = null; SIG = ""; VIEW = "proc"; load(); };
    $n("#snbBack", host).addEventListener("click", back);
    $n("#snbObj", host).addEventListener("click", back);
    const due = $n("#snbDueC", host);
    if (due && can()) due.addEventListener("click", () => duePop(due));
    host.querySelectorAll("[data-view]").forEach((b) => b.addEventListener("click", () => {
      const v = b.dataset.view === "work" ? "work" : "proc";
      if (VIEW === v) return;
      VIEW = v;
      LT = v === "work" ? "work" : "proc";
      saveLT();
      SIG = "";
      render();
    }));
    const won = $n("#snbWon", host);
    if (won) won.addEventListener("click", promoteDialog);
    const toWork = $n("#snbToWork", host);
    if (toWork) toWork.addEventListener("click", toWorkDialog);
    host.querySelectorAll("[data-go-sib]").forEach((b) => b.addEventListener("click", () =>
      go(b.dataset.goSib, b.dataset.sibKind)));
    return back;
  }

  // Перейти к другой проработке, не выходя из раздела.
  function go(id, kind) {
    openId = id;
    HEAD_MINI = false;
    LT = ["tender", "proc", "work"].includes(kind) ? kind : "proc";
    saveLT();
    VIEW = LT === "work" ? "work" : "proc";
    CUR = null;
    SIG = "";
    RQ = "";
    RF = "";
    WQ = "";
    WF = "";
    return load();
  }

  function wireProc(host) {
    const back = wireHead(host);
    if (typeof GRID === "object" && GRID.pan) GRID.pan($n(".snb-body", host));
    const table = $n(".snb-tbl", host);
    if (WIDTH && table) WIDTH.wire(table, table.tHead.rows[1], () => { SIG = ""; render(); });
    if (typeof GRID === "object" && GRID.freeze && table) GRID.freeze(table, 2);
    wireMini(host);
    table.addEventListener("mouseover", (e) => {
      const n = e.target.closest("[data-people]");
      if (n && (!CARD || CARD._for !== n)) { peopleCard(n); CARD._for = n; }
    });
    table.addEventListener("mouseout", (e) => {
      const n = e.target.closest("[data-people]");
      if (n && !n.contains(e.relatedTarget)) dropCard();
    });
    $n(".snb-body", host).addEventListener("scroll", dropCard, { passive: true });
    const rq = $n("#snbRq", host);
    rq.addEventListener("input", () => {
      RQ = rq.value;
      $n(".snb-tbl tbody", host).innerHTML = rowsHtml(CUR.rows.filter(rowFilter));
    });
    host.querySelectorAll("[data-rf]").forEach((b) => b.addEventListener("click", () => {
      RF = b.dataset.rf;
      render();
    }));
    /* Таблица — один слушатель: строки перерисовываются поиском, а он
       остаётся. Свернуть группу, условия поставщика, «нужно за», разбор. */
    $n(".snb-tbl", host).addEventListener("click", (e) => {
      const cp = e.target.closest("[data-copy]");
      if (cp) { e.stopPropagation(); copyText(cp.dataset.copy, cp); return; }
      const iv = e.target.closest("[data-inv-file]");
      if (iv) {
        e.stopPropagation();
        DL.open("/api/supply-invoices/" + encodeURIComponent(iv.dataset.invFile) + "/file", { btn: iv })
          .catch((err) => note(err.message, true));
        return;
      }
      if (e.target.closest("[data-best-toggle]") && !e.target.closest("[data-grip]")) {
        BEST_OPEN = !BEST_OPEN;
        saveBest();
        render();
        return;
      }
      const pos = e.target.closest("[data-position]");
      if (pos) {
        const r = CUR.rows.find((x) => x.id === pos.closest("tr").dataset.row);
        if (r) positionCard(r);
        return;
      }
      // Справочные колонки — каталоги и прайс: полоса со стрелкой раскрывает
      // и сворачивает их целиком.
      if (e.target.closest("th.snb-refh, th.snb-refh2, td.snb-refc")) {
        REF_OPEN = !REF_OPEN;
        saveRef();
        render();
        return;
      }
      const ig = e.target.closest("[data-inv-go]");
      if (ig) {
        e.stopPropagation();
        openReview(ig.dataset.invGo);
        return;
      }
      const fb = e.target.closest("[data-fold]");
      if (fb) {
        e.stopPropagation();
        if (FOLD.has(fb.dataset.fold)) FOLD.delete(fb.dataset.fold); else FOLD.add(fb.dataset.fold);
        saveFold();
        render();
        return;
      }
      const dc = e.target.closest("[data-inv-delcol]");
      if (dc) {
        e.stopPropagation();
        const col = CUR.cols.find((x) => x.id === dc.dataset.invDelcol) || {};
        const list = (col.invoices || []).map((x) => (CUR.invoices || []).find((i) => i.id === x.id) || x);
        (list.length > 1 ? pickInvoice(list) : Promise.resolve(list[0])).then((x) => { if (x) delInvoice(x, false); });
        return;
      }
      const tb = e.target.closest("[data-terms]");
      if (tb) {
        e.stopPropagation();
        const c = CUR.cols.find((x) => x.id === tb.dataset.terms);
        if (c) termsPop(tb, c);
        return;
      }
      const pb = e.target.closest("[data-price]");
      if (pb && can()) { editSupplierPrice(pb); return; }
      const tbn = e.target.closest("[data-term]");
      if (tbn && can()) { editSupplierTerm(tbn); return; }
      const oc = e.target.closest("td[data-offer].ed");
      if (oc && can()) {
        const r = CUR.rows.find((x) => x.id === oc.closest("tr").dataset.row);
        if (r) setPick(r, oc.dataset.offer);
        return;
      }
      const dt = e.target.closest("td[data-due].ed");
      if (dt && can()) { editDue(dt); return; }
      const ft = e.target.closest("td[data-fact].ed");
      if (ft) {
        const r = CUR.rows.find((x) => x.id === ft.closest("tr").dataset.row);
        if (r && r.deliv_n) deliveryCard(r);
        else if (can()) editFact(ft);
        return;
      }
      const wt = e.target.closest("td[data-why].why");
      if (wt) {
        const r = CUR.rows.find((x) => x.id === wt.closest("tr").dataset.row);
        if (r) whyPop(wt, r);
      }
    });
    // Ставка ВКЛ — параметр «Финансов»: здесь только ссылка туда.
    const rate = $n("#snbRate", host);
    if (rate) rate.addEventListener("click", () => { if (typeof FIN === "object") FIN.open("par"); });
    if ($n("#snbDue", host)) {
      $n("#snbDue", host).addEventListener("click", async () => {
        const ids = CUR.rows.filter((r) => r.need).map((r) => r.id);
        if (!ids.length) { note("В объекте нет позиций для проработки", true); return; }
        const v = await ASK.prompt(`За сколько дней нужны все ${ids.length} ${plural(ids.length, "позиция", "позиции", "позиций")
          } объекта? Пусто — срок не ограничен. Затем отдельные сроки можно изменить в карточках позиций.`, "");
        if (v === null || v === undefined) return;
        await setDue(ids, String(v).trim());
      });
    }
    if ($n("#snbFoldAll", host)) {
      $n("#snbFoldAll", host).addEventListener("click", () => {
        const cols = shownCols();
        const all = cols.every(folded);
        cols.forEach((c) => { if (all) FOLD.delete(c.id); else FOLD.add(c.id); });
        saveFold();
        render();
      });
    }
    const colAdd = $n("#snbColAdd", host);
    if (colAdd) colAdd.addEventListener("click", async () => {
      const name = await ASK.prompt("Название поставщика для ручного ввода цен", "");
      if (name === null || name === undefined) return;
      if (!String(name).trim()) { note("Впишите название поставщика", true); return; }
      try {
        CUR = await AUTH.api("POST", "/supply/" + encodeURIComponent(openId) + "/cols", { name });
        SIG = "";
        render();
      } catch (e) { note("Не удалось добавить поставщика: " + e.message, true); }
    });
    host.querySelectorAll("[data-pst]").forEach((b) => b.addEventListener("click", async () => {
      if (CUR.supply.status === b.dataset.pst) return;
      try {
        CUR.supply = await AUTH.api("PATCH", "/supply/" + encodeURIComponent(openId), { status: b.dataset.pst });
        render();
      } catch (e) { note("Не вышло: " + e.message, true); }
    }));
    const file = $n("#snbFile", host);
    if (file) {
      // Несколько счетов разом (правка № 24) — по очереди: каждый встаёт
      // своей колонкой, следующий читается после предыдущего.
      file.addEventListener("change", async () => {
        const list = [...(file.files || [])];
        file.value = "";
        // Чьи цены в счёте (правка № 47): поставщика или цена объекта.
        const own = await askOwn(list);
        if (own === null) return;
        for (let i = 0; i < list.length; i++) {
          if (list.length > 1) note(`Счёт ${i + 1} из ${list.length}: «${list[i].name}»…`);
          await upload(list[i], "", own);
        }
      });
    }
    if ($n("#snbPull", host)) $n("#snbPull", host).addEventListener("click", pull);
    if ($n("#snbReq", host)) $n("#snbReq", host).addEventListener("click", request);
    if ($n("#snbPto", host)) $n("#snbPto", host).addEventListener("click", ptoSend);
    if ($n("#snbXls", host)) {
      $n("#snbXls", host).addEventListener("click", (e) => DL.save(
        "/api/supply/" + encodeURIComponent(openId) + "/xlsx", { btn: e.currentTarget })
        .catch((err) => note(err.message, true)));
    }
    if ($n("#snbDel", host)) {
      $n("#snbDel", host).addEventListener("click", async () => {
        if (!(await ASK.confirm(`Убрать проработку «${CUR.supply.title}»?\nЦены и сроки поставщиков пропадут вместе с ней;`
          + " версия калькуляции и файлы счетов в «Файлах» объекта останутся."))) return;
        try {
          await AUTH.api("DELETE", "/supply/" + encodeURIComponent(openId));
          back();
        } catch (e) { note("Не вышло: " + e.message, true); }
      });
    }
    host.querySelectorAll("[data-colrm]").forEach((b) => b.addEventListener("click", async (e) => {
      e.stopPropagation();
      const c = CUR.cols.find((x) => x.id === b.dataset.colrm) || {};
      if (!(await ASK.confirm(`Убрать колонку «${c.name}» вместе с её ценами и сроками?`))) return;
      try {
        CUR = await AUTH.api("POST", "/supply/" + encodeURIComponent(openId) + "/cols/remove", { key: c.id });
        SIG = "";
        render();
      } catch (err) { note("Не вышло: " + err.message, true); }
    }));
    wireChips(host);
  }

  /* Счета над таблицей: КП проработки и счета закупки «Рабочей» —
     сверка, файл, убрать. */
  function wireChips(host) {
    host.querySelectorAll("[data-inv]").forEach((chip) => {
      const id = chip.dataset.inv;
      $n("[data-inv-rv]", chip).addEventListener("click", () => openReview(id));
      $n("[data-inv-open]", chip).addEventListener("click", (e) => DL.open(
        "/api/supply-invoices/" + encodeURIComponent(id) + "/file", { btn: e.currentTarget })
        .catch((err) => note(err.message, true)));
      const del = $n("[data-inv-del]", chip);
      if (!del) return;
      del.addEventListener("click", () => {
        const buy = (CUR.buys || []).find((i) => i.id === id);
        delInvoice(buy || CUR.invoices.find((i) => i.id === id) || { id }, !!buy);
      });
    });
  }

  /* Удалить счёт (правка № 54, 26.10.2026): «бывает, счёт загружен
     ошибочно — его необходимо удалить; вопрос „Вы действительно хотите
     удалить?“ — „Да“ или „Нет“». Цены счёта снимаются с позиций и из
     «Прайса материалов», поставки — с позиций рабочей; файл остаётся в
     «Файлах» объекта. */
  async function delInvoice(x, buy) {
    const what = `Счёт ${x.number ? "№ " + x.number : x.filename ? "«" + x.filename + "»" : "без номера"}${
      x.date ? " от " + dmy(x.date) : ""}${x.supplier ? " — " + x.supplier : ""}.`;
    if (!(await ASK.confirm(`${what} ${buy ? "Его поставки снимутся с позиций рабочей"
      : "Его цены снимутся с позиций и из «Прайса материалов»"}; файл останется в «Файлах» объекта.`,
    { title: "Вы действительно хотите удалить?", ok: "Да", cancel: "Нет", danger: true }))) return false;
    try {
      await AUTH.api("DELETE", "/supply-invoices/" + encodeURIComponent(x.id));
      await reload();
      note(buy ? "Счёт удалён, его поставки сняты с позиций" : "Счёт удалён, его цены сняты с позиций и из «Прайса материалов»");
      return true;
    } catch (e) {
      note("Не вышло: " + e.message, true);
      return false;
    }
  }

  // У поставщика несколько счетов — какой удалить.
  function pickInvoice(list) {
    return new Promise((resolve) => {
      const box = document.createElement("div");
      box.className = "pf-modal";
      box.innerHTML = `<div class="pf-crop cnt-card snb-delpick" role="dialog" aria-label="Какой счёт удалить">
        <h3>Какой счёт удалить?</h3>
        <div class="snb-delpick-l">${list.map((x, i) => `<button type="button" class="btn-ghost" data-i="${i}">№ ${
          esc(x.number || "б/н")}${x.date ? " от " + esc(dmy(x.date)) : ""}${x.filename ? `<i>${esc(x.filename)}</i>` : ""}</button>`).join("")}</div>
        <div class="pf-modal-foot"><span class="grow"></span><button type="button" class="btn ghost" data-no>Отмена</button></div></div>`;
      const done = (v) => { document.removeEventListener("keydown", key); box.remove(); resolve(v); };
      const key = (e) => { if (e.key === "Escape") done(null); };
      document.addEventListener("keydown", key);
      box.addEventListener("click", (e) => {
        if (e.target === box || e.target.closest("[data-no]")) { done(null); return; }
        const b = e.target.closest("[data-i]");
        if (b) done(list[+b.dataset.i]);
      });
      document.body.appendChild(box);
    });
  }

  /* ── передача: вид, срок, ответственный (20.10.2026) ─────────
     Одно окно на три случая: передача калькуляции из «Тендера», «Тендер
     выигран» и «Объект проработан — в работу». Карточки видов — как в окне
     «Доступ»: широкое окно без прокрутки, пояснение в одну строку. */
  let PEOPLE = null;
  function people() {
    if (!PEOPLE) {
      PEOPLE = AUTH.api("GET", "/supply-people").then((x) => x.rows || [])
        .catch((e) => { PEOPLE = null; throw e; });
    }
    return PEOPLE;
  }
  const peopleOpts = (rows, cur) => `<option value="">— не назначен —</option>` + rows.map((p) =>
    `<option value="${esc(p.id)}"${p.id === cur ? " selected" : ""}>${esc(p.name)}${p.me ? " (я)" : ""}${
      p.job ? " · " + esc(p.job) : ""}</option>`).join("");

  const MODES = {
    tender: { ico: "trophy", name: "Тендерная проработка", due: true,
      line: "Предложения поставщиков под тендер — выделяется максимальная цена. Сама по себе, с проработкой не связана" },
    contract: { ico: "scale", name: "Проработка", due: true,
      line: "Выбор поставщиков по позициям на выигранный договор — минимальная приведённая стоимость" },
    work: { ico: "truck", name: "Рабочая версия", due: false,
      line: "Прорабатывать некогда — сразу закупка и поставка. Проработка заведётся рядом, данные у них общие" },
  };

  // Что станет с видом, если его выбрать: новая или обновится прежняя.
  function modeState(k, have) {
    const t = have.tender, c = have.contract;
    if (k === "tender") return t ? `передана ${dmy(t.at)} — обновится` : "новая";
    if (k === "contract") return c ? `передана ${dmy(c.at)}${c.work ? ", в работе" : ""} — обновится` : "новая";
    if (c && c.work) return `в работе с ${dmy(c.work)} — обновится`;
    return c ? "проработка уйдёт в работу" : "заведётся вместе с проработкой";
  }

  /* opt: title, sub, modes, mode, have {tender, contract}, names {tender,
     contract} — версия цен (окно из «Тендера»), carry — сколько счетов у
     тендерной, won — предложить отметить объект выигранным, due, to, ok,
     submit(data) → закрыть. */
  function handover(opt) {
    const have = opt.have || {};
    let mode = opt.mode || opt.modes[0];
    let nameEdited = false, dueEdited = false, toEdited = false, loaded = false;
    // Срок и ответственный — у той проработки, что обновится, иначе — общие.
    const had = (k) => have[k === "tender" ? "tender" : "contract"] || {};
    const box = document.createElement("div");
    box.className = "pf-modal";
    const today = new Date().toISOString().slice(0, 10);
    box.innerHTML = `
      <div class="pf-crop snb-ho" role="dialog" aria-label="${esc(opt.title)}">
        <div class="snb-ho-h"><h3>${esc(opt.title)}</h3>${opt.sub ? `<span class="sit-hint">${esc(opt.sub)}</span>` : ""}</div>
        <div class="snb-ho-modes n${opt.modes.length}" role="radiogroup" aria-label="Вид">${opt.modes.map((k) => {
          const m = MODES[k];
          return `<button type="button" role="radio" class="snb-ho-m" data-mode="${k}">
            <span class="snb-ho-ico">${ICO[m.ico]}</span><b>${esc(m.name)}</b>
            <span class="snb-ho-l">${esc(m.line)}</span><i class="snb-ho-s">${esc(modeState(k, have))}</i></button>`;
        }).join("")}</div>
        <div class="snb-ho-f">
          <label class="fld snb-ho-due"><span>Срок проработки — до</span>
            <input type="date" id="hoDue" min="${today}" value="${esc(opt.due || "")}"></label>
          <span class="snb-ho-nodue">${ICO.clock}Без срока — рабочая живёт до конца стройки</span>
          <label class="fld snb-ho-to"><span>Кому поручить</span><select id="hoTo"><option value="">загружаю…</option></select></label>
          <label class="snb-ho-ck snb-ho-msg"><input type="checkbox" id="hoNotify" checked><span>Написать в мессенджер</span></label>
        </div>
        ${opt.pick ? `<div class="snb-ho-pick"><span>${esc(opt.pick.title)}</span><span class="seg" role="radiogroup">${
          opt.pick.items.map(([k, name, line]) => `<button type="button" class="seg-b" role="radio" data-pick="${esc(k)}"
            title="${esc(line)}">${esc(name)}</button>`).join("")}</span><i class="snb-ho-pl" id="hoPickLine"></i></div>` : ""}
        ${opt.names ? `<div class="snb-ho-v">
          <label class="fld"><span>Версия, которой зафиксировать цены</span><input id="hoName" maxlength="80"></label>
          <label class="fld"><span>Комментарий</span><input id="hoNote" maxlength="200"
            placeholder="например: цены по договору от 07.10"></label></div>` : ""}
        ${opt.carry ? `<label class="snb-ho-ck snb-ho-carry"><input type="checkbox" id="hoCarry" checked><span>Взять счета и КП
          тендерной проработки — ${opt.carry} ${plural(opt.carry, "счёт", "счёта", "счетов")}: запросы уже сделаны, цены на руках</span></label>` : ""}
        ${opt.won ? `<label class="snb-ho-ck"><input type="checkbox" id="hoWon" checked><span>Отметить объект выигранным в «Тендере» —
          он появится в «Объектах»</span></label>` : ""}
        <div class="pf-note bad" id="hoErr" hidden></div>
        <div class="pf-modal-foot"><span class="grow"></span>
          <button type="button" class="btn ghost" id="hoNo">Отмена</button>
          <button type="button" class="btn" id="hoOk">${esc(opt.ok || "Передать")}</button></div>
      </div>`;
    document.body.appendChild(box);
    const $b = (q) => $n(q, box);
    const close = () => { document.removeEventListener("keydown", key); box.remove(); };
    const key = (e) => { if (e.key === "Escape") close(); };
    document.addEventListener("keydown", key);
    box.addEventListener("mousedown", (e) => { if (e.target === box) close(); });
    $b("#hoNo").addEventListener("click", close);
    let me = "";
    const msg = () => {
      const to = $b("#hoTo").value;
      const ck = $b("#hoNotify");
      ck.disabled = !to || to === me;
      const who = to ? ($b("#hoTo").selectedOptions[0] || {}).textContent || "" : "";
      $n("span", ck.parentNode).textContent = !to ? "Написать в мессенджер — выберите, кому"
        : to === me ? "Себе сообщение не нужно" : `Написать в мессенджер — ${who.split(" · ")[0].replace(" (я)", "")}`;
    };
    const paintMode = () => {
      box.querySelectorAll("[data-mode]").forEach((b) => {
        b.classList.toggle("on", b.dataset.mode === mode);
        b.setAttribute("aria-checked", String(b.dataset.mode === mode));
      });
      box.classList.toggle("ho-nodue", !MODES[mode].due);
      const carry = $b(".snb-ho-carry");
      if (carry) carry.hidden = mode === "tender";
      const nm = $b("#hoName");
      if (nm && !nameEdited) nm.value = mode === "tender" ? opt.names.tender : opt.names.contract;
      if (!dueEdited) $b("#hoDue").value = had(mode).due || opt.due || "";
      if (!toEdited && loaded) { $b("#hoTo").value = had(mode).to || opt.to || ""; msg(); }
    };
    box.querySelectorAll("[data-mode]").forEach((b) => b.addEventListener("click", () => {
      mode = b.dataset.mode;
      paintMode();
    }));
    if ($b("#hoName")) $b("#hoName").addEventListener("input", () => { nameEdited = true; });
    $b("#hoDue").addEventListener("input", () => { dueEdited = true; });
    let pick = opt.pick ? opt.pick.value : "";
    const paintPick = () => {
      if (!opt.pick) return;
      box.querySelectorAll("[data-pick]").forEach((b) => {
        b.classList.toggle("on", b.dataset.pick === pick);
        b.setAttribute("aria-checked", String(b.dataset.pick === pick));
      });
      $b("#hoPickLine").textContent = (opt.pick.items.find((x) => x[0] === pick) || [])[2] || "";
    };
    box.querySelectorAll("[data-pick]").forEach((b) => b.addEventListener("click", () => { pick = b.dataset.pick; paintPick(); }));
    paintPick();
    paintMode();
    people().then((rows) => {
      me = (rows.find((p) => p.me) || {}).id || "";
      $b("#hoTo").innerHTML = peopleOpts(rows, had(mode).to || opt.to || "");
      loaded = true;
      msg();
    }).catch(() => {
      $b("#hoTo").innerHTML = `<option value="">— список не загрузился —</option>`;
      msg();
    });
    $b("#hoTo").addEventListener("change", () => { toEdited = true; msg(); });
    $b("#hoOk").addEventListener("click", async () => {
      const ok = $b("#hoOk");
      const err = $b("#hoErr");
      const data = { mode, to: $b("#hoTo").value, notify: !$b("#hoNotify").disabled && $b("#hoNotify").checked };
      if (MODES[mode].due) data.due = $b("#hoDue").value;
      if ($b("#hoName")) { data.name = $b("#hoName").value.trim(); data.note = $b("#hoNote").value.trim(); }
      if ($b("#hoCarry")) data.carry = mode !== "tender" && $b("#hoCarry").checked;
      if ($b("#hoWon")) data.won = $b("#hoWon").checked;
      if (opt.pick) data[opt.pick.key] = pick;
      ok.disabled = true;
      err.hidden = true;
      try {
        await opt.submit(data);
        close();
      } catch (e) {
        err.textContent = e.message;
        err.hidden = false;
        ok.disabled = false;
      }
    });
  }

  // Ушло ли сообщение ответственному — к подсказке после передачи.
  const sentTxt = (x, who) => (x && x.sent ? ` Сообщение ${who ? who + " " : ""}ушло в мессенджер.`
    : x && x.error ? ` Сообщение не ушло: ${x.error}.` : "");

  /* Срок и ответственный — щелчком по ним в шапке. */
  function duePop(btn) {
    const s = CUR.supply;
    const pop = popAt(btn, `
      <div class="snb-why-h"><b>Срок проработки</b><i>${esc(s.site)}</i></div>
      <label class="fld"><span>Выполнить до</span><input type="date" class="pos-in" data-f="due" value="${esc(s.due || "")}"></label>
      <label class="fld"><span>Ответственный</span><select class="pos-in" data-f="to"><option value="">загружаю…</option></select></label>
      <label class="snb-ho-ck"><input type="checkbox" data-f="notify"><span>Написать ему о сроке в мессенджер</span></label>
      <div class="pf-note bad" data-err hidden></div>
      <div class="snb-pop-foot"><button type="button" class="btn-ghost sm" data-no>Отмена</button>
        <button type="button" class="btn-brand sm" data-ok>Сохранить</button></div>`, "snb-terms snb-duep");
    const f = (k) => $n(`[data-f="${k}"]`, pop);
    people().then((rows) => { f("to").innerHTML = peopleOpts(rows, s.to ? s.to.id : ""); })
      .catch(() => { f("to").innerHTML = `<option value="${esc(s.to ? s.to.id : "")}">${esc(s.to ? s.to.name : "—")}</option>`; });
    $n("[data-no]", pop).addEventListener("click", closePop);
    $n("[data-ok]", pop).addEventListener("click", async () => {
      try {
        const out = await AUTH.api("PATCH", "/supply/" + encodeURIComponent(openId),
          { due: f("due").value, to: f("to").value, notify: f("notify").checked });
        closePop();
        CUR.supply = Object.assign(CUR.supply, out);
        SIG = "";
        render();
        note((out.due ? `Срок проработки — до ${dmy(out.due)}` : "Срок снят") + (out.to ? `, ответственный — ${out.to.name}.` : ".")
          + sentTxt(out.notified));
      } catch (e) {
        const er = $n("[data-err]", pop);
        er.textContent = e.message;
        er.hidden = false;
      }
    });
  }

  /* «Тендер выигран — передать на проработку» (20.10.2026): калькуляция
     уходит в проработку или сразу в рабочую, счета и КП тендерной — с ней. */
  function promoteDialog() {
    const s = CUR.supply;
    // Проработка этой калькуляции уже есть — она обновится, счета тендерной
    // в неё не переносятся (там свои).
    const sib = (CUR.siblings || []).find((x) => x.mode !== "tender");
    handover({
      title: "Тендер выигран — передать дальше", sub: `${s.site} · ${s.title}`,
      modes: ["contract", "work"], mode: sib && sib.work ? "work" : "contract", to: s.to ? s.to.id : "",
      have: sib ? { contract: { at: sib.at, work: sib.work } } : {},
      carry: sib ? 0 : (CUR.invoices || []).length, won: s.tender !== "won" && (has("obj") || has("tnd_obj")),
      ok: "Передать",
      submit: async (data) => {
        const out = await AUTH.api("POST", "/supply/" + encodeURIComponent(openId) + "/promote", data);
        await go(out.id, data.mode === "work" ? "work" : "proc");
        note(`Тендер выигран: калькуляция — ${data.mode === "work" ? "в рабочей (и в проработке)" : "в проработке"}`
          + `, цены зафиксированы версией «${out.version.name}».`
          + (out.carried ? ` Из тендерной перенесено цен: ${out.carried}.` : "") + sentTxt(out.notified));
      },
    });
  }

  /* «Объект проработан — передать в работу» (20.10.2026). */
  function toWorkDialog() {
    const s = CUR.supply;
    handover({
      title: "Объект проработан — передать в работу", sub: `${s.site} · ${s.title}`,
      modes: ["work"], mode: "work", have: { contract: { at: s.at } }, to: s.to ? s.to.id : "",
      ok: "Передать в работу",
      submit: async (data) => {
        const out = await AUTH.api("POST", "/supply/" + encodeURIComponent(openId) + "/work",
          { to: data.to, notify: data.notify });
        await go(openId, "work");
        note("Проработка в работе: загружайте счета на закупку и отмечайте поставки. Цены выбора — из проработки."
          + sentTxt(out.notified));
      },
    });
  }

  /* ── рабочая: закупка и поставки (заказчик, 20.10.2026) ─────
     «В рабочей — фактические цены, по которым закупаем материалы: по
     позициям, кто поставщик, какое количество и когда поставлял; разнесение
     счетов, средняя цена фактической закупки, количество закупленного,
     остаток по позиции». Цена выбора и поставщик — из проработки: данные
     общие, по ним видно, по каким ценам покупать. */
  const wState = (r) => (!r.bought ? "none" : r.left !== null && r.left < 0 ? "over"
    : r.left !== null && r.left <= 0 ? "full" : "part");

  function workFilter(r) {
    if (r.kind === "section") return !WQ.trim() && !WF;
    if (WF && (!r.need || wState(r) !== WF)) return false;
    const q = WQ.trim().toLowerCase();
    if (!q) return true;
    const hay = [r.pos_no, r.name, r.brand, r.code, r.maker, (r.best || {}).who, ...(r.deliv_who || [])]
      .join(" ").toLowerCase();
    return q.split(/\s+/).every((w) => hay.includes(w));
  }

  function workFacts() {
    const t = CUR.totals, w = t.work || {};
    const d = (w.cmp_spent || 0) - (w.cmp_pick || 0);
    return `<dl class="pg-facts">
      <div><dt>Позиций к закупке</dt><dd>${t.count}</dd></div>
      <div><dt>Закуплено полностью</dt><dd>${w.full || 0} из ${t.count}${w.over ? ` <i class="snb-late-n">перебор — ${w.over}</i>` : ""}</dd></div>
      <div><dt>Частично</dt><dd>${w.part || 0}</dd></div>
      <div><dt>Не закуплено</dt><dd class="${w.none ? "warn" : ""}">${w.none || 0}</dd></div>
      <div><dt>Поставок</dt><dd>${w.deliv || 0}</dd></div>
      <div><dt>К выбору проработки</dt><dd class="snb-d ${d > 0.004 ? "bad" : d < -0.004 ? "good" : ""}" title="${esc(
        `Поставки с ценой — ${money(w.cmp_spent || 0)}; то же количество по цене выбора проработки — ${money(w.cmp_pick || 0)}. `
        + "Плюс — купили дороже выбора, минус — дешевле")}">${w.cmp_pick ? (d > 0 ? "+" : "") + money(d) : "—"}</dd></div>
      <div><dt>Потрачено, с НДС</dt><dd title="Сумма поставок с ценой">${money(w.spent || 0)}</dd></div>
    </dl>`;
  }

  // Рабочую читают на ноутбуке целиком (20.10.2026): марка и код — под
  // названием, кто поставил и когда — одной колонкой, сумма — в карточке.
  const WSPAN = 12;
  function workRow(r) {
    if (r.kind === "section") {
      return `<tr class="sec"><td colspan="${WSPAN}" class="sec-name"><span class="sec-in">${esc(r.name)}</span></td></tr>`;
    }
    const b = r.best;
    const sub = [r.brand, r.code && "код " + r.code, r.maker].filter(Boolean).join(" · ");
    const spec = `<td class="s-no snb-mb" title="${esc(r.pos_no)}">${esc(r.pos_no)}</td>
      <td class="s-name snb-mb" title="${esc([r.name, sub].filter(Boolean).join(" — "))}">${r.need ? `<button type="button"
        class="snb-position" data-dcard title="Карточка поставок: что привезли, от кого, сколько и почём">${esc(r.name)}</button>`
        : `<span class="nm">${esc(r.name)}</span>`}${sub ? `<i class="snb-sub">${esc(sub)}</i>` : ""}${copyBtn(r.name)}</td>
      <td class="snb-mb">${esc(r.unit)}</td>
      <td class="num snb-mb snb-qty">${qtyTxt(r.qty_buy)}</td>
      <td class="num snb-fix snb-mb snb-mbe">${r.skip ? '<span class="snb-nc">не в дог.</span>' : r.contract ? money(r.contract) : ""}</td>`;
    if (!r.need) {
      return `<tr class="snb-off" data-row="${esc(r.id)}">${spec}<td colspan="${WSPAN - 5}" class="snb-wnot">${
        esc(why(r) || "не покупаем")}</td></tr>`;
    }
    const st = wState(r);
    const over = r.avg !== null && r.avg !== undefined && b && r.avg > b.price;
    const left = r.left === null || r.left === undefined ? ""
      : r.left > 0 ? qtyTxt(r.left) : r.left < 0 ? `+${qtyTxt(-r.left)}` : "✓";
    return `<tr class="snb-w-${st}" data-row="${esc(r.id)}">${spec}
      <td class="num snb-wpick${b ? " has" : ""}" title="${esc(b ? `Выбран в проработке${b.manual ? " вручную" : ""}: ${b.who}, ${
        money(b.price)} за ед. с НДС` : "В проработке поставщик не выбран")}">${b ? (b.manual ? ICO.pin : "") + money(b.price) : "—"}</td>
      <td class="snb-wwho" title="${esc(b ? b.who : "")}">${b ? esc(b.who) : ""}</td>
      <td class="num snb-wb ${st}" data-dcard title="${esc(r.bought ? `Куплено ${qtyTxt(r.bought)} из ${qtyTxt(r.qty_buy)} ${r.unit || ""}`
        : "Ещё не закупали")}. Щелчок — карточка поставок">${r.bought ? qtyTxt(r.bought) : "—"}</td>
      <td class="num snb-wl ${st}" title="${esc(st === "over" ? `Перебор: куплено больше нужного на ${qtyTxt(-r.left)}`
        : st === "full" ? "Закуплено полностью" : `Осталось купить ${qtyTxt(r.left)} ${r.unit || ""}`)}">${left}</td>
      <td class="num snb-wavg${over ? " over" : ""}${r.avg !== null && r.avg !== undefined ? " has" : ""}" title="${esc(
        r.avg !== null && r.avg !== undefined ? `Средняя цена закупки с НДС — по количеству в поставках${b ? `; выбор — ${money(b.price)}${
          over ? `, дороже на ${money(r.avg - b.price)}` : ""}` : ""}` : "")}">${r.avg !== null && r.avg !== undefined ? money(r.avg) : ""}</td>
      <td class="snb-wsup" title="${esc(r.deliv_n ? `${(r.deliv_who || []).join(", ")}: поставок ${r.deliv_n}, последняя — ${
        dmy(r.deliv_last)}${r.spent !== null && r.spent !== undefined ? `; потрачено ${money(r.spent)}` : ""}` : "")}">${r.deliv_n
        ? `<span>${esc((r.deliv_who || []).join(", "))}</span><i class="snb-sub">${esc(dmy(r.deliv_last))}${r.deliv_n > 1
          ? ` · ${r.deliv_n} ${plural(r.deliv_n, "поставка", "поставки", "поставок")}` : ""}</i>` : ""}</td>
      <td class="snb-wadd">${can() ? `<button type="button" class="snb-gbtn" data-dadd title="Добавить поставку">${ICO.plus}</button>` : ""}</td>
    </tr>`;
  }

  function buyChip(x) {
    return `<span class="snb-inv${x.status === "applied" ? "" : " new"}" data-inv="${esc(x.id)}">
      <button type="button" class="snb-inv-t" data-inv-rv title="Сверка счёта: позиции, сколько поставлено и почём">${ICO.file}<b>${
        esc(x.supplier || x.filename)}</b><i>№ ${esc(x.number || "б/н")}${x.date ? " от " + esc(dmy(x.date)) : ""}${
        x.status === "applied" ? ` · ${x.delivered || 0} ${plural(x.delivered || 0, "поставка", "поставки", "поставок")}` : " · не записан"}</i></button>
      <button type="button" class="snb-inv-x" data-inv-open title="Открыть файл">${ICO.down}</button>
      ${can() ? `<button type="button" class="snb-inv-x warn" data-inv-del title="Убрать счёт и его поставки">${ICO.no}</button>` : ""}
    </span>`;
  }

  function workRowsHtml() {
    const rows = CUR.rows.filter(workFilter);
    return rows.length ? rows.map(workRow).join("")
      : `<tr><td colspan="${WSPAN}" class="snb-none">Ничего не нашлось — снимите отбор или поищите иначе</td></tr>`;
  }

  function workHtml() {
    const s = CUR.supply;
    const need = CUR.rows.filter((r) => r.need);
    const n = (st) => need.filter((r) => wState(r) === st).length;
    const seg = [["", "Все", need.length], ["none", "Не закуплено", n("none")], ["part", "Частично", n("part")],
      ["full", "Закуплено", n("full")]].concat(n("over") || WF === "over" ? [["over", "Перебор", n("over")]] : []);
    return `
      <div class="pg snb-proc snb-work${HEAD_MINI ? " snb-mini" : ""}">
        <div class="pg-head strip calc-head two">
          ${headTitle(s)}
          ${viewSeg(s)}
          ${workFacts()}
          ${can() ? `<div class="pg-act pg-acts">
            <label class="btn-brand sm snb-upl" title="Счёт на закупку — PDF или Excel. Строки разнесутся по позициям поставками: дата, поставщик, сколько и почём"
              >${ICO.up}Загрузить счёт<input type="file" id="snbBuyFile" accept=".pdf,.xlsx,.xlsm,.xls" hidden></label>
          </div>` : ""}
        </div>
        <div class="snb-bar">
          ${miniBtn()}
          <label class="pg-find">${ICO.find}<input id="snbWq" type="search" placeholder="Позиция, марка, поставщик"
            value="${esc(WQ)}" autocomplete="off"></label>
          <span class="seg" role="group" aria-label="Какие позиции показать">${seg.map(([k, name, cnt]) =>
            `<button type="button" class="seg-b${WF === k ? " on" : ""}${k === "over" ? " snb-rf-late" : ""}" data-wf="${k}">${name}${
              k ? `<i>${cnt}</i>` : ""}</button>`).join("")}</span>
          <div class="snb-invs">${(CUR.buys || []).map(buyChip).join("")}</div>
        </div>
        <div class="pg-body snb-body" data-view="work">
          <table class="tbl pos-tbl calc-tbl snb-tbl snb-wtbl" style="--tbl-min:1120px">
            <colgroup><col class="s-no"><col class="w-name"><col class="s-unit">
              <col class="s-qty"><col class="s-con"><col class="w-pick"><col class="w-who"><col class="w-n"><col class="w-n">
              <col class="w-avg"><col class="w-sup"><col class="w-add"></colgroup>
            <thead>
              <tr>
                <th colspan="2" class="grp spec s-froze snb-mb">Спецификация</th>
                <th colspan="2" class="grp spec snb-mb"></th>
                <th class="grp snb-gfix snb-mb snb-mbe" title="${esc(FIX_TIP)}">${ICO.lock} Договор</th>
                <th colspan="2" class="grp snb-gbest">Выбор проработки${tip("Поставщик, выбранный в проработке, и его цена с НДС — "
                  + "ориентир, по каким ценам покупать. Данные общие: выбор меняют во вкладке «Проработка».")}</th>
                <th colspan="5" class="grp snb-gbuy">Закупка${tip("Фактические поставки: сколько куплено, остаток, средняя цена "
                  + "закупки с НДС по количеству, сумма, кто и когда поставил. Щелчок по позиции — карточка поставок; поставки "
                  + "встают из счетов на закупку или вписываются руками.")}</th>
              </tr>
              <tr>
                <th class="s-no snb-mb">№</th><th class="s-name snb-mb">Наименование · марка, код</th>
                <th class="snb-mb">Ед.</th><th class="num snb-mb">Нужно</th>
                <th class="num snb-mb snb-mbe" title="Цена материала за единицу в калькуляции">За ед.</th>
                <th class="num">Цена</th><th>Поставщик</th>
                <th class="num">Куплено</th><th class="num">Остаток</th><th class="num" title="Средняя цена закупки с НДС — по количеству">Средняя цена</th>
                <th>Кто поставил · когда</th><th></th>
              </tr>
            </thead>
            <tbody>${workRowsHtml()}</tbody>
          </table>
        </div>
        <div class="pg-note" id="snbNote" hidden></div>
      </div>`;
  }

  function wireWork(host) {
    wireHead(host);
    if (typeof GRID === "object" && GRID.pan) GRID.pan($n(".snb-body", host));
    if (typeof GRID === "object" && GRID.freeze) GRID.freeze($n(".snb-wtbl", host), 2);
    wireMini(host);
    const q = $n("#snbWq", host);
    q.addEventListener("input", () => {
      WQ = q.value;
      $n(".snb-wtbl tbody", host).innerHTML = workRowsHtml();
    });
    host.querySelectorAll("[data-wf]").forEach((b) => b.addEventListener("click", () => {
      WF = b.dataset.wf;
      render();
    }));
    $n(".snb-wtbl", host).addEventListener("click", (e) => {
      const cp = e.target.closest("[data-copy]");
      if (cp) { e.stopPropagation(); copyText(cp.dataset.copy, cp); return; }
      const t = e.target.closest("[data-dcard], [data-dadd]");
      if (!t) return;
      const r = CUR.rows.find((x) => x.id === t.closest("tr").dataset.row);
      if (r && r.need) deliveryCard(r);
    });
    const file = $n("#snbBuyFile", host);
    if (file) {
      file.addEventListener("change", () => {
        const f = file.files && file.files[0];
        file.value = "";
        if (f) upload(f, "buy");
      });
    }
    wireChips(host);
  }

  /* Карточка поставок позиции (заказчик, 20.10.2026: «удобно, если будет
     формироваться карточка фактической поставки с указанием даты поставки,
     поставщика и количества»): что привезли и откуда — из счёта или
     руками, добавить, поправить, убрать. Цена — с НДС, как на экране. */
  function deliveryCard(r0) {
    let r = r0;
    let list = (CUR.deliveries || []).filter((d) => d.row === r.id);
    let edit = null;
    const box = document.createElement("div");
    box.className = "pf-modal";
    const num = (v) => (v === null || v === undefined || v === "" ? "" : String(v).replace(".", ","));
    const today = new Date().toISOString().slice(0, 10);
    const sups = () => [...new Set([(r.best || {}).who, ...(r.deliv_who || []),
      ...(CUR.buys || []).map((x) => x.supplier), ...CUR.cols.filter((c) => !c.ref && c.kind !== "obj").map((c) => c.name)]
      .filter(Boolean))];
    const paint = () => {
      const b = r.best;
      const left = r.left || 0;
      box.innerHTML = `
        <div class="pf-crop snb-dc" role="dialog" aria-label="Поставки: ${esc(r.name)}">
          <div class="snb-dc-h"><div><h3>${esc(r.name)}</h3><p>${esc([r.pos_no && "№ " + r.pos_no, r.brand,
            r.code && "код " + r.code].filter(Boolean).join(" · "))}</p></div></div>
          <div class="snb-dc-k">
            <div><span>Нужно</span><b>${qtyTxt(r.qty_buy)} ${esc(r.unit || "")}</b></div>
            <div><span>Куплено</span><b>${qtyTxt(r.bought || 0)}</b></div>
            <div class="${left < 0 ? "bad" : left > 0 ? "warn" : "ok"}"><span>${left < 0 ? "Перебор" : "Остаток"}</span><b>${
              left ? qtyTxt(Math.abs(left)) : "✓ всё"}</b></div>
            <div><span>Средняя цена, с НДС</span><b>${r.avg !== null && r.avg !== undefined ? money(r.avg) : "—"}</b></div>
            <div><span>Потрачено</span><b>${r.spent !== null && r.spent !== undefined ? money(r.spent) : "—"}</b></div>
            <div class="pick"><span>Выбор проработки</span><b title="${esc(b ? b.who : "")}">${b ? `${money(b.price)} · ${esc(b.who)}` : "не выбран"}</b></div>
          </div>
          <div class="snb-dc-body">${list.length ? `<table class="tbl snb-dc-t">
            <colgroup><col style="width:92px"><col><col style="width:96px"><col style="width:112px"><col style="width:118px">
              <col style="width:30%"><col style="width:64px"></colgroup>
            <thead><tr><th>Дата</th><th>Поставщик</th><th class="num">Кол-во</th><th class="num">Цена с НДС</th>
              <th class="num">Сумма</th><th>Откуда</th><th></th></tr></thead>
            <tbody>${list.map((d) => `<tr data-d="${esc(d.id)}" class="${edit && edit.id === d.id ? "on" : ""}">
              <td>${esc(dmy(d.date))}</td>
              <td class="snb-dc-s" title="${esc(d.supplier)}">${esc(d.supplier)}${d.analog ? '<span class="snb-an" title="Аналог">А</span>' : ""}</td>
              <td class="num">${qtyTxt(d.qty)}</td>
              <td class="num">${d.price !== null && d.price !== undefined ? money(d.price) : "—"}</td>
              <td class="num">${d.sum !== null && d.sum !== undefined ? money(d.sum) : ""}</td>
              <td class="snb-dc-src" title="${esc(d.note || "")}">${d.invoice ? `${ICO.file}счёт № ${esc(d.inv_no || "б/н")}${
                d.inv_date ? " от " + esc(dmy(d.inv_date)) : ""}` : "вписано руками"}${d.note ? ` · ${esc(d.note)}` : ""}</td>
              <td class="snb-dc-a">${can() ? `<button type="button" class="snb-gbtn" data-dedit title="Поправить">${ICO.edit}</button>
                <button type="button" class="snb-gbtn warn" data-ddel title="Убрать поставку">${ICO.no}</button>` : ""}</td>
            </tr>`).join("")}</tbody></table>`
            : `<div class="snb-dc-empty">Поставок пока нет. Загрузите счёт на закупку в «Рабочей» — строки встанут
              поставками сами, — или впишите поставку ниже.</div>`}</div>
          ${can() ? `<div class="snb-dc-f">
            <h4>${edit ? `Поправить поставку от ${esc(dmy(edit.date))}` : "Добавить поставку"}${edit && edit.invoice
              ? `<i>из счёта: если счёт записать заново, поправка перепишется</i>` : ""}</h4>
            <div class="snb-dc-fr">
              <label class="fld"><span>Дата поставки</span><input type="date" id="dcDate" value="${esc(edit ? edit.date : today)}"></label>
              <label class="fld w"><span>Поставщик</span><input id="dcSup" list="dcSups" maxlength="200" autocomplete="off"
                value="${esc(edit ? edit.supplier : (b ? b.who : ""))}"><datalist id="dcSups">${sups().map((x) =>
                  `<option value="${esc(x)}">`).join("")}</datalist></label>
              <label class="fld"><span>Количество, ${esc(r.unit || "ед.")}</span><input id="dcQty" inputmode="decimal"
                value="${esc(edit ? num(edit.qty) : left > 0 ? num(left) : "")}"></label>
              <label class="fld"><span>Цена за ед., с НДС</span><input id="dcPrice" inputmode="decimal"
                value="${esc(edit ? num(edit.price) : b ? num(b.price) : "")}" placeholder="можно пусто"></label>
              <label class="snb-ho-ck"><input type="checkbox" id="dcAn"${edit && edit.analog ? " checked" : ""}><span>Аналог</span></label>
            </div>
            <label class="fld"><span>Примечание</span><input id="dcNote" maxlength="500" value="${esc(edit ? edit.note : "")}"
              placeholder="накладная, УПД, кто принял…"></label>
          </div>` : ""}
          <div class="pf-note bad" id="dcErr" hidden></div>
          <div class="pf-modal-foot"><span class="grow"></span>
            ${edit ? `<button type="button" class="btn ghost" data-dcancel>Отменить правку</button>` : ""}
            <button type="button" class="btn ghost" data-close>Закрыть</button>
            ${can() ? `<button type="button" class="btn" id="dcOk">${edit ? "Сохранить" : "Добавить поставку"}</button>` : ""}
          </div>
        </div>`;
      wire();
    };
    const err = (t) => { const e = $n("#dcErr", box); e.textContent = t; e.hidden = !t; };
    const got = (out) => {
      if (out.row) {
        CUR.rows = CUR.rows.map((x) => (x.id === out.row.id ? out.row : x));
        r = out.row;
      }
      CUR.totals = out.totals;
      CUR.deliveries = (CUR.deliveries || []).filter((d) => d.row !== r.id).concat(out.deliveries || []);
      list = out.deliveries || [];
      edit = null;
      SIG = "";
      render();
      paint();
    };
    const wire = () => {
      box.querySelectorAll("[data-close]").forEach((b) => b.addEventListener("click", close));
      const cancel = $n("[data-dcancel]", box);
      if (cancel) cancel.addEventListener("click", () => { edit = null; paint(); });
      box.querySelectorAll("tr[data-d]").forEach((tr) => {
        const d = list.find((x) => x.id === tr.dataset.d);
        const ed = $n("[data-dedit]", tr);
        if (ed) ed.addEventListener("click", () => { edit = d; paint(); $n("#dcQty", box).focus(); });
        const del = $n("[data-ddel]", tr);
        if (del) {
          del.addEventListener("click", async () => {
            if (!(await ASK.confirm(`Убрать поставку от ${dmy(d.date)} — ${qtyTxt(d.qty)} ${r.unit || ""}, ${d.supplier}?`
              + (d.invoice ? "\nОна из счёта: если счёт записать заново, вернётся." : "")))) return;
            try {
              got(await AUTH.api("DELETE", "/supply-deliveries/" + encodeURIComponent(d.id)));
            } catch (e) { err(e.message); }
          });
        }
      });
      const ok = $n("#dcOk", box);
      if (!ok) return;
      ok.addEventListener("click", async () => {
        const body = { date: $n("#dcDate", box).value, supplier: $n("#dcSup", box).value.trim(),
          qty: $n("#dcQty", box).value.trim(), price: $n("#dcPrice", box).value.trim(),
          analog: $n("#dcAn", box).checked, note: $n("#dcNote", box).value.trim() };
        ok.disabled = true;
        try {
          got(edit ? await AUTH.api("PATCH", "/supply-deliveries/" + encodeURIComponent(edit.id), body)
            : await AUTH.api("POST", "/supply/" + encodeURIComponent(openId) + "/deliveries", Object.assign({ row: r.id }, body)));
        } catch (e) {
          err(e.message);
          ok.disabled = false;
        }
      });
    };
    const close = () => { document.removeEventListener("keydown", key); box.remove(); };
    const key = (e) => { if (e.key === "Escape") close(); };
    document.addEventListener("keydown", key);
    box.addEventListener("mousedown", (e) => { if (e.target === box) close(); });
    document.body.appendChild(box);
    paint();
  }

  async function openReview(id) {
    try {
      review(await AUTH.api("GET", "/supply-invoices/" + encodeURIComponent(id)));
    } catch (e) { note("Не вышло: " + e.message, true); }
  }

  async function reload() {
    CUR = await AUTH.api("GET", "/supply/" + encodeURIComponent(openId));
    SIG = "";
    render();
  }

  /* Подбор каталогов идёт на сервере задачей (его запускает и передача из
     «Тендера»): раз в пару секунд спрашиваем, как дела, и по готовности
     перечитываем проработку. */
  async function watchPull(job, step) {
    if (!job || WATCH === job) return;
    WATCH = job;
    const id = openId;
    note("Подтягиваю цены каталогов — " + (step || "работаю") + "…");
    try {
      for (const t0 = Date.now(); Date.now() - t0 < 20 * 60 * 1000;) {
        await new Promise((ok) => setTimeout(ok, 2000));
        if (openId !== id) return;
        const st = await AUTH.api("GET", "/offers/pull/" + job);
        if (!st.running) {
          if (openId !== id) return;
          await reload();
          const r = st.result || {};
          note(st.error ? "Каталоги не ответили: " + st.error
            : `Цены каталогов обновлены: с ценой ${CUR.totals.priced} из ${CUR.totals.count}.`
              + (r.warning ? " Не ответили: " + r.warning : ""), !!(st.error || r.warning));
          return;
        }
        note("Подтягиваю цены каталогов — " + (st.step || "работаю") + "…");
      }
    } catch (e) {
      note("Не вышло дождаться каталогов: " + e.message, true);
    } finally {
      if (WATCH === job) WATCH = "";
    }
  }

  async function pull() {
    const btn = $n("#snbPull");
    if (!btn || btn.disabled) return;
    btn.disabled = true;
    btn.title = "Ищем цены каталогов…";
    try {
      const st = await AUTH.api("POST", "/offers/pull/start", { doc: openId, what: "mat" });
      CUR.pull = { job: st.job, step: st.step };
      watchPull(st.job, st.step);
    } catch (e) {
      btn.disabled = false;
      btn.title = "Обновить справочные цены каталогов";
      note("Не вышло: " + e.message, true);
    }
  }

  /* ── счёт: загрузка и сверка ────────────────────────────── */
  // Итог разбора для карточки Трейса: сколько строк в счёте и сколько узнано.
  function invSummary(x) {
    const lines = (x && x.lines) || [];
    const known = lines.filter((l) => (l.rows || []).length).length;
    const inv = (x && x.invoice) || {};
    const check = (inv.warnings || []).length || (inv.status && inv.status !== "parsed");
    return `${check ? "Нужна проверка" : "Готово"}${inv.supplier ? " · " + inv.supplier : ""}: ${lines.length} ${
      plural(lines.length, "строка", "строки", "строк")}, узнал ${known}`;
  }

  /* «Цена объекта» у счёта (правка № 47, 24.10.2026): «этот критерий
     выбираем, когда заказчик выбирает поставщика материала сам». Цены
     такого счёта сразу встают в «Выбрано» и «Поставщик», строки — с замком
     «цена объекта», счета на них больше не запрашивают. */
  function askOwn(files) {
    return new Promise((resolve) => {
      let own = false;
      const box = document.createElement("div");
      box.className = "pf-modal";
      const many = files.length > 1;
      const paint = () => {
        box.innerHTML = `<div class="pf-crop cnt-card snb-own-ask" role="dialog" aria-label="Чьи цены в счёте">
          <h3>Чьи цены в ${many ? `счетах (${files.length})` : "счёте"}?</h3>
          <div class="sit-hint">${esc(files.map((f) => f.name).join(", "))}</div>
          <div class="snb-own-opts">
            <button type="button" class="snb-own-opt${own ? "" : " on"}" data-own="0" aria-pressed="${!own}">
              <b>Предложение поставщика</b><span>Цены встанут колонкой поставщика в конкурентную проработку — выбор по приведённой стоимости.</span></button>
            <button type="button" class="snb-own-opt own${own ? " on" : ""}" data-own="1" aria-pressed="${own}">
              <b>${ICO.lock}Цена объекта</b><span>Поставщика выбрал заказчик: цены сразу в «Выбрано» и «Поставщик», строки закрыты замком, счета на них не запрашиваем.</span></button>
          </div>
          <div class="pf-modal-foot"><span class="grow"></span>
            <button type="button" class="btn ghost" data-no>Отмена</button>
            <button type="button" class="btn" data-ok>Загрузить</button></div>
        </div>`;
        box.querySelectorAll("[data-own]").forEach((b) => b.addEventListener("click", () => {
          own = b.dataset.own === "1";
          paint();
        }));
        box.querySelector("[data-no]").addEventListener("click", () => done(null));
        box.querySelector("[data-ok]").addEventListener("click", () => done(own));
        box.querySelector("[data-ok]").focus();
      };
      const key = (e) => { if (e.key === "Escape") done(null); };
      const done = (v) => {
        document.removeEventListener("keydown", key);
        box.remove();
        resolve(v);
      };
      document.addEventListener("keydown", key);
      box.addEventListener("mousedown", (e) => { if (e.target === box) done(null); });
      document.body.appendChild(box);
      paint();
    });
  }

  async function upload(f, kind, own) {
    note(`Читаю «${f.name}»…`);
    if (typeof FRESH === "object") FRESH.hold();
    // Пока сервер читает счёт, Трейс показывает разбор (20.10.2026).
    const tr = TRACE.start({ kind: "invoice", file: f.name, title: kind === "buy" ? "разбирает счёт закупки" : "" });
    try {
      const headers = { Authorization: "Bearer " + AUTH.token(), "X-File-Name": encodeURIComponent(f.name),
                        "Content-Type": f.type || "application/octet-stream" };
      // Счёт закупки «Рабочей» (20.10.2026): его строки станут поставками.
      if (kind === "buy") headers["X-Supply-Kind"] = "buy";
      if (own) headers["X-Supply-Own"] = "1";
      const r = await fetch("/api/supply/" + encodeURIComponent(openId) + "/invoices", {
        method: "POST", headers, body: f,
      });
      let x = null;
      try { x = await r.json(); } catch (e) { /* ответил не сервер приложения */ }
      if (!r.ok) {
        throw new Error((x && x.error) || (r.status === 413 ? "Файл больше, чем принимает сервер"
          : "Не удалось загрузить, ответ сервера " + r.status));
      }
      tr.done(invSummary(x));
      await reload();
      // Закупку сверяют глазами: сколько и на какие позиции встанет.
      if (kind === "buy") {
        note("");
        review(x);
      } else {
        await autoApply(x);
      }
    } catch (e) {
      tr.fail("Не получилось: " + e.message);
      note(e.message, true);
    } finally {
      if (typeof FRESH === "object") FRESH.release();
    }
  }

  /* Счёт встаёт колонкой сразу, как счёт в прайсе материалов (Андрей,
     07.10.2026): узнанные строки записываются, «под вопросом» — с «?» в
     клетке. Не узнанное и правки — в сверке по щелчку на счёт над таблицей. */
  async function autoApply(x) {
    const inv = x.invoice;
    if ((inv.warnings || []).length || inv.status !== "parsed") {
      note("Счёт требует проверки: сверьте строки с файлом и при необходимости добавьте цены вручную.", true);
      review(x);
      return;
    }
    const lines = x.lines.filter((l) => (l.rows || []).length && l.unit_price > 0).map((l) => ({
      no: l.no, manual: !!l.manual, rows: l.rows, price: l.unit_price,
      term: l.term || "", maybe: l.state === "maybe",
      defer: l.defer === null || l.defer === undefined ? "" : l.defer,
    }));
    if (!lines.length) {
      note("");
      review(x);
      return;
    }
    let supplier = (inv.supplier || "").trim();
    if (!supplier) {
      supplier = ((await ASK.prompt(`В счёте «${inv.filename}» поставщик не нашёлся. Как назвать колонку?`, "")) || "").trim();
      if (!supplier) {
        note("Счёт загружен, но цены не записаны: щёлкните по нему над таблицей и впишите поставщика", true);
        return;
      }
    }
    const r = await AUTH.api("POST", "/supply-invoices/" + encodeURIComponent(inv.id) + "/apply",
      { supplier, term: "", lines });
    await reload();
    const maybe = lines.filter((l) => l.maybe).length;
    const miss = x.lines.length - lines.length;
    // Строка доставки (правка № 49): разложить её в цены — в сверке.
    const deliv = x.lines.some((l) => !(l.rows || []).length && DELIV_RE.test(l.name || ""));
    note(`Счёт${inv.number ? " № " + inv.number : ""} встал колонкой «${supplier}»: ${r.prices} ${
      plural(r.prices, "цена", "цены", "цен")}`
      + (maybe ? `, из них ${maybe} под вопросом — с «?»` : "")
      + (miss ? `; не нашлась позиция для ${miss} ${plural(miss, "строки", "строк", "строк")} счёта` : "")
      + (maybe || miss ? ". Проверить и поправить — щелчок по счёту над таблицей." : ".")
      + (deliv ? " В счёте есть доставка: чтобы учесть её в стоимости материала, откройте счёт и отметьте строку доставки." : ""),
      false);
  }
  // Строка счёта — доставка (правка № 49): у неё в сверке «учесть в
  // стоимости материала».
  const DELIV_RE = /доставк|транспортн|перевозк|погрузк|разгрузк|экспедир/i;

  const rowKey = (r) => [r.name, r.brand, r.code, r.unit].map((x) => String(x || "").trim().toLowerCase()).join("|");

  /* ── запрос поставщикам по группам (заказчик, 12.10.2026) ───────────
     «Снабженец выбирает группу товаров — у него сразу Excel-запрос и список
     поставщиков, которым мы это адресуем: запросить у того, кто не возит, —
     ошибочная операция». Позиция находит группу сама — по названию и разделу
     калькуляции; не нашла — «Без группы», группу ставят здесь же, и она
     запоминается. Список поставщиков в книгу запроса не кладём: книга уходит
     самим поставщикам, друг о друге им знать незачем. */
  async function request() {
    let S;
    try {
      S = await SUPS.data();
    } catch (e) {
      note(e.message, true);
      return;
    }
    const gmap = Object.fromEntries(S.groups.map((g) => [g.id, g]));
    // Позиции с ценой объекта — поставщика выбрал заказчик, не запрашиваем (правка № 16).
    // «Не в договоре» — тоже (правка № 48).
    const items = () => CUR.rows.filter((r) => r.kind !== "section" && r.need && !r.own && !r.skip);
    const inGroup = (gid) => items().filter((r) => (gmap[r.grp] ? r.grp : "") === gid);
    const suppliersOf = (gid) => S.rows.filter((r) => r.groups.some((x) => x.id === gid));
    // Почты всех контактов поставщика (14.10.2026) — без повторов.
    const mails = (r) => [...new Set([r.email, ...(r.contacts || []).map((x) => x.email)].join(",")
      .split(/[,;\s]+/).filter((x) => x.includes("@")))];
    const used = S.groups.filter((g) => inGroup(g.id).length);
    let sel = (used[0] || {}).id || (inGroup("").length ? "none" : "all");
    const offRow = new Set(), offSup = new Set();
    const box = document.createElement("div");
    box.className = "pf-modal";
    const options = (cur) => `<option value="">— без группы —</option>` + S.blocks.map((b) => {
      const gs = S.groups.filter((g) => g.block === b.id);
      return gs.length ? `<optgroup label="${esc(b.name)}">${gs.map((g) => `<option value="${esc(g.id)}"${
        g.id === cur ? " selected" : ""}>${esc(g.name)}</option>`).join("")}</optgroup>` : "";
    }).join("");
    const sideItem = (id, name, n, extra, cls) => `<button type="button" class="rq-si${sel === id ? " on" : ""}${
      cls ? " " + cls : ""}" data-sel="${esc(id)}" title="${esc(name)}"><span>${esc(name)}</span><i>${n}${extra || ""}</i></button>`;
    const posHtml = (rows, pick) => rows.length ? `<table class="tbl rq-tbl">
        <colgroup><col style="width:30px"><col style="width:52px"><col><col style="width:96px"><col style="width:34%"></colgroup>
        <thead><tr><th><input type="checkbox" data-all${rows.every((r) => !offRow.has(r.id)) ? " checked" : ""}></th>
          <th>№</th><th>Позиция</th><th class="num">Кол-во</th><th>Группа${pick ? "" : ` <i class="rq-th-i">— не та? поменяйте, запомнится</i>`}</th></tr></thead>
        <tbody>${rows.map((r) => `<tr class="${offRow.has(r.id) ? "off" : ""}" data-r="${esc(r.id)}">
          <td><input type="checkbox" data-on${offRow.has(r.id) ? "" : " checked"}></td>
          <td class="t-id">${esc(r.pos_no)}</td>
          <td><span class="rq-nm" title="${esc(r.name)}">${esc(r.name)}</span>${r.brand ? `<i class="snb-sub">${esc(r.brand)}</i>` : ""}</td>
          <td class="num">${qtyTxt(r.qty_buy)} ${esc(r.unit || "")}</td>
          <td><select class="rq-g${r.grp_by === "auto" ? " auto" : ""}" data-g title="${r.grp_by === "auto"
            ? "Подобрана по названию и разделу" : r.grp_by ? "Поставлена руками" : "Группа не узналась"}">${options(gmap[r.grp] ? r.grp : "")}</select></td>
        </tr>`).join("")}</tbody></table>` : `<div class="pg-empty"><b>Позиций нет</b></div>`;
    const supHtml = (sups) => sups.length ? `<ul class="rq-sups">${sups.map((r) => {
        const m = mails(r);
        return `<li class="${offSup.has(r.id) ? "off" : ""}"><label><input type="checkbox" data-sup="${esc(r.id)}"${
          offSup.has(r.id) ? "" : " checked"}${m.length ? "" : " disabled"}>
          <b>${esc(r.name)}</b></label>
          <span class="rq-sup-c">${esc(r.contact || "")}${m.length ? ` · ${esc(m.join(", "))}` : ` <em>нет почты</em>`}${
            r.defer !== null && r.defer !== undefined ? ` · отсрочка ${r.defer} дн.` : ""}</span></li>`;
      }).join("")}</ul>` : `<div class="rq-nosup">Эту группу пока никто не возит. Отметьте поставщиков во вкладке
        «Поставщики и группы» — запрос уйдёт им.</div>`;
    const paint = () => {
      const all = items(), none = inGroup("");
      const g = gmap[sel];
      const rows = sel === "none" ? none : sel === "all" ? all : g ? inGroup(sel) : [];
      const sups = g ? suppliersOf(sel) : [];
      const on = rows.filter((r) => !offRow.has(r.id));
      const to = sups.filter((r) => !offSup.has(r.id) && mails(r).length);
      const addr = [...new Set(to.flatMap(mails))];
      box.innerHTML = `
        <div class="pf-crop rq" role="dialog" aria-label="Запрос поставщикам">
          <div class="rq-head"><h3>Запрос поставщикам</h3><span class="sit-hint">${esc(CUR.supply.site)} · ${all.length}
            ${plural(all.length, "позиция", "позиции", "позиций")} к покупке</span></div>
          <div class="rq-body">
            <nav class="rq-side">
              ${S.blocks.map((b) => {
                const gs = used.filter((x) => x.block === b.id);
                return gs.length ? `<h4 class="${SUPS.blockCls(b.id)}">${esc(b.name)}</h4>${gs.map((x) => sideItem(x.id, x.name,
                  inGroup(x.id).length, ` · ${suppliersOf(x.id).length} пост.`, SUPS.blockCls(b.id))).join("")}` : "";
              }).join("")}
              ${none.length ? `<h4>Не разложено</h4>${sideItem("none", "Без группы", none.length, "", "warn")}` : ""}
              <h4>Всё сразу</h4>${sideItem("all", "Все позиции одной книгой", all.length)}
            </nav>
            <div class="rq-main">
              ${g ? `<div class="rq-gh ${SUPS.blockCls(g.block)}"><b>${esc(g.name)}</b><span>${on.length} из ${rows.length}
                ${plural(rows.length, "позиции", "позиций", "позиций")} · ${to.length} из ${sups.length}
                ${plural(sups.length, "поставщика", "поставщиков", "поставщиков")}</span></div>`
              : sel === "none" ? `<div class="rq-gh warn"><b>Без группы</b><span>Поставьте позициям группу — они уйдут в её
                запрос. Группа запомнится за товаром: в следующей проработке он узнает её сам.</span></div>`
              : `<div class="rq-gh"><b>Все позиции одной книгой</b><span>Как раньше — всё, что покупаем. Поставщикам удобнее
                запросы по группам: каждому — то, что он возит.</span></div>`}
              <div class="rq-pos">${posHtml(rows, sel === "none")}</div>
              ${g ? `<div class="rq-to"><h4>Кому — поставщики группы${tip("Список поставщиков в книгу запроса не кладём: "
                + "книга уходит самим поставщикам. Адреса — в письмо, список для себя — отдельной книгой.")}</h4>${supHtml(sups)}</div>` : ""}
            </div>
          </div>
          <div class="pf-note bad" id="rqErr" hidden></div>
          <div class="pf-modal-foot">
            ${sel === "none" && on.length ? `<label class="rq-bulk">Отмеченным — группу
              <select id="rqBulk">${options("")}</select></label>` : ""}
            <span class="grow"></span>
            <button type="button" class="btn ghost" id="rqNo">Закрыть</button>
            ${g ? `<button type="button" class="btn-ghost sm" id="rqSupX" title="Поставщики этой группы с контактами — для себя"
              >${ICO.down}Список поставщиков</button>
              <button type="button" class="btn-ghost sm" id="rqCopy"${addr.length ? "" : " disabled"}
                title="Адреса отмеченных поставщиков — в скрытую копию письма">Скопировать адреса (${addr.length})</button>
              <button type="button" class="btn-ghost sm" id="rqMail"${addr.length ? "" : " disabled"}
                title="Письмо в почтовой программе: адреса в скрытой копии, тема и текст готовы — приложите скачанную книгу"
                >${ICO.mail}Письмо</button>` : ""}
            ${sel !== "none" ? `<button type="button" class="btn" id="rqXls"${on.length ? "" : " disabled"}
              >${ICO.down}Запрос Excel (${on.length})</button>` : ""}
          </div>
        </div>`;
      wireRq(rows, sups, on, addr, g);
    };
    const err = (t) => { const e = $n("#rqErr", box); if (e) { e.textContent = t; e.hidden = !t; } };
    const setGroup = async (ids, gid) => {
      try {
        await AUTH.api("POST", "/supply/" + encodeURIComponent(openId) + "/groups", { rows: ids, group: gid });
        CUR.rows.forEach((r) => {
          if (ids.includes(r.id)) {
            r.grp = gid;
            r.grp_by = gid ? "hand" : "";
          }
        });
        SIG = "";
        if (gid && !used.some((x) => x.id === gid)) used.push(gmap[gid]);
        used.sort((a, b) => a.ord - b.ord);
        // Разложили последнюю — показываем группу, куда она ушла.
        if (sel === "none" && !inGroup("").length) sel = gid || "all";
        paint();
      } catch (e) {
        err(e.message);
      }
    };
    const wireRq = (rows, sups, on, addr, g) => {
      box.querySelectorAll("[data-sel]").forEach((b) => b.addEventListener("click", () => {
        sel = b.dataset.sel;
        paint();
      }));
      const all = $n("[data-all]", box);
      if (all) {
        all.addEventListener("change", () => {
          rows.forEach((r) => (all.checked ? offRow.delete(r.id) : offRow.add(r.id)));
          paint();
        });
      }
      box.querySelectorAll("tr[data-r]").forEach((tr) => {
        const id = tr.dataset.r;
        $n("[data-on]", tr).addEventListener("change", (e) => {
          if (e.target.checked) offRow.delete(id); else offRow.add(id);
          paint();
        });
        $n("[data-g]", tr).addEventListener("change", (e) => setGroup([id], e.target.value));
      });
      box.querySelectorAll("[data-sup]").forEach((x) => x.addEventListener("change", () => {
        if (x.checked) offSup.delete(x.dataset.sup); else offSup.add(x.dataset.sup);
        paint();
      }));
      $n("#rqNo", box).addEventListener("click", close);
      const bulk = $n("#rqBulk", box);
      if (bulk) bulk.addEventListener("change", () => { if (bulk.value) setGroup(on.map((r) => r.id), bulk.value); });
      const xls = $n("#rqXls", box);
      if (xls) {
        xls.addEventListener("click", (e) => {
          const ids = on.length === rows.length && g ? "" : on.map((r) => r.id).join(",");
          const url = "/api/supply/" + encodeURIComponent(openId) + "/xlsx?kind=request"
            + (g ? "&group=" + encodeURIComponent(g.id) : "") + (ids ? "&rows=" + encodeURIComponent(ids) : "");
          DL.save(url, { btn: e.currentTarget }).catch((er) => err(er.message));
        });
      }
      if (!g) return;
      $n("#rqSupX", box).addEventListener("click", (e) => DL.save("/api/supply-suppliers/xlsx?group="
        + encodeURIComponent(g.id), { btn: e.currentTarget }).catch((er) => err(er.message)));
      const copy = $n("#rqCopy", box);
      copy.addEventListener("click", async () => {
        try {
          await navigator.clipboard.writeText(addr.join("; "));
          copy.textContent = `Скопировано: ${addr.length}`;
        } catch (e) {
          ASK.prompt("Адреса для письма — скопируйте", addr.join("; "));
        }
      });
      $n("#rqMail", box).addEventListener("click", () => {
        const me = (AUTH.current() || {}).name || "";
        const subj = `Запрос коммерческого предложения: ${g.name} — ${CUR.supply.site}`;
        const body = `Добрый день!\n\nПросим направить коммерческое предложение на поставку материалов по`
          + ` приложенному списку (${g.name}, ${on.length} ${plural(on.length, "позиция", "позиции", "позиций")})`
          + ` для объекта «${CUR.supply.site}»: цену за единицу, срок поставки и условия оплаты.\n\nС уважением,\n${me}`;
        location.href = "mailto:?bcc=" + encodeURIComponent(addr.join(",")) + "&subject=" + encodeURIComponent(subj)
          + "&body=" + encodeURIComponent(body);
      });
    };
    const close = () => { document.removeEventListener("keydown", key); box.remove(); };
    const key = (e) => { if (e.key === "Escape") close(); };
    document.addEventListener("keydown", key);
    box.addEventListener("mousedown", (e) => { if (e.target === box) close(); });
    document.body.appendChild(box);
    paint();
  }

  /* Единицы — как на сервере (_unit_norm, invoice_unit_price): строку
     счёта, выбранную руками, пересчитываем в единицу позиции — упаковку в
     штуки, километры в метры. */
  const UNITS = { "шт": "шт", "шт.": "шт", "штука": "шт", "штук": "шт", "м": "м", "м.": "м", "метр": "м", "пм": "м",
    "п.м": "м", "м.п.": "м", "км": "км", "кг": "кг", "кг.": "кг", "т": "т", "уп": "уп", "уп.": "уп", "упак": "уп",
    "упак.": "уп", "упаковка": "уп", "компл": "компл", "компл.": "компл", "комплект": "компл", "к-т": "компл",
    "пар": "пар", "пара": "пар", "рул": "рул", "рулон": "рул" };
  const unitNorm = (u) => {
    const x = String(u || "").trim().toLowerCase().replace(/ё/g, "е");
    return UNITS[x] || x.replace(/\.+$/, "");
  };
  const toks = (t) => String(t || "").toLowerCase().replace(/ё/g, "е").split(/[^a-zа-я0-9]+/)
    .filter((w) => w.length > 1);

  /* Окно сверки счёта (заказчик, 20.10.2026): «позиции проработки —
     спецификация, которую прорабатываем, — должны быть слева, а позиции
     счёта — справа. Трейс разобрал счёт: что узнал — встало напротив своих
     позиций; у позиции, которую не узнал, — щелчок и выпадающий список
     оставшихся строк счёта, не разнесённых по спецификации: видим каркас
     ВРУ, выбираем — он встал в позицию, и список стал на строку короче».
     Строка счёта встаёт и на такие же позиции в других разделах (тот же
     товар). Цена — за единицу позиции без НДС: так хранятся цены
     поставщиков, на экране они с НДС. Счёт закупки «Рабочей» — то же окно,
     а записанное в нём — поставки: ещё и сколько поставлено и когда. */
  function review(data) {
    const inv = data.invoice;
    const buy = data.kind === "buy";
    const byId = Object.fromEntries(data.rows.map((r) => [r.id, r]));
    const order = Object.fromEntries(data.rows.map((r, i) => [r.id, i]));
    const twins = {};
    data.rows.forEach((r) => { (twins[rowKey(r)] = twins[rowKey(r)] || []).push(r.id); });
    const twinsOf = (id) => (byId[id] ? twins[rowKey(byId[id])] || [id] : [id]);
    const L = data.lines.map((x) => {
      const rows = (x.rows || []).filter((id) => byId[id]);
      return { no: x.no, x, rows, state: x.state, term: x.term || "",
        defer: x.defer === null || x.defer === undefined ? "" : String(x.defer),
        price: rows.length ? x.unit_price : x.net_price, manual: !!x.manual, analog: !!x.analog,
        qty: x.qty_pos !== null && x.qty_pos !== undefined ? x.qty_pos : x.qty };
    });
    let sup = inv.supplier || "", termAll = "", when = data.date || "";
    let own = !!inv.own;
    // Строки доставки, разложенные в цены (правка № 49).
    const spread = new Set(data.lines.filter((x) => x.spread).map((x) => x.no));
    const amount = (x) => (x.sum !== null && x.sum !== undefined ? x.sum
      : x.sum_vat !== null && x.sum_vat !== undefined ? x.sum_vat
      : (x.price ?? x.price_vat ?? 0) * (x.qty || 0));
    const delivPct = () => {
      const d = L.filter((l) => spread.has(l.no)).reduce((n, l) => n + (amount(l.x) || 0), 0);
      const g = L.filter((l) => l.rows.length && !l.manual).reduce((n, l) => n + (amount(l.x) || 0), 0);
      return d && g ? d / g * 100 : 0;
    };
    // Отсрочка по счёту — условие поставщика: подставлена известная.
    let deferAll = data.defer === null || data.defer === undefined ? "" : String(data.defer);
    let F = "", Q = "";       // отбор позиций: "" — все, "in" — со строкой счёта, "out" — без пары
    const RC = buy ? 6 : 7;   // колонок справа — у счёта
    const box = document.createElement("div");
    box.className = "pf-modal";
    const stTxt = { sure: "узнана", maybe: "под вопросом", done: "записана", "": "" };
    const free = () => L.filter((l) => !l.rows.length && !l.manual);
    const freeLeft = () => free().filter((l) => !spread.has(l.no));
    const linesOf = (pid) => L.filter((l) => l.rows.includes(pid));
    const leadOf = (l) => l.rows.filter((id) => byId[id]).sort((a, b) => order[a] - order[b])[0];
    const strip = (v) => (data.strip_vat && data.vat_rate ? v / (1 + data.vat_rate / 100) : v);
    const r2 = (v) => Math.round(v * 100) / 100, r3 = (v) => Math.round(v * 1000) / 1000;
    const numIn = (v) => Number(String(v ?? "").replace(/\s/g, "").replace(",", "."));
    // Цена и количество строки счёта в единицах позиции.
    const inUnit = (x, unit) => {
      const a = unitNorm(unit), b = unitNorm(x.unit);
      let price = x.price, k = 1;
      if (price === null || price === undefined) return { price: x.net_price, qty: x.qty };
      if (a && b && a !== b) {
        if (x.base_price !== null && x.base_price !== undefined && ["шт", "м", "кг"].includes(a)) {
          k = x.base_price ? price / x.base_price : 1;
          price = x.base_price;
        } else if (b === "км" && a === "м") { price /= 1000; k = 1000; }
        else if (b === "м" && a === "км") { price *= 1000; k = 0.001; }
      }
      return { price: r2(strip(price)), qty: x.qty !== null && x.qty !== undefined ? r3(x.qty * k) : null };
    };
    const unitWarn = (l, r) => !l.manual && r && l.x.unit && r.unit && unitNorm(l.x.unit) !== unitNorm(r.unit)
      && !(["км", "м"].includes(unitNorm(l.x.unit)) && ["км", "м"].includes(unitNorm(r.unit)));
    const qmatch = (hay) => {
      const q = toks(Q);
      if (!q.length) return true;
      const h = toks(hay).join(" ");
      return q.every((w) => h.includes(w));
    };

    // Справа — строка счёта: что в ней, сколько, цена за единицу позиции.
    const lineCells = (l, r) => {
      const i = L.indexOf(l);
      return `<td class="snb-rv-mid">${ICO.arrow}</td>
        <td class="snb-rv-line"><span class="snb-rv-nm" title="${esc(l.manual ? "Цена вписана вручную" : l.x.name)}">${
          l.manual ? "<em>вписано вручную</em>" : esc(l.x.name)}</span><i class="snb-sub">${esc([l.manual ? "" : `стр. ${l.no}`,
          l.x.code ? "код " + l.x.code : ""].filter(Boolean).join(" · "))}${l.state ? ` <b class="snb-rv-st ${esc(l.state)}">${
          esc(stTxt[l.state] || "")}</b>` : ""}</i>${unitWarn(l, r) ? `<i class="snb-sub warn">в счёте за «${esc(l.x.unit)}», в позиции —
          «${esc(r.unit)}»: проверьте цену${buy ? " и количество" : ""}</i>` : ""}</td>
        <td class="num snb-rv-iq">${l.manual ? "" : `${qtyTxt(l.x.qty)} ${esc(l.x.unit || "")}`}</td>
        ${buy ? `<td class="num"><input class="pos-in num" data-qty="${i}" inputmode="decimal" aria-label="Поставлено, ${esc(r ? r.unit : "")}"
          value="${esc(String(l.qty ?? "").replace(".", ","))}" placeholder="${esc(r ? r.unit || "" : "")}"></td>` : ""}
        <td class="num"><input class="pos-in num" data-price="${i}" inputmode="decimal" aria-label="Цена за единицу без НДС"
          value="${l.price !== null && l.price !== undefined && l.price !== "" ? esc(String(l.price).replace(".", ",")) : ""}"
          placeholder="без НДС"></td>
        ${buy ? "" : `<td><input class="pos-in" data-term="${i}" maxlength="60" value="${esc(l.term)}" placeholder="${esc(termAll || "—")}"></td>
        <td class="num"><input class="pos-in num" data-defer="${i}" inputmode="numeric" maxlength="4" value="${esc(l.defer)}"
          placeholder="${esc(deferAll || "—")}"></td>`}
        <td><div class="seg snb-rv-an" role="group" aria-label="Оригинал или аналог">
          <button type="button" class="seg-b${l.analog ? "" : " on"}" data-an="0" data-i="${i}">Оригинал</button>
          <button type="button" class="seg-b${l.analog ? " on an" : ""}" data-an="1" data-i="${i}">Аналог</button></div></td>
        <td>${can() ? `<button type="button" class="snb-rv-remove" data-unpick="${i}" data-pid="${esc(r.id)}"
          title="Не та строка — убрать с позиции">${ICO.no}</button>` : ""}</td>`;
    };

    // Слева — позиция проработки; справа — её строка счёта или выбор.
    const posRow = (r) => {
      const ls = linesOf(r.id);
      const left = `<td class="t-id">${esc(r.pos_no)}</td>
        <td class="snb-rv-pos"><span class="snb-rv-nm" title="${esc(r.name)}">${esc(r.name)}</span>${r.brand || r.code
          ? `<i class="snb-sub">${esc([r.brand, r.code].filter(Boolean).join(" · "))}</i>` : ""}</td>
        <td class="num snb-rv-need">${qtyTxt(r.qty)} ${esc(r.unit || "")}</td>`;
      if (!ls.length) {
        const n = free().length;
        return `<tr class="snb-rv-p out" data-pid="${esc(r.id)}">${left}<td class="snb-rv-mid"></td>
          <td colspan="${RC}">${can() ? `<button type="button" class="snb-rv-pickl" data-pickl="${esc(r.id)}">${
            n ? `выбрать из счёта <i>не разнесено строк: ${n}</i>` : "выбрать из счёта или вписать цену"}${ICO.caret}</button>`
            : '<span class="sx-none">нет в счёте</span>'}</td></tr>`;
      }
      return ls.map((l, k) => {
        const lead = leadOf(l);
        const head = k === 0 ? left : `<td></td><td class="snb-rv-pos"><i class="snb-sub">ещё строка счёта на эту позицию</i></td><td></td>`;
        if (lead === r.id) return `<tr class="snb-rv-p in${k ? " more" : ""}" data-pid="${esc(r.id)}">${head}${lineCells(l, r)}</tr>`;
        const lr = byId[lead] || {};
        return `<tr class="snb-rv-p in twin${k ? " more" : ""}" data-pid="${esc(r.id)}">${head}
          <td class="snb-rv-mid">${ICO.link}</td>
          <td colspan="${RC - 1}" class="snb-rv-same">та же строка счёта${l.manual ? "" : ` № ${esc(l.no)}`} — ${
            esc(l.manual ? "вписано вручную" : l.x.name)}; цена${buy ? " и количество" : " и срок"} — у поз. ${esc(lr.pos_no || lr.name || "")}</td>
          <td>${can() ? `<button type="button" class="snb-rv-remove" data-unpick="${L.indexOf(l)}" data-pid="${esc(r.id)}"
            title="Убрать с этой позиции">${ICO.no}</button>` : ""}</td></tr>`;
      }).join("");
    };

    const rowsHtml = () => {
      const show = data.rows.filter((r) => {
        const has = linesOf(r.id).length > 0;
        if (F === "in" && !has) return false;
        if (F === "out" && has) return false;
        return qmatch([r.pos_no, r.name, r.brand, r.code].join(" ")
          + (has ? " " + linesOf(r.id).map((l) => l.x.name).join(" ") : ""));
      });
      let sec = null;
      let html = "";
      show.forEach((r) => {
        if ((r.section || "") !== sec) {
          sec = r.section || "";
          if (sec) html += `<tr class="sec"><td colspan="${4 + RC}" class="sec-name">${esc(sec)}</td></tr>`;
        }
        html += posRow(r);
      });
      if (!show.length) {
        html += `<tr><td colspan="${4 + RC}" class="snb-none">${Q ? "Позиции не нашлись — поищите иначе" : "Здесь пусто"}</td></tr>`;
      }
      // Строки счёта без позиции — внизу: всё, что в счёте, на виду.
      const orphans = free().filter((l) => qmatch([l.x.name, l.x.code].join(" ")));
      if (orphans.length) {
        html += `<tr class="snb-rv-oh"><td colspan="${4 + RC}">${ICO.file}Строки счёта без позиции — ${orphans.length}:
          выберите им позицию или оставьте — в ${buy ? "рабочую" : "проработку"} они не попадут</td></tr>`
          + orphans.map((l) => `<tr class="snb-rv-o">
            <td class="t-id"></td>
            <td colspan="2">${can() ? `<button type="button" class="snb-rv-row" data-pickp="${L.indexOf(l)}"><span class="snb-rv-none">выбрать
              позицию</span></button>` : ""}</td>
            <td class="snb-rv-mid"></td>
            <td class="snb-rv-line"><span class="snb-rv-nm" title="${esc(l.x.name)}">${esc(l.x.name)}</span><i class="snb-sub">стр. ${
              esc(l.no)}${l.x.code ? " · код " + esc(l.x.code) : ""}</i></td>
            <td class="num snb-rv-iq">${qtyTxt(l.x.qty)} ${esc(l.x.unit || "")}</td>
            <td colspan="${RC - 2}" class="snb-rv-op">${l.x.net_price !== null && l.x.net_price !== undefined
              ? `${money(l.x.net_price)} за ${esc(l.x.unit || "ед.")} без НДС` : ""}${can() && (spread.has(l.no) || DELIV_RE.test(l.x.name || ""))
              ? `<label class="snb-rv-spread${
              spread.has(l.no) ? " on" : ""}" title="Сумму строки разделить на все записанные позиции счёта пропорционально их стоимости"
              ><input type="checkbox" data-spread="${esc(l.no)}"${spread.has(l.no) ? " checked" : ""}>учесть в стоимости материала${
              spread.has(l.no) && delivPct() ? ` <b>+${String(Math.round(delivPct() * 100) / 100).replace(".", ",")} % к ценам</b>` : ""}</label>`
              : spread.has(l.no) ? '<span class="snb-rv-spread on">в стоимости материала</span>' : ""}</td></tr>`).join("");
      }
      return html;
    };

    const stats = () => {
      const lines = L.filter((l) => !l.manual);
      // Строка доставки, разложенная в цены, — тоже разнесена (правка № 49).
      const done = lines.filter((l) => l.rows.length || spread.has(l.no)).length;
      const n = L.filter((l) => l.rows.length).length;
      const pin = data.rows.filter((r) => linesOf(r.id).length).length;
      return { lines: lines.length, done, n, pin, out: data.rows.length - pin };
    };
    const okText = (n) => (n ? (buy ? `Записать поставки (${n})` : `Записать цены (${n})`)
      : buy ? "Снять поставки счёта" : "Снять цены счёта");
    const barHtml = () => {
      const t = stats();
      return `<span class="snb-rv-sum">В счёте <b>${t.lines}</b> ${plural(t.lines, "строка", "строки", "строк")}: разнесено
        <b>${t.done}</b>${t.lines - t.done ? `, осталось <b class="warn">${t.lines - t.done}</b>` : " — все"}</span>
        <span class="seg" role="group" aria-label="Какие позиции показать">
          <button type="button" class="seg-b${F ? "" : " on"}" data-rvf="">Все позиции<i>${data.rows.length}</i></button>
          <button type="button" class="seg-b${F === "in" ? " on" : ""}" data-rvf="in">Со строкой счёта<i>${t.pin}</i></button>
          <button type="button" class="seg-b${F === "out" ? " on" : ""}" data-rvf="out">Без пары<i>${t.out}</i></button>
        </span>`;
    };
    const paintRows = () => {
      const tb = $n(".snb-rv-tbl tbody", box);
      if (tb) tb.innerHTML = rowsHtml();
      const b = $n(".snb-rv-stat", box);
      if (b) b.innerHTML = barHtml();
      const ok = $n("#rvOk", box);
      if (ok) {
        const t = stats();
        ok.textContent = okText(t.n);
        ok.disabled = !(t.n || inv.status === "applied");
      }
    };

    const paint = () => {
      const t = stats();
      box.innerHTML = `
        <div class="pf-crop cnt-card snb-rv${buy ? " buy" : ""}" role="dialog" aria-label="Сверка счёта">
          <div class="snb-rv-head">
            <div><h3>${buy ? "Счёт на закупку" : "Счёт"} ${inv.number ? "№ " + esc(inv.number) : "без номера"}${inv.date
              ? " от " + esc(dmy(inv.date)) : ""}</h3>
              <span class="sit-hint">${esc(inv.filename)} · ${buy ? "строки станут поставками в «Рабочей»"
                : "цены встанут колонкой поставщика в проработке"}</span></div>
            <label class="fld snb-rv-sup"><span>Поставщик${buy ? "" : " — колонка в проработке"}</span>
              <input id="rvSup" list="rvSups" value="${esc(sup)}" placeholder="ООО «…»" autocomplete="off">
              <datalist id="rvSups">${data.suppliers.map((x) => `<option value="${esc(x)}">`).join("")}</datalist></label>
            ${buy ? "" : `<div class="fld snb-rv-own"><span>Чьи цены</span>
              <span class="seg" role="group" aria-label="Чьи цены в счёте">
                <button type="button" class="seg-b${own ? "" : " on"}" data-rvown="0"
                  title="Цены поставщика — в конкурентную проработку">Поставщика</button>
                <button type="button" class="seg-b${own ? " on own" : ""}" data-rvown="1"
                  title="Поставщика выбрал заказчик: цены сразу в «Выбрано», строки закрыты замком">${ICO.lock}Цена объекта</button>
              </span></div>`}
            ${buy ? `<label class="fld snb-rv-term"><span>Дата поставки</span>
              <input id="rvDate" type="date" value="${esc(when)}"></label>`
            : `<label class="fld snb-rv-term"><span>Срок поставки по счёту</span>
              <input id="rvTerm" value="${esc(termAll)}" maxlength="60" placeholder="в наличии, 5 дней…" autocomplete="off"></label>
            <label class="fld snb-rv-def" title="Условие поставщика: действует на все его позиции, где строка счёта своей не называет, и на следующие объекты"
              ><span>Отсрочка, дн.</span>
              <input id="rvDefer" value="${esc(deferAll)}" inputmode="numeric" maxlength="4" placeholder="нет" autocomplete="off"></label>`}
          </div>
          <div class="note snb-rv-vat">${data.strip_vat
            ? `Цены в счёте с НДС ${esc(data.vat_rate)} %${data.vat_guess ? " (ставка из настроек — в счёте не нашлась)" : ""} — записываем без НДС, как все цены поставщиков; на экране они покажутся с НДС.`
            : inv.vat === "none" ? "Счёт без НДС — цены как в счёте."
            : inv.vat === "excluded" ? "Цены в счёте без НДС — записываем как есть; на экране они покажутся с НДС."
            : "НДС в счёте не нашёлся — цены как в счёте. Если они с НДС, поправьте перед записью."}
            Слева — позиции проработки, справа — строки счёта. Не узнанной позиции выберите строку из оставшихся;
            цена — за единицу позиции${buy ? ", «поставлено» — в единицах позиции" : ""}.</div>
          ${(inv.warnings || []).length ? `<div class="pf-note bad snb-rv-warn">${inv.warnings.slice(0, 4).map(esc).join("<br>")}</div>` : ""}
          <div class="snb-rv-bar"><div class="snb-rv-stat">${barHtml()}</div>
            <label class="pg-find">${ICO.find}<input id="rvQ" type="search" placeholder="Позиция или строка счёта"
              value="${esc(Q)}" autocomplete="off"></label></div>
          <div class="snb-rv-body">
            <table class="tbl snb-rv-tbl${buy ? " buy" : ""}">
              <colgroup><col style="width:52px"><col class="rv-pos"><col style="width:86px"><col style="width:26px">
                <col class="rv-line"><col style="width:86px">${buy ? '<col style="width:100px">' : ""}<col style="width:100px">${
                buy ? "" : '<col style="width:96px"><col style="width:58px">'}<col style="width:138px"><col style="width:34px"></colgroup>
              <thead>
                <tr class="snb-rv-g"><th colspan="3" class="snb-rv-gl">Позиции проработки</th><th></th>
                  <th colspan="${RC}" class="snb-rv-gr">${esc(sup || inv.supplier || "Счёт")}${inv.number ? ` · счёт № ${esc(inv.number)}` : ""}</th></tr>
                <tr><th>№</th><th>Наименование</th><th class="num">Нужно</th><th></th><th>Строка счёта</th>
                  <th class="num">В счёте</th>${buy ? '<th class="num">Поставлено</th>' : ""}
                  <th class="num" title="За единицу позиции, без НДС">Цена за ед.</th>${buy ? ""
                  : '<th>Срок</th><th class="num" title="Отсрочка платежа, дней">Отср.</th>'}
                  <th title="Поставщик дал то, что в проекте, или аналог">Оригинал / аналог</th><th></th></tr>
              </thead>
              <tbody>${rowsHtml()}</tbody>
            </table>
          </div>
          <div class="pf-note bad" id="rvErr" hidden></div>
          <div class="pf-modal-foot">
            ${can() ? `<button type="button" class="btn ghost" id="rvRe"
              title="Прочитать файл счёта ещё раз — если строки, цены или поставщик разобрались неверно"
              >Разобрать заново</button>
              <button type="button" class="btn ghost warn" id="rvDel"
              title="${buy ? "Удалить счёт и его поставки" : "Удалить счёт и его цены (вписанные руками останутся)"}">Удалить счёт</button>
              <span class="grow"></span>` : ""}
            <button type="button" class="btn ghost" id="rvNo">Закрыть</button>
            ${can() && (L.length || inv.status === "applied") ? `<button type="button" class="btn" id="rvOk"${
              t.n || inv.status === "applied" ? "" : " disabled"}>${okText(t.n)}</button>` : ""}
          </div>
        </div>`;
      wire();
    };
    const dropPick = () => { const pp = document.querySelector(".snb-pick"); if (pp) pp.remove(); };
    const close = () => { document.removeEventListener("keydown", key); dropPick(); box.remove(); };
    const key = (e) => {
      if (e.key !== "Escape") return;
      if (document.querySelector(".snb-pick")) dropPick(); else close();
    };
    const err = (t) => { const e = $n("#rvErr", box); e.textContent = t; e.hidden = !t; };

    // Строку счёта — на позицию (и такие же позиции в других разделах).
    const assign = (l, pid) => {
      const r = byId[pid];
      const was = l.rows.length;
      l.rows = [...new Set(l.rows.concat(twinsOf(pid)))];
      l.state = "";
      if (!was && !l.manual) {
        const v = inUnit(l.x, r.unit);
        if (v.price !== null && v.price !== undefined) l.price = v.price;
        if (buy && v.qty !== null && v.qty !== undefined) l.qty = v.qty;
      }
      dropPick();
      paintRows();
    };
    const unassign = (l, pid) => {
      const drop = new Set(twinsOf(pid));
      l.rows = l.rows.filter((id) => !drop.has(id));
      if (!l.rows.length) {
        if (l.manual) L.splice(L.indexOf(l), 1);
        else { l.state = ""; l.price = l.x.net_price; l.qty = l.x.qty; }
      }
      paintRows();
    };
    const manualFor = (pid) => {
      const r = byId[pid];
      L.push({ no: null, x: { name: r.name, code: r.code, unit: r.unit, qty: null }, rows: twinsOf(pid).slice(),
        state: "", term: "", defer: "", price: "", manual: true, analog: false, qty: buy ? (r.qty ?? "") : "" });
      dropPick();
      paintRows();
      const inp = box.querySelector(`[data-price="${L.length - 1}"]`);
      if (inp) inp.focus();
    };

    // Всплывающий список у кнопки — поверх окна, вниз или вверх.
    const popList = (btn, head, foot) => {
      dropPick();
      const pop = document.createElement("div");
      pop.className = "snb-pick";
      pop.innerHTML = `${head}<input type="search" autocomplete="off"><div class="snb-pick-list"></div>${foot || ""}`;
      document.body.appendChild(pop);
      const place = () => {
        const rc = btn.getBoundingClientRect();
        const w = Math.max(460, Math.min(560, rc.width));
        pop.style.width = w + "px";
        pop.style.left = Math.max(8, Math.min(rc.left, innerWidth - w - 8)) + "px";
        const h = pop.offsetHeight;
        pop.style.top = (rc.bottom + 4 + h <= innerHeight - 8 ? rc.bottom + 4 : Math.max(8, rc.top - h - 4)) + "px";
      };
      const away = (e) => {
        if (!pop.isConnected) { document.removeEventListener("mousedown", away, true); return; }
        if (!pop.contains(e.target) && e.target !== btn && !btn.contains(e.target)) {
          pop.remove();
          document.removeEventListener("mousedown", away, true);
        }
      };
      document.addEventListener("mousedown", away, true);
      const body = $n(".snb-rv-body", box);
      if (body) body.addEventListener("scroll", dropPick, { once: true });
      return { pop, inp: $n("input", pop), list: $n(".snb-pick-list", pop), place };
    };

    /* Позиции — строку счёта (20.10.2026): сразу — строки, не разнесённые
       по спецификации, похожие на позицию сверху; выбрал — у следующей
       позиции их на одну меньше. Поиск — по всему счёту, разнесённые — с
       пометкой, на какой они позиции. Нет в счёте — цену можно вписать. */
    const pickLine = (btn, pid) => {
      const r = byId[pid];
      const mine = new Set(toks([r.name, r.brand, r.code].join(" ")));
      const score = (l) => ((l.x.candidates || []).some((c) => (c.rows || []).includes(pid)) ? 50 : 0)
        + toks([l.x.name, l.x.code].join(" ")).reduce((n, w) => n + (mine.has(w) ? (/\d/.test(w) ? 3 : 1) : 0), 0);
      const all = L.filter((l) => !l.manual);
      const fr = free();
      const { pop, inp, list, place } = popList(btn,
        `<div class="snb-pick-t" title="${esc(r.name)}">${esc(r.name)}</div>
         <div class="snb-pick-h">Не разнесено по спецификации: <b>${fr.length}</b> из ${all.length} ${plural(all.length, "строки", "строк", "строк")} счёта</div>`,
        can() ? `<div class="snb-pick-f"><button type="button" class="lnk" data-hand>Нет в счёте — вписать цену вручную</button></div>` : "");
      inp.placeholder = "Поиск по счёту: название, код";
      const draw = () => {
        const q = toks(inp.value);
        const hits = (q.length ? all.filter((l) => {
          const h = toks([l.x.name, l.x.code, l.no].join(" ")).join(" ");
          return q.every((w) => h.includes(w));
        }) : fr).map((l) => [score(l), l]).sort((a, b) => !!a[1].rows.length - !!b[1].rows.length
          || b[0] - a[0] || a[1].no - b[1].no);
        list.innerHTML = hits.length ? hits.slice(0, 150).map(([sc, l]) => {
          const on = l.rows.length ? byId[leadOf(l)] || {} : null;
          return `<button type="button" data-li="${L.indexOf(l)}" class="${on ? "taken" : sc >= 3 ? "near" : ""}">
            <b>${esc(l.no)}. ${esc(l.x.name)}</b><i>${esc([l.x.code && "код " + l.x.code,
              l.x.qty !== null && l.x.qty !== undefined ? `${qtyTxt(l.x.qty)} ${l.x.unit || ""}`.trim() : "",
              l.x.net_price !== null && l.x.net_price !== undefined ? `${money(l.x.net_price)} без НДС` : ""].filter(Boolean).join(" · "))}${
              on ? ` <em>уже: поз. ${esc(on.pos_no || on.name || "")}</em>` : ""}</i></button>`;
        }).join("")
          : `<span class="sit-hint">${q.length ? "Не нашлось — поищите другим словом" : "Все строки счёта уже разнесены — найдите поиском или впишите цену вручную"}</span>`;
        list.querySelectorAll("[data-li]").forEach((b) => b.addEventListener("click", () => assign(L[+b.dataset.li], pid)));
        place();
      };
      inp.addEventListener("input", draw);
      const hand = $n("[data-hand]", pop);
      if (hand) hand.addEventListener("click", () => manualFor(pid));
      draw();
      inp.focus();
    };

    // Строке счёта без позиции — позицию: поиск по проработке.
    const pickPos = (btn, l) => {
      const mine = new Set(toks([l.x.name, l.x.code].join(" ")));
      const cand = {};
      (l.x.candidates || []).forEach((c, i) => (c.rows || []).forEach((id) => { cand[id] = 50 - i; }));
      const score = (r) => (cand[r.id] || 0) + toks([r.name, r.brand, r.code].join(" "))
        .reduce((n, w) => n + (mine.has(w) ? (/\d/.test(w) ? 3 : 1) : 0), 0);
      const { inp, list, place } = popList(btn, `<div class="snb-pick-t" title="${esc(l.x.name)}">${esc(l.x.name)}</div>
        <div class="snb-pick-h">Позиции проработки без строки счёта — похожие сверху</div>`);
      inp.placeholder = "Поиск: номер, название, марка, код";
      const draw = () => {
        const q = toks(inp.value);
        const pool = q.length ? data.rows.filter((r) => {
          const h = toks([r.pos_no, r.name, r.brand, r.code].join(" ")).join(" ");
          return q.every((w) => h.includes(w));
        }) : data.rows.filter((r) => !linesOf(r.id).length);
        const hits = pool.map((r) => [score(r), r]).sort((a, b) => b[0] - a[0] || order[a[1].id] - order[b[1].id]);
        list.innerHTML = hits.length ? hits.slice(0, 150).map(([sc, r]) => {
          const on = linesOf(r.id)[0];
          return `<button type="button" data-row="${esc(r.id)}" class="${on ? "taken" : sc >= 3 ? "near" : ""}">
            <b>${esc(r.pos_no ? r.pos_no + " · " : "")}${esc(r.name)}</b><i>${esc([r.brand, r.code, r.unit,
              r.qty !== null && r.qty !== undefined ? qtyTxt(r.qty) : ""].filter(Boolean).join(" · "))}${
              on ? ` <em>уже: ${on.manual ? "вписано вручную" : "стр. " + esc(on.no)}</em>` : ""}</i></button>`;
        }).join("") : `<span class="sit-hint">Не нашлось — поищите другим словом</span>`;
        list.querySelectorAll("[data-row]").forEach((b) => b.addEventListener("click", () => assign(l, b.dataset.row)));
        place();
      };
      inp.addEventListener("input", draw);
      draw();
      inp.focus();
    };

    const wire = () => {
      $n("#rvNo", box).addEventListener("click", close);
      $n("#rvSup", box).addEventListener("input", (e) => { sup = e.target.value; });
      box.querySelectorAll("[data-rvown]").forEach((b) => b.addEventListener("click", () => {
        own = b.dataset.rvown === "1";
        box.querySelectorAll("[data-rvown]").forEach((x) => {
          const on = (x.dataset.rvown === "1") === own;
          x.classList.toggle("on", on);
          x.classList.toggle("own", on && own);
        });
        const ok = $n("#rvOk", box);
        if (ok) ok.disabled = false;
      }));
      if (buy) {
        $n("#rvDate", box).addEventListener("input", (e) => { when = e.target.value; });
      } else {
        $n("#rvTerm", box).addEventListener("input", (e) => {
          termAll = e.target.value;
          box.querySelectorAll("[data-term]").forEach((x) => { x.placeholder = termAll || "—"; });
        });
        $n("#rvDefer", box).addEventListener("input", (e) => {
          deferAll = e.target.value;
          box.querySelectorAll("[data-defer]").forEach((x) => { x.placeholder = deferAll || "—"; });
        });
      }
      $n(".snb-rv-stat", box).addEventListener("click", (e) => {
        const b = e.target.closest("[data-rvf]");
        if (!b) return;
        F = b.dataset.rvf;
        paintRows();
      });
      const q = $n("#rvQ", box);
      q.addEventListener("input", () => { Q = q.value; paintRows(); });
      // Таблица — один слушатель: строки перерисовываются, он остаётся.
      const tbl = $n(".snb-rv-tbl", box);
      tbl.addEventListener("input", (e) => {
        const t = e.target;
        if (t.dataset.price !== undefined) L[+t.dataset.price].price = t.value;
        else if (t.dataset.qty !== undefined) L[+t.dataset.qty].qty = t.value;
        else if (t.dataset.term !== undefined) L[+t.dataset.term].term = t.value;
        else if (t.dataset.defer !== undefined) L[+t.dataset.defer].defer = t.value;
      });
      tbl.addEventListener("change", (e) => {
        const t = e.target;
        if (t.dataset.spread === undefined) return;
        const no = +t.dataset.spread;
        if (t.checked) spread.add(no); else spread.delete(no);
        paintRows();
        const ok = $n("#rvOk", box);
        if (ok) ok.disabled = false;
      });
      tbl.addEventListener("click", (e) => {
        const pl = e.target.closest("[data-pickl]");
        if (pl) { pickLine(pl, pl.dataset.pickl); return; }
        const pp = e.target.closest("[data-pickp]");
        if (pp) { pickPos(pp, L[+pp.dataset.pickp]); return; }
        const un = e.target.closest("[data-unpick]");
        if (un) { unassign(L[+un.dataset.unpick], un.dataset.pid); return; }
        const an = e.target.closest("[data-an]");
        if (an) {
          const l = L[+an.dataset.i];
          l.analog = an.dataset.an === "1";
          an.parentNode.querySelectorAll("[data-an]").forEach((x) => {
            const on = (x.dataset.an === "1") === l.analog;
            x.classList.toggle("on", on);
            x.classList.toggle("an", on && l.analog);
          });
        }
      });
      const ok = $n("#rvOk", box);
      if (ok) ok.addEventListener("click", apply);
      const re = $n("#rvRe", box);
      if (re) re.addEventListener("click", reparse);
      const del = $n("#rvDel", box);
      if (del) {
        del.addEventListener("click", async () => {
          if (await delInvoice(inv, buy)) close();
        });
      }
    };
    const apply = async () => {
      const supplier = sup.trim();
      if (!supplier) { err(buy ? "Впишите поставщика — кто поставил" : "Впишите поставщика — его именем назовётся колонка"); return; }
      const lines = [];
      for (const l of L) {
        if (!l.rows.length) continue;
        const where = l.manual ? `Цена, вписанная вручную (${(byId[l.rows[0]] || {}).name || "позиция"})` : `Строка счёта ${l.no}`;
        const v = numIn(l.price);
        if (!(v > 0)) { err(`${where}: впишите цену больше нуля`); return; }
        const it = { no: l.no, manual: l.manual, rows: l.rows, price: v, analog: !!l.analog };
        if (buy) {
          const q = numIn(l.qty);
          if (!(q > 0)) { err(`${where}: сколько поставлено — больше нуля`); return; }
          it.qty = q;
        } else {
          it.term = (l.term || termAll || "").trim();
          it.defer = String(l.defer || "").trim();
        }
        lines.push(it);
      }
      const ok = $n("#rvOk", box);
      ok.disabled = true;
      try {
        const sp = [...spread].filter((no) => L.some((l) => l.no === no && !l.rows.length));
        const r = await AUTH.api("POST", "/supply-invoices/" + encodeURIComponent(inv.id) + "/apply",
          buy ? { supplier, date: when, lines, spread: sp }
            : { supplier, term: termAll.trim(), defer: deferAll.trim(), lines, own, spread: sp });
        close();
        await reload();
        note(buy ? (r.deliveries ? `Записано поставок: ${r.deliveries} — счёт${inv.number ? " № " + inv.number : ""}, ${supplier}`
          + `${when ? ", поставка " + dmy(when) : ""}.` : "Поставки этого счёта сняты.")
          : r.prices ? `Записано: ${r.prices} ${plural(r.prices, "цена", "цены", "цен")} из счёта`
          + `${inv.number ? " № " + inv.number : ""} — колонка «${supplier}»${own ? ", цена объекта" : ""}.`
          + (r.deliv_pct ? ` Доставка учтена в стоимости материала: +${String(r.deliv_pct).replace(".", ",")} % к ценам.` : "")
          : "Цены этого счёта сняты.");
      } catch (e) {
        err(e.message);
        ok.disabled = false;
      }
    };
    /* Разобрать заново — после исправления разбора: записанное по счёту
       снимается и встаёт по новому разбору. */
    const reparse = async () => {
      if (!(await ASK.confirm(`Разобрать счёт «${inv.filename}» заново? Его ${buy ? "поставки" : "цены"} перепишутся`
        + " по новому разбору. Исправления распознанных строк пропадут; вписанные вручную цены останутся."))) return;
      const b = $n("#rvRe", box);
      b.disabled = true;
      const tr = TRACE.start({ kind: "reinvoice", file: inv.filename });
      try {
        const x = await AUTH.api("POST", "/supply-invoices/" + encodeURIComponent(inv.id) + "/parse");
        tr.done(invSummary(x));
        close();
        await reload();
        if (buy) review(x); else await autoApply(x);
      } catch (e) {
        tr.fail("Не получилось: " + e.message);
        err(e.message);
        b.disabled = false;
      }
    };
    document.addEventListener("keydown", key);
    box.addEventListener("mousedown", (e) => { if (e.target === box) close(); });
    document.body.appendChild(box);
    paint();
  }

  // Открытая проработка — для кнопки «Сообщить об ошибке» (21.10.2026).
  const current = () => (openId && CUR && CUR.supply ? { id: CUR.supply.site_id, name: CUR.supply.site } : null);

  return { show, open, openSite, handover, current };
})();
