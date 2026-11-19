/* ==========================================================================
   ROI VINCENT P. SOLAR — PORTFOLIO
   Scroll choreography, theme, gallery and lightbox.
   No image sequence, no canvas: everything here is DOM + transforms.
   ========================================================================== */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var supportsIO = typeof IntersectionObserver !== 'undefined';

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }

  // A one-shot gate. Everything that should only start once the loading sheet
  // has lifted registers here; without a loading screen it fires immediately.
  // Without this the hero reveal would play behind the sheet and be missed.
  var pageReady = (function () {
    var queue = [];
    var fired = false;
    return {
      then: function (fn) { fired ? fn() : queue.push(fn); },
      fire: function () {
        if (fired) return;
        fired = true;
        queue.splice(0).forEach(function (fn) {
          try { fn(); } catch (err) { /* one bad step must not block the rest */ }
        });
      }
    };
  })();

  /* ------------------------------------------------------------------
     1. THEME
     ------------------------------------------------------------------ */
  var THEME_KEY = 'rs_theme';
  var root = document.documentElement;
  var themeBtn = $('#themeToggleBtn');
  var profileImg = $('#profileImg');
  var currentTheme = 'light';

  function readStoredTheme() {
    try { return localStorage.getItem(THEME_KEY); } catch (err) { return null; }
  }

  function storeTheme(theme) {
    try { localStorage.setItem(THEME_KEY, theme); } catch (err) { /* private mode */ }
  }

  function setTheme(theme, animate) {
    currentTheme = theme === 'dark' ? 'dark' : 'light';
    root.setAttribute('data-theme', currentTheme);
    storeTheme(currentTheme);

    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', currentTheme === 'dark' ? '#14110f' : '#edebe5');

    // profile1.webp reads better on paper, profile2.webp on ink.
    if (profileImg) {
      var next = currentTheme === 'dark'
        ? 'assets/pictures/profile2.webp'
        : 'assets/pictures/profile1.webp';
      if (profileImg.getAttribute('src') === next) return;
      if (!animate || reduceMotion) {
        profileImg.src = next;
        return;
      }
      profileImg.style.opacity = '0';
      window.setTimeout(function () {
        profileImg.src = next;
        profileImg.style.opacity = '1';
      }, 260);
    }
  }

  (function initTheme() {
    var saved = readStoredTheme();
    if (saved === 'light' || saved === 'dark') {
      setTheme(saved, false);
    } else {
      var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(prefersDark ? 'dark' : 'light', false);
    }
  })();

  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      setTheme(currentTheme === 'dark' ? 'light' : 'dark', true);
    });
  }

  /* ------------------------------------------------------------------
     2. HEADER CLOCK (Batangas / Asia-Manila)
     ------------------------------------------------------------------ */
  var clock = $('#headClock');
  if (clock) {
    var tick = function () {
      var t;
      try {
        t = new Date().toLocaleTimeString('en-GB', {
          timeZone: 'Asia/Manila', hour: '2-digit', minute: '2-digit'
        });
      } catch (err) {
        t = '';
      }
      clock.textContent = t ? 'BATANGAS ' + t : 'BATANGAS UTC+8';
    };
    tick();
    window.setInterval(tick, 30000);
  }

  /* ------------------------------------------------------------------
     3. MOBILE NAV
     ------------------------------------------------------------------ */
  var menuBtn = $('#mobileMenuBtn');
  var nav = $('#navLinks');

  function closeMenu() {
    if (!nav || !menuBtn) return;
    nav.classList.remove('is-open');
    menuBtn.setAttribute('aria-expanded', 'false');
  }

  if (menuBtn && nav) {
    menuBtn.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    $$('a', nav).forEach(function (a) { a.addEventListener('click', closeMenu); });
    window.addEventListener('resize', function () {
      if (window.innerWidth > 1080) closeMenu();
    });
  }

  /* ------------------------------------------------------------------
     4. REVEALS — heading masks and element fades
     ------------------------------------------------------------------ */
  // Stagger each line of a masked heading.
  $$('.mask').forEach(function (m) {
    $$('.line i', m).forEach(function (line, i) {
      line.style.setProperty('--d', (i * 0.07) + 's');
    });
  });

  // Give a list of elements the reveal treatment with a running delay.
  function cascade(items, opts) {
    opts = opts || {};
    var step = opts.step || 0.05;
    var max = opts.max || 0.4;
    var start = opts.start || 0;
    var extra = opts.extra;
    items.forEach(function (el, i) {
      el.classList.add('reveal');
      if (extra) el.classList.add(extra);
      el.style.setProperty('--d', (start + Math.min(i * step, max)).toFixed(3) + 's');
    });
  }

  // Stagger siblings inside a group so rows cascade instead of popping together.
  [
    '.principles', '.counters', '.contact-grid', '.register', '.entries'
  ].forEach(function (sel) {
    $$(sel).forEach(function (group) {
      $$(':scope > .reveal', group).forEach(function (el, i) {
        el.style.setProperty('--d', Math.min(i * 0.055, 0.42) + 's');
      });
    });
  });

  // --- Break the big blocks into parts -------------------------------------
  // A project case is ~730px tall and a stack group can pass 1200px. Fading
  // either as a single lump means the motion is over long before you have
  // scrolled far enough to read it, which reads as no animation at all.
  // Each one is replaced below by a short cascade of its own pieces.

  $$('.stack-group').forEach(function (g) {
    g.classList.remove('reveal');
    var head = $('.stack-group__head', g);
    if (head) cascade([head]);
    cascade($$('.tool', g), { step: 0.035, max: 0.5, start: 0.05, extra: 'reveal--sm' });
  });

  $$('.case').forEach(function (c) {
    c.classList.remove('reveal');

    var panel = $('.case-panel__inner', c);
    if (panel) {
      cascade($$(':scope > .case-no, :scope > .case-kind, :scope > .case-title,' +
        ' :scope > .case-desc, :scope > .case-stack, :scope > .case-note,' +
        ' :scope > .case-actions', panel), { step: 0.055, max: 0.35, extra: 'reveal--left' });
    }

    var media = $('.case-media', c);
    if (media) {
      media.classList.add('reveal', 'reveal--wipe');
      media.style.setProperty('--d', '0.1s');
    }

    cascade($$('.case-stack__list li', c), { step: 0.028, max: 0.32, start: 0.18, extra: 'reveal--sm' });
    cascade($$('.thumb', c), { step: 0.026, max: 0.3, start: 0.3, extra: 'reveal--sm' });
  });

  $$('.entry').forEach(function (e) {
    e.classList.remove('reveal');
    cascade([$('.entry__year', e), $('.entry__body', e), $('.entry__side', e)]
      .filter(Boolean), { step: 0.09, max: 0.3 });
    cascade($$('.side-list li', e), { step: 0.04, max: 0.28, start: 0.2, extra: 'reveal--sm' });
  });

  $$('.cblock').forEach(function (b) {
    cascade($$('.cblock__links a', b), { step: 0.07, max: 0.3, start: 0.1, extra: 'reveal--sm' });
  });

  // Thumbnails are excluded here and handled as whole strips below: a thumb
  // parked off to the right of a horizontally scrolling strip never intersects
  // the viewport, so observing it individually would leave it invisible for
  // good the moment the visitor scrolls that strip sideways.
  var animated = $$('.mask, .reveal, .draw').filter(function (el) {
    return !el.closest('.gallery__thumbs');
  });

  if (reduceMotion || !supportsIO) {
    animated.forEach(function (el) { el.classList.add('is-in'); });
  } else {
    var revealIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        revealIO.unobserve(entry.target);
        // While a media panel is still wiped shut its clip-path hides the
        // thumbnail strip inside it, so that strip can never report an
        // intersection of its own. Hand it the reveal directly.
        $$('.gallery__thumbs', entry.target).forEach(revealStrip);
      });
      // threshold 0 with a negative bottom margin means an element starts
      // moving the moment its top crosses 88% of the viewport, so the motion
      // plays while it is entering rather than finishing before you look.
    }, { threshold: 0, rootMargin: '0px 0px -12% 0px' });

    // Held back until the loading sheet lifts, so the first screen animates
    // where the visitor can actually see it.
    pageReady.then(function () {
      animated.forEach(function (el) { revealIO.observe(el); });

      // Anything already on screen should not wait for a scroll, but it still
      // gets to play rather than being snapped into place.
      window.requestAnimationFrame(function () {
        animated.forEach(function (el) {
          var r = el.getBoundingClientRect();
          if (r.top < window.innerHeight * 0.88) {
            el.classList.add('is-in');
            revealIO.unobserve(el);
            $$('.gallery__thumbs', el).forEach(revealStrip);
          }
        });
      });
    });
  }

  // Reveal each thumbnail strip as a whole, including the thumbs currently
  // scrolled out of sight to the right.
  function revealStrip(strip) {
    $$('.reveal', strip).forEach(function (el) { el.classList.add('is-in'); });
  }

  var strips = $$('.gallery__thumbs');

  if (reduceMotion || !supportsIO) {
    strips.forEach(revealStrip);
  } else {
    var stripIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        revealStrip(entry.target);
        stripIO.unobserve(entry.target);
      });
    }, { threshold: 0, rootMargin: '0px 0px -10% 0px' });

    strips.forEach(function (s) { stripIO.observe(s); });
  }

  /* ------------------------------------------------------------------
     5. COUNTERS
     ------------------------------------------------------------------ */
  function runCounter(el) {
    var target = parseInt(el.getAttribute('data-count-to'), 10);
    if (isNaN(target)) return;
    if (reduceMotion) { el.textContent = String(target); return; }

    var from = target > 1000 ? Math.max(target - 26, 0) : 0;
    var start = null;
    var dur = 900;

    function step(ts) {
      if (start === null) start = ts;
      var p = clamp((ts - start) / dur, 0, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = String(Math.round(from + (target - from) * eased));
      if (p < 1) window.requestAnimationFrame(step);
    }
    window.requestAnimationFrame(step);
  }

  var counters = $$('.count');
  if (counters.length) {
    if (reduceMotion || !supportsIO) {
      counters.forEach(runCounter);
    } else {
      var countIO = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          runCounter(entry.target);
          countIO.unobserve(entry.target);
        });
      }, { threshold: 0.5 });
      pageReady.then(function () {
        counters.forEach(function (el) { countIO.observe(el); });
      });
    }
  }

  /* ------------------------------------------------------------------
     6. ACTIVE SECTION IN THE NAV
     ------------------------------------------------------------------ */
  var navLinks = $$('.nav-link');
  var sections = navLinks
    .map(function (l) { return document.getElementById(l.getAttribute('data-nav')); })
    .filter(Boolean);

  function setActive(id) {
    navLinks.forEach(function (l) {
      l.classList.toggle('is-active', l.getAttribute('data-nav') === id);
    });
  }

  if (sections.length && supportsIO) {
    var visible = {};
    var sectionIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        visible[entry.target.id] = entry.isIntersecting ? entry.intersectionRatio : 0;
      });
      var best = null, bestRatio = 0;
      Object.keys(visible).forEach(function (id) {
        if (visible[id] > bestRatio) { bestRatio = visible[id]; best = id; }
      });
      if (best) setActive(best);
    }, { threshold: [0, 0.15, 0.4, 0.75], rootMargin: '-20% 0px -45% 0px' });

    sections.forEach(function (s) { sectionIO.observe(s); });
  }

  /* ------------------------------------------------------------------
     7. SCROLL-LINKED: rail, marquee, parallax
        One rAF loop, one passive scroll listener.
     ------------------------------------------------------------------ */
  var railFill = $('#railFill');
  var marqueeTrack = $('#marqueeTrack');
  var portrait = $('.portrait');
  var wordmark = $('.wordmark');

  var lastY = window.pageYOffset || 0;
  var velocity = 0;
  var marqueeX = 0;
  var marqueeWidth = 0;
  var ticking = false;
  var lastFrame = 0;

  function measureMarquee() {
    if (!marqueeTrack) return;
    var run = marqueeTrack.firstElementChild;
    marqueeWidth = run ? run.getBoundingClientRect().width : 0;
  }

  function onScroll() {
    var y = window.pageYOffset || document.documentElement.scrollTop || 0;
    velocity = y - lastY;
    lastY = y;

    if (railFill) {
      var docH = Math.max(
        document.documentElement.scrollHeight,
        document.body.scrollHeight
      ) - window.innerHeight;
      var p = docH > 0 ? clamp(y / docH, 0, 1) : 0;
      railFill.style.width = (p * 100) + '%';
    }

    if (!reduceMotion) {
      if (portrait) {
        var pr = portrait.getBoundingClientRect();
        if (pr.bottom > -200 && pr.top < window.innerHeight + 200) {
          var offset = clamp((window.innerHeight - pr.top) * 0.045, -40, 40);
          portrait.style.transform = 'translate3d(0,' + offset.toFixed(2) + 'px,0)';
        }
      }
      if (wordmark) {
        var wr = wordmark.getBoundingClientRect();
        if (wr.top < window.innerHeight + 200 && wr.bottom > -200) {
          var wo = clamp((window.innerHeight - wr.top) * 0.05, -60, 60);
          wordmark.style.transform = 'translate3d(0,' + (-wo).toFixed(2) + 'px,0)';
        }
      }
    }
    ticking = false;
  }

  window.addEventListener('scroll', function () {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(onScroll);
  }, { passive: true });

  function loop(ts) {
    var dt = lastFrame ? Math.min((ts - lastFrame) / 16.67, 3) : 1;
    lastFrame = ts;

    if (marqueeTrack && marqueeWidth > 0) {
      // Base drift, plus a nudge from how fast (and which way) the page moved.
      var speed = 0.5 + clamp(Math.abs(velocity) * 0.05, 0, 2.2);
      var dir = velocity < -1 ? 1 : -1;
      marqueeX += speed * dir * dt;
      if (marqueeX <= -marqueeWidth) marqueeX += marqueeWidth;
      if (marqueeX > 0) marqueeX -= marqueeWidth;
      marqueeTrack.style.transform = 'translate3d(' + marqueeX.toFixed(2) + 'px,0,0)';
    }

    velocity *= 0.9;
    window.requestAnimationFrame(loop);
  }

  measureMarquee();
  window.addEventListener('resize', measureMarquee);
  window.addEventListener('load', measureMarquee);
  onScroll();
  if (!reduceMotion) window.requestAnimationFrame(loop);

  /* ------------------------------------------------------------------
     8. PROJECT GALLERIES
        Thumbnails hold a small webp; the full screenshot is in data-full
        and is only fetched when it is actually shown.
     ------------------------------------------------------------------ */
  function fullSrc(thumb) {
    var full = thumb.getAttribute('data-full');
    if (full) return full;
    var img = thumb.querySelector('img');
    return img ? img.getAttribute('src') : '';
  }

  function updateCount(gallery, index, total) {
    var el = $('.gallery__count', gallery);
    if (!el) return;
    var pad = function (n) { return n < 10 ? '0' + n : String(n); };
    el.textContent = pad(index + 1) + ' / ' + pad(total);
  }

  function selectThumb(thumb) {
    var gallery = thumb.closest('.gallery');
    if (!gallery) return;

    var thumbs = $$('.thumb', gallery);
    var main = $('.gallery__img', gallery);
    var index = thumbs.indexOf(thumb);
    var src = fullSrc(thumb);

    thumbs.forEach(function (t) { t.classList.remove('is-active'); });
    thumb.classList.add('is-active');
    updateCount(gallery, index < 0 ? 0 : index, thumbs.length || 1);

    if (!main || !src) return;

    main.dataset.pendingSrc = src;
    main.style.opacity = '0.3';

    var pre = new Image();
    pre.src = src;
    var ready = pre.decode ? pre.decode().catch(function () { }) : Promise.resolve();
    var minDelay = new Promise(function (res) { window.setTimeout(res, 110); });

    Promise.all([ready, minDelay]).then(function () {
      if (main.dataset.pendingSrc !== src) return; // another thumb won
      main.src = src;
      main.style.opacity = '1';
    });
  }

  // Delegated so it keeps working if galleries are ever added later.
  document.addEventListener('click', function (e) {
    var thumb = e.target.closest ? e.target.closest('.thumb') : null;
    if (thumb) {
      e.preventDefault();
      selectThumb(thumb);
      return;
    }
    var view = e.target.closest ? e.target.closest('.gallery__view') : null;
    if (view) {
      e.preventDefault();
      openLightbox(view.closest('.gallery'));
    }
  });

  // Safety net: a missing small thumbnail falls back to the full image
  // instead of showing a broken icon.
  document.addEventListener('error', function (e) {
    var img = e.target;
    if (!img || !img.parentElement || !img.parentElement.classList) return;

    // A skill icon that fails (CDN hiccup) leaves a tidy empty chip rather
    // than a browser broken-image glyph.
    if (img.classList && img.classList.contains('tool-icon')) {
      img.style.visibility = 'hidden';
      return;
    }

    if (!img.parentElement.classList.contains('thumb')) return;
    if (img.dataset.fallback) return;
    var full = img.parentElement.getAttribute('data-full');
    if (!full) return;
    img.dataset.fallback = '1';
    img.src = full;
  }, true);

  // Set every gallery's counter on load.
  $$('.gallery').forEach(function (g) {
    updateCount(g, 0, $$('.thumb', g).length || 1);
  });

  // Kept for backwards compatibility with any older inline handler.
  window.switchThumb = function (el) {
    var thumb = el && el.closest ? el.closest('.thumb') : null;
    if (thumb) selectThumb(thumb);
  };

  /* ------------------------------------------------------------------
     9. LIGHTBOX
     ------------------------------------------------------------------ */
  var lb = $('#lightboxOverlay');
  var lbImg = $('#lightboxImg');
  var lbCount = $('#lightboxCounter');
  var lbClose = $('#lightboxClose');
  var lbPrev = $('#lightboxPrev');
  var lbNext = $('#lightboxNext');

  var lbItems = [];
  var lbIndex = 0;
  var lbLock = false;
  var lbOpener = null;

  function lbRender() {
    if (!lbItems.length || !lbImg) return;
    lbImg.src = lbItems[lbIndex];
    if (lbCount) lbCount.textContent = (lbIndex + 1) + ' / ' + lbItems.length;
  }

  function openLightbox(gallery) {
    if (!lb || !gallery) return;
    var thumbs = $$('.thumb', gallery);
    lbItems = thumbs.map(fullSrc).filter(Boolean);

    if (!lbItems.length) {
      var main = $('.gallery__img', gallery);
      lbItems = main ? [main.src] : [];
    }
    if (!lbItems.length) return;

    var activeIndex = thumbs.indexOf($('.thumb.is-active', gallery));
    lbIndex = activeIndex >= 0 ? activeIndex : 0;

    lbOpener = $('.gallery__view', gallery);
    lbRender();
    lb.classList.add('is-open');
    document.body.classList.add('is-locked');
    if (lbClose) lbClose.focus();
  }

  function closeLightbox() {
    if (!lb) return;
    lb.classList.remove('is-open');
    document.body.classList.remove('is-locked');
    if (lbOpener) { lbOpener.focus(); lbOpener = null; }
  }

  function lbStep(dir) {
    if (!lbItems.length) return;
    lbIndex = (lbIndex + dir + lbItems.length) % lbItems.length;
    lbRender();
  }

  if (lbClose) lbClose.addEventListener('click', closeLightbox);
  if (lbPrev) lbPrev.addEventListener('click', function () { lbStep(-1); });
  if (lbNext) lbNext.addEventListener('click', function () { lbStep(1); });

  if (lb) {
    lb.addEventListener('click', function (e) {
      if (e.target === lb || e.target.classList.contains('lightbox__stage')) closeLightbox();
    });

    lb.addEventListener('wheel', function (e) {
      if (!lbItems.length) return;
      e.preventDefault();
      if (lbLock) return;
      lbLock = true;
      lbStep(e.deltaY > 0 ? 1 : -1);
      window.setTimeout(function () { lbLock = false; }, 320);
    }, { passive: false });

    var touchX = null;
    lb.addEventListener('touchstart', function (e) {
      touchX = e.touches[0].clientX;
    }, { passive: true });
    lb.addEventListener('touchend', function (e) {
      if (touchX === null) return;
      var dx = e.changedTouches[0].clientX - touchX;
      if (Math.abs(dx) > 48) lbStep(dx < 0 ? 1 : -1);
      touchX = null;
    }, { passive: true });
  }

  document.addEventListener('keydown', function (e) {
    if (!lb || !lb.classList.contains('is-open')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowRight') lbStep(1);
    if (e.key === 'ArrowLeft') lbStep(-1);
  });

  /* ------------------------------------------------------------------
     10. COPY EMAIL
     ------------------------------------------------------------------ */
  var mailBtn = $('#copyEmailBtn');
  var mailState = $('#copyEmailState');

  function fallbackCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    var ok = false;
    try { ok = document.execCommand('copy'); } catch (err) { ok = false; }
    document.body.removeChild(ta);
    return ok;
  }

  if (mailBtn) {
    mailBtn.addEventListener('click', function () {
      var email = mailBtn.getAttribute('data-email') || '';
      if (!email) return;

      var done = function (ok) {
        if (!mailState) return;
        mailState.textContent = ok ? 'Copied' : 'Press Ctrl + C';
        window.setTimeout(function () { mailState.textContent = 'Click to copy'; }, 2200);
      };

      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(email)
          .then(function () { done(true); })
          .catch(function () { done(fallbackCopy(email)); });
      } else {
        done(fallbackCopy(email));
      }
    });
  }

  /* ------------------------------------------------------------------
     11. SMOOTH ANCHORS (respects reduced motion, offsets the fixed head)
     ------------------------------------------------------------------ */
  document.addEventListener('click', function (e) {
    var link = e.target.closest ? e.target.closest('a[href^="#"]') : null;
    if (!link) return;
    var id = link.getAttribute('href');
    if (!id || id === '#') return;
    var target = document.querySelector(id);
    if (!target) return;

    e.preventDefault();
    closeMenu();
    var head = parseInt(
      getComputedStyle(document.documentElement).getPropertyValue('--head-h'), 10
    ) || 68;
    var top = target.getBoundingClientRect().top + window.pageYOffset - head - 8;
    window.scrollTo({ top: top, behavior: reduceMotion ? 'auto' : 'smooth' });
    if (history.replaceState) history.replaceState(null, '', id);
  });

  /* ------------------------------------------------------------------
     12. LOADING SCREEN
     Progress tracks real work: the web fonts, the portrait and the first
     project screenshots. It is deliberately impossible to get stuck on:
     every asset resolves on error as well as on load, there is a hard
     timeout, and the stylesheet lifts the sheet on its own if this script
     never runs at all.
     ------------------------------------------------------------------ */
  (function initLoader() {
    var loader = $('#loader');

    if (!loader) {
      pageReady.fire();
      return;
    }

    var fillEl = $('#loaderFill');
    var ruleEl = $('#loaderRule');
    var pctEl = $('#loaderPct');
    var stageEl = $('#loaderStage');

    var MIN_MS = reduceMotion ? 300 : 1100;   // long enough to read
    var MAX_MS = 5000;                        // never hold the page hostage
    var CREEP_MS = 2600;                      // keeps the number alive meanwhile
    var startedAt = Date.now();
    var finished = false;

    var STAGES = [
      [0, 'Setting the type'],
      [30, 'Loading the work'],
      [62, 'Fetching screenshots'],
      [88, 'Almost there'],
      [100, 'Ready']
    ];

    document.documentElement.classList.add('is-loading');

    // --- what we are actually waiting for ---------------------------------
    var jobs = [];

    function watchImage(img) {
      if (!img) return;
      jobs.push(new Promise(function (resolve) {
        if (img.complete) return resolve();
        img.addEventListener('load', resolve, { once: true });
        img.addEventListener('error', resolve, { once: true }); // never block
      }));
    }

    // Only images the browser actually fetches up front. Waiting on the
    // lazy-loaded project screenshots would be waiting forever, because the
    // browser will not request them until they are near the viewport.
    $$('img:not([loading="lazy"])').forEach(watchImage);

    if (document.fonts && document.fonts.ready) {
      jobs.push(Promise.resolve(document.fonts.ready).catch(function () { }));
    }

    jobs.push(new Promise(function (resolve) {
      if (document.readyState === 'complete') return resolve();
      window.addEventListener('load', resolve, { once: true });
    }));

    var total = jobs.length || 1;
    var done = 0;
    var target = 0;
    var shown = 0;

    jobs.forEach(function (job) {
      job.then(function () {
        done += 1;
        target = Math.round((done / total) * 100);
      });
    });

    // --- paint ------------------------------------------------------------
    function stageFor(p) {
      var label = STAGES[0][1];
      for (var i = 0; i < STAGES.length; i++) {
        if (p >= STAGES[i][0]) label = STAGES[i][1];
      }
      return label;
    }

    function paint(p) {
      if (fillEl) fillEl.style.setProperty('--p', p + '%');
      if (ruleEl) ruleEl.style.width = p + '%';
      if (pctEl) pctEl.textContent = p < 10 ? '0' + p : String(p);
      if (stageEl) {
        var label = stageFor(p);
        if (stageEl.textContent !== label) stageEl.textContent = label;
      }
    }

    function finish() {
      if (finished) return;
      finished = true;

      paint(100);
      document.documentElement.classList.remove('is-loading');
      loader.classList.add('is-done');

      // Let the hero start moving while the sheet is still on its way up.
      window.setTimeout(pageReady.fire, reduceMotion ? 0 : 160);
      window.setTimeout(function () {
        loader.classList.add('is-gone');
      }, reduceMotion ? 60 : 1100);
    }

    // Ease the shown value toward the target so it never jumps or stalls at a
    // number, and creep forward slightly while waiting so it always feels live.
    function tick() {
      if (finished) return;

      var elapsed = Date.now() - startedAt;
      var ceiling = Math.max(target, Math.min(92, elapsed / CREEP_MS * 92));
      shown += (ceiling - shown) * 0.08;

      if (shown > 99.4) shown = 99.4;
      paint(Math.round(shown));

      if ((done >= total && elapsed >= MIN_MS) || elapsed >= MAX_MS) {
        finish();
        return;
      }
      window.requestAnimationFrame(tick);
    }

    paint(0);
    window.requestAnimationFrame(tick);

    // Belt and braces: even if the loop is throttled in a background tab.
    window.setTimeout(finish, MAX_MS + 400);
  })();
})();