/* Раздел «Объекты»: папка стройки, её бумаги и участники.

   Объект здесь — именно папка, а не отчёт. Он заводится пустым и
   наполняется по мере поступления: договоры и проекты приезжают
   вразнобой, и ждать полного комплекта, чтобы завести стройку, нельзя.
   Своих цифр у объекта нет — всё, что про него показано, считается из
   вложенного.

   Договор и проект — рядом, а не один внутри другого. Один проект
   закрывает несколько договоров, договор на времянку живёт без проекта
   вовсе, а проект выходит раньше подписания. Связь между ними —
   отдельная и необязательная, поэтому она отмечается галочками, а не
   вложенностью списка. */
"use strict";

const SITES = (() => {
  const $s = (s, r) => (r || document).querySelector(s);
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  /* Видов ровно столько, сколько первоисточников на стройке. Калькуляция
     не отдельная бумага, а часть договора. Слово «чек-лист» здесь не
     используется намеренно: им уже называют таблицу ПТО со списком
     позиций, и второй смысл в соседнем поле путал бы оба. */
  const KINDS = [
    ["project", "Проект"],
    ["contract", "Договор"],
    ["other", "Прочее"],
  ];
  /* Без этих двух объект неукомплектован. «Прочее» ни о чём не говорит,
     поэтому его не спрашиваем. */
  const NEEDED = ["project", "contract"];

  let SITES_ROWS = [];
  /* Статусы тендера (с 07.10.2026 — у объекта, не у спецификаций) и
     списки для фильтров приходят с сервера: он один знает, что в базе есть
     на самом деле. До первого ответа держим те же три статуса, чтобы полоса
     фильтров не перестраивалась на глазах. */
  let STAGES = [{ id: "work", name: "В работе" },
                { id: "done", name: "Завершён" },
                { id: "won", name: "Выигран" }];
  let PICKS = { customer: [], foreman: [], master: [] };
  let FILTER = { customer: "", foreman: "", master: "", stage: "", org: "" };
  /* Свои компании и справочники для выбора в карточке объекта. Приходят
     вместе со списком объектов: один запрос вместо трёх, и полоса
     фильтров с формой строятся из того же, что и строки. */
  let ORGS = [];
  let DIR = { customers: [], staff: [] };
  let DOCS = [];
  let CONTRACTS = [];
  let PROJECTS = [];
  let LINKS = [];
  let REVS = [];
  // Сводка объекта для мини-дашборда под шапкой карточки.
  let SUMMARY = null;
  /* Цены объекта — файлы, которые действуют только в этом объекте: цены
     дочки на щиты и прайс поставщика по договору. Приходят вместе с
     документами объекта: нужны и во вкладке «Тендер», и в расчёте. */
  let SPRICES = { rows: [], suppliers: [] };
  let openId = null;    // раскрытый объект; null — список
  /* Объект в «Объектах» открывается на «Договоре»: «Тендер» с 07.10.2026 —
     свой раздел меню, расчёт спецификаций живёт там (MODE ниже). */
  let tab = "contract";
  /* Вкладка карточки в «Тендере»: проекты и расчёт или чек-лист — тот же,
     что в ПТО «Объектов» (заказчик, 08.10.2026: «чек-лист появляется первым
     в тендере, даже если тендер не выиграли»). */
  let tndTab = "calc";

  /* ── два места одного модуля (07.10.2026) ─────────────────────
     Заказчик: «блок „Тендер“ из объектов вынести в самостоятельный раздел:
     объекты, участвующие в тендере, — свой список и свой статус: в работе,
     завершён, выигран». Расчёт — те же документы, позиции и версии, что и
     прежде, поэтому раздел «Тендер» — этот же модуль в другом месте: MODE
     "tnd" рисует в #tndObj список тендера и карточку с расчётом, MODE "obj"
     — «Объекты» в #sec-sit, где видны только выигранные. У каждого места
     свой открытый объект и свои отборы (STASH). Разметку покинутого места
     стираем: иначе в документе было бы два #sitNote и два расчёта, а
     поиск по id находит первый. */
  let MODE = "obj";
  const HOST = () => $s(MODE === "tnd" ? "#tndObj" : "#sec-sit");
  const STASH = {};
  // Что сделать, когда «Тендер» откроется: расчёт, открытый из «Объектов».
  let AFTER = null;
  // Вид документа, выбранный в окне загрузки, и что набрано в поиске по
  // «Документам». Живёт снаружи разметки: вкладка перерисовывается после
  // загрузки, и выбор иначе сбрасывался бы.
  let upKind = "project";
  let docSearch = "";
  let docKind = "";

  /* Слова разные, суть одна. У проекта изменения выпускает институт, у
     договора — юристы допсоглашениями; называть и то и другое
     «редакцией» в интерфейсе значит говорить не на языке тех, кто с
     этим работает. */
  const REV_WORD = {
    project: ["изменение", "Изменения", "ИЗМ 2"],
    contract: ["допсоглашение", "Допсоглашения", "1/2023"],
  };

  /* «Объекты» и «Тендер» с 08.10.2026 — разные галочки: правит тот, у кого
     открыто место, где модуль сейчас рисует. allow — переходы в соседние
     разделы: кнопки туда видит только тот, кому они открыты. */
  const allow = (p) => AUTH.can(AUTH.current(), p);
  const can = () => allow(MODE === "tnd" ? "tnd_obj" : "obj");
  const fmtSize = (n) => n >= 1048576 ? (n / 1048576).toFixed(1) + " МБ"
    : n >= 1024 ? Math.round(n / 1024) + " КБ" : n + " Б";

  /* Значки шапки и строк. Держим строками рядом с разметкой: это часть
     вида, а не данных. */
  const ICO = {
    plus: `<svg viewBox="0 0 24 24" aria-hidden="true"><path
      d="M12 5v14M5 12h14"/></svg>`,
    go: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>`,
    ok: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>`,
    no: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7l10 10M17 7 7 17"/></svg>`,
    alert: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4.5 3.5 19h17z"/><path d="M12 10v4M12 16.4v.1"/></svg>`,
    terms: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3.5h10a1 1 0 0 1 1 1v15a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-15a1 1 0 0 1 1-1z"/><path d="M9 8h6M9 11.5h6M9 15h3.5"/></svg>`,
    filter: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16M7 12h10M10 18h4"/></svg>`,
    back: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg>`,
    chev: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>`,
    edit: `<svg viewBox="0 0 24 24" aria-hidden="true"><path
      d="M4 20h4l10-10a2.1 2.1 0 0 0-3-3L5 17v3z"/><path d="M13.5 6.5l4 4"/></svg>`,
    up: `<svg viewBox="0 0 24 24" aria-hidden="true"><path
      d="M12 16V4M7 9l5-5 5 5M4 17v2a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-2"/></svg>`,
    find: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11"
      r="6.5"/><path d="M20.5 20.5 16 16"/></svg>`,
    price: `<svg viewBox="0 0 24 24" aria-hidden="true"><path
      d="M20.6 13.4 12 22l-9-9V4h9l8.6 8.6a2 2 0 0 1 0 2.8z"/><circle
      cx="7.6" cy="7.6" r="1.3"/></svg>`,
    /* Цена объекта приколота: её велел заказчик, и в расчёт она идёт
       раньше минимальной у поставщиков. */
    pin: `<svg viewBox="0 0 24 24" aria-hidden="true"><path
      d="M9 3.5h6l-1 5.5 3.5 3.5V14h-11v-1.5L10 9z"/><path d="M12 14v6.5"/></svg>`,
    /* Достать из листа таблицу: лист со стрелкой наружу. */
    extract: `<svg viewBox="0 0 24 24" aria-hidden="true"><path
      d="M13 3H6.5A1.5 1.5 0 0 0 5 4.5v15A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0
      0 0 1.5-1.5V9z"/><path d="M13 3v6h6"/><path d="M9 16h7M12.5 12.5 16
      16l-3.5 3.5"/></svg>`,
    /* Таблица — то, что достали. */
    table: `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="4.5"
      width="17" height="15" rx="2"/><path d="M3.5 9.5h17M9.5 9.5v10"/></svg>`,
    down: `<svg viewBox="0 0 24 24" aria-hidden="true"><path
      d="M12 4v11M7.5 10.5 12 15l4.5-4.5M4.5 20h15"/></svg>`,
    trash: `<svg viewBox="0 0 24 24" aria-hidden="true"><path
      d="M4.5 6.5h15M9.5 6.5V4.8A1.3 1.3 0 0 1 10.8 3.5h2.4a1.3 1.3 0 0 1
      1.3 1.3v1.7M6.5 6.5l.9 12.2A1.5 1.5 0 0 0 8.9 20h6.2a1.5 1.5 0 0 0
      1.5-1.3l.9-12.2"/></svg>`,
    again: `<svg viewBox="0 0 24 24" aria-hidden="true"><path
      d="M4 12a8 8 0 0 1 13.7-5.6"/><path d="M18.5 3v4h-4"/><path
      d="M20 12a8 8 0 0 1-13.7 5.6"/><path d="M5.5 21v-4h4"/></svg>`,
    /* Зафиксированная версия — замок: смотреть можно, править нет. */
    lock: `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10.5"
      width="14" height="10" rx="2"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/></svg>`,
    /* Сравнить — две колонки со стрелками навстречу. */
    cmp: `<svg viewBox="0 0 24 24" aria-hidden="true"><path
      d="M4 7h7M4 12h7M4 17h7M13 7h7M13 12h7M13 17h7"/><path d="M9.5 4.5 11 7 9.5 9.5M14.5 14.5 13 17l1.5 2.5"/></svg>`,
    /* Подтянуть материалы — коробка, работы — гаечный ключ. */
    box: `<svg viewBox="0 0 24 24" aria-hidden="true"><path
      d="M3.5 7.6 12 3.2l8.5 4.4v8.8L12 20.8l-8.5-4.4z"/><path d="M3.5 7.6 12 12l8.5-4.4M12 12v8.8"/></svg>`,
    wrench: `<svg viewBox="0 0 24 24" aria-hidden="true"><path
      d="M14.6 5.2a4.2 4.2 0 0 0-5.3 5.4L4 15.9V20h4.1l5.3-5.3a4.2 4.2 0 0 0 5.4-5.3l-2.7 2.7-2.9-.5-.5-2.9z"/></svg>`,
    /* Передать снабжению — грузовик, как пункт «Снабжение» в меню. */
    truck: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6.5h11v9H3z"/><path
      d="M14 9.5h4l3 3v3h-7"/><circle cx="7" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/></svg>`,
  };
  /* Поставщики, по которым показываем цены. Список приходит с сервера
     вместе с позициями: подключат ЭТМ — колонка оживёт сама. До ответа
     сервера держим тот же порядок, чтобы шапка не прыгала. */
  /* Колонки цен в расчёте (правка № 57, 26.10.2026): «в расчёте
     калькуляций убрать блок „цены поставщиков — справочно“, отобразить его в
     „Снабжение“ → „Тендерная“». В расчёте — только цена объекта; цены
     каталогов и счетов по-прежнему подтягиваются и считают «Материалы за
     ед.», их видно в «Снабжении». */
  const SRC_SHOWN = () => SRC.filter((s) => s.own);
  let SRC = [
    { id: "obj", name: "Цена объекта", title: "Цены объекта", live: true, own: true },
    { id: "etm", name: "ЭТМ", title: "ЭТМ", live: false },
    { id: "rs24", name: "Русский свет", title: "Русский свет", live: true },
    { id: "elcom", name: "ЭЛКОМ-ОНЛАЙН", title: "ЭЛКОМ-ОНЛАЙН", live: true },
  ];
  /* «1 объект», «2 объекта», «7 объектов». Число в шапке читают вслух,
     и «2 объект» выдало бы, что подпись собрана склейкой. */
  const plural = (n, one, few, many) => {
    const a = Math.abs(n) % 100, b = a % 10;
    if (a > 10 && a < 20) return many;
    if (b > 1 && b < 5) return few;
    return b === 1 ? one : many;
  };

  /* Раздел перечитывается при каждом входе. Если с сервера пришло то же
     самое и открыт тот же экран, заново не рисуем: перерисовка при входе
     давала второе проявление раздела и сбрасывала открытое. */
  let SIG = "";
  async function load(mode) {
    if (mode && mode !== MODE) switchMode(mode);
    // Тендеру — с суммами расчёта: по ним список тендера и читают.
    const res = await AUTH.api("GET", "/sites" + (MODE === "tnd" ? "?calc=1" : ""));
    // В «Объектах» — выигранные: их строят. В «Тендере» — все со статусом.
    SITES_ROWS = MODE === "tnd" ? res.rows : res.rows.filter((s) => s.tender === "won");
    STAGES = res.stages;
    PICKS = { customer: res.customers, foreman: res.foremen,
              master: res.masters };
    ORGS = res.orgs || [];
    DIR = { customers: res.customers_dir || [], staff: res.staff_dir || [] };
    if (openId && !SITES_ROWS.some((s) => s.id === openId)) openId = null;
    if (openId) await loadOne(openId);
    const sig = JSON.stringify([MODE, res, openId, openDoc && openDoc.id,
      openId ? [DOCS, CONTRACTS, PROJECTS, LINKS, SUMMARY, REVS] : null]);
    const host = HOST();
    if (host && host.firstElementChild && sig === SIG) {
      tndBar();
      return runAfter();
    }
    SIG = sig;
    render();
    return runAfter();
  }

  // Вкладки «Объекты · Данные» раздела «Тендер» — только над списком: у
  // карточки и расчёта своя шапка с путём назад.
  function tndBar() {
    const bar = $s("#tndTabs");
    if (MODE === "tnd" && bar) bar.hidden = !!openId;
  }

  async function runAfter() {
    if (MODE !== "tnd" || !AFTER) return;
    const f = AFTER;
    AFTER = null;
    await f();
  }

  function switchMode(m) {
    const was = HOST();
    if (was) was.innerHTML = "";
    STASH[MODE] = { openId, tab, FILTER, SQ, ATTN, SSORT };
    MODE = m;
    const st = STASH[m] || {};
    openId = st.openId || null;
    tab = m === "tnd" ? "tender" : st.tab && st.tab !== "tender" ? st.tab : "contract";
    FILTER = st.FILTER || { customer: "", foreman: "", master: "", stage: "", org: "" };
    SQ = st.SQ || "";
    ATTN = st.ATTN || "";
    SSORT = st.SSORT || { key: "name", dir: 1 };
    openDoc = null; POS = null; VERS = null; openVer = null; CMP = null; openTerms = null;
    SIG = "";
  }

  /* Из «Объектов» — в «Тендер» на этот объект (и сразу в расчёт, если назван
     документ); из «Тендера» — в «Объекты». Раздел открывает app.js, данные
     и разметку — load нужного места. */
  function goTender(siteId, docId) {
    // Уже в «Тендере» — переключать место не нужно, открываем объект здесь.
    if (MODE === "tnd") {
      openId = siteId || null;
      openDoc = null; POS = null; VERS = null; openVer = null; CMP = null;
      SIG = "";
    } else {
      STASH.tnd = Object.assign(STASH.tnd || {}, { openId: siteId || null });
    }
    AFTER = docId ? () => openPositions(docId) : null;
    if (typeof TENDER === "object") TENDER.open("obj");
    else if (typeof openSection === "function") openSection("tnd");
  }

  function goObjects(siteId) {
    if (MODE === "obj") {
      openId = siteId || null;
      tab = "contract";
      openDoc = null; POS = null; VERS = null; openVer = null; CMP = null; openTerms = null;
      SIG = "";
    } else {
      STASH.obj = Object.assign(STASH.obj || {}, { openId: siteId || null, tab: "contract" });
    }
    if (typeof openSection === "function") openSection("sit");
  }

  async function loadOne(id) {
    /* Запросы разом, а не по очереди: они не зависят друг от друга, а
       последовательно это пять ожиданий сети подряд. Сводка для
       мини-дашборда не обязательна: не ответила — карточка открывается
       без полосы показателей, а не не открывается вовсе. */
    [DOCS, CONTRACTS, PROJECTS, LINKS, SUMMARY, SPRICES] = await Promise.all([
      AUTH.api("GET", "/documents?site=" + encodeURIComponent(id)),
      AUTH.api("GET", "/contracts?site=" + encodeURIComponent(id)),
      AUTH.api("GET", "/projects?site=" + encodeURIComponent(id)),
      AUTH.api("GET", "/links?site=" + encodeURIComponent(id)),
      AUTH.api("GET", "/sites/" + encodeURIComponent(id) + "/summary").catch(() => null),
      AUTH.api("GET", "/sites/" + encodeURIComponent(id) + "/prices")
        .catch(() => ({ rows: [], suppliers: [] })),
    ]);
    /* Редакции тянем одним запросом на все договоры и проекты объекта,
       а не по одному на карточку: их единицы, а запросов вышло бы
       столько же, сколько строк в обеих вкладках. */
    const all = await AUTH.api("GET", "/revisions");
    const mine = new Set([...CONTRACTS, ...PROJECTS].map((x) => x.id));
    REVS = all.filter((r) => mine.has(r.parent_id));
  }

  const revsOf = (kind, id) =>
    REVS.filter((r) => r.kind === kind && r.parent_id === id);

  /* Действующую отмечает сервер: по ней потом сверяют объёмы, и считаться
     она должна в одном месте, а не в каждом браузере заново. */
  const currentRev = (kind, id) =>
    revsOf(kind, id).find((r) => r.current) || null;

  function revLabel(r) {
    if (!r) return "";
    const num = r.num ? (/^\d+$/.test(r.num) ? "ИЗМ " + r.num : r.num) : "без номера";
    return num + (r.issued_at ? " от " + r.issued_at : "");
  }

  /* Примета объекта подписанным столбцом. Незаполненное показываем
     прочерком, а не прячем: пустой «Мастер» — это вопрос к человеку, а
     исчезнувший столбец им быть не может. */
  /* free — значение записано словами, а не выбрано из справочника:
     пунктир под ним говорит, что объект стоит привязать, но не кричит —
     заказчик, которого ещё нет в контрагентах, это рабочий этап. */
  const fact = (label, value, free) => {
    const cls = !value ? "dim" : free ? "free" : "";
    const tip = free && value
      ? "Записано словами, не из справочника — выберите в карточке объекта"
      : value;
    return `
    <div><dt>${esc(label)}</dt><dd${cls ? ` class="${cls}"` : ""} title="${
      esc(tip)}">${esc(value) || "—"}</dd></div>`;
  };

  /* Заказчик из справочника — ссылкой на его карточку (13.10.2026): как с
     ним работаем — оплата, сроки, инструкции, его поставщики. */
  const cusFact = (s) => (s.customer_id && typeof CUS === "object" && allow("ref_cus")
    ? `<div><dt>Заказчик</dt><dd><button type="button" class="fact-lnk" data-cus="${esc(s.customer_id)}"
        title="Карточка заказчика: оплата, сроки, инструкции, поставщики">${esc(s.customer)}</button></dd></div>`
    : fact("Заказчик", s.customer, s.customer && !s.customer_id));

  function missing() {
    const have = new Set(DOCS.map((d) => d.kind));
    return NEEDED.filter((k) => !have.has(k))
      .map((k) => (KINDS.find((x) => x[0] === k) || [])[1]);
  }

  /* Открытая таблица позиций. Отдельный экран, а не вкладка: строк
     сотни, и держать их рядом со списком бумаг незачем. */
  let openDoc = null;
  // Свёрнутая шапка карточки объекта — у каждого своя, помнится в браузере.
  const MINI_KEY = "karkas-sit-mini";
  let MINI = false;
  try { MINI = localStorage.getItem(MINI_KEY) === "1"; } catch (e) { /* без памяти */ }
  let POS = null;
  /* Версии калькуляции (22.09.2026): снимки расчёта с именем — «Тендерная»,
     «Договорная», «Изм. 1»… VERS — версии открытого расчёта, openVer —
     открытый снимок, CMP — экран сравнения. */
  let VERS = null;
  let openVer = null;
  let CMP = null;
  /* Условия договора (24.09.2026) — своя страница (contract.js) поверх
     карточки объекта; openTerms — id документа договора. */
  let openTerms = null;

  function render() {
    const host = HOST();
    if (!host) return;
    tndBar();
    // Страницу условий рисует contract.js сам — не затираем её.
    if (openTerms) return;
    if (CMP) {
      host.innerHTML = cmpHtml();
      wireCmp(host);
      return;
    }
    if (openVer) {
      host.innerHTML = verHtml();
      wireVer(host);
      return;
    }
    if (openDoc && POS) {
      // После выбора цены расчёт перерисовывается — остаёмся на той же
      // строке, а не улетаем к началу таблицы на сотню позиций.
      const was = $s(".calc-body", host);
      const keep = was ? [was.scrollTop, was.scrollLeft] : null;
      host.innerHTML = posHtml();
      wirePos(host);
      const now = $s(".calc-body", host);
      if (keep && now) { now.scrollTop = keep[0]; now.scrollLeft = keep[1]; }
      return;
    }
    host.innerHTML = openId ? (MODE === "tnd" ? tndCardHtml() : cardHtml())
      : MODE === "tnd" ? tndListHtml() : listHtml();
    openId ? wireCard(host) : wireList(host);
  }

  /* Ноль в подсчитанной колонке — это «ещё не считали», а не «стоит
     нисколько». Четыре «0,00» в каждой строке заслоняли те строки, где
     цена уже есть. */
  const sum0 = (n) => (n ? money(n) : "—");
  // Цены материала нет вовсе — ни выбранной, ни своей «за ед.»: клетка
  // пустая. «0» там читался как цена, равная нулю.
  const noMat = (p) => !p.buy_price && p.sell_price == null;

  const money = (n) => (n === null || n === undefined || n === "")
    ? "" : Number(n).toLocaleString("ru-RU", { minimumFractionDigits: 2,
                                               maximumFractionDigits: 2 });

  function openTermsPage(docId) {
    if (typeof CONTRACT !== "object") return;
    openTerms = docId;
    CONTRACT.open(HOST(), {
      docId, can: can(),
      onBack: async () => {
        openTerms = null;
        await loadOne(openId);
        render();
      },
    });
  }

  async function openPositions(docId) {
    // Расчёт спецификации проекта — в «Тендере»: из «Объектов» ведём туда.
    const was = DOCS.find((d) => d.id === docId);
    if (MODE === "obj" && was && was.kind === "project") return goTender(openId, docId);
    openDoc = was || { id: docId };
    [POS, VERS] = await Promise.all([
      AUTH.api("GET", "/positions?doc=" + encodeURIComponent(docId)),
      AUTH.api("GET", "/documents/" + encodeURIComponent(docId) + "/versions")
        .catch(() => ({ rows: [], next_name: "Тендерная" })),
    ]);
    // Дерево документа показывает те же версии — не отставать от расчёта.
    const dd = DOCS.find((x) => x.id === docId);
    if (dd) dd.versions = VERS.rows;
    if (POS.sources && POS.sources.length) SRC = POS.sources;
    render();
  }

  /* Таблица позиций. Правятся количество, цены и поставщик, а с 07.10.2026
     и спецификация строки проекта — номер, наименование, марка, код,
     завод, единица (specEditor): разбор PDF ошибается, а заказчик
     уточняет. Что стояло в проекте, сервер помнит — первоисточник не
     теряется. */
  /* Итоги в шапке расчёта. Отдельно от posHtml: после правки одной
     клетки строка перерисовывается на месте, а итоги — по тем, что сервер
     вернул вместе со строкой (refreshSums). */
  function calcFacts(t) {
    return `<dl class="pg-facts">
            <div><dt>Позиции</dt><dd title="Строк в спецификации">${
              t.count}</dd></div>
            ${t.no_price ? `<div><dt>Без цены</dt><dd class="warn"
              title="Позиции, для которых цена не нашлась">${
                t.no_price}</dd></div>` : ""}
            ${t.skipped ? `<div><dt>Не учтено</dt><dd class="skip-n"
              title="${esc(`Строки «Не учитывать»: в суммы, калькуляцию и подбор не идут${
                t.skip_sum ? ` — на ${money(t.skip_sum)} с НДС` : ""}`)}">${
                t.skipped}</dd></div>` : ""}
            ${fact("Материалы", money(t.sum_buy) || "—")}
            ${fact("Работы", money(t.sum_work) || "—")}
            ${fact("Итого с НДС", money(t.sum_with_vat) || "—")}
            ${fact("в т.ч. НДС " + (t.vat ?? 22) + "%", money(t.sum_vat) || "—")}
            ${fact("Без НДС", money(t.sum_net) || "—")}
          </dl>`;
  }

  function posHtml() {
    const t = POS.totals;
    const secSkip = sectionSkips();
    // Сколько строк всего и сколько «не учитывать» — для галочки в шапке.
    const строк = POS.rows.filter((p) => p.kind !== "section");
    const неУчт = строк.filter((p) => p.skip).length;
    const d = openDoc;
    const site = SITES_ROWS.find((x) => x.id === openId) || {};
    const diff = t.sum_est - t.sum_buy;
    // Колонка «Цена объекта» — своей группой перед поставщиками.
    const ownN = SRC.filter((s) => s.own).length;
    return `
      <div class="pg">
        <!-- Шапка одной полосой. Прежняя занимала три яруса и вместе с
             итогами съедала треть экрана — на таблицу, ради которой сюда
             и приходят, оставалась половина. -->
        <div class="pg-head strip calc-head">
          <button type="button" class="pg-back" id="posBack"
                  title="К объекту" aria-label="К объекту">${ICO.back}</button>
          <div class="pg-h1">
            <!-- Над документом — объект, которому он принадлежит: по
                 имени файла («323_24-2.26 ПСД…») не понять, чей это
                 расчёт, а в карточке объекта название видно — и в
                 расчёте его не хватало. Щелчок — назад в объект, как
                 стрелка слева. -->
            ${site.name ? `<button type="button" class="calc-obj" id="posObj"
              title="${esc(site.name)} — вернуться в объект">${esc(site.name)}</button>` : ""}
            <h2 title="${esc(d.title || d.filename || "Расчёт")}">${
              esc(d.title || d.filename || "Расчёт")}</h2>
          </div>
          <!-- Приметы и итоги — одной таблицей подписанных столбцов.
               Число позиций и «без цены» были плашками и спорили с
               кнопками по соседству; здесь это такие же столбцы, как
               суммы, и читаются одним движением глаза слева направо. -->
          ${calcFacts(t)}
          <!-- Наценка стоит у кнопок, а не посреди чисел: её крутят,
               глядя на итог, и это действие, а не примета. -->
          <label class="mk" title="Наценка на материал. Цены поставщиков
остаются справочными, в счёт идёт цена с наценкой. На цену объекта наценка не идёт — её зафиксировал заказчик.">
            <span>Наценка</span>
            <input id="posMk" inputmode="decimal" value="${
              t.markup ? esc(t.markup) : ""}" placeholder="0"><i>%</i>
          </label>
          <!-- Наценка на работы (правка № 18, 22.10.2026): процент
               удорожания расценок — вписанных и подтянутых из прайса. -->
          <label class="mk" title="Наценка на работы: расценки — вписанные и подтянутые из прайса работ —
умножаются на этот процент. В поле «Работа за ед.» остаётся расценка как есть, в суммы и калькуляцию идёт с наценкой.">
            <span>На работы</span>
            <input id="posWm" inputmode="decimal" value="${
              t.work_markup ? esc(t.work_markup) : ""}" placeholder="0"><i>%</i>
          </label>
          ${can() ? `<div class="pg-act pg-acts">
            <button type="button" class="btn-ghost sm" id="posSp"
              title="Цены этого объекта: щиты от дочки и прайс поставщика по договору"
              >${ICO.pin}Цены объекта${spReady() ? ` <i class="sp-n">${spReady()}</i>` : ""}</button>
            <button type="button" class="btn-ghost sm" data-addrows=""
              title="Добавить строки, которых нет в проекте: вставить таблицей из Excel или вписать"
              >${ICO.plus}Добавить строки</button>
            <!-- Материалы и работы подтягиваются раздельно (заказчик,
                 05.10.2026): подбор одного не трогает другое. -->
            <button type="button" class="btn-ghost sm" data-pull="mat"
              title="Найти цены материалов: каталоги поставщиков, счета и прайс-листы, цены объекта. Расценки работ не меняются"
              >${ICO.box}Подтянуть материалы</button>
            <button type="button" class="btn-ghost sm" data-pull="work"
              title="Подобрать расценки из прайса работ. Цены материалов не меняются"
              >${ICO.wrench}Подтянуть работы</button>
            ${(openDoc.combo || []).length ? `<button type="button" class="btn-ghost sm" id="posCombo"
              title="Строки — заново из спецификаций проектов; цены и правки сводной остаются"
              >${ICO.again}Обновить из проектов</button>` : ""}
            <button type="button" class="btn-ghost sm" id="posFix"
              title="Зафиксировать цены версией: «Тендерная», «Договорная», «Изм. 1»… Снимок не меняется, текущий расчёт живёт дальше"
              >${ICO.lock}Зафиксировать</button>
            <!-- Снабжение (07.10.2026): калькуляция уходит на проработку —
                 цены фиксируются версией, позиции встают в «Снабжение». -->
            <button type="button" class="btn-ghost sm${openDoc.supply ? " on-supply" : ""}" id="posSupply"
              title="${openDoc.supply ? "Калькуляция у снабжения — передать заново или в другой вид проработки"
                : "Передать снабжению: тендерная проработка, проработка или рабочая — со сроком и ответственным"}"
              >${ICO.truck}${supplyLabel(openDoc)}</button>
            ${VERS && VERS.rows.length ? `<button type="button" class="btn-ghost sm" id="posCmp"
              title="Сравнить текущий расчёт с зафиксированными версиями"
              >${ICO.cmp}Сравнить <i class="sp-n">${VERS.rows.length}</i></button>` : ""}
            <button type="button" class="btn-brand sm"
              id="posCalc">Выгрузить калькуляцию</button>
          </div>` : ""}
        </div>

        <div class="pg-body calc-body">
          <!-- Колонки обязаны поместиться в экран целиком: расчёт читают,
               сравнивая цены поставщиков со стоимостью строки. Ширины
               заданы все, кроме названия, и колонки поставщиков считаются
               от их числа: прежний список был на три поставщика, а их
               шесть, — ширины съезжали на чужие колонки, и название
               ужималось до обрывка. -->
          <table class="tbl pos-tbl calc-tbl" style="${calcTableStyle()}">
            <colgroup>${calcColgroup()}</colgroup>
            <thead>
              <!-- Шапка ровно как в образце заказчика: слева семь
                   колонок спецификации по ГОСТ, дальше цены поставщиков
                   из их личных кабинетов, работа из своего прайса и
                   формулы. Цвет в его файле означал источник — здесь то
                   же говорят подписи верхнего яруса. -->
              <tr>
                <!-- Верхний ярус разрезан по краю примёрзших колонок:
                     над номером и наименованием подпись остаётся на
                     месте, остальная часть яруса уезжает под неё. -->
                <th colspan="2" class="grp spec froze">Спецификация из проекта</th>
                <th colspan="5" class="grp spec"></th>
                <!-- «Минимальная цена» и «Поставщик» — в разделе «Снабжение»
                     (заказчик, 07.10.2026: выбор поставщика — не тендер, а
                     отдел снабжения). «Материалы за ед.» считается как
                     прежде: минимальная цена + наценка. --> 
                ${ownN ? `<th colspan="${ownN}" class="grp own"
                    title="Цены этого объекта: щиты от дочки и прайс поставщика по договору — с НДС, как в договоре; в расчёт идут с наценкой, НДС второй раз не прибавляется. Найденная здесь цена идёт в расчёт раньше минимальной у поставщиков. В справочник материалов не попадает"
                    >объект · с НДС</th>` : ""}
                <th class="grp calc"
                    title="Цена поставщика с наценкой и НДС — она и идёт в счёт. Цены в расчёте — с НДС"
                    >с наценкой и НДС</th>
                <th class="grp adc" title="Из своего прайса работ">Свой</th>
                <th colspan="4" class="grp calc">Формулы</th>
              </tr>
              <tr>
                <th class="pos-no" title="Номер позиции в спецификации.${can()
                  ? " Галочки слева — «Не учитывать»: строка остаётся в спецификации, но в суммы, калькуляцию и подбор не идёт. Галочка здесь — все строки сразу" : ""}"><div
                  class="no-row">${can() && строк.length ? `<label class="skip-ck skip-all" title="${
                    неУчт === строк.length ? "Вернуть в расчёт все строки"
                    : "Не учитывать все разделы и позиции — потом снимите галочку у тех, что делаете"}"><input
                    type="checkbox" data-skip-all${неУчт === строк.length ? " checked" : ""}${
                    неУчт && неУчт < строк.length ? " data-part" : ""}></label>` : ""}<span>№</span></div>${grip()}</th>
                <th class="pos-name">Наименование и техническая характеристика${grip()}</th>
                <th title="Тип, марка, обозначение документа">Тип, марка${grip()}</th>
                <th title="Код оборудования, изделия, материала">Код${grip()}</th>
                <th title="Завод-изготовитель">Завод${grip()}</th>
                <th title="Единица измерения">Ед.${grip()}</th>
                <th class="num">Кол-во${grip()}</th>
                ${SRC_SHOWN().map((s) => `<th class="num src${s.live ? "" : " off"}${s.own ? " own" : ""}"
                  title="${s.own ? "Цена объекта за единицу, с НДС: из файлов объекта (щиты, прайс по договору) или вписанная руками"
                    : esc(s.title) + " — материал за единицу, без НДС" + (s.live ? "" : ", доступа к API пока нет")}">${
                    esc(s.name)}${grip()}</th>`).join("")}
                <th class="num src">Материалы за ед.${grip()}</th>
                <th class="num src">Работа за ед.${grip()}</th>
                <th class="num src">Итого на ед.${grip()}</th>
                <th class="num src">Материалы всего${grip()}</th>
                <th class="num src">Работа всего${grip()}</th>
                <th class="num src">Итого всего${grip()}</th>
              </tr>
            </thead>
            <tbody>${POS.rows.map((p) => p.kind === "section" ? `
              <!-- Раздел спецификации («Трубы, лотки») — строка-заголовок
                   во всю ширину, как в проекте и в ведомости заказчика.
                   Ни количества, ни цен, ни полей ввода. Галочка у раздела
                   — «Не учитывать» весь раздел. -->
              <tr data-pos="${esc(p.id)}" class="sec${(secSkip[p.id] || {}).all ? " skip" : ""}${
                  p.origin === "hand" ? " hand" : ""}">
                <td class="pos-no" title="${esc(p.pos_no)}${p.origin === "hand" ? HAND_TIP : ""}"><div
                  class="no-row">${skipBox(p, secSkip[p.id])}${noCell(p)}</div></td>
                <td class="sec-name" colspan="${12 + SRC_SHOWN().length}"><span
                  class="sec-in">${handEdit(p) ? `<input class="pos-in txt sec-inp" data-f="name"
                    value="${esc(p.name)}">${dropBtn(p)}` : specSpan(p, "name")}${can() ? `<button type="button"
                    class="sec-add" data-addrows="${esc(p.id)}"
                    title="Добавить строки в этот раздел">${ICO.plus}</button>` : ""}</span></td>
              </tr>` : `
              <tr data-pos="${esc(p.id)}"${p.edited || p.in_set || p.skip || p.origin === "hand" ? ` class="${
                  [p.edited ? "ed" : "", p.in_set ? "set" : "", p.skip ? "skip" : "",
                   p.origin === "hand" ? "hand" : ""].filter(Boolean).join(" ")}"` : ""}>
                <td class="pos-no" title="${esc(p.pos_no || (p.origin === "hand" ? "" : p.row_no))}${
                  p.origin === "hand" ? HAND_TIP : ""}${p.skip
                  ? " — не учитывается" : ""}"><div class="no-row">${skipBox(p)}${noCell(p)}${addBelow(p)}</div></td>
                <!-- Обрезка до двух строк — у вложенного блока, а не у
                     ячейки: ячейка с display: -webkit-box перестаёт быть
                     ячейкой таблицы и висит плашкой не на высоту строки. -->
                <td class="pos-name${p.kind === "part" ? " part" : ""}${specCls(p, "name")}"${
                  specAttr(p, "name")} title="${specTip(p, "name") || (
                  p.kind === "part" ? "Часть комплекта: количество на один комплект"
                                    : esc(p.name))}">${handEdit(p) ? `<div class="cell-row">${davMark(p.dav, p.id, true)}${
                  nameArea(p)}${dropBtn(p)}</div>` : specText(p, "name")}</td>
                ${["brand", "code", "maker"].map((f) => `<td class="pos-brand${specCls(p, f)}"${
                  specAttr(p, f)} title="${specTip(p, f) || esc(p[f])}">${handEdit(p) ? tcell(p, f)
                  : specText(p, f)}</td>`).join("")}
                <td class="${specCls(p, "unit").trim()}"${specAttr(p, "unit")}${specTip(p, "unit")
                  ? ` title="${specTip(p, "unit")}"` : ""}>${handEdit(p) ? tcell(p, "unit") : specText(p, "unit")}</td>
                <td class="num${specMod(p, "qty") ? " sp-mod" : ""}"${specTip(p, "qty")
                  ? ` title="${specTip(p, "qty")}"` : ""}>${cell(p, "qty")}${p.kit_qty ? `<i class="kit-x" title="${
                  esc(`На один комплект. Комплектов ${numRu(p.kit_qty)} — в сумме ${
                    numRu(p.qty_total)} ${p.unit || ""}`)}">× ${numRu(p.kit_qty)}</i>` : ""}</td>
                ${p.in_set ? setCells(p) : `
                ${SRC_SHOWN().map((s) => matCell(p, s)).join("")}
                <!-- «Материалы за ед.» правится: вписанная цена заменяет
                     формулу «цена поставщика + наценка», и процент её
                     больше не трогает; кнопка возвращает формулу. -->
                <!-- Стёртая руками цена — пустая клетка с «↺»: подбор её
                     не заполняет, пока не вернули. -->
                <td class="num mat-run${p.mat_off ? " off"
                    : p.sell_price != null ? " manual" : ""}"
                    title="${p.mat_off
                      ? "Цену стёрли руками — подбор её не ставит. ↺ вернёт цену подбора"
                      : p.sell_price != null
                      ? "Цена задана вручную — наценка её не трогает"
                      : p.own_price
                      ? "Цена объекта — без наценки: стоимость зафиксировал заказчик, поставщик выбран. Впишите свою, с НДС, — она заменит её"
                      : "Цена поставщика с наценкой и НДС; впишите свою, с НДС, — она заменит формулу. Сотрите — у строки не будет цены"}"
                  ><div class="cell-row">${p.choice_lost ? `<i class="q mat-lost"
                    title="Выбранный поставщик больше не даёт цену — стоит цена по правилу. Выберите цену заново"
                    >!</i>` : p.supplier === OWN_GONE ? `<i class="q mat-lost"
                    title="Цена из своего прайса — своей цены больше нет. «Подтянуть материалы» поставит минимальную у поставщиков"
                    >!</i>` : ""}${can() ? cell(p, "sell_price", p.mat_off || noMat(p) ? "" : p.mat_unit)
                    : sum0(p.mat_unit)}${
                    !can() ? "" : p.mat_off ? `<button type="button" class="mat-auto" data-auto
                    title="Вернуть цену подбора — минимальную из уверенных находок">↺</button>`
                    : `<button type="button" class="mat-reset" data-resetsell
                    title="Вернуть формулу: цена поставщика + наценка">↺</button>`}</div></td>
                <!-- Расценку вписывают прямо здесь: она сохраняется в прайсе
                     работ, и выходить из расчёта ради неё не нужно. -->
                <td class="num wrk" title="${p.work_off
                    ? "Расценку стёрли руками — подбор её не ставит"
                    : "Впишите расценку — она сохранится в прайсе работ, раздел «Из расчётов»"}"
                  ><div class="cell-row">${cell(p, "work_price", p.work_base)}${
                  wmMark(p)}${workHint(p)}${findWorkBtn()}</div></td>
                <td class="num pos-calc">${sum0(p.unit_total)}</td>
                <td class="num pos-calc">${sum0(p.sum_buy)}</td>
                <td class="num pos-calc">${sum0(p.sum_work)}</td>
                <td class="num pos-calc tot"${p.skip ? ` title="${esc(skipTip(p))}"` : ""}>${
                  p.skip ? skipTot(p) : sum0(p.sum_total)}</td>`}
              </tr>`).join("")}${can() ? `
              <tr class="add-row"><td class="pos-no"></td>
                <td class="sec-name" colspan="${12 + SRC_SHOWN().length}"><span class="sec-in"><button
                  type="button" class="add-rows-btn" data-addrows="">${ICO.plus}Добавить строки</button><i>
                  которых нет в проекте — таблицей из Excel или вписать</i></span></td></tr>` : ""}</tbody>
          </table>
        </div>
        <!-- Итог действия — «проставлено 12», «расценка сохранена в прайсе».
             Без этой полосы note() в расчёте молчал. -->
        <div class="pg-note" id="sitNote" hidden></div>
      </div>`;
  }

  /* Строки, добавленные руками (заказчик, 05.10.2026: «в объекте нужно
     добавить 10 строк, но ни в каком проекте этого нет»). Их можно
     править прямо в таблице — номер, название, марку, единицу — и удалить:
     в проекте их нет, первоисточник здесь. Синяя полоска слева отличает их
     от строк проекта. */
  const HAND_TIP = " — добавлена вручную, в проекте её нет";
  /* «+» в первой колонке строки — добавить строки сразу под ней (правка
     № 18, 22.10.2026: «добавление строки в любом месте»). Под частью
     комплекта и под самим комплектом — после всех его частей: в середину
     комплекта чужая строка не встаёт. */
  const addBelow = (p) => (can() ? `<button type="button" class="row-add" data-addafter="${esc(p.id)}"
    title="Добавить строки ниже этой">+</button>` : "");
  const handEdit = (p) => p.origin === "hand" && can();
  const tcell = (p, field) => `<input class="pos-in txt" data-f="${field}" value="${
    esc(p[field] ?? "")}">`;
  // Название — в две строки, как у строк проекта: длинное в одну не влезает.
  const nameArea = (p) => `<textarea class="pos-in txt nm-in" data-f="name" rows="2">${
    esc(p.name || "")}</textarea>`;
  const noCell = (p) => (handEdit(p)
    ? `<input class="pos-in txt no-in" data-f="pos_no" value="${esc(p.pos_no || "")}" placeholder="№">`
    : `<span class="no-t${specCls(p, "pos_no")}"${specAttr(p, "pos_no")}${specTip(p, "pos_no")
      ? ` title="${specTip(p, "pos_no")}"` : ""}>${noText(p)}</span>`);
  const noText = (p) => esc(p.pos_no || (p.origin === "hand" || p.kind === "section" ? "" : p.row_no));

  /* Спецификация строки проекта правится по щелчку (заказчик, 07.10.2026):
     номер, наименование, марка, код, завод, единица; количество — полем,
     как было. Сервер помнит, что стояло в проекте (spec_was): поправленная
     клетка подписана «в проекте — …», «↺» возвращает, а повторный разбор
     правку переносит, пока проектировщик это поле не поменял. */
  const specEd = (p) => can() && p.origin !== "hand";
  const specMod = (p, f) => Object.prototype.hasOwnProperty.call(p.spec_was || {}, f);
  const specCls = (p, f) => (specEd(p) ? " sp-ed" : "") + (specMod(p, f) ? " sp-mod" : "");
  const specAttr = (p, f) => (specEd(p) ? ` data-ef="${f}"` : "");
  const specWas = (p, f) => {
    const v = (p.spec_was || {})[f];
    return v === null || v === undefined || v === "" ? "пусто" : `«${f === "qty" ? numRu(v) : v}»`;
  };
  const specTip = (p, f) => (specMod(p, f) ? esc(`Исправлено руками. В проекте — ${specWas(p, f)}`) : "");
  const specText = (p, f) => (f === "name"
    ? davWrap(davMark(p.dav, p.id, can()), `<span class="nm">${esc(p.name) || "—"}</span>`) : esc(p[f]) || "");

  /* «Д» — давальческий материал (правка № 46, 24.10.2026): «в каждую
     строчку к каждой позиции признак буквой «Д» в столбце «Наименование»»
     — в ВДЦ, КЛК, РДЦ и в расчёте калькуляции. Материал даёт заказчик;
     суммы отметка не меняет, снабжению уходит сразу. Кто правит — ставит и
     снимает щелчком (пустая «Д» видна при наведении на строку). */
  const DAV_ON = "Давальческий материал — его даёт заказчик";
  const davMark = (on, id, edit) => (edit
    ? `<button type="button" class="dav-b${on ? " on" : ""}" data-dav="${esc(id)}" aria-pressed="${!!on}" title="${
      on ? DAV_ON + ". Щелчок снимет отметку" : "Отметить «Д» — давальческий материал, его даёт заказчик"}">Д</button>`
    : on ? `<b class="dav-b on" title="${DAV_ON}">Д</b>` : "");
  const davWrap = (mark, html) => (mark ? `<span class="dav-row">${mark}${html}</span>` : html);

  async function toggleDav(b) {
    const p = POS && POS.rows.find((x) => x.id === b.dataset.dav);
    if (!p || b.disabled) return;
    const dav = !p.dav;
    b.disabled = true;
    try {
      await AUTH.api("POST", "/documents/" + encodeURIComponent(openDoc.id) + "/dav", { ids: [p.id], dav });
      p.dav = dav;
      b.outerHTML = davMark(dav, p.id, true);
      note(dav ? "«Д» — давальческий материал: его даёт заказчик. Отметка видна и в снабжении"
        : "Отметка «Д» снята");
    } catch (e) {
      b.disabled = false;
      note("Не вышло: " + e.message, true);
    }
  }
  const specSpan = (p, f) => (specEd(p) ? `<span class="sp-sec${specCls(p, f)}"${specAttr(p, f)}${
    specTip(p, f) ? ` title="${specTip(p, f)}"` : ""}>${esc(p[f])}</span>` : esc(p[f]));

  function specEditor(el) {
    if (el.querySelector(".sp-in")) return;
    const tr = el.closest("tr");
    const p = POS.rows.find((x) => x.id === tr.dataset.pos);
    if (!p) return;
    const f = el.dataset.ef;
    const was = el.innerHTML;
    const long = f === "name" && p.kind !== "section";
    const inp = document.createElement(long ? "textarea" : "input");
    inp.className = "pos-in txt sp-in" + (long ? " nm-in" : "");
    if (long) inp.rows = 2;
    inp.value = p[f] ?? "";
    // Поле и «↺» — одной строкой, как у добавленных руками строк.
    const row = document.createElement("div");
    row.className = "cell-row";
    row.appendChild(inp);
    el.textContent = "";
    el.appendChild(row);
    if (specMod(p, f)) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "sp-back";
      b.textContent = "↺";
      b.title = `Вернуть как в проекте: ${specWas(p, f)}`;
      // mousedown — раньше, чем поле потеряет фокус и сохранит набранное.
      b.addEventListener("mousedown", (e) => { e.preventDefault(); done({ revert: f }); });
      row.appendChild(b);
    }
    inp.focus();
    inp.select();
    let fin = false;
    async function done(body) {
      if (fin) return;
      fin = true;
      if (!body) { el.innerHTML = was; return; }
      try {
        const { totals, renumbered, ...fresh } = await AUTH.api("PATCH", "/positions/" + p.id, body);
        if (renumbered) {
          await openPositions(openDoc.id);
          note(`Номера ниже идут от исправленного — перенумеровано строк с шифром оборудования: ${renumbered}`);
          return;
        }
        Object.assign(p, fresh);
        refreshSums(totals);
        paintRow(tr, p);
        repaintSpec(tr, p);
      } catch (e) {
        el.innerHTML = was;
        note("Не сохранилось: " + e.message, true);
      }
    }
    inp.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); inp.blur(); }
      if (e.key === "Escape") { e.preventDefault(); done(null); }
    });
    inp.addEventListener("blur", () => {
      const v = inp.value.replace(/\s+/g, " ").trim();
      done(v === String(p[f] ?? "").trim() ? null : { [f]: v });
    });
  }

  /* Вставка столбца из Excel прямо в расчёт (заказчик, 07.10.2026: «могу
     добавить только одну цену вручную… скопировала бы с Excel, добавила
     сразу блоком»). Значения ложатся вниз от клетки, куда вставили; два
     столбца из «Материалы за ед.» — материал и работа, как в расчёте.
     Строки Excel — как строки расчёта (с разделами): если на раздел
     попадает число, значит, в Excel разделов нет — тогда только по строкам
     с полем. Пустая клетка Excel цену не стирает. */
  const PASTE_SEL = '.calc-tbl input[data-f="sell_price"], .calc-tbl input[data-f="work_price"],'
    + ' .calc-tbl input[data-f="qty"]';
  const PASTE_NAME = { qty: "«Кол-во»", sell_price: "«Материалы за ед.»", work_price: "«Работа за ед.»" };
  const pasteNum = (v) => {
    const t = String(v).replace(/[\s\u00a0]|₽|руб\.?|р\./gi, "").replace(",", ".");
    return /^\d+(\.\d+)?$/.test(t) ? t : null;
  };

  async function pasteColumn(inp, text) {
    const f = inp.dataset.f;
    const lines = text.replace(/\r/g, "").replace(/\n+$/, "").split("\n").map((l) => l.split("\t"));
    const fields = f === "sell_price" ? ["sell_price", "work_price"] : [f];
    const trs = [...inp.closest(".calc-tbl").querySelectorAll("tbody tr[data-pos]")];
    const at = trs.indexOf(inp.closest("tr"));
    const has = (tr, k) => !!(tr && tr.querySelector(`input[data-f="${k}"]`));
    const full = (cells) => cells.some((v) => v.trim());
    const onSec = lines.filter((cells, i) => full(cells) && trs[at + i] && !has(trs[at + i], f)).length;
    const withInput = trs.slice(at).filter((tr) => has(tr, f));
    const rowAt = onSec ? (i) => withInput[i] : (i) => trs[at + i];
    const byId = new Map();
    let bad = 0, over = 0, replace = 0;
    lines.forEach((cells, i) => {
      if (!full(cells)) return;
      const tr = rowAt(i);
      if (!tr) { over++; return; }
      const p = POS.rows.find((x) => x.id === tr.dataset.pos);
      cells.slice(0, fields.length).forEach((v, k) => {
        const key = fields[k];
        if (!v.trim() || !has(tr, key)) return;
        const n = pasteNum(v);
        if (n === null) { bad++; return; }
        const cur = byId.get(tr.dataset.pos) || { id: tr.dataset.pos };
        cur[key] = n;
        byId.set(tr.dataset.pos, cur);
        // Цена материала стоит и тогда, когда она по формуле (поставщик + наценка).
        if (p && (key === "sell_price" ? p.sell_price != null || (p.mat_unit && !p.mat_off)
          : p[key] != null && p[key] !== "")) replace++;
      });
    });
    const rows = [...byId.values()];
    if (!rows.length) {
      note(bad ? "Во вставленном нет чисел — вставьте столбец цен или количеств" : "Вставлять некуда", true);
      return;
    }
    const first = POS.rows.find((x) => x.id === rows[0].id) || {};
    const last = POS.rows.find((x) => x.id === rows[rows.length - 1].id) || {};
    const span = rows.length > 1 ? ` — строки ${first.pos_no || first.row_no} … ${last.pos_no || last.row_no}` : "";
    const what = fields.length > 1 && rows.some((r) => r.work_price) ? "«Материалы за ед.» и «Работа за ед.»"
      : PASTE_NAME[f];
    if (rows.length > 1 && !(await ASK.confirm(
      `Вставить в ${what}: ${rows.length} ${plural(rows.length, "строка", "строки", "строк")}${span}.`
      + (replace ? `\nУ ${replace} ${plural(replace, "клетки", "клеток", "клеток")} значение уже есть — заменится.` : "")
      + (onSec ? "\nРазделов во вставленном нет — значения легли подряд по строкам с ценами." : ""),
      { title: "Вставка из Excel", ok: "Вставить" }))) return;
    try {
      const res = await AUTH.api("POST", "/documents/" + encodeURIComponent(openDoc.id) + "/rows/prices", { rows });
      await openPositions(openDoc.id);
      flashRows(res.ids || []);
      const w = res.work_saved || {};
      const nw = (w.created || 0) + (w.updated || 0);
      note(`Вставлено: ${res.updated} ${plural(res.updated, "строка", "строки", "строк")}`
        + (bad ? `, не числа пропущены (${bad})` : "")
        + (over ? `, ${over} ${plural(over, "значение", "значения", "значений")} ниже конца расчёта — не легли` : "")
        + (nw ? `. Расценки — в прайсе работ, раздел «Из расчётов»: ${nw}` : ""));
    } catch (err) {
      note("Не вставилось: " + err.message, true);
    }
  }

  /* Клетки спецификации после правки — на месте, без перерисовки таблицы. */
  function repaintSpec(tr, p) {
    tr.classList.add("ed");
    tr.querySelectorAll("[data-ef]").forEach((el) => {
      const f = el.dataset.ef;
      el.classList.toggle("sp-mod", specMod(p, f));
      if (specMod(p, f)) el.title = `Исправлено руками. В проекте — ${specWas(p, f)}`;
      else el.title = f === "name" && p.kind === "part" ? "Часть комплекта: количество на один комплект"
        : f === "pos_no" || f === "unit" ? "" : String(p[f] ?? "");
      el.innerHTML = f === "pos_no" ? noText(p) : el.classList.contains("sp-sec") ? esc(p[f]) : specText(p, f);
    });
    const q = tr.querySelector('input[data-f="qty"]');
    if (q) {
      const td = q.closest("td");
      td.classList.toggle("sp-mod", specMod(p, "qty"));
      td.title = specMod(p, "qty") ? `Исправлено руками. В проекте — ${specWas(p, "qty")}` : "";
      if (document.activeElement !== q) q.value = p.qty ?? "";
    }
  }
  const dropBtn = (p) => `<button type="button" class="row-drop" data-drop title="${
    p.kind === "section" ? "Удалить раздел — с добавленными под ним строками" : "Удалить строку"}">×</button>`;

  /* Удалить добавленную руками строку. Раздел — вместе со строками под
     ним, если и они добавлены руками: так его и заводили. */
  async function dropRow(b) {
    const tr = b.closest("tr");
    const at = POS.rows.findIndex((x) => x.id === tr.dataset.pos);
    const p = POS.rows[at];
    if (!p) return;
    const ids = [p.id];
    if (p.kind === "section") {
      for (let i = at + 1; i < POS.rows.length && POS.rows[i].kind !== "section"
           && POS.rows[i].origin === "hand"; i++) ids.push(POS.rows[i].id);
    }
    const n = ids.length - 1;
    const what = p.kind === "section"
      ? `раздел «${p.name}»${n ? ` и ${n} ${plural(n, "строку", "строки", "строк")} под ним` : ""}`
      : `строку «${p.name}»`;
    if (!(await ASK.confirm(`Удалить ${what}?\nВ проекте ${ids.length > 1 ? "их" : "её"} нет — вернуть можно, только добавив заново.`,
      { title: "Удалить из расчёта", ok: "Удалить", danger: true }))) return;
    try {
      await AUTH.api("POST", "/documents/" + encodeURIComponent(openDoc.id) + "/rows/delete", { ids });
      await openPositions(openDoc.id);
      note(ids.length > 1 ? `Удалено ${ids.length} ${plural(ids.length, "строка", "строки", "строк")}` : "Строка удалена");
    } catch (e) {
      note("Не вышло: " + e.message, true);
    }
  }

  /* ── окно «Добавить строки» ──────────────────────────────────
     Таблица полей, как в Excel: вписывают построчно или вставляют блок
     из Excel — Ctrl+V в любую клетку раскладывает его вниз и вправо от
     неё; строку с заголовками («Наименование», «Ед.», «Кол-во») окно
     узнаёт само и раскладывает по ним. Вид строки угадывается: одно
     название — раздел, «ПНР», «…работы», «монтаж» — работа без материала
     (подбор материалов её не ищет). Номера продолжают нумерацию над
     местом вставки — их можно поправить. */
  // Цены — тоже из той же таблицы (заказчик, 07.10.2026): «Материалы за ед.»
  // ложится как вписанная цена, «Работа за ед.» — как вписанная расценка.
  const AR_COLS = [["pos_no", "№", 64], ["name", "Наименование", 0], ["brand", "Тип, марка", 128],
    ["code", "Код", 84], ["maker", "Завод", 100], ["unit", "Ед.", 56], ["qty", "Кол-во", 70],
    ["sell_price", "Материалы за ед.", 96], ["work_price", "Работа за ед.", 90]];
  const AR_PRICE = ["qty", "sell_price", "work_price"];
  const AR_KEYS = AR_COLS.map((c) => c[0]);
  const AR_KINDS = ["item", "work", "section"];
  const AR_KIND_NAME = { item: "Позиция", work: "Работа", section: "Раздел" };
  const AR_HEAD = { pos_no: /^(№|n|поз)/i, name: /наимен|назван/i, brand: /тип|марк/i,
    code: /^код|артикул/i, maker: /завод|изготов|производ/i, unit: /^ед|единиц/i,
    qty: /^кол|количеств/i,
    sell_price: /^(?!.*(всего|итого|сумм)).*(материал|^цена)/i,
    work_price: /^(?!.*(всего|итого|сумм)).*(работ|расценк|монтаж)/i };
  const AR_WORK = /(^|[\s(«"])(пнр|пусконаладк|монтаж|демонтаж|наладк|земляны|засыпк|разработк|прокладк|укладк|бурени|сварк|окраск|испытани|измерени|работ[аы]?(\s|$))/i;

  // Таблица из Excel: клетки через табуляцию, строки — переводом строки;
  // клетка с переводом строки внутри — в кавычках.
  function parseTSV(text) {
    const rows = [];
    let row = [], cell = "", q = false;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (q) {
        if (ch === '"') {
          if (text[i + 1] === '"') { cell += '"'; i++; } else q = false;
        } else cell += ch;
      } else if (ch === '"' && cell === "") q = true;
      else if (ch === "\t") { row.push(cell); cell = ""; }
      else if (ch === "\n" || ch === "\r") {
        if (ch === "\r" && text[i + 1] === "\n") i++;
        row.push(cell); rows.push(row); row = []; cell = "";
      } else cell += ch;
    }
    if (cell !== "" || row.length) { row.push(cell); rows.push(row); }
    const out = rows.map((r) => r.map((c) => c.replace(/\s+/g, " ").trim()));
    while (out.length && out[out.length - 1].every((c) => !c)) out.pop();
    return out;
  }
  /* Строки без заголовка — узнаём колонки по содержимому: единицы
     («шт», «м3», «компл.»), числа, номера с точками («1.19») и самый
     длинный текст — наименование; марка, код и завод — следом за ним, как
     в спецификации по ГОСТ. Не узнали наименование и хоть что-то из
     единицы или количества — раскладываем от клетки, куда вставили. */
  const AR_UNIT = /^(шт|штук|м|пм|п\.?\s?м|м2|м²|кв\.?\s?м|м3|м³|куб\.?\s?м|км|кг|т|тн|л|компл|комплект|к-т|кмп|уп|упак|пар|пара|рулон|лист|набор|точк|ед|услуга|усл|чел\.?-?ч|маш\.?-?ч)\.?$/i;
  const AR_NUM = /^\d[\d\s\u00a0]*([.,]\d+)?$/;
  const AR_NO = /^\d+(\.\d+)*[а-яa-z]?\.?$/i;
  function arColumns(data) {
    const n = Math.max(0, ...data.map((r) => r.length));
    const cols = [];
    for (let j = 0; j < n; j++) {
      const vals = data.map((r) => (r[j] || "").trim()).filter(Boolean);
      const share = (rx) => (vals.length ? vals.filter((v) => rx.test(v)).length / vals.length : 0);
      cols.push({ j, filled: vals.length, unit: share(AR_UNIT), num: share(AR_NUM), no: share(AR_NO),
        dots: vals.some((v) => /\d\.\d/.test(v)),
        len: vals.length ? vals.reduce((a, v) => a + v.length, 0) / vals.length : 0 });
    }
    const map = new Array(n).fill(null);
    const free = () => cols.filter((c) => !map[c.j] && c.filled);
    const unit = free().filter((c) => c.unit >= 0.6).sort((x, y) => y.unit - x.unit)[0];
    if (unit) map[unit.j] = "unit";
    const nums = free().filter((c) => c.num >= 0.8);
    // Номер — первая колонка из «1.19», «2.1» (или из чисел, когда за ней
    // есть ещё колонка чисел — количество).
    const c0 = cols[0];
    if (c0 && !map[0] && c0.no >= 0.8 && (c0.dots || nums.length > 1)) map[0] = "pos_no";
    const qty = (unit && free().find((c) => c.j === unit.j + 1 && c.num >= 0.8))
      || free().filter((c) => c.num >= 0.8).pop();
    if (qty) map[qty.j] = "qty";
    // Числа правее количества — цены: материал, потом работа, как в расчёте.
    if (qty) {
      free().filter((c) => c.j > qty.j && c.num >= 0.8).slice(0, 2)
        .forEach((c, i) => { map[c.j] = i ? "work_price" : "sell_price"; });
    }
    const name = free().filter((c) => c.num < 0.5).sort((x, y) => y.len - x.len)[0];
    if (!name || !(unit || qty)) return null;
    map[name.j] = "name";
    ["brand", "code", "maker"].forEach((k, i) => {
      const j = name.j + 1 + i;
      if (j < n && !map[j]) map[j] = k;
    });
    return map;
  }
  const arGuess = (r) => (r.name && !r.unit && !r.qty && !r.brand && !r.code ? "section"
    : AR_WORK.test(r.name || "") ? "work" : "item");
  const arNext = (no) => {
    const m = String(no || "").match(/^(.*?)(\d+)(\D*)$/);
    return m ? m[1] + (Number(m[2]) + 1) + m[3] : "";
  };

  function addRowsForm(secId, afterId) {
    const sections = POS.rows.filter((p) => p.kind === "section");
    const afterRow = afterId ? POS.rows.find((p) => p.id === afterId) : null;
    // Куда вставить: в конец, в конец раздела или сразу под строкой
    // («row:<id>»; под комплектом — после его частей). После какой строки
    // — и какой номер был последним над местом вставки.
    const target = (val) => {
      if (!val) {
        const last = [...POS.rows].reverse().find((p) => p.kind !== "section" && p.pos_no);
        return { after: "", base: last ? last.pos_no : "" };
      }
      const row = val.startsWith("row:") ? val.slice(4) : "";
      const at = POS.rows.findIndex((p) => p.id === (row || val));
      let end = at;
      if (row) {
        while (end + 1 < POS.rows.length && POS.rows[end + 1].kind === "part") end++;
        const last = POS.rows.slice(0, end + 1).reverse().find((p) => p.kind !== "section" && p.pos_no);
        return { after: POS.rows[end].id, base: last ? last.pos_no : "" };
      }
      while (end + 1 < POS.rows.length && POS.rows[end + 1].kind !== "section") end++;
      const last = POS.rows.slice(0, end + 1).reverse().find((p) => p.kind !== "section" && p.pos_no);
      return { after: POS.rows[end].id, base: last ? last.pos_no : "" };
    };
    const blank = () => ({ pos_no: "", name: "", brand: "", code: "", maker: "", unit: "", qty: "",
      sell_price: "", work_price: "", kind: "item", autoNo: true, kindSet: false });
    const model = [blank(), blank(), blank(), blank(), blank()];
    const box = document.createElement("div");
    box.className = "pf-modal";
    box.innerHTML = `
      <div class="pf-crop add-rows" role="dialog" aria-label="Добавить строки">
        <div class="ar-top">
          <h3>Добавить строки</h3>
          <button type="button" class="ar-x" aria-label="Закрыть" title="Закрыть">×</button>
        </div>
        <div class="ar-bar">
          <label class="ar-where"><span>Куда</span><select id="arWhere">
            ${afterRow ? `<option value="row:${esc(afterRow.id)}" selected>Под строкой ${
              esc(afterRow.pos_no || "")} «${esc(afterRow.name.length > 50 ? afterRow.name.slice(0, 50) + "…"
              : afterRow.name)}»</option>` : ""}
            <option value="">В конец расчёта</option>
            ${sections.map((p) => `<option value="${esc(p.id)}"${p.id === secId ? " selected" : ""}>В раздел «${
              esc(p.name.length > 60 ? p.name.slice(0, 60) + "…" : p.name)}»</option>`).join("")}
          </select></label>
          <span class="ar-tip"><b>Ctrl+V</b> — вставить таблицу из Excel целиком. Строка с одним
            названием — раздел.</span>
        </div>
        <div class="ar-grid-w">
          <table class="ar-grid">
            <colgroup><col style="width:30px">${AR_COLS.map((c) => `<col${c[2] ? ` style="width:${c[2]}px"` : ""}>`).join("")
              }<col style="width:96px"><col style="width:30px"></colgroup>
            <thead><tr><th></th>${AR_COLS.map((c) => `<th>${c[1]}</th>`).join("")}<th
              title="Позиция — материал и работа. Работа — без материала (ПНР, земляные работы): подбор материалов её не ищет. Раздел — заголовок">Вид</th><th></th></tr></thead>
            <tbody></tbody>
          </table>
        </div>
        <button type="button" class="ar-more">${ICO.plus}ещё строка</button>
        <div class="pf-note bad" id="arErr" hidden></div>
        <div class="pf-modal-foot">
          <span class="grow"></span>
          <button type="button" class="btn ghost" id="arNo">Отмена</button>
          <button type="button" class="btn" id="arOk">Добавить</button>
        </div>
      </div>`;
    document.body.appendChild(box);
    const tbody = $s("tbody", box);
    const where = $s("#arWhere", box);
    const filled = () => model.filter((r) => (r.name || "").trim());

    // Номера — по порядку от последнего номера над местом вставки. Свой
    // номер (вписанный или вставленный) не трогаем, но счёт идёт от него.
    // Следующий номер уже занят (вставляем в середину: за 1.11 в проекте
    // идёт 1.12) — подномера 1.11.1, 1.11.2: номера проекта не повторяются.
    const taken = new Set(POS.rows.map((p) => p.pos_no).filter(Boolean));
    const renumber = () => {
      let base = target(where.value).base;
      let sub = !!base && taken.has(arNext(base));
      model.forEach((r) => {
        if (r.kind === "section" || !(r.name || "").trim()) {
          if (r.autoNo) r.pos_no = "";
          return;
        }
        if (r.autoNo) {
          let no = !base ? "" : sub ? base + ".1" : arNext(base);
          while (no && taken.has(no)) no = arNext(no);
          r.pos_no = no;
          sub = false;
        }
        if (r.pos_no) base = r.pos_no;
      });
      tbody.querySelectorAll('input[data-c="pos_no"]').forEach((inp) => {
        const r = model[Number(inp.dataset.r)];
        if (r && r.autoNo && document.activeElement !== inp) inp.value = r.pos_no;
        inp.classList.toggle("auto", !!(r && r.autoNo));
      });
      const n = filled().length;
      $s("#arOk", box).textContent = n ? `Добавить ${n} ${plural(n, "строку", "строки", "строк")}` : "Добавить";
      $s("#arOk", box).disabled = !n;
    };
    const paintKind = (tr, r) => {
      const b = tr.querySelector("[data-kind]");
      b.textContent = AR_KIND_NAME[r.kind];
      b.className = "ar-kind k-" + r.kind;
      tr.classList.toggle("is-sec", r.kind === "section");
    };
    const rowHtml = (r, i) => `<tr data-r="${i}"${r.kind === "section" ? ' class="is-sec"' : ""}>
        <td class="ar-n">${i + 1}</td>
        ${AR_KEYS.map((k) => `<td><input data-c="${k}" data-r="${i}" value="${esc(r[k])}"${
          AR_PRICE.includes(k) ? ' inputmode="decimal"' : ""}${k === "pos_no" && r.autoNo ? ' class="auto"' : ""}></td>`).join("")}
        <td><button type="button" class="ar-kind k-${r.kind}" data-kind
          title="Щелчок — сменить: позиция, работа, раздел">${AR_KIND_NAME[r.kind]}</button></td>
        <td><button type="button" class="ar-del" data-del title="Убрать строку">×</button></td>
      </tr>`;
    const paint = () => {
      tbody.innerHTML = model.map(rowHtml).join("");
      renumber();
    };
    paint();

    tbody.addEventListener("input", (e) => {
      const inp = e.target.closest("input[data-c]");
      if (!inp) return;
      const r = model[Number(inp.dataset.r)];
      r[inp.dataset.c] = inp.value;
      if (inp.dataset.c === "pos_no") r.autoNo = !inp.value.trim();
      if (!r.kindSet) {
        r.kind = arGuess(r);
        paintKind(inp.closest("tr"), r);
      }
      renumber();
    });
    tbody.addEventListener("click", (e) => {
      const k = e.target.closest("[data-kind]");
      const d = e.target.closest("[data-del]");
      if (!k && !d) return;
      const i = Number(e.target.closest("tr").dataset.r);
      if (k) {
        const r = model[i];
        r.kind = AR_KINDS[(AR_KINDS.indexOf(r.kind) + 1) % AR_KINDS.length];
        r.kindSet = true;
        paintKind(k.closest("tr"), r);
        renumber();
      } else {
        model.splice(i, 1);
        if (!model.length) model.push(blank());
        paint();
      }
    });
    // Enter — на ту же клетку строкой ниже: так вписывают столбиком.
    tbody.addEventListener("keydown", (e) => {
      const inp = e.target.closest("input[data-c]");
      if (!inp || e.key !== "Enter") return;
      e.preventDefault();
      const i = Number(inp.dataset.r) + 1;
      if (i >= model.length) { model.push(blank()); paint(); }
      const next = tbody.querySelector(`input[data-r="${i}"][data-c="${inp.dataset.c}"]`);
      if (next) next.focus();
    });
    // Вставка из Excel: блок раскладывается вниз и вправо от клетки, а
    // строку заголовков окно узнаёт и раскладывает по ней.
    tbody.addEventListener("paste", (e) => {
      const inp = e.target.closest("input[data-c]");
      if (!inp) return;
      const text = (e.clipboardData || window.clipboardData).getData("text") || "";
      if (!/[\t\n]/.test(text.replace(/\s+$/, ""))) return;     // одна клетка — как обычно
      e.preventDefault();
      let data = parseTSV(text);
      let map = null, how = "";
      const head = (data[0] || []).map((h) => AR_KEYS.find((k) => AR_HEAD[k].test(h)) || null);
      if (head.filter(Boolean).length >= 2) {
        map = head; data = data.slice(1); how = " — колонки разложены по заголовкам";
      } else if ((data[0] || []).length > 1) {
        map = arColumns(data);
        if (map) how = " — колонки узнаны по содержимому";
      }
      const r0 = Number(inp.dataset.r), c0 = AR_KEYS.indexOf(inp.dataset.c);
      data.forEach((cells, j) => {
        const r = r0 + j;
        while (model.length <= r) model.push(blank());
        const row = model[r];
        cells.forEach((v, k) => {
          const key = map ? map[k] : AR_KEYS[c0 + k];
          if (!key) return;
          row[key] = v;
          if (key === "pos_no") row.autoNo = !v;
        });
        if (!row.kindSet) row.kind = arGuess(row);
      });
      paint();
      $s("#arErr", box).hidden = true;
      note(`Вставлено ${data.length} ${plural(data.length, "строка", "строки", "строк")}${how
        }. Проверьте колонки, вид строк и номера`);
    });
    $s(".ar-more", box).addEventListener("click", () => {
      model.push(blank());
      paint();
      const last = tbody.querySelector(`input[data-r="${model.length - 1}"][data-c="name"]`);
      if (last) last.focus();
    });
    where.addEventListener("change", renumber);

    const close = () => { document.removeEventListener("keydown", onKey); box.remove(); };
    const onKey = (e) => { if (e.key === "Escape") close(); };
    document.addEventListener("keydown", onKey);
    box.addEventListener("click", (e) => { if (e.target === box) close(); });
    $s("#arNo", box).addEventListener("click", close);
    $s(".ar-x", box).addEventListener("click", close);
    $s("#arOk", box).addEventListener("click", async () => {
      const btn = $s("#arOk", box);
      const rows = filled().map((r) => ({ pos_no: r.pos_no, name: r.name, brand: r.brand,
        code: r.code, maker: r.maker, unit: r.unit, qty: r.qty, kind: r.kind,
        sell_price: r.sell_price, work_price: r.work_price }));
      if (!rows.length || btn.disabled) return;
      btn.disabled = true;
      try {
        const res = await AUTH.api("POST", "/documents/" + encodeURIComponent(openDoc.id) + "/rows",
                                   { after: target(where.value).after, rows });
        close();
        await openPositions(openDoc.id);
        flashRows(res.ids || []);
        note(`Добавлено ${res.added} ${plural(res.added, "строка", "строки", "строк")}. Цен нет — «Подтянуть`
          + " материалы» и «Подтянуть работы», вписать в строке или вставить столбцом из Excel;"
          + " правка и удаление — прямо в таблице");
      } catch (err) {
        btn.disabled = false;
        const m = $s("#arErr", box);
        m.textContent = err.message;
        m.hidden = false;
      }
    });
    const first = tbody.querySelector('input[data-c="name"]');
    if (first) first.focus();
  }

  // Добавленные строки на миг подсвечены — чтобы было видно, куда встали.
  function flashRows(ids) {
    const rows = ids.map((id) => $s(`.calc-tbl tr[data-pos="${id}"]`, HOST())).filter(Boolean);
    if (!rows.length) return;
    rows[0].scrollIntoView({ block: "center" });
    rows.forEach((tr) => tr.classList.add("flash"));
    setTimeout(() => rows.forEach((tr) => tr.classList.remove("flash")), 2400);
  }

  /* «Не учитывать» (заказчик, 05.10.2026: «есть моменты, когда выполняем не
     весь объём работ»). Галочка — слева у номера: строка остаётся в
     спецификации, но в суммы, калькуляцию и подбор не идёт. У раздела —
     весь раздел, у комплекта — вместе с его частями. Отмеченная строка
     бледнеет, её сумма зачёркнута: видно, от чего отказались. */
  function skipBox(p, sec) {
    if (!can()) return "";
    const on = sec ? sec.all : !!p.skip;
    const part = !!(sec && sec.some && !sec.all);
    return `<label class="skip-ck" title="${sec ? (on ? "Вернуть раздел в расчёт"
      : "Не учитывать весь раздел: строки останутся, но в суммы, калькуляцию и подбор не пойдут")
      : on ? "Вернуть строку в расчёт"
      : "Не учитывать: строка останется в спецификации, но в суммы, калькуляцию и подбор не пойдёт"}"
      ><input type="checkbox" data-skip${on ? " checked" : ""}${part ? " data-part" : ""}></label>`;
  }
  const skipTip = (p) => `Не учитывается${p.skip_sum ? ` — без этой строки расчёт меньше на ${
    money(p.skip_sum)}` : ""}`;
  const skipTot = (p) => (p.skip_sum ? `<s>${money(p.skip_sum)}</s>` : "не учит.");

  // Раздел → сколько строк под ним и сколько из них «не учитывать».
  function sectionSkips() {
    const out = {};
    let sec = null;
    for (const p of POS.rows) {
      if (p.kind === "section") { sec = out[p.id] = { n: 0, k: 0 }; continue; }
      if (!sec) continue;
      sec.n += 1;
      if (p.skip) sec.k += 1;
    }
    for (const id in out) {
      out[id].all = out[id].n > 0 && out[id].k === out[id].n;
      out[id].some = out[id].k > 0;
    }
    return out;
  }

  /* Отметить строки. У раздела — все строки под ним, у позиции с частями
     комплекта — и части: без комплекта их не покупают. Суммы и итоги
     считает сервер — перечитываем расчёт. */
  /* Все разделы и позиции разом (заказчик, 05.10.2026: «добавь кнопку
     выбрать всё»). Удобно, когда делают малую часть объёма: отметить всё
     и снять галочку у того, что делают. */
  async function toggleSkipAll(inp) {
    const ids = POS.rows.filter((p) => p.kind !== "section").map((p) => p.id);
    if (!ids.length) return;
    const skip = inp.checked;
    inp.disabled = true;
    try {
      await AUTH.api("POST", "/documents/" + encodeURIComponent(openDoc.id) + "/skip", { ids, skip });
      await openPositions(openDoc.id);
      note(skip ? `Не учитываются все ${ids.length} ${plural(ids.length, "строка", "строки", "строк")}.`
        + " Снимите галочку у тех, что делаете, — они вернутся в расчёт"
        : "Все строки снова в расчёте");
    } catch (e) {
      inp.checked = !skip;
      inp.disabled = false;
      note("Не вышло: " + e.message, true);
    }
  }

  async function toggleSkip(inp) {
    const tr = inp.closest("tr");
    const at = POS.rows.findIndex((x) => x.id === tr.dataset.pos);
    const p = POS.rows[at];
    if (!p) return;
    const ids = [];
    if (p.kind === "section") {
      for (let i = at + 1; i < POS.rows.length && POS.rows[i].kind !== "section"; i++) {
        ids.push(POS.rows[i].id);
      }
    } else {
      ids.push(p.id);
      if (p.kind !== "part") {
        for (let i = at + 1; i < POS.rows.length && POS.rows[i].kind === "part"; i++) {
          ids.push(POS.rows[i].id);
        }
      }
    }
    if (!ids.length) { inp.checked = false; return; }
    const skip = inp.checked;
    inp.disabled = true;
    try {
      await AUTH.api("POST", "/documents/" + encodeURIComponent(openDoc.id) + "/skip", { ids, skip });
      await openPositions(openDoc.id);
      const n = ids.length;
      note(skip
        ? `${n === 1 ? "Строка не учитывается: в суммы, калькуляцию и подбор не идёт"
          : `Не учитываются ${n} ${plural(n, "строка", "строки", "строк")}: в суммы, калькуляцию и подбор не идут`
          }. Вернуть — снять галочку`
        : `${n === 1 ? "Строка снова" : `${n} ${plural(n, "строка", "строки", "строк")} снова`} в расчёте`);
    } catch (e) {
      inp.checked = !skip;
      inp.disabled = false;
      note("Не вышло: " + e.message, true);
    }
  }

  /* Цена материала у одного поставщика. Их три, и в счёт идёт та, что
     выбрали: по ней считаются «Материалы всего» и итог. Выбор — щелчок
     по ячейке; отмеченная видна сразу, иначе из трёх цен непонятно, чья
     попала в сумму.

     Цену можно и вписать руками: заказчик просил ручную правку, а
     каталог знает не всё — половина позиций в нём просто не числится. */
  /* Цена, которую ставил прежний «Свой прайс», — ни в одной колонке: своей
     цены с 21.09.2026 нет, и до ближайшего подбора такая строка не должна
     рамкой притворяться ценой первого поставщика. */
  const OWN_GONE = "Свой прайс";
  /* В какой колонке стоит поле ввода — то есть чья цена пошла в счёт.
     Обычно это выбранный поставщик. Но цена бывает и без него: строку
     заполнили до появления колонок или поставщика переименовали. Тогда
     поле отдаём первой колонке — иначе число уходит в «Материалы всего»,
     а откуда оно взялось, не видно нигде. */
  function chosenSrc(p) {
    const hit = SRC.find((s) => s.title === p.supplier);
    if (hit) return hit.id;
    if (p.supplier === OWN_GONE) return "";
    return p.buy_price ? (SRC[0] || {}).id : "";
  }

  /* Блок «Минимальная цена»: лучшая цена поставщиков за единицу позиции
     и кто её даёт. Колонок поставщиков становится всё больше, и листать
     их вбок ради ответа «сколько и у кого» незачем: блок стоит сразу за
     количеством, а при прокрутке догоняет наименование и примерзает
     рядом с ним. Правило то же, что у подбора (best_offer на сервере),
     поэтому по умолчанию в «Материал» встаёт ровно эта цена. Выбрали
     руками другую — блок всё равно называет минимум, а «≠» и подсказка
     говорят, что в расчёте стоит не самая дешёвая. */
  function bestCells(p) {
    // Цену выбрали руками — блок показывает её: это то, что идёт в расчёт,
    // а минимум уходит в подсказку. Иначе блок спорил бы с «Материалом».
    const ch = p.choice && p.buy_price != null ? (p.offers || {})[p.choice] : null;
    if (ch) {
      const s = SRC.find((x) => x.id === p.choice) || {};
      const who = (p.choice === "invoice" && ch.name)
        || (p.choice === "obj" && (ch.brand || ch.name)) || s.name || p.supplier;
      const тот_же = p.best && Math.abs(p.best.price - p.buy_price) < 0.005;
      const свой = p.choice === "obj";
      const tip = [`${who}: ${money(p.buy_price)} за ${p.unit || "ед."} — ${
          свой ? "цена объекта, выбрана или вписана руками" : "выбрано руками"}`,
        p.best && !тот_же ? `Минимальная: ${money(p.best.price)} — ${p.best.who}` : "",
        свой && p.best && p.best.market ? `У поставщиков: ${money(p.best.market.price)} — ${
          p.best.market.who}` : ""]
        .filter(Boolean).join("\n");
      return `<td class="num pos-best${тот_же ? "" : " chosen"}${свой ? " own" : ""}" title="${esc(tip)}">${
                  свой ? `<i class="q pin">${ICO.pin}</i>` : тот_же ? "" : '<i class="q">✎</i>'}${
                  money(p.buy_price)}</td>
                <td class="pos-who${свой ? " own" : ""}" title="${esc(tip)}">${esc(who)}</td>`;
    }
    const b = p.best;
    if (!b) {
      return `<td class="num pos-best none" title="Поставщики цену не назвали">—</td>
                <td class="pos-who none"></td>`;
    }
    const o = (p.offers || {})[b.source] || {};
    const другая = p.buy_price != null && Math.abs(p.buy_price - b.price) >= 0.005;
    const tip = [`${b.who}: ${money(b.price)} за ${p.unit || "ед."}`,
      b.own ? "Цена объекта — идёт в расчёт раньше минимальной у поставщиков" : "",
      b.own && b.market ? `У поставщиков минимальная: ${money(b.market.price)} — ${b.market.who}` : "",
      b.source === "invoice" && o.brand ? o.brand : "",
      b.maybe ? "Совпадение под вопросом — проверьте" : "",
      другая ? `В расчёте другая цена: ${money(p.buy_price)}${
        p.supplier ? " — " + p.supplier : ""}` : ""].filter(Boolean).join("\n");
    return `<td class="num pos-best${другая ? " other" : ""}${b.own ? " own" : ""}" title="${esc(tip)}">${
                  другая ? '<i class="q">≠</i>' : b.own ? `<i class="q pin">${ICO.pin}</i>` : ""}${
                  money(b.price)}${b.maybe ? '<i class="q">?</i>' : ""}</td>
                <td class="pos-who${b.own ? " own" : ""}" title="${esc(tip)}">${esc(b.who)}</td>`;
  }

  /* Строка состава щита, у которого цена объекта: цены у неё нет и в сумму
     она не идёт — щит дочка считает целиком, выключатели и счётчики внутри
     уже в его цене. Колонки цен закрыты одной пометкой. */
  function setCells(p) {
    const tip = `Входит в ${p.in_set}: у щита цена объекта, в ней уже весь состав. `
      + "Отдельно строка не считается, иначе щит попал бы в сумму дважды";
    return `<td class="set-note" colspan="${SRC_SHOWN().length + 6}" title="${esc(tip)}">входит в ${
        esc(p.in_set)} — цена у щита</td>`;
  }

  /* Цена одного поставщика в строке расчёта.

     Выбранная — та, что идёт в «Материалы за ед.», — обведена рамкой: из
     трёх-пяти цен в строке она должна читаться сразу. Её же можно
     поправить в поле. Остальные — щелчком выбираются, и выбор
     запоминается: подбор держит этого поставщика и берёт его свежую цену.
     Пустая ячейка пуста; «+» при наведении — вписать цену этого
     поставщика руками, она ляжет в его колонку прайса материалов. У
     «Счетов» вписать нельзя: это самая низкая цена из колонок поставщиков,
     и правится она там. */
  const CHOSEN_TIP = "Выбрана эта цена — она идёт в «Материалы за ед.». Поправить — впишите в поле";
  /* Цена объекта — с НДС, как в договоре (Андрей, 21.10.2026). Хранится
     без НДС, как все цены поставщиков, а в своей колонке показывается и
     вписывается с НДС: сервер делит вписанное на 1+НДС, и в «с наценкой и
     НДС» налог ложится один раз. */
  const gross = (p, v) => (v == null || v === "" ? v
    : Math.round(Number(v) * (1 + (Number(p.vat) || 0) / 100) * 100) / 100);
  function chosenVal(p, s) {
    return s.id === "invoice" ? `<span class="mat-val">${money(p.buy_price)}</span>`
      : s.own ? cell(p, "buy_price", gross(p, p.buy_price)) : cell(p, "buy_price");
  }

  function matCell(p, s) {
    const o = (p.offers || {})[s.id];
    const chosen = chosenSrc(p) === s.id;
    const ext = extremes(p);
    const tone = (v) => (!ext || v == null) ? ""
      : Number(v) === ext.lo ? " lo" : Number(v) === ext.hi ? " hi" : "";
    // Содержимое — одной строкой во вложенном блоке: поле, метка и
    // кнопки не переносятся под поле и не раздувают строку по высоте.
    if (!o || !o.price) {
      if (chosen) {
        return `<td class="num mat on${s.own ? " own" : ""}${tone(p.buy_price)}" data-src="${esc(s.id)}"
          title="${CHOSEN_TIP}"><div class="cell-row">${chosenVal(p, s)}${autoBtn(p)}${
          findBtn(p, s)}</div></td>`;
      }
      const можно = can() && s.id !== "invoice";
      const пусто = s.id === "invoice"
        ? "Цены из счетов заводятся в прайсе материалов, в колонках поставщиков"
        : !s.own ? ""
        : o && o.state === "off"
        ? "Цену из файла объекта для этой строки отклонили. ⌕ — выбрать строку в ценах объекта, + — вписать цену"
        : "В ценах объекта строка не нашлась. ⌕ — найти в загруженных файлах, + — вписать цену: она останется только в этом объекте";
      return `<td class="num mat${s.own ? " own" : ""}" data-src="${esc(s.id)}"${
          пусто ? ` title="${esc(пусто)}"` : ""}
        ><div class="cell-row">${можно ? `<button type="button" class="mat-add" data-type="${
          esc(s.id)}" title="${s.own ? "Вписать цену объекта руками, с НДС, как в договоре — останется только в этом объекте"
            : `Вписать цену «${esc(s.name)}» руками — запомнится в прайсе материалов`}"
          >+</button>` : ""}${findBtn(p, s)}</div></td>`;
    }
    const ед = clash(p, o);
    // Показываем и переносим цену за единицу позиции, а не за единицу
    // каталога: гофротруба там за упаковку 25 метров, здесь — за метр.
    const shown = s.own ? gross(p, o.per_unit ?? o.price) : o.per_unit ?? o.price;
    const пересчёт = o.per_unit != null && o.per_unit !== o.price;
    return `<td class="num mat${s.own ? " own" : ""}${chosen ? " on" : ""}${
        o.state === "maybe" ? " doubt" : ""}${o.state === "hand" ? " hand" : ""}${
        ед ? " clash" : ""}${tone(chosen ? p.buy_price : shown)}"
      data-src="${esc(s.id)}"
      title="${chosen ? CHOSEN_TIP + "\n" : "Щелчок — выбрать эту цену\n"}${esc(o.name)}${o.brand ? " · " + esc(o.brand) : ""}${
        o.code ? " · код " + esc(o.code) : ""}${o.unit ? " · цена за " + esc(o.unit) : ""}${
        пересчёт ? ` (${money(s.own ? gross(p, o.price) : o.price)}) → за ${esc(p.unit || "ед.")}` : ""}${
        o.state === "maybe" ? "\nСовпадение под вопросом — проверьте" : ""}${
        o.state === "hand" ? "\nВыбрано руками — подбор не трогает" : ""}${
        ед && o.loose ? "\nПозиция в комплектах, цена за штуку, а товар найден по словам —"
          + " само не встало. Щёлкните, если это тот же товар: цена встанет за комплект"
        : ед ? "\nЕдиница цены не сходится с единицей позиции — не подставили"
           : ""}"
      ><div class="cell-row">${chosen ? chosenVal(p, s) + doubtMark(p.buy_price, o) + autoBtn(p)
        : `<button type="button" class="mat-pick"
        data-take="${esc(s.id)}">${money(shown)}${
          ед ? "<i class=q>ед.</i>" : o.state === "maybe"
          ? "<i class=q>?</i>" : ""}</button>`}${findBtn(p, s)}</div></td>`;
  }

  /* Ширины колонок расчёта по умолчанию. Спецификация — семь колонок, у
     названия ширины нет: ему отдаётся остаток. Колонка поставщика без
     API уже — в ней только прочерк. Ключ колонки — то, под чем её ширина
     запоминается, когда колонку раздвинули руками. */
  const CALC_COLS = {
    spec: [["no-ck", 72], ["name", 0], ["brand", 74], ["code", 65], ["maker", 74],
           ["unit", 50], ["qty", 54]],
    // Суммы — под миллионы («1 109 965,85»): уже они наезжали на соседнюю колонку.
    calc: [["mat", 86], ["work", 83], ["unit_total", 86], ["sum_buy", 96],
           ["sum_work", 90], ["sum_total", 96]],
  };
  const NAME_MIN = 198;
  const srcWidth = (s) => (s.live ? 94 : 68);
  const calcKeys = () => [...CALC_COLS.spec.map((c) => c[0]),
    ...SRC_SHOWN().map((s) => "src:" + s.id), ...CALC_COLS.calc.map((c) => c[0])];
  const calcDefault = (key) => {
    if (key.startsWith("src:")) {
      const s = SRC.find((x) => "src:" + x.id === key);
      return s ? srcWidth(s) : 76;
    }
    const c = [...CALC_COLS.spec, ...CALC_COLS.calc].find((x) => x[0] === key);
    return c ? c[1] : 0;
  };
  const calcMinWidth = () => calcKeys().reduce((a, k) => a + (calcDefault(k) || NAME_MIN), 0);

  /* Ширины колонок и перетаскивание таблицы — общие с прайсами (grid.js):
     тянут границу подписи — колонка меняет ширину, остальные едут следом;
     зажали кнопку на ячейке — таблица двигается, как рукой. */
  const CALCW = GRID.widths("karkas.calc.colw.v1",
    () => calcKeys().map((k) => [k, calcDefault(k)]));
  const calcColgroup = () => CALCW.colgroup();
  const calcTableStyle = () => CALCW.style(calcMinWidth());
  // Граница для захвата — у подписи колонки во втором ярусе шапки.
  const grip = () => CALCW.grip();

  function wirePan(host) {
    GRID.pan($s(".calc-body", host));
  }

  /* Шапка расчёта — одной полосой, пока в неё всё помещается; иначе числа
     уходят второй строкой. Меряем саму шапку, а не экран: кнопок и
     столбцов бывает разное число, и порог по ширине экрана промахивался —
     имя документа сжималось в ноль. */
  let headRO = null;
  function fitCalcHead(host) {
    if (headRO) { headRO.disconnect(); headRO = null; }
    const h = $s(".calc-head", host);
    if (!h) return;
    const fit = () => {
      h.classList.remove("two");
      const name = h.querySelector(".pg-h1");
      if (h.scrollWidth > h.clientWidth + 1
          || (name && name.getBoundingClientRect().width < 220)) h.classList.add("two");
    };
    fit();
    if (typeof ResizeObserver !== "function") return;
    let w = h.clientWidth;
    headRO = new ResizeObserver(() => {
      if (!h.isConnected || h.clientWidth === w) return;
      w = h.clientWidth;
      fit();
    });
    headRO.observe(h);
  }

  function wireColResize(host) {
    const table = $s("table.calc-tbl", host);
    if (!table || !table.tHead || table.tHead.rows.length < 2) return;
    CALCW.wire(table, table.tHead.rows[1], render);
    // Номер и наименование не уезжают при прокрутке вбок, а блок
    // «Минимальная цена» догоняет их и встаёт рядом.
    GRID.freeze(table, 2, ".pos-best, .pos-who");
  }

  /* Крайние цены поставщиков в строке: минимальная зелёная, максимальная
     красная — только когда цен две и больше и они разные. Свой прайс не в
     счёт: это своя цена, а не предложение; цены, у которых не сошлась
     единица, — тоже: сравнивать их не с чем. */
  function extremes(p) {
    const vals = [];
    for (const s of SRC) {
      // Цена объекта — указание заказчика, а не предложение поставщика:
      // с ними её не красим.
      if (!s.live || s.own) continue;
      const o = (p.offers || {})[s.id];
      if (!o || !o.price || clash(p, o)) continue;
      vals.push(Number(o.per_unit ?? o.price));
    }
    if (vals.length < 2) return null;
    const lo = Math.min(...vals), hi = Math.max(...vals);
    return lo === hi ? null : { lo, hi };
  }

  /* Цена в «Материале» — решение человека (выбрано щелчком, вписано
     руками), и подбор её не трогает. Кнопка возвращает её правилу:
     минимальная из уверенных находок. */
  function autoBtn(p) {
    if (!p.manual || !can()) return "";
    return `<button type="button" class="mat-auto" data-auto
      title="${p.choice ? "Цену выбрали руками — подбор держит этого поставщика. " : "Выбрано или вписано руками. "}Вернуть правило: минимальная из уверенных цен">↺</button>`;
  }

  /* Кнопка поиска по каталогу поставщика. Подбор промахнулся или не
     нашёл — сметчик ищет сам и выбирает щелчком; выбор запоминается у
     материала, и следующий объект встаёт сам. До 22.10.2026 была только у
     РС24; правка № 14 — у каждого каталога: РС24, ЭТМ, Элком. */
  const CATALOG_SRC = ["rs24", "etm", "elcom"];
  /* Поиск расценки у клетки работы: подбор промахнулся или прайс написан
     другими словами. Кнопка у каждой строки — прайс работ свой, живой, и
     искать в нём можно всегда. */
  function findWorkBtn() {
    if (!can()) return "";
    return `<button type="button" class="mat-find" data-findwork
      title="Найти расценку в прайсе работ">⌕</button>`;
  }

  function findBtn(p, s) {
    if (!can()) return "";
    if (s.own) {
      return spReady() ? `<button type="button" class="mat-find" data-find-obj
        title="Найти в ценах объекта и выбрать строку руками">⌕</button>` : "";
    }
    if (!CATALOG_SRC.includes(s.id)) return "";
    return `<button type="button" class="mat-find" data-find="${esc(s.id)}"
      title="Найти в каталоге «${esc(s.name)}» и выбрать товар руками">⌕</button>`;
  }

  /* Единица цены не сходится с единицей позиции.

     Лоток стоит 13 291,65 за штуку, а в спецификации считается
     километрами: 0,07 км — это семьдесят метров. Перемножив напрямую,
     получаем цену квартиры за лоток. Решает сервер: он же переводит
     километры в метры и упаковки в метры, и per_unit у него либо есть,
     либо единицы не сходятся. Своя проверка — только для старых ответов
     без этого поля. */
  function clash(p, o) {
    if (!o || !o.price) return false;
    if (o.clash !== undefined) return !!o.clash;
    const norm = (u) => String(u || "").trim().toLowerCase().replace(/\.$/, "");
    const a = norm(p.unit), b = norm(o.unit);
    if (!b) return a === "км" || a === "т";
    if (!a || a === b) return false;
    return !["км|м", "м|км", "т|кг", "кг|т"].includes(a + "|" + b);
  }

  /* Вопрос у проставленной цены. Подбор заполняет клетки сам, и без
     метки не отличить проверенное от угаданного: «Шпилька М10» находит
     «Шпильку М8» — цена похожая, работа другая. Метка гаснет, как только
     цену поправили руками. */
  function doubtMark(value, o) {
    const same = o && (Number(value) === Number(o.per_unit ?? o.price));
    return o && o.state === "maybe" && same
      ? `<i class="q" title="Подобрано под вопросом: ${esc(o.name)}">?</i>` : "";
  }

  /* Расценка, подобранная в своём прайсе. Когда цена уже проставлена —
     показываем только вопрос у сомнительной: подбор идёт по
     типоразмерам материала, а не по названиям работ, и «Шпилька М10»
     находит «Шпильку М8». Пока клетка пуста, расценку предлагаем
     кнопкой: значит, подбор её не нашёл или цену стёрли руками. */
  function workHint(p) {
    const o = (p.offers || {}).work;
    if (!o || !o.price) return "";
    if (clash(p, o)) {
      return `<i class="q clash-mark" title="Цена за ${
        esc(o.unit || "неизвестную единицу")}, а позиция в ${
        esc(p.unit || "—")} — не подставили">ед.</i>`;
    }
    if (p.work_base) return doubtMark(p.work_base, o);
    return `<span class="offers"><button type="button"
      class="offer-chip${o.state === "maybe" ? " doubt" : ""}" data-takework
      title="${esc(o.name)}${o.brand ? " · раздел «" + esc(o.brand) + "»" : ""}${
        o.unit ? " · за " + esc(o.unit) : ""}${o.state === "maybe"
          ? "\nПодобрано под вопросом — сверьте с прайсом" : ""}"
      >${money(o.price)}${o.state === "maybe" ? "&nbsp;?" : ""}</button></span>`;
  }

  /* Наценка на работы у строки: в поле — расценка как вписана, в суммы
     идёт с наценкой. Метка «%» говорит, сколько это выходит. */
  function wmMark(p) {
    if (!p.work_markup || !p.work_base) return "";
    return `<i class="q wm-q" title="${esc(`С наценкой на работы ${numRu(p.work_markup)} % — ${
      money(p.work_price)} за ${p.unit || "ед."}: так идёт в суммы и калькуляцию`)}">%</i>`;
  }

  /* Считанные сервером числа в строке. Место одно: и правка цены, и
     выбор поставщика ведут сюда, а не переписывают ячейки каждый по
     своему разумению. */
  function paintRow(tr, p) {
    const c = tr.querySelectorAll(".pos-calc");
    // У строки состава щита клеток цен нет — там одна пометка.
    if (c.length < 4) return;
    c[0].textContent = sum0(p.unit_total);
    c[1].textContent = sum0(p.sum_buy);
    c[2].textContent = sum0(p.sum_work);
    if (p.skip) c[3].innerHTML = skipTot(p);
    else c[3].textContent = sum0(p.sum_total);
    // «Материалы за ед.» — поле, а не сумма: показываем формулу или
    // вписанное и помечаем, когда стоит вписанное.
    const run = tr.querySelector(".mat-run");
    if (run) {
      run.classList.toggle("manual", !p.mat_off && p.sell_price != null);
      run.classList.toggle("off", !!p.mat_off);
      const inp = run.querySelector("input");
      if (inp) {
        if (document.activeElement !== inp) inp.value = p.mat_off || noMat(p) ? "" : (p.mat_unit ?? "");
      } else {
        (run.querySelector(".cell-row") || run).textContent = sum0(p.mat_unit);
      }
    }
  }

  /* Ячейка правится на месте: открывать окно ради одной цифры — значит
     заполнять сотню строк сотней окон. shown — что показать вместо
     значения поля: у «Материалов за ед.» это результат формулы, а
     правится вписанная поверх неё цена. */
  const numRu = (v) => Number(v).toLocaleString("ru-RU", { maximumFractionDigits: 3 });

  function cell(p, field, shown) {
    const val = shown !== undefined ? shown : p[field];
    const num = field !== "supplier";
    return `<input class="pos-in${num ? " num" : ""}" data-f="${field}"
      value="${esc(val === null || val === undefined ? "" : val)}"
      ${field === "supplier" ? 'list="posSup"' : 'inputmode="decimal"'}>`;
  }

  /* Окно выгрузки. Спрашиваем ровно то, чего нет в базе: от какой
     организации считаем, что за работы и ставку НДС. Остальное —
     объект, заказчик, основание — берётся из карточки объекта, человек
     это уже вводил. */
  /* target — чью калькуляцию выгружаем: по умолчанию текущую открытого
     документа; для снимка — его строки, наценка на момент фиксации и
     без правки наценки. */
  async function calcForm(target) {
    const t = target || { url: "/api/documents/" + openDoc.id + "/calc",
                          totals: POS.totals, docId: openDoc.id };
    let orgs = [];
    try { orgs = await AUTH.api("GET", "/orgs"); } catch (e) { /* пустой список */ }
    const site = SITES_ROWS.find((x) => x.id === openId) || {};
    const box = document.createElement("div");
    box.className = "pf-modal";
    box.innerHTML = `
      <div class="pf-crop cnt-card" role="dialog" aria-label="Калькуляция">
        <h3>Сформировать калькуляцию</h3>
        <!-- Шапку собираем из карточки объекта, а не спрашиваем заново:
             заказчик, вид работ и основание там уже заведены, и вводить
             их при каждой выгрузке значит однажды написать по-разному. -->
        <div class="note" style="margin-bottom:11px">Шапка соберётся сама:
          объект, заказчик, вид работ и основание — из карточки объекта${
          site.work_kind ? "" : ". Вид работ там не заполнен — впишите его"
            + " в карточке, иначе строка в шапке останется пустой"}.
          Руками только номера: они у каждой выгрузки свои.</div>
        ${t.totals && t.totals.skipped ? `<div class="note" style="margin-bottom:11px">Не войдут ${
          t.totals.skipped} ${plural(t.totals.skipped, "строка", "строки", "строк")} «Не учитывать» —
          они вне объёма работ.</div>` : ""}
        <div class="cnt-grid">
          <div class="fld"><label for="cNum">Калькуляция №</label>
            <input id="cNum" placeholder="без номера"></div>
          <div class="fld"><label for="cAnn">Приложение №</label>
            <input id="cAnn" placeholder="если приложение к договору"></div>
        </div>
        <div class="fld"><label for="cOrg">От кого выставляем</label>
          <select id="cOrg">${orgs.filter((o) => o.active !== 0
              || o.id === site.org_id).map((o) => `<option value="${esc(o.id)}"${
            o.id === site.org_id ? " selected" : ""}>${
            esc(o.name)}${o.signer_name ? "" : " — подписант не заполнен"
            }</option>`).join("")}</select></div>
        <div class="fld"><label for="cKind">Вид работ</label>
          <input id="cKind" value="${esc(site.work_kind || "")}"
                 placeholder="на монтаж наружного электроснабжения 0,4 кВ">
        </div>
        <!-- Наценка здесь та же, что над таблицей: меняется у документа,
             и экран с файлом не расходятся. Ставка — из настроек расчёта,
             правится под эту выгрузку. -->
        <div class="cnt-grid">
          <div class="fld"><label for="cMk">Наценка на материал, %</label>
            <input id="cMk" value="${esc(t.totals.markup || 0)}" inputmode="decimal"${
              t.frozen ? " disabled" : ""} title="${t.frozen
              ? "Наценка на момент фиксации версии — не меняется"
              : "Меняет наценку документа, а не только выгрузку"}"></div>
          <div class="fld"><label for="cVat">НДС, %</label>
            <input id="cVat" value="${esc(t.totals.vat ?? 22)}" inputmode="decimal"></div>
        </div>
        <div class="cnt-grid">
          <div class="fld"><label for="cOnly">Позиции без цен</label>
            <select id="cOnly">
              <option value="">включать</option>
              <option value="1">не включать</option>
            </select></div>
          <!-- Факсимиле подписи — если оно есть у выбранной компании; встаёт
               в PDF на черту перед фамилией подписанта (02.10.2026). -->
          <div class="fld" id="cFaxW" hidden><label for="cFax">Подпись в PDF</label>
            <select id="cFax">
              <option value="1">с факсимиле</option>
              <option value="">без факсимиле</option>
            </select></div>
        </div>
        <div class="pf-note bad" id="cErr" hidden></div>
        <div class="pf-modal-foot">
          <span class="grow"></span>
          <button type="button" class="btn ghost" id="cNo">Отмена</button>
          <button type="button" class="btn ghost" id="cPdf">PDF</button>
          <button type="button" class="btn" id="cOk">Скачать Excel</button>
        </div>
      </div>`;
    document.body.appendChild(box);
    const close = () => { document.removeEventListener("keydown", onKey); box.remove(); };
    const onKey = (e) => { if (e.key === "Escape") close(); };
    document.addEventListener("keydown", onKey);
    box.addEventListener("click", (e) => { if (e.target === box) close(); });
    $s("#cNo", box).addEventListener("click", close);

    // «Подпись в PDF» — только у компании, для которой загружено факсимиле.
    const faxOf = () => {
      const o = orgs.find((x) => x.id === ($s("#cOrg", box) || {}).value);
      $s("#cFaxW", box).hidden = !(o && o.facsimile);
    };
    faxOf();
    if ($s("#cOrg", box)) $s("#cOrg", box).addEventListener("change", faxOf);
    $s("#cPdf", box).addEventListener("click", () => скачать("pdf"));
    $s("#cOk", box).addEventListener("click", () => скачать("xlsx"));
    $s("#cMk", box).addEventListener("change", async (e) => {
      e.target.classList.remove("bad");
      try {
        await AUTH.api("PATCH", "/documents/" + t.docId, { markup: e.target.value });
        await openPositions(t.docId);
      } catch (err) {
        e.target.classList.add("bad");
        $s("#cErr", box).textContent = String(err.message);
        $s("#cErr", box).hidden = false;
      }
    });

    /* Книга и PDF собираются одним и тем же на сервере, поэтому здесь
       различаются только адрес и расширение файла. */
    async function скачать(вид) {
      const btn = $s(вид === "pdf" ? "#cPdf" : "#cOk", box);
      if (btn.classList.contains("dl-busy")) return;
      const was = btn.textContent;
      btn.textContent = "Собираю…";
      try {
        /* Не AUTH.api: ответ — файл, а не JSON. Кнопку обводит кольцо,
           пока книга собирается и едет (dl.js). */
        const got = await DL.save(t.url + (вид === "xlsx" ? ".xlsx" : ""), {
          btn, name: "Калькуляция." + вид, error: "Не удалось собрать калькуляцию",
          body: {
            org: $s("#cOrg", box) ? $s("#cOrg", box).value : "",
            kind: $s("#cKind", box).value,
            number: $s("#cNum", box).value,
            annex: $s("#cAnn", box).value,
            vat: $s("#cVat", box).value,
            only_priced: !!$s("#cOnly", box).value,
            facsimile: !$s("#cFaxW", box).hidden && !!$s("#cFax", box).value,
          },
        });
        if (got) close();
      } catch (e) {
        $s("#cErr", box).textContent = String(e.message);
        $s("#cErr", box).hidden = false;
        btn.textContent = was;
      }
    }
  }

  function wirePos(host) {
    const back = () => {
      openDoc = null; POS = null;
      // Из расчёта назад — с новыми числами в дашборде объекта: там
      // только что правили цены.
      render();
      if (openId) {
        AUTH.api("GET", "/sites/" + encodeURIComponent(openId) + "/summary")
          .then((s) => { SUMMARY = s; if (!openDoc) render(); })
          .catch(() => {});
      }
    };
    $s("#posBack", host).addEventListener("click", back);
    fitCalcHead(host);
    const obj = $s("#posObj", host);
    if (obj) obj.addEventListener("click", back);
    // Ширину колонок раздвигают все, кто видит расчёт: это не правка
    // данных, а то, как человеку удобно смотреть.
    wireColResize(host);
    wirePan(host);
    if ($s("#posCalc", host)) {
      $s("#posCalc", host).addEventListener("click", () => calcForm());
      $s("#posFix", host).addEventListener("click", fixVersion);
      $s("#posSupply", host).addEventListener("click", () => supplyHandover());
      if ($s("#posCombo", host)) {
        $s("#posCombo", host).addEventListener("click", (e) => comboRefresh(openDoc.id, e.currentTarget));
      }
      if ($s("#posCmp", host)) {
        $s("#posCmp", host).addEventListener("click", () =>
          openCompare(openDoc.id, [VERS.rows[VERS.rows.length - 1].id, "current"]));
      }
      host.querySelectorAll("[data-pull]").forEach((b) => {
        b.addEventListener("click", () => (b.dataset.pull === "work" ? pullWorksAsk() : pullPrices(b.dataset.pull)));
      });
      host.querySelectorAll("[data-addrows]").forEach((b) => {
        b.addEventListener("click", (e) => { e.stopPropagation(); addRowsForm(b.dataset.addrows || ""); });
      });
      // «Д» — в фазе погружения: клетка наименования по щелчку открывает
      // правку, а кнопка перерисовывается вместе с клеткой.
      const ctbl = $s(".calc-tbl", host);
      if (ctbl) ctbl.addEventListener("click", (e) => {
        const b = e.target.closest("[data-dav]");
        if (!b) return;
        e.stopPropagation();
        toggleDav(b);
      }, true);
      host.querySelectorAll("[data-addafter]").forEach((b) => {
        b.addEventListener("click", (e) => { e.stopPropagation(); addRowsForm("", b.dataset.addafter); });
      });
      host.querySelectorAll("[data-drop]").forEach((b) => {
        b.addEventListener("click", (e) => { e.stopPropagation(); dropRow(b); });
      });
      host.querySelectorAll("[data-skip]").forEach((inp) => {
        // «Часть раздела» в разметку не записать — только свойством.
        if (inp.hasAttribute("data-part")) inp.indeterminate = true;
        inp.addEventListener("change", () => toggleSkip(inp));
      });
      host.querySelectorAll("[data-skip-all]").forEach((inp) => {
        if (inp.hasAttribute("data-part")) inp.indeterminate = true;
        inp.addEventListener("change", () => toggleSkipAll(inp));
      });
      $s("#posMk", host).addEventListener("change", saveMarkup);
      $s("#posWm", host).addEventListener("change", saveMarkup);
      // Щелчок по колонке поставщика выбирает его цену: она идёт в
      // «Материалы всего» и в итог. Ради этого выбора колонки и стоят
      // рядом — чтобы сравнивать глазами, а не считать.
      host.querySelectorAll("[data-take]").forEach((b) => {
        b.addEventListener("click", () => takeOffer(b));
      });
      host.querySelectorAll("[data-type]").forEach((b) => {
        b.addEventListener("click", () => typeIn(b));
      });
      host.querySelectorAll("[data-takework]").forEach((b) => {
        b.addEventListener("click", () => takeWork(b));
      });
      host.querySelectorAll("[data-find], [data-find-obj]").forEach((b) => {
        b.addEventListener("click", (e) => { e.stopPropagation(); openFind(b); });
      });
      $s("#posSp", host).addEventListener("click", () => spDialog());
      host.querySelectorAll("[data-findwork]").forEach((b) => {
        b.addEventListener("click", (e) => { e.stopPropagation(); openWorkFind(b); });
      });
      host.querySelectorAll("[data-auto]").forEach((b) => {
        b.addEventListener("click", () => autoPrice(b));
      });
      host.querySelectorAll("[data-resetsell]").forEach((b) => {
        b.addEventListener("click", () => resetSell(b));
      });
    }
    // Подсказка поставщиков — свои контрагенты и те, кого уже вводили.
    if (POS.suppliers.length && !$s("#posSup")) {
      const dl = document.createElement("datalist");
      dl.id = "posSup";
      dl.innerHTML = POS.suppliers.map((s) =>
        `<option value="${esc(s)}">`).join("");
      host.appendChild(dl);
    }
    // Столбец из Excel — в «Материалы за ед.», «Работа за ед.», «Кол-во».
    host.querySelectorAll(PASTE_SEL).forEach((inp) => inp.addEventListener("paste", (e) => {
      const text = (e.clipboardData || window.clipboardData).getData("text") || "";
      if (!/[\t\n]/.test(text.replace(/\s+$/, ""))) return;     // одна клетка — как обычно
      e.preventDefault();
      pasteColumn(inp, text);
    }));
    // Спецификация строки проекта — по щелчку (specEditor).
    host.querySelectorAll("[data-ef]").forEach((el) => el.addEventListener("click", (e) => {
      if (e.target.closest(".sp-in, .sp-back")) return;
      specEditor(el);
    }));
    host.querySelectorAll(".pos-in").forEach((inp) => {
      const tr = inp.closest("tr");
      const before = inp.value;
      const save = async () => {
        if (inp.value === inp.dataset.was && inp.value === before) return;
        if (inp.value === inp.dataset.last) return;
        inp.dataset.last = inp.value;
        inp.classList.remove("bad");
        // Стёртая цена — не «пусто, заполни», а «цены нет»: подбор её не
        // вернёт. Строка после этого меняется целиком (уходит выбор
        // поставщика, появляется «↺»), поэтому перечитываем расчёт.
        const f = inp.dataset.f;
        const empty = inp.value.trim() === "";
        // Цена в ячейке поставщика — цена этого поставщика: сервер кладёт
        // её в его колонку прайса материалов и запоминает выбор. Стёртая
        // там же — уходит отовсюду, куда легла, если её вписали руками.
        const td = inp.closest("td[data-src]");
        const src = f === "buy_price" && td ? td.dataset.src : "";
        const off = !empty || src ? null
          : f === "buy_price" || f === "sell_price" ? { mat_off: 1 }
          : f === "work_price" ? { work_off: 1 } : null;
        try {
          const upd = await AUTH.api("PATCH", "/positions/" + tr.dataset.pos,
                                     off || (src ? { buy_price: inp.value, source: src }
                                                 : { [f]: inp.value }));
          if (off || src) {
            await openPositions(openDoc.id);
            if (upd.forgot && src === "obj") {
              note(upd.rejected
                ? "Цену из файла объекта для этой строки отклонили — подбор её больше не ставит."
                  + " Вернуть — ⌕ в колонке «Цена объекта»"
                : "Вписанная цена объекта стёрта. Строка вернулась к правилу");
            } else if (upd.forgot) {
              note(`Вписанная руками цена «${upd.forgot}» стёрта — и в строке, и в прайсе`
                + " материалов. Строка вернулась к правилу: минимальная из уверенных цен");
            }
            return;
          }
          if (upd.renumbered) {
            await openPositions(openDoc.id);
            note(`Номера ниже идут от исправленного — перенумеровано строк с шифром оборудования: ${upd.renumbered}`);
            return;
          }
          // Пересчитанные суммы приходят с сервера — там же, где их
          // считают для итогов, чтобы копейки не разъехались.
          const { totals, renumbered, ...fresh } = upd;
          // Количество комплекта меняет суммы всех его частей ниже —
          // перечитываем расчёт целиком, а не одну строку.
          const at = POS.rows.findIndex((x) => x.id === upd.id);
          if (f === "qty" && (POS.rows[at + 1] || {}).kind === "part" && POS.rows[at].kind !== "part") {
            await openPositions(openDoc.id);
            return;
          }
          const row = POS.rows.find((x) => x.id === upd.id);
          Object.assign(row, fresh);
          paintRow(tr, fresh);
          tr.classList.add("ed");
          if (f === "qty") repaintSpec(tr, row);
          refreshSums(totals);
          if (upd.work_saved === "created" || upd.work_saved === "updated") {
            note(upd.work_saved === "created"
              ? "Расценка сохранена в прайсе работ, раздел «Из расчётов». На следующем объекте эта позиция получит её сама"
              : "Расценка в прайсе работ обновлена");
          }
        } catch (e) {
          inp.classList.add("bad");
          inp.title = String(e.message);
        }
      };
      inp.addEventListener("change", save);
      inp.addEventListener("keydown", (e) => {
        if (e.key === "Enter") { e.preventDefault(); inp.blur(); }
      });
    });
  }

  /* Спросить у поставщика цены на всю книгу разом.

     Дело не быстрое — сотни позиций ищутся по трём каталогам, ЭТМ
     отвечает про единицы по одному коду в секунду. На большой
     спецификации это дольше, чем nginx ждёт ответа (30 секунд): прямой
     запрос обрывался ошибкой 504, хотя подбор на сервере доделывался.
     Поэтому подбор идёт задачей: запускаем, раз в полторы секунды
     спрашиваем, как дела, и пишем ход внизу, а кнопка говорит, что
     занята. */
  const PULL_POLL = 1500;
  const PULL_MAX = 20 * 60 * 1000;     // дольше двадцати минут не ждём
  /* what — «mat» или «work»: материалы и работы подтягиваются раздельно
     (заказчик, 05.10.2026). Пока идёт один подбор, заняты обе кнопки:
     второй писал бы цены в те же строки. */
  /* «Подтянуть работы» — чьи расценки (правка № 27, 23.10.2026): «выбрали
     одного заказчика — подтянулись его расценки; нужны другого — выбрали
     другого». По умолчанию — заказчик объекта; «Только общий прайс работ»
     — без расценок заказчиков. Выбор помним у расчёта. */
  async function pullWorksAsk() {
    let d;
    try {
      d = await AUTH.api("GET", "/documents/" + encodeURIComponent(openDoc.id) + "/work-customers");
    } catch (e) {
      note("Не вышло: " + e.message, true);
      return;
    }
    const site = d.site || null;
    const rows = (d.rows || []).slice().sort((a, b) => (site && b.id === site.id) - (site && a.id === site.id));
    if (!rows.length) { pullPrices("work"); return; }
    const key = "calc.wcus." + openDoc.id;
    let pick = "";
    try { pick = localStorage.getItem(key) || ""; } catch (e) { /* без памяти */ }
    if (pick !== "none" && !rows.some((r) => r.id === pick)) {
      pick = site && rows.some((r) => r.id === site.id) ? site.id : "none";
    }
    const box = document.createElement("div");
    box.className = "pf-modal";
    const opt = (id, name, sub) => `<button type="button" class="wcus-o" role="radio" data-c="${esc(id)}">
      <b>${esc(name)}</b><i>${esc(sub)}</i></button>`;
    box.innerHTML = `
      <div class="pf-crop cnt-card wcus" role="dialog" aria-label="Чьи расценки подтянуть">
        <h3>Подтянуть работы — чьи расценки</h3>
        <p class="note">Расценки заказчика идут первыми, где их нет — общий прайс работ. Цены материалов не меняются.${
          site && !rows.some((r) => r.id === site.id) ? ` У заказчика объекта «${esc(site.name)}» расценок пока нет.` : ""}</p>
        <div class="wcus-list" role="radiogroup" aria-label="Заказчик">${rows.map((r) => opt(r.id, r.name,
          `${r.n} ${plural(r.n, "расценка", "расценки", "расценок")}${site && r.id === site.id ? " · заказчик объекта" : ""}`)).join("")}
          ${opt("none", "Только общий прайс работ", "без расценок заказчиков")}</div>
        <div class="cnt-acts">
          <button type="button" class="btn ghost" data-no>Отмена</button>
          <button type="button" class="btn" data-ok>${ICO.wrench}Подтянуть</button>
        </div>
      </div>`;
    document.body.appendChild(box);
    const paint = () => box.querySelectorAll("[data-c]").forEach((b) => {
      b.classList.toggle("on", b.dataset.c === pick);
      b.setAttribute("aria-checked", String(b.dataset.c === pick));
    });
    const close = () => { document.removeEventListener("keydown", esc_); box.remove(); };
    const esc_ = (e) => { if (e.key === "Escape") close(); };
    document.addEventListener("keydown", esc_);
    box.addEventListener("mousedown", (e) => { if (e.target === box) close(); });
    box.querySelectorAll("[data-c]").forEach((b) => b.addEventListener("click", () => { pick = b.dataset.c; paint(); }));
    box.querySelectorAll("[data-c]").forEach((b) => b.addEventListener("dblclick", () => $s("[data-ok]", box).click()));
    $s("[data-no]", box).addEventListener("click", close);
    $s("[data-ok]", box).addEventListener("click", () => {
      try { localStorage.setItem(key, pick); } catch (e) { /* без памяти */ }
      close();
      pullPrices("work", pick);
    });
    paint();
  }

  async function pullPrices(what, customer) {
    const btn = $s(`[data-pull="${what}"]`);
    if (!btn || btn.disabled) return;
    const work = what === "work";
    const was = btn.innerHTML;
    document.querySelectorAll("[data-pull]").forEach((b) => { b.disabled = true; });
    btn.innerHTML = work ? ICO.wrench + " Ищем расценки…" : ICO.box + " Ищем цены…";
    FRESH.hold();
    const doc = openDoc.id;
    const ход = (t) => note((work ? "Подбираю расценки — " : "Подбираю цены материалов — ")
      + (t || "работаю") + "…");
    try {
      let st = await AUTH.api("POST", "/offers/pull/start", { doc, what, customer: customer || "" });
      const job = st.job;
      ход(st.step);
      for (const t0 = Date.now(); ;) {
        await new Promise((ok) => setTimeout(ok, PULL_POLL));
        st = await AUTH.api("GET", "/offers/pull/" + job);
        if (!st.running) break;
        ход(st.step);
        if (Date.now() - t0 > PULL_MAX) {
          throw new Error("подбор идёт больше двадцати минут — обновите страницу позже");
        }
      }
      if (st.error) throw new Error(st.error);
      const r = st.result || {};
      // Пока искали, человек мог уйти из расчёта — тогда перерисовывать
      // нечего: цены уже записаны и встанут, когда он вернётся.
      if (!openDoc || openDoc.id !== doc) return;
      await openPositions(doc);
      const снято = work ? (r.unset_work || 0) : (r.unset_mat || 0);
      note((work
        ? (r.work_cus ? `Расценки «${r.work_cus}» — у ${r.by_cus || 0} ${plural(r.by_cus || 0, "строки", "строк", "строк")}. `
          : customer === "none" ? "Только общий прайс работ. " : "")
          + `С расценкой работы ${r.with_work ?? "—"} из ${r.checked}. Изменилось сейчас: ${r.set_work || 0}`
        : `С ценой материала ${r.with_price ?? "—"} из ${r.checked}. Изменилось сейчас: ${r.set_mat || 0}`
          + (r.by_variant ? `, из них ${r.by_variant} по другим написаниям из прайса` : ""))
        + (снято ? `. Снято ${снято} ${plural(снято, "цена", "цены", "цен")}`
            + " прошлого подбора, которым замены не нашлось" : "")
        + `. Помеченное вопросом сверьте — подобрано неуверенно`
        + (r.unit_clash ? `. У ${r.unit_clash} ${plural(r.unit_clash,
            "позиции", "позиций", "позиций")} не сошлись единицы — цену`
            + " не ставили" : "")
        + (r.choice_lost ? `. У ${r.choice_lost} ${plural(r.choice_lost, "строки", "строк", "строк")}`
            + " выбранный поставщик больше не даёт цену — поставили по правилу, строки помечены «!»" : "")
        + (r.no_qty ? `. Без количества ${work ? "расценки" : "цены"} не искали: ${r.no_qty} ${
            plural(r.no_qty, "строка", "строки", "строк")}` : "")
        + (r.skipped ? `. «Не учитывать» не искали: ${r.skipped} ${plural(r.skipped,
            "строка", "строки", "строк")}` : "")
        + (r.warning ? `. Материалы не искали: ${r.warning}` : ""),
        !!r.warning);
    } catch (e) {
      // Кнопки ищем заново: за время подбора страницу могли перерисовать.
      document.querySelectorAll("[data-pull]").forEach((b) => { b.disabled = false; });
      const b = $s(`[data-pull="${what}"]`);
      if (b) b.innerHTML = was;
      note("Не вышло: " + e.message, true);
    } finally {
      FRESH.release();
    }
  }

  /* Вернуть позиции цену подбора: ручной выбор и вписанная цена
     снимаются, в «Материал» встаёт минимум по правилу из находок, что
     уже лежат у позиции. Итоги перечитываем с сервера: их считает он. */
  async function autoPrice(b) {
    const tr = b.closest("tr");
    const p = POS.rows.find((x) => x.id === tr.dataset.pos);
    try {
      await AUTH.api("POST", "/positions/" + p.id + "/auto", {});
      await openPositions(openDoc.id);
    } catch (e) {
      note("Не вышло: " + e.message, true);
    }
  }

  /* Снять вписанную «Материалы за ед.» — обратно к формуле. */
  async function resetSell(b) {
    const tr = b.closest("tr");
    const p = POS.rows.find((x) => x.id === tr.dataset.pos);
    try {
      await AUTH.api("PATCH", "/positions/" + p.id, { sell_price: "" });
      await openPositions(openDoc.id);
    } catch (e) {
      note("Не вышло: " + e.message, true);
    }
  }

  /* Наценка на материал. Меняется одним числом на всю книгу и
     пересчитывает её целиком: торгуются процентом, а не построчно. */
  async function saveMarkup(e) {
    const inp = e.target;
    inp.classList.remove("bad");
    try {
      await AUTH.api("PATCH", "/documents/" + openDoc.id,
                     { [inp.id === "posWm" ? "work_markup" : "markup"]: inp.value });
      await openPositions(openDoc.id);
    } catch (err) {
      inp.classList.add("bad");
      note("Не вышло: " + err.message, true);
    }
  }

  /* Поставить подобранную расценку в колонку работы. */
  async function takeWork(b) {
    const tr = b.closest("tr");
    const p = POS.rows.find((x) => x.id === tr.dataset.pos);
    const o = (p && (p.offers || {}).work) || {};
    if (!o.price) return;
    try {
      const { totals, ...upd } = await AUTH.api("PATCH", "/positions/" + p.id,
                                                { work_price: o.per_unit ?? o.price });
      Object.assign(p, upd);
      tr.querySelector('[data-f="work_price"]').value = upd.work_base ?? upd.work_price;
      b.closest(".offers").remove();
      paintRow(tr, upd);
      tr.classList.add("ed");
      refreshSums(totals);
    } catch (e) {
      note("Не вышло: " + e.message, true);
    }
  }

  /* Поиск по каталогу у клетки: строка запроса — название и марка
     позиции, список кандидатов с ценой и состоянием, щелчок выбирает. */
  let findPop = null;
  function closeFind() {
    if (findPop) { findPop.remove(); findPop = null; }
    document.removeEventListener("keydown", onFindKey);
    document.removeEventListener("click", onFindOut);
  }
  function onFindKey(e) { if (e.key === "Escape") closeFind(); }
  function onFindOut(e) { if (findPop && !findPop.contains(e.target)) closeFind(); }

  function openFind(b) {
    closeFind();
    const tr = b.closest("tr");
    const p = POS.rows.find((x) => x.id === tr.dataset.pos);
    if (!p) return;
    // ⌕ в колонке «Цена объекта» ищет в файлах объекта, а не в каталоге.
    const obj = b.hasAttribute("data-find-obj");
    const src = b.dataset.find || "rs24";
    const srcName = (SRC.find((x) => x.id === src) || {}).name || src;
    const box = document.createElement("div");
    box.className = "mat-pop";
    // Щит узнаётся обозначением — его и ставим первым словом запроса.
    const q0 = (obj ? [/[A-Za-zА-Яа-яЁё]/.test(p.pos_no || "") ? p.pos_no : "", p.name, p.code]
      : [p.name, p.brand, p.code]).filter(Boolean).join(" ");
    box.innerHTML = `<div class="mat-pop-head">
        <input class="pos-in" value="${esc(q0)}" placeholder="${
          obj ? "Что искать в ценах объекта" : `Что искать в каталоге «${esc(srcName)}»`}">
        <button type="button" class="lnk" data-x title="Закрыть">×</button></div>
      <div class="mat-pop-list dim">Ищу…</div>
      <div class="dim mat-pop-hint">${obj
        ? "Щелчок по строке ставит её цену в «Цену объекта» — она пойдёт в расчёт. Новый подбор этот выбор не трогает."
        : `Щелчок по товару ставит его цену в материал и
        запоминает выбор у позиции прайса — на следующем объекте она встанет сама.`}</div>`;
    document.body.appendChild(box);
    const r = b.getBoundingClientRect();
    const w = Math.min(440, window.innerWidth - 24);
    box.style.left = Math.max(12, Math.min(r.left, window.innerWidth - w - 12)) + "px";
    box.style.top = Math.min(r.bottom + 6, window.innerHeight - 60) + "px";
    findPop = box;
    const inp = box.querySelector("input");
    const list = box.querySelector(".mat-pop-list");
    let timer = null;
    const go = async () => {
      const q = inp.value.trim();
      if (!q) { list.innerHTML = ""; return; }
      list.innerHTML = '<span class="dim">Ищу…</span>';
      if (obj) {
        try {
          const res = await AUTH.api("GET", "/sites/" + encodeURIComponent(openId)
            + "/prices/search?q=" + encodeURIComponent(q));
          const rows = res.rows || [];
          list.innerHTML = (res.all ? '<span class="dim mat-pop-all">Совпадений нет — все строки'
            + " файлов объекта:</span>" : "") + (rows.length ? rows.map((f) => `
            <button type="button" class="mat-pop-row" data-sp="${esc(f.sp)}" data-key="${esc(f.key)}">
              <span class="mat-pop-name">${esc(f.name)}</span>
              <span class="dim">${esc(f.supplier)}${f.code ? " · " + esc(f.code) : ""} ·
                ${money(gross(p, f.price))} за ${esc(f.unit || "ед.")} с НДС
                ${f.state ? `<i class="st ${esc(f.state)}">${stateName(f.state)}</i>` : ""}</span>
            </button>`).join("")
            : '<span class="dim">В ценах объекта не нашлось — попробуйте обозначение щита или другие слова</span>');
          list.querySelectorAll("[data-key]").forEach((x) => {
            x.addEventListener("click", () => pickObj(p, x.dataset.sp, x.dataset.key));
          });
        } catch (e) {
          list.innerHTML = `<span class="dim">Не вышло: ${esc(e.message)}</span>`;
        }
        return;
      }
      try {
        const res = await AUTH.api("GET", "/catalog/search?limit=8&src=" + encodeURIComponent(src)
                                          + "&q=" + encodeURIComponent(q));
        const rows = res.found || [];
        // Цены ЭТМ и РС24 спрашиваются у портала — не ответил, так и скажем.
        list.innerHTML = (res.price_error && rows.length ? `<span class="dim mat-pop-all">Цены у поставщика
          не спросились: ${esc(res.price_error)}</span>` : "") + (rows.length ? rows.map((f) => `
          <button type="button" class="mat-pop-row" data-code="${esc(f.code)}"
            title="${esc(f.shared.join(", "))}${f.conflicts.length
              ? " · разошлись: " + esc(f.conflicts.join(", ")) : ""}">
            <span class="mat-pop-name">${esc(f.name)}</span>
            <span class="dim">${esc(f.brand)}${f.vcode ? " · " + esc(f.vcode) : ""} ·
              ${f.price != null ? money(f.price) + " за " + esc(f.unit || "ед.") : "цены нет"}
              <i class="st ${esc(f.state)}">${stateName(f.state)}</i></span>
          </button>`).join("")
          : '<span class="dim">Ничего не нашлось — попробуйте другие слова</span>');
        list.querySelectorAll("[data-code]").forEach((x) => {
          x.addEventListener("click", () => pickItem(p, x.dataset.code, src));
        });
      } catch (e) {
        list.innerHTML = `<span class="dim">Не вышло: ${esc(e.message)}</span>`;
      }
    };
    inp.addEventListener("input", () => { clearTimeout(timer); timer = setTimeout(go, 350); });
    inp.addEventListener("keydown", (e) => {
      if (e.key === "Enter") { e.preventDefault(); clearTimeout(timer); go(); }
    });
    box.querySelector("[data-x]").addEventListener("click", closeFind);
    setTimeout(() => {
      document.addEventListener("keydown", onFindKey);
      document.addEventListener("click", onFindOut);
    }, 0);
    inp.focus();
    go();
  }

  function stateName(st) {
    return { article: "артикул", sure: "уверенно", maybe: "под вопросом",
             conflict: "другой размер", weak: "слабо", hand: "выбрано" }[st] || st || "";
  }

  /* Поиск расценки в прайсе работ — тот же попап, что у каталога РС24.
     Щелчок ставит расценку в «Работа за ед.» и запоминает её у материала
     прайса. Нужной нет — цену вписывают прямо в клетку. */
  function openWorkFind(b) {
    closeFind();
    const tr = b.closest("tr");
    const p = POS.rows.find((x) => x.id === tr.dataset.pos);
    if (!p) return;
    const box = document.createElement("div");
    box.className = "mat-pop";
    const q0 = [p.name, p.brand].filter(Boolean).join(" ");
    box.innerHTML = `<div class="mat-pop-head">
        <input class="pos-in" value="${esc(q0)}" placeholder="Что искать в прайсе работ">
        <button type="button" class="lnk" data-x title="Закрыть">×</button></div>
      <div class="mat-pop-list dim">Ищу…</div>
      <div class="dim mat-pop-hint">Щелчок ставит расценку в «Работа за ед.» и запоминает её у
        позиции прайса — на следующем объекте она встанет сама. Нужной нет — впишите цену
        прямо в клетку: она сохранится в прайсе работ, в разделе «Из расчётов».</div>`;
    document.body.appendChild(box);
    const r = b.getBoundingClientRect();
    const w = Math.min(440, window.innerWidth - 24);
    box.style.left = Math.max(12, Math.min(r.left - w + r.width, window.innerWidth - w - 12)) + "px";
    box.style.top = Math.min(r.bottom + 6, window.innerHeight - 60) + "px";
    findPop = box;
    const inp = box.querySelector("input");
    const list = box.querySelector(".mat-pop-list");
    let timer = null;
    const go = async () => {
      const q = inp.value.trim();
      if (!q) { list.innerHTML = ""; return; }
      list.innerHTML = '<span class="dim">Ищу…</span>';
      try {
        const res = await AUTH.api("GET", "/works/search?limit=8&unit="
          + encodeURIComponent(p.unit || "") + "&q=" + encodeURIComponent(q));
        const rows = res.found || [];
        list.innerHTML = rows.length ? rows.map((x) => `
          <button type="button" class="mat-pop-row" data-work="${esc(x.id)}"
            title="${esc(x.note || "")}">
            <span class="mat-pop-name">${esc(x.name)}${x.spec ? " · " + esc(x.spec) : ""}</span>
            <span class="dim">${esc(x.section || "без раздела")} ·
              ${money(x.price)} за ${esc(x.unit || "ед.")}</span>
          </button>`).join("")
          : '<span class="dim">Ничего не нашлось — попробуйте другие слова или впишите цену в клетку</span>';
        list.querySelectorAll("[data-work]").forEach((x) => {
          x.addEventListener("click", () => pickWork(p, x.dataset.work));
        });
      } catch (e) {
        list.innerHTML = `<span class="dim">Не вышло: ${esc(e.message)}</span>`;
      }
    };
    inp.addEventListener("input", () => { clearTimeout(timer); timer = setTimeout(go, 300); });
    inp.addEventListener("keydown", (e) => {
      if (e.key === "Enter") { e.preventDefault(); clearTimeout(timer); go(); }
    });
    box.querySelector("[data-x]").addEventListener("click", closeFind);
    setTimeout(() => {
      document.addEventListener("keydown", onFindKey);
      document.addEventListener("click", onFindOut);
    }, 0);
    inp.focus();
    go();
  }

  async function pickWork(p, workId) {
    try {
      await AUTH.api("POST", "/positions/" + p.id + "/work", { work_id: workId });
      closeFind();
      await openPositions(openDoc.id);
      note("Расценка выбрана. На следующем объекте эта позиция получит её сама");
    } catch (e) {
      // Окно поиска открыто и закрывает полосу внизу — говорим в нём же,
      // чтобы можно было сразу выбрать другую строку.
      const hint = findPop && findPop.querySelector(".mat-pop-hint");
      if (!hint) return note("Не вышло: " + e.message, true);
      hint.textContent = "Не вышло: " + e.message;
      hint.classList.add("bad");
    }
  }

  // Не «pick»: так называется сборщик фильтра в списке объектов, а
  // объявления в одной области видимости перекрывают друг друга.
  async function pickItem(p, code, source) {
    try {
      const { totals, ...upd } = await AUTH.api("POST", "/positions/" + p.id + "/pick",
                                                { code, source: source || "rs24" });
      Object.assign(p, upd);
      // Шапка рисуется из POS.totals — свежие пришли вместе со строкой.
      if (totals) POS.totals = totals;
      closeFind();
      render();
      note(upd.warning ? "Товар выбран, но " + upd.warning
                       : "Товар выбран, цена в материале. Подбор эту позицию больше не трогает.",
           !!upd.warning);
    } catch (e) {
      note("Не вышло: " + e.message, true);
    }
  }

  /* Строка файла цен объекта, выбранная руками. Расчёт перечитываем
     целиком: у щита меняется цена, и его состав уходит «в щит». */
  async function pickObj(p, sp, key) {
    try {
      const upd = await AUTH.api("POST", "/positions/" + p.id + "/pick",
                                 { source: "obj", sp, code: key });
      closeFind();
      await openPositions(openDoc.id);
      note(upd.warning ? "Строка выбрана, но " + upd.warning
        : "Цена объекта выбрана — она идёт в расчёт. Подбор этот выбор не трогает.", !!upd.warning);
    } catch (e) {
      note("Не вышло: " + e.message, true);
    }
  }

  /* Щелчок по цене поставщика — выбрать её. Выбор запоминается на
     сервере: следующий «Подтянуть цены» держит этого поставщика и берёт
     его свежую цену. Итоги и рамку перечитываем с сервера. */
  async function takeOffer(btn) {
    const tr = btn.closest("tr");
    try {
      await AUTH.api("POST", "/positions/" + tr.dataset.pos + "/choose",
                     { source: btn.dataset.take });
      await openPositions(openDoc.id);
    } catch (e) {
      note("Не вышло: " + e.message, true);
    }
  }

  /* «+» в пустой ячейке — поле для цены этого поставщика. Пока ничего не
     вписали, ничего и не меняется: ушли из пустого поля — ячейка снова
     пустая. */
  function typeIn(btn) {
    const tr = btn.closest("tr");
    const src = btn.dataset.type;
    const inp = document.createElement("input");
    inp.className = "pos-in num";
    inp.inputMode = "decimal";
    inp.placeholder = "цена";
    btn.replaceWith(inp);
    inp.focus();
    let done = false;
    const finish = async () => {
      if (done) return;
      done = true;
      const v = inp.value.trim();
      if (!v) return render();
      try {
        await AUTH.api("PATCH", "/positions/" + tr.dataset.pos, { buy_price: v, source: src });
        await openPositions(openDoc.id);
      } catch (e) {
        done = false;
        inp.classList.add("bad");
        inp.title = String(e.message);
      }
    };
    inp.addEventListener("change", finish);
    inp.addEventListener("blur", () => { if (!inp.value.trim()) finish(); });
    inp.addEventListener("keydown", (e) => {
      if (e.key === "Enter") { e.preventDefault(); inp.blur(); finish(); }
      if (e.key === "Escape") { done = true; render(); }
    });
  }

  /* Итоги пересчитываем на месте, не перерисовывая таблицу: иначе
     после каждой введённой цены курсор улетал бы в начало списка. */
  /* Итоги шапки после правки одной строки — те, что сервер посчитал
     вместе с ней (тем же _totals, что при открытии расчёта). Прежде здесь
     искался блок итогов прежней вёрстки: его давно нет, и после правки
     количества или цены шапка показывала старые суммы до перезагрузки
     (найдено 01.10.2026). */
  function refreshSums(t) {
    if (!t) return;
    POS.totals = t;
    const box = $s(".calc-head .pg-facts");
    if (box) box.outerHTML = calcFacts(t);
    fitCalcHead();
  }

  /* ── список объектов ───────────────────────────────────── */
  /* Отбор считается на месте: объектов десятки, а не тысячи, и гонять за
     каждым щелчком запрос значит ждать сеть ради работы на миллисекунду. */
  function visibleSites() {
    return sortSites(sxBase());
  }

  /* ── список: поиск, сортировка, «требуют внимания» (30.09.2026) ──
     Пользователь: «чтобы было удобно управлять и контролировать объекты».
     Строка объекта теперь говорит, в каком он состоянии: статусы
     спецификаций, есть ли проект и договор, что с письмами и когда по
     нему было последнее движение. Сверху — поиск и «требуют внимания»:
     в работе без договора, без проекта, письма ждут нашего ответа.
     Пояснения — в значках ⓘ (tips.js), а не абзацами. */
  let SQ = "";                          // поиск: название, заказчик, адрес, люди
  let SSORT = { key: "name", dir: 1 };  // name, letters, last
  let ATTN = "";                        // nocontract, noproject, letters
  const canLetters = () => AUTH.can(AUTH.current(), "letters");
  const tip = (text) => (typeof TIPS === "object" ? TIPS.icon(text) : "");
  const ATTN_DEF = {
    nocontract: {
      label: "Без договора",
      tip: "Объект выигран, а договора в нём нет. Работаем без бумаги — положите договор во вкладку «Договор».",
      test: (s) => !(s.docs || {}).contract,
      mode: "obj",
    },
    noproject: {
      label: "Без проекта",
      tip: "В объекте нет ни одной спецификации или проекта — тендеру не с чем работать.",
      test: (s) => !(s.docs || {}).project,
    },
    letters: {
      label: "Письма ждут ответа",
      tip: "Пришли письма, на которые мы ещё не ответили. Цифра — сколько объектов.",
      test: (s) => ((s.letters || {}).need || 0) > 0,
      perm: () => canLetters(),
      mode: "obj",
    },
  };

  /* Отбор без сортировки. skip — какой отбор не применять: для счётчиков
     у самих переключателей (сколько будет, если выбрать этот статус). */
  function sxBase(skip) {
    const q = SQ.trim().toLowerCase();
    return SITES_ROWS.filter((s) =>
      (!FILTER.customer || s.customer === FILTER.customer) &&
      (!FILTER.foreman || s.foreman === FILTER.foreman) &&
      (!FILTER.master || s.master === FILTER.master) &&
      (!FILTER.org || s.org_id === FILTER.org) &&
      (skip === "stage" || !FILTER.stage || s.tender === FILTER.stage) &&
      (skip === "attn" || !ATTN || !ATTN_DEF[ATTN] || ATTN_DEF[ATTN].test(s)) &&
      (!q || [s.name, s.customer, s.tech_customer, s.address, s.note, s.foreman, s.master]
        .some((x) => String(x || "").toLowerCase().includes(q))));
  }

  // Срочность писем: сколько ждут нашего ответа, при равенстве — дольше.
  const sxUrg = (s) => { const l = s.letters || {}; return (l.need || 0) * 1000 + (l.days || 0); };
  function sortSites(rows) {
    const k = SSORT.key, d = SSORT.dir;
    return rows.slice().sort((a, b) => {
      let r = 0;
      if (k === "last") r = String(a.last || "").localeCompare(String(b.last || ""));
      else if (k === "letters") r = sxUrg(a) - sxUrg(b);
      else if (k === "sum") r = ((a.calc || {}).sum_with_vat || 0) - ((b.calc || {}).sum_with_vat || 0);
      if (r) return r * d;
      return a.name.localeCompare(b.name, "ru") * (k === "name" ? d : 1);
    });
  }

  /* «сегодня», «вчера», «3 дня назад», «2 недели назад», дальше — дата. */
  function sxAgo(iso) {
    const t = Date.parse(iso || "");
    if (!t) return "";
    const a = new Date(t), now = new Date();
    const d = Math.round((new Date(now.getFullYear(), now.getMonth(), now.getDate())
      - new Date(a.getFullYear(), a.getMonth(), a.getDate())) / 86400000);
    if (d <= 0) return "сегодня";
    if (d === 1) return "вчера";
    if (d < 7) return `${d} ${plural(d, "день", "дня", "дней")} назад`;
    if (d < 35) { const w = Math.round(d / 7); return `${w} ${plural(w, "неделю", "недели", "недель")} назад`; }
    const p2 = (n) => String(n).padStart(2, "0");
    return `${p2(a.getDate())}.${p2(a.getMonth() + 1)}.${a.getFullYear()}`;
  }

  // «Смирнов Иван Александрович» → «Смирнов И. А.»: колонка людей узкая.
  const sxShort = (n) => {
    const p = String(n || "").trim().split(/\s+/);
    return p.length > 1 ? p[0] + " " + p.slice(1).map((x) => x[0] + ".").join(" ") : p[0] || "";
  };

  /* Статус тендера — плашкой: «В работе» синим, «Завершён» серым,
     «Выигран» фиолетовым (оранжевый и зелёный — за компаниями). */
  const tndChip = (s) => `<span class="st st-${esc(s.tender)}">${esc(stageName(s.tender))}</span>`;

  /* Кто считает объект (правка № 10, 22.10.2026): назначенный в форме
     объекта, а пока не назначили — кто загрузил в него первый проект.
     Пока тендер в работе — «Считает», потом — «Расчёт». */
  const estWho = (s) => s.estimator || s.estimator_auto || "";
  const estLabel = (s) => (!s.tender || s.tender === "work" ? "Считает" : "Расчёт");
  function estFact(s) {
    const who = estWho(s);
    // Кто считал — щелчком (правка № 32, 23.10.2026: «разрешить
    // руководителю ПТО изменять, кто рассчитывал проект»): карточка объекта
    // открывается сразу на поле «Считает объект».
    if (!who && !can()) return "";
    const auto = !s.estimator;
    const tip = auto && who ? `${who} — загрузил(а) первый проект. Щёлкните, чтобы выбрать, кто считает`
      : who ? `${who}${can() ? " — щёлкните, чтобы поменять" : ""}` : "Не назначен — щёлкните, чтобы выбрать";
    return `
    <div><dt>${estLabel(s)}</dt><dd${auto ? ' class="dim"' : ""} title="${esc(tip)}">${can()
      ? `<button type="button" class="lnk est-go" data-est>${esc(who || "назначить")}</button>` : esc(who)}</dd></div>`;
  }

  /* Проект и договор — две метки: есть (галочка, сколько) или нет.
     В «Объектах» объекты выигранные, их строят: нет договора — красным,
     это и есть «требует внимания». */
  function sxDocs(s) {
    const d = s.docs || {};
    const one = (n, word, miss, tipText) => `<span class="sx-doc ${n ? "ok" : miss || "no"}" title="${esc(tipText)}">${
      n ? ICO.ok : ICO.no}${word}${n > 1 ? `<i>${n}</i>` : ""}</span>`;
    return `<span class="sx-docs">${one(d.project, "Проект", "warn",
      d.project ? `Спецификаций и проектов: ${d.project}` : "Проекта в объекте нет")}${one(d.contract, "Договор", "bad",
      d.contract ? `Договоров и допсоглашений: ${d.contract}` : "Объект в работе, а договора нет")}</span>`;
  }

  function sxLetters(s) {
    const l = s.letters || {};
    if (!l.open) return `<span class="sx-none">—</span>`;
    const sev = l.days >= 14 ? 2 : l.days >= 7 ? 1 : 0;
    return `<button type="button" class="sx-let" data-letters="${esc(s.id)}"
      title="Открыть письма объекта: ${l.need ? `надо ответить — ${l.need}` : ""}${l.need && l.wait ? ", " : ""}${
        l.wait ? `ждём ответа — ${l.wait}` : ""}">${l.need ? `<span class="sx-bdg need">${l.need}</span>` : ""}${
        l.wait ? `<span class="sx-bdg wait">${l.wait}</span>` : ""}<span class="sx-age s${sev}">${
        l.days ? l.days + " дн" : "сегодня"}</span></button>`;
  }

  function sxTeam(s) {
    if (!s.foreman && !s.master) return `<span class="sx-none">—</span>`;
    return `<span class="sx-team">${s.foreman ? `<span title="Начальник участка: ${esc(s.foreman)}"><em>НУ</em>${
      esc(sxShort(s.foreman))}</span>` : ""}${s.master ? `<span title="Мастер: ${esc(s.master)}"><em>М</em>${
      esc(sxShort(s.master))}</span>` : ""}</span>`;
  }

  // Отбор по людям и заказчику — списком-таблеткой; выбранное подсвечено.
  function sxPick(key, label, list) {
    return `<select class="role-sel${FILTER[key] ? " on" : ""}" data-f="${key}" aria-label="${esc(label)}"${
      list.length ? "" : " disabled"}>
      <option value="">${esc(label)}</option>
      ${list.map((v) => `<option value="${esc(v)}"${FILTER[key] === v ? " selected" : ""}>${esc(v)}</option>`).join("")}
    </select>`;
  }

  // Отбор по статусу тендера — кнопками со счётчиками (только в «Тендере»).
  function sxSegHtml() {
    const base = sxBase("stage");
    const n = (id) => base.filter((s) => s.tender === id).length;
    return `<button type="button" class="seg-b${FILTER.stage ? "" : " on"}" data-stage="">Все<i>${base.length}</i></button>
      ${STAGES.map((st) => `<button type="button" class="seg-b st-${esc(st.id)}${FILTER.stage === st.id ? " on" : ""}"
        data-stage="${esc(st.id)}">${esc(st.name)}<i>${n(st.id)}</i></button>`).join("")}`;
  }

  function sxAttnHtml() {
    const base = sxBase("attn");
    return Object.entries(ATTN_DEF).filter(([, a]) => (!a.perm || a.perm())
      && (!a.mode || a.mode === MODE)).map(([k, a]) => {
      const n = base.filter(a.test).length;
      if (!n && ATTN !== k) return "";
      return `<button type="button" class="sx-attn${ATTN === k ? " on" : ""}" data-attn="${k}">${
        esc(a.label)}<i>${n}</i></button>${tip(a.tip)}`;
    }).join("");
  }

  const sxAnyFilter = () => !!(filterCount() || ATTN || SQ.trim());

  function pick(key, label, list) {
    return `<select class="role-sel" data-f="${key}"${
      list.length ? "" : " disabled"}>
      <option value="">${esc(label)}</option>
      ${list.map((v) => `<option value="${esc(v)}"${
        FILTER[key] === v ? " selected" : ""}>${esc(v)}</option>`).join("")}
    </select>`;
  }

  const stageName = (id) =>
    (STAGES.find((x) => x.id === id) || STAGES[0] || {}).name || "";

  /* ── компания объекта ─────────────────────────────────────
     Метка своей компании: короткое имя её цветом. Цвет идёт из
     справочника, а не из кода, — заказчик просил различать объекты двух
     юрлиц по цвету, и третье юрлицо получит свой цвет там же. */
  const orgOf = (s) => ORGS.find((o) => o.id === s.org_id) || null;
  const orgStyle = (s) => {
    const o = orgOf(s);
    return o ? ` style="--org:${esc(o.color || "#64748B")}"` : "";
  };
  function orgChip(s) {
    const o = orgOf(s);
    if (!o) return `<span class="dim">—</span>`;
    return `<span class="org-chip" style="--org:${esc(o.color || "#64748B")}"
      title="${esc(o.name)}">${esc(o.short_name || o.name)}</span>`;
  }
  /* Отбор по компании. Недействующая компания в списке остаётся, пока
     по ней есть объекты: они никуда не делись. */
  function pickOrg() {
    const list = ORGS.filter((o) => o.active !== 0 || o.id === FILTER.org
      || SITES_ROWS.some((s) => s.org_id === o.id));
    return `<select class="role-sel" data-f="org"${list.length ? "" : " disabled"}>
      <option value="">Все компании</option>
      ${list.map((o) => `<option value="${esc(o.id)}"${
        FILTER.org === o.id ? " selected" : ""}>${
        esc(o.short_name || o.name)}</option>`).join("")}
    </select>`;
  }

  /* ── список на телефоне (23.09.2026) ─────────────────────
     Фильтры — одной кнопкой, сами выпадающие списки в окне снизу. Строка
     объекта — название и заказчик во всю ширину, без колонок: остальное
     внутри объекта. На компьютере список прежний. */
  const SIT_NARROW = matchMedia("(max-width: 684px)");
  SIT_NARROW.addEventListener("change", () => {
    const sec = $s(MODE === "tnd" ? "#sec-tnd" : "#sec-sit");
    if (sec && !sec.hidden && !openId) render();
  });
  const filterCount = () => ["org", "customer", "foreman", "master", "stage"]
    .filter((k) => FILTER[k]).length;

  /* Личные и общие файлы — за своей галочкой «Файлы». */
  const canFiles = () => AUTH.can(AUTH.current(), "files");
  const ICO_FOLDER = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 7A1.5 1.5 0 0 1 5 5.5h4.3l2 2.2H19a1.5 1.5 0 0 1 1.5 1.5v8.3A1.5 1.5 0 0 1 19 19H5a1.5 1.5 0 0 1-1.5-1.5z"/></svg>`;

  function listPhoneHtml(rows, n, всего) {
    const nf = filterCount() + (ATTN ? 1 : 0);
    return `
      <div class="pg sit-m">
        <div class="pg-head sit-m-head">
          <label class="pg-find sx-q sx-q-m">${ICO.find}<input id="sxQ" type="search"
            placeholder="Найти объект" value="${esc(SQ)}" autocomplete="off"></label>
          <div class="pg-tools">
            <button type="button" class="btn-ghost sit-m-f${nf ? " on" : ""}" id="sitFilters"
              aria-label="Фильтры">${ICO.filter}${nf ? `<i>${nf}</i>` : ""}</button>
${canFiles() && MODE !== "tnd" ? `<button type="button" class="btn-ghost sit-files sit-m-files" id="sitFiles"
              title="Мои файлы и общие папки конторы: регламенты, шаблоны, прайсы и счета поставщиков"
              aria-label="Общие файлы">${ICO_FOLDER}</button>` : ""}
            ${can() ? `<button type="button" class="btn-brand sit-m-new" id="sitNew"
              title="Завести объект" aria-label="Завести объект">${ICO.plus}</button>` : ""}
          </div>
        </div>
        <div class="pg-body" id="sxBody">${sxPhoneRows(rows, n, всего)}</div>
      </div>`;
  }

  function sxPhoneRows(rows, n, всего) {
    if (!n) {
      return `<div class="pg-empty"><b>${всего ? "Под отбор ничего не подошло" : "Объектов пока нет"}</b>${всего
        ? "Снимите фильтр или очистите поиск." : "Нажмите «＋», чтобы завести объект."}</div>`;
    }
    return `<div class="sx-m-count">${n === всего ? `${n} ${plural(n, "объект", "объекта", "объектов")}`
      : `${n} из ${всего}`}</div><div class="sit-m-list">${rows.map((s) => {
      const o = orgOf(s);
      const sub = [s.customer, o ? (o.short_name || o.name) : ""].filter(Boolean).join(" · ");
      const l = s.letters || {};
      const tnd = MODE === "tnd";
      const sig = [
        tnd ? tndChip(s) : "",
        tnd && (s.calc || {}).sum_with_vat ? `<span class="tnd-sum-m">${money(s.calc.sum_with_vat)} ₽</span>` : "",
        !tnd && l.open ? `<span class="sx-let sx-let-m">${l.need ? `<span class="sx-bdg need">${l.need}</span>` : ""}${
          l.wait ? `<span class="sx-bdg wait">${l.wait}</span>` : ""}</span>` : "",
        !tnd && !(s.docs || {}).contract ? `<span class="sx-doc bad">${ICO.no}Договор</span>` : "",
      ].filter(Boolean).join("");
      return `
        <button type="button" class="sit-m-row${o ? " has-org" : ""}" data-id="${esc(s.id)}"${orgStyle(s)}>
          <span class="sit-m-main"><b>${esc(s.name)}</b>${sub ? `<i>${esc(sub)}</i>` : ""}${
            sig ? `<span class="sx-m-sig">${sig}</span>` : ""}</span>
          <span class="sit-m-go">${ICO.go}</span>
        </button>`;
    }).join("")}</div>`;
  }

  function filtersSheet() {
    const box = document.createElement("div");
    box.className = "pf-modal sit-sheet";
    const paint = () => {
      box.innerHTML = `
        <div class="pf-crop cnt-card sit-sheet-card" role="dialog" aria-label="Фильтры">
          <h3>Фильтры</h3>
          ${MODE === "tnd" ? `<div class="fld"><span>Статус тендера</span>
            <div class="seg sit-sheet-seg">
              <button type="button" class="seg-b${FILTER.stage ? "" : " on"}" data-stage="">Все</button>
              ${STAGES.map((st) => `<button type="button" class="seg-b st-${esc(st.id)}${
                FILTER.stage === st.id ? " on" : ""}" data-stage="${esc(st.id)}">${
                esc(st.name)}</button>`).join("")}
            </div></div>` : ""}
          <div class="fld"><span>Компания</span>${pickOrg()}</div>
          <div class="fld"><span>Заказчик</span>${pick("customer", "Все заказчики", PICKS.customer)}</div>
          <div class="fld"><span>Начальник участка</span>${
            pick("foreman", "Все начальники участка", PICKS.foreman)}</div>
          <div class="fld"><span>Мастер</span>${pick("master", "Все мастера", PICKS.master)}</div>
          ${sxAttnHtml() ? `<div class="fld"><span>Требуют внимания</span><div class="sx-attns sx-attns-m">${
            sxAttnHtml()}</div></div>` : ""}
          <div class="pf-modal-foot">
            <button type="button" class="btn ghost" data-reset${filterCount() || ATTN ? "" : " disabled"}>Сбросить</button>
            <span class="grow"></span>
            <button type="button" class="btn" data-no>Показать: ${visibleSites().length}</button>
          </div>
        </div>`;
      box.querySelectorAll("[data-f]").forEach((sel) => sel.addEventListener("change", () => {
        FILTER[sel.dataset.f] = sel.value; render(); paint();
      }));
      box.querySelectorAll("[data-stage]").forEach((b) => b.addEventListener("click", () => {
        FILTER.stage = b.dataset.stage; render(); paint();
      }));
      box.querySelectorAll("[data-attn]").forEach((b) => b.addEventListener("click", () => {
        ATTN = ATTN === b.dataset.attn ? "" : b.dataset.attn; render(); paint();
      }));
      box.querySelector("[data-reset]").addEventListener("click", () => {
        ["org", "customer", "foreman", "master", "stage"].forEach((k) => { FILTER[k] = ""; });
        ATTN = "";
        render(); paint();
      });
      box.querySelector("[data-no]").addEventListener("click", close);
    };
    const close = () => { document.removeEventListener("keydown", key); box.remove(); };
    const key = (e) => { if (e.key === "Escape") close(); };
    document.addEventListener("keydown", key);
    box.addEventListener("click", (e) => { if (e.target === box) close(); });
    paint();
    document.body.appendChild(box);
  }

  function listHtml() {
    const rows = visibleSites();
    const n = rows.length;
    const всего = SITES_ROWS.length;
    if (SIT_NARROW.matches) return listPhoneHtml(rows, n, всего);
    const orgs = ORGS.filter((o) => o.active !== 0 || o.id === FILTER.org
      || SITES_ROWS.some((s) => s.org_id === o.id));
    const attn = sxAttnHtml();
    return `
      <div class="pg sx">
        <div class="pg-head sx-head">
          <label class="pg-find sx-q">${ICO.find}<input id="sxQ" type="search"
            placeholder="Объект, заказчик, адрес, люди" value="${esc(SQ)}" autocomplete="off"></label>
          <span class="grow"></span>
          ${tip("Здесь — выигранные объекты: их строят. Объекты, которые ещё считают, — в разделе «Тендер»; "
            + "отметили там «Выигран» — объект появился здесь со всеми проектами и расчётом.")}
${canFiles() ? `<button type="button" class="btn-ghost sit-files" id="sitFiles"
            title="Мои файлы и общие папки конторы: регламенты, шаблоны, прайсы и счета поставщиков">${
            ICO_FOLDER}<span>Общие файлы</span></button>` : ""}
          ${can() ? `<button type="button" class="btn-brand" id="sitNew">${ICO.plus}Завести объект</button>` : ""}
        </div>
        <div class="sx-fbar">
          ${orgs.length ? `<div class="sx-orgs" role="group" aria-label="Компания">${orgs.map((o) =>
            `<button type="button" class="sx-orgb${FILTER.org === o.id ? " on" : ""}" data-org="${esc(o.id)}"
              style="--org:${esc(o.color || "#64748B")}" title="${esc(o.name)}"><i></i>${esc(o.short_name || o.name)}</button>`).join("")}</div>` : ""}
          <div class="sx-sels">
            ${sxPick("customer", "Заказчик", PICKS.customer)}
            ${sxPick("foreman", "Начальник участка", PICKS.foreman)}
            ${sxPick("master", "Мастер", PICKS.master)}
          </div>
          <button type="button" class="lnk sx-reset" id="sxReset"${sxAnyFilter() ? "" : " hidden"}>Сбросить всё</button>
          <span class="grow"></span>
          <div class="sx-attns" id="sxAttn"${attn ? "" : " hidden"}><span class="sx-fl">${ICO.alert}Требуют внимания</span>${attn}</div>
        </div>
        <div class="pg-body" id="sxBody">${sxTableHtml(rows, всего)}</div>
      </div>`;
  }

  function sxTableHtml(rows, всего) {
    if (!rows.length) {
      return `<div class="pg-empty"><b>${всего ? "Под отбор ничего не подошло" : "Объектов пока нет"}</b>${всего
        ? "Снимите фильтр или очистите поиск."
        : `Здесь — выигранные объекты. Отметьте объект «Выигран» в разделе «Тендер» — он появится
           здесь со всеми проектами и расчётом. Объект без тендера можно завести и здесь.`}</div>`;
    }
    const lt = canLetters();
    const sortH = sxSortH;
    return `
      <table class="tbl sx-tbl${lt ? "" : " no-let"}" style="--tbl-min:${lt ? 830 : 730}px">
        <colgroup><col class="c-obj"><col class="c-cust"><col class="c-docs">
          ${lt ? `<col class="c-let">` : ""}<col class="c-team"><col class="c-last"><col class="c-go"></colgroup>
        <thead><tr>
          <th>${sortH("name", "Объект", 1)}</th>
          <th>Заказчик</th>
          <th>Бумаги${tip("Проект и договор — без них объект не укомплектован. Договора нет — красным: объект в работе без бумаги.")}</th>
          ${lt ? `<th>${sortH("letters", "Письма", -1)}${tip("Оранжевое — письма, которые ждут нашего ответа; синее — ждём ответа мы. Дни — сколько ждёт самое давнее. Нажмите — откроются письма объекта.")}</th>` : ""}
          <th class="c-team">Команда</th>
          <th class="c-last">${sortH("last", "Движение", -1)}</th>
          <th></th>
        </tr></thead>
        <tbody>${rows.map((s) => {
          const o = orgOf(s);
          return `
          <tr class="go${o ? " has-org" : ""}" data-id="${esc(s.id)}"${orgStyle(s)}>
            <td><span class="t-name">${esc(s.name)}</span>${o || s.note ? `<i class="t-sub">${o
              ? `<span class="sx-org" style="--org:${esc(o.color || "#64748B")}">${esc(o.short_name || o.name)}</span>` : ""}${
              s.note ? `<span class="sx-note">${esc(s.note)}</span>` : ""}</i>` : ""}</td>
            <td>${s.customer ? `<span class="sx-cust">${esc(s.customer)}</span>${s.tech_customer
              ? `<i class="t-sub" title="Техзаказчик">тех.: ${esc(s.tech_customer)}</i>` : ""}` : `<span class="sx-none">—</span>`}</td>
            <td>${sxDocs(s)}</td>
            ${lt ? `<td>${sxLetters(s)}</td>` : ""}
            <td class="c-team">${sxTeam(s)}</td>
            <td class="c-last"><span class="sx-last" title="${esc(s.last ? "Последнее движение: " + s.last.slice(0, 10) : "")}">${
              esc(sxAgo(s.last)) || "—"}</span></td>
            <td class="go-c">${can() ? `<button type="button" class="t-ed"
                data-ed title="Править объект">${ICO.edit}</button><button type="button" class="t-ed warn" data-del
                title="Убрать объект">${ICO.trash}</button>` : ""}<button type="button" class="t-go"
                data-open title="Открыть объект">${ICO.go}</button></td>
          </tr>`;
        }).join("")}</tbody>
      </table>`;
  }

  /* Поиск и переключатели перерисовывают только список и счётчики: поле
     поиска остаётся тем же, курсор не прыгает, выпадающие списки не
     одеваются заново на каждую букву. */
  function sxPaint() {
    const host = HOST();
    const root = host && $s(".pg", host);
    if (!root) return render();
    const rows = visibleSites();
    const body = $s("#sxBody", root);
    if (SIT_NARROW.matches) {
      if (body) body.innerHTML = sxPhoneRows(rows, rows.length, SITES_ROWS.length);
      return;
    }
    if (body) body.innerHTML = (MODE === "tnd" ? tndTableHtml : sxTableHtml)(rows, SITES_ROWS.length);
    const seg = $s("#sxSeg", root);
    if (seg) seg.innerHTML = sxSegHtml();
    const at = $s("#sxAttn", root);
    if (at) {
      const h = sxAttnHtml();
      at.hidden = !h;
      at.innerHTML = `<span class="sx-fl">${ICO.alert}Требуют внимания</span>${h}`;
    }
    const rs = $s("#sxReset", root);
    if (rs) rs.hidden = !sxAnyFilter();
  }

  /* Мини-дашборд объекта — полоса главных чисел под шапкой карточки.
     Классы плиток — kpi-main и kpi-warn, не main и warn: «.main» в
     styles.css — колонка страницы с flex: 1, и первая плитка растягивалась
     на всю пустоту, уталкивая остальные к правому краю.
     Стоит над вкладками, поэтому виден, на какой вкладке ни работай, как
     просил заказчик. Числа считает сервер тем же правилом, что расчёт:
     сумма расчёта по спецификациям проектов с наценкой и НДС, из неё
     материалы и работы, сколько позиций уже с ценой и расценкой, бумаги
     и договоры. Пустое честно пустое — прочерк, а не ноль. */
  function kpiHtml() {
    const k = SUMMARY;
    if (!k || !k.calc) return "";
    const c = k.calc;
    const pct = (a, b) => (b ? Math.round((a * 100) / b) : 0);
    const cash = (v) => (v ? money(v) : "—");
    const tile = (label, value, sub, extra) => `
      <div class="kpi${extra || ""}"><dt>${esc(label)}</dt>
        <dd>${value}${sub ? `<i>${sub}</i>` : ""}</dd></div>`;
    const bar = (a, b) => (b ? `<span class="kpi-bar" title="${pct(a, b)} %"><b style="width:${
      pct(a, b)}%"></b></span>` : "");
    const docs = k.docs || {};
    const ctr = k.contracts || {};
    return `
      <dl class="sit-kpi" aria-label="Показатели объекта">
        ${tile("Расчёт с НДС " + (k.vat ?? 22) + "%", esc(cash(c.sum_with_vat)),
          c.docs ? esc(`${c.docs} ${plural(c.docs, "спецификация", "спецификации",
            "спецификаций")}`) : "", " kpi-main")}
        ${tile("Материалы", esc(cash(c.sum_buy)))}
        ${tile("Работы", esc(cash(c.sum_work)))}
        ${tile("Цены материалов", c.count ? `${c.priced} из ${c.count}` : "—",
          c.count ? `${pct(c.priced, c.count)}%${bar(c.priced, c.count)}` : "")}
        ${tile("Расценки работ", c.count ? `${c.worked} из ${c.count}` : "—",
          c.count ? `${pct(c.worked, c.count)}%${bar(c.worked, c.count)}` : "")}
        ${c.no_qty ? tile("Без количества", String(c.no_qty), "", " kpi-warn") : ""}
        ${tile("Договор", ctr.amount ? esc(money(ctr.amount)) : ctr.count ? "без суммы" : "—",
          ctr.count > 1 ? esc(`${ctr.count} шт.`) : "")}
        ${tile("Документы", String(docs.total || 0),
          docs.total ? esc(`проекты ${docs.project || 0} · договоры ${docs.contract || 0}`) : "")}
      </dl>`;
  }

  function wireList(host) {
    const root = host.firstElementChild;
    if (!root) return;
    const openSite = async (id) => {
      openId = id;
      tab = MODE === "tnd" ? "tender" : "contract";
      await loadOne(openId);
      render();
    };
    root.addEventListener("click", async (e) => {
      const t = e.target;
      if (t.closest("#sitNew")) { siteForm(null); return; }
      if (t.closest("#sitFiles")) { if (typeof openSection === "function") openSection("fil"); return; }
      if (t.closest("#sitFilters")) { filtersSheet(); return; }
      if (t.closest("#sxReset")) {
        ["org", "customer", "foreman", "master", "stage"].forEach((k) => { FILTER[k] = ""; });
        ATTN = ""; SQ = "";
        render();
        return;
      }
      const st = t.closest("[data-stage]");
      if (st) { FILTER.stage = st.dataset.stage; sxPaint(); return; }
      const at = t.closest("[data-attn]");
      if (at) { ATTN = ATTN === at.dataset.attn ? "" : at.dataset.attn; sxPaint(); return; }
      const og = t.closest("[data-org]");
      if (og) {
        FILTER.org = FILTER.org === og.dataset.org ? "" : og.dataset.org;
        root.querySelectorAll("[data-org]").forEach((b) => b.classList.toggle("on", b.dataset.org === FILTER.org));
        sxPaint();
        return;
      }
      const so = t.closest("[data-sort]");
      if (so) {
        const k = so.dataset.sort;
        SSORT = SSORT.key === k ? { key: k, dir: -SSORT.dir } : { key: k, dir: +so.dataset.dir || 1 };
        sxPaint();
        return;
      }
      // Письма объекта — прямо в раздел «Письма», на этот объект.
      const lt = t.closest("[data-letters]");
      if (lt) {
        e.stopPropagation();
        if (typeof LETTERS === "object" && LETTERS.openSite) LETTERS.openSite(lt.dataset.letters);
        if (typeof openSection === "function") openSection("let");
        return;
      }
      /* Убрать объект — из списка, не заходя внутрь. Спрашиваем прямо и
         называем имя: за объектом стоят договоры, проекты и разобранные
         спецификации, и «удалить?» без имени слишком легко подтвердить не
         глядя. */
      const del = t.closest("[data-del]");
      if (del) {
        e.stopPropagation();
        const x = SITES_ROWS.find((r) => r.id === del.closest("tr").dataset.id) || {};
        if (!(await ASK.confirm(`Убрать объект «${x.name}»?\nЕго документы и`
                     + ` разобранные спецификации перестанут быть видны.`))) return;
        try {
          await AUTH.api("DELETE", "/sites/" + x.id);
          await load();
        } catch (err) {
          note("Не вышло: " + err.message, true);
        }
        return;
      }
      /* Карандаш правит объект, не заходя внутрь: чтобы поменять адрес или
         мастера, открывать карточку и возвращаться незачем. */
      const ed = t.closest("[data-ed]");
      if (ed) {
        e.stopPropagation();
        siteForm(SITES_ROWS.find((r) => r.id === ed.closest("tr").dataset.id));
        return;
      }
      /* Объект открывает вся строка; стрелка справа — обещание, что
         строка ведёт внутрь, но нажимать можно куда угодно в ней. */
      const row = t.closest("tr.go, .sit-m-row");
      if (row) openSite(row.dataset.id);
    });
    root.addEventListener("change", (e) => {
      const sel = e.target.closest("[data-f]");
      if (!sel) return;
      FILTER[sel.dataset.f] = sel.value;
      sel.classList.toggle("on", !!sel.value);
      sxPaint();
    });
    const q = $s("#sxQ", root);
    if (q) q.addEventListener("input", () => { SQ = q.value; sxPaint(); });
  }

  /* ── карточка объекта ──────────────────────────────────── */
  function cardHtml() {
    const s = SITES_ROWS.find((x) => x.id === openId) || {};
    const gaps = missing();
    /* Вкладки — как нарисовал заказчик: слева работа ПТО по порядку, в
       котором она идёт, справа особняком — все бумаги объекта.

       «Договоры» и «Проекты» как карточки-заметки отсюда ушли: заказчик
       сказал прямо, что во вкладке должны лежать сами документы, а не
       записи о них. Данные карточек, редакции и связи в базе остались —
       вернуть их будет чем, если понадобятся.

       Вкладка «Сверка» скрыта раньше и по той же причине: сверять
       нечего, пока калькуляций в xlsx нет. Код цел и там, и на сервере. */
    const byKind = (k) => DOCS.filter((d) => d.kind === k).length;
    /* «Тендер» с 07.10.2026 — свой раздел меню (кнопка «Расчёт в
       Тендере» в шапке). */
    const tabs = [["contract", "Договор", byKind("contract")],
                  ["pto", "ПТО", 0],
                  ["budget", "Бюджет", 0],
                  ["orders", "Заявки", 0],
                  ["duty", "Наряды", 0],
                  // Файлы объекта (28.09.2026): раздел «Файлы» из левого меню
                  // переехал сюда. Первая папка — проектная документация, та
                  // же, что в «Письмах» (files.js, mount).
                  ["files", "Файлы", 0],
                  ["docs", "Документы", DOCS.length]];
    // Раздел мог остаться открытым на прежней вкладке — уводим в договор.
    if (!tabs.some(([k]) => k === tab)) tab = "contract";
    /* Шапка карточки: путь назад — ссылкой, не кнопкой (это навигация, а
       не действие), название крупно, под ним одной строкой всё, что про
       объект известно. Комплектность — рядом с названием, а не полосой
       во всю ширину: это подпись к состоянию, а не предупреждение. */
    /* Шапку можно свернуть (заказчик, 08.10.2026: рабочее поле зажато
       шапкой) — уходит всё выше черты под вкладками, верхняя полоса раздела
       тоже; остаётся тонкая строка с объектом и вкладкой. Выбор помнится. */
    const tabName = (tabs.find(([k]) => k === tab) || [, ""])[1];
    return `
      <div class="pg${MINI ? " card-min" : ""}">
        <div class="card-mini">
          <button type="button" class="pg-back" data-back
                  title="Все объекты" aria-label="Все объекты">${ICO.back}</button>
          <b title="${esc(s.name)}">${esc(s.name)}</b><span>${esc(tabName)}</span>
          <button type="button" class="btn-ghost sm" data-mini="0"
            title="Показать шапку объекта и вкладки">${ICO.chev}Развернуть</button>
        </div>
        <div class="pg-head strip card-head">
          <button type="button" class="pg-back" id="sitBack" data-back
                  title="Все объекты" aria-label="Все объекты">${ICO.back}</button>
          <div class="pg-h1">
            <h2>${esc(s.name)}</h2>
            ${orgOf(s) ? orgChip(s) : ""}
          </div>
          <!-- Адреса в шапке нет — он в форме объекта. Статуса тоже: в
               «Объектах» объекты выигранные, статус тендера — в «Тендере». -->
          <dl class="pg-facts">
            ${cusFact(s)}
            ${s.tech_customer ? fact("Техзаказчик", s.tech_customer,
                                     !s.tech_customer_id) : ""}
            ${fact("Начальник участка", s.foreman, s.foreman && !s.foreman_id)}
            ${fact("Мастер", s.master, s.master && !s.master_id)}
            ${estFact(s)}
            ${fact("Примечание", s.note)}
          </dl>
          ${allow("tnd_obj") ? `<button type="button" class="btn-ghost sm pg-act" id="sitTnd"
            title="Спецификации, расчёт и версии этого объекта — в разделе «Тендер»">${
            ICO.table}Расчёт в Тендере</button>` : ""}
          <!-- Снабжение (07.10.2026) — раздел меню; вкладки у объекта нет.
               Кнопка — к проработке объекта, когда калькуляцию передали. -->
          ${DOCS.some((d) => d.supply) && allow("snb_proc") ? `<button type="button" class="btn-ghost sm pg-act" id="sitSnb"
            title="Проработка объекта у снабжения: цены поставщиков, сроки, счета">${
            ICO.truck}Проработка</button>` : ""}
          ${can() ? `<button type="button" class="btn-ghost sm pg-act"
            id="sitEdit">${ICO.edit}Редактировать</button>` : ""}
        </div>
        ${kpiHtml()}

        <div class="pg-tabs">
          ${tabs.map(([k, t, n]) => `
            <button type="button" class="pg-tab${tab === k ? " on" : ""}${
              k === "docs" ? " far" : ""}"
                    data-tab="${k}">${t}${n ? ` <i>${n}</i>` : ""}</button>`).join("")}
          <button type="button" class="pg-tab-min" data-mini="1"
            title="Свернуть шапку — больше места под работу" aria-label="Свернуть шапку">${ICO.chev}</button>
        </div>
        <div class="pg-body">${
          tab === "contract" ? filesHtml("contract", "Загрузить договор",
                "Договоры, калькуляции, дополнительные соглашения. "
                + "Калькуляцию можно разобрать так же, как спецификацию.") + vdcHtml()
            : tab === "docs" ? docsHtml()
            : tab === "pto" ? '<div class="pto-host" id="ptoHost"></div>'
            : tab === "files" ? '<div class="fl-host" id="filesHost"></div>'
            : tab === "orders" && typeof REQ === "object" && allow("req") ? '<div id="reqHost"></div>'
            : tab === "match" ? matchHtml() : soonHtml(tab)}</div>
        <div class="pg-note" id="sitNote" hidden></div>
      </div>`;
  }

  /* Метка редакции у файла. Видно сразу, действующая это бумага или
     прежняя, — иначе в списке из пяти калькуляций непонятно, по какой
     сейчас работают. */
  function docRevTag(d) {
    const r = d.revision_id && REVS.find((x) => x.id === d.revision_id);
    if (r) {
      return `<span class="sit-revtag${r.current ? " on" : ""}">${
        esc(revOwnerName(r))} · ${esc(revLabel(r))}</span>`;
    }
    // Без редакции, но с привязкой к проекту или договору — показываем
    // хотя бы её: иначе непонятно, к чему бумага относится.
    const p = d.project_id && PROJECTS.find((x) => x.id === d.project_id);
    if (p) {
      return `<span class="sit-revtag">${esc(p.marks || p.code || "проект")}</span>`;
    }
    const c = d.contract_id && CONTRACTS.find((x) => x.id === d.contract_id);
    if (c) {
      return `<span class="sit-revtag">${esc(c.number || "договор")}</span>`;
    }
    return "";
  }

  /* Значок формата. Не украшение: в списке из десятка бумаг глаз ищет
     «где тут excel, который можно разобрать», и цвет отвечает на это
     быстрее, чем расширение в подписи. */
  function fileIcon(name) {
    const ext = (String(name).match(/\.([a-z0-9]+)$/i) || [, ""])[1].toLowerCase();
    const kind = ["xlsx", "xlsm", "xls", "csv"].includes(ext) ? "x"
      : ["doc", "docx", "rtf"].includes(ext) ? "w"
      : ext === "pdf" ? "p"
      : ["jpg", "jpeg", "png", "heic"].includes(ext) ? "i" : "f";
    return `<span class="fi fi-${kind}">${esc(ext.slice(0, 4) || "?")}</span>`;
  }

  /* Вкладка «Документы» — витрина, а не приёмник. Здесь смотрят всё, что
     есть по объекту, ищут и скачивают; кладут же из карточек проекта и
     договора, где привязка получается сама.

     Полоса с поиском строится один раз, список — на каждый набранный
     знак. Поле, в котором печатают, пересоздавать нельзя. */
  function docsHtml() {
    return `
      <div class="pg-bar">
        ${can() ? `<button type="button" class="btn-brand" id="sitUp">${
          ICO.up}Загрузить</button>` : ""}
        <label class="pg-find">${ICO.find}
          <input id="docSearch" placeholder="Название файла"
                 value="${esc(docSearch)}"></label>
        <select class="role-sel" id="docKind">
          <option value="">Все виды</option>
          ${KINDS.map(([k, t]) => `<option value="${k}"${
            docKind === k ? " selected" : ""}>${t}</option>`).join("")}
        </select>
        <span class="sit-hint" id="docCount"></span>
      </div>
      <div id="docList"></div>`;
  }

  function visibleDocs() {
    const q = docSearch.trim().toLowerCase();
    return DOCS.filter((d) => {
      if (docKind && d.kind !== docKind) return false;
      if (!q) return true;
      return ((d.title || "") + " " + (d.filename || "")).toLowerCase().includes(q);
    });
  }

  function paintDocs() {
    const host = $s("#docList");
    if (!host) return;
    const rows = visibleDocs();
    const cnt = $s("#docCount");
    if (cnt) {
      cnt.textContent = rows.length === DOCS.length
        ? `${DOCS.length} ${plural(DOCS.length, "документ", "документа", "документов")}`
        : `${rows.length} из ${DOCS.length}`;
    }
    // Группируем по виду, пока не отсеяли: разложенный список читается
    // лучше. При поиске группы мешают — там нужен один плоский ответ.
    const flat = !!(docSearch.trim() || docKind);
    const groups = flat
      ? [["", rows]]
      : KINDS.map(([k, label]) => [label, rows.filter((d) => d.kind === k)])
             .filter(([, list]) => list.length);

    host.innerHTML = rows.length ? groups.map(([label, list]) => `
        <div class="pg-group">${label ? `<h4>${esc(label)}</h4>` : ""}
          ${docTable(list)}
        </div>`).join("")
      : `<div class="pg-empty"><b>${DOCS.length
          ? "Ничего не нашлось" : "Документов ещё нет"}</b>${DOCS.length
          ? "Попробуйте другое написание или снимите фильтр по виду."
          : "Здесь видно все бумаги объекта разом. Проекты и спецификации"
            + " грузят в разделе «Тендер», договоры и калькуляции — во"
            + " вкладке «Договор»; сюда попадает и то, и другое, и всё"
            + " остальное: письма, акты, фотографии."}</div>`;
    wireDocs(host);
  }

  /* Файл выглядит одинаково в любой вкладке: иконка, подпись, кто и
     когда положил, действия. Отличается только то, какие файлы попали в
     список, — поэтому строка живёт отдельно от того, кто её показывает. */
  function docTable(list) {
    /* Колонки статуса больше нет: статусы спецификаций убраны 07.10.2026,
       статус один — у объекта в «Тендере». Признак остался у строк. */
    const st = false;
    return `
      <table class="tbl sit-docs" style="--tbl-min:${st ? 918 : 810}px">
        <colgroup><col>${st ? '<col style="width:108px">' : ""}<col style="width:135px">
          <col style="width:241px"></colgroup>
        <tbody>${list.map((d) => docRow(d, st) + termsRow(d, st) + childRow(d, st)).join("")}</tbody>
      </table>`;
  }

  /* Присланный файл. Его не меняют — по нему работают, поэтому действие
     здесь одно главное: достать из него таблицу. Скачать и убрать —
     обслуживание, им хватает значков. */
  function docRow(d, st) {
    const spec = d.kind === "project";
    if ((d.combo || []).length) return comboRow(d, st);
    // Файл открывается щелчком по названию (заказчик, 08.10.2026): PDF и
    // картинки — в новой вкладке, Word и Excel браузер не показывает — скачиваем.
    const file = !!(d.filename && d.size);
    const tag = file ? "button" : "div";
    return `
      <tr data-doc="${esc(d.id)}"${d.positions ? ' class="has-kid"' : ""}>
        <td><${tag}${file ? ` type="button" data-fopen title="${esc(docViewable(d.filename)
            ? "Открыть в новой вкладке" : "Скачать — Word и Excel браузер не показывает")}"` : ""}
          class="sit-doc${file ? " sit-doc-open" : ""}">
          ${fileIcon(d.filename)}
          <span class="sit-doc-t">
            <b>${esc(d.title || d.filename)}${docRevTag(d)}</b>
            <i>${esc(d.filename)} · ${fmtSize(d.size)}${
              d.doc_date ? " · " + esc(d.doc_date) : ""}${
              d.version ? " · " + esc(d.version) : ""}</i>
          </span></${tag}></td>
        ${st ? '<td class="sit-st"></td>' : ""}
        <td class="sit-who">${esc(d.author)}<i>${
          esc(d.at || "").slice(0, 10)}</i></td>
        <td class="acts">
          ${termsAble(d) && !d.terms ? `<button type="button"
             class="btn-ghost sm" data-terms
             title="Вытащить из договора сроки, аванс, приёмку, оплату и штрафы">${
             ICO.terms}Условия договора</button>` : ""}
          ${d.parsable && can() && !d.positions && !termsAble(d) ? `<button type="button"
             class="btn-ghost sm" data-parse
             title="Найти в файле таблицу и вытащить из неё позиции">${
             ICO.extract}${spec ? "Извлечь спецификацию"
                                : "Извлечь позиции"}</button>` : ""}
          <button type="button" class="ico" data-dl
                  title="Скачать файл">${ICO.down}</button>
          ${can() ? `<button type="button" class="ico warn" data-rm
             title="Убрать документ">${ICO.trash}</button>` : ""}</td>
      </tr>`;
  }

  /* ── сводная калькуляция ─────────────────────────────────────
     Заказчик 07.10.2026: «объединить все спецификации проектов в одну
     калькуляцию — выбрать все проекты и сформировать». По томам: раздел на
     каждый проект, под ним его строки; «Обновить из проектов» пересобирает
     строки, а вписанное в сводной остаётся. Файла у неё нет — это наш
     документ, поэтому ни «Скачать», ни «Извлечь». */
  const comboPart = (fn) => {
    const stem = String(fn || "").replace(/\.[^.]+$/, "").replace(/[\s_]*(изм\.?|изменение)\s*\d*\s*$/i, "");
    const tail = stem.split(/[-–]/).pop().trim();
    return tail && tail.length <= 10 && !/\s/.test(tail) ? tail : stem.slice(0, 40);
  };

  function comboRow(d, st) {
    const parts = (d.combo || []).map((id) => DOCS.find((x) => x.id === id))
      .map((x) => (x ? comboPart(x.filename) : "удалён"));
    return `
      <tr data-doc="${esc(d.id)}"${d.positions ? ' class="has-kid"' : ""}>
        <td><div class="sit-doc">
          <span class="fi fi-combo" title="Сводная калькуляция">Σ</span>
          <span class="sit-doc-t">
            <b>${esc(d.title || "Сводная калькуляция")}</b>
            <i title="${esc(parts.join(", "))}">сводная из ${parts.length} ${plural(parts.length, "проекта",
              "проектов", "проектов")}: ${esc(parts.join(", "))}</i>
          </span></div></td>
        ${st ? '<td class="sit-st"></td>' : ""}
        <td class="sit-who">${esc(d.author)}<i>${esc(d.at || "").slice(0, 10)}</i></td>
        <td class="acts">
          ${can() ? `<button type="button" class="btn-ghost sm" data-combo-up
             title="Строки — заново из спецификаций проектов; цены и правки сводной остаются"
             >${ICO.again}Обновить из проектов</button>
            <button type="button" class="ico warn" data-rm title="Убрать сводную">${ICO.trash}</button>` : ""}</td>
      </tr>`;
  }

  /* Какие страницы проекта разбирать — то же, что окно «Извлечь
     спецификацию» отмечает само: первый лист книги или в PDF группа
     листов с самым большим числом позиций. null — разбирать нечего. */
  async function autoSheets(d) {
    const pdf = /\.pdf$/i.test(d.filename || "");
    const sheets = (await AUTH.api("GET", "/documents/" + d.id + "/sheets")).sheets;
    const withTable = sheets.filter((x) => x.table && !(pdf && !x.header_row));
    if (!withTable.length) return null;
    if (pdf && withTable.every((x) => x.group)) {
      const weight = {};
      withTable.forEach((x) => { weight[x.group] = (weight[x.group] || 0) + (x.spec ? x.header_row : 0); });
      const best = withTable.reduce((a, x) => (weight[x.group] > weight[a.group] ? x : a), withTable[0]).group;
      return withTable.filter((x) => x.group === best).map((x) => x.name);
    }
    return [withTable[0].name];
  }

  function comboDialog() {
    const list = DOCS.filter((d) => d.kind === "project" && !(d.combo || []).length);
    const box = document.createElement("div");
    box.className = "pf-modal";
    box.innerHTML = `
      <div class="pf-crop cnt-card combo-card" role="dialog" aria-label="Сводная калькуляция">
        <h3>Сводная калькуляция</h3>
        <div class="note" style="margin-bottom:9px">Одна калькуляция из спецификаций выбранных проектов:
          по разделу на проект, под ним — его строки с ценами. У сводной свои цены, версии и выгрузка;
          «Обновить из проектов» пересоберёт строки, вписанное в сводной останется. Где спецификация
          ещё не извлечена — извлечём сами.</div>
        <label class="combo-all"><input type="checkbox" id="cbAll" checked> <b>Все проекты</b>
          <i>${list.length}</i></label>
        <div class="combo-list">${list.map((d) => `
          <label class="combo-it"><input type="checkbox" name="cb" value="${esc(d.id)}" checked>
            <b>${esc(comboPart(d.filename))}</b><span>${esc(d.title || d.filename)}</span>
            <i>${d.positions ? `${d.positions} ${plural(d.positions, "позиция", "позиции", "позиций")}`
              : d.parsable ? "извлечём спецификацию" : "не разбирается — пропустим"}</i></label>`).join("")}
        </div>
        <div class="pf-note" id="cbProg" hidden></div>
        <div class="pf-note bad" id="cbErr" hidden></div>
        <div class="cnt-acts">
          <button type="button" class="btn ghost" id="cbNo">Отмена</button>
          <button type="button" class="btn" id="cbOk">Сформировать</button>
        </div>
      </div>`;
    document.body.appendChild(box);
    const close = () => box.remove();
    $s("#cbNo", box).addEventListener("click", close);
    box.addEventListener("click", (e) => { if (e.target === box) close(); });
    const all = $s("#cbAll", box);
    const items = () => [...box.querySelectorAll("input[name=cb]")];
    all.addEventListener("change", () => items().forEach((x) => { x.checked = all.checked; }));
    box.addEventListener("change", (e) => {
      if (e.target.name !== "cb") return;
      const on = items().filter((x) => x.checked).length;
      all.checked = on === items().length;
      all.indeterminate = on > 0 && on < items().length;
    });
    $s("#cbOk", box).addEventListener("click", async () => {
      const ids = items().filter((x) => x.checked).map((x) => x.value);
      const err = $s("#cbErr", box), prog = $s("#cbProg", box), ok = $s("#cbOk", box);
      err.hidden = true;
      if (ids.length < 2) { err.textContent = "Отметьте хотя бы два проекта"; err.hidden = false; return; }
      ok.disabled = true;
      FRESH.hold();
      const bad = [];
      const tr = TRACE.start({ kind: "combo" });
      try {
        const todo = ids.map((id) => DOCS.find((d) => d.id === id)).filter((d) => d && !d.positions && d.parsable);
        for (let i = 0; i < todo.length; i++) {
          const d = todo[i];
          prog.hidden = false;
          prog.textContent = `Извлекаю спецификацию ${i + 1} из ${todo.length}: ${comboPart(d.filename)}…`;
          tr.progress(i, todo.length, comboPart(d.filename));
          try {
            const sh = await autoSheets(d);
            if (!sh) { bad.push(comboPart(d.filename) + " — таблица не нашлась"); continue; }
            await AUTH.api("POST", "/documents/" + d.id + "/parse", { sheets: sh });
          } catch (e) {
            bad.push(comboPart(d.filename) + " — " + e.message);
          }
        }
        prog.hidden = false;
        prog.textContent = "Собираю сводную…";
        tr.step("Собираю сводную калькуляцию");
        const r = await AUTH.api("POST", "/sites/" + encodeURIComponent(openId) + "/combo", { doc_ids: ids });
        tr.done(`Сводная собрана: ${r.rows} ${plural(r.rows, "строка", "строки", "строк")}`
          + (bad.length ? `, не извлеклось: ${bad.length}` : ""));
        close();
        await loadOne(openId);
        await openPositions(r.id);
        note(`Сводная калькуляция собрана: ${r.rows} ${plural(r.rows, "строка", "строки", "строк")}.`
          + (r.empty && r.empty.length ? ` Без спецификации: ${r.empty.map(comboPart).join(", ")}.` : "")
          + (bad.length ? ` Не извлеклось: ${bad.join("; ")}.` : "")
          + " Цены — как в проектах; подтянуть недостающие — «Подтянуть материалы»");
      } catch (e) {
        tr.fail("Не получилось: " + e.message);
        err.textContent = e.message;
        err.hidden = false;
        ok.disabled = false;
        prog.hidden = true;
      } finally {
        FRESH.release();
      }
    });
  }

  async function comboRefresh(docId, btn) {
    if (btn) btn.disabled = true;
    try {
      const r = await AUTH.api("POST", "/documents/" + encodeURIComponent(docId) + "/combo/refresh", {});
      if (openDoc && openDoc.id === docId) await openPositions(docId);
      else { await loadOne(openId); render(); }
      note(`Сводная обновлена: ${r.rows} ${plural(r.rows, "строка", "строки", "строк")}. Цены и правки сводной — на месте`
        + (r.empty && r.empty.length ? `. Без спецификации: ${r.empty.map(comboPart).join(", ")}` : "")
        + (r.gone ? `. Убранных проектов: ${r.gone}` : ""));
    } catch (e) {
      note("Не обновилось: " + e.message, true);
    } finally {
      if (btn) btn.disabled = false;
    }
  }

  /* Договор, из которого можно вытащить условия: PDF или DOCX. У такого
     договора кнопки «Извлечь позиции» нет: она ищет таблицу позиций, как
     в спецификации, а в тексте договора её нет — человек получал отказ
     «спецификация не нашлась» (пользователь, 24.09.2026). Позиции
     извлекаются из калькуляций книгой Excel. */
  const termsAble = (d) => d.kind === "contract" && /\.(pdf|docx)$/i.test(d.filename || "");

  /* Разобранные условия — строкой под договором, как расчёт под
     спецификацией: это уже наш документ, выросший из присланного. */
  function termsRow(d, st) {
    if (!d.terms) return "";
    return `
      <tr class="kid" data-doc="${esc(d.id)}">
        <td><div class="sit-doc">
          <span class="fi fi-terms">${ICO.terms}</span>
          <span class="sit-doc-t">
            <b>Условия договора</b>
            <i>сроки, аванс, приёмка, ИД, оплата, штрафы</i>
          </span></div></td>
        ${st ? '<td class="sit-st"></td>' : ""}
        <td class="sit-who"></td>
        <td class="acts">
          <button type="button" class="btn-brand sm" data-terms
            >Открыть условия${ICO.go}</button></td>
      </tr>`;
  }

  /* Что из файла достали. Отдельной строкой под ним, а не второй кнопкой
     рядом: это уже наш документ — таблица позиций, куда подтянуты цены и
     где считается калькуляция. Присланный файл ей родитель, и держать их
     врозь значит потерять, откуда что взялось. */
  function childRow(d, st) {
    if (!d.positions) return "";
    const spec = d.kind === "project";
    const vers = d.versions || [];
    // В «Объектах» расчёт спецификации — ссылкой в «Тендер»: считают там.
    if (spec && MODE === "obj") {
      return `
      <tr class="kid" data-doc="${esc(d.id)}">
        <td><div class="sit-doc">
          <span class="fi fi-calc">${ICO.table}</span>
          <span class="sit-doc-t">
            <b>${(d.combo || []).length ? "Сводный расчёт" : "Спецификация и расчёт"}</b>
            <i>${d.positions} ${plural(d.positions, "позиция", "позиции", "позиций")}${vers.length
              ? ` · ${vers.length} ${plural(vers.length, "версия", "версии", "версий")}` : ""} — в разделе «Тендер»</i>
          </span></div></td>
        ${st ? '<td class="sit-st"></td>' : ""}
        <td class="sit-who"></td>
        <td class="acts">${allow("tnd_obj") ? `<button type="button" class="btn-ghost sm" data-pos
          >Открыть в Тендере${ICO.go}</button>` : ""}</td>
      </tr>`;
    }
    // Дерево сверху вниз, как история: сначала зафиксированные версии по
    // порядку, внизу — текущий расчёт, который живёт дальше.
    return `${vers.map((v) => verRow(d, v, st)).join("")}
      <tr class="kid" data-doc="${esc(d.id)}">
        <td><div class="sit-doc">
          <span class="fi fi-calc">${ICO.table}</span>
          <span class="sit-doc-t">
            <b>${(d.combo || []).length ? "Сводный расчёт" : spec ? "Спецификация и расчёт" : "Позиции и расчёт"}${
              vers.length ? '<span class="sit-cur">текущая</span>' : ""}</b>
            <i>${d.sheet ? esc(d.sheet) + " · " : ""}${d.positions} ${
              plural(d.positions, "позиция", "позиции", "позиций")}${d.supply
              ? ` · <span class="sit-supply">${ICO.truck}${esc(supplyLabel(d).toLowerCase())} у снабжения</span>` : ""}</i>
          </span></div></td>
        ${st ? '<td class="sit-st"></td>' : ""}
        <td class="sit-who"></td>
        <td class="acts">
          <button type="button" class="btn-brand sm" data-pos
            >Открыть расчёт${ICO.go}</button>
          ${vers.length ? `<button type="button" class="ico" data-cmp-all
             title="Сравнить версии калькуляции">${ICO.cmp}</button>` : ""}
          ${d.parsable && can() ? `<button type="button" class="ico" data-parse
             title="Извлечь заново: позиции заменятся, свои цены останутся"
             >${ICO.again}</button>` : ""}</td>
      </tr>`;
  }

  /* Зафиксированная версия калькуляции — строкой под расчётом, в том же
     дереве: имя, когда и кем зафиксирована, итог с НДС. Открывается той же
     таблицей с замком; сравнивается с текущей; убирается. */
  const dmyOf = (s) => String(s || "").slice(0, 10).split("-").reverse().join(".");
  function verRow(d, v, st) {
    const t = v.totals || {};
    return `
      <tr class="kid ver" data-doc="${esc(d.id)}" data-ver="${esc(v.id)}">
        <td><div class="sit-doc">
          <span class="fi fi-ver" title="Зафиксированная версия — не меняется">${ICO.lock}</span>
          <span class="sit-doc-t">
            <b>${esc(v.name)}</b>
            <i>${esc(dmyOf(v.at))}${v.author ? ", " + esc(v.author) : ""}${
              t.sum_with_vat ? " · " + money(t.sum_with_vat) + " с НДС" : ""}${
              v.note ? " · " + esc(v.note) : ""}</i>
          </span></div></td>
        ${st ? '<td class="sit-st"></td>' : ""}
        <td class="sit-who"></td>
        <td class="acts">
          <button type="button" class="btn-ghost sm" data-ver-open>Открыть${ICO.go}</button>
          <button type="button" class="ico" data-ver-cmp title="Сравнить с текущим расчётом"
            >${ICO.cmp}</button>
          ${can() ? `<button type="button" class="ico warn" data-ver-del
             title="Убрать версию">${ICO.trash}</button>` : ""}</td>
      </tr>`;
  }

  /* ── вкладка «Тендер» ─────────────────────────────────────
     Ради неё раздел и затевался, и порядок здесь — это порядок работы:
     положили проект, разобрали спецификацию, подтянули цены, получили
     калькуляцию. Поэтому вкладка первая и открывается по умолчанию. */
  function tenderHtml() {
    const list = DOCS.filter((d) => d.kind === "project");
    const parsed = list.filter((d) => d.positions);
    /* Разобранная калькуляция договора — тоже расчёт объекта: у иного
       объекта другого и нет. Показываем отдельной группой под спецификациями. */
    const calcs = DOCS.filter((d) => d.kind === "contract" && d.positions);
    return `
      <div class="pg-bar">
        ${can() ? `<button type="button" class="btn-brand" data-upkind="project"
          >${ICO.up}Загрузить спецификацию</button>` : ""}
        ${can() ? `<button type="button" class="btn-ghost" id="wrkGo"
          >${ICO.price}Расценки на работы</button>` : ""}
        ${can() ? `<button type="button" class="btn-ghost" id="spUp"
          title="Цены этого объекта: щиты от дочки и прайс поставщика по договору"
          >${ICO.pin}Цены объекта</button>` : ""}
        ${can() && list.filter((d) => !(d.combo || []).length).length > 1 ? `<button type="button"
          class="btn-ghost" id="comboGo" title="Одна калькуляция из спецификаций нескольких проектов: по разделу на проект"
          >${ICO.table}Сводная калькуляция</button>` : ""}
        <span class="sit-hint">${parsed.length
          ? `спецификация извлечена из ${parsed.length} ${
            plural(parsed.length, "файла", "файлов", "файлов")} из ${list.length}`
          : list.length ? "спецификация ещё не извлечена" : ""}</span>
      </div>
      ${list.length ? docTable(list) : `
        <div class="pg-empty"><b>Начните со спецификации</b>
          Загрузите проект — PDF или Excel. Дальше «Извлечь
          спецификацию»: Трейс найдёт в нём таблицу позиций и достанет
          её. Под файлом появится строка расчёта — там цены поставщиков,
          свои расценки на работы и калькуляция.</div>`}
      ${calcs.length ? `<div class="pg-group"><h4>Калькуляции из договора</h4>${docTable(calcs)}</div>` : ""}
      ${spBlockHtml(parsed.length > 0)}`;
  }

  /* Вкладка одного вида бумаг: сами файлы, а не записи о них. */
  function filesHtml(kind, btn, empty) {
    const list = DOCS.filter((d) => d.kind === kind);
    return `
      <div class="pg-bar">
        ${can() ? `<button type="button" class="btn-brand" data-upkind="${kind}"
          >${ICO.up}${btn}</button>` : ""}
        <span class="sit-hint">${list.length
          ? `${list.length} ${plural(list.length, "файл", "файла", "файлов")}`
          : ""}</span>
      </div>
      ${list.length ? docTable(list)
        : `<div class="pg-empty"><b>Пока пусто</b>${empty}</div>`}`;
  }

  /* ── ВДЦ — ведомость договорной цены ──────────────────────────
     Заказчик 07.10.2026: во вкладке «Договор» — блок ВДЦ: загрузить из
     Excel или взять из тендера, «когда нажмём кнопку Зафиксировать».
     Ведомость — копия на момент создания: расчёт и версия дальше живут
     своей жизнью. Свежая — действующая, прежние остаются историей. */
  let VDC = null;                 // {site, rows, versions}
  let vdcReplace = "";            // какую ВДЦ сменит загружаемая (правка № 37)
  const vdcCache = {};            // строки по id
  let vdcMats = false;            // материалы работ КЛК — показаны
  /* Вид документа договорной цены (заказчик, 13.10.2026): «ВДЦ — у
     большинства заказчиков, у некоторых РДЦ — расчёт договорной цены, у
     иных КЛК — калькуляция; при загрузке выбрать, чтобы платформа
     знала, к чему готовиться». */
  const VDC_KINDS = [
    ["vdc", "ВДЦ", "Ведомость договорной цены — у большинства заказчиков. Книга Excel."],
    ["rdc", "РДЦ", "Расчёт договорной цены — у некоторых заказчиков. Книга Excel."],
    ["klk", "КЛК", "Калькуляция заказчика: PDF из ЭДО — работы с материалами, ЕП и секции, условия; или Excel."],
  ];

  function vdcHtml() {
    const ed = can();
    const vers = VDC && VDC.site === openId ? VDC.versions : [];
    const head = `
      <div class="vdc-h">
        <div class="vdc-t0"><b>ВДЦ — ведомость договорной цены</b>
          <i>что вошло в цену договора: позиции, цены материала и работы, суммы</i></div>
        <span class="grow"></span>
        ${ed ? `<button type="button" class="btn-ghost sm" id="vdcXls" title="ВДЦ, РДЦ или КЛК — Excel или PDF"
          >${ICO.up}Загрузить</button>
          <select class="role-sel vdc-ver" id="vdcVer"${vers.length ? "" : " disabled"}
            title="Зафиксированная версия расчёта из «Тендера»">
            <option value="">${vers.length ? "Из тендера — версия…" : "Из тендера — версий нет"}</option>
            ${vers.map((v) => `<option value="${esc(v.id)}">${esc(v.name)} · ${esc(v.doc)} · ${
              esc(dayRu(v.at))}${v.sum_with_vat != null ? " · " + money(v.sum_with_vat) : ""}</option>`).join("")}
          </select>` : ""}
      </div>`;
    if (!VDC || VDC.site !== openId) return `<section class="vdc">${head}<div class="vdc-empty">Загружаю…</div></section>`;
    if (VDC.error) return `<section class="vdc">${head}<div class="vdc-empty">Не загрузилось: ${esc(VDC.error)}</div></section>`;
    if (!VDC.rows.length) {
      return `<section class="vdc">${head}<div class="vdc-empty">ВДЦ ещё нет. Загрузите ВДЦ, РДЦ
        или калькуляцию заказчика (КЛК, PDF) или возьмите зафиксированную версию расчёта. В расчёте при
        «Зафиксировать» есть галочка «Сделать ВДЦ договора» — тогда ведомость появится здесь сама.</div></section>`;
    }
    // Без пометки действующая — самая свежая из не помеченных прежними.
    const fresh = (VDC.rows.find((v) => v.status !== "old") || {}).id;
    return `<section class="vdc">${head}${VDC.rows.map((v) => vdcItem(v, v.id === fresh)).join("")}</section>`;
  }

  const dayRu = (at) => {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(at || "");
    return m ? `${m[3]}.${m[2]}.${m[1]}` : "";
  };

  /* Шапка КЛК: договор, объект, раздел, условия и сверка сумм. */
  function klkMeta(m) {
    const pct = (x) => `${String(x).replace(".", ",")} %`;
    const terms = [
      m.advance_pct != null ? `аванс ${pct(m.advance_pct)}` : "",
      m.retention_pct != null ? `гарантийное удержание ${pct(m.retention_pct)}${m.retention_sum != null
        ? " — " + money(m.retention_sum) : ""}${m.retention_months ? ` на ${m.retention_months} мес.` : ""}` : "",
      m.gp_pct != null ? `генподрядный ${pct(m.gp_pct)}${m.gp_sum != null ? " — " + money(m.gp_sum) : ""}` : "",
      m.start || m.end ? `работы ${m.start ? "с " + dayRu(m.start) : ""}${m.end ? " по " + dayRu(m.end) : ""}` : "",
    ].filter(Boolean);
    const head = [m.contract ? `договор № ${m.contract}${m.contract_date ? " от " + dayRu(m.contract_date) : ""}` : "",
      m.object || "", m.system || ""].filter(Boolean);
    const checks = m.checks || [];
    return `<div class="vdc-klk">
      ${head.length ? `<div class="vdc-klk-h">${head.map(esc).join(" · ")}</div>` : ""}
      ${terms.length ? `<div class="vdc-klk-t">${terms.map((x) => `<span>${esc(x)}</span>`).join("")}</div>` : ""}
      <div class="vdc-klk-c${checks.length ? " bad" : ""}">${checks.length
        ? `Суммы не сходятся: ${checks.map(esc).join("; ")}`
        : "Сверка: работы, материалы и итог по строкам сходятся с итогами документа"}</div>
    </div>`;
  }

  /* Действующая или прежняя (правка № 21, 22.10.2026): у объекта бывает
     несколько действующих ВДЦ сразу — общая слаботочка, ЭОМ, КЖ. Пометка
     руками главнее; без неё, как раньше, свежая — действующая. */
  function vdcItem(v, fresh) {
    const cur = v.status ? v.status === "current" : fresh;
    const by = v.replaced_by && VDC.rows.find((x) => x.id === v.replaced_by);
    const t = v.totals || {};
    const m = v.meta || {};
    return `<div class="vdc-item${cur ? " cur" : ""}" data-vdc="${esc(v.id)}">
      <div class="vdc-row">
        <div class="vdc-t"><b title="${esc(v.name)}"><span class="vdc-kind k-${esc(v.kind || "vdc")}">${esc(v.kind_name || "ВДЦ")}</span>${
          esc(v.name)}</b>${can() ? `<button type="button" class="vdc-st${cur ? "" : " old"}" data-vst
            title="${v.status ? "Отмечено руками" : "Без пометки: действующая — самая свежая"}. Щёлкните, чтобы поменять"
            >${cur ? "действующая" : "прежняя"}${ICO.chev}</button>` : cur ? '<em>действующая</em>' : '<em class="old">прежняя</em>'}${
            by ? `<i class="vdc-by">заменена ведомостью «${esc(by.name)}»</i>` : ""}${
            v.status === "old" && v.old_reason ? `<i class="vdc-by" title="${esc(v.old_reason)}">причина: ${esc(v.old_reason)}</i>` : ""}
          <i>${vdcSrc(v)}</i></div>
        ${vdcSums(t)}
        <div class="vdc-acts">
          <button type="button" class="btn-ghost sm" data-vopen title="Ведомость на весь экран — как проработка в «Снабжении»"
            >${ICO.table}Открыть</button>
          <button type="button" class="btn-ghost sm" data-vsys
            title="По системам: какие системы в ведомости и по каждой — позиции без повторов с общим объёмом"
            >${ICO.filter}Разобрать</button>
          ${vdcSupBtns(v)}
          <button type="button" class="ico" data-vxls title="Ведомость в Excel" aria-label="Ведомость в Excel">${ICO.down}</button>
          ${v.has_file ? `<button type="button" class="ico" data-vfile title="Исходный файл — книга, из которой загружена"
            aria-label="Исходный файл">${ICO.terms}</button>` : ""}
        </div>
      </div>
      ${v.kind === "klk" && (m.number || m.checks) ? klkMeta(m) : ""}
    </div>`;
  }

  const vdcSrc = (v) => {
    const t = v.totals || {};
    const klk = v.kind === "klk";
    return `${v.source === "xlsx" ? `из Excel · ${esc(v.filename)}` : v.source === "pdf" ? `из PDF · ${esc(v.filename)}`
      : "из тендера"} · ${esc(dayRu(v.at))}${v.author ? " · " + esc(v.author) : ""} · ${t.count || 0} ${
      plural(t.count || 0, klk ? "работа" : "позиция", klk ? "работы" : "позиции", klk ? "работ" : "позиций")}`;
  };

  const vdcSums = (t) => `
    <div class="vdc-sums">
      <span><i>Материалы</i>${money(t.sum_buy)}</span>
      <span><i>Работы</i>${money(t.sum_work)}</span>
      <span class="w"><i>С НДС</i>${money(t.sum_with_vat)}</span>
      <span><i>в т.ч. НДС ${esc(String(t.vat ?? ""))}%</i>${money(t.sum_vat)}</span>
      <span><i>Без НДС</i>${money(t.sum_net)}</span>
    </div>`;

  /* «В проработку» у каждой ВДЦ (правка № 25, 23.10.2026). Передана — где
     она у снабжения, «передать заново» и переход в «Снабжение». */
  const vdcCanSup = () => allow("tnd_obj") || allow("snb_proc");
  function vdcSupBtns(v) {
    if (!vdcCanSup()) return "";
    const s = v.supply;
    if (!s) {
      return `<button type="button" class="btn-brand sm" data-vsup
        title="Эту ВДЦ — в снабжение: в проработку (выбор поставщиков по позициям, со сроком и ответственным) или сразу в работу"
        >${ICO.truck}В проработку</button>`;
    }
    return `<span class="vdc-sup${s.work ? " w" : ""}">${s.work ? "в работе с " + esc(dayRu(s.work))
      : "в проработке" + (s.due ? " до " + esc(dayRu(s.due)) : "")}${s.table === "systems" ? " · по системам" : ""}</span>
      <button type="button" class="ico" data-vsup aria-label="Передать заново"
        title="Передать заново: цены ВДЦ зафиксируются новой версией; цены поставщиков, выбор и поставки останутся"
        >${ICO.again}</button>
      ${allow("snb_proc") ? `<button type="button" class="btn-ghost sm" data-vsgo title="Открыть в «Снабжении»"
        >Снабжение${ICO.go}</button>` : ""}`;
  }

  function vdcSupply(v) {
    if (typeof SNAB !== "object") return;
    const s = v.supply;
    const site = SITES_ROWS.find((x) => x.id === openId) || {};
    SNAB.handover({
      title: "ВДЦ — в снабжение", sub: [site.name, v.name].filter(Boolean).join(" · "),
      modes: ["contract", "work"], mode: s && s.work ? "work" : "contract",
      have: s ? { contract: s } : {},
      // Какую таблицу (правка № 40, 23.10.2026): как в ВДЦ или по системам.
      pick: { key: "table", title: "Какую таблицу выгрузить", value: (s && s.table) || "rows", items: [
        ["rows", "Ведомостью", "строки как в ВДЦ, с разделами и повторами по секциям"],
        ["systems", "По системам", "системы разделами, позиции без повторов с общим количеством"]] },
      ok: s ? "Передать заново" : "Передать",
      submit: async (data) => {
        const r = await AUTH.api("POST", "/vdc/" + encodeURIComponent(v.id) + "/supply", data);
        await loadVdc();
        vfPaint();
        const sent = r.notified && r.notified.sent ? " Ответственному ушло сообщение в мессенджер."
          : r.notified && r.notified.error ? ` Сообщение не ушло: ${r.notified.error}.` : "";
        const text = `${r.again ? "Обновлено" : "Передано"} ${r.mode === "work" ? "в рабочую (и в проработку)"
          : "в проработку"}: цены ВДЦ зафиксированы версией «${r.version.name}», ${r.rows} ${
          plural(r.rows, "строка", "строки", "строк")}.` + (r.again ? " Цены поставщиков и поставки остались на своих позициях." : "")
          + (r.job ? " Справочные цены каталогов подтягиваются сами." : "") + sent;
        const go = () => { vfClose(); SNAB.open(r.id, r.mode === "work" ? "work" : "proc"); };
        if (vfBox) vfNote(text, allow("snb_proc") ? go : null);
        else noteGo(text, allow("snb_proc") ? "Открыть в Снабжении" : "", go);
      },
    });
  }

  /* «Открыть» — ведомость на весь экран, как проработка в «Снабжении»
     (правка № 26, 23.10.2026): шапка таблицы липнет, № и наименование
     примерзают слева, цены за единицу и суммы — двумя ярусами, поиск по
     строкам. «Разобрать» (правка № 29) — то же окно, вид «По системам»:
     система — от строки «Проект: …» до следующей, в ней каждая позиция
     одной строкой с общим количеством и суммами. У КЛК — уровни: ЕП
     (темнее) и секции, материалы работ — по кнопке: они уже в цене работы. */
  const VF = { id: "", mode: "rows", q: "", sys: {}, fold: new Set(), err: "" };
  let vfBox = null;

  function vdcFull(id, mode) {
    VF.id = id;
    VF.mode = mode || "rows";
    VF.q = "";
    VF.err = "";
    VF.fold = new Set();
    if (!vfBox) {
      vfBox = document.createElement("div");
      vfBox.className = "vdc-full";
      vfBox.setAttribute("role", "dialog");
      document.body.appendChild(vfBox);
      document.addEventListener("keydown", vfKey);
    }
    vfPaint();
    vfLoad();
  }

  // Esc закрывает окно, если поверх него нет своего окна («В проработку»).
  const vfKey = (e) => {
    if (e.key === "Escape" && vfBox && !document.querySelector(".pf-modal, .dlg-wrap")) vfClose();
  };

  function vfClose() {
    if (!vfBox) return;
    vfBox.remove();
    vfBox = null;
    document.removeEventListener("keydown", vfKey);
  }

  async function vfLoad() {
    const id = VF.id;
    try {
      if (VF.mode === "rows" && !vdcCache[id]) {
        vdcCache[id] = (await AUTH.api("GET", "/vdc/" + encodeURIComponent(id))).rows;
      }
      if (VF.mode === "sys" && !VF.sys[id]) {
        VF.sys[id] = await AUTH.api("GET", "/vdc/" + encodeURIComponent(id) + "/systems");
      }
    } catch (e) {
      VF.err = e.message;
    }
    if (VF.id === id) vfPaint();
  }

  function vfPaint() {
    if (!vfBox) return;
    const v = VDC && VDC.rows.find((x) => x.id === VF.id);
    if (!v) { vfClose(); return; }
    const sys = VF.mode === "sys";
    const d = sys ? VF.sys[v.id] : vdcCache[v.id];
    const klk = !sys && d && d.some((r) => r.kind === "mat");
    vfBox.setAttribute("aria-label", v.name);
    vfBox.innerHTML = `
      <div class="vdc-fh">
        <div class="vdc-t"><b title="${esc(v.name)}"><span class="vdc-kind k-${esc(v.kind || "vdc")}">${
          esc(v.kind_name || "ВДЦ")}</span>${esc(v.name)}</b><i>${vdcSrc(v)}</i></div>
        ${vdcSums(v.totals || {})}
        <button type="button" class="ico vdc-fx" data-vf-close title="Закрыть (Esc)" aria-label="Закрыть">${ICO.no}</button>
      </div>
      <div class="vdc-fbar">
        <span class="seg" role="tablist" aria-label="Вид">
          <button type="button" class="seg-b${sys ? "" : " on"}" role="tab" aria-selected="${!sys}" data-vf-mode="rows"
            >Ведомость</button>
          <button type="button" class="seg-b${sys ? " on" : ""}" role="tab" aria-selected="${sys}" data-vf-mode="sys"
            title="Позиции по системам — без повторов, с общим объёмом">По системам</button>
        </span>
        <label class="pg-find">${ICO.find}<input id="vfQ" type="search" placeholder="Позиция, марка, №"
          value="${esc(VF.q)}" autocomplete="off"></label>
        ${sys && d ? `<span class="vdc-fsum">${d.systems.length} ${plural(d.systems.length, "система", "системы", "систем")}
          · ${d.rows} ${plural(d.rows, "строка", "строки", "строк")} ведомости → ${d.unique} ${
          plural(d.unique, "позиция", "позиции", "позиций")} без повторов</span>` : ""}
        ${klk ? `<button type="button" class="lnk" data-vmats>${vdcMats ? "Свернуть материалы работ"
          : `Показать материалы работ (${d.filter((r) => r.kind === "mat").length})`}</button>` : ""}
        <span class="grow"></span>
        ${vdcSupBtns(v)}
        <button type="button" class="btn-ghost sm" data-vf-xls title="${sys ? "Разбор по системам" : "Ведомость"} книгой Excel"
          >${ICO.down}Excel</button>
        ${v.has_file && !sys ? `<button type="button" class="btn-ghost sm" data-vf-file
          title="Книга, из которой загружена">Исходный</button>` : ""}
      </div>
      <div class="vdc-fbody" id="vfBody">${vfBody(d)}</div>
      <div class="pg-note" id="vfNote" hidden></div>`;
    const on = (sel, fn) => vfBox.querySelectorAll(sel).forEach((b) => b.addEventListener("click", fn));
    on("[data-vf-close]", vfClose);
    on("[data-vf-mode]", (e) => {
      if (VF.mode === e.currentTarget.dataset.vfMode) return;
      VF.mode = e.currentTarget.dataset.vfMode;
      VF.err = "";
      vfPaint();
      vfLoad();
    });
    on("[data-vmats]", () => { vdcMats = !vdcMats; vfPaint(); });
    on("[data-vsup]", () => vdcSupply(v));
    on("[data-vsgo]", () => { vfClose(); SNAB.open(v.supply.id, v.supply.work ? "work" : "proc"); });
    on("[data-vf-xls]", (e) => DL.save("/api/vdc/" + encodeURIComponent(v.id) + (sys ? "/systems/xlsx" : "/xlsx"),
      { btn: e.currentTarget, body: {}, fallback: sys ? "ВДЦ по системам.xlsx" : "ВДЦ.xlsx",
        error: "Не удалось собрать книгу" }).catch((err) => vfNote(err.message, null, true)));
    on("[data-vf-file]", (e) => DL.save("/api/vdc/" + encodeURIComponent(v.id) + "/file",
      { btn: e.currentTarget, fallback: v.filename || "ВДЦ.xlsx" }).catch((err) => vfNote(err.message, null, true)));
    const qi = $s("#vfQ", vfBox);
    qi.addEventListener("input", () => {
      VF.q = qi.value;
      $s("#vfBody", vfBox).innerHTML = vfBody(sys ? VF.sys[v.id] : vdcCache[v.id]);
    });
    // Свернуть и развернуть систему — делегированием: тело перерисовывает поиск.
    $s("#vfBody", vfBox).addEventListener("click", (e) => {
      const db = e.target.closest("[data-dav]");
      if (db) { vdcDav(v, db); return; }
      const tr = e.target.closest("[data-vf-fold]");
      if (!tr) return;
      const i = Number(tr.dataset.vfFold);
      if (VF.fold.has(i)) VF.fold.delete(i); else VF.fold.add(i);
      $s("#vfBody", vfBox).innerHTML = vfBody(VF.sys[v.id]);
    });
  }

  /* «Д» у строки ведомости (правка № 46): разбор по системам после
     отметки перечитываем — сложенная строка давальческая, если такая хоть
     одна из её строк. */
  async function vdcDav(v, b) {
    const r = (vdcCache[v.id] || []).find((x) => x.id === b.dataset.dav);
    if (!r || b.disabled) return;
    b.disabled = true;
    try {
      await AUTH.api("POST", "/vdc/" + encodeURIComponent(v.id) + "/dav", { ids: [r.id], dav: !r.dav });
      r.dav = !r.dav;
      delete VF.sys[v.id];
      b.outerHTML = davMark(r.dav, r.id, true);
      vfNote(r.dav ? `«Д» — давальческий материал: «${r.name}». Отметка уйдёт и в снабжение`
        : `Отметка «Д» снята: «${r.name}»`);
    } catch (e) {
      b.disabled = false;
      vfNote("Не вышло: " + e.message, null, true);
    }
  }

  function vfNote(text, go, bad) {
    const box = vfBox && $s("#vfNote", vfBox);
    if (!box) return;
    box.classList.toggle("bad", !!bad);
    box.innerHTML = `<span>${esc(text)}</span>${go ? '<button type="button" class="btn-ghost sm">Открыть в Снабжении</button>' : ""}`;
    box.hidden = false;
    if (go) $s("button", box).addEventListener("click", go);
  }

  function vfBody(d) {
    if (VF.err) return `<div class="vdc-empty">Не загрузилось: ${esc(VF.err)}</div>`;
    if (!d) return '<div class="vdc-empty">Загружаю…</div>';
    const q = VF.q.trim().toLowerCase().replace(/ё/g, "е");
    const hit = (r) => !q || [r.name, r.brand, r.pos_no].some((x) => String(x ?? "").toLowerCase().replace(/ё/g, "е").includes(q));
    return VF.mode === "sys" ? vfSys(d, hit, q) : vfRows(d, hit, q);
  }

  const vfNum = (x, b) => `<td class="num${b ? " b" : ""}">${x != null ? money(x) : ""}</td>`;

  function vfHead(sys) {
    return `<colgroup><col class="v-no"><col class="v-name"><col class="v-brand"><col class="v-unit"><col class="v-qty">
        <col class="v-m"><col class="v-m"><col class="v-m"><col class="v-s"><col class="v-s"><col class="v-s">${
        sys ? '<col class="v-n">' : ""}</colgroup>
      <thead>
        <tr><th colspan="2" class="grp spec v-froze">${sys ? "Позиция" : "Спецификация"}</th><th colspan="3" class="grp spec"></th>
          <th colspan="3" class="grp">Цена за единицу, с НДС</th>
          <th colspan="3" class="grp">${sys ? "Всего по системе" : "Сумма"}, с НДС</th>${sys ? '<th class="grp"></th>' : ""}</tr>
        <tr><th class="v-no">№</th><th class="v-name">Наименование</th><th>Тип, марка</th><th>Ед.</th>
          <th class="num">${sys ? "Всего" : "Кол-во"}</th>
          <th class="num">Материалы</th><th class="num">Работа</th><th class="num">Итого</th>
          <th class="num">Материалы</th><th class="num">Работа</th><th class="num">Итого</th>${
          sys ? '<th class="num" title="Сколько строк ведомости сложено в эту">Строк</th>' : ""}</tr>
      </thead>`;
  }

  function vfItem(r, sys) {
    const mat = r.kind === "mat";
    return `<tr${mat ? ' class="vdc-mat"' : ""}><td class="v-no" title="${esc(String(r.pos_no ?? ""))}">${
        mat ? "" : esc(String(r.pos_no ?? ""))}</td>
      <td class="v-name">${davWrap(davMark(r.dav, r.id, !sys),
        `<span class="t-name" title="${esc(r.name)}">${esc(r.name)}</span>`)}</td>
      <td class="vdc-brand" title="${esc(r.brand || "")}">${mat && r.rate != null ? "расход " + numRu(r.rate) : esc(r.brand || "")}</td>
      <td>${esc(r.unit || "")}</td><td class="num">${r.qty != null ? numRu(r.qty) : ""}</td>
      ${vfNum(r.mat_unit)}${vfNum(r.work_unit)}${vfNum(r.unit_total)}
      ${vfNum(r.sum_buy)}${vfNum(r.sum_work)}${vfNum(r.sum_total, true)}${sys ? `<td class="num">${r.rows}</td>` : ""}</tr>`;
  }

  function vfRows(rows, hit, q) {
    const klk = rows.some((r) => r.kind === "mat");
    // В поиске разделы не нужны: найденные строки идут сплошным списком.
    const shown = rows.filter((r) => (r.kind !== "mat" || vdcMats) && (!q || (r.kind !== "section" && hit(r))));
    const items = shown.filter((r) => r.kind !== "section" && r.kind !== "mat");
    const sum = (k) => items.reduce((n, r) => n + (r[k] || 0), 0);
    return `<table class="tbl pos-tbl calc-tbl vdc-ftbl${klk ? " klk" : ""}">${vfHead(false)}
      <tbody>${shown.map((r) => r.kind === "section"
        ? `<tr class="sec${klk && !(r.level || 0) ? " ep" : ""}"><td class="v-no">${esc(r.pos_no || "")}</td>
            <td class="sec-name" colspan="9"><span class="vdc-fsec">${esc(r.name)}</span></td>${
            klk && r.sum_total != null ? vfNum(r.sum_total, true) : "<td></td>"}</tr>`
        : vfItem(r, false)).join("") || `<tr><td colspan="11" class="vdc-none">Ничего не нашлось</td></tr>`}</tbody>
      <tfoot><tr class="tot"><td class="v-no"></td><td class="v-name">${q ? "Итого по найденному" : "Итого"}</td>
        <td colspan="6"></td>${vfNum(sum("sum_buy"))}${vfNum(sum("sum_work"))}${vfNum(sum("sum_total"), true)}</tr></tfoot>
    </table>`;
  }

  function vfSys(d, hit, q) {
    const body = d.systems.map((s, i) => {
      const items = s.items.filter(hit);
      if (q && !items.length) return "";
      const fold = VF.fold.has(i) && !q;
      const ciph = s.ciphers.filter((c) => c !== s.code).join("; ");
      return `<tr class="sec vdc-sys${fold ? " fold" : ""}" data-vf-fold="${i}" title="${fold ? "Развернуть" : "Свернуть"}">
          <td class="v-no"><span class="vdc-fold">${ICO.chev}</span></td>
          <td class="sec-name" colspan="7"><span class="vdc-fsec"><b>${esc(s.code)}</b>${ciph ? `<i>${esc(ciph)}</i>` : ""}<em>${
            s.count} ${plural(s.count, "позиция", "позиции", "позиций")} из ${s.rows} ${plural(s.rows, "строки", "строк", "строк")}</em></span></td>
          ${vfNum(s.sum_buy)}${vfNum(s.sum_work)}${vfNum(s.sum_total, true)}<td></td></tr>
        ${fold ? "" : items.map((r) => vfItem(r, true)).join("")}`;
    }).join("");
    const all = (k) => d.systems.reduce((n, s) => n + (s[k] || 0), 0);
    return `<table class="tbl pos-tbl calc-tbl vdc-ftbl sys">${vfHead(true)}
      <tbody>${body || `<tr><td colspan="12" class="vdc-none">Ничего не нашлось</td></tr>`}</tbody>
      <tfoot><tr class="tot"><td class="v-no"></td><td class="v-name">Итого по системам</td>
        <td colspan="6"></td>${vfNum(all("sum_buy"))}${vfNum(all("sum_work"))}${vfNum(all("sum_total"), true)}<td></td></tr></tfoot>
    </table>`;
  }

  async function loadVdc() {
    const site = openId;
    try {
      const r = await AUTH.api("GET", "/sites/" + encodeURIComponent(site) + "/vdc");
      VDC = { site, ...r };
    } catch (e) {
      VDC = { site, rows: [], versions: [], error: e.message };
    }
    if (tab === "contract" && openId === site) render();
  }

  function wireVdc(host) {
    if (!VDC || VDC.site !== openId) { loadVdc(); return; }
    const xb = $s("#vdcXls", host);
    if (xb) xb.addEventListener("click", vdcUpload);
    const vs = $s("#vdcVer", host);
    if (vs) vs.addEventListener("change", async () => {
      if (!vs.value) return;
      try {
        const r = await AUTH.api("POST", "/sites/" + encodeURIComponent(openId) + "/vdc", { version_id: vs.value });
        VDC = { site: openId, ...r };
        render();
        note("ВДЦ сделана из версии расчёта — теперь она действующая");
      } catch (e) {
        note("Не вышло: " + e.message, true);
        vs.value = "";
      }
    });
    host.querySelectorAll("[data-vdc]").forEach((box) => {
      const id = box.dataset.vdc;
      const v = VDC.rows.find((x) => x.id === id);
      const on = (sel, fn) => { const b = box.querySelector(sel); if (b) b.addEventListener("click", fn); };
      on("[data-vopen]", () => vdcFull(id, "rows"));
      on("[data-vsys]", () => vdcFull(id, "sys"));
      on("[data-vsup]", () => v && vdcSupply(v));
      on("[data-vsgo]", () => v && v.supply && SNAB.open(v.supply.id, v.supply.work ? "work" : "proc"));
      on("[data-vxls]", (e) => DL.save("/api/vdc/" + encodeURIComponent(id) + "/xlsx",
        { btn: e.currentTarget, body: {}, fallback: "ВДЦ.xlsx", error: "Не удалось собрать книгу" })
        .catch((err) => note(err.message, true)));
      on("[data-vfile]", (e) => DL.save("/api/vdc/" + encodeURIComponent(id) + "/file",
        { btn: e.currentTarget, fallback: (v && v.filename) || "ВДЦ.xlsx" }).catch((err) => note(err.message, true)));
      on("[data-vst]", (e) => vdcStatusPop(e.currentTarget, v));
    });
  }

  /* Меню пометки ведомости: действующая, прежняя, прежняя — заменена
     такой-то, без пометки. */
  function vdcStatusPop(btn, v) {
    document.querySelector(".vdc-pop")?.remove();
    const others = VDC.rows.filter((x) => x.id !== v.id);
    const pop = document.createElement("div");
    pop.className = "vdc-pop";
    const opt = (st, rb, label, sub, on) => `<button type="button" data-st="${st}" data-rb="${esc(rb)}"${on ? ' class="on"' : ""}>
      <b>${esc(label)}</b>${sub ? `<i>${esc(sub)}</i>` : ""}</button>`;
    // Статусов два (правка № 37, 23.10.2026); прежней ВДЦ становится, когда
    // загрузили новую взамен или написали причину.
    pop.innerHTML = opt("current", "", "Действующая", "по ней работаем", v.status === "current")
      + `<p>Прежняя:</p>`
      + `<button type="button" data-new><b>Загрузить новую ВДЦ взамен</b><i>эта станет прежней, новая — действующей</i></button>`
      + `<button type="button" data-why${v.status === "old" && v.old_reason ? ' class="on"' : ""}><b>Указать причину</b><i>${
        esc(v.status === "old" && v.old_reason ? v.old_reason : "почему ведомость больше не действует")}</i></button>`
      + (others.length ? `<p>Прежняя — заменена ведомостью:</p>` + others.map((x) =>
        opt("old", x.id, x.name, `${x.kind_name || "ВДЦ"} · ${dayRu(x.at)}`, v.replaced_by === x.id)).join("") : "");
    document.body.appendChild(pop);
    const r = btn.getBoundingClientRect();
    pop.style.left = Math.max(8, Math.min(r.left, innerWidth - pop.offsetWidth - 8)) + "px";
    pop.style.top = Math.min(r.bottom + 6, innerHeight - pop.offsetHeight - 8) + "px";
    const close = () => { pop.remove(); document.removeEventListener("pointerdown", away, true); };
    const away = (e) => { if (!pop.contains(e.target) && e.target !== btn) close(); };
    setTimeout(() => document.addEventListener("pointerdown", away, true), 0);
    pop.addEventListener("click", async (e) => {
      if (e.target.closest("[data-new]")) {
        close();
        vdcReplace = v.id;
        vdcUpload();
        return;
      }
      if (e.target.closest("[data-why]")) {
        close();
        const why = await ASK.prompt(`Почему ВДЦ «${v.name}» больше не действует?`, v.old_reason || "",
          { title: "Прежняя ВДЦ", ok: "Сделать прежней" });
        if (why === null) return;
        if (!why.trim()) { note("Напишите причину — без неё ВДЦ прежней не станет", true); return; }
        try {
          VDC = { site: openId, ...(await AUTH.api("PATCH", "/vdc/" + encodeURIComponent(v.id), { status: "old", reason: why })) };
          render();
        } catch (err) {
          note("Не вышло: " + err.message, true);
        }
        return;
      }
      const b = e.target.closest("[data-st]");
      if (!b) return;
      close();
      try {
        const body = { status: b.dataset.st };
        if (b.dataset.st === "old") body.replaced_by = b.dataset.rb;
        const res = await AUTH.api("PATCH", "/vdc/" + encodeURIComponent(v.id), body);
        VDC = { site: openId, ...res };
        render();
      } catch (err) {
        note("Не вышло: " + err.message, true);
      }
    });
  }

  /* Загрузка: вид документа (ВДЦ, РДЦ, КЛК) и файл. Вид по умолчанию —
     из карточки заказчика объекта, иначе последний выбранный. */
  function vdcUpload() {
    // Загружают взамен прежней (правка № 37) — какой, помним только на это окно.
    const replace = vdcReplace;
    vdcReplace = "";
    let kind = (VDC && VDC.default_kind) || (() => {
      try { return localStorage.getItem("vdc.kind") || "vdc"; } catch (e) { return "vdc"; }
    })();
    const box = document.createElement("div");
    box.className = "pf-modal";
    box.innerHTML = `
      <div class="pf-crop cnt-card vdc-up" role="dialog" aria-label="Документ договорной цены">
        <h3>Документ договорной цены${replace ? " — взамен прежней" : ""}</h3>${replace ? `<p class="note">Загруженная станет
          действующей, «${esc(((VDC && VDC.rows.find((x) => x.id === replace)) || {}).name || "")}» — прежней, заменённой ею.</p>` : ""}
        <div class="seg vdc-up-seg" role="radiogroup" aria-label="Вид документа">${VDC_KINDS.map(([k, n]) =>
          `<button type="button" class="seg-b${k === kind ? " on" : ""}" data-k="${k}">${n}</button>`).join("")}</div>
        <div class="note vdc-up-why" id="vuWhy"></div>
        <div class="pf-note bad" id="vuErr" hidden></div>
        <div class="cnt-acts">
          <button type="button" class="btn ghost" id="vuNo">Отмена</button>
          <label class="btn" id="vuPick">${ICO.up}<span>Выбрать файл</span><input type="file" hidden></label>
        </div>
      </div>`;
    document.body.appendChild(box);
    const close = () => box.remove();
    const inp = $s("#vuPick input", box);
    const paint = () => {
      box.querySelectorAll("[data-k]").forEach((b) => b.classList.toggle("on", b.dataset.k === kind));
      const d = VDC_KINDS.find((x) => x[0] === kind);
      $s("#vuWhy", box).textContent = d[2] + (VDC && VDC.default_kind === kind && VDC.default_why
        ? " " + VDC.default_why : "");
      inp.accept = kind === "klk" ? ".pdf,.xlsx,.xlsm,.xls" : ".xlsx,.xlsm,.xls";
    };
    box.querySelectorAll("[data-k]").forEach((b) => b.addEventListener("click", () => { kind = b.dataset.k; paint(); }));
    $s("#vuNo", box).addEventListener("click", close);
    box.addEventListener("click", (e) => { if (e.target === box) close(); });
    inp.addEventListener("change", () => {
      const f = inp.files && inp.files[0];
      if (!f) return;
      if (/\.pdf$/i.test(f.name) && kind !== "klk") {
        const er = $s("#vuErr", box);
        er.textContent = "PDF разбираем у калькуляции заказчика (КЛК) — выберите «КЛК» или загрузите Excel";
        er.hidden = false;
        inp.value = "";
        return;
      }
      try { localStorage.setItem("vdc.kind", kind); } catch (e) { /* без памяти */ }
      close();
      vdcSend(f, kind, replace);
    });
    paint();
  }

  async function vdcSend(f, kind, replace) {
    const site = openId;
    note(`Читаю «${f.name}»…`);
    FRESH.hold();
    const tr = TRACE.start({ kind: kind === "klk" ? "klk" : "vdc", file: f.name,
      title: "разбирает " + ((VDC_KINDS.find((x) => x[0] === kind) || [])[1] || "ВДЦ") });
    try {
      const r = await fetch("/api/sites/" + encodeURIComponent(site) + "/vdc/xlsx", {
        method: "POST",
        headers: { Authorization: "Bearer " + AUTH.token(), "X-File-Name": encodeURIComponent(f.name),
                   "X-Vdc-Kind": kind || "vdc", "Content-Type": f.type || "application/octet-stream" },
        body: f,
      });
      let x = null;
      try { x = await r.json(); } catch (e) { /* не json: ответил nginx */ }
      if (!r.ok) {
        throw new Error((x && x.error) || (r.status === 413 ? "Файл больше, чем принимает сервер"
          : "Не удалось загрузить, ответ сервера " + r.status));
      }
      VDC = { site, rows: x.rows, versions: x.versions, default_kind: x.default_kind, default_why: x.default_why };
      const fresh = (x.rows[0] || {}).id || "";
      delete vdcCache[fresh];
      // Загружали взамен прежней — та становится прежней, заменённой этой.
      if (replace && fresh && replace !== fresh) {
        const old = replace;
        try {
          const r2 = await AUTH.api("PATCH", "/vdc/" + encodeURIComponent(old), { status: "old", replaced_by: fresh });
          VDC = { site, ...r2 };
        } catch (err) {
          note("Новая ВДЦ загружена, а прежнюю отметить не вышло: " + err.message, true);
        }
      }
      render();
      const v0 = x.rows[0] || {};
      const t = v0.totals || {};
      const checks = (v0.meta || {}).checks || [];
      tr.done(`${t.count || 0} ${plural(t.count || 0, "строка", "строки", "строк")}`
        + (t.sum_with_vat ? `, ${money(t.sum_with_vat)} с НДС` : "") + (checks.length ? " — есть расхождения" : ""));
      note(v0.kind === "klk" && /\.pdf$/i.test(f.name)
        ? `КЛК из «${f.name}»: ${t.count || 0} ${plural(t.count || 0, "работа", "работы", "работ")}, ${
          money(t.sum_with_vat)} с НДС. ${checks.length ? "Есть расхождения — смотрите сверку" : "Суммы сходятся с итогами документа"}`
        : `${v0.kind_name || "ВДЦ"} из «${f.name}»: ${t.count || 0} ${plural(t.count || 0, "позиция", "позиции", "позиций")},`
          + ` ${money(t.sum_with_vat)} с НДС. Проверьте строки — колонки узнаны по шапке`, checks.length > 0);
      // Колонки узнаны по шапке — строки сразу перед глазами.
      if (fresh) vdcFull(fresh, "rows");
    } catch (e) {
      tr.fail("Не получилось: " + e.message);
      note(e.message, true);
    } finally {
      FRESH.release();
    }
  }

  /* Вкладки, которые заказчик назвал, но которых ещё нет. Показываем их
     пустыми, а не прячем: человек должен видеть, что про них помнят, и
     не искать их в другом месте. */
  const SOON = {
    budget: ["Бюджет объекта", "Плановые и фактические затраты по объекту:"
      + " сколько заложили, сколько потратили, сколько осталось."],
    orders: ["Заявки на материалы", "Что запросили с объекта, что уже"
      + " отгрузили и чего ждут."],
    duty: ["Наряды на работы", "Что кому поручено, в каком объёме и"
      + " закрыто ли."],
  };

  function soonHtml(key) {
    const [ttl, txt] = SOON[key] || ["Раздел в работе", ""];
    return `<div class="pg-empty"><b>${esc(ttl)}</b>${esc(txt)}
      <br><br>Ещё не сделано — вкладка стоит на месте, чтобы было видно,
      что она запланирована.</div>`;
  }

  function contractsHtml() {
    return `
      ${can() ? `<div class="pg-bar"><button type="button"
        class="btn-ghost" id="sitNewDog">${ICO.plus}Договор</button></div>` : ""}
      ${CONTRACTS.length ? `<table class="tbl" style="--tbl-min:1134px">
        <colgroup><col style="width:14%"><col><col style="width:99px">
          <col style="width:66.5px"><col style="width:151px">
          <col style="width:151px"><col style="width:209px"></colgroup>
        <thead><tr><th>Договор</th><th>Предмет</th><th class="num">Сумма</th>
          <th>Бумаги</th><th>Действует</th><th>Проекты</th><th></th></tr></thead>
        <tbody>${CONTRACTS.map((d) => `
          <tr data-dog="${esc(d.id)}">
            <td><span class="t-name">${esc(d.number || "без номера")}</span>
              <i class="t-sub">${esc(d.signed_at) || "дата не указана"}</i></td>
            <td>${esc(d.subject) || "<span class=dim>—</span>"}</td>
            <td class="num">${esc(d.amount) || "<span class=dim>—</span>"}</td>
            <td>${docsCell("contract", d.id)}</td>
            <td>${revCell("contract", d.id)}</td>
            <td>${linkCell(d.id)}</td>
            <td class="acts">${can() ? `
              <button type="button" class="lnk" data-up="contract"
                      data-owner="${esc(d.id)}">＋ Калькуляция</button>
              <button type="button" class="lnk" data-edog>Править</button>`
              : ""}</td>
          </tr>`).join("")}</tbody></table>`
        : `<div class="pg-empty"><b>Договоров нет</b>Их заводят руками — из
             реестра не видно, какой договор какую марку закрывает.</div>`}
      ${can() ? `<input type="file" id="cardFile" hidden>` : ""}`;
  }

  /* Действующая редакция и вход в историю. Показываем именно
     действующую, а не последнюю заведённую: изменение могут внести
     задним числом, и свежесть решает дата выпуска, а не порядок ввода. */
  /* Сколько бумаг приложено к проекту или договору. Связь должна быть
     видна с обеих сторон: загрузил документ вида «Проект» — счётчик у
     проекта вырос, иначе вкладки выглядят несвязанными списками. */
  function docsOfOwner(kind, id) {
    const key = kind === "project" ? "project_id" : "contract_id";
    return DOCS.filter((d) => d[key] === id);
  }

  function docsCell(kind, id) {
    const n = docsOfOwner(kind, id).length;
    return n ? `<span class="sit-doccount">${n}</span>`
             : `<span class="dim">нет</span>`;
  }

  function revCell(kind, id) {
    const list = revsOf(kind, id);
    const cur = currentRev(kind, id);
    const word = REV_WORD[kind][1].toLowerCase();
    return `
      <div class="sit-rev">
        ${cur ? `<b>${esc(revLabel(cur))}</b>`
              : `<span class="dim">исходный выпуск</span>`}
        <button type="button" class="lnk" data-revs="${kind}|${esc(id)}">${
          list.length ? `${word}: ${list.length}` : "＋ " + REV_WORD[kind][0]}</button>
      </div>`;
  }

  /* Связь договора с проектами — галочками. Именно так, а не выбором
     одного: у договора бывает несколько проектов и наоборот. */
  function linkCell(dogId) {
    if (!PROJECTS.length) return `<span class="dim">проектов нет</span>`;
    const on = new Set(LINKS.filter((l) => l.contract_id === dogId)
      .map((l) => l.project_id));
    return `<div class="sit-links">${PROJECTS.map((p) => `
      <label class="sit-link${on.has(p.id) ? " on" : ""}">
        <input type="checkbox" data-link="${esc(dogId)}|${esc(p.id)}"
               ${on.has(p.id) ? "checked" : ""}${can() ? "" : " disabled"}>
        ${esc(p.marks || p.code || "проект")}</label>`).join("")}</div>`;
  }

  function projectsHtml() {
    return `
      ${can() ? `<div class="pg-bar"><button type="button"
        class="btn-ghost" id="sitNewProj">${ICO.plus}Проект</button></div>` : ""}
      ${PROJECTS.length ? `<table class="tbl" style="--tbl-min:1062px">
        <!-- Колонка действий фиксированной ширины: в ней две кнопки
             словами, и от доли она ужималась так, что «＋ Спецификация»
             уезжала за край экрана. -->
        <colgroup><col style="width:12%"><col style="width:15%">
          <col style="width:15%"><col style="width:66.5px">
          <col style="width:153px"><col><col style="width:212.5px"></colgroup>
        <thead><tr><th>Марки</th><th>Шифр</th><th>Институт</th>
          <th>Бумаги</th><th>Действует</th><th>Примечание</th><th></th></tr></thead>
        <tbody>${PROJECTS.map((p) => `
          <tr data-proj="${esc(p.id)}">
            <td><span class="t-name">${esc(p.marks) || "—"}</span></td>
            <td>${esc(p.code) || "<span class=dim>—</span>"}</td>
            <td>${esc(p.institute) || "<span class=dim>—</span>"}</td>
            <td>${docsCell("project", p.id)}</td>
            <td>${revCell("project", p.id)}</td>
            <td>${esc(p.note) || "<span class=dim>—</span>"}</td>
            <td class="acts">${can() ? `
              <button type="button" class="lnk" data-up="project"
                      data-owner="${esc(p.id)}">＋ Спецификация</button>
              <button type="button" class="lnk" data-eproj>Править</button>`
              : ""}</td>
          </tr>`).join("")}</tbody></table>`
        : `<div class="pg-empty"><b>Проектов нет</b>Марки, шифр и институт
             заводят руками — по ним потом видно, какой выпуск действует.</div>`}
      ${can() ? `<input type="file" id="cardFile" hidden>` : ""}`;
  }

  /* Сверка двух разобранных книг. Ради этого раздел и затевался: видно,
     что заложено в проекте, но не оплачено договором.

     Слева обычно проект или чек-лист, справа калькуляция. Порядок
     значим: ищем для каждой строки левого документа пару в правом, а
     «не нашлось» слева и справа означают разное — недоплату и лишнее. */
  let MATCH = null;

  function matchHtml() {
    const parsed = DOCS.filter((d) => d.positions);
    if (parsed.length < 2) {
      return `<div class="pg-empty"><b>Сверять пока нечего</b>Нужны две
        извлечённые книги. Загрузите xlsx и нажмите «Извлечь позиции» во вкладке
        «Документы». PDF разобрать нельзя — из него нечем достать
        таблицу, так что калькуляцию просите в Excel.</div>`;
    }
    const opts = (sel) => parsed.map((d) => `<option value="${esc(d.id)}"${
      sel === d.id ? " selected" : ""}>${esc(d.title || d.filename)} · ${
      d.positions} поз.</option>`).join("");
    const m = MATCH;
    return `
      <div class="pg-bar">
        <select id="mLeft" class="role-sel">${opts(m && m.left)}</select>
        <span class="sit-hint">сверяем с</span>
        <select id="mRight" class="role-sel">${opts(m && m.right)}</select>
        <button type="button" class="btn-ghost" id="mGo">Сверить</button>
        <span class="sit-hint" id="mHint">${m
          ? `нашлось ${m.sure} уверенно, ${m.maybe} под вопросом, ${m.none} без пары`
          : ""}</span>
      </div>
      ${m ? `<table class="tbl" style="--tbl-min:882px">
        <colgroup><col><col style="width:81px"><col>
          <col style="width:81px"><col style="width:81px">
          <col style="width:135px"></colgroup>
        <thead><tr><th>Строка слева</th><th class="num">Кол-во</th>
          <th>Что нашлось справа</th><th class="num">Кол-во</th>
          <th class="num">Совпало</th><th></th></tr></thead>
        <tbody>${m.rows.map((r) => `
          <tr data-pos="${esc(r.left.id)}" class="mrow ${esc(r.state)}${
            r.verdict === "no" ? " off" : ""}">
            <td><span class="t-name">${esc(r.left.name || r.left.brand || "—")}</span>
              ${r.left.brand && r.left.name
                ? `<i class="t-sub">${esc(r.left.brand)}</i>` : ""}</td>
            <td class="num">${esc(r.left.qty ?? "")}</td>
            <td>${r.right
              ? esc(r.right.name || r.right.brand || "—")
              : `<span class="dim">пары нет</span>`}</td>
            <td class="num">${r.right ? esc(r.right.qty ?? "") : ""}</td>
            <td class="num">${r.score ? r.score.toFixed(2) : "—"}</td>
            <td class="acts">${can() && r.right ? `
              <button type="button" class="lnk" data-yes>${
                r.verdict === "ok" ? "✓ верно" : "верно"}</button>
              <button type="button" class="lnk" data-no>${
                r.verdict === "no" ? "✗ не то" : "не то"}</button>` : ""}</td>
          </tr>`).join("")}</tbody></table>` : ""}`;
  }

  async function runMatch(host) {
    const left = $s("#mLeft", host).value;
    const right = $s("#mRight", host).value;
    const hint = $s("#mHint", host);
    if (left === right) { hint.textContent = "Это один и тот же документ"; return; }
    hint.textContent = "Сверяю…";
    try {
      const res = await AUTH.api("POST", "/match", { left, right });
      MATCH = { ...res, left, right };
      render();
    } catch (e) {
      hint.textContent = String(e.message);
    }
  }

  /* Шапка карточки уходит сама, когда работу листают вниз, и возвращается,
     когда список снова наверху (заказчик, 21.10.2026: «скрывающее окно
     шапки при скролле вниз»). Остаётся тонкая строка с «Развернуть» — она
     на виду всегда. Прокручивается не карточка, а то, что внутри вкладки
     (вид ПТО, список файлов), — поэтому слушаем прокрутку в фазе захвата. */
  let AUTO_HOLD = false;
  function wireAutoMini(pg) {
    const last = new WeakMap();
    AUTO_HOLD = false;
    pg.addEventListener("scroll", (e) => {
      const el = e.target;
      if (!(el instanceof Element) || el === pg || MINI) return;
      const y = el.scrollTop;
      const was = last.get(el) || 0;
      last.set(el, y);
      if (y < 8) {
        AUTO_HOLD = false;
        pg.classList.remove("card-auto");
        return;
      }
      if (AUTO_HOLD || y <= was || pg.classList.contains("card-auto")) return;
      // Короткий список шапку не прячет: места хватает и так, а без шапки
      // он перестал бы прокручиваться, и шапка вернулась бы — дёрганье.
      if (y > 90 && el.scrollHeight - el.clientHeight > 260) pg.classList.add("card-auto");
    }, true);
  }

  function wireCard(host) {
    host.querySelectorAll("#sitBack, [data-back]").forEach((b) => b.addEventListener("click", () => {
      openId = null;
      render();
    }));
    // Свернуть и развернуть — классом, без перерисовки: ПТО и файлы не
    // перезагружаются, прокрутка остаётся.
    host.querySelectorAll("[data-mini]").forEach((b) => b.addEventListener("click", () => {
      MINI = b.dataset.mini === "1";
      try { localStorage.setItem(MINI_KEY, MINI ? "1" : ""); } catch (e) { /* без памяти */ }
      const pg = $s(".pg", host);
      if (!pg) return;
      pg.classList.toggle("card-min", MINI);
      // Развернули вручную посреди списка — шапка остаётся, пока список
      // не вернут наверх.
      if (!MINI && pg.classList.contains("card-auto")) {
        pg.classList.remove("card-auto");
        AUTO_HOLD = true;
      }
    }));
    if (MODE === "obj" && $s(".pg", host)) wireAutoMini($s(".pg", host));
    if (can() && $s("#sitEdit", host)) {
      $s("#sitEdit", host).addEventListener("click", () =>
        siteForm(SITES_ROWS.find((x) => x.id === openId)));
    }
    host.querySelectorAll("[data-est]").forEach((b) => b.addEventListener("click", () => {
      siteForm(SITES_ROWS.find((x) => x.id === openId));
      setTimeout(() => {
        const f = document.querySelector("#f-estimator");
        if (f) { f.scrollIntoView({ block: "center" }); f.focus(); }
      }, 60);
    }));
    if ($s("#sitTnd", host)) $s("#sitTnd", host).addEventListener("click", () => goTender(openId));
    if ($s("#sitSnb", host)) {
      $s("#sitSnb", host).addEventListener("click", () => {
        const s = SITES_ROWS.find((x) => x.id === openId) || {};
        if (typeof SNAB === "object") SNAB.openSite(openId, s.name);
      });
    }
    if ($s("#tndToObj", host)) $s("#tndToObj", host).addEventListener("click", () => goObjects(openId));
    host.querySelectorAll("[data-cus]").forEach((b) => b.addEventListener("click", () => CUS.open(b.dataset.cus)));
    host.querySelectorAll("[data-tnd]").forEach((b) => {
      b.addEventListener("click", () => setTender(openId, b.dataset.tnd));
    });
    host.querySelectorAll("[data-tab]").forEach((b) => {
      b.addEventListener("click", () => { tab = b.dataset.tab; render(); });
    });
    if (tab === "contract") wireVdc(host);
    /* ПТО — отдельный модуль (pto.js): карточка перерисовывается целиком, и
       модуль каждый раз получает новое место, а данные держит у себя. */
    if (tab === "pto" && typeof PTO === "object" && $s("#ptoHost", host)) {
      PTO.mount($s("#ptoHost", host), {
        siteId: openId,
        can: can(),
        upload: () => uploadForm({ kind: "project", owner: "" }, "Загрузить проект"),
        // Спецификация в ПТО извлекается так же, как в «Тендере», — тем же окном.
        parse: (docId) => parseDoc(docId),
      });
    }
    host.querySelectorAll("[data-ttab]").forEach((b) => {
      b.addEventListener("click", () => { tndTab = b.dataset.ttab; render(); });
    });
    if (MODE === "tnd" && tndTab === "check" && typeof PTO === "object" && $s("#tndPto", host)) {
      PTO.mount($s("#tndPto", host), {
        siteId: openId,
        can: can(),
        only: "checklist",
        upload: () => uploadForm({ kind: "project", owner: "" }, "Загрузить проект"),
      });
    }

    if (tab === "files" && typeof FILES === "object" && $s("#filesHost", host)) {
      FILES.mount($s("#filesHost", host), openId);
    }
    // Заявки на материалы (22.10.2026) — заявки объекта и «Новая заявка»;
    // сама работа — в разделе «Заявки» (src/req.js).
    if (tab === "orders" && typeof REQ === "object" && $s("#reqHost", host)) {
      REQ.siteTab($s("#reqHost", host), openId);
    }

    /* Загрузка во вкладке «Документы» — без привязки: сюда кладут
       письма, акты, фотографии, то есть то, что не относится ни к
       проекту, ни к договору. Спецификацию и калькуляцию грузят из их
       карточек, там привязка получается сама. */
    if ($s("#sitUp", host)) {
      $s("#sitUp", host).addEventListener("click", () =>
        uploadForm({ owner: "" }, "Загрузить документ"));
    }
    const ds = $s("#docSearch", host);
    if (ds) {
      // Поле не трогаем: перерисовывается только список под ним.
      ds.addEventListener("input", (e) => { docSearch = e.target.value; paintDocs(); });
      const dk = $s("#docKind", host);
      const onKind = (e) => { docKind = e.target.value; paintDocs(); };
      dk.addEventListener("change", onKind);
      dk.addEventListener("input", onKind);
      paintDocs();
    }
    /* Вкладки одного вида бумаг рисуются сразу, а не через paintDocs, —
       значит и строки в них надо оживить здесь. */
    if (!ds && $s("[data-doc]", host)) wireDocs(host);
    host.querySelectorAll("[data-upkind]").forEach((b) => {
      b.addEventListener("click", () => uploadForm(
        { kind: b.dataset.upkind, owner: "" },
        b.dataset.upkind === "project" ? "Загрузить спецификацию"
                                       : "Загрузить договор"));
    });
    /* Расценки — справочник на всю контору, но нужен он ровно здесь, при
       расчёте тендера. Поэтому из бокового меню убран, а вход оставлен
       отсюда: заказчик так и просил — спрятать в тендерное. */
    if ($s("#wrkGo", host)) {
      // Прайс работ с 07.10.2026 — в «Данных» этого же раздела «Тендер».
      $s("#wrkGo", host).addEventListener("click", () =>
        (typeof TENDER === "object" ? TENDER.open("wrk") : openSection("tnd")));
    }
    if ($s("#spUp", host)) $s("#spUp", host).addEventListener("click", spChoose);
    if ($s("#comboGo", host)) $s("#comboGo", host).addEventListener("click", comboDialog);
    host.querySelectorAll("[data-combo-up]").forEach((b) => b.addEventListener("click", () =>
      comboRefresh(b.closest("tr").dataset.doc, b)));
    wireSp(host);
    wireCardUpload(host);

    if ($s("#sitNewDog", host)) {
      $s("#sitNewDog", host).addEventListener("click", () => dogForm(null));
    }
    host.querySelectorAll("[data-edog]").forEach((b) => {
      b.addEventListener("click", () =>
        dogForm(CONTRACTS.find((x) => x.id === b.closest("tr").dataset.dog)));
    });
    if ($s("#sitNewProj", host)) {
      $s("#sitNewProj", host).addEventListener("click", () => projForm(null));
    }
    host.querySelectorAll("[data-eproj]").forEach((b) => {
      b.addEventListener("click", () =>
        projForm(PROJECTS.find((x) => x.id === b.closest("tr").dataset.proj)));
    });
    if ($s("#mGo", host)) {
      $s("#mGo", host).addEventListener("click", () => runMatch(host));
    }
    host.querySelectorAll("[data-yes],[data-no]").forEach((b) => {
      b.addEventListener("click", async () => {
        const tr = b.closest("tr");
        const row = MATCH.rows.find((r) => r.left.id === tr.dataset.pos);
        const verdict = b.hasAttribute("data-yes") ? "ok" : "no";
        await AUTH.api("POST", "/match/set", {
          left: row.left.id, right: (row.right || {}).id || "",
          verdict: row.verdict === verdict ? "" : verdict });
        row.verdict = row.verdict === verdict ? "" : verdict;
        render();
      });
    });
    host.querySelectorAll("[data-revs]").forEach((b) => {
      b.addEventListener("click", () => {
        const [kind, id] = b.dataset.revs.split("|");
        revList(kind, id);
      });
    });
    host.querySelectorAll("[data-link]").forEach((box) => {
      box.addEventListener("change", async () => {
        const [cid, pid] = box.dataset.link.split("|");
        await AUTH.api("POST", "/links",
          { contract_id: cid, project_id: pid, linked: box.checked });
        await loadOne(openId);
        render();
      });
    });
  }

  /* Обработчики строк списка документов. Отдельно от wireCard: список
     перерисовывается на каждый набранный знак, а полоса с поиском — нет. */
  function wireDocs(host) {
    host.querySelectorAll("[data-ver-open]").forEach((b) => {
      b.addEventListener("click", () => openVersion(b.closest("tr").dataset.ver));
    });
    host.querySelectorAll("[data-ver-cmp]").forEach((b) => {
      const tr = b.closest("tr");
      b.addEventListener("click", () => openCompare(tr.dataset.doc, [tr.dataset.ver, "current"]));
    });
    host.querySelectorAll("[data-cmp-all]").forEach((b) => {
      b.addEventListener("click", () => {
        const d = DOCS.find((x) => x.id === b.closest("tr").dataset.doc) || {};
        const vers = d.versions || [];
        openCompare(d.id, [vers[vers.length - 1].id, "current"]);
      });
    });
    host.querySelectorAll("[data-ver-del]").forEach((b) => {
      b.addEventListener("click", () => {
        const tr = b.closest("tr");
        const d = DOCS.find((x) => x.id === tr.dataset.doc) || {};
        deleteVersion((d.versions || []).find((v) => v.id === tr.dataset.ver));
      });
    });
    host.querySelectorAll("[data-dl]").forEach((b) => {
      b.addEventListener("click", () => download(b.closest("tr").dataset.doc, b));
    });
    host.querySelectorAll("[data-fopen]").forEach((b) => {
      b.addEventListener("click", () => openFile(b.closest("tr").dataset.doc, b));
    });
    host.querySelectorAll("[data-parse]").forEach((b) => {
      b.addEventListener("click", () => parseDoc(b.closest("tr").dataset.doc));
    });
    host.querySelectorAll("[data-pos]").forEach((b) => {
      b.addEventListener("click", () => openPositions(b.closest("tr").dataset.doc));
    });
    host.querySelectorAll("[data-terms]").forEach((b) => {
      b.addEventListener("click", () => openTermsPage(b.closest("tr").dataset.doc));
    });
    host.querySelectorAll("[data-rm]").forEach((b) => {
      b.addEventListener("click", async () => {
        const tr = b.closest("tr");
        const d = DOCS.find((x) => x.id === tr.dataset.doc);
        if (!(await ASK.confirm(`Убрать «${d.title || d.filename}» из списка?`))) return;
        await AUTH.api("DELETE", "/documents/" + d.id);
        await loadOne(openId);
        render();
      });
    });
  }

  /* ── версии калькуляции ──────────────────────────────────────
     Заказчик 22.09.2026: после тендера цены фиксируются версией
     «Тендерная», текущий расчёт живёт дальше; договорились —
     «Договорная»; потом «Изм. 1, 2, 3». Версии лежат под спецификацией в
     дереве документа, открываются той же таблицей с замком и
     сравниваются: любые версии и текущая рядом, с разницей к базовой. */
  const PARAMS = [["qty", "Кол-во", "num"], ["supplier", "Поставщик", "text"],
                  ["mat_unit", "Материал за ед.", "money"], ["work_price", "Работа за ед.", "money"],
                  ["unit_total", "Итого на ед.", "money"], ["sum_total", "Сумма позиции", "money"]];
  const qtyText = (n) => (n === null || n === undefined || n === "") ? ""
    : Number(n).toLocaleString("ru-RU", { maximumFractionDigits: 3 });

  async function refreshVersions(docId) {
    VERS = await AUTH.api("GET", "/documents/" + encodeURIComponent(docId) + "/versions");
    const d = DOCS.find((x) => x.id === docId);
    if (d) d.versions = VERS.rows;
  }

  /* Зафиксировать: имя подставляется само — «Тендерная», потом
     «Договорная», дальше «Изм. N»; поправить можно. */
  function fixVersion() {
    const next = (VERS && VERS.next_name) || "Тендерная";
    const docId = openDoc.id;
    modal("Зафиксировать версию", [
      ["name", "Название версии", next, "Тендерная, Договорная, Изм. 1…"],
      ["note", "Комментарий", "", "например: цены после торга 22.09"],
    ], async (data) => {
      const ck = box && box.querySelector("#fVdc");
      const v = await AUTH.api("POST", "/documents/" + docId + "/versions",
                               { ...data, vdc: !!(ck && ck.checked) });
      await refreshVersions(docId);
      if (v.vdc) VDC = null;              // вкладка «Договор» перечитает ВДЦ
      render();
      note(`Версия «${v.name}» зафиксирована: ${v.totals.count} ${plural(v.totals.count,
        "позиция", "позиции", "позиций")}, ${money(v.totals.sum_with_vat)} с НДС.`
        + (v.vdc ? " ВДЦ договора — во вкладке «Договор»." : "")
        + " Текущий расчёт можно менять дальше — снимок не изменится");
    });
    const box = [...document.querySelectorAll(".pf-modal")].pop();
    if (box) {
      $s("#fOk", box).textContent = "Зафиксировать";
      // ВДЦ — ведомость договорной цены (07.10.2026): договорную версию
      // сразу кладём в «Договор»; галочка стоит, когда версия «Договорная».
      $s(".cnt-grid", box).insertAdjacentHTML("afterend", `<label class="vdc-ck"><input type="checkbox"
        id="fVdc"${/договор/i.test(next) ? " checked" : ""}><span><b>Сделать ВДЦ договора</b>
        <i>ведомость договорной цены появится во вкладке «Договор»</i></span></label>`);
      const nm = box.querySelector("#f-name");
      if (nm) nm.addEventListener("input", () => { $s("#fVdc", box).checked = /договор/i.test(nm.value); });
      $s(".cnt-grid", box).insertAdjacentHTML("beforebegin", `<div class="note"
        style="margin-bottom:11px">Расчёт скопируется как есть: поставщики, цены, наценка,
        расценки и суммы. Снимок больше не меняется; текущий расчёт живёт дальше.
        Версии видны под спецификацией в «Тендере».</div>`);
    }
  }

  /* «Передать на проработку» (заказчик, 20.10.2026 — три вида):
     тендерная проработка — предложения под тендер, максимальная цена, со
     сроком; проработка — выбор поставщиков на выигранный договор, со
     сроком; рабочая — сразу закупка, проработка заводится рядом. Цены
     калькуляции фиксируются версией («Тендерная» или «Договорная», дальше
     «Изм. N»), ответственному — сообщение в мессенджер. Окно — в snab.js
     (SNAB.handover), то же, что «Тендер выигран» в «Снабжении». */
  function supplyHandover(doc, pre) {
    // Из расчёта — открытая калькуляция, все три вида; без расчёта
    // (калькуляция строкой) — без тендерной: объект уже договорной. Из
    // «Договора» теперь передают ВДЦ — vdcSupply (правка № 25).
    const d = doc || openDoc;
    const fromCalc = d === openDoc;
    const docId = d.id;
    const have = d.supplies || {};
    const names = ((fromCalc ? VERS && VERS.rows : d.versions) || []).map((v) => v.name);
    const нет = !names.some((n) => /^договорная$/i.test(n.replace(/[\s.]/g, "")));
    const изм = names.map((n) => (n.match(/^изм\.?\s*(\d+)/i) || [])[1]).filter(Boolean).map(Number);
    const contractNext = нет ? "Договорная" : `Изм. ${(изм.length ? Math.max(...изм) : 0) + 1}`;
    const tenderNext = names.includes("Тендерная") ? `Тендерная ${
      1 + names.filter((n) => n.startsWith("Тендерная")).length}` : "Тендерная";
    const site = SITES_ROWS.find((x) => x.id === openId) || {};
    // Вид по умолчанию: что уже передавали; объект выигран — проработка.
    const mode = pre || (have.contract ? (have.contract.work ? "work" : "contract") : have.tender ? "tender"
      : site.tender === "won" ? "contract" : "tender");
    if (typeof SNAB !== "object") return;
    SNAB.handover({
      title: fromCalc ? "Передать на проработку" : "Передать в снабжение",
      sub: [site.name, d.title || d.filename].filter(Boolean).join(" · "),
      modes: fromCalc ? ["tender", "contract", "work"] : ["contract", "work"], mode, have,
      names: { tender: tenderNext, contract: contractNext },
      // Срок и ответственный подставятся у той проработки, что обновится.
      carry: !have.contract && have.tender ? have.tender.invoices || 0 : 0,
      ok: "Передать",
      submit: async (data) => {
        const r = await AUTH.api("POST", "/documents/" + encodeURIComponent(docId) + "/supply", data);
        if (fromCalc) {
          await refreshVersions(docId);
          const kind = r.mode === "tender" ? "tender" : "contract";
          const sp = r.supply || {};
          const one = { id: r.id, at: sp.at || new Date().toISOString(), mode: kind, status: "work",
            work: sp.work || "", due: sp.due || "", to: (sp.to || {}).id || "", invoices: sp.invoices || 0 };
          openDoc.supplies = Object.assign({}, openDoc.supplies || {}, { [kind]: one });
          openDoc.supply = openDoc.supplies.contract || openDoc.supplies.tender;
          const dd = DOCS.find((x) => x.id === docId);
          if (dd) { dd.supplies = openDoc.supplies; dd.supply = openDoc.supply; }
        } else {
          // Из «Договора»: строки калькуляций с метками и версиями — заново.
          await loadOne(openId);
        }
        render();
        const where = { tender: "в тендерную проработку", contract: "в проработку", work: "в рабочую (и в проработку)" }[r.mode];
        const sent = r.notified && r.notified.sent ? " Ответственному ушло сообщение в мессенджер."
          : r.notified && r.notified.error ? ` Сообщение не ушло: ${r.notified.error}.` : "";
        noteGo(`${r.again ? "Обновлено" : "Передано"} ${where}: цены зафиксированы версией «${
          r.version.name}», ${r.rows} ${plural(r.rows, "строка", "строки", "строк")}.`
          + (r.again ? " Цены поставщиков и поставки остались на своих позициях." : "")
          + (r.carried ? ` Из тендерной перенесено цен: ${r.carried}.` : "")
          + (r.job ? " Справочные цены каталогов подтягиваются сами." : "") + sent,
        allow("snb_proc") ? "Открыть в Снабжении" : "",
        () => SNAB.open(r.id, r.mode === "tender" ? "tender" : r.mode === "work" ? "work" : "proc"));
      },
    });
  }

  // Где калькуляция у снабжения: рабочая, проработка или тендерная.
  function supplyLabel(d) {
    const x = d.supplies || {};
    return x.contract ? (x.contract.work ? "В работе" : "В проработке") : x.tender ? "Тендерная проработка"
      : d.supply ? "В проработке" : "Передать на проработку";
  }

  /* Подсказка внизу с кнопкой перехода — «Открыть в Снабжении». */
  function noteGo(text, label, go) {
    const box = $s("#sitNote");
    if (!box) return;
    box.classList.remove("bad");
    // Без подписи — без кнопки: раздел, куда она вела бы, человеку закрыт.
    box.innerHTML = esc(text) + (label ? ` <button type="button" class="lnk" data-note-go>${esc(label)}</button>` : "");
    box.hidden = false;
    if (label) $s("[data-note-go]", box).addEventListener("click", go);
  }

  async function deleteVersion(v) {
    if (!v) return;
    if (!(await ASK.confirm(`Убрать версию «${v.name}»?\nСнимок исчезнет из дерева и из сравнения.`
                 + " Текущий расчёт не изменится."))) return;
    try {
      await AUTH.api("DELETE", "/versions/" + v.id);
      await refreshVersions(v.doc_id);
      if (openVer && openVer.version.id === v.id) openVer = null;
      render();
      note(`Версия «${v.name}» убрана`);
    } catch (e) {
      note("Не вышло: " + e.message, true);
    }
  }

  /* Взять версию за основу текущего расчёта. Ошибочная фиксация лечится
     корзиной, а это — про другое: текущую испортили или хотят продолжить
     от договорной, а не от того, что накрутили после. Чтобы возврат ничего
     не терял, текущие цены перед ним сохраняются версией — галочка
     стоит по умолчанию. */
  async function restoreVersion(v) {
    let next = "Изм. 1";
    try {
      next = (await AUTH.api("GET", "/documents/" + v.doc_id + "/versions")).next_name;
    } catch (e) { /* имя по умолчанию */ }
    const box = document.createElement("div");
    box.className = "pf-modal";
    box.innerHTML = `
      <div class="pf-crop cnt-card" role="dialog" aria-label="Сделать текущей">
        <h3>Сделать версию «${esc(v.name)}» текущей?</h3>
        <div class="note" style="margin-bottom:11px">Поставщики, цены материалов, расценки
          работ и наценка в текущем расчёте станут как в этой версии. Позиций, которых в
          версии нет, это не коснётся. Сама версия останется как была.</div>
        <label class="ver-keep"><input type="checkbox" id="rKeep" checked>
          <span>Сначала сохранить текущие цены версией «${esc(next)}» — чтобы к ним можно
          было вернуться</span></label>
        <div class="pf-note bad" id="rErr" hidden></div>
        <div class="pf-modal-foot"><span class="grow"></span>
          <button type="button" class="btn ghost" id="rNo">Отмена</button>
          <button type="button" class="btn" id="rOk">Сделать текущей</button></div>
      </div>`;
    document.body.appendChild(box);
    const close = () => { document.removeEventListener("keydown", onKey); box.remove(); };
    const onKey = (e) => { if (e.key === "Escape") close(); };
    document.addEventListener("keydown", onKey);
    box.addEventListener("click", (e) => { if (e.target === box) close(); });
    $s("#rNo", box).addEventListener("click", close);
    $s("#rOk", box).addEventListener("click", async () => {
      $s("#rOk", box).disabled = true;
      try {
        const r = await AUTH.api("POST", "/versions/" + v.id + "/restore",
                                 { keep: $s("#rKeep", box).checked ? next : "" });
        close();
        openVer = null;
        await openPositions(v.doc_id);
        note(`Версия «${v.name}» стала текущей: ${r.restored} ${plural(r.restored,
          "позиция", "позиции", "позиций")}` + (r.missed ? `, не нашлось в расчёте: ${r.missed}` : "")
          + (r.kept ? `. Прежние цены сохранены версией «${r.kept.name}»` : ""));
      } catch (e) {
        $s("#rErr", box).textContent = String(e.message);
        $s("#rErr", box).hidden = false;
        $s("#rOk", box).disabled = false;
      }
    });
  }

  async function openVersion(vid) {
    try {
      openVer = await AUTH.api("GET", "/versions/" + encodeURIComponent(vid));
    } catch (e) {
      return note("Не вышло: " + e.message, true);
    }
    render();
  }

  /* Снимок — та же таблица расчёта, но только читать: без колонок
     поставщиков и полей ввода, с замком в шапке. */
  function verHtml() {
    const v = openVer.version;
    const t = openVer.totals || {};
    const verSkipped = openVer.rows.filter((r) => r.skip && r.kind !== "section").length;
    const d = DOCS.find((x) => x.id === v.doc_id) || {};
    const site = SITES_ROWS.find((x) => x.id === openId) || {};
    return `
      <div class="pg">
        <div class="pg-head strip calc-head ver-head">
          <button type="button" class="pg-back" id="verBack"
                  title="Назад" aria-label="Назад">${ICO.back}</button>
          <div class="pg-h1">
            ${site.name ? `<span class="calc-obj">${esc(site.name)}</span>` : ""}
            <h2 title="${esc(d.title || d.filename || "Расчёт")}">${
              esc(d.title || d.filename || "Расчёт")}</h2>
          </div>
          <span class="ver-badge" title="Зафиксированная версия: не меняется ни от правок, ни от подтягивания цен">${
            ICO.lock}<b>${esc(v.name)}</b><i>${esc(dmyOf(v.at))}${v.author ? ", " + esc(v.author) : ""}${
            v.note ? " · " + esc(v.note) : ""}</i></span>
          <dl class="pg-facts">
            <div><dt>Позиции</dt><dd>${t.count || 0}</dd></div>
            ${verSkipped ? `<div><dt>Не учтено</dt><dd class="skip-n"
              title="Строки «Не учитывать» на момент фиксации">${verSkipped}</dd></div>` : ""}
            ${fact("Наценка", (t.markup || 0) + " %")}
            ${fact("Материалы", money(t.sum_buy) || "—")}
            ${fact("Работы", money(t.sum_work) || "—")}
            ${fact("Итого с НДС", money(t.sum_with_vat) || "—")}
            ${fact("в т.ч. НДС " + (t.vat ?? 22) + "%", money(t.sum_vat) || "—")}
            ${fact("Без НДС", money(t.sum_net) || "—")}
          </dl>
          <div class="pg-act pg-acts">
            <button type="button" class="btn-ghost sm" id="verCmp"
              title="Положить рядом с текущим расчётом и увидеть разницу">${ICO.cmp}Сравнить с текущей</button>
            ${can() ? `<button type="button" class="btn-ghost sm" id="verRestore"
              title="Взять цены этой версии за основу текущего расчёта — текущие цены перед этим можно сохранить версией">${
              ICO.again}Сделать текущей</button>` : ""}
            <button type="button" class="btn-brand sm" id="verCalc">Выгрузить калькуляцию</button>
          </div>
        </div>
        <div class="pg-body calc-body">
          <table class="tbl calc-tbl ver-tbl" style="--tbl-min:1180px">
            <colgroup><col style="width:44px"><col><col style="width:150px"><col style="width:90px">
              <col style="width:90px"><col style="width:44px"><col style="width:66px">
              <col style="width:120px"><col style="width:92px"><col style="width:86px">
              <col style="width:86px"><col style="width:104px"><col style="width:96px">
              <col style="width:104px"></colgroup>
            <thead>
              <tr>
                <th colspan="2" class="grp spec froze">Спецификация из проекта</th>
                <th colspan="5" class="grp spec"></th>
                <th class="grp lk">выбрано</th>
                <th class="grp calc">с наценкой</th>
                <th class="grp adc">Свой</th>
                <th colspan="4" class="grp calc">Формулы</th>
              </tr>
              <tr>
                <th class="pos-no">№</th>
                <th class="pos-name">Наименование и техническая характеристика</th>
                <th>Тип, марка</th><th>Код</th><th>Завод</th><th>Ед.</th>
                <th class="num">Кол-во</th>
                <th class="pos-who">Поставщик</th>
                <th class="num src">Материалы за ед.</th>
                <th class="num src">Работа за ед.</th>
                <th class="num src">Итого на ед.</th>
                <th class="num src">Материалы всего</th>
                <th class="num src">Работа всего</th>
                <th class="num src">Итого всего</th>
              </tr>
            </thead>
            <tbody>${openVer.rows.map((p) => p.kind === "section" ? `
              <tr class="sec"><td class="pos-no">${esc(p.pos_no)}</td>
                <td class="sec-name" colspan="13"><span class="sec-in">${esc(p.name)}</span></td></tr>` : `
              <tr${p.in_set || p.skip ? ` class="${[p.in_set ? "set" : "", p.skip ? "skip" : ""]
                .filter(Boolean).join(" ")}"` : ""}>
                <td class="pos-no">${esc(p.pos_no || (p.origin === "hand" ? "" : p.row_no))}</td>
                <td class="pos-name${p.kind === "part" ? " part" : ""}" title="${esc(p.name)}"><span
                  class="nm">${esc(p.name) || "—"}</span></td>
                <td class="pos-brand" title="${esc(p.brand)}">${esc(p.brand)}</td>
                <td class="pos-brand">${esc(p.code)}</td>
                <td class="pos-brand">${esc(p.maker)}</td>
                <td>${esc(p.unit)}</td>
                <td class="num">${esc(qtyText(p.qty))}</td>
                ${p.in_set ? `<td colspan="7" class="set-note">в составе ${esc(p.in_set)}</td>` : `
                <td class="pos-who" title="${esc(p.supplier)}">${esc(p.supplier) || "—"}</td>
                <td class="num${p.sell_price != null ? " manual" : ""}">${sum0(p.mat_unit)}</td>
                <td class="num">${sum0(p.work_price)}</td>
                <td class="num pos-calc">${sum0(p.unit_total)}</td>
                <td class="num pos-calc">${sum0(p.sum_buy)}</td>
                <td class="num pos-calc">${sum0(p.sum_work)}</td>
                <td class="num pos-calc tot"${p.skip ? ' title="Не учитывалась в этой версии"' : ""}>${
                  p.skip ? "не учит." : sum0(p.sum_total)}</td>`}
              </tr>`).join("")}</tbody>
          </table>
        </div>
        <div class="pg-note" id="sitNote" hidden></div>
      </div>`;
  }

  function wireVer(host) {
    const v = openVer.version;
    $s("#verBack", host).addEventListener("click", () => { openVer = null; render(); });
    fitCalcHead(host);
    $s("#verCmp", host).addEventListener("click", () => openCompare(v.doc_id, [v.id, "current"]));
    if ($s("#verRestore", host)) {
      $s("#verRestore", host).addEventListener("click", () => restoreVersion(v));
    }
    $s("#verCalc", host).addEventListener("click", () => calcForm({
      url: "/api/versions/" + v.id + "/calc", totals: openVer.totals, docId: v.doc_id, frozen: true }));
    wirePan(host);
    GRID.freeze($s("table.calc-tbl", host), 2);
  }

  /* ── сравнение версий ────────────────────────────────────────
     Отдельный экран: сверху выбираешь, какие версии положить рядом
     (галочками, сколько угодно) и что сравнивать; ниже — позиции строками,
     версии группами колонок, у каждой не-базовой версии рядом с числом
     разница с базой. База — самая ранняя из выбранных, меняется списком. */
  async function openCompare(docId, picked) {
    let all;
    try {
      all = (await AUTH.api("GET", "/documents/" + encodeURIComponent(docId) + "/versions")).rows;
    } catch (e) {
      return note("Не вышло: " + e.message, true);
    }
    const doc = DOCS.find((x) => x.id === docId) || { id: docId };
    CMP = {
      doc,
      all: [...all, { id: "current", name: "Текущая", at: "", author: "" }],
      picked: new Set(picked), base: "", baseManual: false,
      params: new Set(["mat_unit", "work_price", "sum_total"]),
      onlyDiff: false, q: "", data: null, busy: true, error: "",
    };
    await loadCompare();
  }

  /* Порядок версий в сравнении: база первой, остальные как заведены —
     от ранней к поздней, текущая последней. База — самая ранняя из
     выбранных, пока её не выбрали списком руками: добавили «Тендерную»
     к «Договорной» — сравнивается уже от тендерной. */
  function cmpOrder() {
    const ids = CMP.all.map((v) => v.id).filter((id) => CMP.picked.has(id));
    if (!CMP.baseManual || !ids.includes(CMP.base)) CMP.base = ids[0] || "";
    return [CMP.base, ...ids.filter((id) => id !== CMP.base)];
  }

  async function loadCompare() {
    CMP.error = "";
    if (CMP.picked.size < 2) {
      CMP.data = null;
      CMP.busy = false;
      return render();
    }
    CMP.busy = true;
    try {
      CMP.data = await AUTH.api("GET", "/documents/" + encodeURIComponent(CMP.doc.id)
        + "/compare?v=" + cmpOrder().map(encodeURIComponent).join(","));
    } catch (e) {
      CMP.data = null;
      CMP.error = e.message;
    }
    CMP.busy = false;
    render();
  }

  const cmpDiffers = (a, b, key) => {
    if (key === "supplier") return String((a || {}).supplier || "").trim() !== String((b || {}).supplier || "").trim();
    return Math.round(Number((a || {})[key] || 0) * 100) !== Math.round(Number((b || {})[key] || 0) * 100);
  };

  /* Разница с базой: в деньгах и процентах, цветом — дороже красным,
     дешевле зелёным. Проценты от базы; базы нет — только число. */
  function deltaHtml(v, b, kind) {
    const d = Math.round((Number(v || 0) - Number(b || 0)) * 100) / 100;
    if (!d) return "";
    const pct = Number(b) ? Math.round(d / Number(b) * 100) : null;
    const num = kind === "num" ? qtyText(Math.abs(d)) : money(Math.abs(d));
    return `<i class="dl ${d > 0 ? "up" : "down"}" title="Разница с базовой версией">${
      d > 0 ? "+" : "−"}${num}${pct !== null && Math.abs(pct) < 1000 ? ` (${d > 0 ? "+" : "−"}${Math.abs(pct)}%)` : ""}</i>`;
  }

  function cmpHtml() {
    const site = SITES_ROWS.find((x) => x.id === openId) || {};
    const d = CMP.doc;
    const order = cmpOrder();
    const named = (id) => (CMP.all.find((v) => v.id === id) || {}).name || id;
    const docName = [site.name, d.title || d.filename].filter(Boolean).join(" · ");
    return `
      <div class="pg cmp">
        <div class="pg-head strip cmp-head">
          <button type="button" class="pg-back" id="cmpBack" title="Назад" aria-label="Назад">${ICO.back}</button>
          <div class="pg-h1">
            <h2>Сравнение калькуляций</h2>
            ${docName ? `<span class="cmp-doc" title="${esc(docName)}">${esc(docName)}</span>` : ""}
          </div>
          <div class="pg-act pg-acts">
            <button type="button" class="btn-ghost sm" id="cmpXlsx"${CMP.data ? "" : " disabled"}
              title="Та же таблица книгой Excel">${ICO.down}Скачать Excel</button>
          </div>
        </div>
        <div class="cmp-bar">
            <div class="cmp-row">
              <span class="cmp-l">Версии</span>
              <div class="cmp-chips">${CMP.all.map((v) => `<button type="button"
                class="cmp-chip${CMP.picked.has(v.id) ? " on" : ""}${v.id === "current" ? " cur" : ""}"
                data-pick="${esc(v.id)}" title="${CMP.picked.has(v.id) ? "Убрать из сравнения" : "Добавить в сравнение"}">${
                v.id === "current" ? "" : ICO.lock}${esc(v.name)}${v.at ? `<i>${esc(dmyOf(v.at))}</i>` : ""}</button>`).join("")}</div>
              <label class="cmp-base"><span>База</span>
                <select class="role-sel" id="cmpBase"${order.length < 2 ? " disabled" : ""}>${
                  order.length ? order.slice().sort((a, b) => CMP.all.findIndex((v) => v.id === a)
                    - CMP.all.findIndex((v) => v.id === b)).map((id) => `<option value="${esc(id)}"${
                    id === CMP.base ? " selected" : ""}>${esc(named(id))}</option>`).join("")
                  : '<option value="">—</option>'}</select></label>
            </div>
            <div class="cmp-row">
              <span class="cmp-l">Сравнить</span>
              <div class="cmp-chips">${PARAMS.map(([k, label]) => `<button type="button"
                class="cmp-chip prm${CMP.params.has(k) ? " on" : ""}" data-prm="${k}">${label}</button>`).join("")}</div>
              <label class="cmp-only"><input type="checkbox" id="cmpOnly"${CMP.onlyDiff ? " checked" : ""}>
                Только отличия</label>
              <label class="pg-find cmp-find">${ICO.find}<input id="cmpQ" placeholder="Позиция"
                value="${esc(CMP.q)}"></label>
            </div>
        </div>
        <div id="cmpBody" class="pg-body calc-body"></div>
        <div class="pg-note" id="sitNote" hidden></div>
      </div>`;
  }

  /* Тело сравнения рисуется отдельно от полосы выбора: поиск печатают в
     поле, и пересоздавать его на каждый знак нельзя. */
  function paintCmp() {
    const host = $s("#cmpBody");
    if (!host) return;
    if (CMP.busy) {
      host.innerHTML = `<div class="pg-empty"><b>Сравниваю…</b></div>`;
      return;
    }
    if (CMP.error) {
      host.innerHTML = `<div class="pg-empty"><b>Не вышло</b>${esc(CMP.error)}</div>`;
      return;
    }
    if (!CMP.data) {
      host.innerHTML = `<div class="pg-empty"><b>Выберите хотя бы две версии</b>Отметьте сверху,
        какие версии положить рядом. Текущий расчёт — тоже версия.</div>`;
      return;
    }
    const V = CMP.data.versions;
    const prm = PARAMS.filter(([k]) => CMP.params.has(k));
    if (!prm.length) {
      host.innerHTML = `<div class="pg-empty"><b>Выберите, что сравнивать</b>Цену материала,
        расценку работы, сумму — хотя бы одно.</div>`;
      return;
    }
    const q = CMP.q.trim().toLowerCase();
    const rows = CMP.data.rows.map((r) => {
      const base = r.cells[0];
      const diff = r.kind !== "section" && r.cells.some((c, n) => n && (
        (c === null) !== (base === null) || prm.some(([k]) => cmpDiffers(base, c, k))));
      return { ...r, diff };
    }).filter((r) => r.kind === "section" || (
      (!CMP.onlyDiff || r.diff) && (!q || (r.pos_no + " " + r.name + " " + r.brand).toLowerCase().includes(q))));
    // Раздел без строк под ним — не показываем.
    const shown = rows.filter((r, i) => r.kind !== "section"
      || (rows[i + 1] && rows[i + 1].kind !== "section"));
    const n = shown.filter((r) => r.kind !== "section").length;
    const changed = shown.filter((r) => r.diff).length;
    const val = (c, k, kind) => c === null ? "" : k === "supplier" ? esc(c.supplier || "—")
      : kind === "num" ? esc(qtyText(c[k])) : sum0(c[k]);
    const totals = V.map((v) => v.totals || {});
    host.innerHTML = `
      <div class="cmp-sum">${V.map((v, i) => `
        <div class="cmp-card${i ? "" : " base"}">
          <dt>${esc(v.name)}${i ? "" : " · база"}${v.at ? `<i>${esc(dmyOf(v.at))}</i>` : ""}</dt>
          <dd><b>${money(totals[i].sum_with_vat) || "—"}</b><span>с НДС</span></dd>
          <dd class="sub">без НДС ${money(totals[i].sum_net) || "—"}${
            i ? deltaHtml(totals[i].sum_total, totals[0].sum_total, "money") : ""}</dd>
        </div>`).join("")}
        <div class="cmp-card meta"><dt>Позиции</dt><dd><b>${n}</b><span>${
          CMP.onlyDiff || q ? "показано" : "всего"}</span></dd>
          <dd class="sub">с отличиями ${changed}</dd></div>
      </div>
      <table class="tbl calc-tbl cmp-tbl" style="--tbl-min:${560 + V.length * prm.length * 118}px">
        <colgroup><col style="width:44px"><col style="width:300px"><col style="width:44px">${
          V.map(() => prm.map(() => '<col style="width:118px">').join("")).join("")}</colgroup>
        <thead>
          <tr>
            <th colspan="2" class="grp spec froze">Позиция</th><th class="grp spec"></th>
            ${V.map((v, i) => `<th colspan="${prm.length}" class="grp ${i ? "calc" : "lk"}"
              title="${esc(v.name)}${v.at ? " · " + esc(dmyOf(v.at)) : ""}">${esc(v.name)}${i ? "" : " · база"}</th>`).join("")}
          </tr>
          <tr>
            <th class="pos-no">№</th><th class="pos-name">Наименование</th><th>Ед.</th>
            ${V.map((v, i) => prm.map(([, label]) => `<th class="num src${i ? "" : " base"}">${label}</th>`).join("")).join("")}
          </tr>
        </thead>
        <tbody>${shown.map((r) => r.kind === "section" ? `
          <tr class="sec"><td class="pos-no">${esc(r.pos_no)}</td>
            <td class="sec-name" colspan="${2 + V.length * prm.length}"><span class="sec-in">${esc(r.name)}</span></td></tr>` : `
          <tr class="${r.diff ? "diff" : ""}${r.extra ? " extra" : ""}">
            <td class="pos-no">${esc(r.pos_no)}</td>
            <td class="pos-name" title="${esc(r.name)}${r.brand ? " · " + esc(r.brand) : ""}"><span class="nm">${
              esc(r.name) || "—"}</span>${r.brand ? `<i class="cmp-brand">${esc(r.brand)}</i>` : ""}</td>
            <td>${esc(r.unit)}</td>
            ${r.cells.map((c, i) => c === null ? `<td colspan="${prm.length}" class="cmp-none">нет в версии</td>`
              : prm.map(([k, , kind]) => {
                const chg = i && cmpDiffers(r.cells[0], c, k);
                return `<td class="num${i ? "" : " base"}${chg ? " chg" : ""}${k === "supplier" ? " who" : ""}">${
                  val(c, k, kind)}${chg && k !== "supplier" ? deltaHtml(c[k], (r.cells[0] || {})[k], kind) : ""}</td>`;
              }).join("")).join("")}
          </tr>`).join("")}${n ? "" : `
          <tr><td colspan="${3 + V.length * prm.length}" class="cmp-empty">${
            CMP.onlyDiff ? "Отличий нет — версии совпадают по выбранным параметрам" : "Ничего не нашлось"}</td></tr>`}
        </tbody>
        <tfoot><tr>
          <td colspan="3" class="cmp-tot-l">Итого с НДС</td>
          ${V.map((v, i) => `<td colspan="${prm.length}" class="num tot">${money(totals[i].sum_total) || "—"}${
            i ? deltaHtml(totals[i].sum_total, totals[0].sum_total, "money") : ""}</td>`).join("")}
        </tr></tfoot>
      </table>`;
    GRID.freeze($s("table.cmp-tbl", host), 2);
  }

  function wireCmp(host) {
    $s("#cmpBack", host).addEventListener("click", () => { CMP = null; render(); });
    host.querySelectorAll("[data-pick]").forEach((b) => b.addEventListener("click", () => {
      const id = b.dataset.pick;
      if (CMP.picked.has(id)) CMP.picked.delete(id); else CMP.picked.add(id);
      loadCompare();
    }));
    $s("#cmpBase", host).addEventListener("change", (e) => {
      CMP.base = e.target.value;
      CMP.baseManual = true;
      loadCompare();
    });
    host.querySelectorAll("[data-prm]").forEach((b) => b.addEventListener("click", () => {
      const k = b.dataset.prm;
      if (CMP.params.has(k)) CMP.params.delete(k); else CMP.params.add(k);
      b.classList.toggle("on", CMP.params.has(k));
      paintCmp();
    }));
    $s("#cmpOnly", host).addEventListener("change", (e) => { CMP.onlyDiff = e.target.checked; paintCmp(); });
    $s("#cmpQ", host).addEventListener("input", (e) => { CMP.q = e.target.value; paintCmp(); });
    $s("#cmpXlsx", host).addEventListener("click", async (e) => {
      try {
        await DL.save("/api/documents/" + encodeURIComponent(CMP.doc.id) + "/compare.xlsx", {
          btn: e.currentTarget, name: "Сравнение калькуляций.xlsx",
          error: "Не удалось собрать книгу",
          body: { v: cmpOrder(), params: PARAMS.map(([k]) => k).filter((k) => CMP.params.has(k)) } });
      } catch (err) {
        note("Не вышло: " + err.message, true);
      }
    });
    wirePan(host);
    paintCmp();
  }

  /* ── цены объекта ───────────────────────────────────────────
     Заказчик 22.09.2026: бывает, что по договору покупать велено у одного
     поставщика и по его ценам, а щиты для каждого объекта считает дочерняя
     компания. Такие цены грузятся в объект файлом, в справочник материалов
     не попадают и в расчёте стоят колонкой «Цена объекта»: её цена идёт в
     расчёт раньше минимальной у поставщиков. Щит с такой ценой считается
     целиком — строки его состава «в составе щита». */
  const spReady = () => (SPRICES.rows || []).filter((x) => x.status === "ready").length;
  const spDate = (d) => String(d || "").split("-").reverse().join(".");

  function spState(x) {
    const n = (k) => `${k} ${plural(k, "позиция", "позиции", "позиций")}`;
    if (x.status === "ready") {
      if (x.kind === "boards" && x.total) {
        return `найдено ${x.matched} из ${x.total} ${plural(x.total, "щита", "щитов", "щитов")}`;
      }
      return `найдено ${n(x.matched)}${x.maybe ? `, ${x.maybe} под вопросом` : ""}`;
    }
    if (x.status === "check") return "не проверен — нажмите «Проверить»";
    if (x.status === "failed") return x.error || "не получилось";
    return (x.progress || "готовлю") + "…";
  }

  /* Во вкладке «Тендер» — под спецификациями: цены объекта считаются в тех
     же расчётах. Пока файлов нет — одна строка-подсказка, и только там, где
     расчёт уже есть. */
  function spBlockHtml(hasCalc) {
    const list = SPRICES.rows || [];
    if (!list.length) {
      return hasCalc && can() ? `<div class="sp-hint">${ICO.pin}<span>Щиты от дочки и прайс
        поставщика по договору — кнопка «Цены объекта»: цены из файла встанут в расчёт раньше
        минимальной у поставщиков.</span></div>` : "";
    }
    return `<section class="sp-block">
      <div class="sp-head"><b>Цены объекта</b><span class="sit-hint">только для этого объекта:
        в справочник материалов не попадают, в расчёте идут раньше минимальной цены
        поставщиков</span></div>
      ${spTable(list)}
    </section>`;
  }

  /* Та же таблица, что у спецификаций: файл, что с ним, кто и когда, действия. */
  function spTable(list) {
    return `<table class="tbl sit-docs sp-tbl" style="--tbl-min:720px">
      <colgroup><col><col style="width:230px"><col style="width:135px"><col style="width:132px"></colgroup>
      <tbody>${list.map(spRowHtml).join("")}</tbody></table>`;
  }

  function spRowHtml(x) {
    return `<tr data-sp="${esc(x.id)}">
      <td><div class="sit-doc">${fileIcon(x.filename)}<span class="sit-doc-t">
        <b>${x.kind ? `<span class="sp-kind ${esc(x.kind)}">${esc(x.kind_label)}</span>` : ""}${
          esc(x.supplier || x.filename)}</b>
        <i>${esc(x.filename)} · ${fmtSize(x.size)}${x.date ? " · от " + esc(spDate(x.date)) : ""}</i>
      </span></div></td>
      <td class="sp-state${x.status === "failed" ? " bad" : ""}">${esc(spState(x))}</td>
      <td class="sit-who">${esc(x.author)}<i>${esc(String(x.at || "").slice(0, 10))}</i></td>
      <td class="acts">
        ${x.status === "check" && can() ? `<button type="button" class="btn-ghost sm"
          data-spcheck>Проверить</button>` : ""}
        <button type="button" class="ico" data-spdl title="Скачать файл">${ICO.down}</button>
        ${can() ? `<button type="button" class="ico warn" data-sprm
          title="Убрать: цены этого файла уйдут из расчётов объекта">${ICO.trash}</button>` : ""}
      </td></tr>`;
  }

  /* done — закрыть окно, из которого нажали: следом откроется другое. */
  function wireSp(root, done) {
    const id = (b) => b.closest("[data-sp]").dataset.sp;
    root.querySelectorAll("[data-spcheck]").forEach((b) => b.addEventListener("click", async () => {
      try {
        const x = await AUTH.api("GET", "/site-prices/" + encodeURIComponent(id(b)));
        if (done) done();
        spReview(x, false);
      } catch (e) {
        note("Не вышло: " + e.message, true);
      }
    }));
    root.querySelectorAll("[data-spdl]").forEach((b) => b.addEventListener("click", () =>
      spDownload(id(b), b)));
    root.querySelectorAll("[data-sprm]").forEach((b) => b.addEventListener("click", () => {
      const sp = id(b);
      if (done) done();
      spRemove(sp);
    }));
  }

  function spChoose() {
    const inp = document.createElement("input");
    inp.type = "file";
    inp.accept = ".xlsx,.xlsm,.xls,.pdf";
    inp.addEventListener("change", () => { if (inp.files[0]) spSend(inp.files[0]); });
    inp.click();
  }

  /* Файл уходит на сервер, тот его читает и возвращает, что нашёл: таблицы,
     колонки цен, дату, НДС и догадку, щиты это или прайс. Дальше человек
     подтверждает в окне проверки. */
  async function spSend(f) {
    const site = openId;
    note(`Читаю «${f.name}»…`);
    FRESH.hold();
    const tr = TRACE.start({ kind: "prices", file: f.name });
    try {
      const r = await fetch("/api/sites/" + encodeURIComponent(site) + "/prices", {
        method: "POST",
        headers: { Authorization: "Bearer " + AUTH.token(),
                   "X-File-Name": encodeURIComponent(f.name),
                   "Content-Type": f.type || "application/octet-stream" },
        body: f,
      });
      let x = null;
      try { x = await r.json(); } catch (e) { /* не json: ответил nginx */ }
      if (!r.ok) {
        throw new Error((x && x.error) || (r.status === 413 ? "Файл больше, чем принимает сервер"
          : "Не удалось загрузить, ответ сервера " + r.status));
      }
      tr.done("Прочитал — проверьте, что это за цены");
      note(`«${f.name}» прочитан — проверьте, что это за цены`);
      spReview(x, true);
    } catch (e) {
      tr.fail("Не получилось: " + e.message);
      note(e.message, true);
    } finally {
      FRESH.release();
    }
  }

  /* Проверка перед тем, как цены встанут в расчёт: щиты это или прайс по
     договору, чьи цены, от какого числа, с НДС ли, какую колонку брать.
     Всё предложено по файлу — человек подтверждает и видит на образце
     строк, что встанет в расчёт. fresh — окно открыто сразу после
     загрузки: отмена тогда убирает и сам файл, недопроверенный он никому
     не нужен. */
  function spReview(x, fresh) {
    const meta = x.meta || {};
    const tables = meta.tables || [];
    const guess = meta.guess || {};
    const st = tables.map((t) => ({ on: true, price: t.choice }));
    let kind = x.kind || guess.kind || "contract";
    let vat = x.vat || "included";
    let rate = x.vat_rate ?? 22;
    let typed = !!x.supplier;
    // Щиты для всех объектов считает одна дочка — кого вписали в прошлый
    // раз, того и предлагаем; прайс — чей он, по имени файла. Имя файла
    // щитов («КП щиты ЮК дом 8») поставщика не называет — пусть впишут.
    const supFor = (k) => (k === "boards" ? guess.boards_supplier : guess.supplier) || "";
    const TIP = {
      boards: "Щиты ищутся по обозначению — ВРУ1, ЩАО-1, ЩР-ДН5 — в номере позиции и в названии."
        + " У щита с ценой его состав («состоит из:») отдельно не считается: он уже в цене щита.",
      contract: "Позиции ищутся по артикулу и словам, как в каталогах. Найденная цена идёт в расчёт,"
        + " даже если у других поставщиков дешевле: покупать велено здесь.",
    };
    const SUP = { boards: "Кто считал щиты — например, дочерняя компания",
                  contract: "Поставщик, у которого велено покупать по договору" };
    const box = document.createElement("div");
    box.className = "pf-modal";
    box.innerHTML = `
      <div class="pf-crop cnt-card mat-rv mat-plc sp-rv" role="dialog" aria-label="Цены объекта">
        <h3>Цены объекта</h3>
        <p class="mat-usage-sub">${esc(x.filename)} · ${(x.rows || 0).toLocaleString("ru-RU")} ${
          plural(x.rows || 0, "строка", "строки", "строк")} с ценой</p>
        <div class="seg sp-kinds">
          <button type="button" class="seg-b" data-kind="boards">Щиты</button>
          <button type="button" class="seg-b" data-kind="contract">Прайс по договору</button>
        </div>
        <p class="sp-ktip" data-ktip></p>
        <div class="mat-plc-grid">
          <label class="mat-plc-f"><span>Чьи цены</span>
            <input class="pos-in" data-sup list="spSupList" value="${esc(x.supplier || supFor(kind))}"
              placeholder="Название компании">
            <i class="dim" data-suptip></i></label>
          <label class="mat-plc-f"><span>От какого числа</span>
            <input class="pos-in" type="date" data-date value="${esc(x.date
              || new Date().toISOString().slice(0, 10))}">
            <i class="dim">${meta.date ? esc("Дату нашли " + meta.date_src + ". Проверьте")
              : "В файле даты не нашли — впишите из письма"}</i></label>
          <label class="mat-plc-f"><span>Цены в файле</span>
            <span class="mat-plc-vat"><select class="role-sel" data-vat>
              <option value="included"${vat === "included" ? " selected" : ""}>с НДС</option>
              <option value="excluded"${vat === "excluded" ? " selected" : ""}>без НДС</option></select>
              <span data-ratebox>ставка <input class="pos-in num" data-rate value="${esc(rate)}"> %</span></span>
            <i class="dim">${meta.vat_why ? esc(meta.vat_why) + ". " : ""}Цены лягут без НДС, как у поставщиков; в расчёте к ним прибавится НДС</i></label>
        </div>
        <datalist id="spSupList">${(SPRICES.suppliers || []).map((n) =>
          `<option value="${esc(n)}">`).join("")}</datalist>
        <div class="mat-plc-tables" data-tables></div>
        <div class="pf-note bad" data-err hidden></div>
        <div class="pf-modal-foot">
          <span class="mat-form-hint mat-rv-hint">Цены действуют только в этом объекте: в справочник
            материалов не попадают. В расчёте — колонка «Цена объекта».</span>
          <span class="grow"></span>
          <button type="button" class="btn ghost" data-no>Отмена</button>
          <button type="button" class="btn" data-ok>Поставить цены в расчёт</button></div>
      </div>`;
    document.body.appendChild(box);
    const $c = (q) => box.querySelector(q);
    const paintKind = () => {
      box.querySelectorAll("[data-kind]").forEach((b) =>
        b.classList.toggle("on", b.dataset.kind === kind));
      $c("[data-ktip]").textContent = TIP[kind];
      $c("[data-suptip]").textContent = SUP[kind];
      if (!typed) $c("[data-sup]").value = supFor(kind);
    };
    const paintTables = () => {
      $c("[data-ratebox]").hidden = vat !== "included";
      $c("[data-tables]").innerHTML = tables.map((t, i) => {
        const y = st[i];
        const net = (v) => v === null || v === undefined ? null
          : vat === "included" && rate ? v / (1 + rate / 100) : v;
        return `<section class="mat-plc-t${y.on ? "" : " off"}">
          <div class="mat-plc-th">
            ${tables.length > 1 ? `<label><input type="checkbox" data-on="${i}"${y.on ? " checked" : ""}>
              <b>${esc(t.sheet)}</b></label>` : `<b>${esc(t.sheet)}</b>`}
            <span class="dim">${t.count.toLocaleString("ru-RU")} ${plural(t.count, "строка", "строки", "строк")}</span>
            <span class="grow"></span>
            ${t.prices.length > 1 ? `<span class="dim">цена из колонки</span>
            <select class="role-sel" data-price="${i}">${t.prices.map((p, k) => `<option value="${k}"${
              k === y.price ? " selected" : ""}>${esc(p.label)} · ${p.filled.toLocaleString("ru-RU")} цен</option>`).join("")}</select>`
              : `<span class="dim">цена из колонки «${esc((t.prices[0] || {}).label || "")}»</span>`}
          </div>
          <div class="mat-usage-scroll"><table class="mat-usage-tbl">
            <thead><tr><th>${kind === "boards" ? "Обозначение" : "Код"}</th><th>Наименование</th><th>Ед.</th>
              <th class="num">В файле</th><th class="num">В расчёт${vat === "included" ? ", без НДС" : ""}</th></tr></thead>
            <tbody>${(t.sample || []).slice(0, 6).map((it) => {
              const v = it.p[y.price];
              return `<tr><td class="dim">${esc(it.c)}</td><td>${esc(it.n)}</td><td>${esc(it.u)}</td>
                <td class="num">${v === null || v === undefined ? "—" : money(v)}</td>
                <td class="num"><b>${v === null || v === undefined ? "—" : money(net(v))}</b></td></tr>`;
            }).join("")}</tbody></table></div>
        </section>`;
      }).join("");
      box.querySelectorAll("[data-on]").forEach((el) => el.addEventListener("change", () => {
        st[Number(el.dataset.on)].on = el.checked;
        paintTables();
      }));
      box.querySelectorAll("[data-price]").forEach((el) => el.addEventListener("change", () => {
        st[Number(el.dataset.price)].price = Number(el.value);
        paintTables();
      }));
    };
    paintKind();
    paintTables();
    let done = false;
    const close = () => {
      document.removeEventListener("keydown", key);
      box.remove();
      // Отменили сразу после загрузки — файл не нужен.
      if (!done && fresh) {
        AUTH.api("DELETE", "/site-prices/" + encodeURIComponent(x.id)).catch(() => {});
      }
    };
    const key = (e) => { if (e.key === "Escape") close(); };
    document.addEventListener("keydown", key);
    box.addEventListener("click", (e) => { if (e.target === box) close(); });
    $c("[data-no]").addEventListener("click", close);
    box.querySelectorAll("[data-kind]").forEach((b) => b.addEventListener("click", () => {
      kind = b.dataset.kind;
      paintKind();
      paintTables();
    }));
    $c("[data-sup]").addEventListener("input", () => { typed = true; });
    $c("[data-vat]").addEventListener("change", (e) => { vat = e.target.value; paintTables(); });
    $c("[data-rate]").addEventListener("input", (e) => {
      const v = Number(String(e.target.value).replace(",", "."));
      if (!Number.isNaN(v)) { rate = v; paintTables(); }
    });
    $c("[data-ok]").addEventListener("click", async () => {
      const err = $c("[data-err]");
      err.hidden = true;
      $c("[data-ok]").disabled = true;
      try {
        await AUTH.api("POST", "/site-prices/" + encodeURIComponent(x.id) + "/apply", {
          kind, supplier: $c("[data-sup]").value, date: $c("[data-date]").value, vat, vat_rate: rate,
          tables: st.map((y, i) => ({ i, on: y.on, price: y.price })) });
        done = true;
        close();
        note(`Цены объекта «${$c("[data-sup]").value || x.filename}»: ищу позиции в расчётах объекта…`);
        spWatch(x.id);
      } catch (e) {
        err.textContent = e.message;
        err.hidden = false;
        $c("[data-ok]").disabled = false;
      }
    });
    $c("[data-sup]").focus();
  }

  function spDone(x) {
    if (x.kind === "boards") {
      if (!x.matched) {
        return `Щиты «${x.supplier}»: ни один щит расчёта в файле не нашёлся. Проверьте, что в файле`
          + " есть обозначения — ВРУ1, ЩО-1, — или выберите строку руками: ⌕ в колонке «Цена объекта»";
      }
      return `Щиты «${x.supplier}»: цены встали у ${x.matched}${x.total ? ` из ${x.total}` : ""} ${
        plural(x.total || x.matched, "щита", "щитов", "щитов")}. Их состав в расчёте — «в составе`
        + " щита» и отдельно не считается";
    }
    return `Прайс по договору «${x.supplier}»: цены встали у ${x.matched} ${
      plural(x.matched, "позиции", "позиций", "позиций")}${x.maybe ? `, ещё ${x.maybe} нашлись под`
        + " вопросом — их цена встаёт, только если у поставщиков нет уверенной" : ""}`;
  }

  /* Поиск по файлу и сопоставление идут на сервере: смотрим за ними и,
     когда кончилось, перечитываем объект и открытый расчёт. */
  const SP_WATCH = new Set();
  async function spWatch(id) {
    if (SP_WATCH.has(id)) return;
    SP_WATCH.add(id);
    const site = openId;
    FRESH.hold();
    try {
      for (let i = 0; i < 400; i++) {
        const x = await AUTH.api("GET", "/site-prices/" + encodeURIComponent(id));
        if (openId !== site) return;
        const rows = SPRICES.rows || (SPRICES.rows = []);
        const k = rows.findIndex((r) => r.id === id);
        if (k >= 0) rows[k] = x; else rows.unshift(x);
        if (x.status === "ready" || x.status === "failed") {
          await loadOne(site);
          if (openDoc) await openPositions(openDoc.id); else render();
          note(x.status === "ready" ? spDone(x) : `Цены объекта «${x.filename}»: ${x.error}`,
               x.status === "failed");
          return;
        }
        const cell = document.querySelector(`[data-sp="${id}"] .sp-state`);
        if (cell) cell.textContent = spState(x);
        await new Promise((r) => setTimeout(r, 1500));
      }
    } catch (e) {
      note("Не вышло дождаться цен объекта: " + e.message, true);
    } finally {
      SP_WATCH.delete(id);
      FRESH.release();
    }
  }

  async function spRemove(id) {
    const x = (SPRICES.rows || []).find((r) => r.id === id) || {};
    if (!(await ASK.confirm(`Убрать цены объекта «${x.supplier || x.filename}»? Они уйдут из расчётов объекта —`
      + " строки вернутся к минимальной цене у поставщиков."))) return;
    try {
      const r = await AUTH.api("DELETE", "/site-prices/" + encodeURIComponent(id));
      await loadOne(openId);
      if (openDoc) await openPositions(openDoc.id); else render();
      note(r.positions ? `Цены объекта убраны: ${r.positions} ${plural(r.positions, "строка вернулась",
        "строки вернулись", "строк вернулись")} к минимальной цене у поставщиков` : "Файл цен убран");
    } catch (e) {
      note("Не вышло: " + e.message, true);
    }
  }

  async function spDownload(id, btn) {
    const x = (SPRICES.rows || []).find((r) => r.id === id) || {};
    try {
      await DL.save("/api/site-prices/" + encodeURIComponent(id) + "/file",
                    { btn, name: x.filename, fallback: "цены.xlsx" });
    } catch (e) {
      note("Не скачалось: " + e.message, true);
    }
  }

  /* Окно «Цены объекта» из расчёта: какие файлы стоят и загрузка нового —
     не уходя из расчёта во вкладку «Тендер». */
  function spDialog() {
    const box = document.createElement("div");
    box.className = "pf-modal";
    const list = SPRICES.rows || [];
    box.innerHTML = `<div class="pf-crop cnt-card sp-dlg" role="dialog" aria-label="Цены объекта">
      <h3>Цены объекта</h3>
      <p class="mat-usage-sub">Щиты от дочки и прайс поставщика по договору. Цены действуют только
        в этом объекте и идут в расчёт раньше минимальной у поставщиков. Цену можно и вписать прямо в
        клетку колонки «Цена объекта».</p>
      ${list.length ? spTable(list)
        : `<div class="pg-empty"><b>Файлов пока нет</b>Загрузите книгу Excel или PDF с ценами дочки
          на щиты или прайс поставщика по договору.</div>`}
      <div class="pf-modal-foot"><span class="grow"></span>
        <button type="button" class="btn ghost" data-no>Закрыть</button>
        ${can() ? `<button type="button" class="btn" data-up>Загрузить файл</button>` : ""}</div>
    </div>`;
    const close = () => { document.removeEventListener("keydown", key); box.remove(); };
    const key = (e) => { if (e.key === "Escape") close(); };
    document.addEventListener("keydown", key);
    box.addEventListener("click", (e) => { if (e.target === box) close(); });
    document.body.appendChild(box);
    wireSp(box, close);
    box.querySelector("[data-no]").addEventListener("click", close);
    const up = box.querySelector("[data-up]");
    if (up) up.addEventListener("click", () => { close(); spChoose(); });
  }

  /* ── загрузка файла ────────────────────────────────────── */
  /* XMLHttpRequest, а не fetch: fetch не показывает, сколько уже ушло,
     а проектный том грузится десятками секунд — без полосы человек
     решит, что всё зависло, и нажмёт ещё раз. */
  /* Куда грузим — приходит от того места, откуда нажали. Из «Документов»
     это вид без привязки, из карточки проекта — сам проект, из списка
     изменений — конкретный выпуск. Прежде вид и привязку выбирали двумя
     списками в чужой вкладке: человек стоял в «Документах» и оттуда
     указывал, к какому проекту относится файл. Место выбора и место, к
     которому выбирают, были разными — отсюда и лишний список. */
  /* Отправка файла. XMLHttpRequest, а не fetch: fetch не показывает,
     сколько уже ушло, а проектный том грузится десятками секунд — без
     полосы человек решит, что всё зависло, и нажмёт ещё раз.

     Прогресс и ошибку показываем в самом окне: оно и так перед глазами,
     а всплывающая строка под таблицей была бы за ним. */
  function send(f, to, box, close) {
    const prog = $s("#upProg", box);
    const bar = prog.querySelector("i");
    const err = $s("#upErr", box);
    prog.hidden = false;
    err.hidden = true;

    /* Пока файл едет, вкладку перезагружать нельзя: сорок мегабайт по
       медленному каналу идут минутами, и обновление посреди отправки
       означает начать заново. */
    FRESH.hold();
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/sites/" + encodeURIComponent(openId) + "/documents");
    xhr.setRequestHeader("Authorization", "Bearer " + AUTH.token());
    /* В заголовке HTTP допустим только latin-1: «Договор №5.pdf» без
       кодирования оборвал бы запрос. */
    xhr.setRequestHeader("X-Doc-Name", encodeURIComponent(f.name));
    xhr.setRequestHeader("X-Doc-Kind", to.kind);
    if (to.owner) {
      xhr.setRequestHeader(to.kind === "project" ? "X-Doc-Project"
                                                 : "X-Doc-Contract", to.owner);
    }
    if (to.revision) xhr.setRequestHeader("X-Doc-Revision", to.revision);
    xhr.setRequestHeader("Content-Type", f.type || "application/octet-stream");
    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable) bar.style.width = (e.loaded / e.total * 100) + "%";
    });

    const failed = (msg) => {
      prog.hidden = true;
      bar.style.width = "0";
      err.textContent = msg;
      err.hidden = false;
      $s("#upOk", box).disabled = false;
      $s("#upNo", box).disabled = false;
    };
    xhr.addEventListener("load", async () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        close();
        await loadOne(openId);
        render();
        note("Загружено: " + f.name);
        return;
      }
      // Отказать может не только API: до него стоят два nginx, и их
      // ответ — страница, а не наш json. «Не удалось загрузить» на 413
      // не говорит человеку ничего, а сказать есть что.
      let msg = "";
      try { msg = JSON.parse(xhr.responseText).error || ""; } catch (e) {}
      failed(msg || (xhr.status === 413
        ? "Файл больше, чем принимает сервер"
        : "Не удалось загрузить, ответ сервера " + xhr.status));
    });
    xhr.addEventListener("error", () =>
      failed("Сеть оборвалась, файл не загружен"));
    xhr.addEventListener("loadend", () => FRESH.release());
    xhr.send(f);
  }

  /* Короткое сообщение под таблицей — для загрузки из карточки, где
     полосы с подсказкой нет. */
  function note(text, bad) {
    const box = $s("#sitNote");
    if (!box) return;
    box.textContent = text;
    box.classList.toggle("bad", !!bad);
    box.hidden = false;
  }

  /* Окно загрузки — одно на все места, откуда грузят: карточку проекта,
     карточку договора и общий список. Куда грузим, известно из того,
     откуда нажали, поэтому окно спрашивает вид только там, где владельца
     нет вовсе.

     Файл можно бросить мышью. Проектный том — сорок мегабайт, и тащить
     его в окно естественнее, чем искать в дереве папок. */
  function uploadForm(to, title) {
    let picked = null;
    const box = document.createElement("div");
    box.className = "pf-modal";
    box.innerHTML = `
      <div class="pf-crop cnt-card up-card" role="dialog" aria-label="${esc(title)}">
        <h3>${esc(title)}</h3>
        <label class="up-drop" id="upDrop">
          <input type="file" id="upFile" hidden>
          ${ICO.up}
          <b id="upName">Нажмите или перетащите файл</b>
          <i>PDF, Excel, Word, сканы · до 96 МБ</i>
        </label>
        ${to.kind ? "" : `
          <div class="fld"><label for="upKind">Вид документа</label>
            <select id="upKind">${KINDS.map(([k, t]) => `<option value="${k}"${
              upKind === k ? " selected" : ""}>${t}</option>`).join("")}
            </select></div>`}
        <div class="sit-prog" id="upProg" hidden><i></i></div>
        <div class="pf-note bad" id="upErr" hidden></div>
        <div class="pf-modal-foot">
          <span class="grow"></span>
          <button type="button" class="btn ghost" id="upNo">Отмена</button>
          <button type="button" class="btn" id="upOk" disabled>Загрузить</button>
        </div>
      </div>`;
    document.body.appendChild(box);

    const close = () => { document.removeEventListener("keydown", onKey); box.remove(); };
    const onKey = (e) => { if (e.key === "Escape") close(); };
    document.addEventListener("keydown", onKey);
    box.addEventListener("click", (e) => { if (e.target === box) close(); });
    $s("#upNo", box).addEventListener("click", close);

    const drop = $s("#upDrop", box);
    const file = $s("#upFile", box);
    const show = (f) => {
      picked = f;
      $s("#upName", box).textContent = f ? `${f.name} · ${fmtSize(f.size)}`
                                         : "Нажмите или перетащите файл";
      $s("#upOk", box).disabled = !f;
      drop.classList.toggle("has", !!f);
    };
    file.addEventListener("change", () => show(file.files && file.files[0]));
    ["dragenter", "dragover"].forEach((ev) =>
      drop.addEventListener(ev, (e) => {
        e.preventDefault();
        drop.classList.add("over");
      }));
    ["dragleave", "drop"].forEach((ev) =>
      drop.addEventListener(ev, () => drop.classList.remove("over")));
    drop.addEventListener("drop", (e) => {
      e.preventDefault();
      show(e.dataTransfer.files && e.dataTransfer.files[0]);
    });

    $s("#upOk", box).addEventListener("click", () => {
      if (!picked) return;
      const kindSel = $s("#upKind", box);
      if (kindSel) upKind = kindSel.value;
      const target = { ...to, kind: to.kind || (kindSel ? kindSel.value : "other") };
      $s("#upOk", box).disabled = true;
      $s("#upNo", box).disabled = true;
      send(picked, target, box, close);
    });
  }

  function wireCardUpload(host) {
    host.querySelectorAll("[data-up]").forEach((b) => {
      b.addEventListener("click", (e) => {
        e.stopPropagation();
        const kind = b.dataset.up;
        uploadForm(
          { kind, owner: b.dataset.owner || "", revision: b.dataset.rev || "" },
          kind === "project" ? "Загрузить спецификацию"
                             : "Загрузить калькуляцию");
      });
    });
  }

  /* Разбор книги или проекта. Что именно разбирать, выбирает человек: в
     книге по ЭОМ1 таблица есть и в «ЭОМ1 изм.1», и в «ЭОМ спека», а в
     проекте на два десятка листов спецификация бывает не одна. Взять
     первую попавшуюся значит однажды посчитать не по той. */
  async function parseDoc(docId) {
    const doc = DOCS.find((x) => x.id === docId) || {};
    const pdf = /\.pdf$/i.test(doc.filename || "");
    let sheets;
    try {
      sheets = (await AUTH.api("GET", "/documents/" + docId + "/sheets")).sheets;
    } catch (e) {
      ASK.alert(e.message, { title: "Не разобрать" });
      return;
    }
    // В проекте страница с таблицей, но без единой позиции — легенда на
    // плане или пустой хвост спецификации; выбирать в ней нечего.
    const withTable = sheets.filter((s) => s.table && !(pdf && !s.header_row));
    if (!withTable.length) {
      ASK.alert(pdf
        ? "Разбираются страницы, где есть разлинованная таблица с шапкой"
          + " «Наименование», «Ед.» и «Кол.». Если проект отсканирован, а не"
          + " выпущен из чертёжной программы, читать в нём нечего."
        : "В книге нет строки заголовков с наименованием и количеством.",
      { title: pdf ? "В проекте спецификация не нашлась" : "В книге таблицы не нашлось",
        bad: false });
      return;
    }
    /* Что отмечено сразу. В книге — первый лист с таблицей. В проекте
       спецификация занимает несколько листов подряд с одной и той же
       разметкой — сервер собирает их в группу, и отмечаем её целиком:
       десять галочек по одной — это десять поводов забыть лист. Группу
       берём ту, где позиций больше всего: легенда светильников на плане
       тоже таблица, но не она нужна в расчёте. */
    let checked = (s, i) => i === 0;
    if (pdf && withTable.every((s) => s.group)) {
      const weight = {};
      withTable.forEach((s) => {
        weight[s.group] = (weight[s.group] || 0) + (s.spec ? s.header_row : 0);
      });
      const best = withTable.reduce((a, s) =>
        weight[s.group] > weight[a.group] ? s : a, withTable[0]).group;
      checked = (s) => s.group === best;
    }
    const box = document.createElement("div");
    box.className = "pf-modal";
    box.innerHTML = `
      <div class="pf-crop cnt-card" role="dialog" aria-label="Разбор">
        <h3>${pdf ? "Какие страницы разбираем" : "Какой лист разбираем"}</h3>
        <div class="note" style="margin-bottom:9px">${pdf
          ? "Показаны только страницы с таблицей позиций. Листы одной"
            + " спецификации отмечены вместе — у них общая разметка."
          : "Таблица нашлась не везде — листы без неё не показываем."}</div>
        <div class="cnt-props">${withTable.map((s, i) => `
          <label class="sit-sheet">
            <input type="checkbox" name="sh" value="${esc(s.name)}"${
              checked(s, i) ? " checked" : ""}>
            <b>${esc(s.name)}</b>
            <i class="cnt-note">${pdf ? `позиций: ${s.header_row}${
                s.spec ? "" : " · таблица без марки и кода"}`
              : `шапка в строке ${s.header_row}`}</i></label>`).join("")}
        </div>
        <div class="pf-note bad" id="shErr" hidden></div>
        <div class="pf-modal-foot">
          <span class="grow"></span>
          <button type="button" class="btn ghost" id="shNo">Отмена</button>
          <button type="button" class="btn" id="shOk">Извлечь отмеченные</button>
        </div>
      </div>`;
    document.body.appendChild(box);
    const close = () => box.remove();
    $s("#shNo", box).addEventListener("click", close);
    box.addEventListener("click", (e) => { if (e.target === box) close(); });
    $s("#shOk", box).addEventListener("click", async () => {
      // Страниц может быть несколько: спецификация на восемнадцати
      // листах занимает четыре, и разбирать их по одной, каждый раз
      // затирая прежние позиции, — работа впустую.
      const sel = [...box.querySelectorAll("input[name=sh]:checked")]
        .map((x) => x.value);
      if (!sel.length) {
        $s("#shErr", box).textContent = "Отметьте хотя бы одну страницу";
        $s("#shErr", box).hidden = false;
        return;
      }
      $s("#shOk", box).disabled = true;
      const doc = DOCS.find((d) => d.id === docId);
      const tr = TRACE.start({ kind: "spec", file: doc ? doc.filename : "" });
      try {
        const got = await AUTH.api("POST", "/documents/" + docId + "/parse",
                                   { sheets: sel });
        tr.done(`Извлёк ${got.count} ${plural(got.count, "позицию", "позиции", "позиций")}`);
        close();
        MATCH = null;
        await loadOne(openId);
        render();
      } catch (e) {
        tr.fail("Не получилось: " + e.message);
        $s("#shErr", box).textContent = String(e.message);
        $s("#shErr", box).hidden = false;
        $s("#shOk", box).disabled = false;
      }
    });
  }

  /* Скачивание идёт через fetch с токеном: обычная ссылка ушла бы без
     заголовка, а на файлы объекта права проверяются. */
  async function download(id, btn) {
    const d = DOCS.find((x) => x.id === id);
    try {
      await DL.save("/api/documents/" + encodeURIComponent(id) + "/file",
                    { btn, name: d ? d.filename : "", fallback: "document",
                      error: "Не удалось скачать файл" });
    } catch (e) {
      note("Не скачалось: " + e.message, true);
    }
  }

  /* PDF и картинки браузер показывает сам — открываем в новой вкладке;
     сервер называет безопасными только их (FILE_PREVIEW). Остальное — скачать. */
  const docViewable = (name) => /\.(pdf|png|jpe?g|gif|webp)$/i.test(String(name || ""));

  async function openFile(id, btn) {
    const d = DOCS.find((x) => x.id === id);
    if (!d || !docViewable(d.filename)) return download(id, btn);
    try {
      await DL.open("/api/documents/" + encodeURIComponent(id) + "/file",
                    { btn, error: "Не удалось открыть файл" });
    } catch (e) {
      note("Не открылось: " + e.message, true);
    }
  }

  /* ── формы ─────────────────────────────────────────────── */
  function modal(title, fields, onSave, onDelete) {
    const box = document.createElement("div");
    box.className = "pf-modal";
    box.innerHTML = `
      <div class="pf-crop cnt-card" role="dialog" aria-label="${esc(title)}">
        <h3>${esc(title)}</h3>
        <div class="cnt-grid">
          ${fields.map(([k, label, val, hint]) => `
            <div class="fld${k === "note" || k === "subject"
                || (hint && hint.addr) ? " wide" : ""}">
              <label for="f-${k}">${esc(label)}</label>
              ${fieldHtml(k, val, hint)}</div>`).join("")}
        </div>
        <div class="pf-note bad" id="fErr" hidden></div>
        <div class="pf-modal-foot">
          ${onDelete ? `<button type="button" class="btn ghost"
             id="fDel">Удалить</button>` : ""}
          <span class="grow"></span>
          <button type="button" class="btn ghost" id="fNo">Отмена</button>
          <button type="button" class="btn" id="fOk">Сохранить</button>
        </div>
      </div>`;
    document.body.appendChild(box);
    /* Списки выбора лежат в body, а не в окне, — убираем их вместе
       с окном, иначе они остались бы под ним невидимками. */
    const close = () => {
      document.removeEventListener("keydown", onKey);
      (box._pk || []).forEach((l) => { if (l._off) l._off(); l.remove(); });
      box.remove();
    };
    const onKey = (e) => { if (e.key === "Escape") close(); };
    document.addEventListener("keydown", onKey);
    box.addEventListener("click", (e) => { if (e.target === box) close(); });
    $s("#fNo", box).addEventListener("click", close);
    $s("#f-" + fields[0][0], box).focus();
    box.querySelectorAll(".pk").forEach((pk) => {
      const f = fields.find(([k]) => k === pk.dataset.pk);
      if (f) wirePicker(pk, f[3]);
    });

    $s("#fOk", box).addEventListener("click", async () => {
      const data = {};
      for (const [k, , , hint] of fields) {
        data[k] = $s("#f-" + k, box).value;
        // Выбранное из справочника едет вместе с id; вписанное — без.
        if (hint && hint.pick) data[k + "_id"] = $s("#f-" + k + "_id", box).value;
        if (hint && hint.addr) {
          for (const x of ["address_fias", "address_lat", "address_lon"]) {
            data[x] = $s("#f-" + x, box).value;
          }
        }
      }
      const err = $s("#fErr", box);
      $s("#fOk", box).disabled = true;
      try {
        await onSave(data);
        close();
      } catch (e) {
        err.textContent = String(e.message);
        err.hidden = false;
        $s("#fOk", box).disabled = false;
      }
    });
    if (onDelete) {
      $s("#fDel", box).addEventListener("click", async () => {
        if (!(await ASK.confirm("Удалить запись?"))) return;
        try {
          await onDelete();
          close();
        } catch (e) {
          $s("#fErr", box).textContent = String(e.message);
          $s("#fErr", box).hidden = false;
        }
      });
    }
  }

  /* История редакций. Отдельным окном, а не раскрытием строки: список
     читают целиком — какая когда вышла и что к ней приложено, — и делать
     это внутри таблицы, где строка и так широкая, неудобно. */
  function revList(kind, parentId) {
    const [word, plural] = REV_WORD[kind];
    const owner = (kind === "project" ? PROJECTS : CONTRACTS)
      .find((x) => x.id === parentId) || {};
    const name = kind === "project"
      ? (owner.marks || owner.code || "проект")
      : (owner.number || "договор");

    const box = document.createElement("div");
    box.className = "pf-modal";
    const draw = () => {
      const list = revsOf(kind, parentId);
      box.innerHTML = `
        <div class="pf-crop cnt-card" role="dialog" aria-label="${esc(plural)}">
          <h3>${esc(plural)} · ${esc(name)}</h3>
          <div class="note" style="margin-bottom:9px">
            Действующей считается запись с самой поздней датой выпуска.
            Прежние остаются: по ним уже закупались и закрывались акты.
          </div>
          ${list.length ? `<table class="sit-revs"><tbody>${list.map((r) => `
            <tr data-rev="${esc(r.id)}">
              <td>${r.current
                ? `<span class="sit-cur">действует</span>` : ""}</td>
              <td><b>${esc(revLabel(r))}</b>${r.title
                ? `<i class="cnt-note">${esc(r.title)}</i>` : ""}</td>
              <td class="num">${docsOfRev(r.id).length
                ? docsOfRev(r.id).length + " файл." : "—"}</td>
              <td class="acts">${can()
                ? `<button type="button" class="lnk" data-erev>Править</button>
                   <button type="button" class="lnk" data-drev>Убрать</button>`
                : ""}</td>
            </tr>`).join("")}</tbody></table>`
            : `<div class="pad note">Пока только исходный выпуск.</div>`}
          <div class="pf-modal-foot">
            ${can() ? `<button type="button" class="btn ghost" id="revAdd">
              ＋ ${esc(word)}</button>` : ""}
            <span class="grow"></span>
            <button type="button" class="btn" id="revClose">Закрыть</button>
          </div>
        </div>`;
      $s("#revClose", box).addEventListener("click", close);
      if (can()) {
        $s("#revAdd", box).addEventListener("click", () => revForm(kind, parentId, null, draw));
      }
      box.querySelectorAll("[data-erev]").forEach((b) => {
        b.addEventListener("click", () => {
          const id = b.closest("tr").dataset.rev;
          revForm(kind, parentId, REVS.find((x) => x.id === id), draw);
        });
      });
      box.querySelectorAll("[data-drev]").forEach((b) => {
        b.addEventListener("click", async () => {
          const id = b.closest("tr").dataset.rev;
          if (!(await ASK.confirm("Убрать эту запись?"))) return;
          try {
            await AUTH.api("DELETE", "/revisions/" + id);
            await loadOne(openId);
            draw();
            render();
          } catch (e) {
            ASK.alert(e.message, { title: "Не убралась" });
          }
        });
      });
    };
    const close = () => { document.removeEventListener("keydown", onKey); box.remove(); };
    const onKey = (e) => { if (e.key === "Escape") close(); };
    document.addEventListener("keydown", onKey);
    box.addEventListener("click", (e) => { if (e.target === box) close(); });
    document.body.appendChild(box);
    draw();
  }

  const docsOfRev = (id) => DOCS.filter((d) => d.revision_id === id);

  function revOwnerName(r) {
    const src = r.kind === "project" ? PROJECTS : CONTRACTS;
    const o = src.find((x) => x.id === r.parent_id);
    if (!o) return r.kind === "project" ? "проект" : "договор";
    return r.kind === "project" ? (o.marks || o.code || "проект")
                                : (o.number || "договор");
  }

  function revForm(kind, parentId, row, after) {
    const [word, , sample] = REV_WORD[kind];
    modal(row ? word.charAt(0).toUpperCase() + word.slice(1) : "Новое " + word, [
      ["num", "Номер", row && row.num, "как на штампе: " + sample],
      ["issued_at", "Дата выпуска", row && row.issued_at,
       "ГГГГ-ММ-ДД — по ней считается действующая"],
      ["title", "Что меняет", row && row.title, ""],
      ["note", "Примечание", row && row.note, ""],
    ], async (d) => {
      if (row) await AUTH.api("PATCH", "/revisions/" + row.id, d);
      else await AUTH.api("POST", "/revisions",
        { ...d, kind, parent_id: parentId });
      await loadOne(openId);
      if (after) after();
      render();
    }, null);
  }

  /* Поле формы по описанию. Строка — обычный ввод с подсказкой; массив —
     выбор из готового списка (статус); {orgs} — своя компания; {pick} —
     выбор из справочника с правом вписать словами; {addr} — адрес с
     подсказкой при вводе. */
  function fieldHtml(k, val, hint) {
    if (Array.isArray(hint)) {
      /* Поле с выбором из готового списка. Статус именно такой:
         значений четыре, и вписывать их руками значит заводить пятое
         написание того же самого. */
      return `<select id="f-${k}">${hint.map((o) => `
        <option value="${esc(o.id)}"${
          (val || hint[0].id) === o.id ? " selected" : ""}>${
          esc(o.name)}</option>`).join("")}</select>`;
    }
    if (hint && hint.orgs) {
      return `<select id="f-${k}"><option value="">не указана</option>${
        hint.orgs.map((o) => `<option value="${esc(o.id)}"${
          val === o.id ? " selected" : ""}>${esc(o.name)}</option>`).join("")
        }</select>`;
    }
    if (hint && (hint.pick || hint.addr)) {
      const has = !!(val || hint.id);
      return `<div class="pk" data-pk="${k}">
        <input id="f-${k}" value="${esc(val || "")}" autocomplete="off"
               spellcheck="false" placeholder="${esc(hint.placeholder || "")}">
        <input type="hidden" id="f-${k}_id" value="${esc(hint.id || "")}">${
        hint.addr ? `
        <input type="hidden" id="f-address_fias" value="${esc(hint.fias || "")}">
        <input type="hidden" id="f-address_lat" value="${esc(hint.lat || "")}">
        <input type="hidden" id="f-address_lon" value="${esc(hint.lon || "")}">` : ""}
        <button type="button" class="pk-x" tabindex="-1" title="Очистить"${
          has ? "" : " hidden"}>×</button>
      </div>`;
    }
    return `<input id="f-${k}" value="${esc(val || "")}"
      placeholder="${esc(hint || "")}">`;
  }

  /* ── выбор из справочника ─────────────────────────────────
     Поле, в которое можно и выбрать, и вписать. Выбранное держит id в
     скрытом поле рядом; вписанное руками остаётся словами с пустым id —
     объект без заказчика в контрагентах заводить не запрещаем, а
     помечаем. Для адреса вместо справочника — подсказки сервера
     (DaData, а без ключа — адреса своих объектов). Список лежит в body с
     фиксированным положением, как у dressSelect: внутри окна его
     обрезал бы overflow. */
  function wirePicker(pk, hint) {
    const inp = pk.querySelector("input:not([type=hidden])");
    const idBox = pk.querySelector('input[type=hidden][id$="_id"]');
    const clear = pk.querySelector(".pk-x");
    const isAddr = !!hint.addr;
    const list = document.createElement("div");
    list.className = "pk-list";
    list.hidden = true;
    document.body.appendChild(list);
    const host = pk.closest(".pf-modal");
    if (host) (host._pk = host._pk || []).push(list);

    let all = false;        // сотрудники: все, а не только по должности
    let items = [];
    let cur = -1;
    let timer = null;
    let seq = 0;

    const geo = (s) => {
      if (!isAddr) return;
      for (const [k, v] of [["fias", s && s.fias_id], ["lat", s && s.lat],
                            ["lon", s && s.lon]]) {
        const el = $s("#f-address_" + k, pk);
        if (el) el.value = v || "";
      }
    };

    async function source(q) {
      if (isAddr) {
        const r = await AUTH.api("GET", "/address/suggest?q=" + encodeURIComponent(q));
        return {
          items: (r.items || []).map((s) => ({
            value: s.value, geo: s,
            sub: s.full && s.full !== s.value ? s.full : "" })),
          foot: r.warning ? r.warning
            : r.source === "dadata" ? "подсказки DaData"
            : "из адресов своих объектов — подсказки DaData не подключены",
          bad: !!r.warning,
        };
      }
      const pool = hint.pick === "cnt" ? DIR.customers : DIR.staff;
      const key = q.trim().toLowerCase();
      let rows = pool, more = false;
      /* Начальников участка и мастеров ищем среди своих должностей, но
         должности в кадровой книге пишутся по-разному — оставляем
         выход на весь штат. */
      if (hint.post && !all) {
        const by = pool.filter((p) => hint.post.test(p.post || ""));
        if (by.length) { rows = by; more = by.length < pool.length; }
        else all = true;
      }
      if (key) {
        rows = rows.filter((p) => [p.name, p.inn, p.post, p.dept]
          .join(" ").toLowerCase().includes(key));
      }
      return {
        items: rows.slice(0, 8).map((p) => ({
          id: p.id, value: p.name,
          sub: hint.pick === "cnt" ? (p.inn ? "ИНН " + p.inn : "")
            : [p.post, p.dept].filter(Boolean).join(" · ") })),
        more,
        canNew: !!(hint.allowNew && key && can()
          && !pool.some((p) => p.name.trim().toLowerCase() === key)),
      };
    }

    function place() {
      const r = inp.getBoundingClientRect();
      list.style.minWidth = Math.round(r.width) + "px";
      list.style.maxWidth = Math.max(Math.round(r.width), 380) + "px";
      list.style.left = Math.round(r.left) + "px";
      const h = list.offsetHeight;
      list.style.top = (innerHeight - r.bottom < h + 10 && r.top > h + 10)
        ? Math.round(r.top - h - 6) + "px"
        : Math.round(r.bottom + 6) + "px";
    }
    const show = () => { list.hidden = false; place(); };
    const close = () => { list.hidden = true; cur = -1; };

    function paint(res, q) {
      items = res.items || [];
      cur = items.length ? 0 : -1;
      const rows = items.map((it, i) => `<button type="button"
        class="pk-opt${i === cur ? " on" : ""}" data-i="${i}"><b>${esc(it.value)}</b>${
        it.sub ? `<i>${esc(it.sub)}</i>` : ""}</button>`).join("");
      const extra = (res.more ? `<button type="button" class="pk-opt act"
          data-all>Показать всех сотрудников</button>` : "")
        + (res.canNew ? `<button type="button" class="pk-opt act" data-new>＋ Завести
          «${esc(q.trim())}» как заказчика</button>` : "");
      const foot = res.foot
        ? `<div class="pk-foot${res.bad ? " bad" : ""}">${esc(res.foot)}</div>` : "";
      if (!rows && !extra) {
        if (isAddr) {
          list.innerHTML = `<div class="pk-foot">Ничего не нашлось</div>` + foot;
          show();
        } else {
          close();
        }
        return;
      }
      list.innerHTML = rows + extra + foot;
      show();
    }

    function search() {
      const q = inp.value;
      if (isAddr && q.trim().length < 3) { close(); return; }
      const my = ++seq;
      Promise.resolve().then(() => source(q)).then((res) => {
        if (my === seq && document.activeElement === inp) paint(res, q);
      }).catch((e) => {
        if (my !== seq) return;
        list.innerHTML = `<div class="pk-foot bad">${esc(e.message)}</div>`;
        show();
      });
    }
    // Адрес спрашиваем у сервера — не на каждую букву, а когда перестали
    // печатать; свои списки лежат в памяти, там ждать нечего.
    const schedule = () => {
      clearTimeout(timer);
      timer = setTimeout(search, isAddr ? 300 : 40);
    };

    function choose(it) {
      inp.value = it.value;
      if (idBox) idBox.value = it.id || "";
      geo(it.geo || null);
      clear.hidden = false;
      close();
    }

    /* Заказчика, которого нет в контрагентах, заводим отсюда же, одним
       названием: реквизиты допишут в справочнике, а объект ждать не
       должен. */
    async function createCnt(name) {
      try {
        const made = await AUTH.api("POST", "/counterparties",
                                    { name, kind: "customer" });
        const row = { id: made.id, name: made.name, inn: made.inn || "",
                      kind: made.kind };
        DIR.customers.push(row);
        DIR.customers.sort((a, b) => a.name.localeCompare(b.name, "ru"));
        choose({ id: row.id, value: row.name });
        note(`Контрагент «${row.name}» заведён — реквизиты допишите в Справочниках`);
      } catch (e) {
        list.innerHTML = `<div class="pk-foot bad">${esc(e.message)}</div>`;
        show();
      }
    }

    inp.addEventListener("input", () => {
      if (idBox) idBox.value = "";
      geo(null);
      clear.hidden = !inp.value;
      schedule();
    });
    inp.addEventListener("focus", () => { if (!isAddr) schedule(); });
    inp.addEventListener("keydown", (e) => {
      if (list.hidden) {
        if (e.key === "ArrowDown") { e.preventDefault(); search(); }
        return;
      }
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        if (!items.length) return;
        cur = (cur + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length;
        list.querySelectorAll(".pk-opt[data-i]").forEach((b) =>
          b.classList.toggle("on", +b.dataset.i === cur));
      } else if (e.key === "Enter") {
        if (cur >= 0 && items[cur]) { e.preventDefault(); choose(items[cur]); }
      } else if (e.key === "Escape") {
        // Esc с открытым списком закрывает список, а не всё окно.
        e.preventDefault(); e.stopPropagation(); close();
      }
    });
    inp.addEventListener("blur", () => setTimeout(close, 150));
    // Нажатие в списке не должно уводить фокус из поля: иначе список
    // закрылся бы по blur раньше, чем сработал щелчок.
    list.addEventListener("mousedown", (e) => e.preventDefault());
    list.addEventListener("click", (e) => {
      const b = e.target.closest("button");
      if (!b) return;
      if (b.dataset.i !== undefined) choose(items[+b.dataset.i]);
      else if (b.hasAttribute("data-all")) { all = true; search(); }
      else if (b.hasAttribute("data-new")) createCnt(inp.value.trim());
    });
    clear.addEventListener("click", () => {
      inp.value = "";
      if (idBox) idBox.value = "";
      geo(null);
      clear.hidden = true;
      inp.focus();
    });
    const onScroll = (e) => { if (!list.hidden && !list.contains(e.target)) close(); };
    window.addEventListener("scroll", onScroll, true);
    list._off = () => window.removeEventListener("scroll", onScroll, true);
  }

  function siteForm(row) {
    const org = (row && row.org_id) || "";
    modal(row ? "Объект" : "Новый объект", [
      ["name", "Название", row && row.name, "как называют в разговоре"],
      // Своя компания — на каком юрлице договор. Из справочника, списком:
      // их две-три, и недействующие в выбор не идут.
      ["org_id", "Наша компания", org,
       { orgs: ORGS.filter((o) => o.active !== 0 || o.id === org) }],
      // Люди и заказчик — из справочников, но с правом вписать словами:
      // объект заводят раньше, чем контрагент попадает в базу.
      ["customer", "Заказчик", row && row.customer,
       { pick: "cnt", id: row && row.customer_id, allowNew: true,
         placeholder: "из контрагентов" }],
      ["tech_customer", "Технический заказчик", row && row.tech_customer,
       { pick: "cnt", id: row && row.tech_customer_id, allowNew: true,
         placeholder: "если есть — третья подпись в ведомости" }],
      ["address", "Адрес", row && row.address,
       { addr: true, fias: row && row.address_fias, lat: row && row.address_lat,
         lon: row && row.address_lon, placeholder: "город, улица, дом" }],
      ["foreman", "Начальник участка", row && row.foreman,
       { pick: "staff", id: row && row.foreman_id,
         post: /начальник\s+участка|нач\.?\s*уч/i, placeholder: "из сотрудников" }],
      ["master", "Мастер", row && row.master,
       { pick: "staff", id: row && row.master_id, post: /мастер/i,
         placeholder: "из сотрудников" }],
      ["estimator", "Считает объект", row && row.estimator,
       { pick: "staff", id: row && row.estimator_id, post: /сметчик|смет|ПТО|инженер/i,
         placeholder: row && row.estimator_auto ? "сейчас: " + row.estimator_auto : "из сотрудников" }],
      // Из этих двух собирается шапка калькуляции. Заводятся один раз на
      // объект: при каждой выгрузке их набирали бы по-разному.
      ["work_kind", "Вид работ", row && row.work_kind,
       "на монтаж наружного электроснабжения 0,4 кВ"],
      ["project_code", "Шифр проекта", row && row.project_code,
       "основание калькуляции"],
      ["note", "Примечание", row && row.note, ""],
    ], async (d) => {
      if (row) await AUTH.api("PATCH", "/sites/" + row.id, d);
      else {
        // Заведённый в «Тендере» — в работе; в «Объектах» — выигранный.
        const made = await AUTH.api("POST", "/sites", MODE === "tnd" ? { ...d, tender: "work" } : d);
        openId = made.id;
        await loadOne(openId);
      }
      await load();
    }, row ? async () => {
      await AUTH.api("DELETE", "/sites/" + row.id);
      openId = null;
      await load();
    } : null);
  }

  function dogForm(row) {
    modal(row ? "Договор" : "Новый договор", [
      ["number", "Номер", row && row.number, ""],
      ["signed_at", "Дата", row && row.signed_at, "ГГГГ-ММ-ДД"],
      ["subject", "Предмет", row && row.subject, "времянка, паркинг, секции"],
      ["amount", "Сумма", row && row.amount, ""],
      ["note", "Примечание", row && row.note, ""],
    ], async (d) => {
      if (row) await AUTH.api("PATCH", "/contracts/" + row.id, d);
      else await AUTH.api("POST", "/contracts", { ...d, site_id: openId });
      await loadOne(openId);
      render();
    }, row ? async () => {
      await AUTH.api("DELETE", "/contracts/" + row.id);
      await loadOne(openId);
      render();
    } : null);
  }

  function projForm(row) {
    modal(row ? "Проект" : "Новый проект", [
      ["marks", "Марки", row && row.marks, "ЭС, ЭОМ — их бывает несколько"],
      ["code", "Шифр", row && row.code, "как на штампе: SUV01-2023"],
      ["institute", "Институт", row && row.institute, "кто выпустил"],
      ["note", "Примечание", row && row.note, ""],
    ], async (d) => {
      if (row) await AUTH.api("PATCH", "/projects/" + row.id, d);
      else await AUTH.api("POST", "/projects", { ...d, site_id: openId });
      await loadOne(openId);
      render();
    }, row ? async () => {
      await AUTH.api("DELETE", "/projects/" + row.id);
      await loadOne(openId);
      render();
    } : null);
  }

  /* ── раздел «Тендер»: список и карточка (07.10.2026) ───────────
     Объекты, которые считают, со своим статусом: в работе, завершён,
     выигран. В строке — на сколько насчитали (те же числа, что в шапке
     объекта) и сколько позиций уже с ценой и расценкой. «Выигран» —
     объект появляется в «Объектах»: там договор, ПТО, снабжение. */
  const sxSortH = (key, label, dirDefault) => {
    const on = SSORT.key === key;
    return `<button type="button" class="sx-sort${on ? " on" : ""}" data-sort="${key}" data-dir="${dirDefault}"
      title="Упорядочить">${label}<span>${on ? (SSORT.dir > 0 ? "↑" : "↓") : "↕"}</span></button>`;
  };

  function tndListHtml() {
    const rows = visibleSites();
    const всего = SITES_ROWS.length;
    if (SIT_NARROW.matches) return listPhoneHtml(rows, rows.length, всего);
    const orgs = ORGS.filter((o) => o.active !== 0 || o.id === FILTER.org
      || SITES_ROWS.some((s) => s.org_id === o.id));
    const attn = sxAttnHtml();
    return `
      <div class="pg sx tnd-list">
        <div class="pg-head sx-head">
          <label class="pg-find sx-q">${ICO.find}<input id="sxQ" type="search"
            placeholder="Объект, заказчик, адрес" value="${esc(SQ)}" autocomplete="off"></label>
          <span class="grow"></span>
          <div class="seg sx-seg" id="sxSeg" role="group" aria-label="Статус тендера">${sxSegHtml()}</div>
          ${tip("Статус тендера. «Выигран» — объект появляется в разделе «Объекты» со всеми проектами и "
            + "расчётом: там договор, ПТО и снабжение. Статус меняют в карточке объекта.")}
          ${can() ? `<button type="button" class="btn-brand" id="sitNew">${ICO.plus}Завести объект</button>` : ""}
        </div>
        <div class="sx-fbar">
          ${orgs.length ? `<div class="sx-orgs" role="group" aria-label="Компания">${orgs.map((o) =>
            `<button type="button" class="sx-orgb${FILTER.org === o.id ? " on" : ""}" data-org="${esc(o.id)}"
              style="--org:${esc(o.color || "#64748B")}" title="${esc(o.name)}"><i></i>${esc(o.short_name || o.name)}</button>`).join("")}</div>` : ""}
          <div class="sx-sels">${sxPick("customer", "Заказчик", PICKS.customer)}</div>
          <button type="button" class="lnk sx-reset" id="sxReset"${sxAnyFilter() ? "" : " hidden"}>Сбросить всё</button>
          <span class="grow"></span>
          <div class="sx-attns" id="sxAttn"${attn ? "" : " hidden"}><span class="sx-fl">${ICO.alert}Требуют внимания</span>${attn}</div>
        </div>
        <div class="pg-body" id="sxBody">${tndTableHtml(rows, всего)}</div>
      </div>`;
  }

  // «мат. 85 % · раб. 40 %» — сколько позиций расчёта уже с ценой и расценкой.
  function tndPrices(c) {
    const pct = (a) => Math.round((a * 100) / c.count);
    return `<span class="tnd-pr" title="${esc(`С ценой материала — ${c.priced} из ${c.count}, с расценкой работ — ${
      c.worked} из ${c.count}`)}">мат. <b>${pct(c.priced)}%</b> · раб. <b>${pct(c.worked)}%</b></span>`;
  }

  function tndTableHtml(rows, всего) {
    if (!rows.length) {
      return `<div class="pg-empty"><b>${всего ? "Под отбор ничего не подошло" : "Объектов в тендере пока нет"}</b>${всего
        ? "Снимите фильтр, выберите другой статус или очистите поиск."
        : `Заведите объект, который считаете: загрузите проекты, извлеките спецификации — получится
           калькуляция. Выиграли — отметьте «Выигран», и объект появится в «Объектах».`}</div>`;
    }
    const sortH = sxSortH;
    return `
      <table class="tbl sx-tbl tnd-tbl" style="--tbl-min:860px">
        <colgroup><col class="c-obj"><col class="c-cust"><col class="c-tst"><col class="c-sum">
          <col class="c-pr"><col class="c-last"><col class="c-go"></colgroup>
        <thead><tr>
          <th>${sortH("name", "Объект", 1)}</th>
          <th>Заказчик</th>
          <th>Статус</th>
          <th class="num">${sortH("sum", "Расчёт с НДС", -1)}</th>
          <th>Цены${tip("Сколько позиций расчёта уже с ценой материала и с расценкой работ.")}</th>
          <th class="c-last">${sortH("last", "Движение", -1)}</th>
          <th></th>
        </tr></thead>
        <tbody>${rows.map((s) => {
          const o = orgOf(s);
          const c = s.calc || {};
          const d = s.docs || {};
          const what = c.from === "contract" ? "по договору"
            : `${c.docs} ${plural(c.docs, "спецификация", "спецификации", "спецификаций")}`;
          return `
          <tr class="go${o ? " has-org" : ""}" data-id="${esc(s.id)}"${orgStyle(s)}>
            <td><span class="t-name">${esc(s.name)}</span>${o || s.note ? `<i class="t-sub">${o
              ? `<span class="sx-org" style="--org:${esc(o.color || "#64748B")}">${esc(o.short_name || o.name)}</span>` : ""}${
              s.note ? `<span class="sx-note">${esc(s.note)}</span>` : ""}</i>` : ""}</td>
            <td>${s.customer ? `<span class="sx-cust">${esc(s.customer)}</span>` : `<span class="sx-none">—</span>`}</td>
            <td>${tndChip(s)}${estWho(s) ? `<i class="t-sub tnd-est" title="${esc(estLabel(s))}: ${
              esc(estWho(s))}">${esc(estLabel(s).toLowerCase())}: ${esc(sxShort(estWho(s)))}</i>` : ""}</td>
            <td class="num">${c.sum_with_vat ? `<b class="tnd-sum">${money(c.sum_with_vat)}</b><i class="t-sub tnd-what">${
              esc(what)}</i>` : `<span class="sx-none">${c.count ? "без цен" : d.project ? "спецификация не извлечена"
              : "нет проекта"}</span>`}</td>
            <td>${c.count ? tndPrices(c) : `<span class="sx-none">—</span>`}</td>
            <td class="c-last"><span class="sx-last" title="${esc(s.last ? "Последнее движение: " + s.last.slice(0, 10) : "")}">${
              esc(sxAgo(s.last)) || "—"}</span></td>
            <td class="go-c">${can() ? `<button type="button" class="t-ed"
                data-ed title="Править объект">${ICO.edit}</button><button type="button" class="t-ed warn" data-del
                title="Убрать объект">${ICO.trash}</button>` : ""}<button type="button" class="t-go"
                data-open title="Открыть объект">${ICO.go}</button></td>
          </tr>`;
        }).join("")}</tbody>
      </table>`;
  }

  /* Карточка тендера: шапка объекта со статусом тендера — тремя кнопками,
     под ней показатели и то, что раньше было вкладкой «Тендер» у объекта:
     спецификации, расчёт, версии, сводная калькуляция, цены объекта. */
  function tndSeg(s) {
    if (!can()) return tndChip(s);
    return `<span class="seg tnd-seg" role="group" aria-label="Статус тендера">${STAGES.map((x) =>
      `<button type="button" class="seg-b st-${esc(x.id)}${s.tender === x.id ? " on" : ""}" data-tnd="${esc(x.id)}"
        >${esc(x.name)}</button>`).join("")}</span>`;
  }

  function tndCardHtml() {
    const s = SITES_ROWS.find((x) => x.id === openId) || {};
    return `
      <div class="pg">
        <div class="pg-head strip card-head">
          <button type="button" class="pg-back" id="sitBack"
                  title="Все объекты тендера" aria-label="Все объекты тендера">${ICO.back}</button>
          <div class="pg-h1">
            <h2>${esc(s.name)}</h2>
            ${orgOf(s) ? orgChip(s) : ""}
          </div>
          <dl class="pg-facts">
            <div class="fact-st"><dt>Статус тендера</dt><dd>${tndSeg(s)}</dd></div>
            ${cusFact(s)}
            ${estFact(s)}
            ${fact("Примечание", s.note)}
          </dl>
          ${s.tender === "won" && allow("obj") ? `<button type="button" class="btn-ghost sm pg-act" id="tndToObj"
            title="Договор, ПТО, снабжение — в разделе «Объекты»">${ICO.go}В «Объектах»</button>` : ""}
          ${can() ? `<button type="button" class="btn-ghost sm pg-act"
            id="sitEdit">${ICO.edit}Редактировать</button>` : ""}
        </div>
        ${kpiHtml()}
        <div class="pg-tabs">
          ${[["calc", "Проекты и расчёт"], ["check", "Чек-лист"]].map(([k, t]) => `
            <button type="button" class="pg-tab${tndTab === k ? " on" : ""}" data-ttab="${k}">${t}</button>`).join("")}
        </div>
        <div class="pg-body">${tndTab === "check" ? '<div class="pto-host" id="tndPto"></div>' : tenderHtml()}</div>
        <div class="pg-note" id="sitNote" hidden></div>
      </div>`;
  }

  /* Статус тендера. «Выигран» — объект встаёт в «Объекты»; снять отметку —
     уйдёт оттуда, поэтому спрашиваем. Бумаги, ПТО и письма остаются при
     объекте в любом статусе. */
  async function setTender(id, to) {
    const s = SITES_ROWS.find((x) => x.id === id);
    if (!s || s.tender === to) return;
    if (s.tender === "won" && !(await ASK.confirm(`Снять с «${s.name}» отметку «Выигран»?\n`
      + "Объект уйдёт из раздела «Объекты»; договоры, ПТО и письма останутся при нём."))) return;
    try {
      const upd = await AUTH.api("PATCH", "/sites/" + encodeURIComponent(id), { tender: to });
      s.tender = upd.tender;
      render();
      note(to === "won" ? `«${s.name}» выигран — теперь он и в «Объектах»: договор, ПТО, снабжение.`
        : `Статус тендера — «${stageName(to)}».`);
    } catch (e) {
      note("Не вышло: " + e.message, true);
    }
  }

  /* Открытый объект — для кнопки «Сообщить об ошибке» (21.10.2026): к
     правке прикладывается, где человек был. */
  function current() {
    if (!openId) return null;
    const s = SITES_ROWS.find((x) => x.id === openId);
    return { id: openId, name: s ? s.name : "", mode: MODE, tab: MODE === "tnd" ? tndTab : tab };
  }

  return { load: (m) => load(m || "obj"), openTender: goTender, current };
})();
