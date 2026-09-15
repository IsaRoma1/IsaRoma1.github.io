(() => {
  const body = document.body;
  const header = document.querySelector('[data-header]');
  const nav = document.querySelector('[data-nav]');
  const navToggle = document.querySelector('[data-nav-toggle]');
  const track = (eventName) => {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: eventName });
  };

  const closeNav = () => {
    if (!nav || !navToggle) return;
    nav.classList.remove('is-open');
    navToggle.setAttribute('aria-expanded', 'false');
    body.classList.remove('nav-open');
  };

  navToggle?.addEventListener('click', () => {
    const isOpen = navToggle.getAttribute('aria-expanded') === 'true';
    navToggle.setAttribute('aria-expanded', String(!isOpen));
    nav?.classList.toggle('is-open', !isOpen);
    body.classList.toggle('nav-open', !isOpen);
  });

  nav?.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeNav));

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeNav();
  });

  const updateHeader = () => header?.classList.toggle('is-compact', window.scrollY > 42);
  updateHeader();
  window.addEventListener('scroll', updateHeader, { passive: true });

  document.querySelectorAll('[data-event]').forEach((element) => {
    element.addEventListener('click', () => track(element.dataset.event));
  });

  const accordionItems = document.querySelectorAll('[data-accordion] details');
  accordionItems.forEach((item) => {
    item.addEventListener('toggle', () => {
      if (!item.open) return;
      accordionItems.forEach((other) => {
        if (other !== item) other.open = false;
      });
    });
  });

})();
