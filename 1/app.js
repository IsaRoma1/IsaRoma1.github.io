const STORAGE_KEY = "toOrganizmaMvp.v4";

const demoLabText = `Гемоглобин 148 г/л
Лейкоциты 6.1 10^9/л
Тромбоциты 248 10^9/л
СОЭ 8 мм/ч
Глюкоза 5.7 ммоль/л
Холестерин общий 6.2 ммоль/л
ЛПНП 4.1 ммоль/л
ЛПВП 1.2 ммоль/л
Триглицериды 1.9 ммоль/л
АЛТ 36 Ед/л
АСТ 28 Ед/л
ГГТ 42 Ед/л
Креатинин 92 мкмоль/л
Ферритин 34 нг/мл
Витамин D 21 нг/мл
B12 420 пг/мл
ТТГ 2.4 мЕд/л
Т4 свободный 14.8 пмоль/л
HbA1c 5.7 %
С-реактивный белок 2.4 мг/л`;

const goalOptions = [
  "понять анализы",
  "контролировать здоровье",
  "повысить энергию",
  "улучшить сон",
  "снизить вес",
  "проверить дефициты",
  "следить за сердцем и сосудами",
  "подготовиться к врачу",
  "собрать медицинские данные в одном месте"
];

const missionDefinitions = [
  {
    id: "passport",
    name: "Собрать базовый паспорт здоровья",
    days: 14,
    why: "Собрать основные данные, чтобы карта организма стала полезной, а не гадала на кофейной гуще.",
    systems: ["Паспорт здоровья", "Образ жизни"],
    final: "В финале будет готов первый отчёт для врача и список пробелов данных.",
    tasks: [
      "Заполнить базовый профиль",
      "Указать цели",
      "Указать жалобы",
      "Указать лекарства",
      "Указать БАДы",
      "Указать хронические состояния",
      "Указать семейный анамнез",
      "Добавить вес",
      "Добавить окружность талии",
      "Добавить давление за день",
      "Пройти check-in 3 дня подряд",
      "Добавить демо-анализ",
      "Проверить карту организма",
      "Сформировать первый отчёт для врача"
    ]
  },
  {
    id: "energy",
    name: "Энергия и дефициты",
    days: 14,
    why: "Связать усталость, сон, ферритин, витамин D, B12, магний и стресс.",
    systems: ["Витамины и дефициты", "Сон и восстановление"],
    final: "Понятный список показателей, которые стоит проверить в динамике.",
    tasks: ["Отмечать энергию 7 дней", "Добавить ферритин", "Добавить витамин D", "Добавить B12", "Записать вопросы врачу"]
  },
  {
    id: "metabolism",
    name: "Обмен веществ",
    days: 14,
    why: "Понять, хватает ли данных по глюкозе, HbA1c, весу, талии и активности.",
    systems: ["Обмен веществ", "Вес и композиция тела"],
    final: "План наблюдения за глюкозой, активностью и талией.",
    tasks: ["Добавить глюкозу", "Добавить HbA1c", "Добавить талию", "Прогулка после еды", "Проверить карту"]
  },
  {
    id: "heart",
    name: "Сердце и сосуды",
    days: 14,
    why: "Собрать давление, липиды, активность и семейный анамнез.",
    systems: ["Сердце и сосуды"],
    final: "Список данных, которые удобно показать врачу.",
    tasks: ["Давление 3 дня", "Загрузить липидограмму", "Указать семейный анамнез", "Отметить активность", "Сформировать вопросы врачу"]
  },
  {
    id: "sleep",
    name: "Сон и восстановление",
    days: 10,
    why: "Понять, как сон, стресс и вечерняя рутина влияют на индекс ресурса.",
    systems: ["Сон и восстановление", "Стресс и нервная система"],
    final: "Неделя наблюдений и безопасные привычки для обсуждения со специалистом при необходимости.",
    tasks: ["Отмечать сон", "Снизить кофеин вечером", "Лечь на 30 минут раньше", "Оценить стресс", "Сравнить индекс ресурса"]
  }
];

const biomarkerCatalog = [
  {name: "гемоглобин", label: "Гемоглобин", unit: "г/л", min: 130, max: 170, system: "Кровь и железо"},
  {name: "лейкоциты", label: "Лейкоциты", unit: "10^9/л", min: 4, max: 9, system: "Воспаление"},
  {name: "тромбоциты", label: "Тромбоциты", unit: "10^9/л", min: 150, max: 400, system: "Кровь и железо"},
  {name: "соэ", label: "СОЭ", unit: "мм/ч", min: 2, max: 15, system: "Воспаление"},
  {name: "глюкоза", label: "Глюкоза", unit: "ммоль/л", min: 3.9, max: 5.5, system: "Обмен веществ"},
  {name: "холестерин общий", label: "Холестерин общий", unit: "ммоль/л", min: null, max: 5.2, system: "Сердце и сосуды"},
  {name: "лпнп", label: "ЛПНП", unit: "ммоль/л", min: 0, max: 3.3, system: "Сердце и сосуды"},
  {name: "лпвп", label: "ЛПВП", unit: "ммоль/л", min: 1.0, max: 2.1, system: "Сердце и сосуды"},
  {name: "триглицериды", label: "Триглицериды", unit: "ммоль/л", min: null, max: 1.7, system: "Сердце и сосуды"},
  {name: "алт", label: "АЛТ", unit: "Ед/л", min: null, max: 41, system: "Печень"},
  {name: "аст", label: "АСТ", unit: "Ед/л", min: null, max: 40, system: "Печень"},
  {name: "ггт", label: "ГГТ", unit: "Ед/л", min: null, max: 60, system: "Печень"},
  {name: "креатинин", label: "Креатинин", unit: "мкмоль/л", min: 62, max: 106, system: "Почки"},
  {name: "ферритин", label: "Ферритин", unit: "нг/мл", min: 30, max: 400, system: "Витамины и дефициты"},
  {name: "витамин d", label: "Витамин D", unit: "нг/мл", min: 30, max: 100, system: "Витамины и дефициты"},
  {name: "b12", label: "B12", unit: "пг/мл", min: 200, max: 900, system: "Витамины и дефициты"},
  {name: "ттг", label: "ТТГ", unit: "мЕд/л", min: 0.4, max: 4, system: "Щитовидная железа"},
  {name: "т4 свободный", label: "Т4 свободный", unit: "пмоль/л", min: 9, max: 19, system: "Щитовидная железа"},
  {name: "hba1c", label: "HbA1c", unit: "%", min: 4, max: 5.6, system: "Обмен веществ"},
  {name: "с-реактивный белок", label: "С-реактивный белок", unit: "мг/л", min: null, max: 5, system: "Воспаление"}
];

const systemDefinitions = [
  ["Сердце и сосуды", ["Холестерин общий", "ЛПНП", "ЛПВП", "Триглицериды", "давление за 3 дня", "семейный анамнез"]],
  ["Обмен веществ", ["Глюкоза", "HbA1c", "талия", "вес", "активность"]],
  ["Печень", ["АЛТ", "АСТ", "ГГТ", "билирубин"]],
  ["Почки", ["Креатинин", "мочевина", "мочевая кислота"]],
  ["Щитовидная железа", ["ТТГ", "Т4 свободный", "Т3 свободный", "антитела к ТПО"]],
  ["Кровь и железо", ["Гемоглобин", "Лейкоциты", "Тромбоциты", "Ферритин", "железо"]],
  ["Витамины и дефициты", ["Витамин D", "B12", "фолиевая кислота", "магний", "цинк"]],
  ["Воспаление", ["С-реактивный белок", "СОЭ", "Лейкоциты"]],
  ["Сон и восстановление", ["сон 7 дней", "энергия", "вечерняя рутина"]],
  ["Стресс и нервная система", ["стресс 7 дней", "симптомы", "заметки дня"]],
  ["Вес и композиция тела", ["вес", "талия", "активность"]],
  ["Образ жизни", ["цели", "активность", "сон", "check-in"]]
];

function defaultState() {
  return {
    onboarded: false,
    profile: {
      name: "",
      age: "",
      sex: "",
      height: "",
      weight: "",
      country: "Россия",
      goals: [],
      complaints: "",
      chronic: "",
      medications: "",
      supplements: "",
      allergies: "",
      family: "",
      lifestyle: ""
    },
    checkins: [],
    biomarkers: [],
    missionTasks: {},
    maintenance: [],
    report: ""
  };
}

function loadState() {
  try {
    return {...defaultState(), ...(JSON.parse(localStorage.getItem(STORAGE_KEY)) || {})};
  } catch {
    return defaultState();
  }
}

function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

let state = loadState();

function todayISO(offset = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date.toISOString().slice(0, 10);
}

function formatDate(value) {
  return new Intl.DateTimeFormat("ru-RU", {day: "numeric", month: "short"}).format(new Date(value));
}

function latestCheckin() {
  return state.checkins[state.checkins.length - 1] || null;
}

function symptomScore(symptoms) {
  return symptoms === "none" ? 100 : symptoms === "mild" ? 70 : symptoms === "moderate" ? 40 : 15;
}

function scoreCheckin(c) {
  if (!c) return 0;
  return Math.round(c.sleep * 10 * 0.25 + c.energy * 10 * 0.25 + (11 - c.stress) * 10 * 0.2 + c.activity * 10 * 0.15 + symptomScore(c.symptoms) * 0.15);
}

function scoreStatus(score) {
  if (score < 40) return ["ресурс низкий", "red"];
  if (score < 60) return ["ресурс снижен", "orange"];
  if (score < 80) return ["рабочий режим", "yellow"];
  return ["хороший ресурс", "green"];
}

function factor(c) {
  if (!c) return "данных мало";
  const items = [
    ["сон", c.sleep],
    ["стресс", 11 - c.stress],
    ["активность", c.activity],
    ["симптомы", symptomScore(c.symptoms) / 10]
  ];
  return items.sort((a, b) => a[1] - b[1])[0][0];
}

function mainAction(c) {
  if (!c) return ["Пройдите check-in, чтобы получить действие дня.", "Действие будет связано с вашим ресурсом, активной миссией и пробелами данных."];
  if (c.symptoms === "moderate" || c.symptoms === "strong") {
    return ["Отметить симптомы и не перегружать день.", "Вы указали симптомы. Если состояние ухудшается, стоит обратиться к врачу."];
  }
  if (c.stress >= 8) return ["10 минут спокойной прогулки без телефона", `Вы отметили стресс ${c.stress}/10. Это снижает индекс ресурса и влияет на блок “Стресс и нервная система”.`];
  if (c.sleep <= 5) return ["Лечь сегодня на 30 минут раньше", `Вы отметили сон ${c.sleep}/10. Это снижает индекс ресурса и связано с миссией “Сон и восстановление”.`];
  if (c.activity <= 4) return ["20 минут ходьбы после еды", `Активность ${c.activity}/10. Это действие связано с миссией “Обмен веществ” и закрывает дневной план.`];
  return ["Сохранить режим: прогулка 20 минут и сон по плану.", "Ресурс хороший. Задача дня — не ломать работающий режим, а закрепить его."];
}

function whyScore(c) {
  if (c.symptoms === "moderate" || c.symptoms === "strong") {
    return `Вы отметили ${c.symptoms === "moderate" ? "умеренные" : "сильные"} симптомы. Сегодня не стоит перегружать день. Если состояние ухудшается, лучше обратиться к врачу.`;
  }
  if (c.sleep <= 5 && c.stress >= 8) {
    return `Сон ${c.sleep}/10 и стресс ${c.stress}/10 сильнее всего снизили ресурс. Сегодня не перегружайте день и сделайте спокойную ходьбу после еды.`;
  }
  if (c.sleep >= 8 && c.stress <= 5) {
    return `Сон ${c.sleep}/10 поддержал ресурс. Стресс умеренный, симптомов нет. Сегодня можно сохранить обычный режим активности.`;
  }
  return `Вы отметили сон ${c.sleep}/10, энергию ${c.energy}/10 и стресс ${c.stress}/10. Главный фактор снижения — ${factor(c)}. Следующий безопасный шаг выбран с учётом этих данных.`;
}

function secondaryActions() {
  const systems = systemData();
  const heart = systems.find((s) => s.name === "Сердце и сосуды");
  const metabolism = systems.find((s) => s.name === "Обмен веществ");
  return [
    heart?.missing.includes("давление за 3 дня") ? "Добавить давление утром и вечером: это закроет главный пробел блока сердца." : "Проверить вопросы врачу по липидам.",
    metabolism?.missing.includes("талия") ? "Добавить окружность талии: это уточнит блок обмена веществ." : "Открыть карту и проверить, какие системы обновились."
  ];
}

function weeklyInsight(week) {
  if (week.length < 3) return "Пока мало данных. Пройдите 3 check-in, чтобы увидеть закономерности, а не один случайный день.";
  const avg = Math.round(week.reduce((sum, item) => sum + item.score, 0) / week.length);
  const factors = week.map(factor);
  const top = factors.sort((a, b) => factors.filter((x) => x === b).length - factors.filter((x) => x === a).length)[0];
  return `Средний ресурс: ${avg}/100. Вы прошли ${week.length} check-in из 7. Главный фактор снижения — ${top}. Через 3–7 дней приложение начинает показывать закономерности.`;
}

function ensureMaintenance() {
  if (state.maintenance.length) return;
  state.maintenance = [
    {title: "Добавить давление за 3 дня", date: todayISO(0), type: "измерение", system: "Сердце и сосуды", why: "Без давления карта сердца неполная, особенно если в анализе есть сигналы по липидам.", status: "запланировано"},
    {title: "Добавить окружность талии", date: todayISO(1), type: "измерение", system: "Обмен веществ", why: "Талия помогает точнее связать глюкозу, HbA1c, вес и метаболический профиль.", status: "запланировано"},
    {title: "Сформировать вопросы врачу", date: todayISO(3), type: "отчёт", system: "Липиды и дефициты", why: "В демо-анализе есть сигналы внимания по ЛПНП и витамину D.", status: "запланировано"},
    {title: "Пройти 3 check-in подряд", date: todayISO(3), type: "наблюдение", system: "Сон и восстановление", why: "Без истории приложение видит только один день и не может показать закономерности.", status: "запланировано"}
  ];
  saveState(state);
}

function nav() {
  const active = document.querySelector(".bottom-nav")?.dataset.active;
  const items = [
    ["today", "/1/", "Сегодня", '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>'],
    ["map", "/1/map.html", "Карта", '<path d="M9 18l-6 3V6l6-3 6 3 6-3v15l-6 3-6-3z"/><path d="M9 3v15"/><path d="M15 6v15"/>'],
    ["labs", "/1/labs.html", "Анализы", '<path d="M9 3h6"/><path d="M10 3v6l-5 8a4 4 0 0 0 3.4 6h7.2a4 4 0 0 0 3.4-6l-5-8V3"/>'],
    ["missions", "/1/missions.html", "Миссии", '<path d="M19 14c1.5-1.5 2-4.5 0-6.5s-5-1.5-6.5 0L12 8l-.5-.5C10 6 7 5.5 5 7.5S3.5 12.5 5 14l7 7 7-7z"/>'],
    ["profile", "/1/profile.html", "Профиль", '<path d="M20 21a8 8 0 0 0-16 0"/><circle cx="12" cy="7" r="4"/>']
  ];
  document.querySelector(".bottom-nav").innerHTML = `<div class="bottom-nav-grid">${items
    .map(([id, href, label, icon]) => `<a class="${active === id ? "active" : ""}" href="${href}"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${icon}</svg>${label}</a>`)
    .join("")}</div>`;
}

function renderOnboarding() {
  const mount = document.getElementById("onboarding");
  if (!mount || state.onboarded) return;
  let step = 0;
  const draft = {...state.profile, goals: [...(state.profile.goals || [])]};
  const screens = [
    () => `<h2>Соберите карту здоровья и персональный ТО-план организма</h2><p class="lead">Загружайте анализы, отмечайте самочувствие, проходите профилактические миссии и смотрите динамику здоровья в одном месте.</p><button class="btn full" data-next>Начать</button>`,
    () => `<h2>Выберите 1–3 цели</h2><p class="lead">Цели влияют на миссии, действия дня и отчёт для врача.</p><div class="chips">${goalOptions.map((g) => `<button class="chip" data-goal="${g}">${g}</button>`).join("")}</div><button class="btn full" data-next>Продолжить</button>`,
    () => `<h2>Базовые данные</h2><div class="form-grid">${["name:Имя", "age:Возраст", "sex:Пол", "height:Рост", "weight:Вес", "country:Страна"].map((item) => { const [key, label] = item.split(":"); return `<label>${label}<input data-field="${key}" value="${draft[key] || ""}"></label>`; }).join("")}</div><button class="btn full" data-next>Продолжить</button>`,
    () => `<h2>Самочувствие</h2><div class="form-grid"><label>Энергия<input data-field="energy" type="range" min="1" max="10" value="7"></label><label>Сон<input data-field="sleep" type="range" min="1" max="10" value="7"></label><label>Стресс<input data-field="stress" type="range" min="1" max="10" value="5"></label><label>Активность<input data-field="activity" type="range" min="1" max="10" value="5"></label><label>Жалобы<textarea data-field="complaints" rows="3"></textarea></label></div><button class="btn full" data-next>Продолжить</button>`,
    () => `<h2>Медицинский контекст</h2><div class="form-grid">${["chronic:Хронические состояния", "medications:Лекарства", "supplements:БАДы", "allergies:Аллергии", "family:Семейный анамнез"].map((item) => { const [key, label] = item.split(":"); return `<label>${label}<textarea data-field="${key}" rows="2">${draft[key] || ""}</textarea></label>`; }).join("")}</div><button class="btn full" data-finish>Сохранить и открыть сегодня</button>`
  ];
  function draw() {
    mount.classList.remove("hidden");
    mount.innerHTML = `<div class="onboarding-card">${screens[step]()}<p class="muted" style="margin-top:12px">Шаг ${step + 1} из ${screens.length}. Приложение не ставит диагнозы и не заменяет врача.</p></div>`;
    mount.querySelectorAll("[data-goal]").forEach((button) => {
      button.classList.toggle("badge", draft.goals.includes(button.dataset.goal));
      button.onclick = () => {
        const goal = button.dataset.goal;
        if (draft.goals.includes(goal)) draft.goals = draft.goals.filter((g) => g !== goal);
        else if (draft.goals.length < 3) draft.goals.push(goal);
        draw();
      };
    });
    mount.querySelectorAll("[data-next]").forEach((button) => (button.onclick = () => { collect(); step += 1; draw(); }));
    mount.querySelectorAll("[data-finish]").forEach((button) => (button.onclick = () => { collect(); finish(); }));
  }
  function collect() {
    mount.querySelectorAll("[data-field]").forEach((field) => (draft[field.dataset.field] = field.value));
  }
  function finish() {
    state.profile = {...state.profile, ...draft};
    state.onboarded = true;
    const c = {date: todayISO(), sleep: Number(draft.sleep || 7), energy: Number(draft.energy || 7), stress: Number(draft.stress || 5), activity: Number(draft.activity || 5), symptoms: "none", note: draft.complaints || ""};
    c.score = scoreCheckin(c);
    state.checkins = [c];
    ensureMaintenance();
    saveState(state);
    mount.classList.add("hidden");
    location.href = "/1/";
  }
  draw();
}

function passportScore() {
  const p = state.profile;
  const hasBasics = p.name && p.age && p.sex && p.height && p.weight;
  const checks3 = new Set(state.checkins.map((c) => c.date)).size >= 3;
  const parts = [
    [15, hasBasics],
    [10, p.goals?.length],
    [10, p.complaints],
    [10, p.medications],
    [5, p.supplements],
    [10, p.chronic],
    [10, p.family],
    [20, state.biomarkers.length],
    [10, checks3]
  ];
  return parts.reduce((sum, [weight, ok]) => sum + (ok ? weight : 0), 0);
}

function missingPassport() {
  const p = state.profile;
  const missing = [];
  if (!p.complaints) missing.push("жалоб");
  if (!p.family) missing.push("семейного анамнеза");
  if (!state.biomarkers.length) missing.push("первого анализа");
  if (new Set(state.checkins.map((c) => c.date)).size < 3) missing.push("check-in за 3 дня");
  return missing.slice(0, 3);
}

function systemData() {
  const labels = state.biomarkers.map((b) => b.label);
  const p = state.profile;
  const latest = latestCheckin();
  return systemDefinitions.map(([name, required]) => {
    const present = required.filter((item) => labels.includes(item) || (item === "вес" && p.weight) || (item === "талия" && p.waist) || (item === "семейный анамнез" && p.family) || (item === "цели" && p.goals?.length) || (item === "check-in" && latest) || (item.includes("сон") && state.checkins.length) || (item.includes("стресс") && state.checkins.length) || (item === "активность" && latest));
    const missing = required.filter((item) => !present.includes(item));
    const related = state.biomarkers.filter((b) => b.system === name);
    const abnormal = related.filter((b) => ["выше", "ниже", "погранично"].includes(b.status));
    const completion = Math.round((present.length / required.length) * 100);
    let tone = completion < 30 ? "gray" : "green";
    if (missing.length) tone = "yellow";
    if (abnormal.length >= 2) tone = "orange";
    if (abnormal.some((b) => b.status === "выше" && Number(b.value) > Number(b.max || 9999) * 1.5)) tone = "red";
    const next = missing[0] ? `Добавьте: ${missing.slice(0, 2).join(", ")}.` : abnormal.length ? `Обсудите ${abnormal[0].label} со специалистом и посмотрите динамику.` : "Поддерживайте наблюдение в динамике.";
    return {name, required, present, missing, related, abnormal, completion, tone, next};
  });
}

function renderToday() {
  if (document.body.dataset.page !== "today") return;
  const c = latestCheckin();
  const score = scoreCheckin(c);
  const [status, tone] = scoreStatus(score);
  const p = state.profile;
  document.getElementById("today-date").textContent = new Intl.DateTimeFormat("ru-RU", {weekday: "long", day: "numeric", month: "long"}).format(new Date());
  document.getElementById("today-title").textContent = c ? `${p.name || "Вы"}, сегодня ${status}: главный фактор — ${factor(c)}` : "Данных пока мало. Пройдите check-in";
  document.getElementById("today-lead").textContent = c ? `Сон ${c.sleep}/10, энергия ${c.energy}/10, стресс ${c.stress}/10, активность ${c.activity}/10. Следующий шаг ниже выбран по этим данным.` : "Один check-in занимает меньше минуты и помогает понять ресурс дня.";
  document.getElementById("score-value").textContent = score;
  document.getElementById("score-arc").setAttribute("stroke-dashoffset", String(301.6 - (score / 100) * 301.6));
  document.getElementById("score-status").textContent = status;
  document.getElementById("score-dot").style.background = `var(--${tone})`;
  document.getElementById("score-explain").textContent = c ? whyScore(c) : "Пока данных мало. Приложение не будет делать вид, что всё знает: сохраните первый check-in.";
  const [action, note] = mainAction(c);
  document.getElementById("main-action").textContent = action;
  document.getElementById("main-action-note").textContent = note;
  document.getElementById("action-reason").textContent = c ? `Почему: главный фактор сегодня — ${factor(c)}.` : "Почему: пока данных мало.";
  document.getElementById("secondary-actions").innerHTML = secondaryActions().map((x) => `<div class="mini-item">${x}</div>`).join("");
  const missionProgress = missionPercent("passport");
  document.getElementById("mission-progress-label").textContent = `${missionProgress}%`;
  document.getElementById("mission-progress-bar").style.width = `${missionProgress}%`;
  document.getElementById("active-mission-copy").textContent = `Сейчас карта видит только часть данных. Паспорт заполнен на ${passportScore()}%. Следующий вклад в точность: ${missingPassport().join(", ") || "поддерживать динамику"}.`;
  ensureMaintenance();
  const next = state.maintenance.find((e) => e.status === "запланировано") || state.maintenance[0];
  document.getElementById("next-maintenance-copy").textContent = `${next.title}: ${next.why}`;
  document.getElementById("next-maintenance-date").textContent = formatDate(next.date);
  const week = state.checkins.slice(-7);
  const avg = week.length ? Math.round(week.reduce((sum, item) => sum + item.score, 0) / week.length) : 0;
  const best = week.length ? week.reduce((a, b) => (a.score > b.score ? a : b)) : null;
  document.getElementById("weekly-stats").innerHTML = [
    [`${avg}`, "средний индекс"],
    [`${week.length}/7`, "check-in пройдено"],
    [best ? formatDate(best.date) : "—", "лучший день"],
    [week.length ? factor(week[week.length - 1]) : "—", "частый фактор"]
  ].map(([a, b]) => `<div class="stat"><strong>${a}</strong><span>${b}</span></div>`).join("");
  document.getElementById("sparkline").innerHTML = (week.length ? week : [{score: 5}]).map((item) => `<i style="height:${Math.max(8, item.score * 0.52)}px"></i>`).join("");
  const weeklyCard = document.getElementById("sparkline").closest(".card");
  if (!week.length) weeklyCard.querySelector("h2").nextElementSibling?.remove?.();
  if (week.length && !weeklyCard.querySelector(".weekly-insight")) {
    weeklyCard.insertAdjacentHTML("beforeend", `<p class="muted weekly-insight" style="margin-top:12px">${weeklyInsight(week)}</p>`);
  } else if (week.length) {
    weeklyCard.querySelector(".weekly-insight").textContent = weeklyInsight(week);
  }
  const form = document.getElementById("checkin-form");
  form.onsubmit = (event) => {
    event.preventDefault();
    const nextCheckin = {
      date: todayISO(),
      sleep: Number(document.getElementById("sleep").value),
      energy: Number(document.getElementById("energy").value),
      stress: Number(document.getElementById("stress").value),
      activity: Number(document.getElementById("activity").value),
      symptoms: document.getElementById("symptoms").value,
      note: document.getElementById("day-note").value
    };
    nextCheckin.score = scoreCheckin(nextCheckin);
    state.checkins = state.checkins.filter((item) => item.date !== nextCheckin.date).concat(nextCheckin);
    ensureMaintenance();
    saveState(state);
    document.getElementById("checkin-message").textContent = c ? `Check-in сохранён. Индекс ресурса обновлён: ${score} → ${nextCheckin.score}. Главный фактор сегодня — ${factor(nextCheckin)}.` : "Check-in сохранён. Теперь приложение может точнее подобрать действие дня.";
    document.getElementById("checkin-message").classList.remove("hidden");
    document.getElementById("checkin-state").textContent = "сохранён";
    renderToday();
  };
}

function renderMap() {
  if (document.body.dataset.page !== "map") return;
  const systems = systemData();
  const need = systems.filter((s) => s.tone !== "green").slice(0, 3);
  const updated = systems.filter((s) => s.present.length).length;
  const attention = systems.filter((s) => ["orange", "red"].includes(s.tone)).length;
  const lowData = systems.filter((s) => s.tone === "gray").length;
  document.getElementById("map-title").textContent = state.biomarkers.length ? `Обновлено ${updated} систем` : "Добавьте анализ, чтобы карта ожила";
  document.getElementById("map-lead").textContent = state.biomarkers.length
    ? `На основе профиля, check-in и демо-анализа: ${attention} системы требуют внимания, ${lowData} — данных пока недостаточно.`
    : "Без анализов карта видит только профиль и самочувствие. Добавьте демо-анализ, чтобы увидеть полный сценарий.";
  document.getElementById("map-summary").textContent = need.length ? `${need.length} системы требуют действий: ${need.map((s) => s.name.toLowerCase()).join(", ")}. Начните с: ${need[0].next}` : "По доступным данным карта закрыта лучше обычного. Продолжайте check-in и обновляйте анализы в динамике.";
  document.getElementById("map-priority-chips").innerHTML = need.map((s) => `<span class="chip">${s.next}</span>`).join("");
  document.getElementById("systems-list").innerHTML = systems.map((s) => `<article class="card system-card">
    <div class="card-head"><div><h2>${s.name}</h2><p class="muted">${summaryForSystem(s)}</p></div><span class="badge ${s.tone}">${statusText(s.tone)}</span></div>
    <div class="progress"><i style="width:${s.completion}%"></i></div>
    <div class="kv"><span>Данные</span><strong>${s.completion}%</strong></div>
    <div class="system-detail"><div class="kv"><span>Есть</span><strong>${s.present.join(", ") || "пока нет"}</strong></div><div class="kv"><span>Не хватает</span><strong>${s.missing.join(", ") || "нет ключевых пробелов"}</strong></div><div class="kv"><span>Показатели</span><strong>${s.related.map((b) => `${b.label} ${b.value}`).join(", ") || "нет"}</strong></div><p class="muted">${s.next}</p></div>
    <button class="btn secondary full" type="button">Подробнее</button>
  </article>`).join("");
  document.querySelectorAll(".system-card").forEach((card) => card.onclick = () => card.classList.toggle("open"));
}

function summaryForSystem(s) {
  if (s.name === "Сердце и сосуды" && s.related.length) {
    return "В демо-анализе ЛПНП выше референса, общий холестерин повышен. Давление пока не добавлено, поэтому оценка неполная.";
  }
  if (s.name === "Обмен веществ" && s.related.length) {
    return "Глюкоза и HbA1c находятся рядом с верхней границей. Это не диагноз, но повод связать показатели с питанием, активностью, весом и талией.";
  }
  if (s.name === "Витамины и дефициты" && s.related.length) {
    return "Витамин D ниже референса, ферритин в нижней части диапазона. Эти данные стоит обсудить со специалистом и оценивать вместе с симптомами.";
  }
  if (s.name === "Сон и восстановление" && state.checkins.length) {
    return "За последние check-in сон влияет на индекс ресурса. Следующий шаг — лечь на 30 минут раньше и отметить качество сна завтра утром.";
  }
  if (!s.present.length) return `Данных недостаточно. Следующий шаг: ${s.next}`;
  if (s.abnormal.length) return `Есть ${s.present.join(", ")}. Требуют внимания: ${s.abnormal.map((b) => b.label).join(", ")}.`;
  if (s.missing.length) return `Есть ${s.present.join(", ")}. Не хватает: ${s.missing.slice(0, 3).join(", ")}.`;
  return "По доступным данным всё спокойно, но результат стоит смотреть в динамике.";
}

function statusText(tone) {
  return {gray: "Данных мало", green: "По доступным данным спокойно", yellow: "Есть пробелы", orange: "Есть сигналы внимания", red: "Не откладывать консультацию"}[tone] || "статус";
}

function parseBiomarkers(text) {
  return biomarkerCatalog.map((item) => {
    const rx = new RegExp(`${item.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\D+(\\d+[,.]?\\d*)`, "i");
    const match = text.match(rx);
    if (!match) return null;
    const value = Number(match[1].replace(",", "."));
    let status = "норма";
    if (item.min != null && value < item.min) status = "ниже";
    if (item.max != null && value > item.max) status = value <= item.max * 1.15 ? "погранично" : "выше";
    if (item.label === "Ферритин" && value >= 30 && value <= 45) status = "низкая часть референса";
    return {...item, id: crypto.randomUUID ? crypto.randomUUID() : `${item.name}-${Date.now()}`, value, status, ref: `${item.min ?? "—"}–${item.max ?? "—"}`};
  }).filter(Boolean);
}

function renderLabs() {
  if (document.body.dataset.page !== "labs") return;
  let parsed = [...state.biomarkers];
  const table = document.getElementById("biomarker-table");
  const draw = () => {
    document.getElementById("labs-count").textContent = `${parsed.length} показателей`;
    table.innerHTML = parsed.length ? parsed.map((b, index) => `<div class="table-row">
      <div class="table-fields"><input data-i="${index}" data-k="label" value="${b.label}"><input data-i="${index}" data-k="value" value="${b.value}"><input data-i="${index}" data-k="unit" value="${b.unit}"></div>
      <div class="kv"><span>Референс</span><strong>${b.ref}</strong></div><div class="kv"><span>Статус</span><strong>${b.status}</strong></div><div class="kv"><span>Система</span><strong>${b.system}</strong></div>
    </div>`).join("") : "Пока нет показателей. Вставьте демо-анализ или текст лаборатории.";
    table.querySelectorAll("input").forEach((input) => input.oninput = () => { parsed[input.dataset.i][input.dataset.k] = input.value; });
  };
  document.getElementById("insert-demo-lab").onclick = () => {
    document.getElementById("lab-text").value = demoLabText;
    parsed = parseBiomarkers(demoLabText);
    draw();
    document.getElementById("labs-message").textContent = "Демо-анализ добавлен в таблицу. Сохраните показатели, чтобы обновить карту организма.";
    document.getElementById("labs-message").classList.remove("hidden");
  };
  document.getElementById("parse-lab").onclick = () => { parsed = parseBiomarkers(document.getElementById("lab-text").value || demoLabText); draw(); };
  document.getElementById("manual-marker").onclick = () => {
    parsed.push({id: `${Date.now()}`, label: "Новый показатель", value: "", unit: "", ref: "—", status: "проверить вручную", system: "Данные вручную"});
    draw();
  };
  document.getElementById("save-biomarkers").onclick = () => {
    state.biomarkers = parsed;
    ensureMaintenance();
    if (!state.maintenance.find((e) => e.title === "Повторно проверить витамин D")) {
      state.maintenance.push({title: "Повторно проверить витамин D", date: todayISO(60), type: "анализ", system: "Витамины и дефициты", why: "Витамин D ниже референса. Это не диагноз, показатель стоит обсудить со специалистом и смотреть в динамике.", status: "запланировано"});
    }
    saveState(state);
    document.getElementById("labs-message").textContent = `Карта организма обновлена: ${[...new Set(state.biomarkers.map((b) => b.system))].length} систем получили новые данные.`;
    document.getElementById("labs-message").classList.remove("hidden");
    renderAnalysis();
  };
  draw();
  renderAnalysis();
}

function renderAnalysis() {
  const el = document.getElementById("lab-analysis");
  if (!el) return;
  const abnormal = state.biomarkers.filter((b) => b.status !== "норма");
  const normal = state.biomarkers.filter((b) => b.status === "норма");
  const systems = [...new Set(state.biomarkers.map((b) => b.system))];
  el.innerHTML = state.biomarkers.length ? `
    <div><strong>Разбор демо-анализа.</strong> По демо-анализу обновлены ${systems.length} систем организма. Большинство базовых показателей крови, печени, почек и щитовидной железы находятся в пределах референсов лаборатории. Основные зоны внимания: липидный профиль, углеводный обмен и витамин D.</div>
    <div><strong>Что спокойно.</strong> Общий анализ крови без заметных отклонений по демо-данным. АЛТ, АСТ, ГГТ, креатинин, ТТГ и свободный Т4 находятся в пределах референсов.</div>
    <div><strong>Что требует внимания.</strong> ${abnormal.map((b) => `${b.label}: ${b.value} ${b.unit} (${b.status})`).join("; ") || "выраженных отклонений по введённым данным нет"}.</div>
    <div><strong>Следующие безопасные шаги.</strong> Добавить давление утром и вечером в течение 3 дней. Добавить окружность талии. Пройти миссию “Обмен веществ”. Сформировать вопросы врачу по липидам, витамину D и ферритину.</div>
    <div><strong>Вопросы врачу.</strong> Нужно ли дополнительно оценить сердечно-сосудистый риск с учётом ЛПНП? Нужны ли инсулин и HOMA-IR на фоне глюкозы и HbA1c? Как корректно оценить витамин D и ферритин?</div>
    <div class="muted">Приложение не ставит диагноз и не заменяет врача. Выводы носят информационный и профилактический характер.</div>
    <a class="btn full" href="/1/profile.html#report">Сформировать отчёт для врача</a>
  ` : "После сохранения появится разбор: что в норме, что требует внимания, какие системы обновились и что спросить у врача.";
}

function missionPercent(id) {
  const mission = missionDefinitions.find((m) => m.id === id) || missionDefinitions[0];
  const done = state.missionTasks[id] || {};
  const auto = id === "passport" ? autoPassportTasks() : {};
  const count = mission.tasks.filter((_, i) => done[i] || auto[i]).length;
  return Math.round((count / mission.tasks.length) * 100);
}

function autoPassportTasks() {
  const p = state.profile;
  return {
    0: p.name && p.age && p.sex && p.height && p.weight,
    1: p.goals?.length,
    2: p.complaints,
    3: p.medications,
    4: p.supplements,
    5: p.chronic,
    6: p.family,
    7: p.weight,
    10: new Set(state.checkins.map((c) => c.date)).size >= 3,
    11: state.biomarkers.length,
    12: state.biomarkers.length
  };
}

function renderMissions() {
  if (document.body.dataset.page !== "missions") return;
  document.getElementById("mission-page-progress").style.width = `${missionPercent("passport")}%`;
  document.getElementById("missions-list").innerHTML = missionDefinitions.map((m) => {
    const percent = missionPercent(m.id);
    const done = state.missionTasks[m.id] || {};
    const auto = m.id === "passport" ? autoPassportTasks() : {};
    return `<article class="card"><div class="card-head"><div><h2>${m.name}</h2><p class="muted">${m.why}</p></div><strong>${percent}%</strong></div><div class="progress"><i style="width:${percent}%"></i></div><div class="chips">${m.systems.map((s) => `<span class="chip">${s}</span>`).join("")}</div><div class="stack" style="margin-top:12px">${m.tasks.map((task, i) => `<label class="task"><input type="checkbox" data-m="${m.id}" data-i="${i}" ${done[i] || auto[i] ? "checked" : ""}><span><strong>${task}</strong><br><span class="muted">${taskReason(task)}</span></span></label>`).join("")}</div><p class="muted" style="margin-top:12px">${m.final}</p></article>`;
  }).join("");
  document.querySelectorAll("[data-m]").forEach((box) => box.onchange = () => {
    state.missionTasks[box.dataset.m] ||= {};
    state.missionTasks[box.dataset.m][box.dataset.i] = box.checked;
    const before = missionPercent(box.dataset.m);
    saveState(state);
    const after = missionPercent(box.dataset.m);
    if (after !== before) document.getElementById("mission-headline").textContent = `Прогресс миссии обновлён: ${before}% → ${after}%. Выполненное задание делает карту точнее.`;
    renderMissions();
  });
}

function taskReason(task) {
  if (task.includes("давление")) return "Закрывает главный пробел в блоке “Сердце и сосуды”.";
  if (task.includes("демо-анализ") || task.includes("липидограмму")) return "Даёт карте реальные показатели вместо догадок.";
  if (task.includes("check-in") || task.includes("сон") || task.includes("стресс")) return "Создаёт динамику, чтобы видеть закономерности, а не один день.";
  if (task.includes("тал")) return "Уточняет блок “Обмен веществ” и связь с глюкозой.";
  if (task.includes("врач")) return "Готовит структурированные вопросы для консультации.";
  return "Добавляет данные, которые повышают точность карты организма.";
}

function renderProfile() {
  if (document.body.dataset.page !== "profile") return;
  const p = state.profile;
  const score = passportScore();
  document.getElementById("profile-title").textContent = `${p.name || "Паспорт здоровья"}`;
  document.getElementById("profile-lead").textContent = `Паспорт заполнен на ${score}%. Больше всего не хватает: ${missingPassport().join(", ") || "регулярной динамики"}.`;
  document.getElementById("passport-score").textContent = `${score}%`;
  document.getElementById("passport-progress").style.width = `${score}%`;
  document.getElementById("passport-summary").textContent = `Больше всего не хватает: ${missingPassport().join(", ") || "данных по динамике"}. Это влияет на карту и отчёт для врача.`;
  const fields = [["name", "Имя"], ["age", "Возраст"], ["sex", "Пол"], ["height", "Рост"], ["weight", "Вес"], ["waist", "Талия"], ["country", "Страна"], ["complaints", "Жалобы"], ["chronic", "Хронические состояния"], ["medications", "Лекарства"], ["supplements", "БАДы"], ["allergies", "Аллергии"], ["family", "Семейный анамнез"], ["lifestyle", "Образ жизни"]];
  document.getElementById("profile-form").innerHTML = `${fields.map(([key, label]) => key.length > 7 ? `<label>${label}<textarea data-profile="${key}" rows="2">${p[key] || ""}</textarea></label>` : `<label>${label}<input data-profile="${key}" value="${p[key] || ""}"></label>`).join("")}<label>Цели<input data-profile="goals" value="${(p.goals || []).join(", ")}"></label><button class="btn full" type="submit">Сохранить профиль</button>`;
  document.getElementById("profile-blocks").innerHTML = profileBlocks().map((block) => `<article class="card"><div class="card-head"><div><h2>${block.title}</h2><p class="muted">${block.text}</p></div><span class="badge ${block.done ? "green" : "yellow"}">${block.done ? "заполнено" : "не заполнено"}</span></div><button class="btn secondary full" type="button" onclick="document.getElementById('profile-form').scrollIntoView({behavior:'smooth'})">Редактировать</button></article>`).join("");
  document.getElementById("profile-form").onsubmit = (event) => {
    event.preventDefault();
    document.querySelectorAll("[data-profile]").forEach((input) => {
      state.profile[input.dataset.profile] = input.dataset.profile === "goals" ? input.value.split(",").map((x) => x.trim()).filter(Boolean) : input.value;
    });
    saveState(state);
    renderProfile();
  };
  ensureMaintenance();
  document.getElementById("maintenance-list").innerHTML = state.maintenance.map((e, i) => `<div class="event"><div class="card-head"><strong>${e.title}</strong><span class="pill">${e.status}</span></div><p class="muted">${formatDate(e.date)} · ${e.type} · ${e.system}</p><p class="muted">${e.why}</p><button class="btn secondary full" data-event="${i}" type="button">Отметить выполненным</button></div>`).join("");
  document.querySelectorAll("[data-event]").forEach((button) => button.onclick = () => { state.maintenance[button.dataset.event].status = "выполнено"; saveState(state); renderProfile(); });
  document.getElementById("build-report").onclick = () => { document.getElementById("doctor-report").value = buildReport(); state.report = document.getElementById("doctor-report").value; saveState(state); alert("Отчёт готов. Его можно скопировать и показать врачу."); };
  document.getElementById("copy-report").onclick = () => navigator.clipboard?.writeText(document.getElementById("doctor-report").value || buildReport());
  document.getElementById("mark-report-ready").onclick = () => {
    state.missionTasks.passport ||= {};
    state.missionTasks.passport[13] = true;
    saveState(state);
    alert(`Отчёт отмечен как подготовленный. Прогресс миссии: ${missionPercent("passport")}%.`);
  };
  document.getElementById("save-text-report").onclick = () => {
    const blob = new Blob([document.getElementById("doctor-report").value || buildReport()], {type: "text/plain"});
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "to-organizma-report.txt";
    link.click();
  };
  document.getElementById("demo-profile").onclick = () => { fillDemoProfile(); renderProfile(); };
  document.getElementById("demo-lab-profile").onclick = () => {
    state.biomarkers = parseBiomarkers(demoLabText);
    ensureMaintenance();
    saveState(state);
    renderProfile();
  };
  document.getElementById("demo-checkins").onclick = () => { addDemoCheckins(); renderProfile(); };
  document.getElementById("reset-demo").onclick = () => { localStorage.removeItem(STORAGE_KEY); location.href = "/1/"; };
  document.getElementById("doctor-report").value = state.report || "";
}

function buildReport() {
  const p = state.profile;
  const abnormal = state.biomarkers.filter((b) => b.status !== "норма");
  const week = state.checkins.slice(-7);
  const avg = week.length ? Math.round(week.reduce((sum, c) => sum + c.score, 0) / week.length) : 0;
  return `Отчёт для врача

1. Профиль пользователя
Имя: ${p.name || "не указано"}
Возраст: ${p.age || "не указан"}, пол: ${p.sex || "не указан"}, рост: ${p.height || "—"}, вес: ${p.weight || "—"}

2. Цели
${(p.goals || []).join(", ") || "не указаны"}

3. Жалобы
${p.complaints || "не указаны"}

4. Лекарства
${p.medications || "не указаны"}

5. БАДы
${p.supplements || "не указаны"}

6. Загруженные анализы
Сохранено показателей: ${state.biomarkers.length}

7. Показатели вне референса
${abnormal.map((b) => `${b.label}: ${b.value} ${b.unit}, статус: ${b.status}, система: ${b.system}`).join("\n") || "по введённым данным выраженных отклонений нет"}

8. Динамика check-in
За 7 дней check-in: ${week.length}, средний индекс ресурса: ${avg}/100. Частый фактор снижения: ${week.length ? factor(week[week.length - 1]) : "данных мало"}.

9. Вопросы врачу
- Какие показатели стоит пересдать в динамике?
- Какие пробелы данных закрыть в первую очередь?
- Нужно ли дополнить обследования по системам с жёлтым или оранжевым статусом?

10. Что пользователь хочет обсудить
${missingPassport().length ? `Не хватает: ${missingPassport().join(", ")}.` : "Основные данные собраны, нужен разбор динамики."}

Важно: приложение не ставит диагнозы, не назначает лечение и не заменяет консультацию врача.`;
}

function fillDemoProfile() {
  state.profile = {...state.profile, name: "Роман", age: "38", sex: "мужской", height: "180", weight: "82", waist: "", country: "Россия", goals: ["понять анализы", "повысить энергию", "контролировать здоровье"], complaints: "", chronic: "", medications: "", supplements: "", allergies: "", family: "", lifestyle: "Сидячая работа, 2–3 прогулки в неделю"};
  state.onboarded = true;
  ensureMaintenance();
  saveState(state);
}

function profileBlocks() {
  const p = state.profile;
  return [
    {title: "Личные данные", done: p.name && p.age && p.sex && p.height && p.weight, text: "Нужны для возраста, веса, динамики и корректной структуры отчёта."},
    {title: "Цели", done: p.goals?.length, text: "Цели влияют на миссии и порядок следующих шагов."},
    {title: "Жалобы", done: p.complaints, text: "Без жалоб приложение не связывает анализы с самочувствием."},
    {title: "Лекарства", done: p.medications, text: "Важно для безопасного отчёта врачу. Приложение не отменяет препараты."},
    {title: "БАДы", done: p.supplements, text: "Данные важны для блока дефицитов и вопросов по витамину D."},
    {title: "Хронические состояния", done: p.chronic, text: "Помогают понять, какие показатели смотреть внимательнее."},
    {title: "Аллергии", done: p.allergies, text: "Нужны для аккуратного медицинского контекста."},
    {title: "Семейный анамнез", done: p.family, text: "Важен для блока “Сердце и сосуды” и профилактического ТО."},
    {title: "Образ жизни", done: p.lifestyle, text: "Связывает индекс ресурса с активностью, сном и нагрузкой."},
    {title: "Документы и анализы", done: state.biomarkers.length, text: state.biomarkers.length ? `Сохранено показателей: ${state.biomarkers.length}.` : "Без анализов карта видит только профиль и самочувствие."}
  ];
}

function addDemoCheckins() {
  state.checkins = [-6, -5, -4, -3, -2, -1, 0].map((offset, i) => {
    const c = {date: todayISO(offset), sleep: [6, 7, 5, 7, 8, 6, 7][i], energy: [6, 7, 5, 6, 8, 6, 7][i], stress: [7, 5, 8, 6, 4, 7, 5][i], activity: [4, 6, 3, 5, 7, 4, 6][i], symptoms: i === 2 ? "mild" : "none", note: ""};
    c.score = scoreCheckin(c);
    return c;
  });
  saveState(state);
}

function init() {
  nav();
  if (!state.onboarded) renderOnboarding();
  ensureMaintenance();
  renderToday();
  renderMap();
  renderLabs();
  renderMissions();
  renderProfile();
  if ("serviceWorker" in navigator) navigator.serviceWorker.getRegistrations().then((rs) => rs.forEach((r) => r.unregister())).catch(() => undefined);
  if ("caches" in window) caches.keys().then((keys) => keys.filter((k) => k.startsWith("to-organizma")).forEach((k) => caches.delete(k))).catch(() => undefined);
}

init();
