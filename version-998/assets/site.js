(function () {
  var mobileToggle = document.querySelector('.nav-toggle');
  var mobileNav = document.querySelector('.mobile-nav');

  if (mobileToggle && mobileNav) {
    mobileToggle.addEventListener('click', function () {
      var isOpen = mobileNav.classList.toggle('is-open');
      mobileToggle.setAttribute('aria-expanded', String(isOpen));
    });
  }

  document.querySelectorAll('.back-top').forEach(function (button) {
    button.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });

  setupHeroCarousel();
  setupFilters();
  setupPlayers();
  setupPlayerScrollButtons();

  function setupHeroCarousel() {
    var carousel = document.querySelector('[data-hero-carousel]');
    if (!carousel) {
      return;
    }

    var slides = Array.prototype.slice.call(carousel.querySelectorAll('[data-hero-slide]'));
    var dots = Array.prototype.slice.call(carousel.querySelectorAll('[data-hero-dot]'));
    var previousButton = carousel.querySelector('[data-hero-prev]');
    var nextButton = carousel.querySelector('[data-hero-next]');
    var index = 0;
    var timer = null;

    function showSlide(nextIndex) {
      if (!slides.length) {
        return;
      }

      index = (nextIndex + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle('is-active', slideIndex === index);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle('is-active', dotIndex === index);
      });
    }

    function startTimer() {
      stopTimer();
      timer = window.setInterval(function () {
        showSlide(index + 1);
      }, 5200);
    }

    function stopTimer() {
      if (timer) {
        window.clearInterval(timer);
      }
    }

    dots.forEach(function (dot, dotIndex) {
      dot.addEventListener('click', function () {
        showSlide(dotIndex);
        startTimer();
      });
    });

    if (previousButton) {
      previousButton.addEventListener('click', function () {
        showSlide(index - 1);
        startTimer();
      });
    }

    if (nextButton) {
      nextButton.addEventListener('click', function () {
        showSlide(index + 1);
        startTimer();
      });
    }

    carousel.addEventListener('mouseenter', stopTimer);
    carousel.addEventListener('mouseleave', startTimer);
    showSlide(0);
    startTimer();
  }

  function setupFilters() {
    document.querySelectorAll('[data-filter-scope]').forEach(function (scope) {
      var input = scope.querySelector('[data-filter-input]');
      var typeSelect = scope.querySelector('[data-filter-type]');
      var yearSelect = scope.querySelector('[data-filter-year]');
      var result = scope.querySelector('[data-filter-result]');
      var cards = Array.prototype.slice.call(scope.querySelectorAll('.movie-card'));

      if (!cards.length) {
        return;
      }

      populateSelect(typeSelect, collectValues(cards, 'type'), '全部类型');
      populateSelect(yearSelect, collectValues(cards, 'year').sort(function (a, b) {
        return Number(b) - Number(a);
      }), '全部年份');

      function applyFilter() {
        var query = normalize(input ? input.value : '');
        var selectedType = typeSelect ? typeSelect.value : '';
        var selectedYear = yearSelect ? yearSelect.value : '';
        var visibleCount = 0;

        cards.forEach(function (card) {
          var searchText = normalize(card.getAttribute('data-search') || '');
          var cardType = card.getAttribute('data-type') || '';
          var cardYear = card.getAttribute('data-year') || '';
          var matched = true;

          if (query && searchText.indexOf(query) === -1) {
            matched = false;
          }

          if (selectedType && cardType !== selectedType) {
            matched = false;
          }

          if (selectedYear && cardYear !== selectedYear) {
            matched = false;
          }

          card.hidden = !matched;
          if (matched) {
            visibleCount += 1;
          }
        });

        if (result) {
          result.textContent = '当前显示 ' + visibleCount + ' / ' + cards.length + ' 部影片';
        }
      }

      if (input) {
        input.addEventListener('input', applyFilter);
      }
      if (typeSelect) {
        typeSelect.addEventListener('change', applyFilter);
      }
      if (yearSelect) {
        yearSelect.addEventListener('change', applyFilter);
      }
      applyFilter();
    });
  }

  function collectValues(cards, key) {
    var values = [];
    var seen = Object.create(null);

    cards.forEach(function (card) {
      var value = card.getAttribute('data-' + key) || '';
      if (value && !seen[value]) {
        seen[value] = true;
        values.push(value);
      }
    });

    return values;
  }

  function populateSelect(select, values, defaultLabel) {
    if (!select) {
      return;
    }

    select.innerHTML = '';
    var defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = defaultLabel;
    select.appendChild(defaultOption);

    values.forEach(function (value) {
      var option = document.createElement('option');
      option.value = value;
      option.textContent = value;
      select.appendChild(option);
    });
  }

  function normalize(value) {
    return String(value || '').trim().toLowerCase();
  }

  var hlsConstructorPromise = null;

  function loadHlsConstructor() {
    if (!hlsConstructorPromise) {
      hlsConstructorPromise = import('./hls.js').then(function (module) {
        return module.H;
      });
    }

    return hlsConstructorPromise;
  }

  function setupPlayers() {
    document.querySelectorAll('[data-video-player]').forEach(function (player) {
      var video = player.querySelector('video');
      var playButtons = player.querySelectorAll('[data-player-play]');
      var overlay = player.querySelector('[data-player-overlay]');
      var message = player.querySelector('[data-player-message]');
      var source = player.getAttribute('data-video-url');
      var loadingPromise = null;
      var hlsInstance = null;

      if (!video || !source) {
        return;
      }

      function setMessage(text) {
        if (!message) {
          return;
        }
        message.textContent = text;
        message.hidden = !text;
      }

      function ensureLoaded() {
        if (player.getAttribute('data-loaded') === 'true') {
          return Promise.resolve();
        }

        if (loadingPromise) {
          return loadingPromise;
        }

        setMessage('');

        loadingPromise = new Promise(function (resolve) {
          if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = source;
            player.setAttribute('data-loaded', 'true');
            player.classList.add('is-loaded');
            resolve();
            return;
          }

          loadHlsConstructor().then(function (Hls) {
            if (!Hls || !Hls.isSupported()) {
              setMessage('当前浏览器不支持 HLS 播放，请更换支持的浏览器。');
              resolve();
              return;
            }

            hlsInstance = new Hls({
              enableWorker: true,
              lowLatencyMode: true
            });

            hlsInstance.loadSource(source);
            hlsInstance.attachMedia(video);
            hlsInstance.on(Hls.Events.MANIFEST_PARSED, function () {
              player.setAttribute('data-loaded', 'true');
              player.classList.add('is-loaded');
              resolve();
            });
            hlsInstance.on(Hls.Events.ERROR, function (eventName, data) {
              if (data && data.fatal) {
                setMessage('视频加载失败，请稍后重试。');
                resolve();
              }
            });
          }).catch(function () {
            setMessage('播放器初始化失败，请刷新页面后重试。');
            resolve();
          });
        });

        return loadingPromise;
      }

      function playOrPause() {
        ensureLoaded().then(function () {
          if (video.paused) {
            video.play().catch(function () {
              setMessage('浏览器阻止了自动播放，请再次点击播放按钮。');
            });
          } else {
            video.pause();
          }
        });
      }

      playButtons.forEach(function (button) {
        button.addEventListener('click', function (event) {
          event.preventDefault();
          playOrPause();
        });
      });

      video.addEventListener('click', playOrPause);
      video.addEventListener('play', function () {
        player.classList.add('is-playing');
        if (overlay) {
          overlay.classList.add('is-hidden');
        }
      });
      video.addEventListener('pause', function () {
        player.classList.remove('is-playing');
        if (overlay) {
          overlay.classList.remove('is-hidden');
        }
      });
      window.addEventListener('beforeunload', function () {
        if (hlsInstance) {
          hlsInstance.destroy();
        }
      });
    });
  }

  function setupPlayerScrollButtons() {
    document.querySelectorAll('[data-scroll-player]').forEach(function (button) {
      button.addEventListener('click', function () {
        var player = document.querySelector('[data-video-player]');
        if (player) {
          player.scrollIntoView({ behavior: 'smooth', block: 'center' });
          var playButton = player.querySelector('[data-player-play]');
          if (playButton) {
            window.setTimeout(function () {
              playButton.click();
            }, 420);
          }
        }
      });
    });
  }
}());
