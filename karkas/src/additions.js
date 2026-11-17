/* Добавления — то, чего в смете не было.

   Спека приходит из Google-таблицы и перезаписывается при каждом
   импорте, поэтому править её в платформе нельзя: следующее обновление
   сотрёт правки. Добавленное живёт отдельным слоем и склеивается со
   спекой при показе — две стороны не трогают одни и те же записи.

   Позиция от сметчика и позиция от прораба — разные вещи. Вторая
   означает «этого не было в смете, но мы это поставили», и за неё
   кто-то заплатит: либо мы из маржи, либо заказчик как допработы.
   Отсюда обязательное «зачем», статус и отдельный итог: если
   добавленное молча вольётся в план, число в шапке перестанет
   сходиться с договором.

   Добавлять можно на двух уровнях: позицию в щит и щит в раздел.
   Добавленный щит принимает позиции так же, как сметный, — за счёт
   того, что ключ родителя считается одинаково для обоих. */
"use strict";

const ADDS = (() => {
  let contract = null;
  let all = [];
  let byParent = {};

  const api = (method, path, body) => AUTH.api(method, path, body);

  function reindex() {
    byParent = {};
    for (const a of all) (byParent[a.parent_key] = byParent[a.parent_key] || []).push(a);
  }

  return {
    /* Отклонённое не выбрасываем: спор с ПТО должен остаться видимым,
       иначе через месяц никто не вспомнит, почему позицию не взяли. */
    STATUS: {
      draft: { label: "черновик", cls: "warn" },
      approved: { label: "согласовано", cls: "ok" },
      rejected: { label: "отклонено", cls: "bad" },
    },

    async load(contractId) {
      contract = contractId;
      all = [];
      byParent = {};
      all = (await api("GET", "/additions?contract="
        + encodeURIComponent(contractId))) || [];
      reindex();
    },

    /* Позиции, добавленные в щит, и щиты, добавленные в раздел. */
    items(boxKey) {
      return (byParent[boxKey] || []).filter((a) => a.kind === "item");
    },
    boxes(sectionKey) {
      return (byParent[sectionKey] || []).filter((a) => a.kind === "box");
    },

    async create(fields) {
      const a = await api("POST", "/additions",
        Object.assign({ contract }, fields));
      all.push(a);
      reindex();
      return a;
    },

    async setStatus(id, status) {
      const a = await api("PATCH", "/additions/" + encodeURIComponent(id), { status });
      all = all.map((x) => (x.id === id ? a : x));
      reindex();
      return a;
    },

    async remove(id) {
      await api("DELETE", "/additions/" + encodeURIComponent(id));
      all = all.filter((x) => x.id !== id);
      reindex();
    },

    /* Итог «сверх сметы» для шапки договора. Отклонённое в сумму не
       идёт — оно уже не наше обязательство, но остаётся на виду. */
    totals() {
      let sum = 0;
      const by = { draft: 0, approved: 0, rejected: 0 };
      for (const a of all) {
        by[a.status] = (by[a.status] || 0) + 1;
        if (a.status !== "rejected" && a.price_est && a.qty) {
          sum += a.price_est * a.qty;
        }
      }
      return { count: all.length, sum, ...by };
    },
  };
})();
