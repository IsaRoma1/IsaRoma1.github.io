/* Журнал движений по позициям.

   Ключевая мысль: количество у позиции — не поле, а счёт. Каждое
   событие («заказали 200 м», «приехало 180», «смонтировано 150») —
   отдельная проводка с датой, автором и источником. Четыре колонки
   количеств в исходной таблице — кустарная попытка вести такой журнал:
   они хранят разные числа об одной позиции и никак не связаны между
   собой, поэтому и расходятся незаметно.

   Из журнала бесплатно считаются: остаток к закупке, готовность,
   экономия и недостача — и, главное, проверяются инварианты:
   смонтировать больше, чем приехало, невозможно. Нарушение не
   переписывается молча, а показывается.

   Проводки живут в общей базе (deploy/api.py). Читаем их пачкой на весь
   договор при его открытии и держим в памяти: таблица рисуется
   синхронно, ходить в сеть на каждую ячейку нельзя. Пишем сразу на
   сервер и обновляем кэш ответом — так у всех одна картина. */
"use strict";

/* Порядок важен: он же задаёт цепочку инвариантов сверху вниз. */
const MOVES = [
  { id: "ordered",    label: "Заказано",     short: "заказ",   color: "note" },
  { id: "received",   label: "Принято",      short: "склад",   color: "note" },
  { id: "shipped",    label: "На объекте",   short: "объект",  color: "warn" },
  { id: "installed",  label: "Смонтировано", short: "монтаж",  color: "ok" },
  { id: "measured",   label: "Обмерено",     short: "обмер",   color: "ok" },
  { id: "presented",  label: "Предъявлено",  short: "КС",      color: "ok" },
];
const MOVE_BY = Object.fromEntries(MOVES.map((m) => [m.id, m]));

/* Источник плана. Спека и расчёт ПТО — два разных мнения об одном и том
   же, поэтому это не движения, а две плановые величины. */
const PLAN_SPEC = "spec";
const PLAN_DESIGN = "design";

const LEDGER = (() => {
  let contract = null;    // договор, чьи проводки сейчас в памяти
  let byKey = {};         // item_key -> [проводка]

  const api = (method, path, body) => AUTH.api(method, path, body);

  function index(list) {
    const out = {};
    for (const m of list) (out[m.item_key] = out[m.item_key] || []).push(m);
    return out;
  }

  return {
    MOVES,
    MOVE_BY,
    PLAN_SPEC,
    PLAN_DESIGN,

    /* Ключ позиции считается ИЗ СОДЕРЖИМОГО спеки, а не из номера строки.
       Сметчик вставит строку в середину — при позиционном ключе все
       проводки ниже переклеились бы на соседние позиции, молча и
       незаметно. Наименование внутри щита уникально; повторы (одна и та
       же железка на разные стояки) разводятся счётчиком.

       Ломается ключ только при переименовании позиции — и это видно:
       в щите одна пропала, другая появилась. */
    norm: (s) => String(s ?? "").replace(/\s+/g, " ").trim().toLowerCase(),

    sectionKey(contractId, section) {
      return contractId + "/" + this.norm(section);
    },
    boxKey(contractId, section, box) {
      return this.sectionKey(contractId, section) + "/" + this.norm(box);
    },
    /* В ключ входит не только имя. Девять трансформаторов тока в спеке
       называются одинаково и различаются только маркой (ТШП-0,66 400/5
       против 200/5), а одинаковые щиты на разных этажах — колонкой
       места. Без этих двух полей разные позиции получали один ключ:
       проводки склеивались, а по клику раскрывалось сразу несколько
       строк — это и было видно в ЭОМ3.

       Марка снимает все столкновения в ЭОМ4 (было 36) и часть в
       остальных. Оставшиеся — не настоящие повторы, а след ошибки
       разбора: в ЭОМ0-2 потеряны границы щитов, и содержимое десятка
       разных щитов свалено в одну безымянную сборку. Лечится в
       разборщике, не здесь. */
    key(contractId, section, box, name, places, brand) {
      const where = Array.isArray(places) && places.length
        ? "/" + this.norm(places.join(",")) : "";
      const what = brand ? "/" + this.norm(brand) : "";
      return this.boxKey(contractId, section, box) + "/" + this.norm(name)
        + where + what;
    },

    /* Ключ добавленной позиции. Она пришла не из спеки, содержимого для
       ключа у неё нет — берём её собственный номер, он не изменится. */
    addedKey(contractId, additionId) {
      return contractId + "/#add/" + additionId;
    },

    /* Разложить ключи по всей спеке — один раз при открытии договора.
       Считаем здесь, а не в вёрстке, чтобы правило было в одном месте.

       Счётчик повторов ведётся на весь договор, а не на щит: в одном
       разделе бывает несколько безымянных сборок «—», и счётчик,
       обнуляясь на каждой, выдавал одинаковые ключи разным позициям.
       Он же — последняя защита: если даже место совпало, позиции всё
       равно получат разные ключи. */
    assignKeys(doc, contractId) {
      const seen = {};
      let collisions = 0;
      for (const s of doc.sections) {
        for (const b of s.boxes) {
          for (const i of b.items) {
            const base = this.key(contractId, s.title, b.code,
              String(i.name ?? ""), i.places, i.brand);
            const dup = seen[base] = (seen[base] === undefined ? 0 : seen[base] + 1);
            if (dup) collisions++;
            i._key = dup ? base + "#" + (dup + 1) : base;
          }
        }
      }
      return collisions;
    },

    /* Забрать проводки договора одной пачкой. */
    async load(contractId) {
      contract = contractId;
      byKey = {};
      const list = await api("GET", "/moves?contract=" + encodeURIComponent(contractId));
      byKey = index(list || []);
    },

    of(key) {
      return byKey[key] || [];
    },

    async add(key, { type, qty, note, doc_ref }) {
      if (!MOVE_BY[type]) throw new Error("Неизвестный вид движения");
      const n = Number(String(qty).replace(",", "."));
      if (!isFinite(n) || n <= 0) throw new Error("Количество — число больше нуля");
      const m = await api("POST", "/moves",
        { contract, item_key: key, type, qty: n, note: note || "", doc_ref: doc_ref || "" });
      (byKey[key] = byKey[key] || []).push(m);
      return m;
    },

    async remove(key, id) {
      await api("DELETE", "/moves/" + encodeURIComponent(id));
      byKey[key] = (byKey[key] || []).filter((m) => m.id !== id);
      if (!byKey[key].length) delete byKey[key];
    },

    /* Суммы по видам движений. */
    totals(key) {
      const t = Object.fromEntries(MOVES.map((m) => [m.id, 0]));
      for (const m of this.of(key)) t[m.type] = (t[m.type] || 0) + m.qty;
      return t;
    },

    /* Проверка инвариантов. Возвращает список нарушений — не молчит и
       не правит данные: расхождение и есть находка. */
    issues(key, plan) {
      const t = this.totals(key);
      const out = [];
      const chain = [
        ["installed", "shipped"],
        ["shipped", "received"],
        ["received", "ordered"],
      ];
      for (const [a, b] of chain) {
        if (t[a] > t[b] + 1e-6) {
          out.push(`${MOVE_BY[a].label.toLowerCase()} ${fmtQ(t[a])} — больше, чем ${
            MOVE_BY[b].label.toLowerCase()} ${fmtQ(t[b])}`);
        }
      }
      if (plan != null && t.ordered > plan + 1e-6) {
        out.push(`заказано ${fmtQ(t.ordered)} при плане ${fmtQ(plan)}`);
      }
      if (t.measured && t.installed && Math.abs(t.measured - t.installed) > 1e-6) {
        out.push(`обмер ${fmtQ(t.measured)} против монтажа ${fmtQ(t.installed)}`);
      }
      return out;
    },

    /* Что показывать в строке: докуда дошла позиция и сколько осталось. */
    progress(key, plan) {
      const t = this.totals(key);
      const done = t.installed || 0;
      return {
        totals: t,
        stage: t.installed ? "installed" : t.shipped ? "shipped"
          : t.received ? "received" : t.ordered ? "ordered" : null,
        pct: plan ? Math.min(100, Math.round(done / plan * 100)) : null,
        left: plan != null ? Math.max(0, plan - (t.ordered || 0)) : null,
        any: this.of(key).length > 0,
      };
    },

    /* Сводка по договору — для шапки раздела. */
    rollup() {
      const t = Object.fromEntries(MOVES.map((m) => [m.id, 0]));
      let touched = 0;
      for (const list of Object.values(byKey)) {
        if (!list.length) continue;
        touched++;
        for (const m of list) t[m.type] += m.qty;
      }
      return { ...t, touched };
    },
  };
})();

function fmtQ(n) {
  return n == null ? "—" : String(+Number(n).toFixed(3)).replace(".", ",");
}
