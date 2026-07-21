import { questions } from "./data/questions.js";
import { APP_CONFIG, RESULT_SLUGS, SLUG_TO_RESULT } from "./data/config.js";
import { hybridRecommendations, resultMeta, results } from "./data/results.js";
import { getAnswer, getQuizResult } from "./lib/scoring.js";
import { trackEvent } from "./lib/analytics.js";

const app = document.querySelector("#app");
const letters = ["A", "B", "C", "D"];
const robotCompanion = document.querySelector(".robot-companion");
const robotExpression = document.querySelector("#robot-expression");
const robotStatus = robotCompanion.querySelector(".robot-status b");
const questionEmotions = [
  ["surprised", "Ева удивлена"],
  ["curious", "Ева размышляет"],
  ["love", "Еве нравится идея"],
  ["determined", "Ева настроена решительно"],
  ["shy", "Ева понимает сомнения"],
  ["laughing", "Ева ловит ваш ритм"],
  ["sad", "Ева считает бюджет"],
  ["angry", "Ева ищет опору"],
];
const resultEmotions = {
  D: ["curious", "Ева нашла причину"],
  S: ["laughing", "Ева выбрала вариант"],
  C: ["surprised", "Ева закончила расчёт"],
  R: ["determined", "Ева видит ваш маршрут"],
};

function setRobotEmotion(emotion, status, alt) {
  robotCompanion.dataset.emotion = emotion;
  robotStatus.textContent = status;
  robotExpression.alt = alt || `${status}, белый робот-проводник`;
  robotExpression.src = `./assets/robot-emotions/robot-${emotion}.png`;
  robotCompanion.classList.remove("is-switching");
  void robotCompanion.offsetWidth;
  robotCompanion.classList.add("is-switching");
}

function preloadRobotEmotions() {
  ["joy", "surprised", "curious", "love", "shy", "determined", "sad", "angry", "laughing", "sleepy"].forEach((emotion) => {
    const image = new Image();
    image.src = `./assets/robot-emotions/robot-${emotion}.png`;
  });
}

const freshState = () => ({
  screen: "start",
  currentQuestion: 0,
  answers: {},
  startedAt: null,
  result: null,
});

function readJSON(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}

let state = { ...freshState(), ...readJSON(APP_CONFIG.storageKey, {}) };

function saveState() {
  localStorage.setItem(APP_CONFIG.storageKey, JSON.stringify(state));
}

function captureAttribution() {
  const params = new URLSearchParams(window.location.search);
  const previous = readJSON(APP_CONFIG.attributionKey, {});
  const keys = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];
  const current = Object.fromEntries(keys.map((key) => [key, params.get(key)]).filter(([, value]) => value));
  const attribution = {
    ...previous,
    ...current,
    landingUrl: previous.landingUrl || window.location.href,
  };
  localStorage.setItem(APP_CONFIG.attributionKey, JSON.stringify(attribution));
  return attribution;
}

const attribution = captureAttribution();

function setScreen(html) {
  app.innerHTML = html;
  app.focus({ preventScroll: true });
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderStart() {
  state = freshState();
  saveState();
  setScreen(`
    <section class="screen start-shell" aria-labelledby="start-title">
      <div class="start-copy">
        <p class="eyebrow">Персональная стратегия</p>
        <h1 id="start-title">Какой лид-квиз принесёт больше заявок именно вашему бизнесу?</h1>
        <p class="lead">Ответьте на 8 вопросов и получите готовую концепцию квиза: механику, вопросы, варианты результатов, дизайн и сценарий дальнейшей воронки.</p>
        <ul class="benefit-list">
          <li>Рекомендация под вашу модель продаж</li>
          <li>Без сложных маркетинговых терминов</li>
          <li>Результат сразу после прохождения</li>
          <li>Время прохождения — около 2 минут</li>
        </ul>
        <div class="start-actions">
          <button class="button button-primary" id="start-quiz" type="button">Определить мой формат</button>
          <p class="microcopy">Без регистрации. Результат появится сразу.</p>
        </div>
      </div>
    </section>
  `);
  setRobotEmotion("joy", "Ева радуется", "Радостный белый робот приветствует пользователя");

  document.querySelector("#start-quiz").addEventListener("click", () => {
    state.screen = "question";
    state.currentQuestion = 0;
    state.startedAt = Date.now();
    saveState();
    trackEvent("quiz_started", { ...attribution });
    renderQuestion();
  });
}

function renderQuestion() {
  const index = Math.max(0, Math.min(state.currentQuestion, questions.length - 1));
  const question = questions[index];
  const selected = state.answers[question.id];
  const progress = ((index + 1) / questions.length) * 100;

  setScreen(`
    <section class="screen quiz-shell" aria-labelledby="question-title">
      <div class="question-top">
        <p class="question-count">Вопрос ${index + 1} из ${questions.length}</p>
        <div class="progress-track" role="progressbar" aria-valuemin="1" aria-valuemax="${questions.length}" aria-valuenow="${index + 1}" aria-label="Прогресс квиза">
          <div class="progress-fill" style="width:${progress}%"></div>
        </div>
      </div>
      <div class="question-card">
        <p class="eyebrow">Настраиваем механику</p>
        <h1 id="question-title">${question.text}</h1>
        <div class="answers" role="group" aria-label="Варианты ответа">
          ${question.answers.map((answer, answerIndex) => `
            <button class="answer ${selected === answer.id ? "is-selected" : ""}" type="button" data-answer="${answer.id}" aria-pressed="${selected === answer.id}">
              <span class="answer-letter">${letters[answerIndex]}</span>
              <span>${answer.text}</span>
              <span class="answer-arrow" aria-hidden="true">→</span>
            </button>
          `).join("")}
        </div>
      </div>
      <div class="question-footer">
        <button class="back-button" id="question-back" type="button">← ${index === 0 ? "На старт" : "Предыдущий вопрос"}</button>
        <span class="save-note">Ответы сохраняются автоматически</span>
      </div>
    </section>
  `);
  setRobotEmotion(...questionEmotions[index]);

  document.querySelectorAll("[data-answer]").forEach((button) => {
    button.addEventListener("click", () => {
      if (button.disabled) return;
      document.querySelectorAll("[data-answer]").forEach((item) => {
        item.disabled = true;
        item.classList.toggle("is-selected", item === button);
        item.setAttribute("aria-pressed", String(item === button));
      });

      const answerId = button.dataset.answer;
      state.answers[question.id] = answerId;
      saveState();
      trackEvent("question_answered", {
        question_id: question.id,
        answer_id: answerId,
        question_number: index + 1,
      });

      window.setTimeout(() => {
        if (index < questions.length - 1) {
          state.currentQuestion = index + 1;
          saveState();
          renderQuestion();
        } else {
          renderAnalysis();
        }
      }, APP_CONFIG.answerDelayMs);
    });
  });

  document.querySelector("#question-back").addEventListener("click", () => {
    if (index === 0) {
      renderStart();
      return;
    }
    state.currentQuestion = index - 1;
    saveState();
    renderQuestion();
  });
}

function renderAnalysis() {
  state.screen = "analysis";
  saveState();
  setScreen(`
    <section class="screen analysis-shell" aria-live="polite">
      <div class="analysis-core">
        <div class="analysis-ring" aria-hidden="true"></div>
        <p class="eyebrow">Финальный шаг</p>
        <h1>Собираем механику вашего квиза</h1>
        <ul class="analysis-lines">
          <li>Анализируем модель принятия решения.</li>
          <li>Определяем главный барьер клиента.</li>
          <li>Выбираем подходящий формат.</li>
          <li>Формируем структуру результата.</li>
        </ul>
      </div>
    </section>
  `);
  setRobotEmotion("sleepy", "Ева обрабатывает ответы", "Задумчивый робот обрабатывает ответы");

  window.setTimeout(() => completeQuiz(), APP_CONFIG.analysisDurationMs);
}

function completeQuiz() {
  const calculated = getQuizResult(state.answers);
  const duration = state.startedAt ? Math.round((Date.now() - state.startedAt) / 1000) : null;
  state.screen = "result";
  state.result = calculated;
  saveState();

  trackEvent("quiz_completed", {
    scores: calculated.scores,
    primary_result: calculated.primary,
    secondary_result: calculated.secondary,
    duration_seconds: duration,
  });

  showResult(calculated.primary, calculated);
}

function hybridText(primary, secondary) {
  const key = [primary, secondary].sort().join("+");
  return hybridRecommendations[key];
}

function resultUrl(code) {
  const url = new URL(window.location.href);
  url.searchParams.set("result", RESULT_SLUGS[code]);
  return url.toString();
}

function buildLessonUrl(code) {
  const url = new URL(APP_CONFIG.lessonUrl);
  const defaults = {
    quiz_result: RESULT_SLUGS[code],
    utm_source: attribution.utm_source || "lead_quiz",
    utm_medium: attribution.utm_medium || "quiz",
    utm_campaign: attribution.utm_campaign || "free_lesson",
    utm_content: attribution.utm_content || RESULT_SLUGS[code],
  };
  Object.entries(defaults).forEach(([key, value]) => url.searchParams.set(key, value));
  return { url: url.toString(), params: defaults };
}

function showResult(code, calculated = null, options = {}) {
  const result = results[code];
  if (!result) return renderStart();
  const meta = resultMeta[code];
  const secondary = calculated?.secondary;
  const isHybrid = Boolean(calculated?.isHybrid && secondary);
  const primarySignal = getAnswer("q1", state.answers.q1)?.short;
  const desiredOutcome = getAnswer("q2", state.answers.q2)?.short;
  const confidence = calculated?.confidence || "direct";
  const shareUrl = resultUrl(code);
  const lesson = buildLessonUrl(code);

  state.screen = "result";
  if (calculated) state.result = calculated;
  saveState();
  window.history.replaceState({}, "", shareUrl);

  setScreen(`
    <section class="screen result-screen" aria-labelledby="result-title">
      <div class="result-hero" style="--result-accent:${meta.accent}">
        <span class="result-badge">Ваш результат</span>
        <h1 id="result-title">${result.title}</h1>
        <p class="lead">${result.subtitle}</p>
        <div class="personal-signal">
          <strong>${primarySignal ? "Что показали ваши ответы" : "Суть рекомендации"}</strong>
          ${primarySignal
            ? `Сейчас ${primarySignal}, а после прохождения человеку особенно важно получить ${desiredOutcome || "понятный следующий шаг"}.`
            : "Этот результат открыт по прямой ссылке. Пройдите тест, чтобы добавить персональное объяснение и гибридную рекомендацию."}
        </div>
      </div>

      <div class="score-strip">
        <span>Рекомендация собрана по вашей модели продаж${secondary ? ` · усилитель: ${resultMeta[secondary].shortName}` : ""}</span>
        <span class="score-dots" aria-hidden="true"><i class="active"></i><i class="active"></i><i class="${confidence === "high" ? "active" : ""}"></i><i class="${confidence === "high" ? "active" : ""}"></i></span>
      </div>

      <div class="first-cta">
        <a class="button button-primary lesson-link" data-position="top" href="${lesson.url}" target="_blank" rel="noreferrer">Создай свой лид-квиз за 45 мин</a>
      </div>

      <div class="result-layout">
        <div class="result-content">
          <article class="result-section">
            <p class="eyebrow">Почему именно этот формат</p>
            <h2>Он снимает главный барьер до заявки</h2>
            ${result.why.map((paragraph) => `<p>${paragraph}</p>`).join("")}
          </article>

          ${isHybrid ? `
            <article class="result-section hybrid-card">
              <p class="eyebrow">Что усилит основной формат</p>
              <h2>${resultMeta[code].shortName} + ${resultMeta[secondary].shortName}</h2>
              <p class="hybrid-pair">Смешанный профиль</p>
              <p>${hybridText(code, secondary)}</p>
            </article>
          ` : ""}

          <article class="result-section">
            <p class="eyebrow">Как работает</p>
            <h2>Механика будущего квиза</h2>
            <ol class="numbered-list">${result.mechanic.map((item) => `<li>${item}</li>`).join("")}</ol>
          </article>

          <article class="result-section">
            <p class="eyebrow">Что спросить</p>
            <h2>8 рекомендуемых вопросов</h2>
            <ol class="question-list">${result.questions.map((item) => `<li>${item}</li>`).join("")}</ol>
          </article>

          <article class="result-section">
            <p class="eyebrow">Какие результаты выдавать</p>
            <h2>Четыре готовых сценария</h2>
            <div class="outcome-grid">
              ${result.outcomes.map((outcome, index) => `
                <div class="outcome-card">
                  <span>РЕЗУЛЬТАТ ${index + 1}</span>
                  <h3>${outcome.title}</h3>
                  <p>${outcome.text}</p>
                  <strong>Первый шаг: ${outcome.step}</strong>
                  <small>CTA: ${outcome.cta}</small>
                </div>
              `).join("")}
            </div>
            <div class="future-cta"><span>Подходящий CTA внутри будущего квиза</span><strong>${result.futureCta}</strong></div>
          </article>

          <article class="result-section">
            <p class="eyebrow">Визуальная концепция</p>
            <h2>Как оформить дизайн</h2>
            <p>${result.design}</p>
          </article>

          <article class="result-section">
            <p class="eyebrow">Путь пользователя</p>
            <h2>Как встроить квиз в воронку</h2>
            <ul class="funnel-list">${result.funnel.map((item) => `<li>${item}</li>`).join("")}</ul>
            <p>${result.lessonBridge}</p>
          </article>
        </div>

        <aside class="result-aside">
          <p>Рекомендуемый формат</p>
          <div class="aside-format">${meta.shortName}</div>
          <div class="utility-actions">
            <button class="utility-button" id="copy-result" type="button">Скопировать результат</button>
            <button class="utility-button" id="share-quiz" type="button">Поделиться тестом</button>
            <button class="utility-button" id="restart-aside" type="button">Пройти заново</button>
          </div>
        </aside>
      </div>

      <section class="lesson-panel" aria-labelledby="lesson-title">
        <p class="eyebrow">Следующий шаг · бесплатный урок</p>
        <h2 id="lesson-title">Теперь превратите эту механику в работающий инструмент</h2>
        <p>У вас уже есть формат, логика и структура будущего квиза. Не нужно отдельно изучать программирование или неделями собирать техническое задание.</p>
        <p>В бесплатном уроке вы шаг за шагом создадите первую рабочую версию, добавите свои вопросы, настроите результат и получите ссылку, которую можно разместить в Instagram, Telegram или на сайте.</p>
        <div class="lesson-grid">
          <div>
            <h3>Что будет готово после урока</h3>
            <ul class="lesson-list">
              <li>Стартовый экран с сильным обещанием.</li>
              <li>Вопросы и варианты ответов.</li>
              <li>Логика определения результата.</li>
              <li>Персональная страница результата.</li>
              <li>Кнопка перехода к заявке или следующему шагу.</li>
              <li>Рабочая ссылка на квиз.</li>
            </ul>
          </div>
          <div class="lesson-cta-card">
            <p class="lesson-promise">Пройди бесплатный урок и сразу получи реальный результат который можно сразу использовать в своем бизнесе.</p>
            <a class="button button-primary button-wide lesson-link" data-position="bottom" href="${lesson.url}" target="_blank" rel="noreferrer">Создай свой лид-квиз за 45 мин</a>
            <p class="microcopy">Урок бесплатный. Для сборки не нужен опыт программирования.</p>
          </div>
        </div>
        <div class="restart-row"><button class="back-button" id="restart-bottom" type="button">Пройти тест заново</button></div>
      </section>
    </section>
  `);
  setRobotEmotion(...resultEmotions[code]);

  if (!options.skipViewedEvent) {
    trackEvent("result_viewed", {
      result_type: code,
      secondary_type: secondary || null,
      confidence_level: confidence,
    });
  }

  document.querySelectorAll(".lesson-link").forEach((link) => {
    link.addEventListener("click", () => {
      localStorage.setItem("leadQuizLessonClickV1", JSON.stringify({ ...lesson.params, result_type: code, clickedAt: new Date().toISOString() }));
      trackEvent("lesson_cta_clicked", {
        result_type: code,
        position: link.dataset.position,
        utm: lesson.params,
      });
    });
  });

  document.querySelector("#copy-result").addEventListener("click", async () => {
    const text = `${result.title}\n\n${result.subtitle}\n\n${shareUrl}`;
    await copyText(text);
    showToast("Результат скопирован");
  });

  document.querySelector("#share-quiz").addEventListener("click", async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: "Какой лид-квиз подойдёт вашему бизнесу?", text: result.title, url: shareUrl });
        return;
      } catch (error) {
        if (error.name === "AbortError") return;
      }
    }
    await copyText(shareUrl);
    showToast("Ссылка на тест скопирована");
  });

  ["#restart-aside", "#restart-bottom"].forEach((selector) => {
    document.querySelector(selector).addEventListener("click", restartQuiz);
  });
}

async function copyText(text) {
  if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(text);
  const area = document.createElement("textarea");
  area.value = text;
  document.body.appendChild(area);
  area.select();
  document.execCommand("copy");
  area.remove();
}

function showToast(message) {
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add("is-visible"));
  window.setTimeout(() => toast.remove(), 1800);
}

function restartQuiz() {
  trackEvent("quiz_restarted");
  localStorage.removeItem(APP_CONFIG.storageKey);
  const url = new URL(window.location.href);
  url.searchParams.delete("result");
  window.history.replaceState({}, "", url);
  renderStart();
}

function boot() {
  trackEvent("quiz_opened", { ...attribution });
  const resultParam = new URLSearchParams(window.location.search).get("result");
  const directCode = SLUG_TO_RESULT[resultParam];

  if (directCode) {
    const savedResult = state.result?.primary === directCode ? state.result : null;
    showResult(directCode, savedResult, { skipViewedEvent: false });
    return;
  }

  if (state.screen === "result" && state.result?.primary) {
    showResult(state.result.primary, state.result);
    return;
  }

  if ((state.screen === "question" || state.screen === "analysis") && Object.keys(state.answers || {}).length) {
    state.screen = "question";
    state.currentQuestion = Math.min(state.currentQuestion || 0, questions.length - 1);
    renderQuestion();
    return;
  }

  renderStart();
}

document.querySelector(".brand").addEventListener("click", (event) => {
  event.preventDefault();
  restartQuiz();
});

preloadRobotEmotions();
boot();
