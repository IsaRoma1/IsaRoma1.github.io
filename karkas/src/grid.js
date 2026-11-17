/* Большая таблица «как в Excel»: ширину колонки тянут за правую границу
   подписи, а саму таблицу двигают мышью, как рукой. Сначала так сделали
   расчёт; прайсы материалов и работ попросили так же — и чтобы вели себя
   одинаково, поведение живёт здесь одно на всех. */
"use strict";

const GRID = (() => {
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const COL_MIN = 32;

  /* ── перетаскивание таблицы ──────────────────────────────────
     Зажали левую кнопку на ячейке и тянут в любую сторону — без полосы
     прокрутки внизу, до которой на длинной таблице надо ещё доехать.

     Перетаскивание начинается, только когда мышь ушла дальше пяти
     точек: короткий щелчок остаётся щелчком, двойной по слову — выделяет
     слово. Кнопки, ссылки, списки и границы колонок не перехватываются:
     там свои дела. Поле ввода — перехватывается, пока в нём не печатают:
     в прайсе работ поля занимают почти всю строку, и ухватиться было бы
     не за что. Поле, в котором уже стоит курсор, — не трогаем: в нём
     выделяют текст мышью. Щелчок, которым закончилось перетаскивание,
     гасим — иначе отпущенная над ценой кнопка выбирала бы поставщика. На
     сенсорном экране таблица и так листается пальцем. */
  const PAN_SKIP = "button, a, select, label, textarea, [data-grip], [contenteditable]";

  function pan(box) {
    if (!box || box._gridPan) return;
    box._gridPan = true;
    box.classList.add("grid-pan");
    /* Листают вбок — у примёрзших колонок появляется тень: она говорит,
       что под ними уехало продолжение строки. Пока не листали, тени нет,
       иначе она читалась бы как шов посреди таблицы. */
    const shade = () => box.classList.toggle("x-scrolled", box.scrollLeft > 0);
    box.addEventListener("scroll", shade, { passive: true });
    shade();
    box.addEventListener("pointerdown", (e) => {
      if (e.button !== 0 || e.pointerType === "touch") return;
      if (e.target.closest(PAN_SKIP)) return;
      const field = e.target.closest("input");
      if (field && field === document.activeElement) return;
      const sx = e.clientX, sy = e.clientY;
      const sl = box.scrollLeft, st = box.scrollTop;
      let panning = false;
      const move = (ev) => {
        const dx = ev.clientX - sx, dy = ev.clientY - sy;
        if (!panning) {
          if (Math.abs(dx) < 5 && Math.abs(dy) < 5) return;
          panning = true;
          // Щелчок по полю успел поставить в него курсор — это была не
          // правка, а захват таблицы.
          if (field && field === document.activeElement) field.blur();
          box.setPointerCapture(e.pointerId);
          box.classList.add("panning");
          const sel = window.getSelection();
          if (sel) sel.removeAllRanges();
        }
        ev.preventDefault();
        box.scrollLeft = sl - dx;
        box.scrollTop = st - dy;
      };
      const up = () => {
        box.removeEventListener("pointermove", move);
        box.removeEventListener("pointerup", up);
        box.removeEventListener("pointercancel", up);
        if (!panning) return;
        box.classList.remove("panning");
        const eat = (ce) => { ce.preventDefault(); ce.stopPropagation(); };
        box.addEventListener("click", eat, true);
        // Щелчок, если он будет, приходит сразу за отпусканием; позже —
        // это уже новый щелчок человека, его не трогаем.
        setTimeout(() => box.removeEventListener("click", eat, true), 0);
      };
      box.addEventListener("pointermove", move);
      box.addEventListener("pointerup", up);
      box.addEventListener("pointercancel", up);
    });
  }

  /* ── примёрзшие колонки ─────────────────────────────────────
     Первые колонки таблицы — номер и наименование — остаются на месте,
     когда таблицу листают вбок: справа колонки поставщиков, и без этого
     видно числа, но не видно, чья это строка.

     Прилипание задаёт CSS, а вот смещение второй колонки знает только
     страница: ширина первой меняется руками. Меряем по шапке и кладём в
     переменную таблицы --fz1, чтобы в стилях не было числа, которое
     разъедется. Пересчитываем после каждой правки ширин и при смене
     размера окна — там, где колонка задана долей, она тоже едет. */
  const FROZE = new Set();

  /* late — селектор колонок, которые стоят не с края, но при прокрутке
     догоняют примёрзшие и встают вплотную к ним (блок «Минимальная
     цена» за количеством). Смещение каждой примёрзшей — сумма ширин
     примёрзших перед ней, а не всех колонок слева: --fz0, --fz1, … по
     порядку примерзания. */
  function place(t) {
    const head = t.table.tHead;
    const row = head && head.rows[head.rows.length - 1];
    if (!row) return;
    const cells = [...row.cells];
    let x = 0, k = 0, lead = 0;
    cells.forEach((cell, i) => {
      if (i >= t.n && !(t.late && cell.matches(t.late))) return;
      t.table.style.setProperty("--fz" + k++, Math.round(x) + "px");
      x += cell.getBoundingClientRect().width;
      if (i < t.n) lead = x;
    });
    /* Примёрзшая колонка не выходит за край таблицы: в окне уже
       примёрзшего блока браузер у правого края прокрутки сдвигает её
       влево, и она ложится на наименование. Места нет — догоняющие
       колонки (late) не примерзают, а уезжают вместе с таблицей; номер и
       наименование держатся, пока влезают хотя бы они. */
    const box = t.table.parentElement;
    const room = box ? box.clientWidth : 0;
    t.table.classList.toggle("fz-tight", !!room && room < x + 160);
    t.table.classList.toggle("fz-none", !!room && room < lead + 120);
  }

  /* Таблицу перерисовывают целиком, и старый элемент остаётся в наборе
     мёртвым грузом — выметаем его при первом же пересчёте. */
  function reflow(table) {
    FROZE.forEach((t) => {
      if (!t.table.isConnected) {
        if (t.ro) t.ro.disconnect();
        FROZE.delete(t);
      } else if (!table || t.table === table) place(t);
    });
  }

  /* Смещения меряются по шапке, а она бывает не той ширины, что потом:
     прайс материалов перерисовывается и во вкладке, скрытой за соседней
     (ширины там нулевые), строки дорисовываются окном уже после. Смещение
     оставалось от того замера, и при прокрутке до конца блок «Минимальная
     цена» наезжал на наименование и номер. Поэтому следим за самими
     ячейками шапки: изменилась ширина любой примёрзшей — пересчитываем. */
  function freeze(table, n, late) {
    if (!table) return;
    const t = { table, n, late: late || "" };
    FROZE.add(t);
    reflow(table);
    const head = table.tHead;
    const row = head && head.rows[head.rows.length - 1];
    if (row && typeof ResizeObserver === "function") {
      t.ro = new ResizeObserver(() => { if (table.isConnected) place(t); });
      [...row.cells].forEach((cell, i) => {
        if (i < n || (t.late && cell.matches(t.late))) t.ro.observe(cell);
      });
      // И за окном прокрутки: уже ли оно примёрзшего, решает его ширина,
      // а она меняется и без смены размера окна — свернули боковое меню,
      // вкладку показали из-за соседней.
      if (table.parentElement) t.ro.observe(table.parentElement);
    }
  }

  addEventListener("resize", () => reflow(null));

  /* ── ширины колонок ─────────────────────────────────────────
     Тянут правую границу подписи: эта колонка меняет ширину, остальные
     остаются своей ширины и сдвигаются следом, а таблица растёт или
     сжимается на ту же величину. Для этого при первом захвате все ширины
     замораживаются такими, какие они на экране, — иначе раздвинутая
     колонка отнимала бы место у названия, у которого своей ширины нет.
     Ширины запоминаются в браузере: это удобство одного человека на
     одном экране, а не данные. Двойной щелчок по границе возвращает
     ширины по умолчанию.

     spec() — колонки по порядку: [ключ, ширина по умолчанию]. Ширина —
     число пикселей, доля строкой («18%») или 0 — остаток. Ключ — то, под
     чем ширина запоминается: у колонки поставщика это его id, и
     добавленный поставщик не сбивает ширины остальных. */
  function widths(storeKey, spec) {
    let W = (() => {
      try { return JSON.parse(localStorage.getItem(storeKey) || "{}") || {}; }
      catch (e) { return {}; }
    })();
    const save = () => {
      try { localStorage.setItem(storeKey, JSON.stringify(W)); } catch (e) { /* без памяти */ }
    };
    const px = (d) => typeof d === "number" && d > 0;
    // Заморожены — когда запомнена ширина у каждой колонки без своей
    // ширины в пикселях. Новая колонка поставщика встаёт своей обычной.
    const frozen = () => spec().every(([k, d]) => W[k] > 0 || px(d));
    const sum = () => spec().reduce((a, [k, d]) => a + (W[k] || (px(d) ? d : 0)), 0);

    function colgroup() {
      return spec().map(([k, d]) => {
        const w = W[k] ? W[k] + "px" : px(d) ? d + "px" : d || "";
        return `<col data-col="${esc(k)}"${w ? ` style="width:${esc(w)}"` : ""}>`;
      }).join("");
    }

    // min — ширина, уже которой таблица не ужимается, пока ширины не трогали.
    const style = (min) => frozen() ? `width:${sum()}px;min-width:0` : `--tbl-min:${min}px`;

    const grip = () => `<span class="col-grip" data-grip aria-hidden="true"
      title="Потяните, чтобы изменить ширину колонки. Двойной щелчок — ширины по умолчанию"></span>`;

    /* row — ряд шапки, где стоят подписи колонок: по одной ячейке на
       колонку, без объединений. redraw — перерисовать таблицу после
       сброса ширин. */
    function wire(table, row, redraw) {
      if (!table || !row) return;
      const cols = [...table.querySelectorAll("colgroup col")];
      const heads = [...row.cells];
      if (!cols.length || cols.length !== heads.length) return;
      heads.forEach((th, i) => {
        const g = th.querySelector("[data-grip]");
        if (!g) return;
        g.addEventListener("pointerdown", (e) => {
          if (e.button !== 0) return;
          e.preventDefault();
          e.stopPropagation();
          if (cols.some((c) => !(W[c.dataset.col] > 0))) {
            heads.forEach((h, j) => {
              W[cols[j].dataset.col] = Math.round(h.getBoundingClientRect().width);
            });
            cols.forEach((c) => { c.style.width = W[c.dataset.col] + "px"; });
            table.style.minWidth = "0";
            table.style.width = sum() + "px";
            reflow(table);
          }
          const key = cols[i].dataset.col;
          const startX = e.clientX, startW = W[key];
          g.setPointerCapture(e.pointerId);
          document.body.classList.add("col-resizing");
          const move = (ev) => {
            W[key] = Math.max(COL_MIN, Math.round(startW + ev.clientX - startX));
            cols[i].style.width = W[key] + "px";
            table.style.width = sum() + "px";
            reflow(table);
          };
          const up = () => {
            g.removeEventListener("pointermove", move);
            g.removeEventListener("pointerup", up);
            g.removeEventListener("pointercancel", up);
            document.body.classList.remove("col-resizing");
            save();
          };
          g.addEventListener("pointermove", move);
          g.addEventListener("pointerup", up);
          g.addEventListener("pointercancel", up);
        });
        g.addEventListener("dblclick", (e) => {
          e.stopPropagation();
          W = {};
          save();
          redraw();
        });
      });
    }

    return { colgroup, style, grip, wire };
  }

  return { pan, widths, freeze };
})();
