/* Первая версия: личные и групповые чаты сотрудников. Редактор живёт
   отдельно от ленты: фоновые обновления не теряют ввод и фокус.
   21.10.2026: вложения (фото, документы, любые файлы — скрепкой,
   перетаскиванием, вставкой из буфера), карточка чата «как в телеграме»
   (звук, управление, покинуть, фото/файлы/ссылки, участники), чаты правок. */
"use strict";
const MESSENGER = (() => {
  const $m = (s, root = document) => root.querySelector(s);
  const e = (s) => String(s ?? "").replace(/[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const svg = (path) => `<svg viewBox="0 0 24 24" aria-hidden="true">${path}</svg>`;
  const icon = {
    chat: svg('<path d="M20 11.5a8 8 0 0 1-8 8H5l-3 2v-10a9 9 0 0 1 18 0Z"/><path d="M7 9h8M7 13h5"/>'),
    plus: svg('<path d="M12 5v14M5 12h14"/>'),
    back: svg('<path d="m14 6-6 6 6 6"/>'),
    send: svg('<path d="m3 3 18 9-18 9 4-9-4-9Zm4 9h14"/>'),
    pin: svg('<path d="M9.5 3.5h5l-.8 5.2 3.3 3.1v1.7H7v-1.7l3.3-3.1z"/><path d="M12 13.5v7"/>'),
    trash: svg('<path d="M4.5 6.5h15M9.5 6.5V4.8A1.3 1.3 0 0 1 10.8 3.5h2.4a1.3 1.3 0 0 1 1.3 1.3v1.7M6.5 6.5l.9 12.2A1.5 1.5 0 0 0 8.9 20h6.2a1.5 1.5 0 0 0 1.5-1.3l.9-12.2"/>'),
    clip: svg('<path d="m20.5 11.5-8.2 8.2a5.2 5.2 0 0 1-7.4-7.4l8.6-8.6a3.5 3.5 0 0 1 4.9 4.9l-8.6 8.6a1.7 1.7 0 0 1-2.5-2.5l7.9-7.9"/>'),
    bell: svg('<path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 1.5h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>'),
    bellOff: svg('<path d="M8.6 5.2A6 6 0 0 1 18 11v4.2M6 9.5v7L4.5 18H16"/><path d="M10 20.5a2 2 0 0 0 4 0M3.5 3.5l17 17"/>'),
    sliders: svg('<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>'),
    exit: svg('<path d="M14 4.5h3.5A1.5 1.5 0 0 1 19 6v12a1.5 1.5 0 0 1-1.5 1.5H14"/><path d="M10 16.5 5.5 12 10 7.5M5.5 12H15"/>'),
    dots: svg('<circle cx="5.5" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="18.5" cy="12" r="1.3"/>'),
    image: svg('<rect x="3.5" y="4.5" width="17" height="15" rx="2.5"/><circle cx="9" cy="10" r="1.8"/><path d="m20.5 16-4.8-4.8L6 19.5"/>'),
    file: svg('<path d="M6.5 3.5h7l4.5 4.5v11a1.5 1.5 0 0 1-1.5 1.5h-10A1.5 1.5 0 0 1 5 19V5a1.5 1.5 0 0 1 1.5-1.5Z"/><path d="M13.5 3.5V8h4.5"/>'),
    link: svg('<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1.3 1.3"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1.3-1.3"/>'),
    users: svg('<path d="M16 20v-1.6a3.4 3.4 0 0 0-3.4-3.4H6.4A3.4 3.4 0 0 0 3 18.4V20"/><circle cx="9.5" cy="7.5" r="3.5"/><path d="M21 20v-1.6a3.4 3.4 0 0 0-2.6-3.3M15.5 4.2a3.4 3.4 0 0 1 0 6.6"/>'),
    userPlus: svg('<path d="M14 20v-1.6a3.4 3.4 0 0 0-3.4-3.4H5.4A3.4 3.4 0 0 0 2 18.4V20"/><circle cx="8" cy="7.5" r="3.5"/><path d="M19 8v6M16 11h6"/>'),
    x: svg('<path d="M6 6l12 12M18 6 6 18"/>'),
    down: svg('<path d="M12 4v11M7 10.5l5 5 5-5M5 20h14"/>'),
    left: svg('<path d="m15 5-7 7 7 7"/>'),
    right: svg('<path d="m9 5 7 7-7 7"/>'),
    site: svg('<path d="M4 20.5h16M6 20.5V8.5l6-4 6 4v12"/><path d="M10 20.5v-5h4v5M9.5 11h1M13.5 11h1"/>'),
    bug: svg('<path d="M9 7.5V6a3 3 0 0 1 6 0v1.5"/><rect x="7" y="7.5" width="10" height="12" rx="5"/><path d="M12 11v8.5M3.5 13H7M17 13h3.5M4.5 8.5 7 10M19.5 8.5 17 10M4.5 18.5 7 17M19.5 18.5 17 17"/>'),
    reply: svg('<path d="M9.5 6.5 4 12l5.5 5.5"/><path d="M4.5 12H14a6 6 0 0 1 6 6v.5"/>'),
    smile: svg('<circle cx="12" cy="12" r="8.5"/><path d="M8.5 14.2a4.2 4.2 0 0 0 7 0"/><path d="M9.2 9.6v.1M14.8 9.6v.1"/>'),
    // Меню сообщения (правка № 6, 21.10.2026).
    copy: svg('<rect x="8.5" y="8.5" width="11" height="11" rx="2"/><path d="M15.5 8.5V6a1.5 1.5 0 0 0-1.5-1.5H6A1.5 1.5 0 0 0 4.5 6v8A1.5 1.5 0 0 0 6 15.5h2.5"/>'),
    edit: svg('<path d="M4.5 19.5h4l10-10a2.8 2.8 0 0 0-4-4l-10 10z"/><path d="m13.5 6.5 4 4"/>'),
    fwd: svg('<path d="M14.5 6.5 20 12l-5.5 5.5"/><path d="M19.5 12H10a6 6 0 0 0-6 6v.5"/>'),
    task: svg('<rect x="4" y="4.5" width="16" height="16" rx="2.5"/><path d="m8.5 12.5 2.5 2.5 4.5-5"/>'),
    select: svg('<circle cx="12" cy="12" r="8.5"/><path d="m8.5 12.3 2.4 2.4 4.6-4.9"/>'),
    // Совет Вектор (22.10.2026) — вектор из точки: тот же знак, что у пункта меню.
    vector: svg('<circle cx="6.5" cy="17.5" r="2.2"/><path d="M8.2 15.8 17.5 6.5M11.5 6.5h6v6"/>'),
    // Знак Nexus — тот же «N», что на кнопке в шапке (20.10.2026). Заливки
    // плоские: значок повторяется в ленте, а одинаковые id градиентов путаются.
    nexus: `<svg class="msg-nx" viewBox="0 0 32 32" aria-hidden="true"><polygon points="16,1.6 28.6,8.8 28.6,23.2 16,30.4 3.4,23.2 3.4,8.8" fill="#262A31"/><polygon points="16,4.8 25.8,10.4 25.8,21.6 16,27.2 6.2,21.6 6.2,10.4" fill="#FE5000"/><polygon points="16,7.6 23.4,11.8 23.4,16 16,12 8.6,16 8.6,11.8" fill="#FF9A5C"/><path d="M11.6 20.6v-9.2l8.8 9.2v-9.2" fill="none" stroke="#2A0E00" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  };
  /* Чат «Nexus» (заказчик, 20.10.2026): «у каждого сверху всегда
     закреплённый чат с Нексусом, в нём публикуются пакеты обновлений —
     что обновлено и когда». Это лента: отвечать в неё нельзя, пишут
     только Нексус (журнал платформы) и администраторы от его имени. */
  const CHANNEL = "ch-nexus";
  const NEXUS = "nexus";
  const isChannel = (id = current) => id === CHANNEL;
  /* Вложения едут кусками: у nginx общий предел запроса 8 МБ. Фото больше
     2560 точек или 2,5 МБ ужимаем, как мессенджеры, — документ не трогаем. */
  const CHUNK = 6 << 20, FILE_MAX = 200 << 20, FILES_MAX = 10, PHOTO_SIDE = 2560;
  /* Реакции — тот же набор, что на сервере (messenger.REACTIONS): у человека
     на сообщении одна, другая заменяет прежнюю (22.10.2026, голос по идеям
     в чате совета Вектор). */
  const REACTIONS = ["👍", "👎", "🔥", "❤️", "👏", "🤔", "😂", "✅"];
  let me = null, rows = [], current = "", detail = null, messages = [];
  let older = false, newer = false, generation = 0, listSeq = 0;
  let opened = false, fetching = false, reading = false, readCursor = 0, timer = null;
  let filter = "", listReady = false, polling = false, stick = true, lastIds = null, reactRev = 0;
  /* Чаты по объектам (правка № 5, 22.10.2026): список группируется по
     объекту группового чата; включено ли — помним в браузере. */
  const BY_SITE_KEY = "karkas.msg.bysite.v1";
  let bySite = (() => {
    try { return localStorage.getItem(BY_SITE_KEY) === "1"; } catch (_) { return false; }
  })();
  // replies — на что отвечаем в каждом чате: чат → сообщение.
  const drafts = new Map(), sending = new Set(), sendErrors = new Map(), trays = new Map(), replies = new Map();
  /* Правка № 6 (21.10.2026): правка сообщения (editing — {chat, id}), выбор
     нескольких (selected), строка «/todo» (todo — разбор сервера), задачи в
     сообщениях Nexus (taskBrief — № → {status, can_status}). */
  let editing = null, selecting = false, todo = null, todoTimer = 0, todoSeq = 0;
  const selected = new Set(), taskBrief = new Map();
  const api = (method, path, body) => AUTH.api(method, "/messenger" + path, body);
  const base = (id = current) => "/chats/" + encodeURIComponent(id);
  const fileUrl = (f, what = "") => "/api/messenger/files/" + encodeURIComponent(f.id) + (what ? "/" + what : "");
  const active = () => document.documentElement.dataset.sec === "msg" && !document.hidden;
  const stamp = (at, full = false) => new Date(at).toLocaleString("ru-RU", full
    ? { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" }
    : { hour: "2-digit", minute: "2-digit" });
  const initials = (s) => String(s).trim().split(/\s+/).slice(0, 2).map((w) => w[0] || "").join("");
  const plural = (n, one, few, many) => `${n} ${n % 10 === 1 && n % 100 !== 11 ? one :
    n % 10 >= 2 && n % 10 <= 4 && !(n % 100 >= 12 && n % 100 <= 14) ? few : many}`;
  const memberCount = (n) => plural(n, "участник", "участника", "участников");
  const size = (n) => n < 1024 ? n + " Б" : n < 1 << 20 ? Math.round(n / 1024) + " КБ"
    : (n / 1048576).toFixed(n < 10 << 20 ? 1 : 0).replace(".", ",") + " МБ";
  const extOf = (name) => (/\.([a-z0-9]{1,5})$/i.exec(name || "") || [, "файл"])[1].toUpperCase().slice(0, 4);
  const isPdf = (f) => /\.pdf$/i.test(f.name) || f.mime === "application/pdf";
  const isAdmin = () => !!(me && AUTH.isAdmin(me));
  /* «В сети», если заходил последние 6 минут: время входа пишется не чаще
     раза в пять минут. */
  function seenText(at) {
    if (!at) return "был(а) давно";
    const t = new Date(at), min = (Date.now() - t) / 60000;
    if (min < 6) return "в сети";
    if (min < 60) return `был(а) ${Math.max(6, Math.round(min))} мин назад`;
    const day = (d) => d.toLocaleDateString("ru-RU");
    const y = new Date(Date.now() - 864e5);
    const hm = t.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
    if (day(t) === day(new Date())) return "был(а) в " + hm;
    if (day(t) === day(y)) return "был(а) вчера в " + hm;
    return "был(а) " + t.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
  }
  const online = (at) => !!at && (Date.now() - new Date(at)) / 60000 < 6;
  function avatar(person, group = false, big = false) {
    if (person.channel) return `<span class="msg-avatar nexus${big ? " big" : ""}">${icon.nexus}</span>`;
    const img = group ? (person.photo && person.chatId
      ? `/api/messenger/chats/${encodeURIComponent(person.chatId)}/photo?v=${encodeURIComponent(person.photo)}` : "")
      : person.avatar && person.id ? AUTH.avatarUrl(person.id, person.avatar) : "";
    return `<span class="msg-avatar${group ? " group" : ""}${person.ico ? " vector" : ""}${big ? " big" : ""}">${img
      ? `<img src="${e(img)}" alt="">` : group ? person.ico || icon.chat : e(initials(person.name || person.title || "?"))}</span>`;
  }
  // Чат напоминаний (kind bot, 21.10.2026) — тоже Nexus: его знак вместо букв.
  // Чат совета Вектор (managed wg, 22.10.2026) — знак совета.
  const chatAvatar = (r, big = false) => avatar({ ...(r.peer || {}), title: r.title, avatar: r.avatar,
    channel: r.kind === "channel" || r.kind === "bot", photo: r.photo, chatId: r.id,
    ico: r.managed === "wg" ? icon.vector : "" }, r.kind === "group", big);
  function draft(id) {
    if (!drafts.has(id)) {
      let saved = {};
      try { saved = JSON.parse(sessionStorage.getItem("karkas-msg-" + me.id + "-" + id) || "{}"); } catch (_) { /* private mode */ }
      drafts.set(id, saved && typeof saved.text === "string" ? saved : { text: "" });
    }
    return drafts.get(id);
  }
  function saveDraft(id, data) {
    drafts.set(id, data);
    try {
      const key = "karkas-msg-" + me.id + "-" + id;
      data.text ? sessionStorage.setItem(key, JSON.stringify(data)) : sessionStorage.removeItem(key);
    } catch (_) { /* память остаётся */ }
  }
  function status(text = "", bad = false) {
    const el = $m("#msgStatus");
    if (el) { el.textContent = text; el.classList.toggle("bad", bad); }
  }
  function badge(n) {
    const el = $m("#msgBadge");
    if (el) { el.hidden = !n; el.textContent = n > 99 ? "99+" : String(n); }
  }
  /* Короткий сигнал о новом сообщении — в чатах без «Без звука» и не в
     том, что открыт перед глазами. Браузер даёт звук после первого
     касания страницы; до него сигнал молча пропускается. */
  let audio = null;
  function chime() {
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      if (audio.state === "suspended") audio.resume();
      const t = audio.currentTime, o = audio.createOscillator(), g = audio.createGain();
      o.type = "sine";
      o.frequency.setValueAtTime(880, t);
      o.frequency.exponentialRampToValueAtTime(1320, t + 0.09);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.09, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.32);
      o.connect(g).connect(audio.destination);
      o.start(t); o.stop(t + 0.35);
    } catch (_) { /* без звука */ }
  }
  function shell() {
    const host = $m("#sec-msg");
    if (!host || $m(".msg-shell", host)) return;
    host.innerHTML = `<div class="msg-shell">
      <aside class="msg-sidebar" aria-label="Список чатов">
        <header class="msg-list-head"><div><h2>Чаты</h2><span>Внутри команды</span></div>
          <button type="button" class="btn sm" id="msgNew">${icon.plus}Новый чат</button></header>
        <div class="msg-search"><input id="msgSearch" type="search" placeholder="Найти чат или объект"
          aria-label="Найти чат или объект"><button type="button" class="msg-bysite${bySite ? " on" : ""}" id="msgBySite"
          aria-pressed="${bySite}" title="Группировать чаты по объектам">${icon.site}</button></div>
        <div class="msg-list" id="msgList"><p class="msg-empty-small">Загружаю чаты…</p></div>
      </aside>
      <div class="msg-conversation" id="msgConversation"></div>
    </div>`;
    $m("#msgNew").addEventListener("click", () => picker());
    $m("#msgSearch").addEventListener("input", (ev) => { filter = ev.target.value; paintList(); });
    $m("#msgBySite").addEventListener("click", (ev) => {
      bySite = !bySite;
      try { localStorage.setItem(BY_SITE_KEY, bySite ? "1" : "0"); } catch (_) { /* без памяти */ }
      ev.currentTarget.classList.toggle("on", bySite);
      ev.currentTarget.setAttribute("aria-pressed", String(bySite));
      paintList();
    });
    $m("#msgList").addEventListener("click", (ev) => {
      const btn = ev.target.closest("[data-chat]");
      if (btn) open(btn.dataset.chat);
    });
    // Файлы перетаскивают на переписку целиком — не только на поле ввода.
    const conv = $m("#msgConversation");
    const canDrop = (ev) => opened && $m("#msgCompose") && !$m("#msgCompose").hidden && !isChannel()
      && [...(ev.dataTransfer?.types || [])].includes("Files");
    conv.addEventListener("dragover", (ev) => { if (canDrop(ev)) { ev.preventDefault(); conv.classList.add("drop"); } });
    conv.addEventListener("dragleave", (ev) => { if (!conv.contains(ev.relatedTarget)) conv.classList.remove("drop"); });
    conv.addEventListener("drop", (ev) => {
      conv.classList.remove("drop");
      if (!canDrop(ev)) return;
      ev.preventDefault(); attach([...ev.dataTransfer.files]);
    });
    emptyConversation();
  }
  function emptyConversation() {
    $m("#msgConversation").innerHTML = `<div class="msg-welcome">${icon.chat}<h2>На связи с командой</h2>
      <p>Выберите чат или начните разговор с сотрудником.</p><button type="button" class="btn" id="msgStart">Начать разговор</button></div>`;
    $m("#msgStart").addEventListener("click", () => picker());
  }
  const firstLine = (t) => String(t || "").split("\n")[0];
  // Последнее сообщение строкой списка: текст или «Фото», «📎 акт.pdf».
  function lastText(m) {
    if (m.text) return firstLine(m.text);
    const f = (m.files || [])[0];
    if (!f) return "";
    return (f.kind === "image" ? "📷 Фото" : "📎 " + f.name) + (m.files.length > 1 ? ` +${m.files.length - 1}` : "");
  }
  function preview(r) {
    if (r.kind === "channel") return r.last ? e(firstLine(r.last.text)) : "Обновления платформы";
    if (!r.last) return "Начните переписку";
    const sys = r.last.author_id === NEXUS && String(r.last.client_id || "").startsWith("sys-");
    const who = sys ? "" : r.last.author_id === me.id ? "Вы: " : r.last.author_id === NEXUS ? "Nexus: "
      : r.kind === "group" ? r.last.author_name + ": " : "";
    return e(who + lastText(r.last));
  }
  function paintList() {
    const host = $m("#msgList");
    if (!host) return;
    const q = filter.trim().toLocaleLowerCase("ru");
    // Чат находится и по названию, и по своему объекту (правка № 5).
    const selected = rows.filter((r) => (r.title + " " + (r.site_name || "")).toLocaleLowerCase("ru").includes(q));
    // По объектам: закреплённые — как были, сверху; дальше объект за
    // объектом по имени; без объекта — в конце.
    const groups = [];
    if (bySite && selected.length) {
      const top = selected.filter((r) => r.pinned), rest = selected.filter((r) => !r.pinned);
      if (top.length) groups.push(["", top]);
      const names = [...new Set(rest.map((r) => r.site_name || ""))]
        .sort((a, b) => (!a) - (!b) || a.localeCompare(b, "ru"));
      for (const n of names) groups.push([n || "Без объекта", rest.filter((r) => (r.site_name || "") === n), !!n]);
    }
    const item = (r) => `<button type="button" class="msg-chat${r.id === current ? " selected" : ""}${
      r.fixed ? " pinned" : ""}${r.muted ? " muted" : ""}" data-chat="${e(r.id)}" aria-pressed="${r.id === current}"${r.fixed
      ? ' title="Закреплён у всех: здесь Nexus публикует пакеты обновлений платформы"' : ""}>
      ${chatAvatar(r)}
      <span class="msg-chat-text"><b>${e(r.title)}${r.issues ? `<i class="msg-chat-tag" title="Чат правок: сообщения попадают в «Правки и ошибки»">${icon.bug}</i>` : ""}${
        r.muted ? `<i class="msg-chat-tag" title="Без звука">${icon.bellOff}</i>` : ""}${
        r.pinned ? `<i class="msg-pin" aria-label="Закреплён">${icon.pin}</i>` : ""}</b>${r.site_name && !bySite
        ? `<small class="msg-chat-site">${icon.site}${e(r.site_name)}</small>` : ""}<span>${preview(r)}</span></span>
      <span class="msg-chat-meta"><time>${r.last ? new Date(r.at).toLocaleDateString() === new Date().toLocaleDateString()
        ? stamp(r.at) : new Date(r.at).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" }) : ""}</time>
      ${r.unread ? `<i class="msg-count${r.muted ? " muted" : ""}">${r.unread > 99 ? "99+" : r.unread}</i>` : ""}</span></button>`;
    // Сотрудники, с кем личного чата ещё нет (правка № 39, 23.10.2026):
    // нашли по имени — щелчок заводит чат.
    const withChat = new Set(rows.filter((r) => r.kind === "direct" && r.peer).map((r) => r.peer.id));
    const newPeople = q.length >= 2 && PEOPLE ? PEOPLE.filter((p) => p.id !== me.id && !withChat.has(p.id)
      && (p.name + " " + (p.job_title || "")).toLocaleLowerCase("ru").includes(q)).slice(0, 8) : [];
    if (q.length >= 2 && !PEOPLE) loadPeople();
    const peopleHtml = newPeople.length ? `<div class="msg-group-h"><span>Начать чат</span><i>${newPeople.length}</i></div>${
      newPeople.map((p) => `<button type="button" class="msg-chat msg-newpeer" data-peer="${e(p.id)}"
        title="Личного чата с ${e(p.name)} ещё нет — щёлкните, чтобы начать">
        <span class="msg-avatar">${e(String(p.name || "?").split(/\s+/).slice(0, 2).map((w) => w[0] || "").join("").toUpperCase())}</span>
        <span class="msg-chat-text"><b>${e(p.name)}</b><span>${e(p.job_title || "")}${p.job_title ? " · " : ""}новый чат</span></span>
      </button>`).join("")}` : "";
    host.innerHTML = (!selected.length
      ? (newPeople.length ? "" : `<p class="msg-empty-small">${q ? "Чаты не найдены" : "Пока нет переписок. Начните новый чат."}</p>`)
      : groups.length ? groups.map(([name, list, site]) => `${name ? `<div class="msg-group-h${site ? " site" : ""}">${
        site ? icon.site : ""}<span>${e(name)}</span><i>${list.length}</i></div>` : ""}${list.map(item).join("")}`).join("")
      : selected.map(item).join("")) + peopleHtml;
    host.querySelectorAll("[data-peer]").forEach((b) => b.addEventListener("click", async () => {
      b.disabled = true;
      try {
        const out = await api("POST", "/chats", { kind: "direct", members: [b.dataset.peer] });
        filter = "";
        const inp = $m("#msgSearch");
        if (inp) inp.value = "";
        await refreshList();
        await open(out.id);
      } catch (err) { status(err.message, true); b.disabled = false; }
    }));
  }
  let PEOPLE = null, peopleBusy = false;
  async function loadPeople() {
    if (peopleBusy) return;
    peopleBusy = true;
    try { PEOPLE = (await api("GET", "/people")).rows || []; paintList(); } catch (err) { PEOPLE = []; }
    peopleBusy = false;
  }
  async function refreshList() {
    const seq = ++listSeq;
    const out = await api("GET", "/chats");
    if (seq !== listSeq) return;
    rows = out.rows; listReady = true;
    // Новое чужое сообщение в чате со звуком и не перед глазами — сигнал.
    if (lastIds && rows.some((r) => r.last && r.last.author_id !== me.id && !r.muted
      && r.last.id > (lastIds.get(r.id) || 0) && !(active() && opened && current === r.id))) chime();
    lastIds = new Map(rows.map((r) => [r.id, r.last ? r.last.id : 0]));
    badge(out.unread); paintList(); news();
  }
  // Новый пакет обновлений — оранжевая точка на знаке «N» в шапке.
  function news() {
    const btn = document.getElementById("nexusBtn");
    const ch = rows.find((r) => r.id === CHANNEL);
    if (!btn) return;
    const on = !!(ch && ch.unread);
    btn.classList.toggle("has-news", on);
    btn.title = on ? "Nexus: новый пакет обновлений — в мессенджере" : "Nexus и Трейс";
  }
  // Подпись под названием открытого чата.
  function subtitle(chat) {
    if (chat.kind === "channel") return "Пакеты обновлений платформы · закреплён у всех";
    if (chat.kind === "bot") return "Личные напоминания от Nexus";
    if (chat.kind === "group") {
      const on = (detail?.members || []).filter((m) => m.id !== me.id && online(m.seen)).length;
      return memberCount(chat.member_count) + (on ? `, ${on} в сети` : "")
        + (chat.issues ? " · чат правок" + (chat.section_name ? ": " + chat.section_name : "") : "");
    }
    if (chat.peer?.blocked) return "Учётная запись недоступна";
    const peer = (detail?.members || []).find((m) => m.id !== me.id);
    return peer ? seenText(peer.seen) : "Личная переписка";
  }
  // Шапка открытого чата — после правок в карточке и на каждом опросе.
  function refreshHead(d) {
    const btn = $m("#msgInfo");
    if (!btn || d.chat.id !== current) return;
    $m("b", btn).textContent = d.chat.title;
    const sub = $m("#msgSub"); if (sub) sub.textContent = subtitle(d.chat);
    if (btn.dataset.photo !== (d.chat.photo || "")) {
      btn.dataset.photo = d.chat.photo || "";
      $m(".msg-avatar", btn).outerHTML = chatAvatar({ ...d.chat, avatar: rows.find((r) => r.id === current)?.avatar });
    }
    const ic = $m(".msg-head-ic");
    if (d.chat.muted && !ic) $m("#msgMore").insertAdjacentHTML("beforebegin", `<span class="msg-head-ic" title="Без звука">${icon.bellOff}</span>`);
    if (!d.chat.muted && ic) ic.remove();
  }
  /* Пакет обновлений карточкой: первая строка — заголовок, «• » — пункты,
     остальное — абзацы. Текст экранируется целиком. */
  function update(text) {
    const lines = String(text || "").split("\n").map((x) => x.trim()).filter(Boolean);
    if (!lines.length) return "";
    let html = `<b class="msg-upd-t">${e(lines[0])}</b>`, list = [];
    const flush = () => { if (list.length) { html += `<ul>${list.join("")}</ul>`; list = []; } };
    lines.slice(1).forEach((l) => {
      if (/^[•\-–—]\s*/.test(l)) list.push(`<li>${e(l.replace(/^[•\-–—]\s*/, ""))}</li>`);
      else { flush(); html += `<p>${e(l)}</p>`; }
    });
    flush();
    return html;
  }
  /* Текст сообщения: ссылки — ссылками, в чате правок «№ 12» открывает
     правку. Всё остальное экранируется. */
  function rich(text, issues = false) {
    const s = String(text || "");
    const rx = issues ? /(https?:\/\/[^\s<>"'«»]+)|№\s?(\d{1,6})/gi : /(https?:\/\/[^\s<>"'«»]+)/gi;
    let out = "", last = 0;
    for (const mt of s.matchAll(rx)) {
      let piece = mt[0];
      if (mt[1]) piece = piece.replace(/[.,;:!?)]+$/, "");
      out += e(s.slice(last, mt.index));
      out += mt[1] ? `<a href="${e(piece)}" target="_blank" rel="noopener noreferrer">${e(piece)}</a>`
        : `<a href="#" data-issue="${e(mt[2])}">${e(piece)}</a>`;
      last = mt.index + piece.length;
    }
    return out + e(s.slice(last));
  }
  function filesHtml(m) {
    const fs = m.files || [];
    if (!fs.length) return "";
    const pics = fs.filter((f) => f.kind === "image"), docs = fs.filter((f) => f.kind !== "image");
    let html = "";
    if (pics.length) {
      html += `<div class="msg-pics n${Math.min(pics.length, 4)}">${pics.map((f) => {
        const ratio = pics.length === 1 && f.w && f.h ? ` style="aspect-ratio:${f.w}/${f.h}"` : "";
        return `<button type="button" class="msg-pic" data-pic="${e(f.id)}" title="${e(f.name)}"${ratio}>
          <img src="${e(fileUrl(f, "thumb"))}" alt="${e(f.name)}" loading="lazy" decoding="async"></button>`;
      }).join("")}</div>`;
    }
    html += docs.map((f) => docHtml(f)).join("");
    return html;
  }
  // Документ: PDF открывается во вкладке, остальное скачивается.
  const docHtml = (f, meta = "") => `<div class="msg-doc"><a class="msg-doc-main" href="${e(fileUrl(f, isPdf(f) ? "view" : ""))}"${
    isPdf(f) ? ' target="_blank" rel="noopener"' : ` download="${e(f.name)}"`} title="${isPdf(f) ? "Открыть" : "Скачать"} «${e(f.name)}»">
    <span class="msg-doc-ic">${e(extOf(f.name))}</span><span class="msg-doc-t"><b>${e(f.name)}</b><small>${size(f.size)}${meta}</small></span></a>
    <a class="msg-doc-dl" href="${e(fileUrl(f))}" download="${e(f.name)}" title="Скачать" aria-label="Скачать">${icon.down}</a></div>`;
  /* Ответ и реакции (22.10.2026): в группах и личных чатах отвечают на
     сообщение и ставят реакцию — ей в чате совета Вектор голосуют за
     идеи. В ленте «Nexus» — только реакция, в напоминаниях — ничего. */
  const canReply = () => !!detail && (detail.chat.kind === "group" || detail.chat.kind === "direct");
  const canReact = () => !!detail && detail.chat.kind !== "bot";
  function acts(m) {
    const out = [];
    if (canReply()) out.push(`<button type="button" class="msg-act" data-reply="${m.id}" title="Ответить" aria-label="Ответить">${icon.reply}</button>`);
    if (canReact()) out.push(`<button type="button" class="msg-act" data-react="${m.id}" title="Реакция" aria-label="Поставить реакцию">${icon.smile}</button>`);
    if (canReply()) out.push(`<button type="button" class="msg-act" data-more="${m.id}" title="Ещё: копировать, переслать, задача…"
      aria-label="Ещё действия">${icon.dots}</button>`);
    if (detail.chat.kind === "group" && isAdmin() && m.author_id !== NEXUS) {
      out.push(`<button type="button" class="msg-act" data-toissue="${m.id}" title="Перенести в «Правки и ошибки»"
        aria-label="Перенести в правки">${icon.bug}</button>`);
    }
    return out.length ? `<span class="msg-acts">${out.join("")}</span>` : "";
  }
  // Цитата над ответом: щелчок — к сообщению, если оно уже в ленте.
  function quote(q) {
    if (!q) return "";
    if (q.gone) return `<div class="msg-quote gone">Сообщение удалено</div>`;
    const what = q.text || (q.file ? (q.file.kind === "image" ? "📷 Фото" : "📎 " + q.file.name) : "");
    return `<button type="button" class="msg-quote" data-goto="${q.id}"><b>${e(q.author_id === NEXUS ? "Nexus" : q.author_name)}</b>
      <span>${e(what)}</span></button>`;
  }
  function reactsHtml(m) {
    const rs = m.reactions || [];
    return rs.length ? `<div class="msg-reacts">${rs.map((r) => `<button type="button" class="msg-rx${r.mine ? " mine" : ""}"
      data-rx="${m.id}" data-e="${e(r.e)}" title="${e(r.who.join(", "))}" aria-pressed="${r.mine}">${e(r.e)}<b>${r.n}</b></button>`).join("")}</div>` : "";
  }
  function bubble(m) {
    const own = m.author_id === me.id, group = detail.chat.kind === "group";
    if (m.author_id === NEXUS) {
      if (String(m.client_id || "").startsWith("sys-")) {
        return `<div class="msg-sys" data-message="${m.id}">${e(m.text)}</div>`;
      }
      const no = /^iss-(\d+)-/.exec(m.client_id || "");
      // Заявка на материалы: согласовать, что заказано и выдано (22.10.2026).
      const rq = /^req-(\d+)-/.exec(m.client_id || "");
      // Обращение в совет Вектор: совет отвечает автору напрямую.
      const ap = /^wg-appeal-[0-9a-f]{8}-(.+)$/.exec(m.client_id || "");
      // Задача (правка № 6): открыть и — исполнителю — «Взять в работу», «Завершить».
      const tk = /^task-(\d+)-/.exec(m.client_id || "");
      return `<article class="msg-message msg-nxm" data-message="${m.id}">${acts(m)}
        <div class="msg-nxm-h">${icon.nexus}<b>Nexus</b><time title="${e(stamp(m.at, true))}">${stamp(m.at)}</time></div>
        <div class="msg-text">${rich(m.text, detail.chat.issues)}</div>
        ${no ? `<button type="button" class="msg-nxm-go" data-issue="${no[1]}">Открыть правку № ${no[1]}</button>` : ""}
        ${rq && typeof REQ === "object" ? `<button type="button" class="msg-nxm-go" data-req-no="${rq[1]}">Открыть заявку № ${rq[1]}</button>` : ""}
        ${ap && ap[1] !== me.id ? `<button type="button" class="msg-nxm-go" data-dm="${e(ap[1])}">${icon.reply}Ответить автору</button>` : ""}
        ${tk && typeof TASKS === "object" ? `<div class="msg-task"><button type="button" class="msg-nxm-go" data-task-open="${tk[1]}">${
          icon.task}Открыть задачу #${tk[1]}</button><span class="msg-task-acts" data-task-acts="${tk[1]}">${taskActs(tk[1])}</span></div>` : ""}
        ${reactsHtml(m)}</article>`;
    }
    const files = filesHtml(m);
    return `<article class="msg-message${own ? " own" : ""}${files && !m.text && !m.reply && !m.fwd ? " bare" : ""}${
      selected.has(m.id) ? " sel" : ""}" data-message="${m.id}">
      ${!own && group ? `<b class="msg-author">${e(m.author_name)}</b>` : ""}${acts(m)}${quote(m.reply)}
      ${m.fwd ? `<div class="msg-fwd">${icon.fwd}Переслано от <b>${e(m.fwd.author)}</b>${m.fwd.chat ? ` · «${e(m.fwd.chat)}»` : ""}</div>` : ""}
      ${files}${m.text ? `<div class="msg-text">${rich(m.text, detail.chat.issues)}</div>` : ""}
      ${reactsHtml(m)}<footer>${m.edited_at ? `<span class="msg-edited" title="Изменено ${e(stamp(m.edited_at, true))}">изм. ${
        e(editStamp(m.edited_at))}</span>` : ""}<time title="${e(stamp(m.at, true))}">${stamp(m.at)}</time>
      ${own ? `<span data-receipt="${m.id}">${receipt(m)}</span>` : ""}</footer></article>`;
  }
  // Сообщение перерисовать на месте — после реакции.
  function repaint(m) {
    const el = $m(`#msgFeed [data-message="${m.id}"]`);
    if (el) el.outerHTML = bubble(m);
  }
  function conversation() {
    const chat = detail.chat;
    const channel = chat.kind === "channel", bot = chat.kind === "bot";
    // В ленту Нексуса пишут только администраторы — от его имени; в чат
    // напоминаний — только сам Nexus.
    const compose = bot ? false : !channel || detail.can_post;
    $m("#msgConversation").innerHTML = `<header class="msg-conv-head${channel ? " nexus" : ""}">
      <button type="button" class="msg-back" id="msgBack" aria-label="Вернуться к чатам">${icon.back}</button>
      <button type="button" class="msg-heading" id="msgInfo" data-photo="${e(chat.photo || "")}">${chatAvatar({ ...chat, avatar: rows.find((r) => r.id === current)?.avatar })}
        <span><b>${e(chat.title)}</b><span id="msgSub">${e(subtitle(chat))}</span></span></button>
      <span class="msg-head-gap"></span>
      ${chat.muted ? `<span class="msg-head-ic" title="Без звука">${icon.bellOff}</span>` : ""}
      <button type="button" class="msg-head-btn" id="msgMore" title="Сведения о чате" aria-label="Сведения о чате">${icon.dots}</button>
    </header><div class="msg-selbar" id="msgSelBar" hidden></div><div class="msg-status" id="msgStatus" role="status" aria-live="polite"></div>
    <div class="msg-feed${channel ? " nexus" : ""}" id="msgFeed" role="log" aria-label="Сообщения" aria-live="polite"></div>
    ${compose ? "" : bot && current.startsWith("nt-") ? `<div class="msg-channel-note">${icon.nexus}<span>Сюда приходят уведомления о
      ваших задачах: поручили, сменился статус или срок, написали в обсуждение. «Взять в работу» и «Завершить» — прямо в
      уведомлении; все задачи — в разделе «Задачи».</span></div>` : bot ? `<div class="msg-channel-note">${icon.nexus}<span>Сюда Nexus присылает вам напоминания — например,
      о днях рождения бригадиров за пять дней. Отвечать сюда не нужно.</span></div>`
      : `<div class="msg-channel-note">${icon.nexus}<span>Здесь Nexus публикует пакеты обновлений платформы:
      что изменилось и когда. Отвечать сюда не нужно — вопросы по работе задайте Трейсу, кнопка «Спросить».</span></div>`}
    <form class="msg-compose${channel ? " nexus" : ""}" id="msgCompose"${compose ? "" : " hidden"}>
      <div class="msg-replybar" id="msgReplyBar" hidden></div>
      <div class="msg-replybar msg-editbar" id="msgEditBar" hidden></div>
      <div class="msg-todo" id="msgTodo" hidden></div>
      <div class="msg-mention" id="msgMention" role="listbox" hidden></div>
      <div class="msg-tray" id="msgTray" hidden></div>
      <div class="msg-emoji" id="msgEmoji" hidden>${["👍", "✅", "🙂", "👋", "🙏", "💬", "❗", "❤️"].map((x) =>
        `<button type="button" data-emoji="${x}" aria-label="Вставить ${x}">${x}</button>`).join("")}</div>
      ${channel ? "" : `<button type="button" class="msg-clip" id="msgClip" aria-label="Прикрепить фото или файл"
        title="Прикрепить фото или файл">${icon.clip}</button><input type="file" id="msgFile" multiple hidden>`}
      <button type="button" class="msg-smile" id="msgSmile" aria-label="Выбрать эмодзи" aria-expanded="false">☺</button>
      <textarea id="msgInput" rows="1" maxlength="4000" placeholder="${channel
        ? "От имени Nexus: первая строка — заголовок, пункты — с новой строки через «• »"
        : chat.issues ? "Опишите ошибку или правку — она попадёт в «Правки и ошибки»"
        : "Написать сообщение… «/todo @имя что сделать до пятницы» — задача"}"
        aria-label="Текст сообщения"></textarea>
      <button type="submit" class="btn msg-send" id="msgSend" aria-label="${channel ? "Опубликовать" : "Отправить сообщение"}">${icon.send}</button>
      ${channel ? "<small>Увидят все сотрудники · Enter — опубликовать · Shift + Enter — новая строка</small>" : ""}
    </form>`;
    $m("#msgBack").addEventListener("click", () => {
      ++generation; current = ""; opened = false; detail = null;
      $m(".msg-shell").classList.remove("has-chat"); paintList(); emptyConversation();
    });
    $m("#msgInfo").addEventListener("click", info);
    $m("#msgMore").addEventListener("click", info);
    const feed = $m("#msgFeed");
    // Вверх — бесконечно (правка № 6): у верха ленты подгружаются предыдущие.
    feed.addEventListener("scroll", () => {
      stick = atBottom(); markRead();
      if (feed.scrollTop < 160 && older && !fetching) loadHistory();
    }, { passive: true });
    // Меню сообщения по правой кнопке мыши (правка № 6).
    feed.addEventListener("contextmenu", (ev) => {
      const art = ev.target.closest(".msg-message[data-message]");
      if (!art || ev.target.closest("a") || detail.chat.kind === "channel") return;
      const m = messages.find((x) => x.id === Number(art.dataset.message));
      if (!m || String(m.client_id || "").startsWith("sys-")) return;
      ev.preventDefault();
      menu(m, ev.clientX, ev.clientY);
    });
    // Картинка догрузилась — лента у низа остаётся у низа.
    feed.addEventListener("load", (ev) => {
      if (ev.target.tagName === "IMG" && stick) feed.scrollTop = feed.scrollHeight;
    }, true);
    feed.addEventListener("click", (ev) => {
      // Выбор нескольких: щелчок по сообщению — отметить.
      if (selecting) {
        const art = ev.target.closest(".msg-message[data-message]");
        if (art && !ev.target.closest("a,[data-pic]")) { toggleSel(Number(art.dataset.message)); return; }
      }
      const tko = ev.target.closest("[data-task-open]");
      if (tko && typeof TASKS === "object") { TASKS.openCard(Number(tko.dataset.taskOpen)); return; }
      const tka = ev.target.closest("[data-task-act]");
      if (tka) { taskAct(Number(tka.dataset.taskNo), tka.dataset.taskAct, tka); return; }
      const more = ev.target.closest("[data-more]");
      if (more) {
        const m = messages.find((x) => x.id === Number(more.dataset.more));
        const r = more.getBoundingClientRect();
        if (m) menu(m, r.left, r.bottom + 4);
        return;
      }
      if (ev.target.closest("[data-older]")) loadHistory();
      if (ev.target.closest("[data-newer]")) syncMessages(true);
      const un = ev.target.closest("[data-unpost]");
      if (un) unpost(Number(un.dataset.unpost));
      const pic = ev.target.closest("[data-pic]");
      if (pic) {
        const all = messages.flatMap((m) => (m.files || []).filter((f) => f.kind === "image")
          .map((f) => ({ ...f, author: m.author_name, at: m.at })));
        lightbox(all, all.findIndex((f) => f.id === pic.dataset.pic));
      }
      const iss = ev.target.closest("[data-issue]");
      if (iss) { ev.preventDefault(); openIssue(Number(iss.dataset.issue)); }
      const rqb = ev.target.closest("[data-req-no]");
      if (rqb && typeof REQ === "object") { REQ.openNo(Number(rqb.dataset.reqNo)); return; }
      const to = ev.target.closest("[data-toissue]");
      if (to) toIssue(Number(to.dataset.toissue), to);
      const byId = (id) => messages.find((x) => x.id === Number(id));
      const rp = ev.target.closest("[data-reply]");
      if (rp) { const m = byId(rp.dataset.reply); if (m) setReply(m); return; }
      const rc = ev.target.closest("[data-react]");
      if (rc) { const m = byId(rc.dataset.react); if (m) reactPick(m, rc); return; }
      const rx = ev.target.closest("[data-rx]");
      if (rx) { react(Number(rx.dataset.rx), rx.dataset.e); return; }
      const go = ev.target.closest("[data-goto]");
      if (go) { jump(Number(go.dataset.goto)); return; }
      const dm = ev.target.closest("[data-dm]");
      if (dm) { writeTo(dm.dataset.dm, dm); return; }
      // На телефоне наведения нет: касание сообщения показывает его кнопки.
      const bub = ev.target.closest(".msg-message");
      if (bub && matchMedia("(pointer: coarse)").matches && !ev.target.closest("a,button")) {
        feed.querySelectorAll(".msg-message.acts-on").forEach((x) => x !== bub && x.classList.remove("acts-on"));
        bub.classList.toggle("acts-on");
      }
    });
    if (!compose) return;
    const input = $m("#msgInput");
    input.value = draft(current).text;
    const resize = () => { input.style.height = "auto"; input.style.height = Math.min(132, input.scrollHeight) + "px"; };
    input.addEventListener("input", () => {
      if (!editing) saveDraft(current, { ...draft(current), text: input.value });
      if (sendErrors.delete(current)) status();
      resize();
      todoWatch(input.value);
      mentionWatch(input);
    });
    input.addEventListener("keydown", (ev) => {
      if (mentionKey(ev, input)) return;
      if (ev.key === "Escape" && editing) { ev.preventDefault(); cancelEdit(); return; }
      if (ev.key === "Enter" && !ev.shiftKey && !ev.isComposing && !matchMedia("(pointer: coarse)").matches) {
        ev.preventDefault(); send();
      }
    });
    $m("#msgEditBar").addEventListener("click", (ev) => { if (ev.target.closest("[data-unedit]")) cancelEdit(); });
    $m("#msgTodo").addEventListener("change", () => todoPaintHint());
    $m("#msgMention").addEventListener("mousedown", (ev) => {
      const b = ev.target.closest("[data-mention]");
      if (b) { ev.preventDefault(); mentionPut(input, b.dataset.mention); }
    });
    // Снимок экрана из буфера (Win + Shift + S, Ctrl + V) — вложением.
    input.addEventListener("paste", (ev) => {
      const fs = [...(ev.clipboardData?.files || [])];
      if (fs.length && !isChannel()) { ev.preventDefault(); attach(fs); }
    });
    $m("#msgCompose").addEventListener("submit", (ev) => { ev.preventDefault(); send(); });
    $m("#msgSmile").addEventListener("click", () => {
      const el = $m("#msgEmoji"); el.hidden = !el.hidden;
      $m("#msgSmile").setAttribute("aria-expanded", String(!el.hidden));
    });
    $m("#msgEmoji").addEventListener("click", (ev) => {
      const btn = ev.target.closest("[data-emoji]");
      if (!btn) return;
      input.setRangeText(btn.dataset.emoji, input.selectionStart, input.selectionEnd, "end");
      input.value = input.value.slice(0, 4000);
      input.dispatchEvent(new Event("input")); input.focus();
    });
    if ($m("#msgClip")) {
      $m("#msgClip").addEventListener("click", () => $m("#msgFile").click());
      $m("#msgFile").addEventListener("change", (ev) => { attach([...ev.target.files]); ev.target.value = ""; });
      $m("#msgTray").addEventListener("click", (ev) => {
        const x = ev.target.closest("[data-unup]");
        if (x) unattach(current, x.dataset.unup);
      });
    }
    $m("#msgReplyBar").addEventListener("click", (ev) => {
      if (ev.target.closest("[data-unreply]")) { replies.delete(current); paintReply(); input.focus(); }
      else if (ev.target.closest("[data-goto]")) jump(Number(ev.target.closest("[data-goto]").dataset.goto));
    });
    $m("#msgSend").disabled = sending.has(current);
    if (sendErrors.has(current)) status(sendErrors.get(current), true);
    paintTray();
    paintReply();
    paintEdit();
    resize();
    todoWatch(input.value);
    paintSel();
  }

  /* ── ответы и реакции (22.10.2026) ──────────────────────── */
  function paintReply() {
    const bar = $m("#msgReplyBar");
    if (!bar) return;
    const m = replies.get(current);
    bar.hidden = !m;
    if (!m) { bar.innerHTML = ""; return; }
    const what = m.text ? firstLine(m.text) : lastText(m);
    // Как в телеграме: стрелка «ответ», имя и начало сообщения — без склонения имени.
    bar.innerHTML = `${icon.reply}<button type="button" class="msg-replybar-t" data-goto="${m.id}" title="Ответ на сообщение — показать его">
      <b>${e(m.author_id === NEXUS ? "Nexus" : m.author_name)}</b><span>${e(what)}</span></button>
      <button type="button" class="msg-replybar-x" data-unreply title="Не отвечать" aria-label="Отменить ответ">${icon.x}</button>`;
  }
  function setReply(m) {
    replies.set(current, m);
    paintReply();
    const input = $m("#msgInput"); if (input) input.focus();
  }
  // К сообщению в ленте — прокрутить и подсветить; ушло в историю — сказать.
  function jump(id) {
    const el = $m(`#msgFeed [data-message="${id}"]`);
    if (!el) { status("Это сообщение выше — загрузите предыдущие сообщения"); return; }
    el.scrollIntoView({ block: "center", behavior: "smooth" });
    el.classList.remove("flash"); void el.offsetWidth; el.classList.add("flash");
  }
  async function react(mid, emoji) {
    const id = current, gen = generation;
    try {
      const out = await api("POST", base(id) + "/messages/" + mid + "/react", { emoji });
      if (gen !== generation) return;
      const m = messages.find((x) => x.id === mid);
      if (m) { m.reactions = out.reactions; repaint(m); }
    } catch (err) { if (gen === generation) status(err.message, true); }
  }
  function reactPick(m, anchor) {
    document.querySelectorAll(".msg-rxpick").forEach((x) => x.remove());
    const pop = document.createElement("div");
    pop.className = "msg-rxpick";
    pop.setAttribute("role", "menu");
    const mine = (m.reactions || []).find((r) => r.mine);
    pop.innerHTML = REACTIONS.map((x) => `<button type="button" role="menuitem" data-pick="${x}"${mine && mine.e === x
      ? ' class="on"' : ""} aria-label="Реакция ${x}">${x}</button>`).join("");
    document.body.appendChild(pop);
    // Кнопка видна только при наведении; спрятанная — без размеров, тогда
    // ставим набор у самого сообщения.
    const b = (anchor.offsetParent ? anchor : anchor.closest(".msg-message") || anchor).getBoundingClientRect();
    pop.style.top = Math.round(b.top - pop.offsetHeight - 6 > 8 ? b.top - pop.offsetHeight - 6 : b.bottom + 6) + "px";
    pop.style.left = Math.round(Math.max(8, Math.min(b.right - pop.offsetWidth, innerWidth - pop.offsetWidth - 8))) + "px";
    const close = () => { pop.remove(); document.removeEventListener("pointerdown", off, true); document.removeEventListener("keydown", esc, true); };
    const off = (ev) => { if (!pop.contains(ev.target)) close(); };
    const esc = (ev) => { if (ev.key === "Escape") { ev.stopPropagation(); close(); anchor.focus(); } };
    document.addEventListener("pointerdown", off, true);
    document.addEventListener("keydown", esc, true);
    pop.addEventListener("click", (ev) => {
      const p = ev.target.closest("[data-pick]");
      if (p) { close(); react(m.id, p.dataset.pick); }
    });
    $m("button", pop).focus();
  }
  // Реакции поменялись (счётчик чата сдвинулся) — перечитать у сообщений ленты.
  async function syncReacts() {
    const id = current, gen = generation;
    const ids = messages.slice(-300).map((m) => m.id);
    if (!ids.length) return;
    const out = await api("GET", base(id) + "/reactions?ids=" + ids.join(","));
    if (gen !== generation) return;
    reactRev = out.rev;
    for (const m of messages) {
      const got = out.rows[String(m.id)];
      if (got && JSON.stringify(got) !== JSON.stringify(m.reactions || [])) { m.reactions = got; repaint(m); }
    }
  }
  // «Ответить автору» обращения в совет — личный чат с ним.
  async function writeTo(uid, btn) {
    btn.disabled = true;
    try {
      const out = await api("POST", "/chats", { kind: "direct", members: [uid] });
      await refreshList(); await open(out.id);
    } catch (err) { status(err.message, true); btn.disabled = false; }
  }
  function atBottom() {
    const el = $m("#msgFeed");
    return el && el.scrollHeight - el.scrollTop - el.clientHeight < 70;
  }
  function receipt(m) {
    const peers = detail.members.filter((r) => r.id !== me.id);
    const n = peers.filter((r) => r.last_read >= m.id).length;
    return n ? detail.chat.kind === "direct" ? "Прочитано" : `Прочитано ${n} из ${peers.length}` : "Отправлено";
  }
  function paintMessages(mode = "update", firstNewId = null) {
    const feed = $m("#msgFeed");
    if (!feed) return;
    const wasBottom = atBottom(), oldHeight = feed.scrollHeight, top = feed.scrollTop;
    let day = "";
    feed.innerHTML = `${older ? '<button type="button" class="msg-history" data-older>Предыдущие сообщения</button>' : ""}
      ${messages.length ? messages.map((m) => {
        const date = new Date(m.at).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
        const heading = day !== date ? `<div class="msg-day">${e(date)}</div>` : ""; day = date;
        if (detail.chat.kind === "channel") {
          return `${heading}<article class="msg-message msg-upd" data-message="${m.id}">
            <div class="msg-upd-h">${icon.nexus}<span>${String(m.client_id || "").startsWith("upd-") ? "Пакет обновлений"
              : "Nexus"}</span><time title="${e(stamp(m.at, true))}">${e(stamp(m.at, true))}</time>${detail.can_post
              && String(m.client_id || "").startsWith("adm-") ? `<button type="button" class="msg-upd-x" data-unpost="${m.id}"
              title="Убрать запись" aria-label="Убрать запись">${icon.trash}</button>` : ""}</div>
            <div class="msg-upd-b">${update(m.text)}</div></article>`;
        }
        return heading + bubble(m);
      }).join("") : `<p class="msg-empty-small">${detail.chat.kind === "channel" ? "Пакетов обновлений пока нет."
        : "Сообщений ещё нет. Напишите первым."}</p>`}
      ${newer ? '<button type="button" class="msg-history" data-newer>Следующие сообщения ↓</button>' : ""}`;
    const contentTop = (id) => {
      const el = feed.querySelector(`[data-message="${id}"]`);
      return el ? el.getBoundingClientRect().top - feed.getBoundingClientRect().top + feed.scrollTop : undefined;
    };
    const unread = messages.find((m) => m.author_id !== me.id && m.id > readCursor);
    feed.scrollTop = MSG_VIEW.scrollTop({ mode, top, oldHeight, height: feed.clientHeight,
      newHeight: feed.scrollHeight, wasBottom, firstUnread: unread ? contentTop(unread.id) : undefined,
      firstNew: firstNewId ? contentTop(firstNewId) : undefined });
    stick = atBottom();
    markRead();
    fillTasks();
  }
  async function open(id, at = 0) {
    shell();
    const gen = ++generation; current = id; opened = false; messages = []; readCursor = 0;
    $m(".msg-shell").classList.add("has-chat"); paintList();
    $m("#msgConversation").innerHTML = '<p class="msg-empty-small">Загружаю переписку…</p>';
    try {
      const [d, out] = await Promise.all([api("GET", base(id)), api("GET", base(id) + (at
        ? "/messages?around=" + at : "/messages?unread=1"))]);
      if (gen !== generation) return;
      detail = d; messages = out.rows; older = out.has_older; newer = out.has_newer;
      reactRev = d.chat.react_rev || 0;
      readCursor = d.members.find((r) => r.id === me.id)?.last_read || 0;
      selecting = false; selected.clear();
      opened = true; conversation(); paintMessages("initial");
      // Из задачи «Перейти к сообщению в чате» — к нему и подсветить.
      if (at) requestAnimationFrame(() => jump(at));
      if (!matchMedia("(max-width: 684px)").matches && $m("#msgInput")) $m("#msgInput").focus();
    } catch (err) {
      if (gen !== generation) return;
      $m("#msgConversation").innerHTML = `<div class="msg-welcome"><h2>Не удалось открыть чат</h2><p>${e(err.message)}</p>
        <button type="button" class="btn" id="msgRetry">Повторить</button><button type="button" class="btn ghost" id="msgReturn">К чатам</button></div>`;
      $m("#msgRetry").addEventListener("click", () => open(id));
      $m("#msgReturn").addEventListener("click", () => { ++generation; current = "";
        $m(".msg-shell").classList.remove("has-chat"); emptyConversation(); });
    }
  }
  async function syncMessages(force = false) {
    if (!opened || fetching || (newer && !force)) return;
    const id = current, gen = generation; fetching = true;
    try {
      const last = messages.at(-1)?.id || 0;
      const out = await api("GET", base(id) + "/messages?after=" + last);
      if (gen !== generation) return;
      const existing = new Set(messages.map((m) => m.id));
      messages.push(...out.rows.filter((m) => !existing.has(m.id)));
      newer = out.has_newer;
      if (out.rows.length || force) paintMessages("append", out.rows[0]?.id);
      if (!sendErrors.has(id)) status();
    } catch (err) { if (gen === generation) status(err.message + ". Повторим подключение автоматически.", true); }
    finally { fetching = false; }
  }
  async function loadHistory() {
    if (fetching || !older || !messages.length) return;
    const id = current, gen = generation; fetching = true;
    try {
      const out = await api("GET", base(id) + "/messages?before=" + messages[0].id);
      if (gen !== generation) return;
      messages.unshift(...out.rows); older = out.has_older; paintMessages("prepend");
    } catch (err) { if (gen === generation) status(err.message, true); }
    finally { fetching = false; }
  }
  async function markRead() {
    if (!opened || !active() || document.querySelector(".msg-overlay") || reading || !messages.length) return;
    const feed = $m("#msgFeed"), bounds = feed.getBoundingClientRect();
    const last = MSG_VIEW.readCursor([...feed.querySelectorAll("[data-message]")].map((el) => ({
      id: Number(el.dataset.message), bottom: el.getBoundingClientRect().bottom,
    })), bounds.top, bounds.bottom, readCursor);
    if (last <= readCursor) return;
    const id = current, gen = generation; reading = true;
    try {
      const out = await api("POST", base(id) + "/read", { last_read: last });
      if (gen !== generation) return;
      readCursor = Math.max(readCursor, out.last_read);
      await refreshList();
    } catch (_) { /* Следующий цикл повторит отметку. */ }
    finally { reading = false; }
  }

  /* ── меню сообщения (правка № 6, 21.10.2026) ─────────────
     «По правой кнопке мыши — „Удалить“, „Редактировать“, „Поставить
     задачу“, „Выбрать“, „Переслать“, „Ответить“ и „Копировать“;
     отредактированное — с отметкой „изм. дата:время“». Свои сообщения
     правит и удаляет автор, чужие удаляет администратор; сообщение, по
     которому задача в работе, сервер удалить не даст. */
  const editStamp = (at) => new Date(at).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit",
    hour: "2-digit", minute: "2-digit" }).replace(",", "");
  function menu(m, x, y) {
    document.querySelectorAll(".msg-ctx").forEach((el) => el.remove());
    const own = m.author_id === me.id, nexus = m.author_id === NEXUS;
    const talk = detail.chat.kind === "group" || detail.chat.kind === "direct";
    const items = [];
    if (canReply()) items.push(["reply", icon.reply, "Ответить"]);
    if (m.text) items.push(["copy", icon.copy, "Копировать"]);
    if (own && talk && !nexus) items.push(["edit", icon.edit, "Редактировать"]);
    if (talk && !nexus && typeof TASKS === "object") items.push(["task", icon.task, "Поставить задачу"]);
    items.push(["fwd", icon.fwd, "Переслать"]);
    if (talk) items.push(["select", icon.select, "Выбрать"]);
    if (talk && !nexus && (own || isAdmin())) items.push(["del", icon.trash, "Удалить"]);
    const pop = document.createElement("div");
    pop.className = "msg-ctx";
    pop.setAttribute("role", "menu");
    pop.innerHTML = items.map(([k, ic, t]) => `<button type="button" role="menuitem" data-ctx="${k}"${k === "del"
      ? ' class="warn"' : ""}>${ic}<span>${t}</span></button>`).join("");
    document.body.appendChild(pop);
    pop.style.left = Math.round(Math.max(8, Math.min(x, innerWidth - pop.offsetWidth - 8))) + "px";
    pop.style.top = Math.round(Math.max(8, Math.min(y, innerHeight - pop.offsetHeight - 8))) + "px";
    const close = () => { pop.remove(); document.removeEventListener("pointerdown", off, true);
      document.removeEventListener("keydown", esc, true); $m("#msgFeed")?.removeEventListener("scroll", close); };
    const off = (ev) => { if (!pop.contains(ev.target)) close(); };
    const esc = (ev) => { if (ev.key === "Escape") { ev.stopPropagation(); close(); } };
    document.addEventListener("pointerdown", off, true);
    document.addEventListener("keydown", esc, true);
    $m("#msgFeed")?.addEventListener("scroll", close, { once: true });
    pop.addEventListener("click", (ev) => {
      const b = ev.target.closest("[data-ctx]");
      if (!b) return;
      close();
      const k = b.dataset.ctx;
      if (k === "reply") setReply(m);
      else if (k === "copy") copyText([m]);
      else if (k === "edit") startEdit(m);
      else if (k === "task") TASKS.fromMessage(current, m.id).then((t) => { if (t) syncMessages(true); });
      else if (k === "fwd") forwardDialog([m.id]);
      else if (k === "select") { selecting = true; selected.clear(); toggleSel(m.id); }
      else if (k === "del") removeMessages([m]);
    });
    $m("button", pop)?.focus();
  }
  async function copyText(list) {
    const text = list.map((m) => (list.length > 1 ? `${m.author_id === NEXUS ? "Nexus" : m.author_name}, ${stamp(m.at, true)}:\n` : "")
      + (m.text || "")).join("\n\n");
    try { await navigator.clipboard.writeText(text); status(list.length > 1 ? `Скопировано сообщений: ${list.length}` : "Текст скопирован"); }
    catch (_) { status("Не вышло скопировать — браузер не дал доступа к буферу", true); }
  }
  // Правка: текст — в строку ввода, сверху полоса «Редактирование».
  function startEdit(m) {
    editing = { chat: current, id: m.id, text: m.text };
    replies.delete(current); paintReply();
    const input = $m("#msgInput");
    input.value = m.text || "";
    input.dispatchEvent(new Event("input"));
    paintEdit();
    input.focus();
  }
  function paintEdit() {
    const bar = $m("#msgEditBar");
    if (!bar) return;
    const on = !!(editing && editing.chat === current);
    bar.hidden = !on;
    bar.innerHTML = on ? `${icon.edit}<span class="msg-replybar-t"><b>Редактирование</b><span>${e(firstLine(editing.text))}</span></span>
      <button type="button" class="msg-replybar-x" data-unedit title="Не править (Esc)" aria-label="Отменить правку">${icon.x}</button>` : "";
  }
  function cancelEdit() {
    editing = null;
    const input = $m("#msgInput");
    if (input) { input.value = draft(current).text || ""; input.dispatchEvent(new Event("input")); }
    paintEdit();
  }
  async function sendEdit() {
    const id = current, input = $m("#msgInput"), text = input.value.trim(), mid = editing.id;
    if (text === (editing.text || "").trim()) { cancelEdit(); return; }
    sending.add(id); $m("#msgSend").disabled = true;
    try {
      const out = await api("PATCH", base(id) + "/messages/" + mid, { text });
      const i = messages.findIndex((x) => x.id === mid);
      if (i >= 0) { messages[i] = out.message; repaint(out.message); }
      editing = null; input.value = draft(id).text || ""; paintEdit(); input.dispatchEvent(new Event("input"));
      status("Сообщение изменено");
    } catch (err) { status("Не изменено: " + err.message, true); }
    finally { sending.delete(id); if ($m("#msgSend")) $m("#msgSend").disabled = false; }
  }
  async function removeMessages(list) {
    const mine = list.filter((m) => m.author_id === me.id || (isAdmin() && m.author_id !== NEXUS));
    if (!mine.length) { status("Удалить можно только свои сообщения", true); return; }
    const one = mine.length === 1;
    if (!(await ASK.confirm(one ? "Удалить сообщение? Его не увидит никто в чате."
      : `Удалить сообщения: ${mine.length}? Их не увидит никто в чате.`, { title: "Мессенджер", ok: "Удалить", danger: true }))) return;
    const id = current, gone = [];
    let fail = "";
    for (const m of mine) {
      try { await api("DELETE", base(id) + "/messages/" + m.id); gone.push(m.id); }
      catch (err) { fail = err.message; }
    }
    if (current !== id) return;
    messages = messages.filter((m) => !gone.includes(m.id));
    gone.forEach((x) => selected.delete(x));
    paintMessages("update"); paintSel(); refreshList();
    status(fail ? (gone.length ? `Удалено ${gone.length}. ` : "") + fail : one ? "Сообщение удалено" : `Удалено сообщений: ${gone.length}`, !!fail);
  }
  // Переслать: выбрать чат — сообщения уйдут туда с пометкой, от кого.
  function forwardDialog(ids) {
    const from = current;
    const list = rows.filter((r) => r.kind === "group" || r.kind === "direct");
    const box = modal("Переслать", `<input class="msg-picker-search" type="search" placeholder="Найти чат" aria-label="Найти чат">
      <div class="msg-people msg-fwd-list"></div>`);
    const paint = () => {
      const q = $m(".msg-picker-search", box.el).value.toLocaleLowerCase("ru");
      $m(".msg-fwd-list", box.el).innerHTML = list.filter((r) => r.title.toLocaleLowerCase("ru").includes(q)).map((r) => `<button type="button"
        class="msg-person" data-fwd-to="${e(r.id)}">${chatAvatar(r)}<span><b>${e(r.title)}</b><small>${r.kind === "group"
        ? memberCount(r.member_count) : "личный чат"}</small></span></button>`).join("") || '<p class="msg-empty-small">Чатов не нашлось.</p>';
    };
    paint();
    $m(".msg-picker-search", box.el).addEventListener("input", paint);
    $m(".msg-fwd-list", box.el).addEventListener("click", async (ev) => {
      const b = ev.target.closest("[data-fwd-to]");
      if (!b) return;
      b.disabled = true;
      try {
        const out = await api("POST", "/forward", { from, to: b.dataset.fwdTo, ids });
        box.close();
        selecting = false; selected.clear(); paintSel(); paintMessages("update");
        const t = (rows.find((r) => r.id === out.to) || {}).title || "чат";
        status(`Переслано в «${t}»: ${out.count}`);
        await refreshList();
      } catch (err) { box.error(err); b.disabled = false; }
    });
  }
  // Выбор нескольких: полоса над лентой — переслать, скопировать, удалить.
  function toggleSel(mid) {
    if (selected.has(mid)) selected.delete(mid); else selected.add(mid);
    const el = $m(`#msgFeed [data-message="${mid}"]`);
    if (el) el.classList.toggle("sel", selected.has(mid));
    paintSel();
  }
  function paintSel() {
    const bar = $m("#msgSelBar"), feed = $m("#msgFeed");
    if (!bar) return;
    if (feed) feed.classList.toggle("selecting", selecting);
    bar.hidden = !selecting;
    if (!selecting) { bar.innerHTML = ""; return; }
    const n = selected.size;
    bar.innerHTML = `<b>Выбрано: ${n}</b><span class="msg-head-gap"></span>
      <button type="button" class="btn ghost sm" data-sel="fwd"${n ? "" : " disabled"}>${icon.fwd}Переслать</button>
      <button type="button" class="btn ghost sm" data-sel="copy"${n ? "" : " disabled"}>${icon.copy}Копировать</button>
      <button type="button" class="btn ghost sm warn" data-sel="del"${n ? "" : " disabled"}>${icon.trash}Удалить</button>
      <button type="button" class="msg-replybar-x" data-sel="off" title="Закончить выбор" aria-label="Закончить выбор">${icon.x}</button>`;
    bar.onclick = (ev) => {
      const b = ev.target.closest("[data-sel]");
      if (!b) return;
      const list = messages.filter((m) => selected.has(m.id));
      if (b.dataset.sel === "off") { selecting = false; selected.clear(); paintSel(); paintMessages("update"); }
      else if (b.dataset.sel === "fwd") forwardDialog([...selected]);
      else if (b.dataset.sel === "copy") copyText(list);
      else if (b.dataset.sel === "del") removeMessages(list);
    };
  }

  /* ── задачи в чате (правка № 6) ──────────────────────────
     Строка «/todo @Иван Подготовить КП до пятницы 15:00»: сервер узнаёт
     исполнителей и срок, над строкой — что получится, срок можно
     поправить; Enter ставит задачу, Nexus кладёт её карточку в чат. */
  function todoWatch(text) {
    const box = $m("#msgTodo");
    if (!box) return;
    const on = /^\s*\/(todo|задача)(?=\s|$)/i.test(text) && !editing && canReply();
    clearTimeout(todoTimer);
    if (!on) { todo = null; box.hidden = true; box.innerHTML = ""; return; }
    const seq = ++todoSeq;
    todoTimer = setTimeout(async () => {
      try {
        const got = await AUTH.api("POST", "/tasks/parse", { text, chat: current });
        if (seq !== todoSeq) return;
        const was = todo;
        todo = got;
        // Срок, поправленный руками, не перетираем, пока не узнан новый.
        if (was && was.hand && !got.due) { todo.due = was.due; todo.hand = true; }
        todoPaint();
      } catch (err) { if (seq === todoSeq) { box.hidden = false; box.innerHTML = `<span class="bad">${e(err.message)}</span>`; } }
    }, 300);
  }
  function todoPaint() {
    const box = $m("#msgTodo");
    if (!box || !todo) return;
    const [dd, tt] = (todo.due || "T").split("T");
    box.hidden = false;
    box.innerHTML = `${icon.task}<div class="msg-todo-b"><b>${todo.title ? "Задача: «" + e(todo.title) + "»" : "Задача — напишите, что сделать"}</b>
      <span>${todo.assignees.length ? "Исполнитель: " + e(todo.assignees.map((p) => p.name).join(", ")) : "Исполнитель — вы (упомяните через @)"}</span></div>
      <label>Срок <input type="date" data-todo="d" value="${e(dd)}"><input type="time" data-todo="t" value="${e(tt || "18:00")}"></label>
      <small class="msg-todo-hint">${todo.due ? "Enter — поставить" : "Срок не узнан — укажите дату"}</small>`;
  }
  function todoPaintHint() {
    const box = $m("#msgTodo");
    if (!box || !todo) return;
    const d = $m('[data-todo="d"]', box).value, t = $m('[data-todo="t"]', box).value || "18:00";
    todo.due = d ? d + "T" + t : null;
    todo.hand = true;
    $m(".msg-todo-hint", box).textContent = todo.due ? "Enter — поставить" : "Срок не узнан — укажите дату";
  }
  async function sendTodo() {
    const id = current, input = $m("#msgInput");
    if (!todo || !todo.title) { status("Напишите после «/todo», что сделать", true); return; }
    if (!todo.due) { status("Укажите срок задачи — дату и время над строкой ввода", true); $m('#msgTodo [data-todo="d"]')?.focus(); return; }
    sending.add(id); $m("#msgSend").disabled = true;
    try {
      const out = await AUTH.api("POST", "/tasks", { title: todo.title, due: todo.due,
        do: todo.assignees.map((p) => p.id), src: { chat: id } });
      input.value = ""; saveDraft(id, { text: "" }); todo = null; todoWatch("");
      input.style.height = "auto";
      status(`Задача #${out.task.no} поставлена`);
      if (typeof TASKS === "object") TASKS.badge();
      stick = true;
      await syncMessages(true); await refreshList();
    } catch (err) { status("Задача не поставлена: " + err.message, true); }
    finally { sending.delete(id); if ($m("#msgSend")) $m("#msgSend").disabled = false; }
  }
  // Кнопки статуса у сообщений о задачах — по живому состоянию задачи.
  function taskActs(no) {
    const b = taskBrief.get(String(no));
    if (!b || !b.can_status) return b && b.status === "done" ? '<span class="msg-task-done">выполнена</span>' : "";
    if (b.status === "done") return '<span class="msg-task-done">выполнена</span>';
    return `${b.status === "new" ? `<button type="button" class="msg-nxm-go" data-task-act="work" data-task-no="${no}">Взять в работу</button>` : ""}
      <button type="button" class="msg-nxm-go" data-task-act="done" data-task-no="${no}">Завершить</button>`;
  }
  async function fillTasks() {
    const feed = $m("#msgFeed");
    if (!feed || typeof TASKS !== "object") return;
    const nos = [...new Set([...feed.querySelectorAll("[data-task-acts]")].map((el) => el.dataset.taskActs))];
    if (!nos.length) return;
    try {
      const out = await AUTH.api("GET", "/tasks/brief?nos=" + nos.join(","));
      nos.forEach((n) => { if (out.rows[n]) taskBrief.set(n, out.rows[n]); else taskBrief.delete(n); });
      feed.querySelectorAll("[data-task-acts]").forEach((el) => { el.innerHTML = taskActs(el.dataset.taskActs); });
    } catch (_) { /* кнопки появятся при следующей отрисовке */ }
  }
  async function taskAct(no, st, btn) {
    btn.disabled = true;
    try {
      await AUTH.api("PATCH", "/tasks/" + no, { status: st });
      status(st === "done" ? `Задача #${no} выполнена` : `Задача #${no} — в работе`);
      if (typeof TASKS === "object") TASKS.badge();
      await syncMessages(true);
      await fillTasks();
    } catch (err) { status(err.message, true); btn.disabled = false; }
  }

  /* Упоминания: «@» в строке ввода — список участников чата; выбранный
     вставляется полным именем — так его узнает и задача из сообщения. */
  function mentionAt(input) {
    const upto = input.value.slice(0, input.selectionStart);
    const mt = /(^|\s)@([\p{L}\d.-]{0,30})$/u.exec(upto);
    return mt ? { q: mt[2], start: upto.length - mt[2].length - 1 } : null;
  }
  function mentionWatch(input) {
    const box = $m("#msgMention");
    if (!box || !detail) return;
    const at = mentionAt(input);
    const list = at ? detail.members.filter((p) => p.id !== me.id && !p.blocked
      && p.name.toLocaleLowerCase("ru").split(/\s+/).some((w) => w.startsWith(at.q.toLocaleLowerCase("ru")))).slice(0, 6) : [];
    box.hidden = !list.length;
    box.innerHTML = list.map((p, i) => `<button type="button" role="option" data-mention="${e(p.name)}"${i === 0 ? ' class="on"' : ""}>${
      avatar(p)}<span>${e(p.name)}</span></button>`).join("");
  }
  function mentionPut(input, name) {
    const at = mentionAt(input);
    if (!at) return;
    const end = input.selectionStart;
    input.setRangeText("@" + name + " ", at.start, end, "end");
    $m("#msgMention").hidden = true;
    input.dispatchEvent(new Event("input"));
    input.focus();
  }
  function mentionKey(ev, input) {
    const box = $m("#msgMention");
    if (!box || box.hidden) return false;
    const opts = [...box.querySelectorAll("[data-mention]")];
    const i = opts.findIndex((o) => o.classList.contains("on"));
    if (ev.key === "ArrowDown" || ev.key === "ArrowUp") {
      ev.preventDefault();
      const j = (i + (ev.key === "ArrowDown" ? 1 : -1) + opts.length) % opts.length;
      opts.forEach((o, k) => o.classList.toggle("on", k === j));
      return true;
    }
    if ((ev.key === "Enter" || ev.key === "Tab") && opts[i]) { ev.preventDefault(); mentionPut(input, opts[i].dataset.mention); return true; }
    if (ev.key === "Escape") { ev.preventDefault(); box.hidden = true; return true; }
    return false;
  }

  /* ── вложения ───────────────────────────────────────────── */
  const tray = (id = current) => { if (!trays.has(id)) trays.set(id, []); return trays.get(id); };
  // Фото уменьшаем, как мессенджеры: больше 2560 точек или 2,5 МБ — в JPEG.
  async function prepare(file) {
    const out = { blob: file, name: file.name || "файл", kind: "file", w: 0, h: 0 };
    if (!/^image\/(jpeg|png|webp|gif)$/.test(file.type)) return out;
    try {
      const bmp = await createImageBitmap(file);
      out.kind = "image"; out.w = bmp.width; out.h = bmp.height;
      const big = Math.max(bmp.width, bmp.height) > PHOTO_SIDE || file.size > 2.5e6;
      if (!big || file.type === "image/gif") { bmp.close?.(); return out; }
      const k = Math.min(1, PHOTO_SIDE / Math.max(bmp.width, bmp.height));
      const c = document.createElement("canvas");
      c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
      const g = c.getContext("2d");
      g.fillStyle = "#fff"; g.fillRect(0, 0, c.width, c.height);
      g.drawImage(bmp, 0, 0, c.width, c.height); bmp.close?.();
      const blob = await new Promise((ok) => c.toBlob(ok, "image/jpeg", 0.86));
      if (blob && blob.size < file.size) {
        Object.assign(out, { blob, w: c.width, h: c.height, name: out.name.replace(/\.[a-z0-9]+$/i, "") + ".jpg" });
      }
    } catch (_) { /* не картинка для браузера — отправим файлом */ }
    return out;
  }
  async function attach(files) {
    const id = current;
    if (!opened || isChannel(id) || !files.length) return;
    const list = tray(id);
    const room = FILES_MAX - list.length;
    if (room <= 0) { status(`В одном сообщении — до ${FILES_MAX} вложений`, true); return; }
    if (files.length > room) status(`Прикреплены первые ${room}: в одном сообщении — до ${FILES_MAX} вложений`, true);
    for (const file of files.slice(0, room)) {
      if (file.size > FILE_MAX) { status(`«${file.name}» больше ${FILE_MAX >> 20} МБ — такой файл не отправить`, true); continue; }
      const u = { key: Math.random().toString(36).slice(2), name: file.name || "файл", size: file.size, got: 0,
        kind: "file", url: "", id: "", fid: "", done: false, error: "", xhr: null, removed: false };
      u.finished = new Promise((ok) => { u.finish = ok; });
      list.push(u); paintTray();
      const p = await prepare(file);
      Object.assign(u, { blob: p.blob, name: p.name, size: p.blob.size, kind: p.kind, w: p.w, h: p.h });
      if (p.kind === "image") u.url = URL.createObjectURL(p.blob);
      paintTray(); pump(id);
    }
  }
  function unattach(id, key) {
    const list = tray(id), i = list.findIndex((u) => u.key === key);
    if (i < 0) return;
    const [u] = list.splice(i, 1);
    u.removed = true;
    if (u.xhr) u.xhr.abort();
    if (u.url) URL.revokeObjectURL(u.url);
    u.finish();
    paintTray(); pump(id);
  }
  // Загрузка по одному файлу за раз: десяток фото параллельно забил бы канал.
  function pump(id) {
    const list = tray(id);
    if (list.some((u) => u.xhr || u.busy)) return;
    const next = list.find((u) => u.blob && !u.done && !u.error && !u.removed);
    if (next) upload(id, next).then(() => pump(id));
  }
  function chunk(id, u, offset) {
    return new Promise((ok, fail) => {
      const x = new XMLHttpRequest();
      u.xhr = x;
      x.open("POST", "/api/messenger" + base(id) + "/files");
      x.setRequestHeader("Authorization", "Bearer " + AUTH.token());
      x.setRequestHeader("X-File-Size", String(u.blob.size));
      x.setRequestHeader("X-File-Offset", String(offset));
      x.setRequestHeader("Content-Type", u.blob.type || "application/octet-stream");
      if (u.fid) x.setRequestHeader("X-File-Id", u.fid);
      else {
        x.setRequestHeader("X-File-Name", encodeURIComponent(u.name));
        if (u.w && u.h) { x.setRequestHeader("X-Img-W", String(u.w)); x.setRequestHeader("X-Img-H", String(u.h)); }
      }
      x.upload.onprogress = (ev) => { if (ev.lengthComputable) { u.got = offset + ev.loaded; paintTray(); } };
      x.onload = () => {
        let d = null;
        try { d = JSON.parse(x.responseText); } catch (_) { /* не наш ответ */ }
        if (x.status === 200 && d) ok(d);
        else fail(new Error((d && d.error) || (x.status === 413 ? "больше, чем принимает сервер" : "ошибка " + x.status)));
      };
      x.onerror = () => fail(new Error("нет связи с сервером"));
      x.onabort = () => fail(new Error("отменено"));
      x.send(u.blob.slice(offset, offset + CHUNK));
    });
  }
  async function upload(id, u) {
    u.busy = true;
    let offset = 0;
    try {
      while (offset < u.blob.size && !u.removed) {
        const d = await chunk(id, u, offset);
        u.fid = d.id; offset = d.got; u.got = offset;
        if (d.done) { u.id = d.id; u.done = true; }
      }
    } catch (err) { if (!u.removed) u.error = err.message; }
    u.xhr = null; u.busy = false; u.finish();
    if (current === id) paintTray();
  }
  function paintTray() {
    const host = $m("#msgTray");
    if (!host) return;
    const list = tray();
    host.hidden = !list.length;
    host.innerHTML = list.map((u) => {
      const pct = u.size ? Math.min(100, Math.round((u.got * 100) / u.size)) : 0;
      return `<div class="msg-up${u.error ? " bad" : u.done ? " ok" : ""}">
        ${u.url ? `<img src="${e(u.url)}" alt="">` : `<span class="msg-doc-ic">${e(extOf(u.name))}</span>`}
        <span class="msg-up-t"><b title="${e(u.name)}">${e(u.name)}</b><small>${u.error ? "Не загрузилось: " + e(u.error)
          : u.done ? size(u.size) : !u.blob ? "Готовлю…" : `${pct}% · ${size(u.size)}`}</small></span>
        ${u.done || u.error ? "" : `<i class="msg-up-bar"><b style="width:${pct}%"></b></i>`}
        <button type="button" data-unup="${e(u.key)}" title="Убрать" aria-label="Убрать вложение">${icon.x}</button></div>`;
    }).join("");
  }

  async function send() {
    if (!opened || sending.has(current)) return;
    if (editing && editing.chat === current) { await sendEdit(); return; }
    if (todo && /^\s*\/(todo|задача)(?=\s|$)/i.test($m("#msgInput").value)) { await sendTodo(); return; }
    const id = current, input = $m("#msgInput"), text = input.value.trim();
    const list = isChannel(id) ? [] : tray(id);
    if (!text && !list.length) { input.focus(); return; }
    sending.add(id); sendErrors.delete(id); $m("#msgSend").disabled = true;
    try {
      if (list.some((u) => !u.done && !u.error)) {
        status("Догружаю вложения…");
        await Promise.all(list.map((u) => u.finished));
      }
      const bad = list.filter((u) => u.error);
      if (bad.length) throw new Error(`не загрузилось «${bad[0].name}» — уберите его или прикрепите заново`);
      const ids = list.filter((u) => u.done).map((u) => u.id);
      const sig = text + "|" + ids.join(",");
      const d = draft(id);
      const key = d.pendingText === sig && d.key ? d.key : (crypto.randomUUID ? crypto.randomUUID() :
        Date.now().toString(36) + Math.random().toString(36).slice(2));
      saveDraft(id, { text: input.value, pendingText: sig, key });
      status("Отправляю…");
      const body = { text, client_id: key };
      if (ids.length) body.files = ids;
      if (replies.has(id) && !isChannel(id)) body.reply_to = replies.get(id).id;
      await api("POST", isChannel(id) ? "/nexus/messages" : base(id) + "/messages", body);
      if (draft(id).text.trim() === text) saveDraft(id, { text: "" });
      for (const u of list.splice(0)) if (u.url) URL.revokeObjectURL(u.url);
      replies.delete(id);
      if (current !== id || !opened) return;
      paintTray(); paintReply();
      const editor = $m("#msgInput");
      if (editor.value.trim() === text) { editor.value = ""; editor.style.height = "auto"; }
      status(newer ? "Отправлено. Ниже доступны следующие сообщения." : "");
      stick = true;
      await syncMessages(); await refreshList();
    } catch (err) {
      const error = "Не отправлено: " + err.message + ". Текст и вложения сохранены — нажмите отправить ещё раз.";
      sendErrors.set(id, error);
      if (current === id && opened) status(error, true);
    } finally {
      sending.delete(id);
      if (current === id && opened && $m("#msgSend")) { $m("#msgSend").disabled = false; $m("#msgInput").focus(); }
    }
  }

  /* ── просмотр фото ──────────────────────────────────────── */
  function lightbox(list, index) {
    if (!list.length) return;
    let i = Math.max(0, index);
    const previous = document.activeElement, box = document.createElement("div");
    box.className = "msg-overlay msg-lb";
    box.setAttribute("role", "dialog"); box.setAttribute("aria-modal", "true"); box.setAttribute("aria-label", "Просмотр фото");
    const paint = () => {
      const f = list[i];
      box.innerHTML = `<div class="msg-lb-bar"><span>${e(f.name)}${f.author ? " · " + e(f.author) : ""}${f.at ? " · " + e(stamp(f.at, true)) : ""}${
        list.length > 1 ? ` · ${i + 1} из ${list.length}` : ""}</span>
        <a class="msg-lb-btn" href="${e(fileUrl(f))}" download="${e(f.name)}" title="Скачать">${icon.down}</a>
        <button type="button" class="msg-lb-btn" data-close title="Закрыть · Esc">${icon.x}</button></div>
        ${list.length > 1 ? `<button type="button" class="msg-lb-nav prev" data-step="-1" aria-label="Предыдущее">${icon.left}</button>
          <button type="button" class="msg-lb-nav next" data-step="1" aria-label="Следующее">${icon.right}</button>` : ""}
        <img class="msg-lb-img" src="${e(fileUrl(f, "view"))}" alt="${e(f.name)}">`;
    };
    const close = () => { box.remove(); document.removeEventListener("keydown", key, true); previous?.focus?.(); };
    const step = (d) => { i = (i + d + list.length) % list.length; paint(); };
    const key = (ev) => {
      if (ev.key === "Escape") { ev.stopPropagation(); close(); }
      if (ev.key === "ArrowLeft" && list.length > 1) step(-1);
      if (ev.key === "ArrowRight" && list.length > 1) step(1);
    };
    box.addEventListener("click", (ev) => {
      if (ev.target === box || ev.target.closest("[data-close]")) close();
      const s = ev.target.closest("[data-step]");
      if (s) step(Number(s.dataset.step));
    });
    document.addEventListener("keydown", key, true);
    paint(); document.body.appendChild(box);
    $m("[data-close]", box)?.focus();
  }

  function modal(title, html, cls = "") {
    const previous = document.activeElement, overlay = document.createElement("div");
    overlay.className = "msg-overlay";
    overlay.innerHTML = `<section class="msg-modal${cls ? " " + cls : ""}" role="dialog" aria-modal="true" aria-label="${e(title)}">
      ${cls ? "" : `<header><h2>${e(title)}</h2><button type="button" class="btn ghost sm" data-close aria-label="Закрыть">✕</button></header>`}
      <div class="msg-modal-body">${html}</div><p class="msg-modal-error" role="alert" hidden></p></section>`;
    const close = () => { overlay.remove(); previous?.focus(); };
    overlay.addEventListener("click", (ev) => { if (ev.target === overlay || ev.target.closest("[data-close]")) close(); });
    overlay.addEventListener("keydown", (ev) => {
      if (ev.key === "Escape" && !document.querySelector(".msg-lb")) close();
      if (ev.key === "Tab") {
        const els = [...overlay.querySelectorAll('button,input,textarea,select,a[href]')].filter((el) => !el.disabled && el.getClientRects().length);
        if (ev.shiftKey && document.activeElement === els[0]) { ev.preventDefault(); els.at(-1)?.focus(); }
        if (!ev.shiftKey && document.activeElement === els.at(-1)) { ev.preventDefault(); els[0]?.focus(); }
      }
    });
    document.body.appendChild(overlay);
    $m("input,button", overlay)?.focus();
    return { el: overlay, close, body: (h) => { $m(".msg-modal-body", overlay).innerHTML = h; },
      error: (err) => { const p = $m(".msg-modal-error", overlay); p.textContent = err ? err.message : ""; p.hidden = !err; } };
  }
  async function picker(adding = false) {
    const chatId = current;
    const existing = new Set(adding ? detail.members.map((m) => m.id) : []);
    const box = modal(adding ? "Добавить участников" : "Новый чат", `<div class="msg-picker-mode"${adding ? " hidden" : ""}>
      <button type="button" class="selected" data-kind="direct">Личный</button><button type="button" data-kind="group">Группа</button></div>
      <label class="fld" id="msgTitleWrap" hidden><span>Название группы</span><input id="msgTitleInput" maxlength="120" placeholder="Например, рабочая группа ПТО"></label>
      <input class="msg-picker-search" type="search" placeholder="Найти сотрудника" aria-label="Найти сотрудника">
      <div class="msg-people"><p class="msg-empty-small">Загружаю сотрудников…</p></div>
      <footer><span class="msg-selected-count"></span><button type="button" class="btn" data-create>${adding ? "Добавить" : "Открыть чат"}</button></footer>`);
    let people = [], kind = adding ? "group" : "direct", chosen = new Set();
    const paint = () => {
      const q = $m(".msg-picker-search", box.el).value.toLocaleLowerCase("ru");
      const filtered = people.filter((p) => (p.name + " " + p.job_title).toLocaleLowerCase("ru").includes(q));
      $m(".msg-people", box.el).innerHTML = filtered.length ? filtered.map((p) => `<label class="msg-person">
        <input type="${kind === "direct" ? "radio" : "checkbox"}" name="msgPerson" value="${e(p.id)}"${chosen.has(p.id) ? " checked" : ""}>
        ${avatar(p)}<span><b>${e(p.name)}</b><small>${e(p.job_title)}</small></span></label>`).join("")
        : '<p class="msg-empty-small">Сотрудники не найдены.</p>';
      $m(".msg-selected-count", box.el).textContent = chosen.size ? `Выбрано: ${chosen.size}` : "Выберите сотрудников";
    };
    box.el.querySelectorAll("[data-kind]").forEach((btn) => btn.addEventListener("click", () => {
      kind = btn.dataset.kind; chosen = new Set();
      box.el.querySelectorAll("[data-kind]").forEach((b) => b.classList.toggle("selected", b === btn));
      $m("#msgTitleWrap", box.el).hidden = kind !== "group";
      $m("[data-create]", box.el).textContent = kind === "group" ? "Создать группу" : "Открыть чат"; paint();
    }));
    $m(".msg-picker-search", box.el).addEventListener("input", paint);
    $m(".msg-people", box.el).addEventListener("change", (ev) => {
      if (kind === "direct") chosen.clear();
      ev.target.checked ? chosen.add(ev.target.value) : chosen.delete(ev.target.value); paint();
    });
    $m("[data-create]", box.el).addEventListener("click", async (ev) => {
      if (!chosen.size) { box.error(new Error("Выберите хотя бы одного сотрудника")); return; }
      ev.target.disabled = true;
      try {
        const out = adding ? await api("PATCH", base(chatId), { members: [...chosen] })
          : await api("POST", "/chats", { kind, title: $m("#msgTitleInput", box.el).value, members: [...chosen] });
        box.close(); await refreshList(); await open(adding ? chatId : out.id);
      } catch (err) { box.error(err); ev.target.disabled = false; }
    });
    try { people = (await api("GET", "/people")).rows.filter((p) => !existing.has(p.id)); paint(); }
    catch (err) { box.error(err); }
  }
  async function unpost(mid) {
    if (!(await ASK.confirm("Убрать эту запись из чата «Nexus»? Её больше не увидит никто."))) return;
    try {
      await api("DELETE", "/nexus/messages/" + mid);
      messages = messages.filter((m) => m.id !== mid);
      paintMessages("update"); await refreshList();
    } catch (err) { status(err.message, true); }
  }
  // Правки и ошибки — свой раздел (src/issues.js).
  function openIssue(no) {
    if (no && typeof ISSUES === "object") ISSUES.open(no);
  }
  async function toIssue(mid, btn) {
    btn.disabled = true;
    try {
      const out = await AUTH.api("POST", "/issues/from-message", { message_id: mid });
      status(`Правка № ${out.issue.no} заведена — Nexus ответил в чате.`);
      await syncMessages(true);
    } catch (err) { status(err.message, true); }
    finally { btn.disabled = false; }
  }

  /* ── карточка чата (как в телеграме) ────────────────────── */
  function close() {
    ++generation; current = ""; opened = false; detail = null;
    $m(".msg-shell")?.classList.remove("has-chat"); paintList(); emptyConversation();
  }
  function info() {
    if (!detail) return;
    if (detail.chat.kind === "channel") {
      const box = modal("Nexus", `<div class="msg-nx-info">${icon.nexus}<p>Добрый колдун, создатель Платформы. В этот чат он
        публикует пакеты обновлений: что изменилось и когда. Чат закреплён у всех сотрудников, отвечать в него не нужно.</p></div>
        <footer><span class="msg-selected-count">${detail.can_post ? "Вы можете публиковать от имени Nexus" : ""}</span>
        <button type="button" class="btn" data-profile>Профиль Nexus</button></footer>`);
      $m("[data-profile]", box.el).addEventListener("click", () => { box.close(); if (typeof NEXUS === "object") NEXUS.open(); });
      return;
    }
    const id = current;
    const box = modal(detail.chat.title, "", "msg-card");
    let view = "main", d = detail;
    const apply = async (method, path, body) => {
      box.error(null);
      d = await api(method, path, body);
      if (current === id) { detail = d; refreshHead(d); }
      refreshList().catch(() => {});
      paint();
    };
    const top = (chat) => `<div class="mc-top">${chatAvatar({ ...chat, avatar: rows.find((r) => r.id === id)?.avatar }, true)}
      <h2>${e(chat.title)}</h2><span>${e(subtitle(chat))}</span></div>`;
    const head = (title) => `<header class="mc-head"><button type="button" class="mc-icon" data-view="main" aria-label="Назад">${icon.back}</button>
      <h2>${e(title)}</h2><button type="button" class="mc-icon" data-close aria-label="Закрыть">${icon.x}</button></header>`;
    function main() {
      const chat = d.chat, group = chat.kind === "group", n = d.media || {};
      const peer = group ? null : d.members.find((m) => m.id !== me.id);
      const media = [["image", icon.image, plural(n.image || 0, "фотография", "фотографии", "фотографий")],
        ["file", icon.file, plural(n.file || 0, "файл", "файла", "файлов")],
        ["link", icon.link, plural(n.link || 0, "ссылка", "ссылки", "ссылок")]];
      return `<button type="button" class="mc-x" data-close aria-label="Закрыть">${icon.x}</button>${top(chat)}
        <div class="mc-acts">
          <button type="button" data-act="mute" class="${chat.muted ? "off" : ""}">${chat.muted ? icon.bellOff : icon.bell}<span>${chat.muted ? "Без звука" : "Звук"}</span></button>
          ${d.can_manage || d.can_issues || d.can_site ? `<button type="button" data-view="manage">${icon.sliders}<span>Управление</span></button>` : ""}
          ${group && !chat.managed ? `<button type="button" data-act="leave">${icon.exit}<span>Покинуть</span></button>` : ""}
          <button type="button" data-act="more" aria-expanded="false">${icon.dots}<span>Ещё</span></button>
        </div>
        <div class="mc-menu" hidden>
          <button type="button" data-act="pin">${icon.pin}${chat.pinned ? "Открепить чат" : "Закрепить чат сверху"}</button>
          ${d.can_issues ? `<button type="button" data-act="issues">${icon.bug}${chat.issues ? "Не собирать правки из чата" : "Собирать правки из этого чата"}</button>` : ""}
          ${d.can_manage ? `<button type="button" data-act="delete" class="bad">${icon.trash}Удалить группу у всех</button>` : ""}
        </div>
        ${chat.issues ? `<p class="mc-note">${icon.bug}<span>Чат правок${chat.section_name ? " · " + e(chat.section_name) : ""}: сообщения
          попадают в «Правки и ошибки», Nexus отвечает номером правки.</span></p>` : ""}
        ${chat.managed === "wg" ? `<p class="mc-note">${icon.vector}<span>Чат совета Вектор: идеи и обсуждения, голос — реакцией
          👍 / 👎. Состав — члены совета, у кого открыт раздел «Вектор»; его меняют в «Пользователи → Доступ».</span></p>` : ""}
        ${group && (chat.site_name || d.can_site) ? `<p class="mc-row-t"><small>Объект</small>${chat.site_name
          ? e(chat.site_name) : '<span class="dim">не выбран — выберите в «Управлении»</span>'}</p>` : ""}
        ${peer && peer.job_title ? `<p class="mc-row-t"><small>Должность</small>${e(peer.job_title)}</p>` : ""}
        <div class="mc-list">${media.map(([k, ic, label]) => `<button type="button" data-media="${k}"${n[k] ? "" : " disabled"}>
          ${ic}<span>${label}</span></button>`).join("")}</div>
        ${group ? `<div class="mc-people-h">${icon.users}<b>${e(memberCount(d.members.length).toUpperCase())}</b>
          ${d.can_manage ? `<button type="button" class="mc-icon" data-act="add" title="Добавить участников" aria-label="Добавить участников">${icon.userPlus}</button>` : ""}</div>
          <div class="mc-people">${d.members.map((m) => `<div class="mc-person">${avatar(m)}
            <span><b>${e(m.name)}${m.id === me.id ? " (вы)" : ""}</b><small class="${online(m.seen) ? "on" : ""}">${m.blocked
              ? "учётная запись недоступна" : e(seenText(m.seen))}${m.id === chat.created_by ? " · создатель" : ""}</small></span>
            ${d.can_manage && m.id !== me.id ? `<button type="button" class="mc-icon" data-kick="${e(m.id)}" title="Убрать из группы"
              aria-label="Убрать ${e(m.name)} из группы">${icon.x}</button>` : ""}</div>`).join("")}</div>` : ""}`;
    }
    function manage() {
      const chat = d.chat, secs = d.sections || {};
      return `${head("Управление")}
        ${d.can_manage ? `<div class="mc-photo">${chatAvatar({ ...chat }, true)}<div>
          <button type="button" class="btn ghost sm" data-act="photo">${chat.photo ? "Сменить фото" : "Загрузить фото"}</button>
          ${chat.photo ? '<button type="button" class="btn ghost sm" data-act="unphoto">Убрать фото</button>' : ""}
          <input type="file" id="mcPhoto" accept="image/jpeg,image/png,image/webp" hidden></div></div>
          <label class="fld"><span>Название группы</span><input id="mcTitle" maxlength="120" value="${e(chat.title)}"></label>
          <div class="mc-line"><button type="button" class="btn sm" data-act="rename">Сохранить название</button>
          <button type="button" class="btn ghost sm" data-act="add">${icon.userPlus}Добавить участников</button></div>` : ""}
        ${d.can_site ? `<label class="fld"><span>Объект</span><select id="mcSite">${[{ id: "", name: "Без объекта" },
          ...(d.sites || [])].map((s) => `<option value="${e(s.id)}"${s.id === (chat.site_id || "") ? " selected" : ""}>${
          e(s.name)}</option>`).join("")}</select></label>
          <p class="mc-hint">По объекту чаты группируются в списке (кнопка у поиска) и находятся поиском.</p>` : ""}
        ${d.can_issues ? `<div class="mc-box"><label class="mc-switch"><input type="checkbox" id="mcIssues"${chat.issues ? " checked" : ""}>
          <span><b>Чат правок</b><small>Каждое сообщение — кроме «ок», «спасибо» и ответов администраторов — станет правкой в разделе
          «Правки и ошибки», а Nexus ответит её номером. Картинка, присланная рядом с текстом, станет снимком правки.</small></span></label>
          <label class="fld"><span>Раздел правок</span><select id="mcSection">${Object.entries({ "": "Разные разделы", ...secs })
            .map(([k, v]) => `<option value="${e(k)}"${k === chat.section ? " selected" : ""}>${e(v)}</option>`).join("")}</select></label></div>` : ""}`;
    }
    async function mediaView(kind) {
      const titles = { image: "Фотографии", file: "Файлы", link: "Ссылки" };
      box.body(`${head(titles[kind])}<p class="msg-empty-small">Загружаю…</p>`);
      let list = [];
      try { list = (await api("GET", base(id) + "/media?kind=" + kind)).rows; }
      catch (err) { box.error(err); return; }
      if (view !== "media") return;
      const when = (r) => ` · ${e(r.author)} · ${e(stamp(r.at, true))}`;
      box.body(`${head(titles[kind])}${!list.length ? '<p class="msg-empty-small">Пока ничего нет.</p>'
        : kind === "image" ? `<div class="mc-grid">${list.map((f, i) => `<button type="button" data-lb="${i}" title="${e(f.name)}">
          <img src="${e(fileUrl(f, "thumb"))}" alt="${e(f.name)}" loading="lazy"></button>`).join("")}</div>`
        : kind === "file" ? `<div class="mc-files">${list.map((f) => docHtml(f, when(f))).join("")}</div>`
        : `<div class="mc-links">${list.map((r) => `<a href="${e(r.url)}" target="_blank" rel="noopener noreferrer">${icon.link}
          <span><b>${e(r.url)}</b><small>${e(r.author)} · ${e(stamp(r.at, true))}</small></span></a>`).join("")}</div>`}`);
      if (kind === "image") {
        box.el.querySelectorAll("[data-lb]").forEach((b) => b.addEventListener("click", () => lightbox(list, Number(b.dataset.lb))));
      }
    }
    function paint() {
      if (view === "manage") box.body(manage());
      else box.body(main());
    }
    // Фото группы — квадрат 320 точек из середины картинки.
    async function photo(file) {
      const bmp = await createImageBitmap(file);
      const side = Math.min(bmp.width, bmp.height), c = document.createElement("canvas");
      c.width = c.height = 320;
      c.getContext("2d").drawImage(bmp, (bmp.width - side) / 2, (bmp.height - side) / 2, side, side, 0, 0, 320, 320);
      const blob = await new Promise((ok) => c.toBlob(ok, "image/jpeg", 0.88));
      const r = await fetch("/api/messenger" + base(id) + "/photo", { method: "POST",
        headers: { Authorization: "Bearer " + AUTH.token(), "Content-Type": "image/jpeg" }, body: blob });
      let x = null;
      try { x = await r.json(); } catch (_) { /* не наш ответ */ }
      if (!r.ok) throw new Error((x && x.error) || "Не удалось загрузить фото");
      return x;
    }
    box.el.addEventListener("click", async (ev) => {
      const v = ev.target.closest("[data-view]");
      if (v) { view = v.dataset.view; paint(); return; }
      const md = ev.target.closest("[data-media]");
      if (md && !md.disabled) { view = "media"; mediaView(md.dataset.media); return; }
      const kick = ev.target.closest("[data-kick]");
      if (kick) {
        const who = d.members.find((m) => m.id === kick.dataset.kick);
        if (!(await ASK.confirm(`Убрать ${who ? who.name : "сотрудника"} из группы «${d.chat.title}»?`))) return;
        try { await apply("DELETE", base(id) + "/members/" + encodeURIComponent(kick.dataset.kick)); }
        catch (err) { box.error(err); }
        return;
      }
      const a = ev.target.closest("[data-act]");
      if (!a) return;
      const act = a.dataset.act;
      try {
        if (act === "more") {
          const m = $m(".mc-menu", box.el); m.hidden = !m.hidden; a.setAttribute("aria-expanded", String(!m.hidden));
        } else if (act === "mute") await apply("PATCH", base(id) + "/me", { muted: !d.chat.muted });
        else if (act === "pin") await apply("PATCH", base(id) + "/me", { pinned: !d.chat.pinned });
        else if (act === "issues") await apply("PATCH", base(id), { issues: !d.chat.issues });
        else if (act === "add") { box.close(); picker(true); }
        else if (act === "rename") await apply("PATCH", base(id), { title: $m("#mcTitle", box.el).value });
        else if (act === "photo") $m("#mcPhoto", box.el).click();
        else if (act === "unphoto") await apply("DELETE", base(id) + "/photo");
        else if (act === "leave") {
          if (!(await ASK.confirm(`Покинуть группу «${d.chat.title}»?\nПереписка останется у остальных; вернуть вас сможет создатель группы.`))) return;
          await api("POST", base(id) + "/leave", {});
          box.close(); close(); await refreshList();
        } else if (act === "delete") {
          if (!(await ASK.confirm(`Удалить группу «${d.chat.title}» у всех участников?\nПереписка и вложения удалятся безвозвратно.`))) return;
          await api("DELETE", base(id));
          box.close(); close(); await refreshList();
        }
      } catch (err) { box.error(err); }
    });
    box.el.addEventListener("change", async (ev) => {
      try {
        if (ev.target.id === "mcPhoto" && ev.target.files[0]) {
          d = await photo(ev.target.files[0]);
          if (current === id) { detail = d; refreshHead(d); }
          refreshList().catch(() => {}); paint();
        }
        if (ev.target.id === "mcIssues") await apply("PATCH", base(id), { issues: ev.target.checked, section: $m("#mcSection", box.el).value });
        if (ev.target.id === "mcSection") await apply("PATCH", base(id), { section: ev.target.value });
        if (ev.target.id === "mcSite") await apply("PATCH", base(id), { site_id: ev.target.value });
      } catch (err) { box.error(err); }
    });
    paint();
  }
  async function poll() {
    clearTimeout(timer);
    if (polling || !me || !AUTH.current() || me.must_change_pw) return;
    polling = true;
    if (!document.hidden) {
      try {
        await refreshList();
        if (active() && opened) {
          const id = current, gen = generation;
          const d = await api("GET", base(id));
          if (gen === generation) {
            detail = d;
            refreshHead(d);
            document.querySelectorAll("[data-receipt]").forEach((el) => {
              const m = messages.find((m) => m.id === Number(el.dataset.receipt)); if (m) el.textContent = receipt(m);
            });
            await syncMessages();
            // Кто-то поставил или снял реакцию — перечитать их у ленты.
            if ((d.chat.react_rev || 0) !== reactRev) await syncReacts();
            await markRead();
          }
        }
      } catch (err) { if (active()) status(err.message + ". Повторим подключение автоматически.", true); }
    }
    polling = false;
    timer = setTimeout(poll, active() ? 3000 : 15000);
  }
  function init(user) {
    if (me || !user || user.must_change_pw) return;
    me = user; poll();
    document.addEventListener("visibilitychange", () => { if (!document.hidden) { clearTimeout(timer); timer = setTimeout(poll, 100); } });
    window.addEventListener("online", () => { clearTimeout(timer); timer = setTimeout(poll, 100); });
    // Звук браузер разрешает только после касания страницы — заводим его тогда.
    document.addEventListener("pointerdown", () => {
      try { audio = audio || new (window.AudioContext || window.webkitAudioContext)(); audio.resume(); } catch (_) { /* без звука */ }
    }, { once: true });
  }
  async function show() {
    init(AUTH.current()); shell();
    if (!polling) { clearTimeout(timer); timer = setTimeout(poll, 100); }
    try { await refreshList(); if (opened) markRead(); }
    catch (err) { if (!listReady) $m("#msgList").innerHTML = `<p class="msg-empty-small">${e(err.message)}</p>`; }
  }
  /* Лента Нексуса — из его экрана: раздел «Мессенджер», чат сразу открыт. */
  async function openChannel() {
    if (typeof openSection === "function") openSection("msg");
    await open(CHANNEL);
  }
  // Чат по id — из правки («Открыть в чате»).
  async function openChat(id) {
    if (typeof openSection === "function") openSection("msg");
    await open(id);
  }
  // Чат на нужном сообщении — из задачи (правка № 6).
  async function openAt(id, mid) {
    if (typeof openSection === "function") openSection("msg");
    await open(id, Number(mid) || 0);
  }
  const channel = () => rows.find((r) => r.id === CHANNEL) || null;
  return { init, show, openChannel, openChat, openAt, channel };
})();
