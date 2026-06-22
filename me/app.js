const API_URL = window.MEMO_CONFIG?.apiUrl || "";
const TZ = "Asia/Yekaterinburg";
const STORAGE_KEY = "roman-memo-demo-v1";
const ACCESS_PASSWORD = "251187";

const morningText = [
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

const superpowers = [
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
].map((item, index) => ({ id: `sp-${index + 1}`, title: item[0], evidence: item[1], today_rule: item[2], sort_order: index + 1 }));

const achievements = [
  "Привлёк $500 000+ во время работы в инвестиционном фонде",
  "Запустил Telegram-игру и собрал 130 000 игроков",
  "Выступил на тему нейросетей перед аудиторией 1000+ человек",
  "Обучил сотрудников агентства недвижимости работе с нейросетями",
  "Помог оптимизировать рабочие процессы в 2 раза",
  "Запустил контент-завод и получил 15 млн+ охвата целевой аудитории",
  "Привлёк 13 000 новых подписчиков через контент",
  "Разработал механику агента для поиска новых клиентов в холодную в Instagram",
  "Веду бизнес-подкаст и создаю медийный капитал",
  "Создал экспертизу на стыке ИИ, маркетинга, продаж и визуального контента"
];

const habitSeeds = [
  ["h1", "Утренний меморандум", "Начать день с себя, а не с чужого шума.", "Открыть меморандум и нажать старт.", "Отметить сегодня"],
  ["h2", "Без энергетиков", "Вернуть себе нормальную энергию, сон и управление состоянием.", "Один день без энергетиков.", "День без энергетиков"],
  ["h3", "Продажное действие", "Деньги приходят от контактов, офферов, follow-up и переговоров.", "Один контакт, follow-up, оффер или разговор о деньгах.", "Продажное действие сделано"],
  ["h4", "Контент", "Моя медийность это актив. Актив растёт от регулярного выхода в поле.", "Один рилс, пост, сторис, карусель, тезис или сценарий.", "Контент сделан"],
  ["h5", "Движение / тренировка", "Энергия, тело и деньги связаны. Разваленное тело не удерживает масштаб.", "20 минут движения или полноценная тренировка.", "Движение сделано"],
  ["h6", "Вечерняя фиксация", "День не должен исчезать в тумане. Я фиксирую факты, выводы и следующий шаг.", "3 строки: что сделал, что принесло ценность, что завтра важно не потерять.", "День зафиксирован"]
].map((item, index) => ({
  id: item[0],
  title: item[1],
  description: item[2],
  minimum_action: item[3],
  button: item[4],
  sort_order: index + 1,
  is_active: true
}));

const categories = [
  "Деньги и капитал",
  "Бизнес и продукты",
  "Медийность и личный бренд",
  "Здоровье и энергия",
  "Семья и образ жизни",
  "Навыки и мышление",
  "Вклад и след",
  "Путешествия и свобода"
];

const goalSeeds = [
  ["Деньги и капитал", "1 000 000 ₽ чистыми в месяц", "Причина: безопасность семьи, закрытие долгов, свобода действий, ресурс для роста.", "active"],
  ["Деньги и капитал", "300–400 тыс. ₽ стабильной базы каждый месяц", "Причина: закрыть бытовое давление и перестать принимать решения из финансового стресса.", "active"],
  ["Деньги и капитал", "Подушка 1–2 млн ₽", "Причина: перестать жить в режиме постоянного тушения пожара.", "active"],
  ["Деньги и капитал", "Закрыть долг $25 000", "Причина: убрать фоновое давление и вернуть спокойный фокус.", "active"],
  ["Деньги и капитал", "Капитал $30 млн, работающий под 10% годовых", "", "next"],
  ["Деньги и капитал", "5–10 млн ₽ в месяц как следующий уровень после первого миллиона", "", "next"],
  ["Бизнес и продукты", "Лазарь: стабильный рекуррентный доход", "Причина: продукт, который масштабируется без постоянного личного времени Романа.", "active"],
  ["Бизнес и продукты", "Меднаправление с Анной: найти рабочую стратегию", "Поисковое направление: рынок, боли аудитории, экспертность Анны, сценарии монетизации и IT-продукта.", "active"],
  ["Бизнес и продукты", "2 корпоративных обучения в месяц", "Причина: быстрый денежный рычаг через высокий чек.", "active"],
  ["Бизнес и продукты", "3–5 индивидуальных клиентов в месяц", "Причина: сильный личный денежный поток без сложной инфраструктуры.", "active"],
  ["Бизнес и продукты", "20 консультаций в месяц по 10 000 ₽", "Причина: понятный денежный поток на 200 000 ₽ в месяц.", "active"],
  ["Бизнес и продукты", "Системный отдел продаж: CRM, скрипты, follow-up, понятная воронка", "", "active"],
  ["Медийность и личный бренд", "Ежедневный короткий контент", "", "active"],
  ["Медийность и личный бренд", "Регулярные подкасты и YouTube-выпуски", "", "active"],
  ["Медийность и личный бренд", "Telegram как основная площадка доверия", "", "active"],
  ["Здоровье и энергия", "30 дней без энергетиков", "", "active"],
  ["Здоровье и энергия", "Стабильный режим сна", "", "active"],
  ["Здоровье и энергия", "Регулярное движение / тренировки", "", "active"],
  ["Здоровье и энергия", "Вес 84 кг", "", "active"],
  ["Семья и образ жизни", "Финансовая стабильность для семьи", "", "active"],
  ["Семья и образ жизни", "Больше спокойствия в быту", "", "active"],
  ["Навыки и мышление", "Усилить продажи и упаковку ценности", "", "active"],
  ["Навыки и мышление", "Использовать ИИ как усилитель мышления и скорости", "", "active"],
  ["Вклад и след", "Обучать предпринимателей и команды использовать ИИ практически", "", "active"],
  ["Вклад и след", "Создавать продукты, которые дают людям ощущение будущего", "", "active"],
  ["Путешествия и свобода", "Работать без жёсткой привязки к месту", "", "next"],
  ["Путешествия и свобода", "Путешествовать с семьёй без финансовой тревоги", "", "next"]
].map((goal, index) => ({
  id: `g${index + 1}`,
  category: goal[0],
  title: goal[1],
  description: goal[2],
  reason: "",
  status: goal[3],
  deadline: "",
  created_at: new Date().toISOString(),
  completed_at: "",
  sort_order: index + 1,
  notes: ""
}));

const incomeSources = [
  "Консультация 10 000 ₽ / час",
  "Индивидуальная работа",
  "Корпоративное обучение",
  "Лазарь",
  "Меднаправление с Анной",
  "Партнёрка",
  "Выступление",
  "Маркетинг / агентские",
  "Другое"
];

const defaultFocus = {
  business_task: "Написать 3 follow-up людям, которые могут купить, порекомендовать или вывести на клиента.",
  business_trigger: "Если я открыл Telegram после утреннего ритуала",
  business_action: "то пишу 3 follow-up без ожидания идеального текста",
  business_limit: "15 минут",
  business_done: false,
  content_task: "Записать один короткий ролик на тему дня. Не идеально. Живо.",
  content_trigger: "Если я сел в машину или остался один на 15 минут",
  content_action: "то записываю один короткий ролик",
  content_limit: "15 минут",
  content_done: false,
  health_task: "Сделать 20 минут движения или поехать на тренировку.",
  health_trigger: "Если наступило выбранное время",
  health_action: "то я делаю движение без переговоров с собой",
  health_limit: "20–60 минут",
  health_done: false
};

const state = {
  dashboard: null,
  unlocked: false,
  lockError: "",
  saving: {},
  toast: "",
  activeNav: "morning",
  modal: null
};

function todayISO() {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
  return formatter.format(new Date());
}

function currency(value) {
  return new Intl.NumberFormat("ru-RU").format(Math.round(Number(value) || 0)) + " ₽";
}

function uid(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function parseDate(date) {
  return new Date(`${date}T00:00:00+05:00`);
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next.toISOString().slice(0, 10);
}

function dayDiff(from, to) {
  return Math.max(1, Math.round((parseDate(to) - parseDate(from)) / 86400000) + 1);
}

function currentStreak(dates, today) {
  const set = new Set(dates);
  let cursor = set.has(today) ? today : addDays(today, -1);
  let count = 0;
  while (set.has(cursor)) {
    count += 1;
    cursor = addDays(cursor, -1);
  }
  return count;
}

function initialDashboard() {
  const today = todayISO();
  return {
    settings: {
      timezone: TZ,
      start_date: today,
      monthly_income_target: 1000000,
      stable_base_min: 300000,
      stable_base_max: 400000,
      user_name: "Роман Исаев"
    },
    today,
    morning_logs: [],
    habits: habitSeeds,
    habit_logs: [],
    superpowers,
    goals: goalSeeds,
    income: [],
    daily_focus: { date: today, ...defaultFocus }
  };
}

function loadLocal() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return initialDashboard();
  const data = JSON.parse(saved);
  const today = todayISO();
  return {
    ...initialDashboard(),
    ...data,
    today,
    daily_focus: data.daily_focus?.date === today ? { ...defaultFocus, ...data.daily_focus } : { date: today, ...defaultFocus }
  };
}

function saveLocal(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

async function api(action, payload = {}) {
  if (!API_URL) return localApi(action, payload);

  const url = `${API_URL}${API_URL.includes("?") ? "&" : "?"}action=${encodeURIComponent(action)}`;
  const options = action === "getDashboard"
    ? {}
    : {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload)
      };
  const response = await fetch(url, options);
  if (!response.ok) throw new Error("API error");
  const json = await response.json();
  if (json.error) throw new Error(json.error);
  return json;
}

async function localApi(action, payload) {
  const data = loadLocal();
  const today = data.today;
  const now = new Date().toISOString();

  if (action === "getDashboard") return data;

  if (action === "completeMorning") {
    const existing = data.morning_logs.some((log) => log.date === today);
    if (!existing) data.morning_logs.push({ id: uid("m"), date: today, completed_at: now, timezone: TZ });
    const memo = data.habit_logs.some((log) => log.habit_id === "h1" && log.date === today);
    if (!memo) data.habit_logs.push({ id: uid("hl"), habit_id: "h1", date: today, completed_at: now });
    saveLocal(data);
    return { ok: true, existing, dashboard: data };
  }

  if (action === "completeHabit") {
    const existing = data.habit_logs.some((log) => log.habit_id === payload.habit_id && log.date === today);
    if (!existing) data.habit_logs.push({ id: uid("hl"), habit_id: payload.habit_id, date: today, completed_at: now });
    saveLocal(data);
    return { ok: true, existing, dashboard: data };
  }

  if (action === "saveDailyFocus") {
    data.daily_focus = { ...data.daily_focus, ...payload, date: today, updated_at: now };
    saveLocal(data);
    return { ok: true, dashboard: data };
  }

  if (action === "completeFocusItem") {
    data.daily_focus[`${payload.type}_done`] = true;
    data.daily_focus.updated_at = now;
    saveLocal(data);
    return { ok: true, dashboard: data };
  }

  if (action === "addGoal") {
    data.goals.push({ id: uid("g"), created_at: now, completed_at: "", sort_order: data.goals.length + 1, ...payload });
    saveLocal(data);
    return { ok: true, dashboard: data };
  }

  if (action === "updateGoal") {
    data.goals = data.goals.map((goal) => goal.id === payload.id ? { ...goal, ...payload, completed_at: payload.status === "done" ? now : goal.completed_at } : goal);
    saveLocal(data);
    return { ok: true, dashboard: data };
  }

  if (action === "addIncome") {
    data.income.push({ id: uid("i"), created_at: now, ...payload, amount: Number(payload.amount) || 0 });
    saveLocal(data);
    return { ok: true, dashboard: data };
  }

  return { ok: true, dashboard: data };
}

function compute(data) {
  const today = data.today;
  const start = data.settings.start_date || today;
  const morningDates = [...new Set(data.morning_logs.map((log) => log.date))];
  const habitToday = data.habit_logs.filter((log) => log.date === today);
  const activeHabits = data.habits.filter((habit) => habit.is_active);
  const month = today.slice(0, 7);
  const monthIncome = data.income.filter((item) => String(item.date).slice(0, 7) === month);
  const incomeTotal = monthIncome.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const bySource = monthIncome.reduce((acc, item) => {
    acc[item.source] = (acc[item.source] || 0) + Number(item.amount || 0);
    return acc;
  }, {});
  const bestSource = Object.entries(bySource).sort((a, b) => b[1] - a[1])[0];

  return {
    morningDone: morningDates.includes(today),
    morningStreak: currentStreak(morningDates, today),
    morningTotal: morningDates.length,
    totalDays: dayDiff(start, today),
    habitsDone: new Set(habitToday.map((log) => log.habit_id)).size,
    habitsTotal: activeHabits.length,
    incomeTotal,
    incomeProgress: Math.min(100, (incomeTotal / Number(data.settings.monthly_income_target || 1000000)) * 100),
    bestSource: bestSource ? bestSource[0] : "Пока нет",
    latestIncome: monthIncome.slice().sort((a, b) => String(b.date).localeCompare(String(a.date)))[0],
    monthIncome,
    bySource
  };
}

function html(strings, ...values) {
  return strings.map((string, index) => string + (values[index] ?? "")).join("");
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[char]);
}

function statusSymbol(status) {
  return { active: "●", next: "○", done: "✓", paused: "⏸", removed: "✕" }[status] || "○";
}

function categoryClass(category) {
  const map = {
    "Деньги и капитал": "category-money",
    "Бизнес и продукты": "category-mission",
    "Медийность и личный бренд": "category-experience",
    "Здоровье и энергия": "category-health",
    "Семья и образ жизни": "category-life",
    "Навыки и мышление": "category-mission",
    "Вклад и след": "category-mission",
    "Путешествия и свобода": "category-travel"
  };
  return map[category] || "category-life";
}

function goalProgress(status) {
  return { active: 52, next: 18, done: 100, paused: 34, removed: 0 }[status] ?? 18;
}

function render() {
  const data = state.dashboard;
  if (!data) return;
  const c = compute(data);

  document.getElementById("app").innerHTML = html`
    <div class="app-shell">
      <header class="topbar">
        <div class="topbar-inner">
          <div class="app-mark">RI</div>
          <div class="status-strip" aria-label="Статус дня">
            <span class="status-pill">Сегодня: <strong>${c.morningDone ? "выполнено" : "ожидает"}</strong></span>
            <span class="status-pill">Привычки: <strong>${c.habitsDone}/${c.habitsTotal}</strong></span>
            <span class="status-pill">Доход: <strong>${currency(c.incomeTotal)}</strong></span>
            <span class="status-pill">Серия: <strong>${c.morningStreak} дн.</strong></span>
          </div>
          <nav class="desktop-nav" aria-label="Навигация">${navButtons()}</nav>
        </div>
      </header>
      <main class="content atlas-canvas">
        ${morningSection(data, c)}
        ${powerSection()}
        ${habitsSection(data, c)}
        ${focusSection(data)}
        ${goalsSection(data)}
        ${financeSection(data, c)}
      </main>
      <nav class="bottom-nav" aria-label="Основная навигация"><div class="bottom-nav-inner">${navButtons()}</div></nav>
      <div class="toast" id="toast" role="status" aria-live="polite">${escapeHtml(state.toast)}</div>
      ${modalMarkup()}
    </div>
  `;

  bindEvents();
  updateActiveNav();
  if (state.toast) requestAnimationFrame(() => document.getElementById("toast")?.classList.add("show"));
}

function renderLock() {
  document.getElementById("app").innerHTML = html`
    <main class="lock-screen">
      <section class="lock-card" aria-labelledby="lock-title">
        <div class="app-mark">RI</div>
        <p class="kicker">Закрытый раздел</p>
        <h1 id="lock-title">Введите пароль</h1>
        <p class="lead">Личная утренняя система открывается только после входа.</p>
        <form id="lock-form" class="field-grid">
          <label class="field">Пароль<input id="lock-password" type="password" inputmode="numeric" maxlength="6" autocomplete="off" placeholder="••••••" autofocus /></label>
          ${state.lockError ? `<p class="personal-error">${escapeHtml(state.lockError)}</p>` : ""}
          <button class="button primary" type="submit">Войти</button>
        </form>
      </section>
    </main>
  `;

  document.getElementById("lock-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const value = document.getElementById("lock-password").value;
    if (value !== ACCESS_PASSWORD) {
      state.lockError = "Неверный пароль. Попробуйте ещё раз.";
      renderLock();
      return;
    }

    state.unlocked = true;
    state.lockError = "";
    await loadDashboard();
  });

  document.getElementById("lock-password").addEventListener("input", (event) => {
    event.target.value = event.target.value.replace(/\D/g, "").slice(0, 6);
    state.lockError = "";
  });
}

function navButtons() {
  return [
    ["morning", "Утро"],
    ["power", "Сила"],
    ["habits", "Привычки"],
    ["goals", "Цели"],
    ["money", "Деньги"]
  ].map(([id, label]) => `<button data-scroll="${id}" class="${state.activeNav === id ? "is-active" : ""}">${label}</button>`).join("");
}

function morningSection(data, c) {
  return html`
    <section class="hero section" id="morning">
      <div class="hero-image"><img src="/me/roman-hero.png" alt="Роман Исаев в тёмном кинематографичном свете" /></div>
      <div class="hero-copy">
        <p class="kicker">Личная система утра</p>
        <h1>Роман Исаев. День начинается с выбора состояния.</h1>
        <p class="lead">Я начинаю день не с хаоса, телефона и чужих новостей. Я начинаю день с возвращения к себе, своим целям и действиям.</p>
        <div class="hero-actions">
          <button class="button primary" data-action="completeMorning" ${c.morningDone ? "disabled" : ""}>${c.morningDone ? "Утро зафиксировано" : "Начать утро"}</button>
          <button class="button secondary" data-scroll="memo">Открыть медитацию</button>
        </div>
        <p class="hero-note">${c.morningDone ? "Утро уже начато. Второй раз система не считает." : "Нажатие фиксирует сегодняшний утренний ритуал. Один день. Один выбор. Одна точка возвращения к себе."}</p>
        <div class="hero-stats">
          <div class="metric"><span>Серия утра</span><strong>${c.morningStreak} дней</strong></div>
          <div class="metric"><span>С начала пути</span><strong>${c.morningTotal} из ${c.totalDays}</strong></div>
          <div class="metric"><span>Привычки сегодня</span><strong>${c.habitsDone}/${c.habitsTotal}</strong></div>
          <div class="metric"><span>Доход месяца</span><strong>${currency(c.incomeTotal)}</strong></div>
        </div>
      </div>
      <aside class="hero-command" aria-label="Состояние дня">
        <div class="command-card">
          <span>Сегодня</span>
          <strong>${c.morningDone ? "выполнено" : "ожидает"}</strong>
        </div>
        <div class="command-card">
          <span>Привычки</span>
          <strong>${c.habitsDone}/${c.habitsTotal}</strong>
        </div>
        <div class="command-card">
          <span>До 1 млн</span>
          <strong>${currency(Math.max(0, Number(data.settings.monthly_income_target || 1000000) - c.incomeTotal))}</strong>
        </div>
      </aside>
    </section>
    <section class="section" id="memo">
      <details class="accordion" ${c.morningDone ? "open" : ""}>
        <summary>Меморандум утра</summary>
        <div class="accordion-body memorandum-text">${morningText.map((p) => `<p>${escapeHtml(p)}</p>`).join("")}</div>
      </details>
    </section>
  `;
}

function powerSection() {
  return html`
    <section class="section vault-section" id="power">
      <div class="section-head">
        <h2>Мои суперсилы</h2>
        <p>Это не список приятных качеств для самоуспокоения. Это реальные рычаги, которые уже приносили результат.</p>
      </div>
      <div class="power-rail" aria-label="Карточки суперсил">
        ${superpowers.map((power) => html`
          <article class="card power-card">
            <h3>${escapeHtml(power.title)}</h3>
            <p>${escapeHtml(power.evidence)}</p>
            <p class="rule">${escapeHtml(power.today_rule)}</p>
          </article>
        `).join("")}
      </div>
    </section>
    <section class="section" id="created">
      <div class="section-head">
        <h2>Уже создано</h2>
        <p>Когда мозг говорит ты не двигаешься, я показываю ему факты.</p>
      </div>
      <div class="card achievement-vault">
        <ul class="done-list">${achievements.map((item) => `<li><span class="check">✓</span><span>${escapeHtml(item)}</span></li>`).join("")}</ul>
        <p class="fine-print">Я уже умею создавать результат. Моя задача сейчас не искать доказательства собственной ценности. Моя задача превратить силу в систему.</p>
      </div>
    </section>
  `;
}

function habitStats(data, habitId) {
  const dates = [...new Set(data.habit_logs.filter((log) => log.habit_id === habitId).map((log) => log.date))];
  return {
    doneToday: dates.includes(data.today),
    streak: currentStreak(dates, data.today),
    total: dates.length,
    days: dayDiff(data.settings.start_date, data.today)
  };
}

function habitsSection(data, c) {
  const allDone = c.habitsDone === c.habitsTotal;
  return html`
    <section class="section" id="habits">
      <div class="section-head">
        <h2>Привычки, которые держат систему</h2>
        <p>Моя жизнь меняется от повторяемых действий, которые я фиксирую руками.</p>
      </div>
      <div class="metric-grid">
        <div class="metric"><span>Сегодня выполнено</span><strong>${c.habitsDone} из ${c.habitsTotal}</strong></div>
        <div class="metric"><span>Текущая серия</span><strong>${c.morningStreak} дней</strong></div>
      </div>
      ${allDone ? `<p class="card fine-print">Система закрыта на сегодня. Теперь не обесценивай. Это и есть фундамент масштаба.</p>` : ""}
      <div class="habit-board">
        ${data.habits.filter((habit) => habit.is_active).map((habit) => {
          const stats = habitStats(data, habit.id);
          return html`
            <article class="card habit-card">
              <div>
                <h3>${escapeHtml(habit.title)}</h3>
                <p>${escapeHtml(habit.description)}</p>
                <p><strong>Минимум дня:</strong> ${escapeHtml(habit.minimum_action)}</p>
              </div>
              <div class="habit-meta">
                <span class="tag ${stats.doneToday ? "success" : "warning"}">Сегодня: ${stats.doneToday ? "выполнено" : "ожидает"}</span>
                <span class="tag">Серия: ${stats.streak}</span>
                <span class="tag">С начала: ${stats.total} из ${stats.days}</span>
              </div>
              <button class="tap-card" data-action="completeHabit" data-habit="${habit.id}" ${stats.doneToday ? "disabled" : ""}>${stats.doneToday ? "Сегодня уже отмечено" : escapeHtml(habit.button || "Отметить сегодня")}</button>
            </article>
          `;
        }).join("")}
      </div>
    </section>
  `;
}

function focusSection(data) {
  const focus = data.daily_focus;
  const items = [
    ["business", "Деньги / бизнес", "business_task", "business_trigger", "business_action", "business_limit"],
    ["content", "Контент / медийность", "content_task", "content_trigger", "content_action", "content_limit"],
    ["health", "Здоровье / энергия", "health_task", "health_trigger", "health_action", "health_limit"]
  ];
  return html`
    <section class="section mission-board" id="focus">
      <div class="section-head">
        <h2>Фокус дня</h2>
        <p>Сегодня не нужно делать всё. Сегодня нужно сделать то, что двигает деньги, контент и энергию.</p>
      </div>
      <div class="focus-grid">
        ${items.map(([type, title, task, trigger, action, limit]) => html`
          <article class="focus-card">
            <h3>${title}</h3>
            <div class="field-grid">
              <label class="field">Задача<textarea data-focus="${task}">${escapeHtml(focus[task] || "")}</textarea></label>
              <label class="field">Если<input data-focus="${trigger}" value="${escapeHtml(focus[trigger] || "")}" /></label>
              <label class="field">То<input data-focus="${action}" value="${escapeHtml(focus[action] || "")}" /></label>
              <label class="field">Лимит<input data-focus="${limit}" value="${escapeHtml(focus[limit] || "")}" /></label>
              <div class="button-row">
                <button class="button secondary" data-action="saveFocus">Сохранить</button>
                <button class="button primary" data-action="completeFocus" data-type="${type}" ${focus[`${type}_done`] ? "disabled" : ""}>${focus[`${type}_done`] ? "Выполнено" : "Выполнено"}</button>
              </div>
            </div>
          </article>
        `).join("")}
      </div>
      <p class="fine-print">День считается сильным, если закрыты три направления: деньги, контент, здоровье. Масштаб держится на системе, а не на случайном вдохновении.</p>
    </section>
  `;
}

function goalsSection(data) {
  const visibleGoals = data.goals.filter((goal) => goal.status !== "removed");
  const activeGoals = visibleGoals.filter((goal) => goal.status === "active").slice(0, 4);
  return html`
    <section class="section atlas-map" id="goals">
      <div class="section-head">
        <h2>Цели</h2>
        <p>Не бесконечный список мечтаний. Компактная карта того, что я строю.</p>
      </div>
      <div class="atlas-overview">
        <article class="atlas-prime">
          <span class="atlas-label">Главные активные маршруты</span>
          <div class="prime-goals">
            ${activeGoals.map((goal) => html`
              <div class="prime-goal ${categoryClass(goal.category)}">
                <span>${escapeHtml(goal.category)}</span>
                <strong>${escapeHtml(goal.title)}</strong>
              </div>
            `).join("")}
          </div>
        </article>
        <div class="territory-grid" aria-label="Карта направлений">
          ${categories.map((category) => {
            const goals = visibleGoals.filter((goal) => goal.category === category);
            const completed = goals.filter((goal) => goal.status === "done").length;
            const active = goals.filter((goal) => goal.status === "active").length;
            const progress = goals.length ? Math.round((completed / goals.length) * 100) : 0;
            return html`
              <button class="territory-tile ${categoryClass(category)}" data-category-jump="${escapeHtml(category)}" style="--category-progress:${progress}%">
                <span>${escapeHtml(category)}</span>
                <strong>${active} активных</strong>
                <em>${goals.length} целей · ${progress}%</em>
                <i aria-hidden="true"><b></b></i>
              </button>
            `;
          }).join("")}
        </div>
      </div>
      <div class="habit-meta">
        <span class="tag">● Активная</span><span class="tag">○ Следующая</span><span class="tag">✓ Выполнена</span><span class="tag">⏸ На паузе</span><span class="tag">✕ Больше не моя</span>
      </div>
      ${categories.map((category, index) => {
        const goals = data.goals.filter((goal) => goal.category === category && goal.status !== "removed");
        const completed = goals.filter((goal) => goal.status === "done").length;
        const progress = goals.length ? Math.round((completed / goals.length) * 100) : 0;
        return html`
          <details class="accordion category-section ${categoryClass(category)}" data-category="${escapeHtml(category)}" style="--category-progress:${progress}%" ${index < 2 ? "open" : ""}>
            <summary>
              <span class="category-title">${escapeHtml(category)}</span>
              <span class="category-summary">${goals.length} целей · ${progress}%</span>
              <span class="category-route" aria-hidden="true"><span></span></span>
            </summary>
            <div class="accordion-body stack">
              ${goals.length ? goals.map(goalRow).join("") : `<p class="empty">Здесь пока пусто. Цель появится, когда будет настоящая причина.</p>`}
              <button class="button secondary" data-modal="goal" data-category="${escapeHtml(category)}">Добавить цель</button>
            </div>
          </details>
        `;
      }).join("")}
    </section>
  `;
}

function goalRow(goal) {
  const doneClass = goal.status === "done" ? " done" : "";
  const variant = goal.status === "active" ? "featured" : goal.status === "next" ? "future" : goal.status === "done" ? "completed" : "milestone";
  return html`
    <article class="goal-row goal-${variant} goal-status-${escapeHtml(goal.status)} ${categoryClass(goal.category)}${doneClass}" style="--goal-progress:${goalProgress(goal.status)}%">
      <div class="goal-title">
        <strong>${statusSymbol(goal.status)} ${escapeHtml(goal.title)}</strong>
        <span class="tag">${escapeHtml(goal.status)}</span>
      </div>
      <div class="goal-route" aria-hidden="true"><span></span></div>
      ${goal.description ? `<p>${escapeHtml(goal.description)}</p>` : ""}
      ${goal.deadline ? `<p>Срок: ${escapeHtml(goal.deadline)}</p>` : ""}
      <div class="mini-actions">
        <button data-modal="goal" data-goal="${goal.id}">Редактировать</button>
        <button data-action="goalStatus" data-goal="${goal.id}" data-status="done">Выполнена</button>
        <button data-action="goalStatus" data-goal="${goal.id}" data-status="paused">Пауза</button>
        <button data-action="goalStatus" data-goal="${goal.id}" data-status="active">Активная</button>
        <button data-action="goalStatus" data-goal="${goal.id}" data-status="removed">Больше не моя</button>
      </div>
    </article>
  `;
}

function financeSection(data, c) {
  const target = Number(data.settings.monthly_income_target || 1000000);
  const byDay = c.monthIncome.reduce((acc, item) => {
    const key = String(item.date).slice(8, 10);
    acc[key] = (acc[key] || 0) + Number(item.amount || 0);
    return acc;
  }, {});
  const maxDay = Math.max(1, ...Object.values(byDay), ...Object.values(c.bySource));

  return html`
    <section class="section" id="money">
      <div class="section-head">
        <h2>Финансы без тумана</h2>
        <p>Деньги не оценивают меня как человека. Они показывают, где рынок уже сказал да.</p>
      </div>
      <div class="grid two">
        <article class="finance-card card">
          <h3>Главный статус</h3>
          <div class="metric-grid">
            <div class="metric"><span>Доход месяца</span><strong>${currency(c.incomeTotal)}</strong></div>
            <div class="metric"><span>Осталось до 1 млн</span><strong>${currency(Math.max(0, target - c.incomeTotal))}</strong></div>
            <div class="metric"><span>База месяца</span><strong>${currency(data.settings.stable_base_min)}–${currency(data.settings.stable_base_max)}</strong></div>
            <div class="metric"><span>Лучший источник</span><strong>${escapeHtml(c.bestSource)}</strong></div>
          </div>
          <p class="fine-print">Выполнение: ${Math.round(c.incomeProgress)}%</p>
          <div class="progress" style="--progress: ${c.incomeProgress}%"><span></span></div>
          <p class="fine-print">Последнее поступление: ${c.latestIncome ? `${currency(c.latestIncome.amount)} · ${escapeHtml(c.latestIncome.source)}` : "пока нет"}</p>
        </article>
        <article class="finance-card card">
          <h3>Добавить доход</h3>
          <div class="field-grid">
            <label class="field">Дата<input id="income-date" type="date" value="${data.today}" /></label>
            <label class="field">Сумма<input id="income-amount" inputmode="numeric" placeholder="10000" /></label>
            <label class="field">Источник<select id="income-source">${incomeSources.map((s) => `<option>${escapeHtml(s)}</option>`).join("")}</select></label>
            <label class="field">Проект / клиент<input id="income-project" placeholder="Клиент или проект" /></label>
            <label class="field">Комментарий<textarea id="income-comment" placeholder="Что сработало"></textarea></label>
            <button class="button primary" data-action="addIncome">Добавить доход</button>
          </div>
        </article>
      </div>
      <div class="grid two">
        <article class="card">
          <h3>Доход по дням</h3>
          <div class="bars">${Object.keys(byDay).length ? Object.entries(byDay).map(([day, amount]) => barRow(day, amount, maxDay)).join("") : `<p class="empty">Доходы пока не добавлены. Первое поступление не обязано быть большим. Оно обязано быть зафиксированным.</p>`}</div>
        </article>
        <article class="card">
          <h3>Доход по источникам</h3>
          <div class="bars">${Object.keys(c.bySource).length ? Object.entries(c.bySource).map(([source, amount]) => barRow(source, amount, maxDay)).join("") : `<p class="empty">Пока нет источников за месяц.</p>`}</div>
        </article>
      </div>
      <article class="card">
        <h3>Последние поступления</h3>
        <div class="stack">${c.monthIncome.length ? c.monthIncome.slice(-6).reverse().map((item) => `<div class="goal-row"><div class="goal-title"><strong>${currency(item.amount)}</strong><span class="tag">${escapeHtml(item.date)}</span></div><p>${escapeHtml(item.source)} ${item.project_or_client ? `· ${escapeHtml(item.project_or_client)}` : ""}</p></div>`).join("") : `<p class="empty">Доходы пока не добавлены.</p>`}</div>
      </article>
      <p class="fine-print">Я не прячусь от цифр. Цифры не враги. Цифры это приборная панель.</p>
    </section>
  `;
}

function barRow(label, amount, max) {
  return `<div class="bar-row"><span>${escapeHtml(label)}</span><div class="bar-track"><span style="--bar:${Math.max(4, (amount / max) * 100)}%"></span></div><strong>${currency(amount)}</strong></div>`;
}

function modalMarkup() {
  if (!state.modal) return `<div class="dialog-backdrop" id="dialog"></div>`;
  const data = state.dashboard;
  const goal = state.modal.goalId ? data.goals.find((item) => item.id === state.modal.goalId) : null;
  const category = goal?.category || state.modal.category || categories[0];
  return html`
    <div class="dialog-backdrop show" id="dialog">
      <div class="sheet" role="dialog" aria-modal="true" aria-labelledby="goal-title">
        <div class="sheet-head">
          <h3 id="goal-title">${goal ? "Редактировать цель" : "Добавить цель"}</h3>
          <button class="icon-button" data-close-modal aria-label="Закрыть">×</button>
        </div>
        <div class="field-grid">
          <label class="field">Категория<select id="goal-category">${categories.map((item) => `<option ${item === category ? "selected" : ""}>${escapeHtml(item)}</option>`).join("")}</select></label>
          <label class="field">Название цели<input id="goal-title-input" value="${escapeHtml(goal?.title || "")}" /></label>
          <label class="field">Описание<textarea id="goal-description">${escapeHtml(goal?.description || "")}</textarea></label>
          <label class="field">Причина / зачем<textarea id="goal-reason">${escapeHtml(goal?.reason || "")}</textarea></label>
          <fieldset class="quality-filter" aria-label="Проверка качества цели">
            <legend>Проверка качества цели</legend>
            <label><input type="checkbox" /> <span>цель завершённая</span></label>
            <label><input type="checkbox" /> <span>цель измеримая</span></label>
            <label><input type="checkbox" /> <span>цель конкретная</span></label>
            <label><input type="checkbox" /> <span>цель доказуемая</span></label>
          </fieldset>
          <label class="field">Статус<select id="goal-status">${["active", "next", "done", "paused", "removed"].map((s) => `<option value="${s}" ${goal?.status === s ? "selected" : ""}>${s}</option>`).join("")}</select></label>
          <label class="field">Срок<input id="goal-deadline" type="date" value="${escapeHtml(goal?.deadline || "")}" /></label>
          <label class="field">Заметки<textarea id="goal-notes">${escapeHtml(goal?.notes || "")}</textarea></label>
          <button class="button primary" data-action="saveGoal" data-goal="${goal?.id || ""}">Сохранить</button>
        </div>
      </div>
    </div>
  `;
}

function bindEvents() {
  document.querySelectorAll("[data-scroll]").forEach((button) => {
    button.addEventListener("click", () => {
      const target = document.getElementById(button.dataset.scroll);
      if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  document.querySelectorAll("[data-category-jump]").forEach((button) => {
    button.addEventListener("click", () => {
      const target = document.querySelector(`[data-category="${CSS.escape(button.dataset.categoryJump)}"]`);
      if (!target) return;
      target.open = true;
      window.setTimeout(() => target.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
    });
  });

  document.querySelectorAll("[data-action]").forEach((element) => {
    element.addEventListener("click", () => handleAction(element));
  });

  document.querySelectorAll("[data-modal='goal']").forEach((button) => {
    button.addEventListener("click", () => {
      state.modal = { category: button.dataset.category, goalId: button.dataset.goal };
      document.body.classList.add("is-locked");
      render();
    });
  });

  document.querySelectorAll("[data-close-modal], #dialog").forEach((element) => {
    element.addEventListener("click", (event) => {
      if (event.target === element || element.hasAttribute("data-close-modal")) closeModal();
    });
  });

  const observer = new IntersectionObserver((entries) => {
    const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (visible) {
      state.activeNav = visible.target.id === "created" ? "power" : visible.target.id;
      updateActiveNav();
    }
  }, { rootMargin: "-35% 0px -55% 0px", threshold: [0.1, 0.3, 0.6] });
  ["morning", "power", "habits", "goals", "money"].forEach((id) => {
    const section = document.getElementById(id);
    if (section) observer.observe(section);
  });
}

function updateActiveNav() {
  document.querySelectorAll("[data-scroll]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.scroll === state.activeNav);
  });
}

function closeModal() {
  state.modal = null;
  document.body.classList.remove("is-locked");
  render();
}

function showToast(message) {
  state.toast = message;
  render();
  window.setTimeout(() => {
    state.toast = "";
    render();
  }, 2600);
}

async function refreshFrom(result) {
  if (result.dashboard) state.dashboard = result.dashboard;
  else state.dashboard = await api("getDashboard");
}

async function handleAction(element) {
  const action = element.dataset.action;
  try {
    if (action === "completeMorning") {
      const result = await api("completeMorning");
      await refreshFrom(result);
      showToast(result.existing ? "Утро уже начато. Второй раз система не считает." : "Зафиксировано.");
      window.setTimeout(() => document.getElementById("memo")?.scrollIntoView({ behavior: "smooth" }), 150);
    }

    if (action === "completeHabit") {
      const result = await api("completeHabit", { habit_id: element.dataset.habit });
      await refreshFrom(result);
      showToast(result.existing ? "Сегодня уже отмечено. Один день, одна отметка." : "Зафиксировано.");
    }

    if (action === "saveFocus") {
      const payload = {};
      document.querySelectorAll("[data-focus]").forEach((input) => payload[input.dataset.focus] = input.value);
      const result = await api("saveDailyFocus", payload);
      await refreshFrom(result);
      showToast("Зафиксировано.");
    }

    if (action === "completeFocus") {
      const result = await api("completeFocusItem", { type: element.dataset.type });
      await refreshFrom(result);
      showToast("Зафиксировано.");
    }

    if (action === "goalStatus") {
      const result = await api("updateGoal", { id: element.dataset.goal, status: element.dataset.status });
      await refreshFrom(result);
      showToast({
        done: "Цель перенесена в достигнутые.",
        paused: "Цель сохранена, но снята с активного фокуса.",
        removed: "Цель перенесена в архив Больше не моя.",
        active: "Цель возвращена в активные."
      }[element.dataset.status] || "Зафиксировано.");
    }

    if (action === "saveGoal") {
      const payload = {
        id: element.dataset.goal || undefined,
        category: document.getElementById("goal-category").value,
        title: document.getElementById("goal-title-input").value.trim(),
        description: document.getElementById("goal-description").value.trim(),
        reason: document.getElementById("goal-reason").value.trim(),
        status: document.getElementById("goal-status").value,
        deadline: document.getElementById("goal-deadline").value,
        notes: document.getElementById("goal-notes").value.trim()
      };
      if (!payload.title) return showToast("Добавьте название цели.");
      const result = await api(payload.id ? "updateGoal" : "addGoal", payload);
      await refreshFrom(result);
      closeModal();
      showToast("Зафиксировано.");
    }

    if (action === "addIncome") {
      const amount = Number(document.getElementById("income-amount").value.replace(/\s/g, ""));
      if (!amount) return showToast("Укажите сумму дохода.");
      const result = await api("addIncome", {
        date: document.getElementById("income-date").value || state.dashboard.today,
        amount,
        source: document.getElementById("income-source").value,
        project_or_client: document.getElementById("income-project").value.trim(),
        comment: document.getElementById("income-comment").value.trim()
      });
      await refreshFrom(result);
      showToast("Доход добавлен. Рынок сказал да.");
    }
  } catch (error) {
    console.error(error);
    showToast("Не сохранилось. Проверь соединение и попробуй ещё раз.");
  }
}

async function boot() {
  renderLock();
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/me/sw.js")
      .then((registration) => registration.update())
      .catch(() => {});
  }
}

async function loadDashboard() {
  try {
    state.dashboard = await api("getDashboard");
    render();
  } catch (error) {
    console.error(error);
    state.dashboard = loadLocal();
    render();
    showToast("API недоступен. Включён демо-режим на этом устройстве.");
  }
}

boot();
