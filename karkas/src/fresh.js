/* Обновление вкладки, когда выкатили новый фронт.

   Задача не в том, чтобы перезагрузить, а в том, чтобы не перезагрузить
   не вовремя. Человек может грузить сорокамегабайтный проект, править
   цену в калькуляции или держать окно с незаписанными полями — оборвать
   это ради свежего кода хуже, чем показать старый.

   Поэтому решение вынесено в чистую decide(): у неё три исхода, и
   перепутать их легко — я и перепутал с первого раза. Проверяется она
   отдельно, в tests/fresh.test.js.

   Смотрим на focus и visibilitychange, а не по таймеру: вкладка,
   лежащая в фоне сутками, не должна ходить в сеть каждую минуту, а тот,
   кто вернулся к работе, узнаёт о новой версии сразу. */
(function (root, factory) {
  "use strict";
  var api = factory(root);
  root.FRESH = api;
  // Тесты запускают этот же файл в node — там нет ни окна, ни fetch.
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis, function (root) {
  "use strict";

  /* Три исхода, и только три:
       skip   — обновляться не о чем либо нечем;
       reload — версия другая и мешать некому;
       later  — версия другая, но человек занят: перезагрузим, когда
                освободится.
     Ни сети, ни времени, ни DOM: всё, что нужно решить, — в аргументе. */
  function decide(state) {
    var mine = state && state.mine;
    var server = state && state.server;
    // Рабочая копия: своей версии нет, обновление отключено вовсе.
    if (!mine || mine === "dev") return "skip";
    // Серверной версии нет — файл не отдался или в нём мусор. Во время
    // выкатки это норма, и делать из этого событие незачем.
    if (!server) return "skip";
    if (server === mine) return "skip";
    return state.busy ? "later" : "reload";
  }

  var MINE = root.BUILD_ID || "dev";
  var URL_ = "/version.json";
  var PAUSE = 60 * 1000;

  /* Занятость. Считаем не «идёт ли запрос вообще» — тогда обновление не
     случилось бы никогда, — а идёт ли то, что нельзя оборвать: долгая
     работа, о которой заявили, либо открытое окно с полями. */
  var holds = 0;

  function busy() {
    if (holds > 0) return true;
    return typeof document !== "undefined"
      && !!document.querySelector(".pf-modal");
  }

  var pending = false;   // версия сменилась, ждём покоя
  var last = 0;          // когда последний раз спрашивали сервер
  var asking = false;

  function reload() { root.location.reload(); }

  function check(now) {
    if (MINE === "dev") return;
    if (pending) {
      // Версию уже знаем, второй раз не спрашиваем — только ждём покоя.
      if (!busy()) reload();
      return;
    }
    if (asking || now - last < PAUSE) return;
    asking = true;
    last = now;
    root.fetch(URL_, { cache: "no-store" })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) {
        var verdict = decide({ mine: MINE, server: j && j.build, busy: busy() });
        if (verdict === "reload") reload();
        else if (verdict === "later") pending = true;
      })
      .catch(function () {
        /* Тишина намеренная: во время выкатки файла нет секунду-другую,
           и это ровно тот случай, ради которого всё затевалось. */
      })
      .then(function () { asking = false; });
  }

  if (typeof root.addEventListener === "function") {
    root.addEventListener("focus", function () { check(Date.now()); });
    document.addEventListener("visibilitychange", function () {
      if (!document.hidden) check(Date.now());
    });
  }

  return {
    decide: decide,
    build: MINE,
    /* «Сейчас меня трогать нельзя» — оборачивают долгую работу. */
    hold: function () { holds += 1; },
    release: function () {
      holds = Math.max(0, holds - 1);
      // Освободились — обновляемся сразу, а не до следующего возвращения
      // на вкладку: человек только что закончил и как раз готов ждать.
      if (pending && !busy()) reload();
    },
  };
});
