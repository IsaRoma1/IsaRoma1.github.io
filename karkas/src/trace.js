/* Трейс — андроид-помощник Платформы (20.10.2026).

   Заказчик прислал плакат пары: Nexus — добрый колдун, создатель
   Платформы; Трейс — андроид-помощник, «создан, чтобы помогать, всегда
   рядом». «Трейс — это реально больше андроид, который сейчас на
   платформе нарисован»: робот с экрана персонажа теперь его. Здесь —
   сам Трейс: фигура во весь рост для экрана пары (NEXUS.open) и голова
   для карточки разбора.

   Карточка разбора — вторая просьба того же дня: «когда нажимаешь
   разобрать счёт… проходит короткая надпись „загружаю, разбираю“ — тут
   бы визуализацию, того же маскота подтащить». Трейс смотрит в лист,
   луч визора идёт по строкам, извлечённое улетает в таблицу. Сервер о
   своих этапах не рассказывает, поэтому шаги сменяются по времени и
   говорят, что Трейс делает («Ищу таблицу товаров»), а не что уже
   сделано; итог пишется по ответу сервера. Движение гаснет при
   «уменьшить движение» в системе. */
"use strict";

const TRACE = (() => {
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  /* ── фигура ──────────────────────────────────────────────────
     Вид спереди, героические пропорции: широкие наплечники, торс клином,
     узкая талия, пилоны за спиной. Левая половина задана точками, правая —
     её зеркало (ось x = 180). Броня — графит и сталь, пластины — оранжевые,
     как на плакате; на груди — треугольное ядро. В руке — голограмма
     листа: Трейс разбирает документы. id градиентов — с приставкой, чтобы
     фигура и голова в карточке жили на странице вместе. */
  const W = 360;
  const mirror = (pts) => pts.trim().split(/\s+/).map((p) => {
    const [x, y] = p.split(",").map(Number);
    return `${W - x},${y}`;
  }).join(" ");

  function parts(p) {
    const u = (k) => `url(#${p}${k})`;
    const A = u("A"), S = u("S"), D = u("D"), O = u("O"), G = "#FE5000";
    // У правой детали — зеркальный градиент, чтобы свет падал одинаково.
    const R = { [A]: u("AR"), [S]: u("SR"), [O]: u("OR") };
    const poly = (pts, fill, cls) => `<polygon points="${pts}" fill="${fill}"${cls ? ` class="${cls}"` : ""}/>`;
    const line = (pts, cls) => `<polyline points="${pts}" class="${cls}"/>`;
    const pair = (pts, fill, cls) => poly(pts, fill, cls) + poly(mirror(pts), R[fill] || fill, cls);
    const pairLine = (pts, cls) => line(pts, cls) + line(mirror(pts), cls);
    const dot = (x, y, r, cls) => `<circle cx="${x}" cy="${y}" r="${r}" class="${cls}"/>`
      + `<circle cx="${W - x}" cy="${y}" r="${r}" class="${cls}"/>`;
    const lin = (id, x2, y2, stops) => `<linearGradient id="${p}${id}" x1="${x2 < 0 ? 1 : 0}" y1="0" x2="${
      x2 < 0 ? 0 : x2}" y2="${y2}">${stops}</linearGradient>`;
    const st = (...c) => c.map(([o, col]) => `<stop offset="${o}" stop-color="${col}"/>`).join("");
    const ARMOR = st([0, "#7A8494"], [0.45, "#454B56"], [1, "#23272D"]);
    const SHADE = st([0, "#2B2F36"], [0.6, "#4A515C"], [1, "#30353C"]);
    const PLATE = st([0, "#F49155"], [0.35, "#DC6424"], [0.72, "#A4420F"], [1, "#5C2407"]);

    const defs = `<defs>
      ${lin("A", 1, 1, ARMOR)}${lin("AR", -1, 1, ARMOR)}
      ${lin("S", 1, 0, SHADE)}${lin("SR", -1, 0, SHADE)}
      ${lin("O", 1, 1, PLATE)}${lin("OR", -1, 1, PLATE)}
      <linearGradient id="${p}D" x1="0" y1="0" x2="0" y2="1">${st([0, "#2E333B"], [1, "#15171B"])}</linearGradient>
      <radialGradient id="${p}Core" cx=".5" cy=".4" r=".65">${st([0, "#FFF1E2"], [0.35, "#FF8A3D"], [1, "#C83A00"])}</radialGradient>
      <linearGradient id="${p}Visor" x1="0" y1="0" x2="1" y2="0">${st([0, "#FF5A0A"], [0.5, "#FFD2A8"], [1, "#FF5A0A"])}</linearGradient>
      <filter id="${p}Glow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="3.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
      <clipPath id="${p}VisorClip"><polygon points="158,116 202,116 198,129 162,129"/></clipPath>
    </defs>`;

    const back = pair("128,196 96,104 112,96 150,184", D) + pairLine("100,104 128,186", "tf-energy");

    const legs = pair("146,338 178,338 176,412 150,412", A)
      + pair("132,350 148,340 152,404 138,398", O)
      + pair("143,406 179,406 177,430 147,430", "#4D5562")
      + pair("145,428 179,428 185,494 141,494", A)
      + pair("154,440 172,440 175,468 156,468", O)
      + pair("128,490 186,490 192,522 122,522", D)
      + pair("130,512 190,512 192,522 122,522", "#3A3F48")
      + pairLine("158,352 156,398", "tf-seam") + pairLine("162,474 164,488", "tf-energy")
      + dot(162, 418, 3.4, "tf-node")
      + poly("142,312 218,312 210,338 150,338", D)
      + pair("126,314 150,314 152,352 130,358", S)
      + poly("172,316 188,316 184,334 176,334", G, "tf-glowfill");

    const body = poly("130,164 230,164 242,190 222,252 202,274 158,274 138,252 118,190", A)
      + pair("134,172 176,172 176,190 150,214 130,194", O)
      + pairLine("136,184 168,184", "tf-seam dark")
      + pairLine("134,172 176,172", "tf-rim")
      + pairLine("130,196 150,226 166,230", "tf-seam")
      + poly("154,272 206,272 200,300 160,300", D)
      + line("160,282 200,282", "tf-seam") + line("162,291 198,291", "tf-seam")
      + poly("146,298 214,298 208,316 152,316", "#2A2E35")
      + poly("172,300 188,300 192,307 188,314 172,314 168,307", G, "tf-glowfill")
      + pairLine("120,192 112,214 104,214", "tf-energy")
      // Ядро на груди — треугольник остриём вниз, как на плакате.
      + poly("150,192 210,192 180,246", "#16181C")
      + `<g class="tf-core" filter="url(#${p}Glow)">`
      + poly("157,197 203,197 180,238", u("Core"))
      + poly("169,204 191,204 180,224", "#3A1400")
      + poly("174,207 186,207 180,217", "#FFB27F")
      + "</g>";

    const ARM = [
      ["p", "100,214 128,210 128,272 104,276", S], ["p", "98,270 130,266 130,286 100,290", "#4D5562"],
      ["p", "94,284 134,280 138,350 98,356", O], ["p", "90,300 98,296 100,346 94,348", "#2A2E35"],
      ["l", "100,318 134,314", "tf-seam dark"],
      ["p", "100,352 138,348 140,378 104,384", D], ["l", "112,296 118,340", "tf-energy"],
      ["l", "112,362 112,380", "tf-seam"], ["l", "121,360 121,379", "tf-seam"], ["l", "130,358 130,378", "tf-seam"],
    ];
    const arm = (right) => ARM.map(([t, pts, x]) => (t === "p"
      ? poly(right ? mirror(pts) : pts, right ? R[x] || x : x)
      : line(right ? mirror(pts) : pts, x))).join("");

    const pauld = pair("86,176 140,158 154,178 148,216 104,228 84,204", O)
      + pair("90,204 148,192 148,216 104,228 84,204", "#8A3A10")
      + pair("92,180 138,166 146,180 102,194", "#F0915A")
      + pairLine("92,180 138,166", "tf-rim") + pairLine("104,196 146,184", "tf-seam dark")
      + pairLine("96,206 144,196", "tf-energy")
      + dot(104, 187, 3, "tf-node tf-blink");

    const head = poly("168,148 192,148 194,168 166,168", "#2A2E35")
      + poly("174,92 180,52 186,92", G)
      + pair("154,108 132,74 140,72 160,102", A)
      + pair("150,100 136,78 139,77 153,98", O)
      + poly("152,104 180,86 208,104 214,132 204,152 156,152 146,132", A)
      + pairLine("152,104 180,86", "tf-rim")
      + poly("162,136 198,136 194,152 166,152", "#2E333B")
      + line("170,144 190,144", "tf-energy")
      + pair("146,132 156,134 160,152 154,150", S)
      + poly("158,116 202,116 198,129 162,129", "#14161A")
      + `<g clip-path="url(#${p}VisorClip)">`
      + poly("158,116 202,116 198,129 162,129", u("Visor"), "tf-visor")
      + `<rect class="tf-scan" x="144" y="114" width="9" height="18" fill="#FFF6EC" opacity=".85"/></g>`;

    // Голограмма листа у руки: Трейс читает документы.
    const holo = `<g class="tf-sheet">
        <polygon points="280,284 314,284 326,296 326,350 280,350" class="tf-wire"/>
        <polyline points="314,284 314,296 326,296" class="tf-wire thin"/>
        <line x1="287" y1="300" x2="306" y2="300" class="tf-wire thin"/>
        <line x1="287" y1="309" x2="318" y2="309" class="tf-wire thin"/>
        <line x1="287" y1="318" x2="314" y2="318" class="tf-wire thin"/>
        <line x1="287" y1="327" x2="318" y2="327" class="tf-wire thin"/>
        <line x1="287" y1="336" x2="300" y2="336" class="tf-wire thin"/>
        <rect class="tf-sheetscan" x="278" y="284" width="50" height="3" rx="1.5"/>
      </g>
      <polyline points="262,370 281,350" class="tf-beam"/>
      <polyline points="262,370 326,350" class="tf-beam"/>`;

    return { defs, back, legs, body, arm, pauld, head, holo };
  }

  let seq = 0;
  const pfx = () => "tf" + (++seq) + "_";

  // Во весь рост — для экрана пары. Части — слоями со своей задержкой сборки.
  function figure(label) {
    const k = parts(pfx());
    return `<svg class="tf-bot" viewBox="0 0 ${W} 560" role="img" aria-label="${esc(label || "Трейс — андроид-помощник")}">
      ${k.defs}
      <ellipse class="tf-shadow" cx="180" cy="528" rx="104" ry="13"/>
      <g class="tf-part tf-back">${k.back}</g>
      <g class="tf-part tf-legs">${k.legs}</g>
      <g class="tf-part tf-body">${k.body}</g>
      <g class="tf-part tf-arm-l">${k.arm(false)}</g>
      <g class="tf-part tf-arm-r">${k.arm(true)}</g>
      <g class="tf-part tf-pauld">${k.pauld}</g>
      <g class="tf-part tf-head">${k.head}</g>
      <g class="tf-part tf-holo" aria-hidden="true">${k.holo}</g>
    </svg>`;
  }

  // Голова с шеей — для карточки разбора и других мест, где фигура не влезает.
  function head(cls) {
    const k = parts(pfx());
    return `<svg class="${cls || "tf-headonly"}" viewBox="124 46 112 126" aria-hidden="true">${k.defs}<g>${k.head}</g></svg>`;
  }

  /* ── карточка разбора ───────────────────────────────────────── */
  // [что делает — после «Трейс», шаги по очереди; последний держится до ответа сервера]
  const KIND = {
    invoice: ["разбирает счёт", ["Загружаю файл", "Читаю страницы", "Ищу поставщика и номер счёта",
      "Нахожу таблицу товаров", "Извлекаю строки, цены и НДС", "Сопоставляю с позициями"]],
    reinvoice: ["разбирает счёт заново", ["Читаю страницы", "Нахожу таблицу товаров",
      "Извлекаю строки, цены и НДС", "Сопоставляю с позициями"]],
    pricelist: ["читает прайс", ["Загружаю файл", "Открываю книгу", "Ищу таблицу и шапку",
      "Узнаю колонки цен, дату и поставщика", "Читаю строки"]],
    upload: ["читает файл", ["Загружаю файл", "Узнаю, что за файл", "Ищу таблицу и шапку", "Читаю строки"]],
    book: ["читает книгу", ["Загружаю файл", "Открываю книгу", "Ищу таблицу и шапку", "Читаю строки"]],
    spec: ["извлекает спецификацию", ["Открываю спецификацию", "Нахожу шапку таблицы",
      "Извлекаю позиции, марки и коды", "Считаю количества", "Записываю в калькуляцию"]],
    combo: ["собирает сводную", ["Открываю спецификацию", "Нахожу шапку таблицы",
      "Извлекаю позиции, марки и коды"]],
    vdc: ["разбирает ВДЦ", ["Загружаю файл", "Ищу таблицу работ", "Извлекаю строки и суммы", "Сверяю с итогами"]],
    klk: ["разбирает КЛК", ["Загружаю файл", "Читаю страницы", "Ищу таблицу работ", "Извлекаю строки и суммы",
      "Сверяю с итогами документа"]],
    prices: ["читает цены объекта", ["Загружаю файл", "Ищу таблицы цен", "Узнаю дату, НДС и чьи это цены"]],
    contract: ["читает договор", ["Открываю договор", "Ищу сроки и порядок оплаты", "Нахожу гарантии и штрафы",
      "Раскладываю условия по карточкам"]],
    project: ["разбирает проект", ["Открываю проект", "Читаю листы", "Ищу принципиальные схемы",
      "Собираю этажные щиты", "Составляю кабельный журнал", "Раскладываю квартиры по секциям"]],
    ptobook: ["читает расчёт ПТО", ["Загружаю книгу", "Ищу колонку «Расчёт ПТО»", "Сверяю со спецификацией"]],
    works: ["читает расценки", ["Загружаю файл", "Читаю разделы", "Сверяю расценки с прежними"]],
    demo: ["показывает разбор", ["Читаю страницы", "Ищу поставщика и номер счёта",
      "Нахожу таблицу товаров", "Извлекаю строки, цены и НДС"]],
  };
  const STEP_MS = { project: 4200, combo: 2600, contract: 3000 };
  const MIN_BUSY = 1400;                          // мгновенный ответ не мигает карточкой
  // Что «вылетает» из листа в таблицу — значки, а не выдуманные данные.
  const BITS = ["₽", "№", "шт", "м", "НДС", "∑", "%", "кВт", "мм²", "м²"];

  const reduced = () => typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

  let dock = null;
  function host() {
    if (dock && dock.isConnected) return dock;
    dock = document.createElement("div");
    dock.className = "tr-dock";
    document.body.appendChild(dock);
    return dock;
  }

  const ICO = {
    ok: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
    bad: '<path d="M7 7l10 10M17 7 7 17"/>',
    x: '<path d="M7 7l10 10M17 7 7 17"/>',
  };
  const ic = (k) => `<svg viewBox="0 0 24 24" aria-hidden="true">${ICO[k]}</svg>`;
  const clock = (ms) => {
    const s = Math.floor(ms / 1000);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  };

  /* start({ kind, file, title, steps }) → ручка: step(текст), upload(%),
     progress(i, n, подпись), done(итог), fail(ошибка), close(). */
  function start(opts) {
    const o = opts || {};
    const [what, steps] = KIND[o.kind] || KIND.upload;
    const list = o.steps || steps;
    const h = { t0: Date.now(), i: 0, over: false, held: false, list, ms: STEP_MS[o.kind] || 2300 };
    const el = document.createElement("div");
    el.className = "tr-card busy";
    el.innerHTML = `
      <div class="tr-art" aria-hidden="true">
        ${head("tr-head")}
        <span class="tr-ray"></span>
        <span class="tr-doc"><i></i><i></i><i></i><i></i><i></i><b class="tr-docscan"></b><em class="tr-mark"></em></span>
        <span class="tr-bits">${BITS.slice(0, 5).map((b, n) => `<i style="--n:${n}">${
          BITS[(n + seq) % BITS.length]}</i>`).join("")}</span>
      </div>
      <div class="tr-txt" role="status" aria-live="polite">
        <div class="tr-who"><b>Трейс</b> <span>${esc(o.title || what)}</span></div>
        <div class="tr-file" title="${esc(o.file || "")}">${esc(o.file || "")}</div>
        <div class="tr-step"><span class="tr-ic"></span><span class="tr-say"></span><time class="tr-time">0:00</time></div>
      </div>
      <button type="button" class="tr-x" aria-label="Скрыть">${ic("x")}</button>
      <div class="tr-bar"><i></i></div>`;
    h.el = el;
    host().appendChild(el);
    if (!o.file) el.classList.add("nofile");
    el.querySelector(".tr-x").addEventListener("click", () => close(h));
    setStep(h, list[0]);
    h.tick = setInterval(() => {
      const t = el.querySelector(".tr-time");
      if (t) t.textContent = clock(Date.now() - h.t0);
    }, 1000);
    plan(h);
    void el.offsetWidth;                          // появление — переходом из начального положения
    el.classList.add("in");

    return {
      step: (text) => { if (h.over) return; h.held = true; clearTimeout(h.next); setStep(h, text); },
      upload: (pct) => upload(h, pct),
      progress: (i, n, label) => progress(h, i, n, label),
      done: (text) => finish(h, true, text),
      fail: (text) => finish(h, false, text),
      close: () => close(h),
    };
  }

  function setStep(h, text) {
    const s = h.el.querySelector(".tr-say");
    if (!s || s.textContent === text) return;
    s.textContent = text;
    s.classList.remove("on");
    void s.offsetWidth;                           // перезапустить появление
    s.classList.add("on");
  }

  // Следующий шаг — по времени; последний держится до ответа.
  function plan(h) {
    clearTimeout(h.next);
    if (h.over || h.held || h.i >= h.list.length - 1) return;
    h.next = setTimeout(() => {
      if (h.over || h.held) return;
      h.i++;
      setStep(h, h.list[h.i]);
      plan(h);
    }, h.ms);
  }

  function bar(h, pct) {
    const b = h.el.querySelector(".tr-bar");
    b.classList.toggle("known", pct !== null);
    b.firstElementChild.style.width = pct === null ? "" : Math.max(3, Math.min(100, pct)) + "%";
  }

  // Загрузка с известным процентом (XMLHttpRequest): шаги ждут, пока файл не уйдёт.
  function upload(h, pct) {
    if (h.over) return;
    if (pct < 100) {
      clearTimeout(h.next);
      h.held = true;
      setStep(h, `Загружаю файл · ${pct}%`);
      bar(h, pct);
      return;
    }
    h.held = false;
    bar(h, null);
    h.i = Math.min(Math.max(h.i, 1), h.list.length - 1);
    setStep(h, h.list[h.i]);
    plan(h);
  }

  // Несколько файлов подряд: «2 из 5 · имя», полоса — доля, шаги — с начала.
  // Один файл — просто его имя, полоса бежит.
  function progress(h, i, n, label) {
    if (h.over) return;
    const f = h.el.querySelector(".tr-file");
    f.textContent = n > 1 ? `${i + 1} из ${n}${label ? " · " + label : ""}` : label || "";
    f.title = label || "";
    h.el.classList.toggle("nofile", !f.textContent);
    bar(h, n > 1 ? Math.round((i / n) * 100) : null);
    h.held = false;
    h.i = 0;
    setStep(h, h.list[0]);
    plan(h);
  }

  function finish(h, ok, text) {
    if (h.over) return;
    h.over = true;
    clearTimeout(h.next);
    const wait = Math.max(0, MIN_BUSY - (Date.now() - h.t0));
    setTimeout(() => {
      clearInterval(h.tick);
      if (!h.el.isConnected) return;
      h.el.classList.remove("busy");
      h.el.classList.add(ok ? "ok" : "bad");
      h.el.querySelector(".tr-ic").innerHTML = ic(ok ? "ok" : "bad");
      h.el.querySelector(".tr-mark").innerHTML = ic(ok ? "ok" : "bad");
      bar(h, 100);
      const say = h.el.querySelector(".tr-say");
      say.textContent = text || (ok ? "Готово" : "Не получилось");
      say.title = say.textContent;
      h.hide = setTimeout(() => close(h), ok ? 3200 : 9000);
    }, wait);
  }

  function close(h) {
    h.over = true;
    clearTimeout(h.next);
    clearTimeout(h.hide);
    clearInterval(h.tick);
    const el = h.el;
    if (!el || !el.isConnected) return;
    if (reduced()) { el.remove(); return; }
    el.classList.add("out");
    setTimeout(() => el.remove(), 260);
  }

  /* run(opts, работа, итог) — карточка на время работы: работа — промис
     или функция от ручки (для upload/progress). Итог — текст по
     результату. Ошибка пробрасывается дальше: её разбирает вызывающий. */
  async function run(opts, work, summary) {
    const h = start(opts);
    try {
      const r = await (typeof work === "function" ? work(h) : work);
      let text = "";
      try { text = summary ? summary(r) || "" : ""; } catch (e) { /* итог — не главное */ }
      h.done(text);
      return r;
    } catch (e) {
      h.fail(e && e.message ? "Не получилось: " + e.message : "Не получилось");
      throw e;
    }
  }

  // Показать разбор без файла — с экрана пары.
  function demo() {
    const h = start({ kind: "demo", file: "Пример: счёт поставщика.pdf" });
    setTimeout(() => h.done("Так выглядит разбор любого файла в Платформе"), 9400);
  }

  return { figure, head, start, run, demo };
})();
