/**
 * Reading-experience audit: render key pages in a real browser and report what
 * only a browser can tell us — console/page errors, failed requests, broken
 * images, horizontal overflow (with the offending elements), heading outline,
 * typography metrics, WCAG contrast (light and dark) — and write screenshots so a
 * human (or an agent) can look at the result.
 *
 * Uses playwright-core with the Playwright-managed Chromium when present, else a
 * system Chrome/Edge channel, so no browser download is required.
 *
 *   pnpm build                       # or: hugo --destination .audit-site …
 *   python -m http.server 8124 --directory .audit-site --bind 127.0.0.1
 *   node scripts/visual_audit.mjs --base http://127.0.0.1:8124 --out .audit
 */
import { chromium } from "playwright-core";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const args = process.argv.slice(2);
const arg = (name, fallback) => {
	const i = args.indexOf(`--${name}`);
	return i === -1 ? fallback : args[i + 1];
};

const base = arg("base", "http://127.0.0.1:8124").replace(/\/$/, "");
const outDir = arg("out", ".audit");
const viewports = {
	desktop: { width: 1440, height: 900 },
	mobile: { width: 390, height: 844 },
};

// label, path, viewports to shoot, full-page shot?
const pages = [
	["home", "/", ["desktop", "mobile", "dark"], true],
	["blog-index", "/blog/", ["desktop"], false],
	["article-long", "/tech/geo-two-years/", ["desktop", "mobile", "dark"], true],
	["article-callouts", "/tech/tutorials/ai-on-your-computer/", ["desktop", "dark"], false],
	["article-code", "/tech/hugo/diagrams/", ["desktop"], false],
	["ancient", "/ancient/周髀算经/", ["desktop", "mobile"], false],
	["shelf", "/shelf/", ["desktop"], false],
	["novel-landing", "/shelf/sky-tax/", ["desktop", "mobile"], false],
	["novel-chapter", "/shelf/sky-tax-ch01/", ["desktop", "mobile"], false],
	["projects", "/projects/", ["desktop"], false],
	["links", "/links/", ["desktop"], false],
	["about", "/about/", ["desktop"], false],
	["en-home", "/en/", ["desktop"], false],
	["tw-home", "/tw/", ["desktop"], false],
	["not-found", "/404.html", ["desktop"], false],
];

/**
 * Everything measured inside the page. Kept as one standalone function because
 * Playwright serialises it, so it can run for both the light and the dark pass.
 */
function measurePage() {
	const doc = document.documentElement;
	const overflow = doc.scrollWidth - doc.clientWidth;
	const offenders = [];
	if (overflow > 1) {
		for (const el of document.querySelectorAll("body *")) {
			const r = el.getBoundingClientRect();
			if (r.width > 0 && r.right > doc.clientWidth + 1) {
				offenders.push(
					`${el.tagName.toLowerCase()}${el.className ? "." + String(el.className).split(" ").slice(0, 2).join(".") : ""} right=${Math.round(r.right)}`,
				);
				if (offenders.length >= 5) break;
			}
		}
	}

	const brokenImages = [...document.images]
		.filter((i) => i.complete && i.naturalWidth === 0)
		.map((i) => i.getAttribute("src"));

	// Reading column: CJK glyphs are ~1em wide, so width / font-size estimates
	// characters per line.
	const reading = document.querySelector(".prose-content");
	let type = null;
	let measureCh = null;
	let readingWidth = null;
	let headingScale = null;
	if (reading) {
		const cs = getComputedStyle(reading);
		const width = reading.getBoundingClientRect().width;
		const size = parseFloat(cs.fontSize) || 16;
		readingWidth = Math.round(width);
		measureCh = Math.round(width / size);
		type = {
			fontSize: cs.fontSize,
			lineHeight: cs.lineHeight,
			fontFamily: cs.fontFamily.split(",")[0],
		};
		const sizeOf = (sel) => {
			const el = reading.querySelector(sel);
			return el ? Math.round(parseFloat(getComputedStyle(el).fontSize)) : null;
		};
		headingScale = { body: Math.round(size), h2: sizeOf("h2"), h3: sizeOf("h3") };
	}

	// WCAG contrast for the text people actually read. The effective background is
	// composited from ancestor colours, so translucent surfaces are handled rather
	// than assumed.
	//
	// Colours are resolved by painting one pixel and reading it back: Tailwind v4
	// emits oklch(), and both regex parsing and canvas fillStyle normalisation
	// silently mishandled it (the check looked like it passed with zero samples).
	const probe = document.createElement("canvas");
	probe.width = probe.height = 1;
	const probeCtx = probe.getContext("2d", { willReadFrequently: true });
	const parseColor = (value) => {
		probeCtx.clearRect(0, 0, 1, 1);
		probeCtx.fillStyle = "#000000";
		probeCtx.fillStyle = value;
		probeCtx.fillRect(0, 0, 1, 1);
		const d = probeCtx.getImageData(0, 0, 1, 1).data;
		return { r: d[0], g: d[1], b: d[2], a: d[3] / 255 };
	};
	const luminance = ({ r, g, b }) => {
		const f = (v) => {
			const s = v / 255;
			return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
		};
		return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
	};
	const composite = (fg, bg) => ({
		r: fg.r * fg.a + bg.r * (1 - fg.a),
		g: fg.g * fg.a + bg.g * (1 - fg.a),
		b: fg.b * fg.a + bg.b * (1 - fg.a),
		a: 1,
	});
	const effectiveBg = (el) => {
		const stack = [];
		for (let node = el; node; node = node.parentElement) {
			const c = parseColor(getComputedStyle(node).backgroundColor);
			if (c && c.a > 0) {
				stack.push(c);
				if (c.a === 1) break;
			}
		}
		let base = { r: 255, g: 255, b: 255, a: 1 };
		for (const layer of stack.reverse()) base = composite(layer, base);
		return base;
	};
	const ratio = (a, b) => {
		const l1 = luminance(a);
		const l2 = luminance(b);
		return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
	};
	const targets = [
		[".prose-content p", "body text"],
		[".prose-content h2", "article h2"],
		[".prose-content a", "article link"],
		[".prose-header time", "article meta"],
		["header nav a", "nav link"],
		["#logo a", "site name"],
		[".toc summary", "TOC summary"],
		["#TableOfContents a", "TOC link"],
		[".callout-title", "callout title"],
		[".callout-body p", "callout body"],
		["footer p", "footer text"],
		// These two were the sampling gap the design review found: the eyebrow badge
		// was 4.12:1 and nothing measured it.
		[".bg-rose-50", "eyebrow badge"],
		["nav .text-gray-400", "breadcrumb separator"],
	];
	const contrastSamples = [];
	for (const [selector, role] of targets) {
		const el = document.querySelector(selector);
		if (!el) continue;
		const cs = getComputedStyle(el);
		const fg = parseColor(cs.color);
		if (!fg || fg.a === 0) continue;
		const bg = effectiveBg(el);
		const r = Math.round(ratio(composite(fg, bg), bg) * 100) / 100;
		const size = parseFloat(cs.fontSize);
		const weight = parseInt(cs.fontWeight, 10) || 400;
		const large = size >= 24 || (size >= 18.66 && weight >= 700);
		contrastSamples.push({
			role,
			selector,
			color: cs.color,
			bg: `rgb(${Math.round(bg.r)}, ${Math.round(bg.g)}, ${Math.round(bg.b)})`,
			ratio: r,
			size: Math.round(size),
			required: large ? 3 : 4.5,
			passes: r >= (large ? 3 : 4.5),
		});
	}

	const headings = [...document.querySelectorAll("h1,h2,h3")].map(
		(h) => `${h.tagName}:${h.textContent.trim().slice(0, 28)}`,
	);

	return {
		title: document.title,
		overflow,
		offenders,
		brokenImages,
		h1Count: document.querySelectorAll("h1").length,
		headings: headings.slice(0, 6),
		type,
		measureCh,
		readingWidth,
		headingScale,
		contrastSamples,
		bodyBg: getComputedStyle(document.body).backgroundColor,
	};
}

mkdirSync(outDir, { recursive: true });

async function launch() {
	try {
		return await chromium.launch();
	} catch (error) {
		console.log(`managed chromium unavailable (${error.message.split("\n")[0]}), trying system Chrome`);
		return await chromium.launch({ channel: "chrome" });
	}
}

const browser = await launch();
const findings = [];
const notes = [];
const contrastFailures = [];
const seenContrast = new Set();

function checkContrast(label, mode, metrics) {
	for (const c of metrics.contrastSamples) {
		if (c.passes) continue;
		const key = `${c.role}|${c.color}|${c.bg}`;
		if (seenContrast.has(key)) continue;
		seenContrast.add(key);
		const line = `${label} [${mode}]: contrast ${c.ratio} < ${c.required} — ${c.role} (${c.color} on ${c.bg}, ${c.size}px)`;
		findings.push(line);
		contrastFailures.push(line);
	}
}

for (const [label, path, shots, fullPage] of pages) {
	const viewport = viewports[shots.includes("mobile") ? "mobile" : "desktop"];
	const context = await browser.newContext({ viewport, deviceScaleFactor: 1 });
	const page = await context.newPage();

	const consoleErrors = [];
	page.on("console", (m) => {
		if (m.type() === "error") consoleErrors.push(m.text().slice(0, 200));
	});
	page.on("pageerror", (e) => consoleErrors.push(`pageerror: ${e.message.slice(0, 200)}`));
	page.on("response", (r) => {
		if (r.status() >= 400) consoleErrors.push(`${r.status()} ${r.url()}`);
	});

	const response = await page.goto(`${base}${encodeURI(path)}`, { waitUntil: "load", timeout: 30000 });
	await page.waitForTimeout(150);
	const status = response ? response.status() : 0;
	if (status >= 400) findings.push(`${label}: HTTP ${status}`);

	const metrics = await page.evaluate(measurePage);

	for (const e of consoleErrors) findings.push(`${label}: console/network — ${e}`);
	for (const img of metrics.brokenImages) findings.push(`${label}: broken image — ${img}`);
	if (metrics.overflow > 1) {
		findings.push(`${label}: horizontal overflow ${metrics.overflow}px — ${metrics.offenders.join(" | ")}`);
	}
	if (metrics.h1Count !== 1) findings.push(`${label}: ${metrics.h1Count} <h1> element(s)`);
	checkContrast(label, "light", metrics);

	const primary = shots.includes("mobile") ? "mobile" : "desktop";
	const requested = ["desktop", "mobile"].filter((v) => shots.includes(v));
	for (const name of requested) {
		// Always set the viewport, including for the primary one: the previous
		// version only set it for the secondary name, so every "<page>-mobile.png"
		// for a page listed with both viewports was really a 1440px desktop shot.
		await page.setViewportSize(viewports[name]);
		await page.waitForTimeout(220);
		await page.screenshot({ path: join(outDir, `${label}-${name}.png`), fullPage: false });
		if (fullPage && name === primary) {
			await page.screenshot({ path: join(outDir, `${label}-${name}-full.png`), fullPage: true });
		}
	}

	// WCAG 1.4.10 (Reflow): a page must not need horizontal scrolling at 320 CSS px.
	// This is what a 3-column table in an article broke at 360px.
	for (const width of [320, 360]) {
		await page.setViewportSize({ width, height: 740 });
		await page.waitForTimeout(200);
		const reflow = await page.evaluate(measurePage);
		if (reflow.overflow > 1) {
			findings.push(`${label}: reflow overflow at ${width}px — ${reflow.overflow}px (${reflow.offenders.join(" | ")})`);
		}
	}

	await page.setViewportSize(viewports[primary]);
	await page.waitForTimeout(150);

	if (shots.includes("dark")) {
		await page.evaluate(() => localStorage.setItem("theme", "dark"));
		await page.reload({ waitUntil: "load" });
		await page.waitForTimeout(150);
		const dark = await page.evaluate(measurePage);
		const isDark = await page.evaluate(() => document.documentElement.classList.contains("dark"));
		if (!isDark) findings.push(`${label}: dark mode not applied from localStorage`);
		checkContrast(label, "dark", dark);
		await page.screenshot({ path: join(outDir, `${label}-dark-${primary}.png`), fullPage: false });
		notes.push(
			`${label}: light bg ${metrics.bodyBg ?? "n/a"} / dark bg ${await page.evaluate(() => getComputedStyle(document.body).backgroundColor)}`,
		);
	}

	if (metrics.type) {
		const s = metrics.headingScale;
		notes.push(
			`${label} [${primary}]: ${metrics.type.fontSize}/${metrics.type.lineHeight} ${metrics.type.fontFamily}, measure ≈ ${metrics.measureCh} chars/line, headings body/h2/h3 = ${s.body}/${s.h2}/${s.h3}`,
		);
	}
	const contrastPassing = metrics.contrastSamples.filter((c) => c.passes).length;
	notes.push(`${label} [${primary}]: contrast ${contrastPassing}/${metrics.contrastSamples.length} samples pass AA (light)`);

	await context.close();
}

await browser.close();

const report = {
	base,
	generated: new Date().toISOString(),
	summary: {
		pages: pages.length,
		findings: findings.length,
		contrastFailures: contrastFailures.length,
	},
	findings,
	contrastFailures,
	notes,
};
writeFileSync(join(outDir, "report.json"), JSON.stringify(report, null, 1));
writeFileSync(
	join(outDir, "report.md"),
	[
		"# Visual / reading-experience audit",
		"",
		`base: ${base}`,
		`findings: ${findings.length} (${contrastFailures.length} contrast)`,
		"",
		"## Findings",
		"",
		...(findings.length ? findings.map((f) => `- ${f}`) : ["- none"]),
		"",
		"## Notes",
		"",
		...notes.map((n) => `- ${n}`),
		"",
	].join("\n"),
);

console.log(`\nscreenshots + report -> ${outDir}`);
console.log(findings.length ? `FINDINGS (${findings.length}):` : "no findings");
for (const f of findings) console.log("  - " + f);
console.log("\nnotes:");
for (const n of notes) console.log("  · " + n);
