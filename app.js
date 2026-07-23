/* ============================================================
   looptrace·explained — page logic.
   All animation is pure CSS; this file only:
     1. runs the theme toggle (localStorage, app-namespaced key)
     2. starts scenes when they scroll into view (.is-playing)
     3. wires the ↺ replay buttons
   No network calls are possible (CSP connect-src 'none').
   ============================================================ */
(function () {
  "use strict";

  var root = document.documentElement;
  var THEME_KEY = "looptrace-explained.theme";
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  /* ---------- 1. theme: auto → light → dark → auto ---------- */
  var themeBtn = document.getElementById("theme-toggle");
  var ORDER = ["auto", "light", "dark"];

  function readTheme() {
    try {
      var t = localStorage.getItem(THEME_KEY);
      return ORDER.indexOf(t) > -1 ? t : "auto";
    } catch (e) {
      return "auto";
    }
  }

  function applyTheme(t) {
    if (t === "auto") {
      root.removeAttribute("data-theme");
    } else {
      root.setAttribute("data-theme", t);
    }
    if (themeBtn) themeBtn.textContent = "Theme: " + t;
  }

  function saveTheme(t) {
    try { localStorage.setItem(THEME_KEY, t); } catch (e) { /* private mode: theme just won't persist */ }
  }

  applyTheme(readTheme());

  if (themeBtn) {
    themeBtn.addEventListener("click", function () {
      var next = ORDER[(ORDER.indexOf(readTheme()) + 1) % ORDER.length];
      saveTheme(next);
      applyTheme(next);
    });
  }

  /* ---------- 2. play scenes on scroll into view ---------- */
  var scenes = Array.prototype.slice.call(document.querySelectorAll(".scene"));

  function playAll() {
    scenes.forEach(function (s) { s.classList.add("is-playing"); });
  }

  if (reduceMotion.matches) {
    // leave every scene in its static, legible final state
  } else if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-playing");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.25 });
    scenes.forEach(function (s) { io.observe(s); });
  } else {
    playAll();
  }

  /* ---------- 3. replay buttons ---------- */
  Array.prototype.slice.call(document.querySelectorAll(".replay")).forEach(function (btn) {
    btn.addEventListener("click", function () {
      var scene = btn.closest(".scene");
      if (!scene || reduceMotion.matches) return;
      scene.classList.remove("is-playing");
      void scene.offsetWidth; // force reflow so the animation restarts
      scene.classList.add("is-playing");
    });
  });
})();
