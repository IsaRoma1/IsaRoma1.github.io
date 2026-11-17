/* Файлы — личная папка и общие папки конторы.

   «Мои файлы» видит только владелец: администратору в них хода нет, так
   решил заказчик. «Общие» — на всех, кому открыт раздел; класть в их
   папки может каждый, а верхние папки заводят и чужое правят только
   админы и Dev Admin.

   Всё решает сервер: он же отказывает, если прав нет. Здесь права только
   для того, чтобы не показывать кнопки, которые всё равно откажут.

   Удаление — в корзину на тридцать дней: файл, стёртый по ошибке, иначе
   не вернуть ничем.

   С 28.09.2026 тот же модуль — вкладка «Файлы» карточки объекта
   (mount): корень site, папки и файлы объекта. Первой там стоит папка
   «Проектная документация» — не папка файлообменника, а документы проекта
   объекта, те же, что в «Письмах»: загрузил там — видно здесь, и наоборот.
   Раздел «Файлы» из левого меню ушёл в «Объекты»; личные и общие файлы
   открываются кнопкой «Общие файлы» над списком объектов. */
"use strict";

const FILES = (() => {
  const $f = (s, r) => (r || document).querySelector(s);
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  const ICO = {
    folder: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 7A1.5 1.5 0 0 1 5 5.5h4.3l2 2.2H19a1.5 1.5 0 0 1 1.5 1.5v8.3A1.5 1.5 0 0 1 19 19H5a1.5 1.5 0 0 1-1.5-1.5z"/></svg>`,
    file: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3.5h6.5l4 4V20a.5.5 0 0 1-.5.5H7a.5.5 0 0 1-.5-.5V4a.5.5 0 0 1 .5-.5z"/><path d="M13.5 3.5V7.5h4"/></svg>`,
    up: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 16V4M7 9l5-5 5 5M4.5 17.5v2a1 1 0 0 0 1 1h13a1 1 0 0 0 1-1v-2"/></svg>`,
    plan: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5.5A1.5 1.5 0 0 1 5.5 4h13A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5z"/><path d="M4 10h7v10M11 14h9"/></svg>`,
    plus: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 7A1.5 1.5 0 0 1 5 5.5h4.3l2 2.2H19a1.5 1.5 0 0 1 1.5 1.5v8.3A1.5 1.5 0 0 1 19 19H5a1.5 1.5 0 0 1-1.5-1.5z"/><path d="M12 10.5v5M9.5 13h5"/></svg>`,
    down: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v11M7.5 10.5 12 15l4.5-4.5M4.5 20h15"/></svg>`,
    edit: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4.5 19.5h4l10-10a2.1 2.1 0 0 0-3-3l-10 10z"/></svg>`,
    move: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 7A1.5 1.5 0 0 1 5 5.5h4.3l2 2.2H19a1.5 1.5 0 0 1 1.5 1.5v8.3A1.5 1.5 0 0 1 19 19H5a1.5 1.5 0 0 1-1.5-1.5z"/><path d="M9 13.5h6M12.5 11l2.5 2.5-2.5 2.5"/></svg>`,
    trash: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4.5 6.5h15M9.5 6.5V4.8a1.3 1.3 0 0 1 1.3-1.3h2.4a1.3 1.3 0 0 1 1.3 1.3v1.7M6.5 6.5l.9 12.2A1.5 1.5 0 0 0 8.9 20h6.2a1.5 1.5 0 0 0 1.5-1.3l.9-12.2"/></svg>`,
    back: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/></svg>`,
    find: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="M20.5 20.5 16 16"/></svg>`,
    next: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18l6-6-6-6"/></svg>`,
    left: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg>`,
    dots: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="5.5" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="18.5" cy="12" r="1.4"/></svg>`,
  };

  /* Телефон (23.09.2026): в строке — имя и главное (размер, дата), всё
     остальное и действия — в окне по нажатию на файл. Таблица с пятью
     колонками на телефоне уезжала вбок. */
  const NARROW = matchMedia("(max-width: 684px)");
  const narrow = () => NARROW.matches;
  NARROW.addEventListener("change", () => {
    const host = hostEl();
    if (host && host.isConnected && host.offsetParent !== null && DATA) render();
  });

  let HOST = "#sec-fil";   // куда рисовать: раздел или вкладка объекта
  let SITE = "";           // объект, чьи файлы открыты во вкладке
  let ROOT = "own";        // own — мои файлы, shared — общие, site — файлы объекта
  let VIEW = "files";      // files — папка, trash — корзина
  let FOLDER = "";         // открытая папка, пусто — корень
  let DATA = null;
  let QUERY = "";          // строка поиска как напечатана
  let FOUND = null;        // ответ поиска по корню
  let findTimer = 0, findSeq = 0;
  const QUEUE = [];        // очередь загрузки: {file, loaded, state, error}
  let sending = false;

  const hostEl = () => (typeof HOST === "string" ? $f(HOST) : HOST);
  const inSite = () => ROOT === "site";
  const rq = () => "root=" + ROOT + (inSite() ? "&site=" + encodeURIComponent(SITE) : "");
  const rootName = () => (ROOT === "own" ? "Мои файлы" : ROOT === "shared" ? "Общие" : "Файлы объекта");
  const PROJECT = "@project";
  const inProject = () => inSite() && FOLDER === PROJECT;
  const term = () => QUERY.trim();
  const searching = () => VIEW === "files" && term().length >= 2;

  const me = () => AUTH.current();
  const canOwn = () => AUTH.can(me(), "files");
  const canShared = () => AUTH.can(me(), "files");
  /* Раздел «Файлы» с 28.09.2026 открывают из «Объектов» (пункта в меню у
     таких людей нет) — значит, и обратно в «Объекты» нужна дорога. */
  const canObjects = () => AUTH.can(me(), "obj");

  /* ── форматы ─────────────────────────────────────────────── */
  function size(n) {
    n = Number(n) || 0;
    const u = ["Б", "КБ", "МБ", "ГБ", "ТБ"];
    let i = 0;
    while (n >= 1024 && i < u.length - 1) { n /= 1024; i++; }
    return (i ? n.toLocaleString("ru-RU", { maximumFractionDigits: n < 10 ? 1 : 0 })
              : String(n)) + " " + u[i];
  }

  function when(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    if (isNaN(d)) return "";
    const p = (x) => String(x).padStart(2, "0");
    return `${p(d.getDate())}.${p(d.getMonth() + 1)}.${d.getFullYear()} ${
      p(d.getHours())}:${p(d.getMinutes())}`;
  }

  const plural = (n, one, few, many) => {
    const a = Math.abs(n) % 100, b = a % 10;
    if (a > 10 && a < 20) return many;
    if (b > 1 && b < 5) return few;
    return b === 1 ? one : many;
  };

  /* «сегодня 14:05», «вчера 09:12», «18.09 16:40» — как в «Письмах»:
     проектная документация здесь выглядит ровно так же, как там. */
  function stamp(iso) {
    const d = new Date(iso);
    if (!iso || isNaN(d)) return "";
    const p = (x) => String(x).padStart(2, "0");
    const now = new Date(), t = `${p(d.getHours())}:${p(d.getMinutes())}`;
    const yest = new Date(now); yest.setDate(now.getDate() - 1);
    if (d.toDateString() === now.toDateString()) return "сегодня " + t;
    if (d.toDateString() === yest.toDateString()) return "вчера " + t;
    return `${p(d.getDate())}.${p(d.getMonth() + 1)}${
      d.getFullYear() !== now.getFullYear() ? "." + d.getFullYear() : ""} ${t}`;
  }

  const dmy = (iso) => (iso ? String(iso).slice(0, 10).split("-").reverse().join(".") : "");

  /* ── данные ──────────────────────────────────────────────── */
  async function load() {
    // Раздел открыт кнопкой «Общие файлы» — рисуем в раздел, не во вкладку.
    HOST = "#sec-fil";
    if (inSite()) { ROOT = "own"; SITE = ""; FOLDER = ""; VIEW = "files"; QUERY = ""; FOUND = null; }
    if (ROOT === "own" && !canOwn()) ROOT = "shared";
    if (ROOT === "shared" && !canShared()) ROOT = "own";
    await refresh();
  }

  /* Вкладка «Файлы» карточки объекта. Карточка перерисовывается целиком
     на каждое действие — открытая папка того же объекта при этом не
     сбрасывается. */
  function mount(el, siteId, folder) {
    const same = inSite() && SITE === siteId;
    HOST = el; SITE = siteId; ROOT = "site";
    // folder — открыть сразу эту папку (из «Писем» нажали на плитку папки).
    if (!same || folder !== undefined) {
      FOLDER = folder || ""; VIEW = "files"; QUERY = ""; FOUND = null; DATA = null;
    }
    render();
    refresh();
  }

  /* Ответ считается только последний. Пока шла загрузка или скачивание
     большого файла, ответы на переходы приезжали с опозданием (канал
     занят файлом), и пришедший позже ответ прежней папки затирал новую:
     нажал «Общие» — а на экране по-прежнему «Мои файлы» (заказчик,
     28.09.2026). Теперь каждый запрос помечен, и опоздавший молча
     выбрасывается. */
  let loadSeq = 0;
  async function refresh() {
    const seq = ++loadSeq;
    let data;
    try {
      data = VIEW === "trash"
        ? await AUTH.api("GET", "/files/trash?" + rq())
        : await AUTH.api("GET", "/files?" + rq()
                                + "&folder=" + encodeURIComponent(FOLDER));
    } catch (e) {
      if (seq !== loadSeq) return;
      // Открытую папку удалили в другой вкладке — возвращаемся в корень,
      // а не показываем ошибку вместо всего раздела.
      if (FOLDER) { FOLDER = ""; return refresh(); }
      data = { error: e.message };
    }
    if (seq !== loadSeq) return;
    DATA = data;
    render();
  }

  /* Переход — в другой корень, папку или корзину: экран меняется сразу,
     по нажатию, а список доезжает следом. Раньше до прихода ответа не
     менялось ничего, и казалось, что раздел не откликается. */
  function nav() {
    DATA = null;
    FOUND = null;
    findSeq++;
    render();
    refresh();
  }

  /* ── отрисовка ───────────────────────────────────────────── */
  function render() {
    const host = hostEl();
    if (!host || !host.isConnected) return;
    const d = DATA || {};
    // Раздел перерисовывается целиком только при смене папки или корня;
    // пока печатают в поиске, меняется одно тело (paint). Если целиком
    // всё же пришлось на ввод — курсор возвращаем на место.
    const focused = document.activeElement;
    const caret = focused && focused.id === "flQ" ? focused.selectionStart : null;
    host.innerHTML = `
      <div class="pg fl-page${inSite() ? " fl-embed" : ""}">
        <div class="pg-head fl-head">
          ${!inSite() && canObjects() ? `<button type="button" class="btn-ghost fl-back" id="flBack"
            title="Вернуться к объектам">${ICO.left}<span class="fl-lbl">Объекты</span></button>` : ""}
          ${inSite() ? "" : `<div class="seg fl-roots" role="tablist">`}
            ${!inSite() && canOwn() ? `<button type="button" class="seg-b${ROOT === "own" ? " on" : ""}"
              data-root="own">Мои файлы</button>` : ""}
            ${!inSite() && canShared() ? `<button type="button" class="seg-b${ROOT === "shared" ? " on" : ""}"
              data-root="shared">Общие</button>` : ""}
          ${inSite() ? "" : `</div>`}
          <div class="fl-where" id="flWhere">${whereHtml(d)}</div>
          <div class="pg-tools">
            ${VIEW === "files" && !d.error ? `<label class="pg-find">${ICO.find}<input id="flQ"
              placeholder="${ROOT === "own" ? "Найти в моих файлах" : ROOT === "shared"
                ? "Найти в общих" : "Найти в файлах объекта"}"
              value="${esc(QUERY)}" autocomplete="off"></label>` : ""}
            ${VIEW === "files" && d.can && d.can.mkdir ? `<button type="button"
              class="btn-ghost" id="flMkdir" title="Новая папка" aria-label="Новая папка"${
              searching() ? " hidden" : ""}>${ICO.plus}<span class="fl-lbl">Новая папка</span></button>` : ""}
            ${VIEW === "files" && d.can && d.can.upload && d.project ? `<button type="button"
              class="btn-brand fl-pick" id="flProjUp" title="Загрузить проект или изменение"${
              searching() ? " hidden" : ""}>${ICO.up}<span class="fl-lbl">${(d.docs || []).length
                ? "Загрузить изменение" : "Загрузить проект"}</span></button>`
            : VIEW === "files" && d.can && d.can.upload ? `<label class="btn-brand fl-pick"
              id="flUp" title="Загрузить" aria-label="Загрузить"${searching() ? " hidden" : ""}>
              ${ICO.up}<span class="fl-lbl">Загрузить</span><input type="file" id="flPick" multiple hidden></label>` : ""}
            <button type="button" class="btn-ghost${VIEW === "trash" ? " on" : ""}" id="flTrash"
              title="${VIEW === "trash" ? "К файлам" : "Корзина — удалённое хранится 30 дней"}"
              aria-label="${VIEW === "trash" ? "К файлам" : "Корзина"}">${VIEW === "trash"
                ? ICO.back + '<span class="fl-lbl">К файлам</span>'
                : ICO.trash + '<span class="fl-lbl">Корзина</span>'}</button>
          </div>
        </div>
        ${queueHtml()}
        <div class="pg-body fl-body" id="flBody">${bodyHtml(d)}</div>
        ${footHtml(d)}
        <div class="pg-note" id="flNote" hidden></div>
      </div>`;
    wire(host);
    if (caret !== null) {
      const inp = $f("#flQ", host);
      if (inp) { inp.focus(); inp.setSelectionRange(caret, caret); }
    }
  }

  function bodyHtml(d) {
    if (d.error) return `<div class="pg-empty"><b>Не открылось</b>${esc(d.error)}</div>`;
    if (!DATA) return `<div class="pg-empty"><b>Загружаем…</b></div>`;
    if (VIEW === "trash") return narrow() ? mTrashHtml(d) : trashHtml(d);
    // Пока первый ответ поиска не пришёл, остаётся список — не пустое место.
    if (searching() && FOUND) return narrow() ? mFoundHtml() : foundHtml();
    if (d.project) return projHtml(d);
    return narrow() ? mListHtml(d) : listHtml(d);
  }

  /* ── телефон: строки вместо таблицы ─────────────────────── */
  const shortWhen = (iso) => when(iso).replace(/^(\d\d\.\d\d)\.\d{4}/, "$1");
  const mFolder = (f, sub) => `
    <div class="fl-mrow dir">
      <button type="button" class="fl-mmain" data-mgo="${esc(f.id)}">${ICO.folder}
        <span class="fl-mtext"><b>${esc(f.name)}</b><i>${esc(sub)}</i></span></button>
      ${f.can_edit ? `<button type="button" class="fl-mdots" data-mfolder="${esc(f.id)}"
        aria-label="Действия с папкой">${ICO.dots}</button>`
        : `<span class="fl-mgo">${ICO.next}</span>`}
    </div>`;
  const mFile = (f, sub) => `
    <div class="fl-mrow">
      <button type="button" class="fl-mmain" data-mfile="${esc(f.id)}">${ICO.file}
        <span class="fl-mtext"><b>${esc(f.name)}</b><i>${esc(sub)}</i></span></button>
      <button type="button" class="fl-mdots" data-mfile="${esc(f.id)}"
        aria-label="Действия с файлом">${ICO.dots}</button>
    </div>`;

  function mListHtml(d) {
    const folders = d.folders || [], files = d.files || [], pinned = pinnedOf(d);
    if (!folders.length && !files.length && !pinned.length) return listHtml(d);
    return `<div class="fl-m">
      ${pinned.map((f) => mFolder(f, pinSub(f))).join("")}
      ${folders.map((f) => mFolder(f, f.items ? f.items + " " + plural(f.items,
        "объект", "объекта", "объектов") : "пусто")).join("")}
      ${files.map((f) => mFile(f, size(f.size) + " · " + shortWhen(f.at))).join("")}
    </div>`;
  }

  function mFoundHtml() {
    const f = FOUND;
    if (!f || f.error || (!f.folders.length && !f.files.length)) return foundHtml();
    const where = (path) => [rootName(), ...path.map((p) => p.name)].join(" › ");
    return `<div class="fl-m">
      ${f.folders.map((x) => mFolder(Object.assign({}, x, { can_edit: false }), where(x.path))).join("")}
      ${f.files.map((x) => mFile(x, where(x.path))).join("")}
    </div>
    ${f.more ? `<div class="fl-more">Показаны первые ${f.folders.length + f.files.length} —
      уточните запрос.</div>` : ""}`;
  }

  function mTrashHtml(d) {
    const items = d.items || [];
    if (!items.length) return trashHtml(d);
    return `<div class="fl-m">${items.map((it) => `
      <div class="fl-mrow${it.type === "folder" ? " dir" : ""}">
        <span class="fl-mmain">${it.type === "folder" ? ICO.folder : ICO.file}
          <span class="fl-mtext"><b>${esc(it.name)}</b><i>удалено ${esc(shortWhen(it.deleted_at))}
            · сотрётся через ${it.days_left} ${plural(it.days_left, "день", "дня", "дней")}</i></span></span>
        <button type="button" class="lnk fl-mrestore" data-mrestore="${esc(it.type)}:${
          esc(it.id)}">Вернуть</button>
      </div>`).join("")}</div>`;
  }

  /* Окно снизу с подробностями и действиями — то, что на компьютере
     стоит колонками и значками в строке. */
  function sheet(title, facts, actions) {
    const box = document.createElement("div");
    box.className = "pf-modal fl-sheet";
    box.innerHTML = `
      <div class="pf-crop cnt-card fl-sheet-card" role="dialog" aria-label="${esc(title)}">
        <h3>${esc(title)}</h3>
        ${facts.length ? `<dl class="fl-sheet-facts">${facts.map(([k, v]) =>
          `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join("")}</dl>` : ""}
        <div class="fl-sheet-acts">${actions.map((a, i) => `<button type="button"
          class="fl-sheet-b${a.warn ? " warn" : ""}" data-i="${i}">${a.ico || ""}${esc(a.label)}</button>`)
          .join("")}</div>
        <button type="button" class="btn ghost fl-sheet-no" data-no>Закрыть</button>
      </div>`;
    document.body.appendChild(box);
    const close = () => { document.removeEventListener("keydown", key); box.remove(); };
    const key = (e) => { if (e.key === "Escape") close(); };
    document.addEventListener("keydown", key);
    box.addEventListener("click", (e) => { if (e.target === box) close(); });
    box.querySelector("[data-no]").addEventListener("click", close);
    box.querySelectorAll("[data-i]").forEach((b) => b.addEventListener("click", () => {
      close();
      actions[Number(b.dataset.i)].run();
    }));
  }

  function fileSheet(f) {
    const facts = [["Размер", size(f.size)], ["Добавлен", when(f.at)]];
    if (ROOT !== "own" && f.author) facts.push(["Кто положил", f.author]);
    if (f.path) facts.push(["Где лежит", [rootName(), ...f.path.map((p) => p.name)].join(" › ")]);
    const acts = [];
    if (f.preview) acts.push({ label: "Открыть", ico: ICO.file, run: () => open(f, null) });
    acts.push({ label: "Скачать", ico: ICO.down, run: () => download(f, null) });
    if (f.path) {
      const last = f.path.length ? f.path[f.path.length - 1].id : "";
      acts.push({ label: "Открыть папку", ico: ICO.folder, run: () => {
        FOLDER = last; QUERY = ""; nav(); } });
    }
    if (f.can_edit && !f.path && !f.doc) {
      acts.push({ label: "Переименовать", ico: ICO.edit,
        run: () => rename("file", { dataset: { file: f.id } }) });
      acts.push({ label: "Перенести в папку", ico: ICO.move, run: () => move(f) });
      acts.push({ label: "В корзину", ico: ICO.trash, warn: true,
        run: () => remove("file", { dataset: { file: f.id } }) });
    }
    sheet(f.name, facts, acts);
  }

  function folderSheet(f) {
    sheet(f.name, [["Внутри", f.items ? f.items + " " + plural(f.items, "объект", "объекта",
      "объектов") : "пусто"], ["Изменена", when(f.at)]], [
      { label: "Открыть", ico: ICO.folder, run: () => { FOLDER = f.id; nav(); } },
      { label: "Переименовать", ico: ICO.edit,
        run: () => rename("folder", { dataset: { folder: f.id } }) },
      { label: "В корзину", ico: ICO.trash, warn: true,
        run: () => remove("folder", { dataset: { folder: f.id } }) },
    ]);
  }

  /* Перерисовка без поля поиска: тело, счёт и кнопки, которым не место
     среди найденного, — поле, в котором печатают, пересоздавать нельзя. */
  function paint() {
    const host = hostEl();
    const body = host && $f("#flBody", host), where = host && $f("#flWhere", host);
    if (!body || !where) return render();
    if (!searching()) FOUND = null;
    const d = DATA || {};
    where.innerHTML = whereHtml(d);
    body.innerHTML = bodyHtml(d);
    ["#flMkdir", "#flUp"].forEach((s) => { const b = $f(s, host); if (b) b.hidden = searching(); });
    wireRows(host);
  }

  async function find() {
    if (!searching()) return;
    const seq = ++findSeq, root = ROOT, t = term();
    let res;
    try {
      res = await AUTH.api("GET", "/files/search?" + rq() + "&q=" + encodeURIComponent(t));
    } catch (e) {
      res = { folders: [], files: [], error: e.message };
    }
    // Пока ждали ответа, запрос успели поменять — этот ответ уже не нужен.
    if (seq !== findSeq || root !== ROOT || t !== term()) return;
    FOUND = res;
    paint();
  }

  /* Слева в полосе — где мы. В корне путь повторял бы переключатель
     «Мои файлы / Общие» рядом, поэтому там, как в других разделах, счёт
     записей; в папке — путь, по звеньям которого поднимаются вверх. */
  function whereHtml(d) {
    if (searching()) {
      if (!FOUND) return `<div class="pg-count">Ищем…</div>`;
      const n = FOUND.folders.length + FOUND.files.length;
      return `<div class="pg-count">Найдено <b>${n}${FOUND.more ? "+" : ""}</b></div>`;
    }
    if (VIEW === "trash") {
      const n = (d.items || []).length;
      return `<div class="pg-count"><b>Корзина</b>${n ? " · " + n : ""}</div>`;
    }
    const trail = d.path || [];
    if (!trail.length) {
      const nf = (d.folders || []).length + pinnedOf(d).length, nx = (d.files || []).length;
      return `<div class="pg-count">${[
        nf ? `<b>${nf}</b> ${plural(nf, "папка", "папки", "папок")}` : "",
        nx ? `<b>${nx}</b> ${plural(nx, "файл", "файла", "файлов")}` : ""]
        .filter(Boolean).join(" · ")}</div>`;
    }
    return `<div class="fl-crumbs"><button type="button" class="lnk" data-go="">${
      rootName()}</button>${trail.map((p, i) => `<i>›</i>${i === trail.length - 1
        ? `<b>${esc(p.name)}</b>`
        : `<button type="button" class="lnk" data-go="${esc(p.id)}">${esc(p.name)}</button>`}`)
      .join("")}${d.folder && d.folder.can_edit && (!d.project || d.sub) ? `<button type="button"
        class="ico fl-ren-cur" id="flRenCur" title="Переименовать эту папку"
        aria-label="Переименовать папку">${ICO.edit}</button>` : ""}</div>`;
  }

  /* Найденное — по всему корню, поэтому вместо «Кто положил» колонка
     «Где лежит»: по ней и переходят в папку, где файл живёт. Править
     отсюда нельзя — только открыть и скачать: переименовать и перенести
     удобнее там, где видно соседей. */
  function foundHtml() {
    const f = FOUND;
    if (!f) return "";
    if (f.error) return `<div class="pg-empty"><b>Поиск не удался</b>${esc(f.error)}</div>`;
    if (!f.folders.length && !f.files.length) {
      return `<div class="pg-empty"><b>Ничего не нашлось</b>Ищем по имени во всех папках
        раздела «${rootName()}». Удалённое в корзине в поиск не входит.</div>`;
    }
    const where = (path) => {
      const last = path.length ? path[path.length - 1] : null;
      const text = [rootName(), ...path.map((p) => p.name)].join(" › ");
      return `<button type="button" class="lnk fl-path" data-go="${last ? esc(last.id) : ""}"
        title="Открыть папку «${esc(last ? last.name : rootName())}»">${esc(text)}</button>`;
    };
    return `
      <table class="tbl fl-tbl" style="--tbl-min:684px">
        <colgroup><col><col style="width:28%"><col style="width:86.5px">
          <col style="width:122.5px"><col style="width:70px"></colgroup>
        <thead><tr><th>Имя</th><th>Где лежит</th><th class="num">Размер</th>
          <th>Добавлен</th><th></th></tr></thead>
        <tbody>
          ${f.folders.map((x) => `<tr class="go fl-dir" data-folder="${esc(x.id)}">
            <td class="fl-name"><span class="fl-cell">${ICO.folder}<span class="t-name">${
              esc(x.name)}</span></span></td>
            <td>${where(x.path)}</td>
            <td class="num dim">—</td><td class="dim">${esc(when(x.at))}</td><td></td></tr>`).join("")}
          ${f.files.map((x) => `<tr data-file="${esc(x.id)}">
            <td class="fl-name"><span class="fl-cell">${ICO.file}<button type="button"
              class="lnk fl-open" data-open title="${x.preview ? "Открыть в браузере"
                : "Скачать"}">${esc(x.name)}</button></span></td>
            <td>${where(x.path)}</td>
            <td class="num">${size(x.size)}</td><td class="dim">${esc(when(x.at))}</td>
            <td class="acts"><span class="fl-acts"><button type="button" class="ico" data-down
              title="Скачать">${ICO.down}</button></span></td></tr>`).join("")}
        </tbody>
      </table>
      ${f.more ? `<div class="fl-more">Показаны первые ${f.folders.length + f.files.length} —
        уточните запрос.</div>` : ""}`;
  }

  /* «Кто положил» — только в общих: в свою папку кладёт один владелец,
     и колонка с его же именем в каждой строке — занятое место и шум. */
  const authorCol = () => ROOT !== "own";

  /* Закреплённые папки корня: у объекта — «Проектная документация». */
  const pinnedOf = (d) => (FOLDER ? [] : d.pinned || []);
  const pinSub = (f) => "проектная документация, как в «Письмах» · " + (f.items
    ? f.items + " " + plural(f.items, "файл", "файла", "файлов") : "пусто");

  function listHtml(d) {
    const folders = d.folders || [], files = d.files || [], pinned = pinnedOf(d);
    if (!folders.length && !files.length && !pinned.length) {
      return `<div class="pg-empty"><b>${FOLDER ? "Папка пуста" : ROOT === "own"
        ? "Здесь пока ничего нет" : ROOT === "site" ? "Файлов объекта пока нет"
        : "Общих файлов пока нет"}</b>${d.can && d.can.upload
        ? "Перетащите файлы сюда или нажмите «Загрузить»."
        : ROOT === "shared" && !FOLDER ? (d.can && d.can.admin
          ? "Заведите папку — верхние папки общих заводят администраторы."
          : "Верхние папки общих заводят администраторы.")
          : "Класть сюда могут только администраторы."}</div>`;
    }
    const act = (item, kind) => item.can_edit ? `
      <button type="button" class="ico" data-ren="${kind}" title="Переименовать">${ICO.edit}</button>
      ${kind === "file" ? `<button type="button" class="ico" data-move title="Перенести в папку">${
        ICO.move}</button>` : ""}
      <button type="button" class="ico warn" data-del="${kind}" title="В корзину">${
        ICO.trash}</button>` : "";
    const who = authorCol();
    return `
      <table class="tbl fl-tbl" style="--tbl-min:${who ? 740 : 580}px">
        <colgroup><col><col style="width:86.5px">${who ? `<col style="width:144px">` : ""}
          <col style="width:122.5px"><col style="width:149.5px"></colgroup>
        <thead><tr><th>Имя</th><th class="num">Размер</th>${who ? "<th>Кто положил</th>" : ""}
          <th>Добавлен</th><th></th></tr></thead>
        <tbody>
          ${pinned.map((f) => `<tr class="go fl-dir fl-pin" data-folder="${esc(f.id)}"
            title="Та же проектная документация, что в «Письмах»">
            <td class="fl-name"><span class="fl-cell">${ICO.plan}<span class="t-name">${
              esc(f.name)}</span><i class="dim">${esc(pinSub(f))}</i></span></td>
            <td class="num dim">—</td>${who ? `<td class="dim">—</td>` : ""}
            <td class="dim">${esc(when(f.at))}</td><td></td></tr>`).join("")}
          ${folders.map((f) => `<tr class="go fl-dir" data-folder="${esc(f.id)}">
            <td class="fl-name"><span class="fl-cell">${ICO.folder}<span class="t-name">${
              esc(f.name)}</span><i class="dim">${f.items ? f.items + " " + plural(f.items,
                "объект", "объекта", "объектов") : "пусто"}</i></span></td>
            <td class="num dim">—</td>${who ? `<td class="dim">${esc(f.author)}</td>` : ""}
            <td class="dim">${esc(when(f.at))}</td>
            <td class="acts"><span class="fl-acts">${act(f, "folder")}</span></td></tr>`).join("")}
          ${files.map((f) => `<tr data-file="${esc(f.id)}">
            <td class="fl-name"><span class="fl-cell">${ICO.file}<button type="button"
              class="lnk fl-open" data-open title="${f.preview ? "Открыть в браузере"
                : "Скачать"}">${esc(f.name)}</button></span></td>
            <td class="num">${size(f.size)}</td>${who ? `<td class="dim">${esc(f.author)}</td>` : ""}
            <td class="dim">${esc(when(f.at))}</td>
            <td class="acts"><span class="fl-acts"><button type="button" class="ico" data-down
              title="Скачать">${ICO.down}</button>${act(f, "file")}</span></td></tr>`).join("")}
        </tbody>
      </table>`;
  }

  /* Папка «Проектная документация» объекта — по порядку загрузки, первой
     сама документация, за ней изменения; у каждого файла — что это, кто и
     когда положил. С 22.10.2026 (правка № 17) на компьютере — списком, как
     остальные папки объекта, и со своими папками по разделам проекта (ЭЛ,
     МГН, ЭОМ…); на телефоне — карточками, как в «Письмах». */
  const baseName = (name) => String(name || "").replace(/\.[^.]+$/, "");
  function projHtml(d) {
    const docs = d.docs || [], subs = d.folders || [];
    if (!docs.length && !subs.length) {
      return d.sub ? `<div class="pg-empty"><b>Папка пуста</b>Загрузите сюда проект или изменение
        кнопкой «Загрузить» — или перенесите документ из «1. Проекты».</div>`
        : `<div class="pg-empty"><b>Проектная документация ещё не загружена</b>Сюда кладут
        проект, по которому строим, и все изменения к нему. Это та же папка, что в «Письмах» у
        объекта: загруженное здесь мастер видит там, и наоборот.</div>`;
    }
    const hint = d.sub ? "" : `<div class="fl-proj-hint">Та же проектная документация, что в «Письмах»:
        изменения кладут следом, не удаляя прежний проект, — так видно, что и когда поменялось.
        Разделы проекта — ЭЛ, МГН, ЭОМ — можно разложить по папкам: «Новая папка».</div>`;
    if (!narrow()) return hint + projTable(d, docs, subs);
    return `${hint}${subs.length ? `<div class="fl-m">${subs.map((f) => mFolder(f, f.items
      ? f.items + " " + plural(f.items, "документ", "документа", "документов") : "пусто")).join("")}</div>` : ""}
      <div class="lt-files fl-proj">${docs.map((x, n) => `
        <div class="lt-file" data-pdoc="${esc(x.id)}">
          <span class="lt-file-ico">${ICO.file}</span>
          <button type="button" class="lt-file-main" data-popen title="${x.preview ? "Открыть" : "Скачать"}">
            <b>${esc(x.title || x.filename)}</b>
            <i>${x.doc_date ? `<em>изменение от ${esc(dmy(x.doc_date))}</em> · ` : ""}${esc(x.author)} · ${esc(stamp(x.at))}</i>
            <i class="lt-file-name">${x.title && x.title !== x.filename ? esc(x.filename) + " · " : ""}${
              size(x.size)}</i>
          </button>
          <span class="lt-file-acts">
            <button type="button" class="ico" data-pdown title="Скачать">${ICO.down}</button>
            ${x.can_edit ? `<button type="button" class="ico warn" data-pdel title="Убрать файл">${
              ICO.trash}</button>` : ""}
          </span>
        </div>`).join("")}</div>`;
  }

  function projTable(d, docs, subs) {
    const canMove = (x) => x.can_edit && ((d.subs || []).length > (d.sub ? 1 : 0) || d.sub);
    const actF = (f) => f.can_edit ? `
      <button type="button" class="ico" data-ren="folder" title="Переименовать">${ICO.edit}</button>
      <button type="button" class="ico warn" data-del="folder" title="В корзину — документы вернутся в «1. Проекты»">${
        ICO.trash}</button>` : "";
    return `
      <table class="tbl fl-tbl fl-ptbl" style="--tbl-min:740px">
        <colgroup><col><col style="width:86.5px"><col style="width:144px">
          <col style="width:122.5px"><col style="width:149.5px"></colgroup>
        <thead><tr><th>Имя</th><th class="num">Размер</th><th>Кто положил</th>
          <th title="Дата изменения проекта — от какого числа; по ней и порядок, свежие сверху">Изменение от</th><th></th></tr></thead>
        <tbody>
          ${subs.map((f) => `<tr class="go fl-dir" data-folder="${esc(f.id)}">
            <td class="fl-name"><span class="fl-cell">${ICO.folder}<span class="t-name">${
              esc(f.name)}</span><i class="dim">${f.items ? f.items + " " + plural(f.items,
                "документ", "документа", "документов") : "пусто"}</i></span></td>
            <td class="num dim">—</td><td class="dim">${esc(f.author)}</td>
            <td class="dim">${esc(when(f.at))}</td>
            <td class="acts"><span class="fl-acts">${actF(f)}</span></td></tr>`).join("")}
          ${docs.map((x) => `<tr data-pdoc="${esc(x.id)}">
            <td class="fl-name"><span class="fl-cell">${ICO.file}<button type="button"
              class="lnk fl-open" data-popen title="${x.preview ? "Открыть в браузере" : "Скачать"}">${
              esc(x.title || x.filename)}</button>${x.title && x.title !== baseName(x.filename)
              ? `<i class="dim">${esc(x.filename)}</i>` : ""}</span></td>
            <td class="num">${size(x.size)}</td><td class="dim">${esc(x.author)}</td>
            <td class="fl-ddate" title="${esc(`Загружен ${when(x.at)}`)}">${x.can_edit ? `<input type="date" class="pos-in fl-date"
              data-pdate value="${esc(x.doc_date || "")}" aria-label="Изменение от">` : esc(dmy(x.doc_date) || "—")}</td>
            <td class="acts"><span class="fl-acts"><button type="button" class="ico" data-pdown
              title="Скачать">${ICO.down}</button>${canMove(x) ? `<button type="button" class="ico" data-pmove
              title="Перенести в папку">${ICO.move}</button>` : ""}${x.can_edit ? `<button type="button"
              class="ico warn" data-pdel title="Убрать файл">${ICO.trash}</button>` : ""}</span></td></tr>`).join("")}
        </tbody>
      </table>`;
  }

  /* Перенести документ проекта в папку внутри «1. Проекты» или обратно. */
  function moveDoc(doc) {
    const subs = (DATA && DATA.subs) || [];
    const cur = (DATA && DATA.sub) || "";
    const box = document.createElement("div");
    box.className = "pf-modal";
    box.innerHTML = `
      <div class="pf-crop cnt-card fl-ask" role="dialog" aria-label="Перенести">
        <h3>Перенести «${esc(doc.title || doc.filename)}»</h3>
        <div class="fl-tree">
          <button type="button" class="fl-tree-b${!cur ? " on" : ""}" data-to="">${ICO.plan}1. Проекты</button>
          ${subs.map((x) => `<button type="button" class="fl-tree-b${x.id === cur ? " on" : ""}"
            data-to="${esc(x.id)}" style="padding-left:28px">${ICO.folder}${esc(x.name)}</button>`).join("")}
        </div>
        <div class="pf-modal-foot"><span class="grow"></span>
          <button type="button" class="btn ghost" data-no>Отмена</button></div>
      </div>`;
    document.body.appendChild(box);
    const close = () => { document.removeEventListener("keydown", key); box.remove(); };
    const key = (e) => { if (e.key === "Escape") close(); };
    document.addEventListener("keydown", key);
    box.addEventListener("click", (e) => { if (e.target === box) close(); });
    $f("[data-no]", box).addEventListener("click", close);
    box.querySelectorAll("[data-to]").forEach((b) => b.addEventListener("click", async () => {
      close();
      if (b.dataset.to === cur) return;
      try {
        await AUTH.api("PATCH", "/documents/" + encodeURIComponent(doc.id), { pfolder: b.dataset.to });
        await refresh();
        note("Перенесено");
      } catch (e) { note("Не вышло: " + e.message, true); }
    }));
  }

  function trashHtml(d) {
    const items = d.items || [];
    if (!items.length) {
      return `<div class="pg-empty"><b>Корзина пуста</b>Удалённое лежит здесь 30 дней,
        потом стирается само.</div>`;
    }
    const who = authorCol();
    return `
      <table class="tbl fl-tbl" style="--tbl-min:${who ? 740 : 580}px">
        <colgroup><col><col style="width:86.5px">${who ? `<col style="width:144px">` : ""}
          <col style="width:122.5px"><col style="width:108px"></colgroup>
        <thead><tr><th>Имя</th><th class="num">Размер</th>${who ? "<th>Кто положил</th>" : ""}
          <th>Удалено</th><th></th></tr></thead>
        <tbody>${items.map((it) => `<tr${it.type === "folder" ? ' class="fl-dir"' : ""}
          data-trash="${esc(it.type)}:${esc(it.id)}">
          <td class="fl-name"><span class="fl-cell">${it.type === "folder" ? ICO.folder
            : ICO.file}<span class="t-name">${esc(it.name)}</span></span></td>
          <td class="num dim">${it.type === "file" ? size(it.size) : "—"}</td>
          ${who ? `<td class="dim">${esc(it.author)}</td>` : ""}
          <td class="dim" title="Сотрётся через ${it.days_left} ${plural(it.days_left,
            "день", "дня", "дней")}">${esc(when(it.deleted_at))}</td>
          <td class="acts"><button type="button" class="lnk" data-restore>Вернуть</button></td>
        </tr>`).join("")}</tbody>
      </table>`;
  }

  /* Сколько занято в личной папке и сколько свободно на сервере. Место на
     сервере видят только администраторы: файлообменник живёт на том же
     диске, что база и документы, и кончиться оно не должно внезапно. */
  function footHtml(d) {
    const parts = [];
    if (d.usage) {
      // Хоть что-то занято — полоса не пустая, иначе три мегабайта из пяти
      // гигабайт выглядят как «ничего нет».
      const pct = Math.min(100, Math.max(d.usage.used ? 2 : 0,
        Math.round((d.usage.used * 100) / (d.usage.quota || 1))));
      parts.push(`<span class="fl-use${pct >= 90 ? " bad" : ""}">Занято ${size(d.usage.used)}
        из ${size(d.usage.quota)}<span class="kpi-bar"><b style="width:${pct}%"></b></span></span>`);
    }
    if (d.disk) {
      parts.push(`<span class="dim">На сервере свободно ${size(d.disk.free)} из ${
        size(d.disk.total)} · в «Файлах» ${size(d.disk.files)}</span>`);
    }
    return parts.length && VIEW === "files"
      ? `<div class="fl-foot">${parts.join("")}</div>` : "";
  }

  function queueHtml() {
    const live = QUEUE.filter((q) => q.state !== "ok");
    if (!live.length) return "";
    /* У сорвавшегося файла полосы нет: пустая красная полоса с точкой в
       начале читалась как сбой отрисовки, а сама причина обрезалась
       многоточием. Причину пишем целиком — на месте полосы и статуса. */
    return `<div class="fl-queue">${live.map((q) => `
      <div class="fl-q${q.state === "err" ? " bad" : ""}">
        <span class="fl-q-name" title="${esc(q.file.name)}">${esc(q.file.name)}</span>
        ${q.state === "err" ? `<span class="fl-q-err">${esc(q.error)}</span>` : `
        <span class="fl-q-bar"><i style="width:${q.file.size
          ? Math.round((q.loaded * 100) / q.file.size) : 0}%"></i></span>
        <span class="fl-q-st">${q.state === "wait" ? "в очереди"
          : size(q.loaded) + " из " + size(q.file.size)}</span>`}
      </div>`).join("")}
      ${live.some((q) => q.state === "err") ? `<button type="button" class="lnk"
        id="flQClear">Скрыть ошибки</button>` : ""}</div>`;
  }

  /* ── действия ────────────────────────────────────────────── */
  function wire(host) {
    host.querySelectorAll("[data-root]").forEach((b) => b.addEventListener("click", () => {
      ROOT = b.dataset.root; FOLDER = ""; VIEW = "files"; QUERY = ""; nav();
    }));
    const back = $f("#flBack", host);
    if (back) back.addEventListener("click", () => {
      if (typeof openSection === "function") openSection("sit");
    });
    const trash = $f("#flTrash", host);
    if (trash) trash.addEventListener("click", () => {
      VIEW = VIEW === "trash" ? "files" : "trash"; QUERY = ""; nav();
    });
    const qi = $f("#flQ", host);
    if (qi) {
      qi.addEventListener("input", () => {
        const was = searching();
        QUERY = qi.value;
        clearTimeout(findTimer);
        if (searching()) {
          findTimer = setTimeout(find, 250);
          if (!was) { FOUND = null; paint(); }
        } else if (was) {
          findSeq++;
          paint();
        }
      });
      qi.addEventListener("keydown", (e) => {
        if (e.key !== "Escape" || !qi.value) return;
        e.stopPropagation();
        qi.value = ""; QUERY = ""; findSeq++; clearTimeout(findTimer);
        paint();
      });
    }
    const mk = $f("#flMkdir", host);
    if (mk) mk.addEventListener("click", mkdir);
    const pick = $f("#flPick", host);
    if (pick) pick.addEventListener("change", () => { enqueue([...pick.files]); pick.value = ""; });
    const pup = $f("#flProjUp", host);
    if (pup) pup.addEventListener("click", uploadProject);
    const clr = $f("#flQClear", host);
    if (clr) clr.addEventListener("click", () => {
      for (let i = QUEUE.length - 1; i >= 0; i--) if (QUEUE[i].state === "err") QUEUE.splice(i, 1);
      render();
    });

    wireRows(host);

    /* Файлы бросают мышью прямо в список — так их и кладут в проводнике. */
    const page = $f(".fl-page", host);
    if (page && VIEW === "files" && DATA && DATA.can && DATA.can.upload) {
      let depth = 0;
      // Среди найденного некуда класть: папка, в которую ушёл бы файл, не
      // видна, — поэтому, пока идёт поиск, бросать нельзя.
      const ok = (e) => hasFiles(e) && !searching();
      page.addEventListener("dragenter", (e) => {
        if (!ok(e)) return;
        e.preventDefault(); depth++; page.classList.add("fl-drop");
      });
      page.addEventListener("dragover", (e) => { if (ok(e)) e.preventDefault(); });
      page.addEventListener("dragleave", () => {
        if (--depth <= 0) { depth = 0; page.classList.remove("fl-drop"); }
      });
      page.addEventListener("drop", (e) => {
        if (!ok(e)) return;
        e.preventDefault(); depth = 0; page.classList.remove("fl-drop");
        // Название документа проекта — из имени файла (правка № 17).
        const dropped = [...e.dataTransfer.files];
        if (DATA && DATA.project) uploadProject(dropped);
        else enqueue(dropped, null);
      });
    }
  }

  /* Обработчики всего, что перерисовывает paint: путь, строки, кнопки строк. */
  function wireRows(host) {
    // Путь перерисовывает и paint — поэтому карандаш у имени папки здесь.
    const renCur = $f("#flRenCur", host);
    if (renCur) renCur.addEventListener("click", renameCurrent);
    const go = (id) => { FOLDER = id; QUERY = ""; nav(); };
    host.querySelectorAll("[data-go]").forEach((b) => b.addEventListener("click", (e) => {
      e.stopPropagation();
      go(b.dataset.go);
    }));
    host.querySelectorAll("tr[data-folder]").forEach((tr) => tr.addEventListener("click", (e) => {
      if (e.target.closest("button")) return;
      go(tr.dataset.folder);
    }));
    host.querySelectorAll("[data-open]").forEach((b) => b.addEventListener("click", () => {
      const f = fileOf(b);
      if (f) (f.preview ? open(f, b) : download(f, b));
    }));
    host.querySelectorAll("[data-down]").forEach((b) => b.addEventListener("click", () => {
      const f = fileOf(b);
      if (f) download(f, b);
    }));
    host.querySelectorAll("[data-ren]").forEach((b) => b.addEventListener("click", (e) => {
      e.stopPropagation();
      rename(b.dataset.ren, b.closest("tr"));
    }));
    host.querySelectorAll("[data-move]").forEach((b) => b.addEventListener("click", () => {
      const f = fileOf(b);
      if (f) move(f);
    }));
    host.querySelectorAll("[data-del]").forEach((b) => b.addEventListener("click", (e) => {
      e.stopPropagation();
      remove(b.dataset.del, b.closest("tr"));
    }));
    host.querySelectorAll("[data-mgo]").forEach((b) => b.addEventListener("click", () =>
      go(b.dataset.mgo)));
    host.querySelectorAll("[data-mfile]").forEach((b) => b.addEventListener("click", () => {
      const f = [...((DATA && DATA.files) || []), ...((FOUND && FOUND.files) || [])]
        .find((x) => x.id === b.dataset.mfile);
      if (f) fileSheet(f);
    }));
    host.querySelectorAll("[data-mfolder]").forEach((b) => b.addEventListener("click", () => {
      const f = ((DATA && DATA.folders) || []).find((x) => x.id === b.dataset.mfolder);
      if (f) folderSheet(f);
    }));
    host.querySelectorAll("[data-pdoc]").forEach((row) => {
      const doc = ((DATA && DATA.docs) || []).find((x) => x.id === row.dataset.pdoc);
      if (!doc) return;
      const on = (sel, fn) => { const b = $f(sel, row); if (b) b.addEventListener("click", () => fn(b)); };
      on("[data-popen]", (b) => (doc.preview ? open(doc, b) : download(doc, b)));
      on("[data-pdown]", (b) => download(doc, b));
      on("[data-pdel]", () => removeDoc(doc));
      on("[data-pmove]", () => moveDoc(doc));
      const dt = $f("[data-pdate]", row);
      if (dt) dt.addEventListener("change", async () => {
        try {
          await AUTH.api("PATCH", "/documents/" + encodeURIComponent(doc.id), { doc_date: dt.value });
          await refresh();
          note(dt.value ? "Дата изменения записана" : "Дата изменения снята");
        } catch (e) { note("Не вышло: " + e.message, true); }
      });
    });
    wireDrag(host);
    host.querySelectorAll("[data-restore], [data-mrestore]").forEach((b) => b.addEventListener("click", async () => {
      const [type, id] = (b.dataset.mrestore || b.closest("tr").dataset.trash).split(":");
      try {
        await AUTH.api("POST", "/files/restore", { type, id });
        await refresh();
        note("Возвращено на место");
      } catch (err) { note("Не вышло: " + err.message, true); }
    }));
  }

  const hasFiles = (e) => [...(e.dataTransfer ? e.dataTransfer.types : [])].includes("Files");
  const fileOf = (el) => {
    const id = el.closest("tr").dataset.file;
    return [...((DATA && DATA.files) || []), ...((FOUND && FOUND.files) || [])]
      .find((x) => x.id === id);
  };

  function note(text, bad) {
    const host = hostEl();
    const box = host && $f("#flNote", host);
    if (!box) return;
    box.textContent = text;
    box.classList.toggle("bad", !!bad);
    box.hidden = false;
  }

  /* Загрузка по одному файлу: десяток больших файлов разом забил бы канал
     и сервер, а по одному каждый видно, и ошибка одного не рушит остальные. */
  function enqueue(files, extra) {
    if (!files.length || !DATA || !DATA.can || !DATA.can.upload) return;
    const max = DATA.max || 512 * 1024 * 1024;
    const ext = DATA.ext || [];
    for (const file of files) {
      const q = Object.assign({ file, loaded: 0, state: "wait", error: "", root: ROOT,
        folder: FOLDER, site: inSite() ? SITE : "", pfolder: (DATA && DATA.sub) || "" }, extra || {});
      const dot = file.name.lastIndexOf(".");
      if (q.doc && ext.length && !ext.includes(dot > 0 ? file.name.slice(dot).toLowerCase() : "")) {
        q.state = "err"; q.error = "такой формат не принимаем";
      } else if (file.size > max) { q.state = "err"; q.error = "больше " + size(max); }
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
    FRESH.hold();
    try {
      await send(q);
      q.state = "ok";
    } catch (e) {
      q.state = "err";
      q.error = e.message;
    } finally {
      FRESH.release();
      sending = false;
    }
    if (q.root === ROOT && q.folder === FOLDER && q.site === (inSite() ? SITE : "")
        && VIEW === "files") await refresh();
    else render();
    pump();
  }

  function send(q) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      if (q.doc) {
        // Проектная документация — документ объекта, тем же путём, что в
        // «Письмах»: одна запись на оба раздела.
        xhr.open("POST", "/api/sites/" + encodeURIComponent(q.site) + "/documents");
        xhr.setRequestHeader("Authorization", "Bearer " + AUTH.token());
        xhr.setRequestHeader("X-Doc-Name", encodeURIComponent(q.file.name));
        xhr.setRequestHeader("X-Doc-Kind", "project");
        if (q.title) xhr.setRequestHeader("X-Doc-Title", encodeURIComponent(q.title));
        if (q.pfolder) xhr.setRequestHeader("X-Doc-Folder", q.pfolder);
        if (q.date) xhr.setRequestHeader("X-Doc-Date", q.date);
        xhr.setRequestHeader("Content-Type", q.file.type || "application/octet-stream");
      } else {
        xhr.open("POST", "/api/files/upload");
        xhr.setRequestHeader("Authorization", "Bearer " + AUTH.token());
        // В заголовке HTTP допустим только latin-1: кириллицу кодируем.
        xhr.setRequestHeader("X-File-Name", encodeURIComponent(q.file.name));
        xhr.setRequestHeader("X-File-Root", q.root);
        xhr.setRequestHeader("X-File-Folder", q.folder);
        if (q.site) xhr.setRequestHeader("X-File-Site", q.site);
        xhr.setRequestHeader("Content-Type", "application/octet-stream");
      }
      let last = 0;
      xhr.upload.addEventListener("progress", (e) => {
        q.loaded = e.loaded;
        // Перерисовываем полосу не на каждый килобайт, а раз в полсекунды.
        if (Date.now() - last > 500) { last = Date.now(); paintQueue(); }
      });
      xhr.addEventListener("load", () => {
        if (xhr.status >= 200 && xhr.status < 300) return resolve();
        let msg = "";
        try { msg = JSON.parse(xhr.responseText).error || ""; } catch (e) { /* не json */ }
        // 413 без текста — отказ nginx на входе, до API он не дошёл.
        reject(new Error(msg || (xhr.status === 413
          ? "сервер не принял файл " + size(q.file.size) + ": лимит размера на входе сайта"
          : "ответ сервера " + xhr.status)));
      });
      xhr.addEventListener("error", () => reject(new Error("сеть оборвалась")));
      xhr.send(q.file);
    });
  }

  function paintQueue() {
    const host = hostEl();
    const box = host && $f(".fl-queue", host);
    if (!box) return render();
    const tmp = document.createElement("div");
    tmp.innerHTML = queueHtml();
    if (tmp.firstElementChild) box.replaceWith(tmp.firstElementChild);
  }

  /* Скачать: запрос с токеном, ответ — в файл. Ссылкой нельзя: браузер не
     приложит к ней заголовок входа. Пока файл едет, кнопку обводит кольцо
     (dl.js). */
  const fileUrl = (f) => (f.doc ? "/api/documents/" + encodeURIComponent(f.id) + "/file"
    : "/api/files/" + encodeURIComponent(f.id) + "/download");

  async function download(f, btn) {
    try {
      await DL.save(fileUrl(f), { btn, name: f.doc ? f.filename : f.name });
    } catch (e) { note("Не вышло: " + e.message, true); }
  }

  /* PDF и картинки — в новой вкладке. Тип берём с сервера, а он называет
     безопасным только PDF и картинки. */
  async function open(f, btn) {
    try {
      await DL.open(fileUrl(f), { btn });
    } catch (e) {
      note("Не вышло: " + e.message, true);
    }
  }

  /* Маленькое окно с одним полем — для имени папки и переименования. */
  function ask(title, label, value) {
    return new Promise((resolve) => {
      const box = document.createElement("div");
      box.className = "pf-modal";
      box.innerHTML = `
        <div class="pf-crop cnt-card fl-ask" role="dialog" aria-label="${esc(title)}">
          <h3>${esc(title)}</h3>
          <div class="fld"><label for="flAsk">${esc(label)}</label>
            <input id="flAsk" value="${esc(value || "")}" autocomplete="off"></div>
          <div class="pf-modal-foot"><span class="grow"></span>
            <button type="button" class="btn ghost" data-no>Отмена</button>
            <button type="button" class="btn" data-ok>Сохранить</button></div>
        </div>`;
      document.body.appendChild(box);
      const inp = $f("#flAsk", box);
      const done = (v) => { document.removeEventListener("keydown", key); box.remove(); resolve(v); };
      const key = (e) => {
        if (e.key === "Escape") done(null);
        if (e.key === "Enter") done(inp.value.trim() || null);
      };
      document.addEventListener("keydown", key);
      box.addEventListener("click", (e) => { if (e.target === box) done(null); });
      $f("[data-no]", box).addEventListener("click", () => done(null));
      $f("[data-ok]", box).addEventListener("click", () => done(inp.value.trim() || null));
      inp.focus();
      // Имя без расширения выделено: переименовывают обычно его.
      const dot = (value || "").lastIndexOf(".");
      inp.setSelectionRange(0, dot > 0 ? dot : (value || "").length);
    });
  }

  /* Переименовать папку, в которой стоим: в «Письмах» папки открывают
     плиткой и правят уже внутри. */
  async function renameCurrent() {
    const cur = DATA && DATA.folder;
    if (!cur) return;
    const name = await ask("Переименовать папку", "Новое имя", cur.name);
    if (!name || name === cur.name) return;
    try {
      await AUTH.api("PATCH", "/files/folders/" + encodeURIComponent(cur.id), { name });
      await refresh();
    } catch (e) { note("Не вышло: " + e.message, true); }
  }

  async function mkdir() {
    const name = await ask("Новая папка", "Название", "");
    if (!name) return;
    try {
      await AUTH.api("POST", "/files/folders", { root: ROOT, site: SITE, parent_id: FOLDER, name });
      await refresh();
    } catch (e) { note("Не вышло: " + e.message, true); }
  }

  async function rename(kind, tr) {
    const list = kind === "folder" ? DATA.folders : DATA.files;
    const id = kind === "folder" ? tr.dataset.folder : tr.dataset.file;
    const item = (list || []).find((x) => x.id === id);
    if (!item) return;
    const name = await ask(kind === "folder" ? "Переименовать папку" : "Переименовать файл",
                           "Новое имя", item.name);
    if (!name || name === item.name) return;
    try {
      await AUTH.api("PATCH", (kind === "folder" ? "/files/folders/" : "/files/") + id, { name });
      await refresh();
    } catch (e) { note("Не вышло: " + e.message, true); }
  }

  async function remove(kind, tr) {
    const id = kind === "folder" ? tr.dataset.folder : tr.dataset.file;
    const list = kind === "folder" ? DATA.folders : DATA.files;
    const item = (list || []).find((x) => x.id === id);
    if (!item) return;
    const what = kind === "folder"
      ? `папку «${item.name}» со всем содержимым` : `файл «${item.name}»`;
    if (!(await ASK.confirm(`Убрать в корзину ${what}?\nВернуть можно в течение 30 дней.`,
                            { ok: "В корзину" }))) return;
    try {
      await AUTH.api("DELETE", (kind === "folder" ? "/files/folders/" : "/files/") + id);
      await refresh();
      note("В корзине — вернуть можно 30 дней");
    } catch (e) { note("Не вышло: " + e.message, true); }
  }

  /* Загрузить проект или изменение: что это — и файлы. Название видно
     в списке крупно, как в «Письмах». */
  /* pre — файлы, которые перетащили в «1. Проекты»: окно то же, файлы уже
     выбраны. Дата изменения — обязательна (правка № 41, 23.10.2026). */
  function uploadProject(pre) {
    const docs = (DATA && DATA.docs) || [];
    const box = document.createElement("div");
    box.className = "pf-modal";
    box.innerHTML = `
      <div class="pf-crop cnt-card fl-ask" role="dialog" aria-label="Проектная документация">
        <h3>Проектная документация</h3>
        <div class="fld"><label for="flPT">Что это</label>
          <input id="flPT" autocomplete="off" value="" placeholder="по имени файла"></div>
        <div class="fld"><label for="flPD">Изменение от <em class="fl-req">обязательно</em></label>
          <input id="flPD" type="date" value="${new Date().toISOString().slice(0, 10)}"></div>
        <div class="fld"><span>Файлы</span>
          <label class="btn-ghost fl-ppick">${ICO.up}<span>Выбрать файлы</span>
            <input type="file" id="flPF" multiple hidden></label>
          <i class="fld-hint" id="flPN">PDF, DWG, архив — до ${size((DATA && DATA.max) || 0)}</i></div>
        <i class="fld-hint">Изменения кладите следом, не удаляя прежний проект. Файл появится и
          в «Письмах» у этого объекта.</i>
        <div class="pf-modal-foot"><span class="grow"></span>
          <button type="button" class="btn ghost" data-no>Отмена</button>
          <button type="button" class="btn" data-ok>Загрузить</button></div>
      </div>`;
    document.body.appendChild(box);
    const pickEl = $f("#flPF", box), names = $f("#flPN", box), titleEl = $f("#flPT", box);
    // Название — из имени файла (правка № 17, 22.10.2026: «название
    // изменения автоматически подтягивалось из названия файла»). Вписали
    // своё — оно у всех выбранных файлов.
    let typed = false;
    titleEl.addEventListener("input", () => { typed = titleEl.value.trim() !== ""; });
    const close = () => { document.removeEventListener("keydown", key); box.remove(); };
    const key = (e) => { if (e.key === "Escape") close(); };
    document.addEventListener("keydown", key);
    box.addEventListener("click", (e) => { if (e.target === box) close(); });
    $f("[data-no]", box).addEventListener("click", close);
    pickEl.addEventListener("change", () => {
      if (pickEl.files.length) names.textContent = [...pickEl.files].map((f) => f.name).join(", ");
      if (!typed) {
        titleEl.value = pickEl.files.length === 1 ? baseName(pickEl.files[0].name) : "";
        titleEl.placeholder = pickEl.files.length > 1 ? "у каждого — по имени его файла" : "по имени файла";
      }
    });
    let preFiles = pre && pre.length ? [...pre] : null;
    if (preFiles) {
      names.textContent = preFiles.map((f) => f.name).join(", ");
      titleEl.value = preFiles.length === 1 ? baseName(preFiles[0].name) : "";
      titleEl.placeholder = preFiles.length > 1 ? "у каждого — по имени его файла" : "по имени файла";
    }
    pickEl.addEventListener("change", () => { preFiles = null; });
    $f("[data-ok]", box).addEventListener("click", () => {
      const files = preFiles || [...pickEl.files];
      if (!files.length) { names.textContent = "Выберите файл"; names.classList.add("bad"); return; }
      const date = $f("#flPD", box).value;
      if (!date) { $f("#flPD", box).classList.add("bad"); $f("#flPD", box).focus(); return; }
      const title = titleEl.value.trim().slice(0, 200);
      close();
      if (typed || (title && files.length === 1)) enqueue(files, { doc: true, title, date });
      else files.forEach((f) => enqueue([f], { doc: true, title: baseName(f.name).slice(0, 200), date }));
    });
  }

  async function removeDoc(doc) {
    if (!(await ASK.confirm("Убрать «" + (doc.title || doc.filename) + "» из проектной документации?\n"
      + "Файл пропадёт и в «Письмах» у этого объекта."))) return;
    try {
      await AUTH.api("DELETE", "/documents/" + encodeURIComponent(doc.id));
      await refresh();
      note("Убрано из проектной документации");
    } catch (e) { note("Не вышло: " + e.message, true); }
  }

  /* Перетащить файл в папку (правка № 38, 23.10.2026): строку файла — на
     строку папки или на звено пути вверху. В «1. Проекты» — документ в
     папку раздела или обратно в «1. Проекты». Перетаскивание файлов с
     компьютера (загрузка) — своим путём: у него в переносе «Files». */
  const MOVE_T = "application/x-karkas-move";
  function wireDrag(host) {
    if (!DATA || VIEW !== "files" || searching()) return;
    const proj = !!DATA.project;
    const list = proj ? (DATA.docs || []) : (DATA.files || []);
    host.querySelectorAll(proj ? "tr[data-pdoc]" : "tr[data-file]").forEach((row) => {
      const id = row.dataset.pdoc || row.dataset.file;
      const it = list.find((x) => x.id === id);
      if (!it || !it.can_edit) return;
      row.draggable = true;
      row.classList.add("fl-drag");
      row.addEventListener("dragstart", (e) => {
        e.dataTransfer.setData(MOVE_T, JSON.stringify({ proj, id, name: it.title || it.name || it.filename }));
        e.dataTransfer.effectAllowed = "move";
        row.classList.add("fl-dragging");
        host.classList.add("fl-moving");
      });
      row.addEventListener("dragend", () => {
        row.classList.remove("fl-dragging");
        host.classList.remove("fl-moving");
        host.querySelectorAll(".fl-dropto").forEach((x) => x.classList.remove("fl-dropto"));
      });
    });
    const targets = [...host.querySelectorAll("tr.fl-dir[data-folder]:not(.fl-pin)")]
      .map((t) => [t, t.dataset.folder, $f(".t-name", t) ? $f(".t-name", t).textContent : ""])
      .concat([...host.querySelectorAll(".fl-crumbs [data-go]")].map((t) => [t, t.dataset.go, t.textContent]));
    for (const [t, to, label] of targets) {
      // Документ проекта переносят только между папками «1. Проекты».
      if (proj && to === "") continue;
      if (!proj && to === "@project") continue;
      t.addEventListener("dragover", (e) => {
        if (![...e.dataTransfer.types].includes(MOVE_T)) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        t.classList.add("fl-dropto");
      });
      t.addEventListener("dragleave", () => t.classList.remove("fl-dropto"));
      t.addEventListener("drop", async (e) => {
        const raw = e.dataTransfer.getData(MOVE_T);
        if (!raw) return;
        e.preventDefault();
        e.stopPropagation();
        t.classList.remove("fl-dropto");
        const m = JSON.parse(raw);
        try {
          if (m.proj) {
            await AUTH.api("PATCH", "/documents/" + encodeURIComponent(m.id), { pfolder: to === "@project" ? "" : to });
          } else {
            await AUTH.api("PATCH", "/files/" + m.id, { folder_id: to });
          }
          await refresh();
          note(`«${m.name}» — в «${String(label).trim() || rootName()}»`);
        } catch (err) { note("Не вышло: " + err.message, true); }
      });
    }
  }

  /* Перенести файл: дерево папок того же корня, выбор щелчком. */
  async function move(f) {
    let all = [];
    try {
      all = await AUTH.api("GET", "/files/folders?" + rq());
    } catch (e) { return note("Не вышло: " + e.message, true); }
    const kids = (pid) => all.filter((x) => x.parent_id === pid);
    const tree = (pid, depth) => kids(pid).map((x) => `
      <button type="button" class="fl-tree-b${x.id === f.folder_id ? " on" : ""}"
        data-to="${esc(x.id)}" style="padding-left:${10 + depth * 18}px">${ICO.folder}${
        esc(x.name)}</button>${tree(x.id, depth + 1)}`).join("");
    const rootOk = ROOT !== "shared" || (DATA.can && DATA.can.admin);
    const box = document.createElement("div");
    box.className = "pf-modal";
    box.innerHTML = `
      <div class="pf-crop cnt-card fl-ask" role="dialog" aria-label="Перенести">
        <h3>Перенести «${esc(f.name)}»</h3>
        <div class="fl-tree">
          ${rootOk ? `<button type="button" class="fl-tree-b${!f.folder_id ? " on" : ""}"
            data-to="">${ICO.folder}${rootName()}</button>` : ""}
          ${tree("", rootOk ? 1 : 0) || `<div class="dim">Других папок нет</div>`}
        </div>
        <div class="pf-modal-foot"><span class="grow"></span>
          <button type="button" class="btn ghost" data-no>Отмена</button></div>
      </div>`;
    document.body.appendChild(box);
    const close = () => { document.removeEventListener("keydown", key); box.remove(); };
    const key = (e) => { if (e.key === "Escape") close(); };
    document.addEventListener("keydown", key);
    box.addEventListener("click", (e) => { if (e.target === box) close(); });
    $f("[data-no]", box).addEventListener("click", close);
    box.querySelectorAll("[data-to]").forEach((b) => b.addEventListener("click", async () => {
      close();
      if (b.dataset.to === (f.folder_id || "")) return;
      try {
        await AUTH.api("PATCH", "/files/" + f.id, { folder_id: b.dataset.to });
        await refresh();
        note("Перенесено");
      } catch (e) { note("Не вышло: " + e.message, true); }
    }));
  }

  return { load, mount };
})();
