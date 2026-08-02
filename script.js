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
        entry.target.closest('.process-list')?.classList.add('is-active');
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
    document.querySelector('.process-list')?.classList.add('is-active');
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

  // Reusable portfolio project modal and carousel
  const projectGalleryData = {
    motioncare: {
      title: 'MotionCare Clinic Automation',
      label: 'Sample Automation System',
      overview: 'MotionCare is a sample clinic automation system designed to organize patient inquiries, appointment booking, follow-up communication, and workflow visibility through landing pages, forms, CRM pipelines, automations, and email support.',
      challenge: 'Patient inquiries, bookings, reminders, and appointment outcomes can become difficult to track when they are handled across disconnected tools or manual processes.',
      solution: 'A structured GoHighLevel system was created to capture inquiries, organize contacts in a CRM pipeline, support appointment booking, automate reminders, handle no-shows, and provide clear workflow visibility.',
      features: [
        'Landing page and inquiry form',
        'Appointment booking workflow',
        'CRM pipeline organization',
        'Automated confirmation and reminders',
        'No-show follow-up',
        'Appointment-attended workflow',
        'Email communication templates',
        'Workflow process map'
      ],
      images: [
        { path: 'assets/images/motioncare/motioncare-landing-page.png', caption: 'Landing Page', alt: 'MotionCare physiotherapy landing page' },
        { path: 'assets/images/motioncare/motioncare-inquiry-form.png', caption: 'Inquiry Form', alt: 'MotionCare patient inquiry form' },
        { path: 'assets/images/motioncare/motioncare-pipeline.png', caption: 'CRM Pipeline', alt: 'MotionCare CRM opportunities pipeline' },
        { path: 'assets/images/motioncare/motioncare-workflow.png', caption: 'Workflow Automation', alt: 'MotionCare workflow automation dashboard' },
        { path: 'assets/images/motioncare/motioncare-process-map.png', caption: 'Process Map', alt: 'MotionCare automation process map' },
        { path: 'assets/images/motioncare/motioncare-email-template.png', caption: 'Email Template', alt: 'MotionCare email communication templates' },
        { path: 'assets/images/motioncare/motioncare-new-inquiry.jpg', caption: 'New Inquiry Workflow', alt: 'MotionCare new inquiry workflow diagram' },
        { path: 'assets/images/motioncare/motioncare-no-show.jpg', caption: 'No-Show Workflow', alt: 'MotionCare no-show recovery workflow diagram' },
        { path: 'assets/images/motioncare/motioncare-appointment-booked.jpg', caption: 'Appointment Booked', alt: 'MotionCare appointment booked workflow diagram' },
        { path: 'assets/images/motioncare/motioncare-appointment-attended.jpg', caption: 'Appointment Attended', alt: 'MotionCare appointment attended workflow diagram' }
      ]
    },
    'glow-haven': {
      title: 'Glow Haven Booking & Automation System',
      label: 'Portfolio Build',
      overview: 'Glow Haven is a complete booking and automation portfolio build designed for a spa and salon business. It combines branded landing and booking pages, inquiry management, CRM pipeline organization, appointment workflows, customer follow-ups, review requests, and rebooking support.',
      challenge: 'Service-based businesses can lose inquiries and repeat bookings when appointments, reminders, customer follow-ups, and pipeline updates are handled manually or across disconnected tools.',
      solution: 'A structured GoHighLevel system was created to capture inquiries, organize opportunities, manage appointment communication, route completed and missed appointments, request reviews, and support future rebooking.',
      features: [
        'Branded landing page',
        'Online booking page',
        'Inquiry and opportunity management',
        'Organized CRM pipeline',
        'Appointment confirmation workflow',
        'Booking reminder automation',
        'No-show handling',
        'Completed appointment routing',
        'Review-request workflow',
        'Rebooking automation',
        'Nurture and follow-up workflow',
        'Customer email templates'
      ],
      images: [
        { path: 'assets/images/glow-haven/glow-haven-landing-page.png', caption: 'Landing Page', alt: 'Glow Haven spa and salon landing page' },
        { path: 'assets/images/glow-haven/glow-haven-booking-page.png', caption: 'Booking Page', alt: 'Glow Haven customer booking and enquiry page' },
        { path: 'assets/images/glow-haven/glow-haven-pipeline.png', caption: 'CRM Pipeline', alt: 'Glow Haven CRM opportunities pipeline' },
        { path: 'assets/images/glow-haven/glow-haven-workflow-overview.png', caption: 'Workflow Overview', alt: 'Glow Haven workflow automation overview' },
        { path: 'assets/images/glow-haven/glow-haven-workflow-01-new-enquiry.png', caption: 'New Enquiry Workflow', alt: 'Glow Haven new enquiry workflow diagram' },
        { path: 'assets/images/glow-haven/glow-haven-workflow-02-booking-reminders.png', caption: 'Booking Reminders', alt: 'Glow Haven booking reminder workflow diagram' },
        { path: 'assets/images/glow-haven/glow-haven-workflow-03-no-show.png', caption: 'No-Show Workflow', alt: 'Glow Haven no-show workflow diagram' },
        { path: 'assets/images/glow-haven/glow-haven-workflow-04-completed.png', caption: 'Completed Appointment Workflow', alt: 'Glow Haven completed appointment workflow diagram' },
        { path: 'assets/images/glow-haven/glow-haven-workflow-05-review.png', caption: 'Review Request Workflow', alt: 'Glow Haven review request workflow diagram' },
        { path: 'assets/images/glow-haven/glow-haven-workflow-06-rebooking.png', caption: 'Rebooking Workflow', alt: 'Glow Haven rebooking workflow diagram' },
        { path: 'assets/images/glow-haven/glow-haven-workflow-07-nurture.png', caption: 'Nurture Workflow', alt: 'Glow Haven long-term nurture workflow diagram' },
        { path: 'assets/images/glow-haven/glow-haven-email-template.png', caption: 'Email Template', alt: 'Glow Haven customer email templates' }
      ]
    },
    'social-media': {
      title: 'Social Media & Creative Content',
      label: 'Portfolio Build',
      overview: 'A selected collection of social media designs, content-planning materials, promotional graphics, and video thumbnails created to support consistent and professional online communication.',
      challenge: 'Businesses often need multiple types of content while maintaining clear messaging, consistent visuals, and an organized publishing schedule across different platforms.',
      solution: 'Content calendars, scheduled-post previews, branded promotional graphics, social media posts, and video thumbnails were created to help organize content production and strengthen visual consistency.',
      features: [
        'Content calendar planning',
        'Content scheduling layouts',
        'Promotional graphics',
        'Social media post designs',
        'YouTube thumbnails',
        'Branded visual communication',
        'Multi-format creative assets',
        'Organized content preparation'
      ],
      images: [
        { path: 'assets/images/social-media/content-calendar-01.png.png', caption: 'Content Calendar 01', alt: 'Social media content calendar planning spreadsheet' },
        { path: 'assets/images/social-media/content-calendar-02.png.png', caption: 'Content Calendar 02', alt: 'Second social media content calendar planning spreadsheet' },
        { path: 'assets/images/social-media/content-scheduled-01.png.png', caption: 'Scheduled Content 01', alt: 'Scheduled social media content planner preview' },
        { path: 'assets/images/social-media/content-scheduled-02.png.png', caption: 'Scheduled Content 02', alt: 'Second scheduled social media content planner preview' },
        { path: 'assets/images/social-media/promo-graphic-01.png.png', caption: 'Promotional Graphic 01', alt: 'Branded massage and spa promotional graphic' },
        { path: 'assets/images/social-media/promo-graphic-02.png.png', caption: 'Promotional Graphic 02', alt: 'Branded self-care spa promotional graphic' },
        { path: 'assets/images/social-media/social-post-01.png.png', caption: 'Social Media Post 01', alt: 'Cervical collar safety social media infographic' },
        { path: 'assets/images/social-media/social-post-02.png.png', caption: 'Social Media Post 02', alt: 'Wilderness preparation social media infographic' },
        { path: 'assets/images/social-media/youtube-thumbnail-01.png.png', caption: 'YouTube Thumbnail 01', alt: 'Banana smoothie YouTube video thumbnail' },
        { path: 'assets/images/social-media/youtube-thumbnail-02.png.png', caption: 'YouTube Thumbnail 02', alt: 'Berry banana smoothie YouTube video thumbnail' }
      ]
    },
    'video-editing': {
      title: 'Video Editing Projects',
      label: 'Selected Creative Work',
      overview: 'A selected collection of short-form video editing work created for health, wellness, educational, and wilderness-preparedness content.',
      challenge: 'Short-form content needs to communicate a clear message quickly while maintaining strong pacing, readable text, visual interest, and platform-friendly formatting.',
      solution: 'Raw ideas and footage were developed into vertical video edits using structured storytelling, captions, visual pacing, branded elements, supporting graphics, and engaging opening hooks.',
      features: [
        'Short-form vertical video editing',
        'Health and wellness content',
        'Wilderness and preparedness content',
        'On-screen captions and text',
        'Visual pacing and transitions',
        'Supporting graphics and imagery',
        'Mobile-first formatting',
        'Social-platform-ready creative work'
      ],
      filters: [
        { value: 'all', label: 'All' },
        { value: 'health-wellness', label: 'Health & Wellness' },
        { value: 'wilderness-preparedness', label: 'Wilderness & Preparedness' }
      ],
      images: [
        { path: 'assets/images/video-editing/health-video-01.png', caption: 'Health Video 01', category: 'health-wellness', categoryLabel: 'Health & Wellness', alt: 'Health video editing preview about slow arteries', videoUrl: '' },
        { path: 'assets/images/video-editing/health-video-02.png', caption: 'Health Video 02', category: 'health-wellness', categoryLabel: 'Health & Wellness', alt: 'Health video editing preview about fruit and daily wellness', videoUrl: '' },
        { path: 'assets/images/video-editing/health-video-03.png', caption: 'Health Video 03', category: 'health-wellness', categoryLabel: 'Health & Wellness', alt: 'Wellness video editing preview featuring a woman walking beside a lake', videoUrl: '' },
        { path: 'assets/images/video-editing/survival-video-01.png', caption: 'Survival Video 01', category: 'wilderness-preparedness', categoryLabel: 'Wilderness & Preparedness', alt: 'Wilderness video editing preview about survival gear', videoUrl: '' },
        { path: 'assets/images/video-editing/survival-video-02.png', caption: 'Survival Video 02', category: 'wilderness-preparedness', categoryLabel: 'Wilderness & Preparedness', alt: 'Wilderness video editing preview about carrying fire safely', videoUrl: '' },
        { path: 'assets/images/video-editing/survival-video-03.png', caption: 'Survival Video 03', category: 'wilderness-preparedness', categoryLabel: 'Wilderness & Preparedness', alt: 'Wilderness video editing preview about cold-weather fire-starting material', videoUrl: '' }
      ]
    }
  };

  const projectModal = document.querySelector('[data-project-modal]');
  const projectModalOpeners = Array.from(document.querySelectorAll('[data-project-modal-open]'));
  const projectModalClose = projectModal?.querySelector('[data-project-modal-close]');
  const projectModalLayout = projectModal?.querySelector('.project-modal-layout');
  const projectModalLabel = projectModal?.querySelector('[data-project-modal-label]');
  const projectModalTitle = projectModal?.querySelector('[data-project-modal-title]');
  const projectModalOverview = projectModal?.querySelector('[data-project-modal-overview]');
  const projectModalChallenge = projectModal?.querySelector('[data-project-modal-challenge]');
  const projectModalSolution = projectModal?.querySelector('[data-project-modal-solution]');
  const projectModalFeatures = projectModal?.querySelector('[data-project-modal-features]');
  const projectGallery = projectModal?.querySelector('[data-project-gallery]');
  const projectGalleryTrack = projectModal?.querySelector('[data-project-gallery-track]');
  const projectGalleryThumbnails = projectModal?.querySelector('[data-project-gallery-thumbnails]');
  const projectGalleryPrevious = projectModal?.querySelector('[data-project-gallery-previous]');
  const projectGalleryNext = projectModal?.querySelector('[data-project-gallery-next]');
  const projectGalleryCaption = projectModal?.querySelector('[data-project-gallery-caption]');
  const projectGalleryCounter = projectModal?.querySelector('[data-project-gallery-counter]');
  const projectGallerySwipeArea = projectModal?.querySelector('[data-project-gallery-swipe]');
  const projectGalleryFilters = projectModal?.querySelector('[data-project-gallery-filters]');
  const projectGalleryCategory = projectModal?.querySelector('[data-project-gallery-category]');
  const projectGalleryWatch = projectModal?.querySelector('[data-project-gallery-watch]');

  if (projectModal && projectModalOpeners.length && projectModalClose && projectGalleryTrack && projectGalleryThumbnails) {
    let activeProjectSlide = 0;
    let projectSlides = [];
    let projectThumbnails = [];
    let lastFocusedElement = null;
    let closeModalTimer = null;
    let swipeStartX = null;
    let activeProjectImages = [];

    const getFocusableModalElements = () => Array.from(projectModal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'))
      .filter((element) => !element.hasAttribute('disabled') && element.getAttribute('aria-hidden') !== 'true' && element.offsetParent !== null);

    const showProjectSlide = (requestedIndex) => {
      const slideCount = projectSlides.length;
      if (!slideCount) return;
      activeProjectSlide = (requestedIndex + slideCount) % slideCount;
      projectGalleryTrack.style.transform = `translate3d(-${activeProjectSlide * 100}%, 0, 0)`;

      projectSlides.forEach((slide, index) => {
        slide.setAttribute('aria-hidden', String(index !== activeProjectSlide));
      });

      projectThumbnails.forEach((thumbnail, index) => {
        thumbnail.setAttribute('aria-current', String(index === activeProjectSlide));
      });

      const activeSlide = projectSlides[activeProjectSlide];
      if (projectGalleryCaption) projectGalleryCaption.textContent = activeSlide.dataset.caption || '';
      if (projectGalleryCounter) projectGalleryCounter.textContent = `${activeProjectSlide + 1} / ${slideCount}`;

      const activeImage = activeProjectImages[activeProjectSlide];
      if (projectGalleryCategory) {
        projectGalleryCategory.textContent = activeImage?.categoryLabel ? `${activeImage.categoryLabel} · Editing Preview` : '';
        projectGalleryCategory.hidden = !activeImage?.categoryLabel;
      }
      if (projectGalleryWatch) {
        const videoUrl = activeImage?.videoUrl?.trim();
        projectGalleryWatch.hidden = !videoUrl;
        if (videoUrl) projectGalleryWatch.href = videoUrl;
        else projectGalleryWatch.removeAttribute('href');
      }

      const activeThumbnail = projectThumbnails[activeProjectSlide];
      if (activeThumbnail) {
        const centeredScrollPosition = activeThumbnail.offsetLeft - (projectGalleryThumbnails.clientWidth - activeThumbnail.offsetWidth) / 2;
        projectGalleryThumbnails.scrollTo({
          left: Math.max(0, centeredScrollPosition),
          behavior: reducedMotionQuery.matches ? 'auto' : 'smooth'
        });
      }
    };

    const renderProjectImages = (images) => {
      activeProjectImages = images;
      const slides = images.map((image, index) => {
        const figure = document.createElement('figure');
        figure.className = 'project-gallery-slide';
        figure.dataset.caption = image.caption;
        figure.setAttribute('aria-hidden', String(index !== 0));

        const screenshot = document.createElement('img');
        screenshot.src = image.path;
        screenshot.alt = image.alt;
        screenshot.loading = index === 0 ? 'eager' : 'lazy';
        screenshot.draggable = false;
        figure.append(screenshot);
        return figure;
      });

      const thumbnails = images.map((image, index) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.dataset.projectSlideIndex = String(index);
        button.setAttribute('aria-label', `Show ${image.caption}`);
        button.setAttribute('aria-current', String(index === 0));

        const thumbnail = document.createElement('img');
        thumbnail.src = image.path;
        thumbnail.alt = '';
        thumbnail.loading = 'lazy';
        button.append(thumbnail);
        return button;
      });

      projectGalleryTrack.replaceChildren(...slides);
      projectGalleryThumbnails.replaceChildren(...thumbnails);
      projectSlides = Array.from(projectGalleryTrack.querySelectorAll('.project-gallery-slide'));
      projectThumbnails = Array.from(projectGalleryThumbnails.querySelectorAll('[data-project-slide-index]'));
      projectModalLayout.scrollTop = 0;
      projectGalleryThumbnails.scrollLeft = 0;
      activeProjectSlide = 0;
    };

    const renderProjectGallery = (projectKey) => {
      const project = projectGalleryData[projectKey];
      if (!project) return false;

      projectModal.dataset.project = projectKey;
      projectModalLabel.textContent = project.label;
      projectModalTitle.textContent = project.title;
      projectModalOverview.textContent = project.overview;
      projectModalChallenge.textContent = project.challenge;
      projectModalSolution.textContent = project.solution;
      projectGallery.setAttribute('aria-label', `${project.title} project images`);
      projectGalleryThumbnails.setAttribute('aria-label', `Choose a ${project.title} image`);
      projectModalClose.setAttribute('aria-label', `Close ${project.title} project gallery`);

      const featureItems = project.features.map((feature) => {
        const listItem = document.createElement('li');
        listItem.textContent = feature;
        return listItem;
      });
      projectModalFeatures.replaceChildren(...featureItems);

      if (projectGalleryFilters) {
        const filterButtons = (project.filters || []).map((filter, index) => {
          const button = document.createElement('button');
          button.type = 'button';
          button.dataset.projectFilter = filter.value;
          button.textContent = filter.label;
          button.setAttribute('aria-pressed', String(index === 0));
          return button;
        });
        projectGalleryFilters.replaceChildren(...filterButtons);
        projectGalleryFilters.hidden = !filterButtons.length;
        projectGalleryFilters.setAttribute('aria-label', `Filter ${project.title} previews`);
      }

      renderProjectImages(project.images);
      return true;
    };

    const finishClosingProjectModal = () => {
      projectModal.hidden = true;
      document.body.classList.remove('modal-open');
      closeModalTimer = null;
      if (lastFocusedElement instanceof HTMLElement && lastFocusedElement.isConnected) lastFocusedElement.focus();
    };

    const openProjectModal = (projectKey, opener) => {
      if (!renderProjectGallery(projectKey)) return;
      if (closeModalTimer !== null) {
        window.clearTimeout(closeModalTimer);
        closeModalTimer = null;
      }

      lastFocusedElement = opener;
      projectModal.hidden = false;
      document.body.classList.add('modal-open');
      showProjectSlide(0);
      window.requestAnimationFrame(() => projectModal.classList.add('is-open'));
      projectModalClose.focus();
    };

    const closeProjectModal = () => {
      if (projectModal.hidden || closeModalTimer !== null) return;
      projectModal.classList.remove('is-open');
      const closeDelay = reducedMotionQuery.matches ? 0 : 230;
      closeModalTimer = window.setTimeout(finishClosingProjectModal, closeDelay);
    };

    projectModalOpeners.forEach((opener) => {
      opener.addEventListener('click', () => openProjectModal(opener.dataset.projectModalOpen, opener));
    });
    projectModalClose.addEventListener('click', closeProjectModal);
    projectGalleryPrevious?.addEventListener('click', () => showProjectSlide(activeProjectSlide - 1));
    projectGalleryNext?.addEventListener('click', () => showProjectSlide(activeProjectSlide + 1));

    projectGalleryThumbnails.addEventListener('click', (event) => {
      if (!(event.target instanceof Element)) return;
      const thumbnail = event.target.closest('[data-project-slide-index]');
      if (!thumbnail || !projectGalleryThumbnails.contains(thumbnail)) return;
      showProjectSlide(Number(thumbnail.dataset.projectSlideIndex));
    });

    projectGalleryFilters?.addEventListener('click', (event) => {
      if (!(event.target instanceof Element)) return;
      const filterButton = event.target.closest('[data-project-filter]');
      if (!filterButton || !projectGalleryFilters.contains(filterButton)) return;
      const project = projectGalleryData[projectModal.dataset.project];
      if (!project) return;

      const selectedFilter = filterButton.dataset.projectFilter;
      const filteredImages = selectedFilter === 'all'
        ? project.images
        : project.images.filter((image) => image.category === selectedFilter);
      if (!filteredImages.length) return;

      projectGalleryFilters.querySelectorAll('[data-project-filter]').forEach((button) => {
        button.setAttribute('aria-pressed', String(button === filterButton));
      });
      renderProjectImages(filteredImages);
      showProjectSlide(0);
    });

    projectModal.addEventListener('click', (event) => {
      if (event.target === projectModal) closeProjectModal();
    });

    projectModal.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeProjectModal();
        return;
      }

      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        showProjectSlide(activeProjectSlide - 1);
        return;
      }

      if (event.key === 'ArrowRight') {
        event.preventDefault();
        showProjectSlide(activeProjectSlide + 1);
        return;
      }

      if (event.key !== 'Tab') return;
      const focusableElements = getFocusableModalElements();
      if (!focusableElements.length) return;
      const firstFocusable = focusableElements[0];
      const lastFocusable = focusableElements[focusableElements.length - 1];

      if (event.shiftKey && document.activeElement === firstFocusable) {
        event.preventDefault();
        lastFocusable.focus();
      } else if (!event.shiftKey && document.activeElement === lastFocusable) {
        event.preventDefault();
        firstFocusable.focus();
      }
    });

    projectGallerySwipeArea?.addEventListener('pointerdown', (event) => {
      if (event.button !== 0) return;
      swipeStartX = event.clientX;
      projectGallerySwipeArea.setPointerCapture?.(event.pointerId);
    });

    projectGallerySwipeArea?.addEventListener('pointerup', (event) => {
      if (swipeStartX === null) return;
      const swipeDistance = event.clientX - swipeStartX;
      swipeStartX = null;
      if (Math.abs(swipeDistance) < 45) return;
      showProjectSlide(activeProjectSlide + (swipeDistance < 0 ? 1 : -1));
    });

    projectGallerySwipeArea?.addEventListener('pointercancel', () => {
      swipeStartX = null;
    });
  }

  document.querySelectorAll('[data-tool-marquee]').forEach((marquee) => {
    const track = marquee.querySelector('.tool-track');
    const sequence = track?.querySelector('.tool-sequence');
    if (!track || !sequence || track.children.length > 1) return;

    const duplicateSequence = sequence.cloneNode(true);
    duplicateSequence.setAttribute('aria-hidden', 'true');
    duplicateSequence.removeAttribute('role');
    duplicateSequence.querySelectorAll('[role], [tabindex]').forEach((item) => {
      item.removeAttribute('role');
      item.removeAttribute('tabindex');
    });
    track.append(duplicateSequence);
  });

  const yearElement = document.querySelector('[data-current-year]');
  if (yearElement) yearElement.textContent = new Date().getFullYear();
})();
