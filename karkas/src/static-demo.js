/* Browser-only presentation of Karkas. No account or server is used here. */
(() => {
  "use strict";
  const script = document.currentScript;
  const base = new URL("../", script ? script.src : location.href);
  const nativeFetch = window.fetch.bind(window);
  const clone = value => value === undefined ? undefined : JSON.parse(JSON.stringify(value));
  const prefix = "karkas-static-demo:v1:";
  let backing;
  try { backing = window.localStorage; } catch (_) { backing = null; }
  const memory = new Map();
  const store = {
    getItem(key) {
      try { return backing ? backing.getItem(prefix + key) : memory.get(String(key)) ?? null; }
      catch (_) { return memory.get(String(key)) ?? null; }
    },
    setItem(key, value) {
      memory.set(String(key), String(value));
      try { if (backing) backing.setItem(prefix + key, String(value)); } catch (_) { /* session memory */ }
    },
    removeItem(key) {
      memory.delete(String(key));
      try { if (backing) backing.removeItem(prefix + key); } catch (_) { /* session memory */ }
    },
    clear() {
      memory.clear();
      try {
        if (backing) for (let i = backing.length - 1; i >= 0; i--) {
          const key = backing.key(i);
          if (key && key.startsWith(prefix)) backing.removeItem(key);
        }
      } catch (_) { /* session memory */ }
    },
    key(index) {
      const keys = [];
      try {
        if (backing) for (let i = 0; i < backing.length; i++) {
          const key = backing.key(i);
          if (key && key.startsWith(prefix)) keys.push(key.slice(prefix.length));
        }
      } catch (_) { /* session memory */ }
      return (keys.length ? keys : [...memory.keys()])[index] ?? null;
    },
    get length() {
      let n = 0;
      try {
        if (backing) for (let i = 0; i < backing.length; i++) if (backing.key(i)?.startsWith(prefix)) n++;
      } catch (_) { /* session memory */ }
      return n || memory.size;
    },
  };
  // Keep this public demo's preferences and edits separate from other ii41.ru projects.
  try { Object.defineProperty(window, "localStorage", { configurable: true, value: store }); }
  catch (_) { /* all demo state below still uses the scoped store */ }
  store.setItem("karkas-token", "public-demo-session");
  if (!store.getItem("karkas.tsk.tab.v1")) store.setItem("karkas.tsk.tab.v1", "mine");
  let state;
  try { state = JSON.parse(store.getItem("edits") || "{}"); } catch (_) { state = {}; }
  if (!state || typeof state !== "object") state = {};
  state.tasks = state.tasks || {};
  state.messages = state.messages || {};
  state.overrides = state.overrides || {};
  state.deletedTasks = state.deletedTasks || [];
  const save = () => store.setItem("edits", JSON.stringify(state));

  let fixtures = {};
  const ready = nativeFetch(new URL("data/demo-api.json", base).href, { cache: "no-cache" })
    .then(r => { if (!r.ok) throw new Error("Demo examples could not load"); return r.json(); })
    .then(data => {
      fixtures = data.responses || data;
      window.KARKAS_DEMO_READY = true;
      return fixtures;
    }).catch(error => {
      console.warn("Karkas demo:", error.message);
      notify("Не удалось загрузить примеры. Обновите страницу.");
      return fixtures;
    });

  function apiPath(path) {
    const match = path.match(/(?:^|\/)api(?=\/|$)/);
    if (!match) return null;
    return "/api" + path.slice(match.index + match[0].length).replace(/\/$/, "");
  }
  function canonical(path, search = "") {
    const q = new URLSearchParams(search);
    for (const key of ["_", "t", "ts", "v"]) q.delete(key);
    q.sort();
    return path + (q.toString() ? "?" + q.toString() : "");
  }
  function findFixture(path, search = "") {
    const wanted = canonical(path, search);
    const direct = [wanted, path + search, wanted.replace(/^\/api/, ""), path.replace(/^\/api/, "")];
    for (const key of direct) {
      if (Object.prototype.hasOwnProperty.call(state.overrides, key)) return clone(state.overrides[key]);
      if (Object.prototype.hasOwnProperty.call(fixtures, key)) return clone(fixtures[key]);
    }
    const candidates = Object.keys(fixtures).filter(key => {
      const raw = key.replace(/^(?:GET|POST)\s+/, "");
      return raw.split("?")[0].replace(/^\/api/, "") === path.replace(/^\/api/, "");
    });
    for (const key of candidates) {
      const raw = key.replace(/^(?:GET|POST)\s+/, "");
      if (canonical(raw.split("?")[0], raw.includes("?") ? "?" + raw.split("?")[1] : "") === wanted)
        return clone(fixtures[key]);
    }
    if (candidates.length) return clone(fixtures[candidates[0]]);
    return undefined;
  }
  function persona() {
    const user = findFixture("/api/me") || {
      id: "demo-director", username: "Алексей Воронов", name: "Алексей Воронов",
      email: "director@example.test", role: "admin", permissions: [], avatar: "", sites_all: 1,
    };
    user.must_change_pw = 0;
    return user;
  }
  function json(value, status = 200) {
    return new Response(JSON.stringify(value), { status, headers: {
      "Content-Type": "application/json; charset=utf-8", "X-Karkas-Demo": "browser-only",
    } });
  }
  function error(message = "В демоверсии доступен просмотр. Эта операция требует полной версии.") {
    notify(message);
    return json({ error: message, demo: true }, 409);
  }
  function rowsOf(value) { return Array.isArray(value) ? value : value && Array.isArray(value.rows) ? value.rows : []; }
  function people() {
    const me = persona();
    return [{ id: me.id, name: me.username || me.name }].concat(rowsOf(findFixture("/api/messenger/people")));
  }
  function person(id) {
    return people().find(p => String(p.id) === String(id)) || { id, name: "Сотрудник демокомпании" };
  }
  const statuses = { new: "Новая", work: "В работе", done: "Выполнена" };
  function hydrateTask(task) {
    const t = clone(task);
    t.no = Number(t.no || t.id);
    t.status = t.status || "new";
    t.status_name = statuses[t.status] || t.status;
    t.author = typeof t.author === "object" && t.author ? t.author : person(t.author_id || persona().id);
    t.do = (t.do || []).map(p => typeof p === "object" ? p : person(p));
    t.watch = (t.watch || []).map(p => typeof p === "object" ? p : person(p));
    t.descr = t.descr || "";
    t.checklist = t.checklist || [];
    t.thread = t.thread || [];
    t.can = { edit: true, text: true, status: true, checks: true, comment: true, delete: true };
    t.checks = { total: t.checklist.length, done: t.checklist.filter(x => x.done).length };
    t.comments = t.thread.length;
    const today = new Date();
    const due = t.due ? new Date(t.due) : null;
    const day = due ? (new Date(due.getFullYear(), due.getMonth(), due.getDate()) - new Date(today.getFullYear(), today.getMonth(), today.getDate())) / 86400000 : null;
    t.bucket = !due ? "nodue" : due < today ? "over" : day === 0 ? "today" : day <= 7 ? "week" : "later";
    t.due_text = due && !isNaN(due) ? due.toLocaleDateString("ru-RU", { day: "2-digit", month: "short" }) + ", " + due.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }) : "без срока";
    return t;
  }
  function allTasks() {
    const combined = new Map();
    for (const [key, val] of Object.entries(fixtures)) {
      if (!key.replace(/^GET\s+/, "").match(/^(?:\/api)?\/tasks(?:\?|$|\/\d+$)/)) continue;
      const list = val && val.task ? [val.task] : rowsOf(val);
      for (const task of list) if (task && (task.no || task.id)) combined.set(String(task.no || task.id), task);
    }
    for (const task of Object.values(state.tasks)) combined.set(String(task.no), task);
    return [...combined.values()].filter(t => !state.deletedTasks.includes(String(t.no || t.id))).map(hydrateTask);
  }
  function getTask(no) {
    const stored = state.tasks[no];
    const original = findFixture("/api/tasks/" + no);
    return hydrateTask(stored || original?.task || allTasks().find(t => String(t.no) === String(no)) || {
      no: Number(no), title: "Демонстрационная задача", author: person(persona().id), do: [person(persona().id)],
    });
  }
  function taskResponse(path, query, method, body) {
    if (path === "/api/tasks/badge") return json({ n: allTasks().filter(t => t.status !== "done").length });
    if (path === "/api/tasks/brief") {
      const nos = (query.get("nos") || "").split(",");
      return json({ rows: allTasks().filter(t => nos.includes(String(t.no))) });
    }
    if (path === "/api/tasks/parse" || path === "/api/tasks/draft") return error("В демоверсии создайте задачу кнопкой «Задача».");
    if (path === "/api/tasks" && method === "GET") {
      const me = String(persona().id), tab = query.get("tab") || "do", archive = query.get("archive") === "1";
      const tasks = allTasks();
      const matches = (t, tab) => tab === "mine" ? String(t.author.id) === me : (tab === "watch" ? t.watch : t.do).some(p => String(p.id) === me);
      return json({ rows: tasks.filter(t => matches(t, tab) && (t.status === "done") === archive),
        buckets: [{ key: "over", name: "Просрочено" }, { key: "today", name: "На сегодня" },
          { key: "week", name: "На неделе" }, { key: "later", name: "Позже" }, { key: "nodue", name: "Без срока" }],
        counts: Object.fromEntries(["do", "mine", "watch"].map(k => [k, tasks.filter(t => matches(t, k) && t.status !== "done").length])) });
    }
    if (path === "/api/tasks" && method === "POST") {
      const no = Math.max(100, ...allTasks().map(t => t.no || 0)) + 1;
      const task = hydrateTask({ ...body, no, author: person(persona().id), status: "new", at: new Date().toISOString(),
        checklist: (body.checklist || []).map((text, i) => ({ id: "demo-" + no + "-" + i, text, done: false })), thread: [] });
      state.tasks[no] = task; save(); notify("Задача сохранена в этом браузере");
      return json({ task });
    }
    const match = path.match(/^\/api\/tasks\/(\d+)(?:\/(checks|comments)(?:\/([^/]+))?)?$/);
    if (!match) return undefined;
    const [, no, section, item] = match;
    const task = getTask(no);
    if (method === "GET") return json({ task });
    if (method === "DELETE") { state.deletedTasks.push(no); delete state.tasks[no]; save(); return json({ ok: true }); }
    if (section === "checks") {
      if (item) task.checklist = body.delete ? task.checklist.filter(c => String(c.id) !== item)
        : task.checklist.map(c => String(c.id) === item ? { ...c, done: !!body.done } : c);
      else task.checklist.push({ id: "demo-" + Date.now(), text: body.text, done: false });
    } else if (section === "comments") {
      task.thread.push({ id: "demo-" + Date.now(), author_id: persona().id, author: persona().username,
        text: body.text, at: new Date().toISOString() });
    } else {
      Object.assign(task, body);
      if (body.status) task.done_at = body.status === "done" ? new Date().toISOString() : "";
    }
    const fresh = hydrateTask(task); state.tasks[no] = fresh; save();
    return json({ task: fresh });
  }

  function fallback(path) {
    if (/\/badge$/.test(path)) return { n: 0, unread: 0 };
    if (/\/health$/.test(path)) return { ok: true, demo: true };
    if (/\/perms$/.test(path)) return {};
    if (/\/me$/.test(path)) return persona();
    if (/\/settings$/.test(path)) return {};
    if (/\/reactions$/.test(path)) return { rows: [], rev: 0 };
    if (/\/messages$/.test(path)) return { rows: [], has_older: false, has_newer: false };
    if (/\/versions$/.test(path)) return { rows: [], versions: [] };
    if (/\/(people|chats|learn|issues|tasks|files|requests|nexus|notifications|req|supply)$/.test(path))
      return { rows: [], unread: 0, n: 0, counts: {}, people: [], programs: [], folders: [], items: [] };
    if (/\/(documents|contracts|projects|links|revisions|positions|orgs|counterparties|sites|users|customers|suppliers|works|access\/sites|prop-names)$/.test(path)) return [];
    return undefined;
  }

  window.fetch = async (input, options = {}) => {
    const url = new URL(typeof input === "string" || input instanceof URL ? input : input.url, location.href);
    const path = apiPath(url.pathname);
    if (!path) {
      if (url.origin !== location.origin) return error("В демоверсии внешние подключения отключены.");
      if (url.pathname === "/version.json") return json({ build: window.BUILD_ID || "dev" });
      if (url.pathname.startsWith("/data/")) return nativeFetch(new URL(url.pathname.slice(1) + url.search, base), options);
      return nativeFetch(input, options);
    }
    await ready;
    const method = String(options.method || (typeof input === "object" && input.method) || "GET").toUpperCase();
    let body = {};
    if (typeof options.body === "string") { try { body = JSON.parse(options.body); } catch (_) { /* non-JSON content */ } }
    if (path === "/api/me" && method === "GET") return json(persona());
    if (path === "/api/login") return json({ token: "public-demo-session", user: persona() });
    if (path === "/api/logout") return json({ ok: true });
    if (path.startsWith("/api/tasks")) {
      const result = taskResponse(path, url.searchParams, method, body);
      if (result !== undefined) return result;
    }
    if (/\/(read|seen)$/.test(path) && method !== "GET") return json({ ok: true });
    if (method === "GET" || method === "HEAD") {
      const value = findFixture(path, url.search);
      if (value !== undefined) return json(value);
      const empty = fallback(path);
      if (empty !== undefined) return json(empty);
      return json({ error: "Этот пример пока не включён в демоверсию.", demo: true }, 404);
    }
    return error();
  };

  // Original upload widgets use XHR for progress. Keep files on the visitor's device.
  if (window.XMLHttpRequest) {
    const prototype = window.XMLHttpRequest.prototype;
    const open = prototype.open, send = prototype.send;
    const requests = new WeakMap();
    prototype.open = function(method, url, ...args) {
      const target = new URL(url, location.href);
      requests.set(this, !!apiPath(target.pathname) || target.origin !== location.origin);
      return open.call(this, method, url, ...args);
    };
    prototype.send = function(body) {
      if (!requests.get(this)) return send.call(this, body);
      notify("В демоверсии файлы остаются на вашем устройстве. Загрузка доступна в полной версии.");
      setTimeout(() => this.dispatchEvent(new Event("error")), 0);
    };
  }

  let notice;
  let noticeTimer;
  function notify(message) {
    if (!document.body) { document.addEventListener("DOMContentLoaded", () => notify(message), { once: true }); return; }
    if (!notice) {
      notice = document.createElement("div");
      notice.className = "static-demo-notice";
      notice.setAttribute("role", "status");
      document.body.appendChild(notice);
    }
    notice.textContent = message;
    notice.hidden = false;
    clearTimeout(noticeTimer);
    noticeTimer = setTimeout(() => { notice.hidden = true; }, 5000);
  }
  window.KARKAS_DEMO = { ready, notify, base: base.href };

  function mount() {
    const style = document.createElement("style");
    style.textContent = `
      .static-demo-bar{position:fixed;left:50%;bottom:12px;transform:translateX(-50%);z-index:950;display:flex;align-items:center;gap:12px;max-width:calc(100vw - 24px);box-sizing:border-box;padding:10px 14px;border:1px solid rgba(153,180,255,.25);border-radius:14px;background:rgba(17,24,44,.94);color:#e7efff;box-shadow:0 8px 36px #0004;backdrop-filter:blur(18px);font:12px/1.4 system-ui,sans-serif;white-space:nowrap}
      .static-demo-bar b{font-weight:650;color:#a7c7ff}.static-demo-bar small{font-size:11px;color:#b6c2dc}.static-demo-bar button{border:1px solid #52688788;background:#263b5b55;color:#e7efff;border-radius:8px;padding:6px 10px;font:inherit;cursor:pointer}.static-demo-bar button:hover{background:#344d7388}.static-demo-bar a{color:#d4e3ff;text-decoration:none;font-size:11px}.static-demo-notice{position:fixed;bottom:78px;left:50%;transform:translateX(-50%);z-index:50000;border:1px solid #6685bb88;border-radius:12px;background:#172841;color:#fff;box-shadow:0 6px 24px #0005;max-width:calc(100vw - 32px);width:max-content;padding:13px 18px;font:13px/1.5 system-ui,sans-serif;pointer-events:none}.static-demo-notice[hidden]{display:none!important}
      .main{padding-bottom:72px!important}
      @media(max-width:684px){.static-demo-bar{bottom:8px;padding:8px 10px;gap:8px;font-size:11px}.static-demo-bar small,.static-demo-bar a{display:none}.static-demo-bar button{padding:6px 8px}.static-demo-notice{bottom:65px}}
    `;
    document.head.appendChild(style);
    const bar = document.createElement("aside");
    bar.className = "static-demo-bar";
    bar.setAttribute("aria-label", "Демонстрационная версия");
    bar.innerHTML = '<b>Демоверсия</b><small>Вымышленная компания · без регистрации</small><button type="button" data-demo-home>Обзор</button><button type="button" data-demo-reset title="Удалить только ваши изменения в этой демоверсии">Сбросить</button>';
    bar.querySelector("[data-demo-home]").addEventListener("click", () => {
      window.__adsLeaving = true;
      location.href = new URL("index.html?s=sit", base).href;
    });
    bar.querySelector("[data-demo-reset]").addEventListener("click", () => {
      store.clear();
      window.__adsLeaving = true;
      location.reload();
    });
    document.body.appendChild(bar);
    document.addEventListener("click", event => {
      const anchor = event.target.closest("a[href]");
      if (!anchor) return;
      const url = new URL(anchor.href, location.href);
      if (apiPath(url.pathname)) { event.preventDefault(); notify("Скачивание и работа с реальными файлами доступны в полной версии."); }
    }, true);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount, { once: true });
  else mount();
})();
