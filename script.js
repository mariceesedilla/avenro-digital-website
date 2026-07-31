(() => {
  'use strict';

  const header = document.querySelector('[data-header]');
  const menuButton = document.querySelector('.menu-toggle');
  const navMenu = document.querySelector('[data-nav-menu]');
  const navLinks = Array.from(document.querySelectorAll('.nav-links a'));
  const sections = Array.from(document.querySelectorAll('main section[id]'));
  const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

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

  const progressRing = document.querySelector('[data-progress-ring]');

  const setProgress = (value) => {
    if (!progressRing) return;
    const targetValue = Number(progressRing.dataset.progressValue) || 86;
    const safeValue = Math.min(Math.max(value, 0), targetValue);
    progressRing.style.setProperty('--progress', `${safeValue}%`);
    const label = progressRing.querySelector('span');
    if (label) label.textContent = `${Math.round(safeValue)}%`;
  };

  const animateProgress = () => {
    if (!progressRing || progressRing.dataset.animated === 'true') return;
    progressRing.dataset.animated = 'true';
    const targetValue = Number(progressRing.dataset.progressValue) || 86;

    if (reducedMotionQuery.matches) {
      setProgress(targetValue);
      return;
    }

    const duration = 1450;
    let startTime = null;
    setProgress(0);

    const updateProgress = (timestamp) => {
      if (reducedMotionQuery.matches) {
        setProgress(targetValue);
        return;
      }

      if (startTime === null) startTime = timestamp;
      const elapsed = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - elapsed, 3);
      setProgress(targetValue * eased);

      if (elapsed < 1) {
        window.requestAnimationFrame(updateProgress);
      } else {
        setProgress(targetValue);
        progressRing.classList.add('is-complete');
      }
    };

    window.requestAnimationFrame(updateProgress);
  };

  if (progressRing) {
    if (reducedMotionQuery.matches || !('IntersectionObserver' in window)) {
      animateProgress();
    } else {
      setProgress(0);
      const progressObserver = new IntersectionObserver((entries, observer) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        animateProgress();
        observer.disconnect();
      }, { threshold: 0.45 });
      progressObserver.observe(progressRing);
    }
  }

  const systemVisual = document.querySelector('.system-visual');
  const parallaxQuery = window.matchMedia('(min-width: 1021px) and (hover: hover) and (pointer: fine)');
  const parallaxLayers = systemVisual ? [
    { element: systemVisual.querySelector('.main-system-card'), depth: 0.38 },
    { element: systemVisual.querySelector('.floating-card-left'), depth: 0.68 },
    { element: systemVisual.querySelector('.floating-card-right'), depth: 0.86 },
    { element: systemVisual.querySelector('.completion-card'), depth: 0.55 }
  ].filter((layer) => layer.element) : [];
  let parallaxFrame = null;
  let pointerPosition = null;

  const resetParallax = () => {
    if (!systemVisual) return;
    parallaxLayers.forEach(({ element }) => { element.style.translate = '0 0'; });
    systemVisual.classList.remove('is-parallax-active');
  };

  const updateParallax = () => {
    parallaxFrame = null;
    if (!systemVisual || !pointerPosition || !parallaxQuery.matches || reducedMotionQuery.matches) {
      resetParallax();
      return;
    }

    const bounds = systemVisual.getBoundingClientRect();
    const normalizedX = ((pointerPosition.x - bounds.left) / bounds.width - 0.5) * 2;
    const normalizedY = ((pointerPosition.y - bounds.top) / bounds.height - 0.5) * 2;

    parallaxLayers.forEach(({ element, depth }) => {
      const x = Math.max(-8, Math.min(8, normalizedX * 8 * depth));
      const y = Math.max(-8, Math.min(8, normalizedY * 8 * depth));
      element.style.translate = `${x.toFixed(2)}px ${y.toFixed(2)}px`;
    });
    systemVisual.classList.add('is-parallax-active');
  };

  systemVisual?.addEventListener('pointermove', (event) => {
    if (!parallaxQuery.matches || reducedMotionQuery.matches) return;
    pointerPosition = { x: event.clientX, y: event.clientY };
    if (parallaxFrame === null) parallaxFrame = window.requestAnimationFrame(updateParallax);
  }, { passive: true });
  systemVisual?.addEventListener('pointerleave', () => {
    pointerPosition = null;
    resetParallax();
  });
  parallaxQuery.addEventListener?.('change', resetParallax);
  reducedMotionQuery.addEventListener?.('change', resetParallax);

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
