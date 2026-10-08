/**
 * Generate the traditional-Chinese variants of the site from the default
 * language content root.
 *
 * The Astro site serves /tw and /hk from OpenCC conversions of the Simplified
 * source (src/lib/opencc.ts + connect-mirror.ts), covering the brand pages and
 * the shelf — not the blog articles (see src/pages/{tw,hk}/). This script
 * reproduces that scope with opencc-js, and converts the UI strings too so
 * i18n/tw.toml and i18n/hk.toml match i18n/zh.toml.
 *
 * Output: content/*.tw.md, content/*.hk.md, i18n/tw.toml, i18n/hk.toml — committed to the
 * generated (git-ignored) and rebuilt by `pnpm variants` before `pnpm build`.
 *
 *   node scripts/build_variants.mjs
 */
import { Converter } from "opencc-js";
import {
	readFileSync,
	writeFileSync,
	unlinkSync,
	readdirSync,
	statSync,
	existsSync,
} from "node:fs";
import { join, relative, sep } from "node:path";

const root = process.cwd();
const contentDir = join(root, "content");
const generatedSuffixes = ["hk", "tw"];

const variants = [
	{ suffix: "tw", to: "twp" }, // 台灣正體（含慣用詞轉換）
	{ suffix: "hk", to: "hk" }, // 香港繁體
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
	let count = 0;
	for (const file of walk(contentDir)) {
		if (file.endsWith(`.${variant.suffix}.md`)) unlinkSync(file);
	}
	for (const file of walk(contentDir)) {
		const rel = relative(contentDir, file);
		if (generatedSuffixes.some((suffix) => rel.endsWith(`.${suffix}.md`))) continue;
		if (rel.endsWith('.en.md')) continue;
		if (!mirrored(rel)) continue;
		const out = join(contentDir, rel.replace(/\.md$/, `.${variant.suffix}.md`));
		writeFileSync(out, convert(readFileSync(file, "utf8")));
		count += 1;
	}

	const zhI18n = readFileSync(join(root, "i18n", "zh.toml"), "utf8");
	writeFileSync(join(root, "i18n", `${variant.suffix}.toml`), convert(zhI18n));

	// Project copy: data/projects/zh.toml → data/projects/<variant>.toml. Same reason
	// as the UI strings — a Traditional page must not fall back to Simplified copy —
	// and the generated file is committed because Cloudflare only runs a bare `hugo`.
	const zhProjects = join(root, "data", "projects", "zh.toml");
	let projectsNote = "";
	if (existsSync(zhProjects)) {
		writeFileSync(
			join(root, "data", "projects", `${variant.suffix}.toml`),
			convert(readFileSync(zhProjects, "utf8")),
		);
		projectsNote = `, data/projects/${variant.suffix}.toml`;
	}

	console.log(
		`content/*.${variant.suffix}.md: ${count} page(s), i18n/${variant.suffix}.toml${projectsNote}`,
	);
	total += count;
}
console.log(`variants: ${total} page(s) generated from the default content root`);
