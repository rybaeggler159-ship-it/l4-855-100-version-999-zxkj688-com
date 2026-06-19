(function () {
  function getQuery() {
    var params = new URLSearchParams(window.location.search);
    return (params.get("q") || "").trim();
  }

  function escapeHtml(value) {
    return String(value || "").replace(/[&<>"']/g, function (ch) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "\"": "&quot;",
        "'": "&#39;"
      }[ch];
    });
  }

  function card(movie) {
    var tags = (movie.tags || []).slice(0, 3).map(function (tag) {
      return "<span>" + escapeHtml(tag) + "</span>";
    }).join("");
    return "" +
      "<article class=\"movie-card\" data-movie-card>" +
      "<a class=\"movie-poster\" href=\"" + escapeHtml(movie.url) + "\" aria-label=\"" + escapeHtml(movie.title) + "\">" +
      "<img src=\"" + escapeHtml(movie.cover) + "\" alt=\"" + escapeHtml(movie.title) + "\" loading=\"lazy\" onerror=\"this.style.opacity='0'\">" +
      "<span class=\"movie-score\">" + escapeHtml(movie.heat) + "</span>" +
      "</a>" +
      "<div class=\"movie-info\">" +
      "<div class=\"movie-meta\"><span>" + escapeHtml(movie.year) + "</span><span>" + escapeHtml(movie.region) + "</span><span>" + escapeHtml(movie.type) + "</span></div>" +
      "<h3><a href=\"" + escapeHtml(movie.url) + "\">" + escapeHtml(movie.title) + "</a></h3>" +
      "<p>" + escapeHtml(movie.oneLine) + "</p>" +
      "<div class=\"tag-row\">" + tags + "</div>" +
      "</div>" +
      "</article>";
  }

  function render(query) {
    var results = document.querySelector("[data-search-results]");
    var state = document.querySelector("[data-search-state]");
    var input = document.querySelector("[data-page-search] input");
    if (!results || !window.SITE_MOVIES) {
      return;
    }
    if (input) {
      input.value = query;
    }
    var value = query.toLowerCase();
    var pool = window.SITE_MOVIES;
    var list = value ? pool.filter(function (movie) {
      var hay = [movie.title, movie.year, movie.region, movie.type, movie.genre, movie.category, (movie.tags || []).join(" ")].join(" ").toLowerCase();
      return hay.indexOf(value) >= 0;
    }) : pool.slice(0, 48);
    list = list.slice(0, 96);
    results.innerHTML = list.map(card).join("");
    if (state) {
      state.textContent = value ? "搜索结果" : "精选内容";
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    var form = document.querySelector("[data-page-search]");
    render(getQuery());
    if (form) {
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        var input = form.querySelector("input");
        var query = input ? input.value.trim() : "";
        var url = query ? "./search.html?q=" + encodeURIComponent(query) : "./search.html";
        history.replaceState(null, "", url);
        render(query);
      });
    }
  });
})();
