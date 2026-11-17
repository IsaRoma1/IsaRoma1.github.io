/* ============================================================
   Глазок у полей пароля.

   Один модуль на всю платформу: полей пять — вход, три в «Безопасности»
   и подтверждение в «выйти везде». Разметка кнопки, значок и логика
   переключения, размноженные по пяти местам, разъехались бы при первой
   же правке — например, при смене значка поправили бы четыре из пяти.

   Разметку кнопки собираем кодом, а не пишем в HTML: вызывающему
   достаточно обычного <input type="password">.

   Важно: поле не должно лежать внутри <label>. Кнопка внутри подписи —
   некорректная вложенность, и клик по ней браузер засчитывает ещё и как
   клик по подписи. Поэтому в разметке подпись связывается через for.
   ============================================================ */
window.PwEye = (() => {
  /* Значок в общем ключе проекта: viewBox 24, обводка currentColor.
     Перечёркивание рисуем всегда, показываем классом — так не надо
     переставлять разметку на каждое нажатие. */
  const ICON =
    '<svg viewBox="0 0 24 24" aria-hidden="true">'
    + '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/>'
    + '<circle cx="12" cy="12" r="3.2"/>'
    + '<path class="pw-slash" d="M4 20 20 4"/>'
    + '</svg>';

  function attach(input) {
    if (!input || input.dataset.pwEye) return;   // уже с глазком
    input.dataset.pwEye = "1";

    const field = document.createElement("div");
    field.className = "pw-field";
    input.parentNode.insertBefore(field, input);
    field.appendChild(input);

    const btn = document.createElement("button");
    btn.type = "button";                          // иначе Enter в поле отправит форму этой кнопкой
    btn.className = "pw-eye";
    btn.setAttribute("aria-label", "Показать пароль");
    btn.setAttribute("aria-pressed", "false");
    btn.innerHTML = ICON;
    field.appendChild(btn);

    btn.addEventListener("click", () => {
      const show = input.type === "password";
      /* Смена type сбрасывает каретку в конец. Человек, открывший пароль
         посреди набора, допечатывал бы не туда. */
      const from = input.selectionStart, to = input.selectionEnd;
      input.type = show ? "text" : "password";
      btn.classList.toggle("on", show);
      btn.setAttribute("aria-pressed", String(show));
      btn.setAttribute("aria-label", show ? "Скрыть пароль" : "Показать пароль");
      input.focus();
      try { input.setSelectionRange(from, to); } catch (e) { /* не всякий type умеет */ }
    });
  }

  /* Вызывается после каждой перерисовки: разделы платформы переписывают
     innerHTML целиком, и прежние обёртки исчезают вместе с полями. */
  function scan(root) {
    (root || document).querySelectorAll('input[type="password"]').forEach(attach);
  }

  return { attach, scan };
})();
