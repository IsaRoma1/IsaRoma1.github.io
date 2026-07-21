import { questions, RESULT_CODES } from "../data/questions.js";

const answerFor = (questionId, answerId) =>
  questions.find((question) => question.id === questionId)?.answers.find((answer) => answer.id === answerId);

export function calculateScores(answers) {
  return questions.reduce(
    (totals, question) => {
      const answer = answerFor(question.id, answers[question.id]);
      if (!answer) return totals;
      Object.entries(answer.scores).forEach(([code, value]) => {
        totals[code] += value;
      });
      return totals;
    },
    { D: 0, S: 0, C: 0, R: 0 },
  );
}

function preferredCode(questionId, answerId) {
  const answer = answerFor(questionId, answerId);
  if (!answer) return null;
  return Object.entries(answer.scores).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
}

function resolvePrimary(tiedCodes, answers) {
  for (const questionId of ["q1", "q2"]) {
    const preferred = preferredCode(questionId, answers[questionId]);
    if (preferred && tiedCodes.includes(preferred)) return preferred;
  }

  if (tiedCodes.includes("D") && tiedCodes.includes("R")) {
    return answers.q7 === "d" ? "R" : "D";
  }

  if (tiedCodes.includes("S") && tiedCodes.includes("C")) {
    return answers.q5 === "c" ? "C" : "S";
  }

  return RESULT_CODES.find((code) => tiedCodes.includes(code));
}

export function getQuizResult(answers) {
  const scores = calculateScores(answers);
  const maxScore = Math.max(...Object.values(scores));
  const tied = RESULT_CODES.filter((code) => scores[code] === maxScore);
  const primary = resolvePrimary(tied, answers);
  const rankedSecondary = RESULT_CODES
    .filter((code) => code !== primary)
    .sort((a, b) => scores[b] - scores[a] || RESULT_CODES.indexOf(a) - RESULT_CODES.indexOf(b));
  const secondary = rankedSecondary[0];
  const difference = scores[primary] - scores[secondary];
  const confidence = difference >= 4 ? "high" : difference >= 2 ? "medium" : "mixed";

  return {
    scores,
    primary,
    secondary,
    difference,
    confidence,
    isHybrid: difference <= 2,
  };
}

export function getAnswer(questionId, answerId) {
  return answerFor(questionId, answerId);
}
