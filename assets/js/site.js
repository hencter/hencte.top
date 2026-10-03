/**
 * Site behaviour, bundled by Hugo's built-in esbuild (js.Build) and served as one
 * fingerprinted, SRI-protected file instead of several inline <script> blocks:
 * theme toggle, reading-focus chrome, code-copy buttons.
 *
 * The pre-paint theme boot stays inline on purpose (it must run before first paint).
 */
// --- theme toggle ---
(function () {
    var btn = document.getElementById("theme-toggle");
    if (!btn) return;
    function sync() {
      btn.setAttribute(
        "aria-pressed",
        document.documentElement.classList.contains("dark") ? "true" : "false"
      );
    }
    sync();
    btn.addEventListener("click", function () {
      var dark = document.documentElement.classList.toggle("dark");
      try {
        localStorage.setItem("theme", dark ? "dark" : "light");
      } catch (e) {}
      sync();
      // Lets the novel reader repaint its <canvas> pages with the other palette.
      document.dispatchEvent(new CustomEvent("themechange", { detail: { dark: dark } }));
    });
  })();

// --- reading focus chrome ---
(function () {
    var HIDE_AFTER = 2400; // idle ms before the chrome retreats
    var SCROLL_BEGIN = 160; // px before a down-scroll hides it
    var TOP_REVEAL = 96; // pointer band that brings it back
    var DELTA = 6;
    var doc = document.documentElement;
    var lastY = window.scrollY;
    var atTop = true;
    var idleTimer = null;
    var ticking = false;

    function menuOpen() {
      return !!document.querySelector("header details[open]");
    }

    function apply(hidden) {
      doc.classList.toggle("reading-chrome--hidden", Boolean(hidden) && !atTop && !menuOpen());
    }

    function armIdle() {
      clearTimeout(idleTimer);
      idleTimer = setTimeout(function () {
        if (!atTop) apply(true);
      }, HIDE_AFTER);
    }

    function onScroll() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () {
        var y = window.scrollY;
        atTop = y < SCROLL_BEGIN;
        if (atTop) {
          apply(false);
        } else {
          var dy = y - lastY;
          if (Math.abs(dy) > DELTA) {
            if (dy > 0) {
              apply(true);
            } else {
              apply(false);
              armIdle();
            }
          }
        }
        lastY = y;
        ticking = false;
      });
    }

    function init() {
      var railQuery = window.matchMedia("(min-width: 1280px)");
      function syncToc() {
        var tocs = document.querySelectorAll(".toc-rail details.toc");
        for (var i = 0; i < tocs.length; i++) tocs[i].open = railQuery.matches;
      }
      syncToc();
      if (railQuery.addEventListener) railQuery.addEventListener("change", syncToc);

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      atTop = window.scrollY < SCROLL_BEGIN;
      lastY = window.scrollY;
      apply(false);
      armIdle();

      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener(
        "mousemove",
        function (e) {
          if (e.clientY < TOP_REVEAL && !atTop) apply(false);
        },
        { passive: true },
      );
      document.addEventListener("focusin", function (e) {
        if (e.target && e.target.closest && e.target.closest("header")) apply(false);
      });
      document.addEventListener(
        "toggle",
        function (e) {
          if (e.target && e.target.tagName === "DETAILS") apply(false);
        },
        true,
      );
    }

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", init);
    } else {
      init();
    }
  })();

// --- code copy buttons ---
(function () {
    function wire() {
      document.querySelectorAll(".code-block").forEach(function (block) {
        var button = block.querySelector(".code-copy");
        var code = block.querySelector("code");
        var status = block.querySelector(".code-copy-status");
        if (!button || !code || button.dataset.bound === "1") return;
        button.dataset.bound = "1";
        button.addEventListener("click", function () {
          var label = button.textContent;
          var done = function () {
            // The button's accessible name comes from its static aria-label, so
            // the "✓" swap is a visual cue only; the live region is what reports
            // success to a screen reader.
            button.textContent = "✓";
            if (status) status.textContent = block.dataset.copied || "";
            setTimeout(function () {
              button.textContent = label;
              if (status) status.textContent = "";
            }, 1500);
          };
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(code.innerText).then(done, done);
          } else {
            var range = document.createRange();
            range.selectNodeContents(code);
            var sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
            done();
          }
        });
      });
    }
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", wire);
    } else {
      wire();
    }
  })();

// --- language select ---
// Navigating on change is the whole feature; storing the choice is what stops the
// pre-paint auto-detect (head/lang-auto.html) from overriding the reader later.
(function () {
  // The switcher is rendered twice — once in the desktop nav, once in the mobile
  // <details> panel — so every instance must be wired, not just the first.
  var selects = document.querySelectorAll(".lang-select");
  if (!selects.length) return;
  Array.prototype.forEach.call(selects, function (select) {
    select.addEventListener("change", function () {
      try {
        localStorage.setItem(
          "lang",
          select.options[select.selectedIndex].getAttribute("data-locale") || select.value,
        );
      } catch (e) {}
      window.location.assign(select.value);
    });
  });
})();
