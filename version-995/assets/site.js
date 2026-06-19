(function () {
  function ready(fn) {
    if (document.readyState !== "loading") {
      fn();
      return;
    }
    document.addEventListener("DOMContentLoaded", fn);
  }

  function initNavigation() {
    var toggle = document.querySelector(".nav-toggle");
    var links = document.querySelector(".nav-links");
    if (!toggle || !links) {
      return;
    }
    toggle.addEventListener("click", function () {
      links.classList.toggle("open");
    });
  }

  function initHero() {
    var hero = document.querySelector("[data-hero]");
    if (!hero) {
      return;
    }
    var slides = Array.prototype.slice.call(hero.querySelectorAll(".hero-slide"));
    var dots = Array.prototype.slice.call(hero.querySelectorAll(".hero-dot"));
    if (slides.length < 2) {
      return;
    }
    var index = 0;
    var timer = null;

    function show(nextIndex) {
      index = nextIndex % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle("active", slideIndex === index);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle("active", dotIndex === index);
      });
    }

    function start() {
      stop();
      timer = window.setInterval(function () {
        show(index + 1);
      }, 5200);
    }

    function stop() {
      if (timer) {
        window.clearInterval(timer);
        timer = null;
      }
    }

    dots.forEach(function (dot, dotIndex) {
      dot.addEventListener("click", function () {
        show(dotIndex);
        start();
      });
    });

    hero.addEventListener("mouseenter", stop);
    hero.addEventListener("mouseleave", start);
    start();
  }

  function initFilters() {
    var grid = document.querySelector("[data-filter-grid]");
    if (!grid) {
      return;
    }
    var panel = document.querySelector(".filter-panel");
    if (!panel) {
      return;
    }
    var search = panel.querySelector("[data-filter-search]");
    var region = panel.querySelector("[data-filter-region]");
    var type = panel.querySelector("[data-filter-type]");
    var year = panel.querySelector("[data-filter-year]");
    var reset = panel.querySelector("[data-filter-reset]");
    var cards = Array.prototype.slice.call(grid.children);

    function value(node) {
      return node ? node.value.trim().toLowerCase() : "";
    }

    function apply() {
      var keyword = value(search);
      var regionValue = value(region);
      var typeValue = value(type);
      var yearValue = value(year);
      cards.forEach(function (card) {
        var haystack = [
          card.getAttribute("data-title"),
          card.getAttribute("data-region"),
          card.getAttribute("data-type"),
          card.getAttribute("data-year"),
          card.getAttribute("data-genre"),
          card.textContent
        ].join(" ").toLowerCase();
        var matchKeyword = !keyword || haystack.indexOf(keyword) !== -1;
        var matchRegion = !regionValue || (card.getAttribute("data-region") || "").toLowerCase() === regionValue;
        var matchType = !typeValue || (card.getAttribute("data-type") || "").toLowerCase() === typeValue;
        var matchYear = !yearValue || (card.getAttribute("data-year") || "").toLowerCase() === yearValue;
        card.classList.toggle("is-hidden", !(matchKeyword && matchRegion && matchType && matchYear));
      });
    }

    [search, region, type, year].forEach(function (node) {
      if (!node) {
        return;
      }
      node.addEventListener("input", apply);
      node.addEventListener("change", apply);
    });

    if (reset) {
      reset.addEventListener("click", function () {
        if (search) {
          search.value = "";
        }
        if (region) {
          region.value = "";
        }
        if (type) {
          type.value = "";
        }
        if (year) {
          year.value = "";
        }
        apply();
      });
    }

    var query = new URLSearchParams(window.location.search).get("q");
    if (query && search) {
      search.value = query;
      apply();
    }
  }

  function attachVideoSource(video, streamUrl) {
    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = streamUrl;
      return null;
    }
    if (window.Hls && window.Hls.isSupported()) {
      var hls = new window.Hls({ enableWorker: true, lowLatencyMode: true });
      hls.loadSource(streamUrl);
      hls.attachMedia(video);
      return hls;
    }
    video.src = streamUrl;
    return null;
  }

  function initPlayer(streamUrl) {
    var video = document.getElementById("movie-player");
    var veil = document.getElementById("player-veil");
    if (!video || !streamUrl) {
      return;
    }
    var hls = attachVideoSource(video, streamUrl);

    function play() {
      if (veil) {
        veil.classList.add("hidden");
      }
      var promise = video.play();
      if (promise && typeof promise.catch === "function") {
        promise.catch(function () {
          if (veil) {
            veil.classList.remove("hidden");
          }
        });
      }
    }

    if (veil) {
      veil.addEventListener("click", play);
    }

    video.addEventListener("click", function () {
      if (video.paused) {
        play();
      }
    });

    video.addEventListener("play", function () {
      if (veil) {
        veil.classList.add("hidden");
      }
    });

    video.addEventListener("pause", function () {
      if (veil && video.currentTime === 0) {
        veil.classList.remove("hidden");
      }
    });

    window.addEventListener("pagehide", function () {
      if (hls && typeof hls.destroy === "function") {
        hls.destroy();
      }
    });
  }

  ready(function () {
    initNavigation();
    initHero();
    initFilters();
  });

  window.MovieSite = {
    initPlayer: initPlayer
  };
})();
