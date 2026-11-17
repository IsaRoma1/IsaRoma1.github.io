/* Прайс материалов — номенклатура конторы и цены на неё.

   Не то же, что расценки на работы. Труд свой: цену ему назначаем мы и
   меняем раз в год. Товар чужой: цену называет поставщик и меняет каждую
   неделю. Поэтому у материала цен несколько — по одной на площадку плюс
   вписанные руками, — и у каждой своя дата.

   Дата решает. Цена материала, взятая три недели назад, — уже не цена, и
   единственный способ это увидеть — цвет: до недели зелёная, до двух
   жёлтая, дальше красная. К расценкам на работы такое не прикручено
   намеренно: они не протухают, и цветные строки там были бы шумом,
   который перестают замечать.

   Номенклатура собирается из разобранных спецификаций: то, что уже
   проходило через объекты, и есть настоящий прайс. Придумывать его с
   нуля незачем. */
"use strict";

const MATS = (() => {
  const $m = (s, r) => (r || document).querySelector(s);
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  const ICO = {
    find: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11"
      r="6.5"/><path d="M20.5 20.5 16 16"/></svg>`,
    up: `<svg viewBox="0 0 24 24" aria-hidden="true"><path
      d="M12 16V4M7 9l5-5 5 5M4 17v2a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-2"/></svg>`,
    plus: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>`,
    edit: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4.5 19.5h4l10-10a2.1 2.1 0 0 0-3-3l-10 10z"/></svg>`,
    trash: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4.5 6.5h15M9.5 6.5V4.8a1.3 1.3 0 0 1 1.3-1.3h2.4a1.3 1.3 0 0 1 1.3 1.3v1.7M6.5 6.5l.9 12.2A1.5 1.5 0 0 0 8.9 20h6.2a1.5 1.5 0 0 0 1.5-1.3l.9-12.2"/></svg>`,
    funnel: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16l-6.2 7.4V19l-3.6-1.8v-4.8z"/></svg>`,
    clip: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 11.5l-7.8 7.8a5 5 0 0 1-7.1-7.1l8.1-8.1a3.3 3.3 0 0 1 4.7 4.7l-8.1 8.1a1.7 1.7 0 0 1-2.4-2.4l7.4-7.4"/></svg>`,
    dots: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="5.5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="18.5" cy="12" r="1.6"/></svg>`,
    list: `<svg viewBox="0 0 24 24" aria-hidden="true"><path
      d="M9 6.5h11M9 12h11M9 17.5h11M4.5 6.5h.01M4.5 12h.01M4.5 17.5h.01"/></svg>`,
    seed: `<svg viewBox="0 0 24 24" aria-hidden="true"><path
      d="M4 12a8 8 0 0 1 13.7-5.6"/><path d="M18.5 3v4h-4"/><path
      d="M20 12a8 8 0 0 1-13.7 5.6"/><path d="M5.5 21v-4h4"/></svg>`,
    // Ярлык — «ещё названия» у позиции.
    aka: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.6 13.4 12 22l-9-9V4h9l8.6 8.6a2 2
      0 0 1 0 2.8z"/><circle cx="7.6" cy="7.6" r="1.3"/></svg>`,
    x: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/></svg>`,
    prev: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.5 14.5 12 9l5.5 5.5"/></svg>`,
    next: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.5 9.5 12 15l5.5-5.5"/></svg>`,
    main: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20V8.5M6.5 13 12 7.5l5.5 5.5M5 4h14"/></svg>`,
  };

  let ROWS = [];
  /* Открытая карточка позиции: какая, правится ли, что набрано в поиске,
     какое объединение ждёт подтверждения, похожие с сервера (null — ещё
     ищутся), сообщение под названиями и что вернуть после «убрать». */
  let CARD = null;
  let SRC = [];
  let UNITS = [];
  let CAT = null;          // состояние каталога РС24 на сервере
  /* Полоса каталогов — свёрнута, пока её не раскрыли: каталоги обновляют
     редко, а место над таблицей нужно каждый день. Раскрыта ли — помним в
     браузере. Состояние видно и в свёрнутом виде — точкой на кнопке. */
  const CAT_KEY = "karkas.mat.cat.v1";
  let catOpen = false;
  try { catOpen = localStorage.getItem(CAT_KEY) === "1"; } catch (e) { /* без памяти */ }
  let catTimer = null;
  let search = "";
  let INVOICES = [];       // счета колонок поставщиков
  let INV = {};            // они же по id — для скрепки в ячейке
  let PRICELISTS = [];     // прайс-листы колонок поставщиков
  let IMPORTS = [];        // загрузки книгой в справочник — списки материалов

  /* Строк в прайсе тысячи (17.09.2026 — 5180), и таблица на все сразу —
     это двести тысяч элементов: буква в поиске думала секунду, прокрутка
     дёргалась. Дорисовка порциями помогала только наверху: к тысячной
     строке в таблице снова была тысяча строк. Поэтому рисуем окно — строки
     вокруг видимого места с запасом, а всё, что выше и ниже, заменяют две
     пустые строки нужной высоты: полоса прокрутки та же, что у полной
     таблицы, а строк в документе всегда около сотни, где бы ни листали.
     Отбор, сортировка и счётчик считаются по всем строкам. */
  const WIN_NEAR = 500;    // запас, пока хватает нарисованного, px
  const WIN_FAR = 1600;    // запас, с которым окно рисуется заново, px
  const ROW_H = new Map(); // высота уже нарисованных строк по id
  let rowAvg = 64;         // высота строки, которую ещё не рисовали
  let VIS = [];            // строки текущего отбора
  let VIS_KEY = "";        // каким отбором они получены
  let WIN = [0, 0];        // какие строки отбора нарисованы: [с, до)
  let searchTimer = null;

  /* Фильтры по колонкам, как в Excel: у каждой свой, в её заголовке.
     cols — ключ колонки → условие; sort — одна сортировка на всю таблицу.
     Помним в браузере: это удобство одного человека, а не данные прайса,
     и после обновления страницы отбор не должен слетать. */
  const FLT_KEY = "karkas.mat.filters.v1";
  let FLT = { cols: {}, sort: null };
  try {
    const got = JSON.parse(localStorage.getItem(FLT_KEY) || "{}") || {};
    FLT = { cols: got.cols && typeof got.cols === "object" ? got.cols : {},
            sort: got.sort && got.sort.key ? got.sort : null };
  } catch (e) { /* без памяти */ }
  const saveFlt = () => {
    try { localStorage.setItem(FLT_KEY, JSON.stringify(FLT)); } catch (e) { /* без памяти */ }
  };

  const can = () => AUTH.can(AUTH.current(), "ref_mat");
  // Загрузки (счета, прайс-листы, списки 1С) и колонки поставщиков —
  // отдельная галочка «Счета и прайсы поставщиков» (02.10.2026).
  const canUp = () => AUTH.can(AUTH.current(), "ref_inv");
  // Обновить каталог поставщика — часы нагрузки на сервер и на портал:
  // это решение администратора, а не кнопка для каждого.
  const canCatalog = () => AUTH.isAdmin(AUTH.current());

  const money = (n) => (n === null || n === undefined || n === "")
    ? "" : Number(n).toLocaleString("ru-RU", { minimumFractionDigits: 2,
                                               maximumFractionDigits: 2 });

  const plural = (n, one, few, many) => {
    const a = Math.abs(n) % 100, b = a % 10;
    if (a > 10 && a < 20) return many;
    if (b > 1 && b < 5) return few;
    return b === 1 ? one : many;
  };

  /* Сколько дней цене. Считаем по календарным суткам, а не по часам:
     «вчерашняя» цена не должна становиться позавчерашней оттого, что
     смотрят утром, а взяли её вечером. */
  function days(at) {
    if (!at) return null;
    const t = Date.parse(at);
    if (isNaN(t)) return null;
    const d = new Date(t), n = new Date();
    d.setHours(0, 0, 0, 0); n.setHours(0, 0, 0, 0);
    return Math.round((n - d) / 86400000);
  }

  /* Три возраста, как просил заказчик: до недели, до двух, дальше.
     Отдельно «нет цены» — это не старая цена, а её отсутствие, и путать
     их нельзя. */
  function ageOf(at) {
    const d = days(at);
    if (d === null) return "";
    if (d <= 7) return "fresh";
    if (d <= 14) return "warm";
    return "stale";
  }

  const AGE_NAME = { fresh: "до 7 дней", warm: "8–14 дней", stale: "15 дней и более" };

  /* Ширины колонок таблицы. Числа те же, что были, умноженные на 0.9:
     вёрстка стала плотнее, и колонки ужимаются вместе с текстом, иначе
     таблица осталась бы прежней ширины с мелкими буквами внутри.
     Цена поставщика — 86: шапка переносится на две строки, цена в пять
     знаков с копейками помещается. Постоянная часть — номер 50, название
     не уже 203, марка 99, код 76, завод 83, единица 49, «Встреч.» 70,
     блок «Минимальная цена» 88 и 112, «+ поставщик» 36, крестик 40.
     Каждая колонка поставщика добавляет 86 — дальше таблица уходит под
     прокрутку вбок, и шапка едет с ней. */
  const MAT_SRC_W = 86;
  const MAT_FIXED = 50 + 203 + 99 + 76 + 83 + 49 + 70 + 88 + 112 + 36 + 40;
  /* Ширины колонок раздвигают руками, как в расчёте (grid.js). Колонка
     поставщика запоминается по его id: добавили поставщика — ширины
     остальных на месте. */
  const MATW = GRID.widths("karkas.mat.colw.v1", () => [
    ["no", 50], ["name", 0], ["brand", 99], ["code", 76], ["maker", 83],
    ["unit", 49], ["meet", 70], ["best", 88], ["who", 112],
    ...SRC.map((s) => ["src:" + s.id, MAT_SRC_W]),
    ["plus", 36], ["acts", 40]]);

  /* Прайс перечитывается при каждом показе вкладки и после каждой правки.
     Первый раз — рисуем страницу; дальше — только тело таблицы и только
     если данные изменились: шапка, поиск, открытые окна и место прокрутки
     остаются как были, и страница не перерисовывается на глазах. */
  let SIG = "";
  async function load() {
    const res = await AUTH.api("GET", "/materials");
    const sig = JSON.stringify([res.rows, res.sources, res.invoices, res.pricelists, res.imports,
      res.units]);
    const drawn = !!$m("#matBody");
    if (drawn && sig === SIG) {
      loadCatalog();
      return;
    }
    SIG = sig;
    ROWS = res.rows;
    SRC = res.sources;
    INVOICES = res.invoices || [];
    INV = Object.fromEntries(INVOICES.map((x) => [x.id, x]));
    PRICELISTS = res.pricelists || [];
    IMPORTS = res.imports || [];
    for (const r of ROWS) r._hay = hayOf(r);
    UNITS = res.units;
    // Фильтр по колонке, которой больше нет (колонку поставщика убрали),
    // прятал бы строки без видимой причины.
    const есть = (k) => !k.startsWith("p:") || SRC.some((s) => "p:" + s.id === k);
    for (const k of Object.keys(FLT.cols)) if (!есть(k)) delete FLT.cols[k];
    if (FLT.sort && !есть(FLT.sort.key)) FLT.sort = null;
    if (drawn) paint(); else render();
    paintListsBtn();
    loadCatalog();
    // Прайс готовится в фоне: после обновления страницы досматриваем его.
    PRICELISTS.filter((x) => x.status === "indexing" || x.status === "matching")
      .forEach((x) => watchPricelist(x.id, true));
    lists().filter((x) => x.running).forEach((x) => watchList(x.id, x.filename, true));
  }

  /* Каталоги поставщиков — то, откуда берутся колонки «Русский свет» и
     «Элком». Их состояние показываем прямо здесь, строкой на каталог:
     собран ли, когда и сколько в нём. Иначе «Подтянуть цены» молча
     ничего не находит, и человек думает на подбор, а дело в индексе
     прежней версии на сервере. */
  async function loadCatalog() {
    try {
      const res = await AUTH.api("GET", "/catalog");
      CAT = Array.isArray(res) ? res : [res];
    } catch (e) {
      CAT = [{ id: "rs24", name: "Русский свет", error: e.message }];
    }
    paintCatalog();
    clearTimeout(catTimer);
    if (CAT.some((c) => c.job && c.job.running)) catTimer = setTimeout(loadCatalog, 4000);
  }

  /* Значок поставщика перед названием. Настоящих логотипов файлами пока
     нет — инициалы на плашке; картинка встанет сюда же, в поле img. */
  const LOGO = {
    rs24: { text: "РС", color: "#D6252B" },
    elcom: { text: "ЭК", color: "#1F5FAD" },
    etm: { text: "ЭТ", color: "#F5A623" },
  };

  const HELP = `<span class="mat-help" tabindex="0" aria-label="Чем отличаются кнопки">?<span
      class="mat-help-pop" role="tooltip">
      <span><b>Пересобрать индекс</b> — около минуты. Поиск по каталогу строится
        заново из уже скачанной выгрузки, цены и остатки при этом не меняются.
        Нужно, если подбор стал находить странное, или после обновления
        платформы.</span>
      <span><b>Обновить со склада или с портала</b> — долго: Русский свет около
        получаса, Элком три-четыре часа. Каталог с ценами и остатками заново
        скачивается у поставщика, потом индекс пересобирается сам. Нужно, чтобы
        цены были свежими: например раз в неделю или перед расчётом тендера.</span>
    </span></span>`;

  /* Каталоги — маленькой таблицей: значок и название, сколько позиций,
     когда собран индекс и когда скачана выгрузка, две кнопки. Колонки
     ровные, и кнопки разных каталогов стоят друг под другом. Подпись
     второй кнопки приходит с сервера: у РС24 это склад, у Элкома портал. */
  function catRows(list) {
    const дата = (s) => s ? s.slice(0, 10).split("-").reverse().join(".") : "";
    const cap = (s) => s ? s[0].toUpperCase() + s.slice(1) : "";
    const admin = canCatalog();
    return list.map((c, i) => {
      const logo = LOGO[c.id] || { text: String(c.name || c.id || "?").slice(0, 2) };
      const busy = c.job && c.job.running;
      let info;
      if (c.error) {
        info = `<td class="mat-cat-bad" colspan="3">${esc(c.error)}</td>`;
      } else if (busy) {
        info = `<td class="mat-cat-run" colspan="3"><i class="mat-cat-dot"></i>${
          esc(c.job.step || "обновляется…")}</td>`;
      } else if (c.ok) {
        info = `<td class="mat-cat-num">${Number(c.items).toLocaleString("ru-RU")} ${
            plural(Number(c.items), "позиция", "позиции", "позиций")}</td>
          <td class="mat-cat-date" title="Когда собран поиск по каталогу">индекс ${
            дата(c.built_at)}</td>
          <td class="mat-cat-date" title="Когда каталог скачан у поставщика">${
            c.dump_at ? "выгрузка " + дата(c.dump_at) : "выгрузки нет"}</td>`;
      } else {
        info = `<td class="mat-cat-bad" colspan="3">${esc(c.reason || "не готов")}</td>`;
      }
      const acts = admin ? `<td class="mat-cat-acts">${busy ? "" : `<span class="mat-cat-btns">
          <button type="button" class="btn-ghost" data-cat="build" data-src="${esc(c.id)}"
            title="Около минуты: поиск строится заново из уже скачанной выгрузки">Пересобрать индекс</button>
          <button type="button" class="btn-ghost" data-cat="fetch" data-src="${esc(c.id)}"
            data-name="${esc(c.name || c.id)}" data-hint="${esc(c.fetch_hint || "")}"
            title="${esc(c.fetch_hint || "Выкачать каталог заново и пересобрать")}">${
            esc(cap(c.fetch_label || "обновить"))}</button></span>`}</td>
        <td class="mat-cat-help">${i === 0 ? HELP : ""}</td>` : "";
      const err = c.job && c.job.error && !busy ? `<tr class="mat-cat-err"><td></td>
        <td colspan="${admin ? 5 : 3}">Последнее обновление не удалось: ${esc(c.job.error)}</td></tr>` : "";
      return `<tr>
        <td class="mat-cat-name"><span class="mat-cat-who"><span class="mat-cat-logo"${logo.color
          ? ` style="background:${logo.color}"` : ""}>${logo.img
          ? `<img src="${esc(logo.img)}" alt="">` : esc(logo.text)}</span><span>${
          esc(c.name || c.id || "")}</span></span></td>
        ${info}${acts}</tr>${err}`;
    }).join("");
  }

  function paintCatBtn() {
    const btn = $m("#matCatBtn");
    if (!btn || !CAT) return;
    const busy = CAT.some((c) => c.job && c.job.running);
    const bad = CAT.some((c) => c.error || !c.ok || (c.job && c.job.error && !c.job.running));
    const tone = busy ? "run" : bad ? "bad" : "ok";
    const say = CAT.map((c) => `${c.name || c.id}: ${c.error || (c.job && c.job.running
      ? (c.job.step || "обновляется") : c.ok ? "индекс " + String(c.built_at || "").slice(0, 10)
        .split("-").reverse().join(".") : c.reason || "не готов")}`).join("\n");
    btn.querySelector(".mat-cat-state").className = "mat-cat-state " + tone;
    btn.title = (catOpen ? "Свернуть каталоги поставщиков" : "Показать каталоги поставщиков")
      + "\n" + say;
    btn.setAttribute("aria-expanded", catOpen ? "true" : "false");
    btn.classList.toggle("mat-on", catOpen);
  }

  let catHtml = "";
  function paintCatalog() {
    const box = $m("#matCat");
    if (!box || !CAT) return;
    box.className = "pg-note mat-cat";
    // Та же полоса — не трогаем: перерисовка кнопок мигала бы под мышью.
    const html = `<table class="mat-cats"><tbody>${catRows(CAT)}</tbody></table>`;
    if (html !== catHtml || !box.firstElementChild) {
      catHtml = html;
      box.innerHTML = html;
      wireCatalog(box);
    }
    box.hidden = !catOpen;
    paintCatBtn();
  }

  /* Доступы к ЭТМ (логин и пароль личного кабинета iPRO) задаются на
     сервере переменными ETM_LOGIN и ETM_PASSWORD. В интерфейсе их нет
     намеренно: полоса каталогов — про каталоги, а не про пароли. Если
     портал перестанет пускать, это скажет сама строка каталога при
     обновлении. Проверить связь отдельно можно запросом
     POST /api/integrations/etm/check — он отвечает списком методов. */
  function wireCatalog(box) {
    box.querySelectorAll("[data-cat]").forEach((b) => {
      b.addEventListener("click", async () => {
        const full = b.dataset.cat === "fetch";
        // Выкачать каталог — часы нагрузки на сервер и портал поставщика:
        // случайный щелчок не должен её запускать.
        if (full && !await confirmBox("Обновить каталог «" + b.dataset.name + "»?",
          esc(b.dataset.hint || "Каталог скачается у поставщика заново.")
            + ". Пока идёт обновление, подбор цен по этому каталогу работает"
            + " по прежней выгрузке.", "Обновить")) return;
        try {
          await AUTH.api("POST", "/catalog/refresh", { source: b.dataset.src, fetch: full });
          loadCatalog();
        } catch (e) {
          note("Не вышло: " + e.message, true);
        }
      });
    });
  }

  /* Подтверждение плашкой, а не системным confirm: в нём не видно, что
     именно пропадёт и как это вернуть, а кнопку «ОК» жмут не читая. */
  function confirmBox(title, text, okLabel) {
    // Общее окно платформы (src/ask.js); текст здесь уже размечен.
    // Красным — то, что убирает; «Обновить каталог» — обычной кнопкой.
    return ASK.confirm(text, { title, ok: okLabel, html: true, danger: !/^Обновить/.test(okLabel) });
  }

  /* Новая позиция руками. Окно, а не пустая строка в таблице: полей
     пять, и в строке на шестьсот позиций новую не найти глазами, а пустая
     заведённая строка оставалась бы мусором, если передумали. Цены — сразу
     здесь. Правка заведённой — в её карточке (openCard). */
  function openForm() {
    const box = document.createElement("div");
    box.className = "pf-modal";
    box.innerHTML = `
      <div class="pf-crop cnt-card mat-form" role="dialog"
           aria-label="Новая позиция">
        <h3>Новая позиция</h3>
        <div class="fld"><label for="mf-name">Наименование и характеристика</label>
          <input id="mf-name" autocomplete="off"
                 placeholder="Кабель силовой ВВГнг(А)-LS 3х2,5"></div>
        <div class="cnt-grid">
          <div class="fld"><label for="mf-brand">Тип, марка</label>
            <input id="mf-brand" autocomplete="off"
                   placeholder="ВВГнг(А)-LS 3х2,5"></div>
          <div class="fld"><label for="mf-code">Код, артикул</label>
            <input id="mf-code" autocomplete="off"></div>
          <div class="fld"><label for="mf-maker">Завод</label>
            <input id="mf-maker" autocomplete="off"
                   placeholder="Камкабель"></div>
          <div class="fld"><label for="mf-unit">Единица</label>
            <input id="mf-unit" list="mf-units" autocomplete="off"
                   placeholder="шт., м, кг"></div>
        </div>
        <div class="cnt-group"><h4>Цены за единицу</h4>
          <div class="cnt-grid mat-form-prices">${SRC.map((s) => `
            <div class="fld"><label for="mf-p-${esc(s.id)}">${esc(s.name)}</label>
              <input id="mf-p-${esc(s.id)}" data-src="${esc(s.id)}" inputmode="decimal"
                     autocomplete="off" placeholder="—"></div>`).join("")}
          </div></div>
        <datalist id="mf-units">${UNITS.map((u) => `<option value="${esc(u)}">`).join("")}</datalist>
        <div class="pf-note bad" id="mf-err" hidden></div>
        <div class="pf-modal-foot"><span class="grow"></span>
          <button type="button" class="btn ghost" data-no>Отмена</button>
          <button type="button" class="btn" data-ok>Добавить</button></div>
      </div>`;
    document.body.appendChild(box);
    const $f = (s) => box.querySelector(s);
    const close = () => { document.removeEventListener("keydown", key); box.remove(); };
    const err = (text, focus) => {
      $f("#mf-err").textContent = text;
      $f("#mf-err").hidden = false;
      if (focus) $f(focus).focus();
    };
    const save = async () => {
      $f("#mf-err").hidden = true;
      const val = (s) => $f(s).value.trim();
      const body = { name: val("#mf-name"), brand: val("#mf-brand"), code: val("#mf-code"),
                     maker: val("#mf-maker"), unit: val("#mf-unit") };
      if (!body.name && !body.brand) return err("Впишите наименование или марку", "#mf-name");
      body.prices = {};
      for (const i of box.querySelectorAll("[data-src]")) {
        const p = i.value.replace(/\s/g, "").replace(",", ".");
        if (!p) continue;
        if (!/^\d+(\.\d+)?$/.test(p)) return err(`«${i.value}» — не число`, "#" + i.id);
        body.prices[i.dataset.src] = p;
      }
      const ok = $f("[data-ok]");
      ok.disabled = true;
      try {
        const r = await AUTH.api("POST", "/materials", body);
        close();
        // Новая позиция должна быть видна: снимаем отбор, иначе она могла
        // спрятаться под поиском или фильтром и казалась бы не добавленной.
        search = "";
        FLT = { cols: {}, sort: null };
        saveFlt();
        await load();
        flash(r.id);
        note(`Позиция «${(r && r.name) || body.name || body.brand}» добавлена`);
      } catch (e) {
        ok.disabled = false;
        err(e.message);
      }
    };
    const key = (e) => {
      if (e.key === "Escape") close();
      if (e.key === "Enter" && e.target.matches(".mat-form input")) { e.preventDefault(); save(); }
    };
    document.addEventListener("keydown", key);
    box.addEventListener("click", (e) => { if (e.target === box) close(); });
    $f("[data-no]").addEventListener("click", close);
    $f("[data-ok]").addEventListener("click", save);
    $f("#mf-name").focus();
  }

  /* ── Карточка позиции (30.09.2026) ────────────────────────────────
     Пользователь: «варианты написания работают неудобно и нагромождённо —
     вынести в карточку, чтобы по-простому добавлять вариации, и понять,
     для чего это вообще». Раньше у названия в строке стояли три значка
     (▾ написания, ✎, ⓘ «откуда»), а список написаний раскрывался прямо в
     узкой ячейке и раздувал строку впятеро.

     Для чего написания. Один товар в проекте, у поставщика и в 1С
     называют по-разному, а платформа должна узнавать его под любым
     именем: строку счёта — сразу, в каталоге поставщика искать ими, если
     своими словами не нашла. Копятся они сами. Человеку остаётся
     посмотреть, откуда какое, добавить своё, убрать ошибочное — и самое
     частое на деле: один товар заведён дважды (из 1С и из счёта), и цены
     у него расходятся по двум строкам. Для этого «Возможно, это она же»:
     похожие позиции и поиск по прайсу; «Это она же» — и две строки
     становятся одной (на сервере material_merge).

     Карточка — панель справа поверх таблицы, а не окно: таблица остаётся
     на месте, щелчок по другому названию открывает его карточку, ‹ › и
     стрелки листают отбор по порядку. Живёт внутри раздела: ушли на
     другую вкладку — панель спряталась вместе с ним. */
  const rowById = (id) => ROWS.find((x) => x.id === id) || null;
  const normName = (s) => String(s ?? "").replace(/\s+/g, " ").trim().toLowerCase();
  const otherNames = (r) => {
    const own = normName(r.name);
    return (r.names || []).filter((n) => normName(n.name) !== own);
  };
  const short = (s, n = 70) => {
    const t = String(s || "");
    return t.length > n ? t.slice(0, n - 1).trimEnd() + "…" : t;
  };
  const tipIcon = (t) => (typeof TIPS === "object" ? TIPS.icon(t) : "");

  /* Откуда написание — словами и цветом метки. Колонка поставщика
     приходит своим id («ps-…»): показываем её название, а не id. */
  function nameSrc(source) {
    if (source === "spec") return { tag: "Проект", cls: "spec", tip: "Так позицию назвали в спецификации проекта" };
    if (source === "list") return { tag: "Список 1С", cls: "list", tip: "Так позиция записана в списке материалов из 1С" };
    if (source === "hand") return { tag: "Вписано", cls: "hand", tip: "Вписали вручную" };
    const s = SRC.find((x) => x.id === source);
    if (s && s.group === "catalog") {
      return { tag: s.name, cls: "cat", logo: LOGO[s.id], tip: `Так товар называется в каталоге «${s.name}»` };
    }
    if (s) return { tag: s.name, cls: "sup", tip: `Так строку пишет поставщик «${s.name}» — в счёте или прайс-листе` };
    return { tag: "Другое", cls: "list", tip: "Источник, которого больше нет в прайсе" };
  }
  // Порядок: решённое человеком, проект, 1С, поставщики, каталоги.
  const nameRank = (n) => ({ hand: 0, spec: 1, list: 2 })[n.source]
    ?? ((SRC.find((x) => x.id === n.source) || {}).group === "catalog" ? 4 : 3);

  /* Откуда сама позиция — одной строкой под её сведениями. */
  function originText(r) {
    const by = [r.author, dmyLocal(r.at)].filter(Boolean).join(", ");
    const tail = by ? " · " + by : "";
    if (r.origin === "hand") return "Заведена вручную" + tail;
    if (r.origin === "book") return "Из книги прайса" + tail;
    if (r.origin === "invoice") return "Заведена из счёта поставщика" + tail;
    if (r.origin === "list") {
      const imp = IMPORTS.find((x) => x.id === r.import_id);
      return "Из списка материалов" + (imp ? ` «${imp.filename}»` : "") + tail;
    }
    return (r.docs || []).length ? "Собрана из спецификаций"
      : "Собрана из спецификации, которой больше нет";
  }

  const NAMES_TIP = "Один товар в проекте, у поставщика и в 1С называют по-разному. Платформа узнаёт"
    + " позицию по любому из этих названий: строку счёта — сразу, а в каталоге поставщика ищет ими,"
    + " если своими словами не нашла. Названия копятся сами — из проектов, каталогов, счетов и"
    + " списков 1С. Добавьте своё, если позицию где-то пишут иначе; ошибочное уберите — иначе к"
    + " позиции пристанет чужая цена.";
  const SAME_TIP = "Один товар бывает заведён дважды — из проекта и из 1С, из счёта и из"
    + " прайс-листа, — и цены у него расходятся по двум строкам. «Это она же» соединяет их: названия,"
    + " цены и строки спецификаций переходят в эту позицию, а та уходит из прайса. Её название"
    + " остаётся написанием этой — по нему позицию узнают и дальше.";

  function headHtml(r, edit) {
    const facts = [["Марка", r.brand], ["Код", r.code], ["Завод", r.maker], ["Ед.", r.unit]];
    return `<section class="pc-head">
        <h3 class="pc-name">${esc(r.name) || '<i class="dim">без названия</i>'}</h3>
        <dl class="pc-facts">${facts.map(([k, v]) => `<div${v ? ` title="${esc(v)}"` : ""}><dt>${k}</dt><dd${
          v ? "" : ' class="no"'}>${esc(v) || "—"}</dd></div>`).join("")}</dl>
        <div class="pc-foot">
          <span class="pc-origin">${esc(originText(r))}</span>
          ${edit ? `<button type="button" class="lnk pc-edit" data-pc-edit>${ICO.edit}Изменить</button>` : ""}
        </div>
      </section>`;
  }

  function formHtml(r) {
    const f = (k, label, v, more) => `<label class="fld"><span>${label}</span><input id="pc-f-${k}"
      value="${esc(v)}" autocomplete="off"${more || ""}></label>`;
    return `<section class="pc-head pc-form">
        <label class="fld"><span>Наименование и характеристика</span><textarea id="pc-f-name"
          rows="3">${esc(r.name)}</textarea></label>
        <div class="pc-grid">${f("brand", "Тип, марка", r.brand)}${f("code", "Код, артикул", r.code)}${
          f("maker", "Завод", r.maker)}${f("unit", "Единица", r.unit, ' list="pc-units"')}</div>
        <datalist id="pc-units">${UNITS.map((u) => `<option value="${esc(u)}">`).join("")}</datalist>
        <div class="pc-msg bad" data-pc-err hidden></div>
        <div class="pc-acts"><span class="grow"></span>
          <button type="button" class="btn-ghost sm" data-pc-cancel>Отмена</button>
          <button type="button" class="btn-brand sm" data-pc-save>Сохранить</button></div>
      </section>`;
  }

  function namesHtml(r, edit) {
    const list = otherNames(r).map((n, i) => [n, i])
      .sort((a, b) => nameRank(a[0]) - nameRank(b[0]) || a[1] - b[1]).map((x) => x[0]);
    const msg = CARD.msg;
    return `<section class="pc-sec">
        <div class="pc-sh"><b>Как ещё называют</b>${tipIcon(NAMES_TIP)}${list.length
          ? `<span class="pc-n">${list.length}</span>` : ""}</div>
        ${list.length ? `<ul class="pc-names">${list.map((n) => {
          const s = nameSrc(n.source);
          return `<li data-nid="${esc(n.id)}">
            <span class="pc-tag ${s.cls}" title="${esc(s.tip)}">${s.logo
              ? `<i style="background:${s.logo.color}"></i>` : ""}${esc(s.tag)}</span>
            <span class="pc-nt">${esc(n.name)}</span>
            ${edit ? `<span class="pc-na">
              <button type="button" class="pc-ib sm" data-pc-main title="Сделать основным названием"
                aria-label="Сделать основным названием">${ICO.main}</button>
              <button type="button" class="pc-ib sm warn" data-pc-del title="Убрать это название"
                aria-label="Убрать это название">${ICO.x}</button></span>` : ""}
          </li>`;
        }).join("")}</ul>` : `<p class="pc-empty">Других названий пока нет</p>`}
        ${edit ? `<form class="pc-add">
          <input data-pc-name placeholder="Добавить название" aria-label="Ещё одно название позиции"
            autocomplete="off" maxlength="400">
          <button type="submit" class="btn-ghost sm">Добавить</button></form>` : ""}
        ${msg ? `<div class="pc-msg${msg.kind ? " " + msg.kind : ""}">${msg.html}</div>` : ""}
      </section>`;
  }

  /* Кандидаты «это она же»: набрано в поиске — найденное в прайсе,
     иначе похожие с сервера (null — ещё ищутся). Позиция, на которую
     указали сами («так называется другая позиция»), — первой. */
  function candRows(r) {
    const q = CARD.q.trim();
    if (q.length >= 2) return findRows(q, r.id);
    if (CARD.sim === null) return null;
    const ids = (CARD.pin ? [CARD.pin] : []).concat(CARD.sim.filter((id) => id !== CARD.pin));
    return ids.map(rowById).filter(Boolean);
  }
  function findRows(q, skip) {
    const words = q.toLowerCase().split(/\s+/).filter(Boolean);
    const out = [];
    for (const x of ROWS) {
      if (x.id === skip) continue;
      const hay = x._hay || (x._hay = hayOf(x));
      if (words.every((w) => hay.includes(w))) {
        out.push(x);
        if (out.length >= 6) break;
      }
    }
    return out;
  }

  function candHtml(x) {
    const b = x.best;
    const sub = [x.brand, x.code, x.unit].filter(Boolean).join(" · ");
    const facts = [b ? `${money(b.price)} ₽ у «${b.who}»` : "без цен", x.positions
      ? `${x.positions} ${plural(x.positions, "строка", "строки", "строк")} в спецификациях` : ""]
      .filter(Boolean).join(" · ");
    const ask = CARD.ask === x.id;
    return `<li class="pc-cand${ask ? " ask" : ""}" data-cid="${esc(x.id)}">
        <div class="pc-ct"><b>${esc(x.name) || "без названия"}</b>${sub ? `<i>${esc(sub)}</i>` : ""}<i>${
          esc(facts)}</i></div>
        ${ask ? `<div class="pc-ask">
          <p>«${esc(short(x.name))}» станет одним из названий этой позиции. Её цены${x.positions
            ? ", строки спецификаций" : ""} и названия перейдут сюда, а сама она уйдёт из прайса.</p>
          <div class="pc-acts"><span class="grow"></span>
            <button type="button" class="btn-ghost sm" data-pc-no>Отмена</button>
            <button type="button" class="btn-brand sm" data-pc-yes>Объединить</button></div></div>`
          : `<button type="button" class="btn-ghost sm pc-same" data-pc-same>Это она же</button>`}
      </li>`;
  }

  function listHtml(r) {
    const rows = candRows(r);
    if (rows === null) return `<p class="pc-empty">Ищу похожие…</p>`;
    if (!rows.length) {
      return `<p class="pc-empty">${CARD.q.trim().length >= 2 ? "В прайсе такой нет"
        : "Похожих не нашлось. Знаете, какая, — найдите её в прайсе"}</p>`;
    }
    return `<ul class="pc-cands">${rows.map(candHtml).join("")}</ul>`;
  }

  function sameHtml(r) {
    return `<section class="pc-sec">
        <div class="pc-sh"><b>Возможно, это она же</b>${tipIcon(SAME_TIP)}</div>
        <div data-pc-list>${listHtml(r)}</div>
        <label class="pc-find">${ICO.find}<input data-pc-q value="${esc(CARD.q)}" autocomplete="off"
          placeholder="Найти другую позицию в прайсе" aria-label="Найти позицию в прайсе"></label>
      </section>`;
  }

  function whereHtml(r) {
    const docs = r.docs || [];
    if (!r.positions && !docs.length) return "";
    return `<section class="pc-sec">
        <div class="pc-sh"><b>Где встречается</b><span class="pc-n">${r.positions} ${plural(r.positions,
          "строка", "строки", "строк")} · ${r.sites} ${plural(r.sites, "объект", "объекта",
          "объектов")}</span></div>
        <ul class="pc-where">${docs.slice(0, 4).map((x) => `<li>
          <b>${esc(x.site || "Объект не указан")}</b>
          <span>${esc(x.file)}${x.sheet ? " · " + esc(x.sheet) : ""}</span>
          <i>${x.rows.length + x.more > 1 ? "строки" : "строка"} ${esc(x.rows.join(", "))}${
            x.more ? " и ещё " + x.more : ""}</i></li>`).join("")}</ul>
        <button type="button" class="lnk pc-more" data-pc-usage>Все строки${docs.length > 4
          ? ` — ещё ${docs.length - 4} ${plural(docs.length - 4, "документ", "документа", "документов")}`
          : ""}</button>
      </section>`;
  }

  function cardHtml(r) {
    const i = VIS.findIndex((x) => x.id === r.id);
    const edit = can();
    return `
      <div class="pc-top">
        <span class="pc-over">Позиция прайса${i >= 0 ? `<i>${i + 1} из ${VIS.length}</i>` : ""}</span>
        <span class="grow"></span>
        <button type="button" class="pc-ib" data-pc-nav="-1" title="Предыдущая позиция (↑)"
          aria-label="Предыдущая позиция"${i > 0 ? "" : " disabled"}>${ICO.prev}</button>
        <button type="button" class="pc-ib" data-pc-nav="1" title="Следующая позиция (↓)"
          aria-label="Следующая позиция"${i >= 0 && i < VIS.length - 1 ? "" : " disabled"}>${ICO.next}</button>
        <button type="button" class="pc-ib" data-pc-close title="Закрыть (Esc)"
          aria-label="Закрыть">${ICO.x}</button>
      </div>
      <div class="pc-body">
        ${CARD.edit && edit ? formHtml(r) : headHtml(r, edit)}
        ${namesHtml(r, edit)}
        ${edit ? sameHtml(r) : ""}
        ${whereHtml(r)}
      </div>`;
  }

  /* Нарисовать открытую карточку заново — после правки, загрузки прайса,
     перелистывания. Набранное в поле названия, фокус и место прокрутки
     той же позиции не теряются. */
  function paintCard() {
    if (!CARD) return;
    const host = $m("#sec-mat");
    const r = rowById(CARD.id);
    if (!r || !host) return closeCard();
    let box = $m("#matCard");
    if (!box) {
      box = document.createElement("aside");
      box.id = "matCard";
      box.className = "pc";
      box.setAttribute("aria-label", "Позиция прайса");
      host.appendChild(box);
      wireCard(box);
    }
    const same = box.dataset.id === r.id;
    const body = box.querySelector(".pc-body");
    const top = same && body ? body.scrollTop : 0;
    const typed = same ? (box.querySelector("[data-pc-name]") || {}).value || "" : "";
    const act = document.activeElement;
    const focus = act && box.contains(act) && act.matches("[data-pc-name], [data-pc-q]")
      ? (act.matches("[data-pc-name]") ? "[data-pc-name]" : "[data-pc-q]") : "";
    box.dataset.id = r.id;
    box.innerHTML = cardHtml(r);
    const nb = box.querySelector(".pc-body");
    if (nb) nb.scrollTop = top;
    const add = box.querySelector("[data-pc-name]");
    if (add && typed) add.value = typed;
    if (focus) {
      const f = box.querySelector(focus);
      if (f) {
        f.focus({ preventScroll: true });
        f.setSelectionRange(f.value.length, f.value.length);
      }
    }
    markRow();
  }

  function paintList() {
    const box = $m("#matCard [data-pc-list]");
    const r = CARD && rowById(CARD.id);
    if (box && r) box.innerHTML = listHtml(r);
  }

  // Строка открытой карточки подсвечена: видно, о какой строке панель.
  function markRow() {
    const body = $m("#matBody");
    if (!body) return;
    body.querySelectorAll("tr.pc-cur").forEach((tr) => tr.classList.remove("pc-cur"));
    const tr = CARD && body.querySelector(`tr[data-id="${CSS.escape(CARD.id)}"]`);
    if (tr) tr.classList.add("pc-cur");
  }

  // Строку таблицы — заново по данным позиции: число названий у ярлыка.
  function refreshRow(r) {
    const tr = $m(`#matBody tr[data-id="${CSS.escape(r.id)}"]`);
    const i = VIS.indexOf(r);
    if (tr && i >= 0) tr.outerHTML = matRow(r, i);
  }

  function openCard(id) {
    if (CARD && CARD.id === id) return;
    CARD = { id, edit: false, q: "", ask: "", pin: "", sim: null, msg: null, undo: null, pending: "" };
    paintCard();
    loadSimilar(id);
  }

  function closeCard() {
    const id = CARD && CARD.id;
    CARD = null;
    const box = $m("#matCard");
    const had = box && box.contains(document.activeElement);
    if (box) box.remove();
    markRow();
    if (typeof TIPS === "object") TIPS.hide();
    // Фокус — обратно на название строки, с которой открывали.
    const btn = had && id && $m(`#matBody tr[data-id="${CSS.escape(id)}"] [data-card]`);
    if (btn) btn.focus({ preventScroll: true });
  }

  /* ‹ › и стрелки — соседняя позиция отбора; таблица доводит её строку
     до глаз, если та ушла за край. */
  function cardNav(d) {
    const i = CARD ? VIS.findIndex((x) => x.id === CARD.id) : -1;
    const n = i >= 0 ? VIS[i + d] : null;
    if (!n) return;
    openCard(n.id);
    reveal(n.id);
  }

  function reveal(id) {
    const body = $m("#matBody");
    const i = VIS.findIndex((r) => r.id === id);
    if (!body || i < 0) return;
    if (i < WIN[0] || i >= WIN[1]) {
      const tbody = body.querySelector("table.mat-tbl tbody");
      const start = tbody ? body.scrollTop + tbody.getBoundingClientRect().top
        - body.getBoundingClientRect().top : 0;
      body.scrollTop = start + heightOf(0, i) - body.clientHeight / 2;
      drawWindow(body, true);
    }
    const tr = body.querySelector(`tr[data-id="${CSS.escape(id)}"]`);
    if (!tr) return;
    const b = body.getBoundingClientRect(), t = tr.getBoundingClientRect();
    const head = body.querySelector("thead");
    const top = b.top + (head ? head.getBoundingClientRect().height : 0);
    if (t.top < top) body.scrollTop -= top - t.top + 8;
    else if (t.bottom > b.bottom) body.scrollTop += t.bottom - b.bottom + 8;
  }

  async function loadSimilar(id) {
    let ids = [];
    try {
      ids = ((await AUTH.api("GET", "/materials/" + id + "/similar")).rows || []).map((x) => x.id);
    } catch (e) { /* без подсказок — поиск по прайсу остаётся */ }
    if (!CARD || CARD.id !== id) return;
    CARD.sim = ids;
    paintList();
  }

  function say(html, kind) {
    if (!CARD) return;
    const msg = CARD.msg = { html, kind: kind || "" };
    paintCard();
    // «Готово» гаснет само; ошибка и вопрос остаются, пока не ответили.
    // Гасим одну плашку, а не всю карточку: в ней может идти правка.
    if (kind === "ok") {
      setTimeout(() => {
        if (!CARD || CARD.msg !== msg) return;
        CARD.msg = null;
        const el = $m("#matCard .pc-sec .pc-msg");
        if (el) el.remove();
      }, 6000);
    }
  }

  /* Ещё одно название. Совпало с чужим — скорее всего, это та же
     позиция двумя строками: предлагаем объединить, но не запрещаем. */
  async function addName(force) {
    const r = CARD && rowById(CARD.id);
    const inp = $m("#matCard [data-pc-name]");
    const name = force ? CARD.pending : String(inp ? inp.value : "").replace(/\s+/g, " ").trim();
    if (!r || !name) return;
    const k = normName(name);
    if (k === normName(r.name) || (r.names || []).some((n) => normName(n.name) === k)) {
      return say("Такое название у позиции уже есть", "bad");
    }
    const twin = !force && ROWS.find((x) => x.id !== r.id && (normName(x.name) === k
      || (x.names || []).some((n) => normName(n.name) === k)));
    if (twin) {
      CARD.pending = name;
      return say(`Так называется другая позиция — «${esc(short(twin.name))}». Если это один товар,
        лучше объединить их: цены сойдутся в одну строку.<span class="pc-msg-acts">
        <button type="button" class="btn-brand sm" data-pc-twin="${esc(twin.id)}">Объединить с ней</button>
        <button type="button" class="lnk" data-pc-force>Всё равно добавить</button></span>`, "warn");
    }
    try {
      const n = await AUTH.api("POST", "/materials/" + r.id + "/names", { name });
      r.names = (r.names || []).concat([n]);
      r._hay = hayOf(r);
      CARD.pending = "";
      CARD.msg = null;
      if (inp) inp.value = "";
      paintCard();
      refreshRow(r);
      const again = $m("#matCard [data-pc-name]");
      if (again) again.focus({ preventScroll: true });
    } catch (e) {
      say("Не добавилось: " + esc(e.message), "bad");
    }
  }

  async function delName(nid) {
    const r = CARD && rowById(CARD.id);
    const n = r && (r.names || []).find((x) => x.id === nid);
    if (!n) return;
    try {
      await AUTH.api("DELETE", "/material-names/" + nid);
      r.names = r.names.filter((x) => x.id !== nid);
      r._hay = hayOf(r);
      CARD.undo = { name: n.name, source: n.source };
      say(`Название «${esc(short(n.name, 60))}» убрано.
        <button type="button" class="lnk" data-pc-undo>Вернуть</button>`, "");
      refreshRow(r);
    } catch (e) {
      say("Не убралось: " + esc(e.message), "bad");
    }
  }

  async function undoDel() {
    const r = CARD && rowById(CARD.id);
    const u = CARD && CARD.undo;
    if (!r || !u) return;
    try {
      const n = await AUTH.api("POST", "/materials/" + r.id + "/names", u);
      r.names = (r.names || []).concat([n]);
      r._hay = hayOf(r);
      CARD.undo = null;
      CARD.msg = null;
      paintCard();
      refreshRow(r);
    } catch (e) {
      say("Не вернулось: " + esc(e.message), "bad");
    }
  }

  /* Другое написание — основным названием. keep_key: прежнее название не
     ошибка, а то же самое другими словами — строки, написанные по-старому,
     узнают позицию и дальше, а само оно остаётся среди написаний. */
  async function makeMain(nid, btn) {
    const r = CARD && rowById(CARD.id);
    const n = r && (r.names || []).find((x) => x.id === nid);
    if (!n) return;
    btn.disabled = true;
    try {
      await AUTH.api("PATCH", "/materials/" + r.id, { name: n.name, keep_key: true });
      await load();
      say("Теперь это основное название, прежнее осталось среди написаний", "ok");
    } catch (e) {
      btn.disabled = false;
      say("Не вышло: " + esc(e.message), "bad");
    }
  }

  async function saveCard() {
    const r = CARD && rowById(CARD.id);
    const box = $m("#matCard");
    if (!r || !box) return;
    const v = (k) => String(($m("#pc-f-" + k, box) || {}).value || "").replace(/\s+/g, " ").trim();
    const body = { name: v("name"), brand: v("brand"), code: v("code"), maker: v("maker"), unit: v("unit") };
    const err = $m("[data-pc-err]", box);
    const fail = (t) => { err.textContent = t; err.hidden = false; };
    if (!body.name && !body.brand) return fail("Впишите наименование или марку");
    const ok = $m("[data-pc-save]", box);
    ok.disabled = true;
    try {
      await AUTH.api("PATCH", "/materials/" + r.id, body);
      CARD.edit = false;
      await load();
      say("Позиция сохранена", "ok");
    } catch (e) {
      ok.disabled = false;
      fail(e.message);
    }
  }

  async function merge(other, btn) {
    const r = CARD && rowById(CARD.id);
    const x = rowById(other);
    if (!r || !x) return;
    btn.disabled = true;
    try {
      const res = await AUTH.api("POST", "/materials/" + r.id + "/merge", { from: other });
      Object.assign(CARD, { ask: "", pin: "", q: "", sim: null, pending: "" });
      const inp = $m("#matCard [data-pc-name]");
      if (inp) inp.value = "";
      await load();
      say(`Объединено: «${esc(short(x.name))}» — теперь одно из названий этой позиции${
        res.prices ? ", её цены — здесь" : ""}.`, "ok");
      loadSimilar(r.id);
    } catch (e) {
      btn.disabled = false;
      say("Не объединилось: " + esc(e.message), "bad");
    }
  }

  function wireCard(box) {
    box.addEventListener("click", (e) => {
      const t = e.target;
      let b;
      if (t.closest("[data-pc-close]")) return closeCard();
      if ((b = t.closest("[data-pc-nav]"))) return cardNav(Number(b.dataset.pcNav));
      if (t.closest("[data-pc-edit]")) {
        CARD.edit = true;
        CARD.msg = null;
        paintCard();
        const f = $m("#pc-f-name", box);
        if (f) f.focus();
        return;
      }
      if (t.closest("[data-pc-cancel]")) {
        CARD.edit = false;
        return paintCard();
      }
      if (t.closest("[data-pc-save]")) return saveCard();
      if ((b = t.closest("[data-pc-del]"))) return delName(b.closest("[data-nid]").dataset.nid);
      if ((b = t.closest("[data-pc-main]"))) return makeMain(b.closest("[data-nid]").dataset.nid, b);
      if (t.closest("[data-pc-undo]")) return undoDel();
      if (t.closest("[data-pc-force]")) return addName(true);
      if ((b = t.closest("[data-pc-twin]"))) {
        Object.assign(CARD, { pin: b.dataset.pcTwin, ask: b.dataset.pcTwin, q: "", msg: null });
        paintCard();
        const c = $m(`[data-cid="${CSS.escape(CARD.pin)}"]`, box);
        if (c) c.scrollIntoView({ block: "nearest" });
        return;
      }
      if ((b = t.closest("[data-pc-same]"))) {
        CARD.ask = b.closest("[data-cid]").dataset.cid;
        return paintList();
      }
      if (t.closest("[data-pc-no]")) {
        CARD.ask = "";
        return paintList();
      }
      if ((b = t.closest("[data-pc-yes]"))) return merge(b.closest("[data-cid]").dataset.cid, b);
      if (t.closest("[data-pc-usage]")) {
        const r = rowById(CARD.id);
        if (r) openUsage(r);
      }
    });
    box.addEventListener("submit", (e) => {
      e.preventDefault();
      addName(false);
    });
    box.addEventListener("input", (e) => {
      if (!e.target.matches("[data-pc-q]")) return;
      CARD.q = e.target.value;
      CARD.ask = "";
      paintList();
    });
    box.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && e.target.matches(".pc-form input")) {
        e.preventDefault();
        saveCard();
      }
    });
  }

  /* Клавиши карточки: Esc — снять подтверждение, выйти из правки или
     закрыть; ↑ ↓ — соседняя позиция, когда курсор не в поле. Не мешаем
     окнам поверх (они ловят свои клавиши сами), фильтру колонки и
     подсказке ⓘ. */
  document.addEventListener("keydown", (e) => {
    const box = $m("#matCard");
    if (!CARD || !box || !box.getClientRects().length || e.defaultPrevented) return;
    if (document.querySelector(".pf-modal") || POP || document.getElementById("g-tip")) return;
    if (e.key === "Escape") {
      e.preventDefault();
      if (CARD.ask) {
        CARD.ask = "";
        paintList();
      } else if (CARD.edit) {
        CARD.edit = false;
        paintCard();
      } else {
        closeCard();
      }
      return;
    }
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    if (e.target.closest && e.target.closest("input, textarea, select, [contenteditable='true']")) return;
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      cardNav(e.key === "ArrowDown" ? 1 : -1);
    }
  });

  /* Где позиция встречается: объект, документ, строка и как её написали
     в спецификации. Прайс собирается из спецификаций объектов, и лишняя
     строка в нём — это всегда какой-то документ; здесь видно какой. */
  async function openUsage(r) {
    let data;
    try {
      data = await AUTH.api("GET", "/materials/" + r.id + "/usage");
    } catch (e) {
      return note("Не вышло: " + e.message, true);
    }
    const rows = data.rows || [];
    const box = document.createElement("div");
    box.className = "pf-modal";
    box.innerHTML = `
      <div class="pf-crop cnt-card mat-usage-card" role="dialog" aria-label="Где встречается">
        <h3>Где встречается</h3>
        <p class="mat-usage-sub">${esc(r.name)}${r.brand ? " · " + esc(r.brand) : ""}</p>
        ${rows.length ? `<div class="mat-usage-scroll"><table class="mat-usage-tbl">
          <thead><tr><th>Объект</th><th>Документ</th><th>Строка</th>
            <th>Как написано в спецификации</th><th class="num">Кол-во</th></tr></thead>
          <tbody>${rows.map((x) => `<tr>
            <td>${esc(x.site || "—")}</td>
            <td class="dim" title="${esc(x.filename)}">${esc(x.filename)}${
              x.sheet ? `<i> · ${esc(x.sheet)}</i>` : ""}</td>
            <td class="dim">${esc(x.pos_no || x.row_no)}</td>
            <td>${esc([x.name, x.brand, x.code].filter(Boolean).join(" · "))}</td>
            <td class="num">${x.qty === "" || x.qty === null ? "" : esc(x.qty)} ${
              esc(x.unit || "")}</td></tr>`).join("")}</tbody>
        </table></div>` : `<p class="mat-form-hint">В спецификациях эта позиция не
          встречается: её завели вручную или книгой прайса.</p>`}
        <p class="mat-form-hint">Прайс собирается из спецификаций объектов. Если позиция
          пришла из не того документа — уберите документ в объекте, затем «Очистить» и
          «Из спек».</p>
        <div class="pf-modal-foot"><span class="grow"></span>
          <button type="button" class="btn ghost" data-no>Закрыть</button></div>
      </div>`;
    document.body.appendChild(box);
    const close = () => { document.removeEventListener("keydown", key); box.remove(); };
    const key = (e) => { if (e.key === "Escape") close(); };
    document.addEventListener("keydown", key);
    box.addEventListener("click", (e) => { if (e.target === box) close(); });
    box.querySelector("[data-no]").addEventListener("click", close);
  }

  /* Показать строку: прокрутить к ней и коротко подсветить. */
  function flash(id) {
    const body = $m("#matBody");
    const i = VIS.findIndex((r) => r.id === id);
    if (body && i >= 0 && (i < WIN[0] || i >= WIN[1])) {
      const tbody = body.querySelector("table.mat-tbl tbody");
      const start = tbody ? body.scrollTop + tbody.getBoundingClientRect().top
        - body.getBoundingClientRect().top : 0;
      body.scrollTop = start + heightOf(0, i) - body.clientHeight / 2;
      drawWindow(body, true);
    }
    const tr = $m(`#matBody tr[data-id="${id}"]`);
    if (!tr) return;
    tr.scrollIntoView({ block: "center" });
    tr.classList.add("mat-flash");
    setTimeout(() => tr.classList.remove("mat-flash"), 2400);
  }

  /* Очистить весь прайс. Позиции прайса собираются из спецификаций, и
     неудачную сборку проще снять разом и собрать заново, чем убирать по
     крестику сотни строк. */
  async function clearAll() {
    const n = ROWS.length;
    if (!n) return note("Прайс и так пуст");
    const ok = await confirmBox("Очистить прайс материалов?",
      `Уберутся все ${n} ${plural(n, "позиция", "позиции", "позиций")} вместе с ценами`
      + " и написаниями. Собрать заново можно кнопкой «Из спек» — она возьмёт позиции"
      + " из разобранных спецификаций. Цены поставщиков вернутся при «Подтянуть материалы»"
      + " в расчётах, а вписанные вручную пропадут.",
      `Очистить ${n} ${plural(n, "позицию", "позиции", "позиций")}`);
    if (!ok) return;
    try {
      const r = await AUTH.api("POST", "/materials/clear", {});
      await load();
      const k = Number(r && r.removed) || n;
      note(`Прайс очищен: убрано ${k} ${plural(k, "позиция", "позиции",
        "позиций")}. Собрать заново — кнопка «Из спек».`);
    } catch (e) {
      note("Не вышло: " + e.message, true);
    }
  }

  /* Отбор на месте: позиций сотни, а не тысячи. Ищем и по вариациям
     названий тоже — ради них они и заведены: человек помнит позицию так,
     как её называет его поставщик. */
  const hayOf = (r) => [r.name, r.brand, r.code, r.maker]
    .concat((r.names || []).map((n) => n.name)).join(" ").toLowerCase();
  function visible() {
    const q = search.trim().toLowerCase();
    const on = Object.keys(FLT.cols).filter(fltOn);
    return sortRows(ROWS.filter((r) => {
      for (const k of on) if (!pass(r, k, FLT.cols[k])) return false;
      if (!q) return true;
      return (r._hay || (r._hay = hayOf(r))).includes(q);
    }));
  }

  /* ── фильтры по колонкам ───────────────────────────────────
     Колонки спецификации: текст ищется «содержит», завод и единица —
     галочками по значениям, как в Excel. Колонки цен: есть цена или
     нет, возраст, диапазон, у поставщиков ещё — из счёта или руками. */
  const COLS = [["name", "Наименование", "text"], ["brand", "Марка", "text"],
                ["code", "Код", "text"], ["maker", "Завод", "list"],
                ["unit", "Ед.", "list"], ["meet", "Встреч.", "meet"]];
  const srcOf = (k) => SRC.find((s) => "p:" + s.id === k) || null;
  const colLabel = (k) => k.startsWith("p:") ? (srcOf(k) || {}).name || "Цена"
    : (COLS.find((c) => c[0] === k) || [])[1] || k;
  const colType = (k) => k.startsWith("p:") ? "price" : (COLS.find((c) => c[0] === k) || [])[2];
  const priceOf = (r, sid) => {
    const p = r.prices[sid];
    return p && p.price !== null && p.price !== undefined && p.price !== "" ? p : null;
  };
  const numOf = (s) => {
    const v = parseFloat(String(s ?? "").replace(/\s/g, "").replace(",", "."));
    return isNaN(v) ? null : v;
  };

  function fltOn(k) {
    const f = FLT.cols[k];
    return !!f && !!(String(f.q || "").trim() || Array.isArray(f.vals) || f.has
      || (Array.isArray(f.ages) && f.ages.length) || numOf(f.from) !== null
      || numOf(f.to) !== null || f.inv);
  }

  function pass(r, k, f) {
    const t = colType(k);
    if (t === "text") {
      const q = String(f.q || "").trim().toLowerCase();
      if (!q) return true;
      // Название ищется и по другим написаниям: позицию помнят так, как
      // её называет свой поставщик.
      const где = k === "name" ? [r.name].concat((r.names || []).map((n) => n.name)).join(" ")
        : String(r[k] || "");
      return где.toLowerCase().includes(q);
    }
    if (t === "list") return !Array.isArray(f.vals) || f.vals.includes(String(r[k] || "").trim());
    if (t === "meet") return !f.has || (f.has === "yes" ? r.positions > 0 : !r.positions);
    const p = priceOf(r, k.slice(2));
    if (f.has === "yes" && !p) return false;
    if (f.has === "no" && p) return false;
    if (Array.isArray(f.ages) && f.ages.length && !(p && f.ages.includes(ageOf(p.date || p.at)))) return false;
    const lo = numOf(f.from), hi = numOf(f.to);
    if ((lo !== null || hi !== null) && !p) return false;
    if (lo !== null && Number(p.price) < lo) return false;
    if (hi !== null && Number(p.price) > hi) return false;
    if (f.inv === "inv" && !(p && INV[p.invoice_id])) return false;
    if (f.inv === "hand" && !(p && !INV[p.invoice_id])) return false;
    return true;
  }

  /* Сортировка одна: по щелчку в фильтре колонки. Пустые — в конце при
     любом направлении: строка без цены не «самая дешёвая». */
  function sortRows(rows) {
    const s = FLT.sort;
    if (!s || !s.key || !colType(s.key)) return rows;
    const dir = s.dir === -1 ? -1 : 1;
    const t = colType(s.key);
    const val = (r) => t === "meet" ? (r.positions || 0)
      : t === "price" ? (priceOf(r, s.key.slice(2)) ? Number(r.prices[s.key.slice(2)].price) : null)
      : String(r[s.key] || "").trim();
    return rows.map((r, i) => [r, val(r), i]).sort((a, b) => {
      const empty = (v) => v === null || v === "";
      if (empty(a[1]) || empty(b[1])) {
        return empty(a[1]) && empty(b[1]) ? a[2] - b[2] : empty(a[1]) ? 1 : -1;
      }
      const c = typeof a[1] === "string"
        ? a[1].localeCompare(b[1], "ru", { numeric: true }) : a[1] - b[1];
      return c * dir || a[2] - b[2];
    }).map((x) => x[0]);
  }

  function chipText(k) {
    const f = FLT.cols[k], name = colLabel(k), t = colType(k);
    if (t === "text") return `${name}: «${String(f.q).trim()}»`;
    if (t === "list") {
      const v = f.vals.map((x) => x || "(пусто)");
      return `${name}: ${!v.length ? "ничего" : v.length <= 3 ? v.join(", ")
        : v.length + " " + plural(v.length, "значение", "значения", "значений")}`;
    }
    if (t === "meet") return `${name}: ${f.has === "yes" ? "встречаются" : "не встречаются"}`;
    const parts = [];
    if (f.has) parts.push(f.has === "yes" ? "есть цена" : "нет цены");
    if (Array.isArray(f.ages) && f.ages.length) parts.push(f.ages.map((a) => AGE_NAME[a]).join(", "));
    const lo = numOf(f.from), hi = numOf(f.to);
    if (lo !== null || hi !== null) {
      parts.push([lo !== null ? "от " + money(lo) : "", hi !== null ? "до " + money(hi) : ""]
        .filter(Boolean).join(" "));
    }
    if (f.inv) parts.push(f.inv === "inv" ? "из счёта" : "вписана руками");
    return `${name}: ${parts.join(" · ")}`;
  }

  // Значения колонки со счётчиками — для галочек. Пустое — в конце.
  function listVals(k) {
    const n = new Map();
    for (const r of ROWS) {
      const v = String(r[k] || "").trim();
      n.set(v, (n.get(v) || 0) + 1);
    }
    return [...n.entries()].sort((a, b) => (a[0] === "") - (b[0] === "")
      || a[0].localeCompare(b[0], "ru", { numeric: true }));
  }

  /* Всплывающее окно у заголовка — одно на страницу: фильтр, счета или
     меню колонки. Живёт в body и ставится по координатам кнопки: внутри
     таблицы его резал бы край прокрутки. */
  let POP = null;
  function closePop() {
    if (POP) POP.box.remove();
    POP = null;
    document.removeEventListener("mousedown", popOut, true);
    document.removeEventListener("keydown", popKey);
  }
  function popOut(e) {
    if (!POP || POP.box.contains(e.target)) return;
    // Щелчок по кнопке заголовка откроет своё окно сам.
    if (e.target.closest("[data-flt], [data-invs], [data-colmenu], [data-lists]")) return;
    closePop();
  }
  function popKey(e) { if (e.key === "Escape") closePop(); }
  function openPop(anchor, key, cls, html) {
    closePop();
    const box = document.createElement("div");
    box.className = "mat-pop mat-hpop " + cls;
    box.innerHTML = html;
    document.body.appendChild(box);
    POP = { box, key };
    const r = anchor.getBoundingClientRect();
    const w = box.offsetWidth, h = box.offsetHeight;
    box.style.left = Math.max(8, Math.min(r.right - w, window.innerWidth - w - 8)) + "px";
    box.style.top = Math.max(8, Math.min(r.bottom + 6, window.innerHeight - h - 8)) + "px";
    setTimeout(() => {
      document.addEventListener("mousedown", popOut, true);
      document.addEventListener("keydown", popKey);
    }, 0);
    return box;
  }

  function fltBtn(k, label) {
    const on = fltOn(k) || (FLT.sort && FLT.sort.key === k);
    return `<button type="button" class="mat-hbtn mat-flt-btn${on ? " mat-on" : ""}" data-flt="${
      esc(k)}" title="Фильтр и сортировка: ${esc(label)}" aria-label="Фильтр: ${esc(label)}">${
      ICO.funnel}</button>`;
  }

  function openFilter(btn, key) {
    if (POP && POP.key === "f:" + key) return closePop();
    const t = colType(key);
    const f = FLT.cols[key] || {};
    const radios = (name, opts, cur) => opts.map(([v, n]) => `<label class="mat-flt-opt">
      <input type="radio" name="mflt-${name}" data-${name}="${v}"${(cur || "") === v
        ? " checked" : ""}> ${n}</label>`).join("");
    const sorts = (a, b) => `<div class="mat-flt-sub">Сортировка</div><div class="mat-flt-sort">
      <button type="button" data-sort="1">${a}</button>
      <button type="button" data-sort="-1">${b}</button></div>`;
    let body;
    if (t === "text") {
      body = `<input class="pos-in mat-flt-q" data-q placeholder="Содержит…" value="${
        esc(f.q || "")}" autocomplete="off">${sorts("А → Я", "Я → А")}`;
    } else if (t === "list") {
      body = `${listVals(key).length > 8 ? `<input class="pos-in mat-flt-q" data-find
          placeholder="Найти в списке" autocomplete="off">` : ""}
        <div class="mat-flt-links"><button type="button" class="lnk" data-all>Выбрать все</button>
          <button type="button" class="lnk" data-none>Снять все</button></div>
        <div class="mat-flt-list" data-list></div>${sorts("А → Я", "Я → А")}`;
    } else if (t === "meet") {
      body = radios("has", [["", "Все"], ["yes", "Встречаются в спецификациях"],
        ["no", "Не встречаются"]], f.has) + sorts("↑ Реже", "↓ Чаще");
    } else {
      const src = srcOf(key) || {};
      body = radios("has", [["", "Все"], ["yes", "Есть цена"], ["no", "Нет цены"]], f.has)
        + `<div class="mat-flt-sub">Возраст цены</div>${Object.entries(AGE_NAME).map(([a, n]) => `
          <label class="mat-flt-opt"><input type="checkbox" data-age="${a}"${
            (f.ages || []).includes(a) ? " checked" : ""}> ${n}</label>`).join("")}
        <div class="mat-flt-sub">Цена за единицу</div>
        <div class="mat-flt-range"><input class="pos-in num" data-from inputmode="decimal"
            placeholder="от" value="${esc(f.from || "")}" autocomplete="off"><span>—</span>
          <input class="pos-in num" data-to inputmode="decimal" placeholder="до"
            value="${esc(f.to || "")}" autocomplete="off"></div>`
        + (src.kind === "supplier" ? `<div class="mat-flt-sub">Откуда цена</div>`
          + radios("inv", [["", "Все"], ["inv", "Из счёта"], ["hand", "Вписана руками"]], f.inv) : "")
        + sorts("↑ Дешевле", "↓ Дороже");
    }
    const box = openPop(btn, "f:" + key, "mat-flt", `<div class="mat-flt-h">${esc(colLabel(key))}</div>
      ${body}<div class="mat-flt-foot"><button type="button" class="lnk" data-clear>Сбросить колонку</button></div>`);
    const $p = (s) => box.querySelector(s);
    const set = (patch) => {
      FLT.cols[key] = Object.assign({}, FLT.cols[key] || {}, patch);
      if (!fltOn(key)) delete FLT.cols[key];
      saveFlt();
      paint();
    };
    const paintSort = () => box.querySelectorAll("[data-sort]").forEach((b) => b.classList.toggle(
      "mat-on", !!FLT.sort && FLT.sort.key === key && String(FLT.sort.dir) === b.dataset.sort));
    paintSort();
    box.querySelectorAll("[data-sort]").forEach((b) => b.addEventListener("click", () => {
      const dir = Number(b.dataset.sort);
      FLT.sort = FLT.sort && FLT.sort.key === key && FLT.sort.dir === dir ? null : { key, dir };
      saveFlt();
      paint();
      paintSort();
    }));
    $p("[data-clear]").addEventListener("click", () => {
      delete FLT.cols[key];
      if (FLT.sort && FLT.sort.key === key) FLT.sort = null;
      saveFlt();
      paint();
      closePop();
    });
    if ($p("[data-q]")) {
      $p("[data-q]").addEventListener("input", (e) => set({ q: e.target.value }));
      $p("[data-q]").focus();
    }
    box.querySelectorAll("[data-has]").forEach((i) => i.addEventListener("change",
      () => set({ has: i.dataset.has || undefined })));
    box.querySelectorAll("[data-inv]").forEach((i) => i.addEventListener("change",
      () => set({ inv: i.dataset.inv || undefined })));
    box.querySelectorAll("[data-age]").forEach((i) => i.addEventListener("change", () => set({
      ages: [...box.querySelectorAll("[data-age]:checked")].map((x) => x.dataset.age) })));
    if ($p("[data-from]")) {
      $p("[data-from]").addEventListener("input", (e) => set({ from: e.target.value }));
      $p("[data-to]").addEventListener("input", (e) => set({ to: e.target.value }));
    }
    if (t === "list") {
      const all = listVals(key);
      const paintList = () => {
        const q = ($p("[data-find]") ? $p("[data-find]").value : "").trim().toLowerCase();
        const vals = (FLT.cols[key] || {}).vals;
        $p("[data-list]").innerHTML = all.filter(([v]) => !q || v.toLowerCase().includes(q))
          .slice(0, 300).map(([v, n]) => `<label class="mat-flt-opt"><input type="checkbox"
            data-val="${esc(v)}"${!Array.isArray(vals) || vals.includes(v) ? " checked" : ""}>
            <span class="mat-flt-val">${v ? esc(v) : "<i>(пусто)</i>"}</span><b>${n}</b></label>`).join("");
        box.querySelectorAll("[data-val]").forEach((i) => i.addEventListener("change", () => {
          const cur = (FLT.cols[key] || {}).vals;
          const on = new Set(Array.isArray(cur) ? cur : all.map((x) => x[0]));
          if (i.checked) on.add(i.dataset.val); else on.delete(i.dataset.val);
          // Отмечено всё — фильтра нет: новое значение не должно прятаться.
          set({ vals: on.size === all.length ? undefined : [...on] });
        }));
      };
      paintList();
      if ($p("[data-find]")) {
        $p("[data-find]").addEventListener("input", paintList);
        $p("[data-find]").focus();
      }
      $p("[data-all]").addEventListener("click", () => { set({ vals: undefined }); paintList(); });
      $p("[data-none]").addEventListener("click", () => { set({ vals: [] }); paintList(); });
    }
  }

  function paintChips() {
    const box = $m("#matChips");
    if (!box) return;
    const keys = Object.keys(FLT.cols).filter(fltOn);
    const s = FLT.sort && colType(FLT.sort.key) ? FLT.sort : null;
    if (!keys.length && !s) {
      box.hidden = true;
      box.innerHTML = "";
      return;
    }
    box.hidden = false;
    box.innerHTML = `<span class="mat-chips-h">Отбор</span>${keys.map((k) => `<span class="mat-chip">${
        esc(chipText(k))}<button type="button" data-unflt="${esc(k)}" aria-label="Снять фильтр">×</button></span>`)
      .join("")}${s ? `<span class="mat-chip">${s.dir === -1 ? "↓" : "↑"} ${esc(colLabel(s.key))}<button
        type="button" data-unsort aria-label="Снять сортировку">×</button></span>` : ""}
      <button type="button" class="lnk" data-unall>Сбросить все</button>`;
    box.querySelectorAll("[data-unflt]").forEach((b) => b.addEventListener("click", () => {
      delete FLT.cols[b.dataset.unflt];
      saveFlt(); closePop(); paint();
    }));
    const us = box.querySelector("[data-unsort]");
    if (us) us.addEventListener("click", () => { FLT.sort = null; saveFlt(); closePop(); paint(); });
    box.querySelector("[data-unall]").addEventListener("click", () => {
      FLT = { cols: {}, sort: null };
      saveFlt(); closePop(); paint();
    });
  }

  /* ── колонки поставщиков и их счета ────────────────────────
     «Счета поставщиков» — проработка руками: колонка на поставщика, у
     которого нет электронного каталога, цены из его счетов. Сам счёт
     прикреплён к колонке и открывается скрепкой — и в заголовке, и в
     ячейке с ценой из него. */
  const dmy = (s) => s ? String(s).slice(0, 10).split("-").reverse().join(".") : "";
  // Метка времени с сервера — по Гринвичу. После полуночи по-местному
  // «сегодня» там ещё вчера, и цена от 03:10 16-го показывалась 15-м.
  const dmyLocal = (s) => {
    if (!s) return "";
    if (/^\d{4}-\d{2}-\d{2}$/.test(String(s))) return dmy(s);
    const d = new Date(s);
    return isNaN(d) ? dmy(s) : d.toLocaleDateString("ru-RU");
  };
  const size = (n) => n < 1048576 ? Math.max(1, Math.round(n / 1024)) + " КБ"
    : (n / 1048576).toFixed(1).replace(".", ",") + " МБ";
  const invName = (x) => x.number ? `Счёт № ${x.number}${x.date ? " от " + dmy(x.date) : ""}`
    : x.filename || "Счёт";

  async function openInvoiceFile(id, btn) {
    try {
      await DL.open("/api/invoices/" + encodeURIComponent(id) + "/file",
                    { btn, error: "Не удалось открыть счёт" });
    } catch (e) {
      note("Не вышло: " + e.message, true);
    }
  }

  function openInvoices(btn, sid) {
    if (POP && POP.key === "i:" + sid) return closePop();
    const box = openPop(btn, "i:" + sid, "mat-invs", "");
    paintInvoices(box, sid);
    // Окно росло по содержимому уже после расстановки — ставим заново.
    const r = btn.getBoundingClientRect();
    box.style.top = Math.max(8, Math.min(r.bottom + 6, window.innerHeight - box.offsetHeight - 8)) + "px";
  }

  /* ── прайс-листы поставщика ────────────────────────────────
     Прайс приходит от поставщика без электронного каталога книгой Excel.
     В справочник он не выливается: сервер собирает по нему поиск тем же
     движком, что у каталогов, и ставит цены тем материалам, что уже есть,
     с датой прайса. Дату, колонку цены и НДС подтверждает человек. */
  const plName = (x) => x.date ? `Прайс-лист от ${dmy(x.date)}` : "Прайс-лист — дата не указана";
  const plOf = (sid) => PRICELISTS.filter((x) => x.source_id === sid);
  const docsN = (s) => (s.invoices || 0) + plOf(s.id).length;
  const docsBtn = (s) => `<button type="button" class="mat-hbtn mat-inv-btn" data-invs="${
    esc(s.id)}" title="Прайс-листы и счета поставщика — открыть или загрузить">${ICO.clip}${
    docsN(s) ? `<i>${docsN(s)}</i>` : ""}</button>`;
  function plBadge(s) {
    const pl = plOf(s.id).find((x) => x.status === "ready" && x.date);
    if (!pl) return "";
    const age = ageOf(pl.date);
    return `<i class="mat-pl-badge age-${age}" title="${esc(`${plName(pl)} — ${AGE_NAME[age] || ""}.\n`
      + `Цены из него стоят у ${pl.matched} ${plural(pl.matched, "позиции", "позиций", "позиций")}`)}">прайс ${
      esc(dmy(pl.date).slice(0, 5))}</i>`;
  }

  function plState(x) {
    if (x.status === "ready") {
      return `<span class="mat-inv-ok">цены у ${x.matched} ${plural(x.matched, "позиции", "позиций", "позиций")}</span>${
        x.maybe ? `<span class="dim" title="Нашлись похожие, но не наверняка — цену не ставили">под вопросом ${x.maybe}</span>` : ""}${
        canUp() ? '<button type="button" class="lnk" data-pl-rematch title="Материалов стало больше — найти их в этом прайсе">Сопоставить снова</button>' : ""}`;
    }
    if (x.status === "check") {
      return `<span>${x.rows.toLocaleString("ru-RU")} ${plural(x.rows, "строка", "строки", "строк")} с ценой</span>${canUp()
        ? '<button type="button" class="lnk mat-inv-go" data-pl-check>Проверить и записать</button>' : ""}`;
    }
    if (x.status === "indexing" || x.status === "matching" || x.status === "reading") {
      return `<span class="dim mat-pl-run">${esc(x.progress || "готовится")}…</span>`;
    }
    if (x.status === "failed") {
      return `<span class="mat-inv-bad" title="${esc(x.error)}">${esc(x.error)}</span>${
        canUp() && x.rows ? '<button type="button" class="lnk" data-pl-check>Проверить снова</button>' : ""}`;
    }
    return "";
  }

  function paintPricelists(box, src) {
    const list = plOf(src.id);
    return `<div class="mat-docs-h">Прайс-листы</div>
      ${list.length ? `<div class="mat-inv-list">${list.map((x) => `
        <div class="mat-inv mat-pl" data-pl="${esc(x.id)}">
          <div class="mat-inv-top">
            <button type="button" class="lnk mat-inv-open" data-pl-open title="Скачать прайс-лист">
              <i class="mat-pl-dot${x.date ? " age-" + ageOf(x.date) : ""}"></i><span>${esc(plName(x))}</span></button>
            ${canUp() ? `<button type="button" class="lnk warn" data-pl-del title="Убрать прайс-лист и его цены">×</button>` : ""}
          </div>
          <div class="dim mat-inv-meta">${esc(x.filename)} · ${size(x.size || 0)} · добавлен ${
            esc(dmyLocal(x.at))}${x.author ? ", " + esc(x.author) : ""}</div>
          <div class="mat-inv-state">${plState(x)}</div>
        </div>`).join("")}</div>` : `<div class="dim mat-inv-empty">Прайс-листов пока нет</div>`}
      ${canUp() ? `<label class="btn-ghost sm mat-inv-up">${ICO.up}Загрузить прайс-лист
          <input type="file" data-pl-file accept=".xlsx,.xlsm,.xls" hidden></label>` : ""}`;
  }

  function wirePricelists(box, src) {
    box.querySelectorAll(".mat-pl").forEach((row) => {
      const id = row.dataset.pl;
      const x = PRICELISTS.find((p) => p.id === id) || {};
      row.querySelector("[data-pl-open]").addEventListener("click", (e) =>
        downloadPricelist(x, e.currentTarget));
      if (!canUp()) return;
      const chk = row.querySelector("[data-pl-check]");
      if (chk) chk.addEventListener("click", () => { closePop(); openPricelistCheck(id); });
      const again = row.querySelector("[data-pl-rematch]");
      if (again) again.addEventListener("click", async () => {
        try {
          await AUTH.api("POST", "/pricelists/" + id + "/rematch", {});
          closePop();
          watchPricelist(id);
        } catch (e) {
          status(box, "Не вышло: " + e.message, true);
        }
      });
      row.querySelector("[data-pl-del]").addEventListener("click", async () => {
        closePop();
        if (!await confirmBox("Убрать прайс-лист?", `Цены из «${esc(plName(x))}» уйдут из колонки
          «${esc(src.name)}». Где у поставщика есть другие цены — из счёта, другого прайса,
          каталога, — встанут они. Файл останется в «Файлах».`, "Убрать")) return;
        try {
          const r = await AUTH.api("DELETE", "/pricelists/" + id);
          await load();
          note(`Прайс-лист убран, снято цен: ${r.prices}`);
        } catch (e) {
          note("Не вышло: " + e.message, true);
        }
      });
    });
    const file = box.querySelector("[data-pl-file]");
    if (file) file.addEventListener("change", () => {
      const f = file.files && file.files[0];
      file.value = "";
      if (f) openUpload(f, { as: "pricelist", source: src });
    });
  }

  async function downloadPricelist(x, btn) {
    try {
      await DL.save("/api/pricelists/" + encodeURIComponent(x.id) + "/file",
                    { btn, name: x.filename, fallback: "прайс.xlsx",
                      error: "Не удалось скачать прайс" });
    } catch (e) {
      note("Не вышло: " + e.message, true);
    }
  }

  /* ── списки материалов ─────────────────────────────────────
     Выгрузка номенклатуры из 1С (заказчик, 22.09.2026): одни названия,
     без цен. Позиции встают в справочник, цены им сервер ищет в
     прайс-листах поставщиков — в фоне, минута на прайс. Загрузку можно
     отменить: кнопка «Списки» над прайсом появляется, когда список есть. */
  const lists = () => IMPORTS.filter((x) => x.source === "list");
  const fmt = (n) => Number(n || 0).toLocaleString("ru-RU");
  const posN = (n) => `${fmt(n)} ${plural(n, "позиция", "позиции", "позиций")}`;

  function paintListsBtn() {
    const host = $m("#matLists");
    if (!host) return;
    const n = lists().length;
    host.innerHTML = n ? `<button type="button" class="btn-ghost" data-lists
      title="Списки материалов, загруженные в справочник: сколько позиций, нашлись ли цены; загрузку можно отменить">${
      ICO.list}Списки<i class="mat-lists-n">${n}</i></button>` : "";
    const b = host.querySelector("[data-lists]");
    if (b) b.addEventListener("click", () => openLists(b));
  }

  function listState(x) {
    if (x.running) return `<span class="dim mat-pl-run">${esc(x.progress || "ищу цены")}…</span>`;
    return x.matched ? `<span class="mat-inv-ok">цены нашлись у ${fmt(x.matched)} ${
      plural(x.matched, "позиции", "позиций", "позиций")}</span>`
      : `<span class="dim">цен в прайс-листах поставщиков не нашлось</span>`;
  }

  function openLists(btn) {
    if (POP && POP.key === "lists") return closePop();
    const box = openPop(btn, "lists", "mat-invs", `<div class="mat-docs-h">Списки материалов</div>
      <div class="mat-inv-list">${lists().map((x) => `
        <div class="mat-inv" data-list="${esc(x.id)}">
          <div class="mat-inv-top">
            <span class="mat-inv-open">${ICO.list}<span>${esc(x.filename || "Список")}</span></span>
            ${canUp() ? `<button type="button" class="lnk warn" data-list-undo
              title="Отменить загрузку: убрать из справочника позиции этого списка">×</button>` : ""}
          </div>
          <div class="dim mat-inv-meta">${posN(x.added)} добавлено${x.same ? `, ${fmt(x.same)} уже были`
            : ""} · ${esc(dmyLocal(x.at))}${x.author ? ", " + esc(x.author) : ""}</div>
          <div class="mat-inv-state">${listState(x)}</div>
        </div>`).join("")}</div>`);
    box.querySelectorAll("[data-list-undo]").forEach((b) => b.addEventListener("click", async () => {
      const x = IMPORTS.find((i) => i.id === b.closest("[data-list]").dataset.list) || {};
      closePop();
      if (!await confirmBox("Отменить загрузку списка?", `Из справочника уйдут позиции, заведённые
        списком «${esc(x.filename)}», — ${posN(x.added)}. Останутся те, что уже попали в
        спецификации или получили цену из счёта либо вписанную руками. Цены прайс-листов уйдут
        вместе с позициями.`, "Отменить загрузку")) return;
      note("Отменяю загрузку списка…");
      try {
        const r = await AUTH.api("DELETE", "/material-imports/" + x.id);
        await load();
        note(`Загрузка «${x.filename}» отменена: убрано ${posN(r.removed)}`
          + (r.kept ? `, оставлено ${fmt(r.kept)} — они уже в деле` : ""));
      } catch (e) {
        note("Не вышло: " + e.message, true);
      }
    }));
  }

  /* Поиск цен идёт на сервере; досматриваем его и перечитываем прайс,
     когда закончился. Тихо — после обновления страницы; вслух — сразу
     после загрузки, и тихий досмотр, начатый перечитыванием прайса,
     становится громким. */
  const LIST_WATCH = new Map();
  async function watchList(id, filename, quiet) {
    if (LIST_WATCH.has(id)) {
      if (!quiet) LIST_WATCH.get(id).quiet = false;
      return;
    }
    const w = { quiet: !!quiet };
    LIST_WATCH.set(id, w);
    try {
      for (;;) {
        await new Promise((ok) => setTimeout(ok, 2500));
        let x;
        try {
          x = await AUTH.api("GET", "/material-imports/" + id);
        } catch (e) {
          return;
        }
        if (!x.running) {
          await load();
          if (!w.quiet) {
            note(`Список «${filename}»: цены нашлись у ${fmt(x.matched)} из ${posN(x.added)}`
              + (x.matched < x.added ? ". Остальным цены дадут счета и прайс-листы, когда их загрузят"
                : ""));
          }
          return;
        }
        if (!w.quiet) note(`Список «${filename}» в справочнике: ${x.progress || "ищу цены"}…`);
      }
    } finally {
      LIST_WATCH.delete(id);
    }
  }

  /* ── загрузка файла цен ────────────────────────────────────
     Одна дверь для трёх родов файлов: прайс-лист поставщика (цены в его
     колонку, с датой, позиций не добавляет), счёт поставщика (сверка
     строк) и список материалов — названия без цен из 1С (заводит позиции
     в справочник). Раньше был ещё свой прайс. Перепутать их
     легко — прайс поставщика однажды ушёл своим, — поэтому файл
     сначала только читается на сервере: ничего не пишется, а окно
     показывает, что в нём нашлось, чей он, не загружали ли его уже.
     Записывается то, что выбрал человек. Из скрепки колонки выбор уже
     сделан: если с файлом всё ясно, окно не показываем. */
  const BOOK_RX = /\.(xlsx|xlsm|xls)$/i;
  const INV_RX = /\.(pdf|jpe?g|png)$/i;
  const AS_NAME = { pricelist: "прайс-листом", invoice: "счётом", own: "своим прайсом",
                    list: "списком материалов" };

  function openUpload(f, preset) {
    const book = BOOK_RX.test(f.name);
    if (!book && !INV_RX.test(f.name)) {
      return note("Такой файл не загрузить: прайс — книгой Excel (.xlsx, .xlsm, .xls), счёт — PDF"
        + " или картинкой JPG/PNG", true);
    }
    if (f.size > (book ? 32 : 8) * 1048576) {
      return note(book ? "Книга больше 32 МБ — такой прайс не примем"
        : "Счёт больше 8 МБ — сохраните скан в PDF поменьше", true);
    }
    closePop();
    note(`Загружаю «${f.name}»…`);
    // Пока файл едет и читается, Трейс показывает разбор (20.10.2026).
    const tr = TRACE.start({ kind: book ? "pricelist" : "invoice", file: f.name });
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/price-uploads");
    xhr.setRequestHeader("Authorization", "Bearer " + AUTH.token());
    xhr.setRequestHeader("X-File-Name", encodeURIComponent(f.name));
    xhr.setRequestHeader("Content-Type", "application/octet-stream");
    xhr.upload.addEventListener("progress", (e) => {
      if (!e.lengthComputable) return;
      const pct = Math.round(e.loaded / e.total * 100);
      tr.upload(pct);
      note(pct < 100 ? `Загружаю «${f.name}»… ${pct}%`
        : book ? "Читаю книгу: ищу таблицу, цены, дату и чей это прайс…" : "Читаю счёт…");
    });
    xhr.addEventListener("load", () => {
      let r = {};
      try { r = JSON.parse(xhr.responseText); } catch (e) { /* не json */ }
      if (xhr.status < 200 || xhr.status >= 300) {
        tr.fail("Не получилось: " + (r.error || "файл не загрузился"));
        return note(r.error || "Не удалось загрузить файл", true);
      }
      tr.done(upSummary(r));
      const nb = $m("#matNote");
      if (nb) nb.hidden = true;
      if (!clearCase(r, preset)) return chooseUpload(r, preset);
      note("Записываю…");
      sendUpload(r, { as: preset.as, source_id: preset.source.id })
        .then((got) => afterCommit(r, got))
        .catch((e) => note("Не записалось: " + e.message, true));
    });
    xhr.addEventListener("error", () => {
      tr.fail("Сеть оборвалась — файл не загружен");
      note("Сеть оборвалась — файл не загружен", true);
    });
    xhr.send(f);
  }

  // Итог для карточки Трейса: что за файл и сколько в нём прочитано.
  function upSummary(r) {
    if (r.kind === "invoice") {
      const n = (r.invoice || {}).lines || 0;
      return n ? `Прочитал счёт: ${n} ${plural(n, "строка", "строки", "строк")}` : "Строки товаров не нашлись — проверьте счёт";
    }
    const pl = r.pricelist || {}, nm = r.names || {};
    if (pl.ok) return `Прочитал прайс: ${pl.rows} ${plural(pl.rows, "строка", "строки", "строк")}`;
    if (nm.ok) return `Прочитал список: ${nm.rows} ${plural(nm.rows, "наименование", "наименования", "наименований")}`;
    return "Прочитал книгу — выберите, что это за файл";
  }

  /* Из скрепки колонки: файл того рода, что выбран, не загружался и не
     упоминает другого поставщика — спрашивать не о чем. */
  function clearCase(up, preset) {
    if (!preset || !preset.source) return false;
    if (preset.as === "pricelist" && !(up.kind === "book" && up.pricelist && up.pricelist.ok)) return false;
    if (preset.as === "invoice" && up.kind !== "invoice") return false;
    if ((up.dups || []).length) return false;
    return !(up.mentions || []).some((m) => m.id !== preset.source.id);
  }

  const sendUpload = (up, body) => AUTH.api("POST", "/price-uploads/" + up.token, body);

  async function afterCommit(up, r) {
    await load();
    if (r.as === "list") {
      const x = r.list;
      note(`Из «${up.filename}» в справочник добавлено ${posN(x.added)}`
        + (x.same ? `, ${fmt(x.same)} уже были` : "")
        + (x.pricelists ? ". Ищу им цены в прайс-листах поставщиков…"
          : ". Прайс-листов поставщиков пока нет — цены встанут, когда их загрузят"));
      if (x.pricelists) watchList(x.import_id, up.filename);
      return;
    }
    if (r.as === "pricelist") {
      if (r.pricelist.status === "check") {
        note(`Прайс-лист «${up.filename}» прикреплён к колонке «${r.source.name}» — проверьте дату,`
          + " колонку цены и НДС");
        return openPricelistCheck(r.pricelist.id);
      }
      return note(`Прайс-лист «${up.filename}» прикреплён к колонке «${r.source.name}», но не`
        + ` разобрался: ${r.pricelist.error || ""}`, true);
    }
    if (r.as === "invoice") return afterUpload(r.invoice, r.source);
  }

  function chooseUpload(up, preset) {
    const pl = up.pricelist || {}, inv = up.invoice || {}, nm = up.names || {};
    const book = up.kind === "book";
    const ment = up.mentions || [];
    const dups = up.dups || [];
    const guess = up.guess || {};
    const cols = SRC;
    // Книга с ценами — прайс-лист поставщика, книга с одними названиями —
    // список материалов (22.09.2026), файл счёта — счёт. Своего прайса
    // с 21.09.2026 нет. Прайс-лист списком не предлагаем вовсе: сто тысяч
    // позиций поставщика в справочнике не нужны.
    let as = book ? (pl.ok ? "pricelist" : nm.ok ? "list" : "") : "invoice";
    let newName = guess.name || up.name_guess || "";
    let sid = preset && preset.source ? preset.source.id
      : guess.source_id || (ment.length === 1 ? ment[0].id : "") || (newName ? "+new" : "");
    let done = false;
    const opts = book ? [
      ["pricelist", "Прайс-лист поставщика",
        "Цены встанут в колонку поставщика с датой прайса. Позиции в справочник не добавляются.",
        pl.ok ? `${pl.rows.toLocaleString("ru-RU")} ${plural(pl.rows, "строка", "строки", "строк")} с ценой · `
          + (pl.date ? `прайс от ${dmy(pl.date)}` : "дату впишете на следующем шаге") : "", pl.ok ? "" : pl.reason],
      ...(pl.ok ? [] : [["list", "Список материалов — в справочник",
        "Названия встанут позициями в прайс материалов, без цен. Цены им найдутся в прайс-листах"
          + " поставщиков. Загрузку можно отменить.",
        nm.ok ? `${posN(nm.rows)}: новых ${fmt(nm.new)}${nm.same ? `, уже в справочнике ${fmt(nm.same)}` : ""}`
          + (nm.unused || nm.dups ? ` · не беру ${[nm.unused ? `${fmt(nm.unused)} с пометкой «не использ»` : "",
            nm.dups ? `${fmt(nm.dups)} ${plural(nm.dups, "повтор", "повтора", "повторов")}` : ""]
            .filter(Boolean).join(" и ")}` : "") : "", nm.ok ? "" : nm.reason]]),
    ] : [
      ["invoice", "Счёт поставщика",
        "Строки счёта сверяются с позициями справочника, цены встанут в колонку поставщика.",
        [inv.number ? `№ ${inv.number}` : "", inv.date ? `от ${dmy(inv.date)}` : "",
          inv.supplier ? `поставщик ${inv.supplier}` : "",
          inv.lines ? `${inv.lines} ${plural(inv.lines, "строка", "строки", "строк")}` : inv.warning || ""]
          .filter(Boolean).join(" · "), ""],
    ];
    const box = document.createElement("div");
    box.className = "pf-modal";
    box.innerHTML = `
      <div class="pf-crop cnt-card mat-up" role="dialog" aria-label="Загрузка файла">
        <h3>${book ? "Что это за книга?" : "Счёт поставщика"}</h3>
        <p class="mat-usage-sub">${esc(up.filename)} · ${size(up.size)}${guess.why && !preset
          ? ` · <span class="mat-up-why">похоже: ${esc(guess.why)}</span>` : ""}</p>
        <div class="mat-up-opts">${opts.map(([k, t, d, info, bad]) => `
          <label class="mat-up-opt${bad ? " off" : ""}" data-opt="${k}">
            <input type="radio" name="mat-up-as" value="${k}"${bad ? " disabled" : ""}>
            <span class="mat-up-body"><b>${t}</b><span>${d}</span>
              ${bad ? `<i class="bad">${esc(bad)}</i>` : info ? `<i>${esc(info)}</i>` : ""}</span>
          </label>`).join("")}</div>
        <div class="mat-up-dest" data-dest hidden>
          <label class="mat-plc-f"><span>В колонку поставщика</span>
            <select class="role-sel" data-src>
              <option value="">— выберите —</option>
              ${cols.map((x) => `<option value="${esc(x.id)}">${esc(x.name)}${
                x.group === "catalog" ? " · каталог" : ""}</option>`).join("")}
              <option value="+new">+ Новый поставщик…</option>
            </select></label>
          <label class="mat-plc-f" data-newbox hidden><span>Название нового поставщика</span>
            <input class="pos-in" data-new autocomplete="off" placeholder="ООО «ЭлектроСнаб»"
              value="${esc(newName)}"></label>
        </div>
        <div class="mat-up-warns" data-warns></div>
        <div class="pf-note bad" data-err hidden></div>
        <div class="pf-modal-foot"><span class="grow"></span>
          <button type="button" class="btn ghost" data-no>Отмена</button>
          <button type="button" class="btn" data-ok>Дальше</button></div>
      </div>`;
    document.body.appendChild(box);
    const $u = (q) => box.querySelector(q);
    const srcName = (id) => (SRC.find((x) => x.id === id) || {}).name || "";
    const when = (d) => dmyLocal(d.at);
    const dupText = (d) => `${AS_NAME[d.as]}${d.source && d.as !== "own" ? ` в «${d.source}»` : ""} ${when(d)}`;

    // Что сказать про выбор: [текст, вид (bad — нельзя, warn — проверьте, info), действие].
    const warns = () => {
      const out = [];
      if (as === "list") {
        const same = dups.find((d) => d.as === "list");
        if (same) {
          out.push([`Этот список уже загружен ${when(same)} — второй раз не нужно. Прежнюю загрузку`
            + " можно отменить кнопкой «Списки» над прайсом", "bad"]);
        }
        if (nm.truncated) out.push([`В книге ${fmt(nm.total)} позиций — возьму первые ${fmt(nm.rows)}`, "warn"]);
      }
      if (as === "pricelist" || as === "invoice") {
        const what = as === "pricelist" ? "прайс-лист" : "счёт";
        const same = dups.find((d) => d.as === as && d.source_id === sid);
        if (same) {
          out.push([`Этот ${what} уже загружен в колонку «${same.source}» ${when(same)} — второй раз не нужно.`
            + " Он открывается скрепкой в заголовке колонки; если прежний не нужен — уберите его там крестиком", "bad"]);
        }
        const other = dups.filter((d) => d.as !== as || d.source_id !== sid);
        if (other.length) out.push([`Этот файл уже загружен: ${other.map(dupText).join("; ")}`, "warn"]);
        const named = sid === "+new" ? newName.trim() : "";
        // Регистр, кавычки, «ё/е» и «э/е» не в счёт: «Электроснаб» — это колонка «ЭлектроСнаб».
        const flat = (n) => String(n).toLowerCase().replace(/[ёэ]/g, "е").replace(/[^a-zа-я0-9]/g, "");
        const exists = named && cols.find((x) => flat(x.name) === flat(named));
        if (exists) out.push([`Колонка «${exists.name}» уже есть — ${what} ляжет в неё`, "info"]);
        const picked = exists ? exists.id : sid;
        if (ment.length && picked && picked !== "+new" && !ment.some((m) => m.id === picked)) {
          ment.forEach((m) => out.push([`В файле упоминается «${m.name}», а выбрана колонка «${srcName(picked)}»`,
            "warn", [`Выбрать «${m.name}»`, () => { sid = m.id; }]]));
        } else if (ment.length && sid === "+new" && !exists) {
          ment.forEach((m) => out.push([`В файле упоминается «${m.name}» — такая колонка уже есть`,
            "warn", [`Выбрать «${m.name}»`, () => { sid = m.id; }]]));
        }
        const pick = SRC.find((x) => x.id === picked);
        if (as === "pricelist" && pick && pick.group === "catalog") {
          out.push([`«${pick.name}» — колонка каталога: цены прайса встанут рядом с ценами каталога, в клетке — самая свежая`, "info"]);
        }
      }
      return out;
    };

    const paintUp = () => {
      box.querySelectorAll("[data-opt]").forEach((el) => {
        const on = el.dataset.opt === as;
        el.classList.toggle("on", on);
        el.querySelector("input").checked = on;
      });
      const dest = as === "pricelist" || as === "invoice";
      $u("[data-dest]").hidden = !dest;
      $u("[data-src]").value = sid;
      $u("[data-newbox]").hidden = !(dest && sid === "+new");
      const list = warns();
      $u("[data-warns]").innerHTML = list.map(([t, kind, act], i) => `<div class="mat-up-w ${kind}">
        <span>${esc(t)}</span>${act ? `<button type="button" class="lnk" data-act="${i}">${esc(act[0])}</button>` : ""}</div>`).join("");
      box.querySelectorAll("[data-act]").forEach((b) => b.addEventListener("click", () => {
        list[Number(b.dataset.act)][2][1]();
        paintUp();
      }));
      const ok = $u("[data-ok]");
      const blocked = list.some((w) => w[1] === "bad");
      let label = "Дальше";
      let can_ = !!as && !blocked;
      if (as === "pricelist") label = "Дальше — проверить цены";
      if (as === "invoice") label = "Загрузить счёт";
      if (as === "list") {
        label = nm.new ? `Добавить ${posN(nm.new)} в справочник` : "Все позиции уже в справочнике";
        if (!nm.new) can_ = false;
      }
      if (dest && (!sid || (sid === "+new" && !newName.trim()))) {
        can_ = false;
        label = sid === "+new" ? "Впишите поставщика" : "Выберите колонку";
      }
      if (!as) label = "Выберите, что это за файл";
      if (blocked) label = "Уже загружен";
      ok.textContent = label;
      ok.disabled = !can_;
    };
    paintUp();

    const close = () => {
      document.removeEventListener("keydown", key);
      box.remove();
      if (!done) AUTH.api("DELETE", "/price-uploads/" + up.token).catch(() => {});
    };
    const key = (e) => { if (e.key === "Escape") close(); };
    document.addEventListener("keydown", key);
    box.addEventListener("click", (e) => { if (e.target === box) close(); });
    $u("[data-no]").addEventListener("click", close);
    box.querySelectorAll("[data-opt] input").forEach((el) => el.addEventListener("change", () => {
      as = el.value;
      paintUp();
    }));
    $u("[data-src]").addEventListener("change", (e) => {
      sid = e.target.value;
      paintUp();
      if (sid === "+new") $u("[data-new]").focus();
    });
    $u("[data-new]").addEventListener("input", (e) => {
      newName = e.target.value;
      const at = e.target.selectionStart;
      paintUp();
      e.target.focus();
      e.target.setSelectionRange(at, at);
    });
    $u("[data-ok]").addEventListener("click", async () => {
      const body = { as };
      if (as === "list") { /* список — в справочник, колонки не нужно */ }
      else if (sid === "+new") body.name = newName.trim();
      else body.source_id = sid;
      const err = $u("[data-err]");
      const ok = $u("[data-ok]");
      err.hidden = true;
      ok.disabled = true;
      ok.textContent = "Записываю…";
      let r;
      try {
        r = await sendUpload(up, body);
      } catch (e) {
        // Не записалось — окно остаётся: выбор можно поправить и повторить.
        err.textContent = e.message;
        err.hidden = false;
        return paintUp();
      }
      done = true;
      close();
      afterCommit(up, r).catch((e) => note("Не вышло: " + e.message, true));
    });
  }

  /* Проверка прайса перед записью: от какого числа, какая колонка цены
     (у Geniled «МИЦ» и «Цена со скидкой», у Аэросигнала «розничная» и
     «партнёрская»), с НДС ли, какие таблицы брать. Всё предложено по
     прайсу, человек лишь подтверждает — и видит на образце строк, что
     встанет в колонку. */
  async function openPricelistCheck(id) {
    let pl;
    try {
      pl = await AUTH.api("GET", "/pricelists/" + id);
    } catch (e) {
      return note("Не вышло: " + e.message, true);
    }
    const src = SRC.find((s) => s.id === pl.source_id) || { name: "" };
    const meta = pl.meta || {};
    const tables = meta.tables || [];
    const was = {};
    ((pl.choice || {}).tables || []).forEach((x) => { was[x.i] = x.price; });
    const had = Object.keys(was).length > 0;
    const st = tables.map((t, i) => ({ on: had ? i in was : true, price: i in was ? was[i] : t.choice }));
    let vat = pl.vat || "included";
    let rate = pl.vat_rate ?? 22;
    /* Прежние прайс-листы той же колонки. Новый прайс того же поставщика
       обычно заменяет старый: оставить оба — значит держать в подсказках
       цены, которые поставщик уже отменил. Отмечаем замену сами, когда файл
       тот же по имени (без дат); другой прайс того же поставщика, например
       по другому бренду, не трогаем. */
    const stem = (n) => String(n || "").toLowerCase().replace(/\.[^.]+$/, "")
      .replace(/[\d\s._()\-]+/g, "");
    const older = PRICELISTS.filter((x) => x.source_id === pl.source_id && x.id !== pl.id
      && x.status !== "indexing" && x.status !== "matching");
    const rep = new Set(older.filter((x) => stem(x.filename) === stem(pl.filename)
      && (!x.date || !pl.date || x.date <= pl.date)).map((x) => x.id));
    const box = document.createElement("div");
    box.className = "pf-modal";
    box.innerHTML = `
      <div class="pf-crop cnt-card mat-rv mat-plc" role="dialog" aria-label="Проверка прайс-листа">
        <h3>Прайс-лист → колонка «${esc(src.name)}»</h3>
        <p class="mat-usage-sub">${esc(pl.filename)} · ${pl.rows.toLocaleString("ru-RU")} ${plural(pl.rows, "строка", "строки", "строк")} с ценой
          · ${tables.length} ${plural(tables.length, "таблица", "таблицы", "таблиц")}</p>
        <div class="mat-plc-grid">
          <label class="mat-plc-f"><span>От какого числа прайс</span>
            <input class="pos-in" type="date" data-date value="${esc(pl.date || "")}">
            <i class="dim">${meta.date ? esc("Дату нашли " + meta.date_src + ". Проверьте")
              : "В прайсе даты не нашли — впишите из письма поставщика"}</i></label>
          <label class="mat-plc-f"><span>Цены в прайсе</span>
            <span class="mat-plc-vat"><select class="role-sel" data-vat>
              <option value="included"${vat === "included" ? " selected" : ""}>с НДС</option>
              <option value="excluded"${vat === "excluded" ? " selected" : ""}>без НДС</option></select>
              <span data-ratebox>ставка <input class="pos-in num" data-rate value="${esc(rate)}"> %</span></span>
            <i class="dim">${esc(meta.vat_why || "")}. В прайс материалов цены лягут без НДС — как у каталогов</i></label>
        </div>
        <div class="mat-plc-tables" data-tables></div>
        ${older.length ? `<div class="mat-plc-rep">${older.map((o) => `
          <label><input type="checkbox" data-rep="${esc(o.id)}"${rep.has(o.id) ? " checked" : ""}>
            <span>Заменить «${esc(plName(o))}» (${esc(o.filename)}) — его цены уйдут из колонки, когда
              этот прайс будет готов</span></label>`).join("")}</div>` : ""}
        <div class="mat-up-warns" data-dwarn></div>
        <div class="pf-note bad" data-err hidden></div>
        <div class="pf-modal-foot">
          <span class="mat-form-hint mat-rv-hint">Позиции прайса в справочник не добавляются: цены
            встанут тем материалам, что уже есть, — по артикулу и словам, как у каталогов. Под
            вопросом цену не ставим. Позиции, которые появятся позже, найдутся в этом прайсе при
            «Подтянуть материалы».</span>
          <span class="grow"></span>
          <button type="button" class="btn ghost" data-no>Отмена</button>
          <button type="button" class="btn" data-ok>Записать цены</button></div>
      </div>`;
    document.body.appendChild(box);
    const $c = (s) => box.querySelector(s);
    const paintTables = () => {
      $c("[data-ratebox]").hidden = vat !== "included";
      $c("[data-tables]").innerHTML = tables.map((t, i) => {
        const x = st[i];
        const net = (v) => v === null || v === undefined ? null
          : vat === "included" && rate ? v / (1 + rate / 100) : v;
        return `<section class="mat-plc-t${x.on ? "" : " off"}">
          <div class="mat-plc-th">
            <label><input type="checkbox" data-on="${i}"${x.on ? " checked" : ""}>
              <b>${esc(t.sheet)}</b></label>
            <span class="dim">${t.count.toLocaleString("ru-RU")} ${plural(t.count, "строка", "строки", "строк")} · шапка в строке ${t.header_row}</span>
            <span class="grow"></span>
            <span class="dim">цена из колонки</span>
            <select class="role-sel" data-price="${i}">${t.prices.map((p, k) => `<option value="${k}"${
              k === x.price ? " selected" : ""}>${esc(p.label)} · ${p.filled.toLocaleString("ru-RU")} цен</option>`).join("")}</select>
          </div>
          <div class="mat-usage-scroll"><table class="mat-usage-tbl">
            <thead><tr><th>Код</th><th>Наименование</th><th>Ед.</th><th class="num">В прайсе</th>
              <th class="num">В колонку${vat === "included" ? ", без НДС" : ""}</th></tr></thead>
            <tbody>${(t.sample || []).slice(0, 6).map((it) => {
              const v = it.p[x.price];
              return `<tr><td class="dim">${esc(it.c)}</td><td>${esc(it.n)}${it.g
                ? `<i class="dim mat-plc-g">${esc(it.g)}</i>` : ""}</td><td>${esc(it.u)}</td>
                <td class="num">${v === null || v === undefined ? "—" : money(v)}</td>
                <td class="num"><b>${v === null || v === undefined ? "—" : money(net(v))}</b></td></tr>`;
            }).join("")}</tbody></table></div>
        </section>`;
      }).join("");
      box.querySelectorAll("[data-on]").forEach((el) => el.addEventListener("change", () => {
        st[Number(el.dataset.on)].on = el.checked;
        paintTables();
      }));
      box.querySelectorAll("[data-price]").forEach((el) => el.addEventListener("change", () => {
        st[Number(el.dataset.price)].price = Number(el.value);
        paintTables();
      }));
    };
    paintTables();
    const paintDate = () => {
      const d = $c("[data-date]").value;
      const out = [];
      if (d) {
        const age = (Date.now() - new Date(d + "T00:00:00").getTime()) / 86400000;
        if (age > 365) out.push("Прайсу больше года — на его цены вряд ли можно рассчитывать");
        else if (age > 90) out.push(`Прайсу ${Math.floor(age / 30)} мес. — цены в нём могли устареть`);
        const newer = older.filter((o) => o.status === "ready" && o.date && o.date > d && !rep.has(o.id));
        if (newer.length) {
          out.push(`В колонке есть прайс свежее — от ${dmy(newer[0].date)}: в клетках останутся его цены,`
            + " цены этого будут в подсказке");
        }
      }
      $c("[data-dwarn]").innerHTML = out.map((t) => `<div class="mat-up-w warn"><span>${esc(t)}</span></div>`).join("");
    };
    paintDate();
    $c("[data-date]").addEventListener("input", paintDate);
    box.querySelectorAll("[data-rep]").forEach((el) => el.addEventListener("change", () => {
      if (el.checked) rep.add(el.dataset.rep); else rep.delete(el.dataset.rep);
      paintDate();
    }));
    const close = () => { document.removeEventListener("keydown", key); box.remove(); };
    const key = (e) => { if (e.key === "Escape") close(); };
    document.addEventListener("keydown", key);
    box.addEventListener("click", (e) => { if (e.target === box) close(); });
    $c("[data-no]").addEventListener("click", close);
    $c("[data-vat]").addEventListener("change", (e) => { vat = e.target.value; paintTables(); });
    $c("[data-rate]").addEventListener("input", (e) => {
      const n = numOf(e.target.value);
      if (n !== null) { rate = n; paintTables(); }
    });
    $c("[data-ok]").addEventListener("click", async () => {
      const err = $c("[data-err]");
      err.hidden = true;
      $c("[data-ok]").disabled = true;
      try {
        await AUTH.api("POST", "/pricelists/" + id + "/apply", {
          date: $c("[data-date]").value, vat, vat_rate: rate, replace: [...rep],
          tables: st.map((x, i) => ({ i, on: x.on, price: x.price })) });
        close();
        note(`Прайс-лист «${pl.filename}»: собираю поиск по прайсу и ставлю цены — на большой прайс до минуты`);
        await load();
        watchPricelist(id);
      } catch (e) {
        err.textContent = e.message;
        err.hidden = false;
        $c("[data-ok]").disabled = false;
      }
    });
    $c("[data-date]").focus();
  }

  /* Подготовка прайса идёт на сервере: индекс и сопоставление — до минуты
     на прайс в сотню тысяч строк. Смотрим за ней и говорим, чем кончилось. */
  const PL_WATCH = new Set();
  async function watchPricelist(id, quiet) {
    if (PL_WATCH.has(id)) return;
    PL_WATCH.add(id);
    try {
      for (let i = 0; i < 600; i++) {
        const pl = await AUTH.api("GET", "/pricelists/" + id);
        const src = SRC.find((s) => s.id === pl.source_id) || { name: "" };
        const k = PRICELISTS.findIndex((x) => x.id === id);
        if (k >= 0) Object.assign(PRICELISTS[k], pl);
        if (pl.status === "ready") {
          await load();
          if (!pl.matched && !quiet) {
            note(`${plName(pl)} («${pl.filename}») готов, но ни одна позиция справочника в нём не нашлась`
              + `${pl.maybe ? ` — только ${pl.maybe} похожих под вопросом` : ""}. Проверьте, тот ли это прайс`
              + ` и та ли колонка («${src.name}»). Позиции, которые появятся позже, найдутся при «Подтянуть материалы».`,
              true);
            return;
          }
          note(`${plName(pl)} («${pl.filename}»): цены встали у ${pl.matched} ${plural(pl.matched,
            "позиции", "позиций", "позиций")} колонки «${src.name}»${pl.maybe
            ? `, ещё ${pl.maybe} нашлись под вопросом — им цену не ставили` : ""}. `
            + "Позиции, которые появятся позже, найдутся в этом прайсе при «Подтянуть материалы».");
          return;
        }
        if (pl.status === "failed") {
          await load();
          note(`Прайс-лист «${pl.filename}»: ${pl.error}`, true);
          return;
        }
        if (!quiet) note(`Прайс-лист «${pl.filename}»: ${pl.progress || "готовлю"}…`);
        const run = document.querySelector(`[data-pl="${id}"] .mat-inv-state`);
        if (run) run.innerHTML = plState(pl);
        await new Promise((r) => setTimeout(r, 1500));
      }
    } catch (e) {
      if (!quiet) note("Не вышло дождаться прайса: " + e.message, true);
    } finally {
      PL_WATCH.delete(id);
    }
  }

  function paintInvoices(box, sid) {
    const src = SRC.find((s) => s.id === sid);
    if (!src) return closePop();
    const list = INVOICES.filter((x) => x.source_id === sid);
    box.innerHTML = `<div class="mat-flt-h">Документы · ${esc(src.name)}</div>
      ${paintPricelists(box, src)}
      <div class="mat-docs-h">Счета</div>
      ${list.length ? `<div class="mat-inv-list">${list.map((x) => `
        <div class="mat-inv" data-id="${esc(x.id)}">
          <div class="mat-inv-top">
            <button type="button" class="lnk mat-inv-open" data-open title="Открыть счёт">${
              ICO.clip}<span>${esc(invName(x))}</span></button>
            ${canUp() ? `<button type="button" class="lnk" data-edit-inv title="Номер и дата счёта">✎</button>
              <button type="button" class="lnk warn" data-del-inv title="Убрать счёт из колонки">×</button>` : ""}
          </div>
          <div class="dim mat-inv-meta">${x.number ? esc(x.filename) + " · " : ""}${
            size(x.size || 0)} · добавлен ${esc(dmyLocal(x.at))}${x.author ? ", " + esc(x.author) : ""}</div>
          <div class="mat-inv-state">${invState(x)}</div>
          ${canUp() ? `<div class="mat-inv-edit" hidden>
            <input class="pos-in" data-num placeholder="№ счёта" value="${esc(x.number)}" autocomplete="off">
            <input class="pos-in" type="date" data-date value="${esc(x.date)}">
            <button type="button" class="lnk" data-save-inv>Сохранить</button></div>` : ""}
        </div>`).join("")}</div>` : `<div class="dim mat-inv-empty">Счетов пока нет</div>`}
      ${canUp() ? `<label class="btn-ghost sm mat-inv-up">${ICO.up}Загрузить счёт
          <input type="file" data-inv-file accept=".pdf,.jpg,.jpeg,.png" hidden></label>
        <div class="mat-inv-status" data-status></div>` : ""}
      <div class="dim mat-pop-hint">Прайс — книгой Excel, счёт — PDF или фото до 8 МБ; любой файл
        можно загрузить и кнопкой «Загрузить» над таблицей. Файлы лягут в «Файлы», в папки
        «Прайсы поставщиков» и «Счета поставщиков».</div>
      <div class="mat-pop-hint mat-docs-rule">В клетке колонки — одна цена поставщика: из счёта,
        пока ему нет 30 дней; иначе самая свежая по дате — прайс, каталог, вписанная руками.
        Остальные цены с датами — в подсказке клетки.</div>`;
    wirePricelists(box, src);
    box.querySelectorAll(".mat-inv:not(.mat-pl)").forEach((row) => {
      const id = row.dataset.id;
      row.querySelector("[data-open]").addEventListener("click", (e) =>
        openInvoiceFile(id, e.currentTarget));
      if (!canUp()) return;
      const rv = row.querySelector("[data-review]");
      if (rv) rv.addEventListener("click", () => { closePop(); openReview(id); });
      const rp = row.querySelector("[data-reparse]");
      if (rp) rp.addEventListener("click", async () => {
        status(box, "Разбираю счёт…");
        const tr = TRACE.start({ kind: "reinvoice", file: (INVOICES.find((x) => x.id === id) || {}).filename || "" });
        try {
          const got = await AUTH.api("POST", "/invoices/" + id + "/parse", {});
          if (got.lines) tr.done(`Готово: ${got.lines} ${plural(got.lines, "строка", "строки", "строк")}`);
          else tr.fail((got.warnings || [])[0] || "Строки товаров не нашлись");
          await load();
          if (got.lines) { closePop(); return openReview(id); }
          if (POP && POP.key === "i:" + sid) paintInvoices(POP.box, sid);
          status(box, (got.warnings || [])[0] || "Строки товаров не нашлись", true);
        } catch (e) {
          tr.fail("Не получилось: " + e.message);
          status(box, "Не вышло: " + e.message, true);
        }
      });
      row.querySelector("[data-edit-inv]").addEventListener("click", () => {
        const ed = row.querySelector(".mat-inv-edit");
        ed.hidden = !ed.hidden;
        if (!ed.hidden) ed.querySelector("[data-num]").focus();
      });
      row.querySelector("[data-save-inv]").addEventListener("click", async () => {
        try {
          await AUTH.api("PATCH", "/invoices/" + id, {
            number: row.querySelector("[data-num]").value,
            date: row.querySelector("[data-date]").value });
          await load();
          if (POP && POP.key === "i:" + sid) paintInvoices(POP.box, sid);
        } catch (e) {
          status(box, "Не вышло: " + e.message, true);
        }
      });
      row.querySelector("[data-del-inv]").addEventListener("click", async () => {
        const x = INV[id] || {};
        closePop();
        if (!await confirmBox("Убрать счёт из колонки?", `«${esc(invName(x))}» больше не будет
          открываться из прайса. Файл останется в «Файлах», цены в колонке — тоже.`, "Убрать")) return;
        try {
          await AUTH.api("DELETE", "/invoices/" + id);
          await load();
          note("Счёт убран из колонки «" + src.name + "»");
        } catch (e) {
          note("Не вышло: " + e.message, true);
        }
      });
    });
    const file = box.querySelector("[data-inv-file]");
    if (file) file.addEventListener("change", () => {
      const f = file.files && file.files[0];
      file.value = "";
      if (f) openUpload(f, { as: "invoice", source: src });
    });
  }

  function status(box, text, bad) {
    const st = box.querySelector("[data-status]");
    if (!st) return;
    st.textContent = text;
    st.classList.toggle("bad", !!bad);
  }

  /* После загрузки счёт уже разобран сервером: есть строки — сразу окно
     сверки, ради него счёт и загружают; нет — говорим почему. */
  function afterUpload(inv, src) {
    if (inv.lines) {
      closePop();
      note(`Счёт «${inv.filename || ""}» прикреплён к колонке «${src.name}» и разобран`);
      return openReview(inv.id);
    }
    if (POP && POP.key === "i:" + src.id) paintInvoices(POP.box, src.id);
    note(`Счёт «${inv.filename || ""}» прикреплён к колонке «${src.name}». ${
      (inv.warnings || [])[0] || "Строки товаров в нём не нашлись"}`, true);
  }

  function invState(x) {
    const n = x.lines || 0;
    if (x.status === "applied") {
      return `<span class="mat-inv-ok">цены записаны ${esc(dmyLocal(x.applied_at))}</span>${canUp()
        ? '<button type="button" class="lnk" data-review>Сверить снова</button>' : ""}`;
    }
    if (x.status === "parsed") {
      return `<span>разобран: ${n} ${plural(n, "строка", "строки", "строк")}</span>${canUp()
        ? '<button type="button" class="lnk mat-inv-go" data-review>Сверить и записать</button>' : ""}`;
    }
    if (x.status === "scan") return '<span class="dim">картинка — цены впишите руками</span>';
    if (x.status === "failed") {
      return `<span class="mat-inv-bad" title="${esc((x.warnings || []).join("\n"))}">не разобрался</span>${
        canUp() ? '<button type="button" class="lnk" data-reparse>Разобрать снова</button>' : ""}`;
    }
    return "";
  }

  /* ── сверка счёта с прайсом ───────────────────────────────
     Строки счёта рядом с позициями прайса, которые сервер нашёл для них:
     то же написание, тот же артикул — «найдена»; похожие слова — «под
     вопросом». Цена в колонку считается за единицу позиции прайса и без
     НДС — как хранятся цены каталогов. Отмеченное записывается одной
     кнопкой; ненайденное заводится новой позицией или выбирается руками.
     Писать без сверки не даём: разбор может ошибиться в цифре, а цена
     уйдёт прямо в расчёты. */
  const UNIT_N = { "шт": "шт", "шт.": "шт", "штука": "шт", "штук": "шт", "м": "м", "м.": "м",
    "метр": "м", "пм": "м", "п.м": "м", "м.п.": "м", "км": "км", "кг": "кг", "кг.": "кг",
    "т": "т", "уп": "уп", "уп.": "уп", "упак": "уп", "упак.": "уп", "упаковка": "уп",
    "компл": "компл", "компл.": "компл", "комплект": "компл", "к-т": "компл", "пар": "пар",
    "пара": "пар", "рул": "рул", "рулон": "рул" };
  const unitN = (u) => {
    const s = String(u || "").trim().toLowerCase().replace(/ё/g, "е");
    return UNIT_N[s] || s.replace(/\.$/, "");
  };
  // То же правило, что invoice_unit_price на сервере.
  function unitPrice(l, unit, strip, rate) {
    const a = unitN(unit), b = unitN(l.unit);
    let p = l.price, why = "";
    if (p === null || p === undefined) return [null, "цена не прочиталась"];
    if (a && b && a !== b) {
      if (l.base_price !== null && l.base_price !== undefined && ["шт", "м", "кг"].includes(a)) p = l.base_price;
      else if (b === "км" && a === "м") p /= 1000;
      else if (b === "м" && a === "км") p *= 1000;
      else why = `в счёте за «${l.unit}», в прайсе за «${unit}» — проверьте`;
    }
    if (strip && rate) p /= 1 + rate / 100;
    return [Math.round(p * 100) / 100, why];
  }

  async function openReview(invId) {
    let data;
    try {
      data = await AUTH.api("GET", "/invoices/" + invId + "/review");
    } catch (e) {
      return note("Не вышло: " + e.message, true);
    }
    const inv = data.invoice;
    const src = SRC.find((s) => s.id === inv.source_id) || { name: "" };
    const rate = inv.vat_rate;
    let strip = !!data.strip_vat;
    const byId = Object.fromEntries(ROWS.map((r) => [r.id, r]));
    // Строки: что делаем с каждой. Уверенные отмечены сразу, под вопросом
    // и ненайденные — нет: их решает человек.
    const st = data.lines.map((l) => ({
      l, mode: l.match ? "match" : "new", mid: l.match ? l.match.id : "",
      state: l.match ? l.match.state : "", on: !!(l.match && l.match.state === "sure"),
      price: null, touched: false, picking: false,
    }));
    const unitOf = (x) => x.mode === "match" ? ((byId[x.mid] || x.l.match || {}).unit || x.l.unit) : x.l.unit;
    const calc = (x) => unitPrice(x.l, unitOf(x), strip, rate);
    st.forEach((x) => { x.price = calc(x)[0]; });

    const box = document.createElement("div");
    box.className = "pf-modal";
    const head = [inv.number ? `Счёт № ${esc(inv.number)}` : esc(inv.filename),
      inv.date ? "от " + esc(dmy(inv.date)) : "", inv.supplier ? "· " + esc(inv.supplier) : "",
      inv.inn ? "· ИНН " + esc(inv.inn) : ""].filter(Boolean).join(" ");
    const warns = inv.warnings || [];
    box.innerHTML = `
      <div class="pf-crop cnt-card mat-rv" role="dialog" aria-label="Сверка счёта">
        <h3>Сверка счёта с прайсом</h3>
        <p class="mat-usage-sub">${head} → колонка «${esc(src.name)}»</p>
        <div class="mat-rv-facts">
          <span>${st.length} ${plural(st.length, "строка", "строки", "строк")}</span>
          ${inv.total != null ? `<span>итого ${money(inv.total)}</span>` : ""}
          ${warns.length ? `<span class="mat-rv-warn" title="${esc(warns.join("\n"))}">⚠ ${warns.length} ${plural(
            warns.length, "замечание", "замечания", "замечаний")} разбора</span>`
            : '<span class="mat-rv-good">✓ суммы строк сходятся с итогом</span>'}
          ${inv.vat === "included" && rate ? `<label class="mat-rv-vat"><input type="checkbox" data-strip${
            strip ? " checked" : ""}> цены в счёте с НДС ${rate}% — в прайс записать без НДС</label>`
            : inv.vat === "excluded" ? "<span>цены в счёте без НДС</span>"
            : inv.vat === "none" ? "<span>счёт без НДС</span>" : ""}
        </div>
        ${warns.length ? `<div class="mat-rv-warns">${warns.slice(0, 6).map((w) => `<div>${esc(w)}</div>`).join("")}</div>` : ""}
        <div class="mat-rv-bulk">
          <span class="dim" data-counts></span>
          <button type="button" class="lnk" data-mark="sure">Отметить найденные</button>
          <button type="button" class="lnk" data-mark="all">Отметить все</button>
          <button type="button" class="lnk" data-mark="none">Снять все</button>
        </div>
        <div class="mat-usage-scroll mat-rv-scroll"><table class="mat-usage-tbl mat-rv-tbl">
          <thead><tr><th></th><th class="num">№</th><th>Строка счёта</th><th class="num">Кол-во</th>
            <th class="num">Цена в счёте</th><th>Позиция прайса</th>
            <th class="num" title="За единицу позиции прайса${strip ? ", без НДС" : ""}">В колонку</th>
            <th class="num">Сейчас</th></tr></thead>
          <tbody></tbody></table></div>
        <div class="pf-note bad" data-err hidden></div>
        <div class="pf-modal-foot">
          <span class="mat-form-hint mat-rv-hint">Цены лягут в колонку «${esc(src.name)}» с датой счёта,
            скрепка откроет счёт. Написание из счёта запомнится у позиции — следующий счёт
            этого поставщика узнает её сам.</span>
          <span class="grow"></span>
          <button type="button" class="btn ghost" data-no>Отмена</button>
          <button type="button" class="btn" data-ok></button></div>
      </div>`;
    document.body.appendChild(box);
    const $r = (s) => box.querySelector(s);
    const tbody = $r("tbody");

    const rowHtml = (x, i) => {
      const l = x.l;
      const [, why] = calc(x);
      const m = x.mode === "match" ? (byId[x.mid] || l.match || {}) : null;
      const badge = x.mode === "new" ? '<span class="mat-rv-b new">новая позиция</span>'
        : x.state === "sure" ? '<span class="mat-rv-b sure">найдена</span>'
        : x.state === "maybe" ? '<span class="mat-rv-b maybe">под вопросом</span>'
        : '<span class="mat-rv-b hand">выбрана</span>';
      const cur = x.mode === "match" && byId[x.mid] ? (byId[x.mid].prices || {})[src.id] : null;
      return `<tr data-i="${i}" class="${x.on ? "on" : ""}">
        <td><input type="checkbox" data-on${x.on ? " checked" : ""} aria-label="Записать строку"></td>
        <td class="num dim">${l.no}</td>
        <td class="mat-rv-line"><span>${esc(l.name)}</span>${l.code ? `<i>${esc(l.code)}</i>` : ""}</td>
        <td class="num">${l.qty != null ? esc(String(l.qty).replace(".", ",")) : ""} ${esc(l.unit || "")}</td>
        <td class="num">${money(l.price)}${l.base_price != null && unitN(l.unit) !== unitN(unitOf(x))
          ? `<i class="dim">${money(l.base_price)} за 1</i>` : ""}</td>
        <td class="mat-rv-mat">${x.picking ? `<div class="mat-rv-pick">
            <input class="pos-in" data-q placeholder="Найти в прайсе" autocomplete="off">
            <div class="mat-rv-found" data-found></div>
            <div class="mat-rv-pickfoot"><button type="button" class="lnk" data-new>Завести новую позицию</button>
              <button type="button" class="lnk" data-cancel>Отмена</button></div></div>`
          : `${badge}${m ? `<span class="mat-rv-name">${esc(m.name)}</span>` : ""}${
            m && m.unit ? `<i class="dim">за ${esc(m.unit)}</i>` : x.mode === "new" && l.unit
            ? `<i class="dim">за ${esc(l.unit)}</i>` : ""}
            <button type="button" class="lnk" data-pick>${x.mode === "new" ? "Выбрать из прайса" : "Сменить"}</button>`}</td>
        <td class="num"><input class="pos-in num" data-price inputmode="decimal" value="${
          x.price == null || x.price === "" ? "" : x.touched ? esc(x.price) : Number(x.price).toFixed(2)}"${why ? ` title="${esc(why)}"` : ""}>${
          why ? '<i class="mat-rv-why">ед.?</i>' : ""}</td>
        <td class="num dim">${cur && cur.price != null ? money(cur.price) : "—"}</td>
      </tr>`;
    };

    const found = (q) => {
      const words = q.toLowerCase().split(/[\s,;()]+/).filter((w) => w.length >= 2);
      if (!words.length) return [];
      return ROWS.map((r) => {
        const где = [r.name, r.brand, r.code].concat((r.names || []).map((n) => n.name)).join(" ").toLowerCase();
        return [words.filter((w) => где.includes(w)).length, r];
      }).filter((x) => x[0]).sort((a, b) => b[0] - a[0]).slice(0, 8).map((x) => x[1]);
    };

    const paintCounts = () => {
      const n = (f) => st.filter(f).length;
      $r("[data-counts]").textContent = `найдено ${n((x) => x.state === "sure" && x.mode === "match")} · `
        + `под вопросом ${n((x) => x.state === "maybe" && x.mode === "match")} · `
        + `без пары ${n((x) => x.mode === "new")}`;
      const on = n((x) => x.on);
      const ok = $r("[data-ok]");
      ok.textContent = on ? `Записать ${on} ${plural(on, "цену", "цены", "цен")}` : "Отметьте строки";
      ok.disabled = !on;
    };

    const wireRow = (tr) => {
      const i = Number(tr.dataset.i);
      const x = st[i];
      // Строка перерисовывается не раз (поиск, выбор) — меняем ту, что
      // сейчас в таблице, а не ту, с которой начали.
      const again = () => {
        const fresh = document.createElement("tbody");
        fresh.innerHTML = rowHtml(x, i);
        const nt = fresh.firstElementChild;
        (tbody.querySelector(`tr[data-i="${i}"]`) || tr).replaceWith(nt);
        wireRow(nt);
        paintCounts();
        return nt;
      };
      tr.querySelector("[data-on]").addEventListener("change", (e) => {
        x.on = e.target.checked;
        tr.classList.toggle("on", x.on);
        paintCounts();
      });
      tr.querySelector("[data-price]").addEventListener("input", (e) => {
        x.price = e.target.value;
        x.touched = true;
        if (!x.on) { x.on = true; tr.querySelector("[data-on]").checked = true; tr.classList.add("on"); paintCounts(); }
      });
      const pick = tr.querySelector("[data-pick]");
      if (pick) pick.addEventListener("click", () => {
        x.picking = true;
        const nt = again();
        const q = nt.querySelector("[data-q]");
        const list = nt.querySelector("[data-found]");
        const choose = (r) => {
          x.mode = "match"; x.mid = r.id; x.state = "hand"; x.picking = false; x.on = true;
          if (!x.touched) x.price = calc(x)[0];
          again();
        };
        const show = (rows) => {
          list.innerHTML = rows.length ? rows.map((r) => `<button type="button" class="mat-pop-row" data-id="${
            esc(r.id)}"><span class="mat-pop-name">${esc(r.name)}</span><span class="dim">${
            esc([r.brand, r.code, r.unit ? "за " + r.unit : ""].filter(Boolean).join(" · "))}</span></button>`).join("")
            : '<span class="dim">Ничего не нашлось</span>';
          list.querySelectorAll("[data-id]").forEach((b) => b.addEventListener("click",
            () => choose(byId[b.dataset.id])));
        };
        // Сначала — что предложил сервер, потом поиск по набранному.
        show((x.l.candidates || []).concat(x.l.match ? [x.l.match] : [])
          .map((c) => byId[c.id]).filter(Boolean));
        q.value = x.l.name;
        q.addEventListener("input", () => show(found(q.value)));
        q.addEventListener("keydown", (e) => { if (e.key === "Enter") e.preventDefault(); });
        nt.querySelector("[data-new]").addEventListener("click", () => {
          x.mode = "new"; x.mid = ""; x.state = ""; x.picking = false; x.on = true;
          if (!x.touched) x.price = calc(x)[0];
          again();
        });
        nt.querySelector("[data-cancel]").addEventListener("click", () => { x.picking = false; again(); });
        q.focus();
        q.select();
      });
    };

    const paintRows = () => {
      tbody.innerHTML = st.map(rowHtml).join("");
      tbody.querySelectorAll("tr").forEach(wireRow);
      paintCounts();
    };
    paintRows();

    const strip0 = $r("[data-strip]");
    if (strip0) strip0.addEventListener("change", (e) => {
      strip = e.target.checked;
      st.forEach((x) => { if (!x.touched) x.price = calc(x)[0]; });
      paintRows();
    });
    box.querySelectorAll("[data-mark]").forEach((b) => b.addEventListener("click", () => {
      const how = b.dataset.mark;
      st.forEach((x) => {
        x.on = how === "all" ? true : how === "none" ? false : x.mode === "match" && x.state === "sure";
      });
      paintRows();
    }));

    const close = () => { document.removeEventListener("keydown", key); box.remove(); };
    const key = (e) => { if (e.key === "Escape" && !e.target.closest("[data-q]")) close(); };
    document.addEventListener("keydown", key);
    $r("[data-no]").addEventListener("click", close);
    $r("[data-ok]").addEventListener("click", async () => {
      const err = $r("[data-err]");
      err.hidden = true;
      const lines = [];
      for (const x of st.filter((y) => y.on)) {
        const p = String(x.price ?? "").replace(/\s/g, "").replace(",", ".");
        if (!/^\d+(\.\d+)?$/.test(p)) {
          err.textContent = `Строка ${x.l.no}: «${x.price ?? ""}» — не цена`;
          err.hidden = false;
          return;
        }
        lines.push(x.mode === "new" ? { no: x.l.no, create: true, unit: x.l.unit, price: p }
          : { no: x.l.no, material_id: x.mid, price: p });
      }
      const ok = $r("[data-ok]");
      ok.disabled = true;
      try {
        const r = await AUTH.api("POST", "/invoices/" + invId + "/apply", { lines });
        close();
        await load();
        note(`Записано цен: ${r.prices}${r.created ? `, новых позиций: ${r.created}` : ""} — колонка «${
          src.name}», счёт ${inv.number ? "№ " + inv.number : inv.filename}`);
      } catch (e) {
        ok.disabled = false;
        err.textContent = e.message;
        err.hidden = false;
      }
    });
  }

  function openColMenu(btn, sid) {
    if (POP && POP.key === "m:" + sid) return closePop();
    const src = SRC.find((s) => s.id === sid);
    if (!src) return;
    const box = openPop(btn, "m:" + sid, "mat-menu", `<div class="mat-flt-h">${esc(src.name)}</div>
      <button type="button" class="mat-menu-item" data-rename>Переименовать</button>
      <button type="button" class="mat-menu-item warn" data-drop>Убрать колонку</button>`);
    box.querySelector("[data-rename]").addEventListener("click", () => {
      closePop();
      openSupplierForm(src);
    });
    box.querySelector("[data-drop]").addEventListener("click", async () => {
      closePop();
      if (!await confirmBox("Убрать колонку «" + src.name + "»?", `Колонка пропадёт из прайса
        материалов и из расчётов вместе с ценами. Счета останутся в «Файлах». Если завести
        колонку снова под тем же именем, цены и счета вернутся.`, "Убрать колонку")) return;
      try {
        await AUTH.api("DELETE", "/price-sources/" + sid);
        await load();
        note("Колонка «" + src.name + "» убрана");
      } catch (e) {
        note("Не вышло: " + e.message, true);
      }
    });
  }

  /* Колонка поставщика — новая или переименование. Имя подсказываем из
     контрагентов-поставщиков: одно написание в справочнике и в прайсе. */
  async function openSupplierForm(src) {
    const edit = !!src;
    let cnts = [];
    try { cnts = await AUTH.api("GET", "/counterparties?kind=supplier"); } catch (e) { /* без подсказки */ }
    if (!Array.isArray(cnts)) cnts = [];
    const box = document.createElement("div");
    box.className = "pf-modal";
    box.innerHTML = `
      <div class="pf-crop cnt-card mat-sup-form" role="dialog"
           aria-label="${edit ? "Переименовать колонку" : "Колонка поставщика"}">
        <h3>${edit ? "Переименовать колонку" : "Колонка поставщика"}</h3>
        ${edit ? "" : `<p class="mat-form-hint mat-sup-lead">Для цен поставщика, у которого нет
          электронного каталога: из его прайс-листов и счетов. Они прикрепляются скрепкой в
          заголовке колонки и хранятся в «Файлах».</p>`}
        <div class="fld"><label for="ms-name">Поставщик</label>
          <input id="ms-name" list="ms-cnts" autocomplete="off" value="${esc(edit ? src.name : "")}"
                 placeholder="ИП Абакумов С.А."></div>
        <datalist id="ms-cnts">${cnts.map((c) => `<option value="${esc(c.name)}">`).join("")}</datalist>
        <div class="pf-note bad" id="ms-err" hidden></div>
        <div class="pf-modal-foot"><span class="grow"></span>
          <button type="button" class="btn ghost" data-no>Отмена</button>
          <button type="button" class="btn" data-ok>${edit ? "Сохранить" : "Добавить колонку"}</button></div>
      </div>`;
    document.body.appendChild(box);
    const $f = (s) => box.querySelector(s);
    const close = () => { document.removeEventListener("keydown", key); box.remove(); };
    const save = async () => {
      const name = $f("#ms-name").value.trim();
      if (!name) {
        $f("#ms-err").textContent = "Впишите поставщика";
        $f("#ms-err").hidden = false;
        return $f("#ms-name").focus();
      }
      const cnt = cnts.find((c) => String(c.name || "").toLowerCase() === name.toLowerCase());
      $f("[data-ok]").disabled = true;
      try {
        if (edit) await AUTH.api("PATCH", "/price-sources/" + src.id, { name });
        else await AUTH.api("POST", "/price-sources", { name, counterparty_id: cnt ? cnt.id : "" });
        close();
        await load();
        note(edit ? `Колонка переименована: «${name}»` : `Колонка «${name}» добавлена в «Счета · вручную».`
          + " Счёт прикрепляется скрепкой в её заголовке");
      } catch (e) {
        $f("[data-ok]").disabled = false;
        $f("#ms-err").textContent = e.message;
        $f("#ms-err").hidden = false;
      }
    };
    const key = (e) => {
      if (e.key === "Escape") close();
      if (e.key === "Enter" && e.target.id === "ms-name") { e.preventDefault(); save(); }
    };
    document.addEventListener("keydown", key);
    box.addEventListener("click", (e) => { if (e.target === box) close(); });
    $f("[data-no]").addEventListener("click", close);
    $f("[data-ok]").addEventListener("click", save);
    $f("#ms-name").focus();
  }

  function render() {
    const host = $m("#sec-mat");
    if (!host) return;
    // Прокручивается только тело таблицы — место в нём сохраняем: после
    // правки цены страница перерисовывается и иначе прыгала бы к началу.
    const was = $m("#matBody");
    const keep = was ? [was.scrollTop, was.scrollLeft] : null;
    host.innerHTML = `
      <div class="pg">
        <div class="pg-head mat-head">
          <div class="pg-count" id="matCount"></div>
          <!-- Каталоги поставщиков — за кнопкой: обновляют их редко, а
               строки таблицы нужны на экране всегда. -->
          <button type="button" class="mat-cat-btn" id="matCatBtn" aria-controls="matCat"
            aria-expanded="false"><span class="mat-cat-state"></span>Каталоги<svg viewBox="0 0 24 24"
            aria-hidden="true"><path d="M7 10l5 5 5-5"/></svg></button>
          <div class="pg-tools">
            <label class="pg-find">${ICO.find}
              <input id="matSearch" placeholder="Название, марка, артикул"
                     value="${esc(search)}"></label>
            <span id="matLists"></span>
            ${canUp() ? `
              <label class="btn-ghost wrk-pick" for="matFile"
                     title="Прайс-лист или счёт поставщика, список материалов из 1С. Сначала файл только читается: Трейс покажет, что в нём нашлось, и спросит, куда его записать">${ICO.up}
                Загрузить</label>
              <input type="file" id="matFile" accept=".xlsx,.xlsm,.xls,.pdf,.jpg,.jpeg,.png" hidden>` : ""}
            ${can() ? `
              <button type="button" class="btn-ghost" id="matSeed"
                title="Добавить позиции из разобранных спецификаций">${
                ICO.seed}Из спек</button>
              <button type="button" class="btn-ghost btn-clear" id="matClear"
                title="Убрать все позиции прайса — спросим подтверждение">${
                ICO.trash}Очистить</button>
              <button type="button" class="btn-brand" id="matNew"
                title="Завести позицию руками: название, марка, код, завод, цены">${
                ICO.plus}Добавить</button>` : ""}
          </div>
        </div>
        <div class="pg-note mat-cat" id="matCat" hidden></div>
        <!-- Отбор по колонкам — полосой над таблицей: что спрятано, видно
             сразу, и снять можно одним щелчком, не ища воронку. -->
        <div class="mat-chips" id="matChips" hidden></div>
        <div class="pg-body" id="matBody"></div>
        <div class="pg-note" id="matNote" hidden></div>
      </div>`;
    wireHead(host);
    // Таблицу двигают мышью, как в расчёте. Тело прайса живёт до
    // следующей полной отрисовки, поэтому вешаем здесь, а не в paint.
    GRID.pan($m("#matBody"));
    wireBody($m("#matBody"));
    paint();
    catHtml = "";
    paintCatalog();
    if (keep) {
      const b = $m("#matBody");
      b.scrollTop = keep[0];
      b.scrollLeft = keep[1];
    }
  }

  function paint() {
    const body = $m("#matBody");
    if (!body) return;
    const rows = visible();
    const key = JSON.stringify([search, FLT]);
    // Отбор сменился — к началу списка; иначе (правка цены, обновление)
    // остаёмся на том же месте.
    const top = key === VIS_KEY ? body.scrollTop : 0;
    VIS_KEY = key;
    VIS = rows;
    $m("#matCount").innerHTML = rows.length === ROWS.length
      ? `<b>${ROWS.length}</b> ${plural(ROWS.length,
          "позиция", "позиции", "позиций")}`
      : `<b>${rows.length}</b> из ${ROWS.length}`;

    paintChips();
    const cat = SRC.filter((s) => s.group === "catalog").length;
    const gs = gsOf;
    const th = (k, label, cls, title) => `<th class="${cls}"${title ? ` title="${esc(title)}"` : ""}><span
      class="mat-th">${label}${fltBtn(k, label)}</span>${MATW.grip()}</th>`;
    const srcTh = (s, i) => s.kind === "supplier" ? `
      <th class="num mat-src mat-sup${gs(i)}" title="${esc(s.name)}">
        <span class="mat-sup-name">${esc(s.name)}</span>${plBadge(s)}
        <span class="mat-sup-acts">${docsBtn(s)}${canUp() ? `<button type="button"
          class="mat-hbtn" data-colmenu="${esc(s.id)}" title="Переименовать или убрать колонку">${
          ICO.dots}</button>` : ""}${fltBtn("p:" + s.id, s.name)}</span>${MATW.grip()}</th>`
      : `<th class="num mat-src${gs(i)}"${s.kind === "own"
          ? ' title="Своя цена без поставщика: вписанная здесь или запомненная из расчёта"'
          : s.live === false ? ' title="Доступа к каталогу пока нет — цену можно вписать руками, загрузить прайс-лист или счёт"' : ""}><span
          class="mat-th">${esc(s.name)}${s.kind === "own" ? ""
            : docsBtn(s)}${fltBtn("p:" + s.id, s.name)}</span>${
          plBadge(s)}${MATW.grip()}</th>`;
    const ncols = 11 + SRC.length;

    body.innerHTML = ROWS.length ? `
      <!-- Ширину считаем по колонкам, а не на глаз: было на три сотни
           пикселей больше нужного, таблица уезжала за правый край, и
           последняя цена обрезалась ровно там, куда смотрят. Слагаемые
           MAT_FIXED — ширины колонок ниже плюс минимум на название. -->
      <table class="tbl mat-tbl" style="${MATW.style(MAT_FIXED + SRC.length * MAT_SRC_W)}">
        <colgroup>${MATW.colgroup()}</colgroup>
        <!-- Шапка в два яруса: сверху группы колонок цен, как просил
             заказчик, — каталоги с ценами, которые приходят сами, и
             проработка руками по счетам; снизу сами колонки с фильтрами. -->
        <thead>
          <tr class="mat-grp">
            <!-- Разрез по краю примёрзших колонок: ячейка над номером и
                 наименованием остаётся на месте, остальные группы цен
                 уезжают под неё. -->
            <th colspan="2" class="froze"></th>
            <th colspan="5"></th>
            <th colspan="2" class="mat-gbest" title="Самая низкая цена среди всех колонок поставщиков — за единицу позиции — и чья она">Минимальная цена</th>
            ${cat ? `<th colspan="${cat}" class="mat-gstart" title="Цены приходят сами из электронных каталогов поставщиков. Цену, найденную на сайте поставщика, можно вписать и руками">Каталоги · автоматически</th>` : ""}
            <th colspan="${SRC.length - cat + 1}" class="mat-gstart" title="Проработка руками: колонка на каждого поставщика с его счетами и прайс-листами">Счета · вручную</th>
            <th></th>
          </tr>
          <tr class="mat-cols">
            <th class="mat-no" title="Номер строки в текущем отборе">№${MATW.grip()}</th>
            ${th("name", "Наименование", "mat-name")}${th("brand", "Марка", "mat-b")}${th("code", "Код", "mat-b")}
            ${th("maker", "Завод", "mat-b")}${th("unit", "Ед.", "")}
            ${th("meet", "Встреч.", "num mat-meet",
              "Сколько раз позиция встретилась в спецификациях · на скольких объектах")}
            <th class="num mat-best" title="Самая низкая цена среди колонок поставщиков — за единицу позиции">Мин. цена${MATW.grip()}</th>
            <th class="mat-who" title="Чья это цена">Поставщик${MATW.grip()}</th>
            ${SRC.map(srcTh).join("")}
            <th class="mat-plus">${canUp() ? `<button type="button" class="mat-plus-btn" data-addsrc
              title="Добавить колонку поставщика — для цен из его счетов">+</button>` : ""}</th>
            <th></th>
          </tr>
        </thead>
        <tbody>${rows.length ? gapRow(heightOf(0, rows.length))
          : `<tr><td class="mat-none" colspan="${ncols}">Ничего не нашлось —
          снимите фильтры или поищите другим написанием</td></tr>`}</tbody>
      </table>`
      : `<div class="pg-empty"><b>Прайс материалов пуст</b>Нажмите «Из спек» — Трейс
          возьмёт позиции из уже разобранных спецификаций. То, что проходило через объекты,
          и есть настоящая номенклатура конторы.</div>`;
    MATW.wire($m("table.mat-tbl", body), $m("tr.mat-cols", body), paint);
    // Номер и наименование не уезжают при прокрутке вбок, а блок
    // «Минимальная цена» догоняет их и встаёт рядом.
    GRID.freeze($m("table.mat-tbl", body), 2, ".mat-best, .mat-who");
    WIN = [0, 0];
    body.scrollTop = top;
    drawWindow(body, true);
    // Отбор сменился — у карточки другие «N из M» и соседи; позицию убрали —
    // карточка закрывается сама.
    if (CARD) paintCard();
  }

  const gsOf = (i) => i === 0 || SRC[i - 1].group !== SRC[i].group ? " mat-gstart" : "";

  function matRow(r, i) {
    const ext = matExtremes(r);
    return `
          <tr data-id="${esc(r.id)}"${CARD && CARD.id === r.id ? ' class="pc-cur"' : ""}>
            <td class="mat-no">${i + 1}</td>
            <td class="mat-name">${nameCell(r)}</td>
            <td class="pos-brand mat-b" title="${esc(r.brand)}"><span class="mat-clamp">${
              esc(r.brand)}</span></td>
            <td class="pos-brand mat-b" title="${esc(r.code)}"><span class="mat-clamp">${
              esc(r.code)}</span></td>
            <td class="pos-brand mat-b" title="${esc(r.maker)}"><span class="mat-clamp">${
              esc(r.maker)}</span></td>
            <td>${esc(r.unit)}</td>
            <td class="num dim mat-meet" title="${r.positions || 0} ${plural(r.positions || 0,
              "строка", "строки", "строк")} спецификаций на ${r.sites || 0} ${plural(
              r.sites || 0, "объекте", "объектах", "объектах")} — где именно, по щелчку">${
              r.positions ? `<button type="button" class="lnk mat-usage" data-usage>${
                r.positions}<i> · ${r.sites}</i></button>` : "—"}</td>
            ${matBest(r)}
            ${SRC.map((s, j) => priceCell(r, s, ext, gsOf(j))).join("")}
            <td class="mat-plus"></td>
            <td class="acts">${can() ? `<button type="button" class="lnk warn"
              data-rm title="Убрать позицию">×</button>` : ""}</td>
          </tr>`;
  }

  const hOf = (r) => ROW_H.get(r.id) || rowAvg;
  function heightOf(a, b) {
    let h = 0;
    for (let i = a; i < b; i++) h += hOf(VIS[i]);
    return h;
  }
  const gapRow = (h) => h > 0 ? `<tr class="mat-gap" aria-hidden="true"><td colspan="${
    9 + SRC.length}" style="height:${Math.round(h)}px"></td></tr>` : "";

  /* Какие строки отбора покрывают видимое место с запасом pad. */
  function rangeAt(body, pad) {
    const tbody = body.querySelector("table.mat-tbl tbody");
    // Сколько тела таблицы уже ушло вверх за край: по экранным координатам,
    // не зависит от того, от какого предка считается offsetTop.
    const top = tbody ? body.getBoundingClientRect().top - tbody.getBoundingClientRect().top : 0;
    const from = top - pad, to = top + body.clientHeight + pad;
    let y = 0, a = 0;
    while (a < VIS.length && y + hOf(VIS[a]) <= from) y += hOf(VIS[a++]);
    let b = a;
    while (b < VIS.length && y < to) y += hOf(VIS[b++]);
    return [a, Math.max(b, Math.min(VIS.length, a + 20))];
  }

  function drawWindow(body, force) {
    const tbody = body.querySelector("table.mat-tbl tbody");
    if (!tbody || !VIS.length) return;
    const need = rangeAt(body, WIN_NEAR);
    if (!force && need[0] >= WIN[0] && need[1] <= WIN[1]) return;
    const [a, b] = rangeAt(body, WIN_FAR);
    // Цену, вписанную и ещё не сохранённую, перерисовка не должна потерять:
    // сохраняем её, как при уходе из клетки. Просто стоящий в клетке курсор
    // возвращаем на место.
    const act = document.activeElement;
    let back = null;
    if (act && act.matches && act.matches("input") && tbody.contains(act)) {
      if (act.value !== act.defaultValue) act.blur();
      else back = { id: act.closest("tr").dataset.id, q: `[data-price="${act.dataset.price}"]` };
    }
    tbody.innerHTML = gapRow(heightOf(0, a)) + VIS.slice(a, b).map((r, k) => matRow(r, a + k)).join("")
      + gapRow(heightOf(b, VIS.length));
    WIN = [a, b];
    let sum = 0, n = 0;
    tbody.querySelectorAll("tr[data-id]").forEach((tr) => {
      const h = tr.offsetHeight;
      if (h) ROW_H.set(tr.dataset.id, h);
    });
    for (const h of ROW_H.values()) { sum += h; n++; }
    if (n) rowAvg = sum / n;
    if (back) {
      const inp = tbody.querySelector(`tr[data-id="${CSS.escape(back.id)}"] ${back.q}`);
      if (inp) inp.focus({ preventScroll: true });
    }
  }

  /* Название в строке — кнопкой: по щелчку карточка позиции справа.
     Рядом ярлык с числом — сколько у позиции других названий; сами они —
     в подсказке ярлыка и в карточке. Больше в ячейке ничего нет: раньше
     там стояли три значка и раскрывался список написаний, и строка
     раздувалась впятеро. */
  function nameCell(r) {
    const other = otherNames(r);
    const tip = other.length ? "Ещё называют:\n" + other.slice(0, 8).map((n) => "· " + n.name)
      .join("\n") + (other.length > 8 ? `\n…и ещё ${other.length - 8}` : "") : "";
    return `<button type="button" class="mat-nm" data-card title="${esc(r.name)}"><span
      class="mat-nm-t">${esc(r.name) || '<i class="dim">без названия</i>'}</span>${other.length
      ? `<span class="mat-aka" title="${esc(tip)}">${ICO.aka}${other.length}</span>` : ""}</button>`;
  }

  /* Цена от одного источника: значение, возраст цветом и день, когда её
     взяли. Правится на месте — заказчик просил вписывать вручную и туда,
     где цена уже пришла из каталога. */
  /* Крайние цены поставщиков у материала: минимальная зелёная,
     максимальная красная — от двух разных цен, и только в одной
     единице: за метр и за бухту не сравнить. «Вручную» не в счёт: это
     своя цена, а не предложение. */
  /* Блок «Минимальная цена»: самая низкая цена среди колонок поставщиков и
     чья она. Колонок поставщиков много, и сводка «сколько и у кого» нужна
     сразу, без прокрутки вбок. Цены колонок названы каждая за свою
     единицу, поэтому сравнивает сервер — за единицу позиции (mat_best);
     где единица чужая, в подсказке — как было у поставщика. */
  function matBest(r) {
    const b = r.best;
    if (!b) return `<td class="num mat-best none">—</td><td class="mat-who none"></td>`;
    const другая = b.unit && r.unit && unitN(b.unit) !== unitN(r.unit);
    const tip = `${b.who}: ${money(b.price)} за ${r.unit || "ед."}${
      другая ? ` (у поставщика ${money(b.raw)} за ${b.unit})` : ""}`;
    return `<td class="num mat-best" title="${esc(tip)}">${money(b.price)}</td>
            <td class="mat-who" title="${esc(tip)}">${esc(b.who)}</td>`;
  }

  function matExtremes(r) {
    const vals = [];
    let unit = null;
    for (const s of SRC) {
      if (s.id === "hand") continue;
      const p = r.prices[s.id];
      if (!p || p.price == null || p.price === "") continue;
      const u = String(p.unit || "").trim().toLowerCase();
      if (unit === null) unit = u;
      else if (u !== unit) return null;
      vals.push(Number(p.price));
    }
    if (vals.length < 2) return null;
    const lo = Math.min(...vals), hi = Math.max(...vals);
    return lo === hi ? null : { lo, hi };
  }

  function priceCell(r, s, ext, gs) {
    const p = r.prices[s.id];
    // Цена названа за другую единицу, чем позиция: РС продаёт трос бухтой
    // 200 м, и 3228 рядом с «28,12 за м» у Элкома читалось бы как ошибка.
    // В расчёте она уже поделена на метры; здесь — подпись «за бухту 200 м».
    const другая = !!(p && p.unit && r.unit && unitN(p.unit) !== unitN(r.unit));
    const inv = p && p.invoice_id ? INV[p.invoice_id] : null;
    const кл = p ? ageOf(p.date || p.at) : "";
    const когда = p ? (p.date ? dmy(p.date) : dmyLocal(p.at)) : "";
    const ещё = p && p.alts && p.alts.length ? "\nЕщё у поставщика:\n" + p.alts.map((a) =>
      `· ${a.label} — ${money(a.price)}`).join("\n") : "";
    const v = p && p.price != null && s.id !== "hand" ? Number(p.price) : null;
    const tone = !ext || v == null ? "" : v === ext.lo ? " lo" : v === ext.hi ? " hi" : "";
    // Класс возраста — с приставкой: голое «fresh» уже занято значком
    // свежести в верхней полосе (круг 30×30, display:grid), и ячейка со
    // свежей ценой превращалась в кружок, выпадала из таблицы и сдвигала
    // соседние колонки.
    return `<td class="num mat-p${кл ? " age-" + кл : ""}${tone}${gs || ""}" data-src="${esc(s.id)}">
      <input class="pos-in num" data-price="${esc(s.id)}"
             value="${p && p.price != null ? p.price : ""}"
             inputmode="decimal"${can() ? "" : " readonly"}>
      ${inv ? `<button type="button" class="mat-clip" data-inv="${esc(inv.id)}" title="${
        esc(`Цена из счёта ${invName(inv).replace(/^Счёт /, "")}${p.invoice_line
          ? "\nВ счёте: " + p.invoice_line : ""}\nЩелчок — открыть счёт`)}">${ICO.clip}</button>` : ""}
      ${p && p.at ? `<i class="when" title="${esc(`Цена от ${когда}, ${AGE_NAME[кл] || ""}${
        p.label ? "\n" + p.label[0].toUpperCase() + p.label.slice(1) : ""}${
        другая ? "\nЦена за «" + p.unit + "», позиция в «" + r.unit + "»" : ""}${ещё}`)}">${
        // Единица важнее даты в узкой ячейке: возраст и так виден цветом,
        // а дата остаётся в подсказке.
        другая ? `<b>${esc(String(p.unit).toLowerCase())}</b>` : esc(когда.slice(0, 5))}</i>`
        : ""}</td>`;
  }

  function note(text, bad) {
    const box = $m("#matNote");
    if (!box) return;
    box.textContent = text;
    box.classList.toggle("bad", !!bad);
    box.hidden = false;
  }

  function wireHead(host) {
    $m("#matSearch", host).addEventListener("input", (e) => {
      search = e.target.value;
      clearTimeout(searchTimer);
      searchTimer = setTimeout(paint, 150);
    });
    $m("#matCatBtn", host).addEventListener("click", () => {
      catOpen = !catOpen;
      try { localStorage.setItem(CAT_KEY, catOpen ? "1" : "0"); } catch (e) { /* без памяти */ }
      const box = $m("#matCat");
      if (box && CAT) box.hidden = !catOpen;
      paintCatBtn();
    });
    if (!can()) return;
    // Что за файл — прайс-лист, счёт или свой прайс — спросит окно загрузки.
    $m("#matFile", host).addEventListener("change", (e) => {
      const f = e.target.files && e.target.files[0];
      e.target.value = "";
      if (f) openUpload(f, null);
    });

    $m("#matClear", host).addEventListener("click", clearAll);
    $m("#matNew", host).addEventListener("click", () => openForm());

    $m("#matSeed", host).addEventListener("click", async () => {
      note("Собираю из спецификаций…");
      try {
        const r = await AUTH.api("POST", "/materials/seed", {});
        await load();
        note(`Добавлено позиций ${r.added}, написаний ${r.names}, привязано строк ${
          r.linked}` + (r.same ? `. Узнано среди заведённых: ${r.same}` : "")
          + (r.merged ? ` (из них по похожим словам: ${r.merged})` : ""));
      } catch (e) {
        note("Не вышло: " + e.message, true);
      }
    });
  }

  /* Обработчики — один раз на тело таблицы, а не на каждую кнопку каждой
     строки: строки дорисовываются порциями, и новая порция работает сразу,
     а перерисовка не навешивает десятки тысяч обработчиков заново. */
  function wireBody(body) {
    const rowOf = (el) => ROWS.find((x) => x.id === el.closest("tr").dataset.id);

    body.addEventListener("click", async (e) => {
      const t = e.target;
      let b;
      if ((b = t.closest("[data-flt]"))) {
        e.stopPropagation();
        return openFilter(b, b.dataset.flt);
      }
      if ((b = t.closest("[data-invs]"))) {
        e.stopPropagation();
        return openInvoices(b, b.dataset.invs);
      }
      if ((b = t.closest("[data-colmenu]"))) {
        e.stopPropagation();
        return openColMenu(b, b.dataset.colmenu);
      }
      if (t.closest("[data-addsrc]")) return openSupplierForm(null);
      if ((b = t.closest("[data-inv]"))) {
        e.preventDefault();
        return openInvoiceFile(b.dataset.inv, b);
      }
      if ((b = t.closest("[data-card]"))) return openCard(b.closest("tr").dataset.id);
      if ((b = t.closest("[data-usage]"))) {
        const r = rowOf(b);
        if (r) openUsage(r);
        return;
      }
      if ((b = t.closest("[data-rm]"))) {
        const tr = b.closest("tr");
        const r = ROWS.find((x) => x.id === tr.dataset.id) || {};
        if (!(await ASK.confirm(`Убрать «${r.name || r.brand}» из прайса?`))) return;
        try {
          await AUTH.api("DELETE", "/materials/" + tr.dataset.id);
          ROWS = ROWS.filter((x) => x.id !== tr.dataset.id);
          paint();
        } catch (err) {
          note("Не вышло: " + err.message, true);
        }
      }
    });

    body.addEventListener("change", async (e) => {
      const inp = e.target.closest("[data-price]");
      if (!inp) return;
      const tr = inp.closest("tr");
      if (inp.value === inp.dataset.last) return;
      inp.dataset.last = inp.value;
      inp.classList.remove("bad");
      try {
        await AUTH.api("POST", "/materials/" + tr.dataset.id + "/price",
                       { source: inp.dataset.price, price: inp.value });
        // Перечитываем: дату ставит сервер, и подсветка возраста
        // должна взяться оттуда же, а не из часов браузера.
        await load();
      } catch (err) {
        inp.classList.add("bad");
        inp.title = String(err.message);
      }
    });

    body.addEventListener("keydown", (e) => {
      if (e.key !== "Enter") return;
      const price = e.target.closest("[data-price]");
      if (price) {
        e.preventDefault();
        price.blur();
      }
    });

    // Прямо в прокрутке, без requestAnimationFrame: браузер и так шлёт её не
    // чаще кадра, а кадр в свёрнутой вкладке не наступает — окно так и
    // осталось бы пустым. Пока нарисованного хватает, drawWindow ничего не делает.
    body.addEventListener("scroll", () => drawWindow(body), { passive: true });
    window.addEventListener("resize", () => { if (body.isConnected) drawWindow(body); });
  }

  return { load, render };
})();
