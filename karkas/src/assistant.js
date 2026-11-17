/* ============================================================
   Ассистент — панель. Спрашивает и показывает, но НЕ считает.

   Раньше здесь была вся арифметика: панель тянула в браузер все шесть
   спек, искала по ним и складывала числа сама. Теперь это делает
   сервер (POST /api/ask), а панель осталась официантом.

   Так правильнее по трём причинам. Данные не уезжают в браузер целиком.
   Права проверяются по-настоящему — тем же need(), что закрывает
   разделы, а не тем, что кнопку не показали. И одни и те же числа
   получит кто угодно ещё: бот в Битриксе, витрина, чат — не будет
   так, что платформа показывает 70, а бот 85.

   Языковой модели пока нет: инструмент называется явно. Вопрос
   человека в вызов инструмента переводит этап 2.
   ============================================================ */
window.ASSIST = (() => {
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const q = (n) => n == null ? "—"
    : String(+Number(n).toFixed(3)).replace(".", ",");

  const MOVE_LABEL = (t) => ({
    ordered: "заказано", received: "получено", shipped: "отгружено",
    installed: "смонтировано", measured: "обмерено", presented: "предъявлено",
  }[t] || t);

  let box = null;
  let LAST = null;      // последний ответ сервера — для перехода к похожим

  /* ── ответ ───────────────────────────────────────────────── */
  function answerHTML(r) {
    const it = r.item, b = r.balance;
    const row = (label, v, dim) => `<div class="as-row${dim ? " dim" : ""}">
      <span>${label}</span><b class="num">${q(v)}</b></div>`;

    return `
      <div class="as-ans">
        <div class="as-ttl">${esc(it.name)}</div>
        <div class="as-sub">${[it.brand, it.unit].filter(Boolean).map(esc).join(" · ")}</div>
        <div class="as-where">${esc(it.object)} · ${esc(it.contract.toUpperCase())}
          · ${esc(it.section)}</div>

        <div class="as-nums">
          ${row(b.plan_src === "по смете" ? "По смете" : "По проекту", b.plan)}
          ${row("Заказано", b.stages.ordered, !b.stages.ordered)}
          ${row("Получено", b.stages.received, !b.stages.received)}
          ${row("Смонтировано", b.stages.installed, !b.stages.installed)}
        </div>

        <div class="as-nums as-left">
          ${b.to_order != null ? row("Осталось заказать", b.to_order) : ""}
          ${row("В пути", b.in_transit)}
          ${row("Осталось монтажа", b.to_install)}
        </div>

        ${b.last ? `<div class="as-last">Последнее движение:
          ${esc(MOVE_LABEL(b.last.type))} ${q(b.last.qty)} ${esc(it.unit || "")},
          ${esc(String(b.last.at).slice(8, 10))}.${esc(String(b.last.at).slice(5, 7))},
          ${esc(b.last.author)}${b.last.doc_ref ? ", " + esc(b.last.doc_ref) : ""}</div>`
        : `<div class="as-last dim">Движений по этой позиции ещё нет —
             показан только план из спецификации.</div>`}

        <a class="as-go" href="${esc(it.link)}">Открыть в «Объектах»</a>

        ${r.others && r.others.length ? `<div class="as-more">
          <div class="as-more-t">Похожие позиции</div>
          ${r.others.map((o) => `<button type="button" class="as-alt"
            data-key="${esc(o.key)}">
            <b>${esc(o.name)}</b>
            <i>${esc(o.contract.toUpperCase())} · ${esc(o.section)}</i>
          </button>`).join("")}
        </div>` : ""}
      </div>`;
  }

  /* Показатели человека. Процент нигде не стоит один — рядом всегда
     «сколько из скольких»: так велит бриф, и сервер иначе данных и не
     отдаёт. */
  function personHTML(r) {
    const p = r.person;
    const line = (label, m, src) => `<div class="as-row">
      <span>${label}${src ? `<i>${src}</i>` : ""}</span>
      <b class="num">${m.pct == null ? "—" : m.pct + "%"}</b>
      <span class="as-cnt num">${m.ok} из ${m.n}</span></div>`;

    return `
      <div class="as-ans">
        <div class="as-ttl">${esc(p.name)}</div>
        <div class="as-sub">${esc(p.pos)}</div>
        <div class="as-where">${esc(p.group)} · ${esc(r.period)}</div>

        ${r.low_n ? `<div class="as-warn">Меньше ${r.low_n_threshold} дел
          с наступившим сроком — процент ни о чём не говорит, и места
          в рейтинге нет.</div>` : ""}

        <div class="as-nums">
          ${line("Общая успеваемость", r.total, "оба источника")}
          ${line("Цикл производства", r.reg, "Google-таблица")}
          ${line("Выполнение задач", r.tsk, "таблицы задач")}
        </div>

        ${r.place ? `<div class="as-nums as-left">
          <div class="as-row"><span>Место в группе «${esc(p.group)}»</span>
            <b class="num">${r.place} из ${r.of}</b></div>
        </div>` : ""}

        ${r.late && r.late.length ? `<div class="as-last">Не в срок:
          <span class="num">${r.late.length}</span> — ${esc(r.late
            .slice(0, 3).map((o) => o.title).join("; "))}${
            r.late.length > 3 ? "…" : ""}</div>` : ""}

        <a class="as-go" href="${esc(r.link)}">Открыть в «Эффективности»</a>
      </div>`;
  }

  /* Несколько однофамильцев — показываем список, а не догадку. */
  function pickHTML(r) {
    return `<div class="as-ans">
      <div class="as-ttl">Нашлось несколько</div>
      <div class="as-sub">Уточните, о ком речь</div>
      <div class="as-more">
        ${r.people.map((p) => `<button type="button" class="as-alt"
          data-person="${esc(p.key)}">
          <b>${esc(p.name)}</b><i>${esc(p.pos)}</i></button>`).join("")}
      </div></div>`;
  }

  function rankHTML(r) {
    return `
      <div class="as-ans">
        <div class="as-ttl">${esc(r.group)}</div>
        <div class="as-where">${esc(r.period)} · в рейтинге ${r.ranked},
          порог ${r.threshold} дел</div>
        <div class="as-nums">
          ${r.rows.map((x) => `<div class="as-row">
            <span><b class="as-pl">${x.place}</b>${esc(x.name)}</span>
            <b class="num">${x.pct}%</b>
            <span class="as-cnt num">${x.ok} из ${x.n}</span></div>`).join("")}
        </div>
        <a class="as-go" href="${esc(r.link)}">Открыть в «Эффективности»</a>
      </div>`;
  }

  function objectsHTML(r) {
    return `<div class="as-ans">
      <div class="as-ttl">Объекты</div>
      <div class="as-nums">
        ${r.objects.map((o) => `<div class="as-row">
          <span>${esc(o.name)}</span>
          <span class="as-cnt">${o.contracts.map(esc).join(", ")}</span>
        </div>`).join("")}
      </div></div>`;
  }

  function summaryHTML(r) {
    return `<div class="as-ans">
      <div class="as-ttl">Сводка по договорам</div>
      <div class="as-nums">
        ${r.contracts.map((c) => `<div class="as-row">
          <span>${esc(c.contract.toUpperCase())}<i>позиций ${c.items},
            с движениями ${c.touched}</i></span>
          <b class="num">${Math.round(c.sum_est).toLocaleString("ru-RU")} ₽</b>
        </div>`).join("")}
      </div></div>`;
  }

  /* ── панель ──────────────────────────────────────────────── */
  function shell() {
    if (box) return box;
    box = document.createElement("div");
    box.className = "as";
    box.hidden = true;
    box.innerHTML = `
      <div class="as-panel" role="dialog" aria-label="Ассистент">
        <div class="as-head">
          <b>Ассистент</b>
          <span class="as-beta">черновик</span>
          <button type="button" class="as-x" aria-label="Закрыть">✕</button>
        </div>
        <div class="as-body" id="asBody">
          <div class="as-hint">
            <p>Спросите про остаток по позиции — например:</p>
            <button type="button" class="as-ex">кабель греющий</button>
            <button type="button" class="as-ex">автомат 32а</button>
            <button type="button" class="as-ex">светильник</button>
            <p class="as-note">Числа считает сервер платформы, а не языковая
               модель. Разбор вопроса пока простой, по словам.</p>
          </div>
        </div>
        <form class="as-ask" id="asForm">
          <input id="asQ" placeholder="Спросить о позиции…" autocomplete="off">
          <button type="submit" aria-label="Спросить">→</button>
        </form>
      </div>`;
    document.body.appendChild(box);

    box.addEventListener("click", (e) => {
      if (e.target === box || e.target.closest(".as-x")) return close();
      const ex = e.target.closest(".as-ex");
      if (ex) { $("#asQ").value = ex.textContent.trim(); return ask(); }
      const alt = e.target.closest("[data-key]");
      if (alt) return ask({ tool: "items.balance", args: { key: alt.dataset.key } });
      const who = e.target.closest("[data-person]");
      if (who) return ask({ tool: "person.stats", args: { key: who.dataset.person } });
    });
    box.querySelector("#asForm").addEventListener("submit", (e) => {
      e.preventDefault(); ask();
    });
    return box;
  }

  const $ = (s) => box.querySelector(s);

  const none = (title, why) => {
    $("#asBody").innerHTML = `<div class="as-none">
      <b>${esc(title)}</b><p>${esc(why)}</p></div>`;
  };

  /* ── запрос ──────────────────────────────────────────────── */
  /* Панель не знает ни про спеки, ни про ключи позиций, ни про то, как
     складываются движения. Она отправляет вопрос и рисует ответ. */
  /* Панель не решает, о чём вопрос. Она отправляет фразу и рисует то,
     что вернулось: сервер сам выбирает инструмент. Когда на этапе 2
     правила заменит модель, здесь не поменяется ни строки. */
  async function ask(req) {
    const text = req ? null : $("#asQ").value.trim();
    if (!req && !text) return;
    $("#asBody").innerHTML = `<div class="as-wait">Ищу…</div>`;
    try {
      const r = await AUTH.api("POST", "/ask", req || { question: text });
      const res = r.result;
      LAST = res;

      if (r.tool === "person.stats") {
        if (res.found > 1) return void ($("#asBody").innerHTML = pickHTML(res));
        if (!res.person) return void none("Не нашёл такого сотрудника.",
          "Попробуйте фамилию так, как она записана в штате или в таблице.");
        return void ($("#asBody").innerHTML = personHTML(res));
      }
      if (r.tool === "ranking") {
        if (!res.rows.length) return void none("Некого показать.",
          `Ни у кого в группе нет ${res.threshold} дел с наступившим сроком.`);
        return void ($("#asBody").innerHTML = rankHTML(res));
      }
      if (r.tool === "objects.list") {
        return void ($("#asBody").innerHTML = objectsHTML(res));
      }
      if (r.tool === "object.summary") {
        return void ($("#asBody").innerHTML = summaryHTML(res));
      }

      if (!res || !res.item) {
        return void none("Не нашёл такой позиции.",
          "Попробуйте назвать позицию так, как она записана в смете, —"
          + " хотя бы частью названия.");
      }
      $("#asBody").innerHTML = answerHTML(res);
    } catch (e) {
      /* Ошибку показываем как есть: «Нет доступа: Объекты» — это
         содержательный ответ, а не сбой, и человек должен его увидеть. */
      $("#asBody").innerHTML = `<div class="as-none">
        <b>Не получилось</b><p>${esc(e.message)}</p></div>`;
    }
  }

  function open() {
    shell().hidden = false;
    requestAnimationFrame(() => { box.classList.add("on"); $("#asQ").focus(); });
  }
  function close() {
    if (!box) return;
    box.classList.remove("on");
    setTimeout(() => { box.hidden = true; }, 160);
  }

  /* Кнопку в шапке вешаем сами: app.js не должен знать про ассистента. */
  document.addEventListener("DOMContentLoaded", () => {
    const b = document.getElementById("askBtn");
    if (b) b.addEventListener("click", open);
  });

  document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      box && !box.hidden ? close() : open();
    }
    if (e.key === "Escape" && box && !box.hidden) close();
  });

  return { open, close };
})();
