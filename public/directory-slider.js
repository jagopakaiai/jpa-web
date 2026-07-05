(function () {
  'use strict';

  var INTERVAL_MS = 8000;
  var ROLL_CYCLES_MIN = 3;
  var ROLL_CYCLES_MAX = 5;
  var ROLL_TICK_MS = 45;
  var ROLL_CHAR_STAGGER_MS = 25;

  var mqReduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var mqMobile = window.matchMedia('(max-width: 768px)');

  function reduced() { return mqReduceMotion.matches; }
  function mobile()  { return mqMobile.matches; }

  // Character roll
  function buildPool(source) {
    var base = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789·→';
    var pool = {};
    for (var i = 0; i < base.length; i++) pool[base[i]] = true;
    for (var j = 0; j < source.length; j++) {
      var c = source[j];
      if (c !== ' ' && c !== '\n') pool[c] = true;
    }
    return Object.keys(pool).join('');
  }

  function rollText(el, text) {
    if (el.__rollTimers) {
      el.__rollTimers.forEach(function (t) { clearTimeout(t); });
    }
    el.__rollTimers = [];

    if (reduced()) {
      el.textContent = text;
      return;
    }

    var pool = buildPool(text);
    var chars = text.split('');
    el.textContent = '';

    var spans = chars.map(function (ch) {
      var s = document.createElement('span');
      s.className = 'flip-char';
      s.textContent = ch;
      el.appendChild(s);
      return s;
    });

    spans.forEach(function (span, i) {
      var finalCh = chars[i];
      if (finalCh === ' ') { span.textContent = ' '; return; }

      var cycles = ROLL_CYCLES_MIN + Math.floor(Math.random() * (ROLL_CYCLES_MAX - ROLL_CYCLES_MIN + 1));
      var startDelay = i * ROLL_CHAR_STAGGER_MS;

      el.__rollTimers.push(setTimeout(function tick(n) {
        if (n >= cycles) {
          span.textContent = finalCh;
          return;
        }
        span.textContent = pool[Math.floor(Math.random() * pool.length)];
        el.__rollTimers.push(setTimeout(function () { tick(n + 1); }, ROLL_TICK_MS));
      }, startDelay, 0));
    });
  }

  // Directory Slider Initialization
  function initDirectorySlider() {
    var container = document.getElementById('spot-directory');
    if (!container) return;

    var searchInput = document.getElementById('directorySearch');
    var tabs = Array.prototype.slice.call(container.querySelectorAll('.directory-tab'));
    var allSlides = Array.prototype.slice.call(container.querySelectorAll('.directory-slide'));
    var prevBtn = document.getElementById('dirPrev');
    var nextBtn = document.getElementById('dirNext');
    var dotsContainer = document.getElementById('dirDots');
    var allCta = document.getElementById('directoryAllCta');
    var readMoreBtn = document.getElementById('directoryReadMoreBtn');

    var currentIndex = 0;
    var visibleSlides = [];
    var autoPlayTimer = null;

    // Cache initial label text
    allSlides.forEach(function (slide) {
      var lbl = slide.querySelector('.slide__label');
      if (lbl) lbl.dataset.text = (lbl.textContent || '').trim();
    });

    function getFilteredSlides() {
      var activeTab = container.querySelector('.directory-tab--active');
      var filter = activeTab ? activeTab.getAttribute('data-filter') : 'all';
      var query = searchInput ? searchInput.value.toLowerCase().trim() : '';

      var matched = allSlides.filter(function (slide) {
        var type = slide.getAttribute('data-type');
        var title = slide.getAttribute('data-title') || '';
        var desc = slide.getAttribute('data-desc') || '';

        var matchesFilter = (filter === 'all' || type === filter);
        var matchesQuery = !query || title.indexOf(query) !== -1 || desc.indexOf(query) !== -1;

        return matchesFilter && matchesQuery;
      });

      // If no query, limit to top 10 items (latest 10). If there is a query, show all matches.
      if (!query) {
        return matched.slice(0, 10);
      }
      return matched;
    }

    function renderDots() {
      if (!dotsContainer) return;
      dotsContainer.innerHTML = '';
      visibleSlides.forEach(function (_, i) {
        var dot = document.createElement('button');
        dot.className = 'spot-dot';
        dot.setAttribute('role', 'tab');
        dot.setAttribute('aria-selected', i === currentIndex ? 'true' : 'false');
        dot.setAttribute('aria-label', 'Slide ' + (i + 1) + ' of ' + visibleSlides.length);
        dot.addEventListener('click', function () {
          goToSlide(i);
        });
        dotsContainer.appendChild(dot);
      });
    }

    function updateCTA() {
      if (!allCta) return;
      var activeTab = container.querySelector('.directory-tab--active');
      var filter = activeTab ? activeTab.getAttribute('data-filter') : 'all';

      if (filter === 'all' || filter === 'skill') {
        allCta.textContent = 'LIHAT SEMUA SKILL.MD ↗';
        allCta.setAttribute('href', 'skills.html');
      } else if (filter === 'design') {
        allCta.textContent = 'LIHAT SEMUA DESIGN.MD ↗';
        allCta.setAttribute('href', 'designs.html');
      } else if (filter === 'mcp') {
        allCta.textContent = 'LIHAT SEMUA MCP ↗';
        allCta.setAttribute('href', 'mcps.html');
      }
    }

    function goToSlide(newIdx) {
      if (!visibleSlides.length) return;

      // Hide current slide
      if (visibleSlides[currentIndex]) {
        visibleSlides[currentIndex].removeAttribute('data-active');
        visibleSlides[currentIndex].style.display = 'none';
      }

      currentIndex = (newIdx + visibleSlides.length) % visibleSlides.length;

      // Show new slide
      var activeSlide = visibleSlides[currentIndex];
      if (activeSlide) {
        activeSlide.setAttribute('data-active', '');
        activeSlide.style.display = 'block';

        // Animate label character-roll
        var label = activeSlide.querySelector('.slide__label');
        if (label && label.dataset.text) {
          rollText(label, label.dataset.text);
        }
      }

      // Update dots
      if (dotsContainer) {
        var dots = dotsContainer.querySelectorAll('.spot-dot');
        dots.forEach(function (d, i) {
          d.setAttribute('aria-selected', i === currentIndex ? 'true' : 'false');
        });
      }

      // Update static read more button link
      if (readMoreBtn && activeSlide) {
        var url = activeSlide.getAttribute('data-url');
        readMoreBtn.setAttribute('href', url || '#');
      }

      resetAutoplay();
    }

    function refreshSlider() {
      // Hide currently visible slides first
      allSlides.forEach(function (slide) {
        slide.removeAttribute('data-active');
        slide.style.display = 'none';
      });

      visibleSlides = getFilteredSlides();
      currentIndex = 0;

      // Update UI
      renderDots();
      updateCTA();

      if (visibleSlides.length > 0) {
        goToSlide(0);
        if (prevBtn) prevBtn.style.display = 'inline-flex';
        if (nextBtn) nextBtn.style.display = 'inline-flex';
        if (readMoreBtn) readMoreBtn.style.display = 'inline-flex';
      } else {
        if (prevBtn) prevBtn.style.display = 'none';
        if (nextBtn) nextBtn.style.display = 'none';
        if (readMoreBtn) readMoreBtn.style.display = 'none';
        
        // Show no results slide
        var stage = document.getElementById('directoryStage');
        if (stage) {
          var placeholder = document.getElementById('directoryNoResults');
          if (!placeholder) {
            placeholder = document.createElement('div');
            placeholder.id = 'directoryNoResults';
            placeholder.style.cssText = 'display: flex; align-items: center; justify-content: center; height: 100%; color: var(--text-secondary); font-family: "Space Grotesk", sans-serif; font-size: var(--body-sm);';
            stage.appendChild(placeholder);
          }
          placeholder.textContent = 'Tidak ada direktori yang cocok dengan pencarian Anda.';
          placeholder.style.display = 'flex';
        }
      }

      // Hide placeholder if we have slides
      if (visibleSlides.length > 0) {
        var placeholder = document.getElementById('directoryNoResults');
        if (placeholder) placeholder.style.display = 'none';
      }
    }

    // Autoplay controls
    function startAutoplay() {
      clearInterval(autoPlayTimer);
      if (mobile() || reduced() || visibleSlides.length <= 1) return;
      autoPlayTimer = setInterval(function () {
        goToSlide(currentIndex + 1);
      }, INTERVAL_MS);
    }

    function stopAutoplay() {
      clearInterval(autoPlayTimer);
      autoPlayTimer = null;
    }

    function resetAutoplay() {
      stopAutoplay();
      startAutoplay();
    }

    // Setup Event Listeners
    if (prevBtn) {
      prevBtn.addEventListener('click', function () {
        goToSlide(currentIndex - 1);
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', function () {
        goToSlide(currentIndex + 1);
      });
    }

    // Tab switcher
    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        tabs.forEach(function (t) {
          t.classList.remove('directory-tab--active');
          t.setAttribute('aria-selected', 'false');
        });
        tab.classList.add('directory-tab--active');
        tab.setAttribute('aria-selected', 'true');
        refreshSlider();
      });
    });

    // Real-time search filter
    if (searchInput) {
      searchInput.addEventListener('input', function () {
        refreshSlider();
      });
    }

    // Pause on hover
    container.addEventListener('mouseenter', stopAutoplay);
    container.addEventListener('mouseleave', startAutoplay);
    container.addEventListener('focusin', stopAutoplay);
    container.addEventListener('focusout', function (e) {
      if (container.contains(e.relatedTarget)) return;
      startAutoplay();
    });

    // Keyboard support
    container.addEventListener('keydown', function (e) {
      if (e.target === searchInput) return; // Ignore inside search input
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          goToSlide(currentIndex - 1);
          break;
        case 'ArrowRight':
          e.preventDefault();
          goToSlide(currentIndex + 1);
          break;
      }
    });

    // Initialize
    refreshSlider();
    startAutoplay();
  }

  // Bootstrap
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDirectorySlider);
  } else {
    initDirectorySlider();
  }
})();
