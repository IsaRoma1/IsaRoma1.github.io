/* Browser-only presentation of Karkas. No account or server is used here. */
(() => {
  "use strict";
  const script = document.currentScript;
  const base = new URL("../", script ? script.src : location.href);
  const entrySearch = location.search;
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
  // The snapshot stores registrations alongside each object's letters. Rebuild
  // the journal from those records so switching journals preserves their scope.
  let registrations;
  function registryRecords() {
    if (registrations) return registrations;
    const records = new Map();
    for (const row of fixtures["/api/corr"]?.rows || []) {
      records.set(row.id, { ...row, sites: [...row.sites], cards: [], log: [] });
    }
    for (const data of Object.values(fixtures)) {
      if (!data?.reg || !data.letter || !data.site) continue;
      const { reg, site, letter } = data;
      const row = records.get(reg.id) || { ...reg, sites: [...reg.sites], cards: [], log: [] };
      if (!row.sites.some(s => s.id === site.id)) row.sites.push({ id: site.id, name: site.name });
      row.cards.push({ id: letter.id, site_id: site.id, site_name: site.name, status: letter.status,
        items: (data.items || []).filter(item => ["file", "note"].includes(item.kind)).length });
      records.set(reg.id, row);
    }
    registrations = records;
    return records;
  }
  function lettersByOrg(org) {
    const list = fixtures["/api/letters/sites"];
    if (!org) return list;
    const feed = list.feed.filter(l => l.org_id === org);
    const rows = list.rows.filter(s => s.org_id === org || feed.some(l => l.site_id === s.id));
    const open = feed.filter(l => l.status === "open");
    const recent = list.feed.filter(l => l.closed_at).sort((a, b) => b.closed_at.localeCompare(a.closed_at))
      .slice(0, list.stats.closed30);
    return { ...list, org, rows, feed, stats: { open: open.length, need: open.filter(l => l.direction === "in").length,
      wait: open.filter(l => l.direction === "out").length, over14: open.filter(l => l.days >= 14).length,
      closed30: recent.filter(l => l.org_id === org).length } };
  }
  function searchLetters(query) {
    const q = (query.get("q") || "").trim(), rows = [];
    const words = q.toLowerCase().split(/\s+/);
    if (q.length >= 2) for (const card of Object.values(fixtures)) {
      const l = card?.letter;
      if (!l || !card.site || (query.get("site") && l.site_id !== query.get("site"))
          || (query.get("org") && l.org_id !== query.get("org"))) continue;
      const title = [l.subject, "№" + l.number, l.sent_at, l.sent_at.split("-").reverse().join(".")].join(" ").toLowerCase();
      const notes = (card.items || []).filter(x => ["note", "file", "status"].includes(x.kind))
        .map(x => ({ kind: x.kind, text: [x.text, x.file?.name].filter(Boolean).join(" ") }));
      const hay = [title, ...notes.map(n => n.text)].join(" ").toLowerCase();
      if (!words.every(w => hay.includes(w))) continue;
      const hit = words.every(w => title.includes(w)) ? null : notes.find(n => words.some(w => n.text.toLowerCase().includes(w)));
      rows.push({ ...l, hit, site: card.site, parent: card.parent });
    }
    rows.sort((a, b) => Number(Boolean(a.hit)) - Number(Boolean(b.hit)) || Number(b.status === "open") - Number(a.status === "open")
      || b.sent_at.localeCompare(a.sent_at));
    return { q, rows, more: false };
  }
  function registryList(query) {
    const journal = fixtures["/api/corr"];
    if (!journal) return undefined;
    const kind = query.get("kind") || journal.kind;
    const org = query.get("org") || journal.org, year = query.get("year") || journal.year;
    const site = query.get("site"), topic = query.get("topic") || "";
    const words = (query.get("q") || "").toLowerCase().split(/\s+/).filter(Boolean);
    let filters = {};
    try { filters = JSON.parse(query.get("filters") || "{}") || {}; } catch (_) { /* ignore invalid filters */ }
    const fields = Object.keys(journal.filter_options);
    const counts = Object.fromEntries(Object.keys(journal.counts).map(k => [k, 0]));
    const options = Object.fromEntries(fields.map(k => [k, new Map()]));
    const rows = [];
    let unlinked = 0, untagged = 0;
    for (const row of registryRecords().values()) {
      if (!row.reg_date.startsWith(year + "-") || (org !== "all" && row.org_id !== org)) continue;
      counts[row.kind]++;
      if (row.kind !== kind) continue;
      if (!row.sites.length) unlinked++;
      if (!row.topics.length) untagged++;
      const values = {};
      for (const field of fields) {
        const entries = field === "sites" ? row.sites.map(s => [s.id, s.name])
          : field === "topic" ? row.topics.map(t => [t, journal.topics.find(x => x.id === t)?.name || t])
          : [[row[field] || "", field === "reg_date" ? row.reg_date.split("-").reverse().join(".")
            : row[field + "_name"] || row[field]]];
        if (!entries.length) entries.push(["", ""]);
        values[field] = entries.map(([value]) => value);
        for (const [value, label] of entries) options[field].set(value, label || "(Не указано)");
      }
      if (site && (site === "-" ? row.sites.length : !row.sites.some(s => s.id === site))) continue;
      if (topic && (topic === "none" ? row.topics.length : !row.topics.includes(topic))) continue;
      if (!Object.entries(filters).every(([field, filter]) => {
        if (Array.isArray(filter)) return filter.some(v => values[field]?.includes(v));
        if (field === "reg_date") return (!filter.from || row.reg_date >= filter.from) && (!filter.to || row.reg_date <= filter.to);
        return String(row[field] || "").toLowerCase().includes(String(filter.text || "").toLowerCase());
      })) continue;
      const hay = [row.number, "№" + row.number, row.reg_date.split("-").reverse().join("."), row.reg_date,
        row.party, row.subject, row.author_name, row.reg_by, row.handed_to, row.note, row.topic_name,
        row.reg_channel_name, row.via_name, row.via_note, ...row.sites.map(s => s.name),
        ...row.files.map(f => f.name)].join(" ").toLowerCase();
      if (words.every(w => hay.includes(w))) rows.push(row);
    }
    rows.sort((a, b) => b.number.localeCompare(a.number, "ru", { numeric: true }) || b.reg_date.localeCompare(a.reg_date));
    const filter_options = Object.fromEntries(fields.map(k => [k, [...options[k]].map(([value, label]) =>
      ({ value, label })).sort((a, b) => a.label.localeCompare(b.label, "ru"))]));
    return { ...journal, kind, year, org, topic, filters, filter_options, counts, unlinked, untagged, rows };
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
    const issuePath = /^\/api\/issues\/(\d+)$/.exec(path);
    if (issuePath) {
      const issue = rowsOf(findFixture("/api/issues")).find(row => row.no === Number(issuePath[1]));
      if (issue) return { issue };
    }
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
      if (path === "/api/letters/sites" && fixtures[path]) return json(lettersByOrg(url.searchParams.get("org")));
      if (path === "/api/letters/search") return json(searchLetters(url.searchParams));
      if (path === "/api/corr" && fixtures[path]) return json(registryList(url.searchParams));
      if (path.startsWith("/api/corr/")) {
        const entry = registryRecords().get(path.slice("/api/corr/".length));
        if (entry) return json(entry);
      }
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
  window.KARKAS_DEMO = { ready, notify, base: base.href, entrySearch };

  function mount() {
    const bar = document.createElement("aside");
    bar.className = "static-demo-bar";
    bar.setAttribute("aria-label", "Демонстрационная версия");
    bar.innerHTML = '<b>Демоверсия</b><button type="button" data-demo-resume hidden>К подсказке ↑</button><button type="button" class="kt-launch" data-demo-home>Гид по разделам</button><button type="button" data-demo-reset title="Удалить только ваши изменения в этой демоверсии">Сбросить</button>';
    bar.querySelector("[data-demo-resume]").addEventListener("click", () => window.KarkasTour?.current());
    bar.querySelector("[data-demo-home]").addEventListener("click", () => {
      if (window.KarkasTour) { window.KarkasTour.open(); return; }
      window.__adsLeaving = true;
      location.href = new URL("index.html?s=tv&tour=map", base).href;
    });
    bar.querySelector("[data-demo-reset]").addEventListener("click", () => {
      store.clear();
      window.__adsLeaving = true;
      location.reload();
    });
    if (window.self === window.top) {
      const header = document.querySelector(".main > header.top");
      (header || document.body).appendChild(bar);
    }
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
