/**
 * Build the lunar-calendar lookup used by 古文 pages.
 *
 * The Astro site computes this at render time with lunar-javascript
 * (src/layouts/AncientPostLayout.astro: `Solar.fromYmd(y, m, d).getLunar()`);
 * Hugo templates cannot call a JavaScript library, so the mapping is generated
 * here as a Hugo data file (`site.Data.lunar`) — one entry per content date,
 * keyed by the Asia/Shanghai calendar date.
 *
 *   node scripts/build_lunar.mjs
 *
 * Output: data/lunar.json — generated, git-ignored, produced by `pnpm lunar`
 * before `pnpm build`.
 */
import { Solar } from "lunar-javascript";
import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

const root = process.cwd();
const contentDir = join(root, "content");
// Hugo content lives in content/<lang>/...; generated variants included on purpose.
const DATE_RE = /^date\s*=\s*'([^']+)'/m;

function* walk(dir) {
	for (const entry of readdirSync(dir)) {
		const full = join(dir, entry);
		if (statSync(full).isDirectory()) yield* walk(full);
		else if (full.endsWith(".md")) yield full;
	}
}

/** Asia/Shanghai calendar date (lunar conversion is local to the timezone). */
function shanghaiYmd(iso) {
	const date = new Date(iso);
	if (Number.isNaN(date.getTime())) return null;
	const text = new Intl.DateTimeFormat("en-CA", {
		timeZone: "Asia/Shanghai",
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	}).format(date);
	const [year, month, day] = text.split("-").map(Number);
	return { year, month, day, key: text };
}

const lunar = {};
let scanned = 0;
let dated = 0;

for (const file of walk(contentDir)) {
	scanned += 1;
	const text = readFileSync(file, "utf8");
	const fmEnd = text.indexOf("+++", 3);
	const frontMatter = fmEnd === -1 ? text : text.slice(0, fmEnd);
	const match = frontMatter.match(DATE_RE);
	if (!match) continue;
	dated += 1;
	const ymd = shanghaiYmd(match[1]);
	if (!ymd) continue;
	if (!lunar[ymd.key]) {
		lunar[ymd.key] = Solar.fromYmd(ymd.year, ymd.month, ymd.day)
			.getLunar()
			.toString();
	}
}

// Self-check against dates whose lunar equivalent is well known: 2026-02-17 is
// Chinese New Year (正月初一) and 2025-01-29 is the previous one.
const checks = [
	["2026-02-17", "正月初一"],
	["2025-01-29", "正月初一"],
];
for (const [key, expect] of checks) {
	const value = lunar[key] ?? Solar.fromYmd(
		...key.split("-").map(Number),
	).getLunar().toString();
	if (!value.endsWith(expect)) {
		throw new Error(`lunar self-check failed for ${key}: got "${value}", expected to end with "${expect}"`);
	}
}

const outDir = join(root, "data");
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, "lunar.json"), JSON.stringify(lunar, null, 1) + "\n");
console.log(
	`data/lunar.json: ${Object.keys(lunar).length} lunar date(s) from ${dated}/${scanned} content file(s); self-check OK`,
);
