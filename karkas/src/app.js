/* Дашборд успеваемости · этап 1. Читает data/obligations.json, всё считает сам.
   Ноль внешних зависимостей: только этот файл, styles.css и fonts.css. */
"use strict";

const $ = (sel) => document.querySelector(sel);

function fmtStamp(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  const p = (n) => String(n).padStart(2, "0");
  return `${p(d.getDate())}.${p(d.getMonth() + 1)} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

function fmtDay(iso) {
  const d = new Date(iso);
  const p = (n) => String(n).padStart(2, "0");
  return `${p(d.getDate())}.${p(d.getMonth() + 1)}`;
}

function plural(n, one, few, many) {
  const m10 = n % 10, m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
  return many;
}

const esc = (s) => String(s).replace(/[&<>"]/g,
  (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

/* Кружок-инициалы для строк с людьми. Тонировка у всех одна, фирменная:
   различать людей помогают буквы, а не случайные цвета. */
const initials = (fio) => String(fio).trim().split(/\s+/).slice(0, 2)
  .map((w) => (w[0] || "").toUpperCase()).join("");

/* «Сухогузов Александр» → «Сухогузов А.». В матрице колонка мастера
   узкая: полное имя ложилось в две строки у одних и в одну у других, и
   левый край выглядел рваным. Короткая форма ставит всех в одну строку,
   а фамилия остаётся целиком — по ней и узнают. */
const shortName = (fio) => {
  const p = String(fio).trim().split(/\s+/);
  return p.length < 2 ? p[0] || "" : `${p[0]} ${p[1][0].toUpperCase()}.`;
};

/* ── метрика (раздел 2): числитель on_time, знаменатель on_time+late+overdue ── */
const weight = (o) => o.count || 1;

function metric(obls) {
  let ok = 0, late = 0, over = 0;
  for (const o of obls) {
    if (o.status === "on_time") ok += weight(o);
    else if (o.status === "late") late += weight(o);
    else if (o.status === "overdue") over += weight(o);
  }
  const n = ok + late + over;
  return { ok, late, over, n, pct: n ? Math.round(ok / n * 100) : null };
}

const pctText = (m) => (m.pct === null ? "—" : m.pct + "%");

function barHTML(m, kind) {
  const cls = `bar${kind ? " " + kind : ""}`;
  if (!m.n) return `<div class="${cls}"></div>`;
  const w = (x) => (x / m.n * 100).toFixed(1);
  return `<div class="${cls}">
    <i class="p-ok" style="width:${w(m.ok)}%"></i>
    <i class="p-late" style="width:${w(m.late)}%"></i>
    <i class="p-over" style="width:${w(m.over)}%"></i></div>`;
}

function threeNumbers(obls) {
  return {
    reg: metric(obls.filter((o) => o.kind === "regulation")),
    tsk: metric(obls.filter((o) => o.kind === "task")),
    total: metric(obls),
  };
}

/* Порог объёма (правило 4): меньше 8 дел с наступившим сроком — вне рейтинга. */
const LOW_N = 8;

/* Колонки списка людей. Одни и те же для мастеров и для остальных
   сотрудников: таблицы идут одна под другой, и разъехавшиеся вертикали
   сразу читались как две несвязанные вёрстки. Последняя колонка без
   ширины — забирает остаток. */
/* Колонка места — под двузначный номер и не шире. Прежние 44 оставляли
   по полтора пустых знака с каждой стороны, и слева это читалось
   отдельной пустой полосой вдоль всего списка. Ширина общая для обоих
   рейтингов, мастеров и остальных, — они и должны стоять по одной сетке. */
const LIST_W = { rank: 30, who: 300, pct: 190 };
/* Планшет и узкое окно (685–960): с полными 300 + 190 последней колонке
   («По источникам», «Отдел») оставалось пикселей семьдесят, и она
   уходила за край карточки (30.09.2026). Считается при каждой
   отрисовке — перерисовка по ресайзу уже есть. */
const LIST_W_MID = { rank: 30, who: 220, pct: 150 };
const listW = () => (matchMedia("(max-width: 960px)").matches ? LIST_W_MID : LIST_W);
/* Телефон: в рейтинге три колонки — место, человек, процент. Колонку «По
   источникам» не прячем стилями, а не рисуем вовсе: Safari на iPhone
   переопределённые стилями ширины колонок понимал по-своему, и таблица
   вставала на полэкрана с обрезанными фамилиями (23.09.2026). */
const PHONE_MX = () => matchMedia("(max-width: 684px)").matches;
const PHONE_COLS = `<colgroup><col style="width:40px"><col><col style="width:96px"></colgroup>`;

/* Рейтинг на телефоне — строками, а не таблицей. Таблицу с заданными
   ширинами Safari на iPhone ставил на две трети экрана и резал фамилии
   (23.09.2026); строки на флексах он раскладывает так же, как Chrome.
   items: {rank, fio, pos, m, key} или {band: "текст"}. */
function phoneRatingHTML(head, items, word) {
  return `<div class="mxp">
    <div class="mxp-head"><span>${esc(head)}</span><span>Успеваемость</span></div>
    ${items.map((it) => it.fold ? foldHTML(it.fold, word, 0)
      : it.band ? `<div class="mxp-band${it.grp ? " mxp-grp" : ""}">${esc(it.band)}</div>` : `
      <div class="mxp-row${it.rank === null ? " m-low" : ""}">
        <span class="mxp-rank num">${it.rank === null ? "—" : it.rank}</span>
        <span class="av-i">${esc(initials(it.fio))}</span>
        <span class="mxp-who"><b>${esc(it.fio)}</b><i>${esc(it.pos)}</i></span>
        <span class="mxp-pct"><b class="num">${pctText(it.m)}</b><i class="num">${
          it.m.ok} из ${it.m.n}</i></span>
      </div>`).join("")}
  </div>`;
}

/* «Вне рейтинга» — свёрнутой строкой в конце своего списка (заказчик,
   30.09.2026: «с кнопкой „мало данных“ всё портится»). Прежняя кнопка
   стояла отдельной строкой между карточками и управляла сразу двумя
   списками. Теперь у каждого списка своя строка: сколько человек вне
   рейтинга и почему; нажатие раскрывает их тут же, под ней. При поиске
   раскрыто само — найденного человека не прячем.
   f: { fold: ключ, n, open, forced }. */
function foldHTML(f, word, span, cls) {
  const who = word ? word(f.n) : plural(f.n, "человек", "человека", "человек");
  const btn = `<button type="button" class="eff-fold" data-fold="${esc(f.fold)}"
      aria-expanded="${f.open}"${f.forced ? " disabled" : ""}>
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>
      <b>Вне рейтинга — ${f.n} ${who}</b>
      <span>меньше ${LOW_N} дел с наступившим сроком</span>
      <i>${f.forced ? "найдено поиском" : f.open ? "скрыть" : "показать"}</i></button>`;
  return span ? `<tr class="eff-fold-row${cls ? " " + cls : ""}"><td colspan="${span}">${btn}</td></tr>`
    : `<div class="eff-fold-row${cls ? " " + cls : ""}">${btn}</div>`;
}

/* ── состояние фильтров; живёт в URL (раздел 5) ───────────── */
let DATA = null;
let NAMES = {};   // person_key → полное имя (Битрикс либо таблица)
let BANDS = null; // участки: назначенные руками и пары «мастер — начальник» объектов
/* Два независимых выключателя поверх списка. Список выведен всегда —
   отдельной кнопки на него не нужно:

     kpi — лента общих показателей над рейтингом;
     mx  — таблица пунктов галочками справа от него.

   Независимые, а не три взаимоисключающих вида: показатели и матрица
   отвечают на разные вопросы («как в целом» и «что именно не сделано»),
   и смотреть их вместе — обычное дело.

   Прежние адреса продолжают работать: mx=1 и view=matrix открывают
   матрицу, view=stats — показатели. Такие ссылки уже разосланы. */
const STATE = { band: "", dept: "", low: true, kpi: false, mx: false, q: "", sort: "rate",
                period: "cur", sec: "", ref: "", tab: "people" };
/* Что раскрыто на странице — только на время вкладки, в адрес не пишем:
   fold — «вне рейтинга» по спискам, open — отделы и участки в дереве. */
const UI = { fold: {}, open: new Set() };

/* ── период ───────────────────────────────────────────────────
   С 29.09.2026 Битрикса нет. Источники:

     цикл производства — Google-таблица, в ней живут текущий и следующий
       месяц. Прошедший сборщик хранит сам (build_obligations.py): до
       5-го числа его ещё досдают, потом он закрыт и не пересчитывается.
       История копится с августа 2026 — раньше её не вели;
     задачи — таблицы, которые загружают в «Данных рейтинга»: свод по
       людям за месяц (отчёт «Эффективность», админ заказчика грузит его
       раз в две недели) или список задач со сроками.

   Если за период какого-то источника нет, об этом говорит подпись над
   списком: прочерк без объяснения читается как провал. */
const MON_RU = ["январь", "февраль", "март", "апрель", "май", "июнь", "июль",
  "август", "сентябрь", "октябрь", "ноябрь", "декабрь"];

// «с августа 2026» — родительный падеж для подписи о периоде.
const MON_GEN = ["января", "февраля", "марта", "апреля", "мая", "июня", "июля",
  "августа", "сентября", "октября", "ноября", "декабря"];

// «к августу» — дательный, для сравнения с прошлым периодом в итогах.
const MON_DAT = ["январю", "февралю", "марту", "апрелю", "маю", "июню", "июлю",
  "августу", "сентябрю", "октябрю", "ноябрю", "декабрю"];

const pad2 = (n) => String(n).padStart(2, "0");

/* Границы выбранного периода строками YYYY-MM-DD: сравнивать даты как
   текст безопасно — формат в файле один и тот же, с ведущими нулями. */
function periodRange() {
  const y = DATA.period.year, m = DATA.period.month;
  const p = STATE.period;

  if (p.startsWith("m:")) {
    const [yy, mm] = p.slice(2).split("-").map(Number);
    return { from: `${yy}-${pad2(mm)}-01`, to: `${yy}-${pad2(mm)}-31`,
             label: `${MON_RU[mm - 1]} ${yy}` };
  }
  const back = { "3m": 3, "6m": 6, "12m": 12 }[p];
  if (back) {
    let yy = y, mm = m - back + 1;
    while (mm < 1) { mm += 12; yy--; }
    return { from: `${yy}-${pad2(mm)}-01`, to: `${y}-${pad2(m)}-31`,
             label: `${back} ${plural(back, "месяц", "месяца", "месяцев")} по ${MON_RU[m - 1]}` };
  }
  return { from: `${y}-${pad2(m)}-01`, to: `${y}-${pad2(m)}-31`,
           label: DATA.period.label.toLowerCase() };
}

/* Прошлый период той же длины — для сдвига в итогах: месяц к прошлому
   месяцу, «3 месяца» к трём месяцам до них. Текущий месяц сравнивается
   с прошлым целиком: сравнивают доли, а не штуки. */
function prevRange() {
  const { from, to } = periodRange();
  const [fy, fm] = from.split("-").map(Number);
  const [ty, tm] = to.split("-").map(Number);
  const len = (ty - fy) * 12 + (tm - fm) + 1;
  let y = fy, m = fm - len;
  while (m < 1) { m += 12; y--; }
  let ey = fy, em = fm - 1;
  if (em < 1) { em = 12; ey--; }
  return {
    from: `${y}-${pad2(m)}-01`, to: `${ey}-${pad2(em)}-31`,
    label: len === 1 ? `к ${MON_DAT[em - 1]}` : `к ${len} ${plural(len, "месяцу", "месяцам", "месяцам")} до них`,
    full: len === 1 ? `за ${MON_RU[em - 1]}` : "за прошлый такой же срок",
  };
}

/* Месяцы, за которые в файле есть хоть одно дело со сроком. Список
   строим по данным, а не по календарю: он должен обещать ровно то, что
   потом покажет. Будущее отбрасываем — сроки там ещё не наступили. */
function availableMonths() {
  const set = new Set();
  for (const o of DATA.obligations) {
    const d = o.due || "";
    if (d.length >= 7) set.add(d.slice(0, 7));
  }
  const cur = `${DATA.period.year}-${pad2(DATA.period.month)}`;
  return [...set].filter((m) => m <= cur).sort().reverse();
}

function readURL() {
  const q = new URLSearchParams(location.search);
  STATE.band = q.get("band") || "";
  STATE.dept = q.get("dept") || "";
  STATE.low = q.get("low") !== "0";
  STATE.q = q.get("q") || "";
  STATE.sort = q.get("sort") || "rate";
  STATE.period = q.get("period") || "cur";
  STATE.tab = q.get("tab") === "depts" ? "depts" : "people";
  // «По отделам и участкам» из порядка переехал во вкладку «Отделы» —
  // старые ссылки ведут туда.
  if (STATE.sort === "grp") { STATE.sort = "rate"; STATE.tab = "depts"; }
  /* Раздел. Витрина этот параметр не читает: там разделов нет. */
  STATE.sec = q.get("s") || "";
  // Вкладка справочника — чтобы обновление страницы не уводило на первую.
  STATE.ref = q.get("t") || "";
  const v = q.get("view");
  STATE.kpi = q.get("kpi") === "1" || v === "stats";
  STATE.mx = q.get("mx") === "1" || v === "matrix";
  /* Витрина настраивается той же парой параметров, но без них показывает
     показатели: экран висит ради общей цифры, и пустой он бесполезен.
     Адрес без параметров уже висит на телевизоре — он должен работать
     как прежде. */
  if (isTV() && !q.has("kpi") && !q.has("mx") && !v) STATE.kpi = true;
}

function writeURL() {
  const q = new URLSearchParams();
  if (STATE.band) q.set("band", STATE.band);
  if (STATE.dept) q.set("dept", STATE.dept);
  if (!STATE.low) q.set("low", "0");
  if (STATE.kpi) q.set("kpi", "1");
  if (STATE.mx) q.set("mx", "1");
  if (STATE.q) q.set("q", STATE.q);
  if (STATE.sort !== "rate") q.set("sort", STATE.sort);
  if (STATE.period !== "cur") q.set("period", STATE.period);
  if (STATE.tab === "depts") q.set("tab", "depts");
  if (STATE.sec && STATE.sec !== "emp") q.set("s", STATE.sec);
  if (STATE.sec === "ref" && STATE.ref) q.set("t", STATE.ref);
  const qs = q.toString();
  history.replaceState(null, "", qs ? "?" + qs : location.pathname);
}

/* Панель инструментов над таблицей — приём референса: поиск слева,
   фильтр участка и порядок показа справа. Выпадающие списки вместо
   таблеток: участков полдюжины, строка табов дышала бы на ладан. */
function buildFilters() {
  const bandOrder = [];
  for (const o of DATA.obligations) {
    if (o.band && !bandOrder.includes(o.band)) bandOrder.push(o.band);
  }
  // Участок, назначенный руками или по объектам, может быть новым —
  // в таблице цикла его ещё нет, а в фильтре он нужен.
  for (const p of DATA.people) {
    if (p.band && !bandOrder.includes(p.band)) bandOrder.push(p.band);
  }
  const box = $("#filters");
  if (!box) return;          // на витрине фильтров нет
  // Отделы — из справочника штата. Отдел и участок — один список с
  // группами: два соседних выпадающих списка читались как «и то, и то».
  const deptNames = (DATA.depts || []).map((d) => d.name).sort((a, b) => a.localeCompare(b, "ru"));
  const scope = STATE.dept ? "d:" + STATE.dept : STATE.band ? "b:" + STATE.band : "";

  const opt = (v, label, cur) =>
    `<option value="${esc(v)}"${v === cur ? " selected" : ""}>${esc(label)}</option>`;
  box.innerHTML = `
    <span class="eff-only-people eff-find">
      <label class="tb-search">
        <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M20.4 20.4l-4.3-4.3"/></svg>
        <input id="mq" placeholder="Найти сотрудника…" autocomplete="off" value="${esc(STATE.q)}">
      </label>
    </span>
    <span class="tb-gap"></span>
    <select class="role-sel" id="fperiod" aria-label="Период">
      ${opt("cur", DATA.period.label, STATE.period)}
      ${availableMonths()
        .filter((m) => m !== `${DATA.period.year}-${pad2(DATA.period.month)}`)
        .slice(0, 12)
        .map((m) => {
          const [yy, mm] = m.split("-").map(Number);
          const name = MON_RU[mm - 1];
          return opt("m:" + m, name[0].toUpperCase() + name.slice(1) + " " + yy, STATE.period);
        }).join("")}
      ${opt("3m", "Последние 3 месяца", STATE.period)}
      ${opt("6m", "Последние 6 месяцев", STATE.period)}
      ${opt("12m", "Последние 12 месяцев", STATE.period)}
    </select>
    ${deptNames.length || bandOrder.length ? `<span class="eff-only-people">
      <select class="role-sel" id="fscope" aria-label="Отдел или участок">
        ${opt("", "Все отделы и участки", scope)}
        ${deptNames.length ? `<optgroup label="Отделы">${
          deptNames.map((d) => opt("d:" + d, d, scope)).join("")}</optgroup>` : ""}
        ${bandOrder.length ? `<optgroup label="Участки">${
          bandOrder.map((b) => opt("b:" + b, "уч. " + b, scope)).join("")}</optgroup>` : ""}
      </select></span>` : ""}
    <span class="eff-only-people">
      <select class="role-sel" id="fsort" aria-label="Порядок">
        ${opt("rate", "Сначала сильные", STATE.sort)}
        ${opt("rate-asc", "Сначала отстающие", STATE.sort)}
        ${opt("vol", "По объёму дел", STATE.sort)}
        ${opt("name", "По имени", STATE.sort)}
      </select></span>`;

  /* Пауза после ввода: перерисовка матрицы не бесплатная, а печатающий
     человек выдаёт по букве в сотню миллисекунд. */
  let t = 0;
  $("#mq").addEventListener("input", (e) => {
    clearTimeout(t);
    t = setTimeout(() => { STATE.q = e.target.value; writeURL(); renderAll(); }, 150);
  });
  $("#fperiod").addEventListener("change", (e) => {
    STATE.period = e.target.value; writeURL(); renderAll();
  });
  const fs = $("#fscope");
  if (fs) fs.addEventListener("change", (e) => {
    const v = e.target.value;
    STATE.dept = v.startsWith("d:") ? v.slice(2) : "";
    STATE.band = v.startsWith("b:") ? v.slice(2) : "";
    writeURL(); renderAll();
  });
  $("#fsort").addEventListener("change", (e) => {
    STATE.sort = e.target.value; writeURL(); renderAll();
  });
}

/* Подсветка включённых слоёв. aria-pressed, а не просто класс: для
   скринридера это два независимых выключателя, каждый со своим
   состоянием — нажатыми могут быть оба или ни одного. */
function syncMode() {
  document.querySelectorAll("#mode [data-t]").forEach((b) => {
    const on = !!STATE[b.dataset.t];
    b.classList.toggle("on", on);
    b.setAttribute("aria-pressed", String(on));
  });
}

/* Список участков переехал в выпадающий фильтр, из таблеток остался
   один тумблер «мало данных» — синхронизируем его. */
function syncChips() {
  document.querySelectorAll("#low-btn").forEach((b) => {
    b.classList.toggle("on", STATE.low);
  });
}

/* Фильтр участка сужает людей; обязательства следуют за людьми.
   Период режет по сроку: дело относится к тому месяцу, в котором его
   ждали, а не в котором сделали — иначе просроченное на полгода
   считалось бы месяцу сдачи и портило чужую статистику. Дела без срока
   (в Битриксе таких почти тысяча) не попадают ни в один период — их и
   в метрике нет, считать нечего. */
function currentView(band = STATE.band, dept = STATE.dept, range = periodRange()) {
  const { from, to } = range;
  // Уволенный (дата увольнения в справочнике, правка № 3) — только в
  // периодах, где он ещё работал.
  const people = DATA.people.filter((p) => (!band || p.band === band) && (!dept || p.dept === dept)
    && (!p.fired || p.fired >= from));
  const keys = new Set(people.map((p) => p.person_key));
  const obls = DATA.obligations.filter((o) => {
    if (!keys.has(o.person_key)) return false;
    const d = o.due || "";
    return d >= from && d <= to;
  });
  const byPerson = {};
  for (const o of obls) {
    (byPerson[o.person_key] = byPerson[o.person_key] || []).push(o);
  }
  return { people, obls, byPerson };
}

/* ── шапка ────────────────────────────────────────────────── */
/* Нижняя строка подсказки: период и способ выгрузки задач. */
let SOURCE_MODE = "";

function renderChrome() {
  const per = DATA.period;
  const reg = DATA.sources.reglament || {};
  SOURCE_MODE = `${per.label}, день ${per.day_now} из ${per.days_in_month}` +
    (reg.missing_current ? ` · в таблице цикла нет блока «${per.label}»` : "");
}

/* Кто в каком списке. Мастера — из таблицы цикла: те, кто стоит в ней
   в последнем месяце, и те, у кого за период есть дела (ушедший мастер
   виден в своих прошлых месяцах). Остальные — у кого есть задачи из
   таблиц отделов. Руководители отделов и участков оцениваются в
   «Отделах» — половина свои дела, половина дела отдела, — и во втором
   списке не повторяются: два разных процента у одного человека на
   одном экране только спорят друг с другом. */
function mastersOf(view) {
  const last = DATA.people.reduce((m, p) => (p.sheet_month && p.sheet_month > m ? p.sheet_month : m), "");
  return view.people.filter((p) => p.sheet_name
    && (!p.sheet_month || p.sheet_month === last || (view.byPerson[p.person_key] || []).length));
}

function othersOf(view) {
  const withTasks = new Set(DATA.obligations.filter((o) => o.kind === "task").map((o) => o.person_key));
  // На витрине «Отделов» нет — там руководители остаются в общем списке.
  const heads = $("#depts") ? headKeys() : new Set();
  return view.people.filter((p) => !p.sheet_name && withTasks.has(p.person_key)
    && !heads.has(p.person_key));
}

const nameOf = (p) => p.fio || p.sheet_name || p.fio_full || p.person_key;

/* ── строка рейтинга (остальные сотрудники) ───────────────── */
/* Строка человека — та же, что у мастера: ранг, кружок с именем и
   наградами, процент с полосой, разбивка по источникам. Раньше здесь
   была своя сетка из четырёх колонок других размеров, и два списка на
   одном экране выглядели вёрсткой из разных мест. */
function personRowHTML(rank, fio, pos, m, key, srcLabel, phone, fourth) {
  return `<tr class="m-first${rank === null ? " m-low" : ""}">
    <td class="m-rank"><span class="rank num">${rank === null ? "—" : rank}</span></td>
    <td class="m-who">
      <span class="mwrap" title="${esc(fio)}${pos ? " · " + esc(pos) : ""}">
        <span class="av-i">${esc(initials(fio))}</span>
        <span class="mw"><b>${esc(fio)}</b><span>${esc(pos)}</span></span>
        ${awBadges(key)}
      </span>
    </td>
    <td class="m-pct">
      <span class="r-pct num">${pctText(m)}</span>
      ${barHTML(m, "mini")}
      <span class="r-count num">${m.ok} из ${m.n}</span>
    </td>
    ${phone ? "" : fourth !== undefined ? `<td class="m-src">${fourth}</td>` : `<td class="m-src">
      <span class="s">${srcLabel} <b class="num">${pctText(m)}</b>
        <i class="num">${m.ok} из ${m.n}</i></span>
    </td>`}
  </tr>`;
}

/* ── ряд показателей (вариант А) ──────────────────────────────
   Те же три числа, что и в сводке, но вынесены наверх отдельными
   карточками: свёрнутой матрице угловая панель больше не нужна. */
function renderKPI(view, cols, applicable, objCount) {
  const kp = $("#kpis");
  if (!kp) return;
  /* На витрине карточки показываем всегда: переключателя вида там нет,
     а общая успеваемость — главное, ради чего экран и висит. */
  /* При открытой матрице лента не выводится: те же четыре числа стоят в
     её углу, вчетверо теснее. Выключатель по-прежнему их и включает —
     меняется только место и размер. */
  /* Лента подчиняется своему выключателю и в таблице тоже: в углу
     матрицы теперь не проценты, а самые проваленные пункты, дублировать
     нечего. */
  const show = STATE.kpi;
  kp.hidden = !show;
  if (!show) return;

  const { reg, tsk, total } = threeNumbers(view.obls);
  const late = total.late + total.over;
  const pctOk = total.n ? (total.ok / total.n) * 100 : 0;

  kp.innerHTML = `
    <div class="k hero">
      <div class="k-lab">Общая успеваемость</div>
      <div class="k-line">
        <span class="k-big num">${pctText(total)}</span>
        <span class="k-sub"><b class="num">${total.ok}</b> из <b class="num">${total.n}</b> в срок
          · не в срок <b class="num">${late}</b></span>
      </div>
      <div class="k-split">
        <i style="width:${pctOk}%"></i><i class="rest" style="width:${100 - pctOk}%"></i>
      </div>
    </div>

    <div class="k">
      <div class="k-lab">Ежемесячный цикл производства</div>
      <div class="k-line">
        <span class="k-big num">${pctText(reg)}</span>
        <span class="k-sub"><span class="num">${reg.ok}</span> из <span class="num">${reg.n}</span></span>
      </div>
      <div class="k-bar"><i class="warn" style="width:${reg.n ? (reg.ok / reg.n) * 100 : 0}%"></i></div>
      <div class="k-src">Google-таблица</div>
    </div>

    <div class="k">
      <div class="k-lab">Выполнение задач</div>
      <div class="k-line">
        <span class="k-big num">${pctText(tsk)}</span>
        <span class="k-sub"><span class="num">${tsk.ok}</span> из <span class="num">${tsk.n}</span></span>
      </div>
      <div class="k-bar"><i class="ok" style="width:${tsk.n ? (tsk.ok / tsk.n) * 100 : 0}%"></i></div>
      <div class="k-src">${tablesNote()}</div>
    </div>

    <div class="k">
      <div class="k-lab">Объём контроля</div>
      <div class="k-line">
        <span class="k-big num">${objCount}</span>
        <span class="k-sub">${plural(objCount, "объект", "объекта", "объектов")}
          · <span class="num">${cols.length}</span> ${plural(cols.length, "пункт", "пункта", "пунктов")}</span>
      </div>
      <div class="k-bar"><i class="off" style="width:${cols.length ? (applicable / cols.length) * 100 : 0}%"></i></div>
      <div class="k-src">применимо ${applicable} из ${cols.length}</div>
    </div>`;
}

/* ── мастера и их объекты + общая успеваемость в углу ─────── */

/* Легенда — одна строка под таблицей вместо прежнего блока в углу.
   Тот занимал 746×191: почти всю ширину левой части и высоту в четыре
   строки данных, ради шести значков. Ширина при этом нужна была пунктам,
   которые из-за неё не влезали в экран. */
const LEGEND_HTML = `<div class="mx-legend">
  <span class="lgd"><span class="mc ok">✓</span> сделано</span>
  <span class="lgd"><span class="mc over">!</span> не сделано</span>
  <span class="lgd"><span class="mc wait">•</span> срок не наступил</span>
  <span class="lgd"><span class="mc na">—</span> неприменимо</span>
  <span class="lgd"><span class="mc nodata"></span> нет данных</span>
  <span class="lgd"><span class="mc unclear">?</span> уточнить</span>
</div>`;

/* Сводка переехала в ряд карточек наверху (renderKPI), поэтому в углу
   матрицы осталась только легенда — дублировать 61% незачем. */

function renderMasters(view) {
  const body = $("#masters-body");
  if (!body) return;
  body.classList.remove("placeholder", "skel-list", "skel-lines");

  const rows = mastersOf(view)
    .map((p) => ({ p, ...threeNumbers(view.byPerson[p.person_key] || []) }));
  const byName = (a, b) => a.p.sheet_name.localeCompare(b.p.sheet_name, "ru");
  const ranked = rows.filter((r) => r.total.n >= LOW_N)
    .sort((a, b) => (b.total.pct - a.total.pct) || (b.total.n - a.total.n) || byName(a, b));
  const low = rows.filter((r) => r.total.n < LOW_N).sort(byName);
  const cnt = $("#mastersCnt");
  if (cnt) cnt.textContent = rows.length || "";

  /* Поиск не пересчитывает ранги: найденный мастер стоит под своим
     настоящим местом в рейтинге, а не под первым. */
  const hit = searchHit((r) => `${r.p.fio || ""} ${r.p.sheet_name || ""} ${r.p.pos || ""} ${r.p.band || ""}`);
  let top = ranked.map((r, i) => ({ ...r, rank: i + 1 })).filter(hit);
  let lowRows = low.map((r) => ({ ...r, rank: null })).filter(hit);

  /* Порядок показа — тоже поверх рангов. «Вне рейтинга» при любом
     порядке остаётся внизу. */
  const cmp = {
    "rate-asc": (a, b) => (a.total.pct - b.total.pct) || (a.total.n - b.total.n) || byName(a, b),
    "vol": (a, b) => (b.total.n - a.total.n) || byName(a, b),
    "name": byName,
  }[STATE.sort];
  if (cmp) { top.sort(cmp); lowRows.sort(cmp); }

  // Витрина — как прежде: «мало данных» полосой по параметру адреса.
  const tv = isTV();
  const qOn = !!STATE.q.trim();
  const lowOpen = tv ? STATE.low : (qOn || !!UI.fold.masters);
  const fold = !tv && lowRows.length ? { fold: "masters", n: lowRows.length, open: lowOpen, forced: qOn } : null;
  const wordM = (n) => plural(n, "мастер", "мастера", "мастеров");
  let shown = top.concat(fold ? [fold] : []).concat(lowOpen ? lowRows : []);

  if (!top.length && !lowRows.length) {
    body.innerHTML = STATE.dept && !STATE.q
      ? `<div class="empty-note eff-empty">В отделе «${esc(STATE.dept)}» мастеров нет — его
          люди ниже, в «Офисе и ИТР», руководитель — во вкладке «Отделы».</div>`
      : `<div class="empty-note eff-empty">Под фильтр никто не попал.</div>`;
    return;
  }

  if (!STATE.mx && PHONE_MX()) {
    const items = [];
    let bandShown = !tv;
    for (const r of shown) {
      if (r.fold) { items.push({ fold: r }); continue; }
      if (r.rank === null && !bandShown) {
        bandShown = true;
        items.push({ band: `мало данных · меньше ${LOW_N} дел с наступившим сроком · вне рейтинга` });
      }
      items.push({ rank: r.rank, fio: r.p.fio || r.p.sheet_name,
        pos: (r.p.pos || "должность не указана") + (r.p.band ? " · уч. " + r.p.band : ""),
        m: r.total });
    }
    body.innerHTML = phoneRatingHTML("Мастер", items, wordM);
    return;
  }

  // колонки пунктов — в порядке таблицы; «нед. N» группируются под общим
  // названием. Колонка в фоне, пока срок не наступил (как в build.py:
  // срок наступил, когда текущий день строго больше дня пункта).
  // Период в несколько месяцев — таблица за последний из них: у разных
  // месяцев одни и те же пункты, и в одной сетке они легли бы друг на
  // друга. У прошедшего месяца все сроки наступили — в фон ничего.
  const regsAll = view.obls.filter((o) => o.kind === "regulation");
  const curMon = `${DATA.period.year}-${pad2(DATA.period.month)}`;
  const mxMon = regsAll.reduce((m, o) => ((o.month || curMon) > m ? (o.month || curMon) : m), "");
  const regs = regsAll.filter((o) => (o.month || curMon) === mxMon);
  const [mxY, mxM] = (mxMon || curMon).split("-").map(Number);
  const isCurMon = !mxMon || mxMon === curMon;
  const cols = [], colIdx = new Map();
  const dimDays = new Date(mxY, mxM, 0).getDate();
  for (const o of regs) {
    if (colIdx.has(o.title)) continue;
    colIdx.set(o.title, cols.length);
    const m = o.title.match(/^(.*) · нед\. (\d)$/);
    const day = m ? Math.min(+m[2] * 7, dimDays)
      : (o.due ? +o.due.slice(8, 10) : null);
    cols.push({
      base: m ? m[1] : o.title,
      sub: m ? "н" + m[2] : (day !== null ? String(day) : "—"),
      dim: isCurMon && day !== null && !(DATA.period.day_now > day),
    });
  }

  // объекты по мастерам; ключ — строка исходной таблицы, дубли не сливаются.
  // Сменился ведущий посреди месяца — у объекта две строки: пункты до
  // смены у прежнего мастера, после — у нового.
  const rowMap = new Map(), objByMaster = new Map();
  for (const o of regs) {
    const rk = o.id.split("-")[1] + "|" + o.person_key;
    let r = rowMap.get(rk);
    if (!r) {
      r = { object: o.object, cells: Array(cols.length).fill(null), debt: 0 };
      rowMap.set(rk, r);
      if (!objByMaster.has(o.person_key)) objByMaster.set(o.person_key, []);
      objByMaster.get(o.person_key).push(r);
    }
    r.cells[colIdx.get(o.title)] = o.raw;
    if (o.raw === "over") r.debt++;
  }

  const allObjs = [...rowMap.values()];
  // Число применимых пунктов ушло из подзаголовка, но осталось нужным
  // карточке «Объём контроля».
  const applicable = cols.filter((c) => !c.dim).length;

  /* Одна кнопка на всю секцию. Свёрнуто — только рейтинг: фамилия,
     успеваемость, источники. Раскрыто — возвращаются карточки метрик,
     объекты и сетка пунктов. На телевизоре всегда свёрнуто: галочки
     15.5px с трёх метров не видны. */
  // Матрица работает и на витрине — её включают параметром в адресе.
  const open = STATE.mx;
  renderKPI(view, cols, applicable, allObjs.length);

  // Первая колонка каждого пункта отбивается воздухом слева (класс gs):
  // без этого 21 колонка сливается в сплошную ленту галочек.
  const gs = cols.map((c, i) => i === 0 || c.base !== cols[i - 1].base);

  // Пункты в группы: недельные дают по четыре колонки, месячные — одну.
  // Считаем раньше ширин, потому что ширину группе задаёт её подпись.
  const spans = [];
  for (const c of cols) {
    const last = spans[spans.length - 1];
    if (last && last.base === c.base) { last.n++; last.dim = last.dim && c.dim; }
    else spans.push({ base: c.base, n: 1, dim: c.dim });
  }

  const GLYPH = { ok: "✓", over: "!", wait: "•", na: "—", nodata: "", unclear: "?" };
  const cell = (raw, k, dim) => {
    const cls = `mcell${gs[k] ? " gs" : ""}${dim ? " dim" : ""}`;
    return raw === null
      ? `<td class="${cls}"></td>`
      : `<td class="${cls}"><span class="mc ${raw}">${GLYPH[raw]}</span></td>`;
  };

  /* Подписи источников. Свёрнутой таблице колонка отдана широкая (225px),
     туда влезают узнаваемые названия метрик. Раскрытой она ужимается до
     135px — там только корень, иначе подпись вылезет за край. */
  const phone = !open && PHONE_MX();
  const SRC_REG = open ? "цикл" : "цикл производства";
  const SRC_TSK = "задачи";

  // Вариант А: мастер разложен по колонкам, а не сложен в одну ячейку.
  const infoCell = (r, span) => `
    <td class="m-rank" rowspan="${span}"><span class="rank num">${r.rank === null ? "—" : r.rank}</span></td>
    <td class="m-who" rowspan="${span}">
      <span class="mwrap" title="${esc(r.p.fio || r.p.sheet_name)}${
        r.p.pos ? " · " + esc(r.p.pos) : ""}">
        <span class="av-i">${esc(initials(r.p.fio || r.p.sheet_name))}</span>
        <span class="mw">
          <b>${esc(open ? shortName(r.p.fio || r.p.sheet_name)
                        : (r.p.fio || r.p.sheet_name))}</b>
          <span>${esc(r.p.pos || "должность не указана")}${bandChip(r.p)}</span>
        </span>
        ${awBadges(r.p.person_key)}
      </span>
    </td>
    <td class="m-pct" rowspan="${span}">
      <span class="r-pct num">${pctText(r.total)}</span>
      ${barHTML(r.total, "mini")}
      <span class="r-count num">${r.total.ok} из ${r.total.n}</span>
    </td>
    ${open || phone ? "" : `<td class="m-src" rowspan="${span}">${srcLines(r, SRC_REG, SRC_TSK)}</td>`}`;

  // Свёрнутая матрица не рисуется вовсе, а не прячется CSS-ом: ширины
  // колонок считаются здесь же, и скрытые ячейки увели бы сетку.
  // Открыто: ранг, мастер, процент, объект, пункты, долг — колонки «по
  // источникам» в матрице нет.
  const SPAN_ALL  = open ? 5 + cols.length : phone ? 3 : 4;   // вся строка
  const SPAN_REST = 2 + cols.length;              // всё правее блока мастера

  const trs = [];
  let lowShown = !tv;
  for (const r of shown) {
    if (r.fold) {
      trs.push(foldHTML(r, wordM, SPAN_ALL));
      continue;
    }
    if (r.rank === null && !lowShown) {
      lowShown = true;
      trs.push(`<tr class="mx-band"><td colspan="${SPAN_ALL}">мало данных
        · меньше ${LOW_N} дел с наступившим сроком · вне рейтинга</td></tr>`);
    }
    const lowCls = r.rank === null ? " m-low" : "";
    const objs = objByMaster.get(r.p.person_key) || [];

    // Свёрнуто мастер занимает ровно одну строку: объектов нет, значит
    // и rowspan не нужен.
    if (!open) {
      trs.push(`<tr class="m-first${lowCls}">${infoCell(r, 1)}</tr>`);
      continue;
    }

    if (!objs.length) {
      trs.push(`<tr class="m-first${lowCls}">${infoCell(r, 1)}
        <td class="mi-none" colspan="${SPAN_REST}">ведущих объектов в таблице нет —
        только задачи</td></tr>`);
      continue;
    }
    objs.forEach((ob, i) => {
      trs.push(`<tr class="${i === 0 ? "m-first" : ""}${lowCls}">
        ${i === 0 ? infoCell(r, objs.length) : ""}
        <td class="mx-obj"><b>${esc(ob.object)}</b></td>
        ${open ? ob.cells.map((c, k) => cell(c, k, cols[k].dim)).join("") +
          `<td class="mx-debt gs${ob.debt ? "" : " zero"}">${ob.debt}</td>` : ""}</tr>`);
    });
  }

  const colOver = cols.map((c, i) =>
    allObjs.reduce((s, r) => s + (r.cells[i] === "over" ? 1 : 0), 0));
  const totalDebt = allObjs.reduce((s, r) => s + r.debt, 0);

  // Три панели: сводка, заголовки пунктов, люди. Колонки синхронизированы
  // фиксированными ширинами; зазор между верхними панелями вычтен из сводки,
  // чтобы ячейки шапки стояли ровно над ячейками таблицы. Колонка объекта
  // тянется по свободной ширине окна — поля по бокам не пустуют.
  // GS — отбивка перед пунктом, она же padding-left у .gs в styles.css.
  /* 24 на клетку — впритык под галочку в 15.5px с воздухом по бокам.
     Двадцать пунктов множат каждый лишний пиксель на двадцать, и на
     экране в 1280 именно эти два пикселя решали, влезает таблица или
     уезжает за край. */
  const W_CELL = 24, W_DEBT = 32, GAP = 10, GS = 6;
  /* clientWidth считает вместе с полями контейнера — их надо вычесть,
     иначе таблица выходит ровно на ширину полей шире экрана. */
  const pad = (() => {
    const cs = getComputedStyle(body);
    return (parseFloat(cs.paddingLeft) || 0) + (parseFloat(cs.paddingRight) || 0);
  })();
  const avail = body.clientWidth - pad - 2;

  /* Подписи пунктов стоят вертикально, поэтому ширина колонки от длины
     названия больше не зависит — только от галочки внутри. Горизонтальные
     подписи требовали столько ширины, чтобы лечь в три строки: «Заявка на
     материалы на месяц» раздувала свою колонку до 59.5px вместо 26, и
     двадцать пунктов переставали влезать в экран. Вертикаль стоит высоты
     шапки один раз наверху, а ширины — в каждой из двадцати колонок. */
  const colW = [];
  for (const s of spans) {
    const total = s.n * W_CELL + GS;
    const each = Math.floor(total / s.n);
    for (let i = 0; i < s.n; i++) colW.push(i === 0 ? total - each * (s.n - 1) : each);
  }

  /* Высота шапки — по самой длинной подписи, а не наугад. Записанная
     числом, она резала «Письмо об отсутствии стройготовности» на середине
     слова. Меряем настоящим шрифтом: считать по количеству букв нельзя,
     «Ш» и «і» разной ширины. Потолок в 240 — чтобы одна ошибочно длинная
     строка в таблице не выдавила данные за экран. */
  const labelH = (() => {
    if (!open || !spans.length) return 0;
    const ctx = document.createElement("canvas").getContext("2d");
    ctx.font = "500 9.5px Onest, 'IBM Plex Sans', system-ui, sans-serif";
    const longest = Math.max(...spans.map((s) => ctx.measureText(s.base).width));
    /* Потолок в 150: что длиннее — ложится в две вертикальные строки.
       Ширины колонки (23.5px) на две строки по 9.5px хватает, а у групп с
       общим названием её и подавно больше. Без потолка «Письмо об
       отсутствии стройготовности» растягивало шапку до 261 пикселя. */
    return Math.min(150, Math.ceil(longest) + 16);
  })();

  const cellsW = open ? colW.reduce((a, b) => a + b, 0) + W_DEBT + GS : 0;

  /* Раскрытой матрице ширина нужнее пунктам, поэтому блок мастера
     ужимается, а полосу успеваемости в нём заменяет сетка галочек.

     Свёрнутая таблица раньше отдавала фамилии весь остаток ширины. На
     широком экране между именем и процентом зияла пустота в тысячу
     пикселей, а на узком расчёт упирался в пол в 216px, таблица
     выходила шире окна — и карточку приходилось листать вбок. Теперь
     фамилии дан потолок, а остаток забирает последняя колонка: таблица
     всегда ровно по ширине окна. */
  /* В матрице разбивка «цикл / задачи» не показывается вовсе: те же дела
     стоят рядом галочками поимённо, и колонка на 135px повторяла бы их
     свёрткой. Без неё левый блок ужимается с 756 до 250 с небольшим —
     ровно та ширина, которой не хватало пунктам. */
  const W_RANK = open ? 28 : listW().rank;
  /* 78 — под «100%» сверху и «48 из 65» снизу. На 62 подпись не влезала
     и вылезала за колонку на два десятка пикселей. */
  const W_PCT  = open ? 78 : listW().pct;
  const W_SRC  = open ? 0 : 250;
  const W_WHO  = open ? 150 : listW().who;
  const W_INFO = W_RANK + W_WHO + W_PCT + W_SRC;
  const W_OBJ = open ? Math.max(130, avail - W_INFO - cellsW) : 0;
  const leftW = W_INFO + W_OBJ;
  const totalW = leftW + cellsW + 2;   // зазор сверху вычтен из ширины сводки
  const colCells = colW.map((w) => `<col style="width:${w}px">`).join("") +
    `<col style="width:${W_DEBT + GS}px">`;
  const colHead = `<colgroup>${colCells}</colgroup>`;
  /* У свёрнутой таблицы последняя колонка идёт без ширины: она и
     подбирает весь остаток, поэтому таблица встаёт ровно в окно. */
  const colBody = phone ? PHONE_COLS : `<colgroup>
    <col style="width:${W_RANK}px"><col style="width:${W_WHO}px">
    <col style="width:${W_PCT}px">${open ? "" : "<col>"}
    ${open ? `<col style="width:${W_OBJ}px">${colCells}` : ""}</colgroup>`;

  // Свёрнутой таблице шапка нужна своя — раскрытой её роль играют
  // угловая панель и панель пунктов сверху.
  const theadHTML = open ? "" : `<thead><tr>
      <th colspan="2">Мастер</th><th>Успеваемость</th>${phone ? "" : "<th>По источникам</th>"}
    </tr></thead>`;

  // Свёрнутой матрице панель заголовков не нужна — сводка занимает всю ширину.
  const headHTML = open ? `<div class="panel head-panel" style="width:${cellsW + 2}px">
        <table class="mx mx-head" style="width:${cellsW}px;--label-h:${labelH}px">${colHead}
          <tr>
            ${spans.map((s) => `<th class="v gs${s.dim ? " dim" : ""}" colspan="${s.n}" title="${esc(s.base)}"><span>${esc(s.base)}</span></th>`).join("")}
            <th class="v gs"><span>долг</span></th>
          </tr>
          <tr class="mx-days" title="Число месяца либо номер недели. Колонки с ненаступившим сроком уведены в фон.">
            ${cols.map((c, k) => `<th class="${gs[k] ? "gs" : ""}${c.dim ? " dim" : ""}">${c.sub}</th>`).join("")}
            <th></th>
          </tr>
        </table>
      </div>` : "";

  const footHTML = open ? `<tfoot><tr>
          <td colspan="4">не сделали, объектов</td>
          ${colOver.map((n, i) => `<td class="fnum${gs[i] ? " gs" : ""}${n ? "" : " zero"}${cols[i].dim ? " dim" : ""}">${n || "·"}</td>`).join("")}
          <td class="fnum gs">${totalDebt}</td>
        </tr></tfoot>` : "";

  /* Угол над блоком мастера — самая большая пустота в матрице: по высоте
     он равен шапке пунктов, а держал одну строку заголовков.

     Общие проценты сюда не идут: они и так стоят лентой сверху, а два
     одинаковых набора цифр на одном экране только спорят друг с другом.
     Вместо них — то, чего больше нигде нет: какие пункты чаще всего не
     сделаны. Двадцать колонок галочек глазом так не сложишь, а вопрос
     «что чинить первым» задают в первую очередь. */
  const worst = {};
  colOver.forEach((n, i) => {
    if (!n) return;
    const k = cols[i].base;                   // недельные пункты — одной строкой
    worst[k] = (worst[k] || 0) + n;
  });
  const worstTop = Object.entries(worst).sort((a, b) => b[1] - a[1]).slice(0, 3);

  const cornerKPI = open ? `<div class="corner-worst">
      <div class="cw-title">Чаще всего не сделано</div>
      ${worstTop.length ? worstTop.map(([name, n]) => `<div class="cw">
        <span class="cw-n num">${n}</span>
        <span class="cw-name" title="${esc(name)}">${esc(name)}</span>
      </div>`).join("") : `<div class="cw-none">Просроченного нет</div>`}
      <div class="cw-foot">объектов с пропущенным сроком · долг
        <b class="num">${totalDebt}</b></div>
    </div>` : "";

  const cornerHTML = open ? `<div class="panel sum-panel" style="width:${leftW - GAP}px">
      ${cornerKPI}
      ${LEGEND_HTML}
      <div class="corner-head">
        <span style="width:${W_RANK}px"></span>
        <span style="width:${W_WHO}px">Мастер</span>
        <span style="width:${W_PCT}px">Успев.</span>
        <span>Объект</span>
      </div>
    </div>` : "";

  const topHTML = open ? `<div class="mx-top" style="width:${totalW}px">
      ${cornerHTML}
      ${headHTML}
    </div>` : "";

  // Свёрнутая — резиновая, раскрытая — по расчёту: там ширину диктуют
  // колонки пунктов, и ужимать их нельзя.
  const panelW = open ? `${totalW}px` : "100%";
  const tableW = open ? `${totalW - 2}px` : "100%";

  body.innerHTML = `<div class="mx-scroll">
    ${topHTML}
    <div class="panel body-panel" style="width:${panelW}">
      <table class="mx mx-body${open ? " compact" : ""}" style="width:${tableW}">${colBody}
        ${theadHTML}
        <tbody>${trs.join("")}</tbody>
        ${footHTML}
      </table>
    </div>
  </div>`;

  /* Подпись у кнопки матрицы зависит от данных — сколько пунктов в этом
     месяце. Ставим её здесь, где число уже посчитано. */
  const mb = $('#mode [data-t="mx"]');
  if (mb) {
    const label = `Таблица пунктов: ${cols.length} ${plural(cols.length, "пункт", "пункта", "пунктов")}`;
    mb.title = label;
    mb.setAttribute("aria-label", label);
  }
}

/* ── рейтинг остальных: одно число — задачи из загруженных таблиц ── */
function renderOthers(view) {
  const tv = isTV();
  const all = othersOf(view)
    .map((p) => ({ p, m: metric(view.byPerson[p.person_key] || []) }));
  const cnt = $("#othersCnt");
  if (cnt) cnt.textContent = all.length || "";

  const byName = (a, b) => nameOf(a.p).localeCompare(nameOf(b.p), "ru");
  const hit = searchHit((r) => `${nameOf(r.p)} ${r.p.pos || ""} ${r.p.dept || ""}`);
  let top = all.filter((r) => r.m.n >= LOW_N)
    .sort((a, b) => (b.m.pct - a.m.pct) || (b.m.n - a.m.n) || byName(a, b))
    .map((r, i) => ({ ...r, rank: i + 1 })).filter(hit);
  let lowRows = all.filter((r) => r.m.n < LOW_N).sort(byName)
    .map((r) => ({ ...r, rank: null })).filter(hit);
  const cmp = {
    "rate-asc": (a, b) => (a.m.pct - b.m.pct) || (a.m.n - b.m.n) || byName(a, b),
    "vol": (a, b) => (b.m.n - a.m.n) || byName(a, b),
    "name": byName,
  }[STATE.sort];
  if (cmp) { top.sort(cmp); lowRows.sort(cmp); }

  const qOn = !!STATE.q.trim();
  const lowOpen = tv ? STATE.low : (qOn || !!UI.fold.others);
  const fold = !tv && lowRows.length ? { fold: "others", n: lowRows.length, open: lowOpen, forced: qOn } : null;
  const word = (n) => plural(n, "человек", "человека", "человек");
  // На витрине отдела в отдельной колонке нет — он в строке должности.
  const pos = (p) => (tv ? posOf(p) : (p.pos || (p.match === "table" ? "нет в справочнике штата" : "должность не указана")));

  const body = $("#others-body");
  if (!body) return;
  body.classList.remove("placeholder", "skel-list", "skel-lines");
  if (!top.length && !lowRows.length) {
    body.innerHTML = othersEmpty();
    return;
  }

  const phone = PHONE_MX();
  if (phone) {
    const items = top.map((r) => ({ rank: r.rank, fio: nameOf(r.p), pos: posOf(r.p), m: r.m }));
    if (tv) {
      if (STATE.low && lowRows.length) {
        items.push({ band: `мало данных · меньше ${LOW_N} дел с наступившим сроком · вне рейтинга` });
        lowRows.forEach((r) => items.push({ rank: null, fio: nameOf(r.p), pos: posOf(r.p), m: r.m }));
      }
    } else {
      if (fold) items.push({ fold });
      if (lowOpen) lowRows.forEach((r) => items.push({ rank: null, fio: nameOf(r.p), pos: posOf(r.p), m: r.m }));
    }
    body.innerHTML = phoneRatingHTML("Сотрудник", items, word);
    return;
  }
  const row = (r) => personRowHTML(r.rank, nameOf(r.p), pos(r.p), r.m, r.p.person_key, "задачи", false,
    tv ? undefined : `<span class="eff-dept">${esc(r.p.dept || "отдел не указан")}</span>`);

  /* Та же таблица и те же ширины, что у мастеров: списки идут один под
     другим, и колонки обязаны стоять на общих вертикалях. Последняя без
     ширины — забирает остаток, как и там. */
  body.innerHTML = `<table class="mx mx-body" style="width:100%">
    <colgroup>
      <col style="width:${listW().rank}px"><col style="width:${listW().who}px">
      <col style="width:${listW().pct}px"><col>
    </colgroup>
    <thead><tr>
      <th colspan="2">Сотрудник</th><th>Успеваемость</th><th>${tv ? "По источникам" : "Отдел"}</th>
    </tr></thead>
    <tbody>${top.map(row).join("")}${tv
      ? (STATE.low && lowRows.length ? `<tr class="mx-band"><td colspan="4">мало данных
        · меньше ${LOW_N} дел с наступившим сроком · вне рейтинга</td></tr>` + lowRows.map(row).join("") : "")
      : (fold ? foldHTML(fold, word, 4) : "") + (lowOpen ? lowRows.map(row).join("") : "")}</tbody>
  </table>`;
}

/* Разбивка «цикл / задачи». Источник без дел за период не показываем:
   строка «задачи — 0 из 0» у каждого мастера была только шумом. */
function srcLines(r, regLabel, tskLabel) {
  const line = (label, m) => `<span class="s">${label} <b class="num">${pctText(m)}</b>
    <i class="num">${m.ok} из ${m.n}</i></span>`;
  const out = (r.reg.n ? line(regLabel, r.reg) : "") + (r.tsk.n ? line(tskLabel, r.tsk) : "");
  return out || `<span class="s eff-none">дел с наступившим сроком нет</span>`;
}

/* Поиск по строке человека: пустой запрос пропускает всех. */
function searchHit(text) {
  const q = STATE.q.trim().toLowerCase();
  return (r) => !q || text(r).toLowerCase().includes(q);
}

/* Должность и отдел одной строкой; человека нет в справочнике штата —
   так и сказать: его завели в таблице задач, а в штат не внесли. */
const posOf = (p) => (p.pos || (p.match === "table" ? "нет в справочнике штата" : "должность не указана"))
  + (p.dept && !(p.pos || "").toLowerCase().includes(p.dept.toLowerCase()) ? " · " + p.dept : "");

/* Пустой список остальных: таблиц задач ещё не загружали — позвать туда,
   где их загружают. С теми же полями, что шапка карточки: без них текст
   прилипал к левому краю (30.09.2026), а ссылка «открыть» с точкой
   после неё висела отдельным словом. */
function othersEmpty() {
  const t = (DATA.sources && DATA.sources.tables) || {};
  const cls = isTV() ? "empty-note" : "empty-note eff-empty";
  if (t.sets) return `<div class="${cls}">Под фильтр никто не попал.</div>`;
  return `<div class="${cls}">Задач пока нет — их берут из отчётов в «Данных рейтинга».${
    BANDS && BANDS.can_data && !isTV() ? ` <button type="button" class="eff-link" data-rt-open>Загрузить отчёт</button>` : ""}</div>`;
}

/* Подпись источника задач: сколько таблиц и когда последняя. */
function tablesNote() {
  const t = (DATA.sources && DATA.sources.tables) || {};
  if (!t.sets) return "таблиц задач нет";
  return `${t.sets} ${plural(t.sets, "таблица", "таблицы", "таблиц")} задач` +
    (t.fetched_at ? ` · ${fmtStamp(t.fetched_at).slice(0, 5)}` : "");
}

/* Из чего сложен выбранный период. Нужна не для красоты: если за период
   нет какого-то источника, прочерк без подписи читался бы как провал
   всей конторы. */
function renderPeriodNote() {
  const box = $("#periodNote");
  if (!box) return;
  const view = currentView();
  const reg = view.obls.filter((o) => o.kind === "regulation").length;
  const tsk = view.obls.filter((o) => o.kind === "task").length;
  const { label } = periodRange();

  const src = DATA.sources.reglament || {};
  const curMon = `${DATA.period.year}-${pad2(DATA.period.month)}`;
  const monName = (m) => {
    const [yy, mm] = m.split("-").map(Number);
    return `${MON_RU[mm - 1]} ${yy}`;
  };
  /* Блока текущего месяца в Google-таблице нет — цикл за месяц пуст, и
     сказать это надо и на текущем периоде: сами собой такие дыры не
     закрываются, блок добавляют руками. */
  const missing = src.missing_current && periodRange().to >= curMon;
  const missTxt = missing ? `В таблице цикла нет блока «${esc(DATA.period.label)}» — цикл
    производства за ${esc(MON_RU[DATA.period.month - 1])} не считается, пока блок не добавят
    в Google-таблицу.` : "";

  if (STATE.period === "cur") {
    box.hidden = !missing;
    if (missing) box.innerHTML = missTxt;
    return;
  }
  box.hidden = false;

  /* За какие месяцы периода цикл есть. История копится с августа 2026 —
     окно, уходящее раньше, без оговорки выглядело бы посчитанным целиком. */
  const regMon = [...new Set(view.obls
    .filter((o) => o.kind === "regulation")
    .map((o) => o.month || (o.due || "").slice(0, 7)))].filter(Boolean).sort();
  const months = DATA.months || [];
  const first = months.length ? months[0].month : "";
  const since = first && periodRange().from.slice(0, 7) < first
    ? ` Цикл производства хранится с ${MON_GEN[+first.slice(5, 7) - 1]} ${first.slice(0, 4)} —
      раньше его не сохраняли.`
    : "";
  const open = months.filter((m) => !m.frozen_at && regMon.includes(m.month) && m.month < curMon);
  const grace = src.grace_days || 5;
  const openTxt = open.length ? ` ${open.map((m) => monName(m.month)).join(", ")} ещё
    досдают — закроется ${grace}-го числа, до этого «Да» задним числом засчитываются.` : "";
  const mxTxt = regMon.length > 1 && STATE.mx
    ? ` Таблица пунктов — за ${monName(regMon[regMon.length - 1])}.` : "";

  box.innerHTML = (!reg
    ? `<b>${esc(label)}</b> · только задачи из загруженных таблиц.`
    : `<b>${esc(label)}</b> · дел ${reg + tsk}: задач ${tsk},
       цикл производства — ${regMon.map(monName).join(", ")}.`) + since + openTxt + mxTxt +
    (missTxt ? " " + missTxt : "");
}

/* Плашка «данных пока мало» (заказчик, 05.10.2026: «сделай плашку или
   строку, подсказку, что пока недостаточно данных»). В начале месяца у
   всех меньше LOW_N дел с наступившим сроком, оба списка уходят в «Вне
   рейтинга», и пустой экран читался как поломка. Плашка говорит, почему
   пусто, когда заполнится — ближайшие сроки цикла, свод задач — и даёт
   открыть прошлый месяц. Видна, только когда в списке мастеров или офиса
   нет ни одного места. */
const HINT_IC = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3.5h10M7 20.5h10"/><path
  d="M8 3.5c0 4.2 8 4.6 8 8.5s-8 4.3-8 8.5M16 3.5c0 4.2-8 4.6-8 8.5s8 4.3 8 8.5"/></svg>`;

function renderRateHint(view) {
  const box = $("#rateHint");
  if (!box) return;
  const nOf = (p) => metric(view.byPerson[p.person_key] || []).n;
  const ms = mastersOf(view), os = othersOf(view);
  const mEmpty = ms.length > 0 && !ms.some((p) => nOf(p) >= LOW_N);
  const oEmpty = os.length > 0 && !os.some((p) => nOf(p) >= LOW_N);
  if (!mEmpty && !oEmpty) { box.hidden = true; box.innerHTML = ""; return; }

  const y = DATA.period.year, m = DATA.period.month;
  const curMon = `${y}-${pad2(m)}`;
  const { from, to } = periodRange();
  const isCur = from.slice(0, 7) === curMon && to.slice(0, 7) === curMon;
  const today = `${curMon}-${pad2(DATA.period.day_now || 1)}`;
  const mon = MON_RU[m - 1];
  const Mon = mon[0].toUpperCase() + mon.slice(1);
  const perName = isCur ? mon : periodRange().label;

  const title = mEmpty && oEmpty
    ? (isCur && (DATA.period.day_now || 1) <= 15 ? `${Mon} только начался — данных для рейтинга пока мало`
      : `За ${perName} пока мало данных для рейтинга`)
    : mEmpty ? "Мастера пока вне рейтинга — мало дел с наступившим сроком"
    : "Офис и ИТР пока вне рейтинга — мало задач с наступившим сроком";

  const parts = [];
  if (mEmpty) {
    const most = Math.max(0, ...ms.map(nOf));
    let s1 = `Место в рейтинге — от ${LOW_N} дел с наступившим сроком, у мастеров пока ${
      most ? `не больше ${most} ${plural(most, "дела", "дел", "дел")}` : "ни одного"}`;
    if (isCur) {
      const keys = new Set(ms.map((p) => p.person_key));
      const days = [...new Set(view.obls
        .filter((o) => o.kind === "regulation" && o.status === "pending" && keys.has(o.person_key)
          && (o.due || "") > today)
        .map((o) => +(o.due || "").slice(8, 10)))].sort((a, b) => a - b).slice(0, 3);
      if (days.length) {
        s1 += `. Ближайшие сроки цикла — ${days.length > 1
          ? days.slice(0, -1).join(", ") + " и " + days[days.length - 1] : days[0]} ${MON_GEN[m - 1]}`;
      }
    }
    parts.push(s1);
  }
  if (oEmpty) {
    const tasks = view.obls.some((o) => o.kind === "task");
    parts.push(tasks ? "у офиса и ИТР задач с наступившим сроком пока мало"
      : `задачи офиса и ИТР появятся после загрузки свода за ${perName} в «Данные»`);
  }
  const text = parts.map((x) => x[0].toUpperCase() + x.slice(1)).join(". ") + ".";

  // Прошлый месяц — одной кнопкой, когда смотрят текущий и за прошлый данные есть.
  let prev = "";
  if (isCur) {
    const pm = m === 1 ? `${y - 1}-12` : `${y}-${pad2(m - 1)}`;
    if (availableMonths().includes(pm)) prev = pm;
  }
  box.innerHTML = `<span class="rh-ic">${HINT_IC}</span>
    <span class="rh-t"><b>${esc(title)}</b><span>${esc(text)}</span></span>
    ${prev ? `<button type="button" class="rh-go" data-period="m:${prev}">Смотреть ${
      MON_RU[+prev.slice(5, 7) - 1]}</button>` : ""}`;
  box.hidden = false;
  const go = box.querySelector(".rh-go");
  if (go) {
    go.addEventListener("click", () => {
      STATE.period = go.dataset.period;
      // Список месяцев — заново: в нём должен стоять выбранный месяц.
      buildFilters();
      writeURL();
      renderAll();
    });
  }
}

/* ── отделы и руководители (заказчик, 29.09.2026) ─────────────
   Успеваемость отдела — все дела его людей за период, сложенные вместе
   (как и везде: дела, а не проценты — у кого дел больше, тот и весит
   больше). Руководителю — половина свои дела, половина дела остальных
   людей отдела: он отвечает и за себя, и за отдел. Своих дел нет — итог
   по отделу, у отдела нет — по своим.

   Производство — отдел из участков. У участка начальник (в штате —
   «Начальник ЭМУ»), его итог — свои дела пополам с делами мастеров
   участка. Производство целиком — у технического директора: его
   сборщик ставит руководителем, даже если в штате тот записан в АУП.

   Кто руководит: по должности (сборщик, head_auto) либо назначен руками
   в этом блоке (BANDS.heads — свежее файла, который пересобирается раз в
   минуту). Витрина и те, кому окно недоступно, берут итог сборщика. */
function headOf(d) {
  const manual = BANDS && BANDS.heads ? BANDS.heads[d.name] : "";
  if (manual) return manual;
  if (BANDS && BANDS.heads && d.head_auto !== undefined) return d.head_auto || null;
  return d.head_key || null;
}

/* Участки: подпись из таблицы цикла или назначенная («Павлов А.») →
   начальник по ключу подписи и мастера участка. */
function bandUnits() {
  const out = new Map();
  for (const p of DATA.people) {
    if (!p.sheet_name || !p.band || p.band === "—") continue;
    if (!out.has(p.band)) out.set(p.band, { label: p.band, head: fioKey(p.band), members: [] });
    out.get(p.band).members.push(p.person_key);
  }
  return [...out.values()].sort((a, b) => a.label.localeCompare(b.label, "ru"));
}

function headKeys() {
  const set = new Set();
  for (const d of DATA.depts || []) {
    const k = headOf(d);
    if (k) set.add(k);
  }
  for (const u of bandUnits()) if (u.head) set.add(u.head);
  return set;
}

function headScore(own, team) {
  const o = own.n ? own.ok / own.n : null;
  const t = team.n ? team.ok / team.n : null;
  const v = o === null ? t : t === null ? o : (o + t) / 2;
  return { pct: v === null ? null : Math.round(v * 100), own, team };
}

/* Вкладка «Отделы» (30.09.2026) — дерево: отдел → (участки →) люди.
   Строка отдела — успеваемость всех его людей и итог руководителя;
   нажатие раскрывает отдел. У Производства сначала участки: строка
   участка — его мастера и итог начальника участка, она раскрывается до
   мастеров. Места — внутри своей группы; «вне рейтинга» свёрнуто в
   конце группы, как в «Сотрудниках». */
function deptModel(view) {
  const depts = DATA.depts || [];
  const byKey = new Map(DATA.people.map((p) => [p.person_key, p]));
  const oblsOf = (keys) => keys.flatMap((k) => view.byPerson[k] || []);
  const inRate = (keys) => keys.filter((k) => metric(view.byPerson[k] || []).n).length;
  const byName = (a, b) => nameOf(a.p).localeCompare(nameOf(b.p), "ru");
  const rankList = (keys) => {
    const rows = keys.map((k) => byKey.get(k)).filter(Boolean)
      .map((p) => ({ p, ...threeNumbers(view.byPerson[p.person_key] || []) }));
    const top = rows.filter((r) => r.total.n >= LOW_N)
      .sort((a, b) => (b.total.pct - a.total.pct) || (b.total.n - a.total.n) || byName(a, b))
      .map((r, i) => ({ ...r, rank: i + 1 }));
    const low = rows.filter((r) => r.total.n < LOW_N).sort(byName).map((r) => ({ ...r, rank: null }));
    return { top, low };
  };
  const pctOr = (m) => (m.pct === null ? -1 : m.pct);

  // Участок — к тому отделу, где большинство его мастеров (это
  // Производство); мастера без отдела в штате — туда же, где остальные.
  const unitsOf = new Map();
  for (const u of bandUnits()) {
    const n = new Map();
    for (const k of u.members) {
      const d = (byKey.get(k) || {}).dept;
      if (d) n.set(d, (n.get(d) || 0) + 1);
    }
    const best = [...n.entries()].sort((a, b) => b[1] - a[1])[0];
    const dept = best ? best[0]
      : (depts.find((d) => d.name.toLowerCase() === "производство") || {}).name;
    if (!dept) continue;
    if (!unitsOf.has(dept)) unitsOf.set(dept, []);
    unitsOf.get(dept).push(u);
  }

  const model = depts.map((d) => {
    const head = headOf(d);
    const units = (unitsOf.get(d.name) || []).map((u) => {
      const mem = u.members.filter((k) => k !== u.head);
      return {
        u, mem, m: metric(oblsOf(mem)),
        hs: headScore(metric(view.byPerson[u.head] || []), metric(oblsOf(mem))),
        list: rankList(mem),
      };
    }).sort((a, b) => (pctOr(b.m) - pctOr(a.m)) || a.u.label.localeCompare(b.u.label, "ru"));
    const inUnits = new Set(units.flatMap((x) => [...x.mem, x.u.head]));
    const team = d.members.filter((k) => k !== head);
    return {
      d, head, units,
      m: metric(oblsOf(d.members)), rated: inRate(d.members),
      hs: head ? headScore(metric(view.byPerson[head] || []), metric(oblsOf(team))) : null,
      list: rankList(d.members.filter((k) => k !== head && !inUnits.has(k))),
    };
  });
  const byDept = (a, b) => a.d.name.localeCompare(b.d.name, "ru");
  const ranked = model.filter((r) => r.m.n >= LOW_N)
    .sort((a, b) => (b.m.pct - a.m.pct) || (b.m.n - a.m.n) || byDept(a, b))
    .map((r, i) => ({ ...r, rank: i + 1 }));
  const low = model.filter((r) => r.m.n < LOW_N).sort(byDept).map((r) => ({ ...r, rank: null }));
  return ranked.concat(low);
}

function renderDepts(view) {
  const card = $("#depts"), body = $("#depts-body");
  if (!card || !body) return;
  body.classList.remove("skel-lines");
  const model = deptModel(view);
  const cnt = $("#deptsCnt");
  if (cnt) cnt.textContent = model.length || "";
  if (!model.length) {
    body.innerHTML = `<div class="empty-note eff-empty">Отделов нет: их берут из справочника
      штата («Справочники → Сотрудники»).</div>`;
    return;
  }
  const byKey = new Map(DATA.people.map((p) => [p.person_key, p]));
  const can = !!(BANDS && BANDS.can_data) && !isTV();
  const phone = PHONE_MX();
  const keys = [];
  for (const r of model) {
    keys.push("d:" + r.d.name);
    for (const x of r.units) keys.push("u:" + x.u.label);
  }
  const allOpen = keys.length && keys.every((k) => UI.open.has(k));
  const ab = $("#deptsAll");
  if (ab) ab.textContent = allOpen ? "Свернуть все" : "Развернуть все";

  const pname = (k, fallback) => {
    const p = byKey.get(k);
    return p ? shortName(nameOf(p)) : (fallback || k);
  };
  const part = (label, m) => `${label} <b class="num">${pctText(m)}</b>${
    m.n ? ` <i class="num">${m.ok} из ${m.n}</i>` : ""}`;
  // Итог руководителя и из чего он: «свои · отдел». Нет своих дел — так
  // и написано, чтобы ровный процент отдела не читался личным.
  const headHTML = (key, hs, teamWord, dept, fallback) => {
    if (!key) {
      return `<span class="dp-none">руководитель не определён${can && dept
        ? ` — <button type="button" class="lnk" data-dp-head="${esc(dept)}">назначить</button>` : ""}</span>`;
    }
    const who = `<b>${esc(pname(key, fallback))}</b><span class="dp-hpct num">${pctText(hs)}</span>`;
    return `${can && dept ? `<button type="button" class="dp-hbtn" data-dp-head="${esc(dept)}"
        title="Сменить руководителя отдела">${who}</button>` : `<span class="dp-hbtn">${who}</span>`}
      <span class="dp-hsub">${hs.own.n ? part("свои", hs.own) : "своих дел нет"} · ${
        part(teamWord, hs.team)}</span>`;
  };
  const chev = (key, open) => `<span class="tree-tg${open ? " on" : ""}" aria-hidden="true">
    <svg viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg></span>`;
  const people = (n) => `${n} ${plural(n, "человек", "человека", "человек")}`;
  const srcOf = (r) => (r.reg.n ? srcLines(r, "цикл", "задачи") : "");
  const pos = (p) => p.pos || "должность не указана";

  // Люди группы: места, затем «вне рейтинга» свёрнутым.
  const listRows = (list, foldKey, lv, word) => {
    const open = !!UI.fold[foldKey];
    const fold = list.low.length ? { fold: foldKey, n: list.low.length, open } : null;
    const rows = list.top.concat(fold ? [fold] : []).concat(open ? list.low : []);
    if (!rows.length) {
      return phone ? `<div class="dpt-empty lv${lv}">людей с делами нет</div>`
        : `<tr class="dp-person lv${lv}"><td colspan="4" class="dpt-empty">людей с делами нет</td></tr>`;
    }
    return rows.map((r) => {
      if (r.fold) return foldHTML(r, word, phone ? 0 : 4, "lv" + lv);
      const low = r.rank === null ? " m-low" : "";
      const fio = nameOf(r.p);
      if (phone) {
        return `<div class="mxp-row dpt-p lv${lv}${low}">
          <span class="mxp-rank num">${r.rank === null ? "—" : r.rank}</span>
          <span class="av-i">${esc(initials(fio))}</span>
          <span class="mxp-who"><b>${esc(fio)}</b><i>${esc(pos(r.p))}</i></span>
          <span class="mxp-pct"><b class="num">${pctText(r.total)}</b><i class="num">${r.total.ok} из ${r.total.n}</i></span>
        </div>`;
      }
      return `<tr class="dp-person lv${lv}${low}">
        <td class="m-rank"><span class="rank num">${r.rank === null ? "—" : r.rank}</span></td>
        <td class="m-who"><span class="mwrap tree-l${lv}"><span class="av-i">${esc(initials(fio))}</span>
          <span class="mw"><b>${esc(fio)}</b><span>${esc(pos(r.p))}</span></span>${awBadges(r.p.person_key)}</span></td>
        <td class="m-pct"><span class="r-pct num">${pctText(r.total)}</span>${barHTML(r.total, "mini")}
          <span class="r-count num">${r.total.ok} из ${r.total.n}</span></td>
        <td class="m-src">${srcOf(r)}</td>
      </tr>`;
    }).join("");
  };

  const groupRow = (key, rank, lv, title, sub, m, headCell, av) => {
    const open = UI.open.has(key);
    const low = rank === null ? " m-low" : "";
    if (phone) {
      return `<div class="mxp-row dpt-g lv${lv}${low}" data-row="${esc(key)}" role="button"
          tabindex="0" aria-expanded="${open}">
        ${chev(key, open)}
        <span class="mxp-rank num">${rank === null ? "—" : rank}</span>
        <span class="mxp-who"><b>${esc(title)}</b><i>${esc(sub)}</i><span class="dp-h">${headCell}</span></span>
        <span class="mxp-pct"><b class="num">${pctText(m)}</b><i class="num">${m.n ? `${m.ok} из ${m.n}` : "дел нет"}</i></span>
      </div>`;
    }
    return `<tr class="dp-g lv${lv}${low}${lv ? "" : " m-first"}" data-row="${esc(key)}" tabindex="0"
        aria-expanded="${open}">
      <td class="m-rank"><span class="rank num">${rank === null ? "—" : rank}</span></td>
      <td class="m-who"><span class="mwrap tree-l${lv}">${chev(key, open)}${av ? `<span class="av-i dp-av">${esc(av)}</span>` : ""}
        <span class="mw"><b>${esc(title)}</b><span>${esc(sub)}</span></span></span></td>
      <td class="m-pct"><span class="r-pct num">${pctText(m)}</span>${barHTML(m, "mini")}
        <span class="r-count num">${m.n ? `${m.ok} из ${m.n}` : "дел нет"}</span></td>
      <td class="dp-head">${headCell}</td>
    </tr>`;
  };
  const deptAv = (name) => {
    const w = String(name).trim().split(/\s+/);
    return (w.length > 1 ? w[0][0] + w[1][0] : w[0].slice(0, 2)).toUpperCase();
  };

  const out = [];
  for (const r of model) {
    const key = "d:" + r.d.name;
    const all = r.d.members.length;
    out.push(groupRow(key, r.rank, 0, r.d.name,
      people(all) + (r.rated < all ? ` · в оценке ${r.rated}` : ""), r.m,
      headHTML(r.head, r.hs, "отдел", r.d.name), deptAv(r.d.name)));
    if (!UI.open.has(key)) continue;
    r.units.forEach((x, i) => {
      const uk = "u:" + x.u.label;
      out.push(groupRow(uk, x.m.n >= LOW_N ? i + 1 : null, 1, "уч. " + x.u.label,
        `${x.mem.length} ${plural(x.mem.length, "мастер", "мастера", "мастеров")}`, x.m,
        headHTML(byKey.has(x.u.head) ? x.u.head : "", x.hs, "участок", "", x.u.label)));
      if (UI.open.has(uk)) {
        out.push(listRows(x.list, "fu:" + x.u.label, 2, (n) => plural(n, "мастер", "мастера", "мастеров")));
      }
    });
    if (r.units.length && (r.list.top.length || r.list.low.length)) {
      out.push(phone ? `<div class="dpt-sub lv1">Остальные в отделе</div>`
        : `<tr class="dpt-subrow"><td colspan="4">Остальные в отделе</td></tr>`);
    }
    if (!r.units.length || r.list.top.length || r.list.low.length) {
      out.push(listRows(r.list, "fd:" + r.d.name, 1));
    }
  }

  if (phone) {
    body.innerHTML = `<div class="mxp dp-list">
      <div class="mxp-head"><span>Отдел · руководитель</span><span>Успеваемость</span></div>
      ${out.join("")}
    </div>`;
    return;
  }
  body.innerHTML = `<table class="mx mx-body dp-table" style="width:100%">
    <colgroup><col style="width:${listW().rank}px"><col style="width:${listW().who + 44}px">
      <col style="width:${listW().pct}px"><col></colgroup>
    <thead><tr><th colspan="2">Отдел</th><th>Успеваемость</th>
      <th>Руководитель</th></tr></thead>
    <tbody>${out.join("")}</tbody>
  </table>`;
}

/* Руководитель отдела руками — у кого право «Данные рейтинга». По
   умолчанию сборщик берёт его по должности; здесь поправляют, если
   должности в справочнике записаны не так или отдел ведёт не начальник. */
function openHeadModal(deptName) {
  const d = (DATA.depts || []).find((x) => x.name === deptName);
  if (!d || !(BANDS && BANDS.can_data)) return;
  const cur = (BANDS.heads && BANDS.heads[d.name]) || "";
  const byKey = new Map(DATA.people.map((p) => [p.person_key, p]));
  const autoP = d.head_auto ? byKey.get(d.head_auto) : null;
  const autoTxt = autoP ? `${nameOf(autoP)}${autoP.pos ? ", " + autoP.pos : ""}` : "по должностям не нашёлся";
  const ru = (a, b) => nameOf(a).localeCompare(nameOf(b), "ru");
  const mem = new Set(d.members);
  const inDept = DATA.people.filter((p) => mem.has(p.person_key)).sort(ru);
  const rest = DATA.people.filter((p) => !mem.has(p.person_key) && p.match !== "table").sort(ru);
  const opt = (p) => `<option value="${esc(p.person_key)}"${p.person_key === cur ? " selected" : ""}>${
    esc(nameOf(p))}${p.pos ? " — " + esc(p.pos) : ""}</option>`;
  const box = document.createElement("div");
  box.className = "pf-modal";
  box.innerHTML = `
    <div class="pf-crop cnt-card band-card" role="dialog" aria-label="Руководитель отдела">
      <h3>Руководитель: ${esc(d.name)}</h3>
      <div class="fld"><label for="dpHeadSel">Кто руководит</label>
        <select id="dpHeadSel">
          <option value="">По должности — ${esc(autoTxt)}</option>
          <optgroup label="${esc(d.name)}">${inDept.map(opt).join("")}</optgroup>
          ${rest.length ? `<optgroup label="Другие отделы">${rest.map(opt).join("")}</optgroup>` : ""}
        </select></div>
      <div class="band-why">Итог руководителя — половина его дела, половина дела остальных
        людей отдела. Меняется со следующей пересборкой, в течение минуты.</div>
      <div class="band-err" hidden></div>
      <div class="pf-modal-foot"><span class="grow"></span>
        <button type="button" class="btn ghost" data-no>Отмена</button>
        <button type="button" class="btn" data-ok>Сохранить</button></div>
    </div>`;
  document.body.appendChild(box);
  const close = () => { document.removeEventListener("keydown", onKey); box.remove(); };
  const onKey = (e) => { if (e.key === "Escape") close(); };
  document.addEventListener("keydown", onKey);
  box.addEventListener("click", (e) => { if (e.target === box) close(); });
  box.querySelector("[data-no]").addEventListener("click", close);
  box.querySelector("[data-ok]").addEventListener("click", async () => {
    const err = box.querySelector(".band-err");
    try {
      await AUTH.api("POST", "/rating/heads",
        { dept: d.name, person_key: box.querySelector("#dpHeadSel").value });
      close();
      await loadBands();
      renderAll();
    } catch (e) {
      err.textContent = "Не сохранилось: " + e.message;
      err.hidden = false;
    }
  });
}

/* Итоги строкой над списками (30.09.2026): всегда на виду, без
   выключателя. Большие карточки показателей остались витрине.

   Вид — таблицей во всю ширину, четыре клетки через черту (плитки на
   сером пользователь забраковал: «островками», и строка отрывалась от
   фильтров и списков). Первая клетка шире: полукруглая шкала от
   красного через жёлтый к зелёному, заполненная до доли сделанного в
   срок, процент — внутри, рядом сдвиг к прошлому периоду и состав
   цветными точками. У остальных — процент, сдвиг и полоса того же
   состава. Перерисовка только при смене цифр: поиск перерисовывает всё
   на каждую букву, и шкала с полосами иначе заново «нарастали» бы. */
const statGauge = (m) => {
  const f = m.n ? m.ok / m.n : 0;
  const a = Math.PI * (1 - f);
  const x = (60 + 50 * Math.cos(a)).toFixed(2), y = (62 - 50 * Math.sin(a)).toFixed(2);
  const lvl = m.pct === null ? "" : m.pct >= 80 ? "ok" : m.pct >= 50 ? "late" : "over";
  const arc = "M10 62A50 50 0 0 1 110 62";
  return `<span class="st-gauge ${lvl}">
    <svg viewBox="0 0 120 70" aria-hidden="true">
      <defs><linearGradient id="stGaugeG" gradientUnits="userSpaceOnUse" x1="10" y1="0" x2="110" y2="0">
        <stop offset="0" style="stop-color:var(--bad)"/><stop offset=".5" style="stop-color:var(--warn)"/>
        <stop offset="1" style="stop-color:var(--ok)"/></linearGradient></defs>
      <path class="trk" d="${arc}"/>
      ${m.ok ? `<path class="val" d="${arc}" pathLength="100" stroke-dasharray="${(f * 100).toFixed(1)} 100"/>` : ""}
      ${m.n ? `<circle class="knob" cx="${x}" cy="${y}" r="6"/>` : ""}
    </svg>
    <span class="st-gv num">${pctText(m)}</span>
  </span>`;
};
const statBar = (m, parts) => (m.n ? `<span class="st-bar3">${parts.map(([x, cls]) => (x
  ? `<i class="${cls}" style="width:${(x / m.n * 100).toFixed(1)}%"></i>` : "")).join("")}</span>`
  : `<span class="st-bar3"></span>`);
const ST_IC = {
  reg: '<path d="M4.5 12a7.5 7.5 0 0 1 12.8-5.3L19.5 9"/><path d="M19.5 4.5V9H15"/><path d="M19.5 12a7.5 7.5 0 0 1-12.8 5.3L4.5 15"/><path d="M4.5 19.5V15H9"/>',
  tsk: '<rect x="4.5" y="4.5" width="15" height="15" rx="3"/><path d="M8.5 12.2l2.4 2.4 4.6-4.9"/>',
  late: '<circle cx="12" cy="12" r="8"/><path d="M12 7.5V12l3 2"/>',
};

function renderStats(view, prev) {
  const box = $("#effStats");
  if (!box) return;
  const { reg, tsk, total } = threeNumbers(view.obls);
  const p = prev ? threeNumbers(prev.obls) : null;
  const pr = prevRange();
  const sig = JSON.stringify([total, reg, tsk, p && [p.total.pct, p.reg.pct, p.tsk.pct, p.total.n], pr.label]);
  if (box.dataset.sig === sig) return;
  box.dataset.sig = sig;
  const bad = total.late + total.over;
  // Сдвиг к прошлому периоду — в процентах доли; за прошлый период дел
  // не было — не показываем: сравнивать не с чем.
  const delta = (m, pm) => {
    if (!pm || !pm.n || m.pct === null) return "";
    const d = m.pct - pm.pct;
    const cls = d > 0 ? "up" : d < 0 ? "down" : "same";
    return `<span class="st-d ${cls}" title="${esc(`Было ${pm.pct}% ${pr.full}`)}">${
      d > 0 ? "▲ " + d + "%" : d < 0 ? "▼ " + -d + "%" : "="}<i>${esc(pr.label)}</i></span>`;
  };
  const ic = (k) => `<svg class="st-ic" viewBox="0 0 24 24" aria-hidden="true">${ST_IC[k]}</svg>`;
  const dot = (cls, n, t) => `<span class="st-k"><i class="${cls}"></i>${n} ${t}</span>`;
  const mini = (k, lab, m, sub, d, cls) => `<div class="eff-st${cls ? " " + cls : ""}">
    <span class="st-l">${ic(k)}${lab}</span>
    <span class="st-row"><span class="st-v num">${m === null ? "" : pctText(m)}</span>${d || ""}</span>
    ${m === null ? "" : statBar(m, [[m.ok, "ok"], [m.late, "late"], [m.over, "over"]])}
    <span class="st-s">${sub}</span></div>`;
  box.innerHTML = `<div class="eff-st st-main">
      ${statGauge(total)}
      <span class="st-main-t">
        <span class="st-l">Успеваемость</span>
        ${delta(total, p && p.total)}
        <span class="st-s">${total.n ? dot("ok", total.ok, "в срок") + dot("late", total.late, "с опозданием") +
          dot("over", total.over, "просрочено") : "дел с наступившим сроком нет"}</span>
      </span>
    </div>` +
    mini("reg", 'Цикл<span class="st-lx"> производства</span>', reg, reg.n ? `${reg.ok} из ${reg.n} пунктов` : "пунктов за период нет",
      delta(reg, p && p.reg)) +
    mini("tsk", "Задачи", tsk, tsk.n ? `${tsk.ok} из ${tsk.n} в срок` : tablesNote(), delta(tsk, p && p.tsk)) +
    `<div class="eff-st${bad ? " st-warn" : " st-good"}">
      <span class="st-l">${ic("late")}Не в срок</span>
      <span class="st-row"><span class="st-v num">${bad}</span>${total.n ? `<span class="st-of">из ${total.n}</span>` : ""}</span>
      ${statBar(total, [[total.late, "late"], [total.over, "over"]])}
      <span class="st-s">${bad ? `опоздали ${total.late} · просрочено ${total.over}` : "всё сдано вовремя"}</span>
    </div>`;
}

/* Награды считаются один раз на перерисовку и до неё: обе таблицы
   спрашивают готовый ответ по ключу человека. Считать их внутри
   отрисовки нельзя — кубок зависит от всей группы, а строка знает
   только про себя. */
function computeAwards(view) {
  if (!window.Awards) return;
  const row = (p, m, name) => ({
    key: p.person_key, name, ok: m.ok, n: m.n, pct: m.pct,
  });
  window.Awards.compute([
    {
      id: "masters",
      rows: mastersOf(view).map((p) =>
        row(p, threeNumbers(view.byPerson[p.person_key] || []).total, p.sheet_name)),
    },
    {
      id: "others",
      rows: othersOf(view).map((p) =>
        row(p, metric(view.byPerson[p.person_key] || []), nameOf(p))),
    },
  ], LOW_N);
}

const awBadges = (key) => (window.Awards ? window.Awards.badgesHTML(key) : "");

/* Ставится в wireAwardTip; до её вызова убирать нечего. */
let closeAwardTip = () => {};

function renderAll() {
  const view = currentView();
  closeAwardTip();
  computeAwards(view);
  renderPeriodNote();
  const sec = $("#sec-emp");
  if (sec && !isTV()) {
    // «Отделы» — всегда по всей компании: фильтр отдела и участка
    // относится к «Сотрудникам».
    const all = STATE.band || STATE.dept ? currentView("", "") : view;
    const depts = STATE.tab === "depts";
    sec.dataset.tab = STATE.tab;
    $("#effPeople").hidden = depts;
    $("#effDepts").hidden = !depts;
    document.querySelectorAll("[data-eff]").forEach((b) =>
      b.setAttribute("aria-selected", String(b.dataset.eff === STATE.tab)));
    const mt = $("#mxToggle");
    if (mt) mt.setAttribute("aria-pressed", String(!!STATE.mx));
    const bb = depts ? "" : STATE.band, bd = depts ? "" : STATE.dept;
    renderStats(depts ? all : view, currentView(bb, bd, prevRange()));
    renderRateHint(depts ? all : view);
    if (depts) renderDepts(all);
    else { renderMasters(view); renderOthers(view); }
    return;
  }
  renderMasters(view);
  renderOthers(view);
  /* Витрина режет список на страницы по живым высотам строк — значит
     пересобирать их надо после каждой перерисовки, иначе страницы
     останутся от прежней таблицы. */
  if (isTV() && typeof window.tvRepage === "function") window.tvRepage();
}

/* ── часы и свежесть данных ───────────────────────────────────
   Возраст считается от метки внутри данных, а не от загрузки страницы:
   иначе, если сборка остановится, экран будет бодро показывать
   «0 минут назад» на протухших цифрах. Пороги — под вашу периодичность
   пересборки obligations.json. */
/* Пороги свежести у источников разные, потому что и обновляются они
   по-разному: таблица цикла тянется кроном каждую минуту, таблицы задач
   отделов загружают руками — раз в неделю это норма. Считать их одной
   меркой нельзя: недельная таблица задач — порядок, получасовая таблица
   цикла — авария.

   Не FRESH: так называется модуль обновления вкладки (src/fresh.js), и
   top-level const в обычном скрипте перекрывает window.FRESH для всех
   остальных файлов. С 10.09 из-за этого падали загрузка документов и
   подтягивание цен — FRESH.hold() находил эти пороги, а не модуль. */
const SOURCE_FRESH = {
  reglament: { label: "Таблица", ok: 5, warn: 20 },
  tables: { label: "Таблицы задач", ok: 8 * 1440, warn: 35 * 1440 },
};
const REFRESH_MS = 5 * 60 * 1000;

function ageText(min) {
  if (min < 1) return "только что";
  if (min < 60) return `${min} ${plural(min, "минуту", "минуты", "минут")} назад`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} ${plural(h, "час", "часа", "часов")} назад`;
  const d = Math.floor(h / 24);
  return `${d} ${plural(d, "день", "дня", "дней")} назад`;
}

function tick() {
  const now = new Date();
  const p = (n) => String(n).padStart(2, "0");

  const lv = $("#live");
  if (lv) lv.innerHTML =
    `<span class="clock"><b>${p(now.getHours())}:${p(now.getMinutes())}</b>` +
    `<i>${p(now.getSeconds())}</i></span>`;

  renderFresh(now);
}

/* Свежесть по каждому источнику отдельно. Значок молчит, пока всё в
   порядке, и желтеет либо краснеет по худшему из источников — иначе
   протухшая таблица снова пройдёт незамеченной, как 20 августа. */
function renderFresh(now) {
  const box = $("#fresh");
  if (!DATA || !DATA.sources) { box.hidden = true; return; }
  box.hidden = false;

  const rows = [];
  let worst = "ok";
  for (const key of ["reglament", "tables"]) {
    const src = DATA.sources[key];
    const cfg = SOURCE_FRESH[key];
    if (!src || !src.fetched_at) continue;
    // Метка таблицы без часового пояса — считается как местное время,
    // сервер и пользователи в одном поясе (Екатеринбург).
    const min = Math.max(0, Math.round((now - new Date(src.fetched_at)) / 60000));
    const cls = min <= cfg.ok ? "ok" : min <= cfg.warn ? "warn" : "bad";
    if (cls === "bad" || (cls === "warn" && worst === "ok")) worst = cls;
    rows.push(`<div class="fp-row">
      <i class="fp-dot ${cls}"></i>
      <span class="fp-name">${cfg.label}</span>
      <span class="fp-time num">${key === "tables" ? fmtStamp(src.fetched_at).slice(0, 5)
        : fmtStamp(src.fetched_at).slice(6)}</span>
      <span class="fp-age">${ageText(min)}</span>
    </div>`);
  }

  box.classList.toggle("warn", worst === "warn");
  box.classList.toggle("bad", worst === "bad");
  $("#fresh-pop").innerHTML =
    `<div class="fp-title">Данные обновлялись</div>${rows.join("")}` +
    (SOURCE_MODE ? `<div class="fp-note">${esc(SOURCE_MODE)}</div>` : "");
}

/* ── тема ─────────────────────────────────────────────────────
   Выбор запоминается; при первом заходе берём системную. */
const THEME_KEY = "karkas-theme";

function applyTheme(t) {
  document.documentElement.dataset.theme = t;
  const btn = $("#theme-btn");          // на витрине переключателя нет
  if (btn) btn.setAttribute("aria-pressed", t === "dark" ? "true" : "false");
}
// Личному кабинету нужно показывать тему сразу при выборе, до сохранения.
window.applyTheme = applyTheme;

function wireTheme() {
  let saved = null;
  try { saved = localStorage.getItem(THEME_KEY); } catch (e) { /* приватный режим */ }
  // Тему, которую уже поставила строка в <head>, не перебиваем: в
  // демо-сборке она тёмная по умолчанию, а не по настройке системы.
  applyTheme(saved || document.documentElement.dataset.theme ||
    (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"));

  const btn = $("#theme-btn");
  if (!btn) return;
  btn.addEventListener("click", () => {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    try { localStorage.setItem(THEME_KEY, next); } catch (e) { /* не критично */ }
    applyTheme(next);
    /* И на сервер — иначе тема хранилась бы в двух местах и они
       расходились бы: при следующем входе профиль перебивал бы то, что
       человек только что выбрал этой кнопкой. Тихо: переключатель темы
       не то место, где уместно сообщать об ошибках сети. */
    if (!isTV() && AUTH.current()) {
      AUTH.updateMe({ theme: next }).then(() => {
        if (typeof PROFILE === "object") PROFILE.refresh();
      }).catch(() => {});
    }
  });
}

/* Витрина — не режим страницы, а отдельный адрес tv.html. Класс стоит
   в разметке с самого начала, переключать нечего: так на экран в
   столовой физически не может попасть ничего из закрытых разделов. */
const isTV = () => document.body.classList.contains("tv");

/* ── разделы платформы ────────────────────────────────────── */
const SECTIONS = {
  msg: { t: "Мессенджер", s: "личная и групповая переписка сотрудников" },
  emp: { t: "Эффективность", s: "рейтинг сотрудников, отделов и участков" },
  me: { t: "Мой профиль", s: "личные данные, доступ, мои показатели" },
  /* Объекты и спецификации разведены намеренно. «Объекты» — папка
     стройки с договорами, проектами и бумагами; «Спецификации» —
     разобранные позиции и движения по ним. Раньше это был один раздел,
     и в нём под именем договоров лежали марки проектной документации. */
  /* «Тендер» (07.10.2026) — объекты, которые ещё считают, и данные для
     расчёта. Выигранные переходят в «Объекты». */
  tnd: { t: "Тендер", s: "объекты в тендере, прайс работ, настройки расчёта" },
  /* «Снабжение» (07.10.2026) — проработка калькуляций, дальше заявки. */
  snb: { t: "Снабжение", s: "проработка: цены поставщиков и счета, выбор по приведённой стоимости" },
  /* «Финансы» (08.10.2026) — бюджет объекта: договор, закупка, факт. */
  fin: { t: "Финансы", s: "бюджет объектов, параметры для расчёта — % ВКЛ" },
  sit: { t: "Объекты", s: "выигранные объекты: договор, ПТО, файлы" },
  /* Заявки на материалы (22.10.2026): с объекта по спецификации, по
     маршруту согласования, к снабжению — свод, заказ, склад, выдача. */
  req: { t: "Заявки", s: "материалы с объектов: согласование, заказ поставщику, склад, выдача на объект" },
  fil: { t: "Файлы", s: "личная папка и общие" },
  let: { t: "Письма", s: "проект и переписка по объектам" },
  lrn: { t: "Обучение", s: "программы и учебные материалы" },
  /* Правки и ошибки (21.10.2026): с кнопки «Сообщить об ошибке» и из
     чатов правок мессенджера. */
  iss: { t: "Правки и ошибки", s: "ошибки и правки платформы: с кнопки на странице и из чатов правок" },
  // Задачи (правка № 6, 21.10.2026): свои, поставленные и под наблюдением.
  tsk: { t: "Задачи", s: "я делаю, я поручил, я наблюдаю — список и доска, связь с мессенджером" },
  /* Вектор — совет разработки платформы (ТЗ заказчика, 22.10.2026; до
     него — «Рабочая группа»). ico — знак у названия в верхней полосе. */
  wg: { t: "Вектор", s: "совет разработки платформы: метрики, встречи, поручения",
    ico: '<span class="sec-ico"><svg viewBox="0 0 24 24"><circle cx="6.5" cy="17.5" r="2.2"/><path d="M8.2 15.8 17.5 6.5M11.5 6.5h6v6"/></svg></span>' },
  // Демо (27.10.2026): витрина на моках, src/demo-ai.js.
  drw: { t: "Обработка чертежей", s: "распознавание чертежа: элементы, объёмы, спецификация с ценами" },
  tkp: { t: "Шаблонное ТКП", s: "технико-коммерческое предложение по шаблону компании за минуту" },
  obj: { t: "Спецификации", s: "позиции, движения, добавления" },
  /* Пять справочников под одной крышей. Контрагенты и расценки были
     отдельными пунктами меню — теперь это вкладки внутри, и в SECTIONS
     их больше нет: иначе paintSection прятал бы их как самостоятельные
     разделы и гасил бы содержимое рамки. */
  ref: { t: "Справочники", s: "люди, наши компании, контрагенты, заказчики, бригады, прайс материалов" },
  tv: { t: "Витрина", s: "что выводится на экраны" },
  usr: { t: "Пользователи", s: "доступы и роли" },
};

/* ── вход и права ─────────────────────────────────────────────
   Правила те же, что в чате: dev_admin и admin видят всё, user — по
   списку разрешений. Раздел не «спрятан», на него нет права: навигация
   и содержимое гасятся вместе. */
/* Нарисовать блок с именем. Отдельно от навешивания обработчиков:
   рисуем мы дважды — сразу из прошлого снимка и ещё раз, когда придёт
   ответ сервера, — а слушателей вешать дважды нельзя. */
function paintUser(u) {
  $("#who").classList.remove("wait");   // имя есть — скелет ни к чему
  $("#whoName").textContent = u.username;
  $("#whoRole").textContent = AUTH.ROLES[u.role] || u.role;
  const av = $("#whoAv");
  const url = u.avatar ? AUTH.avatarUrl(u.id, u.avatar) : "";
  if (url) {
    av.innerHTML = `<img src="${esc(url)}" alt="">`;
    av.classList.add("has-img");
  } else {
    av.innerHTML = "";
    av.classList.remove("has-img");
    av.textContent = (u.username || "?")[0].toUpperCase();
  }
}

let userWired = false;

function wireUser(u) {
  paintUser(u);
  if (userWired) return;
  userWired = true;
  $("#logout-btn").addEventListener("click", () => AUTH.logout());

  /* Блок с именем и аватаром внизу панели был мёртвым: человек жал на
     него в поисках настроек и не получал ничего. Теперь это дверь в
     свой профиль — именно туда за ними и идут. */
  const who = $("#who");
  who.classList.add("clickable");
  who.setAttribute("role", "button");
  who.setAttribute("tabindex", "0");
  who.setAttribute("title", "Мой профиль");
  const go = (e) => {
    if (e.target.closest("#logout-btn")) return;   // выход — не профиль
    openSection("me");
  };
  who.addEventListener("click", go);
  who.addEventListener("keydown", (e) => {
    // Проверка цели обязана стоять ДО preventDefault: иначе Enter и
    // пробел на кнопке «Выйти» гасились здесь и до неё не доходили.
    if (e.target.closest("#logout-btn")) return;
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(e); }
  });
}

/* Кому какой раздел виден.

   Право написано в самой разметке — `data-perm` у пункта меню, — а не в
   списке здесь. Раньше список жил отдельно от разметки, и они разошлись:
   право «cnt:read» считалось верно, пункт открывался, а следом шёл
   второй цикл по [data-adm] и закрывал его обратно, потому что на
   ссылке «Контрагенты» висел лишний data-adm. Выданная галочка ничего
   не делала, и понять почему было неоткуда.

   Теперь у пункта ровно один источник видимости, и добавление раздела —
   это одна строка разметки плюс право в PERMS на сервере. Ни здесь, ни
   в списке галочек дописывать нечего: галочки строятся из того же
   PERMS. */
function applyAccess(u, navigate) {
  /* Пока не сменён выданный администратором пароль, остальные разделы
     закрыты. Сервер их и так не обслуживает (423), но без этого меню
     обещало бы доступ, которого нет, а предупреждение в профиле —
     «остальные разделы закрыты» — было бы неправдой. */
  const locked = !!u.must_change_pw;

  const allowed = (a) => {
    /* data-off — раздел выключен целиком: для всех и независимо от прав.
       Разметку и код при этом не трогаем: выключенный раздел возвращают
       снятием одного слова, а вырезанный собирают заново. Проверка идёт
       первой, чтобы выключение нельзя было обойти ни ролью, ни правом. */
    if ("off" in a.dataset) return false;
    if (locked) return a.dataset.s === "me";
    /* Роль вместо права — только для управления доступами: выдать его
       галочкой значит позволить выдать себе всё остальное. */
    if (a.dataset.role) return u.role === a.dataset.role;
    // Без data-perm — раздел для всех вошедших (свой профиль). Права
    // через пробел — «любое из»: «Файлы» открывает и личная папка, и
    // галочка общих.
    /* data-all — пункт открыт всем, data-perm у него лишь для значка в
       «Доступе»: «Справочники» с 09.10.2026, где список сотрудников. */
    return !a.dataset.perm || a.hasAttribute("data-all")
      || a.dataset.perm.split(/\s+/).some((p) => AUTH.can(u, p));
  };

  const nav = [...document.querySelectorAll(".side a[data-s]")];
  nav.forEach((a) => { a.hidden = !allowed(a); });
  /* data-tuck — пункт убран из меню у тех, кому раздел открыт другим
     путём. «Файлы» с 28.09.2026 живут в «Объектах»: у объекта — вкладка,
     личные и общие — кнопкой «Общие файлы» над списком. Раздел при этом
     открыт по-прежнему, а у кого «Объектов» нет, пункт остаётся в меню —
     иначе до своих файлов им не добраться. */
  nav.forEach((a) => a.classList.toggle("tucked", !a.hidden && !!a.dataset.tuck
    && a.dataset.tuck.split(/\s+/).some((p) => AUTH.can(u, p))));

  /* Только оформление группы «Администрирование» — разделитель и
     подпись. Пункты меню сюда не попадают намеренно: случайный data-adm
     на ссылке больше не может её погасить в обход её же права. */
  document.querySelectorAll("[data-adm]:not([data-s])").forEach((e) => {
    e.hidden = u.role !== "dev_admin";
  });
  /* Список мог ещё не приехать — при первой отрисовке по снимку его
     заведомо нет. Рисовать пустую таблицу с надписью «никого не
     нашлось» незачем: через миг придёт настоящий список. */
  if (u.role === "dev_admin" && AUTH.users().length) {
    /* Словарь прав нужен модалке. Тянем один раз и не ждём: таблица
       рисуется и без него, а к моменту, когда откроют «Доступ», он уже
       на месте. */
    AUTH.loadPerms().catch(() => {});
    renderUsers(u);
  }

  /* Открытый раздел закрылся — уводим в первый разрешённый по порядку
     меню. Проверяем именно открытый, а не «Сотрудников»: роль могли
     сменить, пока человек стоял в другом разделе, и тогда он остался бы
     смотреть на страницу, которую сервер ему больше не обслуживает.

     Уводим только по требованию вызывающего. Первый раз меню рисуется по
     снимку прошлого захода, а в снимке лежат лишь имя, роль и картинка —
     прав там нет вовсе. Считать по нему «раздел закрыт» нельзя: закрытым
     окажется каждый, человека унесёт в «Мой профиль», и там он и
     останется — пришедший следом настоящий ответ увидит, что открытый
     раздел разрешён, и трогать ничего не станет. */
  if (!navigate) return;
  const on = document.querySelector(".side a[data-s].on");
  if (!on || on.hidden) {
    const first = nav.find((a) => !a.hidden && !a.classList.contains("tucked"));
    if (first) first.click();
  }
}

/* Раздел «Пользователи»: поиск, фильтр по роли, создание, блокировка,
   сброс пароля. Модель — консоль чата, но без лимитов токенов. */
const USR = { q: "", role: "" };
let usrModalFor = null;        // "create" либо id для сброса пароля
let usrWired = false;

function fmtLogin(iso) {
  return iso ? fmtStamp(iso) : "—";
}

/* Последняя активность (заказчик, 09.10.2026: «дата и время последней
   активной сессии»). Сервер отмечает её раз в пять минут, поэтому
   «в сети» — в пределах десяти; дальше «сегодня 14:32», «вчера 18:05» и
   дата — год, только если не нынешний. */
const SEEN_LIVE = 10 * 60e3;
function fmtSeen(iso) {
  const d = new Date(iso), now = new Date();
  const p = (n) => String(n).padStart(2, "0");
  const hm = `${p(d.getHours())}:${p(d.getMinutes())}`;
  const day = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const ago = Math.round((day(now) - day(d)) / 864e5);
  if (ago === 0) return `сегодня ${hm}`;
  if (ago === 1) return `вчера ${hm}`;
  return `${p(d.getDate())}.${p(d.getMonth() + 1)}${
    d.getFullYear() === now.getFullYear() ? "" : "." + d.getFullYear()} ${hm}`;
}

function seenHtml(u) {
  if (!u.last_seen) return `<span class="dim">—</span>`;
  const d = new Date(u.last_seen);
  const p = (n) => String(n).padStart(2, "0");
  const live = Date.now() - d.getTime() < SEEN_LIVE;
  const tip = [`Последняя активность ${p(d.getDate())}.${p(d.getMonth() + 1)}.${
    d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`,
    u.device ? `устройство: ${u.device}` : "",
    u.sessions ? `открытых сеансов: ${u.sessions}` : "открытых сеансов нет"]
    .filter(Boolean).join(" · ");
  return `<span class="u-seen${live ? " live" : ""}" title="${esc(tip)}">${
    live ? "в сети" : fmtSeen(u.last_seen)}</span>`;
}

function renderUsers(me) {
  const box = $("#usrRows");
  if (!box) return;
  wireUsersTools(me);

  const q = USR.q.trim().toLowerCase();
  const list = AUTH.users().filter((u) =>
    (!q || u.username.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
    && (!USR.role || u.role === USR.role));

  const total = AUTH.users().length;
  $("#usrCount").textContent = list.length === total
    ? `${total} ${plural(total, "человек", "человека", "человек")}`
    : `показано ${list.length} из ${total}`;

  const роль = (u) => `<select class="role-sel" data-id="${u.id}">
      ${Object.entries(AUTH.ROLES).map(([k, v]) =>
        `<option value="${k}"${u.role === k ? " selected" : ""}>${v}</option>`).join("")}
    </select>`;

  // Себя нельзя ни заблокировать, ни сбросить себе пароль отсюда —
  // чтобы единственный Dev Admin не выпилил сам себя.
  // Иконки рисуем, а не берём эмодзи: те выпадают из типографики
  // и выглядят по-разному в каждой системе.
  const IC_FILES = `<svg viewBox="0 0 24 24"><path d="M3.5 7A1.5 1.5 0 0 1 5 5.5h4.3l2 2.2H19a1.5 1.5 0 0 1 1.5 1.5v8.3A1.5 1.5 0 0 1 19 19H5a1.5 1.5 0 0 1-1.5-1.5z"/><path d="M9 13.5h6M12.5 11l2.5 2.5-2.5 2.5"/></svg>`;
  const IC_LOCK = `<svg viewBox="0 0 24 24"><rect x="4.5" y="10.5" width="15" height="10" rx="2.5"/><path d="M8.2 10.5V7.4a3.8 3.8 0 0 1 7.6 0v3.1"/></svg>`;
  const IC_UNLOCK = `<svg viewBox="0 0 24 24"><rect x="4.5" y="10.5" width="15" height="10" rx="2.5"/><path d="M8.2 10.5V7.4a3.8 3.8 0 0 1 7.2-1.5"/></svg>`;
  // Классический ключ: кольцо с отверстием сверху слева, стержень
  // по диагонали вниз вправо, зубцы ступеньками — как в образце.
  // Доступы: карточка со строками — «что человеку открыто».
  const IC_ACCESS = `<svg viewBox="0 0 24 24">
    <rect x="3" y="4.5" width="18" height="15" rx="2.5"/>
    <path d="M7 9.5h5M7 13h8M7 16.5h4"/></svg>`;
  const IC_KEY = `<svg viewBox="0 0 24 24">
    <circle cx="9" cy="9" r="5.2"/><circle cx="9" cy="9" r="2.1"/>
    <path d="M12.7 12.7 20.5 20.5"/>
    <path d="M16.9 16.9 15.1 18.7l1.4 1.4"/>
    <path d="M19.1 19.1 18 20.2"/>
  </svg>`;

  /* Обёртка, а не флекс на самой ячейке: display:flex снимает с td
     режим table-cell, и высота ячейки перестаёт совпадать с высотой
     строки — соседние колонки выравниваются по одному, а эта по
     другому. */
  const статус = (u) => u.id === me.id
    ? `<div class="u-st"><span class="dim">— это вы</span></div>`
    : `<div class="u-st"><span class="u-tag ${u.is_blocked ? "u-bad" : "u-ok"}">${
        u.is_blocked ? "заблокирован" : "активен"}</span>
      <span class="acts">
        <button type="button" class="act" data-act="block" data-id="${u.id}"
          title="${u.is_blocked ? "Разблокировать" : "Заблокировать"}">${
          u.is_blocked ? IC_UNLOCK : IC_LOCK}</button>
        <button type="button" class="act" data-act="perms" data-id="${u.id}"
          title="Роль и разделы">${IC_ACCESS}</button>
        <button type="button" class="act" data-act="pass" data-id="${u.id}"
          title="Задать новый пароль">${IC_KEY}</button>
        ${u.is_blocked ? `<button type="button" class="act" data-act="files" data-id="${u.id}"
          title="Перенести личные файлы в «Общие / Архив сотрудников»">${IC_FILES}</button>` : ""}
      </span></div>`;

  /* Фотография, если она есть, иначе кружок с буквой. Раньше здесь
     всегда рисовалась буква: сервер отдаёт метку аватара в поле avatar,
     а список её не читал — человек ставил себе фотографию и не понимал,
     почему в списке её нет. */
  const лицо = (u) => u.avatar
    ? `<img class="av av-s" src="${esc(AUTH.avatarUrl(u.id, u.avatar))}" alt="">`
    : `<span class="av av-s">${esc((u.username || "?")[0].toUpperCase())}</span>`;

  box.innerHTML = list.map((u) => `<tr${u.is_blocked ? ' class="u-off"' : ""}>
      <td class="u-who"><span class="u-nm">${лицо(u)}<b>${esc(u.username)}</b></span></td>
      <td class="dim">${esc(u.email)}</td>
      <td>${роль(u)}</td>
      <td class="num">${seenHtml(u)}</td>
      <td class="dim num">${fmtLogin(u.last_login)}</td>
      <td class="u-cell">${статус(u)}</td>
    </tr>`).join("") ||
    `<tr><td colspan="6" class="dim u-none">Никого не нашлось.</td></tr>`;

  box.querySelectorAll(".role-sel").forEach((s) => {
    const was = s.value;
    s.addEventListener("change", async () => {
      s.disabled = true;
      try {
        await AUTH.setRole(s.dataset.id, s.value);
        const u = AUTH.current();
        // Сменили роль себе — доступы пересчитываются, и если сняли
        // право на открытый раздел, уводим из него.
        applyAccess(u, true);
        wireUserLabel(u);
        renderUsers(u);
      } catch (ex) {
        // Сервер отказал (например, это последний Dev Admin) — возвращаем
        // список к прежнему значению, чтобы он не врал о состоянии базы.
        s.value = was;
        s.disabled = false;
        s.title = ex.message;
        usrNote(ex.message);
      }
    });
  });

  box.querySelectorAll(".act").forEach((b) => {
    b.addEventListener("click", async () => {
      const id = b.dataset.id;
      if (b.dataset.act === "perms") return openUsrModal("perms:" + id, me);
      /* Личная папка закрыта от всех, и у ушедшего человека файлы стали
         бы недоступны навсегда. Переносим одним решением Dev Admin — и
         только у заблокированной учётки. */
      if (b.dataset.act === "files") {
        const who = AUTH.users().find((x) => x.id === id) || {};
        if (!(await ASK.confirm(`Перенести личные файлы «${who.username || ""}» в «Общие / Архив`
                     + ` сотрудников»?\nИх увидят все, у кого есть доступ к общим файлам.`))) return;
        b.disabled = true;
        try {
          const r = await AUTH.api("POST", "/files/archive-user", { user_id: id });
          usrNote(r.files || r.folders
            ? `Перенесено в «${r.folder}»: файлов ${r.files}, папок ${r.folders}`
            : "Личных файлов у этой учётки нет", true);
        } catch (ex) {
          usrNote(ex.message);
        }
        b.disabled = false;
        return;
      }
      if (b.dataset.act !== "block") return openUsrModal(id, me);
      b.disabled = true;
      const u = AUTH.users().find((x) => x.id === id);
      try {
        await AUTH.setBlocked(id, !u.is_blocked);
        renderUsers(AUTH.current());
      } catch (ex) {
        b.disabled = false;
        usrNote(ex.message);
      }
    });
  });
}

/* Отказ сервера показываем в шапке раздела: модалки здесь нет, а молча
   ничего не делать — худший вариант из возможных. ok — итог удачного
   действия: он зелёный, чтобы не читаться как ошибка. */
function usrNote(text, ok) {
  const el = $("#usrCount");
  if (!el) return;
  el.textContent = text;
  el.style.color = ok ? "var(--ok)" : "var(--bad)";
  setTimeout(() => { el.style.color = ""; renderUsers(AUTH.current()); }, 4000);
}

/* Значки разделов — те же, что в меню слева: человек узнаёт раздел по
   картинке, не вчитываясь. У вкладок в меню значков нет, поэтому свои. */
const PERM_IC = {
  // Монтажники (правка № 11): каска и человек.
  ref_mnt: `<svg viewBox="0 0 24 24"><circle cx="12" cy="13" r="3.2"/><path d="M5.5 21a6.5 6.5 0 0 1 13 0"/><path d="M7.5 8.5a4.5 4.5 0 0 1 9 0M6.5 8.5h11"/></svg>`,
  ref_stf: `<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="3.6"/><path d="M5 20v-1.2A4.8 4.8 0 0 1 9.8 14h4.4a4.8 4.8 0 0 1 4.8 4.8V20"/></svg>`,
  ref_org: `<svg viewBox="0 0 24 24"><path d="M3 21h18M5 21V7.5L12 4l7 3.5V21"/><path d="M9.5 21v-4h5v4M9 10.5h1.5M13.5 10.5H15M9 14h1.5M13.5 14H15"/></svg>`,
  ref_cnt: `<svg viewBox="0 0 24 24"><circle cx="8.5" cy="8.5" r="3"/><circle cx="16" cy="9.5" r="2.5"/><path d="M3 19.5v-.8A4 4 0 0 1 7 14.7h3a4 4 0 0 1 4 4v.8M14.5 14.7h2.3a3.7 3.7 0 0 1 3.7 3.7v1.1"/></svg>`,
  ref_cus: `<svg viewBox="0 0 24 24"><rect x="3.5" y="5" width="17" height="14" rx="2"/><circle cx="9" cy="11" r="2.2"/><path d="M5.8 16.5a3.4 3.4 0 0 1 6.4 0M14 10h4M14 13.5h3"/></svg>`,
  ref_crw: `<svg viewBox="0 0 24 24"><path d="M3.5 16.5h17M5 16.5V14a7 7 0 0 1 14 0v2.5"/><path d="M10 7.2V5.8a2 2 0 0 1 4 0v1.4M12 7v5M4.5 19.5h15"/></svg>`,
  ref_wrk: `<svg viewBox="0 0 24 24"><path d="M14.6 5.2a4.2 4.2 0 0 0-5.3 5.4L4 15.9V20h4.1l5.3-5.3a4.2 4.2 0 0 0 5.4-5.3l-2.7 2.7-2.9-.5-.5-2.9z"/></svg>`,
  ref_mat: `<svg viewBox="0 0 24 24"><path d="M3.5 7.6 12 3.2l8.5 4.4v8.8L12 20.8l-8.5-4.4z"/><path d="M3.5 7.6 12 12l8.5-4.4M12 12v8.8"/></svg>`,
  ref_set: `<svg viewBox="0 0 24 24"><path d="M6.5 17.5l11-11"/><circle cx="7.5" cy="7.5" r="2.4"/><circle cx="16.5" cy="16.5" r="2.4"/></svg>`,
  tnd_obj: `<svg viewBox="0 0 24 24"><path d="M3 21h18M5 21V5.5A1.5 1.5 0 0 1 6.5 4h7A1.5 1.5 0 0 1 15 5.5V21M15 10h2.5A1.5 1.5 0 0 1 19 11.5V21"/><path d="M8 8h4M8 12h4M8 16h4"/></svg>`,
  snb_proc: `<svg viewBox="0 0 24 24"><path d="M9 6h11M9 12h11M9 18h11"/><path d="M3.5 6l1.3 1.3L7 5M3.5 12l1.3 1.3L7 11M3.5 18l1.3 1.3L7 17"/></svg>`,
  snb_sup: `<svg viewBox="0 0 24 24"><path d="M3 6.5h11v9H3z"/><path d="M14 9.5h4l3 3v3h-7"/><circle cx="7" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/><path d="M6 9.5h5M6 12.5h3"/></svg>`,
  snb_req: `<svg viewBox="0 0 24 24"><rect x="5" y="4.5" width="14" height="16" rx="2"/><path d="M9 4.5V3.5h6v1M8.5 10h7M8.5 13.5h7M8.5 17h4"/></svg>`,
  req: `<svg viewBox="0 0 24 24"><rect x="5" y="4.5" width="14" height="16" rx="2"/><path d="M9 4.5V3.5h6v1M8.5 10h7M8.5 13.5h7M8.5 17h4"/></svg>`,
};
function permIcon(key) {
  if (PERM_IC[key]) return PERM_IC[key];
  const svg = document.querySelector(`.side a[data-perm="${key}"]:not([data-off]):not([data-hidenav]) svg`);
  return svg ? svg.outerHTML : "";
}

/* Окно «Доступ». Список приходит с сервера (GET /api/perms) — держать
   его копию здесь значило бы однажды показать галочку, которой сервер
   не знает, и молча её потерять при сохранении.

   Раньше это был столбец из двух десятков галочек с пояснением под
   каждой, и окно приходилось листать (пользователь, 02.10.2026:
   «сплошной текст, ничего непонятно»). Теперь раздел — карточка с
   переключателем: открытые подсвечены, закрытые серые, всё видно разом.
   Вкладки — строками внутри своей карточки, точечное право — галочкой
   под тем, внутри чего оно действует.

   08.10.2026 (заказчик): «Тендер» и «Снабжение» — свои блоки со вкладками,
   у «Объектов» — весь список объектов, чтобы конкретному человеку дать
   конкретные. Окно по-прежнему обязано помещаться в 1366×768 без
   прокрутки, поэтому разделы встали тремя колонками — общее, работа до и
   после договора, справочники, — а «Объекты» со списком — во всю ширину
   снизу. */
const UM_COLS = [["emp", "files", "letters", "learn"], ["tnd", "snb", "fin"], ["ref", "tv"]];
let UM_SITES = null;          // объекты для блока «Объекты»: GET /api/access/sites
let UM_WHO = null;            // чей доступ правим — свои объекты по его ключу ФИО
const UM_SCOPE = { all: true, ids: new Set(), q: "" };

function renderPermBoxes(role, have) {
  const box = $("#umPerms");
  const dict = AUTH.perms();
  if (!box || !dict) return;

  // Dev Admin открыто всё — переключатели у него включены и не снимаются:
  // иначе снятая галочка обещала бы то, чего нет. Админу (с 02.10.2026)
  // по умолчанию тоже всё, но лишнее снимается.
  const all = role === "dev_admin";
  /* Раздел → его вкладки → точечные права. Вкладка открывается целиком.
     Переключатель раздела ставит и снимает все вкладки, при части стоит
     посередине. Точечное право гаснет, пока не открыто то, внутри чего оно
     действует: без этого сервер его не примет. */
  const tabs = dict.tabs || [], extras = dict.extras || [], presets = dict.presets || [];
  const label = (p) => p.label.split("—")[0].trim();
  const desc = (p) => (p.label.split("—").slice(1).join("—") || "").trim();
  const check = (k, attrs) => `<input type="checkbox" data-p value="${esc(k)}" ${attrs || ""}${
    all || have.includes(k) ? " checked" : ""}${all ? " disabled" : ""}>`;
  const text = (p) => `<span class="um-t"><b>${esc(label(p))}</b>${
    desc(p) ? `<i>${esc(desc(p))}</i>` : ""}</span>`;
  const extrasOf = (key) => {
    const own = extras.filter((x) => x.section === key);
    return own.length ? `<div class="um-xs">${own.map((x) => `<label class="um-x" title="${esc(desc(x))}">${
      check(x.key, `data-needs="${esc(key)}"`)}<span class="um-ck" aria-hidden="true"></span>${
      text(x)}</label>`).join("")}</div>` : "";
  };
  const head = (p, tabbed) => `<label class="um-card-h"><span class="um-ic">${permIcon(p.key)}</span>${
    tabbed ? `<span class="um-t"><b>${esc(label(p))}</b><i class="um-cnt"></i></span>` : text(p)}${
    check(p.key, tabbed ? `data-sec="${esc(p.key)}"` : "")}<span class="um-sw" aria-hidden="true"></span></label>`;
  const card = (p) => {
    const own = tabs.filter((t) => t.section === p.key);
    if (!own.length) return `<div class="um-card">${head(p, false)}${extrasOf(p.key)}</div>`;
    return `<div class="um-card um-card-tabs">${head(p, true)}<div class="um-tabs">${own.map((t) => `
      <div class="um-tab"><label class="um-tab-h"><span class="um-ic">${permIcon(t.key)}</span>${
        text(t)}${check(t.key, `data-tab="${esc(p.key)}"`)}<span class="um-ck um-ck-r" aria-hidden="true"></span></label>${
        extrasOf(t.key)}</div>`).join("")}</div>${extrasOf(p.key)}</div>`;
  };
  const byKey = Object.fromEntries(dict.perms.map((p) => [p.key, p]));
  // Раздел, которого колонки не знают (появится новый), — в первую.
  // «Заявки на материалы» (22.10.2026) — в строке «Объектов»: подают их с
  // объектов из того же списка, а в колонках окно перестало бы влезать в
  // 1366×768 (вторая колонка и так самая высокая).
  const placed = new Set(["obj", "req", ...UM_COLS.flat()]);
  const cols = UM_COLS.map((keys, i) => keys.filter((k) => byKey[k]).concat(
    i ? [] : dict.perms.map((p) => p.key).filter((k) => !placed.has(k))));
  box.innerHTML = `<div class="um-cols">${cols.map((keys) => `<div class="um-col">${
    keys.map((k) => card(byKey[k])).join("")}</div>`).join("")}</div>${
    byKey.obj ? `<div class="um-card um-objs${byKey.req ? " has-req" : ""}">${head(byKey.obj, false)}${
      byKey.req ? `<div class="um-objs-req">${head(byKey.req, false)}</div>` : ""}${scopeHtml(all)}</div>` : ""}`;
  $("#umPermsW").classList.toggle("all", all);

  // Шаблоны по должностям — слева, под ролью. Админу они ни к чему.
  const preW = $("#umPreW"), pre = $("#umPre"), preN = $("#umPreN");
  preW.hidden = all || !presets.length;
  pre.innerHTML = presets.map((x) => `<button type="button" class="um-pre-b"
    data-pre="${esc(x.key)}">${esc(x.label)}</button>`).join("");
  const PRE_NOTE = "Ставит переключатели как принято для должности — дальше можно поправить.";
  preN.textContent = PRE_NOTE;

  const inp = (k) => box.querySelector(`input[data-p][value="${k}"]`);
  // Учётка до вкладок: раздел отмечен, вкладки нет — значит, все вкладки.
  box.querySelectorAll("[data-sec]").forEach((s) => {
    const ts = [...box.querySelectorAll(`[data-tab="${s.value}"]`)];
    if (s.checked && !ts.some((t) => t.checked)) ts.forEach((t) => { t.checked = true; });
  });
  const sync = () => {
    box.querySelectorAll("[data-sec]").forEach((s) => {
      const ts = [...box.querySelectorAll(`[data-tab="${s.value}"]`)];
      const n = ts.filter((t) => t.checked).length;
      s.checked = n > 0;
      s.indeterminate = n > 0 && n < ts.length;
      s.dataset.part = s.indeterminate ? "1" : "";
      // Список сотрудников открыт всем (09.10.2026) — «закрыт» без оговорки соврал бы.
      s.closest(".um-card").querySelector(".um-cnt").textContent = !n
        ? (s.value === "ref" ? "закрыт; сотрудников видят все" : "закрыт — отметьте вкладки")
        : n === ts.length ? `открыты все ${n} ${plural(n, "вкладка", "вкладки", "вкладок")}`
        : `открыто ${n} из ${ts.length} ${plural(ts.length, "вкладки", "вкладок", "вкладок")}`;
    });
    box.querySelectorAll("[data-needs]").forEach((el) => {
      const base = inp(el.dataset.needs);
      const ok = all || (base && base.checked);
      el.disabled = all || !ok;
      el.closest(".um-x").classList.toggle("off", !ok);
      if (!ok) el.checked = false;
    });
    box.querySelectorAll(".um-card").forEach((c) => {
      const i = c.querySelector(".um-card-h input");
      c.classList.toggle("on", i.checked);
      c.classList.toggle("part", i.indeterminate);
    });
    box.querySelectorAll(".um-tab").forEach((t) => {
      t.classList.toggle("on", t.querySelector(".um-tab-h input").checked);
    });
    box.querySelectorAll(".um-objs-req").forEach((x) => {
      x.classList.toggle("on", x.querySelector("input").checked);
    });
    // Шаблон, который совпадает с отмеченным, подсвечен.
    const got = pickedPerms().filter((k) => !box.querySelector(`[data-sec="${k}"]`)).sort().join();
    pre.querySelectorAll("[data-pre]").forEach((b) => {
      const p = presets.find((x) => x.key === b.dataset.pre);
      const want = p.perms.filter((k) => !box.querySelector(`[data-sec="${k}"]`)).sort().join();
      b.classList.toggle("on", got === want);
    });
    paintSum();
  };
  box.onchange = (e) => {
    const el = e.target;
    if (el.name === "umScope") {
      UM_SCOPE.all = el.value === "all";
      paintScope();
      return;
    }
    if (el.dataset && el.dataset.site) {
      if (el.checked) UM_SCOPE.ids.add(el.dataset.site); else UM_SCOPE.ids.delete(el.dataset.site);
      el.closest(".um-obj").classList.toggle("on", el.checked);
      paintScope(true);
      return;
    }
    if (el.dataset && el.dataset.sec) {
      // Из «частично» щелчок открывает все вкладки, а не снимает их.
      if (el.dataset.part) el.checked = true;
      box.querySelectorAll(`[data-tab="${el.value}"]`).forEach((t) => { t.checked = el.checked; });
    }
    sync();
  };
  box.oninput = (e) => {
    if (!e.target.matches(".um-scope-q")) return;
    UM_SCOPE.q = e.target.value;
    paintObjs();
  };
  pre.onclick = (e) => {
    const b = e.target.closest("[data-pre]");
    if (!b) return;
    const p = presets.find((x) => x.key === b.dataset.pre);
    box.querySelectorAll("input[data-p]").forEach((i) => { i.checked = p.perms.includes(i.value); });
    sync();
  };
  // Состав шаблона — строкой под кнопками, пока на него наведены.
  const hint = (e) => {
    const b = e.target.closest && e.target.closest("[data-pre]");
    const p = b && presets.find((x) => x.key === b.dataset.pre);
    preN.textContent = p ? `${p.label}: ${p.hint}` : PRE_NOTE;
  };
  pre.onmouseover = pre.onfocusin = hint;
  pre.onmouseleave = pre.onfocusout = () => { preN.textContent = PRE_NOTE; };
  sync();
  paintScope();
}

/* Какие объекты человек видит — в «Объектах», «Тендере», «Снабжении» и
   «Письмах» сразу (заказчик, 08.10.2026). По умолчанию все. «Выбранные»
   — отмеченные здесь и свои: где он начальник участка или мастер по
   карточке объекта, — их не снять, они открыты всегда. Блок действует и
   при выключенных «Объектах»: мастеру с одними «Письмами» он тоже нужен. */
function scopeHtml(all) {
  return `<div class="um-scope">
    <div class="um-scope-h">
      <div class="um-seg um-seg-sm" role="radiogroup" aria-label="Какие объекты видит">
        <label><input type="radio" name="umScope" value="all"${all ? " disabled" : ""}><span>Все объекты</span></label>
        <label><input type="radio" name="umScope" value="some"${all ? " disabled" : ""}><span>Выбранные</span></label>
      </div>
      <span class="um-scope-n" id="umScopeN"></span>
      <label class="um-scope-f" hidden><input class="um-scope-q" placeholder="Найти объект"
        value="${esc(UM_SCOPE.q)}" autocomplete="off"></label>
    </div>
    <div class="um-objlist" id="umObjs" hidden></div>
  </div>`;
}

// Свои объекты человека: id → «мастер» / «нач. участка».
function umOwn() {
  const pk = UM_WHO && UM_WHO.person_key;
  const out = new Map();
  if (!pk) return out;
  (UM_SITES || []).forEach((s) => {
    if (s.master_key === pk) out.set(s.id, "мастер");
    else if (s.foreman_key === pk) out.set(s.id, "нач. участка");
  });
  return out;
}

/* Переключатель «Все / Выбранные», строка-итог и список. light — щёлкнули
   по объекту: список уже верный, пересчитать только итог. */
function paintScope(light) {
  const box = $("#umPerms");
  if (!box || !$("#umScopeN")) return;
  const dev = umRole() === "dev_admin";
  box.querySelectorAll('input[name="umScope"]').forEach((r) => {
    r.checked = r.value === (dev || UM_SCOPE.all ? "all" : "some");
    r.parentElement.classList.toggle("on", r.checked);
  });
  const n = UM_SITES ? UM_SITES.length : 0;
  $("#umScopeN").textContent = dev ? "Dev Admin видит все объекты"
    : UM_SCOPE.all ? (n ? `все ${n} — и новые тоже` : "все — и новые тоже")
    : !UM_SITES ? "загружаю объекты…" : umSeen();
  const some = !dev && !UM_SCOPE.all;
  box.querySelector(".um-scope-f").hidden = !some || n < 10;
  $("#umObjs").hidden = !some;
  if (!light && some) paintObjs();
  paintSum();
}

function paintObjs() {
  const host = $("#umObjs");
  if (!host) return;
  if (!UM_SITES) { host.innerHTML = `<div class="um-objs-none">Загружаю объекты…</div>`; return; }
  const own = umOwn();
  const q = UM_SCOPE.q.trim().toLowerCase();
  /* Сверху — то, что он видит: свои, потом отмеченные; дальше выигранные,
     тендерные — в конце: человеку из «Объектов» они нужны реже. Порядок
     считается при открытии и поиске, а не на каждый щелчок — строки под
     мышью не прыгают. */
  const rank = (s) => (own.has(s.id) ? 0 : UM_SCOPE.ids.has(s.id) ? 1 : 2) * 2 + (s.tender !== "won");
  const rows = UM_SITES.filter((s) => !q || s.name.toLowerCase().includes(q))
    .sort((a, b) => rank(a) - rank(b));
  host.innerHTML = rows.map((s) => {
    const mine = own.get(s.id);
    const on = !!mine || UM_SCOPE.ids.has(s.id);
    return `<label class="um-obj${on ? " on" : ""}${mine ? " own" : ""}" title="${esc(s.name)}${
      mine ? " — " + mine + " по карточке объекта, открыт всегда" : ""}">
      <input type="checkbox" data-site="${esc(s.id)}"${on ? " checked" : ""}${mine ? " disabled" : ""}>
      <span class="um-ck" aria-hidden="true"></span><span class="um-obj-n">${esc(s.name)}</span>${
      mine ? `<i class="um-own">${mine}</i>` : s.tender !== "won" ? "<i>тендер</i>" : ""}</label>`;
  }).join("") || `<div class="um-objs-none">${q ? "Не нашлось — поищите иначе" : "Объектов пока нет"}</div>`;
}

function paintSum() {
  const dict = AUTH.perms();
  const box = $("#umPerms");
  if (!dict || !box || !$("#umSum")) return;
  if (umRole() === "dev_admin") { $("#umSum").textContent = "Открыто всё"; return; }
  const n = dict.perms.filter((p) => {
    const i = box.querySelector(`input[data-p][value="${p.key}"]`);
    return i && i.checked;
  }).length;
  $("#umSum").textContent = `Открыто ${n} из ${dict.perms.length} ${
    plural(dict.perms.length, "раздела", "разделов", "разделов")} · объекты: ${
    UM_SCOPE.all ? "все" : UM_SITES ? umSeen() : "выбранные"}`;
}

// «видит 3 из 10 · свои — 1»: отмеченные и свои вместе, свои — отдельно.
function umSeen() {
  const own = umOwn();
  const seen = (UM_SITES || []).filter((s) => own.has(s.id) || UM_SCOPE.ids.has(s.id)).length;
  return `видит ${seen} из ${(UM_SITES || []).length}${own.size ? ` · свои — ${own.size}` : ""}`;
}

function pickedPerms() {
  return [...document.querySelectorAll("#umPerms input[data-p]:checked")].map((i) => i.value);
}

/* Роль — три кнопки и строка о выбранной. У админов переключатели
   справа включены и не снимаются — строка объясняет почему: без неё
   это выглядит поломкой. */
const ROLE_NOTE = {
  user: "Видит только включённые разделы — остальное скрыто.",
  admin: "По умолчанию открыто всё — лишнее можно выключить. Плюс общие настройки: наценка и НДС, наши компании, каталоги.",
  dev_admin: "Открыто всё без исключений и раздел «Пользователи»: раздаёт доступы.",
};
function umRole() {
  const r = document.querySelector('#umRoleW input[name="umRole"]:checked');
  return r ? r.value : "user";
}
function setUmRole(v) {
  document.querySelectorAll('#umRoleW input[name="umRole"]').forEach((r) => {
    r.checked = r.value === v;
    r.parentElement.classList.toggle("on", r.checked);
  });
  $("#umRoleN").textContent = ROLE_NOTE[v] || "";
}

function openUsrModal(mode, me) {
  usrModalFor = mode;
  const create = mode === "create";
  /* Третий режим: правка доступов у существующего человека. Раньше
     модалка умела только заводить и сбрасывать пароль, и выданные при
     заведении разделы поменять было нечем. */
  const editPerms = typeof mode === "string" && mode.startsWith("perms:");
  const id = editPerms ? mode.slice(6) : mode;
  const who = create ? null : AUTH.users().find((x) => x.id === id);
  const wide = create || editPerms;

  $("#umTitle").textContent = create ? "Новый пользователь"
    : editPerms ? `Доступ — ${who ? who.username : ""}`
    : `Новый пароль — ${who ? who.username : ""}`;
  $("#umSub").textContent = editPerms && who ? who.email : "";
  // Лицо в шапке — чтобы не перепутать, кому раздаёшь доступ.
  const av = $("#umAv");
  av.hidden = !(editPerms && who);
  if (editPerms && who) {
    av.innerHTML = who.avatar ? `<img src="${esc(AUTH.avatarUrl(who.id, who.avatar))}" alt="">`
      : esc((who.username || "?")[0].toUpperCase());
  }
  $("#umNameW").hidden = $("#umEmailW").hidden = !create;
  $("#umRoleW").hidden = $("#umPermsW").hidden = !wide;
  $("#umPreW").hidden = true;
  $("#usrModal .modal-card").classList.toggle("um-wide", wide);
  // Пароль в режиме правки доступов не спрашиваем: это другое действие.
  $("#umPassW").hidden = editPerms;
  $("#umOk").textContent = create ? "Создать" : "Сохранить";
  $("#umName").value = $("#umEmail").value = $("#umPass").value = "";
  setUmRole(who ? who.role : "user");
  $("#umErr").hidden = true;
  $("#umSum").textContent = "";

  const dict = AUTH.perms();
  const have = who ? (who.permissions || [])
    : (dict ? dict.roles.user : []);
  // Какие объекты видит: у новой учётки — все.
  UM_WHO = who;
  UM_SCOPE.all = !who || who.sites_all !== false;
  UM_SCOPE.ids = new Set(who ? who.site_ids || [] : []);
  UM_SCOPE.q = "";
  if (wide) {
    renderPermBoxes(umRole(), have);
    // Список объектов свежий на каждое открытие: их заводят каждый день.
    UM_SITES = null;
    AUTH.api("GET", "/access/sites").then((r) => {
      UM_SITES = r.rows || [];
      paintScope();
    }).catch((e) => {
      UM_SITES = [];
      paintScope();
      $("#umScopeN").textContent = "объекты не загрузились: " + e.message;
    });
  }

  $("#usrModal").hidden = false;
  const card = $("#usrModal .modal-card");
  card.scrollTop = 0;
  (create ? $("#umName") : editPerms ? card : $("#umPass")).focus();
}

function wireUsersTools(me) {
  if (usrWired) return;
  usrWired = true;

  $("#usrSearch").addEventListener("input", (e) => {
    USR.q = e.target.value;
    renderUsers(AUTH.current());
  });
  $("#usrFilter").addEventListener("change", (e) => {
    USR.role = e.target.value;
    renderUsers(AUTH.current());
  });
  $("#usrCreate").addEventListener("click", () => openUsrModal("create", me));
  // Отчёт по пользователям и выданным правам (правка № 53) — книгой Excel.
  $("#usrReport").addEventListener("click", (e) => DL.save("/api/users/report",
    { btn: e.currentTarget, fallback: "Пользователи и права.xlsx", error: "Отчёт не собрался" })
    .catch((err) => ASK.alert(err.message, { title: "Отчёт по пользователям" })));
  /* Роль — это заготовка: выбрали её, галочки встали как принято для
     неё, дальше правь. Так же ведёт себя и сервер, если прислать смену
     роли без списка. */
  $("#umRoleW").addEventListener("change", (e) => {
    if (e.target.name !== "umRole") return;
    const dict = AUTH.perms();
    setUmRole(e.target.value);
    renderPermBoxes(e.target.value, dict ? (dict.roles[e.target.value] || []) : []);
  });
  const hide = () => { $("#usrModal").hidden = true; };
  $("#umCancel").addEventListener("click", hide);
  $("#umClose").addEventListener("click", hide);
  $("#usrModal").addEventListener("click", (e) => {
    if (e.target === $("#usrModal")) hide();
  });
  $("#usrModal").addEventListener("keydown", (e) => {
    if (e.key === "Escape") hide();
  });

  $("#umOk").addEventListener("click", async () => {
    const btn = $("#umOk");
    if (btn.disabled) return;
    btn.disabled = true;
    const was = btn.textContent;
    btn.textContent = "Сохраняю…";
    try {
      if (usrModalFor === "create") {
        await AUTH.createUser({ username: $("#umName").value, email: $("#umEmail").value,
          password: $("#umPass").value, role: umRole(),
          permissions: pickedPerms(), sites_all: UM_SCOPE.all, site_ids: [...UM_SCOPE.ids] });
      } else if (String(usrModalFor).startsWith("perms:")) {
        const id = String(usrModalFor).slice(6);
        // Роль и разделы одним запросом: сервер, получив их вместе, не
        // станет переставлять галочки по заготовке роли.
        await AUTH.api("PATCH", "/users/" + id,
          { role: umRole(), permissions: pickedPerms(),
            sites_all: UM_SCOPE.all, site_ids: [...UM_SCOPE.ids] });
        await AUTH.reloadUsers();
      } else {
        await AUTH.setPassword(usrModalFor, $("#umPass").value);
      }
      $("#usrModal").hidden = true;
      renderUsers(AUTH.current());
    } catch (ex) {
      $("#umErr").textContent = ex.message;
      $("#umErr").hidden = false;
    } finally {
      btn.disabled = false;
      btn.textContent = was;
    }
  });
}

function wireUserLabel(u) {
  $("#whoRole").textContent = AUTH.ROLES[u.role] || u.role;
}

/* Слушаем всю панель, а не один #nav: пункт «Мой профиль» вынесен вниз,
   в отдельную группу над блоком с именем, и в #nav его больше нет. */
function wireNav() {
  const side = document.querySelector(".side");
  if (!side) return;                // на витрине навигации нет
  side.addEventListener("click", (e) => {
    const a = e.target.closest("a[data-s]");
    if (!a) return;
    showSection(a.dataset.s);
  });
}

/* Только показать раздел: отметка в меню, видимость блоков, заголовок.
   Ни адреса, ни запросов за данными — поэтому это можно делать первым
   же кадром, ещё до того, как сервер подтвердит вход.

   Отделено от showSection ради загрузки страницы. В разметке открыты
   «Сотрудники», и при возврате по ссылке на любой другой раздел он
   мелькал первым, а нужный подставлялся следом. */
/* Раздел, который грузит данные сам («Объекты», «Файлы»), при входе
   показывает то, что было нарисовано в прошлый раз, а через долю секунды
   приходит ответ сервера, и модуль рисует раздел заново. Новые блоки
   начинали каскад появления с нуля — раздел проявлялся дважды: мигал.
   Теперь блок, появившийся во время каскада, встаёт в него с того же
   места: сдвиг задержки на уже прошедшее время. */
function watchEntering(el) {
  if (el._riseWatch) return;
  el._riseWatch = new MutationObserver((list) => {
    if (!el.classList.contains("entering")) return;
    const skip = -Math.round(performance.now() - (el._enterAt || 0)) + "ms";
    for (const m of list) {
      for (const n of m.addedNodes) {
        if (n.nodeType === 1) n.style.setProperty("--rise-skip", skip);
      }
    }
  });
  el._riseWatch.observe(el, { childList: true });
}

function paintSection(id) {
  if (!SECTIONS[id]) return;
  /* Выключенный раздел не рисуем даже по адресу из ссылки. Увод в
     разрешённый сделает applyAccess, но он ждёт ответа сервера, а до
     него страница успела бы мигнуть тем, чего быть не должно. */
  if (document.querySelector(`.side a[data-s="${id}"][data-off]`)) return;
  // Раздел, убранный из меню, подсвечивает пункт, из которого открыт.
  const tucked = document.querySelector(`.side a[data-s="${id}"].tucked`);
  const lit = tucked && tucked.dataset.home ? tucked.dataset.home : id;
  document.querySelectorAll(".side a[data-s]").forEach((x) =>
    x.classList.toggle("on", x.dataset.s === lit));
  const was = document.documentElement.dataset.sec;
  document.documentElement.dataset.sec = id;
  for (const k of Object.keys(SECTIONS)) {
    const el = $("#sec-" + k);
    if (!el) continue;
    const show = k === id;
    // Каскад появления — только когда раздел действительно сменился, и
    // только на время каскада: перерисовки внутри раздела его не повторяют.
    if (show && (el.hidden || was !== id || !paintSection.done)) {
      for (const c of el.children) c.style.removeProperty("--rise-skip");
      el.classList.remove("entering");
      void el.offsetWidth;
      el.classList.add("entering");
      el._enterAt = performance.now();
      watchEntering(el);
      clearTimeout(el._entering);
      el._entering = setTimeout(() => el.classList.remove("entering"), 900);
    }
    el.hidden = !show;
  }
  paintSection.done = true;
  $("#secTitle").textContent = SECTIONS[id].t;
  // Знак у названия — у разделов, где он есть (Вектор): разметка своя, из кода.
  if (SECTIONS[id].ico) $("#secTitle").insertAdjacentHTML("afterbegin", SECTIONS[id].ico);
  $("#secSub").textContent = SECTIONS[id].s;
}

function showSection(id) {
  if (!SECTIONS[id]) return;
  paintSection(id);

  /* Раздел живёт в адресе. Раньше он не попадал туда вовсе: перезагрузка
     всегда возвращала на «Сотрудников», а ссылку на «Объекты» коллеге
     дать было нельзя. */
  STATE.sec = id;
  writeURL();

  // Ширина колонок считается от размеров контейнера, а у скрытого
  // блока их нет — пересчитываем после показа.
  if (id === "emp") renderAll();
  // Профиль мог нарисоваться раньше, чем доехали обязательства:
  // «Мои показатели» без них пусты.
  if (id === "me" && typeof PROFILE === "object") PROFILE.refresh();
  // Список тянем при показе, а не на старте: у большинства входящих
  // прав на контрагентов нет, и лишний запрос ушёл бы в 403.
  if (id === "cnt" && typeof CNT === "object") CNT.load();
  // Прайс тянем при показе, как контрагентов: у большинства входящих
  // прав на него нет, и запрос ушёл бы в 403.
  // Справочники грузят себя сами, по вкладке: рамка знает, какая
  // открыта, и лишнего не спрашивает.
  if (id === "ref" && typeof REFS === "object") REFS.show();
  // По той же причине, что и контрагенты: документы объекта тянем при
  // показе раздела, а не на старте страницы.
  if (id === "sit" && typeof SITES === "object") SITES.load();
  // Тендер — рамка «Объекты · Данные»: сама решает, что показать.
  if (id === "tnd" && typeof TENDER === "object") TENDER.show();
  if (id === "snb" && typeof SNAB === "object") SNAB.show();
  if (id === "fin" && typeof FIN === "object") FIN.show();
  if (id === "fil" && typeof FILES === "object") FILES.load();
  if (id === "let" && typeof LETTERS === "object") LETTERS.load();
  if (id === "msg" && typeof MESSENGER === "object") MESSENGER.show();
  if (id === "lrn" && typeof LEARN === "object") LEARN.load();
  if (id === "iss" && typeof ISSUES === "object") ISSUES.show();
  if (id === "tsk" && typeof TASKS === "object") TASKS.show();
  if (id === "wg" && typeof WG === "object") WG.show();
  if (id === "req" && typeof REQ === "object") REQ.show();
  if (id === "drw" && typeof DEMO_AI === "object") DEMO_AI.showDrw();
  if (id === "tkp" && typeof DEMO_AI === "object") DEMO_AI.showTkp();
  /* Список учёток грузится при входе, а «Активность» в нём — живая:
     раздел открыли через час — перечитываем, иначе он показал бы час
     назад как «сейчас». */
  if (id === "usr" && AUTH.current() && AUTH.current().role === "dev_admin") {
    AUTH.reloadUsers().then(() => renderUsers(AUTH.current())).catch(() => {});
  }
}

/* Открыть раздел из кода. Молча ничего не делает, если раздел закрыт
   ролью — тогда человек остаётся там, где стоял. */
function openSection(id) {
  const a = document.querySelector(`.side a[data-s="${id}"]`);
  if (a && !a.hidden) showSection(id);
}

/* Мостик для profile.js. Явный список того, чем личный кабинет
   пользуется из дашборда: иначе он лазил бы в переменные соседнего
   файла, и порядок подключения скриптов стал бы тайным условием
   работоспособности. */
window.KARKAS = {
  ready: () => !!DATA,
  people: () => (DATA ? DATA.people : []),

  /* Кто из сотрудников — это вошедший. Сравниваем НАБОР слов, не строку:
     в учётке «Анна Белова», в Битриксе «Белова Анна» — порядок слов в
     источниках разный, и прямое сравнение давало ноль совпадений из
     пяти. По набору совпадают четверо из пяти.

     Только точное совпадение. Вложенность («Смирнов А.» внутри
     «Смирнов Иван») выглядит заманчиво, но в данных это ДВА РАЗНЫХ
     человека — смирнов-а и смирнов-и. Угадывание по инициалу склеило
     бы их и приписало одному чужие показатели.

     Однофамильцев с полным совпадением в данных нет: сто наборов имён,
     ни за одним не стоит больше одного человека. Если такой появится —
     вернём null, и человек выберет себя сам. */
  guessPerson(name) {
    if (!DATA || !name) return null;
    const norm = (s) => {
      const w = String(s || "").toLowerCase().replace(/ё/g, "е")
        .split(/[\s.,]+/).filter((x) => x.length > 1).sort();
      return w.length ? w.join(" ") : "";
    };
    const key = norm(name);
    if (!key) return null;
    const hits = new Set();
    for (const p of DATA.people) {
      for (const src of [p.fio, p.sheet_name]) {
        if (src && norm(src) === key) hits.add(p.person_key);
      }
    }
    return hits.size === 1 ? [...hits][0] : null;
  },
  sections: () => SECTIONS,

  /* Пересчитать доступы и перерисовать меню. Нужен профилю: смена
     выданного пароля снимает замок с разделов, но узнаёт об этом только
     сервер. Раньше человек менял пароль и оставался с одним «Моим
     профилем» в меню, пока не перезагрузит страницу — а догадаться, что
     надо перезагрузить, было неоткуда. */
  refreshAccess(u) {
    const me = u || AUTH.current();
    if (me) applyAccess(me, true);
  },

  /* Показатели одного человека за выбранный период. Считаются ВЫЗОВОМ
     той же metric(), что и рейтинг, а не второй формулой: разошедшиеся
     реализации однажды дали бы человеку в профиле один процент, а на
     общем экране другой. */
  statsFor(key) {
    if (!DATA) return null;
    /* Считаем по периоду, но БЕЗ фильтра участка.

       currentView() сужает людей по STATE.band, а он живёт в разделе
       «Сотрудники». Начальник участка выбирал там свой участок — и
       собственные показатели в профиле пустели или считались по чужой
       выборке, хотя человек к тому фильтру уже не имел отношения.
       Период оставляем: он подписан на экране и человек его выбирал. */
    const { from, to } = periodRange();
    const all = DATA.obligations.filter((o) => {
      const d = o.due || "";
      return d >= from && d <= to;
    });
    const byPerson = {};
    for (const o of all) (byPerson[o.person_key] = byPerson[o.person_key] || []).push(o);

    const mine = byPerson[key] || [];
    const p = DATA.people.find((x) => x.person_key === key);
    const three = threeNumbers(mine);

    // Место внутри своей группы — по тем же правилам, что в рейтинге.
    const isMaster = !!(p && p.sheet_name);
    const peers = DATA.people.filter((x) => !!x.sheet_name === isMaster);
    const ranked = peers
      .map((x) => ({ x, m: threeNumbers(byPerson[x.person_key] || []).total }))
      .filter((r) => r.m.n >= LOW_N && r.m.pct !== null)
      .sort((a, b) => (b.m.pct - a.m.pct) || (b.m.n - a.m.n));
    const at = ranked.findIndex((r) => r.x.person_key === key);

    return {
      name: (p && (p.fio || p.sheet_name)) || key,
      period: periodRange().label,
      group: isMaster ? "Мастера" : "Остальные сотрудники",
      rank: at >= 0 ? at + 1 : null,
      of: ranked.length,
      reg: three.reg, tsk: three.tsk, total: three.total,
      late: mine.filter((o) => o.status === "overdue" || o.status === "late")
        .sort((a, b) => String(a.due).localeCompare(String(b.due))),
    };
  },
};

/* ── свои выпадающие списки ───────────────────────────────────
   Раскрытый список нативного select рисует операционная система, и
   стилями его не достать: на фирменной странице открывалось системное
   окно с синей подсветкой. Поэтому поверх select-а надстраиваем свой —
   кнопка и список, а сам select остаётся в разметке и хранит значение.
   Так весь прежний код с addEventListener("change") и .value продолжает
   работать, ни одно место переписывать не пришлось.

   Список кладём в body с фиксированным положением, а не рядом с
   кнопкой: фильтры живут внутри карточки с overflow: hidden, и там его
   обрезало бы по краю. */
function dressSelect(sel) {
  if (sel.dataset.dressed) return;
  sel.dataset.dressed = "1";

  const wrap = document.createElement("span");
  wrap.className = "sel";
  sel.parentNode.insertBefore(wrap, sel);
  wrap.appendChild(sel);

  const btn = document.createElement("button");
  btn.type = "button";
  /* Класс селекта на кнопку не переносим. У .role-sel стрелка нарисована
     фоновой картинкой, и в тёмной теме для неё есть отдельное правило —
     оно ложилось поверх кнопки, и стрелок выходило две: своя и чужая. */
  btn.className = "sel-btn";
  btn.setAttribute("aria-haspopup", "listbox");
  btn.setAttribute("aria-expanded", "false");
  btn.innerHTML = `<span class="sel-cur"></span>
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9.5l6 6 6-6"/></svg>`;
  wrap.appendChild(btn);

  const list = document.createElement("div");
  list.className = "sel-list";
  list.setAttribute("role", "listbox");
  list.hidden = true;
  document.body.appendChild(list);

  const cur = btn.querySelector(".sel-cur");
  const paint = () => {
    const o = sel.selectedOptions[0];
    cur.textContent = o ? o.textContent : "";
    list.querySelectorAll(".sel-opt").forEach((b) => {
      const on = b.dataset.v === sel.value;
      b.classList.toggle("on", on);
      b.setAttribute("aria-selected", String(on));
    });
  };

  // Группы (optgroup) — подписью над своими пунктами, как в родном списке.
  const optBtn = (o) => `<button type="button"
      class="sel-opt" role="option" data-v="${esc(o.value)}">${esc(o.textContent)}</button>`;
  const fill = () => {
    list.innerHTML = [...sel.children].map((c) => (c.tagName === "OPTGROUP"
      ? `<div class="sel-grp" role="presentation">${esc(c.label)}</div>${[...c.children].map(optBtn).join("")}`
      : optBtn(c))).join("");
    paint();
  };

  const place = () => {
    const r = btn.getBoundingClientRect();
    list.style.minWidth = Math.round(r.width) + "px";
    list.style.left = Math.round(r.left) + "px";
    const h = list.offsetHeight;
    // не влезает вниз, а вверх влезает — раскрываем вверх
    list.style.top = (innerHeight - r.bottom < h + 10 && r.top > h + 10)
      ? Math.round(r.top - h - 6) + "px"
      : Math.round(r.bottom + 6) + "px";
  };

  let open = false;
  const close = () => {
    if (!open) return;
    open = false;
    list.hidden = true;
    btn.setAttribute("aria-expanded", "false");
  };
  const show = () => {
    fill();
    list.hidden = false;
    open = true;
    btn.setAttribute("aria-expanded", "true");
    place();
    const on = list.querySelector(".sel-opt.on") || list.querySelector(".sel-opt");
    if (on) on.focus();
  };

  btn.addEventListener("click", () => (open ? close() : show()));
  list.addEventListener("click", (e) => {
    const o = e.target.closest(".sel-opt");
    if (!o) return;
    sel.value = o.dataset.v;
    sel.dispatchEvent(new Event("change", { bubbles: true }));
    paint();
    close();
    btn.focus();
  });

  /* Клавиатура: стрелки водят по списку, Esc закрывает. Без этого свой
     список был бы шагом назад против родного. */
  list.addEventListener("keydown", (e) => {
    const opts = [...list.querySelectorAll(".sel-opt")];
    const i = opts.indexOf(document.activeElement);
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const n = e.key === "ArrowDown" ? i + 1 : i - 1;
      (opts[(n + opts.length) % opts.length] || opts[0]).focus();
    } else if (e.key === "Escape") {
      e.preventDefault(); close(); btn.focus();
    }
  });
  btn.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
      e.preventDefault(); show();
    }
  });

  document.addEventListener("mousedown", (e) => {
    if (open && !list.contains(e.target) && !wrap.contains(e.target)) close();
  });
  /* Прокрутка страницы увела бы кнопку из-под списка — проще закрыть,
     чем ездить следом. Но прокрутку внутри самого списка пропускаем:
     ловушка стоит на перехвате, и длинный список закрывался от первого
     же движения колеса — пролистать его было нельзя. */
  window.addEventListener("scroll", (e) => {
    if (!list.contains(e.target)) close();
  }, true);
  window.addEventListener("resize", close);
  // Значение могли поменять и снаружи — держим подпись в согласии.
  sel.addEventListener("change", paint);
  /* …и из кода: sel.value = … события change не даёт, и подпись
     оставалась прежней (окно «Доступ» у Dev Admin показывало
     «Пользователь»). Перехватываем запись значения у этого списка. */
  for (const prop of ["value", "selectedIndex"]) {
    const d = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, prop);
    Object.defineProperty(sel, prop, {
      configurable: true,
      get() { return d.get.call(this); },
      set(v) { d.set.call(this, v); paint(); },
    });
  }

  paint();
}

/* Одеваем и те списки, что появятся позже: роли в таблице пользователей
   и виды движений в журнале рисуются после загрузки. */
function dressSelects(root) {
  const r = root || document;
  if (r.querySelectorAll) r.querySelectorAll("select").forEach(dressSelect);
}

function watchSelects() {
  dressSelects(document);
  new MutationObserver((muts) => {
    for (const m of muts) {
      for (const n of m.addedNodes) {
        if (n.nodeType !== 1) continue;
        if (n.tagName === "SELECT") dressSelect(n);
        else dressSelects(n);
      }
    }
  }).observe(document.body, { childList: true, subtree: true });
}

/* ── листание витрины ─────────────────────────────────────────
   На экран телевизора влезает семь-восемь мастеров из двадцати, и
   остальные не существовали для смотрящего: список просто обрывался.

   Листаем не прокруткой, а порциями строк. Прокрутка уносила вместе со
   строками и шапку — названия столбцов уезжали наверх, и галочки внизу
   становились безымянными. Теперь шапка, обозначения и заголовки
   колонок стоят намертво, а под ними меняется содержимое.

   Порция набирается по живым высотам, а не по числу строк: у мастера с
   пятью объектами строка впятеро выше, чем у мастера с одним. Мастер
   при этом не делится — его объекты уходят на следующую страницу
   целиком, иначе фамилия осталась бы без половины своих домов. */
function startTvPager() {
  const box = $(".content");
  if (!box) return;

  const HOLD = 12000;   // сколько страница стоит
  const bar = $("#tvBar"), num = $("#tvPage");

  let pages = [];       // массив страниц; страница — массив элементов
  let cur = 0;
  let timer = 0;

  /* Единицы листания: у мастеров это блок «мастер со всеми объектами»,
     у остальных сотрудников — строка. Заодно тащим с собой полосу
     «мало данных»: она относится к тому, что идёт после неё. */
  const units = () => {
    const out = [];
    const tb = box.querySelector(".mx-body tbody");
    if (tb) {
      for (const tr of tb.rows) {
        if (tr.classList.contains("m-first") || !out.length) out.push({ rows: [tr] });
        else out[out.length - 1].rows.push(tr);
      }
    }
    box.querySelectorAll("#others-body .mx-body tbody tr")
      .forEach((el) => out.push({ rows: [el] }));
    return out;
  };

  /* Показать ровно эти единицы, остальное убрать. Карточку прячем
     целиком, когда ни одной её строки на странице нет: пустой заголовок
     занимал бы экран впустую. */
  let ALL = [];
  const showOnly = (list) => {
    const vis = new Set();
    list.forEach((u) => u.rows.forEach((r) => vis.add(r)));
    ALL.forEach((u) => u.rows.forEach((r) => {
      r.style.display = vis.has(r) ? "" : "none";
    }));
    /* Именно .mx-body tbody, а не просто tbody: шапка пунктов — тоже
       таблица, и её строки браузер заворачивает в неявный tbody. С
       широким селектором карточка мастеров считалась непустой всегда и
       занимала экран даже на страницах, где ни одного мастера нет. */
    [["#masters", ".mx-body tbody tr"], ["#others", ".mx-body tbody tr"]]
      .forEach(([sel, inner]) => {
        const card = $(sel);
        if (!card) return;
        const live = [...card.querySelectorAll(inner)]
          .some((r) => r.style.display !== "none");
        card.style.display = live ? "" : "none";
      });
  };

  /* Влезает ли набор в экран. Меряем настоящим переполнением, а не
     суммой высот строк: между ними стоят карточки, заголовки и поля, и
     угадать их в уме — верный способ ошибиться. Первая попытка оценивала
     «занято» на глаз и нарезала список на восемнадцать страниц по три
     фамилии вместо пяти по десять. */
  const fits = (list) => {
    showOnly(list);
    return box.scrollHeight <= box.clientHeight + 2;
  };

  /* Режем двоичным поиском: сколько единиц влезает — столько и берём,
     дальше с остатка. Перебор по одной дал бы под тысячу перекладываний
     вёрстки, здесь их десятки. */
  const build = () => {
    ALL = units();
    pages = [];
    if (!ALL.length) return;
    let rest = ALL.slice();
    for (let guard = 0; rest.length && guard < 60; guard++) {
      if (fits(rest)) { pages.push(rest); break; }
      let lo = 1, hi = rest.length - 1, best = 1;
      while (lo <= hi) {
        const mid = (lo + hi) >> 1;
        if (fits(rest.slice(0, mid))) { best = mid; lo = mid + 1; }
        else hi = mid - 1;
      }
      pages.push(rest.slice(0, best));
      rest = rest.slice(best);
    }
  };

  /* Жадный набор оставляет последнюю страницу полупустой: первые берут
     сколько влезет, остаток достаётся хвосту. Раскладываем поровну —
     столько же страниц, но по одинаковому числу строк, и пустота внизу
     делится между всеми вместо того, чтобы копиться на последней. */
  const balance = () => {
    if (pages.length < 2) return;

    /* Подбираем норму на страницу так, чтобы она сошлась сама с собой:
       делим на столько страниц, сколько получилось в прошлый раз. Одного
       прохода мало — норма от жадного набора даёт больше страниц, и
       лишняя оказывалась почти пустой. Двух-трёх хватает, дальше
       обрываем, чтобы не крутиться зря. */
    const lay = (t) => {
      const out = [];
      let rest = ALL.slice();
      while (rest.length) {
        let take = Math.min(t, rest.length);
        while (take > 1 && !fits(rest.slice(0, take))) take--;
        out.push(rest.slice(0, take));
        rest = rest.slice(take);
      }
      return out;
    };

    let P = pages.length;
    for (let iter = 0; iter < 4; iter++) {
      const out = lay(Math.ceil(ALL.length / P));
      pages = out;
      if (out.length === P) break;
      P = out.length;
    }

    /* Хвост всё равно копится: страницы ужимаются по одной, и остаток
       сваливается в последнюю — она выходила с единственной фамилией на
       весь экран. Перекладываем в неё с предпоследней, пока разрыв не
       сойдёт до одной строки. */
    if (pages.length < 2) return;
    const last = pages[pages.length - 1];
    const prev = pages[pages.length - 2];
    while (prev.length - last.length > 1) {
      const moved = prev[prev.length - 1];
      if (!fits([moved, ...last])) break;
      prev.pop();
      last.unshift(moved);
    }
  };

  /* Остаток высоты раздаём строкам: без этого внизу оставалась полоса
     пустого фона в полстроки — экран выглядел недоделанным. Не тянем,
     когда делить пришлось бы больше половины высоты строки: страница с
     двумя фамилиями на весь экран смотрелась бы ещё хуже пустоты. */
  const stretch = () => {
    ALL.forEach((u) => u.rows.forEach((r) => { r.style.height = ""; }));
    const vis = pages[cur].flatMap((u) => u.rows);
    if (!vis.length) return;
    const last = vis[vis.length - 1];
    const gap = box.getBoundingClientRect().bottom - last.getBoundingClientRect().bottom;
    if (gap < 6) return;
    /* Медиана, а не первая строка: первой на странице может оказаться
       узкая полоса «мало данных» в 38 пикселей, и порог считался от неё
       — страница с законной пустотой в четверть экрана оставалась
       нетронутой. */
    const share = gap / vis.length;
    const hs = vis.map((r) => r.getBoundingClientRect().height).sort((a, b) => a - b);
    const base = hs[hs.length >> 1];
    if (!base || share > base * 0.5) return;
    // Округляем вниз: вверх набегало по пикселю на строку и страница
    // переполнялась ровно на эту мелочь.
    vis.forEach((r) => {
      r.style.height = Math.floor(r.getBoundingClientRect().height + share) + "px";
    });
  };

  const show = (i) => {
    if (!pages.length) return;
    cur = ((i % pages.length) + pages.length) % pages.length;
    showOnly(pages[cur]);
    stretch();
    if (num) num.textContent = pages.length > 1 ? `${cur + 1} / ${pages.length}` : "";
    restart();
  };

  /* Полоса внизу — отсчёт до следующей порции: наливается ровно за то
     время, что страница стоит. С трёх метров это заметнее любой цифры. */
  const restart = () => {
    if (!bar) return;
    bar.style.transition = "none";
    bar.style.width = "0%";
    void bar.offsetWidth;              // заставляем применить сброс
    bar.style.transition = `width ${HOLD}ms linear`;
    bar.style.width = "100%";
  };

  /* Пересобрать страницы: после перерисовки данных все строки снова
     показаны, высоты можно мерить. Вызывается из renderAll. */
  /* Отсчёт заводим заново после каждого перехода — и своего, и ручного.
     Иначе нажатие стрелки за секунду до срабатывания таймера
     перелистывало бы сразу через две страницы. */
  const arm = () => {
    clearInterval(timer);
    if (pages.length > 1) timer = setInterval(() => show(cur + 1), HOLD);
    else if (bar) bar.style.width = "0%";
  };

  const go = (d) => { show(cur + d); arm(); };

  const nav = $("#tvNav");
  if (nav) {
    const prev = $("#tvPrev"), next = $("#tvNext");
    if (prev) prev.addEventListener("click", () => go(-1));
    if (next) next.addEventListener("click", () => go(1));
    /* Стрелки на клавиатуре — тем же делом: если к телевизору подключат
       что угодно с клавишами, листать можно будет и с них. */
    document.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") { e.preventDefault(); go(-1); }
      else if (e.key === "ArrowRight") { e.preventDefault(); go(1); }
    });
  }

  const rebuild = () => {
    build();
    balance();
    show(0);
    arm();
    // Стрелки и номер прячем, когда всё влезло на один экран.
    if (nav) nav.hidden = pages.length < 2;
  };

  window.tvRepage = rebuild;
  rebuild();
}

function wireShowcase() {
  const link = $("#tvLink");
  if (!link) return;

  /* Выбор «что показывать» вшивается прямо в адрес: витрина открывается
     без входа, своих настроек не помнит и знать о них может только из
     ссылки. Заодно её можно послать кому-то уже настроенной. */
  const kpi = $("#tvKpi"), mx = $("#tvMx"), frame = $("#tvFrame"), open = $("#tvOpen");
  /* Оба параметра пишем всегда, даже нулями. Иначе снятые флажки давали
     пустой адрес, а пустой адрес по уговору значит «старая ссылка с
     телевизора» и показывает показатели. Выключить их было нельзя:
     галочка снималась, а лента в предпросмотре оставалась. */
  const build = () => {
    const q = new URLSearchParams();
    q.set("kpi", kpi && kpi.checked ? "1" : "0");
    q.set("mx", mx && mx.checked ? "1" : "0");
    return "/tv.html?" + q.toString();
  };
  const apply = () => {
    const path = build();
    link.value = location.origin + path;
    if (open) open.href = path;
    // Пересобираем адрес кадра — iframe перезагрузится с новым набором.
    if (frame) frame.src = path;
  };
  /* Предпросмотр тянем на всю свободную ширину карточки. Масштаб был
     записан числом (.38), и экран навсегда оставался шестисот пикселей
     шириной: на широком мониторе половина карточки пустовала, а сама
     страница витрины в кадре была нечитаемой. Считаем от того, что есть,
     и пересчитываем при изменении окна. */
  const TV_W = 1600, TV_H = 980;
  const fitPreview = () => {
    const shell = $(".frame");
    const screen = shell && shell.querySelector(".screen");
    if (!shell || !screen || !frame) return;

    /* Ширину меряем от общего контейнера, а не от карточки предпросмотра:
       у той ширина зависит от содержимого, а содержимое — от неё. Замер
       по карточке уводил в петлю и схлопывал экран до минимума. */
    const wrap = shell.closest(".tv-wrap");
    const side = wrap && wrap.querySelector(".tv-side");
    /* Колонки могут стоять и рядом, и друг под другом — под узкое окно
       есть своя раскладка. Вычитаем ширину боковой колонки только когда
       она действительно сбоку, иначе на узком экране отняли бы её
       дважды и от карточки не осталось бы ничего. */
    const prevEl = shell.closest(".tv-prev");
    const stacked = side && prevEl
      && side.getBoundingClientRect().top >= prevEl.getBoundingClientRect().bottom - 1;
    const room = wrap
      ? wrap.clientWidth - (stacked ? 0 : (side ? side.offsetWidth : 0))
      : shell.parentElement.clientWidth;
    /* Поля карточки, рамка «телевизора» и запас, чтобы не лечь на границу.
       Нижний порог — 200, и он именно порог, а не гарантия: прежние 280
       были больше, чем доступное место на узком экране, и «телевизор»
       вылезал за карточку поверх соседней колонки. */
    const availW = Math.max(200, Math.min(room - 56, room));

    /* И по высоте тоже — иначе на невысоком мониторе рамка уезжала за
       нижний край, и предпросмотр приходилось выискивать прокруткой.

       Меряем от ВЕРХА КАРТОЧКИ, а не от верха самой рамки. Рамка теперь
       centered по свободной высоте, то есть её положение зависит от её
       же размера: замер по ней уводил бы в ту же петлю, что и замер
       ширины по карточке, — рамка съезжала вниз, свободной высоты
       «оставалось» меньше, рамка ужималась, и так по кругу.
       Верх карточки прибит к низу шапки и не зависит ни от чего. */
    const card = shell.closest(".tv-prev");
    const h2 = card && card.querySelector("h2");
    const cap = card && card.querySelector(".tv-cap");
    const cardTop = (card || shell).getBoundingClientRect().top;
    const spent = (h2 ? h2.offsetHeight : 0) + (cap ? cap.offsetHeight : 0);
    const availH = Math.max(180, window.innerHeight - cardTop - spent - 44);

    const k = Math.min(availW / TV_W, availH / TV_H, 0.9);
    frame.style.transform = `scale(${k})`;
    screen.style.width = Math.round(TV_W * k) + "px";
    screen.style.height = Math.round(TV_H * k) + "px";
  };

  [kpi, mx].forEach((c) => c && c.addEventListener("change", apply));
  apply();
  fitPreview();
  /* Наблюдатель за самой карточкой, а не событие окна: раздел
     открывается скрытым, у скрытого ширины нет, и замер по resize
     промахивался — экран оставался прежнего размера и вылезал за
     карточку. Наблюдатель срабатывает и на показе раздела, и на смене
     размера окна, и на схлопывании боковой панели. */
  const wrapEl = $(".tv-wrap");
  if (wrapEl && window.ResizeObserver) new ResizeObserver(fitPreview).observe(wrapEl);
  window.addEventListener("resize", fitPreview);
  /* И прямой пересчёт при входе в раздел. Наблюдатель за размером на
     показ скрытого блока не отзывается: первый замер прошёл на нулевой
     ширине, экран получил свой минимум в 320 и таким остался. */
  document.querySelectorAll('.nav a[data-s="tv"]').forEach((a) =>
    a.addEventListener("click", () => setTimeout(fitPreview, 40)));

  $("#tvCopy").addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(link.value);
      $("#tvCopy").textContent = "Скопировано";
      setTimeout(() => { $("#tvCopy").textContent = "Копировать"; }, 1600);
    } catch (e) {
      link.select();               // на http без разрешения буфера — выделяем
    }
  });
  $("#tvFrame").addEventListener("load", () => {
    $("#tvAlive").textContent = "предпросмотр обновлён " + fmtStamp(new Date().toISOString());
  });
}

/* ── участок мастера ──────────────────────────────────────────
   Заказчик, 29.09.2026: «не нашла, как мастера подвязать к участку».
   Участок брался только из таблицы цикла производства. Теперь три слоя,
   сильнейший сверху: назначен руками (администратор или начальник
   участка) → по объектам (начальник участка на объектах, где человек
   мастер) → таблица цикла, как было. Ключ человека — «фамилия-инициал»,
   тот же, что у людей в obligations.json. */
const fioKey = (name) => {
  const t = String(name || "").replace(/\./g, " ").replace(/ё/g, "е").replace(/Ё/g, "Е")
    .toLowerCase().split(/\s+/).filter(Boolean);
  return t.length ? t[0] + (t[1] ? "-" + t[1][0] : "") : "";
};
const shortFio = (name) => {
  const t = String(name || "").replace(/\./g, ". ").split(/\s+/).filter(Boolean);
  return t.length ? t[0] + (t[1] ? " " + t[1][0].toUpperCase() + "." : "") : "";
};
const BAND_SRC = { manual: "назначен вручную", objects: "по объектам", table: "по таблице цикла" };

async function loadBands() {
  if (typeof AUTH !== "object" || isTV()) return;
  try { BANDS = await AUTH.api("GET", "/people/bands"); } catch (e) { BANDS = null; }
}

function applyBands() {
  if (!DATA) return;
  // Подпись участка — как в таблице цикла («Смирнов И.»), если начальник
  // там есть; иначе из его ФИО в карточке объекта.
  const labelOf = new Map();
  for (const o of DATA.obligations) if (o.band) labelOf.set(fioKey(o.band), o.band);
  const bySites = new Map();
  for (const st of (BANDS && BANDS.sites) || []) {
    if (!st.master_key || !st.foreman_key) continue;
    const lbl = labelOf.get(st.foreman_key) || shortFio(st.foreman);
    if (!bySites.has(st.master_key)) bySites.set(st.master_key, []);
    bySites.get(st.master_key).push({ band: lbl, site: st.name });
  }
  const manual = (BANDS && BANDS.manual) || {};
  for (const p of DATA.people) {
    if (p.band_table === undefined) p.band_table = p.band || null;
    const sites = bySites.get(p.person_key) || [];
    // На объектах у разных начальников — берём того, у кого объектов
    // больше; поровну — того, что в таблице цикла.
    const n = new Map();
    for (const x of sites) n.set(x.band, (n.get(x.band) || 0) + 1);
    const auto = [...n.entries()].sort((a, b) => b[1] - a[1]
      || (a[0] === p.band_table ? -1 : b[0] === p.band_table ? 1 : 0))[0];
    p.band_sites = sites;
    p.band_auto = auto ? auto[0] : p.band_table;
    p.band_auto_src = auto ? "objects" : "table";
    p.band_hand = manual[p.person_key] || null;
    p.band = p.band_hand ? p.band_hand.band : p.band_auto;
    p.band_src = p.band_hand ? "manual" : p.band_auto_src;
  }
}

function bandChip(p) {
  if (isTV()) return "";
  const can = !!(BANDS && BANDS.can_edit);
  if (!p.band && !can) return "";
  return `<button type="button" class="m-band ${p.band_src || ""}${p.band ? "" : " none"}"
    data-band-key="${esc(p.person_key)}"${can ? "" : " disabled"}
    title="${p.band ? `Участок ${esc(p.band)} — ${BAND_SRC[p.band_src] || ""}` : "Участок не определён"}${
      can ? ". Нажмите, чтобы сменить" : ""}">${p.band ? "уч. " + esc(p.band) : "участок не задан"}</button>`;
}

function openBandModal(key) {
  const p = DATA && DATA.people.find((x) => x.person_key === key);
  if (!p || !(BANDS && BANDS.can_edit)) return;
  const ru = (a, b) => a.localeCompare(b, "ru");
  const known = [...new Set([
    ...DATA.obligations.map((o) => o.band),
    ...DATA.people.map((x) => x.band_auto),
    ...Object.values(BANDS.manual || {}).map((m) => m.band),
  ].filter(Boolean))].sort(ru);
  const autoTxt = p.band_auto ? `${p.band_auto} (${BAND_SRC[p.band_auto_src]})` : "не определён";
  const sites = p.band_sites || [];
  const box = document.createElement("div");
  box.className = "pf-modal";
  box.innerHTML = `
    <div class="pf-crop cnt-card band-card" role="dialog" aria-label="Участок мастера">
      <h3>Участок: ${esc(p.fio || p.sheet_name)}</h3>
      <div class="fld"><label for="bandSel">Участок</label>
        <select id="bandSel">
          <option value="">Автоматически — ${esc(autoTxt)}</option>
          ${known.map((b) => `<option value="${esc(b)}"${p.band_hand && p.band_hand.band === b
            ? " selected" : ""}>${esc(b)}</option>`).join("")}
        </select></div>
      <div class="fld"><label for="bandNew">Или новый участок</label>
        <input id="bandNew" autocomplete="off" placeholder="Фамилия И. начальника участка"></div>
      <div class="band-why">
        <div>По объектам: ${sites.length ? sites.map((x) => `${esc(x.site)} — ${esc(x.band)}`)
          .join("; ") : "мастером ни на одном объекте не указан"}</div>
        <div>В таблице цикла: ${p.band_table ? esc(p.band_table) : "нет"}</div>
        ${p.band_hand ? `<div>Назначен вручную: ${esc(p.band_hand.author)}, ${
          esc(fmtStamp(p.band_hand.at))}</div>` : ""}
      </div>
      <div class="band-err" hidden></div>
      <div class="pf-modal-foot"><span class="grow"></span>
        <button type="button" class="btn ghost" data-no>Отмена</button>
        <button type="button" class="btn" data-ok>Сохранить</button></div>
    </div>`;
  document.body.appendChild(box);
  const close = () => { document.removeEventListener("keydown", onKey); box.remove(); };
  const onKey = (e) => { if (e.key === "Escape") close(); };
  document.addEventListener("keydown", onKey);
  box.addEventListener("click", (e) => { if (e.target === box) close(); });
  box.querySelector("[data-no]").addEventListener("click", close);
  box.querySelector("[data-ok]").addEventListener("click", async () => {
    const band = box.querySelector("#bandNew").value.trim() || box.querySelector("#bandSel").value;
    const err = box.querySelector(".band-err");
    try {
      await AUTH.api("POST", "/people/bands", { person_key: key, band });
      close();
      await loadBands();
      applyBands();
      buildFilters();
      renderAll();
    } catch (e) {
      err.textContent = "Не сохранилось: " + e.message;
      err.hidden = false;
    }
  });
}

/* ── запуск ───────────────────────────────────────────────── */
/* Плашка «нет связи» над разделом. Что случилось — словами; сырой текст
   ошибки — только в подсказке, для разбора; «Повторить» — не ждать таймера. */
function showOffline(html, detail, retry) {
  const off = $("#offline");
  off.innerHTML = `<i class="off-dot" aria-hidden="true"></i><span>${html}</span>` +
    (retry ? `<button type="button" class="off-retry">Повторить</button>` : "");
  off.title = detail ? `Для разработчика: ${detail}` : "";
  const btn = off.querySelector(".off-retry");
  if (btn) btn.onclick = () => { btn.disabled = true; retry(); };
  off.hidden = false;
}

async function loadData() {
  const resp = await fetch("data/obligations.json", { cache: "no-store" });
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  DATA = await resp.json();
  window.DATA = DATA;

  NAMES = {};
  for (const p of DATA.people) {
    NAMES[p.person_key] = p.fio || p.sheet_name || p.person_key;
  }
}

/* Лесенка прилипания. Верхняя полоса встаёт первой, всё остальное —
   дерево договоров, шапка спеки, заголовок «Мастера» — под ней. Высота
   полосы зависит от длины названия раздела и от ширины окна, поэтому
   расстояние считаем, а не записываем числом: угаданное разъедется.

   Зазора нет вовсе: содержимое идёт вплотную к полосе, поэтому лесенка
   начинается ровно от её нижнего края. */
function wireStick() {
  const top = $(".top");
  if (!top) return;                    // на витрине верхней полосы нет
  const apply = () => document.documentElement.style.setProperty(
    "--stick", top.offsetHeight + "px");
  apply();
  new ResizeObserver(apply).observe(top);
}

/* Схлопывание боковой панели до одних значков. Выбор переживает
   перезагрузку: узкий экран — это свойство рабочего места, а не
   сегодняшнего настроения. */
function wireSidebar() {
  const side = $(".side"), btn = $("#side-btn");
  if (!side || !btn) return;           // на витрине панели нет
  const KEY = "karkas-side-min";
  const apply = (min) => {
    side.classList.toggle("min", min);
    btn.title = min ? "Развернуть меню" : "Свернуть меню";
    btn.setAttribute("aria-expanded", String(!min));
  };
  const saved = () => {
    try { return localStorage.getItem(KEY) === "1"; } catch (e) { return false; }
  };
  /* Телефон: меню во всю подпись съедало половину экрана, а раздел
     «Письма» заведён ради мастеров с телефона (23.09.2026). На узком
     экране меню всегда стоит значками; развернуть можно, но выбор не
     запоминается, и после выбора раздела меню сворачивается само. */
  const narrow = matchMedia("(max-width: 684px)");
  /* Первый кадр — сразу в нужной ширине, без анимации: иначе на телефоне
     меню на полсекунды вставало во всю ширину, а раздел под ним успевал
     разложиться в оставшуюся узкую полосу. */
  side.style.transition = "none";
  apply(narrow.matches || saved());
  void side.offsetWidth;
  requestAnimationFrame(() => { side.style.transition = ""; });
  narrow.addEventListener("change", () => apply(narrow.matches || saved()));
  // Подписи всплывают на значках, когда текста не видно.
  document.querySelectorAll(".nav a").forEach((a) => { a.title = a.textContent.trim(); });
  btn.addEventListener("click", () => {
    const min = !side.classList.contains("min");
    apply(min);
    if (narrow.matches) return;
    try {
      if (min) localStorage.setItem(KEY, "1");
      else localStorage.removeItem(KEY);
    } catch (e) { /* приватный режим — доживём вкладкой */ }
  });
  side.addEventListener("click", (e) => {
    if (narrow.matches && e.target.closest("a[data-s]")) apply(true);
  });
}

/* Пояснение к награде — по наведению на сам знак.

   Сначала это была карточка по клику на фамилию, и вышло неправильно:
   клик по человеку обещает досье, а показывал награды; сами же знаки,
   на которые и хочется ткнуть, не реагировали ни на что. Спрашивают
   всегда про конкретный значок — «а этот за что?» — значит и отвечать
   должен он сам.

   Наведение, а не клик: вопрос задают мимоходом, и лишнее действие
   (нажал, прочитал, нажал закрыть) дороже самого ответа. Фокус
   обрабатываем наравне с мышью, чтобы подсказка доставалась и с
   клавиатуры. На витрине не вешаем — там нет мыши. */
function wireAwardTip() {
  if (isTV() || !window.Awards) return;
  let tip = null, anchor = null, hideT = null;

  const hide = () => {
    clearTimeout(hideT);
    if (tip) { tip.remove(); tip = null; anchor = null; }
  };
  /* Перерисовка обязана убрать подсказку: знак под курсором заменяется
     новым узлом, и она осталась бы висеть сиротой. */
  closeAwardTip = hide;

  const place = (el, a0) => {
    const a = a0.getBoundingClientRect();
    const w = el.offsetWidth, h = el.offsetHeight, pad = 8;
    /* По центру знака, а не по его левому краю: знак мелкий, и подсказка,
       выровненная по краю, выглядит съехавшей. */
    let left = a.left + a.width / 2 - w / 2;
    let top = a.bottom + 8;
    if (left + w > innerWidth - pad) left = innerWidth - w - pad;
    if (left < pad) left = pad;
    if (top + h > innerHeight - pad) top = Math.max(pad, a.top - h - 8);
    el.style.left = left + "px";
    el.style.top = top + "px";
  };

  /* Текст кладём через textContent: он пришёл из данных, а не из кода,
     и собирать разметку строкой здесь незачем. */
  const show = (el) => {
    if (anchor === el) { clearTimeout(hideT); return; }
    hide();
    tip = document.createElement("div");
    tip.className = "aw-tip";

    const h = document.createElement("b");
    h.textContent = el.dataset.t || "";
    const p = document.createElement("span");
    p.textContent = el.dataset.w || "";
    tip.append(h, p);
    if (el.dataset.g) {
      const g = document.createElement("i");
      g.textContent = el.dataset.g;
      tip.append(g);
    }

    document.body.appendChild(tip);
    anchor = el;
    place(tip, el);
  };

  const over = (e) => {
    const el = e.target.closest(".aw[data-t]");
    if (el) show(el);
    else if (!e.target.closest(".aw-tip")) hideT = setTimeout(hide, 60);
  };

  document.addEventListener("mouseover", over);
  document.addEventListener("focusin", over);
  document.addEventListener("mouseleave", hide);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") hide(); });
  addEventListener("resize", hide);
  addEventListener("scroll", () => {
    if (!tip || !anchor) return;
    const a = anchor.getBoundingClientRect();
    if (a.bottom < 0 || a.top > innerHeight) hide();
    else place(tip, anchor);
  }, true);
}

async function main() {
  wireTheme();   // до загрузки данных, чтобы не мигало светлым
  // Адрес — сразу: раздел и вкладку нужно знать до первой отрисовки, а не
  // после загрузки данных (иначе на секунду показывались «Сотрудники»).
  readURL();
  document.addEventListener("karkas:ref-tab", (e) => {
    STATE.ref = e.detail || "";
    if (STATE.sec === "ref") writeURL();
  });
  wireStick();
  wireSidebar();
  /* Меню оживляем до всего остального. Обработчик висит на всей панели и
     от пользователя не зависит, а вот applyAccess ниже умеет увести из
     закрытого раздела — и делает это щелчком по пункту. Пока wireNav
     стоял в конце, этот щелчок уходил в пустоту: человек без права на
     «Сотрудников» оставался смотреть на «Сотрудников». */
  wireNav();

  /* Нужный раздел — сразу, а не после ответа сервера. Без этого при
     возврате по ссылке «?s=cnt» первым кадром показывались «Сотрудники»
     со своими скелетами, и лишь потом подставлялись «Контрагенты». */
  if (STATE.sec) paintSection(STATE.sec);

  // Витрина — единственная страница без входа, это её смысл.
  if (!isTV()) {
    /* Панель рисуем ДО запроса — по снимку прошлого захода. Иначе имя
       внизу и пункт «Пользователи» появляются только после ответа
       сервера, и панель достраивается на глазах, пока «Сотрудники» и
       «Витрина» из разметки стоят на месте с первого кадра.

       Это только внешний вид: ниже придёт настоящий ответ и всё
       поправит, а доступ в любом случае решает сервер. */
    const прошлый = AUTH.cached();
    if (прошлый) { paintUser(прошлый); applyAccess(прошлый); }

    await AUTH.boot();         // сверяем токен с сервером до отрисовки
    const me = AUTH.require();
    if (!me) return;           // уже уходим на login.html
    wireUser(me);
    applyAccess(me, true);     // права настоящие — можно и увести
    /* Тема, выбранная в профиле, живёт за учёткой: на другом компьютере
       она должна быть та же. Пустая строка означает «как в браузере» —
       тогда остаётся то, что уже поставил wireTheme. */
    if (me.theme) {
      applyTheme(me.theme);
      // Тема из профиля — и в браузер: при следующем обновлении строка в
      // <head> поставит её до первого кадра, и экран не перещёлкнется.
      try { localStorage.setItem(THEME_KEY, me.theme); } catch (e) { /* не критично */ }
    }
  }

  try {
    await loadData();
    await loadBands();
    applyBands();
  } catch (e) {
    // Чаще всего сервер перезапускается при выкладке — это на минуту.
    // Словами и с кнопкой, а не путями к файлам; телевизор повторяет сам.
    showOffline("<b>Не удалось загрузить данные.</b> Обычно это на минуту — обновите страницу.",
      (e && e.message) || e, () => location.reload());
    if (isTV()) setTimeout(() => location.reload(), 60000);
    return;
  }

  readURL();
  renderChrome();
  buildFilters();
  syncChips();
  renderAll();
  // «Данные рейтинга» — всем, кто видит рейтинг; загружать — по праву.
  const rtb = $("#rtOpen");
  if (rtb) rtb.hidden = !BANDS || typeof RATINGDATA !== "object";

  // Элементы есть в платформе и отсутствуют на витрине — вешаем по факту.
  const on = (sel, fn) => { const e = $(sel); if (e) e.addEventListener("click", fn); };

  const mode = $("#mode");
  if (mode) {
    mode.addEventListener("click", (e) => {
      const b = e.target.closest("[data-t]");
      if (!b) return;
      STATE[b.dataset.t] = !STATE[b.dataset.t];
      writeURL();
      syncMode();
      renderAll();
    });
    syncMode();
  }

  on("#low-btn", () => {
    STATE.low = !STATE.low;
    writeURL();
    syncChips();
    renderAll();
  });

  // Участок мастера — нажатием на метку в строке (кому можно менять).
  const mb = $("#masters-body");
  if (mb) mb.addEventListener("click", (e) => {
    const b = e.target.closest("[data-band-key]");
    if (b && !b.disabled) openBandModal(b.dataset.bandKey);
  });
  // Вкладки «Сотрудники | Отделы». Выбран отдел или участок — во
  // «Отделах» он сразу раскрыт.
  document.querySelectorAll("[data-eff]").forEach((b) => b.addEventListener("click", () => {
    STATE.tab = b.dataset.eff;
    if (STATE.tab === "depts") {
      if (STATE.dept) UI.open.add("d:" + STATE.dept);
      if (STATE.band) {
        UI.open.add("u:" + STATE.band);
        const d = deptModel(currentView("", "")).find((r) => r.units.some((x) => x.u.label === STATE.band));
        if (d) UI.open.add("d:" + d.d.name);
      }
    }
    writeURL();
    renderAll();
  }));
  on("#mxToggle", () => { STATE.mx = !STATE.mx; writeURL(); renderAll(); });
  // «Вне рейтинга» — раскрыть или свернуть в своём списке.
  const secEmp = $("#sec-emp");
  if (secEmp) secEmp.addEventListener("click", (e) => {
    const f = e.target.closest("[data-fold]");
    if (!f || f.disabled) return;
    UI.fold[f.dataset.fold] = !UI.fold[f.dataset.fold];
    renderAll();
  });
  // Дерево отделов: руководитель — окно смены, строка — раскрыть.
  const db = $("#depts-body");
  const toggleRow = (key) => {
    if (UI.open.has(key)) UI.open.delete(key); else UI.open.add(key);
    renderAll();
  };
  if (db) {
    db.addEventListener("click", (e) => {
      const b = e.target.closest("button[data-dp-head]");
      if (b) { openHeadModal(b.dataset.dpHead); return; }
      if (e.target.closest("[data-fold]")) return;
      const row = e.target.closest("[data-row]");
      if (row) toggleRow(row.dataset.row);
    });
    db.addEventListener("keydown", (e) => {
      const row = e.target.closest("[data-row]");
      if (row && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); toggleRow(row.dataset.row); }
    });
  }
  on("#deptsAll", () => {
    const keys = [];
    for (const r of deptModel(currentView("", ""))) {
      keys.push("d:" + r.d.name);
      for (const x of r.units) keys.push("u:" + x.u.label);
    }
    const allOpen = keys.every((k) => UI.open.has(k));
    keys.forEach((k) => (allOpen ? UI.open.delete(k) : UI.open.add(k)));
    renderAll();
  });
  // «Данные рейтинга»: кнопка в шапке и ссылка в пустом списке. После
  // загрузки таблицы рейтинг пересоберётся в течение минуты — подтянем
  // файл сами, не дожидаясь пятиминутного обновления.
  const openData = () => {
    if (typeof RATINGDATA !== "object") return;
    RATINGDATA.open({
      changed: () => {
        clearTimeout(openData.t);
        openData.t = setTimeout(async () => {
          try {
            await loadData(); await loadBands(); applyBands();
            renderChrome(); buildFilters(); renderAll();
          } catch (e) { /* подтянется плановым обновлением */ }
        }, 70 * 1000);
      },
    });
  };
  on("#rtOpen", openData);
  document.addEventListener("click", (e) => {
    if (e.target.closest("[data-rt-open]")) openData();
  });

  wireShowcase();
  wireAwardTip();
  watchSelects();

  if (!isTV() && typeof PROFILE === "object") {
    const me = AUTH.current();
    PROFILE.init(me);
    if (typeof MESSENGER === "object") MESSENGER.init(me);
    // Кнопка «Сообщить об ошибке» и счётчик правок у пункта меню.
    if (typeof ISSUES === "object") ISSUES.init(me);
    // Справка по разделу — значок «?» в верхней полосе (правка № 32).
    if (typeof FAQ === "object" && !me.must_change_pw) FAQ.init();
    // Задачи: счётчик у пункта меню — новые мне и просроченные (правка № 6).
    if (typeof TASKS === "object") TASKS.init(me);
    // Вектор виден всем; счётчик своих решений совета — членам совета (WG.init решает сам).
    if (typeof WG === "object") WG.init(me);
    // Заявки: счётчик — ждут моего согласования; у снабжения — согласованные, не заказанные.
    if (typeof REQ === "object") REQ.init(me);
    /* Куда попасть после входа. Раздел мог оказаться закрытым (роль
       понизили) — openSection молча ничего не сделает, и человек
       останется на «Сотрудниках», а не упрётся в пустой экран.

       Смена выданного пароля важнее любого стартового раздела. */
    /* Куда попасть при открытии страницы, по убыванию силы:
       1) раздел из адреса — человек перезагрузил страницу или пришёл по
          присланной ссылке, и в обоих случаях назвал раздел явно;
       2) требование сменить выданный пароль — важнее любых пожеланий;
       3) стартовый раздел из настроек профиля;
       4) «Сотрудники» по умолчанию. */
    if (me.must_change_pw) openSection("me");
    else if (STATE.sec) openSection(STATE.sec);
    else if (me.start_section) openSection(me.start_section);
    /* Счётчик у «Обучения» — сразу, не дожидаясь, пока зайдут в раздел:
       у мастера это программы в работе, у составителя — фото на проверке. */
    if (typeof LEARN === "object" && AUTH.can(me, "learn")) LEARN.peek();
  }
  if (isTV()) startTvPager();
  /* «Спецификации» тянут проводки и добавления сразу при старте, ещё до
     того, как в раздел зашли. Человеку без права на объекты это давало
     две молчаливые 403 в консоли на каждой загрузке страницы: запрос
     уходил заведомо в отказ. Спрашиваем то же право, что открывает сам
     раздел. */
  if (typeof initObjects === "function"
      && (isTV() || AUTH.can(AUTH.current(), "obj"))) {
    initObjects();
  }
  tick();
  setInterval(tick, 1000);

  // Телевизор висит сутками — данные подтягиваем сами. Если запрос упал,
  // старые числа остаются, но с явной плашкой: тихо врать хуже, чем молчать.
  // Один сбой её не зажигает: при выкладке сервер перезапускается, это
  // полминуты (22.10.2026 плашка с «HTTP 500» так и провисела до следующего
  // обновления) — повторяем через 20 с. Не вышло и тогда — строка со временем
  // данных на экране; пока связи нет, пробуем раз в минуту, вернулась — гаснет.
  let lastOk = new Date(), fails = 0, refreshTimer = 0;
  const hhmm = (d) => `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  async function refresh() {
    clearTimeout(refreshTimer);
    try {
      await loadData();
      await loadBands();
      applyBands();
      lastOk = new Date();
      fails = 0;
      $("#offline").hidden = true;
      renderChrome();
      renderAll();
    } catch (e) {
      fails += 1;
      if (fails > 1) {
        showOffline(`<b>Нет связи с сервером.</b> На экране данные на ${hhmm(lastOk)} — обновятся сами, как связь вернётся.`,
          (e && e.message) || e, refresh);
      }
    }
    refreshTimer = setTimeout(refresh, !fails ? REFRESH_MS : fails === 1 ? 20000 : 60000);
  }
  refreshTimer = setTimeout(refresh, REFRESH_MS);

  // ширина колонки объекта считается от окна — пересчитываем при ресайзе
  let resizeTimer = null;
  addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(renderAll, 120);
  });
}

main();
