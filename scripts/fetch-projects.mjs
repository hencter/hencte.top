/**
 * Refresh the GitHub-side facts behind the site's project pages.
 *
 * Why not `resources.GetRemote` at build time (all measured on Hugo 0.167):
 *   - anonymous api.github.com allows 60 requests/hour per IP, and Cloudflare
 *     build IPs are shared; authenticated is 5000/h but needs a token plus
 *     `[security.funcs] getenv`, which the panel build cannot rely on;
 *   - `pnpm build` passes --ignoreCache, and that forces a real API call on
 *     every build (measured: rate-limit "remaining" only drops with the flag);
 *   - a failed fetch returns nil AND leaves `.Err` empty, so a page silently
 *     loses its content while the build stays green (--panicOnWarning does not
 *     catch it, it only escalates WARN).
 * The house convention is the other way round: generate before `hugo`, commit
 * the artifact, and keep the build offline and deterministic — same as
 * `pnpm variants` (OpenCC) and `pnpm css` (Tailwind).
 *
 * This writes only GitHub-side, language-independent facts:
 *   data/projects/live.json
 * The curated copy (title / description / result / image …) lives per language
 * in data/projects/<lang>.toml and is NOT generated here.
 *
 *   node scripts/fetch-projects.mjs             # refresh + report
 *   node scripts/fetch-projects.mjs --check     # no write, exit 1 if it would change
 *   node scripts/fetch-projects.mjs --input f.json   # use a pre-fetched gh payload
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const OWNER = "hencter";
const OUT = join("data", "projects", "live.json");
const FIELDS = [
	"name",
	"nameWithOwner",
	"description",
	"url",
	"homepageUrl",
	"createdAt",
	"pushedAt",
	"isArchived",
	"isFork",
	"isPrivate",
	"isTemplate",
	"isEmpty",
	"primaryLanguage",
	"repositoryTopics",
	"stargazerCount",
	"forkCount",
	"licenseInfo",
	"diskUsage",
].join(",");

/** Curated pages that reference repositories, scanned for repo names. */
const SOURCES = [
	join("content", "zh", "projects.md"),
	join("content", "zh", "_index.md"),
	join("content", "en", "projects.md"),
	join("content", "en", "_index.md"),
];

/**
 * Projects shown on their own domain. Until the curated data carries an
 * explicit `repo`, map the domain to its repository here. `null` = the repo is
 * private, so it can never appear in live.json (which is public).
 */
const DOMAIN_REPOS = {
	"https://hugozh.cn/": "hugozh",
	"https://workersledger.cn/": "workers-ledger",
	"https://ai.linktrust.top": null,
	"https://tongtianlu.cn": null,
};

const args = process.argv.slice(2);
const check = args.includes("--check");
const inputAt = args.indexOf("--input");
const inputFile = inputAt >= 0 ? args[inputAt + 1] : null;

function ghRepos() {
	if (inputFile) return JSON.parse(readFileSync(inputFile, "utf8"));
	try {
		return JSON.parse(
			execFileSync(
				"gh",
				["repo", "list", OWNER, "--limit", "300", "--json", FIELDS],
				{ encoding: "utf8", maxBuffer: 64 * 1024 * 1024 },
			),
		);
	} catch (error) {
		console.error(
			`无法读取 ${OWNER} 的仓库列表：${error.message}\n` +
				`请确认已安装并登录 gh（gh auth status），或用 --input <gh-repo-list.json> 传入。`,
		);
		process.exit(2);
	}
}

const day = (iso) => (typeof iso === "string" ? iso.slice(0, 10) : "");
const lang = (value) =>
	typeof value === "string" ? value : (value?.name ?? "");
const spdx = (value) => value?.spdxId ?? value?.key ?? "";

function buildLive(raw) {
	const repos = {};
	for (const r of raw) {
		// live.json is committed to a public repo: never leak private repos, and
		// forks are not "projects" — the site only ever lists sources.
		if (r.isPrivate || r.isFork) continue;
		repos[r.name.toLowerCase()] = {
			fullName: r.nameWithOwner,
			url: r.url,
			homepageUrl: r.homepageUrl ?? "",
			description: r.description ?? "",
			stars: r.stargazerCount ?? 0,
			forks: r.forkCount ?? 0,
			language: lang(r.primaryLanguage),
			topics: (r.repositoryTopics ?? []).map((t) => t.name).sort(),
			createdAt: r.createdAt ?? "",
			pushedAt: r.pushedAt ?? "",
			pushedOn: day(r.pushedAt),
			archived: Boolean(r.isArchived),
			template: Boolean(r.isTemplate),
			empty: Boolean(r.isEmpty),
			license: spdx(r.licenseInfo),
			diskUsageKB: r.diskUsage ?? 0,
		};
	}
	// Deterministic key order → a real diff every time something changes.
	const sorted = {};
	for (const key of Object.keys(repos).sort()) sorted[key] = repos[key];
	return sorted;
}

function siteRefs() {
	const refs = new Map(); // repo name (lowercase) → where it is referenced
	for (const file of SOURCES) {
		if (!existsSync(file)) continue;
		const text = readFileSync(file, "utf8");
		for (const m of text.matchAll(/github\.com\/hencter\/([A-Za-z0-9._-]+)/g))
			refs.set(m[1].toLowerCase(), m[1]);
		for (const m of text.matchAll(/hencter\.github\.io\/([A-Za-z0-9._-]+)/g))
			refs.set(m[1].toLowerCase(), m[1]);
		for (const [domain, repo] of Object.entries(DOMAIN_REPOS)) {
			if (text.includes(domain) && repo) refs.set(repo.toLowerCase(), repo);
		}
	}
	return refs;
}

function report(repos, refs) {
	const missing = [];
	const archived = [];
	const unlicensed = [];
	for (const [key, label] of refs) {
		const r = repos[key];
		if (!r) {
			missing.push(label);
			continue;
		}
		if (r.archived) archived.push(label);
		if (!r.license || r.license === "NOASSERTION") unlicensed.push(label);
	}
	const onSite = new Set(refs.keys());
	const offSite = Object.entries(repos)
		.filter(([key, r]) => !onSite.has(key) && !r.archived)
		.sort((a, b) => (a[1].createdAt < b[1].createdAt ? 1 : -1));

	console.log(
		`站点引用的仓库 ${refs.size} 个：${refs.size - missing.length} 命中` +
			`${archived.length ? `，${archived.length} 已归档` : ""}` +
			`${missing.length ? `，${missing.length} 查不到（${missing.join(", ")}）` : ""}`,
	);
	if (archived.length) console.log(`  已归档（建议从站点撤下）：${archived.join(", ")}`);
	if (unlicensed.length)
		console.log(
			`  无许可证或 GitHub 识别不出（${unlicensed.length}）：${unlicensed.join(", ")}`,
		);
	console.log(
		`公开非 fork 仓库 ${Object.keys(repos).length} 个，其中未上站 ${offSite.length} 个：`,
	);
	for (const [, r] of offSite.slice(0, 12))
		console.log(`  ${day(r.createdAt)}  ${r.fullName.replace(`${OWNER}/`, "")}  ${r.description.slice(0, 46)}`);
}

function diffPayload(before, after) {
	const changes = [];
	for (const key of new Set([...Object.keys(before), ...Object.keys(after)])) {
		if (!before[key]) changes.push(`+ ${after[key].fullName}`);
		else if (!after[key]) changes.push(`- ${before[key].fullName}`);
		else if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) {
			const fields = Object.keys(after[key]).filter(
				(f) => JSON.stringify(before[key][f]) !== JSON.stringify(after[key][f]),
			);
			changes.push(`~ ${after[key].fullName}: ${fields.join(", ")}`);
		}
	}
	return changes.sort();
}

const raw = ghRepos();
const repos = buildLive(raw);
const refs = siteRefs();
const previous = existsSync(OUT) ? JSON.parse(readFileSync(OUT, "utf8")) : null;
const payload = {
	$comment:
		"由 scripts/fetch-projects.mjs 生成：只含 GitHub 侧客观字段（公开、非 fork）。" +
		"站点文案在 data/projects/<lang>.toml，手改不会被本脚本覆盖。",
	generatedAt: new Date().toISOString(),
	source: inputFile ? `gh repo list ${OWNER}（来自 ${inputFile}）` : `gh repo list ${OWNER} --limit 300`,
	owner: OWNER,
	repos,
};

if (check) {
	const changes = diffPayload(previous?.repos ?? {}, repos);
	if (!previous) {
		console.error(`${OUT} 不存在 —— 先跑一次 node scripts/fetch-projects.mjs`);
		process.exit(1);
	}
	if (changes.length) {
		console.error(`${OUT} 与 GitHub 不一致（${changes.length} 处）：`);
		for (const line of changes) console.error(`  ${line}`);
		process.exit(1);
	}
	console.log(`${OUT} 与 GitHub 一致（${Object.keys(repos).length} 个公开仓库）`);
} else {
	const changes = diffPayload(previous?.repos ?? {}, repos);
	mkdirSync(join("data", "projects"), { recursive: true });
	writeFileSync(OUT, `${JSON.stringify(payload, null, 2)}\n`);
	console.log(
		`${OUT}: ${Object.keys(repos).length} 个公开仓库` +
			(previous ? `（${changes.length} 处变化）` : "（首次生成）"),
	);
	for (const line of changes) console.log(`  ${line}`);
}

report(repos, refs);
