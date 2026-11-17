/* Правки и ошибки (заказчик, 21.10.2026).

   «Создадим общие чаты, можно по отделам, — в них сотрудники пишут правки
   и ошибки; в каждом разделе на страницах будет кнопка „Сообщить об
   ошибке“: автоматом прикрепляется снимок раздела, сотрудник пишет
   комментарий. Все жалобы из чатов и с кнопки собираются в список правок
   и ошибок; приоритет выбирает платформа, вручную всё можно поправить».

   Здесь — кнопка в шапке (снимок экрана html2canvas, отметки на нём
   мышью, комментарий) и раздел со списком. Чаты правок — в мессенджере:
   группа с включённым признаком отдаёт сообщения сюда, а Nexus отвечает в
   ней номером. Тип и приоритет предлагает сервер (deploy/issues.py), список
   разбирают администраторы; автор видит, что стало с его правкой. */
"use strict";
const ISSUES = (() => {
  const $i = (s, root = document) => root.querySelector(s);
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const svg = (d) => `<svg viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
  const ICO = {
    bug: svg('<path d="M9 7.5V6a3 3 0 0 1 6 0v1.5"/><rect x="7" y="7.5" width="10" height="12" rx="5"/><path d="M12 11v8.5M3.5 13H7M17 13h3.5M4.5 8.5 7 10M19.5 8.5 17 10M4.5 18.5 7 17M19.5 18.5 17 17"/>'),
    x: svg('<path d="M6 6l12 12M18 6 6 18"/>'),
    search: svg('<circle cx="11" cy="11" r="7"/><path d="M20.4 20.4l-4.3-4.3"/>'),
    plus: svg('<path d="M12 5v14M5 12h14"/>'),
    chat: svg('<path d="M20 11.5a8 8 0 0 1-8 8H5l-3 2v-10a9 9 0 0 1 18 0Z"/><path d="M7 9h8M7 13h5"/>'),
    cam: svg('<path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2.2l1.5-2h5.6l1.5 2h2.2A1.5 1.5 0 0 1 20 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5z"/><circle cx="12" cy="13" r="3.4"/>'),
    hand: svg('<path d="M12 20.5a7.5 7.5 0 1 0 0-15 7.5 7.5 0 0 0 0 15Z"/><path d="M12 8.5v4l2.5 1.5"/>'),
    pen: svg('<path d="M4.5 19.5h4l10-10a2.1 2.1 0 0 0-3-3l-10 10z"/>'),
    check: svg('<circle cx="12" cy="12" r="8.5"/><path d="m8.2 12.3 2.6 2.6 5-5.3"/>'),
    open: svg('<path d="M14 4.5h5.5V10M19.5 4.5 11 13M18 14v4.5A1.5 1.5 0 0 1 16.5 20h-11A1.5 1.5 0 0 1 4 18.5v-11A1.5 1.5 0 0 1 5.5 6H10"/>'),
    trash: svg('<path d="M4.5 6.5h15M9.5 6.5V4.8A1.3 1.3 0 0 1 10.8 3.5h2.4a1.3 1.3 0 0 1 1.3 1.3v1.7M6.5 6.5l.9 12.2A1.5 1.5 0 0 0 8.9 20h6.2a1.5 1.5 0 0 0 1.5-1.3l.9-12.2"/>'),
    spark: svg('<path d="M12 3.5v4M12 16.5v4M3.5 12h4M16.5 12h4M6 6l2.6 2.6M15.4 15.4 18 18M6 18l2.6-2.6M15.4 8.6 18 6"/>'),
  };
  const H2C = "src/vendor/html2canvas.min.js?v=1.4.1";
  // Раздел меню → раздел правок. ПТО — вкладка «Объектов», но свой отдел.
  const SEC_OF = { tnd: "tnd", snb: "snb", sit: "sit", obj: "sit", fin: "fin", let: "let", ref: "ref", cnt: "ref",
    wrk: "ref", msg: "msg", lrn: "lrn", emp: "emp", fil: "fil", tv: "tv", usr: "usr", me: "me", iss: "iss", wg: "wg" };
  const KINDS = { bug: "Ошибка", edit: "Правка", wish: "Пожелание", question: "Вопрос" };
  const PRIOS = { p0: "Критичный", p1: "Важный", p2: "Обычный" };
  const PRIO_RANK = { p0: 0, p1: 1, p2: 2 };
  /* Путь правки (22.10.2026, цикл — 26.10.2026): на согласовании у
     руководителя отдела автора, затем у главного согласующего — он
     последний в цепочке и может согласовать любую правку напрямую → в
     работе → готово. Отклонить можно с причиной; правку в работе, которая
     не получается, возвращают главному. */
  const STATUSES = { review: "На согласовании", work: "В работе", done: "Готово", rejected: "Отклонена" };
  const OPEN = ["review", "work"];
  const SOURCE = { button: "Кнопка", chat: "Чат", manual: "Вручную", wg: "Вектор" };

  /* Последние ошибки страницы — к правке с кнопки: разработчику по ним
     видно, что сломалось, без «а что вы нажимали». */
  const ERRORS = [];
  const remember = (s) => { ERRORS.push(new Date().toLocaleTimeString("ru-RU") + " " + String(s).slice(0, 400)); if (ERRORS.length > 10) ERRORS.shift(); };
  window.addEventListener("error", (ev) => remember((ev.message || "Ошибка")
    + (ev.filename ? " · " + ev.filename.split("/").pop().split("?")[0] + ":" + ev.lineno : "")));
  window.addEventListener("unhandledrejection", (ev) => remember("Promise: " + (ev.reason && ev.reason.message || ev.reason)));

  let me = null, badgeTimer = null, shown = false;
  const S = { rows: [], meta: null, chats: [], can: false, q: "", st: "work", sec: "", prio: "", mine: false, adj: false,
    loaded: false, picked: false };
  const stamp = (at) => at ? new Date(at).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "";
  const secName = (k) => (S.meta && S.meta.sections[k]) || (k ? k : "Общее");
  const plural = (n, a, b, c) => n % 10 === 1 && n % 100 !== 11 ? a : n % 10 >= 2 && n % 10 <= 4 && !(n % 100 >= 12 && n % 100 <= 14) ? b : c;

  /* ── где человек сейчас ─────────────────────────────────── */
  const tabText = (t) => [...t.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join("").trim();
  function where() {
    const sec = document.documentElement.dataset.sec || "";
    const host = document.getElementById("sec-" + sec);
    const parts = [($i("#secTitle")?.textContent || "").trim()].filter(Boolean);
    let site = null, section = SEC_OF[sec] || "";
    try {
      if ((sec === "sit" || sec === "tnd") && typeof SITES === "object" && SITES.current) site = SITES.current();
      if (sec === "snb" && typeof SNAB === "object" && SNAB.current) site = SNAB.current();
    } catch (_) { /* без объекта */ }
    if (site && site.name) parts.push(site.name);
    if (host) host.querySelectorAll(".pg-tab.on").forEach((t) => {
      const x = t.offsetParent ? tabText(t) : "";
      if (x && !parts.includes(x)) parts.push(x);
    });
    if (sec === "sit" && site && site.tab === "pto") section = "pto";
    return { section, place: parts.join(" › "), site_id: (site && site.id) || "",
      url: location.pathname + location.search + location.hash };
  }

  /* ── снимок экрана ──────────────────────────────────────── */
  let h2c = null;
  function lib() {
    if (window.html2canvas) return Promise.resolve(window.html2canvas);
    if (!h2c) {
      h2c = new Promise((ok, fail) => {
        const s = document.createElement("script");
        s.src = H2C; s.async = true;
        s.onload = () => (window.html2canvas ? ok(window.html2canvas) : fail(new Error("модуль снимка не запустился")));
        s.onerror = () => { h2c = null; fail(new Error("модуль снимка не загрузился")); };
        document.head.appendChild(s);
      });
    }
    return h2c;
  }
  /* html2canvas 1.4 не знает цветов вида color(srgb …) — так браузер
     отдаёт наш color-mix(). В копии страницы переписываем их в rgba,
     иначе снимок падал бы целиком. */
  const COLOR_PROPS = ["color", "background-color", "border-top-color", "border-right-color", "border-bottom-color",
    "border-left-color", "outline-color", "text-decoration-color", "fill", "stroke", "box-shadow", "background-image"];
  const fixColor = (v) => v.replace(/color\(srgb\s+([-\d.e]+)\s+([-\d.e]+)\s+([-\d.e]+)(?:\s*\/\s*([-\d.e%]+))?\)/g,
    (_, r, g, b, a) => `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${
      a === undefined ? 1 : String(a).endsWith("%") ? parseFloat(a) / 100 : a})`);
  function sanitize(doc) {
    const win = doc.defaultView;
    for (const el of doc.querySelectorAll("*")) {
      const cs = win.getComputedStyle(el);
      for (const p of COLOR_PROPS) {
        const v = cs.getPropertyValue(p);
        if (v && (v.includes("color(") || v.includes("oklch(") || v.includes("oklab("))) el.style.setProperty(p, fixColor(v), "important");
      }
    }
  }
  async function snap() {
    const draw = await lib();
    const w = document.documentElement.clientWidth, h = window.innerHeight;
    const scale = Math.min(window.devicePixelRatio || 1, 1.5, 1800 / w);
    return await Promise.race([
      draw(document.body, { x: window.scrollX, y: window.scrollY, width: w, height: h, windowWidth: w, windowHeight: h,
        scale, logging: false, useCORS: true, backgroundColor: getComputedStyle(document.body).backgroundColor || "#ffffff",
        onclone: sanitize,
        ignoreElements: (el) => !!(el.classList && (el.classList.contains("iss-wrap") || el.classList.contains("dlg-wrap"))) }),
      new Promise((_, fail) => setTimeout(() => fail(new Error("снимок занял слишком долго")), 20000)),
    ]);
  }

  /* Решение правки — пакет обновлений, который её закрыл (правка № 32):
     первая строка — заголовок пакета, дальше — его пункты «• …». */
  function solutionHtml(text, label) {
    const lines = String(text || "").split("\n").map((x) => x.trim()).filter(Boolean);
    const head = lines[0] || "";
    const items = lines.slice(1).map((x) => x.replace(/^•\s*/, ""));
    return `<div class="iss-sol"><small>${esc(label)}</small><b>${esc(head)}</b>${items.length
      ? `<ul>${items.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : ""}</div>`;
  }

  /* Похожая правка строкой: номер, суть, статус; у выложенной — чем решена;
     согласующему — «Отклонить как повтор». */
  function simLine(x, review) {
    const sol = String(x.solution || "").split("\n")[0];
    return `<div class="iss-sim-r"><button type="button" class="iss-lnk" data-open="${x.no}">№ ${x.no} «${esc(x.title)}»</button>
      <span class="iss-st ${esc(x.status)}">${esc(STATUSES[x.status] || "")}</span>${review
        ? `<button type="button" class="iss-lnk iss-dup" data-dup="${x.no}" data-st="${esc(x.status)}"
          title="Отклонить эту правку: причина для автора — «Повтор правки № ${x.no}»">Это повтор — отклонить</button>` : ""}
      ${x.status === "done" && sol ? `<i class="iss-sim-s" title="${esc(x.solution)}">Решено: ${esc(sol)}</i>` : ""}</div>`;
  }

  /* ── окно «Сообщить об ошибке» ──────────────────────────── */
  async function report() {
    if (!me && typeof AUTH === "object") me = AUTH.current();
    if (!me || $i(".iss-wrap")) return;
    const ctx = where();
    const env = { ua: navigator.userAgent, screen: `${screen.width}×${screen.height}`,
      view: `${document.documentElement.clientWidth}×${innerHeight} · ${(window.devicePixelRatio || 1).toFixed(2)}x`,
      theme: document.documentElement.dataset.theme || "", errors: ERRORS.slice(),
      fails: typeof AUTH === "object" && AUTH.fails ? AUTH.fails() : [] };
    const shotP = snap().catch((err) => { remember("Снимок экрана: " + err.message); return null; });
    const wrap = document.createElement("div");
    wrap.className = "iss-wrap";
    wrap.innerHTML = `<div class="iss-dlg" role="dialog" aria-modal="true" aria-label="Сообщить об ошибке">
      <header class="iss-dh"><span class="iss-dh-ic">${ICO.bug}</span><div><h3>Сообщить об ошибке</h3>
        <p title="${esc(ctx.place)}">${esc(ctx.place || "Платформа")}</p></div>
        <button type="button" class="iss-x" data-x aria-label="Закрыть">${ICO.x}</button></header>
      <div class="iss-db">
        <div class="iss-shot">
          <div class="iss-shot-box" id="issShotBox"><div class="iss-wait"><i></i>Снимаю экран…</div></div>
          <div class="iss-shot-tools"><label class="iss-check"><input type="checkbox" id="issUse" checked>Приложить снимок</label>
            <span>${ICO.pen}Обведите мышью место ошибки</span>
            <button type="button" class="iss-lnk" id="issClear" hidden>Убрать отметки</button></div>
        </div>
        <div class="iss-form">
          <label class="iss-fld"><span>Что не так</span><textarea id="issText" rows="7" maxlength="4000"
            placeholder="Что делали, что ожидали и что получилось. Например: «Загрузила проект в тендер, а спецификация видна только на стр. 82 из 82–87»"></textarea></label>
          <div class="iss-fld"><span>Что это</span><div class="iss-seg" id="issKind">
            <button type="button" data-k="" class="on" title="Тип и приоритет предложит Трейс">${ICO.spark}Определит Трейс</button>
            ${Object.entries(KINDS).map(([k, v]) => `<button type="button" data-k="${k}">${v}</button>`).join("")}</div></div>
          <p class="iss-note">Приоритет предложит Трейс, при разборе его поправят. Что стало с правкой — в разделе «Правки и ошибки».</p>
          <p class="iss-err" id="issErr" hidden></p>
        </div>
      </div>
      <footer class="iss-df"><span>Приложим адрес страницы, браузер и последние ошибки страницы</span>
        <button type="button" class="btn-ghost" data-x>Отмена</button>
        <button type="button" class="btn-brand" id="issSend">Отправить</button></footer></div>`;
    document.body.appendChild(wrap);
    const text = $i("#issText", wrap);
    text.focus();
    let kind = "", shot = null, marks = [], drag = null, canvas = null, busy = false;
    const close = () => { wrap.remove(); document.removeEventListener("keydown", key, true); };
    const key = (ev) => { if (ev.key === "Escape" && !document.querySelector(".dlg-wrap")) { ev.stopPropagation(); close(); } };
    document.addEventListener("keydown", key, true);
    wrap.addEventListener("click", (ev) => {
      if (ev.target === wrap || ev.target.closest("[data-x]")) close();
      const k = ev.target.closest("[data-k]");
      if (k) {
        kind = k.dataset.k;
        wrap.querySelectorAll("[data-k]").forEach((b) => b.classList.toggle("on", b === k));
      }
    });
    // Снимок с отметками: прямоугольники рисуются поверх, в точках снимка.
    const paint = () => {
      if (!canvas || !shot) return;
      const g = canvas.getContext("2d");
      g.drawImage(shot, 0, 0, canvas.width, canvas.height);
      const lw = Math.max(3, Math.round(canvas.width / 400));
      for (const r of drag ? [...marks, drag] : marks) {
        g.fillStyle = "rgba(255, 59, 48, .12)"; g.fillRect(r.x, r.y, r.w, r.h);
        g.strokeStyle = "#FF3B30"; g.lineWidth = lw; g.strokeRect(r.x, r.y, r.w, r.h);
      }
      $i("#issClear", wrap).hidden = !marks.length;
    };
    const point = (ev) => {
      const b = canvas.getBoundingClientRect();
      return { x: (ev.clientX - b.left) * (canvas.width / b.width), y: (ev.clientY - b.top) * (canvas.height / b.height) };
    };
    shotP.then((c) => {
      if (!wrap.isConnected) return;
      const box = $i("#issShotBox", wrap);
      if (!c) {
        box.innerHTML = '<div class="iss-wait bad">Снимок не получился — опишите ошибку словами, этого хватит.</div>';
        $i("#issUse", wrap).checked = false; $i("#issUse", wrap).disabled = true;
        return;
      }
      shot = c;
      const k = Math.min(1, 1600 / c.width);
      canvas = document.createElement("canvas");
      canvas.width = Math.round(c.width * k); canvas.height = Math.round(c.height * k);
      canvas.className = "iss-canvas";
      box.innerHTML = ""; box.appendChild(canvas); paint();
      canvas.addEventListener("pointerdown", (ev) => {
        if (!$i("#issUse", wrap).checked) return;
        const p = point(ev); drag = { x0: p.x, y0: p.y, x: p.x, y: p.y, w: 0, h: 0 };
        canvas.setPointerCapture(ev.pointerId);
      });
      canvas.addEventListener("pointermove", (ev) => {
        if (!drag) return;
        const p = point(ev);
        Object.assign(drag, { x: Math.min(drag.x0, p.x), y: Math.min(drag.y0, p.y), w: Math.abs(p.x - drag.x0), h: Math.abs(p.y - drag.y0) });
        paint();
      });
      const end = () => { if (drag && drag.w > 6 && drag.h > 6) marks.push(drag); drag = null; paint(); };
      canvas.addEventListener("pointerup", end);
      canvas.addEventListener("pointercancel", end);
    });
    $i("#issClear", wrap).addEventListener("click", () => { marks = []; paint(); });
    $i("#issUse", wrap).addEventListener("change", (ev) => { $i("#issShotBox", wrap).classList.toggle("off", !ev.target.checked); });
    const fail = (msg) => { const p = $i("#issErr", wrap); p.textContent = msg; p.hidden = !msg; };
    $i("#issSend", wrap).addEventListener("click", async (ev) => {
      if (busy) return;
      const t = text.value.trim();
      if (t.length < 5) { fail("Опишите, что не так, — хотя бы одним предложением."); text.focus(); return; }
      busy = true; ev.target.disabled = true; ev.target.textContent = "Отправляю…"; fail("");
      try {
        const out = await AUTH.api("POST", "/issues", { text: t, kind: kind || undefined, section: ctx.section,
          place: ctx.place, site_id: ctx.site_id || undefined, url: ctx.url, env });
        const iss = out.issue;
        let shotNote = "";
        if (canvas && $i("#issUse", wrap).checked) {
          const blob = await new Promise((ok) => canvas.toBlob(ok, "image/jpeg", 0.82));
          try {
            const r = await fetch("/api/issues/" + iss.no + "/shot", { method: "POST",
              headers: { Authorization: "Bearer " + AUTH.token(), "Content-Type": "image/jpeg" }, body: blob });
            if (!r.ok) throw new Error("ответ " + r.status);
          } catch (err) { shotNote = " Снимок не приложился: " + err.message + "."; }
        }
        // Похожие (правка № 32): уже заведённые и уже решённые — сразу автору.
        const sim = out.similar || [];
        $i(".iss-db", wrap).innerHTML = `<div class="iss-done">${ICO.check}<h3>Правка принята</h3>
          <p>${iss.status === "review" ? `Ушла на согласование: <b>${esc(iss.approver)}</b>. Согласуют — правка встанет в работу.`
            : "Согласования не нужно — сразу в работе."} ${esc(KINDS[iss.kind] || "")} · приоритет «${esc((PRIOS[iss.priority] || "").toLowerCase())}»${
            iss.prio_by ? "" : " — предложил Трейс"}.${esc(shotNote)}</p>${sim.length ? `<div class="iss-like">
            <b>Похожие правки уже есть${iss.status === "review" ? " — согласующий увидит пометку" : ""}:</b>
            <div class="iss-sim">${sim.map((x) => simLine(x, false)).join("")}</div></div>` : ""}</div>`;
        $i(".iss-df", wrap).innerHTML = `<span></span><button type="button" class="btn-ghost" id="issGo">Открыть правку</button>
          <button type="button" class="btn-brand" data-x>Готово</button>`;
        $i("#issGo", wrap).addEventListener("click", () => { close(); open(iss.no); });
        badge();
        if (S.loaded) load();
      } catch (err) {
        busy = false; ev.target.disabled = false; ev.target.textContent = "Отправить";
        fail("Не отправилось: " + err.message);
      }
    });
  }

  /* ── раздел «Правки и ошибки» ───────────────────────────── */
  async function load() {
    try {
      const out = await AUTH.api("GET", "/issues");
      S.rows = out.rows; S.chats = out.chats; S.can = out.can_manage; S.loaded = true;
      if (!S.picked && S.rows.some((r) => r.can_review)) S.st = "review";
      S.roles = out.roles || {}; S.canRoles = !!out.can_roles; S.people = out.people || [];
      S.meta = { sections: out.sections, kinds: out.kinds, priorities: out.priorities, statuses: out.statuses };
      paint();
    } catch (err) {
      const body = $i("#issBody");
      if (body) body.innerHTML = `<p class="iss-empty">Список не загрузился: ${esc(err.message)}</p>`;
    }
  }
  function frame() {
    const host = $i("#sec-iss");
    if (!host || $i(".iss-pg", host)) return;
    host.innerHTML = `<div class="pg iss-pg">
      <div class="pg-head iss-head">
        <div class="chips" id="issSt">${[["review", "На согласовании"], ["work", "В работе"], ["done", "Готово"], ["all", "Все"]]
          .map(([k, t]) => `<button type="button" class="chip${S.st === k ? " on" : ""}" data-st="${k}">${t}<i></i></button>`).join("")}</div>
        <span class="tb-gap"></span>
        <label class="tb-search">${ICO.search}<input id="issQ" placeholder="Найти правку или автора…" autocomplete="off"></label>
        <select class="role-sel" id="issSec" aria-label="Раздел"></select>
        <label class="iss-tog"><input type="checkbox" id="issMine">Мои</label>
        <button type="button" class="btn-ghost sm" id="issChats">${ICO.chat}Чаты правок</button>
        <button type="button" class="btn-brand sm" id="issAdd" hidden>${ICO.plus}Правка</button>
      </div>
      <div class="iss-sum" id="issSum"></div>
      <div class="pg-body" id="issBody"><p class="iss-empty">Загружаю правки…</p></div>
    </div>`;
    $i("#issSt", host).addEventListener("click", (ev) => {
      const b = ev.target.closest("[data-st]");
      if (b) { S.st = b.dataset.st; S.picked = true; paint(); }
    });
    $i("#issQ", host).addEventListener("input", (ev) => { S.q = ev.target.value; paintTable(); });
    $i("#issSec", host).addEventListener("change", (ev) => { S.sec = ev.target.value; paint(); });
    $i("#issMine", host).addEventListener("change", (ev) => { S.mine = ev.target.checked; paint(); });
    $i("#issAdd", host).addEventListener("click", () => manual());
    $i("#issChats", host).addEventListener("click", (ev) => chatsPop(ev.currentTarget));
    $i("#issSum", host).addEventListener("click", (ev) => {
      if (ev.target.closest("[data-roles]")) { rolesDlg(); return; }
      const b = ev.target.closest("[data-p]");
      if (b) { S.prio = S.prio === b.dataset.p ? "" : b.dataset.p; S.adj = false; paint(); }
      const a = ev.target.closest("[data-adj]");
      if (a) { S.adj = !S.adj; S.prio = ""; paint(); }
    });
    $i("#issBody", host).addEventListener("click", (ev) => {
      const tr = ev.target.closest("[data-no]");
      if (tr) open(Number(tr.dataset.no));
    });
  }
  // Отклонённые — только во «Все»: в очереди им делать нечего.
  const inStatus = (r, st = S.st) => st === "all" || r.status === st;
  const inScope = (r) => (!S.sec || r.section === S.sec) && (!S.mine || r.mine);
  function scope() {
    return S.rows.filter((r) => inStatus(r) && inScope(r));
  }
  function paint() {
    frame();
    const host = $i("#sec-iss");
    if (!host) return;
    host.querySelectorAll("#issSt [data-st]").forEach((b) => {
      b.classList.toggle("on", b.dataset.st === S.st);
      const n = S.rows.filter((r) => inStatus(r, b.dataset.st) && inScope(r)).length;
      $i("i", b).textContent = n ? String(n) : "";
    });
    const secs = [...new Set(S.rows.map((r) => r.section))].sort((a, b) => secName(a).localeCompare(secName(b), "ru"));
    const secSel = $i("#issSec", host);
    secSel.innerHTML = `<option value="">Все разделы</option>${secs.map((k) =>
      `<option value="${esc(k)}"${k === S.sec ? " selected" : ""}>${esc(secName(k))}</option>`).join("")}`;
    // Свой выпадающий список (dressSelect в app.js) берёт подпись при
    // записи значения из кода — после замены пунктов пишем его заново.
    secSel.value = S.sec;
    $i("#issAdd", host).hidden = !S.can;
    $i("#issChats", host).hidden = !S.can && !S.chats.length;
    const list = scope();
    const live = list.filter((r) => OPEN.includes(r.status));
    const by = (p) => live.filter((r) => r.priority === p).length;
    const adj = live.filter((r) => r.adj).length;
    $i("#issSum", host).innerHTML = `${Object.entries(PRIOS).map(([k, v]) => `<button type="button" class="iss-sum-b${S.prio === k ? " on" : ""}"
      data-p="${k}"><i class="iss-dot ${k}"></i>${v}<b>${by(k)}</b></button>`).join("")}
      <button type="button" class="iss-sum-b${S.adj ? " on" : ""}" data-adj="1" title="Затрагивают несколько разделов — обсуждаются отдельно">
        <i class="iss-dot adj"></i>Смежные<b>${adj}</b></button>
      <span class="iss-sum-t">${S.can ? "Приоритет с пометкой «авто» предложил Трейс — щёлкните правку, чтобы разобрать"
        : "Свои правки и правки ваших разделов"}</span>${rolesLine()}`;
    paintTable();
  }
  function paintTable() {
    const body = $i("#issBody");
    if (!body) return;
    const q = S.q.trim().toLocaleLowerCase("ru").replace(/^№\s*/, "");
    let list = scope().filter((r) => (!S.prio || r.priority === S.prio) && (!S.adj || r.adj) && (!q
      || String(r.no) === q || (r.title + " " + r.text + " " + r.author + " " + r.site + " " + r.place)
        .toLocaleLowerCase("ru").includes(q)));
    // По приоритету — критичные сверху, внутри — в порядке поступления
    // (22.10.2026); № в строке — просто счётчик.
    list.sort((a, b) => (PRIO_RANK[a.priority] ?? 3) - (PRIO_RANK[b.priority] ?? 3) || a.no - b.no);
    if (!list.length) {
      body.innerHTML = `<div class="iss-empty">${S.rows.length ? "Под отбор ничего не попало."
        : `<b>Правок пока нет.</b>Заметили ошибку — нажмите «${ICO.bug}Сообщить об ошибке» вверху страницы: снимок экрана
          приложится сам. Или напишите в чат правок своего отдела.`}</div>`;
      return;
    }
    body.innerHTML = `<table class="tbl iss-tbl"><colgroup><col style="width:62px"><col style="width:118px"><col>
      <col style="width:15%"><col style="width:13%"><col style="width:13%"><col style="width:118px"></colgroup>
      <thead><tr><th>№</th><th>Приоритет</th><th>Суть</th><th>Раздел</th><th>Откуда</th><th>Автор</th><th>Статус</th></tr></thead>
      <tbody>${list.map((r, i) => `<tr class="go${r.unseen ? " iss-fresh" : ""}${OPEN.includes(r.status) ? "" : " shut"}" data-no="${r.no}">
        <td class="t-id"><b>${i + 1}</b></td>
        <td><span class="iss-p ${r.priority}">${esc(PRIOS[r.priority] || r.priority)}</span>${r.prio_by ? ""
          : '<i class="iss-auto" title="Предложил Трейс — при разборе можно поправить">авто</i>'}</td>
        <td><span class="t-name">${r.unseen ? '<i class="iss-new" title="Есть новости по вашей правке"></i>' : ""}${esc(r.title)}</span>
          <span class="t-sub">${esc(KINDS[r.kind] || "")}${r.adj ? ' · <b class="iss-adj">смежная</b>' : ""}${r.shot ? " · снимок" : ""}${
            r.comments ? ` · ${r.comments} ${plural(r.comments, "комментарий", "комментария", "комментариев")}` : ""}${
            r.answer ? " · есть ответ" : ""}</span></td>
        <td><span class="iss-cell">${esc(secName(r.section))}</span><span class="t-sub">${esc(r.site || r.place.split(" › ").slice(1).join(" › "))}</span></td>
        <td><span class="iss-cell">${esc(SOURCE[r.source] || r.source)}</span><span class="t-sub">${esc(r.chat ? "«" + r.chat + "»" : "")}</span></td>
        <td><span class="iss-cell">${esc(r.author)}</span><span class="t-sub">${esc(stamp(r.at))}</span></td>
        <td><span class="iss-st ${r.status}">${esc(STATUSES[r.status] || r.status)}</span>${r.status === "review" && r.approver
          ? `<span class="t-sub">у ${esc(r.approver)}</span>` : ""}</td></tr>`).join("")}</tbody></table>`;
  }

  /* Кто последний в цепочке согласования (цикл 26.10.2026); Dev Admin меняет. */
  const chiefName = () => (((S.roles || {}).iss_chief || {}).name || "");
  function rolesLine() {
    const ch = (S.roles || {}).iss_chief || {};
    if (!ch.name && !S.canRoles) return "";
    return `<span class="iss-roles" title="${esc(ch.label || "")}">${ch.name
      ? `Последний в цепочке согласования — <b>${esc(ch.name)}</b>: после руководителя отдела и любую правку напрямую`
      : "Главный согласующий не назначен — правку сотрудника согласует руководитель отдела"}${S.canRoles
      ? ' <button type="button" class="iss-lnk" data-roles>изменить</button>' : ""}</span>`;
  }
  function rolesDlg() {
    const wrap = document.createElement("div");
    wrap.className = "iss-wrap";
    const opt = (cur) => `<option value="">— не назначен —</option>${S.people.map((p) =>
      `<option value="${esc(p.id)}"${p.id === cur ? " selected" : ""}>${esc(p.name)}</option>`).join("")}`;
    wrap.innerHTML = `<div class="iss-dlg iss-roles-dlg" role="dialog" aria-modal="true" aria-label="Цикл правок">
      <header class="iss-dh"><span class="iss-dh-ic">${ICO.check}</span><div><h3>Цикл правок</h3>
        <p>Кто согласует правки</p></div>
        <button type="button" class="iss-x" data-x aria-label="Закрыть">${ICO.x}</button></header>
      <div class="iss-db iss-roles-db">
        <ol class="iss-roles-steps"><li>Правку сотрудника согласует руководитель его отдела по справочнику сотрудников, затем — главный согласующий.</li>
          <li>Правку руководителя — сразу главный согласующий. Он же может согласовать любую правку сам, не дожидаясь руководителя.</li>
          <li>Согласованная правка — в работу. Не получается — её возвращают главному согласующему с причиной.</li></ol>
        <label class="iss-fld"><span>Главный согласующий — последний в цепочке</span><select class="role-sel" id="irChief">${opt((S.roles.iss_chief || {}).id)}</select></label>
        <p class="iss-err" id="irErr" hidden></p>
      </div>
      <footer class="iss-df"><span></span><button type="button" class="btn-ghost" data-x>Отмена</button>
        <button type="button" class="btn-brand" data-ok>Сохранить</button></footer></div>`;
    document.body.appendChild(wrap);
    const close = () => wrap.remove();
    wrap.addEventListener("click", async (ev) => {
      if (ev.target === wrap || ev.target.closest("[data-x]")) { close(); return; }
      if (!ev.target.closest("[data-ok]")) return;
      try {
        const out = await AUTH.api("PATCH", "/issues/roles", { iss_chief: $i("#irChief", wrap).value });
        S.roles = out.roles || {};
        S.rows = out.rows;
        close();
        paint();
      } catch (err) {
        const p = $i("#irErr", wrap);
        p.textContent = "Не сохранилось: " + err.message;
        p.hidden = false;
      }
    });
  }

  // Что Nexus увидел, когда правку согласовали (цикл 26.10.2026) — подсказка разбирающему.
  function nexusNote(iss) {
    const x = (iss.log || []).filter((e) => e && e.what === "nexus").pop();
    return x && x.text ? `<div class="iss-nexus"><small>Проверка Nexus</small>${esc(String(x.text).replace(/^Проверка Nexus: /, ""))}</div>` : "";
  }

  /* ── карточка правки ────────────────────────────────────── */
  async function open(no) {
    if (typeof openSection === "function" && document.documentElement.dataset.sec !== "iss") openSection("iss");
    let out;
    try { out = await AUTH.api("GET", "/issues/" + no); }
    catch (err) { if (typeof ASK === "object") ASK.alert("Правка не открылась: " + err.message); return; }
    card(out);
    const row = S.rows.find((r) => r.no === no);
    if (row && row.unseen) { row.unseen = false; paintTable(); }
    badge();
  }
  function card(out) {
    $i(".iss-card-wrap")?.remove();
    let iss = out.issue;
    const wrap = document.createElement("div");
    wrap.className = "iss-wrap iss-card-wrap";
    document.body.appendChild(wrap);
    const close = () => { wrap.remove(); document.removeEventListener("keydown", key, true); };
    const key = (ev) => { if (ev.key === "Escape" && !document.querySelector(".dlg-wrap")) { ev.stopPropagation(); close(); } };
    document.addEventListener("keydown", key, true);
    const canEdit = () => S.can || iss.can_own || iss.can_review;
    let editing = false;
    const seg = (field, map, cur) => `<div class="iss-seg" data-field="${field}">${Object.entries(map).map(([k, v]) =>
      `<button type="button" data-v="${k}" class="${k === cur ? "on" : ""}${field === "priority" ? " " + k : ""}"${S.can ? "" : " disabled"}>${esc(v)}</button>`).join("")}</div>`;
    const logLine = (x) => {
      const what = { create: "завёл(а)", title: "суть", text: "текст", priority: "приоритет", status: "статус", kind: "тип",
        section: "раздел", adj: "смежная", answer: "ответ", comment: "комментарий", shot: "снимок из чата", from_message: "перенёс(ла) из чата",
        route: "отправил", approve: "согласовал(а)", nexus: "разобрал правку", reject: "отклонил(а)",
        return: "вернул(а) на согласование" }[x.what] || x.what;
      const name = (k, v) => k === "priority" ? PRIOS[v] : k === "status" ? STATUSES[v] : k === "kind" ? KINDS[v]
        : k === "section" ? secName(v) : k === "adj" ? (v ? "да" : "нет") : v;
      const change = x.from !== undefined ? `: ${esc(name(x.what, x.from) ?? "")} → ${esc(name(x.what, x.to) ?? "")}`
        : x.what === "comment" || x.what === "reject" ? `: «${esc(x.text)}»` : x.what === "answer" ? `: «${esc(x.to)}»`
        : x.what === "nexus" ? `: ${esc(String(x.text || "").replace(/^Проверка Nexus: /, ""))}`
        : x.what === "approve" ? (x.to ? ` — дальше ${esc(x.to)}` : " — в работу")
        : x.what === "return" ? ` — ${esc(x.to || "")}: «${esc(x.text || "")}»`
        : x.what === "route" ? ` — ${esc(x.to)}`
        : x.what === "create" ? ` — ${esc(SOURCE[x.source] || x.source || "")}, Трейс: ${esc(KINDS[x.kind] || "")}, ${esc((PRIOS[x.priority] || "").toLowerCase())}` : "";
      return `<li><time>${esc(stamp(x.at))}</time><span><b>${esc(x.by || "")}</b> ${what}${change}${
        x.pkg ? " — закрыта пакетом обновлений при выкладке" : ""}</span></li>`;
    };
    const paintCard = () => {
      const env = iss.env || {};
      wrap.innerHTML = `<div class="iss-dlg iss-card" role="dialog" aria-modal="true" aria-label="Правка">
        <header class="iss-dh"><span class="iss-dh-ic">${ICO.bug}</span><div><h3>${esc(iss.title)}</h3>
          <p>${esc(KINDS[iss.kind] || "")} · ${esc(secName(iss.section))}${iss.site ? " · " + esc(iss.site) : ""} · ${esc(iss.author)}, ${esc(stamp(iss.at))}${
            iss.chat_id ? ` · <span title="Так правку называет Nexus в чате правок: сообщение «№ ${iss.no} …» станет комментарием к ней">в чате — № ${iss.no}</span>` : ""}</p></div>
          <span class="iss-st ${iss.status}">${esc(STATUSES[iss.status] || "")}</span>
          <button type="button" class="iss-x" data-x aria-label="Закрыть">${ICO.x}</button></header>
        <div class="iss-db">
          <div class="iss-shot">${iss.shot ? `<a class="iss-shot-box has" href="/api/issues/${iss.no}/shot?v=${esc(iss.shot)}" target="_blank" rel="noopener"
              title="Открыть снимок целиком"><img src="/api/issues/${iss.no}/shot?v=${esc(iss.shot)}" alt="Снимок экрана"></a>`
            : `<div class="iss-shot-box"><div class="iss-wait">${ICO.cam}Снимка нет</div></div>`}
            <div class="iss-where">${iss.place ? `<p><small>Где</small>${esc(iss.place)}</p>` : ""}
              <p><small>Откуда</small>${iss.chat ? `Чат «${esc(iss.chat)}»` : esc(SOURCE[iss.source] || iss.source)}${
                iss.chat_id ? ` <button type="button" class="iss-lnk" data-chat>Открыть в чате</button>` : ""}${
                iss.url ? ` <a class="iss-lnk" href="${esc(iss.url)}" target="_blank" rel="noopener">Открыть страницу</a>` : ""}</p></div>
          </div>
          <div class="iss-form">
            ${editing ? `<label class="iss-fld"><span>Суть</span><input id="icTitle" maxlength="200" value="${esc(iss.title)}"></label>
              <label class="iss-fld"><span>Текст</span><textarea id="icText" rows="4" maxlength="4000">${esc(iss.text)}</textarea></label>
              <div class="iss-line"><button type="button" class="btn-ghost sm" data-save-text>Сохранить</button>
                <button type="button" class="iss-lnk" data-edit>Отмена</button></div>`
              : `<div class="iss-text">${esc(iss.text)}${canEdit() ? '<button type="button" class="iss-lnk iss-edit" data-edit>Править</button>' : ""}</div>`}
            <div class="iss-fld"><span>Приоритет ${iss.prio_by ? `<em>задал(а) ${esc(iss.prio_by)} · Трейс предлагал «${esc((PRIOS[iss.prio_auto] || "").toLowerCase())}»${
              S.can ? ' <button type="button" class="iss-lnk" data-auto>вернуть</button>' : ""}</em>`
              : "<em>предложил Трейс</em>"}</span>${seg("priority", PRIOS, iss.priority)}</div>
            <div class="iss-fld"><span>Статус${iss.done_at ? ` <em>выложена ${esc(stamp(iss.done_at))}</em>` : ""}</span>${iss.status === "review"
              ? `<div class="iss-review"><span>На согласовании у <b>${esc(iss.approver)}</b></span>${iss.can_review
                ? `<button type="button" class="btn-brand sm" data-review="ok">${ICO.check}Согласовать</button>
                  <button type="button" class="btn-ghost sm" data-review="no">Отклонить</button>` : ""}</div>`
              : S.can ? seg("status", { work: STATUSES.work, done: STATUSES.done, rejected: STATUSES.rejected }, iss.status)
                + (iss.can_return ? `<button type="button" class="btn-ghost sm iss-return" data-return
                  title="Не получается сделать — вернуть с причиной главному согласующему${chiefName() ? ": " + esc(chiefName()) : ""}"
                  >Вернуть на согласование</button>` : "")
                + (iss.status === "work" ? nexusNote(iss) : "")
              : `<div><span class="iss-st ${iss.status}">${esc(STATUSES[iss.status] || "")}</span></div>`}</div>
            ${S.can ? `<div class="iss-three"><label class="iss-fld"><span>Тип</span><select class="role-sel" data-sel="kind">${Object.entries(KINDS).map(([k, v]) =>
                `<option value="${k}"${k === iss.kind ? " selected" : ""}>${v}</option>`).join("")}</select></label>
              <label class="iss-fld"><span>Раздел</span><select class="role-sel" data-sel="section">${Object.entries(S.meta ? S.meta.sections : {}).map(([k, v]) =>
                `<option value="${esc(k)}"${k === iss.section ? " selected" : ""}>${esc(v)}</option>`).join("")}</select></label>
              <label class="iss-check"><input type="checkbox" data-adj${iss.adj ? " checked" : ""}>Смежная${iss.adj_auto ? " <em>(заметил Трейс)</em>" : ""}</label></div>
              <label class="iss-fld"><span>Ответ автору <em>увидит в своей правке</em></span><textarea id="icAnswer" rows="2" maxlength="2000"
                placeholder="Например: исправили, проверьте на тестовой версии">${esc(iss.answer)}</textarea></label>
              <div class="iss-line"><button type="button" class="btn-ghost sm" data-save-answer>Сохранить ответ</button></div>`
              : iss.answer ? `<div class="iss-answer"><small>Ответ</small>${esc(iss.answer)}</div>` : ""}
            ${iss.status === "done" && iss.solution ? solutionHtml(iss.solution, "Решение — пакет обновлений, который её закрыл") : ""}
            ${out.similar && out.similar.length ? `<div class="iss-fld"><span>Похожие правки${iss.can_review
              ? " <em>проверьте, не повтор ли</em>" : ""}</span><div class="iss-sim">${out.similar.map((x) => simLine(x, iss.can_review)).join("")}</div></div>` : ""}
            <details class="iss-tech"><summary>Технические сведения</summary>
              <dl>${env.version ? `<dt>Версия</dt><dd>${esc(env.version)}</dd>` : ""}${env.ua ? `<dt>Браузер</dt><dd>${esc(env.ua)}</dd>` : ""}
              ${env.screen ? `<dt>Экран</dt><dd>${esc(env.screen)} · окно ${esc(env.view || "")}</dd>` : ""}
              ${(env.errors || []).length ? `<dt>Ошибки страницы</dt><dd>${env.errors.map(esc).join("<br>")}</dd>` : ""}
              ${(env.fails || []).length ? `<dt>Неудачные запросы</dt><dd>${env.fails.map(esc).join("<br>")}</dd>` : ""}
              ${iss.url ? `<dt>Адрес</dt><dd>${esc(iss.url)}</dd>` : ""}</dl></details>
            <details class="iss-tech"><summary>История · ${(iss.log || []).length}</summary>
              <ul class="iss-log">${(iss.log || []).slice().reverse().map(logLine).join("")}</ul></details>
            <p class="iss-err" id="icErr" hidden></p>
          </div>
        </div>
        <footer class="iss-df">${S.can || iss.can_own ? `<button type="button" class="btn-ghost iss-del" data-del>${ICO.trash}${
          S.can ? "Удалить" : "Отозвать"}</button>` : ""}<span></span>
          <button type="button" class="btn-brand" data-x>Готово</button></footer></div>`;
    };
    const fail = (msg) => { const p = $i("#icErr", wrap); if (p) { p.textContent = msg; p.hidden = !msg; } };
    const save = async (body) => {
      fail("");
      try {
        const r = await AUTH.api("PATCH", "/issues/" + iss.no, body);
        iss = r.issue;
        const i = S.rows.findIndex((x) => x.no === iss.no);
        if (i >= 0) S.rows[i] = Object.assign(S.rows[i], iss);
        paintCard(); paint();
      } catch (err) { fail("Не сохранилось: " + err.message); }
    };
    wrap.addEventListener("click", async (ev) => {
      if (ev.target === wrap || ev.target.closest("[data-x]")) { close(); return; }
      const v = ev.target.closest("[data-field] [data-v]");
      if (v && !v.disabled) { await save({ [v.closest("[data-field]").dataset.field]: v.dataset.v }); return; }
      if (ev.target.closest("[data-auto]")) { await save({ priority: "auto" }); return; }
      // Повтор уже заведённой (правка № 32): отклонить одной кнопкой, причина
      // для автора — номер той правки.
      const dup = ev.target.closest("[data-dup]");
      if (dup) {
        fail("");
        try {
          const r = await AUTH.api("POST", "/issues/" + iss.no + "/review",
            { ok: false, reason: `Повтор правки № ${dup.dataset.dup} — она уже ${dup.dataset.st === "done" ? "выложена" : "заведена"}` });
          iss = r.issue;
          const i = S.rows.findIndex((x) => x.no === iss.no);
          if (i >= 0) S.rows[i] = Object.assign(S.rows[i], iss);
          paintCard(); paint(); badge();
        } catch (err) { fail("Не вышло: " + err.message); }
        return;
      }
      // Не получается — обратно главному согласующему (цикл 26.10.2026).
      if (ev.target.closest("[data-return]")) {
        const reason = await ASK.prompt(`Что не получается? ${chiefName() || "Главный согласующий"} увидит и согласует заново или отклонит`, "",
          { ok: "Вернуть" });
        if (reason === null) return;
        if (!reason.trim()) { fail("Напишите, что не получается."); return; }
        fail("");
        try {
          const r = await AUTH.api("POST", "/issues/" + iss.no + "/return", { reason });
          iss = r.issue;
          const i = S.rows.findIndex((x) => x.no === iss.no);
          if (i >= 0) S.rows[i] = Object.assign(S.rows[i], iss);
          paintCard(); paint(); badge();
        } catch (err) { fail("Не вышло: " + err.message); }
        return;
      }
      const rv = ev.target.closest("[data-review]");
      if (rv) {
        let body = { ok: true };
        if (rv.dataset.review === "no") {
          const reason = await ASK.prompt("Почему отклоняете? Причину увидит автор", "",
            { ok: "Отклонить", danger: true });
          if (reason === null) return;
          if (!reason.trim()) { fail("Напишите причину — автор её увидит."); return; }
          body = { ok: false, reason };
        }
        fail("");
        try {
          const r = await AUTH.api("POST", "/issues/" + iss.no + "/review", body);
          iss = r.issue;
          const i = S.rows.findIndex((x) => x.no === iss.no);
          if (i >= 0) S.rows[i] = Object.assign(S.rows[i], iss);
          paintCard(); paint(); badge();
        } catch (err) { fail("Не вышло: " + err.message); }
        return;
      }
      if (ev.target.closest("[data-edit]")) { editing = !editing; paintCard(); return; }
      if (ev.target.closest("[data-save-text]")) {
        editing = false;
        await save({ title: $i("#icTitle", wrap).value, text: $i("#icText", wrap).value });
        return;
      }
      if (ev.target.closest("[data-save-answer]")) { await save({ answer: $i("#icAnswer", wrap).value }); return; }
      const o = ev.target.closest("[data-open]");
      if (o) { close(); open(Number(o.dataset.open)); return; }
      if (ev.target.closest("[data-chat]")) {
        close();
        if (typeof MESSENGER === "object" && MESSENGER.openChat) MESSENGER.openChat(iss.chat_id);
        return;
      }
      if (ev.target.closest("[data-del]")) {
        if (!(await ASK.confirm(`${S.can ? "Удалить" : "Отозвать"} правку «${iss.title}»?\nОна уйдёт из списка${iss.chat_id ? "; Nexus отметит это в чате" : ""}.`))) return;
        try {
          await AUTH.api("DELETE", "/issues/" + iss.no);
          S.rows = S.rows.filter((x) => x.no !== iss.no);
          close(); paint();
        } catch (err) { fail("Не вышло: " + err.message); }
      }
    });
    wrap.addEventListener("change", async (ev) => {
      const s = ev.target.closest("[data-sel]");
      if (s) await save({ [s.dataset.sel]: s.value });
      if (ev.target.matches("[data-adj]")) await save({ adj: ev.target.checked });
    });
    paintCard();
  }

  /* Правка руками — например, пересланная из Max: текст, раздел, тип,
     приоритет и снимок, если есть. Только разбирающим. */
  function manual() {
    const wrap = document.createElement("div");
    wrap.className = "iss-wrap";
    const secs = S.meta ? S.meta.sections : {};
    wrap.innerHTML = `<div class="iss-dlg iss-small" role="dialog" aria-modal="true" aria-label="Новая правка">
      <header class="iss-dh"><span class="iss-dh-ic">${ICO.plus}</span><div><h3>Новая правка</h3><p>Например, из переписки в Max или со встречи</p></div>
        <button type="button" class="iss-x" data-x aria-label="Закрыть">${ICO.x}</button></header>
      <div class="iss-form">
        <label class="iss-fld"><span>Что не так</span><textarea id="imText" rows="5" maxlength="4000"></textarea></label>
        <div class="iss-two"><label class="iss-fld"><span>Раздел</span><select class="role-sel" id="imSec">${Object.entries(secs).map(([k, v]) =>
          `<option value="${esc(k)}"${k === "" ? " selected" : ""}>${esc(v)}</option>`).join("")}</select></label>
          <label class="iss-fld"><span>Приоритет</span><select class="role-sel" id="imPrio"><option value="">Предложит Трейс</option>${Object.entries(PRIOS)
            .map(([k, v]) => `<option value="${k}">${v}</option>`).join("")}</select></label></div>
        <label class="iss-fld"><span>Откуда <em>необязательно</em></span><input id="imPlace" maxlength="300" placeholder="Max, чат «СМЕТНЫЙ разработка»"></label>
        <label class="iss-fld"><span>Снимок <em>файл или Ctrl + V в это окно</em></span><input type="file" id="imShot" accept="image/png,image/jpeg,image/webp"></label>
        <p class="iss-err" id="imErr" hidden></p>
      </div>
      <footer class="iss-df"><span></span><button type="button" class="btn-ghost" data-x>Отмена</button>
        <button type="button" class="btn-brand" id="imSave">Завести</button></footer></div>`;
    document.body.appendChild(wrap);
    let pasted = null;
    const close = () => { wrap.remove(); document.removeEventListener("keydown", key, true); };
    const key = (ev) => { if (ev.key === "Escape" && !document.querySelector(".dlg-wrap")) { ev.stopPropagation(); close(); } };
    document.addEventListener("keydown", key, true);
    wrap.addEventListener("click", (ev) => { if (ev.target === wrap || ev.target.closest("[data-x]")) close(); });
    wrap.addEventListener("paste", (ev) => {
      const f = [...(ev.clipboardData?.files || [])].find((x) => /^image\//.test(x.type));
      if (f) { pasted = f; $i("#imShot", wrap).closest(".iss-fld").querySelector("em").textContent = "приложен снимок из буфера"; }
    });
    $i("#imText", wrap).focus();
    $i("#imSave", wrap).addEventListener("click", async (ev) => {
      const p = $i("#imErr", wrap);
      const text = $i("#imText", wrap).value.trim();
      if (text.length < 5) { p.textContent = "Опишите правку."; p.hidden = false; return; }
      ev.target.disabled = true;
      try {
        const out = await AUTH.api("POST", "/issues", { text, manual: true, section: $i("#imSec", wrap).value,
          priority: $i("#imPrio", wrap).value || undefined, place: $i("#imPlace", wrap).value });
        const file = pasted || $i("#imShot", wrap).files[0];
        if (file) {
          await fetch("/api/issues/" + out.issue.no + "/shot", { method: "POST",
            headers: { Authorization: "Bearer " + AUTH.token(), "Content-Type": file.type || "image/jpeg" }, body: file });
        }
        close(); await load(); open(out.issue.no);
      } catch (err) { p.textContent = "Не вышло: " + err.message; p.hidden = false; ev.target.disabled = false; }
    });
  }

  // Чаты правок: какие есть и как завести новый (признак группы в мессенджере).
  function chatsPop(btn) {
    $i(".iss-pop")?.remove();
    const pop = document.createElement("div");
    pop.className = "iss-pop";
    pop.innerHTML = `<b>Чаты правок</b>${S.chats.length ? S.chats.map((c) => `<button type="button" data-chat="${esc(c.id)}"${c.member ? "" : " disabled"}>
      ${ICO.chat}<span>${esc(c.title)}<small>${esc(c.section ? secName(c.section) : "разные разделы")} · ${c.members} уч.${c.member ? "" : " · вы не в составе"}</small></span></button>`).join("")
      : "<p>Пока нет. Любую группу мессенджера можно сделать чатом правок.</p>"}
      <p class="iss-pop-h">Включить: откройте группу → «⋯» → «Управление» → «Чат правок». Заведённые чаты сами не меняются.</p>`;
    document.body.appendChild(pop);
    const b = btn.getBoundingClientRect();
    pop.style.top = Math.round(b.bottom + 6) + "px";
    pop.style.left = Math.round(Math.max(8, Math.min(b.left, innerWidth - pop.offsetWidth - 8))) + "px";
    const off = (ev) => { if (!pop.contains(ev.target) && ev.target !== btn) { pop.remove(); document.removeEventListener("pointerdown", off, true); } };
    document.addEventListener("pointerdown", off, true);
    pop.addEventListener("click", (ev) => {
      const c = ev.target.closest("[data-chat]");
      if (c && !c.disabled && typeof MESSENGER === "object") { pop.remove(); MESSENGER.openChat(c.dataset.chat); }
    });
  }

  /* Счётчик у пункта меню: автору — новости по его правкам, разбирающим —
     ещё не разобранные. */
  async function badge() {
    clearTimeout(badgeTimer);
    if (!me || me.must_change_pw) return;
    try {
      const out = await AUTH.api("GET", "/issues/badge");
      // Число — сколько правок в работе: исправили одну — стало на одну меньше.
      const n = out.work;
      const el = $i("#issBadge");
      if (el) {
        el.hidden = !n; el.textContent = n > 99 ? "99+" : String(n);
        el.title = [`В работе: ${n}`, out.review ? `ждут вашего согласования: ${out.review}` : "",
          out.mine ? `новости по вашим правкам: ${out.mine}` : ""].filter(Boolean).join(" · ");
      }
    } catch (_) { /* повторим позже */ }
    badgeTimer = setTimeout(badge, document.hidden ? 300000 : 90000);
  }
  function init(user) {
    if (me || !user) return;
    me = user;
    const btn = document.getElementById("bugBtn");
    if (btn) { btn.hidden = !!user.must_change_pw; btn.addEventListener("click", () => report()); }
    badge();
    document.addEventListener("visibilitychange", () => { if (!document.hidden) badge(); });
  }
  function show() {
    if (!me && typeof AUTH === "object") init(AUTH.current());
    frame();
    if (!shown || S.loaded) load();
    shown = true;
  }
  return { init, show, open, report };
})();
