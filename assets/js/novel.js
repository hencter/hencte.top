/**
 * Novel chapter reader: draws the chapter text into <canvas>.
 * Extracted from layouts/_partials/novel-canvas.html; bundled by js.Build.
 *
 * The palette and the page grid come from CSS (--novel-paper / --novel-ink /
 * --novel-watermark), so dark mode is one variable flip rather than a second
 * render path — a cream canvas in a #030712 shell was a full-screen glare.
 */
(function () {
      var root = document.querySelector("[data-novel-reader]");
      if (!root || !window.HTMLCanvasElement) return;
      var source = root.querySelector("[data-novel-source]");
      var host = root.querySelector("[data-novel-pages]");
      // The source is a <div> now (was a <template>); both branches are kept so
      // either element works.
      var text = (source.content ? source.content.textContent : source.textContent) || "";
      // Safety net for any entity that survived parsing.
      if (text.indexOf("&") >= 0) {
        var dec = document.createElement("textarea");
        dec.innerHTML = text;
        text = dec.value;
      }
      // Strip the Markdown that would otherwise be painted literally.
      text = text
        .replace(/\r/g, "")
        .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
        .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
        .replace(/^\s{0,3}#{1,6}\s+/gm, "")
        .replace(/^\s{0,3}>\s?/gm, "")
        .replace(/\[!\w+\][-+]?\s*/g, "")  // Obsidian callout markers like [!summary]
        .replace(/[*_`]{1,3}/g, "")
        .replace(/^\s*-{3,}\s*$/gm, "")  // horizontal rules come from the vault's front matter separator
        .replace(/^\s*#{1,6}\s+.*(?:\n|$)/, "")
        .trim();
      if (!text) return;

      var W = 780,
        H = 1400,
        PAD = 40,
        TOP = 84,
        FONT = 24,
        LH = 36,
        BOTTOM = 116,
        WM = "© 亦幸小阁 · hencte.top",
        COLS = W - PAD * 2,
        ROWS = Math.floor((H - TOP - BOTTOM) / LH);
      var NO_START = "。，、；：！？）】》」』”’…·—%";
      var NO_END = "（【《「『“‘";

      var probe = document.createElement("canvas").getContext("2d");
      function face(px) {
        return px + 'px "LXGWWenKai-Novel", "LXGW WenKai", sans-serif';
      }

      // Palette is read from the document element once per theme change instead of
      // being hardcoded, so `.dark { --novel-* }` in main.css drives it.
      var palette = null;
      function refreshPalette() {
        var cs = getComputedStyle(document.documentElement);
        function read(name, fallback) {
          var v = cs.getPropertyValue(name);
          return (v && v.trim()) || fallback;
        }
        palette = {
          paper: read("--novel-paper", "#faf7f0"),
          ink: read("--novel-ink", "#1f2937"),
          watermark: read("--novel-watermark", "#b3aa99"),
        };
      }
      refreshPalette();

      function layout() {
        probe.font = face(FONT);
        var lines = [];
        text.split(/\n{2,}/).forEach(function (block, index) {
          var para = block.replace(/\n/g, "").trim();
          if (!para) return;
          if (lines.length && index > 0) lines.push("");
          var line = "";
          for (var i = 0; i < para.length; i++) {
            var ch = para[i];
            if (line && probe.measureText(line + ch).width > COLS) {
              if (NO_END.indexOf(line[line.length - 1]) >= 0) {
                line += ch;
                continue;
              }
              lines.push(line);
              line = "";
            }
            line += ch;
          }
          if (line) lines.push(line);
        });
        // 禁则: closing punctuation may not open a line.
        for (var i = 1; i < lines.length; i++) {
          while (lines[i] && NO_START.indexOf(lines[i][0]) >= 0) {
            lines[i - 1] += lines[i][0];
            lines[i] = lines[i].slice(1);
          }
        }
        return lines;
      }

      function paint(canvas, lines) {
        var ctx = canvas.getContext("2d");
        ctx.fillStyle = palette.paper;
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = palette.ink;
        ctx.font = face(FONT);
        ctx.textBaseline = "alphabetic";
        for (var r = 0; r < lines.length; r++) {
          if (lines[r]) ctx.fillText(lines[r], PAD, TOP + r * LH);
        }
        ctx.fillStyle = palette.watermark;
        ctx.font = face(16);
        ctx.textAlign = "center";
        ctx.fillText(WM, W / 2, H - 42);
        ctx.textAlign = "left";
      }

      var observer = "IntersectionObserver" in window
        ? new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
              if (!entry.isIntersecting) return;
              draw(entry.target);
            });
          }, { rootMargin: "600px 0px" })
        : null;

      var pages = [];

      function draw(canvas) {
        if (canvas.dataset.drawn === "1") return;
        canvas.dataset.drawn = "1";
        paint(canvas, pages[Number(canvas.dataset.page) - 1] || []);
        if (observer) observer.unobserve(canvas);
      }

      /**
       * Wrap the text, resize the page list to match, and repaint.
       *
       * Called twice on purpose. The first call runs before the webfont is ready
       * and uses the fallback face, which reserves the page boxes immediately
       * (no empty gap while 580KB downloads). The second runs once
       * document.fonts.load() settles, because LXGW measures differently from the
       * fallback: the old code wrapped with the fallback metrics and then painted
       * with LXGW, so lines could overflow the page they were measured for. The
       * re-measure is also what makes the theme-change repaint possible.
       */
      function render() {
        var lines = layout();
        pages = [];
        for (var i = 0; i < lines.length; i += ROWS) pages.push(lines.slice(i, i + ROWS));
        if (!pages.length) return;

        for (var n = host.children.length; n < pages.length; n++) {
          var canvas = document.createElement("canvas");
          canvas.className = "novel-page";
          canvas.width = W;
          canvas.height = H;
          host.appendChild(canvas);
        }
        while (host.children.length > pages.length) host.removeChild(host.lastElementChild);

        for (var p = 0; p < host.children.length; p++) {
          var c = host.children[p];
          c.dataset.page = String(p + 1);
          c.dataset.drawn = "0";
          if (observer) observer.observe(c);
        }
        // Draw page 1 straight away so the top of the chapter is never blank.
        draw(host.firstElementChild);
      }

      render();
      // The page grid depends on the font's metrics, so re-render once the real
      // face is loaded (and on failure too — then the fallback metrics stand).
      if (document.fonts && document.fonts.load) {
        document.fonts.load(face(FONT)).then(render, render);
      }

      // Theme change: repaint what is already drawn with the new palette; pages
      // not drawn yet pick the new palette up when the observer reaches them.
      document.addEventListener("themechange", function () {
        refreshPalette();
        for (var i = 0; i < host.children.length; i++) {
          var canvas = host.children[i];
          if (canvas.dataset.drawn === "1") paint(canvas, pages[i] || []);
        }
      });
    })();
