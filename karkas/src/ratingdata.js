/* «Данные рейтинга» · Эффективность (заказчик, 29.09.2026).

   Битрикса в платформе больше нет. Задачи приходят таблицами, которые
   загружают сами; дальше компания хочет записывать всё сразу в платформе.
   Окно показывает, из чего собран рейтинг, и даёт его пополнить:

     Задачи — таблицы двух видов:
       список задач — строка = задача (ответственный, срок, выполнено);
       отчёт по сотрудникам за месяц — строка = человек со счётчиками,
         как отчёт Битрикса «Эффективность», который админ заказчика
         загружает раз в две недели. Дат в нём нет — месяц выбирают при
         загрузке; новый отчёт за тот же месяц заменяет прежний (отчёт «с
         начала месяца»), отчёт за другие дни того же месяца добавляют
         отдельно.
       Разметка столбцов запоминается: второй раз размечать не нужно.
     Цикл по месяцам — какие месяцы таблицы цикла сохранены и какие уже
       закрыты (прошедший месяц досдают до 5-го числа, потом он не
       пересчитывается).
     Смены ведущих — сборщик сам замечает, что у объекта сменился первый
       мастер, и пишет дату: пункты со сроком до неё остаются за прежним.
       Дату можно поправить, если сменили раньше, чем заметили.

   Рейтинг из этого собирает build_obligations.py раз в минуту; окно
   сообщает о переменах через hooks.changed, и «Эффективность» подтягивает
   пересобранный файл сама.

   Вид окна (30.09.2026: «меньше текстов, пояснения — в значки i, и не
   плоской плашкой»):
     — размер постоянный: вкладки не дёргают окно по высоте;
     — пояснения — в значках ⓘ: по наведению, на телефоне — по нажатию;
     — загрузка — полем «перетащите файл», файл можно бросить и на всё
       окно; пока таблиц нет, это же поле — крупно, во всё окно;
     — таблица — строкой: нажатие открывает её строки, «новая версия» и
       «убрать» — значками справа; «убрать» переспрашивает в самой
       строке, без системного окна;
     — вложенные виды (загрузка, строки) встают на место вкладок строкой
       «← назад», кнопки загрузки — внизу окна и с прокруткой не уезжают;
     — разметка столбцов — строками «поле ← столбец» с первыми значениями
       столбца: верно ли узнан, видно сразу. Образец файла и строка
       заголовков свёрнуты ниже — нужны, только если узнано неверно. */
const RATINGDATA = (() => {
  "use strict";

  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const plur = (n, one, few, many) => {
    const a = n % 10, b = n % 100;
    return a === 1 && b !== 11 ? one : a >= 2 && a <= 4 && (b < 12 || b > 14) ? few : many;
  };
  const cnt = (n, one, few, many) => `${n} ${plur(n, one, few, many)}`;
  const p2 = (n) => String(n).padStart(2, "0");
  // «2026-09-10» → «10.09.2026»
  const day = (iso) => (iso && iso.length >= 10 ? `${iso.slice(8, 10)}.${iso.slice(5, 7)}.${iso.slice(0, 4)}` : "");
  // «2026-09-10» → «10.09»
  const dm = (iso) => day(iso).slice(0, 5);
  // метка времени сервера → «29.09 14:05»
  const stamp = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    if (isNaN(d)) return "";
    return `${p2(d.getDate())}.${p2(d.getMonth() + 1)} ${p2(d.getHours())}:${p2(d.getMinutes())}`;
  };
  const todayIso = () => {
    const d = new Date();
    return `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`;
  };
  const MON = ["январь", "февраль", "март", "апрель", "май", "июнь", "июль", "август",
    "сентябрь", "октябрь", "ноябрь", "декабрь"];
  // «2026-09» → «сентябрь 2026»
  const monName = (m) => {
    const [y, mm] = String(m || "").split("-").map(Number);
    return y && mm ? `${MON[mm - 1]} ${y}` : "";
  };
  const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : "");
  const curMonth = () => todayIso().slice(0, 7);
  const pctOf = (ok, n) => (n ? Math.round(ok / n * 100) + "%" : "—");
  // Цвет процента — как у строки свода: без просрочек зелёный, от 80% жёлтый.
  const pctCls = (ok, n, over) => (!over ? "ok" : n && ok / n >= 0.8 ? "late" : "over");
  const FILE_RX = /\.(xlsx|xlsm|csv)$/i;

  const svg = (d) => `<svg viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
  const IC = {
    info: svg('<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5M12 7.9v.1"/>'),
    up: svg('<path d="M12 15V4.5M7.5 9 12 4.5 16.5 9"/><path d="M4.5 14.5v3A2.5 2.5 0 0 0 7 20h10a2.5 2.5 0 0 0 2.5-2.5v-3"/>'),
    back: svg('<path d="M14.5 5.5 8 12l6.5 6.5"/>'),
    x: svg('<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>'),
    again: svg('<path d="M19 12a7 7 0 1 1-2.05-4.95"/><path d="M19.2 4.6v4.6h-4.6"/>'),
    del: svg('<path d="M4.5 7h15M9.5 7V5.5A1.5 1.5 0 0 1 11 4h2a1.5 1.5 0 0 1 1.5 1.5V7M6.5 7l.8 11.2A2 2 0 0 0 9.3 20h5.4a2 2 0 0 0 2-1.8L17.5 7"/>'),
    chev: svg('<path d="M9.5 6l6 6-6 6"/>'),
    sum: svg('<path d="M4.5 19.5h15"/><path d="M7.5 16v-4.5M12 16V7.5M16.5 16v-6.5"/>'),
    list: svg('<path d="M9.5 7h9M9.5 12h9M9.5 17h9"/><path d="M5.5 7h.01M5.5 12h.01M5.5 17h.01"/>'),
    ok: svg('<path d="M5 12.5l4.5 4.5L19 7.5"/>'),
    warn: svg('<path d="M12 4.5 3.5 19h17z"/><path d="M12 10v4M12 16.4v.1"/>'),
  };

  // Значок ⓘ: пояснение по наведению, на телефоне — по нажатию.
  const info = (text, label) => `<button type="button" class="rt-i" data-tip="${esc(text)}"
    aria-label="${esc(label || "Пояснение")}">${IC.info}</button>`;

  /* Пояснения. Раньше они стояли абзацами прямо в окне — и окно читалось
     как инструкция. Теперь на виду только данные, а «почему так» — по
     значку. */
  const TIP = {
    head: "Из чего собран рейтинг «Эффективность»: таблицы задач, месяцы " +
      "таблицы цикла и смены ведущих мастеров. После загрузки рейтинг " +
      "пересобирается в течение минуты.",
    kind: "Отчёт по сотрудникам — строка на человека: задач в работе, " +
      "просрочено… Как отчёт «Эффективность».\nСписок задач — строка на " +
      "задачу: ответственный, срок, когда выполнена.\nВид Трейс узнаёт " +
      "сам — проверьте.",
    month: "Дат в отчёте нет — месяц выбирают здесь. Новый отчёт за тот же " +
      "месяц заменяет прежний: его выгружают «с начала месяца».",
    cols: {
      summary: "Сотрудник — обязательно; адреса почты вместо имени " +
        "пропускаются.\nЗадач в работе — все задачи человека за месяц.\n" +
        "Просрочено — числом или процентом от задач в работе.\nПроцент — как " +
        "в Битриксе: задачи в работе без просроченных, делённые на задачи в " +
        "работе.\nРазметку Трейс запомнит — в следующий раз столбцы " +
        "встанут сами.",
      tasks: "Ответственный — обязательно; если их несколько через запятую, " +
        "задача за первым.\nСрок — без него задача в оценку не идёт.\n" +
        "Выполнена позже срока — «с опозданием». В статусе «да», «выполнено» " +
        "или дата — сделана.\nРазметку Трейс запомнит — в следующий раз " +
        "столбцы встанут сами.",
    },
    months: (g) => "В Google-таблице цикла живут только текущий и следующий " +
      `месяц. Прошедший Трейс хранит сам: до ${g}-го числа следующего ` +
      "месяца его ещё пересчитывает — досдают задним числом, — потом " +
      "закрывает, и правки таблицы его больше не меняют.\nБлок месяца убрали " +
      "из таблицы раньше — месяц закрывается сразу, каким был.",
    lead: "Ведущий мастер объекта — первый в столбце «Мастера» таблицы " +
      "цикла. Сменился — Трейс сам записывает дату смены.",
    since: "Пункты со сроком до этой даты остаются за прежним мастером, " +
      "после — за новым. Сменили раньше, чем заметили, — поправьте дату; " +
      "закрытые месяцы это не пересчитывает.",
  };

  /* Поля разметки по видам таблицы — в порядке важности. */
  const KIND = {
    tasks: {
      fields: ["person", "due", "done_at", "status", "title", "object"],
      label: {
        person: "Ответственный", due: "Срок", done_at: "Дата выполнения",
        status: "Выполнено / статус", title: "Задача", object: "Объект",
      },
      need: ["person"],
    },
    summary: {
      fields: ["person", "total", "overdue", "on_time", "late"],
      label: {
        person: "Сотрудник", total: "Задач в работе", overdue: "Просрочено",
        on_time: "Выполнено в срок", late: "С опозданием", done: "Выполнено",
      },
      need: ["person"],
    },
  };

  let box = null;       // окно
  let data = null;      // ответ /rating/data
  let tab = "sets";
  let hooks = {};
  let wiz = null;       // загрузка: { file, target, pv, kind, maps, period, mode, name, … }
  let rows = null;      // строки набора: { set, rows, filter }
  let busy = false;
  let ask = "";         // какую таблицу просят убрать — «Убрать?» в её строке
  let note = "";        // ошибка над списком: не вышло убрать
  let pickFor = "";     // выбор файла для «новой версии» — id набора
  let back = null;      // куда вернуть фокус после закрытия
  let shownView = "";   // что на экране — при смене вида прокрутка к началу

  /* ── разговор с сервером ─────────────────────────────────── */
  async function send(path, file, hdrs) {
    const headers = {
      "Authorization": "Bearer " + AUTH.token(),
      "Content-Type": "application/octet-stream",
      "X-File-Name": encodeURIComponent(file.name),
    };
    for (const [k, v] of Object.entries(hdrs || {})) {
      if (v !== undefined && v !== null && v !== "") headers["X-Rating-" + k] = encodeURIComponent(String(v));
    }
    let r;
    try {
      r = await fetch("/api" + path, { method: "POST", headers, body: file, cache: "no-store" });
    } catch (e) {
      throw new Error("Нет связи с сервером");
    }
    let out = null;
    try { out = await r.json(); } catch (e) { /* пустой ответ */ }
    if (!r.ok) throw new Error((out && out.error) || `Ошибка ${r.status}`);
    return out;
  }

  const changed = () => { if (typeof hooks.changed === "function") hooks.changed(); };

  async function reload() {
    try {
      data = await AUTH.api("GET", "/rating/data");
    } catch (e) {
      data = null;
      if (box) body().innerHTML = `<div class="band-err">Не загрузилось: ${esc(e.message)}</div>`;
      return;
    }
    paint();
  }

  /* ── окно ────────────────────────────────────────────────── */
  const card = () => box.querySelector(".rt-card");
  const body = () => box.querySelector(".rt-body");

  function open(opts) {
    hooks = opts || {};
    if (box) return;
    tab = "sets"; wiz = null; rows = null; ask = ""; note = ""; shownView = "";
    back = document.activeElement;
    box = document.createElement("div");
    box.className = "pf-modal rt-modal";
    box.innerHTML = `<div class="rt-card" role="dialog" aria-modal="true" aria-labelledby="rtTitle" tabindex="-1">
      <div class="rt-head">
        <h3 id="rtTitle">Данные рейтинга</h3>${info(TIP.head, "Что это за данные")}
        <span class="grow"></span>
        <button type="button" class="rt-x" data-close aria-label="Закрыть" title="Закрыть">${IC.x}</button>
      </div>
      <div class="rt-nav"></div>
      <div class="rt-body"><div class="rt-state"><span class="rt-spin"></span></div></div>
      <div class="rt-foot" hidden></div>
      <input type="file" class="rt-file" accept=".xlsx,.xlsm,.csv" hidden>
    </div>`;
    document.body.appendChild(box);
    document.addEventListener("keydown", onKey);
    const on = { click: onClick, change: onChange, input: onInput, mouseover: onOver, mouseout: onOut,
      focusin: onFocusIn, focusout: onFocusOut, dragover: onDragOver, dragleave: onDragLeave, drop: onDrop };
    for (const [ev, fn] of Object.entries(on)) box.addEventListener(ev, fn);
    // «Первые строки файла» свёрнуты; раскрыли — держим раскрытыми между перерисовками.
    box.addEventListener("toggle", onToggle, true);
    body().addEventListener("scroll", () => hideTip(), { passive: true });
    card().focus({ preventScroll: true });
    reload();
  }

  function close() {
    if (!box) return;
    hideTip();
    document.removeEventListener("keydown", onKey);
    box.remove();
    box = null; wiz = null; rows = null; ask = "";
    if (back && back.isConnected && typeof back.focus === "function") back.focus({ preventScroll: true });
    back = null;
  }

  function paint() {
    if (!box || !data) return;
    hideTip();
    const view = wiz ? "wiz" : rows ? "rows" : tab;
    const ae = document.activeElement;
    const inTabs = !!(ae && ae.closest && ae.closest(".rt-tabs"));
    box.querySelector(".rt-nav").innerHTML = navHTML();
    body().innerHTML = wiz ? wizHTML() : rows ? rowsHTML()
      : tab === "months" ? monthsHTML() : tab === "leads" ? leadsHTML() : setsHTML();
    const f = footHTML(), foot = box.querySelector(".rt-foot");
    foot.innerHTML = f;
    foot.hidden = !f;
    card().dataset.view = view;
    if (view !== shownView) { body().scrollTop = 0; shownView = view; }
    if (inTabs) {
      const b = box.querySelector('.rt-tabs [aria-selected="true"]');
      if (b) b.focus();
    }
  }

  /* Вкладки — или, во вложенном виде, «← назад» и что открыто. */
  function navHTML() {
    const crumb = (attr, title, sub) => `<div class="rt-crumb">
      <button type="button" class="rt-back" ${attr} aria-label="Назад" title="Назад">${IC.back}</button>
      <span class="rt-crumb-t"><b>${esc(title)}</b>${sub ? `<span title="${esc(sub)}">${esc(sub)}</span>` : ""}</span>
    </div>`;
    if (wiz) {
      return crumb("data-wback", wiz.target ? `Новая версия «${wiz.target.name}»` : "Загрузка таблицы", wiz.file.name);
    }
    if (rows) return crumb("data-rback", rows.set.name || "Строки", rowsMeta());
    // На телефоне подписи короче: полные три в 340 пикселей не влезали,
    // и последняя вкладка уезжала за край.
    const tabs = [["sets", "Задачи", "Задачи", data.sets.length],
                  ["months", "Цикл по месяцам", "Цикл", data.months.length],
                  ["leads", "Смены ведущих", "Ведущие", data.leads.length]];
    return `<div class="rt-tabs" role="tablist" aria-label="Данные рейтинга">${tabs.map(([id, t, s, n]) =>
      `<button type="button" role="tab" data-tab="${id}" aria-selected="${tab === id}" aria-label="${t}"
        tabindex="${tab === id ? 0 : -1}"><span class="rt-tl">${t}</span><span class="rt-ts">${s}</span>${
        n ? `<i>${n}</i>` : ""}</button>`).join("")}</div>`;
  }

  /* Кнопки внизу окна — только у загрузки. */
  function footHTML() {
    if (!wiz) return "";
    if (wiz.step === "map") {
      const n = wiz.pv.rows;
      return `<button type="button" class="btn ghost" data-wback>Отмена</button>
        <span class="grow"></span>
        <button type="button" class="btn" data-wgo${ready() ? "" : " disabled"}>Загрузить ${
          cnt(n, "строку", "строки", "строк")}</button>`;
    }
    if (wiz.step === "done") {
      return `<span class="grow"></span>
        <button type="button" class="btn ghost" data-rows="${esc(wiz.res.set.id)}">Открыть строки</button>
        <button type="button" class="btn" data-wdone>Готово</button>`;
    }
    if (wiz.step === "fail") {
      return `<button type="button" class="btn ghost" data-wback>Назад</button>
        <span class="grow"></span>
        <button type="button" class="btn" data-pick="${esc(wiz.target ? wiz.target.id : "")}">Выбрать другой файл</button>`;
    }
    return "";
  }

  const spinner = (t) => `<div class="rt-state"><span class="rt-spin"></span>${t ? `<span>${esc(t)}</span>` : ""}</div>`;

  /* ── таблицы задач ───────────────────────────────────────── */
  const isSum = (s) => s && s.kind === "summary";

  function dropHTML(big) {
    return `<button type="button" class="rt-drop${big ? " big" : ""}" data-pick="">
      <span class="rt-drop-ic">${IC.up}</span>
      <span class="rt-drop-t">
        <b>${big ? "Загрузите отчёт по задачам" : "Загрузить отчёт или таблицу задач"}</b>
        ${big ? `<span>Отчёт «Эффективность» за месяц или список задач</span>` : ""}
        <span class="rt-dnd">Перетащите файл сюда или нажмите · .xlsx, .csv</span>
        <span class="rt-tap">Нажмите, чтобы выбрать файл · .xlsx, .csv</span>
      </span>
      ${big ? `<span class="rt-drop-btn">Выбрать файл</span>` : ""}
    </button>`;
  }

  function setsHTML() {
    const can = data.can_edit;
    const err = note ? `<div class="band-err">${esc(note)}</div>` : "";
    if (!data.sets.length) {
      return err + (can ? dropHTML(true) : `<div class="rt-empty"><b>Таблиц задач пока нет</b>
        <span>Загружают те, у кого есть право «Данные рейтинга».</span></div>`);
    }
    // Отчёты по сотрудникам — свежий месяц сверху, списки задач — за ними.
    const list = data.sets.slice().sort((a, b) => (isSum(b) ? b.period : "").localeCompare(
      isSum(a) ? a.period : "") || a.name.localeCompare(b.name, "ru"));
    return err + (can ? dropHTML(false) : "") + `<div class="rt-list">${list.map(setItem).join("")}</div>` +
      (can ? "" : `<div class="rt-foot-note">Загружают те, у кого есть право «Данные рейтинга».</div>`);
  }

  function setItem(s) {
    const sum = isSum(s), can = data.can_edit;
    const mon = sum ? monName(s.period) : "";
    const meta = sum ? [
      // «Задачи за сентябрь 2026» месяц уже называет — второй раз не пишем
      s.name.toLowerCase().includes(mon) ? "" : "за " + mon,
      cnt(s.rows, "сотрудник", "сотрудника", "сотрудников"),
      cnt(s.sum.total, "задача", "задачи", "задач"),
      s.sum.over ? `просрочено ${s.sum.over}` : "",
    ] : [
      "список задач",
      cnt(s.rows, "задача", "задачи", "задач"),
      cnt(s.people, "человек", "человека", "человек"),
      s.due_from ? `сроки ${dm(s.due_from)} — ${dm(s.due_to)}` : "без сроков",
    ];
    meta.push([s.author, stamp(s.at)].filter(Boolean).join(", "));
    const src = "Файл: " + s.filename + (s.sheet && s.sheet !== "CSV" ? `, лист «${s.sheet}»` : "");
    const val = sum
      ? `<span class="rt-val ${pctCls(s.sum.ok, s.sum.total, s.sum.over)}" title="Задачи без просрочки">${
        pctOf(s.sum.ok, s.sum.total)}</span>`
      : `<span class="rt-val" title="Выполнено из всех">${s.done}<i>/${s.rows}</i></span>`;
    let acts = "";
    if (can && ask === s.id) {
      acts = `<span class="rt-ask">Убрать из рейтинга?</span>
        <button type="button" class="btn sm ghost" data-ask-no>Нет</button>
        <button type="button" class="btn sm danger" data-del="${esc(s.id)}">Убрать</button>`;
    } else if (can) {
      acts = `<button type="button" class="rt-ib" data-pick="${esc(s.id)}" title="Загрузить новую версию файла"
          aria-label="Новая версия «${esc(s.name)}»">${IC.again}</button>
        <button type="button" class="rt-ib warn" data-ask="${esc(s.id)}" title="Убрать из рейтинга"
          aria-label="Убрать «${esc(s.name)}»">${IC.del}</button>`;
    }
    const unk = s.unknown || [];
    const warn = unk.length ? `<div class="rt-item-warn">${IC.warn}<span>Нет в штате: ${esc(unk.slice(0, 3).join(", "))}${
      unk.length > 3 ? ` и ещё ${unk.length - 3}` : ""}</span>${info(`Нет в справочнике штата: ${unk.join(", ")}.\n` +
      "Их задачи считаются, но без отдела — проверьте написание в файле или добавьте людей в штат.",
      "Что это значит")}</div>` : "";
    return `<div class="rt-item${ask === s.id ? " asking" : ""}">
      <button type="button" class="rt-row" data-rows="${esc(s.id)}" title="${esc(src)}">
        <span class="rt-ico${sum ? " sum" : ""}">${sum ? IC.sum : IC.list}</span>
        <span class="rt-txt"><b>${esc(s.name)}</b><span>${esc(meta.filter(Boolean).join(" · "))}</span></span>
        ${val}
      </button>
      ${acts ? `<span class="rt-acts">${acts}</span>` : ""}
      ${warn}
    </div>`;
  }

  async function removeSet(id) {
    if (busy) return;
    busy = true;
    try {
      await AUTH.api("DELETE", "/rating/tables/" + encodeURIComponent(id));
      ask = ""; note = "";
      changed();
      await reload();
    } catch (e) {
      ask = "";
      note = "Не вышло убрать: " + e.message;
      paint();
    } finally {
      busy = false;
    }
  }

  /* ── загрузка: файл → разметка → итог ────────────────────── */
  async function startWizard(file, forId) {
    const target = forId ? data.sets.find((s) => s.id === forId) : null;
    ask = ""; note = ""; rows = null;
    const w = wiz = { file, target, step: "loading", err: "", kindSet: false, nameSet: false, peek: false };
    if (!FILE_RX.test(file.name)) {
      w.step = "fail";
      w.err = "Нужен файл .xlsx или .csv — «" + file.name + "» не подходит.";
      paint();
      return;
    }
    paint();
    try {
      const pv = await send("/rating/tables/preview", file, {});
      if (wiz !== w) return;               // пока читали, окно закрыли или ушли назад
      applyPreview(pv, true);
    } catch (e) {
      if (wiz !== w) return;
      w.step = "fail";
      w.err = e.message;
    }
    paint();
  }

  // Прошлые загрузки этого же файла — последняя сверху.
  const byFile = (name, kind) => data.sets
    .filter((s) => s.filename === name && (s.kind || "tasks") === kind)
    .sort((a, b) => String(b.at).localeCompare(String(a.at)));

  /* Что заменить, если заменять. «Новая версия» у набора — его. Отчёт по
     сотрудникам — отчёт за тот же месяц, как бы ни назывался файл: админ
     выгружает отчёт «с начала месяца» раз в две недели, и второй
     заменяет первый. Список задач — прошлая загрузка того же файла. */
  function replaceTarget() {
    if (wiz.target) return wiz.target;
    if (wiz.kind === "summary") {
      return data.sets.filter((s) => isSum(s) && s.period === wiz.period)
        .sort((a, b) => String(b.at).localeCompare(String(a.at)))[0] || null;
    }
    return byFile(wiz.pv.filename, "tasks")[0] || null;
  }

  function defaultName() {
    const t = wiz.mode === "replace" ? replaceTarget() : null;
    if (t) return t.name;
    if (wiz.kind === "summary") return "Задачи за " + monName(wiz.period);
    return wiz.pv.filename.replace(/\.[^.]+$/, "");
  }

  // Режим и имя по умолчанию — заново при смене вида или месяца, пока
  // человек их не трогал сам.
  function refreshDefaults() {
    wiz.mode = replaceTarget() ? "replace" : "new";
    if (!wiz.nameSet) wiz.name = defaultName();
  }

  function applyPreview(pv, first) {
    wiz.pv = pv;
    wiz.sheet = pv.sheet;
    wiz.header = pv.header_row;
    wiz.step = "map";
    wiz.err = "";
    const cols = pv.columns.length;
    if (first) {
      wiz.kind = wiz.target ? (wiz.target.kind || "tasks") : pv.kind;
      wiz.period = wiz.target && isSum(wiz.target) ? wiz.target.period : curMonth();
    } else if (!wiz.kindSet) {
      wiz.kind = pv.kind;
    }
    /* Разметка прошлого раза для того же файла и вида — если все её
       столбцы на месте и она не спорит с тем, что видно по заголовкам.
       01.10.2026: в отчёт с тем же именем легла неверная разметка
       («Задач в работе» — «Новые», «Просрочено» — «В работе»), и каждая
       новая загрузка подставляла её вместо верно угаданной. Спор — это
       когда поле, узнанное по заголовку, в прошлый раз стояло на другом
       столбце, или прошлое поле занимает столбец, узнанный как другое. */
    const valid = (m) => m && Object.keys(m).length
      && Object.values(m).every((i) => i >= 0 && i < cols) ? m : null;
    const agrees = (m, g) => {
      const taken = new Set(Object.values(g || {}).map(Number));
      return Object.entries(m).every(([f, i]) => (g && g[f] !== undefined)
        ? +g[f] === +i : !taken.has(+i));
    };
    const prev = (kind) => {
      const s = wiz.target && (wiz.target.kind || "tasks") === kind ? wiz.target : byFile(pv.filename, kind)[0];
      const m = first && s && (!s.sheet || s.sheet === pv.sheet) ? valid(s.mapping) : null;
      return m && agrees(m, kind === "summary" ? pv.sum_mapping : pv.mapping) ? m : null;
    };
    // Поля, которых прошлая разметка не знала, — по заголовкам.
    wiz.maps = {
      tasks: Object.assign({}, pv.mapping, prev("tasks") || {}),
      summary: Object.assign({}, pv.sum_mapping, prev("summary") || {}),
    };
    refreshDefaults();
  }

  async function repreview() {
    const w = wiz;
    w.step = "loading";
    paint();
    try {
      const pv = await send("/rating/tables/preview", w.file, { Sheet: w.sheet, Header: w.header });
      if (wiz !== w) return;
      applyPreview(pv, false);
    } catch (e) {
      if (wiz !== w) return;
      w.step = "map";
      w.err = e.message;
    }
    paint();
  }

  const hasCol = (m, f) => m[f] !== undefined && m[f] !== "" && m[f] !== null;

  function ready() {
    const m = wiz.maps[wiz.kind];
    if (!hasCol(m, "person")) return false;
    if (wiz.kind === "summary") return hasCol(m, "total") || hasCol(m, "on_time");
    return true;
  }

  // Месяцы для отчёта: текущий и одиннадцать до него.
  function monthOptions() {
    const out = [];
    let [y, m] = curMonth().split("-").map(Number);
    for (let i = 0; i < 12; i++) {
      out.push(`${y}-${p2(m)}`);
      m -= 1;
      if (!m) { m = 12; y -= 1; }
    }
    if (wiz.period && !out.includes(wiz.period)) out.push(wiz.period);
    return out;
  }

  function wizHTML() {
    const w = wiz;
    if (w.step === "loading") return spinner("Читаю таблицу…");
    if (w.step === "sending") return spinner("Загружаю…");
    if (w.step === "fail") {
      return `<div class="rt-state bad">${IC.warn}<b>Файл не прочитался</b><span>${esc(w.err)}</span></div>`;
    }
    if (w.step === "done") return doneHTML();

    const pv = w.pv;
    const K = KIND[w.kind];
    const map = w.maps[w.kind];
    const mapped = {};
    for (const f of Object.keys(map)) if (hasCol(map, f)) mapped[map[f]] = f;
    const opts = (f) => `<option value="">— нет —</option>` + pv.columns.map((c) =>
      `<option value="${c.idx}"${String(map[f]) === String(c.idx) ? " selected" : ""}>${esc(c.title)}</option>`).join("");
    // Первые значения выбранного столбца — видно, тот ли это столбец.
    const vals = (f) => {
      if (!hasCol(map, f)) return "";
      const i = +map[f];
      const v = pv.sample.map((r) => String(r[i] == null ? "" : r[i]).trim()).filter(Boolean);
      return v.length ? v.slice(0, 4).join(", ") + (v.length > 4 ? ", …" : "") : "в первых строках пусто";
    };

    const warn = [];
    if (w.kind === "tasks") {
      if (!hasCol(map, "due")) warn.push("Столбец срока не выбран — задачи загрузятся, но в оценку не пойдут.");
      else if (!hasCol(map, "done_at") && !hasCol(map, "status")) {
        warn.push("Не выбрано, где отметка о выполнении, — все задачи с прошедшим сроком посчитаются просроченными.");
      }
    } else if (!hasCol(map, "total") && !hasCol(map, "on_time")) {
      warn.push("Не выбран столбец «Задач в работе» — не из чего считать процент.");
    } else if (!hasCol(map, "overdue")) {
      warn.push("Столбец «Просрочено» не выбран — у всех будет 100%.");
    }

    const tgt = replaceTarget();
    const repl = tgt && !w.target ? `<span></span><label class="rt-repl">
        <input type="checkbox" data-w="replace"${w.mode === "replace" ? " checked" : ""}>
        <span>${w.kind === "summary" ? `Заменить отчёт за ${esc(monName(w.period))}` : `Заменить строки таблицы «${esc(tgt.name)}»`}
          <i>${w.kind === "summary" ? `«${esc(tgt.name)}», загружен` : "загружена"} ${esc(stamp(tgt.at))}</i></span>
      </label>` : "";

    const form = `<div class="rt-form">
      <span class="rt-fl">Что в файле${info(TIP.kind, "Какие бывают таблицы")}</span>
      <div class="rt-seg" role="radiogroup" aria-label="Что в файле">${[["summary", "Отчёт по сотрудникам"],
        ["tasks", "Список задач"]].map(([v, t]) => `<label class="${w.kind === v ? "on" : ""}"><input type="radio"
          name="rtKind" value="${v}"${w.kind === v ? " checked" : ""}>${t}</label>`).join("")}</div>
      ${w.kind === "summary" ? `<span class="rt-fl">За месяц${info(TIP.month, "Почему месяц выбирают")}</span>
        <span class="fld rt-fw"><select data-w="period" aria-label="За какой месяц">${monthOptions().map((m) =>
          `<option value="${m}"${m === w.period ? " selected" : ""}>${esc(cap(monName(m)))}</option>`).join("")}</select></span>` : ""}
      ${pv.sheets.length > 1 ? `<span class="rt-fl">Лист</span>
        <span class="fld rt-fw"><select data-w="sheet" aria-label="Лист">${pv.sheets.map((s) =>
          `<option${s === w.sheet ? " selected" : ""}>${esc(s)}</option>`).join("")}</select></span>` : ""}
      <label class="rt-fl" for="rtName">Название</label>
      <span class="fld"><input id="rtName" data-w="name" value="${esc(w.name)}" maxlength="120"></span>
      ${repl}
    </div>`;

    const mapBox = `<div class="rt-sec">
      <div class="rt-sec-h">Столбцы${info(TIP.cols[w.kind], "Что где")}</div>
      <div class="rt-map">${K.fields.map((f) => {
        const on = hasCol(map, f), need = K.need.includes(f);
        const v = vals(f);
        return `<div class="rt-mrow${on ? " on" : need ? " miss" : ""}">
          <span class="rt-mst" aria-hidden="true">${on ? IC.ok : need ? "!" : ""}</span>
          <span class="rt-ml" id="rtL-${f}">${esc(K.label[f])}${need ? "<i>*</i>" : ""}</span>
          <span class="fld"><select data-map="${f}" aria-labelledby="rtL-${f}">${opts(f)}</select></span>
          <span class="rt-mv" title="${esc(v)}">${esc(v)}</span>
        </div>`;
      }).join("")}</div>
    </div>`;

    const where = (w.sheet && w.sheet !== "CSV" ? `лист «${w.sheet}» · ` : "") + `заголовки в строке ${w.header}`;
    const peek = `<details class="rt-peek"${w.peek ? " open" : ""}>
      <summary>${IC.chev}<b>Первые строки файла</b><span>${esc(where)}</span></summary>
      <div class="rt-peek-b">
        <label class="rt-hrow">Заголовки в строке
          <span class="fld"><input type="number" min="1" max="30" data-w="header" value="${esc(w.header)}"></span></label>
        <div class="rt-scroll rt-sample"><table class="rt-tbl">
          <thead><tr>${pv.columns.map((c) => `<th class="${mapped[c.idx] ? "on" : ""}">${mapped[c.idx]
            ? `<span class="rt-chip">${esc(K.label[mapped[c.idx]] || "")}</span>` : ""}${esc(c.title)}</th>`).join("")}</tr></thead>
          <tbody>${pv.sample.map((r) => `<tr>${r.map((v, i) =>
            `<td class="${mapped[i] ? "on" : ""}">${esc(v)}</td>`).join("")}</tr>`).join("")}</tbody>
        </table></div>
      </div>
    </details>`;

    return (w.err ? `<div class="band-err">${esc(w.err)}</div>` : "") + form + mapBox +
      warn.map((t) => `<div class="rt-warn-line">${IC.warn}<span>${esc(t)}</span></div>`).join("") + peek;
  }

  async function doImport() {
    const w = wiz;
    const tgt = w.mode === "replace" ? replaceTarget() : null;
    const mapping = {};
    for (const [f, i] of Object.entries(w.maps[w.kind])) {
      if (i !== "" && i !== undefined && i !== null) mapping[f] = +i;
    }
    w.step = "sending";
    paint();
    try {
      w.res = await send("/rating/tables", w.file, {
        Kind: w.kind, Period: w.kind === "summary" ? w.period : "",
        Map: JSON.stringify(mapping), Sheet: w.sheet, Header: w.header,
        Name: (w.name || "").trim(), Set: tgt ? tgt.id : "",
      });
      w.step = "done";
      changed();
      try { data = await AUTH.api("GET", "/rating/data"); } catch (e) { /* список обновим позже */ }
    } catch (e) {
      w.step = "map";
      w.err = e.message;
    }
    if (wiz === w) paint();
  }

  function doneHTML() {
    const r = wiz.res, s = r.set;
    const notes = [];
    if (r.unknown.length) {
      notes.push(["warn", `Нет в справочнике штата: ${r.unknown.join(", ")} — их задачи считаются, но без отдела; проверьте написание.`]);
    }
    let head, sub;
    if (isSum(s)) {
      head = `Отчёт за ${monName(s.period)} загружен`;
      sub = `${cnt(r.rows, "сотрудник", "сотрудника", "сотрудников")} · ${cnt(s.sum.total, "задача", "задачи", "задач")}` +
        ` · без просрочки ${pctOf(s.sum.ok, s.sum.total)}`;
      if (r.skipped && r.skipped.length) notes.push(["", `Пропущены — не сотрудники: ${r.skipped.join(", ")}.`]);
      if (r.empty) notes.push(["", `Без задач — ${r.empty}: в оценку не идут.`]);
    } else {
      head = `Загружено ${cnt(r.rows, "задача", "задачи", "задач")}`;
      sub = `${cnt(s.people, "человек", "человека", "человек")} · выполнено ${s.done}` +
        (s.due_from ? ` · сроки ${dm(s.due_from)} — ${dm(s.due_to)}` : "");
      if (r.no_due) notes.push(["", `Без срока — ${r.no_due}: такие задачи в оценку не идут.`]);
      if (r.no_person) notes.push(["", `Пропущено строк без ответственного — ${r.no_person}.`]);
    }
    return `<div class="rt-done">
      <span class="rt-done-ic">${IC.ok}</span>
      <b>${esc(head)}</b>
      <span class="rt-done-sub">«${esc(s.name)}» · ${esc(sub)}</span>
      ${notes.length ? `<ul class="rt-notes">${notes.map(([c, t]) => `<li class="${c}">${esc(t)}</li>`).join("")}</ul>` : ""}
      <span class="rt-done-n">Рейтинг пересчитается в течение минуты — «Эффективность» подтянет его сама.</span>
    </div>`;
  }

  /* ── строки набора ───────────────────────────────────────── */
  // Та же мерка, что у сборщика (build_obligations.task_status).
  function verdict(r, today) {
    if (!r.due) return ["na", "без срока"];
    if (r.done_at) return r.done_at <= r.due ? ["ok", "в срок"] : ["late", "с опозданием"];
    if (r.done) return ["ok", "в срок"];
    return r.due < today ? ["over", "просрочена"] : ["wait", "срок не наступил"];
  }

  async function openRows(id) {
    wiz = null; ask = ""; note = "";
    rows = { set: data.sets.find((s) => s.id === id) || { name: "" }, rows: null, filter: "" };
    const mine = rows;
    paint();
    try {
      const out = await AUTH.api("GET", `/rating/tables/${encodeURIComponent(id)}/rows`);
      mine.set = out.set;
      mine.rows = out.rows;
    } catch (e) {
      mine.err = e.message;
    }
    if (rows === mine) paint();
  }

  function rowsMeta() {
    const s = rows.set, n = rows.rows ? rows.rows.length : null;
    return [
      isSum(s) ? "отчёт за " + monName(s.period) : "список задач",
      n === null ? "" : isSum(s) ? cnt(n, "сотрудник", "сотрудника", "сотрудников") : cnt(n, "строка", "строки", "строк"),
      s.filename || "",
    ].filter(Boolean).join(" · ");
  }

  function rowsHTML() {
    if (rows.err) return `<div class="band-err">${esc(rows.err)}</div>`;
    if (!rows.rows) return spinner("");
    const sum = isSum(rows.set);
    const today = todayIso();
    const key = sum ? (r) => (r.over > 0 ? "over" : "ok") : (r) => verdict(r, today)[0];
    const n = {};
    for (const r of rows.rows) { const k = key(r); n[k] = (n[k] || 0) + 1; }
    const filters = sum
      ? [["", "Все"], ["over", "С просрочкой"], ["ok", "Без просрочки"]]
      : [["", "Все"], ["over", "Просрочены"], ["late", "С опозданием"], ["ok", "В срок"],
         ["wait", "Срок не наступил"], ["na", "Без срока"]];
    const chips = `<div class="rt-chips" role="group" aria-label="Какие строки показать">${filters
      .filter(([v]) => !v || n[v] || rows.filter === v)
      .map(([v, t]) => `<button type="button" class="rt-fchip${rows.filter === v ? " on" : ""}" data-rfilter="${v}"
        aria-pressed="${rows.filter === v}">${t}<i>${v ? n[v] || 0 : rows.rows.length}</i></button>`).join("")}</div>`;
    const list = rows.rows.filter((r) => !rows.filter || key(r) === rows.filter);
    const none = list.length ? "" : `<div class="rt-empty">Таких строк нет.</div>`;
    if (sum) {
      return chips + `<table class="rt-tbl rt-rows">
        <thead><tr><th class="hs">Стр.</th><th>Сотрудник</th><th class="r">В работе</th><th class="r">В срок</th>
          <th class="r hs">С опозданием</th><th class="r">Просрочено</th><th class="r">Процент</th></tr></thead>
        <tbody>${list.map((r) => `<tr>
          <td class="num hs">${r.row_no}</td>
          <td>${esc(r.person)}</td>
          <td class="num r">${r.total}</td>
          <td class="num r">${r.ok}</td>
          <td class="num r hs">${r.late || "—"}</td>
          <td class="num r">${r.over || "—"}</td>
          <td class="r"><span class="rt-v ${pctCls(r.ok, r.total, r.over)}">${pctOf(r.ok, r.total)}</span></td>
        </tr>`).join("")}</tbody>
      </table>` + none;
    }
    const shown = list.slice(0, 1000);
    return chips + `<table class="rt-tbl rt-rows">
      <thead><tr><th class="hs">Стр.</th><th>Ответственный</th><th>Задача</th><th>Срок</th>
        <th class="hs">Выполнено</th><th>Оценка</th></tr></thead>
      <tbody>${shown.map((r) => {
        const v = verdict(r, today);
        return `<tr>
          <td class="num hs">${r.row_no}</td>
          <td>${esc(r.person)}</td>
          <td>${esc(r.title)}${r.object ? `<span class="rt-sub">${esc(r.object)}</span>` : ""}</td>
          <td class="num">${day(r.due) || "—"}</td>
          <td class="num hs">${r.done_at ? day(r.done_at) : r.done ? "да" : "—"}</td>
          <td><span class="rt-v ${v[0]}">${v[1]}</span></td>
        </tr>`;
      }).join("")}</tbody>
    </table>` + (list.length > shown.length
      ? `<div class="rt-foot-note">Показаны первые ${shown.length} из ${list.length}.</div>` : "") + none;
  }

  /* ── месяцы цикла ────────────────────────────────────────── */
  function monthsHTML() {
    const grace = (window.DATA && DATA.sources && DATA.sources.reglament
      && DATA.sources.reglament.grace_days) || 5;
    const cur = curMonth();
    if (!data.months.length) {
      return `<div class="rt-empty"><b>Месяцев пока нет</b>
        <span>Появятся с первой пересборкой рейтинга.</span></div>`;
    }
    return `<table class="rt-tbl rt-months">
      <thead><tr><th>Месяц</th><th>Состояние${info(TIP.months(grace), "Как закрываются месяцы")}</th>
        <th class="r">Пересчитан</th></tr></thead>
      <tbody>${data.months.map((m) => `<tr>
        <td><b>${esc(m.label || cap(monName(m.month)))}</b></td>
        <td>${m.frozen_at ? `<span class="rt-v na">закрыт ${esc(stamp(m.frozen_at).slice(0, 5))}</span>`
          : m.month < cur ? `<span class="rt-v wait">досдают до ${grace}-го</span>`
          : `<span class="rt-v ok">идёт</span>`}</td>
        <td class="num r">${esc(stamp(m.updated_at))}</td>
      </tr>`).join("")}</tbody>
    </table>`;
  }

  /* ── смены ведущих ───────────────────────────────────────── */
  function leadsHTML() {
    const can = data.can_edit;
    if (!data.leads.length) {
      return `<div class="rt-empty"><b>Смен пока не было</b>
        <span>Сменится первый мастер объекта в таблице цикла — смена появится здесь.</span></div>`;
    }
    return `<table class="rt-tbl rt-leads">
      <thead><tr><th>Объект</th><th>Ведущий мастер${info(TIP.lead, "Кто такой ведущий")}</th>
        <th>С даты${info(TIP.since, "Что даёт дата")}</th><th class="r">Отметка</th></tr></thead>
      <tbody>${data.leads.map((l) => `<tr>
        <td class="rt-obj"><b>${esc(l.object)}</b></td>
        <td class="rt-chg"><span class="rt-from">${esc(l.from || "—")}</span><span class="rt-arr">→</span>${esc(l.to || "—")}</td>
        <td class="rt-since">${can ? `<input type="date" class="rt-date" data-lead="${esc(l.id)}" value="${esc(l.since)}"
          data-last="${esc(l.since)}" aria-label="С какой даты">` : `<span class="num">${day(l.since)}</span>`}</td>
        <td class="rt-who r">${l.source === "manual" ? `поправил ${esc(l.author)}` : "из таблицы"}<span>${esc(stamp(l.at))}</span></td>
      </tr>`).join("")}</tbody>
    </table>`;
  }

  async function saveLead(inp) {
    const since = inp.value;
    if (!since || since === inp.dataset.last) return;
    inp.classList.remove("bad");
    try {
      await AUTH.api("PATCH", "/rating/leads/" + encodeURIComponent(inp.dataset.lead), { since });
      inp.dataset.last = since;
      inp.classList.add("saved");
      setTimeout(() => inp.classList.remove("saved"), 1200);
      const l = data.leads.find((x) => x.id === inp.dataset.lead);
      if (l) { l.since = since; l.source = "manual"; }
      changed();
    } catch (e) {
      inp.classList.add("bad");
      inp.title = e.message;
    }
  }

  /* ── пояснения ⓘ ─────────────────────────────────────────── */
  let tipEl = null, tipFor = null, tipPinned = false;

  function showTip(btn) {
    hideTip();
    tipEl = document.createElement("div");
    tipEl.className = "rt-tip";
    tipEl.id = "rt-tip";
    tipEl.setAttribute("role", "tooltip");
    tipEl.textContent = btn.dataset.tip;
    document.body.appendChild(tipEl);
    tipFor = btn;
    btn.setAttribute("aria-describedby", "rt-tip");
    // Под значком, а не влезает — над ним; по ширине — в пределах экрана.
    const r = btn.getBoundingClientRect();
    const w = tipEl.offsetWidth, h = tipEl.offsetHeight;
    const cx = r.left + r.width / 2;
    const x = Math.max(8, Math.min(Math.round(cx - w / 2), innerWidth - w - 8));
    const below = innerHeight - r.bottom >= h + 14 || r.top < h + 14;
    tipEl.style.left = x + "px";
    tipEl.style.top = Math.round(below ? r.bottom + 8 : r.top - h - 8) + "px";
    tipEl.style.setProperty("--ax", Math.round(cx - x) + "px");
    tipEl.classList.toggle("up", !below);
  }

  function hideTip() {
    if (tipFor) tipFor.removeAttribute("aria-describedby");
    if (tipEl) tipEl.remove();
    tipEl = null; tipFor = null; tipPinned = false;
  }

  const tipOf = (t) => (t && t.closest ? t.closest(".rt-i") : null);
  function onOver(e) {
    const i = tipOf(e.target);
    if (i && !tipPinned && tipFor !== i) showTip(i);
  }
  function onOut(e) {
    const i = tipOf(e.target);
    if (i && !tipPinned && tipFor === i && !i.contains(e.relatedTarget)) hideTip();
  }
  function onFocusIn(e) {
    const i = tipOf(e.target);
    if (i && !tipPinned && tipFor !== i) showTip(i);
  }
  function onFocusOut(e) {
    const i = tipOf(e.target);
    if (i && !tipPinned && tipFor === i) hideTip();
  }

  /* ── файл перетаскивают в окно ───────────────────────────── */
  const hasFiles = (e) => !!(e.dataTransfer && [...(e.dataTransfer.types || [])].includes("Files"));
  const canDrop = () => !!(data && data.can_edit && !busy && (wiz
    ? wiz.step !== "loading" && wiz.step !== "sending"
    : !rows && tab === "sets"));

  function onDragOver(e) {
    if (!hasFiles(e)) return;
    e.preventDefault();                  // иначе браузер откроет файл сам
    const ok = canDrop();
    e.dataTransfer.dropEffect = ok ? "copy" : "none";
    card().classList.toggle("rt-dragging", ok);
  }
  function onDragLeave(e) {
    if (!e.relatedTarget || !box.contains(e.relatedTarget)) card().classList.remove("rt-dragging");
  }
  function onDrop(e) {
    if (!hasFiles(e)) return;
    e.preventDefault();
    card().classList.remove("rt-dragging");
    const f = e.dataTransfer.files && e.dataTransfer.files[0];
    if (f && canDrop()) startWizard(f, wiz && wiz.target ? wiz.target.id : "");
  }

  /* ── события ─────────────────────────────────────────────── */
  function onClick(e) {
    const t = e.target;
    if (t === box) {
      // Мимо окна — закрыть, но не посреди разметки: её жалко терять.
      if (!wiz || wiz.step === "done" || wiz.step === "fail") close();
      return;
    }
    const ib = tipOf(t);
    if (ib) {
      if (tipFor === ib && tipPinned) hideTip();
      else { showTip(ib); tipPinned = true; }
      return;
    }
    if (tipPinned) hideTip();
    if (t.closest("[data-close]")) { close(); return; }
    const tb = t.closest("[data-tab]");
    if (tb) { setTab(tb.dataset.tab); return; }
    const pk = t.closest("[data-pick]");
    if (pk) {
      pickFor = pk.dataset.pick || "";
      box.querySelector(".rt-file").click();
      return;
    }
    const fb = t.closest("[data-rfilter]");
    if (fb && rows) { rows.filter = fb.dataset.rfilter; paint(); return; }
    const rb = t.closest("[data-rows]");
    if (rb) { openRows(rb.dataset.rows); return; }
    const a = t.closest("[data-ask]");
    if (a) {
      ask = a.dataset.ask;
      paint();
      const no = box.querySelector("[data-ask-no]");
      if (no) no.focus();
      return;
    }
    if (t.closest("[data-ask-no]")) { ask = ""; paint(); return; }
    const del = t.closest("[data-del]");
    if (del) { removeSet(del.dataset.del); return; }
    if (t.closest("[data-rback]")) { rows = null; paint(); return; }
    if (t.closest("[data-wback]") || t.closest("[data-wdone]")) {
      if (wiz && wiz.step === "sending") return;
      wiz = null;
      paint();
      return;
    }
    const go = t.closest("[data-wgo]");
    if (go && !go.disabled && !busy) {
      busy = true;
      doImport().finally(() => { busy = false; });
    }
  }

  function setTab(id) {
    tab = id; wiz = null; rows = null; ask = ""; note = "";
    paint();
  }

  function onChange(e) {
    const t = e.target;
    if (t.matches(".rt-file")) {
      const f = t.files && t.files[0];
      t.value = "";
      if (f) startWizard(f, pickFor);
      return;
    }
    if (!wiz && !t.matches("input[data-lead]")) return;
    if (t.matches("[data-map]")) {
      wiz.maps[wiz.kind][t.dataset.map] = t.value === "" ? "" : +t.value;
      paint();
      return;
    }
    if (t.matches("input[name=rtKind]")) {
      wiz.kind = t.value;
      wiz.kindSet = true;
      refreshDefaults();
      paint();
      return;
    }
    if (t.matches("[data-w=period]")) {
      wiz.period = t.value;
      refreshDefaults();
      paint();
      return;
    }
    if (t.matches("[data-w=sheet]")) { wiz.sheet = t.value; wiz.header = ""; repreview(); return; }
    if (t.matches("[data-w=header]")) {
      const n = parseInt(t.value, 10);
      if (n > 0 && n !== +wiz.header) { wiz.header = n; repreview(); }
      return;
    }
    if (t.matches("[data-w=replace]")) {
      wiz.mode = t.checked ? "replace" : "new";
      if (!wiz.nameSet) wiz.name = defaultName();
      paint();
      return;
    }
    if (t.matches("input[data-lead]")) saveLead(t);
  }

  function onInput(e) {
    if (e.target.matches("[data-w=name]") && wiz) {
      wiz.name = e.target.value;
      wiz.nameSet = true;
    }
  }

  function onToggle(e) {
    if (wiz && e.target.matches && e.target.matches(".rt-peek")) wiz.peek = e.target.open;
  }

  function onKey(e) {
    if (!box) return;
    if (e.key === "Escape") {
      if (e.defaultPrevented) return;      // Esc закрыл выпадающий список — окно не трогаем
      if (tipFor) { hideTip(); return; }
      if (ask) { ask = ""; paint(); return; }
      // Незаконченную загрузку одним Escape не теряем — сначала назад.
      if (wiz && wiz.step !== "done") {
        if (wiz.step !== "sending") { wiz = null; paint(); }
        return;
      }
      if (rows) { rows = null; paint(); return; }
      close();
      return;
    }
    // Стрелки по вкладкам — как в любом переключателе вкладок.
    if ((e.key === "ArrowRight" || e.key === "ArrowLeft") && e.target.closest && e.target.closest(".rt-tabs")) {
      e.preventDefault();
      const ids = ["sets", "months", "leads"];
      setTab(ids[(ids.indexOf(tab) + (e.key === "ArrowRight" ? 1 : ids.length - 1)) % ids.length]);
    }
  }

  return { open, close };
})();
