/* «Справочники» → «Расценки на работы» — расценки заказчиков (правка № 15,
   22.10.2026).

   Заказчик: «справочник, где сохраняются все расценки отдельно по всем
   заказчикам — заведённые руками при расчёте калькуляции и все работы из
   договорных ВДЦ, КЛК, РДЦ; использовать их в расчётах объектов этого
   заказчика». Строки собирает сервер сам (cus_works в api.py): из ведомостей
   вкладки «Договор» и из расценок, вписанных в расчёт. Здесь — смотреть,
   поправить цену и убрать лишнее. Общий прайс работ — по-прежнему в
   «Тендере» → «Параметры для расчёта». */
"use strict";

const CUSWORKS = (() => {
  const $c = (s, r) => (r || document).querySelector(s);
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g,
    (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch]));
  const plural = (n, one, few, many) => {
    const a = Math.abs(n) % 100, b = a % 10;
    if (a > 10 && a < 20) return many;
    if (b > 1 && b < 5) return few;
    return b === 1 ? one : many;
  };
  const day = (iso) => (iso ? iso.slice(8, 10) + "." + iso.slice(5, 7) + "." + iso.slice(0, 4) : "");
  const can = () => AUTH.can(AUTH.current(), "ref_wrk");
  const ICO = {
    find: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="M20.5 20.5 16 16"/></svg>`,
  };
  // Выбранный заказчик помнится в браузере: справочник открывают снова и снова.
  const KEY = "karkas.cwk.cus.v1";
  let cus = (() => { try { return localStorage.getItem(KEY) || ""; } catch (e) { return ""; } })();
  let LIST = [];             // заказчики с расценками
  let DATA = null;           // {customer, rows}
  let q = "";

  async function load() {
    const host = $c("#sec-cwk");
    if (!host) return;
    try {
      LIST = (await AUTH.api("GET", "/works")).customers || [];
    } catch (e) {
      host.innerHTML = `<div class="pg"><div class="pg-body"><div class="pg-empty"><b>Не загрузилось</b>${
        esc(e.message)}</div></div></div>`;
      return;
    }
    if (!LIST.some((x) => x.id === cus)) cus = LIST.length ? LIST[0].id : "";
    DATA = null;
    if (cus) {
      try {
        DATA = await AUTH.api("GET", "/cus-works?customer=" + encodeURIComponent(cus));
      } catch (e) {
        DATA = null;
      }
    }
    render();
  }

  function render() {
    const host = $c("#sec-cwk");
    if (!host) return;
    host.innerHTML = `
      <div class="pg">
        <div class="pg-head">
          <div class="pg-count" id="cwkCount"></div>
          <div class="pg-tools">
            ${LIST.length ? `<select class="role-sel cwk-sel" id="cwkCus" title="Чьи расценки">${LIST.map((x) => `
              <option value="${esc(x.id)}"${x.id === cus ? " selected" : ""}>${esc(x.name)} — ${x.n}</option>`).join("")}
            </select>
            <label class="pg-find">${ICO.find}<input id="cwkQ" placeholder="Работа, раздел или ведомость"
              value="${esc(q)}"></label>` : ""}
          </div>
        </div>
        <p class="cwk-how">Собираются сами: работы из ВДЦ, РДЦ и КЛК, загруженных во вкладку «Договор» объекта,
          и расценки, вписанные руками в расчёт. В расчётах объектов заказчика «Подтянуть работы» берёт их раньше
          общего прайса работ.</p>
        <div class="pg-body" id="cwkBody"></div>
        <div class="pg-note" id="cwkNote" hidden></div>
      </div>`;
    const sel = $c("#cwkCus", host);
    if (sel) {
      sel.addEventListener("change", () => {
        cus = sel.value;
        try { localStorage.setItem(KEY, cus); } catch (e) { /* без памяти */ }
        load();
      });
    }
    const qi = $c("#cwkQ", host);
    if (qi) qi.addEventListener("input", () => { q = qi.value; paint(); });
    paint();
  }

  // Строки заказчика — по источникам: ведомость за ведомостью, расчёты в конце.
  function paint() {
    const body = $c("#cwkBody");
    if (!body) return;
    const count = $c("#cwkCount");
    if (!LIST.length) {
      count.innerHTML = "";
      body.innerHTML = `<div class="pg-empty"><b>Расценок заказчиков пока нет</b>Загрузите ВДЦ, РДЦ или
        КЛК во вкладку «Договор» объекта или впишите расценку в расчёт — она встанет сюда к заказчику объекта.
        Заказчик берётся из карточки объекта.</div>`;
      return;
    }
    const all = (DATA && DATA.rows) || [];
    const s = q.trim().toLowerCase();
    const rows = s ? all.filter((r) => [r.name, r.spec, r.section, r.src_name, r.site].join(" ")
      .toLowerCase().includes(s)) : all;
    count.innerHTML = rows.length === all.length
      ? `<b>${all.length}</b> ${plural(all.length, "расценка", "расценки", "расценок")}`
      : `<b>${rows.length}</b> из ${all.length}`;
    if (!rows.length) {
      body.innerHTML = `<div class="pg-empty"><b>Ничего не нашлось</b>Поищите другим написанием.</div>`;
      return;
    }
    const groups = [];
    for (const r of rows) {
      const k = r.src + "|" + r.src_id + "|" + (r.src === "calc" ? "" : r.src_name);
      let g = groups.find((x) => x.k === (r.src === "calc" ? "calc" : k));
      if (!g) {
        g = { k: r.src === "calc" ? "calc" : k, title: r.src === "calc" ? "Вписаны руками в расчёты" : r.src_name,
              sub: r.src === "calc" ? "" : [r.site, day(r.at)].filter(Boolean).join(" · "), rows: [] };
        groups.push(g);
      }
      g.rows.push(r);
    }
    body.innerHTML = `<table class="tbl cwk-tbl">
      <colgroup><col style="width:24%"><col><col style="width:80px"><col style="width:130px">
        <col style="width:24%"><col style="width:44px"></colgroup>
      <thead><tr><th>Раздел</th><th>Работа</th><th>Ед.</th><th class="num">Расценка, ₽</th><th>Объект расчёта</th><th></th></tr></thead>
      <tbody>${groups.map((g) => `
        <tr class="sec"><td colspan="6" class="sec-name"><span class="sec-in">${esc(g.title)}${
          g.sub ? `<i>${esc(g.sub)}</i>` : ""}<em>${g.rows.length}</em></span></td></tr>
        ${g.rows.map((r) => `<tr data-id="${esc(r.id)}">
          <td class="cwk-sec" title="${esc(r.section)}">${esc(r.section) || '<span class="dim">—</span>'}</td>
          <td class="cwk-name" title="${esc(r.name + (r.spec ? " · " + r.spec : ""))}">${esc(r.name)}${
            r.spec ? `<i>${esc(r.spec)}</i>` : ""}</td>
          <td>${esc(r.unit)}</td>
          <td class="num"><input class="pos-in num" data-f="price" value="${r.price ?? ""}"${can() ? "" : " readonly"}></td>
          <td class="cwk-src" title="${esc(r.src_name)}">${r.src === "calc" ? `${esc(r.site || r.src_name)}${
            r.at ? `<i>${esc(day(r.at))}${r.author ? ", " + esc(r.author) : ""}</i>` : ""}` : ""}</td>
          <td class="acts">${can() ? `<button type="button" class="lnk warn" data-rm title="Убрать расценку">×</button>` : ""}</td>
        </tr>`).join("")}`).join("")}</tbody></table>`;
    wire(body);
  }

  function note(text, bad) {
    const n = $c("#cwkNote");
    if (!n) return;
    n.textContent = text;
    n.classList.toggle("bad", !!bad);
    n.hidden = !text;
  }

  function wire(body) {
    if (!can()) return;
    body.querySelectorAll("input[data-f]").forEach((inp) => {
      inp.dataset.last = inp.value;
      const save = async () => {
        if (inp.value === inp.dataset.last) return;
        inp.classList.remove("bad");
        try {
          const upd = await AUTH.api("PATCH", "/cus-works/" + encodeURIComponent(inp.closest("tr").dataset.id),
                                     { price: inp.value });
          const r = (DATA.rows || []).find((x) => x.id === upd.id);
          if (r) Object.assign(r, upd);
          inp.value = upd.price ?? "";
          inp.dataset.last = inp.value;
        } catch (e) {
          inp.classList.add("bad");
          inp.title = String(e.message);
        }
      };
      inp.addEventListener("change", save);
      inp.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); inp.blur(); } });
    });
    body.querySelectorAll("[data-rm]").forEach((b) => b.addEventListener("click", async () => {
      const id = b.closest("tr").dataset.id;
      const r = (DATA.rows || []).find((x) => x.id === id) || {};
      if (!(await ASK.confirm(`Убрать расценку «${r.name}»?\nВ расчётах заказчика её больше не будет.`,
                              { title: "Расценки на работы", ok: "Убрать", danger: true }))) return;
      try {
        await AUTH.api("DELETE", "/cus-works/" + encodeURIComponent(id));
        await load();
        note(`Расценка «${r.name}» убрана`);
      } catch (e) {
        note("Не вышло: " + e.message, true);
      }
    }));
  }

  return { load };
})();
