/* Свои компании — от кого выставляется калькуляция и на ком договор.

   Держим отдельно от контрагентов намеренно: там внешние, здесь свои, и
   смешать их значит однажды выставить счёт самим себе. Их две-три, они
   почти не меняются, но реквизиты и подписант из этой карточки уходят в
   подписываемый документ — потому и правятся здесь, а не в базе руками.

   Два вида (18.09.2026): кратко — строка на компанию с основным счётом,
   подробно — вся карточка. Раньше карточки были всегда развёрнуты, и
   чтобы увидеть вторую компанию, приходилось листать полтора десятка
   полей первой. Вид помним в браузере: это привычка человека, а не
   данные компании.

   Счёт у компании не один: основной, запасной, отдельный под эквайринг.
   Они живут списком, один помечен основным — он и подставляется в
   карточку предприятия, которую просят контрагенты перед оплатой.

   Учредительные документы лежат при компании, но открываются только по
   отдельному праву: устав и приказы нужны не всем, кому открыты
   справочники. То же с выгрузкой реквизитов — она своё право. */
"use strict";

const ORGS = (() => {
  const $o = (s, r) => (r || document).querySelector(s);
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  const PLUS = `<svg viewBox="0 0 24 24" aria-hidden="true"><path
    d="M12 5v14M5 12h14"/></svg>`;
  const DOWN = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 10l5 5 5-5"/></svg>`;
  const UP = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 14l5-5 5 5"/></svg>`;
  const OUT = `<svg viewBox="0 0 24 24" aria-hidden="true"><path
    d="M12 4v11M8 11l4 4 4-4M5 18v1a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-1"/></svg>`;
  const UPL = `<svg viewBox="0 0 24 24" aria-hidden="true"><path
    d="M12 16V4M7 9l5-5 5 5M4 17v2a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-2"/></svg>`;
  const DOC = `<svg viewBox="0 0 24 24" aria-hidden="true"><path
    d="M6 3.5h7.5L18 8v12.5H6z"/><path d="M13.5 3.5V8H18"/></svg>`;
  const TRASH = `<svg viewBox="0 0 24 24" aria-hidden="true"><path
    d="M4.5 6.5h15M9.5 6.5V4.8A1.3 1.3 0 0 1 10.8 3.5h2.4a1.3 1.3 0 0 1 1.3 1.3v1.7M6.5
    6.5l.9 12.2A1.5 1.5 0 0 0 8.9 20h6.2a1.5 1.5 0 0 0 1.5-1.3l.9-12.2"/></svg>`;

  /* Поля карточки по группам: ключ, подпись, подсказка, во всю ширину.
     Название вынесено в шапку карточки, здесь его нет. Банк сюда больше
     не входит: счета — отдельным списком. Состав — по бланку карточки
     предприятия заказчика (22.09.2026): всё, что в ней печатается. */
  const GROUPS = [
    ["Наименование", [
      ["name", "Название", "например, ООО «Электромонтаж»"],
      ["short_name", "Короткое имя", "для метки в списке: Электро"],
      ["full_name", "Полное наименование", "как в учредительных документах", true],
    ]],
    ["Реквизиты", [
      ["inn", "ИНН", "10 или 12 цифр"],
      ["kpp", "КПП", "9 цифр"],
      ["ogrn", "ОГРН", "13 или 15 цифр"],
      ["okpo", "ОКПО", "8 или 10 цифр"],
      ["oktmo", "ОКТМО", "8 или 11 цифр"],
      ["reg_date", "Дата постановки на учёт", "например, 12.04.2012 г."],
      ["okved", "ОКВЭД", "например, 43.21 (производство электромонтажных работ)", true],
      ["address", "Юридический адрес", "", true],
      ["address_fact", "Фактический адрес", "совпадает с юридическим — впишите его же", true],
    ]],
    ["Руководитель", [
      ["director_post", "Должность", "например, Директор"],
      ["director", "ФИО полностью", "например, Иванов Сергей Петрович"],
      ["director_basis", "Основание полномочий", "например, действует на основании Устава", true],
    ]],
    ["Контакты", [
      ["phone", "Телефон / факс", "например, 8(343)300 31 78"],
      ["email", "E-mail", "например, info@company.ru"],
      ["site", "Сайт", "например, www.company.ru"],
    ]],
    ["Подпись внизу карточки", [
      ["signer_post", "Должность", "например, Управляющий-индивидуальный предприниматель"],
      ["signer_name", "Фамилия и инициалы", "например, С.П. Иванов"],
    ]],
  ];

  // Поля счёта: ключ, подпись, подсказка, ширина в сетке.
  const ACC = [
    ["name", "Назначение", "основной, эквайринг…"],
    ["bank", "Банк", "", true],
    ["bik", "БИК", "9 цифр"],
    ["account", "Расчётный счёт", "20 цифр"],
    ["corr", "Корсчёт", "20 цифр"],
  ];

  // Блоки карточки предприятия — те же, что на сервере (org_card.py).
  const BLOCKS = [
    ["head", "Шапка бланка — логотип, реквизиты, контакты"], ["names", "Наименование"],
    ["address", "Адреса"], ["director", "Руководитель"], ["bank", "Банковские реквизиты"],
    ["codes", "ИНН, КПП, ОКТМО, ОКПО, ОГРН, ОКВЭД"],
    ["contacts", "Телефон и дата постановки на учёт"], ["signer", "Подпись внизу"],
  ];

  /* Та же палитра, что на сервере (ORG_COLORS в deploy/api.py): восемь
     оттенков, различимых в обеих темах. Первые два — как просил
     заказчик: Электро оранжевым, Электромонтаж изумрудным. */
  const COLORS = [
    ["#F04E0E", "оранжевый"], ["#0F9D77", "изумрудный"], ["#2563EB", "синий"],
    ["#7C3AED", "фиолетовый"], ["#0891B2", "бирюзовый"], ["#B07A18", "янтарный"],
    ["#DB2777", "малиновый"], ["#64748B", "серый"],
  ];

  let ROWS = [];
  const OPEN = new Set();       // какие компании раскрыты в кратком виде
  const SHUT = new Set();       // какие свёрнуты в подробном
  const isOpen = (r) => (mode === "full" ? !SHUT.has(r.id) : OPEN.has(r.id));
  const MODE_KEY = "karkas.orgs.mode.v1";
  let mode = "short";
  try { mode = localStorage.getItem(MODE_KEY) === "full" ? "full" : "short"; } catch (e) { /* без памяти */ }

  // Заводят и правят свои юрлица администраторы: меняются они раз в год,
  // а видят их все, кому открыты справочники.
  const can = () => AUTH.isAdmin(AUTH.current());
  const canDocs = () => AUTH.can(AUTH.current(), "org_docs");
  const canCard = () => AUTH.can(AUTH.current(), "org_export");

  const plural = (n, one, few, many) => {
    const a = Math.abs(n) % 100, b = a % 10;
    if (a > 10 && a < 20) return many;
    if (b > 1 && b < 5) return few;
    return b === 1 ? one : many;
  };
  const size = (n) => n < 1048576 ? Math.max(1, Math.round(n / 1024)) + " КБ"
    : (n / 1048576).toFixed(1).replace(".", ",") + " МБ";
  const dmy = (s) => {
    if (!s) return "";
    const d = new Date(s);
    return isNaN(d) ? String(s).slice(0, 10) : d.toLocaleDateString("ru-RU");
  };
  const mainAcc = (r) => (r.accounts || []).find((a) => a.main) || (r.accounts || [])[0] || null;
  const accLine = (a) => a ? [a.bank, a.account].filter(Boolean).join(" · ") : "";

  async function load() {
    ROWS = await AUTH.api("GET", "/orgs");
    render();
  }

  function note(text, bad) {
    const box = $o("#orgNote");
    if (!box) return;
    box.textContent = text;
    box.classList.toggle("bad", !!bad);
    box.hidden = false;
  }

  // Ответ сервера на правку счёта или документа — вся компания целиком:
  // основной счёт мог смениться, и перерисовывать надо карточку, а не строку.
  function put(org) {
    const i = ROWS.findIndex((x) => x.id === org.id);
    if (i >= 0) ROWS[i] = org; else ROWS.push(org);
    render();
  }

  function render() {
    const host = $o("#sec-org");
    if (!host) return;
    // Прокрутку сохраняем: перерисовка после правки счёта или документа
    // иначе бросала к началу списка.
    const was = $o("#orgBody", host);
    const top = was ? was.scrollTop : 0;
    const n = ROWS.length;
    host.innerHTML = `
      <div class="pg">
        <div class="pg-head">
          <div class="pg-count"><b>${n}</b> ${
            plural(n, "компания", "компании", "компаний")}</div>
          <div class="pg-tools">
            <div class="seg org-mode">
              <button type="button" class="seg-b${mode === "short" ? " on" : ""}"
                data-mode="short">Кратко</button>
              <button type="button" class="seg-b${mode === "full" ? " on" : ""}"
                data-mode="full">Подробно</button>
            </div>
            ${can() ? `<button type="button" class="btn-brand" id="orgNew">${
              PLUS}Добавить</button>` : ""}
          </div>
        </div>
        <div class="pg-body" id="orgBody">${n ? ROWS.map(orgHtml).join("")
          : `<div class="pg-empty"><b>Компаний пока нет</b>Заведите юрлицо,
               от имени которого выставляете калькуляции и на котором
               держите договоры. Реквизиты и подписант уйдут в шапку и
               подпись выгруженного документа, цвет — в метку объекта.</div>`}
        </div>
        <div class="pg-note" id="orgNote" hidden></div>
      </div>`;
    const body = $o("#orgBody", host);
    if (body && top) body.scrollTop = top;
    // Кнопки строки — одним слушателем: строку перерисовывают отдельно от
    // остального (после правки поля), и заново вешать на неё обработчики
    // не придётся.
    host.onclick = onRowClick;
    wire(host);
  }

  function orgHtml(r) {
    const open = isOpen(r);
    return `
      <section class="org${open ? " open" : ""}${r.active ? "" : " off"}" data-id="${esc(r.id)}"
               style="--org:${esc(r.color || "#64748B")}">
        ${head(r, open)}${open ? more(r) : ""}
      </section>`;
  }

  /* Строка компании — одна и та же в кратком и подробном виде (22.09.2026):
     раскрыли — поля дописываются ниже, а сама строка, её столбцы и кнопки
     остаются на местах. В строке — то, что спрашивают чаще всего: название
     с ИНН, КПП и ОГРН, руководитель, телефон с почтой и основной счёт.
     Столбцы у всех компаний одни, и глазом их сравнивать удобно. */
  function head(r, open) {
    const acc = mainAcc(r);
    const n = (r.accounts || []).length;
    const docs = (r.docs || []).length;
    const cell = (b, i, title) => `
        <div class="org-cell" title="${esc(title)}"><b${b ? "" : ' class="dim"'}>${
          b ? esc(b) : "—"}</b><i>${esc(i || "")}</i></div>`;
    const req = [r.inn ? "ИНН " + r.inn : "", r.kpp ? "КПП " + r.kpp : "",
                 r.ogrn ? "ОГРН " + r.ogrn : ""].filter(Boolean).join(" · ");
    const boss = r.director || r.signer_name;
    return `
      <div class="org-row">
        <span class="org-dot" title="Цвет метки в списке объектов"></span>
        <div class="org-cell org-main"><b>${esc(r.name) || "Без названия"}</b>
          <i>${esc([req || "реквизиты не заполнены", r.active ? "" : "не действует"]
            .filter(Boolean).join(" · "))}</i></div>
        ${cell(boss, r.director ? r.director_post || "руководитель"
          : r.signer_post || "руководитель", "Руководитель")}
        ${cell(r.phone, r.email || r.site || (r.phone ? "" : "контакты не заполнены"), "Контакты")}
        ${cell(acc ? accLine(acc) : "", acc ? `${acc.name || "основной счёт"}${n > 1
          ? ` · ещё ${n - 1} ${plural(n - 1, "счёт", "счёта", "счетов")}` : ""}`
          : "счёт не заведён", "Основной счёт")}
        <div class="org-acts">
          ${canDocs() && docs ? `<span class="org-docs-n" title="Учредительные документы: ${docs}">${
            DOC}${docs}</span>` : ""}
          ${canCard() ? `<button type="button" class="btn-ghost sm" data-card
            title="Выгрузить карточку предприятия — PDF или Excel">${OUT}Карточка предприятия</button>` : ""}
          <button type="button" class="btn-ghost sm org-toggle" data-toggle
            aria-expanded="${open}">${open ? UP : DOWN}${open ? "Свернуть" : "Подробно"}</button>
          ${can() ? `<button type="button" class="ico warn" data-rm
            title="Убрать компанию из справочника">${TRASH}</button>` : ""}
        </div>
      </div>`;
  }

  /* Подробности — под строкой: все поля карточки, логотип, счета,
     документы, метка в списке объектов. */
  function more(r) {
    const color = r.color || "#64748B";
    const ro = can() ? "" : " readonly";
    // Подсказка — пример, и начинается с «например»: серый пример
    // «8(343)300 31 78» в пустом поле принимали за вписанный телефон, а в
    // карточку пустое поле не идёт (22.09.2026).
    const field = ([k, label, hint, wide]) => `
      <div class="fld${wide ? " wide" : ""}">
        <label for="${esc(r.id)}-${k}">${esc(label)}</label>
        <input id="${esc(r.id)}-${k}" data-f="${k}" value="${esc(r[k] || "")}"
               placeholder="${esc(hint)}" autocomplete="off"${ro}>
      </div>`;
    return `
      <div class="org-more">
        ${GROUPS.map(([title, fs]) => `
          <div class="cnt-group"><h4>${esc(title)}</h4>
            <div class="cnt-grid">${fs.map(field).join("")}</div>
          </div>`).join("")}
        ${logoHtml(r)}
        ${faxHtml(r)}
        ${accountsHtml(r)}
        ${canDocs() ? docsHtml(r) : ""}
        <div class="cnt-group"><h4>В списке объектов</h4>
          <div class="org-list-set">
            <div class="org-sw">${COLORS.map(([c, name]) => `
              <button type="button" data-color="${c}" style="--c:${c}"
                      class="${c.toLowerCase() === color.toLowerCase() ? "on" : ""}"
                      title="${esc(name)}"${can() ? "" : " disabled"}></button>`).join("")}
            </div>
            <!-- Закрытое юрлицо не удаляют: на нём остаются договоры. Его
                 снимают с выбора этой галочкой. -->
            <label class="org-check"><input type="checkbox" data-f="active"${
              r.active ? " checked" : ""}${can() ? "" : " disabled"}>действует — её можно выбрать
              в объекте и в калькуляции</label>
          </div>
        </div>
      </div>`;
  }

  /* Кнопки строки: карточка предприятия, раскрыть, убрать. */
  async function onRowClick(e) {
    const b = e.target.closest("[data-card], [data-toggle], [data-rm]");
    if (!b || !b.closest("#orgBody")) return;
    const sec = b.closest(".org");
    const r = ROWS.find((x) => x.id === sec.dataset.id);
    if (!r) return;
    if (b.hasAttribute("data-card")) return openCard(r);
    if (b.hasAttribute("data-toggle")) return toggle(sec, r);
    if (!(await ASK.confirm(`Убрать «${r.name}»? Калькуляции от её имени больше не выставить.`))) return;
    try {
      await AUTH.api("DELETE", "/orgs/" + r.id);
      ROWS = ROWS.filter((x) => x.id !== r.id);
      render();
    } catch (err) {
      note("Не вышло: " + err.message, true);
    }
  }

  /* Раскрыть и свернуть — на месте: подробности дописываются под строкой
     или уходят из-под неё, остальной список не перерисовывается и не
     прыгает, прокрутка остаётся где была. */
  function toggle(sec, r) {
    const open = !sec.classList.contains("open");
    if (mode === "full") {
      if (open) SHUT.delete(r.id); else SHUT.add(r.id);
    } else if (open) OPEN.add(r.id); else OPEN.delete(r.id);
    sec.classList.toggle("open", open);
    const old = sec.querySelector(".org-more");
    if (old) old.remove();
    if (open) {
      sec.insertAdjacentHTML("beforeend", more(r));
      wire(sec.querySelector(".org-more"));
    }
    paintHead(sec, r);
  }

  /* Строку — заново по свежим данным: переименовали, вписали телефон. */
  function paintHead(sec, r) {
    const row = sec && sec.querySelector(".org-row");
    if (row && r) row.outerHTML = head(r, sec.classList.contains("open"));
  }

  /* Логотип для шапки карточки предприятия — тот, что на бланке
     компании. Без него шапка печатается одними строками реквизитов. */
  function logoHtml(r) {
    return `
      <div class="cnt-group"><h4>Логотип для шапки карточки</h4>
        <div class="org-logo">
          ${r.logo ? `<img src="/api/orgs/${encodeURIComponent(r.id)}/logo?v=${esc(r.logo)}"
              alt="Логотип ${esc(r.name)}">`
            : `<p class="mat-form-hint">Логотипа нет — шапка карточки печатается без него.
                 Подойдёт картинка с бланка компании, PNG или JPEG до 1 МБ.</p>`}
          ${can() ? `<span class="org-logo-acts">
            <label class="btn-ghost sm">${UPL}${r.logo ? "Заменить" : "Загрузить логотип"}
              <input type="file" data-logo-file accept="image/png,image/jpeg" hidden></label>
            ${r.logo ? `<button type="button" class="lnk warn" data-logo-rm>Убрать</button>` : ""}
          </span>` : ""}
        </div>
      </div>`;
  }

  /* Факсимиле подписи руководителя (заказчик, 02.10.2026: «шеф расписался,
     сфоткали — и подпись встала в документ с вырезанным фоном»). Фон
     вырезает сервер (facsimile.py); здесь — фото, просмотр и «Убрать».
     Картинку отдают только после входа, поэтому <img> получает её не
     адресом, а запросом с токеном (faxSrc). */
  const FAX_TIP = "Сфотографируйте подпись на белом листе — фон вырежется сам, чернила станут"
    + " ровного цвета. Подпись встанет на линию подписи в карточке предприятия и в калькуляции"
    + " PDF; в окне выгрузки её можно отключить.";
  function faxHtml(r) {
    const tip = typeof TIPS === "object" ? TIPS.icon(FAX_TIP) : "";
    return `
      <div class="cnt-group"><h4 class="org-fax-h">Факсимиле подписи${tip}</h4>
        <div class="org-logo org-fax">
          ${r.facsimile ? `<span class="org-fax-img"><img data-fax-img="${esc(r.id)}"
              data-v="${esc(r.facsimile)}" alt="Подпись ${esc(r.signer_name || "")}"></span>`
            : `<p class="mat-form-hint">Подписи нет — документы печатаются с пустой линией подписи.</p>`}
          ${can() ? `<span class="org-logo-acts">
            <label class="btn-ghost sm">${UPL}${r.facsimile ? "Заменить" : "Загрузить фото подписи"}
              <input type="file" data-fax-file accept="image/*" hidden></label>
            ${r.facsimile ? `<button type="button" class="lnk warn" data-fax-rm>Убрать</button>` : ""}
          </span>` : ""}
        </div>
      </div>`;
  }

  const FAX_URL = {};        // etag → адрес картинки в памяти браузера
  async function faxSrc(img) {
    const key = img.dataset.faxImg + ":" + img.dataset.v;
    if (!FAX_URL[key]) {
      const res = await fetch("/api/orgs/" + encodeURIComponent(img.dataset.faxImg)
        + "/facsimile?v=" + encodeURIComponent(img.dataset.v),
        { headers: { Authorization: "Bearer " + AUTH.token() } });
      if (!res.ok) return;
      FAX_URL[key] = URL.createObjectURL(await res.blob());
    }
    img.src = FAX_URL[key];
  }

  /* Фото с телефона: браузер поворачивает его по EXIF, читает HEIC с
     айфона и уменьшает — на сервер едет JPEG, длинная сторона до 1600. */
  async function faxPhoto(f) {
    const url = URL.createObjectURL(f);
    try {
      const img = await new Promise((ok, fail) => {
        const i = new Image();
        i.onload = () => ok(i);
        i.onerror = () => fail(new Error("Не удалось открыть фото — нужна картинка JPEG или PNG"));
        i.src = url;
      });
      const k = Math.min(1, 1600 / Math.max(img.naturalWidth, img.naturalHeight));
      const c = document.createElement("canvas");
      c.width = Math.max(1, Math.round(img.naturalWidth * k));
      c.height = Math.max(1, Math.round(img.naturalHeight * k));
      const g = c.getContext("2d");
      g.fillStyle = "#fff";
      g.fillRect(0, 0, c.width, c.height);
      g.drawImage(img, 0, 0, c.width, c.height);
      return c.toDataURL("image/jpeg", 0.92);
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  /* Счета: каждый — своя строка полей. Основной помечен и подставляется
     в выгрузку; остальные ждут своей очереди. */
  function accountsHtml(r) {
    const list = r.accounts || [];
    const ro = can() ? "" : " readonly";
    return `
      <div class="cnt-group"><h4>Расчётные счета${
        list.length ? ` <i class="dim">${list.length}</i>` : ""}</h4>
        ${list.length ? `<div class="org-accs">${list.map((a) => `
          <div class="org-acc${a.main ? " main" : ""}" data-acc="${esc(a.id)}">
            <div class="org-acc-top">
              ${a.main ? `<span class="org-acc-tag">основной</span>`
                : can() ? `<button type="button" class="lnk" data-main
                    title="Подставлять этот счёт в карточку предприятия">Сделать основным</button>` : ""}
              <span class="grow"></span>
              ${can() ? `<button type="button" class="lnk warn" data-acc-rm
                title="Убрать счёт">×</button>` : ""}
            </div>
            <div class="cnt-grid">${ACC.map(([k, label, hint, wide]) => `
              <div class="fld${wide ? " wide" : ""}">
                <label for="${esc(a.id)}-${k}">${esc(label)}</label>
                <input id="${esc(a.id)}-${k}" data-af="${k}" value="${esc(a[k] || "")}"
                       placeholder="${esc(hint)}" autocomplete="off"${ro}>
              </div>`).join("")}</div>
          </div>`).join("")}</div>`
          : `<p class="mat-form-hint">Счёта пока нет. Он нужен в карточке предприятия,
               которую просят контрагенты перед оплатой.</p>`}
        ${can() ? `<button type="button" class="btn-ghost sm org-acc-add" data-acc-add>${
          PLUS}Счёт</button>` : ""}
      </div>`;
  }

  /* Учредительные документы: устав, свидетельства, приказы. Лежат при
     компании и мимо «Файлов» — их открывают только по своему праву. */
  function docsHtml(r) {
    const list = r.docs || [];
    return `
      <div class="cnt-group"><h4>Учредительные документы${
        list.length ? ` <i class="dim">${list.length}</i>` : ""}</h4>
        ${list.length ? `<div class="org-docs">${list.map((d) => `
          <div class="org-doc" data-doc="${esc(d.id)}">
            <button type="button" class="lnk org-doc-open" data-doc-open
              title="Открыть документ">${DOC}<span>${esc(d.title || d.filename)}</span></button>
            <i class="dim">${esc(d.filename)} · ${size(d.size || 0)} · ${esc(dmy(d.at))}${
              d.author ? ", " + esc(d.author) : ""}</i>
            <span class="grow"></span>
            <button type="button" class="lnk" data-doc-edit title="Переименовать">✎</button>
            <button type="button" class="lnk warn" data-doc-rm title="Убрать документ">×</button>
          </div>`).join("")}</div>`
          : `<p class="mat-form-hint">Документов пока нет. Сюда кладут устав, свидетельства
               и приказы — их видят только те, кому открыто это право.</p>`}
        <label class="btn-ghost sm org-doc-add">${UPL}Загрузить документ
          <input type="file" data-doc-file accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx,.zip" hidden></label>
      </div>`;
  }

  /* Карточка предприятия: человек выбирает формат, счёт и блоки —
     контрагенту часто нужны только реквизиты и банк, без подписанта. */
  function openCard(r) {
    const accounts = r.accounts || [];
    // Что из бланка карточки у компании не заполнено: пустое в карточку
    // не идёт, и без подсказки казалось, что строки потерялись.
    const пусто = GROUPS.flatMap(([, fs]) => fs)
      .filter(([k]) => k !== "short_name" && !String(r[k] || "").trim())
      .map(([k, label]) => (k === "signer_post" || k === "signer_name"
        ? "подпись: " : "") + label.toLowerCase());
    let fmt = "pdf";
    let accId = (mainAcc(r) || {}).id || "";
    const on = new Set(BLOCKS.map(([k]) => k));
    const box = document.createElement("div");
    box.className = "pf-modal";
    box.innerHTML = `
      <div class="pf-crop cnt-card org-card-out" role="dialog" aria-label="Карточка предприятия">
        <h3>Карточка предприятия</h3>
        <p class="mat-usage-sub">${esc(r.full_name || r.name)}</p>
        <div class="org-out-grid">
          <label class="mat-plc-f"><span>Формат</span>
            <select class="role-sel" data-fmt>
              <option value="pdf">PDF — для письма и печати</option>
              <option value="xlsx">Excel — если просят книгой</option>
            </select></label>
          <label class="mat-plc-f"><span>Расчётный счёт</span>
            <select class="role-sel" data-acc>
              ${accounts.length ? accounts.map((a) => `<option value="${esc(a.id)}"${
                a.id === accId ? " selected" : ""}>${esc(a.name || "Счёт")} · ${
                esc(accLine(a) || "без реквизитов")}${a.main ? " — основной" : ""}</option>`).join("")
                : `<option value="">счетов нет</option>`}
            </select>
            <i class="dim">${accounts.length ? "По умолчанию — основной счёт компании"
              : "Заведите счёт в карточке компании, иначе банковский блок будет пустым"}</i></label>
        </div>
        ${пусто.length ? `<p class="org-out-miss">Не заполнено в компании: ${esc(пусто.join(", "))}.
          Этих строк в карточке не будет — впишите их в «Подробно» у компании.</p>` : ""}
        <div class="cnt-group"><h4>Что включить</h4>
          <div class="org-out-blocks">${BLOCKS.map(([k, label]) => `
            <label class="mat-up-sure"><input type="checkbox" data-b="${k}" checked>
              <span>${esc(label)}</span></label>`).join("")}${r.facsimile ? `
            <label class="mat-up-sure"><input type="checkbox" data-fax checked>
              <span>Факсимиле подписи (в PDF)</span></label>` : ""}</div>
        </div>
        <div class="pf-note bad" data-err hidden></div>
        <div class="pf-modal-foot"><span class="grow"></span>
          <button type="button" class="btn ghost" data-no>Отмена</button>
          <button type="button" class="btn" data-ok>Скачать</button></div>
      </div>`;
    document.body.appendChild(box);
    const $c = (s) => box.querySelector(s);
    const close = () => { document.removeEventListener("keydown", key); box.remove(); };
    const key = (e) => { if (e.key === "Escape") close(); };
    document.addEventListener("keydown", key);
    box.addEventListener("click", (e) => { if (e.target === box) close(); });
    $c("[data-no]").addEventListener("click", close);
    $c("[data-fmt]").addEventListener("change", (e) => { fmt = e.target.value; });
    $c("[data-acc]").addEventListener("change", (e) => { accId = e.target.value; });
    box.querySelectorAll("[data-b]").forEach((el) => el.addEventListener("change", () => {
      if (el.checked) on.add(el.dataset.b); else on.delete(el.dataset.b);
      $c("[data-ok]").disabled = on.size === 0;
    }));
    $c("[data-ok]").addEventListener("click", async () => {
      const err = $c("[data-err]");
      err.hidden = true;
      try {
        const fax = $c("[data-fax]");
        const got = await download(r, { format: fmt, account_id: accId, blocks: [...on],
                                        facsimile: !!(fax && fax.checked) },
                                   $c("[data-ok]"));
        if (!got) return;
        close();
        note(`Карточка «${r.name}» выгружена`);
      } catch (e) {
        err.textContent = e.message;
        err.hidden = false;
        $c("[data-ok]").disabled = false;
      }
    });
  }

  /* Скачиваем через fetch, а не ссылкой: ответ приходит с токеном в
     заголовке, и его в адресе не передать. */
  async function download(r, body, btn) {
    return DL.save("/api/orgs/" + encodeURIComponent(r.id) + "/card", {
      btn, body, fallback: `Карточка предприятия — ${r.name}.${body.format}`,
      error: "Не удалось выгрузить карточку" });
  }

  async function openDoc(id, btn) {
    try {
      await DL.open("/api/org-docs/" + encodeURIComponent(id) + "/file",
                    { btn, error: "Не удалось открыть документ" });
    } catch (e) {
      note("Не вышло: " + e.message, true);
    }
  }

  function uploadDoc(orgId, input) {
    const f = input.files && input.files[0];
    input.value = "";
    if (!f) return;
    if (f.size > 32 * 1024 * 1024) return note("Документ больше 32 МБ", true);
    note(`Загружаю «${f.name}»…`);
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/orgs/" + encodeURIComponent(orgId) + "/docs");
    xhr.setRequestHeader("Authorization", "Bearer " + AUTH.token());
    xhr.setRequestHeader("X-File-Name", encodeURIComponent(f.name));
    xhr.setRequestHeader("Content-Type", "application/octet-stream");
    xhr.addEventListener("load", () => {
      let r = {};
      try { r = JSON.parse(xhr.responseText); } catch (e) { /* не json */ }
      if (xhr.status < 200 || xhr.status >= 300) {
        return note(r.error || "Не удалось загрузить документ", true);
      }
      put(r);
      note(`Документ «${f.name}» загружен`);
    });
    xhr.addEventListener("error", () => note("Сеть оборвалась — документ не загружен", true));
    xhr.send(f);
  }

  /* Обработчики полей и кнопок внутри root: всей страницы после
     перерисовки или подробностей одной компании, когда их раскрыли. */
  function wire(host) {
    host.querySelectorAll("[data-mode]").forEach((b) => b.addEventListener("click", () => {
      mode = b.dataset.mode;
      try { localStorage.setItem(MODE_KEY, mode); } catch (e) { /* без памяти */ }
      OPEN.clear();
      SHUT.clear();
      render();
    }));

    if (can() && $o("#orgNew", host)) {
      $o("#orgNew", host).addEventListener("click", async () => {
        try {
          const made = await AUTH.api("POST", "/orgs", { name: "Новая компания" });
          ROWS.push(made);
          OPEN.add(made.id);
          render();
          // Курсор сразу в название: карточку завели, чтобы её назвать.
          const inp = $o(`[data-id="${made.id}"] [data-f="name"]`, host);
          if (inp) { inp.focus(); inp.select(); inp.scrollIntoView({ block: "center" }); }
        } catch (e) {
          note("Не вышло: " + e.message, true);
        }
      });
    }

    host.querySelectorAll("[data-f]").forEach((inp) => {
      const box = inp.closest(".org");
      const save = async () => {
        const v = inp.type === "checkbox" ? (inp.checked ? "1" : "0") : inp.value;
        if (v === inp.dataset.last) return;
        inp.dataset.last = v;
        inp.classList.remove("bad");
        inp.title = "";
        try {
          const upd = await AUTH.api("PATCH", "/orgs/" + box.dataset.id,
                                     { [inp.dataset.f]: v });
          const r = ROWS.find((x) => x.id === upd.id);
          Object.assign(r || {}, upd);
          if (inp.dataset.f === "active") box.classList.toggle("off", !upd.active);
          // Строка сверху показывает название, руководителя, телефон —
          // вписанное сразу видно в ней.
          paintHead(box, r || upd);
        } catch (e) {
          inp.classList.add("bad");
          inp.title = String(e.message);
          note("Не вышло: " + e.message, true);
        }
      };
      inp.addEventListener("change", save);
      inp.addEventListener("keydown", (e) => {
        if (e.key === "Enter") { e.preventDefault(); inp.blur(); }
      });
    });

    // ── счета ───────────────────────────────────────────────
    host.querySelectorAll("[data-acc-add]").forEach((b) => b.addEventListener("click", async () => {
      const id = b.closest("[data-id]").dataset.id;
      try {
        put(await AUTH.api("POST", "/orgs/" + id + "/accounts", {}));
        const inp = $o(`[data-id="${id}"] .org-acc:last-child [data-af="name"]`, host);
        if (inp) { inp.focus(); inp.select(); }
      } catch (e) {
        note("Не вышло: " + e.message, true);
      }
    }));
    host.querySelectorAll("[data-af]").forEach((inp) => {
      const row = inp.closest("[data-acc]");
      const save = async () => {
        if (inp.value === inp.dataset.last) return;
        inp.dataset.last = inp.value;
        inp.classList.remove("bad");
        inp.title = "";
        try {
          const upd = await AUTH.api("PATCH", "/org-accounts/" + row.dataset.acc,
                                     { [inp.dataset.af]: inp.value });
          const i = ROWS.findIndex((x) => x.id === upd.id);
          if (i >= 0) ROWS[i] = upd;
          // Перерисовываем только при смене того, что видно в шапке строки.
          if (inp.dataset.af === "bank" || inp.dataset.af === "account") {
            const acc = (upd.accounts || []).find((a) => a.id === row.dataset.acc);
            if (acc && acc.main) note(`Основной счёт компании «${upd.name}» обновлён`);
          }
        } catch (e) {
          inp.classList.add("bad");
          inp.title = String(e.message);
          note("Не вышло: " + e.message, true);
        }
      };
      inp.addEventListener("change", save);
      inp.addEventListener("keydown", (e) => {
        if (e.key === "Enter") { e.preventDefault(); inp.blur(); }
      });
    });
    host.querySelectorAll("[data-main]").forEach((b) => b.addEventListener("click", async () => {
      try {
        put(await AUTH.api("PATCH", "/org-accounts/" + b.closest("[data-acc]").dataset.acc,
                           { main: 1 }));
      } catch (e) {
        note("Не вышло: " + e.message, true);
      }
    }));
    host.querySelectorAll("[data-acc-rm]").forEach((b) => b.addEventListener("click", async () => {
      const row = b.closest("[data-acc]");
      const r = ROWS.find((x) => x.id === row.closest("[data-id]").dataset.id) || {};
      const a = (r.accounts || []).find((x) => x.id === row.dataset.acc) || {};
      if (!(await ASK.confirm(`Убрать счёт «${a.name || accLine(a) || "без названия"}»?`
                   + (a.main ? " Он основной — основным станет следующий." : "")))) return;
      try {
        put(await AUTH.api("DELETE", "/org-accounts/" + row.dataset.acc));
      } catch (e) {
        note("Не вышло: " + e.message, true);
      }
    }));

    // ── логотип ─────────────────────────────────────────────
    host.querySelectorAll("[data-logo-file]").forEach((inp) => inp.addEventListener("change", () => {
      const f = inp.files && inp.files[0];
      inp.value = "";
      const id = inp.closest("[data-id]").dataset.id;
      if (!f) return;
      if (!/^image\/(png|jpeg)$/.test(f.type)) return note("Логотип — картинкой PNG или JPEG", true);
      if (f.size > 1024 * 1024) return note("Логотип должен быть меньше 1 МБ", true);
      const rd = new FileReader();
      rd.onload = async () => {
        try {
          const got = await AUTH.api("PUT", "/orgs/" + id + "/logo", { data: rd.result });
          Object.assign(ROWS.find((x) => x.id === id) || {}, got);
          render();
          note("Логотип сохранён — он в шапке карточки предприятия");
        } catch (e) {
          note("Не вышло: " + e.message, true);
        }
      };
      rd.readAsDataURL(f);
    }));
    host.querySelectorAll("[data-logo-rm]").forEach((b) => b.addEventListener("click", async () => {
      const id = b.closest("[data-id]").dataset.id;
      if (!(await ASK.confirm("Убрать логотип? Шапка карточки будет без него."))) return;
      try {
        const got = await AUTH.api("DELETE", "/orgs/" + id + "/logo");
        Object.assign(ROWS.find((x) => x.id === id) || {}, got);
        render();
      } catch (e) {
        note("Не вышло: " + e.message, true);
      }
    }));

    // ── факсимиле подписи ───────────────────────────────────
    host.querySelectorAll("[data-fax-img]").forEach((img) => faxSrc(img).catch(() => {}));
    host.querySelectorAll("[data-fax-file]").forEach((inp) => inp.addEventListener("change", async () => {
      const f = inp.files && inp.files[0];
      inp.value = "";
      const id = inp.closest("[data-id]").dataset.id;
      if (!f) return;
      if (f.size > 25 * 1024 * 1024) return note("Фото больше 25 МБ — снимите покрупнее, но легче", true);
      note("Вырезаю фон у подписи…");
      try {
        const data = await faxPhoto(f);
        const got = await AUTH.api("PUT", "/orgs/" + id + "/facsimile", { data });
        Object.assign(ROWS.find((x) => x.id === id) || {}, got);
        render();
        note("Факсимиле сохранено — подпись встанет в карточку предприятия и калькуляцию PDF");
      } catch (e) {
        note("Не вышло: " + e.message, true);
      }
    }));
    host.querySelectorAll("[data-fax-rm]").forEach((b) => b.addEventListener("click", async () => {
      const id = b.closest("[data-id]").dataset.id;
      if (!(await ASK.confirm("Убрать факсимиле подписи? Документы будут с пустой линией подписи."))) return;
      try {
        const got = await AUTH.api("DELETE", "/orgs/" + id + "/facsimile");
        Object.assign(ROWS.find((x) => x.id === id) || {}, got);
        render();
      } catch (e) {
        note("Не вышло: " + e.message, true);
      }
    }));

    // ── учредительные документы ─────────────────────────────
    host.querySelectorAll("[data-doc-file]").forEach((inp) => inp.addEventListener("change", () => {
      uploadDoc(inp.closest("[data-id]").dataset.id, inp);
    }));
    host.querySelectorAll("[data-doc-open]").forEach((b) => b.addEventListener("click", () => {
      openDoc(b.closest("[data-doc]").dataset.doc, b);
    }));
    host.querySelectorAll("[data-doc-edit]").forEach((b) => b.addEventListener("click", async () => {
      const row = b.closest("[data-doc]");
      const r = ROWS.find((x) => x.id === row.closest("[data-id]").dataset.id) || {};
      const d = (r.docs || []).find((x) => x.id === row.dataset.doc) || {};
      const title = await ASK.prompt("Название документа", d.title || d.filename || "",
                                     { keepExt: !d.title });
      if (title === null) return;
      try {
        put(await AUTH.api("PATCH", "/org-docs/" + row.dataset.doc, { title }));
      } catch (e) {
        note("Не вышло: " + e.message, true);
      }
    }));
    host.querySelectorAll("[data-doc-rm]").forEach((b) => b.addEventListener("click", async () => {
      const row = b.closest("[data-doc]");
      const r = ROWS.find((x) => x.id === row.closest("[data-id]").dataset.id) || {};
      const d = (r.docs || []).find((x) => x.id === row.dataset.doc) || {};
      if (!(await ASK.confirm(`Убрать «${d.title || d.filename}»? Файл будет стёрт.`))) return;
      try {
        put(await AUTH.api("DELETE", "/org-docs/" + row.dataset.doc));
        note("Документ убран");
      } catch (e) {
        note("Не вышло: " + e.message, true);
      }
    }));

    host.querySelectorAll("[data-color]").forEach((b) => {
      b.addEventListener("click", async () => {
        const box = b.closest(".org");
        try {
          const upd = await AUTH.api("PATCH", "/orgs/" + box.dataset.id,
                                     { color: b.dataset.color });
          Object.assign(ROWS.find((x) => x.id === upd.id) || {}, upd);
          box.style.setProperty("--org", upd.color);
          box.querySelectorAll("[data-color]").forEach((x) =>
            x.classList.toggle("on", x === b));
        } catch (e) {
          note("Не вышло: " + e.message, true);
        }
      });
    });
  }

  return { load, render };
})();
