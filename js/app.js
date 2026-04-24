/**
 * Crosswalk Blind Zone Preview Slider — Main Application Logic
 *
 * Dependencies:
 *   - js/image-data.js must be loaded first (provides FIXED_MAP_DIR,
 *     DRIVER_VIEW_DIR, FILES, and DRIVER_FILES).
 */
(async function () {
  "use strict";

  // ── Slide Data Preparation ───────────────────────────────────────────

  const driverSlides = DRIVER_FILES.map(name => {
    const m = name.match(/(\d+(?:\.\d+)?)/);
    return m ? { value: parseFloat(m[1]), file: name } : null;
  }).filter(Boolean);

  // Parse the numeric progress value out of each filename, sort ascending.
  const slides = FILES
    .map((name) => {
      const match = name.match(/(\d+(?:\.\d+)?)/);
      return match ? { value: parseFloat(match[1]), file: name } : null;
    })
    .filter(Boolean)
    .sort((a, b) => a.value - b.value);

  // Match driver images to fixed map slides
  slides.forEach(s => {
    const match = driverSlides.find(ds => ds.value === s.value);
    if (match) s.driverFile = match.file;
  });

  // ── CSV Stats Loading ────────────────────────────────────────────────

  const csvData = { road: {}, adult: {}, child: {} };

  function parseCSV(text) {
    const lines = text.trim().split(/\r?\n/);
    if (lines.length === 0) return {};
    const headers = lines[0].split(',').map(h => h.trim());
    const pvIndex = headers.indexOf('Progress_Vehicle_Position');
    const visIndex = headers.indexOf('Visible_Percentage');
    const bzIndex = headers.indexOf('Blindzone_Filtered_Percentage');

    if (pvIndex === -1 || visIndex === -1 || bzIndex === -1) return {};

    const result = {};
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      const parts = lines[i].split(',').map(p => p.trim());
      if (parts.length > Math.max(pvIndex, visIndex, bzIndex)) {
        const pval = parseInt(parts[pvIndex], 10);
        result[pval] = {
          visible: parseFloat(parts[visIndex]),
          blindzone: parseFloat(parts[bzIndex])
        };
      }
    }
    return result;
  }

  Promise.all([
    fetch('summary/summary_road.csv').then(r => r.ok ? r.text() : ""),
    fetch('summary/summary_adult.csv').then(r => r.ok ? r.text() : ""),
    fetch('summary/summary_child.csv').then(r => r.ok ? r.text() : "")
  ]).then(([roadText, adultText, childText]) => {
    if (roadText) csvData.road = parseCSV(roadText);
    if (adultText) csvData.adult = parseCSV(adultText);
    if (childText) csvData.child = parseCSV(childText);
    if (currentIndex >= 0 && slides[currentIndex]) {
      updateStats(slides[currentIndex].value);
    }
  }).catch(err => console.error("Error loading CSVs:", err));

  function updateStatsCard(id, dataObj, pval) {
    const card = document.getElementById(id);
    if (!card) return;
    const visSpan = card.querySelector('.stat-val-visible');
    const bzSpan = card.querySelector('.stat-val-blindzone');
    const data = dataObj[pval];
    if (data && !isNaN(data.visible) && !isNaN(data.blindzone)) {
      visSpan.textContent = data.visible.toFixed(1) + '%';
      bzSpan.textContent = data.blindzone.toFixed(1) + '%';
    } else {
      visSpan.textContent = '—';
      bzSpan.textContent = '—';
    }
  }

  function updateStats(pval) {
    const pInt = Math.floor(pval);
    updateStatsCard('statRoad', csvData.road, pInt);
    updateStatsCard('statAdult', csvData.adult, pInt);
    updateStatsCard('statChild', csvData.child, pInt);
  }

  // ── DOM References ───────────────────────────────────────────────────

  const fixedMapWrap = document.getElementById("fixedMapWrap");
  const driverWrap = document.getElementById("driverWrap");
  const rightPanel = document.getElementById("rightPanel");
  const mobileViewToggle = document.getElementById("mobileViewToggle");

  if (mobileViewToggle && rightPanel) {
    let showingDriver = true;
    mobileViewToggle.addEventListener("click", () => {
      showingDriver = !showingDriver;
      if (showingDriver) {
        rightPanel.classList.remove("show-desc");
        rightPanel.classList.add("show-driver");
        mobileViewToggle.textContent = "View Description";
      } else {
        rightPanel.classList.remove("show-driver");
        rightPanel.classList.add("show-desc");
        mobileViewToggle.textContent = "View Driver Maps";
      }
    });
  }

  const slider = document.getElementById("slider");
  const valueLabel = document.getElementById("valueLabel");
  const minLabel = document.getElementById("minLabel");
  const midLabel = document.getElementById("midLabel");
  const maxLabel = document.getElementById("maxLabel");
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");
  const playBtn = document.getElementById("playBtn");
  const loader = document.getElementById("loader");
  const errorBox = document.getElementById("errorBox");
  const cacheStatus = document.getElementById("cacheStatus");
  const cacheText = document.getElementById("cacheText");
  const toggleStatsBtn = document.getElementById("toggleStatsBtn");
  const statsPanel = document.getElementById("statsPanel");
  const stageEl = document.getElementById("stage");

  // ── Stats Toggle ─────────────────────────────────────────────────────

  let statsAreOpen = false;
  function toggleStats() {
    statsAreOpen = !statsAreOpen;
    if (statsAreOpen) {
      statsPanel.classList.remove("hidden");
      stageEl.classList.add("stats-open");
      toggleStatsBtn.style.color = "var(--accent-2)";
      toggleStatsBtn.style.borderColor = "var(--accent)";
    } else {
      statsPanel.classList.add("hidden");
      stageEl.classList.remove("stats-open");
      toggleStatsBtn.style.color = "var(--text)";
      toggleStatsBtn.style.borderColor = "var(--panel-border)";
    }
  }
  toggleStatsBtn.addEventListener("click", toggleStats);

  // ── Slide Initialization ─────────────────────────────────────────────

  if (slides.length === 0) {
    errorBox.classList.add("visible");
    return;
  }

  slider.min = 0;
  slider.max = slides.length - 1;
  slider.value = 0;

  minLabel.textContent = formatValue(slides[0].value);
  maxLabel.textContent = formatValue(slides[slides.length - 1].value);
  midLabel.textContent = formatValue(slides[Math.floor(slides.length / 2)].value);

  const slideEls = slides.map((s) => {
    // Fixed Map DOM handling
    const elFixed = document.createElement("div");
    elFixed.className = "slide";
    const img = document.createElement("img");
    img.alt = "Fixed Map " + formatValue(s.value);
    img.decoding = "async";
    img.draggable = false;
    img.dataset.src = FIXED_MAP_DIR + s.file;
    elFixed.appendChild(img);
    fixedMapWrap.appendChild(elFixed);

    let elDriver = null;
    let driverImg = null;
    
    // Driver view DOM handling
    if (s.driverFile) {
      elDriver = document.createElement("div");
      elDriver.className = "slide";
      driverImg = document.createElement("img");
      driverImg.alt = "Driver " + formatValue(s.value);
      driverImg.decoding = "async";
      driverImg.draggable = false;
      driverImg.dataset.src = DRIVER_VIEW_DIR + s.driverFile;
      elDriver.appendChild(driverImg);
      driverWrap.appendChild(elDriver);
    }

    return { elFixed, elDriver, img, driverImg, loaded: false, loading: false, failed: false };
  });

  // ── Image Loader & Prefetcher ────────────────────────────────────────

  let currentIndex = -1;
  let errorCount = 0;
  let loadedCount = 0;
  const MAX_CONCURRENT = 4;
  let inFlight = 0;
  const idleCB = window.requestIdleCallback || ((cb) => setTimeout(() => cb({ timeRemaining: () => 15, didTimeout: false }), 1));

  function formatValue(v) {
    return Number.isInteger(v) ? String(v) : v.toFixed(3).replace(/\.?0+$/, "");
  }

  function updateCacheStatus() {
    cacheText.textContent = loadedCount + " / " + slides.length;
    if (loadedCount >= slides.length) cacheStatus.classList.add("done");
  }
  updateCacheStatus();

  // Load one image. Returns a Promise that resolves when the components are loaded AND decoded.
  function loadSlide(i, priority) {
    const s = slideEls[i];
    if (s.loaded || s.loading || s.failed) return Promise.resolve();
    s.loading = true;

    const loadSingleImg = (imgEl) => {
      if (!imgEl) return Promise.resolve(true); // true means success
      if (priority && "fetchPriority" in HTMLImageElement.prototype) {
        imgEl.fetchPriority = "high";
      }
      imgEl.src = imgEl.dataset.src;
      return new Promise((res) => {
        imgEl.addEventListener("load", () => {
          (imgEl.decode ? imgEl.decode().catch(() => {}) : Promise.resolve()).then(() => res(true));
        }, { once: true });
        imgEl.addEventListener("error", () => res(false), { once: true });
      });
    };

    return Promise.all([
      loadSingleImg(s.img),
      loadSingleImg(s.driverImg)
    ]).then(([mainOk, driverOk]) => {
      s.loading = false;
      if (mainOk) {
        s.loaded = true;
        loadedCount++;
        updateCacheStatus();
      } else {
        s.failed = true;
        errorCount++;
        if (errorCount >= 3 && location.protocol === "file:") {
          errorBox.classList.add("visible");
        }
      }
    });
  }

  // Background prefetcher: visits every slide, always picking the one nearest
  // the current index that hasn't been loaded yet.
  function pickNextIndex() {
    let best = -1;
    let bestDist = Infinity;
    for (let i = 0; i < slideEls.length; i++) {
      const s = slideEls[i];
      if (s.loaded || s.loading || s.failed) continue;
      const d = Math.abs(i - currentIndex);
      if (d < bestDist) { bestDist = d; best = i; }
    }
    return best;
  }

  function pumpPrefetch() {
    while (inFlight < MAX_CONCURRENT) {
      const next = pickNextIndex();
      if (next === -1) return;
      inFlight++;
      loadSlide(next, false).then(() => {
        inFlight--;
        idleCB(pumpPrefetch, { timeout: 500 });
      });
    }
  }

  // ── Slide Navigation ─────────────────────────────────────────────────

  function setIndex(i) {
    i = Math.max(0, Math.min(slides.length - 1, i));
    if (i === currentIndex) return;

    // The current slide and its immediate neighbors are high priority.
    loadSlide(i, true);
    if (i > 0) loadSlide(i - 1, true);
    if (i < slides.length - 1) loadSlide(i + 1, true);

    if (currentIndex >= 0 && slideEls[currentIndex]) {
      if (slideEls[currentIndex].elFixed) slideEls[currentIndex].elFixed.classList.remove("active");
      if (slideEls[currentIndex].elDriver) slideEls[currentIndex].elDriver.classList.remove("active");
    }
    
    if (slideEls[i].elFixed) slideEls[i].elFixed.classList.add("active");
    if (slideEls[i].elDriver) slideEls[i].elDriver.classList.add("active");

    currentIndex = i;
    valueLabel.textContent = formatValue(slides[i].value);
    if (typeof updateStats === 'function') updateStats(slides[i].value);

    const pct = slides.length > 1 ? (i / (slides.length - 1)) * 100 : 0;
    slider.style.setProperty("--fill", pct + "%");

    if (String(slider.value) !== String(i)) slider.value = i;

    loader.classList.toggle("visible", !slideEls[i].loaded);
    if (!slideEls[i].loaded) {
      slideEls[i].img.addEventListener("load", () => {
        if (currentIndex === i) loader.classList.remove("visible");
      }, { once: true });
    }

    // Kick the background prefetcher — it'll reprioritize around the new index.
    idleCB(pumpPrefetch, { timeout: 500 });
  }

  // ── Event Listeners ──────────────────────────────────────────────────

  slider.addEventListener("input", () => setIndex(parseInt(slider.value, 10)));
  prevBtn.addEventListener("click", () => { stopPlay(); setIndex(currentIndex - 1); });
  nextBtn.addEventListener("click", () => { stopPlay(); setIndex(currentIndex + 1); });

  // ── Playback Controls ────────────────────────────────────────────────

  let playTimer = null;
  const FRAME_MS = 100; // 10 fps

  function startPlay() {
    if (playTimer) return;
    playBtn.textContent = "❚❚";
    playBtn.setAttribute("aria-label", "Pause");
    playTimer = setInterval(() => {
      if (currentIndex >= slides.length - 1) { stopPlay(); return; }
      setIndex(currentIndex + 1);
    }, FRAME_MS);
  }

  function stopPlay() {
    if (!playTimer) return;
    clearInterval(playTimer);
    playTimer = null;
    playBtn.textContent = "▶";
    playBtn.setAttribute("aria-label", "Play");
  }

  playBtn.addEventListener("click", () => {
    if (playTimer) { stopPlay(); return; }
    if (currentIndex >= slides.length - 1) setIndex(0);
    startPlay();
  });
  slider.addEventListener("pointerdown", stopPlay);

  // ── Keyboard Navigation ──────────────────────────────────────────────

  document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") { setIndex(currentIndex - 1); e.preventDefault(); }
    else if (e.key === "ArrowRight") { setIndex(currentIndex + 1); e.preventDefault(); }
    else if (e.key === "Home") { setIndex(0); e.preventDefault(); }
    else if (e.key === "End") { setIndex(slides.length - 1); e.preventDefault(); }
  });

  // ── Touch / Swipe Support ────────────────────────────────────────────

  const stage = document.getElementById("stage");
  let touchStartX = null;
  stage.addEventListener("touchstart", (e) => {
    if (e.touches.length === 1) touchStartX = e.touches[0].clientX;
  }, { passive: true });
  stage.addEventListener("touchend", (e) => {
    if (touchStartX === null) return;
    const dx = (e.changedTouches[0].clientX) - touchStartX;
    if (Math.abs(dx) > 40) setIndex(currentIndex + (dx < 0 ? 1 : -1));
    touchStartX = null;
  }, { passive: true });

  // ── Boot ─────────────────────────────────────────────────────────────

  setIndex(0);
  toggleStats(); // Open stats by default
  // Start warming the cache in the background as soon as the page is idle.
  idleCB(pumpPrefetch, { timeout: 1000 });
})();
