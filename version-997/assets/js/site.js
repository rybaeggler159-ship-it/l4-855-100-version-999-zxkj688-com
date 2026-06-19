(function () {
  var menuButton = document.querySelector('[data-menu-toggle]');
  var mobileNav = document.querySelector('[data-mobile-nav]');

  if (menuButton && mobileNav) {
    menuButton.addEventListener('click', function () {
      mobileNav.classList.toggle('is-open');
    });
  }

  document.querySelectorAll('[data-back-top]').forEach(function (button) {
    button.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });

  document.querySelectorAll('[data-hero]').forEach(function (slider) {
    var slides = Array.prototype.slice.call(slider.querySelectorAll('.hero-slide'));
    var dots = Array.prototype.slice.call(document.querySelectorAll('[data-hero-dot]'));
    var active = 0;

    if (!slides.length) {
      return;
    }

    function show(index) {
      active = (index + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle('is-active', i === active);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle('is-active', i === active);
      });
    }

    dots.forEach(function (dot, index) {
      dot.addEventListener('click', function () {
        show(index);
      });
    });

    show(0);

    if (slides.length > 1) {
      setInterval(function () {
        show(active + 1);
      }, 5600);
    }
  });

  function normalize(value) {
    return (value || '').toString().trim().toLowerCase();
  }

  function updateGrid(form) {
    var target = form.getAttribute('data-search-target') || '.movie-grid';
    var grid = document.querySelector(target);
    var empty = document.querySelector(form.getAttribute('data-empty-target') || '');

    if (!grid) {
      return;
    }

    var keyword = normalize(form.querySelector('[data-filter-input]') && form.querySelector('[data-filter-input]').value);
    var region = normalize(form.querySelector('[data-filter-region]') && form.querySelector('[data-filter-region]').value);
    var type = normalize(form.querySelector('[data-filter-type]') && form.querySelector('[data-filter-type]').value);
    var year = normalize(form.querySelector('[data-filter-year]') && form.querySelector('[data-filter-year]').value);
    var visible = 0;

    grid.querySelectorAll('.movie-card').forEach(function (card) {
      var haystack = normalize([
        card.getAttribute('data-title'),
        card.getAttribute('data-region'),
        card.getAttribute('data-type'),
        card.getAttribute('data-year'),
        card.getAttribute('data-genre'),
        card.getAttribute('data-tags')
      ].join(' '));
      var matched = true;

      if (keyword && haystack.indexOf(keyword) === -1) {
        matched = false;
      }
      if (region && normalize(card.getAttribute('data-region')).indexOf(region) === -1) {
        matched = false;
      }
      if (type && normalize(card.getAttribute('data-type')).indexOf(type) === -1) {
        matched = false;
      }
      if (year && normalize(card.getAttribute('data-year')) !== year) {
        matched = false;
      }

      card.style.display = matched ? '' : 'none';
      if (matched) {
        visible += 1;
      }
    });

    if (empty) {
      empty.classList.toggle('is-visible', visible === 0);
    }
  }

  document.querySelectorAll('[data-search-form]').forEach(function (form) {
    form.addEventListener('input', function () {
      updateGrid(form);
    });
    form.addEventListener('change', function () {
      updateGrid(form);
    });
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      updateGrid(form);
    });
    var clear = form.querySelector('[data-clear-filter]');
    if (clear) {
      clear.addEventListener('click', function () {
        form.reset();
        updateGrid(form);
      });
    }
  });

  function initPlayer() {
    var video = document.querySelector('[data-player]');
    var playButton = document.querySelector('[data-play-button]');

    if (!video) {
      return;
    }

    var stream = video.getAttribute('data-stream');
    var engine = null;

    function attachStream() {
      if (video.getAttribute('data-ready') === '1' || !stream) {
        return;
      }

      if (window.Hls && window.Hls.isSupported()) {
        engine = new window.Hls({ enableWorker: true, lowLatencyMode: true });
        engine.loadSource(stream);
        engine.attachMedia(video);
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = stream;
      } else {
        video.src = stream;
      }

      video.setAttribute('data-ready', '1');
    }

    function play() {
      attachStream();
      var result = video.play();
      if (result && result.catch) {
        result.catch(function () {});
      }
      if (playButton) {
        playButton.classList.add('is-hidden');
      }
    }

    if (playButton) {
      playButton.addEventListener('click', play);
    }

    video.addEventListener('click', function () {
      if (video.paused) {
        play();
      }
    });

    video.addEventListener('play', function () {
      if (playButton) {
        playButton.classList.add('is-hidden');
      }
    });

    window.addEventListener('beforeunload', function () {
      if (engine && engine.destroy) {
        engine.destroy();
      }
    });
  }

  initPlayer();
})();
