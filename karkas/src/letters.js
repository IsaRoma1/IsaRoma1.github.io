/* Письма — проект и переписка по объектам.

   Заказчик, 23.09.2026: с объектов идёт много писем о несоответствии
   проекта стройке, и их плохо отрабатывают. Запросили у заказчика данные,
   он не ответил, а сроки трясут с нас. На совещании предложили стеллаж с
   папкой на каждый объект; этот раздел — та же папка, только в телефоне
   мастера.

   Вид (30.09.2026, пользователь: «уныло и не интуитивно, сделай так,
   чтобы сотрудникам хотелось работать; не привязывайся к тому, что есть»)
   — как в почтовой программе, которую знает каждый:

     слева    — объекты, как папки; первой — «Все объекты», общая лента;
     середина — переписки выбранного объекта (или всех): одна строка на
                цепочку писем, главное в ней — на чьей стороне мяч;
     справа   — открытое письмо: состояние крупно, вся цепочка лентой,
                журнал и поле записи внизу.

   Мяч — ключ ко всему разделу. Пришло к нам и не закрыто — «Надо
   ответить» (фирменный цвет: действие за нами); отправили мы — «Ждём
   ответа» (синий: ждём их); закрыто — зелёная галочка. Дни ожидания
   темнеют: неделя — жёлтым, две — красным.

   Уже экрана — колонок меньше: до 1280 пикселей объекты уходят в
   выпадающий выбор над списком, до 900 и на телефоне — лестница экранов
   (объекты → переписки → письмо) с кнопкой «назад», как раньше.

   Письмо — не чат, а регистрация: что по нему сделано, кем и когда,
   приложенные ответы и повторные письма. */
"use strict";

const LETTERS = (() => {
  const $l = (s, r) => (r || document).querySelector(s);
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  const svg = (d) => `<svg viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
  const ICO = {
    back: svg(`<path d="M15 18l-6-6 6-6"/>`),
    next: svg(`<path d="M9 18l6-6-6-6"/>`),
    plus: svg(`<path d="M12 5v14M5 12h14"/>`),
    find: svg(`<circle cx="11" cy="11" r="6.5"/><path d="M20.5 20.5 16 16"/>`),
    clip: svg(`<path d="M20.5 11.5l-8.2 8.2a5 5 0 0 1-7.1-7.1l8.5-8.5a3.3 3.3 0 0 1 4.7 4.7l-8.5 8.5a1.7 1.7 0 0 1-2.4-2.4l7.8-7.8"/>`),
    file: svg(`<path d="M7 3.5h6.5l4 4V20a.5.5 0 0 1-.5.5H7a.5.5 0 0 1-.5-.5V4a.5.5 0 0 1 .5-.5z"/><path d="M13.5 3.5V7.5h4"/>`),
    plan: svg(`<path d="M4 5.5A1.5 1.5 0 0 1 5.5 4h13A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5z"/><path d="M4 10h7v10M11 14h9"/>`),
    mail: svg(`<rect x="3.5" y="5.5" width="17" height="13" rx="2"/><path d="M4 7l8 6 8-6"/>`),
    out: svg(`<path d="M7 17 17 7M9 7h8v8"/>`),
    in: svg(`<path d="M17 7 7 17M15 17H7V9"/>`),
    check: svg(`<path d="M5 12.5l4.5 4.5L19 7.5"/>`),
    undo: svg(`<path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>`),
    edit: svg(`<path d="M4.5 19.5h4l10-10a2.1 2.1 0 0 0-3-3l-10 10z"/>`),
    trash: svg(`<path d="M4.5 6.5h15M9.5 6.5V4.8a1.3 1.3 0 0 1 1.3-1.3h2.4a1.3 1.3 0 0 1 1.3 1.3v1.7M6.5 6.5l.9 12.2A1.5 1.5 0 0 0 8.9 20h6.2a1.5 1.5 0 0 0 1.5-1.3l.9-12.2"/>`),
    start: svg(`<circle cx="12" cy="12" r="3.5"/>`),
    send: svg(`<path d="M4.5 12h14M13 6.5l5.5 5.5-5.5 5.5"/>`),
    folder: svg(`<path d="M3.5 7A1.5 1.5 0 0 1 5 5.5h4.3l2 2.2H19a1.5 1.5 0 0 1 1.5 1.5v8.3A1.5 1.5 0 0 1 19 19H5a1.5 1.5 0 0 1-1.5-1.5z"/>`),
    chev: svg(`<path d="M6 9l6 6 6-6"/>`),
    reply: svg(`<path d="M9.5 7.5 5 12l4.5 4.5"/><path d="M5 12h9.5a4.5 4.5 0 0 1 4.5 4.5V19"/>`),
    kid: svg(`<path d="M6 5v6.5A3.5 3.5 0 0 0 9.5 15H19"/><path d="M15 11l4 4-4 4"/>`),
    link: svg(`<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>`),
    inbox: svg(`<path d="M3.5 13.5h4.3l1.5 2.5h5.4l1.5-2.5h4.3"/><path d="M5.9 6.3A2 2 0 0 1 7.7 5h8.6a2 2 0 0 1 1.8 1.3l2.4 7.2V18a1.5 1.5 0 0 1-1.5 1.5h-14A1.5 1.5 0 0 1 3.5 18v-4.5z"/>`),
    wait: svg(`<path d="M7 3.5h10M7 20.5h10M8 3.5v3.3c0 1.3.6 2.5 1.7 3.2L12 11.5l2.3-1.5A3.8 3.8 0 0 0 16 6.8V3.5M8 20.5v-3.3c0-1.3.6-2.5 1.7-3.2l2.3-1.5 2.3 1.5a3.8 3.8 0 0 1 1.7 3.2v3.3"/>`),
    site: svg(`<path d="M4.5 20.5V7l7.5-3.5L19.5 7v13.5"/><path d="M9.5 20.5v-4.5h5v4.5M8.5 9.5h1.5M14 9.5h1.5M8.5 13h1.5M14 13h1.5M3 20.5h18"/>`),
    fire: svg(`<path d="M12 21a6.5 6.5 0 0 0 6.5-6.5c0-3.7-2.6-5.9-4.2-8.7-.4 2.1-1.3 3.4-2.8 4.2C11.5 7.3 10.3 5 8 3.5c.3 3.1-2.5 5.5-2.5 11A6.5 6.5 0 0 0 12 21z"/>`),
    book: svg(`<path d="M5.5 4.5A1.5 1.5 0 0 1 7 3h11.5v15H7a1.5 1.5 0 0 0-1.5 1.5z"/><path d="M5.5 19.5A1.5 1.5 0 0 0 7 21h11.5v-3M9 7.5h6M9 11h4"/>`),
    order: svg(`<path d="M7 3.5h10a1.5 1.5 0 0 1 1.5 1.5v14.5a1 1 0 0 1-1 1H6.5a1 1 0 0 1-1-1V5A1.5 1.5 0 0 1 7 3.5z"/><path d="M9 8.5h6M9 12h6M9 15.5h3.5"/>`),
  };

  /* ── состояние ─────────────────────────────────────────────── */
  let VIEW = "list";       // list — все объекты, site — объект (или все), letter — письмо, docs — файлы
  let SITE = "", LETTER = "";   // SITE "" — все объекты сразу
  let LIST = null, PAGE = null, CARD = null;
  let Q = "";              // поиск объекта (слева) — на телефоне ищет и письма
  let FILTER = "open";     // переписки: open, need, wait, all
  let FILES_AT = null;     // в какой папке открыть файлы объекта (null — где были)
  let CHAIN_OPEN = null;   // цепочка в письме на телефоне: null — как принято на экране
  const THREAD_SHUT = new Set();   // письма переписки, свёрнутые руками
  let LQ = "", LQ_CTX = null, SRES = null;  // поиск писем: строка, где искали, найденное
  let GRES = null;         // поиск писем по всем объектам — на телефонном экране объектов
  let QUIET = false;       // раскрыт ли список объектов без писем
  let CTXPOP = false;      // выпадающий выбор объекта (средняя ширина)
  let EDIT_ITEM = "", EDIT_TEXT = "";       // запись журнала, которую правят
  let FED = "";            // письмо, чей журнал уже прокручен к последней записи
  let SHOWN = "";          // какой экран сейчас нарисован
  let ORD_OPEN = false;    // раскрыты ли приказы объекта на телефоне
  // Компания (пользователь, 06.10.2026): переписка у каждой нашей
  // компании своя. "" — обе сразу.
  let ORGF = "";
  try { ORGF = localStorage.getItem("lx-org") || ""; } catch (e) { /* без памяти */ }
  let loadSeq = 0;
  const QUEUE = [];        // загрузки: {file, loaded, state, error, site, letter, kind}
  let sending = false;

  /* Куда смотреть при открытии страницы по ссылке: #let/<объект>/<письмо>,
     «all» на месте объекта — все объекты. Читаем при загрузке скрипта —
     app.js переписывает адрес раньше, чем раздел откроется. */
  const parseHash = () => {
    const m = /^#let(?:\/([\w-]+))?(?:\/([\w-]+))?$/.exec(location.hash || "");
    return m ? { site: m[1] || "", letter: m[2] || "" } : null;
  };
  let START = parseHash();

  try { QUIET = localStorage.getItem("lx-quiet") === "1"; } catch (e) { /* без памяти */ }

  /* ── форматы ───────────────────────────────────────────────── */
  const pad = (n) => String(n).padStart(2, "0");
  const plural = (n, one, few, many) => {
    const a = Math.abs(n) % 100, b = a % 10;
    if (a > 10 && a < 20) return many;
    if (b > 1 && b < 5) return few;
    return b === 1 ? one : many;
  };
  const days = (n) => `${n} ${plural(n, "день", "дня", "дней")}`;
  const letters = (n) => `${n} ${plural(n, "письмо", "письма", "писем")}`;
  /* Тема документа (заказчик, 12.10.2026): производство видят все с
     «Письмами», финансы и сметный — по галочкам в «Доступе». В списках
     метку ставим только закрытым темам: производство — обычное дело. */
  const TOPIC_NAME = { prod: "Производство", fin: "Финансы", est: "Сметный" };
  const topicChip = (value) => String(value || "").split(",").filter((t) => TOPIC_NAME[t]).map((t) =>
    `<span class="lx-tp ${t}" title="Тема документа">${TOPIC_NAME[t]}</span>`).join(" ");
  const VIA_HOW = { edo: "по ЭДО", cdek: "СДЭК", post: "Почтой России", email: "по электронной почте", hand: "лично" };

  function day(s) {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s || "");
    return m ? `${m[3]}.${m[2]}.${m[1]}` : "";
  }
  const dm = (s) => day(s).slice(0, 5);
  function today() {
    const d = new Date();
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }
  /* «сегодня 14:05», «вчера 09:12», «18.09 16:40», в прошлом году — с годом. */
  function stamp(iso) {
    const d = new Date(iso);
    if (!iso || isNaN(d)) return "";
    const now = new Date(), t = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
    const yest = new Date(now); yest.setDate(now.getDate() - 1);
    if (d.toDateString() === now.toDateString()) return "сегодня " + t;
    if (d.toDateString() === yest.toDateString()) return "вчера " + t;
    return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}${
      d.getFullYear() !== now.getFullYear() ? "." + d.getFullYear() : ""} ${t}`;
  }
  /* Коротко для строк списка: «сегодня», «вчера», «18.09». */
  const when = (iso) => stamp(iso).replace(/ \d{2}:\d{2}$/, "");
  function size(n) {
    n = Number(n) || 0;
    const u = ["Б", "КБ", "МБ", "ГБ"];
    let i = 0;
    while (n >= 1024 && i < u.length - 1) { n /= 1024; i++; }
    return (i ? n.toLocaleString("ru-RU", { maximumFractionDigits: n < 10 ? 1 : 0 })
              : String(n)) + " " + u[i];
  }
  const initial = (name) => esc((String(name || "?").trim()[0] || "?").toUpperCase());
  // Цвет кружка человека — от имени: у каждого свой, и журнал читается
  // по людям, а не сплошной серой колонкой.
  const hue = (s) => {
    let h = 7;
    for (const ch of String(s || "")) h = (h * 31 + ch.charCodeAt(0)) % 360;
    return h;
  };

  /* ── мяч: на чьей стороне письмо ───────────────────────────── */
  const SIDE = { need: "Надо ответить", wait: "Ждём ответа", done: "Закрыто" };
  const SIDE_IC = { need: ICO.reply, wait: ICO.wait, done: ICO.check };
  const sideOf = (l) => (l.status === "done" ? "done" : l.direction === "in" ? "need" : "wait");
  const sev = (d) => (d >= 14 ? 2 : d >= 7 ? 1 : 0);
  const age = (d) => (d ? `${d} дн` : "сегодня");
  const dirText = (d) => (d === "in" ? "Нам пришло" : "Мы отправили");

  /* ── раскладка ─────────────────────────────────────────────────
     wide — три колонки, mid — две (объекты — выпадающим выбором), one —
     лестница экранов. narrow — телефон: окна снизу, крупные строки. */
  const MQ_WIDE = matchMedia("(min-width: 1280px)");
  const MQ_MID = matchMedia("(min-width: 900px)");
  const NARROW = matchMedia("(max-width: 684px)");
  const FINE = matchMedia("(pointer: fine)");
  const mode = () => (MQ_WIDE.matches ? "wide" : MQ_MID.matches ? "mid" : "one");
  const narrow = () => NARROW.matches;
  const split = () => mode() !== "one";
  // Пока раздел не открылся по ссылке (START не разобран), рисовать
  // нечего: иначе на миг мелькали бы «все объекты» вместо нужного экрана.
  [MQ_WIDE, MQ_MID, NARROW].forEach((m) => m.addEventListener("change", () => {
    if (document.documentElement.dataset.sec === "let" && !START) refresh();
  }));

  /* ── навигация ─────────────────────────────────────────────────
     Лестница, а не история (пользователь, 23.09.2026: «назад» уводило то
     в «Письма», то в другое письмо). «Назад» ведёт на ступень выше: из
     письма — в объект, из объекта — во все объекты. Вглубь — новая запись
     истории, вбок (соседнее письмо, другой объект в колонке) — подмена
     текущей, поэтому и кнопка «назад» телефона ходит по той же лестнице. */
  const ctxId = () => SITE || "all";
  const hashFor = () => (VIEW === "letter" ? `#let/${ctxId()}/${LETTER}`
    : VIEW === "docs" ? `#let/${SITE}/files`
    : VIEW === "reg" ? "#let/reg"
    : VIEW === "site" ? `#let/${ctxId()}` : "");
  // «reg» на месте объекта — реестр корреспонденции (06.10.2026): у
  // объектов идентификаторы с «s-», и с ними он не спутается.
  const viewOf = (h) => (!h || !h.site ? "list" : h.site === "reg" ? "reg"
    : h.letter === "files" || h.letter === "docs" ? "docs"
    : h.letter ? "letter" : "site");
  const siteOfHash = (h) => (h && h.site && h.site !== "all" && h.site !== "reg" ? h.site : "");
  const urlFor = () => location.pathname + location.search + hashFor();

  const keyOf = (v, s, l) => (v === "list" ? "list" : v === "reg" ? "reg" : v === "site" ? "s:" + s
    : v === "docs" ? "d:" + s : "l:" + l);
  const curKey = () => keyOf(VIEW, SITE, LETTER);
  // Письмо «всех объектов» на широком экране стоит прямо под ними: там
  // «все объекты» и есть первый экран.
  const parentOf = () => (VIEW === "letter" || VIEW === "docs"
    ? (!SITE && split() ? ["list", "", ""] : ["site", SITE, ""])
    : ["list", "", ""]);

  function show(view, site, letter) {
    VIEW = view; SITE = site || ""; LETTER = letter || "";
    FED = ""; EDIT_ITEM = ""; CTXPOP = false;
    refresh();
  }

  /* Вбок: соседнее письмо или другой объект на той же ступени — запись
     истории подменяется, а не копится. jump — перескок со ступени на
     ступень (из письма — в другой объект): под записью тогда лежит не
     родитель, и «назад» в разделе ведёт подменой, а не по истории. */
  function swap(view, site, letter, jump) {
    VIEW = view; SITE = site || ""; LETTER = letter || "";
    history.replaceState({ lt: 1, up: keyOf(...parentOf()), k: curKey(), jump: !!jump }, "", urlFor());
    show(view, site, letter);
  }

  /* На ступень ниже. */
  function go(view, site, letter) {
    const up = curKey();
    VIEW = view; SITE = site || ""; LETTER = letter || "";
    history.pushState({ lt: 1, up, k: curKey() }, "", urlFor());
    show(view, site, letter);
  }

  /* На ступень выше. Если под нами в истории лежит ровно родитель —
     шагаем назад по истории; иначе подменяем текущую запись родителем. */
  function up() {
    if (VIEW === "list") return;
    const [v, s, l] = parentOf();
    const target = keyOf(v, s, l);
    const st = history.state;
    if (st && st.lt && !st.jump && st.k === curKey() && st.up === target) { history.back(); return; }
    VIEW = v; SITE = s; LETTER = l;
    history.replaceState({ lt: 1, up: v === "list" ? null : "list", k: target }, "", urlFor());
    show(v, s, l);
  }

  /* Выбор объекта в колонке слева (или «Все объекты»): ступень та же —
     вбок; со ступени «все объекты» — вглубь. */
  function pickCtx(site) {
    if (!site) {
      if (VIEW === "list") return;
      VIEW = "list"; SITE = ""; LETTER = "";
      history.replaceState({ lt: 1, up: null, k: "list" }, "", urlFor());
      show("list", "", "");
      return;
    }
    if (VIEW === "list") go("site", site);
    else swap("site", site, "", VIEW !== "site");
  }

  /* Карточка письма из реестра: «назад» браузера вернёт в реестр. */
  function openFromReg(site, id) {
    if (!split()) go("site", site);
    go("letter", site, id);
  }

  /* Открыть письмо из списка переписок: из письма — вбок, иначе вглубь. */
  function openLetter(id) {
    const ctx = VIEW === "list" ? "" : SITE;
    if (VIEW === "letter") swap("letter", ctx, id);
    else go("letter", ctx, id);
  }

  window.addEventListener("popstate", () => {
    const h = parseHash();
    VIEW = viewOf(h);
    SITE = siteOfHash(h);
    LETTER = VIEW === "letter" ? h.letter : "";
    FED = ""; EDIT_ITEM = ""; CTXPOP = false;
    if (document.documentElement.dataset.sec === "let") refresh();
  });

  /* ── данные ────────────────────────────────────────────────── */
  async function load() {
    if (START) {
      // Открыли по ссылке: достраиваем лестницу под ним — все объекты,
      // объект, письмо, — чтобы «назад» вело вверх по ней.
      const v = viewOf(START), site = siteOfHash(START), letter = v === "letter" ? START.letter : "";
      START = null;
      VIEW = "list"; SITE = ""; LETTER = "";
      history.replaceState({ lt: 1, up: null, k: "list" }, "", urlFor());
      if (v === "reg") {
        VIEW = "reg";
        history.pushState({ lt: 1, up: "list", k: "reg" }, "", urlFor());
      } else if (v !== "list" && (site || !split())) {
        VIEW = "site"; SITE = site;
        history.pushState({ lt: 1, up: "list", k: curKey() }, "", urlFor());
      }
      if (v === "letter" || v === "docs") {
        const upKey = curKey();
        VIEW = v; LETTER = letter;
        history.pushState({ lt: 1, up: upKey, k: curKey() }, "", urlFor());
      }
    } else {
      // app.js только что переписал адрес без хвоста — возвращаем его.
      const st = history.state;
      history.replaceState(st && st.lt && st.k === curKey() ? st
        : { lt: 1, up: VIEW === "list" ? null : keyOf(...parentOf()), k: curKey() }, "", urlFor());
    }
    await refresh();
  }

  /* Что нужно экрану: объекты со сводкой и лентой — для колонки слева и
     для «всех объектов»; объект — для его переписок; письмо — для правой
     колонки. Всё — одновременно. */
  async function refresh() {
    if (VIEW === "reg") {
      // Реестр грузит своё сам; письма ему не нужны.
      ++loadSeq;
      render();
      return;
    }
    const seq = ++loadSeq, m = mode();
    const needList = m !== "one" || VIEW === "list" || !SITE;
    const needPage = !!SITE && (VIEW !== "letter" || m !== "one");
    const needCard = VIEW === "letter";
    if (SHOWN !== curKey() + m) render();
    const jobs = [];
    const take = (p, set) => jobs.push(p.then((d) => { if (seq === loadSeq) set(d); },
      (e) => { if (seq === loadSeq) set({ error: e.message }); }));
    if (needList) {
      take(AUTH.api("GET", "/letters/sites" + (ORGF ? "?org=" + encodeURIComponent(ORGF) : "")), (d) => {
        LIST = d;
        // Компанию убрали из справочника — показываем обе.
        if (ORGF && !d.error && !(d.orgs || []).some((o) => o.id === ORGF)) setOrg("");
      });
    }
    if (needPage) take(AUTH.api("GET", "/letters/sites/" + SITE), (d) => { PAGE = d; });
    if (needCard) take(AUTH.api("GET", "/letters/" + LETTER), (d) => { CARD = d; });
    await Promise.all(jobs);
    if (seq === loadSeq) render();
  }

  const pageOk = () => (PAGE && PAGE.site && PAGE.site.id === SITE ? PAGE : null);
  const cardOk = () => (CARD && CARD.letter && CARD.letter.id === LETTER ? CARD : null);
  /* Объект письма — у письма из «всех объектов» свой, не контекстный. */
  const lsite = () => { const c = cardOk(); return c ? c.letter.site_id : SITE; };

  /* ── отрисовка ─────────────────────────────────────────────── */
  function render() {
    const host = $l("#sec-let");
    if (!host) return;
    if (VIEW === "reg") {
      SHOWN = "reg";
      if (typeof REG === "object") {
        REG.mount(host, { back: up, openLetter: openFromReg });
      }
      return;
    }
    const keep = keepFocus();
    const key = curKey() + mode();
    const same = SHOWN === key;
    // Прокрутка колонок переживает перерисовку: раскрыл внизу — не прыгнуло.
    const scrolls = {};
    host.querySelectorAll("[data-keep]").forEach((el) => { scrolls[el.id] = el.scrollTop; });
    const feed0 = $l("#ltFeed", host);
    const convKey = ctxId() + "|" + FILTER + "|" + (LQ_CTX === ctxId() ? LQ.trim() : "");
    const sameList = render.convKey === convKey;
    render.convKey = convKey;
    const atEnd = same && feed0 ? feed0.scrollHeight - feed0.scrollTop - feed0.clientHeight < 60 : false;
    host.innerHTML = split() ? splitHtml() : oneHtml();
    SHOWN = key;
    wire(host);
    keep();
    host.querySelectorAll("[data-keep]").forEach((el) => {
      if (el.id === "ltFeed") return;
      if (scrolls[el.id] !== undefined && (same || el.id === "lxObjs"
        || (el.id === "lxConvs" && sameList && split()))) el.scrollTop = scrolls[el.id];
    });
    const feed = $l("#ltFeed", host);
    if (feed && VIEW === "letter") {
      // Журнал читают снизу: письмо открыли — к последней записи; то же
      // письмо перерисовано — где был, а был внизу — внизу и остаётся.
      const has = !!cardOk();
      if (has && FED !== LETTER) {
        // В переписке — с её начала: письмо читают вместе с тем, на что оно
        // отвечает (09.10.2026). Без переписки длинный журнал — с конца.
        const log = $l(".lx-log", feed);
        const long = split() && log && log.offsetHeight > feed.clientHeight - 60 && !$l(".lx-thread", feed);
        feed.scrollTop = long ? feed.scrollHeight : 0;
      } else if (has && atEnd) feed.scrollTop = feed.scrollHeight;
      else if (same && scrolls.ltFeed !== undefined) feed.scrollTop = scrolls.ltFeed;
      if (has) FED = LETTER;
    }
    const sel = $l(".lx-conv.sel", host);
    if (sel && !same) sel.scrollIntoView({ block: "nearest" });
  }

  /* Поле, в котором печатали, переживает перерисовку вместе с курсором. */
  function keepFocus() {
    const el = document.activeElement;
    if (!el || !el.id || !el.closest || !el.closest("#sec-let")) return () => {};
    const id = el.id, a = el.selectionStart, b = el.selectionEnd;
    return () => {
      const n = document.getElementById(id);
      if (!n) return;
      n.focus();
      try { n.setSelectionRange(a, b); } catch (e) { /* не текстовое поле */ }
    };
  }

  const loading = () => `<div class="lx-state-msg"><span class="lx-spin"></span></div>`;
  const failed = (d) => `<div class="lx-state-msg"><b>Не открылось</b>${esc(d.error)}</div>`;

  /* ── объекты: колонка слева / первый экран телефона ────────── */
  function objectsOf() {
    const rows = (LIST && LIST.rows) || [];
    const t = Q.trim().toLowerCase();
    const hit = (r) => !t || [r.name, r.customer, r.address]
      .some((x) => String(x || "").toLowerCase().includes(t));
    const busy = rows.filter((r) => r.letters && hit(r)).sort((a, b) =>
      (b.open ? 1 : 0) - (a.open ? 1 : 0) || (b.days || 0) - (a.days || 0)
      || String(b.last || "").localeCompare(String(a.last || "")) || a.name.localeCompare(b.name, "ru"));
    const quiet = rows.filter((r) => !r.letters && hit(r))
      .sort((a, b) => a.name.localeCompare(b.name, "ru"));
    return { busy, quiet, searching: !!t };
  }

  const badges = (need, wait) => `<span class="lx-bdgs">${need ? `<span class="lx-bdg need"
    title="Надо ответить: ${need}">${need}</span>` : ""}${wait ? `<span class="lx-bdg wait"
    title="Ждём ответа: ${wait}">${wait}</span>` : ""}</span>`;

  function objRowHtml(r, cur) {
    const s = r.open ? sev(r.days || 0) : 0;
    const sub = r.open ? `${r.open} ${plural(r.open, "открытое", "открытых", "открытых")} · старшему ${age(r.days || 0)}`
      : r.letters ? `${letters(r.letters)}, все закрыты` : "писем нет";
    return `<button type="button" class="lx-obj${cur ? " sel" : ""}${s ? " s" + s : ""}${r.letters ? "" : " quiet"}"
      data-ctx="${esc(r.id)}" title="${esc([r.name, r.customer, r.address].filter(Boolean).join(" · "))}">
      <span class="lx-obj-main"><b>${esc(r.name)}</b><i>${esc(sub)}</i></span>
      ${badges(r.need || 0, r.wait || 0)}
    </button>`;
  }

  function allRowHtml(cur) {
    const st = (LIST && LIST.stats) || {};
    return `<button type="button" class="lx-obj all${cur ? " sel" : ""}" data-ctx="">
      <span class="lx-obj-ic">${ICO.inbox}</span>
      <span class="lx-obj-main"><b>Все объекты</b><i>${st.open ? `${st.open} ${plural(st.open, "открытое письмо",
        "открытых письма", "открытых писем")}` : "открытых писем нет"}</i></span>
      ${badges(st.need || 0, st.wait || 0)}
    </button>`;
  }

  /* Наши компании: кнопками над объектами — «Все», «КАРКАС-ЭЛЕКТРО»,
     «Каркас Монтаж». Выбранная отбирает объекты, ленту и счётчики. */
  const orgsAll = () => (LIST && !LIST.error && LIST.orgs) || (PAGE && !PAGE.error && PAGE.orgs)
    || (CARD && !CARD.error && CARD.orgs) || [];
  const orgOf = (id) => orgsAll().find((o) => o.id === id) || null;
  // «КАРКАС-ЭЛЕКТРО» → «Каркас-Электро»: капслок в кнопке кричит.
  const nice = (t) => String(t || "").replace(/[A-ZА-ЯЁ]{4,}/g, (w) => w[0] + w.slice(1).toLowerCase());
  /* На кнопках в узкой колонке общее начало не нужно: «Электро»,
     «Электромонтаж» вместо «Каркас-Электро», «Каркас Электромонтаж». */
  function shortLabels(orgs) {
    const parts = orgs.map((o) => nice(o.label).split(/[\s-]+/));
    const head = parts[0][0];
    const same = parts.length > 1 && parts.every((x) => x.length > 1 && x[0] === head);
    return orgs.map((o, i) => (same ? parts[i].slice(1).join(" ") : nice(o.label)));
  }
  function orgSwitchHtml() {
    const orgs = orgsAll();
    if (orgs.length < 2) return "";
    const short = shortLabels(orgs);
    const all = [{ id: "", t: "Все", name: "Письма всех компаний" }]
      .concat(orgs.map((o, i) => ({ id: o.id, t: short[i], name: o.name })));
    return `<div class="seg lx-orgs" role="tablist" aria-label="Компания">${all.map((o) => `
      <button type="button" role="tab" class="seg-b${o.id === ORGF ? " on" : ""}" data-orgf="${esc(o.id)}"
        aria-selected="${o.id === ORGF}" title="${esc(o.name)}">${esc(o.t)}</button>`).join("")}</div>`;
  }
  function setOrg(id) {
    ORGF = id || "";
    try { localStorage.setItem("lx-org", ORGF); } catch (e) { /* без памяти */ }
  }
  function wireOrgs(host) {
    host.querySelectorAll("[data-orgf]").forEach((b) => b.addEventListener("click", () => {
      if (b.dataset.orgf === ORGF) return;
      setOrg(b.dataset.orgf);
      SRES = null; GRES = null;
      render();
      refresh();
    }));
  }

  function objectsListHtml(cur) {
    if (!LIST) return loading();
    if (LIST.error) return failed(LIST);
    const { busy, quiet, searching } = objectsOf();
    const showQuiet = QUIET || searching;
    return `
      ${searching ? "" : orgSwitchHtml() + allRowHtml(cur === "")}
      ${busy.length ? `<div class="lx-h">С перепиской<i>${busy.length}</i></div>
        ${busy.map((r) => objRowHtml(r, cur === r.id)).join("")}` : ""}
      ${quiet.length ? `<button type="button" class="lx-h lx-h-tog${showQuiet ? " on" : ""}" id="lxQuiet"
        aria-expanded="${showQuiet}">${ICO.chev}Без писем<i>${quiet.length}</i></button>
        ${showQuiet ? quiet.map((r) => objRowHtml(r, cur === r.id)).join("") : ""}` : ""}
      ${searching && !busy.length && !quiet.length ? `<div class="lx-none">Объект не нашёлся</div>` : ""}`;
  }

  /* Реестр корреспонденции — тем, кому выдано право (06.10.2026). */
  const canReg = () => !!(LIST && LIST.can_reg);
  const regRowHtml = () => (canReg() ? `
    <button type="button" class="lx-regb" id="lxReg" title="Журналы входящих, исходящих и приказов">
      <span class="lx-obj-ic">${ICO.book}</span><span class="lx-obj-main"><b>Реестр корреспонденции</b>
      <i>входящие, исходящие, приказы</i></span>${ICO.next}</button>` : "");

  function p1Html() {
    const cur = VIEW === "list" ? "" : SITE;
    return `
      <aside class="lx-p1">
        <div class="lx-p1-h">
          <label class="lx-find">${ICO.find}<input id="lxQ" type="search" placeholder="Найти объект"
            value="${esc(Q)}" autocomplete="off"></label>
          <button type="button" class="lx-ib" id="lxNewSite" title="Новый объект" aria-label="Новый объект">${ICO.plus}</button>
        </div>
        <div class="lx-objs" id="lxObjs" data-keep>${objectsListHtml(cur)}</div>
        ${regRowHtml()}
      </aside>`;
  }

  /* ── переписки: одна строка на цепочку писем ─────────────────
     Заказчик, 28.09.2026 (Ирина, ПТО): больше всего времени уходит на то,
     чтобы найти письмо и ответ на него. Письмо заводят как ответ на
     другое — выходит цепочка, переписка. В списке переписка — одной
     строкой: тема головного письма, на чьей стороне мяч и сколько дней,
     последнее движение. Открывается письмо, с которым сейчас работать:
     самое давнее из пришедших к нам без ответа, иначе самое давнее
     открытое, иначе последнее. */
  const chrono = (a, b) => String(a.sent_at || a.at).slice(0, 10)
    .localeCompare(String(b.sent_at || b.at).slice(0, 10)) || String(a.at).localeCompare(String(b.at));

  /* Головное письмо: вверх по «ответ на», пока есть куда. */
  function rootIn(by, l) {
    const seen = new Set();
    while (l && l.reply_to && by.has(l.reply_to) && !seen.has(l.id)) {
      seen.add(l.id);
      l = by.get(l.reply_to);
    }
    return l;
  }

  function convsOf(list) {
    const by = new Map(list.map((l) => [l.id, l]));
    const map = new Map();
    for (const l of list) {
      const h = rootIn(by, l);
      if (!map.has(h.id)) map.set(h.id, { head: h, all: [] });
      map.get(h.id).all.push(l);
    }
    const out = [...map.values()];
    const oldest = (xs) => xs.reduce((m, x) => (!m || (x.days || 0) > (m.days || 0) ? x : m), null);
    for (const cv of out) {
      cv.all.sort(chrono);
      const open = cv.all.filter((l) => l.status === "open");
      const ins = open.filter((l) => l.direction === "in");
      cv.open = open.length;
      cv.need = ins.length;
      cv.wait = open.length - ins.length;
      cv.side = cv.need ? "need" : cv.open ? "wait" : "done";
      cv.days = open.reduce((m, l) => Math.max(m, l.days || 0), 0);
      cv.latest = cv.all[cv.all.length - 1];
      cv.act = oldest(ins) || oldest(open) || cv.latest;
      cv.last = cv.all.reduce((m, l) => {
        const t = (l.last && l.last.at) || l.updated_at || l.at || "";
        return t > m ? t : m;
      }, "");
    }
    out.sort((a, b) => (b.open ? 1 : 0) - (a.open ? 1 : 0) || (a.open ? b.days - a.days : 0)
      || String(b.last).localeCompare(String(a.last)));
    return out;
  }

  /* Письма, из которых строится список: у объекта — его, у «всех» — лента. */
  function ctxLetters() {
    if (!SITE) return LIST && !LIST.error ? LIST.feed || [] : null;
    const p = pageOk();
    return p ? p.letters || [] : null;
  }

  const FILTERS = [["open", "Открытые", "Все открытые письма"], ["need", "Ответить", "Надо ответить: пришли к нам"],
    ["wait", "Ждём", "Ждём ответа: отправили мы"], ["all", "Все", "Все письма, и закрытые"]];
  const passes = (cv, f) => (f === "all" ? true : f === "open" ? cv.open > 0 : f === "need" ? cv.need > 0 : cv.wait > 0);

  function lastLine(cv) {
    const x = cv.latest;
    if (cv.all.length > 1 && x !== cv.head) {
      return `<span class="lx-conv-l"><span class="lx-l-dir ${x.direction}">${x.direction === "in" ? ICO.in
        : ICO.out}</span>${esc(x.subject)}<em>${esc(dm(x.sent_at))}</em></span>`;
    }
    const l = cv.act.last || cv.head.last;
    if (!l) return "";
    return `<span class="lx-conv-l"><b>${esc(l.author)}</b>${esc(l.kind === "file" ? "приложил файл"
      + (l.text ? " — " + l.text : "") : l.text)}<em>${esc(when(l.at))}</em></span>`;
  }

  function convRowHtml(cv, all) {
    const cur = VIEW === "letter" && cv.all.some((l) => l.id === LETTER);
    const h = cv.head, n = cv.all.length;
    const meta = [all && h.site_name ? `<span class="lx-conv-site">${esc(h.site_name)}</span>` : "",
      topicChip(h.topic), h.number ? "№ " + esc(h.number) : "", h.sent_at ? esc(dm(h.sent_at)) : "",
      n > 1 ? `<span class="lx-conv-n">${ICO.link}${letters(n)}</span>` : ""].filter(Boolean).join("<i>·</i>");
    return `<a href="#let/${esc(SITE || "all")}/${esc(cv.act.id)}" class="lx-conv ${cv.side}${cur ? " sel" : ""}"
      data-open="${esc(cv.act.id)}" data-lsite="${esc(cv.act.site_id || SITE)}">
      <span class="lx-conv-ic ${cv.side}" title="${SIDE[cv.side]}">${SIDE_IC[cv.side]}</span>
      <span class="lx-conv-b">
        <span class="lx-conv-t"><b>${esc(h.subject)}</b>${cv.side !== "done" ? `<span class="lx-age s${sev(cv.days)}"
          title="${SIDE[cv.side]} · ждёт ${days(cv.days)}">${age(cv.days)}</span>` : ""}</span>
        <span class="lx-conv-m">${meta}</span>
        ${lastLine(cv)}
      </span>
    </a>`;
  }

  /* Пустой список — по-человечески: всё отработано — так и сказать. */
  function emptyConvs(f, total) {
    if (!total) {
      return `<div class="lx-empty">${ICO.mail}<b>${SITE ? "Писем по объекту пока нет" : "Писем пока нет"}</b>
        <span>Нажмите «Письмо»: запишите, о чём оно, кому и когда ушло, и приложите файл или фото.
        Ответ заводят тоже письмом — письма встанут в переписку.</span></div>`;
    }
    const txt = { open: "Открытых писем нет — всё отработано", need: "Писем, на которые надо ответить, нет",
      wait: "Ответа ни от кого не ждём", all: "Писем нет" }[f];
    return `<div class="lx-empty good">${ICO.check}<b>${txt}</b>${f !== "all"
      ? `<button type="button" class="lnk" data-filter="all">Показать все</button>` : ""}</div>`;
  }

  function convListHtml() {
    const list = ctxLetters();
    if (!list) {
      const err = SITE ? PAGE && PAGE.error && PAGE : LIST && LIST.error && LIST;
      return err ? failed(err) : loading();
    }
    if (LQ_CTX !== ctxId()) { LQ = ""; SRES = null; LQ_CTX = ctxId(); }
    if (LQ.trim().length >= 2) return foundHtml(SRES, !SITE);
    const convs = convsOf(list);
    const vis = convs.filter((cv) => passes(cv, FILTER));
    if (!vis.length) return emptyConvs(FILTER, convs.length);
    return vis.map((cv) => convRowHtml(cv, !SITE)).join("");
  }

  function filtersHtml() {
    const list = ctxLetters() || [];
    const convs = convsOf(list);
    const n = (f) => convs.reduce((m, cv) => m + (f === "all" ? cv.all.length : cv[f]), 0);
    return `<div class="lx-chips" role="tablist" aria-label="Какие письма показать">${FILTERS.map(([f, t, tip]) => {
      const c = n(f);
      return `<button type="button" role="tab" class="lx-chip ${f}${FILTER === f ? " on" : ""}" data-filter="${f}"
        aria-selected="${FILTER === f}" title="${tip}">${t}${f !== "all" || SITE ? `<i>${c}</i>` : ""}</button>`;
    }).join("")}</div>`;
  }

  function ctxTitle() {
    if (!SITE) return { name: "Все объекты", sub: "переписка за последний месяц и всё открытое" };
    const p = pageOk();
    const r = ((LIST && LIST.rows) || []).find((x) => x.id === SITE);
    const s = (p && p.site) || r || {};
    return { name: s.name || "Объект", sub: [s.customer, s.address].filter(Boolean).join(" · ") };
  }

  function p2Html() {
    const t = ctxTitle(), m = mode();
    return `
      <section class="lx-p2">
        <div class="lx-p2-h">
          ${m === "mid" ? `<div class="lx-ctxw"><button type="button" class="lx-ctx" id="lxCtx" aria-expanded="${CTXPOP}">
              <span class="lx-ctx-ic">${SITE ? ICO.site : ICO.inbox}</span><span class="lx-ctx-t"><b>${esc(t.name)}</b>${
              t.sub ? `<i>${esc(t.sub)}</i>` : ""}</span>${ICO.chev}</button>
              ${CTXPOP ? `<div class="lx-ctxpop" id="lxObjs" data-keep>${objectsListHtml(SITE)}</div>` : ""}</div>`
            : `<div class="lx-p2-t"><b>${esc(t.name)}</b>${t.sub ? `<i title="${esc(t.sub)}">${esc(t.sub)}</i>` : ""}</div>`}
        </div>
        <div class="lx-p2-tools">
          <label class="lx-find">${ICO.find}<input id="lxLQ" type="search" placeholder="${SITE ? "Найти письмо в объекте"
            : "Найти письмо: тема, №, дата"}" value="${esc(LQ_CTX === ctxId() ? LQ : "")}" autocomplete="off"
            title="По теме, номеру, дате, записям журнала и файлам"></label>
          ${SITE ? `<button type="button" class="lx-tool${VIEW === "docs" ? " on" : ""}" id="lxFiles" title="Файлы объекта">${
            ICO.folder}<span>Файлы</span></button>` : ""}
          ${m === "mid" && canReg() ? `<button type="button" class="lx-tool" id="lxReg" title="Реестр корреспонденции">${
            ICO.book}<span>Реестр</span></button>` : ""}
        </div>
        ${LQ_CTX === ctxId() && LQ.trim().length >= 2 ? "" : filtersHtml()}
        <div class="lx-convs" id="lxConvs" data-keep>${convListHtml()}</div>
      </section>`;
  }

  /* ── правая колонка без письма ─────────────────────────────── */
  function kpiHtml(k) {
    return `<div class="lx-kpis k${k.length}">${k.map((x) => `<${x.f ? "button type=\"button\"" : "div"} class="lx-kpi ${x.cls}"${
      x.f ? ` data-filter="${x.f}"` : ""}><span class="lx-kpi-ic">${x.ic}</span><b>${x.n}</b><span>${x.t}</span>${
      x.s ? `<i>${x.s}</i>` : ""}</${x.f ? "button" : "div"}>`).join("")}</div>`;
  }

  function dashHtml() {
    if (!LIST || LIST.error) return LIST ? failed(LIST) : loading();
    const st = LIST.stats || {};
    const feed = LIST.feed || [];
    const oldest = (dir) => feed.filter((l) => l.status === "open" && l.direction === dir)
      .reduce((m, l) => Math.max(m, l.days || 0), 0);
    const calm = !st.open;
    return `
      <div class="lx-dash">
        <div class="lx-hero${calm ? " calm" : ""}">
          <span class="lx-hero-ic">${calm ? ICO.check : ICO.inbox}</span>
          <h2>${calm ? "Все письма отработаны" : "Письма по всем объектам"}</h2>
          <p>${calm ? "Открытых писем нет. Новые письма вносят через реестр корреспонденции."
            : "Выберите переписку слева — она откроется здесь."}</p>
        </div>
        ${kpiHtml([
          { cls: "need", ic: ICO.reply, n: st.need || 0, t: "Надо ответить", s: st.need ? "старшему " + age(oldest("in")) : "всё отвечено", f: "need" },
          { cls: "wait", ic: ICO.wait, n: st.wait || 0, t: "Ждём ответа", s: st.wait ? "старшему " + age(oldest("out")) : "никого не ждём", f: "wait" },
          { cls: "hot", ic: ICO.fire, n: st.over14 || 0, t: "Дольше двух недель", s: st.over14 ? "пора напомнить" : "таких нет" },
          { cls: "ok", ic: ICO.check, n: st.closed30 || 0, t: "Закрыто за месяц", s: st.closed30 ? "отработано" : "" },
        ])}
      </div>`;
  }

  /* Файлы объекта — те же папки, что во вкладке «Файлы» в «Объектах»
     (заказчик, 28.09.2026). Первой — «1. Проекты»: проект и изменения. */
  const inside = (n) => (n ? `внутри: ${n}` : "пусто");
  function projSub(d) {
    const docs = d.docs || [];
    const last = docs[docs.length - 1];
    return docs.length ? `${docs.length} ${plural(docs.length, "файл", "файла", "файлов")} · последнее: ${
      esc(last.title || last.filename)}, ${esc(when(last.at))}` : "проект ещё не загружен";
  }
  function foldersHtml(d) {
    const folders = d.folders || [];
    return `
      <div class="lt-folders">
        <div class="lt-fold pin">
          <button type="button" class="lt-fold-go" data-lfolder="@project"
            title="Проект, по которому строим, и все изменения к нему">
            <span class="lt-fold-ico">${ICO.plan}</span>
            <span class="lt-fold-main"><b>${esc(d.project_folder || "1. Проекты")}</b><i>${projSub(d)}</i></span>
          </button>
        </div>
        ${folders.map((f) => `
        <div class="lt-fold">
          <button type="button" class="lt-fold-go" data-lfolder="${esc(f.id)}"
            title="Открыть папку — внутри её можно и переименовать">
            <span class="lt-fold-ico">${ICO.folder}</span>
            <span class="lt-fold-main"><b>${esc(f.name)}</b><i>${inside(f.items)}</i></span>
          </button>
          ${f.can_edit ? `<button type="button" class="lt-fold-del" data-lfdel="${esc(f.id)}"
            title="Убрать папку в корзину" aria-label="Убрать папку «${esc(f.name)}»">${ICO.trash}</button>` : ""}
        </div>`).join("")}
      </div>`;
  }

  function siteHomeHtml() {
    const d = pageOk();
    if (!d) return PAGE && PAGE.error ? failed(PAGE) : loading();
    const s = d.site, ls = d.letters || [];
    const open = ls.filter((l) => l.status === "open");
    const need = open.filter((l) => l.direction === "in");
    const wait = open.length - need.length;
    const oldest = (xs) => xs.reduce((m, l) => Math.max(m, l.days || 0), 0);
    return `
      <div class="lx-dash lx-home">
        <div class="lx-home-h">
          <span class="lx-home-ic">${ICO.site}</span>
          <div><h2>${esc(s.name)}</h2>${s.customer || s.address ? `<i>${esc([s.customer, s.address]
            .filter(Boolean).join(" · "))}</i>` : ""}</div>
        </div>
        ${kpiHtml([
          { cls: "need", ic: ICO.reply, n: need.length, t: "Надо ответить", s: need.length ? "старшему " + age(oldest(need)) : "всё отвечено", f: "need" },
          { cls: "wait", ic: ICO.wait, n: wait, t: "Ждём ответа", s: wait ? "старшему " + age(oldest(open.filter((l) => l.direction === "out"))) : "никого не ждём", f: "wait" },
          { cls: "ok", ic: ICO.check, n: ls.length - open.length, t: "Закрыто", s: `всего ${letters(ls.length)}`, f: "all" },
        ])}
        ${ordersHtml(d, true)}
        <section class="lx-sec">
          <div class="lx-sec-h"><span>${ICO.folder}Файлы объекта</span><i>${(d.folders || []).length + 1}</i>
            <span class="grow"></span>
            <button type="button" class="lnk" id="ltFolderNew">${ICO.plus}Папка</button>
            <button type="button" class="lnk" id="ltFilesAll">Все файлы${ICO.next}</button>
          </div>
          ${queueHtml()}
          ${foldersHtml(d)}
        </section>
      </div>`;
  }

  /* Письмо из реестра (06.10.2026): номер по журналу, компания, от кого
     или кому, кто зарегистрировал и кому передали — и сканы из реестра.
     Шапку такого письма правят в реестре; тем, кто его ведёт, — кнопка. */
  const cfileChip = (f) => `<button type="button" class="lt-chip" data-cfile="${esc(f.id)}"
    data-name="${esc(f.name)}" data-preview="${f.preview ? 1 : ""}">${ICO.file}<b>${esc(f.name)}</b><i>${size(f.size)}</i></button>`;
  /* Как документ пришёл или ушёл — для суда (заказчик, 12.10.2026). */
  function viaText(r) {
    if (!r.via) return "";
    const n = r.via_note || "", how = VIA_HOW[r.via] || r.via_name;
    // У прочего направления нет — пришло оно или ушло, говорит само дело.
    const head = r.kind === "in" || r.kind === "claim" ? "Получено " + how : r.kind === "out" ? "Отправлено " + how
      : how.replace(/^./, (c) => c.toUpperCase());
    const tail = !n ? "" : r.via === "email" ? (r.kind === "other" ? ": " : " на ") + n
      : r.via === "cdek" ? ", накладная " + n : r.via === "post" ? ", ШПИ " + n : " — " + n;
    return head + tail;
  }
  function regLineHtml(r, can) {
    const who = [(r.kind === "in" || r.kind === "claim") && r.party ? "от " + r.party : r.party ? "кому: " + r.party : "",
      r.author_name ? "автор " + r.author_name : "", r.handed_to ? "передано: " + r.handed_to : "",
      r.reg_by ? "зарегистрировал " + r.reg_by : ""].filter(Boolean);
    const via = viaText(r);
    return `
      <div class="lx-reg">
        <div class="lx-reg-h">
          <span class="lx-reg-no">${ICO.book}<b>${esc(r.label.replace(/^./, (c) => c.toUpperCase()))}</b>${
            r.reg_date ? ` от ${esc(day(r.reg_date))}` : ""}${r.org_name ? `<i>${esc(r.org_name)}</i>` : ""}</span>
          ${can ? `<button type="button" class="lnk" id="ltRegOpen">Открыть в реестре</button>` : ""}
        </div>
        ${who.length ? `<div class="lx-reg-who">${who.map(esc).join(" · ")}</div>` : ""}
        ${via ? `<div class="lx-reg-via">${ICO.mail}<span>${esc(via)}</span></div>` : ""}
        ${r.files && r.files.length ? `<div class="lx-reg-files">${r.files.map(cfileChip).join("")}</div>` : ""}
      </div>`;
  }

  /* Приказы и прочие документы по объекту из реестра — мастеру на
     странице объекта (06.10.2026, «Прочее» — с 12.10.2026). Пустой блок на
     компьютере тоже показываем: иначе его не найти, пока к объекту не
     привязан первый приказ (заказчик искал, 06.10.2026). */
  function ordersHtml(d, always) {
    const os = (d && d.orders) || [];
    if (!os.length && !always) return "";
    const sub = (o) => [o.kind === "other" ? o.party : "", o.author_name
      ? (o.kind === "order" ? "инициатор " : "автор ") + o.author_name : "", viaText(o), o.org_name].filter(Boolean);
    return `
      <section class="lx-sec lx-orders">
        <div class="lx-sec-h"><span>${ICO.order}Приказы и документы по объекту</span><i>${os.length}</i></div>
        ${os.length ? "" : `<div class="lx-ord-none">Приказов и документов по этому объекту пока нет. Здесь появятся
          приказы и прочие документы из реестра корреспонденции, привязанные к объекту.</div>`}
        ${os.length ? `<div class="lx-ord-l">${os.map((o) => `
          <div class="lx-ord">
            <span class="lx-ord-no">${o.kind === "other" ? "Док." : "Приказ"} № ${esc(o.number)}<i>${esc(day(o.reg_date))}</i></span>
            <span class="lx-ord-b"><b>${esc(o.subject)}${topicChip(o.topic)}</b>${sub(o).length
              ? `<i>${esc(sub(o).join(" · "))}</i>` : ""}
              ${o.files.length ? `<span class="lx-ord-f">${o.files.map(cfileChip).join("")}</span>` : ""}</span>
          </div>`).join("")}</div>` : ""}
      </section>`;
  }

  /* ── письмо: правая колонка / экран телефона ───────────────── */
  function readHtml(bar) {
    const d = cardOk();
    if (!d) return CARD && CARD.error ? failed(CARD) : loading();
    const l = d.letter, side = sideOf(l);
    const closed = (d.items || []).filter((x) => x.kind === "status").pop();
    const why = side === "done" && closed ? closed.text.replace(/^Закрыто:?\s*/, "") : "";
    const stTxt = side === "need" ? `пришло ${l.days ? days(l.days) + " назад" : "сегодня"}, ответа от нас нет`
      : side === "wait" ? `отправили ${l.days ? days(l.days) + " назад" : "сегодня"}, ответа пока нет`
      : `${l.closed_at ? "закрыто " + esc(when(l.closed_at)) : "закрыто"}${why ? " · " + esc(why) : ""}`;
    const showSite = !bar && (!SITE || SITE !== l.site_id) && d.site;
    const r = d.reg;
    const facts = `
          <div class="lx-meta">
            <span class="lx-meta-dir ${l.direction}">${l.direction === "in" ? ICO.in : ICO.out}${dirText(l.direction)}</span>
            ${topicChip(l.topic)}
            ${r?.kind === "claim" ? `<span class="lx-tp rg-claim-badge">Претензия</span>` : ""}
            ${r?.reg_channel_name ? `<span>${esc(r.reg_channel_name)}</span>` : ""}
            ${r ? "" : l.number ? `<span>№ ${esc(l.number)}</span>` : ""}
            ${r ? "" : l.sent_at ? `<span>от ${esc(day(l.sent_at))}</span>` : ""}
            ${orgsAll().length > 1 && orgOf(l.org_id) ? `<span class="lx-meta-org" title="${esc(orgOf(l.org_id).name)}">${
              esc(nice(orgOf(l.org_id).label))}</span>` : ""}
            <span class="lx-meta-by">завёл ${esc(l.author)}, ${esc(when(l.at))}</span>
            ${!r && d.can_reg ? `<button type="button" class="lnk lx-reg-add" id="ltRegNew"
              title="Дать письму номер в журнале входящих или исходящих">${ICO.book}Зарегистрировать</button>` : ""}
          </div>
          ${r ? regLineHtml(r, d.can_reg) : ""}
          <div class="lx-status ${side}">
            <span class="lx-status-ic">${SIDE_IC[side]}</span>
            <span class="lx-status-t"><b>${SIDE[side]}${side !== "done" && l.days ? ` · <span class="lx-age s${sev(l.days)}">${
              days(l.days)}</span>` : ""}</b><i>${stTxt}</i></span>
            <span class="lx-status-acts">
              ${canReg() ? `<button type="button" class="lx-act" id="ltReply"
                title="Зарегистрировать ответ в реестре — он встанет в переписку">${ICO.reply}<span>Ответ письмом</span></button>` : ""}
              ${l.status === "open"
                ? `<button type="button" class="lx-act prim" id="ltClose">${ICO.check}<span>Закрыть</span></button>`
                : `<button type="button" class="lx-act" id="ltReopen">${ICO.undo}<span>Открыть снова</span></button>`}
            </span>
          </div>`;
    return `
      <div class="lx-read">
        ${bar ? "" : `<div class="lx-read-h">
          <div class="lx-read-top">
            ${showSite ? `<button type="button" class="lx-crumb" id="ltSite" data-ctx="${esc(l.site_id)}">${ICO.site}<span>${
              esc(d.site.name)}</span></button>` : `<span class="lx-crumb-sp"></span>`}
            ${l.can_edit ? `<button type="button" class="lx-ib" id="ltEdit" title="Изменить письмо"
              aria-label="Изменить письмо">${ICO.edit}</button>` : ""}
            <button type="button" class="lx-ib" id="ltBack" title="Закрыть письмо (Esc)" aria-label="Закрыть письмо">×</button>
          </div>
          <h2 class="lx-subj">${esc(l.subject)}</h2>
          ${facts}
        </div>`}
        <div class="lx-read-b" id="ltFeed" data-keep>
          ${bar ? facts : ""}
          ${chainHtml(d)}
          <section class="lx-sec lx-log">
            <div class="lx-sec-h"><span>${ICO.edit}Журнал</span><i>${(d.items || []).filter((x) =>
              x.kind === "note" || x.kind === "file").length || ""}</i></div>
            <div class="lt-feed">
              ${feedStart(l)}
              ${(d.items || []).map(itemHtml).join("")}
            </div>
            ${queueHtml()}
          </section>
        </div>
        ${composeHtml()}
      </div>`;
  }

  /* Переписка лентой: все письма цепочки по датам, это — подсвечено.
     Под лентой — связи: на что письмо отвечает и что отвечает на него,
     с «Изменить» и «Отвязать» (заказчик, 28.09.2026: мастер, заводя
     письмо, мог не увидеть, что оно — ответ; инженер свяжет потом). */
  const shortOf = (l) => (l.number ? "№ " + l.number + (l.sent_at ? " от " + day(l.sent_at).slice(0, 5) : "")
    : "«" + (l.subject.length > 32 ? l.subject.slice(0, 31) + "…" : l.subject) + "»");
  const briefOf = (l) => `${esc(shortOf(l))}${l.number ? " · " + esc(l.subject) : ""}`;

  function chainHtml(d) {
    const l = d.letter, chain = d.chain || [];
    const kids = (d.site_letters || []).filter((x) => x.reply_to === l.id).sort(chrono);
    const one = chain.length < 2;
    const open = CHAIN_OPEN === null ? !narrow() : CHAIN_OPEN;
    const at = chain.findIndex((x) => x.id === l.id) + 1;
    const chip = (x, dir) => `<a href="#let/${esc(ctxId())}/${esc(x.id)}" data-sib="${esc(x.id)}"
      title="${esc(x.subject)}">${dir === "up" ? ICO.reply : ICO.kid}<span>${briefOf(x)}</span></a>`;
    const links = `
      <div class="lx-links">
        <div class="lx-link-row">
          <span class="lx-link-k">Ответ на</span>
          <span class="lx-link-v">
            ${d.parent ? `<span class="lt-gchip">${chip(d.parent, "up")}</span>
              <button type="button" class="lnk" id="ltLink">Изменить</button>
              <button type="button" class="lnk lt-warn" id="ltUnlink">Отвязать</button>`
            : `<button type="button" class="lnk" id="ltLink">${ICO.link}Указать, на какое письмо это ответ</button>`}
          </span>
        </div>
        <div class="lx-link-row">
          <span class="lx-link-k">Ответы</span>
          <span class="lx-link-v">
            ${kids.map((x) => `<span class="lt-gchip lt-kid">${chip(x, "down")}<button type="button"
              class="lt-x" data-unkid="${esc(x.id)}" title="Отвязать: это письмо — не ответ на это"
              aria-label="Отвязать">×</button></span>`).join("")}
            <button type="button" class="lnk" id="ltKids">${kids.length ? "Изменить"
              : ICO.link + "Привязать письма, которые отвечают на это"}</button>
          </span>
        </div>
      </div>`;
    if (one && !d.parent && !kids.length) {
      return `<div class="lx-solo">${ICO.link}<span>Письмо само по себе, не в переписке.</span>
        <button type="button" class="lnk" id="ltLink">Это ответ на…</button>
        <button type="button" class="lnk" id="ltKids">Привязать ответы</button></div>`;
    }
    if (one) {
      return `<section class="lx-sec lx-chain one">
        <div class="lx-sec-h"><span>${ICO.link}Переписка</span></div>${links}</section>`;
    }
    const th = d.thread && d.thread.length ? d.thread : chain;
    const allOpen = th.every((x) => x.id === l.id || !THREAD_SHUT.has(x.id));
    return `
      <section class="lx-sec lx-chain lx-thread${open ? " on" : ""}">
        <div class="lx-chain-bar">
          <button type="button" class="lx-sec-h lx-chain-h" id="ltChain" aria-expanded="${open}">
            <span>${ICO.link}Переписка</span><i>${letters(chain.length)}${at ? `, это ${at}-е` : ""}</i>
            <span class="grow"></span>${ICO.chev}
          </button>
          <button type="button" class="lnk lx-th-all" id="ltThAll">${allOpen ? "Свернуть всё" : "Развернуть всё"}</button>
        </div>
        <div class="lx-th-l">${th.map((x) => threadCardHtml(x, l, th)).join("")}</div>
        ${links}
      </section>`;
  }

  /* Письмо в переписке карточкой (заказчик, 09.10.2026: «видно, что писем
     два, а второго не видно — ни скана, ни записей; из связки нужно
     нормально попадать и в первое письмо, и в ответ, а там бывает целая
     цепочка запросов и ответов с комментариями»). Что за письмо и на что
     отвечает, сканы и файлы — всегда на виду; записи и закрытия —
     раскрываются на месте. Открытое сейчас письмо отмечено, его журнал —
     ниже, со строкой для записи. */
  function threadCardHtml(x, l, th) {
    const cur = x.id === l.id, sd = sideOf(x);
    const r = x.reg;
    const up_ = th.find((y) => y.id === x.reply_to);
    const kids = th.filter((y) => y.reply_to === x.id);
    const items = x.items || [];
    const files = items.filter((it) => it.kind === "file" && it.file);
    const notes = items.filter((it) => it.kind === "note" || it.kind === "status");
    const shut = !cur && THREAD_SHUT.has(x.id);
    const no = r ? r.label.replace(/^./, (ch) => ch.toUpperCase()) + (r.reg_date ? " от " + day(r.reg_date) : "")
      : [x.number ? "№ " + x.number : "", x.sent_at ? "от " + day(x.sent_at) : ""].filter(Boolean).join(" ");
    const who = r ? (r.kind === "in" && r.party ? "от " + r.party : r.party ? "кому: " + r.party : "") : "";
    const sub_ = [up_ ? `ответ на ${shortOf(up_)}` : "", kids.length ? `ответов: ${kids.length}` : "", who,
      x.author ? "завёл " + x.author : ""].filter(Boolean);
    const scans = r && r.files ? r.files : [];
    return `
      <article class="lx-th ${sd}${cur ? " cur" : ""}${shut ? " shut" : ""}" data-th="${esc(x.id)}">
        <span class="lx-th-dot" aria-hidden="true"></span>
        <div class="lx-th-c">
          <button type="button" class="lx-th-h"${cur ? " disabled" : ` data-thtog="${esc(x.id)}" aria-expanded="${!shut}"`}>
            <span class="lx-th-dir ${x.direction}">${x.direction === "in" ? ICO.in : ICO.out}${
              x.direction === "in" ? "Входящее" : "Исходящее"}</span>
            ${no ? `<span class="lx-th-no">${esc(no)}</span>` : ""}
            <span class="grow"></span>
            <span class="lx-th-st ${sd}">${sd === "done" ? ICO.check + "Закрыто" : `${SIDE[sd]} · ${age(x.days || 0)}`}</span>
            ${cur ? `<span class="lx-th-here">это письмо</span>` : ICO.chev}
          </button>
          <b class="lx-th-s">${esc(x.subject)}</b>
          ${sub_.length ? `<div class="lx-th-sub">${sub_.map(esc).join(" · ")}</div>` : ""}
          ${scans.length || files.length ? `<div class="lx-th-files">${scans.map(cfileChip).join("")}${files.map((it) =>
            `<button type="button" class="lt-chip" data-file="${esc(it.file.id)}" data-name="${esc(it.file.name)}"
              data-preview="${it.file.preview ? 1 : ""}" title="${esc(it.text || it.file.name)}">${ICO.file}<b>${
              esc(it.file.name)}</b><i>${size(it.file.size)}</i></button>`).join("")}</div>`
            : r ? `<div class="lx-th-nof">скана в реестре нет</div>` : ""}
          ${cur ? (notes.length ? `<div class="lx-th-more">записи этого письма — ниже, в журнале</div>` : "")
            : notes.length ? (shut ? `<button type="button" class="lnk lx-th-more" data-thtog="${esc(x.id)}">${ICO.edit}Записи: ${
              notes.length} — показать</button>` : `<ol class="lx-th-notes">${notes.map((it) => `
              <li class="${it.kind}"><span class="lx-th-who">${esc(it.author)}<time>${esc(stamp(it.at))}</time></span>
                <span class="lx-th-t">${esc(it.text)}</span></li>`).join("")}</ol>`)
            : ""}
          ${cur ? "" : `<div class="lx-th-acts"><a href="#let/${esc(ctxId())}/${esc(x.id)}" class="lnk lx-th-go"
            data-sib="${esc(x.id)}">Открыть это письмо${ICO.next}</a></div>`}
        </div>
      </article>`;
  }

  /* Первая строка журнала — кто завёл письмо и когда: с неё начинается
     история, и без неё непонятно, откуда письмо взялось. */
  const feedStart = (l) => `
    <div class="lt-item sys">
      <span class="lt-av">${ICO.start}</span>
      <div class="lt-item-b">
        <div class="lt-item-h"><b>${esc(l.author)}</b><time>${esc(stamp(l.at))}</time></div>
        <p class="lt-sys">Завёл письмо</p>
      </div>
    </div>`;

  /* Запись журнала. Свою запись и подпись к файлу можно поправить
     (заказчик, 28.09.2026: ошибся — мог только удалить); время записи
     прежнее, рядом — «изменено». Служебные записи пишутся сами. */
  function itemHtml(it) {
    const editable = it.can_edit && (it.kind === "note" || it.kind === "file");
    const editing = editable && EDIT_ITEM === it.id;
    const acts = it.can_edit && !editing ? `${editable ? `<button type="button" class="ico lt-ed"
      data-editem="${esc(it.id)}" title="Изменить запись">${ICO.edit}</button>` : ""}<button type="button"
      class="ico warn lt-del" data-delitem="${esc(it.id)}" title="Убрать запись">${ICO.trash}</button>` : "";
    const editor = editing ? `
      <div class="lt-ied">
        <textarea id="ltItemEd" rows="3" placeholder="${it.kind === "file" ? "Подпись к файлу — можно и без неё"
          : "Что сделано по письму"}">${esc(EDIT_TEXT)}</textarea>
        <div class="lt-ied-acts">
          <button type="button" class="btn-brand sm" data-itsave>Сохранить</button>
          <button type="button" class="btn-ghost sm" data-itcancel>Отмена</button>
          <i>Ctrl+Enter — сохранить, Esc — отмена</i>
        </div>
      </div>` : "";
    let body = "";
    if (it.kind === "file" && it.file) {
      body = `${editing ? editor : it.text ? `<p>${esc(it.text)}</p>` : ""}
        <button type="button" class="lt-chip" data-file="${esc(it.file.id)}"
          data-name="${esc(it.file.name)}" data-preview="${it.file.preview ? 1 : ""}">
          ${ICO.file}<b>${esc(it.file.name)}</b><i>${size(it.file.size)}</i></button>`;
    } else if (it.kind === "status" || it.kind === "move" || it.kind === "link" || it.kind === "reg") {
      body = `<p class="lt-sys">${esc(it.text)}</p>`;
    } else {
      body = editing ? editor : `<p>${esc(it.text)}</p>`;
    }
    const person = !(it.kind === "status" || it.kind === "move" || it.kind === "link" || it.kind === "reg");
    const av = it.kind === "status" ? (it.text.startsWith("Закрыто") ? ICO.check : ICO.undo)
      : it.kind === "move" ? ICO.folder : it.kind === "link" ? ICO.link : it.kind === "reg" ? ICO.book
      : initial(it.author);
    return `
      <div class="lt-item ${esc(it.kind)}${editing ? " editing" : ""}">
        <span class="lt-av${person ? " who" : ""}"${person ? ` style="--h:${hue(it.author)}"` : ""}>${av}</span>
        <div class="lt-item-b">
          <div class="lt-item-h"><b>${esc(it.author)}</b><time>${esc(stamp(it.at))}</time>${
            it.edited_at ? `<em class="lt-edited" title="Изменено ${esc(stamp(it.edited_at))}">изменено</em>` : ""}${acts}</div>
          ${body}
        </div>
      </div>`;
  }

  /* Поле записи прижато к низу, как в мессенджере: открыл письмо — и
     сразу пишешь, что сделал. Скрепка прикладывает файл или фото; если в
     поле уже есть текст, он станет подписью к файлу. */
  const draftKey = () => "lt-draft-" + LETTER;
  function draft() {
    try { return sessionStorage.getItem(draftKey()) || ""; } catch (e) { return ""; }
  }
  function saveDraft(v) {
    try {
      if (v) sessionStorage.setItem(draftKey(), v); else sessionStorage.removeItem(draftKey());
    } catch (e) { /* приватный режим */ }
  }
  const composeHtml = () => `
    <div class="lt-compose">
      <label class="lt-attach" title="Приложить файл или фото">${ICO.clip}
        <input type="file" id="ltPick" multiple hidden></label>
      <textarea id="ltText" rows="1" placeholder="${narrow() ? "Что сделано…" : "Что сделано по письму…"}"
        >${esc(draft())}</textarea>
      <button type="button" class="btn-brand lt-send" id="ltSend" aria-label="Записать"
        title="Записать · Ctrl+Enter">${ICO.send}<span>Записать</span></button>
    </div>`;

  /* ── раскладки целиком ─────────────────────────────────────── */
  function splitHtml() {
    const m = mode();
    const right = VIEW === "letter" ? readHtml(false) : SITE ? siteHomeHtml() : dashHtml();
    if (VIEW === "docs") {
      const t = ctxTitle();
      return `
        <div class="pg lx lx-split ${m}">
          ${m === "wide" ? p1Html() : ""}
          <section class="lx-files">
            <div class="lx-files-h">
              <button type="button" class="lx-ib" id="ltBack" title="К письмам объекта" aria-label="К письмам объекта">${ICO.back}</button>
              <div class="lx-p2-t"><b>Файлы объекта</b><i>${esc(t.name)}</i></div>
            </div>
            <div class="fl-host lt-fl" id="ltFiles"></div>
          </section>
        </div>`;
    }
    return `
      <div class="pg lx lx-split ${m}">
        ${m === "wide" ? p1Html() : ""}
        ${p2Html()}
        <section class="lx-p3${VIEW === "letter" ? " reading" : ""}">${right}</section>
      </div>`;
  }

  /* Лестница экранов: узкое окно и телефон. */
  function oneHtml() {
    if (VIEW === "letter") {
      const d = cardOk();
      const l = d ? d.letter : null;
      return `
        <div class="pg lx lx-one lt-card">
          <div class="pg-head strip lt-top">
            <button type="button" class="pg-back" id="ltBack" title="Назад" aria-label="Назад">${ICO.back}</button>
            <div class="pg-h1 lt-h1">
              ${d && d.site ? `<button type="button" class="lt-crumb" id="ltSite">${esc(d.site.name)}</button>` : ""}
              <h2>${l ? esc(l.subject) : "Письмо"}</h2>
            </div>
            ${l && l.can_edit ? `<button type="button" class="ico lt-edit" id="ltEdit" title="Изменить письмо">${ICO.edit}</button>` : ""}
          </div>
          ${readHtml(true)}
        </div>`;
    }
    if (VIEW === "list") {
      const t = Q.trim().length >= 2;
      return `
        <div class="pg lx lx-one">
          <div class="pg-head lt-head">
            <label class="pg-find lt-find">${ICO.find}<input id="lxQ" type="search"
              placeholder="Найти объект или письмо" value="${esc(Q)}" autocomplete="off"
              title="Объект — по названию, заказчику, адресу; письмо — по теме, номеру, дате, записям и файлам"></label>
            ${canReg() ? `<button type="button" class="btn-ghost lt-regb" id="lxReg" title="Реестр корреспонденции"
              aria-label="Реестр корреспонденции">${ICO.book}</button>` : ""}
            <button type="button" class="btn-brand" id="lxNewSite">${ICO.plus}<span>Объект</span></button>
          </div>
          <div class="pg-body lx-body" id="lxObjs" data-keep>
            ${objectsListHtml(null)}
            ${t ? `<div class="lx-h">Письма</div>${foundHtml(GRES, true, Q)}` : ""}
          </div>
        </div>`;
    }
    const t = ctxTitle();
    const docs = VIEW === "docs";
    return `
      <div class="pg lx lx-one">
        <div class="pg-head strip lt-top">
          <button type="button" class="pg-back" id="ltBack" title="Все объекты" aria-label="Все объекты">${ICO.back}</button>
          <div class="pg-h1 lt-h1"><h2>${esc(t.name)}</h2>${t.sub ? `<i>${esc(t.sub)}</i>` : ""}</div>
        </div>
        ${SITE ? `<div class="lx-seg2" role="tablist">
          <button type="button" role="tab" class="${docs ? "" : "on"}" id="lxTabL" aria-selected="${!docs}">${ICO.mail}Письма</button>
          <button type="button" role="tab" class="${docs ? "on" : ""}" id="lxFiles" aria-selected="${docs}">${ICO.folder}Файлы</button>
        </div>` : ""}
        ${docs ? `<div class="fl-host lt-fl" id="ltFiles"></div>` : `
        <div class="pg-body lx-body" id="lxConvs" data-keep>
          <div class="lx-one-tools">
            <label class="lx-find">${ICO.find}<input id="lxLQ" type="search" placeholder="Найти письмо"
              value="${esc(LQ_CTX === ctxId() ? LQ : "")}" autocomplete="off"></label>
            ${LQ_CTX === ctxId() && LQ.trim().length >= 2 ? "" : filtersHtml()}
          </div>
          ${SITE && pageOk() && (PAGE.orders || []).length ? `<details class="lx-ord-d"${ORD_OPEN ? " open" : ""}>
            <summary>${ICO.order}<b>Приказы и документы</b><i>${PAGE.orders.length}</i>${ICO.chev}</summary>
            ${ordersHtml(PAGE)}</details>` : ""}
          ${convListHtml()}
        </div>`}
      </div>`;
  }

  /* ── поиск ─────────────────────────────────────────────────── */
  /* Подсветка найденного: слова запроса в тексте. */
  function hl(text, q) {
    const words = String(q || "").toLowerCase().split(/\s+/).filter((w) => w.length > 1);
    const out = esc(text);
    if (!words.length) return out;
    const rx = new RegExp("(" + words.map((w) => esc(w).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
      .join("|") + ")", "gi");
    return out.replace(rx, "<mark>$1</mark>");
  }

  function foundHtml(res, global, query) {
    const q = String(query !== undefined ? query : LQ).trim();
    if (!res || res.q !== q) return `<div class="lx-none">Ищем письма…</div>`;
    if (res.error) return `<div class="lx-none">Поиск не удался: ${esc(res.error)}</div>`;
    if (!res.rows.length) {
      return `<div class="lx-none">Писем не нашлось. Ищем по теме, номеру, дате (08.09.2026),
        записям журнала и именам файлов.</div>`;
    }
    return `<div class="lx-found-h">Нашлось писем: ${res.rows.length}${res.more ? "+" : ""}</div>${res.rows.map((l) => {
      const sd = sideOf(l);
      const hit = l.hit ? `<span class="lx-conv-l lx-hit"><b>${l.hit.kind === "file" ? "Файл"
        : l.hit.kind === "status" ? "Состояние" : "В журнале"}</b>${hl(l.hit.text, q)}</span>` : "";
      const meta = [global && l.site ? `<span class="lx-conv-site">${esc(l.site.name)}</span>` : "",
        l.number ? "№ " + hl(l.number, q) : "", l.sent_at ? esc(day(l.sent_at)) : "",
        l.parent ? `ответ на ${esc(shortOf(l.parent))}` : ""].filter(Boolean).join("<i>·</i>");
      const site = l.site_id || (l.site && l.site.id) || SITE;
      return `<a href="#let/${esc(SITE || "all")}/${esc(l.id)}" class="lx-conv ${sd}${VIEW === "letter" && l.id === LETTER
        ? " sel" : ""}" data-open="${esc(l.id)}" data-lsite="${esc(site)}">
        <span class="lx-conv-ic ${sd}">${SIDE_IC[sd]}</span>
        <span class="lx-conv-b">
          <span class="lx-conv-t"><b>${hl(l.subject, q)}</b>${sd !== "done" ? `<span class="lx-age s${sev(l.days || 0)}">${
            age(l.days || 0)}</span>` : ""}</span>
          <span class="lx-conv-m">${meta}</span>
          ${hit}
        </span>
      </a>`;
    }).join("")}`;
  }

  /* Поиск писем — на сервере, через четверть секунды после последней
     буквы. Ответ старого запроса новый не перебивает. */
  let searchT = 0, searchSeq = 0;
  function searchSoon(q, site, done) {
    clearTimeout(searchT);
    const s = q.trim();
    searchSeq++;
    if (s.length < 2) return;
    searchT = setTimeout(async () => {
      const seq = ++searchSeq;
      let res;
      try {
        res = await AUTH.api("GET", "/letters/search?" + new URLSearchParams(site ? { q: s, site }
          : ORGF ? { q: s, org: ORGF } : { q: s }));
      } catch (e) {
        res = { rows: [], error: e.message };
      }
      res.q = s;
      if (seq === searchSeq) done(res);
    }, 250);
  }

  /* ── загрузки ──────────────────────────────────────────────── */
  function queueHtml() {
    const live = QUEUE.filter((q) => q.state !== "ok"
      && (VIEW === "letter" ? q.letter === LETTER : q.site === SITE && !q.letter));
    if (!live.length) return "";
    return `<div class="lt-queue">${live.map((q) => `
      <div class="lt-q${q.state === "err" ? " bad" : ""}">
        <span class="lt-q-name">${esc(q.file.name)}</span>
        ${q.state === "err" ? `<span class="lt-q-err">${esc(q.error)}</span>` : `
        <span class="lt-q-bar"><i style="width:${q.file.size
          ? Math.round((q.loaded * 100) / q.file.size) : 0}%"></i></span>
        <span class="lt-q-st">${q.state === "wait" ? "в очереди"
          : size(q.loaded) + " из " + size(q.file.size)}</span>`}
      </div>`).join("")}
      ${live.some((q) => q.state === "err") ? `<button type="button" class="lnk"
        id="ltQClear">Скрыть ошибки</button>` : ""}</div>`;
  }

  function limits() {
    const src = cardOk() || (PAGE && !PAGE.error ? PAGE : {});
    return { max: src.max || 96 * 1024 * 1024, ext: src.ext || [] };
  }

  function enqueue(files, where) {
    const { max, ext } = limits();
    for (const file of files) {
      const q = Object.assign({ file, loaded: 0, state: "wait", error: "" }, where);
      const dot = file.name.lastIndexOf(".");
      const e = dot > 0 ? file.name.slice(dot).toLowerCase() : "";
      if (ext.length && !ext.includes(e)) {
        q.state = "err"; q.error = "такой формат не принимаем";
      } else if (file.size > max) {
        q.state = "err"; q.error = "больше " + size(max);
      } else if (!file.size) {
        q.state = "err"; q.error = "пустой файл";
      }
      QUEUE.push(q);
    }
    render();
    pump();
  }

  async function pump() {
    if (sending) return;
    const q = QUEUE.find((x) => x.state === "wait");
    if (!q) return;
    sending = true;
    q.state = "send";
    if (typeof FRESH === "object") FRESH.hold();
    try {
      await send(q);
      q.state = "ok";
    } catch (e) {
      q.state = "err";
      q.error = e.message;
    } finally {
      if (typeof FRESH === "object") FRESH.release();
      sending = false;
    }
    const here = VIEW === "letter" ? q.letter === LETTER : q.site === SITE && !q.letter;
    if (here) await refresh(); else render();
    pump();
  }

  function send(q) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/api/sites/" + encodeURIComponent(q.site) + "/documents");
      xhr.setRequestHeader("Authorization", "Bearer " + AUTH.token());
      // В заголовке HTTP допустим только latin-1: кириллицу кодируем.
      xhr.setRequestHeader("X-Doc-Name", encodeURIComponent(q.file.name));
      xhr.setRequestHeader("X-Doc-Kind", q.letter ? "letter" : "project");
      if (q.letter) xhr.setRequestHeader("X-Doc-Letter", q.letter);
      if (q.title) xhr.setRequestHeader("X-Doc-Title", encodeURIComponent(q.title));
      xhr.setRequestHeader("Content-Type", q.file.type || "application/octet-stream");
      let last = 0;
      xhr.upload.addEventListener("progress", (e) => {
        q.loaded = e.loaded;
        if (Date.now() - last > 400) { last = Date.now(); paintQueue(); }
      });
      xhr.addEventListener("load", () => {
        if (xhr.status >= 200 && xhr.status < 300) return resolve();
        let msg = "";
        try { msg = JSON.parse(xhr.responseText).error || ""; } catch (e) { /* не json */ }
        reject(new Error(msg || (xhr.status === 413
          ? "сервер не принял файл " + size(q.file.size) + ": слишком большой"
          : "ответ сервера " + xhr.status)));
      });
      xhr.addEventListener("error", () => reject(new Error("связь оборвалась")));
      xhr.send(q.file);
    });
  }

  function paintQueue() {
    const box = $l("#sec-let .lt-queue");
    if (!box) return render();
    const tmp = document.createElement("div");
    tmp.innerHTML = queueHtml();
    if (tmp.firstElementChild) box.replaceWith(tmp.firstElementChild);
  }

  /* ── обработчики ───────────────────────────────────────────── */
  const on = (host, sel, fn) => { const el = $l(sel, host); if (el) el.addEventListener("click", fn); };

  function wire(host) {
    on(host, "#ltBack", up);
    wireOrgs(host);
    on(host, "#lxReg", () => go("reg"));
    on(host, "#ltRegOpen", () => {
      const d = cardOk();
      if (d && d.reg && typeof REG === "object") REG.edit(d.reg.id, { onDone: () => refresh(), openLetter: openFromReg });
    });
    on(host, "#ltRegNew", () => {
      const d = cardOk();
      if (d && typeof REG === "object") REG.register(d.letter, () => refresh());
    });
    on(host, "#ltSite", () => {
      const s = lsite();
      if (split()) pickCtx(s); else up();
    });
    on(host, "#lxNewSite", newSite);
    on(host, "#ltReply", () => { const d = cardOk(); if (d) newLetter({ reply: d.letter }); });
    on(host, "#ltLink", relink);
    on(host, "#ltUnlink", () => { const d = cardOk(); if (d) unlink(d.letter, "up"); });
    on(host, "#ltKids", pickKids);
    host.querySelectorAll("[data-unkid]").forEach((b) => b.addEventListener("click", () => {
      const x = ((CARD && CARD.site_letters) || []).find((y) => y.id === b.dataset.unkid);
      if (x) unlink(x, "down");
    }));
    on(host, "#ltChain", (e) => {
      // Без перерисовки: та прокрутила бы журнал вниз, и раскрытое ушло бы
      // из-под глаз.
      const b = e.currentTarget;
      CHAIN_OPEN = b.closest(".lx-chain").classList.toggle("on");
      b.setAttribute("aria-expanded", String(CHAIN_OPEN));
    });
    // Письмо в переписке: свернуть или раскрыть записи на месте, без перехода.
    host.querySelectorAll("[data-thtog]").forEach((b) => b.addEventListener("click", () => {
      const id = b.dataset.thtog;
      if (THREAD_SHUT.has(id)) THREAD_SHUT.delete(id); else THREAD_SHUT.add(id);
      render();
    }));
    on(host, "#ltThAll", () => {
      const d = cardOk();
      const th = (d && d.thread) || [];
      const allOpen = th.every((x) => x.id === LETTER || !THREAD_SHUT.has(x.id));
      th.forEach((x) => { if (x.id !== LETTER) { if (allOpen) THREAD_SHUT.add(x.id); else THREAD_SHUT.delete(x.id); } });
      render();
    });
    host.querySelectorAll("[data-sib]").forEach((a) => a.addEventListener("click", (e) => {
      if (e.ctrlKey || e.metaKey || e.shiftKey || e.button) return;   // в новой вкладке — как ссылка
      e.preventDefault();
      if (a.dataset.sib !== LETTER) swap("letter", SITE, a.dataset.sib);
    }));
    host.querySelectorAll("[data-ctx]").forEach((b) => b.addEventListener("click", () => {
      if (b.id === "ltSite") return;
      CTXPOP = false;
      if (split()) pickCtx(b.dataset.ctx);
      else go("site", b.dataset.ctx);
    }));
    on(host, "#lxQuiet", () => {
      QUIET = !QUIET;
      try { localStorage.setItem("lx-quiet", QUIET ? "1" : "0"); } catch (e) { /* без памяти */ }
      render();
    });
    on(host, "#lxCtx", () => { CTXPOP = !CTXPOP; render(); });
    on(host, "#lxFiles", () => { FILES_AT = ""; if (VIEW !== "docs") go("docs", SITE); });
    on(host, "#lxTabL", () => { if (VIEW === "docs") up(); });
    on(host, "#ltFilesAll", () => { FILES_AT = ""; go("docs", SITE); });
    on(host, "#ltFolderNew", newFolder);
    host.querySelectorAll("[data-lfdel]").forEach((b) => b.addEventListener("click", () => {
      const f = ((PAGE && PAGE.folders) || []).find((x) => x.id === b.dataset.lfdel);
      if (f) removeFolder(f);
    }));
    host.querySelectorAll("[data-lfolder]").forEach((b) => b.addEventListener("click", () => {
      FILES_AT = b.dataset.lfolder;
      go("docs", SITE);
    }));
    const fl = $l("#ltFiles", host);
    if (fl && typeof FILES === "object") {
      FILES.mount(fl, SITE, FILES_AT === null ? undefined : FILES_AT);
      FILES_AT = null;
    }
    on(host, "#ltClose", closeLetter);
    on(host, "#ltReopen", () => setStatus("open"));
    on(host, "#ltEdit", editLetter);
    on(host, "#ltSend", sendNote);
    on(host, "#ltQClear", () => {
      for (let i = QUEUE.length - 1; i >= 0; i--) if (QUEUE[i].state === "err") QUEUE.splice(i, 1);
      render();
    });
    host.querySelectorAll("[data-filter]").forEach((b) => b.addEventListener("click", () => {
      FILTER = b.dataset.filter;
      LQ = ""; SRES = null;
      render();
    }));

    // Поиск объекта слева; на телефонном экране объектов — и писем.
    const q = $l("#lxQ", host);
    if (q) q.addEventListener("input", () => {
      Q = q.value;
      paintObjects();
      if (!split()) searchSoon(Q, "", (res) => { GRES = res; paintObjects(); });
    });
    // Поиск писем в выбранном: пока меньше двух букв — переписки, как были.
    const lq = $l("#lxLQ", host);
    if (lq) lq.addEventListener("input", () => {
      LQ = lq.value;
      LQ_CTX = ctxId();
      if (LQ.trim().length < 2) {
        searchSoon("", "", null);
        SRES = null;
        render();
        return;
      }
      searchSoon(LQ, SITE, (res) => { SRES = res; render(); });
    });

    const pick = $l("#ltPick", host);
    if (pick) pick.addEventListener("change", () => {
      const files = [...pick.files];
      pick.value = "";
      if (!files.length) return;
      const t = $l("#ltText", host);
      const title = t ? t.value.trim().slice(0, 200) : "";
      if (t && title) { t.value = ""; saveDraft(""); }
      enqueue(files, { site: lsite(), letter: LETTER, title });
    });
    const t = $l("#ltText", host);
    if (t) {
      const grow = () => { t.style.height = "auto"; t.style.height = Math.min(t.scrollHeight, 160) + "px"; };
      t.addEventListener("input", () => { saveDraft(t.value); grow(); });
      // Ctrl+Enter — записать; просто Enter — новая строка, как в любом поле.
      t.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); sendNote(); }
      });
      grow();
    }
    wireRows(host);
    wireItemEdit(host);
  }

  function paintObjects() {
    const box = $l("#sec-let #lxObjs");
    if (!box || !LIST || LIST.error) return;
    const cur = split() ? (VIEW === "list" ? "" : SITE) : null;
    box.innerHTML = objectsListHtml(cur) + (!split() && Q.trim().length >= 2
      ? `<div class="lx-h">Письма</div>${foundHtml(GRES, true, Q)}` : "");
    box.querySelectorAll("[data-ctx]").forEach((b) => b.addEventListener("click", () => {
      if (split()) pickCtx(b.dataset.ctx); else go("site", b.dataset.ctx);
    }));
    wireOrgs(box);
    on(box, "#lxQuiet", () => {
      QUIET = !QUIET;
      try { localStorage.setItem("lx-quiet", QUIET ? "1" : "0"); } catch (e) { /* без памяти */ }
      paintObjects();
    });
    wireRows(box);
  }

  /* Правка записи журнала: карандаш — поле на месте записи. */
  function wireItemEdit(host) {
    host.querySelectorAll("[data-editem]").forEach((b) => b.addEventListener("click", (e) => {
      e.stopPropagation();
      const it = ((CARD && CARD.items) || []).find((x) => x.id === b.dataset.editem);
      if (!it) return;
      EDIT_ITEM = it.id;
      EDIT_TEXT = it.text || "";
      render();
      const ta = $l("#ltItemEd");
      if (ta) { ta.focus(); ta.setSelectionRange(ta.value.length, ta.value.length); }
    }));
    const ta = $l("#ltItemEd", host);
    if (!ta) return;
    const cancel = () => { EDIT_ITEM = ""; render(); };
    ta.addEventListener("input", () => { EDIT_TEXT = ta.value; });
    ta.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); saveItem(); }
      else if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); cancel(); }
    });
    on(host, "[data-itsave]", saveItem);
    on(host, "[data-itcancel]", cancel);
  }

  async function saveItem() {
    const id = EDIT_ITEM, btn = $l("#sec-let [data-itsave]");
    if (!id) return;
    if (btn) btn.disabled = true;
    try {
      await AUTH.api("PATCH", "/letter-items/" + id, { text: EDIT_TEXT.trim() });
      EDIT_ITEM = "";
      await refresh();
    } catch (e) {
      ASK.alert(e.message, { title: "Не сохранилось" });
      if (btn) btn.disabled = false;
    }
  }

  function wireRows(host) {
    host.querySelectorAll("[data-open]").forEach((a) => a.addEventListener("click", (e) => {
      if (e.ctrlKey || e.metaKey || e.shiftKey || e.button) return;   // в новой вкладке — как ссылка
      e.preventDefault();
      if (!split() && VIEW === "list") {
        // Найденное на экране объектов: письмо — через его объект.
        go("site", a.dataset.lsite);
        go("letter", a.dataset.lsite, a.dataset.open);
        return;
      }
      openLetter(a.dataset.open);
    }));
    host.querySelectorAll("[data-file]").forEach((b) => b.addEventListener("click", () =>
      (b.dataset.preview ? openDoc(b.dataset.file, b) : saveDoc(b.dataset.file, b.dataset.name, b))));
    // Сканы из реестра — своим путём: они лежат мимо файлов объекта.
    host.querySelectorAll("[data-cfile]").forEach((b) => b.addEventListener("click", async () => {
      const url = "/api/corr-files/" + encodeURIComponent(b.dataset.cfile) + "/file";
      try {
        if (b.dataset.preview) await DL.open(url, { btn: b });
        else await DL.save(url, { btn: b, name: b.dataset.name });
      } catch (e) { ASK.alert(e.message, { title: "Не открылось" }); }
    }));
    host.querySelectorAll(".lx-ord-d").forEach((x) => x.addEventListener("toggle", () => { ORD_OPEN = x.open; }));
    host.querySelectorAll("[data-delitem]").forEach((b) => b.addEventListener("click", (e) => {
      e.stopPropagation();
      removeItem(b.dataset.delitem);
    }));
    /* На телефоне карандаш и корзина не маячат у каждой записи: нажал на
       свою запись — появились, нажал ещё раз — спрятались. */
    host.querySelectorAll(".lt-item").forEach((it) => it.addEventListener("click", (e) => {
      if (!narrow() || e.target.closest("button") || !$l("[data-delitem]", it)) return;
      host.querySelectorAll(".lt-item.sel").forEach((x) => { if (x !== it) x.classList.remove("sel"); });
      it.classList.toggle("sel");
    }));
  }

  /* Клавиатура на широком экране: ↑/↓ — соседняя переписка, Esc —
     закрыть письмо. В полях ввода стрелки остаются полю. */
  document.addEventListener("keydown", (e) => {
    if (document.documentElement.dataset.sec !== "let" || !split()) return;
    if (document.querySelector(".lt-modal, .pf-modal")) return;
    const t = e.target;
    const typing = t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable);
    if (e.key === "Escape" && !typing && VIEW === "letter") { e.preventDefault(); up(); return; }
    if (typing || e.altKey || e.ctrlKey || e.metaKey) return;
    const arrow = e.key === "ArrowDown" || e.key === "ArrowUp";
    if (!arrow && e.key !== "j" && e.key !== "k") return;
    if (arrow && !(t && t.closest && t.closest(".lx-convs"))) return;
    const rows = [...document.querySelectorAll("#sec-let .lx-convs [data-open]")];
    if (!rows.length) return;
    e.preventDefault();
    const i = rows.findIndex((r) => r.classList.contains("sel"));
    const d = e.key === "ArrowDown" || e.key === "j" ? 1 : -1;
    const n = rows[Math.max(0, Math.min(rows.length - 1, i < 0 ? 0 : i + d))];
    if (n && !n.classList.contains("sel")) {
      openLetter(n.dataset.open);
      if (arrow) setTimeout(() => { const x = document.querySelector("#sec-let .lx-convs .sel"); if (x) x.focus(); }, 0);
    }
  });

  /* Выпадающий выбор объекта закрывается нажатием мимо. */
  document.addEventListener("mousedown", (e) => {
    if (!CTXPOP || (e.target.closest && e.target.closest(".lx-ctxw"))) return;
    CTXPOP = false;
    render();
  });

  const docUrl = (id) => "/api/documents/" + encodeURIComponent(id) + "/file";
  async function openDoc(id, btn) {
    try { await DL.open(docUrl(id), { btn }); } catch (e) { ASK.alert(e.message, { title: "Не открылось" }); }
  }
  async function saveDoc(id, name, btn) {
    try { await DL.save(docUrl(id), { btn, name }); } catch (e) { ASK.alert(e.message, { title: "Не скачалось" }); }
  }

  /* ── окна ──────────────────────────────────────────────────── */
  /* Окно с полями. На телефоне встаёт снизу во всю ширину — до кнопок
     дотягивается большой палец. onOk получает форму и возвращает true,
     если окно можно закрыть; ошибку пишет в окно, а не в alert. */
  function modal(title, inner, okLabel, onOk, extra) {
    const box = document.createElement("div");
    box.className = "pf-modal lt-modal";
    box.innerHTML = `
      <form class="pf-crop cnt-card lt-form" role="dialog" aria-label="${esc(title)}" novalidate>
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
    const form = $l("form", box), err = $l(".lt-form-err", box), ok = $l("[data-ok]", box);
    const close = () => { document.removeEventListener("keydown", key); box.remove(); };
    const key = (e) => { if (e.key === "Escape" && !e.defaultPrevented) close(); };
    document.addEventListener("keydown", key);
    box.addEventListener("mousedown", (e) => { if (e.target === box) close(); });
    $l("[data-no]", box).addEventListener("click", close);
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      err.hidden = true;
      ok.disabled = true;
      try {
        if (await onOk(form, close) !== false) close();
      } catch (ex) {
        err.textContent = ex.message;
        err.hidden = false;
      } finally {
        ok.disabled = false;
      }
    });
    const first = $l("input:not([type=radio]):not([type=file]):not([type=checkbox]):not([hidden]), textarea", box);
    if (first && FINE.matches) first.focus();
    return { box, form, close };
  }
  const val = (form, name) => (form.elements[name] ? String(form.elements[name].value || "").trim() : "");

  function newSite() {
    modal("Новый объект", `
      <div class="fld"><label for="ltSN">Название</label>
        <input id="ltSN" name="name" autocomplete="off" placeholder="ЖК Северный парк, дом 5"></div>
      <div class="fld"><label for="ltSC">Заказчик</label>
        <input id="ltSC" name="customer" autocomplete="off"></div>
      <div class="fld"><label for="ltSA">Адрес</label>
        <input id="ltSA" name="address" autocomplete="off"></div>
      <i class="fld-hint">Объект один на всю платформу: его увидят и в «Объектах».</i>`,
    "Завести", async (f) => {
      if (!val(f, "name")) throw new Error("Назовите объект");
      const s = await AUTH.api("POST", "/letters/sites", {
        name: val(f, "name"), customer: val(f, "customer"), address: val(f, "address") });
      LIST = null;
      Q = "";
      if (split()) pickCtx(s.id); else go("site", s.id);
    });
  }

  /* Папки объекта прямо из «Писем» (заказчик, 28.09.2026): завести новую
     и убрать лишнюю — здесь же; переименовать — внутри папки, карандашом
     у её названия. Папки общие с «Объектами». */
  function newFolder() {
    modal("Новая папка объекта", `
      <div class="fld"><label for="ltFN">Название</label>
        <input id="ltFN" name="name" autocomplete="off" placeholder="15. Гарантийные письма"></div>
      <i class="fld-hint">Папка появится и во вкладке «Файлы» объекта в «Объектах».</i>`,
    "Завести", async (f) => {
      const name = val(f, "name");
      if (!name) throw new Error("Назовите папку");
      await AUTH.api("POST", "/files/folders", { root: "site", site: SITE, parent_id: "", name });
      await refresh();
    });
  }

  async function removeFolder(f) {
    if (!(await ASK.confirm(`Убрать в корзину папку «${f.name}»${f.items ? " со всем содержимым" : ""}?\n`
      + "Вернуть можно из корзины на экране файлов объекта в течение 30 дней.", { ok: "В корзину" }))) return;
    try {
      await AUTH.api("DELETE", "/files/folders/" + encodeURIComponent(f.id));
      await refresh();
    } catch (e) { ASK.alert(e.message, { title: "Не вышло" }); }
  }

  const dirPick = (cur) => `
    <div class="fld"><span>Кто кому</span>
      <div class="seg lt-dirseg">
        <label class="seg-b${cur !== "in" ? " on" : ""}"><input type="radio" name="direction" value="out"${
          cur !== "in" ? " checked" : ""} hidden>${ICO.out}Мы отправили</label>
        <label class="seg-b${cur === "in" ? " on" : ""}"><input type="radio" name="direction" value="in"${
          cur === "in" ? " checked" : ""} hidden>${ICO.in}Нам пришло</label>
      </div></div>`;
  function wireDir(form) {
    form.querySelectorAll("input[name=direction]").forEach((r) => r.addEventListener("change", () =>
      form.querySelectorAll(".lt-dirseg .seg-b").forEach((b) =>
        b.classList.toggle("on", $l("input", b).checked))));
  }
  const dirVal = (f) => ($l("input[name=direction]:checked", f) || {}).value || "out";

  /* Компания письма: кнопками, по умолчанию — компания объекта. */
  const orgPickHtml = (cur) => {
    const orgs = orgsAll();
    if (orgs.length < 2) return "";
    return `<div class="fld"><span>Компания</span><div class="seg lt-orgseg">${orgs.map((o) => `
      <label class="seg-b${o.id === cur ? " on" : ""}" title="${esc(o.name)}"><input type="radio" name="org_id"
        value="${esc(o.id)}"${o.id === cur ? " checked" : ""} hidden>${esc(nice(o.label))}</label>`).join("")}</div></div>`;
  };
  function wireOrgPick(form, onTouch) {
    form.querySelectorAll("input[name=org_id]").forEach((r) => r.addEventListener("change", (e) => {
      form.querySelectorAll(".lt-orgseg .seg-b").forEach((b) => b.classList.toggle("on", $l("input", b).checked));
      if (e.isTrusted && onTouch) onTouch();
    }));
  }
  const orgVal = (f) => ($l("input[name=org_id]:checked", f) || {}).value || "";

  const letterFields = (l) => `
    ${orgPickHtml(l.org_id)}
    ${dirPick(l.direction)}
    <div class="fld"><label for="ltLS">О чём письмо</label>
      <textarea id="ltLS" name="subject" rows="2" placeholder="Запрос недостающих данных по отметкам плит"
        >${esc(l.subject || "")}</textarea></div>
    <div class="lt-2">
      <div class="fld"><label for="ltLN">Номер</label>
        <input id="ltLN" name="number" autocomplete="off" value="${esc(l.number || "")}"></div>
      <div class="fld"><label for="ltLD">Дата</label>
        <input id="ltLD" name="sent_at" type="date" value="${esc(l.sent_at || today())}"></div>
    </div>`;

  /* ── связь: на какое письмо это ответ ───────────────────────── */
  /* Письма объекта: у открытого письма — из карточки, иначе — из
     объекта на экране. */
  const siteLetters = () => (VIEW === "letter" && cardOk() && CARD.site_letters)
    || (pageOk() && PAGE.letters) || [];
  const linkLabel = (l) => (l ? `${l.number ? "№ " + esc(l.number) + " · " : ""}${esc(l.subject)}${
    l.sent_at ? " · " + day(l.sent_at) : ""}` : "Не связано — новая переписка");
  const linkBtn = (l) => `${l ? ICO.reply : ICO.link}<span>${linkLabel(l)}</span>${ICO.chev}`;
  const linkVal = (f) => ($l("input[name=reply_to]:checked", f) || {}).value || "";

  /* Само письмо и его ответы: на них отвечать нельзя — выйдет кольцо. */
  function kidsOf(id, all) {
    const out = new Set([id]);
    for (let grew = true; grew;) {
      grew = false;
      for (const l of all) {
        if (l.reply_to && out.has(l.reply_to) && !out.has(l.id)) { out.add(l.id); grew = true; }
      }
    }
    return out;
  }

  /* Выбор письма: кнопка с выбранным, под ней список писем объекта —
     свежие сверху, с поиском по теме, номеру и дате. */
  function linkFieldHtml(cur, exclude, open, pool) {
    const all = (pool || siteLetters()).filter((l) => !exclude.has(l.id)).sort((a, b) => chrono(b, a));
    const c = all.find((l) => l.id === cur) || null;
    const opt = (l) => {
      const onn = (l ? l.id : "") === (c ? c.id : "");
      return `
      <label class="lt-opt${onn ? " on" : ""}" data-q="${l ? esc((l.subject + " " + l.number + " "
        + day(l.sent_at)).toLowerCase()) : ""}">
        <input type="radio" name="reply_to" value="${l ? esc(l.id) : ""}"${onn ? " checked" : ""}>
        ${l ? `<span class="lt-dir ${l.direction}">${l.direction === "in" ? ICO.in : ICO.out}</span>
        <span class="lt-opt-main"><b>${esc(l.subject)}</b><i>${[l.number ? "№ " + esc(l.number) : "",
          l.sent_at ? "от " + day(l.sent_at) : "", dirText(l.direction),
          l.status === "done" ? "закрыто" : "открыто"].filter(Boolean).join(" · ")}</i></span>`
        : `${ICO.link}<span class="lt-opt-main"><b>Не связано</b><i>новая переписка</i></span>`}
      </label>`;
    };
    return `
      <div class="fld lt-linkf"><span>Ответ на письмо</span>
        <button type="button" class="lt-linkb${c ? " on" : ""}${open ? " open" : ""}" data-linkb>${linkBtn(c)}</button>
        <div class="lt-linkp"${open ? "" : " hidden"}>
          ${all.length > 6 ? `<input type="search" data-linkq placeholder="Найти письмо: тема, номер, дата"
            autocomplete="off">` : ""}
          <div class="lt-opts">${opt(null)}${all.map(opt).join("")}</div>
        </div>
      </div>`;
  }
  function wireLinkField(form, onPick, pool) {
    const b = $l("[data-linkb]", form), p = $l(".lt-linkp", form), q = $l("[data-linkq]", form);
    if (!b) return;
    b.addEventListener("click", () => {
      p.hidden = !p.hidden;
      b.classList.toggle("open", !p.hidden);
      if (!p.hidden && q && FINE.matches) q.focus();
    });
    form.querySelectorAll("input[name=reply_to]").forEach((r) => r.addEventListener("change", () => {
      form.querySelectorAll(".lt-linkp .lt-opt").forEach((o) => o.classList.toggle("on", $l("input", o).checked));
      const l = (pool || siteLetters()).find((x) => x.id === r.value) || null;
      b.innerHTML = linkBtn(l);
      b.classList.toggle("on", !!l);
      b.classList.remove("open");
      p.hidden = true;
      if (onPick) onPick(l);
    }));
    if (q) {
      q.addEventListener("input", () => {
        const t = q.value.trim().toLowerCase();
        form.querySelectorAll(".lt-linkp .lt-opt").forEach((o) => {
          o.hidden = !!t && !!o.dataset.q && !o.dataset.q.includes(t);
        });
      });
      // Enter в поиске — не «Сохранить» всего окна.
      q.addEventListener("keydown", (e) => { if (e.key === "Enter") e.preventDefault(); });
    }
  }

  /* Письмо вносят только через реестр корреспонденции (заказчик,
     08.10.2026: «функционал только у тех, кто ведёт реестр»; 09.10.2026:
     кнопки «Новое письмо» в «Письмах» путают — убраны и у регистраторов).
     Отсюда осталось одно: «Ответ письмом» в карточке письма — окно
     регистрации открывается встречным видом с этим объектом, новая карточка
     связывается с исходной, исходная закрывается: ответили или получили
     ответ. Письмо получает номер в журнале, карточку заводит сервер. */
  function newLetter(opts) {
    if (!canReg() || typeof REG !== "object") return;
    const reply = (opts && opts.reply) || null;
    const site = reply ? reply.site_id : SITE;
    // Связь и закрытие исходного делает сервер при регистрации (reply_to,
    // reply_close) — в окне это поле «Ответ на письмо» и галочка под ним.
    REG.create({
      site,
      kind: reply ? (reply.direction === "out" ? "in" : "out") : undefined,
      reply: reply ? { ...reply, site_name: (CARD && CARD.site && CARD.site.name) || "" } : null,
      onDone: (res) => {
        const cards = (res && res.cards) || [];
        const card = cards.find((x) => x.site_id === site) || cards[0];
        if (!card) { refresh(); return; }
        if (FILTER !== "all") FILTER = "open";
        openFromReg(card.site_id, card.id);
      },
    });
  }

  /* Связь из карточки письма: указать, на какое письмо это ответ, или
     снять. Ответы на само письмо остаются с ним. */
  function relink() {
    const d = cardOk();
    if (!d) return;
    const l = d.letter;
    const { form } = modal("На какое письмо это ответ", `
      ${linkFieldHtml(l.reply_to, kidsOf(l.id, siteLetters()), true)}
      <i class="fld-hint">Письмо встанет в переписку под выбранным, ответы на него переедут вместе
        с ним. В журнал запишется, кто связал.</i>`,
    "Сохранить", async (f) => {
      const v = linkVal(f);
      if (v === (l.reply_to || "")) return;
      await AUTH.api("PATCH", "/letters/" + l.id, { reply_to: v });
      await refresh();
    });
    wireLinkField(form);
  }

  /* Снять связь: «это письмо — не ответ на то» (up — у открытого
     письма, down — у его ответа). В журналы пишется, кто снял. */
  async function unlink(l, dir) {
    if (!l) return;
    const by = new Map(((CARD && CARD.site_letters) || []).map((x) => [x.id, x]));
    const p = by.get(l.reply_to);
    const text = dir === "up"
      ? `Отвязать это письмо от ${p ? shortOf(p) : "письма"}? Оно перестанет быть ответом на него.`
      : `Отвязать ${shortOf(l)} — «${l.subject}»? Оно перестанет быть ответом на это письмо.`;
    if (!(await ASK.confirm(text))) return;
    try {
      await AUTH.api("PATCH", "/letters/" + l.id, { reply_to: "" });
      await refresh();
    } catch (e) { ASK.alert(e.message, { title: "Не вышло" }); }
  }

  /* Какие письма отвечают на это: галочки по письмам объекта. Нельзя
     отметить само письмо и то, на что оно само отвечает (выйдет кольцо).
     У письма, которое уже отвечает на другое, подписано на что: отметишь —
     переедет сюда вместе со своими ответами. */
  function pickKids() {
    const d = cardOk();
    if (!d) return;
    const l = d.letter;
    const all = siteLetters();
    const by = new Map(all.map((x) => [x.id, x]));
    const upSet = new Set([l.id]);
    for (let x = by.get(l.reply_to); x && !upSet.has(x.id); x = by.get(x.reply_to)) upSet.add(x.id);
    const rank = (x) => (x.reply_to === l.id ? 0 : !x.reply_to ? 1 : 2);
    const list = all.filter((x) => !upSet.has(x.id)).sort((a, b) => rank(a) - rank(b) || chrono(b, a));
    const { form } = modal("Ответы на это письмо", list.length ? `
      <div class="lt-kids-for">${ICO.mail}<span>${esc(shortOf(l))} · ${esc(l.subject)}</span></div>
      ${list.length > 6 ? `<div class="fld"><input type="search" data-kidq
        placeholder="Найти письмо: тема, номер, дата" autocomplete="off"></div>` : ""}
      <div class="lt-opts lt-picks">${list.map((x) => {
        const onn = x.reply_to === l.id;
        const p = !onn && by.get(x.reply_to);
        return `
        <label class="lt-opt${onn ? " on" : ""}" data-q="${esc((x.subject + " " + x.number + " "
          + day(x.sent_at)).toLowerCase())}">
          <input type="checkbox" name="ids" value="${esc(x.id)}"${onn ? " checked" : ""}>
          <span class="lt-dir ${x.direction}">${x.direction === "in" ? ICO.in : ICO.out}</span>
          <span class="lt-opt-main"><b>${esc(x.subject)}</b><i>${[x.number ? "№ " + esc(x.number) : "",
            x.sent_at ? "от " + day(x.sent_at) : "", dirText(x.direction)].filter(Boolean).join(" · ")}${
            p ? ` · <em>сейчас ответ на ${esc(shortOf(p))}</em>` : ""}</i></span>
        </label>`;
      }).join("")}</div>
      <i class="fld-hint">Отмеченные письма станут ответами на это, снятые — отвяжутся. В журналы
        писем запишется, кто связал.</i>`
      : `<div class="lx-none">Других писем на объекте нет.</div>`,
    "Сохранить", async (f) => {
      const ids = [...f.querySelectorAll(".lt-picks input:checked")].map((c) => c.value);
      await AUTH.api("POST", "/letters/" + l.id + "/replies", { ids });
      await refresh();
    });
    form.querySelectorAll(".lt-picks input").forEach((c) => c.addEventListener("change", () =>
      c.closest(".lt-opt").classList.toggle("on", c.checked)));
    const q = $l("[data-kidq]", form);
    if (q) {
      q.addEventListener("input", () => {
        const t = q.value.trim().toLowerCase();
        form.querySelectorAll(".lt-picks .lt-opt").forEach((o) => { o.hidden = !!t && !o.dataset.q.includes(t); });
      });
      q.addEventListener("keydown", (e) => { if (e.key === "Enter") e.preventDefault(); });
    }
  }

  function editLetter() {
    const d = cardOk();
    if (!d) return;
    const l = d.letter;
    const { form, close } = modal("Письмо", letterFields(l), "Сохранить", async (f) => {
      const subject = val(f, "subject");
      if (!subject) throw new Error("Напишите, о чём письмо");
      const body = { subject, number: val(f, "number"), sent_at: val(f, "sent_at"), direction: dirVal(f) };
      if (orgVal(f)) body.org_id = orgVal(f);
      await AUTH.api("PATCH", "/letters/" + l.id, body);
      await refresh();
    }, `<button type="button" class="btn ghost lt-danger" data-del>${ICO.trash}Удалить</button>`);
    wireDir(form);
    wireOrgPick(form);
    $l("[data-del]", form).addEventListener("click", async () => {
      if (!(await ASK.confirm("Удалить письмо «" + l.subject + "» вместе с журналом и файлами?"))) return;
      try {
        await AUTH.api("DELETE", "/letters/" + l.id);
        close();
        PAGE = null;
        up();
      } catch (e) { ASK.alert(e.message, { title: "Не удалилось" }); }
    });
  }

  /* Закрыть — с короткой причиной: через месяц «закрыто» без слов ничего
     не объяснит. Частые причины — одним нажатием. */
  function closeLetter() {
    const d = cardOk();
    if (!d) return;
    const l = d.letter;
    const presets = l.direction === "out"
      ? ["Получен ответ", "Вопрос решён на месте", "Больше не актуально"]
      : ["Ответили письмом", "Сделано", "Больше не актуально"];
    const { form } = modal("Закрыть письмо", `
      <div class="lt-presets">${presets.map((p) => `<button type="button" class="lt-preset"
        data-p="${esc(p)}">${esc(p)}</button>`).join("")}</div>
      <div class="fld"><label for="ltWhy">Чем закончилось</label>
        <textarea id="ltWhy" name="why" rows="2" placeholder="Необязательно"></textarea></div>`,
    "Закрыть", async (f) => {
      await setStatus("done", val(f, "why"));
    });
    form.querySelectorAll("[data-p]").forEach((b) => b.addEventListener("click", () => {
      form.elements.why.value = b.dataset.p;
      form.querySelectorAll("[data-p]").forEach((x) => x.classList.toggle("on", x === b));
    }));
  }

  async function setStatus(status, why) {
    try {
      await AUTH.api("PATCH", "/letters/" + LETTER, { status, why: why || "" });
      await refresh();
    } catch (e) {
      if (why !== undefined) throw e;
      ASK.alert(e.message, { title: "Не вышло" });
    }
  }

  async function sendNote() {
    const t = $l("#ltText");
    const text = t ? t.value.trim() : "";
    if (!text) { if (t) t.focus(); return; }
    const btn = $l("#ltSend");
    if (btn) btn.disabled = true;
    try {
      await AUTH.api("POST", "/letters/" + LETTER + "/notes", { text });
      saveDraft("");
      if (t) t.value = "";
      await refresh();
      const feed = $l("#ltFeed");
      if (feed) feed.scrollTop = feed.scrollHeight;
    } catch (e) {
      ASK.alert(e.message, { title: "Не записалось" });
    } finally {
      const b = $l("#ltSend");
      if (b) b.disabled = false;
    }
  }

  async function removeItem(id) {
    if (!(await ASK.confirm("Убрать запись из журнала? Приложенный к ней файл уйдёт тоже."))) return;
    try {
      await AUTH.api("DELETE", "/letter-items/" + id);
      await refresh();
    } catch (e) { ASK.alert(e.message, { title: "Не вышло" }); }
  }

  /* Письма объекта — из другого раздела («Объекты», 30.09.2026): раздел
     откроется прямо на объекте, «назад» — во все объекты. */
  function openSite(site) {
    START = { site: site || "all", letter: "" };
  }

  return { load, openSite };
})();
