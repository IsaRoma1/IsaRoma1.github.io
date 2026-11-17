/* Вход и роли — поверх настоящего API (deploy/api.py).

   Пароли лежат в базе как pbkdf2, сессия — токен со сроком жизни.
   Раньше здесь была заглушка на localStorage; от неё остался контракт:
   роли dev_admin | admin | user, dev_admin проходит проверки сам собой.

   Данные держим в памяти и отвечаем из кэша, потому что вёрстка рисуется
   синхронно. Наполняет кэш boot() — один запрос при старте страницы;
   изменения (роль, блокировка, пароль) уходят на сервер и обновляют кэш.

   Токен живёт в localStorage: сессию переживает перезагрузку вкладки, а
   на чужом компьютере закрывается кнопкой «Выйти». */
"use strict";

const AUTH = (() => {
  const TOKEN_KEY = "karkas-token";
  /* Снимок последней известной учётки. Нужен ровно для одного: нарисовать
     боковую панель СРАЗУ, не дожидаясь ответа сервера.

     Раньше имя внизу и пункт «Пользователи» появлялись только после
     GET /me — то есть после сетевого запроса, и панель на глазах
     достраивалась кусками, пока разделы «Сотрудники» и «Витрина»,
     лежащие прямо в разметке, стояли на месте с первого кадра.

     Это только внешний вид. Права по-прежнему решает сервер: любой
     запрос без прав получит 403, а сама панель поправится через
     несколько миллисекунд, когда придёт настоящий ответ. */
  const ME_KEY = "karkas-me";

  let ME = null;        // текущий пользователь
  let USERS = [];       // список для раздела «Пользователи» (только dev_admin)
  let PERMS = null;     // словарь прав с сервера: ключ → подпись

  const token = () => {
    try { return localStorage.getItem(TOKEN_KEY) || ""; }
    catch (e) { return ""; }
  };
  const setToken = (t) => {
    try { t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY); }
    catch (e) { /* приватный режим — живём одной вкладкой */ }
  };

  /* Снимок прошлого захода — всё, что нужно, чтобы нарисовать панель до
     ответа сервера. Токена и почты здесь нет: они для этого не нужны.

     А права есть, и это сознательно. Без них панель не знает, какие
     разделы показывать, и рисует пустое меню, а через полсекунды
     достраивает его на глазах — то самое «разделы появляются после
     загрузки». Секрета в них нет: это собственные права вошедшего, он и
     так видит их в своём профиле, а доступ всё равно решает сервер —
     подделанный снимок откроет пункт меню и ровно ничего больше.

     Снимок может устареть, если права сменили в чужой вкладке. Тогда
     пришедший следом настоящий ответ поправит меню — один раз и в
     редком случае, вместо того чтобы дёргаться на каждой загрузке. */
  const remember = (u) => {
    try {
      if (!u) localStorage.removeItem(ME_KEY);
      else localStorage.setItem(ME_KEY, JSON.stringify({
        id: u.id, username: u.username, role: u.role, avatar: u.avatar || "",
        permissions: u.permissions || [],
        must_change_pw: u.must_change_pw ? 1 : 0,
      }));
    } catch (e) { /* приватный режим */ }
  };
  const recall = () => {
    try {
      const raw = localStorage.getItem(ME_KEY);
      const u = raw ? JSON.parse(raw) : null;
      return u && u.username && u.role ? u : null;
    } catch (e) { return null; }
  };

  /* Один разговор с сервером. Ошибку отдаём текстом с сервера: он пишет
     по-русски и по делу («Email уже занят»), придумывать свой незачем. */
  /* Последние неудачные запросы — к правке с кнопки «Сообщить об
     ошибке» (21.10.2026): «ответ 500 на /sites/…» разработчику
     говорит больше, чем «не открывается». */
  const FAILS = [];
  function failed(method, path, status, msg) {
    FAILS.push(`${new Date().toLocaleTimeString("ru-RU")} ${method} ${String(path).slice(0, 160)} → ${status}${msg ? ": " + String(msg).slice(0, 160) : ""}`);
    if (FAILS.length > 10) FAILS.shift();
  }

  async function api(method, path, body) {
    let r;
    try {
      r = await fetch("/api" + path, {
        method,
        headers: Object.assign(
          { "Accept": "application/json" },
          body ? { "Content-Type": "application/json" } : {},
          token() ? { "Authorization": "Bearer " + token() } : {}),
        body: body ? JSON.stringify(body) : undefined,
        cache: "no-store",
      });
    } catch (e) {
      failed(method, path, 0, "нет связи");
      throw new Error("Нет связи с сервером");
    }

    let data = null;
    try { data = await r.json(); } catch (e) { /* пустой ответ — бывает */ }

    if (r.status === 401) {
      // Сессия кончилась или её отозвали. Гасим локально, чтобы страница
      // не осталась с именем человека, которого сервер уже не знает.
      setToken("");
      ME = null;
      /* И уводим на вход. Раньше здесь всё заканчивалось исключением:
         каждый вызывающий ловил его по-своему, а страница продолжала
         показывать данные компании человеку, которого сервер уже не
         пускает. Заблокированный с открытой вкладкой этим и пользовался.

         Кроме самой формы входа: там 401 означает «пароль не тот», и
         перезагрузка стёрла бы человеку введённое. */
      if (path !== "/login" && !location.pathname.endsWith("login.html")) {
        // Уходим не по своей воле — пусть личный кабинет не спрашивает
        // «остаться на странице?»: остаться уже нельзя.
        window.__adsLeaving = true;
        const back = encodeURIComponent(location.pathname + location.search);
        location.replace("login.html?back=" + back);
      }
      throw new Error((data && data.error) || "Нужен вход");
    }
    if (!r.ok) {
      failed(method, path, r.status, data && data.error);
      throw new Error((data && data.error) || `Ошибка ${r.status}`);
    }
    return data;
  }

  return {
    ROLES: { dev_admin: "Dev Admin", admin: "Admin", user: "User" },

    /* Один разговор с сервером на всю платформу: журнал и добавления
       ходят этой же дорогой. Так обработка «сессия кончилась» живёт в
       одном месте, а не тремя копиями в трёх файлах. */
    api,
    fails: () => FAILS.slice(),

    /* Вызывается один раз при старте страницы, до отрисовки. Проверяет
       токен на сервере: сессия — не истина, блокировка должна срабатывать
       сразу, а не когда истечёт срок. */
    async boot() {
      if (!token()) { ME = null; remember(null); return null; }
      try {
        ME = await api("GET", "/me");
        remember(ME);
      } catch (e) {
        ME = null;                      // 401 уже стёр токен, сеть — молчим
      }
      if (ME && ME.role === "dev_admin") {
        try { USERS = await api("GET", "/users"); } catch (e) { USERS = []; }
      }
      return ME;
    },

    async login(email, password) {
      const r = await api("POST", "/login", { email, password });
      setToken(r.token);
      ME = r.user;
      remember(ME);
      return ME;
    },

    current() { return ME; },

    /* Последняя известная учётка из прошлого захода. Только для
       первичной отрисовки панели — истина всегда за current(). */
    cached() { return recall(); },

    /* Страж страницы: не вошёл — на форму входа. Вызывать после boot(). */
    require() {
      if (!ME) location.replace("login.html");
      return ME;
    },

    async logout() {
      window.__adsLeaving = true;
      try { await api("POST", "/logout"); }
      catch (e) { /* сервер недоступен — всё равно выходим локально */ }
      setToken("");
      ME = null;
      remember(null);
      location.replace("login.html");
    },

    /* Право — это раздел. Dev Admin проходит все разделы, админ и
       пользователь — отмеченные (админ без списка, заведённый до
       02.10.2026, — все). Проверку дублирует сервер: здесь она только для
       того, чтобы не показывать разделы и кнопки, куда всё равно не пустят. */
    can(u, perm) {
      if (!u) return false;
      const have = u.permissions || [];
      return u.role === "dev_admin" || (u.role === "admin" && !have.length)
        || have.includes(perm);
    },
    isAdmin(u) { return u.role === "dev_admin" || u.role === "admin"; },

    users() { return USERS; },

    async reloadUsers() {
      USERS = await api("GET", "/users");
      return USERS;
    },

    async setRole(id, role) {
      const u = await api("PATCH", "/users/" + id, { role });
      if (ME && ME.id === id) ME = u;
      await this.reloadUsers();
    },

    async setBlocked(id, blocked) {
      await api("PATCH", "/users/" + id, { is_blocked: !!blocked });
      await this.reloadUsers();
    },

    async setPassword(id, password) {
      await api("PATCH", "/users/" + id, { password });
      await this.reloadUsers();
    },

    async createUser({ username, email, password, role, permissions, sites_all, site_ids }) {
      await api("POST", "/users", { username, email, password, role, permissions, sites_all, site_ids });
      await this.reloadUsers();
    },

    async setPermissions(id, permissions) {
      await api("PATCH", "/users/" + id, { permissions });
      await this.reloadUsers();
    },

    /* Словарь прав приходит с сервера — свой список в JS неизбежно
       разъехался бы с тем, что сервер согласен принять. */
    async loadPerms() {
      if (!PERMS) PERMS = await api("GET", "/perms");
      return PERMS;
    },
    perms() { return PERMS; },

    /* ── личный кабинет ─────────────────────────────────────
       Всё про себя человек правит здесь, а не через /users: там нужен
       dev_admin, и до сих пор из-за этого сотрудник не мог сменить даже
       собственный пароль. */

    async updateMe(patch) {
      ME = await api("PATCH", "/me", patch);
      remember(ME);
      return ME;
    },

    async refreshMe() {
      ME = await api("GET", "/me");
      remember(ME);
      return ME;
    },

    changePassword(current, next) {
      return api("POST", "/me/password", { current, next });
    },

    sessions() { return api("GET", "/me/sessions"); },
    closeSession(sid) { return api("DELETE", "/me/sessions/" + sid); },
    closeOtherSessions(password) {
      return api("DELETE", "/me/sessions", { password });
    },

    putAvatar(data) { return api("PUT", "/me/avatar", { data }); },
    dropAvatar() { return api("DELETE", "/me/avatar"); },

    /* Адрес картинки, а не data:-URI. Тег <img> заголовок Authorization
       не носит, поэтому маршрут открыт — см. комментарий в api.py.
       Метка версии в адресе нужна, чтобы после замены аватара браузер
       не показывал прежний из кэша. */
    avatarUrl(id, etag) {
      return etag ? `/api/users/${id}/avatar?v=${etag}` : "";
    },

    authLog(limit) { return api("GET", "/auth-log?limit=" + (limit || 200)); },

    /* Токен наружу нужен там, где запрос идёт мимо api(): загрузка
       документа идёт через XMLHttpRequest ради полосы прогресса, а
       скачивание — через fetch с Blob. Ключ хранилища при этом
       остаётся знанием одного файла. */
    token() { return token(); },
  };
})();
