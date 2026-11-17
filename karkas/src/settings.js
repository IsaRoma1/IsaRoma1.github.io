/* Настройки расчёта — два числа, по которым считают деньги.

   Наценка по умолчанию идёт в каждый новый документ (у документа
   процент потом свой), ставка НДС — в итоги расчёта и в окно выгрузки.
   Жить им в Справочниках, а не в коде: заказчик назвал 15 % и 22 %, и
   менять их он будет сам, без нас.

   Вид (30.09.2026, пользователь: «поправить всё и улучшить»): прежде
   абзац пояснения и два голых поля стояли вплотную к краю экрана, без
   знака процента, а «Сохранено» появлялось где-то внизу. Теперь — две
   карточки: название с пояснением в ⓘ, крупное число с «−/+» и знаком
   %, живой пример «что это значит в деньгах», своя отметка «Сохранено»
   и «Вернуть 15 %», если число отличается от стандартного.

   С 09.10.2026 у модуля два места (заказчик: «Данные для расчёта —
   Параметры для расчёта; в тендере оставляем наценку и НДС, в финансах —
   % ВКЛ»): «Тендер» показывает наценку и НДС, «Финансы» — ставку ВКЛ.
   Кому какое число менять, решает сервер (поле edit у каждого). */
"use strict";

const SETTINGS = (() => {
  const $t = (s, r) => (r || document).querySelector(s);
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  let DATA = null;
  // Править наценку и НДС — администраторам: они действуют на все новые
  // расчёты сразу; ставку ВКЛ — ещё и «Финансам». Решает сервер — edit у
  // поля; без него (старый ответ) — как раньше, по роли.
  const can = (f) => (f && "edit" in f ? !!f.edit : AUTH.isAdmin(AUTH.current()));
  const tip = (t) => (typeof TIPS === "object" ? TIPS.icon(t) : "");

  const svg = (d) => `<svg viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
  const ICO = {
    markup: svg('<path d="M20.6 13.4 12 22l-9-9V4h9l8.6 8.6a2 2 0 0 1 0 2.8z"/><circle cx="7.6" cy="7.6" r="1.3"/>'),
    vat: svg('<path d="M6 3.5h12v17l-3-1.8-3 1.8-3-1.8-3 1.8z"/><path d="M9 8.5h6M9 12h6M9 15.5h3"/>'),
    minus: svg('<path d="M6 12h12"/>'),
    plus: svg('<path d="M12 6v12M6 12h12"/>'),
    ok: svg('<path d="M5 12.5l4.5 4.5L19 7.5"/>'),
    lock: svg('<rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/>'),
    vkl: svg('<path d="M3.5 9.5 12 4l8.5 5.5"/><path d="M5.5 10v8M10 10v8M14 10v8M18.5 10v8M3.5 20h17"/>'),
  };

  /* Где что показываем: в «Тендере» — наценку и НДС, в «Финансах» —
     ставку ВКЛ. host — куда рисовать: у «Финансов» это узел внутри их
     вкладки, и пока ответ сервера шёл, вкладку могли сменить — тогда
     узла уже нет и рисовать некуда. */
  const VIEWS = {
    tnd: { host: "#sec-set", keys: ["markup", "vat", "elcom_vat"], title: "Настройки расчёта",
           lead: "По ним Трейс считает деньги во всех расчётах. Цены в расчётах — с НДС.",
           lock: "Менять могут администраторы" },
    fin: { host: "#finSet", keys: ["vkl_rate"], title: "Параметры для расчёта",
           lead: "Во что обходятся деньги: по этой ставке «Снабжение» выбирает поставщика, а «Бюджет» берёт цену.",
           lock: "Менять могут администраторы и «Финансы»" },
  };

  /* Что показать у каждого числа: название, для чего, пояснение в ⓘ и
     пример в деньгах. Поле без описания здесь всё равно покажется — с
     подписью, которую прислал сервер. */
  const META = {
    markup: {
      title: "Наценка на материалы",
      sub: "по умолчанию для новых спецификаций",
      ico: ICO.markup,
      tip: "Подставляется в каждую новую спецификацию. Дальше у спецификации свой процент — его "
        + "меняют над таблицей расчёта. Уже загруженные спецификации эта настройка не меняет.",
      // Цены в расчёте — с НДС (13.10.2026): наценка и НДС сверху цены поставщика.
      example: (v) => `Материал за <b>1 000 ₽</b> без НДС в расчёте стоит <b>${
        rub(Math.round(1000 * (1 + v / 100) * (1 + (Number(DATA.values.vat) || 0) / 100) * 100) / 100)}</b> с НДС`,
    },
    vat: {
      title: "Ставка НДС",
      sub: "для итогов расчёта и выгрузки",
      ico: ICO.vat,
      tip: "Цены в расчётах — с НДС (заказчик, 13.10.2026). Цены поставщиков — каталогов, прайсов, "
        + "счетов — без НДС: материал от них считается с наценкой и с этим НДС. Итог расчёта — сумма с "
        + "НДС, налог в нём — «в том числе», без НДС — делением. Меняется сразу везде, кроме "
        + "зафиксированных версий расчёта.",
      example: (v) => `Итог <b>${rub(100000 * (1 + v / 100))}</b> с НДС — в том числе НДС <b>${
        rub(Math.round(100000 * v) / 100)}</b>`,
    },
    /* Цены Элкома (13.10.2026): с НДС ли они в выгрузке, документация не
       говорит — переключатель; записанные цены пересчитываются сразу. */
    elcom_vat: {
      title: "Цены Элкома",
      sub: "как они приходят из выгрузки Элкома",
      ico: ICO.vat,
      tip: "Цены Русского Света и ЭТМ приходят без НДС (проверено) — Трейс прибавляет НДС сам. "
        + "У Элкома документация не говорит. Посмотрите в личном кабинете Элкома, с НДС ли цены, и "
        + "выберите: с НДС — Трейс его снимет и прибавит заново, как у всех. Уже записанные цены "
        + "Элкома пересчитаются сразу.",
      choice: [[0, "без НДС"], [1, "с НДС"]],
    },
    /* ВКЛ — возобновляемая кредитная линия, не вклад (заказчик, 09.10.2026). */
    vkl_rate: {
      title: "% ВКЛ",
      sub: "ставка возобновляемой кредитной линии, % годовых",
      ico: ICO.vkl,
      tip: "Отсрочка платежа — это деньги, которые не пришлось брать в кредитной линии. «Снабжение» "
        + "сравнивает поставщиков по приведённой стоимости: цена − цена × % ВКЛ × дни отсрочки / 365. "
        + "Меняется сразу во всех проработках и в бюджете.",
      example: (v) => `Отсрочка <b>30 дней</b> по счёту на <b>100 000 ₽</b> экономит <b>${
        rub(Math.round(100000 * v / 100 * 30 / 365 * 100) / 100)}</b>`,
    },
  };

  const rub = (n) => Number(n).toLocaleString("ru-RU", { maximumFractionDigits: 2 }) + " ₽";
  const num = (s) => {
    const v = parseFloat(String(s ?? "").replace(",", ".").trim());
    return Number.isFinite(v) ? v : null;
  };
  const show = (v) => String(v).replace(".", ",");

  async function load(view) {
    try {
      DATA = await AUTH.api("GET", "/settings");
    } catch (e) {
      DATA = { error: e.message };
    }
    render(VIEWS[view] ? view : "tnd");
  }

  /* Переключатель из двух значений — вместо числа (цены Элкома). */
  function choiceHtml(f, m) {
    const v = Number(DATA.values[f.id]);
    const edit = can(f);
    return `
      <section class="stc" data-card="${esc(f.id)}"${edit ? " data-edit" : ""} data-choice>
        <div class="stc-h">
          <span class="stc-ic">${m.ico}</span>
          <span class="stc-t"><b>${esc(m.title)}${m.tip ? tip(m.tip) : ""}</b>${m.sub ? `<i>${esc(m.sub)}</i>` : ""}</span>
        </div>
        <div class="seg stc-seg" role="radiogroup" aria-label="${esc(m.title)}">${m.choice.map(([k, t]) =>
          `<button type="button" class="seg-b${v === k ? " on" : ""}" data-pick="${k}" aria-pressed="${v === k}"${
            edit ? "" : " disabled"}>${esc(t)}</button>`).join("")}</div>
        <div class="stc-foot"><span class="stc-st" data-st></span></div>
      </section>`;
  }

  function cardHtml(f) {
    const m = META[f.id] || { title: f.label, sub: "", ico: ICO.markup, tip: "", example: null };
    if (m.choice) return choiceHtml(f, m);
    const v = DATA.values[f.id];
    const edit = can(f);
    return `
      <section class="stc" data-card="${esc(f.id)}"${edit ? " data-edit" : ""}>
        <div class="stc-h">
          <span class="stc-ic">${m.ico}</span>
          <span class="stc-t"><b>${esc(m.title)}${m.tip ? tip(m.tip) : ""}</b>${m.sub ? `<i>${esc(m.sub)}</i>` : ""}</span>
        </div>
        <div class="stc-val">
          ${edit ? `<button type="button" class="stc-step" data-step="-1" aria-label="Меньше на 1">${ICO.minus}</button>` : ""}
          <label class="stc-in">
            <input id="set-${esc(f.id)}" data-set="${esc(f.id)}" value="${esc(show(v))}" inputmode="decimal"
              autocomplete="off" aria-label="${esc(m.title)}, %"${edit ? "" : " readonly"}
              data-last="${esc(show(v))}" data-min="${esc(f.min)}" data-max="${esc(f.max)}">
            <span>%</span>
          </label>
          ${edit ? `<button type="button" class="stc-step" data-step="1" aria-label="Больше на 1">${ICO.plus}</button>` : ""}
        </div>
        ${m.example ? `<div class="stc-ex" data-ex>${m.example(v)}</div>` : ""}
        <div class="stc-foot">
          <span class="stc-st" data-st></span>
          <span class="grow"></span>
          ${edit ? `<button type="button" class="lnk stc-def" data-def="${esc(f.default)}"${
            Number(v) === Number(f.default) ? " hidden" : ""}>Вернуть ${esc(show(f.default))} %</button>`
            : `<span class="stc-std">стандарт — ${esc(show(f.default))} %</span>`}
        </div>
      </section>`;
  }

  function render(view) {
    const V = VIEWS[view];
    const host = $t(V.host);
    if (!host || !DATA) return;
    if (DATA.error) {
      host.innerHTML = `<div class="pg"><div class="pg-note bad">${esc(DATA.error)}</div></div>`;
      return;
    }
    const fields = DATA.fields.filter((f) => V.keys.includes(f.id));
    host.innerHTML = `
      <div class="pg">
        <div class="pg-body stp">
          <div class="stp-wrap">
            <div class="stp-head">
              <div>
                <h2>${esc(V.title)}</h2>
                <p>${esc(V.lead)}</p>
              </div>
              ${fields.some(can) ? "" : `<span class="stp-lock">${ICO.lock}${esc(V.lock)}</span>`}
            </div>
            <div class="stp-cards${fields.length === 1 ? " one" : ""}">${fields.map(cardHtml).join("")}</div>
          </div>
        </div>
      </div>`;
    host.querySelectorAll(".stc[data-edit]:not([data-choice])").forEach(wireCard);
    host.querySelectorAll(".stc[data-edit][data-choice]").forEach(wireChoice);
  }

  function wireChoice(card) {
    const key = card.dataset.card, st = $t("[data-st]", card);
    card.querySelectorAll("[data-pick]").forEach((b) => b.addEventListener("click", async () => {
      if (b.classList.contains("on")) return;
      st.className = "stc-st wait";
      st.textContent = "Сохраняю…";
      try {
        DATA = await AUTH.api("PATCH", "/settings", { [key]: b.dataset.pick });
        card.querySelectorAll("[data-pick]").forEach((x) => {
          const on = Number(x.dataset.pick) === Number(DATA.values[key]);
          x.classList.toggle("on", on);
          x.setAttribute("aria-pressed", String(on));
        });
        st.className = "stc-st ok";
        st.innerHTML = ICO.ok + "Сохранено — цены Элкома пересчитаны";
      } catch (e) {
        st.className = "stc-st bad";
        st.textContent = "Не сохранилось: " + e.message;
      }
    }));
  }

  function wireCard(card) {
    const inp = $t("[data-set]", card);
    const ex = $t("[data-ex]", card), st = $t("[data-st]", card), def = $t("[data-def]", card);
    const key = inp.dataset.set;
    const lo = Number(inp.dataset.min), hi = Number(inp.dataset.max);
    let timer = 0;

    const status = (text, kind) => {
      st.className = "stc-st" + (kind ? " " + kind : "");
      st.innerHTML = kind === "ok" ? ICO.ok + esc(text) : esc(text);
      if (kind === "ok") setTimeout(() => { if (st.textContent === text) st.innerHTML = ""; }, 2500);
    };
    // Пример и «Вернуть» — сразу при наборе, до сохранения.
    const paint = () => {
      const v = num(inp.value);
      const okv = v !== null && v >= lo && v <= hi;
      inp.classList.toggle("bad", inp.value.trim() !== "" && !okv);
      if (ex && okv) ex.innerHTML = META[key].example(v);
      if (def) def.hidden = okv && v === Number(def.dataset.def);
      return okv ? v : null;
    };

    async function save() {
      clearTimeout(timer);
      // Вернули прежнее число — сохранять нечего, но старую ошибку убрать.
      if (inp.value === inp.dataset.last) { paint(); if (st.classList.contains("bad")) status("", ""); return; }
      const raw = inp.value.trim();
      const v = paint();
      if (raw !== "" && v === null) {
        status(`От ${show(lo)} до ${show(hi)} %`, "bad");
        return;
      }
      inp.dataset.last = inp.value;
      status("Сохраняю…", "wait");
      try {
        DATA = await AUTH.api("PATCH", "/settings", { [key]: raw });
        inp.value = inp.dataset.last = show(DATA.values[key]);
        paint();
        status("Сохранено", "ok");
      } catch (e) {
        inp.classList.add("bad");
        status("Не сохранилось: " + e.message, "bad");
      }
    }
    const soon = () => { clearTimeout(timer); timer = setTimeout(save, 600); };

    inp.addEventListener("input", paint);
    inp.addEventListener("change", save);
    inp.addEventListener("keydown", (e) => {
      if (e.key === "Enter") { e.preventDefault(); inp.blur(); }
      if (e.key === "ArrowUp" || e.key === "ArrowDown") {
        e.preventDefault();
        step(e.key === "ArrowUp" ? 1 : -1);
      }
    });
    // «−/+» — по единице, в пределах допустимого; сохраняем, когда перестали жать.
    const step = (d) => {
      const v = num(inp.value) ?? Number(DATA.values[key]);
      const n = Math.min(hi, Math.max(lo, Math.round((v + d) * 100) / 100));
      inp.value = show(n);
      paint();
      soon();
    };
    card.querySelectorAll("[data-step]").forEach((b) => b.addEventListener("click", () => step(+b.dataset.step)));
    if (def) def.addEventListener("click", () => { inp.value = show(def.dataset.def); paint(); save(); });
  }

  return { load };
})();
