const questions = [
  {
    id: "concern",
    title: "Что сейчас беспокоит больше всего?",
    subtitle: "Выберите один вариант, который точнее описывает вашу ситуацию.",
    type: "single",
    options: [
      { value: "pressure", label: "Давление", description: "Повышается, понижается или стало нестабильным" },
      { value: "chest", label: "Дискомфорт в груди", description: "Боль, давление, жжение или чувство тяжести" },
      { value: "rhythm", label: "Пульс и сердцебиение", description: "Перебои, учащенный или редкий пульс" },
      { value: "breathing", label: "Одышка и слабость", description: "Стало сложнее переносить привычную нагрузку" },
      { value: "swelling", label: "Отеки", description: "Отекают ноги или обувь стала теснее к вечеру" },
      { value: "known", label: "Уже есть диагноз", description: "Хочу понять, актуален ли текущий контроль" },
      { value: "prevention", label: "Профилактика", description: "Ничего не беспокоит, хочу проверить состояние" },
    ],
  },
  {
    id: "emergency",
    title: "Есть ли что-то из этого прямо сейчас?",
    subtitle: "Этот вопрос нужен, чтобы не пропустить ситуацию, когда квиз проходить не стоит.",
    type: "single",
    options: [
      { value: "chest_now", label: "Сильная или нарастающая боль в груди" },
      { value: "combo", label: "Боль с одышкой, холодным потом или тошнотой" },
      { value: "fainting", label: "Потеря сознания или предобморочное состояние" },
      { value: "stroke", label: "Внезапная слабость, онемение или нарушение речи" },
      { value: "none", label: "Ничего из перечисленного" },
    ],
  },
  {
    id: "duration",
    title: "Как давно это происходит?",
    subtitle: "Даже приблизительный ответ поможет точнее сформулировать итог.",
    type: "single",
    options: [
      { value: "today", label: "Началось сегодня или совсем недавно" },
      { value: "days", label: "Несколько дней" },
      { value: "weeks", label: "Несколько недель" },
      { value: "months", label: "Несколько месяцев или дольше" },
      { value: "none", label: "Симптомов нет" },
    ],
  },
  {
    id: "frequency",
    title: "Как часто это повторяется?",
    subtitle: "Если речь о профилактике, выберите последний вариант.",
    type: "single",
    options: [
      { value: "daily", label: "Постоянно или почти каждый день" },
      { value: "weekly", label: "Несколько раз в неделю" },
      { value: "monthly", label: "Несколько раз в месяц" },
      { value: "rare", label: "Было один или два раза" },
      { value: "none", label: "Не повторяется или симптомов нет" },
    ],
  },
  {
    id: "conditions",
    title: "Что вам уже известно о своем состоянии?",
    subtitle: "Можно выбрать несколько вариантов.",
    type: "multiple",
    exclusive: ["none", "unknown"],
    options: [
      { value: "hypertension", label: "Повышенное давление" },
      { value: "rhythm", label: "Нарушение ритма" },
      { value: "cholesterol", label: "Повышенный холестерин" },
      { value: "diabetes", label: "Диабет" },
      { value: "event", label: "Были инфаркт, инсульт или операция" },
      { value: "meds", label: "Принимаю постоянные препараты" },
      { value: "none", label: "Диагнозов нет" },
      { value: "unknown", label: "Не знаю" },
    ],
  },
  {
    id: "factors",
    title: "Какие факторы относятся к вам?",
    subtitle: "Можно выбрать несколько вариантов.",
    type: "multiple",
    exclusive: ["none", "unknown"],
    options: [
      { value: "smoking", label: "Курение" },
      { value: "activity", label: "Мало движения" },
      { value: "weight", label: "Лишний вес" },
      { value: "stress", label: "Много стресса или мало сна" },
      { value: "family", label: "У близких рано появились болезни сердца" },
      { value: "none", label: "Ничего из перечисленного" },
      { value: "unknown", label: "Не уверен" },
    ],
  },
  {
    id: "checkup",
    title: "Когда вы в последний раз проверяли сердце?",
    subtitle: "Подойдет дата последнего планового обследования.",
    type: "single",
    options: [
      { value: "recent", label: "Меньше 6 месяцев назад" },
      { value: "year", label: "От 6 до 12 месяцев назад" },
      { value: "old", label: "Больше года назад" },
      { value: "never", label: "Никогда" },
      { value: "unknown", label: "Не помню" },
    ],
  },
  {
    id: "goal",
    title: "Что вы хотите получить в первую очередь?",
    subtitle: "Последний вопрос. После него появится персональный результат.",
    type: "single",
    options: [
      { value: "symptoms", label: "Понять, как действовать при симптомах" },
      { value: "numbers", label: "Разобраться с давлением или пульсом" },
      { value: "treatment", label: "Проверить текущий план наблюдения" },
      { value: "prevention", label: "Получить профилактический ориентир" },
      { value: "prepare", label: "Подготовиться к записи" },
    ],
  },
];

const labels = {
  concern: Object.fromEntries(questions[0].options.map((item) => [item.value, item.label])),
  duration: Object.fromEntries(questions[2].options.map((item) => [item.value, item.label])),
  frequency: Object.fromEntries(questions[3].options.map((item) => [item.value, item.label])),
  checkup: Object.fromEntries(questions[6].options.map((item) => [item.value, item.label])),
};

const concernCopy = {
  pressure: {
    focus: "нестабильное давление",
    observe: "Запишите несколько спокойных измерений, время и самочувствие рядом с каждым значением.",
  },
  chest: {
    focus: "дискомфорт в груди",
    observe: "Отметьте, когда появляется дискомфорт, сколько длится и связан ли он с нагрузкой.",
  },
  rhythm: {
    focus: "пульс и сердцебиение",
    observe: "Зафиксируйте время, длительность эпизода и пульс, если можете измерить его спокойно.",
  },
  breathing: {
    focus: "одышка и снижение выносливости",
    observe: "Отметьте, при какой нагрузке появляется одышка и как быстро проходит после отдыха.",
  },
  swelling: {
    focus: "отеки",
    observe: "Запишите, когда отеки заметнее, симметричны ли они и меняются ли к утру.",
  },
  known: {
    focus: "контроль известного состояния",
    observe: "Соберите последние показатели и отметьте, изменилось ли самочувствие на фоне текущего режима.",
  },
  prevention: {
    focus: "профилактика",
    observe: "Подготовьте обычные показатели давления и пульса, если измеряли их в последнее время.",
  },
};

const state = {
  step: -1,
  answers: {},
  emergency: false,
};

const quizContent = document.querySelector("#quizContent");
const progressWrap = document.querySelector("#progressWrap");
const progressLabel = document.querySelector("#progressLabel");
const progressSegments = document.querySelector("#progressSegments");
const backButton = document.querySelector("#backButton");
const bookingDialog = document.querySelector("#bookingDialog");
const bookingForm = document.querySelector("#bookingForm");

function renderStart() {
  state.step = -1;
  state.emergency = false;
  progressWrap.hidden = true;
  quizContent.innerHTML = `
    <div class="screen start-screen">
      <span class="screen-kicker">Короткий квиз о самочувствии</span>
      <h1>Что сейчас важно проверить?</h1>
      <p class="screen-subtitle">
        Ответьте на 8 вопросов и получите персональный ориентир по вашим ответам.
      </p>
      <div class="start-actions">
        <button class="primary-button" id="startButton" type="button">
          Начать квиз <span aria-hidden="true">→</span>
        </button>
        <span class="start-note">Без регистрации</span>
      </div>
    </div>
  `;
  document.querySelector("#startButton").addEventListener("click", () => goToStep(0));
}

function renderProgress() {
  progressWrap.hidden = false;
  progressLabel.textContent = `Вопрос ${state.step + 1} из ${questions.length}`;
  backButton.style.visibility = state.step === 0 ? "hidden" : "visible";
  progressSegments.innerHTML = questions
    .map((_, index) => {
      const className = index < state.step
        ? "is-complete"
        : index === state.step
          ? "is-current"
          : "";
      return `<span class="progress-segment ${className}"></span>`;
    })
    .join("");
}

function goToStep(index) {
  state.step = Math.max(0, Math.min(index, questions.length - 1));
  state.emergency = false;
  renderProgress();
  renderQuestion(questions[state.step]);
}

function renderQuestion(question) {
  const current = state.answers[question.id];
  const selected = Array.isArray(current) ? current : current ? [current] : [];

  quizContent.innerHTML = `
    <div class="screen question-screen">
      <span class="screen-kicker">Ваше самочувствие</span>
      <h2>${question.title}</h2>
      <p class="screen-subtitle">${question.subtitle}</p>
      <div class="options-grid" role="${question.type === "single" ? "radiogroup" : "group"}">
        ${question.options.map((option) => optionMarkup(question, option, selected)).join("")}
      </div>
      ${question.type === "multiple" ? `
        <div class="continue-row">
          <button class="primary-button" id="continueButton" type="button" ${selected.length ? "" : "disabled"}>
            Продолжить <span aria-hidden="true">→</span>
          </button>
        </div>
      ` : ""}
    </div>
  `;

  document.querySelectorAll(".option-button").forEach((button) => {
    button.addEventListener("click", () => selectOption(question, button.dataset.value));
  });

  const continueButton = document.querySelector("#continueButton");
  if (continueButton) {
    continueButton.addEventListener("click", nextStep);
  }
}

function optionMarkup(question, option, selected) {
  const isSelected = selected.includes(option.value);
  const role = question.type === "single" ? "radio" : "checkbox";
  return `
    <button
      class="option-button ${isSelected ? "is-selected" : ""}"
      type="button"
      data-value="${option.value}"
      role="${role}"
      aria-checked="${isSelected}"
    >
      <span class="option-marker" aria-hidden="true">✓</span>
      <span class="option-copy">
        <span class="option-label">${option.label}</span>
        ${option.description ? `<span class="option-description">${option.description}</span>` : ""}
      </span>
    </button>
  `;
}

function selectOption(question, value) {
  if (question.type === "single") {
    state.answers[question.id] = value;

    if (question.id === "emergency" && value !== "none") {
      state.emergency = true;
      window.setTimeout(renderEmergency, 160);
      return;
    }

    renderQuestion(question);
    window.setTimeout(nextStep, 180);
    return;
  }

  const existing = Array.isArray(state.answers[question.id])
    ? [...state.answers[question.id]]
    : [];
  const exclusive = question.exclusive || [];
  let updated;

  if (exclusive.includes(value)) {
    updated = existing.includes(value) ? [] : [value];
  } else {
    updated = existing.filter((item) => !exclusive.includes(item));
    updated = updated.includes(value)
      ? updated.filter((item) => item !== value)
      : [...updated, value];
  }

  state.answers[question.id] = updated;
  renderQuestion(question);
}

function nextStep() {
  if (state.step === questions.length - 1) {
    renderResult();
    return;
  }
  goToStep(state.step + 1);
}

function previousStep() {
  if (state.emergency) {
    state.emergency = false;
    goToStep(1);
    return;
  }
  if (state.step > 0) goToStep(state.step - 1);
}

function renderEmergency() {
  progressWrap.hidden = true;
  quizContent.innerHTML = `
    <div class="screen emergency-screen">
      <span class="screen-kicker">Не продолжайте квиз</span>
      <h2>Сейчас важнее получить экстренную помощь</h2>
      <p class="screen-subtitle">
        Такие симптомы требуют быстрой оценки. Позвоните 112 или 103 и следуйте указаниям диспетчера. Не добирайтесь за рулем самостоятельно.
      </p>
      <div class="emergency-actions">
        <a class="primary-button emergency-call" href="tel:112">Позвонить 112</a>
        <button class="secondary-button" id="changeEmergencyAnswer" type="button">Изменить ответ</button>
      </div>
    </div>
  `;
  document.querySelector("#changeEmergencyAnswer").addEventListener("click", previousStep);
}

function buildResult() {
  const answer = state.answers;
  const conditions = answer.conditions || [];
  const factors = answer.factors || [];
  const hasKnownCondition = answer.concern === "known"
    || conditions.some((item) => !["none", "unknown"].includes(item));
  const noSymptoms = answer.concern === "prevention"
    || answer.duration === "none"
    || answer.frequency === "none";
  const frequent = ["daily", "weekly"].includes(answer.frequency);
  const recent = ["today", "days"].includes(answer.duration);
  const checkupOld = ["old", "never", "unknown"].includes(answer.checkup);
  const concern = concernCopy[answer.concern] || concernCopy.prevention;

  let title;
  let lead;

  if (hasKnownCondition) {
    title = "Проверьте, актуален ли текущий контроль";
    lead = `Ваш главный фокус: ${concern.focus}. По ответам уже есть данные, которые стоит собрать в одном месте и сопоставить с нынешним самочувствием.`;
  } else if (noSymptoms) {
    title = "Подойдет плановая профилактическая проверка";
    lead = "Сейчас вы не отмечаете регулярных симптомов. Основная задача: зафиксировать исходные показатели и выбрать удобный ритм профилактического контроля.";
  } else if (frequent || recent) {
    title = "Лучше не откладывать оценку симптомов";
    lead = `Ваш главный фокус: ${concern.focus}. Симптомы появились недавно или повторяются регулярно, поэтому полезно подготовить наблюдения и запланировать следующий шаг.`;
  } else {
    title = "Запланируйте спокойный разбор симптомов";
    lead = `Ваш главный фокус: ${concern.focus}. Ответы не определяют причину, но помогут быстрее и предметнее обсудить ситуацию.`;
  }

  const prepare = hasKnownCondition
    ? "Возьмите список препаратов, прошлые заключения и свежие записи показателей."
    : "Соберите прошлые заключения и список препаратов, если они есть.";
  const plan = checkupOld
    ? "Последняя проверка была давно. Удобно начать с плановой записи и уточнить дальнейший объем оценки."
    : "Недавние результаты помогут не повторять лишнее. Возьмите их с собой на запись.";

  return {
    title,
    lead,
    observe: concern.observe,
    prepare,
    plan,
    summary: [
      labels.concern[answer.concern],
      labels.frequency[answer.frequency],
      factors.length > 0 && !factors.includes("none") ? `Факторов отмечено: ${factors.filter((item) => item !== "unknown").length}` : null,
      labels.checkup[answer.checkup],
    ].filter(Boolean),
  };
}

function renderResult() {
  progressWrap.hidden = true;
  const result = buildResult();
  quizContent.innerHTML = `
    <div class="screen result-screen">
      <span class="result-label">Ваш персональный ориентир</span>
      <h2>${result.title}</h2>
      <p class="result-lead">${result.lead}</p>
      <ul class="answer-summary" aria-label="Кратко о ваших ответах">
        ${result.summary.map((item) => `<li>${item}</li>`).join("")}
      </ul>
      <div class="next-steps">
        <article class="next-step">
          <span>Наблюдайте</span>
          <p>${result.observe}</p>
        </article>
        <article class="next-step">
          <span>Подготовьте</span>
          <p>${result.prepare}</p>
        </article>
        <article class="next-step">
          <span>Учтите</span>
          <p>${result.plan}</p>
        </article>
      </div>
      <div class="result-actions">
        <button class="primary-button" id="bookingButton" type="button">Записаться</button>
        <button class="text-button" id="restartButton" type="button">Пройти заново</button>
      </div>
    </div>
  `;

  document.querySelector("#bookingButton").addEventListener("click", () => bookingDialog.showModal());
  document.querySelector("#restartButton").addEventListener("click", restartQuiz);
}

function restartQuiz() {
  state.answers = {};
  state.emergency = false;
  renderStart();
}

backButton.addEventListener("click", previousStep);

bookingForm.addEventListener("submit", (event) => {
  event.preventDefault();
  document.querySelector("#bookingContent").innerHTML = `
    <div class="booking-success">
      <div class="booking-success-mark" aria-hidden="true">✓</div>
      <span class="result-label">Форма работает</span>
      <h2>Данные заполнены</h2>
      <p>В демоверсии они остались в браузере. Для публикации подключите нужный сервис записи.</p>
      <form method="dialog">
        <button class="primary-button form-submit" value="close">Готово</button>
      </form>
    </div>
  `;
});

bookingDialog.addEventListener("click", (event) => {
  const rect = bookingDialog.getBoundingClientRect();
  const clickedOutside = event.clientX < rect.left
    || event.clientX > rect.right
    || event.clientY < rect.top
    || event.clientY > rect.bottom;
  if (clickedOutside) bookingDialog.close();
});

renderStart();
