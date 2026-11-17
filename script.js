/* ==========================================================================
   ROI VINCENT P. SOLAR — DUAL-THEME SMOOTH SCROLL & INTERACTION ENGINE
   ========================================================================== */

const TOTAL_FRAMES = 240;
const canvas = document.getElementById('canvas');
// alpha: false = the background is always fully covered by a frame, so the
// browser can treat the canvas as opaque and skip blending it every frame.
const ctx = canvas.getContext('2d', { alpha: false });

// Dark mode crop bounds (darkbg full 1280x720 bleed)
const DARK_SRC_X = 0;
const DARK_SRC_Y = 0;
const DARK_SRC_W = 1280;
const DARK_SRC_H = 720;

// Light mode crop bounds (lightbg full 1280x720 bleed)
const LIGHT_SRC_X = 0;
const LIGHT_SRC_Y = 0;
const LIGHT_SRC_W = 1280;
const LIGHT_SRC_H = 720;

// Separate memory caches for Dark (meteor night) and Light (beach sun) frames.
// Each entry holds the frame's compressed file (a Blob, or an <img> fallback).
const darkFrames = new Array(TOTAL_FRAMES);
const lightFrames = new Array(TOTAL_FRAMES);

// Decoded, ready-to-draw bitmaps for the frames around the current one.
// Drawing a plain <img> makes the browser decode the JPEG on the main thread
// at paint time (a stutter on every new frame); createImageBitmap(blob)
// decodes ahead of time on a background thread instead.
const BITMAP_RADIUS = 10;       // decode this many frames on each side
const BITMAP_KEEP_RADIUS = 16;  // release bitmaps further away than this
const darkBitmaps = new Array(TOTAL_FRAMES);
const lightBitmaps = new Array(TOTAL_FRAMES);
const pendingBitmaps = new Set();

// Background easing time constant in ms. Time-based, so the background keeps
// the same responsive feel at 30, 60 or 120fps instead of lagging when fps dips.
const SCROLL_EASE_MS = 90;

let currentTheme = 'dark';
let currentFrame = 0;
let targetFrame = 0;
let lastRenderedFrame = -1;
let lastRenderedTheme = '';
let animationFrameId = 0;
let lastTickTime = 0;

// --- LOADING SCREEN (name + 0-100% while background frames preload) ---
const loadingScreen = document.getElementById('loadingScreen');
const loadingBarFill = document.getElementById('loadingBarFill');
const loadingPercentage = document.getElementById('loadingPercentage');
const heroSection = document.getElementById('hero');
let loadingHidden = false;

function updateLoadingProgress(loaded, total) {
  if (!total) return;
  const pct = Math.min(100, Math.round((loaded / total) * 100));
  if (loadingBarFill) loadingBarFill.style.width = pct + '%';
  if (loadingPercentage) loadingPercentage.textContent = pct + '%';
}

function hideLoadingScreen() {
  if (loadingHidden || !loadingScreen) return;
  loadingHidden = true;
  updateLoadingProgress(1, 1);
  loadingScreen.classList.add('loading-hidden');
  // Play the hero's one-time fade-up entrance now, right as the overlay
  // clears, so it's actually seen instead of finishing underneath it.
  if (heroSection) heroSection.classList.add('hero-animate');
  window.setTimeout(() => {
    if (loadingScreen && loadingScreen.parentNode) {
      loadingScreen.parentNode.removeChild(loadingScreen);
    }
  }, 700);
}

// Safety net: never let a slow/failed image request trap the user on the
// loading screen forever.
window.setTimeout(hideLoadingScreen, 12000);

// Filename generators
function getDarkFrameSrc(index) {
  const padded = String(index + 1).padStart(3, '0');
  return `darkbg/frame-${padded}.jpg`;
}

function getLightFrameSrc(index) {
  const padded = String(index + 1).padStart(3, '0');
  return `lightbg/frame-${padded}.jpg`;
}

// Size the canvas to the viewport. The frames are only 1280x720, so a canvas
// larger than the viewport's CSS size can't show any extra detail; it only
// costs more GPU work on every frame and under every glass (blur) panel.
// That's why the pixel ratio is capped at 1 here.
function resizeCanvas() {
  const dpr = Math.min(window.devicePixelRatio || 1, 1);
  const w = Math.round(window.innerWidth * dpr);
  const h = Math.round(window.innerHeight * dpr);

  // 'resize' and visualViewport 'resize' often fire together for the same
  // change; resizing the canvas wipes and reallocates it, so skip no-op calls.
  if (canvas.width === w && canvas.height === h) return;

  canvas.width = w;
  canvas.height = h;

  lastRenderedFrame = -1;
  renderFrame(Math.round(currentFrame));
}

// Draw image covering the entire canvas without bars or distortion
function drawImageCover(img, isLight) {
  // Accepts an <img> (naturalWidth) or an ImageBitmap (width)
  if (!img || !(img.naturalWidth || img.width) || !(img.naturalHeight || img.height)) return;

  const cw = canvas.width;
  const ch = canvas.height;
  if (cw === 0 || ch === 0) return;

  const srcX = isLight ? LIGHT_SRC_X : DARK_SRC_X;
  const srcY = isLight ? LIGHT_SRC_Y : DARK_SRC_Y;
  const srcW = isLight ? LIGHT_SRC_W : DARK_SRC_W;
  const srcH = isLight ? LIGHT_SRC_H : DARK_SRC_H;

  const scale = Math.max(cw / srcW, ch / srcH);
  const dw = srcW * scale;
  const dh = srcH * scale;
  const dx = (cw - dw) / 2;
  const dy = (ch - dh) / 2;

  ctx.clearRect(0, 0, cw, ch);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, srcX, srcY, srcW, srcH, dx, dy, dw, dh);
}

// Find the nearest decoded frame. The exact one is normally ready because the
// frames around the current one are decoded ahead; a neighbour stands in for
// the moment it isn't, so the background never goes blank.
function getNearestLoadedImage(index, isLight) {
  const bitmaps = isLight ? lightBitmaps : darkBitmaps;
  const target = Math.max(0, Math.min(TOTAL_FRAMES - 1, index));

  if (bitmaps[target]) {
    return bitmaps[target];
  }

  for (let offset = 1; offset < TOTAL_FRAMES; offset++) {
    const prev = target - offset;
    if (prev >= 0 && bitmaps[prev]) {
      return bitmaps[prev];
    }
    const next = target + offset;
    if (next < TOTAL_FRAMES && bitmaps[next]) {
      return bitmaps[next];
    }
  }
  return null;
}

// Render the specified frame index for the active theme. Returns true only
// if a frame was actually drawn, so callers know not to mark it as rendered.
function renderFrame(index) {
  const isLight = currentTheme === 'light';
  const img = getNearestLoadedImage(index, isLight);
  updateBitmapWindow(index, isLight);
  if (img) {
    drawImageCover(img, isLight);
    lastRenderedTheme = currentTheme;
    return true;
  }
  return false;
}

// Fetch one frame's compressed file. Falls back to an <img> where fetch()
// is unavailable (e.g. index.html opened straight from disk).
// lowPriority lets the page's own images (project screenshots) download first.
function loadFrame(src, lowPriority) {
  return fetch(src, lowPriority ? { priority: 'low' } : undefined)
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.blob();
    })
    .catch(() => new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    }));
}

// Decode a loaded frame into something drawImage can use without decoding
// again. Falls back to an <img> on browsers without createImageBitmap.
function decodeFrame(frame) {
  const viaImg = () => {
    if (frame instanceof HTMLImageElement) return Promise.resolve(frame);
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(frame);
      img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('frame decode failed')); };
      img.src = url;
    });
  };
  if (typeof createImageBitmap !== 'function') return viaImg();
  return createImageBitmap(frame).catch(viaImg);
}

function releaseBitmap(bitmap) {
  if (bitmap && typeof bitmap.close === 'function') bitmap.close();
}

function releaseBitmaps(bitmaps) {
  for (let i = 0; i < TOTAL_FRAMES; i++) {
    if (bitmaps[i]) {
      releaseBitmap(bitmaps[i]);
      bitmaps[i] = undefined;
    }
  }
}

// Decode the frames around `center` ahead of time and free the far-away ones,
// so only a small window of decoded frames is held in memory.
function updateBitmapWindow(center, isLight) {
  const frames = isLight ? lightFrames : darkFrames;
  const bitmaps = isLight ? lightBitmaps : darkBitmaps;
  const theme = isLight ? 'light' : 'dark';

  for (let i = 0; i < TOTAL_FRAMES; i++) {
    if (bitmaps[i] && Math.abs(i - center) > BITMAP_KEEP_RADIUS) {
      releaseBitmap(bitmaps[i]);
      bitmaps[i] = undefined;
    }
  }

  const from = Math.max(0, center - BITMAP_RADIUS);
  const to = Math.min(TOTAL_FRAMES - 1, center + BITMAP_RADIUS);
  for (let i = from; i <= to; i++) {
    const key = theme + i;
    if (bitmaps[i] || pendingBitmaps.has(key) || !frames[i]) continue;

    pendingBitmaps.add(key);
    decodeFrame(frames[i]).then((bitmap) => {
      pendingBitmaps.delete(key);
      // Drop it if the theme changed or the user scrolled far away meanwhile
      if (currentTheme !== theme || Math.abs(i - Math.round(currentFrame)) > BITMAP_KEEP_RADIUS) {
        releaseBitmap(bitmap);
        return;
      }
      bitmaps[i] = bitmap;

      // Draw it now if it's the frame that belongs on screen (a neighbour may
      // have stood in for it, or nothing has been drawn for this theme yet)
      const shown = Math.round(currentFrame);
      if (i === shown || lastRenderedTheme !== theme) {
        if (renderFrame(shown)) {
          lastRenderedFrame = shown;
        }
      }
    }).catch(() => {
      pendingBitmaps.delete(key);
    });
  }

  // Nothing of this theme drawn yet and its frames near `center` are still
  // downloading (theme switched early on a slow connection): show the nearest
  // frame that has arrived as a one-off stand-in, so the switch is immediate
  const standInKey = theme + '-standin';
  if (lastRenderedTheme !== theme && !pendingBitmaps.has(standInKey) && !bitmaps.some(Boolean)) {
    let nearest = -1;
    for (let offset = 0; offset < TOTAL_FRAMES && nearest < 0; offset++) {
      if (frames[center - offset]) nearest = center - offset;
      else if (frames[center + offset]) nearest = center + offset;
    }
    if (nearest >= 0 && (nearest < from || nearest > to)) {
      pendingBitmaps.add(standInKey);
      decodeFrame(frames[nearest]).then((bitmap) => {
        pendingBitmaps.delete(standInKey);
        if (currentTheme === theme && lastRenderedTheme !== theme) {
          drawImageCover(bitmap, isLight);
          lastRenderedTheme = theme;
        }
        releaseBitmap(bitmap);
      }).catch(() => {
        pendingBitmaps.delete(standInKey);
      });
    }
  }
}

// Preload frames for both Dark Mode (meteor night) and Light Mode (beach sun)
function preloadFrames() {
  const isLight = currentTheme === 'light';

  // 1. Instantly load initial frame of both themes
  loadFrame(getDarkFrameSrc(0)).then((frame) => {
    darkFrames[0] = frame;
    if (currentTheme === 'dark') {
      updateBitmapWindow(Math.round(currentFrame), false);
    }
  }).catch(() => {});

  loadFrame(getLightFrameSrc(0)).then((frame) => {
    lightFrames[0] = frame;
    if (currentTheme === 'light') {
      updateBitmapWindow(Math.round(currentFrame), true);
    }
  }).catch(() => {});

  // 2. Load active theme frames first for immediate scrolling smoothness.
  // maxConcurrent (optional) limits how many frames download at once, so a
  // background preload doesn't block the page's images from loading.
  function preloadTheme(theme, callback, onProgress, maxConcurrent) {
    let loaded = 0;
    const isL = theme === 'light';
    const cache = isL ? lightFrames : darkFrames;
    const srcFn = isL ? getLightFrameSrc : getDarkFrameSrc;
    const lowPriority = !!maxConcurrent;

    const markLoaded = () => {
      loaded++;
      if (onProgress) onProgress(loaded, TOTAL_FRAMES - 1);
      if (loaded === TOTAL_FRAMES - 1 && callback) {
        callback();
      }
    };

    const loadOne = (i) => loadFrame(srcFn(i), lowPriority).then((frame) => {
      cache[i] = frame;
      // Decode it straight away if it's needed on screen now (e.g. the theme
      // was switched before this theme finished loading)
      if (currentTheme === theme && Math.abs(i - Math.round(currentFrame)) <= BITMAP_RADIUS) {
        updateBitmapWindow(Math.round(currentFrame), isL);
      }
    }, () => {}).then(markLoaded);

    if (!maxConcurrent) {
      for (let i = 1; i < TOTAL_FRAMES; i++) loadOne(i);
      return;
    }

    // Throttled: keep only a few requests in flight, but go full speed as soon
    // as the visitor actually switches to this theme
    let next = 1;
    let inFlight = 0;
    const pump = () => {
      const limit = currentTheme === theme ? 12 : maxConcurrent;
      while (next < TOTAL_FRAMES && inFlight < limit) {
        const i = next++;
        inFlight++;
        loadOne(i).then(() => {
          inFlight--;
          pump();
        });
      }
    };
    pump();
  }

  // Preload primary theme, then preload alternate theme in the background
  const primaryTheme = isLight ? 'light' : 'dark';
  const secondaryTheme = isLight ? 'dark' : 'light';

  preloadTheme(primaryTheme, () => {
    hideLoadingScreen();
    updateBitmapWindow(Math.round(currentFrame), currentTheme === 'light');
    preloadTheme(secondaryTheme, null, null, 3);
  }, updateLoadingProgress);
}

// Calculate target frame from page scroll position
function updateScrollProgress() {
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
  const scrollHeight = Math.max(
    document.documentElement.scrollHeight,
    document.body.scrollHeight,
    document.documentElement.offsetHeight,
    document.body.offsetHeight
  );
  const clientHeight = window.innerHeight || document.documentElement.clientHeight || 0;
  const maxScroll = scrollHeight - clientHeight;

  const progress = maxScroll > 0 ? Math.min(1, Math.max(0, scrollTop / maxScroll)) : 0;
  targetFrame = progress * (TOTAL_FRAMES - 1);
}

function animateScroll(now) {
  updateScrollProgress();

  // Frame-rate independent easing (dt capped so a stalled tab doesn't jump)
  const dt = lastTickTime ? Math.min(100, now - lastTickTime) : 16.7;
  lastTickTime = now;

  const diff = targetFrame - currentFrame;
  if (Math.abs(diff) > 0.01) {
    currentFrame += diff * (1 - Math.exp(-dt / SCROLL_EASE_MS));
  } else {
    currentFrame = targetFrame;
  }

  const rounded = Math.round(currentFrame);
  if (rounded !== lastRenderedFrame || currentTheme !== lastRenderedTheme) {
    if (renderFrame(rounded)) {
      lastRenderedFrame = rounded;
    }
  }

  if (Math.abs(targetFrame - currentFrame) > 0.001) {
    animationFrameId = requestAnimationFrame(animateScroll);
  } else {
    animationFrameId = 0;
    lastTickTime = 0;
  }
}

function handleScroll() {
  updateScrollProgress();

  if (!animationFrameId) {
    animationFrameId = requestAnimationFrame(animateScroll);
  }
}

// --- THEME SWITCHING (DARK = METEORS, LIGHT = SUNSET BEACH) ---
const themeToggleBtn = document.getElementById('themeToggleBtn');
const profileImg = document.getElementById('profileImg');

function setTheme(theme) {
  currentTheme = theme;
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('rs_theme', theme);

  // Switch profile picture: profile1.webp (light mode), profile2.webp (dark mode)
  // Swap only after the fade-out finishes (matches .profile-photo's 0.5s opacity transition)
  // so the old photo is fully invisible before the new one fades in — no mid-fade jump.
  if (profileImg) {
    profileImg.style.opacity = '0';
    setTimeout(() => {
      profileImg.src = theme === 'light' ? 'assets/pictures/profile1.webp' : 'assets/pictures/profile2.webp';
      profileImg.style.opacity = '1';
    }, 500);
  }

  // Free the other theme's decoded frames, then force background canvas to
  // immediately redraw active theme at current frame
  releaseBitmaps(theme === 'light' ? darkBitmaps : lightBitmaps);
  lastRenderedFrame = -1;
  if (!renderFrame(Math.round(currentFrame))) {
    animationFrameId = requestAnimationFrame(animateScroll);
  }
}

function initTheme() {
  const savedTheme = localStorage.getItem('rs_theme') || 'dark';
  setTheme(savedTheme);
}

if (themeToggleBtn) {
  themeToggleBtn.addEventListener('click', () => {
    const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
  });
}

// --- PROJECT GALLERY THUMBNAIL SWITCHER ---
// Thumbnails load a small copy (assets/projectX/thumbs/...). The full-size
// screenshot is in data-full and is only loaded when it's actually shown.
function getFullSrc(thumb) {
  const full = thumb.getAttribute('data-full');
  return full ? new URL(full, document.baseURI).href : thumb.src;
}

// Safety net: if a small thumbnail can't load (for example the thumbs folder
// wasn't uploaded), show the full-size image instead of a broken image icon.
// This keeps the page looking right, but full-size thumbnails are what make
// cards go blank while scrolling, so it also warns in the DevTools console.
function useFullImageForThumb(img) {
  const full = img.getAttribute('data-full');
  if (!full || img.dataset.thumbFallback) return;
  img.dataset.thumbFallback = '1';
  console.warn('Thumbnail missing, using the full image instead (upload the thumbs folder): ' + img.getAttribute('src'));
  img.src = full;
}

// Image errors don't bubble, so listen in the capture phase
document.addEventListener('error', (e) => {
  const img = e.target;
  if (img && img.classList && img.classList.contains('thumb')) {
    useFullImageForThumb(img);
  }
}, true);

// Catch any thumbnail that already failed before this script ran
document.querySelectorAll('.thumb[data-full]').forEach((img) => {
  if (img.complete && img.naturalWidth === 0) useFullImageForThumb(img);
});

window.switchThumb = function(thumb) {
  const carousel = thumb.closest('.gallery-carousel');
  if (!carousel) return;

  const mainImg = carousel.querySelector('.gallery-active-img');
  if (mainImg) {
    const fullSrc = getFullSrc(thumb);
    mainImg.dataset.pendingSrc = fullSrc;
    mainImg.style.opacity = '0.3';

    // Load + decode the full image first so it swaps in without a blank flash
    const preload = new Image();
    preload.src = fullSrc;
    const ready = preload.decode ? preload.decode().catch(() => {}) : Promise.resolve();
    const minDelay = new Promise((resolve) => setTimeout(resolve, 120));

    Promise.all([ready, minDelay]).then(() => {
      // Ignore if another thumbnail was clicked in the meantime
      if (mainImg.dataset.pendingSrc !== fullSrc) return;
      mainImg.src = fullSrc;
      mainImg.style.opacity = '1';
    });
  }

  carousel.querySelectorAll('.thumb').forEach(t => t.classList.remove('active'));
  thumb.classList.add('active');
};

// --- COPY EMAIL TO CLIPBOARD ---
window.copyEmail = function(text, btn) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(() => {
      const originalText = btn.innerHTML;
      btn.innerHTML = '<span>Copied! ✓</span>';
      setTimeout(() => {
        btn.innerHTML = originalText;
      }, 2000);
    });
  }
};

// --- GALLERY LIGHTBOX (click photo to open, scroll to browse, X to close) ---
const lightboxOverlay = document.getElementById('lightboxOverlay');
const lightboxImg = document.getElementById('lightboxImg');
const lightboxClose = document.getElementById('lightboxClose');
const lightboxCounter = document.getElementById('lightboxCounter');

let lightboxImages = [];
let lightboxIndex = 0;
let lightboxScrollLock = false;

function renderLightbox() {
  if (!lightboxImages.length) return;
  lightboxImg.src = lightboxImages[lightboxIndex];
  lightboxCounter.textContent = `${lightboxIndex + 1} / ${lightboxImages.length}`;
}

function openLightbox(carousel, startSrc) {
  const thumbs = carousel.querySelectorAll('.thumb');
  lightboxImages = Array.from(thumbs).map(getFullSrc);

  if (lightboxImages.length === 0) {
    const mainImg = carousel.querySelector('.gallery-active-img');
    lightboxImages = mainImg ? [mainImg.src] : [];
  }

  const startIndex = lightboxImages.indexOf(startSrc);
  lightboxIndex = startIndex >= 0 ? startIndex : 0;

  renderLightbox();
  lightboxOverlay.classList.add('active');
  document.body.classList.add('lightbox-open');
}

function closeLightbox() {
  lightboxOverlay.classList.remove('active');
  document.body.classList.remove('lightbox-open');
}

function lightboxNext() {
  lightboxIndex = (lightboxIndex + 1) % lightboxImages.length;
  renderLightbox();
}

function lightboxPrev() {
  lightboxIndex = (lightboxIndex - 1 + lightboxImages.length) % lightboxImages.length;
  renderLightbox();
}

document.querySelectorAll('.gallery-main-view').forEach((view) => {
  view.addEventListener('click', () => {
    const carousel = view.closest('.gallery-carousel');
    const mainImg = view.querySelector('.gallery-active-img');
    if (carousel && mainImg) {
      openLightbox(carousel, mainImg.src);
    }
  });
});

if (lightboxClose) {
  lightboxClose.addEventListener('click', closeLightbox);
}

if (lightboxOverlay) {
  lightboxOverlay.addEventListener('click', (e) => {
    if (e.target === lightboxOverlay) closeLightbox();
  });

  lightboxOverlay.addEventListener('wheel', (e) => {
    if (!lightboxImages.length) return;
    e.preventDefault();
    if (lightboxScrollLock) return;
    lightboxScrollLock = true;

    if (e.deltaY > 0) {
      lightboxNext();
    } else if (e.deltaY < 0) {
      lightboxPrev();
    }

    setTimeout(() => {
      lightboxScrollLock = false;
    }, 350);
  }, { passive: false });
}

document.addEventListener('keydown', (e) => {
  if (!lightboxOverlay || !lightboxOverlay.classList.contains('active')) return;
  if (e.key === 'Escape') closeLightbox();
  if (e.key === 'ArrowRight') lightboxNext();
  if (e.key === 'ArrowLeft') lightboxPrev();
});

// --- MOBILE NAVIGATION TOGGLE ---
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const navLinks = document.getElementById('navLinks');

if (mobileMenuBtn && navLinks) {
  mobileMenuBtn.addEventListener('click', () => {
    navLinks.classList.toggle('mobile-open');
  });

  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('mobile-open');
    });
  });
}

// --- SCROLL-REVEAL ANIMATIONS (fade/slide content in as it enters view) ---
function initScrollReveal() {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Section headings: title + intro copy above each content block.
  const headingTargets = document.querySelectorAll(
    '#about .section-header, #skills .section-header, #certifications .section-header, ' +
    '#projects .section-header, #experience .section-header, #contact .section-header, ' +
    '#skills .category-heading'
  );

  // Card-style content grouped so siblings cascade in with a short stagger.
  const staggerGroups = [
    '#about .about-narrative',
    '#about .principles-grid',
    '#certifications .certs-grid',
    '#contact .contact-methods-grid'
  ];

  // Small pill-style content (skills) — same idea as staggerGroups but a
  // lighter, quicker motion suited to many small tags instead of big cards.
  const pillStaggerGroups = [
    '#skills .skills-pill-cloud'
  ];

  headingTargets.forEach(el => el.classList.add('reveal-heading'));

  const staggerItems = new Set();
  staggerGroups.forEach(selector => {
    document.querySelectorAll(selector).forEach(group => {
      const items = group.querySelectorAll(':scope > *');
      items.forEach((item, i) => {
        item.classList.add('reveal-on-scroll', 'reveal-stagger');
        item.style.setProperty('--reveal-delay', Math.min(i * 0.08, 0.4) + 's');
        staggerItems.add(item);
      });
    });
  });

  pillStaggerGroups.forEach(selector => {
    document.querySelectorAll(selector).forEach(group => {
      const items = group.querySelectorAll(':scope > *');
      items.forEach((item, i) => {
        item.classList.add('reveal-pill', 'reveal-stagger');
        item.style.setProperty('--reveal-delay', Math.min(i * 0.045, 0.4) + 's');
        staggerItems.add(item);
      });
    });
  });

  // Fallback: any glass-capsule-sub card not already covered by a stagger
  // group (keeps the effect working even if markup/classes shift later).
  document.querySelectorAll('#about .glass-capsule-sub, #certifications .glass-capsule-sub, ' +
    '#projects .glass-capsule-sub, #experience .glass-capsule-sub, #contact .glass-capsule-sub')
    .forEach(el => {
      if (!staggerItems.has(el)) {
        el.classList.add('reveal-on-scroll');
      }
    });

  if (prefersReducedMotion || typeof IntersectionObserver === 'undefined') {
    // Show everything immediately; CSS media query also disables the
    // transition/transform for reduced-motion users.
    document.querySelectorAll('.reveal-on-scroll, .reveal-heading, .reveal-pill').forEach(el => {
      el.classList.add('reveal-visible');
    });
    return;
  }

  // Reveal each element once, a little before it reaches the viewport, then
  // stop watching it. The previous version toggled the class back off every
  // time an element left view and re-added it on re-entry — on a fast
  // scroll, elements were constantly starting their 0.6-0.7s fade mid-way
  // through and never finishing, which is what made the Projects section
  // feel laggy/delayed and made cards seem to "disappear" while scrolling.
  // Triggering once with a positive bottom rootMargin gives the fade time
  // to finish before the element is actually on screen, and unobserving
  // afterward also means the IntersectionObserver stops doing work on
  // sections you've already scrolled past.
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('reveal-visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.01,
    rootMargin: '0px 0px 200px 0px'
  });

  document.querySelectorAll('.reveal-on-scroll, .reveal-heading, .reveal-pill').forEach(el => {
    revealObserver.observe(el);
  });
}

// --- INITIALIZATION ---
function init() {
  resizeCanvas();
  initTheme();
  preloadFrames();
  updateScrollProgress();
  animationFrameId = requestAnimationFrame(animateScroll);
  initScrollReveal();
}

// Responsive event listeners
window.addEventListener('resize', resizeCanvas);
window.addEventListener('orientationchange', () => {
  setTimeout(resizeCanvas, 100);
});
if (window.visualViewport) {
  window.visualViewport.addEventListener('resize', resizeCanvas);
}

window.addEventListener('scroll', handleScroll, { passive: true });

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}