/* Обучение — программы для мастеров и учебные материалы.

   Заказчик, 02.10.2026: новый мастер приходит — у него список тем: зайти,
   посмотреть материал, поставить отметку, а лучше приложить скриншот
   встречи с руководителем; и полоса — сколько прошёл. Две половины одного
   раздела:

     мастер      — «Моё обучение»: что дальше (одна большая кнопка) и
                   программы с полосой; тема — материалы и действие, которым
                   она засчитывается; «Материалы» — вся библиотека;
     составитель — «Программы» (конструктор глав и тем с перетаскиванием),
                   «Материалы» с загрузкой, «Сотрудники» (кто где по каждой
                   программе) и «Проверка» фото-подтверждений.

   Подсмотрено у обучающих платформ: плеер курса с содержанием сбоку и
   кнопкой «дальше» (Teachable), назначение всем, новичкам или поимённо и
   отметка «ознакомлен» (Trainual), задания с проверкой руководителем
   (iSpring Learn).

   Материал открывается поверх страницы во весь экран: PDF — листами-
   картинками (на телефоне PDF внутри страницы не показать), видео —
   плеером. Сколько долистано и досмотрено, уходит на сервер: тема
   «просмотреть» засчитывается сама, а составитель видит правду. */
"use strict";

const LEARN = (() => {
  const $q = (s, r) => (r || document).querySelector(s);
  const $qa = (s, r) => [...(r || document).querySelectorAll(s)];
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  const svg = (d) => `<svg viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
  const ICO = {
    back: svg(`<path d="M15 18l-6-6 6-6"/>`),
    next: svg(`<path d="M9 18l6-6-6-6"/>`),
    chev: svg(`<path d="M6 9l6 6 6-6"/>`),
    plus: svg(`<path d="M12 5v14M5 12h14"/>`),
    find: svg(`<circle cx="11" cy="11" r="6.5"/><path d="M20.5 20.5 16 16"/>`),
    check: svg(`<path d="M5 12.5l4.5 4.5L19 7.5"/>`),
    checkc: svg(`<circle cx="12" cy="12" r="8.5"/><path d="M8.3 12.2l2.6 2.6 4.9-5.2"/>`),
    lock: svg(`<rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5"/>`),
    clock: svg(`<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>`),
    undo: svg(`<path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>`),
    pdf: svg(`<path d="M7 3.5h6.5l4 4V20a.5.5 0 0 1-.5.5H7a.5.5 0 0 1-.5-.5V4a.5.5 0 0 1 .5-.5z"/><path d="M13.5 3.5V7.5h4M9.5 12h5M9.5 15.5h5"/>`),
    video: svg(`<rect x="3" y="6" width="13" height="12" rx="2"/><path d="M16 10.5l5-3v9l-5-3"/>`),
    image: svg(`<rect x="3.5" y="4.5" width="17" height="15" rx="2"/><circle cx="9" cy="10" r="1.8"/><path d="M20.5 16l-5-5-8.5 8.5"/>`),
    audio: svg(`<path d="M9 18V6l10-2v12"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="16.5" cy="16" r="2.5"/>`),
    link: svg(`<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>`),
    doc: svg(`<path d="M7 3.5h6.5l4 4V20a.5.5 0 0 1-.5.5H7a.5.5 0 0 1-.5-.5V4a.5.5 0 0 1 .5-.5z"/><path d="M13.5 3.5V7.5h4"/>`),
    upload: svg(`<path d="M12 15.5V4.5M7.5 9 12 4.5 16.5 9"/><path d="M4.5 15v3.5A1.5 1.5 0 0 0 6 20h12a1.5 1.5 0 0 0 1.5-1.5V15"/>`),
    lib: svg(`<path d="M5 4.5h4v15H5zM11 4.5h4v15h-4z"/><path d="M16.8 5.6l3.4-.8 2.6 14-3.4.8z"/>`),
    eye: svg(`<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>`),
    sign: svg(`<path d="M4 20.5h16"/><path d="M6.5 16.5l9.6-9.6a2 2 0 0 1 2.9 2.9l-9.6 9.6-3.9 1z"/>`),
    camera: svg(`<path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2.3l1.4-2h5.6l1.4 2h2.3A1.5 1.5 0 0 1 20 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5z"/><circle cx="12" cy="12.5" r="3.5"/>`),
    sliders: svg(`<path d="M4 6.5h9M17 6.5h3M4 12h3M11 12h9M4 17.5h11M19 17.5h1"/><circle cx="15" cy="6.5" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="17" cy="17.5" r="2"/>`),
    grip: svg(`<circle cx="9" cy="6.5" r=".9"/><circle cx="15" cy="6.5" r=".9"/><circle cx="9" cy="12" r=".9"/><circle cx="15" cy="12" r=".9"/><circle cx="9" cy="17.5" r=".9"/><circle cx="15" cy="17.5" r=".9"/>`),
    trash: svg(`<path d="M4.5 6.5h15M9.5 6.5V4.8a1.3 1.3 0 0 1 1.3-1.3h2.4a1.3 1.3 0 0 1 1.3 1.3v1.7M6.5 6.5l.9 12.2A1.5 1.5 0 0 0 8.9 20h6.2a1.5 1.5 0 0 0 1.5-1.3l.9-12.2"/>`),
    edit: svg(`<path d="M4.5 19.5h4l10-10a2.1 2.1 0 0 0-3-3l-10 10z"/>`),
    x: svg(`<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>`),
    download: svg(`<path d="M12 4.5v11M7.5 11 12 15.5 16.5 11"/><path d="M4.5 19.5h15"/>`),
    out: svg(`<path d="M14 4.5h5.5V10M19.5 4.5 11 13"/><path d="M18 14v4.5A1.5 1.5 0 0 1 16.5 20h-11A1.5 1.5 0 0 1 4 18.5v-11A1.5 1.5 0 0 1 5.5 6H10"/>`),
    cap: svg(`<path d="M2.5 9 12 4.5 21.5 9 12 13.5z"/><path d="M6.5 11v4.6c1.4 1.5 3.4 2.4 5.5 2.4s4.1-.9 5.5-2.4V11"/><path d="M21.5 9v5"/>`),
    trophy: svg(`<path d="M8 4.5h8v4.5a4 4 0 0 1-8 0z"/><path d="M8 6.5H5.5a2.8 2.8 0 0 0 3 3.6M16 6.5h2.5a2.8 2.8 0 0 1-3 3.6M12 13v3.5M8.5 20h7M10 16.5h4V20h-4z"/>`),
    up: svg(`<path d="M12 19V5M6.5 10.5 12 5l5.5 5.5"/>`),
    down: svg(`<path d="M12 5v14M6.5 13.5 12 19l5.5-5.5"/>`),
    copy: svg(`<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5.5A1.5 1.5 0 0 0 14.5 4h-9A1.5 1.5 0 0 0 4 5.5v9A1.5 1.5 0 0 0 5.5 16H8"/>`),
    send: svg(`<path d="M4.5 12h14M13 6.5l5.5 5.5-5.5 5.5"/>`),
    list: svg(`<path d="M9 6.5h11M9 12h11M9 17.5h11"/><circle cx="4.8" cy="6.5" r=".9"/><circle cx="4.8" cy="12" r=".9"/><circle cx="4.8" cy="17.5" r=".9"/>`),
    users: svg(`<path d="M16 20v-1.6a3.4 3.4 0 0 0-3.4-3.4H6.4A3.4 3.4 0 0 0 3 18.4V20"/><circle cx="9.5" cy="7.5" r="3.5"/><path d="M21 20v-1.6a3.4 3.4 0 0 0-2.6-3.3M15.5 4.2a3.4 3.4 0 0 1 0 6.6"/>`),
    cal: svg(`<rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 9.5h17M8 3v4M16 3v4"/>`),
    folder: svg(`<path d="M3.5 7A1.5 1.5 0 0 1 5 5.5h4.3l2 2.2H19a1.5 1.5 0 0 1 1.5 1.5v8.3A1.5 1.5 0 0 1 19 19H5a1.5 1.5 0 0 1-1.5-1.5z"/>`),
    folderPlus: svg(`<path d="M3.5 7A1.5 1.5 0 0 1 5 5.5h4.3l2 2.2H19a1.5 1.5 0 0 1 1.5 1.5v8.3A1.5 1.5 0 0 1 19 19H5a1.5 1.5 0 0 1-1.5-1.5z"/><path d="M12 10.5v5M9.5 13h5"/>`),
    sort: svg(`<path d="M7 5v14M4 16l3 3 3-3M13 7h7M13 12h5M13 17h3"/>`),
    play: svg(`<path class="fill" d="M8.5 6.2v11.6a.9.9 0 0 0 1.4.8l9.1-5.8a.9.9 0 0 0 0-1.6L9.9 5.4a.9.9 0 0 0-1.4.8z"/>`),
  };

  /* Как засчитывается тема. Подписи — для составителя (t, s) и для
     мастера (my): мастеру важно не устройство, а что ему сделать. */
  const MODES = {
    view: { t: "Просмотреть материалы", s: "засчитается само, когда всё просмотрено: PDF — до последнего листа, видео — до конца",
            my: "Тема засчитается сама, когда вы просмотрите материалы", short: "просмотр", ic: "eye" },
    confirm: { t: "Подтвердить «Ознакомлен»", s: "кнопкой после открытия материалов; дата и время сохранятся, как подпись в листе ознакомления",
               my: "Изучите материалы и подтвердите, что ознакомились", short: "«ознакомлен»", ic: "sign" },
    proof: { t: "Прислать фото или скриншот", s: "встреча с руководителем, звонок, работа на объекте — снимок уходит на проверку",
             my: "Нужно подтверждение: фото или скриншот", short: "фото", ic: "camera" },
  };
  const AUD = { all: "Всем сотрудникам", new: "Новым сотрудникам", some: "Выбранным" };
  const ROLE = { dev_admin: "Dev Admin", admin: "Admin", user: "Сотрудник" };
  const DONE = ["done", "sent", "ok"];
  const SEEN = 0.9;
  const TRACKED = ["pdf", "video", "audio"];
  const PAGE_W = [480, 800, 1200, 1600];
  const PROOF_MAX = 8 * 1024 * 1024;
  const FILE_MAX = 512 * 1024 * 1024;

  const WIDE = matchMedia("(min-width: 1100px)");
  const FINE = matchMedia("(pointer: fine)");

  /* ── форматы ───────────────────────────────────────────────── */
  const pad = (n) => String(n).padStart(2, "0");
  const plural = (n, one, few, many) => {
    const a = Math.abs(n) % 100, b = a % 10;
    if (a > 10 && a < 20) return many;
    if (b > 1 && b < 5) return few;
    return b === 1 ? one : many;
  };
  const nTopics = (n) => `${n} ${plural(n, "тема", "темы", "тем")}`;
  const nDays = (n) => `${n} ${plural(n, "день", "дня", "дней")}`;
  const nMats = (n) => `${n} ${plural(n, "материал", "материала", "материалов")}`;
  const nPeople = (n) => `${n} ${plural(n, "человек", "человека", "человек")}`;

  function dt(iso) {
    const d = new Date(iso);
    return !iso || isNaN(d) ? "" : `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`;
  }
  /* Дата без времени (срок) — как есть, без часовых поясов. */
  function day(s) {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s || "");
    return m ? `${m[3]}.${m[2]}.${m[1]}` : "";
  }
  /* «сегодня 14:05», «вчера 09:12», «18.09 16:40», в прошлом году — с годом. */
  function stamp(iso) {
    const d = new Date(iso);
    if (!iso || isNaN(d)) return "";
    const now = new Date(), t = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
    const d0 = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const diff = Math.round((d0 - new Date(d.getFullYear(), d.getMonth(), d.getDate())) / 864e5);
    if (diff === 0) return "сегодня " + t;
    if (diff === 1) return "вчера " + t;
    if (d.getFullYear() === now.getFullYear()) return `${pad(d.getDate())}.${pad(d.getMonth() + 1)} ${t}`;
    return dt(iso);
  }
  function size(n) {
    if (!n) return "";
    if (n < 1024 * 1024) return Math.max(1, Math.round(n / 1024)) + " КБ";
    if (n < 1024 ** 3) return (n / 1024 / 1024).toFixed(n < 10 * 1024 * 1024 ? 1 : 0).replace(".", ",") + " МБ";
    return (n / 1024 ** 3).toFixed(1).replace(".", ",") + " ГБ";
  }
  function clock(sec) {
    sec = Math.max(0, Math.round(sec || 0));
    const h = Math.floor(sec / 3600), m = Math.floor(sec % 3600 / 60), s = sec % 60;
    return h ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
  }
  function mins(sec) {
    sec = Math.round(sec || 0);
    if (sec < 60) return sec + " сек";
    const m = Math.round(sec / 60);
    return m < 60 ? m + " мин" : `${Math.floor(m / 60)} ч ${m % 60 ? (m % 60) + " мин" : ""}`.trim();
  }
  const ext = (name) => ((/\.([a-z0-9]+)$/i.exec(name || "") || [])[1] || "").toUpperCase();

  /* Текст темы и описания — простая разметка, которую удобно набирать
     прямо в поле: абзацы; списки «- …»; шаги «1. …»; подзаголовок «## …»;
     **жирное**; плашки «! …» — важно и «> …» — совет. Ссылки — живые. */
  const linkify = (t) => esc(t).replace(
    /https?:\/\/[^\s<]+?(?=(?:&quot;|&gt;|&lt;|[.,;:!?)»]*(?:\s|<|$)))/g,
    (u) => `<a href="${u}" target="_blank" rel="noopener">${u}</a>`);
  const inline = (t) => linkify(t).replace(/\*\*([^*\n]+?)\*\*/g, "<b>$1</b>");
  function textHtml(s) {
    let out = "", list = "", para = [];
    const flush = () => { if (para.length) { out += `<p>${para.join("<br>")}</p>`; para = []; } };
    const close = () => { if (list) { out += `</${list}>`; list = ""; } };
    const open = (tag, start) => {
      flush();
      if (list === tag) return;
      close();
      out += tag === "ol" && start > 1 ? `<ol start="${start}" style="counter-reset:n ${start - 1}">` : `<${tag}>`;
      list = tag;
    };
    for (const raw of String(s || "").split("\n")) {
      const ln = raw.trim();
      let m = /^[-•*–]\s+(.*)$/.exec(ln);
      if (m) { open("ul"); out += `<li>${inline(m[1])}</li>`; continue; }
      m = /^(\d{1,2})[.)]\s+(.*)$/.exec(ln);
      if (m) { open("ol", Number(m[1])); out += `<li>${inline(m[2])}</li>`; continue; }
      close();
      m = /^#{2,3}\s+(.*)$/.exec(ln);
      if (m) { flush(); out += `<h4>${inline(m[1])}</h4>`; continue; }
      m = /^([!>])\s+(.*)$/.exec(ln);
      if (m) { flush(); out += `<p class="ln-note${m[1] === "!" ? " warn" : ""}">${inline(m[2])}</p>`; continue; }
      if (!ln) { flush(); continue; }
      para.push(inline(ln));
    }
    flush();
    close();
    return out;
  }

  /* ── состояние ─────────────────────────────────────────────── */
  let DATA = null, ERR = "", SEQ = 0;
  let IT = new Map();            // материалы библиотеки по id
  let R = { tab: "", id: "", sub: "" };
  let PV = "";                   // программа «глазами мастера» для составителя
  let MODE = "";                 // составитель: learn — «Моё обучение», manage — «Управление»
  let MTAB = "progs";            // последняя вкладка «Управления» — туда и вернёмся
  let PERSON = null;             // сотрудник подробно (Сотрудники → человек)
  let LQ = "";                   // «Материалы»: поиск по всей библиотеке
  let LSORT = "name";            // «Материалы»: name — по названию, new — сначала новые
  let PQ = "", PF = "all";       // «Сотрудники»: поиск и отбор
  let CF = "wait";               // «Проверка»: ждут или проверенные
  let OUTLINE = false;           // содержание программы на телефоне раскрыто
  let SHOW_DONE = false;         // пройденные программы раскрыты
  let EDIT_PROOF = "";           // отправленное подтверждение правят заново
  let FOCUS = "";                // что подхватить фокусом после отрисовки
  const PROOF_NOTE = {};         // черновики комментариев к фото
  const OPENED = new Set();      // темы, открытие которых уже отмечено
  const QUEUE = [];              // загрузки: {file, loaded, state, error, folder, topic, step, replace}
  let pumping = false;
  let VW = null;                 // открытый материал
  let DRAG = null, DROP = null;  // перетаскивание в конструкторе

  /* Где мы — в адресе: #lrn/<вкладка>/<id>/<ещё>. p — программа, s —
     тема, e — конструктор программы. */
  function parse(h) {
    const m = /^#lrn(?:\/([a-z]+))?(?:\/([\w-]+))?(?:\/([\w-]+))?$/.exec(h || "");
    return m ? { tab: m[1] || "", id: m[2] || "", sub: m[3] || "" } : null;
  }
  const hashOf = (r) => "#lrn" + (r.tab ? "/" + r.tab : "") + (r.id ? "/" + r.id : "")
    + (r.sub ? "/" + r.sub : "");
  const href = (r) => "?s=lrn" + hashOf(r);
  // Читаем при загрузке скрипта: app.js перепишет адрес раньше, чем раздел откроется.
  let START = parse(location.hash);
  try { LSORT = localStorage.getItem("ln-sort") === "new" ? "new" : "name"; } catch (e) { /* без памяти */ }
  try { MODE = { learn: "learn", manage: "manage" }[localStorage.getItem("ln-mode")] || ""; } catch (e) { /* без памяти */ }

  const isOn = () => document.documentElement.dataset.sec === "lrn";
  const progOf = (id) => (DATA ? DATA.programs.find((p) => p.id === id) : null);
  const mprog = (id) => (DATA && DATA.manage ? DATA.manage.programs.find((p) => p.id === id) : null);
  const itemOf = (id) => IT.get(id) || null;
  /* Составитель открывает раздел в том режиме, где был в прошлый раз; в
     первый раз — в своём обучении, если ему что-то назначено. */
  const defTab = () => {
    if (!DATA || !DATA.admin) return "my";
    const m = MODE || (mine().some((p) => !p.complete) ? "learn" : "manage");
    return m === "learn" ? "my" : "progs";
  };
  const mine = () => (DATA ? DATA.programs.filter((p) => !p.preview) : []);
  /* Программы на экране «Моё обучение». На вкладке «Глазами мастера» у
     составителя — все идущие: их можно открыть и пройти для проверки, в
     отчёты это не идёт. */
  const eyeOn = () => !!(DATA && DATA.admin && R.tab === "eye");
  const myProgs = () => (eyeOn()
    ? DATA.programs.filter((p) => !p.preview || p.status === "live") : mine());
  function setMode(m) {
    if (MODE === m) return;
    MODE = m;
    try { localStorage.setItem("ln-mode", m); } catch (e) { /* без памяти */ }
  }
  const reviewWait = () => (DATA && DATA.manage ? DATA.manage.review.filter((r) => r.status === "sent") : []);
  const stepsOf = (p) => p.chapters.reduce((a, c) => a + c.steps.length, 0);

  function findStep(sid) {
    for (const p of DATA ? DATA.programs : []) {
      const flat = [];
      p.chapters.forEach((ch) => ch.steps.forEach((s) => flat.push({ ch, s })));
      const i = flat.findIndex((x) => x.s.id === sid);
      if (i >= 0) return { p, ch: flat[i].ch, s: flat[i].s, i, flat: flat.map((x) => x.s) };
    }
    return null;
  }
  const mprogOfStep = (sid) => (DATA && DATA.manage ? DATA.manage.programs.find((p) =>
    p.chapters.some((c) => c.steps.some((s) => s.id === sid))) : null);

  /* ── данные ────────────────────────────────────────────────── */
  async function fetchAll() {
    const seq = ++SEQ;
    try {
      const d = await AUTH.api("GET", "/learn" + (PV ? "?preview=" + encodeURIComponent(PV) : ""));
      if (seq !== SEQ) return;
      DATA = d;
      ERR = "";
      IT = new Map(d.items.map((x) => [x.id, x]));
    } catch (e) {
      if (seq === SEQ) ERR = e.message;
    }
    badge();
  }

  async function reload() {
    await fetchAll();
    if (PERSON && R.tab === "people" && R.id) await loadPerson();
    if (isOn()) render();
  }

  async function loadPerson() {
    try {
      PERSON = await AUTH.api("GET", "/learn/people/" + encodeURIComponent(R.id));
    } catch (e) {
      PERSON = { error: e.message, user: { id: R.id } };
    }
  }

  /* Что нужно экрану сверх общего ответа: сотрудник подробно, программа
     глазами мастера для составителя. */
  async function needs() {
    if (!DATA) return;
    // «Глазами мастера» у составителя — все идущие программы.
    if (DATA.admin && R.tab === "eye" && PV !== "all") {
      PV = "all";
      await fetchAll();
    }
    if (DATA.admin && (R.tab === "p" || R.tab === "s")) {
      const pid = R.tab === "p" ? R.id : ((mprogOfStep(R.id) || {}).id || "");
      if (pid && !progOf(pid) && PV !== pid) {
        PV = pid;
        await fetchAll();
      }
    }
    if (R.tab === "people" && R.id && DATA.admin && (!PERSON || PERSON.user.id !== R.id)) {
      PERSON = null;
      render();
      await loadPerson();
    }
  }

  /* Мастер открыл тему: «начал». Тема «просмотреть» без материалов или с
     уже просмотренными засчитывается тут же. */
  async function touchStep() {
    if (R.tab !== "s" || !DATA) return;
    const f = findStep(R.id);
    if (!f || OPENED.has(f.s.id) || (f.s.locked && !DATA.admin)) return;
    OPENED.add(f.s.id);
    if (DONE.includes(f.s.status) || (f.s.status && f.s.mode !== "view")) return;
    try {
      const st = await AUTH.api("POST", "/learn/steps/" + f.s.id + "/open");
      if (st.status !== f.s.status) {
        if (st.status === "done") toast("Тема засчитана");
        await reload();
      }
    } catch (e) { /* закрыта по порядку — экран это и показывает */ }
  }

  /* Счётчик у пункта меню: мастеру — программы в работе, составителю —
     подтверждения, которые ждут проверки. */
  function badge() {
    const a = document.querySelector('.side a[data-s="lrn"]');
    if (!a) return;
    const n = !DATA ? 0 : DATA.admin ? reviewWait().length : mine().filter((p) => !p.complete).length;
    let b = $q(".nav-badge", a);
    if (!n) { if (b) b.remove(); return; }
    if (!b) {
      b = document.createElement("span");
      b.className = "nav-badge";
      a.appendChild(b);
    }
    b.textContent = n > 99 ? "99+" : String(n);
    b.title = DATA.admin ? "Подтверждения ждут проверки" : "Программы обучения в работе";
  }

  /* ── переходы ──────────────────────────────────────────────── */
  function go(r, replace) {
    flushAll();
    R = { tab: r.tab || "", id: r.id || "", sub: r.sub || "" };
    const url = location.pathname + location.search + hashOf(R);
    if (replace) history.replaceState({ ln: 1 }, "", url);
    else history.pushState({ ln: 1 }, "", url);
    show();
  }

  async function show() {
    OUTLINE = false;
    render();
    await needs();
    render();
    touchStep();
  }

  window.addEventListener("popstate", (e) => {
    if (!isOn()) return;
    // «Назад» на телефоне закрывает открытый материал, а не уводит со страницы.
    if (VW) { shut(); return; }
    if (e.state && e.state.lnv) return;
    const r = parse(location.hash);
    if (r) { R = r; show(); }
  });

  async function load() {
    ensureHost();
    if (START) { R = START; START = null; }
    history.replaceState({ ln: 1 }, "", location.pathname + location.search + hashOf(R));
    render();
    await fetchAll();
    await needs();
    render();
    touchStep();
  }

  /* ── отрисовка ─────────────────────────────────────────────── */
  function render() {
    const host = $q("#sec-lrn");
    if (!host) return;
    const keep = keepFocus(host);
    const key = hashOf(R);
    const same = render.key === key;
    const scrolls = {};
    $qa("[data-keep]", host).forEach((el) => { scrolls[el.dataset.keep] = el.scrollTop; });
    // Видео урока переживает перерисовку: тема засчиталась или пришли
    // свежие данные — а оно играет дальше, не с начала и без паузы.
    const hv = $q("video[data-hero]", host), playing = hv && !hv.paused;
    host.innerHTML = pageHtml();
    if (hv) {
      const slot = $q(`video[data-hero="${hv.dataset.hero}"]`, host);
      if (slot) {
        slot.replaceWith(hv);
        if (playing) hv.play().catch(() => {});
      } else dropHero(hv);
    }
    wireHero(host);
    $qa("[data-keep]", host).forEach((el) => {
      if (same && scrolls[el.dataset.keep] !== undefined) el.scrollTop = scrolls[el.dataset.keep];
    });
    // Текущая тема в содержании сбоку — на виду.
    const side = $q(".ln-side", host), cur = side && $q(".ln-srow.cur", side);
    if (cur && !same) side.scrollTop = Math.max(0, cur.offsetTop - side.clientHeight / 2);
    render.key = key;
    keep();
    if (FOCUS) {
      const el = $q(FOCUS, host);
      FOCUS = "";
      if (el) { el.focus(); if (el.select) el.select(); }
    }
  }

  /* Учёт у видео урока: досмотренное уходит на сервер, подпись под видео
     растёт. Фото урока считаем просмотренным, раз оно на странице. */
  function wireHero(host) {
    const v = $q("video[data-hero]", host);
    if (v && !v._tr) {
      const it = itemOf(v.dataset.hero);
      if (it) {
        v._tr = tracker(it, { quiet: true });
        ACTIVE.add(v._tr);
        wireMedia(v, v._tr, () => {
          const m = $q("#sec-lrn [data-hero-meta]");
          if (m) m.textContent = heroMeta(v._tr.it, v._tr.seen);
        }, () => {
          const e = $q("#sec-lrn [data-hero-err]");
          if (e) e.hidden = false;
        });
      }
    }
    const img = $q(".ln-lm-img[data-open]", host);
    const it = img && itemOf(img.dataset.open);
    if (it && !(it.seen > 0)) track(it, 1, 0, false, true);
  }

  function dropHero(v) {
    if (v._tr) {
      clearTimeout(v._tr.t);
      save(v._tr, true);
      ACTIVE.delete(v._tr);
    }
    try { v.pause(); } catch (e) { /* уже */ }
  }

  function keepFocus(host) {
    const el = document.activeElement;
    if (!el || !host.contains(el) || !/^(INPUT|TEXTAREA)$/.test(el.tagName)) return () => {};
    const attrs = ["id", "data-f", "data-p", "data-proof-note", "data-ch-title"];
    const a = attrs.find((x) => el.hasAttribute(x));
    if (!a) return () => {};
    const sel = a === "id" ? "#" + el.id : `[${a}="${el.getAttribute(a)}"]`;
    let s0 = null, s1 = null;
    try { s0 = el.selectionStart; s1 = el.selectionEnd; } catch (e) { /* не текст */ }
    return () => {
      const n = $q(sel, host);
      if (!n) return;
      n.focus({ preventScroll: true });
      try { if (s0 !== null) n.setSelectionRange(s0, s1); } catch (e) { /* не текст */ }
    };
  }

  function pageHtml() {
    if (!DATA) {
      return `<div class="pg ln"><div class="ln-load">${ERR
        ? `<p>${esc(ERR)}</p><button type="button" class="btn-ghost" data-retry>Повторить</button>`
        : `<span class="ln-spin"></span><span>Загружаю обучение…</span>`}</div></div>`;
    }
    const t = R.tab || defTab();
    if (t === "p") return programPage();
    if (t === "s") return stepPage();
    if (t === "e" && DATA.admin) return builderPage();
    if (t === "people" && R.id && DATA.admin) return personPage();
    let body;
    if (t === "lib") body = libHtml();
    else if (t === "progs" && DATA.admin) body = progsHtml();
    else if (t === "people" && DATA.admin) body = peopleHtml();
    else if (t === "check" && DATA.admin) body = checkHtml();
    else if (t === "eye" && DATA.admin) body = myHtml(true);
    else body = myHtml(false);
    return `<div class="pg ln">${tabsHtml(t)}<div class="pg-body ln-scroll" data-keep="main">${body}</div></div>`;
  }

  /* Вкладки. У составителя сверху два режима (пользователь, 02.10.2026):
     «Моё обучение» — свои программы, как у мастера, и «Управление» —
     программы, материалы, люди, проверка и «Глазами мастера». Составитель
     тоже учится: ему назначают поимённо или он записывается сам. */
  function tabsHtml(cur) {
    const tab = ([k, t, n, ic]) => `<a class="pg-tab${cur === k ? " on" : ""}${ic ? " ln-tab-ic" : ""}" href="${
      href({ tab: k })}"${cur === k ? ' aria-current="page"' : ""}>${ic || ""}${esc(t)}${
      n ? `<b class="ln-tab-n">${n}</b>` : ""}</a>`;
    if (!DATA.admin) {
      return `<nav class="pg-tabs ln-tabs" aria-label="Обучение">${
        [["my", "Моё обучение"], ["lib", "Материалы"]].map(tab).join("")}</nav>`;
    }
    const learn = cur === "my";
    if (!learn) MTAB = cur;
    setMode(learn ? "learn" : "manage");
    const open = mine().filter((p) => !p.complete).length, wait = reviewWait().length;
    const sub = [["progs", "Программы"], ["lib", "Материалы"], ["people", "Сотрудники"],
      ["check", "Проверка", wait], ["eye", "Глазами мастера", 0, ICO.eye]];
    return `<div class="pg-tabs ln-tabs has-sw${learn ? " solo" : ""}">
      <nav class="ln-sw" aria-label="Режим раздела">
        <a class="ln-sw-b${learn ? " on" : ""}" href="${href({ tab: "my" })}"${learn ? ' aria-current="page"' : ""}
          title="Программы, назначенные вам">${ICO.cap}<span>Моё обучение</span>${
          !learn && open ? `<b class="ln-tab-n">${open}</b>` : ""}</a>
        <a class="ln-sw-b${learn ? "" : " on"}" href="${href({ tab: learn ? MTAB : "progs" })}"${learn ? "" : ' aria-current="true"'}
          title="Программы, материалы, сотрудники и проверка">${ICO.sliders}<span>Управление</span>${
          learn && wait ? `<b class="ln-tab-n" title="Ждут проверки">${wait}</b>` : ""}</a>
      </nav>
      ${learn ? "" : `<nav class="ln-sub" aria-label="Управление обучением">${sub.map(tab).join("")}</nav>`}
    </div>`;
  }

  /* Шапка глубокого экрана: назад, название, справа — что есть. */
  function stripHtml(back, title, extra, backTitle) {
    return `<div class="pg-head strip ln-strip">
      <a class="pg-back" href="${href(back)}" title="${esc(backTitle || "Назад")}" aria-label="${esc(backTitle || "Назад")}">${ICO.back}</a>
      <div class="pg-h1"><h2>${esc(title)}</h2></div>
      ${extra || ""}
    </div>`;
  }

  function missingPage(text, back) {
    return `<div class="pg ln">${stripHtml(back, "Обучение")}<div class="pg-body ln-scroll">
      <div class="ln-wrap"><div class="ln-empty"><span class="ln-empty-ic">${ICO.cap}</span>
      <b>${esc(text)}</b><a class="btn-ghost" href="${href(back)}">Вернуться</a></div></div></div></div>`;
  }

  /* ── кусочки ───────────────────────────────────────────────── */
  const barHtml = (pct, cls) => `<span class="ln-bar ${cls || ""}"><i style="width:${
    Math.max(0, Math.min(100, Math.round(pct || 0)))}%"></i></span>`;

  function ringHtml(pct) {
    const c = 2 * Math.PI * 26;
    return `<span class="ln-ring" aria-label="Пройдено ${pct}%"><svg viewBox="0 0 64 64">
      <circle cx="32" cy="32" r="26" class="ln-ring-bg"/>
      <circle cx="32" cy="32" r="26" class="ln-ring-fg" stroke-dasharray="${c.toFixed(1)}"
        stroke-dashoffset="${(c * (1 - (pct || 0) / 100)).toFixed(1)}"/></svg><b>${pct}%</b></span>`;
  }

  function avatarHtml(u) {
    const name = u.name || u.username || "?";
    if (u.avatar && typeof AUTH.avatarUrl === "function") {
      return `<span class="ln-av"><img src="${esc(AUTH.avatarUrl(u.id, u.avatar))}" alt=""></span>`;
    }
    const ini = name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
    return `<span class="ln-av">${esc(ini || "?")}</span>`;
  }

  const tip = (text) => (typeof TIPS === "object" ? TIPS.icon(text) : "");
  const typeIco = (it) => ICO[it.type] || ICO.doc;
  const modeIco = (m) => ICO[(MODES[m] || MODES.view).ic];

  function itemShort(it) {
    if (it.type === "pdf") return it.pages ? `PDF, ${it.pages} ${plural(it.pages, "лист", "листа", "листов")}` : "PDF";
    if (it.type === "video") return it.duration ? "видео " + mins(it.duration) : "видео";
    if (it.type === "audio") return it.duration ? "аудио " + mins(it.duration) : "аудио";
    if (it.type === "image") return "фото";
    if (it.type === "link") return "ссылка";
    return ext(it.filename) || "файл";
  }
  function itemLong(it) {
    let host = "";
    try { host = it.url ? new URL(it.url).host.replace(/^www\./, "") : ""; } catch (e) { host = ""; }
    const parts = {
      pdf: ["PDF", it.pages ? `${it.pages} ${plural(it.pages, "лист", "листа", "листов")}` : "", size(it.size)],
      video: ["Видео", it.duration ? clock(it.duration) : "", size(it.size)],
      audio: ["Аудио", it.duration ? clock(it.duration) : "", size(it.size)],
      image: ["Фото", size(it.size)],
      link: ["Ссылка", host],
      doc: [ext(it.filename) || "Файл", size(it.size), "скачать"],
    }[it.type] || [size(it.size)];
    return parts.filter(Boolean).join(" · ");
  }
  const actWord = (it) => ({ pdf: "Читать", video: "Смотреть", audio: "Слушать", image: "Открыть",
                             link: "Перейти", doc: "Скачать" }[it.type] || "Открыть");

  function stepMeta(s) {
    const items = s.items.map(itemOf).filter(Boolean);
    const parts = items.slice(0, 3).map(itemShort);
    if (items.length > 3) parts.push("ещё " + (items.length - 3));
    if (s.mode === "confirm") parts.push("«ознакомлен»");
    if (s.mode === "proof") parts.push("фото на проверку");
    const t = parts.join(" · ");
    return t ? t[0].toUpperCase() + t.slice(1) : "Текст темы";
  }

  /* Состояние программы для плашки: одно слово и цвет. */
  function progState(p) {
    if (p.complete) return p.sent ? { cls: "wait", label: "На проверке" } : { cls: "ok", label: "Пройдено" };
    if (p.back) return { cls: "bad", label: "Вернули тему" };
    if (p.overdue) return { cls: "bad", label: "Просрочено" };
    if (p.started) return { cls: "go", label: "В процессе" };
    return { cls: "new", label: "Не начато" };
  }

  /* Номер темы, как в курсах: «глава.тема» — 1.2. */
  function numbers(p) {
    const out = new Map();
    p.chapters.forEach((ch, ci) => ch.steps.forEach((x, si) => out.set(x.id, `${ci + 1}.${si + 1}`)));
    return out;
  }

  /* Состояние темы: значок, цвет и подпись. n — номер темы. */
  function stepState(s, n) {
    if (s.locked) return { cls: "lock", ic: ICO.lock, tag: "" };
    if (s.status === "ok") return { cls: "ok", ic: ICO.check, tag: "Принято" };
    if (s.status === "done") return { cls: "ok", ic: ICO.check, tag: "" };
    if (s.status === "sent") return { cls: "wait", ic: ICO.clock, tag: "На проверке" };
    if (s.status === "back") return { cls: "bad", ic: ICO.undo, tag: "Вернули" };
    if (s.status === "open" || s.opened) return { cls: "go", ic: `<b>${n}</b>`, tag: "" };
    return { cls: "new", ic: `<b>${n}</b>`, tag: "" };
  }

  function dueHtml(p) {
    if (p.complete) return `<span class="ln-due ok">${ICO.checkc}пройдено ${esc(dt(p.finished))}</span>`;
    if (!p.due_at) return `<span class="ln-due">без срока</span>`;
    if (p.overdue) {
      return `<span class="ln-due bad">${ICO.cal}срок был ${esc(day(p.due_at))} · просрочено на ${nDays(-p.left)}</span>`;
    }
    const left = p.left === 0 ? "сегодня последний день" : `осталось ${nDays(p.left)}`;
    return `<span class="ln-due${p.left <= 3 ? " warn" : ""}">${ICO.cal}до ${esc(day(p.due_at))} · ${left}</span>`;
  }

  const statusChip = (st) => ({
    live: `<span class="ln-chip ok">Идёт</span>`,
    draft: `<span class="ln-chip new">Черновик</span>`,
    archive: `<span class="ln-chip new">В архиве</span>`,
  }[st] || "");

  /* ── мастер: моё обучение ──────────────────────────────────── */
  /* Встречаем по имени и по времени суток — как на обучающих платформах
     (пользователь прислал Skillbox: «нравится приветственный экран под
     мастера»). Имя — из учётки: «Иван Петров» и «Петров Иван» оба дают
     «Иван»; без имени — просто «Добрый день!». */
  const NAMES = new Set(("александр алексей анатолий андрей антон аркадий артем богдан борис вадим валентин "
    + "валерий василий виктор виталий владимир владислав всеволод вячеслав геннадий георгий глеб григорий даниил "
    + "данил денис дмитрий евгений егор захар иван игорь илья кирилл константин лев леонид максим марк матвей "
    + "михаил никита николай олег павел петр роман руслан святослав семен сергей станислав степан тимофей тимур "
    + "федор эдуард юрий ярослав алена алина алла анастасия ангелина анна валентина валерия вера вероника виктория "
    + "галина дарья диана евгения екатерина елена елизавета жанна инна ирина карина кира кристина ксения лариса "
    + "лидия любовь людмила маргарита марина мария надежда наталья наталия нина оксана олеся ольга полина раиса "
    + "светлана софия софья таисия тамара татьяна ульяна юлия яна").split(" "));
  const SURNAME = /(ов|ев|ёв|ин|ын|ский|цкий|ова|ева|ёва|ская|цкая)$/i;
  function firstName(full) {
    const all = String(full || "").trim().split(/\s+/).filter(Boolean);
    const w = all.filter((x) => !/\./.test(x) && x.length > 1);      // без инициалов «Г.»
    const known = w.find((x) => NAMES.has(x.toLowerCase().replace(/ё/g, "е")));
    if (known) return known;
    if (w.length >= 2) return SURNAME.test(w[0]) && !SURNAME.test(w[1]) ? w[1] : w[0];
    if (w.length === 1 && !(all.length > 1 && SURNAME.test(w[0]))) return w[0];
    return "";
  }
  function hello() {
    const h = new Date().getHours();
    return h < 5 ? "Доброй ночи" : h < 12 ? "Доброе утро" : h < 18 ? "Добрый день" : h < 23 ? "Добрый вечер" : "Доброй ночи";
  }
  const PHRASES = [
    "Сегодня хороший день, чтобы узнать новое или закрепить знания на объекте.",
    "Пара тем сейчас — меньше вопросов на объекте потом.",
    "Продолжайте с того места, где остановились: всё сохранено.",
    "Хороший мастер учится всегда — даже когда уже всё знает.",
    "Несколько минут на тему — и на объекте меньше неожиданностей.",
  ];

  function greetHtml(ps, say) {
    const me = AUTH.current() || {};
    const name = firstName(me.username);
    const dno = Math.floor(Date.now() / 864e5);
    const total = ps.reduce((a, p) => a + p.total, 0), ok = ps.reduce((a, p) => a + p.done, 0);
    const due = ps.filter((p) => !p.complete && p.due_at).map((p) => p.due_at).sort()[0];
    return `<div class="ln-greet">
      <h2>${name ? `${esc(name)}, ${hello().toLowerCase()}!` : `${hello()}!`}</h2>
      <p>${esc(say || (ps.length ? PHRASES[dno % PHRASES.length]
        : "Обучение вам пока не назначено — загляните в материалы: там всё, что загрузили для мастеров."))}</p>
      ${ps.length ? `<div class="ln-greet-m">
        <span>${ICO.cap}${ps.length} ${plural(ps.length, "программа", "программы", "программ")}</span>
        <span>${ICO.checkc}пройдено ${ok} из ${total} ${plural(total, "темы", "тем", "тем")}</span>
        ${due ? `<span>${ICO.cal}ближайший срок ${esc(dayShort(due))}</span>` : ""}
      </div>` : ""}
    </div>`;
  }
  const dayShort = (s) => { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s || ""); return m ? `${m[3]}.${m[2]}` : ""; };

  /* eye — вкладка «Глазами мастера» у составителя: все идущие программы. */
  function myHtml(eye) {
    const ps = myProgs();
    const pv = eye ? `<div class="ln-pvbar">${ICO.eye}<span><b>Так раздел видит мастер.</b>
      Здесь все идущие программы — можно открыть и пройти любую тему, посмотреть урок и «Продолжить просмотр».
      Отметки в программах, которые вам не назначены, — только для проверки: в «Сотрудников» и «Проверку» они
      не попадают.</span></div>` : "";
    // Составителю в своём обучении — ещё и идущие программы, на которые он не записан.
    const more = DATA.admin && !eye ? DATA.manage.programs.filter((p) => p.status === "live" && !progOf(p.id)) : [];
    const joins = more.length ? `<div class="ln-h">${ps.length ? "Можно записаться ещё" : "Идущие программы"} <i>${more.length}</i></div>
      <div class="ln-cards">${more.map(joinHtml).join("")}</div>` : "";
    if (!ps.length && DATA.admin && !eye) {
      return `<div class="ln-wrap ln-my">${greetHtml(ps, "Здесь ваше собственное обучение — как у мастера: темы по порядку, "
        + "уроки, «Продолжить просмотр» и полоса прогресса.")}
        ${more.length ? `<div class="ln-pvbar">${ICO.cap}<span><b>Вам пока ничего не назначено.</b>
          Программы «Всем сотрудникам» идут мастерам, а руководителям — только поимённо. Запишитесь на любую идущую
          программу — она появится здесь, а ваш прогресс — в «Сотрудниках», как у мастеров. Выйти — в программе:
          «Кому» → убрать себя.</span></div>${joins}` : `<div class="ln-empty">
          <span class="ln-empty-ic">${ICO.cap}</span>
          <b>Вам пока ничего не назначено</b>
          <p>Идущих программ пока нет. Когда опубликуете программу, сюда можно будет записаться и пройти её самому.</p>
          <a class="btn-brand" href="${href({ tab: "progs" })}">${ICO.sliders}К программам</a>
        </div>`}
        ${continueHtml()}</div>`;
    }
    if (!ps.length && DATA.admin) {
      return `<div class="ln-wrap ln-my">${pv}${greetHtml(ps)}<div class="ln-empty">
        <span class="ln-empty-ic">${ICO.eye}</span>
        <b>Идущих программ пока нет</b>
        <p>Опубликуйте программу — и она появится здесь так, как её увидит мастер: с приветствием, следующей
          темой и уроками.</p>
        <a class="btn-brand" href="${href({ tab: "progs" })}">${ICO.cap}К программам</a>
      </div></div>`;
    }
    if (!ps.length) {
      return `<div class="ln-wrap ln-my">${greetHtml(ps)}<div class="ln-empty">
        <span class="ln-empty-ic">${ICO.cap}</span>
        <b>Обучение вам пока не назначено</b>
        <p>Когда руководитель назначит программу, она появится здесь: темы по порядку и полоса — сколько
          пройдено. А пока загляните в материалы — там всё, что загрузили для мастеров.</p>
        <a class="btn-brand" href="${href({ tab: "lib" })}">${ICO.lib}Открыть материалы</a>
      </div>${continueHtml()}</div>`;
    }
    const open = ps.filter((p) => !p.complete), done = ps.filter((p) => p.complete);
    const urgent = (p) => [p.back ? 0 : 1, p.overdue ? 0 : 1, p.started ? 0 : 1, p.due_at || "9999"];
    const cmp = (a, b) => { for (let i = 0; i < a.length; i++) { if (a[i] < b[i]) return -1; if (a[i] > b[i]) return 1; } return 0; };
    open.sort((a, b) => cmp(urgent(a), urgent(b)) || (Date.parse(b.last) || 0) - (Date.parse(a.last) || 0));
    return `<div class="ln-wrap ln-my">
      ${pv}
      <div class="ln-top">${greetHtml(ps)}${open.length ? heroHtml(open[0]) : doneHeroHtml()}</div>
      ${continueHtml()}
      ${open.length ? `<div class="ln-h">Мои программы <i>${open.length}</i></div>
        <div class="ln-cards">${open.map(cardHtml).join("")}</div>` : ""}
      ${done.length ? `<button type="button" class="ln-h ln-h-tog${SHOW_DONE ? " on" : ""}" data-tog-done
          aria-expanded="${SHOW_DONE}">${ICO.chev}Пройдено <i>${done.length}</i></button>
        ${SHOW_DONE || !open.length ? `<div class="ln-cards">${done.map(cardHtml).join("")}</div>` : ""}` : ""}
      ${joins}
    </div>`;
  }

  /* Составитель записывается на программу сам — поимённо, как назначают
     руководителю. Дальше она идёт у него, как у мастера, а прогресс виден
     в «Сотрудниках». */
  function joinHtml(p) {
    return `<div class="ln-pcard ln-join c${(p.color || 0) % 8}">
      <span class="ln-pcard-ic">${ICO.cap}</span>
      <span class="ln-pcard-b">
        <span class="ln-pcard-t"><b>${esc(p.title)}</b></span>
        ${p.about ? `<i class="ln-pcard-a">${esc(p.about)}</i>` : ""}
        <span class="ln-pcard-m"><span class="ln-due">${ICO.list}${p.chapters.length} ${
          plural(p.chapters.length, "глава", "главы", "глав")} · ${nTopics(stepsOf(p))}</span>${
          p.due_days ? `<span class="ln-due">${ICO.cal}срок ${nDays(p.due_days)}</span>` : ""}</span>
        <span class="ln-join-a"><button type="button" class="btn-ghost" data-join="${esc(p.id)}">${ICO.plus}Записаться</button></span>
      </span>
    </div>`;
  }

  /* «Продолжить просмотр» — начатые и не досмотренные видео, аудио и PDF,
     свежие первыми. Нажал — открывается тема, и материал идёт с того же
     места: видео урока — играет, PDF — с листа, где остановился. */
  function continueHtml() {
    const list = DATA.items.filter((it) => TRACKED.includes(it.type) && it.seen > 0 && it.seen < SEEN)
      .sort((a, b) => (b.seen_at || "").localeCompare(a.seen_at || "")).slice(0, 10);
    if (!list.length) return "";
    return `<section class="ln-cont">
      <div class="ln-cont-h"><h3>Продолжить просмотр</h3><span class="grow"></span>
        <button type="button" class="ln-cont-nav" data-cont="-1" aria-label="Листать назад">${ICO.back}</button>
        <button type="button" class="ln-cont-nav" data-cont="1" aria-label="Листать дальше">${ICO.next}</button></div>
      <div class="ln-cont-row">${list.map(contCardHtml).join("")}</div>
    </section>`;
  }

  /* Первая открытая тема моих программ, где лежит материал. */
  function placeOf(id) {
    for (const p of myProgs()) {
      for (const ch of p.chapters) for (const x of ch.steps) if (x.items.includes(id) && !x.locked) return { p, s: x };
    }
    return null;
  }

  function contCardHtml(it) {
    const at = placeOf(it.id);
    const pct = Math.round((it.seen || 0) * 100);
    const page = Math.max(1, Math.round(it.pos || 1));
    const left = it.type === "pdf" ? `лист ${page} из ${it.pages}`
      : it.duration ? `ещё ${mins(Math.max(1, it.duration * (1 - (it.seen || 0))))}` : `${pct}%`;
    const pic = it.type === "pdf" && it.pages ? pageUrl(it.id, page, 480)
      : it.type === "video" && it.poster ? thumbUrl(it, 640) : "";
    return `<button type="button" class="ln-cc t-${it.type}" data-resume="${esc(it.id)}"${at ? ` data-step="${esc(at.s.id)}"` : ""}>
      <span class="ln-cc-th">${pic ? `<img src="${esc(pic)}" alt="" loading="lazy">` : `<span class="ln-cc-ic">${typeIco(it)}</span>`}
        <span class="ln-cc-play">${it.type === "pdf" ? ICO.pdf : ICO.play}</span>
        <span class="ln-cc-left">${esc(left)}</span>
        <span class="ln-cc-bar"><i style="width:${pct}%"></i></span></span>
      <span class="ln-cc-k">${esc(at ? `${at.p.title} · тема ${numbers(at.p).get(at.s.id)}` : "Материалы")}</span>
      <b class="ln-cc-t">${esc(it.title)}</b>
    </button>`;
  }

  /* Следующий шаг — крупно: что за тема, где она и одна кнопка. Вернули —
     в первую очередь: это действие за мастером. */
  function heroHtml(p) {
    let s = null, ch = null, n = 0, i = 0;
    p.chapters.forEach((c) => c.steps.forEach((x) => {
      i += 1;
      if (!s && x.status === "back") { s = x; ch = c; n = i; }
    }));
    i = 0;
    if (!s) {
      p.chapters.forEach((c) => c.steps.forEach((x) => {
        i += 1;
        if (!s && x.id === p.next) { s = x; ch = c; n = i; }
      }));
    }
    if (!s) return "";
    const lead = s.status === "back" ? "Вернули на доработку" : p.started ? "Продолжить обучение" : "Начните обучение";
    const items = s.items.map(itemOf).filter(Boolean);
    return `<a class="ln-hero" href="${href({ tab: "s", id: s.id })}">
      <span class="ln-hero-b">
        <span class="ln-hero-k">${esc(lead)} · ${esc(p.title)}</span>
        <b class="ln-hero-t">${esc(s.title)}</b>
        <span class="ln-hero-m">${esc(ch.title)} · тема ${n} из ${p.total}${items.length ? " · " + esc(stepMeta(s).toLowerCase()) : ""}</span>
        <span class="ln-hero-cta">${s.status === "back" ? "Исправить" : p.started ? "Продолжить" : "Начать"}${ICO.next}</span>
      </span>
      ${ringHtml(p.pct)}
    </a>`;
  }

  function doneHeroHtml() {
    return `<div class="ln-hero done"><span class="ln-hero-b">
      <span class="ln-hero-k">Всё пройдено</span>
      <b class="ln-hero-t">Все программы пройдены — так держать</b>
      <span class="ln-hero-m">Новые программы появятся здесь, а материалы всегда под рукой во вкладке «Материалы».</span>
      </span><span class="ln-hero-ic">${ICO.trophy}</span></div>`;
  }

  function cardHtml(p) {
    const st = progState(p);
    return `<a class="ln-pcard c${(p.color || 0) % 8}" href="${href({ tab: "p", id: p.id })}">
      <span class="ln-pcard-ic">${ICO.cap}</span>
      <span class="ln-pcard-b">
        <span class="ln-pcard-t"><b>${esc(p.title)}</b><span class="ln-chip ${st.cls}">${st.label}</span></span>
        ${p.about ? `<i class="ln-pcard-a">${esc(p.about)}</i>` : ""}
        <span class="ln-pcard-p">${barHtml(p.pct, st.cls)}<em><b>${p.done}</b> из ${p.total}</em></span>
        <span class="ln-pcard-m">${dueHtml(p)}</span>
      </span></a>`;
  }

  /* ── мастер: программа ─────────────────────────────────────── */
  function programPage() {
    const p = progOf(R.id);
    if (!p) {
      if (DATA.admin && mprog(R.id)) {
        return `<div class="pg ln"><div class="ln-load"><span class="ln-spin"></span><span>Открываю глазами мастера…</span></div></div>`;
      }
      return missingPage("Программа не найдена или вам не назначена", { tab: "my" });
    }
    const st = progState(p);
    const fromTab = p.preview && PV === "all";
    const back = p.preview ? (fromTab ? { tab: "eye" } : { tab: "e", id: p.id }) : { tab: "my" };
    let nx = null;
    p.chapters.forEach((c) => c.steps.forEach((x) => { if (!nx && x.id === p.next) nx = x; }));
    return `<div class="pg ln">
      ${stripHtml(back, p.title, p.preview ? `<span class="ln-chip info ln-pv">${ICO.eye}Глазами мастера</span>` : "",
                  p.preview && !fromTab ? "К конструктору" : fromTab ? "Глазами мастера" : "Моё обучение")}
      <div class="pg-body ln-scroll" data-keep="main"><div class="ln-wrap ln-prog">
        <section class="ln-ph c${(p.color || 0) % 8}">
          <div class="ln-ph-b">
            <span class="ln-ph-ic">${ICO.cap}</span>
            <h2>${esc(p.title)}</h2>
            ${p.about ? `<div class="ln-text sm">${textHtml(p.about)}</div>` : ""}
            <div class="ln-ph-p">${barHtml(p.pct, st.cls)}<span><b>${p.pct}%</b> · пройдено ${p.done} из ${p.total}
              ${plural(p.total, "темы", "тем", "тем")}</span></div>
            <div class="ln-ph-m">${dueHtml(p)}${p.strict ? `<span class="ln-due">${ICO.lock}темы по порядку</span>` : ""}</div>
          </div>
          ${nx ? `<a class="btn-brand ln-cta" href="${href({ tab: "s", id: nx.id })}"><span>${
            p.started ? "Продолжить" : "Начать"}</span><i>${esc(nx.title)}</i>${ICO.next}</a>`
            : p.complete ? `<div class="ln-win">${ICO.trophy}<b>Программа пройдена</b><i>${esc(dt(p.finished))}</i></div>` : ""}
        </section>
        ${outlineHtml(p, "")}
      </div></div></div>`;
  }

  function outlineHtml(p, cur, compact) {
    const nums = numbers(p);
    return `<div class="ln-outline${compact ? " compact" : ""}">${compact ? `
      <div class="ln-side-h"><b>${esc(p.title)}</b>
        <span class="ln-side-p">${barHtml(p.pct, progState(p).cls)}<em>${p.done}/${p.total}</em></span></div>` : ""}
      ${p.chapters.map((ch) => {
        const ok = ch.steps.filter((s) => DONE.includes(s.status)).length;
        return `<section class="ln-ch">
          <div class="ln-ch-h"><b>${esc(ch.title)}</b><i>${ok} из ${ch.steps.length}</i></div>
          ${ch.steps.map((s) => {
            const st = stepState(s, nums.get(s.id));
            return `<a class="ln-srow ${st.cls}${s.id === cur ? " cur" : ""}" href="${href({ tab: "s", id: s.id })}">
              <span class="ln-sic ${st.cls}">${st.ic}</span>
              <span class="ln-srow-b"><b>${esc(s.title)}</b>${compact ? "" : `<i>${esc(stepMeta(s))}</i>`}</span>
              ${st.tag ? `<span class="ln-chip ${st.cls}">${st.tag}</span>` : compact ? "" : `<span class="ln-srow-go">${ICO.next}</span>`}
            </a>`;
          }).join("")}
        </section>`;
      }).join("")}
    </div>`;
  }

  /* ── мастер: тема ──────────────────────────────────────────── */
  function stepPage() {
    const f = findStep(R.id);
    if (!f) {
      if (DATA.admin && mprogOfStep(R.id)) {
        return `<div class="pg ln"><div class="ln-load"><span class="ln-spin"></span><span>Открываю глазами мастера…</span></div></div>`;
      }
      return missingPage("Тема не найдена или программа вам не назначена", { tab: "my" });
    }
    const { p, ch, s, i, flat } = f;
    const prev = flat[i - 1], next = flat[i + 1];
    const side = WIDE.matches;
    const locked = s.locked && !DATA.admin;
    const num = numbers(p).get(s.id);
    // Главный материал — сверху, как видео урока; остальные — списком ниже.
    const hero = locked ? null : heroOf(s);
    const rest = s.items.map(itemOf).filter((it) => it && it !== hero);
    return `<div class="pg ln">
      ${stripHtml({ tab: "p", id: p.id }, p.title, `${p.preview ? `<span class="ln-chip info ln-pv">${ICO.eye}Глазами мастера</span>` : ""}
        <span class="ln-strip-p">${barHtml(p.pct, progState(p).cls)}<em>${p.done} из ${p.total}</em></span>
        ${next ? `<a class="ln-ib ln-strip-nx" href="${href({ tab: "s", id: next.id })}" title="Дальше: ${esc(next.title)}"
          aria-label="Следующая тема">${ICO.next}</a>` : ""}`, "К программе")}
      <div class="ln-player${side ? " has-side" : ""}">
        ${side ? `<aside class="ln-side" data-keep="side">${outlineHtml(p, s.id, true)}</aside>` : ""}
        <div class="pg-body ln-scroll" data-keep="main"><article class="ln-step">
          ${side ? `<div class="ln-step-k">${esc(ch.title)} · тема ${i + 1} из ${flat.length}</div>` : `
          <button type="button" class="ln-toc${OUTLINE ? " on" : ""}" data-toc aria-expanded="${OUTLINE}">
            ${ICO.list}<span>Тема ${i + 1} из ${flat.length} · ${esc(ch.title)}</span>${ICO.chev}</button>
          ${OUTLINE ? `<div class="ln-toc-b">${outlineHtml(p, s.id, true)}</div>` : ""}`}
          <h1 class="ln-step-t"><span class="ln-num">${esc(num)}</span>${esc(s.title)}</h1>
          <div class="ln-mode m-${s.mode}">${modeIco(s.mode)}<span>${MODES[s.mode].my}</span></div>
          ${hero ? lessonMediaHtml(hero) : ""}
          ${s.body ? `${!locked && (hero || rest.length) && !/^#{2,3}\s/.test(s.body.trim()) ? `<h3 class="ln-sec">Что сделать</h3>` : ""}
            <div class="ln-text">${textHtml(s.body)}</div>` : ""}
          ${locked ? lockedHtml(p) : `${rest.length ? `${hero || s.body ? `<h3 class="ln-sec">${hero ? "Ещё материалы" : "Материалы"}</h3>` : ""}
            <div class="ln-mats">${rest.map(matHtml).join("")}</div>` : ""}${actHtml(p, s, next)}`}
          <nav class="ln-pn">
            ${prev ? `<a class="ln-pn-a" href="${href({ tab: "s", id: prev.id })}">${ICO.back}<span><i>Назад</i><b>${esc(prev.title)}</b></span></a>` : "<span></span>"}
            ${next ? `<a class="ln-pn-a nx" href="${href({ tab: "s", id: next.id })}"><span><i>Дальше</i><b>${esc(next.title)}</b></span>${ICO.next}</a>` : ""}
          </nav>
        </article></div>
      </div></div>`;
  }

  function lockedHtml(p) {
    return `<div class="ln-act lock"><div class="ln-act-t">${ICO.lock}<span><b>Тема откроется позже</b>
      <i>В этой программе темы идут по порядку — сначала пройдите предыдущие.</i></span></div>
      ${p.next ? `<a class="btn-ghost" href="${href({ tab: "s", id: p.next })}">К текущей теме${ICO.next}</a>` : ""}</div>`;
  }

  /* Главный материал темы — видео, иначе фото, иначе PDF обложкой. Ссылки
     и документы главными не бывают: их не показать на странице. */
  function heroOf(s) {
    const items = s.items.map(itemOf).filter(Boolean);
    return items.find((it) => it.type === "video") || items.find((it) => it.type === "image")
      || items.find((it) => it.type === "pdf" && it.pages) || null;
  }

  const thumbUrl = (it, w) => `/api/learn/items/${encodeURIComponent(it.id)}/thumb/${w}?v=${
    encodeURIComponent(it.poster || it.file_at || it.at || "")}`;
  const heroMeta = (it, seen) => `Видео${it.duration ? " · " + clock(it.duration) : ""}${
    seen > 0 ? ` · досмотрено ${Math.round(seen * 100)}%` : ""}${it.updated ? ` · файл обновлён ${dt(it.file_at)}` : ""}`;

  /* Урок, как на обучающих платформах: видео прямо в теме, сверху, —
     смотреть без лишнего нажатия; фото — картинкой; PDF — обложкой с
     первым листом и тем, сколько прочитано. */
  function lessonMediaHtml(it) {
    const seen = it.seen || 0;
    if (it.type === "video") {
      return `<figure class="ln-lm">
        <div class="ln-lm-v"><video controls playsinline preload="metadata"${it.poster
          ? ` poster="${esc(thumbUrl(it, 1280))}"` : ""} src="${esc(fileUrl(it.id))}" data-hero="${esc(it.id)}"></video></div>
        <figcaption><b>${esc(it.title)}</b><i data-hero-meta>${esc(heroMeta(it, seen))}</i></figcaption>
        <p class="ln-lm-err" data-hero-err hidden>Видео не играет на этом устройстве —
          <button type="button" class="lnk" data-dl-item="${esc(it.id)}">скачайте файл</button>.</p>
      </figure>`;
    }
    if (it.type === "image") {
      return `<figure class="ln-lm"><button type="button" class="ln-lm-img" data-open="${esc(it.id)}" title="Открыть во весь экран">
          <img src="${esc(thumbUrl(it, 1280))}" alt="${esc(it.title)}" loading="lazy"></button>
        <figcaption><b>${esc(it.title)}</b><i>${esc(itemLong(it))}</i></figcaption></figure>`;
    }
    const page = Math.max(1, Math.round(it.pos || 1));
    const cta = seen >= SEEN ? "Открыть снова" : seen > 0 ? `Продолжить с листа ${page}` : "Читать";
    return `<button type="button" class="ln-lm-doc" data-open="${esc(it.id)}">
      <span class="ln-lm-pg" style="aspect-ratio:1/${it.ratios[0] || 1.414}"><img src="${esc(thumbUrl(it, 640))}" alt="" loading="lazy"></span>
      <span class="ln-lm-db">
        <span class="ln-mat-ic">${ICO.pdf}</span>
        <b>${esc(it.title)}</b>
        <i>${esc(itemLong(it))}${it.updated ? ` · файл обновлён ${esc(dt(it.file_at))}` : ""}</i>
        ${seen > 0 ? `<span class="ln-lm-p">${barHtml(seen * 100, seen >= SEEN ? "ok" : "go")}<em>прочитано ${Math.round(seen * 100)}%</em></span>` : ""}
        <span class="btn-brand ln-lm-cta">${cta}${ICO.next}</span>
      </span></button>`;
  }

  /* Картинка у материала в списках: кадр видео и фото вместо значка. */
  function picHtml(it) {
    const src = it.type === "image" || (it.type === "video" && it.poster) ? thumbUrl(it, 320) : "";
    return src ? `<span class="ln-mat-ic th"><img src="${esc(src)}" alt="" loading="lazy">${
      it.type === "video" ? `<i>${ICO.play}</i>` : ""}</span>` : `<span class="ln-mat-ic">${typeIco(it)}</span>`;
  }

  function matHtml(it) {
    const seen = it.seen || 0;
    const part = TRACKED.includes(it.type) && seen > 0 && seen < SEEN;
    const st = seen >= SEEN
      ? `<span class="ln-mat-st ok">${ICO.check}${it.type === "video" || it.type === "audio" ? "Досмотрено"
        : it.type === "pdf" ? "Прочитано" : "Открыто"}</span>`
      : part ? `<span class="ln-mat-st go">${Math.round(seen * 100)}%</span>`
        : seen > 0 ? `<span class="ln-mat-st ok">${ICO.check}Открыто</span>`
          : `<span class="ln-mat-st do">${actWord(it)}</span>`;
    return `<button type="button" class="ln-mat t-${it.type}" data-open="${esc(it.id)}">
      ${picHtml(it)}
      <span class="ln-mat-b"><b>${esc(it.title)}</b><i>${esc(itemLong(it))}${it.updated
        ? ` · <em class="ln-upd">файл обновлён ${esc(dt(it.file_at))}</em>` : ""}</i>
        ${part ? barHtml(seen * 100, "go") : ""}</span>
      ${st}</button>`;
  }

  /* Как тема засчитывается — внизу, одним блоком: что осталось и одна
     главная кнопка. После — «Следующая тема», как «Complete and continue». */
  function actHtml(p, s, next) {
    const items = s.items.map(itemOf).filter(Boolean);
    const opened = items.filter((it) => (it.seen || 0) > 0).length;
    const viewed = items.filter((it) => (it.seen || 0) >= SEEN || (!TRACKED.includes(it.type) && it.seen > 0)).length;
    const done = DONE.includes(s.status);
    const go = next ? `<a class="btn-brand ln-go" href="${href({ tab: "s", id: next.id })}">Следующая тема${ICO.next}</a>`
      : `<a class="btn-brand ln-go" href="${href({ tab: "p", id: p.id })}">${ICO.trophy}К программе</a>`;
    if (s.mode === "view") {
      if (done) return okBox("Тема пройдена", s.done_at ? "засчитана " + stamp(s.done_at) : "", go);
      return `<div class="ln-act"><div class="ln-act-t">${ICO.eye}<span><b>Тема засчитается сама</b>
        <i>когда вы просмотрите материалы: PDF — до последнего листа, видео — до конца</i></span></div>
        ${items.length ? `<div class="ln-act-p">${barHtml(viewed / items.length * 100, "go")}<em>просмотрено ${viewed} из ${items.length}</em></div>` : ""}
      </div>`;
    }
    if (s.mode === "confirm") {
      if (done) return okBox("Вы ознакомились", stamp(s.done_at), go);
      const left = items.length - opened;
      return `<div class="ln-act"><div class="ln-act-t">${ICO.sign}<span><b>Подтвердите, что ознакомились</b>
        <i>${left ? `Сначала откройте материалы темы — осталось ${left}` : "Дата и время отметки сохранятся — как подпись в листе ознакомления"}</i></span></div>
        <button type="button" class="btn-brand ln-big" data-confirm="${esc(s.id)}"${left ? " disabled" : ""}>${ICO.check}Ознакомлен</button>
      </div>`;
    }
    return proofHtml(s, go);
  }

  const okBox = (title, sub, go) => `<div class="ln-act ok"><div class="ln-act-t">${ICO.checkc}<span>
    <b>${esc(title)}</b>${sub ? `<i>${esc(sub)}</i>` : ""}</span></div>${go}</div>`;

  function thumbsHtml(files, rm) {
    return files.map((f) => `<span class="ln-thumb">
      ${f.image ? `<button type="button" class="ln-ph-img" data-proof="${esc(f.id)}" title="${esc(f.filename)}">
          <img src="${esc(proofUrl(f.id))}" alt="" loading="lazy"></button>`
        : `<button type="button" class="ln-ph-file" data-proof-pdf="${esc(f.id)}" title="${esc(f.filename)}">
          ${ICO.pdf}<span>${esc(f.filename)}</span></button>`}
      ${rm ? `<button type="button" class="ln-ph-x" data-proof-rm="${esc(f.id)}" aria-label="Убрать">${ICO.x}</button>` : ""}
    </span>`).join("");
  }

  function proofHtml(s, go) {
    const files = s.proofs || [];
    if (s.status === "ok") {
      return `<div class="ln-act ok"><div class="ln-act-t">${ICO.checkc}<span><b>Подтверждение принято</b>
        <i>${esc(s.reviewer)} · ${esc(stamp(s.reviewed_at))}</i></span></div>
        ${s.review ? `<p class="ln-act-note">${esc(s.review)}</p>` : ""}
        <div class="ln-phs">${thumbsHtml(files, false)}</div>${go}</div>`;
    }
    if (s.status === "sent" && EDIT_PROOF !== s.id) {
      return `<div class="ln-act wait"><div class="ln-act-t">${ICO.clock}<span><b>Отправлено на проверку</b>
        <i>${esc(stamp(s.done_at))} · тема уже засчитана, руководитель посмотрит</i></span></div>
        ${s.note ? `<p class="ln-act-note">${esc(s.note)}</p>` : ""}
        <div class="ln-phs">${thumbsHtml(files, false)}</div>
        <div class="ln-act-row"><button type="button" class="btn-ghost" data-proof-edit="${esc(s.id)}">${ICO.edit}Изменить</button>${go}</div>
      </div>`;
    }
    const note = PROOF_NOTE[s.id] !== undefined ? PROOF_NOTE[s.id] : (s.note || "");
    return `<div class="ln-act${s.status === "back" ? " bad" : ""}">
      ${s.status === "back" ? `<div class="ln-back"><b>${ICO.undo}Вернули на доработку</b>
        <p>${esc(s.review)}</p><i>${esc(s.reviewer)} · ${esc(stamp(s.reviewed_at))}</i></div>` : ""}
      <div class="ln-act-t">${ICO.camera}<span><b>Пришлите подтверждение</b>
        <i>Фото или скриншот — по заданию темы: встреча с руководителем, звонок, работа на объекте</i></span></div>
      <div class="ln-phs">${thumbsHtml(files, true)}
        <label class="ln-ph-add">${ICO.camera}<span>${files.length ? "Ещё фото" : "Добавить фото"}</span>
          <input type="file" accept="image/*,application/pdf" multiple hidden data-proof-file="${esc(s.id)}"></label></div>
      <div data-queue="p:${esc(s.id)}">${queueHtml("p:" + s.id)}</div>
      <label class="ln-fld"><span>Комментарий</span><textarea rows="3" data-proof-note="${esc(s.id)}"
        placeholder="С кем встретились, что обсудили">${esc(note)}</textarea></label>
      <div class="ln-act-row">
        ${s.status === "sent" ? `<button type="button" class="btn-ghost" data-proof-cancel>Отмена</button>` : ""}
        <button type="button" class="btn-brand ln-big" data-proof-send="${esc(s.id)}"${files.length ? "" : " disabled"}>
          ${ICO.send}Отправить на проверку</button></div>
    </div>`;
  }

  /* ── материалы ─────────────────────────────────────────────── */
  /* Библиотека — папки, как в проводнике (02.10.2026, вместо рубрик):
     путь сверху, папки плитками, под ними материалы. Составитель заводит
     папки, переносит в них материалы и папки перетаскиванием или в окне
     материала; удалённая папка отдаёт содержимое на уровень выше. */
  const FOLDERS = () => (DATA && DATA.folders) || [];
  const folderOf = (id) => FOLDERS().find((f) => f.id === id) || null;
  const curFolder = () => (R.tab === "lib" && folderOf(R.id) ? R.id : "");

  /* Путь до папки: [корень…папка]. */
  function trail(id) {
    const out = [], seen = new Set();
    let f = folderOf(id);
    while (f && !seen.has(f.id)) {
      seen.add(f.id);
      out.unshift(f);
      f = folderOf(f.parent_id);
    }
    return out;
  }
  const pathOf = (id) => trail(id).map((f) => f.title).join(" › ");

  /* Сколько внутри папки — со вложенными: материалов, папок, новых для мастера. */
  function inside(id) {
    const ids = new Set([id]);
    let grew = true;
    while (grew) {
      grew = false;
      for (const f of FOLDERS()) if (ids.has(f.parent_id) && !ids.has(f.id)) { ids.add(f.id); grew = true; }
    }
    const items = DATA.items.filter((it) => ids.has(it.folder_id));
    return {
      items: items.length,
      folders: FOLDERS().filter((f) => f.parent_id === id).length,
      fresh: items.filter(isFresh).length,
      ids,
    };
  }

  /* Мастеру — «Новое» (неделя, ещё не открывал) и «Обновлено» (файл
     заменили после того, как смотрел). Составителю это шум: загружал он. */
  const isFresh = (it) => !DATA.admin && (it.updated
    || (!it.seen && Date.now() - Date.parse(it.at) < 7 * 864e5));

  function sortItems(list) {
    return list.slice().sort(LSORT === "new"
      ? (a, b) => (b.file_at || b.at || "").localeCompare(a.file_at || a.at || "")
      : (a, b) => a.title.localeCompare(b.title, "ru", { numeric: true }));
  }

  /* Папки для выбора в окне: деревом, с отступами. skip — папка, которую
     переносим: в неё саму и во вложенные её не положить. */
  function folderOptions(sel, skip) {
    const banned = skip ? inside(skip).ids : new Set();
    const out = [`<option value=""${!sel ? " selected" : ""}>Материалы — верхний уровень</option>`];
    const walk = (parent, depth) => {
      FOLDERS().filter((f) => f.parent_id === parent && !banned.has(f.id)).forEach((f) => {
        out.push(`<option value="${esc(f.id)}"${sel === f.id ? " selected" : ""}>${"\u2003".repeat(depth)}${esc(f.title)}</option>`);
        walk(f.id, depth + 1);
      });
    };
    walk("", 1);
    return out.join("");
  }

  function libHtml() {
    const cur = curFolder();
    const q = LQ.trim().toLowerCase();
    const all = DATA.items;
    const crumbs = trail(cur);
    let body;
    if (q.length >= 2) {
      // Поиск — по всей библиотеке, с путём у каждого найденного.
      const fs = FOLDERS().filter((f) => f.title.toLowerCase().includes(q));
      const its = sortItems(all.filter((it) =>
        `${it.title} ${it.note} ${it.filename} ${pathOf(it.folder_id)}`.toLowerCase().includes(q)));
      body = !fs.length && !its.length ? `<p class="ln-none">Ничего не нашлось</p>` : `
        ${fs.length ? `<div class="ln-folds">${fs.map((f) => foldHtml(f, true)).join("")}</div>` : ""}
        ${its.length ? `<div class="ln-list">${its.map((it) => libRowHtml(it, true)).join("")}</div>` : ""}`;
    } else {
      const fs = FOLDERS().filter((f) => f.parent_id === cur);
      const its = sortItems(all.filter((it) => it.folder_id === cur));
      body = !all.length && !FOLDERS().length
        ? (DATA.admin ? libEmptyAdmin() : `<div class="ln-empty"><span class="ln-empty-ic">${ICO.lib}</span>
            <b>Материалов пока нет</b><p>Здесь появятся инструкции, видео и документы, которые загрузят руководители.</p></div>`)
        : `${fs.length ? `<div class="ln-folds">${fs.map((f) => foldHtml(f)).join("")}</div>` : ""}
          ${its.length ? `<div class="ln-list">${its.map((it) => libRowHtml(it)).join("")}</div>` : ""}
          ${!fs.length && !its.length ? `<div class="ln-fold-empty">${ICO.folder}<b>Папка пуста</b>
            <i>${DATA.admin ? "Загрузите сюда файлы, перетащите их в окно или перенесите материалы из других папок."
              : "Материалы сюда ещё не положили."}</i></div>` : ""}`;
    }
    return `<div class="ln-wrap ln-lib">
      <div class="ln-bar2">
        <label class="ln-find">${ICO.find}<input type="search" id="lnLQ" placeholder="Найти во всех папках"
          value="${esc(LQ)}" autocomplete="off"></label>
        ${DATA.admin ? `<label class="btn-brand ln-up">${ICO.upload}<span>Загрузить</span>
            <input type="file" multiple hidden data-lib-file></label>
          <button type="button" class="btn-ghost" data-folder-new>${ICO.folderPlus}<span>Папка</span></button>
          <button type="button" class="btn-ghost" data-lib-link>${ICO.link}<span>Ссылка</span></button>` : ""}
      </div>
      <div class="ln-crumbs">
        <nav class="ln-path" aria-label="Путь">
          ${q.length >= 2 ? `<b>Найдено во всех папках</b>` : `
          <a href="${href({ tab: "lib" })}" data-drop-folder=""${cur ? "" : ' aria-current="page"'}>${ICO.lib}Материалы</a>
          ${crumbs.map((f, i) => `<span class="ln-path-s">›</span>${i === crumbs.length - 1
            ? `<b data-drop-folder="${esc(f.id)}">${esc(f.title)}</b>`
            : `<a href="${href({ tab: "lib", id: f.id })}" data-drop-folder="${esc(f.id)}">${esc(f.title)}</a>`}`).join("")}
          ${cur && DATA.admin ? `<button type="button" class="ln-ib sm" data-folder-edit="${esc(cur)}" title="Папка: название, перенос, удалить" aria-label="Изменить папку">${ICO.edit}</button>` : ""}`}
        </nav>
        <div class="ln-seg sm" role="radiogroup" aria-label="Порядок">
          <button type="button" role="radio" class="${LSORT === "name" ? "on" : ""}" aria-checked="${LSORT === "name"}" data-sort="name">По названию</button>
          <button type="button" role="radio" class="${LSORT === "new" ? "on" : ""}" aria-checked="${LSORT === "new"}" data-sort="new">Сначала новые</button>
        </div>
      </div>
      <div data-queue="lib">${queueHtml("lib")}</div>
      ${body}
      ${DATA.admin && (all.length || FOLDERS().length) ? `<p class="ln-hint">${ICO.upload}<span>Файлы можно перетащить прямо
        в окно — они лягут в открытую папку, а на плитку — в эту папку. Материалы и папки переносятся
        перетаскиванием на папку или на путь сверху. PDF и видео открываются здесь же, на телефоне тоже; Word и
        PowerPoint только скачиваются — презентации лучше сохранять в PDF.</span></p>` : ""}
    </div>`;
  }

  function foldHtml(f, withPath) {
    const n = inside(f.id);
    const parts = [n.items ? nMats(n.items) : "пусто"];
    if (n.folders) parts.push(`${n.folders} ${plural(n.folders, "папка", "папки", "папок")}`);
    const up = withPath && f.parent_id ? pathOf(f.parent_id) : "";
    return `<a class="ln-fold" href="${href({ tab: "lib", id: f.id })}" data-drop-folder="${esc(f.id)}"${
      DATA.admin ? ` draggable="true" data-drag-folder="${esc(f.id)}"` : ""}>
      <span class="ln-fold-ic">${ICO.folder}</span>
      <span class="ln-fold-b"><b>${esc(f.title)}</b><i>${esc(up ? up + " · " : "")}${esc(parts.join(" · "))}</i></span>
      ${n.fresh ? `<span class="ln-new">${n.fresh} ${plural(n.fresh, "новый", "новых", "новых")}</span>` : ""}
      ${DATA.admin ? `<button type="button" class="ln-ib sm" data-folder-edit="${esc(f.id)}" title="Изменить папку" aria-label="Изменить папку">${ICO.edit}</button>` : ""}
    </a>`;
  }

  function libEmptyAdmin() {
    return `<div class="ln-empty"><span class="ln-empty-ic">${ICO.upload}</span>
      <b>Библиотека пуста</b>
      <p>Заведите папки — например, «Охрана труда», «Монтаж», «Документы» — и загрузите в них инструкции,
        регламенты, видео с объекта. Один материал можно положить в темы любых программ, а мастера видят здесь
        всю библиотеку.</p>
      <div class="ln-empty-acts">
        <button type="button" class="btn-ghost" data-folder-new>${ICO.folderPlus}Новая папка</button>
        <label class="btn-brand">${ICO.upload}Загрузить файлы<input type="file" multiple hidden data-lib-file></label>
      </div></div>`;
  }

  function libRowHtml(it, withPath) {
    const seen = it.seen || 0;
    const st = isFresh(it) ? `<span class="ln-new${it.updated ? " upd" : ""}">${it.updated ? "Обновлено" : "Новое"}</span>`
      : seen >= SEEN || (seen > 0 && !TRACKED.includes(it.type))
        ? `<span class="ln-mat-st ok" title="Просмотрено">${ICO.check}</span>`
        : seen > 0 ? `<span class="ln-mat-st go">${Math.round(seen * 100)}%</span>` : "";
    const used = DATA.admin && it.used !== undefined
      ? (it.used ? ` · в ${it.used} ${plural(it.used, "теме", "темах", "темах")}` : " · ни в одной теме") : "";
    const path = withPath && it.folder_id ? pathOf(it.folder_id) + " · " : "";
    const upd = it.file_at ? ` · обновлён ${dt(it.file_at)}` : "";
    return `<div class="ln-li t-${it.type}"${DATA.admin ? ` draggable="true" data-drag-item="${esc(it.id)}"` : ""}>
      <button type="button" class="ln-li-m" data-open="${esc(it.id)}">
        ${picHtml(it)}
        <span class="ln-li-b"><b>${esc(it.title)}</b><i>${esc(path + itemLong(it) + upd + used)}${
          it.note ? `<span> · ${esc(it.note)}</span>` : ""}</i></span>
        ${st}</button>
      ${DATA.admin ? `<button type="button" class="ln-ib" data-item-edit="${esc(it.id)}" title="Изменить" aria-label="Изменить">${ICO.edit}</button>` : ""}
    </div>`;
  }

  /* ── составитель: программы ────────────────────────────────── */
  function progsHtml() {
    const ps = DATA.manage.programs;
    const by = (st) => ps.filter((p) => p.status === st);
    const grid = (title, list) => (list.length ? `<div class="ln-h">${title} <i>${list.length}</i></div>
      <div class="ln-pgrid">${list.map(progCardHtml).join("")}</div>` : "");
    return `<div class="ln-wrap ln-progs">
      <div class="ln-bar2"><div class="ln-bar-t"><b>Программы обучения</b><i>${ps.length
        ? `${by("live").length} ${plural(by("live").length, "идёт", "идут", "идут")} · ${by("draft").length} в черновиках`
        : "пока ни одной"}</i></div>
        <button type="button" class="btn-brand" data-prog-new>${ICO.plus}<span>Новая программа</span></button></div>
      ${ps.length ? grid("Идут", by("live")) + grid("Черновики", by("draft")) + grid("В архиве", by("archive")) : `
        <div class="ln-how">
          <div class="ln-how-i"><span>1</span><b>Загрузите материалы</b><i>Инструкции, регламенты, видео — во вкладке «Материалы».</i></div>
          <div class="ln-how-i"><span>2</span><b>Соберите программу</b><i>Главы и темы; у темы — материалы и как её засчитать: просмотр, «ознакомлен» или фото.</i></div>
          <div class="ln-how-i"><span>3</span><b>Назначьте и опубликуйте</b><i>Всем, новым сотрудникам или поимённо — с полосой прогресса у каждого.</i></div>
          <button type="button" class="btn-brand" data-prog-new>${ICO.plus}Создать первую программу</button>
        </div>`}
    </div>`;
  }

  function audLine(p) {
    const names = p.members.map((id) => (DATA.manage.users.find((u) => u.id === id) || {}).name).filter(Boolean);
    const who = names.length > 2 ? `${names.slice(0, 2).join(", ")} и ещё ${names.length - 2}` : names.join(", ");
    if (p.audience === "some") return who || "никому — выберите людей";
    return AUD[p.audience] + (names.length ? ` + ${who}` : "");
  }

  function progCardHtml(p) {
    const st = p.stats;
    return `<a class="ln-pc c${(p.color || 0) % 8}" href="${href({ tab: "e", id: p.id })}">
      <span class="ln-pc-top"><span class="ln-pcard-ic">${ICO.cap}</span>${statusChip(p.status)}</span>
      <b class="ln-pc-t">${esc(p.title)}</b>
      <span class="ln-pc-m">${ICO.users}<span>${esc(audLine(p))}</span></span>
      <span class="ln-pc-m">${ICO.list}<span>${p.chapters.length} ${plural(p.chapters.length, "глава", "главы", "глав")} ·
        ${nTopics(stepsOf(p))}${p.due_days ? ` · срок ${nDays(p.due_days)}` : ""}</span></span>
      ${p.status === "live" ? `<span class="ln-pc-s">
          <span class="ln-pc-p">${barHtml(st.avg, "go")}<em>${st.avg}%</em></span>
          <span class="ln-pc-n"><span><b>${st.people}</b> ${plural(st.people, "учится", "учатся", "учатся")}</span>
            <span><b>${st.complete}</b> прошли</span>
            ${st.review ? `<span class="wait"><b>${st.review}</b> на проверке</span>` : ""}
            ${st.overdue ? `<span class="bad"><b>${st.overdue}</b> просрочено</span>` : ""}</span>
        </span>` : `<span class="ln-pc-s dim">${p.status === "draft" ? "Черновик видят только составители" : "Новым не назначается"}</span>`}
    </a>`;
  }

  /* ── составитель: конструктор программы ────────────────────── */
  function builderPage() {
    const p = mprog(R.id);
    if (!p) return missingPage("Программа не найдена", { tab: "progs" });
    const s = R.sub && R.sub !== "set" ? findMStep(p, R.sub) : null;
    const wide = WIDE.matches;
    const back = !wide && (s || R.sub === "set") ? { tab: "e", id: p.id } : { tab: "progs" };
    const head = `<div class="pg-head strip ln-strip">
      <a class="pg-back" href="${href(back)}" title="Назад" aria-label="Назад">${ICO.back}</a>
      <div class="pg-h1"><h2>${esc(p.title)}</h2>${statusChip(p.status)}</div>
      <div class="ln-strip-acts">
        <a class="btn-ghost" href="${href({ tab: "p", id: p.id })}" title="Пройти программу, как её увидит мастер">${ICO.eye}<span>Глазами мастера</span></a>
        ${p.status === "live" ? "" : `<button type="button" class="btn-brand" data-prog-publish>${ICO.send}<span>${
          p.status === "archive" ? "Вернуть в работу" : "Опубликовать"}</span></button>`}
      </div></div>`;
    if (wide) {
      return `<div class="pg ln">${head}<div class="ln-build">
        <div class="ln-build-l" data-keep="outl">${editOutlineHtml(p, s ? s.id : "set")}</div>
        <div class="ln-build-r" data-keep="edit">${s ? stepEditHtml(p, s) : settingsHtml(p)}</div>
      </div></div>`;
    }
    return `<div class="pg ln">${head}<div class="pg-body ln-scroll ln-build1" data-keep="main">${
      s ? stepEditHtml(p, s) : R.sub === "set" ? settingsHtml(p) : editOutlineHtml(p, "")}</div></div>`;
  }

  function findMStep(p, sid) {
    for (const ch of p.chapters) for (const s of ch.steps) if (s.id === sid) return s;
    return null;
  }

  function locate(p, sid) {
    let n = 0, at = null;
    p.chapters.forEach((ch) => ch.steps.forEach((s) => { n += 1; if (s.id === sid) at = { ch, n }; }));
    return Object.assign({ total: n }, at || { ch: { title: "" }, n: 0 });
  }

  function editMeta(s) {
    const n = s.items.filter((id) => IT.has(id)).length;
    return `${MODES[s.mode].short} · ${n ? nMats(n) : "без материалов"}`;
  }

  function editOutlineHtml(p, sel) {
    return `<div class="ln-eo">
      <a class="ln-eo-set${sel === "set" ? " is-sel" : ""}" href="${href({ tab: "e", id: p.id, sub: "set" })}">
        <span class="ln-eo-mi">${ICO.sliders}</span>
        <span class="ln-eo-sb"><b>Настройки программы</b><i>${esc(audLine(p))}${p.due_days ? " · срок " + nDays(p.due_days) : ""}</i></span>
        <span class="ln-srow-go">${ICO.next}</span></a>
      ${p.chapters.map((ch) => `
        <section class="ln-eo-ch" data-ch="${esc(ch.id)}">
          <div class="ln-eo-chh" data-drag-ch="${esc(ch.id)}">
            <span class="ln-grip" title="Перетащить главу">${ICO.grip}</span>
            <input class="ln-eo-cht" value="${esc(ch.title)}" data-ch-title="${esc(ch.id)}" aria-label="Название главы" maxlength="200">
            <i>${ch.steps.length}</i>
            <button type="button" class="ln-ib sm" data-ch-del="${esc(ch.id)}" title="Удалить главу" aria-label="Удалить главу">${ICO.trash}</button>
          </div>
          <div class="ln-eo-steps" data-drop-ch="${esc(ch.id)}">
            ${ch.steps.map((s) => `<a class="ln-eo-s${s.id === sel ? " is-sel" : ""}" href="${href({ tab: "e", id: p.id, sub: s.id })}"
                data-drag-step="${esc(s.id)}" draggable="true">
                <span class="ln-grip">${ICO.grip}</span>
                <span class="ln-eo-mi m-${s.mode}">${modeIco(s.mode)}</span>
                <span class="ln-eo-sb"><b>${esc(s.title)}</b><i>${esc(editMeta(s))}</i></span>
              </a>`).join("")}
            <button type="button" class="ln-eo-add" data-step-new="${esc(ch.id)}">${ICO.plus}Тема</button>
          </div>
        </section>`).join("")}
      <button type="button" class="ln-eo-addch" data-ch-new>${ICO.plus}Глава</button>
      ${stepsOf(p) ? "" : `<p class="ln-hint">${ICO.list}<span>Программа — это главы, в главах темы. Добавьте тему: у неё будут
        задание, материалы и способ, которым она засчитывается.</span></p>`}
    </div>`;
  }

  function stepEditHtml(p, s) {
    const at = locate(p, s.id);
    const items = s.items.map(itemOf).filter(Boolean);
    return `<div class="ln-ed" data-step="${esc(s.id)}">
      <div class="ln-ed-top">
        <span class="ln-ed-k">${esc(at.ch.title)} · тема ${at.n} из ${at.total}</span>
        <span class="ln-saved" data-saved></span>
        <span class="grow"></span>
        <button type="button" class="ln-ib" data-step-move="up" title="Выше"${at.n <= 1 ? " disabled" : ""}>${ICO.up}</button>
        <button type="button" class="ln-ib" data-step-move="down" title="Ниже"${at.n >= at.total ? " disabled" : ""}>${ICO.down}</button>
        <a class="ln-ib" href="${href({ tab: "s", id: s.id })}" title="Посмотреть глазами мастера">${ICO.eye}</a>
        <button type="button" class="ln-ib warn" data-step-del title="Удалить тему">${ICO.trash}</button>
      </div>
      <input class="ln-ed-title" data-f="title" value="${esc(s.title)}" placeholder="Название темы" maxlength="200">
      <label class="ln-fld"><span>Что сделать ${tip("Коротко и по делу: что изучить и зачем. Мастер увидит это под материалами. Разметка: «- » — список, «1. » — шаги, «## » — подзаголовок, **жирное**, «! » — важно, «> » — совет; ссылки станут кликабельными.")}</span>
        <textarea data-f="body" rows="5" placeholder="Например: посмотрите видео о допуске на объект и подтвердите, что ознакомлены. Вопросы — главному инженеру.">${esc(s.body)}</textarea></label>
      <div class="ln-fld"><span>Как засчитать тему</span>
        <div class="ln-modes">${Object.entries(MODES).map(([k, m]) => `
          <label class="ln-modec${s.mode === k ? " on" : ""}"><input type="radio" name="ln-mode" value="${k}"${s.mode === k ? " checked" : ""}>
            <span class="ln-eo-mi m-${k}">${modeIco(k)}</span><b>${m.t}</b><i>${m.s}</i></label>`).join("")}</div></div>
      <div class="ln-fld"><span>Материалы <i>${items.length}</i></span>
        ${items.length ? `<div class="ln-ed-mats">${items.map((it, i) => `
          <div class="ln-ed-mat t-${it.type}">
            <span class="ln-mat-ic">${typeIco(it)}</span>
            <button type="button" class="ln-li-b" data-open="${esc(it.id)}"><b>${esc(it.title)}</b><i>${esc(itemLong(it))}</i></button>
            <button type="button" class="ln-ib sm" data-mat-up="${i}" title="Выше"${i ? "" : " disabled"}>${ICO.up}</button>
            <button type="button" class="ln-ib sm" data-mat-rm="${esc(it.id)}" title="Убрать из темы — в библиотеке останется">${ICO.x}</button>
          </div>`).join("")}</div>`
          : `<p class="ln-ed-none">${s.mode === "view" ? "Без материалов тема засчитается, как только её откроют, — подойдёт для вводного текста."
            : "Материалов нет — мастер увидит только задание."}</p>`}
        <div data-queue="s:${esc(s.id)}">${queueHtml("s:" + s.id)}</div>
        <div class="ln-ed-add">
          <label class="btn-ghost">${ICO.upload}<span>Загрузить файл</span><input type="file" multiple hidden data-step-file="${esc(s.id)}"></label>
          <button type="button" class="btn-ghost" data-step-lib>${ICO.lib}<span>Из библиотеки</span></button>
          <button type="button" class="btn-ghost" data-step-link>${ICO.link}<span>Ссылка</span></button>
        </div></div>
    </div>`;
  }

  function reach(p) {
    const ppl = DATA.manage.people.filter((u) => u.learner).length;
    // «Всем» — каждому, у кого открыто «Обучение», администраторам тоже.
    // Без раздела программу не открыть — говорим, сколько таких учёток.
    const rest = DATA.manage.users.length - ppl;
    if (p.audience === "all") {
      return `сейчас ${nPeople(ppl)}, включая администраторов, и все, кого заведут потом` + (rest > 0
        ? `. Ещё ${rest} ${plural(rest, "учётке", "учёткам", "учёткам")} не открыт раздел «Обучение» — откройте его в «Пользователях»`
        : "");
    }
    if (p.audience === "new") return "только тем, кого заведут после публикации — программа для новичков";
    return "только выбранным ниже — индивидуальный план";
  }

  function settingsHtml(p) {
    const users = DATA.manage.users;
    const mem = p.members.map((id) => users.find((u) => u.id === id)).filter(Boolean);
    return `<div class="ln-ed ln-set">
      <div class="ln-ed-top"><span class="ln-ed-k">Настройки программы</span><span class="ln-saved" data-saved></span></div>
      <input class="ln-ed-title" data-p="title" value="${esc(p.title)}" placeholder="Название программы" maxlength="200">
      <label class="ln-fld"><span>Описание</span><textarea data-p="about" rows="3"
        placeholder="Для кого и зачем: например, «Первые две недели нового мастера: допуск, документы, платформа»">${esc(p.about)}</textarea></label>
      <div class="ln-fld"><span>Кому назначить</span>
        <div class="ln-seg" role="radiogroup">${Object.entries(AUD).map(([k, t]) => `<button type="button" role="radio"
          aria-checked="${p.audience === k}" class="${p.audience === k ? "on" : ""}" data-aud="${k}">${t}</button>`).join("")}</div>
        <i class="ln-fld-hint">${esc(reach(p))}</i></div>
      <div class="ln-fld"><span>${p.audience === "some" ? "Кому" : "Ещё поимённо"} ${tip("Индивидуальный план — программа одному человеку или нескольким. Поимённо можно назначить и администратору: «всем» и «новым» администраторов не включают.")}</span>
        <div class="ln-pchips">${mem.map((u) => `<span class="ln-pchip">${avatarHtml(u)}<span>${esc(u.name)}</span>
            <button type="button" data-mem-rm="${esc(u.id)}" aria-label="Убрать">${ICO.x}</button></span>`).join("")}
          <button type="button" class="ln-pchip add" data-mem-add>${ICO.plus}Выбрать людей</button></div></div>
      <div class="ln-row2">
        <label class="ln-fld"><span>Срок, дней</span><input type="number" min="0" max="3650" data-p="due_days"
          value="${p.due_days || ""}" placeholder="без срока" inputmode="numeric"><i class="ln-fld-hint">с дня назначения</i></label>
        <div class="ln-fld"><span>Цвет</span><div class="ln-colors">${[0, 1, 2, 3, 4, 5, 6, 7].map((i) => `
          <button type="button" class="ln-color c${i}${(p.color || 0) % 8 === i ? " on" : ""}" data-color="${i}" aria-label="Цвет ${i + 1}"></button>`).join("")}</div></div>
      </div>
      <label class="ln-checkb"><input type="checkbox" data-p="strict"${p.strict ? " checked" : ""}>
        <span><b>Темы строго по порядку</b><i>следующая откроется, когда засчитана предыдущая</i></span></label>
      <div class="ln-set-foot">
        <button type="button" class="btn-ghost" data-prog-copy title="Заготовка индивидуального плана: копия с теми же темами">${ICO.copy}<span>Сделать копию</span></button>
        ${p.status === "live" ? `<button type="button" class="btn-ghost" data-prog-status="draft">Снять с публикации</button>
          <button type="button" class="btn-ghost" data-prog-status="archive">В архив</button>` : ""}
        <span class="grow"></span>
        <button type="button" class="btn-ghost warn" data-prog-del>${ICO.trash}<span>Удалить</span></button>
      </div>
      ${p.status === "live" ? `<p class="ln-hint">${ICO.users}<span>Программа идёт: ${esc(reach(p))}. Изменения видны мастерам сразу.</span></p>` : ""}
    </div>`;
  }

  /* ── составитель: сотрудники ───────────────────────────────── */
  function personState(u) {
    const v = Object.values(u.programs);
    return {
      n: v.length,
      over: v.some((x) => x.overdue),
      done: v.length > 0 && v.every((x) => x.complete),
      idle: v.length > 0 && !v.some((x) => x.started),
      active: v.some((x) => x.started && !x.complete),
    };
  }

  function peopleHtml() {
    const live = DATA.manage.programs.filter((p) => p.status === "live");
    const all = DATA.manage.people;
    const q = PQ.trim().toLowerCase();
    const F = {
      all: ["Все", () => true],
      active: ["Учатся", (s) => s.active],
      over: ["Просрочено", (s) => s.over],
      idle: ["Не начинали", (s) => s.idle],
      done: ["Прошли всё", (s) => s.done],
      none: ["Без программ", (s) => !s.n],
    };
    const rows = all.filter((u) => (!q || `${u.name} ${u.job_title}`.toLowerCase().includes(q))
      && F[PF][1](personState(u)));
    const cnt = (k) => all.filter((u) => F[k][1](personState(u))).length;
    return `<div class="ln-wrap wide ln-people">
      <div class="ln-bar2">
        <label class="ln-find">${ICO.find}<input type="search" id="lnPQ" placeholder="Имя или должность" value="${esc(PQ)}" autocomplete="off"></label>
      </div>
      <div class="ln-chips">${Object.entries(F).map(([k, [t]]) => `<button type="button" class="ln-chip2${PF === k ? " on" : ""}"
        data-pf="${k}">${t} <i>${cnt(k)}</i></button>`).join("")}</div>
      ${!all.length ? `<div class="ln-empty"><span class="ln-empty-ic">${ICO.users}</span><b>Учеников пока нет</b>
          <p>Здесь будут все, у кого есть раздел «Обучение», и все, кому программу назначили поимённо.</p></div>`
        : !rows.length ? `<p class="ln-none">Никого не нашлось</p>` : `
      <div class="ln-mx-w"><table class="ln-mx">
        <thead><tr><th class="ln-mx-n">Сотрудник</th>${live.map((p) => `<th><a href="${href({ tab: "e", id: p.id })}"
          class="ln-mx-p c${(p.color || 0) % 8}">${esc(p.title)}</a></th>`).join("")}<th class="ln-mx-l">Активность</th></tr></thead>
        <tbody>${rows.map((u) => `<tr data-person="${esc(u.id)}" tabindex="0">
          <td class="ln-mx-n"><a class="ln-mx-u" href="${href({ tab: "people", id: u.id })}">${avatarHtml(u)}<span><b>${esc(u.name)}</b>
            <i>${esc(u.job_title || (u.learner ? "" : ROLE[u.role] || ""))}</i></span></a></td>
          ${live.map((p) => cellHtml(u.programs[p.id])).join("")}
          <td class="ln-mx-l">${u.last ? esc(stamp(u.last)) : `<span class="dim">не заходил</span>`}</td>
        </tr>`).join("")}</tbody></table></div>`}
      ${!live.length && all.length ? `<p class="ln-hint">${ICO.cap}<span>Ни одна программа не опубликована — колонки появятся, когда программа пойдёт.</span></p>` : ""}
    </div>`;
  }

  function cellHtml(v) {
    if (!v) return `<td class="ln-mx-c none">—</td>`;
    const cls = v.complete ? "ok" : v.overdue ? "bad" : v.started ? "go" : "new";
    return `<td class="ln-mx-c"><div class="ln-mx-v ${cls}">${barHtml(v.pct, cls)}<span><b>${v.done}/${v.total}</b>
      ${v.sent ? `<i class="wait" title="Ждут проверки">${ICO.clock}${v.sent}</i>` : ""}
      ${v.back ? `<i class="bad" title="Вернули">${ICO.undo}${v.back}</i>` : ""}
      ${v.overdue ? `<i class="bad">просрочено</i>` : v.complete ? `<i class="ok">${ICO.check}</i>`
        : v.due_at && v.left !== null && v.left <= 3 ? `<i class="warn">${v.left} дн.</i>` : ""}</span></div></td>`;
  }

  function personPage() {
    const u = DATA.manage.people.find((x) => x.id === R.id) || DATA.manage.users.find((x) => x.id === R.id)
      || { id: R.id, name: "Сотрудник" };
    const d = PERSON && PERSON.user && PERSON.user.id === R.id ? PERSON : null;
    let body;
    if (!d) body = `<div class="ln-load"><span class="ln-spin"></span><span>Загружаю…</span></div>`;
    else if (d.error) body = `<p class="ln-none">${esc(d.error)}</p>`;
    else if (!d.programs.length) {
      body = `<div class="ln-empty"><span class="ln-empty-ic">${ICO.cap}</span><b>Программ нет</b>
        <p>Назначьте программу поимённо — в её настройках, «Ещё поимённо».</p></div>`;
    } else body = d.programs.map(personProgHtml).join("");
    return `<div class="pg ln">
      ${stripHtml({ tab: "people" }, u.name, `<span class="ln-strip-u">${avatarHtml(u)}<i>${esc(u.job_title || "")}</i></span>`, "Все сотрудники")}
      <div class="pg-body ln-scroll" data-keep="main"><div class="ln-wrap">${body}</div></div></div>`;
  }

  function personProgHtml(p) {
    const st = progState(p);
    const nums = numbers(p);
    return `<section class="ln-pp c${(p.color || 0) % 8}">
      <div class="ln-pp-h"><span class="ln-pcard-ic">${ICO.cap}</span>
        <span class="ln-pp-t"><b>${esc(p.title)}</b><span class="ln-pcard-p">${barHtml(p.pct, st.cls)}<em>${p.done} из ${p.total} · ${p.pct}%</em></span></span>
        <span class="ln-chip ${st.cls}">${st.label}</span></div>
      <div class="ln-pp-m">${dueHtml(p)}${p.last ? `<span class="ln-due">последнее действие ${esc(stamp(p.last))}</span>` : ""}
        ${p.assigned === false ? `<span class="ln-due">больше не назначена</span>` : ""}</div>
      ${p.chapters.map((ch) => `<div class="ln-pp-ch"><div class="ln-ch-h"><b>${esc(ch.title)}</b></div>
        ${ch.steps.map((s) => {
          const ss = stepState(s, nums.get(s.id));
          const seen = Object.entries(s.seen || {}).map(([id, x]) => {
            const it = itemOf(id);
            if (!it) return "";
            return `<span class="${x >= SEEN ? "ok" : x > 0 ? "go" : ""}">${esc(itemShort(it))}: ${
              x >= SEEN ? "✓" : x > 0 ? Math.round(x * 100) + "%" : "не открыт"}</span>`;
          }).filter(Boolean).join("");
          const when = s.done_at ? (s.status === "sent" ? "отправил " : s.mode === "confirm" ? "ознакомился " : "засчитана ") + stamp(s.done_at)
            : s.opened_at ? "открыл " + stamp(s.opened_at) : "не открывал";
          return `<div class="ln-pp-s ${ss.cls}">
            <span class="ln-sic ${ss.cls}">${ss.ic}</span>
            <div class="ln-pp-sb"><b>${esc(s.title)}</b>
              <i>${esc(MODES[s.mode].short)} · ${esc(when)}</i>
              ${seen ? `<div class="ln-pp-seen">${seen}</div>` : ""}
              ${s.note ? `<p class="ln-act-note">${esc(s.note)}</p>` : ""}
              ${(s.proofs || []).length ? `<div class="ln-phs sm">${thumbsHtml(s.proofs, false)}</div>` : ""}
              ${s.status === "back" || s.status === "ok" ? `<div class="ln-rv-res ${s.status}">${s.status === "ok" ? ICO.check + "Принято" : ICO.undo + "Возвращено"}
                · ${esc(s.reviewer)} · ${esc(stamp(s.reviewed_at))}${s.review ? `<p>${esc(s.review)}</p>` : ""}</div>` : ""}
              ${s.status === "sent" ? `<div class="ln-rv-acts"><button type="button" class="btn-ghost" data-rv-back="${esc(PERSON.user.id)}|${esc(s.id)}">${ICO.undo}Вернуть</button>
                <button type="button" class="btn-brand" data-rv-ok="${esc(PERSON.user.id)}|${esc(s.id)}">${ICO.check}Принять</button></div>` : ""}
            </div>
            ${ss.tag ? `<span class="ln-chip ${ss.cls}">${ss.tag}</span>` : ""}
          </div>`;
        }).join("")}</div>`).join("")}
    </section>`;
  }

  /* ── составитель: проверка ─────────────────────────────────── */
  function checkHtml() {
    const all = DATA.manage.review;
    const wait = all.filter((r) => r.status === "sent"), done = all.filter((r) => r.status !== "sent");
    const list = CF === "wait" ? wait : done;
    return `<div class="ln-wrap ln-check">
      <div class="ln-chips">
        <button type="button" class="ln-chip2${CF === "wait" ? " on" : ""}" data-cf="wait">Ждут проверки <i>${wait.length}</i></button>
        <button type="button" class="ln-chip2${CF === "done" ? " on" : ""}" data-cf="done">Проверенные за месяц <i>${done.length}</i></button>
      </div>
      ${list.length ? list.map(reviewCardHtml).join("") : `<div class="ln-empty"><span class="ln-empty-ic">${ICO.checkc}</span>
        <b>${CF === "wait" ? "Всё проверено" : "За месяц ничего не проверяли"}</b>
        <p>${CF === "wait" ? "Когда мастер пришлёт фото или скриншот по теме, оно появится здесь: принять или вернуть с замечанием." : ""}</p></div>`}
    </div>`;
  }

  function reviewCardHtml(r) {
    const key = `${esc(r.user_id)}|${esc(r.step_id)}`;
    return `<article class="ln-rv${r.status !== "sent" ? " " + r.status : ""}">
      <div class="ln-rv-h">${avatarHtml({ id: r.user_id, name: r.user, avatar: r.avatar })}
        <span class="ln-rv-who"><a href="${href({ tab: "people", id: r.user_id })}"><b>${esc(r.user)}</b></a><i>${esc(r.program)} › ${esc(r.step)}</i></span>
        <em>${esc(stamp(r.at))}</em></div>
      ${r.body ? `<details class="ln-rv-task"><summary>Задание темы</summary><div class="ln-text sm">${textHtml(r.body)}</div></details>` : ""}
      ${r.note ? `<p class="ln-act-note">${esc(r.note)}</p>` : `<p class="ln-act-note dim">Без комментария</p>`}
      <div class="ln-phs">${thumbsHtml(r.proofs, false)}</div>
      ${r.status === "sent" ? `<div class="ln-rv-acts">
          <button type="button" class="btn-ghost" data-rv-back="${key}">${ICO.undo}Вернуть</button>
          <button type="button" class="btn-brand" data-rv-ok="${key}">${ICO.check}Принять</button></div>`
        : `<div class="ln-rv-res ${r.status}">${r.status === "ok" ? ICO.check + "Принято" : ICO.undo + "Возвращено"} ·
          ${esc(r.reviewer)} · ${esc(stamp(r.reviewed_at))}${r.review ? `<p>${esc(r.review)}</p>` : ""}</div>`}
    </article>`;
  }

  /* ── загрузки ──────────────────────────────────────────────── */
  function queueHtml(where) {
    const live = QUEUE.filter((q) => q.state !== "ok" && q.where === where);
    if (!live.length) return "";
    return `<div class="ln-queue">${live.map((q) => `
      <div class="ln-q${q.state === "err" ? " bad" : ""}">
        <span class="ln-q-n">${esc(q.file.name)}</span>
        ${q.state === "err" ? `<span class="ln-q-e">${esc(q.error)}</span>` : `
        <span class="ln-q-bar"><i style="width:${q.size ? Math.round(q.loaded * 100 / q.size) : 0}%"></i></span>
        <span class="ln-q-s">${q.state === "wait" ? "в очереди" : q.state === "prep" ? "готовлю…" : size(q.loaded) + " из " + size(q.size)}</span>`}
      </div>`).join("")}
      ${live.some((q) => q.state === "err") ? `<button type="button" class="lnk" data-q-clear="${esc(where)}">Скрыть ошибки</button>` : ""}</div>`;
  }

  function paintQueue(where) {
    const box = $q(`#sec-lrn [data-queue="${where}"]`);
    if (box) box.innerHTML = queueHtml(where);
  }

  function enqueue(files, opts) {
    for (const file of files) {
      const q = Object.assign({ file, loaded: 0, size: file.size, state: "wait", error: "" }, opts);
      if (!q.proof && file.size > FILE_MAX) { q.state = "err"; q.error = "больше 512 МБ"; }
      if (!file.size) { q.state = "err"; q.error = "пустой файл"; }
      QUEUE.push(q);
      paintQueue(q.where);
    }
    pump();
  }

  async function pump() {
    if (pumping) return;
    const q = QUEUE.find((x) => x.state === "wait");
    if (!q) return;
    pumping = true;
    if (typeof FRESH === "object") FRESH.hold();
    try {
      q.state = "prep";
      paintQueue(q.where);
      if (q.proof) await sendProof(q);
      else await sendItem(q);
      q.state = "ok";
    } catch (e) {
      q.state = "err";
      q.error = e.message;
    } finally {
      if (typeof FRESH === "object") FRESH.release();
      pumping = false;
    }
    paintQueue(q.where);
    if (!QUEUE.some((x) => x.state === "wait")) await reload();
    pump();
  }

  /* Длительность и кадр-обложку видео снимает браузер — до загрузки, по
     самому файлу: в списке сразу «Видео · 8:40», а на месте видео — кадр,
     а не чёрный прямоугольник (ffmpeg на сервере нет). */
  function mediaInfo(file) {
    return new Promise((done) => {
      const vid = /^video\//.test(file.type) || /\.(mp4|m4v|mov|webm)$/i.test(file.name);
      const aud = !vid && (/^audio\//.test(file.type) || /\.(mp3|m4a|wav|ogg)$/i.test(file.name));
      if (!vid && !aud) { done({ duration: 0, poster: null }); return; }
      const url = URL.createObjectURL(file);
      const m = document.createElement(vid ? "video" : "audio");
      let fin = false, duration = 0;
      const end = (poster) => {
        if (fin) return;
        fin = true;
        URL.revokeObjectURL(url);
        done({ duration, poster: poster || null });
      };
      m.muted = true;
      m.preload = "auto";
      if (vid) m.playsInline = true;
      m.onloadedmetadata = () => {
        duration = isFinite(m.duration) ? m.duration : 0;
        if (!vid || !m.videoWidth) { end(null); return; }
        m.currentTime = Math.min(1.5, (duration || 3) / 3);
      };
      m.onseeked = () => {
        try {
          const k = Math.min(1, 1280 / m.videoWidth);
          const c = document.createElement("canvas");
          c.width = Math.max(1, Math.round(m.videoWidth * k));
          c.height = Math.max(1, Math.round(m.videoHeight * k));
          c.getContext("2d").drawImage(m, 0, 0, c.width, c.height);
          c.toBlob((b) => end(b), "image/jpeg", 0.82);
        } catch (e) {
          end(null);
        }
      };
      m.onerror = () => end(null);
      setTimeout(() => end(null), 12000);
      m.src = url;
    });
  }

  async function sendItem(q) {
    const info = await mediaInfo(q.file);
    q.state = "send";
    const hdr = { "X-File-Root": "learn", "X-File-Name": encodeURIComponent(q.file.name) };
    if (q.folder) hdr["X-Learn-Folder"] = q.folder;
    if (q.topic) hdr["X-Learn-Topic"] = encodeURIComponent(q.topic);
    if (q.replace) hdr["X-Learn-Replace"] = q.replace;
    if (q.step) hdr["X-Learn-Step"] = q.step;
    if (info.duration) hdr["X-Learn-Duration"] = String(Math.round(info.duration * 10) / 10);
    const got = await xhr("/api/files/upload", q.file, hdr, (n) => { q.loaded = n; paintQueue(q.where); });
    // Кадр — следом, отдельным запросом: не вышло — видео всё равно загружено.
    if (info.poster && got && got.id) {
      try {
        await xhr("/api/learn/items/" + encodeURIComponent(got.id) + "/poster", info.poster, {}, () => {});
      } catch (e) { /* без обложки */ }
    }
  }

  /* Фото подтверждения: браузер поворачивает его по EXIF, читает HEIC с
     айфона и ужимает до 1600 точек — на сервер едет JPEG в сотни КБ. */
  async function shrink(file) {
    const url = URL.createObjectURL(file);
    try {
      const img = await new Promise((ok, fail) => {
        const i = new Image();
        i.onload = () => ok(i);
        i.onerror = () => fail(new Error("не удалось открыть фото — пришлите JPEG или скриншот"));
        i.src = url;
      });
      const k = Math.min(1, 1600 / Math.max(img.naturalWidth, img.naturalHeight));
      const c = document.createElement("canvas");
      c.width = Math.max(1, Math.round(img.naturalWidth * k));
      c.height = Math.max(1, Math.round(img.naturalHeight * k));
      const g = c.getContext("2d");
      g.fillStyle = "#fff";
      g.fillRect(0, 0, c.width, c.height);
      g.drawImage(img, 0, 0, c.width, c.height);
      return await new Promise((ok) => c.toBlob(ok, "image/jpeg", 0.86));
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  async function sendProof(q) {
    let blob = q.file, name = q.file.name || "фото.jpg";
    const isPdf = /\.pdf$/i.test(name) || q.file.type === "application/pdf";
    if (!isPdf) {
      blob = await shrink(q.file);
      name = name.replace(/\.[^.]+$/, "") + ".jpg";
    }
    if (blob.size > PROOF_MAX) throw new Error("больше 8 МБ — пришлите поменьше");
    q.size = blob.size;
    q.state = "send";
    await xhr("/api/learn/steps/" + encodeURIComponent(q.step) + "/proofs", blob,
              { "X-File-Name": encodeURIComponent(name) }, (n) => { q.loaded = n; paintQueue(q.where); });
  }

  function xhr(url, body, headers, onProgress) {
    return new Promise((ok, fail) => {
      const x = new XMLHttpRequest();
      x.open("POST", url);
      x.setRequestHeader("Authorization", "Bearer " + AUTH.token());
      Object.entries(headers).forEach(([k, v]) => x.setRequestHeader(k, v));
      x.setRequestHeader("Content-Type", body.type || "application/octet-stream");
      let last = 0;
      x.upload.addEventListener("progress", (e) => {
        if (Date.now() - last > 300) { last = Date.now(); onProgress(e.loaded); }
      });
      x.addEventListener("load", () => {
        let d = null;
        try { d = JSON.parse(x.responseText); } catch (e) { /* не json */ }
        if (x.status >= 200 && x.status < 300) { ok(d); return; }
        fail(new Error((d && d.error) || (x.status === 413 ? "сервер не принял: файл слишком большой"
          : "ответ сервера " + x.status)));
      });
      x.addEventListener("error", () => fail(new Error("связь оборвалась")));
      x.send(body);
    });
  }

  /* ── просмотр материала ────────────────────────────────────── */
  const fileUrl = (id) => "/api/learn/items/" + encodeURIComponent(id) + "/file";
  const proofUrl = (id) => "/api/learn/proofs/" + encodeURIComponent(id) + "/file";
  const pageUrl = (id, n, w) => `/api/learn/items/${encodeURIComponent(id)}/page/${n}/${w}`;

  /* Ширина листа PDF: экран (не шире 920) с поправкой на плотность точек,
     вверх до ближайшей, которую рисует сервер. */
  function pageW() {
    const want = Math.min(920, innerWidth - 16) * Math.min(2, devicePixelRatio || 1);
    return PAGE_W.find((w) => w >= want) || PAGE_W[PAGE_W.length - 1];
  }

  async function openItem(id, btn) {
    const it = itemOf(id);
    if (!it) return;
    if (it.type === "link") {
      window.open(it.url, "_blank", "noopener");
      track(it, 1, 0);
      return;
    }
    if (it.type === "doc" || (it.type === "pdf" && !it.pages)) {
      try {
        await DL.save(fileUrl(it.id), { btn, name: it.filename });
        track(it, 1, 0);
      } catch (e) {
        toast("Не скачалось: " + e.message, true);
      }
      return;
    }
    viewer(it);
  }

  function vwMeta(it) {
    if (it.type === "pdf") {
      const n = VW && VW.cur ? VW.cur : Math.max(1, Math.round(it.pos || 1));
      return `Лист ${n} из ${it.pages} · прочитано ${Math.round((VW ? VW.seen : it.seen || 0) * 100)}%`;
    }
    if (it.type === "video" || it.type === "audio") {
      const s = VW ? VW.seen : it.seen || 0;
      return `${it.type === "video" ? "Видео" : "Аудио"}${it.duration ? " · " + clock(it.duration) : ""} · досмотрено ${Math.round(s * 100)}%`;
    }
    return itemLong(it);
  }

  function vwBody(it, src) {
    if (it.type === "pdf") {
      const w = pageW();
      let h = "";
      for (let n = 1; n <= it.pages; n++) {
        const r = it.ratios[n - 1] || it.ratios[0] || 1.414;
        h += `<figure class="ln-pg" data-pg="${n}" style="aspect-ratio:1/${r}">
          <img loading="lazy" decoding="async" alt="Лист ${n}" src="${pageUrl(it.id, n, w)}"><figcaption>${n}</figcaption></figure>`;
      }
      return `<div class="ln-pdf">${h}</div>`;
    }
    if (it.type === "video") {
      return `<div class="ln-media"><video controls playsinline preload="metadata" src="${esc(fileUrl(it.id))}"></video>
        <p class="ln-media-err" hidden>Видео не воспроизводится на этом устройстве — скачайте файл кнопкой вверху.</p></div>`;
    }
    if (it.type === "audio") {
      return `<div class="ln-media audio"><span class="ln-media-ic">${ICO.audio}</span><b>${esc(it.title)}</b>
        <audio controls preload="metadata" src="${esc(fileUrl(it.id))}"></audio></div>`;
    }
    return `<div class="ln-imgv"><img src="${esc(src || thumbUrl(it, 1600))}" alt="${esc(it.title)}"></div>`;
  }

  /* Материал во весь экран. В историю ложится запись — «назад» телефона
     закрывает просмотр, а не уводит со страницы. src — чужая картинка
     (фото подтверждения): её не учитываем. */
  /* Учёт просмотра одного материала: сколько просмотрено, где остановился,
     что уже ушло на сервер. Один — у материала во весь экран (VW), другой
     — у видео урока на странице темы (quiet: без перерисовки). */
  const ACTIVE = new Set();
  const tracker = (it, extra) => Object.assign({ it, seen: it.seen || 0, pos: it.pos || 0,
                                                 sent: it.seen || 0, sentPos: it.pos || 0, t: 0 }, extra || {});

  function viewer(it, src) {
    shut(true);
    const box = document.createElement("div");
    box.className = "ln-vw t-" + it.type;
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-modal", "true");
    box.setAttribute("aria-label", it.title);
    box.innerHTML = `
      <div class="ln-vw-top">
        <button type="button" class="ln-vw-x" data-vw-x aria-label="Закрыть">${ICO.back}<span>Закрыть</span></button>
        <div class="ln-vw-t"><b>${esc(it.title)}</b><i data-vw-m>${esc(vwMeta(it))}</i></div>
        ${src ? "" : `<button type="button" class="ln-ib" data-vw-dl title="Скачать файл" aria-label="Скачать файл">${ICO.download}</button>`}
      </div>
      <div class="ln-vw-b" data-vw-b>${vwBody(it, src)}</div>
      ${!src && TRACKED.includes(it.type) ? `<div class="ln-vw-bar"><i data-vw-bar style="width:${Math.round((it.seen || 0) * 100)}%"></i></div>` : ""}`;
    document.body.appendChild(box);
    document.documentElement.classList.add("ln-lock");
    VW = tracker(it, { box, track: !src, cur: 0, obs: null });
    history.pushState({ ln: 1, lnv: 1 }, "", location.href);
    $q("[data-vw-x]", box).addEventListener("click", () => history.back());
    const dl = $q("[data-vw-dl]", box);
    if (dl) {
      dl.addEventListener("click", () => DL.save(fileUrl(it.id), { btn: dl, name: it.filename })
        .catch((e) => toast("Не скачалось: " + e.message, true)));
    }
    if (VW.track) {
      if (it.type === "pdf") wirePdf(box, it);
      else if (it.type === "video" || it.type === "audio") {
        wireMedia($q("video, audio", box), VW, paintVw, () => {
          const p = $q(".ln-media-err", box);
          if (p) p.hidden = false;
        });
      } else { VW.seen = 1; save(VW); }
    }
    $q("[data-vw-x]", box).focus({ preventScroll: true });
  }

  function paintVw() {
    if (!VW) return;
    const m = $q("[data-vw-m]", VW.box), bar = $q("[data-vw-bar]", VW.box);
    if (m) m.textContent = vwMeta(VW.it);
    if (bar) bar.style.width = Math.round(VW.seen * 100) + "%";
  }

  /* PDF: лист засчитан, когда он больше чем наполовину на экране. Доля —
     самый дальний лист, до которого долистали; место — где сейчас. */
  function wirePdf(box, it) {
    const body = $q("[data-vw-b]", box);
    let far = Math.round((it.seen || 0) * it.pages);
    const obs = new IntersectionObserver((ents) => {
      for (const e of ents) {
        if (!e.isIntersecting || !e.rootBounds) continue;
        const vis = e.intersectionRect.height / Math.min(e.boundingClientRect.height, e.rootBounds.height);
        if (vis < 0.55) continue;
        const n = Number(e.target.dataset.pg);
        VW.cur = n;
        if (n > far) far = n;
      }
      VW.pos = VW.cur || VW.pos;
      VW.seen = Math.max(VW.seen, far / it.pages);
      paintVw();
      soon(VW, 2500);
    }, { root: body, threshold: [0, 0.25, 0.5, 0.75, 1] });
    $qa(".ln-pg", body).forEach((f) => obs.observe(f));
    VW.obs = obs;
    const at = Math.round(it.pos || 0);
    if (at > 1 && at <= it.pages) {
      const f = $q(`.ln-pg[data-pg="${at}"]`, body);
      if (f) {
        requestAnimationFrame(() => { body.scrollTop = f.offsetTop - 10; });
        toast(`Продолжаем с листа ${at}`);
      }
    }
  }

  /* Видео: досмотренное — это просмотренные куски (played) этого раза плюс
     засчитанное раньше от начала; перемотка в конец досмотром не считается. */
  function wireMedia(m, tr, paint, onErr) {
    if (!m) return;
    const it = tr.it;
    let dur = it.duration || 0;
    m.addEventListener("loadedmetadata", () => {
      if (isFinite(m.duration) && m.duration > 0) dur = m.duration;
      if (it.pos > 5 && dur && it.pos < dur - 5 && m.currentTime < 1) {
        m.currentTime = it.pos;
        toast("Продолжаем с " + clock(it.pos));
      }
    });
    const upd = () => {
      if (!dur) return;
      const r = [[0, (it.seen || 0) * dur]];
      for (let i = 0; i < m.played.length; i++) r.push([m.played.start(i), m.played.end(i)]);
      r.sort((a, b) => a[0] - b[0]);
      let tot = 0, s0 = r[0][0], e0 = r[0][1];
      for (const [s, e] of r.slice(1)) {
        if (s > e0) { tot += e0 - s0; s0 = s; e0 = e; } else e0 = Math.max(e0, e);
      }
      tot += e0 - s0;
      tr.seen = Math.max(tr.seen, Math.min(1, tot / dur));
      tr.pos = m.ended ? 0 : m.currentTime;
      paint();
      soon(tr, 8000);
    };
    m.addEventListener("timeupdate", upd);
    m.addEventListener("pause", () => { upd(); save(tr); });
    m.addEventListener("ended", () => { upd(); save(tr); });
    m.addEventListener("error", () => { if (onErr) onErr(); });
  }

  function soon(tr, ms) {
    if (!tr || tr.t) return;
    tr.t = setTimeout(() => { tr.t = 0; save(tr); }, ms);
  }

  function save(tr, keep) {
    if (!tr || tr.track === false) return;
    const s = Math.round(Math.min(1, tr.seen) * 1000) / 1000, p = Math.round((tr.pos || 0) * 10) / 10;
    if (s <= tr.sent + 0.004 && Math.abs(p - tr.sentPos) < 1) return;
    tr.sent = Math.max(tr.sent, s);
    tr.sentPos = p;
    track(tr.it, s, p, keep, tr.quiet);
  }

  /* Сколько просмотрено — на сервер. Засчитал он тему — говорим и
     перерисовываем. keep — уходит и при закрытии вкладки. */
  async function track(it, s, pos, keep, quiet) {
    it.seen = Math.max(it.seen || 0, s);
    it.pos = pos;
    let res = null;
    try {
      const r = await fetch("/api/learn/items/" + encodeURIComponent(it.id) + "/seen", {
        method: "POST", keepalive: !!keep,
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + AUTH.token() },
        body: JSON.stringify({ seen: s, pos }),
      });
      if (r.ok) res = await r.json();
    } catch (e) { /* связь — досчитаем в следующий раз */ }
    if (res && res.done && res.done.length) {
      toast(res.done.length > 1 ? "Темы засчитаны" : "Тема засчитана");
      await reload();
    } else if (!VW && !quiet && isOn()) render();
  }

  /* Закрыть просмотр. quiet — без перерисовки (открывают другой). */
  function shut(quiet) {
    if (!VW) return;
    const v = VW;
    clearTimeout(v.t);
    v.t = 0;
    save(v, true);
    if (v.obs) v.obs.disconnect();
    $qa("video, audio", v.box).forEach((m) => { try { m.pause(); } catch (e) { /* уже */ } });
    v.box.remove();
    VW = null;
    document.documentElement.classList.remove("ln-lock");
    if (!quiet && isOn()) render();
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && VW && !document.querySelector(".pf-modal")) history.back();
  });
  addEventListener("pagehide", () => {
    if (VW) save(VW, true);
    ACTIVE.forEach((tr) => save(tr, true));
  });

  /* ── окна ──────────────────────────────────────────────────── */
  function modal(title, inner, okLabel, onOk, opts) {
    opts = opts || {};
    const box = document.createElement("div");
    box.className = "pf-modal ln-modal";
    box.innerHTML = `
      <form class="pf-crop cnt-card ln-form${opts.wide ? " wide" : ""}" role="dialog" aria-label="${esc(title)}" novalidate>
        <h3>${esc(title)}</h3>
        ${inner}
        <div class="ln-form-err" hidden></div>
        <div class="pf-modal-foot">${opts.extra || ""}<span class="grow"></span>
          <button type="button" class="btn-ghost" data-no>Отмена</button>
          <button type="submit" class="btn-brand" data-ok>${esc(okLabel)}</button>
        </div>
      </form>`;
    document.body.appendChild(box);
    const form = $q("form", box), err = $q(".ln-form-err", box), ok = $q("[data-ok]", box);
    const close = () => { document.removeEventListener("keydown", key, true); box.remove(); };
    const key = (e) => { if (e.key === "Escape") { e.stopPropagation(); close(); } };
    document.addEventListener("keydown", key, true);
    box.addEventListener("mousedown", (e) => { if (e.target === box) close(); });
    $q("[data-no]", box).addEventListener("click", close);
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
    const first = $q("input:not([type=checkbox]):not([type=file]):not([type=radio]), textarea", box);
    if (first && FINE.matches) first.focus();
    return { box, form, close, err };
  }
  const val = (form, name) => (form.elements[name] ? String(form.elements[name].value || "").trim() : "");


  async function newFolder() {
    const cur = curFolder(), f = folderOf(cur);
    const title = await ASK.prompt(f ? `Новая папка в «${f.title}»` : "Новая папка", "",
                                   { ok: "Создать", placeholder: "Например: Охрана труда" });
    if (!title) return;
    try {
      const got = await AUTH.api("POST", "/learn/folders", { title, parent_id: cur });
      await fetchAll();
      go({ tab: "lib", id: got.id });
    } catch (e) {
      ASK.alert(e.message, { title: "Папка не завелась" });
    }
  }

  function folderDialog(id) {
    const f = folderOf(id);
    if (!f) return;
    const n = inside(id);
    const m = modal("Папка", `
      <label class="ln-fld"><span>Название</span><input name="title" maxlength="200" value="${esc(f.title)}" required></label>
      <label class="ln-fld"><span>Лежит в</span><select name="parent">${folderOptions(f.parent_id, id)}</select></label>
      <p class="ln-form-hint">Внутри: ${esc(nMats(n.items))}${n.folders ? `, ${n.folders} ${plural(n.folders, "папка", "папки", "папок")}` : ""}.
        Удалить можно и непустую — материалы и папки переедут на уровень выше, ничего не сотрётся.</p>`,
    "Сохранить", async (form) => {
      await AUTH.api("PATCH", "/learn/folders/" + id, { title: val(form, "title"), parent_id: val(form, "parent") });
      await reload();
    }, { extra: `<button type="button" class="btn-ghost warn" data-del>${ICO.trash}Удалить</button>` });
    $q("[data-del]", m.box).addEventListener("click", async () => {
      const up = folderOf(f.parent_id);
      const where = up ? `в «${up.title}»` : "на верхний уровень";
      if (!(await ASK.confirm(`Удалить папку «${f.title}»? ${n.items || n.folders
        ? `Её материалы и папки переедут ${where} — ничего не сотрётся.` : "Она пустая."}`))) return;
      try {
        const r = await AUTH.api("DELETE", "/learn/folders/" + id);
        m.close();
        await fetchAll();
        if (R.tab === "lib" && inside(id).ids.has(R.id) || R.id === id) go({ tab: "lib", id: r.parent_id }, true);
        else render();
        toast("Папка удалена");
      } catch (e) {
        m.err.textContent = e.message;
        m.err.hidden = false;
      }
    });
  }

  function newProgram() {
    modal("Новая программа", `
      <label class="ln-fld"><span>Название</span><input name="title" maxlength="200" required
        placeholder="Например: «Старт мастера» или «План развития Иванова»"></label>
      <label class="ln-fld"><span>Описание</span><textarea name="about" rows="3"
        placeholder="Для кого и зачем — мастер прочитает это первым"></textarea></label>
      <p class="ln-form-hint">Программа появится черновиком — её видят только составители. Соберите главы и темы,
        выберите, кому назначить, и опубликуйте.</p>`, "Создать", async (form) => {
      const title = val(form, "title");
      if (!title) throw new Error("Напишите название");
      const got = await AUTH.api("POST", "/learn/programs", { title, about: val(form, "about") });
      await fetchAll();
      go({ tab: "e", id: got.id, sub: "set" });
    });
  }

  function linkDialog(step) {
    modal("Ссылка в материалы", `
      <label class="ln-fld"><span>Адрес</span><input name="url" inputmode="url" required placeholder="https://rutube.ru/video/…"></label>
      <label class="ln-fld"><span>Название</span><input name="title" maxlength="200" placeholder="Как назвать в списке"></label>
      ${step ? "" : `<label class="ln-fld"><span>Папка</span><select name="folder">${folderOptions(curFolder())}</select></label>`}
      <label class="ln-fld"><span>Пара слов</span><input name="note" maxlength="300" placeholder="О чём материал — необязательно"></label>`,
    "Добавить", async (form) => {
      await AUTH.api("POST", "/learn/links", { url: val(form, "url"), title: val(form, "title"),
                                              note: val(form, "note"), step_id: step || "",
                                              // Из темы — в папку программы, как и загруженные файлы.
                                              folder_id: step ? "" : val(form, "folder"),
                                              topic: step ? progTitle() : "" });
      await reload();
      toast("Ссылка добавлена");
    });
  }

  function itemDialog(id) {
    const it = itemOf(id);
    if (!it) return;
    const where = [];
    (DATA.manage ? DATA.manage.programs : []).forEach((p) => p.chapters.forEach((ch) => ch.steps.forEach((s) => {
      if (s.items.includes(id)) where.push(`${p.title} › ${s.title}`);
    })));
    const m = modal("Материал", `
      <div class="ln-form-it t-${it.type}"><span class="ln-mat-ic">${typeIco(it)}</span><span><b>${esc(it.filename || it.url)}</b>
        <i>${esc(itemLong(it))} · ${esc(it.author)}, ${esc(dt(it.at))}</i></span></div>
      <label class="ln-fld"><span>Название</span><input name="title" maxlength="200" value="${esc(it.title)}" required></label>
      ${it.type === "link" ? `<label class="ln-fld"><span>Адрес</span><input name="url" value="${esc(it.url)}" required></label>` : ""}
      <label class="ln-fld"><span>Папка</span><select name="folder">${folderOptions(it.folder_id)}</select></label>
      <label class="ln-fld"><span>Пара слов</span><input name="note" maxlength="300" value="${esc(it.note)}" placeholder="О чём материал"></label>
      ${it.kind === "file" ? `<p class="ln-form-hint">«Заменить файл» — для новой редакции: материал останется во всех темах,
        а мастерам, которые уже смотрели прежний, он пометится «Обновлено».</p>` : ""}
      <div class="ln-form-where"><b>${where.length ? "Используется в темах" : "Пока ни в одной теме"}</b>
        ${where.map((w) => `<span>${esc(w)}</span>`).join("")}</div>`,
    "Сохранить", async (form) => {
      const body = { title: val(form, "title"), folder_id: val(form, "folder"), note: val(form, "note") };
      if (it.type === "link") body.url = val(form, "url");
      await AUTH.api("PATCH", "/learn/items/" + id, body);
      await reload();
    }, { extra: `<button type="button" class="btn-ghost warn" data-del>${ICO.trash}Удалить</button>`
        + (it.kind === "file" ? `<label class="btn-ghost" title="Новая редакция — во всех темах сразу">${ICO.upload}Заменить файл
          <input type="file" hidden data-replace></label>` : "") });
    const rp = $q("[data-replace]", m.box);
    if (rp) {
      rp.addEventListener("change", () => {
        const f = rp.files && rp.files[0];
        if (!f) return;
        m.close();
        enqueue([f], { where: "lib", replace: id, folder: it.folder_id });
        toast(`Заменяю файл «${it.title}» — во всех темах встанет новый`);
      });
    }
    $q("[data-del]", m.box).addEventListener("click", async () => {
      const msg = where.length ? `Удалить «${it.title}»? Он уйдёт и из ${where.length} ${plural(where.length, "темы", "тем", "тем")}.`
        : `Удалить «${it.title}» из материалов?`;
      if (!(await ASK.confirm(msg))) return;
      try {
        await AUTH.api("DELETE", "/learn/items/" + id);
        m.close();
        await reload();
        toast("Материал удалён");
      } catch (e) {
        m.err.textContent = e.message;
        m.err.hidden = false;
      }
    });
  }

  /* Выбор материалов из библиотеки в тему: поиск, рубрики, галочки. */
  function pickItems(p, s) {
    const have = new Set(s.items);
    const pool = DATA.items.filter((it) => !have.has(it.id));
    if (!pool.length) {
      toast(DATA.items.length ? "Все материалы библиотеки уже в этой теме" : "Библиотека пуста — загрузите файл", true);
      return;
    }
    const sel = new Set();
    let q = "";
    const rows = () => {
      const list = pool.filter((it) => !q || `${it.title} ${pathOf(it.folder_id)} ${it.filename}`.toLowerCase().includes(q));
      return list.length ? list.map((it) => `<label class="ln-pick t-${it.type}">
          <input type="checkbox" value="${esc(it.id)}"${sel.has(it.id) ? " checked" : ""}>
          <span class="ln-mat-ic">${typeIco(it)}</span>
          <span class="ln-li-b"><b>${esc(it.title)}</b><i>${esc([pathOf(it.folder_id), itemLong(it)].filter(Boolean).join(" · "))}</i></span></label>`).join("")
        : `<p class="ln-none">Ничего не нашлось</p>`;
    };
    const m = modal("Материалы из библиотеки", `
      <label class="ln-find">${ICO.find}<input type="search" data-q placeholder="Название или папка" autocomplete="off"></label>
      <div class="ln-picks" data-list>${rows()}</div>`, "Добавить", async () => {
      if (!sel.size) throw new Error("Отметьте материалы");
      await AUTH.api("PATCH", "/learn/steps/" + s.id, { items: s.items.concat([...sel]) });
      await reload();
    }, { wide: true });
    const ok = $q("[data-ok]", m.box);
    const count = () => { ok.textContent = sel.size ? `Добавить (${sel.size})` : "Добавить"; };
    $q("[data-q]", m.box).addEventListener("input", (e) => {
      q = e.target.value.trim().toLowerCase();
      $q("[data-list]", m.box).innerHTML = rows();
    });
    $q("[data-list]", m.box).addEventListener("change", (e) => {
      if (e.target.checked) sel.add(e.target.value); else sel.delete(e.target.value);
      count();
    });
  }

  /* Кому поимённо: поиск, «отметить найденных» — например, всех мастеров. */
  function pickPeople(p) {
    const users = DATA.manage.users;
    const sel = new Set(p.members);
    let q = "";
    const found = () => users.filter((u) => !q || `${u.name} ${u.job_title}`.toLowerCase().includes(q));
    const rows = () => found().map((u) => `<label class="ln-pick">
        <input type="checkbox" value="${esc(u.id)}"${sel.has(u.id) ? " checked" : ""}>${avatarHtml(u)}
        <span class="ln-li-b"><b>${esc(u.name)}</b><i>${esc(u.job_title || ROLE[u.role] || "")}</i></span></label>`).join("")
      || `<p class="ln-none">Никого не нашлось</p>`;
    const m = modal(p.audience === "some" ? "Кому назначить" : "Ещё поимённо", `
      <label class="ln-find">${ICO.find}<input type="search" data-q placeholder="Имя или должность" autocomplete="off"></label>
      <div class="ln-pick-tools"><button type="button" class="lnk" data-all>Отметить найденных</button>
        <button type="button" class="lnk" data-none>Снять все</button><span class="grow"></span><i data-n></i></div>
      <div class="ln-picks" data-list>${rows()}</div>`, "Сохранить", async () => {
      await patchProg(p.id, { members: [...sel] });
    }, { wide: true });
    const paint = () => {
      $q("[data-list]", m.box).innerHTML = rows();
      $q("[data-n]", m.box).textContent = sel.size ? `выбрано ${sel.size}` : "";
    };
    paint();
    $q("[data-q]", m.box).addEventListener("input", (e) => { q = e.target.value.trim().toLowerCase(); paint(); });
    $q("[data-list]", m.box).addEventListener("change", (e) => {
      if (e.target.checked) sel.add(e.target.value); else sel.delete(e.target.value);
      $q("[data-n]", m.box).textContent = sel.size ? `выбрано ${sel.size}` : "";
    });
    $q("[data-all]", m.box).addEventListener("click", () => { found().forEach((u) => sel.add(u.id)); paint(); });
    $q("[data-none]", m.box).addEventListener("click", () => { sel.clear(); paint(); });
  }

  function publish(p) {
    const steps = stepsOf(p);
    if (!steps) {
      toast("В программе нет ни одной темы — добавьте хотя бы одну", true);
      return;
    }
    const who = p.audience === "all" ? `Всем сотрудникам — ${reach(p)}`
      : p.audience === "new" ? "Новым сотрудникам — тем, кого заведут после публикации"
        : p.members.length ? `Выбранным: ${nPeople(p.members.length)}` : "";
    if (!who) {
      toast("Выберите, кому назначить программу", true);
      return;
    }
    modal("Опубликовать программу?", `
      <div class="ln-form-sum">
        <div><span>Программа</span><b>${esc(p.title)}</b></div>
        <div><span>Темы</span><b>${p.chapters.length} ${plural(p.chapters.length, "глава", "главы", "глав")} · ${nTopics(steps)}</b></div>
        <div><span>Кому</span><b>${esc(who)}${p.audience !== "some" && p.members.length ? ` + ${nPeople(p.members.length)} поимённо` : ""}</b></div>
        <div><span>Срок</span><b>${p.due_days ? nDays(p.due_days) + " с дня назначения" : "без срока"}</b></div>
      </div>
      <p class="ln-form-hint">Программа сразу появится у них в «Моём обучении». Править её можно и после — изменения видны сразу.</p>`,
    "Опубликовать", async () => {
      await patchProg(p.id, { status: "live" });
      toast("Программа опубликована");
    });
  }

  function returnDialog(uid, sid) {
    modal("Вернуть на доработку", `
      <label class="ln-fld"><span>Что поправить</span><textarea name="note" rows="4" required
        placeholder="Например: нужно фото с объекта, а не из офиса"></textarea></label>
      <p class="ln-form-hint">Мастер увидит замечание у темы, а тема перестанет считаться пройденной, пока он не пришлёт новое.</p>`,
    "Вернуть", async (form) => {
      const note = val(form, "note");
      if (!note) throw new Error("Напишите, что поправить");
      await AUTH.api("POST", "/learn/review", { user_id: uid, step_id: sid, verdict: "back", note });
      await reload();
      toast("Возвращено с замечанием");
    });
  }

  /* ── всплывающая подпись ───────────────────────────────────── */
  let toastT = 0;
  function toast(text, bad) {
    let el = $q(".ln-toast");
    if (!el) {
      el = document.createElement("div");
      el.className = "ln-toast";
      el.setAttribute("role", "status");
      document.body.appendChild(el);
    }
    el.textContent = text;
    el.classList.toggle("bad", !!bad);
    el.classList.add("on");
    clearTimeout(toastT);
    toastT = setTimeout(() => el.classList.remove("on"), bad ? 4200 : 2600);
  }

  function saved() {
    const el = $q("#sec-lrn [data-saved]");
    if (!el) return;
    el.textContent = "Сохранено";
    el.classList.add("on");
    clearTimeout(saved.t);
    saved.t = setTimeout(() => el.classList.remove("on"), 1600);
  }

  /* ── правки составителя ────────────────────────────────────── */
  async function patchProg(pid, body) {
    await AUTH.api("PATCH", "/learn/programs/" + pid, body);
    await reload();
  }

  const TIMERS = {};
  function later(key, fn, ms) {
    if (TIMERS[key]) clearTimeout(TIMERS[key].t);
    TIMERS[key] = { fn, t: setTimeout(() => { delete TIMERS[key]; fn(); }, ms || 700) };
  }
  function flush(key) {
    const x = TIMERS[key];
    if (!x) return;
    clearTimeout(x.t);
    delete TIMERS[key];
    x.fn();
  }
  const flushAll = () => Object.keys(TIMERS).forEach(flush);

  /* Текст сохраняется на ходу — без кнопки «Сохранить»; на экране
     поправляем у себя, без перерисовки, чтобы не сбить курсор. */
  async function saveStep(sid, field, value) {
    try {
      await AUTH.api("PATCH", "/learn/steps/" + sid, { [field]: value });
      const p = mprog(R.id), s = p && findMStep(p, sid);
      if (s) s[field] = value;
      if (field === "title") {
        const b = $q(`#sec-lrn [data-drag-step="${sid}"] .ln-eo-sb b`);
        if (b) b.textContent = value;
      }
      saved();
    } catch (e) {
      toast(e.message, true);
    }
  }

  async function saveProgField(pid, field, value) {
    try {
      await AUTH.api("PATCH", "/learn/programs/" + pid, { [field]: value });
      const p = mprog(pid);
      if (p) p[field] = value;
      if (field === "title") {
        const h = $q("#sec-lrn .ln-strip .pg-h1 h2");
        if (h) h.textContent = value;
      }
      saved();
    } catch (e) {
      toast(e.message, true);
    }
  }

  async function moveStep(dir) {
    const p = mprog(R.id);
    if (!p) return;
    const flat = [];
    p.chapters.forEach((ch) => ch.steps.forEach((s) => flat.push({ ch, s })));
    const i = flat.findIndex((x) => x.s.id === R.sub);
    const j = i + (dir === "up" ? -1 : 1);
    if (i < 0 || j < 0 || j >= flat.length) return;
    const a = flat[i], b = flat[j];
    if (a.ch === b.ch) {
      const k = a.ch.steps.indexOf(a.s), l = a.ch.steps.indexOf(b.s);
      a.ch.steps.splice(k, 1, b.s);
      a.ch.steps.splice(l, 1, a.s);
    } else {
      // На границе глав тема переезжает в соседнюю главу.
      a.ch.steps.splice(a.ch.steps.indexOf(a.s), 1);
      if (dir === "up") b.ch.steps.push(a.s); else b.ch.steps.unshift(a.s);
    }
    render();
    await saveOrder(p);
  }

  async function saveOrder(p) {
    try {
      await AUTH.api("POST", "/learn/programs/" + p.id + "/order",
                     { chapters: p.chapters.map((c) => ({ id: c.id, steps: c.steps.map((s) => s.id) })) });
    } catch (e) {
      toast(e.message, true);
    }
    await reload();
  }

  /* ── перетаскивание ────────────────────────────────────────── */
  function clearMarks() {
    $qa("#sec-lrn .drop-before, #sec-lrn .drop-after, #sec-lrn .drop-in").forEach((el) =>
      el.classList.remove("drop-before", "drop-after", "drop-in"));
  }

  /* Загруженное из темы ложится в библиотеку рубрикой по названию
     программы — не «без рубрики»; поменять можно в «Материалах». */
  const progTitle = () => ((R.tab === "e" && mprog(R.id)) || {}).title || "";

  const hasFiles = (e) => !!e.dataTransfer && [...(e.dataTransfer.types || [])].includes("Files");
  /* Куда лягут брошенные в окно файлы: в открытую тему конструктора или
     в библиотеку — в выбранную рубрику. */
  function dropTarget() {
    if (!DATA || !DATA.admin) return null;
    if (R.tab === "e" && R.sub && R.sub !== "set") return { where: "s:" + R.sub, step: R.sub, topic: progTitle() };
    if (R.tab === "lib") return { where: "lib", folder: curFolder() };
    return null;
  }

  function onDragStart(e) {
    const lib = e.target.closest && e.target.closest("[data-drag-item], [data-drag-folder]");
    if (lib) {
      DRAG = lib.dataset.dragItem ? { type: "item", id: lib.dataset.dragItem, el: lib }
        : { type: "folder", id: lib.dataset.dragFolder, el: lib };
      e.dataTransfer.effectAllowed = "move";
      try { e.dataTransfer.setData("text/plain", DRAG.id); } catch (x) { /* старый браузер */ }
      requestAnimationFrame(() => lib.classList.add("dragging"));
      return;
    }
    const st = e.target.closest && e.target.closest("[data-drag-step]");
    const ch = e.target.closest && e.target.closest("[data-drag-ch]");
    if (st) DRAG = { type: "step", id: st.dataset.dragStep, el: st };
    else if (ch && ch.getAttribute("draggable") === "true") {
      DRAG = { type: "ch", id: ch.dataset.dragCh, el: ch.closest(".ln-eo-ch") };
    } else return;
    e.dataTransfer.effectAllowed = "move";
    try { e.dataTransfer.setData("text/plain", DRAG.id); } catch (x) { /* старый браузер */ }
    const el = DRAG.el;
    requestAnimationFrame(() => el.classList.add("dragging"));
  }

  function onDragOver(e) {
    if (!DRAG) {
      if (hasFiles(e) && dropTarget()) {
        e.preventDefault();
        $q("#sec-lrn").classList.add("ln-drop");
        // Файлы над плиткой папки лягут в неё.
        clearMarks();
        const t = R.tab === "lib" && e.target.closest("[data-drop-folder]");
        if (t) t.classList.add("drop-in");
      }
      return;
    }
    if (DRAG.type === "item" || DRAG.type === "folder") {
      const t = e.target.closest("[data-drop-folder]");
      clearMarks();
      if (!t || (DRAG.type === "folder" && t.dataset.dropFolder === DRAG.id)) return;
      e.preventDefault();
      t.classList.add("drop-in");
      DROP = { folder: t.dataset.dropFolder };
      return;
    }
    if (DRAG.type === "step") {
      const list = e.target.closest("[data-drop-ch]");
      if (!list) return;
      e.preventDefault();
      clearMarks();
      const row = e.target.closest("[data-drag-step]");
      if (row && row !== DRAG.el) {
        const r = row.getBoundingClientRect();
        const after = e.clientY > r.top + r.height / 2;
        row.classList.add(after ? "drop-after" : "drop-before");
        let nx = row;
        if (after) {
          nx = row.nextElementSibling;
          while (nx && (!nx.dataset.dragStep || nx === DRAG.el)) nx = nx.nextElementSibling;
        }
        DROP = { ch: list.dataset.dropCh, before: nx ? nx.dataset.dragStep : null };
      } else if (!row) {
        list.classList.add("drop-in");
        DROP = { ch: list.dataset.dropCh, before: null };
      }
      return;
    }
    const sec = e.target.closest(".ln-eo-ch");
    if (!sec || sec === DRAG.el) return;
    e.preventDefault();
    clearMarks();
    const r = sec.getBoundingClientRect();
    const after = e.clientY > r.top + r.height / 2;
    sec.classList.add(after ? "drop-after" : "drop-before");
    let nx = after ? sec.nextElementSibling : sec;
    while (nx && (!nx.classList.contains("ln-eo-ch") || nx === DRAG.el)) nx = nx.nextElementSibling;
    DROP = { before: nx ? nx.dataset.ch : null };
  }

  function onDragLeave(e) {
    const host = $q("#sec-lrn");
    if (!DRAG && host && !host.contains(e.relatedTarget)) host.classList.remove("ln-drop");
  }

  async function onDrop(e) {
    const host = $q("#sec-lrn");
    if (!DRAG) {
      host.classList.remove("ln-drop");
      const t = hasFiles(e) && dropTarget();
      if (!t) return;
      e.preventDefault();
      const tile = R.tab === "lib" && e.target.closest("[data-drop-folder]");
      clearMarks();
      enqueue([...e.dataTransfer.files], tile ? Object.assign({}, t, { folder: tile.dataset.dropFolder }) : t);
      return;
    }
    e.preventDefault();
    const d = DRAG, to = DROP;
    DRAG = DROP = null;
    clearMarks();
    if (d.type === "item" || d.type === "folder") {
      if (!to) return;
      const it = d.type === "item" ? itemOf(d.id) : folderOf(d.id);
      if (!it || (d.type === "item" ? it.folder_id : it.parent_id) === to.folder) return;
      const name = to.folder ? `«${(folderOf(to.folder) || {}).title || ""}»` : "верхний уровень";
      act(async () => {
        if (d.type === "item") await AUTH.api("PATCH", "/learn/items/" + d.id, { folder_id: to.folder });
        else await AUTH.api("PATCH", "/learn/folders/" + d.id, { parent_id: to.folder });
        await reload();
        toast(`Перенесено в ${name}`);
      });
      return;
    }
    const p = mprog(R.id);
    if (!p || !to) { render(); return; }
    if (d.type === "step") {
      let moved = null;
      p.chapters.forEach((c) => {
        const i = c.steps.findIndex((s) => s.id === d.id);
        if (i >= 0) moved = c.steps.splice(i, 1)[0];
      });
      const ch = p.chapters.find((c) => c.id === to.ch);
      if (!moved || !ch) { await reload(); return; }
      const at = to.before ? ch.steps.findIndex((s) => s.id === to.before) : -1;
      ch.steps.splice(at < 0 ? ch.steps.length : at, 0, moved);
    } else {
      const i = p.chapters.findIndex((c) => c.id === d.id);
      if (i < 0) return;
      const [moved] = p.chapters.splice(i, 1);
      const at = to.before ? p.chapters.findIndex((c) => c.id === to.before) : -1;
      p.chapters.splice(at < 0 ? p.chapters.length : at, 0, moved);
    }
    render();
    await saveOrder(p);
  }

  function onDragEnd() {
    if (DRAG && DRAG.el) DRAG.el.classList.remove("dragging");
    $qa("#sec-lrn [data-drag-ch][draggable]").forEach((el) => el.removeAttribute("draggable"));
    DRAG = null;
    clearMarks();
  }

  /* ── обработчики ───────────────────────────────────────────── */
  let wired = false;
  function ensureHost() {
    const host = $q("#sec-lrn");
    if (!host || wired) return;
    wired = true;
    host.addEventListener("click", onClick);
    host.addEventListener("change", onChange);
    host.addEventListener("input", onInput);
    host.addEventListener("keydown", (e) => {
      const row = e.target.closest && e.target.closest("tr[data-person]");
      if (row && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); go({ tab: "people", id: row.dataset.person }); }
      if (e.key === "Enter" && e.target.matches("[data-ch-title], .ln-ed-title")) e.target.blur();
    });
    // Главу тянут только за ручку: в шапке главы поле названия, и
    // перетаскивание всей шапки не давало бы выделить в нём текст.
    host.addEventListener("pointerdown", (e) => {
      const g = e.target.closest(".ln-eo-chh .ln-grip");
      if (g) g.closest("[data-drag-ch]").setAttribute("draggable", "true");
    });
    host.addEventListener("dragstart", onDragStart);
    host.addEventListener("dragover", onDragOver);
    host.addEventListener("dragleave", onDragLeave);
    host.addEventListener("drop", onDrop);
    host.addEventListener("dragend", onDragEnd);
    host.addEventListener("focusout", onBlur);
    WIDE.addEventListener("change", () => { if (isOn()) render(); });
  }

  async function act(fn) {
    try {
      await fn();
    } catch (e) {
      toast(e.message, true);
    }
  }

  function onClick(e) {
    const t = e.target;
    // Карандаш на плитке папки — внутри ссылки на папку: сперва он.
    const fe = t.closest("[data-folder-edit]");
    if (fe) { e.preventDefault(); folderDialog(fe.dataset.folderEdit); return; }
    const a = t.closest("a[href^='?s=lrn']");
    if (a) {
      if (e.ctrlKey || e.metaKey || e.shiftKey || e.button) return;
      e.preventDefault();
      const r = parse(a.getAttribute("href").slice(6));
      if (r) go(r);
      return;
    }
    const b = t.closest("button, [data-person]");
    if (!b) return;
    const d = b.dataset;
    if (b.matches("tr[data-person]")) { go({ tab: "people", id: d.person }); return; }
    if ("retry" in d) { load(); return; }
    if (d.open) { openItem(d.open, b); return; }
    if (d.resume) { resume(d.resume, d.step); return; }
    if (d.cont) {
      const row = b.closest(".ln-cont").querySelector(".ln-cont-row");
      row.scrollBy({ left: Number(d.cont) * row.clientWidth * 0.85, behavior: "smooth" });
      return;
    }
    if (d.dlItem) {
      const it = itemOf(d.dlItem);
      if (it) DL.save(fileUrl(it.id), { btn: b, name: it.filename }).catch((x) => toast("Не скачалось: " + x.message, true));
      return;
    }
    if ("togDone" in d) { SHOW_DONE = !SHOW_DONE; render(); return; }
    if (d.join) { join(d.join, b); return; }
    if ("toc" in d) { OUTLINE = !OUTLINE; render(); return; }
    if ("folderNew" in d) { newFolder(); return; }
    if (d.sort) {
      LSORT = d.sort;
      try { localStorage.setItem("ln-sort", LSORT); } catch (x) { /* без памяти */ }
      render();
      return;
    }
    if (d.pf) { PF = d.pf; render(); return; }
    if (d.cf) { CF = d.cf; render(); return; }
    if (d.qClear) {
      for (let i = QUEUE.length - 1; i >= 0; i--) if (QUEUE[i].where === d.qClear && QUEUE[i].state === "err") QUEUE.splice(i, 1);
      paintQueue(d.qClear);
      return;
    }
    if (d.confirm) {
      act(async () => {
        await AUTH.api("POST", "/learn/steps/" + d.confirm + "/done");
        toast("Отмечено: ознакомлен");
        await reload();
      });
      return;
    }
    if (d.proof) {
      const f = findProof(d.proof);
      viewer({ id: "", type: "image", title: f ? f.filename : "Фото", seen: 0 }, proofUrl(d.proof));
      return;
    }
    if (d.proofPdf) {
      DL.open(proofUrl(d.proofPdf), { btn: b }).catch((x) => toast(x.message, true));
      return;
    }
    if (d.proofRm) {
      act(async () => {
        await AUTH.api("DELETE", "/learn/proofs/" + d.proofRm);
        await reload();
      });
      return;
    }
    if (d.proofEdit) { EDIT_PROOF = d.proofEdit; render(); return; }
    if ("proofCancel" in d) { EDIT_PROOF = ""; render(); return; }
    if (d.proofSend) {
      const sid = d.proofSend;
      act(async () => {
        await AUTH.api("POST", "/learn/steps/" + sid + "/submit", { note: PROOF_NOTE[sid] !== undefined
          ? PROOF_NOTE[sid] : ((findStep(sid) || {}).s || {}).note || "" });
        delete PROOF_NOTE[sid];
        EDIT_PROOF = "";
        toast("Отправлено на проверку — тема засчитана");
        await reload();
      });
      return;
    }
    if ("libLink" in d) { linkDialog(""); return; }
    if (d.itemEdit) { itemDialog(d.itemEdit); return; }
    if ("progNew" in d) { newProgram(); return; }
    if (d.rvOk) {
      const [uid, sid] = d.rvOk.split("|");
      act(async () => {
        await AUTH.api("POST", "/learn/review", { user_id: uid, step_id: sid, verdict: "ok" });
        toast("Принято");
        await reload();
      });
      return;
    }
    if (d.rvBack) { const [uid, sid] = d.rvBack.split("|"); returnDialog(uid, sid); return; }
    builderClick(b, d);
  }

  /* Записаться самому: себя — в «Кому» поимённо. */
  async function join(pid, b) {
    const p = mprog(pid), me = AUTH.current() || {};
    if (!p || !me.id) return;
    b.disabled = true;
    try {
      await patchProg(p.id, { members: [...new Set([...p.members, me.id])] });
      toast(`Вы записаны: «${p.title}»`);
    } catch (e) {
      toast(e.message, true);
      b.disabled = false;
    }
  }

  /* «Продолжить просмотр»: открыть тему и пустить материал с того же
     места. Видео урока играет сразу — нажатие и есть разрешение на звук. */
  function resume(id, sid) {
    if (sid) go({ tab: "s", id: sid });
    const v = $q(`#sec-lrn video[data-hero="${id}"]`);
    if (v) {
      v.scrollIntoView({ block: "center", behavior: "smooth" });
      v.play().catch(() => {});
      return;
    }
    openItem(id);
  }

  function findProof(id) {
    const lists = [];
    (DATA.programs || []).forEach((p) => p.chapters.forEach((c) => c.steps.forEach((s) => lists.push(s.proofs || []))));
    if (DATA.manage) DATA.manage.review.forEach((r) => lists.push(r.proofs));
    if (PERSON && PERSON.programs) PERSON.programs.forEach((p) => p.chapters.forEach((c) => c.steps.forEach((s) => lists.push(s.proofs || []))));
    for (const l of lists) for (const f of l) if (f.id === id) return f;
    return null;
  }

  async function builderClick(b, d) {
    const p = mprog(R.id);
    if (!p) return;
    const s = R.sub && R.sub !== "set" ? findMStep(p, R.sub) : null;
    if ("progPublish" in d) { publish(p); return; }
    if (d.progStatus) {
      const msg = d.progStatus === "archive" ? "Убрать программу в архив? У мастеров она пропадёт, их отметки сохранятся."
        : "Снять программу с публикации? У мастеров она пропадёт, пока не опубликуете снова; отметки сохранятся.";
      if (!(await ASK.confirm(msg, { danger: false,
        ok: d.progStatus === "archive" ? "В архив" : "Снять с публикации" }))) return;
      act(() => patchProg(p.id, { status: d.progStatus }));
      return;
    }
    if ("progCopy" in d) {
      act(async () => {
        const got = await AUTH.api("POST", "/learn/programs/" + p.id + "/copy");
        await fetchAll();
        toast("Копия создана — черновиком");
        go({ tab: "e", id: got.id, sub: "set" });
      });
      return;
    }
    if ("progDel" in d) {
      if (!(await ASK.confirm(`Удалить программу «${p.title}»? У мастеров она пропадёт вместе с прогрессом по ней.`))) return;
      act(async () => {
        await AUTH.api("DELETE", "/learn/programs/" + p.id);
        await fetchAll();
        go({ tab: "progs" }, true);
      });
      return;
    }
    if (d.aud) { act(() => patchProg(p.id, { audience: d.aud })); return; }
    if (d.color !== undefined) { act(() => patchProg(p.id, { color: Number(d.color) })); return; }
    if ("memAdd" in d) { pickPeople(p); return; }
    if (d.memRm) { act(() => patchProg(p.id, { members: p.members.filter((x) => x !== d.memRm) })); return; }
    if ("chNew" in d) {
      act(async () => {
        const got = await AUTH.api("POST", "/learn/programs/" + p.id + "/chapters", {});
        FOCUS = `[data-ch-title="${got.id}"]`;
        await reload();
      });
      return;
    }
    if (d.chDel) {
      const ch = p.chapters.find((c) => c.id === d.chDel);
      if (!ch) return;
      if (ch.steps.length && !(await ASK.confirm(`Удалить главу «${ch.title}» вместе с ${nTopics(ch.steps.length)}?`))) return;
      act(async () => {
        await AUTH.api("DELETE", "/learn/chapters/" + ch.id);
        if (s && ch.steps.some((x) => x.id === s.id)) go({ tab: "e", id: p.id }, true);
        await reload();
      });
      return;
    }
    if (d.stepNew) {
      act(async () => {
        const got = await AUTH.api("POST", "/learn/chapters/" + d.stepNew + "/steps", { title: "Новая тема" });
        await fetchAll();
        FOCUS = ".ln-ed-title";
        go({ tab: "e", id: p.id, sub: got.id }, !!s);
      });
      return;
    }
    if (!s) return;
    if (d.stepMove) { moveStep(d.stepMove); return; }
    if ("stepDel" in d) {
      if (!(await ASK.confirm(`Удалить тему «${s.title}»? Отметки мастеров по ней больше не войдут в прогресс.`))) return;
      act(async () => {
        await AUTH.api("DELETE", "/learn/steps/" + s.id);
        await fetchAll();
        go({ tab: "e", id: p.id }, true);
      });
      return;
    }
    if ("stepLib" in d) { pickItems(p, s); return; }
    if ("stepLink" in d) { linkDialog(s.id); return; }
    if (d.matRm) {
      act(async () => {
        await AUTH.api("PATCH", "/learn/steps/" + s.id, { items: s.items.filter((x) => x !== d.matRm) });
        await reload();
      });
      return;
    }
    if (d.matUp) {
      const items = s.items.filter((id) => IT.has(id));
      const i = Number(d.matUp);
      if (i < 1) return;
      [items[i - 1], items[i]] = [items[i], items[i - 1]];
      act(async () => {
        await AUTH.api("PATCH", "/learn/steps/" + s.id, { items });
        await reload();
      });
    }
  }

  function onChange(e) {
    const t = e.target;
    const d = t.dataset;
    if ("libFile" in d) {
      enqueue([...t.files], { where: "lib", folder: curFolder() });
      t.value = "";
      return;
    }
    if (d.stepFile) {
      enqueue([...t.files], { where: "s:" + d.stepFile, step: d.stepFile, topic: progTitle() });
      t.value = "";
      return;
    }
    if (d.proofFile) {
      enqueue([...t.files], { where: "p:" + d.proofFile, step: d.proofFile, proof: true });
      t.value = "";
      return;
    }
    if (t.name === "ln-mode") {
      act(async () => {
        await AUTH.api("PATCH", "/learn/steps/" + R.sub, { mode: t.value });
        await reload();
      });
      return;
    }
    if (d.p === "strict") {
      act(() => patchProg(R.id, { strict: t.checked }));
      return;
    }
    if (d.p === "due_days") {
      const n = Math.max(0, Math.min(3650, parseInt(t.value || "0", 10) || 0));
      act(() => patchProg(R.id, { due_days: n }));
    }
  }

  function onInput(e) {
    const t = e.target;
    const d = t.dataset;
    if (t.id === "lnLQ") { LQ = t.value; render(); return; }
    if (t.id === "lnPQ") { PQ = t.value; render(); return; }
    if (d.proofNote) { PROOF_NOTE[d.proofNote] = t.value; return; }
    if (d.f && R.sub) {
      const sid = R.sub, v = t.value;
      if (d.f === "title" && !v.trim()) return;
      later("s:" + sid + ":" + d.f, () => saveStep(sid, d.f, d.f === "title" ? v.trim() : v), 800);
      return;
    }
    if ((d.p === "title" || d.p === "about") && R.id) {
      const pid = R.id, v = t.value;
      if (d.p === "title" && !v.trim()) return;
      later("p:" + pid + ":" + d.p, () => saveProgField(pid, d.p, d.p === "title" ? v.trim() : v), 800);
      return;
    }
    if (d.chTitle) {
      const id = d.chTitle, v = t.value.trim();
      if (!v) return;
      later("c:" + id, () => act(async () => {
        await AUTH.api("PATCH", "/learn/chapters/" + id, { title: v });
        const p = mprog(R.id), ch = p && p.chapters.find((c) => c.id === id);
        if (ch) ch.title = v;
        saved();
      }), 800);
    }
  }

  /* Ушли из поля — сохраняем сразу, не дожидаясь паузы в наборе. Пустое
     название не сохраняется: возвращаем прежнее. */
  function onBlur(e) {
    const t = e.target, d = t.dataset || {};
    if (d.f && R.sub) flush("s:" + R.sub + ":" + d.f);
    else if ((d.p === "title" || d.p === "about") && R.id) flush("p:" + R.id + ":" + d.p);
    else if (d.chTitle) flush("c:" + d.chTitle);
    if (t.value !== undefined && !t.value.trim()) {
      const p = mprog(R.id);
      if (d.chTitle) {
        const ch = p && p.chapters.find((c) => c.id === d.chTitle);
        if (ch) t.value = ch.title;
      } else if (d.f === "title") {
        const st = p && findMStep(p, R.sub);
        if (st) t.value = st.title;
      } else if (d.p === "title" && p) t.value = p.title;
    }
  }

  /* При старте платформы — только счётчик у пункта меню. Если раздел уже
     открыт по ссылке и сам спрашивает данные, второй запрос не нужен: он
     сделал бы первый устаревшим, и раздел остался бы на «Загружаю». */
  async function peek() {
    if (DATA || SEQ) return;
    await fetchAll();
  }

  return { load, peek };
})();
