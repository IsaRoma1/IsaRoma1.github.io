/* «Снабжение» → «Поставщики и группы материалов» (заказчик, 12.10.2026).

   «Вкладка поставщики и группы материалов. Группы — из двух блоков,
   электрика и слаботочка. Поставщиков из справочника — сюда, удобно
   править: поставщик начал возить новую группу — сопоставили; группы
   поменялись — укрупнили или разбили. В итоге — понятный список
   поставщиков, и к каждому подтянуты группы, которые он возит».
   Третий блок «Общестрой» — крепёж, металл, СИЗ: в справочнике заказчика
   таких две трети (пользователь, 12.10.2026).

   Поставщики — те же контрагенты, что в «Справочниках»: справочник один.
   Группы, кто что возит и загрузка справочника — ssup_*, mg_*, mb_* в
   api.py; первое сопоставление по описанию продукции — deploy/mat_groups.py.
   По группам строится запрос поставщикам в проработке (snab.js). */
"use strict";

const SUPS = (() => {
  const $n = (s, r) => (r || document).querySelector(s);
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
    up: svg('<path d="M12 16V4M7 9l5-5 5 5M4 17v2a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-2"/>'),
    down: svg('<path d="M12 4v11M7.5 10.5 12 15l4.5-4.5M4.5 20h15"/>'),
    cog: svg('<circle cx="12" cy="12" r="3"/><path d="M12 3.5v2.2M12 18.3v2.2M3.5 12h2.2M18.3 12h2.2M6 6l1.6 1.6M16.4 16.4 18 18M6 18l1.6-1.6M16.4 7.6 18 6"/>'),
    trash: svg('<path d="M4.5 6.5h15M9.5 6.5V4.8A1.3 1.3 0 0 1 10.8 3.5h2.4a1.3 1.3 0 0 1 1.3 1.3v1.7M6.5 6.5l.9 12.2A1.5 1.5 0 0 0 8.9 20h6.2a1.5 1.5 0 0 0 1.5-1.3l.9-12.2"/>'),
    above: svg('<path d="M12 18V6M7 11l5-5 5 5"/>'),
    below: svg('<path d="M12 6v12M7 13l5 5 5-5"/>'),
    dots: svg('<circle cx="6" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="18" cy="12" r="1.3"/>'),
    mail: svg('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3.5 6.5 12 13l8.5-6.5"/>'),
    x: svg('<path d="M7 7l10 10M17 7 7 17"/>'),
  };

  let D = null;          // {rows, blocks, groups, edit, cnt_edit}
  let Q = "";            // поиск
  let G = "";            // отбор: "" все, "none" без групп, "auto" проверить подбор, id группы
  let host = null;

  /* Короткое имя группы для плашек: без пояснения в скобках в конце —
     «Светильники тех. помещений, МОП + фасад». */
  const cut = (name) => String(name || "").replace(/\s*\([^()]*\)\s*$/, "") || name;
  // «Железо (уголок…)» и «Железо (лотки…)» — без скобок совпали бы: таким — полное имя.
  const short = (name) => {
    const c = cut(name);
    return D && D.groups.filter((g) => cut(g.name) === c).length > 1 ? name : c;
  };
  const blockCls = (id) => (["el", "ss", "gen"].includes(id) ? "b-" + id : "b-x");
  const grp = (id) => (D.groups || []).find((g) => g.id === id);
  const prop = (r, n) => ((r.props || []).find((p) => p.n === n) || {}).v || "";
  /* Контакты поставщика (заказчик, 14.10.2026: «у одного поставщика —
     несколько контактных лиц, телефон, e-mail»): первый — основной, в
     полях contact/phone/email, остальные — списком contacts. */
  const contactsOf = (r) => [{ name: r.contact || "", phone: r.phone || "", email: r.email || "" }]
    .concat(r.contacts || []).filter((x) => x.name || x.phone || x.email);
  const ctLine = (x) => [x.name, x.phone, x.email].filter(Boolean).join(", ");

  async function show(el) {
    host = el;
    if (!D) host.innerHTML = `<div class="pg"><div class="pg-body"><div class="pg-empty"><b>Загружаю поставщиков…</b></div></div></div>`;
    try {
      D = await AUTH.api("GET", "/supply-suppliers");
    } catch (e) {
      host.innerHTML = `<div class="pg"><div class="pg-note bad">${esc(e.message)}</div></div>`;
      return;
    }
    if (G && !["none", "auto"].includes(G) && !grp(G)) G = "";
    render();
  }

  function rowsShown() {
    const q = Q.trim().toLowerCase();
    return D.rows.filter((r) => {
      if (G === "none" && r.groups.length) return false;
      if (G === "auto" && !r.groups.some((g) => g.origin === "auto")) return false;
      if (G && !["none", "auto"].includes(G) && !r.groups.some((g) => g.id === G)) return false;
      if (!q) return true;
      return [r.name, r.note, ...contactsOf(r).map(ctLine), ...(r.props || []).map((p) => p.v)]
        .some((x) => String(x || "").toLowerCase().includes(q));
    });
  }

  function chips(r, max) {
    const gs = r.groups.map((x) => Object.assign({ origin: x.origin }, grp(x.id))).filter((g) => g.id);
    if (!gs.length) return `<span class="sup-none">без групп</span>`;
    const shown = gs.slice(0, max);
    const rest = gs.length - shown.length;
    return shown.map((g) => `<span class="sup-chip ${blockCls(g.block)}${g.origin === "auto" ? " auto" : ""}"
      title="${esc(g.name)}${g.origin === "auto" ? " — подобрано по описанию, проверьте" : ""}">${esc(short(g.name))}</span>`).join("")
      + (rest > 0 ? `<span class="sup-more" title="${esc(gs.slice(max).map((g) => g.name).join("\n"))}">+${rest}</span>` : "");
  }

  function sideHtml() {
    const n = (f) => D.rows.filter(f).length;
    const item = (id, name, cnt, cls) => `<button type="button" class="sup-si${G === id ? " on" : ""}${cls ? " " + cls : ""}"
      data-g="${esc(id)}" title="${esc(name)}"><span>${esc(name)}</span><i>${cnt}</i></button>`;
    return `
      <nav class="sup-side" aria-label="Группы материалов">
        ${item("", "Все поставщики", D.rows.length)}
        ${item("none", "Без групп", n((r) => !r.groups.length), "warn")}
        ${n((r) => r.groups.some((g) => g.origin === "auto"))
          ? item("auto", "Проверить подбор", n((r) => r.groups.some((g) => g.origin === "auto")), "auto") : ""}
        ${D.blocks.map((b) => {
          const gs = D.groups.filter((g) => g.block === b.id);
          return `<h4 class="${blockCls(b.id)}">${esc(b.name)}</h4>${gs.map((g) => item(g.id, g.name, g.n, blockCls(b.id))).join("")
            || `<span class="sup-si-empty">Групп нет</span>`}`;
        }).join("")}
      </nav>`;
  }

  function tableHtml(rows) {
    if (!rows.length) {
      return `<div class="pg-empty"><b>${D.rows.length ? "Под отбор никто не подошёл" : "Поставщиков пока нет"}</b>${
        D.rows.length ? "Снимите отбор слева или очистите поиск."
          : "Загрузите справочник поставщиков книгой Excel — кнопкой «Загрузить справочник»: поставщики встанут "
            + "сюда, группы подберутся по описанию продукции. Или заведите поставщика руками."}</div>`;
    }
    return `
      <table class="tbl sx-tbl sup-tbl" style="--tbl-min:900px">
        <colgroup><col class="c-name"><col class="c-grp"><col class="c-who"><col class="c-def"><col class="c-dlv"></colgroup>
        <thead><tr><th>Поставщик и что возит</th><th>Группы</th><th>Контакты</th>
          <th>Договор${tip("Отсрочка платежа — условие поставщика: по ней считается приведённая стоимость в проработке.")}</th>
          <th>Доставка</th></tr></thead>
        <tbody>${rows.map((r) => `<tr class="go" data-id="${esc(r.id)}">
          <td><span class="t-name">${esc(r.name)}</span>${r.note ? `<i class="t-sub sup-what" title="${esc(r.note)}">${esc(r.note)}</i>` : ""}</td>
          <td><div class="sup-chips">${chips(r, 4)}</div></td>
          <td>${(() => {
            const cs = contactsOf(r), c0 = cs[0] || {};
            return `<span class="sup-who-l" title="${esc(cs.map(ctLine).join("\n"))}"><span class="sup-who">${
              esc(c0.name || c0.phone || "—")}</span>${cs.length > 1
              ? `<i class="sup-ct-n">+${cs.length - 1}</i>` : ""}</span>${c0.phone
              ? `<i class="t-sub">${esc(c0.phone)}</i>` : ""}`;
          })()}</td>
          <td>${r.defer !== null && r.defer !== undefined ? `<b>${r.defer}</b> дн.` : esc(prop(r, "Договор")) || `<span class="sx-none">—</span>`}</td>
          <td><span class="sup-dlv" title="${esc(prop(r, "Доставка"))}">${esc(prop(r, "Доставка")) || `<span class="sx-none">—</span>`}</span></td>
        </tr>`).join("")}</tbody>
      </table>`;
  }

  function render() {
    if (!host || !D) return;
    const rows = rowsShown();
    const g = grp(G);
    host.innerHTML = `
      <div class="pg sx sup-pg">
        <div class="pg-head sx-head">
          <label class="pg-find sx-q">${ICO.find}<input id="supQ" type="search"
            placeholder="Поставщик, продукция, контакт, почта" value="${esc(Q)}" autocomplete="off"></label>
          <span class="sup-cnt">${g ? esc(short(g.name)) + " — " : ""}${rows.length} ${plural(rows.length, "поставщик", "поставщика", "поставщиков")}</span>
          <span class="grow"></span>
          ${D.edit ? `<button type="button" class="btn-ghost sm" id="supGroups" title="Переименовать, объединить, разбить группы, завести новые">${ICO.cog}Группы</button>
            <label class="btn-ghost sm sup-upl" title="Справочник поставщиков книгой Excel: лист «Общие» с колонками «Наименование», «Контакты», «Договор», «Продукция». Новые поставщики заведутся, у найденных допишется пустое, группы подберутся по описанию продукции"
              >${ICO.up}Загрузить справочник<input type="file" id="supFile" accept=".xlsx,.xlsm" hidden></label>` : ""}
          <button type="button" class="btn-ghost sm" id="supXls" title="${g ? "Поставщики этой группы" : "Все поставщики с группами"} книгой Excel">${ICO.down}Выгрузить</button>
          ${D.cnt_edit ? `<button type="button" class="btn-brand sm" id="supNew">${ICO.plus}Поставщик</button>` : ""}
          ${tip("Кто какие группы материалов возит. В проработке объекта по группе собирается запрос "
            + "поставщикам — только тем, кто её возит. Пунктирная плашка — группа подобрана по описанию "
            + "из справочника: откройте поставщика, проверьте и сохраните.")}
        </div>
        <div class="pg-body sup-body">
          ${sideHtml()}
          <div class="sup-main">${tableHtml(rows)}</div>
        </div>
      </div>`;
    wire();
  }

  function wire() {
    const q = $n("#supQ", host);
    q.addEventListener("input", () => {
      Q = q.value;
      $n(".sup-main", host).innerHTML = tableHtml(rowsShown());
      wireRows();
      const n = rowsShown().length, g = grp(G);
      $n(".sup-cnt", host).textContent = `${g ? short(g.name) + " — " : ""}${n} ${plural(n, "поставщик", "поставщика", "поставщиков")}`;
    });
    host.querySelectorAll(".sup-si[data-g]").forEach((b) => b.addEventListener("click", () => {
      G = b.dataset.g;
      render();
    }));
    const file = $n("#supFile", host);
    if (file) {
      file.addEventListener("change", () => {
        const f = file.files && file.files[0];
        file.value = "";
        if (f) importBook(f);
      });
    }
    if ($n("#supGroups", host)) $n("#supGroups", host).addEventListener("click", groupsEditor);
    if ($n("#supNew", host)) $n("#supNew", host).addEventListener("click", () => card(null));
    $n("#supXls", host).addEventListener("click", (e) => DL.save("/api/supply-suppliers/xlsx"
      + (grp(G) ? "?group=" + encodeURIComponent(G) : ""), { btn: e.currentTarget })
      .catch((err) => ASK.alert(err.message, { title: "Не вышло" })));
    wireRows();
  }

  function wireRows() {
    host.querySelectorAll("tr.go[data-id]").forEach((tr) => tr.addEventListener("click", () => {
      card(D.rows.find((r) => r.id === tr.dataset.id));
    }));
  }

  /* ── карточка поставщика ─────────────────────────────────── */
  const OWN_PROPS = ["Договор", "Доставка"];

  function card(r) {
    const isNew = !r;
    const cur = r || { name: "", inn: "", contact: "", phone: "", email: "", address: "",
      note: "", defer_days: null, contract_number: "", contract_date: "", props: [], groups: [] };
    const on = new Set((cur.groups || []).map((g) => g.id));
    const auto = (cur.groups || []).some((g) => g.origin === "auto");
    const rest = (cur.props || []).filter((p) => !OWN_PROPS.includes(p.n));
    const box = document.createElement("div");
    box.className = "pf-modal";
    const fld = (k, label, attrs) => `<label class="fld"><span>${label}</span><input data-k="${k}" value="${esc(cur[k])}"
      autocomplete="off"${attrs || ""}${D.cnt_edit ? "" : " readonly"}></label>`;
    box.innerHTML = `
      <div class="pf-crop sup-card" role="dialog" aria-label="Поставщик">
        <div class="sup-card-h"><h3>${isNew ? "Новый поставщик" : esc(cur.name)}</h3>
          ${auto ? `<span class="sup-auto-note">Группы подобраны по описанию из справочника — проверьте и сохраните</span>` : ""}</div>
        <div class="sup-card-b">
          <div class="sup-card-f">
            ${fld("name", "Название", ' maxlength="200"')}
            ${fld("inn", "ИНН", ' inputmode="numeric" maxlength="12"')}
            <label class="fld"><span>Что возит — как в справочнике</span><textarea data-k="note" rows="2"${D.cnt_edit ? "" : " readonly"}
              >${esc(cur.note)}</textarea></label>
            <div class="sup-cts">
              <div class="sup-cts-h"><span>Контакты</span>${tip("Запрос по группе уходит на все почты поставщика. Первый контакт — основной.")}
                <span class="grow"></span>
                ${D.cnt_edit ? `<button type="button" class="lnk sup-ct-add" id="supCtAdd">${ICO.plus}Контакт</button>` : ""}</div>
              <div class="sup-cts-l" id="supCts"></div>
            </div>
            <div class="sup-2">
              <label class="fld"><span>Отсрочка платежа, дней</span><input data-k="defer_days" type="number" min="0" max="3650"
                value="${esc(cur.defer_days ?? cur.defer ?? "")}"${D.cnt_edit ? "" : " readonly"}></label>
              <label class="fld"><span>Доставка</span><input data-p="Доставка" value="${esc(prop(cur, "Доставка"))}"
                placeholder="привозят / забираем"${D.cnt_edit ? "" : " readonly"}></label>
            </div>
            <div class="sup-2">
              ${fld("contract_number", "Номер договора", ' maxlength="120"')}
              <label class="fld"><span>Дата договора</span><input data-k="contract_date" type="date"
                value="${esc(cur.contract_date || "")}"${D.cnt_edit ? "" : " readonly"}></label>
            </div>
            ${fld("address", "Адрес")}
            ${rest.length ? `<dl class="sup-props">${rest.map((p) => `<dt>${esc(p.n)}</dt><dd title="${esc(p.v)}">${esc(p.v)}</dd>`).join("")}</dl>` : ""}
          </div>
          <div class="sup-card-g">
            <div class="sup-card-gh">Какие группы возит${tip("Запрос по группе в проработке уйдёт только тем, у кого она отмечена.")}</div>
            ${D.blocks.map((b) => `<div class="sup-gb ${blockCls(b.id)}"><h4>${esc(b.name)}</h4>${D.groups
              .filter((g) => g.block === b.id).map((g) => `<label class="sup-gc">
                <input type="checkbox" data-g="${esc(g.id)}"${on.has(g.id) ? " checked" : ""}${D.edit ? "" : " disabled"}>
                <span>${esc(g.name)}</span></label>`).join("") || `<span class="sup-si-empty">Групп нет</span>`}</div>`).join("")}
          </div>
        </div>
        <div class="pf-note bad" id="supErr" hidden></div>
        <div class="pf-modal-foot">
          ${!isNew && D.cnt_edit ? `<button type="button" class="btn-ghost sm warn" id="supDel">${ICO.trash}Убрать поставщика</button>
            <span class="grow"></span>` : ""}
          <button type="button" class="btn ghost" id="supNo">Закрыть</button>
          ${D.cnt_edit || D.edit ? `<button type="button" class="btn" id="supOk">Сохранить</button>` : ""}
        </div>
      </div>`;
    const close = () => { document.removeEventListener("keydown", key); box.remove(); };
    const key = (e) => { if (e.key === "Escape") close(); };
    const err = (t) => { const e = $n("#supErr", box); e.textContent = t; e.hidden = !t; };
    // Строки контактов добавляем по одной: перерисовка сбросила бы набранное в соседних.
    const cts = $n("#supCts", box);
    const addCt = (x) => {
      const line = document.createElement("div");
      line.className = "sup-ct";
      const ro = D.cnt_edit ? "" : " readonly";
      line.innerHTML = `<input data-c="name" value="${esc(x.name)}" placeholder="Контактное лицо" autocomplete="off"${ro}>
        <input data-c="phone" value="${esc(x.phone)}" placeholder="Телефон" inputmode="tel" autocomplete="off"${ro}>
        <input data-c="email" value="${esc(x.email)}" placeholder="E-mail" inputmode="email" autocomplete="off"${ro}>
        ${D.cnt_edit ? `<button type="button" class="ico warn" title="Убрать контакт">${ICO.x}</button>` : ""}`;
      const del = line.querySelector("button");
      if (del) del.addEventListener("click", () => { line.remove(); if (!cts.children.length) addCt({ name: "", phone: "", email: "" }); });
      cts.appendChild(line);
      return line;
    };
    (contactsOf(cur).length ? contactsOf(cur) : [{ name: "", phone: "", email: "" }]).forEach(addCt);
    if ($n("#supCtAdd", box)) {
      $n("#supCtAdd", box).addEventListener("click", () => addCt({ name: "", phone: "", email: "" }).querySelector("input").focus());
    }
    const save = async () => {
      const body = {};
      box.querySelectorAll("[data-k]").forEach((x) => { body[x.dataset.k] = x.value.trim(); });
      if (!body.name) { err("Впишите название поставщика"); return; }
      const list = [...cts.querySelectorAll(".sup-ct")].map((line) => Object.fromEntries(
        [...line.querySelectorAll("[data-c]")].map((i) => [i.dataset.c, i.value.trim()])))
        .filter((x) => x.name || x.phone || x.email);
      const main = list[0] || { name: "", phone: "", email: "" };
      Object.assign(body, { contact: main.name, phone: main.phone, email: main.email, contacts: list.slice(1) });
      // Старое свободное поле «Договор» сохраняем для уже загруженных книг.
      const props = (cur.props || []).map((p) => Object.assign({}, p));
      box.querySelectorAll("[data-p]").forEach((x) => {
        const v = x.value.trim(), i = props.findIndex((p) => p.n === x.dataset.p);
        if (i >= 0 && v) props[i].v = v;
        else if (i >= 0) props.splice(i, 1);
        else if (v) props.push({ n: x.dataset.p, v });
      });
      body.props = props;
      const groups = [...box.querySelectorAll("[data-g]:checked")].map((x) => x.dataset.g);
      const ok = $n("#supOk", box);
      ok.disabled = true;
      try {
        let id = cur.id;
        if (D.cnt_edit) {
          if (isNew) id = (await AUTH.api("POST", "/counterparties", Object.assign({ kind: "supplier" }, body))).id;
          else await AUTH.api("PATCH", "/counterparties/" + encodeURIComponent(id), body);
        }
        D = D.edit && id ? await AUTH.api("POST", "/supply-suppliers/" + encodeURIComponent(id) + "/groups", { groups })
          : await AUTH.api("GET", "/supply-suppliers");
        close();
        render();
      } catch (e) {
        err(e.message);
        ok.disabled = false;
      }
    };
    $n("#supNo", box).addEventListener("click", close);
    if ($n("#supOk", box)) $n("#supOk", box).addEventListener("click", save);
    if ($n("#supDel", box)) {
      $n("#supDel", box).addEventListener("click", async () => {
        if (!(await ASK.confirm(`Убрать поставщика «${cur.name}»? Он пропадёт и из «Контрагентов»;`
          + " цены его счетов в проработках останутся."))) return;
        try {
          await AUTH.api("DELETE", "/counterparties/" + encodeURIComponent(cur.id));
          D = await AUTH.api("GET", "/supply-suppliers");
          close();
          render();
        } catch (e) { err(e.message); }
      });
    }
    box.addEventListener("mousedown", (e) => { if (e.target === box) close(); });
    document.addEventListener("keydown", key);
    document.body.appendChild(box);
    const first = $n("[data-k=name]", box);
    if (isNew && first) first.focus();
  }

  /* ── группы: переименовать, объединить, разбить, порядок ──── */
  function groupsEditor() {
    const box = document.createElement("div");
    box.className = "pf-modal";
    let menu = null;
    const closeMenu = () => { if (menu) { menu.remove(); menu = null; } };
    const call = async (method, url, body) => {
      try {
        const out = await AUTH.api(method, url, body);
        Object.assign(D, { blocks: out.blocks, groups: out.groups });
        paint();
        return out;
      } catch (e) {
        ASK.alert(e.message, { title: "Не вышло" });
        return null;
      }
    };
    const orderAll = (gid, dir) => {
      const g = grp(gid);
      const list = D.groups.filter((x) => x.block === g.block);
      const i = list.findIndex((x) => x.id === gid), j = i + dir;
      if (j < 0 || j >= list.length) return;
      [list[i], list[j]] = [list[j], list[i]];
      const ids = D.blocks.flatMap((b) => (b.id === g.block ? list : D.groups.filter((x) => x.block === b.id)).map((x) => x.id));
      call("POST", "/mat-groups/order", { ids });
    };
    const pick = (title, options) => new Promise((resolve) => {
      const p = document.createElement("div");
      p.className = "pf-modal";
      p.innerHTML = `<div class="pf-crop sup-pick" role="dialog" aria-label="${esc(title)}"><h3>${esc(title)}</h3>
        <div class="sup-pick-l">${options.map((o) => o.head ? `<h4>${esc(o.head)}</h4>`
          : `<button type="button" data-v="${esc(o.id)}">${esc(o.name)}</button>`).join("")}</div>
        <div class="pf-modal-foot"><button type="button" class="btn ghost" data-no>Отмена</button></div></div>`;
      const esc_ = (e) => { if (e.key === "Escape") { e.stopPropagation(); done(null); } };
      const done = (v) => { document.removeEventListener("keydown", esc_, true); p.remove(); resolve(v); };
      document.addEventListener("keydown", esc_, true);
      p.querySelectorAll("[data-v]").forEach((b) => b.addEventListener("click", () => done(b.dataset.v)));
      $n("[data-no]", p).addEventListener("click", () => done(null));
      p.addEventListener("mousedown", (e) => { if (e.target === p) done(null); });
      document.body.appendChild(p);
    });
    const more = (btn, gid) => {
      closeMenu();
      const g = grp(gid);
      menu = document.createElement("div");
      menu.className = "sup-menu";
      menu.innerHTML = `
        <button type="button" data-a="split">Разбить — завести рядом новую</button>
        <button type="button" data-a="merge">Объединить с другой…</button>
        <button type="button" data-a="move">Перенести в другой блок…</button>
        <button type="button" data-a="del" class="warn">Убрать группу</button>`;
      const r = btn.getBoundingClientRect();
      menu.style.top = Math.round(r.bottom + 4) + "px";
      menu.style.left = Math.round(Math.max(8, r.right - 240)) + "px";
      menu.querySelectorAll("[data-a]").forEach((b) => b.addEventListener("click", async () => {
        closeMenu();
        const a = b.dataset.a;
        if (a === "split") {
          const name = await ASK.prompt(`Новая группа рядом с «${g.name}». Поставщики скопируются — у кого новое не возят, снимите`, "");
          if (name && name.trim()) call("POST", "/mat-groups/" + encodeURIComponent(gid) + "/split", { name: name.trim() });
        } else if (a === "merge") {
          const opts = D.blocks.flatMap((bl) => {
            const gs = D.groups.filter((x) => x.block === bl.id && x.id !== gid);
            return gs.length ? [{ head: bl.name }].concat(gs) : [];
          });
          const into = await pick(`Куда влить «${short(g.name)}»`, opts);
          if (into && await ASK.confirm(`Объединить «${short(g.name)}» с «${short(grp(into).name)}»? Поставщики и позиции`
            + " перейдут туда, группа «" + short(g.name) + "» уйдёт.")) {
            call("POST", "/mat-groups/" + encodeURIComponent(gid) + "/merge", { into });
          }
        } else if (a === "move") {
          const to = await pick(`Перенести «${short(g.name)}» в блок`, D.blocks.filter((bl) => bl.id !== g.block));
          if (to) call("PATCH", "/mat-groups/" + encodeURIComponent(gid), { block: to });
        } else if (a === "del") {
          if (await ASK.confirm(`Убрать группу «${short(g.name)}»? У ${g.n} ${plural(g.n, "поставщика", "поставщиков", "поставщиков")}`
            + " она снимется; позиции проработок с ней снова подберут группу сами.")) {
            call("DELETE", "/mat-groups/" + encodeURIComponent(gid));
          }
        }
      }));
      document.body.appendChild(menu);
    };
    const paint = () => {
      closeMenu();
      box.innerHTML = `
        <div class="pf-crop sup-ge" role="dialog" aria-label="Группы материалов">
          <div class="sup-ge-h"><h3>Группы материалов</h3>
            <span class="sit-hint">Название — щелчком. Укрупнить — «Объединить», разбить — завести рядом новую с теми же поставщиками.</span>
            <span class="grow"></span>
            <button type="button" class="btn-ghost sm" id="geBlock">${ICO.plus}Блок</button></div>
          <div class="sup-ge-cols">${D.blocks.map((b) => {
            const gs = D.groups.filter((g) => g.block === b.id);
            return `<section class="sup-ge-col ${blockCls(b.id)}">
              <header><button type="button" class="sup-ge-bn" data-brn="${esc(b.id)}" title="Переименовать блок">${esc(b.name)}</button>
                <i>${gs.length}</i>${gs.length ? "" : `<button type="button" class="ico warn" data-bdel="${esc(b.id)}"
                  title="Убрать пустой блок">${ICO.trash}</button>`}</header>
              <ol>${gs.map((g, i) => `<li>
                <button type="button" class="sup-ge-n" data-rn="${esc(g.id)}" title="${esc(g.name)} — переименовать">${esc(g.name)}</button>
                <i title="Поставщиков">${g.n}</i>
                <button type="button" class="ico" data-mv="${esc(g.id)}" data-dir="-1"${i ? "" : " disabled"} title="Выше">${ICO.above}</button>
                <button type="button" class="ico" data-mv="${esc(g.id)}" data-dir="1"${i < gs.length - 1 ? "" : " disabled"} title="Ниже">${ICO.below}</button>
                <button type="button" class="ico" data-more="${esc(g.id)}" title="Разбить, объединить, перенести, убрать">${ICO.dots}</button>
              </li>`).join("")}</ol>
              <button type="button" class="lnk sup-ge-add" data-add="${esc(b.id)}">${ICO.plus}Группа</button>
            </section>`;
          }).join("")}</div>
          <div class="pf-modal-foot"><button type="button" class="btn" id="geOk">Готово</button></div>
        </div>`;
      $n("#geOk", box).addEventListener("click", close);
      $n("#geBlock", box).addEventListener("click", async () => {
        const name = await ASK.prompt("Название нового блока групп", "");
        if (name && name.trim()) call("POST", "/mat-blocks", { name: name.trim() });
      });
      box.querySelectorAll("[data-brn]").forEach((b) => b.addEventListener("click", async () => {
        const bl = D.blocks.find((x) => x.id === b.dataset.brn);
        const name = await ASK.prompt("Название блока", bl.name);
        if (name && name.trim() && name.trim() !== bl.name) call("PATCH", "/mat-blocks/" + encodeURIComponent(bl.id), { name: name.trim() });
      }));
      box.querySelectorAll("[data-bdel]").forEach((b) => b.addEventListener("click", () =>
        call("DELETE", "/mat-blocks/" + encodeURIComponent(b.dataset.bdel))));
      box.querySelectorAll("[data-rn]").forEach((b) => b.addEventListener("click", async () => {
        const g = grp(b.dataset.rn);
        const name = await ASK.prompt("Название группы", g.name);
        if (name && name.trim() && name.trim() !== g.name) call("PATCH", "/mat-groups/" + encodeURIComponent(g.id), { name: name.trim() });
      }));
      box.querySelectorAll("[data-mv]").forEach((b) => b.addEventListener("click", () => orderAll(b.dataset.mv, +b.dataset.dir)));
      box.querySelectorAll("[data-more]").forEach((b) => b.addEventListener("click", (e) => {
        e.stopPropagation();
        more(b, b.dataset.more);
      }));
      box.querySelectorAll("[data-add]").forEach((b) => b.addEventListener("click", async () => {
        const bl = D.blocks.find((x) => x.id === b.dataset.add);
        const name = await ASK.prompt(`Новая группа в блоке «${bl.name}»`, "");
        if (name && name.trim()) call("POST", "/mat-groups", { block: bl.id, name: name.trim() });
      }));
    };
    const close = async () => {
      closeMenu();
      document.removeEventListener("keydown", key);
      document.removeEventListener("mousedown", away, true);
      box.remove();
      await show(host);
    };
    const key = (e) => { if (e.key === "Escape" && !document.querySelector(".dlg-back, .sup-pick")) { if (menu) closeMenu(); else close(); } };
    const away = (e) => { if (menu && !menu.contains(e.target)) closeMenu(); };
    document.addEventListener("keydown", key);
    document.addEventListener("mousedown", away, true);
    box.addEventListener("mousedown", (e) => { if (e.target === box) close(); });
    document.body.appendChild(box);
    paint();
  }

  /* ── загрузка справочника ────────────────────────────────── */
  async function rawPost(url, f) {
    const r = await fetch(url, {
      method: "POST",
      headers: { Authorization: "Bearer " + AUTH.token(), "X-File-Name": encodeURIComponent(f.name),
                 "Content-Type": f.type || "application/octet-stream" },
      body: f,
    });
    let x = null;
    try { x = await r.json(); } catch (e) { /* ответил не сервер приложения */ }
    if (!r.ok) {
      throw new Error((x && x.error) || (r.status === 413 ? "Файл больше, чем принимает сервер"
        : "Не удалось загрузить, ответ сервера " + r.status));
    }
    return x;
  }

  async function importBook(f) {
    let prev;
    try {
      prev = await rawPost("/api/supply-suppliers/import/preview", f);
    } catch (e) {
      ASK.alert(e.message, { title: "Справочник не читается" });
      return;
    }
    const ACT = { new: ["Новый", "new"], update: ["Уже есть — допишем пустое", "upd"], groups: ["Только группы", "grp"] };
    const box = document.createElement("div");
    box.className = "pf-modal";
    box.innerHTML = `
      <div class="pf-crop sup-imp" role="dialog" aria-label="Загрузка справочника поставщиков">
        <h3>Справочник поставщиков — лист «${esc(prev.sheet)}»</h3>
        <div class="sup-imp-kpi">
          <span><b>${prev.new}</b> ${plural(prev.new, "новый", "новых", "новых")}</span>
          <span><b>${prev.update}</b> уже ${plural(prev.update, "есть", "есть", "есть")} в «Контрагентах»</span>
          <span><b>${prev.grouped}</b> с группами</span>
          ${prev.ungrouped ? `<span class="warn"><b>${prev.ungrouped}</b> без групп — назначите руками</span>` : ""}
        </div>
        ${prev.skipped.length ? `<div class="sit-hint sup-imp-skip">Листы ${prev.skipped.map((s) => "«" + esc(s) + "»").join(", ")}
          не загружаются: там услуги, а не материалы.</div>` : ""}
        <div class="sup-imp-body"><table class="tbl sup-imp-tbl">
          <colgroup><col style="width:24%"><col style="width:150px"><col><col style="width:70px"></colgroup>
          <thead><tr><th>Поставщик</th><th>Что будет</th><th>Группы — подобраны по описанию</th><th>Отсрочка</th></tr></thead>
          <tbody>${prev.rows.map((r) => `<tr>
            <td><span class="t-name">${esc(r.name)}</span>${r.products ? `<i class="t-sub" title="${esc(r.products)}">${esc(r.products)}</i>` : ""}</td>
            <td><span class="sup-act ${ACT[r.action][1]}">${ACT[r.action][0]}</span>${r.match && r.match !== r.name
              ? `<i class="t-sub">как «${esc(r.match)}»</i>` : ""}</td>
            <td>${r.keep ? `<span class="sx-none">группы поставлены руками — не трогаем</span>` : r.groups.length
              ? `<div class="sup-chips">${r.groups.map((n) => `<span class="sup-chip auto" title="${esc(n)}">${esc(short(n))}</span>`).join("")}</div>`
              : `<span class="sup-none">не подобрались</span>`}</td>
            <td>${r.defer !== null && r.defer !== undefined ? r.defer + " дн." : ""}</td>
          </tr>`).join("")}</tbody></table></div>
        <div class="pf-note bad" id="impErr" hidden></div>
        <div class="pf-modal-foot">
          <span class="sit-hint grow">Вписанное руками не перебивается: у найденных поставщиков дописывается пустое,
            их группы, если их уже ставили, остаются.</span>
          <button type="button" class="btn ghost" id="impNo">Отмена</button>
          <button type="button" class="btn" id="impOk">Загрузить</button>
        </div>
      </div>`;
    const close = () => box.remove();
    $n("#impNo", box).addEventListener("click", close);
    $n("#impOk", box).addEventListener("click", async (e) => {
      const btn = e.currentTarget;
      btn.disabled = true;
      try {
        const res = await rawPost("/api/supply-suppliers/import", f);
        D = res;
        G = res.grouped ? "auto" : "";
        close();
        render();
        ASK.alert(`Заведено ${res.created} ${plural(res.created, "поставщик", "поставщика", "поставщиков")}, `
          + `дополнено ${res.updated}; группы подобраны у ${res.grouped}`
          + (res.terms ? `, отсрочка записана у ${res.terms}` : "")
          + ". Слева отобраны поставщики с подобранными группами — проверьте их.", { title: "Справочник загружен" });
      } catch (err) {
        const el = $n("#impErr", box);
        el.textContent = err.message;
        el.hidden = false;
        btn.disabled = false;
      }
    });
    box.addEventListener("mousedown", (e) => { if (e.target === box) close(); });
    document.body.appendChild(box);
  }

  /* Данные для запроса в проработке: группы и поставщики. */
  async function data() {
    D = await AUTH.api("GET", "/supply-suppliers");
    return D;
  }

  return { show, data, short, blockCls };
})();
