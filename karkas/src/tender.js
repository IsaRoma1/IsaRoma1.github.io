/* Раздел «Тендер» (07.10.2026).

   Заказчик: «блок „Тендер“ из объектов вынести в самостоятельный раздел в
   меню слева. Там два блока: объекты и данные для расчётов. Объекты,
   участвующие в тендере, — свой список и свой статус: в работе, завершён,
   выигран. Данные — прайс работ и настройки расчёта». 09.10.2026 вкладка
   данных названа «Параметры для расчёта»; в ней наценка и НДС, а ставка ВКЛ
   ушла в «Финансы» (там такая же вкладка).

   Здесь только рамка: полоса «Объекты · Параметры для расчёта» и показ
   нужного. Объекты рисует тот же модуль, что «Объекты» (SITES в режиме
   "tnd"): расчёт, версии и сводная — те же самые. Прайс работ и настройки
   — прежние модули WORKS и SETTINGS, переехавшие сюда из «Справочников»;
   галочки на них остались прежние (ref_wrk, ref_set). */
"use strict";

const TENDER = (() => {
  const $t = (s, r) => (r || document).querySelector(s);
  const me = () => AUTH.current();
  const has = (p) => AUTH.can(me(), p);

  /* Что открыто: obj — объекты, wrk — прайс работ, set — настройки.
     Помним в браузере: обновление страницы не должно уводить с прайса. */
  const KEY = "karkas.tnd.tab.v1";
  let tab = (() => {
    try { return localStorage.getItem(KEY) || "obj"; } catch (e) { return "obj"; }
  })();
  // Последняя открытая вкладка параметров: «Параметры» открываются на ней.
  let dataTab = tab === "set" ? "set" : "wrk";
  const remember = () => {
    try { localStorage.setItem(KEY, tab); } catch (e) { /* без памяти */ }
  };

  /* У каждой вкладки своя галочка в «Доступе» (08.10.2026): объекты
     тендера — tnd_obj, прайс работ — ref_wrk (с ней его и правят),
     настройки — ref_set (правят админы). */
  const TABS = {
    obj: { ok: () => has("tnd_obj") },
    wrk: { name: "Прайс работ", ok: () => has("ref_wrk"),
           load: () => typeof WORKS === "object" && WORKS.load(), fresh: true },
    set: { name: "Настройки расчёта", ok: () => has("ref_set"),
           load: () => typeof SETTINGS === "object" && SETTINGS.load() },
  };
  const loaded = new Set();
  const lastLoad = {};

  function paintBar() {
    const bar = $t("#tndTabs");
    if (!bar) return;
    const data = ["wrk", "set"].filter((k) => TABS[k].ok());
    const inData = tab !== "obj";
    bar.innerHTML = `
      ${TABS.obj.ok() ? `<button type="button" class="pg-tab${tab === "obj" ? " on" : ""}"
        data-tt="obj">Объекты</button>` : ""}
      ${data.length ? `<button type="button" class="pg-tab${inData ? " on" : ""}"
        data-tt="data">Параметры для расчёта</button>` : ""}
      ${inData && data.length > 1 ? `<span class="seg tnd-sub" role="group" aria-label="Параметры для расчёта">${
        data.map((k) => `<button type="button" class="seg-b${tab === k ? " on" : ""}" data-tt="${k}"
          >${TABS[k].name}</button>`).join("")}</span>` : ""}`;
    bar.querySelectorAll("[data-tt]").forEach((b) => b.addEventListener("click", () => {
      const t = b.dataset.tt === "data" ? dataTab : b.dataset.tt;
      if (t === tab) return;
      tab = t;
      show();
    }));
  }

  function show() {
    if (!$t("#sec-tnd")) return;
    if (!TABS[tab] || !TABS[tab].ok()) tab = ["obj", "wrk", "set"].find((k) => TABS[k].ok()) || "obj";
    if (tab !== "obj") dataTab = tab;
    remember();
    paintBar();
    const bar = $t("#tndTabs");
    $t("#tndObj").hidden = tab !== "obj";
    $t("#sec-wrk").hidden = tab !== "wrk";
    $t("#sec-set").hidden = tab !== "set";
    if (tab === "obj") {
      // Полосу над карточкой и расчётом прячет сам SITES (render).
      if (typeof SITES === "object") SITES.load("tnd");
      return;
    }
    if (bar) bar.hidden = false;
    /* Прайс перечитывается при каждом показе, но не чаще раза в пару
       секунд — как было в «Справочниках»: цены в нём меняются из расчётов. */
    const cur = TABS[tab];
    const now = Date.now();
    if (!loaded.has(tab) || (cur.fresh && now - (lastLoad[tab] || 0) > 2000)) {
      loaded.add(tab);
      lastLoad[tab] = now;
      Promise.resolve(cur.load()).catch(() => loaded.delete(tab));
    }
  }

  /* Открыть раздел сразу на нужном: «Расценки на работы» из расчёта ведут
     в прайс работ, «Расчёт в Тендере» из объекта — в объекты. */
  function open(t) {
    if (TABS[t]) tab = t;
    if (typeof openSection === "function") openSection("tnd");
  }

  return { show, open };
})();
