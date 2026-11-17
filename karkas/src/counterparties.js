/* Раздел «Контрагенты» — поставщики и заказчики.

   Проверку реквизитов делает сервер, а не форма. Здесь только показ:
   контрольные цифры ИНН и счёта считаются в одном месте, иначе браузер
   и сервер однажды разойдутся во мнении, и правым окажется тот, кто
   ближе к базе.

   Ошибки сервер отдаёт списком через «; » — показываем весь список, а
   не первую строку: человек, заполнивший карточку целиком, должен
   увидеть все замечания разом. */
"use strict";

const CNT = (() => {
  const $c = (s, r) => (r || document).querySelector(s);
  const escC = (s) => String(s ?? "").replace(/[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  const KINDS = { supplier: "Поставщик", customer: "Заказчик", both: "Оба" };
  /* Значки полосы управления и строки. Держим строками рядом с разметкой:
     это часть вида, а не данных, и в общий файл им незачем. */
  const ICO = {
    find: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11"
      r="6.5"/><path d="M20.5 20.5 16 16"/></svg>`,
    plus: `<svg viewBox="0 0 24 24" aria-hidden="true"><path
      d="M12 5v14M5 12h14"/></svg>`,
    go: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>`,
  };
  /* «7 контрагентов», «1 контрагент», «22 контрагента». Число в шапке
     читают вслух, и «7 контрагент» выдало бы, что подписи собирают
     склейкой. */
  const plural = (n, one, few, many) => {
    const a = Math.abs(n) % 100, b = a % 10;
    if (a > 10 && a < 20) return many;
    if (b > 1 && b < 5) return few;
    return b === 1 ? one : many;
  };
  /* Вид лица задаёт ожидаемую длину ИНН — подсказку в поле меняем следом
     за выбором, чтобы человек видел требование до отправки, а не после. */
  const LEGAL = { org: ["Организация", 10], ip: ["Предприниматель", 12],
                  person: ["Физическое лицо", 12] };
  let ROWS = [];
  let filter = "";      // supplier | customer | ""
  let search = "";
  let editing = null;   // карточка в работе; null — новая
  /* Названия характеристик, которые уже кто-то завёл. Подставляем их
     подсказкой в поле названия: выбрать существующее проще, чем
     придумать своё написание, — и «отсрочка» не ложится второй строкой
     рядом с «Отсрочка платежа». */
  let PROP_NAMES = [];

  /* Поля карточки. Порядок — как в реквизитах на бланке: сначала кто,
     потом налоговое, потом банк, потом с кем разговаривать. Порядок был
     таким и раньше, но пятнадцать полей подряд читаются как сплошная
     стена: глазу не за что зацепиться, и человек ищет БИК перебором.
     Те же группы, только теперь названы вслух. */
  const GROUPS = [
    ["Наименование", [
      ["name", "Название", "как называют в разговоре"],
      ["full_name", "Полное наименование", "как в договоре"],
    ]],
    ["Налоговые данные", [
      ["inn", "ИНН", "10 или 12 цифр", "num", "lookup"],
      ["kpp", "КПП", "9 цифр", "num"],
      ["ogrn", "ОГРН", "13 или 15 цифр", "num"],
      ["reg_date", "Дата регистрации", "как в ЕГРЮЛ"],
      ["country", "Страна", "Россия"],
      ["address", "Адрес", "юридический"],
    ]],
    ["Банк", [
      ["bank", "Банк", ""],
      ["bik", "БИК", "9 цифр", "num"],
      ["account", "Расчётный счёт", "20 цифр", "num"],
      ["corr", "Корсчёт", "20 цифр", "num"],
    ]],
    ["Связь", [
      ["contact", "Контактное лицо", ""],
      ["phone", "Телефон", "", "num"],
      ["email", "Почта", ""],
    ]],
  ];

  /* Плоский список — по нему собирается тело запроса. Складывается из
     групп, чтобы поле нельзя было завести в форме и забыть отправить. */
  const FIELDS = GROUPS.flatMap(([, fs]) => fs);

  /* Эти поля в две колонки не помещаются: адрес и полное наименование
     обрезаются на середине, а их читают целиком. */
  const WIDE = new Set(["full_name", "address", "bank", "inn"]);

  async function load() {
    ROWS = await AUTH.api("GET", "/counterparties");
    /* Подсказка необязательна: не отдалась — форма работает как прежде,
       просто без списка. Ронять из-за неё весь раздел незачем. */
    try {
      PROP_NAMES = await AUTH.api("GET", "/counterparties/prop-names");
    } catch (e) {
      PROP_NAMES = [];
    }
    render();
  }

  /* Чего в карточке не хватает. Раздел завели ради того, чтобы реквизиты
     дозаполнить, — значит в списке важнее не сами цифры (их всё равно
     сверяют в карточке), а видно ли сразу, к кому возвращаться. Колонка
     «Банк» до этого была семью прочерками подряд и не говорила ничего. */
  function gaps(r) {
    const miss = [];
    if (!r.inn) miss.push("ИНН");
    if (!r.bik || !r.account) miss.push("банк");
    if (!r.address) miss.push("адрес");
    return miss;
  }

  function reqCell(r) {
    const miss = gaps(r);
    if (!miss.length) {
      return `<span class="cnt-ok">${escC(r.bank) || "заполнены"}</span>`;
    }
    return `<span class="cnt-gap">нет: ${miss.join(", ")}</span>`;
  }

  /* Все характеристики строки — компактными метками, а не одна первая:
     их обычно две-три коротких, и вместе они занимают меньше места, чем
     одна развёрнутая фраза. Заводить можно прямо отсюда: открывать
     карточку ради пары «Отсрочка — 14 дней» слишком долго, карточка
     нужна, когда правишь реквизиты целиком. */
  function propCell(r, can) {
    const chips = (r.props || []).filter((p) => p && p.n).map((p) => `
      <span class="cnt-chip"><i>${escC(p.n)}</i>${
        p.v ? escC(p.v) : ""}</span>`).join("");
    const add = can
      ? `<button type="button" class="cnt-chip-add" data-addprop
                 title="Добавить характеристику">+</button>`
      : "";
    if (!chips && !add) return "—";
    return `<div class="cnt-chips">${chips}${add}</div>`;
  }

  function visible() {
    const q = search.trim().toLowerCase();
    return ROWS.filter((r) => {
      if (filter && r.kind !== filter && r.kind !== "both") return false;
      if (!q) return true;
      return (r.name + " " + r.full_name + " " + r.inn).toLowerCase().includes(q);
    });
  }

  /* Раздел рисуется в два приёма. Полоса управления с полем поиска —
     один раз, в render; всё, что зависит от набранного, — в paint.

     Раньше на каждую букву перерисовывался весь раздел вместе с полем
     ввода, а курсор возвращался на место вручную. Пока перерисовка была
     мгновенной, это сходило с рук, но приём негодный: поле, в котором
     печатают, нельзя пересоздавать, пока в нём печатают. */
  function render() {
    const host = $c("#sec-cnt");
    if (!host) return;
    const can = AUTH.can(AUTH.current(), "ref_cnt");

    host.innerHTML = `
      <div class="pg">
        <div class="pg-head">
          <div class="pg-count" id="cntCount"></div>
          <div class="pg-tools">
            <label class="pg-find">${ICO.find}
              <input id="cntSearch" placeholder="Название или ИНН"
                     value="${escC(search)}"></label>
            <select class="role-sel" id="cntFilter">
              <option value="">Все</option>
              <option value="supplier"${filter === "supplier" ? " selected" : ""}>Поставщики</option>
              <option value="customer"${filter === "customer" ? " selected" : ""}>Заказчики</option>
            </select>
            ${can ? `<button type="button" class="btn-brand" id="cntNew">${
              ICO.plus}Завести</button>` : ""}
          </div>
        </div>
        <div class="pg-body" id="cntBody"></div>
        <datalist id="cntPropNames">${
          PROP_NAMES.map((n) => `<option value="${escC(n)}">`).join("")}</datalist>
      </div>`;
    wireHead(host);
    paint();
  }

  /* Тело и счётчик — всё, что меняется от поиска и фильтра. */
  function paint() {
    const body = $c("#cntBody");
    if (!body) return;
    const rows = visible();
    const can = AUTH.can(AUTH.current(), "ref_cnt");

    /* Сколько записей. Пока ничего не отсеяно — одно число: «7 из 7»
       заставляет сверять две одинаковые цифры и понимать, что фильтр
       выключен. Как только отсеяли — обе цифры к месту. */
    $c("#cntCount").innerHTML = rows.length === ROWS.length
      ? `<b>${ROWS.length}</b> ${plural(ROWS.length,
          "контрагент", "контрагента", "контрагентов")}`
      : `<b>${rows.length}</b> из ${ROWS.length}`;

    body.innerHTML = rows.length ? `
          <table class="tbl cnt-tbl" style="--tbl-min:936px">
            <!-- Доли, а не пиксели: при раскладке «по содержимому» длинное
                 описание у одного контрагента двигало колонки у всех, а от
                 жёстких пикселей первой колонке на узком окне доставались
                 остатки, и названия резались до «НАРТ…». -->
            <colgroup><col><col style="width:10%"><col style="width:11%">
              <col style="width:15%"><col style="width:13%">
              <col style="width:22%"><col style="width:57.5px"></colgroup>
            <thead><tr><th>Контрагент</th><th>Тип</th><th>ИНН</th>
              <th>Реквизиты</th><th>Контакт</th><th>Характеристики</th>
              <th></th></tr></thead>
            <tbody>${rows.map((r) => `
              <tr class="${can ? "go" : ""}" data-id="${escC(r.id)}">
                <td><span class="t-name">${escC(r.name)}</span>${r.note
                  ? `<i class="t-sub">${escC(r.note)}</i>` : ""}</td>
                <td>${KINDS[r.kind] || r.kind}</td>
                <td class="t-id">${escC(r.inn) || "<span class=dim>—</span>"}</td>
                <td>${reqCell(r)}</td>
                <td>${escC(r.contact || r.phone || r.email)
                  || "<span class=dim>—</span>"}</td>
                <td class="cnt-pcell">${propCell(r, can)}</td>
                <td class="go-c">${can ? `<button type="button" class="t-go"
                  data-edit title="Открыть карточку">${ICO.go}</button>` : ""}</td>
              </tr>`).join("")}</tbody>
          </table>`
          : `<div class="pg-empty"><b>${ROWS.length
              ? "Ничего не нашлось" : "Контрагентов пока нет"}</b>${ROWS.length
              ? "Попробуйте другое написание или снимите фильтр по типу."
              : "Заведите первого — поставщика или заказчика. Реквизиты"
                + " можно заполнить сразу по ИНН."}</div>`;
    wireBody(body);
  }

  function wireHead(host) {
    const can = AUTH.can(AUTH.current(), "ref_cnt");
    // Поле ввода не трогаем вовсе: перерисовывается только тело, и
    // курсор остаётся там, где его оставил человек, сам собой.
    $c("#cntSearch", host).addEventListener("input", (e) => {
      search = e.target.value;
      paint();
    });
    const sel = $c("#cntFilter", host);
    const onFilter = (e) => { filter = e.target.value; paint(); };
    sel.addEventListener("change", onFilter);
    sel.addEventListener("input", onFilter);
    if (can) $c("#cntNew", host).addEventListener("click", () => openCard(null));
  }

  function wireBody(host) {
    /* Карточку открывает вся строка, а не кнопка в её конце. Стрелка
       справа осталась, но она теперь обещание, а не единственный способ:
       кликают обычно по названию. */
    host.querySelectorAll("tr.go").forEach((tr) => {
      tr.addEventListener("click", () =>
        openCard(ROWS.find((r) => r.id === tr.dataset.id)));
    });
    host.querySelectorAll("[data-addprop]").forEach((b) => {
      /* Клик до строки не доходит: иначе поверх начатого ввода
         открывалась бы карточка. Проверкой «клик пришёл из ячейки с
         метками» тут не обойтись — кнопка сама себя заменяет формой, и к
         моменту всплытия она уже вынута из документа: искать её предков
         не по чему. */
      b.addEventListener("click", (e) => {
        e.stopPropagation();
        inlineProp(b);
      });
    });
  }

  /* Добавление характеристики прямо в строке. Форма живёт на месте
     кнопки «+» и после сохранения исчезает — ради двух слов открывать
     карточку со всеми реквизитами незачем. */
  function inlineProp(btn) {
    const id = btn.closest("tr").dataset.id;
    const box = document.createElement("span");
    box.className = "cnt-chip-new";
    box.innerHTML = `
      <input class="cnt-chip-n" list="cntPropNames" placeholder="название"
             maxlength="40">
      <input class="cnt-chip-v" placeholder="значение" maxlength="300">
      <button type="button" class="cnt-chip-ok" title="Сохранить">✓</button>
      <button type="button" class="cnt-chip-no" title="Отмена">×</button>`;
    btn.replaceWith(box);
    // Строка под формой кликабельна — гасим, чтобы набор пары
    // «название — значение» не заканчивался открытием карточки.
    box.addEventListener("click", (e) => e.stopPropagation());
    const nBox = $c(".cnt-chip-n", box);
    const vBox = $c(".cnt-chip-v", box);
    nBox.focus();

    const cancel = () => { box.replaceWith(btn); };
    const save = async () => {
      const n = nBox.value.trim();
      if (!n) { nBox.focus(); return; }
      const cur = ROWS.find((r) => r.id === id);
      const props = [...(cur.props || []), { n, v: vBox.value.trim() }];
      $c(".cnt-chip-ok", box).disabled = true;
      try {
        await AUTH.api("PATCH", "/counterparties/" + id, { props });
        await load();
      } catch (e) {
        /* Сообщение сервера показываем на самой строке: модальное окно
           ради «указана дважды» перекрыло бы то, что человек правит. */
        box.classList.add("bad");
        nBox.title = String(e.message);
        nBox.focus();
        $c(".cnt-chip-ok", box).disabled = false;
      }
    };

    $c(".cnt-chip-ok", box).addEventListener("click", save);
    $c(".cnt-chip-no", box).addEventListener("click", cancel);
    box.addEventListener("keydown", (e) => {
      if (e.key === "Enter") { e.preventDefault(); save(); }
      if (e.key === "Escape") { e.preventDefault(); cancel(); }
    });
  }

  /* Карточка. Описание стоит первым после названия: это единственное
     поле, которое читают глазами, — остальные сверяют. */
  function openCard(row) {
    editing = row;
    const box = document.createElement("div");
    box.className = "pf-modal";
    box.innerHTML = `
      <div class="pf-crop cnt-card" role="dialog" aria-label="Контрагент">
        <h3>${row ? escC(row.name) : "Новый контрагент"}</h3>
        <div class="fld"><label for="c-kind">Тип</label>
          <select id="c-kind">
            ${Object.entries(KINDS).map(([k, t]) => `<option value="${k}"${
              row && row.kind === k ? " selected" : ""}>${t}</option>`).join("")}
          </select></div>
        <div class="fld"><label for="c-legal">Вид лица</label>
          <select id="c-legal">
            ${Object.entries(LEGAL).map(([k, [t]]) => `<option value="${k}"${
              row && row.legal === k ? " selected" : ""}>${t}</option>`).join("")}
          </select></div>
        <div class="fld"><label for="c-note">Описание</label>
          <textarea id="c-note" rows="2"
            placeholder="что возит, как работаем, на что смотреть">${
            escC(row ? row.note : "")}</textarea></div>
        ${GROUPS.map(([title, fs]) => `
          <div class="cnt-group">
            <h4>${title}</h4>
            <div class="cnt-grid">
              ${fs.map(([k, label, hint, cls, extra]) => `
                <div class="fld${WIDE.has(k) ? " wide" : ""}">
                  <label for="c-${k}">${label}</label>
                  <div class="fld-row">
                    <input id="c-${k}" class="${cls || ""}"
                           placeholder="${escC(hint)}"
                           value="${escC(row ? row[k] : "")}">
                    ${extra === "lookup"
                      ? `<button type="button" class="btn ghost cnt-lookup"
                                 id="cntLookup">Заполнить по ИНН</button>` : ""}
                  </div></div>`).join("")}
            </div>
          </div>`).join("")}
        <div class="cnt-group">
          <h4>Ещё контакты</h4>
          <div class="cnt-props" id="cntCts"></div>
          <button type="button" class="lnk cnt-addprop" id="cntAddCt">
            + ещё контакт</button>
        </div>
        <div class="cnt-group">
          <h4>Характеристики</h4>
          <div class="cnt-props" id="cntProps"></div>
          <button type="button" class="lnk cnt-addprop" id="cntAddProp">
            + добавить характеристику</button>
        </div>
        <datalist id="cntPropNames">${
          PROP_NAMES.map((n) => `<option value="${escC(n)}">`).join("")}</datalist>
        <div class="pf-note bad" id="cntErr" hidden></div>
        <div class="pf-modal-foot">
          ${row ? `<button type="button" class="btn ghost" id="cntDel">Удалить</button>` : ""}
          <span class="grow"></span>
          <button type="button" class="btn ghost" id="cntNo">Отмена</button>
          <button type="button" class="btn" id="cntOk">Сохранить</button>
        </div>
      </div>`;
    document.body.appendChild(box);

    const close = () => { document.removeEventListener("keydown", onKey); box.remove(); };
    const onKey = (e) => { if (e.key === "Escape") close(); };
    document.addEventListener("keydown", onKey);
    box.addEventListener("click", (e) => { if (e.target === box) close(); });
    $c("#cntNo", box).addEventListener("click", close);
    $c("#c-name", box).focus();

    /* Подсказка в поле ИНН идёт за видом лица: требование должно быть
       видно до отправки, а не приходить ошибкой после. */
    const legalSel = $c("#c-legal", box);
    const innBox = $c("#c-inn", box);
    const syncInn = () => {
      const n = (LEGAL[legalSel.value] || LEGAL.org)[1];
      innBox.placeholder = n + " цифр";
    };
    legalSel.addEventListener("change", syncInn);
    legalSel.addEventListener("input", syncInn);
    syncInn();

    /* Заполнение реквизитов из открытых данных ФНС по ИНН.
       Заполняем только ПУСТЫЕ поля: если человек уже что-то вписал
       руками, затирать это ответом справочника нельзя — может, он правил
       осознанно. Расхождения показываем текстом, решение за ним. */
    const lookupBtn = $c("#cntLookup", box);
    if (lookupBtn) {
      lookupBtn.addEventListener("click", async () => {
        const err = $c("#cntErr", box);
        const inn = $c("#c-inn", box).value.replace(/\D/g, "");
        lookupBtn.disabled = true;
        lookupBtn.textContent = "Ищу…";
        try {
          const d = await AUTH.api(
            "GET", "/counterparties/lookup?inn=" + encodeURIComponent(inn));
          const put = { full_name: d.full_name, kpp: d.kpp, ogrn: d.ogrn,
                        reg_date: d.reg_date, address: d.address };
          const filled = [], differs = [];
          for (const [k, v] of Object.entries(put)) {
            if (!v) continue;
            const el = $c("#c-" + k, box);
            if (!el.value.trim()) { el.value = v; filled.push(k); }
            else if (el.value.trim() !== v) { differs.push(k); }
          }
          if (d.legal) $c("#c-legal", box).value = d.legal;
          if (!$c("#c-name", box).value.trim() && d.short_name) {
            $c("#c-name", box).value = d.short_name;
          }
          const msg = [];
          msg.push(filled.length
            ? `Заполнено полей: ${filled.length}.`
            : "Все поля уже были заполнены.");
          if (!d.address) msg.push("Адрес ФНС по этому ИНН не отдаёт.");
          if (differs.length) {
            msg.push(`Отличается от ФНС: ${differs.join(", ")} — не трогал.`);
          }
          if (d.head) msg.push(d.head);
          err.classList.remove("bad");
          err.innerHTML = msg.map((x) => `<div>${escC(x)}</div>`).join("");
          err.hidden = false;
        } catch (e) {
          err.classList.add("bad");
          err.innerHTML = `<div>${escC(String(e.message))}</div>`;
          err.hidden = false;
        }
        lookupBtn.disabled = false;
        lookupBtn.textContent = "Заполнить по ИНН";
      });
    }

    /* Строки характеристик добавляем по одной, а не перерисовкой всего
       списка: перерисовка сбрасывала бы фокус и уже набранный текст в
       соседних полях. */
    const propsBox = $c("#cntProps", box);
    const addProp = (n, v) => {
      const line = document.createElement("div");
      line.className = "cnt-prop";
      line.innerHTML = `
        <input class="cnt-prop-n" list="cntPropNames" placeholder="название"
               maxlength="40" value="${escC(n || "")}">
        <input class="cnt-prop-v" placeholder="значение"
               maxlength="300" value="${escC(v || "")}">
        <button type="button" class="lnk cnt-prop-del"
                aria-label="Убрать характеристику">×</button>`;
      line.querySelector(".cnt-prop-del")
        .addEventListener("click", () => line.remove());
      propsBox.appendChild(line);
      return line;
    };
    ((row && row.props) || []).forEach((p) => addProp(p.n, p.v));
    $c("#cntAddProp", box).addEventListener("click", () => {
      addProp("", "").querySelector(".cnt-prop-n").focus();
    });

    /* Ещё контакты (14.10.2026): у поставщика бывает несколько человек —
       по кабелю, по щитам. Основной — в «Связи» выше. */
    const ctsBox = $c("#cntCts", box);
    const addCt = (x) => {
      const line = document.createElement("div");
      line.className = "cnt-prop cnt-ct";
      line.innerHTML = `
        <input data-c="name" placeholder="контактное лицо" maxlength="200" value="${escC(x.name || "")}">
        <input data-c="phone" placeholder="телефон" maxlength="200" value="${escC(x.phone || "")}">
        <input data-c="email" placeholder="e-mail" maxlength="200" value="${escC(x.email || "")}">
        <button type="button" class="lnk cnt-prop-del" aria-label="Убрать контакт">×</button>`;
      line.querySelector(".cnt-prop-del").addEventListener("click", () => line.remove());
      ctsBox.appendChild(line);
      return line;
    };
    ((row && row.contacts) || []).forEach(addCt);
    $c("#cntAddCt", box).addEventListener("click", () => {
      addCt({}).querySelector("input").focus();
    });

    if (row) {
      $c("#cntDel", box).addEventListener("click", async () => {
        if (!(await ASK.confirm(`Убрать «${row.name}» из списка?`))) return;
        await AUTH.api("DELETE", "/counterparties/" + row.id);
        close();
        load();
      });
    }

    $c("#cntOk", box).addEventListener("click", async () => {
      const body = { kind: $c("#c-kind", box).value,
                     legal: $c("#c-legal", box).value,
                     note: $c("#c-note", box).value };
      for (const [k] of FIELDS) body[k] = $c("#c-" + k, box).value;
      /* Пустые строки не отсеиваем здесь: их выбрасывает сервер, и пусть
         решение, что считать пустым, остаётся в одном месте. */
      body.props = [...box.querySelectorAll(".cnt-prop:not(.cnt-ct)")].map((line) => ({
        n: line.querySelector(".cnt-prop-n").value,
        v: line.querySelector(".cnt-prop-v").value,
      }));
      body.contacts = [...box.querySelectorAll(".cnt-ct")].map((line) => Object.fromEntries(
        [...line.querySelectorAll("[data-c]")].map((i) => [i.dataset.c, i.value])));
      const err = $c("#cntErr", box);
      const btn = $c("#cntOk", box);
      btn.disabled = true;
      try {
        if (row) await AUTH.api("PATCH", "/counterparties/" + row.id, body);
        else await AUTH.api("POST", "/counterparties", body);
        close();
        load();
      } catch (e) {
        /* Сервер шлёт все замечания через «; » — разворачиваем в список,
           чтобы человек увидел их разом, а не по одному за отправку.
           Класс возвращаем: тот же блок используется для спокойного
           отчёта о заполнении по ИНН и мог остаться не красным. */
        err.classList.add("bad");
        err.innerHTML = String(e.message).split("; ")
          .map((x) => `<div>${escC(x)}</div>`).join("");
        err.hidden = false;
        btn.disabled = false;
      }
    });
  }

  return { load };
})();
