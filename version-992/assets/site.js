(function () {
  function ready(callback) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', callback);
    } else {
      callback();
    }
  }

  ready(function () {
    document.querySelectorAll('[data-mobile-toggle]').forEach(function (button) {
      button.addEventListener('click', function () {
        var panel = document.querySelector('[data-mobile-panel]');
        if (panel) {
          panel.classList.toggle('open');
        }
      });
    });

    document.querySelectorAll('[data-hero-slider]').forEach(function (slider) {
      var slides = Array.prototype.slice.call(slider.querySelectorAll('[data-hero-slide]'));
      var dots = Array.prototype.slice.call(slider.querySelectorAll('[data-hero-dot]'));
      var prev = slider.querySelector('[data-hero-prev]');
      var next = slider.querySelector('[data-hero-next]');
      var index = 0;
      var timer = null;

      function show(nextIndex) {
        if (!slides.length) {
          return;
        }
        index = (nextIndex + slides.length) % slides.length;
        slides.forEach(function (slide, i) {
          slide.classList.toggle('active', i === index);
        });
        dots.forEach(function (dot, i) {
          dot.classList.toggle('active', i === index);
        });
      }

      function restart() {
        if (timer) {
          window.clearInterval(timer);
        }
        timer = window.setInterval(function () {
          show(index + 1);
        }, 5000);
      }

      if (prev) {
        prev.addEventListener('click', function () {
          show(index - 1);
          restart();
        });
      }

      if (next) {
        next.addEventListener('click', function () {
          show(index + 1);
          restart();
        });
      }

      dots.forEach(function (dot) {
        dot.addEventListener('click', function () {
          show(parseInt(dot.getAttribute('data-hero-dot') || '0', 10));
          restart();
        });
      });

      show(0);
      restart();
    });

    document.querySelectorAll('[data-search-scope]').forEach(function (scope) {
      var input = scope.querySelector('[data-movie-search]');
      var buttons = Array.prototype.slice.call(scope.querySelectorAll('[data-filter-button]'));
      var cards = Array.prototype.slice.call(scope.querySelectorAll('[data-movie-card]'));
      var empty = scope.querySelector('[data-empty-state]');
      var currentFilter = 'all';

      function apply() {
        var query = input ? input.value.trim().toLowerCase() : '';
        var shown = 0;
        cards.forEach(function (card) {
          var haystack = [
            card.getAttribute('data-title') || '',
            card.getAttribute('data-keywords') || '',
            card.getAttribute('data-year') || '',
            card.getAttribute('data-region') || ''
          ].join(' ').toLowerCase();
          var kind = card.getAttribute('data-kind') || 'other';
          var matchedText = !query || haystack.indexOf(query) !== -1;
          var matchedFilter = currentFilter === 'all' || kind === currentFilter;
          var visible = matchedText && matchedFilter;
          card.hidden = !visible;
          if (visible) {
            shown += 1;
          }
        });
        if (empty) {
          empty.classList.toggle('hidden', shown !== 0);
        }
      }

      if (input) {
        input.addEventListener('input', apply);
      }

      buttons.forEach(function (button) {
        button.addEventListener('click', function () {
          currentFilter = button.getAttribute('data-filter') || 'all';
          buttons.forEach(function (item) {
            item.classList.toggle('active', item === button);
          });
          apply();
        });
      });

      apply();
    });

    document.querySelectorAll('[data-player]').forEach(function (player) {
      var video = player.querySelector('video');
      var toggle = player.querySelector('[data-play-toggle]');
      if (!video) {
        return;
      }
      var stream = video.getAttribute('data-stream') || '';
      var attached = false;
      var hlsInstance = null;

      function attach() {
        if (attached || !stream) {
          return;
        }
        if (window.Hls && window.Hls.isSupported()) {
          hlsInstance = new window.Hls({
            enableWorker: true,
            lowLatencyMode: true
          });
          hlsInstance.loadSource(stream);
          hlsInstance.attachMedia(video);
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = stream;
        }
        attached = true;
      }

      function play() {
        attach();
        var promise = video.play();
        if (promise && typeof promise.catch === 'function') {
          promise.catch(function () {});
        }
      }

      if (toggle) {
        toggle.addEventListener('click', function () {
          play();
        });
      }

      video.addEventListener('click', function () {
        if (video.paused) {
          play();
        }
      });

      video.addEventListener('play', function () {
        if (toggle) {
          toggle.classList.add('is-hidden');
        }
      });

      video.addEventListener('pause', function () {
        if (toggle && video.currentTime === 0) {
          toggle.classList.remove('is-hidden');
        }
      });

      window.addEventListener('beforeunload', function () {
        if (hlsInstance) {
          hlsInstance.destroy();
        }
      });
    });
  });
})();
