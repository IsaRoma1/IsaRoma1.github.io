(() => {
  const body = document.body;
  const header = document.querySelector('[data-header]');
  const nav = document.querySelector('[data-nav]');
  const navToggle = document.querySelector('[data-nav-toggle]');
  const form = document.querySelector('[data-assessment-form]');
  const formError = document.querySelector('[data-form-error]');
  const toast = document.querySelector('[data-toast]');
  let toastTimer;

  const track = (eventName, details = {}) => {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: eventName, ...details });
  };

  const showToast = (message) => {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('is-visible');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove('is-visible'), 5200);
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

  document.querySelectorAll('a[href="#assessment"]').forEach((link) => {
    link.addEventListener('click', () => {
      closeNav();
      window.setTimeout(() => form?.querySelector('input')?.focus({ preventScroll: true }), 700);
    });
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

  const normalizePhone = (value) => value.replace(/[^+\d]/g, '');

  const markInvalid = (field, invalid) => {
    field.setAttribute('aria-invalid', String(invalid));
    if (invalid) field.addEventListener('input', () => markInvalid(field, false), { once: true });
  };

  form?.addEventListener('submit', (event) => {
    event.preventDefault();
    formError.textContent = '';

    const requiredFields = [...form.querySelectorAll('[required]')];
    let firstInvalid = null;

    requiredFields.forEach((field) => {
      const invalid = field.type === 'checkbox' ? !field.checked : !field.value.trim();
      markInvalid(field, invalid);
      if (invalid && !firstInvalid) firstInvalid = field;
    });

    const phoneField = form.elements.phone;
    if (phoneField && normalizePhone(phoneField.value).length < 10) {
      markInvalid(phoneField, true);
      firstInvalid ||= phoneField;
    }

    if (firstInvalid) {
      formError.textContent = 'Заполните обязательные поля и подтвердите согласие.';
      firstInvalid.focus();
      track('assessment_form_validation_error');
      return;
    }

    const data = new FormData(form);
    const subject = `Предварительная оценка защиты от БПЛА — ${data.get('company')}`;
    const bodyText = [
      'Запрос на предварительную инженерную оценку защиты объекта от БПЛА',
      '',
      `Имя: ${data.get('name')}`,
      `Компания и должность: ${data.get('company')}`,
      `Рабочий телефон: ${data.get('phone')}`,
      `Тип объекта: ${data.get('objectType')}`,
      `Что требуется защитить: ${data.get('equipment') || 'Уточню в разговоре'}`,
      '',
      'Точный адрес и сведения ограниченного доступа в письмо не включены.'
    ].join('\n');

    const mailto = `mailto:info@i41.ru?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyText)}`;
    track('assessment_form_submit', { object_type: data.get('objectType') });
    showToast('Открываем почтовую программу. Проверьте письмо перед отправкой.');
    window.setTimeout(() => { window.location.href = mailto; }, 180);
  });

  const revealCandidates = document.querySelectorAll(
    '.section-heading, .risk-card, .diagram-card, .method-grid li, .industry-grid article, .principles article, .photo-story figure, .timeline li, .document-list > *, .layer-table article, .accordion details'
  );

  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    revealCandidates.forEach((element) => element.setAttribute('data-reveal', ''));
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-revealed');
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    revealCandidates.forEach((element) => revealObserver.observe(element));
  }
})();
