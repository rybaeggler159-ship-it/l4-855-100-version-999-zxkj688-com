(function () {
  var menuButton = document.querySelector("[data-menu-toggle]");
  var mobileNav = document.querySelector("[data-mobile-nav]");

  if (menuButton && mobileNav) {
    menuButton.addEventListener("click", function () {
      mobileNav.classList.toggle("open");
    });
  }

  var slider = document.querySelector("[data-hero-slider]");
  if (slider) {
    var slides = Array.prototype.slice.call(slider.querySelectorAll(".hero-slide"));
    var dots = Array.prototype.slice.call(slider.querySelectorAll(".hero-dot"));
    var current = 0;

    function showSlide(index) {
      current = (index + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle("active", slideIndex === current);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle("active", dotIndex === current);
      });
    }

    dots.forEach(function (dot, dotIndex) {
      dot.addEventListener("click", function () {
        showSlide(dotIndex);
      });
    });

    if (slides.length > 1) {
      window.setInterval(function () {
        showSlide(current + 1);
      }, 5200);
    }
  }

  document.querySelectorAll("[data-filter-scope]").forEach(function (scope) {
    var input = scope.querySelector("[data-search-input]");
    var filters = Array.prototype.slice.call(scope.querySelectorAll("[data-filter-field]"));
    var cards = Array.prototype.slice.call(scope.querySelectorAll(".movie-card"));
    var noResults = scope.querySelector("[data-no-results]");
    var params = new URLSearchParams(window.location.search);
    var initialQuery = params.get("q");

    if (input && initialQuery && !input.value) {
      input.value = initialQuery;
    }

    function normalize(value) {
      return String(value || "").toLowerCase().replace(/\s+/g, " ").trim();
    }

    function applyFilter() {
      var query = normalize(input ? input.value : "");
      var visible = 0;

      cards.forEach(function (card) {
        var text = normalize([
          card.getAttribute("data-title"),
          card.getAttribute("data-year"),
          card.getAttribute("data-region"),
          card.getAttribute("data-type"),
          card.getAttribute("data-genre"),
          card.getAttribute("data-tags")
        ].join(" "));

        var matchQuery = !query || text.indexOf(query) !== -1;
        var matchFilters = filters.every(function (field) {
          var key = field.getAttribute("data-filter-field");
          var value = normalize(field.value);
          if (!value) {
            return true;
          }
          return normalize(card.getAttribute("data-" + key)).indexOf(value) !== -1;
        });

        var matched = matchQuery && matchFilters;
        card.hidden = !matched;
        if (matched) {
          visible += 1;
        }
      });

      if (noResults) {
        noResults.classList.toggle("show", visible === 0);
      }
    }

    if (input) {
      input.addEventListener("input", applyFilter);
    }
    filters.forEach(function (field) {
      field.addEventListener("change", applyFilter);
    });

    applyFilter();
  });
})();
