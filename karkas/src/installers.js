/* «Справочники» → «Монтажники» (правка № 11, 21.10.2026).

   Отдел персонала: «раздел „Монтажники“ на основе приложенного файла с
   возможностью привязки к бригадам». Файл — «Журнал учёта иностранцев»:
   работа, миграционный учёт, прописка, патент, паспорт, РВП, ВНЖ, полис.
   Слева — люди (бригада, ближайший срок), справа — карточка по группам;
   поля сохраняются сами, как в карточке бригады. Журнал загружается и
   выгружается книгой в том же виде. Сроки документов считает сервер
   (installers.alerts): истёк — красным, скоро — жёлтым; гражданам ЕАЭС
   патент не нужен. Вид — классы бригад (crews.css), свои — mnt-. */
"use strict";

const INSTALLERS = (() => {
  const $m = (s, r) => (r || document).querySelector(s);
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const plural = (n, one, few, many) => {
    const a = Math.abs(n) % 100, b = a % 10;
    if (a > 10 && a < 20) return many;
    if (b > 1 && b < 5) return few;
    return b === 1 ? one : many;
  };
  const svg = (d) => `<svg viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
  const ICO = {
    find: svg('<circle cx="11" cy="11" r="6.5"/><path d="M20.5 20.5 16 16"/>'),
    plus: svg('<path d="M12 5v14M5 12h14"/>'),
    back: svg('<path d="M15 5l-7 7 7 7"/>'),
    trash: svg('<path d="M4.5 6.5h15M9.5 6.5V4.8A1.3 1.3 0 0 1 10.8 3.5h2.4a1.3 1.3 0 0 1 1.3 1.3v1.7M6.5 6.5l.9 12.2A1.5 1.5 0 0 0 8.9 20h6.2a1.5 1.5 0 0 0 1.5-1.3l.9-12.2"/>'),
    up: svg('<path d="M12 16V4M7 9l5-5 5 5M4 17v2a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-2"/>'),
    down: svg('<path d="M12 4v11M7 10.5l5 5 5-5M5 20h14"/>'),
    alert: svg('<path d="M12 4 2.5 20h19z"/><path d="M12 10v4.5M12 17.2v.01"/>'),
    phone: svg('<path d="M6.6 3.5h2.6l1.4 4-1.9 1.3a10.5 10.5 0 0 0 6.5 6.5l1.3-1.9 4 1.4v2.6A2.1 2.1 0 0 1 18.4 20 15.4 15.4 0 0 1 4 5.6a2.1 2.1 0 0 1 2.6-2.1Z"/>'),
    chev: svg('<path d="M9 5l7 7-7 7"/>'),
  };
  const SEL_KEY = "karkas.mnt.sel.v1";
  // Уволенные (правка № 50, 26.10.2026) — внизу списка свёрнутой группой,
  // как у сотрудников. Раскрыта ли — помним в браузере.
  const GONE_KEY = "karkas.mnt.gone.v1";
  const mem = (k, v) => {
    try {
      if (v === undefined) return localStorage.getItem(k) || "";
      localStorage.setItem(k, v);
    } catch (e) { /* без памяти */ }
    return "";
  };

  let host = null;
  let L = null;            // {rows, crews, fields, groups, watch, today}
  let C = null;            // открытый человек
  let Q = "", F = "";
  let sel = mem(SEL_KEY);
  let goneOpen = mem(GONE_KEY) === "1";
  let chain = Promise.resolve();
  let pending = 0;

  const narrow = () => window.matchMedia("(max-width: 760px)").matches;
  const isoDay = (v) => /^\d{4}-\d{2}-\d{2}$/.test(v || "");
  const dmy = (v) => (isoDay(v) ? v.slice(8, 10) + "." + v.slice(5, 7) + "." + v.slice(0, 4) : (v || ""));
  const crewName = (id) => ((L.crews.find((c) => c.id === id) || {}).title || "");
  const daysText = (d) => (d < 0 ? `просрочено на ${-d} ${plural(-d, "день", "дня", "дней")}`
    : d === 0 ? "сегодня" : `через ${d} ${plural(d, "день", "дня", "дней")}`);

  async function load() {
    host = document.getElementById("sec-mnt");
    if (!host) return;
    if (!L) host.innerHTML = `<div class="pg"><div class="pg-body"><div class="pg-empty"><b>Загружаю монтажников…</b></div></div></div>`;
    try {
      L = await AUTH.api("GET", "/installers");
    } catch (e) {
      host.innerHTML = `<div class="pg"><div class="pg-note bad">${esc(e.message)}</div></div>`;
      return;
    }
    // Карточку могли попросить из бригады (crews.js) — тем же ключом.
    sel = mem(SEL_KEY) || sel;
    if (sel && !L.rows.some((r) => r.id === sel)) sel = "";
    if (!sel && L.rows.length && !narrow()) sel = (L.rows.find((r) => !r.gone) || L.rows[0]).id;
    C = L.rows.find((r) => r.id === sel) || null;
    render();
  }

  /* ── список ──────────────────────────────────────────────── */
  function shown() {
    const q = Q.trim().toLowerCase();
    return L.rows.filter((r) => {
      if (F === "over" && !r.alerts.some((a) => a.level === "over")) return false;
      if (F === "soon" && !r.alerts.length) return false;
      if (F === "nocrew" && r.crew_id) return false;
      if (F.startsWith("c:") && r.crew_id !== F.slice(2)) return false;
      return !q || [r.name, r.post, r.phone, r.citizenship, r.unit, crewName(r.crew_id)]
        .some((x) => String(x || "").toLowerCase().includes(q));
    });
  }

  function chip(r) {
    const a = r.alerts[0];
    if (!a) return "";
    return `<span class="mnt-al ${a.level}" title="${esc(r.alerts.map((x) => `${x.what}: ${dmy(x.date)} — ${daysText(x.days)}`).join("\n"))}"
      >${ICO.alert}${esc(a.what)}: ${a.days < 0 ? "просрочено" : a.days === 0 ? "сегодня" : a.days + " дн."}${
      r.alerts.length > 1 ? ` <i>+${r.alerts.length - 1}</i>` : ""}</span>`;
  }

  function render() {
    const over = L.rows.filter((r) => r.alerts.some((a) => a.level === "over")).length;
    // Сроки у уволенных сервер не считает — в отборы они не попадают.
    const soon = L.rows.filter((r) => r.alerts.length).length;
    host.innerHTML = `
      <div class="pg crw-pg mnt-pg${sel ? " has-sel" : ""}">
        <div class="pg-head crw-head">
          <label class="pg-find">${ICO.find}<input id="mntQ" type="search"
            placeholder="ФИО, должность, гражданство" value="${esc(Q)}" autocomplete="off"></label>
          <select class="role-sel" id="mntF" aria-label="Отбор">
            <option value="">Все</option>
            <option value="soon"${F === "soon" ? " selected" : ""}>Сроки подходят — ${soon}</option>
            <option value="over"${F === "over" ? " selected" : ""}>Просрочено — ${over}</option>
            <option value="nocrew"${F === "nocrew" ? " selected" : ""}>Без бригады</option>
            ${L.crews.map((c) => `<option value="c:${esc(c.id)}"${F === "c:" + c.id ? " selected" : ""}>Бригада «${esc(c.title)}»</option>`).join("")}
          </select>
          <span class="pg-count" id="mntCnt"></span>
          ${over ? `<span class="mnt-banner">${ICO.alert}${over} ${plural(over, "человек", "человека", "человек")} с просроченными документами</span>` : ""}
          <span class="grow"></span>
          <label class="btn-ghost sm" for="mntFile" title="«Журнал учёта иностранцев» книгой Excel: новые заведутся, знакомые по ФИО обновятся">
            ${ICO.up}Загрузить журнал</label>
          <input type="file" id="mntFile" accept=".xlsx,.xlsm" hidden>
          <button type="button" class="btn-ghost sm" id="mntXlsx" title="Журнал книгой Excel — в том же виде, с бригадами">${ICO.down}Выгрузить</button>
          <button type="button" class="btn-brand sm" id="mntNew">${ICO.plus}Монтажник</button>
        </div>
        <div class="pg-body crw-body">
          <nav class="crw-list" id="mntList" aria-label="Монтажники"></nav>
          <div class="crw-main" id="mntMain"></div>
        </div>
        <div class="pg-note" id="mntNote" hidden></div>
      </div>`;
    paintList();
    paintCard();
    $m("#mntQ", host).addEventListener("input", (e) => { Q = e.target.value; paintList(); });
    $m("#mntF", host).addEventListener("change", (e) => { F = e.target.value; paintList(); });
    $m("#mntNew", host).addEventListener("click", create);
    $m("#mntFile", host).addEventListener("change", (e) => upload(e.target));
    $m("#mntXlsx", host).addEventListener("click", (e) => DL.save("/api/installers/xlsx",
      { btn: e.currentTarget, name: "Монтажники.xlsx" }).catch((err) => note(err.message, true)));
  }

  function paintList() {
    const list = $m("#mntList", host);
    if (!list) return;
    const all = shown();
    const rows = all.filter((r) => !r.gone), out = all.filter((r) => r.gone);
    // В поиске уволенные видны сразу: искали — значит нужен.
    const outOpen = goneOpen || !!Q.trim();
    $m("#mntCnt", host).innerHTML = `<b>${rows.length}</b> ${plural(rows.length, "человек", "человека", "человек")}${
      out.length ? ` <i class="mnt-cnt-gone">и ${out.length} ${plural(out.length, "уволенный", "уволенных", "уволенных")}</i>` : ""}`;
    const li = (r) => `<button type="button" class="crw-li${r.id === sel ? " on" : ""}${r.gone ? " mnt-gone" : ""}" data-id="${esc(r.id)}">
        <span class="crw-li-n" title="${esc(r.name)}">${esc(r.name)}</span>
        <span class="crw-li-m">${esc(r.gone ? `уволен ${dmy(r.fired)}${r.post ? " · " + r.post : ""}`
          : [crewName(r.crew_id) || "без бригады", r.post].filter(Boolean).join(" · "))}</span>
        <span class="crw-li-r">${chip(r)}</span>
      </button>`;
    list.innerHTML = all.length ? rows.map(li).join("") + (out.length ? `<button type="button" class="stf-gone-btn mnt-gone-btn"
        data-gone-toggle aria-expanded="${outOpen}">${ICO.chev}Уволенные <b>${out.length}</b></button>${
        outOpen ? out.map(li).join("") : ""}` : "")
      : `<div class="crw-li-empty">${L.rows.length ? "Никто не подошёл под отбор"
        : "Пока никого — загрузите «Журнал учёта иностранцев» или заведите кнопкой «Монтажник»"}</div>`;
    list.querySelectorAll(".crw-li").forEach((b) => b.addEventListener("click", () => open(b.dataset.id)));
    const gb = $m("[data-gone-toggle]", list);
    if (gb) gb.addEventListener("click", () => {
      goneOpen = !outOpen;
      mem(GONE_KEY, goneOpen ? "1" : "0");
      paintList();
    });
  }

  function open(id) {
    sel = id;
    mem(SEL_KEY, id);
    C = L.rows.find((r) => r.id === id) || null;
    paintList();
    paintCard();
    host.querySelector(".mnt-pg").classList.toggle("has-sel", !!C);
  }

  async function create() {
    const name = await ASK.prompt("Новый монтажник — ФИО", "");
    if (!name || !name.trim()) return;
    try {
      const got = await AUTH.api("POST", "/installers", { name: name.trim() });
      L.rows.push(got.installer);
      L.rows.sort((a, b) => a.name.localeCompare(b.name, "ru"));
      open(got.installer.id);
    } catch (e) {
      ASK.alert(e.message, { title: "Не вышло" });
    }
  }

  /* ── карточка ────────────────────────────────────────────── */
  function field(f) {
    const v = C[f.key];
    const date = f.kind === "date";
    const al = C.alerts.find((a) => a.key === f.key);
    return `<label class="fld${al ? " mnt-" + al.level : ""}"><span>${esc(f.label.replace(/^[^:]+: /, ""))}${al
      ? ` <i class="mnt-due">${esc(daysText(al.days))}</i>` : ""}</span><input data-k="${esc(f.key)}"
      value="${esc(date ? dmy(v) : v)}" autocomplete="off"${date ? ' placeholder="ДД.ММ.ГГГГ" inputmode="numeric"' : ""}${
      f.key === "phone" ? ' inputmode="tel"' : ""}></label>`;
  }

  function paintCard() {
    const main = $m("#mntMain", host);
    if (!main) return;
    if (!C) {
      main.innerHTML = L.rows.length ? `<div class="pg-empty"><b>Выберите человека слева</b>Карточка откроется здесь.</div>`
        : `<div class="pg-empty"><b>Монтажников пока нет</b>Загрузите «Журнал учёта иностранцев» кнопкой вверху —
          люди заведутся по ФИО, — или заведите по одному кнопкой «Монтажник».</div>`;
      return;
    }
    const by = (g) => L.fields.filter((f) => f.group === g && f.key !== "name");
    const tile = (g, name, extra = "") => `<section class="crw-tile${g === "work" ? " mnt-wide" : ""}">
      <h4>${esc(name)}</h4>${extra}<div class="mnt-grid">${by(g).map(field).join("")}</div></section>`;
    main.innerHTML = `
      <div class="crw-card">
        <div class="crw-ch">
          <button type="button" class="pg-back crw-back" id="mntBack" title="К списку">${ICO.back}</button>
          <div class="crw-ch-b">
            <div class="crw-ch-t"><h3 title="${esc(C.name)}">${esc(C.name)}</h3>
              ${C.phone ? `<a class="crw-act" href="tel:${esc(C.phone.replace(/[^\d+]/g, ""))}" title="Позвонить">${ICO.phone}</a>` : ""}
              <span class="crw-save" id="mntSave" aria-live="polite"></span>
              <button type="button" class="ico warn" id="mntDel" title="Убрать из справочника">${ICO.trash}</button></div>
            <div class="mnt-top">
              <label class="fld mnt-name"><span>ФИО</span><input data-k="name" value="${esc(C.name)}" autocomplete="off"></label>
              <label class="fld mnt-crew"><span>Бригада</span><select data-k="crew_id">
                <option value="">— без бригады —</option>${L.crews.map((c) => `<option value="${esc(c.id)}"${
                  c.id === C.crew_id ? " selected" : ""}>${esc(c.title)}</option>`).join("")}</select></label>
            </div>
            ${C.gone ? `<div class="mnt-alerts"><span class="mnt-al gone">Уволен ${esc(dmy(C.fired))} — сроки документов не следим</span></div>` : ""}
            ${C.alerts.length ? `<div class="mnt-alerts">${C.alerts.map((a) => `<span class="mnt-al ${a.level}">${ICO.alert}${
              esc(a.what)}: ${esc(dmy(a.date))} — ${esc(daysText(a.days))}</span>`).join("")}</div>` : ""}
          </div>
        </div>
        <div class="crw-pane">
          <div class="crw-grid">
            ${tile("work", "Работа")}
            ${tile("mig", "Миграционный учёт")}
            ${tile("reg", "Прописка")}
            ${tile("patent", "Патент", C.eaeu ? '<p class="crw-hint">Гражданин ЕАЭС — патент не нужен, сроки патента не следим</p>' : "")}
            ${tile("passport", "Иностранный паспорт")}
            ${tile("policy", "Страховой полис")}
            ${tile("rvp", "РВП")}
            ${tile("vnzh", "ВНЖ")}
          </div>
        </div>
      </div>`;
    wireCard(main);
  }

  function status(text, bad) {
    const el = $m("#mntSave", host);
    if (!el) return;
    if (text === undefined) text = pending ? "Сохраняю…" : "";
    el.textContent = text;
    el.classList.toggle("bad", !!bad);
  }

  function send(id, body, repaint) {
    pending++;
    status();
    chain = chain.then(async () => {
      try {
        const got = await AUTH.api("PATCH", "/installers/" + encodeURIComponent(id), body);
        pending--;
        const i = L.rows.findIndex((r) => r.id === id);
        if (i >= 0) L.rows[i] = got.installer;
        paintList();
        if (C && C.id === id) {
          C = got.installer;
          if (repaint) paintCard();
        }
        status(pending ? undefined : "Сохранено");
      } catch (e) {
        pending--;
        status("Не сохранилось: " + e.message, true);
      }
    });
    return chain;
  }

  function wireCard(main) {
    const id = C.id, cur = C;
    $m("#mntBack", main).addEventListener("click", () => host.querySelector(".mnt-pg").classList.remove("has-sel"));
    $m("#mntDel", main).addEventListener("click", async () => {
      if (!(await ASK.confirm(`Убрать «${cur.name}» из справочника?\nКарточка и сроки документов пропадут.`,
                              { title: "Монтажники", ok: "Убрать", danger: true }))) return;
      try {
        await AUTH.api("DELETE", "/installers/" + encodeURIComponent(id));
        L.rows = L.rows.filter((r) => r.id !== id);
        sel = ""; C = null; mem(SEL_KEY, "");
        paintList(); paintCard();
        host.querySelector(".mnt-pg").classList.remove("has-sel");
      } catch (e) { ASK.alert(e.message, { title: "Не вышло" }); }
    });
    main.querySelectorAll("[data-k]").forEach((el) => {
      const k = el.dataset.k;
      const date = (L.fields.find((f) => f.key === k) || {}).kind === "date";
      el.addEventListener("change", () => {
        const v = el.value.trim();
        const was = date ? dmy(cur[k]) : String(cur[k] ?? "");
        if (v === was) return;
        // Дата и бригада меняют сроки и список — карточку перерисовываем.
        send(id, { [k]: v }, date || k === "name" || k === "crew_id" || k === "citizenship");
      });
    });
  }

  function note(text, bad) {
    const n = $m("#mntNote", host);
    if (!n) return;
    n.textContent = text;
    n.classList.toggle("bad", !!bad);
    n.hidden = !text;
  }

  async function upload(input) {
    const f = input.files && input.files[0];
    input.value = "";
    if (!f) return;
    note(`Читаю «${f.name}»…`);
    try {
      const r = await fetch("/api/installers/import", {
        method: "POST",
        headers: { Authorization: "Bearer " + AUTH.token(), "Content-Type": "application/octet-stream" },
        body: f,
      });
      let d = {};
      try { d = await r.json(); } catch (e) { /* не json */ }
      if (!r.ok) throw new Error(d.error || "Не удалось прочитать книгу");
      await load();
      const parts = [];
      if (d.added) parts.push(`заведено ${d.added}`);
      if (d.updated) parts.push(`обновлено ${d.updated}`);
      if (d.same) parts.push(`без изменений ${d.same}`);
      note(`Журнал прочитан: ${d.total} ${plural(d.total, "человек", "человека", "человек")} — ${parts.join(", ") || "нечего менять"}.`);
    } catch (e) {
      note(e.message, true);
    }
  }

  return { load };
})();
