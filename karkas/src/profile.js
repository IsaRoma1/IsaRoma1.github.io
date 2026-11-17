/* Личный кабинет
   ────────────────────────────────────────────────────────────────
   До сих пор человек не мог о себе ничего: ни сменить выданный пароль
   (маршрут был закрыт под dev_admin), ни посмотреть, где ещё открыта
   его сессия, ни увидеть собственные показатели — учётка и строка в
   рейтинге не были связаны ничем.

   Четыре вкладки, больше не нужно. Сайдбар настроек из десяти пунктов
   есть у сервисов с миллионами публичных аккаунтов и платными тарифами;
   здесь пять учёток и один сценарий, и пустые экраны читались бы как
   недоделка. Второй вертикальный сайдбар внутри страницы спорил бы с
   уже существующим левым меню.

   Кнопка «Сохранить», а не автосохранение: аудитория — директор и
   начальники участков, и отсутствие кнопки читается как «не применилось».
   Форма пароля — тем более: данные, влияющие на безопасность, положено
   сохранять только явным действием. */
"use strict";

const PROFILE = (() => {
  const $ = (s, r) => (r || document).querySelector(s);
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const TABS = [
    ["profile", "Профиль"],
    ["look", "Оформление"],
    ["security", "Безопасность"],
    ["stats", "Мои показатели"],
  ];

  let ME = null;
  let tab = "profile";
  let draft = {};          // правки, ещё не ушедшие на сервер
  let avatarTag = "";      // версия картинки, чтобы браузер не показывал прежнюю
  let wired = false;

  const dirty = () => Object.keys(draft).length > 0;
  const val = (k) => (k in draft ? draft[k] : ME[k]);

  /* Данные дашборда берём через объявленный app.js мостик, а не лазим
     в его переменные напрямую: так видно, чем именно этот файл зависит
     от соседнего, и порядок подключения скриптов перестаёт быть тайным
     условием работоспособности. */
  const bridge = () => (typeof window.KARKAS === "object" ? window.KARKAS : null);

  /* ── аватар ───────────────────────────────────────────────
     Кадрируем на клиенте и отправляем маленькую картинку. Иначе снимок
     с телефона на 4 МБ уехал бы на сервер целиком, чтобы показаться
     кружком в 32 пикселя. */
  const AV_SIZE = 256;

  function avatarHTML(size) {
    const url = avatarTag ? AUTH.avatarUrl(ME.id, avatarTag) : "";
    const initials = (ME.username || "?").trim()[0].toUpperCase();
    return url
      ? `<img class="pf-av" style="--s:${size}px" src="${esc(url)}" alt="">`
      : `<span class="pf-av pf-av-none" style="--s:${size}px">${esc(initials)}</span>`;
  }

  /* Кадрирование: квадратное окно, картинку можно двигать и приближать.
     Без этого портрет с телефона обрезается по центру и человеку сносит
     полголовы — самая частая претензия к «мы просто сожмём как есть».

     opt — для чужих картинок (фото сотрудника в справочнике, 09.10.2026):
     size — сторона квадрата, done(dataURL) — куда отдать, fail(текст) —
     куда сказать об ошибке. Без opt — свой аватар, как было. */
  function openCrop(file, opt = {}) {
    const fail = opt.fail || ((text) => note(text, true));
    const reader = new FileReader();
    reader.onerror = () => fail("Не удалось прочитать файл");
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => fail("Это не похоже на картинку");
      /* Поворот по EXIF браузер применяет сам с 2020 года. Своя докрутка
         здесь не нужна и вредна: она развернула бы селфи второй раз. */
      img.onload = () => cropUI(img, opt);
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  }

  function cropUI(img, opt) {
    const box = document.createElement("div");
    box.className = "pf-modal";
    box.innerHTML = `
      <div class="pf-crop" role="dialog" aria-label="Кадрирование">
        <h3>Как обрезать</h3>
        <div class="crop-view"><canvas class="crop-cv" width="260" height="260"></canvas>
          <div class="crop-ring"></div></div>
        <label class="crop-zoom">Приблизить
          <input type="range" min="100" max="300" value="100" id="cropZoom"></label>
        <p class="crop-hint">Картинку можно двигать мышью.</p>
        <div class="pf-modal-foot">
          <button type="button" class="btn ghost" id="cropNo">Отмена</button>
          <button type="button" class="btn" id="cropYes">Поставить</button>
        </div>
      </div>`;
    document.body.appendChild(box);

    const cv = $(".crop-cv", box), ctx = cv.getContext("2d");
    const V = cv.width;
    // Базовый масштаб: короткая сторона ровно закрывает окно.
    const base = Math.max(V / img.width, V / img.height);
    let zoom = 1, ox = 0, oy = 0;      // сдвиг в пикселях окна

    function clamp() {
      const w = img.width * base * zoom, h = img.height * base * zoom;
      const mx = Math.max(0, (w - V) / 2), my = Math.max(0, (h - V) / 2);
      ox = Math.min(mx, Math.max(-mx, ox));
      oy = Math.min(my, Math.max(-my, oy));
    }

    function draw() {
      clamp();
      const w = img.width * base * zoom, h = img.height * base * zoom;
      ctx.clearRect(0, 0, V, V);
      ctx.drawImage(img, (V - w) / 2 + ox, (V - h) / 2 + oy, w, h);
    }

    $("#cropZoom", box).addEventListener("input", (e) => {
      zoom = +e.target.value / 100;
      draw();
    });

    let drag = null;
    cv.addEventListener("pointerdown", (e) => {
      drag = { x: e.clientX - ox, y: e.clientY - oy };
      cv.setPointerCapture(e.pointerId);
    });
    cv.addEventListener("pointermove", (e) => {
      if (!drag) return;
      ox = e.clientX - drag.x; oy = e.clientY - drag.y;
      draw();
    });
    cv.addEventListener("pointerup", () => { drag = null; });
    // Без этого выход курсора за окно или системный жест оставляли
    // перетаскивание включённым: картинка ездила за мышью без нажатия.
    cv.addEventListener("pointercancel", () => { drag = null; });

    /* Слушатель Escape снимается ВСЕГДА, а не только когда закрыли им
       же. Иначе каждое открытие кадрирования оставляло в document
       живой обработчик, держащий ссылку на полноразмерный снимок, —
       десять правок аватара удерживали бы в памяти десять фотографий. */
    const onKey = (e) => { if (e.key === "Escape") close(); };
    const close = () => {
      document.removeEventListener("keydown", onKey);
      box.remove();
    };
    document.addEventListener("keydown", onKey);
    $("#cropNo", box).addEventListener("click", close);
    box.addEventListener("click", (e) => { if (e.target === box) close(); });

    $("#cropYes", box).addEventListener("click", async () => {
      // Пересобираем в целевом размере, а не растягиваем превью:
      // 260 на экране и 256 в файле — разные вещи.
      const size = opt.size || AV_SIZE;
      const out = document.createElement("canvas");
      out.width = out.height = size;
      const k = size / V;
      const octx = out.getContext("2d");
      const w = img.width * base * zoom * k, h = img.height * base * zoom * k;
      octx.drawImage(img, (size - w) / 2 + ox * k, (size - h) / 2 + oy * k, w, h);

      // webp вдвое легче jpeg при том же виде; где его нет — png. Фото в
      // справочник крупнее аватара, и png вышел бы за предел сервера — ему jpeg.
      let data = out.toDataURL("image/webp", 0.85);
      if (!data.startsWith("data:image/webp")) {
        data = opt.done ? out.toDataURL("image/jpeg", 0.9) : out.toDataURL("image/png");
      }

      close();
      if (opt.done) return opt.done(data);
      try {
        const r = await AUTH.putAvatar(data);
        avatarTag = r.etag;
        render();
        note("Фотография обновлена");
        refreshSidebarAvatar();
      } catch (e) { note(e.message, true); }
    });

    draw();
  }

  /* Кружок в боковой панели должен смениться сразу: человек только что
     поставил фотографию и первым делом посмотрит именно туда. */
  function refreshSidebarAvatar() {
    const av = $("#whoAv");
    if (!av) return;
    const url = avatarTag ? AUTH.avatarUrl(ME.id, avatarTag) : "";
    av.innerHTML = url ? `<img src="${esc(url)}" alt="">` : "";
    av.classList.toggle("has-img", !!url);
    if (!url) av.textContent = (ME.username || "?")[0].toUpperCase();
  }

  /* ── сообщения ────────────────────────────────────────────
     Строкой внутри раздела, а не всплывашкой в углу: дашборд показывают
     с проектора, угол экрана вне поля зрения зала, а трёхсекундный тост
     никто не успевает прочитать. */
  /* Порядок вызова важен: note() пишет в узел, который render()
     пересобирает. Сначала перерисовка, потом сообщение — иначе оно
     исчезает в тот же миг, и человек не видит, что сохранение прошло. */
  let noteTimer = null;
  function note(text, bad) {
    const el = $("#pfNote");
    if (!el) return;
    el.textContent = text;
    el.className = "pf-note" + (bad ? " bad" : " ok");
    el.hidden = false;
    clearTimeout(noteTimer);
    noteTimer = setTimeout(() => { el.hidden = true; }, bad ? 9000 : 4000);
  }

  /* ── вкладка «Профиль» ────────────────────────────────────── */
  function tabProfile() {
    const people = (bridge() && bridge().people()) || [];
    const mine = val("person_key") || "";

    const opts = people.map((p) => {
      const name = p.fio || p.sheet_name || p.person_key;
      return `<option value="${esc(p.person_key)}"${
        p.person_key === mine ? " selected" : ""}>${esc(name)}${
        p.pos ? " · " + esc(p.pos) : ""}</option>`;
    }).join("");

    return `
      <div class="pf-card">
        <div class="pf-avrow">
          ${avatarHTML(88)}
          <div class="pf-avside">
            <div class="pf-avttl">Фотография</div>
            <p>Фотографию добавляет ответственный за справочник «Сотрудники».
               Она показывается здесь и в боковой панели.</p>
          </div>
        </div>
      </div>

      <div class="pf-card">
        <div class="pf-grid">
          <label class="fld"><span>Имя</span>
            <input type="text" id="f-username" maxlength="80"
                   value="${esc(val("username"))}"></label>
          <label class="fld"><span>Должность</span>
            <input type="text" id="f-job_title" maxlength="80" placeholder="не указана"
                   value="${esc(val("job_title"))}"></label>
          <label class="fld"><span>Телефон</span>
            <input type="text" id="f-phone" maxlength="40" placeholder="не указан"
                   value="${esc(val("phone"))}"></label>
          <label class="fld"><span>Почта</span>
            <input type="text" value="${esc(ME.email)}" readonly
                   title="Почта — это логин, менять её нельзя"></label>
        </div>
      </div>

      `;
  }

  /* ── вкладка «Оформление» ─────────────────────────────────── */
  function tabLook() {
    const th = val("theme") || "";
    const st = val("start_section") || "";
    const pick = (name, v, label, hint) => `
      <label class="pf-pick${val(name) === v ? " on" : ""}">
        <input type="radio" name="${name}" value="${v}"${
          val(name) === v ? " checked" : ""}>
        <b>${label}</b>${hint ? `<i>${hint}</i>` : ""}</label>`;

    const secs = (bridge() && bridge().sections()) || {};
    const allowed = Object.keys(secs).filter((k) =>
      !document.querySelector(`#nav a[data-s="${k}"]`) ||
      !document.querySelector(`#nav a[data-s="${k}"]`).hidden);

    return `
      <div class="pf-card">
        <div class="pf-ttl">Тема</div>
        <div class="pf-picks" id="pf-theme">
          ${pick("theme", "", "Как в браузере", "следовать настройке системы")}
          ${pick("theme", "light", "Светлая", "")}
          ${pick("theme", "dark", "Тёмная", "")}
        </div>
        <i class="fld-hint">Выбор сохраняется за учёткой, а не за
          браузером: на другом компьютере тема будет та же.</i>
      </div>

      <div class="pf-card">
        <div class="fld"><span>Открывать при входе</span>
          <select id="f-start_section">${
            /* Пустого пункта нет: он означал бы «Сотрудники», которые
               и так стоят в списке, — два разных пункта с одинаковым
               смыслом. Незаполненное значение просто показываем как
               выбранных «Сотрудников». */
            allowed.map((k) =>
              `<option value="${k}"${(st || "emp") === k ? " selected" : ""}>${
                esc(secs[k].t)}</option>`).join("")}
          </select>
          <i class="fld-hint">Раздел, который откроется сразу после входа.</i>
        </div>
      </div>`;
  }

  /* ── вкладка «Безопасность» ───────────────────────────────── */
  function tabSecurity() {
    const changed = ME.pass_changed_at
      ? new Date(ME.pass_changed_at).toLocaleDateString("ru")
      : "неизвестно когда";
    return `
      ${ME.must_change_pw ? `<div class="pf-warn">
        Этот пароль вам выдал администратор — значит, он его знает.
        Смените его, пока остальные разделы закрыты.</div>` : ""}

      <div class="pf-card">
        <div class="pf-ttl">Пароль</div>
        <!-- Подпись через for, а не обёрткой: глазок, который приставит
             pweye.js, встаёт рядом с полем, а кнопка внутри label —
             некорректная вложенность, и клик по ней засчитывался бы
             ещё и как клик по подписи. -->
        <div class="pf-grid pf-grid-1">
          <div class="fld"><label for="pw-cur">Текущий</label>
            <input type="password" id="pw-cur" autocomplete="current-password"></div>
          <div class="fld"><label for="pw-new">Новый</label>
            <input type="password" id="pw-new" autocomplete="new-password">
            <i class="fld-hint">От 10 знаков. Длина важнее заглавных и
              спецсимволов: <b>адрес дома 17 весной</b> надёжнее, чем
              <b>Karkas2026!</b>, и запоминается без стикера.</i></div>
          <div class="fld"><label for="pw-new2">Ещё раз</label>
            <input type="password" id="pw-new2" autocomplete="new-password"></div>
        </div>
        <div class="pf-actions">
          <button type="button" class="btn" id="pwGo">Сменить пароль</button>
          <span class="pf-dim num">изменён ${esc(changed)}</span>
        </div>
      </div>

      <div class="pf-card">
        <div class="pf-ttl">Где вы вошли</div>
        <div id="pfSes" class="pf-ses"><span class="pf-dim">загрузка…</span></div>
      </div>`;
  }

  async function fillSessions() {
    const box = $("#pfSes");
    if (!box) return;
    let list;
    try { list = await AUTH.sessions(); }
    catch (e) { box.innerHTML = `<span class="pf-dim">${esc(e.message)}</span>`; return; }

    const when = (s) => s ? new Date(s).toLocaleString("ru",
      { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "—";

    box.innerHTML = list.map((s) => `
      <div class="ses${s.current ? " now" : ""}">
        <span class="ses-w">
          <b>${esc(s.label)}</b>
          <i class="num">${esc(s.ip || "адрес неизвестен")} · вход ${
            esc(when(s.created_at))} · активность ${esc(when(s.last_seen))}</i>
        </span>
        ${s.current
          ? `<span class="ses-now">этот</span>`
          : `<button type="button" class="btn sm ghost" data-ses="${esc(s.sid)}">Завершить</button>`}
      </div>`).join("")
      + (list.length > 1 ? `<div class="pf-actions">
          <button type="button" class="btn sm ghost" id="sesAll">Выйти на всех
            остальных устройствах</button></div>` : "");

    box.querySelectorAll("[data-ses]").forEach((b) => {
      b.addEventListener("click", async () => {
        b.disabled = true;
        try { await AUTH.closeSession(b.dataset.ses); note("Сеанс завершён"); fillSessions(); }
        catch (e) { b.disabled = false; note(e.message, true); }
      });
    });
    const all = $("#sesAll");
    if (all) all.addEventListener("click", askCloseAll);
  }

  /* Пароль обязателен: если вкладку увели, это последняя кнопка, которой
     хозяин выбивает чужого, — и она не должна работать у того, кто
     пароля не знает. */
  function askCloseAll() {
    const box = document.createElement("div");
    box.className = "pf-modal";
    box.innerHTML = `
      <div class="pf-crop pf-ask" role="dialog" aria-label="Выйти везде">
        <h3>Выйти на всех остальных устройствах</h3>
        <p>Все сеансы, кроме текущего, закроются. Подтвердите паролем —
           так кнопка не сработает у того, кто занял чужую вкладку.</p>
        <div class="fld"><label for="allPw">Пароль</label>
          <input type="password" id="allPw" autocomplete="current-password"></div>
        <div class="pf-note bad" id="allErr" hidden></div>
        <div class="pf-modal-foot">
          <button type="button" class="btn ghost" id="allNo">Отмена</button>
          <button type="button" class="btn" id="allYes">Выйти везде</button>
        </div>
      </div>`;
    document.body.appendChild(box);
    PwEye.scan(box);
    const onKey = (e) => { if (e.key === "Escape") close(); };
    const close = () => {
      document.removeEventListener("keydown", onKey);
      box.remove();
    };
    document.addEventListener("keydown", onKey);
    $("#allNo", box).addEventListener("click", close);
    box.addEventListener("click", (e) => { if (e.target === box) close(); });
    $("#allPw", box).focus();
    $("#allYes", box).addEventListener("click", async () => {
      try {
        const r = await AUTH.closeOtherSessions($("#allPw", box).value);
        close();
        note(`Закрыто сеансов: ${r.closed}`);
        fillSessions();
      } catch (e) {
        /* Внутри окна, а не через note(): та строка живёт в разделе
           позади затемнения, и человек, набравший неверный пароль,
           не видел ответа вовсе. */
        const err = $("#allErr", box);
        err.textContent = e.message;
        err.hidden = false;
      }
    });
  }

  async function changePassword() {
    const cur = $("#pw-cur").value, a = $("#pw-new").value, b = $("#pw-new2").value;
    if (a !== b) return note("Новый пароль и повтор не совпадают", true);
    const btn = $("#pwGo");
    btn.disabled = true;
    try {
      await AUTH.changePassword(cur, a);
      await AUTH.refreshMe();
      ME = AUTH.current();
      render();
      /* Смена выданного пароля снимает замок с разделов — но меню об
         этом само не узнает: доступы считаются один раз при загрузке.
         Человек менял пароль и оставался с одним «Моим профилем», пока
         не перезагрузит страницу, а догадаться было неоткуда. */
      const b = bridge();
      if (b && b.refreshAccess) b.refreshAccess(ME);
      note("Пароль сменён. Остальные сеансы закрыты.");
    } catch (e) {
      note(e.message, true);
      btn.disabled = false;
    }
  }

  /* ── вкладка «Мои показатели» ─────────────────────────────── */
  /* Кого показывать. Сперва выбранный вручную, иначе — определённый по
     имени. Выбор руками остаётся как запасной путь, но с глаз убран:
     человек не должен искать себя в списке из восьмидесяти фамилий,
     чтобы увидеть свои же цифры. */
  function myKey() {
    const b = bridge();
    return val("person_key") || (b ? b.guessPerson(ME.username) : null);
  }

  function tabStats() {
    const b = bridge();
    if (!b || !b.ready()) {
      return `<div class="pf-card pf-empty"><b>Данные дашборда ещё не загружены</b></div>`;
    }
    const key = myKey();
    if (!key) {
      /* Выбор себя стоит в этой же карточке: текст на него и ссылается,
         а разделительная линия посреди разрезала одну мысль надвое —
         объяснение оставалось наверху, действие уезжало в отдельный
         блок, будто к делу не относится. */
      return `<div class="pf-card pf-empty">
        <b>Не нашли вас в отчётах</b>
        <p>Показатели считаются по загруженным таблицам задач и таблице цикла
           производства. Имени <b>${esc(ME.username)}</b> там нет —
           скорее всего, записано иначе.</p>
        <p>Так бывает: учётная запись и человек в отчётах заводятся
           порознь. Выберите себя в списке — связь запомнится, и
           показатели появятся.</p>
        ${personPicker("", true)}
      </div>`;
    }
    const s = b.statsFor(key);
    if (!s || !s.total.n) {
      /* Кого именно определили — обязательная часть сообщения: если
         это не то лицо, человек поймёт только по имени.

         Имя даём именительным падежом, отдельным предложением. Прежнее
         «У ${s.name} нет дел» требовало родительного, а подставлялось
         как есть — выходило «У Иван Петров нет дел». Склонять фамилии
         кодом нельзя, значит фраза не должна этого просить. */
      const who = (s && s.name) || "";
      return `<div class="pf-card pf-empty">
        <b>Нет дел с наступившим сроком за выбранный период</b>
        <p>${who ? `В отчётах вы — <b>${esc(who)}</b>.${
          val("person_key") ? "" : " Имя определено автоматически."} ` : ""
        }Период переключается в разделе «Эффективность».</p>
      </div>
      ${personPicker(key)}`;
    }

    const row = (label, m, src) => !m.n ? "" : `
      <div class="pf-num">
        <span class="pf-num-l">${label}<i>${src}</i></span>
        <b class="num">${m.pct}%</b>
        <span class="pf-num-c num">${m.ok} из ${m.n}</span>
      </div>`;

    const aw = (window.Awards && window.Awards.forPerson(key)) || [];

    return `
      <div class="pf-card">
        <div class="pf-ttl">${esc(s.name)} · ${esc(s.period)}</div>
        ${row("Общая успеваемость", s.total, "оба источника")}
        ${row("Ежемесячный цикл производства", s.reg, "Google-таблица")}
        ${row("Выполнение задач", s.tsk, "таблицы задач")}
        ${s.rank ? `<div class="pf-rank">Место в группе
          «${esc(s.group)}» — <b class="num">${s.rank}</b> из
          <b class="num">${s.of}</b></div>` : ""}
        ${val("person_key") ? "" : `<div class="pf-auto">Определено по имени
          автоматически. Это не вы? Выберите себя ниже.</div>`}
      </div>

      ${aw.length ? `<div class="pf-card">
        <div class="pf-ttl">Награды за период</div>
        <ul class="awc-list">${aw.map((a) => `<li>
          <i class="aw ${a.cls}">${a.icon}</i>
          <span><b>${esc(a.title)}</b>${esc(a.text)}</span></li>`).join("")}</ul>
      </div>` : ""}

      ${personPicker(key)}

      ${s.late.length ? `<div class="pf-card">
        <div class="pf-ttl">Не сдано в срок — <span class="num">${s.late.length}</span>${
          s.late.length > 40 ? `, показаны первые <span class="num">40</span>` : ""}</div>
        <div class="pf-late">${s.late.slice(0, 40).map((o) => `
          <div class="lt"><b>${esc(o.title)}</b>
            <i>${esc(o.object || "задача")} · срок ${esc(o.due || "").slice(0, 10)}</i>
          </div>`).join("")}</div>
      </div>` : ""}`;
  }

  /* Запасной выбор себя вручную. Нужен там, где автоматика молчит:
     имя в источниках записано иначе, или человека там правда нет.

     inline — встроить в чужую карточку. Тогда своей обёртки не будет,
     и подсказка не печатается: рядом уже стоит текст, который то же
     самое и объясняет, а два объяснения подряд читаются как ошибка. */
  function personPicker(cur, inline) {
    const people = (bridge() && bridge().people()) || [];
    const opts = people.map((p) => {
      const name = p.fio || p.sheet_name || p.person_key;
      return `<option value="${esc(p.person_key)}"${
        p.person_key === cur ? " selected" : ""}>${esc(name)}${
        p.pos ? " · " + esc(p.pos) : ""}</option>`;
    }).join("");
    const fld = `<div class="fld"><span>Кто вы в отчётах</span>
        <select id="f-person_key">
          <option value="">— определять по имени —</option>${opts}
        </select>${inline ? "" : `
        <i class="fld-hint">Обычно определяется само. Указывать вручную
          нужно, только если имя в штате или в таблице записано не так,
          как в вашей учётной записи.</i>`}
      </div>`;
    return inline ? fld : `<div class="pf-card">${fld}</div>`;
  }

  /* ── отрисовка ────────────────────────────────────────────── */
  function render() {
    const host = $("#sec-me");
    if (!host || !ME) return;

    const body = { profile: tabProfile, look: tabLook,
                   security: tabSecurity, stats: tabStats }[tab]();

    host.innerHTML = `
      <div class="pf">
        <div class="pf-tabs" role="tablist">
          ${TABS.map(([k, t]) => `<button type="button" role="tab"
            class="pf-tab${k === tab ? " on" : ""}" data-tab="${k}"
            aria-selected="${k === tab}">${t}</button>`).join("")}
        </div>
        <div class="pf-note" id="pfNote" hidden></div>
        <div class="pf-body">${body}</div>
        <div class="pf-save" id="pfSave"${dirty() ? "" : " hidden"}>
          <span>Есть несохранённые изменения</span>
          <button type="button" class="btn ghost sm" id="pfReset">Отменить</button>
          <button type="button" class="btn sm" id="pfSaveGo">Сохранить</button>
        </div>
      </div>`;

    /* Перерисовка переписывает innerHTML целиком: прежние обёртки с
       глазком исчезают вместе с полями, поэтому приставляем заново. */
    PwEye.scan(host);

    host.querySelectorAll("[data-tab]").forEach((b) => {
      b.addEventListener("click", async () => {
        if (dirty() && !(await ASK.confirm("Уйти со вкладки? Несохранённые изменения пропадут.",
                                           { ok: "Уйти", cancel: "Остаться", danger: true }))) return;
        dropDraft();
        tab = b.dataset.tab;
        render();
      });
    });

    wireFields();
    if (tab === "security") { fillSessions(); $("#pwGo").addEventListener("click", changePassword); }
  }

  function wireFields() {
    // Текстовые поля и списки: правка кладётся в черновик, а на сервер
    // уходит по кнопке.
    /* И input, и change — оба обязательны.

       Платформа подменяет каждый select своим выпадающим списком
       (dressSelect в app.js): настоящий select остаётся в разметке и
       хранит значение, но выставляется он программно и сопровождается
       событием change, а не input. Поля «Я в рейтинге» и «Открывать при
       входе» из-за этого не сохранялись вообще — правка не попадала в
       черновик, кнопка не появлялась, человек уходил уверенным, что
       выбрал себя. */
    ["username", "job_title", "phone", "person_key", "start_section"].forEach((k) => {
      const el = $("#f-" + k);
      if (!el) return;
      const onEdit = () => {
        const v = el.value;
        if (v === (ME[k] == null ? "" : ME[k])) delete draft[k]; else draft[k] = v;
        syncSaveBar();
      };
      el.addEventListener("input", onEdit);
      el.addEventListener("change", onEdit);
    });

    const th = $("#pf-theme");
    if (th) {
      th.addEventListener("change", (e) => {
        if (e.target.name !== "theme") return;
        const v = e.target.value;
        if (v === (ME.theme || "")) delete draft.theme; else draft.theme = v;
        // Тему показываем сразу: настройка внешнего вида, которую надо
        // сохранять, чтобы увидеть, бесполезна.
        if (typeof window.applyTheme === "function") {
          window.applyTheme(v || (matchMedia("(prefers-color-scheme: dark)").matches
            ? "dark" : "light"));
        }
        th.querySelectorAll(".pf-pick").forEach((p) =>
          p.classList.toggle("on", p.querySelector("input").checked));
        syncSaveBar();
      });
    }

    const pick = $("#pfPick"), file = $("#pfFile"), drop = $("#pfDrop");
    if (pick) pick.addEventListener("click", () => file.click());
    if (file) file.addEventListener("change", () => {
      if (file.files && file.files[0]) openCrop(file.files[0]);
      file.value = "";
    });
    if (drop) drop.addEventListener("click", async () => {
      try {
        await AUTH.dropAvatar();
        avatarTag = "";
        render();
        note("Фотография убрана");
        refreshSidebarAvatar();
      } catch (e) { note(e.message, true); }
    });

    const save = $("#pfSaveGo"), reset = $("#pfReset");
    if (save) save.addEventListener("click", commit);
    if (reset) reset.addEventListener("click", () => { dropDraft(); render(); });
  }

  /* Отказ от правок — в одном месте. Тема применяется сразу при выборе,
     поэтому её обязательно вернуть; раньше уход на другую вкладку
     сбрасывал черновик, но оставлял чужую тему на экране. */
  function dropDraft() {
    const hadTheme = "theme" in draft;
    draft = {};
    if (hadTheme && typeof window.applyTheme === "function") {
      window.applyTheme(ME.theme || (matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark" : "light"));
    }
  }

  function syncSaveBar() {
    const bar = $("#pfSave");
    if (bar) bar.hidden = !dirty();
  }

  async function commit() {
    const btn = $("#pfSaveGo");
    btn.disabled = true;
    // Запоминаем, что именно уходит: пока идёт запрос, человек может
    // продолжать печатать, и `draft = {}` стёр бы набранное за это время.
    const sent = Object.assign({}, draft);
    try {
      ME = await AUTH.updateMe(sent);
      for (const k of Object.keys(sent)) {
        if (draft[k] === sent[k]) delete draft[k];
      }
      render();
      note("Сохранено");
      // Имя и должность видны в боковой панели — обновляем сразу.
      const n = $("#whoName");
      if (n) n.textContent = ME.username;
    } catch (e) {
      note(e.message, true);
      btn.disabled = false;
    }
  }

  return {
    /* Вызывается из app.js после входа. Аватар узнаём отдельным
       запросом-пробником: держать его версию в /api/me значило бы
       трогать ответ, который дёргается на каждой загрузке страницы. */
    async init(user) {
      ME = user;
      if (!wired) {
        wired = true;
        /* Предупреждение при уходе со страницы с несохранённым.

           Кроме случаев, когда уходим не по своей воле: выход из
           системы и принудительный редирект по истёкшей сессии. Там
           диалог «остаться на странице?» позволял бы отменить выход и
           остаться в интерфейсе, которого сервер уже не обслуживает. */
        addEventListener("beforeunload", (e) => {
          if (dirty() && !window.__adsLeaving) { e.preventDefault(); e.returnValue = ""; }
        });
      }
      /* Версию картинки берём из /api/me, а не пробным запросом к самому
         аватару: тот отдаётся с Cache-Control на сутки, и браузер
         возвращал бы старый ETag из кэша — убранная фотография
         «воскресала» и висела сутки. */
      avatarTag = ME.avatar || "";
      refreshSidebarAvatar();
      if (ME.must_change_pw) tab = "security";
      render();
    },

    /* app.js зовёт при открытии раздела: данные дашборда могли доехать
       позже, чем нарисовался профиль. Заодно перечитываем пользователя
       из AUTH — его мог обновить кто-то помимо этого файла, и рисовать
       по своей залежавшейся копии значило бы показывать прошлое. */
    refresh() {
      if (!ME) return;
      ME = AUTH.current() || ME;
      render();
    },

    openTab(k) { tab = k; render(); },

    /* Окно кадрирования для чужих картинок — см. openCrop. */
    crop(file, opt) { openCrop(file, opt || {}); },
  };
})();
