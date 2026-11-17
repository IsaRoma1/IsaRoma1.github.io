/* Раздел «Задачи» (правка № 6, 21.10.2026).

   Заказчик: «отдельный модуль „Задачи“, тесно связанный с мессенджером.
   Вкладки по роли: „Я делаю“ (исполнитель), „Я поручил“ (автор), „Я
   наблюдаю“; внутри — по срокам: „Просрочено“, „На сегодня“, „На неделе“,
   „Без срока“. Два вида: таблица-список и канбан „Новая → В работе →
   Выполнена“ с перетаскиванием карточек. Карточка задачи: название и
   описание правятся на месте, срок — дата и время, чек-лист с отметками,
   своя ветка обсуждения; поставленная из чата — кнопка „Перейти к
   сообщению в чате“. Выполненные — в архиве, оттуда — обратно в работу».

   Сервер — tasks_* и task_* в api.py, сроки и разбор «/todo» — tasks.py.
   Окно постановки (openCreate) зовёт и мессенджер: из сообщения и строкой
   «/todo». Классы — tsk-. */
"use strict";

const TASKS = (() => {
  const $t = (s, r) => (r || document).querySelector(s);
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const svg = (d) => `<svg viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
  const ICO = {
    plus: svg('<path d="M12 5v14M5 12h14"/>'),
    find: svg('<circle cx="11" cy="11" r="6.5"/><path d="M20.5 20.5 16 16"/>'),
    x: svg('<path d="M6 6l12 12M18 6 6 18"/>'),
    list: svg('<path d="M8.5 6.5h11M8.5 12h11M8.5 17.5h11"/><path d="M4.5 6.5h.01M4.5 12h.01M4.5 17.5h.01"/>'),
    board: svg('<rect x="3.5" y="4.5" width="5" height="15" rx="1.5"/><rect x="9.5" y="4.5" width="5" height="10" rx="1.5"/><rect x="15.5" y="4.5" width="5" height="12" rx="1.5"/>'),
    box: svg('<path d="M3.5 7.5h17v3h-17zM5 10.5v8a1.5 1.5 0 0 0 1.5 1.5h11a1.5 1.5 0 0 0 1.5-1.5v-8"/><path d="M10 14h4"/>'),
    chat: svg('<path d="M20 11.5a8 8 0 0 1-8 8H5l-3 2v-10a9 9 0 0 1 18 0Z"/>'),
    check: svg('<path d="m5.5 12.5 4 4 9-9"/>'),
    clock: svg('<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>'),
    trash: svg('<path d="M4.5 6.5h15M9.5 6.5V4.8A1.3 1.3 0 0 1 10.8 3.5h2.4a1.3 1.3 0 0 1 1.3 1.3v1.7M6.5 6.5l.9 12.2A1.5 1.5 0 0 0 8.9 20h6.2a1.5 1.5 0 0 0 1.5-1.3l.9-12.2"/>'),
    go: svg('<path d="M5 12h13M13 6.5l5.5 5.5-5.5 5.5"/>'),
    back: svg('<path d="m14 6-6 6 6 6"/>'),
  };
  const TAB_KEY = "karkas.tsk.tab.v1", MODE_KEY = "karkas.tsk.mode.v1";
  const mem = (k, v) => {
    try {
      if (v === undefined) return localStorage.getItem(k) || "";
      localStorage.setItem(k, v);
    } catch (e) { /* без памяти */ }
    return "";
  };
  const TABS = [["do", "Я делаю"], ["mine", "Я поручил"], ["watch", "Я наблюдаю"]];
  const COLS = [["new", "Новая"], ["work", "В работе"], ["done", "Выполнена"]];
  let tab = mem(TAB_KEY) || "do";
  let mode = mem(MODE_KEY) || "list";
  let archive = false, Q = "";
  let L = null;                 // ответ /tasks
  let host = null, me = null;
  let people = null;            // сотрудники для выбора
  let openNo = 0;               // открытая карточка
  let badgeTimer = 0;

  const plural = (n, one, few, many) => {
    const a = Math.abs(n) % 100, b = a % 10;
    if (a > 10 && a < 20) return many;
    if (b > 1 && b < 5) return few;
    return b === 1 ? one : many;
  };
  const stamp = (at) => (at ? new Date(at).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit",
    hour: "2-digit", minute: "2-digit" }) : "");
  const initials = (s) => String(s || "").trim().split(/\s+/).slice(0, 2).map((w) => w[0] || "").join("").toUpperCase();

  async function loadPeople() {
    if (people) return people;
    const got = await AUTH.api("GET", "/messenger/people");
    const u = AUTH.current() || {};
    people = [{ id: u.id, name: (u.username || u.name || "Я") }].concat(got.rows.map((p) => ({ id: p.id, name: p.name,
      job: p.job_title || "" })));
    return people;
  }

  /* ── раздел ─────────────────────────────────────────────── */
  async function show() {
    host = document.getElementById("sec-tsk");
    if (!host) return;
    if (!L) host.innerHTML = `<div class="pg"><div class="pg-body"><div class="pg-empty"><b>Загружаю задачи…</b></div></div></div>`;
    await load();
  }

  async function load() {
    try {
      L = await AUTH.api("GET", `/tasks?tab=${tab}${archive ? "&archive=1" : ""}`);
    } catch (e) {
      if (host) host.innerHTML = `<div class="pg"><div class="pg-note bad">${esc(e.message)}</div></div>`;
      return;
    }
    render();
  }

  function shown() {
    const q = Q.trim().toLowerCase();
    return L.rows.filter((r) => !q || ["#" + r.no, r.title, r.descr, r.author.name,
      ...r.do.map((p) => p.name)].some((x) => String(x || "").toLowerCase().includes(q)));
  }

  function render() {
    if (!host || !L) return;
    host.innerHTML = `
      <div class="pg tsk-pg">
        <div class="pg-head tsk-head">
          <div class="seg tsk-tabs" role="tablist">${TABS.map(([k, t]) => `<button type="button" class="seg-b${
            k === tab ? " on" : ""}" data-tab="${k}" role="tab" aria-selected="${k === tab}">${t}${
            L.counts[k] ? ` <i>${L.counts[k]}</i>` : ""}</button>`).join("")}</div>
          ${archive ? "" : `<div class="seg tsk-modes" aria-label="Вид">${[["list", "Список", ICO.list], ["board", "Доска", ICO.board]]
            .map(([k, t, i]) => `<button type="button" class="seg-b${k === mode ? " on" : ""}" data-mode="${k}" title="${t}">${i}<span>${t}</span></button>`).join("")}</div>`}
          <label class="pg-find">${ICO.find}<input id="tskQ" type="search" placeholder="Задача, № или человек"
            value="${esc(Q)}" autocomplete="off"></label>
          <span class="grow"></span>
          <button type="button" class="btn-ghost sm${archive ? " on" : ""}" id="tskArch" title="${archive
            ? "Вернуться к задачам в работе" : "Выполненные задачи: открыть, вернуть в работу"}">${archive ? ICO.back : ICO.box}${
            archive ? "К задачам" : "Архив"}</button>
          <button type="button" class="btn-brand sm" id="tskNew">${ICO.plus}Задача</button>
        </div>
        <div class="pg-body tsk-body" id="tskBody"></div>
      </div>`;
    paint();
    host.querySelectorAll("[data-tab]").forEach((b) => b.addEventListener("click", () => {
      tab = b.dataset.tab; mem(TAB_KEY, tab); load();
    }));
    host.querySelectorAll("[data-mode]").forEach((b) => b.addEventListener("click", () => {
      mode = b.dataset.mode; mem(MODE_KEY, mode); render();
    }));
    $t("#tskQ", host).addEventListener("input", (e) => { Q = e.target.value; paint(); });
    $t("#tskArch", host).addEventListener("click", () => { archive = !archive; load(); });
    $t("#tskNew", host).addEventListener("click", () => openCreate({}));
  }

  function whoCell(r) {
    // «Я делаю» — кто поручил; «Я поручил» и «Я наблюдаю» — кто делает.
    const list = tab === "do" ? [r.author] : r.do;
    return list.map((p) => esc(p.name)).join(", ");
  }

  function dueChip(r) {
    if (!r.due) return '<span class="tsk-due none">без срока</span>';
    const cls = r.status === "done" ? "done" : r.bucket;
    return `<span class="tsk-due ${cls}" title="${esc(r.due.replace("T", " "))}">${ICO.clock}${esc(r.due_text)}</span>`;
  }

  function marks(r) {
    return `${r.checks.total ? `<span class="tsk-mark${r.checks.done === r.checks.total ? " ok" : ""}" title="Чек-лист">${ICO.check}${
      r.checks.done}/${r.checks.total}</span>` : ""}${r.comments ? `<span class="tsk-mark" title="Сообщений в обсуждении">${
      ICO.chat}${r.comments}</span>` : ""}`;
  }

  function paint() {
    const body = $t("#tskBody", host);
    if (!body) return;
    const rows = shown();
    if (archive) { paintArchive(body, rows); return; }
    if (mode === "board") { paintBoard(body, rows); return; }
    const active = rows.filter((r) => r.status !== "done");
    if (!active.length) {
      body.innerHTML = `<div class="pg-empty"><b>${L.rows.length ? "Ничего не нашлось" : tab === "do"
        ? "Задач нет — можно выдохнуть" : tab === "mine" ? "Вы пока никому ничего не поручили" : "Вы ни за чем не наблюдаете"}</b>
        ${L.rows.length ? "Поищите иначе." : "Задачу ставят кнопкой «Задача», из сообщения чата (правая кнопка → «Поставить задачу»)"
          + " или строкой «/todo @имя что сделать до пятницы» в чате."}</div>`;
      return;
    }
    body.innerHTML = L.buckets.map((b) => {
      const list = active.filter((r) => r.bucket === b.key)
        .sort((x, y) => (x.due || "9").localeCompare(y.due || "9") || y.no - x.no);
      if (!list.length) return "";
      return `<section class="tsk-grp ${b.key}"><h3>${esc(b.name)}<i>${list.length}</i></h3>
        <table class="tbl tsk-tbl"><colgroup><col style="width:64px"><col><col style="width:110px"><col style="width:22%"><col style="width:150px"></colgroup>
        <tbody>${list.map((r) => `<tr data-no="${r.no}" class="${r.status}">
          <td class="tsk-no">#${r.no}</td>
          <td class="tsk-tt"><b title="${esc(r.title)}">${esc(r.title)}</b>${marks(r)}${r.src ? `<span class="tsk-mark" title="Из переписки">${ICO.chat}</span>` : ""}</td>
          <td><span class="tsk-st ${r.status}">${esc(r.status_name)}</span></td>
          <td class="tsk-who" title="${tab === "do" ? "Поставил(а)" : "Исполнители"}">${whoCell(r)}</td>
          <td>${dueChip(r)}</td></tr>`).join("")}</tbody></table></section>`;
    }).join("");
    body.querySelectorAll("tr[data-no]").forEach((tr) => tr.addEventListener("click", () => openCard(Number(tr.dataset.no))));
  }

  function paintBoard(body, rows) {
    body.innerHTML = `<div class="tsk-board">${COLS.map(([k, t]) => {
      const list = rows.filter((r) => r.status === k).sort((x, y) => (x.due || "9").localeCompare(y.due || "9"));
      return `<section class="tsk-col" data-col="${k}"><h3>${t}<i>${list.length}</i>${k === "done"
        ? '<span class="tsk-col-h">за неделю</span>' : ""}</h3>
        <div class="tsk-cards">${list.map((r) => `<article class="tsk-cardlet ${r.bucket}" data-no="${r.no}" draggable="${r.can.status}">
          <div class="tsk-cl-t"><span class="tsk-no">#${r.no}</span><b>${esc(r.title)}</b></div>
          <div class="tsk-cl-m">${dueChip(r)}${marks(r)}<span class="grow"></span>${r.do.slice(0, 3).map((p) => `<span class="tsk-av" title="${esc(p.name)}">${
            esc(initials(p.name))}</span>`).join("")}</div></article>`).join("") || '<div class="tsk-col-empty">Пусто</div>'}</div></section>`;
    }).join("")}</div>`;
    body.querySelectorAll(".tsk-cardlet").forEach((el) => {
      el.addEventListener("click", () => openCard(Number(el.dataset.no)));
      el.addEventListener("dragstart", (e) => { e.dataTransfer.setData("text/plain", el.dataset.no); el.classList.add("drag"); });
      el.addEventListener("dragend", () => el.classList.remove("drag"));
    });
    body.querySelectorAll(".tsk-col").forEach((col) => {
      col.addEventListener("dragover", (e) => { e.preventDefault(); col.classList.add("over"); });
      col.addEventListener("dragleave", () => col.classList.remove("over"));
      col.addEventListener("drop", async (e) => {
        e.preventDefault();
        col.classList.remove("over");
        const no = Number(e.dataTransfer.getData("text/plain"));
        const r = L.rows.find((x) => x.no === no);
        if (!r || r.status === col.dataset.col) return;
        await setStatus(no, col.dataset.col);
      });
    });
  }

  function paintArchive(body, rows) {
    const done = rows.filter((r) => r.status === "done").sort((x, y) => String(y.done_at).localeCompare(String(x.done_at)));
    body.innerHTML = done.length ? `<p class="tsk-hint">Выполненные задачи. Откройте — посмотреть чек-лист и обсуждение;
      «В работу» — вернуть задачу на доску.</p><table class="tbl tsk-tbl"><colgroup><col style="width:64px"><col>
      <col style="width:22%"><col style="width:150px"><col style="width:120px"></colgroup><tbody>${done.map((r) => `<tr data-no="${r.no}">
        <td class="tsk-no">#${r.no}</td><td class="tsk-tt"><b>${esc(r.title)}</b>${marks(r)}</td>
        <td class="tsk-who">${whoCell(r)}</td><td class="tsk-at">выполнена ${esc(stamp(r.done_at))}</td>
        <td class="acts">${r.can.status ? `<button type="button" class="btn-ghost sm" data-back="${r.no}">В работу</button>` : ""}</td>
      </tr>`).join("")}</tbody></table>` : `<div class="pg-empty"><b>Архив пуст</b>Выполненные задачи появятся здесь.</div>`;
    body.querySelectorAll("tr[data-no]").forEach((tr) => tr.addEventListener("click", (e) => {
      const b = e.target.closest("[data-back]");
      if (b) { e.stopPropagation(); setStatus(Number(b.dataset.back), "work"); return; }
      openCard(Number(tr.dataset.no));
    }));
  }

  async function setStatus(no, status) {
    try {
      await AUTH.api("PATCH", "/tasks/" + no, { status });
      await load();
      badge();
    } catch (e) {
      ASK.alert(e.message, { title: "Не вышло" });
    }
  }

  /* ── карточка задачи ─────────────────────────────────────── */
  let T = null;                 // открытая задача целиком

  async function openCard(no) {
    openNo = no;
    try {
      T = (await AUTH.api("GET", "/tasks/" + no)).task;
    } catch (e) {
      ASK.alert(e.message, { title: "Задача" });
      return;
    }
    await loadPeople().catch(() => []);
    paintCard();
  }

  function chips(list, role) {
    const ed = T.can.edit;
    return `<div class="tsk-chips">${list.map((p) => `<span class="tsk-chip">${esc(p.name)}${ed && (role !== "do" || list.length > 1)
      ? `<button type="button" data-unpick="${role}" data-id="${esc(p.id)}" title="Убрать" aria-label="Убрать">${ICO.x}</button>` : ""}</span>`).join("")}${
      ed ? `<button type="button" class="tsk-add" data-pick="${role}">${ICO.plus}добавить</button>` : ""}${
      !list.length && !ed ? '<span class="tsk-none">—</span>' : ""}</div>`;
  }

  /* Выбор сотрудника — своё окошко с поиском: родной <select> платформа
     одевает (dressSelect), и список оставался бы в документе после каждой
     перерисовки карточки. */
  function pickPerson(anchor, exclude, onPick) {
    document.querySelector(".tsk-pp")?.remove();
    const pop = document.createElement("div");
    pop.className = "tsk-pp";
    pop.innerHTML = `<input class="tsk-in" placeholder="Найти сотрудника" autocomplete="off" aria-label="Найти сотрудника">
      <div class="tsk-pp-l" role="listbox"></div>`;
    document.body.appendChild(pop);
    const r = anchor.getBoundingClientRect();
    pop.style.left = Math.max(8, Math.min(r.left, innerWidth - pop.offsetWidth - 8)) + "px";
    pop.style.top = Math.max(8, Math.min(r.bottom + 4, innerHeight - pop.offsetHeight - 8)) + "px";
    const inp = pop.querySelector("input"), list = pop.querySelector(".tsk-pp-l");
    const paint = () => {
      const q = inp.value.trim().toLowerCase();
      list.innerHTML = (people || []).filter((p) => !exclude.has(p.id) && (!q || p.name.toLowerCase().includes(q)))
        .slice(0, 60).map((p) => `<button type="button" data-id="${esc(p.id)}"><b>${esc(p.name)}</b>${p.job
          ? `<i>${esc(p.job)}</i>` : ""}</button>`).join("") || '<p class="tsk-none">Никого не нашлось</p>';
    };
    const close = () => { pop.remove(); document.removeEventListener("pointerdown", away, true); };
    const away = (e) => { if (!pop.contains(e.target) && e.target !== anchor) close(); };
    setTimeout(() => document.addEventListener("pointerdown", away, true), 0);
    paint();
    inp.focus();
    inp.addEventListener("input", paint);
    inp.addEventListener("keydown", (e) => {
      if (e.key === "Escape") { e.stopPropagation(); close(); }
      if (e.key === "Enter") { e.preventDefault(); const b = list.querySelector("[data-id]"); if (b) b.click(); }
    });
    list.addEventListener("click", (e) => {
      const b = e.target.closest("[data-id]");
      if (!b) return;
      close();
      onPick((people || []).find((p) => p.id === b.dataset.id));
    });
  }

  function paintCard() {
    if (!T) return;
    let box = document.getElementById("tskCard");
    if (!box) {
      box = document.createElement("div");
      box.id = "tskCard";
      box.className = "tsk-drawer-wrap";
      document.body.appendChild(box);
      box.addEventListener("mousedown", (e) => { if (e.target === box) closeCard(); });
      document.addEventListener("keydown", escClose);
    }
    const [dd, tt] = (T.due || "T").split("T");
    const src = T.src;
    box.innerHTML = `<aside class="tsk-drawer" role="dialog" aria-label="Задача #${T.no}">
      <header class="tsk-dh"><span class="tsk-no big">#${T.no}</span>
        ${T.can.status ? `<div class="seg tsk-stseg">${COLS.map(([k, t]) => `<button type="button" class="seg-b${T.status === k ? " on" : ""}"
          data-st="${k}">${t}</button>`).join("")}</div>` : `<span class="tsk-st ${T.status}">${esc(T.status_name)}</span>`}
        <span class="grow"></span>
        ${T.can.delete ? `<button type="button" class="ico warn" id="tskDel" title="Удалить задачу">${ICO.trash}</button>` : ""}
        <button type="button" class="ico" id="tskClose" title="Закрыть" aria-label="Закрыть">${ICO.x}</button></header>
      <div class="tsk-db">
        ${T.can.text ? `<textarea class="tsk-title" id="tskTitle" rows="1" maxlength="200" aria-label="Название">${esc(T.title)}</textarea>`
          : `<h2 class="tsk-title">${esc(T.title)}</h2>`}
        <dl class="tsk-meta">
          <dt>Поставил(а)</dt><dd>${esc(T.author.name)}</dd>
          <dt>Срок</dt><dd>${T.can.edit ? `<span class="tsk-duein"><input type="date" id="tskDate" value="${esc(dd)}">
            <input type="time" id="tskTime" value="${esc(tt)}"></span>` : ""}${T.due ? dueChip(T) : ""}</dd>
          <dt>Исполнители</dt><dd>${chips(T.do, "do")}</dd>
          <dt>Наблюдатели</dt><dd>${chips(T.watch, "watch")}</dd>
        </dl>
        ${src ? `<div class="tsk-src">${ICO.chat}<div><b>Из переписки${src.chat_title ? ` · «${esc(src.chat_title)}»` : ""}</b>
          ${src.text ? `<p>${esc(src.text)}</p>` : ""}</div>${src.alive && src.member ? `<button type="button" class="btn-ghost sm" id="tskGo">Перейти к сообщению в чате${ICO.go}</button>`
            : `<span class="tsk-gone">${src.alive ? "вы не в этом чате" : "сообщение удалено"}</span>`}</div>` : ""}
        <section class="tsk-sec"><h4>Описание</h4>${T.can.text ? `<textarea class="tsk-descr" id="tskDescr" rows="4" maxlength="8000"
          placeholder="Что сделать, подробности">${esc(T.descr)}</textarea>` : `<p class="tsk-descr-t">${esc(T.descr) || "—"}</p>`}</section>
        <section class="tsk-sec"><h4>Чек-лист${T.checklist.length ? ` <i>${T.checklist.filter((x) => x.done).length}/${T.checklist.length}</i>` : ""}</h4>
          <ul class="tsk-checks">${T.checklist.map((x) => `<li class="${x.done ? "done" : ""}" data-check="${esc(x.id)}">
            <label><input type="checkbox"${x.done ? " checked" : ""}${T.can.checks ? "" : " disabled"}><span>${esc(x.text)}</span></label>
            ${T.can.checks ? `<button type="button" class="ico" data-uncheck title="Убрать пункт">${ICO.x}</button>` : ""}</li>`).join("")}</ul>
          ${T.can.checks ? `<input class="tsk-in" id="tskCheckNew" maxlength="500" placeholder="Новый пункт — Enter" autocomplete="off">` : ""}</section>
        <section class="tsk-sec"><h4>Обсуждение${T.thread.length ? ` <i>${T.thread.length}</i>` : ""}</h4>
          <div class="tsk-thread">${T.thread.map((m) => `<div class="tsk-msg${m.author_id === (me || {}).id ? " own" : ""}">
            <b>${esc(m.author)}</b><time>${esc(stamp(m.at))}</time><p>${esc(m.text)}</p></div>`).join("") || '<p class="tsk-none">Пока тихо</p>'}</div>
          ${T.can.comment ? `<div class="tsk-reply"><textarea class="tsk-in" id="tskComment" rows="2" maxlength="4000"
            placeholder="Написать в задачу — участники получат уведомление"></textarea>
            <button type="button" class="btn-brand sm" id="tskSend">Отправить</button></div>` : ""}</section>
        <p class="tsk-foot">Поставлена ${esc(stamp(T.at))}${T.done_at ? ` · выполнена ${esc(stamp(T.done_at))}` : ""}</p>
      </div></aside>`;
    wireCard(box);
    const th = $t(".tsk-thread", box);
    if (th) th.scrollTop = th.scrollHeight;
  }

  function escClose(e) { if (e.key === "Escape" && document.getElementById("tskCard")) closeCard(); }
  function closeCard() {
    const box = document.getElementById("tskCard");
    if (box) box.remove();
    document.removeEventListener("keydown", escClose);
    openNo = 0; T = null;
    if (host && document.getElementById("sec-tsk") && !document.getElementById("sec-tsk").hidden) load();
  }

  async function patch(body) {
    try {
      T = (await AUTH.api("PATCH", "/tasks/" + T.no, body)).task;
      paintCard();
      badge();
    } catch (e) {
      ASK.alert(e.message, { title: "Не сохранилось" });
      paintCard();
    }
  }

  function wireCard(box) {
    $t("#tskClose", box).addEventListener("click", closeCard);
    box.querySelectorAll("[data-st]").forEach((b) => b.addEventListener("click", () => {
      if (b.dataset.st !== T.status) patch({ status: b.dataset.st });
    }));
    const del = $t("#tskDel", box);
    if (del) del.addEventListener("click", async () => {
      if (!(await ASK.confirm(`Удалить задачу #${T.no} «${T.title}»?`, { title: "Задачи", ok: "Удалить", danger: true }))) return;
      try { await AUTH.api("DELETE", "/tasks/" + T.no); closeCard(); badge(); } catch (e) { ASK.alert(e.message, { title: "Не вышло" }); }
    });
    const title = $t("#tskTitle", box);
    if (title) {
      const fit = () => { title.style.height = "auto"; title.style.height = title.scrollHeight + "px"; };
      fit();
      title.addEventListener("input", fit);
      title.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); title.blur(); } });
      title.addEventListener("change", () => { if (title.value.trim() && title.value.trim() !== T.title) patch({ title: title.value }); });
    }
    const descr = $t("#tskDescr", box);
    if (descr) descr.addEventListener("change", () => { if (descr.value !== T.descr) patch({ descr: descr.value }); });
    const dt = $t("#tskDate", box), tm = $t("#tskTime", box);
    if (dt) {
      const save = () => { if (dt.value) patch({ due: dt.value + "T" + (tm.value || "18:00") }); };
      dt.addEventListener("change", save);
      tm.addEventListener("change", save);
    }
    box.querySelectorAll("[data-pick]").forEach((b) => b.addEventListener("click", () => {
      const role = b.dataset.pick;
      pickPerson(b, new Set(T.do.concat(T.watch).map((p) => p.id)), (p) => {
        if (p) patch({ [role]: (role === "do" ? T.do : T.watch).map((x) => x.id).concat(p.id) });
      });
    }));
    box.querySelectorAll("[data-unpick]").forEach((b) => b.addEventListener("click", () => {
      const role = b.dataset.unpick;
      patch({ [role]: (role === "do" ? T.do : T.watch).map((p) => p.id).filter((x) => x !== b.dataset.id) });
    }));
    const go = $t("#tskGo", box);
    if (go) go.addEventListener("click", () => {
      const src = T.src;
      closeCard();
      if (typeof MESSENGER === "object") MESSENGER.openAt(src.chat, src.msg);
    });
    box.querySelectorAll("[data-check]").forEach((li) => {
      const cb = $t("input[type=checkbox]", li);
      cb.addEventListener("change", async () => {
        try { T = (await AUTH.api("PATCH", `/tasks/${T.no}/checks/${li.dataset.check}`, { done: cb.checked })).task; paintCard(); }
        catch (e) { ASK.alert(e.message, { title: "Не вышло" }); }
      });
      const rm = $t("[data-uncheck]", li);
      if (rm) rm.addEventListener("click", async () => {
        try { T = (await AUTH.api("PATCH", `/tasks/${T.no}/checks/${li.dataset.check}`, { delete: true })).task; paintCard(); }
        catch (e) { ASK.alert(e.message, { title: "Не вышло" }); }
      });
    });
    const ni = $t("#tskCheckNew", box);
    if (ni) ni.addEventListener("keydown", async (e) => {
      if (e.key !== "Enter" || !ni.value.trim()) return;
      e.preventDefault();
      try { T = (await AUTH.api("POST", `/tasks/${T.no}/checks`, { text: ni.value })).task; paintCard(); $t("#tskCheckNew").focus(); }
      catch (err) { ASK.alert(err.message, { title: "Не вышло" }); }
    });
    const send = $t("#tskSend", box), ci = $t("#tskComment", box);
    if (send) {
      const go2 = async () => {
        if (!ci.value.trim()) return;
        send.disabled = true;
        try { T = (await AUTH.api("POST", `/tasks/${T.no}/comments`, { text: ci.value })).task; paintCard(); }
        catch (e) { ASK.alert(e.message, { title: "Не отправилось" }); send.disabled = false; }
      };
      send.addEventListener("click", go2);
      ci.addEventListener("keydown", (e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); go2(); } });
    }
  }

  /* ── поставить задачу ───────────────────────────────────── */
  /* pre: title, descr, due ('ГГГГ-ММ-ДДTЧЧ:ММ'), do [{id,name}], src {chat,
     msg}, author {name} — из сообщения постановщик — его автор. */
  async function openCreate(pre) {
    pre = pre || {};
    try { await loadPeople(); } catch (e) { ASK.alert(e.message, { title: "Задача" }); return null; }
    const u = AUTH.current() || {};
    const pick = { do: (pre.do || []).slice(), watch: [] };
    if (!pick.do.length && !pre.src) pick.do.push({ id: u.id, name: u.username || "Я" });
    const [dd, tt] = (pre.due || "T").split("T");
    const box = document.createElement("div");
    box.className = "pf-modal";
    box.innerHTML = `<div class="pf-crop tsk-new" role="dialog" aria-label="Новая задача">
      <h3>Новая задача</h3>
      ${pre.src ? `<p class="tsk-hint">${ICO.chat}Из сообщения${pre.author ? ` — постановщик <b>${esc(pre.author.name)}</b>` : ""}.
        Текст сообщения — в описании.</p>` : ""}
      <label class="fld"><span>Название</span><input id="tnTitle" maxlength="200" value="${esc(pre.title || "")}"
        placeholder="Что сделать" autocomplete="off"></label>
      <div class="tsk-new-2"><label class="fld"><span>Срок — дата</span><input type="date" id="tnDate" value="${esc(dd)}"></label>
        <label class="fld"><span>Время</span><input type="time" id="tnTime" value="${esc(tt || "18:00")}"></label></div>
      <div class="fld"><span>Исполнители</span><div id="tnDo"></div></div>
      <div class="fld"><span>Наблюдатели</span><div id="tnWatch"></div></div>
      <label class="fld"><span>Описание</span><textarea id="tnDescr" rows="4" maxlength="8000" placeholder="Подробности">${esc(pre.descr || "")}</textarea></label>
      <label class="fld"><span>Чек-лист — пункт в строке</span><textarea id="tnChecks" rows="2" placeholder="необязательно"></textarea></label>
      <div class="pf-note bad" id="tnErr" hidden></div>
      <div class="pf-modal-foot"><span class="grow"></span><button type="button" class="btn ghost" id="tnNo">Отмена</button>
        <button type="button" class="btn" id="tnOk">Поставить задачу</button></div></div>`;
    document.body.appendChild(box);
    const close = () => { document.removeEventListener("keydown", key); box.remove(); };
    const key = (e) => { if (e.key === "Escape") close(); };
    document.addEventListener("keydown", key);
    box.addEventListener("mousedown", (e) => { if (e.target === box) close(); });
    $t("#tnNo", box).addEventListener("click", close);
    const paintPick = (role) => {
      const el = $t(role === "do" ? "#tnDo" : "#tnWatch", box);
      const list = pick[role];
      el.innerHTML = `<div class="tsk-chips">${list.map((p) => `<span class="tsk-chip">${esc(p.name)}<button type="button" data-x="${esc(p.id)}"
        aria-label="Убрать">${ICO.x}</button></span>`).join("")}<button type="button" class="tsk-add">${ICO.plus}добавить</button></div>`;
      el.querySelectorAll("[data-x]").forEach((b) => b.addEventListener("click", () => {
        pick[role] = pick[role].filter((p) => p.id !== b.dataset.x); paintPick("do"); paintPick("watch");
      }));
      const add = $t(".tsk-add", el);
      add.addEventListener("click", () => pickPerson(add, new Set(pick.do.concat(pick.watch).map((p) => p.id)), (p) => {
        if (p) { pick[role].push(p); paintPick("do"); paintPick("watch"); }
      }));
    };
    paintPick("do"); paintPick("watch");
    $t("#tnTitle", box).focus();
    return new Promise((resolve) => {
      $t("#tnOk", box).addEventListener("click", async () => {
        const err = $t("#tnErr", box), ok = $t("#tnOk", box);
        const date = $t("#tnDate", box).value, time = $t("#tnTime", box).value || "18:00";
        err.hidden = true;
        if (!$t("#tnTitle", box).value.trim()) { err.textContent = "Впишите, что сделать"; err.hidden = false; return; }
        if (!date) { err.textContent = "Укажите срок — дату и время"; err.hidden = false; return; }
        if (!pick.do.length) { err.textContent = "Выберите исполнителя"; err.hidden = false; return; }
        ok.disabled = true;
        try {
          const out = await AUTH.api("POST", "/tasks", {
            title: $t("#tnTitle", box).value, descr: $t("#tnDescr", box).value, due: date + "T" + time,
            do: pick.do.map((p) => p.id), watch: pick.watch.map((p) => p.id), src: pre.src || null,
            checklist: $t("#tnChecks", box).value.split("\n").map((x) => x.trim()).filter(Boolean) });
          close();
          badge();
          if (host && document.getElementById("sec-tsk") && !document.getElementById("sec-tsk").hidden) load();
          resolve(out.task);
        } catch (e) {
          err.textContent = e.message; err.hidden = false; ok.disabled = false;
        }
      });
    });
  }

  /* Из сообщения чата: заготовку собирает сервер (текст, постановщик,
     упомянутые), человек правит и ставит. */
  async function fromMessage(chatId, messageId) {
    try {
      const d = await AUTH.api("POST", "/tasks/draft", { chat: chatId, msg: messageId });
      return openCreate(d);
    } catch (e) {
      ASK.alert(e.message, { title: "Задача" });
      return null;
    }
  }

  /* Счётчик у пункта меню: новые мне и просроченные. */
  async function badge() {
    clearTimeout(badgeTimer);
    try {
      const out = await AUTH.api("GET", "/tasks/badge");
      const el = document.getElementById("tskBadge");
      if (el) { el.hidden = !out.n; el.textContent = out.n > 99 ? "99+" : String(out.n); el.title = `Ждут вас: ${out.n}`; }
    } catch (_) { /* повторим позже */ }
    badgeTimer = setTimeout(badge, document.hidden ? 300000 : 90000);
  }

  function init(user) {
    if (me || !user) return;
    me = user;
    badge();
    document.addEventListener("visibilitychange", () => { if (!document.hidden) badge(); });
  }

  return { show, init, openCard, openCreate, fromMessage, badge };
})();
