/* Раздел «Расценки» — свой прайс на работы.

   Справочник, а не документ объекта: расценка одна на контору, и
   калькуляция по любой стройке считается по ней. Поэтому раздел живёт
   рядом с «Контрагентами», а не внутри объекта.

   Правится на месте, без окон. Прайс — это триста строк, из которых
   меняют две-три цены за раз; открывать карточку ради одного числа
   значит превратить пятиминутное дело в получасовое. По той же причине
   строка сохраняется сама, как только человек ушёл из поля.

   Порядок строк — как в присланной книге. Прайс читают глазами и ищут в
   нём по памяти («кабель сверху, щиты внизу»), и пересортировка по
   алфавиту сломала бы этот способ искать. */
"use strict";

const WORKS = (() => {
  const $w = (s, r) => (r || document).querySelector(s);
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  const ICO = {
    find: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11"
      r="6.5"/><path d="M20.5 20.5 16 16"/></svg>`,
    plus: `<svg viewBox="0 0 24 24" aria-hidden="true"><path
      d="M12 5v14M5 12h14"/></svg>`,
    up: `<svg viewBox="0 0 24 24" aria-hidden="true"><path
      d="M12 16V4M7 9l5-5 5 5M4 17v2a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-2"/></svg>`,
    back: `<svg viewBox="0 0 24 24" aria-hidden="true"><path
      d="M15 6l-6 6 6 6"/></svg>`,
    funnel: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16l-6.2 7.4V19l-3.6-1.8v-4.8z"/></svg>`,
  };

  let ROWS = [];
  let SECTIONS = [];
  let total = 0;
  let search = "";

  /* Фильтры по колонкам, как в Excel и как в прайсе материалов: у каждой
     колонки свой, в её заголовке. Помним в браузере — это удобство
     одного человека, а не данные прайса. Вид окон и полосы отбора — те
     же классы, что у материалов: два справочника рядом не должны
     выглядеть по-разному. */
  const FLT_KEY = "karkas.wrk.filters.v1";
  let FLT = { cols: {}, sort: null };
  try {
    const got = JSON.parse(localStorage.getItem(FLT_KEY) || "{}") || {};
    FLT = { cols: got.cols && typeof got.cols === "object" ? got.cols : {},
            sort: got.sort && got.sort.key ? got.sort : null };
  } catch (e) { /* без памяти */ }
  const saveFlt = () => {
    try { localStorage.setItem(FLT_KEY, JSON.stringify(FLT)); } catch (e) { /* без памяти */ }
  };
  const COLS = [["section", "Раздел", "list"], ["name", "Наименование", "text"],
                ["spec", "Характеристики", "text"], ["unit", "Ед.", "list"],
                ["price", "Цена", "price"]];
  /* Ширины колонок раздвигают руками, как в расчёте и прайсе материалов. */
  const WRKW = GRID.widths("karkas.wrk.colw.v1", () => [
    ["section", "18%"], ["name", 0], ["spec", "16%"], ["unit", 81], ["price", 117], ["acts", 54]]);
  const colLabel = (k) => (COLS.find((c) => c[0] === k) || [])[1] || k;
  const colType = (k) => (COLS.find((c) => c[0] === k) || [])[2];
  const numOf = (s) => {
    const v = parseFloat(String(s ?? "").replace(/\s/g, "").replace(",", "."));
    return isNaN(v) ? null : v;
  };

  const can = () => AUTH.can(AUTH.current(), "ref_wrk");
  const money = (n) => (n === null || n === undefined || n === "")
    ? "" : Number(n).toLocaleString("ru-RU", { minimumFractionDigits: 2,
                                               maximumFractionDigits: 2 });
  const plural = (n, one, few, many) => {
    const a = Math.abs(n) % 100, b = a % 10;
    if (a > 10 && a < 20) return many;
    if (b > 1 && b < 5) return few;
    return b === 1 ? one : many;
  };

  /* Прайс тянем целиком и один раз. Триста строк — это десяток
     килобайт, а поиск по ним в браузере мгновенный: спрашивать сервер
     на каждую букву значит ждать ответа там, где ждать нечего. */
  /* Первый раз — рисуем раздел; дальше — только тело и только если прайс
     изменился: при каждом показе вкладки страница не перерисовывается. */
  let SIG = "";
  async function load() {
    const res = await AUTH.api("GET", "/works");
    const sig = JSON.stringify([res.rows, res.sections]);
    const drawn = !!$w("#wrkBody");
    if (drawn && sig === SIG) return;
    SIG = sig;
    ROWS = res.rows;
    SECTIONS = res.sections;
    total = res.total;
    if (drawn) paint(); else render();
  }

  function visible() {
    const q = search.trim().toLowerCase();
    const on = Object.keys(FLT.cols).filter(fltOn);
    return sortRows(ROWS.filter((r) => {
      for (const k of on) if (!pass(r, k, FLT.cols[k])) return false;
      if (!q) return true;
      return (r.name + " " + r.spec + " " + r.section).toLowerCase().includes(q);
    }));
  }

  function fltOn(k) {
    const f = FLT.cols[k];
    return !!f && !!colType(k) && !!(String(f.q || "").trim() || Array.isArray(f.vals)
      || f.has || numOf(f.from) !== null || numOf(f.to) !== null);
  }

  function pass(r, k, f) {
    const t = colType(k);
    if (t === "text") {
      const q = String(f.q || "").trim().toLowerCase();
      return !q || String(r[k] || "").toLowerCase().includes(q);
    }
    if (t === "list") return !Array.isArray(f.vals) || f.vals.includes(String(r[k] || "").trim());
    const has = r.price !== null && r.price !== undefined && r.price !== "";
    if (f.has === "yes" && !has) return false;
    if (f.has === "no" && has) return false;
    const lo = numOf(f.from), hi = numOf(f.to);
    if ((lo !== null || hi !== null) && !has) return false;
    if (lo !== null && Number(r.price) < lo) return false;
    if (hi !== null && Number(r.price) > hi) return false;
    return true;
  }

  /* Без сортировки — порядок книги: прайс ищут глазами по памяти. С
     сортировкой пустые — в конце при любом направлении. */
  function sortRows(rows) {
    const s = FLT.sort;
    if (!s || !colType(s.key)) return rows;
    const dir = s.dir === -1 ? -1 : 1;
    const val = (r) => s.key === "price"
      ? (r.price === null || r.price === undefined || r.price === "" ? null : Number(r.price))
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
    const parts = [];
    if (f.has) parts.push(f.has === "yes" ? "есть цена" : "нет цены");
    const lo = numOf(f.from), hi = numOf(f.to);
    if (lo !== null || hi !== null) {
      parts.push([lo !== null ? "от " + money(lo) : "", hi !== null ? "до " + money(hi) : ""]
        .filter(Boolean).join(" "));
    }
    return `${name}: ${parts.join(" · ")}`;
  }

  function listVals(k) {
    const n = new Map();
    for (const r of ROWS) {
      const v = String(r[k] || "").trim();
      n.set(v, (n.get(v) || 0) + 1);
    }
    return [...n.entries()];
  }

  // Окно фильтра — одно на страницу, в body, по координатам кнопки.
  let POP = null;
  function closePop() {
    if (POP) POP.box.remove();
    POP = null;
    document.removeEventListener("mousedown", popOut, true);
    document.removeEventListener("keydown", popKey);
  }
  function popOut(e) {
    if (!POP || POP.box.contains(e.target) || e.target.closest("[data-flt]")) return;
    closePop();
  }
  function popKey(e) { if (e.key === "Escape") closePop(); }

  function fltBtn(k, label) {
    const on = fltOn(k) || (FLT.sort && FLT.sort.key === k);
    return `<button type="button" class="mat-hbtn mat-flt-btn${on ? " mat-on" : ""}" data-flt="${
      k}" title="Фильтр и сортировка: ${esc(label)}" aria-label="Фильтр: ${esc(label)}">${
      ICO.funnel}</button>`;
  }

  function openFilter(btn, key) {
    if (POP && POP.key === key) return closePop();
    closePop();
    const t = colType(key);
    const f = FLT.cols[key] || {};
    const sorts = (a, b) => `<div class="mat-flt-sub">Сортировка</div><div class="mat-flt-sort">
      <button type="button" data-sort="1">${a}</button><button type="button" data-sort="-1">${b}</button></div>`;
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
    } else {
      body = [["", "Все"], ["yes", "Есть цена"], ["no", "Нет цены"]].map(([v, n]) => `
          <label class="mat-flt-opt"><input type="radio" name="wflt-has" data-has="${v}"${
            (f.has || "") === v ? " checked" : ""}> ${n}</label>`).join("")
        + `<div class="mat-flt-sub">Цена</div>
        <div class="mat-flt-range"><input class="pos-in num" data-from inputmode="decimal"
            placeholder="от" value="${esc(f.from || "")}" autocomplete="off"><span>—</span>
          <input class="pos-in num" data-to inputmode="decimal" placeholder="до"
            value="${esc(f.to || "")}" autocomplete="off"></div>`
        + sorts("↑ Дешевле", "↓ Дороже");
    }
    const box = document.createElement("div");
    box.className = "mat-pop mat-hpop mat-flt";
    box.innerHTML = `<div class="mat-flt-h">${esc(colLabel(key))}</div>${body}
      <div class="mat-flt-foot"><button type="button" class="lnk" data-clear>Сбросить колонку</button></div>`;
    document.body.appendChild(box);
    POP = { box, key };
    const r = btn.getBoundingClientRect();
    box.style.left = Math.max(8, Math.min(r.right - box.offsetWidth,
      window.innerWidth - box.offsetWidth - 8)) + "px";
    box.style.top = Math.max(8, Math.min(r.bottom + 6,
      window.innerHeight - box.offsetHeight - 8)) + "px";
    setTimeout(() => {
      document.addEventListener("mousedown", popOut, true);
      document.addEventListener("keydown", popKey);
    }, 0);

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
    if ($p("[data-from]")) {
      $p("[data-from]").addEventListener("input", (e) => set({ from: e.target.value }));
      $p("[data-to]").addEventListener("input", (e) => set({ to: e.target.value }));
    }
    if (t === "list") {
      // Разделы — в порядке прайса, остальное — по алфавиту.
      const all = key === "section"
        ? listVals(key).sort((a, b) => (a[0] === "") - (b[0] === "")
          || SECTIONS.indexOf(a[0]) - SECTIONS.indexOf(b[0]))
        : listVals(key).sort((a, b) => (a[0] === "") - (b[0] === "")
          || a[0].localeCompare(b[0], "ru", { numeric: true }));
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
    const box = $w("#wrkChips");
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

  /* Раздел рисуется в два приёма, и это не украшательство.

     Полоса управления с полем поиска строится один раз — render. Всё,
     что меняется от набранного, живёт в теле — paint. Раньше на каждую
     букву перерисовывался весь раздел вместе с полем ввода, и в новое
     поле подставлялся текст, каким он был до перерисовки: набранное за
     это время затиралось, а курсор вставал по старой позиции. Из
     «работа» выходило «рюоара».

     Простое правило: поле, в котором печатают, нельзя пересоздавать,
     пока в нём печатают. */
  function render() {
    const host = $w("#sec-wrk");
    if (!host) return;
    // После удаления строки раздел перерисован — место прокрутки сохраняем.
    const was = $w("#wrkBody");
    const keep = was ? [was.scrollTop, was.scrollLeft] : null;
    host.innerHTML = `
      <div class="pg">
        <div class="pg-head">
          <div class="pg-count" id="wrkCount"></div>
          <div class="pg-tools">
            <label class="pg-find">${ICO.find}
              <input id="wrkSearch" placeholder="Работа или размер"
                     value="${esc(search)}"></label>
            ${can() ? `
              <label class="btn-ghost wrk-pick" for="wrkFile">${ICO.up}
                Загрузить прайс</label>
              <input type="file" id="wrkFile" accept=".xlsx,.xlsm" hidden>
              <button type="button" class="btn-ghost btn-clear" id="wrkClear"
                title="Убрать все расценки — спросим подтверждение">Очистить</button>
              <button type="button" class="btn-brand" id="wrkNew">${
                ICO.plus}Добавить</button>` : ""}
          </div>
        </div>
        <!-- Отбор по колонкам — полосой над таблицей, как у материалов. -->
        <div class="mat-chips" id="wrkChips" hidden></div>
        <div class="pg-body" id="wrkBody"></div>
        <div class="pg-note" id="wrkNote" hidden></div>
      </div>`;
    wireHead(host);
    // Таблицу двигают мышью, как в расчёте.
    GRID.pan($w("#wrkBody"));
    paint();
    if (keep) {
      const b = $w("#wrkBody");
      b.scrollTop = keep[0];
      b.scrollLeft = keep[1];
    }
  }

  /* Тело и счётчик — всё, что зависит от поиска и фильтра. */
  function paint() {
    const body = $w("#wrkBody");
    if (!body) return;
    const rows = visible();
    $w("#wrkCount").innerHTML = rows.length === total
      ? `<b>${total}</b> ${plural(total, "расценка", "расценки", "расценок")}`
      : `<b>${rows.length}</b> из ${total}`;

    paintChips();
    const th = (k, label, cls) => `<th${cls ? ` class="${cls}"` : ""}><span class="mat-th">${
      label}${fltBtn(k, label)}</span>${WRKW.grip()}</th>`;
    body.innerHTML = ROWS.length ? `
      <table class="tbl wrk-tbl" style="${WRKW.style(900)}">
        <colgroup>${WRKW.colgroup()}</colgroup>
        <thead><tr>${th("section", "Раздел", "wrk-sec")}${th("name", "Наименование", "wrk-name")}${
          th("spec", "Характеристики")}${th("unit", "Ед.")}${th("price", "Цена, ₽", "num")}<th></th></tr></thead>
        <tbody>${rows.length ? "" : `<tr><td class="wrk-none" colspan="6">Ничего не нашлось —
          снимите фильтры или поищите другим написанием</td></tr>`}${rows.map((r) => `
          <tr data-id="${esc(r.id)}">
            <td class="wrk-sec">${esc(r.section) || "<span class=dim>—</span>"}</td>
            <td class="wrk-name">${cell(r, "name")}</td>
            <td>${cell(r, "spec")}</td>
            <td>${cell(r, "unit")}</td>
            <td class="num">${cell(r, "price")}</td>
            <td class="acts">${can() ? `<button type="button"
              class="lnk warn" data-rm title="Убрать расценку">×</button>` : ""}</td>
          </tr>`).join("")}</tbody>
      </table>`
      : `<div class="pg-empty"><b>Прайс пока не загружен</b>Загрузите книгу с расценками —
          колонки «Наименование», «характеристики», «ед.изм.» и «Цена». Разделы Трейс
          разберёт сам: это строки с названием и без цены.</div>`;
    body.querySelectorAll("[data-flt]").forEach((b) => b.addEventListener("click", (e) => {
      e.stopPropagation();
      openFilter(b, b.dataset.flt);
    }));
    const t = body.querySelector("table.wrk-tbl");
    WRKW.wire(t, t && t.tHead && t.tHead.rows[0], paint);
    // Раздел и наименование не уезжают при прокрутке вбок.
    GRID.freeze(t, 2);
    wireBody(body);
  }

  /* Ячейка правится на месте. Наименование и раздел — тоже: прайс наш,
     первоисточника у него нет, и запрещать правку было бы не бережностью,
     а помехой. */
  function cell(r, field) {
    const num = field === "price";
    const v = r[field];
    return `<input class="pos-in${num ? " num" : ""}" data-f="${field}"
      value="${esc(num ? (v === null ? "" : v) : v)}"${
      can() ? "" : " readonly"} placeholder="${num ? "цена" : ""}">`;
  }

  /* Обработчики полосы управления. Вешаются один раз за отрисовку
     раздела: перебирать тело они не должны, иначе поле поиска придётся
     пересоздавать вместе с ним. */
  function wireHead(host) {
    // Ни задержки, ни запроса: строки уже здесь, фильтр считается на
    // месте. Поле ввода при этом не трогаем вовсе — курсор остаётся там,
    // где его оставил человек, сам собой.
    $w("#wrkSearch", host).addEventListener("input", (e) => {
      search = e.target.value;
      paint();
    });

    if (!can()) return;
    $w("#wrkNew", host).addEventListener("click", () => addRow());
    $w("#wrkClear", host).addEventListener("click", clearAll);
    const file = $w("#wrkFile", host);
    if (file) file.addEventListener("change", () => upload(file));
  }

  function wireBody(host) {
    if (!can()) return;
    host.querySelectorAll(".pos-in").forEach((inp) => {
      const tr = inp.closest("tr");
      const save = async () => {
        if (inp.value === inp.dataset.last) return;
        inp.dataset.last = inp.value;
        inp.classList.remove("bad");
        try {
          const upd = await AUTH.api("PATCH", "/works/" + tr.dataset.id,
                                     { [inp.dataset.f]: inp.value });
          const row = ROWS.find((x) => x.id === upd.id);
          if (row) Object.assign(row, upd);
          if (inp.dataset.f === "price") inp.value = upd.price ?? "";
        } catch (e) {
          inp.classList.add("bad");
          inp.title = String(e.message);
        }
      };
      inp.addEventListener("change", save);
      inp.addEventListener("keydown", (e) => {
        if (e.key === "Enter") { e.preventDefault(); inp.blur(); }
      });
    });

    host.querySelectorAll("[data-rm]").forEach((b) => {
      b.addEventListener("click", async () => {
        const tr = b.closest("tr");
        const row = ROWS.find((x) => x.id === tr.dataset.id) || {};
        if (!(await ASK.confirm(`Убрать расценку «${row.name}»?`))) return;
        try {
          await AUTH.api("DELETE", "/works/" + tr.dataset.id);
          await load();
        } catch (e) {
          ASK.alert(e.message, { title: "Не убралась" });
        }
      });
    });
  }

  /* Подтверждение плашкой, а не системным confirm: в нём не видно, что
     именно пропадёт и как это вернуть, а кнопку «ОК» жмут не читая. */
  function confirmBox(title, text, okLabel) {
    // Общее окно платформы (src/ask.js); текст здесь уже размечен.
    return ASK.confirm(text, { title, ok: okLabel, danger: true, html: true });
  }

  /* Очистить весь прайс работ: загруженную не ту книгу проще снять разом
     и загрузить заново, чем убирать по крестику сотню строк. */
  async function clearAll() {
    const n = ROWS.length;
    if (!n) return;
    const ok = await confirmBox("Очистить прайс работ?",
      `Уберутся все ${n} ${plural(n, "расценка", "расценки", "расценок")}. Вернуть`
      + " их можно, загрузив книгу прайса заново кнопкой «Загрузить прайс».",
      `Очистить ${n} ${plural(n, "расценку", "расценки", "расценок")}`);
    if (!ok) return;
    try {
      const r = await AUTH.api("POST", "/works/clear", {});
      await load();
      // Раздел перерисован заново — берём уже новую строку сообщения.
      const box = $w("#wrkNote");
      if (box) {
        box.textContent = `Прайс работ очищен: убрано ${Number(r && r.removed) || n}.`;
        box.hidden = false;
      }
    } catch (e) {
      ASK.alert(e.message, { title: "Не очистилось" });
    }
  }

  /* Новая расценка заводится сразу строкой в текущем разделе: так видно,
     куда она встала, и не нужно выбирать раздел в отдельном окне. */
  async function addRow() {
    try {
      // В раздел, отобранный фильтром, если он один: там человек и смотрит.
      const f = FLT.cols.section;
      const section = f && Array.isArray(f.vals) && f.vals.length === 1 ? f.vals[0] : "";
      await AUTH.api("POST", "/works",
                     { section, name: "Новая работа", unit: "шт." });
      await load();
      const rows = [...document.querySelectorAll("#sec-wrk tbody tr")];
      const fresh = rows.find((tr) => {
        const r = ROWS.find((x) => x.id === tr.dataset.id);
        return r && r.name === "Новая работа";
      });
      if (fresh) {
        const inp = fresh.querySelector('[data-f="name"]');
        fresh.scrollIntoView({ block: "center" });
        inp.focus();
        inp.select();
      }
    } catch (e) {
      ASK.alert(e.message, { title: "Не добавилась" });
    }
  }

  function note(text, bad) {
    const box = $w("#wrkNote");
    if (!box) return;
    box.textContent = text;
    box.classList.toggle("bad", !!bad);
    box.hidden = false;
  }

  /* Загрузка книги. XMLHttpRequest, а не fetch: прайс небольшой, но путь
     тот же, что у документов объекта, и держать два разных способа
     отправки файла незачем. */
  function upload(input) {
    const f = input.files && input.files[0];
    if (!f) return;
    note(`Читаю «${f.name}»…`);
    const tr = TRACE.start({ kind: "works", file: f.name });
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/works/import");
    xhr.setRequestHeader("Authorization", "Bearer " + AUTH.token());
    xhr.setRequestHeader("Content-Type",
                         "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    xhr.addEventListener("load", async () => {
      input.value = "";
      let d = {};
      try { d = JSON.parse(xhr.responseText); } catch (e) {}
      if (xhr.status < 200 || xhr.status >= 300) {
        tr.fail("Не получилось: " + (d.error || "книга не прочиталась"));
        note(d.error || "Не удалось прочитать книгу", true);
        return;
      }
      tr.done(`Разделов ${d.sections}: добавлено ${d.added || 0}, обновлено ${d.updated || 0}`);
      await load();
      /* Говорим числами, что именно произошло. «Загружено» ничего не
         сообщает: человек прислал исправленный прайс и хочет знать,
         сколько цен поменялось. */
      const parts = [];
      if (d.added) parts.push(`добавлено ${d.added}`);
      if (d.updated) parts.push(`обновлено ${d.updated}`);
      if (d.same) parts.push(`без изменений ${d.same}`);
      if (d.missing) parts.push(`в книге не встретилось ${d.missing} — оставил`);
      if (d.stray) {
        parts.push(`в ${d.stray} строках слева от названия лежит посторонний`
                   + " текст, я его не читал");
      }
      note(`Разделов ${d.sections}. ` + (parts.join(", ") || "нечего менять"));
    });
    xhr.addEventListener("error", () => {
      input.value = "";
      note("Сеть оборвалась, прайс не загружен", true);
    });
    xhr.send(f);
  }

  return { load };
})();
