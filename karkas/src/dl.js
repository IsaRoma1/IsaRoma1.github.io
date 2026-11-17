/* Скачивание файла с кольцом на кнопке.

   Файл приезжает не мгновенно: проект — десятки мегабайт, книга секции —
   двадцать, и после щелчка по «скачать» ничего не происходило, пока файл
   не доезжал целиком, — непонятно, нажалось или нет (пользователь,
   22.09.2026). Теперь кнопка, с которой скачивают, обводится линией: пока
   сервер готовит файл, по контуру бежит отрезок, а когда файл пошёл —
   контур замыкается по мере того, сколько приехало. Приехал — на миг
   зеленеет, не вышло — краснеет.

   Один модуль на всю платформу: скачивают документы объекта, файлы,
   прайсы, счета, выгрузки — и везде это должно выглядеть одинаково. */
"use strict";

const DL = (() => {
  const NS = "http://www.w3.org/2000/svg";
  const quiet = { set() {}, done() {}, fail() {} };

  /* Контур по форме самой кнопки: квадратик значка, скруглённая кнопка с
     подписью — линия идёт по её краю. Рисуется внутри кнопки поверх
     рамки и щелчков не перехватывает. */
  function ring(btn) {
    if (!btn || !btn.isConnected || !btn.getBoundingClientRect) return quiet;
    const box = btn.getBoundingClientRect();
    if (!box.width || !box.height) return quiet;
    const cs = getComputedStyle(btn);
    const w = box.width, h = box.height;
    const rad = Math.min(parseFloat(cs.borderTopLeftRadius) || 0, h / 2, w / 2);
    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("class", "dl-ring wait");
    svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
    svg.setAttribute("preserveAspectRatio", "none");
    svg.setAttribute("aria-hidden", "true");
    const rect = document.createElementNS(NS, "rect");
    rect.setAttribute("x", "1");
    rect.setAttribute("y", "1");
    rect.setAttribute("width", String(Math.max(0, w - 2)));
    rect.setAttribute("height", String(Math.max(0, h - 2)));
    rect.setAttribute("rx", String(Math.max(0, rad - 1)));
    rect.setAttribute("pathLength", "100");
    svg.appendChild(rect);
    const host = cs.position === "static";
    if (host) btn.classList.add("dl-host");
    btn.classList.add("dl-busy");
    btn.setAttribute("aria-busy", "true");
    btn.appendChild(svg);
    let gone = false;
    const end = (cls, ms) => {
      if (gone) return;
      gone = true;
      svg.classList.remove("wait");
      svg.classList.add(cls);
      rect.style.strokeDashoffset = "0";
      setTimeout(() => {
        svg.remove();
        btn.classList.remove("dl-busy");
        if (host) btn.classList.remove("dl-host");
        btn.removeAttribute("aria-busy");
      }, ms);
    };
    return {
      /* Сколько приехало, в процентах: контур замыкается по часовой. */
      set(pct) {
        if (gone) return;
        svg.classList.remove("wait");
        rect.style.strokeDashoffset = String(100 - Math.max(3, Math.min(100, pct)));
      },
      done() { end("ok", 650); },
      fail() { end("bad", 1200); },
    };
  }

  const hold = () => { if (typeof FRESH === "object") FRESH.hold(); };
  const release = () => { if (typeof FRESH === "object") FRESH.release(); };

  /* Файл с сервера: с токеном входа (обычная ссылка ушла бы без него) и
     с кольцом на кнопке opts.btn. Ответ читаем кусками, чтобы было что
     показать на кольце. Возвращает {blob, name} или null, если с этой
     кнопки уже качается. opts: btn, method, body (объект → JSON),
     error — что сказать, если сервер не объяснил сам. */
  async function get(url, opts) {
    opts = opts || {};
    const btn = opts.btn;
    if (btn && btn.classList && btn.classList.contains("dl-busy")) return null;
    const r = ring(btn);
    hold();
    try {
      const headers = { Authorization: "Bearer " + AUTH.token() };
      if (opts.body !== undefined) headers["Content-Type"] = "application/json";
      const res = await fetch(url, {
        method: opts.method || (opts.body !== undefined ? "POST" : "GET"),
        headers,
        body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
      });
      if (!res.ok) {
        let msg = opts.error || "Не удалось получить файл";
        try { msg = (await res.json()).error || msg; } catch (e) { /* не json */ }
        throw new Error(msg);
      }
      const total = Number(res.headers.get("Content-Length")) || 0;
      const type = res.headers.get("Content-Type") || "";
      let blob;
      const reader = res.body && res.body.getReader ? res.body.getReader() : null;
      if (reader) {
        const parts = [];
        let got = 0;
        if (total) r.set(0);
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          parts.push(value);
          got += value.length;
          if (total) r.set(got / total * 100);
        }
        blob = new Blob(parts, { type });
      } else {
        blob = await res.blob();
      }
      const cd = res.headers.get("Content-Disposition") || "";
      const m = cd.match(/filename\*=UTF-8''([^;]+)/i);
      r.done();
      return { blob, name: m ? decodeURIComponent(m[1]) : "" };
    } catch (e) {
      r.fail();
      // Оборванная связь приходит от браузера по-английски.
      throw e instanceof TypeError ? new Error("связь оборвалась — попробуйте ещё раз") : e;
    } finally {
      release();
    }
  }

  function saveBlob(blob, name) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name || "файл";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  }

  /* Скачать в «Загрузки». Имя — названное вызывающим (у документа своё
     имя в карточке), иначе то, что прислал сервер. */
  async function save(url, opts) {
    opts = opts || {};
    const got = await get(url, opts);
    if (got) saveBlob(got.blob, opts.name || got.name || opts.fallback);
    return got;
  }

  /* Открыть в новой вкладке — PDF, картинку. Вкладку открываем сразу, по
     щелчку: открытую после ожидания браузер счёл бы всплывающим окном. */
  async function open(url, opts) {
    const w = window.open("", "_blank");
    try {
      const got = await get(url, opts);
      if (!got) {
        if (w) w.close();
        return null;
      }
      const u = URL.createObjectURL(got.blob);
      if (w) w.location.href = u; else window.open(u, "_blank");
      setTimeout(() => URL.revokeObjectURL(u), 120000);
      return got;
    } catch (e) {
      if (w) w.close();
      throw e;
    }
  }

  return { ring, get, save, saveBlob, open };
})();
