export const APP_CONFIG = {
  storageKey: "leadQuizStateV1",
  attributionKey: "leadQuizAttributionV1",
  lessonUrl: "https://t.me/r1isaev",
  answerDelayMs: 240,
  analysisDurationMs: 1900,
};

export const RESULT_SLUGS = {
  D: "diagnostic",
  S: "selector",
  C: "calculator",
  R: "readiness",
};

export const SLUG_TO_RESULT = Object.fromEntries(
  Object.entries(RESULT_SLUGS).map(([code, slug]) => [slug, code]),
);
