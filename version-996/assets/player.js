(function () {
  function getHlsClass() {
    if (window.HlsModule && window.HlsModule.H) {
      return window.HlsModule.H;
    }
    return null;
  }

  function attachSource(video, source) {
    if (!video || !source || video.getAttribute("data-ready") === "1") {
      return;
    }

    var Hls = getHlsClass();
    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = source;
      video.setAttribute("data-ready", "1");
      return;
    }

    if (Hls && Hls.isSupported()) {
      var hls = new Hls({ enableWorker: true, lowLatencyMode: true });
      hls.loadSource(source);
      hls.attachMedia(video);
      video.hlsPlayer = hls;
      video.setAttribute("data-ready", "1");
      return;
    }

    video.src = source;
    video.setAttribute("data-ready", "1");
  }

  function initMoviePlayer(options) {
    var video = document.getElementById(options.videoId);
    var playButton = document.getElementById(options.playButtonId);
    var overlay = document.getElementById(options.overlayId);
    var source = options.source;

    if (!video || !source) {
      return;
    }

    function hideOverlay() {
      if (overlay) {
        overlay.classList.add("hidden");
      }
    }

    function start() {
      attachSource(video, source);
      hideOverlay();
      var request = video.play();
      if (request && typeof request.catch === "function") {
        request.catch(function () {});
      }
    }

    if (playButton) {
      playButton.addEventListener("click", function (event) {
        event.preventDefault();
        event.stopPropagation();
        start();
      });
    }

    if (overlay) {
      overlay.addEventListener("click", function () {
        start();
      });
    }

    video.addEventListener("click", function () {
      if (video.paused) {
        start();
      }
    });

    video.addEventListener("play", hideOverlay);
  }

  window.MoviePlayer = {
    init: initMoviePlayer
  };
})();
