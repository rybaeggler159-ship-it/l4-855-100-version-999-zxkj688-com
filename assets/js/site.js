(function () {
  var mobileButton = document.querySelector('.mobile-toggle');
  var mobileNav = document.querySelector('.mobile-nav');

  if (mobileButton && mobileNav) {
    mobileButton.addEventListener('click', function () {
      var open = mobileNav.classList.toggle('open');
      mobileButton.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  var carousel = document.querySelector('.hero-carousel');

  if (carousel) {
    var slides = Array.prototype.slice.call(carousel.querySelectorAll('.hero-slide'));
    var dots = Array.prototype.slice.call(carousel.querySelectorAll('.hero-dot'));
    var current = 0;

    var showSlide = function (index) {
      current = (index + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle('active', slideIndex === current);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle('active', dotIndex === current);
      });
    };

    dots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        showSlide(Number(dot.getAttribute('data-target') || 0));
      });
    });

    if (slides.length > 1) {
      window.setInterval(function () {
        showSlide(current + 1);
      }, 5200);
    }
  }

  var filterLists = Array.prototype.slice.call(document.querySelectorAll('.filter-list'));

  filterLists.forEach(function (list) {
    var scope = list.closest('.section') || document;
    var input = scope.querySelector('.filter-input');
    var region = scope.querySelector('.filter-region');
    var type = scope.querySelector('.filter-type');
    var empty = scope.querySelector('.empty-state');
    var cards = Array.prototype.slice.call(list.querySelectorAll('.movie-card'));

    var applyFilter = function () {
      var keyword = input ? input.value.trim().toLowerCase() : '';
      var regionValue = region ? region.value : '';
      var typeValue = type ? type.value : '';
      var visible = 0;

      cards.forEach(function (card) {
        var text = (card.getAttribute('data-search') || '').toLowerCase();
        var cardRegion = card.getAttribute('data-region') || '';
        var cardType = card.getAttribute('data-type') || '';
        var matched = true;

        if (keyword && text.indexOf(keyword) === -1) {
          matched = false;
        }

        if (regionValue && cardRegion !== regionValue) {
          matched = false;
        }

        if (typeValue && cardType !== typeValue) {
          matched = false;
        }

        card.hidden = !matched;
        if (matched) {
          visible += 1;
        }
      });

      if (empty) {
        empty.hidden = visible !== 0;
      }
    };

    [input, region, type].forEach(function (element) {
      if (element) {
        element.addEventListener('input', applyFilter);
        element.addEventListener('change', applyFilter);
      }
    });
  });

  var searchInput = document.getElementById('globalSearchInput');
  var searchButton = document.getElementById('globalSearchButton');
  var searchResults = document.getElementById('searchResults');
  var searchTitle = document.getElementById('searchResultTitle');

  var safeText = function (value) {
    return String(value || '').replace(/[&<>"']/g, function (char) {
      return {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      }[char];
    });
  };

  var renderSearch = function () {
    if (!searchInput || !searchResults || !Array.isArray(window.MOVIE_SEARCH_INDEX)) {
      return;
    }

    var keyword = searchInput.value.trim().toLowerCase();
    var items = window.MOVIE_SEARCH_INDEX.filter(function (item) {
      var text = [item.title, item.region, item.type, item.year, item.genre, item.tags, item.oneLine].join(' ').toLowerCase();
      return keyword ? text.indexOf(keyword) !== -1 : true;
    }).slice(0, 80);

    searchTitle.textContent = keyword ? '匹配结果' : '热门推荐';

    if (!items.length) {
      searchResults.innerHTML = '<div class="empty-state">暂无匹配影片</div>';
      return;
    }

    searchResults.innerHTML = items.map(function (item) {
      return '<article class="movie-card">'
        + '<a class="poster-link" href="' + safeText(item.href) + '">'
        + '<img src="' + safeText(item.cover) + '" alt="' + safeText(item.title) + '" loading="lazy">'
        + '<span class="poster-badge">' + safeText(item.type) + '</span>'
        + '<span class="poster-year">' + safeText(item.year) + '</span>'
        + '</a>'
        + '<div class="card-body">'
        + '<a class="card-title" href="' + safeText(item.href) + '">' + safeText(item.title) + '</a>'
        + '<p class="card-desc">' + safeText(item.oneLine) + '</p>'
        + '<div class="card-meta"><span>' + safeText(item.region) + '</span><span>' + safeText(item.genre) + '</span></div>'
        + '</div>'
        + '</article>';
    }).join('');
  };

  if (searchInput && searchButton) {
    var params = new URLSearchParams(window.location.search);
    var q = params.get('q');

    if (q) {
      searchInput.value = q;
    }

    searchButton.addEventListener('click', renderSearch);
    searchInput.addEventListener('input', renderSearch);
    searchInput.addEventListener('keydown', function (event) {
      if (event.key === 'Enter') {
        event.preventDefault();
        renderSearch();
      }
    });

    renderSearch();
    window.addEventListener('load', renderSearch);
  }

  window.initMoviePlayer = function (source) {
    var player = document.querySelector('.movie-player');

    if (!player) {
      return;
    }

    var video = player.querySelector('.movie-video');
    var cover = player.querySelector('.player-cover');
    var message = player.querySelector('.player-message');
    var started = false;
    var hlsInstance = null;

    var playVideo = function () {
      var promise = video.play();

      if (promise && promise.catch) {
        promise.catch(function () {
          if (message) {
            message.textContent = '点击播放按钮开始观看';
          }
        });
      }
    };

    var attachSource = function () {
      if (started) {
        playVideo();
        return;
      }

      started = true;

      if (cover) {
        cover.classList.add('hidden');
      }

      video.controls = true;

      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = source;
        video.addEventListener('loadedmetadata', playVideo, { once: true });
        video.load();
        return;
      }

      if (window.Hls && window.Hls.isSupported()) {
        hlsInstance = new window.Hls({
          enableWorker: true,
          lowLatencyMode: true
        });

        hlsInstance.loadSource(source);
        hlsInstance.attachMedia(video);
        hlsInstance.on(window.Hls.Events.MANIFEST_PARSED, function () {
          playVideo();
        });
        hlsInstance.on(window.Hls.Events.ERROR, function (event, data) {
          if (data && data.fatal && message) {
            message.textContent = '播放暂时不可用，请稍后再试';
          }
        });
        return;
      }

      video.src = source;
      video.load();
      playVideo();
    };

    if (cover) {
      cover.addEventListener('click', attachSource);
    }

    video.addEventListener('click', function () {
      if (video.paused) {
        attachSource();
      }
    });

    var trigger = document.querySelector('[data-player-trigger]');

    if (trigger) {
      trigger.addEventListener('click', function (event) {
        event.preventDefault();
        window.scrollTo({ top: player.getBoundingClientRect().top + window.scrollY - 90, behavior: 'smooth' });
        attachSource();
      });
    }

    window.addEventListener('beforeunload', function () {
      if (hlsInstance) {
        hlsInstance.destroy();
      }
    });
  };
}());
