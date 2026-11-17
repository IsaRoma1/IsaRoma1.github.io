/* Раздел «Объекты» — спецификации на живых данных плюс журнал движений
   и добавления.

   Данные: data/objects.json — перечень объектов и договоров,
   data/spec-<договор>.json — разобранная спека (deploy/parse_spec.py).
   Журнал живёт в src/ledger.js, добавления — в src/additions.js: спека
   это план, а движения и добавки копятся сверху и источник не
   переписывают.

   Добавлять можно в двух местах, и оба — там, где вещь появляется:
   позицию внутри раскрытого щита, щит в конце раздела. Одна кнопка под
   всей таблицей не работала бы даже теоретически: под 284-й строкой уже
   неоткуда узнать, в какой щит кладём. */
"use strict";

const $o = (s) => document.querySelector(s);

const money = (n) => n == null ? "—"
  : Math.round(n).toLocaleString("ru-RU").replace(/ /g, " ");
const qty = (n) => n == null ? "" : String(+Number(n).toFixed(3)).replace(".", ",");
const escO = (s) => String(s ?? "").replace(/[&<>"]/g,
  (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

let CATALOG = null;      // объекты и договоры
let DOC = null;          // текущая спека
let CUR = null;          // { object, contract }
const openBoxes = new Set();   // ключи раскрытых щитов
let openItem = null;           // ключ раскрытой позиции
let addFor = null;             // что заполняем в окне добавления

/* ── загрузка ───────────────────────────────────────────── */
async function loadCatalog() {
  const r = await fetch("/data/objects.json", { cache: "no-store" });
  if (!r.ok) throw new Error(`objects.json: HTTP ${r.status}`);
  CATALOG = await r.json();
}

async function openContract(obj, contract) {
  const r = await fetch(`/data/spec-${contract.id}.json`, { cache: "no-store" });
  if (!r.ok) throw new Error(`спека ${contract.id}: HTTP ${r.status}`);
  DOC = await r.json();
  CUR = { object: obj, contract };
  // Ключи позиций — из содержимого спеки, один раз на договор.
  LEDGER.assignKeys(DOC, contract.id);
  // Проводки и добавления забираем пачкой: дальше таблица рисуется из памяти.
  await Promise.all([LEDGER.load(contract.id), ADDS.load(contract.id)]);
  openBoxes.clear();
  openItem = null;
  renderTree();
  renderSpec();
}

/* ── дерево объектов ────────────────────────────────────── */
function renderTree() {
  $o("#objTree").innerHTML = `<div class="t-lab">Объекты</div>` +
    CATALOG.objects.map((obj) => {
      const on = CUR && CUR.object.id === obj.id;
      return `<a class="${on ? "on" : ""}" data-obj="${obj.id}">
          <span class="car">${on ? "▾" : "▸"}</span>${escO(obj.name)}</a>` +
        (on ? obj.contracts.map((c) => `<a class="kid${
          CUR.contract.id === c.id ? " on" : ""}" data-obj="${obj.id}" data-c="${c.id}"
          >${escO(c.title)}</a>`).join("") : "");
    }).join("");

  $o("#objTree").querySelectorAll("a[data-c]").forEach((a) => {
    a.addEventListener("click", async () => {
      const obj = CATALOG.objects.find((o) => o.id === a.dataset.obj);
      const c = obj.contracts.find((x) => x.id === a.dataset.c);
      try { await openContract(obj, c); }
      catch (e) { $o("#objSpec").innerHTML = errBox(e); }
    });
  });
}

const errBox = (e) => `<div class="pad" style="color:var(--bad)">
  Не удалось прочитать спецификацию.<br>Соберите её:
  <code>python deploy/fetch_all_specs.py</code><br>${escO(e)}</div>`;

/* ── строки таблицы ─────────────────────────────────────── */
/* Сметная и добавленная позиции рисуются одной функцией: разница между
   ними — в пометке и в том, что у добавленной можно менять статус. */
function itemRow(v) {
  const p = LEDGER.progress(v.key, v.plan);
  const issues = LEDGER.issues(v.key, v.plan);
  const isOpen = openItem === v.key;
  const a = v.added;

  return `<tr class="item${isOpen ? " on" : ""}${a ? " added" : ""}"
      data-k="${escO(v.key)}">
    <td class="ind">${v.title}${
      a ? `<span class="badge-add" title="${escO(a.reason)}">сверх сметы</span>` : ""}${
      v.note ? `<span class="badge-note" title="пометка в колонке «Поз.» исходной таблицы">${
        escO(v.note)}</span>` : ""}${
      v.places ? `<span class="place">${escO(v.places.join(", "))}</span>` : ""}</td>
    <td class="dim">${escO(v.brand)}</td>
    <td class="dim">${a
      ? `<span class="st-chip ${ADDS.STATUS[a.status].cls}">${
          ADDS.STATUS[a.status].label}</span>`
      : escO(v.supplier)}</td>
    <td class="q">${qty(v.plan)} ${escO(v.unit)}${
      v.designDiff ? `<span class="warn" title="по расчёту ${qty(v.qty_design)}">≠ ${
        qty(v.qty_design)}</span>` : ""}${
      v.revised ? `<span class="rev" title="${escO(v.revised)}">изм</span>` : ""}</td>
    <td class="st">${stageChip(p, issues)}</td>
    <td class="p">${v.sum == null ? '<span class="dim">—</span>' : money(v.sum)}</td>
  </tr>` + (isOpen ? panelRow(v) : "");
}

/* Сметная позиция -> то, что нужно строке. Кабель в спеке записан
   группой («Кабель с медными жилами, сечением:» и под ней сечения), и
   группа приезжает из разборщика отдельной сборкой — контекст виден в
   строке над позициями, приписывать его к каждой не нужно. */
function specView(i) {
  return {
    key: i._key, name: i.name, title: escO(i.name), note: i.pos_note,
    brand: i.brand, supplier: i.supplier,
    unit: i.unit, plan: i.qty_spec, sum: i.sum_est, places: i.places,
    qty_design: i.qty_design,
    designDiff: i.qty_design != null && i.qty_spec != null
      && Math.abs(i.qty_design - i.qty_spec) > 0.001,
    revised: i.qty_revisions && i.qty_revisions.length
      ? i.qty_revisions.map((v) => v.title + ": " + qty(v.qty)).join("\n") : null,
    added: null,
  };
}

/* Добавленная позиция -> то же самое. */
function addedView(a) {
  return {
    key: LEDGER.addedKey(CUR.contract.id, a.id),
    name: a.name, title: escO(a.name), note: null,
    brand: a.brand, supplier: "", unit: a.unit,
    plan: a.qty, sum: (a.price_est && a.qty) ? a.price_est * a.qty : null,
    places: null, designDiff: false, revised: null, added: a,
  };
}

function stageChip(p, issues) {
  if (issues.length) return `<span class="chip-st bad" title="${escO(issues.join("\n"))}">расхождение</span>`;
  if (!p.any) return `<span class="chip-st idle">не начато</span>`;
  const m = LEDGER.MOVE_BY[p.stage];
  return `<span class="chip-st ${m.color}">${m.short}${
    p.pct != null ? ` ${p.pct}%` : ""}</span>`;
}

/* Панель позиции разворачивается прямо в таблице отдельной строкой —
   так не теряется контекст: видно, внутри какого щита позиция. */
function panelRow(v) {
  const key = v.key;
  const t = LEDGER.totals(key);
  const list = LEDGER.of(key);
  const issues = LEDGER.issues(key, v.plan);
  const a = v.added;

  const cells = LEDGER.MOVES.map((m) => `<div class="lg-cell">
      <i>${m.label}</i><b class="num">${t[m.id] ? qty(t[m.id]) : "—"}</b></div>`).join("");

  // Единица измерения в таблице часто уже с точкой («шт.»), поэтому
  // свою в конце фразы не ставим — получалось «4 шт..».
  const rows = list.length ? list.slice().reverse().map((m) => `<div class="lg-row">
      <span class="lg-type ${LEDGER.MOVE_BY[m.type].color}">${LEDGER.MOVE_BY[m.type].label}</span>
      <b class="num">${qty(m.qty)}</b>
      <span class="dim">${escO(m.note)}</span>
      <span class="lg-meta">${escO(m.author)} · ${fmtStamp(m.at)}</span>
      <button type="button" class="lg-del" data-del="${m.id}" title="Удалить проводку">×</button>
    </div>`).join("") : `<div class="lg-empty">Движений пока нет. План —
      <b class="num">${qty(v.plan)} ${escO(v.unit)}</b></div>`;

  return `<tr class="panel"><td colspan="6">
    <div class="lg">
      <div class="lg-head">
        <b>${escO(v.name)}</b>
        <span class="dim">план ${qty(v.plan)} ${escO(v.unit)}${
          v.plan != null && t.ordered ? ` · осталось заказать ${
            qty(Math.max(0, v.plan - t.ordered))}` : ""}</span>
      </div>
      ${a ? addedHead(a) : ""}
      ${issues.length ? `<div class="lg-issue">${issues.map(escO).join("<br>")}</div>` : ""}
      <div class="lg-cells">${cells}</div>
      <div class="lg-add">
        <select class="role-sel" data-f="type">
          ${LEDGER.MOVES.map((m) => `<option value="${m.id}">${m.label}</option>`).join("")}
        </select>
        <input class="lg-qty" data-f="qty" placeholder="кол-во" inputmode="decimal">
        <input class="lg-note" data-f="note" placeholder="комментарий (необязательно)">
        <button type="button" class="btn-brand" data-add="${escO(key)}">Записать</button>
      </div>
      <div class="lg-list">${rows}</div>
    </div>
  </td></tr>`;
}

/* Шапка добавленной позиции: зачем её завели, кто и на чём стоит спор. */
function addedHead(a) {
  return `<div class="add-head">
    <div class="add-why"><i>Зачем</i>${escO(a.reason)}</div>
    <div class="add-meta">добавил ${escO(a.author)} · ${fmtStamp(a.at)}${
      a.status_at ? ` · ${ADDS.STATUS[a.status].label}: ${escO(a.status_by)}` : ""}</div>
    <div class="add-acts">
      <select class="role-sel" data-st="${a.id}">
        ${Object.entries(ADDS.STATUS).map(([k, s]) =>
          `<option value="${k}"${a.status === k ? " selected" : ""}>${s.label}</option>`).join("")}
      </select>
      <button type="button" class="btn-ghost" data-rm="${a.id}">Убрать</button>
    </div>
    <div class="add-err" data-err="${a.id}" hidden></div>
  </div>`;
}

/* Кнопка добавления. Живёт строкой таблицы, чтобы не выпадать из сетки. */
function addRow(kind, parentKey, where, label) {
  return `<tr class="addrow"><td colspan="6">
    <button type="button" class="add-btn" data-kind="${kind}"
            data-parent="${escO(parentKey)}" data-where="${escO(where)}">
      <span class="plus">+</span>${label}</button>
  </td></tr>`;
}

function boxRow(b, si, bi) {
  const s = DOC.sections[si];
  const boxKey = LEDGER.boxKey(CUR.contract.id, s.title, b.code);
  const isOpen = openBoxes.has(boxKey);
  const extra = ADDS.items(boxKey);
  const diff = b.items.filter((i) =>
    i.qty_design != null && i.qty_spec != null && Math.abs(i.qty_design - i.qty_spec) > 0.001).length;

  // Заголовок строки сборки. У щита это короткий код и длинное имя
  // рядом; у группы («Кабель с медными жилами, сечением:») кода нет —
  // её опознают по самому названию, и печатать его дважды незачем.
  const group = b.kind === "group";
  const label = group
    ? `<b class="bx-group">${escO(b.name || b.code)}</b>`
    : `<b>${escO(b.code)}</b><span class="bx-name">${escO(b.name)}</span>`;
  const where = group ? "группу" : (b.code === "—" ? s.title : b.code);

  const inside = () => b.items.map((i) => itemRow(specView(i))).join("")
    + extra.map((a) => itemRow(addedView(a))).join("")
    + addRow("item", boxKey, b.code === "—" ? s.title : b.code,
      b.code === "—" ? "позицию в раздел" : `позицию в ${escO(where)}`);

  // Псевдо-сборка «—» появляется там, где щитов нет вовсе (ЭГ):
  // тогда позиции показываем прямо под разделом, без лишнего уровня.
  if (b.code === "—") return inside();

  return `<tr class="box${isOpen ? " on" : ""}${group ? " grp-box" : ""}"
      data-key="${escO(boxKey)}">
      <td><span class="car">▶</span>${label}</td>
      <td class="dim">${escO(b.brand)}</td>
      <td><span class="pos-n">${b.items.length + extra.length} поз.</span>${
        diff ? `<span class="warn">${diff} расх.</span>` : ""}${
        extra.length ? `<span class="badge-add">+${extra.length}</span>` : ""}</td>
      <td class="q">${qty(b.qty_spec)} ${escO(b.unit)}</td>
      <td></td>
      <td class="p"><b>${money(b.total_est)}</b></td>
    </tr>` + (isOpen ? inside() : "");
}

/* Добавленный щит. Ведёт себя как сметный: раскрывается и принимает
   позиции — ключ родителя у обоих считается одинаково. */
function addedBoxRow(a, sectionTitle) {
  const boxKey = LEDGER.boxKey(CUR.contract.id, sectionTitle, a.code || a.name);
  const isOpen = openBoxes.has(boxKey);
  const extra = ADDS.items(boxKey);
  const sum = extra.reduce((n, x) =>
    n + ((x.price_est && x.qty && x.status !== "rejected") ? x.price_est * x.qty : 0), 0);

  return `<tr class="box added${isOpen ? " on" : ""}" data-key="${escO(boxKey)}">
      <td><span class="car">▶</span><b>${escO(a.code || "—")}</b>
        <span class="bx-name">${escO(a.name)}</span>
        <span class="badge-add" title="${escO(a.reason)}">сверх сметы</span></td>
      <td class="dim">${escO(a.brand)}</td>
      <td><span class="st-chip ${ADDS.STATUS[a.status].cls}">${
        ADDS.STATUS[a.status].label}</span></td>
      <td class="q">${qty(a.qty)} ${escO(a.unit)}</td>
      <td></td>
      <td class="p"><b>${sum ? money(sum) : "—"}</b></td>
    </tr>` + (isOpen
      // У щита своего журнала нет, но управление им должно быть где-то:
      // раскрыв его, первой строкой показываем зачем, статус и «Убрать».
      ? `<tr class="panel"><td colspan="6"><div class="lg lg-slim">${addedHead(a)}</div></td></tr>`
        + extra.map((x) => itemRow(addedView(x))).join("")
        + addRow("item", boxKey, a.code || a.name, `позицию в ${escO(a.code || a.name)}`)
      : "");
}

/* ── раздел целиком ─────────────────────────────────────── */
function renderSpec() {
  const t = DOC.totals;
  const roll = LEDGER.rollup();
  const ext = ADDS.totals();
  const margin = t.total_est - t.total_buy;

  $o("#objSpec").innerHTML = `
    <div class="spec-top">
      <h3>${escO(CUR.contract.title)}
        <div class="note" style="font-weight:400;margin-top:2.5px">
          ${escO(CUR.object.name)} · ${t.boxes} сборок · ${t.items} позиций${
            roll.touched ? ` · движения по ${roll.touched}` : ""}</div></h3>
      <div class="sums">
        <div>По смете<b class="num">${money(t.total_est)} ₽</b></div>
        <div>Сверх сметы<b class="num ${ext.sum ? "warn" : "dim"}">${
          ext.count ? (ext.sum ? "+" + money(ext.sum) + " ₽" : `${ext.count} поз.`) : "—"}</b>${
          ext.draft ? `<i class="sub">${ext.draft} не согласовано</i>` : ""}</div>
        <div>Закупка<b class="num">${money(t.total_buy)} ₽</b></div>
        <div>Маржа<b class="num ${margin > 0.5 ? "ok" : "dim"}">${
          margin > 0.5 ? money(margin) + " ₽" : "не заполнена"}</b></div>
      </div>
    </div>
    <table>
      <!-- Ширины заданы явно: при раскладке «по содержимому» раскрытие
           щита меняло содержимое и все границы колонок разъезжались. -->
      <colgroup>
        <col><col style="width:119px"><col style="width:101px">
        <col style="width:93.5px"><col style="width:111.5px"><col style="width:106px">
      </colgroup>
      <thead><tr><th>Сборка и позиции</th><th>Марка</th><th>Поставщик</th>
        <th style="text-align:right">План</th><th>Движение</th>
        <th style="text-align:right">Сумма, ₽</th></tr></thead>
      <tbody>${DOC.sections.map((s, si) => {
        const secKey = LEDGER.sectionKey(CUR.contract.id, s.title);
        return `
        <tr class="grp"><td colspan="5">${escO(s.title)}</td>
          <td class="p"><b>${money(s.total_est)}</b></td></tr>
        ${s.boxes.map((b, bi) => boxRow(b, si, bi)).join("")}
        ${ADDS.boxes(secKey).map((a) => addedBoxRow(a, s.title)).join("")}
        ${addRow("box", secKey, s.title, "щит в этот раздел")}`;
      }).join("")}
      </tbody>
    </table>`;

  measureHead();
  wireSpec();
}

/* Шапка договора и строка заголовков прилипают друг под другом, значит
   заголовкам нужен отступ ровно в высоту шапки. Высота эта зависит от
   содержимого — длины названия, отметки «не согласовано», — и мерить её
   один раз нельзя: первая отрисовка идёт, пока раздел ещё скрыт, и
   отдаёт ноль. Поэтому следим за размером, а не замеряем разово. */
let headRO = null;

function measureHead() {
  const head = $o("#objSpec .spec-top");
  if (!head) return;
  const apply = () =>
    $o("#objSpec").style.setProperty("--head-h", head.offsetHeight + "px");
  apply();
  if (headRO) headRO.disconnect();     // прошлая шапка уже выброшена из DOM
  headRO = new ResizeObserver(apply);
  headRO.observe(head);
}

function wireSpec() {
  const root = $o("#objSpec");

  root.querySelectorAll("tr.box").forEach((tr) => {
    tr.addEventListener("click", () => {
      const k = tr.dataset.key;
      openBoxes.has(k) ? openBoxes.delete(k) : openBoxes.add(k);
      renderSpec();
    });
  });

  root.querySelectorAll("tr.item").forEach((tr) => {
    tr.addEventListener("click", (e) => {
      if (e.target.closest(".panel")) return;
      openItem = openItem === tr.dataset.k ? null : tr.dataset.k;
      renderSpec();
    });
  });

  // Внутри панели и на кнопках добавления клики не должны схлопывать строку.
  root.querySelectorAll("tr.panel, tr.addrow").forEach((tr) =>
    tr.addEventListener("click", (e) => e.stopPropagation()));

  root.querySelectorAll(".add-btn").forEach((b) => {
    b.addEventListener("click", () =>
      openAddModal(b.dataset.kind, b.dataset.parent, b.dataset.where));
  });

  wireLedgerForm(root);
  wireAddedActs(root);
}

function wireLedgerForm(root) {
  const add = root.querySelector("[data-add]");
  if (!add) return;
  const box = add.closest(".lg-add");
  const fire = async () => {
    if (add.disabled) return;               // двойной Enter не шлёт дважды
    add.disabled = true;
    const was = add.textContent;
    add.textContent = "Пишу…";
    try {
      await LEDGER.add(add.dataset.add, {
        type: box.querySelector('[data-f="type"]').value,
        qty: box.querySelector('[data-f="qty"]').value,
        note: box.querySelector('[data-f="note"]').value,
      });
      renderSpec();                          // перерисовка вернёт кнопку сама
    } catch (ex) {
      add.disabled = false;
      add.textContent = was;
      const q = box.querySelector('[data-f="qty"]');
      q.classList.add("bad");
      q.value = "";
      q.placeholder = ex.message;
      q.focus();
    }
  };
  add.addEventListener("click", fire);
  box.querySelector('[data-f="qty"]').addEventListener("keydown", (e) => {
    if (e.key === "Enter") fire();
  });

  root.querySelectorAll("[data-del]").forEach((b) => {
    b.addEventListener("click", async () => {
      if (b.disabled) return;
      b.disabled = true;
      try {
        await LEDGER.remove(add.dataset.add, b.dataset.del);
        renderSpec();
      } catch (ex) {
        b.disabled = false;
        b.title = ex.message;                // «Эту запись сделал другой человек»
        b.classList.add("bad");
      }
    });
  });
}

function wireAddedActs(root) {
  /* Отказ сервера показываем текстом рядом с кнопкой. Раньше он уходил
     в подсказку у курсора — то есть практически никуда. */
  const say = (id, text) => {
    const box = root.querySelector(`[data-err="${id}"]`);
    if (!box) return;
    box.textContent = text;
    box.hidden = false;
  };

  root.querySelectorAll("[data-st]").forEach((s) => {
    const was = s.value;
    s.addEventListener("change", async () => {
      s.disabled = true;
      try {
        await ADDS.setStatus(s.dataset.st, s.value);
        renderSpec();
      } catch (ex) {
        s.value = was;
        s.disabled = false;
        say(s.dataset.st, ex.message);
      }
    });
  });

  root.querySelectorAll("[data-rm]").forEach((b) => {
    b.addEventListener("click", async () => {
      if (b.disabled) return;
      b.disabled = true;
      const was = b.textContent;
      b.textContent = "Убираю…";
      try {
        await ADDS.remove(b.dataset.rm);
        openItem = null;
        renderSpec();
      } catch (ex) {
        b.disabled = false;
        b.textContent = was;
        say(b.dataset.rm, ex.message);
      }
    });
  });
}

/* ── окно добавления ────────────────────────────────────── */
function openAddModal(kind, parentKey, where) {
  addFor = { kind, parentKey };
  const box = kind === "box";
  $o("#adTitle").textContent = box ? "Новый щит" : "Новая позиция";
  $o("#adWhere").textContent = box ? `в раздел «${where}»` : `в ${where}`;
  $o("#adCodeW").hidden = !box;
  ["#adCode", "#adName", "#adBrand", "#adUnit", "#adQty", "#adPrice", "#adReason"]
    .forEach((s) => { $o(s).value = ""; });
  $o("#adUnit").value = box ? "компл." : "шт.";
  $o("#adErr").hidden = true;
  $o("#addModal").hidden = false;
  $o(box ? "#adCode" : "#adName").focus();
}

function wireAddModal() {
  const close = () => { $o("#addModal").hidden = true; };
  $o("#adCancel").addEventListener("click", close);
  $o("#addModal").addEventListener("click", (e) => {
    if (e.target === $o("#addModal")) close();
  });

  $o("#adOk").addEventListener("click", async () => {
    const btn = $o("#adOk");
    if (btn.disabled || !addFor) return;
    btn.disabled = true;
    const was = btn.textContent;
    btn.textContent = "Сохраняю…";
    try {
      const a = await ADDS.create({
        kind: addFor.kind, parent_key: addFor.parentKey,
        code: $o("#adCode").value, name: $o("#adName").value,
        brand: $o("#adBrand").value, unit: $o("#adUnit").value,
        qty: $o("#adQty").value, price_est: $o("#adPrice").value,
        reason: $o("#adReason").value,
      });
      close();
      // Раскрываем то, куда положили, иначе добавленное не видно.
      if (addFor.kind === "item") openBoxes.add(addFor.parentKey);
      else openBoxes.add(LEDGER.boxKey(CUR.contract.id,
        addFor.parentKey.slice(CUR.contract.id.length + 1), a.code || a.name));
      renderSpec();
    } catch (ex) {
      $o("#adErr").textContent = ex.message;
      $o("#adErr").hidden = false;
    } finally {
      btn.disabled = false;
      btn.textContent = was;
    }
  });
}

/* ── запуск ─────────────────────────────────────────────── */
async function initObjects() {
  try {
    wireAddModal();
    // Первая отрисовка идёт, пока раздел скрыт, и высота шапки равна нулю.
    // Наблюдатель за размером на переход display:none -> видимый не
    // срабатывает, поэтому ловим сам момент показа раздела.
    const sec = document.getElementById("sec-obj");
    if (sec) {
      new MutationObserver(measureHead).observe(sec, { attributeFilter: ["hidden"] });
    }
    await loadCatalog();
    const obj = CATALOG.objects[0];
    await openContract(obj, obj.contracts.find((c) => c.id === "eom4") || obj.contracts[0]);
  } catch (e) {
    $o("#objSpec").innerHTML = errBox(e);
  }
}
