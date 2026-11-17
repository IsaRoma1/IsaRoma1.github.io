/* «Справочники» — справочники под одной крышей (прайс работ и настройки
   расчёта с 07.10.2026 — в разделе «Тендер»).

   Раньше контрагенты и расценки были отдельными пунктами меню, и найти
   их можно было, только помня, что они там есть. По сути это одно и то
   же: то, чем пользуются при расчёте, а не то, что считают. Поэтому один
   вход и вкладки внутри.

   Прежние разделы не переписаны. У каждого свой модуль, своя загрузка и
   своя отрисовка — рамка только показывает нужный и прячет остальные, а
   данные просит один раз, при первом открытии вкладки. Переписывать
   работающее ради переезда значило бы поменять три вещи там, где хватает
   одной. */
"use strict";

const REFS = (() => {
  const $r = (s, r) => (r || document).querySelector(s);

  /* Порядок не случаен: сотрудниками пользуются чаще всего, юрлиц две и
     меняются они раз в год, прайсы самые тяжёлые и потому в конце. */
  const TABS = [
    /* Модули зовём по имени, а не через window: const на верхнем уровне
       обычного скрипта заводит переменную области скрипта, а свойства
       окна не создаёт — window.STAFF там undefined. */
    /* Список сотрудников открыт всем (заказчик, 09.10.2026) — телефоны,
       почта, фото; вкладка «Сотрудники» в «Доступе» — полный доступ к нему,
       это сервер решает сам (staff_list). */
    { id: "stf", name: "Сотрудники", perm: "",
      load: () => typeof STAFF === "object" && STAFF.load() },
    { id: "org", name: "Наши компании", perm: "ref_org",
      load: () => typeof ORGS === "object" && ORGS.load() },
    { id: "cnt", name: "Контрагенты", perm: "ref_cnt",
      load: () => typeof CNT === "object" && CNT.load() },
    /* Карточка заказчика (13.10.2026): как с ним работаем. Перечитывается
       при показе — заказчиков заводят и в «Контрагентах», и из объекта. */
    { id: "cus", name: "Заказчики", perm: "ref_cus", fresh: true,
      load: () => typeof CUS === "object" && CUS.load() },
    /* Бригады монтажников (21.10.2026): карточки, рейтинг, поздравления.
       Перечитывается при показе — «горящие» праздники считает сервер. */
    { id: "crw", name: "Бригады монтажников", perm: "ref_crw", fresh: true,
      load: () => typeof CREWS === "object" && CREWS.load() },
    /* Монтажники (правка № 11, 21.10.2026): люди бригад по «Журналу учёта
       иностранцев», сроки документов. Перечитывается при показе — сроки идут. */
    { id: "mnt", name: "Монтажники", perm: "ref_mnt", fresh: true,
      load: () => typeof INSTALLERS === "object" && INSTALLERS.load() },
    /* Расценки на работы заказчиков (правка № 15, 22.10.2026): из их ВДЦ,
       КЛК, РДЦ и вписанные в расчёты. Галочка — та же, что у прайса работ. */
    { id: "cwk", name: "Расценки на работы", perm: "ref_wrk", fresh: true,
      load: () => typeof CUSWORKS === "object" && CUSWORKS.load() },
    /* Прайс перечитывается при каждом показе: цены в нём меняются из
       расчётов и счетов, и прайс, открытый час назад, показывал бы старое,
       пока не обновишь страницу. Прайс работ и настройки расчёта с
       07.10.2026 — в разделе «Тендер» («Параметры для расчёта», tender.js). */
    { id: "mat", name: "Прайс материалов", perm: "ref_mat", fresh: true,
      load: () => typeof MATS === "object" && MATS.load() },
  ];

  /* Открытая вкладка — в адресе (?t=mat) и в браузере: обновление страницы
     не должно уводить со «Прайса материалов» на «Сотрудников». */
  const TAB_KEY = "karkas.ref.tab.v1";
  let tab = (() => {
    try {
      return new URLSearchParams(location.search).get("t")
        || localStorage.getItem(TAB_KEY) || "stf";
    } catch (e) { return "stf"; }
  })();
  const loaded = new Set();
  const lastLoad = {};
  const remember = () => {
    try { localStorage.setItem(TAB_KEY, tab); } catch (e) { /* без памяти */ }
    document.dispatchEvent(new CustomEvent("karkas:ref-tab", { detail: tab }));
  };

  /* Право проверяем по тому же признаку, что и разделы меню: у вкладки
     оно своё, и закрытая вкладка не должна даже показываться. */
  const allowed = (t) => !t.perm || AUTH.can(AUTH.current(), t.perm);

  function show() {
    const host = $r("#sec-ref");
    if (!host) return;
    // Хоть одна вкладка есть всегда — «Сотрудники» открыты всем.
    const list = TABS.filter(allowed);
    if (!list.some((t) => t.id === tab)) tab = list[0].id;
    remember();

    $r("#refTabs", host).innerHTML = list.map((t) => `
      <button type="button" class="pg-tab${t.id === tab ? " on" : ""}"
              data-ref="${t.id}">${t.name}</button>`).join("");
    $r("#refTabs", host).querySelectorAll("[data-ref]").forEach((b) => {
      b.addEventListener("click", () => {
        if (tab === b.dataset.ref) return;
        tab = b.dataset.ref;
        remember();
        show();
      });
    });

    for (const t of TABS) {
      const pane = $r("#sec-" + t.id, host);
      if (!pane) continue;
      pane.hidden = t.id !== tab;
    }
    const cur = list.find((t) => t.id === tab);
    const pane = $r("#sec-" + tab, host);
    if (!pane) return;
    if (cur.soon) {
      // Вкладку показываем пустой, а не прячем: человек должен видеть,
      // что про неё помнят, и не искать её в другом месте.
      pane.innerHTML = `<div class="pg"><div class="pg-body">
        <div class="pg-empty"><b>${cur.name}</b>${cur.soon}</div>
      </div></div>`;
      return;
    }
    // Данные тянем при первом показе: у большинства входящих прав на
    // половину справочников нет, и запрос ушёл бы в 403.
    // Прайсы перечитываются при каждом показе, но не чаще раза в пару
    // секунд: вход в «Справочники» и щелчок по вкладке шли подряд и давали
    // две загрузки. Сами прайсы при повторной загрузке ничего не
    // перерисовывают, если данные не изменились.
    const now = Date.now();
    if (!loaded.has(tab) || (cur.fresh && now - (lastLoad[tab] || 0) > 2000)) {
      loaded.add(tab);
      lastLoad[tab] = now;
      Promise.resolve(cur.load()).catch(() => loaded.delete(tab));
    }
  }

  /* Открыть справочники сразу на нужной вкладке. */
  function open(id) {
    if (TABS.some((t) => t.id === id)) { tab = id; remember(); }
    if (typeof openSection === "function") openSection("ref");
  }

  return { show, open };
})();
