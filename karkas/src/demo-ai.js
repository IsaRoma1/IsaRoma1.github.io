/* Демо-сборка: «Обработка чертежей» и «Шаблонное ТКП» (27.10.2026).

   Оба раздела — витрина того, что умеет платформа, на моках: сервер не
   вызывается, файл никуда не уходит, всё считается здесь же из
   вымышленных данных. Задача — показать сценарий целиком: загрузили
   чертёж → распознали элементы → получили спецификацию и объёмы;
   выбрали заказчика и работы → получили готовое ТКП по шаблону.

   Данные обезличены: объект, заказчик и цены — вымышленные. */
"use strict";

const DEMO_AI = (() => {
  const $d = (s, r) => (r || document).querySelector(s);
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const money = (n) => Math.round(n).toLocaleString("ru-RU") + " ₽";
  const num = (n) => n.toLocaleString("ru-RU", { maximumFractionDigits: 1 });
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  function download(name, text, type) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob(["﻿" + text], { type }));
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  /* ══ Обработка чертежей ═════════════════════════════════════ */

  const SAMPLES = [
    { id: "eom", file: "ЭОМ_План_2этажа_Лист5.pdf", title: "Электроосвещение и розеточная сеть, 2 этаж", sheet: "ЭОМ, лист 5", pages: 1 },
    { id: "ss", file: "СС_Слаботочные_системы_Лист3.dwg", title: "Слаботочные системы, 2 этаж", sheet: "СС, лист 3", pages: 1 },
    { id: "ov", file: "ОВ_Вентиляция_План_Лист2.pdf", title: "Вентиляция, план 2 этажа", sheet: "ОВ, лист 2", pages: 1 },
  ];

  /* Что «нашли» на листе: тип элемента → цвет метки, позиция спецификации. */
  const KINDS = {
    lamp: { name: "Светильник LED 36 Вт, 600×600", unit: "шт", color: "#F5B031", grp: "Освещение", price: 2450 },
    lampE: { name: "Светильник аварийный «Выход»", unit: "шт", color: "#E5484D", grp: "Освещение", price: 3100 },
    sock: { name: "Розетка 2P+E 16 А, скрытая", unit: "шт", color: "#2F9BFF", grp: "Розеточная сеть", price: 380 },
    sockD: { name: "Розетка двойная 2P+E 16 А", unit: "шт", color: "#2563EB", grp: "Розеточная сеть", price: 520 },
    sw: { name: "Выключатель одноклавишный", unit: "шт", color: "#22B07D", grp: "Освещение", price: 290 },
    box: { name: "Щит распределительный ЩР-2, 24 мод.", unit: "шт", color: "#8B7CF8", grp: "Щиты", price: 14800 },
  };

  /* План этажа: помещения и элементы в координатах SVG 900×560. */
  const ROOMS = [
    { x: 20, y: 20, w: 300, h: 240, n: "201", t: "Офис", a: 64.8 },
    { x: 320, y: 20, w: 260, h: 240, n: "202", t: "Переговорная", a: 52.0 },
    { x: 580, y: 20, w: 300, h: 240, n: "203", t: "Офис", a: 64.8 },
    { x: 20, y: 330, w: 220, h: 210, n: "204", t: "Кабинет", a: 38.5 },
    { x: 240, y: 330, w: 180, h: 210, n: "205", t: "Серверная", a: 30.2 },
    { x: 420, y: 330, w: 200, h: 210, n: "206", t: "С/у", a: 22.4 },
    { x: 620, y: 330, w: 260, h: 210, n: "207", t: "Кухня-столовая", a: 46.1 },
    { x: 20, y: 260, w: 860, h: 70, n: "208", t: "Коридор", a: 58.6 },
  ];

  function placeItems() {
    const it = [];
    const grid = (r, cols, rows, k) => {
      for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++)
        it.push({ k, x: r.x + (r.w / cols) * (i + .5), y: r.y + (r.h / rows) * (j + .5) });
    };
    const wall = (r, k, n) => {
      for (let i = 0; i < n; i++) it.push({ k, x: r.x + 14 + ((r.w - 28) / Math.max(n - 1, 1)) * i, y: r.y + r.h - 10 });
    };
    ROOMS.forEach((r, i) => {
      if (r.n === "208") { for (let c = 0; c < 8; c++) it.push({ k: "lamp", x: r.x + 55 + c * 107, y: r.y + 35 }); return; }
      const big = r.w * r.h > 60000;
      grid(r, big ? 3 : 2, 2, "lamp");
      wall(r, i % 2 ? "sockD" : "sock", big ? 4 : 2);
      it.push({ k: "sw", x: r.x + 12, y: r.y + r.h - 34 });
    });
    it.push({ k: "lampE", x: 300, y: 295 }, { k: "lampE", x: 620, y: 295 }, { k: "lampE", x: 860, y: 295 });
    it.push({ k: "box", x: 330, y: 360 });
    return it;
  }
  const ITEMS = placeItems();

  /* Кабель — по трассам: длина в метрах от длины линий на листе (масштаб 1:100). */
  const CABLES = [
    { name: "Кабель ВВГнг(А)-LS 3×1,5", grp: "Кабель", unit: "м", qty: 412, price: 78 },
    { name: "Кабель ВВГнг(А)-LS 3×2,5", grp: "Кабель", unit: "м", qty: 356, price: 118 },
    { name: "Кабель ВВГнг(А)-LS 5×10", grp: "Кабель", unit: "м", qty: 48, price: 690 },
    { name: "Труба гофрированная ПВХ 20 мм", grp: "Кабель", unit: "м", qty: 640, price: 21 },
    { name: "Лоток перфорированный 100×50", grp: "Кабель", unit: "м", qty: 86, price: 540 },
  ];

  const DRW = { stage: "idle", sample: SAMPLES[0], shown: {}, tab: "spec" };

  function specRows() {
    const cnt = {};
    ITEMS.forEach((i) => { cnt[i.k] = (cnt[i.k] || 0) + 1; });
    const rows = Object.keys(KINDS).map((k) => ({ ...KINDS[k], qty: cnt[k] || 0, k }));
    return rows.concat(CABLES);
  }

  function drwPlan() {
    const on = DRW.stage === "done" || DRW.stage === "scan";
    const rooms = ROOMS.map((r) => `
      <rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" class="dp-room"/>
      <text x="${r.x + 10}" y="${r.y + 20}" class="dp-rn">${r.n}</text>
      <text x="${r.x + 10}" y="${r.y + 34}" class="dp-rt">${esc(r.t)} · ${num(r.a)} м²</text>`).join("");
    const items = ITEMS.map((i, n) => {
      const c = KINDS[i.k].color;
      const hid = DRW.shown[i.k] === false ? " off" : "";
      const sym = i.k.startsWith("lamp")
        ? `<circle cx="${i.x}" cy="${i.y}" r="7" class="dp-sym"/><path d="M${i.x - 5} ${i.y - 5}l10 10M${i.x + 5} ${i.y - 5}l-10 10" class="dp-sym"/>`
        : i.k === "box" ? `<rect x="${i.x - 14}" y="${i.y - 8}" width="28" height="16" class="dp-sym"/>`
        : i.k === "sw" ? `<circle cx="${i.x}" cy="${i.y}" r="4" class="dp-sym"/><path d="M${i.x} ${i.y}l8 -8" class="dp-sym"/>`
        : `<path d="M${i.x - 7} ${i.y}a7 7 0 0 1 14 0" class="dp-sym"/><path d="M${i.x} ${i.y - 7}v-5" class="dp-sym"/>`;
      const mark = on ? `<rect x="${i.x - 12}" y="${i.y - 12}" width="24" height="24" rx="5" class="dp-mark${hid}"
        style="--c:${c};animation-delay:${(n * 14) % 900}ms"/>` : "";
      return sym + mark;
    }).join("");
    const cab = on && DRW.shown.cable !== false
      ? `<path d="M330 360 V295 H860 M330 295 V140 M80 295 V140 H860 M330 360 H130 V430 M330 360 H520 V430 M620 295 V430 H750" class="dp-cab"/>` : "";
    return `<svg viewBox="0 0 900 560" class="dp-svg">
      <rect x="20" y="20" width="860" height="520" class="dp-wall"/>${rooms}${cab}${items}
      ${DRW.stage === "scan" ? '<rect x="0" y="0" width="900" height="6" class="dp-beam"/>' : ""}
    </svg>`;
  }

  function drwStages(active) {
    const st = ["Чтение листа и масштаба", "Поиск помещений и площадей", "Распознавание условных обозначений", "Трассы и длины кабеля", "Сверка с прайсом и спецификация"];
    return `<ol class="da-steps">${st.map((s, i) => `<li class="${i < active ? "ok" : i === active ? "go" : ""}">${s}</li>`).join("")}</ol>`;
  }

  function drwRender() {
    const sec = $d("#sec-drw");
    if (!sec) return;
    const s = DRW.sample;
    const rows = specRows();
    const total = rows.reduce((a, r) => a + r.qty * r.price, 0);
    const pcs = ITEMS.length;
    const left = `
      <div class="da-card">
        <div class="da-h">Чертежи</div>
        <label class="da-drop" id="drwDrop">
          <input type="file" accept=".pdf,.dwg,.dxf,.png,.jpg" hidden id="drwFile">
          <b>Перетащите чертёж сюда</b><span>PDF, DWG, DXF, скан — или выберите пример ниже</span>
        </label>
        <div class="da-list">${SAMPLES.map((x) => `
          <button type="button" class="da-file${x.id === s.id ? " on" : ""}" data-smp="${x.id}">
            <i>${x.file.split(".").pop().toUpperCase()}</i><span><b>${esc(x.title)}</b><small>${esc(x.file)}</small></span>
          </button>`).join("")}</div>
      </div>`;
    let body;
    if (DRW.stage === "idle") {
      body = `<div class="da-card da-empty"><b>${esc(s.title)}</b><span>${esc(s.sheet)} · масштаб 1:100</span>
        <div class="dp-wrap dim">${drwPlan()}</div>
        <button type="button" class="btn-brand" id="drwRun">Распознать чертёж</button></div>`;
    } else if (DRW.stage === "scan") {
      body = `<div class="da-card"><div class="da-h">Обработка: ${esc(s.file)}</div>
        <div class="dp-wrap">${drwPlan()}</div>${drwStages(DRW.step)}</div>`;
    } else {
      const legend = Object.keys(KINDS).map((k) => {
        const q = ITEMS.filter((i) => i.k === k).length;
        return `<button type="button" class="dl-chip${DRW.shown[k] === false ? " off" : ""}" data-k="${k}" style="--c:${KINDS[k].color}">${esc(KINDS[k].name.split(",")[0])} <b>${q}</b></button>`;
      }).join("") + `<button type="button" class="dl-chip${DRW.shown.cable === false ? " off" : ""}" data-k="cable" style="--c:#F04E8E">Трассы кабеля</button>`;
      const grp = {};
      rows.forEach((r) => { (grp[r.grp] = grp[r.grp] || []).push(r); });
      const spec = Object.keys(grp).map((g) => `<tr class="da-g"><td colspan="5">${esc(g)}</td></tr>` + grp[g].map((r) => `
        <tr><td>${esc(r.name)}</td><td>${esc(r.unit)}</td><td class="n">${num(r.qty)}</td><td class="n">${money(r.price)}</td><td class="n">${money(r.qty * r.price)}</td></tr>`).join("")).join("");
      const vol = ROOMS.map((r) => {
        const inR = ITEMS.filter((i) => i.x > r.x && i.x < r.x + r.w && i.y > r.y && i.y < r.y + r.h);
        const c = (k) => inR.filter((i) => i.k.startsWith(k)).length;
        return `<tr><td>${r.n}</td><td>${esc(r.t)}</td><td class="n">${num(r.a)}</td><td class="n">${c("lamp")}</td><td class="n">${c("sock")}</td><td class="n">${c("sw")}</td></tr>`;
      }).join("");
      body = `
        <div class="da-kpi">
          <div><b>${pcs}</b><span>элементов найдено</span></div>
          <div><b>${ROOMS.length}</b><span>помещений · ${num(ROOMS.reduce((a, r) => a + r.a, 0))} м²</span></div>
          <div><b>${num(CABLES.slice(0, 3).reduce((a, c) => a + c.qty, 0))} м</b><span>кабеля по трассам</span></div>
          <div><b>98,4%</b><span>уверенность распознавания</span></div>
          <div><b>${money(total)}</b><span>материалы по прайсу</span></div>
        </div>
        <div class="da-card"><div class="da-h">${esc(s.title)} <small>${esc(s.sheet)} · обработан за 14 с</small></div>
          <div class="dl-legend">${legend}</div>
          <div class="dp-wrap">${drwPlan()}</div></div>
        <div class="da-card">
          <div class="da-tabs">
            <button type="button" class="chip${DRW.tab === "spec" ? " on" : ""}" data-tab="spec">Спецификация</button>
            <button type="button" class="chip${DRW.tab === "vol" ? " on" : ""}" data-tab="vol">Объёмы по помещениям</button>
            <span class="grow"></span>
            <button type="button" class="btn-ghost" id="drwCsv">Выгрузить в Excel</button>
            <button type="button" class="btn-brand" id="drwTkp">Сформировать ТКП →</button>
          </div>
          ${DRW.tab === "spec"
            ? `<table class="da-t"><thead><tr><th>Наименование</th><th>Ед.</th><th class="n">Кол-во</th><th class="n">Цена</th><th class="n">Сумма</th></tr></thead><tbody>${spec}</tbody>
               <tfoot><tr><td colspan="4">Итого материалы</td><td class="n">${money(total)}</td></tr></tfoot></table>`
            : `<table class="da-t"><thead><tr><th>№</th><th>Помещение</th><th class="n">Площадь, м²</th><th class="n">Светильники</th><th class="n">Розетки</th><th class="n">Выключатели</th></tr></thead><tbody>${vol}</tbody></table>`}
        </div>`;
    }
    sec.innerHTML = `<div class="da-wrap">
      <div class="da-note">Демонстрация: чертёж разбирается на элементы, по ним собираются спецификация и объёмы, цены — из прайса материалов.</div>
      <div class="da-grid">${left}<div class="da-main">${body}</div></div></div>`;
  }

  async function drwRun() {
    DRW.stage = "scan";
    for (DRW.step = 0; DRW.step < 5; DRW.step++) { drwRender(); await wait(650); }
    DRW.stage = "done";
    drwRender();
  }

  function drwWire() {
    const sec = $d("#sec-drw");
    sec.addEventListener("click", (e) => {
      const t = e.target.closest("button");
      if (!t || DRW.stage === "scan") return;
      if (t.dataset.smp) { DRW.sample = SAMPLES.find((x) => x.id === t.dataset.smp); DRW.stage = "idle"; drwRender(); }
      else if (t.id === "drwRun") drwRun();
      else if (t.dataset.k) { DRW.shown[t.dataset.k] = DRW.shown[t.dataset.k] === false; drwRender(); }
      else if (t.dataset.tab) { DRW.tab = t.dataset.tab; drwRender(); }
      else if (t.id === "drwCsv") {
        const csv = ["Наименование;Ед.;Кол-во;Цена;Сумма"].concat(specRows().map((r) =>
          [r.name, r.unit, r.qty, r.price, r.qty * r.price].join(";"))).join("\n");
        download("Спецификация_" + DRW.sample.id + ".csv", csv, "text/csv");
      } else if (t.id === "drwTkp") { TKP.fromDrw = true; TKP.stage = "form"; go("tkp"); }
    });
    const pick = (f) => {
      if (!f) return;
      DRW.sample = { id: "own", file: f.name, title: f.name.replace(/\.[^.]+$/, ""), sheet: "загружен вручную" };
      drwRun();
    };
    sec.addEventListener("change", (e) => { if (e.target.id === "drwFile") pick(e.target.files[0]); });
    sec.addEventListener("dragover", (e) => { if (e.target.closest("#drwDrop")) { e.preventDefault(); e.target.closest("#drwDrop").classList.add("hov"); } });
    sec.addEventListener("dragleave", (e) => { const d = e.target.closest("#drwDrop"); if (d) d.classList.remove("hov"); });
    sec.addEventListener("drop", (e) => {
      if (!e.target.closest("#drwDrop")) return;
      e.preventDefault();
      if (DRW.stage !== "scan") pick(e.dataTransfer.files[0]);
    });
  }

  /* ══ Шаблонное ТКП ═════════════════════════════════════════ */

  const CUSTOMERS = [
    { n: "ООО «Девелопмент-Плюс»", c: "Смирнов А.В., руководитель проекта" },
    { n: "АО «Городские Инвестиции»", c: "Кравец И.Н., главный инженер" },
    { n: "ООО «ТехноПарк Восток»", c: "Ушаков Р.С., директор по строительству" },
  ];
  const OBJECTS = ["БЦ «Северная звезда», 2 этаж, 377 м²", "ЖК «Озёрный», корпус 3, МОП", "Логистический комплекс, АБК"];
  const TEMPLATES = [
    { id: "full", n: "ТКП под ключ (материалы + работы)" },
    { id: "work", n: "ТКП на монтажные работы" },
    { id: "short", n: "Краткое коммерческое предложение" },
  ];
  const WORKS = [
    { id: "eom", n: "Электромонтаж: освещение и розеточная сеть", mat: 1192000, wrk: 684000, days: 25 },
    { id: "shk", n: "Сборка и монтаж щитов", mat: 312000, wrk: 96000, days: 10 },
    { id: "ss", n: "Слаботочные системы (СКС, СОТ, СКУД)", mat: 486000, wrk: 318000, days: 18 },
    { id: "pnr", n: "Пусконаладка и электроизмерения", mat: 0, wrk: 142000, days: 5 },
    { id: "id", n: "Исполнительная документация", mat: 0, wrk: 64000, days: 5 },
  ];

  const TKP = { stage: "form", cus: 0, obj: 0, tpl: "full", works: { eom: true, shk: true, pnr: true, id: true }, vat: true, margin: 12, adv: 30, fromDrw: false, no: 148 };

  function tkpCalc() {
    const ws = WORKS.filter((w) => TKP.works[w.id]);
    const k = 1 + TKP.margin / 100;
    const rows = ws.map((w) => ({
      ...w,
      mat: TKP.tpl === "work" ? 0 : Math.round(w.mat * k / 100) * 100,
      wrk: Math.round(w.wrk * k / 100) * 100,
    }));
    const sum = rows.reduce((a, r) => a + r.mat + r.wrk, 0);
    const days = rows.reduce((a, r) => Math.max(a, r.days), 0) + Math.round(rows.reduce((a, r) => a + r.days, 0) * .35);
    return { rows, sum, vat: TKP.vat ? sum * 20 / 120 : 0, days };
  }

  function tkpDoc() {
    const c = CUSTOMERS[TKP.cus];
    const { rows, sum, vat, days } = tkpCalc();
    const today = new Date().toLocaleDateString("ru-RU");
    const short = TKP.tpl === "short";
    const tr = rows.map((r, i) => `<tr><td>${i + 1}</td><td>${esc(r.n)}</td>
      ${TKP.tpl === "work" ? "" : `<td class="n">${r.mat ? money(r.mat) : "—"}</td>`}
      <td class="n">${money(r.wrk)}</td><td class="n">${money(r.mat + r.wrk)}</td></tr>`).join("");
    return `<div class="tk-doc" id="tkDoc">
      <div class="tk-head">
        <div class="tk-logo"><img src="src/brand-mark.svg" alt=""><span><b>ООО «Северный Монтаж»</b><small>ИНН 0000000000 · info@sever-montazh.demo · +7 (000) 000-00-00</small></span></div>
        <div class="tk-meta">Исх. № ТКП-${TKP.no}/26<br>от ${today}</div>
      </div>
      <div class="tk-to">${esc(c.n)}<br><small>${esc(c.c)}</small></div>
      <h2>Технико-коммерческое предложение</h2>
      <p class="tk-sub">на выполнение работ по объекту: <b>${esc(OBJECTS[TKP.obj])}</b></p>
      <p>Благодарим за приглашение к участию. ООО «Северный Монтаж» предлагает выполнить комплекс работ
      ${TKP.tpl === "work" ? "из материалов Заказчика" : "под ключ — с поставкой материалов и оборудования"} на следующих условиях.</p>
      ${TKP.fromDrw ? `<p class="tk-src">Объёмы определены по рабочей документации: ЭОМ, лист 5 — ${ITEMS.length} элементов, ${num(CABLES.slice(0, 3).reduce((a, x) => a + x.qty, 0))} м кабеля.</p>` : ""}
      <h3>1. Стоимость работ</h3>
      <table class="tk-t"><thead><tr><th>№</th><th>Состав работ</th>${TKP.tpl === "work" ? "" : '<th class="n">Материалы</th>'}<th class="n">Работы</th><th class="n">Итого</th></tr></thead>
        <tbody>${tr || `<tr><td colspan="5" class="tk-none">Отметьте виды работ слева</td></tr>`}</tbody>
        <tfoot><tr><td colspan="${TKP.tpl === "work" ? 3 : 4}">Итого${TKP.vat ? ", в т.ч. НДС 20% — " + money(vat) : " (НДС не облагается)"}</td><td class="n">${money(sum)}</td></tr></tfoot></table>
      ${short ? "" : `
      <h3>2. Сроки</h3>
      <p>Срок выполнения — <b>${days} рабочих дней</b> с даты получения аванса и допуска на объект. График — по согласованию с Заказчиком.</p>
      <h3>3. Условия оплаты</h3>
      <p>Аванс ${TKP.adv}% — в течение 5 банковских дней после подписания договора; далее — ежемесячно по актам КС-2/КС-3 за вычетом аванса пропорционально.</p>
      <h3>4. Гарантии</h3>
      <p>Гарантия на выполненные работы — 24 месяца, на оборудование — по гарантии производителя. Исполнительная документация — в составе сдачи.</p>
      <h3>5. Опыт</h3>
      <p>Более 120 завершённых объектов: бизнес-центры, жилые комплексы, складская и промышленная недвижимость. Собственное щитовое производство.</p>`}
      <p class="tk-valid">Предложение действительно 30 календарных дней.</p>
      <div class="tk-sign"><span>Генеральный директор</span><span class="tk-line"></span><span>Д.А. Орлов</span></div>
    </div>`;
  }

  function tkpRender() {
    const sec = $d("#sec-tkp");
    if (!sec) return;
    const opt = (arr, cur, lab) => arr.map((x, i) => `<option value="${i}"${i === cur ? " selected" : ""}>${esc(lab(x))}</option>`).join("");
    const { sum } = tkpCalc();
    const form = `<div class="da-card tk-form">
      <div class="da-h">Параметры</div>
      <label>Шаблон<select data-f="tpl">${TEMPLATES.map((t) => `<option value="${t.id}"${t.id === TKP.tpl ? " selected" : ""}>${esc(t.n)}</option>`).join("")}</select></label>
      <label>Заказчик<select data-f="cus">${opt(CUSTOMERS, TKP.cus, (x) => x.n)}</select></label>
      <label>Объект<select data-f="obj">${opt(OBJECTS, TKP.obj, (x) => x)}</select></label>
      <div class="tk-lab">Состав работ</div>
      ${WORKS.map((w) => `<label class="tk-chk"><input type="checkbox" data-w="${w.id}"${TKP.works[w.id] ? " checked" : ""}> ${esc(w.n)}</label>`).join("")}
      <div class="tk-row">
        <label>Наценка, %<input type="number" min="0" max="50" data-f="margin" value="${TKP.margin}"></label>
        <label>Аванс, %<input type="number" min="0" max="100" data-f="adv" value="${TKP.adv}"></label>
      </div>
      <label class="tk-chk"><input type="checkbox" data-f="vat"${TKP.vat ? " checked" : ""}> Цены с НДС 20%</label>
      ${TKP.fromDrw ? '<div class="tk-from">Объёмы подтянуты из «Обработки чертежей»</div>' : ""}
      <div class="tk-total"><span>Сумма предложения</span><b>${money(sum)}</b></div>
      <button type="button" class="btn-brand" id="tkGen">${TKP.stage === "doc" ? "Обновить ТКП" : "Сформировать ТКП"}</button>
    </div>`;
    let right;
    if (TKP.stage === "gen") {
      right = `<div class="da-card tk-wait"><div class="tk-spin"></div><b>Собираю ТКП по шаблону…</b>
        <span>Подставляю реквизиты, считаю стоимость и сроки, оформляю разделы</span></div>`;
    } else if (TKP.stage === "doc") {
      right = `<div class="tk-bar"><span>Готово: ТКП-${TKP.no}/26 · ${esc(TEMPLATES.find((t) => t.id === TKP.tpl).n)}</span><span class="grow"></span>
        <button type="button" class="btn-ghost" id="tkPrint">Печать / PDF</button>
        <button type="button" class="btn-ghost" id="tkWord">Скачать .doc</button>
        <button type="button" class="btn-brand" id="tkSend">Отправить заказчику</button></div>${tkpDoc()}`;
    } else {
      right = `<div class="da-card da-empty tk-hint"><b>Заполните параметры и нажмите «Сформировать ТКП»</b>
        <span>Реквизиты компании, подпись, условия оплаты и гарантии подставятся из шаблона; стоимость — из расчёта.</span>
        <div class="tk-tpls">${TEMPLATES.map((t) => `<button type="button" class="tk-tpl${t.id === TKP.tpl ? " on" : ""}" data-tpl="${t.id}"><i></i><i></i><i></i><b>${esc(t.n)}</b></button>`).join("")}</div></div>`;
    }
    sec.innerHTML = `<div class="da-wrap">
      <div class="da-note">Демонстрация: ТКП собирается из шаблона компании — реквизиты, состав работ, стоимость, сроки и условия — за несколько секунд.</div>
      <div class="da-grid tk-grid">${form}<div class="da-main">${right}</div></div></div>`;
  }

  async function tkpGen() {
    TKP.stage = "gen";
    tkpRender();
    await wait(1600);
    TKP.stage = "doc";
    tkpRender();
  }

  function tkpWire() {
    const sec = $d("#sec-tkp");
    sec.addEventListener("change", (e) => {
      const t = e.target;
      if (t.dataset.w) TKP.works[t.dataset.w] = t.checked;
      else if (t.dataset.f === "vat") TKP.vat = t.checked;
      else if (t.dataset.f === "tpl") TKP.tpl = t.value;
      else if (t.dataset.f) TKP[t.dataset.f] = Math.max(0, +t.value || 0);
      else return;
      tkpRender();
    });
    sec.addEventListener("click", (e) => {
      const t = e.target.closest("button");
      if (!t) return;
      if (t.id === "tkGen") { if (TKP.stage === "doc") TKP.no++; tkpGen(); }
      else if (t.dataset.tpl) { TKP.tpl = t.dataset.tpl; tkpRender(); }
      else if (t.id === "tkPrint" || t.id === "tkWord") {
        const css = [...document.styleSheets].map((s) => s.href).filter((h) => h && /demo-ai/.test(h));
        const html = `<!doctype html><html><head><meta charset="utf-8"><title>ТКП-${TKP.no}</title>${css.map((h) => `<link rel="stylesheet" href="${h}">`).join("")}
          <style>body{background:#fff;margin:0;padding:24px}.tk-doc{box-shadow:none;margin:0 auto}</style></head><body>${$d("#tkDoc").outerHTML}</body></html>`;
        if (t.id === "tkWord") download(`ТКП-${TKP.no}.doc`, html, "application/msword");
        else { const w = window.open("", "_blank"); w.document.write(html); w.document.close(); setTimeout(() => w.print(), 400); }
      } else if (t.id === "tkSend") {
        t.textContent = "Отправлено ✓";
        t.disabled = true;
      }
    });
  }

  /* ══ общее ═════════════════════════════════════════════════ */

  function go(id) {
    const a = document.querySelector(`.side a[data-s="${id}"]`);
    if (a) a.click();
  }

  let wired = false;
  function wire() {
    if (wired) return;
    wired = true;
    drwWire();
    tkpWire();
  }

  /* Рисуем сразу: раздел, открытый прямой ссылкой, не ждёт showSection —
     данные здесь свои, и от ответа сервера они не зависят. */
  document.addEventListener("DOMContentLoaded", () => { wire(); drwRender(); tkpRender(); });

  return {
    showDrw() { wire(); drwRender(); },
    showTkp() { wire(); tkpRender(); },
  };
})();
