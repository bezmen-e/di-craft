import fs from "node:fs";
import path from "node:path";

const outputDirectory = path.resolve(process.argv[2] ?? "../.var/dist/docs");
const siteOrigin = "https://di-craft.pages.dev";
const issues = [];
let checkedReferences = 0;

const collectHtmlFiles = (directory) =>
	fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
		const entryPath = path.join(directory, entry.name);
		return entry.isDirectory()
			? collectHtmlFiles(entryPath)
			: entry.name.endsWith(".html")
				? [entryPath]
				: [];
	});

const readAttribute = (html, pattern) => html.match(pattern)?.[1];
const decodeHtmlAttribute = (value) =>
	value
		.replace(/&amp;/g, "&")
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'");

const pageUrlFor = (file) => {
	const relativePath = path
		.relative(outputDirectory, file)
		.split(path.sep)
		.join("/");
	const pathname = relativePath.endsWith("/index.html")
		? `/${relativePath.slice(0, -"index.html".length)}`
		: relativePath === "index.html"
			? "/"
			: `/${relativePath}`;

	return new URL(pathname, siteOrigin);
};

const outputPathFor = (pathname) => {
	const decodedPath = decodeURIComponent(pathname);
	const relativePath = decodedPath.replace(/^\/+/, "");
	if (relativePath.length === 0)
		return path.join(outputDirectory, "index.html");

	const directPath = path.join(outputDirectory, relativePath);
	if (fs.existsSync(directPath) && fs.statSync(directPath).isFile()) {
		return directPath;
	}

	return path.join(directPath, "index.html");
};

const hasFragment = (file, fragment) => {
	if (!file.endsWith(".html")) return false;
	const decodedFragment = decodeURIComponent(fragment);
	const html = fs.readFileSync(file, "utf8");
	return [...html.matchAll(/\sid=["']([^"']+)["']/gi)].some(
		(match) => match[1] === decodedFragment,
	);
};

const htmlFiles = collectHtmlFiles(outputDirectory);
const pages = htmlFiles.map((file) => {
	const html = fs.readFileSync(file, "utf8");
	return {
		file: path.relative(outputDirectory, file),
		filePath: file,
		html,
		title: readAttribute(html, /<title>([^<]+)<\/title>/i),
		description: readAttribute(
			html,
			/<meta name="description" content="([^"]+)"/i,
		),
		canonical: readAttribute(html, /<link rel="canonical" href="([^"]+)"/i),
		ogImage: readAttribute(
			html,
			/<meta property="og:image" content="([^"]+)"/i,
		),
		twitterImage: readAttribute(
			html,
			/<meta name="twitter:image" content="([^"]+)"/i,
		),
		headings: [...html.matchAll(/<h([1-6])(?:\s|>)/gi)].map((match) =>
			Number(match[1]),
		),
	};
});

const requireField = (field) => {
	for (const page of pages) {
		if (!page[field]) issues.push(`${page.file}: missing ${field}`);
	}
};

for (const field of [
	"title",
	"description",
	"canonical",
	"ogImage",
	"twitterImage",
]) {
	requireField(field);
}

for (const page of pages) {
	const h1Count = page.headings.filter((level) => level === 1).length;
	if (h1Count !== 1)
		issues.push(`${page.file}: expected one h1, found ${h1Count}`);

	for (let index = 1; index < page.headings.length; index += 1) {
		if (page.headings[index] > page.headings[index - 1] + 1) {
			issues.push(`${page.file}: heading hierarchy skips a level`);
			break;
		}
	}
}

for (const field of ["title", "description", "canonical"]) {
	const values = new Map();
	for (const page of pages) {
		if (!page[field]) continue;
		const files = values.get(page[field]) ?? [];
		files.push(page.file);
		values.set(page[field], files);
	}

	for (const [value, files] of values) {
		if (files.length > 1) {
			issues.push(
				`duplicate ${field} ${JSON.stringify(value)}: ${files.join(", ")}`,
			);
		}
	}
}

for (const requiredFile of ["robots.txt", "sitemap-index.xml"]) {
	if (!fs.existsSync(path.join(outputDirectory, requiredFile))) {
		issues.push(`missing ${requiredFile}`);
	}
}

for (const page of pages) {
	if (page.file === "404.html") continue;

	const pageUrl = pageUrlFor(page.filePath);
	const references = [
		...page.html.matchAll(/<(?:a|link)\b[^>]*\bhref=["']([^"']+)["']/gi),
		...page.html.matchAll(/<(?:img|script)\b[^>]*\bsrc=["']([^"']+)["']/gi),
	].map((match) => decodeHtmlAttribute(match[1]));

	for (const reference of references) {
		if (
			reference.length === 0 ||
			/^(?:data|javascript|mailto|tel):/i.test(reference)
		) {
			continue;
		}

		let targetUrl;
		try {
			targetUrl = new URL(reference, pageUrl);
		} catch {
			issues.push(`${page.file}: invalid URL ${JSON.stringify(reference)}`);
			continue;
		}

		if (targetUrl.origin !== siteOrigin) continue;
		checkedReferences += 1;

		let targetFile;
		try {
			targetFile = outputPathFor(targetUrl.pathname);
		} catch {
			issues.push(`${page.file}: invalid path ${JSON.stringify(reference)}`);
			continue;
		}

		if (!fs.existsSync(targetFile)) {
			issues.push(`${page.file}: missing target ${JSON.stringify(reference)}`);
			continue;
		}

		if (
			targetUrl.hash.length > 1 &&
			!hasFragment(targetFile, targetUrl.hash.slice(1))
		) {
			issues.push(
				`${page.file}: missing fragment ${JSON.stringify(reference)}`,
			);
		}
	}
}

if (issues.length > 0) {
	console.error(
		`Site check failed:\n${issues.map((issue) => `- ${issue}`).join("\n")}`,
	);
	process.exitCode = 1;
} else {
	console.log(
		`Site check passed (${pages.length} HTML pages, ${checkedReferences} internal references).`,
	);
}
