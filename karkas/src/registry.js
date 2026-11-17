/* Реестр корреспонденции — журналы входящих, исходящих и приказов.

   Заказчик, 06.10.2026: в «Письмах» — кнопка для тех, кому выдано право
   «Реестр корреспонденции» (секретари, начальники ПТО и сметного).
   Журналы те же, что вели в Excel, — у каждой компании свои, номера с
   начала года. Запись привязывают к объектам: письмо встаёт карточкой в
   «Письма» объекта, приказ — на страницу объекта. Ошибся с объектом —
   перепривязывают здесь же, карточка письма переезжает вместе с журналом.

   Экран — журнал во всю ширину, как таблица в Excel: вкладки видов, отбор
   по компании, году и объекту, поиск. Окно записи — поля слева, справа
   объекты, сканы, где письмо в «Письмах» и история записи.

   12.10.2026 (заказчик): журнал «Прочее» — что не письмо и не приказ; у
   каждого документа тема (производство, финансы, сметный — она решает, кому
   он виден в «Письмах») и способ получения или передачи с адресом почты,
   накладной или трек-номером: «критично важно в случае судебных
   разбирательств». */
"use strict";

const REG = (() => {
  const $r = (s, r) => (r || document).querySelector(s);
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const svg = (d) => `<svg viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
  const ICO = {
    claim: svg(`<path d="m12 3 10 18H2L12 3zM12 9v5M12 17v.5"/>`),
    back: svg(`<path d="M15 18l-6-6 6-6"/>`),
    plus: svg(`<path d="M12 5v14M5 12h14"/>`),
    find: svg(`<circle cx="11" cy="11" r="6.5"/><path d="M20.5 20.5 16 16"/>`),
    clip: svg(`<path d="M20.5 11.5l-8.2 8.2a5 5 0 0 1-7.1-7.1l8.5-8.5a3.3 3.3 0 0 1 4.7 4.7l-8.5 8.5a1.7 1.7 0 0 1-2.4-2.4l7.8-7.8"/>`),
    file: svg(`<path d="M7 3.5h6.5l4 4V20a.5.5 0 0 1-.5.5H7a.5.5 0 0 1-.5-.5V4a.5.5 0 0 1 .5-.5z"/><path d="M13.5 3.5V7.5h4"/>`),
    trash: svg(`<path d="M4.5 6.5h15M9.5 6.5V4.8a1.3 1.3 0 0 1 1.3-1.3h2.4a1.3 1.3 0 0 1 1.3 1.3v1.7M6.5 6.5l.9 12.2A1.5 1.5 0 0 0 8.9 20h6.2a1.5 1.5 0 0 0 1.5-1.3l.9-12.2"/>`),
    site: svg(`<path d="M4.5 20.5V7l7.5-3.5L19.5 7v13.5"/><path d="M9.5 20.5v-4.5h5v4.5M8.5 9.5h1.5M14 9.5h1.5M8.5 13h1.5M14 13h1.5M3 20.5h18"/>`),
    in: svg(`<path d="M17 7 7 17M15 17H7V9"/>`),
    reply: svg(`<path d="M9.5 7.5 5 12l4.5 4.5"/><path d="M5 12h9.5a4.5 4.5 0 0 1 4.5 4.5V19"/>`),
    out: svg(`<path d="M7 17 17 7M9 7h8v8"/>`),
    order: svg(`<path d="M7 3.5h10a1.5 1.5 0 0 1 1.5 1.5v14.5a1 1 0 0 1-1 1H6.5a1 1 0 0 1-1-1V5A1.5 1.5 0 0 1 7 3.5z"/><path d="M9 8.5h6M9 12h6M9 15.5h3.5"/>`),
    other: svg(`<rect x="3.5" y="4.5" width="17" height="4" rx="1"/><path d="M5 8.5v10A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5v-10M10 12.5h4"/>`),
    up: svg(`<path d="M12 15.5V4.5M7.5 9 12 4.5 16.5 9"/><path d="M4.5 15v3.5a1.5 1.5 0 0 0 1.5 1.5h12a1.5 1.5 0 0 0 1.5-1.5V15"/>`),
    mail: svg(`<rect x="3.5" y="5.5" width="17" height="13" rx="2"/><path d="M4 7l8 6 8-6"/>`),
    book: svg(`<path d="M5.5 4.5A1.5 1.5 0 0 1 7 3h11.5v15H7a1.5 1.5 0 0 0-1.5 1.5z"/><path d="M5.5 19.5A1.5 1.5 0 0 0 7 21h11.5v-3M9 7.5h6M9 11h4"/>`),
    next: svg(`<path d="M9 18l6-6-6-6"/>`),
  };

  /* ── справочное ────────────────────────────────────────────── */
  const KINDS = [["in", "Входящие"], ["out", "Исходящие"], ["order", "Приказы"], ["other", "Прочее"], ["claim", "Претензии"]];
  const ONE = { in: "Входящее", out: "Исходящее", order: "Приказ", other: "Прочее", claim: "Претензия" };
  const NO = { in: "Вх. №", out: "Исх. №", order: "№ приказа", other: "№", claim: "№ претензии" };
  const DATE_L = { in: "Дата поступления", out: "Дата", order: "Дата", other: "Дата", claim: "Дата поступления" };
  const PARTY_L = { in: "Отправитель", out: "Адресат", other: "От кого / кому", claim: "Отправитель" };
  const AUTHOR_L = { out: "Автор", order: "Инициатор", other: "Автор" };
  const REG_L = { in: "Зарегистрировал", out: "Регистрировал", order: "Зарегистрировал", other: "Зарегистрировал", claim: "Зарегистрировал" };
  const CHANNELS = [["secretary", "Секретарь"], ["pto", "ПТО"]];
  // Карточку в «Письмах» заводят входящее и исходящее; приказ и прочее
  // видны на странице объекта.
  const CARDS = (k) => k === "in" || k === "out" || k === "claim";
  const RECEIVED = (k) => k === "in" || k === "claim";
  /* Тема решает, кому документ виден в «Письмах»: производство — всем с
     «Письмами», и мастерам; финансы и сметный — по галочкам в «Доступе». */
  const TOPICS = [["prod", "Производство", "Произв."], ["fin", "Финансы", "Финансы"], ["est", "Сметный", "Сметный"]];
  const topicShort = (k) => (TOPICS.find((t) => t[0] === k) || [])[2] || "";
  const topicsOf = (d) => d.topics || String(d.topic || "").split(",").filter(Boolean);
  const topicChips = (d) => topicsOf(d).map((t) => `<span class="rg-tp ${esc(t)}" title="${esc(d.topic_name || "")}">${esc(topicShort(t))}</span>`).join(" ");
  /* Способ получения или передачи. Приказу его нет — он внутренний. */
  const VIAS = [["edo", "ЭДО"], ["cdek", "СДЭК"], ["post", "Почта России"], ["email", "Эл. почта"], ["hand", "Лично"]];
  const VIA_SHORT = { edo: "ЭДО", cdek: "СДЭК", post: "Почта РФ", email: "E-mail", hand: "Лично" };
  const VIA_L = { in: "Как получено", out: "Как отправлено", other: "Как получено или передано", claim: "Как получено" };
  const EDO_OPS = ["Диадок", "СБИС", "1С-ЭДО", "Такском", "Калуга Астрал"];
  const MAIL_RE = /[\p{L}\p{N}_.+-]+@[\p{L}\p{N}_-]+(\.[\p{L}\p{N}_-]+)+/u;
  /* Подпись, подсказка и список для отметки способа: адрес почты,
     накладная, трек-номер, кто принёс. */
  function viaNote(via, kind) {
    if (via === "email") {
      return [RECEIVED(kind) ? "На какой адрес пришло" : kind === "out" ? "На какой адрес отправили" : "Адрес почты",
        kind === "out" ? "адрес адресата" : "info@company.ru", "rgMail"];
    }
    if (via === "edo") return ["Оператор ЭДО, № документа", "Диадок, СБИС…", "rgEdo"];
    if (via === "cdek") return ["№ накладной СДЭК", "номер накладной", ""];
    if (via === "post") return ["Трек-номер (ШПИ)", "14 цифр с конверта или квитанции", ""];
    if (via === "hand") {
      return [RECEIVED(kind) ? "Кто принёс" : kind === "out" ? "Кому вручили" : "Кто передал или принял", "ФИО", ""];
    }
    return ["", "", ""];
  }
  // Колонки — как в журналах заказчика, плюс тема, способ, объект и сканы.
  // Ширина содержания не задана: ему достаётся всё, что осталось.
  const TOPIC_COL = ["topic", "Тема", "84px"], VIA_COL = ["via", "Способ", "82px"];
  const COLS = {
    in: [["number", "Вх. №", "92px"], ["reg_date", "Поступило", "104px"], ["party", "Отправитель", "13%"],
      ["subject", "Содержание", ""], TOPIC_COL, VIA_COL, ["sites", "Объект", "12%"], ["reg_by", "Зарегистрировал", "11%"],
      ["handed_to", "Кому передал", "11%"], ["files", "", "48px"]],
    out: [["number", "№", "92px"], ["reg_date", "Дата", "104px"], ["party", "Адресат", "14%"],
      ["subject", "Содержание", ""], TOPIC_COL, VIA_COL, ["sites", "Объект", "12%"], ["author_name", "Автор", "10%"],
      ["reg_by", "Регистрировал", "11%"], ["files", "", "48px"]],
    order: [["number", "№", "92px"], ["reg_date", "Дата", "104px"], ["subject", "Содержание", ""], TOPIC_COL,
      ["sites", "Объект", "15%"], ["author_name", "Инициатор", "13%"], ["reg_by", "Зарегистрировал", "12%"],
      ["files", "", "48px"]],
    other: [["number", "№", "92px"], ["reg_date", "Дата", "104px"], ["party", "От кого / кому", "14%"],
      ["subject", "Содержание", ""], TOPIC_COL, VIA_COL, ["sites", "Объект", "12%"], ["author_name", "Автор", "10%"],
      ["reg_by", "Зарегистрировал", "11%"], ["files", "", "48px"]],
  };
  const ORG_COL = ["org_name", "Компания", "118px"];
  COLS.claim = COLS.in.map((c) => c.slice());
  COLS.claim[0][1] = "№ претензии";
  Object.values(COLS).forEach((cols) => cols.splice(cols.length - 1, 0, ["reg_channel", "Направление", "100px"]));
  const FILTER_LABELS = Object.fromEntries(Object.values(COLS).flat().concat([ORG_COL]).filter((c) => c[0] !== "files").map((c) => [c[0], c[1]]));
  Object.assign(FILTER_LABELS, { number: "Номер", reg_date: "Дата", author_name: "Автор / инициатор", party: "От кого / кому" });

  // ORG: id компании, «all» — обе вперемешку, "" — ещё не выбрана (сервер
  // откроет журнал первой: у компаний журналы раздельные). TOPIC — отбор
  // по теме, «none» — записи без темы.
  let KIND = "in", ORG = "", YEAR = "", SITE = "", Q = "", TOPIC = "";
  let FILTERS = {};
  // Порядок номеров — по возрастанию, как в бумажном журнале: №1 сверху
  // (пользователь, 06.10.2026). Щелчок по «№» — свежие сверху. Запоминаем
  // под ключом order: прежний asc=false писался всем по умолчанию.
  let ASC = true;
  let DATA = null, HOST = null, OPTS = {}, seq = 0, qT = 0;
  try {
    const p = JSON.parse(localStorage.getItem("rg-pref") || "{}");
    if (COLS[p.kind]) KIND = p.kind;
    ORG = typeof p.org === "string" ? p.org : "";
    ASC = p.order !== "desc";
  } catch (e) { /* без памяти */ }
  const remember = () => {
    try { localStorage.setItem("rg-pref", JSON.stringify({ kind: KIND, org: ORG, order: ASC ? "asc" : "desc" })); } catch (e) { /* нет */ }
  };

  const pad = (n) => String(n).padStart(2, "0");
  function day(s) {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s || "");
    return m ? `${m[3]}.${m[2]}.${m[1]}` : "";
  }
  function today() {
    const d = new Date();
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }
  function stamp(iso) {
    const d = new Date(iso);
    if (!iso || isNaN(d)) return "";
    return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
  function size(n) {
    n = Number(n) || 0;
    const u = ["Б", "КБ", "МБ", "ГБ"];
    let i = 0;
    while (n >= 1024 && i < u.length - 1) { n /= 1024; i++; }
    return (i ? n.toLocaleString("ru-RU", { maximumFractionDigits: n < 10 ? 1 : 0 }) : String(n)) + " " + u[i];
  }
  const plural = (n, one, few, many) => {
    const a = Math.abs(n) % 100, b = a % 10;
    if (a > 10 && a < 20) return many;
    if (b > 1 && b < 5) return few;
    return b === 1 ? one : many;
  };
  const records = (n) => `${n} ${plural(n, "запись", "записи", "записей")}`;
  const NARROW = matchMedia("(max-width: 760px)");
  const FINE = matchMedia("(pointer: fine)");

  /* ── данные ────────────────────────────────────────────────── */
  const params = () => {
    const p = { kind: KIND };
    if (ORG) p.org = ORG;
    if (YEAR) p.year = YEAR;
    if (SITE) p.site = SITE;
    if (TOPIC) p.topic = TOPIC;
    if (Q.trim()) p.q = Q.trim();
    if (Object.keys(FILTERS).length) p.filters = JSON.stringify(FILTERS);
    return new URLSearchParams(p);
  };

  async function load() {
    const my = ++seq;
    let d;
    try { d = await AUTH.api("GET", "/corr?" + params()); } catch (e) { d = { error: e.message }; }
    if (my !== seq) return DATA;
    DATA = d;
    if (!d.error) {
      YEAR = d.year;
      ORG = d.org || "";
    }
    paint();
    return DATA;
  }

  /* Справочное для окна записи — даже когда экран реестра не открыт
     (регистрация прямо из карточки письма). */
  async function ensure() {
    if (DATA && !DATA.error) return DATA;
    const d = await AUTH.api("GET", "/corr?" + params());
    DATA = d;
    return d;
  }

  /* ── экран ─────────────────────────────────────────────────── */
  const orgName = (id) => ((DATA && DATA.orgs) || []).find((o) => o.id === id)?.name || "";
  /* «ООО "КАРКАС-ЭЛЕКТРО"» → «КАРКАС-ЭЛЕКТРО» — для кнопок. */
  const orgLabel = (o) => (o.label || String(o.name || "").replace(/["'«»“”„]/g, "")
    .replace(/^\s*(ООО|ОАО|ЗАО|ПАО|АО|ИП)\s+/i, "").trim())
    // «КАРКАС-ЭЛЕКТРО» → «Каркас-Электро», как в «Письмах»: капслок в кнопке кричит.
    .replace(/[A-ZА-ЯЁ]{4,}/g, (w) => w[0] + w.slice(1).toLowerCase());
  const orgSeg = (orgs, cur, attrs) => `<div class="seg rg-orgs" role="tablist" aria-label="Компания">${orgs.map((o) =>
    `<button type="button" role="tab" class="seg-b${o.id === cur ? " on" : ""}" ${attrs}="${esc(o.id)}"
      aria-selected="${o.id === cur}" title="${esc(o.name)}">${esc(orgLabel(o))}</button>`).join("")}</div>`;

  function headHtml() {
    const d = DATA && !DATA.error ? DATA : { orgs: [], years: [] };
    const orgs = d.orgs || [];
    return `
      <div class="pg-head rg-head">
        <button type="button" class="rg-back" id="rgBack" title="К письмам" aria-label="К письмам">${ICO.back}</button>
        <div class="rg-title"><b>Реестр корреспонденции</b><i>${esc(ORG && ORG !== "all" ? orgName(ORG)
          : orgs.length > 1 ? "обе компании" : orgs[0] ? orgs[0].name : "")}${YEAR ? " · " + esc(YEAR) : ""}</i></div>
        ${orgs.length > 1 ? orgSeg(orgs.concat([{ id: "all", name: "Журналы обеих компаний вместе",
          label: orgs.length > 2 ? "Все" : "Обе" }]), ORG, "data-org") : ""}
        <div class="pg-tools">
          <button type="button" class="btn-ghost" id="rgNumbering" title="Переход на общую автоматическую нумерацию">Нумерация</button>
          <button type="button" class="btn-ghost" id="rgExport" title="Выгрузить отфильтрованный журнал для печати">В Excel</button>
          ${(d.years || []).length > 1 ? `<select id="rgYear" aria-label="Год">${d.years.map((y) =>
            `<option value="${esc(y)}"${y === YEAR ? " selected" : ""}>${esc(y)}</option>`).join("")}</select>` : ""}
          <button type="button" class="btn-ghost" id="rgImport" title="Загрузить журнал из книги Excel">${ICO.up}<span>Из Excel</span></button>
          <button type="button" class="btn-brand" id="rgNew">${ICO.plus}<span>Зарегистрировать</span></button>
        </div>
      </div>`;
  }

  function barHtml() {
    const d = DATA && !DATA.error ? DATA : { counts: {}, sites: [] };
    const sites = d.sites || [];
    return `
      <div class="pg-tabs rg-tabs" role="tablist">
        <div class="rg-kinds" role="none">${KINDS.map(([k, t]) => `<button type="button" role="tab"
          class="pg-tab${k === KIND ? " on" : ""}${k === "claim" ? " rg-claims" : ""}" data-kind="${k}" aria-selected="${k === KIND}">${t}<i>${
          (d.counts || {})[k] || 0}</i></button>`).join("")}</div>
        <span class="grow"></span>
        <button type="button" class="btn-ghost rg-filter-tool${Object.keys(FILTERS).length ? " active" : ""}" id="rgFilters">Фильтры${Object.keys(FILTERS).length ? " · " + Object.keys(FILTERS).length : ""}</button>
        ${Object.keys(FILTERS).length || Q || SITE || TOPIC ? `<button type="button" class="lnk" id="rgReset">Сбросить</button>` : ""}
        <label class="pg-find rg-find">${ICO.find}<input id="rgQ" type="search" value="${esc(Q)}" autocomplete="off"
          placeholder="Найти: номер, от кого, о чём"
          title="Номер, дата (12.01.2026), от кого и кому, содержание, люди, объект, файлы, способ, адрес почты, № накладной"></label>
        <select id="rgTopic" aria-label="Тема">
          <option value=""${!TOPIC ? " selected" : ""}>Все темы</option>
          ${TOPICS.map(([k, t]) => `<option value="${k}"${k === TOPIC ? " selected" : ""}>${t}</option>`).join("")}
          <option value="none"${TOPIC === "none" ? " selected" : ""}>Без темы${d.untagged ? " · " + d.untagged : ""}</option>
        </select>
        <select id="rgSite" aria-label="Объект">
          <option value=""${!SITE ? " selected" : ""}>Все объекты</option>
          <option value="-"${SITE === "-" ? " selected" : ""}>Без объекта${d.unlinked ? " · " + d.unlinked : ""}</option>
          ${sites.map((s) => `<option value="${esc(s.id)}"${s.id === SITE ? " selected" : ""}>${esc(s.name)}</option>`).join("")}
        </select>
      </div>`;
  }

  /* Объекты строки: в таблице — первый и «+N», в карточке телефона — все. */
  const siteChips = (d, all) => {
    if (!d.sites.length) return `<span class="rg-nosite">без объекта</span>`;
    const shown = all ? d.sites : d.sites.slice(0, 1);
    const more = d.sites.length - shown.length;
    return shown.map((s) => `<span class="rg-site" title="${esc(d.sites.map((x) => x.name).join("\n"))}">${
      esc(s.name)}</span>`).join("") + (more ? `<span class="rg-more" title="${esc(d.sites.slice(1)
      .map((x) => x.name).join("\n"))}">+${more}</span>` : "");
  };

  function cellHtml(d, k) {
    if (k === "number") return `<td class="rg-no" title="${esc(d.number)}">${esc(d.number)}</td>`;
    if (k === "reg_date") return `<td class="t-id">${esc(day(d.reg_date))}</td>`;
    if (k === "subject") return `<td><span class="t-name" title="${esc(d.subject)}">${esc(d.subject)}</span></td>`;
    if (k === "sites") return `<td class="rg-sites-c">${siteChips(d)}</td>`;
    if (k === "reg_channel") return `<td><span class="rg-cut">${esc(d.reg_channel_name) || "—"}</span></td>`;
    if (k === "topic") {
      return `<td class="rg-topics-cell">${d.topic ? topicChips(d)
        : `<span class="dim" title="Тема не указана — запись видят все, у кого «Письма»">—</span>`}</td>`;
    }
    if (k === "via") {
      return `<td><span class="rg-cut" title="${esc([d.via_name, d.via_note].filter(Boolean).join(": "))}">${
        d.via ? esc(VIA_SHORT[d.via] || d.via_name) : `<span class="dim">—</span>`}</span></td>`;
    }
    if (k === "files") {
      return `<td class="rg-fc">${d.files.length ? `<span title="${esc(d.files.map((f) => f.name).join("\n"))}">${
        ICO.clip}${d.files.length}</span>` : ""}</td>`;
    }
    return `<td><span class="rg-cut" title="${esc(d[k])}">${esc(d[k]) || `<span class="dim">—</span>`}</span></td>`;
  }

  function emptyHtml() {
    const d = DATA;
    const any = Object.values(d.counts || {}).some(Boolean);
    const searching = Q.trim() || SITE || TOPIC || Object.keys(FILTERS).length;
    return `<div class="rg-empty">${ICO.book}
      <b>${searching ? "Ничего не нашлось" : any ? `В журнале «${KINDS.find((x) => x[0] === KIND)[1]}» за ${esc(YEAR)} год пусто`
        : "Журналы пока пусты"}</b>
      <span>${searching ? "Поиск — по номеру, дате, от кого и кому, содержанию, людям, объекту, файлам и способу получения."
        : "Зарегистрируйте письмо, приказ или документ — или загрузите журнал, который вели в Excel."}</span>
      ${searching ? `<button type="button" class="lnk" id="rgClear">Сбросить отбор</button>` : `
      <span class="rg-empty-acts"><button type="button" class="btn-brand" id="rgNew2">${ICO.plus}Зарегистрировать</button>
        <button type="button" class="btn-ghost" id="rgImport2">${ICO.up}Из Excel</button></span>`}
    </div>`;
  }

  function listHtml() {
    if (!DATA) return `<div class="lx-state-msg"><span class="lx-spin"></span></div>`;
    if (DATA.error) return `<div class="lx-state-msg"><b>Не открылось</b>${esc(DATA.error)}</div>`;
    // Сервер отдаёт свежие сверху; по возрастанию — тот же список наоборот.
    const rows = ASC ? (DATA.rows || []).slice().reverse() : DATA.rows || [];
    if (!rows.length && !Object.keys(FILTERS).length) return emptyHtml();
    if (NARROW.matches) {
      if (!rows.length) return emptyHtml();
      return `<div class="rg-cards">${rows.map((d) => `
        <button type="button" class="rg-card" data-id="${esc(d.id)}">
          <span class="rg-card-h"><b>${esc(d.number)}</b><i>${esc(day(d.reg_date))}</i>${topicChips(d)}${d.via
            ? `<i>${esc(VIA_SHORT[d.via] || d.via_name)}</i>` : ""}${d.files.length
            ? `<em>${ICO.clip}${d.files.length}</em>` : ""}</span>
          ${d.party ? `<span class="rg-card-p">${esc(d.party)}</span>` : ""}
          <span class="rg-card-s">${esc(d.subject)}</span>
          <span class="rg-card-o">${siteChips(d, true)}</span>
          <span class="rg-card-p">${esc(d.reg_channel_name || "Направление не указано")} · ${esc(d.reg_by)}</span>
        </button>`).join("")}</div>`;
    }
    // Журналы двух компаний вперемешку — колонка «Компания», чтобы два
    // «вх. № 1» не путались. Строка остаётся в одну линию.
    const cols = COLS[KIND].slice();
    if (ORG === "all") cols.splice(2, 0, ORG_COL);
    /* Номер бывает длинным — «Исх.№178-ПТО» из Excel-журнала: колонка
       подстраивается под самый длинный, но не шире 190 пикселей; что не
       влезло — многоточием, целиком в подсказке. */
    const longest = Math.max(0, ...rows.map((d) => String(d.number || "").length));
    const noW = Math.min(190, Math.max(92, Math.round(longest * 8 + 34)));
    cols[0] = [cols[0][0], cols[0][1], noW + "px"];
    return `
      <table class="tbl rg-tbl" style="--tbl-min: 1250px">
        <colgroup>${cols.map((c) => `<col${c[2] ? ` style="width:${c[2]}"` : ""}>`).join("")}</colgroup>
        <thead><tr>${cols.map((c) => `<th${c[0] === "files" ? ` class="rg-fc" title="Сканы и файлы"` : ""}>${
          c[0] === "files" ? ICO.clip : c[0] === "number" ? `<button type="button" class="sx-sort on" id="rgSort"
            title="${ASC ? "Сейчас — по возрастанию, как в бумажном журнале. Свежие сверху — щёлкните"
              : "Сейчас — свежие сверху. По возрастанию, как в бумажном журнале, — щёлкните"}">${esc(c[1])}<span>${
            ASC ? "↑" : "↓"}</span></button>${filterButton(c[0], "Отбор по номеру", true)}` : filterButton(c[0], c[1])}</th>`).join("")}</tr></thead>
        <tbody>${rows.map((d) => `<tr class="go" data-id="${esc(d.id)}">${cols.map((c) => cellHtml(d, c[0])).join("")}</tr>`).join("")}</tbody>
      </table>
      ${!rows.length ? emptyHtml() : ""}
      ${rows.length > 30 ? `<div class="rg-foot">${records(rows.length)}</div>` : ""}`;
  }

  function paint() {
    if (!HOST || !HOST.isConnected || document.documentElement.dataset.sec !== "let") return;
    const q = $r("#rgQ", HOST);
    const focus = q && document.activeElement === q ? [q.selectionStart, q.selectionEnd] : null;
    const body = $r("#rgBody", HOST);
    const top = body ? body.scrollTop : 0;
    HOST.innerHTML = `<div class="pg rg">${headHtml()}${barHtml()}<div class="pg-body rg-body" id="rgBody">${listHtml()}</div></div>`;
    wire();
    if (NARROW.matches) $r("[data-kind][aria-selected=true]", HOST)?.scrollIntoView({ block: "nearest", inline: "nearest" });
    if (focus) {
      const n = $r("#rgQ", HOST);
      n.focus();
      try { n.setSelectionRange(focus[0], focus[1]); } catch (e) { /* поле поиска */ }
    }
    const nb = $r("#rgBody", HOST);
    if (nb) nb.scrollTop = top;
  }

  function wire() {
    const on = (sel, fn, ev) => { const el = $r(sel, HOST); if (el) el.addEventListener(ev || "click", fn); };
    on("#rgBack", () => { if (OPTS.back) OPTS.back(); });
    on("#rgNew", () => entryDialog(null, {}));
    on("#rgNew2", () => entryDialog(null, {}));
    on("#rgImport", importDialog);
    on("#rgImport2", importDialog);
    const reset = () => { Q = ""; SITE = ""; TOPIC = ""; FILTERS = {}; load(); };
    on("#rgClear", reset);
    on("#rgReset", reset);
    on("#rgFilters", () => filterDialog());
    on("#rgNumbering", numberingDialog);
    on("#rgExport", async (e) => {
      const p = params();
      p.set("order", ASC ? "asc" : "desc");
      try {
        const file = await DL.get("/api/corr/export?" + p, { btn: e.currentTarget });
        if (file) DL.saveBlob(file.blob, file.name || `Реестр-${KIND}-${YEAR}.xlsx`);
      } catch (error) { ASK.alert(error.message, { title: "Выгрузка реестра" }); }
    });
    HOST.querySelectorAll("[data-filter]").forEach((b) => b.addEventListener("click", () => filterDialog(b.dataset.filter, b)));
    on("#rgSort", () => { ASC = !ASC; remember(); paint(); });
    HOST.querySelectorAll("[data-org]").forEach((b) => b.addEventListener("click", () => {
      if (ORG === b.dataset.org) return;
      ORG = b.dataset.org;
      remember();
      load();
    }));
    on("#rgYear", (e) => { YEAR = e.target.value; load(); }, "change");
    on("#rgSite", (e) => { SITE = e.target.value; load(); }, "change");
    on("#rgTopic", (e) => { TOPIC = e.target.value; load(); }, "change");
    on("#rgQ", (e) => {
      Q = e.target.value;
      clearTimeout(qT);
      qT = setTimeout(load, 250);
    }, "input");
    HOST.querySelectorAll("[data-kind]").forEach((b) => b.addEventListener("click", () => {
      if (KIND === b.dataset.kind) return;
      KIND = b.dataset.kind;
      remember();
      load();
    }));
    HOST.querySelectorAll("[data-id]").forEach((r) => r.addEventListener("click", () => openEntry(r.dataset.id)));
  }

  NARROW.addEventListener("change", () => { if (HOST && HOST.isConnected) paint(); });

  /* ── окно ──────────────────────────────────────────────────── */
  function filterButton(key, label, compact = false) {
    return `<button type="button" class="rg-filter${Object.hasOwn(FILTERS, key) ? " active" : ""}" data-filter="${esc(key)}"
      aria-label="Фильтр: ${esc(FILTER_LABELS[key])}" title="${esc(label)}">${compact ? "" : esc(label)}<span aria-hidden="true">▾</span></button>`;
  }

  function filterDialog(column = "reg_channel", anchor = null) {
    if (!DATA || DATA.error) return;
    const draft = JSON.parse(JSON.stringify(FILTERS));
    let key = column;
    const { box, form } = modal(anchor ? "Фильтр: " + FILTER_LABELS[column] : "Фильтры реестра", `<div class="fld"${anchor ? " hidden" : ""}><label for="rgFilterField">Колонка</label>
      <select id="rgFilterField">${Object.entries(FILTER_LABELS).map(([k, label]) => `<option value="${esc(k)}"${k === key ? " selected" : ""}>${esc(label)}</option>`).join("")}</select></div>
      <div data-filter-body></div><p class="fld-hint">Разные колонки работают совместно. Внутри колонки достаточно совпадения одного значения.</p>`,
    "Применить", () => { saveField(); FILTERS = draft; load(); },
    `<button type="button" class="btn ghost" data-reset-field>Сбросить колонку</button>`, "rg-filter-dialog");
    const body = $r("[data-filter-body]", form);
    let selection = null, dirty = false;
    function saveField() {
      if (key === "reg_date") {
        const from = $r("[data-from]", body).value, to = $r("[data-to]", body).value;
        if (from || to) draft[key] = { from, to }; else delete draft[key];
      } else if (key === "subject") {
        const text = $r("[data-text]", body).value.trim();
        if (text) draft[key] = { text }; else delete draft[key];
      } else if (dirty) {
        draft[key] = [...selection];
      }
    }
    function paintField() {
      dirty = false;
      const current = draft[key];
      if (key === "reg_date") {
        body.innerHTML = `<div class="rg-2"><div class="fld"><label>С даты</label><input type="date" data-from value="${esc(current?.from || "")}"></div>
          <div class="fld"><label>По дату включительно</label><input type="date" data-to value="${esc(current?.to || "")}"></div></div>`;
        return;
      }
      if (key === "subject") {
        body.innerHTML = `<div class="fld"><label>Содержание включает</label><input type="search" data-text value="${esc(current?.text || "")}" placeholder="Слово или фраза"></div>`;
        return;
      }
      const options = [...((DATA.filter_options || {})[key] || [])];
      for (const value of current || []) if (!options.some((o) => o.value === value)) options.push({ value, label: value || "(Не указано)" });
      selection = new Set(current || options.map((o) => o.value));
      body.innerHTML = `<div class="fld"><input type="search" data-option-search placeholder="Найти значение" aria-label="Поиск значения"></div>
        <div class="rg-filter-actions"><button type="button" class="lnk" data-select-all>Выбрать найденные</button><button type="button" class="lnk" data-select-none>Снять найденные</button></div>
        <div class="rg-filter-values">${options.map((o, i) => `<label class="rg-check" data-option data-search="${esc(o.label.toLocaleLowerCase())}">
          <input type="checkbox" data-value="${i}"${selection.has(o.value) ? " checked" : ""}><span>${esc(o.label)}</span></label>`).join("") || `<p class="dim">В журнале пока нет значений</p>`}</div>`;
      body.querySelectorAll("[data-value]").forEach((input) => input.addEventListener("change", () => {
        dirty = true;
        const value = options[Number(input.dataset.value)].value;
        if (input.checked) selection.add(value); else selection.delete(value);
      }));
      $r("[data-option-search]", body).addEventListener("input", (e) => {
        const q = e.target.value.toLocaleLowerCase();
        body.querySelectorAll("[data-option]").forEach((o) => { o.hidden = !o.dataset.search.includes(q); });
      });
      function toggle(checked) {
        body.querySelectorAll("[data-option]").forEach((o) => {
          if (o.hidden) return;
          const input = $r("input", o); input.checked = checked; input.dispatchEvent(new Event("change"));
        });
      }
      $r("[data-select-all]", body).addEventListener("click", () => toggle(true));
      $r("[data-select-none]", body).addEventListener("click", () => toggle(false));
    }
    $r("#rgFilterField", form).addEventListener("change", (e) => { saveField(); key = e.target.value; paintField(); });
    $r("[data-reset-field]", form).addEventListener("click", () => { delete draft[key]; paintField(); });
    paintField();
    if (anchor && !NARROW.matches) {
      box.classList.add("rg-filter-popover");
      const rect = anchor.getBoundingClientRect();
      form.style.left = Math.max(8, Math.min(rect.left, innerWidth - 368)) + "px";
      form.style.top = Math.max(8, Math.min(rect.bottom + 10, innerHeight - 420)) + "px";
    }
    const focus = $r("[data-option-search], [data-text], [data-from]", form);
    if (focus) focus.focus();
  }

  async function numberingDialog() {
    let data;
    try { data = await ensure(); } catch (e) { ASK.alert(e.message); return; }
    const org = ORG && ORG !== "all" ? ORG : data.orgs[0]?.id || "";
    let state = null, request = 0;
    const { form, ok, fail } = modal("Нумерация реестра", `<div class="rg-2">
      <div class="fld"><label>Компания</label><select name="org_id">${data.orgs.map((o) => `<option value="${esc(o.id)}"${o.id === org ? " selected" : ""}>${esc(orgLabel(o))}</option>`).join("")}</select></div>
      <div class="fld"><label>Год</label><input name="year" type="number" min="1900" max="9999" value="${esc(YEAR || today().slice(0, 4))}"></div></div>
      <div class="fld"><label>Последовательность</label><select name="kind"><option value="in"${KIND !== "order" ? " selected" : ""}>Входящие, исходящие, прочие, претензии</option><option value="order"${KIND === "order" ? " selected" : ""}>Приказы</option></select></div>
      <label class="rg-check"><input type="checkbox" name="enabled"><span>Автоматически присваивать следующий номер</span></label>
      <div class="fld"><label>Последний использованный номер</label><input name="last_number" type="number" min="0" max="999999999" step="1"><i class="fld-hint" data-next-hint></i></div>
      <p class="fld-hint">Настройка общая для секретаря и ПТО. Включите после согласования перехода и подтвердите последний номер действующего журнала. Старые номера сохранятся. Каждый год — отдельная последовательность.</p>`,
    "Сохранить настройку", async (f) => {
      if (!state) throw new Error("Дождитесь загрузки настройки");
      const last = Number(f.elements.last_number.value);
      if (!f.elements.last_number.value || !Number.isInteger(last) || last < 0) throw new Error("Укажите последний использованный номер целым числом");
      await AUTH.api("PUT", "/corr/numbering", { org_id: val(f, "org_id"), year: val(f, "year"), kind: val(f, "kind"), enabled: f.elements.enabled.checked, last_number: last });
      DATA = null; load();
    }, "", "rg-numbering-dialog");
    const hint = () => { $r("[data-next-hint]", form).textContent = form.elements.enabled.checked
      ? `Следующая регистрация получит №${Number(form.elements.last_number.value) + 1}` : "Ручной режим: номер вводится при регистрации"; };
    async function refresh() {
      const my = ++request; state = null; ok.disabled = true;
      try {
        const p = new URLSearchParams({ kind: val(form, "kind"), org: val(form, "org_id"), date: val(form, "year") + "-01-01" });
        const result = await AUTH.api("GET", "/corr/next?" + p);
        if (my !== request || !form.isConnected) return;
        state = result; form.elements.enabled.checked = state.enabled; form.elements.last_number.value = state.last_number;
        hint(); ok.disabled = false;
      } catch (e) { if (my === request) fail(e.message); }
    }
    ["org_id", "year", "kind"].forEach((key) => form.elements[key].addEventListener("change", refresh));
    ["enabled", "last_number"].forEach((key) => form.elements[key].addEventListener("input", hint));
    refresh();
  }

  /* Окно с полями — как в «Письмах», только шире: две колонки, чтобы
     всё уместилось без прокрутки. onOk возвращает false, если окно
     закрывать рано; ошибку пишет в окно, а не в alert. */
  function modal(title, inner, okLabel, onOk, extra, cls) {
    const box = document.createElement("div");
    box.className = "pf-modal lt-modal rg-modal";
    box.innerHTML = `
      <form class="pf-crop cnt-card lt-form rg-form ${cls || ""}" role="dialog" aria-label="${esc(title)}" novalidate>
        <h3>${esc(title)}</h3>
        ${inner}
        <div class="lt-form-err" hidden></div>
        <div class="pf-modal-foot">
          ${extra || ""}<span class="grow"></span>
          <button type="button" class="btn ghost" data-no>Отмена</button>
          <button type="submit" class="btn" data-ok>${esc(okLabel)}</button>
        </div>
      </form>`;
    document.body.appendChild(box);
    const form = $r("form", box), err = $r(".lt-form-err", box), ok = $r("[data-ok]", box);
    const close = () => { document.removeEventListener("keydown", key); box.remove(); };
    const key = (e) => { if (e.key === "Escape" && !e.defaultPrevented) close(); };
    document.addEventListener("keydown", key);
    box.addEventListener("mousedown", (e) => { if (e.target === box) close(); });
    $r("[data-no]", box).addEventListener("click", close);
    const fail = (msg) => { err.textContent = msg; err.hidden = false; };
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      err.hidden = true;
      ok.disabled = true;
      try {
        if (await onOk(form, close, ok) !== false) close();
      } catch (ex) {
        fail(ex.message);
      } finally {
        ok.disabled = false;
      }
    });
    return { box, form, close, ok, fail };
  }
  const val = (form, name) => (form.elements[name] ? String(form.elements[name].value || "").trim() : "");

  const fileUrl = (id) => "/api/corr-files/" + encodeURIComponent(id) + "/file";
  async function openFile(f, btn) {
    try {
      if (f.preview) await DL.open(fileUrl(f.id), { btn });
      else await DL.save(fileUrl(f.id), { btn, name: f.name });
    } catch (e) { ASK.alert(e.message, { title: "Не открылось" }); }
  }

  function upload(id, file, onProgress) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/api/corr/" + encodeURIComponent(id) + "/files");
      xhr.setRequestHeader("Authorization", "Bearer " + AUTH.token());
      xhr.setRequestHeader("X-File-Name", encodeURIComponent(file.name));
      xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
      xhr.upload.addEventListener("progress", (e) => { if (onProgress && e.total) onProgress(e.loaded / e.total); });
      xhr.addEventListener("load", () => {
        if (xhr.status >= 200 && xhr.status < 300) return resolve();
        let msg = "";
        try { msg = JSON.parse(xhr.responseText).error || ""; } catch (e) { /* не json */ }
        reject(new Error(msg || (xhr.status === 413 ? "файл слишком большой" : "ответ сервера " + xhr.status)));
      });
      xhr.addEventListener("error", () => reject(new Error("связь оборвалась")));
      xhr.send(file);
    });
  }

  async function openEntry(id, opts) {
    let d;
    try {
      await ensure();
      d = await AUTH.api("GET", "/corr/" + encodeURIComponent(id));
    } catch (e) {
      ASK.alert(e.message, { title: "Не открылось" });
      return;
    }
    entryDialog(d, opts || {});
  }

  const kindOf = (form) => ($r("input[name=kind]:checked", form) || {}).value || "in";
  const viaOf = (form) => ($r("input[name=via]:checked", form) || {}).value || "";
  const topicOf = (form) => [...form.querySelectorAll("input[name=topic]:checked")].map((r) => r.value).join(",");

  /* Окно записи. d — запись целиком (правка) или null (регистрация);
     init: { kind, letter — карточка из «Писем», которую регистрируем,
     onDone(запись) }. */
  async function entryDialog(d, init) {
    let data;
    try { data = await ensure(); } catch (e) { ASK.alert(e.message, { title: "Не открылось" }); return; }
    const letter = !d && init.letter ? init.letter : null;
    // На какое письмо это — ответ (заказчик, 09.10.2026: «при регистрации —
    // поле с поиском писем, чтобы сразу связать»). Из «Ответ письмом» оно
    // приходит готовым.
    let reply = !d && init.reply ? init.reply : null;
    let kind = d ? d.kind : letter ? letter.direction : init.kind || KIND;
    if (!d && init.reply && !CARDS(kind)) kind = init.reply.direction === "out" ? "in" : "out";
    // Тема новой записи — от карточки, которую регистрируем, или от письма,
    // на которое это ответ. Способ — только выбором: для суда он должен быть
    // настоящим, а не подставленным. Отметка (адрес, накладная) — своя у
    // каждого способа: переключились туда-обратно — вписанное не потерялось.
    const topic0 = topicsOf(d || letter || reply || {});
    const via0 = d ? d.via || "" : "";
    const notes = {};
    if (via0) notes[via0] = d.via_note || "";
    const orgs = data.orgs || [];
    const org0 = d ? d.org_id : letter && letter.org_id ? letter.org_id
      : (ORG && ORG !== "all" ? ORG : (orgs[0] && orgs[0].id) || "");
    let sites = d ? d.sites.map((s) => s.id) : letter ? [letter.site_id] : init.site ? [init.site] : [];
    const siteName = (id) => ((data.sites || []).find((s) => s.id === id) || {}).name || "объект";
    const files = d ? d.files.slice() : [];
    const people = (data.people || []).map((p) => `<option value="${esc(p)}">`).join("");
    const parties = (data.parties || []).map((p) => `<option value="${esc(p)}">`).join("");
    const v = (k, dflt) => esc(d ? d[k] : dflt || "");
    const title = d ? `${ONE[d.kind]} · ${d.label}` : letter ? "Зарегистрировать письмо" : "Регистрация";
    const { form, close, ok, fail } = modal(title, `
      <div class="rg-top">
        <div class="seg rg-kind" role="radiogroup" aria-label="Что регистрируем">${KINDS.map(([k]) => `
          <label class="seg-b${k === kind ? " on" : ""}${letter && !CARDS(k) ? " off" : ""}"><input type="radio" name="kind"
            value="${k}"${k === kind ? " checked" : ""}${letter && !CARDS(k) ? " disabled" : ""} hidden>${ICO[k]}${ONE[k]}</label>`).join("")}
        </div>
        ${orgs.length > 1 ? `<div class="seg rg-orgs rg-orgpick" role="radiogroup" aria-label="Чей журнал">${orgs.map((o) =>
          `<label class="seg-b${o.id === org0 ? " on" : ""}" title="${esc(o.name)}"><input type="radio" name="org_id"
            value="${esc(o.id)}"${o.id === org0 ? " checked" : ""} hidden>${esc(orgLabel(o))}</label>`).join("")}</div>`
          : `<input type="hidden" name="org_id" value="${esc(org0)}">`}
      </div>
      <div class="rg-cols">
        <div class="rg-col">
          <div class="rg-2">
            <div class="fld"><label for="rgFN" data-l="no">${NO[kind]}</label>
              <input id="rgFN" name="number" autocomplete="off" value="${v("number", letter?.number)}" placeholder="Номер действующего журнала">
              <i class="fld-hint" data-numberhint></i></div>
            <div class="fld"><label for="rgFD" data-l="date">${DATE_L[kind]}</label>
              <input id="rgFD" name="reg_date" type="date" value="${v("reg_date", (letter && letter.sent_at) || today())}"></div>
          </div>
          <div class="fld" data-only="in out other claim"><label for="rgFP" data-l="party">${PARTY_L[kind] || "Отправитель"}</label>
            <input id="rgFP" name="party" list="rgParties" autocomplete="off" value="${v("party")}"
              placeholder="ООО «…»"></div>
          <div class="fld rg-via" data-only="in out other claim"><span data-l="via">${VIA_L[kind] || VIA_L.in}</span>
            <div class="seg rg-vseg" role="radiogroup" aria-label="Способ получения или передачи">${VIAS.map(([k, t]) => `
              <label class="seg-b${k === via0 ? " on" : ""}"><input type="radio" name="via" value="${k}"${k === via0
                ? " checked" : ""} hidden>${t}</label>`).join("")}</div>
          </div>
          <div class="fld rg-vnote" data-vianote hidden><label for="rgFV" data-l="vianote"></label>
            <input id="rgFV" name="via_note" autocomplete="off" maxlength="200" value="${esc(d ? d.via_note : "")}"></div>
          <div class="fld"><label for="rgFS">Содержание</label>
            <textarea id="rgFS" name="subject" rows="3" placeholder="О чём письмо, приказ или документ — коротко, как в журнале"
              >${d ? esc(d.subject) : letter ? esc(letter.subject) : ""}</textarea></div>
          <div class="fld rg-topic"><span>Тема</span>
            <div class="seg rg-tseg" role="group" aria-label="Темы документа">${TOPICS.map(([k, t]) => `
              <label class="seg-b ${k}${topic0.includes(k) ? " on" : ""}"><input type="checkbox" name="topic" value="${k}"${topic0.includes(k)
                ? " checked" : ""} hidden>${t}</label>`).join("")}</div>
            <button type="button" class="lnk rg-all-topics" data-all-topics>Выбрать все темы</button>
            <i class="fld-hint" data-topichint></i>
          </div>
          <div class="fld"><span>Направление регистрации</span><div class="seg rg-channel" role="radiogroup" aria-label="Направление регистрации">${CHANNELS.map(([k, label]) => `<label class="seg-b${d?.reg_channel === k ? " on" : ""}"><input type="radio" name="reg_channel" value="${k}"${d?.reg_channel === k ? " checked" : ""} hidden>${label}</label>`).join("")}</div>
            <i class="fld-hint">По какой линии регистрируем документ; сотрудник указан отдельно ниже</i></div>
          <div class="rg-2">
            <div class="fld" data-only="out order other"><label for="rgFA" data-l="author">${AUTHOR_L[kind] || "Автор"}</label>
              <input id="rgFA" name="author_name" list="rgPeople" autocomplete="off" value="${v("author_name")}"></div>
            <div class="fld" data-only="in other claim"><label for="rgFH">Кому передал</label>
              <input id="rgFH" name="handed_to" list="rgPeople" autocomplete="off" value="${v("handed_to")}"></div>
            <div class="fld"><label for="rgFR" data-l="reg">${REG_L[kind]}</label>
              <input id="rgFR" name="reg_by" list="rgPeople" autocomplete="off" value="${v("reg_by", data.me)}"></div>
          </div>
        </div>
        <div class="rg-col rg-side">
          ${d ? "" : `<div class="fld rg-reply" data-only="in out claim"><span>Ответ на письмо</span>
            <div data-reply></div>
            <label class="rg-check" data-replyclose hidden><input type="checkbox" name="reply_close" checked>
              <span data-replyclosetxt></span></label>
          </div>`}
          <div class="fld"><span>Объекты</span>
            <div class="rg-chips" data-sites></div>
            <i class="fld-hint" data-sitehint></i>
          </div>
          <div data-cards></div>
          <label class="rg-check" data-closebox hidden><input type="checkbox" name="close">
            <span>Ответа не ждём — карточку в «Письмах» сразу закрыть</span></label>
          <div class="fld"><span>Скан и файлы</span>
            <div class="rg-files" data-files></div>
            <label class="btn-ghost rg-pick">${ICO.clip}<span>Приложить файл</span>
              <input type="file" name="files" multiple hidden></label>
            <i class="fld-hint" data-picked></i>
          </div>
          ${d && d.log && d.log.length ? `<details class="rg-hist"><summary>История<i>${d.log.length}</i></summary>
            <ol>${d.log.slice().reverse().map((x) => `<li><time>${esc(stamp(x.at))}</time><b>${esc(x.author)}</b><span>${
              esc(x.text)}</span></li>`).join("")}</ol></details>` : ""}
        </div>
      </div>
      <datalist id="rgParties">${parties}</datalist><datalist id="rgPeople">${people}</datalist>
      <datalist id="rgMail"></datalist><datalist id="rgEdo">${EDO_OPS.map((x) => `<option value="${esc(x)}">`).join("")}</datalist>`,
    d ? "Сохранить" : "Зарегистрировать", async (f, close, okBtn) => {
      const k = kindOf(f);
      const via = k === "order" ? "" : viaOf(f);
      const body = { kind: k, org_id: val(f, "org_id"), number: val(f, "number"), reg_date: val(f, "reg_date"),
        party: val(f, "party"), subject: val(f, "subject"), author_name: val(f, "author_name"),
        reg_by: val(f, "reg_by"), handed_to: val(f, "handed_to"), sites,
        topics: topicOf(f).split(",").filter(Boolean), reg_channel: val(f, "reg_channel"), via, via_note: via ? val(f, "via_note") : "" };
      // Как на сервере: у новой записи и у той, что переходит в другой
      // журнал, тема и способ обязательны; у старой их можно не ставить.
      const anew = !d || d.kind !== k;
      if (!body.subject) throw new Error("Напишите краткое содержание");
      if (CARDS(k) && !body.party) throw new Error(RECEIVED(k) ? "Укажите отправителя" : "Укажите адресата");
      if (k !== "order" && !via && (anew || d.via)) {
        throw new Error(`Укажите, ${RECEIVED(k) ? "как письмо получено" : k === "out" ? "как письмо отправлено"
          : "как документ получен или передан"}: ЭДО, СДЭК, Почта России, электронная почта или лично`);
      }
      if (via === "email" && !MAIL_RE.test(body.via_note)) throw new Error(`Электронная почта — укажите адрес: ${
        RECEIVED(k) ? "на какой пришло" : k === "out" ? "на какой отправили" : "откуда пришло или куда отправили"}`);
      if (!body.topics.length && (anew || d.topic)) throw new Error("Выберите хотя бы одну тему: производство, финансы или сметный");
      if (!body.reg_channel && (!d || d.reg_channel)) throw new Error("Выберите направление регистрации: Секретарь или ПТО");
      if (!d) {
        const pick = ($r("input[name=card]:checked", f) || {}).value || "";
        if (letter) body.letter_id = letter.id;
        else if (pick) body.letter_id = pick;
        if (reply && CARDS(k)) {
          body.reply_to = reply.id;
          const rc = $r("[data-replyclose]", f);
          body.reply_close = !!(rc && !rc.hidden && f.elements.reply_close.checked);
        }
      }
      if (f.elements.close && f.elements.close.checked && !$r("[data-closebox]", f).hidden) body.close = true;
      const res = d ? await AUTH.api("PATCH", "/corr/" + d.id, body) : await AUTH.api("POST", "/corr", body);
      const fresh = [...(f.elements.files.files || [])];
      const bad = [];
      for (let i = 0; i < fresh.length; i++) {
        const tag = fresh.length > 1 ? ` ${i + 1} из ${fresh.length}` : "";
        okBtn.textContent = "Загружаю файл" + tag;
        try {
          await upload(res.id, fresh[i], (p) => { okBtn.textContent = `Загружаю файл${tag} · ${Math.round(p * 100)}%`; });
        } catch (e) { bad.push(fresh[i].name + ": " + e.message); }
      }
      DATA = null;
      if (HOST && HOST.isConnected && document.documentElement.dataset.sec === "let" && $r(".rg", HOST)) load();
      if (init.onDone) init.onDone(res);
      if (bad.length) ASK.alert("Запись сохранена, но не все файлы загрузились:\n" + bad.join("\n"), { title: "Файлы" });
    }, d ? `<button type="button" class="btn ghost lt-danger" data-del>${ICO.trash}Удалить</button>` : "", "rg-entry");

    /* Вид записи меняет подписи и набор полей: у входящего — отправитель
       и «кому передал», у исходящего — адресат и автор, у приказа —
       инициатор. Номер, пока его не трогали руками, — следующий по
       журналу. */
    const num = form.elements.number;
    let manualNumber = num.value;
    num.addEventListener("input", () => { if (!num.readOnly) manualNumber = num.value; });
    let nextSeq = 0;
    async function suggest() {
      const my = ++nextSeq;
      ok.disabled = true;
      try {
        const p = new URLSearchParams({ kind: kindOf(form), org: val(form, "org_id"), date: val(form, "reg_date") || today() });
        const r = await AUTH.api("GET", "/corr/next?" + p);
        if (my !== nextSeq || !form.isConnected) return;
        const moved = d && (val(form, "org_id") !== d.org_id || (val(form, "reg_date") || today()).slice(0, 4) !== d.reg_date.slice(0, 4)
          || (kindOf(form) === "order") !== (d.kind === "order"));
        const assign = r.enabled && (!d || moved);
        num.readOnly = r.enabled;
        num.value = assign ? r.number : manualNumber;
        $r("[data-numberhint]", form).textContent = assign
          ? "Автоматически при сохранении; показан предварительный номер"
          : r.enabled ? "Номер существующей записи; общая автонумерация включена"
          : "Ручной режим. Переход — через «Нумерация» в реестре";
        ok.disabled = false;
      } catch (e) { if (my === nextSeq) fail("Не удалось проверить нумерацию: " + e.message); }
    }
    function relabel() {
      kind = kindOf(form);
      form.querySelectorAll(".rg-kind .seg-b").forEach((b) => b.classList.toggle("on", $r("input", b).checked));
      form.querySelectorAll("[data-only]").forEach((el) => { el.hidden = !el.dataset.only.split(" ").includes(kind); });
      const set = (l, t) => { const el = $r(`[data-l=${l}]`, form); if (el) el.textContent = t; };
      set("no", NO[kind]); set("date", DATE_L[kind]); set("reg", REG_L[kind]);
      if (PARTY_L[kind]) set("party", PARTY_L[kind]);
      if (AUTHOR_L[kind]) set("author", AUTHOR_L[kind]);
      if (VIA_L[kind]) set("via", VIA_L[kind]);
      paintVia();
      paintSites();
      paintReplyClose();
    }

    /* Способ: отметка под ним — адрес почты, накладная, трек-номер; у
       почты она обязательна. Входящее по почте — подставляем адрес
       компании (большинство писем приходит на общий ящик), его можно
       сменить на ящик директора или начальника отдела. */
    const noteIn = form.elements.via_note;
    let viaNow = via0, kindNow = kind;
    const orgMail = () => ((orgs.find((o) => o.id === val(form, "org_id")) || {}).email || "").trim();
    function paintVia() {
      const via = kind === "order" ? "" : viaOf(form);
      form.querySelectorAll(".rg-vseg .seg-b").forEach((b) => b.classList.toggle("on", $r("input", b).checked));
      if (via !== viaNow) {
        if (viaNow) notes[viaNow] = noteIn.value;
        noteIn.value = notes[via] ?? (via === "email" && RECEIVED(kind) ? orgMail() : "");
        viaNow = via;
      } else if (via === "email" && kind !== kindNow) {
        // Адрес компании — для входящего; у исходящего здесь адрес адресата.
        const m = orgMail();
        if (RECEIVED(kind) && !noteIn.value.trim()) noteIn.value = m;
        else if (!RECEIVED(kind) && m && noteIn.value.trim() === m) noteIn.value = "";
      }
      kindNow = kind;
      const box = $r("[data-vianote]", form);
      box.hidden = !via;
      if (!via) return;
      const [label, ph, list] = viaNote(via, kind);
      $r("[data-l=vianote]", form).innerHTML = esc(label) + (via === "email" ? ` <b class="rg-req" title="Обязательно">*</b>` : "");
      noteIn.placeholder = ph;
      if (list) noteIn.setAttribute("list", list); else noteIn.removeAttribute("list");
      // Не type=email: браузер переделал бы адрес на .рф в punycode.
      noteIn.inputMode = via === "email" ? "email" : "text";
      noteIn.autocapitalize = via === "email" ? "off" : "sentences";
      if (via === "email") {
        const m = data.mail || {};
        const pool = RECEIVED(kind) ? m.ours || [] : kind === "out" ? m.theirs || [] : (m.ours || []).concat(m.theirs || []);
        $r("#rgMail", form.parentNode).innerHTML = pool.map((x) => `<option value="${esc(x)}">`).join("");
      }
    }
    form.querySelectorAll("input[name=via]").forEach((r) => r.addEventListener("change", () => {
      paintVia();
      if (FINE.matches && !noteIn.value) noteIn.focus();
    }));

    /* Тема: кому документ виден в «Письмах». У старой записи (до тем, из
       Excel) её нет — подсказка просит поставить. */
    function paintTopic() {
      const ts = topicOf(form).split(",").filter(Boolean);
      form.querySelectorAll(".rg-tseg .seg-b").forEach((b) => b.classList.toggle("on", $r("input", b).checked));
      const hint = $r("[data-topichint]", form);
      hint.textContent = ts.length ? ts.includes("prod") ? "Видят все с доступом к «Письмам», включая мастеров на их объектах"
        : "Видят сотрудники с доступом хотя бы к одной выбранной теме" : d && !d.topic && d.kind === kind
        ? "Тема не указана — запись видят все, у кого «Письма». Выберите её"
        : "Решает, кто увидит документ в «Письмах»";
      hint.classList.toggle("warn", !ts.length && !!d && !d.topic);
    }
    form.querySelectorAll("input[name=topic]").forEach((r) => r.addEventListener("change", paintTopic));
    $r("[data-all-topics]", form).addEventListener("click", () => {
      form.querySelectorAll("input[name=topic]").forEach((r) => { r.checked = true; }); paintTopic();
    });
    form.querySelectorAll("input[name=reg_channel]").forEach((r) => r.addEventListener("change", () => {
      form.querySelectorAll(".rg-channel .seg-b").forEach((b) => b.classList.toggle("on", $r("input", b).checked));
    }));

    /* «Ответ на письмо»: поиск по номеру, теме, дате — по всем объектам,
       что человеку видны; пусто — последние письма выбранного объекта.
       Выбрали — объект того письма встаёт в объекты записи, а его
       карточка станет ответом. Закрыть исходное — галочкой, как при
       «Ответ письмом». */
    const replyBox = $r("[data-reply]", form);
    const recent = new Map();
    let rq = "", rseq = 0, rtimer = 0;
    const rlabel = (x) => `${x.number ? "№ " + x.number : "без номера"}${x.sent_at ? " от " + day(x.sent_at) : ""}`;
    async function recentOf(site) {
      if (!recent.has(site)) {
        const p = await AUTH.api("GET", "/letters/sites/" + encodeURIComponent(site));
        recent.set(site, (p.letters || []).map((x) => ({ ...x, site_name: siteName(site) }))
          .sort((a, b) => String(b.sent_at || b.at).localeCompare(String(a.sent_at || a.at))));
      }
      return recent.get(site);
    }
    function paintReply() {
      if (!replyBox) return;
      if (reply) {
        replyBox.innerHTML = `<span class="rg-rchip">${ICO.reply}<span class="rg-rb"><b>${esc(rlabel(reply))}</b><i>${
          esc(reply.subject)}${reply.site_name ? " · " + esc(reply.site_name) : ""}</i></span>
          <button type="button" data-unreply title="Не ответ — убрать" aria-label="Убрать">×</button></span>`;
        $r("[data-unreply]", replyBox).addEventListener("click", () => { reply = null; paintReply(); });
      } else {
        replyBox.innerHTML = `<div class="rg-rfind">${ICO.reply}<input type="search" data-rq autocomplete="off"
          placeholder="Найти письмо: №, тема или дата" value="${esc(rq)}"><div class="rg-rres" data-rres hidden></div></div>`;
        const inp = $r("[data-rq]", replyBox);
        // Нажатие по списку не должно уводить фокус из поля — иначе список
        // спрячется раньше, чем сработает выбор.
        $r("[data-rres]", replyBox).addEventListener("pointerdown", (e) => e.preventDefault());
        inp.addEventListener("input", () => { rq = inp.value; clearTimeout(rtimer); rtimer = setTimeout(rsearch, 250); });
        inp.addEventListener("focus", rsearch);
        inp.addEventListener("keydown", (e) => { if (e.key === "Enter") e.preventDefault(); });
        inp.addEventListener("blur", () => setTimeout(() => {
          const box = $r("[data-rres]", replyBox);
          if (box && !replyBox.contains(document.activeElement)) box.hidden = true;
        }, 150));
      }
      paintReplyClose();
    }
    async function rsearch() {
      const box = replyBox && $r("[data-rres]", replyBox);
      if (!box) return;
      const q = rq.trim(), my = ++rseq;
      let rows = [];
      try {
        if (q.length >= 2) rows = (await AUTH.api("GET", "/letters/search?" + new URLSearchParams({ q }))).rows || [];
        else if (sites.length) rows = await recentOf(sites[0]);
        else { box.hidden = true; return; }
      } catch (e) { rows = []; }
      if (my !== rseq || !box.isConnected) return;
      // Письма выбранных объектов — выше: ответ обычно с того же объекта.
      rows = rows.slice().sort((a, b) => (sites.includes(b.site_id) ? 1 : 0) - (sites.includes(a.site_id) ? 1 : 0));
      box.innerHTML = rows.length ? `${q.length < 2 ? `<div class="rg-rcap">Последние письма объекта «${esc(siteName(sites[0]))}»</div>` : ""}${
        rows.slice(0, 8).map((x) => `<button type="button" class="rg-ropt" data-rpick="${esc(x.id)}">
          <span class="rg-rdir ${x.direction === "in" ? "in" : "out"}">${x.direction === "in" ? ICO.in : ICO.out}</span>
          <span class="rg-rb"><b>${esc(rlabel(x))}</b><i>${esc(x.subject)}</i></span>
          <span class="rg-rsite">${esc((x.site && x.site.name) || x.site_name || "")}</span></button>`).join("")}`
        : `<div class="rg-rnone">${q.length >= 2 ? "Ничего не нашлось — попробуйте номер или слово из темы" : "У объекта писем пока нет"}</div>`;
      box.hidden = false;
      box.querySelectorAll("[data-rpick]").forEach((b) => b.addEventListener("click", () => {
        const x = rows.find((y) => y.id === b.dataset.rpick);
        if (!x) return;
        reply = { id: x.id, subject: x.subject, number: x.number, sent_at: x.sent_at, direction: x.direction,
                  status: x.status, site_id: x.site_id, site_name: (x.site && x.site.name) || x.site_name || "",
                  topic: x.topic || "" };
        if (reply.site_id && !sites.includes(reply.site_id)) { sites.push(reply.site_id); paintSites(); }
        // Ответ — обычно той же темы, что письмо, на которое он.
        if (!topicOf(form)) {
          const ts = topicsOf(reply);
          form.querySelectorAll("input[name=topic]").forEach((r) => { r.checked = ts.includes(r.value); }); paintTopic();
        }
        rq = "";
        paintReply();
      }));
    }
    function paintReplyClose() {
      const box = $r("[data-replyclose]", form);
      if (!box) return;
      const k = kindOf(form);
      const on = !!reply && reply.status === "open" && k !== "order" && reply.direction !== k;
      box.hidden = !on;
      if (on) $r("[data-replyclosetxt]", box).textContent = `Закрыть письмо ${rlabel(reply)}: ${
        reply.direction === "in" ? "на него ответили" : "получен ответ"}`;
    }
    form.querySelectorAll("input[name=kind]").forEach((r) => r.addEventListener("change", () => { relabel(); suggest(); }));
    let mail0 = orgMail();
    form.querySelectorAll("input[name=org_id][type=radio]").forEach((r) => r.addEventListener("change", () => {
      form.querySelectorAll(".rg-orgpick .seg-b").forEach((b) => b.classList.toggle("on", $r("input", b).checked));
      // Подставленный адрес компании меняется вместе с компанией; вписанный
      // руками — остаётся.
      const m = orgMail();
      if (viaNow === "email" && RECEIVED(kind) && noteIn.value.trim() === mail0 && m) noteIn.value = m;
      mail0 = m;
      suggest();
    }));
    let lastYear = val(form, "reg_date").slice(0, 4);
    form.elements.reg_date.addEventListener("change", () => {
      const y = val(form, "reg_date").slice(0, 4);
      if (y !== lastYear) { lastYear = y; suggest(); }
      const cb = $r("[data-closebox]", form);
      if (cb && !cb.hidden) showClose(true);
    });

    /* Объекты: чипы с крестиком и список «привязать ещё». Письмо с
       объектом встаёт карточкой в «Письма» объекта; карточку, уже
       заведённую мастером, можно зарегистрировать, а не заводить вторую. */
    let cardSeq = 0;
    function paintSites() {
      const host = $r("[data-sites]", form);
      const rest = (data.sites || []).filter((s) => !sites.includes(s.id));
      host.innerHTML = `${sites.map((id) => `<span class="rg-chip">${ICO.site}<b>${esc(siteName(id))}</b>${
        letter && id === letter.site_id ? "" : `<button type="button" data-unsite="${esc(id)}" title="Снять объект"
        aria-label="Снять объект">×</button>`}</span>`).join("")}
        ${rest.length ? `<select data-addsite aria-label="Привязать объект"><option value="">${sites.length
          ? "+ ещё объект" : "+ Привязать объект"}</option>${rest.map((s) => `<option value="${esc(s.id)}">${esc(s.name)}</option>`).join("")}</select>` : ""}`;
      host.querySelectorAll("[data-unsite]").forEach((b) => b.addEventListener("click", () => {
        sites = sites.filter((x) => x !== b.dataset.unsite);
        paintSites();
      }));
      const add = $r("[data-addsite]", host);
      if (add) add.addEventListener("change", () => {
        if (add.value && !sites.includes(add.value)) sites.push(add.value);
        paintSites();
      });
      const hint = $r("[data-sitehint]", form);
      const gone = d ? d.sites.filter((s) => !sites.includes(s.id)).length : 0;
      const came = d ? sites.filter((id) => !d.sites.some((s) => s.id === id)).length : 0;
      hint.textContent = !sites.length ? (kind === "order" ? "Без объекта приказ виден только в реестре"
        : kind === "other" ? "Без объекта документ виден только в реестре" : "Без объекта письмо видно только в реестре")
        : kind === "order" ? "Приказ увидят на странице объекта в «Письмах»"
        : kind === "other" ? "Документ увидят на странице объекта в «Письмах»"
        : gone && came ? "Карточка письма переедет на новый объект вместе с журналом"
        : gone ? "Со снятого объекта карточка письма уберётся, в реестре запись останется"
        : d && (d.cards || []).length ? "Письмо — карточкой в «Письмах» этих объектов"
        : "Письмо встанет карточкой в «Письма» объекта";
      paintCards();
    }

    /* «Сразу закрыть»: карточки, которые заведутся сейчас. Запись старше
       двух недель (загруженная из Excel, зарегистрированная задним числом)
       — галочка стоит сама: ответа по ней уже не ждут. */
    let closeTouched = false;
    form.elements.close.addEventListener("change", () => { closeTouched = true; });
    function showClose(on) {
      const box = $r("[data-closebox]", form);
      box.hidden = !on;
      if (on && !closeTouched) {
        const t = Date.parse(val(form, "reg_date") || today());
        form.elements.close.checked = !isNaN(t) && Date.now() - t > 14 * 864e5;
      }
    }

    function paintCards() {
      const box = $r("[data-cards]", form);
      const closeBox = $r("[data-closebox]", form);
      const letters = CARDS(kind);
      if (d) {
        // Где письмо сейчас в «Письмах» и что с ним.
        const cards = (d.cards || []).filter(() => letters);
        box.innerHTML = cards.length ? `<div class="fld"><span>В «Письмах»</span><div class="rg-cards-l">${cards.map((c) => `
          <button type="button" class="rg-lcard" data-letter="${esc(c.id)}" data-lsite="${esc(c.site_id)}"
            title="Открыть карточку письма">${ICO.mail}<b>${esc(c.site_name)}</b><i>${c.status === "done" ? "закрыто"
            : "открыто"}${c.items ? " · записей: " + c.items : ""}</i>${ICO.next}</button>`).join("")}</div></div>` : "";
        box.querySelectorAll("[data-letter]").forEach((b) => b.addEventListener("click", () => {
          close();
          const go = init.openLetter || OPTS.openLetter;
          if (go) go(b.dataset.lsite, b.dataset.letter);
        }));
        // Объектов стало больше — заведутся новые карточки; перепривязка
        // переносит прежнюю карточку, её состояние остаётся.
        const had = new Set((d.cards || []).map((c) => c.site_id));
        const added = sites.filter((s) => !had.has(s)).length;
        const gone = [...had].filter((s) => !sites.includes(s)).length;
        showClose(letters && added > gone);
        return;
      }
      if (letter) {
        box.innerHTML = `<div class="rg-reglet">${ICO.mail}<span>Регистрируем карточку из «Писем»: «${esc(letter.subject)}»</span></div>`;
        closeBox.hidden = true;
        return;
      }
      showClose(letters && sites.length > 0);
      box.innerHTML = "";
      if (!letters || sites.length !== 1) return;
      const site = sites[0], my = ++cardSeq;
      AUTH.api("GET", "/letters/sites/" + encodeURIComponent(site)).then((p) => {
        if (my !== cardSeq || !form.isConnected) return;
        const pool = (p.letters || []).filter((l) => !l.corr_id && l.direction === (kind === "claim" ? "in" : kind))
          .sort((a, b) => String(b.sent_at || b.at).localeCompare(String(a.sent_at || a.at))).slice(0, 6);
        if (!pool.length) return;
        box.innerHTML = `<div class="rg-cardpick"><span class="rg-cap">Письмо уже завели в «Письмах»?</span>
          <label class="rg-opt on"><input type="radio" name="card" value="" checked><b>Нет — завести карточку</b></label>
          ${pool.map((l) => `<label class="rg-opt"><input type="radio" name="card" value="${esc(l.id)}"><b>${esc(l.subject)}</b><i>${
            [l.number ? "№ " + esc(l.number) : "", l.sent_at ? day(l.sent_at) : "", esc(l.author)].filter(Boolean).join(" · ")}</i></label>`).join("")}
        </div>`;
        box.querySelectorAll("input[name=card]").forEach((r) => r.addEventListener("change", () => {
          box.querySelectorAll(".rg-opt").forEach((o) => o.classList.toggle("on", $r("input", o).checked));
          closeBox.hidden = !!r.value && r.checked;
          const l = pool.find((x) => x.id === r.value);
          if (l) {
            if (!val(form, "subject")) form.elements.subject.value = l.subject;
            if (l.sent_at) { form.elements.reg_date.value = l.sent_at; suggest(); }
          }
        }));
      }).catch(() => { /* без выбора — заведётся новая карточка */ });
    }

    /* Файлы: приложенные — открыть или убрать; новые уезжают после
       сохранения записи. */
    function paintFiles() {
      const host = $r("[data-files]", form);
      host.innerHTML = files.map((x) => `
        <span class="rg-file"><button type="button" class="rg-file-b" data-open="${esc(x.id)}" title="${x.preview
          ? "Открыть" : "Скачать"}">${ICO.file}<b>${esc(x.name)}</b><i>${size(x.size)}</i></button>
          <button type="button" class="rg-x" data-delf="${esc(x.id)}" title="Убрать файл" aria-label="Убрать файл">×</button></span>`).join("");
      host.querySelectorAll("[data-open]").forEach((b) => b.addEventListener("click", () =>
        openFile(files.find((x) => x.id === b.dataset.open), b)));
      host.querySelectorAll("[data-delf]").forEach((b) => b.addEventListener("click", async () => {
        const x = files.find((y) => y.id === b.dataset.delf);
        if (!x || !(await ASK.confirm(`Убрать файл «${x.name}» из записи?`, { ok: "Убрать" }))) return;
        try {
          await AUTH.api("DELETE", "/corr-files/" + encodeURIComponent(x.id));
          files.splice(files.indexOf(x), 1);
          paintFiles();
          DATA = null;
        } catch (e) { fail(e.message); }
      }));
    }
    const pick = form.elements.files, picked = $r("[data-picked]", form);
    const hint0 = d ? "" : "Скан письма, приказа или документа. Можно и позже.";
    picked.textContent = hint0;
    pick.addEventListener("change", () => {
      picked.textContent = pick.files.length ? "Загрузится при сохранении: " + [...pick.files].map((x) => x.name).join(", ") : hint0;
    });

    const del = $r("[data-del]", form);
    if (del) del.addEventListener("click", async () => {
      const txt = `Удалить запись «${d.label} от ${day(d.reg_date)}» из реестра?`
        + (d.cards && d.cards.length ? "\nКарточки в «Письмах», по которым ничего не записано, уйдут тоже;"
          + " где мастера уже работали — останутся обычными письмами." : "");
      if (!(await ASK.confirm(txt, { ok: "Удалить" }))) return;
      try {
        await AUTH.api("DELETE", "/corr/" + encodeURIComponent(d.id));
        close();
        DATA = null;
        if (HOST && HOST.isConnected && $r(".rg", HOST)) load();
        if (init.onDone) init.onDone(null);
      } catch (e) { fail(e.message); }
    });

    relabel();
    paintTopic();
    paintReply();
    paintFiles();
    suggest();
    const first = form.elements[d || kind === "order" ? "subject" : "party"];
    if (first && FINE.matches) first.focus();
    void ok;
  }

  /* ── загрузка журнала из Excel ─────────────────────────────── */
  function importDialog() {
    const orgs = (DATA && DATA.orgs) || [];
    const org0 = ORG && ORG !== "all" ? ORG : (orgs[0] && orgs[0].id) || "";
    let book = null, plan = null;
    const { form } = modal("Журнал из Excel", `
      <p class="rg-lead">Книга, в которой вели журнал. Колонки узнаются по шапке, вид журнала — по ним же («Прочее» — по
        названию журнала или листа). Записи, которые уже есть, не повторятся.</p>
      <div class="rg-2">
        ${orgs.length > 1 ? `<div class="fld"><label for="rgIO">Чей журнал</label><select id="rgIO" name="org">${orgs.map((o) =>
          `<option value="${esc(o.id)}"${o.id === org0 ? " selected" : ""}>${esc(o.name)}</option>`).join("")}</select></div>`
          : `<input type="hidden" name="org" value="${esc(org0)}">`}
        <div class="fld"><span>Книга</span>
          <label class="btn-ghost rg-pick">${ICO.up}<span>Выбрать .xlsx</span><input type="file" name="book" accept=".xlsx,.xlsm" hidden></label></div>
      </div>
      <div data-plan class="rg-plan"></div>`,
    "Загрузить", async (f, close, okBtn) => {
      if (!book) throw new Error("Выберите книгу Excel");
      if (!plan || !plan.total) throw new Error("Загружать нечего: новых записей в книге нет");
      okBtn.textContent = "Загружаю…";
      const res = await send(book, val(f, "org"), false, val(f, "kind"));
      DATA = null;
      ASK.alert(`Заведено записей: ${res.added}.`, { title: "Журнал загружен" });
      if (HOST && HOST.isConnected) load();
    }, "", "rg-import");
    const ok = $r("[data-ok]", form);
    ok.disabled = true;
    const planBox = $r("[data-plan]", form);
    const kindLabel = { in: "входящие", out: "исходящие", order: "приказы", other: "прочее" };
    async function preview() {
      if (!book) return;
      planBox.innerHTML = `<div class="rg-plan-wait"><span class="lx-spin"></span>Читаю книгу…</div>`;
      ok.disabled = true;
      try {
        const res = await send(book, val(form, "org"), true, val(form, "kind"));
        const sheets = res.sheets || [];
        const unknown = sheets.some((s) => !s.kind);
        const total = sheets.reduce((m, s) => m + (s.kind ? s.new : 0), 0);
        plan = { total };
        planBox.innerHTML = sheets.length ? `
          <table class="rg-plan-t"><thead><tr><th>Лист</th><th>Журнал</th><th>Новых</th><th>Уже есть</th><th>Без даты</th></tr></thead>
          <tbody>${sheets.map((s) => `<tr><td>${esc(s.name)}</td><td>${s.kind ? kindLabel[s.kind] : `<span class="rg-warn">не понять</span>`}</td>
            <td><b>${s.kind ? s.new : "—"}</b></td><td>${s.dup}</td><td>${s.skipped || ""}</td></tr>`).join("")}</tbody></table>
          ${unknown ? `<div class="fld rg-kindq"><label for="rgIK">Листы без понятной шапки — это</label><select id="rgIK" name="kind">
            <option value="">не загружать</option><option value="in">входящие</option><option value="out">исходящие</option>
            <option value="order">приказы</option><option value="other">прочее</option></select></div>` : ""}
          <p class="rg-lead rg-plan-note">Темы и способа получения в старых журналах нет: такие записи видят все, у кого
            «Письма». Найти их потом — отбором «Без темы».</p>`
          : `<div class="rg-warn">В книге не нашлось журнала: нужна шапка с колонкой «Содержание» и хотя бы двумя другими
            («№», «Дата», «Отправитель», «Адресат», «Инициатор»…).</div>`;
        const kq = $r("#rgIK", form);
        if (kq) kq.addEventListener("change", preview);
        ok.textContent = total ? `Загрузить ${records(total)}` : "Загрузить";
        ok.disabled = !total;
      } catch (e) {
        planBox.innerHTML = `<div class="rg-warn">${esc(e.message)}</div>`;
      }
    }
    form.elements.book.addEventListener("change", () => {
      book = form.elements.book.files[0] || null;
      const lab = $r(".rg-pick span", form);
      if (lab) lab.textContent = book ? book.name : "Выбрать .xlsx";
      preview();
    });
    if (form.elements.org && form.elements.org.tagName === "SELECT") form.elements.org.addEventListener("change", preview);

    function send(file, org, dry, kind) {
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", "/api/corr/import");
        xhr.setRequestHeader("Authorization", "Bearer " + AUTH.token());
        xhr.setRequestHeader("X-File-Name", encodeURIComponent(file.name));
        xhr.setRequestHeader("X-Org", encodeURIComponent(org || ""));
        if (kind) xhr.setRequestHeader("X-Kind", kind);
        if (dry) xhr.setRequestHeader("X-Dry", "1");
        xhr.setRequestHeader("Content-Type", "application/octet-stream");
        xhr.addEventListener("load", () => {
          let out = {};
          try { out = JSON.parse(xhr.responseText); } catch (e) { /* не json */ }
          if (xhr.status >= 200 && xhr.status < 300) resolve(out);
          else reject(new Error(out.error || "ответ сервера " + xhr.status));
        });
        xhr.addEventListener("error", () => reject(new Error("связь оборвалась")));
        xhr.send(file);
      });
    }
  }

  /* ── снаружи ───────────────────────────────────────────────── */
  /* Экран реестра в «Письмах»: host — #sec-let; opts.back — назад к
     письмам, opts.openLetter(site, letter) — открыть карточку письма. */
  function mount(host, opts) {
    const first = HOST !== host || !$r(".rg", host);
    HOST = host;
    OPTS = opts || {};
    if (first || !DATA) {
      if (!DATA || DATA.error) host.innerHTML = `<div class="pg rg">${headHtml()}${barHtml()}<div class="pg-body rg-body" id="rgBody">${listHtml()}</div></div>`;
      else paint();
      load();
    } else paint();
  }

  /* Зарегистрировать карточку из «Писем» — окно поверх письма. */
  function register(letter, onDone) {
    entryDialog(null, { letter, onDone });
  }

  /* Открыть запись реестра поверх «Писем» (из карточки письма). */
  function edit(id, opts) {
    openEntry(id, opts);
  }

  /* Новое письмо из «Писем» — регистрацией (заказчик, 08.10.2026): объект
     и вид уже выбраны, карточку письма заведёт сервер. opts: site, kind,
     onDone(запись с карточками). */
  function create(opts) {
    entryDialog(null, { site: opts.site || "", kind: opts.kind, reply: opts.reply || null, onDone: opts.onDone });
  }

  return { mount, register, edit, create, reset() { DATA = null; } };
})();
