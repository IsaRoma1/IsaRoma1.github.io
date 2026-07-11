const API_URL = String(window.MEMO_CONFIG?.apiUrl || "").trim();
const TZ = "Asia/Yekaterinburg";
const STORAGE_KEY = "roman-me-v3";
const LEGACY_STORAGE_KEY = "roman-memo-demo-v1";
const AUTH_KEY = "roman-memo-auth-v1";
const ACCESS_PASSWORD = "251187";

const MORNING_TEXT = [
  "Я Роман Исаев.",
  "Я человек, который соединяет людей, идеи, бизнес и нейросети. Я вижу возможности там, где другие видят хаос. Я умею запускать диалоги, находить сильных людей, создавать смыслы и превращать сложное в понятное.",
  "Я живу в мире изобилия. Возможности уже есть вокруг меня. Деньги, люди, идеи, партнёрства и события приходят ко мне через ценность, которую я создаю.",
  "Я не жду, что мир сам принесёт мне результат. Я создаю ценность. Я говорю с людьми. Я делаю предложения. Я публикую мысли. Я продаю. Я учусь. Я действую.",
  "Деньги приходят ко мне легко в больших количествах, когда я ясно показываю рынку свою ценность. Мой доход растёт через пользу, которую я приношу предпринимателям, командам, клиентам и аудитории.",
  "Я благодарен за то, что уже создано. Я благодарен за людей, которые рядом. Я благодарен за опыт, даже если он был дорогим. Я благодарен за свои ошибки, потому что они показали мне слабые места системы.",
  "Я не создаю излишнего потенциала. Я не давлю на мир истерикой. Я не требую мгновенных доказательств своей значимости. Я спокойно делаю точные действия, и мир отвечает движением.",
  "Сегодня я выбираю ясность вместо суеты. Действие вместо фантазии. Систему вместо самокритики. Ценность вместо ожидания. Ответственность вместо жалоб.",
  "Я не обязан быть идеальным. Но я обязан быть честным с собой.",
  "Один пропуск это данные. Два пропуска это сигнал проверить систему. Три пропуска это паттерн, который нужно разобрать и починить.",
  "Сегодня мне не нужно победить всю жизнь. Сегодня мне нужно сделать три действия: одно действие для денег, одно действие для контента, одно действие для здоровья.",
  "Я становлюсь человеком, чей доход соответствует его ценности. Я становлюсь человеком, который создаёт продукты, влияющие на тысячи и миллионы людей. Я становлюсь человеком, который умеет держать фокус, даже когда внутри шум.",
  "Моя энергия возвращается. Моя ясность усиливается. Мои действия собираются в систему. Мой путь открыт.",
  "Сегодня я начинаю."
];

const STRENGTHS = [
  ["Медийность", "15 млн+ охвата и 13 000 новых подписчиков через контент.", "Думать не что бы сказать, а что люди захотят сохранить, переслать или обсудить."],
  ["Публичная энергия", "Выступления перед аудиторией 1000+ человек на тему нейросетей.", "Выходить в голос, видео, сцену, эфир, переговоры. Сила включается через живой контакт."],
  ["Коммуникации", "Умею выходить на сильных людей, запускать диалоги и оживлять связи.", "Написать одному человеку, который может приблизить к деньгам, росту или сильному партнёрству."],
  ["Упаковка сложного в простое", "Объясняю нейросети предпринимателям и командам на понятном языке.", "Брать сложную тему и превращать её в простую пользу, которую можно применить сразу."],
  ["Продуктовый запуск", "Запустил Telegram-игру и собрал 130 000 игроков.", "Не застревать в идее, а быстро доводить до теста, обратной связи и первого пользователя."],
  ["Визуальное мышление", "Вижу, как идеи превращаются в картинки, ролики, лендинги и продающие форматы.", "Превращать абстрактную пользу в видимый результат, который человек может понять за 3 секунды."],
  ["Стратегия из хаоса", "Вижу структуру там, где другие видят кучу несвязанных идей.", "Выбрать не 20 направлений, а один рычаг с максимальной отдачей."],
  ["AI-экспертиза", "Обучаю предпринимателей и команды внедрять нейросети в бизнес-процессы.", "Показывать не магические инструменты, а конкретную экономию времени, денег и внимания."],
  ["Катализатор идей", "Быстро собираю новые форматы, продукты, связки и гипотезы.", "Генерировать идеи, но не убегать в каждую. Новые идеи идут в парковку, фокус остаётся на главной цели."],
  ["Энергия создателя", "Включаюсь, когда есть дедлайн, аудитория, конкретный клиент и понятная ставка.", "Создавать себе внешний контур обязательств, а не ждать внутренней дисциплины."]
].map((item, index) => ({
  id: `sp-${index + 1}`,
  title: item[0],
  evidence: item[1],
  today_rule: item[2],
  sort_order: index + 1,
  active: true
}));

const GOAL_SEEDS = [
  {
    id: "goal-income",
    title: "1 000 000 ₽ чистыми в месяц",
    description: "Безопасность семьи, закрытие долгов, свобода действий и ресурс для роста.",
    category: "Деньги",
    price_value: 1000000,
    currency: "RUB",
    price_text: "1 000 000 ₽ / месяц",
    status: "active"
  },
  {
    id: "goal-buffer",
    title: "Подушка 1–2 млн ₽",
    description: "Перестать жить в режиме постоянного тушения пожара.",
    category: "Капитал",
    price_value: 2000000,
    currency: "RUB",
    price_text: "2 000 000 ₽",
    status: "active"
  },
  {
    id: "goal-debt",
    title: "Закрыть долг $25 000",
    description: "Убрать фоновое давление и вернуть спокойный фокус.",
    category: "Капитал",
    price_value: 25000,
    currency: "USD",
    price_text: "$25 000",
    status: "active"
  },
  {
    id: "goal-lazar",
    title: "Лазарь: стабильный рекуррентный доход",
    description: "Продукт, который масштабируется без постоянного личного времени.",
    category: "Продукт",
    status: "active"
  },
  {
    id: "goal-med",
    title: "Меднаправление с Анной",
    description: "Найти рабочую стратегию продукта, монетизации и выхода на рынок.",
    category: "Бизнес",
    status: "active"
  },
  {
    id: "goal-weight",
    title: "Вес 84 кг",
    description: "Энергия и тело, способные удерживать выбранный масштаб.",
    category: "Здоровье",
    price_text: "84 кг",
    status: "active"
  }
].map((goal, index) => ({
  source_url: "",
  image_url: "",
  target_date: "",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  sort_order: index + 1,
  ...goal
}));

const FOCUS_DEFAULTS = {
  money_task: "Написать 3 follow-up людям, которые могут купить, порекомендовать или вывести на клиента.",
  money_done: false,
  content_task: "Записать один короткий ролик на тему дня. Не идеально. Живо.",
  content_done: false,
  health_task: "Сделать 20 минут движения или поехать на тренировку.",
  health_done: false,
  day_note: ""
};

const state = {
  unlocked: false,
  dashboard: null,
  meditationStep: null,
  returnScroll: 0,
  modal: null,
  showAllGoals: false,
  toastTimer: null
};

function todayISO() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date());
}

function nowISO() {
  return new Date().toISOString();
}

function uid(prefix = "id") {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function initialDashboard() {
  const today = todayISO();
  return {
    today,
    morning_logs: [],
    strengths: STRENGTHS,
    goals: GOAL_SEEDS,
    daily_focus: { date: today, ...FOCUS_DEFAULTS, updated_at: nowISO() }
  };
}

function normalizeGoal(goal, index) {
  return {
    id: goal.id || uid("goal"),
    title: goal.title || "Новая цель",
    description: goal.description || goal.reason || "",
    source_url: goal.source_url || "",
    image_url: goal.image_url || "",
    price_value: goal.price_value ?? "",
    currency: goal.currency || "RUB",
    price_text: goal.price_text || "",
    target_date: goal.target_date || goal.deadline || "",
    status: goal.status || "active",
    category: goal.category || "Личное",
    created_at: goal.created_at || nowISO(),
    updated_at: goal.updated_at || nowISO(),
    source_checked_at: goal.source_checked_at || "",
    source_note: goal.source_note || "",
    sort_order: Number(goal.sort_order || index + 1)
  };
}

function normalizeDashboard(data) {
  const base = initialDashboard();
  const today = todayISO();
  const rawFocus = data?.daily_focus || {};
  const focus = {
    date: today,
    ...FOCUS_DEFAULTS,
    ...rawFocus,
    money_task: rawFocus.money_task || rawFocus.business_task || FOCUS_DEFAULTS.money_task,
    money_done: Boolean(rawFocus.money_done ?? rawFocus.business_done),
    content_done: Boolean(rawFocus.content_done),
    health_done: Boolean(rawFocus.health_done)
  };

  return {
    ...base,
    ...data,
    today,
    morning_logs: Array.isArray(data?.morning_logs) ? data.morning_logs : [],
    strengths: Array.isArray(data?.strengths) && data.strengths.length ? data.strengths : STRENGTHS,
    goals: Array.isArray(data?.goals) && data.goals.length
      ? data.goals.map(normalizeGoal).filter((goal) => goal.status !== "removed")
      : GOAL_SEEDS,
    daily_focus: focus
  };
}

function loadLocal() {
  let parsed = null;
  try {
    const current = localStorage.getItem(STORAGE_KEY);
    const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
    parsed = JSON.parse(current || legacy || "null");
  } catch {
    parsed = null;
  }
  return normalizeDashboard(parsed || initialDashboard());
}

function saveLocal(dashboard) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(dashboard));
}

async function remoteApi(action, payload = {}) {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ action, payload, device_id: getDeviceId(), timezone: TZ })
  });
  if (!response.ok) throw new Error(`API ${response.status}`);
  const result = await response.json();
  if (!result.ok) throw new Error(result.error || "Google API error");
  return result;
}

function getDeviceId() {
  const key = "roman-me-device-v1";
  let id = localStorage.getItem(key);
  if (!id) {
    id = uid("device");
    localStorage.setItem(key, id);
  }
  return id;
}

async function localApi(action, payload = {}) {
  const data = loadLocal();
  const today = todayISO();
  let existing = false;

  if (action === "getDashboard") return { ok: true, dashboard: data, local: true };

  if (action === "completeMorning") {
    existing = data.morning_logs.some((item) => String(item.date).slice(0, 10) === today && truthy(item.completed));
    if (!existing) {
      data.morning_logs.push({
        id: uid("morning"),
        date: today,
        completed: true,
        completed_at: nowISO(),
        timezone: TZ,
        device_id: getDeviceId(),
        note: ""
      });
    }
  }

  if (action === "addGoal") {
    data.goals.unshift(normalizeGoal({ ...payload, id: uid("goal"), created_at: nowISO() }, 0));
  }

  if (action === "updateGoal") {
    const index = data.goals.findIndex((goal) => goal.id === payload.id);
    if (index >= 0) data.goals[index] = normalizeGoal({ ...data.goals[index], ...payload, updated_at: nowISO() }, index);
  }

  if (action === "deleteGoal") {
    data.goals = data.goals.filter((goal) => goal.id !== payload.id);
  }

  if (action === "saveFocus") {
    data.daily_focus = { ...data.daily_focus, ...payload, date: today, updated_at: nowISO(), device_id: getDeviceId() };
  }

  saveLocal(data);
  return { ok: true, dashboard: normalizeDashboard(data), existing, local: true };
}

async function api(action, payload = {}) {
  return API_URL ? remoteApi(action, payload) : localApi(action, payload);
}

function truthy(value) {
  return value === true || value === 1 || String(value).toLowerCase() === "true" || String(value).toLowerCase() === "да";
}

function addDays(date, delta) {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + delta);
  return value.toISOString().slice(0, 10);
}

function morningDates(data) {
  return data.morning_logs
    .filter((item) => truthy(item.completed))
    .map((item) => String(item.date).slice(0, 10));
}

function currentStreak(data) {
  const dates = new Set(morningDates(data));
  const today = todayISO();
  let cursor = dates.has(today) ? today : addDays(today, -1);
  let count = 0;
  while (dates.has(cursor)) {
    count += 1;
    cursor = addDays(cursor, -1);
  }
  return count;
}

function isMorningDone(data) {
  const today = todayISO();
  return morningDates(data).includes(today);
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function safeUrl(value = "") {
  try {
    const url = new URL(value, window.location.origin);
    return ["http:", "https:"].includes(url.protocol) ? escapeHtml(url.href) : "";
  } catch {
    return "";
  }
}

function formatToday() {
  return new Intl.DateTimeFormat("ru-RU", {
    timeZone: TZ,
    weekday: "long",
    day: "numeric",
    month: "long"
  }).format(new Date());
}

function formatTargetDate(value) {
  if (!value) return "Без срока";
  const parsed = new Date(`${String(value).slice(0, 10)}T12:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return String(value);
  return new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "short", year: "numeric" }).format(parsed);
}

function formatGoalPrice(goal) {
  if (goal.price_text) return goal.price_text;
  const amount = Number(goal.price_value);
  if (!Number.isFinite(amount) || amount <= 0) return "Не указана";
  try {
    return new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency: goal.currency || "RUB",
      maximumFractionDigits: 0
    }).format(amount);
  } catch {
    return `${new Intl.NumberFormat("ru-RU").format(amount)} ${goal.currency || ""}`.trim();
  }
}

function greeting() {
  const hour = Number(new Intl.DateTimeFormat("ru-RU", { timeZone: TZ, hour: "2-digit", hourCycle: "h23" }).format(new Date()));
  if (hour < 12) return "Доброе утро";
  if (hour < 18) return "Добрый день";
  return "Добрый вечер";
}

function daysWord(value) {
  const number = Math.abs(Number(value)) % 100;
  const last = number % 10;
  if (number > 10 && number < 20) return "дней";
  if (last === 1) return "день";
  if (last > 1 && last < 5) return "дня";
  return "дней";
}

function icon(name) {
  const paths = {
    home: '<path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10.5V20h13v-9.5M9 20v-6h6v6"/>',
    power: '<path d="M12 3v9"/><path d="M6.4 5.7a8 8 0 1 0 11.2 0"/>',
    target: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path d="m14 10 6-6"/>',
    focus: '<path d="M8 3H3v5M16 3h5v5M8 21H3v-5M16 21h5v-5"/><circle cx="12" cy="12" r="3"/>',
    edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z"/>'
  };
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || ""}</svg>`;
}

function renderLock(error = "") {
  document.getElementById("app").innerHTML = `
    <main class="lock-screen">
      <div class="lock-brand">ME.</div>
      <div class="lock-art" aria-hidden="true">
        <div class="lock-orb"></div>
        <img class="lock-person" src="/me/roman-hero.png" alt="" />
      </div>
      <section class="lock-panel">
        <h1>Личное<br>пространство.</h1>
        <p>Утренний настрой, сильные стороны, цели и точный фокус дня.</p>
        <form class="lock-form" id="lock-form">
          <input class="lock-input" id="lock-password" type="password" inputmode="numeric" autocomplete="current-password" aria-label="Пароль" placeholder="Пароль" autofocus />
          <button class="unlock-button" aria-label="Войти">→</button>
        </form>
        ${error ? `<p class="lock-error">${escapeHtml(error)}</p>` : ""}
      </section>
    </main>`;

  document.getElementById("lock-form")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const value = document.getElementById("lock-password").value;
    if (value !== ACCESS_PASSWORD) return renderLock("Не тот пароль.");
    localStorage.setItem(AUTH_KEY, "yes");
    state.unlocked = true;
    loadDashboard();
  });
}

function strengthMarkup(item, index) {
  return `
    <article class="strength-item">
      <span class="strength-number">${String(index + 1).padStart(2, "0")}</span>
      <div class="strength-name">${escapeHtml(item.title)}</div>
      <div class="strength-body">
        <p class="strength-evidence">${escapeHtml(item.evidence)}</p>
        <p class="strength-rule">Сегодня: ${escapeHtml(item.today_rule)}</p>
      </div>
    </article>`;
}

function goalMarkup(goal) {
  const image = safeUrl(goal.image_url);
  return `
    <article class="goal-poster" data-goal-card="${escapeHtml(goal.id)}">
      ${image ? `<img class="goal-image" src="${image}" alt="${escapeHtml(goal.title)}" loading="lazy" />` : '<div class="goal-fallback" aria-hidden="true"></div>'}
      <div class="goal-topline">
        <span class="goal-category">${escapeHtml(goal.category || "Цель")}</span>
        <span class="goal-status">↗</span>
      </div>
      <div class="goal-content">
        <h3>${escapeHtml(goal.title)}</h3>
        ${goal.description ? `<p class="goal-description">${escapeHtml(goal.description)}</p>` : ""}
        <div class="goal-meta">
          <span class="goal-price"><small>Стоимость / ориентир</small><strong>${escapeHtml(formatGoalPrice(goal))}</strong></span>
          <span class="goal-date"><small>Срок</small>${escapeHtml(formatTargetDate(goal.target_date))}</span>
        </div>
      </div>
      <button class="goal-edit" data-action="editGoal" data-goal-id="${escapeHtml(goal.id)}" aria-label="Редактировать цель">${icon("edit")}</button>
    </article>`;
}

function mainMarkup() {
  const data = state.dashboard;
  const streak = currentStreak(data);
  const morningDone = isMorningDone(data);
  const goals = data.goals.filter((goal) => goal.status !== "removed");
  const focus = data.daily_focus;

  return `
    <div class="site-shell">
      <header class="topbar">
        <div class="brand"><b>ME.</b><span>Roman Isaev</span></div>
        <div class="top-meta">
          <span class="today-label">${escapeHtml(formatToday())}</span>
          <span class="sync-state ${API_URL ? "is-cloud" : ""}">${API_URL ? "Google" : "На устройстве"}</span>
        </div>
      </header>

      <main>
        <section class="hero" id="morning">
          <div class="hero-visual" aria-hidden="true">
            <div class="hero-sun"></div>
            <img class="hero-person" src="/me/roman-hero.png" alt="" />
            <span class="ribbon ribbon-a"></span>
            <span class="ribbon ribbon-b"></span>
          </div>
          <div class="hero-copy">
            <div class="eyebrow">Личная система · ${escapeHtml(formatToday())}</div>
            <h1>${greeting()}, <span>Роман.</span></h1>
            <p class="hero-lead">Сегодня достаточно трёх точных действий: для денег, контента и здоровья.</p>
            <button class="morning-trigger ${morningDone ? "is-done" : ""}" data-action="startMeditation">
              <span class="trigger-copy">
                <strong>${morningDone ? "Утро выполнено" : "Начать утро"}</strong>
                <span>${morningDone ? "Можно перечитать медитацию" : "14 мыслей · около 4 минут"}</span>
              </span>
              <span class="streak"><strong>${streak}</strong><small>${daysWord(streak)}</small></span>
            </button>
            <p class="hero-status"><i></i>${morningDone ? "Сегодня зафиксировано" : "Сегодня ещё не зафиксировано"}</p>
          </div>
        </section>

        <section class="section strengths-section" id="strengths">
          <div class="section-kicker">02 · На что я опираюсь</div>
          <h2>Мои сильные<br>стороны.</h2>
          <p class="section-intro">Не список приятных качеств, а реальные рычаги, которые уже давали результат.</p>
          <div class="strength-list">
            ${data.strengths.filter((item) => item.active !== false).sort((a, b) => Number(a.sort_order) - Number(b.sort_order)).map(strengthMarkup).join("")}
          </div>
          <div class="review-note">
            <b>Черновик для совместной проверки</b>
            <span>Следующим шагом пройдём по каждому пункту: оставим факты, уберём неточности и усилим формулировки.</span>
          </div>
        </section>

        <section class="section goals-section" id="goals">
          <div class="goals-head">
            <div>
              <div class="section-kicker">03 · Куда я иду</div>
              <h2>Цели, которые<br>можно увидеть.</h2>
              <p class="section-intro">Фотография, точное название, цена и дата — чтобы мечта перестала быть туманной.</p>
            </div>
            <button class="add-goal-button" data-action="addGoal"><span>Добавить цель</span><span>+</span></button>
          </div>
          <div class="goals-grid ${state.showAllGoals ? "is-expanded" : ""}">
            ${goals.map(goalMarkup).join("") || '<p>Пока нет целей. Добавьте первую.</p>'}
          </div>
          ${goals.length > 5 ? `<div class="goals-more"><button class="text-button" data-action="toggleGoals">${state.showAllGoals ? "Свернуть" : `Показать все · ${goals.length}`}</button></div>` : ""}
        </section>

        <section class="section focus-section" id="focus">
          <div class="section-kicker">04 · Только сегодня</div>
          <h2>Фокус дня.</h2>
          <p class="section-intro">Не победить всю жизнь. Сделать по одному честному действию в трёх направлениях.</p>
          <div class="focus-list">
            ${focusRow("money", "₽", "Деньги", focus.money_task, focus.money_done)}
            ${focusRow("content", "●", "Контент", focus.content_task, focus.content_done)}
            ${focusRow("health", "↗", "Здоровье", focus.health_task, focus.health_done)}
          </div>
          <div class="focus-footer">
            <p>Данные сохраняются сразу на этом устройстве${API_URL ? " и синхронизируются с Google-таблицей" : ". Google-синхронизация подготовлена к подключению"}.</p>
            <button class="save-focus" data-action="saveFocus">Сохранить фокус</button>
          </div>
        </section>
      </main>

      <footer class="site-footer">
        <p class="footer-word">ME.</p>
        <small>Роман Исаев<br>личная система · 2026</small>
      </footer>
    </div>

    <nav class="bottom-nav" aria-label="Навигация">
      ${navButton("morning", "home", "Утро", true)}
      ${navButton("strengths", "power", "Сила")}
      ${navButton("goals", "target", "Цели")}
      ${navButton("focus", "focus", "Фокус")}
    </nav>
    ${state.meditationStep !== null ? meditationMarkup() : ""}
    ${state.modal ? goalModalMarkup() : ""}`;
}

function focusRow(type, symbol, label, value, done) {
  return `
    <div class="focus-row">
      <span class="focus-icon" aria-hidden="true">${symbol}</span>
      <span class="focus-copy">
        <label for="focus-${type}">${label}</label>
        <input class="focus-input" id="focus-${type}" data-focus-field="${type}_task" value="${escapeHtml(value || "")}" placeholder="Одно точное действие" />
      </span>
      <button class="focus-check ${done ? "is-done" : ""}" data-action="toggleFocus" data-focus-type="${type}" aria-label="${done ? "Снять отметку" : "Отметить выполненным"}">✓</button>
    </div>`;
}

function navButton(target, iconName, label, active = false) {
  return `<button class="nav-button ${active ? "is-active" : ""}" data-scroll="${target}">${icon(iconName)}<span>${label}</span></button>`;
}

function meditationMarkup() {
  const index = state.meditationStep;
  const last = index === MORNING_TEXT.length - 1;
  return `
    <section class="meditation" role="dialog" aria-modal="true" aria-label="Утренняя медитация">
      <div class="meditation-top">
        <button class="meditation-close" data-action="closeMeditation" aria-label="Закрыть">×</button>
        <div class="meditation-progress" aria-label="Прогресс"><span style="--progress:${((index + 1) / MORNING_TEXT.length) * 100}%"></span></div>
        <span class="meditation-count">${index + 1} / ${MORNING_TEXT.length}</span>
      </div>
      <div class="meditation-art" aria-hidden="true">
        <div class="meditation-orb"></div>
        <img class="meditation-person" src="/me/roman-hero.png" alt="" />
      </div>
      <div class="meditation-stage">
        <div class="meditation-label">Утренний настрой</div>
        <p class="meditation-text" key="${index}">${escapeHtml(MORNING_TEXT[index])}</p>
      </div>
      <div class="meditation-actions">
        <button class="meditation-back" data-action="prevMeditation" ${index === 0 ? "disabled" : ""} aria-label="Назад">←</button>
        <button class="meditation-next ${last ? "is-final" : ""}" data-action="nextMeditation">${last ? "Завершить и зафиксировать" : "Дальше →"}</button>
      </div>
    </section>`;
}

function emptyGoal() {
  const goal = normalizeGoal({
    id: "",
    title: "",
    description: "",
    source_url: "",
    image_url: "",
    price_value: "",
    currency: "RUB",
    price_text: "",
    target_date: "",
    status: "active",
    category: "Личное"
  }, 0);
  goal.id = "";
  return goal;
}

function goalModalMarkup() {
  const draft = state.modal.draft;
  const editing = Boolean(draft.id);
  return `
    <div class="dialog-backdrop" data-action="closeModal">
      <section class="goal-sheet" role="dialog" aria-modal="true" aria-labelledby="goal-sheet-title">
        <div class="sheet-handle"></div>
        <header class="sheet-head">
          <div>
            <h3 id="goal-sheet-title">${editing ? "Настроить цель" : "Новая цель"}</h3>
            <p>Вставьте ссылку — название, фото и цена подтянутся при доступной синхронизации.</p>
          </div>
          <button class="sheet-close" data-action="closeModal" aria-label="Закрыть">×</button>
        </header>

        <div class="goal-resolver">
          <label for="goal-query">Ссылка или свободное описание</label>
          <div class="resolver-row">
            <input id="goal-query" value="${escapeHtml(state.modal.query || draft.source_url || "")}" placeholder="Например: оранжевый Lamborghini Urus" />
            <button class="resolver-button" data-action="resolveGoal">Заполнить</button>
          </div>
          <p class="resolver-hint">Ссылки разбираются по данным страницы. Свободный поиск фото и актуальной цены потребует отдельного поискового API.</p>
        </div>

        <div class="form-grid">
          <label class="field is-wide">Название
            <input id="goal-title" value="${escapeHtml(draft.title)}" placeholder="Что именно я хочу" />
          </label>
          <label class="field is-wide">Описание
            <textarea id="goal-description" placeholder="Зачем это мне">${escapeHtml(draft.description)}</textarea>
          </label>
          <label class="field is-wide">Фотография — URL
            <input id="goal-image" type="url" value="${escapeHtml(draft.image_url)}" placeholder="https://…" />
          </label>
          <label class="field is-wide">Источник — URL
            <input id="goal-source" type="url" value="${escapeHtml(draft.source_url)}" placeholder="https://…" />
          </label>
          <label class="field">Цена числом
            <input id="goal-price-value" inputmode="decimal" value="${escapeHtml(draft.price_value)}" placeholder="27500000" />
          </label>
          <label class="field">Валюта
            <select id="goal-currency">${["RUB", "USD", "EUR", "AED", "GBP"].map((currency) => `<option ${draft.currency === currency ? "selected" : ""}>${currency}</option>`).join("")}</select>
          </label>
          <label class="field">Цена как показывать
            <input id="goal-price-text" value="${escapeHtml(draft.price_text)}" placeholder="27–35 млн ₽" />
          </label>
          <label class="field">Желаемая дата
            <input id="goal-target-date" type="date" value="${escapeHtml(String(draft.target_date || "").slice(0, 10))}" />
          </label>
          <label class="field">Категория
            <input id="goal-category" value="${escapeHtml(draft.category)}" placeholder="Авто, здоровье, капитал…" />
          </label>
          <label class="field">Статус
            <select id="goal-status">
              <option value="active" ${draft.status === "active" ? "selected" : ""}>Активная</option>
              <option value="next" ${draft.status === "next" ? "selected" : ""}>Следующая</option>
              <option value="done" ${draft.status === "done" ? "selected" : ""}>Достигнута</option>
              <option value="paused" ${draft.status === "paused" ? "selected" : ""}>Пауза</option>
            </select>
          </label>
          <div class="form-actions">
            ${editing ? '<button class="delete-button" data-action="deleteGoal">Удалить</button>' : ""}
            <button class="save-goal-button" data-action="saveGoal">Сохранить цель</button>
          </div>
        </div>
      </section>
    </div>`;
}

function render(options = {}) {
  const y = options.keepScroll ? window.scrollY : null;
  document.getElementById("app").innerHTML = mainMarkup();
  bindEvents();
  document.body.classList.toggle("is-locked", state.meditationStep !== null || Boolean(state.modal));
  if (y !== null) requestAnimationFrame(() => window.scrollTo({ top: y, behavior: "instant" }));
}

function bindEvents() {
  document.querySelectorAll("[data-action]").forEach((element) => {
    element.addEventListener("click", (event) => handleAction(event, element));
  });

  document.querySelectorAll("[data-scroll]").forEach((button) => {
    button.addEventListener("click", () => {
      document.getElementById(button.dataset.scroll)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  document.querySelectorAll(".goal-image").forEach((image) => {
    image.addEventListener("error", () => {
      image.outerHTML = '<div class="goal-fallback" aria-hidden="true"></div>';
    }, { once: true });
  });

  document.onkeydown = handleKeydown;
  setupNavObserver();
}

function setupNavObserver() {
  if (!("IntersectionObserver" in window)) return;
  const sections = ["morning", "strengths", "goals", "focus"].map((id) => document.getElementById(id)).filter(Boolean);
  const observer = new IntersectionObserver((entries) => {
    const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (!visible) return;
    document.querySelectorAll(".nav-button").forEach((button) => button.classList.toggle("is-active", button.dataset.scroll === visible.target.id));
  }, { threshold: [0.2, 0.45], rootMargin: "-18% 0px -55%" });
  sections.forEach((section) => observer.observe(section));
}

function handleKeydown(event) {
  if (state.meditationStep !== null) {
    if (event.key === "Escape") closeMeditation();
    if (["ArrowRight", "Enter", " "].includes(event.key)) {
      event.preventDefault();
      nextMeditation();
    }
    if (event.key === "ArrowLeft") previousMeditation();
  }
  if (state.modal && event.key === "Escape") closeModal();
}

function collectFocus() {
  const result = { ...state.dashboard.daily_focus };
  document.querySelectorAll("[data-focus-field]").forEach((input) => {
    result[input.dataset.focusField] = input.value.trim();
  });
  return result;
}

function collectGoal() {
  const draft = state.modal.draft;
  return {
    id: draft.id || undefined,
    title: document.getElementById("goal-title").value.trim(),
    description: document.getElementById("goal-description").value.trim(),
    image_url: document.getElementById("goal-image").value.trim(),
    source_url: document.getElementById("goal-source").value.trim(),
    price_value: document.getElementById("goal-price-value").value.trim(),
    currency: document.getElementById("goal-currency").value,
    price_text: document.getElementById("goal-price-text").value.trim(),
    target_date: document.getElementById("goal-target-date").value,
    category: document.getElementById("goal-category").value.trim() || "Личное",
    status: document.getElementById("goal-status").value,
    updated_at: nowISO()
  };
}

async function handleAction(event, element) {
  const action = element.dataset.action;
  if (action === "closeModal" && event.target !== element && element.classList.contains("dialog-backdrop")) return;

  if (action === "startMeditation") {
    state.returnScroll = window.scrollY;
    state.meditationStep = 0;
    render({ keepScroll: true });
    return;
  }
  if (action === "closeMeditation") return closeMeditation();
  if (action === "prevMeditation") return previousMeditation();
  if (action === "nextMeditation") return nextMeditation();
  if (action === "addGoal") return openGoal();
  if (action === "editGoal") return openGoal(element.dataset.goalId);
  if (action === "closeModal") return closeModal();

  if (action === "toggleGoals") {
    state.showAllGoals = !state.showAllGoals;
    return render({ keepScroll: true });
  }

  if (action === "toggleFocus") {
    const focus = collectFocus();
    const key = `${element.dataset.focusType}_done`;
    focus[key] = !focus[key];
    await saveFocus(focus, true);
    return;
  }

  if (action === "saveFocus") {
    await saveFocus(collectFocus(), false);
    return;
  }

  if (action === "saveGoal") return saveGoal();
  if (action === "deleteGoal") return deleteGoal();
  if (action === "resolveGoal") return resolveGoal(element);
}

function closeMeditation() {
  state.meditationStep = null;
  render();
  requestAnimationFrame(() => window.scrollTo({ top: state.returnScroll, behavior: "instant" }));
}

function previousMeditation() {
  if (state.meditationStep <= 0) return;
  state.meditationStep -= 1;
  render({ keepScroll: true });
}

async function nextMeditation() {
  if (state.meditationStep < MORNING_TEXT.length - 1) {
    state.meditationStep += 1;
    render({ keepScroll: true });
    return;
  }

  try {
    const result = await api("completeMorning");
    state.dashboard = normalizeDashboard(result.dashboard || state.dashboard);
    saveLocal(state.dashboard);
    state.meditationStep = null;
    render();
    window.scrollTo({ top: 0, behavior: "instant" });
    showToast(result.existing ? "Сегодня уже было зафиксировано. Медитация перечитана." : "Утро зафиксировано. День начат.");
  } catch (error) {
    console.error(error);
    showToast("Не удалось зафиксировать. Проверьте соединение.");
  }
}

function openGoal(id = "") {
  const existing = id ? state.dashboard.goals.find((goal) => goal.id === id) : null;
  state.modal = { draft: existing ? { ...existing } : emptyGoal(), query: existing?.source_url || "" };
  render({ keepScroll: true });
}

function closeModal() {
  state.modal = null;
  render({ keepScroll: true });
}

async function saveGoal() {
  const payload = collectGoal();
  if (!payload.title) return showToast("Добавьте название цели.");

  try {
    const result = await api(payload.id ? "updateGoal" : "addGoal", payload);
    state.dashboard = normalizeDashboard(result.dashboard || state.dashboard);
    saveLocal(state.dashboard);
    state.modal = null;
    render({ keepScroll: true });
    showToast("Цель сохранена.");
  } catch (error) {
    console.error(error);
    showToast("Цель не сохранилась. Проверьте соединение.");
  }
}

async function deleteGoal() {
  const id = state.modal?.draft?.id;
  if (!id || !window.confirm("Удалить эту цель?")) return;
  try {
    const result = await api("deleteGoal", { id });
    state.dashboard = normalizeDashboard(result.dashboard || state.dashboard);
    saveLocal(state.dashboard);
    state.modal = null;
    render({ keepScroll: true });
    showToast("Цель удалена.");
  } catch (error) {
    console.error(error);
    showToast("Не удалось удалить цель.");
  }
}

async function saveFocus(focus, silent) {
  try {
    const result = await api("saveFocus", focus);
    state.dashboard = normalizeDashboard(result.dashboard || { ...state.dashboard, daily_focus: focus });
    saveLocal(state.dashboard);
    render({ keepScroll: true });
    if (!silent) showToast("Фокус дня сохранён.");
  } catch (error) {
    console.error(error);
    showToast("Фокус не сохранился. Проверьте соединение.");
  }
}

function titleFromUrl(value) {
  try {
    const url = new URL(value);
    const last = decodeURIComponent(url.pathname.split("/").filter(Boolean).pop() || url.hostname.replace(/^www\./, ""));
    const title = last.replace(/\.(html?|php)$/i, "").replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim();
    return title ? title.charAt(0).toUpperCase() + title.slice(1) : url.hostname;
  } catch {
    return value.trim();
  }
}

async function resolveGoal(button) {
  const query = document.getElementById("goal-query").value.trim();
  if (!query) return showToast("Вставьте ссылку или опишите цель.");
  state.modal.query = query;
  const isUrl = /^https?:\/\//i.test(query);

  if (!isUrl) {
    state.modal.draft.title = query;
    render({ keepScroll: true });
    showToast("Название заполнено. Автопоиск потребует поискового API.");
    return;
  }

  if (!API_URL) {
    state.modal.draft.source_url = query;
    if (!state.modal.draft.title) state.modal.draft.title = titleFromUrl(query);
    render({ keepScroll: true });
    showToast("Ссылка сохранена. Авторазбор заработает после подключения Google.");
    return;
  }

  button.disabled = true;
  button.textContent = "Ищу…";
  try {
    const result = await api("resolveGoalUrl", { url: query });
    state.modal.draft = normalizeGoal({ ...state.modal.draft, ...result.metadata, source_url: query }, 0);
    render({ keepScroll: true });
    showToast("Данные страницы подтянуты. Проверьте цену перед сохранением.");
  } catch (error) {
    console.error(error);
    button.disabled = false;
    button.textContent = "Заполнить";
    showToast("Страница не отдала данные. Поля можно заполнить вручную.");
  }
}

function showToast(message) {
  window.clearTimeout(state.toastTimer);
  document.querySelector(".toast")?.remove();
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  document.body.appendChild(toast);
  state.toastTimer = window.setTimeout(() => toast.remove(), 3100);
}

async function loadDashboard() {
  try {
    const result = await api("getDashboard");
    state.dashboard = normalizeDashboard(result.dashboard);
    saveLocal(state.dashboard);
  } catch (error) {
    console.error(error);
    state.dashboard = loadLocal();
    showToast("Google недоступен. Данные сохраняются на этом устройстве.");
  }
  render();
}

async function boot() {
  state.unlocked = localStorage.getItem(AUTH_KEY) === "yes";
  if (!state.unlocked) renderLock();
  else await loadDashboard();

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/me/sw.js").then((registration) => registration.update()).catch(() => {});
  }
}

boot();
