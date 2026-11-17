/* Справочник сотрудников — штат конторы.

   Не то же, что «Пользователи»: там учётки платформы, а здесь люди.
   Восемьдесят человек, из которых заходят в платформу единицы, —
   кладовщик и мастер СМР нужны, чтобы назначить их на объект и найти по
   отделу, а не потому, что им дают доступ.

   Устроен как «Расценки»: правка на месте, без окон. Справочник на
   восемь десятков строк, где меняют телефон или должность, — открывать
   карточку ради одного поля значит превратить минутное дело в
   пятиминутное. Строка сохраняется сама, как только ушли из поля.

   Порядок — по фамилии. В отличие от прайса, который читают глазами по
   памяти, здесь ищут конкретного человека, и алфавит для этого лучше
   любого другого порядка.

   Смотрят все (заказчик, 09.10.2026) — как телефонную книгу: фото, ФИО,
   должность, отдел, телефон, e-mail. Полный доступ — вкладка «Сотрудники»
   в «Доступе» — это ещё даты, дни в компании, правка и фото. Какие поля
   показать, решает сервер: без полного доступа закрытые поля не приходят
   вовсе, и FULL берётся из его ответа, а не из галочек в браузере.

   Фото ставит ответственный за справочник; у связанной учётки оно же
   отображается в профиле, а у части сотрудников учётки вовсе нет. */
"use strict";

const STAFF = (() => {
  const $t = (s, r) => (r || document).querySelector(s);
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  const ICO = {
    find: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11"
      r="6.5"/><path d="M20.5 20.5 16 16"/></svg>`,
    plus: `<svg viewBox="0 0 24 24" aria-hidden="true"><path
      d="M12 5v14M5 12h14"/></svg>`,
    up: `<svg viewBox="0 0 24 24" aria-hidden="true"><path
      d="M12 16V4M7 9l5-5 5 5M4 17v2a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-2"/></svg>`,
    chev: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>`,
    cam: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8.5A1.5 1.5 0 0 1
      5.5 7h2.2l1.5-2h5.6l1.5 2h2.2A1.5 1.5 0 0 1 20 8.5v9a1.5 1.5 0 0 1-1.5
      1.5h-13A1.5 1.5 0 0 1 4 17.5z"/><circle cx="12" cy="12.5" r="3.3"/></svg>`,
  };

  /* Фото кадрируется квадратом этой стороны: в списке оно кружок в
     три десятка пикселей, а в карточке — в двести, и на плотном экране
     двести пикселей — это четыреста точек. */
  const PHOTO_SIZE = 384;

  let ROWS = [];
  let DEPTS = [];
  let POSTS = [];
  let BANDS = [];
  let FULL = false;
  // Кадровые даты — рождения, приёма, увольнения и стаж (правка № 35):
  // своя галочка «Кадровые даты» в «Доступе», не у всех с полным доступом.
  let HR = false;
  let search = "";
  let dept = "";
  let post = "";

  const can = () => FULL;

  const plural = (n, one, few, many) => {
    const a = Math.abs(n) % 100;
    const b = a % 10;
    if (a > 10 && a < 20) return many;
    if (b > 1 && b < 5) return few;
    return b === 1 ? one : many;
  };

  const inits = (name) => String(name || "").trim().split(/\s+/).slice(0, 2)
    .map((w) => (w[0] || "").toUpperCase()).join("") || "?";
  const photoUrl = (r) => (r && r.photo
    ? `/api/staff/${encodeURIComponent(r.id)}/photo?v=${encodeURIComponent(r.photo)}` : "");
  const fmtD = (iso) => String(iso || "").split("-").reverse().join(".");
  const rowOf = (id) => ROWS.find((x) => x.id === id);

  async function load() {
    const res = await AUTH.api("GET", "/staff");
    ROWS = res.rows;
    DEPTS = res.depts;
    POSTS = res.posts;
    BANDS = res.bands || [];
    FULL = !!res.full;
    HR = !!res.hr;
    render();
  }

  /* Отбор считается на месте: людей восемь десятков, а не тысячи, и
     гонять за каждым нажатием запрос значит ждать сеть ради работы на
     миллисекунду. */
  function visible() {
    const q = search.trim().toLowerCase();
    return ROWS.filter((r) => {
      if (dept && r.dept !== dept) return false;
      if (post && r.post !== post) return false;
      if (!q) return true;
      return [r.name, r.post, r.dept, r.phone, r.ext, r.email]
        .join(" ").toLowerCase().includes(q);
    });
  }

  /* ── дни в компании ──────────────────────────────────────────
     С дня приёма, он сам — первый. Считаем календарными днями, а не
     часами: иначе перевод часов и пояс сдвигали бы счёт на день. У
     уволенного — по день увольнения, если он уже настал. */
  function lastDay(fired) {
    const t = new Date();
    const today = Date.UTC(t.getFullYear(), t.getMonth(), t.getDate());
    const f = /^(\d{4})-(\d{2})-(\d{2})$/.exec(fired || "");
    return f ? Math.min(today, Date.UTC(+f[1], +f[2] - 1, +f[3])) : today;
  }
  const gone = (r) => !!r.fired && lastDay(r.fired) < lastDay("");

  function days(hired, fired) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(hired || "");
    if (!m) return null;
    return Math.floor((lastDay(fired) - Date.UTC(+m[1], +m[2] - 1, +m[3])) / 864e5) + 1;
  }

  /* Календарный стаж, включая день приёма. Месяц заканчивается в последний
     день месяца, если такой даты в нём нет (31 января → 28 февраля). */
  function tenure(hired, fired) {
    const [y, mo, d] = hired.split("-").map(Number);
    const last = lastDay(fired);
    const now = new Date(last);
    const end = last + 864e5;
    const anchor = (n) => {
      const yy = y + Math.floor((mo - 1 + n) / 12);
      const mm = (mo - 1 + n) % 12;
      return Date.UTC(yy, mm, Math.min(d, new Date(Date.UTC(yy, mm + 1, 0)).getUTCDate()));
    };
    let months = Math.max(0, (now.getUTCFullYear() - y) * 12 + now.getUTCMonth() + 1 - mo);
    while (months && anchor(months) > end) months--;
    const rest = Math.max(0, Math.round((end - anchor(months)) / 864e5));
    const yrs = Math.floor(months / 12);
    months %= 12;
    return [yrs ? `${yrs} ${plural(yrs, "год", "года", "лет")}` : "",
      months ? `${months} ${plural(months, "месяц", "месяца", "месяцев")}` : "",
      rest ? `${rest} ${plural(rest, "день", "дня", "дней")}` : ""].filter(Boolean).join(" ") || "0 дней";
  }

  function daysHtml(r) {
    const n = days(r.hired, r.fired);
    if (n === null) return `<span class="dim">—</span>`;
    if (n < 1) return `<span class="dim" title="Выходит ${fmtD(r.hired)}">с ${
      fmtD(r.hired).slice(0, 5)}</span>`;
    const was = gone(r);
    return `<span${was ? ' class="dim"' : ""} title="С ${fmtD(r.hired)}${
      was ? ` по ${fmtD(r.fired)}` : ""} — ${n.toLocaleString("ru-RU")} ${
      plural(n, "день", "дня", "дней")}">${tenure(r.hired, r.fired)}</span>`;
  }

  /* ── участок ──────────────────────────────────────────────────
     У сотрудника производства (правка № 4, 22.10.2026). Тот же участок,
     что назначают в «Эффективности»: у человека он один. */
  const isProd = (d) => /^производ/i.test(String(d || "").trim());
  function bandPick(r) {
    if (!isProd(r.dept)) return "";
    const list = r.band && !BANDS.includes(r.band) ? [r.band, ...BANDS] : BANDS;
    return `<select class="pos-in stf-band" data-band title="Участок — тот же, что в «Эффективности»">
      <option value="">не выбран</option>
      ${list.map((b) => `<option value="${esc(b)}"${r.band === b ? " selected" : ""}>${esc(b)}</option>`).join("")}
    </select>`;
  }
  const deptText = (r) => esc(r.dept) + (r.band && isProd(r.dept)
    ? ` <span class="stf-band-t">· уч. ${esc(r.band)}</span>` : "");

  /* ── связь ────────────────────────────────────────────────────
     Телефон и почта для всех — ссылками: с телефона список и открывают,
     чтобы позвонить. Номеров в клетке бывает два — звоним на первый. */
  function telHref(phone) {
    const d = String(phone || "").split(/[,;]/)[0].replace(/[^\d+]/g, "");
    return d.replace(/\D/g, "").length >= 5 ? "tel:" + d : "";
  }
  const telHtml = (phone) => (telHref(phone)
    ? `<a class="stf-lnk" href="${esc(telHref(phone))}">${esc(phone)}</a>` : esc(phone));
  const mailHtml = (mail) => (mail
    ? `<a class="stf-lnk" href="mailto:${esc(mail)}">${esc(mail)}</a>` : "");

  /* ── лицо ─────────────────────────────────────────────────────
     Фото есть — по нажатию карточка с крупным фото. Нет — у полного
     доступа нажатие сразу открывает выбор файла: штат заводят фото за
     фото, и лишнее окно на каждого было бы восемьюдесятью лишними
     окнами. Без фото и без права — просто буквы. */
  function face(r) {
    const url = photoUrl(r);
    const inner = url ? `<img src="${esc(url)}" alt="" loading="lazy">`
      : `<span>${esc(inits(r.name))}</span>`;
    if (!url && !can()) return `<span class="stf-av">${inner}</span>`;
    return `<button type="button" class="stf-av${url ? "" : " add"}" data-av
      title="${url ? "Крупнее" : "Загрузить фото"}">${inner}${url ? "" : ICO.cam}</button>`;
  }

  function pick(id, label, list, value) {
    return `<select class="role-sel" id="${id}"${list.length ? "" : " disabled"}>
      <option value="">${esc(label)}</option>
      ${list.map((v) => `<option value="${esc(v)}"${
        value === v ? " selected" : ""}>${esc(v)}</option>`).join("")}
    </select>`;
  }

  /* Шапка строится один раз за отрисовку раздела, тело — на каждый
     набранный знак. Поле, в котором печатают, пересоздавать нельзя:
     курсор улетит в начало на второй букве. */
  function render() {
    const host = $t("#sec-stf");
    if (!host) return;
    host.innerHTML = `
      <div class="pg">
        <div class="pg-head">
          <div class="pg-count" id="stfCount"></div>
          <div class="pg-tools">
            <label class="pg-find">${ICO.find}
              <input id="stfSearch" placeholder="Фамилия, должность, телефон"
                     value="${esc(search)}"></label>
            ${pick("stfDept", "Все отделы", DEPTS, dept)}
            ${pick("stfPost", "Все должности", POSTS, post)}
            ${can() ? `${HR ? `
              <label class="btn-ghost wrk-pick" for="stfFile">${ICO.up}
                Загрузить книгу</label>
              <input type="file" id="stfFile" accept=".xlsx,.xlsm" hidden>` : ""}
              <input type="file" id="stfPhoto" accept="image/*" hidden>
              <button type="button" class="btn-brand" id="stfNew">${
                ICO.plus}Добавить</button>` : ""}
          </div>
        </div>
        <div class="pg-body" id="stfBody"></div>
        <div class="pg-note" id="stfNote" hidden></div>
      </div>`;
    wireHead(host);
    paint();
  }

  /* Уволенные (правка № 3, 22.10.2026) — внизу списка, свёрнутой
     группой: в штате их видно, но рабочий список они не загромождают.
     Раскрыта ли группа — помним в браузере. Без полного доступа их нет
     вовсе: сервер их не отдаёт. */
  const GONE_KEY = "karkas.stf.gone.v1";
  let goneOpen = (() => {
    try { return localStorage.getItem(GONE_KEY) === "1"; } catch (e) { return false; }
  })();

  function paint() {
    const body = $t("#stfBody");
    if (!body) return;
    peekHide();
    const all = visible();
    const rows = all.filter((r) => !gone(r)), out = all.filter(gone);
    const live = ROWS.filter((r) => !gone(r)).length;
    $t("#stfCount").innerHTML = (all.length === ROWS.length
      ? `<b>${live}</b> ${plural(live, "сотрудник", "сотрудника", "сотрудников")}`
      : `<b>${rows.length}</b> из ${live}`) + (out.length
      ? ` <span class="dim">· уволено ${out.length}</span>` : "");

    body.innerHTML = all.length ? (can() ? fullTable(rows, out) : openTable(rows))
      : `<div class="pg-empty"><b>${ROWS.length
          ? "Никого не нашлось" : "Справочник пуст"}</b>${ROWS.length
          ? "Попробуйте другое написание или снимите фильтры."
          : can() ? "Загрузите книгу из отдела персонала — колонки «ФИО»,"
            + " «Должность», «Отдел», «Дата рождения», «Дата приёма», «Телефон»"
            + " и «E-mail». Порядок колонок значения не имеет."
          : "Штат заводит администратор справочника."}</div>`;
    // Ширины колонок тянут мышью, ФИО примерзает слева (правка № 23,
    // 22.10.2026) — как в прайсах (grid.js). Двойной щелчок по границе —
    // ширины по умолчанию.
    const table = $t("table.stf-tbl", body);
    if (table && typeof GRID === "object") {
      const W = can() ? fullW() : OPENW;
      W.wire(table, table.tHead && table.tHead.rows[0], paint);
      GRID.pan(body);
      GRID.freeze(table, 1);
    }
    wireBody(body);
  }

  /* Колонки — по порядку: [ключ, ширина по умолчанию в пикселях]. ФИО —
     своей шириной, а не остатком: с колонкой второй почты остаток ужался
     до кружка с инициалами. */
  // ext — внутренний телефон (правка № 51, 26.10.2026), справа от телефона.
  const OPEN_COLS = [["name", 260], ["post", 220], ["dept", 160], ["phone", 150], ["ext", 104], ["email", 210],
    ["email2", 210]];
  const FULL_COLS = [["name", 240], ["post", 170], ["dept", 130], ["band", 120], ["phone", 128], ["ext", 96], ["email", 190],
    ["email2", 190], ["born", 112], ["hired", 112], ["fired", 112], ["days", 92], ["acts", 47]];
  const sumW = (list) => list.reduce((a, [, w]) => a + w, 0);
  // Без кадровых дат — те же колонки без дат и стажа, со своими ширинами.
  const HR_COLS = new Set(["born", "hired", "fired", "days"]);
  const FULL_NOHR = FULL_COLS.filter(([k]) => !HR_COLS.has(k));
  const OPENW = typeof GRID === "object" ? GRID.widths("karkas.stf.open.colw.v1", () => OPEN_COLS) : null;
  const FULLW = typeof GRID === "object" ? GRID.widths("karkas.stf.full.colw.v1", () => FULL_COLS) : null;
  const NOHRW = typeof GRID === "object" ? GRID.widths("karkas.stf.nohr.colw.v1", () => FULL_NOHR) : null;
  const fullW = () => (HR ? FULLW : NOHRW);
  const fullCols = () => (HR ? FULL_COLS : FULL_NOHR);
  const grip = (W) => (W ? W.grip() : "");
  const cols = (W, fallback) => (W ? W.colgroup() : fallback);

  /* Для всех — то, что открыто всем, текстом и ссылками. */
  function openTable(rows) {
    return `
      <table class="tbl stf-tbl stf-open" style="${OPENW ? OPENW.style(sumW(OPEN_COLS)) : "--tbl-min:" + sumW(OPEN_COLS) + "px"}">
        <colgroup>${cols(OPENW, `<col><col style="width:21%"><col style="width:15%">
          <col style="width:150px"><col style="width:104px"><col style="width:18%"><col style="width:16%">`)}</colgroup>
        <thead><tr><th class="s-name">ФИО${grip(OPENW)}</th><th>Должность${grip(OPENW)}</th><th>Отдел${grip(OPENW)}</th>
          <th>Телефон${grip(OPENW)}</th><th title="Внутренний телефон">Внутр. тел.${grip(OPENW)}</th><th>E-mail${grip(OPENW)}</th>
          <th title="Вторая почта сотрудника">E-mail 2${grip(OPENW)}</th></tr></thead>
        <tbody>${rows.map((r) => `
          <tr data-id="${esc(r.id)}">
            <td class="s-name"><div class="stf-who">${face(r)}<span
              class="t-name">${esc(r.name)}</span></div></td>
            <td class="s-post">${esc(r.post)}</td>
            <td class="s-dept">${deptText(r)}</td>
            <td class="s-phone">${telHtml(r.phone)}</td>
            <td class="s-ext">${esc(r.ext || "")}</td>
            <td class="s-mail">${mailHtml(r.email)}</td>
            <td class="s-mail">${mailHtml(r.email2)}</td>
          </tr>`).join("")}</tbody>
      </table>`;
  }

  /* Полный доступ — все поля, правка на месте. */
  function fullTable(rows, out = []) {
    const W = fullW(), C = fullCols();
    return `
      <table class="tbl stf-tbl" style="${W ? W.style(sumW(C)) : "--tbl-min:" + sumW(C) + "px"}">
        <colgroup>${cols(W, C.map(([, w], i) => (i ? `<col style="width:${w}px">` : "<col>")).join(""))}</colgroup>
        <thead><tr><th class="s-name">ФИО${grip(W)}</th><th>Должность${grip(W)}</th><th>Отдел${grip(W)}</th>
          <th title="У сотрудников производства — тот же участок, что в «Эффективности»">Участок${grip(W)}</th>
          <th>Телефон${grip(W)}</th><th title="Внутренний телефон">Внутр. тел.${grip(W)}</th><th>E-mail${grip(W)}</th>
          <th title="Вторая почта сотрудника">E-mail 2${grip(W)}</th>${HR ? `<th>Дата рождения${grip(W)}</th>
          <th>Принят${grip(W)}</th>
          <th title="Дата увольнения">Уволен${grip(W)}</th>
          <th class="num" title="Дней в компании, считая день приёма">В компании${grip(W)}</th>` : ""}
          <th></th>
        </tr></thead>
        <tbody>${rows.map((r) => fullRow(r)).join("")}${out.length ? `
          <tr class="stf-gone-head"><td colspan="${C.length}"><button type="button" class="stf-gone-btn"
            data-gone-toggle aria-expanded="${goneOpen}">${ICO.chev}Уволенные <b>${out.length}</b></button></td></tr>
          ${out.map((r) => fullRow(r, !goneOpen)).join("")}` : ""}</tbody>
      </table>`;
  }

  function fullRow(r, hidden) {
    return `
          <tr data-id="${esc(r.id)}"${gone(r) ? ' class="stf-gone"' : ""}${hidden ? " hidden" : ""}>
            <td class="s-name"><div class="stf-who">${face(r)}${cell(r, "name")}</div></td>
            <td class="s-post">${cell(r, "post")}</td>
            <td class="s-dept">${cell(r, "dept")}</td>
            <td class="s-band">${bandPick(r)}</td>
            <td class="s-phone">${cell(r, "phone", "tel")}</td>
            <td class="s-ext">${cell(r, "ext", "tel")}</td>
            <td class="s-mail">${cell(r, "email", "", "email")}</td>
            <td class="s-mail">${cell(r, "email2", "", "email")}</td>${HR ? `
            <td class="s-born">${cell(r, "born", "date")}</td>
            <td class="s-hired">${cell(r, "hired", "date")}</td>
            <td class="s-fired">${cell(r, "fired", "date")}</td>
            <td class="s-days num">${daysHtml(r)}</td>` : ""}
            <td class="acts"><button type="button"
              class="lnk warn" data-rm title="Убрать из справочника"
              >×</button></td>
          </tr>`;
  }

  /* Дата — обычным полем даты: календарь браузера бережёт от «31.02» и
     от трёх разных написаний одного числа. Почта — текстом с почтовой
     клавиатурой, а не type="email": тот отдаёт домен на кириллице
     пуникодом, и кириллический домен записался бы как «xn--…». */
  function cell(r, field, kind, mode) {
    return `<input class="pos-in" data-f="${field}"${
      kind ? ` type="${kind}"` : ""}${mode ? ` inputmode="${mode}"` : ""}
      value="${esc(r[field] || "")}">`;
  }

  /* Проставили дату увольнения, а учётка сотрудника в платформе действует
     (правка № 31, 23.10.2026): Dev Admin блокирует сразу, остальным — что
     администраторам ушло напоминание. */
  async function blockAsk(b, r) {
    const names = b.users.map((u) => `«${u.username}»`).join(", ");
    const one = b.users.length === 1;
    const head = `${r.name}: дата увольнения — ${fmtD(b.fired)}. ${one ? "Учётка" : "Учётки"} ${names} в платформе ${
      one ? "действует" : "действуют"}.`;
    if (!b.can) {
      await ASK.alert(`${head} Администраторам ушло напоминание ${one ? "заблокировать её" : "заблокировать их"}.`,
        { title: "Учётка уволенного" });
      return;
    }
    if (!(await ASK.confirm(`${head} Заблокировать сейчас? Войти будет нельзя, открытые сессии закроются.`,
      { title: "Учётка уволенного", ok: "Заблокировать", danger: true }))) return;
    try {
      for (const u of b.users) await AUTH.api("PATCH", "/users/" + encodeURIComponent(u.id), { is_blocked: true });
      note(`${one ? "Учётка" : "Учётки"} ${names} ${one ? "заблокирована" : "заблокированы"}`);
    } catch (e) {
      note("Не заблокировалось: " + e.message, true);
    }
  }

  function note(text, bad) {
    const box = $t("#stfNote");
    if (!box) return;
    box.textContent = text;
    box.classList.toggle("bad", !!bad);
    box.hidden = false;
  }

  function wireHead(host) {
    $t("#stfSearch", host).addEventListener("input", (e) => {
      search = e.target.value;
      paint();
    });
    for (const [id, set] of [["#stfDept", (v) => { dept = v; }],
                             ["#stfPost", (v) => { post = v; }]]) {
      const sel = $t(id, host);
      const on = (e) => { set(e.target.value); paint(); };
      sel.addEventListener("change", on);
      sel.addEventListener("input", on);
    }
    if (!can()) return;

    $t("#stfNew", host).addEventListener("click", async () => {
      try {
        const made = await AUTH.api("POST", "/staff", { name: "Новый сотрудник" });
        ROWS.unshift(made);
        search = ""; dept = ""; post = "";
        render();
        // Курсор сразу в имя: строку завели, чтобы её назвать.
        const inp = $t(`tr[data-id="${made.id}"] [data-f="name"]`);
        if (inp) { inp.focus(); inp.select(); }
      } catch (e) {
        note("Не вышло: " + e.message, true);
      }
    });

    if ($t("#stfFile", host)) $t("#stfFile", host).addEventListener("change", (e) => {
      const f = e.target.files && e.target.files[0];
      e.target.value = "";
      if (f) upload(f);
    });

    $t("#stfPhoto", host).addEventListener("change", (e) => {
      const f = e.target.files && e.target.files[0];
      const id = photoFor;
      e.target.value = "";
      if (!f || !id) return;
      PROFILE.crop(f, { size: PHOTO_SIZE, done: (data) => savePhoto(id, data),
                        fail: (text) => note(text, true) });
    });
  }

  function wireBody(body) {
    body.querySelectorAll("[data-av]").forEach((b) => {
      const id = b.closest("tr").dataset.id;
      b.addEventListener("click", () => {
        const r = rowOf(id);
        if (!r) return;
        if (r.photo) openCard(r);
        else if (can()) pickPhoto(id);
      });
      b.addEventListener("mouseenter", () => {
        const r = rowOf(id);
        if (r && r.photo) peekShow(b, photoUrl(r));
      });
      b.addEventListener("mouseleave", peekHide);
    });
    /* Фото не пришло (сеанс истёк, файл убрали с другой вкладки) —
       буквы вместо значка битой картинки. */
    body.querySelectorAll(".stf-av img").forEach((img) => {
      img.addEventListener("error", () => {
        const r = rowOf(img.closest("tr").dataset.id) || {};
        const s = document.createElement("span");
        s.textContent = inits(r.name);
        img.replaceWith(s);
      });
    });
    body.addEventListener("scroll", peekHide, { passive: true });

    body.querySelectorAll("input.pos-in").forEach((inp) => {
      const tr = inp.closest("tr");
      inp.addEventListener("change", async () => {
        if (inp.value === inp.dataset.last) return;
        inp.dataset.last = inp.value;
        inp.classList.remove("bad");
        inp.title = "";
        try {
          const upd = await AUTH.api("PATCH", "/staff/" + tr.dataset.id,
                                     { [inp.dataset.f]: inp.value });
          const r = Object.assign(rowOf(upd.id) || {}, upd);
          // Дни в компании считаются от дат приёма и увольнения — сразу и
          // пересчитываем; отдел «Производство» открывает выбор участка.
          if (inp.dataset.f === "hired" || inp.dataset.f === "fired") {
            const td = $t(".s-days", tr);
            if (td) td.innerHTML = daysHtml(r);
            tr.classList.toggle("stf-gone", gone(r));
          }
          if (inp.dataset.f === "dept" || inp.dataset.f === "name") {
            const td = $t(".s-band", tr);
            if (td) { td.innerHTML = bandPick(r); wireBand(td); }
          }
          if (upd.block) blockAsk(upd.block, r);
        } catch (e) {
          inp.classList.add("bad");
          inp.title = String(e.message);
          note(String(e.message), true);
        }
      });
      inp.addEventListener("keydown", (e) => {
        if (e.key === "Enter") { e.preventDefault(); inp.blur(); }
      });
    });
    wireBand(body);
    const gt = body.querySelector("[data-gone-toggle]");
    if (gt) {
      gt.addEventListener("click", () => {
        goneOpen = !goneOpen;
        try { localStorage.setItem(GONE_KEY, goneOpen ? "1" : "0"); } catch (e) { /* без памяти */ }
        paint();
      });
    }
    body.querySelectorAll("[data-rm]").forEach((b) => {
      b.addEventListener("click", async () => {
        const tr = b.closest("tr");
        const r = rowOf(tr.dataset.id) || {};
        if (!(await ASK.confirm(`Убрать «${r.name}» из справочника?`))) return;
        try {
          await AUTH.api("DELETE", "/staff/" + tr.dataset.id);
          ROWS = ROWS.filter((x) => x.id !== tr.dataset.id);
          paint();
        } catch (e) {
          note("Не вышло: " + e.message, true);
        }
      });
    });
  }

  function wireBand(host) {
    host.querySelectorAll("[data-band]").forEach((sel) => {
      sel.addEventListener("change", async () => {
        const tr = sel.closest("tr");
        sel.classList.remove("bad");
        try {
          const upd = await AUTH.api("PATCH", "/staff/" + tr.dataset.id, { band: sel.value });
          Object.assign(rowOf(upd.id) || {}, upd);
        } catch (e) {
          sel.classList.add("bad");
          note(String(e.message), true);
        }
      });
    });
  }

  /* ── фото ─────────────────────────────────────────────────────
     Файл → то же окно кадрирования, что у аватара в профиле → квадрат
     на сервер. */
  let photoFor = "";
  function pickPhoto(id) {
    const inp = $t("#stfPhoto");
    if (!inp) return;
    photoFor = id;
    inp.click();
  }

  async function savePhoto(id, data) {
    try {
      const r = await AUTH.api("PUT", `/staff/${encodeURIComponent(id)}/photo`, { data });
      setPhoto(id, r.photo);
    } catch (e) {
      note("Фото не сохранилось: " + e.message, true);
    }
  }

  async function dropPhoto(id) {
    const r = rowOf(id) || {};
    if (!(await ASK.confirm(`Убрать фото «${r.name}»?`))) return;
    try {
      await AUTH.api("DELETE", `/staff/${encodeURIComponent(id)}/photo`);
      setPhoto(id, "");
    } catch (e) {
      note("Не вышло: " + e.message, true);
    }
  }

  function setPhoto(id, tag) {
    const r = rowOf(id);
    if (!r) return;
    r.photo = tag;
    paint();
    if (card && card.id === id) {
      if (tag) openCard(r); else closeCard();
    }
  }

  /* Наведение на лицо — оно же крупнее, рядом со строкой: узнавать людей
     в лицо, пробегая список мышью, а не щёлкая каждого. Только там, где
     есть наведение; на телефоне — карточка по нажатию. */
  const HOVER = typeof matchMedia === "function"
    && matchMedia("(hover: hover) and (pointer: fine)").matches;
  let peek = null;
  let peekTimer = 0;
  function peekShow(anchor, url) {
    if (!HOVER) return;
    clearTimeout(peekTimer);
    peekTimer = setTimeout(() => {
      if (!peek) {
        peek = document.createElement("div");
        peek.className = "stf-peek";
        document.body.appendChild(peek);
      }
      peek.innerHTML = `<img src="${esc(url)}" alt="">`;
      const a = anchor.getBoundingClientRect();
      const size = 176;
      peek.style.left = `${Math.round(a.right + 12)}px`;
      peek.style.top = `${Math.round(Math.max(8, Math.min(innerHeight - size - 8,
        a.top + a.height / 2 - size / 2)))}px`;
      peek.hidden = false;
    }, 120);
  }
  function peekHide() {
    clearTimeout(peekTimer);
    if (peek) peek.hidden = true;
  }

  /* Карточка: крупное фото и связь. Полному доступу — ещё дни в компании,
     день рождения и кнопки фото. */
  let card = null;
  function closeCard() {
    if (!card) return;
    document.removeEventListener("keydown", card.onKey);
    card.box.remove();
    card = null;
  }

  function openCard(r) {
    closeCard();
    peekHide();
    const url = photoUrl(r);
    const n = can() ? days(r.hired, r.fired) : null;
    const box = document.createElement("div");
    box.className = "pf-modal stf-modal";
    box.innerHTML = `
      <div class="pf-crop stf-card" role="dialog" aria-label="${esc(r.name)}">
        <div class="stf-big">${url ? `<img src="${esc(url)}" alt="">`
          : `<span>${esc(inits(r.name))}</span>`}</div>
        <b class="stf-card-name">${esc(r.name)}</b>
        ${r.post || r.dept ? `<span class="stf-card-sub">${
          esc([r.post, r.dept, r.band && isProd(r.dept) ? "уч. " + r.band : ""].filter(Boolean).join(" · "))}</span>` : ""}
        <dl class="stf-card-dl">
          ${r.phone ? `<dt>Телефон</dt><dd>${telHtml(r.phone)}</dd>` : ""}
          ${r.ext ? `<dt>Внутренний</dt><dd>${esc(r.ext)}</dd>` : ""}
          ${r.email ? `<dt>E-mail</dt><dd>${mailHtml(r.email)}</dd>` : ""}
          ${r.email2 ? `<dt>E-mail 2</dt><dd>${mailHtml(r.email2)}</dd>` : ""}
          ${n !== null && n > 0 ? `<dt>В компании</dt><dd>${tenure(r.hired, r.fired)} · с ${fmtD(r.hired)}${
            gone(r) ? ` по ${fmtD(r.fired)}` : ""}</dd>` : ""}
          ${can() && r.fired && !gone(r) ? `<dt>Увольняется</dt><dd>${fmtD(r.fired)}</dd>` : ""}
          ${can() && r.born ? `<dt>Дата рождения</dt><dd>${fmtD(r.born)}</dd>` : ""}
        </dl>
        <div class="pf-modal-foot">
          ${can() ? `<button type="button" class="btn ghost" data-card="pick">${
            url ? "Заменить фото" : "Загрузить фото"}</button>
            ${url ? `<button type="button" class="btn ghost" data-card="drop">Убрать</button>` : ""}`
            : ""}
          <button type="button" class="btn" data-card="close">Закрыть</button>
        </div>
      </div>`;
    document.body.appendChild(box);
    const onKey = (e) => { if (e.key === "Escape") closeCard(); };
    document.addEventListener("keydown", onKey);
    card = { id: r.id, box, onKey };
    box.addEventListener("click", (e) => { if (e.target === box) closeCard(); });
    box.querySelectorAll("[data-card]").forEach((b) => b.addEventListener("click", () => {
      const act = b.dataset.card;
      if (act === "close") closeCard();
      else if (act === "pick") pickPhoto(r.id);
      else if (act === "drop") dropPhoto(r.id);
    }));
    $t('[data-card="close"]', box).focus();
  }

  /* Загрузка книги. Идёт мимо AUTH.api: там json, а здесь файл целиком.
     Отчёт числами, а не «готово»: человек должен видеть, что из восьмидесяти
     строк сорок обновились, а не гадать, изменилось ли что-нибудь. */
  function upload(file) {
    note("Читаю книгу…");
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/staff/import");
    xhr.setRequestHeader("Authorization", "Bearer " + AUTH.token());
    xhr.setRequestHeader("Content-Type", "application/octet-stream");
    xhr.addEventListener("load", async () => {
      if (xhr.status < 200 || xhr.status >= 300) {
        let msg = "Не удалось загрузить";
        try { msg = JSON.parse(xhr.responseText).error || msg; } catch (e) {}
        note(msg, true);
        return;
      }
      const r = JSON.parse(xhr.responseText);
      await load();
      note(`Добавлено ${r.added}, обновлено ${r.updated}, без изменений ${
        r.same}` + (r.skipped ? `. Пропущено строк без ФИО: ${r.skipped}` : ""));
    });
    xhr.addEventListener("error", () => note("Сеть оборвалась", true));
    xhr.send(file);
  }

  return { load, render };
})();
