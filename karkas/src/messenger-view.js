/* Курсор прочтения и прокрутка проверяются отдельно от DOM: загруженная
   страница ещё не означает, что сотрудник увидел её целиком. */
"use strict";
const MSG_VIEW = (() => {
  function readCursor(items, top, bottom, previous) {
    return items.reduce((cursor, item) => item.bottom > top && item.bottom <= bottom + 1
      ? Math.max(cursor, item.id) : cursor, previous);
  }
  function scrollTop(s) {
    const end = Math.max(0, s.newHeight - s.height);
    if (s.mode === "initial") return Number.isFinite(s.firstUnread) ? Math.max(0, s.firstUnread - 12) : end;
    if (s.mode === "prepend") return s.top + s.newHeight - s.oldHeight;
    if (!s.wasBottom) return s.top;
    // Несколько коротких сообщений помещаются на экран. Большую страницу
    // показываем с начала, иначе курсор сразу перепрыгнул бы через неё.
    if (s.newHeight - s.oldHeight > s.height * .7 && Number.isFinite(s.firstNew)) {
      return Math.max(0, s.firstNew - 12);
    }
    return end;
  }
  return { readCursor, scrollTop };
})();
if (typeof module !== "undefined" && module.exports) module.exports = MSG_VIEW;
