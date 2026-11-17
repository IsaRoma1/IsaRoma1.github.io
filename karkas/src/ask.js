/* Свои окна вместо браузерных confirm, alert и prompt (02.10.2026).

   Пользователь: окна подтверждения пусть открываются не браузерные, а в
   нашем интерфейсе. Браузерное окно серое, в заголовке — адрес сайта
   («Подтвердите действие на сайте …»), кнопки «Да/Нет»
   без глагола, и на телефоне его легко принять за системное. Здесь — в
   стиле платформы: заголовок вопросом, под ним — что будет; кнопка
   называет действие («Удалить»), опасное — красным, и в фокусе по
   умолчанию «Отмена», чтобы случайный Enter ничего не стёр.

   Окна асинхронные: браузерный confirm() останавливал страницу, наш
   возвращает Promise —
     if (!(await ASK.confirm("Удалить тему «X»? Отметки пропадут."))) return;
     ASK.alert(e.message, { title: "Не вышло" });
     const name = await ASK.prompt("Название документа", value);   // null — отмена

   Заголовок и пояснение берутся из одной строки: до первого «?» —
   вопрос, остальное — пояснение. Глагол вопроса становится подписью
   кнопки, «Удалить», «Убрать», «Очистить» — красным. Всё можно задать
   явно: { title, ok, cancel, danger, html }.

   Окно встаёт поверх любых окон и просмотра материала. Escape и щелчок
   мимо — «Отмена», и только у верхнего окна: клавиши ловятся раньше всех
   и до окон под ним не доходят. */
"use strict";

const ASK = (() => {
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const svg = (d) => `<svg viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
  const ICO = {
    danger: svg(`<path d="M4.5 6.5h15M9.5 6.5V4.8a1.3 1.3 0 0 1 1.3-1.3h2.4a1.3 1.3 0 0 1 1.3 1.3v1.7M6.5 6.5l.9 12.2A1.5 1.5 0 0 0 8.9 20h6.2a1.5 1.5 0 0 0 1.5-1.3l.9-12.2M10 10.5v6M14 10.5v6"/>`),
    ask: svg(`<circle cx="12" cy="12" r="8.5"/><path d="M9.6 9.3a2.5 2.5 0 0 1 4.8.9c0 1.7-2.4 2.1-2.4 3.6M12 16.6v.1"/>`),
    bad: svg(`<circle cx="12" cy="12" r="8.5"/><path d="M12 7.6v5.2M12 16.3v.1"/>`),
    info: svg(`<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5M12 7.9v.1"/>`),
    edit: svg(`<path d="M4.5 19.5h4l10-10a2.1 2.1 0 0 0-3-3l-10 10z"/>`),
  };
  // Опасное — то, что убирает или стирает.
  const RISKY = /^(Удалить|Убрать|Стереть|Очистить|Сбросить|Отменить загрузку)/;
  // Глагол в начале вопроса: «Перенести …?» — кнопка «Перенести».
  const VERB = /^([А-ЯЁ][а-яё]+(?:ть|ти|чь)(?:ся)?)(?=[\s«,?.]|$)/;
  const STACK = [];
  let seq = 0;

  /* «Вопрос? Пояснение» → [вопрос, пояснение]. Без вопроса короткий текст
     сам становится заголовком, длинный уходит в пояснение. */
  function split(text) {
    const s = String(text ?? "").trim();
    const m = /^([^?]{1,240}\?)(?:\s+([\s\S]*))?$/.exec(s);
    if (m) return [m[1].trim(), (m[2] || "").trim()];
    return s.length <= 90 ? [s, ""] : ["Подтвердите действие", s];
  }

  /* Сообщение «Не вышло: причина» → заголовок и пояснение. */
  function splitNote(text) {
    const s = String(text ?? "").trim();
    const m = /^([^:\n]{2,60}):\s+([\s\S]+)$/.exec(s);
    if (!m) return [s, ""];
    return [m[1], m[2][0].toUpperCase() + m[2].slice(1)];
  }

  function open(kind, text, opts) {
    opts = opts || {};
    return new Promise((resolve) => {
      let title, body;
      if (opts.title !== undefined) [title, body] = [opts.title, String(text ?? "")];
      else if (kind === "confirm") [title, body] = split(text);
      else if (kind === "alert") [title, body] = splitNote(text);
      else [title, body] = [String(text ?? ""), ""];
      const danger = kind === "confirm" && (opts.danger !== undefined ? !!opts.danger : RISKY.test(title));
      const tone = kind === "alert" ? (opts.bad === false ? "info" : "bad")
        : kind === "prompt" ? "edit" : danger ? "danger" : "ask";
      const okLabel = opts.ok || (kind === "alert" ? "Понятно" : kind === "prompt" ? "Сохранить"
        : (VERB.exec(title) || [])[1] || "Да");
      const id = "ask" + (++seq);
      const prev = document.activeElement;

      const wrap = document.createElement("div");
      wrap.className = "dlg-wrap";
      wrap.innerHTML = `
        <div class="dlg-card t-${tone}" role="${kind === "prompt" ? "dialog" : "alertdialog"}" aria-modal="true"
             aria-labelledby="${id}t"${body ? ` aria-describedby="${id}x"` : ""}>
          <span class="dlg-ic">${ICO[tone]}</span>
          <div class="dlg-b">
            <h3 id="${id}t">${esc(title)}</h3>
            ${body ? `<p id="${id}x"${opts.html ? ' class="html"' : ""}>${opts.html ? body : esc(body)}</p>` : ""}
            ${kind === "prompt" ? `<input class="dlg-in" type="text" autocomplete="off" maxlength="${opts.max || 200}"
              value="${esc(opts.value ?? "")}" placeholder="${esc(opts.placeholder || "")}"
              aria-label="${esc(title)}">` : ""}
          </div>
          <div class="dlg-foot">
            ${kind === "alert" ? "" : `<button type="button" class="dlg-btn dlg-no" data-no>${esc(opts.cancel || "Отмена")}</button>`}
            <button type="button" class="dlg-btn ${danger ? "dlg-red" : "dlg-yes"}" data-ok>${esc(okLabel)}</button>
          </div>
        </div>`;
      document.body.appendChild(wrap);
      STACK.push(wrap);
      const card = wrap.firstElementChild;
      const okB = card.querySelector("[data-ok]"), noB = card.querySelector("[data-no]");
      const inp = card.querySelector(".dlg-in");

      const done = (v) => {
        if (wrap.dataset.done) return;
        wrap.dataset.done = "1";
        window.removeEventListener("keydown", key, true);
        STACK.splice(STACK.indexOf(wrap), 1);
        wrap.classList.add("out");
        setTimeout(() => wrap.remove(), 160);
        // Фокус — туда, откуда открыли, если оно ещё на странице.
        if (prev && prev.focus && document.contains(prev)) {
          try { prev.focus({ preventScroll: true }); } catch (e) { /* не фокусируется */ }
        }
        resolve(v);
      };
      const no = () => done(kind === "confirm" ? false : kind === "prompt" ? null : undefined);
      const yes = () => done(kind === "confirm" ? true : kind === "prompt" ? inp.value.trim() : undefined);

      function key(e) {
        if (STACK[STACK.length - 1] !== wrap) return;
        if (e.key === "Escape") {
          e.preventDefault();
          e.stopImmediatePropagation();
          no();
          return;
        }
        if (e.key === "Enter" && (e.target === inp || !card.contains(e.target))) {
          e.preventDefault();
          e.stopImmediatePropagation();
          yes();
          return;
        }
        if (e.key === "Tab") {
          // Фокус ходит по кнопкам окна и не уходит на страницу под ним.
          const all = [...card.querySelectorAll("input, button")];
          const i = all.indexOf(document.activeElement);
          const j = e.shiftKey ? (i <= 0 ? all.length - 1 : i - 1) : (i === all.length - 1 ? 0 : i + 1);
          e.preventDefault();
          all[j].focus();
        }
        // Остальные клавиши страница под окном не получает: Ctrl+K и
        // прочие сочетания не должны срабатывать за спиной у вопроса.
        if (!card.contains(e.target)) e.stopImmediatePropagation();
      }
      window.addEventListener("keydown", key, true);

      // Щелчок мимо — отмена, но только если и нажали мимо: выделение
      // текста в поле, отпущенное за краем окна, окно не закрывает.
      let downOut = false;
      wrap.addEventListener("mousedown", (e) => { downOut = e.target === wrap; });
      wrap.addEventListener("click", (e) => { if (e.target === wrap && downOut) no(); downOut = false; });
      okB.addEventListener("click", yes);
      if (noB) noB.addEventListener("click", no);

      if (inp) {
        inp.focus();
        // В имени файла выделяем имя без расширения — правят обычно его.
        const v = inp.value, dot = opts.keepExt ? v.lastIndexOf(".") : -1;
        inp.setSelectionRange(0, dot > 0 ? dot : v.length);
      } else (danger && noB ? noB : okB).focus({ preventScroll: true });
    });
  }

  return {
    confirm: (text, opts) => open("confirm", text, opts),
    alert: (text, opts) => open("alert", text, opts),
    prompt: (title, value, opts) => open("prompt", title, Object.assign({}, opts, { value })),
  };
})();
