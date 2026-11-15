(() => {
  const endpoint = document.currentScript?.dataset.endpoint;
  if (!endpoint || location.origin !== 'https://ii41.ru') return;

  const output = document.querySelector('[data-site-openings-total]');
  const sendOpening = async () => {
    if (document.visibilityState !== 'visible' || document.prerendering) return;
    document.removeEventListener('visibilitychange', sendOpening);
    document.removeEventListener('prerenderingchange', sendOpening);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        body: 'ii41-site-openings-v1',
        credentials: 'omit',
        referrerPolicy: 'no-referrer',
        cache: 'no-store',
        keepalive: true,
        signal: AbortSignal.timeout(15000),
      });
      if (!response.ok || !output) return;

      const data = await response.json();
      if (data.protocol !== 'ii41-site-openings-v1' || !Number.isSafeInteger(data.total) || data.total < 0) return;

      output.querySelector('strong').textContent = data.total.toLocaleString('ru-RU');
      output.hidden = false;
    } catch {
      // A request may have already incremented the counter. Leave the footer hidden without retrying.
    }
  };

  document.addEventListener('visibilitychange', sendOpening);
  document.addEventListener('prerenderingchange', sendOpening);
  void sendOpening();
})();
