(() => {
  'use strict';

  const header = document.querySelector('[data-header]');
  const menuButton = document.querySelector('.menu-toggle');
  const navMenu = document.querySelector('[data-nav-menu]');
  const navLinks = Array.from(document.querySelectorAll('.nav-links a'));
  const sections = Array.from(document.querySelectorAll('main section[id]'));

  const closeMenu = () => {
    if (!menuButton || !navMenu) return;
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', 'Open navigation menu');
    navMenu.classList.remove('open');
    document.body.classList.remove('menu-open');
  };

  const toggleMenu = () => {
    const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
    menuButton.setAttribute('aria-expanded', String(!isOpen));
    menuButton.setAttribute('aria-label', isOpen ? 'Open navigation menu' : 'Close navigation menu');
    navMenu.classList.toggle('open', !isOpen);
    document.body.classList.toggle('menu-open', !isOpen);
  };

  menuButton?.addEventListener('click', toggleMenu);
  navMenu?.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeMenu();
  });

  const updateHeader = () => header?.classList.toggle('scrolled', window.scrollY > 24);
  updateHeader();
  window.addEventListener('scroll', updateHeader, { passive: true });

  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -35px' });

    document.querySelectorAll('.reveal').forEach((element) => revealObserver.observe(element));

    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navLinks.forEach((link) => {
          link.classList.toggle('active', link.getAttribute('href') === `#${entry.target.id}`);
        });
      });
    }, { rootMargin: '-35% 0px -55%', threshold: 0 });

    sections.forEach((section) => sectionObserver.observe(section));
  } else {
    document.querySelectorAll('.reveal').forEach((element) => element.classList.add('visible'));
  }

  document.querySelectorAll('[data-project-toggle]').forEach((button) => {
    button.addEventListener('click', () => {
      const panelId = button.getAttribute('aria-controls');
      const panel = panelId ? document.getElementById(panelId) : null;
      if (!panel) return;

      const willOpen = button.getAttribute('aria-expanded') !== 'true';
      button.setAttribute('aria-expanded', String(willOpen));
      panel.hidden = !willOpen;
    });
  });

  const form = document.querySelector('[data-contact-form]');
  const formStatus = document.querySelector('[data-form-status]');

  form?.addEventListener('submit', (event) => {
    event.preventDefault();
    const requiredFields = Array.from(form.querySelectorAll('[required]'));
    let firstInvalidField = null;

    requiredFields.forEach((field) => {
      const isValid = field.checkValidity();
      field.setAttribute('aria-invalid', String(!isValid));
      if (!isValid && !firstInvalidField) firstInvalidField = field;
    });

    formStatus.classList.add('show');
    if (firstInvalidField) {
      formStatus.classList.add('error');
      formStatus.textContent = 'Please complete the required fields and enter a valid email address.';
      firstInvalidField.focus();
      return;
    }

    formStatus.classList.remove('error');
    formStatus.textContent = 'Thanks for reaching out! This demo form is working. We’ll connect it to secure message delivery when the website goes live.';
    form.reset();
    requiredFields.forEach((field) => field.removeAttribute('aria-invalid'));
    formStatus.focus();
  });

  form?.querySelectorAll('input, select, textarea').forEach((field) => {
    field.addEventListener('input', () => {
      if (field.checkValidity()) field.removeAttribute('aria-invalid');
    });
  });

  const yearElement = document.querySelector('[data-current-year]');
  if (yearElement) yearElement.textContent = new Date().getFullYear();
})();
