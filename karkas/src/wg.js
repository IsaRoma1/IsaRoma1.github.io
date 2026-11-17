/* Вектор — совет разработки платформы (ТЗ заказчика, 22.10.2026).

   Первая версия раздела — «Рабочая группа» (протоколы, доска идей,
   поручения). По ТЗ это «минималистичное стратегическое пространство»:
     главная — ключевые метрики платформы (сервер считает их сам каждую
       ночь в 00:00, график за 30 дней) и все встречи карточками;
     встреча — дата, время, место; участники с отметкой, кто был; повестка
       «обсудили / отложили», что обсудили и что решили; поручения с ответственным, сроком и
       статусом; материалы — файлы и фото;
     идеи — в чате мессенджера «Вектор» (кнопка «Чат совета»), голос —
       реакцией 👍 / 👎.
   Члены совета (раздел открыт в «Пользователи → Доступ») видят и ведут всё;
   остальным — метрики, даты встреч и «Обращение в комитет».

   Сервер на каждую правку отдаёт раздел целиком (deploy/api.py, wg_*).
   Грабли первой версии: у #wgBody атрибут data-view, не data-tab; людей
   выбираем своим всплывающим списком — родной select в часто
   перерисованных строках плодит .sel-list от dressSelect. */
"use strict";
const WG = (() => {
  const $w = (s, root = document) => root.querySelector(s);
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const svg = (d) => `<svg viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
  const ICO = {
    plus: svg('<path d="M12 5v14M5 12h14"/>'),
    x: svg('<path d="M6 6l12 12M18 6 6 18"/>'),
    back: svg('<path d="m14 6-6 6 6 6"/>'),
    cal: svg('<rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 9.5h17M8 3v4M16 3v4"/>'),
    clock: svg('<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>'),
    pin: svg('<path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Z"/><circle cx="12" cy="10" r="2.3"/>'),
    print: svg('<path d="M7 8.5V4h10v4.5M7 17H5a1.5 1.5 0 0 1-1.5-1.5v-5.5A1.5 1.5 0 0 1 5 8.5h14a1.5 1.5 0 0 1 1.5 1.5v5.5A1.5 1.5 0 0 1 19 17h-2"/><path d="M7 14h10v6H7z"/>'),
    trash: svg('<path d="M4.5 6.5h15M9.5 6.5V4.8A1.3 1.3 0 0 1 10.8 3.5h2.4a1.3 1.3 0 0 1 1.3 1.3v1.7M6.5 6.5l.9 12.2A1.5 1.5 0 0 0 8.9 20h6.2a1.5 1.5 0 0 0 1.5-1.3l.9-12.2"/>'),
    check: svg('<path d="m5.5 12.5 4 4 9-9.5"/>'),
    pause: svg('<path d="M9 6.5v11M15 6.5v11"/>'),
    note: svg('<path d="M5 4.5h14v11l-4.5 4h-9.5z"/><path d="M14.5 19.5v-4h4.5M8.5 9h7M8.5 12.5h4"/>'),
    chat: svg('<path d="M20 11.5a8 8 0 0 1-8 8H5l-3 2v-10a9 9 0 0 1 18 0Z"/><path d="M7 9h8M7 13h5"/>'),
    people: svg('<path d="M16 20v-1.6a3.4 3.4 0 0 0-3.4-3.4H6.4A3.4 3.4 0 0 0 3 18.4V20"/><circle cx="9.5" cy="7.5" r="3.5"/><path d="M21 20v-1.6a3.4 3.4 0 0 0-2.6-3.3M15.5 4.2a3.4 3.4 0 0 1 0 6.6"/>'),
    userPlus: svg('<path d="M14 20v-1.6a3.4 3.4 0 0 0-3.4-3.4H5.4A3.4 3.4 0 0 0 2 18.4V20"/><circle cx="8" cy="7.5" r="3.5"/><path d="M19 8v6M16 11h6"/>'),
    arrow: svg('<path d="M5 12h14M13 6l6 6-6 6"/>'),
    clip: svg('<path d="m20.5 11.5-8.2 8.2a5.2 5.2 0 0 1-7.4-7.4l8.6-8.6a3.5 3.5 0 0 1 4.9 4.9l-8.6 8.6a1.7 1.7 0 0 1-2.5-2.5l7.9-7.9"/>'),
    down: svg('<path d="M12 4v11M7 10.5l5 5 5-5M5 20h14"/>'),
    bug: svg('<path d="M9 7.5V6a3 3 0 0 1 6 0v1.5"/><rect x="7" y="7.5" width="10" height="12" rx="5"/><path d="M12 11v8.5M3.5 13H7M17 13h3.5"/>'),
    send: svg('<path d="m3 3 18 9-18 9 4-9-4-9Zm4 9h14"/>'),
    up: svg('<path d="m6 15 6-6 6 6"/>'),
    dn: svg('<path d="m6 9 6 6 6-6"/>'),
    vector: svg('<circle cx="6.5" cy="17.5" r="2.2"/><path d="M8.2 15.8 17.5 6.5M11.5 6.5h6v6"/>'),
  };
  const ISS_ST = { review: "На согласовании", work: "В работе", done: "Готово", rejected: "Отклонена" };
  const TASK_ST = [["work", "В работе"], ["done", "Завершено"], ["later", "Отложено"]];
  const CHUNK = 6 << 20, FILE_MAX = 100 << 20;

  // Отбор поручений в работе на главной (пользователь, 22.10.2026: «Мои / Все / Просроченные»).
  const DEC_F = [["mine", "Мои"], ["all", "Все"], ["late", "Просроченные"]];
  const DEC_PICK = { mine: (t) => t.who === me.id, all: () => true, late: (t) => t.late };

  let me = null, badgeTimer = null, saved = 0;
  // view — «» главная, иначе id открытой встречи. notes — вопросы с открытой
  // заметкой, ups — загрузки материалов по встречам, df — отбор поручений.
  const S = { data: null, view: "", loading: false, notes: new Set(), ups: new Map(), df: "" };
  try { S.df = localStorage.getItem("wg-df") || ""; } catch (_) { /* приватный режим */ }

  const plural = (n, a, b, c) => n % 10 === 1 && n % 100 !== 11 ? a : n % 10 >= 2 && n % 10 <= 4 && !(n % 100 >= 12 && n % 100 <= 14) ? b : c;
  const initials = (s) => String(s || "?").trim().split(/\s+/).slice(0, 2).map((w) => w[0] || "").join("").toUpperCase();
  const people = () => (S.data && S.data.people) || [];
  const person = (id) => people().find((p) => p.id === id) || null;
  function avatar(p, cls = "") {
    if (!p) return `<span class="wg-av ${cls}">?</span>`;
    const img = p.avatar && typeof AUTH === "object" ? AUTH.avatarUrl(p.id, p.avatar) : "";
    return `<span class="wg-av ${cls}" title="${esc(p.name)}">${img ? `<img src="${esc(img)}" alt="">` : esc(initials(p.name))}</span>`;
  }
  const asDate = (iso) => { const [y, m, d] = String(iso || "").split("-").map(Number); return y ? new Date(y, m - 1, d) : null; };
  const dayLong = (iso) => { const d = asDate(iso); return d ? d.toLocaleDateString("ru-RU", { weekday: "short", day: "numeric", month: "long" }) : ""; };
  const dayShort = (iso) => { const d = asDate(iso); return d ? d.toLocaleDateString("ru-RU", { day: "numeric", month: "short" }) : ""; };
  const dayNum = (iso) => { const d = asDate(iso); return d ? d.toLocaleDateString("ru-RU") : ""; };
  const when = (m) => dayLong(m.day) + (m.time ? ", " + m.time : "");
  const size = (n) => n < 1024 ? n + " Б" : n < 1 << 20 ? Math.round(n / 1024) + " КБ"
    : (n / 1048576).toFixed(n < 10 << 20 ? 1 : 0).replace(".", ",") + " МБ";
  const extOf = (name) => (/\.([a-z0-9]{1,5})$/i.exec(name || "") || [, "файл"])[1].toUpperCase().slice(0, 4);
  const meetings = () => (S.data ? S.data.meetings : []);
  const meeting = (id) => meetings().find((m) => m.id === id) || null;
  const member = () => !!(S.data && S.data.member);
  // Ближайшая — запланированная с датой не раньше сегодня.
  const nearest = () => meetings().filter((m) => m.status === "plan" && m.day >= S.data.today)
    .sort((a, b) => (a.day + a.time).localeCompare(b.day + b.time))[0] || null;
  const issueTag = (iss) => !iss ? "" : iss.gone
    ? `<span class="wg-tag off" title="Правку убрали из «Правок и ошибок»">правка № ${iss.no} убрана</span>`
    : `<button type="button" class="wg-tag iss ${esc(iss.status)}" data-open-iss="${iss.no}" title="${esc(iss.title)}">${ICO.bug}№ ${iss.no} · ${esc(ISS_ST[iss.status] || "")}</button>`;

  /* ── обмен с сервером ─────────────────────────────────────── */
  async function call(method, path, body) {
    try {
      const out = await AUTH.api(method, "/wg" + path, body);
      if (out && out.meetings) S.data = out;
      flash();
      badge();
      return out;
    } catch (err) {
      if (typeof ASK === "object") ASK.alert(err.message, { title: "Не сохранилось" });
      throw err;
    }
  }
  async function load() {
    S.loading = true;
    try {
      S.data = await AUTH.api("GET", "/wg");
      if (S.view && (!member() || !meeting(S.view))) S.view = "";
      paint();
    } catch (err) {
      const body = $w("#wgBody");
      if (body) body.innerHTML = `<div class="wg-empty">Раздел не загрузился: ${esc(err.message)}</div>`;
    } finally { S.loading = false; }
  }
  function flash() {
    const el = $w("#wgSaved");
    if (!el) return;
    el.classList.add("on");
    clearTimeout(saved);
    saved = setTimeout(() => el.classList.remove("on"), 1400);
  }

  /* ── рамка раздела ────────────────────────────────────────── */
  function frame() {
    const host = $w("#sec-wg");
    if (!host || $w(".wg-pg", host)) return;
    host.innerHTML = `<div class="pg wg-pg">
      <div class="pg-head wg-head" id="wgHead"></div>
      <div class="wg-body" id="wgBody"><div class="wg-empty">Загружаю…</div></div>
    </div>`;
    host.addEventListener("click", onClick);
    host.addEventListener("change", onChange);
    host.addEventListener("keydown", onKey);
    host.addEventListener("input", (ev) => { if (ev.target.matches("textarea")) grow(ev.target); });
    // График метрики: перекрестье и значение под указателем.
    host.addEventListener("pointermove", (ev) => { const sp = ev.target.closest && ev.target.closest("[data-spark]"); if (sp) sparkHover(sp, ev); });
    host.addEventListener("pointerout", (ev) => {
      const sp = ev.target.closest && ev.target.closest("[data-spark]");
      if (sp && !sp.contains(ev.relatedTarget)) sparkHide(sp);
    });
    // Материалы встречи перетаскивают прямо на страницу встречи.
    host.addEventListener("dragover", (ev) => {
      if (!S.view || ![...(ev.dataTransfer?.types || [])].includes("Files")) return;
      ev.preventDefault();
      const z = $w(".wg-files", host); if (z) z.classList.add("over");
    });
    host.addEventListener("dragleave", (ev) => {
      const z = $w(".wg-files", host);
      if (z && !host.contains(ev.relatedTarget)) z.classList.remove("over");
    });
    host.addEventListener("drop", (ev) => {
      if (!S.view || !ev.dataTransfer?.files?.length) return;
      ev.preventDefault();
      const z = $w(".wg-files", host); if (z) z.classList.remove("over");
      upload(S.view, [...ev.dataTransfer.files]);
    });
  }
  function paint() {
    frame();
    paintHead();
    paintBody();
  }
  function paintHead() {
    const head = $w("#wgHead");
    if (!head || !S.data) return;
    const m = S.view ? meeting(S.view) : null;
    if (m) {
      const canDel = S.data.admin || m.author_id === me.id;
      head.innerHTML = `<button type="button" class="wg-back" data-home title="Все встречи" aria-label="Все встречи">${ICO.back}</button>
        <div class="wg-h-l"><span class="wg-h-row"><b class="wg-h-t">Встреча № ${m.no}</b>
          <i class="wg-st ${m.status}">${esc(S.data.statuses[m.status] || "")}</i></span><span class="wg-h-s">${esc(when(m))}</span></div>
        <span class="wg-saved" id="wgSaved">${ICO.check}Сохранено</span>
        <span class="tb-gap"></span>
        ${m.status === "plan" ? `<button type="button" class="btn-brand sm" data-held title="Отметить проведённой">${ICO.check}<span>Отметить проведённой</span></button>`
          : `<button type="button" class="btn-ghost sm" data-replan title="Вернуть в запланированные">${ICO.cal}<span>Вернуть в запланированные</span></button>`}
        <button type="button" class="btn-ghost sm" data-print title="Протокол встречи — на печать или в PDF">${ICO.print}<span>Протокол</span></button>
        ${canDel ? `<button type="button" class="wg-ib" data-del-meet title="Удалить встречу" aria-label="Удалить встречу">${ICO.trash}</button>` : ""}`;
      return;
    }
    const next = nearest(), n = meetings().length;
    const sum = `<div class="wg-h-l"><b class="wg-h-t">Совет разработки платформы</b><span class="wg-h-s">${n
      ? `${n} ${plural(n, "встреча", "встречи", "встреч")}${next ? " · ближайшая — " + esc(when(next)) : ""}` : "встреч пока нет"}</span></div>`;
    if (!member()) {
      head.innerHTML = `${sum}<span class="tb-gap"></span>
        <button type="button" class="btn-brand sm" data-appeal>${ICO.send}<span>Обращение в комитет</span></button>`;
      return;
    }
    const crew = people().filter((p) => p.member);
    head.innerHTML = `${sum}<span class="wg-saved" id="wgSaved">${ICO.check}Сохранено</span><span class="tb-gap"></span>
      <button type="button" class="wg-crew" data-crew title="Члены совета"><span class="wg-stack">${crew.slice(0, 5).map((p) => avatar(p)).join("")}</span>
        <span>${crew.length} ${plural(crew.length, "член", "члена", "членов")} совета</span></button>
      <button type="button" class="btn-ghost sm" data-chat title="Чат «Вектор» в мессенджере: идеи и обсуждения">${ICO.chat}<span>Чат совета</span></button>
      <button type="button" class="btn-brand sm" data-new-meet>${ICO.plus}<span>Назначить встречу</span></button>`;
  }
  function paintBody() {
    const body = $w("#wgBody");
    if (!body || !S.data) return;
    const top = body.scrollTop, same = body.dataset.view === (S.view || "home");
    body.dataset.view = S.view || "home";
    const m = S.view ? meeting(S.view) : null;
    body.innerHTML = m ? meetView(m) : home();
    body.querySelectorAll("textarea").forEach(grow);
    body.scrollTop = same ? top : 0;
  }
  function grow(t) {
    t.style.height = "auto";
    t.style.height = Math.min(t.scrollHeight + 2, 320) + "px";
  }
  function open(id) {
    S.view = id || "";
    paint();
  }

  /* ── главная ─────────────────────────────────────────────── */
  function home() {
    const d = S.data;
    const metrics = `<section class="wg-sec">
      <header class="wg-sec-h"><h3>Ключевые метрики</h3>
        <span class="wg-hint">Nexus пересчитывает их каждую ночь в 00:00 · график — за 30 дней</span></header>
      <div class="vx-grid">${d.metrics.map(metricCard).join("")}</div></section>`;
    if (!member()) {
      return `<div class="wg-home">${metrics}
        <section class="wg-sec"><header class="wg-sec-h"><h3>Встречи совета</h3></header>${dates()}</section>
        <section class="wg-sec wg-appeal"><span class="wg-appeal-ic">${ICO.vector}</span>
          <div><h3>Есть идея или что-то мешает в работе?</h3>
          <p>Совет Вектор решает, что и в каком порядке улучшать в платформе. Напишите — Nexus передаст обращение совету,
          ответ придёт вам в мессенджер.</p></div>
          <button type="button" class="btn-brand" data-appeal>${ICO.send}Обращение в комитет</button></section>
      </div>`;
    }
    const ms = meetings().slice().sort((a, b) => (b.day + b.time).localeCompare(a.day + a.time) || b.no - a.no);
    const next = nearest();
    return `<div class="wg-home">${metrics}
      <div class="wg-home-cols">
        <section class="wg-sec"><header class="wg-sec-h"><h3>Встречи</h3>${ms.length ? `<i class="wg-n">${ms.length}</i>` : ""}</header>
          ${ms.length ? `<div class="wg-meets">${ms.map((m) => meetCard(m, next && m.id === next.id)).join("")}</div>`
            : `<div class="wg-empty sm"><b>Встреч пока нет.</b>Назначьте первую — дата, место, участники и повестка; Nexus сообщит в чат совета.
              <button type="button" class="btn-brand" data-new-meet>${ICO.plus}Назначить встречу</button></div>`}
        </section>
        <aside class="wg-home-side">${decisions()}${ideas()}</aside>
      </div></div>`;
  }
  /* Поручения в работе по всем встречам: свои, все или просроченные. Щелчок —
     к встрече, галочка — «Завершено». */
  function decisions() {
    const open = S.data.tasks.filter((t) => t.status === "work");
    if (!DEC_PICK[S.df]) S.df = open.some(DEC_PICK.mine) ? "mine" : "all";
    const list = open.filter(DEC_PICK[S.df])
      .sort((a, b) => (a.due || "9999").localeCompare(b.due || "9999") || a.meeting_no - b.meeting_no);
    return `<section class="wg-sec wg-side-card"><header class="wg-sec-h"><h3>Поручения в работе</h3>${open.length ? `<i class="wg-n">${open.length}</i>` : ""}</header>
      <div class="wg-df-chips" role="group" aria-label="Отбор поручений">${DEC_F.map(([k, l]) => {
        const n = open.filter(DEC_PICK[k]).length;
        return `<button type="button" class="wg-fchip${S.df === k ? " on" : ""}${k === "late" && n ? " late" : ""}" data-df="${k}"
          aria-pressed="${S.df === k}">${l}${n ? `<i>${n}</i>` : ""}</button>`;
      }).join("")}</div>
      ${list.length ? `<ul class="wg-dlist">${list.map((t) => {
        const who = person(t.who);
        return `<li class="wg-drow${t.late ? " late" : ""}"><button type="button" class="wg-chk" data-dec-done="${t.id}"
            title="Отметить: завершено" aria-label="Завершено">${ICO.check}</button>
          <button type="button" class="wg-drow-b" data-goto-meet="${t.meeting_id}" title="Открыть встречу № ${t.meeting_no}">
            <span class="wg-drow-t">${esc(t.text)}</span>
            <span class="wg-drow-m">${who ? avatar(who, "xs") + `<span>${esc(who.name)}</span>` : `<span>${esc(t.who_name || "без ответственного")}</span>`}
              ${t.due ? `<em class="${t.late ? "late" : ""}">до ${esc(dayShort(t.due))}</em>` : ""}<span>встреча № ${t.meeting_no}</span></span></button></li>`;
      }).join("")}</ul>`
        : `<p class="wg-none">${S.df === "mine" ? "Ваших поручений в работе нет." : S.df === "late" ? "Просроченных нет." : "Поручений в работе нет."}</p>`}
    </section>`;
  }
  /* Идеи из чата совета — самые поддержанные 👍 за 30 дней; «В повестку»
     ставит идею вопросом во встречу, которая впереди. */
  function ideas() {
    const list = S.data.ideas || [];
    const plans = meetings().filter((m) => m.status === "plan");
    const when1 = (at) => new Date(at).toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
    return `<section class="wg-sec wg-side-card"><header class="wg-sec-h"><h3>Идеи из чата</h3>
        <span class="wg-hint">самые поддержанные 👍 за 30 дней</span></header>
      ${list.length ? `<ul class="wg-ideas">${list.map((i) => `<li>
          <span class="wg-idea-v" title="За / против"><b>👍 ${i.up}</b>${i.down ? `<small>👎 ${i.down}</small>` : ""}</span>
          <span class="wg-idea-b"><span class="wg-idea-t">${esc(i.text)}</span><small>${esc(i.author)} · ${esc(when1(i.at))}</small>
            ${i.meeting_no ? `<button type="button" class="wg-tag meet" data-goto-meet="${esc(i.meeting_id)}">в повестке встречи № ${i.meeting_no}</button>`
              : plans.length ? `<button type="button" class="wg-tag ghost" data-idea="${i.id}">${ICO.plus}В повестку</button>`
              : `<span class="wg-hint">в повестку — когда назначат встречу</span>`}</span></li>`).join("")}</ul>`
        : `<p class="wg-none">Пока нет идей с 👍. Пишите идеи в чат совета и голосуйте реакциями — самые поддержанные появятся здесь.</p>`}
      <button type="button" class="wg-add sm" data-chat>${ICO.chat}Чат совета</button>
    </section>`;
  }
  // Идею — в повестку: встреча впереди одна — сразу в неё, несколько — выбрать.
  async function ideaToAgenda(btn) {
    const plans = meetings().filter((m) => m.status === "plan").sort((a, b) => (a.day + a.time).localeCompare(b.day + b.time));
    const put = async (mid) => { await call("POST", `/ideas/${btn.dataset.idea}/agenda`, { meeting_id: mid }); paint(); };
    if (plans.length === 1) return put(plans[0].id);
    const pop = popAt(btn, `<b class="wg-pop-h">В повестку какой встречи?</b><div class="wg-pp-list">${plans.map((m) => `<button type="button"
      class="wg-pp" data-pm="${m.id}"><span class="wg-av sm">${m.no}</span><span>Встреча № ${m.no}<small>${esc(when(m))}</small></span></button>`).join("")}</div>`, "wg-pick-pop");
    pop.addEventListener("click", async (ev) => {
      const b = ev.target.closest("[data-pm]");
      if (!b) return;
      pop.remove();
      try { await put(b.dataset.pm); } catch (_) { /* окно с ошибкой уже показали */ }
    });
  }
  function meetCard(m, next) {
    const d = asDate(m.day);
    const n = m.points.length;
    const ppl = m.people.map(person).filter(Boolean);
    return `<button type="button" class="wg-mcard ${m.status}${next ? " next" : ""}" data-meet="${m.id}">
      <span class="wg-mc-cal"><b>${d ? d.getDate() : "?"}</b><small>${d ? esc(d.toLocaleDateString("ru-RU", { month: "short" }).replace(".", "")) : ""}</small>
        <em>${d ? esc(d.toLocaleDateString("ru-RU", { weekday: "short" })) : ""}</em></span>
      <span class="wg-mc-b">
        <span class="wg-mc-top"><b>Встреча № ${m.no}</b><i class="wg-st ${m.status}">${esc(S.data.statuses[m.status] || "")}</i></span>
        <span class="wg-mc-when">${next ? `<em>ближайшая</em> · ` : ""}${esc([m.time, m.place].filter(Boolean).join(" · ") || "время и место не указаны")}</span>
        <span class="wg-mc-meta">
          ${ppl.length ? `<span class="wg-stack">${ppl.slice(0, 5).map((p) => avatar(p)).join("")}</span>` : ""}
          <span>${n} ${plural(n, "вопрос", "вопроса", "вопросов")}</span>
          ${m.tasks ? `<span>${m.tasks} ${plural(m.tasks, "поручение", "поручения", "поручений")}${m.open ? `, в работе ${m.open}` : ""}</span>` : ""}
          ${m.mine ? `<span class="wg-mine" title="Ваши поручения в работе">ваших ${m.mine}</span>` : ""}
          ${m.late ? `<span class="late">просрочено ${m.late}</span>` : ""}
          ${m.files.length ? `<span class="wg-mc-f">${ICO.clip}${m.files.length}</span>` : ""}
        </span></span></button>`;
  }
  // Не члену совета — только даты встреч и ближайшая (ТЗ).
  function dates() {
    const ms = meetings().slice().sort((a, b) => (b.day + b.time).localeCompare(a.day + a.time) || b.no - a.no);
    const next = nearest();
    return `${next ? `<div class="wg-next"><span class="wg-next-ic">${ICO.cal}</span><div><small>Ближайшая встреча совета</small>
        <b>${esc(when(next))}</b></div></div>` : `<p class="wg-none">Ближайшая встреча пока не назначена.</p>`}
      ${ms.length ? `<ul class="wg-dates">${ms.map((m) => `<li><span class="wg-no">№ ${m.no}</span><span>${esc(when(m))}</span>
        <i class="wg-st ${m.status}">${esc(S.data.statuses[m.status] || "")}</i></li>`).join("")}</ul>` : ""}`;
  }

  /* ── метрики ─────────────────────────────────────────────
     Плитка: название, значение крупно, изменение к неделе назад (цветом и
     стрелкой — «лучше» зависит от метрики), график за 30 дней. Щелчок —
     окно с пояснением и всеми значениями таблицей. */
  const NBSP = " ";
  function fmtValue(m, v) {
    if (v === null || v === undefined) return "—";
    const digits = m.unit === "%" ? (m.key === "uptime" ? 2 : 1) : m.unit ? 1 : 0;
    return Number(v).toLocaleString("ru-RU", { maximumFractionDigits: digits });
  }
  const unitOf = (m) => m.unit === "%" ? "%" : m.unit;
  function delta(m) {
    const c = m.change;
    if (!c) return "";
    const sign = c.value > 0 ? 1 : c.value < 0 ? -1 : 0;
    const good = sign === 0 ? "flat" : (sign > 0) === (m.better === "up") ? "good" : "bad";
    const span = c.days === 7 ? "неделю" : c.days + NBSP + "дн.";
    const txt = (sign > 0 ? "+" : sign < 0 ? "−" : "±") + Math.abs(c.value).toLocaleString("ru-RU") + NBSP + (c.kind === "pp" ? "п.п." : "%");
    return `<span class="vx-d ${good}" title="${c.kind === "pp" ? "В процентных пунктах к" : "К"} значению ${span} назад">${sign > 0 ? ICO.up : sign < 0 ? ICO.dn : ""}${txt}</span>
      <span class="vx-p">за ${span}</span>`;
  }
  function metricCard(m) {
    const v = fmtValue(m, m.value);
    const since = m.since ? dayShort(m.since) : "";
    const note = m.value === null || m.value === undefined
      ? `<span class="vx-p">${m.key === "fix" ? "ещё ни одна правка не выложена" : "данных пока нет"}</span>`
      : m.live ? `<span class="vx-p">предварительно${since ? ", копится с " + esc(since) : ""} · снимок в 00:00</span>` : "";
    return `<article class="vx-card" data-metric="${esc(m.key)}" tabindex="0" role="button"
        aria-label="${esc(m.title)}: ${esc(v)}${m.value !== null && m.value !== undefined ? " " + esc(unitOf(m)) : ""}. Подробнее">
      <header class="vx-h"><span class="vx-t">${esc(m.title)}</span><span class="vx-w">${m.days} ${plural(m.days, "день", "дня", "дней")}</span></header>
      <div class="vx-v"><b>${esc(v)}</b>${v !== "—" && unitOf(m) ? `<small>${esc(unitOf(m))}</small>` : ""}</div>
      <div class="vx-sub">${delta(m) || note}</div>
      ${spark(m)}
    </article>`;
  }
  // Точки графика — по дням, а не по номеру: пропущенный день не сжимает ось.
  function sparkPoints(m) {
    const pts = m.points || [];
    if (pts.length < 2) return [];
    const t0 = asDate(pts[0][0]).getTime(), t1 = asDate(pts[pts.length - 1][0]).getTime();
    const vals = pts.map((p) => p[1]);
    let lo = Math.min(...vals), hi = Math.max(...vals);
    if (hi === lo) { const pad = Math.abs(hi) * 0.1 || 1; lo -= pad; hi += pad; }
    return pts.map(([day, v]) => ({ day, v, x: t1 > t0 ? (asDate(day).getTime() - t0) / (t1 - t0) * 100 : 50,
      y: 3 + (1 - (v - lo) / (hi - lo)) * 26 }));
  }
  function spark(m) {
    const pts = sparkPoints(m);
    if (!pts.length) return `<div class="vx-spark empty"><span>${(m.points || []).length ? "график появится со второго снимка" : "график — с первых снимков"}</span></div>`;
    const line = pts.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(" ");
    const last = pts[pts.length - 1];
    return `<div class="vx-spark" data-spark="${esc(m.key)}">
      <svg viewBox="0 0 100 32" preserveAspectRatio="none" aria-hidden="true">
        <path class="vx-area" d="${line} L100 32 L0 32 Z"/><path class="vx-line" d="${line}" vector-effect="non-scaling-stroke"/></svg>
      <i class="vx-dot" style="left:${last.x}%;top:${(last.y / 32 * 100).toFixed(2)}%"></i>
      <i class="vx-cross" hidden></i><i class="vx-dot hover" hidden></i><span class="vx-tip" hidden></span></div>`;
  }
  function sparkHover(sp, ev) {
    const m = S.data && S.data.metrics.find((x) => x.key === sp.dataset.spark);
    const pts = m ? sparkPoints(m) : [];
    if (!pts.length) return;
    const r = sp.getBoundingClientRect();
    const at = (ev.clientX - r.left) / r.width * 100;
    const p = pts.reduce((a, b) => Math.abs(b.x - at) < Math.abs(a.x - at) ? b : a);
    const cross = $w(".vx-cross", sp), dot = $w(".vx-dot.hover", sp), tip = $w(".vx-tip", sp);
    cross.hidden = dot.hidden = tip.hidden = false;
    cross.style.left = dot.style.left = p.x + "%";
    dot.style.top = (p.y / 32 * 100) + "%";
    tip.textContent = "";
    const b = document.createElement("b");
    b.textContent = fmtValue(m, p.v) + (unitOf(m) ? NBSP + unitOf(m) : "");
    const s = document.createElement("span");
    s.textContent = dayShort(p.day);
    tip.append(b, s);
    tip.style.left = Math.min(Math.max(p.x, 18), 82) + "%";
  }
  function sparkHide(sp) {
    sp.querySelectorAll(".vx-cross, .vx-dot.hover, .vx-tip").forEach((x) => { x.hidden = true; });
  }
  // Окно метрики: как считается и все значения таблицей.
  function metricInfo(key) {
    const m = S.data.metrics.find((x) => x.key === key);
    if (!m) return;
    const rows = (m.points || []).slice().reverse();
    const { wrap } = dialog(`<header class="wg-dh"><span class="wg-dh-ic">${ICO.vector}</span><div><h3>${esc(m.title)}</h3>
        <p>окно — ${m.days} ${plural(m.days, "день", "дня", "дней")} · ${m.better === "up" ? "чем больше, тем лучше" : "чем меньше, тем лучше"}</p></div>
        <button type="button" class="wg-ib" data-x aria-label="Закрыть">${ICO.x}</button></header>
      <div class="wg-form">
        <p class="vx-how">${esc(m.hint)}</p>
        <p class="wg-hint">Nexus пересчитывает метрики каждую ночь в 00:00 и хранит историю. Новые метрики добавляет
          Nexus — по запросу к администратору, без конструктора в интерфейсе.${m.since ? ` Данные этой метрики копятся с ${esc(dayLong(m.since))}.` : ""}</p>
        ${rows.length ? `<div class="vx-tbl-wrap"><table class="vx-tbl"><thead><tr><th>Снимок на конец дня</th><th>Значение</th></tr></thead>
          <tbody>${rows.map(([d, v]) => `<tr><td>${esc(dayLong(d))}</td><td>${esc(fmtValue(m, v))}${unitOf(m) ? NBSP + esc(unitOf(m)) : ""}</td></tr>`).join("")}</tbody></table></div>`
          : `<p class="wg-none">Снимков ещё нет — первый появится в 00:00.${m.live && m.value !== null ? ` Сейчас: ${esc(fmtValue(m, m.value))}${unitOf(m) ? NBSP + esc(unitOf(m)) : ""}.` : ""}</p>`}
      </div>`, "small");
    $w("[data-x]", wrap).focus();
  }

  /* ── встреча ─────────────────────────────────────────────── */
  function meetView(m) {
    const tasks = S.data.tasks.filter((t) => t.meeting_id === m.id);
    const done = m.points.filter((p) => p.mark === "done").length, later = m.points.filter((p) => p.mark === "later").length;
    // Хвосты: поручения прошлых встреч, ещё в работе, — пройтись по ним на этой.
    // Только у встречи, которая впереди: у прошедшей список был бы уже не тот.
    const tails = m.status !== "plan" ? [] : S.data.tasks.filter((t) => t.status === "work" && t.meeting_id !== m.id
      && (t.meeting_day < m.day || (t.meeting_day === m.day && t.meeting_no < m.no)));
    return `<div class="wg-meet">
      <div class="wg-facts">
        <label class="wg-fact" title="Дата">${ICO.cal}<input type="date" data-m="day" value="${esc(m.day)}" required></label>
        <label class="wg-fact" title="Время">${ICO.clock}<input type="time" data-m="time" value="${esc(m.time)}"></label>
        <label class="wg-fact grow" title="Место">${ICO.pin}<input data-m="place" value="${esc(m.place)}" maxlength="300"
          placeholder="Где: кабинет, адрес или ссылка на звонок"></label>
      </div>
      ${m.title ? `<p class="wg-old-t">${esc(m.title)}</p>` : ""}
      <div class="wg-cols">
        <div class="wg-main">
          <section class="wg-card"><header class="wg-card-h"><h4>Повестка</h4>${m.points.length ? `<i class="wg-n">${m.points.length}</i>` : ""}
            ${m.points.length ? `<span class="wg-hint">обсудили ${done} · отложили ${later}</span>` : ""}</header>
            ${m.points.length ? `<ol class="wg-agenda">${m.points.map(point).join("")}</ol>` : `<p class="wg-none">Вопросов пока нет.</p>`}
            <button type="button" class="wg-add" data-add-point>${ICO.plus}Вопрос</button></section>
          ${tails.length ? `<details class="wg-card wg-tails" open><summary class="wg-card-h"><h4>Хвосты прошлых встреч</h4>
              <i class="wg-n${tails.some((t) => t.late) ? " late" : ""}">${tails.length}</i>
              <span class="wg-hint">поручения в работе — проверить на этой встрече</span></summary>
            <div class="wg-tasks">${tails.map((t) => taskRow(t, true)).join("")}</div></details>` : ""}
          <section class="wg-card"><header class="wg-card-h"><h4>Поручения</h4>${tasks.length ? `<i class="wg-n">${tasks.length}</i>` : ""}</header>
            ${tasks.length ? `<div class="wg-tasks">${tasks.map((t) => taskRow(t)).join("")}</div>` : ""}
            <div class="wg-task wg-new"><span class="wg-new-ic">${ICO.plus}</span>
              <input data-new-task maxlength="1000" placeholder="${tasks.length ? "Ещё поручение" : "Поручение: что сделать"} — впишите и нажмите Enter"></div>
          </section>
        </div>
        <aside class="wg-side">${crewBlock(m)}${filesBlock(m)}</aside>
      </div></div>`;
  }
  function point(p, n) {
    // «Обсудили» и «Решили» — как в протоколе рабочей группы (22.10.2026):
    // решение — у вопроса, а кто и к какому сроку его выполняет — поручение.
    const note = p.note || p.decision || S.notes.has(p.id);
    return `<li class="wg-pt${p.mark ? " " + p.mark : ""}" data-p="${p.id}"><span class="wg-pt-n">${n + 1}</span>
      <div class="wg-pt-b"><div class="wg-pt-h">
        <input class="wg-pt-t" data-pf="title" value="${esc(p.title)}" placeholder="Вопрос повестки" maxlength="300">
        <span class="wg-seg sm" role="group" aria-label="Отметка">
          <button type="button" data-mark="done" class="${p.mark === "done" ? "on done" : ""}" aria-pressed="${p.mark === "done"}">${ICO.check}Обсудили</button>
          <button type="button" data-mark="later" class="${p.mark === "later" ? "on later" : ""}" aria-pressed="${p.mark === "later"}">${ICO.pause}Отложили</button></span>
        <button type="button" class="wg-ib${p.note || p.decision ? " has" : ""}" data-note title="Что обсудили и что решили"
          aria-label="Обсудили и решили">${ICO.note}</button>
        <button type="button" class="wg-ib" data-del-point title="Убрать вопрос" aria-label="Убрать вопрос">${ICO.x}</button></div>
        ${note ? `<div class="wg-pt-rec">
          <label class="wg-pt-l"><span>Обсудили</span><textarea class="wg-pt-note" data-pf="note" rows="1" maxlength="4000"
            placeholder="Что обсудили">${esc(p.note)}</textarea></label>
          <label class="wg-pt-l dec"><span>Решили</span><textarea class="wg-pt-note" data-pf="decision" rows="1" maxlength="4000"
            placeholder="Что решили; кто и к какому сроку — в «Поручениях»">${esc(p.decision)}</textarea></label></div>` : ""}</div></li>`;
  }
  // from — поручение другой встречи (хвост): подпись, откуда оно, ведёт к ней.
  function taskRow(t, from = false) {
    const who = person(t.who);
    return `<div class="wg-task ${t.status}${t.late ? " late" : ""}" data-t="${t.id}">
      ${from ? `<button type="button" class="wg-from" data-goto-meet="${t.meeting_id}">встреча № ${t.meeting_no} · ${esc(dayShort(t.meeting_day))}</button>` : ""}
      <input class="wg-t-text" data-tf="text" value="${esc(t.text)}" maxlength="1000" placeholder="Что сделать">
      <div class="wg-t-meta">
        <button type="button" class="wg-who${who || t.who ? "" : " none"}" data-who title="Ответственный">${who ? avatar(who, "xs") + `<span>${esc(who.name)}</span>`
          : t.who ? `<span>${esc(t.who_name || "учётка удалена")}</span>` : `${ICO.people}<span>Ответственный</span>`}</button>
        <label class="wg-due${t.late ? " late" : ""}" title="${t.late ? "Срок прошёл" : "Срок"}">${ICO.cal}<input type="date" data-tf="due" value="${esc(t.due)}"></label>
        <span class="wg-seg sm wg-tst" role="group" aria-label="Статус">${TASK_ST.map(([k, l]) => `<button type="button" data-ts="${k}"
          class="${t.status === k ? "on " + k : ""}" aria-pressed="${t.status === k}">${l}</button>`).join("")}</span>
        <span class="wg-t-iss">${t.issue ? issueTag(t.issue) : `<button type="button" class="wg-tag ghost" data-iss
          title="Завести правку в «Правках и ошибках» — дальше её ведут там">${ICO.arrow}В правки</button>`}</span>
        <button type="button" class="wg-ib" data-del-task title="Убрать поручение" aria-label="Убрать поручение">${ICO.x}</button>
      </div></div>`;
  }
  function crewBlock(m) {
    const ppl = m.people.map((id) => person(id) || { id, name: "Учётка удалена", job_title: "" });
    const came = new Set(m.came);
    return `<section class="wg-card"><header class="wg-card-h"><h4>Участники</h4>${ppl.length
        ? `<i class="wg-n" title="Были / приглашены">${came.size}/${ppl.length}</i>` : ""}
        <span class="tb-gap"></span><button type="button" class="wg-ib" data-add-person title="Участники встречи — из членов совета"
          aria-label="Изменить участников">${ICO.userPlus}</button></header>
      ${ppl.length ? `<ul class="wg-ppl">${ppl.map((p) => `<li class="${came.has(p.id) ? "on" : ""}">
          <button type="button" class="wg-came${came.has(p.id) ? " on" : ""}" data-came="${esc(p.id)}" aria-pressed="${came.has(p.id)}"
            title="${came.has(p.id) ? "Был(а) — снять отметку" : "Отметить: был(а) на встрече"}">${ICO.check}</button>
          ${avatar(p, "sm")}<span class="wg-ppl-t">${esc(p.name)}<small>${esc(p.job_title || "")}</small></span>
          <button type="button" class="wg-ib xs" data-rm-person="${esc(p.id)}" title="Убрать из участников" aria-label="Убрать">${ICO.x}</button></li>`).join("")}</ul>
        <p class="wg-hint">Галочка — был(а) на встрече.</p>`
        : `<p class="wg-none">Участников нет — добавьте из членов совета.</p>`}
      <label class="wg-guests-l"><span>Гости</span><input data-m="guests" value="${esc(m.guests || "")}" maxlength="600"
        placeholder="не из совета, через запятую"></label></section>`;
  }
  function filesBlock(m) {
    const fs = m.files, pics = fs.filter((f) => f.kind === "image"), docs = fs.filter((f) => f.kind !== "image");
    const ups = S.ups.get(m.id) || [];
    const mine = (f) => S.data.admin || f.author_id === me.id;
    const url = (f, view = false) => `/api/wg/files/${encodeURIComponent(f.id)}${view ? "/view" : ""}`;
    return `<section class="wg-card wg-files"><header class="wg-card-h"><h4>Материалы</h4>${fs.length ? `<i class="wg-n">${fs.length}</i>` : ""}
        <span class="tb-gap"></span><button type="button" class="wg-ib" data-add-file title="Приложить файлы: протокол, фото"
          aria-label="Приложить файлы">${ICO.clip}</button><input type="file" id="wgFile" multiple hidden></header>
      ${pics.length ? `<div class="wg-pics">${pics.map((f) => `<span class="wg-pic"><a href="${url(f, true)}" target="_blank" rel="noopener"
          title="${esc(f.name)} · ${esc(f.author)}"><img src="${url(f, true)}" alt="${esc(f.name)}" loading="lazy"></a>
          ${mine(f) ? `<button type="button" class="wg-pic-x" data-del-file="${f.id}" title="Убрать фото" aria-label="Убрать фото">${ICO.x}</button>` : ""}</span>`).join("")}</div>` : ""}
      ${docs.map((f) => `<div class="wg-doc"><a class="wg-doc-main" href="${url(f, true)}" target="_blank" rel="noopener" title="Открыть «${esc(f.name)}»">
          <span class="wg-doc-ic">${esc(extOf(f.name))}</span><span class="wg-doc-t"><b>${esc(f.name)}</b><small>${size(f.size)} · ${esc(f.author)}</small></span></a>
          <a class="wg-ib" href="${url(f)}" download="${esc(f.name)}" title="Скачать" aria-label="Скачать">${ICO.down}</a>
          ${mine(f) ? `<button type="button" class="wg-ib" data-del-file="${f.id}" title="Убрать файл" aria-label="Убрать файл">${ICO.x}</button>` : ""}</div>`).join("")}
      ${ups.map((u) => `<div class="wg-up${u.error ? " bad" : ""}" data-up="${u.key}"><span class="wg-doc-ic">${esc(extOf(u.name))}</span>
          <span class="wg-doc-t"><b>${esc(u.name)}</b><small>${u.error ? "Не загрузилось: " + esc(u.error)
            : `${u.size ? Math.min(100, Math.round(u.got * 100 / u.size)) : 0}% · ${size(u.size)}`}</small></span>
          ${u.error ? `<button type="button" class="wg-ib" data-unup="${u.key}" title="Убрать" aria-label="Убрать">${ICO.x}</button>` : ""}</div>`).join("")}
      <button type="button" class="wg-drop" data-add-file>${ICO.clip}<span>${fs.length ? "Приложить ещё" : "Протокол, фото, презентация — приложите или перетащите сюда"}</span></button>
    </section>`;
  }

  /* ── события ─────────────────────────────────────────────── */
  async function onClick(ev) {
    const t = ev.target;
    const hit = (sel) => t.closest(sel);
    let el;
    try {
      if (hit("[data-home]")) return open("");
      if ((el = hit("[data-meet]"))) return open(el.dataset.meet);
      if ((el = hit("[data-goto-meet]"))) return open(el.dataset.gotoMeet);
      if ((el = hit("[data-df]"))) {
        S.df = el.dataset.df;
        try { localStorage.setItem("wg-df", S.df); } catch (_) { /* не запомним */ }
        paintBody(); return;
      }
      if ((el = hit("[data-dec-done]"))) { await call("PATCH", "/tasks/" + el.dataset.decDone, { status: "done" }); paintBody(); return; }
      if ((el = hit("[data-idea]"))) return ideaToAgenda(el);
      if (hit("[data-new-meet]")) return scheduleForm();
      if (hit("[data-appeal]")) return appealForm();
      if (hit("[data-chat]")) { if (typeof MESSENGER === "object" && S.data.chat) MESSENGER.openChat(S.data.chat); return; }
      if ((el = hit("[data-crew]"))) return crewPop(el);
      if ((el = hit("[data-open-iss]"))) { if (typeof ISSUES === "object") ISSUES.open(Number(el.dataset.openIss)); return; }
      if ((el = hit("[data-metric]")) && !hit(".i-tip")) return metricInfo(el.dataset.metric);
      const m = S.view ? meeting(S.view) : null;
      if (!m) return;
      if (hit("[data-print]")) return printMeeting(m);
      if (hit("[data-held]")) {
        if (!(await ASK.confirm(`Отметить встречу № ${m.no} проведённой?\nNexus напишет в чат совета итог: кто был, что обсудили и отложили, сколько поручений.`))) return;
        await call("PATCH", "/meetings/" + m.id, { status: "held" }); paint(); return;
      }
      if (hit("[data-replan]")) { await call("PATCH", "/meetings/" + m.id, { status: "plan" }); paint(); return; }
      if (hit("[data-del-meet]")) {
        if (!(await ASK.confirm(`Удалить встречу № ${m.no}?\nПовестка, поручения и материалы уйдут вместе с ней.${m.status === "plan" ? " Nexus сообщит в чат совета, что встреча отменена." : ""}`))) return;
        await call("DELETE", "/meetings/" + m.id); open(""); return;
      }
      if ((el = hit("[data-add-person]"))) {
        return pickPeople(el, { multi: true, crewOnly: true, selected: m.people,
          onPick: async (ids) => { await call("PATCH", "/meetings/" + m.id, { people: ids }); paintBody(); paintHead(); } });
      }
      if ((el = hit("[data-rm-person]"))) { await call("PATCH", "/meetings/" + m.id, { people: m.people.filter((x) => x !== el.dataset.rmPerson) }); paintBody(); return; }
      if ((el = hit("[data-came]"))) {
        const id = el.dataset.came;
        await call("PATCH", "/meetings/" + m.id, { came: m.came.includes(id) ? m.came.filter((x) => x !== id) : m.came.concat(id) });
        paintBody(); return;
      }
      if (hit("[data-add-point]")) {
        const out = await call("POST", `/meetings/${m.id}/points`, { title: "" });
        paintBody();
        const inp = $w(`[data-p="${out.id}"] [data-pf="title"]`); if (inp) inp.focus();
        return;
      }
      const li = hit("[data-p]");
      if (li) {
        const p = m.points.find((x) => x.id === li.dataset.p);
        if (!p) return;
        if ((el = hit("[data-mark]"))) { await call("PATCH", "/points/" + p.id, { mark: p.mark === el.dataset.mark ? "" : el.dataset.mark }); paintBody(); return; }
        if (hit("[data-note]")) {
          if (p.note || p.decision || S.notes.has(p.id)) { if (!p.note && !p.decision) { S.notes.delete(p.id); paintBody(); } else { const ta = $w(`[data-p="${p.id}"] textarea`); if (ta) ta.focus(); } }
          else { S.notes.add(p.id); paintBody(); const ta = $w(`[data-p="${p.id}"] textarea`); if (ta) ta.focus(); }
          return;
        }
        if (hit("[data-del-point]")) {
          if ((p.title || p.note) && !(await ASK.confirm(`Убрать вопрос «${p.title || "без названия"}» из повестки?`))) return;
          await call("DELETE", "/points/" + p.id); paintBody(); return;
        }
        return;
      }
      const row = hit("[data-t]");
      if (row) {
        const task = S.data.tasks.find((x) => x.id === row.dataset.t);
        if (!task) return;
        if ((el = hit("[data-ts]"))) { if (el.dataset.ts !== task.status) { await call("PATCH", "/tasks/" + task.id, { status: el.dataset.ts }); paintBody(); } return; }
        if ((el = hit("[data-who]"))) {
          return pickPeople(el, { selected: task.who ? [task.who] : [], onPick: async (ids) => {
            await call("PATCH", "/tasks/" + task.id, { who: ids[0] || "" }); paintBody();
          } });
        }
        if (hit("[data-iss]")) {
          if (!(await ASK.confirm(`Завести правку по поручению?\n«${task.text}» уйдёт в «Правки и ошибки», здесь будет виден её номер и статус.`))) return;
          await call("POST", "/issue", { task_id: task.id }); paintBody(); return;
        }
        if (hit("[data-del-task]")) {
          if (!(await ASK.confirm(`Убрать поручение «${task.text}»?`))) return;
          await call("DELETE", "/tasks/" + task.id); paintBody(); return;
        }
        return;
      }
      if (hit("[data-add-file]")) { const f = $w("#wgFile"); if (f) f.click(); return; }
      if ((el = hit("[data-del-file]"))) {
        const f = m.files.find((x) => x.id === el.dataset.delFile);
        if (!f || !(await ASK.confirm(`Убрать «${f.name}» из материалов встречи?`))) return;
        await call("DELETE", "/files/" + f.id); paintBody(); return;
      }
      if ((el = hit("[data-unup]"))) {
        S.ups.set(m.id, (S.ups.get(m.id) || []).filter((u) => u.key !== el.dataset.unup)); paintBody();
      }
    } catch (_) { /* окно с ошибкой уже показали */ }
  }
  async function onChange(ev) {
    const t = ev.target, m = S.view ? meeting(S.view) : null;
    if (t.id === "wgFile") { if (m && t.files.length) upload(m.id, [...t.files]); t.value = ""; return; }
    if (!m) return;
    try {
      if (t.dataset.m) {
        if (t.dataset.m === "day" && !t.value) { t.value = m.day; return; }
        await call("PATCH", "/meetings/" + m.id, { [t.dataset.m]: t.value });
        paintHead(); return;
      }
      if (t.dataset.pf) {
        await call("PATCH", "/points/" + t.closest("[data-p]").dataset.p, { [t.dataset.pf]: t.value });
        return;
      }
      if (t.dataset.tf) {
        const id = t.closest("[data-t]").dataset.t;
        if (t.dataset.tf === "text" && !t.value.trim()) { t.value = (S.data.tasks.find((x) => x.id === id) || {}).text || ""; return; }
        await call("PATCH", "/tasks/" + id, { [t.dataset.tf]: t.value });
        if (t.dataset.tf === "due") paintBody();
      }
    } catch (_) {
      paintBody();                         // вернуть поля к сохранённому
    }
  }
  async function onKey(ev) {
    const t = ev.target;
    if ((ev.key === "Enter" || ev.key === " ") && t.matches("[data-metric]")) { ev.preventDefault(); metricInfo(t.dataset.metric); return; }
    if (ev.key === "Enter" && t.matches("[data-new-task]")) {
      ev.preventDefault();
      const text = t.value.trim();
      if (!text || !S.view) return;
      t.disabled = true;
      try {
        await call("POST", "/tasks", { meeting_id: S.view, text });
        paintBody();
        const again = $w("[data-new-task]"); if (again) again.focus();
      } catch (_) { t.disabled = false; }
      return;
    }
    if (ev.key === "Enter" && t.matches("input:not([type=date]):not([type=time])") && (t.dataset.m || t.dataset.pf || t.dataset.tf)) {
      ev.preventDefault();
      t.blur();
    }
  }

  /* ── материалы: загрузка кусками, как вложения мессенджера ─── */
  function upload(mid, files) {
    const list = S.ups.get(mid) || [];
    for (const file of files) {
      const u = { key: Math.random().toString(36).slice(2), name: file.name || "файл", size: file.size, got: 0, error: "", file };
      if (file.size > FILE_MAX) u.error = `больше ${FILE_MAX >> 20} МБ`;
      if (!file.size) u.error = "пустой файл";
      list.push(u);
    }
    S.ups.set(mid, list);
    if (S.view === mid) paintBody();
    pump(mid);
  }
  async function pump(mid) {
    const list = S.ups.get(mid) || [];
    if (list.some((u) => u.busy)) return;
    const u = list.find((x) => !x.error && !x.done);
    if (!u) return;
    u.busy = true;
    let fid = "", offset = 0;
    try {
      while (offset < u.size) {
        const out = await chunk(mid, u, fid, offset);
        fid = out.id; offset = out.got; u.got = offset;
        if (S.view === mid) paintBody();
        if (out.done) { u.done = true; if (out.state) S.data = out.state; break; }
      }
      S.ups.set(mid, (S.ups.get(mid) || []).filter((x) => x !== u));
      flash();
    } catch (err) { u.error = err.message; }
    u.busy = false;
    if (S.view === mid) paintBody();
    pump(mid);
  }
  function chunk(mid, u, fid, offset) {
    return new Promise((ok, fail) => {
      const x = new XMLHttpRequest();
      x.open("POST", "/api/wg/meetings/" + encodeURIComponent(mid) + "/files");
      x.setRequestHeader("Authorization", "Bearer " + AUTH.token());
      x.setRequestHeader("X-File-Size", String(u.size));
      x.setRequestHeader("X-File-Offset", String(offset));
      x.setRequestHeader("Content-Type", u.file.type || "application/octet-stream");
      if (fid) x.setRequestHeader("X-File-Id", fid);
      else x.setRequestHeader("X-File-Name", encodeURIComponent(u.name));
      x.upload.onprogress = (ev) => {
        if (!ev.lengthComputable) return;
        u.got = offset + ev.loaded;
        const small = S.view === mid && $w(`[data-up="${u.key}"] small`);
        if (small) small.textContent = `${Math.min(100, Math.round(u.got * 100 / u.size))}% · ${size(u.size)}`;
      };
      x.onload = () => {
        let d = null;
        try { d = JSON.parse(x.responseText); } catch (_) { /* не наш ответ */ }
        if (x.status === 200 && d) ok(d);
        else fail(new Error((d && d.error) || (x.status === 413 ? "больше, чем принимает сервер" : "ошибка " + x.status)));
      };
      x.onerror = () => fail(new Error("нет связи с сервером"));
      x.send(u.file.slice(offset, offset + CHUNK));
    });
  }

  /* ── окна ────────────────────────────────────────────────── */
  function dialog(html, cls = "") {
    const wrap = document.createElement("div");
    wrap.className = "wg-wrap";
    wrap.innerHTML = `<div class="wg-dlg ${cls}" role="dialog" aria-modal="true">${html}</div>`;
    document.body.appendChild(wrap);
    const close = () => { wrap.remove(); document.removeEventListener("keydown", key, true); };
    const key = (ev) => { if (ev.key === "Escape" && !document.querySelector(".dlg-wrap, .wg-pop")) { ev.stopPropagation(); close(); } };
    document.addEventListener("keydown", key, true);
    wrap.addEventListener("click", (ev) => { if (ev.target === wrap || ev.target.closest("[data-x]")) close(); });
    return { wrap, close };
  }
  // Следующая встреча — через неделю после последней (совет собирается
  // по одному дню недели), но не раньше завтра; время и место — как тогда.
  function nextDefaults() {
    const last = meetings().slice().sort((a, b) => (b.day + b.time).localeCompare(a.day + a.time))[0];
    const today = asDate(S.data.today);
    let d = new Date(today.getTime() + 864e5);
    if (last) {
      const ld = asDate(last.day);
      while (ld < d || ld <= today) ld.setDate(ld.getDate() + 7);
      d = ld;
    }
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    return { day: iso, time: (last && last.time) || "10:00", place: (last && last.place) || "" };
  }
  function scheduleForm() {
    const crew = people().filter((p) => p.member);
    const chosen = new Set(crew.map((p) => p.id));
    const def = nextDefaults();
    const qRow = (v = "") => `<li><input maxlength="300" value="${esc(v)}" placeholder="Вопрос повестки"><button type="button" class="wg-ib xs" data-rm-q
      title="Убрать вопрос" aria-label="Убрать вопрос">${ICO.x}</button></li>`;
    const { wrap, close } = dialog(`<header class="wg-dh"><span class="wg-dh-ic">${ICO.cal}</span><div><h3>Назначить встречу</h3>
        <p>Карточка появится на главной, Nexus сообщит в чат «Вектор»</p></div>
        <button type="button" class="wg-ib" data-x aria-label="Закрыть">${ICO.x}</button></header>
      <div class="wg-form">
        <div class="wg-row2"><label class="wg-fld"><span>Дата</span><input type="date" id="wsDay" value="${def.day}" required></label>
          <label class="wg-fld"><span>Время</span><input type="time" id="wsTime" value="${esc(def.time)}"></label></div>
        <label class="wg-fld"><span>Место</span><input id="wsPlace" maxlength="300" value="${esc(def.place)}" placeholder="Кабинет, адрес или ссылка на звонок"></label>
        <div class="wg-fld"><span>Участники <em>из членов совета</em></span><div class="wg-pick" id="wsPeople">${crew.map((p) => `<button type="button"
          class="wg-pchip on" data-pp="${esc(p.id)}" aria-pressed="true">${avatar(p, "xs")}<span>${esc(p.name)}</span>${ICO.check}</button>`).join("")
          || '<p class="wg-none">В совете пока никого — откройте раздел людям в «Пользователи → Доступ».</p>'}</div></div>
        <div class="wg-fld"><span>Повестка <em>вопросы встречи; Enter — следующий</em></span><ol class="wg-ag-edit" id="wsAgenda">${qRow()}</ol>
          <button type="button" class="wg-add sm" data-add-q>${ICO.plus}Вопрос</button></div>
        <p class="wg-err" id="wsErr" hidden></p>
      </div>
      <footer class="wg-df"><span></span><button type="button" class="btn-ghost" data-x>Отмена</button>
        <button type="button" class="btn-brand" id="wsSave">${ICO.check}Назначить</button></footer>`, "wide");
    const agenda = $w("#wsAgenda", wrap);
    const addQ = (focus = true) => { agenda.insertAdjacentHTML("beforeend", qRow()); if (focus) agenda.lastElementChild.querySelector("input").focus(); };
    wrap.addEventListener("click", (ev) => {
      const pc = ev.target.closest("[data-pp]");
      if (pc) { const id = pc.dataset.pp; chosen.has(id) ? chosen.delete(id) : chosen.add(id); pc.classList.toggle("on", chosen.has(id)); pc.setAttribute("aria-pressed", String(chosen.has(id))); return; }
      if (ev.target.closest("[data-add-q]")) { addQ(); return; }
      const rm = ev.target.closest("[data-rm-q]");
      if (rm) { if (agenda.children.length > 1) rm.closest("li").remove(); else rm.closest("li").querySelector("input").value = ""; }
    });
    agenda.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter" && ev.target.matches("input")) {
        ev.preventDefault();
        const li = ev.target.closest("li");
        if (li.nextElementSibling) li.nextElementSibling.querySelector("input").focus(); else if (ev.target.value.trim()) addQ();
      }
    });
    $w("#wsDay", wrap).focus();
    $w("#wsSave", wrap).addEventListener("click", async (ev) => {
      const err = $w("#wsErr", wrap), btn = ev.currentTarget;
      const day = $w("#wsDay", wrap).value;
      if (!day) { err.textContent = "Выберите дату встречи."; err.hidden = false; return; }
      btn.disabled = true;
      try {
        const out = await call("POST", "/meetings", { day, time: $w("#wsTime", wrap).value, place: $w("#wsPlace", wrap).value,
          people: crew.filter((p) => chosen.has(p.id)).map((p) => p.id),
          agenda: [...agenda.querySelectorAll("input")].map((i) => i.value.trim()).filter(Boolean) });
        close();
        open(out.id);
      } catch (_) { btn.disabled = false; }
    });
  }
  function appealForm() {
    const { wrap, close } = dialog(`<header class="wg-dh"><span class="wg-dh-ic">${ICO.send}</span><div><h3>Обращение в комитет</h3>
        <p>Совет Вектор — о том, что улучшить в платформе</p></div>
        <button type="button" class="wg-ib" data-x aria-label="Закрыть">${ICO.x}</button></header>
      <div class="wg-form">
        <label class="wg-fld"><span>Идея или проблема</span><textarea id="waText" rows="6" maxlength="2000"
          placeholder="Что мешает в работе или что хотелось бы добавить — и где это в платформе"></textarea></label>
        <p class="wg-hint">Nexus передаст обращение совету, ответ придёт вам в мессенджер.</p>
        <p class="wg-err" id="waErr" hidden></p>
      </div>
      <footer class="wg-df"><span></span><button type="button" class="btn-ghost" data-x>Отмена</button>
        <button type="button" class="btn-brand" id="waSend">${ICO.send}Отправить</button></footer>`, "small");
    $w("#waText", wrap).focus();
    $w("#waSend", wrap).addEventListener("click", async (ev) => {
      const text = $w("#waText", wrap).value.trim(), err = $w("#waErr", wrap), btn = ev.currentTarget;
      if (text.length < 5) { err.textContent = "Опишите обращение — хотя бы одной фразой."; err.hidden = false; return; }
      btn.disabled = true;
      try {
        await AUTH.api("POST", "/wg/appeals", { text });
        close();
        ASK.alert("Обращение отправлено совету Вектор. Ответ придёт вам в мессенджер.", { title: "Отправлено" });
      } catch (e) { err.textContent = e.message; err.hidden = false; btn.disabled = false; }
    });
  }

  /* ── выбор людей ─────────────────────────────────────────── */
  function popAt(anchor, html, cls = "") {
    document.querySelectorAll(".wg-pop").forEach((x) => x.remove());
    const pop = document.createElement("div");
    pop.className = "wg-pop " + cls;
    pop.innerHTML = html;
    document.body.appendChild(pop);
    const b = anchor.getBoundingClientRect();
    const h = pop.offsetHeight, below = innerHeight - b.bottom - 8;
    pop.style.top = Math.round(below >= h || below > b.top ? b.bottom + 6 : Math.max(8, b.top - h - 6)) + "px";
    pop.style.left = Math.round(Math.max(8, Math.min(b.left, innerWidth - pop.offsetWidth - 8))) + "px";
    const off = (ev) => {
      if (!pop.contains(ev.target) && !anchor.contains(ev.target)) { pop.remove(); document.removeEventListener("pointerdown", off, true); }
    };
    document.addEventListener("pointerdown", off, true);
    pop.addEventListener("keydown", (ev) => { if (ev.key === "Escape") { pop.remove(); anchor.focus && anchor.focus(); } });
    return pop;
  }
  // Участники — только члены совета; ответственный — любой сотрудник,
  // члены совета сверху.
  function pickPeople(anchor, { multi = false, crewOnly = false, selected = [], onPick }) {
    let chosen = selected.slice();
    const row = (p) => `<button type="button" class="wg-pp${chosen.includes(p.id) ? " on" : ""}" data-pp="${esc(p.id)}">${avatar(p, "sm")}
      <span>${esc(p.name)}<small>${esc(p.job_title || "")}</small></span>${multi ? `<i>${ICO.check}</i>` : ""}</button>`;
    const pop = popAt(anchor, `<input class="wg-pp-q" placeholder="Найти сотрудника…" autocomplete="off"><div class="wg-pp-list"></div>
      ${multi ? `<footer><span>Изменения сохраняются сразу</span></footer>` : ""}`, "wg-pick-pop");
    const listEl = $w(".wg-pp-list", pop), q = $w(".wg-pp-q", pop);
    const draw = () => {
      const s = q.value.trim().toLocaleLowerCase("ru");
      const ppl = people().filter((p) => (!crewOnly || p.member) && (!s || (p.name + " " + p.job_title).toLocaleLowerCase("ru").includes(s)));
      const crew = ppl.filter((p) => p.member), rest = ppl.filter((p) => !p.member);
      listEl.innerHTML = (!multi && chosen.length ? `<button type="button" class="wg-pp none" data-pp="">${ICO.x}<span>Снять ответственного</span></button>` : "")
        + (crew.length ? `<h6>Члены совета</h6>${crew.map(row).join("")}` : "")
        + (rest.length ? `<h6>Другие сотрудники</h6>${rest.map(row).join("")}` : "")
        + (ppl.length ? "" : `<p class="wg-pp-empty">Никого не нашлось</p>`);
    };
    draw();
    q.addEventListener("input", draw);
    q.focus();
    listEl.addEventListener("click", async (ev) => {
      const b = ev.target.closest("[data-pp]");
      if (!b) return;
      const id = b.dataset.pp;
      if (!multi) { pop.remove(); await onPick(id ? [id] : []); return; }
      chosen = chosen.includes(id) ? chosen.filter((x) => x !== id) : chosen.concat(id);
      b.classList.toggle("on", chosen.includes(id));
      try { await onPick(chosen); } catch (_) { /* окно с ошибкой уже показали */ }
    });
  }
  function crewPop(anchor) {
    const crew = people().filter((p) => p.member);
    popAt(anchor, `<b class="wg-pop-h">Члены совета · ${crew.length}</b>
      <div class="wg-pp-list">${crew.map((p) => `<div class="wg-pp static">${avatar(p, "sm")}<span>${esc(p.name)}<small>${esc(p.job_title || "")}</small></span></div>`).join("")}</div>
      <p class="wg-pop-f">Член совета — тот, кому открыт раздел «Вектор»: Пользователи → Доступ. Они же — в чате совета.</p>`, "wg-crew-pop");
  }

  /* ── протокол на печать ─────────────────────────────────────
     Протокол — документ: его подписывают, пересылают, кладут в папку.
     Печатаем из невидимой рамки — в окне печати браузера есть
     «Сохранить как PDF». */
  function printMeeting(m) {
    const tasks = S.data.tasks.filter((t) => t.meeting_id === m.id);
    const came = new Set(m.came);
    const ppl = m.people.map((id) => ({ id, name: (person(id) || {}).name || "" })).filter((p) => p.name);
    const st = Object.fromEntries(TASK_ST);
    const html = `<!doctype html><html lang="ru"><head><meta charset="utf-8"><title>Протокол № ${m.no} от ${esc(dayNum(m.day))}</title>
      <style>
        @page { size: A4; margin: 18mm 16mm; }
        body { font: 11.5pt/1.45 "Onest", "Segoe UI", Arial, sans-serif; color: #111; margin: 0; }
        h1 { font-size: 15pt; margin: 0 0 2mm; text-align: center; }
        .sub { text-align: center; color: #444; margin: 0 0 6mm; }
        dl { display: grid; grid-template-columns: 34mm 1fr; gap: 1.5mm 4mm; margin: 0 0 6mm; }
        dt { color: #555; } dd { margin: 0; }
        h2 { font-size: 12pt; margin: 6mm 0 2mm; border-bottom: 1px solid #999; padding-bottom: 1mm; }
        ol { margin: 0; padding-left: 6mm; } li { margin: 0 0 2mm; break-inside: avoid; }
        li span { color: #555; } li p { margin: 1mm 0 0; white-space: pre-wrap; color: #333; }
        table { width: 100%; border-collapse: collapse; font-size: 10.5pt; }
        th, td { border: 1px solid #999; padding: 1.5mm 2mm; text-align: left; vertical-align: top; }
        th { background: #f1f1f1; }
        .sign { margin-top: 12mm; display: grid; grid-template-columns: 1fr 1fr; gap: 10mm; }
        .sign div { border-top: 1px solid #333; padding-top: 1mm; color: #555; font-size: 9.5pt; }
        .plan { color: #b00; text-align: center; margin-bottom: 4mm; }
      </style></head><body>
      ${m.status === "held" ? "" : '<p class="plan">Встреча ещё не отмечена проведённой</p>'}
      <h1>Протокол № ${m.no}</h1>
      <p class="sub">встречи совета разработки платформы «Вектор»</p>
      <dl><dt>Дата</dt><dd>${esc(dayNum(m.day))}${m.time ? ", " + esc(m.time) : ""}</dd>
        ${m.place ? `<dt>Место</dt><dd>${esc(m.place)}</dd>` : ""}
        <dt>Присутствовали</dt><dd>${esc(ppl.filter((p) => came.has(p.id)).map((p) => p.name).join(", ") || "—")}</dd>
        ${ppl.some((p) => !came.has(p.id)) ? `<dt>Отсутствовали</dt><dd>${esc(ppl.filter((p) => !came.has(p.id)).map((p) => p.name).join(", "))}</dd>` : ""}
        ${m.guests ? `<dt>Гости</dt><dd>${esc(m.guests)}</dd>` : ""}</dl>
      <h2>Повестка</h2>
      ${m.points.length ? `<ol>${m.points.map((p) => `<li>${esc(p.title || "Без названия")} <span>— ${p.mark === "done" ? "обсудили" : p.mark === "later" ? "отложили" : "без отметки"}</span>
        ${p.note ? `<p>Обсудили: ${esc(p.note)}</p>` : ""}${p.decision ? `<p>Решили: ${esc(p.decision)}</p>` : ""}</li>`).join("")}</ol>` : "<p>—</p>"}
      <h2>Поручения</h2>
      ${tasks.length ? `<table><thead><tr><th style="width:8mm">№</th><th>Поручение</th><th style="width:40mm">Ответственный</th><th style="width:22mm">Срок</th><th style="width:24mm">Статус</th></tr></thead>
        <tbody>${tasks.map((t, n) => `<tr><td>${n + 1}</td><td>${esc(t.text)}</td><td>${esc(t.who_name || "—")}</td><td>${esc(t.due ? dayNum(t.due) : "—")}</td>
          <td>${esc(st[t.status] || "")}</td></tr>`).join("")}</tbody></table>` : "<p>—</p>"}
      ${m.files.length ? `<h2>Материалы</h2><p>${esc(m.files.map((f) => f.name).join("; "))}</p>` : ""}
      <div class="sign"><div>Председатель</div><div>Секретарь</div></div>
      </body></html>`;
    const fr = document.createElement("iframe");
    fr.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden";
    document.body.appendChild(fr);
    const d = fr.contentWindow.document;
    d.open(); d.write(html); d.close();
    setTimeout(() => {
      fr.contentWindow.focus();
      fr.contentWindow.print();
      setTimeout(() => fr.remove(), 60000);
    }, 250);
  }

  /* ── счётчик у пункта меню: мои поручения в работе ─────────── */
  async function badge() {
    clearTimeout(badgeTimer);
    if (!me || me.must_change_pw) return;
    try {
      const out = await AUTH.api("GET", "/wg/badge");
      const el = $w("#wgBadge");
      if (el) {
        el.hidden = !out.tasks;
        el.textContent = out.tasks > 99 ? "99+" : String(out.tasks);
        el.classList.toggle("late", !!out.late);
        el.title = `Ваши поручения совета в работе: ${out.tasks}${out.late ? `, просрочено: ${out.late}` : ""}`;
      }
    } catch (_) { /* повторим позже */ }
    badgeTimer = setTimeout(badge, document.hidden ? 600000 : 180000);
  }
  function init(user) {
    if (me || !user) return;
    me = user;
    if (!AUTH.can(user, "wg")) return;          // счётчик — только членам совета
    badge();
    document.addEventListener("visibilitychange", () => { if (!document.hidden) badge(); });
  }
  function show() {
    if (!me && typeof AUTH === "object") me = AUTH.current();
    frame();
    if (!S.loading) load();
  }
  return { init, show };
})();
