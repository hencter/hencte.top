/**
 * Generate the traditional-Chinese variants of the site from content/zh.
 *
 * The Astro site serves /tw and /hk from OpenCC conversions of the Simplified
 * source (src/lib/opencc.ts + connect-mirror.ts), covering the brand pages and
 * the shelf — not the blog articles (see src/pages/{tw,hk}/). This script
 * reproduces that scope with opencc-js, and converts the UI strings too so
 * i18n/tw.toml and i18n/hk.toml match i18n/zh.toml.
 *
 * Output: content/tw/**, content/hk/**, i18n/tw.toml, i18n/hk.toml — all
 * generated (git-ignored) and rebuilt by `pnpm variants` before `pnpm build`.
 *
 *   node scripts/build_variants.mjs
 */
import { Converter } from "opencc-js";
import {
	readFileSync,
	writeFileSync,
	mkdirSync,
	rmSync,
	readdirSync,
	statSync,
} from "node:fs";
import { join, relative, dirname, sep } from "node:path";

const root = process.cwd();
const zhDir = join(root, "content", "zh");

const variants = [
	{ dir: "tw", to: "twp" }, // 台灣正體（含慣用詞轉換）
	{ dir: "hk", to: "hk" }, // 香港繁體
];

/** Mirrored paths — the same shape the Astro site generates for /tw and /hk. */
const mirrored = (rel) =>
	/^(_index|about|projects|links|blog)\.md$/.test(rel) ||
	rel === "shelf" ||
	rel.startsWith(`shelf${sep}`);

function* walk(dir) {
	for (const entry of readdirSync(dir)) {
		const full = join(dir, entry);
		if (statSync(full).isDirectory()) yield* walk(full);
		else yield full;
	}
}

let total = 0;
for (const variant of variants) {
	const convert = Converter({ from: "cn", to: variant.to });
	const outDir = join(root, "content", variant.dir);
	rmSync(outDir, { recursive: true, force: true });

	let count = 0;
	for (const file of walk(zhDir)) {
		const rel = relative(zhDir, file);
		if (!mirrored(rel)) continue;
		const out = join(outDir, rel);
		mkdirSync(dirname(out), { recursive: true });
		writeFileSync(out, convert(readFileSync(file, "utf8")));
		count += 1;
	}

	// Keep the directory in the tree so a bare `hugo` run does not fail on a
	// missing contentDir (the .md files themselves are generated).
	writeFileSync(join(outDir, ".gitkeep"), "");

	const zhI18n = readFileSync(join(root, "i18n", "zh.toml"), "utf8");
	writeFileSync(join(root, "i18n", `${variant.dir}.toml`), convert(zhI18n));

	console.log(`content/${variant.dir}: ${count} page(s), i18n/${variant.dir}.toml`);
	total += count;
}
console.log(`variants: ${total} page(s) generated from content/zh`);
