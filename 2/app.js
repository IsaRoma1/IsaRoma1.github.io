const STORAGE_KEY = "toOrganizmaNavigator.v2";

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

const symptoms = [
  "усталость",
  "головная боль",
  "головокружение",
  "тревожность",
  "боль в груди",
  "одышка",
  "кашель",
  "боль в животе",
  "вздутие",
  "изжога",
  "онемение",
  "слабость",
  "нарушение сна",
  "нарушение речи",
  "нарушение зрения",
  "судороги",
  "потеря сознания",
  "другое"
];

const respiratoryRedFlags = ["одышка в покое", "боль в груди", "кровохарканье", "посинение губ", "резкое ухудшение дыхания", "высокая температура и одышка", "кашель больше 3 недель"];
const neuroRedFlags = ["нарушение речи", "нарушение зрения", "потеря сознания", "судороги", "сильная внезапная головная боль", "онемение половины тела", "резкое нарушение координации", "спутанность сознания"];

const goalOptions = ["понять анализы", "контролировать здоровье", "повысить энергию", "улучшить сон", "проверить дефициты", "следить за сердцем и сосудами", "подготовиться к врачу"];

const biomarkers = [
  {key: "гемоглобин", label: "Гемоглобин", unit: "г/л", min: 130, max: 170, system: "Воспаление и иммунный фон"},
  {key: "лейкоциты", label: "Лейкоциты", unit: "10^9/л", min: 4, max: 9, system: "Воспаление и иммунный фон"},
  {key: "тромбоциты", label: "Тромбоциты", unit: "10^9/л", min: 150, max: 400, system: "Воспаление и иммунный фон"},
  {key: "соэ", label: "СОЭ", unit: "мм/ч", min: 2, max: 15, system: "Воспаление и иммунный фон"},
  {key: "глюкоза", label: "Глюкоза", unit: "ммоль/л", min: 3.9, max: 5.5, system: "Обмен веществ"},
  {key: "hba1c", label: "HbA1c", unit: "%", min: 4, max: 5.6, system: "Обмен веществ"},
  {key: "холестерин общий", label: "Холестерин общий", unit: "ммоль/л", min: 3, max: 5.2, system: "Сердце и сосуды"},
  {key: "лпнп", label: "ЛПНП", unit: "ммоль/л", min: 0, max: 3.3, system: "Сердце и сосуды"},
  {key: "лпвп", label: "ЛПВП", unit: "ммоль/л", min: 1, max: 2.1, system: "Сердце и сосуды"},
  {key: "триглицериды", label: "Триглицериды", unit: "ммоль/л", min: 0, max: 1.7, system: "Сердце и сосуды"},
  {key: "алт", label: "АЛТ", unit: "Ед/л", min: 0, max: 41, system: "Печень и ЖКТ"},
  {key: "аст", label: "АСТ", unit: "Ед/л", min: 0, max: 40, system: "Печень и ЖКТ"},
  {key: "ггт", label: "ГГТ", unit: "Ед/л", min: 0, max: 60, system: "Печень и ЖКТ"},
  {key: "креатинин", label: "Креатинин", unit: "мкмоль/л", min: 62, max: 106, system: "Почки и водный баланс"},
  {key: "ферритин", label: "Ферритин", unit: "нг/мл", min: 30, max: 400, system: "Витамины и дефициты"},
  {key: "витамин d", label: "Витамин D", unit: "нг/мл", min: 30, max: 100, system: "Витамины и дефициты"},
  {key: "b12", label: "B12", unit: "пг/мл", min: 200, max: 900, system: "Витамины и дефициты"},
  {key: "ттг", label: "ТТГ", unit: "мЕд/л", min: 0.4, max: 4, system: "Нервная система"},
  {key: "т4 свободный", label: "Т4 свободный", unit: "пмоль/л", min: 9, max: 19, system: "Нервная система"},
  {key: "с-реактивный белок", label: "С-реактивный белок", unit: "мг/л", min: 0, max: 5, system: "Воспаление и иммунный фон"}
];

const systems = [
  {name: "Сердце и сосуды", required: ["Холестерин общий", "ЛПНП", "ЛПВП", "Триглицериды", "давление за 3 дня", "семейный анамнез", "окружность талии", "возраст", "вес"]},
  {name: "Обмен веществ", required: ["Глюкоза", "HbA1c", "окружность талии", "вес", "активность", "инсулин", "дневник питания"]},
  {name: "Печень и ЖКТ", required: ["АЛТ", "АСТ", "ГГТ", "билирубин", "щелочная фосфатаза", "алкоголь", "лекарства", "БАДы", "жалобы ЖКТ", "УЗИ или ФГДС"]},
  {name: "Почки и водный баланс", required: ["Креатинин", "мочевина", "мочевая кислота", "давление", "отеки", "питьевой режим"]},
  {name: "Дыхание и лёгкие", required: ["курение", "стаж курения", "вейп", "кашель", "одышка", "сатурация", "храп", "дневная сонливость", "переносимость нагрузки", "рентген или КТ или спирометрия"]},
  {name: "Нервная система", required: ["головные боли", "головокружение", "онемение", "слабость", "нарушение речи", "нарушение зрения", "судороги", "потеря сознания", "тревожность", "концентрация", "ТТГ", "Т4 свободный"]},
  {name: "Сон и восстановление", required: ["длительность сна", "качество сна", "пробуждения", "дневная сонливость", "поздний кофеин", "вечерний экран", "регулярность сна"]},
  {name: "Витамины и дефициты", required: ["Витамин D", "Ферритин", "B12", "магний", "фолиевая кислота", "БАДы", "симптомы усталости"]},
  {name: "Воспаление и иммунный фон", required: ["С-реактивный белок", "СОЭ", "Лейкоциты", "температура", "частые инфекции", "симптомы"]},
  {name: "Образ жизни и риски", required: ["цели", "активность", "сон", "стресс", "курение", "алкоголь", "питание", "семейный анамнез"]}
];

const missionDefinitions = [
  {
    id: "passport",
    name: "Собрать базовый паспорт здоровья",
    days: 14,
    why: "Сейчас карта организма видит только часть данных. Соберите базовый паспорт здоровья, чтобы приложение перестало гадать и начало давать более точные следующие шаги.",
    systems: ["Паспорт здоровья", "Карта организма", "Отчёт врачу"],
    tasks: [
      "Заполнить базовые данные",
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
      "Открыть карту организма",
      "Сформировать отчёт для врача"
    ],
    final: "В финале: карта с пробелами, ТО-календарь и текст для врача."
  },
  {id: "metabolism", name: "Обмен веществ", days: 14, why: "Фокус на глюкозе, HbA1c, весе, талии, активности и привычках после еды.", systems: ["Обмен веществ"], tasks: ["Добавить окружность талии", "Пройти check-in 5 дней", "3 прогулки после еды", "Добавить HbA1c", "Сформировать вывод"], final: "Понятный план наблюдения за метаболическим контуром."},
  {id: "energy", name: "Энергия и дефициты", days: 14, why: "Помогает связать усталость, сон, ферритин, витамин D, B12 и стресс в одну картину.", systems: ["Витамины и дефициты", "Сон и восстановление"], tasks: ["Отмечать энергию 7 дней", "Добавить витамин D", "Добавить ферритин", "Заполнить БАДы", "Сформировать вопросы врачу"], final: "Список факторов энергии, которые стоит смотреть в динамике."},
  {id: "heart", name: "Сердце и сосуды", days: 14, why: "Фокус на давлении, липидах, активности, весе и семейном анамнезе.", systems: ["Сердце и сосуды"], tasks: ["Давление 3 дня", "Добавить липидограмму", "Заполнить семейный анамнез", "Прогулки 4 дня", "Вопросы врачу"], final: "Закрытые пробелы для разговора о сердечно-сосудистом профиле."},
  {id: "sleep", name: "Сон и восстановление", days: 10, why: "Фокус на сне, стрессе, вечерней рутине и индексе ресурса.", systems: ["Сон и восстановление"], tasks: ["Сон 7 дней", "Стресс 7 дней", "Лечь раньше 3 раза", "Убрать кофеин после 14:00", "Посмотреть недельную динамику"], final: "Неделя данных по восстановлению без попыток поставить диагноз."}
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
      waist: "",
      country: "Россия",
      goals: [],
      complaints: "",
      chronic: "",
      medications: "",
      supplements: "",
      allergies: "",
      family: "",
      lifestyle: "",
      alcohol: "",
      nutrition: "",
      giComplaints: "",
      liverDocs: "",
      smoking: "",
      smokingYears: "",
      vape: "",
      cough: "",
      dyspnea: "",
      saturation: "",
      snoring: "",
      daytimeSleepiness: "",
      exerciseTolerance: "",
      lungDocs: "",
      sleepHours: "",
      awakenings: "",
      lateCaffeine: "",
      eveningScreen: "",
      sleepRegularity: "",
      headaches: "",
      dizziness: "",
      numbness: "",
      weakness: "",
      speech: "",
      vision: "",
      seizures: "",
      syncope: "",
      cognitive: "",
      anxiety: "",
      concentration: ""
    },
    checkins: [],
    biomarkers: [],
    missionTasks: {},
    maintenance: [],
    report: "",
    actionDone: false,
    demoMode: "analysis",
    mapOpened: false
  };
}

function loadState() {
  try {
    return {...defaultState(), ...(JSON.parse(localStorage.getItem(STORAGE_KEY)) || {})};
  } catch {
    return defaultState();
  }
}

function saveState() {
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

function symptomScore(level) {
  return level === "none" ? 100 : level === "mild" ? 70 : level === "moderate" ? 40 : 15;
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
    ["энергия", c.energy],
    ["стресс", 11 - c.stress],
    ["активность", c.activity],
    ["симптомы", symptomScore(c.symptoms) / 10]
  ];
  return items.sort((a, b) => a[1] - b[1])[0][0];
}

function findBiomarker(label) {
  return state.biomarkers.find((b) => b.label === label);
}

function hasValue(key) {
  const p = state.profile;
  const c = latestCheckin();
  const biomarker = findBiomarker(key);
  if (biomarker) return true;
  const map = {
    "возраст": p.age,
    "вес": p.weight,
    "окружность талии": p.waist,
    "талия": p.waist,
    "семейный анамнез": p.family,
    "давление": state.maintenance.some((e) => e.title.includes("давление") && e.status === "выполнено"),
    "давление за 3 дня": state.maintenance.some((e) => e.title.includes("давление") && e.status === "выполнено"),
    "цели": p.goals?.length,
    "активность": c?.activity,
    "сон": c?.sleep,
    "стресс": c?.stress,
    "симптомы": c?.symptomList?.length || c?.symptoms !== "none",
    "качество сна": c?.sleep,
    "длительность сна": p.sleepHours,
    "пробуждения": p.awakenings,
    "дневная сонливость": p.daytimeSleepiness,
    "поздний кофеин": p.lateCaffeine,
    "вечерний экран": p.eveningScreen,
    "регулярность сна": p.sleepRegularity,
    "курение": p.smoking,
    "стаж курения": p.smokingYears,
    "вейп": p.vape,
    "кашель": p.cough || c?.symptomList?.includes("кашель"),
    "одышка": p.dyspnea || c?.symptomList?.includes("одышка"),
    "сатурация": p.saturation,
    "храп": p.snoring,
    "переносимость нагрузки": p.exerciseTolerance,
    "рентген или КТ или спирометрия": p.lungDocs,
    "головные боли": p.headaches || c?.symptomList?.includes("головная боль"),
    "головокружение": p.dizziness || c?.symptomList?.includes("головокружение"),
    "онемение": p.numbness || c?.symptomList?.includes("онемение"),
    "слабость": p.weakness || c?.symptomList?.includes("слабость"),
    "нарушение речи": p.speech || c?.symptomList?.includes("нарушение речи"),
    "нарушение зрения": p.vision || c?.symptomList?.includes("нарушение зрения"),
    "судороги": p.seizures || c?.symptomList?.includes("судороги"),
    "потеря сознания": p.syncope || c?.symptomList?.includes("потеря сознания"),
    "тревожность": p.anxiety || c?.symptomList?.includes("тревожность"),
    "концентрация": p.concentration,
    "алкоголь": p.alcohol,
    "лекарства": p.medications,
    "БАДы": p.supplements,
    "жалобы ЖКТ": p.giComplaints || c?.symptomList?.some((s) => ["боль в животе", "вздутие", "изжога"].includes(s)),
    "УЗИ или ФГДС": p.liverDocs,
    "питание": p.nutrition
  };
  return Boolean(map[key]);
}

function redFlags() {
  const p = state.profile;
  const c = latestCheckin();
  const list = [];
  const selected = c?.symptomList || [];
  if (selected.includes("боль в груди")) list.push({type: "resp", text: "Боль в груди отмечена в check-in. Это может быть важным респираторным или сердечно-сосудистым сигналом."});
  if (selected.includes("одышка") || p.dyspnea === "в покое") list.push({type: "resp", text: "Одышка отмечена в данных. Если она возникает в покое или усиливается, не откладывайте обращение к врачу."});
  if (Number(p.saturation) > 0 && Number(p.saturation) < 92) list.push({type: "resp", text: `Сатурация ${p.saturation}% ниже 92%. Приложение не ставит диагноз, но это не стоит игнорировать.`});
  if (p.cough === "больше 3 недель") list.push({type: "resp", text: "Кашель больше 3 недель отмечен в профиле. Это повод не откладывать консультацию."});
  selected.concat([p.speech, p.vision, p.seizures, p.syncope, p.numbness]).filter(Boolean).forEach((item) => {
    if (neuroRedFlags.includes(item)) list.push({type: "neuro", text: `Отмечено: ${item}. Это может быть важным неврологическим симптомом. Такие признаки нельзя игнорировать.`});
  });
  return list;
}

function mainAction(c) {
  const flags = redFlags();
  if (flags.length) return ["Не откладывать обращение к врачу", "Отмечен симптом, который нельзя игнорировать. Приложение не ставит диагноз, но рекомендует получить медицинскую оценку."];
  if (!c) return ["Пройти check-in на 40 секунд", "После этого приложение рассчитает индекс ресурса и выберет безопасный шаг дня."];
  if (c.symptoms === "moderate" || c.symptoms === "strong") return ["Снизить нагрузку и описать симптомы", "Сегодня лучше не форсировать. Если состояние ухудшается, стоит обратиться к врачу."];
  if (c.stress >= 8) return ["10 минут спокойной прогулки без телефона", "Стресс сегодня главный фактор снижения ресурса. Задача не в спорте, а в мягком снижении напряжения."];
  if (c.sleep <= 5) return ["Лечь сегодня на 30 минут раньше", "Сон сильнее всего влияет на индекс ресурса. Сегодня главный шаг: восстановление, а не героизм."];
  if (c.activity <= 4) return ["20 минут ходьбы после еды", "Активность ниже обычного. Это поддержит миссию “Обмен веществ” и закроет дневной план."];
  return ["Сохранить режим: прогулка 20 минут и сон по плану", "Ресурс хороший. Задача дня: не ломать работающий режим, а закрепить его."];
}

function whyScore(c) {
  if (!c) return "Данных пока мало. Приложение не будет делать вид, что всё знает: сохраните первый check-in.";
  const flags = redFlags();
  if (flags.length) return `${flags[0].text} Индекс ресурса не является медицинской оценкой, поэтому главный шаг сегодня связан с безопасностью.`;
  if (c.sleep <= 5 && c.stress >= 8) return `Сон ${c.sleep}/10 и стресс ${c.stress}/10 сильнее всего снизили ресурс. Сегодня лучше выбрать лёгкую нагрузку и не перегружать вечер.`;
  return `Сон ${c.sleep}/10, энергия ${c.energy}/10, стресс ${c.stress}/10 и активность ${c.activity}/10 дали текущий индекс. Главный фактор снижения: ${factor(c)}.`;
}

function ensureMaintenance() {
  const base = [
    {title: "Добавить давление за 3 дня", date: todayISO(0), type: "измерение", system: "Сердце и сосуды", why: "Без давления карта сердца неполная.", status: "запланировано"},
    {title: "Добавить окружность талии", date: todayISO(1), type: "измерение", system: "Обмен веществ", why: "Талия помогает точнее оценивать метаболический профиль.", status: "запланировано"},
    {title: "Сформировать вопросы врачу", date: todayISO(3), type: "отчёт", system: "Липиды и дефициты", why: "В демо-анализе есть сигналы внимания по ЛПНП и витамину D.", status: "запланировано"},
    {title: "Пройти 3 check-in подряд", date: todayISO(3), type: "наблюдение", system: "Сон и восстановление", why: "Без истории приложение видит только один день.", status: "запланировано"}
  ];
  base.forEach((event) => {
    if (!state.maintenance.find((item) => item.title === event.title)) state.maintenance.push(event);
  });
  saveState();
}

function nav() {
  const active = document.querySelector(".bottom-nav")?.dataset.active;
  const items = [
    ["today", "/2/", "Сегодня", '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>'],
    ["map", "/2/map.html", "Карта", '<path d="M9 18l-6 3V6l6-3 6 3 6-3v15l-6 3-6-3z"/><path d="M9 3v15"/><path d="M15 6v15"/>'],
    ["labs", "/2/labs.html", "Анализы", '<path d="M9 3h6"/><path d="M10 3v6l-5 8a4 4 0 0 0 3.4 6h7.2a4 4 0 0 0 3.4-6l-5-8V3"/>'],
    ["missions", "/2/missions.html", "Миссии", '<path d="M19 14c1.5-1.5 2-4.5 0-6.5s-5-1.5-6.5 0L12 8l-.5-.5C10 6 7 5.5 5 7.5S3.5 12.5 5 14l7 7 7-7z"/>'],
    ["profile", "/2/profile.html", "Профиль", '<path d="M20 21a8 8 0 0 0-16 0"/><circle cx="12" cy="7" r="4"/>']
  ];
  document.querySelector(".bottom-nav").innerHTML = `<div class="bottom-nav-grid">${items.map(([id, href, label, icon]) => `<a class="${active === id ? "active" : ""}" href="${href}"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${icon}</svg>${label}</a>`).join("")}</div>`;
}

function renderOnboarding() {
  const mount = document.getElementById("onboarding");
  if (!mount || state.onboarded) return;
  let step = 0;
  const draft = {...state.profile, goals: [...(state.profile.goals || [])]};
  const screens = [
    () => `<h2>Соберите карту здоровья и персональный ТО-план организма</h2><p class="lead">Загружайте анализы, отмечайте самочувствие, проходите профилактические миссии и смотрите динамику здоровья в одном месте.</p><button class="btn full" data-next>Начать</button>`,
    () => `<h2>Выберите 1-3 цели</h2><p class="lead">Цели влияют на миссии, действия дня и отчёт для врача.</p><div class="chips">${goalOptions.map((g) => `<button class="chip" data-goal="${g}">${g}</button>`).join("")}</div><button class="btn full" data-next>Продолжить</button>`,
    () => `<h2>Базовые данные</h2><div class="form-grid">${["name:Имя", "age:Возраст", "sex:Пол", "height:Рост", "weight:Вес", "country:Страна"].map((item) => { const [key, label] = item.split(":"); return `<label>${label}<input data-field="${key}" value="${draft[key] || ""}"></label>`; }).join("")}</div><button class="btn full" data-next>Продолжить</button>`,
    () => `<h2>Самочувствие</h2><div class="form-grid"><label>Энергия<input data-field="energy" type="range" min="1" max="10" value="7"></label><label>Сон<input data-field="sleep" type="range" min="1" max="10" value="7"></label><label>Стресс<input data-field="stress" type="range" min="1" max="10" value="5"></label><label>Активность<input data-field="activity" type="range" min="1" max="10" value="5"></label><label>Жалобы<textarea data-field="complaints" rows="3"></textarea></label></div><button class="btn full" data-next>Продолжить</button>`,
    () => `<h2>Контекст и дыхание</h2><div class="form-grid">${["medications:Лекарства", "supplements:БАДы", "family:Семейный анамнез", "smoking:Курение", "cough:Кашель", "dyspnea:Одышка"].map((item) => { const [key, label] = item.split(":"); return `<label>${label}<input data-field="${key}" value="${draft[key] || ""}"></label>`; }).join("")}</div><button class="btn full" data-finish>Сохранить и открыть сегодня</button>`
  ];
  function collect() {
    mount.querySelectorAll("[data-field]").forEach((field) => (draft[field.dataset.field] = field.value));
  }
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
    mount.querySelectorAll("[data-finish]").forEach((button) => (button.onclick = () => { collect(); finish(draft); }));
  }
  draw();
}

function finish(draft) {
  state.profile = {...state.profile, ...draft};
  state.onboarded = true;
  const c = {date: todayISO(), sleep: Number(draft.sleep || 7), energy: Number(draft.energy || 7), stress: Number(draft.stress || 5), activity: Number(draft.activity || 5), symptoms: "none", symptomList: [], note: draft.complaints || ""};
  c.score = scoreCheckin(c);
  state.checkins = [c];
  ensureMaintenance();
  saveState();
  location.href = "/2/";
}

function systemData() {
  return systems.map((system) => {
    const present = system.required.filter(hasValue);
    const missing = system.required.filter((item) => !present.includes(item));
    const related = state.biomarkers.filter((b) => b.system === system.name);
    const abnormal = related.filter((b) => b.status !== "норма");
    const completion = Math.round((present.length / system.required.length) * 100);
    const flags = redFlags();
    let signal = completion < 25 ? "gray" : missing.length || abnormal.some((b) => b.status === "погранично" || b.status === "нижняя часть референса") ? "yellow" : "green";
    if (abnormal.some((b) => ["выше", "ниже"].includes(b.status))) signal = "orange";
    if ((system.name === "Дыхание и лёгкие" && flags.some((f) => f.type === "resp")) || (system.name === "Нервная система" && flags.some((f) => f.type === "neuro"))) signal = "red";
    return {system, name: system.name, present, missing, related, abnormal, completion, signal, next: nextStep(system.name, missing, abnormal)};
  });
}

function nextStep(name, missing, abnormal) {
  if (name === "Сердце и сосуды" && missing.includes("давление за 3 дня")) return "Добавьте давление утром и вечером в течение 3 дней. Это закроет главный пробел в блоке сердца и сосудов.";
  if (name === "Дыхание и лёгкие") return "Ответьте на 4 вопроса о дыхании: курение, кашель, одышка и сатурация, если она известна.";
  if (name === "Нервная система") return "Укажите головные боли, головокружение, онемение, слабость и тревожность. Красные симптомы не стоит игнорировать.";
  if (name === "Печень и ЖКТ") return "Добавьте алкоголь, лекарства, БАДы, вес, талию и жалобы ЖКТ. Это даст контекст к АЛТ, АСТ и ГГТ.";
  if (abnormal.length) return `Обсудите ${abnormal.map((b) => b.label).slice(0, 2).join(", ")} со специалистом и посмотрите динамику.`;
  return missing.length ? `Добавьте: ${missing.slice(0, 2).join(", ")}.` : "Продолжайте наблюдение в динамике.";
}

function systemSummary(s) {
  if (s.name === "Сердце и сосуды" && s.related.length) return "ЛПНП и общий холестерин выше референса в демо-анализе. Давление пока не добавлено, поэтому оценка неполная.";
  if (s.name === "Обмен веществ" && s.related.length) return "Глюкоза и HbA1c рядом с верхней границей. Это не диагноз, но стоит связать данные с талией, активностью, весом и питанием.";
  if (s.name === "Печень и ЖКТ" && s.related.length) return "АЛТ, АСТ и ГГТ в демо-анализе находятся в референсе. Для полной картины нужны алкоголь, лекарства, БАДы, вес, талия и жалобы ЖКТ.";
  if (s.name === "Дыхание и лёгкие") return redFlags().some((f) => f.type === "resp") ? "Есть респираторный сигнал, который нельзя игнорировать. Приложение не ставит диагноз, но не стоит откладывать консультацию." : "В блоке дыхания пока мало данных. Нужны курение, кашель, одышка, сатурация и переносимость нагрузки.";
  if (s.name === "Нервная система") return redFlags().some((f) => f.type === "neuro") ? "Есть неврологический симптом, который нельзя игнорировать. Не откладывайте обращение за медицинской помощью." : "Нервная система отделена от стресса: нужны данные по головным болям, онемению, речи, зрению и концентрации.";
  if (s.name === "Витамины и дефициты" && s.related.length) return "Витамин D ниже референса, ферритин в нижней части диапазона. Эти данные стоит обсудить со специалистом и оценивать вместе с симптомами.";
  if (s.name === "Сон и восстановление" && state.checkins.length) return "Сон влияет на индекс ресурса. Следующий шаг: отметить длительность сна, пробуждения и вечернюю рутину.";
  return s.present.length ? `Есть данные: ${s.present.slice(0, 3).join(", ")}. Не хватает: ${s.missing.slice(0, 3).join(", ") || "ключевых пробелов нет"}.` : `Данных пока недостаточно. Следующий шаг: ${s.next}`;
}

function signalText(signal) {
  return {gray: "данных мало", green: "по доступным данным спокойно", yellow: "есть пробелы", orange: "есть сигналы внимания", red: "не откладывать консультацию"}[signal];
}

function passportScore() {
  const p = state.profile;
  const checks = new Set(state.checkins.map((c) => c.date)).size >= 3;
  const parts = [
    [12, p.name && p.age && p.sex && p.height && p.weight],
    [8, p.goals?.length],
    [8, p.complaints],
    [8, p.medications],
    [6, p.supplements],
    [8, p.chronic],
    [8, p.family],
    [8, p.smoking || p.cough || p.dyspnea],
    [8, p.sleepHours || p.headaches || p.anxiety],
    [18, state.biomarkers.length],
    [8, checks]
  ];
  return parts.reduce((sum, [weight, ok]) => sum + (ok ? weight : 0), 0);
}

function missingPassport() {
  const p = state.profile;
  const misses = [];
  if (!p.complaints) misses.push("жалоб");
  if (!p.family) misses.push("семейного анамнеза");
  if (!p.waist) misses.push("давления и талии");
  if (!p.smoking && !p.cough && !p.dyspnea) misses.push("данных о дыхании");
  if (!p.supplements) misses.push("списка БАДов");
  if (new Set(state.checkins.map((c) => c.date)).size < 3) misses.push("check-in за 3 дня");
  return misses.slice(0, 5);
}

function characterMode(score, flags) {
  if (flags.length) return ["Нужен сигнал внимания", "red"];
  if (score < 60) return ["Бережный режим", "orange"];
  if (score < 80) return ["Рабочий режим", "yellow"];
  return ["Хороший ресурс", "green"];
}

function compactSystemStatus() {
  const data = systemData();
  const byName = (name) => data.find((item) => item.name === name);
  const heart = byName("Сердце и сосуды");
  const metabolism = byName("Обмен веществ");
  const sleep = byName("Сон и восстановление");
  const deficits = byName("Витамины и дефициты");
  const breathing = byName("Дыхание и лёгкие");
  const dataCompletion = passportScore();
  return [
    {id: "heart", title: "Сердце", icon: "♡", completion: heart?.completion || 18, signal: heart?.signal || "gray", label: findBiomarker("ЛПНП") ? "ЛПНП выше" : "Нет давления", detail: ["Сердце и сосуды", signalText(heart?.signal || "gray"), findBiomarker("ЛПНП") ? "ЛПНП выше, давления пока нет" : "Давление пока не добавлено", "Добавить давление"]},
    {id: "metabolism", title: "Обмен", icon: "◎", completion: metabolism?.completion || 22, signal: metabolism?.signal || "gray", label: findBiomarker("HbA1c") ? "HbA1c рядом" : "Нет талии", detail: ["Обмен веществ", signalText(metabolism?.signal || "gray"), findBiomarker("Глюкоза") ? "Глюкоза/HbA1c требуют динамики" : "Нет талии и глюкозы", "Добавить талию"]},
    {id: "sleep", title: "Сон", icon: "◐", completion: sleep?.completion || 30, signal: sleep?.signal || "yellow", label: latestCheckin() ? "Стресс влияет" : "Данных мало", detail: ["Сон и восстановление", signalText(sleep?.signal || "yellow"), latestCheckin() ? "Сон и стресс снижают ресурс" : "Нужен check-in", "Отметить сон завтра"]},
    {id: "deficits", title: "Дефициты", icon: "✦", completion: deficits?.completion || 20, signal: deficits?.signal || "gray", label: findBiomarker("Витамин D") ? "D ниже" : "Нет D/B12", detail: ["Витамины и дефициты", signalText(deficits?.signal || "gray"), findBiomarker("Витамин D") ? "Витамин D ниже референса" : "Нет данных по D, B12, ферритину", "Сформировать вопросы врачу"]},
    {id: "breathing", title: "Дыхание", icon: "⌁", completion: breathing?.completion || 18, signal: breathing?.signal || "gray", label: redFlags().some((f) => f.type === "resp") ? "Есть сигнал" : "Данных мало", detail: ["Дыхание и лёгкие", signalText(breathing?.signal || "gray"), redFlags().some((f) => f.type === "resp") ? "Есть симптом, который нельзя игнорировать" : "Нужны кашель, одышка, сатурация", "Ответить на 4 вопроса"]},
    {id: "data", title: "Данные", icon: "▣", completion: dataCompletion, signal: dataCompletion < 45 ? "gray" : "yellow", label: dataCompletion < 55 ? "Есть пробелы" : "База есть", detail: ["Данные", dataCompletion < 55 ? "Есть пробелы" : "База есть", `Паспорт заполнен на ${dataCompletion}%`, "Закрыть 1 пробел"]}
  ];
}

function ringStyle(item) {
  const color = {gray: "#64748B", green: "#39FF88", yellow: "#FACC15", orange: "#FB923C", red: "#F43F5E"}[item.signal] || "#64748B";
  return `--ring-color:${color};--ring:${item.completion * 3.6}deg`;
}

function renderDemoSwitch() {
  const mount = document.getElementById("demo-state-switch");
  if (!mount) return;
  const modes = [["minimal", "Мало"], ["analysis", "Анализ"], ["after", "После шага"]];
  mount.innerHTML = modes.map(([id, label]) => `<button class="${(state.demoMode || "analysis") === id ? "active" : ""}" data-demo="${id}" type="button">${label}</button>`).join("");
  mount.querySelectorAll("[data-demo]").forEach((button) => {
    button.onclick = () => {
      applyDemoMode(button.dataset.demo);
      renderToday();
      showToast(button.dataset.demo === "minimal" ? "Минимум данных: видны пробелы." : button.dataset.demo === "after" ? "Сценарий после действия: миссия выросла." : "Демо-анализ добавлен: карта ожила.");
    };
  });
}

function applyDemoMode(mode) {
  state.demoMode = mode;
  fillDemoProfile();
  if (mode === "minimal") {
    state.biomarkers = [];
    state.actionDone = false;
    state.profile.waist = "";
    state.profile.supplements = "";
    state.checkins = [{date: todayISO(), sleep: 5, energy: 6, stress: 8, activity: 4, symptoms: "none", symptomList: [], note: "", score: 52}];
    state.missionTasks.passport = {};
  }
  if (mode === "analysis") {
    state.biomarkers = parseBiomarkers(demoLabText);
    state.actionDone = false;
    addDemoCheckins(false);
    state.profile.waist = "";
    state.profile.supplements = "";
  }
  if (mode === "after") {
    state.biomarkers = parseBiomarkers(demoLabText);
    addDemoCheckins(false);
    state.actionDone = true;
    state.profile.waist = "94";
    state.profile.supplements = "витамин D обсуждается со специалистом";
    state.maintenance = state.maintenance.map((event) => event.title.includes("давление") ? {...event, status: "выполнено"} : event);
    state.missionTasks.passport ||= {};
    state.missionTasks.passport[9] = true;
  }
  state.onboarded = true;
  ensureMaintenance();
  saveState();
}

function showToast(text) {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = text;
  toast.classList.add("show");
  window.setTimeout(() => toast.classList.remove("show"), 2200);
}

function openQuickSheet(title, status, reason, next) {
  const sheet = document.getElementById("quick-sheet");
  const panel = document.getElementById("sheet-panel");
  if (!sheet || !panel) return;
  panel.innerHTML = `<div class="sheet-handle"></div><h2>${title}</h2><p><strong>Статус:</strong> ${status}</p><p><strong>Причина:</strong> ${reason}</p><p><strong>Следующий шаг:</strong> ${next}</p><button class="btn full" id="sheet-close" type="button">Понятно</button>`;
  sheet.classList.remove("hidden");
  sheet.setAttribute("aria-hidden", "false");
  document.getElementById("sheet-close").onclick = closeQuickSheet;
  document.getElementById("sheet-backdrop").onclick = closeQuickSheet;
}

function closeQuickSheet() {
  const sheet = document.getElementById("quick-sheet");
  if (!sheet) return;
  sheet.classList.add("hidden");
  sheet.setAttribute("aria-hidden", "true");
}

function openMissingForm(type) {
  const config = {
    pressure: ["Давление", "Добавьте утро и вечер", `<label>Утро<input id="sheet-pressure-am" placeholder="Например: 122/78"></label><label>Вечер<input id="sheet-pressure-pm" placeholder="Например: 118/76"></label>`],
    waist: ["Талия", "Одно число уточнит метаболический контур", `<label>Окружность талии, см<input id="sheet-waist" inputmode="decimal" placeholder="Например: 94"></label>`],
    supplements: ["БАДы", "Важно для печени, ЖКТ и отчёта врачу", `<label>Что принимаете<textarea id="sheet-supplements" rows="3" placeholder="Например: витамин D, магний"></textarea></label>`]
  }[type];
  const sheet = document.getElementById("quick-sheet");
  const panel = document.getElementById("sheet-panel");
  panel.innerHTML = `<div class="sheet-handle"></div><h2>${config[0]}</h2><p class="muted">${config[1]}</p><div class="form-grid">${config[2]}</div><button class="btn full" id="sheet-save" type="button">Сохранить</button>`;
  sheet.classList.remove("hidden");
  document.getElementById("sheet-backdrop").onclick = closeQuickSheet;
  document.getElementById("sheet-save").onclick = () => {
    if (type === "pressure") state.maintenance = state.maintenance.map((event) => event.title.includes("давление") ? {...event, status: "выполнено"} : event);
    if (type === "waist") state.profile.waist = document.getElementById("sheet-waist").value || "94";
    if (type === "supplements") state.profile.supplements = document.getElementById("sheet-supplements").value || "не указаны";
    saveState();
    closeQuickSheet();
    renderToday();
    showToast(type === "pressure" ? "Давление добавлено. Сердце стало понятнее." : type === "waist" ? "Талия добавлена. Контур обмена обновлён." : "БАДы сохранены. Отчёт стал точнее.");
  };
}

function renderToday() {
  if (document.body.dataset.page !== "today") return;
  if (!state.onboarded) applyDemoMode(state.demoMode || "analysis");
  const c = latestCheckin();
  const score = scoreCheckin(c);
  const flags = redFlags();
  const [status, tone] = characterMode(score, flags);
  document.getElementById("today-date").textContent = new Intl.DateTimeFormat("ru-RU", {weekday: "long", day: "numeric", month: "long"}).format(new Date());
  document.getElementById("today-title").textContent = "Экран организма";
  document.getElementById("score-value").textContent = score;
  document.getElementById("brief-score").textContent = score;
  document.getElementById("score-status").textContent = status;
  document.getElementById("avatar-shell").dataset.tone = tone;
  const shortInsight = flags.length ? "Есть симптом, который лучше не игнорировать" : c ? (factor(c) === "сон" || factor(c) === "стресс" ? "Сон и стресс сегодня снижают ресурс" : `${factor(c)} сегодня сильнее всего влияет на ресурс`) : "Данных пока мало для точной оценки";
  document.getElementById("brief-copy").textContent = `${status}: ${shortInsight}`;
  document.getElementById("score-explain").textContent = shortInsight;
  const [action, note] = mainAction(c);
  document.getElementById("main-action").textContent = action.replace(" после еды", "");
  document.getElementById("main-action-note").textContent = state.actionDone ? "Выполнено: миссия +7%" : "+7% к миссии “Обмен веществ”";
  document.getElementById("action-result").textContent = state.actionDone ? "Миссия обновлена, daily-сигнал закрыт" : note.includes("метабол") ? "Обновит активность и метаболический контур" : "Обновит ресурс и дневной план";
  document.getElementById("primary-action-card").classList.toggle("completed", state.actionDone);
  renderDemoSwitch();
  renderOrbitLayer();
  renderMissingChips();
  renderCompactSystems();
  renderSymptomChips();
  const missionDone = Math.round((missionPercent("passport") / 100) * 14);
  document.getElementById("mission-progress-label").textContent = `${missionDone}/14`;
  document.getElementById("mission-progress-bar").style.width = `${missionPercent("passport")}%`;
  document.getElementById("active-mission-copy").textContent = state.actionDone ? "Сегодня: действие закрыто" : "Сегодня: добавить давление";
  renderWeek();
  const weekly = document.querySelector(".weekly-insight")?.textContent || "";
  document.getElementById("weekly-one-line").textContent = weekly.replace("За 7 дней ", "").split(".").slice(0, 2).join(".");
  bindCheckin(score, c);
  document.getElementById("complete-action").onclick = () => {
    state.actionDone = true;
    state.demoMode = "after";
    state.missionTasks.passport ||= {};
    state.missionTasks.passport[9] = true;
    saveState();
    renderToday();
    showToast("Шаг выполнен. Миссия +7%");
  };
}

function renderOrbitLayer() {
  const orbit = document.getElementById("orbit-layer");
  if (!orbit) return;
  const items = compactSystemStatus().filter((item) => item.id !== "data").slice(0, 5);
  const dataItem = compactSystemStatus().find((item) => item.id === "data");
  const orbitItems = [items[0], items[2], items[1], dataItem, items[3], items[4]].filter(Boolean);
  orbit.innerHTML = orbitItems.map((item, index) => `<button class="orbit-stat orbit-${index + 1} ${item.signal}" style="${ringStyle(item)}" data-orbit="${item.id}" type="button"><span>${item.icon}</span><b>${item.title}</b><small>${item.label}</small></button>`).join("");
  orbit.querySelectorAll("[data-orbit]").forEach((button) => {
    button.onclick = () => {
      const item = compactSystemStatus().find((entry) => entry.id === button.dataset.orbit);
      openQuickSheet(item.detail[0], item.detail[1], item.detail[2], item.detail[3]);
    };
  });
}

function renderMissingChips() {
  const missing = [
    {id: "pressure", label: "Давление", icon: "⌁", done: state.maintenance.some((e) => e.title.includes("давление") && e.status === "выполнено")},
    {id: "waist", label: "Талия", icon: "◎", done: Boolean(state.profile.waist)},
    {id: "supplements", label: "БАДы", icon: "✦", done: Boolean(state.profile.supplements)}
  ];
  document.getElementById("data-completion-label").textContent = `${passportScore()}%`;
  document.getElementById("missing-data-chips").innerHTML = missing.map((item) => `<button class="missing-chip ${item.done ? "done" : ""}" data-missing="${item.id}" type="button"><span>${item.icon}</span>${item.done ? item.label + " ✓" : item.label}</button>`).join("");
  document.querySelectorAll("[data-missing]").forEach((button) => button.onclick = () => openMissingForm(button.dataset.missing));
}

function renderCompactSystems() {
  const grid = document.getElementById("compact-system-grid");
  if (!grid) return;
  grid.innerHTML = compactSystemStatus().map((item, index) => `<button class="compact-system ${item.signal}" style="--delay:${index * 35}ms" data-system="${item.id}" type="button"><span>${item.icon}</span><strong>${item.title}</strong><b>${item.completion}%</b><small>${item.label}</small></button>`).join("");
  grid.querySelectorAll("[data-system]").forEach((button) => {
    button.onclick = () => {
      const item = compactSystemStatus().find((entry) => entry.id === button.dataset.system);
      openQuickSheet(item.detail[0], item.detail[1], item.detail[2], item.detail[3]);
    };
  });
}

function renderSymptomChips() {
  const mount = document.getElementById("symptom-list");
  if (!mount) return;
  mount.innerHTML = symptoms.map((s) => `<label class="chip check-chip"><input type="checkbox" value="${s}">${s}</label>`).join("");
}

function renderWeek() {
  const week = state.checkins.slice(-7);
  const avg = week.length ? Math.round(week.reduce((sum, item) => sum + item.score, 0) / week.length) : 0;
  const best = week.length ? week.reduce((a, b) => (a.score > b.score ? a : b)) : null;
  const factors = week.map(factor);
  const top = factors.length ? factors.sort((a, b) => factors.filter((x) => x === b).length - factors.filter((x) => x === a).length)[0] : "данных мало";
  document.getElementById("weekly-stats").innerHTML = [[avg, "средний ресурс"], [`${week.length}/7`, "check-in"], [best ? formatDate(best.date) : "нет", "лучший день"], [top, "главный фактор"]].map(([a, b]) => `<div class="stat"><strong>${a}</strong><span>${b}</span></div>`).join("");
  document.getElementById("sparkline").innerHTML = (week.length ? week : [{score: 6}]).map((item) => `<i style="height:${Math.max(8, item.score * 0.52)}px"></i>`).join("");
  const card = document.getElementById("sparkline").closest(".card");
  if (!card.querySelector(".weekly-insight")) card.insertAdjacentHTML("beforeend", `<p class="muted weekly-insight" style="margin-top:12px"></p>`);
  card.querySelector(".weekly-insight").textContent = week.length < 3 ? "Пока мало данных. Пройдите 3 check-in, чтобы увидеть закономерности." : `За 7 дней средний ресурс - ${avg}/100. Вы прошли ${week.length} check-in из 7. Главный фактор снижения - ${top}. В дни с прогулкой индекс обычно выше.`;
}

function bindCheckin(oldScore, oldCheckin) {
  document.getElementById("checkin-form").onsubmit = (event) => {
    event.preventDefault();
    const symptomList = [...document.querySelectorAll("#symptom-list input:checked")].map((input) => input.value);
    const next = {
      date: todayISO(),
      sleep: Number(document.getElementById("sleep").value),
      energy: Number(document.getElementById("energy").value),
      stress: Number(document.getElementById("stress").value),
      activity: Number(document.getElementById("activity").value),
      symptoms: document.getElementById("symptoms").value,
      symptomList,
      note: document.getElementById("day-note").value
    };
    next.score = scoreCheckin(next);
    state.checkins = state.checkins.filter((item) => item.date !== next.date).concat(next);
    saveState();
    const flags = redFlags();
    document.getElementById("checkin-message").textContent = flags.length ? "Отмечен симптом, который нельзя игнорировать. Приложение не ставит диагноз, но рекомендует не откладывать обращение к врачу." : oldCheckin ? `Check-in сохранён. Индекс ресурса обновлён: ${oldScore} → ${next.score}. Главный фактор сегодня - ${factor(next)}.` : "Check-in сохранён. Теперь приложение может точнее подобрать действие дня.";
    document.getElementById("checkin-message").classList.remove("hidden");
    document.getElementById("checkin-state").textContent = "сохранён";
    renderToday();
  };
}

function renderContours() {
  const contourEl = document.getElementById("health-contours");
  if (!contourEl) return;
  const node = (label, stateName) => `<span class="contour-node ${stateName}">${label}</span>`;
  const hasLipids = ["Холестерин общий", "ЛПНП", "ЛПВП", "Триглицериды"].some(findBiomarker);
  const contours = [
    {title: "Метаболический контур", nodes: [["Талия", hasValue("окружность талии") ? "ok" : "missing"], ["Глюкоза/HbA1c", findBiomarker("Глюкоза") && findBiomarker("HbA1c") ? "attention" : "missing"], ["Липиды", hasLipids ? "attention" : "missing"], ["Давление", hasValue("давление за 3 дня") ? "ok" : "missing"], ["Сердце", hasLipids ? "attention" : "missing"]], text: "Метаболический контур пока неполный: есть глюкоза, HbA1c и липиды, но не хватает окружности талии и давления."},
    {title: "Контур энергии", nodes: [["Сон", latestCheckin() ? "ok" : "missing"], ["Стресс", latestCheckin() ? "attention" : "missing"], ["Ферритин / D / B12", state.biomarkers.some((b) => ["Ферритин", "Витамин D", "B12"].includes(b.label)) ? "attention" : "missing"], ["Активность", latestCheckin() ? "ok" : "missing"], ["Энергия", latestCheckin() ? "ok" : "missing"]], text: "Усталость нельзя объяснять одним фактором. Приложение связывает сон, стресс, дефициты, активность и субъективную энергию."},
    {title: "Респираторный контур", nodes: [["Курение/вейп", hasValue("курение") || hasValue("вейп") ? "ok" : "missing"], ["Кашель/одышка", hasValue("кашель") || hasValue("одышка") ? "attention" : "missing"], ["Сатурация", hasValue("сатурация") ? "ok" : "missing"], ["Нагрузка", hasValue("переносимость нагрузки") ? "ok" : "missing"], ["Врач", redFlags().some((f) => f.type === "resp") ? "alert" : "missing"]], text: "Для оценки дыхательного блока нужны данные о курении, кашле, одышке, сатурации и переносимости нагрузки."}
  ];
  contourEl.innerHTML = contours.map((c) => `<div class="contour-card"><strong>${c.title}</strong><div class="contour-line">${c.nodes.map(([label, st]) => node(label, st)).join("<b>→</b>")}</div><p class="muted">${c.text}</p></div>`).join("");
}

function renderMap() {
  if (document.body.dataset.page !== "map") return;
  state.mapOpened = true;
  saveState();
  const data = systemData();
  const attention = data.filter((s) => ["orange", "red"].includes(s.signal));
  const low = data.filter((s) => s.completion < 35);
  document.getElementById("map-title").textContent = state.biomarkers.length ? `Карта: ${data.length} систем, ${attention.length} сигналов внимания` : "Добавьте демо-анализ, чтобы карта ожила";
  document.getElementById("map-lead").textContent = state.biomarkers.length ? `Приложение разделяет заполненность данных и сигнал внимания. Так “мало данных” не выглядит как плохой статус.` : "Без анализов карта видит профиль, дыхание, сон и check-in, но не видит биохимию и липиды.";
  document.getElementById("map-summary").textContent = attention.length ? `${attention.length} системы требуют внимания: ${attention.map((s) => s.name.toLowerCase()).join(", ")}. Первый шаг: ${attention[0].next}` : `${low.length} системам не хватает данных. Первый шаг: ${low[0]?.next || "продолжать check-in"}`;
  document.getElementById("map-priority-chips").innerHTML = [attention[0]?.next, low[0]?.next].filter(Boolean).map((x) => `<span class="chip">${x}</span>`).join("");
  renderContours();
  document.getElementById("systems-list").innerHTML = data.map((s) => `<article class="card system-card">
    <div class="card-head"><div><h2>${s.name}</h2><p class="muted">${systemSummary(s)}</p></div><span class="badge ${s.signal}">${signalText(s.signal)}</span></div>
    <div class="dual-status">
      <div><span>Заполненность данных</span><strong>${s.completion}%</strong><div class="progress"><i style="width:${s.completion}%"></i></div></div>
      <div><span>Сигнал внимания</span><strong class="${s.signal}">${signalText(s.signal)}</strong></div>
    </div>
    <div class="system-detail">
      <div class="kv"><span>Есть данные</span><strong>${s.present.join(", ") || "пока нет"}</strong></div>
      <div class="kv"><span>Не хватает</span><strong>${s.missing.join(", ") || "нет ключевых пробелов"}</strong></div>
      <div class="kv"><span>Показатели</span><strong>${s.related.map((b) => `${b.label} ${b.value} ${b.unit}`).join(", ") || "нет"}</strong></div>
      <p class="muted">${s.next}</p>
    </div>
    <button class="btn secondary full" type="button">Открыть детали</button>
  </article>`).join("");
  document.querySelectorAll(".system-card").forEach((card) => card.onclick = () => card.classList.toggle("open"));
}

function parseBiomarkers(text) {
  return biomarkers.map((item) => {
    const rx = new RegExp(`${item.key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\D+(\\d+[,.]?\\d*)`, "i");
    const match = text.match(rx);
    if (!match) return null;
    const value = Number(match[1].replace(",", "."));
    let status = "норма";
    if (item.min != null && value < item.min) status = "ниже";
    if (item.max != null && value > item.max) status = value <= item.max * 1.15 ? "погранично" : "выше";
    if (item.label === "Ферритин" && value >= 30 && value <= 45) status = "нижняя часть референса";
    return {...item, id: `${item.key}-${Date.now()}-${Math.random().toString(16).slice(2)}`, value, ref: `${item.min}–${item.max}`, status};
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
    </div>`).join("") : "Пока нет показателей. Добавьте демо-анализ, чтобы увидеть полный сценарий.";
    table.querySelectorAll("input").forEach((input) => input.oninput = () => { parsed[input.dataset.i][input.dataset.k] = input.value; });
  };
  document.getElementById("insert-demo-lab").onclick = () => {
    document.getElementById("lab-text").value = demoLabText;
    parsed = parseBiomarkers(demoLabText);
    draw();
    document.getElementById("labs-message").textContent = "Демо-анализ добавлен: сохраните показатели, чтобы обновить карту, ТО-события и вопросы врачу.";
    document.getElementById("labs-message").classList.remove("hidden");
  };
  document.getElementById("parse-lab").onclick = () => { parsed = parseBiomarkers(document.getElementById("lab-text").value || demoLabText); draw(); };
  document.getElementById("manual-marker").onclick = () => { parsed.push({id: `${Date.now()}`, label: "Новый показатель", value: "", unit: "", ref: "—", status: "проверить вручную", system: "Данные вручную"}); draw(); };
  document.getElementById("save-biomarkers").onclick = () => {
    state.biomarkers = parsed;
    ensureMaintenance();
    saveState();
    document.getElementById("labs-message").textContent = `Карта организма обновлена: ${new Set(state.biomarkers.map((b) => b.system)).size} систем получили новые данные. Созданы ТО-события и вопросы врачу.`;
    document.getElementById("labs-message").classList.remove("hidden");
    renderAnalysis();
  };
  draw();
  renderAnalysis();
}

function renderAnalysis() {
  const el = document.getElementById("lab-analysis");
  if (!el) return;
  if (!state.biomarkers.length) {
    el.innerHTML = "После сохранения появится разбор: что спокойно, что требует внимания, какие системы обновились и что спросить у врача.";
    return;
  }
  el.innerHTML = `
    <div><strong>Разбор демо-анализа.</strong> По демо-анализу обновлены 8 систем организма. Большинство базовых показателей крови, печени, почек и щитовидной железы находятся в пределах референсов лаборатории. Основные зоны внимания: липидный профиль, углеводный обмен и витамин D.</div>
    <div><strong>Что спокойно.</strong><ul><li>Общий анализ крови без заметных отклонений по демо-данным.</li><li>Показатели печени АЛТ, АСТ и ГГТ находятся в пределах референсов.</li><li>Креатинин находится в пределах референса.</li><li>ТТГ и свободный Т4 находятся в референсном диапазоне.</li></ul></div>
    <div><strong>Что требует внимания.</strong><ul><li>Общий холестерин и ЛПНП выше референса лаборатории. Это не диагноз, но повод обсудить сердечно-сосудистые риски со специалистом.</li><li>Глюкоза и HbA1c находятся рядом с верхней границей. Имеет смысл оценивать эти показатели в динамике и связать их с питанием, активностью, весом и окружностью талии.</li><li>Витамин D ниже референса. Коррекцию дозировок не стоит подбирать самостоятельно, лучше обсудить с врачом.</li><li>Ферритин находится в нижней части референса. Если есть усталость, выпадение волос или снижение выносливости, это стоит обсудить со специалистом.</li></ul></div>
    <div><strong>Следующие безопасные шаги.</strong><ol><li>Добавить давление утром и вечером в течение 3 дней.</li><li>Добавить окружность талии.</li><li>Пройти миссию “Обмен веществ”.</li><li>Сформировать вопросы врачу по липидам, витамину D и ферритину.</li><li>Повторить ключевые показатели в динамике по рекомендации специалиста.</li></ol></div>
    <div><strong>Вопросы врачу.</strong><ul><li>Нужно ли дополнительно оценить сердечно-сосудистый риск с учётом ЛПНП?</li><li>Какие целевые значения липидов подходят для моего профиля?</li><li>Нужно ли проверять инсулин и HOMA-IR на фоне глюкозы и HbA1c?</li><li>Как корректно оценить и восполнить витамин D?</li><li>Может ли ферритин в нижней части референса быть связан с усталостью?</li></ul></div>
    <div class="muted">Приложение не ставит диагноз и не заменяет врача. Выводы носят информационный и профилактический характер.</div>
    <a class="btn full" href="/2/profile.html#report">Сформировать отчёт для врача</a>`;
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
    8: p.waist,
    9: state.maintenance.some((e) => e.title.includes("давление") && e.status === "выполнено"),
    10: new Set(state.checkins.map((c) => c.date)).size >= 3,
    11: state.biomarkers.length,
    12: state.mapOpened,
    13: state.report
  };
}

function missionPercent(id) {
  const mission = missionDefinitions.find((m) => m.id === id) || missionDefinitions[0];
  const manual = state.missionTasks[id] || {};
  const auto = id === "passport" ? autoPassportTasks() : {};
  const count = mission.tasks.filter((_, index) => manual[index] || auto[index]).length;
  return Math.round((count / mission.tasks.length) * 100);
}

function taskReason(task) {
  if (task.includes("давление")) return "Закрывает главный пробел в блоке “Сердце и сосуды” и улучшает заполненность карты.";
  if (task.includes("окружность")) return "Уточняет метаболический контур: талия → глюкоза/HbA1c → липиды → давление.";
  if (task.includes("check-in")) return "Даёт динамику, чтобы приложение видело не один день, а закономерность.";
  if (task.includes("демо-анализ")) return "Даёт карте реальные показатели: липиды, витамин D, ферритин, глюкозу и HbA1c.";
  if (task.includes("карту")) return "Показывает, какие системы получили данные и где есть сигнал внимания.";
  if (task.includes("отчёт")) return "Готовит текст, который можно скопировать и показать врачу.";
  return "Добавляет данные, которые делают карту и отчёт точнее.";
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
    const before = missionPercent(box.dataset.m);
    state.missionTasks[box.dataset.m] ||= {};
    state.missionTasks[box.dataset.m][box.dataset.i] = box.checked;
    saveState();
    const after = missionPercent(box.dataset.m);
    document.getElementById("mission-headline").textContent = `Прогресс миссии: ${before}% → ${after}%. Выполненное задание делает карту или отчёт точнее.`;
    renderMissions();
  });
}

function profileBlocks() {
  const p = state.profile;
  return [
    ["Личные данные", p.name && p.age && p.sex && p.height && p.weight, "Нужны для возраста, веса, динамики и структуры отчёта."],
    ["Цели", p.goals?.length, "Цели влияют на миссии и порядок следующих шагов."],
    ["Жалобы", p.complaints, "Связывают анализы с самочувствием, не превращая цифры в диагноз."],
    ["Лекарства", p.medications, "Важны для блока печени, ЖКТ и безопасного отчёта врачу."],
    ["БАДы", p.supplements, "Эти данные важны для оценки печени, ЖКТ и подготовки отчёта врачу."],
    ["Хронические состояния", p.chronic, "Помогают понять, какие показатели смотреть внимательнее."],
    ["Аллергии", p.allergies, "Нужны для аккуратного медицинского контекста."],
    ["Семейный анамнез", p.family, "Важен для блока “Сердце и сосуды” и профилактического ТО."],
    ["Образ жизни", p.lifestyle || p.alcohol || p.nutrition, "Связывает индекс ресурса с активностью, сном, питанием и нагрузкой."],
    ["Дыхание и лёгкие", p.smoking || p.cough || p.dyspnea || p.saturation, "Нужны курение, кашель, одышка, сатурация и переносимость нагрузки."],
    ["Сон и нервная система", p.sleepHours || p.headaches || p.anxiety || p.concentration, "Отделяет сон от стресса и неврологических симптомов."],
    ["Документы и анализы", state.biomarkers.length, state.biomarkers.length ? `Сохранено показателей: ${state.biomarkers.length}.` : "Без анализов карта видит только профиль и check-in."],
    ["Демо-режим", true, "Позволяет быстро проверить сценарий без ручного ввода."]
  ].map(([title, done, text]) => ({title, done, text}));
}

function renderProfile() {
  if (document.body.dataset.page !== "profile") return;
  const p = state.profile;
  document.getElementById("profile-title").textContent = p.name ? `Паспорт здоровья: ${p.name}` : "Паспорт здоровья";
  document.getElementById("profile-lead").textContent = `Паспорт заполнен на ${passportScore()}%. Больше всего не хватает: ${missingPassport().join(", ") || "регулярной динамики"}.`;
  document.getElementById("passport-score").textContent = `${passportScore()}%`;
  document.getElementById("passport-progress").style.width = `${passportScore()}%`;
  document.getElementById("passport-summary").textContent = `Больше всего не хватает: ${missingPassport().join(", ") || "регулярной динамики"}. Это влияет на карту и отчёт для врача.`;
  const fields = [
    ["name", "Имя"], ["age", "Возраст"], ["sex", "Пол"], ["height", "Рост"], ["weight", "Вес"], ["waist", "Окружность талии"], ["country", "Страна"],
    ["complaints", "Жалобы"], ["chronic", "Хронические состояния"], ["medications", "Лекарства"], ["supplements", "БАДы"], ["allergies", "Аллергии"], ["family", "Семейный анамнез"],
    ["lifestyle", "Образ жизни"], ["alcohol", "Алкоголь"], ["nutrition", "Питание"], ["giComplaints", "Жалобы ЖКТ"], ["liverDocs", "УЗИ / ФГДС / заключения"],
    ["smoking", "Курение: никогда / сейчас / раньше"], ["smokingYears", "Стаж курения"], ["vape", "Вейп"], ["cough", "Кашель"], ["dyspnea", "Одышка"], ["saturation", "Сатурация"], ["snoring", "Храп"], ["daytimeSleepiness", "Дневная сонливость"], ["exerciseTolerance", "Переносимость нагрузки"], ["lungDocs", "Рентген / КТ / спирометрия"],
    ["sleepHours", "Длительность сна"], ["awakenings", "Пробуждения"], ["lateCaffeine", "Поздний кофеин"], ["eveningScreen", "Вечерний экран"], ["sleepRegularity", "Регулярность сна"],
    ["headaches", "Головные боли"], ["dizziness", "Головокружение"], ["numbness", "Онемение"], ["weakness", "Слабость"], ["speech", "Нарушение речи"], ["vision", "Нарушение зрения"], ["seizures", "Судороги"], ["syncope", "Потеря сознания"], ["cognitive", "Когнитивные жалобы"], ["anxiety", "Тревожность"], ["concentration", "Концентрация"]
  ];
  document.getElementById("profile-form").innerHTML = fields.map(([key, label]) => {
    if (key.length > 7) return `<label>${label}<textarea data-profile="${key}" rows="2">${p[key] || ""}</textarea></label>`;
    return `<label>${label}<input data-profile="${key}" value="${p[key] || ""}"></label>`;
  }).join("") + `<label>Цели<input data-profile="goals" value="${(p.goals || []).join(", ")}"></label><button class="btn full" type="submit">Сохранить профиль</button>`;
  document.querySelectorAll("input[data-profile]").forEach((input) => { if (input.dataset.profile !== "goals") input.value = p[input.dataset.profile] || ""; });
  document.getElementById("profile-form").onsubmit = (event) => {
    event.preventDefault();
    document.querySelectorAll("[data-profile]").forEach((input) => {
      state.profile[input.dataset.profile] = input.dataset.profile === "goals" ? input.value.split(",").map((x) => x.trim()).filter(Boolean) : input.value;
    });
    saveState();
    renderProfile();
  };
  document.getElementById("profile-blocks").innerHTML = profileBlocks().map((block) => `<article class="card"><div class="card-head"><div><h2>${block.title}</h2><p class="muted">${block.text}</p></div><span class="badge ${block.done ? "green" : "yellow"}">${block.done ? "заполнено" : "не заполнено"}</span></div><button class="btn secondary full" type="button" onclick="document.getElementById('profile-form').scrollIntoView({behavior:'smooth'})">Редактировать</button></article>`).join("");
  renderMaintenance();
  bindProfileButtons();
}

function renderMaintenance() {
  ensureMaintenance();
  document.getElementById("maintenance-list").innerHTML = state.maintenance.map((e, i) => `<div class="event"><div class="card-head"><strong>${e.title}</strong><span class="pill">${e.status}</span></div><p class="muted">${formatDate(e.date)} · ${e.type} · ${e.system}</p><p class="muted">${e.why}</p><button class="btn secondary full" data-event="${i}" type="button">Отметить выполненным</button></div>`).join("");
  document.querySelectorAll("[data-event]").forEach((button) => button.onclick = () => {
    state.maintenance[button.dataset.event].status = "выполнено";
    saveState();
    alert("Событие ТО выполнено. Заполненность связанной системы стала точнее.");
    renderProfile();
  });
}

function bindProfileButtons() {
  document.getElementById("build-report").onclick = () => {
    state.report = buildReport();
    saveState();
    document.getElementById("doctor-report").value = state.report;
    alert("Отчёт готов. Его можно скопировать и показать врачу.");
  };
  document.getElementById("copy-report").onclick = () => navigator.clipboard?.writeText(document.getElementById("doctor-report").value || buildReport());
  document.getElementById("mark-report-ready").onclick = () => {
    state.report = document.getElementById("doctor-report").value || buildReport();
    state.missionTasks.passport ||= {};
    state.missionTasks.passport[13] = true;
    saveState();
    alert(`Отчёт отмечен как подготовленный. Прогресс миссии: ${missionPercent("passport")}%.`);
  };
  document.getElementById("save-text-report").onclick = () => {
    const blob = new Blob([document.getElementById("doctor-report").value || buildReport()], {type: "text/plain"});
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "to-organizma-report-v2.txt";
    link.click();
  };
  document.getElementById("demo-profile").onclick = () => { fillDemoProfile(); renderProfile(); };
  document.getElementById("demo-lab-profile").onclick = () => { state.biomarkers = parseBiomarkers(demoLabText); ensureMaintenance(); saveState(); alert("Карта организма обновлена: 8 систем получили новые данные."); renderProfile(); };
  document.getElementById("demo-checkins").onclick = () => { addDemoCheckins(); renderProfile(); };
  document.getElementById("reset-demo").onclick = () => { localStorage.removeItem(STORAGE_KEY); location.href = "/2/"; };
  document.getElementById("doctor-report").value = state.report || "";
}

function buildReport() {
  const p = state.profile;
  return `Пациент: ${p.name || "Роман"}, ${p.age || "38"} лет, ${p.sex || "мужской пол"}.
Цели: ${(p.goals || ["контроль здоровья", "повышение энергии", "понимание анализов"]).join(", ")}.
Жалобы: ${p.complaints || "не заполнены"}.
Лекарства: ${p.medications || "не заполнены"}.
БАДы: ${p.supplements || "не заполнены"}.

По демо-анализу:
* общий анализ крови без заметных отклонений по указанным референсам;
* глюкоза 5.7 ммоль/л и HbA1c 5.7% находятся рядом с верхней границей;
* общий холестерин 6.2 ммоль/л и ЛПНП 4.1 ммоль/л выше референса;
* витамин D 21 нг/мл ниже референса;
* ферритин 34 нг/мл в нижней части референса;
* ТТГ и свободный Т4 в пределах референса.

Вопросы для обсуждения:
1. Нужно ли дополнительно оценить сердечно-сосудистый риск?
2. Какие целевые значения липидов подходят с учётом возраста и анамнеза?
3. Нужна ли дополнительная оценка углеводного обмена?
4. Как корректно оценить и восполнить витамин D?
5. Может ли ферритин быть связан с жалобами, если они есть?

Примечание: приложение не ставит диагноз и не заменяет консультацию врача.`;
}

function fillDemoProfile() {
  state.profile = {...state.profile, name: "Роман", age: "38", sex: "мужской", height: "180", weight: "82", goals: ["понять анализы", "повысить энергию", "контролировать здоровье"], country: "Россия", lifestyle: "Сидячая работа, 2-3 прогулки в неделю", smoking: "никогда", vape: "нет", cough: "нет", dyspnea: "нет"};
  state.onboarded = true;
  ensureMaintenance();
  saveState();
}

function addDemoCheckins(silent = false) {
  state.checkins = [-6, -5, -4, -3, -2, -1, 0].map((offset, i) => {
    const c = {date: todayISO(offset), sleep: [6, 7, 5, 7, 8, 6, 7][i], energy: [6, 7, 5, 6, 8, 6, 7][i], stress: [7, 5, 8, 6, 4, 7, 5][i], activity: [4, 6, 3, 5, 7, 4, 6][i], symptoms: i === 2 ? "mild" : "none", symptomList: i === 2 ? ["усталость"] : [], note: ""};
    c.score = scoreCheckin(c);
    return c;
  });
  saveState();
  if (!silent) alert("Добавлены 7 дней check-in. Недельная динамика теперь показывает закономерности.");
}

function init() {
  nav();
  if (!state.onboarded && document.body.dataset.page !== "today") renderOnboarding();
  ensureMaintenance();
  renderToday();
  renderMap();
  renderLabs();
  renderMissions();
  renderProfile();
  if ("serviceWorker" in navigator) navigator.serviceWorker.getRegistrations().then((rs) => rs.forEach((r) => r.unregister())).catch(() => undefined);
}

init();
