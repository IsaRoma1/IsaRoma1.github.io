/* Заявки на материалы (заказчик, 22.10.2026).

   «Мастер заходит в свой объект, видит спецификацию и количество и заказывает
   материал — не всё сразу, а по строительной готовности. Подсказки: заказал
   трубу — подсвечивается крепёж. Заявка уходит на согласование по
   настраиваемой цепочке, каждому — уведомление в мессенджер. Снабженец видит
   согласованные, складывает одинаковый материал из разных заявок и заказывает
   разом на склад; дальше — едет, на складе, выдано на объект, смонтировано; к
   каждому шагу — УПД. По каждой позиции — история».

   Экраны: список заявок; заявка (ход согласования, строки с ходом поставки,
   бумаги, журнал); новая заявка — спецификация объекта по материалам с
   «по проекту / заявлено / осталось», количеством кнопками и подсказками
   сопутствующего (deploy/mreq.py), справа (на телефоне — следующим экраном) —
   что в заявке, срок, срочность, куда; «Согласовать»; у снабжения — свод,
   заказы поставщикам, склад; у администраторов — маршруты согласования.
   Сервер — deploy/api.py, req_*: ход строк считается там из количеств.

   Телефон — главный экран мастера: всё в одну колонку, кнопки крупные, поля
   не мельче 16px (иначе iOS увеличивает страницу), действия — внизу. */
"use strict";
const REQ = (() => {
  const $r = (s, root = document) => root.querySelector(s);
  const $$r = (s, root = document) => [...root.querySelectorAll(s)];
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const svg = (d) => `<svg viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
  const ICO = {
    plus: svg('<path d="M12 5v14M5 12h14"/>'),
    minus: svg('<path d="M5 12h14"/>'),
    back: svg('<path d="m14 6-6 6 6 6"/>'),
    x: svg('<path d="M6 6l12 12M18 6 6 18"/>'),
    search: svg('<circle cx="11" cy="11" r="7"/><path d="M20.4 20.4l-4.3-4.3"/>'),
    check: svg('<path d="m5.5 12.5 4 4 9-9.5"/>'),
    send: svg('<path d="m3 3 18 9-18 9 4-9-4-9Zm4 9h14"/>'),
    truck: svg('<path d="M3 6.5h11v9H3z"/><path d="M14 9.5h4l3 3v3h-7"/><circle cx="7" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/>'),
    box: svg('<path d="M3.5 7.6 12 3.2l8.5 4.4v8.8L12 20.8l-8.5-4.4z"/><path d="M3.5 7.6 12 12l8.5-4.4M12 12v8.8"/>'),
    clip: svg('<path d="m20.5 11.5-8.2 8.2a5.2 5.2 0 0 1-7.4-7.4l8.6-8.6a3.5 3.5 0 0 1 4.9 4.9l-8.6 8.6a1.7 1.7 0 0 1-2.5-2.5l7.9-7.9"/>'),
    doc: svg('<path d="M7 3.5h7l4 4V20a.5.5 0 0 1-.5.5h-10.5a.5.5 0 0 1-.5-.5V4a.5.5 0 0 1 .5-.5Z"/><path d="M14 3.5V8h4M9 12h6M9 15.5h6"/>'),
    hist: svg('<path d="M3.5 12a8.5 8.5 0 1 0 2.5-6"/><path d="M3.5 4v4h4M12 7.5V12l3 2"/>'),
    flame: svg('<path d="M12 21c-3.9 0-6.5-2.6-6.5-6.2 0-3.4 2.6-5.6 4-8.3.6 1.9 1.7 3 3 3.6.3-2.4 1.4-4.5 3.2-6.1.7 3.2 3.8 5.8 3.8 10.1 0 4.2-3.1 6.9-7.5 6.9Z"/>'),
    edit: svg('<path d="M4.5 19.5h4l10-10a2.1 2.1 0 0 0-3-3l-10 10z"/>'),
    trash: svg('<path d="M4.5 6.5h15M9.5 6.5V4.8A1.3 1.3 0 0 1 10.8 3.5h2.4a1.3 1.3 0 0 1 1.3 1.3v1.7M6.5 6.5l.9 12.2A1.5 1.5 0 0 0 8.9 20h6.2a1.5 1.5 0 0 0 1.5-1.3l.9-12.2"/>'),
    copy: svg('<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5.5A1.5 1.5 0 0 0 14.5 4h-9A1.5 1.5 0 0 0 4 5.5v9A1.5 1.5 0 0 0 5.5 16H8"/>'),
    up: svg('<path d="m6 15 6-6 6 6"/>'),
    dn: svg('<path d="m6 9 6 6 6-6"/>'),
    route: svg('<circle cx="6" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M8.5 6H15a3 3 0 0 1 0 6H9a3 3 0 0 0 0 6h6.5"/>'),
    warn: svg('<path d="M12 4 2.8 19.5h18.4z"/><path d="M12 10v4.5M12 17.2v.1"/>'),
    spark: svg('<path d="M12 3.5v4M12 16.5v4M3.5 12h4M16.5 12h4M6 6l2.6 2.6M15.4 15.4 18 18M6 18l2.6-2.6M15.4 8.6 18 6"/>'),
    cal: svg('<rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 9.5h17M8 3v4M16 3v4"/>'),
    stop: svg('<circle cx="12" cy="12" r="8.5"/><path d="m6 6 12 12"/>'),
    wait: svg('<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>'),
    skip: svg('<path d="M5 6l7 6-7 6M13 6l7 6-7 6"/>'),
    cart: svg('<path d="M3 4h2.5l2.2 10.5a1.5 1.5 0 0 0 1.5 1.2h8.3a1.5 1.5 0 0 0 1.5-1.1L21 8H6.4"/><circle cx="10" cy="19.5" r="1.4"/><circle cx="17" cy="19.5" r="1.4"/>'),
    tool: svg('<path d="M14.6 5.2a4.2 4.2 0 0 0-5.3 5.4L4 15.9V20h4.1l5.3-5.3a4.2 4.2 0 0 0 5.4-5.3l-2.7 2.7-2.9-.5-.5-2.9z"/>'),
    pin: svg('<path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Z"/><circle cx="12" cy="10" r="2.3"/>'),
    info: svg('<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5M12 7.9v.1"/>'),
  };
  const ST = { draft: "Черновик", review: "На согласовании", approved: "Согласована", rejected: "Отклонена", canceled: "Отменена" };
  const STAGES = [["wait", "Ждёт заказа"], ["part", "Заказано частично"], ["ordered", "Заказано"], ["transit", "В пути"],
    ["stock", "На складе"], ["issued", "На объекте"], ["installed", "Смонтировано"], ["closed", "Закрыто"]];
  const STAGE = Object.fromEntries(STAGES);
  const ORDER_ST = { ordered: "Заказан", transit: "В пути", partial: "Принят частично", received: "Принят", canceled: "Отменён" };
  const DOC_KINDS = { upd: "УПД", waybill: "Накладная", act: "Акт расхождений", invoice: "Счёт", photo: "Фото", other: "Другое" };
  const UNITS = ["шт", "м", "компл", "упак", "кг", "м2", "м3", "л"];
  const CHUNK = 6 << 20, FILE_MAX = 50 << 20;
  // Отбор списка: «в работе» — на согласовании и согласованные, где ещё не всё смонтировано.
  const BOXES = [["work", "В работе"], ["draft", "Черновики"], ["done", "Завершённые"], ["all", "Все"]];

  let me = null, badgeTimer = null, host = null;
  const S = {
    tab: "list", view: null, list: null, pool: null, orders: null, stock: null, routes: null,
    card: null, order: null, ed: null, f: { site: "", box: "work", mine: false, q: "" },
    poolSel: new Set(), poolOpen: new Set(), loading: false, badge: { approve: 0, fresh: 0 },
  };
  try { S.f.mine = localStorage.getItem("mr-mine") === "1"; } catch (_) { /* приватный режим */ }

  /* ── мелочи ─────────────────────────────────────────────── */
  const num = (x) => (x === null || x === undefined || x === "") ? "" : Number(x).toLocaleString("ru-RU", { maximumFractionDigits: 3 });
  const plural = (n, a, b, c) => { n = Math.abs(n); return n % 10 === 1 && n % 100 !== 11 ? a : n % 10 >= 2 && n % 10 <= 4 && !(n % 100 >= 12 && n % 100 <= 14) ? b : c; };
  const asDate = (iso) => { const [y, m, d] = String(iso || "").slice(0, 10).split("-").map(Number); return y ? new Date(y, m - 1, d) : null; };
  const dm = (iso) => { const d = asDate(iso); return d ? d.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" }) : ""; };
  const dmy = (iso) => { const d = asDate(iso); return d ? d.toLocaleDateString("ru-RU") : ""; };
  // Метка времени (UTC с сервера) — день по местному времени, а не по первым десяти знакам строки.
  const atDay = (iso) => { const d = iso ? new Date(iso) : null; return d && !isNaN(d) ? d.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" }) : ""; };
  const stamp = (iso) => { if (!iso) return ""; const d = new Date(iso); return isNaN(d) ? "" : d.toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }).replace(",", ""); };
  const today = () => { const d = new Date(); return new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10); };
  const plusDays = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10); };
  const late = (iso) => !!iso && iso < today();
  const parseQty = (v) => { const n = Number(String(v ?? "").replace(/\s/g, "").replace(",", ".")); return Number.isFinite(n) && n > 0 ? Math.round(n * 1000) / 1000 : 0; };
  const size = (n) => n < 1024 ? n + " Б" : n < 1 << 20 ? Math.round(n / 1024) + " КБ" : (n / 1048576).toFixed(1).replace(".", ",") + " МБ";
  const api = (m, p, b) => AUTH.api(m, p, b);
  const can = (k) => !!(me && AUTH.can(me, k));
  const fail = (e, title = "Не получилось") => { if (typeof ASK === "object") ASK.alert(e.message || String(e), { title }); };
  /* Поиск: «ввг 3х2,5» = «ВВГ 3*2.5», латиница вместо кириллицы и не та
     раскладка — то же самое (deploy/mreq.py держит ту же мысль на сервере). */
  const LAT = { a: "а", c: "с", e: "е", o: "о", p: "р", x: "х", y: "у", k: "к", m: "м", t: "т", b: "в", h: "н", "*": "х", "×": "х", ",": "." };
  const LAYOUT = Object.fromEntries([..."qwertyuiop[]asdfghjkl;'zxcvbnm,.`"].map((c, i) => [c, "йцукенгшщзхъфывапролджэячсмитьбюё"[i]]));
  const norm = (s) => String(s || "").toLowerCase().replace(/ё/g, "е").replace(/[acepoxykmtbh*×,]/g, (c) => LAT[c]).replace(/\s+/g, " ").trim();
  const swap = (s) => [...String(s || "").toLowerCase()].map((c) => LAYOUT[c] || c).join("");
  function matcher(q) {
    const a = norm(q).split(" ").filter(Boolean), b = norm(swap(q)).split(" ").filter(Boolean);
    if (!a.length) return () => true;
    return (text) => { const t = norm(text); return a.every((w) => t.includes(w)) || (b.length && b.every((w) => t.includes(w))); };
  }

  /* ── рамка ──────────────────────────────────────────────── */
  function frame() {
    host = $r("#sec-req");
    if (!host || $r(".mr-pg", host)) return;
    host.innerHTML = `<div class="pg mr-pg">
      <div class="pg-head mr-head" id="mrHead"></div>
      <div class="pg-tabs mr-tabs" id="mrTabs"></div>
      <div class="mr-body" id="mrBody"><div class="mr-empty">Загружаю…</div></div>
    </div>`;
    host.addEventListener("click", onClick);
    host.addEventListener("input", onInput);
    host.addEventListener("change", onChange);
    host.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter" && ev.target.matches("[data-qty]")) { ev.preventDefault(); ev.target.blur(); }
    });
  }
  function paint() {
    frame();
    paintHead();
    paintTabs();
    paintBody();
  }
  const body = () => $r("#mrBody");

  function tabs() {
    const out = [["list", "Заявки", 0]];
    const appr = (S.list ? S.list.rows.filter((r) => r.mine_to_decide).length : S.badge.approve) || 0;
    if (appr || S.tab === "approve") out.push(["approve", "Согласовать", appr]);
    if (S.list && S.list.can.snab) {
      out.push(["pool", "Свод — к заказу", S.pool ? S.pool.groups.length : 0]);
      out.push(["orders", "Заказы поставщикам", 0]);
      out.push(["stock", "Склад", 0]);
    }
    if (S.list && S.list.can.routes) out.push(["routes", "Маршруты согласования", 0, "far"]);
    return out;
  }
  function paintTabs() {
    const el = $r("#mrTabs");
    if (!el) return;
    el.hidden = !!S.view;
    el.innerHTML = tabs().map(([k, t, n, cls]) => `<button type="button" class="pg-tab${S.tab === k ? " on" : ""}${cls ? " " + cls : ""}"
      data-tab="${k}">${esc(t)}${n ? `<i>${n}</i>` : ""}</button>`).join("");
  }
  function paintHead() {
    const el = $r("#mrHead");
    if (!el) return;
    const v = S.view;
    if (v && v.k === "req" && S.card) {
      const r = S.card;
      el.innerHTML = `<button type="button" class="mr-back" data-back title="К списку" aria-label="К списку">${ICO.back}</button>
        <div class="mr-h-l"><span class="mr-h-row"><b class="mr-h-t">Заявка № ${r.no}</b>${chip(r)}${r.urgent ? `<i class="mr-urg" title="Срочная">${ICO.flame}</i>` : ""}</span>
          <span class="mr-h-s">${esc(r.site)}</span></div><span class="tb-gap"></span>${cardActions(r)}`;
      return;
    }
    if (v && (v.k === "new" || v.k === "edit") && S.ed) {
      el.innerHTML = `<button type="button" class="mr-back" data-back title="Закрыть" aria-label="Закрыть">${ICO.back}</button>
        <div class="mr-h-l"><b class="mr-h-t">${S.ed.id ? `Заявка № ${S.ed.no} — черновик` : "Новая заявка"}</b>
          <span class="mr-h-s">${esc(S.ed.siteName)}</span></div><span class="tb-gap"></span>
        <button type="button" class="btn-ghost sm mr-wide" data-ed-save>${ICO.check}<span>Сохранить черновик</span></button>`;
      return;
    }
    if (v && v.k === "pick") {
      el.innerHTML = `<button type="button" class="mr-back" data-back title="К списку" aria-label="К списку">${ICO.back}</button>
        <div class="mr-h-l"><b class="mr-h-t">Новая заявка</b><span class="mr-h-s">выберите объект</span></div>`;
      return;
    }
    if (v && v.k === "order" && S.order) {
      const o = S.order;
      el.innerHTML = `<button type="button" class="mr-back" data-back title="К заказам" aria-label="К заказам">${ICO.back}</button>
        <div class="mr-h-l"><span class="mr-h-row"><b class="mr-h-t">Заказ № ${o.no} · ${esc(o.supplier)}</b>
          <i class="mr-chip o-${o.status}">${esc(o.status_name)}</i></span>
          <span class="mr-h-s">${o.deliver === "site" ? "сразу на объект " + esc(o.site) : "на склад"}${o.expect ? " · ожидается " + dmy(o.expect) : ""}${o.invoice ? " · счёт " + esc(o.invoice) : ""}</span></div>
        <span class="tb-gap"></span>${orderActions(o)}`;
      return;
    }
    const rows = S.list ? S.list.rows : [];
    const work = rows.filter((r) => inBox(r, "work")).length;
    el.innerHTML = `<div class="mr-h-l"><b class="mr-h-t">Заявки на материалы</b><span class="mr-h-s">${rows.length
      ? `${work} в работе · всего ${rows.length}` : "с объектов: согласование, заказ, склад, выдача"}</span></div>
      <span class="tb-gap"></span>
      ${S.list && S.list.can.create ? `<button type="button" class="btn-brand sm" data-new>${ICO.plus}<span>Новая заявка</span></button>` : ""}`;
  }
  function chip(r) {
    if (r.status === "approved" && r.stage) {
      return `<i class="mr-chip s-${r.stage}">${esc(STAGE[r.stage] || "")}</i>`;
    }
    return `<i class="mr-chip ${r.status}">${esc(ST[r.status] || r.status)}</i>`;
  }

  /* ── загрузка ───────────────────────────────────────────── */
  async function load(what) {
    try {
      if (!what || what === "list") S.list = await api("GET", "/req");
      if (S.list && S.list.can.snab && (!what ? S.tab === "pool" : what === "pool")) S.pool = await api("GET", "/req/pool");
      if (what === "orders") S.orders = await api("GET", "/req/orders");
      if (what === "stock") S.stock = await api("GET", "/req/stock");
      if (what === "routes") S.routes = await api("GET", "/req/routes");
    } catch (e) {
      const b = body();
      if (b && !S.list) b.innerHTML = `<div class="mr-empty"><b>Не загрузилось</b>${esc(e.message)}</div>`;
      return;
    }
    paint();
  }
  async function openTab(t) {
    S.tab = t; S.view = null;
    paint();
    if (t === "list" || t === "approve") await load("list");
    if (t === "pool") await load("pool");
    if (t === "orders") await load("orders");
    if (t === "stock") await load("stock");
    if (t === "routes") await load("routes");
  }

  /* ── список ─────────────────────────────────────────────── */
  function inBox(r, box) {
    const done = r.status === "rejected" || r.status === "canceled"
      || (r.status === "approved" && ["installed", "closed"].includes(r.stage));
    if (box === "draft") return r.status === "draft";
    if (box === "done") return done;
    if (box === "work") return !done && r.status !== "draft";
    return true;
  }
  function paintBody() {
    const b = body();
    if (!b) return;
    const v = S.view;
    b.dataset.view = v ? v.k : S.tab;
    if (v && v.k === "req") { b.innerHTML = S.card ? cardHtml(S.card) : wait(); return; }
    if (v && (v.k === "new" || v.k === "edit")) { b.innerHTML = S.ed && S.ed.spec ? edHtml() : wait(); afterEd(); return; }
    if (v && v.k === "pick") { b.innerHTML = pickHtml(); return; }
    if (v && v.k === "order") { b.innerHTML = S.order ? orderHtml(S.order) : wait(); return; }
    if (!S.list) { b.innerHTML = wait(); return; }
    if (S.tab === "approve") { b.innerHTML = approveHtml(); return; }
    if (S.tab === "pool") { b.innerHTML = S.pool ? poolHtml() : wait(); return; }
    if (S.tab === "orders") { b.innerHTML = S.orders ? ordersHtml() : wait(); return; }
    if (S.tab === "stock") { b.innerHTML = S.stock ? stockHtml() : wait(); return; }
    if (S.tab === "routes") { b.innerHTML = S.routes ? routesHtml() : wait(); return; }
    b.innerHTML = listHtml();
  }
  const wait = () => `<div class="mr-empty">Загружаю…</div>`;
  function listRows() {
    const L = S.list, f = S.f;
    const m = matcher(f.q);
    return L.rows.filter((r) => inBox(r, f.box) && (!f.site || r.site_id === f.site) && (!f.mine || r.author_id === me.id)
      && (!f.q || String(r.no) === f.q.replace(/^№\s*/, "") || m(`${r.site} ${r.author} ${r.place} ${r.comment}`)));
  }
  function segHtml() {
    const L = S.list, f = S.f;
    const count = (box) => L.rows.filter((r) => inBox(r, box) && (!f.site || r.site_id === f.site) && (!f.mine || r.author_id === me.id)).length;
    return BOXES.map(([k, t]) => `<button type="button" class="${f.box === k ? "on" : ""}" data-box="${k}">${t}<i>${count(k)}</i></button>`).join("");
  }
  function listHtml() {
    const L = S.list, f = S.f;
    const rows = listRows();
    const sites = L.sites.filter((s) => L.rows.some((r) => r.site_id === s.id) || s.id === f.site);
    return `<div class="mr-bar">
        <div class="mr-seg" data-segs>${segHtml()}</div>
        ${sites.length > 1 ? `<select class="mr-site-f" data-f-site aria-label="Объект"><option value="">Все объекты</option>${sites.map((s) =>
          `<option value="${esc(s.id)}"${s.id === f.site ? " selected" : ""}>${esc(s.name)}</option>`).join("")}</select>` : ""}
        <label class="mr-check"><input type="checkbox" data-f-mine${f.mine ? " checked" : ""}><span>Мои</span></label>
        <label class="mr-search">${ICO.search}<input type="search" data-f-q value="${esc(f.q)}" placeholder="№, объект, автор…" autocomplete="off"></label>
      </div>
      <div class="mr-list" data-rows>${rows.length ? rows.map(rowHtml).join("") : emptyList()}</div>`;
  }
  /* Отбор списка перерисовывает только строки и счётчики: полоса с
     выпадающим списком объектов остаётся, а то dressSelect (app.js) на
     каждую букву поиска заводил бы новый всплывающий список. */
  function paintList() {
    const b = body(), rowsEl = b && $r("[data-rows]", b), segs = b && $r("[data-segs]", b);
    if (!rowsEl || !segs) { paintBody(); return; }
    const rows = listRows();
    rowsEl.innerHTML = rows.length ? rows.map(rowHtml).join("") : emptyList();
    segs.innerHTML = segHtml();
  }
  function emptyList() {
    if (S.list.rows.length) return `<div class="mr-empty sm">Под отбор ничего не попало.</div>`;
    return `<div class="mr-empty"><b>Заявок пока нет</b>Заявку подают с объекта: «Новая заявка» → объект → отметьте в спецификации,
      что и сколько привезти сейчас, — и отправьте на согласование. Подсказки напомнят про крепёж.
      ${S.list.can.create ? `<button type="button" class="btn-brand" data-new>${ICO.plus}Новая заявка</button>` : ""}</div>`;
  }
  function bar(stages, n) {
    // Полоса хода заявки: доли строк по шагам — сколько смонтировано, на объекте, на складе…
    if (!n) return "";
    const order = ["installed", "issued", "stock", "transit", "ordered", "part", "wait"];
    return `<span class="mr-bar-p" title="${esc(order.filter((k) => stages[k]).map((k) => `${STAGE[k]}: ${stages[k]}`).join(" · "))}">${
      order.filter((k) => stages[k]).map((k) => `<i class="p-${k}" style="flex:${stages[k]}"></i>`).join("")}</span>`;
  }
  function rowHtml(r) {
    const who = r.status === "review" && r.waiting.length ? `ждёт: ${esc(r.waiting.join(", "))}` : "";
    const ln = `${r.lines_n} ${plural(r.lines_n, "позиция", "позиции", "позиций")}`;
    return `<button type="button" class="mr-row${r.mine_to_decide ? " me" : ""}" data-open="${r.id}">
      <span class="mr-row-no">№ ${r.no}</span>
      <span class="mr-row-m"><b>${esc(r.site)}</b><small>${esc(r.author)} · ${esc(stamp(r.sent_at || r.at))} · ${ln}${r.place ? " · " + esc(r.place) : ""}</small></span>
      <span class="mr-row-st">${chip(r)}${r.urgent ? `<i class="mr-urg" title="Срочная">${ICO.flame}</i>` : ""}
        ${r.status === "approved" ? bar(r.stages, r.lines_n) : who ? `<small class="mr-who">${who}</small>` : ""}</span>
      <span class="mr-row-d${r.need_by && late(r.need_by) && inBox(r, "work") ? " late" : ""}">${r.need_by ? "к " + dm(r.need_by) : ""}</span>
    </button>`;
  }
  function approveHtml() {
    const rows = S.list.rows.filter((r) => r.mine_to_decide);
    return `<div class="mr-list">${rows.length ? rows.map(rowHtml).join("")
      : `<div class="mr-empty"><b>Согласовывать нечего</b>Когда заявка дойдёт до вас по маршруту, Nexus напишет в мессенджер, а она появится здесь.</div>`}</div>`;
  }

  /* ── выбор объекта ──────────────────────────────────────── */
  function pickHtml() {
    const sites = S.list ? S.list.sites : [];
    if (!sites.length) return `<div class="mr-empty"><b>Объектов нет</b>Заявку подают с выигранного объекта, который вам открыт.
      Попросите администратора открыть объект в «Пользователях» → «Доступ».</div>`;
    return `<div class="mr-pick"><p class="mr-hint-t">С какого объекта заявка?</p>${sites.map((s) => `<button type="button" class="mr-pick-b" data-pick="${esc(s.id)}">
      ${ICO.pin}<span><b>${esc(s.name)}</b>${s.master || s.foreman ? `<small>${esc([s.master && "мастер " + s.master, s.foreman && "нач. участка " + s.foreman].filter(Boolean).join(" · "))}</small>` : ""}</span></button>`).join("")}</div>`;
  }
  async function startNew(siteId, copy) {
    if (!siteId) {
      const sites = S.list ? S.list.sites : [];
      if (sites.length === 1) siteId = sites[0].id;
      else { S.view = { k: "pick" }; paint(); return; }
    }
    S.view = { k: "new", site: siteId };
    S.ed = edBlank(siteId);
    if (copy) for (const l of copy) S.ed.cart.set(l.key, { key: l.key, qty: l.qty, reason: "", note: "", extra: l.extra, name: l.name, unit: l.unit, title: l.title });
    paint();
    await edLoad();
    if (!copy) edRestore();
  }

  /* ── новая заявка: спецификация, подсказки, корзина ─────── */
  function edBlank(siteId) {
    const site = (S.list && S.list.sites.find((s) => s.id === siteId)) || {};
    return { id: "", no: 0, site: siteId, siteName: site.name || "", spec: null, cart: new Map(), need_by: plusDays(3),
      urgent: false, place: "", comment: "", grp: "", q: "", only: "", step: "pick", free: false, dirty: false };
  }
  async function edLoad() {
    const ed = S.ed;
    try {
      ed.spec = await api("GET", `/req/sites/${encodeURIComponent(ed.site)}/spec`);
    } catch (e) { fail(e, "Спецификация не загрузилась"); S.view = null; paint(); return; }
    ed.siteName = ed.spec.site.name;
    ed.byKey = new Map(ed.spec.items.map((it) => [it.key, it]));
    // Позиции копии или черновика, которых в проекте уже нет, — своими строками.
    for (const [k, l] of ed.cart) {
      const it = ed.byKey.get(k);
      if (!it && !l.extra) { l.extra = true; l.name = l.name || l.title; }
      if (it) l.extra = false;
    }
    paint();
  }
  // Незаконченная заявка живёт в браузере до отправки: пропала связь на объекте — не пропало набранное.
  const draftKey = () => "mr-draft-" + (S.ed && S.ed.site);
  function edStash() {
    const ed = S.ed;
    if (!ed || ed.id) return;
    try {
      if (!ed.cart.size) { localStorage.removeItem(draftKey()); return; }
      localStorage.setItem(draftKey(), JSON.stringify({ at: Date.now(), cart: [...ed.cart.values()], need_by: ed.need_by,
        urgent: ed.urgent, place: ed.place, comment: ed.comment }));
    } catch (_) { /* место кончилось — не страшно */ }
  }
  function edRestore() {
    let d = null;
    try { d = JSON.parse(localStorage.getItem(draftKey()) || "null"); } catch (_) { d = null; }
    if (!d || !Array.isArray(d.cart) || !d.cart.length || Date.now() - d.at > 14 * 864e5) return;
    const ed = S.ed;
    for (const l of d.cart) ed.cart.set(l.key, l);
    Object.assign(ed, { need_by: d.need_by || ed.need_by, urgent: !!d.urgent, place: d.place || "", comment: d.comment || "", restored: true });
    paint();
  }
  const edLines = () => [...S.ed.cart.values()];
  function left(it) { return Math.max(0, (it.spec || 0) - (it.taken || 0)); }
  function edItems() {
    const ed = S.ed, sp = ed.spec;
    const m = matcher(ed.q);
    const recent = new Set(sp.recent || []);
    // Группы — в порядке, в каком их ищет мастер (кабель, трубы, лотки…),
    // внутри — как в проекте; «Щиты и прочее» — в конце.
    const rank = Object.fromEntries(sp.groups.map((g, i) => [g.key, i]));
    return sp.items.map((it, i) => [it, i]).filter(([it]) => (!ed.grp || it.fam === ed.grp)
      && (ed.only !== "cart" || ed.cart.has(it.key)) && (ed.only !== "recent" || recent.has(it.key))
      && (!ed.q || m(`${it.title} ${it.brand} ${it.code} ${it.group}`)))
      .sort((a, b) => (rank[a[0].fam] ?? 99) - (rank[b[0].fam] ?? 99) || a[1] - b[1]).map(([it]) => it);
  }
  function edHtml() {
    const ed = S.ed, sp = ed.spec;
    if (!sp.items.length && !ed.cart.size && !ed.free) {
      return `<div class="mr-empty"><b>Спецификация объекта не разобрана</b>Позиции берутся из проекта объекта («ПТО → Спецификация»).
        Попросите ПТО загрузить и разобрать проект — или добавьте позиции вручную.
        <button type="button" class="btn-brand" data-free-open>${ICO.plus}Позиция вручную</button></div>`;
    }
    const n = ed.cart.size;
    return `<div class="mr-ed${ed.step === "cart" ? " on-cart" : ""}">
      <section class="mr-cat">${catHtml()}</section>
      <aside class="mr-cart" aria-label="Что в заявке">${cartHtml()}</aside>
      <div class="mr-mbar"><button type="button" class="btn-brand mr-mbar-b" data-step="${ed.step === "cart" ? "pick" : "cart"}"${!n && ed.step !== "cart" ? " disabled" : ""}>
        ${ed.step === "cart" ? `${ICO.back}К спецификации` : `${ICO.cart}В заявке ${n} · Далее`}</button></div>
    </div>`;
  }
  function catHtml() {
    const ed = S.ed, sp = ed.spec;
    const items = edItems();
    const cnt = (g) => sp.items.filter((it) => it.fam === g).length;
    const groups = sp.groups.filter((g) => cnt(g.key));
    const head = `<div class="mr-cat-h">
      <label class="mr-search big">${ICO.search}<input type="search" data-ed-q value="${esc(ed.q)}" placeholder="Найти: «ввг 3х2,5», «гофра 20», «лоток»…" autocomplete="off"></label>
      <div class="mr-chips">
        <button type="button" class="${!ed.grp && !ed.only ? "on" : ""}" data-grp="">Все<i>${sp.items.length}</i></button>
        ${(sp.recent || []).length ? `<button type="button" class="${ed.only === "recent" ? "on" : ""}" data-only="recent">${ICO.hist}Недавние</button>` : ""}
        ${groups.map((g) => `<button type="button" class="${ed.grp === g.key && !ed.only ? "on" : ""}" data-grp="${g.key}">${esc(g.name)}<i>${cnt(g.key)}</i></button>`).join("")}
      </div>
      ${ed.restored ? `<p class="mr-note">${ICO.hist}Вернул незаконченную заявку с этого объекта — она хранилась в браузере. <button type="button" class="mr-link" data-ed-clear>Начать заново</button></p>` : ""}
    </div>`;
    if (!items.length) return head + `<div class="mr-empty sm">Ничего не нашлось. Нет в проекте — <button type="button" class="mr-link" data-free-open>добавьте вручную</button>.</div>`;
    // Без поиска — по группам; поиск — единым списком.
    let html = "", last = null;
    for (const it of items.slice(0, 400)) {
      if (!ed.q && !ed.grp && !ed.only && it.fam !== last) {
        last = it.fam;
        html += `<h4 class="mr-gh">${esc((sp.groups.find((g) => g.key === it.fam) || {}).name || "")}</h4>`;
      }
      html += itemHtml(it);
    }
    if (items.length > 400) html += `<p class="mr-note">Показаны первые 400 из ${items.length} — уточните поиск.</p>`;
    return head + `<div class="mr-items">${html}</div>
      <p class="mr-free-p">Нет в проекте? <button type="button" class="mr-link" data-free-open>${ICO.plus}Добавить позицию вручную</button></p>`;
  }
  function stepOf(it) { return it.unit === "м" ? 10 : 1; }
  function itemHtml(it) {
    const ed = S.ed, l = ed.cart.get(it.key);
    const q = l ? l.qty : 0, lf = left(it);
    const over = q > lf + 1e-9 && it.spec > 0;
    return `<div class="mr-it${l ? " in" : ""}${over ? " over" : ""}" data-key="${esc(it.key)}">
      <div class="mr-it-t">
        <b title="${esc(it.title)}">${esc(it.title)}</b>
        <small>${esc([it.brand && !it.title.includes(it.brand) ? it.brand : "", it.code, it.group].filter(Boolean).join(" · "))}</small>
        <span class="mr-lim">по проекту <b>${num(it.spec)}</b> ${esc(it.unit)}${it.taken ? ` · заявлено ${num(it.taken)}` : ""}
          · <button type="button" class="mr-left${lf <= 0 ? " none" : ""}" data-all title="Заказать весь остаток">осталось ${num(lf)}</button>
          ${it.issued || it.installed ? ` · выдано ${num(it.issued)}${it.installed ? `, смонтировано ${num(it.installed)}` : ""}` : ""}
          <button type="button" class="mr-hist" data-hist title="История позиции на объекте" aria-label="История">${ICO.hist}</button></span>
        ${over ? `<span class="mr-over">${ICO.warn}сверх проекта на ${num(q - lf)} ${esc(it.unit)} — причина понадобится</span>` : ""}
      </div>
      <div class="mr-qty"><button type="button" data-dec aria-label="Меньше">${ICO.minus}</button>
        <input data-qty inputmode="decimal" autocomplete="off" value="${q ? num(q).replace(/\s/g, "") : ""}" placeholder="0" aria-label="Количество">
        <button type="button" data-inc aria-label="Больше">${ICO.plus}</button><span class="mr-u">${esc(it.unit)}</span></div>
      ${l ? hintHtml(it, q) : ""}
    </div>`;
  }
  /* Подсказки к позиции в заявке: спутники из проекта в его пропорции, норма
     СП на случай открытой прокладки, «заказывают вместе» — по нашим заявкам. */
  function hintHtml(it, q) {
    const ed = S.ed, sp = ed.spec, h = sp.hints[it.key], tg = (sp.together || {})[it.key] || [];
    const parts = [];
    if (h) {
      for (const s of h.spec) {
        const c = ed.byKey.get(s.key);
        if (!c) continue;
        const want = Math.ceil(Math.round(q * s.ratio * 1e6) / 1e6);
        const have = ed.cart.has(s.key) ? ed.cart.get(s.key).qty : 0;
        const add = Math.max(0, want - have);
        parts.push(`<div class="mr-sug${add ? "" : " ok"}"><span><b>${esc(c.title)}</b><small>по проекту ${num(Math.round(s.ratio * 1000) / 1000)} ${esc(c.unit)} на 1 ${esc(it.unit)} → к ${num(q)} ${esc(it.unit)} — ${num(want)} ${esc(c.unit)}</small></span>
          ${add ? `<button type="button" class="mr-add" data-add="${esc(s.key)}" data-n="${add}">${ICO.plus}${num(add)} ${esc(c.unit)}</button>` : `<i class="mr-ok">${ICO.check}в заявке</i>`}</div>`);
      }
      if (h.norm) {
        const n = h.norm, want = Math.ceil(Math.round(q * n.per * 1e6) / 1e6);
        const use = n.use && ed.byKey.get(n.use);
        const have = use && ed.cart.has(n.use) ? ed.cart.get(n.use).qty : 0;
        const add = Math.max(0, want - have);
        parts.push(`<div class="mr-sug norm${add ? "" : " ok"}"><span><b>${esc(use ? use.title : n.label)}</b><small>если прокладка открытая: ${esc(n.why)}${n.approx ? " (≈)" : ""} → ${num(want)} ${esc(n.unit)}</small></span>
          ${add ? `<button type="button" class="mr-add" ${use ? `data-add="${esc(n.use)}"` : `data-add-free="${esc(n.label)}" data-unit="${esc(n.unit)}"`} data-n="${add}">${ICO.plus}${num(add)} ${esc(n.unit)}</button>`
            : `<i class="mr-ok">${ICO.check}в заявке</i>`}</div>`);
      }
    }
    for (const [k, times] of tg) {
      const c = ed.byKey.get(k);
      if (!c || ed.cart.has(k)) continue;
      parts.push(`<div class="mr-sug tog"><span><b>${esc(c.title)}</b><small>заказывали вместе ${times} ${plural(times, "раз", "раза", "раз")}</small></span>
        <button type="button" class="mr-add" data-add="${esc(k)}" data-n="0">${ICO.plus}Добавить</button></div>`);
    }
    if (!parts.length) return "";
    return `<div class="mr-hint"><p class="mr-hint-h">${ICO.spark}${esc((h && h.why) || "Часто заказывают вместе")}</p>${parts.join("")}</div>`;
  }
  function cartHtml() {
    const ed = S.ed, lines = edLines();
    const over = (l) => { const it = ed.byKey && ed.byKey.get(l.key); return it && it.spec > 0 && l.qty > left(it) + 1e-9; };
    const list = lines.length ? lines.map((l) => {
      const it = ed.byKey && ed.byKey.get(l.key);
      const t = it ? it.title : (l.name || l.title), u = it ? it.unit : l.unit;
      const ov = over(l);
      return `<div class="mr-cl${ov ? " over" : ""}${l.extra ? " extra" : ""}" data-key="${esc(l.key)}">
        <div class="mr-cl-t"><b>${esc(t)}</b>${l.extra ? `<small class="mr-tag">не из проекта</small>` : ""}${ov ? `<small class="mr-tag bad">сверх проекта</small>` : ""}</div>
        <div class="mr-cl-q"><input data-qty inputmode="decimal" value="${num(l.qty).replace(/\s/g, "")}" aria-label="Количество"><span class="mr-u">${esc(u)}</span>
          <button type="button" class="mr-x" data-rm title="Убрать из заявки" aria-label="Убрать">${ICO.x}</button></div>
        ${ov || l.extra ? `<input class="mr-reason" data-reason value="${esc(l.reason || "")}" placeholder="${ov ? "Почему сверх проекта — увидит согласующий" : "Зачем — увидит согласующий"}">` : ""}
      </div>`;
    }).join("") : `<p class="mr-cart-e">Пока пусто. Отметьте количество у позиций спецификации${ed.spec && ed.spec.items.length ? "" : " или добавьте вручную"}.</p>`;
    return `<div class="mr-cart-h"><h3>${ICO.cart}В заявке <i>${lines.length}</i></h3></div>
      <div class="mr-cart-l">${list}</div>
      ${ed.free ? freeHtml() : `<button type="button" class="mr-link mr-free-b" data-free-open>${ICO.plus}Позиции нет в проекте — добавить вручную</button>`}
      <div class="mr-form">
        <label class="mr-fl"><span>Нужно на объекте к</span><input type="date" data-ed-f="need_by" value="${esc(ed.need_by)}" min="${today()}"></label>
        <label class="mr-sw"><input type="checkbox" data-ed-f="urgent"${ed.urgent ? " checked" : ""}><span class="mr-sw-k"></span><span>${ICO.flame}Срочно</span></label>
        <label class="mr-fl wide"><span>Куда и кому на объекте</span><input data-ed-f="place" value="${esc(ed.place)}" placeholder="секция 2, 5 этаж; принимает Иванов, +7…"></label>
        <label class="mr-fl wide"><span>Комментарий</span><textarea data-ed-f="comment" rows="2" placeholder="Что важно знать согласующим и снабжению">${esc(ed.comment)}</textarea></label>
      </div>
      <div class="mr-cart-a">
        <button type="button" class="btn-ghost" data-ed-save>${ICO.check}Черновик</button>
        <button type="button" class="btn-brand" data-ed-send${lines.length ? "" : " disabled"}>${ICO.send}Отправить на согласование</button>
      </div>`;
  }
  function freeHtml() {
    return `<div class="mr-free" data-free>
      <input data-free-name placeholder="Что нужно: «Стяжка нейлоновая 200 мм»" aria-label="Наименование">
      <div class="mr-free-r"><input data-free-qty inputmode="decimal" placeholder="Сколько" aria-label="Количество">
        <div class="mr-seg sm">${UNITS.slice(0, 4).map((u, i) => `<button type="button" class="${i ? "" : "on"}" data-free-unit="${u}">${u}</button>`).join("")}</div></div>
      <input data-free-reason placeholder="Зачем — увидит согласующий" aria-label="Зачем">
      <div class="mr-free-a"><button type="button" class="btn-ghost sm" data-free-close>Отмена</button>
        <button type="button" class="btn-brand sm" data-free-add>${ICO.plus}В заявку</button></div></div>`;
  }
  function afterEd() {
    const ed = S.ed;
    if (!ed || !ed.focus) return;
    const el = $r(ed.focus, body());
    ed.focus = "";
    if (el) { el.focus(); if (el.select) el.select(); }
  }
  function edSet(key, qty, extra) {
    const ed = S.ed;
    const it = ed.byKey && ed.byKey.get(key);
    if (qty <= 0) ed.cart.delete(key);
    else {
      const l = ed.cart.get(key) || { key, reason: "", note: "", extra: !it, ...(extra || {}) };
      l.qty = Math.round(qty * 1000) / 1000;
      if (it) { l.title = it.title; l.unit = it.unit; }
      ed.cart.set(key, l);
    }
    ed.dirty = true;
    edStash();
  }
  // Перерисовать одну позицию каталога и корзину — без прыжка списка.
  function edRepaint(key) {
    const ed = S.ed;
    const it = ed.byKey && ed.byKey.get(key);
    const row = it && $r(`.mr-items .mr-it[data-key="${CSS.escape(key)}"]`, body());
    if (row) row.outerHTML = itemHtml(it);
    const cart = $r(".mr-cart", body());
    if (cart) cart.innerHTML = cartHtml();
    const mb = $r(".mr-mbar-b", body());
    if (mb && ed.step !== "cart") { mb.disabled = !ed.cart.size; mb.innerHTML = `${ICO.cart}В заявке ${ed.cart.size} · Далее`; }
  }
  function edBody() {
    const ed = S.ed;
    return { site_id: ed.site, need_by: ed.need_by, urgent: ed.urgent, place: ed.place, comment: ed.comment,
      lines: edLines().map((l) => l.extra ? { name: l.name || l.title, unit: l.unit, qty: l.qty, reason: l.reason, note: l.note }
        : { key: l.key, qty: l.qty, reason: l.reason, note: l.note }) };
  }
  async function edSubmit(send) {
    const ed = S.ed;
    if (!ed.cart.size) { ASK.alert("В заявке нет позиций."); return; }
    if (send) {
      const miss = edLines().filter((l) => { const it = ed.byKey && ed.byKey.get(l.key); return it && it.spec > 0 && l.qty > left(it) + 1e-9 && !String(l.reason || "").trim(); });
      if (miss.length) {
        ed.step = "cart"; paintBody();
        ASK.alert(`Сверх проекта: ${miss.map((l) => "«" + (l.title || l.name) + "»").join(", ")}. Напишите причину — её увидит согласующий.`, { title: "Нужна причина" });
        return;
      }
    }
    const b = edBody();
    b.send = !!send;
    try {
      const out = ed.id ? await api("PATCH", "/req/" + ed.id, b) : await api("POST", "/req", b);
      try { localStorage.removeItem(draftKey()); } catch (_) { /* пусть */ }
      S.ed = null;
      await load("list");
      openReq(out.request.id, out.request);
      if (send) toast(out.request.status === "approved" ? "Заявка согласована и ушла в снабжение"
        : `Заявка № ${out.request.no} отправлена${out.request.waiting.length ? " — ждёт: " + out.request.waiting.join(", ") : ""}`);
      else toast("Черновик сохранён");
    } catch (e) { fail(e, send ? "Не отправилась" : "Не сохранилась"); }
  }
  async function edOpenDraft(r) {
    S.view = { k: "edit", id: r.id };
    S.ed = edBlank(r.site_id);
    Object.assign(S.ed, { id: r.id, no: r.no, siteName: r.site, need_by: r.need_by, urgent: r.urgent, place: r.place, comment: r.comment });
    for (const l of r.lines) S.ed.cart.set(l.key, { key: l.key, qty: l.qty, reason: l.reason, note: l.note, extra: l.extra, name: l.name, title: l.title, unit: l.unit });
    paint();
    await edLoad();
  }

  /* ── история позиции ────────────────────────────────────── */
  async function history(siteId, it) {
    let h;
    try { h = await api("GET", `/req/sites/${encodeURIComponent(siteId)}/history?key=${encodeURIComponent(it.key)}`); }
    catch (e) { fail(e); return; }
    const mv = { issue: "выдано на объект", install: "смонтировано", receive: "пришло на склад" };
    const d = dialog(`<header class="mr-dh"><div><h3>${esc(it.title)}</h3><p>${esc(S.ed ? S.ed.siteName : "")} · по проекту ${num(it.spec)} ${esc(it.unit)}</p></div>
        <button type="button" class="mr-x" data-x aria-label="Закрыть">${ICO.x}</button></header>
      <div class="mr-db">
        <h4>Заявки</h4>${h.lines.length ? `<ul class="mr-hl">${h.lines.map((l) => `<li><button type="button" class="mr-link" data-go-req="${l.req_id}">№ ${l.no}</button>
          <span>${esc(atDay(l.at))} · ${esc(l.author)}</span><b>${num(l.qty_ok ?? l.qty)} ${esc(l.unit)}</b>
          <i class="mr-chip ${l.state ? "s-" + l.state.stage : l.status}">${esc(l.state ? STAGE[l.state.stage] : ST[l.status])}</i></li>`).join("")}</ul>`
          : `<p class="mr-note">По этой позиции заявок ещё не было.</p>`}
        ${h.moves.length ? `<h4>Движение</h4><ul class="mr-hl">${h.moves.map((m) => `<li><span>${esc(stamp(m.at))} · № ${m.no}</span><span>${esc(mv[m.kind] || m.kind)}${m.by ? " — " + esc(m.by) : ""}</span><b>${num(m.qty)}</b></li>`).join("")}</ul>` : ""}
        ${h.docs.length ? `<h4>Документы</h4><div class="mr-docs">${h.docs.map(docHtml).join("")}</div>` : ""}
      </div>`, "mr-small");
    d.wrap.addEventListener("click", (ev) => {
      const g = ev.target.closest("[data-go-req]");
      if (g) { d.close(); openReq(g.dataset.goReq); }
    });
  }

  /* ── карточка заявки ────────────────────────────────────── */
  async function openReq(id, ready) {
    if (typeof openSection === "function" && document.documentElement.dataset.sec !== "req") {
      const a = document.querySelector('.side a[data-s="req"]');
      if (a && !a.hidden) openSection("req");
    }
    frame();
    S.view = { k: "req", id };
    S.card = ready && ready.lines ? ready : null;
    paint();
    if (!S.card) {
      try { S.card = (await api("GET", "/req/" + id)).request; }
      catch (e) { fail(e, "Заявка не открылась"); S.view = null; paint(); return; }
      paint();
    }
    badge();
  }
  async function openNo(no) {
    try {
      const out = await api("GET", "/req/n/" + Number(no));
      openReq(out.request.id, out.request);
    } catch (e) { fail(e, "Заявка не открылась"); }
  }
  function cardActions(r) {
    const c = r.can || {};
    return `${c.edit ? `<button type="button" class="btn-ghost sm" data-edit>${ICO.edit}<span>Изменить</span></button>` : ""}
      ${c.send ? `<button type="button" class="btn-brand sm" data-send>${ICO.send}<span>Отправить</span></button>` : ""}
      ${c.copy && r.status !== "draft" ? `<button type="button" class="btn-ghost sm mr-wide" data-copy title="Новая заявка с теми же позициями">${ICO.copy}<span>Повторить</span></button>` : ""}
      ${c.cancel ? `<button type="button" class="btn-ghost sm mr-wide" data-cancel>${ICO.stop}<span>Отменить</span></button>` : ""}
      ${c.delete ? `<button type="button" class="mr-ib" data-del title="Удалить черновик" aria-label="Удалить черновик">${ICO.trash}</button>` : ""}`;
  }
  function stepsHtml(r) {
    if (!r.steps || !r.steps.length) return "";
    return `<ol class="mr-steps">${r.steps.map((s, i) => {
      const cur = r.status === "review" && i === r.step;
      const st = s.skip ? "skip" : s.act === "approve" ? "ok" : s.act === "return" ? "ret" : s.act === "reject" ? "no" : cur ? "cur" : "todo";
      const ic = { skip: ICO.skip, ok: ICO.check, ret: ICO.back, no: ICO.stop, cur: ICO.wait, todo: ICO.wait }[st];
      const who = s.who.map((w) => `<span class="${s.ok.includes(w.id) ? "ok" : ""}">${esc(w.name)}</span>`).join(", ");
      const what = s.skip ? `пропущен: ${esc(s.skip)}` : s.done_at ? `${esc({ approve: "согласовал(а)", return: "вернул(а) на доработку", reject: "отклонил(а)" }[s.act] || "")} ${esc(s.by || "")} · ${esc(stamp(s.done_at))}`
        : cur ? (s.mode === "all" ? "ждём всех" : "ждём любого") : "дальше";
      return `<li class="${st}"><i>${ic}</i><span><b>${esc(s.title)}</b><small>${who || "—"}</small><small class="mr-st-w">${what}</small></span></li>`;
    }).join("")}</ol>`;
  }
  function lineStateHtml(l) {
    const s = l.state;
    if (!s) return "";
    const need = s.need || 0;
    const seg = (k, v) => v > 0 && need > 0 ? `<i class="p-${k}" style="width:${Math.min(100, v / need * 100)}%"></i>` : "";
    const ord = Math.max(0, Math.max(s.ordered, s.issued) - s.issued - s.stock - s.transit);
    return `<span class="mr-ls"><span class="mr-bar-p wide">${seg("installed", s.installed)}${seg("issued", s.issued - s.installed)}${seg("stock", s.stock)}${seg("transit", s.transit)}${seg("ordered", ord)}</span>
      <small>${[s.ordered ? `заказано ${num(s.ordered)}` : "", s.transit ? `в пути ${num(s.transit)}` : "", s.stock ? `на складе ${num(s.stock)}` : "",
        s.issued ? `на объекте ${num(s.issued)}` : "", s.installed ? `смонтировано ${num(s.installed)}` : ""].filter(Boolean).join(" · ") || "ещё не заказано"}${s.closed ? ` · остаток закрыт${l.close_note ? ": " + esc(l.close_note) : ""}` : ""}</small></span>`;
  }
  function cardHtml(r) {
    const c = r.can || {};
    const mode = S.cardMode || "";          // decide | issue | install | close
    const lines = r.lines.map((l) => {
      const ok = l.qty_ok ?? l.qty;
      const input = mode === "decide" ? `<input class="mr-in" data-dq="${l.id}" inputmode="decimal" value="${num(ok).replace(/\s/g, "")}" aria-label="Согласовать">`
        : mode === "issue" && l.state && l.state.to_issue > 0 ? `<input class="mr-in" data-iq="${l.id}" inputmode="decimal" value="${
          l.state.stock > 0 ? num(Math.min(l.state.to_issue, l.state.stock)).replace(/\s/g, "") : ""}" placeholder="0" aria-label="Выдать">`
        : mode === "install" && l.state && l.state.issued - l.state.installed > 0 ? `<input class="mr-in" data-sq="${l.id}" inputmode="decimal" value="${
          num(l.state.issued - l.state.installed).replace(/\s/g, "")}" placeholder="0" aria-label="Смонтировано">`
        : mode === "close" && l.state && !l.state.closed && l.state.stage !== "installed" ? `<label class="mr-check"><input type="checkbox" data-cq="${l.id}"><span>закрыть</span></label>` : "";
      return `<div class="mr-l${l.closed ? " closed" : ""}">
        <div class="mr-l-t"><b>${esc(l.title)}</b>
          <small>${l.extra ? '<span class="mr-tag">не из проекта</span>' : ""}${l.over ? `<span class="mr-tag bad">сверх проекта</span>` : ""}${
            l.spec !== null && l.spec !== undefined && !l.extra ? `по проекту ${num(l.spec)}${l.taken ? `, другими заявками ${num(l.taken)}` : ""}` : ""}${l.reason ? ` · «${esc(l.reason)}»` : ""}</small>
          ${lineStateHtml(l)}</div>
        <div class="mr-l-q"><b>${num(ok)}</b> ${esc(l.unit)}${l.qty_ok !== null && l.qty_ok !== undefined && l.qty_ok !== l.qty ? `<small>просили ${num(l.qty)}</small>` : ""}</div>
        ${input ? `<div class="mr-l-in">${input}</div>` : ""}
      </div>`;
    }).join("");
    const note = r.answer && (r.status === "draft" || r.status === "rejected" || r.status === "canceled")
      ? `<div class="mr-callout ${r.status === "draft" ? "warn" : "bad"}">${ICO.warn}<span><b>${r.status === "draft" ? "Вернули на доработку" : r.status === "rejected" ? "Отклонена" : "Отменена"}</b>${esc(r.answer)}</span></div>` : "";
    const me2 = r.mine_to_decide || (c.decide && c.for_other);
    const decide = c.decide ? (mode === "decide"
      ? `<div class="mr-act-p"><p>${me2 && c.for_other ? "Вы решаете за согласующего — так и запишется в журнал. " : ""}Количество можно урезать в строках.</p>
          <textarea data-reason-dec rows="2" placeholder="Замечание или причина — обязательно, если возвращаете или отклоняете"></textarea>
          <div class="mr-act-b"><button type="button" class="btn-ghost" data-dec-act="reject">${ICO.stop}Отклонить</button>
            <button type="button" class="btn-ghost" data-dec-act="return">${ICO.back}На доработку</button>
            <button type="button" class="btn-brand" data-dec-act="approve">${ICO.check}Согласовать</button></div></div>`
      : `<div class="mr-act-p go"><p>${r.mine_to_decide ? "Заявка ждёт вашего решения." : "Заявка ждёт: " + esc(r.waiting.join(", ")) + ". Вы администратор — можете решить за согласующего."}</p>
          <button type="button" class="btn-brand" data-mode="decide">${ICO.check}Рассмотреть</button></div>`) : "";
    const modeBar = mode && mode !== "decide" ? `<div class="mr-act-p"><p>${{ issue: "Сколько выдаёте со склада на объект — по строкам. Можно приложить накладную или УПД.", install: "Сколько смонтировано — по строкам.", close: "Отметьте строки: больше по ним не везём." }[mode]}</p>
        ${mode === "issue" ? `<label class="mr-file"><input type="file" data-mode-files multiple accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"><span>${ICO.clip}Приложить документ</span></label><span class="mr-files-n" data-files-n></span>` : ""}
        ${mode === "close" ? `<input data-close-note placeholder="Почему больше не везём: заменили, хватило, отказались…">` : ""}
        <div class="mr-act-b"><button type="button" class="btn-ghost" data-mode="">Отмена</button>
          <button type="button" class="btn-brand" data-mode-go="${mode}">${ICO.check}${{ issue: "Выдать", install: "Отметить", close: "Закрыть остаток" }[mode]}</button></div></div>` : "";
    const tools = r.status === "approved" && !mode ? `<div class="mr-tools">
        ${c.install ? `<button type="button" class="btn-ghost sm" data-mode="install">${ICO.tool}Отметить смонтированное</button>` : ""}
        ${c.issue ? `<button type="button" class="btn-ghost sm" data-mode="issue">${ICO.truck}Выдать со склада</button>` : ""}
        ${c.close ? `<button type="button" class="btn-ghost sm" data-mode="close">${ICO.stop}Закрыть остаток</button>` : ""}</div>` : "";
    return `<div class="mr-card">
      <div class="mr-card-main">
        ${note}
        <dl class="mr-facts">
          <div><dt>Объект</dt><dd>${esc(r.site)}</dd></div>
          <div><dt>Автор</dt><dd>${esc(r.author)}</dd></div>
          <div><dt>Нужно к</dt><dd class="${r.need_by && late(r.need_by) && !["installed", "closed"].includes(r.stage) && r.status !== "rejected" && r.status !== "canceled" ? "late" : ""}">${r.need_by ? dmy(r.need_by) : "—"}${r.urgent ? ` <i class="mr-urg">${ICO.flame}срочно</i>` : ""}</dd></div>
          <div><dt>${r.sent_at ? "Отправлена" : "Создана"}</dt><dd>${esc(stamp(r.sent_at || r.at))}</dd></div>
          ${r.place ? `<div class="wide"><dt>Куда и кому</dt><dd>${esc(r.place)}</dd></div>` : ""}
          ${r.comment ? `<div class="wide"><dt>Комментарий</dt><dd>${esc(r.comment)}</dd></div>` : ""}
        </dl>
        ${decide}${modeBar}${tools}
        <h3 class="mr-sh">Позиции <i>${r.lines.length}</i></h3>
        <div class="mr-lines${mode ? " m-" + mode : ""}">${lines}</div>
        ${r.orders.length ? `<h3 class="mr-sh">Заказы поставщикам</h3><div class="mr-ords">${r.orders.map((o) => `<button type="button" class="mr-ord" ${S.list && S.list.can.snab ? `data-order="${o.id}"` : "disabled"}>
          ${ICO.truck}<b>№ ${o.no} · ${esc(o.supplier)}</b><i class="mr-chip o-${o.status}">${esc(ORDER_ST[o.status] || "")}</i>${o.expect ? `<small>ожидается ${dmy(o.expect)}</small>` : ""}</button>`).join("")}</div>` : ""}
      </div>
      <div class="mr-card-side">
        ${r.steps && r.steps.length ? `<h3 class="mr-sh">Согласование${r.route ? ` <small>${esc(r.route)}</small>` : ""}</h3>${stepsHtml(r)}` : ""}
        <h3 class="mr-sh">Документы <i>${r.docs.length}</i></h3>
        <div class="mr-docs">${r.docs.map(docHtml).join("") || `<p class="mr-note">УПД, накладные, фото — сюда.</p>`}</div>
        ${c.docs ? `<label class="mr-file"><input type="file" data-req-files multiple accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"><span>${ICO.clip}Приложить УПД или фото</span></label>` : ""}
        <div class="mr-ups" data-ups></div>
        <h3 class="mr-sh">Журнал</h3>${logHtml(r.log)}
      </div>
    </div>`;
  }
  function docHtml(d) {
    const href = `/api/req/docs/${encodeURIComponent(d.id)}?view=1`;
    return `<a class="mr-doc" href="${href}" data-doc="${esc(d.id)}" target="_blank" rel="noopener">${ICO.doc}<span><b>${esc(d.kind_name)}${d.number ? " № " + esc(d.number) : ""}</b><small>${esc(d.name)} · ${size(d.size)} · ${esc(d.author)}, ${esc(atDay(d.at))}</small></span></a>`;
  }
  function logHtml(log) {
    const what = { create: "завёл(а) черновик", send: "отправил(а) на согласование", approve: "согласовал(а)", return: "вернул(а) на доработку",
      reject: "отклонил(а)", trim: "урезал(а)", approved: "согласована — в снабжение", cancel: "отменил(а)", order: "заказано у поставщика",
      order_cancel: "заказ отменён", issue: "выдано на объект", install: "отмечено смонтированное", close: "остаток закрыт", doc: "приложен документ" };
    return `<ul class="mr-log">${(log || []).slice().reverse().map((x) => `<li><time>${esc(stamp(x.at))}</time><span><b>${esc(x.by || "")}</b> ${esc(what[x.what] || x.what)}${
      x.what === "trim" ? `: «${esc(x.title)}» ${num(x.frm)} → ${num(x.to)} ${esc(x.unit || "")}` : ""}${x.step ? ` — ${esc(x.step)}` : ""}${x.route ? ` — маршрут «${esc(x.route)}»` : ""}${
      x.order ? ` № ${x.order}` : ""}${x.supplier ? ` «${esc(x.supplier)}»` : ""}${x.n ? `: ${x.n} ${plural(x.n, "позиция", "позиции", "позиций")}` : ""}${
      x.title && x.what === "close" ? `: «${esc(x.title)}»` : ""}${x.text ? ` — «${esc(x.text)}»` : ""}</span></li>`).join("")}</ul>`;
  }
  // Документ кусками; ctx — {req} или {order}; без него — к будущей выдаче.
  function upload(file, ctx, onProgress) {
    return new Promise((ok, no) => {
      if (file.size > FILE_MAX) { no(new Error(`«${file.name}» больше ${FILE_MAX >> 20} МБ`)); return; }
      if (!file.size) { no(new Error(`«${file.name}» пустой`)); return; }
      let fid = "", offset = 0;
      const step = () => {
        const x = new XMLHttpRequest();
        x.open("POST", "/api/req/files");
        x.setRequestHeader("Authorization", "Bearer " + AUTH.token());
        x.setRequestHeader("X-File-Size", String(file.size));
        x.setRequestHeader("X-File-Offset", String(offset));
        x.setRequestHeader("Content-Type", file.type || "application/octet-stream");
        if (fid) x.setRequestHeader("X-File-Id", fid);
        else {
          x.setRequestHeader("X-File-Name", encodeURIComponent(file.name || "документ"));
          x.setRequestHeader("X-Doc-Kind", /^image\//.test(file.type) ? "photo" : "upd");
          if (ctx && ctx.req) x.setRequestHeader("X-Doc-Req", ctx.req);
          if (ctx && ctx.order) x.setRequestHeader("X-Doc-Order", ctx.order);
        }
        x.upload.onprogress = (ev) => { if (ev.lengthComputable && onProgress) onProgress((offset + ev.loaded) / file.size); };
        x.onload = () => {
          let d = null;
          try { d = JSON.parse(x.responseText); } catch (_) { /* не наш ответ */ }
          if (x.status !== 200 || !d) { no(new Error((d && d.error) || "ошибка " + x.status)); return; }
          fid = d.id; offset = d.got;
          if (d.done) ok(d); else step();
        };
        x.onerror = () => no(new Error("нет связи с сервером"));
        x.send(file.slice(offset, offset + CHUNK));
      };
      step();
    });
  }
  async function uploadToReq(files) {
    const r = S.card, box = $r("[data-ups]", body());
    for (const f of files) {
      const el = document.createElement("div");
      el.className = "mr-up";
      el.innerHTML = `${ICO.clip}<span>${esc(f.name)}</span><small>0%</small>`;
      if (box) box.appendChild(el);
      try {
        await upload(f, { req: r.id }, (p) => { const s = el.querySelector("small"); if (s) s.textContent = Math.round(p * 100) + "%"; });
        el.remove();
      } catch (e) { el.classList.add("bad"); el.querySelector("small").textContent = e.message; }
    }
    await reloadCard();
  }
  async function reloadCard() {
    if (!S.card) return;
    try { S.card = (await api("GET", "/req/" + S.card.id)).request; } catch (e) { fail(e); }
    paint();
  }
  async function modeGo(mode) {
    const r = S.card, b = body();
    const pick = (attr) => {
      const out = {};
      $$r(`[${attr}]`, b).forEach((i) => {
        const raw = i.value.trim() === "" ? i.placeholder : i.value;
        const q = parseQty(raw);
        if (q > 0) out[i.getAttribute(attr)] = q;
      });
      return out;
    };
    try {
      if (mode === "issue") {
        const lines = pick("data-iq");
        if (!Object.keys(lines).length) { ASK.alert("Отметьте, сколько выдаёте."); return; }
        const files = [...(($r("[data-mode-files]", b) || {}).files || [])];
        const docs = [];
        for (const f of files) docs.push((await upload(f, null)).id);
        S.card = (await api("POST", `/req/${r.id}/issue`, { lines, docs })).request;
        toast("Выдано на объект — мастеру ушло сообщение");
      } else if (mode === "install") {
        const lines = pick("data-sq");
        if (!Object.keys(lines).length) { ASK.alert("Отметьте, сколько смонтировано."); return; }
        S.card = (await api("POST", `/req/${r.id}/install`, { lines })).request;
        toast("Отмечено");
      } else if (mode === "close") {
        const lines = $$r("[data-cq]", b).filter((i) => i.checked).map((i) => i.dataset.cq);
        if (!lines.length) { ASK.alert("Отметьте строки."); return; }
        S.card = (await api("POST", `/req/${r.id}/close`, { lines, note: ($r("[data-close-note]", b) || {}).value || "" })).request;
      }
      S.cardMode = "";
      paint();
      load("list");
    } catch (e) { fail(e); }
  }
  async function decide(act) {
    const r = S.card, b = body();
    const reason = (($r("[data-reason-dec]", b) || {}).value || "").trim();
    if (act !== "approve" && reason.length < 3) { ASK.alert("Напишите причину — её увидит автор заявки.", { title: "Нужна причина" }); return; }
    const qty = {};
    $$r("[data-dq]", b).forEach((i) => {
      const l = r.lines.find((x) => x.id === i.dataset.dq);
      const v = i.value.trim() === "" ? 0 : Number(i.value.replace(/\s/g, "").replace(",", "."));
      if (l && Number.isFinite(v) && Math.abs(v - (l.qty_ok ?? l.qty)) > 1e-9) qty[l.id] = v;
    });
    if (act === "approve" && Object.keys(qty).length
      && !(await ASK.confirm(`Согласовать с изменённым количеством (${Object.keys(qty).length} ${plural(Object.keys(qty).length, "строка", "строки", "строк")})?`))) return;
    if (act === "reject" && !(await ASK.confirm(`Отклонить заявку № ${r.no}? Автор увидит причину.`, { ok: "Отклонить", danger: true }))) return;
    try {
      const out = await api("POST", `/req/${r.id}/decide`, { act, reason, qty });
      S.cardMode = "";
      S.card = out.request;
      toast(act === "approve" ? (out.request.status === "approved" ? "Согласовано — заявка ушла в снабжение" : "Согласовано — дальше: " + out.request.waiting.join(", "))
        : act === "return" ? "Вернули на доработку" : "Отклонено");
      paint();
      load("list");
    } catch (e) { fail(e); }
  }

  /* ── снабжение: свод ────────────────────────────────────── */
  function poolHtml() {
    const P = S.pool;
    if (!P.groups.length) return `<div class="mr-empty"><b>Заказывать нечего</b>Здесь — согласованные заявки, которые ещё не заказаны:
      одинаковый материал из разных заявок и объектов — одной строкой.</div>`;
    const sel = S.poolSel;
    const rows = P.groups.map((g) => {
      const open = S.poolOpen.has(g.key);
      return `<div class="mr-pg-r${sel.has(g.key) ? " sel" : ""}${g.urgent ? " urg" : ""}" data-g="${esc(g.key)}">
        <label class="mr-check"><input type="checkbox" data-gsel${sel.has(g.key) ? " checked" : ""} aria-label="Выбрать"></label>
        <button type="button" class="mr-pg-t" data-gopen><b>${esc(g.title)}</b><small>${g.lines.length} ${plural(g.lines.length, "заявка", "заявки", "заявок")} · ${esc(g.sites.join(", "))}${g.extra ? " · не из проекта" : ""}</small></button>
        <span class="mr-pg-n"><b>${num(g.need)}</b> ${esc(g.unit)}</span>
        <span class="mr-pg-s">${g.stock > 0 ? `на складе ${num(g.stock)}` : ""}</span>
        <span class="mr-pg-d${g.need_by && late(g.need_by) ? " late" : ""}">${g.urgent ? `<i class="mr-urg">${ICO.flame}</i>` : ""}${g.need_by ? "к " + dm(g.need_by) : ""}</span>
        ${open ? `<div class="mr-pg-x">${g.lines.map((x) => `<div><button type="button" class="mr-link" data-open="${x.req_id}">№ ${x.no}</button>
          <span>${esc(x.site)} · ${esc(x.author)}${x.need_by ? " · к " + dm(x.need_by) : ""}${x.urgent ? " · срочно" : ""}${x.note ? " · " + esc(x.note) : ""}</span><b>${num(x.qty)} ${esc(g.unit)}</b></div>`).join("")}</div>` : ""}
      </div>`;
    }).join("");
    const n = sel.size;
    return `<div class="mr-pool">
      <p class="mr-note">${ICO.info || ""}Одинаковый материал из разных заявок — одной строкой. Отметьте строки и закажите разом: количество можно взять больше (бухта, упаковка) — лишнее ляжет на склад.</p>
      <div class="mr-pg-head"><label class="mr-check"><input type="checkbox" data-gall${n && n === P.groups.length ? " checked" : ""} title="Выбрать все" aria-label="Выбрать все"></label><span>Материал</span><span>Нужно</span><span>Склад</span><span>Срок</span></div>
      ${rows}
      <div class="mr-sbar${n ? " on" : ""}"><span>Выбрано: ${n}</span>
        <button type="button" class="btn-brand" data-order-new${n ? "" : " disabled"}>${ICO.truck}Заказать у поставщика</button></div>
    </div>`;
  }
  function orderDialog() {
    const P = S.pool;
    const groups = P.groups.filter((g) => S.poolSel.has(g.key));
    if (!groups.length) return;
    const sites = new Set(groups.flatMap((g) => g.lines.map((x) => x.site_id)));
    const d = dialog(`<header class="mr-dh"><div><h3>Заказ поставщику</h3><p>${groups.length} ${plural(groups.length, "позиция", "позиции", "позиций")} из ${
        new Set(groups.flatMap((g) => g.lines.map((x) => x.no))).size} заявок</p></div><button type="button" class="mr-x" data-x aria-label="Закрыть">${ICO.x}</button></header>
      <div class="mr-db">
        <label class="mr-fl"><span>Поставщик</span><input data-o="supplier" list="mrSup" placeholder="ЭТМ, Элком, РС…" autocomplete="off"></label>
        <datalist id="mrSup">${(P.suppliers || []).map((s) => `<option value="${esc(s)}">`).join("")}</datalist>
        <div class="mr-fl"><span>Куда везти</span><div class="mr-seg"><button type="button" class="on" data-deliver="warehouse">${ICO.box}На склад</button>
          <button type="button" data-deliver="site"${sites.size === 1 ? "" : " disabled title=\"Все строки должны быть с одного объекта\""}>${ICO.pin}Сразу на объект</button></div></div>
        <div class="mr-row2"><label class="mr-fl"><span>Ожидается</span><input type="date" data-o="expect" min="${today()}"></label>
          <label class="mr-fl"><span>Счёт поставщика</span><input data-o="invoice" placeholder="№ счёта"></label></div>
        <table class="mr-otbl"><thead><tr><th>Материал</th><th>Нужно</th><th>Заказать</th></tr></thead><tbody>${groups.map((g) => `<tr data-g="${esc(g.key)}">
          <td><b>${esc(g.title)}</b><small>${g.lines.map((x) => "№ " + x.no).join(", ")}</small></td><td>${num(g.need)} ${esc(g.unit)}</td>
          <td><input class="mr-in" data-oq inputmode="decimal" value="${num(g.need).replace(/\s/g, "")}"> ${esc(g.unit)}</td></tr>`).join("")}</tbody></table>
        <label class="mr-fl"><span>Пометка</span><input data-o="note" placeholder="Условия, контакт, что уточнить"></label>
      </div>
      <footer class="mr-df"><button type="button" class="btn-ghost" data-x>Отмена</button><button type="button" class="btn-brand" data-go>${ICO.truck}Заказать</button></footer>`);
    let deliver = "warehouse";
    d.wrap.addEventListener("click", async (ev) => {
      const dv = ev.target.closest("[data-deliver]");
      if (dv && !dv.disabled) { deliver = dv.dataset.deliver; $$r("[data-deliver]", d.wrap).forEach((b) => b.classList.toggle("on", b === dv)); }
      if (!ev.target.closest("[data-go]")) return;
      const val = (k) => ($r(`[data-o="${k}"]`, d.wrap) || {}).value || "";
      const lines = groups.map((g) => ({ key: g.key, qty: parseQty($r(`tr[data-g="${CSS.escape(g.key)}"] [data-oq]`, d.wrap).value), lines: g.lines.map((x) => x.line_id) }));
      try {
        const out = await api("POST", "/req/orders", { supplier: val("supplier"), deliver, expect: val("expect"), invoice: val("invoice"), note: val("note"), lines });
        d.close();
        S.poolSel.clear();
        toast(`Заказ № ${out.order.no} у «${out.order.supplier}» заведён — авторам заявок ушли сообщения`);
        await load("pool");
        openOrder(out.order.id, out.order);
      } catch (e) { fail(e, "Заказ не заведён"); }
    });
    setTimeout(() => { const i = $r('[data-o="supplier"]', d.wrap); if (i) i.focus(); }, 30);
  }

  /* ── заказы поставщикам ─────────────────────────────────── */
  function ordersHtml() {
    const rows = S.orders.rows;
    if (!rows.length) return `<div class="mr-empty"><b>Заказов пока нет</b>Заказ заводится из «Свода»: отметьте материалы и нажмите «Заказать у поставщика».</div>`;
    return `<div class="mr-list">${rows.map((o) => `<button type="button" class="mr-row" data-order="${o.id}">
      <span class="mr-row-no">№ ${o.no}</span>
      <span class="mr-row-m"><b>${esc(o.supplier)}</b><small>${o.lines_n} ${plural(o.lines_n, "позиция", "позиции", "позиций")} · заявки ${o.requests.map((n) => "№ " + n).join(", ")} · ${esc(o.sites.join(", "))}${o.deliver === "site" ? " · сразу на объект" : ""}</small></span>
      <span class="mr-row-st"><i class="mr-chip o-${o.status}">${esc(o.status_name)}</i>${o.status !== "ordered" && o.status !== "canceled" ? `<small>принято ${Math.round(o.received * 100)}%</small>` : ""}${o.docs ? `<small>${ICO.doc}${o.docs}</small>` : ""}</span>
      <span class="mr-row-d${o.late ? " late" : ""}">${o.expect ? "к " + dm(o.expect) : ""}</span></button>`).join("")}</div>`;
  }
  async function openOrder(id, ready) {
    S.view = { k: "order", id };
    S.order = ready || null;
    paint();
    if (!ready) {
      try { S.order = (await api("GET", "/req/orders/" + id)).order; }
      catch (e) { fail(e, "Заказ не открылся"); S.view = null; paint(); return; }
      paint();
    }
  }
  function orderActions(o) {
    const c = o.can || {};
    return `${c.edit && o.status === "ordered" ? `<button type="button" class="btn-ghost sm" data-o-transit>${ICO.truck}<span>В пути</span></button>` : ""}
      ${c.receive ? `<button type="button" class="btn-brand sm" data-o-receive>${ICO.box}<span>${o.deliver === "site" ? "Привезли на объект" : "Принять на склад"}</span></button>` : ""}
      ${c.edit ? `<button type="button" class="btn-ghost sm mr-wide" data-o-edit>${ICO.edit}<span>Изменить</span></button>` : ""}
      ${c.cancel ? `<button type="button" class="mr-ib" data-o-cancel title="Отменить заказ" aria-label="Отменить заказ">${ICO.stop}</button>` : ""}`;
  }
  function orderHtml(o) {
    return `<div class="mr-card">
      <div class="mr-card-main">
        ${o.note ? `<div class="mr-callout">${ICO.info || ICO.doc}<span>${esc(o.note)}</span></div>` : ""}
        <h3 class="mr-sh">Позиции <i>${o.lines.length}</i></h3>
        <div class="mr-lines">${o.lines.map((l) => `<div class="mr-l">
          <div class="mr-l-t"><b>${esc(l.title)}</b><small>${l.alloc.map((a) => a.visible ? `<button type="button" class="mr-link" data-open="${a.req_id}">№ ${a.no}</button> ${esc(a.site)} — ${num(a.qty)}${a.got ? ` (пришло ${num(a.got)})` : ""}` : `№ ${a.no} — ${num(a.qty)}`).join(" · ")}${l.spare > 0 ? ` · на склад сверх заявок ${num(l.spare)}` : ""}</small>
            <span class="mr-ls"><span class="mr-bar-p wide"><i class="p-stock" style="width:${Math.min(100, l.received / l.qty * 100)}%"></i></span><small>принято ${num(l.received)} из ${num(l.qty)} ${esc(l.unit)}</small></span></div>
          <div class="mr-l-q"><b>${num(l.qty)}</b> ${esc(l.unit)}</div></div>`).join("")}</div>
        ${o.receipts.length ? `<h3 class="mr-sh">Приёмки</h3><ul class="mr-hl">${o.receipts.map((m) => `<li><span>${esc(stamp(m.at))} · ${esc(m.by)}</span><span>${esc(m.title)}</span><b>${num(m.qty)} ${esc(m.unit)}</b></li>`).join("")}</ul>` : ""}
      </div>
      <div class="mr-card-side">
        <h3 class="mr-sh">Документы <i>${o.docs.length}</i></h3>
        <div class="mr-docs">${o.docs.map(docHtml).join("") || `<p class="mr-note">УПД поставщика прикладывают при приёмке.</p>`}</div>
        <h3 class="mr-sh">Журнал</h3>${logHtml(o.log.map((x) => Object.assign({}, x, { what: { create: "заказ заведён", transit: "отмечен «в пути»", receive: "приёмка", cancel: "заказ отменён" }[x.what] || x.what })))}
      </div></div>`;
  }
  function receiveDialog(o) {
    const d = dialog(`<header class="mr-dh"><div><h3>${o.deliver === "site" ? "Привезли на объект" : "Приёмка на склад"} — заказ № ${o.no}</h3><p>${esc(o.supplier)} · сколько пришло по строкам</p></div>
        <button type="button" class="mr-x" data-x aria-label="Закрыть">${ICO.x}</button></header>
      <div class="mr-db">
        <table class="mr-otbl"><thead><tr><th>Материал</th><th>Осталось</th><th>Пришло</th></tr></thead><tbody>${o.lines.filter((l) => l.left > 0).map((l) => `<tr>
          <td><b>${esc(l.title)}</b></td><td>${num(l.left)} ${esc(l.unit)}</td><td><input class="mr-in" data-rq="${l.id}" inputmode="decimal" value="${num(l.left).replace(/\s/g, "")}"> ${esc(l.unit)}</td></tr>`).join("")}</tbody></table>
        <label class="mr-file"><input type="file" data-r-files multiple accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"><span>${ICO.clip}Приложить УПД</span></label>
        <span class="mr-files-n" data-files-n></span>
        <label class="mr-fl"><span>Пометка</span><input data-r-note placeholder="Недостача, пересорт, брак — что не так"></label>
      </div>
      <footer class="mr-df"><button type="button" class="btn-ghost" data-x>Отмена</button><button type="button" class="btn-brand" data-go>${ICO.check}Принять</button></footer>`);
    d.wrap.addEventListener("change", (ev) => {
      if (ev.target.matches("[data-r-files]")) $r("[data-files-n]", d.wrap).textContent = [...ev.target.files].map((f) => f.name).join(", ");
    });
    d.wrap.addEventListener("click", async (ev) => {
      const go = ev.target.closest("[data-go]");
      if (!go) return;
      const lines = {};
      $$r("[data-rq]", d.wrap).forEach((i) => { const q = parseQty(i.value); if (q > 0) lines[i.dataset.rq] = q; });
      go.disabled = true;
      try {
        const docs = [];
        for (const f of [...$r("[data-r-files]", d.wrap).files]) docs.push((await upload(f, null)).id);
        const out = await api("POST", `/req/orders/${o.id}/receive`, { lines, docs, note: $r("[data-r-note]", d.wrap).value });
        d.close();
        S.order = out.order;
        toast(o.deliver === "site" ? "Принято на объекте — мастерам ушли сообщения" : "Принято на склад");
        paint();
      } catch (e) { go.disabled = false; fail(e, "Не принято"); }
    });
  }
  async function orderEdit(o) {
    const d = dialog(`<header class="mr-dh"><div><h3>Заказ № ${o.no}</h3></div><button type="button" class="mr-x" data-x aria-label="Закрыть">${ICO.x}</button></header>
      <div class="mr-db">
        <label class="mr-fl"><span>Поставщик</span><input data-e="supplier" value="${esc(o.supplier)}"></label>
        <div class="mr-row2"><label class="mr-fl"><span>Ожидается</span><input type="date" data-e="expect" value="${esc(o.expect)}"></label>
          <label class="mr-fl"><span>Счёт поставщика</span><input data-e="invoice" value="${esc(o.invoice)}"></label></div>
        <label class="mr-fl"><span>Пометка</span><input data-e="note" value="${esc(o.note)}"></label>
      </div>
      <footer class="mr-df"><button type="button" class="btn-ghost" data-x>Отмена</button><button type="button" class="btn-brand" data-go>${ICO.check}Сохранить</button></footer>`);
    d.wrap.addEventListener("click", async (ev) => {
      if (!ev.target.closest("[data-go]")) return;
      const b = {};
      $$r("[data-e]", d.wrap).forEach((i) => { b[i.dataset.e] = i.value; });
      try { S.order = (await api("PATCH", "/req/orders/" + o.id, b)).order; d.close(); paint(); } catch (e) { fail(e); }
    });
  }

  /* ── склад ──────────────────────────────────────────────── */
  function stockHtml() {
    const rows = S.stock.rows;
    if (!rows.length) return `<div class="mr-empty"><b>На складе пусто</b>Сюда ложится принятое от поставщика по заказам «на склад», а уходит — выдачей на объект.</div>`;
    return `<div class="mr-list">${rows.map((x) => `<div class="mr-stk">
      <div class="mr-stk-h"><b>${esc(x.title)}</b><span><b>${num(x.qty)}</b> ${esc(x.unit)}</span></div>
      ${x.wait.length ? x.wait.map((w) => `<div class="mr-stk-w"><button type="button" class="mr-link" data-open="${w.req_id}">№ ${w.no}</button>
        <span>${esc(w.site)} · ${esc(w.author)}${w.need_by ? " · к " + dm(w.need_by) : ""}${w.urgent ? " · срочно" : ""}</span>
        <span>ждёт ${num(w.left)}</span><button type="button" class="btn-ghost sm" data-issue-req="${w.req_id}" data-issue-line="${w.line_id}"
          data-issue-q="${Math.min(w.left, x.qty)}">${ICO.truck}Выдать</button></div>`).join("") : `<p class="mr-note">Сверх заявок — запас склада.</p>`}
    </div>`).join("")}</div>`;
  }
  async function quickIssue(reqId, lineId, q) {
    const v = await ASK.prompt("Сколько выдать на объект?", num(q).replace(/\s/g, ""));
    if (v === null) return;
    const n = parseQty(v);
    if (!n) return;
    try {
      await api("POST", `/req/${reqId}/issue`, { lines: { [lineId]: n } });
      toast("Выдано — мастеру ушло сообщение");
      load("stock");
    } catch (e) { fail(e); }
  }

  /* ── маршруты согласования ──────────────────────────────── */
  function routesHtml() {
    const R = S.routes;
    const siteName = (id) => (R.sites.find((s) => s.id === id) || {}).name || "объект удалён";
    const roleMiss = (role) => {
      if (role !== "site_foreman" && role !== "site_master") return "";
      const miss = R.sites.filter((s) => !(role === "site_foreman" ? s.foreman_user : s.master_user));
      return miss.length ? `<small class="mr-miss">${ICO.warn}нет учётки у ${role === "site_foreman" ? "начальника участка" : "мастера"} на ${miss.length} из ${R.sites.length} объектов — там шаг пропустится</small>` : "";
    };
    const who = (s) => [s.role ? R.roles[s.role] : "", ...s.users.map((u) => (R.people.find((p) => p.id === u) || {}).name || "?")].filter(Boolean).join(", ");
    return `<div class="mr-routes">
      <div class="mr-callout">${ICO.route}<span><b>Как идёт заявка</b>Подходит первый включённый маршрут сверху, у которого сошлись условия. Шаги — по порядку;
        шаг с условием («если сверх проекта») включается, только когда оно есть. На шаге некому согласовать — шаг пропускается;
        не нашлось никого на всём маршруте — заявку согласует администратор. Автор сам на шаге — шаг пройден им.</span></div>
      ${R.routes.map((rt, i) => `<div class="mr-rt${rt.active ? "" : " off"}" data-rt="${rt.id}">
        <div class="mr-rt-h"><b>${esc(rt.name)}</b>
          <small>${rt.cond.sites && rt.cond.sites.length ? `объекты: ${esc(rt.cond.sites.map(siteName).join(", "))}` : "все объекты"}${rt.cond.urgent === "yes" ? " · только срочные" : rt.cond.urgent === "no" ? " · только плановые" : ""}</small>
          <span class="tb-gap"></span>
          <label class="mr-sw"><input type="checkbox" data-rt-on${rt.active ? " checked" : ""}><span class="mr-sw-k"></span><span>${rt.active ? "включён" : "выключен"}</span></label>
          <button type="button" class="mr-ib" data-rt-mv="-1"${i ? "" : " disabled"} title="Выше" aria-label="Выше">${ICO.up}</button>
          <button type="button" class="mr-ib" data-rt-mv="1"${i < R.routes.length - 1 ? "" : " disabled"} title="Ниже" aria-label="Ниже">${ICO.dn}</button>
          <button type="button" class="btn-ghost sm" data-rt-edit>${ICO.edit}<span>Изменить</span></button>
          <button type="button" class="mr-ib" data-rt-del title="Удалить" aria-label="Удалить">${ICO.trash}</button></div>
        <ol class="mr-chain">${rt.steps.map((s, k) => `<li><i>${k + 1}</i><span><b>${esc(s.title)}</b><small>${esc(who(s))} · ${s.mode === "all" ? "все" : "любой из"}${s.when !== "always" ? " · " + esc(R.when[s.when]) : ""}</small>${roleMiss(s.role)}</span></li>`).join("")}</ol>
      </div>`).join("")}
      <button type="button" class="btn-brand" data-rt-new>${ICO.plus}Маршрут</button>
    </div>`;
  }
  function routeDialog(rt) {
    const R = S.routes;
    const st = rt ? JSON.parse(JSON.stringify(rt)) : { name: "", cond: { sites: [], urgent: "" }, steps: [{ title: "", role: "site_foreman", users: [], mode: "any", when: "always" }] };
    st.cond.sites = st.cond.sites || [];
    const d = dialog(`<header class="mr-dh"><div><h3>${rt ? "Маршрут «" + esc(rt.name) + "»" : "Новый маршрут"}</h3><p>Короткий, длинный или с ветками — шагами с условиями</p></div>
      <button type="button" class="mr-x" data-x aria-label="Закрыть">${ICO.x}</button></header><div class="mr-db" data-rtd></div>
      <footer class="mr-df"><button type="button" class="btn-ghost" data-x>Отмена</button><button type="button" class="btn-brand" data-go>${ICO.check}Сохранить</button></footer>`, "mr-wide-d");
    const box = $r("[data-rtd]", d.wrap);
    let siteQ = "";
    const draw = () => {
      const m = matcher(siteQ);
      box.innerHTML = `<label class="mr-fl"><span>Название</span><input data-rn value="${esc(st.name)}" placeholder="Основной, Срочные, Крупные объекты…"></label>
        <div class="mr-fl"><span>Для каких заявок</span><div class="mr-seg">${[["", "любые"], ["yes", "только срочные"], ["no", "только плановые"]].map(([k, t]) =>
          `<button type="button" class="${(st.cond.urgent || "") === k ? "on" : ""}" data-ru="${k}">${t}</button>`).join("")}</div></div>
        <div class="mr-fl"><span>Объекты ${st.cond.sites.length ? `— выбрано ${st.cond.sites.length}` : "— все"}</span>
          <input data-rsq value="${esc(siteQ)}" placeholder="Найти объект" autocomplete="off">
          <div class="mr-picklist">${R.sites.filter((s) => m(s.name)).map((s) => `<label class="mr-check"><input type="checkbox" data-rs="${esc(s.id)}"${st.cond.sites.includes(s.id) ? " checked" : ""}><span>${esc(s.name)}</span></label>`).join("")}</div></div>
        <h4>Шаги</h4>
        ${st.steps.map((s, i) => `<div class="mr-stp" data-i="${i}">
          <div class="mr-stp-h"><i>${i + 1}</i><input data-st="title" value="${esc(s.title)}" placeholder="${esc(R.roles[s.role] || "Название шага")}">
            <button type="button" class="mr-ib" data-sm="-1"${i ? "" : " disabled"} aria-label="Выше">${ICO.up}</button>
            <button type="button" class="mr-ib" data-sm="1"${i < st.steps.length - 1 ? "" : " disabled"} aria-label="Ниже">${ICO.dn}</button>
            <button type="button" class="mr-ib" data-sx aria-label="Убрать шаг">${ICO.trash}</button></div>
          <div class="mr-seg wrap">${[["", "конкретные люди"], ...Object.entries(R.roles)].map(([k, t]) => `<button type="button" class="${(s.role || "") === k ? "on" : ""}" data-sr="${k}">${esc(t)}</button>`).join("")}</div>
          <details${s.users.length || !s.role ? " open" : ""}><summary>${s.role ? "И ещё люди" : "Кто"}${s.users.length ? `: ${esc(s.users.map((u) => (R.people.find((p) => p.id === u) || {}).name || "?").join(", "))}` : ""}</summary>
            <div class="mr-picklist">${R.people.map((p) => `<label class="mr-check"><input type="checkbox" data-su="${esc(p.id)}"${s.users.includes(p.id) ? " checked" : ""}><span>${esc(p.name)}${p.req ? "" : ' <small class="mr-miss">нет доступа к «Заявкам»</small>'}</span></label>`).join("")}</div></details>
          <div class="mr-stp-r"><div class="mr-seg sm">${[["any", "любой из"], ["all", "все"]].map(([k, t]) => `<button type="button" class="${s.mode === k ? "on" : ""}" data-sd="${k}">${t}</button>`).join("")}</div>
            <div class="mr-seg sm wrap">${Object.entries(R.when).map(([k, t]) => `<button type="button" class="${s.when === k ? "on" : ""}" data-sw="${k}">${esc(t)}</button>`).join("")}</div></div>
        </div>`).join("")}
        ${st.steps.length < 10 ? `<button type="button" class="btn-ghost sm" data-sa>${ICO.plus}Шаг</button>` : ""}`;
    };
    draw();
    d.wrap.addEventListener("input", (ev) => {
      const t = ev.target;
      if (t.matches("[data-rn]")) st.name = t.value;
      if (t.matches("[data-rsq]")) { siteQ = t.value; const p = t.selectionStart; draw(); const i = $r("[data-rsq]", box); i.focus(); i.setSelectionRange(p, p); }
      const sp = t.closest("[data-i]");
      if (sp && t.matches('[data-st="title"]')) st.steps[+sp.dataset.i].title = t.value;
    });
    d.wrap.addEventListener("change", (ev) => {
      const t = ev.target;
      if (t.matches("[data-rs]")) { const set = new Set(st.cond.sites); t.checked ? set.add(t.dataset.rs) : set.delete(t.dataset.rs); st.cond.sites = [...set]; draw(); }
      const sp = t.closest("[data-i]");
      if (sp && t.matches("[data-su]")) {
        const s = st.steps[+sp.dataset.i], set = new Set(s.users);
        t.checked ? set.add(t.dataset.su) : set.delete(t.dataset.su);
        s.users = [...set];
      }
    });
    d.wrap.addEventListener("click", async (ev) => {
      const t = ev.target.closest("button");
      if (!t) return;
      const sp = t.closest("[data-i]"), s = sp ? st.steps[+sp.dataset.i] : null;
      if (t.dataset.ru !== undefined) { st.cond.urgent = t.dataset.ru; draw(); }
      else if (s && t.dataset.sr !== undefined) { s.role = t.dataset.sr; draw(); }
      else if (s && t.dataset.sd) { s.mode = t.dataset.sd; draw(); }
      else if (s && t.dataset.sw) { s.when = t.dataset.sw; draw(); }
      else if (s && t.dataset.sm) { const i = +sp.dataset.i, j = i + +t.dataset.sm; [st.steps[i], st.steps[j]] = [st.steps[j], st.steps[i]]; draw(); }
      else if (s && t.matches("[data-sx]")) { st.steps.splice(+sp.dataset.i, 1); draw(); }
      else if (t.matches("[data-sa]")) { st.steps.push({ title: "", role: "", users: [], mode: "any", when: "always" }); draw(); }
      else if (t.matches("[data-go]")) {
        try {
          S.routes = rt ? await api("PATCH", "/req/routes/" + rt.id, { ...st, active: rt.active }) : await api("POST", "/req/routes", st);
          d.close(); paint();
        } catch (e) { fail(e, "Маршрут не сохранён"); }
      }
    });
  }

  /* ── окна, всплывашки ───────────────────────────────────── */
  function dialog(html, cls = "") {
    const wrap = document.createElement("div");
    wrap.className = "mr-wrap";
    wrap.innerHTML = `<div class="mr-dlg ${cls}" role="dialog" aria-modal="true">${html}</div>`;
    document.body.appendChild(wrap);
    const close = () => { wrap.remove(); document.removeEventListener("keydown", key, true); };
    const key = (ev) => { if (ev.key === "Escape" && !document.querySelector(".dlg-wrap")) { ev.stopPropagation(); close(); } };
    document.addEventListener("keydown", key, true);
    wrap.addEventListener("click", (ev) => { if (ev.target === wrap || ev.target.closest("[data-x]")) close(); });
    return { wrap, close };
  }
  let toastT = 0;
  function toast(text) {
    let el = $r(".mr-toast");
    if (!el) { el = document.createElement("div"); el.className = "mr-toast"; document.body.appendChild(el); }
    el.innerHTML = `${ICO.check}<span>${esc(text)}</span>`;
    el.classList.add("on");
    clearTimeout(toastT);
    toastT = setTimeout(() => el.classList.remove("on"), 3800);
  }

  /* ── события ────────────────────────────────────────────── */
  async function onClick(ev) {
    const t = ev.target.closest("button, a, [data-open]");
    if (!t) return;
    const ds = t.dataset;
    if (ds.tab) { openTab(ds.tab); return; }
    if (ds.back !== undefined) {
      if (S.view && (S.view.k === "new" || S.view.k === "edit") && S.ed && S.ed.dirty && S.ed.id
        && !(await ASK.confirm("Закрыть без сохранения? Изменения черновика пропадут.", { ok: "Закрыть" }))) return;
      S.view = null; S.card = null; S.order = null; S.ed = null; S.cardMode = "";
      paint();
      if (S.tab === "orders") load("orders");
      return;
    }
    if (ds.new !== undefined) { startNew(""); return; }
    if (ds.pick) { startNew(ds.pick); return; }
    if (ds.open) { openReq(ds.open); return; }
    if (ds.order) { openOrder(ds.order); return; }
    if (ds.box) { S.f.box = ds.box; paintList(); return; }
    // ── заявка
    if (ds.edit !== undefined && S.card) { edOpenDraft(S.card); return; }
    if (ds.send !== undefined && S.card) {
      try { S.card = (await api("POST", `/req/${S.card.id}/send`)).request; toast("Отправлено на согласование"); paint(); load("list"); } catch (e) { fail(e, "Не отправилась"); }
      return;
    }
    if (ds.del !== undefined && S.card) {
      if (!(await ASK.confirm(`Удалить черновик № ${S.card.no}?`))) return;
      try { await api("DELETE", "/req/" + S.card.id); S.view = null; S.card = null; await load("list"); } catch (e) { fail(e); }
      return;
    }
    if (ds.cancel !== undefined && S.card) {
      const why = await ASK.prompt("Почему отменяете заявку? Увидят согласующие и снабжение.", "");
      if (why === null) return;
      try { S.card = (await api("POST", `/req/${S.card.id}/cancel`, { reason: why })).request; paint(); load("list"); } catch (e) { fail(e); }
      return;
    }
    if (ds.copy !== undefined && S.card) {
      startNew(S.card.site_id, S.card.lines.filter((l) => !l.closed).map((l) => ({ key: l.key, qty: l.qty_ok ?? l.qty, extra: l.extra, name: l.name, unit: l.unit, title: l.title })));
      return;
    }
    if (ds.mode !== undefined) { S.cardMode = ds.mode; paintBody(); return; }
    if (ds.modeGo) { modeGo(ds.modeGo); return; }
    if (ds.decAct) { decide(ds.decAct); return; }
    // ── редактор
    const ed = S.ed;
    if (ed) {
      const row = t.closest(".mr-it, .mr-cl");
      const key = row && row.dataset.key;
      if (ds.grp !== undefined) { ed.grp = ds.grp; ed.only = ""; paintBody(); return; }
      if (ds.only) { ed.only = ed.only === ds.only ? "" : ds.only; ed.grp = ""; paintBody(); return; }
      if (ds.step) { ed.step = ds.step; paintBody(); body().scrollTop = 0; return; }
      if (ds.edSave !== undefined) { edSubmit(false); return; }
      if (ds.edSend !== undefined) { edSubmit(true); return; }
      if (ds.edClear !== undefined) { ed.cart.clear(); ed.restored = false; edStash(); paintBody(); return; }
      if (ds.freeOpen !== undefined) { ed.free = true; ed.step = "cart"; paintBody(); setTimeout(() => { const i = $r("[data-free-name]", body()); if (i) i.focus(); }, 30); return; }
      if (ds.freeClose !== undefined) { ed.free = false; paintBody(); return; }
      if (ds.freeUnit) { $$r("[data-free-unit]", body()).forEach((b) => b.classList.toggle("on", b === t)); return; }
      if (ds.freeAdd !== undefined) {
        const box = $r("[data-free]", body());
        const name = $r("[data-free-name]", box).value.trim(), q = parseQty($r("[data-free-qty]", box).value);
        const unit = ($r("[data-free-unit].on", box) || {}).dataset?.freeUnit || "шт";
        if (!name || !q) { ASK.alert("Напишите, что нужно и сколько."); return; }
        const k = "x:" + norm(name) + "|" + unit;
        edSet(k, q, { extra: true, name, unit, title: name, reason: $r("[data-free-reason]", box).value.trim() });
        ed.free = false; paintBody(); return;
      }
      if (key && (ds.inc !== undefined || ds.dec !== undefined)) {
        const it = ed.byKey.get(key), l = ed.cart.get(key);
        const st = stepOf(it), q = l ? l.qty : 0;
        edSet(key, ds.inc !== undefined ? Math.floor(q / st) * st + st : Math.max(0, Math.ceil(q / st) * st - st));
        edRepaint(key); return;
      }
      if (key && ds.all !== undefined) { const it = ed.byKey.get(key); if (left(it) > 0) { edSet(key, left(it)); edRepaint(key); } return; }
      if (key && ds.hist !== undefined) { history(ed.site, ed.byKey.get(key)); return; }
      if (key && ds.rm !== undefined) { const it = ed.byKey && ed.byKey.get(key); edSet(key, 0); it ? edRepaint(key) : paintBody(); return; }
      if (ds.add) {
        const c = ed.byKey.get(ds.add), n = Number(ds.n) || stepOf(c);
        const have = ed.cart.has(ds.add) ? ed.cart.get(ds.add).qty : 0;
        edSet(ds.add, have + n);
        edRepaint(ds.add); if (key) edRepaint(key);
        toast(`Добавлено: ${c.title} — ${num(have + n)} ${c.unit}`);
        return;
      }
      if (ds.addFree) {
        const k = "x:" + norm(ds.addFree) + "|" + ds.unit, have = ed.cart.has(k) ? ed.cart.get(k).qty : 0;
        edSet(k, have + Number(ds.n), { extra: true, name: ds.addFree, unit: ds.unit, title: ds.addFree, reason: "крепёж по СП 76.13330 — в проекте его нет" });
        if (key) edRepaint(key); else paintBody();
        toast(`Добавлено вручную: ${ds.addFree}`);
        return;
      }
    }
    // ── свод
    if (S.tab === "pool" && S.pool) {
      const g = t.closest("[data-g]");
      if (g && ds.gopen !== undefined) { const k = g.dataset.g; S.poolOpen.has(k) ? S.poolOpen.delete(k) : S.poolOpen.add(k); paintBody(); return; }
      if (ds.orderNew !== undefined) { orderDialog(); return; }
    }
    // ── заказ
    if (S.order) {
      if (ds.oTransit !== undefined) {
        const v = await ASK.prompt("Когда ожидается? Дата ДД.ММ.ГГГГ — можно оставить пустым.", S.order.expect ? dmy(S.order.expect) : "");
        if (v === null) return;
        const m = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(v.trim());
        try {
          S.order = (await api("PATCH", "/req/orders/" + S.order.id, Object.assign({ status: "transit" },
            m ? { expect: `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}` } : {}))).order;
          paint();
        } catch (e) { fail(e); }
        return;
      }
      if (ds.oReceive !== undefined) { receiveDialog(S.order); return; }
      if (ds.oEdit !== undefined) { orderEdit(S.order); return; }
      if (ds.oCancel !== undefined) {
        if (!(await ASK.confirm(`Отменить заказ № ${S.order.no}? Строки заявок вернутся в свод.`, { ok: "Отменить заказ", danger: true }))) return;
        try { S.order = (await api("PATCH", "/req/orders/" + S.order.id, { status: "canceled" })).order; paint(); } catch (e) { fail(e); }
        return;
      }
    }
    if (ds.issueReq) { quickIssue(ds.issueReq, ds.issueLine, Number(ds.issueQ)); return; }
    // ── маршруты
    if (S.tab === "routes" && S.routes) {
      const rtEl = t.closest("[data-rt]"), rt = rtEl && S.routes.routes.find((x) => x.id === rtEl.dataset.rt);
      if (ds.rtNew !== undefined) { routeDialog(null); return; }
      if (rt && ds.rtEdit !== undefined) { routeDialog(rt); return; }
      if (rt && ds.rtMv) { try { S.routes = await api("PATCH", "/req/routes/" + rt.id, { move: Number(ds.rtMv) }); paint(); } catch (e) { fail(e); } return; }
      if (rt && ds.rtDel !== undefined) {
        if (!(await ASK.confirm(`Удалить маршрут «${rt.name}»? Уже отправленные заявки дойдут по своему снимку маршрута.`))) return;
        try { S.routes = await api("DELETE", "/req/routes/" + rt.id); paint(); } catch (e) { fail(e); }
      }
    }
  }
  function onInput(ev) {
    const t = ev.target, ed = S.ed;
    if (t.matches("[data-f-q]")) { S.f.q = t.value; paintList(); return; }
    if (!ed) return;
    if (t.matches("[data-ed-q]")) {
      ed.q = t.value;
      const cat = $r(".mr-cat", body());
      if (cat) { const pos = t.selectionStart; cat.innerHTML = catHtml(); const i = $r("[data-ed-q]", cat); i.focus(); i.setSelectionRange(pos, pos); }
      return;
    }
    if (t.matches("[data-ed-f]") && t.type !== "checkbox") { ed[t.dataset.edF] = t.value; ed.dirty = true; edStash(); return; }
    const cl = t.closest(".mr-cl");
    if (cl && t.matches("[data-reason]")) { const l = ed.cart.get(cl.dataset.key); if (l) { l.reason = t.value; ed.dirty = true; edStash(); } }
  }
  function onChange(ev) {
    const t = ev.target, ed = S.ed;
    if (t.matches("[data-f-site]")) { S.f.site = t.value; paintList(); return; }
    if (t.matches("[data-f-mine]")) { S.f.mine = t.checked; try { localStorage.setItem("mr-mine", t.checked ? "1" : ""); } catch (_) { /* пусть */ } paintList(); return; }
    if (t.matches("[data-req-files]")) { uploadToReq([...t.files]); return; }
    if (t.matches("[data-mode-files]")) { const n = $r("[data-files-n]", body()); if (n) n.textContent = [...t.files].map((f) => f.name).join(", "); return; }
    if (S.tab === "pool" && S.pool && t.matches("[data-gsel]")) {
      const k = t.closest("[data-g]").dataset.g;
      t.checked ? S.poolSel.add(k) : S.poolSel.delete(k);
      paintBody(); return;
    }
    if (S.tab === "pool" && S.pool && t.matches("[data-gall]")) {
      S.poolSel = new Set(t.checked ? S.pool.groups.map((g) => g.key) : []);
      paintBody(); return;
    }
    if (S.tab === "routes" && S.routes && t.matches("[data-rt-on]")) {
      const rt = S.routes.routes.find((x) => x.id === t.closest("[data-rt]").dataset.rt);
      api("PATCH", "/req/routes/" + rt.id, { active: t.checked }).then((out) => { S.routes = out; paint(); }).catch(fail);
      return;
    }
    if (!ed) return;
    if (t.matches("[data-ed-f]")) {
      ed[t.dataset.edF] = t.type === "checkbox" ? t.checked : t.value;
      ed.dirty = true; edStash(); return;
    }
    if (t.matches("[data-qty]")) {
      const row = t.closest(".mr-it, .mr-cl"), key = row && row.dataset.key;
      if (!key) return;
      const q = parseQty(t.value), l = ed.cart.get(key);
      edSet(key, q, l && l.extra ? { extra: true, name: l.name, unit: l.unit, title: l.title } : undefined);
      if (ed.byKey && ed.byKey.get(key)) edRepaint(key); else paintBody();
    }
  }

  /* ── счётчик у меню ─────────────────────────────────────── */
  async function badge() {
    clearTimeout(badgeTimer);
    if (!me || me.must_change_pw || !(can("req") || can("snb_req"))) return;
    try {
      const out = await api("GET", "/req/badge");
      S.badge = out;
      const n = out.approve + out.fresh;
      const el = $r("#reqBadge");
      if (el) {
        el.hidden = !n;
        el.textContent = n > 99 ? "99+" : String(n);
        el.title = [out.approve ? `ждут вашего согласования: ${out.approve}` : "", out.fresh ? `согласованы, ещё не заказаны: ${out.fresh}` : ""].filter(Boolean).join(" · ");
      }
      if ($r("#mrTabs") && !S.view) paintTabs();
    } catch (_) { /* повторим позже */ }
    badgeTimer = setTimeout(badge, document.hidden ? 300000 : 90000);
  }

  /* ── снаружи: карточка объекта, «Снабжение», мессенджер ─── */
  // Вкладка «Заявки» у объекта: заявки этого объекта и «Новая заявка».
  async function siteTab(el, siteId) {
    el.innerHTML = `<div class="mr-site"><div class="mr-empty sm">Загружаю…</div></div>`;
    let out;
    try { out = await api("GET", "/req?site=" + encodeURIComponent(siteId)); }
    catch (e) { el.innerHTML = `<div class="mr-empty sm">${esc(e.message)}</div>`; return; }
    const rows = out.rows;
    el.innerHTML = `<div class="mr-site"><div class="mr-site-h"><span>${rows.length ? `${rows.filter((r) => inBox(r, "work")).length} в работе · всего ${rows.length}` : "Заявок с объекта пока нет"}</span>
        ${out.can.create ? `<button type="button" class="btn-brand sm" data-mr-new>${ICO.plus}Новая заявка</button>` : ""}</div>
      <div class="mr-list">${rows.map(rowHtml).join("")}</div></div>`;
    el.onclick = (ev) => {
      if (ev.target.closest("[data-mr-new]")) { go("list"); startNew(siteId); return; }
      const o = ev.target.closest("[data-open]");
      if (o) openReq(o.dataset.open);
    };
  }
  // Вкладка «Заявки» в «Снабжении»: сколько ждёт и куда идти.
  async function snabTab(el) {
    el.innerHTML = `<div class="mr-empty">Загружаю…</div>`;
    let pool, orders;
    try { [pool, orders] = await Promise.all([api("GET", "/req/pool"), api("GET", "/req/orders")]); }
    catch (e) { el.innerHTML = `<div class="mr-empty">${esc(e.message)}</div>`; return; }
    const by = (s) => orders.rows.filter((o) => o.status === s).length;
    const tile = (t, n, s, tab) => `<button type="button" class="mr-tile" data-mr-go="${tab}"><b>${n}</b><span>${t}</span><small>${s}</small></button>`;
    el.innerHTML = `<div class="mr-snab"><div class="mr-tiles">
      ${tile("к заказу", pool.groups.length, "материалов в своде", "pool")}
      ${tile("в пути", by("transit") + by("ordered"), "заказов у поставщиков", "orders")}
      ${tile("принято частично", by("partial"), "заказов", "orders")}
    </div><p class="mr-note">Заявки с объектов, свод, заказы поставщикам и склад — в разделе «Заявки».</p>
      <button type="button" class="btn-brand" data-mr-go="pool">${ICO.truck}Открыть свод</button></div>`;
    el.onclick = (ev) => { const b = ev.target.closest("[data-mr-go]"); if (b) go(b.dataset.mrGo); };
  }
  function go(tab) {
    if (typeof openSection === "function") openSection("req");
    openTab(tab);
  }

  function init(user) {
    if (me || !user) return;
    me = user;
    badge();
  }
  function show() {
    if (!me && typeof AUTH === "object") me = AUTH.current();
    frame();
    paint();
    if (!S.loading) { S.loading = true; load().finally(() => { S.loading = false; }); }
  }
  return { init, show, openNo, openReq, siteTab, snabTab, go };
})();
