(function () {
  function all(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function one(selector, root) {
    return (root || document).querySelector(selector);
  }

  function setupMenu() {
    var button = one('[data-menu-toggle]');
    var nav = one('[data-mobile-nav]');
    if (!button || !nav) {
      return;
    }
    button.addEventListener('click', function () {
      nav.classList.toggle('is-open');
    });
  }

  function setupHero() {
    var hero = one('[data-hero]');
    if (!hero) {
      return;
    }
    var slides = all('.hero-slide', hero);
    var dots = all('[data-hero-dot]', hero);
    var current = 0;
    var timer = null;

    function show(index) {
      if (!slides.length) {
        return;
      }
      current = (index + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle('is-active', slideIndex === current);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle('is-active', dotIndex === current);
      });
    }

    function start() {
      window.clearInterval(timer);
      timer = window.setInterval(function () {
        show(current + 1);
      }, 5200);
    }

    var prev = one('[data-hero-prev]', hero);
    var next = one('[data-hero-next]', hero);
    if (prev) {
      prev.addEventListener('click', function () {
        show(current - 1);
        start();
      });
    }
    if (next) {
      next.addEventListener('click', function () {
        show(current + 1);
        start();
      });
    }
    dots.forEach(function (dot, index) {
      dot.addEventListener('click', function () {
        show(index);
        start();
      });
    });
    show(0);
    start();
  }

  function setupFilters() {
    all('[data-filter-panel]').forEach(function (panel) {
      var scopeSelector = panel.getAttribute('data-filter-panel');
      var scope = scopeSelector ? one(scopeSelector) : document;
      if (!scope) {
        return;
      }
      var cards = all('.movie-card', scope);
      var empty = one('[data-no-results]', scope.parentNode || document);
      var search = one('[data-filter-search]', panel);
      var selects = all('[data-filter-select]', panel);

      function normalize(value) {
        return String(value || '').toLowerCase().trim();
      }

      function apply() {
        var term = normalize(search ? search.value : '');
        var matched = 0;
        cards.forEach(function (card) {
          var haystack = normalize([
            card.getAttribute('data-title'),
            card.getAttribute('data-year'),
            card.getAttribute('data-type'),
            card.getAttribute('data-region'),
            card.getAttribute('data-tags')
          ].join(' '));
          var visible = !term || haystack.indexOf(term) !== -1;
          selects.forEach(function (select) {
            var field = select.getAttribute('data-filter-select');
            var value = normalize(select.value);
            if (value && normalize(card.getAttribute('data-' + field)) !== value) {
              visible = false;
            }
          });
          card.style.display = visible ? '' : 'none';
          if (visible) {
            matched += 1;
          }
        });
        if (empty) {
          empty.classList.toggle('is-visible', matched === 0);
        }
      }

      if (search) {
        search.addEventListener('input', apply);
      }
      selects.forEach(function (select) {
        select.addEventListener('change', apply);
      });
      apply();
    });
  }

  window.initPlayer = function (stream) {
    var video = one('[data-player-video]');
    var cover = one('[data-player-cover]');
    if (!video || !stream) {
      return;
    }
    var ready = false;
    var hls = null;

    function attach() {
      if (ready) {
        return;
      }
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = stream;
      } else if (window.Hls && window.Hls.isSupported()) {
        hls = new window.Hls({ enableWorker: true });
        hls.loadSource(stream);
        hls.attachMedia(video);
      } else {
        video.src = stream;
      }
      ready = true;
    }

    function start() {
      attach();
      if (cover) {
        cover.classList.add('is-hidden');
      }
      var playResult = video.play();
      if (playResult && typeof playResult.catch === 'function') {
        playResult.catch(function () {});
      }
    }

    if (cover) {
      cover.addEventListener('click', start);
    }
    video.addEventListener('click', function () {
      if (video.paused) {
        start();
      }
    });
    video.addEventListener('play', attach);
    window.addEventListener('beforeunload', function () {
      if (hls && typeof hls.destroy === 'function') {
        hls.destroy();
      }
    });
  };

  document.addEventListener('DOMContentLoaded', function () {
    setupMenu();
    setupHero();
    setupFilters();
  });
})();
