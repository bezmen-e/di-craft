import fs from "node:fs";
import path from "node:path";

const outputDirectory = path.resolve(process.argv[2] ?? "../.var/dist/docs");
const issues = [];

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
const htmlFiles = collectHtmlFiles(outputDirectory);
const pages = htmlFiles.map((file) => {
	const html = fs.readFileSync(file, "utf8");
	return {
		file: path.relative(outputDirectory, file),
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

if (issues.length > 0) {
	console.error(
		`SEO check failed:\n${issues.map((issue) => `- ${issue}`).join("\n")}`,
	);
	process.exitCode = 1;
} else {
	console.log(`SEO check passed (${pages.length} HTML pages).`);
}
