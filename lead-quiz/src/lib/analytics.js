export function trackEvent(eventName, payload = {}) {
  const event = {
    event: eventName,
    payload,
    timestamp: new Date().toISOString(),
  };

  console.info("[lead-quiz]", event);
  window.dataLayer?.push(event);

  if (typeof window.ym === "function" && window.LEAD_QUIZ_YM_ID) {
    window.ym(window.LEAD_QUIZ_YM_ID, "reachGoal", eventName, payload);
  }

  if (typeof window.gtag === "function") {
    window.gtag("event", eventName, payload);
  }

  if (typeof window.fbq === "function") {
    window.fbq("trackCustom", eventName, payload);
  }

  return event;
}
