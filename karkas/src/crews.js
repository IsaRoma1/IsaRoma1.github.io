/* «Справочники» → «Бригады монтажников» (заказчик, 21.10.2026).

   «Карточка на каждую бригаду: название, ИП, бригадир, телефон и почта,
   количество человек; рейтинг по пяти звёздам из нескольких критериев —
   нет оценок, звёзды не заполнены; специализация; объекты, где работали, —
   из наших или вписать руками; дата последнего взаимодействия и
   комментарий; день рождения бригадира и кнопки „Поздравить“ — с Днём
   строителя, Новым годом, днём рождения — открытка от компании; кнопки горят к
   празднику, за пять дней до дня рождения — сообщение в мессенджер тому,
   кого выбрали». Основа — дальше по обратной связи.

   Слева — бригады (название, люди, рейтинг), справа — карточка. Поля
   сохраняются сами, как в карточке заказчика. Сервер — crew_* в api.py,
   напоминания шлёт crew_bday_tick (Nexus, личный чат напоминаний). */
"use strict";

const CREWS = (() => {
  const $w = (s, r) => (r || document).querySelector(s);
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const tip = (t) => (typeof TIPS === "object" ? TIPS.icon(t) : "");
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
    x: svg('<path d="M7 7l10 10M17 7 7 17"/>'),
    trash: svg('<path d="M4.5 6.5h15M9.5 6.5V4.8A1.3 1.3 0 0 1 10.8 3.5h2.4a1.3 1.3 0 0 1 1.3 1.3v1.7M6.5 6.5l.9 12.2A1.5 1.5 0 0 0 8.9 20h6.2a1.5 1.5 0 0 0 1.5-1.3l.9-12.2"/>'),
    phone: svg('<path d="M6.6 3.5h2.6l1.4 4-1.9 1.3a10.5 10.5 0 0 0 6.5 6.5l1.3-1.9 4 1.4v2.6A2.1 2.1 0 0 1 18.4 20 15.4 15.4 0 0 1 4 5.6a2.1 2.1 0 0 1 2.6-2.1Z"/>'),
    mail: svg('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3.5 6.5 12 13l8.5-6.5"/>'),
    cake: svg('<path d="M4 20.5h16M5 20.5v-6.5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v6.5"/><path d="M5 15.5c1.2 1 2.3 1 3.5 0s2.3-1 3.5 0 2.3 1 3.5 0 2.3-1 3.5 0M12 12V8.5M12 5.5v.01"/>'),
    helmet: svg('<path d="M3.5 16.5h17M5 16.5V14a7 7 0 0 1 14 0v2.5"/><path d="M10 7.2V5.8a2 2 0 0 1 4 0v1.4M12 7v5"/>'),
    tree: svg('<path d="M12 3 7 9h3l-4 5h4l-4 5h12l-4-5h4l-4-5h3z"/><path d="M12 19v2.5"/>'),
    bell: svg('<path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 1.5h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>'),
    site: svg('<path d="M3 21h18M5 21V5.5A1.5 1.5 0 0 1 6.5 4h7A1.5 1.5 0 0 1 15 5.5V21M15 10h2.5A1.5 1.5 0 0 1 19 11.5V21"/><path d="M8 8h4M8 12h4M8 16h4"/>'),
    check: svg('<path d="m5.5 12.5 4 4 9-9"/>'),
    down: svg('<path d="M12 4v11M7 10.5l5 5 5-5M5 20h14"/>'),
    copy: svg('<rect x="8.5" y="8.5" width="11" height="11" rx="2"/><path d="M15.5 8.5V6a1.5 1.5 0 0 0-1.5-1.5H6A1.5 1.5 0 0 0 4.5 6v8A1.5 1.5 0 0 0 6 15.5h2.5"/>'),
  };
  const STAR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3.2 2.7 5.6 6.1.8-4.5 4.2 1.1 6.1L12 17l-5.4 2.9 1.1-6.1-4.5-4.2 6.1-.8z"/></svg>';
  const OCC = {
    builder: { ico: "helmet", btn: "С Днём строителя", head: "С Днём строителя!", subject: "С Днём строителя!" },
    newyear: { ico: "tree", btn: "С Новым годом", head: "С Новым годом!", subject: "С Новым годом!" },
    bday: { ico: "cake", btn: "С днём рождения", head: "С днём рождения!", subject: "С днём рождения!" },
  };
  const SEL_KEY = "karkas.crw.sel.v1";
  const SORT_KEY = "karkas.crw.sort.v1";
  const mem = (k, v) => {
    try {
      if (v === undefined) return localStorage.getItem(k) || "";
      localStorage.setItem(k, v);
    } catch (e) { /* без памяти */ }
    return "";
  };

  let host = null;
  let L = null;            // {rows, criteria, specs, sites, occasions, notify, ahead}
  let C = null;            // открытая бригада
  let Q = "", SPEC = "";
  let sort = mem(SORT_KEY) || "name";
  let sel = mem(SEL_KEY);
  let chain = Promise.resolve();
  let pending = 0;
  const timers = {};

  const narrow = () => window.matchMedia("(max-width: 760px)").matches;
  const day = (iso) => (iso ? iso.slice(8, 10) + "." + iso.slice(5, 7) + "." + iso.slice(0, 4) : "");
  const bdayInput = (b) => (!b ? "" : b.startsWith("--") ? b.slice(5, 7) + "." + b.slice(2, 4)
    : b.slice(8, 10) + "." + b.slice(5, 7) + "." + b.slice(0, 4));
  const today = () => (L && L.occasions ? L.occasions.today : new Date().toISOString().slice(0, 10));

  /* Звёзды: рейтинг дробный — закрашено пропорционально; без оценок —
     пустые, «не оценена». */
  function stars(v, cls = "") {
    const pct = v ? Math.max(0, Math.min(100, (v / 5) * 100)) : 0;
    return `<span class="crw-stars${cls ? " " + cls : ""}${v ? "" : " none"}" title="${v
      ? "Рейтинг " + String(v).replace(".", ",") + " из 5" : "Оценок нет"}"><span class="crw-st-bg">${STAR.repeat(5)}</span><span
      class="crw-st-fg" style="width:${pct}%">${STAR.repeat(5)}</span></span>`;
  }

  /* Какой год праздника отмечаем «поздравили»: как на сервере (crew_greeted). */
  function occYear(r, occ) {
    if (occ === "bday") {
      if (!r.bday_next) return null;
      const y = Number(r.bday_next.slice(0, 4));
      return r.bday_in != null && r.bday_in <= 31 ? y : Number(today().slice(0, 4));
    }
    return L.occasions[occ].year;
  }
  const greeted = (r, occ) => !!(r.greeted || {})[`${occ}-${occYear(r, occ)}`];
  // Горит ли кнопка: праздник близко, а поздравления ещё не было.
  function hot(r, occ) {
    if (greeted(r, occ)) return false;
    if (occ === "bday") return r.bday_in != null && r.bday_in <= L.ahead;
    return !!L.occasions[occ].on;
  }

  /* ── загрузка ────────────────────────────────────────────── */
  async function load() {
    host = document.getElementById("sec-crw");
    if (!host) return;
    if (!L) host.innerHTML = `<div class="pg"><div class="pg-body"><div class="pg-empty"><b>Загружаю бригады…</b></div></div></div>`;
    try {
      L = await AUTH.api("GET", "/crews");
    } catch (e) {
      host.innerHTML = `<div class="pg"><div class="pg-note bad">${esc(e.message)}</div></div>`;
      return;
    }
    if (sel && !L.rows.some((r) => r.id === sel)) sel = "";
    if (!sel && L.rows.length && !narrow()) sel = L.rows[0].id;
    C = L.rows.find((r) => r.id === sel) || null;
    render();
  }

  /* ── список ──────────────────────────────────────────────── */
  function shown() {
    const q = Q.trim().toLowerCase();
    let rows = L.rows.filter((r) => (!SPEC || r.specs.includes(SPEC)) && (!q || [r.title, r.name, r.legal,
      r.foreman, r.phone, r.email, ...r.specs, ...r.sites.map((s) => s.name)].some((x) => String(x || "").toLowerCase().includes(q))));
    if (sort === "rating") rows = rows.slice().sort((a, b) => (b.overall || 0) - (a.overall || 0));
    else if (sort === "contact") rows = rows.slice().sort((a, b) => String(b.last_contact).localeCompare(String(a.last_contact)));
    return rows;
  }

  function soon(r) {
    if (r.bday_in == null || r.bday_in > L.ahead) return "";
    const when = r.bday_in === 0 ? "сегодня" : r.bday_in === 1 ? "завтра" : `через ${r.bday_in} ${plural(r.bday_in, "день", "дня", "дней")}`;
    return `<span class="crw-soon" title="День рождения бригадира ${esc(when)}, ${esc(r.bday_text)}">${ICO.cake}${esc(when)}</span>`;
  }

  function banner() {
    const o = L.occasions;
    const out = [];
    if (o.builder.on) out.push(`${ICO.helmet}День строителя — ${esc(dayText(o.builder.date))}: поздравьте бригады`);
    if (o.newyear.on) out.push(`${ICO.tree}Новый год — поздравьте бригады`);
    const bd = L.rows.filter((r) => r.bday_in != null && r.bday_in <= L.ahead && !greeted(r, "bday")).length;
    if (bd) out.push(`${ICO.cake}${bd} ${plural(bd, "день рождения", "дня рождения", "дней рождения")} на этой неделе`);
    return out.length ? `<span class="crw-banner">${out.map((x) => `<span>${x}</span>`).join("")}</span>` : "";
  }
  const MONTHS = ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"];
  const dayText = (iso) => `${Number(iso.slice(8, 10))} ${MONTHS[Number(iso.slice(5, 7)) - 1]}`;

  function render() {
    const to = L.notify.map((u) => u.name).join(", ");
    host.innerHTML = `
      <div class="pg crw-pg${sel ? " has-sel" : ""}">
        <div class="pg-head crw-head">
          <label class="pg-find">${ICO.find}<input id="crwQ" type="search"
            placeholder="Бригада, бригадир, объект" value="${esc(Q)}" autocomplete="off"></label>
          <select class="role-sel" id="crwSpec" aria-label="Специализация">
            <option value="">Все специализации</option>${L.specs.map((s) => `<option${s === SPEC ? " selected" : ""}>${esc(s)}</option>`).join("")}
          </select>
          <select class="role-sel" id="crwSort" aria-label="Порядок">
            ${[["name", "По названию"], ["rating", "По рейтингу"], ["contact", "По последнему взаимодействию"]]
              .map(([k, t]) => `<option value="${k}"${k === sort ? " selected" : ""}>${t}</option>`).join("")}
          </select>
          <span class="pg-count" id="crwCnt"></span>
          ${banner()}
          <span class="grow"></span>
          <button type="button" class="btn-ghost sm crw-notify" id="crwNotify" title="Кому Nexus напоминает в мессенджер о днях рождения бригадиров — за ${L.ahead} дней">
            ${ICO.bell}<span>${to ? "Напоминать: " + esc(to) : "Кому напоминать о днях рождения?"}</span></button>
          <button type="button" class="btn-brand sm" id="crwNew">${ICO.plus}Бригада</button>
          ${tip("Бригады монтажников: карточка, рейтинг по критериям, специализация, объекты, поздравления. "
            + "За " + L.ahead + " дней до дня рождения бригадира Nexus напомнит в мессенджере тем, кого выбрали. Поля сохраняются сами.")}
        </div>
        <div class="pg-body crw-body">
          <nav class="crw-list" id="crwList" aria-label="Бригады"></nav>
          <div class="crw-main" id="crwMain"></div>
        </div>
      </div>`;
    paintList();
    paintCard();
    $w("#crwQ", host).addEventListener("input", (e) => { Q = e.target.value; paintList(); });
    $w("#crwSpec", host).addEventListener("change", (e) => { SPEC = e.target.value; paintList(); });
    $w("#crwSort", host).addEventListener("change", (e) => { sort = e.target.value; mem(SORT_KEY, sort); paintList(); });
    $w("#crwNew", host).addEventListener("click", create);
    $w("#crwNotify", host).addEventListener("click", notifyDialog);
  }

  function paintList() {
    const list = $w("#crwList", host);
    if (!list) return;
    const rows = shown();
    $w("#crwCnt", host).innerHTML = `<b>${rows.length}</b> ${plural(rows.length, "бригада", "бригады", "бригад")}`;
    list.innerHTML = rows.length ? rows.map((r) => `<button type="button" class="crw-li${r.id === sel ? " on" : ""}" data-id="${esc(r.id)}">
        <span class="crw-li-n" title="${esc(r.title)}">${esc(r.title)}</span>
        <span class="crw-li-m">${esc([r.foreman && r.foreman !== r.title ? r.foreman : r.legal !== r.title ? r.legal : "",
          r.people ? `${r.people} чел.` : ""].filter(Boolean).join(" · ") || "—")}</span>
        <span class="crw-li-r">${stars(r.overall, "sm")}${r.overall ? `<b>${String(r.overall).replace(".", ",")}</b>` : ""}${soon(r)}</span>
      </button>`).join("")
      : `<div class="crw-li-empty">${L.rows.length ? "Никто не подошёл под отбор" : "Бригад пока нет — заведите кнопкой «Бригада»"}</div>`;
    list.querySelectorAll(".crw-li").forEach((b) => b.addEventListener("click", () => open(b.dataset.id)));
  }

  function open(id) {
    flush();
    sel = id;
    mem(SEL_KEY, id);
    C = L.rows.find((r) => r.id === id) || null;
    paintList();
    paintCard();
    host.querySelector(".crw-pg").classList.toggle("has-sel", !!C);
  }

  async function create() {
    const name = await ASK.prompt("Новая бригада — название, ИП или ФИО бригадира", "");
    if (!name || !name.trim()) return;
    try {
      const got = await AUTH.api("POST", "/crews", { name: name.trim() });
      L.rows.push(got.crew);
      L.rows.sort((a, b) => a.title.localeCompare(b.title, "ru"));
      open(got.crew.id);
    } catch (e) {
      ASK.alert(e.message, { title: "Не вышло" });
    }
  }

  /* ── карточка ────────────────────────────────────────────── */
  const val = (v) => (v === null || v === undefined ? "" : String(v));
  const fld = (k, label, attrs = "", v = C[k]) => `<label class="fld"><span>${label}</span><input data-k="${k}"
    value="${esc(val(v))}" autocomplete="off"${attrs}></label>`;

  function bdayHint() {
    if (!C.birthday) return "Не записан — кнопки «С днём рождения» не будет";
    const when = C.bday_in === 0 ? "сегодня" : C.bday_in === 1 ? "завтра"
      : `через ${C.bday_in} ${plural(C.bday_in, "день", "дня", "дней")}`;
    return `${esc(C.bday_text)} — ${esc(when)}${C.age ? `, исполнится ${C.age}` : ""}`;
  }

  function paintCard() {
    const main = $w("#crwMain", host);
    if (!main) return;
    if (!C) {
      main.innerHTML = L.rows.length ? `<div class="pg-empty"><b>Выберите бригаду слева</b>Карточка откроется здесь.</div>`
        : `<div class="pg-empty"><b>Бригад пока нет</b>Заведите первую кнопкой «Бригада» вверху: название, ИП или ФИО бригадира — остальное впишете в карточке.</div>`;
      return;
    }
    const occ = ["builder", "newyear", "bday"].filter((o) => o !== "bday" || C.birthday);
    main.innerHTML = `
      <div class="crw-card">
        <div class="crw-ch">
          <button type="button" class="pg-back crw-back" id="crwBack" title="К списку бригад">${ICO.back}</button>
          <div class="crw-ch-b">
            <div class="crw-ch-t"><h3 title="${esc(C.title)}">${esc(C.title)}</h3>
              <span class="crw-big">${stars(C.overall)}${C.overall ? `<b>${String(C.overall).replace(".", ",")}</b>`
                : '<i>не оценена</i>'}</span>
              <span class="crw-save" id="crwSave" aria-live="polite"></span>
              <button type="button" class="ico warn" id="crwDel" title="Убрать бригаду из справочника">${ICO.trash}</button></div>
            <div class="crw-greet">${occ.map((o) => `<button type="button" class="crw-gb${hot(C, o) ? " hot" : ""}${greeted(C, o) ? " done" : ""}"
                data-greet="${o}" title="${greeted(C, o) ? "Уже поздравили — открыть открытку ещё раз"
                  : hot(C, o) ? "Праздник близко — поздравьте" : "Открытка от компании"}">${ICO[OCC[o].ico]}${OCC[o].btn}${
                greeted(C, o) ? ICO.check : ""}</button>`).join("")}
              ${C.birthday ? "" : '<span class="crw-hint">Впишите день рождения бригадира — появится «С днём рождения»</span>'}</div>
          </div>
        </div>
        <div class="crw-pane" id="crwPane">
          <div class="crw-grid">
            <section class="crw-tile">
              <h4>Бригада</h4>
              ${fld("name", "Название бригады", ' placeholder="например, «Электромонтаж-Урал»"')}
              <div class="crw-2">${fld("legal", "ИП или организация", ' placeholder="ИП Петров А. В."')}
                ${fld("inn", "ИНН", ' inputmode="numeric" placeholder="12 цифр у ИП"')}</div>
              ${fld("people", "Человек в бригаде", ' inputmode="numeric" placeholder="сколько монтажников"')}
            </section>
            <section class="crw-tile">
              <h4>Бригадир</h4>
              ${fld("foreman", "ФИО", ' placeholder="Петров Иван Сергеевич"')}
              <div class="crw-2">
                <label class="fld"><span>Телефон${C.phone ? ` <a href="tel:${esc(C.phone.replace(/[^\d+]/g, ""))}" class="crw-act" title="Позвонить">${ICO.phone}</a>` : ""}</span>
                  <input data-k="phone" value="${esc(C.phone)}" inputmode="tel" placeholder="+7 900 000-00-00" autocomplete="off"></label>
                <label class="fld"><span>Почта${C.email ? ` <a href="mailto:${esc(C.email)}" class="crw-act" title="Написать">${ICO.mail}</a>` : ""}</span>
                  <input data-k="email" value="${esc(C.email)}" inputmode="email" placeholder="name@mail.ru" autocomplete="off"></label>
              </div>
              ${fld("birthday", "День рождения", ' placeholder="ДД.ММ или ДД.ММ.ГГГГ"', bdayInput(C.birthday))}
              <p class="crw-hint" id="crwBday">${bdayHint()}</p>
            </section>
            <section class="crw-tile">
              <h4>Рейтинг${tip("Звёзды ставите вы — по каждому критерию. Рейтинг бригады — среднее по оценённым. Нет оценок — звёзды пустые.")}</h4>
              <div class="crw-rate">${L.criteria.map((k) => `<div class="crw-rr"><span>${esc(k.name)}${k.key === "exp" && C.sites.length
                ? `<i>${C.sites.length} ${plural(C.sites.length, "объект", "объекта", "объектов")}</i>` : ""}</span>
                <span class="crw-pick" data-rate="${esc(k.key)}">${[1, 2, 3, 4, 5].map((n) => `<button type="button"
                  class="${(C.rating[k.key] || 0) >= n ? "on" : ""}" data-n="${n}" title="${n} из 5${C.rating[k.key] === n ? " — щёлкните ещё раз, чтобы снять" : ""}"
                  aria-label="${esc(k.name)}: ${n} из 5">${STAR}</button>`).join("")}</span></div>`).join("")}</div>
              <p class="crw-hint">${C.overall ? `Итог — среднее по ${plural(Object.values(C.rating).filter(Boolean).length, "критерию", "критериям", "критериям")}: ${String(C.overall).replace(".", ",")} из 5`
                : "Оценок нет — рейтинг не заполнен"}</p>
            </section>
            <section class="crw-tile">
              <h4>Специализация</h4>
              <div class="crw-chips">${[...new Set([...L.specs, ...C.specs])].map((s) => `<button type="button"
                class="crw-chip${C.specs.includes(s) ? " on" : ""}" data-spec="${esc(s)}">${esc(s)}</button>`).join("")}</div>
              <input class="crw-in" id="crwSpecNew" placeholder="Своя специализация — Enter" autocomplete="off">
            </section>
            <section class="crw-tile wide">
              <h4>Объекты, где работали${tip("Из наших объектов — выберите в списке. Объекта в списке нет (строился давно) — впишите название и нажмите Enter.")}</h4>
              <div class="crw-sites">${C.sites.length ? C.sites.map((s, i) => `<span class="crw-site${s.ours ? " ours" : ""}"
                title="${s.ours ? "Наш объект" : "Вписан руками"}${s.note ? " · " + esc(s.note) : ""}">${s.ours ? ICO.site : ""}<b>${esc(s.name)}</b>${
                s.note ? `<i>${esc(s.note)}</i>` : ""}<button type="button" data-unsite="${i}" title="Убрать">${ICO.x}</button></span>`).join("")
                : '<span class="crw-hint">Пока ни одного</span>'}</div>
              <div class="crw-addsite"><input class="crw-in" id="crwSite" list="crwSites" placeholder="Объект — из наших или вписать название, Enter" autocomplete="off">
                <input class="crw-in sm" id="crwSiteNote" placeholder="Год, что делали — необязательно" autocomplete="off">
                <datalist id="crwSites">${L.sites.map((s) => `<option value="${esc(s.name)}"></option>`).join("")}</datalist></div>
            </section>
            ${Array.isArray(C.installers) ? `<section class="crw-tile wide">
              <h4>Монтажники бригады${tip("Люди из «Справочников» → «Монтажники», у кого выбрана эта бригада. Щелчок — карточка человека.")}</h4>
              ${C.installers.length ? `<div class="crw-sites">${C.installers.map((p) => `<button type="button" class="crw-site ours mnt-li"
                data-mnt="${esc(p.id)}" title="Открыть карточку">${ICO.helmet}<b>${esc(p.name)}</b>${p.post ? `<i>${esc(p.post)}</i>` : ""}</button>`).join("")}</div>`
                : '<span class="crw-hint">Никого — бригаду выбирают в карточке монтажника («Справочники» → «Монтажники»)</span>'}
            </section>` : ""}
            <section class="crw-tile wide">
              <h4>Работа с бригадой</h4>
              <div class="crw-2 crw-contact">
                <label class="fld"><span>Последнее взаимодействие</span><input type="date" data-k="last_contact" value="${esc(C.last_contact)}"
                  max="${esc(today())}"></label>
                <button type="button" class="btn-ghost sm" id="crwToday">Сегодня</button>
              </div>
              <label class="fld crw-note"><span>Комментарий</span><textarea data-k="comment" rows="4"
                placeholder="Как работают, что важно знать, договорённости">${esc(C.comment)}</textarea></label>
            </section>
          </div>
        </div>
      </div>`;
    wireCard(main);
  }

  /* ── правка ──────────────────────────────────────────────── */
  function status(text, bad) {
    const el = $w("#crwSave", host);
    if (!el) return;
    if (text === undefined) text = pending ? "Сохраняю…" : "";
    el.textContent = text;
    el.classList.toggle("bad", !!bad);
  }

  function took(got, repaint) {
    const i = L.rows.findIndex((r) => r.id === got.id);
    if (i >= 0) L.rows[i] = got;
    paintList();
    if (!C || C.id !== got.id) return;
    C = got;
    if (repaint) { paintCard(); return; }
    const h = $w("#crwBday", host);
    if (h) h.innerHTML = bdayHint();
  }

  function flush() {
    Object.keys(timers).forEach((k) => {
      clearTimeout(timers[k].t);
      const fn = timers[k].fn;
      delete timers[k];
      fn();
    });
  }

  function send(id, body, repaint, url = "", method = "PATCH") {
    pending++;
    status();
    chain = chain.then(async () => {
      try {
        const got = await AUTH.api(method, "/crews/" + encodeURIComponent(id) + url, body);
        pending--;
        took(got.crew, repaint);
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
    $w("#crwBack", main).addEventListener("click", () => host.querySelector(".crw-pg").classList.remove("has-sel"));
    $w("#crwDel", main).addEventListener("click", async () => {
      if (!(await ASK.confirm(`Убрать бригаду «${cur.title}» из справочника?\nКарточка, оценки и объекты пропадут.`))) return;
      try {
        await AUTH.api("DELETE", "/crews/" + encodeURIComponent(id));
        L.rows = L.rows.filter((r) => r.id !== id);
        sel = ""; C = null; mem(SEL_KEY, "");
        paintList(); paintCard();
        host.querySelector(".crw-pg").classList.remove("has-sel");
      } catch (e) { ASK.alert(e.message, { title: "Не вышло" }); }
    });
    main.querySelectorAll("[data-k]").forEach((el) => {
      const k = el.dataset.k;
      const fire = () => {
        if (timers[k]) { clearTimeout(timers[k].t); delete timers[k]; }
        const v = el.value.trim();
        const was = k === "birthday" ? bdayInput(cur.birthday) : val(cur[k]);
        if (v === was) return;
        // Название в шапке и в списке меняется вместе с полем.
        const repaint = ["name", "legal", "foreman", "phone", "email", "birthday"].includes(k);
        send(id, { [k]: v }, repaint);
      };
      el.addEventListener("change", fire);
      if (el.tagName === "TEXTAREA") {
        el.addEventListener("input", () => {
          if (timers[k]) clearTimeout(timers[k].t);
          timers[k] = { t: setTimeout(fire, 1200), fn: fire };
        });
      }
    });
    $w("#crwToday", main).addEventListener("click", () => {
      const d = today();
      $w('[data-k="last_contact"]', main).value = d;
      send(id, { last_contact: d }, false);
    });
    main.querySelectorAll("[data-rate]").forEach((g) => g.querySelectorAll("[data-n]").forEach((b) => b.addEventListener("click", () => {
      const k = g.dataset.rate, n = Number(b.dataset.n);
      send(id, { rating: { [k]: cur.rating[k] === n ? null : n } }, true);
    })));
    main.querySelectorAll("[data-spec]").forEach((b) => b.addEventListener("click", () => {
      const s = b.dataset.spec;
      const next = cur.specs.includes(s) ? cur.specs.filter((x) => x !== s) : [...cur.specs, s];
      send(id, { specs: next }, true);
    }));
    const sp = $w("#crwSpecNew", main);
    sp.addEventListener("keydown", (e) => {
      if (e.key !== "Enter" || !sp.value.trim()) return;
      e.preventDefault();
      const s = sp.value.trim();
      if (!L.specs.includes(s)) L.specs.push(s);
      send(id, { specs: [...new Set([...cur.specs, s])] }, true);
    });
    main.querySelectorAll("[data-unsite]").forEach((b) => b.addEventListener("click", () => {
      const i = Number(b.dataset.unsite);
      send(id, { sites: cur.sites.filter((_, j) => j !== i).map(siteOut) }, true);
    }));
    const si = $w("#crwSite", main), sn = $w("#crwSiteNote", main);
    const addSite = () => {
      const name = si.value.trim();
      if (!name) return;
      const ours = L.sites.find((s) => s.name.toLowerCase() === name.toLowerCase());
      const add = ours ? { site_id: ours.id, name: ours.name, note: sn.value.trim() } : { site_id: "", name, note: sn.value.trim() };
      if (cur.sites.some((s) => (ours && s.site_id === ours.id) || (!ours && !s.site_id && s.name.toLowerCase() === name.toLowerCase()))) {
        status("Этот объект уже в списке", true);
        return;
      }
      send(id, { sites: [...cur.sites.map(siteOut), add] }, true);
    };
    [si, sn].forEach((el) => el.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); addSite(); } }));
    // Выбор из подсказки браузера — тоже добавление.
    si.addEventListener("change", () => { if (L.sites.some((s) => s.name === si.value.trim())) addSite(); });
    main.querySelectorAll("[data-greet]").forEach((b) => b.addEventListener("click", () => greet(cur, b.dataset.greet)));
    // Монтажник бригады — его карточка во вкладке «Монтажники».
    main.querySelectorAll("[data-mnt]").forEach((b) => b.addEventListener("click", () => {
      mem("karkas.mnt.sel.v1", b.dataset.mnt);
      if (typeof REFS === "object") REFS.open("mnt");
    }));
  }
  const siteOut = (s) => ({ site_id: s.site_id, name: s.name, note: s.note });

  /* ── кому напоминать о днях рождения ─────────────────────── */
  async function notifyDialog() {
    let d;
    try { d = await AUTH.api("GET", "/crew-notify"); } catch (e) { ASK.alert(e.message, { title: "Не вышло" }); return; }
    const chosen = new Set(d.to.map((u) => u.id));
    const wrap = document.createElement("div");
    wrap.className = "crw-wrap";
    wrap.innerHTML = `<div class="crw-dlg crw-small" role="dialog" aria-modal="true" aria-label="Кому напоминать">
      <header class="crw-dh"><span class="crw-dh-ic">${ICO.bell}</span><div><h3>Кому напоминать о днях рождения</h3>
        <p>За ${L.ahead} дней до дня рождения бригадира Nexus напишет им в мессенджер — в чат «Nexus · напоминания»</p></div>
        <button type="button" class="crw-x" data-x aria-label="Закрыть">${ICO.x}</button></header>
      <div class="crw-db"><input class="crw-in" id="crwWho" placeholder="Найти сотрудника" autocomplete="off">
        <div class="crw-people" id="crwPeople"></div></div>
      <footer class="crw-df"><span id="crwCnt2"></span><button type="button" class="btn-ghost" data-x>Отмена</button>
        <button type="button" class="btn-brand" id="crwSaveTo">Сохранить</button></footer></div>`;
    document.body.appendChild(wrap);
    const paint = () => {
      const q = $w("#crwWho", wrap).value.trim().toLowerCase();
      $w("#crwPeople", wrap).innerHTML = d.users.filter((u) => !q || u.name.toLowerCase().includes(q)).map((u) => `<label class="crw-person">
        <input type="checkbox" value="${esc(u.id)}"${chosen.has(u.id) ? " checked" : ""}><span>${esc(u.name)}</span></label>`).join("")
        || '<p class="crw-hint">Никто не нашёлся</p>';
      $w("#crwCnt2", wrap).textContent = chosen.size ? `Выбрано: ${chosen.size}` : "Никто — напоминаний не будет";
    };
    const close = () => { wrap.remove(); document.removeEventListener("keydown", key, true); };
    const key = (e) => { if (e.key === "Escape" && !document.querySelector(".dlg-wrap")) { e.stopPropagation(); close(); } };
    document.addEventListener("keydown", key, true);
    wrap.addEventListener("click", (e) => { if (e.target === wrap || e.target.closest("[data-x]")) close(); });
    $w("#crwWho", wrap).addEventListener("input", paint);
    $w("#crwPeople", wrap).addEventListener("change", (e) => {
      if (e.target.checked) chosen.add(e.target.value); else chosen.delete(e.target.value);
      paint();
    });
    $w("#crwSaveTo", wrap).addEventListener("click", async (e) => {
      e.target.disabled = true;
      try {
        const got = await AUTH.api("PATCH", "/crew-notify", { to: [...chosen] });
        L.notify = got.to;
        close();
        render();
      } catch (err) { e.target.disabled = false; ASK.alert(err.message, { title: "Не сохранилось" }); }
    });
    paint();
    $w("#crwWho", wrap).focus();
  }

  /* ── открытка ────────────────────────────────────────────── */
  /* Обращение по ФИО бригадира: «Фамилия Имя Отчество» — по имени и
     отчеству; «Уважаемый/Уважаемая» — по окончанию отчества. Без
     отчества — «Здравствуйте, …», без бригадира — к бригаде. */
  function salute(r) {
    const w = String(r.foreman || "").trim().split(/\s+/).filter(Boolean);
    if (w.length >= 3) {
      const pat = w[2].toLowerCase();
      const io = w[1] + " " + w[2];
      if (/(вич|ич)$/.test(pat)) return `Уважаемый ${io}!`;
      if (/(вна|чна|шна|кызы)$/.test(pat)) return `Уважаемая ${io}!`;
      return `Здравствуйте, ${io}!`;
    }
    if (w.length) return `Здравствуйте, ${w.join(" ")}!`;
    return r.name ? `Уважаемые коллеги из бригады «${r.name}»!` : "Уважаемые коллеги!";
  }

  function textFor(r, occ) {
    const crew = r.name ? `бригаду «${r.name}»` : "вашу бригаду";
    const objs = r.sites.slice(0, 3).map((s) => s.name);
    if (occ === "builder") {
      return `Наша команда поздравляет вас и ${crew} с профессиональным праздником — Днём строителя! `
        + `Спасибо за надёжную работу${objs.length ? " на наших объектах — " + objs.join(", ") : " на наших объектах"}. `
        + "Желаем крепкого здоровья, безопасного труда, интересных объектов и достойных заказов!";
    }
    if (occ === "newyear") {
      return `Наша команда поздравляет вас и ${crew} с Новым ${L.occasions.newyear.year} годом! `
        + "Спасибо за совместную работу в уходящем году. Желаем здоровья, благополучия вашим семьям, новых объектов и спокойных, безопасных смен!";
    }
    return "Наша команда от всей души поздравляет вас с днём рождения! Желаем крепкого здоровья, сил, удачи "
      + "и отличного настроения. Спасибо за вашу работу — рады, что вы с нами!";
  }

  let logo = null;
  const logoP = () => logo || (logo = new Promise((ok) => {
    const im = new Image();
    im.onload = () => ok(im);
    im.onerror = () => ok(null);
    im.src = "src/brand-mark.svg";
  }));

  // Перенос строки по ширине — для текста открытки на canvas.
  function wrapText(g, text, maxW) {
    const out = [];
    for (const para of String(text).split("\n")) {
      let line = "";
      for (const word of para.split(/\s+/)) {
        const t = line ? line + " " + word : word;
        if (g.measureText(t).width > maxW && line) { out.push(line); line = word; } else line = t;
      }
      out.push(line);
    }
    return out;
  }

  const THEMES = {
    builder: { bg: ["#1B1C3A", "#2E3266"], accent: "#A99BFF", ink: "#FFFFFF", sub: "#D5DCE2" },
    newyear: { bg: ["#0E2244", "#1F3F73"], accent: "#FFB35C", ink: "#FFFFFF", sub: "#D6E2F5" },
    bday: { bg: ["#F3F0FF", "#E2E8FF"], accent: "#6E5CF6", ink: "#17183A", sub: "#4B4F70" },
  };

  async function draw(canvas, occ, to, text, sign) {
    const W = 1200, H = 800, th = THEMES[occ];
    canvas.width = W; canvas.height = H;
    const g = canvas.getContext("2d");
    const grad = g.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, th.bg[0]); grad.addColorStop(1, th.bg[1]);
    g.fillStyle = grad; g.fillRect(0, 0, W, H);
    // Узор праздника: стройка — косые полосы, Новый год — снег, день рождения — конфетти.
    let seed = 7;
    const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
    if (occ === "builder") {
      g.fillStyle = th.accent;
      for (let x = -200; x < W; x += 70) { g.beginPath(); g.moveTo(x, H - 26); g.lineTo(x + 35, H - 26); g.lineTo(x + 61, H); g.lineTo(x + 26, H); g.fill(); }
      g.globalAlpha = 0.07; g.strokeStyle = "#FFFFFF"; g.lineWidth = 2;
      for (let x = 0; x < W; x += 60) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); }
      for (let y = 0; y < H; y += 60) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
      g.globalAlpha = 1;
    } else if (occ === "newyear") {
      g.fillStyle = "#FFFFFF";
      for (let i = 0; i < 140; i++) { g.globalAlpha = 0.25 + rnd() * 0.6; g.beginPath(); g.arc(rnd() * W, rnd() * H, 1 + rnd() * 3.2, 0, 7); g.fill(); }
      g.globalAlpha = 1;
    } else {
      const cols = ["#6E5CF6", "#FFB35C", "#4FB0A5", "#8C6CD8", "#F06292"];
      for (let i = 0; i < 70; i++) { g.fillStyle = cols[i % cols.length]; g.globalAlpha = 0.55; g.save(); g.translate(rnd() * W, rnd() * H); g.rotate(rnd() * 3); g.fillRect(-7, -3, 14, 6); g.restore(); }
      g.globalAlpha = 1;
    }
    // Плашка под текст.
    g.fillStyle = occ === "bday" ? "rgba(255,255,255,.82)" : "rgba(0,0,0,.22)";
    const r = 28, x0 = 60, y0 = 60, pw = W - 120, ph = H - 150;
    g.beginPath(); g.moveTo(x0 + r, y0); g.arcTo(x0 + pw, y0, x0 + pw, y0 + ph, r); g.arcTo(x0 + pw, y0 + ph, x0, y0 + ph, r);
    g.arcTo(x0, y0 + ph, x0, y0, r); g.arcTo(x0, y0, x0 + pw, y0, r); g.closePath(); g.fill();
    const im = await logoP();
    if (im) g.drawImage(im, W - 120 - 150, 90, 150, 150 * im.height / im.width);
    const font = (w, s) => `${w} ${s}px Onest, "Segoe UI", Arial, sans-serif`;
    g.fillStyle = th.accent; g.font = font(800, 74);
    g.fillText(OCC[occ].head, 100, 175);
    g.fillStyle = th.ink; g.font = font(600, 34);
    let y = 250;
    for (const line of wrapText(g, to, 760)) { g.fillText(line, 100, y); y += 44; }
    y += 14;
    g.fillStyle = th.sub; g.font = font(400, 28);
    for (const line of wrapText(g, text, 1000).slice(0, 8)) { g.fillText(line, 100, y); y += 40; }
    g.fillStyle = th.ink; g.font = font(500, 26);
    const signLines = String(sign || "").split("\n").slice(0, 3);
    let sy = y0 + ph - 30 - (signLines.length - 1) * 34;
    for (const line of signLines) { g.fillText(line, 100, sy); sy += 34; }
  }

  async function greet(r, occ) {
    const wrap = document.createElement("div");
    wrap.className = "crw-wrap";
    const subject = OCC[occ].subject;
    wrap.innerHTML = `<div class="crw-dlg" role="dialog" aria-modal="true" aria-label="${esc(subject)}">
      <header class="crw-dh"><span class="crw-dh-ic">${ICO[OCC[occ].ico]}</span><div><h3>${esc(OCC[occ].btn)}</h3>
        <p>${esc(r.title)}${r.foreman && r.foreman !== r.title ? " · " + esc(r.foreman) : ""}${r.email ? " · " + esc(r.email) : ""}</p></div>
        <button type="button" class="crw-x" data-x aria-label="Закрыть">${ICO.x}</button></header>
      <div class="crw-db crw-gbody">
        <div class="crw-card-prev"><canvas id="crwCanvas" aria-label="Открытка"></canvas></div>
        <div class="crw-gform">
          <label class="fld"><span>Обращение</span><input id="crwTo" value="${esc(salute(r))}" autocomplete="off"></label>
          <label class="fld"><span>Текст</span><textarea id="crwText" rows="7">${esc(textFor(r, occ))}</textarea></label>
          <label class="fld"><span>Подпись</span><textarea id="crwSign" rows="2">С уважением,
команда компании</textarea></label>
          <label class="crw-check"><input type="checkbox" id="crwMark" checked>Отметить: поздравили, взаимодействие — сегодня</label>
          <p class="crw-hint">Открытку скачайте или скопируйте и отправьте в мессенджер; письмом — откроется почта с текстом, открытку приложите.</p>
          <p class="crw-hint bad" id="crwGErr" hidden></p>
        </div>
      </div>
      <footer class="crw-df"><span></span>
        <button type="button" class="btn-ghost" id="crwCopy">${ICO.copy}Скопировать открытку</button>
        <button type="button" class="btn-ghost" id="crwMail"${r.email ? "" : ' disabled title="Почта бригадира не записана"'}>${ICO.mail}Написать письмо</button>
        <button type="button" class="btn-brand" id="crwPng">${ICO.down}Скачать открытку</button></footer></div>`;
    document.body.appendChild(wrap);
    const canvas = $w("#crwCanvas", wrap);
    const vals = () => ({ to: $w("#crwTo", wrap).value, text: $w("#crwText", wrap).value, sign: $w("#crwSign", wrap).value });
    let tmr = null;
    const redraw = () => { const v = vals(); draw(canvas, occ, v.to, v.text, v.sign); };
    wrap.addEventListener("input", () => { clearTimeout(tmr); tmr = setTimeout(redraw, 150); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(redraw); else redraw();
    redraw();
    const close = () => { wrap.remove(); document.removeEventListener("keydown", key, true); };
    const key = (e) => { if (e.key === "Escape" && !document.querySelector(".dlg-wrap")) { e.stopPropagation(); close(); } };
    document.addEventListener("keydown", key, true);
    wrap.addEventListener("click", (e) => { if (e.target === wrap || e.target.closest("[data-x]")) close(); });
    const fail = (m) => { const p = $w("#crwGErr", wrap); p.textContent = m; p.hidden = !m; };
    let marked = false;
    const mark = async () => {
      if (marked || !$w("#crwMark", wrap).checked) return;
      marked = true;
      try {
        const got = await AUTH.api("POST", "/crews/" + encodeURIComponent(r.id) + "/greeted", { occasion: occ });
        took(got.crew, true);
      } catch (e) { marked = false; fail("Отметка не сохранилась: " + e.message); }
    };
    const blob = () => new Promise((ok) => canvas.toBlob(ok, "image/png"));
    const fileName = `${subject.replace(/[!«»"]/g, "")} — ${r.title}.png`.replace(/[\\/:*?"<>|]/g, " ");
    $w("#crwPng", wrap).addEventListener("click", async () => {
      const b = await blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(b); a.download = fileName;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      mark();
    });
    $w("#crwCopy", wrap).addEventListener("click", async (e) => {
      const btn = e.currentTarget;
      try {
        const b = await blob();
        await navigator.clipboard.write([new ClipboardItem({ "image/png": b })]);
        btn.innerHTML = `${ICO.check}Скопировано`;
        fail("");
        mark();
      } catch (err) { fail("Браузер не дал скопировать картинку — скачайте открытку кнопкой справа"); }
    });
    $w("#crwMail", wrap).addEventListener("click", () => {
      const v = vals();
      const body = `${v.to}\n\n${v.text}\n\n${v.sign}`;
      location.href = `mailto:${encodeURIComponent(r.email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      mark();
    });
  }

  return { load };
})();
