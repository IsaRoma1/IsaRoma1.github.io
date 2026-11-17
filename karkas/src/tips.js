/* Подсказки ⓘ — одни на всю платформу (30.09.2026).

   Пользователь: «лишние info-тексты спрятать под иконки i». Пояснение,
   которое нужно один раз, не должно стоять абзацем на экране каждый
   день: оно уходит в значок ⓘ рядом с тем, что поясняет. Наведение —
   подсказка, уход мыши — прячется; нажатие (и на телефоне) — закрепить,
   ещё нажатие или щелчок мимо — убрать.

   Разметка: <button type="button" class="i-tip" data-tip="текст"
   aria-label="…">…</button> — удобнее через TIPS.icon(текст). Слушатели
   — на документе, поэтому работают и у перерисованных строк. */
"use strict";

const TIPS = (() => {
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const ICON = `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M12 11v5M12 7.9v.1"/></svg>`;

  let el = null, anchor = null, pinned = false;

  function show(a) {
    hide();
    el = document.createElement("div");
    el.className = "g-tip";
    el.id = "g-tip";
    el.setAttribute("role", "tooltip");
    el.textContent = a.dataset.tip;
    document.body.appendChild(el);
    anchor = a;
    a.setAttribute("aria-describedby", "g-tip");
    // Под значком, а не влезает — над ним; по ширине — в пределах экрана.
    const r = a.getBoundingClientRect();
    const w = el.offsetWidth, h = el.offsetHeight;
    const cx = r.left + r.width / 2;
    const x = Math.max(8, Math.min(Math.round(cx - w / 2), innerWidth - w - 8));
    const below = innerHeight - r.bottom >= h + 14 || r.top < h + 14;
    el.style.left = x + "px";
    el.style.top = Math.round(below ? r.bottom + 8 : r.top - h - 8) + "px";
    el.style.setProperty("--ax", Math.round(cx - x) + "px");
    el.classList.toggle("up", !below);
  }

  function hide() {
    if (anchor) anchor.removeAttribute("aria-describedby");
    if (el) el.remove();
    el = null; anchor = null; pinned = false;
  }

  const of = (t) => (t && t.closest ? t.closest(".i-tip[data-tip]") : null);

  document.addEventListener("mouseover", (e) => {
    const a = of(e.target);
    if (a && !pinned && anchor !== a) show(a);
  });
  document.addEventListener("mouseout", (e) => {
    const a = of(e.target);
    if (a && !pinned && anchor === a && !a.contains(e.relatedTarget)) hide();
  });
  document.addEventListener("focusin", (e) => {
    const a = of(e.target);
    if (a && !pinned && anchor !== a) show(a);
  });
  document.addEventListener("focusout", (e) => {
    const a = of(e.target);
    if (a && !pinned && anchor === a) hide();
  });
  // Нажатие по значку — закрепить или убрать; по чему угодно ещё — убрать.
  // Значок стоит и в нажимаемых строках: щелчок по нему строку не открывает.
  document.addEventListener("click", (e) => {
    const a = of(e.target);
    if (a) {
      e.preventDefault();
      e.stopPropagation();
      if (anchor === a && pinned) hide();
      else { show(a); pinned = true; }
      return;
    }
    if (pinned) hide();
  }, true);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && el) hide(); });
  window.addEventListener("scroll", () => { if (el) hide(); }, true);
  window.addEventListener("resize", () => { if (el) hide(); });

  /* Значок с подсказкой — строкой разметки. */
  const icon = (text, label) => `<button type="button" class="i-tip" data-tip="${esc(text)}"
    aria-label="${esc(label || "Пояснение")}">${ICON}</button>`;

  return { icon, hide };
})();
